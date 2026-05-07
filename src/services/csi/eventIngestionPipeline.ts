/**
 * Event Ingestion Pipeline
 * 
 * Handles ingestion of geopolitical events from multiple data sources.
 * Validates, normalizes, and queues events for processing.
 * Supports both batch and real-time ingestion modes.
 */

import type { EventCategory, EventSeverity, GeopoliticalEvent } from '@/data/geopoliticalEvents';

// Data source types aligned with the 7-vector CSI model
export type EventSourceType = 
  // SC1: Conflict & Security sources
  | 'GDELT' | 'ACLED' | 'UCDP' | 'SIPRI' | 'CSIS' | 'IISS' | 'EMBASSY'
  // SC2: Sanctions & Regulatory sources
  | 'OFAC' | 'EU_CFSP' | 'BIS' | 'UN_SANCTIONS'
  // SC3: Trade & Logistics sources
  | 'WTO' | 'USTR' | 'OECD' | 'MARITIME'
  // SC4: Governance sources
  | 'WORLD_BANK_WGI' | 'FREEDOM_HOUSE' | 'TRANSPARENCY_INTL'
  // SC5: Cyber sources
  | 'CISA' | 'ENISA' | 'NETBLOCKS' | 'ICT_TRACKER'
  // SC6: Unrest sources
  | 'OSINT' | 'ILO' | 'LABOR_MINISTRY'
  // SC7: Currency sources
  | 'IMF_AREAER' | 'BIS_FX' | 'EXPORT_CONTROLS'
  // Generic sources
  | 'MANUAL' | 'API' | 'RSS' | 'WEBHOOK';

export interface RawEventData {
  source: EventSourceType;
  sourceEventId?: string;
  timestamp: Date;
  headline: string;
  description?: string;
  country: string;
  region?: string;
  category?: EventCategory;
  severity?: EventSeverity;
  confidence?: number; // 0-1 confidence score
  rawData?: Record<string, unknown>;
  tags?: string[];
}

export interface NormalizedEvent {
  id: string;
  source: EventSourceType;
  sourceEventId?: string;
  timestamp: Date;
  headline: string;
  description: string;
  country: string;
  region: string;
  category: EventCategory;
  severity: EventSeverity;
  confidence: number;
  status: 'queued' | 'processing' | 'processed' | 'failed';
  ingestedAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface IngestionStats {
  totalIngested: number;
  totalProcessed: number;
  totalFailed: number;
  bySource: Record<EventSourceType, number>;
  byCategory: Record<EventCategory, number>;
  lastIngestionTime?: Date;
  queueSize: number;
  processingRate: number; // events per minute
}

type IngestionCallback = (event: NormalizedEvent) => void;
type ErrorCallback = (error: Error, event?: RawEventData) => void;

class EventIngestionPipeline {
  private queue: NormalizedEvent[] = [];
  private processedEvents: Map<string, NormalizedEvent> = new Map();
  private stats: IngestionStats;
  private isProcessing: boolean = false;
  private subscribers: Set<IngestionCallback> = new Set();
  private errorHandlers: Set<ErrorCallback> = new Set();
  private processingInterval: NodeJS.Timeout | null = null;
  private eventCounter: number = 0;

  // Country to region mapping
  private readonly countryRegionMap: Record<string, string> = {
    // Middle East
    'Iran': 'Middle East', 'Israel': 'Middle East', 'Lebanon': 'Middle East',
    'Syria': 'Middle East', 'Iraq': 'Middle East', 'Yemen': 'Middle East',
    'Saudi Arabia': 'Middle East', 'United Arab Emirates': 'Middle East',
    'Turkey': 'Middle East', 'Jordan': 'Middle East', 'Kuwait': 'Middle East',
    'Qatar': 'Middle East', 'Bahrain': 'Middle East', 'Oman': 'Middle East',
    'Palestine': 'Middle East', 'Cyprus': 'Middle East',
    // Eastern Europe
    'Russia': 'Eurasia', 'Ukraine': 'Eastern Europe', 'Belarus': 'Eastern Europe',
    'Poland': 'Eastern Europe', 'Romania': 'Eastern Europe', 'Hungary': 'Eastern Europe',
    'Czech Republic': 'Eastern Europe', 'Slovakia': 'Eastern Europe',
    'Moldova': 'Eastern Europe', 'Lithuania': 'Eastern Europe',
    'Latvia': 'Eastern Europe', 'Estonia': 'Eastern Europe',
    // East Asia
    'China': 'East Asia', 'Taiwan': 'East Asia', 'Japan': 'East Asia',
    'South Korea': 'East Asia', 'North Korea': 'East Asia', 'Mongolia': 'East Asia',
    'Hong Kong': 'East Asia',
    // Southeast Asia
    'Vietnam': 'Southeast Asia', 'Thailand': 'Southeast Asia', 'Myanmar': 'Southeast Asia',
    'Philippines': 'Southeast Asia', 'Indonesia': 'Southeast Asia', 'Malaysia': 'Southeast Asia',
    'Singapore': 'Southeast Asia', 'Cambodia': 'Southeast Asia', 'Laos': 'Southeast Asia',
    // South Asia
    'India': 'South Asia', 'Pakistan': 'South Asia', 'Bangladesh': 'South Asia',
    'Afghanistan': 'South Asia', 'Sri Lanka': 'South Asia', 'Nepal': 'South Asia',
    // Africa
    'Sudan': 'North Africa', 'Egypt': 'North Africa', 'Libya': 'North Africa',
    'Nigeria': 'West Africa', 'Ethiopia': 'East Africa', 'Kenya': 'East Africa',
    'South Africa': 'Southern Africa', 'Democratic Republic of Congo': 'Central Africa',
    // Americas
    'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
    'Brazil': 'South America', 'Argentina': 'South America', 'Venezuela': 'South America',
    'Colombia': 'South America', 'Ecuador': 'South America', 'Haiti': 'Caribbean',
    // Western Europe
    'United Kingdom': 'Western Europe', 'Germany': 'Western Europe', 'France': 'Western Europe',
    'Italy': 'Western Europe', 'Spain': 'Western Europe', 'Netherlands': 'Western Europe',
  };

  constructor() {
    this.stats = this.initializeStats();
  }

  private initializeStats(): IngestionStats {
    return {
      totalIngested: 0,
      totalProcessed: 0,
      totalFailed: 0,
      bySource: {} as Record<EventSourceType, number>,
      byCategory: {} as Record<EventCategory, number>,
      queueSize: 0,
      processingRate: 0
    };
  }

  /**
   * Ingest a single raw event
   */
  ingestEvent(rawEvent: RawEventData): NormalizedEvent {
    try {
      // Validate required fields
      this.validateRawEvent(rawEvent);

      // Normalize the event
      const normalized = this.normalizeEvent(rawEvent);

      // Add to queue
      this.queue.push(normalized);
      this.processedEvents.set(normalized.id, normalized);

      // Update stats
      this.updateIngestionStats(normalized);

      console.log(`[Ingestion Pipeline] 📥 Ingested event: ${normalized.id} - ${normalized.headline}`);

      return normalized;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, rawEvent);
      throw err;
    }
  }

  /**
   * Ingest multiple events in batch
   */
  ingestBatch(events: RawEventData[]): { success: NormalizedEvent[]; failed: { event: RawEventData; error: string }[] } {
    const success: NormalizedEvent[] = [];
    const failed: { event: RawEventData; error: string }[] = [];

    events.forEach(event => {
      try {
        const normalized = this.ingestEvent(event);
        success.push(normalized);
      } catch (error) {
        failed.push({
          event,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    console.log(`[Ingestion Pipeline] 📦 Batch ingestion complete: ${success.length} success, ${failed.length} failed`);

    return { success, failed };
  }

  /**
   * Validate raw event data
   */
  private validateRawEvent(event: RawEventData): void {
    if (!event.source) {
      throw new Error('Event source is required');
    }
    if (!event.headline || event.headline.trim().length === 0) {
      throw new Error('Event headline is required');
    }
    if (!event.country || event.country.trim().length === 0) {
      throw new Error('Event country is required');
    }
    if (!event.timestamp || !(event.timestamp instanceof Date) || isNaN(event.timestamp.getTime())) {
      throw new Error('Valid event timestamp is required');
    }
  }

  /**
   * Normalize raw event data
   */
  private normalizeEvent(raw: RawEventData): NormalizedEvent {
    const id = this.generateEventId(raw);
    const region = raw.region || this.countryRegionMap[raw.country] || 'Unknown';
    
    return {
      id,
      source: raw.source,
      sourceEventId: raw.sourceEventId,
      timestamp: raw.timestamp,
      headline: raw.headline.trim(),
      description: raw.description?.trim() || raw.headline.trim(),
      country: raw.country.trim(),
      region,
      category: raw.category || 'Conflict', // Default category
      severity: raw.severity || 'Moderate', // Default severity
      confidence: raw.confidence ?? 0.8,
      status: 'queued',
      ingestedAt: new Date()
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(event: RawEventData): string {
    this.eventCounter++;
    const timestamp = event.timestamp.toISOString().split('T')[0].replace(/-/g, '');
    const source = event.source.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EVT-${source}-${timestamp}-${this.eventCounter.toString().padStart(4, '0')}-${random}`;
  }

  /**
   * Update ingestion statistics
   */
  private updateIngestionStats(event: NormalizedEvent): void {
    this.stats.totalIngested++;
    this.stats.bySource[event.source] = (this.stats.bySource[event.source] || 0) + 1;
    this.stats.byCategory[event.category] = (this.stats.byCategory[event.category] || 0) + 1;
    this.stats.lastIngestionTime = new Date();
    this.stats.queueSize = this.queue.length;
  }

  /**
   * Start processing queue
   */
  startProcessing(intervalMs: number = 1000): void {
    if (this.isProcessing) {
      console.log('[Ingestion Pipeline] ⚠️ Processing already started');
      return;
    }

    this.isProcessing = true;
    console.log(`[Ingestion Pipeline] ▶️ Started processing (interval: ${intervalMs}ms)`);

    this.processingInterval = setInterval(() => {
      this.processNextEvent();
    }, intervalMs);
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('[Ingestion Pipeline] ⏹️ Stopped processing');
  }

  /**
   * Process next event in queue
   */
  private processNextEvent(): void {
    const event = this.queue.find(e => e.status === 'queued');
    if (!event) return;

    event.status = 'processing';

    try {
      // Notify subscribers
      this.notifySubscribers(event);

      event.status = 'processed';
      event.processedAt = new Date();
      this.stats.totalProcessed++;

      console.log(`[Ingestion Pipeline] ✅ Processed event: ${event.id}`);
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : String(error);
      this.stats.totalFailed++;

      console.error(`[Ingestion Pipeline] ❌ Failed to process event: ${event.id}`, error);
    }

    this.stats.queueSize = this.queue.filter(e => e.status === 'queued').length;
  }

  /**
   * Subscribe to processed events
   */
  subscribe(callback: IngestionCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Subscribe to errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorHandlers.add(callback);
    return () => this.errorHandlers.delete(callback);
  }

  /**
   * Notify subscribers of processed event
   */
  private notifySubscribers(event: NormalizedEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Ingestion Pipeline] Subscriber error:', error);
      }
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: Error, event?: RawEventData): void {
    this.stats.totalFailed++;
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, event);
      } catch (e) {
        console.error('[Ingestion Pipeline] Error handler failed:', e);
      }
    });
  }

  /**
   * Get current statistics
   */
  getStats(): IngestionStats {
    return { ...this.stats };
  }

  /**
   * Get queue contents
   */
  getQueue(): NormalizedEvent[] {
    return [...this.queue];
  }

  /**
   * Get processed events
   */
  getProcessedEvents(): NormalizedEvent[] {
    return Array.from(this.processedEvents.values());
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): NormalizedEvent | undefined {
    return this.processedEvents.get(id);
  }

  /**
   * Clear queue and reset stats
   */
  reset(): void {
    this.stopProcessing();
    this.queue = [];
    this.processedEvents.clear();
    this.stats = this.initializeStats();
    this.eventCounter = 0;
    console.log('[Ingestion Pipeline] 🔄 Reset complete');
  }

  /**
   * Check if processing is active
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Get region for a country
   */
  getRegionForCountry(country: string): string {
    return this.countryRegionMap[country] || 'Unknown';
  }
}

// Singleton instance
export const eventIngestionPipeline = new EventIngestionPipeline();