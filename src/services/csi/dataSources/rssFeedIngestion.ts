/**
 * RSS Feed Ingestion Service
 * 
 * Fetches and parses RSS feeds from configured data sources.
 * Extracts articles with title, description, link, pubDate, and content.
 * 
 * Note: RSS parsing requires Node.js modules (http, https).
 * In browser, this will use a CORS proxy or return mock data for testing.
 */

import type { DataSource } from './config';

export interface RSSArticle {
  article_id: string;
  source_id: string;
  source_name: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  content?: string;
  raw: unknown;
}

const isBrowser = typeof window !== 'undefined';
let Parser: any = null;

// Lazy load rss-parser only in Node.js environment
async function getParser() {
  if (Parser) return Parser;
  
  if (isBrowser) {
    console.warn('[RSS Ingestion] RSS parsing is not fully supported in browser. Use server-side detection or CORS proxy.');
    return null;
  }
  
  try {
    const module = await import('rss-parser');
    Parser = module.default || module;
    return new Parser({
      customFields: {
        item: [
          ['content:encoded', 'contentEncoded'],
          ['description', 'description']
        ]
      }
    });
  } catch (error) {
    console.error('[RSS Ingestion] Failed to load rss-parser:', error);
    return null;
  }
}

/**
 * Fetch and parse an RSS feed
 */
export async function fetchRSSFeed(source: DataSource): Promise<RSSArticle[]> {
  if (!source.rss) {
    throw new Error(`Source ${source.id} does not have an RSS feed configured`);
  }

  // In browser, return empty array with warning
  if (isBrowser) {
    console.warn(`[RSS Ingestion] ⚠️ Cannot fetch RSS in browser. Use server-side detection or runDetectionNow() in Node.js environment.`);
    return [];
  }

  try {
    console.log(`[RSS Ingestion] Fetching feed from ${source.name}...`);
    
    const parser = await getParser();
    if (!parser) {
      throw new Error('RSS parser not available');
    }
    
    const feed = await parser.parseURL(source.rss);
    
    const articles: RSSArticle[] = feed.items.map((item: any) => {
      const articleId = generateArticleId(source.id, item.link || item.guid || '');
      
      return {
        article_id: articleId,
        source_id: source.id,
        source_name: source.name,
        title: item.title || '',
        description: item.contentSnippet || item.description || '',
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        content: item.contentEncoded || item.content || item.description || '',
        raw: item
      };
    });

    console.log(`[RSS Ingestion] ✅ Fetched ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`[RSS Ingestion] ❌ Failed to fetch feed from ${source.name}:`, error);
    throw error;
  }
}

/**
 * Fetch multiple RSS feeds in parallel
 */
export async function fetchMultipleFeeds(sources: DataSource[]): Promise<RSSArticle[]> {
  const rssFeeds = sources.filter(source => source.type === 'RSS' && source.rss);
  
  console.log(`[RSS Ingestion] 🚀 Fetching ${rssFeeds.length} RSS feeds...`);
  
  const results = await Promise.allSettled(
    rssFeeds.map(source => fetchRSSFeed(source))
  );

  const allArticles: RSSArticle[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
      successCount++;
    } else {
      console.error(`[RSS Ingestion] Failed to fetch ${rssFeeds[index].name}:`, result.reason);
      failureCount++;
    }
  });

  console.log(`[RSS Ingestion] 📊 Summary: ${successCount} successful, ${failureCount} failed, ${allArticles.length} total articles`);
  return allArticles;
}

/**
 * Filter articles by date range
 */
export function filterArticlesByDate(
  articles: RSSArticle[],
  startDate: Date,
  endDate: Date = new Date()
): RSSArticle[] {
  return articles.filter(article => 
    article.pubDate >= startDate && article.pubDate <= endDate
  );
}

/**
 * Filter articles published since last check
 */
export function filterNewArticles(
  articles: RSSArticle[],
  lastCheckDate: Date
): RSSArticle[] {
  return articles.filter(article => article.pubDate > lastCheckDate);
}

/**
 * Deduplicate articles by link
 */
export function deduplicateArticles(articles: RSSArticle[]): RSSArticle[] {
  const seen = new Set<string>();
  return articles.filter(article => {
    if (seen.has(article.link)) {
      return false;
    }
    seen.add(article.link);
    return true;
  });
}

/**
 * Generate a unique article ID
 */
function generateArticleId(sourceId: string, link: string): string {
  const hash = simpleHash(link);
  return `${sourceId}-${hash}`;
}

/**
 * Simple hash function for generating article IDs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse RSS article for key information
 */
export function parseRSSItem(article: RSSArticle): {
  fullText: string;
  hasContent: boolean;
} {
  const fullText = [
    article.title,
    article.description,
    article.content
  ].filter(Boolean).join(' ');

  return {
    fullText,
    hasContent: fullText.length > 50
  };
}

/**
 * Create mock articles for testing in browser
 */
export function createMockArticles(): RSSArticle[] {
  return [
    {
      article_id: 'mock-1',
      source_id: 'mofcom-china',
      source_name: 'MOFCOM China',
      title: 'China Implements Export Controls on Silver Effective January 1, 2026',
      description: 'The Ministry of Commerce announces new export control measures on silver and related materials.',
      link: 'https://www.mofcom.gov.cn/article/news/2025/12/20251215001.html',
      pubDate: new Date('2025-12-15T10:00:00Z'),
      content: 'China Ministry of Commerce (MOFCOM) has announced new export control regulations targeting silver and silver-based materials. The measures will take effect on January 1, 2026.',
      raw: {}
    }
  ];
}