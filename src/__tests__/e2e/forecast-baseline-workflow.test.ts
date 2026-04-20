/**
 * End-to-End Integration Tests for CO-GRI Strategic Forecast Baseline
 * 
 * Tests the complete user workflow from mode selection to output display
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import { applyForecastToPortfolio } from '@/services/forecastEngine';
import { calculateCOGRI } from '@/utils/cogriCalculator';
import type { Exposure } from '@/services/forecastEngine';

describe('CO-GRI Strategic Forecast Baseline - E2E Workflow', () => {
  let mockExposures: Exposure[];

  beforeEach(() => {
    // Setup mock portfolio with diverse exposures
    mockExposures = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000,
        sector: 'Technology'
      },
      {
        countryCode: 'CN',
        countryName: 'China',
        baseCsi: 52.0,
        exposureAmount: 500000,
        sector: 'Technology'
      },
      {
        countryCode: 'DE',
        countryName: 'Germany',
        baseCsi: 38.0,
        exposureAmount: 300000,
        sector: 'Energy'
      },
      {
        countryCode: 'IN',
        countryName: 'India',
        baseCsi: 48.0,
        exposureAmount: 200000,
        sector: 'Defense'
      },
      {
        countryCode: 'BR',
        countryName: 'Brazil',
        baseCsi: 55.0,
        exposureAmount: 150000
      }
    ];
  });

  test('complete workflow from data load to output generation', () => {
    // Step 1: Load forecast data (Phase 1)
    const forecast = loadCedarOwlForecast('2026');
    expect(forecast).toBeDefined();
    expect(forecast.metadata.forecastPeriod).toBe('2026-01-01 to 2026-12-31');
    expect(forecast.countryAdjustments).toHaveLength(195);

    // Step 2: Apply forecast to portfolio (Phase 2)
    const result = applyForecastToPortfolio(mockExposures);
    expect(result.adjustedExposures).toHaveLength(5);
    expect(result.validationResults.guardrail1).toBe(true); // No new exposures
    expect(result.validationResults.guardrail2).toBe(true); // Additive deltas
    expect(result.errors).toHaveLength(0);

    // Step 3: Calculate CO-GRI with forecast (Phase 2)
    const cogriResult = calculateCOGRI(mockExposures, {
      useForecast: true,
      forecastYear: '2026'
    });
    expect(cogriResult.forecastMetadata).toBeDefined();
    expect(cogriResult.forecastMetadata?.applied).toBe(true);
    expect(cogriResult.forecastMetadata?.guardrailsValid).toBe(true);

    // Step 4: Verify adjusted exposures have correct structure (Phase 3)
    const adjustedExposures = result.adjustedExposures;
    adjustedExposures.forEach(exposure => {
      expect(exposure).toHaveProperty('countryCode');
      expect(exposure).toHaveProperty('baseCsi');
      expect(exposure).toHaveProperty('adjustedCsi');
      expect(exposure).toHaveProperty('delta');
      expect(exposure).toHaveProperty('forecastDrivers');
      expect(exposure).toHaveProperty('outlook');
      expect(exposure).toHaveProperty('riskTrend');
      expect(exposure).toHaveProperty('expectedReturn');
    });

    // Step 5: Verify calculations are correct
    const usExposure = adjustedExposures.find(e => e.countryCode === 'US');
    expect(usExposure).toBeDefined();
    expect(usExposure!.adjustedCsi).toBe(usExposure!.baseCsi + usExposure!.delta);
  });

  test('data flow validation across all phases', () => {
    // Phase 1 → Phase 2
    const forecast = loadCedarOwlForecast('2026');
    const usAdjustment = forecast.countryAdjustments.find(c => c.countryCode === 'US');
    expect(usAdjustment).toBeDefined();

    const result = applyForecastToPortfolio(mockExposures);
    const usExposure = result.adjustedExposures.find(e => e.countryCode === 'US');
    expect(usExposure!.delta).toBe(usAdjustment!.delta);

    // Phase 2 → Phase 3
    const cogriResult = calculateCOGRI(mockExposures, {
      useForecast: true,
      forecastYear: '2026'
    });
    expect(cogriResult.countryBreakdown).toHaveLength(5);
    expect(cogriResult.forecastMetadata?.adjustedExposures).toBe(5);
  });

  test('guardrails enforcement throughout workflow', () => {
    const result = applyForecastToPortfolio(mockExposures);

    // Guardrail 1: No new exposures
    expect(result.validationResults.guardrail1).toBe(true);
    expect(result.adjustedExposures).toHaveLength(mockExposures.length);

    // Guardrail 2: Additive deltas only
    expect(result.validationResults.guardrail2).toBe(true);
    result.adjustedExposures.forEach(exposure => {
      const expected = exposure.baseCsi + exposure.delta;
      expect(Math.abs(exposure.adjustedCsi - expected)).toBeLessThan(0.01);
    });

    // Guardrail 3: Existing exposure only
    expect(result.validationResults.guardrail3).toBe(true);

    // Guardrail 4: Expected path, not stress
    expect(result.validationResults.guardrail4).toBe(true);

    // Guardrail 5: No dense propagation
    expect(result.validationResults.guardrail5).toBe(true);

    // Guardrail 6: Clear labeling
    expect(result.validationResults.guardrail6).toBe(true);
  });

  test('error handling for invalid inputs', () => {
    // Empty exposures
    const emptyResult = applyForecastToPortfolio([]);
    expect(emptyResult.adjustedExposures).toHaveLength(0);
    expect(emptyResult.errors).toHaveLength(0);

    // Invalid country code
    const invalidExposures: Exposure[] = [
      {
        countryCode: 'INVALID',
        countryName: 'Invalid Country',
        baseCsi: 50.0,
        exposureAmount: 100000
      }
    ];
    const invalidResult = applyForecastToPortfolio(invalidExposures);
    expect(invalidResult.warnings.length).toBeGreaterThan(0);
  });

  test('edge case: extreme CSI values', () => {
    const extremeExposures: Exposure[] = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 0.0, // Minimum
        exposureAmount: 100000
      },
      {
        countryCode: 'CN',
        countryName: 'China',
        baseCsi: 100.0, // Maximum
        exposureAmount: 100000
      }
    ];

    const result = applyForecastToPortfolio(extremeExposures);
    expect(result.adjustedExposures).toHaveLength(2);
    
    // Verify CSI stays within bounds after adjustment
    result.adjustedExposures.forEach(exposure => {
      expect(exposure.adjustedCsi).toBeGreaterThanOrEqual(0);
      expect(exposure.adjustedCsi).toBeLessThanOrEqual(100);
    });
  });

  test('edge case: large portfolio (100+ countries)', () => {
    // Create a large portfolio
    const largeExposures: Exposure[] = Array.from({ length: 150 }, (_, i) => ({
      countryCode: `C${i.toString().padStart(3, '0')}`,
      countryName: `Country ${i}`,
      baseCsi: 40 + (i % 20),
      exposureAmount: 10000 * (i + 1)
    }));

    const startTime = Date.now();
    const result = applyForecastToPortfolio(largeExposures);
    const endTime = Date.now();

    // Performance check: should complete in reasonable time
    expect(endTime - startTime).toBeLessThan(1000); // < 1 second

    // Verify results
    expect(result.adjustedExposures.length).toBeGreaterThan(0);
    expect(result.validationResults.guardrail1).toBe(true);
  });

  test('backward compatibility: event-driven mode still works', () => {
    // Calculate CO-GRI without forecast (original behavior)
    const result = calculateCOGRI(mockExposures);
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.riskLevel).toBeDefined();
    expect(result.countryBreakdown).toHaveLength(5);
    expect(result.forecastMetadata).toBeUndefined(); // No forecast metadata
  });

  test('forecast metadata propagation', () => {
    const result = calculateCOGRI(mockExposures, {
      useForecast: true,
      forecastYear: '2026'
    });

    expect(result.forecastMetadata).toBeDefined();
    expect(result.forecastMetadata?.applied).toBe(true);
    expect(result.forecastMetadata?.forecastYear).toBe('2026');
    expect(result.forecastMetadata?.totalExposures).toBe(5);
    expect(result.forecastMetadata?.adjustedExposures).toBeGreaterThan(0);
    expect(result.forecastMetadata?.guardrailsValid).toBe(true);
  });
});

describe('Data Accuracy Validation', () => {
  test('sector multipliers applied correctly', () => {
    const techExposure: Exposure[] = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000,
        sector: 'Technology'
      }
    ];

    const result = applyForecastToPortfolio(techExposure);
    const adjusted = result.adjustedExposures[0];

    // Technology sector has 1.25x multiplier
    expect(adjusted.sectorMultiplier).toBe(1.25);
    
    // Verify delta includes sector multiplier
    const forecast = loadCedarOwlForecast('2026');
    const usAdjustment = forecast.countryAdjustments.find(c => c.countryCode === 'US');
    const expectedDelta = usAdjustment!.delta * 1.25;
    expect(Math.abs(adjusted.delta - expectedDelta)).toBeLessThan(0.01);
  });

  test('geopolitical events linked correctly', () => {
    const result = applyForecastToPortfolio([
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000
      }
    ]);

    const usExposure = result.adjustedExposures[0];
    expect(usExposure.applicableEvents.length).toBeGreaterThan(0);
    
    // Verify events are sorted by probability
    for (let i = 0; i < usExposure.applicableEvents.length - 1; i++) {
      expect(usExposure.applicableEvents[i].probability)
        .toBeGreaterThanOrEqual(usExposure.applicableEvents[i + 1].probability);
    }
  });

  test('outlook determination is correct', () => {
    const result = applyForecastToPortfolio([
      {
        countryCode: 'IN', // India has positive outlook
        countryName: 'India',
        baseCsi: 48.0,
        exposureAmount: 200000
      }
    ]);

    const indiaExposure = result.adjustedExposures[0];
    expect(indiaExposure.delta).toBeGreaterThan(0); // Positive delta
    expect(['STRONG_BUY', 'BUY', 'OUTPERFORM']).toContain(indiaExposure.outlook);
  });
});