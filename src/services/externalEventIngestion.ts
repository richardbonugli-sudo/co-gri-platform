/**
 * External Event Ingestion Service
 * 
 * Provides infrastructure for integrating external data sources (ACLED, GDELT)
 * into the geopolitical events system. This service handles:
 * - API integration with ACLED and GDELT
 * - Event transformation to GeopoliticalEvent format
 * - Deduplication and merging of events
 * - Rate limiting and error handling
 * 
 * Phase 2 Implementation: Infrastructure preparation
 * Phase 3 Implementation: Live API integration with automated updates
 */

import type { GeopoliticalEvent, EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

/**
 * ACLED Event Format
 * Based on ACLED API documentation: https://acleddata.com/acleddatanew/wp-content/uploads/dlm_uploads/2021/06/ACLED_API-User-Guide_062021.pdf
 */
export interface ACLEDEvent {
  event_id_cnty: string;
  event_date: string;
  year: number;
  time_precision: number;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  assoc_actor_1: string;
  inter1: number;
  actor2: string;
  assoc_actor_2: string;
  inter2: number;
  interaction: number;
  region: string;
  country: string;
  admin1: string;
  admin2: string;
  admin3: string;
  location: string;
  latitude: number;
  longitude: number;
  geo_precision: number;
  source: string;
  source_scale: string;
  notes: string;
  fatalities: number;
  timestamp: number;
  iso3: string;
}

/**
 * GDELT Event Format
 * Based on GDELT 2.0 documentation: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/
 */
export interface GDELTEvent {
  GLOBALEVENTID: string;
  SQLDATE: string;
  MonthYear: string;
  Year: string;
  FractionDate: number;
  Actor1Code: string;
  Actor1Name: string;
  Actor1CountryCode: string;
  Actor1Type1Code: string;
  Actor2Code: string;
  Actor2Name: string;
  Actor2CountryCode: string;
  Actor2Type1Code: string;
  IsRootEvent: number;
  EventCode: string;
  EventBaseCode: string;
  EventRootCode: string;
  QuadClass: number;
  GoldsteinScale: number;
  NumMentions: number;
  NumSources: number;
  NumArticles: number;
  AvgTone: number;
  Actor1Geo_Type: number;
  Actor1Geo_FullName: string;
  Actor1Geo_CountryCode: string;
  Actor1Geo_Lat: number;
  Actor1Geo_Long: number;
  Actor2Geo_Type: number;
  Actor2Geo_FullName: string;
  Actor2Geo_CountryCode: string;
  ActionGeo_Type: number;
  ActionGeo_FullName: string;
  ActionGeo_CountryCode: string;
  ActionGeo_Lat: number;
  ActionGeo_Long: number;
  DATEADDED: string;
  SOURCEURL: string;
}

/**
 * API Configuration
 */
interface APIConfig {
  acled: {
    baseUrl: string;
    apiKey?: string;
    email?: string;
  };
  gdelt: {
    baseUrl: string;
    version: string;
  };
}

/**
 * External Event Ingestion Service
 */
export class ExternalEventIngestion {
  private config: APIConfig;
  private rateLimitDelay: number = 1000; // 1 second between requests

  constructor() {
    // Load configuration from environment variables
    this.config = {
      acled: {
        baseUrl: process.env.NEXT_PUBLIC_ACLED_API_URL || 'https://api.acleddata.com',
        apiKey: process.env.NEXT_PUBLIC_ACLED_API_KEY,
        email: process.env.NEXT_PUBLIC_ACLED_EMAIL
      },
      gdelt: {
        baseUrl: process.env.NEXT_PUBLIC_GDELT_API_URL || 'https://api.gdeltproject.org/api/v2',
        version: '2.0'
      }
    };
  }

  /**
   * Ingest events from ACLED API
   * 
   * @param country - ISO3 country code (e.g., 'USA', 'IRQ', 'CHN')
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of transformed GeopoliticalEvents
   */
  async ingestACLED(
    country: string,
    startDate: string,
    endDate: string
  ): Promise<GeopoliticalEvent[]> {
    try {
      // Validate API configuration
      if (!this.config.acled.apiKey || !this.config.acled.email) {
        throw new Error('ACLED API credentials not configured. Set NEXT_PUBLIC_ACLED_API_KEY and NEXT_PUBLIC_ACLED_EMAIL environment variables.');
      }

      // Construct API request
      const params = new URLSearchParams({
        key: this.config.acled.apiKey,
        email: this.config.acled.email,
        iso: country,
        event_date: startDate,
        event_date_where: `BETWEEN|${startDate}|${endDate}`,
        limit: '500'
      });

      const url = `${this.config.acled.baseUrl}/acled/read?${params.toString()}`;

      // Make API request with rate limiting
      await this.sleep(this.rateLimitDelay);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ACLED API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const acledEvents: ACLEDEvent[] = data.data || [];

      // Transform ACLED events to GeopoliticalEvents
      const geopoliticalEvents = acledEvents.map(event => 
        this.transformACLEDEvent(event)
      );

      // Deduplicate events
      return this.deduplicateEvents(geopoliticalEvents);

    } catch (error) {
      console.error('ACLED ingestion error:', error);
      throw error;
    }
  }

  /**
   * Ingest events from GDELT API
   * 
   * @param country - Country name or code
   * @param startDate - Start date in YYYYMMDDHHMMSS format
   * @param endDate - End date in YYYYMMDDHHMMSS format
   * @returns Array of transformed GeopoliticalEvents
   */
  async ingestGDELT(
    country: string,
    startDate: string,
    endDate: string
  ): Promise<GeopoliticalEvent[]> {
    try {
      // Construct GDELT query
      const query = `${country}`;
      const params = new URLSearchParams({
        query: query,
        mode: 'artlist',
        maxrecords: '250',
        format: 'json',
        startdatetime: startDate,
        enddatetime: endDate
      });

      const url = `${this.config.gdelt.baseUrl}/doc/doc?${params.toString()}`;

      // Make API request with rate limiting
      await this.sleep(this.rateLimitDelay);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const gdeltEvents: GDELTEvent[] = data.articles || [];

      // Transform GDELT events to GeopoliticalEvents
      const geopoliticalEvents = gdeltEvents.map(event => 
        this.transformGDELTEvent(event)
      );

      // Deduplicate events
      return this.deduplicateEvents(geopoliticalEvents);

    } catch (error) {
      console.error('GDELT ingestion error:', error);
      throw error;
    }
  }

  /**
   * Transform ACLED event to GeopoliticalEvent format
   */
  transformACLEDEvent(acledEvent: ACLEDEvent): GeopoliticalEvent {
    // Map ACLED event types to our categories
    const category = this.mapACLEDEventType(acledEvent.event_type, acledEvent.sub_event_type);
    
    // Assess severity based on fatalities and event type
    const severity = this.assessACLEDSeverity(acledEvent);
    
    // Estimate CSI impact
    const deltaCSI = this.estimateACLEDImpact(acledEvent);
    
    // Calculate vector impacts
    const vectorImpacts = this.calculateACLEDVectorImpacts(acledEvent, category);

    return {
      id: `acled-${acledEvent.event_id_cnty}`,
      title: `${acledEvent.event_type}: ${acledEvent.location}`,
      description: acledEvent.notes || `${acledEvent.event_type} event in ${acledEvent.location}`,
      country: acledEvent.country,
      region: acledEvent.region,
      date: new Date(acledEvent.event_date),
      category,
      severity,
      deltaCSI,
      vectorImpacts,
      sources: [acledEvent.source],
      isOngoing: acledEvent.time_precision < 3 // Events with low time precision are likely ongoing
    };
  }

  /**
   * Transform GDELT event to GeopoliticalEvent format
   */
  transformGDELTEvent(gdeltEvent: GDELTEvent): GeopoliticalEvent {
    // Map GDELT event codes to our categories
    const category = this.mapGDELTEventCode(gdeltEvent.EventCode);
    
    // Assess severity based on Goldstein scale and tone
    const severity = this.assessGDELTSeverity(gdeltEvent);
    
    // Estimate CSI impact using Goldstein scale
    const deltaCSI = this.estimateGDELTImpact(gdeltEvent);
    
    // Calculate vector impacts
    const vectorImpacts = this.calculateGDELTVectorImpacts(gdeltEvent, category);

    // Extract country from action location
    const country = this.extractGDELTCountry(gdeltEvent);

    return {
      id: `gdelt-${gdeltEvent.GLOBALEVENTID}`,
      title: `${gdeltEvent.Actor1Name || 'Actor'} - ${gdeltEvent.Actor2Name || 'Event'} in ${gdeltEvent.ActionGeo_FullName}`,
      description: `GDELT event: ${gdeltEvent.EventCode} (Goldstein: ${gdeltEvent.GoldsteinScale}, Tone: ${gdeltEvent.AvgTone})`,
      country,
      region: this.mapCountryToRegion(country),
      date: new Date(gdeltEvent.SQLDATE),
      category,
      severity,
      deltaCSI,
      vectorImpacts,
      sources: [gdeltEvent.SOURCEURL],
      isOngoing: false
    };
  }

  /**
   * Deduplicate events based on similarity
   */
  deduplicateEvents(events: GeopoliticalEvent[]): GeopoliticalEvent[] {
    const uniqueEvents: GeopoliticalEvent[] = [];
    const seenKeys = new Set<string>();

    for (const event of events) {
      // Create a deduplication key based on country, date, and category
      const dateKey = event.date.toISOString().split('T')[0];
      const key = `${event.country}-${dateKey}-${event.category}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueEvents.push(event);
      } else {
        // Merge with existing event if similar
        const existingIndex = uniqueEvents.findIndex(e => 
          e.country === event.country &&
          e.date.toISOString().split('T')[0] === dateKey &&
          e.category === event.category
        );

        if (existingIndex >= 0) {
          // Merge events: combine descriptions and average impacts
          const existing = uniqueEvents[existingIndex];
          existing.description = `${existing.description}; ${event.description}`;
          existing.deltaCSI = (existing.deltaCSI + event.deltaCSI) / 2;
          existing.sources = [...(existing.sources || []), ...(event.sources || [])];
        }
      }
    }

    return uniqueEvents;
  }

  // ==================== HELPER METHODS ====================

  private mapACLEDEventType(eventType: string, subEventType: string): EventCategory {
    const typeMap: Record<string, EventCategory> = {
      'Battles': 'Conflict',
      'Violence against civilians': 'Conflict',
      'Protests': 'Protest',
      'Riots': 'Unrest',
      'Strategic developments': 'Military Posture',
      'Explosions/Remote violence': 'Conflict'
    };

    return typeMap[eventType] || 'Governance';
  }

  private mapGDELTEventCode(eventCode: string): EventCategory {
    // GDELT uses CAMEO codes: https://www.gdeltproject.org/data/documentation/CAMEO.Manual.1.1b3.pdf
    const codePrefix = eventCode.substring(0, 2);
    
    const codeMap: Record<string, EventCategory> = {
      '01': 'Diplomatic',      // Make public statement
      '02': 'Diplomatic',      // Appeal
      '03': 'Diplomatic',      // Express intent to cooperate
      '04': 'Diplomatic',      // Consult
      '05': 'Diplomatic',      // Engage in diplomatic cooperation
      '06': 'Trade',           // Engage in material cooperation
      '07': 'Infrastructure',  // Provide aid
      '08': 'Diplomatic',      // Yield
      '09': 'Diplomatic',      // Investigate
      '10': 'Governance',      // Demand
      '11': 'Sanctions',       // Disapprove
      '12': 'Diplomatic',      // Reject
      '13': 'Sanctions',       // Threaten
      '14': 'Protest',         // Protest
      '15': 'Sanctions',       // Exhibit force posture
      '16': 'Sanctions',       // Reduce relations
      '17': 'Sanctions',       // Coerce
      '18': 'Conflict',        // Assault
      '19': 'Conflict',        // Fight
      '20': 'Conflict'         // Use unconventional mass violence
    };

    return codeMap[codePrefix] || 'Governance';
  }

  private assessACLEDSeverity(event: ACLEDEvent): EventSeverity {
    if (event.fatalities > 50) return 'Critical';
    if (event.fatalities > 10) return 'High';
    if (event.fatalities > 0) return 'Moderate';
    
    // Check event type
    if (event.event_type === 'Battles' || event.event_type === 'Explosions/Remote violence') {
      return 'High';
    }
    
    return 'Low';
  }

  private assessGDELTSeverity(event: GDELTEvent): EventSeverity {
    // Goldstein scale: -10 (most negative) to +10 (most positive)
    const goldstein = Math.abs(event.GoldsteinScale);
    
    if (goldstein > 8) return 'Critical';
    if (goldstein > 5) return 'High';
    if (goldstein > 2) return 'Moderate';
    return 'Low';
  }

  private estimateACLEDImpact(event: ACLEDEvent): number {
    let impact = 0;

    // Base impact on fatalities
    if (event.fatalities > 0) {
      impact += Math.min(event.fatalities * 0.1, 5.0);
    }

    // Adjust based on event type
    const typeMultipliers: Record<string, number> = {
      'Battles': 1.5,
      'Violence against civilians': 1.8,
      'Explosions/Remote violence': 1.6,
      'Protests': 0.5,
      'Riots': 0.8,
      'Strategic developments': 0.6
    };

    const multiplier = typeMultipliers[event.event_type] || 1.0;
    impact *= multiplier;

    return Math.min(impact, 10.0);
  }

  private estimateGDELTImpact(event: GDELTEvent): number {
    // Use Goldstein scale as base (already -10 to +10)
    // Negative Goldstein = increased risk (positive deltaCSI)
    return -event.GoldsteinScale * 0.5;
  }

  private calculateACLEDVectorImpacts(event: ACLEDEvent, category: EventCategory): Record<string, number> {
    const impacts: Record<string, number> = {};
    
    // Distribute impact across relevant vectors
    if (category === 'Conflict') {
      impacts.conflict = event.fatalities > 0 ? Math.min(event.fatalities * 0.2, 8.0) : 2.0;
      impacts.governance = 1.0;
    } else if (category === 'Protest' || category === 'Unrest') {
      impacts.unrest = 2.0;
      impacts.governance = 1.5;
    } else if (category === 'Military Posture') {
      impacts.conflict = 1.5;
      impacts.governance = 0.8;
    }

    return impacts;
  }

  private calculateGDELTVectorImpacts(event: GDELTEvent, category: EventCategory): Record<string, number> {
    const impacts: Record<string, number> = {};
    const magnitude = Math.abs(event.GoldsteinScale) * 0.5;

    // Map category to primary vector
    const vectorMap: Record<EventCategory, string> = {
      'Conflict': 'conflict',
      'Sanctions': 'sanctions',
      'Trade': 'trade',
      'Governance': 'governance',
      'Cyber': 'cyber',
      'Unrest': 'unrest',
      'Currency': 'currency',
      'Protest': 'unrest',
      'Regulatory': 'governance',
      'Diplomatic': 'governance',
      'Infrastructure': 'trade',
      'Economic Policy': 'trade',
      'Military Posture': 'conflict',
      'Corporate': 'trade'
    };

    const primaryVector = vectorMap[category];
    if (primaryVector) {
      impacts[primaryVector] = magnitude;
    }

    return impacts;
  }

  private extractGDELTCountry(event: GDELTEvent): string {
    // Try to get country from action location
    if (event.ActionGeo_CountryCode) {
      return this.mapISO2ToCountryName(event.ActionGeo_CountryCode);
    }
    
    // Fallback to actor countries
    if (event.Actor1CountryCode) {
      return this.mapISO2ToCountryName(event.Actor1CountryCode);
    }
    
    return 'Unknown';
  }

  private mapISO2ToCountryName(iso2: string): string {
    // Simplified mapping - in production, use a complete ISO2 to country name library
    const countryMap: Record<string, string> = {
      'US': 'United States',
      'CN': 'China',
      'RU': 'Russia',
      'IN': 'India',
      'BR': 'Brazil',
      'GB': 'United Kingdom',
      'FR': 'France',
      'DE': 'Germany',
      'JP': 'Japan',
      'KR': 'South Korea',
      'MX': 'Mexico',
      'CA': 'Canada',
      'AU': 'Australia',
      'IQ': 'Iraq',
      'IR': 'Iran',
      'IL': 'Israel',
      'SA': 'Saudi Arabia',
      'TR': 'Turkey',
      'EG': 'Egypt',
      'ZA': 'South Africa'
    };

    return countryMap[iso2] || iso2;
  }

  private mapCountryToRegion(country: string): string {
    // Simplified region mapping
    const regionMap: Record<string, string> = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'China': 'East Asia',
      'Japan': 'East Asia',
      'South Korea': 'East Asia',
      'India': 'South Asia',
      'Pakistan': 'South Asia',
      'Bangladesh': 'South Asia',
      'Russia': 'Eurasia',
      'Ukraine': 'Eastern Europe',
      'Poland': 'Eastern Europe',
      'Germany': 'Western Europe',
      'France': 'Western Europe',
      'United Kingdom': 'Western Europe',
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Chile': 'South America',
      'Iraq': 'Middle East',
      'Iran': 'Middle East',
      'Israel': 'Middle East',
      'Saudi Arabia': 'Middle East',
      'Turkey': 'Middle East',
      'Egypt': 'North Africa',
      'South Africa': 'Southern Africa',
      'Nigeria': 'West Africa',
      'Kenya': 'East Africa',
      'Australia': 'Oceania'
    };

    return regionMap[country] || 'Various';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
export const externalEventIngestion = new ExternalEventIngestion();