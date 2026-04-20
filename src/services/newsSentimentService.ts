/**
 * News Sentiment Service - Phase 2 Core Data Sources
 * 
 * Integrates multiple news and sentiment APIs:
 * - GDELT Project (FREE - No API Key)
 * - NewsAPI.org (Requires API Key)
 * - Event Registry (Free tier available)
 * 
 * Provides real-time sentiment analysis for geopolitical risk assessment.
 */

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const cache: Map<string, { data: any; timestamp: number }> = new Map();

// Rate limiting
const rateLimiters: Map<string, { requests: number[]; limit: number; window: number }> = new Map();

export interface NewsSentimentResult {
  country: string;
  sentiment: number;           // -1 to 1
  confidence: number;          // 0 to 1
  articleCount: number;
  sources: string[];
  topHeadlines: string[];
  tone: {
    positive: number;
    negative: number;
    neutral: number;
  };
  lastUpdated: Date;
  dataSource: 'gdelt' | 'newsapi' | 'eventregistry' | 'simulated';
}

export interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry: string;
  tone: number;
}

export interface GDELTResponse {
  articles?: GDELTArticle[];
}

export interface NewsAPIArticle {
  title: string;
  description: string;
  source: { name: string };
  publishedAt: string;
  url: string;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export interface EventRegistryEvent {
  title: string;
  summary: string;
  sentiment: number;
  date: string;
  location: string;
  categories: string[];
}

/**
 * Initialize rate limiters for each API
 */
function initRateLimiter(api: string, limit: number, windowMs: number): void {
  if (!rateLimiters.has(api)) {
    rateLimiters.set(api, { requests: [], limit, window: windowMs });
  }
}

/**
 * Check and update rate limit
 */
async function checkRateLimit(api: string): Promise<boolean> {
  const limiter = rateLimiters.get(api);
  if (!limiter) return true;

  const now = Date.now();
  limiter.requests = limiter.requests.filter(t => now - t < limiter.window);
  
  if (limiter.requests.length >= limiter.limit) {
    return false;
  }
  
  limiter.requests.push(now);
  return true;
}

/**
 * Get cached data if available and fresh
 */
function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

/**
 * Set cache data
 */
function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Initialize rate limiters
initRateLimiter('gdelt', 60, 60000);      // 60 requests per minute
initRateLimiter('newsapi', 100, 86400000); // 100 requests per day (free tier)
initRateLimiter('eventregistry', 50, 86400000); // 50 requests per day (free tier)

/**
 * GDELT Project API Integration (FREE - No API Key Required)
 * 
 * The GDELT Project monitors news media from nearly every country in the world
 * and provides free access to its data through various APIs.
 * 
 * API Documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */
export async function fetchGDELTSentiment(country: string): Promise<NewsSentimentResult> {
  const cacheKey = `gdelt_${country}`;
  const cached = getCached<NewsSentimentResult>(cacheKey);
  if (cached) {
    console.log(`📰 GDELT: Using cached data for ${country}`);
    return cached;
  }

  if (!await checkRateLimit('gdelt')) {
    console.log(`⚠️ GDELT: Rate limit reached, using simulated data for ${country}`);
    return getSimulatedSentiment(country, 'gdelt');
  }

  try {
    console.log(`📰 GDELT: Fetching sentiment for ${country}...`);
    
    // GDELT DOC 2.0 API endpoint
    // Query format: search for articles mentioning the country
    const query = encodeURIComponent(country);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=50&format=json&timespan=7d`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GDELT API error: ${response.status}`);
    }

    const data: GDELTResponse = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log(`📰 GDELT: No articles found for ${country}, using simulated data`);
      return getSimulatedSentiment(country, 'gdelt');
    }

    // Calculate sentiment from GDELT tone scores
    // GDELT tone ranges from -100 to +100
    const tones = data.articles.map(a => a.tone || 0);
    const avgTone = tones.reduce((sum, t) => sum + t, 0) / tones.length;
    
    // Normalize to -1 to 1 range
    const sentiment = Math.max(-1, Math.min(1, avgTone / 100));
    
    // Calculate tone distribution
    const positive = tones.filter(t => t > 0).length / tones.length;
    const negative = tones.filter(t => t < 0).length / tones.length;
    const neutral = tones.filter(t => t === 0).length / tones.length;
    
    // Extract unique sources
    const sources = [...new Set(data.articles.map(a => a.domain))].slice(0, 10);
    
    // Get top headlines
    const topHeadlines = data.articles.slice(0, 5).map(a => a.title);
    
    const result: NewsSentimentResult = {
      country,
      sentiment,
      confidence: Math.min(0.9, data.articles.length / 50), // Higher article count = higher confidence
      articleCount: data.articles.length,
      sources,
      topHeadlines,
      tone: { positive, negative, neutral },
      lastUpdated: new Date(),
      dataSource: 'gdelt',
    };

    setCache(cacheKey, result);
    console.log(`✅ GDELT: Fetched ${data.articles.length} articles for ${country}, sentiment: ${sentiment.toFixed(2)}`);
    
    return result;

  } catch (error) {
    console.error(`❌ GDELT API error for ${country}:`, error);
    return getSimulatedSentiment(country, 'gdelt');
  }
}

/**
 * NewsAPI.org Integration (Requires API Key)
 * 
 * NewsAPI provides access to headlines and articles from 80,000+ sources.
 * Free tier: 100 requests/day, 1 month old articles only
 * 
 * API Documentation: https://newsapi.org/docs
 */
export async function fetchNewsAPISentiment(
  country: string,
  apiKey?: string
): Promise<NewsSentimentResult> {
  const cacheKey = `newsapi_${country}`;
  const cached = getCached<NewsSentimentResult>(cacheKey);
  if (cached) {
    console.log(`📰 NewsAPI: Using cached data for ${country}`);
    return cached;
  }

  // Check if API key is available
  const key = apiKey || import.meta.env.VITE_NEWSAPI_KEY;
  if (!key) {
    console.log(`⚠️ NewsAPI: No API key configured, using simulated data for ${country}`);
    return getSimulatedSentiment(country, 'newsapi');
  }

  if (!await checkRateLimit('newsapi')) {
    console.log(`⚠️ NewsAPI: Rate limit reached, using simulated data for ${country}`);
    return getSimulatedSentiment(country, 'newsapi');
  }

  try {
    console.log(`📰 NewsAPI: Fetching sentiment for ${country}...`);
    
    // Search for news about the country
    const query = encodeURIComponent(`${country} politics economy`);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${key}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `NewsAPI error: ${response.status}`);
    }

    const data: NewsAPIResponse = await response.json();
    
    if (data.status !== 'ok' || !data.articles || data.articles.length === 0) {
      console.log(`📰 NewsAPI: No articles found for ${country}, using simulated data`);
      return getSimulatedSentiment(country, 'newsapi');
    }

    // Perform basic sentiment analysis on headlines
    const sentimentScores = data.articles.map(article => {
      return analyzeHeadlineSentiment(article.title + ' ' + (article.description || ''));
    });
    
    const avgSentiment = sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length;
    
    // Calculate tone distribution
    const positive = sentimentScores.filter(s => s > 0.1).length / sentimentScores.length;
    const negative = sentimentScores.filter(s => s < -0.1).length / sentimentScores.length;
    const neutral = sentimentScores.filter(s => s >= -0.1 && s <= 0.1).length / sentimentScores.length;
    
    // Extract unique sources
    const sources = [...new Set(data.articles.map(a => a.source.name))].slice(0, 10);
    
    // Get top headlines
    const topHeadlines = data.articles.slice(0, 5).map(a => a.title);
    
    const result: NewsSentimentResult = {
      country,
      sentiment: avgSentiment,
      confidence: Math.min(0.85, data.articles.length / 50),
      articleCount: data.articles.length,
      sources,
      topHeadlines,
      tone: { positive, negative, neutral },
      lastUpdated: new Date(),
      dataSource: 'newsapi',
    };

    setCache(cacheKey, result);
    console.log(`✅ NewsAPI: Fetched ${data.articles.length} articles for ${country}, sentiment: ${avgSentiment.toFixed(2)}`);
    
    return result;

  } catch (error) {
    console.error(`❌ NewsAPI error for ${country}:`, error);
    return getSimulatedSentiment(country, 'newsapi');
  }
}

/**
 * Event Registry Integration (Free tier available)
 * 
 * Event Registry provides access to global news events and their analysis.
 * Free tier: 50 requests/day
 * 
 * API Documentation: https://eventregistry.org/documentation
 */
export async function fetchEventRegistrySentiment(
  country: string,
  apiKey?: string
): Promise<NewsSentimentResult> {
  const cacheKey = `eventregistry_${country}`;
  const cached = getCached<NewsSentimentResult>(cacheKey);
  if (cached) {
    console.log(`📰 EventRegistry: Using cached data for ${country}`);
    return cached;
  }

  // Check if API key is available
  const key = apiKey || import.meta.env.VITE_EVENTREGISTRY_KEY;
  if (!key) {
    console.log(`⚠️ EventRegistry: No API key configured, using simulated data for ${country}`);
    return getSimulatedSentiment(country, 'eventregistry');
  }

  if (!await checkRateLimit('eventregistry')) {
    console.log(`⚠️ EventRegistry: Rate limit reached, using simulated data for ${country}`);
    return getSimulatedSentiment(country, 'eventregistry');
  }

  try {
    console.log(`📰 EventRegistry: Fetching sentiment for ${country}...`);
    
    // Event Registry API endpoint
    const url = 'https://eventregistry.org/api/v1/article/getArticles';
    
    const requestBody = {
      apiKey: key,
      keyword: country,
      keywordLoc: 'title',
      lang: 'eng',
      articlesSortBy: 'date',
      articlesCount: 50,
      resultType: 'articles',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`EventRegistry API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.articles?.results || data.articles.results.length === 0) {
      console.log(`📰 EventRegistry: No articles found for ${country}, using simulated data`);
      return getSimulatedSentiment(country, 'eventregistry');
    }

    const articles = data.articles.results;
    
    // Calculate sentiment from Event Registry sentiment scores
    const sentimentScores = articles.map((a: any) => a.sentiment || 0);
    const avgSentiment = sentimentScores.reduce((sum: number, s: number) => sum + s, 0) / sentimentScores.length;
    
    // Calculate tone distribution
    const positive = sentimentScores.filter((s: number) => s > 0).length / sentimentScores.length;
    const negative = sentimentScores.filter((s: number) => s < 0).length / sentimentScores.length;
    const neutral = sentimentScores.filter((s: number) => s === 0).length / sentimentScores.length;
    
    // Extract unique sources
    const sources = [...new Set(articles.map((a: any) => a.source?.title || 'Unknown'))].slice(0, 10) as string[];
    
    // Get top headlines
    const topHeadlines = articles.slice(0, 5).map((a: any) => a.title);
    
    const result: NewsSentimentResult = {
      country,
      sentiment: avgSentiment,
      confidence: Math.min(0.88, articles.length / 50),
      articleCount: articles.length,
      sources,
      topHeadlines,
      tone: { positive, negative, neutral },
      lastUpdated: new Date(),
      dataSource: 'eventregistry',
    };

    setCache(cacheKey, result);
    console.log(`✅ EventRegistry: Fetched ${articles.length} articles for ${country}, sentiment: ${avgSentiment.toFixed(2)}`);
    
    return result;

  } catch (error) {
    console.error(`❌ EventRegistry API error for ${country}:`, error);
    return getSimulatedSentiment(country, 'eventregistry');
  }
}

/**
 * Basic headline sentiment analysis
 * Uses keyword matching for sentiment scoring
 */
function analyzeHeadlineSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  
  // Positive keywords
  const positiveWords = [
    'growth', 'surge', 'gain', 'rise', 'boost', 'improve', 'success', 'win',
    'agreement', 'deal', 'peace', 'stable', 'strong', 'positive', 'recovery',
    'breakthrough', 'progress', 'advance', 'rally', 'soar', 'jump', 'expand',
    'cooperation', 'partnership', 'investment', 'opportunity', 'optimism'
  ];
  
  // Negative keywords
  const negativeWords = [
    'crisis', 'crash', 'fall', 'drop', 'decline', 'threat', 'war', 'conflict',
    'tension', 'sanction', 'tariff', 'protest', 'strike', 'recession', 'fear',
    'risk', 'danger', 'attack', 'violence', 'collapse', 'plunge', 'slump',
    'instability', 'uncertainty', 'concern', 'worry', 'warning', 'disaster'
  ];
  
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.1;
  });
  
  // Clamp to -1 to 1 range
  return Math.max(-1, Math.min(1, score));
}

/**
 * Get simulated sentiment data when APIs are unavailable
 */
function getSimulatedSentiment(
  country: string,
  source: 'gdelt' | 'newsapi' | 'eventregistry'
): NewsSentimentResult {
  // Simulated sentiment based on country risk profile
  const sentimentMap: Record<string, number> = {
    'United States': 0.15,
    'China': -0.25,
    'Japan': 0.20,
    'Germany': 0.10,
    'United Kingdom': 0.05,
    'France': 0.08,
    'India': 0.12,
    'Brazil': -0.10,
    'Russia': -0.45,
    'Taiwan': -0.20,
    'South Korea': 0.05,
    'Mexico': 0.00,
    'Canada': 0.18,
    'Australia': 0.22,
    'Singapore': 0.25,
    'Israel': -0.30,
    'Saudi Arabia': -0.15,
    'Turkey': -0.35,
    'Argentina': -0.40,
    'Ukraine': -0.50,
    'Iran': -0.55,
    'North Korea': -0.70,
    'Venezuela': -0.45,
    'Poland': 0.05,
    'Netherlands': 0.15,
    'Switzerland': 0.20,
    'Sweden': 0.18,
    'Norway': 0.22,
    'Denmark': 0.20,
    'Finland': 0.18,
    'Ireland': 0.12,
    'Belgium': 0.08,
    'Austria': 0.10,
    'Spain': 0.02,
    'Italy': 0.00,
    'Portugal': 0.05,
    'Greece': -0.05,
    'Czech Republic': 0.08,
    'Hungary': -0.10,
    'Romania': 0.02,
    'Vietnam': 0.10,
    'Thailand': 0.05,
    'Indonesia': 0.08,
    'Malaysia': 0.12,
    'Philippines': 0.00,
    'New Zealand': 0.20,
    'South Africa': -0.15,
    'Nigeria': -0.20,
    'Egypt': -0.25,
    'Kenya': -0.10,
    'Morocco': 0.00,
    'Chile': 0.05,
    'Colombia': -0.05,
    'Peru': 0.00,
    'Pakistan': -0.30,
    'Bangladesh': -0.15,
  };

  const baseSentiment = sentimentMap[country] || 0;
  // Add small random variation
  const sentiment = baseSentiment + (Math.random() - 0.5) * 0.1;

  return {
    country,
    sentiment: Math.max(-1, Math.min(1, sentiment)),
    confidence: 0.6, // Lower confidence for simulated data
    articleCount: 0,
    sources: ['simulated'],
    topHeadlines: [],
    tone: {
      positive: sentiment > 0 ? 0.5 + sentiment * 0.3 : 0.3,
      negative: sentiment < 0 ? 0.5 + Math.abs(sentiment) * 0.3 : 0.3,
      neutral: 0.2,
    },
    lastUpdated: new Date(),
    dataSource: 'simulated',
  };
}

/**
 * Aggregate sentiment from multiple sources
 */
export async function getAggregatedSentiment(country: string): Promise<NewsSentimentResult> {
  console.log(`📊 Aggregating sentiment for ${country} from multiple sources...`);
  
  // Try GDELT first (free, no API key)
  const gdeltResult = await fetchGDELTSentiment(country);
  
  // If GDELT returned real data, use it as primary
  if (gdeltResult.dataSource === 'gdelt' && gdeltResult.articleCount > 0) {
    return gdeltResult;
  }
  
  // Try NewsAPI if available
  const newsApiResult = await fetchNewsAPISentiment(country);
  if (newsApiResult.dataSource === 'newsapi' && newsApiResult.articleCount > 0) {
    return newsApiResult;
  }
  
  // Try Event Registry if available
  const eventRegistryResult = await fetchEventRegistrySentiment(country);
  if (eventRegistryResult.dataSource === 'eventregistry' && eventRegistryResult.articleCount > 0) {
    return eventRegistryResult;
  }
  
  // Fall back to simulated data
  return getSimulatedSentiment(country, 'gdelt');
}

/**
 * Batch fetch sentiment for multiple countries
 */
export async function batchFetchSentiment(
  countries: string[]
): Promise<Map<string, NewsSentimentResult>> {
  const results = new Map<string, NewsSentimentResult>();
  
  // Process countries in parallel with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < countries.length; i += concurrencyLimit) {
    const batch = countries.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map(country => getAggregatedSentiment(country))
    );
    
    batch.forEach((country, index) => {
      results.set(country, batchResults[index]);
    });
    
    // Small delay between batches to respect rate limits
    if (i + concurrencyLimit < countries.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Get service status for all news APIs
 */
export function getNewsSentimentServiceStatus(): {
  gdelt: { available: boolean; requestsRemaining: number };
  newsapi: { available: boolean; hasApiKey: boolean; requestsRemaining: number };
  eventregistry: { available: boolean; hasApiKey: boolean; requestsRemaining: number };
} {
  const gdeltLimiter = rateLimiters.get('gdelt');
  const newsapiLimiter = rateLimiters.get('newsapi');
  const eventregistryLimiter = rateLimiters.get('eventregistry');
  
  const now = Date.now();
  
  return {
    gdelt: {
      available: true,
      requestsRemaining: gdeltLimiter 
        ? gdeltLimiter.limit - gdeltLimiter.requests.filter(t => now - t < gdeltLimiter.window).length
        : 60,
    },
    newsapi: {
      available: !!import.meta.env.VITE_NEWSAPI_KEY,
      hasApiKey: !!import.meta.env.VITE_NEWSAPI_KEY,
      requestsRemaining: newsapiLimiter
        ? newsapiLimiter.limit - newsapiLimiter.requests.filter(t => now - t < newsapiLimiter.window).length
        : 100,
    },
    eventregistry: {
      available: !!import.meta.env.VITE_EVENTREGISTRY_KEY,
      hasApiKey: !!import.meta.env.VITE_EVENTREGISTRY_KEY,
      requestsRemaining: eventregistryLimiter
        ? eventregistryLimiter.limit - eventregistryLimiter.requests.filter(t => now - t < eventregistryLimiter.window).length
        : 50,
    },
  };
}

/**
 * Clear all caches
 */
export function clearNewsSentimentCache(): void {
  cache.clear();
  console.log('🗑️ News sentiment cache cleared');
}

// Export singleton service
export const newsSentimentService = {
  fetchGDELTSentiment,
  fetchNewsAPISentiment,
  fetchEventRegistrySentiment,
  getAggregatedSentiment,
  batchFetchSentiment,
  getServiceStatus: getNewsSentimentServiceStatus,
  clearCache: clearNewsSentimentCache,
};

export default newsSentimentService;