/**
 * Real-Time Data Service - Phase 2 Enhanced
 * 
 * Unified service integrating multiple data sources:
 * - Alpha Vantage (Market data, VIX)
 * - SEC EDGAR (Company filings)
 * - GDELT Project (News sentiment - FREE)
 * - World Bank (Governance indicators - FREE)
 * - Fragile States Index (Country stability)
 * - ACLED (Conflict data)
 * 
 * Provides real-time status tracking and graceful fallbacks.
 */

import { alphaVantageService } from './alphaVantageService';
import { secEdgarService } from './secEdgarService';
import { newsSentimentService, type NewsSentimentResult } from './newsSentimentService';
import { geopoliticalRiskService, type GeopoliticalRiskScore } from './geopoliticalRiskService';

export interface DataSourceStatus {
  name: string;
  connected: boolean;
  lastUpdate: Date | null;
  requestsRemaining: number;
  dataFreshness: 'live' | 'cached' | 'stale' | 'offline';
  errors: string[];
  requiresApiKey: boolean;
  hasApiKey: boolean;
}

export interface RealTimeDataStatus {
  overall: {
    connected: boolean;
    dataFreshness: 'live' | 'recent' | 'stale' | 'offline';
    lastUpdate: Date | null;
  };
  sources: {
    alphaVantage: DataSourceStatus;
    secEdgar: DataSourceStatus;
    gdelt: DataSourceStatus;
    newsApi: DataSourceStatus;
    eventRegistry: DataSourceStatus;
    worldBank: DataSourceStatus;
    fragileStatesIndex: DataSourceStatus;
    acled: DataSourceStatus;
  };
  vixLevel: number | null;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

export interface CompanyRealTimeData {
  ticker: string;
  companyName: string;
  price?: number;
  change?: number;
  changePercent?: number;
  vixLevel?: number;
  sentiment?: NewsSentimentResult;
  geopoliticalRisk?: GeopoliticalRiskScore;
  filingStatus?: {
    lastFiling: Date | null;
    filingType: string;
  };
}

// Service state
let serviceStatus: RealTimeDataStatus | null = null;
let statusUpdateInterval: ReturnType<typeof setInterval> | null = null;
const statusListeners: Set<(status: RealTimeDataStatus) => void> = new Set();

/**
 * Initialize the real-time data service
 */
export async function initializeRealTimeDataService(): Promise<void> {
  console.log('🚀 Initializing Real-Time Data Service (Phase 2)...');
  
  // Perform initial status check
  await updateServiceStatus();
  
  // Set up periodic status updates (every 5 minutes)
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }
  statusUpdateInterval = setInterval(updateServiceStatus, 5 * 60 * 1000);
  
  console.log('✅ Real-Time Data Service initialized');
}

/**
 * Update service status for all data sources
 */
async function updateServiceStatus(): Promise<void> {
  const now = new Date();
  
  // Get status from each service
  const alphaVantageStatus = alphaVantageService.getStatus();
  const secEdgarStatus = secEdgarService.getStatus();
  const newsSentimentStatus = newsSentimentService.getServiceStatus();
  const geopoliticalStatus = geopoliticalRiskService.getServiceStatus();
  
  // Build comprehensive status
  serviceStatus = {
    overall: {
      connected: true, // Will be updated based on individual sources
      dataFreshness: 'live',
      lastUpdate: now,
    },
    sources: {
      alphaVantage: {
        name: 'Alpha Vantage',
        connected: alphaVantageStatus.connected,
        lastUpdate: alphaVantageStatus.lastUpdate,
        requestsRemaining: alphaVantageStatus.requestsRemaining,
        dataFreshness: getDataFreshness(alphaVantageStatus.lastUpdate),
        errors: alphaVantageStatus.lastError ? [alphaVantageStatus.lastError] : [],
        requiresApiKey: true,
        hasApiKey: true, // API key is hardcoded in the service
      },
      secEdgar: {
        name: 'SEC EDGAR',
        connected: secEdgarStatus.connected,
        lastUpdate: secEdgarStatus.lastUpdate,
        requestsRemaining: secEdgarStatus.requestsRemaining,
        dataFreshness: getDataFreshness(secEdgarStatus.lastUpdate),
        errors: secEdgarStatus.errors,
        requiresApiKey: false,
        hasApiKey: true,
      },
      gdelt: {
        name: 'GDELT Project',
        connected: true, // GDELT is always available (free, no API key)
        lastUpdate: now,
        requestsRemaining: newsSentimentStatus.gdelt.requestsRemaining,
        dataFreshness: 'live',
        errors: [],
        requiresApiKey: false,
        hasApiKey: true,
      },
      newsApi: {
        name: 'NewsAPI.org',
        connected: newsSentimentStatus.newsapi.available,
        lastUpdate: newsSentimentStatus.newsapi.available ? now : null,
        requestsRemaining: newsSentimentStatus.newsapi.requestsRemaining,
        dataFreshness: newsSentimentStatus.newsapi.available ? 'live' : 'offline',
        errors: [],
        requiresApiKey: true,
        hasApiKey: newsSentimentStatus.newsapi.hasApiKey,
      },
      eventRegistry: {
        name: 'Event Registry',
        connected: newsSentimentStatus.eventregistry.available,
        lastUpdate: newsSentimentStatus.eventregistry.available ? now : null,
        requestsRemaining: newsSentimentStatus.eventregistry.requestsRemaining,
        dataFreshness: newsSentimentStatus.eventregistry.available ? 'live' : 'offline',
        errors: [],
        requiresApiKey: true,
        hasApiKey: newsSentimentStatus.eventregistry.hasApiKey,
      },
      worldBank: {
        name: 'World Bank',
        connected: true, // World Bank API is always available (free, no API key)
        lastUpdate: now,
        requestsRemaining: geopoliticalStatus.worldbank.requestsRemaining,
        dataFreshness: 'live',
        errors: [],
        requiresApiKey: false,
        hasApiKey: true,
      },
      fragileStatesIndex: {
        name: 'Fragile States Index',
        connected: geopoliticalStatus.fsi.available,
        lastUpdate: now,
        requestsRemaining: -1, // No rate limit (cached data)
        dataFreshness: 'cached',
        errors: [],
        requiresApiKey: false,
        hasApiKey: true,
      },
      acled: {
        name: 'ACLED',
        connected: geopoliticalStatus.acled.available,
        lastUpdate: now,
        requestsRemaining: geopoliticalStatus.acled.requestsRemaining,
        dataFreshness: 'cached', // Using simulated data for now
        errors: [],
        requiresApiKey: true,
        hasApiKey: false, // Would need registration
      },
    },
    vixLevel: null,
    marketStatus: getMarketStatus(),
  };
  
  // Try to fetch current VIX level
  try {
    const vixData = await alphaVantageService.getVIXData();
    serviceStatus.vixLevel = vixData.level;
  } catch (error) {
    console.warn('Failed to fetch VIX level:', error);
  }
  
  // Update overall status based on individual sources
  const connectedSources = Object.values(serviceStatus.sources).filter(s => s.connected).length;
  const totalSources = Object.keys(serviceStatus.sources).length;
  
  serviceStatus.overall.connected = connectedSources >= 3; // At least 3 sources connected
  serviceStatus.overall.dataFreshness = 
    connectedSources >= 6 ? 'live' :
    connectedSources >= 4 ? 'recent' :
    connectedSources >= 2 ? 'stale' : 'offline';
  
  // Notify listeners
  statusListeners.forEach(listener => {
    try {
      listener(serviceStatus!);
    } catch (error) {
      console.error('Error in status listener:', error);
    }
  });
}

/**
 * Get data freshness based on last update time
 */
function getDataFreshness(lastUpdate: Date | null): 'live' | 'cached' | 'stale' | 'offline' {
  if (!lastUpdate) return 'offline';
  
  const ageMs = Date.now() - lastUpdate.getTime();
  const ageMinutes = ageMs / (60 * 1000);
  
  if (ageMinutes < 5) return 'live';
  if (ageMinutes < 30) return 'cached';
  if (ageMinutes < 60) return 'stale';
  return 'offline';
}

/**
 * Get current market status
 */
function getMarketStatus(): 'open' | 'closed' | 'pre-market' | 'after-hours' {
  const now = new Date();
  const nyHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();
  const nyMinute = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getMinutes();
  const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getDay();
  
  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'closed';
  }
  
  const timeInMinutes = nyHour * 60 + nyMinute;
  
  // Pre-market: 4:00 AM - 9:30 AM ET
  if (timeInMinutes >= 240 && timeInMinutes < 570) {
    return 'pre-market';
  }
  
  // Market hours: 9:30 AM - 4:00 PM ET
  if (timeInMinutes >= 570 && timeInMinutes < 960) {
    return 'open';
  }
  
  // After-hours: 4:00 PM - 8:00 PM ET
  if (timeInMinutes >= 960 && timeInMinutes < 1200) {
    return 'after-hours';
  }
  
  return 'closed';
}

/**
 * Get current service status
 */
export function getServiceStatus(): RealTimeDataStatus | null {
  return serviceStatus;
}

/**
 * Subscribe to status updates
 */
export function subscribeToStatusUpdates(
  callback: (status: RealTimeDataStatus) => void
): () => void {
  statusListeners.add(callback);
  
  // Immediately send current status if available
  if (serviceStatus) {
    callback(serviceStatus);
  }
  
  // Return unsubscribe function
  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Fetch comprehensive real-time data for a company
 */
export async function fetchCompanyRealTimeData(
  ticker: string,
  countries?: string[]
): Promise<CompanyRealTimeData> {
  const result: CompanyRealTimeData = {
    ticker,
    companyName: ticker,
  };
  
  // Fetch stock quote
  try {
    const quote = await alphaVantageService.getStockQuote(ticker);
    if (quote) {
      result.price = quote.price;
      result.change = quote.change;
      result.changePercent = parseFloat(quote.changePercent.replace('%', ''));
    }
  } catch (error) {
    console.warn(`Failed to fetch quote for ${ticker}:`, error);
  }
  
  // Fetch company overview
  try {
    const overview = await alphaVantageService.getCompanyOverview(ticker);
    if (overview) {
      result.companyName = overview.Name || ticker;
    }
  } catch (error) {
    console.warn(`Failed to fetch overview for ${ticker}:`, error);
  }
  
  // Fetch VIX level
  try {
    const vix = await alphaVantageService.getVIXData();
    result.vixLevel = vix.level;
  } catch (error) {
    console.warn('Failed to fetch VIX:', error);
  }
  
  // Fetch sentiment for primary country exposure
  if (countries && countries.length > 0) {
    try {
      const sentiment = await newsSentimentService.getAggregatedSentiment(countries[0]);
      result.sentiment = sentiment;
    } catch (error) {
      console.warn(`Failed to fetch sentiment for ${countries[0]}:`, error);
    }
    
    // Fetch geopolitical risk
    try {
      const geoRisk = await geopoliticalRiskService.calculateGeopoliticalRiskScore(countries[0]);
      result.geopoliticalRisk = geoRisk;
    } catch (error) {
      console.warn(`Failed to fetch geopolitical risk for ${countries[0]}:`, error);
    }
  }
  
  // Fetch SEC filing status
  try {
    const filings = await secEdgarService.getRecentFilings(ticker);
    if (filings.length > 0) {
      result.filingStatus = {
        lastFiling: new Date(filings[0].filingDate),
        filingType: filings[0].form,
      };
    }
  } catch (error) {
    console.warn(`Failed to fetch SEC filings for ${ticker}:`, error);
  }
  
  return result;
}

/**
 * Refresh all data sources
 */
export async function refreshAllData(): Promise<void> {
  console.log('🔄 Refreshing all data sources...');
  
  // Clear caches
  alphaVantageService.clearCache();
  secEdgarService.clearCache();
  newsSentimentService.clearCache();
  geopoliticalRiskService.clearCache();
  
  // Update status
  await updateServiceStatus();
  
  console.log('✅ All data sources refreshed');
}

/**
 * Get VIX level with fallback
 */
export async function getVIXLevel(): Promise<{ value: number; source: 'live' | 'cached' | 'simulated' }> {
  try {
    const vixData = await alphaVantageService.getVIXData();
    return {
      value: vixData.level,
      source: vixData.source,
    };
  } catch (error) {
    console.warn('Failed to fetch VIX, using simulated value:', error);
    // Return simulated VIX value
    return {
      value: 18.5 + (Math.random() - 0.5) * 5,
      source: 'simulated',
    };
  }
}

/**
 * Cleanup service
 */
export function cleanupRealTimeDataService(): void {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
  statusListeners.clear();
  serviceStatus = null;
  console.log('🧹 Real-Time Data Service cleaned up');
}

// Export singleton service
export const realTimeDataService = {
  initialize: initializeRealTimeDataService,
  getStatus: getServiceStatus,
  subscribe: subscribeToStatusUpdates,
  fetchCompanyData: fetchCompanyRealTimeData,
  refreshAll: refreshAllData,
  getVIX: getVIXLevel,
  cleanup: cleanupRealTimeDataService,
};

export default realTimeDataService;