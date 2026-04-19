/**
 * UN Comtrade Data Integration Service
 * 
 * Provides trade flow data for counterparty/market channel exposure calculation
 * API Documentation: https://comtradeplus.un.org/
 */

interface TradeFlow {
  reporterCode: number;
  reporterDesc: string;
  partnerCode: number;
  partnerDesc: string;
  flowCode: string;
  flowDesc: string;
  primaryValue: number;
  netWeight?: number;
  qty?: number;
  period: string;
}

interface ComtradeResponse {
  data: TradeFlow[];
  count: number;
  error?: string;
}

interface CountryTradeExposure {
  country: string;
  exportValue: number;
  importValue: number;
  totalTradeValue: number;
  tradeShare: number;
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export class UnComtradeService {
  private apiKey: string;
  private baseUrl = 'https://comtradeplus.un.org/api/get';
  private cache: Map<string, { data: CountryTradeExposure[]; timestamp: number }> = new Map();
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get trade exposure data for a company's home country
   * Returns market/counterparty exposure based on trade flows
   */
  async getCountryTradeExposure(
    homeCountry: string,
    sector?: string
  ): Promise<CountryTradeExposure[]> {
    const cacheKey = `${homeCountry}-${sector || 'all'}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Map country name to UN Comtrade country code
      const reporterCode = this.getCountryCode(homeCountry);
      if (!reporterCode) {
        throw new Error(`Country code not found for: ${homeCountry}`);
      }

      // Get both export and import data
      const [exports, imports] = await Promise.all([
        this.fetchTradeData(reporterCode, 'X'), // Exports
        this.fetchTradeData(reporterCode, 'M')  // Imports
      ]);

      // Aggregate trade data by partner country
      const tradeByCountry = new Map<string, { exports: number; imports: number }>();

      for (const flow of exports) {
        const country = flow.partnerDesc;
        const current = tradeByCountry.get(country) || { exports: 0, imports: 0 };
        current.exports += flow.primaryValue;
        tradeByCountry.set(country, current);
      }

      for (const flow of imports) {
        const country = flow.partnerDesc;
        const current = tradeByCountry.get(country) || { exports: 0, imports: 0 };
        current.imports += flow.primaryValue;
        tradeByCountry.set(country, current);
      }

      // Calculate total trade value
      const totalTrade = Array.from(tradeByCountry.values()).reduce(
        (sum, { exports, imports }) => sum + exports + imports,
        0
      );

      // Convert to exposure format
      const exposures: CountryTradeExposure[] = [];
      for (const [country, { exports, imports }] of tradeByCountry.entries()) {
        const totalTradeValue = exports + imports;
        const tradeShare = totalTrade > 0 ? totalTradeValue / totalTrade : 0;

        // Only include countries with >0.1% trade share
        if (tradeShare > 0.001) {
          exposures.push({
            country,
            exportValue: exports,
            importValue: imports,
            totalTradeValue,
            tradeShare,
            dataQuality: this.assessDataQuality(totalTradeValue, exports, imports),
            lastUpdated: new Date().toISOString()
          });
        }
      }

      // Sort by trade share descending
      exposures.sort((a, b) => b.tradeShare - a.tradeShare);

      // Cache the result
      this.cache.set(cacheKey, { data: exposures, timestamp: Date.now() });

      return exposures;
    } catch (error) {
      console.error('Error fetching UN Comtrade data:', error);
      throw error;
    }
  }

  /**
   * Fetch trade data from UN Comtrade API
   */
  private async fetchTradeData(
    reporterCode: number,
    flowCode: 'X' | 'M'
  ): Promise<TradeFlow[]> {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Use most recent complete year
    const period = previousYear.toString();

    const url = new URL(this.baseUrl);
    url.searchParams.append('subscription-key', this.apiKey);
    url.searchParams.append('reporterCode', reporterCode.toString());
    url.searchParams.append('period', period);
    url.searchParams.append('flowCode', flowCode);
    url.searchParams.append('partnerCode', '0'); // All partners
    url.searchParams.append('cmdCode', 'TOTAL'); // All commodities
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`UN Comtrade API error: ${response.status} ${response.statusText}`);
    }

    const data: ComtradeResponse = await response.json();
    
    if (data.error) {
      throw new Error(`UN Comtrade API error: ${data.error}`);
    }

    return data.data || [];
  }

  /**
   * Assess data quality based on trade values
   */
  private assessDataQuality(
    totalValue: number,
    exports: number,
    imports: number
  ): 'high' | 'medium' | 'low' {
    // High quality: Both exports and imports data available, significant trade
    if (exports > 0 && imports > 0 && totalValue > 1000000000) {
      return 'high';
    }
    
    // Medium quality: One-way trade or moderate volume
    if (totalValue > 100000000) {
      return 'medium';
    }
    
    // Low quality: Small trade volume
    return 'low';
  }

  /**
   * Map country name to UN Comtrade country code
   * Source: https://comtradeplus.un.org/api/get/reference/countries
   */
  private getCountryCode(countryName: string): number | null {
    const countryCodeMap: Record<string, number> = {
      'United States': 842,
      'China': 156,
      'Japan': 392,
      'Germany': 276,
      'United Kingdom': 826,
      'France': 250,
      'India': 356,
      'Italy': 380,
      'Brazil': 76,
      'Canada': 124,
      'South Korea': 410,
      'Russia': 643,
      'Spain': 724,
      'Australia': 36,
      'Mexico': 484,
      'Indonesia': 360,
      'Netherlands': 528,
      'Saudi Arabia': 682,
      'Turkey': 792,
      'Switzerland': 756,
      'Poland': 616,
      'Belgium': 56,
      'Sweden': 752,
      'Argentina': 32,
      'Norway': 578,
      'Austria': 40,
      'United Arab Emirates': 784,
      'Thailand': 764,
      'Israel': 376,
      'Singapore': 702,
      'Malaysia': 458,
      'Hong Kong': 344,
      'Denmark': 208,
      'South Africa': 710,
      'Colombia': 170,
      'Chile': 152,
      'Finland': 246,
      'Vietnam': 704,
      'Bangladesh': 50,
      'Egypt': 818,
      'Pakistan': 586,
      'Philippines': 608,
      'Czech Republic': 203,
      'Romania': 642,
      'Portugal': 620,
      'Iraq': 368,
      'New Zealand': 554,
      'Qatar': 634,
      'Kazakhstan': 398,
      'Kuwait': 414,
      'Morocco': 504,
      'Ukraine': 804,
      'Peru': 604,
      'Greece': 300,
      'Algeria': 12,
      'Hungary': 348,
      'Oman': 512,
      'Slovakia': 703,
      'Ecuador': 218,
      'Ethiopia': 231,
      'Kenya': 404,
      'Ghana': 288,
      'Tanzania': 834,
      'Angola': 24,
      'Luxembourg': 442,
      'Uruguay': 858,
      'Costa Rica': 188,
      'Panama': 591,
      'Croatia': 191,
      'Serbia': 688,
      'Slovenia': 705,
      'Lithuania': 440,
      'Bulgaria': 100,
      'Tunisia': 788,
      'Jordan': 400,
      'Bolivia': 68,
      'Paraguay': 600,
      'Lebanon': 422,
      'Libya': 434,
      'Bahrain': 48,
      'Cameroon': 120,
      'Latvia': 428,
      'Estonia': 233,
      'Iceland': 352,
      'Cyprus': 196,
      'Malta': 470,
      'Brunei': 96,
      'Mauritius': 480,
      'Namibia': 516,
      'Botswana': 72,
      'Gabon': 266,
      'Trinidad and Tobago': 780,
      'Bahamas': 44,
      'Barbados': 52,
      'Nicaragua': 558,
      'Honduras': 340,
      'El Salvador': 222,
      'Guatemala': 320,
      'Belize': 84,
      'Taiwan': 158,
      'Macau': 446
    };

    return countryCodeMap[countryName] || null;
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const unComtradeService = new UnComtradeService('0c0766727d844ba780481d4c806ed9d8');