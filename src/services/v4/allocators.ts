/**
 * Allocation Functions - V.4 Compliant
 *
 * SSF, RF, and GF allocation implementations.
 * PRIORITY 2 FIX: Added channel-specific fallback isolation.
 *
 * TASK 4 FIX: `applySSF`, `applyRF`, and `applyGF` now delegate magnitude
 * assignment to V5 channel-specific priors (`allocateWithPrior` /
 * `buildGlobalFallbackV5`) instead of the legacy GDP-only
 * `getIndustryDemandProxy` / `applyGFWeights` formulas.
 *
 * The legacy helpers (`_legacyGetIndustryDemandProxy`, `_legacyGetRFScore`,
 * `_legacyApplyGFWeights`) are retained below as `@deprecated` for emergency
 * rollback — they are no longer called by any exported function.
 */

import { GLOBAL_COUNTRIES } from './labelResolution';
import {
  allocateWithPrior,
  buildGlobalFallbackV5,
  type ChannelType,
} from '../v5/channelPriors';

// ── Channel string normaliser ─────────────────────────────────────────────────
// V4 uses uppercase channel strings (e.g. 'SUPPLY', 'FINANCIAL').
// V5 channelPriors expects lowercase ('supply', 'financial').
function toV5Channel(channel: string): ChannelType {
  return channel.toLowerCase() as ChannelType;
}

// ============================================================================
// EXPORTED ALLOCATION FUNCTIONS (V5-backed)
// ============================================================================

/**
 * Apply SSF (Segment-Specific Fallback) allocation.
 *
 * TASK 4 FIX: Magnitude assignment now uses `allocateWithPrior()` (V5
 * channel-specific prior) instead of the legacy `getIndustryDemandProxy`
 * GDP-only formula.  The admissible set is still determined by region
 * membership (the `members` argument) — unchanged from V4.
 *
 * Weight only inside members; total allocated equals labelTotalWeight.
 *
 * Supports both call signatures for backward compatibility:
 *   Legacy (v4Orchestrator):  applySSF(members, sector, channel)          → weight=1.0
 *   New (direct):             applySSF(members, labelTotalWeight, sector, channel)
 */
export function applySSF(
  members: Set<string>,
  sectorOrWeight: string | number,
  channelOrSector: string,
  channel?: string
): Map<string, number> {
  // Normalise overloaded arguments
  let labelTotalWeight: number;
  let sector: string;
  let ch: string;

  if (channel === undefined) {
    // Legacy 3-arg call: applySSF(members, sector, channel)
    labelTotalWeight = 1.0;
    sector = sectorOrWeight as string;
    ch = channelOrSector;
  } else {
    // New 4-arg call: applySSF(members, labelTotalWeight, sector, channel)
    labelTotalWeight = sectorOrWeight as number;
    sector = channelOrSector;
    ch = channel;
  }

  const membersArray = Array.from(members);

  if (membersArray.length === 0) {
    return new Map();
  }

  // V5 channel-specific prior allocation (replaces legacy GDP proxy)
  const allocated = allocateWithPrior(
    membersArray,
    toV5Channel(ch),
    sector,
    labelTotalWeight
  );

  const out = new Map<string, number>();
  for (const [country, weight] of Object.entries(allocated)) {
    if (weight > 0) {
      out.set(country, weight);
    }
  }

  // Fallback: if V5 prior produced nothing, use uniform distribution
  if (out.size === 0) {
    return _uniform(membersArray, labelTotalWeight);
  }

  return out;
}

/**
 * Apply RF (Restricted Fallback) allocation.
 *
 * TASK 4 FIX: Magnitude assignment now uses `allocateWithPrior()` (V5
 * channel-specific prior) instead of the legacy `getRFScore` GDP × channel
 * multiplier formula.  The restricted set P is still determined by the
 * caller (V4 `buildRestrictedSetP`) — unchanged from V4.
 *
 * Weight inside P sums to targetWeight.
 *
 * Supports both call signatures for backward compatibility:
 *   Legacy (v4Orchestrator):  applyRF(P, sector, channel)          → weight=1.0
 *   New (direct):             applyRF(P, targetWeight, sector, channel)
 */
export function applyRF(
  P: Set<string>,
  targetWeightOrSector: number | string,
  sectorOrChannel: string,
  channel?: string
): Map<string, number> {
  // Normalise overloaded arguments
  let targetWeight: number;
  let sector: string;
  let ch: string;

  if (channel === undefined) {
    // Legacy 3-arg call: applyRF(P, sector, channel)
    targetWeight = 1.0;
    sector = targetWeightOrSector as string;
    ch = sectorOrChannel;
  } else {
    // New 4-arg call: applyRF(P, targetWeight, sector, channel)
    targetWeight = targetWeightOrSector as number;
    sector = sectorOrChannel;
    ch = channel;
  }

  const pArray = Array.from(P);

  if (pArray.length === 0) {
    return new Map();
  }

  // V5 channel-specific prior allocation (replaces legacy getRFScore formula)
  const allocated = allocateWithPrior(
    pArray,
    toV5Channel(ch),
    sector,
    targetWeight
  );

  const out = new Map<string, number>();
  for (const [country, weight] of Object.entries(allocated)) {
    if (weight > 0) {
      out.set(country, weight);
    }
  }

  // Fallback: if V5 prior produced nothing, use uniform distribution
  if (out.size === 0) {
    return _uniform(pArray, targetWeight);
  }

  return out;
}

/**
 * Apply GF (Global Fallback) allocation.
 *
 * TASK 4 FIX: Now delegates to `buildGlobalFallbackV5()` (V5 channel-specific
 * lambda + prior formula) instead of the legacy `_legacyApplyGFWeights`
 * GDP-only formula.
 *
 * `buildGlobalFallbackV5` returns a normalised distribution (sum = 1.0) over
 * all plausible countries; we scale by `targetWeight` to match the V4 contract.
 *
 * Supports both call signatures for backward compatibility:
 *   Legacy (v4Orchestrator):  applyGF(sector, channel)
 *     → targetWeight=1.0, homeCountry='United States'
 *   New (direct):             applyGF(targetWeight, sector, channel, homeCountry?, excludeForeignOnly?)
 */
export function applyGF(
  targetWeightOrSector: number | string,
  sectorOrChannel: string,
  channel?: string,
  homeCountry: string = 'United States',
  excludeForeignOnly: boolean = false
): Map<string, number> {
  // Normalise overloaded arguments
  let targetWeight: number;
  let sector: string;
  let ch: string;

  if (channel === undefined) {
    // Legacy 2-arg call: applyGF(sector, channel)
    targetWeight = 1.0;
    sector = targetWeightOrSector as string;
    ch = sectorOrChannel;
  } else {
    // New 4/5-arg call: applyGF(targetWeight, sector, channel, homeCountry?, excludeForeignOnly?)
    targetWeight = targetWeightOrSector as number;
    sector = sectorOrChannel;
    ch = channel;
  }

  // V5 GF formula: p_c = lambda*HomeBias(c) + (1-lambda)*GlobalPrior_channel_sector(c)
  const gfDistribution = buildGlobalFallbackV5(
    homeCountry,
    toV5Channel(ch),
    sector
  );

  const out = new Map<string, number>();
  for (const [country, share] of Object.entries(gfDistribution)) {
    // Respect excludeForeignOnly flag (RF Case C: domestic + foreign bucket)
    if (excludeForeignOnly && country === homeCountry) continue;

    const weight = share * targetWeight;
    if (weight >= 0.0001) { // 1 basis point micro-exposure filter
      out.set(country, weight);
    }
  }

  // Safety fallback: if V5 prior produced nothing, use legacy GDP weights
  if (out.size === 0) {
    let universe = [...GLOBAL_COUNTRIES];
    if (excludeForeignOnly) {
      universe = universe.filter(c => c !== homeCountry);
    }
    return _legacyApplyGFWeights(universe, targetWeight, sector, ch);
  }

  return out;
}

/**
 * Normalize country weights to sum to 1.0
 */
export function normalizeCountryWeights(
  countryWeights: Map<string, number>
): Map<string, number> {
  const total = Array.from(countryWeights.values()).reduce((sum, w) => sum + w, 0);

  if (total <= 0) {
    return new Map();
  }

  const out = new Map<string, number>();
  for (const [country, weight] of countryWeights.entries()) {
    out.set(country, weight / total);
  }

  return out;
}

/**
 * Merge and add allocations
 */
export function mergeAdd(
  map1: Map<string, number>,
  map2: Map<string, number>
): Map<string, number> {
  const out = new Map(map1);

  for (const [country, weight] of map2.entries()) {
    const existing = out.get(country) ?? 0;
    out.set(country, existing + weight);
  }

  return out;
}

/**
 * Remove locked countries and renormalize
 */
export function removeAndRenormalize(
  alloc: Map<string, number>,
  lockedCountries: Set<string>,
  targetTotal: number
): Map<string, number> {
  const out = new Map<string, number>();
  let sum = 0;

  for (const [country, weight] of alloc.entries()) {
    if (!lockedCountries.has(country)) {
      out.set(country, weight);
      sum += weight;
    }
  }

  if (sum > 0) {
    for (const [country, weight] of out.entries()) {
      out.set(country, (weight / sum) * targetTotal);
    }
  }

  return out;
}

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

/**
 * Uniform distribution helper (internal utility)
 */
function _uniform(countries: string[], totalWeight: number): Map<string, number> {
  const out = new Map<string, number>();
  const weight = totalWeight / countries.length;
  for (const country of countries) {
    out.set(country, weight);
  }
  return out;
}

// ============================================================================
// LEGACY HELPERS — retained for emergency rollback only.
// These are no longer called by any exported function (applySSF / applyRF /
// applyGF all delegate to V5 channel priors as of Task 4).
// ============================================================================

/**
 * @deprecated Replaced by `allocateWithPrior()` from `src/services/v5/channelPriors.ts`.
 *   Retained for emergency rollback only — no longer called by any exported function.
 *
 * Get industry demand proxy for SSF — GDP-based, no channel-specific lambda.
 */
function _legacyGetIndustryDemandProxy(
  country: string,
  _sector: string,
  _channel: string
): number {
  const gdpProxies: Record<string, number> = {
    'United States': 25.0, 'China': 18.0, 'Japan': 5.0, 'Germany': 4.5,
    'United Kingdom': 3.5, 'India': 3.5, 'France': 3.0, 'Italy': 2.5,
    'Brazil': 2.0, 'Canada': 2.0, 'South Korea': 1.8, 'Spain': 1.5,
    'Australia': 1.5, 'Mexico': 1.3, 'Indonesia': 1.2, 'Taiwan': 1.0,
    'Vietnam': 0.8, 'Singapore': 0.7, 'Hong Kong': 0.6, 'Switzerland': 0.8,
  };
  return gdpProxies[country] ?? 0.5;
}

/**
 * @deprecated Replaced by `allocateWithPrior()` from `src/services/v5/channelPriors.ts`.
 *   Retained for emergency rollback only — no longer called by any exported function.
 *
 * Get RF score for country — GDP × channel multiplier × sector multiplier.
 */
function _legacyGetRFScore(
  country: string,
  sector: string,
  channel: string
): number {
  const gdp = _legacyGetIndustryDemandProxy(country, sector, channel);
  let channelMultiplier = 1.0;

  if (channel === 'FINANCIAL') {
    if (country === 'United States') channelMultiplier = 2.0;
    else if (['United Kingdom', 'Switzerland', 'Hong Kong', 'Singapore', 'Luxembourg'].includes(country)) channelMultiplier = 1.6;
    else if (['Japan', 'Germany', 'France', 'Canada'].includes(country)) channelMultiplier = 1.3;
  } else if (channel === 'SUPPLY') {
    if (['China', 'Taiwan', 'Vietnam', 'South Korea'].includes(country)) channelMultiplier = 1.8;
    else if (['Thailand', 'Malaysia', 'India', 'Mexico'].includes(country)) channelMultiplier = 1.5;
    else if (['Japan', 'Germany', 'United States'].includes(country)) channelMultiplier = 1.3;
  } else if (channel === 'ASSETS') {
    if (['United States', 'China', 'Germany', 'Japan'].includes(country)) channelMultiplier = 1.4;
    else if (['United Kingdom', 'France', 'Canada', 'Australia'].includes(country)) channelMultiplier = 1.2;
  }

  let sectorMultiplier = 1.0;
  if (sector === 'Technology') {
    if (['United States', 'China', 'Japan', 'South Korea', 'Taiwan', 'Singapore'].includes(country)) sectorMultiplier = 1.5;
  } else if (sector === 'Energy') {
    if (['United States', 'Saudi Arabia', 'Russia', 'UAE', 'Kuwait', 'Norway'].includes(country)) sectorMultiplier = 1.8;
  } else if (sector === 'Financials') {
    if (['United States', 'United Kingdom', 'Switzerland', 'Hong Kong', 'Singapore'].includes(country)) sectorMultiplier = 1.6;
  }

  return gdp * channelMultiplier * sectorMultiplier;
}

/**
 * @deprecated Replaced by `buildGlobalFallbackV5()` from `src/services/v5/channelPriors.ts`.
 *   Retained as emergency fallback inside `applyGF()` only (used when V5 prior returns empty).
 *
 * Apply GF weights — GDP-based prior, no channel-specific lambda.
 */
function _legacyApplyGFWeights(
  universe: string[],
  targetWeight: number,
  sector: string,
  channel: string
): Map<string, number> {
  if (universe.length === 0) return new Map();

  let totalGDP = 0;
  const gdp: Record<string, number> = {};

  for (const country of universe) {
    const g = _legacyGetIndustryDemandProxy(country, sector, channel);
    gdp[country] = g;
    totalGDP += g;
  }

  const out = new Map<string, number>();
  for (const country of universe) {
    out.set(country, (gdp[country] / totalGDP) * targetWeight);
  }

  return out;
}

// Suppress "declared but never read" warnings for legacy helpers retained for rollback.
void (_legacyGetRFScore as unknown);