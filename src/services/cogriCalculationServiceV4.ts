/**
 * COGRI Calculation Service V.4 Integration
 * 
 * This service integrates the V.4 orchestrator with the existing COGRI calculation pipeline.
 * It provides a drop-in replacement for the legacy calculation service while maintaining
 * backward compatibility.
 * 
 * KEY FEATURES:
 * - Feature flag controlled rollout
 * - Automatic fallback to legacy on errors
 * - Comparison mode for validation
 * - Detailed logging and tracing
 */

import { 
  COGRICalculationInput, 
  COGRICalculationResult,
  ChannelData,
  ChannelBreakdown,
  CountryExposure
} from './cogriCalculationService';

import { 
  calculateV4Exposures, 
  formatV4Results,
  compareV4WithLegacy 
} from './v4Integration';

import { calculateCOGRIScore } from './cogriCalculationService';
import { shouldUseV4, getFeatureFlags } from '@/config/featureFlags';
import { ENHANCED_COMPANY_EXPOSURES, hasV4Enhancements } from '@/data/enhancedCompanyExposures';

/**
 * Calculate COGRI score with V.4 integration
 * 
 * This function automatically decides whether to use V.4 or legacy based on:
 * 1. Feature flags
 * 2. Data availability
 * 3. Error conditions
 * 
 * @param input - COGRI calculation input
 * @param ticker - Company ticker symbol (for feature flag check)
 * @returns COGRI calculation result
 */
export async function calculateCOGRIScoreV4(
  input: COGRICalculationInput,
  ticker?: string
): Promise<COGRICalculationResult> {
  
  const flags = getFeatureFlags();
  
  // Determine if we should use V.4
  const useV4 = ticker && shouldUseV4(ticker);
  
  if (!useV4) {
    console.log(`[COGRI V.4 Integration] Using legacy calculation for ${ticker || 'unknown'}`);
    return calculateCOGRIScore(input);
  }
  
  console.log(`[COGRI V.4 Integration] Using V.4 orchestrator for ${ticker}`);
  
  try {
    // Check if company has V.4 enhancements
    if (!ticker || !hasV4Enhancements(ticker)) {
      console.log(`[COGRI V.4 Integration] No V.4 enhancements available for ${ticker}, falling back to legacy`);
      return calculateCOGRIScore(input);
    }
    
    // Calculate using V.4 orchestrator
    const v4Results = await calculateV4Exposures(ticker);
    
    // Convert V.4 results to COGRI format
    const cogriResult = convertV4ToCOGRI(
      v4Results,
      input,
      ticker
    );
    
    // Comparison mode: compare with legacy
    if (flags.v4ComparisonMode) {
      const legacyResult = calculateCOGRIScore(input);
      logComparison(ticker, cogriResult, legacyResult, v4Results);
    }
    
    console.log(`[COGRI V.4 Integration] V.4 calculation completed successfully for ${ticker}`);
    console.log(`[COGRI V.4 Integration] Final Score: ${cogriResult.finalScore.toFixed(1)} (${cogriResult.riskLevel})`);
    
    return cogriResult;
    
  } catch (error) {
    console.error(`[COGRI V.4 Integration] Error in V.4 calculation for ${ticker}:`, error);
    console.log(`[COGRI V.4 Integration] Falling back to legacy calculation`);
    
    // Automatic fallback to legacy on error
    return calculateCOGRIScore(input);
  }
}

/**
 * Convert V.4 results to COGRI calculation result format
 */
function convertV4ToCOGRI(
  v4Results: {
    revenue: Map<string, number>;
    supply: Map<string, number>;
    assets: Map<string, number>;
    financial: Map<string, number>;
    traces: any;
  },
  input: COGRICalculationInput,
  ticker: string
): COGRICalculationResult {
  
  // Get all unique countries from V.4 results
  const allCountries = new Set<string>();
  v4Results.revenue.forEach((_, country) => allCountries.add(country));
  v4Results.supply.forEach((_, country) => allCountries.add(country));
  v4Results.assets.forEach((_, country) => allCountries.add(country));
  v4Results.financial.forEach((_, country) => allCountries.add(country));
  
  // Build channel breakdown
  const channelBreakdown: ChannelBreakdown = {};
  
  const exposureCoefficients = {
    revenue: 0.40,
    supply: 0.35,
    assets: 0.15,
    financial: 0.10,
    market: 0.00
  };
  
  for (const country of allCountries) {
    const revWeight = v4Results.revenue.get(country) || 0;
    const supWeight = v4Results.supply.get(country) || 0;
    const assWeight = v4Results.assets.get(country) || 0;
    const finWeight = v4Results.financial.get(country) || 0;
    
    // Calculate blended weight
    const blended = 
      revWeight * exposureCoefficients.revenue +
      supWeight * exposureCoefficients.supply +
      assWeight * exposureCoefficients.assets +
      finWeight * exposureCoefficients.financial;
    
    channelBreakdown[country] = {
      revenue: {
        weight: revWeight,
        status: 'evidence',
        fallbackType: 'none',
        evidenceLevel: 'direct_evidence',
        evidenceScore: 95,
        confidence: 0.95
      },
      supply: {
        weight: supWeight,
        status: 'high_confidence_estimate',
        fallbackType: 'SSF',
        evidenceLevel: 'high_confidence',
        evidenceScore: 85,
        confidence: 0.85
      },
      assets: {
        weight: assWeight,
        status: 'high_confidence_estimate',
        fallbackType: 'SSF',
        evidenceLevel: 'high_confidence',
        evidenceScore: 85,
        confidence: 0.85
      },
      operations: {
        weight: finWeight,
        status: 'high_confidence_estimate',
        fallbackType: 'SSF',
        evidenceLevel: 'high_confidence',
        evidenceScore: 88,
        confidence: 0.88
      },
      blended
    };
  }
  
  // Update input with V.4 channel breakdown
  const v4Input: COGRICalculationInput = {
    ...input,
    channelBreakdown
  };
  
  // Calculate final COGRI score using standard methodology
  return calculateCOGRIScore(v4Input);
}

/**
 * Log comparison between V.4 and legacy results
 */
function logComparison(
  ticker: string,
  v4Result: COGRICalculationResult,
  legacyResult: COGRICalculationResult,
  v4RawResults: any
): void {
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`V.4 vs LEGACY COMPARISON FOR ${ticker}`);
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`Final Scores:`);
  console.log(`  V.4:    ${v4Result.finalScore.toFixed(2)} (${v4Result.riskLevel})`);
  console.log(`  Legacy: ${legacyResult.finalScore.toFixed(2)} (${legacyResult.riskLevel})`);
  console.log(`  Diff:   ${(v4Result.finalScore - legacyResult.finalScore).toFixed(2)}\n`);
  
  console.log(`Raw Scores:`);
  console.log(`  V.4:    ${v4Result.rawScore.toFixed(4)}`);
  console.log(`  Legacy: ${legacyResult.rawScore.toFixed(4)}`);
  console.log(`  Diff:   ${(v4Result.rawScore - legacyResult.rawScore).toFixed(4)}\n`);
  
  console.log(`Country Count:`);
  console.log(`  V.4:    ${v4Result.countryExposures.length}`);
  console.log(`  Legacy: ${legacyResult.countryExposures.length}\n`);
  
  // Compare top 5 countries
  console.log(`Top 5 Countries Comparison:`);
  console.log(`  ${'Country'.padEnd(20)} ${'V.4 Weight'.padEnd(15)} ${'Legacy Weight'.padEnd(15)} ${'Difference'}`);
  console.log(`  ${'-'.repeat(70)}`);
  
  const top5V4 = v4Result.countryExposures.slice(0, 5);
  const top5Legacy = legacyResult.countryExposures.slice(0, 5);
  
  const allTopCountries = new Set([
    ...top5V4.map(e => e.country),
    ...top5Legacy.map(e => e.country)
  ]);
  
  for (const country of allTopCountries) {
    const v4Exp = top5V4.find(e => e.country === country);
    const legacyExp = top5Legacy.find(e => e.country === country);
    
    const v4Weight = v4Exp ? (v4Exp.exposureWeight * 100).toFixed(2) : '0.00';
    const legacyWeight = legacyExp ? (legacyExp.exposureWeight * 100).toFixed(2) : '0.00';
    const diff = v4Exp && legacyExp 
      ? ((v4Exp.exposureWeight - legacyExp.exposureWeight) * 100).toFixed(2)
      : 'N/A';
    
    console.log(`  ${country.padEnd(20)} ${(v4Weight + '%').padEnd(15)} ${(legacyWeight + '%').padEnd(15)} ${diff}`);
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

/**
 * Get V.4 calculation metadata
 */
export function getV4Metadata(ticker: string): {
  isV4Enabled: boolean;
  hasV4Data: boolean;
  willUseV4: boolean;
  reason: string;
} {
  const flags = getFeatureFlags();
  const isV4Enabled = shouldUseV4(ticker);
  const hasV4Data = hasV4Enhancements(ticker);
  const willUseV4 = isV4Enabled && hasV4Data;
  
  let reason: string;
  if (!flags.useV4Orchestrator) {
    reason = 'V.4 disabled by master switch';
  } else if (flags.v4ForceLegacy) {
    reason = 'V.4 disabled by force legacy flag';
  } else if (!isV4Enabled) {
    reason = 'Ticker not in rollout (not whitelisted and outside rollout percentage)';
  } else if (!hasV4Data) {
    reason = 'No V.4 enhanced data available for this ticker';
  } else {
    reason = 'V.4 enabled and ready';
  }
  
  return {
    isV4Enabled,
    hasV4Data,
    willUseV4,
    reason
  };
}