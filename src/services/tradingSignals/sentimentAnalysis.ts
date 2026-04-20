/**
 * Sentiment Analysis for Geopolitical Risk Assessment
 * 
 * PHASE 3: News and Social Media Sentiment Integration
 * 
 * Analyzes sentiment for countries with significant exposure (>20%)
 * to provide early warning signals for geopolitical risk changes.
 * 
 * UPDATED: Now integrates with real news APIs and social media:
 * - GDELT Project (FREE - No API Key)
 * - NewsAPI.org (Requires API Key)
 * - Event Registry (Free tier available)
 * - Reddit (FREE - No API Key)
 * - StockTwits (FREE - No API Key)
 * 
 * Falls back to static sentiment data when APIs are unavailable.
 * 
 * @module sentimentAnalysis
 */

import type { COGRISignal } from './advancedSignalGeneration';
import { newsSentimentService, type NewsSentimentResult } from '../newsSentimentService';
import { socialSentimentService } from '../socialSentimentService';

export interface SentimentScore {
  country: string;
  score: number;                 // -1 to 1 (negative to positive)
  trend: 'improving' | 'stable' | 'deteriorating';
  confidence: number;            // 0-1
  sources: string[];
  lastUpdated: Date;
  historicalAverage: number;     // For comparison
  volatility: number;            // Sentiment volatility
  dataSource?: 'live' | 'cached' | 'simulated';
  // Phase 3: Additional social sentiment data
  socialSentiment?: {
    reddit: number;
    stocktwits: number;
    combined: number;
  };
}

export interface SentimentAdjustment {
  signalAdjustment: number;      // Multiplier for signal strength
  confidenceAdjustment: number;  // Adjustment to confidence score
  recommendation: string;
  reasoning: string[];
}

export interface SentimentSource {
  type: 'news' | 'social' | 'policy' | 'economic';
  sentiment: number;             // -1 to 1
  weight: number;                // Importance weight
  reliability: number;           // 0-1
}

// Cache for live sentiment data
const liveSentimentCache: Map<string, { data: SentimentScore; timestamp: number }> = new Map();
const LIVE_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Analyze sentiment for a country using live APIs when available
 * Phase 3: Now includes social media sentiment
 */
export async function analyzeSentimentLive(
  country: string,
  exposure: number
): Promise<SentimentScore> {
  // Only analyze countries with >20% exposure
  if (exposure < 0.20) {
    return {
      country,
      score: 0,
      trend: 'stable',
      confidence: 0,
      sources: [],
      lastUpdated: new Date(),
      historicalAverage: 0,
      volatility: 0,
      dataSource: 'simulated'
    };
  }

  // Check cache first
  const cacheKey = `sentiment_${country}`;
  const cached = liveSentimentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LIVE_CACHE_DURATION) {
    console.log(`📊 Using cached sentiment for ${country}`);
    return cached.data;
  }

  try {
    // Try to fetch live sentiment data from multiple sources
    console.log(`📊 Fetching live sentiment for ${country}...`);
    
    // Fetch news sentiment
    const newsResult = await newsSentimentService.getAggregatedSentiment(country);
    
    // Fetch social sentiment (for market-related countries)
    let socialSentimentData = { reddit: 0, stocktwits: 0, combined: 0, isSimulated: true };
    try {
      const countryTicker = getCountryETF(country);
      if (countryTicker) {
        socialSentimentData = await socialSentimentService.getTickerSentiment(countryTicker);
      }
    } catch (socialError) {
      console.warn(`Social sentiment unavailable for ${country}, using fallback`);
    }
    
    // Combine news and social sentiment
    // Weight: News 60%, Social 40%
    const newsWeight = 0.60;
    const socialWeight = 0.40;
    const combinedSentiment = newsResult.sentiment * newsWeight + socialSentimentData.combined * socialWeight;
    
    // Determine trend based on historical comparison
    const historicalAverage = getHistoricalAverage(country);
    const trend = determineTrend(combinedSentiment, historicalAverage);
    
    // Calculate volatility
    const volatility = calculateSentimentVolatility(country);
    
    // Combine sources
    const sources = [...newsResult.sources];
    if (!socialSentimentData.isSimulated) {
      sources.push('Reddit', 'StockTwits');
    }
    
    const result: SentimentScore = {
      country,
      score: combinedSentiment,
      trend,
      confidence: newsResult.confidence,
      sources,
      lastUpdated: newsResult.lastUpdated,
      historicalAverage,
      volatility,
      dataSource: newsResult.dataSource === 'simulated' && socialSentimentData.isSimulated ? 'simulated' : 'live',
      socialSentiment: {
        reddit: socialSentimentData.reddit,
        stocktwits: socialSentimentData.stocktwits,
        combined: socialSentimentData.combined
      }
    };

    // Cache the result
    liveSentimentCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    console.log(`✅ Sentiment for ${country}: ${result.score.toFixed(2)} (${result.dataSource})`);
    return result;

  } catch (error) {
    console.error(`❌ Failed to fetch live sentiment for ${country}:`, error);
    console.warn(`Falling back to static data for ${country}`);
    // Fall back to static analysis
    return analyzeSentiment(country, exposure);
  }
}

/**
 * Get country ETF ticker for social sentiment lookup
 */
function getCountryETF(country: string): string | null {
  const countryETFs: Record<string, string> = {
    'United States': 'SPY',
    'China': 'FXI',
    'Japan': 'EWJ',
    'Germany': 'EWG',
    'United Kingdom': 'EWU',
    'France': 'EWQ',
    'India': 'INDA',
    'Brazil': 'EWZ',
    'Russia': 'RSX',
    'Taiwan': 'EWT',
    'South Korea': 'EWY',
    'Mexico': 'EWW',
    'Canada': 'EWC',
    'Australia': 'EWA',
    'Singapore': 'EWS',
    'Israel': 'EIS',
    'Saudi Arabia': 'KSA',
    'Turkey': 'TUR',
    'Argentina': 'ARGT',
    'South Africa': 'EZA',
  };
  return countryETFs[country] || null;
}

/**
 * Analyze sentiment for a country (static/simulated version)
 */
export function analyzeSentiment(
  country: string,
  exposure: number
): SentimentScore {
  // Only analyze countries with >20% exposure
  if (exposure < 0.20) {
    return {
      country,
      score: 0,
      trend: 'stable',
      confidence: 0,
      sources: [],
      lastUpdated: new Date(),
      historicalAverage: 0,
      volatility: 0,
      dataSource: 'simulated'
    };
  }
  
  // Simulate sentiment analysis from multiple sources
  const sources = gatherSentimentSources(country);
  
  // Calculate weighted sentiment score
  const score = calculateWeightedSentiment(sources);
  
  // Determine trend (compare to historical average)
  const historicalAverage = getHistoricalAverage(country);
  const trend = determineTrend(score, historicalAverage);
  
  // Calculate confidence based on source agreement
  const confidence = calculateSentimentConfidence(sources);
  
  // Calculate sentiment volatility
  const volatility = calculateSentimentVolatility(country);
  
  return {
    country,
    score,
    trend,
    confidence,
    sources: sources.map(s => s.type),
    lastUpdated: new Date(),
    historicalAverage,
    volatility,
    dataSource: 'simulated'
  };
}

/**
 * Gather sentiment from multiple sources
 * Phase 3: Updated weights - News 40%, Social 30%, Policy 20%, Economic 10%
 */
function gatherSentimentSources(country: string): SentimentSource[] {
  const sources: SentimentSource[] = [];
  
  // News sentiment (40% weight)
  sources.push({
    type: 'news',
    sentiment: getStaticNewsSentiment(country),
    weight: 0.40,
    reliability: 0.85
  });
  
  // Social media sentiment (30% weight) - Phase 3 increased weight
  sources.push({
    type: 'social',
    sentiment: simulateSocialSentiment(country),
    weight: 0.30,
    reliability: 0.70
  });
  
  // Policy announcements (20% weight)
  sources.push({
    type: 'policy',
    sentiment: getStaticPolicySentiment(country),
    weight: 0.20,
    reliability: 0.90
  });
  
  // Economic indicators sentiment (10% weight)
  sources.push({
    type: 'economic',
    sentiment: getStaticEconomicSentiment(country),
    weight: 0.10,
    reliability: 0.95
  });
  
  return sources;
}

/**
 * Get static news sentiment (fallback when APIs unavailable)
 */
function getStaticNewsSentiment(country: string): number {
  // Static sentiment based on country risk profile
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
  
  return sentimentMap[country] || 0;
}

/**
 * Simulate social media sentiment
 */
function simulateSocialSentiment(country: string): number {
  // Social media tends to be more volatile and extreme
  const newsSentiment = getStaticNewsSentiment(country);
  return newsSentiment * 1.3 + (Math.random() - 0.5) * 0.2;
}

/**
 * Get static policy sentiment
 */
function getStaticPolicySentiment(country: string): number {
  // Policy sentiment based on recent government actions
  const policySentimentMap: Record<string, number> = {
    'United States': 0.10,
    'China': -0.15,
    'Japan': 0.15,
    'Germany': 0.12,
    'United Kingdom': 0.08,
    'France': 0.05,
    'India': 0.18,
    'Brazil': -0.05,
    'Russia': -0.60,
    'Taiwan': -0.10,
    'South Korea': 0.10,
    'Canada': 0.20,
    'Australia': 0.18,
    'Singapore': 0.22,
    'Israel': -0.20,
    'Saudi Arabia': -0.10,
    'Turkey': -0.30,
    'Argentina': -0.35,
    'Ukraine': -0.40,
    'Iran': -0.50,
    'North Korea': -0.65,
    'Venezuela': -0.40,
  };
  
  return policySentimentMap[country] || 0;
}

/**
 * Get static economic sentiment
 */
function getStaticEconomicSentiment(country: string): number {
  // Economic sentiment based on GDP growth, inflation, etc.
  const economicSentimentMap: Record<string, number> = {
    'United States': 0.20,
    'China': 0.05,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.05,
    'France': 0.06,
    'India': 0.30,
    'Brazil': 0.10,
    'Russia': -0.20,
    'Taiwan': 0.15,
    'South Korea': 0.12,
    'Canada': 0.18,
    'Australia': 0.15,
    'Singapore': 0.25,
    'Israel': 0.10,
    'Saudi Arabia': 0.05,
    'Turkey': -0.15,
    'Argentina': -0.30,
    'Ukraine': -0.35,
    'Iran': -0.25,
    'Venezuela': -0.50,
  };
  
  return economicSentimentMap[country] || 0;
}

/**
 * Calculate weighted sentiment score
 */
function calculateWeightedSentiment(sources: SentimentSource[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  sources.forEach(source => {
    const effectiveWeight = source.weight * source.reliability;
    weightedSum += source.sentiment * effectiveWeight;
    totalWeight += effectiveWeight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate sentiment confidence
 */
function calculateSentimentConfidence(sources: SentimentSource[]): number {
  // Confidence based on source agreement
  const sentiments = sources.map(s => s.sentiment);
  const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
  
  // Lower variance = higher confidence
  const agreement = Math.max(0, 1 - variance * 2);
  
  // Weight by source reliability
  const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
  
  return agreement * avgReliability;
}

/**
 * Get historical average sentiment
 */
function getHistoricalAverage(country: string): number {
  // Simulated 6-month historical average
  return getStaticNewsSentiment(country) * 0.9; // Slightly less extreme than current
}

/**
 * Determine sentiment trend
 */
function determineTrend(
  currentScore: number,
  historicalAverage: number
): 'improving' | 'stable' | 'deteriorating' {
  const change = currentScore - historicalAverage;
  
  if (change > 0.10) return 'improving';
  if (change < -0.10) return 'deteriorating';
  return 'stable';
}

/**
 * Calculate sentiment volatility
 */
function calculateSentimentVolatility(country: string): number {
  // Simulated volatility based on country stability
  const volatilityMap: Record<string, number> = {
    'United States': 0.15,
    'China': 0.25,
    'Japan': 0.10,
    'Germany': 0.12,
    'Russia': 0.45,
    'Taiwan': 0.35,
    'Israel': 0.40,
    'Turkey': 0.38,
    'Argentina': 0.42,
    'Ukraine': 0.50,
    'Iran': 0.45,
    'North Korea': 0.30,
    'Venezuela': 0.48,
    'United Kingdom': 0.15,
    'France': 0.18,
    'Canada': 0.12,
    'Australia': 0.12,
    'Singapore': 0.10,
    'Switzerland': 0.08,
    'Norway': 0.08,
  };
  
  return volatilityMap[country] || 0.20;
}

/**
 * Apply sentiment adjustment to signal
 */
export function applySentimentAdjustment(
  signal: COGRISignal,
  sentiments: SentimentScore[]
): COGRISignal {
  if (sentiments.length === 0) {
    return signal;
  }
  
  // Calculate overall sentiment impact
  let sentimentImpact = 0;
  let totalExposure = 0;
  const reasoning: string[] = [];
  
  sentiments.forEach(sentiment => {
    // Weight sentiment by confidence
    const weightedSentiment = sentiment.score * sentiment.confidence;
    sentimentImpact += weightedSentiment;
    totalExposure += 1;
    
    // Add reasoning
    if (Math.abs(sentiment.score) > 0.2) {
      const direction = sentiment.score > 0 ? 'positive' : 'negative';
      const sourceInfo = sentiment.dataSource === 'live' ? ' (live data)' : '';
      const socialInfo = sentiment.socialSentiment 
        ? ` [Social: ${(sentiment.socialSentiment.combined * 100).toFixed(0)}%]`
        : '';
      reasoning.push(
        `${sentiment.country}: ${direction} sentiment (${(sentiment.score * 100).toFixed(0)}%), ` +
        `trend ${sentiment.trend}, confidence ${(sentiment.confidence * 100).toFixed(0)}%${sourceInfo}${socialInfo}`
      );
    }
  });
  
  const avgSentiment = totalExposure > 0 ? sentimentImpact / totalExposure : 0;
  
  // Calculate adjustments
  const adjustment = calculateSentimentAdjustment(avgSentiment, signal.signal);
  
  // Apply adjustments
  const adjustedStrength = Math.max(0, Math.min(100, signal.strength * adjustment.signalAdjustment));
  const adjustedConfidence = Math.max(0, Math.min(1, signal.confidence + adjustment.confidenceAdjustment));
  
  return {
    ...signal,
    strength: adjustedStrength,
    confidence: adjustedConfidence,
    reasoning: [
      ...signal.reasoning,
      ...reasoning,
      adjustment.recommendation
    ]
  };
}

/**
 * Calculate sentiment adjustment factors
 */
function calculateSentimentAdjustment(
  avgSentiment: number,
  signalDirection: 'long' | 'short' | 'neutral'
): SentimentAdjustment {
  let signalAdjustment = 1.0;
  let confidenceAdjustment = 0;
  let recommendation: string;
  const reasoning: string[] = [];
  
  if (signalDirection === 'long') {
    if (avgSentiment > 0.15) {
      // Positive sentiment supports long signal
      signalAdjustment = 1.15;
      confidenceAdjustment = 0.05;
      recommendation = 'Sentiment analysis strongly supports LONG position';
      reasoning.push('Positive sentiment across key exposure countries');
    } else if (avgSentiment < -0.15) {
      // Negative sentiment conflicts with long signal
      signalAdjustment = 0.85;
      confidenceAdjustment = -0.05;
      recommendation = 'Sentiment analysis suggests caution on LONG position';
      reasoning.push('Negative sentiment in key exposure countries');
    } else {
      recommendation = 'Sentiment analysis neutral on LONG position';
    }
  } else if (signalDirection === 'short') {
    if (avgSentiment < -0.15) {
      // Negative sentiment supports short signal
      signalAdjustment = 1.15;
      confidenceAdjustment = 0.05;
      recommendation = 'Sentiment analysis strongly supports SHORT position';
      reasoning.push('Negative sentiment across key exposure countries');
    } else if (avgSentiment > 0.15) {
      // Positive sentiment conflicts with short signal
      signalAdjustment = 0.85;
      confidenceAdjustment = -0.05;
      recommendation = 'Sentiment analysis suggests caution on SHORT position';
      reasoning.push('Positive sentiment in key exposure countries');
    } else {
      recommendation = 'Sentiment analysis neutral on SHORT position';
    }
  } else {
    recommendation = 'Sentiment analysis confirms NEUTRAL position';
  }
  
  return {
    signalAdjustment,
    confidenceAdjustment,
    recommendation,
    reasoning
  };
}

/**
 * Batch analyze sentiment for multiple countries (with live API support)
 */
export async function batchAnalyzeSentimentLive(
  countries: Array<{ country: string; exposure: number }>
): Promise<SentimentScore[]> {
  const results: SentimentScore[] = [];
  
  // Filter countries with significant exposure
  const significantCountries = countries.filter(c => c.exposure >= 0.20);
  
  // Process in batches to respect rate limits
  for (const countryData of significantCountries) {
    try {
      const sentiment = await analyzeSentimentLive(countryData.country, countryData.exposure);
      results.push(sentiment);
    } catch (error) {
      console.error(`Failed to analyze sentiment for ${countryData.country}:`, error);
      console.warn(`Falling back to static data for ${countryData.country}`);
      // Fall back to static analysis
      results.push(analyzeSentiment(countryData.country, countryData.exposure));
    }
  }
  
  return results;
}

/**
 * Batch analyze sentiment for multiple countries (static version)
 */
export function batchAnalyzeSentiment(
  countries: Array<{ country: string; exposure: number }>
): SentimentScore[] {
  return countries
    .filter(c => c.exposure >= 0.20)
    .map(c => analyzeSentiment(c.country, c.exposure));
}

/**
 * Get sentiment alert level
 */
export function getSentimentAlertLevel(
  sentiment: SentimentScore
): 'none' | 'low' | 'medium' | 'high' {
  if (sentiment.score < -0.40 && sentiment.trend === 'deteriorating') {
    return 'high';
  } else if (sentiment.score < -0.25 || sentiment.trend === 'deteriorating') {
    return 'medium';
  } else if (sentiment.score < -0.10) {
    return 'low';
  }
  return 'none';
}

/**
 * Generate sentiment report
 */
export function generateSentimentReport(
  sentiments: SentimentScore[]
): {
  overallSentiment: number;
  positiveCount: number;
  negativeCount: number;
  deterioratingCount: number;
  alerts: string[];
  liveDataCount: number;
  simulatedDataCount: number;
  socialSentimentAvg: number;
} {
  const overallSentiment = sentiments.length > 0
    ? sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    : 0;
  const positiveCount = sentiments.filter(s => s.score > 0.10).length;
  const negativeCount = sentiments.filter(s => s.score < -0.10).length;
  const deterioratingCount = sentiments.filter(s => s.trend === 'deteriorating').length;
  const liveDataCount = sentiments.filter(s => s.dataSource === 'live').length;
  const simulatedDataCount = sentiments.filter(s => s.dataSource === 'simulated').length;
  
  // Phase 3: Calculate average social sentiment
  const socialSentiments = sentiments
    .filter(s => s.socialSentiment)
    .map(s => s.socialSentiment!.combined);
  const socialSentimentAvg = socialSentiments.length > 0
    ? socialSentiments.reduce((sum, s) => sum + s, 0) / socialSentiments.length
    : 0;
  
  const alerts: string[] = [];
  sentiments.forEach(s => {
    const alertLevel = getSentimentAlertLevel(s);
    if (alertLevel !== 'none') {
      alerts.push(
        `${alertLevel.toUpperCase()}: ${s.country} sentiment ${(s.score * 100).toFixed(0)}%, ` +
        `trend ${s.trend}`
      );
    }
  });
  
  return {
    overallSentiment,
    positiveCount,
    negativeCount,
    deterioratingCount,
    alerts,
    liveDataCount,
    simulatedDataCount,
    socialSentimentAvg
  };
}

/**
 * Format sentiment score for display
 */
export function formatSentiment(sentiment: SentimentScore): string {
  const scorePercent = (sentiment.score * 100).toFixed(0);
  const sign = sentiment.score >= 0 ? '+' : '';
  const sourceInfo = sentiment.dataSource === 'live' ? ' [LIVE]' : '';
  const socialInfo = sentiment.socialSentiment 
    ? ` | Social: ${(sentiment.socialSentiment.combined * 100).toFixed(0)}%`
    : '';
  return `${sign}${scorePercent}% (${sentiment.trend}, ${(sentiment.confidence * 100).toFixed(0)}% confidence)${sourceInfo}${socialInfo}`;
}

/**
 * Clear sentiment cache
 */
export function clearSentimentCache(): void {
  liveSentimentCache.clear();
  console.log('🗑️ Sentiment cache cleared');
}

/**
 * Get sentiment service status
 * Phase 3: Now includes social sentiment service status
 */
export function getSentimentServiceStatus(): {
  cacheSize: number;
  newsApiStatus: ReturnType<typeof newsSentimentService.getServiceStatus>;
  socialApiStatus: ReturnType<typeof socialSentimentService.getServiceStatus>;
} {
  return {
    cacheSize: liveSentimentCache.size,
    newsApiStatus: newsSentimentService.getServiceStatus(),
    socialApiStatus: socialSentimentService.getServiceStatus()
  };
}