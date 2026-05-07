/**
 * V.4 Orchestrator - Enhanced (Phase 1 Fix)
 * 
 * PHASE 1 ENHANCEMENTS:
 * 1. Evidence locking mechanism (prevent RF override of structured evidence)
 * 2. Fixed decideLabelAllocationMethod_V4 to return RF-B/C/D
 * 3. Proper evidence priority: DIRECT > SSF > RF-A/B/C/D > GF
 * 4. Fixed normalization to preserve partial label totals
 */

import {
  Channel,
  EvidenceBundle,
  AllocationResult,
  TraceObject,
  StructuredItem,
  NarrativeMentions,
  EntityKind,
  FallbackType,
  LabelAllocation
} from '@/types/v4Types';

import {
  resolveMembershipForLabel,
  labelIsCountry,
  canonicalizeLabel,
  classifyEntityKind
} from './labelResolution';

import {
  findClosedTotalLabels,
  getTotalRowValueIfAny,
  inferUnitMode,
  computeLabelTotalWeight,
  validateClosedTotal
} from './closedTotalValidation';

import {
  decideRFCase_V4,
  anyGeographyMembershipEvidenceExists,
  classifyRFTypeForLabel,
  hasPartialStructuredEvidence
} from './rfTaxonomy';

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

/**
 * PHASE 1 FIX: Main allocation function with enhanced evidence locking
 */
export function allocateChannel_V4_Enhanced(evidenceBundle: EvidenceBundle): AllocationResult {
  
  const trace: TraceObject = {
    channel: evidenceBundle.channel,
    detectedStructured: evidenceBundle.structuredItems,
    detectedNarrative: evidenceBundle.narrative,
    stepLog: [],
    directAlloc: new Map(),
    labelAllocations: [],
    finalWeights: new Map()
  };
  
  trace.stepLog.push('STEP0: evidence extracted (structured + narrative + supplementary hints)');
  
  // PHASE 1 FIX: Identify label totals FIRST
  const closedLabels = findClosedTotalLabels(
    evidenceBundle.structuredItems,
    evidenceBundle.narrative.definitions
  );
  const hasClosedTotals = closedLabels.size > 0;
  
  // STEP 1 — Direct country-level structured evidence
  // PHASE 1 FIX: Enhanced direct allocation with proper locking
  const direct = new Map<string, number>();
  let directTotal = 0;
  
  for (const item of evidenceBundle.structuredItems) {
    if (item.entityKind === EntityKind.COUNTRY && !item.isTotalRow) {
      // PHASE 1 FIX: Skip if this country has a definition (it's a bucket/label)
      if (evidenceBundle.narrative.definitions.has(item.canonicalLabel)) {
        trace.stepLog.push(`SKIP: ${item.canonicalLabel} has definition, treating as label not direct country`);
        continue;
      }
      
      const existing = direct.get(item.canonicalLabel) || 0;
      direct.set(item.canonicalLabel, existing + item.value);
      directTotal += item.value;
    }
  }
  
  // Convert direct to weights
  const directWeights = convertDirectToWeights(
    direct,
    evidenceBundle.structuredItems
  );
  
  // PHASE 1 FIX: Create locked countries set - these cannot be overridden
  const lockedCountries = new Set(directWeights.keys());
  trace.directAlloc = directWeights;
  trace.stepLog.push(`STEP1: direct country-level structured evidence allocated + locked (${lockedCountries.size} countries)`);
  
  let countryWeights = new Map(directWeights);
  
  const unitMode = inferUnitMode(evidenceBundle.structuredItems);
  const totalRowValue = getTotalRowValueIfAny(evidenceBundle.structuredItems);
  
  // STEP 2/3/4: If closed totals exist, allocate label-by-label
  if (hasClosedTotals) {
    trace.stepLog.push(`STEP2: closed allocatable label totals detected (${closedLabels.size} labels) => label-by-label allocation`);
    
    // PHASE 1 FIX: Track sum of all label totals to determine if normalization is needed
    let sumOfLabelTotals = 0;
    
    for (const label of closedLabels) {
      const labelTotalWeight = computeLabelTotalWeight(
        label,
        evidenceBundle.structuredItems,
        unitMode,
        totalRowValue
      );
      
      sumOfLabelTotals += labelTotalWeight;
      
      // PHASE 1 FIX: Enhanced decision method that returns RF-B/C/D
      const decision = decideLabelAllocationMethod_V4_Enhanced(label, evidenceBundle);
      
      trace.stepLog.push(`LABEL: ${label} (${(labelTotalWeight * 100).toFixed(1)}%) => ${decision.method} (${decision.reason})`);
      
      if (decision.method === FallbackType.SSF) {
        // SSF applies ONLY to this label total
        const members = decision.members;
        let alloc = applySSF(
          members,
          labelTotalWeight,
          evidenceBundle.sector,
          evidenceBundle.channel
        );
        
        // PHASE 1 FIX: Exclude locked countries and renormalize
        alloc = removeAndRenormalize(alloc, lockedCountries, labelTotalWeight);
        
        countryWeights = mergeAdd(countryWeights, alloc);
        
        trace.labelAllocations.push({
          label,
          labelTotal: labelTotalWeight,
          labelUnit: 'weight',
          fallbackUsed: FallbackType.SSF,
          membershipSet: members,
          restrictedSetP: new Set(),
          exclusionsApplied: lockedCountries,
          outputCountries: alloc,
          reason: decision.reason
        });
        
        // Update locked countries
        for (const country of alloc.keys()) {
          lockedCountries.add(country);
        }
        
      } else if (decision.method === FallbackType.RF_A || 
                 decision.method === FallbackType.RF_B ||
                 decision.method === FallbackType.RF_C ||
                 decision.method === FallbackType.RF_D) {
        
        // PHASE 1 FIX: RF applies ONLY to this label total (not 100% of channel)
        const built = buildRestrictedSetP(
          evidenceBundle,
          lockedCountries,
          new Set()
        );
        
        const alloc = applyRF(
          built.P,
          labelTotalWeight,
          evidenceBundle.sector,
          evidenceBundle.channel
        );
        
        countryWeights = mergeAdd(countryWeights, alloc);
        
        trace.labelAllocations.push({
          label,
          labelTotal: labelTotalWeight,
          labelUnit: 'weight',
          fallbackUsed: decision.method,
          membershipSet: new Set(),
          restrictedSetP: built.P,
          exclusionsApplied: lockedCountries,
          outputCountries: alloc,
          reason: decision.reason
        });
        
        // Update locked countries
        for (const country of alloc.keys()) {
          lockedCountries.add(country);
        }
      }
    }
    
    // PHASE 1 FIX: Only normalize if sum of label totals is close to 1.0
    // If labels only cover partial revenue (e.g., Greater China = 0.15), preserve that
    let final: Map<string, number>;
    if (Math.abs(sumOfLabelTotals - 1.0) < 0.01) {
      // Labels cover ~100% of channel, normalize to ensure exact 1.0
      final = normalizeCountryWeights(countryWeights);
      trace.stepLog.push('END: direct + SSF + RF-A/B/C/D merged and normalized (labels cover 100%)');
    } else {
      // Labels cover partial revenue, preserve the partial total
      final = countryWeights;
      trace.stepLog.push(`END: direct + SSF + RF-A/B/C/D merged (labels cover ${(sumOfLabelTotals * 100).toFixed(1)}%, preserved)`);
    }
    
    trace.finalWeights = final;
    
    return { weights: final, trace };
  }
  
  // NO closed totals => STEP 5 or STEP 6
  trace.stepLog.push('STEP2: no closed allocatable totals exist');
  
  if (anyGeographyMembershipEvidenceExists(evidenceBundle)) {
    // RF applies to 100% of channel
    const rfCase = decideRFCase_V4(evidenceBundle);
    
    const built = buildRestrictedSetP(
      evidenceBundle,
      new Set(),
      new Set()
    );
    
    const alloc = applyRF(
      built.P,
      1.0,
      evidenceBundle.sector,
      evidenceBundle.channel
    );
    
    trace.labelAllocations.push({
      label: '(channel_total)',
      labelTotal: 1.0,
      labelUnit: 'weight',
      fallbackUsed: rfCase,
      membershipSet: new Set(),
      restrictedSetP: built.P,
      exclusionsApplied: new Set(),
      outputCountries: alloc,
      reason: 'RF applies to 100% of channel because no closed totals exist but membership evidence exists'
    });
    
    const final = normalizeCountryWeights(alloc);
    trace.finalWeights = final;
    trace.stepLog.push('END: RF (100% channel) normalized');
    
    return { weights: final, trace };
  }
  
  // Only now GF is allowed
  if (canUseGF_V4(evidenceBundle)) {
    const alloc = applyGF(
      1.0,
      evidenceBundle.sector,
      evidenceBundle.channel,
      evidenceBundle.homeCountry,
      false
    );
    
    const final = normalizeCountryWeights(alloc);
    trace.finalWeights = final;
    trace.stepLog.push('END: GF applied and normalized');
    
    return { weights: final, trace };
  }
  
  // GF prohibited by V4
  trace.stepLog.push('END: GF prohibited by V4; returning empty for review');
  return { weights: new Map(), trace };
}

/**
 * PHASE 1 FIX: Enhanced label allocation decision method
 * NOW RETURNS: SSF, RF-A, RF-B, RF-C, or RF-D (not just SSF or RF-A)
 */
function decideLabelAllocationMethod_V4_Enhanced(
  label: string,
  evidenceBundle: EvidenceBundle
): { method: FallbackType; members: Set<string>; reason: string } {
  
  // Try to resolve membership from definitions
  const mem = resolveMembershipForLabel(
    label,
    evidenceBundle.narrative.definitions
  );
  
  if (mem.resolvable) {
    return {
      method: FallbackType.SSF,
      members: mem.members,
      reason: `closed total + resolvable membership (${mem.members.size} members) => SSF`
    };
  }
  
  // PHASE 1 FIX: Membership not resolvable from definitions
  // Check if we have OTHER membership evidence (narrative, supplementary hints)
  const hasNamedCountries = evidenceBundle.narrative.namedCountries.size > 0 || 
                            evidenceBundle.supplementaryMembershipHints.namedCountries.size > 0;
  
  const hasGeoLabels = evidenceBundle.narrative.geoLabels.size > 0 || 
                       evidenceBundle.supplementaryMembershipHints.geoLabels.size > 0;
  
  const hasPartialStructured = hasPartialStructuredEvidence(
    evidenceBundle.structuredItems,
    evidenceBundle.channel
  );
  
  // PHASE 1 FIX: Classify RF type using enhanced logic
  const rfType = classifyRFTypeForLabel(label, evidenceBundle);
  
  // Return appropriate RF type with detailed reason
  if (rfType === FallbackType.RF_D) {
    return {
      method: FallbackType.RF_D,
      members: new Set(),
      reason: `closed total but membership not resolvable; partial structured evidence exists => RF-D (${label} residual only)`
    };
  } else if (rfType === FallbackType.RF_B) {
    const namedCount = evidenceBundle.narrative.namedCountries.size + 
                       evidenceBundle.supplementaryMembershipHints.namedCountries.size;
    return {
      method: FallbackType.RF_B,
      members: new Set(),
      reason: `closed total but membership not resolvable; ${namedCount} named countries exist => RF-B (${label} residual only)`
    };
  } else if (rfType === FallbackType.RF_C) {
    const geoCount = evidenceBundle.narrative.geoLabels.size + 
                     evidenceBundle.supplementaryMembershipHints.geoLabels.size;
    return {
      method: FallbackType.RF_C,
      members: new Set(),
      reason: `closed total but membership not resolvable; ${geoCount} geo labels exist => RF-C (${label} residual only)`
    };
  } else {
    // RF-A (conservative, no membership evidence)
    return {
      method: FallbackType.RF_A,
      members: new Set(),
      reason: `closed total but membership NOT resolvable and no other evidence => RF-A (${label} residual only)`
    };
  }
}

/**
 * Check if GF can be used (V4 conditions)
 */
function canUseGF_V4(evidenceBundle: EvidenceBundle): boolean {
  const noGeo = !anyGeographyMembershipEvidenceExists(evidenceBundle);
  
  const noStructuredGeoLabels = !evidenceBundle.structuredItems.some(item =>
    [EntityKind.COUNTRY, EntityKind.GEO_LABEL, EntityKind.NONSTANDARD_LABEL].includes(item.entityKind)
  );
  
  const noClosedTotals = findClosedTotalLabels(
    evidenceBundle.structuredItems,
    evidenceBundle.narrative.definitions
  ).size === 0;
  
  const worldwidePlausible = exposurePlausiblyWorldwide(
    evidenceBundle.channel,
    evidenceBundle.sector
  );
  
  return noGeo && noStructuredGeoLabels && noClosedTotals && worldwidePlausible;
}

/**
 * Convert direct country allocations to weights
 */
function convertDirectToWeights(
  direct: Map<string, number>,
  structuredItems: StructuredItem[]
): Map<string, number> {
  
  const weights = new Map<string, number>();
  
  // Check if values are already percentages
  const firstItem = structuredItems.find(item => 
    item.entityKind === EntityKind.COUNTRY && !item.isTotalRow
  );
  
  if (!firstItem) {
    return weights;
  }
  
  if (firstItem.unit === 'pct') {
    // Already percentages, use as-is
    return new Map(direct);
  }
  
  // If absolute values, need to convert
  const totalRowValue = getTotalRowValueIfAny(structuredItems);
  
  if (totalRowValue && totalRowValue > 0) {
    for (const [country, value] of direct.entries()) {
      weights.set(country, value / totalRowValue);
    }
    return weights;
  }
  
  // Otherwise normalize
  const total = Array.from(direct.values()).reduce((sum, v) => sum + v, 0);
  if (total > 0) {
    for (const [country, value] of direct.entries()) {
      weights.set(country, value / total);
    }
  }
  
  return weights;
}

/**
 * Run Step 1 for all channels (top-level orchestrator)
 */
export function runStep1_V4_Enhanced(
  evidenceBundles: Map<Channel, EvidenceBundle>
): Map<Channel, AllocationResult> {
  
  const results = new Map<Channel, AllocationResult>();
  
  for (const [channel, evidence] of evidenceBundles.entries()) {
    results.set(channel, allocateChannel_V4_Enhanced(evidence));
  }
  
  return results;
}

// Export enhanced functions as default
export { allocateChannel_V4_Enhanced as allocateChannel_V4 };
export { runStep1_V4_Enhanced as runStep1_V4 };