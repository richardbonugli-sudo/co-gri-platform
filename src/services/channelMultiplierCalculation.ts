/**
 * Channel Multiplier Calculation Service - Phase 2 Development
 * 
 * Implements channel-specific multiplier calculations for the four-channel COGRI model.
 * This service applies different risk multipliers to each channel based on:
 * - Channel-specific risk profiles
 * - Historical calibration data
 * - Active risk factors
 * - Country exposure patterns
 */

import {
  getChannelMultiplierMetadata,
  getAllChannelMultipliers,
  getChannelMultiplierWithConfidence,
  validateChannelMultiplier,
  type ChannelMultiplierMetadata
} from './channelMultiplierMetadata';
import {
  getRiskFactorsByChannel,
  calculateChannelRiskImpact,
  type ChannelRiskFactor
} from '@/data/channelRiskFactors';

/**
 * Channel multiplier calculation result
 */
export interface ChannelMultiplierResult {
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  baseMultiplier: number;
  adjustedMultiplier: number;
  riskAdjustment: number;
  confidence: number;
  rationale: string;
  activeRiskFactors: string[];
  warnings: string[];
}

/**
 * Blended channel multiplier result
 */
export interface BlendedChannelMultiplierResult {
  blendedMultiplier: number;
  channelResults: ChannelMultiplierResult[];
  weights: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
  totalRiskAdjustment: number;
  overallConfidence: number;
  methodology: string;
}

/**
 * Channel exposure data for multiplier calculation
 */
export interface ChannelExposureData {
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  exposureWeight: number; // 0-1
  countries: Array<{
    country: string;
    weight: number;
    riskScore: number;
  }>;
  activeRiskFactorIds?: string[];
}

/**
 * Calculate channel-specific multiplier
 * 
 * @param channelData - Channel exposure data
 * @returns Channel multiplier result
 */
export function calculateChannelMultiplier(
  channelData: ChannelExposureData
): ChannelMultiplierResult {
  console.log(`[Channel Multiplier] Calculating multiplier for ${channelData.channel} channel`);
  
  // Step 1: Get base multiplier metadata
  const metadata = getChannelMultiplierMetadata(channelData.channel);
  const baseMultiplier = metadata.baseMultiplier;
  
  console.log(`[Channel Multiplier]   Base multiplier: ${baseMultiplier}`);
  
  // Step 2: Calculate risk adjustment based on active risk factors
  let riskAdjustment = 0;
  const activeRiskFactorIds = channelData.activeRiskFactorIds || [];
  
  if (activeRiskFactorIds.length > 0) {
    const riskImpact = calculateChannelRiskImpact(channelData.channel, activeRiskFactorIds);
    riskAdjustment = riskImpact.totalImpact;
    
    console.log(`[Channel Multiplier]   Active risk factors: ${riskImpact.riskCount}`);
    console.log(`[Channel Multiplier]   Risk adjustment: +${riskAdjustment.toFixed(4)}`);
  }
  
  // Step 3: Calculate adjusted multiplier
  const adjustedMultiplier = baseMultiplier + riskAdjustment;
  
  // Step 4: Validate multiplier appropriateness
  const warnings: string[] = [];
  
  channelData.countries.forEach(country => {
    const validation = validateChannelMultiplier(
      channelData.channel,
      country.weight,
      country.riskScore
    );
    
    warnings.push(...validation.warnings);
  });
  
  // Step 5: Calculate confidence score
  const confidence = metadata.confidenceScore * (1 - (warnings.length * 0.05)); // Reduce confidence by 5% per warning
  
  console.log(`[Channel Multiplier]   Adjusted multiplier: ${adjustedMultiplier.toFixed(4)}`);
  console.log(`[Channel Multiplier]   Confidence: ${(confidence * 100).toFixed(1)}%`);
  console.log(`[Channel Multiplier]   Warnings: ${warnings.length}`);
  
  return {
    channel: channelData.channel,
    baseMultiplier,
    adjustedMultiplier,
    riskAdjustment,
    confidence,
    rationale: metadata.rationale,
    activeRiskFactors: activeRiskFactorIds,
    warnings
  };
}

/**
 * Calculate blended channel multiplier
 * 
 * Combines channel-specific multipliers using the four-channel weights:
 * - Revenue: 40%
 * - Supply: 35%
 * - Assets: 15%
 * - Financial: 10%
 * 
 * @param channelExposures - Array of channel exposure data
 * @returns Blended multiplier result
 */
export function calculateBlendedChannelMultiplier(
  channelExposures: ChannelExposureData[]
): BlendedChannelMultiplierResult {
  console.log(`[Channel Multiplier] ===== CALCULATING BLENDED CHANNEL MULTIPLIER =====`);
  console.log(`[Channel Multiplier] Channels: ${channelExposures.length}`);
  
  // Four-channel weights (from COGRI methodology)
  const weights = {
    revenue: 0.40,
    supply: 0.35,
    assets: 0.15,
    financial: 0.10
  };
  
  // Calculate multiplier for each channel
  const channelResults: ChannelMultiplierResult[] = [];
  let blendedMultiplier = 0;
  let totalRiskAdjustment = 0;
  let totalConfidence = 0;
  
  channelExposures.forEach(channelData => {
    const result = calculateChannelMultiplier(channelData);
    channelResults.push(result);
    
    // Get channel weight
    const channelWeight = weights[channelData.channel.toLowerCase() as keyof typeof weights] || 0;
    
    // Blend multiplier
    blendedMultiplier += result.adjustedMultiplier * channelWeight;
    totalRiskAdjustment += result.riskAdjustment * channelWeight;
    totalConfidence += result.confidence * channelWeight;
    
    console.log(`[Channel Multiplier] ${channelData.channel}: ${result.adjustedMultiplier.toFixed(4)} × ${channelWeight} = ${(result.adjustedMultiplier * channelWeight).toFixed(4)}`);
  });
  
  console.log(`[Channel Multiplier] ===== BLENDED RESULT =====`);
  console.log(`[Channel Multiplier] Blended Multiplier: ${blendedMultiplier.toFixed(4)}`);
  console.log(`[Channel Multiplier] Total Risk Adjustment: ${totalRiskAdjustment.toFixed(4)}`);
  console.log(`[Channel Multiplier] Overall Confidence: ${(totalConfidence * 100).toFixed(1)}%`);
  
  return {
    blendedMultiplier,
    channelResults,
    weights,
    totalRiskAdjustment,
    overallConfidence: totalConfidence,
    methodology: 'Phase 2: Channel-Specific Multipliers with Four-Channel Blending'
  };
}

/**
 * Get default channel multipliers (no risk adjustments)
 */
export function getDefaultChannelMultipliers(): Record<string, number> {
  return getAllChannelMultipliers();
}

/**
 * Compare channel multipliers across channels
 */
export function compareChannelMultipliers(
  channelExposures: ChannelExposureData[]
): Array<{
  channel: string;
  baseMultiplier: number;
  adjustedMultiplier: number;
  riskAdjustment: number;
  premium: string;
}> {
  const results = channelExposures.map(channelData => {
    const result = calculateChannelMultiplier(channelData);
    const premium = ((result.adjustedMultiplier - 1.0) * 100).toFixed(1);
    
    return {
      channel: result.channel,
      baseMultiplier: result.baseMultiplier,
      adjustedMultiplier: result.adjustedMultiplier,
      riskAdjustment: result.riskAdjustment,
      premium: premium === '0.0' ? 'Baseline' : `+${premium}%`
    };
  });
  
  return results;
}

/**
 * Calculate channel multiplier impact on final COGRI score
 */
export function calculateChannelMultiplierImpact(
  rawScore: number,
  sectorMultiplier: number,
  channelMultiplier: number
): {
  withoutChannelMultiplier: number;
  withChannelMultiplier: number;
  channelImpact: number;
  percentageChange: number;
} {
  const withoutChannelMultiplier = rawScore * sectorMultiplier;
  const withChannelMultiplier = rawScore * sectorMultiplier * channelMultiplier;
  const channelImpact = withChannelMultiplier - withoutChannelMultiplier;
  const percentageChange = ((channelImpact / withoutChannelMultiplier) * 100);
  
  return {
    withoutChannelMultiplier,
    withChannelMultiplier,
    channelImpact,
    percentageChange
  };
}

/**
 * Generate channel multiplier report
 */
export function generateChannelMultiplierReport(
  blendedResult: BlendedChannelMultiplierResult
): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('CHANNEL-SPECIFIC MULTIPLIER ANALYSIS - PHASE 2');
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push('BLENDED CHANNEL MULTIPLIER');
  lines.push('-'.repeat(80));
  lines.push(`Blended Multiplier: ${blendedResult.blendedMultiplier.toFixed(4)}x`);
  lines.push(`Total Risk Adjustment: +${blendedResult.totalRiskAdjustment.toFixed(4)}`);
  lines.push(`Overall Confidence: ${(blendedResult.overallConfidence * 100).toFixed(1)}%`);
  lines.push(`Methodology: ${blendedResult.methodology}`);
  lines.push('');
  
  lines.push('CHANNEL BREAKDOWN');
  lines.push('-'.repeat(80));
  
  blendedResult.channelResults.forEach(result => {
    const weight = blendedResult.weights[result.channel.toLowerCase() as keyof typeof blendedResult.weights];
    const contribution = result.adjustedMultiplier * weight;
    
    lines.push('');
    lines.push(`${result.channel.toUpperCase()} CHANNEL`);
    lines.push(`  Weight: ${(weight * 100).toFixed(0)}%`);
    lines.push(`  Base Multiplier: ${result.baseMultiplier.toFixed(4)}x`);
    lines.push(`  Risk Adjustment: +${result.riskAdjustment.toFixed(4)}`);
    lines.push(`  Adjusted Multiplier: ${result.adjustedMultiplier.toFixed(4)}x`);
    lines.push(`  Contribution to Blended: ${contribution.toFixed(4)}`);
    lines.push(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    
    if (result.activeRiskFactors.length > 0) {
      lines.push(`  Active Risk Factors: ${result.activeRiskFactors.length}`);
      result.activeRiskFactors.forEach(factorId => {
        lines.push(`    - ${factorId}`);
      });
    }
    
    if (result.warnings.length > 0) {
      lines.push(`  Warnings: ${result.warnings.length}`);
      result.warnings.forEach(warning => {
        lines.push(`    ⚠️  ${warning}`);
      });
    }
  });
  
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('END OF CHANNEL MULTIPLIER ANALYSIS');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Validate channel multiplier calculation
 */
export function validateChannelMultiplierCalculation(
  blendedResult: BlendedChannelMultiplierResult
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if blended multiplier is within reasonable range (0.8 - 1.5)
  if (blendedResult.blendedMultiplier < 0.8 || blendedResult.blendedMultiplier > 1.5) {
    errors.push(`Blended multiplier ${blendedResult.blendedMultiplier.toFixed(4)} is outside reasonable range (0.8 - 1.5)`);
  }
  
  // Check if all four channels are present
  const expectedChannels = ['Revenue', 'Supply', 'Assets', 'Financial'];
  const presentChannels = blendedResult.channelResults.map(r => r.channel);
  const missingChannels = expectedChannels.filter(ch => !presentChannels.includes(ch as any));
  
  if (missingChannels.length > 0) {
    warnings.push(`Missing channels: ${missingChannels.join(', ')}`);
  }
  
  // Check if weights sum to 1.0
  const totalWeight = Object.values(blendedResult.weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(`Channel weights do not sum to 1.0: ${totalWeight.toFixed(4)}`);
  }
  
  // Check confidence scores
  blendedResult.channelResults.forEach(result => {
    if (result.confidence < 0.7) {
      warnings.push(`Low confidence (${(result.confidence * 100).toFixed(0)}%) in ${result.channel} channel multiplier`);
    }
  });
  
  // Aggregate warnings from channel results
  blendedResult.channelResults.forEach(result => {
    warnings.push(...result.warnings);
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}