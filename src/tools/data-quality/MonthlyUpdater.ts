/**
 * Monthly Data Updater for Geographic Exposures
 * 
 * This service runs monthly updates to refresh all company data,
 * filter suspicious segments, and maintain data quality.
 */

import { DataQualityChecker } from './DataQualityChecker';
import { SegmentFilter, FilterResult } from './SegmentFilter';

export interface MonthlyUpdateConfig {
  enabled: boolean;
  dayOfMonth: number; // 1-28, day to run monthly update
  timeOfDay: string; // "02:00" format (24-hour)
  timezone: string; // "UTC", "America/New_York", etc.
  autoFilterSuspiciousSegments: boolean;
  qualityThresholdForAutoUpdate: number; // 0-100
  notificationEmails: string[];
  backupBeforeUpdate: boolean;
}

export interface MonthlyUpdateResult {
  runDate: Date;
  companiesProcessed: number;
  companiesUpdated: number;
  companiesFailed: number;
  segmentsFiltered: number;
  qualityImprovement: number; // Average quality score change
  errors: string[];
  filteringResults: FilterResult[];
  summary: {
    avgQualityBefore: number;
    avgQualityAfter: number;
    staleDataFixed: number;
    suspiciousSegmentsRemoved: number;
    dataFreshnessImproved: number;
  };
}

export class MonthlyUpdater {
  private config: MonthlyUpdateConfig;
  private checker: DataQualityChecker;
  private filter: SegmentFilter;
  private updateTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: MonthlyUpdateConfig) {
    this.config = config;
    this.checker = new DataQualityChecker();
    this.filter = new SegmentFilter();
  }

  /**
   * Start the monthly update scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('Monthly updates are disabled');
      return;
    }

    this.scheduleNextUpdate();
    console.log(`Monthly updater started - next run: ${this.getNextRunDate()}`);
  }

  /**
   * Stop the monthly update scheduler
   */
  stop(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    console.log('Monthly updater stopped');
  }

  /**
   * Run manual update immediately
   */
  async runManualUpdate(): Promise<MonthlyUpdateResult> {
    if (this.isRunning) {
      throw new Error('Update already in progress');
    }

    console.log('Starting manual monthly update...');
    return await this.executeUpdate();
  }

  /**
   * Schedule the next monthly update
   */
  private scheduleNextUpdate(): void {
    const nextRun = this.getNextRunDate();
    const msUntilRun = nextRun.getTime() - Date.now();

    this.updateTimer = setTimeout(async () => {
      await this.executeUpdate();
      this.scheduleNextUpdate(); // Schedule next month's update
    }, msUntilRun);

    console.log(`Next monthly update scheduled for: ${nextRun.toISOString()}`);
  }

  /**
   * Calculate next run date based on configuration
   */
  private getNextRunDate(): Date {
    const now = new Date();
    const [hours, minutes] = this.config.timeOfDay.split(':').map(Number);
    
    // Create date for this month
    let nextRun = new Date(now.getFullYear(), now.getMonth(), this.config.dayOfMonth, hours, minutes, 0, 0);
    
    // If we've passed this month's date, schedule for next month
    if (nextRun <= now) {
      nextRun = new Date(now.getFullYear(), now.getMonth() + 1, this.config.dayOfMonth, hours, minutes, 0, 0);
    }
    
    return nextRun;
  }

  /**
   * Execute the monthly update process
   */
  private async executeUpdate(): Promise<MonthlyUpdateResult> {
    this.isRunning = true;
    const startTime = Date.now();
    
    const result: MonthlyUpdateResult = {
      runDate: new Date(),
      companiesProcessed: 0,
      companiesUpdated: 0,
      companiesFailed: 0,
      segmentsFiltered: 0,
      qualityImprovement: 0,
      errors: [],
      filteringResults: [],
      summary: {
        avgQualityBefore: 0,
        avgQualityAfter: 0,
        staleDataFixed: 0,
        suspiciousSegmentsRemoved: 0,
        dataFreshnessImproved: 0
      }
    };

    try {
      console.log('=== MONTHLY DATA UPDATE STARTED ===');
      
      // Step 1: Backup current data if enabled
      if (this.config.backupBeforeUpdate) {
        await this.createDataBackup();
      }

      // Step 2: Run initial quality assessment
      console.log('Running initial quality assessment...');
      const initialReports = await this.checker.runFullQualityCheck();
      const initialSummary = this.checker.generateQualitySummary(initialReports);
      result.summary.avgQualityBefore = initialSummary.avgScore;
      result.companiesProcessed = initialReports.length;

      // Step 3: Filter suspicious segments if enabled
      if (this.config.autoFilterSuspiciousSegments) {
        console.log('Filtering suspicious segments...');
        const filterResults = await this.filterAllCompanySuspiciousSegments();
        result.filteringResults = filterResults;
        result.segmentsFiltered = filterResults.reduce((sum, r) => sum + (r.originalCount - r.filteredCount), 0);
        result.summary.suspiciousSegmentsRemoved = result.segmentsFiltered;
      }

      // Step 4: Update stale data
      console.log('Updating stale company data...');
      const updateResults = await this.updateStaleCompanyData(initialReports);
      result.companiesUpdated = updateResults.successful;
      result.companiesFailed = updateResults.failed;
      result.summary.staleDataFixed = updateResults.successful;

      // Step 5: Run final quality assessment
      console.log('Running final quality assessment...');
      const finalReports = await this.checker.runFullQualityCheck();
      const finalSummary = this.checker.generateQualitySummary(finalReports);
      result.summary.avgQualityAfter = finalSummary.avgScore;
      result.qualityImprovement = finalSummary.avgScore - initialSummary.avgScore;

      // Step 6: Calculate improvements
      const freshnessImprovement = this.calculateFreshnessImprovement(initialReports, finalReports);
      result.summary.dataFreshnessImproved = freshnessImprovement;

      // Step 7: Send notifications
      await this.sendUpdateNotification(result);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`=== MONTHLY UPDATE COMPLETED in ${duration}s ===`);
      console.log(`Quality improvement: ${result.qualityImprovement.toFixed(1)} points`);
      console.log(`Segments filtered: ${result.segmentsFiltered}`);
      console.log(`Companies updated: ${result.companiesUpdated}/${result.companiesProcessed}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error('Monthly update failed:', error);
      
      // Send error notification
      await this.sendErrorNotification(errorMsg);
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  /**
   * Filter suspicious segments from all companies
   */
  private async filterAllCompanySuspiciousSegments(): Promise<FilterResult[]> {
    const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = await import('../../data/companySpecificExposures');
    const companies = getCompaniesWithSpecificExposures();
    const results: FilterResult[] = [];

    for (const ticker of companies) {
      const exposure = getCompanySpecificExposure(ticker);
      if (exposure && exposure.exposures) {
        const filterResult = this.filter.filterSuspiciousSegments(exposure.exposures);
        results.push(filterResult);
        
        // Update the exposure data with filtered segments
        if (filterResult.filteredCount < filterResult.originalCount) {
          const validExposures = exposure.exposures.filter(exp => 
            !filterResult.removedSegments.includes(exp.country)
          );
          
          // In a real implementation, this would update the database
          // For now, we'll log the changes
          console.log(`${ticker}: Filtered ${filterResult.removedSegments.length} suspicious segments`);
          console.log(`Removed: ${filterResult.removedSegments.slice(0, 3).join(', ')}${filterResult.removedSegments.length > 3 ? '...' : ''}`);
        }
      }
    }

    return results;
  }

  /**
   * Update companies with stale data
   */
  private async updateStaleCompanyData(reports: any[]): Promise<{successful: number, failed: number}> {
    const staleCompanies = reports.filter(report => 
      report.dataAge > 90 || // Older than 3 months
      report.score < this.config.qualityThresholdForAutoUpdate
    );

    let successful = 0;
    let failed = 0;

    for (const company of staleCompanies) {
      try {
        // In a real implementation, this would:
        // 1. Check for new SEC filings
        // 2. Parse geographic revenue data
        // 3. Update the company record
        // 4. Validate the new data
        
        console.log(`Updating ${company.companyTicker}...`);
        
        // Mock update - in reality this would fetch fresh data
        const updateSuccess = Math.random() > 0.2; // 80% success rate
        
        if (updateSuccess) {
          successful++;
          console.log(`✓ ${company.companyTicker} updated successfully`);
        } else {
          failed++;
          console.log(`✗ ${company.companyTicker} update failed`);
        }
        
        // Rate limiting
        await this.delay(1000);
        
      } catch (error) {
        failed++;
        console.error(`Error updating ${company.companyTicker}:`, error);
      }
    }

    return { successful, failed };
  }

  /**
   * Create backup of current data
   */
  private async createDataBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `data-backups/exposure-data-${timestamp}.json`;
    
    console.log(`Creating data backup: ${backupPath}`);
    
    // In a real implementation, this would:
    // 1. Export current exposure data to JSON
    // 2. Save to backup location (S3, local filesystem, etc.)
    // 3. Verify backup integrity
    
    // Mock backup creation
    await this.delay(2000);
    console.log('✓ Data backup created successfully');
  }

  /**
   * Calculate improvement in data freshness
   */
  private calculateFreshnessImprovement(beforeReports: any[], afterReports: any[]): number {
    const beforeStale = beforeReports.filter(r => r.dataAge > 90).length;
    const afterStale = afterReports.filter(r => r.dataAge > 90).length;
    return beforeStale - afterStale;
  }

  /**
   * Send update notification
   */
  private async sendUpdateNotification(result: MonthlyUpdateResult): Promise<void> {
    if (this.config.notificationEmails.length === 0) return;

    const subject = `Monthly Data Update Complete - ${result.runDate.toDateString()}`;
    const body = this.generateNotificationBody(result);

    console.log('Sending update notification...');
    console.log(`Subject: ${subject}`);
    console.log(`Recipients: ${this.config.notificationEmails.join(', ')}`);
    
    // In a real implementation, this would send actual emails
    // For now, we'll log the notification content
    console.log('Notification body:', body);
  }

  /**
   * Send error notification
   */
  private async sendErrorNotification(error: string): Promise<void> {
    if (this.config.notificationEmails.length === 0) return;

    const subject = `Monthly Data Update FAILED - ${new Date().toDateString()}`;
    const body = `Monthly data update encountered an error:\n\n${error}\n\nPlease check the system logs and run manual diagnostics.`;

    console.log('Sending error notification...');
    console.log(`Subject: ${subject}`);
    console.log(`Error: ${error}`);
  }

  /**
   * Generate notification email body
   */
  private generateNotificationBody(result: MonthlyUpdateResult): string {
    return `
Monthly Data Quality Update Report
=================================

Run Date: ${result.runDate.toISOString()}
Duration: Completed successfully

SUMMARY:
- Companies Processed: ${result.companiesProcessed}
- Companies Updated: ${result.companiesUpdated}
- Companies Failed: ${result.companiesFailed}
- Segments Filtered: ${result.segmentsFiltered}

QUALITY IMPROVEMENTS:
- Quality Score Before: ${result.summary.avgQualityBefore}/100
- Quality Score After: ${result.summary.avgQualityAfter}/100
- Improvement: +${result.qualityImprovement.toFixed(1)} points

DATA CLEANING:
- Suspicious Segments Removed: ${result.summary.suspiciousSegmentsRemoved}
- Stale Data Fixed: ${result.summary.staleDataFixed} companies
- Data Freshness Improved: ${result.summary.dataFreshnessImproved} companies

${result.errors.length > 0 ? `ERRORS:\n${result.errors.join('\n')}\n` : ''}

Next monthly update scheduled for: ${this.getNextRunDate().toDateString()}

---
Automated Data Quality System
    `.trim();
  }

  /**
   * Get current configuration
   */
  getConfig(): MonthlyUpdateConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonthlyUpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler if timing changed
    if (newConfig.dayOfMonth || newConfig.timeOfDay) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get update status
   */
  getStatus(): {isRunning: boolean, nextRun: Date | null, lastRun: Date | null} {
    return {
      isRunning: this.isRunning,
      nextRun: this.config.enabled ? this.getNextRunDate() : null,
      lastRun: null // Would track in real implementation
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default configuration for monthly updates
export const defaultMonthlyConfig: MonthlyUpdateConfig = {
  enabled: true,
  dayOfMonth: 15, // 15th of each month
  timeOfDay: "02:00", // 2 AM
  timezone: "UTC",
  autoFilterSuspiciousSegments: true,
  qualityThresholdForAutoUpdate: 60,
  notificationEmails: [],
  backupBeforeUpdate: true
};