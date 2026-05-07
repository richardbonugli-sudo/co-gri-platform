/**
 * COGRI Calculation Service
 * 
 * Shared calculation logic extracted from COGRI.tsx to ensure identical results
 * between Standard COGRI and Enhanced COGRI services.
 * 
 * CRITICAL: This service is the single source of truth for COGRI calculations.
 * Any changes must maintain backward compatibility with existing assessments.
 * 
 * PRIORITY 3 FIX: Removed 0.5% filtering threshold to ensure all countries with
 * non-zero allocations are displayed (e.g., Japan at 6.8% was being hidden).
 * 
 * BUG #5 FIX: Removed (channelData as any).operations fallback cast.
 *   geographicExposureService now writes "financial" (canonical field name).
 *   The shared ExposureChannels interface in types/company.ts is the single
 *   source of truth for channel field names.
 * 
 * P1-3 FIX: Added `tier` field to CountryExposure and propagated it from
 *   the best available V5 channel tier (DIRECT > ALLOCATED > MODELED > FALLBACK).
 * 
 * DEBUG LOGGING ADDED: Comprehensive logging to trace AAPL assessment issue
 */

import { getCountryShockIndex } from '@/data/globalCountries';
import { calculatePoliticalAlignment } from '@/services/politicalAlignmentService';

/**
 * Channel data structure from geographic exposure service
 *
 * Fix 5: Added `tier` field so V5 DIRECT/ALLOCATED/MODELED labels are propagated
 * from the channel breakdown all the way through to the UI rendering layer.
 */
export interface ChannelData {
  weight: number;
  status: 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
  source?: string;
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  evidenceLevel?: string;
  evidenceScore?: number;
  confidence?: number;
  /** V5 Step 1.5: Evidence tier label (DIRECT / ALLOCATED / MODELED) */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED';
}

/**
 * Channel breakdown by country
 */
export interface ChannelBreakdown {
  [country: string]: {
    revenue?: ChannelData;
    financial?: ChannelData;  // BUG #5 FIX: Canonical field name — NOT "operations"
    supply?: ChannelData;
    assets?: ChannelData;
    market?: ChannelData;
    blended: number;
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
  };
}

/**
 * Geographic segment from exposure service
 */
export interface GeographicSegment {
  country: string;
  revenuePercentage?: number;
}

/**
 * Input data for COGRI calculation
 */
export interface COGRICalculationInput {
  segments: GeographicSegment[];
  channelBreakdown?: ChannelBreakdown;
  homeCountry?: string;
  sector: string;
  sectorMultiplier: number;
}

/**
 * Country exposure result
 *
 * P1-3 FIX: Added `tier` field to propagate V5 DIRECT/ALLOCATED/MODELED/FALLBACK labels
 * from channel data all the way through to the UI rendering layer.
 * Also added `dataSource` to the interface (was previously added at runtime without a type).
 */
export interface CountryExposure {
  country: string;
  exposureWeight: number;
  preNormalizedWeight: number;
  countryShockIndex: number;
  contribution: number;
  status: 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  /** P1-3: V5 evidence tier — primary source for Evidence Tier Summary Bar */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  /** Fix 2: Evidence tier derived from bestStatus — kept for backward compatibility */
  dataSource?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  channelWeights?: {
    revenue: number;
    financial: number;  // BUG #5 FIX: Canonical field name — NOT "operations"
    supply: number;
    assets: number;
    market: number;
  };
  politicalAlignment?: {
    alignmentFactor: number;
    relationship: string;
    source: string;
  };
}

/**
 * Complete COGRI calculation result
 */
export interface COGRICalculationResult {
  countryExposures: CountryExposure[];
  rawScore: number;
  finalScore: number;
  riskLevel: string;
  sectorMultiplier: number;
  /** P2-4: Score uncertainty band (±) based on evidence tier mix */
  scoreUncertainty: number;
  exposureCoefficients: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
    market: number;
  };
}

/**
 * Exposure coefficients for four-channel blending
 * These weights determine how each channel contributes to the final exposure
 */
const EXPOSURE_COEFFICIENTS = {
  revenue: 0.40,    // 40% weight for revenue channel
  supply: 0.35,     // 35% weight for supply chain channel
  assets: 0.15,     // 15% weight for physical assets channel
  financial: 0.10,  // 10% weight for financial channel (formerly "operations")
  market: 0.00      // 0% weight (market channel removed from exposure calculation)
};

/**
 * Tier priority map for selecting the best available V5 tier.
 * Higher number = higher quality evidence.
 */
const TIER_PRIORITY: Record<string, number> = {
  DIRECT: 4,
  ALLOCATED: 3,
  MODELED: 2,
  FALLBACK: 1,
};

/**
 * Calculate COGRI score using the standard methodology
 * 
 * This function implements the complete COGRI calculation pipeline:
 * 1. Four-channel exposure weight calculation with fallback logic
 * 2. Exposure normalization to sum to 100%
 * 3. Country Shock Index (CSI) assignment
 * 4. Political alignment amplification
 * 5. Raw score aggregation
 * 6. Sector risk adjustment
 * 
 * PRIORITY 3 FIX: Removed 0.5% filtering threshold - all countries with non-zero
 * allocations are now included in the output.
 * 
 * @param input - Geographic exposure data and company information
 * @returns Complete COGRI calculation result with country-level breakdown
 */
export function calculateCOGRIScore(input: COGRICalculationInput): COGRICalculationResult {
  console.log(`🔍 [COGRI CALC DEBUG] ===== STARTING CALCULATION =====`);
  console.log(`🔍 [COGRI CALC DEBUG] Input segments count: ${input.segments.length}`);
  console.log(`🔍 [COGRI CALC DEBUG] Input segments:`, input.segments.map(s => `${s.country}: ${s.revenuePercentage}%`).join(', '));
  console.log(`🔍 [COGRI CALC DEBUG] Channel breakdown countries: ${input.channelBreakdown ? Object.keys(input.channelBreakdown).join(', ') : 'NONE'}`);
  console.log(`🔍 [COGRI CALC DEBUG] Sector: ${input.sector}`);
  
  // Step 1: Calculate pre-normalized country exposures with four-channel blending
  const countryExposuresPreNorm: CountryExposure[] = [];
  
  for (const segment of input.segments) {
    const country = segment.country;
    const csi = getCountryShockIndex(country);
    
    console.log(`🔍 [COGRI CALC DEBUG] Processing segment: ${country}`);
    
    const channelData = input.channelBreakdown?.[country];
    
    if (channelData) {
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Has channel breakdown`);
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Revenue weight: ${channelData.revenue?.weight || 0}`);
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Supply weight: ${channelData.supply?.weight || 0}`);
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Assets weight: ${channelData.assets?.weight || 0}`);
      // BUG #5 FIX: Read "financial" directly — geographicExposureService now writes "financial".
      // The (channelData as any).operations fallback cast has been removed.
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Financial weight: ${channelData.financial?.weight || 0}`);
      
      // Four-channel blended weight calculation
      // Formula: W_blended = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial
      const revContrib = (channelData.revenue?.weight || 0) * EXPOSURE_COEFFICIENTS.revenue;
      
      // BUG #5 FIX: Read "financial" directly — no more (channelData as any).operations fallback
      const financialWeight = channelData.financial?.weight || 0;
      const finContrib = financialWeight * EXPOSURE_COEFFICIENTS.financial;
      
      const supContrib = (channelData.supply?.weight || 0) * EXPOSURE_COEFFICIENTS.supply;
      const assContrib = (channelData.assets?.weight || 0) * EXPOSURE_COEFFICIENTS.assets;
      
      const blendedWeight = revContrib + finContrib + supContrib + assContrib;
      
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Blended weight: ${blendedWeight} (rev: ${revContrib}, fin: ${finContrib}, sup: ${supContrib}, ass: ${assContrib})`);
      
      // Political alignment factor
      const alignmentFactor = channelData.politicalAlignment?.alignmentFactor ?? 1.0;
      
      // Calculate contribution with political alignment amplification
      // Formula: Contribution = W × CSI × (1.0 + 0.5 × (1.0 - A_c))
      const contribution = blendedWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
      
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Contribution: ${contribution} (CSI: ${csi}, alignment: ${alignmentFactor})`);
      
      // Fix 4.B: Use best-available channel status rather than always defaulting to revenue.
      // When channelData.revenue is undefined (e.g. supply-only company-specific entry),
      // the old code labelled the country as 'fallback' even though supply/assets/financial
      // channels may have real evidence. Pick the highest-quality status available.
      const bestStatus = (
        channelData.revenue?.status ||
        channelData.supply?.status ||
        channelData.assets?.status ||
        channelData.financial?.status ||
        'fallback'
      ) as 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';

      const bestFallbackType = (
        channelData.revenue?.fallbackType ||
        channelData.supply?.fallbackType ||
        channelData.assets?.fallbackType ||
        channelData.financial?.fallbackType ||
        'none'
      ) as 'SSF' | 'RF' | 'GF' | 'none';

      // Fix 2: Derive dataSource tier from bestStatus for dashboard tier badges.
      const dataSourceFromStatus = (
        bestStatus === 'evidence'                 ? 'DIRECT'    :
        bestStatus === 'high_confidence_estimate' ? 'ALLOCATED' :
        bestStatus === 'known_zero'               ? 'MODELED'   :
                                                    'FALLBACK'
      ) as 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';

      // P1-3 FIX: Derive primary V5 `tier` from the best available channel tier field.
      // Channel tier hierarchy: DIRECT > ALLOCATED > MODELED > FALLBACK.
      // This is the authoritative tier label per V5 Step 1.5.
      const channelTiers = [
        channelData.revenue?.tier,
        channelData.supply?.tier,
        channelData.assets?.tier,
        channelData.financial?.tier,
      ].filter(Boolean) as Array<'DIRECT' | 'ALLOCATED' | 'MODELED'>;
      const bestTier: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK' =
        channelTiers.length > 0
          ? channelTiers.reduce((best, t) =>
              (TIER_PRIORITY[t] || 0) > (TIER_PRIORITY[best] || 0) ? t : best
            )
          : dataSourceFromStatus;

      countryExposuresPreNorm.push({
        country,
        exposureWeight: blendedWeight,
        preNormalizedWeight: blendedWeight,
        countryShockIndex: csi,
        contribution: contribution,
        status: bestStatus,
        fallbackType: bestFallbackType,
        tier: bestTier,             // P1-3: primary V5 tier label
        dataSource: dataSourceFromStatus,  // kept for backward compatibility
        channelWeights: {
          revenue: channelData.revenue?.weight || 0,
          financial: financialWeight,  // BUG #5 FIX: Use "financial" field name
          supply: channelData.supply?.weight || 0,
          assets: channelData.assets?.weight || 0,
          market: 0
        },
        politicalAlignment: channelData.politicalAlignment
      });
    } else {
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - NO channel breakdown, using fallback`);
      // Fallback: Use simple revenue percentage if channel breakdown not available
      const exposureWeight = (segment.revenuePercentage || 0) / 100;
      const homeCountry = input.homeCountry || 'United States';
      const alignment = calculatePoliticalAlignment(homeCountry, country);
      const alignmentFactor = alignment.alignmentFactor;
      const contribution = exposureWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
      
      console.log(`🔍 [COGRI CALC DEBUG]   ${country} - Fallback exposure: ${exposureWeight}, contribution: ${contribution}`);
      
      countryExposuresPreNorm.push({
        country,
        exposureWeight: exposureWeight,
        preNormalizedWeight: exposureWeight,
        countryShockIndex: csi,
        contribution: contribution,
        status: 'fallback',
        fallbackType: 'GF',
        tier: 'FALLBACK',    // P1-3: GF fallback path always maps to FALLBACK tier
        dataSource: 'FALLBACK', // Fix 2: kept for backward compatibility
        politicalAlignment: {
          alignmentFactor: alignment.alignmentFactor,
          relationship: alignment.relationship,
          source: alignment.source
        }
      });
    }
  }
  
  console.log(`🔍 [COGRI CALC DEBUG] Pre-normalization complete: ${countryExposuresPreNorm.length} countries`);
  
  // PRIORITY 3 FIX: Removed 0.5% filtering threshold
  // OLD: const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= 0.005);
  // NEW: Only filter out true zeros (0.01% = 1 basis point minimum)
  const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= 0.0001);
  
  console.log(`🔍 [COGRI CALC DEBUG] After filtering (>= 0.01%): ${filteredExposures.length} countries`);
  console.log(`🔍 [COGRI CALC DEBUG] Filtered countries:`, filteredExposures.map(e => `${e.country}: ${(e.exposureWeight * 100).toFixed(4)}%`).join(', '));
  
  const totalExposurePreNorm = filteredExposures.reduce((sum, exp) => sum + exp.exposureWeight, 0);
  
  console.log(`🔍 [COGRI CALC DEBUG] Pre-normalization total: ${(totalExposurePreNorm * 100).toFixed(4)}%`);
  
  // Step 3: Normalize exposures to sum to exactly 100%
  const countryExposures: CountryExposure[] = filteredExposures.map(exp => {
    const normalizedWeight = totalExposurePreNorm > 0 ? exp.exposureWeight / totalExposurePreNorm : 0;
    const alignmentFactor = exp.politicalAlignment?.alignmentFactor ?? 1.0;
    const normalizedContribution = normalizedWeight * exp.countryShockIndex * (1.0 + 0.5 * (1.0 - alignmentFactor));
    
    return {
      ...exp,
      exposureWeight: normalizedWeight,
      contribution: normalizedContribution
    };
  });
  
  console.log(`🔍 [COGRI CALC DEBUG] Post-normalization: ${countryExposures.length} countries`);
  console.log(`🔍 [COGRI CALC DEBUG] Final countries:`, countryExposures.map(e => `${e.country}: ${(e.exposureWeight * 100).toFixed(2)}%`).join(', '));
  
  // Step 4: Calculate raw score (sum of all contributions)
  const rawScore = countryExposures.reduce((sum, exp) => sum + exp.contribution, 0);
  
  console.log(`🔍 [COGRI CALC DEBUG] Raw score: ${rawScore.toFixed(4)}`);
  
  // Step 5: Apply sector multiplier
  const finalScore = Math.round(rawScore * input.sectorMultiplier * 10) / 10;
  
  console.log(`🔍 [COGRI CALC DEBUG] Final score: ${finalScore.toFixed(1)} (sector multiplier: ${input.sectorMultiplier.toFixed(4)})`);
  
  // Step 6: Determine risk level
  let riskLevel = 'Low Risk';
  if (finalScore >= 60) riskLevel = 'Very High Risk';
  else if (finalScore >= 45) riskLevel = 'High Risk';
  else if (finalScore >= 30) riskLevel = 'Moderate Risk';
  
  console.log(`🔍 [COGRI CALC DEBUG] Risk level: ${riskLevel}`);
  console.log(`🔍 [COGRI CALC DEBUG] ===== CALCULATION COMPLETE =====`);
  
  // P2-4: Compute score uncertainty band based on evidence tier mix
  // Uncertainty factors: DIRECT=5%, ALLOCATED=10%, MODELED=20%, FALLBACK=30%
  const TIER_UNCERTAINTY: Record<string, number> = {
    DIRECT: 0.05,
    ALLOCATED: 0.10,
    MODELED: 0.20,
    FALLBACK: 0.30,
  };
  const totalWeight = countryExposures.reduce((sum, e) => sum + e.exposureWeight, 0) || 1;
  const weightedUncertainty = countryExposures.reduce((sum, e) => {
    const tierKey = e.tier || e.dataSource || 'FALLBACK';
    const factor = TIER_UNCERTAINTY[tierKey] ?? 0.30;
    return sum + (e.exposureWeight / totalWeight) * factor;
  }, 0);
  const scoreUncertainty = parseFloat((finalScore * weightedUncertainty).toFixed(2));

  return {
    countryExposures,
    rawScore,
    finalScore,
    riskLevel,
    sectorMultiplier: input.sectorMultiplier,
    scoreUncertainty,
    exposureCoefficients: EXPOSURE_COEFFICIENTS
  };
}

/**
 * Validate that two COGRI calculation results are identical (within tolerance)
 * Used for testing and verification
 * 
 * @param result1 - First calculation result
 * @param result2 - Second calculation result
 * @param tolerance - Maximum allowed difference (default: 0.01)
 * @returns True if results are identical within tolerance
 */
export function validateIdenticalResults(
  result1: COGRICalculationResult,
  result2: COGRICalculationResult,
  tolerance: number = 0.01
): { identical: boolean; differences: string[] } {
  const differences: string[] = [];
  
  // Check final scores
  if (Math.abs(result1.finalScore - result2.finalScore) > tolerance) {
    differences.push(`Final score mismatch: ${result1.finalScore} vs ${result2.finalScore}`);
  }
  
  // Check raw scores
  if (Math.abs(result1.rawScore - result2.rawScore) > tolerance) {
    differences.push(`Raw score mismatch: ${result1.rawScore} vs ${result2.rawScore}`);
  }
  
  // Check risk levels
  if (result1.riskLevel !== result2.riskLevel) {
    differences.push(`Risk level mismatch: ${result1.riskLevel} vs ${result2.riskLevel}`);
  }
  
  // Check country count
  if (result1.countryExposures.length !== result2.countryExposures.length) {
    differences.push(`Country count mismatch: ${result1.countryExposures.length} vs ${result2.countryExposures.length}`);
  }
  
  // Check individual country exposures
  for (let i = 0; i < Math.min(result1.countryExposures.length, result2.countryExposures.length); i++) {
    const exp1 = result1.countryExposures[i];
    const exp2 = result2.countryExposures[i];
    
    if (exp1.country !== exp2.country) {
      differences.push(`Country mismatch at index ${i}: ${exp1.country} vs ${exp2.country}`);
    }
    
    if (Math.abs(exp1.exposureWeight - exp2.exposureWeight) > tolerance) {
      differences.push(`Exposure weight mismatch for ${exp1.country}: ${exp1.exposureWeight} vs ${exp2.exposureWeight}`);
    }
    
    if (Math.abs(exp1.contribution - exp2.contribution) > tolerance) {
      differences.push(`Contribution mismatch for ${exp1.country}: ${exp1.contribution} vs ${exp2.contribution}`);
    }
  }
  
  return {
    identical: differences.length === 0,
    differences
  };
}