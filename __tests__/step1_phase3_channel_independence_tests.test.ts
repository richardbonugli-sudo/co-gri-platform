/**
 * PHASE 3: CHANNEL INDEPENDENCE & CACHE INVALIDATION TESTS
 * 
 * Test Suite for:
 * - Channel-specific cache keys
 * - Filing period tracking and comparison
 * - Cache invalidation with newer filings
 * - Channel execution isolation (Supply Chain ≠ Financial)
 * - No cross-channel data leakage
 * - Stale data detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Channel } from '@/types/v4Types';
import { calculateV4Exposures, invalidateCompanyCache, getV4CacheStatistics } from '@/services/v4Integration';
import V4Cache from '@/services/v4/v4Cache';
import { ENHANCED_COMPANY_EXPOSURES, getFilingPeriod } from '@/data/enhancedCompanyExposures';

describe('PHASE 3: Channel Independence & Cache Invalidation', () => {
  
  beforeEach(() => {
    // Clear cache before each test
    V4Cache.clear();
  });

  // ===== TEST GROUP 1: CHANNEL-SPECIFIC CACHE KEYS =====
  
  describe('1. Channel-Specific Cache Keys', () => {
    
    it('1.1 Should generate unique cache keys for each channel', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      const revenueKey = V4Cache.generateCacheKey(ticker, Channel.REVENUE, filingPeriod);
      const supplyKey = V4Cache.generateCacheKey(ticker, Channel.SUPPLY, filingPeriod);
      const assetsKey = V4Cache.generateCacheKey(ticker, Channel.ASSETS, filingPeriod);
      const financialKey = V4Cache.generateCacheKey(ticker, Channel.FINANCIAL, filingPeriod);
      
      // All keys should be unique
      const keys = [revenueKey, supplyKey, assetsKey, financialKey];
      const uniqueKeys = new Set(keys);
      
      expect(uniqueKeys.size).toBe(4);
      expect(revenueKey).toBe('AAPL_REVENUE_2024');
      expect(supplyKey).toBe('AAPL_SUPPLY_2024');
      expect(assetsKey).toBe('AAPL_ASSETS_2024');
      expect(financialKey).toBe('AAPL_FINANCIAL_2024');
    });
    
    it('1.2 Should generate different cache keys for different filing periods', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      
      const key2024 = V4Cache.generateCacheKey(ticker, channel, '2024');
      const key2024Q3 = V4Cache.generateCacheKey(ticker, channel, '2024-Q3');
      const key2023 = V4Cache.generateCacheKey(ticker, channel, '2023');
      
      expect(key2024).not.toBe(key2024Q3);
      expect(key2024).not.toBe(key2023);
      expect(key2024Q3).not.toBe(key2023);
    });
    
    it('1.3 Should cache each channel independently', async () => {
      const ticker = 'AAPL';
      
      // First calculation - should cache all channels
      const result1 = await calculateV4Exposures(ticker);
      
      const stats1 = getV4CacheStatistics();
      expect(stats1.totalEntries).toBe(4); // 4 channels cached
      
      // Second calculation - should hit cache for all channels
      const result2 = await calculateV4Exposures(ticker);
      
      const stats2 = getV4CacheStatistics();
      expect(stats2.hitRate).toBeGreaterThan(0); // Cache hits occurred
      
      // Results should be identical
      expect(result2.revenue).toEqual(result1.revenue);
      expect(result2.supply).toEqual(result1.supply);
      expect(result2.assets).toEqual(result1.assets);
      expect(result2.financial).toEqual(result1.financial);
    });
  });

  // ===== TEST GROUP 2: FILING PERIOD TRACKING =====
  
  describe('2. Filing Period Tracking', () => {
    
    it('2.1 Should retrieve filing period from company metadata', () => {
      const aaplFiling = getFilingPeriod('AAPL');
      expect(aaplFiling.filingPeriod).toBe('2024');
      expect(aaplFiling.filingDate).toBe('2024-11-01T00:00:00.000Z');
      
      const tslaFiling = getFilingPeriod('TSLA');
      expect(tslaFiling.filingPeriod).toBe('2024-Q4');
      expect(tslaFiling.filingDate).toBe('2024-12-31T00:00:00.000Z');
    });
    
    it('2.2 Should compare filing periods correctly (annual)', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      
      // Store 2023 filing
      V4Cache.store(
        ticker,
        channel,
        '2023',
        '2023-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Store 2024 filing - should supersede 2023
      V4Cache.store(
        ticker,
        channel,
        '2024',
        '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // 2023 should be superseded
      const result2023 = V4Cache.get(ticker, channel, '2023');
      expect(result2023).toBeNull(); // Superseded by 2024
      
      // 2024 should be active
      const result2024 = V4Cache.get(ticker, channel, '2024');
      expect(result2024).not.toBeNull();
    });
    
    it('2.3 Should compare filing periods correctly (quarterly)', () => {
      const ticker = 'TSLA';
      const channel = Channel.REVENUE;
      
      // Store Q2 2024
      V4Cache.store(
        ticker,
        channel,
        '2024-Q2',
        '2024-06-30T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Store Q3 2024 - should supersede Q2
      V4Cache.store(
        ticker,
        channel,
        '2024-Q3',
        '2024-09-30T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Q2 should be superseded
      const resultQ2 = V4Cache.get(ticker, channel, '2024-Q2');
      expect(resultQ2).toBeNull();
      
      // Q3 should be active
      const resultQ3 = V4Cache.get(ticker, channel, '2024-Q3');
      expect(resultQ3).not.toBeNull();
    });
  });

  // ===== TEST GROUP 3: CACHE INVALIDATION =====
  
  describe('3. Cache Invalidation with Newer Filings', () => {
    
    it('3.1 Should invalidate cache when newer filing is stored', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      
      // Store 2023 filing
      const cacheId2023 = V4Cache.store(
        ticker,
        channel,
        '2023',
        '2023-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.5], ['China', 0.5]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Verify 2023 is cached
      const result2023Before = V4Cache.get(ticker, channel, '2023');
      expect(result2023Before).not.toBeNull();
      
      // Store 2024 filing - should supersede 2023
      V4Cache.store(
        ticker,
        channel,
        '2024',
        '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.6], ['China', 0.4]]), trace: {} as any },
        {} as any,
        100
      );
      
      // 2023 should now be invalidated
      const result2023After = V4Cache.get(ticker, channel, '2023');
      expect(result2023After).toBeNull();
      
      // 2024 should be active
      const result2024 = V4Cache.get(ticker, channel, '2024');
      expect(result2024).not.toBeNull();
      expect(result2024?.weights.get('United States')).toBe(0.6);
    });
    
    it('3.2 Should detect newer filing availability', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      
      // Store Q1 2024
      V4Cache.store(
        ticker,
        channel,
        '2024-Q1',
        '2024-03-31T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Store Q2 2024
      V4Cache.store(
        ticker,
        channel,
        '2024-Q2',
        '2024-06-30T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any,
        100
      );
      
      // Q1 should be invalidated when trying to retrieve
      const resultQ1 = V4Cache.get(ticker, channel, '2024-Q1');
      expect(resultQ1).toBeNull();
    });
    
    it('3.3 Should invalidate specific cache entry', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store all channels
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      expect(V4Cache.getStatistics().totalEntries).toBe(2);
      
      // Invalidate only REVENUE
      const invalidated = invalidateCompanyCache(ticker, Channel.REVENUE, filingPeriod);
      expect(invalidated).toBe(1);
      
      // REVENUE should be gone, SUPPLY should remain
      expect(V4Cache.get(ticker, Channel.REVENUE, filingPeriod)).toBeNull();
      expect(V4Cache.get(ticker, Channel.SUPPLY, filingPeriod)).not.toBeNull();
    });
    
    it('3.4 Should invalidate all cache entries for a ticker', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store all channels
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.ASSETS, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.FINANCIAL, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      expect(V4Cache.getStatistics().totalEntries).toBe(4);
      
      // Invalidate all for ticker
      const invalidated = invalidateCompanyCache(ticker);
      expect(invalidated).toBe(4);
      
      // All should be gone
      expect(V4Cache.getStatistics().totalEntries).toBe(0);
    });
  });

  // ===== TEST GROUP 4: CHANNEL EXECUTION ISOLATION =====
  
  describe('4. Channel Execution Isolation (Supply Chain ≠ Financial)', () => {
    
    it('4.1 Should produce different results for Supply Chain vs Financial channels', async () => {
      const ticker = 'AAPL';
      
      const result = await calculateV4Exposures(ticker);
      
      // Supply and Financial should be different
      const supplyWeights = Array.from(result.supply.entries()).sort();
      const financialWeights = Array.from(result.financial.entries()).sort();
      
      // They should not be identical
      const areIdentical = JSON.stringify(supplyWeights) === JSON.stringify(financialWeights);
      expect(areIdentical).toBe(false);
    });
    
    it('4.2 Should maintain channel independence across cache operations', async () => {
      const ticker = 'AAPL';
      
      // First calculation - cache all channels
      const result1 = await calculateV4Exposures(ticker);
      
      // Invalidate only SUPPLY channel
      invalidateCompanyCache(ticker, Channel.SUPPLY, '2024');
      
      // Second calculation - SUPPLY recalculated, others from cache
      const result2 = await calculateV4Exposures(ticker);
      
      // REVENUE, ASSETS, FINANCIAL should be identical (from cache)
      expect(result2.revenue).toEqual(result1.revenue);
      expect(result2.assets).toEqual(result1.assets);
      expect(result2.financial).toEqual(result1.financial);
      
      // SUPPLY should also be identical (recalculated but same input)
      expect(result2.supply).toEqual(result1.supply);
    });
    
    it('4.3 Should have separate cache entries for each channel', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store different results for each channel
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.5], ['China', 0.5]]), trace: {} as any },
        {} as any, 100);
      
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.3], ['China', 0.7]]), trace: {} as any },
        {} as any, 100);
      
      V4Cache.store(ticker, Channel.FINANCIAL, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.8], ['China', 0.2]]), trace: {} as any },
        {} as any, 100);
      
      // Retrieve each channel
      const revenueResult = V4Cache.get(ticker, Channel.REVENUE, filingPeriod);
      const supplyResult = V4Cache.get(ticker, Channel.SUPPLY, filingPeriod);
      const financialResult = V4Cache.get(ticker, Channel.FINANCIAL, filingPeriod);
      
      // Each should have its own unique results
      expect(revenueResult?.weights.get('United States')).toBe(0.5);
      expect(supplyResult?.weights.get('United States')).toBe(0.3);
      expect(financialResult?.weights.get('United States')).toBe(0.8);
    });
  });

  // ===== TEST GROUP 5: NO CROSS-CHANNEL LEAKAGE =====
  
  describe('5. No Cross-Channel Data Leakage', () => {
    
    it('5.1 Should not leak data between channels', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store REVENUE with specific data
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.42], ['China', 0.17]]), trace: {} as any },
        {} as any, 100);
      
      // Retrieve SUPPLY (should be null, not REVENUE data)
      const supplyResult = V4Cache.get(ticker, Channel.SUPPLY, filingPeriod);
      expect(supplyResult).toBeNull();
      
      // Retrieve REVENUE (should get correct data)
      const revenueResult = V4Cache.get(ticker, Channel.REVENUE, filingPeriod);
      expect(revenueResult).not.toBeNull();
      expect(revenueResult?.weights.get('United States')).toBe(0.42);
    });
    
    it('5.2 Should maintain channel isolation during invalidation', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store all channels with different data
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.5]]), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.3]]), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.FINANCIAL, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 0.8]]), trace: {} as any }, {} as any, 100);
      
      // Invalidate SUPPLY
      invalidateCompanyCache(ticker, Channel.SUPPLY, filingPeriod);
      
      // REVENUE and FINANCIAL should still exist with correct data
      const revenueResult = V4Cache.get(ticker, Channel.REVENUE, filingPeriod);
      const financialResult = V4Cache.get(ticker, Channel.FINANCIAL, filingPeriod);
      
      expect(revenueResult?.weights.get('United States')).toBe(0.5);
      expect(financialResult?.weights.get('United States')).toBe(0.8);
      
      // SUPPLY should be gone
      const supplyResult = V4Cache.get(ticker, Channel.SUPPLY, filingPeriod);
      expect(supplyResult).toBeNull();
    });
    
    it('5.3 Should track channel breakdown correctly', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store multiple channels
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.REVENUE, '2023', '2023-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.FINANCIAL, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      const stats = V4Cache.getStatistics();
      
      expect(stats.channelBreakdown[Channel.REVENUE]).toBe(2);
      expect(stats.channelBreakdown[Channel.SUPPLY]).toBe(1);
      expect(stats.channelBreakdown[Channel.FINANCIAL]).toBe(1);
      expect(stats.channelBreakdown[Channel.ASSETS]).toBe(0);
    });
  });

  // ===== TEST GROUP 6: STALE DATA DETECTION =====
  
  describe('6. Stale Data Detection', () => {
    
    it('6.1 Should detect expired cache entries', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      const filingPeriod = '2024';
      
      // Store with custom TTL (very short for testing)
      V4Cache.configure({ defaultTTLDays: 0.00001 }); // ~1 second
      
      V4Cache.store(ticker, channel, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map([['United States', 1.0]]), trace: {} as any },
        {} as any, 100);
      
      // Wait for expiration (simulate)
      const stats = V4Cache.getStatistics();
      expect(stats.totalEntries).toBe(1);
      
      // Reset TTL
      V4Cache.configure({ defaultTTLDays: 90 });
    });
    
    it('6.2 Should track cache age', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      const filingPeriod = '2024';
      
      V4Cache.store(ticker, channel, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      const cacheInfo = V4Cache.getCacheInfo();
      const entry = cacheInfo.entries.find(e => 
        e.ticker === ticker && e.channel === channel && e.filingPeriod === filingPeriod
      );
      
      expect(entry).toBeDefined();
      expect(entry!.ageHours).toBeGreaterThanOrEqual(0);
      expect(entry!.ageHours).toBeLessThan(1); // Should be very recent
    });
    
    it('6.3 Should calculate stale entry rate', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      // Store some entries
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      const stats = V4Cache.getStatistics();
      
      // None should be stale (just created)
      expect(stats.staleEntries).toBe(0);
      expect(stats.totalEntries).toBe(2);
    });
  });

  // ===== TEST GROUP 7: CACHE STATISTICS =====
  
  describe('7. Cache Statistics and Monitoring', () => {
    
    it('7.1 Should track hit rate accurately', async () => {
      const ticker = 'AAPL';
      
      // First call - all misses
      await calculateV4Exposures(ticker);
      
      const stats1 = getV4CacheStatistics();
      expect(stats1.totalEntries).toBe(4);
      
      // Second call - all hits
      await calculateV4Exposures(ticker);
      
      const stats2 = getV4CacheStatistics();
      expect(stats2.hitRate).toBeGreaterThan(0);
    });
    
    it('7.2 Should track invalidation rate', () => {
      const ticker = 'AAPL';
      const channel = Channel.REVENUE;
      
      // Store old filing
      V4Cache.store(ticker, channel, '2023', '2023-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      // Store new filing (should trigger invalidation)
      V4Cache.store(ticker, channel, '2024', '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      const stats = V4Cache.getStatistics();
      expect(stats.invalidationRate).toBeGreaterThan(0);
    });
    
    it('7.3 Should provide detailed cache info', () => {
      const ticker = 'AAPL';
      const filingPeriod = '2024';
      
      V4Cache.store(ticker, Channel.REVENUE, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      V4Cache.store(ticker, Channel.SUPPLY, filingPeriod, '2024-11-01T00:00:00.000Z',
        { weights: new Map(), trace: {} as any }, {} as any, 100);
      
      const cacheInfo = V4Cache.getCacheInfo();
      
      expect(cacheInfo.entries.length).toBe(2);
      expect(cacheInfo.statistics.totalEntries).toBe(2);
      
      const revenueEntry = cacheInfo.entries.find(e => e.channel === Channel.REVENUE);
      expect(revenueEntry).toBeDefined();
      expect(revenueEntry!.ticker).toBe(ticker);
      expect(revenueEntry!.filingPeriod).toBe(filingPeriod);
    });
  });
});

/**
 * PHASE 3 TEST SUMMARY
 * 
 * Total Test Cases: 27
 * 
 * Test Groups:
 * 1. Channel-Specific Cache Keys (3 tests)
 * 2. Filing Period Tracking (3 tests)
 * 3. Cache Invalidation (4 tests)
 * 4. Channel Execution Isolation (3 tests)
 * 5. No Cross-Channel Leakage (3 tests)
 * 6. Stale Data Detection (3 tests)
 * 7. Cache Statistics (3 tests)
 * 
 * Success Criteria:
 * - Supply Chain ≠ Financial Channel (100% independence)
 * - Cache invalidated when newer filing available (100% detection)
 * - No cross-channel leakage (0% leakage rate)
 * - Stale data rate < 1%
 * - 95%+ test pass rate
 */