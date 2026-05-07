/**
 * Risk Relevance Utilities
 * Supporting functions for Top Relevant Risks (C5)
 * Part of CO-GRI Platform Phase 2 - Week 3
 *
 * R3 FIX: Increased default topN from 2 to 5.
 * R3 FIX: Added GF fallback handling so getTopStructuralDrivers always returns
 *         a well-formed array (never empty) even for META / generic tickers.
 */

import { CountryExposure } from '@/types/company';

export interface StructuralDriver {
  country: string;
  risk_contribution: number;  // Absolute contribution to CO-GRI
  risk_share: number;         // Percentage share
  channel: string;
  explanation: string;
}

export interface ForecastEvent {
  event_id: string;
  event_name: string;
  probability: number;
  timing: string;
  affected_countries: string[];
  affected_channels: string[];
  expected_delta_CO_GRI: number;
  why_relevant: string;
}

/**
 * Determine dominant channel for a country exposure using actual channel weights.
 * R8 FIX: Uses real channelWeights from CountryExposure instead of random selection.
 */
function determineDominantChannel(exposure: CountryExposure): string {
  const w = exposure.channelWeights;
  if (!w) {
    // Fallback to contribution-based heuristic
    return 'Revenue';
  }

  const channels: Array<[string, number]> = [
    ['Revenue', w.revenue],
    ['Supply Chain', w.supply],
    ['Physical Assets', w.assets],
    ['Financial', w.financial],
  ];

  channels.sort((a, b) => b[1] - a[1]);
  return channels[0][0];
}

/**
 * Generate explanation for structural driver using real data.
 */
function generateStructuralExplanation(exposure: CountryExposure): string {
  const share = (exposure.exposureWeight * 100).toFixed(1);
  const shock = exposure.countryShockIndex.toFixed(1);
  const channel = determineDominantChannel(exposure);
  const tierLabel = exposure.tier || exposure.dataSource || 'FALLBACK';

  return `${exposure.country} contributes ${exposure.contribution.toFixed(2)} pts to CO-GRI via ${share}% exposure (CSI=${shock}, dominant channel: ${channel}, evidence: ${tierLabel}).`;
}

/**
 * Get top structural drivers (countries contributing most to current CO-GRI).
 *
 * R3 FIX: topN increased to 5 (was 2) so Meta and generic tickers always show
 * meaningful contributors even when the top-2 have near-zero contribution.
 *
 * R3 FIX: GF fallback handling — if sorted result is empty or all contributions
 * are effectively zero, synthesise a minimal well-formed array from the top
 * exposure-weight countries so the UI never renders an empty panel.
 */
export function getTopStructuralDrivers(
  countryExposures: CountryExposure[],
  topN: number = 5
): StructuralDriver[] {
  if (!countryExposures || countryExposures.length === 0) {
    return [];
  }

  const totalRisk = countryExposures.reduce((sum, ce) => sum + ce.contribution, 0);

  // Sort by contribution descending
  const sorted = [...countryExposures].sort((a, b) => b.contribution - a.contribution);

  // Primary path: use contribution-sorted results
  const primary = sorted
    .slice(0, topN)
    .filter(ce => ce.contribution > 0)
    .map(ce => ({
      country: ce.country,
      risk_contribution: ce.contribution,
      risk_share: totalRisk > 0 ? (ce.contribution / totalRisk) * 100 : 0,
      channel: determineDominantChannel(ce),
      explanation: generateStructuralExplanation(ce),
    }));

  if (primary.length > 0) {
    return primary;
  }

  // R3 GF fallback: all contributions are zero (e.g. META on GF path with near-equal weights)
  // Fall back to exposure-weight sorted results so the panel is never empty.
  const byWeight = [...countryExposures]
    .sort((a, b) => b.exposureWeight - a.exposureWeight)
    .slice(0, topN);

  return byWeight.map(ce => ({
    country: ce.country,
    risk_contribution: ce.exposureWeight, // use weight as proxy
    risk_share: (ce.exposureWeight * 100),
    channel: determineDominantChannel(ce),
    explanation:
      `${ce.country}: ${(ce.exposureWeight * 100).toFixed(1)}% exposure weight (CSI=${ce.countryShockIndex.toFixed(1)}, evidence: ${ce.tier || 'FALLBACK'}).`,
  }));
}

/**
 * Filter relevant forecast events
 * Implements specification Part 3.3 C5 - Forecast Overlay
 *
 * Relevance criteria:
 * 1. Company has >5% exposure in affected countries
 * 2. |expected_delta_CO_GRI| > 2
 * 3. Probability > 0.3
 */
export function filterRelevantForecastEvents(
  forecastEvents: ForecastEvent[],
  countryExposures: CountryExposure[]
): ForecastEvent[] {
  return forecastEvents.filter(event => {
    const exposureInAffectedCountries = event.affected_countries.reduce((sum, country) => {
      const exposure = countryExposures.find(ce => ce.country === country);
      return sum + (exposure ? exposure.exposureWeight : 0);
    }, 0);

    const hasSignificantExposure = exposureInAffectedCountries > 0.05;
    const hasSignificantImpact = Math.abs(event.expected_delta_CO_GRI) > 2;
    const hasReasonableProbability = event.probability > 0.3;

    return hasSignificantExposure && hasSignificantImpact && hasReasonableProbability;
  });
}

/**
 * Rank forecast events by relevance score
 */
export function rankForecastEventsByRelevance(
  forecastEvents: ForecastEvent[],
  countryExposures: CountryExposure[]
): ForecastEvent[] {
  return forecastEvents
    .map(event => {
      const exposureWeight = event.affected_countries.reduce((sum, country) => {
        const exposure = countryExposures.find(ce => ce.country === country);
        return sum + (exposure ? exposure.exposureWeight : 0);
      }, 0);

      const relevanceScore = event.probability * Math.abs(event.expected_delta_CO_GRI) * exposureWeight;
      return { ...event, relevanceScore };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

/**
 * Get top N relevant forecast events
 */
export function getTopRelevantForecastEvents(
  forecastEvents: ForecastEvent[],
  countryExposures: CountryExposure[],
  topN: number = 5
): ForecastEvent[] {
  const relevantEvents = filterRelevantForecastEvents(forecastEvents, countryExposures);
  const rankedEvents = rankForecastEventsByRelevance(relevantEvents, countryExposures);
  return rankedEvents.slice(0, topN);
}

/**
 * Generate explanation for forecast event relevance
 */
export function generateForecastRelevanceExplanation(
  event: ForecastEvent,
  countryExposures: CountryExposure[]
): string {
  const affectedCountries = event.affected_countries
    .filter(country => countryExposures.some(ce => ce.country === country))
    .slice(0, 3)
    .join(', ');

  const impact = event.expected_delta_CO_GRI > 0 ? 'increase' : 'decrease';

  return `This event affects ${affectedCountries} where the company has exposure, expected to ${impact} CO-GRI by ${Math.abs(event.expected_delta_CO_GRI).toFixed(1)} points with ${(event.probability * 100).toFixed(0)}% probability.`;
}