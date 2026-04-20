/**
 * Forecast Engine Service
 * 
 * Applies CedarOwl forecast data to calculate adjusted CSI scores.
 * Enforces all 6 guardrails to ensure forecast integrity.
 * 
 * @module forecastEngine
 */

import {
  getCountryAdjustment,
  getSectorMultiplier,
  getEventsByCountry,
  loadCedarOwlForecast
} from '@/utils/forecastDataAccess';
import type {
  CountryAdjustment,
  GeopoliticalEvent
} from '@/types/forecast';
import {
  validateNoNewExposure,
  validateAdditiveDelta,
  validateExistingExposureOnly,
  validateExpectedPath,
  validateNoDensePropagation,
  validateClearLabeling
} from '@/utils/guardrails';

/**
 * Represents a country exposure in a portfolio
 */
export interface Exposure {
  countryCode: string;
  countryName: string;
  baseCsi: number;
  exposureAmount: number;
  sector?: string;
}

/**
 * Represents an adjusted exposure after forecast application
 */
export interface AdjustedExposure extends Exposure {
  adjustedCsi: number;
  delta: number;
  forecastDrivers: string[];
  outlook: string;
  riskTrend: string;
  expectedReturn: number;
  sectorMultiplier?: number;
  applicableEvents: GeopoliticalEvent[];
}

/**
 * Detailed breakdown of forecast impact
 */
export interface ForecastImpact {
  countryCode: string;
  baseCsi: number;
  delta: number;
  sectorMultiplier: number;
  totalAdjustment: number;
  adjustedCsi: number;
  drivers: string[];
  outlook: string;
  riskTrend: string;
  expectedReturn: number;
  applicableEvents: GeopoliticalEvent[];
}

/**
 * Result of forecast application with validation
 */
export interface ForecastApplicationResult {
  adjustedExposures: AdjustedExposure[];
  validationResults: {
    guardrail1: boolean; // No New Exposure Inference
    guardrail2: boolean; // Additive CSI Deltas Only
    guardrail3: boolean; // Existing Exposure Only
    guardrail4: boolean; // Expected Path, Not Stress
    guardrail5: boolean; // No Dense Propagation
    guardrail6: boolean; // Clear Labeling
  };
  errors: string[];
  warnings: string[];
  metadata: {
    forecastYear: string;
    appliedAt: string;
    totalExposures: number;
    adjustedExposures: number;
  };
}

/**
 * Apply CedarOwl forecast to a single country's CSI score
 * 
 * Guardrails Enforced:
 * - Guardrail 2: Additive CSI Deltas Only
 * - Guardrail 3: Existing Exposure Only
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param baseCsi - Base CSI score before forecast adjustment
 * @param sector - Optional sector for sector-specific multipliers
 * @returns Adjusted CSI score
 * 
 * @example
 * ```typescript
 * const adjustedCsi = applyForecastToCountry('US', 45.2);
 * // Returns: 44.0 (45.2 + (-1.2) delta)
 * ```
 */
export function applyForecastToCountry(
  countryCode: string,
  baseCsi: number,
  sector?: string
): number {
  // Get country adjustment from forecast data
  const adjustment = getCountryAdjustment(countryCode);
  
  // If no forecast data available, return base CSI unchanged
  if (!adjustment) {
    return baseCsi;
  }

  // Get sector multiplier if sector provided
  let sectorMultiplier = 1.0;
  if (sector) {
    sectorMultiplier = getSectorMultiplier(sector);
  }

  // Calculate delta with sector multiplier
  const delta = adjustment.delta * sectorMultiplier;

  // Apply additive adjustment (Guardrail 2)
  const adjustedCsi = baseCsi + delta;

  // Validate additive delta (Guardrail 2)
  const validation = validateAdditiveDelta(baseCsi, delta, adjustedCsi);
  if (!validation.valid) {
    console.warn(`Guardrail 2 violation for ${countryCode}:`, validation.errors);
  }

  return adjustedCsi;
}

/**
 * Apply CedarOwl forecast to an entire portfolio of exposures
 * 
 * Guardrails Enforced:
 * - Guardrail 1: No New Exposure Inference
 * - Guardrail 2: Additive CSI Deltas Only
 * - Guardrail 3: Existing Exposure Only
 * - Guardrail 4: Expected Path, Not Stress
 * - Guardrail 5: No Dense Propagation
 * - Guardrail 6: Clear Labeling
 * 
 * @param exposures - Array of country exposures in the portfolio
 * @param forecastYear - Year of forecast to apply (default: '2026')
 * @returns Result object with adjusted exposures and validation results
 * 
 * @example
 * ```typescript
 * const exposures = [
 *   { countryCode: 'US', countryName: 'United States', baseCsi: 45.2, exposureAmount: 1000000 },
 *   { countryCode: 'CN', countryName: 'China', baseCsi: 52.1, exposureAmount: 500000 }
 * ];
 * const result = applyForecastToPortfolio(exposures);
 * ```
 */
export function applyForecastToPortfolio(
  exposures: Exposure[],
  forecastYear: string = '2026'
): ForecastApplicationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Load forecast data
  const forecast = loadCedarOwlForecast(forecastYear);

  // Guardrail 4: Validate Expected Path, Not Stress
  const g4Validation = validateExpectedPath(forecast);
  if (!g4Validation.valid) {
    errors.push(...g4Validation.errors);
    warnings.push(...g4Validation.warnings);
  }

  // Guardrail 3: Validate Existing Exposure Only
  const g3Validation = validateExistingExposureOnly(exposures);
  if (!g3Validation.valid) {
    errors.push(...g3Validation.errors);
  }

  // Apply forecast to each exposure
  const adjustedExposures: AdjustedExposure[] = exposures.map(exposure => {
    const adjustment = getCountryAdjustment(exposure.countryCode);
    
    if (!adjustment) {
      // No forecast data for this country - return unchanged
      return {
        ...exposure,
        adjustedCsi: exposure.baseCsi,
        delta: 0,
        forecastDrivers: [],
        outlook: 'NEUTRAL',
        riskTrend: 'STABLE',
        expectedReturn: 0,
        applicableEvents: []
      };
    }

    // Get sector multiplier
    let sectorMultiplier = 1.0;
    if (exposure.sector) {
      sectorMultiplier = getSectorMultiplier(exposure.sector);
    }

    // Calculate delta
    const delta = adjustment.delta * sectorMultiplier;

    // Apply additive adjustment (Guardrail 2)
    const adjustedCsi = exposure.baseCsi + delta;

    // Validate additive delta (Guardrail 2)
    const g2Validation = validateAdditiveDelta(exposure.baseCsi, delta, adjustedCsi);
    if (!g2Validation.valid) {
      errors.push(...g2Validation.errors);
    }

    // Get applicable events
    const applicableEvents = getEventsByCountry(exposure.countryCode);

    return {
      ...exposure,
      adjustedCsi,
      delta,
      forecastDrivers: adjustment.drivers,
      outlook: adjustment.outlook,
      riskTrend: adjustment.riskTrend,
      expectedReturn: adjustment.expectedReturn,
      sectorMultiplier: exposure.sector ? sectorMultiplier : undefined,
      applicableEvents
    };
  });

  // Guardrail 1: Validate No New Exposure Inference
  const g1Validation = validateNoNewExposure(exposures, adjustedExposures);
  if (!g1Validation.valid) {
    errors.push(...g1Validation.errors);
  }

  // Guardrail 5: Validate No Dense Propagation
  const adjustments = adjustedExposures
    .map(exp => getCountryAdjustment(exp.countryCode))
    .filter((adj): adj is CountryAdjustment => adj !== null);
  
  const g5Validation = validateNoDensePropagation(adjustments);
  if (!g5Validation.valid) {
    warnings.push(...g5Validation.warnings);
  }

  // Guardrail 6: Validate Clear Labeling
  const output = {
    mode: 'forecast-baseline',
    forecastYear,
    adjustedExposures
  };
  const g6Validation = validateClearLabeling(output);
  if (!g6Validation.valid) {
    errors.push(...g6Validation.errors);
  }

  return {
    adjustedExposures,
    validationResults: {
      guardrail1: g1Validation.valid,
      guardrail2: adjustedExposures.every(exp => {
        const adj = getCountryAdjustment(exp.countryCode);
        if (!adj) return true;
        const sectorMult = exp.sector ? getSectorMultiplier(exp.sector) : 1.0;
        const delta = adj.delta * sectorMult;
        return validateAdditiveDelta(exp.baseCsi, delta, exp.adjustedCsi).valid;
      }),
      guardrail3: g3Validation.valid,
      guardrail4: g4Validation.valid,
      guardrail5: g5Validation.valid,
      guardrail6: g6Validation.valid
    },
    errors,
    warnings,
    metadata: {
      forecastYear,
      appliedAt: new Date().toISOString(),
      totalExposures: exposures.length,
      adjustedExposures: adjustedExposures.filter(exp => exp.delta !== 0).length
    }
  };
}

/**
 * Calculate detailed forecast impact for a specific country
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param baseCsi - Base CSI score
 * @param sector - Optional sector for sector-specific multipliers
 * @returns Detailed forecast impact breakdown
 * 
 * @example
 * ```typescript
 * const impact = calculateForecastImpact('US', 45.2, 'Technology');
 * console.log(impact.totalAdjustment); // -1.5 (delta * sector multiplier)
 * ```
 */
export function calculateForecastImpact(
  countryCode: string,
  baseCsi: number,
  sector?: string
): ForecastImpact {
  const adjustment = getCountryAdjustment(countryCode);
  
  if (!adjustment) {
    return {
      countryCode,
      baseCsi,
      delta: 0,
      sectorMultiplier: 1.0,
      totalAdjustment: 0,
      adjustedCsi: baseCsi,
      drivers: [],
      outlook: 'NEUTRAL',
      riskTrend: 'STABLE',
      expectedReturn: 0,
      applicableEvents: []
    };
  }

  const sectorMultiplier = sector ? getSectorMultiplier(sector) : 1.0;
  const totalAdjustment = adjustment.delta * sectorMultiplier;
  const adjustedCsi = baseCsi + totalAdjustment;
  const applicableEvents = getEventsByCountry(countryCode);

  return {
    countryCode,
    baseCsi,
    delta: adjustment.delta,
    sectorMultiplier,
    totalAdjustment,
    adjustedCsi,
    drivers: adjustment.drivers,
    outlook: adjustment.outlook,
    riskTrend: adjustment.riskTrend,
    expectedReturn: adjustment.expectedReturn,
    applicableEvents
  };
}

/**
 * Get all geopolitical events applicable to a specific country
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of applicable events, sorted by probability (descending)
 * 
 * @example
 * ```typescript
 * const events = getApplicableEvents('US');
 * console.log(events[0].event); // "US-Venezuela Intervention"
 * console.log(events[0].probability); // 0.95
 * ```
 */
export function getApplicableEvents(countryCode: string): GeopoliticalEvent[] {
  const events = getEventsByCountry(countryCode);
  
  // Sort by probability (descending)
  return events.sort((a, b) => b.probability - a.probability);
}