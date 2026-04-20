/**
 * deriveCompanyAnalytics — Task 3 (R8)
 *
 * Single function that computes channelExposures, structuralDrivers, and
 * attributions in ONE consistent pass from the same countryExposures array.
 *
 * Previously these were computed by three separate utility functions:
 *   - generateChannelExposures()   → channelCalculations.ts
 *   - getTopStructuralDrivers()    → riskRelevance.ts
 *   - calculateCountryAttribution() → attributionCalculations.ts
 *
 * The divergence was introduced because:
 *   1. generateChannelExposures() used STANDARD_CHANNEL_WEIGHTS (static, pre-normalization)
 *      rather than the post-normalization per-country channel weights from channelBreakdown.
 *   2. getTopStructuralDrivers() used contribution (post-normalization) but defaulted topN=2,
 *      causing empty results for META/generic tickers.
 *   3. calculateCountryAttribution() used a random dominant-channel selector.
 *
 * This function eliminates all three divergences:
 *   - channelExposures uses actual per-country channelWeights from CountryExposure
 *   - structuralDrivers uses contribution with GF fallback (topN=5)
 *   - attributions uses contribution with real dominant channel from channelWeights
 *   - ALL three read from the same countryExposures reference
 */

import type { CountryExposure } from '@/services/cogriCalculationService';
import type { ChannelExposure } from '@/utils/channelCalculations';
import type { StructuralDriver } from '@/utils/riskRelevance';
import type { CountryAttribution } from '@/utils/attributionCalculations';

// ─────────────────────────────────────────────────────────────────────────────
// Channel coefficients — must match geographicExposureService.ts
// ─────────────────────────────────────────────────────────────────────────────
const CHANNEL_COEFFICIENTS = {
  revenue: 0.40,
  supply: 0.35,
  assets: 0.15,
  financial: 0.10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function determineDominantChannel(exposure: CountryExposure): string {
  const w = exposure.channelWeights;
  if (!w) return 'Revenue';

  const channels: Array<[string, number]> = [
    ['Revenue', (w.revenue || 0) * CHANNEL_COEFFICIENTS.revenue],
    ['Supply Chain', (w.supply || 0) * CHANNEL_COEFFICIENTS.supply],
    ['Physical Assets', (w.assets || 0) * CHANNEL_COEFFICIENTS.assets],
    ['Financial', (w.financial || 0) * CHANNEL_COEFFICIENTS.financial],
  ];

  channels.sort((a, b) => b[1] - a[1]);
  return channels[0][0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Output type
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyAnalytics {
  /** Channel-level exposures for ExposurePathways (C4) */
  channelExposures: ChannelExposure[];
  /** Top structural drivers for TopRelevantRisks (C5) */
  structuralDrivers: StructuralDriver[];
  /** Country attributions for RiskAttribution (C7) */
  attributions: CountryAttribution[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive all three analytics objects from a single countryExposures array.
 *
 * @param countryExposures - Post-normalization country exposures from calculateCOGRIScore()
 * @param finalScore       - Final CO-GRI score (used for channel risk score calculation)
 * @param topN             - Number of structural drivers to return (default 5)
 */
export function deriveCompanyAnalytics(
  countryExposures: CountryExposure[],
  finalScore: number,
  topN: number = 5
): CompanyAnalytics {
  if (!countryExposures || countryExposures.length === 0) {
    return {
      channelExposures: buildEmptyChannelExposures(finalScore),
      structuralDrivers: [],
      attributions: [],
    };
  }

  // ── 1. Channel Exposures (for ExposurePathways C4) ─────────────────────────
  // Aggregate per-channel weights across all countries using post-normalization
  // exposureWeight × channel-specific weight from channelWeights.
  const channelAggregates: Record<
    'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial',
    { totalWeight: number; countryWeights: Record<string, number> }
  > = {
    'Revenue': { totalWeight: 0, countryWeights: {} },
    'Supply Chain': { totalWeight: 0, countryWeights: {} },
    'Physical Assets': { totalWeight: 0, countryWeights: {} },
    'Financial': { totalWeight: 0, countryWeights: {} },
  };

  for (const exp of countryExposures) {
    const w = exp.channelWeights;
    if (w) {
      // Use actual per-channel weights (post-normalization from channelBreakdown)
      channelAggregates['Revenue'].countryWeights[exp.country] = w.revenue || 0;
      channelAggregates['Revenue'].totalWeight += (w.revenue || 0) * exp.exposureWeight;

      channelAggregates['Supply Chain'].countryWeights[exp.country] = w.supply || 0;
      channelAggregates['Supply Chain'].totalWeight += (w.supply || 0) * exp.exposureWeight;

      channelAggregates['Physical Assets'].countryWeights[exp.country] = w.assets || 0;
      channelAggregates['Physical Assets'].totalWeight += (w.assets || 0) * exp.exposureWeight;

      channelAggregates['Financial'].countryWeights[exp.country] = w.financial || 0;
      channelAggregates['Financial'].totalWeight += (w.financial || 0) * exp.exposureWeight;
    } else {
      // No channel breakdown: distribute proportionally by blending coefficients
      channelAggregates['Revenue'].countryWeights[exp.country] = exp.exposureWeight;
      channelAggregates['Revenue'].totalWeight += exp.exposureWeight * CHANNEL_COEFFICIENTS.revenue;

      channelAggregates['Supply Chain'].countryWeights[exp.country] = exp.exposureWeight;
      channelAggregates['Supply Chain'].totalWeight += exp.exposureWeight * CHANNEL_COEFFICIENTS.supply;

      channelAggregates['Physical Assets'].countryWeights[exp.country] = exp.exposureWeight;
      channelAggregates['Physical Assets'].totalWeight += exp.exposureWeight * CHANNEL_COEFFICIENTS.assets;

      channelAggregates['Financial'].countryWeights[exp.country] = exp.exposureWeight;
      channelAggregates['Financial'].totalWeight += exp.exposureWeight * CHANNEL_COEFFICIENTS.financial;
    }
  }

  const channelCoeffMap: Record<string, number> = {
    'Revenue': CHANNEL_COEFFICIENTS.revenue,
    'Supply Chain': CHANNEL_COEFFICIENTS.supply,
    'Physical Assets': CHANNEL_COEFFICIENTS.assets,
    'Financial': CHANNEL_COEFFICIENTS.financial,
  };

  const channelExposures: ChannelExposure[] = (
    ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'] as const
  ).map(channel => {
    const agg = channelAggregates[channel];
    const coeff = channelCoeffMap[channel];

    // Top countries for this channel: sort by channel-specific weight
    const topCountries = Object.entries(agg.countryWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([country, weight]) => ({
        country,
        percentage: weight * 100,
      }));

    // Channel risk score: sum of (exposureWeight × channelWeight × CSI) for all countries
    const riskScore = countryExposures.reduce((sum, exp) => {
      const w = exp.channelWeights;
      const chW = w
        ? channel === 'Revenue'
          ? w.revenue || 0
          : channel === 'Supply Chain'
          ? w.supply || 0
          : channel === 'Physical Assets'
          ? w.assets || 0
          : w.financial || 0
        : exp.exposureWeight;
      return sum + chW * exp.exposureWeight * exp.countryShockIndex;
    }, 0);

    return {
      channel,
      weight: coeff,
      topCountries,
      riskScore: Math.min(100, riskScore * 100),
    };
  });

  // ── 2. Structural Drivers (for TopRelevantRisks C5) ────────────────────────
  const totalRisk = countryExposures.reduce((sum, ce) => sum + ce.contribution, 0);
  const sorted = [...countryExposures].sort((a, b) => b.contribution - a.contribution);

  let structuralDrivers: StructuralDriver[] = sorted
    .slice(0, topN)
    .filter(ce => ce.contribution > 0)
    .map(ce => ({
      country: ce.country,
      risk_contribution: ce.contribution,
      risk_share: totalRisk > 0 ? (ce.contribution / totalRisk) * 100 : 0,
      channel: determineDominantChannel(ce),
      explanation: `${ce.country}: ${(ce.exposureWeight * 100).toFixed(1)}% exposure, CSI=${ce.countryShockIndex.toFixed(1)}, contributes ${ce.contribution.toFixed(2)} pts (${totalRisk > 0 ? ((ce.contribution / totalRisk) * 100).toFixed(1) : '0'}% of total). Evidence: ${ce.tier || ce.dataSource || 'FALLBACK'}.`,
    }));

  // R3 GF fallback: if all contributions are zero (META/generic GF path),
  // fall back to exposure-weight sorted results so the panel is never empty.
  if (structuralDrivers.length === 0) {
    const byWeight = [...countryExposures]
      .sort((a, b) => b.exposureWeight - a.exposureWeight)
      .slice(0, topN);

    structuralDrivers = byWeight.map(ce => ({
      country: ce.country,
      risk_contribution: ce.exposureWeight,
      risk_share: ce.exposureWeight * 100,
      channel: determineDominantChannel(ce),
      explanation: `${ce.country}: ${(ce.exposureWeight * 100).toFixed(1)}% exposure weight (CSI=${ce.countryShockIndex.toFixed(1)}, evidence: ${ce.tier || 'FALLBACK'}).`,
    }));
  }

  // ── 3. Attributions (for RiskAttribution C7) ──────────────────────────────
  const attributions: CountryAttribution[] = [...countryExposures]
    .sort((a, b) => b.contribution - a.contribution)
    .map(ce => ({
      country: ce.country,
      risk_share: totalRisk > 0 ? (ce.contribution / totalRisk) * 100 : 0,
      risk_contribution: ce.contribution,
      dominant_channel: determineDominantChannel(ce),
      exposure_weight: ce.exposureWeight,
      adjusted_shock: ce.countryShockIndex,
      alignment_modifier: ce.politicalAlignment
        ? 1.0 - ce.politicalAlignment.alignmentFactor
        : 0,
      tier: ce.tier,
      dataSource: ce.dataSource,
    }));

  return { channelExposures, structuralDrivers, attributions };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyChannelExposures(baseScore: number): ChannelExposure[] {
  return (
    ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'] as const
  ).map(channel => ({
    channel,
    weight: CHANNEL_COEFFICIENTS[channel === 'Supply Chain' ? 'supply' : channel === 'Physical Assets' ? 'assets' : channel.toLowerCase() as 'revenue' | 'financial'],
    topCountries: [],
    riskScore: baseScore,
  }));
}