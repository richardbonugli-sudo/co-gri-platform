/**
 * Event Relevance Filter
 * Filters forecast events by company relevance
 * Part of CO-GRI Platform Phase 3 - Week 7-8
 * 
 * CRITICAL GUARDRAILS:
 * - Forecast baseline NEVER redistributes exposures
 * - Forecast baseline NEVER creates new exposures
 * - Only show events that meet materiality thresholds
 */

import { ForecastEvent, RelevantForecastEvent, RelevanceCriteria } from '@/types/forecast';
import { CountryExposure } from '@/services/cogriCalculationService';

// ============================================================================
// DEFAULT RELEVANCE CRITERIA
// ============================================================================

const DEFAULT_CRITERIA: RelevanceCriteria = {
  min_exposure_threshold: 0.05,    // 5% exposure threshold
  min_delta_threshold: 2,          // |ΔCO-GRI| > 2
  min_probability: 0.3             // 30% probability threshold
};

// ============================================================================
// RELEVANCE FILTERING
// ============================================================================

/**
 * Filter forecast events by company relevance
 * 
 * @param events - All forecast events
 * @param companyExposures - Company's country exposures
 * @param criteria - Relevance criteria (optional)
 * @returns Filtered relevant events
 */
export function filterRelevantForecastEvents(
  events: ForecastEvent[],
  companyExposures: CountryExposure[],
  criteria: Partial<RelevanceCriteria> = {}
): RelevantForecastEvent[] {
  const finalCriteria = { ...DEFAULT_CRITERIA, ...criteria };
  
  const relevantEvents: RelevantForecastEvent[] = [];
  
  for (const event of events) {
    // Check relevance
    const relevanceCheck = checkEventRelevance(event, companyExposures, finalCriteria);
    
    if (relevanceCheck.is_relevant) {
      relevantEvents.push({
        ...event,
        why_relevant: relevanceCheck.reasoning,
        company_exposure: relevanceCheck.total_exposure,
        materiality_score: relevanceCheck.materiality_score
      });
    }
  }
  
  // Sort by materiality score (descending)
  return relevantEvents.sort((a, b) => b.materiality_score - a.materiality_score);
}

/**
 * Check if an event is relevant to a company
 */
interface RelevanceCheckResult {
  is_relevant: boolean;
  reasoning: string;
  total_exposure: number;
  materiality_score: number;
}

function checkEventRelevance(
  event: ForecastEvent,
  companyExposures: CountryExposure[],
  criteria: RelevanceCriteria
): RelevanceCheckResult {
  // Criterion 1: Event affects countries where company has exposure
  const affectedExposures = companyExposures.filter(exposure =>
    event.affected_countries && Array.isArray(event.affected_countries) && event.affected_countries.includes(exposure.country)
  );
  
  if (affectedExposures.length === 0) {
    return {
      is_relevant: false,
      reasoning: 'No exposure to affected countries',
      total_exposure: 0,
      materiality_score: 0
    };
  }
  
  // Calculate total exposure to affected countries
  const totalExposure = affectedExposures.reduce(
    (sum, exp) => sum + exp.exposureWeight,
    0
  );
  
  // Criterion 2: Company has meaningful exposure (>5% threshold)
  if (totalExposure < criteria.min_exposure_threshold) {
    return {
      is_relevant: false,
      reasoning: `Exposure too low (${(totalExposure * 100).toFixed(1)}% < ${(criteria.min_exposure_threshold * 100).toFixed(0)}%)`,
      total_exposure: totalExposure,
      materiality_score: 0
    };
  }
  
  // Criterion 3: Expected |ΔCO-GRI| > threshold (default 2)
  const absDelta = Math.abs(event.expected_delta_CO_GRI);
  if (absDelta < criteria.min_delta_threshold) {
    return {
      is_relevant: false,
      reasoning: `Impact too low (|ΔCO-GRI| = ${absDelta.toFixed(1)} < ${criteria.min_delta_threshold})`,
      total_exposure: totalExposure,
      materiality_score: 0
    };
  }
  
  // Criterion 4: Probability > threshold (default 30%)
  if (event.probability < criteria.min_probability) {
    return {
      is_relevant: false,
      reasoning: `Probability too low (${(event.probability * 100).toFixed(0)}% < ${(criteria.min_probability * 100).toFixed(0)}%)`,
      total_exposure: totalExposure,
      materiality_score: 0
    };
  }
  
  // Event is relevant - calculate materiality score
  const materialityScore = calculateMaterialityScore(
    event,
    totalExposure,
    affectedExposures
  );
  
  // Generate reasoning
  const reasoning = generateRelevanceReasoning(
    event,
    affectedExposures,
    totalExposure
  );
  
  return {
    is_relevant: true,
    reasoning,
    total_exposure: totalExposure,
    materiality_score: materialityScore
  };
}

/**
 * Calculate materiality score [0-100]
 * 
 * Score = (Exposure Weight × 30) + (|ΔCO-GRI| × 5) + (Probability × 40) + (Impact Level × 25)
 */
function calculateMaterialityScore(
  event: ForecastEvent,
  totalExposure: number,
  affectedExposures: CountryExposure[]
): number {
  // Exposure component (0-30 points)
  const exposureScore = Math.min(totalExposure * 30, 30);
  
  // Delta component (0-30 points)
  const deltaScore = Math.min(Math.abs(event.expected_delta_CO_GRI) * 5, 30);
  
  // Probability component (0-25 points)
  const probabilityScore = event.probability * 25;
  
  // Impact level component (0-15 points)
  const impactScore = getImpactLevelScore(event.impact_level);
  
  const totalScore = exposureScore + deltaScore + probabilityScore + impactScore;
  
  return Math.min(totalScore, 100);
}

/**
 * Get impact level score
 */
function getImpactLevelScore(impactLevel: string): number {
  const scores: Record<string, number> = {
    'Critical': 15,
    'High': 12,
    'Medium': 8,
    'Low': 4
  };
  return scores[impactLevel] || 0;
}

/**
 * Generate relevance reasoning text
 */
function generateRelevanceReasoning(
  event: ForecastEvent,
  affectedExposures: CountryExposure[],
  totalExposure: number
): string {
  const exposurePct = (totalExposure * 100).toFixed(1);
  const deltaCOGRI = event.expected_delta_CO_GRI.toFixed(1);
  const probability = (event.probability * 100).toFixed(0);
  
  const topCountries = affectedExposures
    .sort((a, b) => b.exposureWeight - a.exposureWeight)
    .slice(0, 3)
    .map(exp => exp.country);
  
  const countriesText = topCountries.length > 1
    ? `${topCountries.slice(0, -1).join(', ')} and ${topCountries[topCountries.length - 1]}`
    : topCountries[0];
  
  return `Company has ${exposurePct}% exposure to affected countries (${countriesText}). ` +
         `Expected impact: ${deltaCOGRI > 0 ? '+' : ''}${deltaCOGRI} CO-GRI points. ` +
         `Probability: ${probability}%.`;
}

// ============================================================================
// EXPOSURE VALIDATION (GUARDRAILS)
// ============================================================================

/**
 * Validate that forecast application does not modify exposures
 * 
 * CRITICAL GUARDRAIL: Ensure no exposure redistribution or new exposures
 */
export function validateExposureIntegrity(
  exposuresBefore: CountryExposure[],
  exposuresAfter: CountryExposure[]
): {
  is_valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check 1: Same number of countries
  if (exposuresBefore.length !== exposuresAfter.length) {
    errors.push(
      `Exposure count changed: ${exposuresBefore.length} → ${exposuresAfter.length}`
    );
  }
  
  // Check 2: Same countries (no new exposures)
  const countriesBefore = new Set(exposuresBefore.map(exp => exp.country));
  const countriesAfter = new Set(exposuresAfter.map(exp => exp.country));
  
  const newCountries = Array.from(countriesAfter).filter(
    country => !countriesBefore.has(country)
  );
  
  if (newCountries.length > 0) {
    errors.push(
      `New exposures created: ${newCountries.join(', ')}`
    );
  }
  
  // Check 3: Exposure weights unchanged
  for (const expBefore of exposuresBefore) {
    const expAfter = exposuresAfter.find(exp => exp.country === expBefore.country);
    
    if (!expAfter) {
      errors.push(`Exposure removed: ${expBefore.country}`);
      continue;
    }
    
    if (Math.abs(expBefore.exposureWeight - expAfter.exposureWeight) > 0.0001) {
      errors.push(
        `Exposure weight changed for ${expBefore.country}: ` +
        `${expBefore.exposureWeight.toFixed(4)} → ${expAfter.exposureWeight.toFixed(4)}`
      );
    }
  }
  
  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get top relevant events for a company
 */
export function getTopRelevantEvents(
  events: ForecastEvent[],
  companyExposures: CountryExposure[],
  limit: number = 5
): RelevantForecastEvent[] {
  const relevantEvents = filterRelevantForecastEvents(events, companyExposures);
  return relevantEvents.slice(0, limit);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use filterRelevantForecastEvents instead
 */
export function filterRelevantEvents(
  events: ForecastEvent[],
  companyExposures: CountryExposure[],
  criteria?: Partial<RelevanceCriteria>
): RelevantForecastEvent[] {
  return filterRelevantForecastEvents(events, companyExposures, criteria);
}

/**
 * Type alias for backward compatibility
 */
export type CompanyExposureData = CountryExposure[];

/**
 * Check if any relevant events exist for a company
 */
export function hasRelevantEvents(
  events: ForecastEvent[],
  companyExposures: CountryExposure[]
): boolean {
  const relevantEvents = filterRelevantForecastEvents(events, companyExposures);
  return relevantEvents.length > 0;
}

/**
 * Get relevance summary statistics
 */
export function getRelevanceSummary(
  events: ForecastEvent[],
  companyExposures: CountryExposure[]
): {
  total_events: number;
  relevant_events: number;
  relevance_rate: number;
  avg_materiality_score: number;
} {
  const relevantEvents = filterRelevantForecastEvents(events, companyExposures);
  
  const avgMaterialityScore = relevantEvents.length > 0
    ? relevantEvents.reduce((sum, evt) => sum + evt.materiality_score, 0) / relevantEvents.length
    : 0;
  
  return {
    total_events: events.length,
    relevant_events: relevantEvents.length,
    relevance_rate: events.length > 0 ? relevantEvents.length / events.length : 0,
    avg_materiality_score: avgMaterialityScore
  };
}