// Ticker Resolution Service
// Integrates Yahoo Finance, Alpha Vantage, and Marketstack APIs for real-time ticker lookup

interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  source: 'yahoo' | 'alphavantage' | 'marketstack' | 'local';
}

interface AlphaVantageSearchResult {
  '1. symbol': string;
  '2. name': string;
  '3. type': string;
  '4. region': string;
  '5. marketOpen': string;
  '6. marketClose': string;
  '7. timezone': string;
  '8. currency': string;
  '9. matchScore': string;
}

interface YahooQuote {
  symbol?: string;
  longname?: string;
  shortname?: string;
  exchange?: string;
  exchDisp?: string;
  sector?: string;
  quoteType?: string;
}

interface YahooSearchResponse {
  quotes?: YahooQuote[];
}

interface AlphaVantageOverview {
  Symbol?: string;
  Name?: string;
  Exchange?: string;
  Country?: string;
  Sector?: string;
  Note?: string;
  'Error Message'?: string;
}

interface AlphaVantageSearchResponse {
  bestMatches?: AlphaVantageSearchResult[];
  Note?: string;
  'Error Message'?: string;
}

interface MarketstackTicker {
  symbol: string;
  name: string;
  stock_exchange: {
    name: string;
    acronym: string;
    mic: string;
    country: string;
    country_code: string;
    city: string;
    website: string;
  };
  has_intraday: boolean;
  has_eod: boolean;
  country: string;
}

interface MarketstackSearchResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: MarketstackTicker[];
}

// API Configuration
const ALPHA_VANTAGE_API_KEY = 'demo'; // Users should replace with their own key from https://www.alphavantage.co/
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

const YAHOO_FINANCE_SEARCH_URL = 'https://query2.finance.yahoo.com/v1/finance/search';

const MARKETSTACK_API_KEY = '64040504cef9e565bd09fa77b54ae274';
const MARKETSTACK_BASE_URL = 'https://api.marketstack.com/v1'; // Changed to HTTPS

/**
 * Search for companies using Marketstack API
 */
async function searchMarketstack(query: string): Promise<CompanySearchResult[]> {
  try {
    const url = `${MARKETSTACK_BASE_URL}/tickers?access_key=${MARKETSTACK_API_KEY}&search=${encodeURIComponent(query)}&limit=10`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Marketstack API request failed');
    }

    const data: MarketstackSearchResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }

    return data.data.map((ticker) => ({
      symbol: ticker.symbol,
      name: ticker.name,
      exchange: ticker.stock_exchange?.acronym || ticker.stock_exchange?.name || 'Unknown',
      country: ticker.stock_exchange?.country || ticker.country || 'Unknown',
      sector: 'General', // Marketstack doesn't provide sector in search
      source: 'marketstack' as const
    }));
  } catch (error) {
    console.error('Marketstack search error:', error);
    return [];
  }
}

/**
 * Search for companies using Yahoo Finance API
 */
async function searchYahooFinance(query: string): Promise<CompanySearchResult[]> {
  try {
    const url = `${YAHOO_FINANCE_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Yahoo Finance API request failed');
    }

    const data: YahooSearchResponse = await response.json();
    const quotes = data.quotes || [];

    return quotes
      .filter((quote: YahooQuote) => quote.quoteType === 'EQUITY')
      .slice(0, 10)
      .map((quote: YahooQuote) => ({
        symbol: quote.symbol || '',
        name: quote.longname || quote.shortname || '',
        exchange: quote.exchange || quote.exchDisp || '',
        country: getCountryFromExchange(quote.exchange || ''),
        sector: quote.sector || 'General',
        source: 'yahoo' as const
      }));
  } catch (error) {
    console.error('Yahoo Finance search error:', error);
    return [];
  }
}

/**
 * Search for companies using Alpha Vantage API
 */
async function searchAlphaVantage(query: string): Promise<CompanySearchResult[]> {
  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Alpha Vantage API request failed');
    }

    const data: AlphaVantageSearchResponse = await response.json();
    
    // Check for API key error
    if (data.Note || data['Error Message']) {
      console.warn('Alpha Vantage API limit reached or error:', data.Note || data['Error Message']);
      return [];
    }

    const matches: AlphaVantageSearchResult[] = data.bestMatches || [];

    return matches.slice(0, 10).map((match) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      exchange: getExchangeFromRegion(match['4. region']),
      country: match['4. region'],
      sector: 'General', // Alpha Vantage doesn't provide sector in search
      source: 'alphavantage' as const
    }));
  } catch (error) {
    console.error('Alpha Vantage search error:', error);
    return [];
  }
}

/**
 * Get company details from Alpha Vantage
 */
async function getAlphaVantageCompanyOverview(symbol: string): Promise<AlphaVantageOverview | null> {
  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Alpha Vantage API request failed');
    }

    const data: AlphaVantageOverview = await response.json();
    
    if (data.Note || data['Error Message']) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Alpha Vantage overview error:', error);
    return null;
  }
}

/**
 * Map region to exchange name
 */
function getExchangeFromRegion(region: string): string {
  const regionMap: Record<string, string> = {
    'United States': 'NASDAQ/NYSE',
    'Canada': 'TSX',
    'United Kingdom': 'LSE',
    'Hong Kong': 'HKEX',
    'Singapore': 'SGX',
    'Brazil': 'B3',
    'South Africa': 'JSE',
    'Taiwan': 'TWSE'
  };
  return regionMap[region] || region;
}

/**
 * Get country from exchange code
 */
function getCountryFromExchange(exchange: string): string {
  const exchangeMap: Record<string, string> = {
    'NMS': 'United States',
    'NYQ': 'United States',
    'PCX': 'United States',
    'TOR': 'Canada',
    'TSE': 'Canada',
    'LON': 'United Kingdom',
    'HKG': 'Hong Kong',
    'SES': 'Singapore',
    'SAO': 'Brazil',
    'JNB': 'South Africa',
    'TAI': 'Taiwan'
  };
  return exchangeMap[exchange] || 'Unknown';
}

/**
 * Search for companies using local database fallback
 */
async function searchLocalDatabase(query: string): Promise<CompanySearchResult[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const { searchCompanies } = await import('@/utils/companyDatabase');
    const results = searchCompanies(query);
    
    return results.slice(0, 10).map(company => ({
      symbol: company.ticker,
      name: company.name,
      exchange: company.exchange,
      country: company.country,
      sector: company.sector,
      source: 'local' as const
    }));
  } catch (error) {
    console.error('Local database search error:', error);
    return [];
  }
}

/**
 * Deduplicate results by company name, keeping all unique exchange listings
 */
function deduplicateResults(results: CompanySearchResult[]): CompanySearchResult[] {
  const seen = new Map<string, CompanySearchResult[]>();
  
  // Group by normalized company name
  results.forEach(result => {
    const normalizedName = result.name.toLowerCase().trim();
    if (!seen.has(normalizedName)) {
      seen.set(normalizedName, []);
    }
    seen.get(normalizedName)!.push(result);
  });
  
  // For each company, keep all unique exchange listings
  const deduplicated: CompanySearchResult[] = [];
  seen.forEach((listings) => {
    // Keep all listings if they have different symbols or exchanges
    const uniqueListings = new Map<string, CompanySearchResult>();
    listings.forEach(listing => {
      const key = `${listing.symbol}-${listing.exchange}`;
      if (!uniqueListings.has(key)) {
        uniqueListings.set(key, listing);
      }
    });
    deduplicated.push(...uniqueListings.values());
  });
  
  return deduplicated;
}

/**
 * Main search function with aggregated results from all sources
 * Combines results from: Marketstack, Yahoo Finance, Alpha Vantage, and Local Database
 */
export async function searchCompanies(query: string): Promise<CompanySearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.trim();
  
  // Prioritize local database for faster results and avoid API errors
  const localResults = await searchLocalDatabase(normalizedQuery);
  
  // If we have local results, return them immediately
  if (localResults.length > 0) {
    console.log('✅ Found results in local database:', localResults.length);
    return localResults;
  }
  
  // Only try external APIs if local database has no results
  const [marketstackResults, yahooResults, alphaResults] = await Promise.all([
    searchMarketstack(normalizedQuery),
    searchYahooFinance(normalizedQuery),
    searchAlphaVantage(normalizedQuery)
  ]);

  // Combine all results
  const allResults = [
    ...marketstackResults,
    ...yahooResults,
    ...alphaResults
  ];

  // Deduplicate while preserving multiple exchange listings
  const deduplicatedResults = deduplicateResults(allResults);

  // Sort by relevance: exact matches first, then by source priority
  const sortedResults = deduplicatedResults.sort((a, b) => {
    const aExactMatch = a.symbol.toUpperCase() === normalizedQuery.toUpperCase() || 
                        a.name.toLowerCase().includes(normalizedQuery.toLowerCase());
    const bExactMatch = b.symbol.toUpperCase() === normalizedQuery.toUpperCase() || 
                        b.name.toLowerCase().includes(normalizedQuery.toLowerCase());
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // Source priority: marketstack > yahoo > alphavantage > local
    const sourcePriority: Record<string, number> = {
      'marketstack': 1,
      'yahoo': 2,
      'alphavantage': 3,
      'local': 4
    };
    
    return (sourcePriority[a.source] || 5) - (sourcePriority[b.source] || 5);
  });

  // Return top 15 results to show multiple exchange listings
  return sortedResults.slice(0, 15);
}

/**
 * Get detailed company information
 */
export async function getCompanyDetails(symbol: string): Promise<CompanySearchResult | null> {
  // Try local database first
  const localResults = await searchLocalDatabase(symbol);
  if (localResults.length > 0 && localResults[0].symbol.toUpperCase() === symbol.toUpperCase()) {
    return localResults[0];
  }

  // Try Marketstack
  const marketstackResults = await searchMarketstack(symbol);
  if (marketstackResults.length > 0 && marketstackResults[0].symbol.toUpperCase() === symbol.toUpperCase()) {
    return marketstackResults[0];
  }

  // Try Yahoo Finance
  const yahooResults = await searchYahooFinance(symbol);
  if (yahooResults.length > 0 && yahooResults[0].symbol.toUpperCase() === symbol.toUpperCase()) {
    return yahooResults[0];
  }

  // Try Alpha Vantage with company overview
  const alphaOverview = await getAlphaVantageCompanyOverview(symbol);
  if (alphaOverview && alphaOverview.Symbol) {
    return {
      symbol: alphaOverview.Symbol,
      name: alphaOverview.Name || symbol,
      exchange: alphaOverview.Exchange || 'Unknown',
      country: alphaOverview.Country || 'Unknown',
      sector: alphaOverview.Sector || 'General',
      source: 'alphavantage'
    };
  }

  return null;
}

/**
 * Validate if a ticker exists
 */
export async function validateTicker(ticker: string): Promise<boolean> {
  const details = await getCompanyDetails(ticker);
  return details !== null;
}