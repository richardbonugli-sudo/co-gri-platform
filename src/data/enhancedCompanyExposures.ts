import type { EnhancedCompanyExposure } from '@/types/v4Types';

/**
 * Enhanced company exposure data with V.4 metadata
 * This database contains companies with enhanced multi-channel exposure data
 */

export const ENHANCED_COMPANY_EXPOSURES: Record<string, EnhancedCompanyExposure> = {
  'AAPL': {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 40, description: 'Primary market and headquarters' },
      { country: 'China', percentage: 20, description: 'Major manufacturing and sales' },
      { country: 'Europe', percentage: 25, description: 'Significant market presence' },
      { country: 'Japan', percentage: 8, description: 'Key Asian market' },
      { country: 'Rest of World', percentage: 7, description: 'Other markets' }
    ],
    dataSource: 'SEC 10-K Filing 2024',
    lastUpdated: '2024-11-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-11-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-11-01'
    },
    revenueGeography: [
      { segment: 'Americas', value: 169148, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Europe', value: 101328, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Greater China', value: 66952, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Japan', value: 24257, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Rest of Asia Pacific', value: 29615, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 40200, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'China', value: 8100, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'Other', value: 7500, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Apple relies heavily on manufacturing partners in China (Foxconn), Taiwan (TSMC for chips), Japan (camera sensors), South Korea (displays), Vietnam (assembly), India (growing assembly), and Southeast Asia (component suppliers).',
      financial: 'Apple maintains significant currency exposure to EUR, JPY, and GBP through its international operations. The company employs hedging programs to manage foreign exchange risk.'
    }
  },
  
  'MSFT': {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 48, description: 'Primary market' },
      { country: 'Europe', percentage: 27, description: 'Major market' },
      { country: 'Asia Pacific', percentage: 18, description: 'Growing market' },
      { country: 'Other', percentage: 7, description: 'Rest of world' }
    ],
    dataSource: 'SEC 10-K 2024',
    lastUpdated: '2024-07-31',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-07-31',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-07-31'
    },
    revenueGeography: [
      { segment: 'United States', value: 112000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Europe, Middle East and Africa', value: 63000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Asia Pacific', value: 42000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Other Americas', value: 16000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 85000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'Ireland', value: 12000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'Other', value: 8000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Microsoft operates data centers globally with significant presence in the United States, Ireland, Netherlands, and Singapore. Hardware manufacturing partners in China and Taiwan.',
      financial: 'Microsoft has currency exposure to EUR, GBP, JPY, CAD, and AUD through international operations.'
    }
  },

  'GOOGL': {
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 46, description: 'Primary market' },
      { country: 'Europe', percentage: 30, description: 'Major market' },
      { country: 'Asia Pacific', percentage: 17, description: 'Growing market' },
      { country: 'Other', percentage: 7, description: 'Rest of world' }
    ],
    dataSource: 'SEC 10-K 2024',
    lastUpdated: '2024-02-02',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-02-02',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-02-02'
    },
    revenueGeography: [
      { segment: 'United States', value: 140000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'EMEA', value: 91000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'APAC', value: 52000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
      { segment: 'Other Americas', value: 21000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 120000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'Europe', value: 25000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false },
        { country: 'Asia', value: 15000, unit: 'millions_usd', source: 'SEC 10-K 2024', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Google operates data centers in the United States, Europe (Finland, Belgium, Netherlands, Ireland), and Asia (Singapore, Taiwan, Japan). Hardware manufactured by partners in China and Taiwan.',
      financial: 'Alphabet has significant currency exposure to EUR, GBP, JPY, and other currencies through advertising and cloud services.'
    }
  },

  'TSLA': {
    ticker: 'TSLA',
    companyName: 'Tesla Inc.',
    homeCountry: 'United States',
    sector: 'Automotive',
    exposures: [
      { country: 'United States', percentage: 45, description: 'Primary market and manufacturing' },
      { country: 'China', percentage: 25, description: 'Major manufacturing hub (Shanghai Gigafactory)' },
      { country: 'Europe', percentage: 20, description: 'Growing market with Berlin Gigafactory' },
      { country: 'Rest of World', percentage: 10, description: 'Other markets' }
    ],
    dataSource: 'SEC 10-Q Q4 2024',
    lastUpdated: '2024-12-31',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-12-31',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024-Q4',
      filingDate: '2024-12-31'
    },
    revenueGeography: [
      { segment: 'United States', value: 45000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false },
      { segment: 'China', value: 25000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false },
      { segment: 'Other', value: 30000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 15000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false },
        { country: 'China', value: 8000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false },
        { country: 'Germany', value: 5000, unit: 'millions_usd', source: 'SEC 10-Q Q4 2024', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Tesla operates Gigafactories in the United States (Texas, Nevada), China (Shanghai), and Germany (Berlin). Supply chain includes battery suppliers from China, Japan, and South Korea.',
      financial: 'Tesla has significant currency exposure through its international operations, particularly in China (CNY) and Europe (EUR).'
    }
  },

  // Edge Case Companies for Testing
  'EDGE1': {
    ticker: 'EDGE1',
    companyName: 'Edge Case 1 - Missing Narrative',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 60, description: 'Primary market' },
      { country: 'Canada', percentage: 25, description: 'Secondary market' },
      { country: 'Mexico', percentage: 15, description: 'Emerging market' }
    ],
    dataSource: 'Test Data',
    lastUpdated: '2024-01-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-01-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-01-01'
    },
    revenueGeography: [
      { segment: 'United States', value: 60000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Canada', value: 25000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Mexico', value: 15000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 10000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Canada', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: '',
      financial: ''
    }
  },

  'EDGE2': {
    ticker: 'EDGE2',
    companyName: 'Edge Case 2 - Single Country',
    homeCountry: 'United States',
    sector: 'Financial Services',
    exposures: [
      { country: 'United States', percentage: 100, description: 'Domestic only' }
    ],
    dataSource: 'Test Data',
    lastUpdated: '2024-01-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-01-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-01-01'
    },
    revenueGeography: [
      { segment: 'United States', value: 100000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 15000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Operates exclusively in the United States with no international presence.',
      financial: 'All operations and currency exposure in USD.'
    }
  },

  'EDGE3': {
    ticker: 'EDGE3',
    companyName: 'Edge Case 3 - Small Percentages',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 92, description: 'Primary market' },
      { country: 'Canada', percentage: 3, description: 'Small presence' },
      { country: 'United Kingdom', percentage: 2, description: 'Small presence' },
      { country: 'Germany', percentage: 1.5, description: 'Minimal presence' },
      { country: 'France', percentage: 1.5, description: 'Minimal presence' }
    ],
    dataSource: 'Test Data',
    lastUpdated: '2024-01-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-01-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-01-01'
    },
    revenueGeography: [
      { segment: 'United States', value: 92000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Canada', value: 3000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'United Kingdom', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Germany', value: 1500, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'France', value: 1500, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 20000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Other', value: 1000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Primarily US-based supply chain with minimal international suppliers.',
      financial: 'Predominantly USD exposure with minimal foreign currency risk.'
    }
  },

  'EDGE4': {
    ticker: 'EDGE4',
    companyName: 'Edge Case 4 - Unusual Labels',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 50, description: 'Primary market' },
      { country: 'EMEA Region', percentage: 30, description: 'Europe/Middle East/Africa' },
      { country: 'APAC', percentage: 15, description: 'Asia Pacific' },
      { country: 'LatAm', percentage: 5, description: 'Latin America' }
    ],
    dataSource: 'Test Data',
    lastUpdated: '2024-01-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-01-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-01-01'
    },
    revenueGeography: [
      { segment: 'United States', value: 50000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'EMEA', value: 30000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'APAC', value: 15000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'LatAm', value: 5000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 12000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Other', value: 8000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Global supply chain across EMEA, APAC, and Americas regions.',
      financial: 'Multi-currency exposure across USD, EUR, GBP, JPY, and other currencies.'
    }
  },

  'EDGE5': {
    ticker: 'EDGE5',
    companyName: 'Edge Case 5 - Narrative Only',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 40, description: 'Estimated primary market' },
      { country: 'China', percentage: 30, description: 'Estimated manufacturing' },
      { country: 'Europe', percentage: 20, description: 'Estimated market' },
      { country: 'Other', percentage: 10, description: 'Estimated other' }
    ],
    dataSource: 'Test Data - Narrative Only',
    lastUpdated: '2024-01-01',
    v4Metadata: {
      version: '4.0',
      lastEnhanced: '2024-01-01',
      enhancementStatus: 'enhanced',
      filingPeriod: '2024',
      filingDate: '2024-01-01'
    },
    revenueGeography: [],
    ppeData: {
      items: []
    },
    narrativeText: {
      supply: 'The company operates manufacturing facilities primarily in China with assembly operations in Vietnam and India. Component suppliers are located in Taiwan, South Korea, and Japan. Distribution centers are in the United States and Europe.',
      financial: 'The company has significant currency exposure to CNY, EUR, JPY, and KRW through its international manufacturing and sales operations. Hedging programs are in place to manage foreign exchange risk.'
    }
  }
};

export function getFilingPeriod(ticker: string): { filingPeriod: string; filingDate: string } {
  const companyData = ENHANCED_COMPANY_EXPOSURES[ticker];
  if (!companyData || !companyData.v4Metadata) {
    return { filingPeriod: '2024', filingDate: '2024-01-01' };
  }
  return {
    filingPeriod: companyData.v4Metadata.filingPeriod,
    filingDate: companyData.v4Metadata.filingDate
  };
}

/**
 * Check if a ticker has V.4 enhancements
 */
export function hasV4Enhancements(ticker: string): boolean {
  const companyData = ENHANCED_COMPANY_EXPOSURES[ticker];
  return companyData?.v4Metadata?.enhancementStatus === 'enhanced';
}

/**
 * Get legacy exposures (for backward compatibility)
 */
export function getLegacyExposures(ticker: string) {
  const companyData = ENHANCED_COMPANY_EXPOSURES[ticker];
  if (!companyData) return null;
  
  return {
    ticker: companyData.ticker,
    companyName: companyData.companyName,
    homeCountry: companyData.homeCountry,
    sector: companyData.sector,
    exposures: companyData.exposures,
    dataSource: companyData.dataSource
  };
}