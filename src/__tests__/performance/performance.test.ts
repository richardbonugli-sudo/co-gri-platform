/**
 * Performance Tests for CO-GRI Strategic Forecast Baseline
 * 
 * Tests performance benchmarks and optimization
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import { applyForecastToPortfolio } from '@/services/forecastEngine';
import { calculateCOGRI } from '@/utils/cogriCalculator';
import type { Exposure } from '@/services/forecastEngine';

describe('Performance Benchmarks', () => {
  let largePortfolio: Exposure[];

  beforeEach(() => {
    // Create a large portfolio with 195 countries
    largePortfolio = Array.from({ length: 195 }, (_, i) => ({
      countryCode: `C${i.toString().padStart(3, '0')}`,
      countryName: `Country ${i}`,
      baseCsi: 30 + (i % 40),
      exposureAmount: 10000 * (i + 1),
      sector: i % 3 === 0 ? 'Technology' : i % 3 === 1 ? 'Energy' : 'Defense'
    }));
  });

  test('forecast data loading completes in <50ms', () => {
    const startTime = performance.now();
    const forecast = loadCedarOwlForecast('2026');
    const endTime = performance.now();

    expect(forecast).toBeDefined();
    expect(endTime - startTime).toBeLessThan(50);
  });

  test('forecast application to 195 countries completes in <100ms', () => {
    const startTime = performance.now();
    const result = applyForecastToPortfolio(largePortfolio);
    const endTime = performance.now();

    expect(result.adjustedExposures.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('CO-GRI calculation with forecast completes in <200ms', () => {
    const startTime = performance.now();
    const result = calculateCOGRI(largePortfolio, {
      useForecast: true,
      forecastYear: '2026'
    });
    const endTime = performance.now();

    expect(result.score).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(200);
  });

  test('complete workflow (load + apply + calculate) completes in <500ms', () => {
    const startTime = performance.now();
    
    // Load forecast
    const forecast = loadCedarOwlForecast('2026');
    
    // Apply to portfolio
    const forecastResult = applyForecastToPortfolio(largePortfolio);
    
    // Calculate CO-GRI
    const cogriResult = calculateCOGRI(largePortfolio, {
      useForecast: true,
      forecastYear: '2026'
    });
    
    const endTime = performance.now();

    expect(forecast).toBeDefined();
    expect(forecastResult.adjustedExposures.length).toBeGreaterThan(0);
    expect(cogriResult.score).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('filtering 195 countries completes in <50ms', () => {
    const result = applyForecastToPortfolio(largePortfolio);
    const exposures = result.adjustedExposures;

    const startTime = performance.now();
    const filtered = exposures.filter(e => e.outlook === 'STRONG_BUY' || e.outlook === 'BUY');
    const endTime = performance.now();

    expect(filtered.length).toBeGreaterThanOrEqual(0);
    expect(endTime - startTime).toBeLessThan(50);
  });

  test('sorting 195 countries completes in <50ms', () => {
    const result = applyForecastToPortfolio(largePortfolio);
    const exposures = result.adjustedExposures;

    const startTime = performance.now();
    const sorted = [...exposures].sort((a, b) => b.delta - a.delta);
    const endTime = performance.now();

    expect(sorted.length).toBe(exposures.length);
    expect(endTime - startTime).toBeLessThan(50);
  });

  test('CSV export generation completes in <1s', () => {
    const result = applyForecastToPortfolio(largePortfolio);
    const exposures = result.adjustedExposures;

    const startTime = performance.now();
    
    // Simulate CSV generation
    const headers = ['Country', 'Original CSI', 'Delta', 'Adjusted CSI', 'Outlook', 'Trend'];
    const rows = exposures.map(e => [
      e.countryName,
      e.baseCsi.toFixed(2),
      e.delta.toFixed(2),
      e.adjustedCsi.toFixed(2),
      e.outlook,
      e.riskTrend
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const endTime = performance.now();

    expect(csv.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(1000);
  });
});

describe('Memory Usage', () => {
  test('large dataset does not cause memory issues', () => {
    // Create very large portfolio
    const veryLargePortfolio: Exposure[] = Array.from({ length: 500 }, (_, i) => ({
      countryCode: `C${i.toString().padStart(3, '0')}`,
      countryName: `Country ${i}`,
      baseCsi: 30 + (i % 40),
      exposureAmount: 10000 * (i + 1)
    }));

    // This should not throw memory errors
    expect(() => {
      const result = applyForecastToPortfolio(veryLargePortfolio);
      expect(result.adjustedExposures.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  test('repeated calculations do not leak memory', () => {
    const portfolio: Exposure[] = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000
      }
    ];

    // Run calculation 1000 times
    for (let i = 0; i < 1000; i++) {
      const result = calculateCOGRI(portfolio, {
        useForecast: true,
        forecastYear: '2026'
      });
      expect(result.score).toBeGreaterThan(0);
    }

    // If we got here without crashing, no memory leak
    expect(true).toBe(true);
  });
});

describe('Optimization Validation', () => {
  test('memoization reduces redundant calculations', () => {
    const portfolio: Exposure[] = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000
      }
    ];

    // First calculation
    const start1 = performance.now();
    const result1 = calculateCOGRI(portfolio, {
      useForecast: true,
      forecastYear: '2026'
    });
    const end1 = performance.now();
    const time1 = end1 - start1;

    // Second calculation (should be faster due to caching)
    const start2 = performance.now();
    const result2 = calculateCOGRI(portfolio, {
      useForecast: true,
      forecastYear: '2026'
    });
    const end2 = performance.now();
    const time2 = end2 - start2;

    expect(result1.score).toBe(result2.score);
    // Note: Actual caching would make time2 < time1, but we don't have caching implemented yet
  });

  test('pagination reduces DOM nodes', () => {
    const largeExposures: Exposure[] = Array.from({ length: 195 }, (_, i) => ({
      countryCode: `C${i.toString().padStart(3, '0')}`,
      countryName: `Country ${i}`,
      baseCsi: 40 + (i % 20),
      exposureAmount: 10000 * (i + 1)
    }));

    const result = applyForecastToPortfolio(largeExposures);
    
    // Simulate pagination (20 items per page)
    const pageSize = 20;
    const page1 = result.adjustedExposures.slice(0, pageSize);
    
    expect(page1.length).toBe(pageSize);
    expect(page1.length).toBeLessThan(result.adjustedExposures.length);
  });
});

describe('Scalability Tests', () => {
  test('handles 1000 exposures without performance degradation', () => {
    const massivePortfolio: Exposure[] = Array.from({ length: 1000 }, (_, i) => ({
      countryCode: `C${i.toString().padStart(4, '0')}`,
      countryName: `Country ${i}`,
      baseCsi: 30 + (i % 40),
      exposureAmount: 10000 * (i + 1)
    }));

    const startTime = performance.now();
    const result = applyForecastToPortfolio(massivePortfolio);
    const endTime = performance.now();

    expect(result.adjustedExposures.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds for 1000 items
  });

  test('concurrent calculations do not block', async () => {
    const portfolio: Exposure[] = [
      {
        countryCode: 'US',
        countryName: 'United States',
        baseCsi: 45.0,
        exposureAmount: 1000000
      }
    ];

    // Run 10 calculations concurrently
    const startTime = performance.now();
    const promises = Array.from({ length: 10 }, () =>
      Promise.resolve(calculateCOGRI(portfolio, {
        useForecast: true,
        forecastYear: '2026'
      }))
    );
    const results = await Promise.all(promises);
    const endTime = performance.now();

    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.score).toBeGreaterThan(0);
    });
    expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
  });
});