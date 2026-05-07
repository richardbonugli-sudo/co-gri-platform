/**
 * Forecast Delta Applicator
 * Applies forecast event deltas to company CO-GRI calculations
 * Part of CO-GRI Platform Phase 3 - Week 7-8
 * 
 * CRITICAL GUARDRAILS:
 * - NEVER modify exposure weights
 * - NEVER create new exposures
 * - ONLY apply deltas to existing exposure countries
 */

import { ForecastEvent, RelevantForecastEvent } from '@/types/forecast';
import { CountryExposure } from '@/services/cogriCalculationService';
import { validateExposureIntegrity } from './eventRelevanceFilter';

// ============================================================================
// FORECAST DELTA APPLICATION
// ============================================================================

/**
 * Apply forecast event delta to company CO-GRI
 * 
 * CRITICAL: This function ONLY modifies shock intensity, NOT exposure weights
 * 
 * @param event - Forecast event
 * @param companyExposures - Company's country exposures (READ-ONLY)
 * @returns Expected ΔCO-GRI
 */
export function applyForecastDelta(
  event: ForecastEvent,
  companyExposures: CountryExposure[]
): number {
  let deltaCOGRI = 0;
  
  // GUARDRAIL: Only iterate over affected countries that company has exposure to
  for (const country of event.affected_countries) {
    // Check if company has exposure to this country
    const exposure = companyExposures.find(exp => exp.country === country);
    
    // CRITICAL: Skip if no exposure (DO NOT create new exposure)
    if (!exposure) {
      continue;
    }
    
    // Apply forecast delta using EXISTING exposure weights
    // DO NOT modify exposure.exposureWeight
    const channelDelta = event.delta_by_channel;
    
    // Calculate weighted delta contribution
    // This uses the existing exposure structure without modification
    const countryDelta = calculateCountryDelta(exposure, channelDelta);
    
    deltaCOGRI += countryDelta;
  }
  
  return deltaCOGRI;
}

/**
 * Calculate country-specific delta contribution
 * 
 * Uses existing exposure weights with forecast channel deltas
 */
interface ChannelDelta {
  revenue: number;
  supply_chain: number;
  physical_assets: number;
  financial: number;
}

function calculateCountryDelta(
  exposure: CountryExposure,
  channelDelta: ChannelDelta
): number {
  // Standard channel weights (from specification)
  const CHANNEL_WEIGHTS = {
    revenue: 0.35,
    supply_chain: 0.30,
    physical_assets: 0.20,
    financial: 0.15
  };
  
  // Calculate weighted delta
  // This applies forecast shock changes to existing exposure structure
  const delta = 
    (CHANNEL_WEIGHTS.revenue * channelDelta.revenue) +
    (CHANNEL_WEIGHTS.supply_chain * channelDelta.supply_chain) +
    (CHANNEL_WEIGHTS.physical_assets * channelDelta.physical_assets) +
    (CHANNEL_WEIGHTS.financial * channelDelta.financial);
  
  // Scale by exposure weight
  return exposure.exposureWeight * delta;
}

/**
 * Apply multiple forecast events to company
 * 
 * @param events - Array of relevant forecast events
 * @param companyExposures - Company's country exposures (READ-ONLY)
 * @returns Aggregated forecast impact
 */
export function applyMultipleForecastEvents(
  events: RelevantForecastEvent[],
  companyExposures: CountryExposure[]
): ForecastImpactResult {
  // Store original exposures for validation
  const exposuresBefore = JSON.parse(JSON.stringify(companyExposures));
  
  let totalDelta = 0;
  let probabilityWeightedDelta = 0;
  const eventContributions: EventContribution[] = [];
  
  for (const event of events) {
    const eventDelta = applyForecastDelta(event, companyExposures);
    const weightedDelta = eventDelta * event.probability;
    
    totalDelta += eventDelta;
    probabilityWeightedDelta += weightedDelta;
    
    eventContributions.push({
      event_id: event.event_id,
      event_name: event.event_name,
      delta: eventDelta,
      weighted_delta: weightedDelta,
      probability: event.probability
    });
  }
  
  // CRITICAL VALIDATION: Ensure exposures unchanged
  const validation = validateExposureIntegrity(exposuresBefore, companyExposures);
  
  if (!validation.is_valid) {
    console.error('GUARDRAIL VIOLATION: Exposures were modified!', validation.errors);
    throw new Error(
      'Forecast application violated exposure integrity: ' + validation.errors.join('; ')
    );
  }
  
  return {
    total_delta: totalDelta,
    probability_weighted_delta: probabilityWeightedDelta,
    event_contributions: eventContributions,
    validation_passed: validation.is_valid
  };
}

/**
 * Forecast impact result
 */
export interface ForecastImpactResult {
  total_delta: number;
  probability_weighted_delta: number;
  event_contributions: EventContribution[];
  validation_passed: boolean;
}

/**
 * Individual event contribution
 */
export interface EventContribution {
  event_id: string;
  event_name: string;
  delta: number;
  weighted_delta: number;
  probability: number;
}

// ============================================================================
// FORECAST SCENARIOS (BEST/BASE/WORST CASE)
// ============================================================================

/**
 * Calculate forecast scenarios
 * 
 * @param events - Relevant forecast events
 * @param companyExposures - Company's country exposures
 * @returns Best/base/worst case scenarios
 */
export function calculateForecastScenarios(
  events: RelevantForecastEvent[],
  companyExposures: CountryExposure[]
): {
  best_case: number;
  base_case: number;
  worst_case: number;
} {
  if (events.length === 0) {
    return { best_case: 0, base_case: 0, worst_case: 0 };
  }
  
  // Base case: Probability-weighted expected value
  const baseCase = events.reduce((sum, event) => {
    const delta = applyForecastDelta(event, companyExposures);
    return sum + (delta * event.probability);
  }, 0);
  
  // Best case: Only positive events occur (or negative events don't occur)
  const bestCase = events.reduce((sum, event) => {
    const delta = applyForecastDelta(event, companyExposures);
    if (delta < 0) {
      // Negative event - best case is it doesn't occur
      return sum;
    } else {
      // Positive event - best case is it occurs
      return sum + delta;
    }
  }, 0);
  
  // Worst case: Only negative events occur (or positive events don't occur)
  const worstCase = events.reduce((sum, event) => {
    const delta = applyForecastDelta(event, companyExposures);
    if (delta > 0) {
      // Positive event - worst case is it doesn't occur
      return sum;
    } else {
      // Negative event - worst case is it occurs
      return sum + delta;
    }
  }, 0);
  
  return {
    best_case: bestCase,
    base_case: baseCase,
    worst_case: worstCase
  };
}

// ============================================================================
// CHANNEL-SPECIFIC IMPACT
// ============================================================================

/**
 * Calculate forecast impact by channel
 */
export function calculateChannelImpact(
  events: RelevantForecastEvent[],
  companyExposures: CountryExposure[]
): Record<string, number> {
  const channelImpacts = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0
  };
  
  for (const event of events) {
    for (const country of event.affected_countries) {
      const exposure = companyExposures.find(exp => exp.country === country);
      if (!exposure) continue;
      
      const channelDelta = event.delta_by_channel;
      const weight = exposure.exposureWeight;
      
      channelImpacts.revenue += weight * channelDelta.revenue * event.probability;
      channelImpacts.supply_chain += weight * channelDelta.supply_chain * event.probability;
      channelImpacts.physical_assets += weight * channelDelta.physical_assets * event.probability;
      channelImpacts.financial += weight * channelDelta.financial * event.probability;
    }
  }
  
  return channelImpacts;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get forecast outlook direction
 */
export function getForecastOutlook(
  probabilityWeightedDelta: number
): 'Headwind' | 'Tailwind' | 'Mixed' | 'Neutral' {
  if (probabilityWeightedDelta > 3) return 'Headwind';
  if (probabilityWeightedDelta < -3) return 'Tailwind';
  if (Math.abs(probabilityWeightedDelta) < 1) return 'Neutral';
  return 'Mixed';
}

/**
 * Get confidence level based on event probabilities
 */
export function getConfidenceLevel(
  events: RelevantForecastEvent[]
): 'High' | 'Medium' | 'Low' {
  if (events.length === 0) return 'Low';
  
  const avgProbability = events.reduce((sum, evt) => sum + evt.probability, 0) / events.length;
  const avgConfidence = events.reduce((sum, evt) => sum + evt.confidence, 0) / events.length;
  
  const overallConfidence = (avgProbability + avgConfidence) / 2;
  
  if (overallConfidence >= 0.7) return 'High';
  if (overallConfidence >= 0.5) return 'Medium';
  return 'Low';
}