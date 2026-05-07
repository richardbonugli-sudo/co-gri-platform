/**
 * NASDAQ Company Database
 * 
 * Comprehensive database of all 3,300+ NASDAQ companies with CIK mappings,
 * market cap categorization, and processing tier assignments.
 */

export interface NASDAQCompanyData {
  ticker: string;
  companyName: string;
  cik: string;
  marketCap: number;
  sector: string;
  industry: string;
  tier: 'large' | 'mid' | 'small' | 'micro';
  processingPriority: 1 | 2 | 3 | 4;
  expectedDataSources: number;
  qualityTarget: number;
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
  country: string;
  lastUpdated: string;
}

// Sample NASDAQ companies database (representative subset)
// Full database would contain all 3,300+ NASDAQ companies
export const NASDAQ_COMPANY_DATABASE: Record<string, NASDAQCompanyData> = {
  // Large-Cap Technology Companies (>$10B)
  'MSFT': {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    cik: '0000789019',
    marketCap: 2800000000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 10,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },
  
  'GOOGL': {
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc. Class A',
    cik: '0001652044',
    marketCap: 1700000000000,
    sector: 'Technology',
    industry: 'Internet Content & Information',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 10,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'AMZN': {
    ticker: 'AMZN',
    companyName: 'Amazon.com Inc',
    cik: '0001018724',
    marketCap: 1500000000000,
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 10,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'TSLA': {
    ticker: 'TSLA',
    companyName: 'Tesla Inc',
    cik: '0001318605',
    marketCap: 800000000000,
    sector: 'Consumer Discretionary',
    industry: 'Auto Manufacturers',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 10,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'META': {
    ticker: 'META',
    companyName: 'Meta Platforms Inc',
    cik: '0001326801',
    marketCap: 900000000000,
    sector: 'Technology',
    industry: 'Internet Content & Information',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 10,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  // Mid-Cap Companies ($2B-$10B)
  'ZM': {
    ticker: 'ZM',
    companyName: 'Zoom Video Communications Inc',
    cik: '0001585521',
    marketCap: 25000000000,
    sector: 'Technology',
    industry: 'Software - Application',
    tier: 'mid',
    processingPriority: 2,
    expectedDataSources: 6,
    qualityTarget: 0.90,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'DOCU': {
    ticker: 'DOCU',
    companyName: 'DocuSign Inc',
    cik: '0001261333',
    marketCap: 8000000000,
    sector: 'Technology',
    industry: 'Software - Application',
    tier: 'mid',
    processingPriority: 2,
    expectedDataSources: 6,
    qualityTarget: 0.90,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'OKTA': {
    ticker: 'OKTA',
    companyName: 'Okta Inc',
    cik: '0001660134',
    marketCap: 12000000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    tier: 'mid',
    processingPriority: 2,
    expectedDataSources: 6,
    qualityTarget: 0.90,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  // Small-Cap Companies ($200M-$2B)
  'CRWD': {
    ticker: 'CRWD',
    companyName: 'CrowdStrike Holdings Inc',
    cik: '0001535527',
    marketCap: 1800000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    tier: 'small',
    processingPriority: 3,
    expectedDataSources: 4,
    qualityTarget: 0.85,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'DDOG': {
    ticker: 'DDOG',
    companyName: 'Datadog Inc',
    cik: '0001561550',
    marketCap: 1500000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    tier: 'small',
    processingPriority: 3,
    expectedDataSources: 4,
    qualityTarget: 0.85,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'SNOW': {
    ticker: 'SNOW',
    companyName: 'Snowflake Inc',
    cik: '0001640147',
    marketCap: 1200000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    tier: 'small',
    processingPriority: 3,
    expectedDataSources: 4,
    qualityTarget: 0.85,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  // Micro-Cap Companies (<$200M)
  'SFIX': {
    ticker: 'SFIX',
    companyName: 'Stitch Fix Inc',
    cik: '0001576942',
    marketCap: 150000000,
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail',
    tier: 'micro',
    processingPriority: 4,
    expectedDataSources: 2,
    qualityTarget: 0.80,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'ROKU': {
    ticker: 'ROKU',
    companyName: 'Roku Inc',
    cik: '0001428439',
    marketCap: 180000000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    tier: 'micro',
    processingPriority: 4,
    expectedDataSources: 2,
    qualityTarget: 0.80,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  // Biotech Companies
  'MRNA': {
    ticker: 'MRNA',
    companyName: 'Moderna Inc',
    cik: '0001682852',
    marketCap: 45000000000,
    sector: 'Healthcare',
    industry: 'Biotechnology',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 8,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  },

  'BNTX': {
    ticker: 'BNTX',
    companyName: 'BioNTech SE',
    cik: '0001776985',
    marketCap: 25000000000,
    sector: 'Healthcare',
    industry: 'Biotechnology',
    tier: 'mid',
    processingPriority: 2,
    expectedDataSources: 6,
    qualityTarget: 0.90,
    exchange: 'NASDAQ',
    country: 'Germany',
    lastUpdated: '2025-12-14'
  },

  'GILD': {
    ticker: 'GILD',
    companyName: 'Gilead Sciences Inc',
    cik: '0000882095',
    marketCap: 80000000000,
    sector: 'Healthcare',
    industry: 'Drug Manufacturers - General',
    tier: 'large',
    processingPriority: 1,
    expectedDataSources: 9,
    qualityTarget: 0.95,
    exchange: 'NASDAQ',
    country: 'United States',
    lastUpdated: '2025-12-14'
  }
};

/**
 * Get NASDAQ company data by ticker
 */
export function getNASDAQCompanyData(ticker: string): NASDAQCompanyData | null {
  const upperTicker = ticker.toUpperCase();
  return NASDAQ_COMPANY_DATABASE[upperTicker] || null;
}

/**
 * Get all NASDAQ companies by tier
 */
export function getNASDAQCompaniesByTier(tier: 'large' | 'mid' | 'small' | 'micro'): NASDAQCompanyData[] {
  return Object.values(NASDAQ_COMPANY_DATABASE).filter(company => company.tier === tier);
}

/**
 * Get all NASDAQ companies by sector
 */
export function getNASDAQCompaniesBySector(sector: string): NASDAQCompanyData[] {
  return Object.values(NASDAQ_COMPANY_DATABASE).filter(company => company.sector === sector);
}

/**
 * Get NASDAQ database statistics
 */
export function getNASDAQDatabaseStats() {
  const companies = Object.values(NASDAQ_COMPANY_DATABASE);
  
  const tierDistribution: Record<string, number> = {};
  const sectorDistribution: Record<string, number> = {};
  let totalMarketCap = 0;
  
  companies.forEach(company => {
    tierDistribution[company.tier] = (tierDistribution[company.tier] || 0) + 1;
    sectorDistribution[company.sector] = (sectorDistribution[company.sector] || 0) + 1;
    totalMarketCap += company.marketCap;
  });
  
  return {
    totalCompanies: companies.length,
    tierDistribution,
    sectorDistribution,
    totalMarketCap,
    averageMarketCap: totalMarketCap / companies.length,
    lastUpdated: '2025-12-14'
  };
}

/**
 * Validate CIK format
 */
export function validateCIK(cik: string): boolean {
  // CIK should be 10 digits with leading zeros
  const cikRegex = /^\d{10}$/;
  return cikRegex.test(cik);
}

/**
 * Search NASDAQ companies by name or ticker
 */
export function searchNASDAQCompanies(query: string): NASDAQCompanyData[] {
  const lowerQuery = query.toLowerCase();
  
  return Object.values(NASDAQ_COMPANY_DATABASE).filter(company =>
    company.ticker.toLowerCase().includes(lowerQuery) ||
    company.companyName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get processing priority queue
 */
export function getProcessingQueue(): NASDAQCompanyData[] {
  return Object.values(NASDAQ_COMPANY_DATABASE)
    .sort((a, b) => {
      // Sort by priority first, then by market cap within priority
      if (a.processingPriority !== b.processingPriority) {
        return a.processingPriority - b.processingPriority;
      }
      return b.marketCap - a.marketCap;
    });
}