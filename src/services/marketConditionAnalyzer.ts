/**
 * Market Condition Analyzer - Phase 2 Task 2
 * 
 * Monitors market conditions and calculates market stress indicators
 * that influence dynamic multiplier adjustments.
 */

export interface MarketCondition {
  timestamp: string;
  volatilityIndex: number; // 0-100, VIX-like measure
  currencyStressIndex: number; // 0-100
  commodityStressIndex: number; // 0-100
  marketStressIndex: number; // 0-100, aggregate
  affectedRegions: string[];
  affectedSectors: string[];
}

export interface CurrencyFluctuation {
  currency: string;
  baseCurrency: string; // Usually USD
  currentRate: number;
  volatility30d: number; // 30-day volatility percentage
  change1d: number; // 1-day change percentage
  change7d: number; // 7-day change percentage
  change30d: number; // 30-day change percentage
  stressLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CommodityPrice {
  commodity: string;
  currentPrice: number;
  unit: string;
  volatility30d: number;
  change1d: number;
  change7d: number;
  change30d: number;
  stressLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedSectors: string[];
}

/**
 * Current market conditions (simulated data - in production, this would come from APIs)
 */
export const CURRENT_MARKET_CONDITIONS: MarketCondition = {
  timestamp: new Date().toISOString(),
  volatilityIndex: 18.5, // VIX-like, 0-100 scale
  currencyStressIndex: 25.0,
  commodityStressIndex: 30.0,
  marketStressIndex: 24.5, // Weighted average
  affectedRegions: ['Emerging Markets', 'Europe', 'Asia'],
  affectedSectors: ['Energy', 'Materials', 'Financials']
};

/**
 * Currency fluctuation data (major currencies)
 */
export const CURRENCY_FLUCTUATIONS: CurrencyFluctuation[] = [
  {
    currency: 'EUR',
    baseCurrency: 'USD',
    currentRate: 1.08,
    volatility30d: 2.5,
    change1d: -0.15,
    change7d: -0.45,
    change30d: 1.20,
    stressLevel: 'low'
  },
  {
    currency: 'GBP',
    baseCurrency: 'USD',
    currentRate: 1.27,
    volatility30d: 3.2,
    change1d: -0.20,
    change7d: -0.80,
    change30d: 2.10,
    stressLevel: 'low'
  },
  {
    currency: 'JPY',
    baseCurrency: 'USD',
    currentRate: 0.0067,
    volatility30d: 4.5,
    change1d: 0.30,
    change7d: 1.20,
    change30d: 3.50,
    stressLevel: 'medium'
  },
  {
    currency: 'CNY',
    baseCurrency: 'USD',
    currentRate: 0.14,
    volatility30d: 2.0,
    change1d: -0.10,
    change7d: -0.30,
    change30d: 0.80,
    stressLevel: 'low'
  },
  {
    currency: 'RUB',
    baseCurrency: 'USD',
    currentRate: 0.011,
    volatility30d: 15.0,
    change1d: -2.50,
    change7d: -8.00,
    change30d: -12.00,
    stressLevel: 'critical'
  },
  {
    currency: 'TRY',
    baseCurrency: 'USD',
    currentRate: 0.032,
    volatility30d: 12.0,
    change1d: -1.80,
    change7d: -5.50,
    change30d: -18.00,
    stressLevel: 'critical'
  },
  {
    currency: 'ARS',
    baseCurrency: 'USD',
    currentRate: 0.0012,
    volatility30d: 20.0,
    change1d: -3.00,
    change7d: -10.00,
    change30d: -25.00,
    stressLevel: 'critical'
  }
];

/**
 * Commodity price data
 */
export const COMMODITY_PRICES: CommodityPrice[] = [
  {
    commodity: 'Crude Oil (WTI)',
    currentPrice: 78.50,
    unit: 'USD/barrel',
    volatility30d: 8.5,
    change1d: 1.20,
    change7d: 3.50,
    change30d: 5.00,
    stressLevel: 'medium',
    affectedSectors: ['Energy', 'Industrials', 'Materials']
  },
  {
    commodity: 'Natural Gas',
    currentPrice: 2.85,
    unit: 'USD/MMBtu',
    volatility30d: 15.0,
    change1d: -2.50,
    change7d: -8.00,
    change30d: -12.00,
    stressLevel: 'high',
    affectedSectors: ['Energy', 'Utilities', 'Industrials']
  },
  {
    commodity: 'Gold',
    currentPrice: 2050.00,
    unit: 'USD/oz',
    volatility30d: 3.5,
    change1d: 0.50,
    change7d: 1.20,
    change30d: 2.80,
    stressLevel: 'low',
    affectedSectors: ['Materials', 'Financials']
  },
  {
    commodity: 'Copper',
    currentPrice: 3.85,
    unit: 'USD/lb',
    volatility30d: 6.0,
    change1d: -0.80,
    change7d: -2.50,
    change30d: 4.00,
    stressLevel: 'medium',
    affectedSectors: ['Materials', 'Industrials', 'Technology']
  },
  {
    commodity: 'Wheat',
    currentPrice: 6.20,
    unit: 'USD/bushel',
    volatility30d: 10.0,
    change1d: 2.00,
    change7d: 5.50,
    change30d: 8.00,
    stressLevel: 'medium',
    affectedSectors: ['Consumer Staples', 'Materials']
  }
];

/**
 * Calculate market stress index
 * 
 * Combines volatility, currency stress, and commodity stress into single metric
 */
export function calculateMarketStressIndex(): number {
  const volatilityWeight = 0.40;
  const currencyWeight = 0.35;
  const commodityWeight = 0.25;
  
  const volatilityStress = CURRENT_MARKET_CONDITIONS.volatilityIndex;
  const currencyStress = CURRENT_MARKET_CONDITIONS.currencyStressIndex;
  const commodityStress = CURRENT_MARKET_CONDITIONS.commodityStressIndex;
  
  return (
    volatilityStress * volatilityWeight +
    currencyStress * currencyWeight +
    commodityStress * commodityWeight
  );
}

/**
 * Calculate currency stress for a specific country
 */
export function calculateCurrencyStress(country: string): {
  stressLevel: 'low' | 'medium' | 'high' | 'critical';
  volatility: number;
  change30d: number;
  multiplierAdjustment: number;
} {
  // Map countries to currencies
  const currencyMap: Record<string, string> = {
    'Russia': 'RUB',
    'Turkey': 'TRY',
    'Argentina': 'ARS',
    'Japan': 'JPY',
    'China': 'CNY',
    'United Kingdom': 'GBP',
    'Eurozone': 'EUR'
  };
  
  const currency = currencyMap[country];
  if (!currency) {
    return { stressLevel: 'low', volatility: 0, change30d: 0, multiplierAdjustment: 0 };
  }
  
  const currencyData = CURRENCY_FLUCTUATIONS.find(c => c.currency === currency);
  if (!currencyData) {
    return { stressLevel: 'low', volatility: 0, change30d: 0, multiplierAdjustment: 0 };
  }
  
  // Calculate multiplier adjustment based on volatility and change
  // High volatility or large depreciation increases multiplier
  const volatilityFactor = Math.min(currencyData.volatility30d / 100, 0.15);
  const changeFactor = Math.min(Math.abs(currencyData.change30d) / 100, 0.10);
  
  const multiplierAdjustment = volatilityFactor + changeFactor;
  
  return {
    stressLevel: currencyData.stressLevel,
    volatility: currencyData.volatility30d,
    change30d: currencyData.change30d,
    multiplierAdjustment
  };
}

/**
 * Calculate commodity stress for a specific sector
 */
export function calculateCommodityStress(sector: string): {
  stressLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedCommodities: string[];
  averageVolatility: number;
  multiplierAdjustment: number;
} {
  const relevantCommodities = COMMODITY_PRICES.filter(c => 
    c.affectedSectors.includes(sector)
  );
  
  if (relevantCommodities.length === 0) {
    return {
      stressLevel: 'low',
      affectedCommodities: [],
      averageVolatility: 0,
      multiplierAdjustment: 0
    };
  }
  
  const averageVolatility = relevantCommodities.reduce((sum, c) => sum + c.volatility30d, 0) / relevantCommodities.length;
  
  // Determine stress level
  let stressLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (averageVolatility > 15) stressLevel = 'critical';
  else if (averageVolatility > 10) stressLevel = 'high';
  else if (averageVolatility > 5) stressLevel = 'medium';
  
  // Calculate multiplier adjustment
  const multiplierAdjustment = Math.min(averageVolatility / 100, 0.12);
  
  return {
    stressLevel,
    affectedCommodities: relevantCommodities.map(c => c.commodity),
    averageVolatility,
    multiplierAdjustment
  };
}

/**
 * Calculate overall market condition adjustment for country-sector combination
 */
export function calculateMarketConditionAdjustment(
  country: string,
  sector: string
): {
  currencyAdjustment: number;
  commodityAdjustment: number;
  volatilityAdjustment: number;
  totalAdjustment: number;
  breakdown: {
    currency: ReturnType<typeof calculateCurrencyStress>;
    commodity: ReturnType<typeof calculateCommodityStress>;
    volatility: number;
  };
} {
  // Currency stress adjustment
  const currencyStress = calculateCurrencyStress(country);
  const currencyAdjustment = currencyStress.multiplierAdjustment;
  
  // Commodity stress adjustment
  const commodityStress = calculateCommodityStress(sector);
  const commodityAdjustment = commodityStress.multiplierAdjustment;
  
  // Volatility adjustment (based on VIX-like index)
  const volatilityAdjustment = Math.min(CURRENT_MARKET_CONDITIONS.volatilityIndex / 500, 0.08);
  
  // Total adjustment (capped at 0.25)
  const totalAdjustment = Math.min(
    currencyAdjustment + commodityAdjustment + volatilityAdjustment,
    0.25
  );
  
  return {
    currencyAdjustment,
    commodityAdjustment,
    volatilityAdjustment,
    totalAdjustment,
    breakdown: {
      currency: currencyStress,
      commodity: commodityStress,
      volatility: CURRENT_MARKET_CONDITIONS.volatilityIndex
    }
  };
}

/**
 * Get market condition summary
 */
export function getMarketConditionSummary(): {
  marketStressIndex: number;
  stressLevel: 'low' | 'medium' | 'high' | 'critical';
  volatilityIndex: number;
  currencyStressIndex: number;
  commodityStressIndex: number;
  highStressCurrencies: string[];
  highStressCommodities: string[];
} {
  const marketStressIndex = calculateMarketStressIndex();
  
  let stressLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (marketStressIndex > 60) stressLevel = 'critical';
  else if (marketStressIndex > 40) stressLevel = 'high';
  else if (marketStressIndex > 20) stressLevel = 'medium';
  
  const highStressCurrencies = CURRENCY_FLUCTUATIONS
    .filter(c => c.stressLevel === 'high' || c.stressLevel === 'critical')
    .map(c => c.currency);
  
  const highStressCommodities = COMMODITY_PRICES
    .filter(c => c.stressLevel === 'high' || c.stressLevel === 'critical')
    .map(c => c.commodity);
  
  return {
    marketStressIndex,
    stressLevel,
    volatilityIndex: CURRENT_MARKET_CONDITIONS.volatilityIndex,
    currencyStressIndex: CURRENT_MARKET_CONDITIONS.currencyStressIndex,
    commodityStressIndex: CURRENT_MARKET_CONDITIONS.commodityStressIndex,
    highStressCurrencies,
    highStressCommodities
  };
}

/**
 * Update market conditions (for testing or real-time updates)
 */
export function updateMarketConditions(conditions: Partial<MarketCondition>): void {
  Object.assign(CURRENT_MARKET_CONDITIONS, {
    ...conditions,
    timestamp: new Date().toISOString()
  });
  
  // Recalculate market stress index
  CURRENT_MARKET_CONDITIONS.marketStressIndex = calculateMarketStressIndex();
  
  console.log(`[Market Condition Analyzer] Updated market conditions at ${CURRENT_MARKET_CONDITIONS.timestamp}`);
}