/**
 * SC3: Trade & Logistics Disruption - Authoritative Sources
 * 
 * Integrates authoritative sources for trade policy and export controls:
 * - USTR (US Trade Representative)
 * - BIS (Bureau of Industry and Security)
 * - MOFCOM (China Ministry of Commerce)
 * - China Customs
 * - WTO Dispute Settlement
 * - EU Trade Policy
 * 
 * @module ingestion/authoritative/sc3Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface TradeSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface TradeIngestionStats {
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
 * SC3 Authoritative Sources Service
 */
export class SC3AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, TradeSource>;
  private stats: Map<string, TradeIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize trade sources
   */
  private initializeSources(): Map<string, TradeSource> {
    const sources: TradeSource[] = [
      {
        id: 'ustr',
        name: 'USTR - US Trade Representative',
        url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
        type: 'scraper',
        jurisdiction: 'US',
        credibility: 1.0,
        active: true
      },
      {
        id: 'bis',
        name: 'BIS - Bureau of Industry and Security',
        url: 'https://www.bis.doc.gov/index.php/documents/rss',
        type: 'rss',
        jurisdiction: 'US',
        credibility: 1.0,
        active: true
      },
      {
        id: 'mofcom',
        name: 'China MOFCOM',
        url: 'http://english.mofcom.gov.cn/rss/LatestNews.xml',
        type: 'rss',
        jurisdiction: 'CN',
        credibility: 0.95,
        active: true
      },
      {
        id: 'china-customs',
        name: 'China Customs',
        url: 'http://english.customs.gov.cn/',
        type: 'scraper',
        jurisdiction: 'CN',
        credibility: 0.95,
        active: true
      },
      {
        id: 'wto',
        name: 'WTO Dispute Settlement',
        url: 'https://www.wto.org/english/tratop_e/dispu_e/dispu_e.htm',
        type: 'scraper',
        jurisdiction: 'INTL',
        credibility: 1.0,
        active: true
      },
      {
        id: 'eu-trade',
        name: 'EU Trade Policy',
        url: 'https://policy.trade.ec.europa.eu/news_en',
        type: 'scraper',
        jurisdiction: 'EU',
        credibility: 1.0,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active SC3 sources
   */
  async ingestAll(): Promise<Map<string, TradeIngestionStats>> {
    console.log('Starting SC3 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: TradeSource): Promise<void> {
    const startTime = Date.now();
    const stats: TradeIngestionStats = {
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
        case 'ustr':
          await this.ingestUSTR(source, stats);
          break;
        case 'bis':
          await this.ingestBIS(source, stats);
          break;
        case 'mofcom':
          await this.ingestMOFCOM(source, stats);
          break;
        case 'china-customs':
          await this.ingestChinaCustoms(source, stats);
          break;
        case 'wto':
          await this.ingestWTO(source, stats);
          break;
        case 'eu-trade':
          await this.ingestEUTrade(source, stats);
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
   * Ingest USTR press releases (placeholder - requires scraping)
   */
  private async ingestUSTR(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    console.log('USTR ingestion (placeholder - requires web scraping)');
    // TODO: Implement USTR web scraping
    // Key event types: tariff announcements, trade agreement updates, Section 301 actions
  }

  /**
   * Ingest BIS export control notices
   */
  private async ingestBIS(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC3_TRADE,
            title: item.title || 'BIS Export Control Update',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyTradeEventType(item.title || ''),
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
          console.error('Error processing BIS item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching BIS feed:', error);
      throw error;
    }
  }

  /**
   * Ingest MOFCOM announcements
   */
  private async ingestMOFCOM(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC3_TRADE,
            title: item.title || 'MOFCOM Announcement',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: ['CHN', ...this.extractCountriesFromText(item.title + ' ' + item.description)],
            eventType: this.classifyTradeEventType(item.title || ''),
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
          console.error('Error processing MOFCOM item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching MOFCOM feed:', error);
      throw error;
    }
  }

  /**
   * Ingest China Customs notices (placeholder)
   */
  private async ingestChinaCustoms(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    console.log('China Customs ingestion (placeholder - requires web scraping)');
    // TODO: Implement China Customs scraping
  }

  /**
   * Ingest WTO dispute filings (placeholder)
   */
  private async ingestWTO(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    console.log('WTO ingestion (placeholder - requires web scraping)');
    // TODO: Implement WTO dispute settlement scraping
  }

  /**
   * Ingest EU trade policy (placeholder)
   */
  private async ingestEUTrade(source: TradeSource, stats: TradeIngestionStats): Promise<void> {
    console.log('EU Trade Policy ingestion (placeholder - requires web scraping)');
    // TODO: Implement EU trade policy scraping
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    const countryMap: Record<string, string> = {
      'china': 'CHN',
      'chinese': 'CHN',
      'russia': 'RUS',
      'russian': 'RUS',
      'united states': 'USA',
      'america': 'USA',
      'european union': 'EU',
      'europe': 'EU',
      'japan': 'JPN',
      'japanese': 'JPN',
      'korea': 'KOR',
      'korean': 'KOR',
      'india': 'IND',
      'indian': 'IND',
      'mexico': 'MEX',
      'mexican': 'MEX',
      'canada': 'CAN',
      'canadian': 'CAN',
      'brazil': 'BRA',
      'brazilian': 'BRA'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)];
  }

  /**
   * Classify trade event type
   */
  private classifyTradeEventType(title: string): string {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('tariff') || normalizedTitle.includes('duty')) {
      return 'tariff_imposed';
    }
    if (normalizedTitle.includes('export control') || normalizedTitle.includes('export restriction')) {
      return 'export_control';
    }
    if (normalizedTitle.includes('trade agreement') || normalizedTitle.includes('fta')) {
      return 'trade_agreement';
    }
    if (normalizedTitle.includes('dispute') || normalizedTitle.includes('wto')) {
      return 'trade_dispute';
    }
    if (normalizedTitle.includes('quota') || normalizedTitle.includes('restriction')) {
      return 'trade_restriction';
    }

    return 'trade_policy_change';
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing SC3 confirmation: ${confirmation.title}`);
    // TODO: Store in database
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): TradeSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): TradeSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, TradeIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc3AuthoritativeSources = new SC3AuthoritativeSources();