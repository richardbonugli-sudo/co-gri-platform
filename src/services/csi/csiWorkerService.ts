/**
 * CSI Worker Service
 * 
 * Manages the Web Worker for CSI calculations and integrates with the cache.
 * Provides a clean API for components to request calculations.
 */

import { csiCache, CSIDataPoint, CacheKeyParams } from './csiCache';
import { ExtendedTimeWindow, getTimeWindowDays } from '@/data/geopoliticalEvents';
import { GEOPOLITICAL_EVENTS } from '@/data/geopoliticalEvents';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { 
  HISTORICAL_GEOPOLITICAL_EVENTS,
  getHistoricalEventsByTimeWindow 
} from '@/data/historicalGeopoliticalEvents';
import type { 
  WorkerRequest, 
  WorkerResponse, 
  CSITimeSeriesResult,
  CSIStatisticsResult,
  WorkerEvent,
  WorkerCountry
} from '@/workers/csiCalculationWorker';

// Callback types
type ProgressCallback = (progress: number) => void;
type ResultCallback<T> = (result: T, calculationTime: number, fromCache: boolean) => void;
type ErrorCallback = (error: string) => void;

// Request tracking
interface PendingRequest<T> {
  id: string;
  onProgress?: ProgressCallback;
  onResult: ResultCallback<T>;
  onError: ErrorCallback;
  startTime: number;
}

// Performance targets (in milliseconds)
const PERFORMANCE_TARGETS = {
  '3Y': 5000,
  '5Y': 10000,
  '10Y': 20000,
  'cached': 100
};

class CSIWorkerService {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, PendingRequest<CSITimeSeriesResult | CSIStatisticsResult>> = new Map();
  private requestCounter = 0;
  private isWorkerSupported = typeof Worker !== 'undefined';
  private workerInitialized = false;

  constructor() {
    this.initWorker();
  }

  /**
   * Initialize the Web Worker
   */
  private initWorker(): void {
    if (!this.isWorkerSupported) {
      console.warn('[CSI Worker] Web Workers not supported, using main thread');
      return;
    }

    try {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL('@/workers/csiCalculationWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // Send initial data to worker
      this.sendDataToWorker();
      this.workerInitialized = true;
      
      console.log('[CSI Worker] Worker initialized successfully');
    } catch (error) {
      console.error('[CSI Worker] Failed to initialize worker:', error);
      this.worker = null;
    }
  }

  /**
   * Send event and country data to the worker
   */
  private sendDataToWorker(): void {
    if (!this.worker) return;

    // Prepare events for worker (convert Date to timestamp)
    const historicalEvents = getHistoricalEventsByTimeWindow('10Y');
    const allEvents = [...GEOPOLITICAL_EVENTS, ...historicalEvents];
    
    const workerEvents: WorkerEvent[] = allEvents.map(event => ({
      id: event.id,
      date: event.date.getTime(),
      country: event.country,
      relatedCountries: event.relatedCountries || [],
      deltaCSI: event.deltaCSI,
      severity: event.severity,
      isOngoing: event.isOngoing || false
    }));

    // Prepare countries for worker
    const workerCountries: WorkerCountry[] = GLOBAL_COUNTRIES.map(c => ({
      country: c.country,
      csi: c.csi
    }));

    // Send data with a dummy request to initialize
    this.worker.postMessage({
      type: 'CALCULATE_STATISTICS',
      id: 'init',
      params: { timeWindow: '7D' },
      events: workerEvents,
      countries: workerCountries
    });
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(e: MessageEvent<WorkerResponse>): void {
    const { type, id, progress, data, error, calculationTime } = e.data;

    // Skip init response
    if (id === 'init') return;

    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn(`[CSI Worker] Received response for unknown request: ${id}`);
      return;
    }

    switch (type) {
      case 'PROGRESS':
        if (request.onProgress && progress !== undefined) {
          request.onProgress(progress);
        }
        break;

      case 'RESULT':
        if (data && calculationTime !== undefined) {
          const totalTime = performance.now() - request.startTime;
          console.log(`[CSI Worker] Calculation completed in ${calculationTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
          request.onResult(data, calculationTime, false);
        }
        this.pendingRequests.delete(id);
        break;

      case 'ERROR':
        request.onError(error || 'Unknown error');
        this.pendingRequests.delete(id);
        break;

      case 'CANCELLED':
        console.log(`[CSI Worker] Request ${id} was cancelled`);
        this.pendingRequests.delete(id);
        break;
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('[CSI Worker] Worker error:', error);
    
    // Notify all pending requests of the error
    for (const [id, request] of this.pendingRequests.entries()) {
      request.onError(`Worker error: ${error.message}`);
    }
    this.pendingRequests.clear();

    // Try to reinitialize the worker
    this.worker?.terminate();
    this.worker = null;
    this.workerInitialized = false;
    
    setTimeout(() => {
      console.log('[CSI Worker] Attempting to reinitialize worker...');
      this.initWorker();
    }, 1000);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestCounter}`;
  }

  /**
   * Calculate CSI time series with caching and worker
   */
  async calculateTimeSeries(
    timeWindow: ExtendedTimeWindow,
    country?: string,
    options?: {
      dataPoints?: number;
      onProgress?: ProgressCallback;
      forceRecalculate?: boolean;
    }
  ): Promise<{
    data: CSIDataPoint[];
    fromCache: boolean;
    calculationTime: number;
  }> {
    const startTime = performance.now();
    const dataPoints = options?.dataPoints || 100;

    // Check cache first (unless force recalculate)
    if (!options?.forceRecalculate) {
      const cacheParams: CacheKeyParams = {
        timeWindow,
        country
      };

      const cachedData = await csiCache.get(cacheParams);
      if (cachedData) {
        const cacheTime = performance.now() - startTime;
        console.log(`[CSI Worker] Using cached data (${cacheTime.toFixed(2)}ms)`);
        return {
          data: cachedData,
          fromCache: true,
          calculationTime: cacheTime
        };
      }
    }

    // Calculate using worker or main thread
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();

      const handleResult = async (
        result: CSITimeSeriesResult | CSIStatisticsResult,
        calcTime: number,
        fromCache: boolean
      ) => {
        if ('timeSeries' in result) {
          // Convert to CSIDataPoint format
          const data: CSIDataPoint[] = result.timeSeries.map(point => ({
            date: point.date,
            globalCSI: point.globalCSI,
            countryCSI: point.countryCSI,
            countryName: country
          }));

          // Cache the result
          const cacheParams: CacheKeyParams = {
            timeWindow,
            country
          };
          await csiCache.set(cacheParams, data, calcTime);

          // Log performance
          this.logPerformance(timeWindow, calcTime);

          resolve({
            data,
            fromCache: false,
            calculationTime: calcTime
          });
        }
      };

      const handleError = (error: string) => {
        console.error(`[CSI Worker] Calculation error: ${error}`);
        reject(new Error(error));
      };

      // Use worker if available
      if (this.worker && this.workerInitialized) {
        this.pendingRequests.set(requestId, {
          id: requestId,
          onProgress: options?.onProgress,
          onResult: handleResult,
          onError: handleError,
          startTime
        });

        this.worker.postMessage({
          type: 'CALCULATE_TIME_SERIES',
          id: requestId,
          params: {
            timeWindow,
            country,
            dataPoints
          }
        } as WorkerRequest);
      } else {
        // Fallback to main thread calculation
        console.warn('[CSI Worker] Using main thread fallback');
        this.calculateOnMainThread(timeWindow, country, dataPoints, options?.onProgress)
          .then(result => handleResult(result, performance.now() - startTime, false))
          .catch(handleError);
      }
    });
  }

  /**
   * Fallback calculation on main thread
   */
  private async calculateOnMainThread(
    timeWindow: ExtendedTimeWindow,
    country?: string,
    dataPoints: number = 100,
    onProgress?: ProgressCallback
  ): Promise<CSITimeSeriesResult> {
    // Import compositeCalculator dynamically to avoid circular dependencies
    const { compositeCalculator } = await import('./compositeCalculator');

    const now = new Date();
    const days = getTimeWindowDays(timeWindow);
    const intervalMs = (days * 24 * 60 * 60 * 1000) / dataPoints;
    const startTimestamp = now.getTime() - (days * 24 * 60 * 60 * 1000);

    const timeSeries: Array<{ date: string; globalCSI: number; countryCSI?: number }> = [];

    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTimestamp + (i * intervalMs);
      const date = new Date(timestamp);

      const globalCSI = compositeCalculator.calculateGlobalCSIAtDate(date);
      
      const point: { date: string; globalCSI: number; countryCSI?: number } = {
        date: date.toISOString(),
        globalCSI
      };

      if (country) {
        point.countryCSI = compositeCalculator.getCSIAtDate(country, date);
      }

      timeSeries.push(point);

      // Report progress
      if (onProgress && (i % 5 === 0 || i === dataPoints)) {
        onProgress(Math.round((i / dataPoints) * 100));
        // Yield to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return {
      timeSeries,
      metadata: {
        timeWindow,
        country,
        dataPoints,
        startDate: new Date(startTimestamp).toISOString(),
        endDate: now.toISOString()
      }
    };
  }

  /**
   * Cancel an ongoing calculation
   */
  cancelCalculation(requestId: string): void {
    if (this.worker && this.pendingRequests.has(requestId)) {
      this.worker.postMessage({
        type: 'CANCEL',
        id: requestId
      } as WorkerRequest);
    }
  }

  /**
   * Cancel all ongoing calculations
   */
  cancelAllCalculations(): void {
    for (const id of this.pendingRequests.keys()) {
      this.cancelCalculation(id);
    }
  }

  /**
   * Log performance metrics
   */
  private logPerformance(timeWindow: ExtendedTimeWindow, calculationTime: number): void {
    const target = PERFORMANCE_TARGETS[timeWindow as keyof typeof PERFORMANCE_TARGETS];
    const status = target && calculationTime <= target ? '✓' : '⚠';
    
    console.log(
      `[CSI Worker] Performance ${status}: ${timeWindow} calculated in ${calculationTime.toFixed(2)}ms` +
      (target ? ` (target: ${target}ms)` : '')
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return csiCache.getStats();
  }

  /**
   * Check if data is cached
   */
  async isCached(timeWindow: ExtendedTimeWindow, country?: string): Promise<boolean> {
    return csiCache.isCached({ timeWindow, country });
  }

  /**
   * Get cache metadata
   */
  getCacheMetadata(timeWindow: ExtendedTimeWindow, country?: string) {
    return csiCache.getCacheMetadata({ timeWindow, country });
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(timeWindow?: ExtendedTimeWindow, country?: string): Promise<void> {
    if (timeWindow) {
      if (country) {
        await csiCache.invalidate({ timeWindow, country });
      } else {
        await csiCache.invalidateTimeWindow(timeWindow);
      }
    } else {
      await csiCache.clearAll();
    }
  }

  /**
   * Preload cache for extended time windows
   */
  async preloadCache(
    timeWindows: ExtendedTimeWindow[] = ['3Y', '5Y', '10Y'],
    onProgress?: (window: ExtendedTimeWindow, progress: number) => void
  ): Promise<void> {
    console.log('[CSI Worker] Starting cache preload...');

    for (const timeWindow of timeWindows) {
      const isCached = await this.isCached(timeWindow);
      if (!isCached) {
        console.log(`[CSI Worker] Preloading ${timeWindow}...`);
        await this.calculateTimeSeries(timeWindow, undefined, {
          onProgress: (progress) => onProgress?.(timeWindow, progress)
        });
      } else {
        console.log(`[CSI Worker] ${timeWindow} already cached`);
        onProgress?.(timeWindow, 100);
      }
    }

    console.log('[CSI Worker] Cache preload complete');
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerInitialized = false;
      console.log('[CSI Worker] Worker terminated');
    }
  }

  /**
   * Check if worker is available
   */
  isWorkerAvailable(): boolean {
    return this.worker !== null && this.workerInitialized;
  }
}

// Singleton instance
export const csiWorkerService = new CSIWorkerService();

// Export types
export type { ProgressCallback, ResultCallback, ErrorCallback };