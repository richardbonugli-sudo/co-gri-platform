/**
 * Data Quality System Initializer
 * 
 * Initializes and starts the monthly update system with configured settings
 */

import { MonthlyUpdater } from './MonthlyUpdater';
import { DataQualityChecker } from './DataQualityChecker';
import { SegmentFilter } from './SegmentFilter';
import { defaultConfig } from './config';

export class DataQualitySystemInitializer {
  private monthlyUpdater: MonthlyUpdater | null = null;
  private checker: DataQualityChecker;
  private filter: SegmentFilter;
  private isInitialized = false;

  constructor() {
    this.checker = new DataQualityChecker();
    this.filter = new SegmentFilter();
  }

  /**
   * Initialize the complete data quality system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Data quality system already initialized');
      return;
    }

    console.log('🚀 Initializing Enhanced Data Quality System...');
    
    try {
      // Step 1: Initialize monthly updater with production config
      this.monthlyUpdater = new MonthlyUpdater(defaultConfig);
      
      // Step 2: Run initial quality assessment
      console.log('📊 Running initial quality assessment...');
      const initialReports = await this.checker.runFullQualityCheck();
      const initialSummary = this.checker.generateQualitySummary(initialReports);
      
      console.log(`Initial Quality Status:`);
      console.log(`- Total Companies: ${initialSummary.totalCompanies}`);
      console.log(`- Average Quality Score: ${initialSummary.avgScore}/100`);
      console.log(`- Companies with Stale Data: ${initialSummary.staleDataCount}`);
      console.log(`- Companies with Suspicious Data: ${initialSummary.suspiciousDataCount}`);

      // Step 3: Run initial segment filtering if enabled
      if (defaultConfig.autoFilterSuspiciousSegments) {
        console.log('🔍 Running initial segment filtering...');
        const filterResults = await this.runInitialFiltering();
        console.log(`Segment Filtering Results:`);
        console.log(`- Total Segments Removed: ${filterResults.totalRemoved}`);
        console.log(`- Companies Affected: ${filterResults.companiesAffected}`);
        console.log(`- Average Confidence: ${filterResults.avgConfidence}%`);
      }

      // Step 4: Start monthly update scheduler
      if (defaultConfig.enabled) {
        this.monthlyUpdater.start();
        const status = this.monthlyUpdater.getStatus();
        console.log('📅 Monthly update scheduler started');
        console.log(`Next scheduled update: ${status.nextRun?.toISOString()}`);
      }

      // Step 5: Set up system monitoring
      this.setupSystemMonitoring();

      this.isInitialized = true;
      console.log('✅ Data Quality System initialized successfully!');
      
      // Log configuration summary
      this.logConfigurationSummary();

    } catch (error) {
      console.error('❌ Failed to initialize data quality system:', error);
      throw error;
    }
  }

  /**
   * Run initial filtering on all companies
   */
  private async runInitialFiltering(): Promise<{
    totalRemoved: number;
    companiesAffected: number;
    avgConfidence: number;
  }> {
    const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = 
      await import('../../data/companySpecificExposures');
    
    const companies = getCompaniesWithSpecificExposures();
    let totalRemoved = 0;
    let companiesAffected = 0;
    let totalConfidence = 0;
    let filterCount = 0;

    for (const ticker of companies) {
      const exposure = getCompanySpecificExposure(ticker);
      if (exposure && exposure.exposures) {
        const filterResult = this.filter.filterSuspiciousSegments(exposure.exposures);
        
        if (filterResult.removedSegments.length > 0) {
          totalRemoved += filterResult.removedSegments.length;
          companiesAffected++;
          console.log(`  ${ticker}: Removed ${filterResult.removedSegments.length} suspicious segments`);
          
          // Log some examples of removed segments
          const examples = filterResult.removedSegments.slice(0, 2);
          if (examples.length > 0) {
            console.log(`    Examples: ${examples.join(', ')}`);
          }
        }
        
        totalConfidence += filterResult.confidence;
        filterCount++;
      }
    }

    return {
      totalRemoved,
      companiesAffected,
      avgConfidence: Math.round((totalConfidence / filterCount) * 100)
    };
  }

  /**
   * Set up system monitoring and health checks
   */
  private setupSystemMonitoring(): void {
    // Daily health check
    setInterval(async () => {
      try {
        const reports = await this.checker.runFullQualityCheck();
        const summary = this.checker.generateQualitySummary(reports);
        
        // Log daily quality metrics
        console.log(`📈 Daily Quality Check - Average Score: ${summary.avgScore}/100`);
        
        // Alert if quality drops significantly
        if (summary.avgScore < 50) {
          console.warn('⚠️  Quality Alert: Average quality score below 50!');
        }
        
        if (summary.staleDataCount > 20) {
          console.warn(`⚠️  Freshness Alert: ${summary.staleDataCount} companies have stale data`);
        }
        
      } catch (error) {
        console.error('Daily health check failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily

    // Weekly system status report
    setInterval(() => {
      if (this.monthlyUpdater) {
        const status = this.monthlyUpdater.getStatus();
        console.log(`📊 Weekly Status Report:`);
        console.log(`- System Running: ${status.isRunning ? 'Yes' : 'No'}`);
        console.log(`- Next Update: ${status.nextRun?.toISOString() || 'Not scheduled'}`);
        console.log(`- Auto-filtering: ${defaultConfig.autoFilterSuspiciousSegments ? 'Enabled' : 'Disabled'}`);
      }
    }, 7 * 24 * 60 * 60 * 1000); // Run weekly
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    console.log('\n📋 System Configuration Summary:');
    console.log(`- Monthly Updates: ${defaultConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`- Update Schedule: ${defaultConfig.dayOfMonth}th of each month at ${defaultConfig.timeOfDay} ${defaultConfig.timezone}`);
    console.log(`- Auto-filtering: ${defaultConfig.autoFilterSuspiciousSegments ? 'ENABLED' : 'DISABLED'}`);
    console.log(`- Quality Threshold: ${defaultConfig.qualityThresholdForAutoUpdate}/100`);
    console.log(`- Backup Before Updates: ${defaultConfig.backupBeforeUpdate ? 'ENABLED' : 'DISABLED'}`);
    console.log(`- Notification Emails: ${defaultConfig.notificationEmails.length} configured`);
    console.log('');
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    updaterRunning: boolean;
    nextUpdate: Date | null;
    config: typeof defaultConfig;
  } {
    return {
      initialized: this.isInitialized,
      updaterRunning: this.monthlyUpdater?.getStatus().isRunning || false,
      nextUpdate: this.monthlyUpdater?.getStatus().nextRun || null,
      config: defaultConfig
    };
  }

  /**
   * Stop the system
   */
  stop(): void {
    if (this.monthlyUpdater) {
      this.monthlyUpdater.stop();
    }
    this.isInitialized = false;
    console.log('🛑 Data Quality System stopped');
  }

  /**
   * Restart the system
   */
  async restart(): Promise<void> {
    this.stop();
    await this.initialize();
  }

  /**
   * Run manual quality check and filtering
   */
  async runManualMaintenance(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    console.log('🔧 Running manual maintenance...');
    
    // Run quality check
    const reports = await this.checker.runFullQualityCheck();
    const summary = this.checker.generateQualitySummary(reports);
    
    // Run filtering if enabled
    if (defaultConfig.autoFilterSuspiciousSegments) {
      const filterResults = await this.runInitialFiltering();
      console.log(`Manual filtering complete - removed ${filterResults.totalRemoved} segments`);
    }
    
    console.log(`Manual maintenance complete - quality score: ${summary.avgScore}/100`);
  }
}

// Global system instance
let systemInstance: DataQualitySystemInitializer | null = null;

/**
 * Get or create the global system instance
 */
export function getDataQualitySystem(): DataQualitySystemInitializer {
  if (!systemInstance) {
    systemInstance = new DataQualitySystemInitializer();
  }
  return systemInstance;
}

/**
 * Initialize the system (can be called multiple times safely)
 */
export async function initializeDataQualitySystem(): Promise<DataQualitySystemInitializer> {
  const system = getDataQualitySystem();
  await system.initialize();
  return system;
}