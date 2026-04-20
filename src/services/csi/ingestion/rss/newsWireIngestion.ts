/**
 * News Wire RSS Feed Ingestion
 * 
 * Ingests articles from major news wire services:
 * - Associated Press
 * - BBC World News
 * - UN News
 * - ReliefWeb
 * - CrisisWatch
 * 
 * Runs every 15 minutes, parses articles, and sends to Kafka
 * 
 * @module ingestion/rss/newsWireIngestion
 */

import Parser from 'rss-parser';
import { EventEmitter } from 'events';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  pubDate: Date;
  source: string;
  sourceUrl: string;
  categories: string[];
  author?: string;
  guid?: string;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: 'tier1' | 'tier2' | 'official';
  credibility: number;
  active: boolean;
}

export interface IngestionStats {
  sourceId: string;
  articlesFound: number;
  articlesNew: number;
  articlesProcessed: number;
  errors: number;
  duration: number;
  timestamp: Date;
}

/**
 * News Wire RSS Feed Ingestion Service
 */
export class NewsWireIngestion extends EventEmitter {
  private parser: Parser;
  private sources: Map<string, FeedSource>;
  private seenArticles: Set<string>; // Track processed article GUIDs
  private stats: Map<string, IngestionStats>;

  constructor() {
    super();
    this.parser = new Parser({
      timeout: 30000,
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['content:encoded', 'contentEncoded']
        ]
      }
    });
    
    this.sources = this.initializeSources();
    this.seenArticles = new Set();
    this.stats = new Map();
  }

  /**
   * Initialize news wire sources
   */
  private initializeSources(): Map<string, FeedSource> {
    const sources: FeedSource[] = [
      // Associated Press
      {
        id: 'ap',
        name: 'Associated Press',
        url: 'https://feeds.apnews.com/rss/world',
        category: 'tier1',
        credibility: 0.9,
        active: true
      },
      
      // BBC World News
      {
        id: 'bbc',
        name: 'BBC World News',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        category: 'tier1',
        credibility: 0.9,
        active: true
      },
      
      // UN News
      {
        id: 'un',
        name: 'UN News',
        url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
        category: 'official',
        credibility: 0.95,
        active: true
      },
      
      // ReliefWeb
      {
        id: 'reliefweb',
        name: 'ReliefWeb',
        url: 'https://reliefweb.int/rss.xml',
        category: 'official',
        credibility: 0.9,
        active: true
      },
      
      // Al Jazeera
      {
        id: 'aljazeera',
        name: 'Al Jazeera',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: 'tier1',
        credibility: 0.85,
        active: true
      },
      
      // Deutsche Welle
      {
        id: 'dw',
        name: 'Deutsche Welle',
        url: 'https://rss.dw.com/xml/rss-en-all',
        category: 'tier2',
        credibility: 0.85,
        active: true
      },
      
      // France 24
      {
        id: 'france24',
        name: 'France 24',
        url: 'https://www.france24.com/en/rss',
        category: 'tier2',
        credibility: 0.85,
        active: true
      },
      
      // Reuters (free RSS)
      {
        id: 'reuters',
        name: 'Reuters',
        url: 'https://www.reuters.com/rssfeed/worldNews',
        category: 'tier1',
        credibility: 0.9,
        active: true
      }
    ];

    return new Map(sources.map(s => [s.id, s]));
  }

  /**
   * Ingest from all active sources
   */
  async ingestAll(): Promise<Map<string, IngestionStats>> {
    console.log(`Starting news wire ingestion from ${this.sources.size} sources`);
    
    const promises = Array.from(this.sources.entries())
      .filter(([_, source]) => source.active)
      .map(([sourceId, source]) => this.ingestSource(sourceId, source));

    await Promise.allSettled(promises);
    
    return this.stats;
  }

  /**
   * Ingest from a single source
   */
  async ingestSource(sourceId: string, source: FeedSource): Promise<void> {
    const startTime = Date.now();
    const stats: IngestionStats = {
      sourceId,
      articlesFound: 0,
      articlesNew: 0,
      articlesProcessed: 0,
      errors: 0,
      duration: 0,
      timestamp: new Date()
    };

    try {
      console.log(`Fetching RSS feed: ${source.name} (${source.url})`);
      
      const feed = await this.parser.parseURL(source.url);
      stats.articlesFound = feed.items.length;
      
      const articles: NewsArticle[] = [];
      
      for (const item of feed.items) {
        try {
          // Check if already processed
          const guid = item.guid || item.link || '';
          if (this.seenArticles.has(guid)) {
            continue;
          }
          
          // Parse article
          const article = this.parseArticle(item, source);
          if (article) {
            articles.push(article);
            this.seenArticles.add(guid);
            stats.articlesNew++;
          }
          
        } catch (error) {
          console.error(`Error parsing article from ${sourceId}:`, error);
          stats.errors++;
        }
      }
      
      // Emit articles for downstream processing
      if (articles.length > 0) {
        this.emit('articles', articles);
        stats.articlesProcessed = articles.length;
      }
      
      stats.duration = Date.now() - startTime;
      this.stats.set(sourceId, stats);
      
      console.log(`Completed ${source.name}: ${stats.articlesNew} new articles (${stats.duration}ms)`);
      
    } catch (error) {
      console.error(`Failed to ingest from ${source.name}:`, error);
      stats.errors++;
      stats.duration = Date.now() - startTime;
      this.stats.set(sourceId, stats);
    }
  }

  /**
   * Parse RSS item into NewsArticle
   */
  private parseArticle(item: any, source: FeedSource): NewsArticle | null {
    try {
      // Extract content (try multiple fields)
      const content = 
        item.contentEncoded || 
        item['content:encoded'] || 
        item.content || 
        item.description || 
        item.summary || 
        '';
      
      // Extract description
      const description = 
        item.contentSnippet || 
        item.description || 
        item.summary || 
        content.substring(0, 500);
      
      // Parse date
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      
      // Generate ID
      const id = this.generateArticleId(item.guid || item.link || '', source.id);
      
      return {
        id,
        title: item.title || 'Untitled',
        description: this.cleanText(description),
        content: this.cleanText(content),
        link: item.link || '',
        pubDate,
        source: source.id,
        sourceUrl: source.url,
        categories: item.categories || [],
        author: item.creator || item.author,
        guid: item.guid || item.link
      };
      
    } catch (error) {
      console.error('Error parsing article:', error);
      return null;
    }
  }

  /**
   * Clean HTML and normalize text
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate unique article ID
   */
  private generateArticleId(guid: string, sourceId: string): string {
    const hash = this.simpleHash(guid);
    return `${sourceId}_${hash}_${Date.now()}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get source configuration
   */
  getSource(sourceId: string): FeedSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all sources
   */
  getAllSources(): FeedSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get active sources
   */
  getActiveSources(): FeedSource[] {
    return Array.from(this.sources.values()).filter(s => s.active);
  }

  /**
   * Update source configuration
   */
  updateSource(sourceId: string, updates: Partial<FeedSource>): void {
    const source = this.sources.get(sourceId);
    if (source) {
      this.sources.set(sourceId, { ...source, ...updates });
    }
  }

  /**
   * Get ingestion statistics
   */
  getStats(): Map<string, IngestionStats> {
    return this.stats;
  }

  /**
   * Clear seen articles cache (for testing)
   */
  clearCache(): void {
    this.seenArticles.clear();
  }
}

// Export singleton instance
export const newsWireIngestion = new NewsWireIngestion();