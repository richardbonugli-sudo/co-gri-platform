/**
 * Initialize Baseline - One-time initialization of baseline CSI values
 * 
 * Reads current GLOBAL_COUNTRIES array and creates BaselineCSI records.
 * This should be run once on first load to populate the baseline manager.
 */

import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { baselineManager } from './baselineManager';

let initialized = false;

/**
 * Initialize baseline CSI values from current static data
 */
export function initializeBaselines(): void {
  if (initialized) {
    console.log('[Initialize Baseline] ⏭️ Already initialized, skipping');
    return;
  }

  console.log('[Initialize Baseline] 🚀 Starting baseline initialization...');

  let successCount = 0;
  let errorCount = 0;

  for (const country of GLOBAL_COUNTRIES) {
    try {
      baselineManager.createBaseline(country.country, country.csi);
      successCount++;
    } catch (error) {
      console.error(`[Initialize Baseline] ❌ Failed to create baseline for ${country.country}:`, error);
      errorCount++;
    }
  }

  initialized = true;

  console.log(`[Initialize Baseline] ✅ Initialization complete: ${successCount} baselines created, ${errorCount} errors`);
  console.log(`[Initialize Baseline] 📊 Total baselines: ${baselineManager.getBaselineCount()}`);
}

/**
 * Check if baselines are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetInitialization(): void {
  initialized = false;
  baselineManager.clear();
  console.log('[Initialize Baseline] 🔄 Reset initialization state');
}
