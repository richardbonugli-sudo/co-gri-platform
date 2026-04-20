/**
 * SC7: Currency & Capital Controls - Authoritative Sources
 * 
 * Integrates authoritative sources for monetary policy and capital controls:
 * - Federal Reserve (US)
 * - European Central Bank
 * - Bank of Japan
 * - People's Bank of China
 * - Bank of England
 * - IMF
 * 
 * @module ingestion/authoritative/sc7Sources
 */

import Parser from 'rss-parser';
import { ConfirmationEvent, ConfirmationMatcher } from './confirmationMatcher';
import { RiskVector } from '../../routing/vectorRouter';

export interface CurrencySource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  jurisdiction: string;
  credibility: number;
  active: boolean;
}

export interface CurrencyIngestionStats {
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
 * SC7 Authoritative Sources Service
 */
export class SC7AuthoritativeSources {
  private matcher: ConfirmationMatcher;
  private parser: Parser;
  private sources: Map<string, CurrencySource>;
  private stats: Map<string, CurrencyIngestionStats>;

  constructor() {
    this.matcher = new ConfirmationMatcher();
    this.parser = new Parser({ timeout: 30000 });
    this.sources = this.initializeSources();
    this.stats = new Map();
  }

  /**
   * Initialize currency sources
   */
  private initializeSources(): Map<string, CurrencySource> {
    const sources: CurrencySource[] = [
      {
        id: 'fed',
        name: 'Federal Reserve',
        url: 'https://www.federalreserve.gov/feeds/press_all.xml',
        type: 'rss',
        jurisdiction: 'US',
        credibility: 1.0,
        active: true
      },
      {
        id: 'ecb',
        name: 'European Central Bank',
        url: 'https://www.ecb.europa.eu/rss/press.html',
        type: 'rss',
        jurisdiction: 'EU',
        credibility: 1.0,
        active: true
      },
      {
        id: 'boj',
        name: 'Bank of Japan',
        url: 'https://www.boj.or.jp/en/rss/index.htm',
        type: 'rss',
        jurisdiction: 'JP',
        credibility: 1.0,
        active: true
      },
      {
        id: 'pboc',
        name: 'People\'s Bank of China',
        url: 'http://www.pbc.gov.cn/english/',
        type: 'scraper',
        jurisdiction: 'CN',
        credibility: 0.95,
        active: true
      },
      {
        id: 'boe',
        name: 'Bank of England',
        url: 'https://www.bankofengland.co.uk/news',
        type: 'scraper',
        jurisdiction: 'UK',
        credibility: 1.0,
        active: true
      },
      {
        id: 'imf',
        name: 'IMF',
        url: 'https://www.imf.org/en/News/rss',
        type: 'rss',
        jurisdiction: 'INTL',
        credibility: 1.0,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active SC7 sources
   */
  async ingestAll(): Promise<Map<string, CurrencyIngestionStats>> {
    console.log('Starting SC7 authoritative sources ingestion');

    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);

    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  private async ingestSource(sourceId: string, source: CurrencySource): Promise<void> {
    const startTime = Date.now();
    const stats: CurrencyIngestionStats = {
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
        case 'fed':
          await this.ingestFederalReserve(source, stats);
          break;
        case 'ecb':
          await this.ingestECB(source, stats);
          break;
        case 'boj':
          await this.ingestBoJ(source, stats);
          break;
        case 'pboc':
          await this.ingestPBoC(source, stats);
          break;
        case 'boe':
          await this.ingestBoE(source, stats);
          break;
        case 'imf':
          await this.ingestIMF(source, stats);
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
   * Ingest Federal Reserve press releases
   */
  private async ingestFederalReserve(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC7_CURRENCY,
            title: item.title || 'Federal Reserve Announcement',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: ['USA', ...this.extractCountriesFromText(item.title + ' ' + item.description)],
            eventType: this.classifyCurrencyEventType(item.title || ''),
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
          console.error('Error processing Fed item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching Fed feed:', error);
      throw error;
    }
  }

  /**
   * Ingest ECB announcements
   */
  private async ingestECB(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC7_CURRENCY,
            title: item.title || 'ECB Announcement',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: ['EU', ...this.extractCountriesFromText(item.title + ' ' + item.description)],
            eventType: this.classifyCurrencyEventType(item.title || ''),
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
          console.error('Error processing ECB item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching ECB feed:', error);
      throw error;
    }
  }

  /**
   * Ingest Bank of Japan announcements (placeholder)
   */
  private async ingestBoJ(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    console.log('BoJ ingestion (placeholder - requires RSS parsing)');
    // TODO: Implement BoJ RSS feed parsing
  }

  /**
   * Ingest People's Bank of China (placeholder)
   */
  private async ingestPBoC(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    console.log('PBoC ingestion (placeholder - requires web scraping)');
    // TODO: Implement PBoC web scraping
  }

  /**
   * Ingest Bank of England (placeholder)
   */
  private async ingestBoE(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    console.log('BoE ingestion (placeholder - requires web scraping)');
    // TODO: Implement BoE web scraping
  }

  /**
   * Ingest IMF notifications
   */
  private async ingestIMF(source: CurrencySource, stats: CurrencyIngestionStats): Promise<void> {
    try {
      const feed = await this.parser.parseURL(source.url);
      stats.confirmationsFound = feed.items.length;

      for (const item of feed.items) {
        try {
          const confirmation: ConfirmationEvent = {
            sourceId: source.id,
            sourceType: 'authoritative',
            vector: RiskVector.SC7_CURRENCY,
            title: item.title || 'IMF Notification',
            description: item.contentSnippet || item.description || '',
            url: item.link || source.url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            credibility: source.credibility,
            countries: this.extractCountriesFromText(item.title + ' ' + item.description),
            eventType: this.classifyCurrencyEventType(item.title || ''),
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
          console.error('Error processing IMF item:', error);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error fetching IMF feed:', error);
      throw error;
    }
  }

  /**
   * Extract country codes from text
   */
  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const normalizedText = text.toLowerCase();

    const countryMap: Record<string, string> = {
      'argentina': 'ARG',
      'turkey': 'TUR',
      'turkish': 'TUR',
      'venezuela': 'VEN',
      'venezuelan': 'VEN',
      'lebanon': 'LBN',
      'lebanese': 'LBN',
      'egypt': 'EGY',
      'egyptian': 'EGY',
      'pakistan': 'PAK',
      'pakistani': 'PAK',
      'sri lanka': 'LKA',
      'russia': 'RUS',
      'russian': 'RUS',
      'china': 'CHN',
      'chinese': 'CHN'
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (normalizedText.includes(name)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)];
  }

  /**
   * Classify currency event type
   */
  private classifyCurrencyEventType(title: string): string {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('interest rate') || normalizedTitle.includes('rate decision')) {
      return 'interest_rate_change';
    }
    if (normalizedTitle.includes('capital control') || normalizedTitle.includes('capital flow')) {
      return 'capital_control';
    }
    if (normalizedTitle.includes('currency') || normalizedTitle.includes('exchange rate')) {
      return 'currency_policy';
    }
    if (normalizedTitle.includes('quantitative easing') || normalizedTitle.includes('qe')) {
      return 'monetary_easing';
    }
    if (normalizedTitle.includes('reserve') || normalizedTitle.includes('requirement')) {
      return 'reserve_requirement';
    }

    return 'monetary_policy';
  }

  /**
   * Store confirmation event
   */
  private async storeConfirmation(confirmation: ConfirmationEvent): Promise<void> {
    console.log(`Storing SC7 confirmation: ${confirmation.title}`);
    // TODO: Store in database
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): CurrencySource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): CurrencySource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, CurrencyIngestionStats> {
    return this.stats;
  }
}

// Export singleton instance
export const sc7AuthoritativeSources = new SC7AuthoritativeSources();