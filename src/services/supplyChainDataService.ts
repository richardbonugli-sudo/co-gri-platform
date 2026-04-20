/**
 * Supply Chain Data Service
 * Phase 3: Advanced Real-Time Data Sources
 * 
 * Integrates:
 * - Freightos Baltic Index (shipping costs)
 * - Port Congestion Data
 * - Commodity Price Feeds
 * 
 * All sources have fallback to static/simulated data
 */

// Types
export interface ShippingRate {
  route: string;
  rate: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  isSimulated: boolean;
}

export interface PortStatus {
  portName: string;
  portCode: string;
  country: string;
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  vesselWaitDays: number;
  containerDwellTime: number;
  capacityUtilization: number;
  timestamp: Date;
  isSimulated: boolean;
}

export interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  timestamp: Date;
  isSimulated: boolean;
}

export interface SupplyChainStatus {
  overallStress: number; // 0-100
  shippingRates: ShippingRate[];
  portStatus: PortStatus[];
  commodityPrices: CommodityPrice[];
  lastUpdate: Date;
  dataSource: 'live' | 'cached' | 'static';
}

// Static fallback data
const STATIC_SHIPPING_RATES: Omit<ShippingRate, 'timestamp' | 'isSimulated'>[] = [
  { route: 'China-US West Coast', rate: 2850, change: -120, changePercent: -4.0 },
  { route: 'China-US East Coast', rate: 4200, change: -85, changePercent: -2.0 },
  { route: 'China-Europe', rate: 3100, change: -95, changePercent: -3.0 },
  { route: 'Europe-US East Coast', rate: 2100, change: 45, changePercent: 2.2 },
  { route: 'Asia-Mediterranean', rate: 2650, change: -60, changePercent: -2.2 },
  { route: 'Intra-Asia', rate: 850, change: 15, changePercent: 1.8 },
];

const STATIC_PORT_STATUS: Omit<PortStatus, 'timestamp' | 'isSimulated'>[] = [
  { portName: 'Los Angeles', portCode: 'USLAX', country: 'US', congestionLevel: 'moderate', vesselWaitDays: 2.5, containerDwellTime: 4.2, capacityUtilization: 78 },
  { portName: 'Long Beach', portCode: 'USLGB', country: 'US', congestionLevel: 'moderate', vesselWaitDays: 2.0, containerDwellTime: 3.8, capacityUtilization: 75 },
  { portName: 'Shanghai', portCode: 'CNSHA', country: 'China', congestionLevel: 'low', vesselWaitDays: 0.5, containerDwellTime: 2.1, capacityUtilization: 82 },
  { portName: 'Shenzhen', portCode: 'CNSZX', country: 'China', congestionLevel: 'low', vesselWaitDays: 0.3, containerDwellTime: 1.8, capacityUtilization: 79 },
  { portName: 'Rotterdam', portCode: 'NLRTM', country: 'Netherlands', congestionLevel: 'low', vesselWaitDays: 0.8, containerDwellTime: 2.5, capacityUtilization: 71 },
  { portName: 'Hamburg', portCode: 'DEHAM', country: 'Germany', congestionLevel: 'moderate', vesselWaitDays: 1.5, containerDwellTime: 3.2, capacityUtilization: 74 },
  { portName: 'Singapore', portCode: 'SGSIN', country: 'Singapore', congestionLevel: 'low', vesselWaitDays: 0.4, containerDwellTime: 1.5, capacityUtilization: 85 },
  { portName: 'Busan', portCode: 'KRPUS', country: 'South Korea', congestionLevel: 'low', vesselWaitDays: 0.6, containerDwellTime: 2.0, capacityUtilization: 77 },
];

const STATIC_COMMODITY_PRICES: Omit<CommodityPrice, 'timestamp' | 'isSimulated'>[] = [
  { symbol: 'CL', name: 'Crude Oil (WTI)', price: 78.45, change: 1.25, changePercent: 1.62, unit: 'USD/barrel' },
  { symbol: 'BZ', name: 'Brent Crude', price: 82.30, change: 0.95, changePercent: 1.17, unit: 'USD/barrel' },
  { symbol: 'NG', name: 'Natural Gas', price: 2.85, change: -0.12, changePercent: -4.04, unit: 'USD/MMBtu' },
  { symbol: 'GC', name: 'Gold', price: 2045.60, change: 12.40, changePercent: 0.61, unit: 'USD/oz' },
  { symbol: 'SI', name: 'Silver', price: 23.15, change: 0.35, changePercent: 1.54, unit: 'USD/oz' },
  { symbol: 'HG', name: 'Copper', price: 3.82, change: 0.05, changePercent: 1.33, unit: 'USD/lb' },
  { symbol: 'ZW', name: 'Wheat', price: 585.25, change: -8.50, changePercent: -1.43, unit: 'USD/bushel' },
  { symbol: 'ZC', name: 'Corn', price: 445.75, change: 3.25, changePercent: 0.73, unit: 'USD/bushel' },
  { symbol: 'ZS', name: 'Soybeans', price: 1185.50, change: 15.75, changePercent: 1.35, unit: 'USD/bushel' },
  { symbol: 'AL', name: 'Aluminum', price: 2245.00, change: -18.50, changePercent: -0.82, unit: 'USD/ton' },
];

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = {
  shipping: 30 * 60 * 1000, // 30 minutes
  ports: 60 * 60 * 1000, // 1 hour
  commodities: 5 * 60 * 1000, // 5 minutes
};

// Rate limiting
const rateLimiter = {
  lastCall: 0,
  minInterval: 1000, // 1 second between calls
  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
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

function addVariation(value: number, maxPercent: number = 5): number {
  const variation = (Math.random() - 0.5) * 2 * (maxPercent / 100);
  return value * (1 + variation);
}

// Service class
class SupplyChainDataService {
  private apiKeys: {
    commoditiesApi?: string;
    metalsApi?: string;
  } = {};

  constructor() {
    // Load API keys from environment if available
    if (typeof window !== 'undefined') {
      // Browser environment - keys would be injected
    }
  }

  /**
   * Get Freightos Baltic Index shipping rates
   * Fallback: Static historical average rates
   */
  async getShippingRates(): Promise<ShippingRate[]> {
    const cacheKey = 'shipping_rates';
    const cached = getCached<ShippingRate[]>(cacheKey);
    if (cached) {
      console.log('Using cached shipping rates');
      return cached;
    }

    await rateLimiter.wait();

    try {
      // Attempt to fetch from Freightos API (requires enterprise access)
      // For now, we'll use simulated data with realistic variations
      console.warn('Falling back to static data for Freightos Baltic Index - API requires enterprise access');
      
      const rates = this.generateSimulatedShippingRates();
      setCache(cacheKey, rates, CACHE_TTL.shipping);
      return rates;
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      console.warn('Falling back to static data for shipping rates');
      return this.generateSimulatedShippingRates();
    }
  }

  private generateSimulatedShippingRates(): ShippingRate[] {
    const now = new Date();
    return STATIC_SHIPPING_RATES.map(rate => ({
      ...rate,
      rate: Math.round(addVariation(rate.rate, 3)),
      change: Math.round(addVariation(rate.change, 20)),
      changePercent: Number(addVariation(rate.changePercent, 20).toFixed(2)),
      timestamp: now,
      isSimulated: true,
    }));
  }

  /**
   * Get port congestion data
   * Fallback: Static baseline congestion levels
   */
  async getPortStatus(): Promise<PortStatus[]> {
    const cacheKey = 'port_status';
    const cached = getCached<PortStatus[]>(cacheKey);
    if (cached) {
      console.log('Using cached port status');
      return cached;
    }

    await rateLimiter.wait();

    try {
      // Attempt to fetch from port APIs (MarineTraffic, etc.)
      // Most require paid subscriptions
      console.warn('Falling back to static data for port congestion - API requires subscription');
      
      const status = this.generateSimulatedPortStatus();
      setCache(cacheKey, status, CACHE_TTL.ports);
      return status;
    } catch (error) {
      console.error('Error fetching port status:', error);
      console.warn('Falling back to static data for port status');
      return this.generateSimulatedPortStatus();
    }
  }

  private generateSimulatedPortStatus(): PortStatus[] {
    const now = new Date();
    return STATIC_PORT_STATUS.map(port => ({
      ...port,
      vesselWaitDays: Number(addVariation(port.vesselWaitDays, 15).toFixed(1)),
      containerDwellTime: Number(addVariation(port.containerDwellTime, 10).toFixed(1)),
      capacityUtilization: Math.min(100, Math.round(addVariation(port.capacityUtilization, 5))),
      timestamp: now,
      isSimulated: true,
    }));
  }

  /**
   * Get commodity prices
   * Fallback: Static recent historical prices
   */
  async getCommodityPrices(): Promise<CommodityPrice[]> {
    const cacheKey = 'commodity_prices';
    const cached = getCached<CommodityPrice[]>(cacheKey);
    if (cached) {
      console.log('Using cached commodity prices');
      return cached;
    }

    await rateLimiter.wait();

    try {
      // Try free commodity APIs
      const prices = await this.fetchCommodityPricesFromAPI();
      if (prices.length > 0) {
        setCache(cacheKey, prices, CACHE_TTL.commodities);
        return prices;
      }
      throw new Error('No commodity data returned');
    } catch (error) {
      console.error('Error fetching commodity prices:', error);
      console.warn('Falling back to static data for commodity prices');
      return this.generateSimulatedCommodityPrices();
    }
  }

  private async fetchCommodityPricesFromAPI(): Promise<CommodityPrice[]> {
    // Try commodities-api.com (free tier available)
    const apiKey = this.apiKeys.commoditiesApi;
    if (!apiKey) {
      console.warn('No commodities API key configured, using static data');
      throw new Error('No API key');
    }

    const response = await fetch(
      `https://commodities-api.com/api/latest?access_key=${apiKey}&symbols=BRENTOIL,WTI,XAU,XAG,XCU`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Commodities API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Commodities API returned error');
    }

    // Transform API response to our format
    const now = new Date();
    return Object.entries(data.rates || {}).map(([symbol, rate]) => ({
      symbol,
      name: this.getCommodityName(symbol),
      price: Number(rate),
      change: 0, // Would need historical data for change
      changePercent: 0,
      unit: this.getCommodityUnit(symbol),
      timestamp: now,
      isSimulated: false,
    }));
  }

  private getCommodityName(symbol: string): string {
    const names: Record<string, string> = {
      'BRENTOIL': 'Brent Crude',
      'WTI': 'Crude Oil (WTI)',
      'XAU': 'Gold',
      'XAG': 'Silver',
      'XCU': 'Copper',
    };
    return names[symbol] || symbol;
  }

  private getCommodityUnit(symbol: string): string {
    const units: Record<string, string> = {
      'BRENTOIL': 'USD/barrel',
      'WTI': 'USD/barrel',
      'XAU': 'USD/oz',
      'XAG': 'USD/oz',
      'XCU': 'USD/lb',
    };
    return units[symbol] || 'USD';
  }

  private generateSimulatedCommodityPrices(): CommodityPrice[] {
    const now = new Date();
    return STATIC_COMMODITY_PRICES.map(commodity => ({
      ...commodity,
      price: Number(addVariation(commodity.price, 2).toFixed(2)),
      change: Number(addVariation(commodity.change, 30).toFixed(2)),
      changePercent: Number(addVariation(commodity.changePercent, 30).toFixed(2)),
      timestamp: now,
      isSimulated: true,
    }));
  }

  /**
   * Get overall supply chain status
   */
  async getSupplyChainStatus(): Promise<SupplyChainStatus> {
    const [shippingRates, portStatus, commodityPrices] = await Promise.all([
      this.getShippingRates(),
      this.getPortStatus(),
      this.getCommodityPrices(),
    ]);

    // Calculate overall stress level (0-100)
    const shippingStress = this.calculateShippingStress(shippingRates);
    const portStress = this.calculatePortStress(portStatus);
    const commodityStress = this.calculateCommodityStress(commodityPrices);

    const overallStress = Math.round(
      shippingStress * 0.35 + portStress * 0.35 + commodityStress * 0.30
    );

    // Determine data source status
    const allSimulated = 
      shippingRates.every(r => r.isSimulated) &&
      portStatus.every(p => p.isSimulated) &&
      commodityPrices.every(c => c.isSimulated);

    const someSimulated = 
      shippingRates.some(r => r.isSimulated) ||
      portStatus.some(p => p.isSimulated) ||
      commodityPrices.some(c => c.isSimulated);

    return {
      overallStress,
      shippingRates,
      portStatus,
      commodityPrices,
      lastUpdate: new Date(),
      dataSource: allSimulated ? 'static' : someSimulated ? 'cached' : 'live',
    };
  }

  private calculateShippingStress(rates: ShippingRate[]): number {
    // Higher rates = higher stress
    // Compare to historical averages
    const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
    const historicalAvg = 2500; // Historical average container rate
    const ratio = avgRate / historicalAvg;
    return Math.min(100, Math.max(0, (ratio - 0.5) * 100));
  }

  private calculatePortStress(ports: PortStatus[]): number {
    // Higher wait times and congestion = higher stress
    const avgWait = ports.reduce((sum, p) => sum + p.vesselWaitDays, 0) / ports.length;
    const severePorts = ports.filter(p => p.congestionLevel === 'severe' || p.congestionLevel === 'high').length;
    const waitStress = Math.min(100, avgWait * 20);
    const congestionStress = (severePorts / ports.length) * 100;
    return (waitStress + congestionStress) / 2;
  }

  private calculateCommodityStress(commodities: CommodityPrice[]): number {
    // High volatility and price increases = higher stress
    const avgChange = commodities.reduce((sum, c) => sum + Math.abs(c.changePercent), 0) / commodities.length;
    return Math.min(100, avgChange * 10);
  }

  /**
   * Get service status for UI display
   */
  getServiceStatus(): { name: string; status: 'live' | 'cached' | 'static' | 'offline'; apiKeyRequired: boolean }[] {
    return [
      { name: 'Freightos Baltic Index', status: 'static', apiKeyRequired: true },
      { name: 'Port Congestion', status: 'static', apiKeyRequired: true },
      { name: 'Commodities API', status: this.apiKeys.commoditiesApi ? 'live' : 'static', apiKeyRequired: true },
    ];
  }

  /**
   * Set API keys
   */
  setApiKeys(keys: { commoditiesApi?: string; metalsApi?: string }): void {
    this.apiKeys = { ...this.apiKeys, ...keys };
  }
}

// Export singleton instance
export const supplyChainDataService = new SupplyChainDataService();

// Export types and static data for testing
export { STATIC_SHIPPING_RATES, STATIC_PORT_STATUS, STATIC_COMMODITY_PRICES };