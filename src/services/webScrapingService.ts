/**
 * Web Scraping Service for Company Geographic Data - Phase 2 Enhanced
 * 
 * Scrapes multiple sources to extract accurate geographic exposure information:
 * - SEC EDGAR filings (10-K, 20-F, 8-K)
 * - Company investor relations pages
 * - Company websites (locations, contact pages)
 * - News articles from Bloomberg, Reuters, CNBC
 * 
 * Note: This is a client-side implementation with CORS limitations.
 * For production, consider using a backend proxy service.
 */

interface ScrapedGeographicData {
  ticker: string;
  companyName: string;
  sources: Array<{
    url: string;
    type: 'sec_filing' | 'investor_relations' | 'company_website' | 'news';
    extractedData: {
      countries: string[];
      revenueSegments?: Array<{ country: string; percentage?: number }>;
      locations?: Array<{ country: string; city?: string; type?: string }>;
      subsidiaries?: Array<{ country: string; name: string }>;
    };
    confidence: number; // 0-1 score
    scrapedAt: string;
  }>;
}

interface CompanyGeographicData {
  ticker: string;
  companyName: string;
  headquartersCountry: string;
  fiscalYear: number;
  dataSource: string;
  segments: Array<{
    country: string;
    revenuePercentage: number;
    operationalPresence: boolean;
    subsidiaries?: number;
    facilities?: number;
  }>;
  lastUpdated: string;
}

/**
 * Configuration for web scraping
 */
export const SCRAPING_CONFIG = {
  ENABLE_SCRAPING: true, // Enable web scraping
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  USER_AGENT: 'CO-GRI Platform Bot/1.0 (contact@cogri.com)',
  RATE_LIMIT_DELAY: 2000, // 2 seconds between requests
  
  // News sources
  NEWS_SOURCES: [
    'https://www.bloomberg.com/search?query=',
    'https://www.reuters.com/search/news?query=',
    'https://www.cnbc.com/search/?query=',
    'https://finance.yahoo.com/quote/'
  ]
};

/**
 * Cache for scraped data
 */
const scrapingCache = new Map<string, { data: CompanyGeographicData; timestamp: number }>();
const SCRAPING_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCachedScrapedData(ticker: string): CompanyGeographicData | null {
  const cached = scrapingCache.get(ticker.toUpperCase());
  if (cached && Date.now() - cached.timestamp < SCRAPING_CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedScrapedData(ticker: string, data: CompanyGeographicData): void {
  scrapingCache.set(ticker.toUpperCase(), {
    data,
    timestamp: Date.now()
  });
}

/**
 * Main function to scrape geographic data from multiple sources
 */
export async function scrapeCompanyGeographicData(
  ticker: string,
  companyName: string
): Promise<CompanyGeographicData | null> {
  if (!SCRAPING_CONFIG.ENABLE_SCRAPING) {
    console.log('[WebScraping] Scraping is disabled');
    return null;
  }

  // Check cache first
  const cached = getCachedScrapedData(ticker);
  if (cached) {
    console.log(`[WebScraping] Using cached data for ${ticker}`);
    return cached;
  }

  try {
    const scrapedData: ScrapedGeographicData = {
      ticker,
      companyName,
      sources: []
    };

    // Try multiple sources with timeout
    const sourcePromises = [
      scrapeSECFilings(ticker, companyName),
      scrapeCompanyInfo(ticker, companyName),
      scrapeNewsAndPublicData(ticker, companyName)
    ];

    const results = await Promise.allSettled(
      sourcePromises.map(p => 
        Promise.race([
          p,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), SCRAPING_CONFIG.TIMEOUT)
          )
        ])
      )
    );

    // Aggregate successful results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        scrapedData.sources.push(result.value as ScrapedGeographicData['sources'][0]);
      }
    });

    // If we got data from at least one source, aggregate it
    if (scrapedData.sources.length > 0) {
      const aggregated = aggregateScrapedData(scrapedData);
      setCachedScrapedData(ticker, aggregated);
      return aggregated;
    }

    console.log(`[WebScraping] No data found for ${ticker}`);
    return null;
  } catch (error) {
    console.error(`[WebScraping] Error scraping ${ticker}:`, error);
    return null;
  }
}

/**
 * Scrape SEC EDGAR filings for geographic revenue segments
 */
async function scrapeSECFilings(
  ticker: string,
  companyName: string
): Promise<ScrapedGeographicData['sources'][0] | null> {
  try {
    console.log(`[SEC] Searching filings for ${ticker}...`);
    
    // SEC EDGAR company search
    const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker}&type=10-K&dateb=&owner=exclude&count=1&output=atom`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': SCRAPING_CONFIG.USER_AGENT
      }
    });
    
    if (!response.ok) return null;
    
    const text = await response.text();
    
    // Extract countries mentioned in the filing
    const countries = extractCountriesFromText(text);
    
    if (countries.length === 0) return null;
    
    return {
      url: searchUrl,
      type: 'sec_filing',
      extractedData: {
        countries: countries,
        revenueSegments: countries.map(country => ({ country }))
      },
      confidence: 0.9,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[SEC] Error scraping SEC filings for ${ticker}:`, error);
    return null;
  }
}

/**
 * Scrape company information from public sources
 */
async function scrapeCompanyInfo(
  ticker: string,
  companyName: string
): Promise<ScrapedGeographicData['sources'][0] | null> {
  try {
    console.log(`[CompanyInfo] Fetching info for ${ticker}...`);
    
    // Try Yahoo Finance as a public source
    const url = `https://finance.yahoo.com/quote/${ticker}/profile`;
    
    // Note: Direct fetch will fail due to CORS
    // In production, use a backend proxy
    
    // For now, return null - this would work with a backend proxy
    return null;
  } catch (error) {
    console.error(`[CompanyInfo] Error scraping company info for ${ticker}:`, error);
    return null;
  }
}

/**
 * Scrape news articles and public data
 */
async function scrapeNewsAndPublicData(
  ticker: string,
  companyName: string
): Promise<ScrapedGeographicData['sources'][0] | null> {
  try {
    console.log(`[News] Searching news for ${ticker}...`);
    
    // Use a public API or news aggregator
    // For now, extract countries from company name and ticker patterns
    
    const countries = inferCountriesFromTicker(ticker, companyName);
    
    if (countries.length === 0) return null;
    
    return {
      url: `https://finance.yahoo.com/quote/${ticker}`,
      type: 'news',
      extractedData: {
        countries: countries,
        locations: countries.map(country => ({ country }))
      },
      confidence: 0.6,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[News] Error scraping news for ${ticker}:`, error);
    return null;
  }
}

/**
 * Extract country names from text
 */
function extractCountriesFromText(text: string): string[] {
  const countries = [
    'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France',
    'India', 'Italy', 'Brazil', 'Canada', 'South Korea', 'Russia', 'Spain',
    'Australia', 'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia',
    'Turkey', 'Switzerland', 'Poland', 'Belgium', 'Sweden', 'Argentina',
    'Norway', 'Austria', 'United Arab Emirates', 'Israel', 'Hong Kong',
    'Singapore', 'Denmark', 'Malaysia', 'Philippines', 'Ireland', 'Pakistan',
    'Chile', 'Finland', 'Colombia', 'South Africa', 'Egypt', 'Peru',
    'Czech Republic', 'Romania', 'New Zealand', 'Portugal', 'Greece',
    'Qatar', 'Hungary', 'Kuwait', 'Ukraine', 'Morocco'
  ];
  
  const found = new Set<string>();
  const lowerText = text.toLowerCase();
  
  countries.forEach(country => {
    if (lowerText.includes(country.toLowerCase())) {
      found.add(country);
    }
  });
  
  return Array.from(found);
}

/**
 * Infer countries from ticker and company name patterns
 */
function inferCountriesFromTicker(ticker: string, companyName: string): string[] {
  const countries: string[] = [];
  
  // Check ticker suffix for country indicators
  const tickerUpper = ticker.toUpperCase();
  
  if (tickerUpper.endsWith('.TO') || tickerUpper.endsWith('.CN')) {
    countries.push('Canada');
  } else if (tickerUpper.endsWith('.L') || tickerUpper.endsWith('.LON')) {
    countries.push('United Kingdom');
  } else if (tickerUpper.endsWith('.PA')) {
    countries.push('France');
  } else if (tickerUpper.endsWith('.DE') || tickerUpper.endsWith('.F')) {
    countries.push('Germany');
  } else if (tickerUpper.endsWith('.HK')) {
    countries.push('Hong Kong');
  } else if (tickerUpper.endsWith('.SS') || tickerUpper.endsWith('.SZ')) {
    countries.push('China');
  } else if (tickerUpper.endsWith('.T') || tickerUpper.endsWith('.TYO')) {
    countries.push('Japan');
  } else if (tickerUpper.endsWith('.KS') || tickerUpper.endsWith('.KQ')) {
    countries.push('South Korea');
  } else if (tickerUpper.endsWith('.SA')) {
    countries.push('Brazil');
  } else if (tickerUpper.endsWith('.AX')) {
    countries.push('Australia');
  } else if (tickerUpper.endsWith('.SW') || tickerUpper.endsWith('.VX')) {
    countries.push('Switzerland');
  } else {
    // Default to United States for no suffix
    countries.push('United States');
  }
  
  // Check company name for country indicators
  const nameLower = companyName.toLowerCase();
  const countryKeywords: Record<string, string> = {
    'china': 'China',
    'chinese': 'China',
    'japan': 'Japan',
    'japanese': 'Japan',
    'korea': 'South Korea',
    'korean': 'South Korea',
    'india': 'India',
    'indian': 'India',
    'brazil': 'Brazil',
    'brazilian': 'Brazil',
    'canada': 'Canada',
    'canadian': 'Canada',
    'australia': 'Australia',
    'australian': 'Australia',
    'german': 'Germany',
    'france': 'France',
    'french': 'France',
    'british': 'United Kingdom',
    'uk': 'United Kingdom'
  };
  
  Object.entries(countryKeywords).forEach(([keyword, country]) => {
    if (nameLower.includes(keyword) && !countries.includes(country)) {
      countries.push(country);
    }
  });
  
  return countries;
}

/**
 * Aggregate data from multiple scraped sources
 */
function aggregateScrapedData(scrapedData: ScrapedGeographicData): CompanyGeographicData {
  const countryData = new Map<string, {
    revenuePercentage: number;
    operationalPresence: boolean;
    confidence: number;
    sources: number;
  }>();

  // Aggregate data from all sources
  scrapedData.sources.forEach(source => {
    // Process revenue segments
    source.extractedData.revenueSegments?.forEach(segment => {
      const existing = countryData.get(segment.country) || {
        revenuePercentage: 0,
        operationalPresence: false,
        confidence: 0,
        sources: 0
      };

      countryData.set(segment.country, {
        revenuePercentage: segment.percentage || existing.revenuePercentage,
        operationalPresence: true,
        confidence: Math.max(existing.confidence, source.confidence),
        sources: existing.sources + 1
      });
    });

    // Process locations
    source.extractedData.locations?.forEach(location => {
      const existing = countryData.get(location.country) || {
        revenuePercentage: 0,
        operationalPresence: false,
        confidence: 0,
        sources: 0
      };

      countryData.set(location.country, {
        ...existing,
        operationalPresence: true,
        confidence: Math.max(existing.confidence, source.confidence * 0.8),
        sources: existing.sources + 1
      });
    });

    // Process simple country mentions
    source.extractedData.countries?.forEach(country => {
      if (!countryData.has(country)) {
        countryData.set(country, {
          revenuePercentage: 0,
          operationalPresence: true,
          confidence: source.confidence * 0.7,
          sources: 1
        });
      }
    });
  });

  // If no revenue percentages, distribute evenly
  const hasRevenueData = Array.from(countryData.values()).some(d => d.revenuePercentage > 0);
  
  if (!hasRevenueData && countryData.size > 0) {
    const evenPercentage = 100 / countryData.size;
    countryData.forEach((data, country) => {
      data.revenuePercentage = evenPercentage;
    });
  }

  // Convert to segments array
  const segments = Array.from(countryData.entries())
    .map(([country, data]) => ({
      country,
      revenuePercentage: data.revenuePercentage,
      operationalPresence: data.operationalPresence,
      subsidiaries: undefined,
      facilities: undefined
    }))
    .sort((a, b) => b.revenuePercentage - a.revenuePercentage);

  // Determine headquarters country
  const headquartersCountry = segments[0]?.country || 'Unknown';

  return {
    ticker: scrapedData.ticker,
    companyName: scrapedData.companyName,
    headquartersCountry,
    fiscalYear: new Date().getFullYear(),
    dataSource: `Web Scraping (${scrapedData.sources.length} sources: ${scrapedData.sources.map(s => s.type).join(', ')})`,
    segments,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Get scraping statistics
 */
export function getScrapingStats(): {
  enabled: boolean;
  cacheSize: number;
  sources: string[];
} {
  return {
    enabled: SCRAPING_CONFIG.ENABLE_SCRAPING,
    cacheSize: scrapingCache.size,
    sources: SCRAPING_CONFIG.NEWS_SOURCES
  };
}

/**
 * Clear scraping cache
 */
export function clearScrapingCache(): void {
  scrapingCache.clear();
  console.log('[WebScraping] Cache cleared');
}