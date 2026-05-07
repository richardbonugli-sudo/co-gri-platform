/**
 * Automated Data Updater for Company Geographic Exposures
 * 
 * This service handles periodic updates of company data from various sources
 * including SEC EDGAR filings, company websites, and manual data entry.
 */

import { DataQualityChecker, UpdateResult } from './DataQualityChecker';

export interface UpdateConfig {
  enableAutomaticUpdates: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dataSources: ('sec-edgar' | 'company-reports' | 'manual')[];
  qualityThreshold: number; // Minimum quality score to accept updates
  notificationEmail?: string;
}

export interface UpdateJob {
  id: string;
  ticker: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  result?: UpdateResult;
  error?: string;
}

export class AutoUpdater {
  private config: UpdateConfig;
  private checker: DataQualityChecker;
  private jobs: Map<string, UpdateJob> = new Map();

  constructor(config: UpdateConfig) {
    this.config = config;
    this.checker = new DataQualityChecker();
  }

  /**
   * Schedule periodic updates based on configuration
   */
  scheduleUpdates(): void {
    if (!this.config.enableAutomaticUpdates) {
      console.log('Automatic updates disabled');
      return;
    }

    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 90 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[this.config.updateFrequency];
    
    setInterval(async () => {
      await this.runScheduledUpdate();
    }, interval);

    console.log(`Scheduled updates every ${this.config.updateFrequency}`);
  }

  /**
   * Run a complete update cycle for all companies
   */
  async runScheduledUpdate(): Promise<void> {
    console.log('Starting scheduled data update...');
    
    try {
      // First, run quality check to identify companies needing updates
      const reports = await this.checker.runFullQualityCheck();
      
      // Filter companies that need updates (stale data or low quality)
      const companiesNeedingUpdate = reports.filter(report => 
        report.dataAge > 90 || // Data older than 3 months
        report.score < this.config.qualityThreshold ||
        report.issues.some(issue => issue.severity === 'HIGH')
      );

      console.log(`Found ${companiesNeedingUpdate.length} companies needing updates`);

      // Process updates in batches to avoid overwhelming external APIs
      const batchSize = 5;
      for (let i = 0; i < companiesNeedingUpdate.length; i += batchSize) {
        const batch = companiesNeedingUpdate.slice(i, i + batchSize);
        await Promise.all(batch.map(report => this.updateCompany(report.companyTicker)));
        
        // Wait between batches to respect rate limits
        await this.delay(2000);
      }

      console.log('Scheduled update completed');
      
      if (this.config.notificationEmail) {
        await this.sendUpdateNotification(companiesNeedingUpdate.length);
      }
    } catch (error) {
      console.error('Scheduled update failed:', error);
    }
  }

  /**
   * Update a single company's data
   */
  async updateCompany(ticker: string): Promise<UpdateJob> {
    const jobId = `${ticker}-${Date.now()}`;
    const job: UpdateJob = {
      id: jobId,
      ticker,
      status: 'PENDING',
      startTime: new Date()
    };

    this.jobs.set(jobId, job);

    try {
      job.status = 'RUNNING';
      
      // Try different data sources in order of preference
      let result: UpdateResult | null = null;
      
      for (const source of this.config.dataSources) {
        try {
          switch (source) {
            case 'sec-edgar':
              result = await this.updateFromSECEdgar(ticker);
              break;
            case 'company-reports':
              result = await this.updateFromCompanyReports(ticker);
              break;
            case 'manual':
              result = await this.requestManualUpdate(ticker);
              break;
          }
          
          if (result && result.status === 'SUCCESS') {
            break; // Success, no need to try other sources
          }
        } catch (error) {
          console.warn(`Failed to update ${ticker} from ${source}:`, error);
        }
      }

      job.result = result || {
        ticker,
        status: 'FAILED',
        updatedFields: [],
        errors: ['All data sources failed']
      };
      
      job.status = result?.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED';
      job.endTime = new Date();

    } catch (error) {
      job.status = 'FAILED';
      job.endTime = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return job;
  }

  /**
   * Update company data from SEC EDGAR filings
   */
  private async updateFromSECEdgar(ticker: string): Promise<UpdateResult> {
    // This would integrate with SEC EDGAR API
    // For now, return a mock implementation
    
    console.log(`Attempting to update ${ticker} from SEC EDGAR...`);
    
    // Simulate API call delay
    await this.delay(1000);
    
    // Mock implementation - in reality, this would:
    // 1. Query SEC EDGAR API for latest 10-K/10-Q filings
    // 2. Parse the XBRL data for geographic segments
    // 3. Extract revenue percentages by country
    // 4. Validate and clean the data
    // 5. Update the company exposure record
    
    return {
      ticker,
      status: 'FAILED',
      updatedFields: [],
      errors: ['SEC EDGAR integration not yet implemented']
    };
  }

  /**
   * Update company data from annual reports
   */
  private async updateFromCompanyReports(ticker: string): Promise<UpdateResult> {
    console.log(`Attempting to update ${ticker} from company reports...`);
    
    // This would:
    // 1. Check company investor relations website
    // 2. Download latest annual report PDF
    // 3. Parse geographic revenue sections
    // 4. Extract country-specific data
    
    return {
      ticker,
      status: 'FAILED',
      updatedFields: [],
      errors: ['Company report parsing not yet implemented']
    };
  }

  /**
   * Request manual update (create task for human reviewer)
   */
  private async requestManualUpdate(ticker: string): Promise<UpdateResult> {
    console.log(`Creating manual update request for ${ticker}...`);
    
    // This would:
    // 1. Create a task in a task management system
    // 2. Send notification to data analysts
    // 3. Provide template for manual data entry
    
    return {
      ticker,
      status: 'PARTIAL',
      updatedFields: ['manual_review_requested'],
      errors: [],
      newDataSource: 'Manual review request created'
    };
  }

  /**
   * Get status of all update jobs
   */
  getJobStatus(): UpdateJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    );
  }

  /**
   * Get jobs for a specific ticker
   */
  getJobsForTicker(ticker: string): UpdateJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.ticker === ticker)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Send notification about update results
   */
  private async sendUpdateNotification(companiesUpdated: number): Promise<void> {
    // This would integrate with email service
    console.log(`Update notification: ${companiesUpdated} companies processed`);
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old job records
   */
  cleanupOldJobs(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.startTime.getTime() < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Example configuration
export const defaultUpdateConfig: UpdateConfig = {
  enableAutomaticUpdates: true,
  updateFrequency: 'monthly',
  dataSources: ['sec-edgar', 'company-reports', 'manual'],
  qualityThreshold: 70,
  notificationEmail: 'data-team@company.com'
};