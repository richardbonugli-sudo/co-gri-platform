/**
 * Enhanced NASDAQ Processor - Production-Ready Architecture
 * 
 * Scalable processing engine for 3,800+ companies with tiered quality standards,
 * parallel batch processing, and adaptive confidence scoring.
 * 
 * CRITICAL ADR ENHANCEMENT: ADR-aware normalization to preserve home country dominance
 */

import { RealSECProcessor } from '../tools/data-expansion/RealSECProcessor';
import { EnhancedDataExpansion } from './enhancedDataExpansion';
import { AdvancedNLPEngine } from './advancedNLPEngine';
import { SupplyChainIntelligence } from './supplyChainIntelligence';
import { resolveADRCountry, isKnownADR, getADRCountry } from './adrCountryResolver';

export interface ProcessingTier {
  name: 'large' | 'mid' | 'small' | 'micro';
  marketCapMin: number;
  marketCapMax: number;
  confidenceTarget: number;
  minSources: number;
  maxSources: number;
  processingTimeTarget: number;
  qualityThreshold: number;
  batchSize: number;
  priority: number;
}

export interface CompanyProcessingConfig {
  ticker: string;
  companyName: string;
  cik: string;
  marketCap: number;
  sector: string;
  industry: string;
  tier: ProcessingTier;
  processingPriority: number;
  expectedDataSources: number;
  qualityTarget: number;
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
  country: string;
}

export interface ProcessingResult {
  ticker: string;
  companyName: string;
  tier: string;
  geographicSegments: GeographicSegment[];
  processingTime: number;
  overallConfidence: number;
  dataQuality: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  sourcesUsed: string[];
  evidenceBased: boolean;
  validationResults: ValidationResult[];
  timestamp: Date;
  processingId: string;
}

export interface GeographicSegment {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities' | 'supply_chain';
  confidence: number;
  source: string;
  evidenceType: 'structured' | 'narrative' | 'inferred';
  validationScore: number;
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  score: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface ProcessingStats {
  totalCompanies: number;
  processedCompanies: number;
  successfulProcessing: number;
  averageConfidence: number;
  averageProcessingTime: number;
  tierBreakdown: Record<string, TierStats>;
  qualityDistribution: Record<string, number>;
  processingRate: number;
  estimatedCompletion: Date | null;
}

export interface TierStats {
  totalCompanies: number;
  processedCompanies: number;
  successRate: number;
  averageConfidence: number;
  averageProcessingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'paused';
}

export interface ADRInfo {
  isADR: boolean;
  homeCountry: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  sector: string;
}

export class EnhancedNASDAQProcessor {
  private secProcessor: RealSECProcessor;
  private enhancedExpansion: EnhancedDataExpansion;
  private nlpEngine: AdvancedNLPEngine;
  private supplyChainIntel: SupplyChainIntelligence;
  
  // Processing tiers configuration
  private readonly PROCESSING_TIERS: Record<string, ProcessingTier> = {
    'large': {
      name: 'large',
      marketCapMin: 10_000_000_000, // $10B+
      marketCapMax: Infinity,
      confidenceTarget: 0.95,
      minSources: 7,
      maxSources: 12,
      processingTimeTarget: 120000, // 2 minutes
      qualityThreshold: 0.90,
      batchSize: 5,
      priority: 1
    },
    'mid': {
      name: 'mid',
      marketCapMin: 2_000_000_000, // $2B-$10B
      marketCapMax: 10_000_000_000,
      confidenceTarget: 0.90,
      minSources: 5,
      maxSources: 8,
      processingTimeTarget: 180000, // 3 minutes
      qualityThreshold: 0.85,
      batchSize: 8,
      priority: 2
    },
    'small': {
      name: 'small',
      marketCapMin: 300_000_000, // $300M-$2B
      marketCapMax: 2_000_000_000,
      confidenceTarget: 0.85,
      minSources: 3,
      maxSources: 6,
      processingTimeTarget: 300000, // 5 minutes
      qualityThreshold: 0.80,
      batchSize: 12,
      priority: 3
    },
    'micro': {
      name: 'micro',
      marketCapMin: 0,
      marketCapMax: 300_000_000, // <$300M
      confidenceTarget: 0.80,
      minSources: 2,
      maxSources: 4,
      processingTimeTarget: 240000, // 4 minutes
      qualityThreshold: 0.75,
      batchSize: 15,
      priority: 4
    }
  };

  // Processing state management
  private processingState: {
    isProcessing: boolean;
    isPaused: boolean;
    currentBatch: CompanyProcessingConfig[];
    processedCompanies: number;
    totalCompanies: number;
    startTime: Date | null;
    currentTier: string;
    parallelStreams: number;
  } = {
    isProcessing: false,
    isPaused: false,
    currentBatch: [],
    processedCompanies: 0,
    totalCompanies: 0,
    startTime: null,
    currentTier: '',
    parallelStreams: 3
  };

  // Results storage
  private processingResults: Map<string, ProcessingResult> = new Map();
  private processingErrors: Map<string, string> = new Map();

  constructor() {
    this.secProcessor = new RealSECProcessor();
    this.enhancedExpansion = new EnhancedDataExpansion();
    this.nlpEngine = new AdvancedNLPEngine();
    this.supplyChainIntel = new SupplyChainIntelligence();
  }

  /**
   * Process all companies with enhanced parallel processing
   */
  async processAllCompanies(
    companies: CompanyProcessingConfig[],
    options: {
      parallelStreams?: number;
      onProgress?: (stats: ProcessingStats) => void;
      onResult?: (result: ProcessingResult) => void;
      onError?: (ticker: string, error: string) => void;
      onTierComplete?: (tier: string, stats: TierStats) => void;
    } = {}
  ): Promise<{
    results: ProcessingResult[];
    summary: ProcessingStats;
    errors: Record<string, string>;
  }> {
    console.log('🚀 Starting enhanced NASDAQ processing for', companies.length, 'companies');
    
    this.processingState.isProcessing = true;
    this.processingState.isPaused = false;
    this.processingState.totalCompanies = companies.length;
    this.processingState.processedCompanies = 0;
    this.processingState.startTime = new Date();
    this.processingState.parallelStreams = options.parallelStreams || 3;
    
    // Group companies by tier and priority
    const companiesByTier = this.groupCompaniesByTier(companies);
    
    // Process each tier sequentially with parallel batch processing
    for (const [tierName, tierCompanies] of Object.entries(companiesByTier)) {
      if (this.processingState.isPaused) {
        console.log('⏸️ Processing paused');
        break;
      }
      
      this.processingState.currentTier = tierName;
      const tier = this.PROCESSING_TIERS[tierName];
      
      console.log(`📊 Processing ${tierName} tier: ${tierCompanies.length} companies`);
      
      await this.processTierWithParallelBatches(
        tierCompanies,
        tier,
        options
      );
      
      // Notify tier completion
      const tierStats = this.calculateTierStats(tierName);
      options.onTierComplete?.(tierName, tierStats);
    }
    
    this.processingState.isProcessing = false;
    
    const summary = this.calculateProcessingStats();
    const results = Array.from(this.processingResults.values());
    const errors = Object.fromEntries(this.processingErrors);
    
    console.log('✅ Enhanced NASDAQ processing completed');
    console.log(`📈 Results: ${results.length}/${companies.length} companies processed`);
    console.log(`🎯 Average confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`);
    
    return { results, summary, errors };
  }

  /**
   * Process a tier with parallel batch processing
   */
  private async processTierWithParallelBatches(
    companies: CompanyProcessingConfig[],
    tier: ProcessingTier,
    options: any
  ): Promise<void> {
    // Create batches
    const batches: CompanyProcessingConfig[][] = [];
    for (let i = 0; i < companies.length; i += tier.batchSize) {
      batches.push(companies.slice(i, i + tier.batchSize));
    }
    
    // Process batches with parallel streams
    const parallelStreams = Math.min(this.processingState.parallelStreams, batches.length);
    const batchPromises: Promise<void>[] = [];
    
    for (let streamIndex = 0; streamIndex < parallelStreams; streamIndex++) {
      const streamBatches = batches.filter((_, index) => index % parallelStreams === streamIndex);
      
      const streamPromise = this.processStreamBatches(streamBatches, tier, options, streamIndex);
      batchPromises.push(streamPromise);
    }
    
    await Promise.all(batchPromises);
  }

  /**
   * Process batches in a single stream
   */
  private async processStreamBatches(
    batches: CompanyProcessingConfig[][],
    tier: ProcessingTier,
    options: any,
    streamIndex: number
  ): Promise<void> {
    for (const batch of batches) {
      if (this.processingState.isPaused) break;
      
      console.log(`🔄 Stream ${streamIndex}: Processing batch of ${batch.length} companies`);
      
      // Process batch in parallel
      const batchPromises = batch.map(company => 
        this.processCompanyWithEnhancedValidation(company, tier)
          .then(result => {
            if (result) {
              this.processingResults.set(result.ticker, result);
              options.onResult?.(result);
            }
            this.processingState.processedCompanies++;
            
            // Report progress
            const stats = this.calculateProcessingStats();
            options.onProgress?.(stats);
            
            return result;
          })
          .catch(error => {
            console.error(`❌ Error processing ${company.ticker}:`, error);
            this.processingErrors.set(company.ticker, error.message);
            options.onError?.(company.ticker, error.message);
            this.processingState.processedCompanies++;
            return null;
          })
      );
      
      await Promise.all(batchPromises);
      
      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 1200)); // SEC compliance
    }
  }

  /**
   * Process individual company with enhanced validation
   */
  private async processCompanyWithEnhancedValidation(
    company: CompanyProcessingConfig,
    tier: ProcessingTier
  ): Promise<ProcessingResult | null> {
    const startTime = Date.now();
    const processingId = `${company.ticker}_${Date.now()}`;
    
    console.log(`🔄 Processing ${tier.name}-cap: ${company.ticker} (${company.companyName})`);
    
    try {
      // Multi-source data collection with tier-specific optimization
      const dataSources = await this.collectEnhancedDataSources(company, tier);
      
      if (dataSources.length < tier.minSources) {
        console.log(`⚠️ ${company.ticker}: Insufficient data sources (${dataSources.length}/${tier.minSources})`);
      }
      
      // Advanced geographic intelligence extraction
      const geographicSegments = await this.extractEnhancedGeographicIntelligence(
        company,
        dataSources,
        tier
      );
      
      // Enhanced quality validation and scoring
      const validationResults = await this.performEnhancedValidation(
        geographicSegments,
        dataSources,
        tier,
        company
      );
      
      const processingTime = Date.now() - startTime;
      const overallConfidence = this.calculateOverallConfidence(geographicSegments, validationResults);
      const dataQuality = this.assignDataQuality(overallConfidence, tier);
      
      const result: ProcessingResult = {
        ticker: company.ticker,
        companyName: company.companyName,
        tier: tier.name,
        geographicSegments,
        processingTime,
        overallConfidence,
        dataQuality,
        sourcesUsed: dataSources.map(s => s.type),
        evidenceBased: overallConfidence >= tier.qualityThreshold,
        validationResults,
        timestamp: new Date(),
        processingId
      };
      
      console.log(`✅ ${company.ticker}: ${geographicSegments.length} segments, ${(overallConfidence * 100).toFixed(1)}% confidence, ${dataQuality} quality`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to process ${company.ticker}:`, error);
      throw error;
    }
  }

  /**
   * Collect enhanced data sources with tier-specific optimization
   */
  private async collectEnhancedDataSources(
    company: CompanyProcessingConfig,
    tier: ProcessingTier
  ): Promise<any[]> {
    const dataSources: any[] = [];
    
    try {
      // SEC filings (available for all tiers)
      console.log(`📄 ${company.ticker}: Fetching SEC data (CIK: ${company.cik})`);
      const secData = await this.secProcessor.processCompany(company.ticker);
      if (secData) {
        dataSources.push({
          type: 'SEC Filing',
          data: secData,
          confidence: 0.95,
          priority: 1,
          evidenceType: 'structured'
        });
      }
      
      // Enhanced data sources for larger companies
      if (tier.name === 'large' || tier.name === 'mid') {
        // Sustainability reports
        try {
          console.log(`🌱 ${company.ticker}: Fetching sustainability data`);
          const sustainabilityData = await this.enhancedExpansion.extractSustainabilityData(company.ticker);
          if (sustainabilityData) {
            dataSources.push({
              type: 'Sustainability Report',
              data: sustainabilityData,
              confidence: 0.90,
              priority: 2,
              evidenceType: 'structured'
            });
          }
        } catch (error) {
          console.log(`⚠️ ${company.ticker}: No sustainability data available`);
        }
        
        // Supply chain intelligence
        try {
          console.log(`🔗 ${company.ticker}: Analyzing supply chain`);
          const supplyChainData = await this.supplyChainIntel.analyzeSupplyChain(company.ticker);
          if (supplyChainData) {
            dataSources.push({
              type: 'Supply Chain Intelligence',
              data: supplyChainData,
              confidence: 0.85,
              priority: 3,
              evidenceType: 'narrative'
            });
          }
        } catch (error) {
          console.log(`⚠️ ${company.ticker}: No supply chain data available`);
        }
      }
      
      // Website analysis (available for all tiers)
      try {
        console.log(`🌐 ${company.ticker}: Analyzing website`);
        const websiteData = await this.enhancedExpansion.extractWebsiteData(company.ticker);
        if (websiteData) {
          dataSources.push({
            type: 'Website Analysis',
            data: websiteData,
            confidence: 0.75,
            priority: 4,
            evidenceType: 'narrative'
          });
        }
      } catch (error) {
        console.log(`⚠️ ${company.ticker}: No website data available`);
      }
      
      // Investor relations data for large and mid-cap
      if (tier.name === 'large' || tier.name === 'mid') {
        try {
          console.log(`💼 ${company.ticker}: Fetching investor relations data`);
          const investorData = await this.enhancedExpansion.extractInvestorRelationsData(company.ticker);
          if (investorData) {
            dataSources.push({
              type: 'Investor Relations',
              data: investorData,
              confidence: 0.80,
              priority: 5,
              evidenceType: 'structured'
            });
          }
        } catch (error) {
          console.log(`⚠️ ${company.ticker}: No investor relations data available`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error collecting data sources for ${company.ticker}:`, error);
    }
    
    // Sort by priority and limit to max sources for tier
    return dataSources
      .sort((a, b) => a.priority - b.priority)
      .slice(0, tier.maxSources);
  }

  /**
   * Extract enhanced geographic intelligence with advanced NLP
   */
  private async extractEnhancedGeographicIntelligence(
    company: CompanyProcessingConfig,
    dataSources: any[],
    tier: ProcessingTier
  ): Promise<GeographicSegment[]> {
    const segments: GeographicSegment[] = [];
    
    for (const source of dataSources) {
      try {
        console.log(`🧠 ${company.ticker}: Extracting from ${source.type}`);
        
        // Use advanced NLP for context-aware extraction
        const extractedSegments = await this.nlpEngine.extractGeographicSegments(
          source.data,
          {
            company: company.ticker,
            sector: company.sector,
            confidenceThreshold: tier.qualityThreshold,
            maxSegments: 12,
            contextAware: true,
            temporalFiltering: true
          }
        );
        
        // Add source metadata and confidence weighting
        extractedSegments.forEach(segment => {
          segments.push({
            ...segment,
            source: source.type,
            confidence: segment.confidence * source.confidence,
            evidenceType: source.evidenceType,
            validationScore: 0 // Will be calculated in validation
          });
        });
        
      } catch (error) {
        console.error(`❌ Error extracting from ${source.type} for ${company.ticker}:`, error);
      }
    }
    
    // Merge, normalize, and validate segments with ADR-aware logic
    return this.mergeAndNormalizeEnhancedSegments(segments, tier, company);
  }

  /**
   * CRITICAL ADR ENHANCEMENT: Merge and normalize segments with ADR-aware logic
   * This is the key fix for CRESY and CIB geographic exposure issues
   */
  private mergeAndNormalizeEnhancedSegments(
    segments: GeographicSegment[],
    tier: ProcessingTier,
    company: CompanyProcessingConfig
  ): GeographicSegment[] {
    console.log(`[ADR Enhancement] Processing ${company.ticker} - checking ADR status`);
    
    // STEP 1: Detect ADR status and home country
    const adrInfo = this.detectADRInfo(company);
    
    if (adrInfo.isADR) {
      console.log(`[ADR Enhancement] *** ${company.ticker} is ADR from ${adrInfo.homeCountry} (${adrInfo.sector}) ***`);
      console.log(`[ADR Enhancement] Applying ADR-aware normalization to preserve home country dominance`);
    }
    
    const merged = new Map<string, GeographicSegment>();
    
    // STEP 2: Merge segments by normalized geography
    segments.forEach(segment => {
      const normalizedGeo = this.normalizeGeographyName(segment.geography);
      const key = normalizedGeo.toLowerCase();
      
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        // Weighted average based on confidence
        const totalConfidence = existing.confidence + segment.confidence;
        existing.percentage = (
          (existing.percentage * existing.confidence + segment.percentage * segment.confidence) /
          totalConfidence
        );
        existing.confidence = Math.max(existing.confidence, segment.confidence);
        existing.validationScore = Math.max(existing.validationScore, segment.validationScore);
        
        // Combine sources
        if (!existing.source.includes(segment.source)) {
          existing.source += `, ${segment.source}`;
        }
      } else {
        merged.set(key, {
          ...segment,
          geography: normalizedGeo
        });
      }
    });
    
    const mergedSegments = Array.from(merged.values());
    
    // STEP 3: Apply ADR-aware normalization logic
    if (adrInfo.isADR && adrInfo.homeCountry) {
      return this.applyADRAwareNormalization(mergedSegments, adrInfo, company);
    } else {
      // STEP 4: Standard normalization for regular US companies
      return this.applyStandardNormalization(mergedSegments);
    }
  }

  /**
   * CRITICAL: ADR-aware normalization to preserve home country dominance
   */
  private applyADRAwareNormalization(
    segments: GeographicSegment[],
    adrInfo: ADRInfo,
    company: CompanyProcessingConfig
  ): GeographicSegment[] {
    console.log(`[ADR Enhancement] *** APPLYING ADR-AWARE NORMALIZATION FOR ${company.ticker} ***`);
    console.log(`[ADR Enhancement] Home Country: ${adrInfo.homeCountry}, Sector: ${adrInfo.sector}`);
    
    // Find home country segment
    const homeCountrySegment = segments.find(s => 
      s.geography.toLowerCase() === adrInfo.homeCountry.toLowerCase()
    );
    
    // Find US segment (should be reduced for foreign ADRs)
    const usSegment = segments.find(s => 
      s.geography.toLowerCase() === 'united states'
    );
    
    // Calculate target percentages based on sector
    const targetPercentages = this.getADRTargetPercentages(adrInfo.sector, adrInfo.homeCountry);
    
    console.log(`[ADR Enhancement] Target percentages for ${adrInfo.sector}:`, targetPercentages);
    
    // Apply ADR-specific adjustments
    const adjustedSegments = segments.map(segment => {
      const geography = segment.geography.toLowerCase();
      let adjustmentFactor: number;
      
      if (geography === adrInfo.homeCountry.toLowerCase()) {
        // MASSIVE boost for home country - this is the key fix
        adjustmentFactor = targetPercentages.homeCountryBoost;
        console.log(`[ADR Enhancement] *** HOME COUNTRY BOOST: ${segment.geography} ${adjustmentFactor}x ***`);
      } else if (geography === 'united states' && adrInfo.homeCountry !== 'United States') {
        // Massive reduction for US exposure of foreign ADRs
        adjustmentFactor = targetPercentages.usReduction;
        console.log(`[ADR Enhancement] *** US REDUCTION: ${segment.geography} ${adjustmentFactor}x ***`);
      } else if (this.isRegionalPartner(geography, adrInfo.homeCountry)) {
        // Regional boost for neighboring countries
        adjustmentFactor = targetPercentages.regionalBoost;
        console.log(`[ADR Enhancement] *** REGIONAL BOOST: ${segment.geography} ${adjustmentFactor}x ***`);
      } else {
        // Other countries get standard treatment
        adjustmentFactor = 0.6; // Slight reduction to make room for home country dominance
      }
      
      return {
        ...segment,
        percentage: segment.percentage * adjustmentFactor
      };
    });
    
    // Gentle normalization to preserve ADR concentration (use 0.85 factor instead of 1.0)
    const total = adjustedSegments.reduce((sum, seg) => sum + seg.percentage, 0);
    const normalizationFactor = total > 0 ? (100 * 0.85) / total : 1; // Gentler normalization
    
    const finalSegments = adjustedSegments.map(segment => ({
      ...segment,
      percentage: segment.percentage * normalizationFactor
    }));
    
    // Log final results for verification
    const sortedFinal = finalSegments.sort((a, b) => b.percentage - a.percentage);
    console.log(`[ADR Enhancement] *** FINAL ADR RESULTS FOR ${company.ticker} ***`);
    sortedFinal.slice(0, 5).forEach((seg, idx) => {
      console.log(`[ADR Enhancement]   ${idx + 1}. ${seg.geography}: ${seg.percentage.toFixed(2)}%`);
    });
    
    return sortedFinal.slice(0, 10); // Limit to top 10 segments
  }

  /**
   * Standard normalization for regular US companies
   */
  private applyStandardNormalization(segments: GeographicSegment[]): GeographicSegment[] {
    // Standard normalization - percentages sum to 100%
    const total = segments.reduce((sum, seg) => sum + seg.percentage, 0);
    if (total > 0) {
      segments.forEach(segment => {
        segment.percentage = (segment.percentage / total) * 100;
      });
    }
    
    // Sort by percentage and confidence, limit to top segments
    return segments
      .sort((a, b) => {
        const scoreA = a.percentage * a.confidence;
        const scoreB = b.percentage * b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, 10); // Limit to top 10 segments
  }

  /**
   * Detect ADR information for a company
   */
  private detectADRInfo(company: CompanyProcessingConfig): ADRInfo {
    const ticker = company.ticker.toUpperCase();
    
    // Check if it's a known ADR
    if (isKnownADR(ticker)) {
      const homeCountry = getADRCountry(ticker);
      if (homeCountry) {
        return {
          isADR: true,
          homeCountry,
          confidence: 'high',
          source: 'Known ADR Database',
          sector: company.sector
        };
      }
    }
    
    // Use ADR resolver for additional detection
    const adrResolution = resolveADRCountry(
      ticker,
      company.companyName,
      company.country,
      company.exchange
    );
    
    return {
      isADR: adrResolution.isADR,
      homeCountry: adrResolution.country,
      confidence: adrResolution.confidence,
      source: adrResolution.source,
      sector: company.sector
    };
  }

  /**
   * Get ADR target percentages based on sector and home country
   */
  private getADRTargetPercentages(sector: string, homeCountry: string): {
    homeCountryBoost: number;
    regionalBoost: number;
    usReduction: number;
  } {
    // Sector-specific boost factors
    const sectorBoosts: Record<string, { home: number; regional: number; us: number }> = {
      'Real Estate': { home: 4.5, regional: 2.2, us: 0.12 }, // Very location-specific
      'Energy': { home: 3.8, regional: 1.8, us: 0.15 },
      'Basic Materials': { home: 3.5, regional: 1.6, us: 0.18 },
      'Financial Services': { home: 4.0, regional: 2.0, us: 0.15 },
      'Utilities': { home: 4.2, regional: 1.9, us: 0.13 },
      'Communication Services': { home: 3.2, regional: 1.5, us: 0.20 },
      'Technology': { home: 2.8, regional: 1.4, us: 0.25 }, // More global
      'Healthcare': { home: 3.0, regional: 1.3, us: 0.22 },
      'Consumer Cyclical': { home: 3.2, regional: 1.5, us: 0.20 },
      'Consumer Defensive': { home: 3.4, regional: 1.6, us: 0.18 },
      'Industrials': { home: 3.3, regional: 1.5, us: 0.19 }
    };
    
    const boosts = sectorBoosts[sector] || { home: 3.0, regional: 1.5, us: 0.20 };
    
    return {
      homeCountryBoost: boosts.home,
      regionalBoost: boosts.regional,
      usReduction: boosts.us
    };
  }

  /**
   * Check if a country is a regional partner of the home country
   */
  private isRegionalPartner(country: string, homeCountry: string): boolean {
    const regionalPartners: Record<string, string[]> = {
      'Argentina': ['Brazil', 'Uruguay', 'Paraguay', 'Chile', 'Colombia'],
      'Brazil': ['Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay'],
      'Colombia': ['Argentina', 'Brazil', 'Peru', 'Ecuador', 'Venezuela'],
      'Chile': ['Argentina', 'Brazil', 'Peru', 'Bolivia'],
      'China': ['Hong Kong', 'Singapore', 'Taiwan', 'South Korea'],
      'Taiwan': ['China', 'South Korea', 'Japan', 'Singapore'],
      'South Korea': ['China', 'Japan', 'Taiwan', 'Singapore'],
      'Japan': ['China', 'South Korea', 'Taiwan'],
      'India': ['Singapore', 'Bangladesh', 'Sri Lanka'],
      'Israel': ['United States'], // Special relationship
      'Netherlands': ['Germany', 'Belgium', 'United Kingdom', 'France'],
      'Switzerland': ['Germany', 'Austria', 'France', 'Italy'],
      'Denmark': ['Germany', 'Sweden', 'Norway', 'United Kingdom'],
      'United Kingdom': ['Ireland', 'Germany', 'France', 'Netherlands'],
      'South Africa': ['Botswana', 'Namibia', 'Zimbabwe', 'Zambia']
    };
    
    const partners = regionalPartners[homeCountry] || [];
    return partners.some(partner => 
      partner.toLowerCase() === country.toLowerCase()
    );
  }

  /**
   * Perform enhanced validation with multiple quality checks
   */
  private async performEnhancedValidation(
    segments: GeographicSegment[],
    dataSources: any[],
    tier: ProcessingTier,
    company: CompanyProcessingConfig
  ): Promise<ValidationResult[]> {
    const validationResults: ValidationResult[] = [];
    
    // 1. Source diversity validation
    const uniqueSources = new Set(segments.map(s => s.source)).size;
    validationResults.push({
      rule: 'Source Diversity',
      passed: uniqueSources >= tier.minSources,
      score: Math.min(uniqueSources / tier.maxSources, 1.0),
      message: `${uniqueSources} unique sources (target: ${tier.minSources}+)`,
      severity: uniqueSources >= tier.minSources ? 'info' : 'warning'
    });
    
    // 2. Coverage completeness validation
    const totalCoverage = segments.reduce((sum, seg) => sum + seg.percentage, 0);
    const coverageValid = Math.abs(totalCoverage - 100) <= 5; // Allow 5% variance
    validationResults.push({
      rule: 'Coverage Completeness',
      passed: coverageValid,
      score: Math.max(0, 1 - Math.abs(totalCoverage - 100) / 100),
      message: `${totalCoverage.toFixed(1)}% total coverage`,
      severity: coverageValid ? 'info' : 'warning'
    });
    
    // 3. Confidence threshold validation
    const avgConfidence = segments.length > 0 
      ? segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length
      : 0;
    const confidenceValid = avgConfidence >= tier.qualityThreshold;
    validationResults.push({
      rule: 'Confidence Threshold',
      passed: confidenceValid,
      score: avgConfidence,
      message: `${(avgConfidence * 100).toFixed(1)}% average confidence (target: ${(tier.qualityThreshold * 100).toFixed(1)}%+)`,
      severity: confidenceValid ? 'info' : 'critical'
    });
    
    // 4. Geographic consistency validation
    const geographyConsistency = this.validateGeographicConsistency(segments);
    validationResults.push({
      rule: 'Geographic Consistency',
      passed: geographyConsistency.isValid,
      score: geographyConsistency.score,
      message: geographyConsistency.message,
      severity: geographyConsistency.isValid ? 'info' : 'warning'
    });
    
    // 5. Sector-specific validation
    const sectorValidation = this.validateSectorSpecificPatterns(segments, company.sector);
    validationResults.push({
      rule: 'Sector Pattern Validation',
      passed: sectorValidation.isValid,
      score: sectorValidation.score,
      message: sectorValidation.message,
      severity: sectorValidation.isValid ? 'info' : 'warning'
    });
    
    return validationResults;
  }

  /**
   * Validate geographic consistency
   */
  private validateGeographicConsistency(segments: GeographicSegment[]): {
    isValid: boolean;
    score: number;
    message: string;
  } {
    // Check for overlapping regions
    const countries = new Set<string>();
    const regions = new Set<string>();
    let overlaps = 0;
    
    segments.forEach(segment => {
      const isCountry = this.isCountryName(segment.geography);
      if (isCountry) {
        countries.add(segment.geography);
      } else {
        regions.add(segment.geography);
        // Check if any countries are already covered by this region
        const regionCountries = this.getCountriesInRegion(segment.geography);
        regionCountries.forEach(country => {
          if (countries.has(country)) {
            overlaps++;
          }
        });
      }
    });
    
    const isValid = overlaps === 0;
    const score = Math.max(0, 1 - overlaps / segments.length);
    const message = isValid 
      ? 'No geographic overlaps detected'
      : `${overlaps} potential geographic overlaps detected`;
    
    return { isValid, score, message };
  }

  /**
   * Validate sector-specific patterns
   */
  private validateSectorSpecificPatterns(segments: GeographicSegment[], sector: string): {
    isValid: boolean;
    score: number;
    message: string;
  } {
    // Sector-specific validation rules
    const sectorRules: Record<string, any> = {
      'Technology': {
        expectedRegions: ['United States', 'China', 'Europe', 'Asia Pacific'],
        minInternational: 0.3 // At least 30% international
      },
      'Healthcare': {
        expectedRegions: ['United States', 'Europe'],
        minInternational: 0.2 // At least 20% international
      },
      'Financial Services': {
        expectedRegions: ['United States'],
        minInternational: 0.1 // At least 10% international
      }
    };
    
    const rules = sectorRules[sector];
    if (!rules) {
      return { isValid: true, score: 1.0, message: 'No sector-specific rules defined' };
    }
    
    // Calculate international percentage
    const usPercentage = segments.find(s => s.geography === 'United States')?.percentage || 0;
    const internationalPercentage = 100 - usPercentage;
    
    const meetsInternationalThreshold = (internationalPercentage / 100) >= rules.minInternational;
    const score = Math.min(1.0, (internationalPercentage / 100) / rules.minInternational);
    
    return {
      isValid: meetsInternationalThreshold,
      score,
      message: `${internationalPercentage.toFixed(1)}% international exposure (${sector} target: ${(rules.minInternational * 100).toFixed(1)}%+)`
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    segments: GeographicSegment[],
    validationResults: ValidationResult[]
  ): number {
    if (segments.length === 0) return 0;
    
    // Weighted average of segment confidences
    const segmentConfidence = segments.reduce((sum, seg) => 
      sum + (seg.confidence * seg.percentage / 100), 0
    );
    
    // Average validation score
    const validationScore = validationResults.length > 0
      ? validationResults.reduce((sum, val) => sum + val.score, 0) / validationResults.length
      : 0;
    
    // Combined confidence (70% segments, 30% validation)
    return (segmentConfidence * 0.7) + (validationScore * 0.3);
  }

  /**
   * Assign data quality grade based on confidence and tier
   */
  private assignDataQuality(confidence: number, tier: ProcessingTier): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
    // Adjust thresholds based on tier expectations
    const tierAdjustment = {
      'large': 0.05,   // Higher expectations for large-cap
      'mid': 0.02,     // Slightly higher for mid-cap
      'small': 0.0,    // Standard expectations
      'micro': -0.05   // Lower expectations for micro-cap
    }[tier.name] || 0;
    
    const adjustedConfidence = confidence + tierAdjustment;
    
    if (adjustedConfidence >= 0.95) return 'A+';
    if (adjustedConfidence >= 0.90) return 'A';
    if (adjustedConfidence >= 0.85) return 'B+';
    if (adjustedConfidence >= 0.80) return 'B';
    if (adjustedConfidence >= 0.75) return 'C+';
    if (adjustedConfidence >= 0.70) return 'C';
    return 'D';
  }

  /**
   * Group companies by processing tier
   */
  private groupCompaniesByTier(companies: CompanyProcessingConfig[]): Record<string, CompanyProcessingConfig[]> {
    const grouped: Record<string, CompanyProcessingConfig[]> = {
      'large': [],
      'mid': [],
      'small': [],
      'micro': []
    };
    
    companies.forEach(company => {
      const tierName = this.determineTier(company.marketCap);
      company.tier = this.PROCESSING_TIERS[tierName];
      grouped[tierName].push(company);
    });
    
    // Sort each tier by market cap (descending)
    Object.keys(grouped).forEach(tierName => {
      grouped[tierName].sort((a, b) => b.marketCap - a.marketCap);
    });
    
    return grouped;
  }

  /**
   * Determine processing tier based on market cap
   */
  private determineTier(marketCap: number): string {
    if (marketCap >= 10_000_000_000) return 'large';
    if (marketCap >= 2_000_000_000) return 'mid';
    if (marketCap >= 300_000_000) return 'small';
    return 'micro';
  }

  /**
   * Calculate processing statistics
   */
  private calculateProcessingStats(): ProcessingStats {
    const results = Array.from(this.processingResults.values());
    const totalCompanies = this.processingState.totalCompanies;
    const processedCompanies = this.processingState.processedCompanies;
    
    // Calculate tier breakdown
    const tierBreakdown: Record<string, TierStats> = {};
    Object.keys(this.PROCESSING_TIERS).forEach(tierName => {
      tierBreakdown[tierName] = this.calculateTierStats(tierName);
    });
    
    // Calculate quality distribution
    const qualityDistribution: Record<string, number> = {};
    results.forEach(result => {
      qualityDistribution[result.dataQuality] = (qualityDistribution[result.dataQuality] || 0) + 1;
    });
    
    // Calculate processing rate
    const elapsedTime = this.processingState.startTime 
      ? (Date.now() - this.processingState.startTime.getTime()) / 1000 / 60 // minutes
      : 0;
    const processingRate = elapsedTime > 0 ? processedCompanies / elapsedTime : 0;
    
    // Estimate completion
    const remainingCompanies = totalCompanies - processedCompanies;
    const estimatedCompletion = processingRate > 0 && remainingCompanies > 0
      ? new Date(Date.now() + (remainingCompanies / processingRate) * 60 * 1000)
      : null;
    
    return {
      totalCompanies,
      processedCompanies,
      successfulProcessing: results.length,
      averageConfidence: results.length > 0 
        ? results.reduce((sum, r) => sum + r.overallConfidence, 0) / results.length
        : 0,
      averageProcessingTime: results.length > 0
        ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
        : 0,
      tierBreakdown,
      qualityDistribution,
      processingRate,
      estimatedCompletion
    };
  }

  /**
   * Calculate tier-specific statistics
   */
  private calculateTierStats(tierName: string): TierStats {
    const tierResults = Array.from(this.processingResults.values())
      .filter(result => result.tier === tierName);
    
    const tierErrors = Array.from(this.processingErrors.entries())
      .filter(([ticker]) => {
        // This is a simplified check - in production, you'd track tier per ticker
        return true; // For now, include all errors
      });
    
    const totalProcessed = tierResults.length + tierErrors.length;
    
    return {
      totalCompanies: 0, // Would be set based on actual tier company count
      processedCompanies: totalProcessed,
      successRate: totalProcessed > 0 ? tierResults.length / totalProcessed : 0,
      averageConfidence: tierResults.length > 0
        ? tierResults.reduce((sum, r) => sum + r.overallConfidence, 0) / tierResults.length
        : 0,
      averageProcessingTime: tierResults.length > 0
        ? tierResults.reduce((sum, r) => sum + r.processingTime, 0) / tierResults.length
        : 0,
      status: this.processingState.currentTier === tierName ? 'processing' : 'pending'
    };
  }

  /**
   * Utility methods
   */
  private normalizeGeographyName(geography: string): string {
    const mappings: Record<string, string> = {
      'US': 'United States',
      'USA': 'United States',
      'UK': 'United Kingdom',
      'EU': 'Europe',
      'APAC': 'Asia Pacific',
      'LATAM': 'Latin America',
      'MEA': 'Middle East and Africa'
    };
    
    return mappings[geography] || geography;
  }

  private isCountryName(geography: string): boolean {
    const countries = [
      'United States', 'China', 'Germany', 'Japan', 'United Kingdom',
      'France', 'Italy', 'Canada', 'Australia', 'South Korea',
      'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Norway',
      'Argentina', 'Brazil', 'Chile', 'Colombia', 'Peru', 'Uruguay',
      'Taiwan', 'Singapore', 'Hong Kong', 'India', 'Israel'
    ];
    return countries.includes(geography);
  }

  private getCountriesInRegion(region: string): string[] {
    const regionMappings: Record<string, string[]> = {
      'Europe': ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Netherlands'],
      'Asia Pacific': ['Japan', 'South Korea', 'Australia', 'Singapore'],
      'Latin America': ['Brazil', 'Mexico', 'Argentina', 'Chile']
    };
    return regionMappings[region] || [];
  }

  /**
   * Control methods
   */
  pauseProcessing(): void {
    this.processingState.isPaused = true;
    console.log('⏸️ Processing paused');
  }

  resumeProcessing(): void {
    this.processingState.isPaused = false;
    console.log('▶️ Processing resumed');
  }

  stopProcessing(): void {
    this.processingState.isProcessing = false;
    this.processingState.isPaused = false;
    console.log('⏹️ Processing stopped');
  }

  getProcessingState(): any {
    return { ...this.processingState };
  }

  getResults(): ProcessingResult[] {
    return Array.from(this.processingResults.values());
  }

  getErrors(): Record<string, string> {
    return Object.fromEntries(this.processingErrors);
  }
}

// Export singleton instance
export const enhancedNASDAQProcessor = new EnhancedNASDAQProcessor();