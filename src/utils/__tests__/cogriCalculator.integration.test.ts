/**
 * Integration tests for CO-GRI Calculator with Forecast
 */

import { describe, test, expect } from 'vitest';
import { calculateCOGRI, compareCOGRIWithForecast } from '../cogriCalculator';
import type { Exposure } from '@/services/forecastEngine';

describe('CO-GRI Calculator Integration', () => {
  const sampleExposures: Exposure[] = [
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

  describe('Backward Compatibility', () => {
    test('works without options (original behavior)', () => {
      const result = calculateCOGRI(sampleExposures);

      expect(result.score).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.countryBreakdown).toHaveLength(3);
      expect(result.forecastMetadata).toBeUndefined();
    });

    test('works with useForecast=false', () => {
      const result = calculateCOGRI(sampleExposures, { useForecast: false });

      expect(result.score).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.forecastMetadata).toBeUndefined();
    });
  });

  describe('Forecast Integration', () => {
    test('applies forecast when useForecast=true', () => {
      const result = calculateCOGRI(sampleExposures, { useForecast: true });

      expect(result.forecastMetadata).toBeDefined();
      expect(result.forecastMetadata?.applied).toBe(true);
      expect(result.forecastMetadata?.forecastYear).toBe('2026');
    });

    test('includes forecast metadata', () => {
      const result = calculateCOGRI(sampleExposures, { useForecast: true });

      expect(result.forecastMetadata?.totalExposures).toBe(3);
      expect(result.forecastMetadata?.adjustedExposures).toBeGreaterThan(0);
      expect(result.forecastMetadata?.appliedAt).toBeDefined();
      expect(result.forecastMetadata?.guardrailsValid).toBeDefined();
    });

    test('includes forecast data in country breakdown', () => {
      const result = calculateCOGRI(sampleExposures, { useForecast: true });

      const usBreakdown = result.countryBreakdown.find(c => c.countryCode === 'US');
      expect(usBreakdown?.forecastData).toBeDefined();
      expect(usBreakdown?.forecastData?.baseCsi).toBe(45.2);
      expect(usBreakdown?.forecastData?.delta).toBeDefined();
      expect(usBreakdown?.forecastData?.adjustedCsi).toBeDefined();
      expect(usBreakdown?.forecastData?.drivers).toBeDefined();
      expect(usBreakdown?.forecastData?.outlook).toBeDefined();
    });

    test('calculates different score with forecast', () => {
      const withoutForecast = calculateCOGRI(sampleExposures, { useForecast: false });
      const withForecast = calculateCOGRI(sampleExposures, { useForecast: true });

      expect(withForecast.score).not.toBe(withoutForecast.score);
    });

    test('respects forecastYear parameter', () => {
      const result = calculateCOGRI(sampleExposures, {
        useForecast: true,
        forecastYear: '2026'
      });

      expect(result.forecastMetadata?.forecastYear).toBe('2026');
    });
  });

  describe('Risk Level Classification', () => {
    test('classifies LOW risk correctly', () => {
      const lowRiskExposures: Exposure[] = [
        {
          countryCode: 'CH',
          countryName: 'Switzerland',
          baseCsi: 25.0,
          exposureAmount: 1000000
        }
      ];

      const result = calculateCOGRI(lowRiskExposures);
      expect(result.riskLevel).toBe('LOW');
    });

    test('classifies MEDIUM risk correctly', () => {
      const mediumRiskExposures: Exposure[] = [
        {
          countryCode: 'US',
          countryName: 'United States',
          baseCsi: 40.0,
          exposureAmount: 1000000
        }
      ];

      const result = calculateCOGRI(mediumRiskExposures);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    test('classifies HIGH risk correctly', () => {
      const highRiskExposures: Exposure[] = [
        {
          countryCode: 'CN',
          countryName: 'China',
          baseCsi: 55.0,
          exposureAmount: 1000000
        }
      ];

      const result = calculateCOGRI(highRiskExposures);
      expect(result.riskLevel).toBe('HIGH');
    });

    test('classifies CRITICAL risk correctly', () => {
      const criticalRiskExposures: Exposure[] = [
        {
          countryCode: 'SY',
          countryName: 'Syria',
          baseCsi: 75.0,
          exposureAmount: 1000000
        }
      ];

      const result = calculateCOGRI(criticalRiskExposures);
      expect(result.riskLevel).toBe('CRITICAL');
    });
  });

  describe('Weighted Calculation', () => {
    test('calculates weighted average correctly', () => {
      const exposures: Exposure[] = [
        {
          countryCode: 'US',
          countryName: 'United States',
          baseCsi: 40.0,
          exposureAmount: 600000 // 60%
        },
        {
          countryCode: 'CN',
          countryName: 'China',
          baseCsi: 60.0,
          exposureAmount: 400000 // 40%
        }
      ];

      const result = calculateCOGRI(exposures);
      
      // Expected: (40 * 0.6) + (60 * 0.4) = 24 + 24 = 48
      expect(result.score).toBeCloseTo(48.0, 1);
    });

    test('includes risk contribution for each country', () => {
      const result = calculateCOGRI(sampleExposures);

      result.countryBreakdown.forEach(country => {
        expect(country.riskContribution).toBeDefined();
        expect(country.riskContribution).toBeGreaterThan(0);
      });
    });
  });

  describe('compareCOGRIWithForecast', () => {
    test('returns comparison object', () => {
      const comparison = compareCOGRIWithForecast(sampleExposures);

      expect(comparison.baseline).toBeDefined();
      expect(comparison.forecast).toBeDefined();
      expect(comparison.scoreDelta).toBeDefined();
      expect(comparison.riskLevelChanged).toBeDefined();
    });

    test('calculates score delta correctly', () => {
      const comparison = compareCOGRIWithForecast(sampleExposures);

      const expectedDelta = comparison.forecast.score - comparison.baseline.score;
      expect(comparison.scoreDelta).toBeCloseTo(expectedDelta, 2);
    });

    test('detects risk level changes', () => {
      const comparison = compareCOGRIWithForecast(sampleExposures);

      const changed = comparison.baseline.riskLevel !== comparison.forecast.riskLevel;
      expect(comparison.riskLevelChanged).toBe(changed);
    });
  });
});
