/**
 * Sector Multiplier Validation - Phase 1 Transparency Layer
 * 
 * Validates sector multiplier application and provides warnings
 * for edge cases and unusual scenarios.
 */

import { getSectorMultiplierMetadata, MultiplierValidationResult } from './sectorMultiplierMetadata';
import { CountryExposure } from './cogriCalculationService';

export interface ValidationWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
}

/**
 * Validate sector multiplier application and generate warnings
 */
export function validateSectorMultiplier(
  sector: string,
  rawScore: number,
  countryExposures: CountryExposure[]
): MultiplierValidationResult {
  console.log(`[Sector Multiplier Validation] Validating ${sector} multiplier...`);
  
  const metadata = getSectorMultiplierMetadata(sector);
  const warnings: string[] = [];
  
  // Calculate adjustment factors
  const concentrationRisk = calculateConcentrationRisk(countryExposures);
  const volatilityRisk = calculateVolatilityRisk(countryExposures);
  const geopoliticalRisk = calculateGeopoliticalRisk(countryExposures);
  
  // Check for high concentration in unstable regions
  const highRiskCountries = countryExposures.filter(
    exp => exp.countryShockIndex > 70 && exp.exposureWeight > 0.15
  );
  
  if (highRiskCountries.length > 0 && (sector === 'Energy' || sector === 'Basic Materials')) {
    warnings.push(
      `High concentration (${(highRiskCountries.reduce((sum, c) => sum + c.exposureWeight, 0) * 100).toFixed(1)}%) in unstable regions may underestimate risk for ${sector} sector`
    );
  }
  
  // Check for extreme exposure concentration
  const maxExposure = Math.max(...countryExposures.map(exp => exp.exposureWeight));
  if (maxExposure > 0.50) {
    const dominantCountry = countryExposures.find(exp => exp.exposureWeight === maxExposure);
    warnings.push(
      `Extreme concentration (${(maxExposure * 100).toFixed(1)}%) in ${dominantCountry?.country} may require additional risk assessment`
    );
  }
  
  // Check for low confidence sectors
  if (metadata.confidenceScore < 0.70) {
    warnings.push(
      `Sector multiplier confidence is moderate (${(metadata.confidenceScore * 100).toFixed(0)}%). Consider manual review.`
    );
  }
  
  // Check for diversified exposure patterns
  const uniqueCountries = countryExposures.length;
  if (uniqueCountries > 20 && sector !== 'Technology' && sector !== 'Consumer Discretionary') {
    warnings.push(
      `Highly diversified exposure (${uniqueCountries} countries) may benefit from sector-specific analysis`
    );
  }
  
  // Check for fallback-heavy data
  const fallbackCount = countryExposures.filter(
    exp => exp.fallbackType === 'GF' || exp.fallbackType === 'RF'
  ).length;
  
  if (fallbackCount / uniqueCountries > 0.5) {
    warnings.push(
      `Over 50% of exposures use fallback logic. Sector multiplier may be less accurate.`
    );
  }
  
  // Check for recent historical changes
  if (metadata.historicalValues.length > 1) {
    const recentChange = metadata.historicalValues[metadata.historicalValues.length - 1];
    const previousValue = metadata.historicalValues[metadata.historicalValues.length - 2];
    
    const changePercent = Math.abs((recentChange.value - previousValue.value) / previousValue.value) * 100;
    
    if (changePercent > 10) {
      warnings.push(
        `Sector multiplier recently changed by ${changePercent.toFixed(1)}% (${recentChange.reason}). Review for applicability.`
      );
    }
  }
  
  // Check for sector-specific edge cases
  if (sector === 'Energy' && rawScore < 20) {
    warnings.push(
      'Energy sector with low base risk score - verify geographic exposure accuracy'
    );
  }
  
  if (sector === 'Technology' && rawScore > 60) {
    warnings.push(
      'Technology sector with high base risk score - may indicate supply chain concentration'
    );
  }
  
  // Calculate final confidence
  const baseConfidence = metadata.confidenceScore;
  const concentrationPenalty = concentrationRisk > 0.3 ? 0.05 : 0;
  const fallbackPenalty = (fallbackCount / uniqueCountries) * 0.10;
  
  const finalConfidence = Math.max(0.5, baseConfidence - concentrationPenalty - fallbackPenalty);
  
  console.log(`[Sector Multiplier Validation] ${sector}: multiplier=${metadata.value}, confidence=${(finalConfidence * 100).toFixed(1)}%, warnings=${warnings.length}`);
  
  return {
    multiplier: metadata.value,
    confidence: finalConfidence,
    warnings,
    adjustmentFactors: {
      concentrationRisk,
      volatilityRisk,
      geopoliticalRisk
    },
    metadata
  };
}

/**
 * Calculate concentration risk (Herfindahl-Hirschman Index)
 */
function calculateConcentrationRisk(exposures: CountryExposure[]): number {
  // HHI = sum of squared market shares
  const hhi = exposures.reduce((sum, exp) => sum + Math.pow(exp.exposureWeight, 2), 0);
  
  // Normalize to 0-1 scale (HHI ranges from 1/n to 1)
  // 0.25+ is considered highly concentrated
  return Math.min(1.0, hhi);
}

/**
 * Calculate volatility risk based on country shock indices
 */
function calculateVolatilityRisk(exposures: CountryExposure[]): number {
  // Weighted average of country shock indices
  const weightedCSI = exposures.reduce(
    (sum, exp) => sum + (exp.countryShockIndex / 100) * exp.exposureWeight,
    0
  );
  
  // Variance of shock indices
  const avgCSI = exposures.reduce((sum, exp) => sum + exp.countryShockIndex, 0) / exposures.length;
  const variance = exposures.reduce(
    (sum, exp) => sum + Math.pow(exp.countryShockIndex - avgCSI, 2),
    0
  ) / exposures.length;
  
  // Combine weighted average and variance
  return Math.min(1.0, (weightedCSI + Math.sqrt(variance) / 100) / 2);
}

/**
 * Calculate geopolitical risk based on high-risk country exposure
 */
function calculateGeopoliticalRisk(exposures: CountryExposure[]): number {
  // Sum exposure to countries with CSI > 60
  const highRiskExposure = exposures
    .filter(exp => exp.countryShockIndex > 60)
    .reduce((sum, exp) => sum + exp.exposureWeight, 0);
  
  // Count of high-risk countries
  const highRiskCount = exposures.filter(exp => exp.countryShockIndex > 60).length;
  
  // Combine exposure percentage and count
  return Math.min(1.0, highRiskExposure + (highRiskCount / exposures.length) * 0.3);
}

/**
 * Generate detailed validation report
 */
export function generateValidationReport(
  validation: MultiplierValidationResult,
  sector: string,
  rawScore: number
): string {
  const report: string[] = [];
  
  report.push('='.repeat(70));
  report.push(`SECTOR MULTIPLIER VALIDATION REPORT - ${sector.toUpperCase()}`);
  report.push('='.repeat(70));
  report.push('');
  
  report.push(`📊 Multiplier Value: ${validation.multiplier.toFixed(2)}x`);
  report.push(`🎯 Confidence Score: ${(validation.confidence * 100).toFixed(1)}%`);
  report.push(`📈 Raw COGRI Score: ${rawScore.toFixed(2)}`);
  report.push(`📈 Adjusted Score: ${(rawScore * validation.multiplier).toFixed(2)}`);
  report.push('');
  
  report.push('📋 RATIONALE:');
  report.push(`   ${validation.metadata.rationale}`);
  report.push('');
  
  report.push('📊 RISK FACTORS:');
  validation.metadata.riskFactors.forEach((factor, index) => {
    report.push(`   ${index + 1}. ${factor}`);
  });
  report.push('');
  
  report.push('🔍 ADJUSTMENT FACTORS:');
  report.push(`   Concentration Risk: ${(validation.adjustmentFactors.concentrationRisk * 100).toFixed(1)}%`);
  report.push(`   Volatility Risk: ${(validation.adjustmentFactors.volatilityRisk * 100).toFixed(1)}%`);
  report.push(`   Geopolitical Risk: ${(validation.adjustmentFactors.geopoliticalRisk * 100).toFixed(1)}%`);
  report.push('');
  
  if (validation.warnings.length > 0) {
    report.push('⚠️  WARNINGS:');
    validation.warnings.forEach((warning, index) => {
      report.push(`   ${index + 1}. ${warning}`);
    });
    report.push('');
  }
  
  report.push('📚 DATA SOURCE:');
  report.push(`   ${validation.metadata.dataSource}`);
  report.push(`   Last Reviewed: ${validation.metadata.lastReviewed}`);
  report.push('');
  
  if (validation.metadata.historicalValues.length > 1) {
    report.push('📈 HISTORICAL VALUES:');
    validation.metadata.historicalValues.forEach(hist => {
      report.push(`   ${hist.effectiveDate}: ${hist.value.toFixed(2)}x - ${hist.reason}`);
    });
    report.push('');
  }
  
  if (validation.metadata.validationNotes.length > 0) {
    report.push('📝 VALIDATION NOTES:');
    validation.metadata.validationNotes.forEach((note, index) => {
      report.push(`   ${index + 1}. ${note}`);
    });
    report.push('');
  }
  
  report.push('='.repeat(70));
  
  return report.join('\n');
}

/**
 * Get validation badge for UI display
 */
export function getValidationBadge(confidence: number): {
  icon: string;
  label: string;
  color: string;
  description: string;
} {
  if (confidence >= 0.90) {
    return {
      icon: '✅',
      label: 'VERY HIGH CONFIDENCE',
      color: 'green',
      description: 'Sector multiplier is well-validated with strong historical data'
    };
  } else if (confidence >= 0.80) {
    return {
      icon: '✓',
      label: 'HIGH CONFIDENCE',
      color: 'blue',
      description: 'Sector multiplier is validated with good historical data'
    };
  } else if (confidence >= 0.70) {
    return {
      icon: '○',
      label: 'MODERATE CONFIDENCE',
      color: 'yellow',
      description: 'Sector multiplier has moderate validation - consider manual review'
    };
  } else if (confidence >= 0.60) {
    return {
      icon: '◐',
      label: 'LOW CONFIDENCE',
      color: 'orange',
      description: 'Sector multiplier has limited validation - manual review recommended'
    };
  } else {
    return {
      icon: '⚠',
      label: 'VERY LOW CONFIDENCE',
      color: 'red',
      description: 'Sector multiplier requires manual validation and review'
    };
  }
}
