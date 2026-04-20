/**
 * SC6: Public Unrest & Labor Instability - Authoritative Sources
 * 
 * Integrates authoritative sources for social unrest and protests:
 * - Official emergency declarations
 * - Interior ministry announcements
 * - ACLED protest data
 * 
 * @module ingestion/authoritative/sc6Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface UnrestSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface UnrestIngestionStats {
  sourceId: string;
  confirmationsFound: number;
  confirmationsProcessed: number;
  matchesFound: number;
  eventsConfirmed: number;
  errors: number;
  duration: number;
  timestamp: Date;
}

/**
 * SC6 Authoritative Sources Service
 */
export class SC6AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, UnrestSource>;
  private stats: Map<string, UnrestIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize unrest sources
   */
  private initializeSources(): Map<string, UnrestSource> {
    const sources: UnrestSource[] = [
      {
        id: 'emergency-declarations',
        name: 'Emergency Declarations Tracker',
        url: 'https://www.example.com/emergency-declarations',
        type: 'scraper',
        jurisdiction: 'MULTI',
        credibility: 1.0,
        active: false // Placeholder
      },
      {
        id: 'interior-ministries',
        name: 'Interior Ministry Announcements',
        url: 'https://www.example.com/interior-ministries',
        type: 'scraper',
        jurisdiction: 'MULTI',
        credibility: 0.95,
        active: false // Placeholder
      },
      {
        id: 'acled-protests',
        name: 'ACLED Protest Data',
        url: 'https://api.acleddata.com/acled/read',
        type: 'api',
        jurisdiction: 'INTL',
        credibility: 0.95,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active SC6 sources
   */
  async ingestAll(): Promise<Map<string, UnrestIngestionStats>> {
    console.log('Starting SC6 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: UnrestSource): Promise<void> {
    const startTime = Date.now();
    const stats: UnrestIngestionStats = {
      sourceId,
      confirmationsFound: 0,
      confirmationsProcessed: 0,
      matchesFound: 0,
      eventsConfirmed: 0,
      errors: 0,
      duration: 0,
      timestamp: new Date()
    };

    try {
      console.log(`Ingesting from ${source.name}`);

      switch (sourceId) {
        case 'emergency-declarations':
          await this.ingestEmergencyDeclarations(source, stats);
          break;
        case 'interior-ministries':
          await this.ingestInteriorMinistries(source, stats);
          break;
        case 'acled-protests':
          await this.ingestACLEDProtests(source, stats);
          break;
        default:
          console.warn(`Unknown source: ${sourceId}`);
      }

      stats.duration = Date.now() - startTime;
      this.stats.set(sourceId, stats);

      console.log(`Completed ${source.name}:`, stats);

    } catch (error) {
      console.error(`Failed to ingest from ${source.name}:`, error);
      stats.errors++;
      stats.duration = Date.now() - startTime;
      this.stats.set(sourceId, stats);
    }
  }

  /**
   * Ingest emergency declarations (placeholder)
   */
  private async ingestEmergencyDeclarations(source: UnrestSource, stats: UnrestIngestionStats): Promise<void> {
    console.log('Emergency declarations ingestion (placeholder - requires aggregation)');
    // TODO: Aggregate emergency declarations from multiple government sources
  }

  /**
   * Ingest interior ministry announcements (placeholder)
   */
  private async ingestInteriorMinistries(source: UnrestSource, stats: UnrestIngestionStats): Promise<void> {
    console.log('Interior ministries ingestion (placeholder - requires aggregation)');
    // TODO: Aggregate interior ministry announcements from major countries
  }

  /**
   * Ingest ACLED protest data (placeholder - requires API key)
   */
  private async ingestACLEDProtests(source: UnrestSource, stats: UnrestIngestionStats): Promise<void> {
    console.log('ACLED protests ingestion (placeholder - requires API integration)');
    // TODO: Implement ACLED API integration
    // Requires API key from https://acleddata.com/
    // Filter for event_type = 'Protests' and 'Riots'
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    const countryMap: Record<string, string> = {
      'france': 'FRA',
      'french': 'FRA',
      'iran': 'IRN',
      'iranian': 'IRN',
      'myanmar': 'MMR',
      'burma': 'MMR',
      'hong kong': 'HKG',
      'thailand': 'THA',
      'thai': 'THA',
      'lebanon': 'LBN',
      'lebanese': 'LBN',
      'chile': 'CHL',
      'chilean': 'CHL',
      'colombia': 'COL',
      'colombian': 'COL'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)];
  }

  /**
   * Classify unrest event type
   */
  private classifyUnrestEventType(title: string): string {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('protest') || normalizedTitle.includes('demonstration')) {
      return 'protest';
    }
    if (normalizedTitle.includes('riot') || normalizedTitle.includes('violence')) {
      return 'riot';
    }
    if (normalizedTitle.includes('strike') || normalizedTitle.includes('labor')) {
      return 'labor_strike';
    }
    if (normalizedTitle.includes('emergency') || normalizedTitle.includes('curfew')) {
      return 'emergency_declaration';
    }

    return 'social_unrest';
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing SC6 confirmation: ${confirmation.title}`);
    // TODO: Store in database
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): UnrestSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): UnrestSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, UnrestIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc6AuthoritativeSources = new SC6AuthoritativeSources();