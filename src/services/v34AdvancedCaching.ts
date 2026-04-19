/**
 * CO-GRI v3.4 ADVANCED CACHING SYSTEM
 * 
 * PHASE 6: ADVANCED CACHING SYSTEM IMPLEMENTATION
 * 
 * Sophisticated caching architecture with:
 * - Document Cache: Raw filings with metadata and versioning
 * - Evidence-Confirmed Cache: Extracted outputs with channel isolation
 * - Supersession Rules: Automatic cache invalidation and version control
 * - Performance Optimization: TTL policies, compression, analytics
 * - Cache Monitoring: Hit rates, data freshness, performance metrics
 */

import { 
  DocumentCacheEntry, 
  ConfirmedEvidenceEntry, 
  V34DocumentCache, 
  V34EvidenceConfirmedCache 
} from './v34EvidenceHierarchy';

import { EvidenceLevel, EvidenceSufficiency, V34ChannelData } from './v34FallbackCore';
import { RegulatoryFiling, ParsedRegulatoryData } from './v34JurisdictionProcessor';

// ===== ADVANCED CACHE CONFIGURATION =====

export interface CacheConfiguration {
  documentCache: {
    maxSizeGB: number;
    defaultTTLHours: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    cleanupIntervalMinutes: number;
  };
  evidenceCache: {
    maxEntries: number;
    defaultTTLDays: number;
    channelIsolation: boolean;
    supersessionEnabled: boolean;
    validationRequired: boolean;
  };
  performance: {
    prefetchEnabled: boolean;
    backgroundRefresh: boolean;
    cacheWarmupOnStartup: boolean;
    metricsCollectionEnabled: boolean;
  };
  monitoring: {
    alertThresholds: {
      hitRateBelow: number;
      stalenessAboveHours: number;
      errorRateAbove: number;
    };
    reportingIntervalMinutes: number;
  };
}

export const DEFAULT_CACHE_CONFIG: CacheConfiguration = {
  documentCache: {
    maxSizeGB: 50,
    defaultTTLHours: 168, // 7 days
    compressionEnabled: true,
    encryptionEnabled: false,
    cleanupIntervalMinutes: 60
  },
  evidenceCache: {
    maxEntries: 100000,
    defaultTTLDays: 30,
    channelIsolation: true,
    supersessionEnabled: true,
    validationRequired: true
  },
  performance: {
    prefetchEnabled: true,
    backgroundRefresh: true,
    cacheWarmupOnStartup: false,
    metricsCollectionEnabled: true
  },
  monitoring: {
    alertThresholds: {
      hitRateBelow: 0.7,
      stalenessAboveHours: 48,
      errorRateAbove: 0.05
    },
    reportingIntervalMinutes: 15
  }
};

// ===== CACHE PERFORMANCE METRICS =====

export interface CacheMetrics {
  documentCache: {
    totalEntries: number;
    totalSizeGB: number;
    hitRate: number;
    missRate: number;
    evictionRate: number;
    averageRetrievalTimeMs: number;
    compressionRatio: number;
  };
  evidenceCache: {
    totalEntries: number;
    channelBreakdown: Record<string, number>;
    hitRate: number;
    supersessionRate: number;
    validationSuccessRate: number;
    averageConfidenceScore: number;
    stalenessDistribution: Record<string, number>; // hours -> count
  };
  performance: {
    overallHitRate: number;
    averageResponseTimeMs: number;
    cacheEfficiencyScore: number;
    backgroundRefreshRate: number;
    errorRate: number;
  };
  timestamp: string;
}

export class CacheMetricsCollector {
  private static metrics: CacheMetrics = this.initializeMetrics();
  private static metricsHistory: CacheMetrics[] = [];
  
  static initializeMetrics(): CacheMetrics {
    return {
      documentCache: {
        totalEntries: 0,
        totalSizeGB: 0,
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        averageRetrievalTimeMs: 0,
        compressionRatio: 0
      },
      evidenceCache: {
        totalEntries: 0,
        channelBreakdown: {},
        hitRate: 0,
        supersessionRate: 0,
        validationSuccessRate: 0,
        averageConfidenceScore: 0,
        stalenessDistribution: {}
      },
      performance: {
        overallHitRate: 0,
        averageResponseTimeMs: 0,
        cacheEfficiencyScore: 0,
        backgroundRefreshRate: 0,
        errorRate: 0
      },
      timestamp: new Date().toISOString()
    };
  }
  
  static recordDocumentCacheHit(retrievalTimeMs: number): void {
    this.metrics.documentCache.hitRate = this.updateRate(this.metrics.documentCache.hitRate, true);
    this.metrics.documentCache.averageRetrievalTimeMs = this.updateAverage(
      this.metrics.documentCache.averageRetrievalTimeMs, 
      retrievalTimeMs
    );
  }
  
  static recordDocumentCacheMiss(): void {
    this.metrics.documentCache.missRate = this.updateRate(this.metrics.documentCache.missRate, true);
  }
  
  static recordEvidenceCacheHit(channel: string, confidenceScore: number): void {
    this.metrics.evidenceCache.hitRate = this.updateRate(this.metrics.evidenceCache.hitRate, true);
    this.metrics.evidenceCache.channelBreakdown[channel] = 
      (this.metrics.evidenceCache.channelBreakdown[channel] || 0) + 1;
    this.metrics.evidenceCache.averageConfidenceScore = this.updateAverage(
      this.metrics.evidenceCache.averageConfidenceScore,
      confidenceScore
    );
  }
  
  static recordSupersession(): void {
    this.metrics.evidenceCache.supersessionRate = this.updateRate(this.metrics.evidenceCache.supersessionRate, true);
  }
  
  private static updateRate(currentRate: number, isSuccess: boolean, decayFactor: number = 0.95): number {
    return currentRate * decayFactor + (isSuccess ? 1 : 0) * (1 - decayFactor);
  }
  
  private static updateAverage(currentAvg: number, newValue: number, decayFactor: number = 0.9): number {
    return currentAvg * decayFactor + newValue * (1 - decayFactor);
  }
  
  static getCurrentMetrics(): CacheMetrics {
    this.metrics.timestamp = new Date().toISOString();
    this.metrics.performance.overallHitRate = 
      (this.metrics.documentCache.hitRate + this.metrics.evidenceCache.hitRate) / 2;
    
    return { ...this.metrics };
  }
  
  static getMetricsHistory(hours: number = 24): CacheMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => new Date(m.timestamp) > cutoff);
  }
  
  static saveMetricsSnapshot(): void {
    const snapshot = this.getCurrentMetrics();
    this.metricsHistory.push(snapshot);
    
    // Keep only last 7 days of history
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(m => new Date(m.timestamp) > weekAgo);
  }
}

// ===== ENHANCED DOCUMENT CACHE =====

export interface EnhancedDocumentCacheEntry extends DocumentCacheEntry {
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    algorithm: string;
  };
  accessHistory: {
    lastAccessed: string;
    accessCount: number;
    accessPattern: 'frequent' | 'occasional' | 'rare';
  };
  validationStatus: {
    lastValidated: string;
    validationScore: number;
    validationErrors: string[];
  };
  supersessionChain?: string[]; // IDs of documents this supersedes
  relatedDocuments?: string[]; // Related document IDs
}

export class V34EnhancedDocumentCache {
  private static cache = new Map<string, EnhancedDocumentCacheEntry>();
  private static config: CacheConfiguration = DEFAULT_CACHE_CONFIG;
  private static compressionEnabled = true;
  
  /**
   * Store document with enhanced metadata and compression
   */
  static async storeEnhancedDocument(
    ticker: string,
    documentType: DocumentCacheEntry['documentType'],
    content: string,
    metadata: Partial<DocumentCacheEntry['metadata']>,
    options: {
      compress?: boolean;
      encrypt?: boolean;
      supersedes?: string[];
      relatedTo?: string[];
    } = {}
  ): Promise<string> {
    
    const startTime = Date.now();
    const documentId = `${ticker}_${documentType}_${Date.now()}`;
    
    console.log(`[Enhanced Document Cache] Storing ${documentType} for ${ticker}`);
    
    // Compression
    let finalContent = content;
    let compressionInfo: EnhancedDocumentCacheEntry['compressionInfo'];
    
    if (options.compress !== false && this.compressionEnabled) {
      const compressed = await this.compressContent(content);
      finalContent = compressed.content;
      compressionInfo = compressed.info;
      console.log(`[Enhanced Document Cache] Compressed ${content.length} → ${compressed.content.length} bytes (${(compressed.info.compressedSize / compressed.info.originalSize * 100).toFixed(1)}%)`);
    }
    
    // Handle supersession
    if (options.supersedes && options.supersedes.length > 0) {
      for (const supersededId of options.supersedes) {
        const existing = this.cache.get(supersededId);
        if (existing) {
          existing.supersededBy = documentId;
          console.log(`[Enhanced Document Cache] Superseded ${supersededId} with ${documentId}`);
        }
      }
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.documentCache.defaultTTLHours * 60 * 60 * 1000);
    
    const entry: EnhancedDocumentCacheEntry = {
      documentId,
      ticker,
      documentType,
      content: finalContent,
      metadata: {
        filingDate: metadata.filingDate || now.toISOString(),
        fiscalYear: metadata.fiscalYear || now.getFullYear(),
        documentUrl: metadata.documentUrl,
        fileSize: content.length,
        processingStatus: 'processed',
        lastProcessed: now.toISOString(),
        version: '3.4.0'
      },
      extractedEvidence: [],
      cacheTimestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      compressionInfo,
      accessHistory: {
        lastAccessed: now.toISOString(),
        accessCount: 0,
        accessPattern: 'rare'
      },
      validationStatus: {
        lastValidated: now.toISOString(),
        validationScore: 1.0,
        validationErrors: []
      },
      supersessionChain: options.supersedes,
      relatedDocuments: options.relatedTo
    };
    
    this.cache.set(documentId, entry);
    
    // Update metrics
    CacheMetricsCollector.recordDocumentCacheMiss(); // New entry is a "miss" for the original request
    
    const processingTime = Date.now() - startTime;
    console.log(`[Enhanced Document Cache] Stored ${documentId} in ${processingTime}ms`);
    
    return documentId;
  }
  
  /**
   * Retrieve document with access tracking
   */
  static async getEnhancedDocument(documentId: string): Promise<EnhancedDocumentCacheEntry | null> {
    const startTime = Date.now();
    const entry = this.cache.get(documentId);
    
    if (!entry) {
      CacheMetricsCollector.recordDocumentCacheMiss();
      return null;
    }
    
    // Check expiration
    if (new Date() > new Date(entry.expiresAt)) {
      this.cache.delete(documentId);
      CacheMetricsCollector.recordDocumentCacheMiss();
      console.log(`[Enhanced Document Cache] Expired document removed: ${documentId}`);
      return null;
    }
    
    // Check supersession
    if (entry.supersededBy) {
      console.log(`[Enhanced Document Cache] Document ${documentId} superseded by ${entry.supersededBy}`);
      return this.getEnhancedDocument(entry.supersededBy);
    }
    
    // Update access history
    entry.accessHistory.lastAccessed = new Date().toISOString();
    entry.accessHistory.accessCount++;
    entry.accessHistory.accessPattern = this.determineAccessPattern(entry.accessHistory.accessCount);
    
    // Decompress if needed
    let content = entry.content;
    if (entry.compressionInfo) {
      content = await this.decompressContent(entry.content, entry.compressionInfo.algorithm);
    }
    
    const retrievalTime = Date.now() - startTime;
    CacheMetricsCollector.recordDocumentCacheHit(retrievalTime);
    
    console.log(`[Enhanced Document Cache] Retrieved ${documentId} in ${retrievalTime}ms (access #${entry.accessHistory.accessCount})`);
    
    return {
      ...entry,
      content
    };
  }
  
  /**
   * Advanced cache analytics and optimization
   */
  static async optimizeCache(): Promise<{
    entriesRemoved: number;
    spaceFreedGB: number;
    optimizationActions: string[];
  }> {
    
    console.log(`[Enhanced Document Cache] Starting cache optimization...`);
    
    const actions: string[] = [];
    let entriesRemoved = 0;
    let spaceFreed = 0;
    
    const now = new Date();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    for (const [id, entry] of entries) {
      if (now > new Date(entry.expiresAt)) {
        const size = entry.metadata.fileSize;
        this.cache.delete(id);
        entriesRemoved++;
        spaceFreed += size;
      }
    }
    
    if (entriesRemoved > 0) {
      actions.push(`Removed ${entriesRemoved} expired entries`);
    }
    
    // Remove rarely accessed entries if cache is too large
    const totalSize = this.calculateTotalCacheSize();
    const maxSizeBytes = this.config.documentCache.maxSizeGB * 1024 * 1024 * 1024;
    
    if (totalSize > maxSizeBytes) {
      const rareEntries = entries
        .filter(([, entry]) => entry.accessHistory.accessPattern === 'rare')
        .sort((a, b) => new Date(a[1].accessHistory.lastAccessed).getTime() - new Date(b[1].accessHistory.lastAccessed).getTime());
      
      const targetReduction = totalSize - maxSizeBytes;
      let currentReduction = 0;
      
      for (const [id, entry] of rareEntries) {
        if (currentReduction >= targetReduction) break;
        
        const size = entry.metadata.fileSize;
        this.cache.delete(id);
        entriesRemoved++;
        spaceFreed += size;
        currentReduction += size;
      }
      
      actions.push(`Removed ${rareEntries.length} rarely accessed entries to free space`);
    }
    
    // Compress uncompressed entries
    let compressionCount = 0;
    for (const [id, entry] of this.cache.entries()) {
      if (!entry.compressionInfo && entry.metadata.fileSize > 10000) {
        const compressed = await this.compressContent(entry.content);
        entry.content = compressed.content;
        entry.compressionInfo = compressed.info;
        compressionCount++;
      }
    }
    
    if (compressionCount > 0) {
      actions.push(`Compressed ${compressionCount} entries`);
    }
    
    console.log(`[Enhanced Document Cache] Optimization complete: ${entriesRemoved} entries removed, ${(spaceFreed / 1024 / 1024).toFixed(2)}MB freed`);
    
    return {
      entriesRemoved,
      spaceFreedGB: spaceFreed / 1024 / 1024 / 1024,
      optimizationActions: actions
    };
  }
  
  private static async compressContent(content: string): Promise<{
    content: string;
    info: NonNullable<EnhancedDocumentCacheEntry['compressionInfo']>;
  }> {
    // Simulate compression (in real implementation, would use actual compression library)
    const originalSize = content.length;
    const compressedContent = btoa(content); // Base64 as placeholder for actual compression
    const compressedSize = compressedContent.length;
    
    return {
      content: compressedContent,
      info: {
        originalSize,
        compressedSize,
        algorithm: 'gzip' // Would be actual algorithm
      }
    };
  }
  
  private static async decompressContent(compressedContent: string, algorithm: string): Promise<string> {
    // Simulate decompression
    return atob(compressedContent); // Reverse of base64 placeholder
  }
  
  private static determineAccessPattern(accessCount: number): 'frequent' | 'occasional' | 'rare' {
    if (accessCount >= 10) return 'frequent';
    if (accessCount >= 3) return 'occasional';
    return 'rare';
  }
  
  private static calculateTotalCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.metadata.fileSize;
    }
    return totalSize;
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStatistics(): {
    totalEntries: number;
    totalSizeGB: number;
    compressionRatio: number;
    accessPatterns: Record<string, number>;
    oldestEntry: string;
    newestEntry: string;
  } {
    
    const entries = Array.from(this.cache.values());
    const totalSize = this.calculateTotalCacheSize();
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    const accessPatterns = { frequent: 0, occasional: 0, rare: 0 };
    
    let oldestTimestamp = new Date().toISOString();
    let newestTimestamp = '1970-01-01T00:00:00.000Z';
    
    for (const entry of entries) {
      if (entry.compressionInfo) {
        totalOriginalSize += entry.compressionInfo.originalSize;
        totalCompressedSize += entry.compressionInfo.compressedSize;
      }
      
      accessPatterns[entry.accessHistory.accessPattern]++;
      
      if (entry.cacheTimestamp < oldestTimestamp) {
        oldestTimestamp = entry.cacheTimestamp;
      }
      if (entry.cacheTimestamp > newestTimestamp) {
        newestTimestamp = entry.cacheTimestamp;
      }
    }
    
    const compressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;
    
    return {
      totalEntries: entries.length,
      totalSizeGB: totalSize / 1024 / 1024 / 1024,
      compressionRatio,
      accessPatterns,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }
}

// ===== ENHANCED EVIDENCE CACHE =====

export interface EnhancedEvidenceEntry extends ConfirmedEvidenceEntry {
  channelIsolation: {
    isolatedChannels: string[];
    crossChannelDependencies: Record<string, string[]>;
  };
  performanceMetrics: {
    calculationTimeMs: number;
    dataQualityScore: number;
    validationLatencyMs: number;
  };
  supersessionHistory: Array<{
    supersededId: string;
    supersessionReason: string;
    supersessionTimestamp: string;
  }>;
  refreshSchedule?: {
    nextRefreshAt: string;
    refreshIntervalHours: number;
    backgroundRefreshEnabled: boolean;
  };
}

export class V34EnhancedEvidenceCache {
  private static cache = new Map<string, EnhancedEvidenceEntry>();
  private static config: CacheConfiguration = DEFAULT_CACHE_CONFIG;
  
  /**
   * Store enhanced evidence with channel isolation and performance tracking
   */
  static storeEnhancedEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel'],
    evidenceData: V34ChannelData[],
    sufficiencyLevel: EvidenceSufficiency,
    validationScore: number,
    sourceDocuments: string[],
    metadata: ConfirmedEvidenceEntry['metadata'],
    options: {
      isolateChannel?: boolean;
      enableBackgroundRefresh?: boolean;
      customTTLHours?: number;
      supersessionReason?: string;
    } = {}
  ): string {
    
    const startTime = Date.now();
    const cacheId = `${ticker}_${channel}_enhanced_${Date.now()}`;
    
    console.log(`[Enhanced Evidence Cache] Storing enhanced ${channel} evidence for ${ticker}`);
    
    // Handle supersession with enhanced tracking
    const supersessionHistory: EnhancedEvidenceEntry['supersessionHistory'] = [];
    const existingEntries = this.getTickerChannelEvidence(ticker, channel);
    
    for (const existing of existingEntries) {
      if (!existing.supersededBy) {
        existing.supersededBy = cacheId;
        supersessionHistory.push({
          supersededId: existing.cacheId,
          supersessionReason: options.supersessionReason || 'New evidence available',
          supersessionTimestamp: new Date().toISOString()
        });
        CacheMetricsCollector.recordSupersession();
        console.log(`[Enhanced Evidence Cache] Superseded ${existing.cacheId} (${options.supersessionReason || 'New evidence'})`);
      }
    }
    
    const now = new Date();
    const ttlHours = options.customTTLHours || this.config.evidenceCache.defaultTTLDays * 24;
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    
    // Channel isolation setup
    const channelIsolation = {
      isolatedChannels: options.isolateChannel ? [channel] : [],
      crossChannelDependencies: this.analyzeCrossChannelDependencies(evidenceData, ticker)
    };
    
    // Performance metrics
    const calculationTime = Date.now() - startTime;
    const performanceMetrics = {
      calculationTimeMs: calculationTime,
      dataQualityScore: this.calculateDataQualityScore(evidenceData),
      validationLatencyMs: 0 // Will be updated during validation
    };
    
    // Refresh schedule
    const refreshSchedule = options.enableBackgroundRefresh ? {
      nextRefreshAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      refreshIntervalHours: 24,
      backgroundRefreshEnabled: true
    } : undefined;
    
    const entry: EnhancedEvidenceEntry = {
      cacheId,
      ticker,
      channel,
      evidenceData,
      sufficiencyLevel,
      validationScore,
      sourceDocuments,
      confirmationTimestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata,
      channelIsolation,
      performanceMetrics,
      supersessionHistory,
      refreshSchedule
    };
    
    this.cache.set(cacheId, entry);
    
    // Update metrics
    CacheMetricsCollector.recordEvidenceCacheHit(channel, validationScore);
    
    console.log(`[Enhanced Evidence Cache] Stored ${cacheId} with ${evidenceData.length} evidence points (${calculationTime}ms)`);
    
    return cacheId;
  }
  
  /**
   * Get enhanced evidence with validation and freshness checks
   */
  static getEnhancedEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel'],
    options: {
      requireFresh?: boolean;
      maxAgeHours?: number;
      validateOnRetrieval?: boolean;
    } = {}
  ): EnhancedEvidenceEntry | null {
    
    const startTime = Date.now();
    const entries = this.getTickerChannelEvidence(ticker, channel);
    const activeEntries = entries.filter(e => !e.supersededBy && new Date() <= new Date(e.expiresAt));
    
    if (activeEntries.length === 0) {
      return null;
    }
    
    // Get most recent entry
    const latestEntry = activeEntries.sort((a, b) => 
      new Date(b.confirmationTimestamp).getTime() - new Date(a.confirmationTimestamp).getTime()
    )[0];
    
    // Check freshness requirements
    if (options.requireFresh || options.maxAgeHours) {
      const ageHours = (Date.now() - new Date(latestEntry.confirmationTimestamp).getTime()) / (1000 * 60 * 60);
      const maxAge = options.maxAgeHours || 24;
      
      if (ageHours > maxAge) {
        console.log(`[Enhanced Evidence Cache] Evidence too stale: ${ageHours.toFixed(1)}h > ${maxAge}h`);
        return null;
      }
    }
    
    // Validation on retrieval
    if (options.validateOnRetrieval) {
      const validationStart = Date.now();
      const isValid = this.validateEvidenceEntry(latestEntry);
      latestEntry.performanceMetrics.validationLatencyMs = Date.now() - validationStart;
      
      if (!isValid) {
        console.log(`[Enhanced Evidence Cache] Evidence validation failed for ${latestEntry.cacheId}`);
        return null;
      }
    }
    
    const retrievalTime = Date.now() - startTime;
    CacheMetricsCollector.recordEvidenceCacheHit(channel, latestEntry.validationScore);
    
    console.log(`[Enhanced Evidence Cache] Retrieved ${latestEntry.cacheId} in ${retrievalTime}ms`);
    
    return latestEntry;
  }
  
  /**
   * Background refresh system
   */
  static async performBackgroundRefresh(): Promise<{
    entriesRefreshed: number;
    errors: string[];
    totalTimeMs: number;
  }> {
    
    const startTime = Date.now();
    console.log(`[Enhanced Evidence Cache] Starting background refresh...`);
    
    const errors: string[] = [];
    let entriesRefreshed = 0;
    
    const now = new Date();
    const refreshCandidates = Array.from(this.cache.values())
      .filter(entry => 
        entry.refreshSchedule?.backgroundRefreshEnabled &&
        entry.refreshSchedule.nextRefreshAt &&
        now >= new Date(entry.refreshSchedule.nextRefreshAt)
      );
    
    console.log(`[Enhanced Evidence Cache] Found ${refreshCandidates.length} entries for background refresh`);
    
    for (const entry of refreshCandidates) {
      try {
        // Simulate refresh process (would trigger actual data refresh)
        console.log(`[Enhanced Evidence Cache] Refreshing ${entry.cacheId}...`);
        
        // Update next refresh time
        if (entry.refreshSchedule) {
          entry.refreshSchedule.nextRefreshAt = new Date(
            now.getTime() + entry.refreshSchedule.refreshIntervalHours * 60 * 60 * 1000
          ).toISOString();
        }
        
        entriesRefreshed++;
        
      } catch (error) {
        errors.push(`Failed to refresh ${entry.cacheId}: ${error}`);
        console.error(`[Enhanced Evidence Cache] Refresh error for ${entry.cacheId}:`, error);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[Enhanced Evidence Cache] Background refresh complete: ${entriesRefreshed} refreshed, ${errors.length} errors, ${totalTime}ms`);
    
    return {
      entriesRefreshed,
      errors,
      totalTimeMs: totalTime
    };
  }
  
  /**
   * Cache analytics and monitoring
   */
  static generateCacheAnalytics(): {
    channelDistribution: Record<string, number>;
    sufficiencyBreakdown: Record<string, number>;
    averageValidationScore: number;
    supersessionRate: number;
    backgroundRefreshStats: {
      enabled: number;
      pending: number;
      overdue: number;
    };
    performanceMetrics: {
      averageCalculationTime: number;
      averageDataQuality: number;
      averageValidationLatency: number;
    };
  } {
    
    const entries = Array.from(this.cache.values());
    const channelDistribution: Record<string, number> = {};
    const sufficiencyBreakdown: Record<string, number> = {};
    
    let totalValidationScore = 0;
    let totalSupersessions = 0;
    let totalCalculationTime = 0;
    let totalDataQuality = 0;
    let totalValidationLatency = 0;
    
    const refreshStats = { enabled: 0, pending: 0, overdue: 0 };
    const now = new Date();
    
    for (const entry of entries) {
      // Channel distribution
      channelDistribution[entry.channel] = (channelDistribution[entry.channel] || 0) + 1;
      
      // Sufficiency breakdown
      sufficiencyBreakdown[entry.sufficiencyLevel] = (sufficiencyBreakdown[entry.sufficiencyLevel] || 0) + 1;
      
      // Validation scores
      totalValidationScore += entry.validationScore;
      
      // Supersession tracking
      totalSupersessions += entry.supersessionHistory.length;
      
      // Performance metrics
      totalCalculationTime += entry.performanceMetrics.calculationTimeMs;
      totalDataQuality += entry.performanceMetrics.dataQualityScore;
      totalValidationLatency += entry.performanceMetrics.validationLatencyMs;
      
      // Refresh stats
      if (entry.refreshSchedule?.backgroundRefreshEnabled) {
        refreshStats.enabled++;
        
        if (entry.refreshSchedule.nextRefreshAt) {
          const nextRefresh = new Date(entry.refreshSchedule.nextRefreshAt);
          if (nextRefresh <= now) {
            refreshStats.overdue++;
          } else {
            refreshStats.pending++;
          }
        }
      }
    }
    
    const entryCount = entries.length || 1; // Avoid division by zero
    
    return {
      channelDistribution,
      sufficiencyBreakdown,
      averageValidationScore: totalValidationScore / entryCount,
      supersessionRate: totalSupersessions / entryCount,
      backgroundRefreshStats: refreshStats,
      performanceMetrics: {
        averageCalculationTime: totalCalculationTime / entryCount,
        averageDataQuality: totalDataQuality / entryCount,
        averageValidationLatency: totalValidationLatency / entryCount
      }
    };
  }
  
  private static getTickerChannelEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel']
  ): EnhancedEvidenceEntry[] {
    
    const entries: EnhancedEvidenceEntry[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.ticker === ticker && entry.channel === channel) {
        entries.push(entry);
      }
    }
    
    return entries;
  }
  
  private static analyzeCrossChannelDependencies(
    evidenceData: V34ChannelData[],
    ticker: string
  ): Record<string, string[]> {
    
    // Analyze dependencies between channels (simplified implementation)
    const dependencies: Record<string, string[]> = {};
    
    for (const data of evidenceData) {
      if (data.source.includes('Exhibit 21')) {
        // Exhibit 21 affects both assets and operations channels
        dependencies[data.country] = ['assets', 'operations'];
      } else if (data.source.includes('Revenue')) {
        // Revenue data might correlate with supply chain
        dependencies[data.country] = ['supply'];
      }
    }
    
    return dependencies;
  }
  
  private static calculateDataQualityScore(evidenceData: V34ChannelData[]): number {
    if (evidenceData.length === 0) return 0;
    
    const totalConfidence = evidenceData.reduce((sum, data) => sum + data.confidence, 0);
    return totalConfidence / evidenceData.length;
  }
  
  private static validateEvidenceEntry(entry: EnhancedEvidenceEntry): boolean {
    // Validate evidence entry integrity
    
    // Check data consistency
    const totalWeight = entry.evidenceData.reduce((sum, data) => sum + data.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return false; // Weights should sum to 1
    }
    
    // Check confidence scores
    const invalidConfidence = entry.evidenceData.some(data => data.confidence < 0 || data.confidence > 1);
    if (invalidConfidence) {
      return false;
    }
    
    // Check expiration
    if (new Date() > new Date(entry.expiresAt)) {
      return false;
    }
    
    return true;
  }
}

export default {
  V34EnhancedDocumentCache,
  V34EnhancedEvidenceCache,
  CacheMetricsCollector,
  DEFAULT_CACHE_CONFIG
};