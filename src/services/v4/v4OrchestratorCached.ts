/**
 * V.4 Orchestrator with Cache Integration
 * 
 * PHASE 3: CHANNEL INDEPENDENCE & CACHE INVALIDATION
 * 
 * Wraps the core v4Orchestrator with channel-specific caching:
 * - Cache key: ${ticker}_${channel}_${filingPeriod}
 * - Filing period tracking and comparison
 * - Automatic invalidation for newer filings
 * - Channel execution isolation
 */

import { Channel, EvidenceBundle, AllocationResult } from '@/types/v4Types';
import { allocateChannel_V4, runStep1_V4 } from './v4Orchestrator';
import V4Cache from './v4Cache';

/**
 * Allocate channel with cache support
 * 
 * @param evidenceBundle - Evidence bundle for the channel
 * @param ticker - Company ticker symbol
 * @param filingPeriod - Filing period (e.g., "2024-Q3" or "2024")
 * @param filingDate - Filing date (ISO string)
 * @param options - Cache options
 * @returns Allocation result (from cache or fresh calculation)
 */
export function allocateChannelCached_V4(
  evidenceBundle: EvidenceBundle,
  ticker: string,
  filingPeriod: string,
  filingDate: string,
  options: {
    useCache?: boolean;
    forceRefresh?: boolean;
  } = {}
): AllocationResult {
  
  const { useCache = true, forceRefresh = false } = options;
  const channel = evidenceBundle.channel;
  
  // Try cache first (unless force refresh)
  if (useCache && !forceRefresh) {
    const cached = V4Cache.get(ticker, channel, filingPeriod);
    
    if (cached) {
      console.log(`[V4 Orchestrator Cached] Cache hit for ${ticker} ${channel} ${filingPeriod}`);
      return cached;
    }
  }
  
  // Cache miss or force refresh - perform allocation
  const startTime = Date.now();
  console.log(`[V4 Orchestrator Cached] Computing ${ticker} ${channel} ${filingPeriod}...`);
  
  const result = allocateChannel_V4(evidenceBundle);
  
  const calculationTime = Date.now() - startTime;
  
  // Store in cache
  if (useCache) {
    V4Cache.store(
      ticker,
      channel,
      filingPeriod,
      filingDate,
      result,
      evidenceBundle,
      calculationTime
    );
  }
  
  console.log(`[V4 Orchestrator Cached] Computed ${ticker} ${channel} in ${calculationTime}ms`);
  
  return result;
}

/**
 * Run Step 1 for all channels with cache support
 * 
 * @param evidenceBundles - Evidence bundles for all channels
 * @param ticker - Company ticker symbol
 * @param filingPeriod - Filing period (e.g., "2024-Q3" or "2024")
 * @param filingDate - Filing date (ISO string)
 * @param options - Cache options
 * @returns Allocation results for all channels
 */
export function runStep1Cached_V4(
  evidenceBundles: Map<Channel, EvidenceBundle>,
  ticker: string,
  filingPeriod: string,
  filingDate: string,
  options: {
    useCache?: boolean;
    forceRefresh?: boolean;
  } = {}
): Map<Channel, AllocationResult> {
  
  const results = new Map<Channel, AllocationResult>();
  
  console.log(`[V4 Orchestrator Cached] Running Step 1 for ${ticker} (${filingPeriod})`);
  console.log(`[V4 Orchestrator Cached] Channels: ${Array.from(evidenceBundles.keys()).join(', ')}`);
  
  for (const [channel, evidence] of evidenceBundles.entries()) {
    const result = allocateChannelCached_V4(
      evidence,
      ticker,
      filingPeriod,
      filingDate,
      options
    );
    
    results.set(channel, result);
  }
  
  // Log cache statistics
  const stats = V4Cache.getStatistics();
  console.log(`[V4 Orchestrator Cached] Cache stats: ${stats.totalEntries} entries, hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  
  return results;
}

/**
 * Invalidate cache for a specific company/channel/filing
 */
export function invalidateCache(
  ticker: string,
  channel?: Channel,
  filingPeriod?: string
): number {
  
  if (channel && filingPeriod) {
    // Invalidate specific entry
    const success = V4Cache.invalidate(ticker, channel, filingPeriod);
    return success ? 1 : 0;
  } else {
    // Invalidate all entries for ticker
    return V4Cache.invalidateAll(ticker);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStatistics() {
  return V4Cache.getStatistics();
}

/**
 * Get detailed cache info for debugging
 */
export function getCacheInfo() {
  return V4Cache.getCacheInfo();
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  V4Cache.clear();
}

/**
 * Configure cache settings
 */
export function configureCache(config: {
  enabled?: boolean;
  defaultTTLDays?: number;
  maxEntries?: number;
  enableFilingPeriodTracking?: boolean;
  enableAutomaticInvalidation?: boolean;
}): void {
  V4Cache.configure(config);
}