/**
 * CO-GRI Calculator with Forecast Integration
 * 
 * Modified CO-GRI calculator that optionally applies CedarOwl forecast
 * adjustments while maintaining backward compatibility.
 * 
 * @module cogriCalculator
 */

import { applyForecastToPortfolio } from '@/services/forecastEngine';
import type { Exposure, AdjustedExposure } from '@/services/forecastEngine';

/**
 * CO-GRI calculation options
 */
export interface COGRIOptions {
  /** Whether to apply CedarOwl forecast adjustments */
  useForecast?: boolean;
  /** Year of forecast to apply (default: '2026') */
  forecastYear?: string;
}

/**
 * CO-GRI calculation result
 */
export interface COGRIResult {
  /** Overall CO-GRI score */
  score: number;
  /** Risk level classification */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  /** Breakdown by country */
  countryBreakdown: CountryRiskBreakdown[];
  /** Forecast metadata (if forecast was applied) */
  forecastMetadata?: {
    applied: boolean;
    forecastYear: string;
    appliedAt: string;
    adjustedExposures: number;
    totalExposures: number;
    guardrailsValid: boolean;
  };
}

/**
 * Country risk breakdown
 */
export interface CountryRiskBreakdown {
  countryCode: string;
  countryName: string;
  csi: number;
  exposureAmount: number;
  riskContribution: number;
  /** Forecast-specific fields (only present if forecast applied) */
  forecastData?: {
    baseCsi: number;
    delta: number;
    adjustedCsi: number;
    drivers: string[];
    outlook: string;
    riskTrend: string;
  };
}

/**
 * Calculate CO-GRI score for a portfolio
 * 
 * This function maintains backward compatibility while adding optional
 * forecast integration. When useForecast is false or undefined, it
 * behaves exactly as the original implementation.
 * 
 * @param exposures - Array of country exposures
 * @param options - Optional calculation options
 * @returns CO-GRI calculation result
 * 
 * @example
 * ```typescript
 * // Original usage (no forecast)
 * const result = calculateCOGRI(exposures);
 * 
 * // With forecast
 * const resultWithForecast = calculateCOGRI(exposures, {
 *   useForecast: true,
 *   forecastYear: '2026'
 * });
 * ```
 */
export function calculateCOGRI(
  exposures: Exposure[],
  options?: COGRIOptions
): COGRIResult {
  const useForecast = options?.useForecast ?? false;
  const forecastYear = options?.forecastYear ?? '2026';

  let workingExposures: (Exposure | AdjustedExposure)[] = exposures;
  let forecastMetadata: COGRIResult['forecastMetadata'] = undefined;

  // Apply forecast if requested
  if (useForecast) {
    const forecastResult = applyForecastToPortfolio(exposures, forecastYear);
    workingExposures = forecastResult.adjustedExposures;

    // Check if all guardrails passed
    const guardrailsValid = Object.values(forecastResult.validationResults).every(v => v);

    forecastMetadata = {
      applied: true,
      forecastYear: forecastResult.metadata.forecastYear,
      appliedAt: forecastResult.metadata.appliedAt,
      adjustedExposures: forecastResult.metadata.adjustedExposures,
      totalExposures: forecastResult.metadata.totalExposures,
      guardrailsValid
    };

    // Log warnings if any
    if (forecastResult.warnings.length > 0) {
      console.warn('Forecast application warnings:', forecastResult.warnings);
    }

    // Log errors if any (but continue with calculation)
    if (forecastResult.errors.length > 0) {
      console.error('Forecast application errors:', forecastResult.errors);
    }
  }

  // Calculate total exposure
  const totalExposure = workingExposures.reduce(
    (sum, exp) => sum + exp.exposureAmount,
    0
  );

  // Calculate weighted CSI for each country
  const countryBreakdown: CountryRiskBreakdown[] = workingExposures.map(exp => {
    const weight = exp.exposureAmount / totalExposure;
    const csi = 'adjustedCsi' in exp ? exp.adjustedCsi : exp.baseCsi;
    const riskContribution = csi * weight;

    const breakdown: CountryRiskBreakdown = {
      countryCode: exp.countryCode,
      countryName: exp.countryName,
      csi,
      exposureAmount: exp.exposureAmount,
      riskContribution
    };

    // Add forecast data if available
    if ('adjustedCsi' in exp && useForecast) {
      breakdown.forecastData = {
        baseCsi: exp.baseCsi,
        delta: exp.delta,
        adjustedCsi: exp.adjustedCsi,
        drivers: exp.forecastDrivers,
        outlook: exp.outlook,
        riskTrend: exp.riskTrend
      };
    }

    return breakdown;
  });

  // Calculate overall CO-GRI score (weighted average of CSI scores)
  const score = countryBreakdown.reduce(
    (sum, country) => sum + country.riskContribution,
    0
  );

  // Determine risk level
  let riskLevel: COGRIResult['riskLevel'];
  if (score < 30) {
    riskLevel = 'LOW';
  } else if (score < 50) {
    riskLevel = 'MEDIUM';
  } else if (score < 70) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  return {
    score,
    riskLevel,
    countryBreakdown,
    forecastMetadata
  };
}

/**
 * Compare CO-GRI scores with and without forecast
 * 
 * Utility function to show the impact of forecast adjustments.
 * 
 * @param exposures - Array of country exposures
 * @param forecastYear - Year of forecast to apply
 * @returns Comparison object
 * 
 * @example
 * ```typescript
 * const comparison = compareCOGRIWithForecast(exposures);
 * console.log(`Score change: ${comparison.scoreDelta}`);
 * console.log(`Risk level: ${comparison.baseline.riskLevel} → ${comparison.forecast.riskLevel}`);
 * ```
 */
export function compareCOGRIWithForecast(
  exposures: Exposure[],
  forecastYear: string = '2026'
) {
  const baseline = calculateCOGRI(exposures, { useForecast: false });
  const forecast = calculateCOGRI(exposures, { useForecast: true, forecastYear });

  return {
    baseline,
    forecast,
    scoreDelta: forecast.score - baseline.score,
    riskLevelChanged: baseline.riskLevel !== forecast.riskLevel
  };
}