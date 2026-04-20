/**
 * V5 Structured Data Integrator
 *
 * Implements all Phase 1 fixes:
 *   Step 1.2 — Enforce structured evidence as hard constraints
 *              (region totals preserved exactly; prior-weighted internal allocation)
 *   Step 1.3 — Fix narrative parser (admissible set construction, no template injection)
 *   Step 1.4 — Stop using fallback when evidence covers ≥95%
 *   Step 1.5 — Fix output labelling (DIRECT / ALLOCATED / MODELED tiers)
 *
 * And Phase 2 fixes:
 *   Step 2.1 — Fallback returns admissible set + constraints (not weights directly)
 *   Step 2.2 — Separate plausibility from magnitude
 *   Step 2.3 — Channel-specific priors drive allocation
 *   Step 2.4 — V5 GF formula replaces fixed 85/15
 *
 * GAP 4 FIX: Residual labels ("International", "Other", "Rest of World") are
 *            distributed across all unconstrained countries via channel prior.
 */

import { allocateWithPrior, buildGlobalFallbackV5, type ChannelType } from './channelPriors';
import { isActualCountry, normalizeCountryName } from '../countryValidator';
import { isKnownRegion, getRegionCountries } from '../fallbackLogic';
import { extractSupplyCountriesFromNarrative } from '../supplyChainFallback';
import {
  TECH_ASSET_PRIORS,
  MANUFACTURING_ASSET_PRIORS,
  ENERGY_ASSET_PRIORS,
} from '../physicalAssetsFallback';
import type { ParsedSECData, RevenueSegment, PPESegment } from '../secFilingParser';
import type { SustainabilityReportData } from '../dataIntegration/sustainabilityReportParser';

// ============================================================================
// GAP 4 FIX: Sentinel & known-countries list
// ============================================================================

/**
 * Sentinel value returned by getRegionMembersFromName for residual labels.
 * When a segment is labelled "International", "Other", "Rest of World" etc., the
 * caller must distribute its total across ALL countries not already constrained.
 */
const RESIDUAL_SENTINEL = '__RESIDUAL__';

/**
 * Broad list of known countries used for residual distribution.
 */
const ALL_KNOWN_COUNTRIES = [
  'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France',
  'India', 'South Korea', 'Canada', 'Italy', 'Brazil', 'Australia',
  'Spain', 'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia', 'Turkey',
  'Switzerland', 'Taiwan', 'Poland', 'Sweden', 'Belgium', 'Argentina',
  'Norway', 'Austria', 'United Arab Emirates', 'Israel', 'Ireland',
  'Singapore', 'Hong Kong', 'Vietnam', 'Thailand', 'Malaysia', 'Philippines',
  'Denmark', 'Finland', 'Portugal', 'Czech Republic', 'Romania', 'Hungary',
  'Chile', 'Colombia', 'Peru', 'New Zealand', 'South Africa', 'Egypt',
  'Nigeria', 'Pakistan', 'Bangladesh', 'Ethiopia', 'Russia',
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * V5 IntegratedChannelData — adds tier field (Step 1.5)
 */
export interface IntegratedChannelDataV5 {
  country: string;
  weight: number;
  state: 'known-zero' | 'known-positive' | 'unknown';
  status: 'evidence' | 'high_confidence_estimate' | 'fallback';
  source: string;
  dataQuality: 'high' | 'medium' | 'low';
  evidenceType: 'structured_table' | 'narrative' | 'fallback' | 'exhibit_21' | 'sustainability_report';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  /**
   * V5 Tier (Step 1.5):
   *   DIRECT    — explicitly disclosed in filing (structured_table + no fallback)
   *   ALLOCATED — derived from structural constraint (region total → prior allocation)
   *   MODELED   — prior-based inference, no direct constraint
   */
  tier: 'DIRECT' | 'ALLOCATED' | 'MODELED';
  rawData?: RevenueSegment | PPESegment;
}

export interface ValidationResultV5 {
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// HELPER: Determine tier from evidence metadata (Step 1.5)
// ============================================================================

function determineTier(
  evidenceType: IntegratedChannelDataV5['evidenceType'],
  fallbackType: IntegratedChannelDataV5['fallbackType']
): 'DIRECT' | 'ALLOCATED' | 'MODELED' {
  if (evidenceType === 'structured_table' && (fallbackType === 'none' || !fallbackType)) {
    return 'DIRECT';
  }
  if (
    (evidenceType === 'structured_table' || evidenceType === 'exhibit_21' || evidenceType === 'sustainability_report') &&
    fallbackType === 'SSF'
  ) {
    return 'ALLOCATED';
  }
  return 'MODELED';
}

// ============================================================================
// STEP 1.4 FIX: Coverage check before fallback
// ============================================================================

function getEvidenceCoverage(channel: Record<string, IntegratedChannelDataV5>): number {
  return Object.values(channel).reduce((sum, d) => sum + d.weight, 0);
}

// ============================================================================
// HELPER: Map common SEC segment region names to member countries
// ============================================================================

function getRegionMembersFromName(regionName: string): string[] {
  const lower = regionName.toLowerCase().trim();

  // Americas / North America
  if (lower === 'americas' || lower === 'north america' || lower === 'the americas') {
    return ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia'];
  }
  if (lower === 'latin america' || lower === 'latam') {
    return ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela'];
  }

  // Europe / EMEA
  if (
    lower === 'europe' ||
    lower === 'emea' ||
    lower === 'europe, middle east and africa' ||
    lower === 'european union' ||
    lower === 'eu'
  ) {
    return [
      'Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Netherlands',
      'Switzerland', 'Sweden', 'Belgium', 'Austria', 'Norway', 'Denmark',
      'Poland', 'Ireland', 'Finland', 'Portugal', 'Czech Republic', 'Romania',
      'Hungary', 'Slovakia', 'Luxembourg',
    ];
  }

  // Middle East / Africa
  if (lower === 'middle east' || lower === 'mea' || lower === 'middle east and africa') {
    return ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Egypt', 'Nigeria', 'South Africa', 'Turkey'];
  }

  // Asia Pacific / APAC
  if (
    lower === 'asia pacific' ||
    lower === 'apac' ||
    lower === 'asia-pacific' ||
    lower === 'rest of asia pacific'
  ) {
    return [
      'Japan', 'China', 'South Korea', 'Australia', 'India', 'Taiwan',
      'Singapore', 'Hong Kong', 'Vietnam', 'Thailand', 'Malaysia',
      'Indonesia', 'Philippines', 'New Zealand',
    ];
  }

  // Japan (sometimes listed as a region in SEC filings)
  if (lower === 'japan') return ['Japan'];

  // China / Greater China
  if (lower === 'china' || lower === 'china mainland') return ['China'];
  if (lower === 'greater china' || lower === 'china including hong kong and taiwan') {
    return ['China', 'Hong Kong', 'Taiwan'];
  }

  // Rest of World / International / Other — GAP 4 FIX: residual sentinel
  if (
    lower === 'rest of world' ||
    lower === 'other' ||
    lower === 'international' ||
    lower === 'other international' ||
    lower === 'non-us' ||
    lower === 'other countries' ||
    lower === 'all other' ||
    lower === 'other regions'
  ) {
    return [RESIDUAL_SENTINEL];
  }

  return [];
}

// ============================================================================
// STEP 1.2 FIX: Region allocation with prior (replaces calculateSegmentFallback)
// ============================================================================

/**
 * Allocate a region total to its member countries using channel-specific economic priors.
 * The regionTotal is a HARD CONSTRAINT — weights sum exactly to regionTotal.
 */
export function allocateRegionWithPrior(
  regionName: string,
  regionTotal: number,
  channel: ChannelType,
  sector: string
): Record<string, IntegratedChannelDataV5> {
  let members: string[] = [];

  if (isKnownRegion(regionName)) {
    const regionCountries = getRegionCountries(regionName);
    if (regionCountries && regionCountries.length > 0) {
      members = regionCountries;
    }
  }

  if (members.length === 0) {
    members = getRegionMembersFromName(regionName);
  }

  // GAP 4 FIX: If this is a residual sentinel, callers should handle it directly
  if (members.length === 1 && members[0] === RESIDUAL_SENTINEL) {
    members = [];
  }

  if (members.length === 0) {
    // Unknown region — treat as single entity
    console.warn(`[V5 Region Allocator] Unknown region: "${regionName}", treating as single country`);
    return {
      [regionName]: {
        country: regionName,
        weight: regionTotal,
        state: 'known-positive',
        status: 'high_confidence_estimate',
        source: `Region total: ${regionName} (unknown membership)`,
        dataQuality: 'medium',
        evidenceType: 'structured_table',
        fallbackType: 'SSF',
        tier: 'ALLOCATED',
      },
    };
  }

  // Allocate within region using channel-specific prior
  const priorWeights = allocateWithPrior(members, channel, sector, regionTotal);

  const result: Record<string, IntegratedChannelDataV5> = {};
  for (const [country, weight] of Object.entries(priorWeights)) {
    if (weight > 0) {
      result[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'high_confidence_estimate',
        source: `Region "${regionName}" (${(regionTotal * 100).toFixed(1)}% total) → prior-weighted allocation`,
        dataQuality: 'medium',
        evidenceType: 'structured_table',
        fallbackType: 'SSF',
        tier: 'ALLOCATED',
      };
    }
  }

  console.log(
    `[V5 Region Allocator] "${regionName}" (${(regionTotal * 100).toFixed(2)}%) → ` +
    `${Object.keys(result).length} countries via ${channel} prior`
  );

  return result;
}

// ============================================================================
// STEP 1.3 FIX: Admissible set construction for supply chain
// ============================================================================

/**
 * Build admissible set P from narrative evidence ONLY.
 * No template injection — only explicitly mentioned countries are eligible.
 *
 * Fix 1 guard: If narrative is empty/null or isSimulated is true, returns empty admissible set.
 * This prevents template-injected text from polluting the admissible set.
 */
export function buildAdmissibleSetFromNarrative(
  narrative: string | null | undefined,
  homeCountry: string,
  ticker: string,
  isSimulated?: boolean
): { admissibleSet: string[]; excludesHomeCountry: boolean; signalStrength: string } {
  // Fix 1: Guard against empty/null input or simulated text
  if (!narrative || narrative.trim().length === 0 || isSimulated === true) {
    console.log(`[V5 Admissible Set] ${ticker}: Skipping — narrative is ${!narrative ? 'empty/null' : 'simulated'}`);
    return { admissibleSet: [], excludesHomeCountry: false, signalStrength: 'none' };
  }

  const signals = extractSupplyCountriesFromNarrative(narrative, homeCountry);

  console.log(`[V5 Admissible Set] Extracted from narrative for ${ticker}:`);
  console.log(`  Explicit countries: ${signals.explicitCountries.join(', ')}`);
  console.log(`  Signal strength: ${signals.signalStrength}`);
  console.log(`  Excludes home country: ${signals.excludesHomeCountry}`);

  let admissibleSet = [...signals.explicitCountries];

  for (const region of signals.regions) {
    const regionMembers = getRegionMembersFromName(region);
    admissibleSet = [...new Set([...admissibleSet, ...regionMembers])];
  }

  if (signals.excludesHomeCountry) {
    admissibleSet = admissibleSet.filter(c => c !== homeCountry);
    console.log(`[V5 Admissible Set] Excluded home country ${homeCountry} (not in narrative)`);
  }

  return {
    admissibleSet,
    excludesHomeCountry: signals.excludesHomeCountry,
    signalStrength: signals.signalStrength,
  };
}

// ============================================================================
// REVENUE CHANNEL INTEGRATION V5
// ============================================================================

export function integrateRevenueChannelV5(
  secData: ParsedSECData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): {
  channel: Record<string, IntegratedChannelDataV5>;
  evidenceLevel: 'structured' | 'narrative' | 'fallback';
  validations: ValidationResultV5[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
} {
  const channel: Record<string, IntegratedChannelDataV5> = {};
  const validations: ValidationResultV5[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;

  console.log(`\n[V5 Revenue Integration] ========================================`);
  console.log(`[V5 Revenue Integration] ${ticker} | ${sector} | home: ${homeCountry}`);

  if (secData?.revenueTableFound && secData.revenueSegments.length > 0) {
    console.log(`[V5 Revenue Integration] ✅ STRUCTURED EVIDENCE FOUND`);
    evidenceLevel = 'structured';

    for (const segment of secData.revenueSegments) {
      const regionName = segment.region;
      const segmentShare = segment.revenuePercentage / 100;

      if (isActualCountry(regionName)) {
        const countryName = normalizeCountryName(regionName);
        console.log(`[V5 Revenue] DIRECT: "${regionName}" = ${(segmentShare * 100).toFixed(2)}%`);

        if (countryName in channel) {
          channel[countryName].weight += segmentShare;
        } else {
          channel[countryName] = {
            country: countryName,
            weight: segmentShare,
            state: 'known-positive',
            status: 'evidence',
            source: `SEC 10-K Revenue Segment: ${regionName} (${segment.fiscalYear})`,
            dataQuality: 'high',
            evidenceType: 'structured_table',
            fallbackType: 'none',
            tier: 'DIRECT',
            rawData: segment,
          };
        }
      } else {
        // REGION — check if this is a residual label (GAP 4 FIX)
        const members = getRegionMembersFromName(regionName);

        if (members.length === 1 && members[0] === RESIDUAL_SENTINEL) {
          // GAP 4 FIX: Residual bucket — distribute across unconstrained countries
          console.log(`[V5 Revenue] RESIDUAL: "${regionName}" = ${(segmentShare * 100).toFixed(2)}% → distributing across unconstrained countries`);

          const constrained = new Set(Object.keys(channel));
          const eligible = ALL_KNOWN_COUNTRIES.filter(c => !constrained.has(c));

          if (eligible.length > 0) {
            const residualWeights = allocateWithPrior(eligible, 'revenue', sector, segmentShare);
            for (const [country, weight] of Object.entries(residualWeights)) {
              if (weight < 0.0001) continue;
              if (country in channel) {
                channel[country].weight += weight;
              } else {
                channel[country] = {
                  country,
                  weight,
                  state: 'unknown',
                  status: 'high_confidence_estimate',
                  source: `Residual bucket "${regionName}" (${(segmentShare * 100).toFixed(1)}%) → revenue prior`,
                  dataQuality: 'medium',
                  evidenceType: 'fallback',
                  fallbackType: 'GF',
                  tier: 'MODELED',
                };
              }
            }
          }

          if (!fallbackType) fallbackType = 'GF';
        } else {
          // Normal REGION — allocate internally using revenue prior (Step 1.2 fix)
          console.log(`[V5 Revenue] REGION: "${regionName}" = ${(segmentShare * 100).toFixed(2)}% → prior allocation`);
          const regionAlloc = allocateRegionWithPrior(regionName, segmentShare, 'revenue', sector);

          for (const [country, data] of Object.entries(regionAlloc)) {
            if (country in channel) {
              channel[country].weight += data.weight;
            } else {
              channel[country] = data;
            }
          }

          if (!fallbackType) fallbackType = 'SSF';
        }
      }
    }

    // Step 1.4: Coverage check
    const coverage = getEvidenceCoverage(channel);
    console.log(`[V5 Revenue] Evidence coverage: ${(coverage * 100).toFixed(2)}%`);

    if (coverage >= 0.95) {
      console.log(`[V5 Revenue] ✅ Coverage ≥95% — no fallback needed`);
      validations.push({
        channel: 'revenue',
        rule: 'Evidence coverage ≥95%',
        passed: true,
        message: `Revenue evidence covers ${(coverage * 100).toFixed(1)}% — fallback suppressed`,
        severity: 'info',
      });
    } else {
      const remainder = 1.0 - coverage;
      console.log(`[V5 Revenue] Allocating ${(remainder * 100).toFixed(2)}% remainder via GF prior`);
      const gfWeights = buildGlobalFallbackV5(homeCountry, 'revenue', sector);

      for (const [country, gfWeight] of Object.entries(gfWeights)) {
        const allocWeight = gfWeight * remainder;
        if (allocWeight < 0.001) continue;

        if (country in channel) {
          channel[country].weight += allocWeight;
        } else {
          channel[country] = {
            country,
            weight: allocWeight,
            state: 'unknown',
            status: 'fallback',
            source: `Revenue Prior GF (remainder ${(remainder * 100).toFixed(1)}%)`,
            dataQuality: 'low',
            evidenceType: 'fallback',
            fallbackType: 'GF',
            tier: 'MODELED',
          };
        }
      }

      if (!fallbackType) fallbackType = 'GF';
    }

    validations.push({
      channel: 'revenue',
      rule: 'Structured table exists → DIRECT or ALLOCATED',
      passed: true,
      message: fallbackType === 'SSF'
        ? 'Using prior-weighted region allocation (ALLOCATED tier)'
        : 'Using direct evidence (DIRECT tier)',
      severity: 'info',
    });
  } else {
    console.log(`[V5 Revenue Integration] ⚠️ No structured revenue table — using V5 GF`);
    evidenceLevel = 'fallback';
    fallbackType = 'GF';

    const gfWeights = buildGlobalFallbackV5(homeCountry, 'revenue', sector);
    for (const [country, weight] of Object.entries(gfWeights)) {
      if (weight < 0.001) continue;
      channel[country] = {
        country,
        weight,
        state: 'unknown',
        status: 'fallback',
        source: `V5 Revenue Prior GF (no SEC table)`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };
    }

    validations.push({
      channel: 'revenue',
      rule: 'Structured evidence preferred',
      passed: false,
      message: 'No revenue segment table found — using V5 GF prior',
      severity: 'warning',
    });
  }

  console.log(`[V5 Revenue Integration] Level: ${evidenceLevel} | Fallback: ${fallbackType || 'none'} | Countries: ${Object.keys(channel).length}`);
  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// SUPPLY CHAIN CHANNEL INTEGRATION V5
// ============================================================================

export async function integrateSupplyChannelV5(
  secData: ParsedSECData | null,
  sustainabilityData: SustainabilityReportData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): Promise<{
  channel: Record<string, IntegratedChannelDataV5>;
  evidenceLevel: 'structured' | 'narrative' | 'fallback';
  validations: ValidationResultV5[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
}> {
  const channel: Record<string, IntegratedChannelDataV5> = {};
  const validations: ValidationResultV5[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;

  console.log(`\n[V5 Supply Integration] ========================================`);
  console.log(`[V5 Supply Integration] ${ticker} | ${sector} | home: ${homeCountry}`);

  // Priority 1: Sustainability report (direct supplier evidence)
  if (sustainabilityData && sustainabilityData.supplierData.length > 0) {
    console.log(`[V5 Supply Integration] ✅ SUSTAINABILITY REPORT — using as primary evidence`);
    evidenceLevel = 'structured';
    fallbackType = undefined;

    const { sustainabilityToChannelWeights } = await import('../dataIntegration/sustainabilityReportParser');
    const sustainabilityWeights = sustainabilityToChannelWeights(sustainabilityData, 'supply');

    for (const [country, weight] of Object.entries(sustainabilityWeights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `Sustainability Report ${sustainabilityData.reportYear} (${sustainabilityData.totalTier1Suppliers} Tier 1 suppliers)`,
        dataQuality: 'high',
        evidenceType: 'sustainability_report',
        fallbackType: 'none',
        tier: 'DIRECT',
      };
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      console.log(`[V5 Supply] ✅ Sustainability coverage ≥95% — no fallback`);
      validations.push({
        channel: 'supply',
        rule: 'Evidence coverage ≥95%',
        passed: true,
        message: `Supply evidence covers ${(coverage * 100).toFixed(1)}%`,
        severity: 'info',
      });
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Priority 2: SEC supplier list (structured)
  if (secData?.supplierLocations && secData.supplierLocations.length > 0) {
    console.log(`[V5 Supply Integration] ✅ SEC SUPPLIER LIST found`);
    evidenceLevel = 'structured';

    const countryCount = new Map<string, number>();
    for (const supplier of secData.supplierLocations) {
      countryCount.set(supplier.country, (countryCount.get(supplier.country) || 0) + 1);
    }
    const total = secData.supplierLocations.length;

    for (const [country, count] of countryCount) {
      const weight = count / total;
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `SEC Supplier List (${count}/${total} suppliers)`,
        dataQuality: 'high',
        evidenceType: 'structured_table',
        fallbackType: 'none',
        tier: 'DIRECT',
      };
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Priority 3: Narrative evidence — Step 1.3 fix: admissible set ONLY from narrative
  // Fix 1 guard: Only proceed if narrative is non-empty (never from simulated text).
  // secData.supplyChainNarrativeContext is populated by secFilingParser from real SEC text,
  // so isSimulated is always false here; the guard is defensive.
  if (secData?.supplyChainNarrativeContext && secData.supplyChainNarrativeContext.trim().length > 0) {
    console.log(`[V5 Supply Integration] Checking narrative for admissible set...`);

    const { admissibleSet, excludesHomeCountry, signalStrength } = buildAdmissibleSetFromNarrative(
      secData.supplyChainNarrativeContext,
      homeCountry,
      ticker,
      false // isSimulated: always false — real SEC filing text
    );

    if (admissibleSet.length > 0) {
      console.log(`[V5 Supply] Admissible set P (${signalStrength} signal): ${admissibleSet.join(', ')}`);
      evidenceLevel = 'narrative';
      fallbackType = 'RF';

      const priorWeights = allocateWithPrior(admissibleSet, 'supply', sector);

      for (const [country, weight] of Object.entries(priorWeights)) {
        if (weight < 0.001) continue;
        channel[country] = {
          country,
          weight,
          state: 'known-positive',
          status: 'high_confidence_estimate',
          source: `Narrative admissible set → supply prior (${signalStrength} signal)`,
          dataQuality: 'medium',
          evidenceType: 'narrative',
          fallbackType: 'RF',
          tier: 'ALLOCATED',
        };
      }

      validations.push({
        channel: 'supply',
        rule: 'Admissible set from narrative (no template injection)',
        passed: true,
        message: `Built P from ${admissibleSet.length} narrative countries (${signalStrength} signal)${excludesHomeCountry ? `, ${homeCountry} excluded` : ''}`,
        severity: 'info',
      });

      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Last resort: V5 GF with supply prior
  console.log(`[V5 Supply Integration] ⚠️ No supply evidence — using V5 supply prior GF`);
  evidenceLevel = 'fallback';
  fallbackType = 'GF';

  const gfWeights = buildGlobalFallbackV5(homeCountry, 'supply', sector);
  for (const [country, weight] of Object.entries(gfWeights)) {
    if (weight < 0.002) continue;
    channel[country] = {
      country,
      weight,
      state: 'unknown',
      status: 'fallback',
      source: `V5 Supply Prior GF (manufacturing-weighted, no evidence)`,
      dataQuality: 'low',
      evidenceType: 'fallback',
      fallbackType: 'GF',
      tier: 'MODELED',
    };
  }

  validations.push({
    channel: 'supply',
    rule: 'Supplier evidence preferred',
    passed: false,
    message: 'No supplier evidence found — using V5 supply prior (MODELED)',
    severity: 'warning',
  });

  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// PHYSICAL ASSETS CHANNEL INTEGRATION V5
// ============================================================================

export async function integrateAssetsChannelV5(
  secData: ParsedSECData | null,
  sustainabilityData: SustainabilityReportData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): Promise<{
  channel: Record<string, IntegratedChannelDataV5>;
  evidenceLevel: 'structured' | 'narrative' | 'fallback';
  validations: ValidationResultV5[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
}> {
  const channel: Record<string, IntegratedChannelDataV5> = {};
  const validations: ValidationResultV5[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;

  console.log(`\n[V5 Assets Integration] ========================================`);
  console.log(`[V5 Assets Integration] ${ticker} | ${sector} | home: ${homeCountry}`);

  // Priority 1: Exhibit 21
  if (secData?.exhibit21Found && secData.exhibit21Data && secData.exhibit21Data.totalSubsidiaries > 0) {
    console.log(`[V5 Assets Integration] ✅ EXHIBIT 21 — primary evidence`);
    evidenceLevel = 'structured';
    fallbackType = undefined;

    const { exhibit21ToChannelWeights } = await import('../dataIntegration/exhibit21Parser');
    const exhibit21Weights = exhibit21ToChannelWeights(secData.exhibit21Data, 'assets');

    for (const [country, weight] of Object.entries(exhibit21Weights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `Exhibit 21 (${secData.exhibit21Data.totalSubsidiaries} subsidiaries)`,
        dataQuality: 'high',
        evidenceType: 'exhibit_21',
        fallbackType: 'none',
        tier: 'DIRECT',
      };
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Priority 2: PP&E Table — Step 1.2 fix: use asset prior for region splits
  if (secData?.ppeTableFound && secData.ppeSegments.length > 0) {
    console.log(`[V5 Assets Integration] ✅ PP&E TABLE — secondary evidence`);
    evidenceLevel = 'structured';
    fallbackType = 'SSF';

    for (const segment of secData.ppeSegments) {
      const regionName = segment.region;
      const ppeWeight = segment.ppePercentage / 100;

      if (isActualCountry(regionName)) {
        const countryName = normalizeCountryName(regionName);
        console.log(`[V5 Assets] DIRECT PP&E: "${regionName}" = ${(ppeWeight * 100).toFixed(2)}%`);

        channel[countryName] = {
          country: countryName,
          weight: ppeWeight,
          state: 'known-positive',
          status: 'evidence',
          source: `SEC PP&E Table: ${regionName} (${segment.fiscalYear})`,
          dataQuality: 'high',
          evidenceType: 'structured_table',
          fallbackType: 'none',
          tier: 'DIRECT',
          rawData: segment,
        };
      } else {
        console.log(`[V5 Assets] REGION PP&E: "${regionName}" = ${(ppeWeight * 100).toFixed(2)}% → prior allocation`);

        const regionMembers: string[] = [];
        const fromName = getRegionMembersFromName(regionName);
        if (fromName.length > 0 && fromName[0] !== RESIDUAL_SENTINEL) {
          regionMembers.push(...fromName);
        } else if (isKnownRegion(regionName)) {
          const rc = getRegionCountries(regionName);
          if (rc) regionMembers.push(...rc);
        }

        if (regionMembers.length > 0) {
          const sectorPriors = getSectorAssetPriors(sector);
          const priorWeights = allocateWithinRegionUsingAssetPrior(regionMembers, ppeWeight, sectorPriors);

          for (const [country, weight] of Object.entries(priorWeights)) {
            if (weight < 0.0001) continue;
            channel[country] = {
              country,
              weight,
              state: 'known-positive',
              status: 'high_confidence_estimate',
              source: `PP&E region "${regionName}" (${(ppeWeight * 100).toFixed(1)}%) → asset prior split`,
              dataQuality: 'medium',
              evidenceType: 'structured_table',
              fallbackType: 'SSF',
              tier: 'ALLOCATED',
              rawData: segment,
            };
          }
        } else {
          const regionAlloc = allocateRegionWithPrior(regionName, ppeWeight, 'assets', sector);
          for (const [country, data] of Object.entries(regionAlloc)) {
            channel[country] = data;
          }
        }
      }
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Priority 3: Sustainability report facilities
  if (sustainabilityData && sustainabilityData.facilities.length > 0) {
    console.log(`[V5 Assets Integration] ✅ SUSTAINABILITY FACILITIES`);
    evidenceLevel = 'structured';

    const { sustainabilityToChannelWeights } = await import('../dataIntegration/sustainabilityReportParser');
    const sustainabilityWeights = sustainabilityToChannelWeights(sustainabilityData, 'assets');

    for (const [country, weight] of Object.entries(sustainabilityWeights)) {
      if (!(country in channel)) {
        channel[country] = {
          country,
          weight,
          state: 'known-positive',
          status: 'high_confidence_estimate',
          source: `Sustainability Report ${sustainabilityData.reportYear} (${sustainabilityData.totalFacilities} facilities)`,
          dataQuality: 'medium',
          evidenceType: 'sustainability_report',
          fallbackType: 'none',
          tier: 'ALLOCATED',
        };
      }
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Priority 4: SEC facility locations (narrative)
  if (secData?.facilityLocations && secData.facilityLocations.length > 0) {
    console.log(`[V5 Assets Integration] ✅ FACILITY LOCATIONS (narrative)`);
    if (evidenceLevel === 'fallback') evidenceLevel = 'narrative';

    const countryFacilities = new Map<string, number>();
    for (const facility of secData.facilityLocations) {
      countryFacilities.set(facility.country, (countryFacilities.get(facility.country) || 0) + 1);
    }
    const totalFacilities = secData.facilityLocations.length;

    for (const [country, count] of countryFacilities) {
      if (!(country in channel)) {
        channel[country] = {
          country,
          weight: count / totalFacilities,
          state: 'known-positive',
          status: 'evidence',
          source: `SEC Item 2 Properties (${count} facilities)`,
          dataQuality: 'medium',
          evidenceType: 'narrative',
          fallbackType: 'none',
          tier: 'ALLOCATED',
        };
      }
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }
  }

  // Last resort: V5 GF with asset prior
  if (Object.keys(channel).length === 0) {
    console.log(`[V5 Assets Integration] ⚠️ No asset evidence — using V5 GF (λ=0.35)`);
    evidenceLevel = 'fallback';
    fallbackType = 'GF';

    const gfWeights = buildGlobalFallbackV5(homeCountry, 'assets', sector);
    for (const [country, weight] of Object.entries(gfWeights)) {
      if (weight < 0.001) continue;
      channel[country] = {
        country,
        weight,
        state: 'unknown',
        status: 'fallback',
        source: `V5 Asset Prior GF (capital-stock weighted, λ=0.35)`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };
    }

    validations.push({
      channel: 'assets',
      rule: 'PP&E/Exhibit 21 evidence preferred',
      passed: false,
      message: 'No asset evidence found — using V5 GF prior (MODELED)',
      severity: 'warning',
    });
  }

  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// HELPERS for assets channel
// ============================================================================

function getSectorAssetPriors(sector: string): Record<string, number> {
  const lower = sector.toLowerCase();
  if (lower.includes('tech') || lower.includes('software') || lower.includes('hardware')) {
    return TECH_ASSET_PRIORS;
  }
  if (lower.includes('manuf') || lower.includes('industrial') || lower.includes('auto')) {
    return MANUFACTURING_ASSET_PRIORS;
  }
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('gas')) {
    return ENERGY_ASSET_PRIORS;
  }
  return TECH_ASSET_PRIORS;
}

function allocateWithinRegionUsingAssetPrior(
  countries: string[],
  totalWeight: number,
  sectorPriors: Record<string, number>
): Record<string, number> {
  let priorSum = 0;
  const priors: Record<string, number> = {};

  for (const country of countries) {
    const prior = sectorPriors[country] || 0.01;
    priors[country] = prior;
    priorSum += prior;
  }

  const result: Record<string, number> = {};
  if (priorSum > 0) {
    for (const country of countries) {
      result[country] = (priors[country] / priorSum) * totalWeight;
    }
  } else {
    for (const country of countries) {
      result[country] = totalWeight / countries.length;
    }
  }
  return result;
}

// ============================================================================
// FINANCIAL CHANNEL INTEGRATION V5
// ============================================================================

export function integrateFinancialChannelV5(
  secData: ParsedSECData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): {
  channel: Record<string, IntegratedChannelDataV5>;
  evidenceLevel: 'structured' | 'narrative' | 'fallback';
  validations: ValidationResultV5[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
} {
  const channel: Record<string, IntegratedChannelDataV5> = {};
  const validations: ValidationResultV5[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;

  console.log(`\n[V5 Financial Integration] ========================================`);
  console.log(`[V5 Financial Integration] ${ticker} | ${sector} | home: ${homeCountry}`);

  // Priority 1: Structured debt table
  if (secData?.debtTableFound && secData.debtSecurities.length > 0) {
    console.log(`[V5 Financial Integration] ✅ STRUCTURED DEBT TABLE`);
    evidenceLevel = 'structured';
    fallbackType = undefined;

    const jurisdictionAmounts = new Map<string, number>();
    let totalPrincipal = 0;

    for (const security of secData.debtSecurities) {
      jurisdictionAmounts.set(
        security.jurisdiction,
        (jurisdictionAmounts.get(security.jurisdiction) || 0) + security.principalAmount
      );
      totalPrincipal += security.principalAmount;
    }

    for (const [jurisdiction, amount] of jurisdictionAmounts) {
      const weight = amount / totalPrincipal;
      channel[jurisdiction] = {
        country: jurisdiction,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `SEC Debt Securities Table`,
        dataQuality: 'high',
        evidenceType: 'structured_table',
        fallbackType: 'none',
        tier: 'DIRECT',
      };
    }

    const coverage = getEvidenceCoverage(channel);
    if (coverage >= 0.95) {
      return { channel, evidenceLevel, validations, fallbackType };
    }

    const remainder = 1.0 - coverage;
    const excludeCountries = Object.keys(channel);
    const allCountries = Object.keys(buildGlobalFallbackV5(homeCountry, 'financial', sector));
    const eligibleCountries = allCountries.filter(c => !excludeCountries.includes(c));
    const priorWeights = allocateWithPrior(eligibleCountries, 'financial', sector, remainder);

    for (const [country, weight] of Object.entries(priorWeights)) {
      if (weight < 0.001) continue;
      channel[country] = {
        country,
        weight,
        state: 'unknown',
        status: 'fallback',
        source: `Financial Prior GF (remainder ${(remainder * 100).toFixed(1)}%)`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };
    }

    return { channel, evidenceLevel, validations, fallbackType };
  }

  // Priority 2: Treasury centers (narrative)
  if (secData?.treasuryCenters && secData.treasuryCenters.length > 0) {
    console.log(`[V5 Financial Integration] ✅ TREASURY CENTERS (narrative)`);
    evidenceLevel = 'narrative';
    fallbackType = undefined;

    const weight = 1.0 / secData.treasuryCenters.length;
    for (const center of secData.treasuryCenters) {
      channel[center] = {
        country: center,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: 'SEC Filing Treasury Center Mention',
        dataQuality: 'medium',
        evidenceType: 'narrative',
        fallbackType: 'none',
        tier: 'ALLOCATED',
      };
    }

    return { channel, evidenceLevel, validations, fallbackType };
  }

  // Last resort: V5 GF with financial depth prior
  console.log(`[V5 Financial Integration] ⚠️ No financial evidence — using V5 GF (financial depth prior)`);
  evidenceLevel = 'fallback';
  fallbackType = 'GF';

  const gfWeights = buildGlobalFallbackV5(homeCountry, 'financial', sector);
  for (const [country, weight] of Object.entries(gfWeights)) {
    if (weight < 0.005) continue;
    channel[country] = {
      country,
      weight,
      state: 'unknown',
      status: 'fallback',
      source: `V5 Financial Depth Prior GF (BIS/financial-center weighted)`,
      dataQuality: 'low',
      evidenceType: 'fallback',
      fallbackType: 'GF',
      tier: 'MODELED',
    };
  }

  validations.push({
    channel: 'financial',
    rule: 'Debt evidence preferred',
    passed: false,
    message: 'No debt securities or treasury centers found — using V5 GF prior (MODELED)',
    severity: 'warning',
  });

  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// EXPORT
// ============================================================================

export const structuredDataIntegratorV5 = {
  integrateRevenueChannelV5,
  integrateSupplyChannelV5,
  integrateAssetsChannelV5,
  integrateFinancialChannelV5,
  allocateRegionWithPrior,
  buildAdmissibleSetFromNarrative,
};

// Suppress unused import warning for determineTier (used for documentation only)
void determineTier;