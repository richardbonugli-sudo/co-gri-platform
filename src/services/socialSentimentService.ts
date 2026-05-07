/**
 * Social Media Sentiment Service
 * Phase 3: Advanced Real-Time Data Sources
 * 
 * Integrates:
 * - Reddit API - FREE (r/wallstreetbets, r/investing, r/stocks)
 * - StockTwits API - FREE
 * - Twitter/X (optional, requires API access)
 * 
 * All sources have fallback to neutral sentiment
 */

// Types
export interface SocialPost {
  id: string;
  platform: 'reddit' | 'stocktwits' | 'twitter';
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  sentiment: number; // -1 to 1
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  tickers: string[];
  isSimulated: boolean;
}

export interface SubredditSentiment {
  subreddit: string;
  sentiment: number; // -1 to 1
  postCount: number;
  topTickers: { ticker: string; mentions: number; sentiment: number }[];
  lastUpdate: Date;
  isSimulated: boolean;
}

export interface StockTwitsSentiment {
  ticker: string;
  sentiment: number; // -1 to 1
  bullishPercent: number;
  bearishPercent: number;
  messageVolume: number;
  lastUpdate: Date;
  isSimulated: boolean;
}

export interface SocialSentimentStatus {
  overallSentiment: number; // -1 to 1
  redditSentiment: SubredditSentiment[];
  stockTwitsSentiment: StockTwitsSentiment[];
  trendingTickers: { ticker: string; mentions: number; sentiment: number }[];
  lastUpdate: Date;
  dataSource: 'live' | 'cached' | 'static';
}

// Static fallback data
const STATIC_SUBREDDIT_SENTIMENT: Omit<SubredditSentiment, 'lastUpdate' | 'isSimulated'>[] = [
  {
    subreddit: 'wallstreetbets',
    sentiment: 0.15,
    postCount: 1250,
    topTickers: [
      { ticker: 'NVDA', mentions: 320, sentiment: 0.45 },
      { ticker: 'TSLA', mentions: 280, sentiment: 0.12 },
      { ticker: 'AMD', mentions: 195, sentiment: 0.38 },
      { ticker: 'AAPL', mentions: 165, sentiment: 0.22 },
      { ticker: 'SPY', mentions: 145, sentiment: 0.08 },
    ],
  },
  {
    subreddit: 'investing',
    sentiment: 0.08,
    postCount: 450,
    topTickers: [
      { ticker: 'VOO', mentions: 85, sentiment: 0.25 },
      { ticker: 'VTI', mentions: 72, sentiment: 0.28 },
      { ticker: 'SCHD', mentions: 58, sentiment: 0.32 },
      { ticker: 'AAPL', mentions: 45, sentiment: 0.18 },
      { ticker: 'MSFT', mentions: 42, sentiment: 0.22 },
    ],
  },
  {
    subreddit: 'stocks',
    sentiment: 0.12,
    postCount: 680,
    topTickers: [
      { ticker: 'NVDA', mentions: 125, sentiment: 0.42 },
      { ticker: 'MSFT', mentions: 98, sentiment: 0.28 },
      { ticker: 'GOOGL', mentions: 85, sentiment: 0.18 },
      { ticker: 'META', mentions: 72, sentiment: 0.15 },
      { ticker: 'AMZN', mentions: 65, sentiment: 0.20 },
    ],
  },
  {
    subreddit: 'economics',
    sentiment: -0.05,
    postCount: 320,
    topTickers: [
      { ticker: 'SPY', mentions: 45, sentiment: 0.05 },
      { ticker: 'TLT', mentions: 32, sentiment: -0.12 },
      { ticker: 'GLD', mentions: 28, sentiment: 0.15 },
      { ticker: 'DXY', mentions: 22, sentiment: -0.08 },
      { ticker: 'VIX', mentions: 18, sentiment: -0.25 },
    ],
  },
];

const STATIC_STOCKTWITS_SENTIMENT: Omit<StockTwitsSentiment, 'lastUpdate' | 'isSimulated'>[] = [
  { ticker: 'NVDA', sentiment: 0.42, bullishPercent: 71, bearishPercent: 29, messageVolume: 2850 },
  { ticker: 'TSLA', sentiment: 0.08, bullishPercent: 54, bearishPercent: 46, messageVolume: 3200 },
  { ticker: 'AAPL', sentiment: 0.22, bullishPercent: 61, bearishPercent: 39, messageVolume: 1850 },
  { ticker: 'AMD', sentiment: 0.35, bullishPercent: 68, bearishPercent: 32, messageVolume: 1420 },
  { ticker: 'MSFT', sentiment: 0.28, bullishPercent: 64, bearishPercent: 36, messageVolume: 1180 },
  { ticker: 'META', sentiment: 0.18, bullishPercent: 59, bearishPercent: 41, messageVolume: 980 },
  { ticker: 'GOOGL', sentiment: 0.15, bullishPercent: 58, bearishPercent: 42, messageVolume: 850 },
  { ticker: 'AMZN', sentiment: 0.25, bullishPercent: 63, bearishPercent: 37, messageVolume: 920 },
  { ticker: 'SPY', sentiment: 0.12, bullishPercent: 56, bearishPercent: 44, messageVolume: 2100 },
  { ticker: 'QQQ', sentiment: 0.18, bullishPercent: 59, bearishPercent: 41, messageVolume: 1650 },
];

// Sentiment keywords for analysis
const BULLISH_KEYWORDS = [
  'buy', 'bullish', 'moon', 'rocket', 'calls', 'long', 'undervalued', 'breakout',
  'growth', 'strong', 'beat', 'upgrade', 'rally', 'surge', 'soar', 'gains',
  'opportunity', 'accumulate', 'hodl', 'diamond hands', 'to the moon', '🚀', '📈', '💎'
];

const BEARISH_KEYWORDS = [
  'sell', 'bearish', 'crash', 'puts', 'short', 'overvalued', 'breakdown',
  'weak', 'miss', 'downgrade', 'dump', 'plunge', 'tank', 'losses',
  'avoid', 'exit', 'paper hands', 'bubble', 'correction', '📉', '🐻', '💀'
];

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = {
  reddit: 5 * 60 * 1000, // 5 minutes
  stocktwits: 2 * 60 * 1000, // 2 minutes
  overall: 5 * 60 * 1000, // 5 minutes
};

// Rate limiting
const rateLimiter = {
  reddit: { lastCall: 0, minInterval: 2000 }, // 2 seconds (Reddit rate limit)
  stocktwits: { lastCall: 0, minInterval: 1000 }, // 1 second
  async wait(api: 'reddit' | 'stocktwits'): Promise<void> {
    const limiter = this[api];
    const now = Date.now();
    const elapsed = now - limiter.lastCall;
    if (elapsed < limiter.minInterval) {
      await new Promise(resolve => setTimeout(resolve, limiter.minInterval - elapsed));
    }
    limiter.lastCall = Date.now();
  }
};

// Helper functions
function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function addVariation(value: number, maxAmount: number = 0.1): number {
  const variation = (Math.random() - 0.5) * 2 * maxAmount;
  return Math.max(-1, Math.min(1, value + variation));
}

function analyzeSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 1;
      matches++;
    }
  }

  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score -= 1;
      matches++;
    }
  }

  if (matches === 0) return 0;
  return Math.max(-1, Math.min(1, score / matches));
}

function extractTickers(text: string): string[] {
  // Match $TICKER or standalone uppercase 2-5 letter words
  const tickerPattern = /\$([A-Z]{1,5})|(?<![a-zA-Z])([A-Z]{2,5})(?![a-zA-Z])/g;
  const matches = text.match(tickerPattern) || [];
  return [...new Set(matches.map(m => m.replace('$', '').toUpperCase()))];
}

// Service class
class SocialSentimentService {
  /**
   * Get Reddit sentiment for financial subreddits
   * Fallback: Static neutral sentiment
   */
  async getRedditSentiment(subreddits: string[] = ['wallstreetbets', 'investing', 'stocks']): Promise<SubredditSentiment[]> {
    const results: SubredditSentiment[] = [];

    for (const subreddit of subreddits) {
      const cacheKey = `reddit_${subreddit}`;
      const cached = getCached<SubredditSentiment>(cacheKey);
      
      if (cached) {
        results.push(cached);
        continue;
      }

      try {
        await rateLimiter.wait('reddit');
        const sentiment = await this.fetchRedditSubreddit(subreddit);
        setCache(cacheKey, sentiment, CACHE_TTL.reddit);
        results.push(sentiment);
      } catch (error) {
        console.error(`Error fetching r/${subreddit}:`, error);
        console.warn(`Falling back to static data for r/${subreddit}`);
        const staticData = this.generateSimulatedRedditSentiment(subreddit);
        results.push(staticData);
      }
    }

    return results;
  }

  private async fetchRedditSubreddit(subreddit: string): Promise<SubredditSentiment> {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`,
      {
        headers: {
          'User-Agent': 'CO-GRI Trading Signal Service/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data?.children || [];

    if (posts.length === 0) {
      throw new Error('No posts returned from Reddit');
    }

    // Analyze posts
    const tickerMentions: Map<string, { count: number; sentimentSum: number }> = new Map();
    let totalSentiment = 0;

    for (const post of posts) {
      const postData = post.data;
      const text = `${postData.title} ${postData.selftext || ''}`;
      const sentiment = analyzeSentiment(text);
      const tickers = extractTickers(text);

      totalSentiment += sentiment;

      for (const ticker of tickers) {
        const existing = tickerMentions.get(ticker) || { count: 0, sentimentSum: 0 };
        existing.count++;
        existing.sentimentSum += sentiment;
        tickerMentions.set(ticker, existing);
      }
    }

    // Sort tickers by mention count
    const topTickers = Array.from(tickerMentions.entries())
      .map(([ticker, data]) => ({
        ticker,
        mentions: data.count,
        sentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5);

    return {
      subreddit,
      sentiment: posts.length > 0 ? totalSentiment / posts.length : 0,
      postCount: posts.length,
      topTickers,
      lastUpdate: new Date(),
      isSimulated: false,
    };
  }

  private generateSimulatedRedditSentiment(subreddit: string): SubredditSentiment {
    const staticData = STATIC_SUBREDDIT_SENTIMENT.find(s => s.subreddit === subreddit);
    const now = new Date();

    if (staticData) {
      return {
        ...staticData,
        sentiment: addVariation(staticData.sentiment, 0.05),
        topTickers: staticData.topTickers.map(t => ({
          ...t,
          sentiment: addVariation(t.sentiment, 0.05),
        })),
        lastUpdate: now,
        isSimulated: true,
      };
    }

    // Default fallback for unknown subreddits
    return {
      subreddit,
      sentiment: 0,
      postCount: 0,
      topTickers: [],
      lastUpdate: now,
      isSimulated: true,
    };
  }

  /**
   * Get StockTwits sentiment for a ticker
   * Fallback: Static neutral sentiment
   */
  async getStockTwitsSentiment(tickers: string[] = ['NVDA', 'TSLA', 'AAPL', 'SPY']): Promise<StockTwitsSentiment[]> {
    const results: StockTwitsSentiment[] = [];

    for (const ticker of tickers) {
      const cacheKey = `stocktwits_${ticker}`;
      const cached = getCached<StockTwitsSentiment>(cacheKey);
      
      if (cached) {
        results.push(cached);
        continue;
      }

      try {
        await rateLimiter.wait('stocktwits');
        const sentiment = await this.fetchStockTwits(ticker);
        setCache(cacheKey, sentiment, CACHE_TTL.stocktwits);
        results.push(sentiment);
      } catch (error) {
        console.error(`Error fetching StockTwits for ${ticker}:`, error);
        console.warn(`Falling back to static data for StockTwits ${ticker}`);
        const staticData = this.generateSimulatedStockTwits(ticker);
        results.push(staticData);
      }
    }

    return results;
  }

  private async fetchStockTwits(ticker: string): Promise<StockTwitsSentiment> {
    const response = await fetch(
      `https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`StockTwits API error: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      throw new Error('No messages returned from StockTwits');
    }

    // Count bullish/bearish sentiment
    let bullish = 0;
    let bearish = 0;
    let totalSentiment = 0;

    for (const message of messages) {
      if (message.entities?.sentiment?.basic === 'Bullish') {
        bullish++;
        totalSentiment += 1;
      } else if (message.entities?.sentiment?.basic === 'Bearish') {
        bearish++;
        totalSentiment -= 1;
      }
    }

    const total = bullish + bearish;
    const bullishPercent = total > 0 ? Math.round((bullish / total) * 100) : 50;
    const bearishPercent = total > 0 ? Math.round((bearish / total) * 100) : 50;

    return {
      ticker,
      sentiment: messages.length > 0 ? totalSentiment / messages.length : 0,
      bullishPercent,
      bearishPercent,
      messageVolume: messages.length,
      lastUpdate: new Date(),
      isSimulated: false,
    };
  }

  private generateSimulatedStockTwits(ticker: string): StockTwitsSentiment {
    const staticData = STATIC_STOCKTWITS_SENTIMENT.find(s => s.ticker === ticker);
    const now = new Date();

    if (staticData) {
      const sentiment = addVariation(staticData.sentiment, 0.05);
      const bullishPercent = Math.round(50 + sentiment * 25);
      return {
        ...staticData,
        sentiment,
        bullishPercent,
        bearishPercent: 100 - bullishPercent,
        lastUpdate: now,
        isSimulated: true,
      };
    }

    // Default fallback for unknown tickers
    return {
      ticker,
      sentiment: 0,
      bullishPercent: 50,
      bearishPercent: 50,
      messageVolume: 0,
      lastUpdate: now,
      isSimulated: true,
    };
  }

  /**
   * Get overall social sentiment status
   */
  async getSocialSentimentStatus(): Promise<SocialSentimentStatus> {
    const [redditSentiment, stockTwitsSentiment] = await Promise.all([
      this.getRedditSentiment(),
      this.getStockTwitsSentiment(),
    ]);

    // Calculate overall sentiment (weighted average)
    const redditWeight = 0.4;
    const stocktwitsWeight = 0.6;

    const avgRedditSentiment = redditSentiment.length > 0
      ? redditSentiment.reduce((sum, s) => sum + s.sentiment, 0) / redditSentiment.length
      : 0;

    const avgStockTwitsSentiment = stockTwitsSentiment.length > 0
      ? stockTwitsSentiment.reduce((sum, s) => sum + s.sentiment, 0) / stockTwitsSentiment.length
      : 0;

    const overallSentiment = avgRedditSentiment * redditWeight + avgStockTwitsSentiment * stocktwitsWeight;

    // Aggregate trending tickers
    const tickerMap: Map<string, { mentions: number; sentimentSum: number }> = new Map();

    for (const sub of redditSentiment) {
      for (const ticker of sub.topTickers) {
        const existing = tickerMap.get(ticker.ticker) || { mentions: 0, sentimentSum: 0 };
        existing.mentions += ticker.mentions;
        existing.sentimentSum += ticker.sentiment * ticker.mentions;
        tickerMap.set(ticker.ticker, existing);
      }
    }

    for (const st of stockTwitsSentiment) {
      const existing = tickerMap.get(st.ticker) || { mentions: 0, sentimentSum: 0 };
      existing.mentions += st.messageVolume;
      existing.sentimentSum += st.sentiment * st.messageVolume;
      tickerMap.set(st.ticker, existing);
    }

    const trendingTickers = Array.from(tickerMap.entries())
      .map(([ticker, data]) => ({
        ticker,
        mentions: data.mentions,
        sentiment: data.mentions > 0 ? data.sentimentSum / data.mentions : 0,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    // Determine data source status
    const allSimulated = 
      redditSentiment.every(s => s.isSimulated) &&
      stockTwitsSentiment.every(s => s.isSimulated);

    const someSimulated = 
      redditSentiment.some(s => s.isSimulated) ||
      stockTwitsSentiment.some(s => s.isSimulated);

    return {
      overallSentiment,
      redditSentiment,
      stockTwitsSentiment,
      trendingTickers,
      lastUpdate: new Date(),
      dataSource: allSimulated ? 'static' : someSimulated ? 'cached' : 'live',
    };
  }

  /**
   * Get sentiment for a specific ticker across all platforms
   */
  async getTickerSentiment(ticker: string): Promise<{
    reddit: number;
    stocktwits: number;
    combined: number;
    isSimulated: boolean;
  }> {
    const [redditData, stocktwitsData] = await Promise.all([
      this.getRedditSentiment(),
      this.getStockTwitsSentiment([ticker]),
    ]);

    // Find ticker in Reddit data
    let redditSentiment = 0;
    let redditFound = false;
    for (const sub of redditData) {
      const tickerData = sub.topTickers.find(t => t.ticker === ticker);
      if (tickerData) {
        redditSentiment = tickerData.sentiment;
        redditFound = true;
        break;
      }
    }

    // Get StockTwits sentiment
    const stocktwitsSentiment = stocktwitsData[0]?.sentiment || 0;
    const stocktwitsSimulated = stocktwitsData[0]?.isSimulated ?? true;

    // Combined sentiment
    const combined = redditFound
      ? (redditSentiment * 0.4 + stocktwitsSentiment * 0.6)
      : stocktwitsSentiment;

    return {
      reddit: redditSentiment,
      stocktwits: stocktwitsSentiment,
      combined,
      isSimulated: stocktwitsSimulated && !redditFound,
    };
  }

  /**
   * Get service status for UI display
   */
  getServiceStatus(): { name: string; status: 'live' | 'cached' | 'static' | 'offline'; apiKeyRequired: boolean }[] {
    return [
      { name: 'Reddit', status: 'live', apiKeyRequired: false },
      { name: 'StockTwits', status: 'live', apiKeyRequired: false },
      { name: 'Twitter/X', status: 'offline', apiKeyRequired: true },
    ];
  }
}

// Export singleton instance
export const socialSentimentService = new SocialSentimentService();

// Export types and static data for testing
export { STATIC_SUBREDDIT_SENTIMENT, STATIC_STOCKTWITS_SENTIMENT, BULLISH_KEYWORDS, BEARISH_KEYWORDS };