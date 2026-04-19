/**
 * ENHANCED Sector Exposure Calculation Engine with Diagnostics
 * 
 * Phase 1: Data Validation & Debugging Implementation
 * - Comprehensive logging for all calculations
 * - Data validation at every step
 * - Enhanced normalization with safety checks
 * - Detailed breakdown reporting
 */

import { getCountryShockIndex } from '@/data/globalCountries';
import {
  calculateCountryWeight,
  getSectorGDPShare,
  getSectorExportShare,
  COUNTRY_GDP,
} from '@/data/economicData';
import {
  getSectorSensitivity,
  getSectorVectorSensitivity,
  getStrategicImportance,
  ALL_SECTORS,
  ALL_VECTORS,
} from '@/data/sectorMultipliers';
import {
  getCSIVectorBreakdown,
  getCountryVectorWeight,
} from '@/data/csiVectorData';

// Enable/disable diagnostic logging
const ENABLE_DIAGNOSTICS = true;

function log(...args: any[]) {
  if (ENABLE_DIAGNOSTICS) {
    console.log('[SectorCalc]', ...args);
  }
}

/**
 * ENHANCED: Calculate Country Sector Importance with validation
 */
export function calculateCountrySectorImportance(country: string, sector: string): number {
  const gdpShare = getSectorGDPShare(country, sector) / 100;
  const exportShare = getSectorExportShare(country, sector) / 100;
  const strategicImportance = getStrategicImportance(sector);
  
  // VALIDATION
  if (isNaN(gdpShare) || isNaN(exportShare) || isNaN(strategicImportance)) {
    console.error(`[Data Error] Invalid data for ${country} - ${sector}`);
    console.error(`  GDP Share: ${gdpShare}, Export Share: ${exportShare}, Strategic: ${strategicImportance}`);
    return 0.01; // Fallback to prevent NaN
  }
  
  const result = 0.5 * gdpShare + 0.3 * exportShare + 0.2 * strategicImportance;
  
  log(`  CountrySectorImportance(${country}, ${sector}):`);
  log(`    GDP Share: ${(gdpShare * 100).toFixed(2)}% (weight: 0.5)`);
  log(`    Export Share: ${(exportShare * 100).toFixed(2)}% (weight: 0.3)`);
  log(`    Strategic Importance: ${strategicImportance.toFixed(2)} (weight: 0.2)`);
  log(`    Result: ${result.toFixed(4)}`);
  
  return result;
}

/**
 * ENHANCED: Calculate Vector Adjustment with validation
 */
export function calculateVectorAdjustment(country: string, sector: string): number {
  let adjustment = 0;
  
  log(`  VectorAdjustment(${country}, ${sector}):`);
  
  for (const vector of ALL_VECTORS) {
    const countryVectorWeight = getCountryVectorWeight(country, vector);
    const sectorVectorSensitivity = getSectorVectorSensitivity(sector, vector);
    const contribution = countryVectorWeight * sectorVectorSensitivity;
    
    adjustment += contribution;
    
    log(`    ${vector}: ${countryVectorWeight.toFixed(3)} × ${sectorVectorSensitivity.toFixed(2)} = ${contribution.toFixed(4)}`);
  }
  
  log(`    Total Adjustment: ${adjustment.toFixed(4)}`);
  
  return adjustment;
}

/**
 * ENHANCED: Calculate Country Sector Exposure with full diagnostics
 */
export function calculateCountrySectorExposure(country: string, sector: string): number {
  log(`\n[Country Sector Exposure] ${country} - ${sector}`);
  
  const csi = getCountryShockIndex(country);
  log(`  CSI: ${csi.toFixed(2)}`);
  
  const sectorSensitivity = getSectorSensitivity(sector);
  log(`  Sector Sensitivity: ${sectorSensitivity.toFixed(2)}`);
  
  const countrySectorImportance = calculateCountrySectorImportance(country, sector);
  
  const vectorAdjustment = calculateVectorAdjustment(country, sector);
  
  const result = csi * sectorSensitivity * countrySectorImportance * vectorAdjustment;
  
  log(`  Formula: ${csi.toFixed(2)} × ${sectorSensitivity.toFixed(2)} × ${countrySectorImportance.toFixed(4)} × ${vectorAdjustment.toFixed(4)}`);
  log(`  Raw Score: ${result.toFixed(6)}`);
  
  // VALIDATION
  if (isNaN(result) || !isFinite(result)) {
    console.error(`[Calculation Error] Invalid result for ${country} - ${sector}: ${result}`);
    return 0;
  }
  
  return result;
}

/**
 * ENHANCED: Calculate Global Sector Exposure with diagnostics
 */
export function calculateGlobalSectorExposure(sector: string): number {
  log(`\n[Global Sector Exposure] ${sector}`);
  
  let globalExposure = 0;
  const countries = Object.keys(COUNTRY_GDP);
  
  log(`  Aggregating across ${countries.length} countries...`);
  
  for (const country of countries) {
    const countryWeight = calculateCountryWeight(country);
    const csi = getCountryShockIndex(country);
    const sectorSensitivity = getSectorSensitivity(sector);
    const countrySectorImportance = calculateCountrySectorImportance(country, sector);
    const vectorAdjustment = calculateVectorAdjustment(country, sector);
    
    const contribution = countryWeight * csi * sectorSensitivity * countrySectorImportance * vectorAdjustment;
    globalExposure += contribution;
    
    if (contribution > 0.01) {
      log(`    ${country}: weight=${countryWeight.toFixed(4)}, contribution=${contribution.toFixed(6)}`);
    }
  }
  
  log(`  Total Global Exposure: ${globalExposure.toFixed(6)}`);
  
  return globalExposure;
}

/**
 * ENHANCED: Normalize sector scores with comprehensive validation
 */
export function normalizeSectorScores(rawScores: number[]): number[] {
  log(`\n[Normalization] Processing ${rawScores.length} scores`);
  
  if (rawScores.length === 0) {
    log('  Empty array, returning empty');
    return [];
  }
  
  // Filter out invalid scores
  const validScores = rawScores.filter(s => !isNaN(s) && isFinite(s));
  
  if (validScores.length === 0) {
    console.error('[Normalization Error] All scores are invalid');
    return rawScores.map(() => 0);
  }
  
  if (validScores.length < rawScores.length) {
    console.warn(`[Normalization Warning] ${rawScores.length - validScores.length} invalid scores filtered out`);
  }
  
  const minScore = Math.min(...validScores);
  const maxScore = Math.max(...validScores);
  const range = maxScore - minScore;
  
  log(`  Min Score: ${minScore.toFixed(6)}`);
  log(`  Max Score: ${maxScore.toFixed(6)}`);
  log(`  Range: ${range.toFixed(6)}`);
  
  // Handle edge case where all scores are the same
  if (range === 0 || range < 0.000001) {
    console.warn('[Normalization] All scores identical or range too small, returning 50 for all');
    return rawScores.map(() => 50);
  }
  
  const normalized = rawScores.map((score, index) => {
    if (isNaN(score) || !isFinite(score)) {
      console.warn(`[Normalization] Invalid score at index ${index}: ${score}, setting to 0`);
      return 0;
    }
    
    const normalizedValue = 100 * (score - minScore) / range;
    
    log(`  Score ${index}: ${score.toFixed(6)} → ${normalizedValue.toFixed(2)}`);
    
    return normalizedValue;
  });
  
  // Validation check
  const normalizedMin = Math.min(...normalized.filter(s => !isNaN(s)));
  const normalizedMax = Math.max(...normalized.filter(s => !isNaN(s)));
  
  log(`  Normalized Range: ${normalizedMin.toFixed(2)} to ${normalizedMax.toFixed(2)}`);
  
  if (normalizedMin < -0.01 || normalizedMax > 100.01) {
    console.error(`[Normalization Error] Values out of range: [${normalizedMin}, ${normalizedMax}]`);
  }
  
  return normalized;
}

/**
 * ENHANCED: Calculate all country sector exposures with diagnostics
 */
export function calculateAllCountrySectorExposures(country: string): Record<string, { raw: number; display: number }> {
  log(`\n${'='.repeat(80)}`);
  log(`CALCULATING ALL SECTOR EXPOSURES FOR: ${country}`);
  log('='.repeat(80));
  
  const rawScores: Record<string, number> = {};
  
  // Calculate raw scores for all sectors
  for (const sector of ALL_SECTORS) {
    rawScores[sector] = calculateCountrySectorExposure(country, sector);
  }
  
  // Log raw score summary
  log(`\n[Raw Score Summary]`);
  const sortedRaw = Object.entries(rawScores).sort(([, a], [, b]) => b - a);
  sortedRaw.forEach(([sector, score], index) => {
    log(`  ${index + 1}. ${sector}: ${score.toFixed(6)}`);
  });
  
  // Normalize scores
  const rawScoreArray = Object.values(rawScores);
  const normalizedScores = normalizeSectorScores(rawScoreArray);
  
  // Combine into result object
  const result: Record<string, { raw: number; display: number }> = {};
  ALL_SECTORS.forEach((sector, index) => {
    result[sector] = {
      raw: rawScores[sector],
      display: normalizedScores[index],
    };
  });
  
  // Log final display scores
  log(`\n[Display Score Summary]`);
  const sortedDisplay = Object.entries(result).sort(([, a], [, b]) => b.display - a.display);
  sortedDisplay.forEach(([sector, scores], index) => {
    log(`  ${index + 1}. ${sector}: ${scores.display.toFixed(2)} (raw: ${scores.raw.toFixed(6)})`);
  });
  
  log(`\n${'='.repeat(80)}\n`);
  
  return result;
}

/**
 * ENHANCED: Calculate all global sector exposures with diagnostics
 */
export function calculateAllGlobalSectorExposures(): Record<string, { raw: number; display: number }> {
  log(`\n${'='.repeat(80)}`);
  log(`CALCULATING GLOBAL SECTOR EXPOSURES`);
  log('='.repeat(80));
  
  const rawScores: Record<string, number> = {};
  
  // Calculate raw scores for all sectors
  for (const sector of ALL_SECTORS) {
    rawScores[sector] = calculateGlobalSectorExposure(sector);
  }
  
  // Log raw score summary
  log(`\n[Raw Score Summary]`);
  const sortedRaw = Object.entries(rawScores).sort(([, a], [, b]) => b - a);
  sortedRaw.forEach(([sector, score], index) => {
    log(`  ${index + 1}. ${sector}: ${score.toFixed(6)}`);
  });
  
  // Normalize scores
  const rawScoreArray = Object.values(rawScores);
  const normalizedScores = normalizeSectorScores(rawScoreArray);
  
  // Combine into result object
  const result: Record<string, { raw: number; display: number }> = {};
  ALL_SECTORS.forEach((sector, index) => {
    result[sector] = {
      raw: rawScores[sector],
      display: normalizedScores[index],
    };
  });
  
  // Log final display scores
  log(`\n[Display Score Summary]`);
  const sortedDisplay = Object.entries(result).sort(([, a], [, b]) => b.display - a.display);
  sortedDisplay.forEach(([sector, scores], index) => {
    log(`  ${index + 1}. ${sector}: ${scores.display.toFixed(2)} (raw: ${scores.raw.toFixed(6)})`);
  });
  
  log(`\n${'='.repeat(80)}\n`);
  
  return result;
}

/**
 * Get calculation breakdown for transparency
 */
export function getCalculationBreakdown(country: string | null, sector: string) {
  if (country) {
    const csi = getCountryShockIndex(country);
    const sectorSensitivity = getSectorSensitivity(sector);
    const countrySectorImportance = calculateCountrySectorImportance(country, sector);
    const vectorAdjustment = calculateVectorAdjustment(country, sector);
    const rawScore = calculateCountrySectorExposure(country, sector);
    
    return {
      mode: 'country',
      country,
      sector,
      components: {
        csi,
        sectorSensitivity,
        countrySectorImportance,
        vectorAdjustment,
      },
      rawScore,
      formula: `${csi.toFixed(2)} × ${sectorSensitivity.toFixed(2)} × ${countrySectorImportance.toFixed(4)} × ${vectorAdjustment.toFixed(2)} = ${rawScore.toFixed(2)}`,
    };
  } else {
    const rawScore = calculateGlobalSectorExposure(sector);
    
    return {
      mode: 'global',
      sector,
      rawScore,
      formula: 'Σ[CountryWeight × CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment]',
    };
  }
}
