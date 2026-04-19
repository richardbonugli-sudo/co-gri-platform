/**
 * CO-GRI Calculation Pipeline
 * Authoritative implementation from specification Part 5
 * 
 * CRITICAL GUARDRAILS:
 * 1. W^c (alignment modifier) modifies shock S_c, NOT exposure weights
 * 2. Sector multiplier applied ONLY at final aggregation
 * 3. Exposures must be normalized before applying adjusted shock
 */

import { CompanyExposure, ExposureChannels } from '@/types/company';
import { CountryShock } from '@/types/country';
import { AlignmentData, AlignmentFactors } from '@/types/global';

// Channel weights for blending exposures
export const CHANNEL_WEIGHTS = {
  REVENUE: 0.35,
  SUPPLY_CHAIN: 0.30,
  PHYSICAL_ASSETS: 0.20,
  FINANCIAL: 0.10,
} as const;

// Default alignment sensitivity parameter
export const LAMBDA = 0.50;

/**
 * Step 2: Blend exposures with channel weights
 * Combines four exposure channels into a single geographic exposure weight
 */
export function blendExposures(exposure: ExposureChannels): number {
  return (
    CHANNEL_WEIGHTS.REVENUE * exposure.W_R +
    CHANNEL_WEIGHTS.SUPPLY_CHAIN * exposure.W_S +
    CHANNEL_WEIGHTS.PHYSICAL_ASSETS * exposure.W_P +
    CHANNEL_WEIGHTS.FINANCIAL * exposure.W_F
  );
}

/**
 * Step 3: Normalize exposures (sum = 1)
 * Ensures that all geographic weights sum to 1.0
 */
export function normalizeExposures(
  exposures: Map<string, ExposureChannels>
): Map<string, number> {
  const W_geo_map = new Map<string, number>();
  let sum_W_geo = 0;

  // Calculate W_geo for each country
  for (const [country, exposure] of exposures) {
    const W_geo = blendExposures(exposure);
    W_geo_map.set(country, W_geo);
    sum_W_geo += W_geo;
  }

  // Normalize
  const W_norm_map = new Map<string, number>();
  for (const [country, W_geo] of W_geo_map) {
    W_norm_map.set(country, W_geo / sum_W_geo);
  }

  return W_norm_map;
}

/**
 * Step 4: Compute alignment modifier W^c
 * Averages three alignment factors: UN voting, treaties, economic dependence
 */
export function calculateAlignmentModifier(alignment: AlignmentFactors): number {
  return (alignment.UNAlign + alignment.TreatyAlign + alignment.EconDepend) / 3;
}

/**
 * Step 5: Adjust country shock S_c using alignment → AdjS_c
 * CRITICAL: This is where W^c modifies the shock, NOT the exposure
 * 
 * Formula: AdjS_c = S_c * (1 - λ * W_c)
 * 
 * Interpretation:
 * - High alignment (W^c → 1) reduces perceived risk
 * - Low alignment (W^c → 0) means full shock applies
 * - λ controls sensitivity (0.5 = moderate, 1.0 = full dampening)
 */
export function adjustShock(S_c: number, W_c: number, lambda: number = LAMBDA): number {
  return S_c * (1 - lambda * W_c);
}

/**
 * Step 6: Calculate country contribution Risk_{i,c}
 * Multiplies normalized exposure by adjusted shock
 */
export function calculateCountryRisk(W_norm: number, AdjS: number): number {
  return W_norm * AdjS;
}

/**
 * Step 7: Aggregate + apply sector multiplier → CO-GRI_i
 * CRITICAL: Sector multiplier applied ONLY at final aggregation
 * 
 * Formula: CO_GRI = (Σ Risk_{i,c}) * M_sector
 */
export function aggregateCOGRI(
  countryRisks: Map<string, number>,
  M_sector: number
): number {
  const sum_risk = Array.from(countryRisks.values()).reduce((a, b) => a + b, 0);
  return sum_risk * M_sector;
}

/**
 * Complete CO-GRI Pipeline
 * End-to-end calculation with all intermediate steps tracked
 */
export interface COGRIResult {
  CO_GRI: number;
  countryRisks: Map<string, number>;
  intermediateSteps: {
    W_geo: Record<string, number>;
    W_norm: Record<string, number>;
    W_c: Record<string, number>;
    AdjS: Record<string, number>;
  };
}

export function calculateCompanyCOGRI(
  company: CompanyExposure,
  shocks: Map<string, CountryShock>,
  alignments: Map<string, AlignmentData>,
  lambda: number = LAMBDA
): COGRIResult {
  // Step 1: Input validation
  if (!company.exposures || Object.keys(company.exposures).length === 0) {
    throw new Error('Company has no exposure data');
  }

  // Step 2: Blend exposures
  const W_geo_map = new Map<string, number>();
  for (const [country, exposure] of Object.entries(company.exposures)) {
    W_geo_map.set(country, blendExposures(exposure));
  }

  // Step 3: Normalize
  const sum_W_geo = Array.from(W_geo_map.values()).reduce((a, b) => a + b, 0);
  const W_norm_map = new Map<string, number>();
  for (const [country, W_geo] of W_geo_map) {
    W_norm_map.set(country, W_geo / sum_W_geo);
  }

  // Step 4-6: Calculate country risks
  const countryRisks = new Map<string, number>();
  const W_c_map = new Map<string, number>();
  const AdjS_map = new Map<string, number>();

  for (const [country, W_norm] of W_norm_map) {
    const shock = shocks.get(country);
    if (!shock) {
      console.warn(`No shock data for country: ${country}`);
      continue;
    }

    const alignment = alignments.get(`${company.home_country}-${country}`);
    const W_c = alignment ? calculateAlignmentModifier(alignment) : 0;
    const AdjS = adjustShock(shock.S_c, W_c, lambda);
    const risk = calculateCountryRisk(W_norm, AdjS);

    W_c_map.set(country, W_c);
    AdjS_map.set(country, AdjS);
    countryRisks.set(country, risk);
  }

  // Step 7: Aggregate + sector multiplier
  const CO_GRI = aggregateCOGRI(countryRisks, company.M_sector);

  return {
    CO_GRI,
    countryRisks,
    intermediateSteps: {
      W_geo: Object.fromEntries(W_geo_map),
      W_norm: Object.fromEntries(W_norm_map),
      W_c: Object.fromEntries(W_c_map),
      AdjS: Object.fromEntries(AdjS_map),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplified API used by cogriPipeline.test.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface SimpleCompanyExposure {
  companyId: string;
  companyName?: string;
  /** Supports both simple number weights and ExposureChannels objects */
  exposures: Record<string, number | ExposureChannels>;
  lastUpdated?: string;
}

export interface SimpleCountryShock {
  /** Simple API: countryCode + totalShock */
  countryCode?: string;
  /** Full CountryShock API: country + S_c */
  country?: string;
  date?: string;
  shocks?: Record<string, number>;
  totalShock?: number;
  S_c?: number;
}

export interface SimpleCOGRIResult {
  companyId: string;
  companyName: string;
  cogriScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

/** Classify a CO-GRI score into a risk level */
function classifyRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 70) return 'Critical';
  if (score >= 45) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

/**
 * Resolve a raw exposure value (number or ExposureChannels) to a single weight.
 * For ExposureChannels, blend using default channel weights.
 */
function resolveExposureWeight(raw: number | ExposureChannels): number {
  if (typeof raw === 'number') return raw;
  return blendExposures(raw);
}

/**
 * Resolve a shock entry to { key, value } where key is the country identifier
 * and value is the shock magnitude (0–100).
 * Supports both SimpleCountryShock (countryCode/totalShock) and
 * full CountryShock (country/S_c) shapes.
 */
function resolveShock(s: SimpleCountryShock): { key: string; value: number } | null {
  const key = s.countryCode ?? s.country ?? null;
  const value = s.totalShock ?? s.S_c ?? null;
  if (key === null || value === null) return null;
  return { key, value };
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateCOGRI — unified overloaded function
//
// Overload 1 (src/tests/unit/cogriPipeline.test.ts):
//   calculateCOGRI(countryRisks: Map<string, number>, M_sector: number): number
//   → identical to aggregateCOGRI; returns a plain number
//
// Overload 2 (src/services/calculations/__tests__/cogriPipeline.test.ts):
//   calculateCOGRI(company: SimpleCompanyExposure, countryShocks: SimpleCountryShock[]): SimpleCOGRIResult
//   → simplified pipeline; returns { companyId, companyName, cogriScore, riskLevel }
// ─────────────────────────────────────────────────────────────────────────────

export function calculateCOGRI(
  countryRisks: Map<string, number>,
  M_sector: number
): number;
export function calculateCOGRI(
  company: SimpleCompanyExposure | (CompanyExposure & { companyId?: string; companyName?: string }),
  countryShocks: SimpleCountryShock[]
): SimpleCOGRIResult;
export function calculateCOGRI(
  companyOrRisks:
    | Map<string, number>
    | SimpleCompanyExposure
    | (CompanyExposure & { companyId?: string; companyName?: string }),
  shocksOrMultiplier: SimpleCountryShock[] | number
): number | SimpleCOGRIResult {
  // ── Overload 1: (Map<string, number>, number) → number ──
  if (companyOrRisks instanceof Map && typeof shocksOrMultiplier === 'number') {
    const sum_risk = Array.from((companyOrRisks as Map<string, number>).values()).reduce(
      (a, b) => a + b,
      0
    );
    return sum_risk * shocksOrMultiplier;
  }

  // ── Overload 2: (company, countryShocks[]) → SimpleCOGRIResult ──
  const company = companyOrRisks as
    | SimpleCompanyExposure
    | (CompanyExposure & { companyId?: string; companyName?: string });
  const countryShocks = shocksOrMultiplier as SimpleCountryShock[];

  // Resolve company identity — handle both SimpleCompanyExposure and CompanyExposure
  const companyId =
    (company as SimpleCompanyExposure).companyId ??
    (company as CompanyExposure).company_id ??
    (company as CompanyExposure).ticker ??
    'UNKNOWN';
  const companyName =
    (company as SimpleCompanyExposure).companyName ??
    (company as CompanyExposure).name ??
    companyId;

  // Build shock lookup: country key → shock magnitude
  const shockMap = new Map<string, number>();
  for (const s of countryShocks) {
    const resolved = resolveShock(s);
    if (resolved) shockMap.set(resolved.key, resolved.value);
  }

  // Handle empty exposures
  const exposureEntries = Object.entries(company.exposures ?? {});
  if (exposureEntries.length === 0) {
    return { companyId, companyName, cogriScore: 0, riskLevel: 'Low' };
  }

  // Resolve all exposure weights (blend if ExposureChannels)
  const rawWeights: Array<{ country: string; weight: number }> = exposureEntries.map(
    ([country, raw]) => ({ country, weight: resolveExposureWeight(raw as number | ExposureChannels) })
  );

  // Normalise weights so they sum to 1 (required when using ExposureChannels)
  const totalWeight = rawWeights.reduce((s, e) => s + e.weight, 0);
  const normWeights =
    totalWeight > 0
      ? rawWeights.map(e => ({ ...e, weight: e.weight / totalWeight }))
      : rawWeights;

  // Compute weighted score
  let cogriScore = 0;
  for (const { country, weight } of normWeights) {
    const shock = shockMap.get(country);
    if (shock !== undefined) {
      cogriScore += weight * shock;
    }
  }

  return {
    companyId,
    companyName,
    cogriScore,
    riskLevel: classifyRiskLevel(cogriScore),
  };
}

/**
 * Normalize a score to the 0–100 range (clamp).
 */
export function normalizeScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/**
 * Apply an alignment modifier to a base score.
 * alignment ∈ [-1, 1]:
 *   positive → reduces risk (good alignment)
 *   negative → increases risk (adversarial alignment)
 * Formula: modified = baseScore * (1 - 0.3 * alignment)
 * Result is clamped to [0, 100].
 */
export function applyAlignmentModifier(baseScore: number, alignment: number): number {
  const modified = baseScore * (1 - 0.3 * alignment);
  return Math.min(100, Math.max(0, modified));
}

/**
 * Calculate channel contributions
 * Shows how risk is distributed across the four transmission channels
 */
export interface ChannelContribution {
  channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  share: number;  // Percentage [0,100]
  risk_value: number;
}

export function calculateChannelContributions(
  company: CompanyExposure,
  shocks: Map<string, CountryShock>,
  alignments: Map<string, AlignmentData>
): ChannelContribution[] {
  const channelRisks: Record<string, number> = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0,
  };

  for (const [country, exposure] of Object.entries(company.exposures)) {
    const shock = shocks.get(country);
    if (!shock) continue;

    const alignment = alignments.get(`${company.home_country}-${country}`);
    const W_c = alignment ? calculateAlignmentModifier(alignment) : 0;
    const AdjS = adjustShock(shock.S_c, W_c);

    channelRisks.revenue += (CHANNEL_WEIGHTS.REVENUE * exposure.W_R) * AdjS;
    channelRisks.supply_chain += (CHANNEL_WEIGHTS.SUPPLY_CHAIN * exposure.W_S) * AdjS;
    channelRisks.physical_assets += (CHANNEL_WEIGHTS.PHYSICAL_ASSETS * exposure.W_P) * AdjS;
    channelRisks.financial += (CHANNEL_WEIGHTS.FINANCIAL * exposure.W_F) * AdjS;
  }

  const totalRisk = Object.values(channelRisks).reduce((a, b) => a + b, 0);

  return [
    {
      channel: 'Revenue',
      share: (channelRisks.revenue / totalRisk) * 100,
      risk_value: channelRisks.revenue,
    },
    {
      channel: 'Supply Chain',
      share: (channelRisks.supply_chain / totalRisk) * 100,
      risk_value: channelRisks.supply_chain,
    },
    {
      channel: 'Physical Assets',
      share: (channelRisks.physical_assets / totalRisk) * 100,
      risk_value: channelRisks.physical_assets,
    },
    {
      channel: 'Financial',
      share: (channelRisks.financial / totalRisk) * 100,
      risk_value: channelRisks.financial,
    },
  ];
}