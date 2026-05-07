/**
 * Attribution Calculation Utilities
 * Supporting functions for Risk Attribution (C7)
 * Part of CO-GRI Platform Phase 2 - Week 4
 */

import { CountryExposure } from '@/types/company';

export interface CountryAttribution {
  country: string;
  risk_share: number;  // Percentage [0,100]
  risk_contribution: number;  // Absolute contribution
  dominant_channel: string;
  exposure_weight: number;
  adjusted_shock: number;
  alignment_modifier?: number;
  /** P3-1: V5 primary evidence tier — propagated from CountryExposure.tier */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  /** P3-1: Backward-compat tier from CountryExposure.dataSource */
  dataSource?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
}

export interface ChannelBreakdown {
  channel: string;
  contribution: number;
  percentage: number;
}

/**
 * Calculate country-level risk attribution
 * Implements specification Part 3.3 C7
 * 
 * CRITICAL: Shows "risk contribution share" NOT "exposure share"
 */
export function calculateCountryAttribution(
  countryExposures: CountryExposure[]
): CountryAttribution[] {
  const totalRisk = countryExposures.reduce((sum, ce) => sum + ce.contribution, 0);

  return countryExposures
    .map(ce => ({
      country: ce.country,
      risk_share: (ce.contribution / totalRisk) * 100,
      risk_contribution: ce.contribution,
      dominant_channel: determineDominantChannel(ce),
      exposure_weight: ce.exposureWeight,
      adjusted_shock: ce.countryShockIndex,
      alignment_modifier: 0.5,  // Simplified - would come from alignment data
      // P3-1: propagate V5 evidence tier fields from CountryExposure
      tier: (ce as any).tier,
      dataSource: (ce as any).dataSource,
    }))
    .sort((a, b) => b.risk_contribution - a.risk_contribution);
}

/**
 * Get top N countries for attribution display
 */
export function getTopCountriesForAttribution(
  attributions: CountryAttribution[],
  topN: number = 7
): CountryAttribution[] {
  return attributions.slice(0, topN);
}

/**
 * Calculate channel breakdown for a country
 */
export function calculateChannelBreakdown(
  country: string,
  totalContribution: number
): ChannelBreakdown[] {
  // Simplified - in production would use actual channel-specific data
  const channels = ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'];
  const weights = [0.35, 0.30, 0.20, 0.15];

  return channels.map((channel, idx) => {
    const contribution = totalContribution * weights[idx];
    return {
      channel,
      contribution,
      percentage: weights[idx] * 100
    };
  });
}

/**
 * Get color for country based on risk share
 * Consistent with C3 Risk Contribution Map
 */
export function getCountryColor(risk_share: number): string {
  if (risk_share > 20) return '#EF4444';  // red-500
  if (risk_share > 10) return '#F97316';  // orange-500
  if (risk_share > 5) return '#F59E0B';   // amber-500
  return '#10B981';  // green-500
}

/**
 * Get contribution label based on share
 */
export function getContributionLabel(risk_share: number): string {
  if (risk_share >= 20) return 'Primary';
  if (risk_share >= 10) return 'Significant';
  if (risk_share >= 5) return 'Moderate';
  return 'Minor';
}

/**
 * Determine dominant channel for a country exposure
 */
function determineDominantChannel(exposure: CountryExposure): string {
  // Simplified - would use actual channel breakdown in production
  const channels = ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'];
  return channels[Math.floor(Math.random() * channels.length)];
}

/**
 * Format percentage with sign
 */
export function formatPercentageWithSign(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}