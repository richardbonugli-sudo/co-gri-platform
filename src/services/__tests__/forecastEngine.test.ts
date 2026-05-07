/**
 * Unit tests for Forecast Engine Service
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  applyForecastToCountry,
  applyForecastToPortfolio,
  calculateForecastImpact,
  getApplicableEvents
} from '../forecastEngine';
import type { Exposure } from '../forecastEngine';

describe('Forecast Engine Service', () => {
  describe('applyForecastToCountry', () => {
    test('applies forecast delta to country CSI', () => {
      const baseCsi = 45.2;
      const adjustedCsi = applyForecastToCountry('US', baseCsi);
      
      // US has delta of -1.2
      expect(adjustedCsi).toBeCloseTo(44.0, 1);
    });

    test('returns base CSI for country without forecast data', () => {
      const baseCsi = 50.0;
      const adjustedCsi = applyForecastToCountry('XX', baseCsi);
      
      expect(adjustedCsi).toBe(baseCsi);
    });

    test('applies sector multiplier when provided', () => {
      const baseCsi = 45.2;
      const adjustedCsi = applyForecastToCountry('US', baseCsi, 'Technology');
      
      // US delta: -1.2, Technology multiplier: 1.25
      // Expected: 45.2 + (-1.2 * 1.25) = 45.2 - 1.5 = 43.7
      expect(adjustedCsi).toBeCloseTo(43.7, 1);
    });

    test('handles positive deltas', () => {
      const baseCsi = 50.0;
      const adjustedCsi = applyForecastToCountry('IN', baseCsi);
      
      // India has delta of +3.1
      expect(adjustedCsi).toBeCloseTo(53.1, 1);
    });
  });

  describe('applyForecastToPortfolio', () => {
    let sampleExposures: Exposure[];

    beforeEach(() => {
      sampleExposures = [
        {
          countryCode: 'US',
          countryName: 'United States',
          baseCsi: 45.2,
          exposureAmount: 1000000
        },
        {
          countryCode: 'CN',
          countryName: 'China',
          baseCsi: 52.1,
          exposureAmount: 500000
        },
        {
          countryCode: 'DE',
          countryName: 'Germany',
          baseCsi: 48.5,
          exposureAmount: 300000
        }
      ];
    });

    test('applies forecast to all exposures', () => {
      const result = applyForecastToPortfolio(sampleExposures);

      expect(result.adjustedExposures).toHaveLength(3);
      expect(result.adjustedExposures[0].adjustedCsi).toBeCloseTo(44.0, 1); // US: 45.2 - 1.2
      expect(result.adjustedExposures[1].adjustedCsi).toBeCloseTo(54.9, 1); // CN: 52.1 + 2.8
      expect(result.adjustedExposures[2].adjustedCsi).toBeCloseTo(45.0, 1); // DE: 48.5 - 3.5
    });

    test('includes forecast metadata', () => {
      const result = applyForecastToPortfolio(sampleExposures);

      expect(result.metadata.forecastYear).toBe('2026');
      expect(result.metadata.totalExposures).toBe(3);
      expect(result.metadata.adjustedExposures).toBe(3);
      expect(result.metadata.appliedAt).toBeDefined();
    });

    test('validates all guardrails', () => {
      const result = applyForecastToPortfolio(sampleExposures);

      expect(result.validationResults.guardrail1).toBe(true); // No new exposure
      expect(result.validationResults.guardrail2).toBe(true); // Additive deltas
      expect(result.validationResults.guardrail3).toBe(true); // Existing exposure only
      expect(result.validationResults.guardrail4).toBe(true); // Expected path
      expect(result.validationResults.guardrail5).toBe(true); // No dense propagation
      expect(result.validationResults.guardrail6).toBe(true); // Clear labeling
    });

    test('includes forecast drivers and outlook', () => {
      const result = applyForecastToPortfolio(sampleExposures);

      const usExposure = result.adjustedExposures[0];
      expect(usExposure.forecastDrivers).toBeDefined();
      expect(usExposure.outlook).toBeDefined();
      expect(usExposure.riskTrend).toBeDefined();
      expect(usExposure.expectedReturn).toBeDefined();
    });

    test('includes applicable events', () => {
      const result = applyForecastToPortfolio(sampleExposures);

      const usExposure = result.adjustedExposures[0];
      expect(usExposure.applicableEvents).toBeDefined();
      expect(Array.isArray(usExposure.applicableEvents)).toBe(true);
    });

    test('handles exposures with sectors', () => {
      const exposuresWithSectors: Exposure[] = [
        {
          countryCode: 'US',
          countryName: 'United States',
          baseCsi: 45.2,
          exposureAmount: 1000000,
          sector: 'Technology'
        }
      ];

      const result = applyForecastToPortfolio(exposuresWithSectors);

      expect(result.adjustedExposures[0].sectorMultiplier).toBe(1.25);
      // US delta: -1.2, Tech multiplier: 1.25 = -1.5
      expect(result.adjustedExposures[0].adjustedCsi).toBeCloseTo(43.7, 1);
    });
  });

  describe('calculateForecastImpact', () => {
    test('calculates detailed impact for country', () => {
      const impact = calculateForecastImpact('US', 45.2);

      expect(impact.countryCode).toBe('US');
      expect(impact.baseCsi).toBe(45.2);
      expect(impact.delta).toBe(-1.2);
      expect(impact.sectorMultiplier).toBe(1.0);
      expect(impact.totalAdjustment).toBe(-1.2);
      expect(impact.adjustedCsi).toBeCloseTo(44.0, 1);
    });

    test('includes sector multiplier in impact', () => {
      const impact = calculateForecastImpact('US', 45.2, 'Technology');

      expect(impact.sectorMultiplier).toBe(1.25);
      expect(impact.totalAdjustment).toBeCloseTo(-1.5, 1);
      expect(impact.adjustedCsi).toBeCloseTo(43.7, 1);
    });

    test('returns zero impact for country without forecast', () => {
      const impact = calculateForecastImpact('XX', 50.0);

      expect(impact.delta).toBe(0);
      expect(impact.totalAdjustment).toBe(0);
      expect(impact.adjustedCsi).toBe(50.0);
    });

    test('includes drivers and outlook', () => {
      const impact = calculateForecastImpact('US', 45.2);

      expect(impact.drivers).toBeDefined();
      expect(Array.isArray(impact.drivers)).toBe(true);
      expect(impact.outlook).toBeDefined();
      expect(impact.riskTrend).toBeDefined();
    });

    test('includes applicable events', () => {
      const impact = calculateForecastImpact('US', 45.2);

      expect(impact.applicableEvents).toBeDefined();
      expect(Array.isArray(impact.applicableEvents)).toBe(true);
    });
  });

  describe('getApplicableEvents', () => {
    test('returns events for country', () => {
      const events = getApplicableEvents('US');

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    test('sorts events by probability descending', () => {
      const events = getApplicableEvents('US');

      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].probability).toBeGreaterThanOrEqual(events[i].probability);
      }
    });

    test('returns empty array for country with no events', () => {
      const events = getApplicableEvents('XX');

      expect(events).toEqual([]);
    });

    test('includes high-probability events first', () => {
      const events = getApplicableEvents('VE');

      // Venezuela should have US-Venezuela Intervention event (95% probability)
      if (events.length > 0) {
        expect(events[0].probability).toBeGreaterThanOrEqual(0.9);
      }
    });
  });
});