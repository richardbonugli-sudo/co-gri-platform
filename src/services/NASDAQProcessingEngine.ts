/**
 * NASDAQ Processing Engine - Phase 2 Implementation
 * 
 * Production processing engine for all 3,300 NASDAQ companies with
 * tiered processing, real-time monitoring, and quality assurance.
 */

import { EnhancedNASDAQProcessor, ProcessingResult, ProcessingStats } from './EnhancedNASDAQProcessor';
import { enhancedNASDAQDatabase, createCompanyFromNASDAQData } from '../data/enhancedNASDAQDatabase';
import { COMPLETE_NASDAQ_LIST, getCompaniesByTier, getNASDAQProcessingStats } from '../data/fullNASDAQCompanyList';

export interface ProcessingPhase {
  name: string;
  tier: 'large' | 'mid' | 'small' | 'micro';
  companies: any[];
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'failed';
  startTime?: Date;
  endTime?: Date;
  processedCount: number;
  successCount: number;
  errorCount: number;
  averageConfidence: number;
  processingRate: number;
}

export interface ProcessingSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalCompanies: number;
  processedCompanies: number;
  successfulCompanies: number;
  phases: ProcessingPhase[];
  overallStats: ProcessingStats;
  status: 'initializing' | 'processing' | 'completed' | 'paused' | 'failed';
}

export interface ProcessingConfiguration {
  parallelStreams: number;
  batchSize: Record<string, number>;
  qualityThresholds: Record<string, number>;
  enableAdvancedNLP: boolean;
  enableSupplyChain: boolean;
  enableSustainability: boolean;
  processingMode: 'conservative' | 'balanced' | 'aggressive';
  maxRetries: number;
  rateLimitDelay: number;
}

export class NASDAQProcessingEngine {
  private processor: EnhancedNASDAQProcessor;
  private currentSession: ProcessingSession | null = null;
  private isProcessing = false;
  private isPaused = false;
  
  // Default configuration
  private config: ProcessingConfiguration = {
    parallelStreams: 3,
    batchSize: {
      large: 5,
      mid: 8,
      small: 12,
      micro: 15
    },
    qualityThresholds: {
      large: 0.95,
      mid: 0.90,
      small: 0.85,
      micro: 0.80
    },
    enableAdvancedNLP: true,
    enableSupplyChain: true,
    enableSustainability: true,
    processingMode: 'balanced',
    maxRetries: 3,
    rateLimitDelay: 1200 // SEC compliance
  };

  // Event callbacks
  private onProgressCallback?: (session: ProcessingSession) => void;
  private onPhaseCompleteCallback?: (phase: ProcessingPhase) => void;
  private onResultCallback?: (result: ProcessingResult) => void;
  private onErrorCallback?: (ticker: string, error: string) => void;
  private onLogCallback?: (message: string) => void;

  constructor() {
    this.processor = new EnhancedNASDAQProcessor();
  }

  /**
   * Initialize Phase 2 NASDAQ processing
   */
  async initializePhase2Processing(
    configuration?: Partial<ProcessingConfiguration>
  ): Promise<ProcessingSession> {
    this.log('🚀 Initializing Phase 2 NASDAQ Processing...');
    
    // Update configuration
    if (configuration) {
      this.config = { ...this.config, ...configuration };
    }
    
    // Load complete NASDAQ company list
    const companies = COMPLETE_NASDAQ_LIST;
    this.log(`📊 Loaded ${companies.length} NASDAQ companies for processing`);
    
    // Populate enhanced database
    await this.populateDatabase(companies);
    
    // Create processing session
    const sessionId = `nasdaq_phase2_${Date.now()}`;
    this.currentSession = {
      sessionId,
      startTime: new Date(),
      totalCompanies: companies.length,
      processedCompanies: 0,
      successfulCompanies: 0,
      phases: this.createProcessingPhases(),
      overallStats: this.initializeStats(),
      status: 'initializing'
    };
    
    this.log(`✅ Phase 2 processing session initialized: ${sessionId}`);
    this.log(`🎯 Target: ${companies.length} companies across 4 tiers`);
    
    return this.currentSession;
  }

  /**
   * Populate enhanced database with NASDAQ companies
   */
  private async populateDatabase(companies: any[]): Promise<void> {
    this.log('🗄️ Populating enhanced database...');
    
    let populatedCount = 0;
    
    for (const company of companies) {
      try {
        const enhancedCompany = createCompanyFromNASDAQData({
          ticker: company.ticker,
          companyName: company.companyName,
          cik: company.cik,
          marketCap: company.marketCap,
          sector: company.sector,
          industry: company.industry,
          exchange: company.exchange,
          country: company.country
        });
        
        enhancedNASDAQDatabase.addCompany(enhancedCompany);
        populatedCount++;
        
        if (populatedCount % 500 === 0) {
          this.log(`📝 Populated ${populatedCount}/${companies.length} companies`);
        }
      } catch (error) {
        this.log(`❌ Error populating ${company.ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    this.log(`✅ Database populated with ${populatedCount} companies`);
  }

  /**
   * Create processing phases for each tier
   */
  private createProcessingPhases(): ProcessingPhase[] {
    const phases: ProcessingPhase[] = [];
    
    const tiers: Array<'large' | 'mid' | 'small' | 'micro'> = ['large', 'mid', 'small', 'micro'];
    
    tiers.forEach(tier => {
      const companies = getCompaniesByTier(tier);
      
      phases.push({
        name: `${tier.charAt(0).toUpperCase() + tier.slice(1)}-Cap Processing`,
        tier,
        companies,
        status: 'pending',
        processedCount: 0,
        successCount: 0,
        errorCount: 0,
        averageConfidence: 0,
        processingRate: 0
      });
    });
    
    return phases;
  }

  /**
   * Initialize processing statistics
   */
  private initializeStats(): ProcessingStats {
    return {
      totalCompanies: 0,
      processedCompanies: 0,
      successfulProcessing: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      tierBreakdown: {},
      qualityDistribution: {},
      processingRate: 0,
      estimatedCompletion: null
    };
  }

  /**
   * Start Phase 2 NASDAQ processing
   */
  async startPhase2Processing(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No processing session initialized. Call initializePhase2Processing first.');
    }
    
    if (this.isProcessing) {
      throw new Error('Processing is already in progress');
    }
    
    this.isProcessing = true;
    this.isPaused = false;
    this.currentSession.status = 'processing';
    
    this.log('🚀 Starting Phase 2 NASDAQ processing...');
    this.log(`⚙️ Configuration: ${this.config.parallelStreams} streams, ${this.config.processingMode} mode`);
    
    try {
      // Process each phase sequentially
      for (const phase of this.currentSession.phases) {
        if (this.isPaused) {
          this.log('⏸️ Processing paused');
          break;
        }
        
        await this.processPhase(phase);
        
        // Update session statistics
        this.updateSessionStats();
        
        // Notify phase completion
        this.onPhaseCompleteCallback?.(phase);
        
        // Brief pause between phases
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!this.isPaused) {
        this.currentSession.status = 'completed';
        this.currentSession.endTime = new Date();
        this.log('🎉 Phase 2 NASDAQ processing completed successfully!');
      }
      
    } catch (error) {
      this.currentSession.status = 'failed';
      this.log(`❌ Phase 2 processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single phase (tier)
   */
  private async processPhase(phase: ProcessingPhase): Promise<void> {
    this.log(`📊 Starting ${phase.name}: ${phase.companies.length} companies`);
    
    phase.status = 'processing';
    phase.startTime = new Date();
    
    // Convert to processing configuration format
    const processingConfigs = phase.companies.map(company => ({
      ticker: company.ticker,
      companyName: company.companyName,
      cik: company.cik,
      marketCap: company.marketCap,
      sector: company.sector,
      industry: company.industry,
      tier: this.processor['determineTier'](company.marketCap),
      processingPriority: this.getProcessingPriority(company.marketCap),
      expectedDataSources: this.getExpectedSources(company.marketCap),
      qualityTarget: this.config.qualityThresholds[phase.tier],
      exchange: company.exchange,
      country: company.country
    }));
    
    try {
      const results = await this.processor.processAllCompanies(processingConfigs, {
        parallelStreams: this.config.parallelStreams,
        onProgress: (stats) => {
          this.updatePhaseProgress(phase, stats);
          this.updateSessionStats();
          this.onProgressCallback?.(this.currentSession!);
        },
        onResult: (result) => {
          phase.successCount++;
          this.updateCompanyInDatabase(result);
          this.onResultCallback?.(result);
          this.log(`✅ ${result.ticker}: ${result.geographicSegments.length} segments, ${(result.overallConfidence * 100).toFixed(1)}% confidence`);
        },
        onError: (ticker, error) => {
          phase.errorCount++;
          this.updateCompanyStatus(ticker, 'failed');
          this.onErrorCallback?.(ticker, error);
          this.log(`❌ ${ticker}: ${error}`);
        }
      });
      
      phase.status = 'completed';
      phase.endTime = new Date();
      
      // Calculate phase statistics
      const processingTime = phase.endTime.getTime() - phase.startTime!.getTime();
      phase.processingRate = phase.companies.length / (processingTime / 1000 / 60); // companies per minute
      
      if (results.results.length > 0) {
        phase.averageConfidence = results.results.reduce((sum, r) => sum + r.overallConfidence, 0) / results.results.length;
      }
      
      this.log(`✅ ${phase.name} completed: ${phase.successCount}/${phase.companies.length} companies processed`);
      this.log(`📈 Success rate: ${((phase.successCount / phase.companies.length) * 100).toFixed(1)}%`);
      this.log(`🎯 Average confidence: ${(phase.averageConfidence * 100).toFixed(1)}%`);
      
    } catch (error) {
      phase.status = 'failed';
      phase.endTime = new Date();
      this.log(`❌ ${phase.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Update phase progress from processing stats
   */
  private updatePhaseProgress(phase: ProcessingPhase, stats: ProcessingStats): void {
    phase.processedCount = stats.processedCompanies;
    
    if (stats.processedCompanies > 0) {
      const elapsedTime = Date.now() - phase.startTime!.getTime();
      phase.processingRate = stats.processedCompanies / (elapsedTime / 1000 / 60);
    }
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(): void {
    if (!this.currentSession) return;
    
    // Calculate totals from phases
    this.currentSession.processedCompanies = this.currentSession.phases.reduce(
      (sum, phase) => sum + phase.processedCount, 0
    );
    
    this.currentSession.successfulCompanies = this.currentSession.phases.reduce(
      (sum, phase) => sum + phase.successCount, 0
    );
    
    // Calculate overall processing rate
    const elapsedTime = Date.now() - this.currentSession.startTime.getTime();
    const overallRate = this.currentSession.processedCompanies / (elapsedTime / 1000 / 60);
    
    // Update overall stats
    this.currentSession.overallStats = {
      totalCompanies: this.currentSession.totalCompanies,
      processedCompanies: this.currentSession.processedCompanies,
      successfulProcessing: this.currentSession.successfulCompanies,
      averageConfidence: this.calculateOverallConfidence(),
      averageProcessingTime: 0, // Will be calculated from results
      tierBreakdown: this.calculateTierBreakdown(),
      qualityDistribution: {},
      processingRate: overallRate,
      estimatedCompletion: this.calculateEstimatedCompletion()
    };
  }

  /**
   * Calculate overall confidence across all phases
   */
  private calculateOverallConfidence(): number {
    const completedPhases = this.currentSession!.phases.filter(p => p.averageConfidence > 0);
    if (completedPhases.length === 0) return 0;
    
    let totalConfidence = 0;
    let totalCompanies = 0;
    
    completedPhases.forEach(phase => {
      totalConfidence += phase.averageConfidence * phase.successCount;
      totalCompanies += phase.successCount;
    });
    
    return totalCompanies > 0 ? totalConfidence / totalCompanies : 0;
  }

  /**
   * Calculate tier breakdown statistics
   */
  private calculateTierBreakdown(): Record<string, any> {
    const breakdown: Record<string, any> = {};
    
    this.currentSession!.phases.forEach(phase => {
      breakdown[phase.tier] = {
        totalCompanies: phase.companies.length,
        processedCompanies: phase.processedCount,
        successRate: phase.companies.length > 0 ? phase.successCount / phase.companies.length : 0,
        averageConfidence: phase.averageConfidence,
        averageProcessingTime: 0, // Would be calculated from actual results
        status: phase.status
      };
    });
    
    return breakdown;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(): Date | null {
    if (!this.currentSession || this.currentSession.overallStats.processingRate === 0) {
      return null;
    }
    
    const remainingCompanies = this.currentSession.totalCompanies - this.currentSession.processedCompanies;
    const estimatedMinutes = remainingCompanies / this.currentSession.overallStats.processingRate;
    
    return new Date(Date.now() + estimatedMinutes * 60 * 1000);
  }

  /**
   * Update company in database with processing results
   */
  private updateCompanyInDatabase(result: ProcessingResult): void {
    enhancedNASDAQDatabase.updateProcessingStatus(
      result.ticker,
      'completed',
      {
        dataQuality: result.dataQuality,
        geographicSegments: result.geographicSegments.reduce((acc, seg) => {
          acc[seg.geography] = {
            geography: seg.geography,
            percentage: seg.percentage,
            metricType: seg.metricType,
            confidence: seg.confidence,
            source: seg.source,
            evidenceType: seg.evidenceType,
            validationScore: seg.validationScore,
            lastUpdated: new Date().toISOString()
          };
          return acc;
        }, {} as any)
      }
    );
  }

  /**
   * Update company status in database
   */
  private updateCompanyStatus(ticker: string, status: 'pending' | 'processing' | 'completed' | 'failed'): void {
    enhancedNASDAQDatabase.updateProcessingStatus(ticker, status);
  }

  /**
   * Utility methods
   */
  private getProcessingPriority(marketCap: number): 1 | 2 | 3 | 4 {
    if (marketCap >= 10_000_000_000) return 1;
    if (marketCap >= 2_000_000_000) return 2;
    if (marketCap >= 300_000_000) return 3;
    return 4;
  }

  private getExpectedSources(marketCap: number): number {
    if (marketCap >= 10_000_000_000) return 8;
    if (marketCap >= 2_000_000_000) return 6;
    if (marketCap >= 300_000_000) return 4;
    return 3;
  }

  /**
   * Control methods
   */
  pauseProcessing(): void {
    this.isPaused = true;
    this.processor.pauseProcessing();
    if (this.currentSession) {
      this.currentSession.status = 'paused';
    }
    this.log('⏸️ Processing paused');
  }

  resumeProcessing(): void {
    this.isPaused = false;
    this.processor.resumeProcessing();
    if (this.currentSession) {
      this.currentSession.status = 'processing';
    }
    this.log('▶️ Processing resumed');
  }

  stopProcessing(): void {
    this.isProcessing = false;
    this.isPaused = false;
    this.processor.stopProcessing();
    if (this.currentSession) {
      this.currentSession.status = 'paused';
      this.currentSession.endTime = new Date();
    }
    this.log('⏹️ Processing stopped');
  }

  /**
   * Event handlers
   */
  onProgress(callback: (session: ProcessingSession) => void): void {
    this.onProgressCallback = callback;
  }

  onPhaseComplete(callback: (phase: ProcessingPhase) => void): void {
    this.onPhaseCompleteCallback = callback;
  }

  onResult(callback: (result: ProcessingResult) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (ticker: string, error: string) => void): void {
    this.onErrorCallback = callback;
  }

  onLog(callback: (message: string) => void): void {
    this.onLogCallback = callback;
  }

  private log(message: string): void {
    console.log(message);
    this.onLogCallback?.(message);
  }

  /**
   * Getters
   */
  getCurrentSession(): ProcessingSession | null {
    return this.currentSession;
  }

  getConfiguration(): ProcessingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(updates: Partial<ProcessingConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.log(`⚙️ Configuration updated: ${JSON.stringify(updates)}`);
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics(): any {
    return getNASDAQProcessingStats();
  }

  /**
   * Get database statistics
   */
  getDatabaseStatistics(): any {
    return enhancedNASDAQDatabase.getDatabaseStats();
  }
}

// Export singleton instance
export const nasdaqProcessingEngine = new NASDAQProcessingEngine();