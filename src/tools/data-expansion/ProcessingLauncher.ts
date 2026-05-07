/**
 * S&P 500 Processing Launcher
 * 
 * Initiates full S&P 500 processing with real SEC data
 */

import { FullSP500Processor, FullProcessingResult } from './FullSP500Processor';

export class ProcessingLauncher {
  public processor: FullSP500Processor;
  private isRunning = false;

  constructor() {
    // Configure for optimal processing
    this.processor = new FullSP500Processor({
      batchSize: 3, // Smaller batches for real API calls
      delayBetweenBatches: 5000, // 5 seconds between batches
      maxRetries: 3,
      priorityOrder: [1, 2, 3],
      enableProgressSaving: true,
      enableErrorRecovery: true
    });
  }

  async startFullProcessing(): Promise<FullProcessingResult> {
    if (this.isRunning) {
      throw new Error('Processing is already running');
    }

    this.isRunning = true;
    
    try {
      console.log('🚀 Starting full S&P 500 processing...');
      console.log('📊 Processing all 500+ companies with real SEC data');
      console.log('🔗 Using existing Supabase edge functions');
      
      // Set up progress monitoring
      this.processor.setOnProgressUpdate((progress) => {
        const completionRate = Math.round((progress.processedCompanies / progress.totalCompanies) * 100);
        const successRate = progress.processedCompanies > 0 
          ? Math.round((progress.successfulCompanies / progress.processedCompanies) * 100) 
          : 0;
        
        console.log(`📈 Progress: ${completionRate}% complete (${progress.processedCompanies}/${progress.totalCompanies})`);
        console.log(`✅ Success rate: ${successRate}% (${progress.successfulCompanies} successful)`);
        console.log(`⚡ Processing rate: ${Math.round(progress.processingRate)} companies/min`);
        
        if (progress.estimatedCompletion) {
          const eta = new Date(progress.estimatedCompletion);
          console.log(`🕐 ETA: ${eta.toLocaleTimeString()}`);
        }
      });

      this.processor.setOnBatchComplete((batchResults) => {
        const successful = batchResults.filter(r => r.validSegments > 0);
        const tickers = batchResults.map(r => r.ticker).join(', ');
        console.log(`✅ Batch complete: ${tickers}`);
        console.log(`📊 Results: ${successful.length}/${batchResults.length} successful`);
        
        // Log some sample results
        successful.slice(0, 2).forEach(result => {
          const segments = result.segments.map(s => `${s.country}: ${s.percentage}%`).join(', ');
          console.log(`  ${result.ticker}: ${segments}`);
        });
      });

      // Start processing
      const results = await this.processor.processAllSP500Companies();
      
      console.log('🎉 Full S&P 500 processing completed!');
      console.log(`📊 Final Results:`);
      console.log(`  - Total companies: ${results.summary.totalCompanies}`);
      console.log(`  - Successful processing: ${results.summary.successfulProcessing}`);
      console.log(`  - Total segments extracted: ${results.summary.totalSegmentsExtracted}`);
      console.log(`  - Average confidence: ${Math.round(results.summary.averageConfidence * 100)}%`);
      console.log(`  - Processing time: ${Math.round(results.summary.processingTimeMs / 1000 / 60)} minutes`);
      console.log(`  - Error rate: ${Math.round(results.summary.errorRate)}%`);

      return results;

    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    if (this.isRunning) {
      this.processor.stop();
      this.isRunning = false;
      console.log('🛑 Processing stopped');
    }
  }

  getProgress() {
    return this.processor.getProgress();
  }

  getStatistics() {
    return this.processor.getStatistics();
  }
}

// Export singleton instance
export const processingLauncher = new ProcessingLauncher();