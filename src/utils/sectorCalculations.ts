/**
 * ENHANCED Sector Exposure Calculation Engine with Percentile-Based Scoring
 * 
 * Phase 2: Percentile-Based Normalization Implementation
 * - Global percentile ranking across all country-sector pairs
 * - Natural score distribution (no forced 0/100 for every country)
 * - Scores reflect global context and statistical significance
 * - Risk level bands for intuitive interpretation
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
 * NEW: Calculate percentile rank for a value in a sorted array
 * Returns a value between 0 and 100 representing the percentile
 */
function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 50;
  if (sortedValues.length === 1) return 50;
  
  // Find position of value in sorted array
  let position = 0;
  for (let i = 0; i < sortedValues.length; i++) {
    if (sortedValues[i] < value) {
      position = i + 1;
    } else if (sortedValues[i] === value) {
      // For equal values, use the midpoint of their range
      let equalCount = 1;
      for (let j = i + 1; j < sortedValues.length && sortedValues[j] === value; j++) {
        equalCount++;
      }
      position = i + equalCount / 2;
      break;
    } else {
      break;
    }
  }
  
  // Convert position to percentile (0-100 scale)
  const percentile = (position / sortedValues.length) * 100;
  
  return percentile;
}

/**
 * NEW: Percentile-based normalization across ALL country-sector pairs
 * This provides global context - scores reflect where a sector ranks globally
 */
export function normalizeByPercentile(
  rawScores: number[],
  allGlobalScores: number[]
): number[] {
  log(`\n[Percentile Normalization] Processing ${rawScores.length} scores against ${allGlobalScores.length} global scores`);
  
  if (rawScores.length === 0) {
    log('  Empty array, returning empty');
    return [];
  }
  
  // Filter out invalid scores from global dataset
  const validGlobalScores = allGlobalScores.filter(s => !isNaN(s) && isFinite(s) && s > 0);
  
  if (validGlobalScores.length === 0) {
    console.error('[Percentile Error] No valid global scores available');
    return rawScores.map(() => 50);
  }
  
  // Sort global scores for percentile calculation
  const sortedGlobalScores = [...validGlobalScores].sort((a, b) => a - b);
  
  log(`  Global score range: ${sortedGlobalScores[0].toFixed(6)} to ${sortedGlobalScores[sortedGlobalScores.length - 1].toFixed(6)}`);
  
  // Calculate percentile for each score
  const percentileScores = rawScores.map((score, index) => {
    if (isNaN(score) || !isFinite(score)) {
      console.warn(`[Percentile] Invalid score at index ${index}: ${score}, setting to 0`);
      return 0;
    }
    
    const percentile = calculatePercentile(score, sortedGlobalScores);
    
    log(`  Score ${index}: ${score.toFixed(6)} → Percentile ${percentile.toFixed(2)}`);
    
    return percentile;
  });
  
  // Validation check
  const percentileMin = Math.min(...percentileScores.filter(s => !isNaN(s)));
  const percentileMax = Math.max(...percentileScores.filter(s => !isNaN(s)));
  
  log(`  Percentile Range: ${percentileMin.toFixed(2)} to ${percentileMax.toFixed(2)}`);
  
  return percentileScores;
}

/**
 * DEPRECATED: Old min-max normalization (kept for reference)
 * This forced every country to have 0 and 100, causing extreme values
 */
export function normalizeSectorScores(rawScores: number[]): number[] {
  log(`\n[DEPRECATED Min-Max Normalization] Processing ${rawScores.length} scores`);
  
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
 * NEW: Build global score dataset for percentile calculation
 * Calculates raw scores for ALL country-sector combinations
 */
function buildGlobalScoreDataset(): number[] {
  log(`\n[Building Global Dataset]`);
  
  const countries = Object.keys(COUNTRY_GDP);
  const globalScores: number[] = [];
  
  for (const country of countries) {
    for (const sector of ALL_SECTORS) {
      const rawScore = calculateCountrySectorExposure(country, sector);
      if (!isNaN(rawScore) && isFinite(rawScore) && rawScore > 0) {
        globalScores.push(rawScore);
      }
    }
  }
  
  log(`  Total global scores: ${globalScores.length}`);
  log(`  Range: ${Math.min(...globalScores).toFixed(6)} to ${Math.max(...globalScores).toFixed(6)}`);
  
  return globalScores;
}

/**
 * ENHANCED: Calculate all country sector exposures with PERCENTILE-BASED scoring
 */
export function calculateAllCountrySectorExposures(country: string): Record<string, { raw: number; display: number }> {
  log(`\n${'='.repeat(80)}`);
  log(`CALCULATING ALL SECTOR EXPOSURES FOR: ${country} (PERCENTILE-BASED)`);
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
  
  // Build global dataset for percentile calculation
  const globalScores = buildGlobalScoreDataset();
  
  // Normalize scores using PERCENTILE method
  const rawScoreArray = Object.values(rawScores);
  const percentileScores = normalizeByPercentile(rawScoreArray, globalScores);
  
  // Combine into result object
  const result: Record<string, { raw: number; display: number }> = {};
  ALL_SECTORS.forEach((sector, index) => {
    result[sector] = {
      raw: rawScores[sector],
      display: percentileScores[index],
    };
  });
  
  // Log final display scores
  log(`\n[Percentile Score Summary]`);
  const sortedDisplay = Object.entries(result).sort(([, a], [, b]) => b.display - a.display);
  sortedDisplay.forEach(([sector, scores], index) => {
    log(`  ${index + 1}. ${sector}: ${scores.display.toFixed(2)} (raw: ${scores.raw.toFixed(6)})`);
  });
  
  log(`\n${'='.repeat(80)}\n`);
  
  return result;
}

/**
 * ENHANCED: Calculate all global sector exposures with PERCENTILE-BASED scoring
 */
export function calculateAllGlobalSectorExposures(): Record<string, { raw: number; display: number }> {
  log(`\n${'='.repeat(80)}`);
  log(`CALCULATING GLOBAL SECTOR EXPOSURES (PERCENTILE-BASED)`);
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
  
  // Build global dataset for percentile calculation
  const globalScores = buildGlobalScoreDataset();
  
  // Normalize scores using PERCENTILE method
  const rawScoreArray = Object.values(rawScores);
  const percentileScores = normalizeByPercentile(rawScoreArray, globalScores);
  
  // Combine into result object
  const result: Record<string, { raw: number; display: number }> = {};
  ALL_SECTORS.forEach((sector, index) => {
    result[sector] = {
      raw: rawScores[sector],
      display: percentileScores[index],
    };
  });
  
  // Log final display scores
  log(`\n[Percentile Score Summary]`);
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