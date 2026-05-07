/**
 * Unit tests for CedarOwl Forecast 2026 data
 */

import { describe, test, expect } from '@jest/globals';
import { CEDAROWL_FORECAST_2026 } from '../cedarOwlForecast2026';
import { validateForecast } from '../../utils/forecastValidation';

describe('CedarOwl Forecast 2026 Data', () => {
  test('should have valid metadata', () => {
    expect(CEDAROWL_FORECAST_2026.metadata).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.metadata.forecastPeriod).toBe('2026-01-01 to 2026-12-31');
    expect(CEDAROWL_FORECAST_2026.metadata.publishDate).toBe('2026-01-07');
    expect(CEDAROWL_FORECAST_2026.metadata.expertSources).toBe(15);
    expect(CEDAROWL_FORECAST_2026.metadata.overallConfidence).toBe(0.85);
    expect(CEDAROWL_FORECAST_2026.metadata.nextUpdate).toBe('2026-04-01');
  });

  test('should have 195 country adjustments', () => {
    const countryCount = Object.keys(CEDAROWL_FORECAST_2026.countryAdjustments).length;
    expect(countryCount).toBe(195);
    expect(CEDAROWL_FORECAST_2026.metadata.coverage.countries).toBe(195);
  });

  test('should have 6 geopolitical events', () => {
    expect(CEDAROWL_FORECAST_2026.geopoliticalEvents).toHaveLength(6);
    expect(CEDAROWL_FORECAST_2026.metadata.coverage.events).toBe(6);
  });

  test('should have valid country adjustments', () => {
    // Test specific countries
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['DE']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['DE'].delta).toBe(-3.5);
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['DE'].outlook).toBe('UNDERPERFORM');

    expect(CEDAROWL_FORECAST_2026.countryAdjustments['CN']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['CN'].delta).toBe(2.8);
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['CN'].outlook).toBe('OVERWEIGHT');

    expect(CEDAROWL_FORECAST_2026.countryAdjustments['IN']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['IN'].delta).toBe(3.1);
    expect(CEDAROWL_FORECAST_2026.countryAdjustments['IN'].outlook).toBe('STRONG_BUY');
  });

  test('should have valid geopolitical events', () => {
    const events = CEDAROWL_FORECAST_2026.geopoliticalEvents;
    
    // Test US-Venezuela event
    const venezuelaEvent = events.find(e => e.event === 'US-Venezuela Intervention');
    expect(venezuelaEvent).toBeDefined();
    expect(venezuelaEvent?.probability).toBe(0.95);
    expect(venezuelaEvent?.riskLevel).toBe('CRITICAL');

    // Test US-China tech decoupling
    const techEvent = events.find(e => e.event === 'US-China Tech Decoupling');
    expect(techEvent).toBeDefined();
    expect(techEvent?.probability).toBe(0.80);
    expect(techEvent?.riskLevel).toBe('HIGH');
  });

  test('should have valid regional premiums', () => {
    expect(CEDAROWL_FORECAST_2026.regionalPremiums['Europe']).toBe(1.12);
    expect(CEDAROWL_FORECAST_2026.regionalPremiums['Middle East']).toBe(1.35);
    expect(CEDAROWL_FORECAST_2026.regionalPremiums['Asia-Pacific']).toBe(0.92);
    expect(CEDAROWL_FORECAST_2026.regionalPremiums['Americas']).toBe(1.05);
  });

  test('should have valid sector multipliers', () => {
    expect(CEDAROWL_FORECAST_2026.sectorMultipliers['Technology']).toBe(1.25);
    expect(CEDAROWL_FORECAST_2026.sectorMultipliers['Energy']).toBe(1.40);
    expect(CEDAROWL_FORECAST_2026.sectorMultipliers['Defense']).toBe(1.60);
  });

  test('should have valid asset class forecasts', () => {
    expect(CEDAROWL_FORECAST_2026.assetClassForecasts['Gold/Silver']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.assetClassForecasts['Gold/Silver'].expectedReturn).toBe(0.15);
    expect(CEDAROWL_FORECAST_2026.assetClassForecasts['Gold/Silver'].recommendation).toBe('OVERWEIGHT');
  });

  test('should have valid regional outlooks', () => {
    expect(CEDAROWL_FORECAST_2026.regionalOutlook['Europe']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.regionalOutlook['Europe'].riskLevel).toBe('HIGH');
    
    expect(CEDAROWL_FORECAST_2026.regionalOutlook['Asia-Pacific']).toBeDefined();
    expect(CEDAROWL_FORECAST_2026.regionalOutlook['Asia-Pacific'].riskLevel).toBe('MEDIUM (HIGH OPPORTUNITY)');
  });

  test('should pass comprehensive validation', () => {
    const result = validateForecast(CEDAROWL_FORECAST_2026);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('all country codes should be valid ISO format', () => {
    const countryCodes = Object.keys(CEDAROWL_FORECAST_2026.countryAdjustments);
    countryCodes.forEach(code => {
      expect(code).toMatch(/^[A-Z]{2}$/);
    });
  });

  test('all CSI deltas should be within valid range', () => {
    const adjustments = Object.values(CEDAROWL_FORECAST_2026.countryAdjustments);
    adjustments.forEach(adj => {
      expect(adj.delta).toBeGreaterThanOrEqual(-10);
      expect(adj.delta).toBeLessThanOrEqual(10);
    });
  });

  test('all probabilities should be between 0 and 1', () => {
    CEDAROWL_FORECAST_2026.geopoliticalEvents.forEach(event => {
      expect(event.probability).toBeGreaterThanOrEqual(0);
      expect(event.probability).toBeLessThanOrEqual(1);
    });
  });

  test('all expected returns should be reasonable', () => {
    const adjustments = Object.values(CEDAROWL_FORECAST_2026.countryAdjustments);
    adjustments.forEach(adj => {
      expect(adj.expectedReturn).toBeGreaterThanOrEqual(-1);
      expect(adj.expectedReturn).toBeLessThanOrEqual(1);
    });
  });
});
