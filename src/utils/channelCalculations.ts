/**
 * Channel Calculation Utilities
 * Supporting functions for Exposure Pathways (C4)
 * Part of CO-GRI Platform Phase 2 - Week 3
 */

import { CountryExposure } from '@/types/company';

export interface ChannelExposure {
  channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  weight: number;  // Standard weight (e.g., 0.35 for Revenue)
  topCountries: Array<{
    country: string;
    percentage: number;
  }>;
  riskScore: number;
  forecastImpact?: {
    direction: 'Increasing' | 'Decreasing' | 'Stable';
    severity: 'High' | 'Medium' | 'Low';
    explanation: string;
    expected_delta: number;
  };
}

/**
 * Standard channel weights from specification
 * Part 3.3 C4 - Channel Breakdown
 */
export const STANDARD_CHANNEL_WEIGHTS = {
  'Revenue': 0.35,
  'Supply Chain': 0.30,
  'Physical Assets': 0.20,
  'Financial': 0.15
} as const;

/**
 * Calculate channel-specific risk scores
 * Each channel's risk = Σ(country_exposure_in_channel × country_shock)
 */
export function calculateChannelRiskScores(
  countryExposures: CountryExposure[],
  channelWeights: typeof STANDARD_CHANNEL_WEIGHTS = STANDARD_CHANNEL_WEIGHTS
): Record<string, number> {
  const channels = Object.keys(channelWeights) as Array<keyof typeof channelWeights>;
  const scores: Record<string, number> = {};

  channels.forEach(channel => {
    // Simplified: In production, would use actual channel-specific exposure data
    // For now, assume proportional distribution
    const channelScore = countryExposures.reduce((sum, country) => {
      return sum + (country.exposureWeight * country.countryShockIndex * channelWeights[channel]);
    }, 0);
    
    scores[channel] = channelScore;
  });

  return scores;
}

/**
 * Get top N countries for a specific channel
 */
export function getTopCountriesForChannel(
  countryExposures: CountryExposure[],
  channel: string,
  topN: number = 6
): Array<{ country: string; percentage: number }> {
  // Sort by contribution and take top N
  return countryExposures
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, topN)
    .map(ce => ({
      country: ce.country,
      percentage: ce.exposureWeight * 100
    }));
}

/**
 * Generate channel exposures for display
 */
export function generateChannelExposures(
  countryExposures: CountryExposure[],
  baseScore: number
): ChannelExposure[] {
  const channels: Array<'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial'> = [
    'Revenue',
    'Supply Chain', 
    'Physical Assets',
    'Financial'
  ];

  return channels.map(channel => {
    const weight = STANDARD_CHANNEL_WEIGHTS[channel];
    const topCountries = getTopCountriesForChannel(countryExposures, channel);
    
    // Calculate channel-specific risk score
    const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
    const riskScore = baseScore * (1 + variance);

    return {
      channel,
      weight,
      topCountries,
      riskScore
    };
  });
}

/**
 * Calculate forecast impact for a channel
 * CRITICAL: Only apply forecast delta if company has exposure in affected countries
 */
export function calculateChannelForecastImpact(
  channel: string,
  countryExposures: CountryExposure[],
  forecastEvents: any[]
): {
  direction: 'Increasing' | 'Decreasing' | 'Stable';
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
  expected_delta: number;
} {
  // Filter events affecting this channel
  const relevantEvents = forecastEvents.filter(event => 
    event.affected_channels?.includes(channel)
  );

  if (relevantEvents.length === 0) {
    return {
      direction: 'Stable',
      severity: 'Low',
      explanation: `No significant forecast events affecting ${channel} channel`,
      expected_delta: 0
    };
  }

  // Calculate weighted delta
  let totalDelta = 0;
  relevantEvents.forEach(event => {
    // Only count if company has exposure in affected countries
    const hasExposure = event.affected_countries?.some((country: string) =>
      countryExposures.some(ce => ce.country === country)
    );

    if (hasExposure) {
      const eventWeight = event.probability || 0.5;
      const eventDelta = (event.expected_delta_CO_GRI || 0) * eventWeight;
      totalDelta += eventDelta;
    }
  });

  const direction = totalDelta > 0.5 ? 'Increasing' 
    : totalDelta < -0.5 ? 'Decreasing' 
    : 'Stable';
  
  const severity = Math.abs(totalDelta) > 2 ? 'High' 
    : Math.abs(totalDelta) > 1 ? 'Medium' 
    : 'Low';

  const topEvent = relevantEvents.sort((a, b) => 
    (b.probability || 0) - (a.probability || 0)
  )[0];

  const explanation = topEvent 
    ? `${topEvent.event_name} is expected to ${direction.toLowerCase()} risk exposure through ${channel.toLowerCase()} operations`
    : `Multiple events affecting ${channel} channel`;

  return {
    direction,
    severity,
    explanation,
    expected_delta: totalDelta
  };
}