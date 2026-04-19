/**
 * Phase 5D: Forecast Validation Utilities
 * 
 * Comprehensive validation logic for geopolitical forecast data
 */

import type {
  GeopoliticalForecast,
  ForecastMetadata,
  CountryAdjustment,
  GeopoliticalEvent,
  ForecastValidationResult,
  ForecastDataQuality
} from '@/types/forecast.types';

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const VALID_COUNTRY_CODES = new Set([
  'US', 'CN', 'JP', 'DE', 'GB', 'FR', 'IN', 'IT', 'BR', 'CA',
  'KR', 'RU', 'ES', 'AU', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH',
  'PL', 'TW', 'BE', 'SE', 'AR', 'NO', 'AT', 'AE', 'IL', 'SG',
  'HK', 'MY', 'PH', 'DK', 'CO', 'CL', 'FI', 'PK', 'VN', 'BD',
  'EG', 'IE', 'NZ', 'PT', 'CZ', 'RO', 'PE', 'GR', 'QA', 'HU'
]);

const VALID_SECTORS = new Set([
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
  'Consumer Defensive', 'Industrials', 'Energy', 'Basic Materials',
  'Utilities', 'Real Estate', 'Communication Services', 'Automotive'
]);

const VALID_OUTLOOKS = new Set(['IMPROVING', 'STABLE', 'DETERIORATING', 'VOLATILE']);
const VALID_RISK_TRENDS = new Set(['INCREASING', 'STABLE', 'DECREASING']);
const VALID_RISK_LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// ============================================================================
// METADATA VALIDATION
// ============================================================================

/**
 * Validate forecast metadata
 */
export function validateForecastMetadata(metadata: ForecastMetadata): string[] {
  const errors: string[] = [];

  // Required fields
  if (!metadata.forecastId) errors.push('Missing forecastId');
  if (!metadata.version) errors.push('Missing version');
  if (!metadata.forecastPeriod) errors.push('Missing forecastPeriod');
  if (!metadata.generatedDate) errors.push('Missing generatedDate');
  if (!metadata.nextUpdate) errors.push('Missing nextUpdate');
  if (!metadata.dataSource) errors.push('Missing dataSource');

  // Date validation
  try {
    const generated = new Date(metadata.generatedDate);
    const nextUpdate = new Date(metadata.nextUpdate);
    
    if (isNaN(generated.getTime())) {
      errors.push('Invalid generatedDate format');
    }
    if (isNaN(nextUpdate.getTime())) {
      errors.push('Invalid nextUpdate format');
    }
    if (generated >= nextUpdate) {
      errors.push('nextUpdate must be after generatedDate');
    }
  } catch (e) {
    errors.push('Date parsing error');
  }

  // Confidence validation
  if (typeof metadata.overallConfidence !== 'number' || 
      metadata.overallConfidence < 0 || 
      metadata.overallConfidence > 1) {
    errors.push('overallConfidence must be between 0 and 1');
  }

  // Data source validation
  if (!['Cedar Owl', 'Internal', 'Hybrid'].includes(metadata.dataSource)) {
    errors.push('Invalid dataSource value');
  }

  return errors;
}

// ============================================================================
// COUNTRY ADJUSTMENT VALIDATION
// ============================================================================

/**
 * Validate country adjustments
 */
export function validateCountryAdjustments(
  adjustments: Record<string, CountryAdjustment>
): string[] {
  const errors: string[] = [];

  for (const [country, adjustment] of Object.entries(adjustments)) {
    // Country code validation
    if (!isValidCountryCode(country)) {
      errors.push(`Invalid country code: ${country}`);
    }

    // Delta validation
    if (typeof adjustment.delta !== 'number' || 
        adjustment.delta < -10 || 
        adjustment.delta > 10) {
      errors.push(`${country}: delta must be between -10 and 10`);
    }

    // Drivers validation
    if (!Array.isArray(adjustment.drivers) || adjustment.drivers.length === 0) {
      errors.push(`${country}: drivers array cannot be empty`);
    }

    // Outlook validation
    if (!VALID_OUTLOOKS.has(adjustment.outlook)) {
      errors.push(`${country}: invalid outlook value`);
    }

    // Expected return validation
    if (typeof adjustment.expectedReturn !== 'number' || 
        adjustment.expectedReturn < -1 || 
        adjustment.expectedReturn > 1) {
      errors.push(`${country}: expectedReturn must be between -1 and 1`);
    }

    // Risk trend validation
    if (!VALID_RISK_TRENDS.has(adjustment.riskTrend)) {
      errors.push(`${country}: invalid riskTrend value`);
    }
  }

  return errors;
}

// ============================================================================
// GEOPOLITICAL EVENT VALIDATION
// ============================================================================

/**
 * Validate geopolitical events
 */
export function validateGeopoliticalEvents(events: GeopoliticalEvent[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(events)) {
    errors.push('geopoliticalEvents must be an array');
    return errors;
  }

  events.forEach((event, index) => {
    const prefix = `Event ${index + 1}`;

    // Required fields
    if (!event.event) errors.push(`${prefix}: missing event name`);
    if (!event.timeline) errors.push(`${prefix}: missing timeline`);
    if (!event.description) errors.push(`${prefix}: missing description`);

    // Probability validation
    if (typeof event.probability !== 'number' || 
        event.probability < 0 || 
        event.probability > 1) {
      errors.push(`${prefix}: probability must be between 0 and 1`);
    }

    // Risk level validation
    if (!VALID_RISK_LEVELS.has(event.riskLevel)) {
      errors.push(`${prefix}: invalid riskLevel`);
    }

    // Base impact validation
    if (typeof event.baseImpact !== 'number') {
      errors.push(`${prefix}: baseImpact must be a number`);
    }

    // Affected countries validation
    if (!Array.isArray(event.affectedCountries) || 
        event.affectedCountries.length === 0) {
      errors.push(`${prefix}: affectedCountries cannot be empty`);
    } else {
      event.affectedCountries.forEach(country => {
        if (!isValidCountryCode(country)) {
          errors.push(`${prefix}: invalid country code ${country}`);
        }
      });
    }

    // Sector impacts validation
    if (typeof event.sectorImpacts !== 'object') {
      errors.push(`${prefix}: sectorImpacts must be an object`);
    } else {
      for (const [sector, impact] of Object.entries(event.sectorImpacts)) {
        if (!VALID_SECTORS.has(sector)) {
          errors.push(`${prefix}: invalid sector ${sector}`);
        }
        if (typeof impact !== 'number') {
          errors.push(`${prefix}: sector impact for ${sector} must be a number`);
        }
      }
    }
  });

  return errors;
}

// ============================================================================
// REGIONAL PREMIUM VALIDATION
// ============================================================================

/**
 * Validate regional premiums
 */
export function validateRegionalPremiums(premiums: Record<string, number>): string[] {
  const errors: string[] = [];

  for (const [region, premium] of Object.entries(premiums)) {
    if (typeof premium !== 'number' || premium < -2 || premium > 2) {
      errors.push(`${region}: premium must be between -2 and 2`);
    }
  }

  return errors;
}

// ============================================================================
// SECTOR MULTIPLIER VALIDATION
// ============================================================================

/**
 * Validate sector multipliers
 */
export function validateSectorMultipliers(multipliers: Record<string, number>): string[] {
  const errors: string[] = [];

  for (const [sector, multiplier] of Object.entries(multipliers)) {
    if (!VALID_SECTORS.has(sector)) {
      errors.push(`Invalid sector: ${sector}`);
    }
    if (typeof multiplier !== 'number' || multiplier < 0.8 || multiplier > 1.2) {
      errors.push(`${sector}: multiplier must be between 0.8 and 1.2`);
    }
  }

  return errors;
}

// ============================================================================
// COMPLETE FORECAST VALIDATION
// ============================================================================

/**
 * Validate complete forecast data
 */
export function validateForecast(forecast: GeopoliticalForecast): ForecastValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate metadata
  errors.push(...validateForecastMetadata(forecast.metadata));

  // Validate country adjustments
  errors.push(...validateCountryAdjustments(forecast.countryAdjustments));

  // Validate geopolitical events
  errors.push(...validateGeopoliticalEvents(forecast.geopoliticalEvents));

  // Validate regional premiums
  errors.push(...validateRegionalPremiums(forecast.regionalPremiums));

  // Validate sector multipliers
  errors.push(...validateSectorMultipliers(forecast.sectorMultipliers));

  // Cross-validation checks
  const crossValidationErrors = performCrossValidation(forecast);
  errors.push(...crossValidationErrors);

  // Generate warnings
  warnings.push(...generateValidationWarnings(forecast));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      validatedAt: new Date().toISOString(),
      validatorVersion: '1.0.0',
      checksPerformed: [
        'metadata',
        'countryAdjustments',
        'geopoliticalEvents',
        'regionalPremiums',
        'sectorMultipliers',
        'crossValidation'
      ]
    }
  };
}

// ============================================================================
// CROSS-VALIDATION
// ============================================================================

/**
 * Perform cross-validation checks
 */
function performCrossValidation(forecast: GeopoliticalForecast): string[] {
  const errors: string[] = [];

  // Check for consistency between events and country adjustments
  forecast.geopoliticalEvents.forEach(event => {
    event.affectedCountries.forEach(country => {
      if (!forecast.countryAdjustments[country]) {
        errors.push(
          `Event "${event.event}" affects ${country} but no country adjustment exists`
        );
      }
    });
  });

  // Check for orphaned country adjustments
  const eventCountries = new Set(
    forecast.geopoliticalEvents.flatMap(e => e.affectedCountries)
  );
  
  for (const country of Object.keys(forecast.countryAdjustments)) {
    if (!eventCountries.has(country) && 
        Math.abs(forecast.countryAdjustments[country].delta) > 5) {
      errors.push(
        `Large adjustment for ${country} (${forecast.countryAdjustments[country].delta}) ` +
        `but no corresponding geopolitical event`
      );
    }
  }

  return errors;
}

// ============================================================================
// WARNING GENERATION
// ============================================================================

/**
 * Generate validation warnings
 */
function generateValidationWarnings(forecast: GeopoliticalForecast): string[] {
  const warnings: string[] = [];

  // Check for stale forecast
  const nextUpdate = new Date(forecast.metadata.nextUpdate);
  const now = new Date();
  if (nextUpdate < now) {
    warnings.push('Forecast is past its next update date and may be stale');
  }

  // Check for low confidence
  if (forecast.metadata.overallConfidence < 0.7) {
    warnings.push('Overall forecast confidence is below 70%');
  }

  // Check for extreme adjustments
  for (const [country, adjustment] of Object.entries(forecast.countryAdjustments)) {
    if (Math.abs(adjustment.delta) > 7) {
      warnings.push(`Extreme adjustment detected for ${country}: ${adjustment.delta} points`);
    }
  }

  // Check for high-probability critical events
  const criticalEvents = forecast.geopoliticalEvents.filter(
    e => e.riskLevel === 'CRITICAL' && e.probability > 0.5
  );
  if (criticalEvents.length > 0) {
    warnings.push(
      `${criticalEvents.length} high-probability critical event(s) detected`
    );
  }

  return warnings;
}

// ============================================================================
// DATA QUALITY ASSESSMENT
// ============================================================================

/**
 * Assess forecast data quality
 */
export function assessForecastDataQuality(
  forecast: GeopoliticalForecast
): ForecastDataQuality {
  const issues: string[] = [];

  // Completeness check
  const completeness = calculateCompleteness(forecast, issues);

  // Consistency check
  const consistency = calculateConsistency(forecast, issues);

  // Timeliness check
  const timeliness = calculateTimeliness(forecast, issues);

  // Accuracy estimation (based on confidence)
  const accuracy = forecast.metadata.overallConfidence;

  // Overall quality score
  const overall = (completeness + consistency + timeliness + accuracy) / 4;

  return {
    completeness,
    consistency,
    timeliness,
    accuracy,
    overall,
    issues
  };
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(
  forecast: GeopoliticalForecast,
  issues: string[]
): number {
  let score = 1.0;

  // Check for missing optional fields
  if (!forecast.metadata.analystNotes) {
    score -= 0.1;
    issues.push('Missing analyst notes');
  }

  // Check coverage
  const countryCount = Object.keys(forecast.countryAdjustments).length;
  if (countryCount < 20) {
    score -= 0.2;
    issues.push(`Limited country coverage: ${countryCount} countries`);
  }

  const eventCount = forecast.geopoliticalEvents.length;
  if (eventCount < 5) {
    score -= 0.1;
    issues.push(`Limited event coverage: ${eventCount} events`);
  }

  return Math.max(0, score);
}

/**
 * Calculate consistency score
 */
function calculateConsistency(
  forecast: GeopoliticalForecast,
  issues: string[]
): number {
  let score = 1.0;

  // Check for logical inconsistencies
  for (const [country, adjustment] of Object.entries(forecast.countryAdjustments)) {
    // Deteriorating outlook should have negative delta
    if (adjustment.outlook === 'DETERIORATING' && adjustment.delta > 0) {
      score -= 0.1;
      issues.push(`${country}: Deteriorating outlook with positive delta`);
    }

    // Improving outlook should have positive delta
    if (adjustment.outlook === 'IMPROVING' && adjustment.delta < 0) {
      score -= 0.1;
      issues.push(`${country}: Improving outlook with negative delta`);
    }
  }

  return Math.max(0, score);
}

/**
 * Calculate timeliness score
 */
function calculateTimeliness(
  forecast: GeopoliticalForecast,
  issues: string[]
): number {
  const generated = new Date(forecast.metadata.generatedDate);
  const now = new Date();
  const ageInDays = (now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24);

  let score = 1.0;

  if (ageInDays > 30) {
    score -= 0.3;
    issues.push(`Forecast is ${Math.round(ageInDays)} days old`);
  } else if (ageInDays > 14) {
    score -= 0.1;
    issues.push(`Forecast is ${Math.round(ageInDays)} days old`);
  }

  return Math.max(0, score);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if country code is valid
 */
export function isValidCountryCode(code: string): boolean {
  return VALID_COUNTRY_CODES.has(code);
}

/**
 * Check if forecast is stale
 */
export function isForecastStale(forecast: GeopoliticalForecast): boolean {
  const nextUpdate = new Date(forecast.metadata.nextUpdate);
  const now = new Date();
  return nextUpdate < now;
}

/**
 * Get forecast age in days
 */
export function getForecastAge(forecast: GeopoliticalForecast): number {
  const generated = new Date(forecast.metadata.generatedDate);
  const now = new Date();
  return (now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24);
}