/**
 * Region Decomposition Service
 * 
 * PHASE 2 - Task 1: Break down regional aggregates into individual countries
 * 
 * Purpose: Convert regional data (e.g., "Americas", "Europe") into country-level
 * allocations for accurate country-level risk assessment.
 * 
 * Decomposition Methods:
 * - Americas: U.S. (90%), Canada (7%), Latin America (3%)
 * - Europe: GDP-weighted allocation across major European countries
 * - Rest of Asia Pacific: GDP-weighted allocation across APAC countries
 * - Greater China: Maps to China
 */

import { COUNTRY_GDP_2023 } from './fallbackLogic';

/**
 * Regional segment data structure
 */
export interface RegionalSegment {
  segment: string;
  value: number;
  unit?: string;
}

/**
 * Decomposed country allocation
 */
export interface CountryAllocation {
  country: string;
  value: number;
  percentage: number;  // Percentage of the regional total
  unit?: string;
}

/**
 * Decomposition result
 */
export interface DecompositionResult {
  originalSegment: string;
  originalValue: number;
  countries: CountryAllocation[];
  totalDecomposed: number;
  validationPassed: boolean;
  validationError?: string;
}

/**
 * Country name normalization mapping
 * Maps common segment names to standardized country names
 */
const COUNTRY_NAME_MAPPING: Record<string, string> = {
  'greater china': 'China',
  'mainland china': 'China',
  'prc': 'China',
  'united states': 'United States',
  'usa': 'United States',
  'us': 'United States',
  'uk': 'United Kingdom',
  'great britain': 'United Kingdom',
  'south korea': 'South Korea',
  'korea': 'South Korea',
  'republic of korea': 'South Korea'
};

/**
 * Americas decomposition weights
 * Based on typical revenue patterns for U.S.-based tech companies
 */
const AMERICAS_WEIGHTS: Record<string, number> = {
  'United States': 0.90,
  'Canada': 0.07,
  'Brazil': 0.015,
  'Mexico': 0.015
};

/**
 * European countries for GDP-weighted decomposition
 * Using major European markets
 */
const EUROPE_COUNTRIES = [
  'Germany',
  'United Kingdom',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Poland',
  'Austria',
  'Switzerland',
  'Ireland',
  'Denmark',
  'Norway',
  'Finland'
];

/**
 * Rest of Asia Pacific countries for GDP-weighted decomposition
 */
const REST_OF_ASIA_PACIFIC_COUNTRIES = [
  'Australia',
  'Singapore',
  'South Korea',
  'Taiwan',
  'Thailand',
  'Malaysia',
  'Indonesia',
  'Philippines',
  'Vietnam',
  'New Zealand'
];

/**
 * Normalize country name
 */
function normalizeCountryName(segment: string): string {
  const normalized = segment.toLowerCase().trim();
  return COUNTRY_NAME_MAPPING[normalized] || segment;
}

/**
 * Decompose Americas region into individual countries
 * 
 * @param totalValue - Total value for Americas region
 * @param unit - Unit of measurement (e.g., "millions_usd")
 * @returns Decomposition result with country-level allocations
 */
export function decomposeAmericas(
  totalValue: number,
  unit?: string
): DecompositionResult {
  
  console.log(`\n[Region Decomposition] Decomposing Americas: ${totalValue.toFixed(2)} ${unit || ''}`);
  
  const countries: CountryAllocation[] = [];
  let totalDecomposed = 0;
  
  for (const [country, weight] of Object.entries(AMERICAS_WEIGHTS)) {
    const value = totalValue * weight;
    const percentage = weight * 100;
    
    countries.push({
      country,
      value,
      percentage,
      unit
    });
    
    totalDecomposed += value;
    
    console.log(`  ${country.padEnd(20)} ${value.toFixed(2).padStart(12)} (${percentage.toFixed(1)}%)`);
  }
  
  // Validation
  const validationPassed = Math.abs(totalDecomposed - totalValue) < 0.01;
  const validationError = validationPassed 
    ? undefined 
    : `Decomposed total (${totalDecomposed.toFixed(2)}) does not match original (${totalValue.toFixed(2)})`;
  
  console.log(`  Total decomposed: ${totalDecomposed.toFixed(2)} (validation: ${validationPassed ? 'PASS' : 'FAIL'})`);
  
  return {
    originalSegment: 'Americas',
    originalValue: totalValue,
    countries,
    totalDecomposed,
    validationPassed,
    validationError
  };
}

/**
 * Decompose Europe region using GDP-weighted allocation
 * 
 * @param totalValue - Total value for Europe region
 * @param unit - Unit of measurement (e.g., "millions_usd")
 * @returns Decomposition result with country-level allocations
 */
export function decomposeEurope(
  totalValue: number,
  unit?: string
): DecompositionResult {
  
  console.log(`\n[Region Decomposition] Decomposing Europe: ${totalValue.toFixed(2)} ${unit || ''}`);
  
  // Calculate GDP weights for European countries
  const gdpWeights: Record<string, number> = {};
  let totalGDP = 0;
  
  for (const country of EUROPE_COUNTRIES) {
    const gdp = COUNTRY_GDP_2023[country] || 0;
    if (gdp > 0) {
      gdpWeights[country] = gdp;
      totalGDP += gdp;
    }
  }
  
  // Normalize to get percentages
  const countries: CountryAllocation[] = [];
  let totalDecomposed = 0;
  
  for (const [country, gdp] of Object.entries(gdpWeights)) {
    const weight = gdp / totalGDP;
    const value = totalValue * weight;
    const percentage = weight * 100;
    
    countries.push({
      country,
      value,
      percentage,
      unit
    });
    
    totalDecomposed += value;
  }
  
  // Sort by value descending
  countries.sort((a, b) => b.value - a.value);
  
  // Log top 10
  console.log('  Top 10 countries:');
  for (const allocation of countries.slice(0, 10)) {
    console.log(`  ${allocation.country.padEnd(20)} ${allocation.value.toFixed(2).padStart(12)} (${allocation.percentage.toFixed(1)}%)`);
  }
  
  // Validation
  const validationPassed = Math.abs(totalDecomposed - totalValue) < 0.01;
  const validationError = validationPassed 
    ? undefined 
    : `Decomposed total (${totalDecomposed.toFixed(2)}) does not match original (${totalValue.toFixed(2)})`;
  
  console.log(`  Total decomposed: ${totalDecomposed.toFixed(2)} (validation: ${validationPassed ? 'PASS' : 'FAIL'})`);
  
  return {
    originalSegment: 'Europe',
    originalValue: totalValue,
    countries,
    totalDecomposed,
    validationPassed,
    validationError
  };
}

/**
 * Decompose Rest of Asia Pacific region using GDP-weighted allocation
 * 
 * @param totalValue - Total value for Rest of Asia Pacific region
 * @param unit - Unit of measurement (e.g., "millions_usd")
 * @returns Decomposition result with country-level allocations
 */
export function decomposeRestOfAsiaPacific(
  totalValue: number,
  unit?: string
): DecompositionResult {
  
  console.log(`\n[Region Decomposition] Decomposing Rest of Asia Pacific: ${totalValue.toFixed(2)} ${unit || ''}`);
  
  // Calculate GDP weights for Asia Pacific countries
  const gdpWeights: Record<string, number> = {};
  let totalGDP = 0;
  
  for (const country of REST_OF_ASIA_PACIFIC_COUNTRIES) {
    const gdp = COUNTRY_GDP_2023[country] || 0;
    if (gdp > 0) {
      gdpWeights[country] = gdp;
      totalGDP += gdp;
    }
  }
  
  // Normalize to get percentages
  const countries: CountryAllocation[] = [];
  let totalDecomposed = 0;
  
  for (const [country, gdp] of Object.entries(gdpWeights)) {
    const weight = gdp / totalGDP;
    const value = totalValue * weight;
    const percentage = weight * 100;
    
    countries.push({
      country,
      value,
      percentage,
      unit
    });
    
    totalDecomposed += value;
  }
  
  // Sort by value descending
  countries.sort((a, b) => b.value - a.value);
  
  // Log all countries
  for (const allocation of countries) {
    console.log(`  ${allocation.country.padEnd(20)} ${allocation.value.toFixed(2).padStart(12)} (${allocation.percentage.toFixed(1)}%)`);
  }
  
  // Validation
  const validationPassed = Math.abs(totalDecomposed - totalValue) < 0.01;
  const validationError = validationPassed 
    ? undefined 
    : `Decomposed total (${totalDecomposed.toFixed(2)}) does not match original (${totalValue.toFixed(2)})`;
  
  console.log(`  Total decomposed: ${totalDecomposed.toFixed(2)} (validation: ${validationPassed ? 'PASS' : 'FAIL'})`);
  
  return {
    originalSegment: 'Rest of Asia Pacific',
    originalValue: totalValue,
    countries,
    totalDecomposed,
    validationPassed,
    validationError
  };
}

/**
 * Main decomposition function - automatically detects region type and decomposes
 * 
 * @param segment - Regional segment name
 * @param value - Total value for the region
 * @param unit - Unit of measurement (optional)
 * @returns Decomposition result or null if region not recognized
 */
export function decomposeRegion(
  segment: string,
  value: number,
  unit?: string
): DecompositionResult | null {
  
  const normalizedSegment = segment.toLowerCase().trim();
  
  // Americas variants
  if (normalizedSegment.includes('americas') || 
      normalizedSegment.includes('north america') ||
      normalizedSegment.includes('latin america')) {
    return decomposeAmericas(value, unit);
  }
  
  // Europe variants
  if (normalizedSegment.includes('europe') || 
      normalizedSegment === 'emea' ||
      normalizedSegment.includes('european')) {
    return decomposeEurope(value, unit);
  }
  
  // Rest of Asia Pacific variants
  if (normalizedSegment.includes('rest of asia') ||
      (normalizedSegment.includes('asia pacific') && !normalizedSegment.includes('greater china')) ||
      normalizedSegment === 'apac' ||
      normalizedSegment.includes('southeast asia')) {
    return decomposeRestOfAsiaPacific(value, unit);
  }
  
  // Not a recognized regional aggregate
  console.log(`[Region Decomposition] Segment "${segment}" not recognized as regional aggregate, skipping decomposition`);
  return null;
}

/**
 * Decompose all regional segments in a revenue geography array
 * 
 * @param revenueGeography - Array of regional segments
 * @returns Map of country allocations with decomposed values
 */
export function decomposeRevenueGeography(
  revenueGeography: RegionalSegment[]
): Map<string, number> {
  
  console.log('\n[Region Decomposition] ========================================');
  console.log('[Region Decomposition] Decomposing Revenue Geography');
  console.log('[Region Decomposition] ========================================');
  
  const countryAllocations = new Map<string, number>();
  
  for (const segment of revenueGeography) {
    console.log(`\n[Region Decomposition] Processing segment: ${segment.segment} (${segment.value})`);
    
    // Try to decompose
    const result = decomposeRegion(segment.segment, segment.value, segment.unit);
    
    if (result) {
      // Add decomposed countries to map
      for (const allocation of result.countries) {
        const existing = countryAllocations.get(allocation.country) || 0;
        countryAllocations.set(allocation.country, existing + allocation.value);
      }
      
      if (!result.validationPassed) {
        console.warn(`[Region Decomposition] ⚠️ Validation failed for ${segment.segment}: ${result.validationError}`);
      }
    } else {
      // Not a regional aggregate, normalize country name and treat as country-level data
      const normalizedCountry = normalizeCountryName(segment.segment);
      const existing = countryAllocations.get(normalizedCountry) || 0;
      countryAllocations.set(normalizedCountry, existing + segment.value);
      console.log(`  Treated as country-level data: ${segment.segment} → ${normalizedCountry} = ${segment.value}`);
    }
  }
  
  // Log final allocations
  console.log('\n[Region Decomposition] Final Country Allocations:');
  const sortedAllocations = Array.from(countryAllocations.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const totalValue = sortedAllocations.reduce((sum, [_, value]) => sum + value, 0);
  
  for (const [country, value] of sortedAllocations) {
    const percentage = (value / totalValue) * 100;
    console.log(`  ${country.padEnd(20)} ${value.toFixed(2).padStart(12)} (${percentage.toFixed(1)}%)`);
  }
  
  console.log(`\n  Total: ${totalValue.toFixed(2)}`);
  console.log('[Region Decomposition] ========================================\n');
  
  return countryAllocations;
}

/**
 * Convert country allocations map to percentage-based weights
 * 
 * @param allocations - Map of country to absolute values
 * @returns Map of country to percentage weights (0-100 scale)
 */
export function convertToPercentages(
  allocations: Map<string, number>
): Map<string, number> {
  
  const total = Array.from(allocations.values()).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return new Map();
  }
  
  const percentages = new Map<string, number>();
  
  for (const [country, value] of allocations.entries()) {
    percentages.set(country, (value / total) * 100);
  }
  
  return percentages;
}