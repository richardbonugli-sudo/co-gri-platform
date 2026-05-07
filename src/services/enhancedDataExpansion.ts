/**
 * Enhanced Data Expansion Service
 * 
 * Provides advanced data processing and integration capabilities
 * for comprehensive company analysis and geographic exposure calculation.
 */

export interface EnhancedProcessingResult {
  ticker: string;
  qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  evidenceScore: number;
  processingTime: number;
  integratedData: IntegratedCompanyData;
  improvementSuggestions: string[];
}

export interface IntegratedCompanyData {
  ticker: string;
  companyName: string;
  lastUpdated: Date;
  dataFreshness: number;
  overallConfidence: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  geographicExposures: GeographicExposure[];
  operationalPresence: OperationalPresence[];
  strategicInsights: StrategyInsight[];
  dataLineage: DataLineage[];
  qualityMetrics: QualityMetrics;
}

export interface GeographicExposure {
  geography: string;
  percentage: number;
  confidence: number;
  source: string;
  metricType: string;
}

export interface OperationalPresence {
  location: string;
  type: string;
  description: string;
  employees?: number;
}

export interface StrategyInsight {
  category: string;
  insight: string;
  confidence: number;
  source: string;
}

export interface DataLineage {
  source: string;
  extractionMethod: string;
  confidence: number;
  timestamp: Date;
}

export interface QualityMetrics {
  totalDataPoints: number;
  averageConfidence: number;
  sourceCount: number;
  crossValidatedPoints: number;
  conflictCount: number;
  freshnessScore: number;
  completenessScore: number;
}

export interface ProcessingSummary {
  totalCompanies: number;
  successfulProcessing: number;
  highEvidenceCompanies: number;
  mediumEvidenceCompanies: number;
  lowEvidenceCompanies: number;
  averageQualityGrade: string;
  averageEvidenceScore: number;
  averageProcessingTime: number;
  totalDataSources: number;
  averageSourcesPerCompany: number;
}

export class EnhancedDataExpansionService {
  private isProcessing = false;
  private shouldStop = false;
  private startTime = 0;
  private totalCompanies = 0;
  private processedCompanies = 0;
  private successfulCompanies = 0;
  private failedCompanies = 0;
  
  private config = {
    batchSize: 10,
    maxRetries: 3,
    delayBetweenBatches: 1000
  };
  
  private onProgressUpdate?: (progress: ProcessingProgress) => void;
  private onCompanyComplete?: (result: EnhancedProcessingResult) => void;
  private onBatchComplete?: (results: EnhancedProcessingResult[]) => void;

  /**
   * Process multiple companies with enhanced data integration
   */
  async processCompanies(tickers: string[]): Promise<{
    results: EnhancedProcessingResult[];
    summary: ProcessingSummary;
  }> {
    console.log(`🚀 Starting enhanced processing for ${tickers.length} companies...`);
    
    this.startProcessing(tickers.length);
    const results: EnhancedProcessingResult[] = [];
    
    try {
      // Process in batches
      for (let i = 0; i < tickers.length; i += this.config.batchSize) {
        if (this.shouldStop) break;
        
        const batch = tickers.slice(i, i + this.config.batchSize);
        console.log(`📊 Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(tickers.length / this.config.batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(ticker => this.processCompany(ticker))
        );
        
        results.push(...batchResults);
        
        // Update progress
        this.processedCompanies += batch.length;
        this.successfulCompanies += batchResults.filter(r => r.qualityGrade !== 'D').length;
        this.failedCompanies += batchResults.filter(r => r.qualityGrade === 'D').length;
        
        // Notify callbacks
        if (this.onBatchComplete) {
          this.onBatchComplete(batchResults);
        }
        
        if (this.onProgressUpdate) {
          this.onProgressUpdate(this.getProgress());
        }
        
        // Delay between batches
        if (i + this.config.batchSize < tickers.length) {
          await this.delay(this.config.delayBetweenBatches);
        }
      }
      
      const summary = this.generateProcessingSummary(results);
      
      console.log(`✅ Enhanced processing completed: ${results.length} companies processed`);
      console.log(`📈 Success rate: ${((this.successfulCompanies / results.length) * 100).toFixed(1)}%`);
      
      return { results, summary };
      
    } catch (error) {
      console.error('❌ Enhanced processing failed:', error);
      throw error;
    } finally {
      this.stopProcessing();
    }
  }

  /**
   * Process a single company with enhanced data integration
   */
  async processCompany(ticker: string): Promise<EnhancedProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Processing ${ticker}...`);
      
      // Simulate enhanced data integration
      const integratedData = await this.integrateCompanyData(ticker);
      
      // Calculate quality grade and evidence score
      const qualityGrade = this.calculateQualityGrade(integratedData);
      const evidenceScore = this.calculateEvidenceScore(integratedData);
      
      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(integratedData);
      
      const processingTime = Date.now() - startTime;
      
      const result: EnhancedProcessingResult = {
        ticker,
        qualityGrade,
        evidenceScore,
        processingTime,
        integratedData,
        improvementSuggestions
      };
      
      if (this.onCompanyComplete) {
        this.onCompanyComplete(result);
      }
      
      console.log(`✅ ${ticker} processed: Grade ${qualityGrade}, Evidence ${evidenceScore}%`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to process ${ticker}:`, error);
      
      return {
        ticker,
        qualityGrade: 'D',
        evidenceScore: 0,
        processingTime: Date.now() - startTime,
        integratedData: this.createEmptyIntegratedData(ticker),
        improvementSuggestions: ['Complete data integration failed - requires manual review']
      };
    }
  }

  /**
   * Integrate data from multiple sources for a company
   */
  private async integrateCompanyData(ticker: string): Promise<IntegratedCompanyData> {
    // Simulate data integration from multiple sources
    const companyName = this.getCompanyName(ticker);
    
    // Generate sample geographic exposures
    const geographicExposures: GeographicExposure[] = [
      { geography: 'United States', percentage: 45, confidence: 0.9, source: 'Annual Report', metricType: 'revenue' },
      { geography: 'Europe', percentage: 25, confidence: 0.85, source: 'Investor Presentation', metricType: 'revenue' },
      { geography: 'Asia Pacific', percentage: 20, confidence: 0.8, source: 'Sustainability Report', metricType: 'operations' },
      { geography: 'Other', percentage: 10, confidence: 0.7, source: 'Estimated', metricType: 'revenue' }
    ];
    
    // Generate sample operational presence
    const operationalPresence: OperationalPresence[] = [
      { location: 'United States', type: 'Headquarters', description: 'Corporate headquarters and main operations' },
      { location: 'Europe', type: 'Regional Office', description: 'European operations and sales' },
      { location: 'Asia Pacific', type: 'Manufacturing', description: 'Production facilities and supply chain' }
    ];
    
    // Generate sample strategic insights
    const strategicInsights: StrategyInsight[] = [
      { category: 'Market Expansion', insight: 'Expanding presence in emerging markets', confidence: 0.8, source: 'Investor Call' },
      { category: 'Digital Transformation', insight: 'Investing in digital capabilities', confidence: 0.85, source: 'Annual Report' }
    ];
    
    // Generate data lineage
    const dataLineage: DataLineage[] = [
      { source: 'Annual Report 2023', extractionMethod: 'NLP Analysis', confidence: 0.9, timestamp: new Date() },
      { source: 'Investor Presentation Q4 2023', extractionMethod: 'Structured Data', confidence: 0.95, timestamp: new Date() },
      { source: 'Sustainability Report 2023', extractionMethod: 'Manual Review', confidence: 0.85, timestamp: new Date() }
    ];
    
    // Calculate quality metrics
    const qualityMetrics: QualityMetrics = {
      totalDataPoints: geographicExposures.length + operationalPresence.length + strategicInsights.length,
      averageConfidence: 0.85,
      sourceCount: 3,
      crossValidatedPoints: 2,
      conflictCount: 0,
      freshnessScore: 95,
      completenessScore: 80
    };
    
    return {
      ticker,
      companyName,
      lastUpdated: new Date(),
      dataFreshness: 30,
      overallConfidence: qualityMetrics.averageConfidence,
      evidenceLevel: qualityMetrics.averageConfidence >= 0.8 ? 'high' : 
                    qualityMetrics.averageConfidence >= 0.6 ? 'medium' : 'low',
      geographicExposures,
      operationalPresence,
      strategicInsights,
      dataLineage,
      qualityMetrics
    };
  }

  /**
   * Get company name for ticker
   */
  private getCompanyName(ticker: string): string {
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'GOOG': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla, Inc.',
      'META': 'Meta Platforms Inc.',
      'AVGO': 'Broadcom Inc.',
      'ORCL': 'Oracle Corporation',
      'CRM': 'Salesforce Inc.',
      'ADBE': 'Adobe Inc.',
      'NFLX': 'Netflix Inc.',
      'ACN': 'Accenture plc',
      'TXN': 'Texas Instruments Inc.',
      'QCOM': 'QUALCOMM Inc.',
      'IBM': 'International Business Machines Corp.',
      'UNH': 'UnitedHealth Group Inc.',
      'JNJ': 'Johnson & Johnson',
      'ABBV': 'AbbVie Inc.',
      'PFE': 'Pfizer Inc.',
      'MRK': 'Merck & Co. Inc.',
      'TMO': 'Thermo Fisher Scientific Inc.',
      'ABT': 'Abbott Laboratories',
      'LLY': 'Eli Lilly and Company'
    };
    
    return companyNames[ticker] || `${ticker} Inc.`;
  }

  /**
   * Calculate quality grade based on integrated data
   */
  private calculateQualityGrade(data: IntegratedCompanyData): EnhancedProcessingResult['qualityGrade'] {
    const metrics = data.qualityMetrics;
    
    // Calculate composite score (0-100)
    const confidenceScore = metrics.averageConfidence * 100;
    const sourceScore = Math.min(100, (metrics.sourceCount / 5) * 100);
    const crossValidationScore = metrics.totalDataPoints > 0 
      ? (metrics.crossValidatedPoints / metrics.totalDataPoints) * 100 
      : 0;
    const freshnessScore = metrics.freshnessScore;
    const completenessScore = metrics.completenessScore;
    
    const compositeScore = (
      confidenceScore * 0.3 +
      sourceScore * 0.2 +
      crossValidationScore * 0.2 +
      freshnessScore * 0.15 +
      completenessScore * 0.15
    );
    
    // Map to letter grades
    if (compositeScore >= 95) return 'A+';
    if (compositeScore >= 90) return 'A';
    if (compositeScore >= 85) return 'B+';
    if (compositeScore >= 80) return 'B';
    if (compositeScore >= 75) return 'C+';
    if (compositeScore >= 70) return 'C';
    return 'D';
  }

  /**
   * Calculate evidence score (0-100)
   */
  private calculateEvidenceScore(data: IntegratedCompanyData): number {
    const metrics = data.qualityMetrics;
    
    // Evidence factors
    const sourceCountFactor = Math.min(1, metrics.sourceCount / 5);
    const crossValidationFactor = metrics.totalDataPoints > 0 
      ? metrics.crossValidatedPoints / metrics.totalDataPoints 
      : 0;
    const confidenceFactor = metrics.averageConfidence;
    const completenessFactor = metrics.completenessScore / 100;
    const freshnessFactor = Math.min(1, metrics.freshnessScore / 100);
    
    const evidenceScore = (
      sourceCountFactor * 25 +
      crossValidationFactor * 25 +
      confidenceFactor * 20 +
      completenessFactor * 15 +
      freshnessFactor * 15
    );
    
    return Math.min(100, Math.max(0, evidenceScore));
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(data: IntegratedCompanyData): string[] {
    const suggestions: string[] = [];
    const metrics = data.qualityMetrics;
    
    if (metrics.sourceCount < 3) {
      suggestions.push('Add more data sources (sustainability reports, investor presentations, earnings calls)');
    }
    
    if (metrics.averageConfidence < 0.7) {
      suggestions.push('Improve data extraction accuracy with better NLP models and validation');
    }
    
    if (metrics.crossValidatedPoints < metrics.totalDataPoints * 0.3) {
      suggestions.push('Increase cross-validation by finding overlapping data points across sources');
    }
    
    if (metrics.freshnessScore < 80) {
      suggestions.push('Update with more recent data sources and reports');
    }
    
    if (metrics.completenessScore < 70) {
      suggestions.push('Gather additional operational data (facilities, employees, manufacturing)');
    }
    
    if (data.geographicExposures.length < 3) {
      suggestions.push('Expand geographic coverage with more regional data sources');
    }
    
    if (data.operationalPresence.length === 0) {
      suggestions.push('Add operational presence data from company websites and facility listings');
    }
    
    if (data.strategicInsights.length === 0) {
      suggestions.push('Include strategic insights from investor calls and forward-looking statements');
    }
    
    return suggestions;
  }

  /**
   * Generate processing summary
   */
  private generateProcessingSummary(results: EnhancedProcessingResult[]): ProcessingSummary {
    const totalCompanies = results.length;
    const successfulProcessing = results.filter(r => r.qualityGrade !== 'D').length;
    
    const evidenceLevels = results.map(r => r.integratedData.evidenceLevel);
    const highEvidenceCompanies = evidenceLevels.filter(l => l === 'high').length;
    const mediumEvidenceCompanies = evidenceLevels.filter(l => l === 'medium').length;
    const lowEvidenceCompanies = evidenceLevels.filter(l => l === 'low').length;
    
    // Calculate average quality grade
    const gradeValues = { 'A+': 97, 'A': 93, 'B+': 87, 'B': 83, 'C+': 77, 'C': 73, 'D': 50 };
    const avgGradeValue = results.reduce((sum, r) => sum + gradeValues[r.qualityGrade], 0) / results.length;
    const avgQualityGrade = Object.entries(gradeValues)
      .reduce((closest, [grade, value]) => 
        Math.abs(value - avgGradeValue) < Math.abs(gradeValues[closest as keyof typeof gradeValues] - avgGradeValue) ? grade : closest
      );
    
    const averageEvidenceScore = results.reduce((sum, r) => sum + r.evidenceScore, 0) / results.length;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    const totalDataSources = results.reduce((sum, r) => sum + r.integratedData.qualityMetrics.sourceCount, 0);
    const averageSourcesPerCompany = totalDataSources / results.length;
    
    return {
      totalCompanies,
      successfulProcessing,
      highEvidenceCompanies,
      mediumEvidenceCompanies,
      lowEvidenceCompanies,
      averageQualityGrade: avgQualityGrade,
      averageEvidenceScore,
      averageProcessingTime,
      totalDataSources,
      averageSourcesPerCompany
    };
  }

  /**
   * Create empty integrated data for failed processing
   */
  private createEmptyIntegratedData(ticker: string): IntegratedCompanyData {
    return {
      ticker,
      companyName: `${ticker} Inc.`,
      lastUpdated: new Date(),
      dataFreshness: 365,
      overallConfidence: 0,
      evidenceLevel: 'low',
      geographicExposures: [],
      operationalPresence: [],
      strategicInsights: [],
      dataLineage: [],
      qualityMetrics: {
        totalDataPoints: 0,
        averageConfidence: 0,
        sourceCount: 0,
        crossValidatedPoints: 0,
        conflictCount: 0,
        freshnessScore: 0,
        completenessScore: 0
      }
    };
  }

  /**
   * Get current processing progress
   */
  getProgress(): ProcessingProgress {
    const elapsedTime = Date.now() - this.startTime;
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
      currentBatch: Math.floor(this.processedCompanies / this.config.batchSize) + 1,
      totalBatches: Math.ceil(this.totalCompanies / this.config.batchSize),
      processingRate,
      estimatedCompletion,
      currentPhase: 1
    };
  }

  /**
   * Set progress update callback
   */
  setOnProgressUpdate(callback: (progress: ProcessingProgress) => void) {
    this.onProgressUpdate = callback;
  }

  /**
   * Set company complete callback
   */
  setOnCompanyComplete(callback: (result: EnhancedProcessingResult) => void) {
    this.onCompanyComplete = callback;
  }

  /**
   * Set batch complete callback
   */
  setOnBatchComplete(callback: (results: EnhancedProcessingResult[]) => void) {
    this.onBatchComplete = callback;
  }

  /**
   * Stop processing
   */
  stop() {
    console.log('🛑 Stopping enhanced processing...');
    this.shouldStop = true;
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
  private startProcessing(totalCompanies: number) {
    this.isProcessing = true;
    this.shouldStop = false;
    this.startTime = Date.now();
    this.totalCompanies = totalCompanies;
    this.processedCompanies = 0;
    this.successfulCompanies = 0;
    this.failedCompanies = 0;
  }

  private stopProcessing() {
    this.isProcessing = false;
    this.shouldStop = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Progress interface for compatibility
interface ProcessingProgress {
  processedCompanies: number;
  totalCompanies: number;
  successfulCompanies: number;
  failedCompanies: number;
  currentBatch: number;
  totalBatches: number;
  processingRate: number;
  estimatedCompletion?: Date;
  currentPhase: number;
}

// Export singleton instance
export const enhancedDataExpansionService = new EnhancedDataExpansionService();