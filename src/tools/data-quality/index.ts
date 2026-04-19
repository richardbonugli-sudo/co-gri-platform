/**
 * Enhanced Data Quality Tools Export
 * 
 * Centralized export for all data quality monitoring, filtering, and updating tools
 */

export { DataQualityChecker } from './DataQualityChecker';
export { SegmentFilter } from './SegmentFilter';
export { MonthlyUpdater, defaultMonthlyConfig } from './MonthlyUpdater';
export { EnhancedDataQualityDashboard } from './EnhancedDashboard';

export type {
  DataQualityReport,
  DataQualityIssue,
  UpdateResult
} from './DataQualityChecker';

export type {
  FilterResult,
  GeographicSegment
} from './SegmentFilter';

export type {
  MonthlyUpdateConfig,
  MonthlyUpdateResult
} from './MonthlyUpdater';

// Enhanced initialization function with monthly updates and filtering
export function initializeEnhancedDataQualitySystem(config?: Partial<import('./MonthlyUpdater').MonthlyUpdateConfig>) {
  const { MonthlyUpdater, defaultMonthlyConfig } = require('./MonthlyUpdater');
  
  const finalConfig = { ...defaultMonthlyConfig, ...config };
  const updater = new MonthlyUpdater(finalConfig);
  
  // Start monthly update scheduler
  if (finalConfig.enabled) {
    updater.start();
    console.log('Monthly data quality updates enabled');
    console.log(`Next update: ${updater.getStatus().nextRun?.toISOString()}`);
  }
  
  // Clean up old jobs daily
  setInterval(() => {
    // In a real implementation, this would clean up job history
    console.log('Performing daily cleanup of old update jobs');
  }, 24 * 60 * 60 * 1000);
  
  return {
    updater,
    config: finalConfig,
    status: updater.getStatus()
  };
}

// Utility function to run one-time segment filtering
export async function runSegmentFiltering() {
  const { SegmentFilter } = require('./SegmentFilter');
  const filter = new SegmentFilter();
  
  const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = await import('../data/companySpecificExposures');
  const companies = getCompaniesWithSpecificExposures();
  const results = [];
  
  for (const ticker of companies) {
    const exposure = getCompanySpecificExposure(ticker);
    if (exposure && exposure.exposures) {
      const filterResult = filter.filterSuspiciousSegments(exposure.exposures);
      results.push({ ticker, ...filterResult });
    }
  }
  
  return {
    results,
    stats: filter.getFilteringStats(results)
  };
}