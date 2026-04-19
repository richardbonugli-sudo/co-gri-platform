/**
 * SC5: Cyber & Data Sovereignty - Authoritative Sources
 * 
 * Integrates authoritative sources for cyber incidents and data sovereignty:
 * - CISA (US Cybersecurity & Infrastructure Security Agency)
 * - ENISA (European Union Agency for Cybersecurity)
 * - NetBlocks Internet Observatory
 * - Government cyber incident statements
 * 
 * @module ingestion/authoritative/sc5Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface CyberSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface CyberIngestionStats {
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
 * SC5 Authoritative Sources Service
 */
export class SC5AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, CyberSource>;
  private stats: Map<string, CyberIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize cyber sources
   */
  private initializeSources(): Map<string, CyberSource> {
    const sources: CyberSource[] = [
      {
        id: 'cisa',
        name: 'CISA Cyber Alerts',
        url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
        type: 'rss',
        jurisdiction: 'US',
        credibility: 1.0,
        active: true
      },
      {
        id: 'enisa',
        name: 'ENISA Bulletins',
        url: 'https://www.enisa.europa.eu/topics/csirts-in-europe/glossary/rss',
        type: 'rss',
        jurisdiction: 'EU',
        credibility: 0.95,
        active: true
      },
      {
        id: 'netblocks',
        name: 'NetBlocks Internet Observatory',
        url: 'https://netblocks.org/feed',
        type: 'rss',
        jurisdiction: 'INTL',
        credibility: 0.9,
        active: true
      },
      {
        id: 'gov-cyber',
        name: 'Government Cyber Statements',
        url: 'https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml',
        type: 'rss',
        jurisdiction: 'MULTI',
        credibility: 0.95,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active SC5 sources
   */
  async ingestAll(): Promise<Map<string, CyberIngestionStats>> {
    console.log('Starting SC5 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: CyberSource): Promise<void> {
    const startTime = Date.now();
    const stats: CyberIngestionStats = {
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
        case 'cisa':
          await this.ingestCISA(source, stats);
          break;
        case 'enisa':
          await this.ingestENISA(source, stats);
          break;
        case 'netblocks':
          await this.ingestNetBlocks(source, stats);
          break;
        case 'gov-cyber':
          await this.ingestGovCyber(source, stats);
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
   * Ingest CISA cyber alerts
   */
  private async ingestCISA(source: CyberSource, stats: CyberIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC5_CYBER,
            title: item.title || 'CISA Cyber Alert',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyCyberEventType(item.title || ''),
            metadata: {
              jurisdiction: source.jurisdiction,
              categories: item.categories || []
            }
          };

          await this.storeConfirmation(confirmation);
          stats.confirmationsProcessed++;

          const matches = await this.matcher.matchProvisionalEvents(confirmation);
          stats.matchesFound += matches.length;

          for (const match of matches) {
            if (match.confidence > 0.8) {
              await this.matcher.confirmEvent(match.eventId, confirmation.sourceId);
              stats.eventsConfirmed++;
            }
          }

        } catch (error) {
          console.error('Error processing CISA item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching CISA feed:', error);
      throw error;
    }
  }

  /**
   * Ingest ENISA bulletins
   */
  private async ingestENISA(source: CyberSource, stats: CyberIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC5_CYBER,
            title: item.title || 'ENISA Bulletin',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyCyberEventType(item.title || ''),
            metadata: {
              jurisdiction: source.jurisdiction,
              categories: item.categories || []
            }
          };

          await this.storeConfirmation(confirmation);
          stats.confirmationsProcessed++;

          const matches = await this.matcher.matchProvisionalEvents(confirmation);
          stats.matchesFound += matches.length;

          for (const match of matches) {
            if (match.confidence > 0.8) {
              await this.matcher.confirmEvent(match.eventId, confirmation.sourceId);
              stats.eventsConfirmed++;
            }
          }

        } catch (error) {
          console.error('Error processing ENISA item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching ENISA feed:', error);
      throw error;
    }
  }

  /**
   * Ingest NetBlocks internet observatory
   */
  private async ingestNetBlocks(source: CyberSource, stats: CyberIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC5_CYBER,
            title: item.title || 'NetBlocks Report',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: 'internet_shutdown',
            metadata: {
              jurisdiction: source.jurisdiction,
              categories: item.categories || []
            }
          };

          await this.storeConfirmation(confirmation);
          stats.confirmationsProcessed++;

          const matches = await this.matcher.matchProvisionalEvents(confirmation);
          stats.matchesFound += matches.length;

          for (const match of matches) {
            if (match.confidence > 0.8) {
              await this.matcher.confirmEvent(match.eventId, confirmation.sourceId);
              stats.eventsConfirmed++;
            }
          }

        } catch (error) {
          console.error('Error processing NetBlocks item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching NetBlocks feed:', error);
      throw error;
    }
  }

  /**
   * Ingest government cyber statements (placeholder)
   */
  private async ingestGovCyber(source: CyberSource, stats: CyberIngestionStats): Promise<void> {
    console.log('Government cyber statements ingestion (placeholder)');
    // TODO: Aggregate multiple government cyber incident feeds
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    const countryMap: Record<string, string> = {
      'russia': 'RUS',
      'russian': 'RUS',
      'china': 'CHN',
      'chinese': 'CHN',
      'iran': 'IRN',
      'iranian': 'IRN',
      'north korea': 'PRK',
      'dprk': 'PRK',
      'ukraine': 'UKR',
      'ukrainian': 'UKR',
      'india': 'IND',
      'indian': 'IND',
      'myanmar': 'MMR',
      'burma': 'MMR',
      'turkey': 'TUR',
      'turkish': 'TUR'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)];
  }

  /**
   * Classify cyber event type
   */
  private classifyCyberEventType(title: string): string {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('ransomware') || normalizedTitle.includes('malware')) {
      return 'ransomware_attack';
    }
    if (normalizedTitle.includes('data breach') || normalizedTitle.includes('breach')) {
      return 'data_breach';
    }
    if (normalizedTitle.includes('ddos') || normalizedTitle.includes('denial of service')) {
      return 'ddos_attack';
    }
    if (normalizedTitle.includes('vulnerability') || normalizedTitle.includes('cve')) {
      return 'vulnerability_disclosure';
    }
    if (normalizedTitle.includes('internet shutdown') || normalizedTitle.includes('connectivity')) {
      return 'internet_shutdown';
    }

    return 'cyber_incident';
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing SC5 confirmation: ${confirmation.title}`);
    // TODO: Store in database
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): CyberSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): CyberSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, CyberIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc5AuthoritativeSources = new SC5AuthoritativeSources();