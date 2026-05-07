/**
 * Runtime Validation Service
 * Task 1 (R6): Provides per-ticker execution path tracing and channel quality metrics.
 *
 * For each ticker this service reports:
 *  - Exact execution path: live-edgar | static-snapshot-fallback | gf-fallback
 *  - Channel evidence quality matrix (DIRECT/ALLOCATED/MODELED/FALLBACK per channel)
 *  - Channel differentiation score (0=homogeneous, 1=well-differentiated)
 *  - Fallback audit (countries using GF vs DIRECT)
 *  - Score uncertainty band
 *  - Pipeline timing
 */

import type { CountryExposure } from '@/services/cogriCalculationService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ExecutionPath = 'live-edgar' | 'static-snapshot-fallback' | 'gf-fallback';
export type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';

export interface ChannelQualityEntry {
  tier: EvidenceTier;
  weight: number;
  source: string;
}

export interface CountryChannelMatrix {
  country: string;
  revenue: ChannelQualityEntry;
  supply: ChannelQualityEntry;
  assets: ChannelQualityEntry;
  financial: ChannelQualityEntry;
  blendedWeight: number;
}

export interface ValidationReport {
  ticker: string;
  generatedAt: string;
  pipelineMs: number;

  /** Execution path taken */
  executionPath: ExecutionPath;
  executionPathDetail: string;

  /** Whether company-specific static data exists */
  hasCompanySpecificData: boolean;
  /** Whether live SEC EDGAR data was used */
  usedLiveEdgar: boolean;
  /** Whether SEC integration was attempted and succeeded */
  secIntegrationSuccess: boolean;

  /** Per-country channel quality matrix */
  channelMatrix: CountryChannelMatrix[];

  /** Aggregated evidence tier counts per channel */
  channelSummary: {
    revenue: Record<EvidenceTier, number>;
    supply: Record<EvidenceTier, number>;
    assets: Record<EvidenceTier, number>;
    financial: Record<EvidenceTier, number>;
  };

  /** Channel differentiation score 0–1 */
  differentiationScore: number;
  differentiationDetail: string;

  /** Fallback audit */
  fallbackAudit: {
    totalCountries: number;
    directCountries: number;
    allocatedCountries: number;
    modeledCountries: number;
    fallbackCountries: number;
    gfFallbackCountries: string[];
    directCountryList: string[];
  };

  /** Score uncertainty band */
  scoreUncertainty: number;
  finalScore: number;

  /** Data source consistency check */
  dataSourceConsistency: {
    exposurePathwaysSource: string;
    topRiskContributorsSource: string;
    sameObject: boolean;
    divergencePoint: string | null;
  };

  /** Recommendations */
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function emptyTierCounts(): Record<EvidenceTier, number> {
  return { DIRECT: 0, ALLOCATED: 0, MODELED: 0, FALLBACK: 0 };
}

/**
 * Compute channel differentiation score.
 * Compares per-country weight vectors across the four channels.
 * Score = 1 - avg_cosine_similarity(channel_pairs).
 * A score near 0 means all channels are identical (homogeneous).
 * A score near 1 means channels are fully independent.
 */
function computeDifferentiationScore(matrix: CountryChannelMatrix[]): {
  score: number;
  detail: string;
} {
  if (matrix.length === 0) return { score: 0, detail: 'No data' };

  const revVec = matrix.map(r => r.revenue.weight);
  const supVec = matrix.map(r => r.supply.weight);
  const astVec = matrix.map(r => r.assets.weight);
  const finVec = matrix.map(r => r.financial.weight);

  const cosSim = (a: number[], b: number[]): number => {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    if (normA === 0 || normB === 0) return 1;
    return dot / (normA * normB);
  };

  const pairs = [
    ['Revenue vs Supply', cosSim(revVec, supVec)],
    ['Revenue vs Assets', cosSim(revVec, astVec)],
    ['Revenue vs Financial', cosSim(revVec, finVec)],
    ['Supply vs Assets', cosSim(supVec, astVec)],
    ['Supply vs Financial', cosSim(supVec, finVec)],
    ['Assets vs Financial', cosSim(astVec, finVec)],
  ] as [string, number][];

  const avgSim = pairs.reduce((s, [, v]) => s + v, 0) / pairs.length;
  const score = parseFloat((1 - avgSim).toFixed(3));

  const worstPair = pairs.sort((a, b) => b[1] - a[1])[0];
  const detail =
    score < 0.05
      ? `⚠️ HOMOGENEOUS — channels nearly identical (avg cosine sim=${avgSim.toFixed(3)}). Most similar: ${worstPair[0]} (${worstPair[1].toFixed(3)})`
      : score < 0.2
      ? `⚠️ LOW DIFFERENTIATION — channels partially distinct (avg cosine sim=${avgSim.toFixed(3)})`
      : `✅ WELL DIFFERENTIATED — channels distinct (avg cosine sim=${avgSim.toFixed(3)})`;

  return { score, detail };
}

/**
 * Build a channel quality entry from raw channel data on a CountryExposure.
 */
function channelEntryFromExposure(
  channelName: 'revenue' | 'supply' | 'assets' | 'financial',
  exposure: CountryExposure
): ChannelQualityEntry {
  const w = exposure.channelWeights;
  const weight =
    channelName === 'revenue'
      ? w?.revenue ?? 0
      : channelName === 'supply'
      ? w?.supply ?? 0
      : channelName === 'assets'
      ? w?.assets ?? 0
      : w?.financial ?? 0;

  const tier: EvidenceTier =
    exposure.tier === 'DIRECT'
      ? 'DIRECT'
      : exposure.tier === 'ALLOCATED'
      ? 'ALLOCATED'
      : exposure.tier === 'MODELED'
      ? 'MODELED'
      : 'FALLBACK';

  return {
    tier,
    weight,
    source: exposure.status === 'evidence' ? 'SEC/Company-Specific' : exposure.status === 'high_confidence_estimate' ? 'Allocated/Derived' : 'GF Fallback',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Report Generator
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationReportInput {
  ticker: string;
  countryExposures: CountryExposure[];
  finalScore: number;
  scoreUncertainty: number;
  /** Raw geo data returned by geographicExposureService */
  geoData: {
    hasVerifiedData?: boolean;
    secFilingIntegration?: {
      revenueTableFound: boolean;
      ppeTableFound: boolean;
      debtTableFound: boolean;
      supplierListFound: boolean;
      revenueEvidenceLevel: string;
      supplyEvidenceLevel: string;
      assetsEvidenceLevel: string;
      financialEvidenceLevel: string;
    } | null;
    channelBreakdown?: Record<string, {
      revenue?: { weight: number; tier?: string; source?: string };
      supply?: { weight: number; tier?: string; source?: string };
      assets?: { weight: number; tier?: string; source?: string };
      financial?: { weight: number; tier?: string; source?: string };
      blended: number;
    }> | null;
    dataSource?: string;
  };
  pipelineMs: number;
}

export function generateValidationReport(input: ValidationReportInput): ValidationReport {
  const { ticker, countryExposures, finalScore, scoreUncertainty, geoData, pipelineMs } = input;

  // ── Determine execution path ──────────────────────────────────────────────
  const hasCompanySpecificData = !!geoData.hasVerifiedData;
  const secInt = geoData.secFilingIntegration;
  const hasLiveEdgar =
    !!secInt &&
    (secInt.revenueEvidenceLevel === 'structured' ||
      secInt.supplyEvidenceLevel === 'structured' ||
      secInt.assetsEvidenceLevel === 'structured');

  let executionPath: ExecutionPath;
  let executionPathDetail: string;

  if (hasLiveEdgar) {
    executionPath = 'live-edgar';
    executionPathDetail = `Live SEC EDGAR pipeline succeeded. Tables found: revenue=${secInt!.revenueTableFound}, ppe=${secInt!.ppeTableFound}, debt=${secInt!.debtTableFound}, suppliers=${secInt!.supplierListFound}`;
  } else if (hasCompanySpecificData) {
    executionPath = 'static-snapshot-fallback';
    executionPathDetail = `Company-specific static snapshot used (live EDGAR unavailable). Data source: ${geoData.dataSource || 'companySpecificExposures.ts'}`;
  } else {
    executionPath = 'gf-fallback';
    executionPathDetail = `No company-specific data. V5 Global Fallback (GF) used with per-channel λ priors. Data source: ${geoData.dataSource || 'V5 GF'}`;
  }

  // ── Build channel matrix from countryExposures ────────────────────────────
  const channelMatrix: CountryChannelMatrix[] = countryExposures.map(exp => ({
    country: exp.country,
    revenue: channelEntryFromExposure('revenue', exp),
    supply: channelEntryFromExposure('supply', exp),
    assets: channelEntryFromExposure('assets', exp),
    financial: channelEntryFromExposure('financial', exp),
    blendedWeight: exp.exposureWeight,
  }));

  // If channelBreakdown is available on geoData, use it for richer per-channel weights
  if (geoData.channelBreakdown) {
    for (const row of channelMatrix) {
      const cb = geoData.channelBreakdown[row.country];
      if (!cb) continue;
      if (cb.revenue) {
        row.revenue.weight = cb.revenue.weight;
        row.revenue.tier = (cb.revenue.tier as EvidenceTier) || row.revenue.tier;
        row.revenue.source = cb.revenue.source || row.revenue.source;
      }
      if (cb.supply) {
        row.supply.weight = cb.supply.weight;
        row.supply.tier = (cb.supply.tier as EvidenceTier) || row.supply.tier;
        row.supply.source = cb.supply.source || row.supply.source;
      }
      if (cb.assets) {
        row.assets.weight = cb.assets.weight;
        row.assets.tier = (cb.assets.tier as EvidenceTier) || row.assets.tier;
        row.assets.source = cb.assets.source || row.assets.source;
      }
      if (cb.financial) {
        row.financial.weight = cb.financial.weight;
        row.financial.tier = (cb.financial.tier as EvidenceTier) || row.financial.tier;
        row.financial.source = cb.financial.source || row.financial.source;
      }
    }
  }

  // ── Channel summary ───────────────────────────────────────────────────────
  const channelSummary = {
    revenue: emptyTierCounts(),
    supply: emptyTierCounts(),
    assets: emptyTierCounts(),
    financial: emptyTierCounts(),
  };
  for (const row of channelMatrix) {
    channelSummary.revenue[row.revenue.tier]++;
    channelSummary.supply[row.supply.tier]++;
    channelSummary.assets[row.assets.tier]++;
    channelSummary.financial[row.financial.tier]++;
  }

  // ── Differentiation score ─────────────────────────────────────────────────
  const { score: differentiationScore, detail: differentiationDetail } =
    computeDifferentiationScore(channelMatrix);

  // ── Fallback audit ────────────────────────────────────────────────────────
  const gfFallbackCountries = countryExposures
    .filter(e => e.fallbackType === 'GF' || e.tier === 'FALLBACK')
    .map(e => e.country);
  const directCountryList = countryExposures
    .filter(e => e.tier === 'DIRECT')
    .map(e => e.country);

  const fallbackAudit = {
    totalCountries: countryExposures.length,
    directCountries: countryExposures.filter(e => e.tier === 'DIRECT').length,
    allocatedCountries: countryExposures.filter(e => e.tier === 'ALLOCATED').length,
    modeledCountries: countryExposures.filter(e => e.tier === 'MODELED').length,
    fallbackCountries: countryExposures.filter(e => e.tier === 'FALLBACK').length,
    gfFallbackCountries,
    directCountryList,
  };

  // ── Data source consistency ───────────────────────────────────────────────
  // Both ExposurePathways and TopRiskContributors read from companyData.countryExposures
  // via generateChannelExposures() and getTopStructuralDrivers() respectively.
  // After Task 3 (R8), they both read from deriveCompanyAnalytics() — same object.
  const dataSourceConsistency = {
    exposurePathwaysSource: 'generateChannelExposures(countryExposures) → channelCalculations.ts',
    topRiskContributorsSource: 'getTopStructuralDrivers(countryExposures) → riskRelevance.ts',
    sameObject: true, // Both receive the same countryExposures array from companyData
    divergencePoint:
      differentiationScore < 0.05
        ? 'Channel weights in generateChannelExposures() use STANDARD_CHANNEL_WEIGHTS (static) rather than per-country channel-specific weights from channelBreakdown — diverges from TopRiskContributors which uses blended contribution'
        : null,
  };

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations: string[] = [];
  if (differentiationScore < 0.05) {
    recommendations.push(
      'CRITICAL: Channel homogeneity detected. Verify buildIndependentChannelBreakdown() is being called and live EDGAR path is not overwriting static channel differentiation.'
    );
  }
  if (fallbackAudit.fallbackCountries > fallbackAudit.totalCountries * 0.5) {
    recommendations.push(
      `HIGH: >50% of countries on GF fallback (${fallbackAudit.fallbackCountries}/${fallbackAudit.totalCountries}). Consider adding company-specific data or improving SEC integration.`
    );
  }
  if (!hasCompanySpecificData) {
    recommendations.push(
      `MEDIUM: No company-specific data for ${ticker}. Add entry to COMPANY_SPECIFIC_EXPOSURES for better channel differentiation.`
    );
  }
  if (executionPath === 'live-edgar' && differentiationScore < 0.1) {
    recommendations.push(
      'MEDIUM: Live EDGAR path active but channels still homogeneous. Verify upgradeChannelBreakdownWithSEC() is running on the live path.'
    );
  }
  if (scoreUncertainty > finalScore * 0.25) {
    recommendations.push(
      `LOW: High score uncertainty (±${scoreUncertainty.toFixed(1)} on score ${finalScore.toFixed(1)}). Improve evidence tier quality to reduce uncertainty.`
    );
  }

  return {
    ticker,
    generatedAt: new Date().toISOString(),
    pipelineMs,
    executionPath,
    executionPathDetail,
    hasCompanySpecificData,
    usedLiveEdgar: hasLiveEdgar,
    secIntegrationSuccess: !!secInt,
    channelMatrix,
    channelSummary,
    differentiationScore,
    differentiationDetail,
    fallbackAudit,
    scoreUncertainty,
    finalScore,
    dataSourceConsistency,
    recommendations,
  };
}