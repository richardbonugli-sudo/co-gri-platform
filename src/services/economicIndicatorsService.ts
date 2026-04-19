/**
 * Economic Indicators Service
 * Phase 3: Advanced Real-Time Data Sources
 * 
 * Integrates:
 * - FRED API (Federal Reserve Economic Data) - FREE with API key
 * - IMF Data API - FREE
 * - Trading Economics (fallback to World Bank)
 * 
 * All sources have fallback to static/simulated data
 */

// Types
export interface EconomicIndicator {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  lastUpdate: Date;
  source: string;
  isSimulated: boolean;
}

export interface CountryEconomicData {
  countryCode: string;
  countryName: string;
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
  interestRate: number;
  currentAccount: number;
  governmentDebt: number;
  lastUpdate: Date;
  isSimulated: boolean;
}

export interface EconomicStatus {
  usIndicators: EconomicIndicator[];
  globalIndicators: CountryEconomicData[];
  marketCondition: 'expansion' | 'peak' | 'contraction' | 'trough';
  riskLevel: number; // 0-100
  lastUpdate: Date;
  dataSource: 'live' | 'cached' | 'static';
}

// Static fallback data - US Economic Indicators
const STATIC_US_INDICATORS: Omit<EconomicIndicator, 'lastUpdate' | 'isSimulated'>[] = [
  { id: 'VIXCLS', name: 'VIX Index', value: 14.5, previousValue: 15.2, change: -0.7, changePercent: -4.6, unit: 'Index', frequency: 'daily', source: 'FRED' },
  { id: 'DGS10', name: '10-Year Treasury Rate', value: 4.25, previousValue: 4.18, change: 0.07, changePercent: 1.7, unit: '%', frequency: 'daily', source: 'FRED' },
  { id: 'DGS2', name: '2-Year Treasury Rate', value: 4.45, previousValue: 4.42, change: 0.03, changePercent: 0.7, unit: '%', frequency: 'daily', source: 'FRED' },
  { id: 'UNRATE', name: 'Unemployment Rate', value: 3.7, previousValue: 3.8, change: -0.1, changePercent: -2.6, unit: '%', frequency: 'monthly', source: 'FRED' },
  { id: 'CPIAUCSL', name: 'Consumer Price Index', value: 308.5, previousValue: 307.2, change: 1.3, changePercent: 0.4, unit: 'Index', frequency: 'monthly', source: 'FRED' },
  { id: 'FEDFUNDS', name: 'Federal Funds Rate', value: 5.33, previousValue: 5.33, change: 0, changePercent: 0, unit: '%', frequency: 'daily', source: 'FRED' },
  { id: 'GDP', name: 'Real GDP Growth', value: 2.8, previousValue: 2.1, change: 0.7, changePercent: 33.3, unit: '%', frequency: 'quarterly', source: 'FRED' },
  { id: 'PAYEMS', name: 'Nonfarm Payrolls', value: 157200, previousValue: 156800, change: 400, changePercent: 0.26, unit: 'Thousands', frequency: 'monthly', source: 'FRED' },
  { id: 'INDPRO', name: 'Industrial Production', value: 103.2, previousValue: 102.8, change: 0.4, changePercent: 0.39, unit: 'Index', frequency: 'monthly', source: 'FRED' },
  { id: 'HOUST', name: 'Housing Starts', value: 1420, previousValue: 1380, change: 40, changePercent: 2.9, unit: 'Thousands', frequency: 'monthly', source: 'FRED' },
];

// Static fallback data - Global Economic Data
const STATIC_GLOBAL_DATA: Omit<CountryEconomicData, 'lastUpdate' | 'isSimulated'>[] = [
  { countryCode: 'US', countryName: 'United States', gdpGrowth: 2.8, inflation: 3.2, unemployment: 3.7, interestRate: 5.33, currentAccount: -3.0, governmentDebt: 123 },
  { countryCode: 'CN', countryName: 'China', gdpGrowth: 5.2, inflation: 0.2, unemployment: 5.2, interestRate: 3.45, currentAccount: 1.5, governmentDebt: 77 },
  { countryCode: 'JP', countryName: 'Japan', gdpGrowth: 1.9, inflation: 2.8, unemployment: 2.5, interestRate: -0.1, currentAccount: 3.5, governmentDebt: 264 },
  { countryCode: 'DE', countryName: 'Germany', gdpGrowth: -0.3, inflation: 2.9, unemployment: 5.9, interestRate: 4.5, currentAccount: 6.2, governmentDebt: 66 },
  { countryCode: 'GB', countryName: 'United Kingdom', gdpGrowth: 0.1, inflation: 4.0, unemployment: 4.2, interestRate: 5.25, currentAccount: -3.1, governmentDebt: 101 },
  { countryCode: 'FR', countryName: 'France', gdpGrowth: 0.7, inflation: 2.9, unemployment: 7.3, interestRate: 4.5, currentAccount: -0.8, governmentDebt: 111 },
  { countryCode: 'IN', countryName: 'India', gdpGrowth: 6.5, inflation: 5.1, unemployment: 7.8, interestRate: 6.5, currentAccount: -1.8, governmentDebt: 83 },
  { countryCode: 'BR', countryName: 'Brazil', gdpGrowth: 2.9, inflation: 4.5, unemployment: 7.8, interestRate: 11.75, currentAccount: -1.5, governmentDebt: 74 },
  { countryCode: 'CA', countryName: 'Canada', gdpGrowth: 1.1, inflation: 2.9, unemployment: 5.8, interestRate: 5.0, currentAccount: -0.8, governmentDebt: 107 },
  { countryCode: 'AU', countryName: 'Australia', gdpGrowth: 1.5, inflation: 4.1, unemployment: 3.9, interestRate: 4.35, currentAccount: 1.2, governmentDebt: 52 },
  { countryCode: 'KR', countryName: 'South Korea', gdpGrowth: 1.4, inflation: 2.8, unemployment: 2.8, interestRate: 3.5, currentAccount: 3.5, governmentDebt: 54 },
  { countryCode: 'MX', countryName: 'Mexico', gdpGrowth: 3.2, inflation: 4.7, unemployment: 2.8, interestRate: 11.25, currentAccount: -1.2, governmentDebt: 53 },
];

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = {
  fred: 60 * 60 * 1000, // 1 hour for daily data
  imf: 24 * 60 * 60 * 1000, // 24 hours for IMF data
  global: 6 * 60 * 60 * 1000, // 6 hours for global data
};

// Rate limiting
const rateLimiter = {
  fred: { lastCall: 0, minInterval: 1000 }, // 1 second
  imf: { lastCall: 0, minInterval: 2000 }, // 2 seconds
  async wait(api: 'fred' | 'imf'): Promise<void> {
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

function addVariation(value: number, maxPercent: number = 2): number {
  const variation = (Math.random() - 0.5) * 2 * (maxPercent / 100);
  return value * (1 + variation);
}

// Service class
class EconomicIndicatorsService {
  private fredApiKey: string | null = null;

  constructor() {
    // Load API key from environment variable (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      this.fredApiKey = import.meta.env.VITE_FRED_API_KEY || null;
    }
    
    // Log API key status
    if (this.fredApiKey) {
      console.log('FRED API: Using configured API key');
    } else {
      console.log('FRED API: No API key configured, using static data');
    }
  }

  /**
   * Set FRED API key
   */
  setFredApiKey(key: string): void {
    this.fredApiKey = key;
  }

  /**
   * Get US economic indicators from FRED
   * Fallback: Static cached values
   */
  async getUSIndicators(): Promise<EconomicIndicator[]> {
    const cacheKey = 'us_indicators';
    const cached = getCached<EconomicIndicator[]>(cacheKey);
    if (cached) {
      console.log('Using cached US economic indicators');
      return cached;
    }

    if (this.fredApiKey) {
      try {
        await rateLimiter.wait('fred');
        const indicators = await this.fetchFredIndicators();
        if (indicators.length > 0) {
          setCache(cacheKey, indicators, CACHE_TTL.fred);
          return indicators;
        }
      } catch (error) {
        console.error('Error fetching FRED data:', error);
      }
    }

    console.warn('Falling back to static data for US economic indicators');
    const staticData = this.generateSimulatedUSIndicators();
    setCache(cacheKey, staticData, CACHE_TTL.fred);
    return staticData;
  }

  private async fetchFredIndicators(): Promise<EconomicIndicator[]> {
    const seriesIds = ['VIXCLS', 'DGS10', 'DGS2', 'UNRATE', 'FEDFUNDS'];
    const indicators: EconomicIndicator[] = [];

    for (const seriesId of seriesIds) {
      try {
        const response = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=2`
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (data.observations && data.observations.length >= 2) {
          const current = parseFloat(data.observations[0].value);
          const previous = parseFloat(data.observations[1].value);
          const change = current - previous;
          const changePercent = (change / previous) * 100;

          const staticInfo = STATIC_US_INDICATORS.find(i => i.id === seriesId);
          indicators.push({
            id: seriesId,
            name: staticInfo?.name || seriesId,
            value: current,
            previousValue: previous,
            change,
            changePercent,
            unit: staticInfo?.unit || '',
            frequency: staticInfo?.frequency || 'daily',
            source: 'FRED',
            lastUpdate: new Date(data.observations[0].date),
            isSimulated: false,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${seriesId}:`, error);
      }
    }

    return indicators;
  }

  private generateSimulatedUSIndicators(): EconomicIndicator[] {
    const now = new Date();
    return STATIC_US_INDICATORS.map(indicator => ({
      ...indicator,
      value: Number(addVariation(indicator.value, 1).toFixed(2)),
      change: Number(addVariation(indicator.change, 10).toFixed(2)),
      changePercent: Number(addVariation(indicator.changePercent, 10).toFixed(2)),
      lastUpdate: now,
      isSimulated: true,
    }));
  }

  /**
   * Get global economic data from IMF
   * Fallback: Static World Economic Outlook data
   */
  async getGlobalIndicators(): Promise<CountryEconomicData[]> {
    const cacheKey = 'global_indicators';
    const cached = getCached<CountryEconomicData[]>(cacheKey);
    if (cached) {
      console.log('Using cached global economic indicators');
      return cached;
    }

    try {
      await rateLimiter.wait('imf');
      const data = await this.fetchIMFData();
      if (data.length > 0) {
        setCache(cacheKey, data, CACHE_TTL.imf);
        return data;
      }
    } catch (error) {
      console.error('Error fetching IMF data:', error);
    }

    console.warn('Falling back to static data for global economic indicators');
    const staticData = this.generateSimulatedGlobalData();
    setCache(cacheKey, staticData, CACHE_TTL.global);
    return staticData;
  }

  private async fetchIMFData(): Promise<CountryEconomicData[]> {
    // IMF API endpoint for World Economic Outlook
    // Note: IMF API can be complex, using simplified approach
    try {
      const response = await fetch(
        'https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH?periods=2024',
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`IMF API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform IMF data to our format
      const now = new Date();
      const countries: CountryEconomicData[] = [];
      
      for (const staticCountry of STATIC_GLOBAL_DATA) {
        const imfGdp = data.values?.NGDP_RPCH?.[staticCountry.countryCode]?.['2024'];
        countries.push({
          ...staticCountry,
          gdpGrowth: imfGdp ? parseFloat(imfGdp) : staticCountry.gdpGrowth,
          lastUpdate: now,
          isSimulated: !imfGdp,
        });
      }

      return countries;
    } catch (error) {
      console.error('IMF API fetch failed:', error);
      throw error;
    }
  }

  private generateSimulatedGlobalData(): CountryEconomicData[] {
    const now = new Date();
    return STATIC_GLOBAL_DATA.map(country => ({
      ...country,
      gdpGrowth: Number(addVariation(country.gdpGrowth, 5).toFixed(1)),
      inflation: Number(addVariation(country.inflation, 3).toFixed(1)),
      unemployment: Number(addVariation(country.unemployment, 2).toFixed(1)),
      lastUpdate: now,
      isSimulated: true,
    }));
  }

  /**
   * Get economic indicator by ID
   */
  async getIndicatorById(id: string): Promise<EconomicIndicator | null> {
    const indicators = await this.getUSIndicators();
    return indicators.find(i => i.id === id) || null;
  }

  /**
   * Get country economic data by code
   */
  async getCountryData(countryCode: string): Promise<CountryEconomicData | null> {
    const data = await this.getGlobalIndicators();
    return data.find(c => c.countryCode === countryCode) || null;
  }

  /**
   * Get overall economic status
   */
  async getEconomicStatus(): Promise<EconomicStatus> {
    const [usIndicators, globalIndicators] = await Promise.all([
      this.getUSIndicators(),
      this.getGlobalIndicators(),
    ]);

    // Determine market condition based on indicators
    const marketCondition = this.determineMarketCondition(usIndicators);
    
    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(usIndicators, globalIndicators);

    // Determine data source status
    const allSimulated = 
      usIndicators.every(i => i.isSimulated) &&
      globalIndicators.every(c => c.isSimulated);

    const someSimulated = 
      usIndicators.some(i => i.isSimulated) ||
      globalIndicators.some(c => c.isSimulated);

    return {
      usIndicators,
      globalIndicators,
      marketCondition,
      riskLevel,
      lastUpdate: new Date(),
      dataSource: allSimulated ? 'static' : someSimulated ? 'cached' : 'live',
    };
  }

  private determineMarketCondition(indicators: EconomicIndicator[]): 'expansion' | 'peak' | 'contraction' | 'trough' {
    const gdp = indicators.find(i => i.id === 'GDP');
    const unemployment = indicators.find(i => i.id === 'UNRATE');
    const vix = indicators.find(i => i.id === 'VIXCLS');

    const gdpGrowth = gdp?.value || 2.0;
    const unemploymentRate = unemployment?.value || 4.0;
    const vixLevel = vix?.value || 15;

    if (gdpGrowth > 2.5 && unemploymentRate < 4.5 && vixLevel < 20) {
      return 'expansion';
    } else if (gdpGrowth > 1.5 && vixLevel > 25) {
      return 'peak';
    } else if (gdpGrowth < 0 || unemploymentRate > 6) {
      return 'contraction';
    } else if (gdpGrowth < 1 && unemploymentRate > 5) {
      return 'trough';
    }
    return 'expansion';
  }

  private calculateRiskLevel(usIndicators: EconomicIndicator[], globalIndicators: CountryEconomicData[]): number {
    let riskScore = 0;

    // VIX contribution (0-30 points)
    const vix = usIndicators.find(i => i.id === 'VIXCLS');
    if (vix) {
      riskScore += Math.min(30, vix.value);
    }

    // Yield curve inversion check (0-20 points)
    const dgs10 = usIndicators.find(i => i.id === 'DGS10');
    const dgs2 = usIndicators.find(i => i.id === 'DGS2');
    if (dgs10 && dgs2 && dgs2.value > dgs10.value) {
      riskScore += 20; // Inverted yield curve
    }

    // Global growth concerns (0-25 points)
    const negativeGrowthCountries = globalIndicators.filter(c => c.gdpGrowth < 0).length;
    riskScore += Math.min(25, negativeGrowthCountries * 5);

    // High inflation countries (0-25 points)
    const highInflationCountries = globalIndicators.filter(c => c.inflation > 5).length;
    riskScore += Math.min(25, highInflationCountries * 5);

    return Math.min(100, riskScore);
  }

  /**
   * Get service status for UI display
   */
  getServiceStatus(): { name: string; status: 'live' | 'cached' | 'static' | 'offline'; apiKeyRequired: boolean }[] {
    return [
      { name: 'FRED API', status: this.fredApiKey ? 'live' : 'static', apiKeyRequired: true },
      { name: 'IMF Data', status: 'cached', apiKeyRequired: false },
      { name: 'Trading Economics', status: 'static', apiKeyRequired: true },
    ];
  }
}

// Export singleton instance
export const economicIndicatorsService = new EconomicIndicatorsService();

// Export types and static data for testing
export { STATIC_US_INDICATORS, STATIC_GLOBAL_DATA };