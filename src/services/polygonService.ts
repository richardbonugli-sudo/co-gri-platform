/**
 * Polygon.io API Integration Service
 * Provides company ticker resolution and basic company information
 */

const POLYGON_API_KEY = 'zaFORQONHakGnqooaYc8lRtE3PKmbd2y';
const POLYGON_BASE_URL = 'https://api.polygon.io';

export interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi?: string;
  share_class_figi?: string;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  description?: string;
  sic_code?: string;
  sic_description?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
}

export interface PolygonSearchResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
}

interface FinancialStatementItem {
  value: number;
  unit: string;
  label: string;
  order: number;
}

export interface PolygonFinancials {
  start_date: string;
  end_date: string;
  filing_date: string;
  fiscal_period: string;
  fiscal_year: string;
  cik: string;
  company_name: string;
  financials: {
    income_statement?: Record<string, FinancialStatementItem>;
    balance_sheet?: Record<string, FinancialStatementItem>;
    cash_flow_statement?: Record<string, FinancialStatementItem>;
  };
}

class PolygonService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = POLYGON_API_KEY;
    this.baseUrl = POLYGON_BASE_URL;
  }

  /**
   * Get detailed information for a specific ticker
   */
  async getTickerDetails(ticker: string): Promise<PolygonTickerDetails | null> {
    try {
      const url = `${this.baseUrl}/v3/reference/tickers/${ticker.toUpperCase()}?apiKey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Polygon API error for ticker ${ticker}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        return data.results;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ticker details for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Search for tickers by company name or symbol
   */
  async searchTickers(query: string, limit: number = 10): Promise<PolygonSearchResult[]> {
    try {
      const url = `${this.baseUrl}/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=${limit}&apiKey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Polygon API search error for query ${query}:`, response.status);
        return [];
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        return data.results;
      }

      return [];
    } catch (error) {
      console.error(`Error searching tickers for ${query}:`, error);
      return [];
    }
  }

  /**
   * Get financial statements for a ticker
   */
  async getFinancials(
    ticker: string,
    timeframe: 'annual' | 'quarterly' = 'annual',
    limit: number = 1
  ): Promise<PolygonFinancials | null> {
    try {
      const url = `${this.baseUrl}/vX/reference/financials?ticker=${ticker.toUpperCase()}&timeframe=${timeframe}&limit=${limit}&apiKey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Polygon API financials error for ${ticker}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0];
      }

      return null;
    } catch (error) {
      console.error(`Error fetching financials for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Resolve a ticker or company name to a standardized ticker symbol
   * Returns the best match with company details
   */
  async resolveTicker(input: string): Promise<{
    ticker: string;
    name: string;
    exchange: string;
    country: string;
    sector?: string;
    cik?: string;
  } | null> {
    try {
      // First try exact ticker lookup
      const exactMatch = await this.getTickerDetails(input);
      if (exactMatch && exactMatch.active) {
        return {
          ticker: exactMatch.ticker,
          name: exactMatch.name,
          exchange: this.mapExchangeCode(exactMatch.primary_exchange),
          country: this.mapLocaleToCountry(exactMatch.locale),
          sector: exactMatch.sic_description,
          cik: exactMatch.cik,
        };
      }

      // If no exact match, search by name
      const searchResults = await this.searchTickers(input, 5);
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        return {
          ticker: bestMatch.ticker,
          name: bestMatch.name,
          exchange: this.mapExchangeCode(bestMatch.primary_exchange),
          country: this.mapLocaleToCountry(bestMatch.locale),
          cik: bestMatch.cik,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error resolving ticker for ${input}:`, error);
      return null;
    }
  }

  /**
   * Map Polygon exchange codes to readable exchange names
   */
  private mapExchangeCode(code: string): string {
    const exchangeMap: Record<string, string> = {
      'XNAS': 'NASDAQ',
      'XNYS': 'NYSE',
      'ARCX': 'NYSE Arca',
      'BATS': 'BATS',
      'XASE': 'NYSE American',
      'XCHI': 'Chicago Stock Exchange',
      'XPHL': 'Philadelphia Stock Exchange',
      'XBOS': 'Boston Stock Exchange',
    };

    return exchangeMap[code] || code;
  }

  /**
   * Map Polygon locale codes to country names
   */
  private mapLocaleToCountry(locale: string): string {
    const localeMap: Record<string, string> = {
      'us': 'United States',
      'ca': 'Canada',
      'mx': 'Mexico',
      'gb': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France',
      'jp': 'Japan',
      'cn': 'China',
      'in': 'India',
      'au': 'Australia',
    };

    return localeMap[locale.toLowerCase()] || locale.toUpperCase();
  }

  /**
   * Get total revenue from financial statements
   */
  async getTotalRevenue(ticker: string): Promise<number | null> {
    try {
      const financials = await this.getFinancials(ticker, 'annual', 1);
      
      if (financials?.financials?.income_statement?.revenues) {
        return financials.financials.income_statement.revenues.value;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching revenue for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Check if API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.getTickerDetails('AAPL');
      return result !== null;
    } catch (error) {
      console.error('Polygon API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const polygonService = new PolygonService();

// Export class for testing
export default PolygonService;