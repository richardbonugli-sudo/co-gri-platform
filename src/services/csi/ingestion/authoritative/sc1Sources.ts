/**
 * SC1: Conflict & Security - Authoritative Sources
 * 
 * Integrates authoritative sources for conflict and military events:
 * - UN Security Council
 * - US Department of Defense
 * - UCDP (Uppsala Conflict Data Program)
 * - ACLED (Armed Conflict Location & Event Data)
 * 
 * @module ingestion/authoritative/sc1Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface ConflictSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface ConflictIngestionStats {
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
 * SC1 Authoritative Sources Service
 */
export class SC1AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, ConflictSource>;
  private stats: Map<string, ConflictIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize conflict sources
   */
  private initializeSources(): Map<string, ConflictSource> {
    const sources: ConflictSource[] = [
      {
        id: 'un-security-council',
        name: 'UN Security Council',
        url: 'https://www.un.org/securitycouncil/content/rss',
        type: 'rss',
        jurisdiction: 'UN',
        credibility: 1.0,
        active: true
      },
      {
        id: 'us-dod',
        name: 'US Department of Defense',
        url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945',
        type: 'rss',
        jurisdiction: 'US',
        credibility: 0.95,
        active: true
      },
      {
        id: 'ucdp',
        name: 'UCDP Conflict Data',
        url: 'https://ucdp.uu.se/apidocs/',
        type: 'api',
        jurisdiction: 'INTL',
        credibility: 1.0,
        active: true
      },
      {
        id: 'acled',
        name: 'ACLED Conflict Data',
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
   * Ingest from all active SC1 sources
   */
  async ingestAll(): Promise<Map<string, ConflictIngestionStats>> {
    console.log('Starting SC1 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: ConflictSource): Promise<void> {
    const startTime = Date.now();
    const stats: ConflictIngestionStats = {
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
        case 'un-security-council':
          await this.ingestUNSecurityCouncil(source, stats);
          break;
        case 'us-dod':
          await this.ingestUSDoD(source, stats);
          break;
        case 'ucdp':
          await this.ingestUCDP(source, stats);
          break;
        case 'acled':
          await this.ingestACLED(source, stats);
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
   * Ingest UN Security Council resolutions
   */
  private async ingestUNSecurityCouncil(source: ConflictSource, stats: ConflictIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC1_CONFLICT,
            title: item.title || 'UN Security Council Resolution',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyConflictEventType(item.title || ''),
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
          console.error('Error processing UN Security Council item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching UN Security Council feed:', error);
      throw error;
    }
  }

  /**
   * Ingest US DoD press releases
   */
  private async ingestUSDoD(source: ConflictSource, stats: ConflictIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC1_CONFLICT,
            title: item.title || 'DoD Press Release',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyConflictEventType(item.title || ''),
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
          console.error('Error processing DoD item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching DoD feed:', error);
      throw error;
    }
  }

  /**
   * Ingest UCDP conflict data (placeholder - requires API integration)
   */
  private async ingestUCDP(source: ConflictSource, stats: ConflictIngestionStats): Promise<void> {
    console.log('UCDP ingestion (placeholder - requires API integration)');
    // TODO: Implement UCDP API integration
    // API documentation: https://ucdp.uu.se/apidocs/
  }

  /**
   * Ingest ACLED conflict data (placeholder - requires API integration)
   */
  private async ingestACLED(source: ConflictSource, stats: ConflictIngestionStats): Promise<void> {
    console.log('ACLED ingestion (placeholder - requires API integration)');
    // TODO: Implement ACLED API integration
    // Requires API key from https://acleddata.com/
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    const countryMap: Record<string, string> = {
      'ukraine': 'UKR',
      'ukrainian': 'UKR',
      'russia': 'RUS',
      'russian': 'RUS',
      'syria': 'SYR',
      'syrian': 'SYR',
      'israel': 'ISR',
      'israeli': 'ISR',
      'palestine': 'PSE',
      'palestinian': 'PSE',
      'yemen': 'YEM',
      'yemeni': 'YEM',
      'afghanistan': 'AFG',
      'afghan': 'AFG',
      'iraq': 'IRQ',
      'iraqi': 'IRQ',
      'iran': 'IRN',
      'iranian': 'IRN',
      'north korea': 'PRK',
      'dprk': 'PRK',
      'somalia': 'SOM',
      'somali': 'SOM',
      'sudan': 'SDN',
      'sudanese': 'SDN',
      'ethiopia': 'ETH',
      'ethiopian': 'ETH'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)];
  }

  /**
   * Classify conflict event type
   */
  private classifyConflictEventType(title: string): string {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('military') || normalizedTitle.includes('armed')) {
      return 'military_action';
    }
    if (normalizedTitle.includes('resolution') || normalizedTitle.includes('sanction')) {
      return 'security_council_action';
    }
    if (normalizedTitle.includes('ceasefire') || normalizedTitle.includes('peace')) {
      return 'peace_process';
    }
    if (normalizedTitle.includes('deployment') || normalizedTitle.includes('troops')) {
      return 'troop_deployment';
    }
    if (normalizedTitle.includes('attack') || normalizedTitle.includes('strike')) {
      return 'armed_attack';
    }

    return 'conflict_event';
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing SC1 confirmation: ${confirmation.title}`);
    // TODO: Store in database
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): ConflictSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): ConflictSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, ConflictIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc1AuthoritativeSources = new SC1AuthoritativeSources();