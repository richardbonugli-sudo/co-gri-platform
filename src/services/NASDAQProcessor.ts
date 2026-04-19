/**
 * NASDAQ Processor - Enhanced Data Expansion for 3,300+ NASDAQ Companies
 * 
 * Extends the existing S&P 500 processing capabilities to handle all NASDAQ companies
 * with tiered quality standards and adaptive processing based on company size.
 */

import { RealSECProcessor } from '../tools/data-expansion/RealSECProcessor';
import { EnhancedDataExpansion } from './enhancedDataExpansion';
import { AdvancedNLPEngine } from './advancedNLPEngine';
import { SupplyChainIntelligence } from './supplyChainIntelligence';

export interface NASDAQCompany {
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
}

export interface ProcessingTier {
  tier: string;
  confidenceTarget: number;
  minSources: number;
  maxSources: number;
  processingTime: number;
  qualityThreshold: number;
  batchSize: number;
}

export interface NASDAQProcessingResult {
  ticker: string;
  companyName: string;
  tier: string;
  geographicSegments: GeographicSegment[];
  processingTime: number;
  overallConfidence: number;
  dataQuality: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  sourcesUsed: string[];
  evidenceBased: boolean;
  timestamp: Date;
}

export interface GeographicSegment {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities';
  confidence: number;
  source: string;
}

export class NASDAQProcessor {
  private secProcessor: RealSECProcessor;
  private enhancedExpansion: EnhancedDataExpansion;
  private nlpEngine: AdvancedNLPEngine;
  private supplyChainIntel: SupplyChainIntelligence;
  
  // Processing tier configurations
  private readonly PROCESSING_TIERS: Record<string, ProcessingTier> = {
    'large': {
      tier: 'large',
      confidenceTarget: 0.95,
      minSources: 7,
      maxSources: 12,
      processingTime: 3000,
      qualityThreshold: 0.90,
      batchSize: 5
    },
    'mid': {
      tier: 'mid',
      confidenceTarget: 0.90,
      minSources: 5,
      maxSources: 8,
      processingTime: 2000,
      qualityThreshold: 0.85,
      batchSize: 8
    },
    'small': {
      tier: 'small',
      confidenceTarget: 0.85,
      minSources: 3,
      maxSources: 6,
      processingTime: 1500,
      qualityThreshold: 0.80,
      batchSize: 12
    },
    'micro': {
      tier: 'micro',
      confidenceTarget: 0.80,
      minSources: 2,
      maxSources: 4,
      processingTime: 1000,
      qualityThreshold: 0.75,
      batchSize: 15
    }
  };

  // NASDAQ company database (sample - full database would be loaded from external source)
  private readonly NASDAQ_COMPANIES: NASDAQCompany[] = [
    // Large-Cap Examples
    {
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      cik: '0000789019',
      marketCap: 2800000000000,
      sector: 'Technology',
      industry: 'Software',
      tier: 'large',
      processingPriority: 1,
      expectedDataSources: 10,
      qualityTarget: 0.95
    },
    {
      ticker: 'GOOGL',
      companyName: 'Alphabet Inc. Class A',
      cik: '0001652044',
      marketCap: 1700000000000,
      sector: 'Technology',
      industry: 'Internet Services',
      tier: 'large',
      processingPriority: 1,
      expectedDataSources: 10,
      qualityTarget: 0.95
    },
    // Mid-Cap Examples
    {
      ticker: 'ZM',
      companyName: 'Zoom Video Communications Inc',
      cik: '0001585521',
      marketCap: 25000000000,
      sector: 'Technology',
      industry: 'Software',
      tier: 'mid',
      processingPriority: 2,
      expectedDataSources: 6,
      qualityTarget: 0.90
    },
    // Small-Cap Examples
    {
      ticker: 'CRWD',
      companyName: 'CrowdStrike Holdings Inc',
      cik: '0001535527',
      marketCap: 8000000000,
      sector: 'Technology',
      industry: 'Cybersecurity',
      tier: 'small',
      processingPriority: 3,
      expectedDataSources: 4,
      qualityTarget: 0.85
    }
    // Note: Full database would contain all 3,300 NASDAQ companies
  ];

  constructor() {
    this.secProcessor = new RealSECProcessor();
    this.enhancedExpansion = new EnhancedDataExpansion();
    this.nlpEngine = new AdvancedNLPEngine();
    this.supplyChainIntel = new SupplyChainIntelligence();
  }

  /**
   * Process all NASDAQ companies with tiered approach
   */
  async processAllNASDAQCompanies(
    onProgress?: (processed: number, total: number, currentTicker: string) => void,
    onResult?: (result: NASDAQProcessingResult) => void,
    onError?: (ticker: string, error: string) => void
  ): Promise<{
    results: NASDAQProcessingResult[];
    summary: {
      totalCompanies: number;
      successfulProcessing: number;
      averageConfidence: number;
      processingTimeMs: number;
      tierBreakdown: Record<string, number>;
    };
  }> {
    console.log('🚀 Starting NASDAQ processing for 3,300+ companies...');
    
    const results: NASDAQProcessingResult[] = [];
    const startTime = Date.now();
    
    // Process by tier (priority order)
    const tiers = ['large', 'mid', 'small', 'micro'];
    let processedCount = 0;
    const totalCompanies = this.NASDAQ_COMPANIES.length;
    
    for (const tier of tiers) {
      const tierCompanies = this.NASDAQ_COMPANIES.filter(c => c.tier === tier);
      const tierConfig = this.PROCESSING_TIERS[tier];
      
      console.log(`📊 Processing ${tier}-cap companies: ${tierCompanies.length} companies`);
      
      // Process in batches
      for (let i = 0; i < tierCompanies.length; i += tierConfig.batchSize) {
        const batch = tierCompanies.slice(i, i + tierConfig.batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(company => 
          this.processNASDAQCompany(company)
            .then(result => {
              if (result) {
                results.push(result);
                onResult?.(result);
              }
              return result;
            })
            .catch(error => {
              console.error(`❌ Error processing ${company.ticker}:`, error);
              onError?.(company.ticker, error.message);
              return null;
            })
        );
        
        await Promise.all(batchPromises);
        
        processedCount += batch.length;
        onProgress?.(processedCount, totalCompanies, batch[batch.length - 1]?.ticker || '');
        
        // Rate limiting between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const processingTime = Date.now() - startTime;
    const successfulResults = results.filter(r => r !== null);
    const averageConfidence = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.overallConfidence, 0) / successfulResults.length
      : 0;
    
    // Calculate tier breakdown
    const tierBreakdown: Record<string, number> = {};
    successfulResults.forEach(result => {
      tierBreakdown[result.tier] = (tierBreakdown[result.tier] || 0) + 1;
    });
    
    console.log(`✅ NASDAQ processing completed: ${successfulResults.length}/${totalCompanies} companies processed`);
    
    return {
      results: successfulResults,
      summary: {
        totalCompanies,
        successfulProcessing: successfulResults.length,
        averageConfidence,
        processingTimeMs: processingTime,
        tierBreakdown
      }
    };
  }

  /**
   * Process individual NASDAQ company with tier-specific approach
   */
  async processNASDAQCompany(company: NASDAQCompany): Promise<NASDAQProcessingResult | null> {
    console.log(`🔄 Processing ${company.tier}-cap company: ${company.ticker}`);
    
    const startTime = Date.now();
    const tierConfig = this.PROCESSING_TIERS[company.tier];
    
    try {
      // Multi-source data collection based on tier
      const dataSources = await this.collectTieredDataSources(company, tierConfig);
      
      // Enhanced NLP processing for geographic extraction
      const geographicSegments = await this.extractGeographicIntelligence(
        company, 
        dataSources, 
        tierConfig
      );
      
      // Quality validation and confidence scoring
      const qualityAssessment = this.assessDataQuality(
        geographicSegments, 
        dataSources, 
        tierConfig
      );
      
      const processingTime = Date.now() - startTime;
      
      const result: NASDAQProcessingResult = {
        ticker: company.ticker,
        companyName: company.companyName,
        tier: company.tier,
        geographicSegments,
        processingTime,
        overallConfidence: qualityAssessment.confidence,
        dataQuality: qualityAssessment.grade,
        sourcesUsed: dataSources.map(s => s.type),
        evidenceBased: qualityAssessment.confidence >= tierConfig.qualityThreshold,
        timestamp: new Date()
      };
      
      console.log(`✅ ${company.ticker}: ${geographicSegments.length} segments, ${(qualityAssessment.confidence * 100).toFixed(1)}% confidence`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to process ${company.ticker}:`, error);
      return null;
    }
  }

  /**
   * Collect data sources based on company tier
   */
  private async collectTieredDataSources(
    company: NASDAQCompany, 
    tierConfig: ProcessingTier
  ): Promise<any[]> {
    const dataSources: any[] = [];
    
    try {
      // SEC filings (available for all tiers)
      const secData = await this.secProcessor.processCompany(company.ticker);
      if (secData) {
        dataSources.push({
          type: 'SEC Filing',
          data: secData,
          confidence: 0.95,
          priority: 1
        });
      }
      
      // Enhanced data sources for larger companies
      if (company.tier === 'large' || company.tier === 'mid') {
        // Sustainability reports
        try {
          const sustainabilityData = await this.enhancedExpansion.extractSustainabilityData(company.ticker);
          if (sustainabilityData) {
            dataSources.push({
              type: 'Sustainability Report',
              data: sustainabilityData,
              confidence: 0.90,
              priority: 2
            });
          }
        } catch (error) {
          console.log(`⚠️ No sustainability data for ${company.ticker}`);
        }
        
        // Supply chain intelligence
        try {
          const supplyChainData = await this.supplyChainIntel.analyzeSupplyChain(company.ticker);
          if (supplyChainData) {
            dataSources.push({
              type: 'Supply Chain Intelligence',
              data: supplyChainData,
              confidence: 0.85,
              priority: 3
            });
          }
        } catch (error) {
          console.log(`⚠️ No supply chain data for ${company.ticker}`);
        }
      }
      
      // Website data (available for all tiers)
      try {
        const websiteData = await this.enhancedExpansion.extractWebsiteData(company.ticker);
        if (websiteData) {
          dataSources.push({
            type: 'Website Analysis',
            data: websiteData,
            confidence: 0.75,
            priority: 4
          });
        }
      } catch (error) {
        console.log(`⚠️ No website data for ${company.ticker}`);
      }
      
    } catch (error) {
      console.error(`Error collecting data sources for ${company.ticker}:`, error);
    }
    
    return dataSources.slice(0, tierConfig.maxSources);
  }

  /**
   * Extract geographic intelligence using advanced NLP
   */
  private async extractGeographicIntelligence(
    company: NASDAQCompany,
    dataSources: any[],
    tierConfig: ProcessingTier
  ): Promise<GeographicSegment[]> {
    const segments: GeographicSegment[] = [];
    
    for (const source of dataSources) {
      try {
        // Use advanced NLP for context-aware extraction
        const extractedSegments = await this.nlpEngine.extractGeographicSegments(
          source.data,
          {
            company: company.ticker,
            sector: company.sector,
            confidenceThreshold: tierConfig.qualityThreshold,
            maxSegments: 10
          }
        );
        
        // Add source information and confidence weighting
        extractedSegments.forEach(segment => {
          segments.push({
            ...segment,
            source: source.type,
            confidence: segment.confidence * source.confidence
          });
        });
        
      } catch (error) {
        console.error(`Error extracting from ${source.type} for ${company.ticker}:`, error);
      }
    }
    
    // Merge and normalize segments
    return this.mergeAndNormalizeSegments(segments, tierConfig);
  }

  /**
   * Merge overlapping segments and normalize percentages
   */
  private mergeAndNormalizeSegments(
    segments: GeographicSegment[],
    tierConfig: ProcessingTier
  ): GeographicSegment[] {
    const merged = new Map<string, GeographicSegment>();
    
    // Merge segments by geography
    segments.forEach(segment => {
      const key = segment.geography.toLowerCase();
      
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        existing.percentage = (existing.percentage + segment.percentage) / 2;
        existing.confidence = Math.max(existing.confidence, segment.confidence);
      } else {
        merged.set(key, { ...segment });
      }
    });
    
    const mergedSegments = Array.from(merged.values());
    
    // Normalize percentages to sum to 100%
    const total = mergedSegments.reduce((sum, seg) => sum + seg.percentage, 0);
    if (total > 0) {
      mergedSegments.forEach(segment => {
        segment.percentage = (segment.percentage / total) * 100;
      });
    }
    
    // Sort by percentage and return top segments
    return mergedSegments
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // Limit to top 8 segments
  }

  /**
   * Assess data quality and assign confidence scores
   */
  private assessDataQuality(
    segments: GeographicSegment[],
    dataSources: any[],
    tierConfig: ProcessingTier
  ): { confidence: number; grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' } {
    let confidence: number;
    
    // Base confidence from number of sources
    const sourceScore = Math.min(dataSources.length / tierConfig.maxSources, 1.0) * 0.4;
    
    // Segment quality score
    const avgSegmentConfidence = segments.length > 0
      ? segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length
      : 0;
    const segmentScore = avgSegmentConfidence * 0.4;
    
    // Coverage completeness score
    const totalCoverage = segments.reduce((sum, seg) => sum + seg.percentage, 0);
    const coverageScore = Math.min(totalCoverage / 100, 1.0) * 0.2;
    
    confidence = sourceScore + segmentScore + coverageScore;
    
    // Assign grade based on confidence
    let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
    if (confidence >= 0.95) grade = 'A+';
    else if (confidence >= 0.90) grade = 'A';
    else if (confidence >= 0.85) grade = 'B+';
    else if (confidence >= 0.80) grade = 'B';
    else if (confidence >= 0.75) grade = 'C+';
    else if (confidence >= 0.70) grade = 'C';
    else grade = 'D';
    
    return { confidence, grade };
  }

  /**
   * Get NASDAQ companies by tier
   */
  getCompaniesByTier(tier: string): NASDAQCompany[] {
    return this.NASDAQ_COMPANIES.filter(company => company.tier === tier);
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalCompanies: number;
    tierDistribution: Record<string, number>;
    expectedProcessingTime: number;
  } {
    const tierDistribution: Record<string, number> = {};
    let expectedTime = 0;
    
    this.NASDAQ_COMPANIES.forEach(company => {
      tierDistribution[company.tier] = (tierDistribution[company.tier] || 0) + 1;
      expectedTime += this.PROCESSING_TIERS[company.tier].processingTime;
    });
    
    return {
      totalCompanies: this.NASDAQ_COMPANIES.length,
      tierDistribution,
      expectedProcessingTime: expectedTime
    };
  }
}

// Export singleton instance
export const nasdaqProcessor = new NASDAQProcessor();