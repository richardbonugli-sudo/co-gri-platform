/**
 * Hybrid Data Service - Phase 2 Enhanced
 * 
 * Combines multiple data sources for maximum accuracy:
 * 1. Verified database (manual curation) - 100% confidence
 * 2. Financial APIs (FMP, Yahoo, Alpha Vantage, SEC) - 90% confidence
 * 3. Web scraping (company websites, SEC filings, news) - 80% confidence
 * 4. Sector pattern analysis (fallback) - 60% confidence
 * 
 * This service intelligently prioritizes and merges data from multiple sources
 * to provide the most accurate geographic exposure information available.
 */

import { 
  getCompanyGeographicExposureSync, 
  hasVerifiedData,
  getDataSourceInfo 
} from './geographicExposureService';
import { 
  fetchFromFMP, 
  getCachedAPIData,
  getAPIStatus,
  clearAPICache
} from './financialDataAPI';
import { 
  scrapeCompanyGeographicData, 
  getCachedScrapedData,
  setCachedScrapedData,
  getScrapingStats,
  clearScrapingCache
} from './webScrapingService';

interface GeographicSegment {
  country: string;
  revenuePercentage: number;
  operationalPresence: boolean;
  subsidiaries?: number;
  facilities?: number;
}

interface CompanyGeographicData {
  ticker: string;
  companyName: string;
  headquartersCountry: string;
  fiscalYear: number;
  dataSource: string;
  segments: GeographicSegment[];
  lastUpdated: string;
  dataQuality: 'verified' | 'api' | 'scraped' | 'estimated';
  confidenceScore: number; // 0-100
}

/**
 * Get company geographic exposure using hybrid approach
 * Tries multiple sources and returns the best available data
 */
export async function getHybridGeographicExposure(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string
): Promise<CompanyGeographicData> {
  
  console.log(`[Hybrid] Fetching data for ${ticker}...`);
  
  // Priority 1: Check verified database (100% confidence)
  if (hasVerifiedData(ticker)) {
    console.log(`[Hybrid] Using verified database for ${ticker}`);
    const verifiedData = getCompanyGeographicExposureSync(ticker, companyName, sector, homeCountry);
    return {
      ...verifiedData,
      dataQuality: 'verified',
      confidenceScore: 100
    };
  }

  // Priority 2: Check API cache (90% confidence)
  const cachedAPIData = getCachedAPIData(ticker);
  if (cachedAPIData) {
    console.log(`[Hybrid] Using cached API data for ${ticker}`);
    return {
      ...cachedAPIData,
      dataQuality: 'api',
      confidenceScore: 90
    };
  }

  // Priority 3: Check web scraping cache (80% confidence)
  const cachedScrapedData = getCachedScrapedData(ticker);
  if (cachedScrapedData) {
    console.log(`[Hybrid] Using cached scraped data for ${ticker}`);
    return {
      ...cachedScrapedData,
      dataQuality: 'scraped',
      confidenceScore: 80
    };
  }

  // Priority 4: Try live API fetch (90% confidence)
  try {
    console.log(`[Hybrid] Attempting live API fetch for ${ticker}...`);
    const apiData = await fetchFromFMP(ticker);
    if (apiData && apiData.segments.length > 0) {
      console.log(`[Hybrid] Successfully fetched from API for ${ticker}`);
      return {
        ...apiData,
        dataQuality: 'api',
        confidenceScore: 90
      };
    }
  } catch (error) {
    console.log(`[Hybrid] API fetch failed for ${ticker}, trying web scraping...`);
  }

  // Priority 5: Try web scraping (80% confidence)
  try {
    console.log(`[Hybrid] Attempting web scraping for ${ticker}...`);
    const scrapedData = await scrapeCompanyGeographicData(ticker, companyName);
    if (scrapedData && scrapedData.segments.length > 0) {
      console.log(`[Hybrid] Successfully scraped data for ${ticker}`);
      setCachedScrapedData(ticker, scrapedData);
      return {
        ...scrapedData,
        dataQuality: 'scraped',
        confidenceScore: 80
      };
    }
  } catch (error) {
    console.log(`[Hybrid] Web scraping failed for ${ticker}, using sector patterns...`);
  }

  // Priority 6: Fallback to sector patterns (60% confidence)
  console.log(`[Hybrid] Using sector pattern estimate for ${ticker}`);
  const estimatedData = getCompanyGeographicExposureSync(ticker, companyName, sector, homeCountry);
  return {
    ...estimatedData,
    dataQuality: 'estimated',
    confidenceScore: 60
  };
}

/**
 * Get data quality badge information
 */
export function getDataQualityBadge(dataQuality: CompanyGeographicData['dataQuality']): {
  label: string;
  emoji: string;
  color: string;
  description: string;
  stars: number;
} {
  switch (dataQuality) {
    case 'verified':
      return {
        label: 'Verified Data',
        emoji: '✅',
        color: 'green',
        description: 'Manually verified from official sources (SEC filings, annual reports, investor relations)',
        stars: 5
      };
    case 'api':
      return {
        label: 'API Data',
        emoji: '🔄',
        color: 'blue',
        description: 'Real-time data from financial APIs (Financial Modeling Prep, Yahoo Finance, SEC EDGAR)',
        stars: 4
      };
    case 'scraped':
      return {
        label: 'Web Scraped',
        emoji: '🌐',
        color: 'purple',
        description: 'Extracted from company websites, SEC filings, investor relations, and news sources',
        stars: 3
      };
    case 'estimated':
      return {
        label: 'Estimated',
        emoji: '📊',
        color: 'orange',
        description: 'Estimated based on sector patterns and home country bias',
        stars: 2
      };
  }
}

/**
 * Combine multiple data sources to improve accuracy
 * This advanced feature merges data from multiple sources using weighted averaging
 */
export async function mergeMultipleSources(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string
): Promise<CompanyGeographicData> {
  const sources: Array<CompanyGeographicData | null> = [];

  console.log(`[Hybrid] Attempting to merge multiple sources for ${ticker}...`);

  // Try all sources in parallel
  const [apiData, scrapedData] = await Promise.allSettled([
    fetchFromFMP(ticker),
    scrapeCompanyGeographicData(ticker, companyName)
  ]);

  if (apiData.status === 'fulfilled' && apiData.value) {
    sources.push({ ...apiData.value, dataQuality: 'api', confidenceScore: 90 } as CompanyGeographicData);
    console.log(`[Hybrid] API source added for ${ticker}`);
  }
  if (scrapedData.status === 'fulfilled' && scrapedData.value) {
    sources.push({ ...scrapedData.value, dataQuality: 'scraped', confidenceScore: 80 } as CompanyGeographicData);
    console.log(`[Hybrid] Scraped source added for ${ticker}`);
  }

  // If we have multiple sources, merge them
  if (sources.length > 1) {
    console.log(`[Hybrid] Merging ${sources.length} sources for ${ticker}`);
    return mergeGeographicData(sources as CompanyGeographicData[]);
  }

  // If we have one source, return it
  if (sources.length === 1) {
    console.log(`[Hybrid] Using single source for ${ticker}`);
    return sources[0]!;
  }

  // Fallback to sector patterns
  console.log(`[Hybrid] No sources available, using sector patterns for ${ticker}`);
  const estimatedData = getCompanyGeographicExposureSync(ticker, companyName, sector, homeCountry);
  return {
    ...estimatedData,
    dataQuality: 'estimated',
    confidenceScore: 60
  };
}

/**
 * Merge geographic data from multiple sources using weighted averaging
 */
function mergeGeographicData(sources: CompanyGeographicData[]): CompanyGeographicData {
  const countryMap = new Map<string, {
    revenuePercentage: number;
    operationalPresence: boolean;
    weight: number;
    sources: number;
  }>();

  console.log(`[Hybrid] Merging data from ${sources.length} sources`);

  // Aggregate data from all sources with weighted average
  sources.forEach(source => {
    const weight = source.confidenceScore / 100;
    
    source.segments.forEach(segment => {
      const existing = countryMap.get(segment.country) || {
        revenuePercentage: 0,
        operationalPresence: false,
        weight: 0,
        sources: 0
      };

      countryMap.set(segment.country, {
        revenuePercentage: existing.revenuePercentage + (segment.revenuePercentage * weight),
        operationalPresence: existing.operationalPresence || segment.operationalPresence,
        weight: existing.weight + weight,
        sources: existing.sources + 1
      });
    });
  });

  // Calculate weighted averages and normalize
  const segments: GeographicSegment[] = [];
  let totalPercentage = 0;

  countryMap.forEach((data, country) => {
    const normalizedPercentage = data.weight > 0 ? data.revenuePercentage / data.weight : 0;
    segments.push({
      country,
      revenuePercentage: normalizedPercentage,
      operationalPresence: data.operationalPresence
    });
    totalPercentage += normalizedPercentage;
  });

  // Normalize to 100%
  if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 1) {
    segments.forEach(segment => {
      segment.revenuePercentage = (segment.revenuePercentage / totalPercentage) * 100;
    });
  }

  // Sort by revenue percentage
  segments.sort((a, b) => b.revenuePercentage - a.revenuePercentage);

  const primarySource = sources[0];
  const avgConfidence = Math.round(sources.reduce((sum, s) => sum + s.confidenceScore, 0) / sources.length);

  return {
    ticker: primarySource.ticker,
    companyName: primarySource.companyName,
    headquartersCountry: segments[0]?.country || primarySource.headquartersCountry,
    fiscalYear: primarySource.fiscalYear,
    dataSource: `Merged from ${sources.length} sources (${sources.map(s => s.dataQuality).join(', ')})`,
    segments,
    lastUpdated: new Date().toISOString().split('T')[0],
    dataQuality: 'api', // Merged data gets 'api' quality
    confidenceScore: avgConfidence
  };
}

/**
 * Get detailed source information with quality indicators
 */
export function getDetailedSourceInfo(data: CompanyGeographicData): string {
  const qualityBadge = getDataQualityBadge(data.dataQuality);
  const stars = '⭐'.repeat(qualityBadge.stars) + '☆'.repeat(5 - qualityBadge.stars);
  
  return `${qualityBadge.emoji} ${qualityBadge.label} ${stars}\n` +
         `Confidence: ${data.confidenceScore}%\n` +
         `${qualityBadge.description}\n\n` +
         `Data Source: ${data.dataSource}\n` +
         `Last Updated: ${data.lastUpdated}`;
}

/**
 * Get system status and statistics
 */
export function getSystemStatus(): {
  verifiedCompanies: number;
  apiStatus: ReturnType<typeof getAPIStatus>;
  scrapingStats: ReturnType<typeof getScrapingStats>;
  totalCacheSize: number;
} {
  const apiStatus = getAPIStatus();
  const scrapingStats = getScrapingStats();
  
  return {
    verifiedCompanies: 93, // Updated count from Phase 1
    apiStatus,
    scrapingStats,
    totalCacheSize: apiStatus.cacheSize + scrapingStats.cacheSize
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  clearAPICache();
  clearScrapingCache();
  console.log('[Hybrid] All caches cleared');
}

/**
 * Validate and enhance geographic data
 */
export function validateGeographicData(data: CompanyGeographicData): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check if percentages add up to ~100%
  const totalPercentage = data.segments.reduce((sum, s) => sum + s.revenuePercentage, 0);
  if (Math.abs(totalPercentage - 100) > 5) {
    warnings.push(`Revenue percentages sum to ${totalPercentage.toFixed(1)}% instead of 100%`);
  }
  
  // Check for missing headquarters country
  if (data.headquartersCountry === 'Unknown') {
    warnings.push('Headquarters country is unknown');
    suggestions.push('Consider adding this company to the verified database');
  }
  
  // Check data freshness
  const lastUpdated = new Date(data.lastUpdated);
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 90) {
    warnings.push(`Data is ${Math.round(daysSinceUpdate)} days old`);
    suggestions.push('Consider refreshing the data from live sources');
  }
  
  // Check confidence score
  if (data.confidenceScore < 70) {
    warnings.push(`Low confidence score (${data.confidenceScore}%)`);
    suggestions.push('Results may be less accurate. Consider using verified data or multiple sources');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Get recommendations for improving data quality
 */
export function getDataQualityRecommendations(ticker: string): string[] {
  const recommendations: string[] = [];
  
  if (!hasVerifiedData(ticker)) {
    recommendations.push('📝 Add this company to the verified database for highest accuracy');
  }
  
  const apiStatus = getAPIStatus();
  if (!apiStatus.fmp.hasKey) {
    recommendations.push('🔑 Add Financial Modeling Prep API key for real-time data access');
  }
  if (!apiStatus.alphaVantage.hasKey) {
    recommendations.push('🔑 Add Alpha Vantage API key for additional data sources');
  }
  
  recommendations.push('🔄 Enable automatic data refresh for up-to-date information');
  recommendations.push('🌐 Use multiple data sources for improved accuracy');
  
  return recommendations;
}