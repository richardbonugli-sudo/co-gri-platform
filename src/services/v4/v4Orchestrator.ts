/**
 * V.4 Orchestrator - Main Entry Point
 * 
 * Implements the complete V.4 decision tree for geographic exposure allocation.
 * PRIORITY 1 FIX: Channel-specific evidence extraction with proper segment label preservation
 * PHASE 1 FIX - Task 2: Integrated RF-B for supply chain with membership signal detection
 */

import {
  Channel,
  EvidenceBundle,
  AllocationResult,
  EntityKind,
  DecisionTrace,
  FallbackType,
  NarrativeMentions,
  SimpleNarrative,
  NarrativeDefinition,
  resolveItemLabel,
  resolveItemSourceRef
} from '@/types/v4Types';

// ============================================================================
// Narrative normalizer — coerces SimpleNarrative → NarrativeMentions so that
// all downstream code can safely access .namedCountries, .geoLabels, etc.
// ============================================================================
function normalizeNarrative(
  narrative: NarrativeMentions | SimpleNarrative
): NarrativeMentions {
  // Already a full NarrativeMentions if it has namedCountries
  if ('namedCountries' in narrative) {
    return narrative as NarrativeMentions;
  }

  // SimpleNarrative → NarrativeMentions
  const simple = narrative as SimpleNarrative;

  // Convert definitions: Map<string, string | NarrativeDefinition> → Map<string, NarrativeDefinition>
  const fullDefs = new Map<string, NarrativeDefinition>();
  if (simple.definitions instanceof Map) {
    for (const [key, val] of simple.definitions.entries()) {
      if (typeof val === 'string') {
        fullDefs.set(key, {
          label: key,
          includes: val.split(',').map(s => s.trim()).filter(Boolean),
          excludes: [],
          residualOf: null,
          confidence: 0.8,
          sourceRef: 'narrative'
        });
      } else {
        fullDefs.set(key, val as NarrativeDefinition);
      }
    }
  }

  return {
    namedCountries: new Set<string>(),
    geoLabels: new Set<string>(),
    nonStandardLabels: new Set<string>(),
    currencyLabels: new Set<string>(),
    definitions: fullDefs,
    rawSentences: simple.raw ? [simple.raw] : []
  };
}

import { 
  canonicalizeLabel, 
  classifyEntityKind, 
  resolveMembershipForLabel,
  GLOBAL_COUNTRIES 
} from './labelResolution';

import {
  isClosedTotal,
  validateClosedTotal,
  labelHasClosedAllocatableTotal,
  findClosedTotalLabels
} from './closedTotalValidation';

import {
  buildRestrictedSetP,
  exposurePlausiblyWorldwide
} from './restrictedSetBuilder';

import {
  applySSF,
  applyRF,
  applyGF,
  normalizeCountryWeights,
  mergeAdd,
  removeAndRenormalize
} from './allocators';

import { decideRFCase_V4 } from './rfTaxonomy';

// PHASE 1 FIX - Task 2: Import supply chain RF-B logic
import {
  calculateSupplyChainExposure,
  extractSupplyCountriesFromNarrative,
  type MembershipSignals
} from '../supplyChainFallback';

// GAP 3 FIX: Import V5 channel priors for joint allocation solver
import { allocateWithPrior, type ChannelType } from '../v5/channelPriors';
import { GLOBAL_COUNTRIES as _GLOBAL_COUNTRIES } from './labelResolution';

/**
 * Main orchestrator function - allocates a single channel
 * PHASE 1 FIX - Task 2: Enhanced supply chain handling with RF-B
 */
export function allocateChannel_V4(
  bundle: EvidenceBundle,
  ticker: string = ''
): AllocationResult {
  
  // Normalize narrative to full NarrativeMentions shape so all downstream
  // code can safely access .namedCountries, .geoLabels, .rawSentences, etc.
  const normalizedBundle: EvidenceBundle = {
    ...bundle,
    narrative: normalizeNarrative(bundle.narrative),
    homeCountry: bundle.homeCountry ?? '',
    supplementaryMembershipHints: bundle.supplementaryMembershipHints ?? {
      namedCountries: new Set(),
      geoLabels: new Set(),
      nonStandardLabels: new Set(),
      currencyLabels: new Set(),
      definitions: new Map(),
      rawSentences: []
    }
  };
  // Use the normalized bundle for all downstream processing
  bundle = normalizedBundle;

  const trace: DecisionTrace = {
    channel: bundle.channel,
    stepLog: [],
    directAlloc: new Map(),
    labelAllocations: [],
    fallbackUsed: 'none'
  };
  
  trace.stepLog.push(`[V.4 Orchestrator] Starting allocation for ${bundle.channel} channel`);
  trace.stepLog.push(`[V.4 Orchestrator] Ticker: ${ticker}, Sector: ${bundle.sector}, Home: ${bundle.homeCountry}`);
  
  // PHASE 1 FIX - Task 2: Special handling for supply chain channel
  if (bundle.channel === Channel.SUPPLY) {
    trace.stepLog.push(`[V.4 Orchestrator] Supply chain channel detected - checking for RF-B trigger`);
    return allocateSupplyChainWithRFB(bundle, ticker, trace);
  }
  
  // Step 1: Allocate direct country evidence
  const directAlloc = allocateDirectCountries(bundle, trace);
  trace.directAlloc = directAlloc;

  // PRIORITY 1 FIX: Detect and stamp unit mode from structured items
  const unitModes = new Set(bundle.structuredItems.map(i => i.unit).filter(Boolean));
  if (unitModes.size === 1) {
    trace.unitMode = unitModes.has('abs') ? 'abs' : unitModes.has('pct') ? 'pct' : 'mixed';
  } else if (unitModes.size > 1) {
    trace.unitMode = 'mixed';
  }

  // Step 2: Find labels with closed totals
  // findClosedTotalLabels returns a Set<string>; convert to Array so .length and
  // typed string[] parameters work correctly throughout the orchestrator.
  const closedTotalLabels = Array.from(
    findClosedTotalLabels(bundle.structuredItems, bundle.narrative.definitions)
  );
  trace.stepLog.push(`[V.4 Orchestrator] Found ${closedTotalLabels.length} closed-total labels`);

  // ── NO-CLOSED-TOTALS PATH ──────────────────────────────────────────────────
  // When there are no structured items with closed totals, the joint solver
  // would return an empty map. Instead, apply the RF/GF fallback at the
  // channel level and record a single LabelAllocation entry so that tests
  // (and downstream consumers) can inspect trace.labelAllocations.
  if (closedTotalLabels.length === 0 && directAlloc.size === 0) {
    const rfCase = decideRFCase_V4(bundle);
    trace.stepLog.push(`[V.4 Orchestrator] No closed totals — channel-level fallback: ${rfCase}`);

    let fallbackWeights: Map<string, number>;
    let fallbackUsed: FallbackType;

    const RF_CASES: FallbackType[] = [
      FallbackType.RF_A,
      FallbackType.RF_B,
      FallbackType.RF_C,
      FallbackType.RF_D
    ];

    if (RF_CASES.includes(rfCase)) {
      // Build restricted set P using all named countries from narrative as hints,
      // with no pre-allocated countries to exclude.
      const { P: restrictedSet } = buildRestrictedSetP(
        bundle,
        new Set<string>(),                       // no direct-allocated countries yet
        bundle.narrative.namedCountries          // extra label hints from narrative
      );
      fallbackWeights = applyRF(restrictedSet, 1.0, bundle.sector, bundle.channel);
      fallbackUsed = rfCase;
    } else {
      // GF — no membership evidence at all
      fallbackWeights = applyGF(1.0, bundle.sector, bundle.channel);
      fallbackUsed = FallbackType.GF;
    }

    trace.fallbackUsed = fallbackUsed;
    trace.labelAllocations.push({
      label: '(channel_total)',
      labelTotal: 1.0,
      labelUnit: 'normalized',
      fallbackUsed,
      membershipSet: new Set(fallbackWeights.keys()),
      restrictedSetP: new Set(fallbackWeights.keys()),
      exclusionsApplied: new Set(),
      outputCountries: new Map(fallbackWeights),
      reason: `Channel-level ${fallbackUsed} — no closed totals`
    });

    const normalizedFallback = normalizeCountryWeights(fallbackWeights);
    trace.preNormalizeSum = Array.from(fallbackWeights.values()).reduce((s, v) => s + v, 0);
    trace.postNormalizeSum = Array.from(normalizedFallback.values()).reduce((s, v) => s + v, 0);
    return { weights: normalizedFallback, allocation: normalizedFallback, trace };
  }
  // ── END NO-CLOSED-TOTALS PATH ──────────────────────────────────────────────

  // GAP 3 FIX: Joint allocation solver replaces the label-by-label mergeAdd loop.
  // The old loop called allocateLabel() per bucket then mergeAdd() — this caused
  // double-counting when a country appeared in multiple buckets (e.g. China in
  // "Greater China" AND "Asia Pacific").
  //
  // New approach: collect ALL constraints first, then solve jointly in three passes:
  //   Pass 1 — DIRECT: countries with explicit values (already in directAlloc)
  //   Pass 2 — REGION/BUCKET: allocate each bucket's total using channel prior,
  //             excluding countries already constrained in Pass 1
  //   Pass 3 — RESIDUAL: "International"/"Other" bucket distributed across all
  //             remaining unconstrained countries via channel prior
  const channelType = bundle.channel.toLowerCase() as ChannelType;
  const finalWeights = solveJointAllocation(
    closedTotalLabels,
    directAlloc,
    bundle,
    channelType,
    trace
  );

  // Normalize to 100%
  const normalizedWeights = normalizeCountryWeights(finalWeights);
  trace.stepLog.push(`[V.4 Orchestrator] Final allocation: ${normalizedWeights.size} countries`);

  // PRIORITY 2 FIX: Stamp pre/post normalize sums on trace
  trace.preNormalizeSum = Array.from(finalWeights.values()).reduce((s, v) => s + v, 0);
  trace.postNormalizeSum = Array.from(normalizedWeights.values()).reduce((s, v) => s + v, 0);

  return {
    weights: normalizedWeights,
    allocation: normalizedWeights,
    trace
  };
}

/**
 * PHASE 1 FIX - Task 2: Allocate supply chain channel with RF-B detection
 * 
 * Decision flow:
 * 1. Extract narrative text for supply chain
 * 2. Detect membership signals (explicit country mentions)
 * 3. If strong/medium signals → trigger RF-B
 * 4. Otherwise → use legacy sector templates
 */
function allocateSupplyChainWithRFB(
  bundle: EvidenceBundle,
  ticker: string,
  trace: DecisionTrace
): AllocationResult {
  
  trace.stepLog.push(`[Supply Chain RF-B] Extracting narrative text...`);
  
  // Extract narrative text from bundle
  const narrativeSentences = bundle.narrative.rawSentences || [];
  const narrativeText = narrativeSentences.join('. ');
  
  trace.stepLog.push(`[Supply Chain RF-B] Narrative length: ${narrativeText.length} chars`);
  
  if (narrativeText.trim().length === 0) {
    trace.stepLog.push(`[Supply Chain RF-B] ⚠️ No narrative text found, using sector template`);
    trace.fallbackUsed = 'SSF';
    
    // Use legacy method with empty inputs
    const weights = calculateSupplyChainExposure(
      [],
      [],
      ticker,
      bundle.sector
    );
    
    const supplyWeights0 = new Map(Object.entries(weights));
    trace.preNormalizeSum = Array.from(supplyWeights0.values()).reduce((s, v) => s + v, 0);
    trace.postNormalizeSum = trace.preNormalizeSum;
    return {
      weights: supplyWeights0,
      allocation: supplyWeights0,
      trace
    };
  }
  
  // Extract membership signals
  const signals: MembershipSignals = extractSupplyCountriesFromNarrative(
    narrativeText,
    bundle.homeCountry
  );
  
  trace.stepLog.push(`[Supply Chain RF-B] Membership signals detected:`);
  trace.stepLog.push(`  - Explicit countries: ${signals.explicitCountries.join(', ')}`);
  trace.stepLog.push(`  - Signal strength: ${signals.signalStrength}`);
  trace.stepLog.push(`  - Excludes home country: ${signals.excludesHomeCountry}`);
  
  // Decide whether to trigger RF-B
  const shouldTriggerRFB = signals.hasMembershipSignals && 
                           (signals.signalStrength === 'strong' || signals.signalStrength === 'medium');
  
  if (shouldTriggerRFB) {
    trace.stepLog.push(`[Supply Chain RF-B] ✅ Triggering RF-B (${signals.signalStrength} membership signals)`);
    trace.fallbackUsed = 'RF-B';
    
    // Use RF-B method with narrative
    const weights = calculateSupplyChainExposure(
      signals.explicitCountries,
      signals.regions,
      ticker,
      bundle.sector,
      narrativeText,
      bundle.homeCountry
    );
    
    // Verify home country exclusion
    if (signals.excludesHomeCountry && weights[bundle.homeCountry]) {
      trace.stepLog.push(`[Supply Chain RF-B] ⚠️ Home country ${bundle.homeCountry} in result despite exclusion`);
    } else if (signals.excludesHomeCountry) {
      trace.stepLog.push(`[Supply Chain RF-B] ✅ Home country ${bundle.homeCountry} correctly excluded`);
    }

    const rfbOutputMap = new Map(Object.entries(weights));

    // Record RF-B label allocation so trace.labelAllocations is inspectable
    trace.labelAllocations.push({
      label: '(channel_total)',
      labelTotal: 1.0,
      labelUnit: 'normalized',
      fallbackUsed: FallbackType.RF_B,
      membershipSet: new Set(signals.explicitCountries),
      restrictedSetP: new Set(signals.explicitCountries),
      exclusionsApplied: new Set<string>(),
      outputCountries: rfbOutputMap,
      reason: `RF-B supply chain — ${signals.signalStrength} membership signals`
    });

    trace.preNormalizeSum = Array.from(rfbOutputMap.values()).reduce((s, v) => s + v, 0);
    trace.postNormalizeSum = trace.preNormalizeSum;
    return {
      weights: rfbOutputMap,
      allocation: rfbOutputMap,
      trace
    };
  } else {
    trace.stepLog.push(`[Supply Chain RF-B] Using sector template fallback (weak/no signals)`);
    trace.fallbackUsed = 'SSF';
    
    // Use legacy method
    const weights = calculateSupplyChainExposure(
      signals.explicitCountries,
      signals.regions,
      ticker,
      bundle.sector
    );
    
    const supplyWeightsSSF = new Map(Object.entries(weights));
    trace.preNormalizeSum = Array.from(supplyWeightsSSF.values()).reduce((s, v) => s + v, 0);
    trace.postNormalizeSum = trace.preNormalizeSum;
    return {
      weights: supplyWeightsSSF,
      allocation: supplyWeightsSSF,
      trace
    };
  }
}

// ============================================================================
// GAP 3 FIX: Joint Allocation Solver
// ============================================================================

/**
 * Residual label names — these represent "everything else" and must be handled
 * in Pass 3 (distributed across all unconstrained countries via channel prior).
 */
const RESIDUAL_LABELS = new Set([
  'international', 'other', 'rest of world', 'other international',
  'non-us', 'other countries', 'other regions', 'all other',
]);

function isResidualLabel(label: string): boolean {
  return RESIDUAL_LABELS.has(label.toLowerCase().trim());
}

/**
 * Joint allocation solver — eliminates double-counting from the old label-by-label loop.
 *
 * Pass 1: Apply direct constraints (countries already in directAlloc)
 * Pass 2: For each region/bucket label, allocate its total using channel prior,
 *         excluding countries already constrained in Pass 1
 * Pass 3: Distribute residual ("International"/"Other") across all remaining
 *         unconstrained countries using channel prior
 */
function solveJointAllocation(
  closedTotalLabels: string[],
  directAlloc: Map<string, number>,
  bundle: EvidenceBundle,
  channelType: ChannelType,
  trace: DecisionTrace
): Map<string, number> {
  const result = new Map<string, number>(directAlloc);
  const allocated = new Set<string>(directAlloc.keys());

  trace.stepLog.push(`[Joint Solver] Pass 1: ${allocated.size} directly-constrained countries`);

  // Separate residual labels from region/bucket labels
  const regionLabels: string[] = [];
  const residualLabels: string[] = [];

  for (const label of closedTotalLabels) {
    if (isResidualLabel(label)) {
      residualLabels.push(label);
    } else {
      regionLabels.push(label);
    }
  }

  // Pass 2: Region/bucket labels — allocate using channel prior, exclude already-allocated
  for (const label of regionLabels) {
    const labelItem = bundle.structuredItems.find(
      item => item.canonicalLabel === label && !item.isTotalRow
    );
    if (!labelItem) continue;

    const bucketTotal = labelItem.value;
    trace.stepLog.push(`[Joint Solver] Pass 2: "${label}" = ${(bucketTotal * 100).toFixed(2)}%`);

    // Get membership for this label — guard: definitions may be a plain object
    const defMap: Map<string, any> = (bundle.narrative.definitions instanceof Map)
      ? bundle.narrative.definitions
      : new Map(Object.entries(bundle.narrative.definitions ?? {}));
    const definition = defMap.get(label);
    let members: string[] = definition?.includes ?? [];

    // If no explicit definition, try label resolution
    if (members.length === 0) {
      const resolved = resolveMembershipForLabel(label, defMap);
      members = Array.from(resolved?.members ?? []);
    }

    if (members.length === 0) {
      trace.stepLog.push(`[Joint Solver] Pass 2: "${label}" — no membership, using GF`);
      const gfWeights = applyGF(1.0, bundle.sector, bundle.channel);
      const gfOutputCountries = new Map<string, number>();
      for (const [country, w] of gfWeights.entries()) {
        if (!allocated.has(country)) {
          const contrib = w * bucketTotal;
          result.set(country, (result.get(country) ?? 0) + contrib);
          allocated.add(country);
          gfOutputCountries.set(country, contrib);
        }
      }
      trace.labelAllocations.push({
        label,
        labelTotal: bucketTotal,
        labelUnit: 'normalized',
        fallbackUsed: FallbackType.GF,
        membershipSet: new Set(gfOutputCountries.keys()),
        restrictedSetP: new Set(gfOutputCountries.keys()),
        exclusionsApplied: new Set<string>(),
        outputCountries: gfOutputCountries,
        reason: `GF — no membership found for "${label}"`
      });
      continue;
    }

    // Exclude already-constrained countries from this bucket's allocation
    const eligible = members.filter(c => !allocated.has(c));
    if (eligible.length === 0) {
      trace.stepLog.push(`[Joint Solver] Pass 2: "${label}" — all members already allocated, skipping`);
      continue;
    }

    // Allocate bucket total across eligible members using channel prior (SSF)
    const priorWeights = allocateWithPrior(eligible, channelType, bundle.sector, bucketTotal);
    const outputCountries = new Map<string, number>();
    for (const [country, weight] of Object.entries(priorWeights)) {
      if (weight > 0) {
        result.set(country, (result.get(country) ?? 0) + weight);
        allocated.add(country);
        outputCountries.set(country, weight);
        trace.stepLog.push(`[Joint Solver]   ${country}: ${(weight * 100).toFixed(3)}%`);
      }
    }

    // Record SSF label allocation so downstream consumers can inspect trace.labelAllocations
    trace.labelAllocations.push({
      label,
      labelTotal: bucketTotal,
      labelUnit: 'normalized',
      fallbackUsed: FallbackType.SSF,
      membershipSet: new Set(eligible),
      restrictedSetP: new Set(eligible),
      exclusionsApplied: new Set<string>(),
      outputCountries,
      reason: `SSF (channel prior) — ${eligible.length} eligible members for "${label}"`
    });
  }

  // Pass 3: Residual ("International"/"Other") — distribute across all unconstrained countries
  for (const label of residualLabels) {
    const labelItem = bundle.structuredItems.find(
      item => item.canonicalLabel === label && !item.isTotalRow
    );
    if (!labelItem) continue;

    const residualTotal = labelItem.value;
    trace.stepLog.push(`[Joint Solver] Pass 3: residual "${label}" = ${(residualTotal * 100).toFixed(2)}%`);

    const allCountries = Object.keys(_GLOBAL_COUNTRIES);
    const eligible = allCountries.filter(c => !allocated.has(c));

    if (eligible.length === 0) {
      trace.stepLog.push(`[Joint Solver] Pass 3: no unconstrained countries for residual`);
      continue;
    }

    const priorWeights = allocateWithPrior(eligible, channelType, bundle.sector, residualTotal);
    const rfbOutputCountries = new Map<string, number>();
    for (const [country, weight] of Object.entries(priorWeights)) {
      if (weight > 0.0001) {
        result.set(country, (result.get(country) ?? 0) + weight);
        rfbOutputCountries.set(country, weight);
      }
    }

    // Select fallback type based on residual label semantics:
    //
    //   RF_B — restricted-set prior: named countries exist in narrative (they constrain the
    //          distribution), OR the label explicitly names a restricted set ("Other countries",
    //          "Other Asia", "Other [region]").
    //   RF_C — geo-region residual: label is a pure geo-residual phrase with NO named-country
    //          constraint ("Rest of World", "ROW", "International") AND entityKind is GEO_LABEL
    //          or no named countries exist.
    //   RF_D — catch-all / partial evidence: everything else.
    const residualEntityKind = labelItem.entityKind;
    const labelLower = label.toLowerCase().trim();
    const hasNamedCountries = bundle.narrative.namedCountries.size > 0;
    // "Other X" labels (other countries, other asia, other markets…) → RF_B when named countries present
    const isOtherLabel = labelLower.startsWith('other ') || labelLower === 'other';
    // Pure geo-residual phrases with no named-country constraint
    const isPureGeoResidual = (labelLower.startsWith('rest of') || labelLower === 'row' ||
      labelLower === 'international' || labelLower === 'rest of world') && !hasNamedCountries;

    let residualFallbackType: FallbackType;
    if (hasNamedCountries) {
      // Named countries in narrative constrain distribution → restricted-set prior RF_B
      // This applies even to "Rest of World" / "Other X" labels when named countries exist
      residualFallbackType = FallbackType.RF_B;
    } else if (isOtherLabel && !hasNamedCountries) {
      // "Other X" label with NO named countries → catch-all RF_D
      residualFallbackType = FallbackType.RF_D;
    } else if (residualEntityKind === EntityKind.GEO_LABEL || isPureGeoResidual) {
      residualFallbackType = FallbackType.RF_C;
    } else {
      residualFallbackType = FallbackType.RF_D;
    }

    // Record label allocation so downstream consumers can inspect trace.labelAllocations
    trace.labelAllocations.push({
      label,
      labelTotal: residualTotal,
      labelUnit: 'normalized',
      fallbackUsed: residualFallbackType,
      membershipSet: new Set(eligible),
      restrictedSetP: new Set(rfbOutputCountries.keys()),
      exclusionsApplied: new Set(allocated),
      outputCountries: rfbOutputCountries,
      reason: `${residualFallbackType} (restricted-set prior) — residual "${label}" distributed across ${eligible.length} unconstrained countries`
    });

    trace.stepLog.push(`[Joint Solver] Pass 3: distributed ${(residualTotal * 100).toFixed(2)}% across ${eligible.length} unconstrained countries`);
  }

  return result;
}

// ============================================================================
// END GAP 3 FIX
// ============================================================================

/**
 * Allocate direct country evidence (countries with explicit values)
 */
function allocateDirectCountries(
  bundle: EvidenceBundle,
  trace: DecisionTrace
): Map<string, number> {
  
  const directAlloc = new Map<string, number>();
  
  // Find all structured items that are direct countries
  const countryItems = bundle.structuredItems.filter(
    item => item.entityKind === EntityKind.COUNTRY && !item.isTotalRow
  );
  
  if (countryItems.length === 0) {
    trace.stepLog.push(`[Direct Allocation] No direct country evidence found`);
    return directAlloc;
  }
  
  trace.stepLog.push(`[Direct Allocation] Found ${countryItems.length} direct country items`);
  
  // Calculate total value
  const totalValue = countryItems.reduce((sum, item) => sum + item.value, 0);
  
  if (totalValue === 0) {
    trace.stepLog.push(`[Direct Allocation] Total value is 0, skipping direct allocation`);
    return directAlloc;
  }
  
  // Store raw values — do NOT normalize here.
  // The joint solver and downstream normalizeCountryWeights() handle scaling.
  for (const item of countryItems) {
    const label = resolveItemLabel(item);
    const srcRef = resolveItemSourceRef(item);
    const unitStr = typeof item.unit === 'string' ? item.unit : (item.unit ?? 'abs');
    const normalizedUnit: 'pct' | 'abs' = (unitStr === 'pct') ? 'pct' : 'abs';

    directAlloc.set(label, item.value);
    trace.stepLog.push(`[Direct Allocation] ${label}: ${item.value}`);

    // PRIORITY 1 FIX: Record label allocation entry with rawUnit so downstream
    // consumers (and tests) can inspect trace.labelAllocations[*].rawUnit
    trace.labelAllocations.push({
      label,
      labelTotal: item.value,
      labelUnit: normalizedUnit,
      rawUnit: item.rawUnit ?? (unitStr !== 'pct' && unitStr !== 'abs' ? unitStr : undefined),
      fallbackUsed: FallbackType.DIRECT,
      membershipSet: new Set([label]),
      restrictedSetP: new Set([label]),
      exclusionsApplied: new Set<string>(),
      outputCountries: new Map([[label, item.value]]),
      reason: `Direct country evidence — ${srcRef}`
    });
  }
  
  return directAlloc;
}

/**
 * Allocate a single label (segment)
 */
function allocateLabel(
  label: string,
  bundle: EvidenceBundle,
  trace: DecisionTrace
): {
  label: string;
  weights: Map<string, number>;
  fallbackUsed: string;
} {
  
  trace.stepLog.push(`\n[Label Allocation] Processing label: ${label}`);
  
  // Get label's value from structured items
  const labelItem = bundle.structuredItems.find(
    item => resolveItemLabel(item) === label && !item.isTotalRow
  );
  
  if (!labelItem) {
    trace.stepLog.push(`[Label Allocation] Label ${label} not found in structured items`);
    return {
      label,
      weights: new Map(),
      fallbackUsed: 'none'
    };
  }
  
  const labelWeight = labelItem.value;
  trace.stepLog.push(`[Label Allocation] Label weight: ${(labelWeight * 100).toFixed(2)}%`);
  
  // Check if label has explicit membership definition
  // Guard: definitions may be a plain object (not a Map) depending on the caller
  const defMapL: Map<string, any> = (bundle.narrative.definitions instanceof Map)
    ? bundle.narrative.definitions
    : new Map(Object.entries(bundle.narrative.definitions ?? {}));
  const definition = defMapL.get(label);
  
  if (definition && definition.includes.length > 0) {
    trace.stepLog.push(`[Label Allocation] Found membership definition with ${definition.includes.length} countries`);
    trace.stepLog.push(`[Label Allocation] Using SSF (Segment-Specific Fallback)`);
    
    // Use SSF
    const ssfWeights = applySSF(
      definition.includes,
      bundle.sector,
      bundle.channel
    );
    
    // Scale by label weight
    const scaledWeights = new Map<string, number>();
    for (const [country, weight] of ssfWeights.entries()) {
      scaledWeights.set(country, weight * labelWeight);
    }
    
    return {
      label,
      weights: scaledWeights,
      fallbackUsed: 'SSF'
    };
  }
  
  // No explicit membership - check if we should use RF or GF
  const rfCase = decideRFCase_V4(bundle, label);
  
  if (rfCase !== 'none') {
    trace.stepLog.push(`[Label Allocation] Using RF (Restricted Fallback) - Case: ${rfCase}`);
    
    // Build restricted set P
    const restrictedSet = buildRestrictedSetP(
      bundle,
      label,
      rfCase
    );
    
    trace.stepLog.push(`[Label Allocation] Restricted set P: ${restrictedSet.length} countries`);
    
    // Apply RF
    const rfWeights = applyRF(
      restrictedSet,
      bundle.sector,
      bundle.channel
    );
    
    // Scale by label weight
    const scaledWeights = new Map<string, number>();
    for (const [country, weight] of rfWeights.entries()) {
      scaledWeights.set(country, weight * labelWeight);
    }
    
    return {
      label,
      weights: scaledWeights,
      fallbackUsed: `RF-${rfCase}`
    };
  }
  
  // Use GF (Global Fallback)
  trace.stepLog.push(`[Label Allocation] Using GF (Global Fallback)`);
  
  const gfWeights = applyGF(
    bundle.sector,
    bundle.channel
  );
  
  // Scale by label weight
  const scaledWeights = new Map<string, number>();
  for (const [country, weight] of gfWeights.entries()) {
    scaledWeights.set(country, weight * labelWeight);
  }
  
  return {
    label,
    weights: scaledWeights,
    fallbackUsed: 'GF'
  };
}

/**
 * Run Step 1 for all channels
 */
export function runStep1_V4(
  evidenceBundles: Map<Channel, EvidenceBundle>,
  ticker: string = ''
): Map<Channel, AllocationResult> {
  
  const results = new Map<Channel, AllocationResult>();
  
  for (const [channel, bundle] of evidenceBundles.entries()) {
    const result = allocateChannel_V4(bundle, ticker);
    // Populate allocation alias so tests can use result.allocation
    result.allocation = result.weights;
    results.set(channel, result);
  }
  
  return results;
}