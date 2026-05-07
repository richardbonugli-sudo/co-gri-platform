/**
 * Global Database Schema Enhancement - Phase 1 Implementation
 * 
 * Extended database architecture supporting 15,000+ global companies
 * with multi-currency, multi-jurisdiction, and scalable design.
 */

import { UnifiedCompanyRecord } from './UnifiedDatabaseIntegrator';

export interface GlobalCompanyRecord extends UnifiedCompanyRecord {
  // Global identifiers
  isin?: string;
  lei?: string; // Legal Entity Identifier
  localExchangeCode?: string;
  bloombergTicker?: string;
  reutersRIC?: string;
  
  // Jurisdiction-specific data
  jurisdiction: JurisdictionInfo;
  regulatoryFilings: RegulatoryFiling[];
  localCurrency: CurrencyInfo;
  
  // Enhanced geographic data
  globalGeographicSegments: Record<string, GlobalGeographicSegment>;
  supplyChainGeography: SupplyChainGeography[];
  facilityLocations: FacilityLocation[];
  
  // Multi-language support
  companyNames: Record<string, string>; // language code -> company name
  businessDescriptions: Record<string, string>; // language code -> description
  
  // Enhanced compliance and quality
  complianceStatus: ComplianceStatus;
  dataSourceHierarchy: DataSourceHierarchy;
  globalQualityMetrics: GlobalQualityMetrics;
}

export interface JurisdictionInfo {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  primaryExchange: string;
  exchangeCode: string;
  regulatoryBody: string;
  regulatoryDatabase: string;
  filingRequirements: FilingRequirement[];
  reportingStandards: 'IFRS' | 'US_GAAP' | 'LOCAL_GAAP' | 'OTHER';
  language: string;
  timezone: string;
}

export interface RegulatoryFiling {
  filingId: string;
  filingType: string;
  filingName: string;
  filingDate: Date;
  reportingPeriod: string;
  url: string;
  language: string;
  processed: boolean;
  extractedData?: any;
  confidence: number;
}

export interface CurrencyInfo {
  code: string; // ISO 4217
  name: string;
  symbol: string;
  exchangeRate?: number; // to USD
  lastUpdated?: Date;
}

export interface GlobalGeographicSegment {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities' | 'supply_chain' | 'customers';
  confidence: number;
  source: string;
  sourceType: 'regulatory' | 'sustainability' | 'website' | 'inference';
  evidenceType: 'structured' | 'narrative' | 'inferred';
  validationScore: number;
  lastUpdated: string;
  
  // Multi-currency support
  absoluteValue?: number;
  currency?: string;
  
  // Enhanced tracking
  historicalValues: GlobalHistoricalValue[];
  changeDetected: boolean;
  lastChangeDate?: string;
  
  // Quality indicators
  sourceReliability: number;
  crossValidated: boolean;
  validationSources: string[];
}

export interface GlobalHistoricalValue {
  value: number;
  percentage: number;
  confidence: number;
  timestamp: string;
  source: string;
  currency?: string;
  exchangeRate?: number;
  changeReason?: string;
  validationStatus: 'validated' | 'pending' | 'flagged';
}

export interface SupplyChainGeography {
  geography: string;
  supplierCount: number;
  supplierPercentage: number;
  procurementValue?: number;
  currency?: string;
  confidence: number;
  source: string;
  lastUpdated: string;
}

export interface FacilityLocation {
  facilityId: string;
  facilityType: 'headquarters' | 'manufacturing' | 'office' | 'r_and_d' | 'distribution' | 'retail';
  geography: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  employeeCount?: number;
  operationalStatus: 'active' | 'inactive' | 'planned' | 'divested';
  confidence: number;
  source: string;
  lastUpdated: string;
}

export interface ComplianceStatus {
  regulatoryCompliance: boolean;
  filingUpToDate: boolean;
  lastFilingDate?: Date;
  nextFilingDue?: Date;
  complianceIssues: string[];
  auditStatus: 'clean' | 'qualified' | 'adverse' | 'disclaimer' | 'unknown';
}

export interface DataSourceHierarchy {
  primarySources: string[];
  secondarySources: string[];
  tertiarySources: string[];
  sourceReliabilityScores: Record<string, number>;
  lastSourceUpdate: Record<string, Date>;
  sourceConflicts: SourceConflict[];
}

export interface SourceConflict {
  conflictId: string;
  sources: string[];
  dataField: string;
  conflictingValues: any[];
  resolution: 'manual' | 'automated' | 'pending';
  resolvedValue?: any;
  confidence: number;
  timestamp: Date;
}

export interface GlobalQualityMetrics {
  overallScore: number;
  jurisdictionScore: number;
  sourceQualityScore: number;
  validationScore: number;
  completenessScore: number;
  freshnessScore: number;
  consistencyScore: number;
  
  // Detailed metrics
  geographicCoverage: number; // Percentage of revenue/operations covered
  sourceCount: number;
  crossValidationRate: number;
  lastQualityCheck: Date;
  qualityTrend: 'improving' | 'stable' | 'declining';
}

export interface FilingRequirement {
  filingType: string;
  frequency: 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'ad_hoc';
  deadline: string; // Relative to period end
  mandatory: boolean;
  geographicDisclosureRequired: boolean;
  language: string;
}

export interface GlobalDatabaseStats {
  totalCompanies: number;
  companiesByJurisdiction: Record<string, number>;
  companiesByExchange: Record<string, number>;
  companiesByCurrency: Record<string, number>;
  totalGeographicSegments: number;
  totalFacilities: number;
  totalSupplyChainEntries: number;
  averageQualityScore: number;
  dataFreshness: {
    upToDate: number; // Companies with recent data
    stale: number; // Companies needing updates
    outdated: number; // Companies with old data
  };
  processingCapacity: {
    dailyCapacity: number;
    currentLoad: number;
    queueLength: number;
  };
}

export interface GlobalSearchCriteria {
  jurisdictions?: string[];
  exchanges?: string[];
  marketCapRange?: { min: number; max: number };
  currencies?: string[];
  sectors?: string[];
  geographies?: string[];
  qualityThreshold?: number;
  dataFreshnessThreshold?: number; // Days
  hasGeographicData?: boolean;
  hasFacilityData?: boolean;
  hasSupplyChainData?: boolean;
}

export class GlobalDatabaseSchema {
  private globalCompanies: Map<string, GlobalCompanyRecord> = new Map();
  private jurisdictionIndex: Map<string, Set<string>> = new Map(); // jurisdiction -> company IDs
  private exchangeIndex: Map<string, Set<string>> = new Map(); // exchange -> company IDs
  private currencyIndex: Map<string, Set<string>> = new Map(); // currency -> company IDs
  private geographyIndex: Map<string, Set<string>> = new Map(); // geography -> company IDs
  private identifierIndex: Map<string, string> = new Map(); // various IDs -> primary ticker
  
  // Currency exchange rates (simplified - in production, integrate with real-time service)
  private exchangeRates: Map<string, number> = new Map([
    ['USD', 1.0],
    ['EUR', 1.05],
    ['GBP', 1.25],
    ['JPY', 0.0067],
    ['CAD', 0.74],
    ['AUD', 0.65],
    ['SGD', 0.74],
    ['HKD', 0.13],
    ['CHF', 1.10]
  ]);

  constructor() {
    this.initializeGlobalSchema();
  }

  /**
   * Add or update global company record
   */
  addGlobalCompany(company: GlobalCompanyRecord): void {
    // Validate required fields
    this.validateGlobalCompany(company);
    
    // Store company
    this.globalCompanies.set(company.ticker, company);
    
    // Update indexes
    this.updateIndexes(company);
    
    console.log(`✅ Added global company: ${company.ticker} (${company.jurisdiction.country})`);
  }

  /**
   * Get company by various identifiers
   */
  getCompanyByIdentifier(identifier: string): GlobalCompanyRecord | null {
    // Try direct ticker lookup
    if (this.globalCompanies.has(identifier)) {
      return this.globalCompanies.get(identifier)!;
    }
    
    // Try identifier index
    const ticker = this.identifierIndex.get(identifier);
    if (ticker) {
      return this.globalCompanies.get(ticker) || null;
    }
    
    return null;
  }

  /**
   * Search companies with global criteria
   */
  searchGlobalCompanies(criteria: GlobalSearchCriteria): GlobalCompanyRecord[] {
    let results = Array.from(this.globalCompanies.values());
    
    // Filter by jurisdictions
    if (criteria.jurisdictions?.length) {
      results = results.filter(company => 
        criteria.jurisdictions!.includes(company.jurisdiction.country)
      );
    }
    
    // Filter by exchanges
    if (criteria.exchanges?.length) {
      results = results.filter(company => 
        criteria.exchanges!.includes(company.jurisdiction.primaryExchange)
      );
    }
    
    // Filter by market cap range
    if (criteria.marketCapRange) {
      results = results.filter(company => {
        const marketCapUSD = this.convertToUSD(company.marketCap, company.localCurrency.code);
        return marketCapUSD >= criteria.marketCapRange!.min && 
               marketCapUSD <= criteria.marketCapRange!.max;
      });
    }
    
    // Filter by currencies
    if (criteria.currencies?.length) {
      results = results.filter(company => 
        criteria.currencies!.includes(company.localCurrency.code)
      );
    }
    
    // Filter by sectors
    if (criteria.sectors?.length) {
      results = results.filter(company => 
        criteria.sectors!.includes(company.sector)
      );
    }
    
    // Filter by geographies
    if (criteria.geographies?.length) {
      results = results.filter(company => {
        const companyGeographies = Object.keys(company.globalGeographicSegments);
        return criteria.geographies!.some(geo => companyGeographies.includes(geo));
      });
    }
    
    // Filter by quality threshold
    if (criteria.qualityThreshold !== undefined) {
      results = results.filter(company => 
        company.globalQualityMetrics.overallScore >= criteria.qualityThreshold!
      );
    }
    
    // Filter by data freshness
    if (criteria.dataFreshnessThreshold !== undefined) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - criteria.dataFreshnessThreshold);
      
      results = results.filter(company => 
        new Date(company.updatedAt) >= thresholdDate
      );
    }
    
    // Filter by geographic data availability
    if (criteria.hasGeographicData) {
      results = results.filter(company => 
        Object.keys(company.globalGeographicSegments).length > 0
      );
    }
    
    // Filter by facility data availability
    if (criteria.hasFacilityData) {
      results = results.filter(company => 
        company.facilityLocations.length > 0
      );
    }
    
    // Filter by supply chain data availability
    if (criteria.hasSupplyChainData) {
      results = results.filter(company => 
        company.supplyChainGeography.length > 0
      );
    }
    
    return results;
  }

  /**
   * Get companies by jurisdiction
   */
  getCompaniesByJurisdiction(jurisdiction: string): GlobalCompanyRecord[] {
    const companyIds = this.jurisdictionIndex.get(jurisdiction) || new Set();
    return Array.from(companyIds)
      .map(id => this.globalCompanies.get(id))
      .filter(company => company !== undefined) as GlobalCompanyRecord[];
  }

  /**
   * Get companies by exchange
   */
  getCompaniesByExchange(exchange: string): GlobalCompanyRecord[] {
    const companyIds = this.exchangeIndex.get(exchange) || new Set();
    return Array.from(companyIds)
      .map(id => this.globalCompanies.get(id))
      .filter(company => company !== undefined) as GlobalCompanyRecord[];
  }

  /**
   * Convert currency to USD
   */
  convertToUSD(amount: number, fromCurrency: string): number {
    const rate = this.exchangeRates.get(fromCurrency) || 1.0;
    return amount * rate;
  }

  /**
   * Convert currency from USD
   */
  convertFromUSD(amountUSD: number, toCurrency: string): number {
    const rate = this.exchangeRates.get(toCurrency) || 1.0;
    return amountUSD / rate;
  }

  /**
   * Update exchange rates
   */
  updateExchangeRates(rates: Record<string, number>): void {
    Object.entries(rates).forEach(([currency, rate]) => {
      this.exchangeRates.set(currency, rate);
    });
    
    console.log(`📈 Updated exchange rates for ${Object.keys(rates).length} currencies`);
  }

  /**
   * Get global database statistics
   */
  getGlobalStats(): GlobalDatabaseStats {
    const companies = Array.from(this.globalCompanies.values());
    
    // Count by jurisdiction
    const companiesByJurisdiction: Record<string, number> = {};
    companies.forEach(company => {
      const jurisdiction = company.jurisdiction.country;
      companiesByJurisdiction[jurisdiction] = (companiesByJurisdiction[jurisdiction] || 0) + 1;
    });
    
    // Count by exchange
    const companiesByExchange: Record<string, number> = {};
    companies.forEach(company => {
      const exchange = company.jurisdiction.primaryExchange;
      companiesByExchange[exchange] = (companiesByExchange[exchange] || 0) + 1;
    });
    
    // Count by currency
    const companiesByCurrency: Record<string, number> = {};
    companies.forEach(company => {
      const currency = company.localCurrency.code;
      companiesByCurrency[currency] = (companiesByCurrency[currency] || 0) + 1;
    });
    
    // Calculate totals
    const totalGeographicSegments = companies.reduce((sum, c) => 
      sum + Object.keys(c.globalGeographicSegments).length, 0);
    const totalFacilities = companies.reduce((sum, c) => 
      sum + c.facilityLocations.length, 0);
    const totalSupplyChainEntries = companies.reduce((sum, c) => 
      sum + c.supplyChainGeography.length, 0);
    
    // Calculate average quality
    const averageQualityScore = companies.length > 0 
      ? companies.reduce((sum, c) => sum + c.globalQualityMetrics.overallScore, 0) / companies.length
      : 0;
    
    // Data freshness analysis
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const upToDate = companies.filter(c => new Date(c.updatedAt) >= oneWeekAgo).length;
    const stale = companies.filter(c => {
      const updated = new Date(c.updatedAt);
      return updated < oneWeekAgo && updated >= oneMonthAgo;
    }).length;
    const outdated = companies.filter(c => new Date(c.updatedAt) < oneMonthAgo).length;
    
    return {
      totalCompanies: companies.length,
      companiesByJurisdiction,
      companiesByExchange,
      companiesByCurrency,
      totalGeographicSegments,
      totalFacilities,
      totalSupplyChainEntries,
      averageQualityScore,
      dataFreshness: {
        upToDate,
        stale,
        outdated
      },
      processingCapacity: {
        dailyCapacity: 200, // Companies per day
        currentLoad: 0, // Current processing load
        queueLength: 0 // Companies in processing queue
      }
    };
  }

  /**
   * Validate global company record
   */
  private validateGlobalCompany(company: GlobalCompanyRecord): void {
    if (!company.ticker) {
      throw new Error('Company ticker is required');
    }
    
    if (!company.jurisdiction.country) {
      throw new Error('Jurisdiction country is required');
    }
    
    if (!company.localCurrency.code) {
      throw new Error('Local currency code is required');
    }
    
    // Validate currency code
    if (!this.exchangeRates.has(company.localCurrency.code)) {
      console.warn(`⚠️ Unknown currency code: ${company.localCurrency.code}`);
    }
  }

  /**
   * Update all indexes for a company
   */
  private updateIndexes(company: GlobalCompanyRecord): void {
    const ticker = company.ticker;
    
    // Jurisdiction index
    const jurisdiction = company.jurisdiction.country;
    if (!this.jurisdictionIndex.has(jurisdiction)) {
      this.jurisdictionIndex.set(jurisdiction, new Set());
    }
    this.jurisdictionIndex.get(jurisdiction)!.add(ticker);
    
    // Exchange index
    const exchange = company.jurisdiction.primaryExchange;
    if (!this.exchangeIndex.has(exchange)) {
      this.exchangeIndex.set(exchange, new Set());
    }
    this.exchangeIndex.get(exchange)!.add(ticker);
    
    // Currency index
    const currency = company.localCurrency.code;
    if (!this.currencyIndex.has(currency)) {
      this.currencyIndex.set(currency, new Set());
    }
    this.currencyIndex.get(currency)!.add(ticker);
    
    // Geography index
    Object.keys(company.globalGeographicSegments).forEach(geography => {
      if (!this.geographyIndex.has(geography)) {
        this.geographyIndex.set(geography, new Set());
      }
      this.geographyIndex.get(geography)!.add(ticker);
    });
    
    // Identifier index
    this.identifierIndex.set(ticker, ticker); // Self-reference
    if (company.cik) this.identifierIndex.set(company.cik, ticker);
    if (company.isin) this.identifierIndex.set(company.isin, ticker);
    if (company.lei) this.identifierIndex.set(company.lei, ticker);
    if (company.cusip) this.identifierIndex.set(company.cusip, ticker);
    if (company.localExchangeCode) this.identifierIndex.set(company.localExchangeCode, ticker);
    if (company.bloombergTicker) this.identifierIndex.set(company.bloombergTicker, ticker);
    if (company.reutersRIC) this.identifierIndex.set(company.reutersRIC, ticker);
  }

  /**
   * Initialize global schema
   */
  private initializeGlobalSchema(): void {
    console.log('🌍 Initializing Global Database Schema...');
    console.log('📊 Schema supports:');
    console.log('   • Multi-jurisdiction companies');
    console.log('   • Multi-currency operations');
    console.log('   • Global identifier mapping');
    console.log('   • Enhanced geographic intelligence');
    console.log('   • Supply chain geography');
    console.log('   • Facility location tracking');
    console.log('   • Multi-language support');
    console.log('✅ Global Database Schema initialized');
  }

  /**
   * Get all companies
   */
  getAllGlobalCompanies(): Map<string, GlobalCompanyRecord> {
    return new Map(this.globalCompanies);
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Array.from(this.exchangeRates.keys());
  }

  /**
   * Get supported jurisdictions
   */
  getSupportedJurisdictions(): string[] {
    return Array.from(this.jurisdictionIndex.keys());
  }

  /**
   * Get supported exchanges
   */
  getSupportedExchanges(): string[] {
    return Array.from(this.exchangeIndex.keys());
  }
}

// Export singleton instance
export const globalDatabaseSchema = new GlobalDatabaseSchema();