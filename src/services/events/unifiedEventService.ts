/**
 * Unified Event Service
 * 
 * Single source of truth for all geopolitical events across the platform.
 * Integrates real geopolitical events database with real-time event processing.
 * Eliminates mock/synthetic event generators for internal consistency.
 * 
 * Architecture:
 * - Real geopolitical events (GEOPOLITICAL_EVENTS database)
 * - Real-time event processor (live event ingestion)
 * - Company-specific filtering (for Company Mode)
 * - Country-specific filtering (for Country Dashboard)
 */

import {
  GEOPOLITICAL_EVENTS,
  getEventsByTimeWindow,
  getEventsByCountry,
  formatEventDate,
  type GeopoliticalEvent,
  type EventCategory,
  type EventSeverity
} from '@/data/geopoliticalEvents';
import { 
  realTimeEventProcessor, 
  type ProcessedEvent 
} from '@/services/csi/realTimeEventProcessor';
import type { TimeWindow } from '@/store/globalDashboardState';

/**
 * Unified Event Interface
 * Compatible with both dashboard views
 */
export interface UnifiedEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  region: string;
  date: Date;
  category: EventCategory;
  severity: EventSeverity;
  deltaCSI: number;
  vectors: string[];
  relatedCountries?: string[];
  isOngoing?: boolean;
  isLive?: boolean;
  sources?: string[];
  // Company-specific fields
  companyRelevance?: number;  // 0-1 score for company exposure
  affectedSectors?: string[];
  impactScore?: number;
}

/**
 * Company Exposure Profile
 * Defines how a company is exposed to geopolitical events
 */
export interface CompanyExposureProfile {
  ticker: string;
  name: string;
  primaryCountries: string[];      // Countries with major operations
  supplyChainCountries: string[];  // Supply chain exposure
  marketCountries: string[];       // Market/revenue exposure
  sectors: string[];               // Industry sectors
  riskVectors: EventCategory[];   // Most relevant risk vectors
}

class UnifiedEventService {
  private companyProfiles: Map<string, CompanyExposureProfile> = new Map();

  constructor() {
    this.initializeCompanyProfiles();
  }

  /**
   * Initialize company exposure profiles
   * In production, this would come from a database
   */
  private initializeCompanyProfiles(): void {
    // Example profiles - expand as needed
    this.companyProfiles.set('AAPL', {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      primaryCountries: ['United States', 'China', 'Ireland'],
      supplyChainCountries: ['China', 'Taiwan', 'South Korea', 'Japan', 'Vietnam'],
      marketCountries: ['United States', 'China', 'Japan', 'United Kingdom', 'Germany'],
      sectors: ['Technology', 'Electronics', 'Semiconductors'],
      riskVectors: ['Trade', 'Sanctions', 'Regulatory', 'Cyber', 'Conflict']
    });

    this.companyProfiles.set('TSLA', {
      ticker: 'TSLA',
      name: 'Tesla Inc.',
      primaryCountries: ['United States', 'China', 'Germany'],
      supplyChainCountries: ['China', 'Japan', 'South Korea', 'Australia'],
      marketCountries: ['United States', 'China', 'Germany', 'United Kingdom', 'Norway'],
      sectors: ['Automotive', 'Technology', 'Energy'],
      riskVectors: ['Trade', 'Regulatory', 'Infrastructure', 'Economic Policy']
    });

    this.companyProfiles.set('MSFT', {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      primaryCountries: ['United States', 'Ireland', 'Singapore'],
      supplyChainCountries: ['China', 'Taiwan', 'South Korea', 'Malaysia'],
      marketCountries: ['United States', 'China', 'Japan', 'United Kingdom', 'Germany'],
      sectors: ['Technology', 'Software', 'Cloud Computing'],
      riskVectors: ['Cyber', 'Regulatory', 'Trade', 'Sanctions']
    });
  }

  /**
   * Get all events (historical + live) for a specific country
   */
  getCountryEvents(
    country: string,
    timeWindow: TimeWindow = '30D',
    includeLive: boolean = true
  ): UnifiedEvent[] {
    // Get historical events
    const historicalEvents = getEventsByCountry(country, timeWindow);
    
    // Get live events
    const liveEvents = includeLive 
      ? this.getLiveEventsForCountry(country)
      : [];

    // Convert to unified format
    const unified = [
      ...this.convertHistoricalEvents(historicalEvents),
      ...liveEvents
    ];

    // Sort by date (most recent first)
    return unified.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get all events (historical + live) for a specific company
   * Filters events based on company exposure profile
   */
  getCompanyEvents(
    ticker: string,
    timeWindow: TimeWindow = '30D',
    includeLive: boolean = true
  ): UnifiedEvent[] {
    const profile = this.companyProfiles.get(ticker.toUpperCase());
    
    if (!profile) {
      console.warn(`[Unified Event Service] No exposure profile found for ${ticker}`);
      // Return global events as fallback
      return this.getGlobalEvents(timeWindow, includeLive);
    }

    // Get all events in time window
    const allEvents = getEventsByTimeWindow(timeWindow);
    
    // Filter events relevant to company
    const relevantHistorical = allEvents.filter(event => 
      this.isEventRelevantToCompany(event, profile)
    );

    // Get live events
    const liveEvents = includeLive
      ? this.getLiveEventsForCompany(profile)
      : [];

    // Convert and score by relevance
    const unified = [
      ...this.convertHistoricalEvents(relevantHistorical, profile),
      ...liveEvents
    ];

    // Sort by relevance score and date
    return unified.sort((a, b) => {
      // Live events first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // Then by relevance score
      const scoreA = a.companyRelevance || 0;
      const scoreB = b.companyRelevance || 0;
      if (Math.abs(scoreA - scoreB) > 0.01) {
        return scoreB - scoreA;
      }
      
      // Finally by date
      return b.date.getTime() - a.date.getTime();
    });
  }

  /**
   * Get global events (no filtering)
   */
  getGlobalEvents(
    timeWindow: TimeWindow = '30D',
    includeLive: boolean = true
  ): UnifiedEvent[] {
    const historicalEvents = getEventsByTimeWindow(timeWindow);
    const liveEvents = includeLive 
      ? this.getAllLiveEvents()
      : [];

    const unified = [
      ...this.convertHistoricalEvents(historicalEvents),
      ...liveEvents
    ];

    return unified.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Check if an event is relevant to a company
   */
  private isEventRelevantToCompany(
    event: GeopoliticalEvent,
    profile: CompanyExposureProfile
  ): boolean {
    // Check if event country matches company exposure
    const allExposureCountries = [
      ...profile.primaryCountries,
      ...profile.supplyChainCountries,
      ...profile.marketCountries
    ];

    const countryMatch = 
      allExposureCountries.includes(event.country) ||
      event.relatedCountries?.some(c => allExposureCountries.includes(c));

    // Check if event category matches company risk vectors
    const vectorMatch = profile.riskVectors.includes(event.category);

    // Event is relevant if it matches country OR vector
    return countryMatch || vectorMatch;
  }

  /**
   * Calculate company relevance score for an event
   */
  private calculateCompanyRelevance(
    event: GeopoliticalEvent,
    profile: CompanyExposureProfile
  ): number {
    let score = 0;

    // Primary country: highest relevance (0.8)
    if (profile.primaryCountries.includes(event.country)) {
      score = Math.max(score, 0.8);
    }

    // Supply chain country: high relevance (0.6)
    if (profile.supplyChainCountries.includes(event.country)) {
      score = Math.max(score, 0.6);
    }

    // Market country: medium relevance (0.4)
    if (profile.marketCountries.includes(event.country)) {
      score = Math.max(score, 0.4);
    }

    // Related countries: lower relevance (0.3)
    if (event.relatedCountries?.some(c => 
      profile.primaryCountries.includes(c) ||
      profile.supplyChainCountries.includes(c) ||
      profile.marketCountries.includes(c)
    )) {
      score = Math.max(score, 0.3);
    }

    // Boost score if event category matches company risk vectors
    if (profile.riskVectors.includes(event.category)) {
      score = Math.min(1.0, score + 0.2);
    }

    return score;
  }

  /**
   * Convert historical events to unified format
   */
  private convertHistoricalEvents(
    events: GeopoliticalEvent[],
    profile?: CompanyExposureProfile
  ): UnifiedEvent[] {
    return events.map(event => {
      const companyRelevance = profile 
        ? this.calculateCompanyRelevance(event, profile)
        : undefined;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        country: event.country,
        region: event.region,
        date: event.date,
        category: event.category,
        severity: event.severity,
        deltaCSI: event.deltaCSI,
        vectors: [event.category], // Convert category to vector array
        relatedCountries: event.relatedCountries,
        isOngoing: event.isOngoing,
        isLive: false,
        sources: [],
        companyRelevance,
        impactScore: Math.abs(event.deltaCSI) * (companyRelevance || 1.0)
      };
    });
  }

  /**
   * Get live events for a specific country
   */
  private getLiveEventsForCountry(country: string): UnifiedEvent[] {
    const liveEvents = realTimeEventProcessor.getAllProcessedEvents();
    
    return liveEvents
      .filter(event => 
        event.normalizedEvent.country === country ||
        event.propagation.effects.some(e => e.targetCountry === country)
      )
      .map(event => this.convertLiveEvent(event));
  }

  /**
   * Get live events for a specific company
   */
  private getLiveEventsForCompany(profile: CompanyExposureProfile): UnifiedEvent[] {
    const liveEvents = realTimeEventProcessor.getAllProcessedEvents();
    
    return liveEvents
      .filter(event => {
        const allCountries = [
          ...profile.primaryCountries,
          ...profile.supplyChainCountries,
          ...profile.marketCountries
        ];
        
        return allCountries.includes(event.normalizedEvent.country) ||
               event.propagation.effects.some(e => allCountries.includes(e.targetCountry));
      })
      .map(event => this.convertLiveEvent(event, profile));
  }

  /**
   * Get all live events
   */
  private getAllLiveEvents(): UnifiedEvent[] {
    const liveEvents = realTimeEventProcessor.getAllProcessedEvents();
    return liveEvents.map(event => this.convertLiveEvent(event));
  }

  /**
   * Convert live event to unified format
   */
  private convertLiveEvent(
    event: ProcessedEvent,
    profile?: CompanyExposureProfile
  ): UnifiedEvent {
    const geopoliticalEvent: GeopoliticalEvent = {
      id: event.id,
      title: event.normalizedEvent.headline,
      description: event.normalizedEvent.description,
      country: event.normalizedEvent.country,
      region: event.normalizedEvent.region,
      date: event.normalizedEvent.timestamp,
      category: event.classification.primaryVector.vector,
      severity: event.classification.severity,
      deltaCSI: event.classification.estimatedDeltaCSI,
      vectorImpacts: {},
      relatedCountries: event.propagation.effects.map(e => e.targetCountry),
      isOngoing: event.lifecycleState !== 'resolved'
    };

    const companyRelevance = profile
      ? this.calculateCompanyRelevance(geopoliticalEvent, profile)
      : undefined;

    return {
      id: event.id,
      title: event.normalizedEvent.headline,
      description: event.normalizedEvent.description,
      country: event.normalizedEvent.country,
      region: event.normalizedEvent.region,
      date: event.normalizedEvent.timestamp,
      category: event.classification.primaryVector.vector,
      severity: event.classification.severity,
      deltaCSI: event.classification.estimatedDeltaCSI,
      vectors: [event.classification.primaryVector.vector],
      relatedCountries: event.propagation.effects.map(e => e.targetCountry),
      isOngoing: event.lifecycleState !== 'resolved',
      isLive: true,
      sources: [event.normalizedEvent.source],
      companyRelevance,
      impactScore: Math.abs(event.classification.estimatedDeltaCSI) * (companyRelevance || 1.0)
    };
  }

  /**
   * Register a new company exposure profile
   */
  registerCompanyProfile(profile: CompanyExposureProfile): void {
    this.companyProfiles.set(profile.ticker.toUpperCase(), profile);
  }

  /**
   * Get company exposure profile
   */
  getCompanyProfile(ticker: string): CompanyExposureProfile | undefined {
    return this.companyProfiles.get(ticker.toUpperCase());
  }

  /**
   * Get all registered companies
   */
  getAllCompanyTickers(): string[] {
    return Array.from(this.companyProfiles.keys());
  }

  /**
   * Subscribe to real-time event updates
   */
  subscribeToLiveEvents(callback: (event: UnifiedEvent) => void): () => void {
    return realTimeEventProcessor.subscribe((update) => {
      if (update.type === 'event_processed' && update.data) {
        const processedEvent = update.data as ProcessedEvent;
        const unifiedEvent = this.convertLiveEvent(processedEvent);
        callback(unifiedEvent);
      }
    });
  }

  /**
   * Get event statistics
   */
  getEventStats(events: UnifiedEvent[]): {
    total: number;
    bySeverity: Record<EventSeverity, number>;
    byCategory: Record<EventCategory, number>;
    liveCount: number;
    avgImpact: number;
  } {
    const stats = {
      total: events.length,
      bySeverity: {} as Record<EventSeverity, number>,
      byCategory: {} as Record<EventCategory, number>,
      liveCount: events.filter(e => e.isLive).length,
      avgImpact: events.reduce((sum, e) => sum + Math.abs(e.deltaCSI), 0) / (events.length || 1)
    };

    events.forEach(event => {
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
export const unifiedEventService = new UnifiedEventService();

// Export convenience functions
export const getCountryEvents = (country: string, timeWindow?: TimeWindow, includeLive?: boolean) =>
  unifiedEventService.getCountryEvents(country, timeWindow, includeLive);

export const getCompanyEvents = (ticker: string, timeWindow?: TimeWindow, includeLive?: boolean) =>
  unifiedEventService.getCompanyEvents(ticker, timeWindow, includeLive);

export const getGlobalEvents = (timeWindow?: TimeWindow, includeLive?: boolean) =>
  unifiedEventService.getGlobalEvents(timeWindow, includeLive);

export const registerCompanyProfile = (profile: CompanyExposureProfile) =>
  unifiedEventService.registerCompanyProfile(profile);

export const getCompanyProfile = (ticker: string) =>
  unifiedEventService.getCompanyProfile(ticker);