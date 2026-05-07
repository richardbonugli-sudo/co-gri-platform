/**
 * Global Regulatory Integration Framework - Phase 1 Implementation
 * 
 * Modular system for integrating with international regulatory databases
 * supporting 9 major jurisdictions with standardized data parsing.
 */

import { GlobalCompanyRecord, RegulatoryFiling } from './GlobalDatabaseSchema';
import { globalLanguageProcessor } from './GlobalLanguageProcessor';

export interface RegulatorySource {
  jurisdiction: string;
  regulatorName: string;
  databaseName: string;
  baseUrl: string;
  apiEndpoint?: string;
  authMethod: 'none' | 'api_key' | 'oauth' | 'certificate';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay?: number;
  };
  supportedFilingTypes: string[];
  dataFormat: 'xml' | 'json' | 'html' | 'pdf' | 'mixed';
  language: string;
}

export interface FilingSearchCriteria {
  companyIdentifier: string;
  identifierType: 'ticker' | 'lei' | 'local_id' | 'isin' | 'name';
  filingTypes?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
}

export interface FilingProcessingResult {
  success: boolean;
  filingId: string;
  extractedData: {
    geographicSegments: any[];
    revenueData: any[];
    operationalData: any[];
    facilityData: any[];
    supplyChainData: any[];
  };
  confidence: number;
  language: string;
  processingTime: number;
  errors: string[];
}

export interface RegulatoryIntegrationStats {
  totalSources: number;
  activeSources: number;
  totalFilingsProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  errorsBySource: Record<string, number>;
  lastUpdateBySource: Record<string, Date>;
}

export class GlobalRegulatoryIntegrator {
  private regulatorySources: Map<string, RegulatorySource> = new Map();
  private integrationModules: Map<string, RegulatoryModule> = new Map();
  private processingStats: RegulatoryIntegrationStats;
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.processingStats = this.initializeStats();
    this.initializeRegulatorySources();
    this.initializeIntegrationModules();
  }

  /**
   * Initialize all regulatory sources
   */
  private initializeRegulatorySources(): void {
    console.log('🌍 Initializing Global Regulatory Sources...');

    // United Kingdom - Companies House
    this.regulatorySources.set('UK', {
      jurisdiction: 'UK',
      regulatorName: 'Companies House',
      databaseName: 'Companies House API',
      baseUrl: 'https://find-and-update.company-information.service.gov.uk/',
      apiEndpoint: 'https://api.company-information.service.gov.uk',
      authMethod: 'api_key',
      rateLimit: {
        requestsPerMinute: 600,
        requestsPerDay: 10000
      },
      supportedFilingTypes: ['Annual Report & Accounts', 'Confirmation Statement', 'Change of Details'],
      dataFormat: 'json',
      language: 'en'
    });

    // European Union - ESMA
    this.regulatorySources.set('EU', {
      jurisdiction: 'EU',
      regulatorName: 'European Securities and Markets Authority',
      databaseName: 'ESMA Database',
      baseUrl: 'https://www.esma.europa.eu',
      apiEndpoint: 'https://registers.esma.europa.eu/api',
      authMethod: 'none',
      rateLimit: {
        requestsPerMinute: 120,
        requestsPerDay: 5000
      },
      supportedFilingTypes: ['Annual Financial Report (AFR)', 'Half-yearly Report', 'Interim Management Statement'],
      dataFormat: 'xml',
      language: 'en'
    });

    // Canada - SEDAR+
    this.regulatorySources.set('CA', {
      jurisdiction: 'CA',
      regulatorName: 'Canadian Securities Administrators',
      databaseName: 'SEDAR+',
      baseUrl: 'https://www.sedarplus.ca',
      apiEndpoint: 'https://api.sedarplus.ca',
      authMethod: 'api_key',
      rateLimit: {
        requestsPerMinute: 300,
        requestsPerDay: 15000
      },
      supportedFilingTypes: ['Annual Information Form (AIF)', 'Annual Report', 'Management Discussion & Analysis'],
      dataFormat: 'mixed',
      language: 'en'
    });

    // Japan - EDINET (FSA)
    this.regulatorySources.set('JP', {
      jurisdiction: 'JP',
      regulatorName: 'Financial Services Agency',
      databaseName: 'EDINET',
      baseUrl: 'https://disclosure.edinet-fsa.go.jp',
      apiEndpoint: 'https://api.edinet-fsa.go.jp',
      authMethod: 'api_key',
      rateLimit: {
        requestsPerMinute: 200,
        requestsPerDay: 8000
      },
      supportedFilingTypes: ['Annual Securities Report', 'Quarterly Report', 'Extraordinary Report'],
      dataFormat: 'xml',
      language: 'ja'
    });

    // Australia - ASX
    this.regulatorySources.set('AU', {
      jurisdiction: 'AU',
      regulatorName: 'Australian Securities Exchange',
      databaseName: 'ASX Announcements',
      baseUrl: 'https://www.asx.com.au/markets/trade-our-cash-market/announcements',
      apiEndpoint: 'https://www.asx.com.au/asx/1/share',
      authMethod: 'none',
      rateLimit: {
        requestsPerMinute: 180,
        requestsPerDay: 7200
      },
      supportedFilingTypes: ['Annual Report', 'Half Year Report', 'Quarterly Report', 'Appendix 4E'],
      dataFormat: 'mixed',
      language: 'en'
    });

    // Singapore - SGX
    this.regulatorySources.set('SG', {
      jurisdiction: 'SG',
      regulatorName: 'Singapore Exchange',
      databaseName: 'SGXNet',
      baseUrl: 'https://www.sgx.com/securities/company-announcements',
      apiEndpoint: 'https://api.sgx.com',
      authMethod: 'api_key',
      rateLimit: {
        requestsPerMinute: 150,
        requestsPerDay: 6000
      },
      supportedFilingTypes: ['Annual Report', 'Half-yearly Results', 'Quarterly Results', 'Sustainability Report'],
      dataFormat: 'mixed',
      language: 'en'
    });

    // Hong Kong - HKEX
    this.regulatorySources.set('HK', {
      jurisdiction: 'HK',
      regulatorName: 'Hong Kong Exchanges and Clearing',
      databaseName: 'HKEXnews',
      baseUrl: 'https://www.hkexnews.hk',
      apiEndpoint: 'https://www1.hkexnews.hk/search',
      authMethod: 'none',
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerDay: 4000
      },
      supportedFilingTypes: ['Annual Report', 'Interim Report', 'ESG Report', 'Announcement'],
      dataFormat: 'mixed',
      language: 'en'
    });

    // Germany - Bundesanzeiger
    this.regulatorySources.set('DE', {
      jurisdiction: 'DE',
      regulatorName: 'Bundesanzeiger Verlag',
      databaseName: 'Bundesanzeiger',
      baseUrl: 'https://www.bundesanzeiger.de',
      apiEndpoint: 'https://www.bundesanzeiger.de/pub/de/search-result',
      authMethod: 'none',
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 2000
      },
      supportedFilingTypes: ['Annual Financial Report', 'Consolidated Financial Statements', 'Management Report'],
      dataFormat: 'html',
      language: 'de'
    });

    // France - AMF
    this.regulatorySources.set('FR', {
      jurisdiction: 'FR',
      regulatorName: 'Autorité des marchés financiers',
      databaseName: 'AMF Database',
      baseUrl: 'https://www.amf-france.org',
      apiEndpoint: 'https://bdif.amf-france.org/api',
      authMethod: 'none',
      rateLimit: {
        requestsPerMinute: 90,
        requestsPerDay: 3000
      },
      supportedFilingTypes: ['Document d\'enregistrement universel', 'Rapport financier annuel', 'Rapport semestriel'],
      dataFormat: 'mixed',
      language: 'fr'
    });

    console.log(`✅ Initialized ${this.regulatorySources.size} regulatory sources`);
  }

  /**
   * Initialize integration modules for each jurisdiction
   */
  private initializeIntegrationModules(): void {
    console.log('🔧 Initializing Integration Modules...');

    this.regulatorySources.forEach((source, jurisdiction) => {
      const module = new RegulatoryModule(source);
      this.integrationModules.set(jurisdiction, module);
      
      // Initialize rate limiter
      this.rateLimiters.set(jurisdiction, new RateLimiter(
        source.rateLimit.requestsPerMinute,
        source.rateLimit.requestsPerDay
      ));
    });

    console.log(`✅ Initialized ${this.integrationModules.size} integration modules`);
  }

  /**
   * Search for filings across all jurisdictions
   */
  async searchFilings(
    jurisdiction: string, 
    criteria: FilingSearchCriteria
  ): Promise<RegulatoryFiling[]> {
    const module = this.integrationModules.get(jurisdiction);
    if (!module) {
      throw new Error(`No integration module found for jurisdiction: ${jurisdiction}`);
    }

    const rateLimiter = this.rateLimiters.get(jurisdiction)!;
    
    try {
      // Check rate limits
      await rateLimiter.waitForAvailability();
      
      // Search filings
      const filings = await module.searchFilings(criteria);
      
      console.log(`🔍 Found ${filings.length} filings for ${criteria.companyIdentifier} in ${jurisdiction}`);
      return filings;
      
    } catch (error) {
      console.error(`❌ Failed to search filings in ${jurisdiction}:`, error);
      this.processingStats.errorsBySource[jurisdiction] = 
        (this.processingStats.errorsBySource[jurisdiction] || 0) + 1;
      return [];
    }
  }

  /**
   * Process a regulatory filing for geographic intelligence
   */
  async processFiling(
    jurisdiction: string, 
    filing: RegulatoryFiling
  ): Promise<FilingProcessingResult> {
    const startTime = Date.now();
    
    try {
      const module = this.integrationModules.get(jurisdiction);
      if (!module) {
        throw new Error(`No integration module found for jurisdiction: ${jurisdiction}`);
      }

      // Download and parse filing
      const filingContent = await module.downloadFiling(filing);
      
      // Process with language processor
      const languageResult = await globalLanguageProcessor.processDocument(
        filingContent,
        {
          documentType: 'filing',
          jurisdiction,
          company: filing.filingId,
          language: this.regulatorySources.get(jurisdiction)?.language || 'en'
        }
      );

      // Extract structured data
      const extractedData = await module.extractGeographicData(
        languageResult.processedText,
        languageResult.entities
      );

      // Calculate confidence
      const confidence = this.calculateProcessingConfidence(
        extractedData,
        languageResult.language.confidence,
        jurisdiction
      );

      const processingTime = Date.now() - startTime;

      // Update statistics
      this.processingStats.totalFilingsProcessed++;
      this.processingStats.lastUpdateBySource[jurisdiction] = new Date();

      const result: FilingProcessingResult = {
        success: true,
        filingId: filing.filingId,
        extractedData,
        confidence,
        language: languageResult.language.language,
        processingTime,
        errors: []
      };

      console.log(`✅ Processed filing ${filing.filingId}: ${extractedData.geographicSegments.length} segments, ${(confidence * 100).toFixed(1)}% confidence`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Failed to process filing ${filing.filingId}:`, errorMessage);

      return {
        success: false,
        filingId: filing.filingId,
        extractedData: {
          geographicSegments: [],
          revenueData: [],
          operationalData: [],
          facilityData: [],
          supplyChainData: []
        },
        confidence: 0,
        language: 'unknown',
        processingTime,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Process company across all relevant jurisdictions
   */
  async processGlobalCompany(company: GlobalCompanyRecord): Promise<{
    success: boolean;
    processedFilings: number;
    extractedSegments: number;
    averageConfidence: number;
    errors: string[];
  }> {
    console.log(`🌍 Processing global company: ${company.ticker} (${company.jurisdiction.country})`);
    
    const errors: string[] = [];
    const results: FilingProcessingResult[] = [];
    
    try {
      // Search for filings in company's jurisdiction
      const searchCriteria: FilingSearchCriteria = {
        companyIdentifier: company.localExchangeCode || company.ticker,
        identifierType: 'ticker',
        dateRange: {
          from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 years ago
          to: new Date()
        },
        limit: 10
      };

      const filings = await this.searchFilings(company.jurisdiction.country, searchCriteria);
      
      // Process each filing
      for (const filing of filings) {
        try {
          const result = await this.processFiling(company.jurisdiction.country, filing);
          results.push(result);
          
          if (result.success) {
            // Update company with extracted data
            this.integrateFilingData(company, result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Filing ${filing.filingId}: ${errorMessage}`);
        }
      }

      // Calculate summary statistics
      const successfulResults = results.filter(r => r.success);
      const totalSegments = successfulResults.reduce((sum, r) => 
        sum + r.extractedData.geographicSegments.length, 0);
      const averageConfidence = successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
        : 0;

      console.log(`✅ Processed ${company.ticker}: ${successfulResults.length}/${results.length} filings successful, ${totalSegments} segments extracted`);

      return {
        success: successfulResults.length > 0,
        processedFilings: results.length,
        extractedSegments: totalSegments,
        averageConfidence,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      return {
        success: false,
        processedFilings: 0,
        extractedSegments: 0,
        averageConfidence: 0,
        errors
      };
    }
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats(): RegulatoryIntegrationStats {
    const activeSources = Array.from(this.integrationModules.values())
      .filter(module => module.isActive()).length;

    const successfulFilings = this.processingStats.totalFilingsProcessed - 
      Object.values(this.processingStats.errorsBySource).reduce((sum, errors) => sum + errors, 0);

    return {
      ...this.processingStats,
      activeSources,
      successRate: this.processingStats.totalFilingsProcessed > 0 
        ? successfulFilings / this.processingStats.totalFilingsProcessed 
        : 0
    };
  }

  /**
   * Get supported jurisdictions
   */
  getSupportedJurisdictions(): string[] {
    return Array.from(this.regulatorySources.keys());
  }

  /**
   * Get regulatory source info
   */
  getRegulatorySource(jurisdiction: string): RegulatorySource | null {
    return this.regulatorySources.get(jurisdiction) || null;
  }

  /**
   * Calculate processing confidence
   */
  private calculateProcessingConfidence(
    extractedData: any,
    languageConfidence: number,
    jurisdiction: string
  ): number {
    let confidence = languageConfidence;

    // Boost for structured data
    if (extractedData.geographicSegments.length > 0) {
      confidence += 0.2;
    }

    // Boost for multiple data types
    const dataTypes = [
      extractedData.revenueData.length > 0,
      extractedData.operationalData.length > 0,
      extractedData.facilityData.length > 0,
      extractedData.supplyChainData.length > 0
    ].filter(Boolean).length;

    confidence += dataTypes * 0.05;

    // Jurisdiction-specific adjustments
    const jurisdictionBonus = {
      'US': 0.1, // SEC filings are highly structured
      'UK': 0.08,
      'CA': 0.08,
      'AU': 0.07,
      'SG': 0.07,
      'EU': 0.06,
      'JP': 0.05, // Language complexity
      'HK': 0.06,
      'DE': 0.05,
      'FR': 0.05
    };

    confidence += jurisdictionBonus[jurisdiction as keyof typeof jurisdictionBonus] || 0;

    return Math.min(confidence, 1.0);
  }

  /**
   * Integrate filing data into company record
   */
  private integrateFilingData(company: GlobalCompanyRecord, result: FilingProcessingResult): void {
    // Add geographic segments
    result.extractedData.geographicSegments.forEach((segment: any) => {
      const segmentKey = segment.geography;
      company.globalGeographicSegments[segmentKey] = {
        geography: segment.geography,
        percentage: segment.percentage,
        metricType: segment.metricType || 'revenue',
        confidence: segment.confidence,
        source: `Regulatory Filing: ${result.filingId}`,
        sourceType: 'regulatory',
        evidenceType: 'structured',
        validationScore: result.confidence,
        lastUpdated: new Date().toISOString(),
        historicalValues: [],
        changeDetected: false,
        sourceReliability: 0.9,
        crossValidated: false,
        validationSources: []
      };
    });

    // Add regulatory filing record
    company.regulatoryFilings.push({
      filingId: result.filingId,
      filingType: 'Annual Report', // Simplified
      filingName: 'Annual Report',
      filingDate: new Date(),
      reportingPeriod: new Date().getFullYear().toString(),
      url: '',
      language: result.language,
      processed: true,
      extractedData: result.extractedData,
      confidence: result.confidence
    });

    // Update quality metrics
    company.globalQualityMetrics.sourceCount++;
    company.globalQualityMetrics.lastQualityCheck = new Date();
    company.updatedAt = new Date().toISOString();
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): RegulatoryIntegrationStats {
    return {
      totalSources: 0,
      activeSources: 0,
      totalFilingsProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      errorsBySource: {},
      lastUpdateBySource: {}
    };
  }
}

/**
 * Individual regulatory module for each jurisdiction
 */
class RegulatoryModule {
  private source: RegulatorySource;
  private active: boolean = true;

  constructor(source: RegulatorySource) {
    this.source = source;
  }

  /**
   * Search for filings
   */
  async searchFilings(criteria: FilingSearchCriteria): Promise<RegulatoryFiling[]> {
    // Simulate filing search (in production, implement actual API calls)
    const mockFilings: RegulatoryFiling[] = [
      {
        filingId: `${this.source.jurisdiction}_${criteria.companyIdentifier}_2024_AR`,
        filingType: 'Annual Report',
        filingName: 'Annual Report 2024',
        filingDate: new Date('2024-03-31'),
        reportingPeriod: '2024',
        url: `${this.source.baseUrl}/filing/${criteria.companyIdentifier}/2024`,
        language: this.source.language,
        processed: false,
        confidence: 0.85
      }
    ];

    return mockFilings;
  }

  /**
   * Download filing content
   */
  async downloadFiling(filing: RegulatoryFiling): Promise<string> {
    // Simulate filing download (in production, implement actual download)
    return `Mock filing content for ${filing.filingId} in ${this.source.language}. Geographic revenue segments: United States 45%, Europe 30%, Asia 25%.`;
  }

  /**
   * Extract geographic data from filing content
   */
  async extractGeographicData(content: string, entities: any[]): Promise<any> {
    // Simulate data extraction (in production, implement sophisticated parsing)
    const geographicSegments = entities.map(entity => ({
      geography: entity.normalizedName,
      percentage: Math.random() * 50 + 10, // Mock percentage
      metricType: 'revenue',
      confidence: entity.confidence
    }));

    return {
      geographicSegments,
      revenueData: [],
      operationalData: [],
      facilityData: [],
      supplyChainData: []
    };
  }

  /**
   * Check if module is active
   */
  isActive(): boolean {
    return this.active;
  }
}

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requestsPerMinute: number;
  private requestsPerDay?: number;
  private minuteRequests: number[] = [];
  private dailyRequests: number = 0;
  private lastDayReset: Date = new Date();

  constructor(requestsPerMinute: number, requestsPerDay?: number) {
    this.requestsPerMinute = requestsPerMinute;
    this.requestsPerDay = requestsPerDay;
  }

  /**
   * Wait for availability based on rate limits
   */
  async waitForAvailability(): Promise<void> {
    const now = new Date();
    
    // Reset daily counter if needed
    if (now.getDate() !== this.lastDayReset.getDate()) {
      this.dailyRequests = 0;
      this.lastDayReset = now;
    }

    // Check daily limit
    if (this.requestsPerDay && this.dailyRequests >= this.requestsPerDay) {
      throw new Error('Daily rate limit exceeded');
    }

    // Clean old minute requests
    const oneMinuteAgo = now.getTime() - 60 * 1000;
    this.minuteRequests = this.minuteRequests.filter(time => time > oneMinuteAgo);

    // Check minute limit
    if (this.minuteRequests.length >= this.requestsPerMinute) {
      const waitTime = this.minuteRequests[0] + 60 * 1000 - now.getTime();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record request
    this.minuteRequests.push(now.getTime());
    this.dailyRequests++;
  }
}

// Export singleton instance
export const globalRegulatoryIntegrator = new GlobalRegulatoryIntegrator();