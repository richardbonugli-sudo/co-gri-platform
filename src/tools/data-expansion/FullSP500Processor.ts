/**
 * Full S&P 500 Processor
 * 
 * Orchestrates the processing of all S&P 500 companies with real SEC data
 * using batch processing, priority queues, and comprehensive error handling.
 */

import { RealSECProcessor, CompanyProcessingResult, ProcessingProgress } from './RealSECProcessor';
import { SP500_COMPANIES, SP500Company, getCompaniesByPriority } from './SP500Companies';

export interface FullProcessingConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxRetries: number;
  priorityOrder: number[];
  enableProgressSaving: boolean;
  enableErrorRecovery: boolean;
}

export interface FullProcessingResult {
  results: CompanyProcessingResult[];
  summary: {
    totalCompanies: number;
    successfulProcessing: number;
    totalSegmentsExtracted: number;
    averageConfidence: number;
    processingTimeMs: number;
    errorRate: number;
  };
  errors: Array<{
    ticker: string;
    error: string;
  }>;
}

export interface ProcessingRequest {
  tickers: string[];
  batchSize?: number;
  mode: 'latest' | 'cached' | 'force';
}

export class FullSP500Processor {
  private config: FullProcessingConfig;
  private secProcessor: RealSECProcessor;
  private isProcessing: boolean = false;
  private shouldStop: boolean = false;
  private processingStartTime: number = 0;
  
  // Progress tracking
  private totalCompanies: number = 0;
  private processedCompanies: number = 0;
  private successfulCompanies: number = 0;
  private failedCompanies: number = 0;
  private currentBatch: number = 0;
  private totalBatches: number = 0;
  private currentPhase: number = 1;
  
  // Callback functions
  private onProgressUpdate?: (progress: ProcessingProgress) => void;
  private onBatchComplete?: (results: CompanyProcessingResult[]) => void;
  private onPhaseComplete?: (phase: number, results: CompanyProcessingResult[]) => void;

  constructor(config: Partial<FullProcessingConfig> = {}) {
    this.config = {
      batchSize: 3,
      delayBetweenBatches: 5000,
      maxRetries: 3,
      priorityOrder: [1, 2, 3],
      enableProgressSaving: true,
      enableErrorRecovery: true,
      ...config
    };

    // Initialize SEC processor with browser-compatible configuration
    this.secProcessor = new RealSECProcessor({
      batchSize: this.config.batchSize,
      delayBetweenRequests: 1200,
      maxRetries: this.config.maxRetries,
      enableCaching: true,
      enableRateLimiting: true
    });

    console.log('FullSP500Processor initialized with config:', this.config);
  }

  /**
   * Process all S&P 500 companies with real SEC data
   */
  async processAllSP500Companies(): Promise<FullProcessingResult> {
    console.log('🚀 Starting full S&P 500 processing with real SEC data...');
    
    this.startProcessing();
    const allResults: CompanyProcessingResult[] = [];
    const allErrors: Array<{ticker: string, error: string}> = [];

    try {
      // Process companies by priority
      for (const priority of this.config.priorityOrder) {
        if (this.shouldStop) {
          console.log('🛑 Processing stopped by user');
          break;
        }

        const companies = getCompaniesByPriority(priority as 1 | 2 | 3);
        if (companies.length === 0) continue;

        console.log(`\n📋 Processing Priority ${priority} companies (${companies.length} companies)...`);
        this.currentPhase = priority;

        const phaseResults = await this.processCompaniesInBatches(companies);
        allResults.push(...phaseResults.results);
        allErrors.push(...phaseResults.errors);

        if (this.onPhaseComplete) {
          this.onPhaseComplete(priority, phaseResults.results);
        }

        // Brief pause between phases
        if (priority < Math.max(...this.config.priorityOrder)) {
          console.log(`⏸️  Pausing ${this.config.delayBetweenBatches}ms between priority phases...`);
          await this.delay(this.config.delayBetweenBatches);
        }
      }

      const processingTime = Date.now() - this.processingStartTime;
      const successfulResults = allResults.filter(r => r.validSegments > 0);
      const totalSegments = successfulResults.reduce((sum, r) => sum + r.validSegments, 0);
      const avgConfidence = successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
        : 0;

      const summary = {
        totalCompanies: allResults.length,
        successfulProcessing: successfulResults.length,
        totalSegmentsExtracted: totalSegments,
        averageConfidence: avgConfidence,
        processingTimeMs: processingTime,
        errorRate: (allErrors.length / allResults.length) * 100
      };

      console.log('\n🎉 Full S&P 500 processing completed!');
      console.log('📊 Final Summary:');
      console.log(`  - Total companies: ${summary.totalCompanies}`);
      console.log(`  - Successful processing: ${summary.successfulProcessing}`);
      console.log(`  - Total segments extracted: ${summary.totalSegmentsExtracted}`);
      console.log(`  - Average confidence: ${Math.round(summary.averageConfidence * 100)}%`);
      console.log(`  - Processing time: ${Math.round(summary.processingTimeMs / 1000 / 60)} minutes`);
      console.log(`  - Error rate: ${Math.round(summary.errorRate)}%`);

      return {
        results: allResults,
        summary,
        errors: allErrors
      };

    } catch (error) {
      console.error('❌ Full processing failed:', error);
      throw error;
    } finally {
      this.stopProcessing();
    }
  }

  /**
   * Process companies in batches
   */
  private async processCompaniesInBatches(companies: SP500Company[]): Promise<{results: CompanyProcessingResult[], errors: Array<{ticker: string, error: string}>}> {
    const results: CompanyProcessingResult[] = [];
    const errors: Array<{ticker: string, error: string}> = [];
    
    this.totalBatches = Math.ceil(companies.length / this.config.batchSize);
    this.currentBatch = 0;

    for (let i = 0; i < companies.length; i += this.config.batchSize) {
      if (this.shouldStop) {
        console.log('🛑 Batch processing stopped by user');
        break;
      }

      this.currentBatch++;
      const batch = companies.slice(i, i + this.config.batchSize);
      
      console.log(`\n📦 Processing batch ${this.currentBatch}/${this.totalBatches} (${batch.map(c => c.ticker).join(', ')})...`);

      try {
        const batchCompanies = batch.map(c => ({ ticker: c.ticker, name: c.name }));
        const batchResults = await this.secProcessor.processBatch(batchCompanies);
        
        results.push(...batchResults);
        
        // Track progress
        this.processedCompanies += batchResults.length;
        this.successfulCompanies += batchResults.filter(r => r.validSegments > 0).length;
        this.failedCompanies += batchResults.filter(r => r.validSegments === 0).length;

        // Collect errors
        batchResults.forEach(result => {
          if (result.errors && result.errors.length > 0) {
            errors.push({
              ticker: result.ticker,
              error: result.errors[0]
            });
          }
        });

        // Call progress callback
        if (this.onProgressUpdate) {
          this.onProgressUpdate(this.getProgress());
        }

        // Call batch complete callback
        if (this.onBatchComplete) {
          this.onBatchComplete(batchResults);
        }

        const successful = batchResults.filter(r => r.validSegments > 0);
        console.log(`✅ Batch ${this.currentBatch} complete: ${successful.length}/${batchResults.length} successful`);
        
        // Log some sample results
        successful.slice(0, 2).forEach(result => {
          const segments = result.segments.map(s => `${s.country}: ${s.percentage}%`).join(', ');
          console.log(`  ${result.ticker}: ${segments}`);
        });

        // Delay between batches
        if (i + this.config.batchSize < companies.length) {
          console.log(`⏸️  Pausing ${this.config.delayBetweenBatches}ms between batches...`);
          await this.delay(this.config.delayBetches);
        }

      } catch (error) {
        console.error(`❌ Batch ${this.currentBatch} failed:`, error);
        
        // Add batch errors
        batch.forEach(company => {
          errors.push({
            ticker: company.ticker,
            error: error instanceof Error ? error.message : 'Batch processing failed'
          });
        });
      }
    }

    return { results, errors };
  }

  /**
   * Process specific companies (for testing or incremental updates)
   */
  async processCompanies(request: ProcessingRequest): Promise<FullProcessingResult> {
    console.log(`🎯 Processing ${request.tickers.length} specific companies...`);
    
    this.startProcessing();
    this.totalCompanies = request.tickers.length;
    
    const companies = request.tickers.map(ticker => {
      const company = SP500_COMPANIES.find(c => c.ticker === ticker);
      return {
        ticker,
        name: company?.name || `${ticker} Inc.`,
        sector: company?.sector || 'Unknown',
        priority: company?.priority || 3
      };
    });

    try {
      const result = await this.processCompaniesInBatches(companies);
      
      const processingTime = Date.now() - this.processingStartTime;
      const successfulResults = result.results.filter(r => r.validSegments > 0);
      const totalSegments = successfulResults.reduce((sum, r) => sum + r.validSegments, 0);
      const avgConfidence = successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
        : 0;

      const summary = {
        totalCompanies: result.results.length,
        successfulProcessing: successfulResults.length,
        totalSegmentsExtracted: totalSegments,
        averageConfidence: avgConfidence,
        processingTimeMs: processingTime,
        errorRate: (result.errors.length / result.results.length) * 100
      };

      console.log(`✅ Specific company processing completed: ${summary.successfulProcessing}/${summary.totalCompanies} successful`);

      return {
        results: result.results,
        summary,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ Specific company processing failed:', error);
      throw error;
    } finally {
      this.stopProcessing();
    }
  }

  /**
   * Set progress update callback
   */
  setOnProgressUpdate(callback: (progress: ProcessingProgress) => void) {
    this.onProgressUpdate = callback;
  }

  /**
   * Set batch complete callback
   */
  setOnBatchComplete(callback: (results: CompanyProcessingResult[]) => void) {
    this.onBatchComplete = callback;
  }

  /**
   * Set phase complete callback
   */
  setOnPhaseComplete(callback: (phase: number, results: CompanyProcessingResult[]) => void) {
    this.onPhaseComplete = callback;
  }

  /**
   * Get current progress
   */
  getProgress(): ProcessingProgress {
    const elapsedTime = Date.now() - this.processingStartTime;
    const processingRate = this.processedCompanies > 0 ? (this.processedCompanies / (elapsedTime / 1000 / 60)) : 0;
    
    let estimatedCompletion: Date | undefined;
    if (processingRate > 0 && this.totalCompanies > this.processedCompanies) {
      const remainingCompanies = this.totalCompanies - this.processedCompanies;
      const remainingMinutes = remainingCompanies / processingRate;
      estimatedCompletion = new Date(Date.now() + remainingMinutes * 60 * 1000);
    }

    return {
      processedCompanies: this.processedCompanies,
      totalCompanies: this.totalCompanies,
      successfulCompanies: this.successfulCompanies,
      failedCompanies: this.failedCompanies,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      processingRate,
      estimatedCompletion,
      currentPhase: this.currentPhase
    };
  }

  /**
   * Get processing statistics
   */
  getStatistics() {
    return {
      ...this.getProgress(),
      isProcessing: this.isProcessing,
      elapsedTimeMs: Date.now() - this.processingStartTime
    };
  }

  /**
   * Stop processing
   */
  stop() {
    console.log('🛑 Stopping S&P 500 processing...');
    this.shouldStop = true;
    this.secProcessor.stop();
  }

  /**
   * Check if processing is active
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Private helper methods
   */
  private startProcessing() {
    this.isProcessing = true;
    this.shouldStop = false;
    this.processingStartTime = Date.now();
    this.totalCompanies = SP500_COMPANIES.length;
    this.processedCompanies = 0;
    this.successfulCompanies = 0;
    this.failedCompanies = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.currentPhase = 1;
    
    this.secProcessor.reset();
    this.secProcessor.startProcessing();
  }

  private stopProcessing() {
    this.isProcessing = false;
    this.shouldStop = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}