/**
 * CSI Cache Service
 * 
 * Provides caching for CSI calculations to improve performance,
 * especially for extended time windows (3Y, 5Y, 10Y).
 * 
 * Features:
 * - In-memory cache for fast access
 * - IndexedDB for persistent storage (survives page refresh)
 * - TTL-based invalidation
 * - Manual cache invalidation
 */

import { ExtendedTimeWindow, getTimeWindowDays } from '@/data/geopoliticalEvents';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// CSI Time Series data point
export interface CSIDataPoint {
  date: string; // ISO string for serialization
  globalCSI: number;
  countryCSI?: number;
  countryName?: string;
}

// Cache key parameters
export interface CacheKeyParams {
  timeWindow: ExtendedTimeWindow;
  country?: string;
  startDate?: string;
  endDate?: string;
}

// TTL constants (in milliseconds)
const TTL_RECENT = 60 * 60 * 1000; // 1 hour for recent data (7D, 30D, 90D)
const TTL_HISTORICAL = 24 * 60 * 60 * 1000; // 24 hours for historical data (3Y, 5Y, 10Y)
const TTL_EXTENDED = 7 * 24 * 60 * 60 * 1000; // 7 days for 10Y data

// IndexedDB configuration
const DB_NAME = 'csi-cache-db';
const DB_VERSION = 1;
const STORE_NAME = 'csi-time-series';

// Performance metrics
interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  avgCalculationTime: Map<ExtendedTimeWindow, number>;
  lastCalculationTimes: Map<string, number>;
}

class CSICache {
  private memoryCache: Map<string, CacheEntry<CSIDataPoint[]>> = new Map();
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<void> | null = null;
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    avgCalculationTime: new Map(),
    lastCalculationTimes: new Map()
  };

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initIndexedDB(): Promise<void> {
    if (this.dbInitPromise) {
      return this.dbInitPromise;
    }

    this.dbInitPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, using memory cache only');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('Failed to open IndexedDB, using memory cache only');
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.dbInitPromise;
  }

  /**
   * Generate cache key from parameters
   */
  generateCacheKey(params: CacheKeyParams): string {
    const parts = [
      'csi',
      params.timeWindow,
      params.country || 'global',
      params.startDate || 'default',
      params.endDate || 'default'
    ];
    return parts.join(':');
  }

  /**
   * Get TTL based on time window
   */
  private getTTL(timeWindow: ExtendedTimeWindow): number {
    switch (timeWindow) {
      case '7D':
      case '30D':
      case '90D':
        return TTL_RECENT;
      case '12M':
      case '3Y':
      case '5Y':
        return TTL_HISTORICAL;
      case '10Y':
        return TTL_EXTENDED;
      default:
        return TTL_RECENT;
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid(entry: CacheEntry<CSIDataPoint[]>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  async get(params: CacheKeyParams): Promise<CSIDataPoint[] | null> {
    const key = this.generateCacheKey(params);
    const startTime = performance.now();

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.metrics.cacheHits++;
      this.logCacheHit(key, 'memory', performance.now() - startTime);
      return memoryEntry.data;
    }

    // Check IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      try {
        const dbEntry = await this.getFromIndexedDB(key);
        if (dbEntry && this.isValid(dbEntry)) {
          // Restore to memory cache
          this.memoryCache.set(key, dbEntry);
          this.metrics.cacheHits++;
          this.logCacheHit(key, 'indexeddb', performance.now() - startTime);
          return dbEntry.data;
        }
      } catch (error) {
        console.warn('Failed to read from IndexedDB:', error);
      }
    }

    this.metrics.cacheMisses++;
    this.logCacheMiss(key);
    return null;
  }

  /**
   * Get data from IndexedDB
   */
  private getFromIndexedDB(key: string): Promise<CacheEntry<CSIDataPoint[]> | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Set data in cache
   */
  async set(params: CacheKeyParams, data: CSIDataPoint[], calculationTime?: number): Promise<void> {
    const key = this.generateCacheKey(params);
    const ttl = this.getTTL(params.timeWindow);
    
    const entry: CacheEntry<CSIDataPoint[]> = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store calculation time for metrics
    if (calculationTime !== undefined) {
      this.metrics.lastCalculationTimes.set(key, calculationTime);
      this.updateAvgCalculationTime(params.timeWindow, calculationTime);
    }

    // Store in IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      try {
        await this.setInIndexedDB(entry);
        this.logCacheSet(key, data.length, ttl);
      } catch (error) {
        console.warn('Failed to write to IndexedDB:', error);
      }
    }
  }

  /**
   * Set data in IndexedDB
   */
  private setInIndexedDB(entry: CacheEntry<CSIDataPoint[]>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(params: CacheKeyParams): Promise<void> {
    const key = this.generateCacheKey(params);
    
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      try {
        await this.deleteFromIndexedDB(key);
        console.log(`[CSI Cache] Invalidated: ${key}`);
      } catch (error) {
        console.warn('Failed to delete from IndexedDB:', error);
      }
    }
  }

  /**
   * Delete from IndexedDB
   */
  private deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Invalidate all cache entries for a specific time window
   */
  async invalidateTimeWindow(timeWindow: ExtendedTimeWindow): Promise<void> {
    const keysToDelete: string[] = [];
    
    // Find matching keys in memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(`:${timeWindow}:`)) {
        keysToDelete.push(key);
      }
    }

    // Delete from memory cache
    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    // Delete from IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      for (const key of keysToDelete) {
        try {
          await this.deleteFromIndexedDB(key);
        } catch (error) {
          console.warn('Failed to delete from IndexedDB:', error);
        }
      }
    }

    console.log(`[CSI Cache] Invalidated ${keysToDelete.length} entries for time window: ${timeWindow}`);
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        console.log('[CSI Cache] Cleared all cache entries');
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean IndexedDB
    await this.initIndexedDB();
    if (this.db) {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.openCursor();

        await new Promise<void>((resolve, reject) => {
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              const entry = cursor.value as CacheEntry<CSIDataPoint[]>;
              if (!this.isValid(entry)) {
                cursor.delete();
                cleanedCount++;
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('Failed to cleanup IndexedDB:', error);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CSI Cache] Cleaned up ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryCacheSize: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    avgCalculationTimes: Record<string, number>;
  } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;

    const avgCalculationTimes: Record<string, number> = {};
    for (const [window, time] of this.metrics.avgCalculationTime.entries()) {
      avgCalculationTimes[window] = time;
    }

    return {
      memoryCacheSize: this.memoryCache.size,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      hitRate: parseFloat(hitRate.toFixed(2)),
      avgCalculationTimes
    };
  }

  /**
   * Update average calculation time
   */
  private updateAvgCalculationTime(timeWindow: ExtendedTimeWindow, time: number): void {
    const current = this.metrics.avgCalculationTime.get(timeWindow);
    if (current) {
      // Running average
      this.metrics.avgCalculationTime.set(timeWindow, (current + time) / 2);
    } else {
      this.metrics.avgCalculationTime.set(timeWindow, time);
    }
  }

  /**
   * Logging helpers
   */
  private logCacheHit(key: string, source: 'memory' | 'indexeddb', time: number): void {
    console.log(`[CSI Cache] HIT (${source}): ${key} [${time.toFixed(2)}ms]`);
  }

  private logCacheMiss(key: string): void {
    console.log(`[CSI Cache] MISS: ${key}`);
  }

  private logCacheSet(key: string, dataPoints: number, ttl: number): void {
    const ttlHours = (ttl / (1000 * 60 * 60)).toFixed(1);
    console.log(`[CSI Cache] SET: ${key} [${dataPoints} points, TTL: ${ttlHours}h]`);
  }

  /**
   * Check if data is cached and valid
   */
  async isCached(params: CacheKeyParams): Promise<boolean> {
    const data = await this.get(params);
    return data !== null;
  }

  /**
   * Get cache entry metadata without data
   */
  getCacheMetadata(params: CacheKeyParams): {
    isCached: boolean;
    timestamp?: number;
    ttl?: number;
    age?: number;
    expiresIn?: number;
  } | null {
    const key = this.generateCacheKey(params);
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return { isCached: false };
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const expiresIn = entry.ttl - age;

    return {
      isCached: this.isValid(entry),
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      age,
      expiresIn: Math.max(0, expiresIn)
    };
  }
}

// Singleton instance
export const csiCache = new CSICache();

// Auto-cleanup every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    csiCache.cleanup();
  }, 60 * 60 * 1000);
}