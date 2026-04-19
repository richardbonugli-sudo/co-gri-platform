/**
 * Data Quality System Configuration
 * 
 * Production configuration for monthly updates and segment filtering
 */

import { MonthlyUpdateConfig } from './MonthlyUpdater';

export const productionConfig: MonthlyUpdateConfig = {
  enabled: true,
  dayOfMonth: 15,                              // Run on 15th of each month
  timeOfDay: "02:00",                         // 2 AM UTC (optimal low-traffic time)
  timezone: "UTC",
  autoFilterSuspiciousSegments: true,         // Enable automatic segment filtering
  qualityThresholdForAutoUpdate: 60,          // Update companies with score < 60
  notificationEmails: [
    "data-team@company.com",                  // Replace with actual email
    "risk-management@company.com"             // Replace with actual email
  ],
  backupBeforeUpdate: true                    // Always backup before updates
};

export const developmentConfig: MonthlyUpdateConfig = {
  enabled: false,                             // Disabled in development
  dayOfMonth: 1,
  timeOfDay: "09:00",
  timezone: "UTC", 
  autoFilterSuspiciousSegments: true,
  qualityThresholdForAutoUpdate: 70,
  notificationEmails: [],
  backupBeforeUpdate: false
};

// Use production config by default
export const defaultConfig = productionConfig;