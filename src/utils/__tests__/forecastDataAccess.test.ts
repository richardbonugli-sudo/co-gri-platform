/**
 * Unit tests for forecast data access utilities
 */

import { describe, test, expect } from '@jest/globals';
import {
  loadCedarOwlForecast,
  getCountryAdjustment,
  getGeopoliticalEvents,
  getEventsByTimeline,
  getEventsByRiskLevel,
  getEventsByCountry,
  getHighProbabilityEvents,
  getSectorMultiplier,
  getRegionalPremium,
  getAssetClassForecast,
  getAssetClassForecastsSorted,
  getRegionalOutlook,
  getCountriesByOutlook,
  getCountriesByRiskTrend,
  getTopCountriesByReturn,
  getCountriesWithHighestRiskIncrease,
  getCountriesWithHighestRiskDecrease,
  getForecastSummary
} from '../forecastDataAccess';

describe('Forecast Data Access Utilities', () => {
  describe('loadCedarOwlForecast', () => {
    test('should load 2026 forecast', () => {
      const forecast = loadCedarOwlForecast('2026');
      expect(forecast).toBeDefined();
      expect(forecast.metadata.forecastPeriod).toBe('2026-01-01 to 2026-12-31');
    });

    test('should throw error for unavailable year', () => {
      expect(() => loadCedarOwlForecast('2025')).toThrow();
    });
  });

  describe('getCountryAdjustment', () => {
    test('should get country adjustment', () => {
      const adjustment = getCountryAdjustment('US');
      expect(adjustment).toBeDefined();
      expect(adjustment?.delta).toBe(-1.2);
    });

    test('should return null for non-existent country', () => {
      const adjustment = getCountryAdjustment('XX');
      expect(adjustment).toBeNull();
    });
  });

  describe('getGeopoliticalEvents', () => {
    test('should get all events', () => {
      const events = getGeopoliticalEvents();
      expect(events).toHaveLength(6);
    });
  });

  describe('getEventsByTimeline', () => {
    test('should filter events by timeline', () => {
      const events = getEventsByTimeline('2026-01');
      expect(events.length).toBeGreaterThan(0);
      expect(events.every(e => e.timeline.includes('2026-01'))).toBe(true);
    });
  });

  describe('getEventsByRiskLevel', () => {
    test('should filter events by risk level', () => {
      const criticalEvents = getEventsByRiskLevel('CRITICAL');
      expect(criticalEvents.length).toBeGreaterThan(0);
      expect(criticalEvents.every(e => e.riskLevel === 'CRITICAL')).toBe(true);
    });
  });

  describe('getEventsByCountry', () => {
    test('should get events affecting a country', () => {
      const usEvents = getEventsByCountry('US');
      expect(usEvents.length).toBeGreaterThan(0);
      expect(usEvents.every(e => e.affectedCountries.includes('US'))).toBe(true);
    });
  });

  describe('getHighProbabilityEvents', () => {
    test('should get high probability events', () => {
      const highProbEvents = getHighProbabilityEvents(0.8);
      expect(highProbEvents.length).toBeGreaterThan(0);
      expect(highProbEvents.every(e => e.probability >= 0.8)).toBe(true);
    });
  });

  describe('getSectorMultiplier', () => {
    test('should get sector multiplier', () => {
      expect(getSectorMultiplier('Technology')).toBe(1.25);
      expect(getSectorMultiplier('Energy')).toBe(1.40);
      expect(getSectorMultiplier('Defense')).toBe(1.60);
    });

    test('should return 1.0 for unknown sector', () => {
      expect(getSectorMultiplier('UnknownSector')).toBe(1.0);
    });
  });

  describe('getRegionalPremium', () => {
    test('should get regional premium', () => {
      expect(getRegionalPremium('Europe')).toBe(1.12);
      expect(getRegionalPremium('Middle East')).toBe(1.35);
      expect(getRegionalPremium('Asia-Pacific')).toBe(0.92);
    });

    test('should return 1.0 for unknown region', () => {
      expect(getRegionalPremium('UnknownRegion')).toBe(1.0);
    });
  });

  describe('getAssetClassForecast', () => {
    test('should get asset class forecast', () => {
      const goldForecast = getAssetClassForecast('Gold/Silver');
      expect(goldForecast).toBeDefined();
      expect(goldForecast?.expectedReturn).toBe(0.15);
      expect(goldForecast?.recommendation).toBe('OVERWEIGHT');
    });

    test('should return null for unknown asset class', () => {
      const forecast = getAssetClassForecast('UnknownAsset');
      expect(forecast).toBeNull();
    });
  });

  describe('getAssetClassForecastsSorted', () => {
    test('should return sorted forecasts', () => {
      const sorted = getAssetClassForecastsSorted();
      expect(sorted.length).toBeGreaterThan(0);
      
      // Check if sorted by expected return (descending)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].expectedReturn).toBeGreaterThanOrEqual(sorted[i].expectedReturn);
      }
    });
  });

  describe('getRegionalOutlook', () => {
    test('should get regional outlook', () => {
      const europeOutlook = getRegionalOutlook('Europe');
      expect(europeOutlook).toBeDefined();
      expect(europeOutlook?.riskLevel).toBe('HIGH');
    });
  });

  describe('getCountriesByOutlook', () => {
    test('should get countries by outlook', () => {
      const strongBuyCountries = getCountriesByOutlook('STRONG_BUY');
      expect(strongBuyCountries.length).toBeGreaterThan(0);
      expect(strongBuyCountries).toContain('IN');
      expect(strongBuyCountries).toContain('BR');
    });
  });

  describe('getCountriesByRiskTrend', () => {
    test('should get countries by risk trend', () => {
      const improvingCountries = getCountriesByRiskTrend('IMPROVING');
      expect(improvingCountries.length).toBeGreaterThan(0);
    });
  });

  describe('getTopCountriesByReturn', () => {
    test('should get top countries by expected return', () => {
      const topCountries = getTopCountriesByReturn(5);
      expect(topCountries).toHaveLength(5);
      
      // Check if sorted by expected return (descending)
      for (let i = 1; i < topCountries.length; i++) {
        expect(topCountries[i - 1].adjustment.expectedReturn)
          .toBeGreaterThanOrEqual(topCountries[i].adjustment.expectedReturn);
      }
    });
  });

  describe('getCountriesWithHighestRiskIncrease', () => {
    test('should get countries with highest risk increase', () => {
      const countries = getCountriesWithHighestRiskIncrease(5);
      expect(countries).toHaveLength(5);
      
      // Check if sorted by delta (descending)
      for (let i = 1; i < countries.length; i++) {
        expect(countries[i - 1].adjustment.delta)
          .toBeGreaterThanOrEqual(countries[i].adjustment.delta);
      }
      
      // Venezuela should be at or near the top
      expect(countries.some(c => c.countryCode === 'VE')).toBe(true);
    });
  });

  describe('getCountriesWithHighestRiskDecrease', () => {
    test('should get countries with highest risk decrease', () => {
      const countries = getCountriesWithHighestRiskDecrease(5);
      expect(countries).toHaveLength(5);
      
      // Check if sorted by delta (ascending)
      for (let i = 1; i < countries.length; i++) {
        expect(countries[i - 1].adjustment.delta)
          .toBeLessThanOrEqual(countries[i].adjustment.delta);
      }
      
      // Countries with negative deltas should be included
      expect(countries[0].adjustment.delta).toBeLessThan(0);
    });
  });

  describe('getForecastSummary', () => {
    test('should get forecast summary statistics', () => {
      const summary = getForecastSummary();
      
      expect(summary.totalCountries).toBe(195);
      expect(summary.totalEvents).toBe(6);
      expect(summary.averageDelta).toBeDefined();
      expect(summary.averageReturn).toBeDefined();
      expect(summary.improvingCount).toBeGreaterThan(0);
      expect(summary.deterioratingCount).toBeGreaterThan(0);
      expect(summary.stableCount).toBeGreaterThan(0);
      expect(summary.highProbabilityEvents).toBeGreaterThan(0);
      expect(summary.criticalEvents).toBeGreaterThan(0);
      
      // Total should equal 195
      expect(summary.improvingCount + summary.deterioratingCount + summary.stableCount).toBe(195);
    });
  });
});
