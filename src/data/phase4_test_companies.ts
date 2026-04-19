/**
 * Phase 4: Comprehensive Validation Test Data Set
 * 
 * This file contains test companies for Phase 4 validation including:
 * - Baseline companies (AAPL, MSFT, GOOGL, TSLA)
 * - Edge case companies (EDGE1-EDGE5)
 */

import type { EnhancedCompanyExposure } from '@/types/v4Types';

export const PHASE4_TEST_COMPANIES: Record<string, EnhancedCompanyExposure> = {
  // ============================================================================
  // BASELINE COMPANIES FOR REGRESSION TESTING
  // ============================================================================
  
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

  // ============================================================================
  // EDGE CASE COMPANIES
  // ============================================================================

  'EDGE1': {
    ticker: 'EDGE1',
    companyName: 'Edge Case 1 - Missing Narrative',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 60, description: 'Primary market' },
      { country: 'Europe', percentage: 25, description: 'Secondary market' },
      { country: 'Asia', percentage: 15, description: 'Growing market' }
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
      { segment: 'Europe', value: 25000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Asia', value: 15000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 10000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Other', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
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
    sector: 'Technology',
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
        { country: 'United States', value: 20000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'All operations in United States.',
      financial: 'No foreign currency exposure.'
    }
  },

  'EDGE3': {
    ticker: 'EDGE3',
    companyName: 'Edge Case 3 - Small Percentages',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 94, description: 'Dominant market' },
      { country: 'Canada', percentage: 2, description: 'Small presence' },
      { country: 'Mexico', percentage: 2, description: 'Small presence' },
      { country: 'Europe', percentage: 1, description: 'Minimal presence' },
      { country: 'Asia', percentage: 1, description: 'Minimal presence' }
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
      { segment: 'United States', value: 94000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Canada', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Mexico', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'Other', value: 2000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 18000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Other', value: 500, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Primarily US-based operations with minimal international presence.',
      financial: 'Limited currency exposure due to US concentration.'
    }
  },

  'EDGE4': {
    ticker: 'EDGE4',
    companyName: 'Edge Case 4 - Unusual Labels',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 40, description: 'Americas HQ' },
      { country: 'Europe', percentage: 30, description: 'EMEA region' },
      { country: 'Asia Pacific', percentage: 20, description: 'APAC region' },
      { country: 'Latin America', percentage: 10, description: 'LatAm region' }
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
      { segment: 'Americas', value: 40000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'EMEA', value: 30000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'APAC', value: 20000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
      { segment: 'LatAm', value: 10000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
    ],
    ppeData: {
      items: [
        { country: 'United States', value: 8000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Europe', value: 4000, unit: 'millions_usd', source: 'Test Data', isTotal: false },
        { country: 'Other', value: 3000, unit: 'millions_usd', source: 'Test Data', isTotal: false }
      ]
    },
    narrativeText: {
      supply: 'Global operations across EMEA, APAC, and LatAm regions.',
      financial: 'Multi-currency exposure across major regions.'
    }
  },

  'EDGE5': {
    ticker: 'EDGE5',
    companyName: 'Edge Case 5 - Narrative Only',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      { country: 'United States', percentage: 50, description: 'Primary operations' },
      { country: 'China', percentage: 30, description: 'Manufacturing hub' },
      { country: 'Europe', percentage: 15, description: 'Sales region' },
      { country: 'Other', percentage: 5, description: 'Rest of world' }
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
    revenueGeography: [],
    ppeData: {
      items: []
    },
    narrativeText: {
      supply: 'The company operates manufacturing facilities in China and Vietnam, with assembly operations in Mexico and Thailand. Supply chain includes components from Taiwan, South Korea, and Japan.',
      financial: 'Significant currency exposure to CNY, EUR, and JPY through international operations. The company maintains hedging programs for major currencies.'
    }
  }
};

/**
 * Get all test company tickers
 */
export function getAllTestTickers(): string[] {
  return Object.keys(PHASE4_TEST_COMPANIES);
}

/**
 * Get test companies by sector
 */
export function getTestCompaniesBySector(sector: string): string[] {
  return Object.entries(PHASE4_TEST_COMPANIES)
    .filter(([_, company]) => company.sector === sector)
    .map(([ticker, _]) => ticker);
}

/**
 * Get test companies by complexity level
 */
export function getTestCompaniesByComplexity(level: 'simple' | 'medium' | 'complex'): string[] {
  return Object.entries(PHASE4_TEST_COMPANIES)
    .filter(([_, company]) => {
      const hasNarrative = company.narrativeText.supply || company.narrativeText.financial;
      const hasStructured = company.revenueGeography.length > 0 || company.ppeData.items.length > 0;
      const countryCount = company.exposures.length;
      
      if (level === 'simple') {
        return hasStructured && countryCount <= 3;
      } else if (level === 'medium') {
        return hasStructured && hasNarrative && countryCount > 3 && countryCount <= 5;
      } else {
        return hasNarrative && countryCount > 5;
      }
    })
    .map(([ticker, _]) => ticker);
}

/**
 * Get edge case companies
 */
export function getEdgeCaseCompanies(): string[] {
  return Object.keys(PHASE4_TEST_COMPANIES).filter(ticker => ticker.startsWith('EDGE'));
}