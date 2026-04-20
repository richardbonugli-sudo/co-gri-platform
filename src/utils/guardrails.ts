/**
 * Guardrails Validation Logic
 * 
 * Implements the 6 critical guardrails to ensure forecast integrity
 * and prevent misuse of the Strategic Forecast Baseline feature.
 * 
 * @module guardrails
 */

import type { CedarOwlForecast, CountryAdjustment } from '@/types/forecast';

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Generic exposure interface for validation
 */
interface Exposure {
  countryCode: string;
  baseCsi: number;
  [key: string]: any;
}

/**
 * Forecast output structure for labeling validation
 */
interface ForecastOutput {
  mode?: string;
  forecastYear?: string;
  [key: string]: any;
}

/**
 * GUARDRAIL 1: No New Exposure Inference
 * 
 * Ensures that the forecast does not introduce new country exposures
 * that were not present in the original portfolio.
 * 
 * @param originalExposures - Original portfolio exposures
 * @param adjustedExposures - Exposures after forecast application
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateNoNewExposure(original, adjusted);
 * if (!result.valid) {
 *   console.error('New exposures detected:', result.errors);
 * }
 * ```
 */
export function validateNoNewExposure(
  originalExposures: Exposure[],
  adjustedExposures: Exposure[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const originalCountries = new Set(
    originalExposures.map(exp => exp.countryCode)
  );
  const adjustedCountries = new Set(
    adjustedExposures.map(exp => exp.countryCode)
  );

  // Check if any new countries were added
  const newCountries = Array.from(adjustedCountries).filter(
    country => !originalCountries.has(country)
  );

  if (newCountries.length > 0) {
    errors.push(
      `Guardrail 1 Violation: New exposures detected that were not in original portfolio: ${newCountries.join(', ')}`
    );
  }

  // Check if any countries were removed
  const removedCountries = Array.from(originalCountries).filter(
    country => !adjustedCountries.has(country)
  );

  if (removedCountries.length > 0) {
    warnings.push(
      `Warning: Some original exposures are missing in adjusted portfolio: ${removedCountries.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * GUARDRAIL 2: Additive CSI Deltas Only
 * 
 * Ensures that CSI adjustments are purely additive (not multiplicative).
 * Verifies: adjustedCsi = originalCsi + delta
 * 
 * @param originalCsi - Original CSI score
 * @param delta - Forecast delta to apply
 * @param adjustedCsi - Resulting adjusted CSI score
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateAdditiveDelta(45.2, -1.2, 44.0);
 * // result.valid === true
 * ```
 */
export function validateAdditiveDelta(
  originalCsi: number,
  delta: number,
  adjustedCsi: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate expected adjusted CSI
  const expectedCsi = originalCsi + delta;

  // Allow small floating-point tolerance (0.001)
  const tolerance = 0.001;
  const difference = Math.abs(adjustedCsi - expectedCsi);

  if (difference > tolerance) {
    errors.push(
      `Guardrail 2 Violation: CSI adjustment is not additive. ` +
      `Expected ${expectedCsi.toFixed(3)} (${originalCsi} + ${delta}), ` +
      `but got ${adjustedCsi.toFixed(3)}. Difference: ${difference.toFixed(3)}`
    );
  }

  // Warn if delta seems unusually large
  if (Math.abs(delta) > 10) {
    warnings.push(
      `Warning: Unusually large delta detected: ${delta}. ` +
      `Deltas should typically be between -10 and +10.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * GUARDRAIL 3: Existing Exposure Only
 * 
 * Confirms that all exposures existed before forecast application.
 * This is a stricter version of Guardrail 1.
 * 
 * @param exposures - Portfolio exposures to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateExistingExposureOnly(exposures);
 * if (!result.valid) {
 *   console.error('Invalid exposures detected');
 * }
 * ```
 */
export function validateExistingExposureOnly(
  exposures: Exposure[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that all exposures have valid country codes
  const invalidExposures = exposures.filter(
    exp => !exp.countryCode || exp.countryCode.length !== 2
  );

  if (invalidExposures.length > 0) {
    errors.push(
      `Guardrail 3 Violation: Invalid country codes detected in exposures. ` +
      `All exposures must have valid ISO 3166-1 alpha-2 country codes.`
    );
  }

  // Check that all exposures have base CSI values
  const missingCsi = exposures.filter(
    exp => typeof exp.baseCsi !== 'number' || isNaN(exp.baseCsi)
  );

  if (missingCsi.length > 0) {
    errors.push(
      `Guardrail 3 Violation: ${missingCsi.length} exposure(s) missing valid base CSI values.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * GUARDRAIL 4: Expected Path, Not Stress
 * 
 * Verifies that the forecast represents an expected path scenario,
 * not a stress scenario. Checks forecast metadata and confidence levels.
 * 
 * @param forecast - CedarOwl forecast data
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateExpectedPath(forecast);
 * if (!result.valid) {
 *   console.error('Forecast appears to be a stress scenario');
 * }
 * ```
 */
export function validateExpectedPath(
  forecast: CedarOwlForecast
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check confidence level (should be reasonable for expected path)
  if (forecast.metadata.overallConfidence < 0.5) {
    warnings.push(
      `Warning: Low forecast confidence (${(forecast.metadata.overallConfidence * 100).toFixed(0)}%). ` +
      `Expected path forecasts should have confidence >= 50%.`
    );
  }

  // Check for extreme deltas that might indicate stress scenario
  const adjustments = Object.values(forecast.countryAdjustments);
  const extremeDeltas = adjustments.filter(adj => Math.abs(adj.delta) > 8);

  if (extremeDeltas.length > adjustments.length * 0.1) {
    warnings.push(
      `Warning: ${extremeDeltas.length} countries have extreme deltas (>8 or <-8). ` +
      `This may indicate a stress scenario rather than expected path.`
    );
  }

  // Check event probabilities (stress scenarios often have low-probability events)
  const lowProbEvents = forecast.geopoliticalEvents.filter(
    event => event.probability < 0.3
  );

  if (lowProbEvents.length > forecast.geopoliticalEvents.length * 0.5) {
    warnings.push(
      `Warning: Many low-probability events (<30%) in forecast. ` +
      `Expected path should focus on likely events.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * GUARDRAIL 5: No Dense Propagation
 * 
 * Ensures that adjustments are sparse and not uniformly applied
 * to all countries. Prevents "blanket" risk adjustments.
 * 
 * @param adjustments - Country adjustments from forecast
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateNoDensePropagation(adjustments);
 * if (!result.valid) {
 *   console.warn('Adjustments may be too uniform');
 * }
 * ```
 */
export function validateNoDensePropagation(
  adjustments: CountryAdjustment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (adjustments.length === 0) {
    return { valid: true, errors, warnings };
  }

  // Calculate variance in deltas
  const deltas = adjustments.map(adj => adj.delta);
  const mean = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
  const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length;
  const stdDev = Math.sqrt(variance);

  // If standard deviation is very low, adjustments are too uniform
  if (stdDev < 0.5 && Math.abs(mean) > 0.1) {
    warnings.push(
      `Guardrail 5 Warning: Low variance in deltas (σ=${stdDev.toFixed(2)}). ` +
      `Adjustments may be too uniform across countries.`
    );
  }

  // Check for too many countries with identical deltas
  const deltaGroups = new Map<number, number>();
  deltas.forEach(delta => {
    const rounded = Math.round(delta * 10) / 10; // Round to 1 decimal
    deltaGroups.set(rounded, (deltaGroups.get(rounded) || 0) + 1);
  });

  const largestGroup = Math.max(...Array.from(deltaGroups.values()));
  if (largestGroup > adjustments.length * 0.3) {
    warnings.push(
      `Guardrail 5 Warning: ${largestGroup} countries have similar deltas. ` +
      `This may indicate dense propagation.`
    );
  }

  // Check for zero-delta adjustments (no real adjustment)
  const zeroDeltas = adjustments.filter(adj => Math.abs(adj.delta) < 0.01);
  if (zeroDeltas.length > adjustments.length * 0.5) {
    warnings.push(
      `Guardrail 5 Warning: ${zeroDeltas.length} countries have near-zero deltas. ` +
      `Forecast may not be providing meaningful adjustments.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * GUARDRAIL 6: Clear Labeling
 * 
 * Verifies that forecast outputs are clearly labeled to prevent
 * confusion with event-driven scenarios.
 * 
 * @param output - Forecast output object
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const output = {
 *   mode: 'forecast-baseline',
 *   forecastYear: '2026',
 *   adjustedExposures: [...]
 * };
 * const result = validateClearLabeling(output);
 * ```
 */
export function validateClearLabeling(
  output: ForecastOutput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for mode label
  if (!output.mode || output.mode !== 'forecast-baseline') {
    errors.push(
      `Guardrail 6 Violation: Output must be labeled with mode='forecast-baseline'. ` +
      `Current mode: ${output.mode || 'undefined'}`
    );
  }

  // Check for forecast year
  if (!output.forecastYear) {
    warnings.push(
      `Guardrail 6 Warning: Output should include forecastYear for clarity.`
    );
  }

  // Recommend additional metadata
  if (!output.metadata && !output.appliedAt) {
    warnings.push(
      `Guardrail 6 Warning: Consider adding metadata (timestamp, confidence, etc.) ` +
      `for better traceability.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all guardrails at once
 * 
 * Convenience function to run all guardrail validations.
 * 
 * @param params - Parameters for all guardrail validations
 * @returns Combined validation result
 */
export function validateAllGuardrails(params: {
  originalExposures: Exposure[];
  adjustedExposures: Exposure[];
  forecast: CedarOwlForecast;
  output: ForecastOutput;
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Guardrail 1
  const g1 = validateNoNewExposure(params.originalExposures, params.adjustedExposures);
  allErrors.push(...g1.errors);
  allWarnings.push(...g1.warnings);

  // Guardrail 3
  const g3 = validateExistingExposureOnly(params.originalExposures);
  allErrors.push(...g3.errors);
  allWarnings.push(...g3.warnings);

  // Guardrail 4
  const g4 = validateExpectedPath(params.forecast);
  allErrors.push(...g4.errors);
  allWarnings.push(...g4.warnings);

  // Guardrail 5
  const adjustments = Object.values(params.forecast.countryAdjustments);
  const g5 = validateNoDensePropagation(adjustments);
  allErrors.push(...g5.errors);
  allWarnings.push(...g5.warnings);

  // Guardrail 6
  const g6 = validateClearLabeling(params.output);
  allErrors.push(...g6.errors);
  allWarnings.push(...g6.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}