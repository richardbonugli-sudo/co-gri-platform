/**
 * Sector Exposure Calculation Engine
 * 
 * Implements all formulas from the Sector Exposure requirements document:
 * - Global Mode: Aggregates risk transmission across countries
 * - Country Mode: Measures sector exposure within a selected country
 * 
 * All calculations follow the exact formulas specified in the requirements.
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

/**
 * Calculate Country Sector Importance
 * 
 * Formula: CountrySectorImportance = 0.5 × GDPShare + 0.3 × ExportShare + 0.2 × StrategicImportance
 * 
 * This represents how economically important a sector is within a country,
 * preventing sectors from being heavily influenced by countries where the sector is insignificant.
 * 
 * @param country - Country name
 * @param sector - Sector name
 * @returns Country sector importance (0-1 scale, typically 0.01-0.40)
 */
export function calculateCountrySectorImportance(country: string, sector: string): number {
  const gdpShare = getSectorGDPShare(country, sector) / 100; // Convert percentage to decimal
  const exportShare = getSectorExportShare(country, sector) / 100; // Convert percentage to decimal
  const strategicImportance = getStrategicImportance(sector);
  
  return 0.5 * gdpShare + 0.3 * exportShare + 0.2 * strategicImportance;
}

/**
 * Calculate Vector Adjustment
 * 
 * Formula: VectorAdjustment = Σ[CountryVectorWeight × SectorVectorSensitivity]
 * 
 * This adjusts sector exposure based on which geopolitical risk vectors are currently
 * driving risk in that country. Different sectors are more exposed to different vectors.
 * 
 * @param country - Country name
 * @param sector - Sector name
 * @returns Vector adjustment factor (typically 0.8-1.8)
 */
export function calculateVectorAdjustment(country: string, sector: string): number {
  let adjustment = 0;
  
  for (const vector of ALL_VECTORS) {
    const countryVectorWeight = getCountryVectorWeight(country, vector);
    const sectorVectorSensitivity = getSectorVectorSensitivity(sector, vector);
    adjustment += countryVectorWeight * sectorVectorSensitivity;
  }
  
  return adjustment;
}

/**
 * Calculate Country Sector Exposure (Country Mode)
 * 
 * Formula: CountrySectorExposure = CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment
 * 
 * Measures how geopolitical risk affects sectors within the selected country.
 * 
 * @param country - Country name
 * @param sector - Sector name
 * @returns Raw sector exposure score
 */
export function calculateCountrySectorExposure(country: string, sector: string): number {
  const csi = getCountryShockIndex(country);
  const sectorSensitivity = getSectorSensitivity(sector);
  const countrySectorImportance = calculateCountrySectorImportance(country, sector);
  const vectorAdjustment = calculateVectorAdjustment(country, sector);
  
  return csi * sectorSensitivity * countrySectorImportance * vectorAdjustment;
}

/**
 * Calculate Global Sector Exposure (Global Mode)
 * 
 * Formula: GlobalSectorExposure = Σ[CountryWeight × CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment]
 * 
 * Aggregates risk transmission across countries while accounting for each country's economic importance.
 * 
 * @param sector - Sector name
 * @returns Raw global sector exposure score
 */
export function calculateGlobalSectorExposure(sector: string): number {
  let globalExposure = 0;
  
  // Iterate over all countries with GDP data
  const countries = Object.keys(COUNTRY_GDP);
  
  for (const country of countries) {
    const countryWeight = calculateCountryWeight(country);
    const csi = getCountryShockIndex(country);
    const sectorSensitivity = getSectorSensitivity(sector);
    const countrySectorImportance = calculateCountrySectorImportance(country, sector);
    const vectorAdjustment = calculateVectorAdjustment(country, sector);
    
    globalExposure += countryWeight * csi * sectorSensitivity * countrySectorImportance * vectorAdjustment;
  }
  
  return globalExposure;
}

/**
 * Normalize sector scores to 0-100 display scale
 * 
 * Formula: DisplayScore = 100 × (RawScore - MinScore) / (MaxScore - MinScore)
 * 
 * Converts raw sector exposure scores into a consistent 0-100 visual scale
 * for easy comparison within the panel.
 * 
 * @param rawScores - Array of raw sector scores
 * @returns Array of normalized scores (0-100)
 */
export function normalizeSectorScores(rawScores: number[]): number[] {
  if (rawScores.length === 0) return [];
  
  const minScore = Math.min(...rawScores);
  const maxScore = Math.max(...rawScores);
  
  // Handle edge case where all scores are the same
  if (maxScore === minScore) {
    return rawScores.map(() => 50); // Return middle value
  }
  
  return rawScores.map(score => 
    100 * (score - minScore) / (maxScore - minScore)
  );
}

/**
 * Calculate all sector exposures for a country (Country Mode)
 * 
 * Returns both raw scores and normalized display scores (0-100)
 * 
 * @param country - Country name
 * @returns Object with sector names as keys and exposure data as values
 */
export function calculateAllCountrySectorExposures(country: string): Record<string, { raw: number; display: number }> {
  const rawScores: Record<string, number> = {};
  
  // Calculate raw scores for all sectors
  for (const sector of ALL_SECTORS) {
    rawScores[sector] = calculateCountrySectorExposure(country, sector);
  }
  
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
  
  return result;
}

/**
 * Calculate all global sector exposures (Global Mode)
 * 
 * Returns both raw scores and normalized display scores (0-100)
 * 
 * @returns Object with sector names as keys and exposure data as values
 */
export function calculateAllGlobalSectorExposures(): Record<string, { raw: number; display: number }> {
  const rawScores: Record<string, number> = {};
  
  // Calculate raw scores for all sectors
  for (const sector of ALL_SECTORS) {
    rawScores[sector] = calculateGlobalSectorExposure(sector);
  }
  
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
  
  return result;
}

/**
 * Get calculation breakdown for transparency and debugging
 * 
 * @param country - Country name (null for global mode)
 * @param sector - Sector name
 * @returns Detailed breakdown of calculation components
 */
export function getCalculationBreakdown(country: string | null, sector: string) {
  if (country) {
    // Country Mode breakdown
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
    // Global Mode breakdown
    const rawScore = calculateGlobalSectorExposure(sector);
    
    return {
      mode: 'global',
      sector,
      rawScore,
      formula: 'Σ[CountryWeight × CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment]',
    };
  }
}