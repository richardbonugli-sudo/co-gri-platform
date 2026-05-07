/**
 * Event Store - Unified storage for CSI events
 * 
 * Provides CRUD operations and state management for geopolitical shock events.
 * Supports both EventRecord (old system) and CSIEvent (new dashboard system).
 */

import type {
  EventRecord,
  CreateEventInput,
  UpdateEventInput,
  StateTransitionInput,
  EventState,
  AuditEntry
} from '@/types/csi.types';

// CSI Event interfaces for dashboard compatibility
export interface CSIEvent {
  id: string;
  timestamp: Date;
  country: string;
  eventType: 'tariff' | 'sanction' | 'trade_agreement' | 'political_instability' | 'natural_disaster' | 'regulatory_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSectors: string[];
  sourceReliability: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface PropagatedEvent extends CSIEvent {
  propagationPath: string[];
  propagationDepth: number;
  impactScore: number;
}

class EventStore {
  private events: Map<string, EventRecord> = new Map();
  private countryIndex: Map<string, Set<string>> = new Map();
  private propagationTracking: Map<string, string[]> = new Map();
  private csiEvents: Map<string, CSIEvent> = new Map();
  private propagatedCsiEvents: Map<string, PropagatedEvent[]> = new Map();
  private subscribers: Set<(events: CSIEvent[]) => void> = new Set();

  constructor() {
    this.initializeSeedData();
  }

  /**
   * Initialize seed data for CSI dashboard
   */
  private initializeSeedData(): void {
    const seedEvents: CSIEvent[] = [
      {
        id: 'evt_001',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        country: 'China',
        eventType: 'tariff',
        severity: 'high',
        description: 'New 25% tariff imposed on semiconductor imports from select countries',
        affectedSectors: ['Electronics', 'Semiconductors', 'Automotive'],
        sourceReliability: 0.95,
        metadata: {
          tariffRate: 0.25,
          effectiveDate: '2024-02-01',
          targetCountries: ['United States', 'Japan', 'South Korea']
        }
      },
      {
        id: 'evt_002',
        timestamp: new Date('2024-01-20T14:45:00Z'),
        country: 'United States',
        eventType: 'sanction',
        severity: 'critical',
        description: 'Economic sanctions imposed on technology exports to specific regions',
        affectedSectors: ['Technology', 'Defense', 'Aerospace'],
        sourceReliability: 0.98,
        metadata: {
          sanctionType: 'export_control',
          targetRegions: ['Eastern Europe', 'Middle East'],
          duration: 'indefinite'
        }
      },
      {
        id: 'evt_003',
        timestamp: new Date('2024-01-25T09:15:00Z'),
        country: 'Vietnam',
        eventType: 'trade_agreement',
        severity: 'medium',
        description: 'New bilateral trade agreement signed with EU, reducing import duties',
        affectedSectors: ['Textiles', 'Manufacturing', 'Agriculture'],
        sourceReliability: 0.92,
        metadata: {
          partner: 'European Union',
          dutyReduction: 0.15,
          implementationDate: '2024-03-01'
        }
      },
      {
        id: 'evt_004',
        timestamp: new Date('2024-02-01T16:20:00Z'),
        country: 'India',
        eventType: 'regulatory_change',
        severity: 'medium',
        description: 'Updated environmental regulations for manufacturing sector',
        affectedSectors: ['Manufacturing', 'Chemicals', 'Pharmaceuticals'],
        sourceReliability: 0.88,
        metadata: {
          complianceDeadline: '2024-06-01',
          estimatedCostImpact: 'moderate'
        }
      },
      {
        id: 'evt_005',
        timestamp: new Date('2024-02-05T11:30:00Z'),
        country: 'Japan',
        eventType: 'natural_disaster',
        severity: 'high',
        description: 'Major earthquake disrupts manufacturing facilities and supply chains',
        affectedSectors: ['Automotive', 'Electronics', 'Machinery'],
        sourceReliability: 1.0,
        metadata: {
          magnitude: 7.2,
          affectedRegions: ['Tokyo', 'Osaka'],
          estimatedRecoveryTime: '3-6 months'
        }
      },
      {
        id: 'evt_006',
        timestamp: new Date('2024-02-10T08:45:00Z'),
        country: 'Germany',
        eventType: 'political_instability',
        severity: 'low',
        description: 'Political protests affecting logistics and transportation networks',
        affectedSectors: ['Logistics', 'Transportation', 'Retail'],
        sourceReliability: 0.85,
        metadata: {
          duration: '2 weeks',
          affectedCities: ['Berlin', 'Hamburg'],
          impactLevel: 'minimal'
        }
      },
      {
        id: 'evt_007',
        timestamp: new Date('2024-02-15T13:00:00Z'),
        country: 'South Korea',
        eventType: 'tariff',
        severity: 'medium',
        description: 'Retaliatory tariffs on steel and aluminum imports',
        affectedSectors: ['Steel', 'Aluminum', 'Construction'],
        sourceReliability: 0.93,
        metadata: {
          tariffRate: 0.18,
          targetCountries: ['China', 'United States'],
          effectiveDate: '2024-03-01'
        }
      },
      {
        id: 'evt_008',
        timestamp: new Date('2024-02-20T10:15:00Z'),
        country: 'Brazil',
        eventType: 'trade_agreement',
        severity: 'low',
        description: 'Regional trade pact signed with neighboring countries',
        affectedSectors: ['Agriculture', 'Mining', 'Energy'],
        sourceReliability: 0.90,
        metadata: {
          partners: ['Argentina', 'Chile', 'Uruguay'],
          scope: 'agricultural_products',
          implementationDate: '2024-04-01'
        }
      },
      {
        id: 'evt_009',
        timestamp: new Date('2024-02-25T15:30:00Z'),
        country: 'United Kingdom',
        eventType: 'regulatory_change',
        severity: 'high',
        description: 'New data protection and cybersecurity regulations for tech companies',
        affectedSectors: ['Technology', 'Finance', 'Telecommunications'],
        sourceReliability: 0.96,
        metadata: {
          complianceDeadline: '2024-07-01',
          penalties: 'up to 4% of annual revenue',
          scope: 'all_data_processors'
        }
      },
      {
        id: 'evt_010',
        timestamp: new Date('2024-03-01T09:00:00Z'),
        country: 'Taiwan',
        eventType: 'political_instability',
        severity: 'critical',
        description: 'Heightened geopolitical tensions affecting semiconductor supply chains',
        affectedSectors: ['Semiconductors', 'Electronics', 'Technology'],
        sourceReliability: 0.97,
        metadata: {
          riskLevel: 'elevated',
          supplyChainImpact: 'significant',
          monitoringStatus: 'active'
        }
      }
    ];

    seedEvents.forEach(event => {
      this.csiEvents.set(event.id, event);
    });

    console.log(`[Event Store] ✅ Initialized with ${seedEvents.length} CSI events`);
  }

  // ===== EventRecord System (Old) =====
  
  createEvent(input: CreateEventInput): EventRecord {
    const event_id = this.generateEventId(input.country, input.event_type);
    const now = new Date().toISOString();

    const event: EventRecord = {
      event_id,
      country: input.country,
      event_type: input.event_type,
      primary_vector: input.primary_vector,
      secondary_vectors: input.secondary_vectors || [],
      state: 'DETECTED',
      severity: input.severity,
      delta_csi: input.delta_csi,
      detected_date: input.detected_date,
      effective_date: input.effective_date,
      description: input.description,
      sources: input.sources,
      rationale: input.rationale,
      affected_sectors: input.affected_sectors,
      decay_schedule: input.decay_schedule || { type: 'NONE' },
      propagation_eligible: input.propagation_eligible ?? true,
      propagated_events: [],
      created_by: input.created_by,
      created_at: now,
      updated_at: now,
      audit_trail: [{
        timestamp: now,
        action: 'EVENT_CREATED',
        user: input.created_by,
        details: `Event created: ${input.description}`
      }]
    };

    this.events.set(event_id, event);
    this.updateCountryIndex(input.country, event_id);
    return event;
  }

  updateEvent(input: UpdateEventInput): EventRecord {
    const event = this.events.get(input.event_id);
    if (!event) {
      throw new Error(`Event not found: ${input.event_id}`);
    }

    const now = new Date().toISOString();
    const changes: string[] = [];

    if (input.severity !== undefined && input.severity !== event.severity) {
      changes.push(`severity: ${event.severity} → ${input.severity}`);
      event.severity = input.severity;
    }

    if (input.delta_csi !== undefined && input.delta_csi !== event.delta_csi) {
      changes.push(`ΔCSI: ${event.delta_csi} → ${input.delta_csi}`);
      event.delta_csi = input.delta_csi;
    }

    if (input.description) {
      event.description = input.description;
      changes.push('description updated');
    }

    if (input.sources) {
      event.sources = input.sources;
      changes.push('sources updated');
    }

    if (input.rationale) {
      event.rationale = input.rationale;
      changes.push('rationale updated');
    }

    if (input.decay_schedule) {
      event.decay_schedule = input.decay_schedule;
      changes.push('decay schedule updated');
    }

    event.updated_at = now;
    event.audit_trail.push({
      timestamp: now,
      action: 'EVENT_UPDATED',
      user: input.updated_by,
      details: `Updated: ${changes.join(', ')}`
    });

    return event;
  }

  async transitionEventState(input: StateTransitionInput): Promise<EventRecord> {
    const event = this.events.get(input.event_id);
    if (!event) {
      throw new Error(`Event not found: ${input.event_id}`);
    }

    const previous_state = event.state;
    const now = new Date().toISOString();

    this.validateStateTransition(previous_state, input.new_state);

    event.state = input.new_state;
    event.updated_at = now;

    if (input.new_state === 'CONFIRMED' && !event.confirmed_date) {
      event.confirmed_date = now;
    }
    if (input.new_state === 'RESOLVED' && !event.resolved_date) {
      event.resolved_date = now;
    }

    const auditEntry: AuditEntry = {
      timestamp: now,
      action: 'STATE_TRANSITION',
      user: input.user,
      details: input.reason,
      previous_state,
      new_state: input.new_state
    };

    event.audit_trail.push(auditEntry);

    if (input.new_state === 'CONFIRMED' && event.propagation_eligible && !event.origin_event_id) {
      try {
        const { onEventConfirmed } = await import('./propagation/propagationEngine');
        await onEventConfirmed(event);
      } catch (error) {
        console.error(`[Event Store] ⚠️ Propagation failed for ${input.event_id}:`, error);
      }
    }

    return event;
  }

  addPropagatedEvent(originEventId: string, propagatedEventId: string): void {
    const event = this.events.get(originEventId);
    if (!event) {
      throw new Error(`Origin event not found: ${originEventId}`);
    }

    if (!event.propagated_events) {
      event.propagated_events = [];
    }

    event.propagated_events.push(propagatedEventId);

    if (!this.propagationTracking.has(originEventId)) {
      this.propagationTracking.set(originEventId, []);
    }
    this.propagationTracking.get(originEventId)!.push(propagatedEventId);
  }

  getPropagatedEvents(originEventId: string): string[] {
    return this.propagationTracking.get(originEventId) || [];
  }

  hasBeenPropagated(eventId: string): boolean {
    return this.propagationTracking.has(eventId) && this.propagationTracking.get(eventId)!.length > 0;
  }

  deleteEvent(event_id: string, user: string, reason: string): boolean {
    const event = this.events.get(event_id);
    if (!event) {
      return false;
    }

    this.removeFromCountryIndex(event.country, event_id);
    this.events.delete(event_id);
    this.propagationTracking.delete(event_id);

    return true;
  }

  getEvent(event_id: string): EventRecord | undefined {
    return this.events.get(event_id);
  }

  getEventsByCountry(country: string): EventRecord[] {
    const eventIds = this.countryIndex.get(country);
    if (!eventIds) {
      return [];
    }

    return Array.from(eventIds)
      .map(id => this.events.get(id))
      .filter((e): e is EventRecord => e !== undefined);
  }

  getActiveEvents(country?: string): EventRecord[] {
    let events: EventRecord[];

    if (country) {
      events = this.getEventsByCountry(country);
    } else {
      events = Array.from(this.events.values());
    }

    return events.filter(e => e.state === 'CONFIRMED');
  }

  /**
   * Get active events for a country that were effective on or before a specific date
   * This is crucial for historical CSI calculations to ensure consistency
   * 
   * @param country - Country name (optional, if not provided returns all countries)
   * @param asOfDate - The date to filter events by (only events effective on or before this date)
   * @returns Array of EventRecord that were active as of the specified date
   */
  getActiveEventsAsOfDate(country: string | undefined, asOfDate: Date): EventRecord[] {
    let events: EventRecord[];

    if (country) {
      events = this.getEventsByCountry(country);
    } else {
      events = Array.from(this.events.values());
    }

    // Filter to only CONFIRMED events that were effective on or before the asOfDate
    return events.filter(e => {
      if (e.state !== 'CONFIRMED') {
        return false;
      }

      // Use effective_date if available, otherwise use detected_date
      const eventEffectiveDate = e.effective_date 
        ? new Date(e.effective_date) 
        : new Date(e.detected_date);

      // Only include events that were effective on or before the asOfDate
      return eventEffectiveDate <= asOfDate;
    });
  }

  getAllEvents(): EventRecord[] {
    return Array.from(this.events.values());
  }

  getEventsByState(state: EventState): EventRecord[] {
    return Array.from(this.events.values()).filter(e => e.state === state);
  }

  clear(): void {
    this.events.clear();
    this.countryIndex.clear();
    this.propagationTracking.clear();
  }

  getEventCount(): number {
    return this.events.size;
  }

  // ===== CSIEvent System (New - for dashboards) =====

  addCsiEvent(event: CSIEvent): void {
    this.csiEvents.set(event.id, event);
    this.notifySubscribers();
  }

  getAllCsiEvents(): CSIEvent[] {
    return Array.from(this.csiEvents.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getCsiEvent(eventId: string): CSIEvent | undefined {
    return this.csiEvents.get(eventId);
  }

  getPropagatedCsiEvents(eventId: string): PropagatedEvent[] {
    return this.propagatedCsiEvents.get(eventId) || [];
  }

  getAllPropagatedCsiEvents(): Map<string, PropagatedEvent[]> {
    return new Map(this.propagatedCsiEvents);
  }

  subscribe(callback: (events: CSIEvent[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getAllCsiEvents());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getStatistics(): {
    totalEvents: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byCountry: Record<string, number>;
  } {
    const events = this.getAllCsiEvents();
    
    return {
      totalEvents: events.length,
      bySeverity: events.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: events.reduce((acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCountry: events.reduce((acc, e) => {
        acc[e.country] = (acc[e.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Private helper methods

  private notifySubscribers(): void {
    const events = this.getAllCsiEvents();
    this.subscribers.forEach(callback => callback(events));
  }

  private generateEventId(country: string, event_type: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${country.toUpperCase().replace(/\s+/g, '-')}-${event_type}-${timestamp}-${random}`;
  }

  private updateCountryIndex(country: string, event_id: string): void {
    if (!this.countryIndex.has(country)) {
      this.countryIndex.set(country, new Set());
    }
    this.countryIndex.get(country)!.add(event_id);
  }

  private removeFromCountryIndex(country: string, event_id: string): void {
    const eventIds = this.countryIndex.get(country);
    if (eventIds) {
      eventIds.delete(event_id);
      if (eventIds.size === 0) {
        this.countryIndex.delete(country);
      }
    }
  }

  private validateStateTransition(from: EventState, to: EventState): void {
    const validTransitions: Record<EventState, EventState[]> = {
      'DETECTED': ['PROVISIONAL', 'RESOLVED'],
      'PROVISIONAL': ['CONFIRMED', 'RESOLVED'],
      'CONFIRMED': ['RESOLVED'],
      'RESOLVED': []
    };

    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid state transition: ${from} → ${to}`);
    }
  }
}

// Singleton instance
const storeInstance = new EventStore();

// Export for old system (EventRecord)
export const eventStore = storeInstance;

// Export for new system (CSIEvent) - create wrapper with CSI-specific methods
export const csiEventStore = {
  addEvent: (event: CSIEvent) => storeInstance.addCsiEvent(event),
  getAllEvents: () => storeInstance.getAllCsiEvents(),
  getEvent: (eventId: string) => storeInstance.getCsiEvent(eventId),
  getPropagatedEvents: (eventId: string) => storeInstance.getPropagatedCsiEvents(eventId),
  getAllPropagatedEvents: () => storeInstance.getAllPropagatedCsiEvents(),
  subscribe: (callback: (events: CSIEvent[]) => void) => storeInstance.subscribe(callback),
  getStatistics: () => storeInstance.getStatistics(),
  deleteEvent: (eventId: string) => {
    const event = storeInstance.getCsiEvent(eventId);
    if (event) {
      storeInstance['csiEvents'].delete(eventId);
      storeInstance['notifySubscribers']();
      return true;
    }
    return false;
  },
  clearAllEvents: () => {
    storeInstance['csiEvents'].clear();
    storeInstance['propagatedCsiEvents'].clear();
    storeInstance['notifySubscribers']();
  }
};

// Export convenience functions for old system
export const createEvent = (input: CreateEventInput) => eventStore.createEvent(input);
export const updateEvent = (input: UpdateEventInput) => eventStore.updateEvent(input);
export const transitionEventState = (input: StateTransitionInput) => eventStore.transitionEventState(input);
export const deleteEvent = (event_id: string, user: string, reason: string) => eventStore.deleteEvent(event_id, user, reason);
export const getEventById = (event_id: string) => eventStore.getEvent(event_id);
export const getEventsByCountry = (country: string) => eventStore.getEventsByCountry(country);
export const getActiveEvents = (country?: string) => eventStore.getActiveEvents(country);
export const getActiveEventsAsOfDate = (country: string | undefined, asOfDate: Date) => eventStore.getActiveEventsAsOfDate(country, asOfDate);
export const getAllEvents = () => eventStore.getAllEvents();
export const getEventsByState = (state: EventState) => eventStore.getEventsByState(state);
export const clearAllEvents = () => eventStore.clear();
export const getEventCount = () => eventStore.getEventCount();
export const addPropagatedEvent = (originEventId: string, propagatedEventId: string) => eventStore.addPropagatedEvent(originEventId, propagatedEventId);
export const getPropagatedEvents = (originEventId: string) => eventStore.getPropagatedEvents(originEventId);
export const hasBeenPropagated = (eventId: string) => eventStore.hasBeenPropagated(eventId);