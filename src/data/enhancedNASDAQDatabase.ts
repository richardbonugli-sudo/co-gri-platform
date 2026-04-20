/**
 * Enhanced NASDAQ Database - Production-Ready Schema
 * 
 * Optimized database schema for 3,800+ companies with efficient indexing,
 * partitioning, and fast retrieval capabilities.
 */

export interface EnhancedCompanyData {
  // Core identifiers
  ticker: string;
  companyName: string;
  cik: string;
  cusip?: string;
  isin?: string;
  
  // Financial metrics
  marketCap: number;
  revenue?: number;
  employees?: number;
  foundedYear?: number;
  
  // Classification
  sector: string;
  industry: string;
  subIndustry?: string;
  gicsCode?: string;
  
  // Processing tier
  tier: 'large' | 'mid' | 'small' | 'micro';
  processingPriority: 1 | 2 | 3 | 4;
  expectedDataSources: number;
  qualityTarget: number;
  
  // Exchange and location
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
  country: string;
  state?: string;
  city?: string;
  
  // Processing metadata
  lastProcessed?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  dataQuality?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  
  // Geographic segments (processed results)
  geographicSegments?: Record<string, GeographicSegmentData>;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GeographicSegmentData {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities' | 'supply_chain';
  confidence: number;
  source: string;
  evidenceType: 'structured' | 'narrative' | 'inferred';
  validationScore: number;
  lastUpdated: string;
}

export interface DatabaseIndex {
  name: string;
  fields: string[];
  unique: boolean;
  sparse?: boolean;
}

export interface DatabasePartition {
  name: string;
  field: string;
  strategy: 'range' | 'hash' | 'list';
  partitions: PartitionDefinition[];
}

export interface PartitionDefinition {
  name: string;
  condition: string;
  estimatedSize: number;
}

/**
 * Enhanced NASDAQ Database Class
 */
export class EnhancedNASDAQDatabase {
  private companies: Map<string, EnhancedCompanyData> = new Map();
  private indexes: Map<string, Map<string, Set<string>>> = new Map();
  private partitions: Map<string, EnhancedCompanyData[]> = new Map();
  
  // Database schema configuration
  private readonly DATABASE_SCHEMA = {
    version: '2.0.0',
    maxCompanies: 5000, // Allow for growth beyond 3,800
    maxSegmentsPerCompany: 15,
    indexingStrategy: 'multi-level',
    partitioningStrategy: 'tier-based'
  };

  // Index definitions for fast lookups
  private readonly INDEXES: DatabaseIndex[] = [
    { name: 'ticker_idx', fields: ['ticker'], unique: true },
    { name: 'cik_idx', fields: ['cik'], unique: true },
    { name: 'sector_idx', fields: ['sector'], unique: false },
    { name: 'tier_idx', fields: ['tier'], unique: false },
    { name: 'exchange_idx', fields: ['exchange'], unique: false },
    { name: 'market_cap_idx', fields: ['marketCap'], unique: false },
    { name: 'processing_status_idx', fields: ['processingStatus'], unique: false },
    { name: 'data_quality_idx', fields: ['dataQuality'], unique: false, sparse: true },
    { name: 'compound_tier_sector_idx', fields: ['tier', 'sector'], unique: false },
    { name: 'compound_status_priority_idx', fields: ['processingStatus', 'processingPriority'], unique: false }
  ];

  // Partition definitions for efficient data distribution
  private readonly PARTITIONS: DatabasePartition[] = [
    {
      name: 'tier_partition',
      field: 'tier',
      strategy: 'list',
      partitions: [
        { name: 'large_cap', condition: "tier = 'large'", estimatedSize: 150 },
        { name: 'mid_cap', condition: "tier = 'mid'", estimatedSize: 400 },
        { name: 'small_cap', condition: "tier = 'small'", estimatedSize: 1200 },
        { name: 'micro_cap', condition: "tier = 'micro'", estimatedSize: 1550 }
      ]
    },
    {
      name: 'market_cap_partition',
      field: 'marketCap',
      strategy: 'range',
      partitions: [
        { name: 'mega_cap', condition: 'marketCap >= 200000000000', estimatedSize: 50 },
        { name: 'large_cap', condition: 'marketCap >= 10000000000 AND marketCap < 200000000000', estimatedSize: 300 },
        { name: 'mid_cap', condition: 'marketCap >= 2000000000 AND marketCap < 10000000000', estimatedSize: 600 },
        { name: 'small_cap', condition: 'marketCap >= 300000000 AND marketCap < 2000000000', estimatedSize: 1500 },
        { name: 'micro_cap', condition: 'marketCap < 300000000', estimatedSize: 1350 }
      ]
    }
  ];

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Initialize database with indexes and partitions
   */
  private initializeDatabase(): void {
    console.log('🗄️ Initializing Enhanced NASDAQ Database...');
    
    // Initialize indexes
    this.INDEXES.forEach(indexDef => {
      this.indexes.set(indexDef.name, new Map());
    });
    
    // Initialize partitions
    this.PARTITIONS.forEach(partitionDef => {
      partitionDef.partitions.forEach(partition => {
        this.partitions.set(partition.name, []);
      });
    });
    
    console.log(`✅ Database initialized with ${this.INDEXES.length} indexes and ${this.PARTITIONS.length} partition strategies`);
  }

  /**
   * Add or update company data with automatic indexing and partitioning
   */
  addCompany(companyData: EnhancedCompanyData): void {
    const ticker = companyData.ticker.toUpperCase();
    
    // Set metadata
    const now = new Date().toISOString();
    const existingCompany = this.companies.get(ticker);
    
    const enhancedData: EnhancedCompanyData = {
      ...companyData,
      ticker,
      createdAt: existingCompany?.createdAt || now,
      updatedAt: now,
      version: (existingCompany?.version || 0) + 1
    };
    
    // Store in main collection
    this.companies.set(ticker, enhancedData);
    
    // Update indexes
    this.updateIndexes(ticker, enhancedData);
    
    // Update partitions
    this.updatePartitions(ticker, enhancedData);
    
    console.log(`📝 ${existingCompany ? 'Updated' : 'Added'} company: ${ticker}`);
  }

  /**
   * Update indexes for a company
   */
  private updateIndexes(ticker: string, company: EnhancedCompanyData): void {
    this.INDEXES.forEach(indexDef => {
      const indexMap = this.indexes.get(indexDef.name)!;
      
      indexDef.fields.forEach(field => {
        const value = this.getFieldValue(company, field);
        if (value !== undefined && value !== null) {
          const valueKey = String(value).toLowerCase();
          
          if (!indexMap.has(valueKey)) {
            indexMap.set(valueKey, new Set());
          }
          indexMap.get(valueKey)!.add(ticker);
        }
      });
    });
  }

  /**
   * Update partitions for a company
   */
  private updatePartitions(ticker: string, company: EnhancedCompanyData): void {
    // Remove from all partitions first
    this.partitions.forEach(partition => {
      const index = partition.findIndex(c => c.ticker === ticker);
      if (index !== -1) {
        partition.splice(index, 1);
      }
    });
    
    // Add to appropriate partitions
    this.PARTITIONS.forEach(partitionDef => {
      const targetPartition = this.findMatchingPartition(company, partitionDef);
      if (targetPartition) {
        const partitionData = this.partitions.get(targetPartition.name);
        if (partitionData) {
          partitionData.push(company);
        }
      }
    });
  }

  /**
   * Find matching partition for a company
   */
  private findMatchingPartition(company: EnhancedCompanyData, partitionDef: DatabasePartition): PartitionDefinition | null {
    for (const partition of partitionDef.partitions) {
      if (this.evaluatePartitionCondition(company, partition.condition)) {
        return partition;
      }
    }
    return null;
  }

  /**
   * Evaluate partition condition (simplified implementation)
   */
  private evaluatePartitionCondition(company: EnhancedCompanyData, condition: string): boolean {
    // Simplified condition evaluation - in production, use a proper expression parser
    if (condition.includes("tier = 'large'")) return company.tier === 'large';
    if (condition.includes("tier = 'mid'")) return company.tier === 'mid';
    if (condition.includes("tier = 'small'")) return company.tier === 'small';
    if (condition.includes("tier = 'micro'")) return company.tier === 'micro';
    
    if (condition.includes('marketCap >= 200000000000')) return company.marketCap >= 200000000000;
    if (condition.includes('marketCap >= 10000000000 AND marketCap < 200000000000')) {
      return company.marketCap >= 10000000000 && company.marketCap < 200000000000;
    }
    if (condition.includes('marketCap >= 2000000000 AND marketCap < 10000000000')) {
      return company.marketCap >= 2000000000 && company.marketCap < 10000000000;
    }
    if (condition.includes('marketCap >= 300000000 AND marketCap < 2000000000')) {
      return company.marketCap >= 300000000 && company.marketCap < 2000000000;
    }
    if (condition.includes('marketCap < 300000000')) return company.marketCap < 300000000;
    
    return false;
  }

  /**
   * Get field value using dot notation
   */
  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Fast company lookup by ticker
   */
  getCompany(ticker: string): EnhancedCompanyData | null {
    return this.companies.get(ticker.toUpperCase()) || null;
  }

  /**
   * Fast lookup by CIK
   */
  getCompanyByCIK(cik: string): EnhancedCompanyData | null {
    const cikIndex = this.indexes.get('cik_idx');
    if (!cikIndex) return null;
    
    const tickers = cikIndex.get(cik.toLowerCase());
    if (!tickers || tickers.size === 0) return null;
    
    const ticker = Array.from(tickers)[0];
    return this.getCompany(ticker);
  }

  /**
   * Get companies by sector with pagination
   */
  getCompaniesBySector(
    sector: string, 
    options: { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ): { companies: EnhancedCompanyData[]; total: number } {
    const sectorIndex = this.indexes.get('sector_idx');
    if (!sectorIndex) return { companies: [], total: 0 };
    
    const tickers = sectorIndex.get(sector.toLowerCase()) || new Set();
    const companies = Array.from(tickers)
      .map(ticker => this.getCompany(ticker))
      .filter((company): company is EnhancedCompanyData => company !== null);
    
    // Sort companies
    if (options.sortBy) {
      companies.sort((a, b) => {
        const aValue = this.getFieldValue(a, options.sortBy!);
        const bValue = this.getFieldValue(b, options.sortBy!);
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return options.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || companies.length;
    const paginatedCompanies = companies.slice(offset, offset + limit);
    
    return {
      companies: paginatedCompanies,
      total: companies.length
    };
  }

  /**
   * Get companies by tier with efficient partition lookup
   */
  getCompaniesByTier(tier: 'large' | 'mid' | 'small' | 'micro'): EnhancedCompanyData[] {
    const partitionName = `${tier}_cap`;
    return this.partitions.get(partitionName) || [];
  }

  /**
   * Get companies by processing status
   */
  getCompaniesByStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): EnhancedCompanyData[] {
    const statusIndex = this.indexes.get('processing_status_idx');
    if (!statusIndex) return [];
    
    const tickers = statusIndex.get(status) || new Set();
    return Array.from(tickers)
      .map(ticker => this.getCompany(ticker))
      .filter((company): company is EnhancedCompanyData => company !== null);
  }

  /**
   * Advanced search with multiple criteria
   */
  searchCompanies(criteria: {
    sector?: string;
    tier?: string;
    exchange?: string;
    processingStatus?: string;
    dataQuality?: string;
    marketCapMin?: number;
    marketCapMax?: number;
    textSearch?: string;
  }): EnhancedCompanyData[] {
    let results = Array.from(this.companies.values());
    
    // Apply filters
    if (criteria.sector) {
      results = results.filter(c => c.sector.toLowerCase() === criteria.sector!.toLowerCase());
    }
    
    if (criteria.tier) {
      results = results.filter(c => c.tier === criteria.tier);
    }
    
    if (criteria.exchange) {
      results = results.filter(c => c.exchange === criteria.exchange);
    }
    
    if (criteria.processingStatus) {
      results = results.filter(c => c.processingStatus === criteria.processingStatus);
    }
    
    if (criteria.dataQuality) {
      results = results.filter(c => c.dataQuality === criteria.dataQuality);
    }
    
    if (criteria.marketCapMin !== undefined) {
      results = results.filter(c => c.marketCap >= criteria.marketCapMin!);
    }
    
    if (criteria.marketCapMax !== undefined) {
      results = results.filter(c => c.marketCap <= criteria.marketCapMax!);
    }
    
    if (criteria.textSearch) {
      const searchTerm = criteria.textSearch.toLowerCase();
      results = results.filter(c => 
        c.ticker.toLowerCase().includes(searchTerm) ||
        c.companyName.toLowerCase().includes(searchTerm) ||
        c.industry.toLowerCase().includes(searchTerm)
      );
    }
    
    return results;
  }

  /**
   * Get processing queue ordered by priority and tier
   */
  getProcessingQueue(): EnhancedCompanyData[] {
    const pendingCompanies = this.getCompaniesByStatus('pending');
    
    return pendingCompanies.sort((a, b) => {
      // Sort by processing priority first
      if (a.processingPriority !== b.processingPriority) {
        return a.processingPriority - b.processingPriority;
      }
      
      // Then by market cap (descending)
      return b.marketCap - a.marketCap;
    });
  }

  /**
   * Update company processing status
   */
  updateProcessingStatus(
    ticker: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    additionalData?: Partial<EnhancedCompanyData>
  ): boolean {
    const company = this.getCompany(ticker);
    if (!company) return false;
    
    const updatedCompany: EnhancedCompanyData = {
      ...company,
      processingStatus: status,
      lastProcessed: new Date().toISOString(),
      ...additionalData
    };
    
    this.addCompany(updatedCompany);
    return true;
  }

  /**
   * Bulk update companies
   */
  bulkUpdateCompanies(updates: { ticker: string; data: Partial<EnhancedCompanyData> }[]): number {
    let updatedCount = 0;
    
    updates.forEach(update => {
      const company = this.getCompany(update.ticker);
      if (company) {
        const updatedCompany: EnhancedCompanyData = {
          ...company,
          ...update.data,
          updatedAt: new Date().toISOString(),
          version: company.version + 1
        };
        
        this.addCompany(updatedCompany);
        updatedCount++;
      }
    });
    
    return updatedCount;
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): {
    totalCompanies: number;
    tierDistribution: Record<string, number>;
    sectorDistribution: Record<string, number>;
    exchangeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    qualityDistribution: Record<string, number>;
    averageMarketCap: number;
    totalMarketCap: number;
    indexSizes: Record<string, number>;
    partitionSizes: Record<string, number>;
    databaseSize: string;
  } {
    const companies = Array.from(this.companies.values());
    
    // Calculate distributions
    const tierDistribution: Record<string, number> = {};
    const sectorDistribution: Record<string, number> = {};
    const exchangeDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    const qualityDistribution: Record<string, number> = {};
    
    let totalMarketCap = 0;
    
    companies.forEach(company => {
      tierDistribution[company.tier] = (tierDistribution[company.tier] || 0) + 1;
      sectorDistribution[company.sector] = (sectorDistribution[company.sector] || 0) + 1;
      exchangeDistribution[company.exchange] = (exchangeDistribution[company.exchange] || 0) + 1;
      statusDistribution[company.processingStatus] = (statusDistribution[company.processingStatus] || 0) + 1;
      
      if (company.dataQuality) {
        qualityDistribution[company.dataQuality] = (qualityDistribution[company.dataQuality] || 0) + 1;
      }
      
      totalMarketCap += company.marketCap;
    });
    
    // Calculate index sizes
    const indexSizes: Record<string, number> = {};
    this.indexes.forEach((indexMap, indexName) => {
      indexSizes[indexName] = indexMap.size;
    });
    
    // Calculate partition sizes
    const partitionSizes: Record<string, number> = {};
    this.partitions.forEach((partition, partitionName) => {
      partitionSizes[partitionName] = partition.length;
    });
    
    // Estimate database size
    const estimatedSizeBytes = companies.length * 2048; // Rough estimate: 2KB per company
    const databaseSize = this.formatBytes(estimatedSizeBytes);
    
    return {
      totalCompanies: companies.length,
      tierDistribution,
      sectorDistribution,
      exchangeDistribution,
      statusDistribution,
      qualityDistribution,
      averageMarketCap: companies.length > 0 ? totalMarketCap / companies.length : 0,
      totalMarketCap,
      indexSizes,
      partitionSizes,
      databaseSize
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Export database to JSON
   */
  exportToJSON(): string {
    const exportData = {
      schema: this.DATABASE_SCHEMA,
      companies: Array.from(this.companies.values()),
      stats: this.getDatabaseStats(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import database from JSON
   */
  importFromJSON(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;
      
      if (data.companies && Array.isArray(data.companies)) {
        data.companies.forEach((company: any, index: number) => {
          try {
            this.addCompany(company as EnhancedCompanyData);
            imported++;
          } catch (error) {
            errors.push(`Row ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [error instanceof Error ? error.message : 'Invalid JSON format'] 
      };
    }
  }

  /**
   * Clear all data
   */
  clearDatabase(): void {
    this.companies.clear();
    this.indexes.forEach(indexMap => indexMap.clear());
    this.partitions.forEach(partition => partition.length = 0);
    console.log('🗑️ Database cleared');
  }

  /**
   * Get all companies (use with caution for large datasets)
   */
  getAllCompanies(): EnhancedCompanyData[] {
    return Array.from(this.companies.values());
  }
}

// Export singleton instance
export const enhancedNASDAQDatabase = new EnhancedNASDAQDatabase();

// Export utility functions
export function createCompanyFromNASDAQData(nasdaqData: any): EnhancedCompanyData {
  return {
    ticker: nasdaqData.ticker,
    companyName: nasdaqData.companyName,
    cik: nasdaqData.cik,
    marketCap: nasdaqData.marketCap,
    sector: nasdaqData.sector,
    industry: nasdaqData.industry,
    tier: determineTier(nasdaqData.marketCap),
    processingPriority: determineProcessingPriority(nasdaqData.marketCap),
    expectedDataSources: determineExpectedSources(nasdaqData.marketCap),
    qualityTarget: determineQualityTarget(nasdaqData.marketCap),
    exchange: nasdaqData.exchange || 'NASDAQ',
    country: nasdaqData.country || 'United States',
    processingStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

function determineTier(marketCap: number): 'large' | 'mid' | 'small' | 'micro' {
  if (marketCap >= 10_000_000_000) return 'large';
  if (marketCap >= 2_000_000_000) return 'mid';
  if (marketCap >= 300_000_000) return 'small';
  return 'micro';
}

function determineProcessingPriority(marketCap: number): 1 | 2 | 3 | 4 {
  if (marketCap >= 10_000_000_000) return 1;
  if (marketCap >= 2_000_000_000) return 2;
  if (marketCap >= 300_000_000) return 3;
  return 4;
}

function determineExpectedSources(marketCap: number): number {
  if (marketCap >= 10_000_000_000) return 8;
  if (marketCap >= 2_000_000_000) return 6;
  if (marketCap >= 300_000_000) return 4;
  return 3;
}

function determineQualityTarget(marketCap: number): number {
  if (marketCap >= 10_000_000_000) return 0.95;
  if (marketCap >= 2_000_000_000) return 0.90;
  if (marketCap >= 300_000_000) return 0.85;
  return 0.80;
}