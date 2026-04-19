/**
 * V4 Channel-Specific Cache Service
 * 
 * PHASE 3: CHANNEL INDEPENDENCE & CACHE INVALIDATION
 * 
 * Features:
 * - Channel-specific cache keys: ${ticker}_${channel}_${filingPeriod}
 * - Filing period tracking and comparison
 * - Automatic cache invalidation for newer filings
 * - Channel execution isolation (Supply Chain ≠ Financial)
 * - Stale data detection and prevention
 */

import { Channel, AllocationResult, EvidenceBundle } from '@/types/v4Types';

// ===== CACHE ENTRY STRUCTURE =====

export interface V4CacheEntry {
  cacheId: string;
  ticker: string;
  channel: Channel;
  filingPeriod: string; // Format: "YYYY-Q#" (e.g., "2024-Q3") or "YYYY" (e.g., "2024")
  filingDate: string; // ISO date string
  result: AllocationResult;
  evidenceBundle: EvidenceBundle;
  metadata: {
    cachedAt: string; // ISO timestamp
    expiresAt: string; // ISO timestamp
    version: string; // V4 version
    calculationTimeMs: number;
  };
  supersededBy?: string; // Cache ID that supersedes this entry
}

export interface CacheStatistics {
  totalEntries: number;
  channelBreakdown: Record<Channel, number>;
  hitRate: number;
  missRate: number;
  invalidationRate: number;
  averageAge: number; // hours
  staleEntries: number;
}

// ===== CACHE CONFIGURATION =====

export interface V4CacheConfig {
  enabled: boolean;
  defaultTTLDays: number;
  maxEntries: number;
  enableFilingPeriodTracking: boolean;
  enableAutomaticInvalidation: boolean;
}

export const DEFAULT_V4_CACHE_CONFIG: V4CacheConfig = {
  enabled: true,
  defaultTTLDays: 90, // 3 months
  maxEntries: 10000,
  enableFilingPeriodTracking: true,
  enableAutomaticInvalidation: true
};

// ===== V4 CACHE SERVICE =====

export class V4Cache {
  private static cache = new Map<string, V4CacheEntry>();
  private static config: V4CacheConfig = DEFAULT_V4_CACHE_CONFIG;
  private static stats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };

  /**
   * Generate channel-specific cache key
   * Format: ${ticker}_${channel}_${filingPeriod}
   */
  static generateCacheKey(ticker: string, channel: Channel, filingPeriod: string): string {
    return `${ticker}_${channel}_${filingPeriod}`;
  }

  /**
   * Store allocation result in cache with channel isolation
   */
  static store(
    ticker: string,
    channel: Channel,
    filingPeriod: string,
    filingDate: string,
    result: AllocationResult,
    evidenceBundle: EvidenceBundle,
    calculationTimeMs: number
  ): string {
    
    if (!this.config.enabled) {
      return '';
    }

    const cacheId = this.generateCacheKey(ticker, channel, filingPeriod);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.defaultTTLDays * 24 * 60 * 60 * 1000);

    console.log(`[V4 Cache] Storing ${channel} for ${ticker} (${filingPeriod})`);

    // Check for existing entries and supersede them if newer filing
    const existingEntries = this.getTickerChannelEntries(ticker, channel);
    for (const existing of existingEntries) {
      if (this.isNewerFiling(filingPeriod, existing.filingPeriod)) {
        existing.supersededBy = cacheId;
        this.stats.invalidations++;
        console.log(`[V4 Cache] Superseded ${existing.cacheId} with newer filing ${filingPeriod}`);
      }
    }

    const entry: V4CacheEntry = {
      cacheId,
      ticker,
      channel,
      filingPeriod,
      filingDate,
      result,
      evidenceBundle,
      metadata: {
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        version: '4.0',
        calculationTimeMs
      }
    };

    this.cache.set(cacheId, entry);

    // Enforce max entries limit
    if (this.cache.size > this.config.maxEntries) {
      this.evictOldestEntries();
    }

    console.log(`[V4 Cache] Stored ${cacheId} (${this.cache.size} total entries)`);
    return cacheId;
  }

  /**
   * Retrieve allocation result from cache with validation
   */
  static get(
    ticker: string,
    channel: Channel,
    filingPeriod: string
  ): AllocationResult | null {
    
    if (!this.config.enabled) {
      this.stats.misses++;
      return null;
    }

    const cacheId = this.generateCacheKey(ticker, channel, filingPeriod);
    const entry = this.cache.get(cacheId);

    if (!entry) {
      this.stats.misses++;
      console.log(`[V4 Cache] Miss: ${cacheId}`);
      return null;
    }

    // Check if superseded
    if (entry.supersededBy) {
      this.stats.misses++;
      console.log(`[V4 Cache] Entry superseded: ${cacheId} → ${entry.supersededBy}`);
      return null;
    }

    // Check expiration
    const now = new Date();
    if (now > new Date(entry.metadata.expiresAt)) {
      this.cache.delete(cacheId);
      this.stats.misses++;
      console.log(`[V4 Cache] Expired: ${cacheId}`);
      return null;
    }

    // Check if newer filing exists
    if (this.config.enableAutomaticInvalidation) {
      const hasNewerFiling = this.hasNewerFilingAvailable(ticker, channel, filingPeriod);
      if (hasNewerFiling) {
        this.stats.misses++;
        console.log(`[V4 Cache] Newer filing available for ${ticker} ${channel}`);
        return null;
      }
    }

    this.stats.hits++;
    const ageHours = (now.getTime() - new Date(entry.metadata.cachedAt).getTime()) / (1000 * 60 * 60);
    console.log(`[V4 Cache] Hit: ${cacheId} (age: ${ageHours.toFixed(1)}h)`);
    
    return entry.result;
  }

  /**
   * Check if a newer filing is available for the ticker/channel
   */
  private static hasNewerFilingAvailable(
    ticker: string,
    channel: Channel,
    currentFilingPeriod: string
  ): boolean {
    
    const entries = this.getTickerChannelEntries(ticker, channel);
    
    for (const entry of entries) {
      if (this.isNewerFiling(entry.filingPeriod, currentFilingPeriod) && !entry.supersededBy) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Compare filing periods to determine if one is newer
   * Returns true if filingPeriod1 is newer than filingPeriod2
   */
  private static isNewerFiling(filingPeriod1: string, filingPeriod2: string): boolean {
    // Parse filing periods (format: "YYYY-Q#" or "YYYY")
    const parse = (period: string): { year: number; quarter: number } => {
      if (period.includes('-Q')) {
        const [year, q] = period.split('-Q');
        return { year: parseInt(year), quarter: parseInt(q) };
      } else {
        return { year: parseInt(period), quarter: 4 }; // Annual filing = Q4
      }
    };

    const p1 = parse(filingPeriod1);
    const p2 = parse(filingPeriod2);

    if (p1.year !== p2.year) {
      return p1.year > p2.year;
    }
    return p1.quarter > p2.quarter;
  }

  /**
   * Get all cache entries for a ticker and channel
   */
  private static getTickerChannelEntries(ticker: string, channel: Channel): V4CacheEntry[] {
    const entries: V4CacheEntry[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.ticker === ticker && entry.channel === channel) {
        entries.push(entry);
      }
    }
    
    return entries;
  }

  /**
   * Invalidate cache for a specific ticker/channel/filing period
   */
  static invalidate(ticker: string, channel: Channel, filingPeriod: string): boolean {
    const cacheId = this.generateCacheKey(ticker, channel, filingPeriod);
    const deleted = this.cache.delete(cacheId);
    
    if (deleted) {
      this.stats.invalidations++;
      console.log(`[V4 Cache] Invalidated: ${cacheId}`);
    }
    
    return deleted;
  }

  /**
   * Invalidate all cache entries for a ticker
   */
  static invalidateAll(ticker: string): number {
    let count = 0;
    
    for (const [cacheId, entry] of this.cache.entries()) {
      if (entry.ticker === ticker) {
        this.cache.delete(cacheId);
        count++;
      }
    }
    
    if (count > 0) {
      this.stats.invalidations += count;
      console.log(`[V4 Cache] Invalidated ${count} entries for ${ticker}`);
    }
    
    return count;
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[V4 Cache] Cleared ${size} entries`);
  }

  /**
   * Evict oldest entries to maintain max size
   */
  private static evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => 
      new Date(a[1].metadata.cachedAt).getTime() - new Date(b[1].metadata.cachedAt).getTime()
    );

    const toRemove = entries.slice(0, Math.floor(this.config.maxEntries * 0.1)); // Remove 10%
    
    for (const [cacheId] of toRemove) {
      this.cache.delete(cacheId);
    }
    
    console.log(`[V4 Cache] Evicted ${toRemove.length} oldest entries`);
  }

  /**
   * Get cache statistics
   */
  static getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const now = new Date();
    
    const channelBreakdown: Record<Channel, number> = {
      [Channel.REVENUE]: 0,
      [Channel.ASSETS]: 0,
      [Channel.SUPPLY]: 0,
      [Channel.FINANCIAL]: 0
    };

    let totalAge = 0;
    let staleEntries = 0;

    for (const entry of entries) {
      channelBreakdown[entry.channel]++;
      
      const ageMs = now.getTime() - new Date(entry.metadata.cachedAt).getTime();
      totalAge += ageMs / (1000 * 60 * 60); // Convert to hours
      
      if (now > new Date(entry.metadata.expiresAt)) {
        staleEntries++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    const invalidationRate = entries.length > 0 ? this.stats.invalidations / entries.length : 0;
    const averageAge = entries.length > 0 ? totalAge / entries.length : 0;

    return {
      totalEntries: entries.length,
      channelBreakdown,
      hitRate,
      missRate,
      invalidationRate,
      averageAge,
      staleEntries
    };
  }

  /**
   * Get detailed cache info for debugging
   */
  static getCacheInfo(): {
    entries: Array<{
      cacheId: string;
      ticker: string;
      channel: Channel;
      filingPeriod: string;
      ageHours: number;
      superseded: boolean;
    }>;
    statistics: CacheStatistics;
  } {
    const now = new Date();
    const entries = Array.from(this.cache.values()).map(entry => ({
      cacheId: entry.cacheId,
      ticker: entry.ticker,
      channel: entry.channel,
      filingPeriod: entry.filingPeriod,
      ageHours: (now.getTime() - new Date(entry.metadata.cachedAt).getTime()) / (1000 * 60 * 60),
      superseded: !!entry.supersededBy
    }));

    return {
      entries,
      statistics: this.getStatistics()
    };
  }

  /**
   * Configure cache settings
   */
  static configure(config: Partial<V4CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`[V4 Cache] Configuration updated:`, this.config);
  }
}

export default V4Cache;