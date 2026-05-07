/**
 * SC2: Sanctions & Regulatory Pressure - Authoritative Sources
 * 
 * Integrates authoritative sources for sanctions and export controls:
 * - OFAC (US Treasury)
 * - EU Official Journal
 * - UK OFSI
 * - UN Security Council Sanctions
 * - Global Affairs Canada
 * 
 * @module ingestion/authoritative/sc2Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface SanctionsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface SanctionsIngestionStats {
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
 * SC2 Authoritative Sources Service
 */
export class SC2AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, SanctionsSource>;
  private stats: Map<string, SanctionsIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize sanctions sources
   */
  private initializeSources(): Map<string, SanctionsSource> {
    const sources: SanctionsSource[] = [
      {
        id: 'ofac',
        name: 'OFAC - US Treasury',
        url: 'https://ofac.treasury.gov/rss.xml',
        type: 'rss',
        jurisdiction: 'US',
        credibility: 1.0,
        active: true
      },
      {
        id: 'eu-official-journal',
        name: 'EU Official Journal',
        url: 'https://eur-lex.europa.eu/oj/direct-access.html',
        type: 'scraper',
        jurisdiction: 'EU',
        credibility: 1.0,
        active: true
      },
      {
        id: 'uk-ofsi',
        name: 'UK OFSI Consolidated List',
        url: 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets',
        type: 'api',
        jurisdiction: 'UK',
        credibility: 1.0,
        active: true
      },
      {
        id: 'un-sanctions',
        name: 'UN Security Council Sanctions',
        url: 'https://www.un.org/securitycouncil/sanctions/information',
        type: 'scraper',
        jurisdiction: 'UN',
        credibility: 1.0,
        active: true
      },
      {
        id: 'canada-sanctions',
        name: 'Global Affairs Canada',
        url: 'https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/index.aspx',
        type: 'scraper',
        jurisdiction: 'CA',
        credibility: 0.95,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active SC2 sources
   */
  async ingestAll(): Promise<Map<string, SanctionsIngestionStats>> {
    console.log('Starting SC2 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: SanctionsSource): Promise<void> {
    const startTime = Date.now();
    const stats: SanctionsIngestionStats = {
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

      // Route to appropriate ingestion method
      switch (sourceId) {
        case 'ofac':
          await this.ingestOFAC(source, stats);
          break;
        case 'eu-official-journal':
          await this.ingestEUOfficialJournal(source, stats);
          break;
        case 'uk-ofsi':
          await this.ingestUKOFSI(source, stats);
          break;
        case 'un-sanctions':
          await this.ingestUNSanctions(source, stats);
          break;
        case 'canada-sanctions':
          await this.ingestCanadaSanctions(source, stats);
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
   * Ingest OFAC sanctions RSS feed
   */
  private async ingestOFAC(source: SanctionsSource, stats: SanctionsIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          // Parse OFAC item
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC2_SANCTIONS,
            title: item.title || 'OFAC Sanctions Update',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: 'sanctions_imposed',
            metadata: {
              jurisdiction: source.jurisdiction,
              categories: item.categories || []
            }
          };

          // Store confirmation
          await this.storeConfirmation(confirmation);
          stats.confirmationsProcessed++;

          // Match with provisional events
          const matches = await this.matcher.matchProvisionalEvents(confirmation);
          stats.matchesFound += matches.length;

          // Trigger confirmations for high-confidence matches
          for (const match of matches) {
            if (match.confidence > 0.8) {
              await this.matcher.confirmEvent(match.eventId, confirmation.sourceId);
              stats.eventsConfirmed++;
            }
          }

        } catch (error) {
          console.error('Error processing OFAC item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching OFAC feed:', error);
      throw error;
    }
  }

  /**
   * Ingest EU Official Journal (placeholder - requires scraping)
   */
  private async ingestEUOfficialJournal(
    source: SanctionsSource,
    stats: SanctionsIngestionStats
  ): Promise<void> {
    console.log('EU Official Journal ingestion (placeholder - requires web scraping)');
    // TODO: Implement web scraping for EU Official Journal
    // This requires parsing HTML and extracting sanctions announcements
  }

  /**
   * Ingest UK OFSI (placeholder - requires API integration)
   */
  private async ingestUKOFSI(source: SanctionsSource, stats: SanctionsIngestionStats): Promise<void> {
    console.log('UK OFSI ingestion (placeholder - requires API integration)');
    // TODO: Implement UK OFSI API integration
  }

  /**
   * Ingest UN Security Council Sanctions (placeholder)
   */
  private async ingestUNSanctions(
    source: SanctionsSource,
    stats: SanctionsIngestionStats
  ): Promise<void> {
    console.log('UN Sanctions ingestion (placeholder - requires web scraping)');
    // TODO: Implement UN sanctions scraping
  }

  /**
   * Ingest Canada sanctions (placeholder)
   */
  private async ingestCanadaSanctions(
    source: SanctionsSource,
    stats: SanctionsIngestionStats
  ): Promise<void> {
    console.log('Canada sanctions ingestion (placeholder - requires web scraping)');
    // TODO: Implement Canada sanctions scraping
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    // Common country name to ISO code mapping
    const countryMap: Record<string, string> = {
      'russia': 'RUS',
      'russian': 'RUS',
      'china': 'CHN',
      'chinese': 'CHN',
      'iran': 'IRN',
      'iranian': 'IRN',
      'north korea': 'PRK',
      'dprk': 'PRK',
      'syria': 'SYR',
      'syrian': 'SYR',
      'venezuela': 'VEN',
      'venezuelan': 'VEN',
      'belarus': 'BLR',
      'belarusian': 'BLR',
      'cuba': 'CUB',
      'cuban': 'CUB',
      'myanmar': 'MMR',
      'burma': 'MMR'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)]; // Remove duplicates
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing confirmation: ${confirmation.title}`);
    // TODO: Store in database (escalation_signals table with authoritative flag)
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): SanctionsSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): SanctionsSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, SanctionsIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc2AuthoritativeSources = new SC2AuthoritativeSources();