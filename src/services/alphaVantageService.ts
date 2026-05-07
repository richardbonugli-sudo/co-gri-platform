/**
 * Alpha Vantage API Integration Service
 * Provides company fundamentals, financial statements, market data, and VIX data
 * 
 * ENHANCED: Added VIX data fetching, stock quotes, and rate limiting
 */

// Use environment variable for API key, fallback to default for development
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting: 5 requests per minute for free tier
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export interface AlphaVantageCompanyOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  OfficialSite: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  AnalystRatingStrongBuy: string;
  AnalystRatingBuy: string;
  AnalystRatingHold: string;
  AnalystRatingSell: string;
  AnalystRatingStrongSell: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  '50DayMovingAverage': string;
  '200DayMovingAverage': string;
  SharesOutstanding: string;
  SharesFloat: string;
  PercentInsiders: string;
  PercentInstitutions: string;
  DividendDate: string;
  ExDividendDate: string;
}

export interface AlphaVantageIncomeStatement {
  fiscalDateEnding: string;
  reportedCurrency: string;
  grossProfit: string;
  totalRevenue: string;
  costOfRevenue: string;
  costofGoodsAndServicesSold: string;
  operatingIncome: string;
  sellingGeneralAndAdministrative: string;
  researchAndDevelopment: string;
  operatingExpenses: string;
  investmentIncomeNet: string;
  netInterestIncome: string;
  interestIncome: string;
  interestExpense: string;
  nonInterestIncome: string;
  otherNonOperatingIncome: string;
  depreciation: string;
  depreciationAndAmortization: string;
  incomeBeforeTax: string;
  incomeTaxExpense: string;
  interestAndDebtExpense: string;
  netIncomeFromContinuingOperations: string;
  comprehensiveIncomeNetOfTax: string;
  ebit: string;
  ebitda: string;
  netIncome: string;
}

export interface AlphaVantageIncomeStatementResponse {
  symbol: string;
  annualReports: AlphaVantageIncomeStatement[];
  quarterlyReports: AlphaVantageIncomeStatement[];
}

export interface AlphaVantageBalanceSheet {
  fiscalDateEnding: string;
  reportedCurrency: string;
  totalAssets: string;
  totalCurrentAssets: string;
  cashAndCashEquivalentsAtCarryingValue: string;
  cashAndShortTermInvestments: string;
  inventory: string;
  currentNetReceivables: string;
  totalNonCurrentAssets: string;
  propertyPlantEquipment: string;
  accumulatedDepreciationAmortizationPPE: string;
  intangibleAssets: string;
  intangibleAssetsExcludingGoodwill: string;
  goodwill: string;
  investments: string;
  longTermInvestments: string;
  shortTermInvestments: string;
  otherCurrentAssets: string;
  otherNonCurrentAssets: string;
  totalLiabilities: string;
  totalCurrentLiabilities: string;
  currentAccountsPayable: string;
  deferredRevenue: string;
  currentDebt: string;
  shortTermDebt: string;
  totalNonCurrentLiabilities: string;
  capitalLeaseObligations: string;
  longTermDebt: string;
  currentLongTermDebt: string;
  longTermDebtNoncurrent: string;
  shortLongTermDebtTotal: string;
  otherCurrentLiabilities: string;
  otherNonCurrentLiabilities: string;
  totalShareholderEquity: string;
  treasuryStock: string;
  retainedEarnings: string;
  commonStock: string;
  commonStockSharesOutstanding: string;
}

export interface AlphaVantageBalanceSheetResponse {
  symbol: string;
  annualReports: AlphaVantageBalanceSheet[];
  quarterlyReports: AlphaVantageBalanceSheet[];
}

export interface AlphaVantageCashFlow {
  fiscalDateEnding: string;
  reportedCurrency: string;
  operatingCashflow: string;
  paymentsForOperatingActivities: string;
  proceedsFromOperatingActivities: string;
  changeInOperatingLiabilities: string;
  changeInOperatingAssets: string;
  depreciationDepletionAndAmortization: string;
  capitalExpenditures: string;
  changeInReceivables: string;
  changeInInventory: string;
  profitLoss: string;
  cashflowFromInvestment: string;
  cashflowFromFinancing: string;
  proceedsFromRepaymentsOfShortTermDebt: string;
  paymentsForRepurchaseOfCommonStock: string;
  paymentsForRepurchaseOfEquity: string;
  paymentsForRepurchaseOfPreferredStock: string;
  dividendPayout: string;
  dividendPayoutCommonStock: string;
  dividendPayoutPreferredStock: string;
  proceedsFromIssuanceOfCommonStock: string;
  proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: string;
  proceedsFromIssuanceOfPreferredStock: string;
  proceedsFromRepurchaseOfEquity: string;
  proceedsFromSaleOfTreasuryStock: string;
  changeInCashAndCashEquivalents: string;
  changeInExchangeRate: string;
  netIncome: string;
}

export interface AlphaVantageCashFlowResponse {
  symbol: string;
  annualReports: AlphaVantageCashFlow[];
  quarterlyReports: AlphaVantageCashFlow[];
}

export interface AlphaVantageEarnings {
  fiscalDateEnding: string;
  reportedEPS: string;
}

export interface AlphaVantageEarningsResponse {
  symbol: string;
  annualEarnings: AlphaVantageEarnings[];
  quarterlyEarnings: AlphaVantageEarnings[];
}

// NEW: Stock quote interface
export interface StockQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string;
}

// NEW: VIX data interface
export interface VIXData {
  level: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  source: 'live' | 'cached' | 'simulated';
}

// NEW: Data status interface
export interface AlphaVantageDataStatus {
  connected: boolean;
  lastUpdate: Date | null;
  lastError: string | null;
  requestsRemaining: number;
  dataSource: 'live' | 'cached' | 'simulated';
}

class AlphaVantageService {
  private apiKey: string;
  private baseUrl: string;
  private requestQueue: number[] = [];
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes cache for quotes
  private status: AlphaVantageDataStatus = {
    connected: false,
    lastUpdate: null,
    lastError: null,
    requestsRemaining: RATE_LIMIT_REQUESTS,
    dataSource: 'simulated'
  };

  constructor() {
    this.apiKey = ALPHA_VANTAGE_API_KEY;
    this.baseUrl = ALPHA_VANTAGE_BASE_URL;
    
    // Log API key status (masked for security)
    if (this.apiKey && this.apiKey !== 'demo') {
      console.log('Alpha Vantage API: Using configured API key');
    } else {
      console.log('Alpha Vantage API: Using demo mode (limited functionality)');
    }
  }

  /**
   * Rate limiter - ensures we don't exceed API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests from the queue
    this.requestQueue = this.requestQueue.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    // If we've hit the limit, wait
    if (this.requestQueue.length >= RATE_LIMIT_REQUESTS) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = RATE_LIMIT_WINDOW_MS - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`Alpha Vantage rate limit: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Add current request to queue
    this.requestQueue.push(Date.now());
    this.status.requestsRemaining = Math.max(0, RATE_LIMIT_REQUESTS - this.requestQueue.length);
  }

  /**
   * Build API URL with parameters
   */
  private buildUrl(params: Record<string, string>): string {
    const urlParams = new URLSearchParams({
      ...params,
      apikey: this.apiKey
    });
    return `${this.baseUrl}?${urlParams.toString()}`;
  }

  /**
   * NEW: Get real-time stock quote
   */
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `quote_${symbol}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      this.status.dataSource = 'cached';
      return cached.data as StockQuote;
    }

    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data.Note || data['Error Message']) {
        throw new Error(data.Note || data['Error Message']);
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        return null;
      }

      const stockQuote: StockQuote = {
        symbol: quote['01. symbol'],
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        price: parseFloat(quote['05. price']),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent']
      };

      // Update cache
      this.cache.set(cacheKey, { data: stockQuote, timestamp: Date.now() });
      
      // Update status
      this.status.connected = true;
      this.status.lastUpdate = new Date();
      this.status.lastError = null;
      this.status.dataSource = 'live';

      return stockQuote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching quote for ${symbol}:`, errorMessage);
      
      this.status.lastError = errorMessage;
      
      // Return cached data if available
      if (cached) {
        this.status.dataSource = 'cached';
        return cached.data as StockQuote;
      }
      
      return null;
    }
  }

  /**
   * NEW: Get VIX level using VIXY ETF as proxy
   * VIXY tracks VIX short-term futures
   */
  async getVIXData(): Promise<VIXData> {
    const cacheKey = 'vix_data';
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return { ...(cached.data as VIXData), source: 'cached' };
    }

    try {
      // Try VIXY first (VIX short-term futures ETF)
      const vixyQuote = await this.getStockQuote('VIXY');
      
      if (vixyQuote) {
        // Convert VIXY price to approximate VIX level
        // VIXY typically trades at a fraction of VIX due to contango
        const vixLevel = vixyQuote.price * 1.5; // Rough approximation
        
        const vixData: VIXData = {
          level: Math.max(10, Math.min(80, vixLevel)), // Clamp to reasonable range
          change: vixyQuote.change * 1.5,
          changePercent: parseFloat(vixyQuote.changePercent.replace('%', '')),
          timestamp: new Date(),
          source: 'live'
        };

        // Update cache
        this.cache.set(cacheKey, { data: vixData, timestamp: Date.now() });
        
        return vixData;
      }

      // Fallback to simulated data
      return this.getSimulatedVIXData();
    } catch (error) {
      console.error('Error fetching VIX data:', error);
      
      // Return cached data if available
      if (cached) {
        return { ...(cached.data as VIXData), source: 'cached' };
      }
      
      return this.getSimulatedVIXData();
    }
  }

  /**
   * Get simulated VIX data as fallback
   */
  private getSimulatedVIXData(): VIXData {
    // Generate realistic VIX value based on market conditions
    const baseVIX = 18;
    const randomVariation = (Math.random() - 0.5) * 8;
    
    return {
      level: Math.max(10, Math.min(40, baseVIX + randomVariation)),
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 5,
      timestamp: new Date(),
      source: 'simulated'
    };
  }

  /**
   * NEW: Get multiple stock quotes efficiently
   */
  async getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const quotes = new Map<string, StockQuote>();
    
    // Process in batches to respect rate limits
    for (const symbol of symbols) {
      const quote = await this.getStockQuote(symbol);
      if (quote) {
        quotes.set(symbol, quote);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return quotes;
  }

  /**
   * Get company overview and fundamentals
   */
  async getCompanyOverview(symbol: string): Promise<AlphaVantageCompanyOverview | null> {
    const cacheKey = `overview_${symbol}`;
    
    // Check cache first (longer expiry for fundamentals)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 min cache
      this.status.dataSource = 'cached';
      return cached.data as AlphaVantageCompanyOverview;
    }

    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      // Check if API returned an error or empty response
      if (!data.Symbol || data.Note || data['Error Message']) {
        console.error(`Alpha Vantage API error:`, data.Note || data['Error Message']);
        return null;
      }

      // Update cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      // Update status
      this.status.connected = true;
      this.status.lastUpdate = new Date();
      this.status.lastError = null;
      this.status.dataSource = 'live';

      return data;
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error);
      
      // Return cached data if available
      if (cached) {
        this.status.dataSource = 'cached';
        return cached.data as AlphaVantageCompanyOverview;
      }
      
      return null;
    }
  }

  /**
   * Get income statement (annual and quarterly)
   */
  async getIncomeStatement(symbol: string): Promise<AlphaVantageIncomeStatementResponse | null> {
    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'INCOME_STATEMENT',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.symbol || data.Note || data['Error Message']) {
        console.error(`Alpha Vantage API error:`, data.Note || data['Error Message']);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching income statement for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get balance sheet (annual and quarterly)
   */
  async getBalanceSheet(symbol: string): Promise<AlphaVantageBalanceSheetResponse | null> {
    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'BALANCE_SHEET',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.symbol || data.Note || data['Error Message']) {
        console.error(`Alpha Vantage API error:`, data.Note || data['Error Message']);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching balance sheet for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get cash flow statement (annual and quarterly)
   */
  async getCashFlow(symbol: string): Promise<AlphaVantageCashFlowResponse | null> {
    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'CASH_FLOW',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.symbol || data.Note || data['Error Message']) {
        console.error(`Alpha Vantage API error:`, data.Note || data['Error Message']);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching cash flow for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get earnings data (annual and quarterly)
   */
  async getEarnings(symbol: string): Promise<AlphaVantageEarningsResponse | null> {
    try {
      await this.rateLimit();
      
      const url = this.buildUrl({
        function: 'EARNINGS',
        symbol: symbol.toUpperCase()
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.symbol || data.Note || data['Error Message']) {
        console.error(`Alpha Vantage API error:`, data.Note || data['Error Message']);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching earnings for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Resolve company ticker and get basic information
   */
  async resolveCompany(symbol: string): Promise<{
    ticker: string;
    name: string;
    exchange: string;
    country: string;
    sector: string;
    industry: string;
    description: string;
    cik: string;
    address: string;
    officialSite: string;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (overview) {
        return {
          ticker: overview.Symbol,
          name: overview.Name,
          exchange: overview.Exchange,
          country: overview.Country,
          sector: overview.Sector,
          industry: overview.Industry,
          description: overview.Description,
          cik: overview.CIK,
          address: overview.Address,
          officialSite: overview.OfficialSite
        };
      }

      return null;
    } catch (error) {
      console.error(`Error resolving company for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get latest financial metrics
   */
  async getFinancialMetrics(symbol: string): Promise<{
    marketCap: number;
    revenue: number;
    grossProfit: number;
    netIncome: number;
    ebitda: number;
    eps: number;
    peRatio: number;
    profitMargin: number;
    operatingMargin: number;
    roe: number;
    roa: number;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (!overview) {
        return null;
      }

      return {
        marketCap: parseFloat(overview.MarketCapitalization) || 0,
        revenue: parseFloat(overview.RevenueTTM) || 0,
        grossProfit: parseFloat(overview.GrossProfitTTM) || 0,
        netIncome: parseFloat(overview.DilutedEPSTTM) * parseFloat(overview.SharesOutstanding) || 0,
        ebitda: parseFloat(overview.EBITDA) || 0,
        eps: parseFloat(overview.EPS) || 0,
        peRatio: parseFloat(overview.PERatio) || 0,
        profitMargin: parseFloat(overview.ProfitMargin) || 0,
        operatingMargin: parseFloat(overview.OperatingMarginTTM) || 0,
        roe: parseFloat(overview.ReturnOnEquityTTM) || 0,
        roa: parseFloat(overview.ReturnOnAssetsTTM) || 0
      };
    } catch (error) {
      console.error(`Error fetching financial metrics for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get latest annual revenue
   */
  async getLatestRevenue(symbol: string): Promise<number | null> {
    try {
      const incomeStatement = await this.getIncomeStatement(symbol);
      
      if (incomeStatement && incomeStatement.annualReports.length > 0) {
        const latestReport = incomeStatement.annualReports[0];
        return parseFloat(latestReport.totalRevenue) || 0;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching latest revenue for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get company classification (sector and industry)
   */
  async getCompanyClassification(symbol: string): Promise<{
    sector: string;
    industry: string;
    assetType: string;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (overview) {
        return {
          sector: overview.Sector,
          industry: overview.Industry,
          assetType: overview.AssetType
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching classification for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get company location information
   */
  async getCompanyLocation(symbol: string): Promise<{
    country: string;
    address: string;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (overview) {
        return {
          country: overview.Country,
          address: overview.Address
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching location for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get analyst ratings
   */
  async getAnalystRatings(symbol: string): Promise<{
    targetPrice: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (overview) {
        return {
          targetPrice: parseFloat(overview.AnalystTargetPrice) || 0,
          strongBuy: parseInt(overview.AnalystRatingStrongBuy) || 0,
          buy: parseInt(overview.AnalystRatingBuy) || 0,
          hold: parseInt(overview.AnalystRatingHold) || 0,
          sell: parseInt(overview.AnalystRatingSell) || 0,
          strongSell: parseInt(overview.AnalystRatingStrongSell) || 0
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching analyst ratings for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get valuation metrics
   */
  async getValuationMetrics(symbol: string): Promise<{
    peRatio: number;
    pegRatio: number;
    priceToBook: number;
    priceToSales: number;
    evToRevenue: number;
    evToEbitda: number;
  } | null> {
    try {
      const overview = await this.getCompanyOverview(symbol);
      
      if (overview) {
        return {
          peRatio: parseFloat(overview.PERatio) || 0,
          pegRatio: parseFloat(overview.PEGRatio) || 0,
          priceToBook: parseFloat(overview.PriceToBookRatio) || 0,
          priceToSales: parseFloat(overview.PriceToSalesRatioTTM) || 0,
          evToRevenue: parseFloat(overview.EVToRevenue) || 0,
          evToEbitda: parseFloat(overview.EVToEBITDA) || 0
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching valuation metrics for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Check if API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.getCompanyOverview('AAPL');
      return result !== null;
    } catch (error) {
      console.error('Alpha Vantage API health check failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive company data
   */
  async getComprehensiveData(symbol: string): Promise<{
    overview: AlphaVantageCompanyOverview | null;
    incomeStatement: AlphaVantageIncomeStatementResponse | null;
    balanceSheet: AlphaVantageBalanceSheetResponse | null;
    cashFlow: AlphaVantageCashFlowResponse | null;
    earnings: AlphaVantageEarningsResponse | null;
  }> {
    try {
      // Note: Alpha Vantage has rate limits (5 API calls per minute for free tier)
      // Consider implementing rate limiting or caching for production use
      
      const [overview, incomeStatement, balanceSheet, cashFlow, earnings] = await Promise.all([
        this.getCompanyOverview(symbol),
        this.getIncomeStatement(symbol),
        this.getBalanceSheet(symbol),
        this.getCashFlow(symbol),
        this.getEarnings(symbol)
      ]);

      return {
        overview,
        incomeStatement,
        balanceSheet,
        cashFlow,
        earnings
      };
    } catch (error) {
      console.error(`Error fetching comprehensive data for ${symbol}:`, error);
      return {
        overview: null,
        incomeStatement: null,
        balanceSheet: null,
        cashFlow: null,
        earnings: null
      };
    }
  }

  /**
   * NEW: Get current service status
   */
  getStatus(): AlphaVantageDataStatus {
    return { ...this.status };
  }

  /**
   * NEW: Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService();

// Export class for testing
export default AlphaVantageService;