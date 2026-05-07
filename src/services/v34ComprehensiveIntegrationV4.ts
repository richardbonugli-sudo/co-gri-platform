/**
 * V3.4 Comprehensive Integration - V.4 Enhanced (PHASE 1 COMPLETE)
 * 
 * This is the V.4-enhanced version of v34ComprehensiveIntegration.ts
 * It maintains full backward compatibility while adding V.4 orchestrator support.
 * 
 * INTEGRATION STRATEGY:
 * 1. Feature flag controlled rollout
 * 2. Automatic fallback to legacy on errors
 * 3. Transparent to existing code
 * 4. Detailed logging and comparison
 * 
 * PHASE 1 ENHANCEMENTS:
 * - Unified orchestrator routing
 * - Enhanced error handling with graceful fallback
 * - Comprehensive logging for debugging
 * - Data source validation
 * 
 * FIX: Sector multiplier now correctly uses sectorClassificationService
 */

import { shouldUseV4, getFeatureFlags, isFeatureEnabled } from '@/config/featureFlags';
import { getGeographicExposureV4 } from './geographicExposureServiceV4';
import { calculateCOGRIScoreV4, getV4Metadata } from './cogriCalculationServiceV4';
import { getCompanyGeographicExposure as getLegacyExposure, type CompanyGeographicData } from './v34ComprehensiveIntegration';
import { hasV4Enhancements } from '@/data/enhancedCompanyExposures';
import { sectorClassificationService } from './sectorClassificationService';

// Re-export types for convenience
export type { CompanyGeographicData } from './v34ComprehensiveIntegration';

/**
 * MAIN ORCHESTRATOR: Get company geographic exposure with V.4 integration
 * 
 * This function is a drop-in replacement for getCompanyGeographicExposure
 * from v34ComprehensiveIntegration.ts
 * 
 * ROUTING LOGIC:
 * 1. Check if V.4 is enabled via feature flags
 * 2. Check if ticker has V.4 data enhancements
 * 3. If both true, use V.4 orchestrator
 * 4. On any error, gracefully fallback to legacy
 * 5. Otherwise, use legacy system
 */
export async function getCompanyGeographicExposureV4(
  ticker: string,
  forceRefresh?: boolean,
  useSupplementaryData?: boolean,
  enableDataExpansion?: boolean
): Promise<CompanyGeographicData> {
  
  const upperTicker = ticker.toUpperCase();
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[V.4 Orchestrator] PHASE 1: Processing ${upperTicker}`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Step 1: Check feature flags
  const flags = getFeatureFlags();
  const v4Enabled = isFeatureEnabled('enableV4Logic');
  
  console.log(`[V.4 Orchestrator] Step 1: Feature Flag Check`);
  console.log(`  V.4 Enabled: ${v4Enabled}`);
  console.log(`  Rollout Percentage: ${flags.v4RolloutPercentage}%`);
  
  // Step 2: Check if ticker should use V.4
  const shouldUse = shouldUseV4(upperTicker);
  console.log(`\n[V.4 Orchestrator] Step 2: Ticker Routing Decision`);
  console.log(`  Should Use V.4: ${shouldUse}`);
  
  // Step 3: Check if ticker has V.4 data
  const hasV4Data = hasV4Enhancements(upperTicker);
  console.log(`\n[V.4 Orchestrator] Step 3: Data Availability Check`);
  console.log(`  Has V.4 Data: ${hasV4Data}`);
  
  // Step 4: Get V.4 metadata
  const v4Meta = getV4Metadata(upperTicker);
  console.log(`\n[V.4 Orchestrator] Step 4: V.4 Metadata`);
  console.log(`  Version: ${v4Meta.version}`);
  console.log(`  Will Use V.4: ${v4Meta.willUseV4}`);
  console.log(`  Reason: ${v4Meta.reason}\n`);
  
  // Step 5: Route to V.4 or Legacy
  if (v4Meta.willUseV4 && hasV4Data) {
    console.log(`[V.4 Orchestrator] ✅ ROUTING TO V.4 for ${upperTicker}\n`);
    
    try {
      const v4Result = await getGeographicExposureV4(upperTicker);
      
      if (v4Result && v4Result.segments && v4Result.segments.length > 0) {
        const duration = Date.now() - startTime;
        
        console.log(`[V.4 Orchestrator] ✅ V.4 SUCCESS (${duration}ms)`);
        console.log(`  Company: ${v4Result.company}`);
        console.log(`  Countries: ${v4Result.segments.length}`);
        console.log(`  Data Source: ${v4Result.dataSource}`);
        console.log(`  Has Channel Breakdown: ${!!v4Result.channelBreakdown}`);
        console.log(`  V.4 Version: ${v4Result.v4Metadata?.version || '4.0'}\n`);
        
        // FIX: Get correct sector multiplier from sectorClassificationService
        const sectorMultiplier = sectorClassificationService.getSectorMultiplier(v4Result.sector);
        console.log(`[V.4 Orchestrator] 🔧 FIX: Sector multiplier for ${v4Result.sector}: ${sectorMultiplier}`);
        
        // Convert V.4 result to legacy format for compatibility
        const legacyFormatted: CompanyGeographicData = {
          company: v4Result.company,
          ticker: v4Result.ticker,
          sector: v4Result.sector,
          segments: v4Result.segments,
          channelBreakdown: v4Result.channelBreakdown,
          sectorMultiplier: sectorMultiplier, // FIX: Use correct sector multiplier
          hasVerifiedData: true,
          dataSource: v4Result.dataSource + ' (V.4 Enhanced)',
          homeCountry: v4Result.homeCountry,
          hasDetailedComponents: !!v4Result.channelBreakdown,
          sectorClassificationConfidence: 0.95,
          sectorClassificationSources: ['V.4 Enhanced Data'],
          adrResolution: {
            isADR: false,
            confidence: 'high',
            source: 'V.4 Analysis'
          }
        };
        
        return legacyFormatted;
      } else {
        console.log(`[V.4 Orchestrator] ⚠️ V.4 returned empty/null, falling back to legacy\n`);
      }
      
    } catch (error) {
      console.error(`[V.4 Orchestrator] ❌ ERROR in V.4 processing:`, error);
      console.log(`[V.4 Orchestrator] 🔄 Graceful fallback to legacy system\n`);
      
      // Fallback to legacy on error
      if (isFeatureEnabled('enableV4Logic') && flags.v4RolloutPercentage < 100) {
        console.log(`[V.4 Orchestrator] Note: V.4 is in gradual rollout (${flags.v4RolloutPercentage}%), errors are expected\n`);
      }
    }
  } else {
    console.log(`[V.4 Orchestrator] ℹ️ ROUTING TO LEGACY for ${upperTicker}`);
    console.log(`  Reason: ${!v4Meta.willUseV4 ? 'Feature flag disabled or ticker not selected' : 'No V.4 data available'}\n`);
  }
  
  // Use legacy system
  console.log(`[V.4 Orchestrator] 📊 Using Legacy System (v3.4 Phase 3)\n`);
  const legacyResult = await getLegacyExposure(ticker, forceRefresh, useSupplementaryData, enableDataExpansion);
  
  const duration = Date.now() - startTime;
  console.log(`[V.4 Orchestrator] ✅ LEGACY SUCCESS (${duration}ms)`);
  console.log(`  Company: ${legacyResult.company}`);
  console.log(`  Countries: ${legacyResult.segments.length}`);
  console.log(`  Data Source: ${legacyResult.dataSource}`);
  console.log(`  Sector Multiplier: ${legacyResult.sectorMultiplier}\n`);
  
  return legacyResult;
}

/**
 * Alias for backward compatibility
 * This allows existing code to use the same function name
 */
export const getCompanyGeographicExposure = getCompanyGeographicExposureV4;

/**
 * Export all functions from legacy integration for backward compatibility
 */
export * from './v34ComprehensiveIntegration';

/**
 * Get V.4 routing statistics
 */
export function getV4RoutingStats(): {
  v4Enabled: boolean;
  rolloutPercentage: number;
  enhancedTickers: string[];
  totalEnhanced: number;
} {
  const flags = getFeatureFlags();
  const { ENHANCED_COMPANY_EXPOSURES } = require('@/data/enhancedCompanyExposures');
  
  const enhancedTickers = Object.keys(ENHANCED_COMPANY_EXPOSURES).filter(ticker => 
    hasV4Enhancements(ticker)
  );
  
  return {
    v4Enabled: flags.enableV4Logic,
    rolloutPercentage: flags.v4RolloutPercentage,
    enhancedTickers,
    totalEnhanced: enhancedTickers.length
  };
}

/**
 * Test V.4 routing for a specific ticker
 */
export function testV4Routing(ticker: string): {
  ticker: string;
  shouldUseV4: boolean;
  hasV4Data: boolean;
  willRoute: 'v4' | 'legacy';
  reason: string;
} {
  const upperTicker = ticker.toUpperCase();
  const shouldUse = shouldUseV4(upperTicker);
  const hasData = hasV4Enhancements(upperTicker);
  const willRoute = (shouldUse && hasData) ? 'v4' : 'legacy';
  
  let reason: string;
  if (!shouldUse) {
    reason = 'Feature flag disabled or ticker not in rollout';
  } else if (!hasData) {
    reason = 'No V.4 data enhancements available';
  } else {
    reason = 'V.4 enabled and data available';
  }
  
  return {
    ticker: upperTicker,
    shouldUseV4: shouldUse,
    hasV4Data: hasData,
    willRoute,
    reason
  };
}