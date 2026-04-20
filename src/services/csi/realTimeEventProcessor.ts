/**
 * Real-Time Event Processor
 * 
 * Processes events as they arrive, updates CSI scores in real-time,
 * triggers dashboard updates, and manages event lifecycle.
 */

import type { GeopoliticalEvent, EventCategory, EventSeverity } from '@/data/geopoliticalEvents';
import { eventIngestionPipeline, type NormalizedEvent } from './eventIngestionPipeline';
import { eventClassificationEngine, type ClassificationResult } from './eventClassificationEngine';
import { regionalPropagationEngine, type PropagationChain, type PropagationEffect } from './regionalPropagationEngine';
import { historicalCSIService } from './historicalCSIService';

export type EventLifecycleState = 'detected' | 'provisional' | 'confirmed' | 'resolved';

export interface ProcessedEvent {
  id: string;
  normalizedEvent: NormalizedEvent;
  classification: ClassificationResult;
  propagation: PropagationChain;
  lifecycleState: EventLifecycleState;
  csiImpact: {
    directCountry: string;
    directDeltaCSI: number;
    propagatedEffects: { country: string; deltaCSI: number }[];
    totalImpact: number;
  };
  processedAt: Date;
  confirmedAt?: Date;
  resolvedAt?: Date;
}

export interface RealTimeUpdate {
  type: 'event_processed' | 'csi_updated' | 'propagation_complete' | 'lifecycle_change';
  timestamp: Date;
  eventId: string;
  data: ProcessedEvent | { country: string; oldCSI: number; newCSI: number; deltaCSI: number };
}

type UpdateCallback = (update: RealTimeUpdate) => void;

class RealTimeEventProcessor {
  private processedEvents: Map<string, ProcessedEvent> = new Map();
  private eventDeduplication: Set<string> = new Set();
  private subscribers: Set<UpdateCallback> = new Set();
  private isRunning: boolean = false;
  private processingStats = {
    totalProcessed: 0,
    totalDeduplicated: 0,
    totalPropagated: 0,
    lastProcessedAt: null as Date | null
  };

  constructor() {
    // Subscribe to ingestion pipeline
    eventIngestionPipeline.subscribe((event) => {
      if (this.isRunning) {
        this.processEvent(event);
      }
    });
  }

  /**
   * Start real-time processing
   */
  start(): void {
    if (this.isRunning) {
      console.log('[RT Processor] ⚠️ Already running');
      return;
    }

    this.isRunning = true;
    eventIngestionPipeline.startProcessing(500); // Process every 500ms
    console.log('[RT Processor] ▶️ Started real-time processing');
  }

  /**
   * Stop real-time processing
   */
  stop(): void {
    this.isRunning = false;
    eventIngestionPipeline.stopProcessing();
    console.log('[RT Processor] ⏹️ Stopped real-time processing');
  }

  /**
   * Pause processing (keep state)
   */
  pause(): void {
    eventIngestionPipeline.stopProcessing();
    console.log('[RT Processor] ⏸️ Paused processing');
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (this.isRunning) {
      eventIngestionPipeline.startProcessing(500);
      console.log('[RT Processor] ▶️ Resumed processing');
    }
  }

  /**
   * Process a single event
   */
  processEvent(event: NormalizedEvent): ProcessedEvent | null {
    // Check for duplicates
    const dedupeKey = this.generateDedupeKey(event);
    if (this.eventDeduplication.has(dedupeKey)) {
      this.processingStats.totalDeduplicated++;
      console.log(`[RT Processor] 🔄 Duplicate event skipped: ${event.id}`);
      return null;
    }
    this.eventDeduplication.add(dedupeKey);

    try {
      // Classify the event
      const classification = eventClassificationEngine.classifyEvent(event);

      // Calculate propagation
      const propagation = regionalPropagationEngine.calculatePropagation(
        event.id,
        event.country,
        classification
      );

      // Calculate CSI impact
      const csiImpact = this.calculateCSIImpact(event, classification, propagation);

      // Create processed event
      const processedEvent: ProcessedEvent = {
        id: event.id,
        normalizedEvent: event,
        classification,
        propagation,
        lifecycleState: 'detected',
        csiImpact,
        processedAt: new Date()
      };

      // Store processed event
      this.processedEvents.set(event.id, processedEvent);
      this.processingStats.totalProcessed++;
      this.processingStats.lastProcessedAt = new Date();

      // Notify subscribers
      this.notifySubscribers({
        type: 'event_processed',
        timestamp: new Date(),
        eventId: event.id,
        data: processedEvent
      });

      console.log(`[RT Processor] ✅ Processed event: ${event.id} - ${event.headline}`);

      // Auto-confirm high-confidence events
      if (classification.confidence > 0.8) {
        this.transitionEventState(event.id, 'confirmed');
      }

      return processedEvent;
    } catch (error) {
      console.error(`[RT Processor] ❌ Failed to process event: ${event.id}`, error);
      return null;
    }
  }

  /**
   * Generate deduplication key
   */
  private generateDedupeKey(event: NormalizedEvent): string {
    // Combine country, date, and headline hash for deduplication
    const dateStr = event.timestamp.toISOString().split('T')[0];
    const headlineHash = this.simpleHash(event.headline.toLowerCase());
    return `${event.country}-${dateStr}-${headlineHash}`;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate CSI impact for an event
   */
  private calculateCSIImpact(
    event: NormalizedEvent,
    classification: ClassificationResult,
    propagation: PropagationChain
  ): ProcessedEvent['csiImpact'] {
    const directDeltaCSI = classification.estimatedDeltaCSI;
    
    const propagatedEffects = propagation.effects.map(effect => ({
      country: effect.targetCountry,
      deltaCSI: effect.propagatedDeltaCSI
    }));

    const totalImpact = directDeltaCSI + propagatedEffects.reduce((sum, e) => sum + e.deltaCSI, 0);

    return {
      directCountry: event.country,
      directDeltaCSI,
      propagatedEffects,
      totalImpact: parseFloat(totalImpact.toFixed(1))
    };
  }

  /**
   * Transition event lifecycle state
   */
  transitionEventState(eventId: string, newState: EventLifecycleState): boolean {
    const event = this.processedEvents.get(eventId);
    if (!event) {
      console.warn(`[RT Processor] Event not found: ${eventId}`);
      return false;
    }

    const validTransitions: Record<EventLifecycleState, EventLifecycleState[]> = {
      detected: ['provisional', 'confirmed', 'resolved'],
      provisional: ['confirmed', 'resolved'],
      confirmed: ['resolved'],
      resolved: []
    };

    if (!validTransitions[event.lifecycleState].includes(newState)) {
      console.warn(`[RT Processor] Invalid transition: ${event.lifecycleState} → ${newState}`);
      return false;
    }

    event.lifecycleState = newState;
    
    if (newState === 'confirmed') {
      event.confirmedAt = new Date();
    } else if (newState === 'resolved') {
      event.resolvedAt = new Date();
    }

    // Notify subscribers
    this.notifySubscribers({
      type: 'lifecycle_change',
      timestamp: new Date(),
      eventId,
      data: event
    });

    console.log(`[RT Processor] 🔄 Event ${eventId} transitioned to ${newState}`);

    return true;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: UpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(update: RealTimeUpdate): void {
    this.subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[RT Processor] Subscriber error:', error);
      }
    });
  }

  /**
   * Get processed event by ID
   */
  getProcessedEvent(eventId: string): ProcessedEvent | undefined {
    return this.processedEvents.get(eventId);
  }

  /**
   * Get all processed events
   */
  getAllProcessedEvents(): ProcessedEvent[] {
    return Array.from(this.processedEvents.values())
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
  }

  /**
   * Get events by lifecycle state
   */
  getEventsByState(state: EventLifecycleState): ProcessedEvent[] {
    return Array.from(this.processedEvents.values())
      .filter(e => e.lifecycleState === state);
  }

  /**
   * Get recent events (last N)
   */
  getRecentEvents(count: number = 10): ProcessedEvent[] {
    return this.getAllProcessedEvents().slice(0, count);
  }

  /**
   * Get processing statistics
   */
  getStats(): typeof this.processingStats & { isRunning: boolean; queueSize: number } {
    return {
      ...this.processingStats,
      isRunning: this.isRunning,
      queueSize: eventIngestionPipeline.getStats().queueSize
    };
  }

  /**
   * Check if processor is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Clear all processed events
   */
  clear(): void {
    this.processedEvents.clear();
    this.eventDeduplication.clear();
    this.processingStats = {
      totalProcessed: 0,
      totalDeduplicated: 0,
      totalPropagated: 0,
      lastProcessedAt: null
    };
    console.log('[RT Processor] 🧹 Cleared all data');
  }

  /**
   * Convert ProcessedEvent to GeopoliticalEvent format for dashboard compatibility
   */
  toGeopoliticalEvent(processed: ProcessedEvent): GeopoliticalEvent {
    return {
      id: processed.id,
      title: processed.normalizedEvent.headline,
      description: processed.normalizedEvent.description,
      country: processed.normalizedEvent.country,
      region: processed.normalizedEvent.region,
      date: processed.normalizedEvent.timestamp,
      category: processed.classification.primaryVector.vector,
      severity: processed.classification.severity,
      deltaCSI: processed.classification.estimatedDeltaCSI,
      vectorImpacts: {
        [processed.classification.primaryVector.vector.toLowerCase()]: processed.classification.estimatedDeltaCSI
      },
      relatedCountries: processed.propagation.effects.map(e => e.targetCountry),
      isOngoing: processed.lifecycleState !== 'resolved'
    };
  }

  /**
   * Get all events as GeopoliticalEvent format
   */
  getAllAsGeopoliticalEvents(): GeopoliticalEvent[] {
    return this.getAllProcessedEvents().map(e => this.toGeopoliticalEvent(e));
  }
}

// Singleton instance
export const realTimeEventProcessor = new RealTimeEventProcessor();