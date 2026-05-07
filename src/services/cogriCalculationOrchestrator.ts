/**
 * COGRI Calculation Orchestrator - Phase 2 Enhanced
 * 
 * Central orchestration layer that routes between legacy, Phase 1, and Phase 2 calculations
 * based on feature flags and user preferences.
 * 
 * ROUTING LOGIC:
 * - Phase 2: Channel-specific multipliers (if enableChannelSpecificMultipliers = true)
 * - Phase 1: Sector multiplier transparency (if enableEnhancedCalculation = true)
 * - Legacy: Standard calculation (if both disabled)
 */

import { 
  calculateCOGRIScore,
  COGRICalculationInput,
  COGRICalculationResult
} from './cogriCalculationService';
import { 
  calculateEnhancedCOGRIScore,
  EnhancedCOGRICalculationResult
} from './cogriCalculationServiceEnhanced';
import {
  calculateBlendedChannelMultiplier,
  calculateChannelMultiplierImpact,
  generateChannelMultiplierReport,
  validateChannelMultiplierCalculation,
  type ChannelExposureData,
  type BlendedChannelMultiplierResult
} from './channelMultiplierCalculation';
import { getFeatureFlags } from '@/config/featureFlags';

/**
 * Phase 2 COGRI calculation result with channel multipliers
 */
export interface Phase2COGRICalculationResult extends EnhancedCOGRICalculationResult {
  channelMultiplierDetails: {
    blendedMultiplier: number;
    channelResults: Array<{
      channel: string;
      baseMultiplier: number;
      adjustedMultiplier: number;
      riskAdjustment: number;
      confidence: number;
      rationale: string;
      activeRiskFactors: string[];
      warnings: string[];
    }>;
    weights: {
      revenue: number;
      supply: number;
      assets: number;
      financial: number;
    };
    totalRiskAdjustment: number;
    overallConfidence: number;
    methodology: string;
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    report: string;
  };
  finalScoreWithChannelMultiplier: number;
  channelMultiplierImpact: {
    withoutChannelMultiplier: number;
    withChannelMultiplier: number;
    channelImpact: number;
    percentageChange: number;
  };
}

export type COGRIResult = COGRICalculationResult | EnhancedCOGRICalculationResult | Phase2COGRICalculationResult;

/**
 * Check if result is Phase 2 enhanced (has channel multipliers)
 */
export function isPhase2Result(result: COGRIResult): result is Phase2COGRICalculationResult {
  return 'channelMultiplierDetails' in result;
}

/**
 * Check if result is enhanced (has Phase 1 transparency)
 */
export function isEnhancedResult(result: COGRIResult): result is EnhancedCOGRICalculationResult {
  return 'sectorMultiplierDetails' in result;
}

/**
 * Orchestrate COGRI calculation based on feature flags
 * 
 * Routes to:
 * - Phase 2 calculation (channel multipliers) if enabled
 * - Phase 1 calculation (sector transparency) if enabled
 * - Legacy calculation if both disabled
 * 
 * @param input - COGRI calculation input
 * @returns COGRI result (Phase 2, Phase 1, or legacy)
 */
export function orchestrateCOGRICalculation(
  input: COGRICalculationInput
): COGRIResult {
  const flags = getFeatureFlags();
  
  console.log(`[COGRI Orchestrator] Starting calculation orchestration`);
  console.log(`[COGRI Orchestrator] Phase 1 enabled: ${flags.enableEnhancedCalculation}`);
  console.log(`[COGRI Orchestrator] Phase 2 enabled: ${flags.enableChannelSpecificMultipliers}`);
  
  // Phase 2: Channel-specific multipliers (highest priority)
  if (flags.enableChannelSpecificMultipliers && flags.enableEnhancedCalculation) {
    console.log(`[COGRI Orchestrator] Using Phase 2 Calculation (Channel Multipliers)`);
    return calculatePhase2COGRIScore(input);
  }
  
  // Phase 1: Sector multiplier transparency
  if (flags.enableEnhancedCalculation) {
    console.log(`[COGRI Orchestrator] Using Enhanced Calculation (Phase 1)`);
    return calculateEnhancedCOGRIScore(input);
  }
  
  // Legacy: Standard calculation
  console.log(`[COGRI Orchestrator] Using Legacy Calculation`);
  return calculateCOGRIScore(input);
}

/**
 * Calculate COGRI score with Phase 2 channel multipliers
 */
function calculatePhase2COGRIScore(
  input: COGRICalculationInput
): Phase2COGRICalculationResult {
  console.log(`[Phase 2 COGRI] ===== STARTING PHASE 2 CALCULATION =====`);
  console.log(`[Phase 2 COGRI] Segments: ${input.segments.length}`);
  console.log(`[Phase 2 COGRI] Sector: ${input.sector}`);
  
  // Step 1: Calculate Phase 1 result (with sector transparency)
  const phase1Result = calculateEnhancedCOGRIScore(input);
  
  console.log(`[Phase 2 COGRI] Phase 1 calculation complete`);
  console.log(`[Phase 2 COGRI]   Raw Score: ${phase1Result.rawScore.toFixed(4)}`);
  console.log(`[Phase 2 COGRI]   Sector Multiplier: ${phase1Result.sectorMultiplier.toFixed(4)}`);
  console.log(`[Phase 2 COGRI]   Phase 1 Final Score: ${phase1Result.finalScore.toFixed(1)}`);
  
  // Step 2: Extract channel exposure data
  const channelExposures: ChannelExposureData[] = [];
  
  if (input.channelBreakdown) {
    console.log(`[Phase 2 COGRI] Extracting channel exposure data from channel breakdown`);
    
    const channelData: Record<string, ChannelExposureData> = {
      'Revenue': { channel: 'Revenue', exposureWeight: 0, countries: [] },
      'Supply': { channel: 'Supply', exposureWeight: 0, countries: [] },
      'Assets': { channel: 'Assets', exposureWeight: 0, countries: [] },
      'Financial': { channel: 'Financial', exposureWeight: 0, countries: [] }
    };
    
    Object.entries(input.channelBreakdown).forEach(([country, breakdown]) => {
      const countryRisk = phase1Result.countryExposures.find(ce => ce.country === country)?.countryShockIndex || 50;
      
      if (breakdown.revenue) {
        channelData['Revenue'].exposureWeight += breakdown.revenue.weight;
        channelData['Revenue'].countries.push({ country, weight: breakdown.revenue.weight, riskScore: countryRisk });
      }
      
      if (breakdown.supply) {
        channelData['Supply'].exposureWeight += breakdown.supply.weight;
        channelData['Supply'].countries.push({ country, weight: breakdown.supply.weight, riskScore: countryRisk });
      }
      
      if (breakdown.assets) {
        channelData['Assets'].exposureWeight += breakdown.assets.weight;
        channelData['Assets'].countries.push({ country, weight: breakdown.assets.weight, riskScore: countryRisk });
      }
      
      if (breakdown.operations) {
        channelData['Financial'].exposureWeight += breakdown.operations.weight;
        channelData['Financial'].countries.push({ country, weight: breakdown.operations.weight, riskScore: countryRisk });
      }
    });
    
    channelExposures.push(...Object.values(channelData));
  } else {
    console.log(`[Phase 2 COGRI] No channel breakdown, using default multipliers`);
    
    const defaultChannels: Array<'Revenue' | 'Supply' | 'Assets' | 'Financial'> = ['Revenue', 'Supply', 'Assets', 'Financial'];
    defaultChannels.forEach(channel => {
      channelExposures.push({
        channel,
        exposureWeight: 0.25,
        countries: phase1Result.countryExposures.map(ce => ({
          country: ce.country,
          weight: ce.exposureWeight / 4,
          riskScore: ce.countryShockIndex
        }))
      });
    });
  }
  
  // Step 3: Calculate blended channel multiplier
  const blendedChannelResult = calculateBlendedChannelMultiplier(channelExposures);
  
  // Step 4: Apply channel multiplier
  const finalScoreWithChannelMultiplier = phase1Result.finalScore * blendedChannelResult.blendedMultiplier;
  
  // Step 5: Calculate impact
  const channelMultiplierImpact = calculateChannelMultiplierImpact(
    phase1Result.rawScore,
    phase1Result.sectorMultiplier,
    blendedChannelResult.blendedMultiplier
  );
  
  // Step 6: Validate
  const validation = validateChannelMultiplierCalculation(blendedChannelResult);
  
  // Step 7: Generate report
  const report = generateChannelMultiplierReport(blendedChannelResult);
  
  console.log(`[Phase 2 COGRI] ===== PHASE 2 CALCULATION COMPLETE =====`);
  console.log(`[Phase 2 COGRI] Phase 2 Final Score: ${finalScoreWithChannelMultiplier.toFixed(1)}`);
  
  return {
    ...phase1Result,
    finalScore: finalScoreWithChannelMultiplier,
    channelMultiplierDetails: {
      blendedMultiplier: blendedChannelResult.blendedMultiplier,
      channelResults: blendedChannelResult.channelResults,
      weights: blendedChannelResult.weights,
      totalRiskAdjustment: blendedChannelResult.totalRiskAdjustment,
      overallConfidence: blendedChannelResult.overallConfidence,
      methodology: blendedChannelResult.methodology,
      validation,
      report
    },
    finalScoreWithChannelMultiplier,
    channelMultiplierImpact
  };
}

/**
 * Get calculation mode description
 */
export function getCalculationMode(): {
  mode: 'phase2' | 'enhanced' | 'legacy';
  description: string;
  features: string[];
} {
  const flags = getFeatureFlags();
  
  if (flags.enableChannelSpecificMultipliers && flags.enableEnhancedCalculation) {
    return {
      mode: 'phase2',
      description: 'Phase 2: Channel-Specific Multipliers with Sector Transparency',
      features: [
        'Channel-specific risk multipliers (Revenue, Supply, Assets, Financial)',
        'Blended four-channel multiplier calculation',
        'Risk factor analysis per channel',
        'Sector multiplier validation and transparency',
        'Historical multiplier tracking',
        'Context-aware warnings',
        'Confidence scoring'
      ]
    };
  }
  
  if (flags.enableEnhancedCalculation) {
    return {
      mode: 'enhanced',
      description: 'Enhanced COGRI with Phase 1 Sector Multiplier Transparency',
      features: [
        'Sector multiplier validation',
        'Detailed rationale and risk factors',
        'Historical multiplier tracking',
        'Context-aware warnings',
        'Confidence scoring'
      ]
    };
  }
  
  return {
    mode: 'legacy',
    description: 'Standard COGRI Calculation',
    features: [
      'Four-channel exposure blending',
      'Country Shock Index application',
      'Political alignment amplification',
      'Sector multiplier adjustment'
    ]
  };
}

/**
 * Compare results between legacy and enhanced calculations
 * Useful for validation and A/B testing
 */
export function compareCalculations(
  input: COGRICalculationInput
): {
  legacy: COGRICalculationResult;
  enhanced: EnhancedCOGRICalculationResult;
  differences: {
    finalScoreMatch: boolean;
    rawScoreMatch: boolean;
    riskLevelMatch: boolean;
    details: string[];
  };
} {
  console.log(`[COGRI Orchestrator] Running comparison between legacy and enhanced`);
  
  const legacy = calculateCOGRIScore(input);
  const enhanced = calculateEnhancedCOGRIScore(input);
  
  const differences: string[] = [];
  const tolerance = 0.01;
  
  const finalScoreMatch = Math.abs(legacy.finalScore - enhanced.finalScore) < tolerance;
  const rawScoreMatch = Math.abs(legacy.rawScore - enhanced.rawScore) < tolerance;
  const riskLevelMatch = legacy.riskLevel === enhanced.riskLevel;
  
  if (!finalScoreMatch) {
    differences.push(`Final score mismatch: ${legacy.finalScore} vs ${enhanced.finalScore}`);
  }
  
  if (!rawScoreMatch) {
    differences.push(`Raw score mismatch: ${legacy.rawScore} vs ${enhanced.rawScore}`);
  }
  
  if (!riskLevelMatch) {
    differences.push(`Risk level mismatch: ${legacy.riskLevel} vs ${enhanced.riskLevel}`);
  }
  
  console.log(`[COGRI Orchestrator] Comparison complete: ${differences.length} differences found`);
  
  return {
    legacy,
    enhanced,
    differences: {
      finalScoreMatch,
      rawScoreMatch,
      riskLevelMatch,
      details: differences
    }
  };
}