/**
 * Channel Multiplier Calculation with Dynamic Adjustments - Phase 2 Task 2
 * 
 * Integrates dynamic adjustments from geopolitical events and market conditions
 * into the channel multiplier calculation system from Task 1.
 */

import {
  calculateChannelMultiplier,
  calculateBlendedChannelMultiplier,
  type ChannelExposureData,
  type ChannelMultiplierResult,
  type BlendedChannelMultiplierResult
} from './channelMultiplierCalculation';
import {
  calculateAllDynamicAdjustments,
  type DynamicAdjustmentResult
} from './dynamicAdjustmentRules';
import {
  logDynamicAdjustment,
  getAdjustmentHistory,
  type AdjustmentHistoryEntry
} from './adjustmentHistoryTracker';
import { isFeatureEnabled } from '@/config/featureFlags';

/**
 * Enhanced channel multiplier result with dynamic adjustments
 */
export interface DynamicChannelMultiplierResult extends BlendedChannelMultiplierResult {
  dynamicAdjustments?: DynamicAdjustmentResult;
  adjustmentHistory?: AdjustmentHistoryEntry;
  isDynamic: boolean;
  finalBlendedMultiplier: number;
}

/**
 * Calculate channel multipliers with optional dynamic adjustments
 * 
 * This function extends the base channel multiplier calculation with dynamic adjustments
 * based on geopolitical events and market conditions.
 * 
 * @param channelExposures - Channel exposure data
 * @param country - Primary country for dynamic adjustments
 * @param sector - Sector for dynamic adjustments
 * @param ticker - Optional ticker for history tracking
 * @returns Enhanced channel multiplier result with dynamic adjustments
 */
export function calculateChannelMultipliersWithDynamic(
  channelExposures: ChannelExposureData[],
  country: string,
  sector: string,
  ticker?: string
): DynamicChannelMultiplierResult {
  console.log(`[Dynamic Channel Multiplier] ===== STARTING CALCULATION =====`);
  console.log(`[Dynamic Channel Multiplier] Country: ${country}, Sector: ${sector}, Ticker: ${ticker || 'N/A'}`);
  console.log(`[Dynamic Channel Multiplier] Dynamic Adjustments: ${isFeatureEnabled('enableDynamicMultipliers') ? 'ENABLED' : 'DISABLED'}`);
  
  // Step 1: Calculate base channel multipliers (Task 1)
  const baseResult = calculateBlendedChannelMultiplier(channelExposures);
  
  console.log(`[Dynamic Channel Multiplier] Base blended multiplier: ${baseResult.blendedMultiplier.toFixed(4)}`);
  
  // Step 2: Check if dynamic adjustments are enabled
  if (!isFeatureEnabled('enableDynamicMultipliers')) {
    console.log(`[Dynamic Channel Multiplier] Dynamic adjustments disabled, using base multipliers`);
    
    return {
      ...baseResult,
      isDynamic: false,
      finalBlendedMultiplier: baseResult.blendedMultiplier
    };
  }
  
  // Step 3: Calculate dynamic adjustments
  console.log(`[Dynamic Channel Multiplier] Calculating dynamic adjustments...`);
  
  const baseMultipliers = {
    revenue: baseResult.channelResults.find(r => r.channel === 'Revenue')?.adjustedMultiplier || 1.00,
    supply: baseResult.channelResults.find(r => r.channel === 'Supply')?.adjustedMultiplier || 1.05,
    assets: baseResult.channelResults.find(r => r.channel === 'Assets')?.adjustedMultiplier || 1.03,
    financial: baseResult.channelResults.find(r => r.channel === 'Financial')?.adjustedMultiplier || 1.02
  };
  
  const dynamicAdjustments = calculateAllDynamicAdjustments(
    country,
    sector,
    baseMultipliers
  );
  
  console.log(`[Dynamic Channel Multiplier] Dynamic blended multiplier: ${dynamicAdjustments.blendedAdjustment.toFixed(4)}`);
  console.log(`[Dynamic Channel Multiplier] Dynamic impact: ${((dynamicAdjustments.blendedAdjustment - baseResult.blendedMultiplier) * 100).toFixed(2)}%`);
  
  // Step 4: Log adjustment to history
  const historyEntry = logDynamicAdjustment(
    dynamicAdjustments,
    baseMultipliers,
    ticker,
    'system',
    `Dynamic adjustment applied based on geopolitical events and market conditions`
  );
  
  // Step 5: Build enhanced result
  const enhancedResult: DynamicChannelMultiplierResult = {
    ...baseResult,
    blendedMultiplier: baseResult.blendedMultiplier, // Keep base for comparison
    dynamicAdjustments,
    adjustmentHistory: historyEntry,
    isDynamic: true,
    finalBlendedMultiplier: dynamicAdjustments.blendedAdjustment
  };
  
  console.log(`[Dynamic Channel Multiplier] ===== CALCULATION COMPLETE =====`);
  console.log(`[Dynamic Channel Multiplier] Final blended multiplier: ${enhancedResult.finalBlendedMultiplier.toFixed(4)}`);
  
  return enhancedResult;
}

/**
 * Get channel multipliers with dynamic adjustments for a company
 * 
 * Convenience function that extracts country and sector from company data
 */
export function getCompanyChannelMultipliers(
  channelExposures: ChannelExposureData[],
  companyData: {
    ticker: string;
    country: string;
    sector: string;
  }
): DynamicChannelMultiplierResult {
  return calculateChannelMultipliersWithDynamic(
    channelExposures,
    companyData.country,
    companyData.sector,
    companyData.ticker
  );
}

/**
 * Compare base vs dynamic multipliers
 */
export function compareDynamicImpact(
  channelExposures: ChannelExposureData[],
  country: string,
  sector: string
): {
  baseMultiplier: number;
  dynamicMultiplier: number;
  impact: number;
  percentageChange: number;
  isSignificant: boolean; // > 5% change
} {
  const result = calculateChannelMultipliersWithDynamic(channelExposures, country, sector);
  
  const impact = result.finalBlendedMultiplier - result.blendedMultiplier;
  const percentageChange = (impact / result.blendedMultiplier) * 100;
  const isSignificant = Math.abs(percentageChange) > 5;
  
  return {
    baseMultiplier: result.blendedMultiplier,
    dynamicMultiplier: result.finalBlendedMultiplier,
    impact,
    percentageChange,
    isSignificant
  };
}

/**
 * Get dynamic adjustment summary for a ticker
 */
export function getDynamicAdjustmentSummary(ticker: string): {
  hasHistory: boolean;
  totalAdjustments: number;
  lastAdjustment?: AdjustmentHistoryEntry;
  currentMultipliers?: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
    blended: number;
  };
} {
  const history = getAdjustmentHistory(ticker);
  
  if (history.length === 0) {
    return {
      hasHistory: false,
      totalAdjustments: 0
    };
  }
  
  const lastAdjustment = history[history.length - 1];
  
  return {
    hasHistory: true,
    totalAdjustments: history.length,
    lastAdjustment,
    currentMultipliers: {
      revenue: lastAdjustment.adjustments.revenue.after,
      supply: lastAdjustment.adjustments.supply.after,
      assets: lastAdjustment.adjustments.assets.after,
      financial: lastAdjustment.adjustments.financial.after,
      blended: lastAdjustment.blendedMultiplier.after
    }
  };
}