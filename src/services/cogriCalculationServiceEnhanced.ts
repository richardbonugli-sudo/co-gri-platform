/**
 * Enhanced COGRI Calculation Service - Phase 1 Transparency Layer
 * 
 * Extends the core COGRI calculation service with sector multiplier validation,
 * transparency, and detailed reporting capabilities.
 * 
 * This service maintains backward compatibility while adding Phase 1 enhancements.
 */

import { 
  calculateCOGRIScore as calculateCOGRIScoreCore,
  COGRICalculationInput,
  COGRICalculationResult,
  CountryExposure
} from './cogriCalculationService';
import { 
  validateSectorMultiplier,
  generateValidationReport,
  getValidationBadge
} from './sectorMultiplierValidation';
import { 
  getSectorMultiplierMetadata,
  MultiplierValidationResult
} from './sectorMultiplierMetadata';

/**
 * Enhanced COGRI calculation result with Phase 1 transparency
 */
export interface EnhancedCOGRICalculationResult extends COGRICalculationResult {
  sectorMultiplierDetails: {
    value: number;
    confidence: number;
    warnings: string[];
    rationale: string;
    dataSource: string;
    lastReviewed: string;
    adjustmentFactors: {
      concentrationRisk: number;
      volatilityRisk: number;
      geopoliticalRisk: number;
    };
    validationBadge: {
      icon: string;
      label: string;
      color: string;
      description: string;
    };
    historicalValues: Array<{
      value: number;
      effectiveDate: string;
      reason: string;
    }>;
    riskFactors: string[];
    validationNotes: string[];
  };
  validationReport: string;
}

/**
 * Calculate COGRI score with Phase 1 transparency enhancements
 * 
 * This function wraps the core calculation with validation and transparency layers:
 * 1. Validates sector multiplier appropriateness
 * 2. Generates warnings for edge cases
 * 3. Provides detailed rationale and historical context
 * 4. Creates comprehensive validation report
 * 
 * @param input - Geographic exposure data and company information
 * @returns Enhanced COGRI calculation result with full transparency
 */
export function calculateEnhancedCOGRIScore(
  input: COGRICalculationInput
): EnhancedCOGRICalculationResult {
  console.log(`[Enhanced COGRI Calculation] Starting Phase 1 calculation for ${input.segments.length} segments`);
  console.log(`[Enhanced COGRI Calculation] Sector: ${input.sector}`);
  
  // Step 1: Calculate core COGRI score (existing logic)
  const coreResult = calculateCOGRIScoreCore(input);
  
  console.log(`[Enhanced COGRI Calculation] Core calculation complete: rawScore=${coreResult.rawScore.toFixed(4)}, finalScore=${coreResult.finalScore.toFixed(1)}`);
  
  // Step 2: Validate sector multiplier with Phase 1 transparency
  const validation = validateSectorMultiplier(
    input.sector,
    coreResult.rawScore,
    coreResult.countryExposures
  );
  
  console.log(`[Enhanced COGRI Calculation] Validation complete: confidence=${(validation.confidence * 100).toFixed(1)}%, warnings=${validation.warnings.length}`);
  
  // Step 3: Get validation badge for UI display
  const validationBadge = getValidationBadge(validation.confidence);
  
  // Step 4: Generate comprehensive validation report
  const validationReport = generateValidationReport(
    validation,
    input.sector,
    coreResult.rawScore
  );
  
  // Step 5: Build enhanced result with full transparency
  const enhancedResult: EnhancedCOGRICalculationResult = {
    ...coreResult,
    sectorMultiplierDetails: {
      value: validation.multiplier,
      confidence: validation.confidence,
      warnings: validation.warnings,
      rationale: validation.metadata.rationale,
      dataSource: validation.metadata.dataSource,
      lastReviewed: validation.metadata.lastReviewed,
      adjustmentFactors: validation.adjustmentFactors,
      validationBadge,
      historicalValues: validation.metadata.historicalValues,
      riskFactors: validation.metadata.riskFactors,
      validationNotes: validation.metadata.validationNotes
    },
    validationReport
  };
  
  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.log(`[Enhanced COGRI Calculation] ⚠️  ${validation.warnings.length} warnings generated:`);
    validation.warnings.forEach((warning, index) => {
      console.log(`[Enhanced COGRI Calculation]    ${index + 1}. ${warning}`);
    });
  }
  
  console.log(`[Enhanced COGRI Calculation] Phase 1 calculation complete with full transparency`);
  
  return enhancedResult;
}

/**
 * Get sector multiplier summary for display
 */
export function getSectorMultiplierSummary(sector: string): {
  value: number;
  rationale: string;
  confidence: number;
  riskFactors: string[];
  lastReviewed: string;
} {
  const metadata = getSectorMultiplierMetadata(sector);
  
  return {
    value: metadata.value,
    rationale: metadata.rationale,
    confidence: metadata.confidenceScore,
    riskFactors: metadata.riskFactors,
    lastReviewed: metadata.lastReviewed
  };
}

/**
 * Compare sector multipliers across sectors
 */
export function compareSectorMultipliers(sectors: string[]): Array<{
  sector: string;
  multiplier: number;
  confidence: number;
  rationale: string;
}> {
  return sectors.map(sector => {
    const metadata = getSectorMultiplierMetadata(sector);
    return {
      sector,
      multiplier: metadata.value,
      confidence: metadata.confidenceScore,
      rationale: metadata.rationale
    };
  });
}

/**
 * Get historical multiplier changes for a sector
 */
export function getSectorMultiplierHistory(sector: string): Array<{
  value: number;
  effectiveDate: string;
  reason: string;
}> {
  const metadata = getSectorMultiplierMetadata(sector);
  return metadata.historicalValues;
}

/**
 * Export validation report to text file
 */
export function exportValidationReport(
  result: EnhancedCOGRICalculationResult,
  ticker: string,
  companyName: string
): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push(`COGRI SECTOR MULTIPLIER VALIDATION REPORT`);
  lines.push(`Company: ${companyName} (${ticker})`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push(result.validationReport);
  
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('CALCULATION SUMMARY');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Raw COGRI Score: ${result.rawScore.toFixed(2)}`);
  lines.push(`Sector Multiplier: ${result.sectorMultiplier.toFixed(2)}x`);
  lines.push(`Final COGRI Score: ${result.finalScore.toFixed(1)}`);
  lines.push(`Risk Level: ${result.riskLevel}`);
  lines.push('');
  
  lines.push('Country Exposures:');
  result.countryExposures.forEach((exp, index) => {
    lines.push(`  ${index + 1}. ${exp.country}: ${(exp.exposureWeight * 100).toFixed(2)}% (CSI: ${exp.countryShockIndex}, Contribution: ${exp.contribution.toFixed(2)})`);
  });
  
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('END OF REPORT');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}
