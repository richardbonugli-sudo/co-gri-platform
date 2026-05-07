/**
 * Validation utilities for CedarOwl forecast data
 * 
 * This module provides comprehensive validation functions to ensure
 * data integrity and consistency of forecast data.
 * 
 * @module forecastValidation
 */

import type {
  CedarOwlForecast,
  ForecastMetadata,
  CountryAdjustment,
  GeopoliticalEvent,
  ValidationResult
} from '../types/forecast';

/**
 * Validate forecast metadata
 */
export function validateForecastMetadata(metadata: ForecastMetadata): string[] {
  const errors: string[] = [];

  if (!metadata.forecastPeriod || typeof metadata.forecastPeriod !== 'string') {
    errors.push('Missing or invalid forecastPeriod');
  }

  if (!metadata.publishDate || typeof metadata.publishDate !== 'string') {
    errors.push('Missing or invalid publishDate');
  }

  if (typeof metadata.expertSources !== 'number' || metadata.expertSources <= 0) {
    errors.push('Invalid expertSources count');
  }

  if (typeof metadata.overallConfidence !== 'number' || 
      metadata.overallConfidence < 0 || 
      metadata.overallConfidence > 1) {
    errors.push('Invalid overallConfidence (must be between 0 and 1)');
  }

  if (!metadata.nextUpdate || typeof metadata.nextUpdate !== 'string') {
    errors.push('Missing or invalid nextUpdate');
  }

  if (!metadata.coverage || typeof metadata.coverage !== 'object') {
    errors.push('Missing or invalid coverage object');
  } else {
    if (typeof metadata.coverage.countries !== 'number' || metadata.coverage.countries <= 0) {
      errors.push('Invalid coverage.countries');
    }
    if (typeof metadata.coverage.events !== 'number' || metadata.coverage.events <= 0) {
      errors.push('Invalid coverage.events');
    }
    if (typeof metadata.coverage.regions !== 'number' || metadata.coverage.regions <= 0) {
      errors.push('Invalid coverage.regions');
    }
    if (typeof metadata.coverage.assetClasses !== 'number' || metadata.coverage.assetClasses <= 0) {
      errors.push('Invalid coverage.assetClasses');
    }
  }

  return errors;
}

/**
 * Validate country adjustments
 */
export function validateCountryAdjustments(
  adjustments: Record<string, CountryAdjustment>
): string[] {
  const errors: string[] = [];
  const validOutlooks = ['STRONG_BUY', 'BUY', 'OUTPERFORM', 'SELECTIVE', 'NEUTRAL', 'UNDERPERFORM', 'AVOID', 'HIGH_RISK'];
  const validTrends = ['IMPROVING', 'STABLE', 'DETERIORATING'];

  for (const [countryCode, adjustment] of Object.entries(adjustments)) {
    // Validate country code format (ISO 3166-1 alpha-2)
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      errors.push(`Invalid country code format: ${countryCode}`);
    }

    // Validate delta range
    if (typeof adjustment.delta !== 'number' || adjustment.delta < -10 || adjustment.delta > 10) {
      errors.push(`Invalid delta for ${countryCode}: ${adjustment.delta} (must be between -10 and 10)`);
    }

    // Validate drivers
    if (!Array.isArray(adjustment.drivers) || adjustment.drivers.length === 0) {
      errors.push(`Missing or empty drivers for ${countryCode}`);
    }

    // Validate outlook
    if (!validOutlooks.includes(adjustment.outlook)) {
      errors.push(`Invalid outlook for ${countryCode}: ${adjustment.outlook}`);
    }

    // Validate expected return
    if (typeof adjustment.expectedReturn !== 'number' || adjustment.expectedReturn < -1 || adjustment.expectedReturn > 1) {
      errors.push(`Invalid expectedReturn for ${countryCode}: ${adjustment.expectedReturn}`);
    }

    // Validate risk trend
    if (!validTrends.includes(adjustment.riskTrend)) {
      errors.push(`Invalid riskTrend for ${countryCode}: ${adjustment.riskTrend}`);
    }
  }

  return errors;
}

/**
 * Validate geopolitical events
 */
export function validateGeopoliticalEvents(events: GeopoliticalEvent[]): string[] {
  const errors: string[] = [];
  const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  if (!Array.isArray(events)) {
    errors.push('geopoliticalEvents must be an array');
    return errors;
  }

  events.forEach((event, index) => {
    if (!event.event || typeof event.event !== 'string') {
      errors.push(`Event ${index}: missing or invalid event name`);
    }

    if (!event.timeline || typeof event.timeline !== 'string') {
      errors.push(`Event ${index}: missing or invalid timeline`);
    }

    if (typeof event.probability !== 'number' || event.probability < 0 || event.probability > 1) {
      errors.push(`Event ${index}: invalid probability (must be between 0 and 1)`);
    }

    if (!validRiskLevels.includes(event.riskLevel)) {
      errors.push(`Event ${index}: invalid riskLevel: ${event.riskLevel}`);
    }

    if (typeof event.baseImpact !== 'number' || event.baseImpact < 0) {
      errors.push(`Event ${index}: invalid baseImpact`);
    }

    if (!Array.isArray(event.affectedCountries) || event.affectedCountries.length === 0) {
      errors.push(`Event ${index}: missing or empty affectedCountries`);
    }

    if (typeof event.sectorImpacts !== 'object' || Object.keys(event.sectorImpacts).length === 0) {
      errors.push(`Event ${index}: missing or empty sectorImpacts`);
    }

    if (!event.description || typeof event.description !== 'string') {
      errors.push(`Event ${index}: missing or invalid description`);
    }

    if (!event.investmentImpact || typeof event.investmentImpact !== 'string') {
      errors.push(`Event ${index}: missing or invalid investmentImpact`);
    }
  });

  return errors;
}

/**
 * Validate regional premiums
 */
export function validateRegionalPremiums(premiums: Record<string, number>): string[] {
  const errors: string[] = [];

  for (const [region, premium] of Object.entries(premiums)) {
    if (typeof premium !== 'number' || premium <= 0 || premium > 2) {
      errors.push(`Invalid premium for region ${region}: ${premium} (must be between 0 and 2)`);
    }
  }

  return errors;
}

/**
 * Validate sector multipliers
 */
export function validateSectorMultipliers(multipliers: Record<string, number>): string[] {
  const errors: string[] = [];

  for (const [sector, multiplier] of Object.entries(multipliers)) {
    if (typeof multiplier !== 'number' || multiplier <= 0 || multiplier > 2) {
      errors.push(`Invalid multiplier for sector ${sector}: ${multiplier} (must be between 0 and 2)`);
    }
  }

  return errors;
}

/**
 * Comprehensive forecast validation
 */
export function validateForecast(forecast: CedarOwlForecast): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate metadata
  errors.push(...validateForecastMetadata(forecast.metadata));

  // Validate country adjustments
  errors.push(...validateCountryAdjustments(forecast.countryAdjustments));

  // Check country count matches metadata
  const actualCountryCount = Object.keys(forecast.countryAdjustments).length;
  if (actualCountryCount !== forecast.metadata.coverage.countries) {
    warnings.push(
      `Country count mismatch: metadata says ${forecast.metadata.coverage.countries}, ` +
      `but found ${actualCountryCount} countries`
    );
  }

  // Validate geopolitical events
  errors.push(...validateGeopoliticalEvents(forecast.geopoliticalEvents));

  // Check event count matches metadata
  if (forecast.geopoliticalEvents.length !== forecast.metadata.coverage.events) {
    warnings.push(
      `Event count mismatch: metadata says ${forecast.metadata.coverage.events}, ` +
      `but found ${forecast.geopoliticalEvents.length} events`
    );
  }

  // Validate regional premiums
  errors.push(...validateRegionalPremiums(forecast.regionalPremiums));

  // Validate sector multipliers
  errors.push(...validateSectorMultipliers(forecast.sectorMultipliers));

  // Validate asset class forecasts
  if (!forecast.assetClassForecasts || typeof forecast.assetClassForecasts !== 'object') {
    errors.push('Missing or invalid assetClassForecasts');
  }

  // Validate regional outlook
  if (!forecast.regionalOutlook || typeof forecast.regionalOutlook !== 'object') {
    errors.push('Missing or invalid regionalOutlook');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if forecast is stale (past next update date)
 */
export function isForecastStale(forecast: CedarOwlForecast): boolean {
  const nextUpdate = new Date(forecast.metadata.nextUpdate);
  const now = new Date();
  return now > nextUpdate;
}

/**
 * Validate country code format (ISO 3166-1 alpha-2)
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Validate date format (ISO 8601)
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}