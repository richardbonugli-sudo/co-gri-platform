/**
 * Unit tests for forecast validation utilities
 */

import { describe, test, expect } from '@jest/globals';
import {
  validateForecastMetadata,
  validateCountryAdjustments,
  validateGeopoliticalEvents,
  validateRegionalPremiums,
  validateSectorMultipliers,
  validateForecast,
  isForecastStale,
  isValidCountryCode
} from '../forecastValidation';
import { CEDAROWL_FORECAST_2026 } from '../../data/cedarOwlForecast2026';
import type { ForecastMetadata, CountryAdjustment, GeopoliticalEvent } from '../../types/forecast';

describe('Forecast Validation Utilities', () => {
  describe('validateForecastMetadata', () => {
    test('should validate correct metadata', () => {
      const errors = validateForecastMetadata(CEDAROWL_FORECAST_2026.metadata);
      expect(errors).toHaveLength(0);
    });

    test('should detect missing forecastPeriod', () => {
      const invalidMetadata = { ...CEDAROWL_FORECAST_2026.metadata, forecastPeriod: '' };
      const errors = validateForecastMetadata(invalidMetadata as ForecastMetadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('forecastPeriod'))).toBe(true);
    });

    test('should detect invalid confidence', () => {
      const invalidMetadata = { ...CEDAROWL_FORECAST_2026.metadata, overallConfidence: 1.5 };
      const errors = validateForecastMetadata(invalidMetadata as ForecastMetadata);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('confidence'))).toBe(true);
    });
  });

  describe('validateCountryAdjustments', () => {
    test('should validate correct country adjustments', () => {
      const errors = validateCountryAdjustments(CEDAROWL_FORECAST_2026.countryAdjustments);
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid country code', () => {
      const invalidAdjustments = {
        'INVALID': {
          delta: 2.0,
          drivers: ['Test'],
          outlook: 'NEUTRAL' as const,
          expectedReturn: 0.05,
          riskTrend: 'STABLE' as const
        }
      };
      const errors = validateCountryAdjustments(invalidAdjustments);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('country code'))).toBe(true);
    });

    test('should detect invalid delta range', () => {
      const invalidAdjustments = {
        'US': {
          delta: 15.0,
          drivers: ['Test'],
          outlook: 'NEUTRAL' as const,
          expectedReturn: 0.05,
          riskTrend: 'STABLE' as const
        }
      };
      const errors = validateCountryAdjustments(invalidAdjustments);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('delta'))).toBe(true);
    });

    test('should detect missing drivers', () => {
      const invalidAdjustments = {
        'US': {
          delta: 2.0,
          drivers: [],
          outlook: 'NEUTRAL' as const,
          expectedReturn: 0.05,
          riskTrend: 'STABLE' as const
        }
      };
      const errors = validateCountryAdjustments(invalidAdjustments);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('drivers'))).toBe(true);
    });
  });

  describe('validateGeopoliticalEvents', () => {
    test('should validate correct events', () => {
      const errors = validateGeopoliticalEvents(CEDAROWL_FORECAST_2026.geopoliticalEvents);
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid probability', () => {
      const invalidEvents: GeopoliticalEvent[] = [{
        event: 'Test Event',
        timeline: '2026-01',
        probability: 1.5,
        riskLevel: 'HIGH',
        baseImpact: 10,
        affectedCountries: ['US'],
        sectorImpacts: { 'Technology': 1.2 },
        description: 'Test',
        investmentImpact: 'Test'
      }];
      const errors = validateGeopoliticalEvents(invalidEvents);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('probability'))).toBe(true);
    });

    test('should detect missing affected countries', () => {
      const invalidEvents: GeopoliticalEvent[] = [{
        event: 'Test Event',
        timeline: '2026-01',
        probability: 0.8,
        riskLevel: 'HIGH',
        baseImpact: 10,
        affectedCountries: [],
        sectorImpacts: { 'Technology': 1.2 },
        description: 'Test',
        investmentImpact: 'Test'
      }];
      const errors = validateGeopoliticalEvents(invalidEvents);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('affectedCountries'))).toBe(true);
    });
  });

  describe('validateRegionalPremiums', () => {
    test('should validate correct premiums', () => {
      const errors = validateRegionalPremiums(CEDAROWL_FORECAST_2026.regionalPremiums);
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid premium value', () => {
      const invalidPremiums = { 'Europe': 3.0 };
      const errors = validateRegionalPremiums(invalidPremiums);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSectorMultipliers', () => {
    test('should validate correct multipliers', () => {
      const errors = validateSectorMultipliers(CEDAROWL_FORECAST_2026.sectorMultipliers);
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid multiplier value', () => {
      const invalidMultipliers = { 'Technology': 3.0 };
      const errors = validateSectorMultipliers(invalidMultipliers);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateForecast', () => {
    test('should validate complete forecast', () => {
      const result = validateForecast(CEDAROWL_FORECAST_2026);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('isValidCountryCode', () => {
    test('should validate correct country codes', () => {
      expect(isValidCountryCode('US')).toBe(true);
      expect(isValidCountryCode('CN')).toBe(true);
      expect(isValidCountryCode('DE')).toBe(true);
    });

    test('should reject invalid country codes', () => {
      expect(isValidCountryCode('USA')).toBe(false);
      expect(isValidCountryCode('U')).toBe(false);
      expect(isValidCountryCode('us')).toBe(false);
      expect(isValidCountryCode('123')).toBe(false);
    });
  });

  describe('isForecastStale', () => {
    test('should detect stale forecast', () => {
      const staleForecast = {
        ...CEDAROWL_FORECAST_2026,
        metadata: {
          ...CEDAROWL_FORECAST_2026.metadata,
          nextUpdate: '2020-01-01'
        }
      };
      expect(isForecastStale(staleForecast)).toBe(true);
    });

    test('should detect fresh forecast', () => {
      const freshForecast = {
        ...CEDAROWL_FORECAST_2026,
        metadata: {
          ...CEDAROWL_FORECAST_2026.metadata,
          nextUpdate: '2030-01-01'
        }
      };
      expect(isForecastStale(freshForecast)).toBe(false);
    });
  });
});
