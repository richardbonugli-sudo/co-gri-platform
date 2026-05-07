/**
 * Unified Database Integrator - Phase 3 Implementation
 * 
 * Integrates all 3,800+ companies (S&P 500 + NASDAQ) into a single coherent database
 * with advanced indexing, data consolidation, and quality integration.
 */

import { enhancedNASDAQDatabase, EnhancedCompanyData } from '../data/enhancedNASDAQDatabase';
import { companySpecificExposures } from '../data/companySpecificExposures';

export interface UnifiedCompanyRecord {
  // Core identifiers
  ticker: string;
  companyName: string;
  cik: string;
  cusip?: string;
  isin?: string;
  
  // Classification
  sector: string;
  industry: string;
  subIndustry?: string;
  gicsCode?: string;
  
  // Financial metrics
  marketCap: number;
  revenue?: number;
  employees?: number;
  
  // Geographic intelligence
  geographicSegments: Record<string, GeographicSegmentRecord>;
  overallConfidence: number;
  dataQuality: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  evidenceBased: boolean;
  
  // Processing metadata
  tier: 'large' | 'mid' | 'small' | 'micro';
  processingPriority: number;
  lastProcessed: string;
  processingStatus: 'completed' | 'processing' | 'pending' | 'failed';
  
  // Data sources and validation
  sourcesUsed: string[];
  validationResults: ValidationRecord[];
  
  // Version control
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Integration metadata
  dataOrigin: 'sp500' | 'nasdaq' | 'manual';
  integrationStatus: 'integrated' | 'pending' | 'conflict';
  masterRecordId: string;
}

export interface GeographicSegmentRecord {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities' | 'supply_chain';
  confidence: number;
  source: string;
  evidenceType: 'structured' | 'narrative' | 'inferred';
  validationScore: number;
  lastUpdated: string;
  
  // Historical tracking
  historicalValues: HistoricalValue[];
  changeDetected: boolean;
  lastChangeDate?: string;
}

export interface HistoricalValue {
  value: number;
  confidence: number;
  timestamp: string;
  source: string;
  changeReason?: string;
}

export interface ValidationRecord {
  rule: string;
  passed: boolean;
  score: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
}

export interface IntegrationStats {
  totalCompanies: number;
  sp500Companies: number;
  nasdaqCompanies: number;
  manualEntries: number;
  integratedCompanies: number;
  conflictResolutions: number;
  qualityDistribution: Record<string, number>;
  confidenceDistribution: Record<string, number>;
  geographicSegments: number;
  averageConfidence: number;
  evidenceBasedRate: number;
}

export interface ConflictResolution {
  ticker: string;
  conflictType: 'duplicate_ticker' | 'data_mismatch' | 'quality_conflict';
  sources: string[];
  resolution: 'merge' | 'prioritize' | 'manual_review';
  resolvedData: UnifiedCompanyRecord;
  timestamp: string;
}

export class UnifiedDatabaseIntegrator {
  private unifiedRecords: Map<string, UnifiedCompanyRecord> = new Map();
  private masterIndex: Map<string, string> = new Map(); // CIK -> ticker mapping
  private conflictLog: ConflictResolution[] = [];
  private integrationStats: IntegrationStats;
  
  constructor() {
    this.integrationStats = this.initializeStats();
  }

  /**
   * Execute complete database integration
   */
  async executeIntegration(): Promise<{
    success: boolean;
    stats: IntegrationStats;
    conflicts: ConflictResolution[];
    errors: string[];
  }> {
    console.log('🔄 Starting Phase 3 Database Integration...');
    
    const errors: string[] = [];
    
    try {
      // Step 1: Load and validate all data sources
      console.log('📊 Step 1: Loading data sources...');
      await this.loadAllDataSources();
      
      // Step 2: Resolve conflicts and duplicates
      console.log('🔍 Step 2: Resolving conflicts...');
      await this.resolveDataConflicts();
      
      // Step 3: Create master company index
      console.log('📋 Step 3: Creating master index...');
      await this.createMasterIndex();
      
      // Step 4: Integrate geographic segments
      console.log('🌍 Step 4: Integrating geographic data...');
      await this.integrateGeographicSegments();
      
      // Step 5: Calculate unified quality scores
      console.log('🎯 Step 5: Calculating quality scores...');
      await this.calculateUnifiedQualityScores();
      
      // Step 6: Optimize database structure
      console.log('⚡ Step 6: Optimizing database...');
      await this.optimizeDatabaseStructure();
      
      // Step 7: Generate integration statistics
      console.log('📈 Step 7: Generating statistics...');
      this.generateIntegrationStats();
      
      console.log('✅ Database integration completed successfully');
      
      return {
        success: true,
        stats: this.integrationStats,
        conflicts: this.conflictLog,
        errors
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('❌ Database integration failed:', errorMessage);
      
      return {
        success: false,
        stats: this.integrationStats,
        conflicts: this.conflictLog,
        errors
      };
    }
  }

  /**
   * Load all data sources for integration
   */
  private async loadAllDataSources(): Promise<void> {
    // Load manual entries (S&P 500 core data)
    const manualEntries = Object.values(companySpecificExposures);
    console.log(`📝 Loading ${manualEntries.length} manual entries...`);
    
    for (const entry of manualEntries) {
      const unifiedRecord = this.convertToUnifiedRecord(entry, 'manual');
      this.unifiedRecords.set(entry.ticker, unifiedRecord);
    }
    
    // Load enhanced NASDAQ database
    const nasdaqCompanies = enhancedNASDAQDatabase.getAllCompanies();
    console.log(`📊 Loading ${nasdaqCompanies.length} NASDAQ companies...`);
    
    for (const company of nasdaqCompanies) {
      const dataOrigin = this.isSP500Company(company.ticker) ? 'sp500' : 'nasdaq';
      const unifiedRecord = this.convertEnhancedToUnified(company, dataOrigin);
      
      // Check for conflicts with existing records
      if (this.unifiedRecords.has(company.ticker)) {
        await this.handleDataConflict(company.ticker, unifiedRecord);
      } else {
        this.unifiedRecords.set(company.ticker, unifiedRecord);
      }
    }
    
    console.log(`✅ Loaded ${this.unifiedRecords.size} total companies`);
  }

  /**
   * Convert company-specific exposure to unified record
   */
  private convertToUnifiedRecord(entry: Record<string, unknown>, origin: 'sp500' | 'nasdaq' | 'manual'): UnifiedCompanyRecord {
    const geographicSegments: Record<string, GeographicSegmentRecord> = {};
    
    // Convert geographic segments
    const segments = entry.geographicSegments as Record<string, Record<string, unknown>> || {};
    Object.entries(segments).forEach(([geo, segment]) => {
      geographicSegments[geo] = {
        geography: segment.geography as string,
        percentage: segment.percentage as number,
        metricType: segment.metricType as 'revenue' | 'operations' | 'employees' | 'facilities' | 'supply_chain',
        confidence: segment.confidence as number,
        source: segment.source as string,
        evidenceType: 'structured',
        validationScore: segment.confidence as number,
        lastUpdated: new Date().toISOString(),
        historicalValues: [],
        changeDetected: false
      };
    });
    
    return {
      ticker: entry.ticker as string,
      companyName: entry.companyName as string,
      cik: this.getCIKForTicker(entry.ticker as string) || '',
      sector: this.getSectorForTicker(entry.ticker as string) || 'Unknown',
      industry: 'Unknown',
      marketCap: this.getMarketCapForTicker(entry.ticker as string) || 0,
      geographicSegments,
      overallConfidence: this.calculateOverallConfidence(geographicSegments),
      dataQuality: (entry.dataQuality as 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D') || 'A',
      evidenceBased: true,
      tier: this.determineTierFromMarketCap(this.getMarketCapForTicker(entry.ticker as string) || 0),
      processingPriority: 1,
      lastProcessed: (entry.lastUpdated as string) || new Date().toISOString(),
      processingStatus: 'completed',
      sourcesUsed: ['Manual Entry'],
      validationResults: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataOrigin: origin,
      integrationStatus: 'integrated',
      masterRecordId: `master_${entry.ticker}_${Date.now()}`
    };
  }

  /**
   * Convert enhanced company data to unified record
   */
  private convertEnhancedToUnified(company: EnhancedCompanyData, origin: 'sp500' | 'nasdaq'): UnifiedCompanyRecord {
    const geographicSegments: Record<string, GeographicSegmentRecord> = {};
    
    // Convert geographic segments if they exist
    if (company.geographicSegments) {
      Object.entries(company.geographicSegments).forEach(([geo, segment]) => {
        geographicSegments[geo] = {
          ...segment,
          historicalValues: [],
          changeDetected: false
        };
      });
    }
    
    return {
      ticker: company.ticker,
      companyName: company.companyName,
      cik: company.cik,
      sector: company.sector,
      industry: company.industry,
      marketCap: company.marketCap,
      revenue: company.revenue,
      employees: company.employees,
      geographicSegments,
      overallConfidence: this.calculateOverallConfidence(geographicSegments),
      dataQuality: company.dataQuality || 'B',
      evidenceBased: Object.keys(geographicSegments).length > 0,
      tier: company.tier,
      processingPriority: company.processingPriority,
      lastProcessed: company.lastProcessed || new Date().toISOString(),
      processingStatus: company.processingStatus,
      sourcesUsed: ['Enhanced Processing'],
      validationResults: [],
      version: company.version,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      dataOrigin: origin,
      integrationStatus: 'integrated',
      masterRecordId: `master_${company.ticker}_${Date.now()}`
    };
  }

  /**
   * Handle data conflicts between sources
   */
  private async handleDataConflict(ticker: string, newRecord: UnifiedCompanyRecord): Promise<void> {
    const existingRecord = this.unifiedRecords.get(ticker)!;
    
    // Determine conflict type
    let conflictType: 'duplicate_ticker' | 'data_mismatch' | 'quality_conflict';
    
    if (existingRecord.cik !== newRecord.cik) {
      conflictType = 'duplicate_ticker';
    } else if (this.hasSignificantDataMismatch(existingRecord, newRecord)) {
      conflictType = 'data_mismatch';
    } else {
      conflictType = 'quality_conflict';
    }
    
    // Resolve conflict based on data quality and origin
    const resolution = this.resolveConflict(existingRecord, newRecord, conflictType);
    
    // Log conflict resolution
    this.conflictLog.push({
      ticker,
      conflictType,
      sources: [existingRecord.dataOrigin, newRecord.dataOrigin],
      resolution: resolution.strategy,
      resolvedData: resolution.resolvedRecord,
      timestamp: new Date().toISOString()
    });
    
    // Update unified record
    this.unifiedRecords.set(ticker, resolution.resolvedRecord);
    
    console.log(`🔍 Resolved ${conflictType} for ${ticker}: ${resolution.strategy}`);
  }

  /**
   * Resolve conflict between two records
   */
  private resolveConflict(
    existing: UnifiedCompanyRecord, 
    incoming: UnifiedCompanyRecord, 
    conflictType: string
  ): { strategy: 'merge' | 'prioritize' | 'manual_review'; resolvedRecord: UnifiedCompanyRecord } {
    
    // Prioritize manual entries over automated processing
    if (existing.dataOrigin === 'manual' && incoming.dataOrigin !== 'manual') {
      return { strategy: 'prioritize', resolvedRecord: existing };
    }
    
    if (incoming.dataOrigin === 'manual' && existing.dataOrigin !== 'manual') {
      return { strategy: 'prioritize', resolvedRecord: incoming };
    }
    
    // Merge records with complementary data
    if (conflictType === 'data_mismatch' && this.canMergeRecords(existing, incoming)) {
      const mergedRecord = this.mergeRecords(existing, incoming);
      return { strategy: 'merge', resolvedRecord: mergedRecord };
    }
    
    // Prioritize higher quality data
    if (existing.overallConfidence > incoming.overallConfidence) {
      return { strategy: 'prioritize', resolvedRecord: existing };
    } else {
      return { strategy: 'prioritize', resolvedRecord: incoming };
    }
  }

  /**
   * Check if records have significant data mismatch
   */
  private hasSignificantDataMismatch(record1: UnifiedCompanyRecord, record2: UnifiedCompanyRecord): boolean {
    // Check market cap difference (>20% difference is significant)
    const marketCapDiff = Math.abs(record1.marketCap - record2.marketCap) / Math.max(record1.marketCap, record2.marketCap);
    if (marketCapDiff > 0.2) return true;
    
    // Check sector mismatch
    if (record1.sector !== record2.sector) return true;
    
    // Check geographic segments overlap
    const geo1Keys = Object.keys(record1.geographicSegments);
    const geo2Keys = Object.keys(record2.geographicSegments);
    const overlap = geo1Keys.filter(key => geo2Keys.includes(key)).length;
    const totalUnique = new Set([...geo1Keys, ...geo2Keys]).size;
    
    if (overlap / totalUnique < 0.5) return true; // Less than 50% overlap
    
    return false;
  }

  /**
   * Check if records can be merged
   */
  private canMergeRecords(record1: UnifiedCompanyRecord, record2: UnifiedCompanyRecord): boolean {
    // Same company (CIK match) with complementary data
    return record1.cik === record2.cik && record1.companyName === record2.companyName;
  }

  /**
   * Merge two records with complementary data
   */
  private mergeRecords(record1: UnifiedCompanyRecord, record2: UnifiedCompanyRecord): UnifiedCompanyRecord {
    const merged: UnifiedCompanyRecord = { ...record1 };
    
    // Merge geographic segments
    const mergedSegments = { ...record1.geographicSegments };
    
    Object.entries(record2.geographicSegments).forEach(([geo, segment]) => {
      if (mergedSegments[geo]) {
        // Average percentages weighted by confidence
        const existing = mergedSegments[geo];
        const totalConfidence = existing.confidence + segment.confidence;
        
        mergedSegments[geo] = {
          ...existing,
          percentage: (existing.percentage * existing.confidence + segment.percentage * segment.confidence) / totalConfidence,
          confidence: Math.max(existing.confidence, segment.confidence),
          source: `${existing.source}, ${segment.source}`,
          lastUpdated: new Date().toISOString()
        };
      } else {
        mergedSegments[geo] = { ...segment };
      }
    });
    
    merged.geographicSegments = mergedSegments;
    
    // Update metadata
    merged.sourcesUsed = [...new Set([...record1.sourcesUsed, ...record2.sourcesUsed])];
    merged.overallConfidence = this.calculateOverallConfidence(mergedSegments);
    merged.dataQuality = this.getBetterQuality(record1.dataQuality, record2.dataQuality);
    merged.updatedAt = new Date().toISOString();
    merged.version = Math.max(record1.version, record2.version) + 1;
    
    return merged;
  }

  /**
   * Resolve all data conflicts
   */
  private async resolveDataConflicts(): Promise<void> {
    console.log(`🔍 Resolving conflicts for ${this.conflictLog.length} companies...`);
    
    // Additional conflict resolution logic if needed
    // Most conflicts are already handled during loading
    
    console.log(`✅ Resolved ${this.conflictLog.length} conflicts`);
  }

  /**
   * Create master company index
   */
  private async createMasterIndex(): Promise<void> {
    console.log('📋 Creating master company index...');
    
    this.masterIndex.clear();
    
    for (const [ticker, record] of this.unifiedRecords) {
      // Primary index: CIK -> ticker
      if (record.cik) {
        this.masterIndex.set(`cik_${record.cik}`, ticker);
      }
      
      // Secondary indexes
      if (record.cusip) {
        this.masterIndex.set(`cusip_${record.cusip}`, ticker);
      }
      
      if (record.isin) {
        this.masterIndex.set(`isin_${record.isin}`, ticker);
      }
      
      // Company name index (normalized)
      const normalizedName = record.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      this.masterIndex.set(`name_${normalizedName}`, ticker);
    }
    
    console.log(`✅ Created master index with ${this.masterIndex.size} mappings`);
  }

  /**
   * Integrate geographic segments with historical tracking
   */
  private async integrateGeographicSegments(): Promise<void> {
    console.log('🌍 Integrating geographic segments...');
    
    let totalSegments = 0;
    
    for (const [ticker, record] of this.unifiedRecords) {
      // Normalize geographic segments
      const normalizedSegments = this.normalizeGeographicSegments(record.geographicSegments);
      
      // Add historical tracking
      Object.values(normalizedSegments).forEach(segment => {
        segment.historicalValues = [{
          value: segment.percentage,
          confidence: segment.confidence,
          timestamp: segment.lastUpdated,
          source: segment.source
        }];
      });
      
      record.geographicSegments = normalizedSegments;
      totalSegments += Object.keys(normalizedSegments).length;
    }
    
    console.log(`✅ Integrated ${totalSegments} geographic segments`);
  }

  /**
   * Calculate unified quality scores
   */
  private async calculateUnifiedQualityScores(): Promise<void> {
    console.log('🎯 Calculating unified quality scores...');
    
    for (const [ticker, record] of this.unifiedRecords) {
      // Recalculate overall confidence
      record.overallConfidence = this.calculateOverallConfidence(record.geographicSegments);
      
      // Update data quality grade
      record.dataQuality = this.calculateDataQualityGrade(record);
      
      // Update evidence-based status
      record.evidenceBased = record.overallConfidence >= 0.80;
      
      // Generate validation results
      record.validationResults = this.generateValidationResults(record);
    }
    
    console.log('✅ Updated quality scores for all companies');
  }

  /**
   * Optimize database structure
   */
  private async optimizeDatabaseStructure(): Promise<void> {
    console.log('⚡ Optimizing database structure...');
    
    // Sort companies by processing priority and market cap
    const sortedEntries = Array.from(this.unifiedRecords.entries())
      .sort(([, a], [, b]) => {
        if (a.processingPriority !== b.processingPriority) {
          return a.processingPriority - b.processingPriority;
        }
        return b.marketCap - a.marketCap;
      });
    
    // Rebuild map with optimized order
    this.unifiedRecords.clear();
    sortedEntries.forEach(([ticker, record]) => {
      this.unifiedRecords.set(ticker, record);
    });
    
    console.log('✅ Database structure optimized');
  }

  /**
   * Generate integration statistics
   */
  private generateIntegrationStats(): void {
    const records = Array.from(this.unifiedRecords.values());
    
    // Count by origin
    const sp500Count = records.filter(r => r.dataOrigin === 'sp500').length;
    const nasdaqCount = records.filter(r => r.dataOrigin === 'nasdaq').length;
    const manualCount = records.filter(r => r.dataOrigin === 'manual').length;
    
    // Quality distribution
    const qualityDistribution: Record<string, number> = {};
    records.forEach(record => {
      qualityDistribution[record.dataQuality] = (qualityDistribution[record.dataQuality] || 0) + 1;
    });
    
    // Confidence distribution
    const confidenceDistribution: Record<string, number> = {};
    records.forEach(record => {
      const bucket = Math.floor(record.overallConfidence * 10) * 10;
      const key = `${bucket}-${bucket + 10}%`;
      confidenceDistribution[key] = (confidenceDistribution[key] || 0) + 1;
    });
    
    // Calculate totals
    const totalSegments = records.reduce((sum, r) => sum + Object.keys(r.geographicSegments).length, 0);
    const averageConfidence = records.reduce((sum, r) => sum + r.overallConfidence, 0) / records.length;
    const evidenceBasedCount = records.filter(r => r.evidenceBased).length;
    
    this.integrationStats = {
      totalCompanies: records.length,
      sp500Companies: sp500Count,
      nasdaqCompanies: nasdaqCount,
      manualEntries: manualCount,
      integratedCompanies: records.filter(r => r.integrationStatus === 'integrated').length,
      conflictResolutions: this.conflictLog.length,
      qualityDistribution,
      confidenceDistribution,
      geographicSegments: totalSegments,
      averageConfidence,
      evidenceBasedRate: (evidenceBasedCount / records.length) * 100
    };
  }

  /**
   * Utility methods
   */
  private calculateOverallConfidence(segments: Record<string, GeographicSegmentRecord>): number {
    const segmentArray = Object.values(segments);
    if (segmentArray.length === 0) return 0;
    
    return segmentArray.reduce((sum, seg) => sum + (seg.confidence * seg.percentage / 100), 0);
  }

  private calculateDataQualityGrade(record: UnifiedCompanyRecord): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
    const confidence = record.overallConfidence;
    const segmentCount = Object.keys(record.geographicSegments).length;
    const sourceCount = record.sourcesUsed.length;
    
    // Adjust score based on multiple factors
    let score = confidence;
    
    // Bonus for multiple segments
    if (segmentCount >= 5) score += 0.05;
    
    // Bonus for multiple sources
    if (sourceCount >= 3) score += 0.05;
    
    // Grade assignment
    if (score >= 0.95) return 'A+';
    if (score >= 0.90) return 'A';
    if (score >= 0.85) return 'B+';
    if (score >= 0.80) return 'B';
    if (score >= 0.75) return 'C+';
    if (score >= 0.70) return 'C';
    return 'D';
  }

  private generateValidationResults(record: UnifiedCompanyRecord): ValidationRecord[] {
    const results: ValidationRecord[] = [];
    const now = new Date().toISOString();
    
    // Confidence validation
    results.push({
      rule: 'Overall Confidence',
      passed: record.overallConfidence >= 0.80,
      score: record.overallConfidence,
      message: `${(record.overallConfidence * 100).toFixed(1)}% confidence`,
      severity: record.overallConfidence >= 0.80 ? 'info' : 'warning',
      timestamp: now
    });
    
    // Geographic coverage validation
    const totalCoverage = Object.values(record.geographicSegments)
      .reduce((sum, seg) => sum + seg.percentage, 0);
    
    results.push({
      rule: 'Geographic Coverage',
      passed: Math.abs(totalCoverage - 100) <= 10,
      score: Math.max(0, 1 - Math.abs(totalCoverage - 100) / 100),
      message: `${totalCoverage.toFixed(1)}% total coverage`,
      severity: Math.abs(totalCoverage - 100) <= 10 ? 'info' : 'warning',
      timestamp: now
    });
    
    return results;
  }

  private normalizeGeographicSegments(segments: Record<string, GeographicSegmentRecord>): Record<string, GeographicSegmentRecord> {
    const normalized: Record<string, GeographicSegmentRecord> = {};
    
    Object.entries(segments).forEach(([geo, segment]) => {
      const normalizedGeo = this.normalizeGeographyName(geo);
      normalized[normalizedGeo] = {
        ...segment,
        geography: normalizedGeo
      };
    });
    
    return normalized;
  }

  private normalizeGeographyName(geography: string): string {
    const mappings: Record<string, string> = {
      'US': 'United States',
      'USA': 'United States',
      'UK': 'United Kingdom',
      'EU': 'Europe',
      'APAC': 'Asia Pacific',
      'LATAM': 'Latin America'
    };
    
    return mappings[geography] || geography;
  }

  private determineTierFromMarketCap(marketCap: number): 'large' | 'mid' | 'small' | 'micro' {
    if (marketCap >= 10_000_000_000) return 'large';
    if (marketCap >= 2_000_000_000) return 'mid';
    if (marketCap >= 300_000_000) return 'small';
    return 'micro';
  }

  private getBetterQuality(quality1: string, quality2: string): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
    const qualityOrder = ['D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
    const index1 = qualityOrder.indexOf(quality1);
    const index2 = qualityOrder.indexOf(quality2);
    return qualityOrder[Math.max(index1, index2)] as 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  }

  private initializeStats(): IntegrationStats {
    return {
      totalCompanies: 0,
      sp500Companies: 0,
      nasdaqCompanies: 0,
      manualEntries: 0,
      integratedCompanies: 0,
      conflictResolutions: 0,
      qualityDistribution: {},
      confidenceDistribution: {},
      geographicSegments: 0,
      averageConfidence: 0,
      evidenceBasedRate: 0
    };
  }

  // Helper methods for data lookup
  private isSP500Company(ticker: string): boolean {
    // List of S&P 500 companies (simplified check)
    const sp500Tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B', 'UNH', 'JNJ'];
    return sp500Tickers.includes(ticker);
  }

  private getCIKForTicker(ticker: string): string | null {
    const cikMappings: Record<string, string> = {
      'AAPL': '0000320193',
      'MSFT': '0000789019',
      'TSLA': '0001318605'
    };
    return cikMappings[ticker] || null;
  }

  private getSectorForTicker(ticker: string): string | null {
    const sectorMappings: Record<string, string> = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'TSLA': 'Consumer Discretionary'
    };
    return sectorMappings[ticker] || null;
  }

  private getMarketCapForTicker(ticker: string): number | null {
    const marketCapMappings: Record<string, number> = {
      'AAPL': 3000000000000,
      'MSFT': 2800000000000,
      'TSLA': 800000000000
    };
    return marketCapMappings[ticker] || null;
  }

  /**
   * Public access methods
   */
  getUnifiedRecords(): Map<string, UnifiedCompanyRecord> {
    return new Map(this.unifiedRecords);
  }

  getMasterIndex(): Map<string, string> {
    return new Map(this.masterIndex);
  }

  getIntegrationStats(): IntegrationStats {
    return { ...this.integrationStats };
  }

  getConflictLog(): ConflictResolution[] {
    return [...this.conflictLog];
  }

  /**
   * Query methods
   */
  findCompanyByTicker(ticker: string): UnifiedCompanyRecord | null {
    return this.unifiedRecords.get(ticker.toUpperCase()) || null;
  }

  findCompanyByCIK(cik: string): UnifiedCompanyRecord | null {
    const ticker = this.masterIndex.get(`cik_${cik}`);
    return ticker ? this.unifiedRecords.get(ticker) || null : null;
  }

  getCompaniesBySector(sector: string): UnifiedCompanyRecord[] {
    return Array.from(this.unifiedRecords.values())
      .filter(company => company.sector.toLowerCase() === sector.toLowerCase());
  }

  getCompaniesByTier(tier: 'large' | 'mid' | 'small' | 'micro'): UnifiedCompanyRecord[] {
    return Array.from(this.unifiedRecords.values())
      .filter(company => company.tier === tier);
  }

  getCompaniesByQuality(minQuality: string): UnifiedCompanyRecord[] {
    const qualityOrder = ['D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
    const minIndex = qualityOrder.indexOf(minQuality);
    
    return Array.from(this.unifiedRecords.values())
      .filter(company => qualityOrder.indexOf(company.dataQuality) >= minIndex);
  }
}

// Export singleton instance
export const unifiedDatabaseIntegrator = new UnifiedDatabaseIntegrator();