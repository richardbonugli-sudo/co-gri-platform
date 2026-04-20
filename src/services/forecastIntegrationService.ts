/**
 * Phase 5D-2: Forecast Integration Service
 * 
 * Handles loading, caching, and managing geopolitical forecast data
 * from Cedar Owl and other sources.
 */

import type {
  GeopoliticalForecast,
  ForecastMetadata,
  ForecastValidationResult,
  ForecastDataQuality,
  ForecastCacheEntry,
  ForecastUpdateNotification
} from '@/types/forecast.types';

import {
  validateForecast,
  assessForecastDataQuality,
  isForecastStale,
  getForecastAge
} from '@/utils/forecastValidation';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ForecastServiceConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  dataSource: 'Cedar Owl' | 'Internal' | 'Hybrid';
  validationRequired: boolean;
  minQualityScore: number; // 0-1
}

const DEFAULT_CONFIG: ForecastServiceConfig = {
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  autoRefresh: true,
  refreshInterval: 86400000, // 24 hours
  dataSource: 'Cedar Owl',
  validationRequired: true,
  minQualityScore: 0.7
};

// ============================================================================
// FORECAST INTEGRATION SERVICE
// ============================================================================

export class ForecastIntegrationService {
  private config: ForecastServiceConfig;
  private cache: Map<string, ForecastCacheEntry>;
  private currentForecast: GeopoliticalForecast | null;
  private lastUpdate: Date | null;
  private refreshTimer: NodeJS.Timeout | null;
  private updateCallbacks: Set<(notification: ForecastUpdateNotification) => void>;

  constructor(config: Partial<ForecastServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.currentForecast = null;
    this.lastUpdate = null;
    this.refreshTimer = null;
    this.updateCallbacks = new Set();

    console.log('[Forecast Service] Initialized with config:', this.config);
  }

  // ==========================================================================
  // FORECAST LOADING
  // ==========================================================================

  /**
   * Load forecast data from source
   */
  async loadForecast(forecastId?: string): Promise<GeopoliticalForecast> {
    console.log('[Forecast Service] Loading forecast:', forecastId || 'latest');

    try {
      // Check cache first
      if (this.config.cacheEnabled && !forecastId) {
        const cached = this.getCachedForecast();
        if (cached) {
          console.log('[Forecast Service] Returning cached forecast');
          return cached;
        }
      }

      // Load from source
      const forecast = await this.fetchForecastFromSource(forecastId);

      // Validate if required
      if (this.config.validationRequired) {
        const validation = await this.validateAndAssess(forecast);
        if (!validation.valid) {
          throw new Error(
            `Forecast validation failed: ${validation.errors.join(', ')}`
          );
        }
      }

      // Update current forecast
      this.currentForecast = forecast;
      this.lastUpdate = new Date();

      // Cache the forecast
      if (this.config.cacheEnabled) {
        this.cacheForecast(forecast);
      }

      // Notify subscribers
      this.notifyUpdate({
        notificationId: `update_${Date.now()}`,
        type: 'NEW_FORECAST',
        message: `New forecast loaded: ${forecast.metadata.forecastId}`,
        affectedCompanies: [],
        severity: 'INFO',
        timestamp: new Date().toISOString(),
        actionRequired: false
      });

      console.log('[Forecast Service] Forecast loaded successfully');
      return forecast;

    } catch (error) {
      console.error('[Forecast Service] Failed to load forecast:', error);
      throw error;
    }
  }

  /**
   * Fetch forecast from data source
   */
  private async fetchForecastFromSource(
    forecastId?: string
  ): Promise<GeopoliticalForecast> {
    console.log('[Forecast Service] Fetching from source:', this.config.dataSource);

    switch (this.config.dataSource) {
      case 'Cedar Owl':
        return this.fetchFromCedarOwl(forecastId);
      
      case 'Internal':
        return this.fetchFromInternal(forecastId);
      
      case 'Hybrid':
        return this.fetchHybrid(forecastId);
      
      default:
        throw new Error(`Unknown data source: ${this.config.dataSource}`);
    }
  }

  /**
   * Fetch from Cedar Owl API
   */
  private async fetchFromCedarOwl(
    forecastId?: string
  ): Promise<GeopoliticalForecast> {
    // In production, this would call the actual Cedar Owl API
    // For now, we'll import the static forecast data
    
    try {
      const { CEDAROWL_FORECAST_2026 } = await import('@/data/cedarOwlForecast2026');
      
      if (forecastId && CEDAROWL_FORECAST_2026.metadata.forecastId !== forecastId) {
        throw new Error(`Forecast ${forecastId} not found`);
      }

      console.log('[Forecast Service] Cedar Owl forecast loaded');
      return CEDAROWL_FORECAST_2026;

    } catch (error) {
      console.error('[Forecast Service] Cedar Owl fetch failed:', error);
      throw new Error('Failed to fetch Cedar Owl forecast');
    }
  }

  /**
   * Fetch from internal source
   */
  private async fetchFromInternal(
    forecastId?: string
  ): Promise<GeopoliticalForecast> {
    // Placeholder for internal forecast source
    throw new Error('Internal forecast source not yet implemented');
  }

  /**
   * Fetch hybrid (combine multiple sources)
   */
  private async fetchHybrid(
    forecastId?: string
  ): Promise<GeopoliticalForecast> {
    // Placeholder for hybrid approach
    throw new Error('Hybrid forecast source not yet implemented');
  }

  // ==========================================================================
  // VALIDATION & QUALITY ASSESSMENT
  // ==========================================================================

  /**
   * Validate and assess forecast quality
   */
  private async validateAndAssess(
    forecast: GeopoliticalForecast
  ): Promise<{ valid: boolean; errors: string[]; quality: ForecastDataQuality }> {
    console.log('[Forecast Service] Validating forecast');

    // Validate structure and data
    const validation = validateForecast(forecast);

    // Assess data quality
    const quality = assessForecastDataQuality(forecast);

    // Check quality threshold
    if (quality.overall < this.config.minQualityScore) {
      validation.errors.push(
        `Quality score ${quality.overall.toFixed(2)} below minimum ${this.config.minQualityScore}`
      );
    }

    // Log validation results
    if (!validation.valid) {
      console.error('[Forecast Service] Validation failed:', validation.errors);
    } else if (validation.warnings.length > 0) {
      console.warn('[Forecast Service] Validation warnings:', validation.warnings);
    }

    console.log('[Forecast Service] Quality assessment:', {
      overall: quality.overall.toFixed(2),
      completeness: quality.completeness.toFixed(2),
      consistency: quality.consistency.toFixed(2),
      timeliness: quality.timeliness.toFixed(2)
    });

    return {
      valid: validation.valid,
      errors: validation.errors,
      quality
    };
  }

  // ==========================================================================
  // CACHING
  // ==========================================================================

  /**
   * Cache forecast data
   */
  private cacheForecast(forecast: GeopoliticalForecast): void {
    const key = forecast.metadata.forecastId;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.cacheTTL);

    const entry: ForecastCacheEntry = {
      key,
      data: forecast as any, // Type assertion for cache compatibility
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0
    };

    this.cache.set(key, entry);
    console.log('[Forecast Service] Forecast cached:', key);
  }

  /**
   * Get cached forecast if valid
   */
  private getCachedForecast(): GeopoliticalForecast | null {
    if (!this.currentForecast) return null;

    const key = this.currentForecast.metadata.forecastId;
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(entry.expiresAt);

    if (now > expiresAt) {
      console.log('[Forecast Service] Cache expired');
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    console.log('[Forecast Service] Cache hit:', key, `(${entry.hitCount} hits)`);

    return this.currentForecast;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[Forecast Service] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; hitCount: number; age: number }>;
  } {
    const entries = Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      hitCount: entry.hitCount,
      age: Date.now() - new Date(entry.cachedAt).getTime()
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  // ==========================================================================
  // AUTO-REFRESH
  // ==========================================================================

  /**
   * Start auto-refresh
   */
  startAutoRefresh(): void {
    if (!this.config.autoRefresh) {
      console.log('[Forecast Service] Auto-refresh disabled');
      return;
    }

    if (this.refreshTimer) {
      console.log('[Forecast Service] Auto-refresh already running');
      return;
    }

    console.log(
      '[Forecast Service] Starting auto-refresh:',
      `${this.config.refreshInterval / 1000}s interval`
    );

    this.refreshTimer = setInterval(() => {
      this.refreshForecast().catch(error => {
        console.error('[Forecast Service] Auto-refresh failed:', error);
      });
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[Forecast Service] Auto-refresh stopped');
    }
  }

  /**
   * Manually refresh forecast
   */
  async refreshForecast(): Promise<GeopoliticalForecast> {
    console.log('[Forecast Service] Refreshing forecast');

    // Clear cache to force reload
    this.clearCache();

    // Load fresh forecast
    return this.loadForecast();
  }

  // ==========================================================================
  // FORECAST ACCESS
  // ==========================================================================

  /**
   * Get current forecast
   */
  getCurrentForecast(): GeopoliticalForecast | null {
    return this.currentForecast;
  }

  /**
   * Get forecast metadata
   */
  getForecastMetadata(): ForecastMetadata | null {
    return this.currentForecast?.metadata || null;
  }

  /**
   * Check if forecast is available
   */
  hasForecast(): boolean {
    return this.currentForecast !== null;
  }

  /**
   * Check if forecast is stale
   */
  isForecastStale(): boolean {
    if (!this.currentForecast) return true;
    return isForecastStale(this.currentForecast);
  }

  /**
   * Get forecast age in days
   */
  getForecastAge(): number | null {
    if (!this.currentForecast) return null;
    return getForecastAge(this.currentForecast);
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================

  /**
   * Subscribe to forecast updates
   */
  onUpdate(callback: (notification: ForecastUpdateNotification) => void): void {
    this.updateCallbacks.add(callback);
    console.log('[Forecast Service] Update subscriber added');
  }

  /**
   * Unsubscribe from forecast updates
   */
  offUpdate(callback: (notification: ForecastUpdateNotification) => void): void {
    this.updateCallbacks.delete(callback);
    console.log('[Forecast Service] Update subscriber removed');
  }

  /**
   * Notify subscribers of update
   */
  private notifyUpdate(notification: ForecastUpdateNotification): void {
    console.log('[Forecast Service] Notifying subscribers:', notification.type);
    this.updateCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[Forecast Service] Notification callback error:', error);
      }
    });
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<ForecastServiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Forecast Service] Configuration updated:', config);

    // Restart auto-refresh if interval changed
    if (config.refreshInterval !== undefined && this.refreshTimer) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ForecastServiceConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    console.log('[Forecast Service] Initializing...');

    try {
      // Load initial forecast
      await this.loadForecast();

      // Start auto-refresh
      this.startAutoRefresh();

      console.log('[Forecast Service] Initialization complete');

    } catch (error) {
      console.error('[Forecast Service] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    console.log('[Forecast Service] Shutting down...');

    // Stop auto-refresh
    this.stopAutoRefresh();

    // Clear cache
    this.clearCache();

    // Clear subscribers
    this.updateCallbacks.clear();

    // Reset state
    this.currentForecast = null;
    this.lastUpdate = null;

    console.log('[Forecast Service] Shutdown complete');
  }

  // ==========================================================================
  // DIAGNOSTICS
  // ==========================================================================

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    hasForecast: boolean;
    forecastAge: number | null;
    isStale: boolean;
    lastUpdate: Date | null;
    cacheSize: number;
    autoRefreshActive: boolean;
    subscriberCount: number;
  } {
    return {
      initialized: this.currentForecast !== null,
      hasForecast: this.hasForecast(),
      forecastAge: this.getForecastAge(),
      isStale: this.isForecastStale(),
      lastUpdate: this.lastUpdate,
      cacheSize: this.cache.size,
      autoRefreshActive: this.refreshTimer !== null,
      subscriberCount: this.updateCallbacks.size
    };
  }

  /**
   * Get detailed diagnostics
   */
  getDiagnostics(): {
    status: ReturnType<typeof this.getStatus>;
    config: ForecastServiceConfig;
    cache: ReturnType<typeof this.getCacheStats>;
    forecast: {
      id: string | null;
      version: string | null;
      dataSource: string | null;
      confidence: number | null;
    };
  } {
    const metadata = this.getForecastMetadata();

    return {
      status: this.getStatus(),
      config: this.getConfig(),
      cache: this.getCacheStats(),
      forecast: {
        id: metadata?.forecastId || null,
        version: metadata?.version || null,
        dataSource: metadata?.dataSource || null,
        confidence: metadata?.overallConfidence || null
      }
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let serviceInstance: ForecastIntegrationService | null = null;

/**
 * Get singleton instance
 */
export function getForecastService(): ForecastIntegrationService {
  if (!serviceInstance) {
    serviceInstance = new ForecastIntegrationService();
  }
  return serviceInstance;
}

/**
 * Initialize forecast service
 */
export async function initializeForecastService(
  config?: Partial<ForecastServiceConfig>
): Promise<ForecastIntegrationService> {
  const service = getForecastService();
  
  if (config) {
    service.updateConfig(config);
  }
  
  await service.initialize();
  return service;
}

/**
 * Shutdown forecast service
 */
export function shutdownForecastService(): void {
  if (serviceInstance) {
    serviceInstance.shutdown();
    serviceInstance = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick access to current forecast
 */
export function getCurrentForecast(): GeopoliticalForecast | null {
  return getForecastService().getCurrentForecast();
}

/**
 * Quick access to forecast metadata
 */
export function getForecastMetadata(): ForecastMetadata | null {
  return getForecastService().getForecastMetadata();
}

/**
 * Check if forecast is available
 */
export function hasForecast(): boolean {
  return getForecastService().hasForecast();
}

/**
 * Refresh forecast data
 */
export async function refreshForecast(): Promise<GeopoliticalForecast> {
  return getForecastService().refreshForecast();
}