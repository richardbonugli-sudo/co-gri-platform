/**
 * Country Validator
 * 
 * Helper functions to check if a segment name is an actual country
 * vs a region that requires fallback distribution
 */

import { GLOBAL_COUNTRIES } from '@/data/globalCountries';

/**
 * List of all valid country names from our database
 */
const VALID_COUNTRY_NAMES = new Set(
  GLOBAL_COUNTRIES.map(c => c.country)
);

/**
 * Common country name variations and aliases
 */
const COUNTRY_ALIASES: Record<string, string> = {
  'United States of America': 'United States',
  'USA': 'United States',
  'US': 'United States',
  'UK': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'PRC': 'China',
  "People's Republic of China": 'China',
  'ROC': 'Taiwan',
  'Republic of China': 'Taiwan',
  'South Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'North Korea': 'North Korea',
  'Democratic People\'s Republic of Korea': 'North Korea',
  'UAE': 'United Arab Emirates',
  'DRC': 'Democratic Republic of Congo',
  'Congo (DRC)': 'Democratic Republic of Congo',
  'Congo (Republic)': 'Republic of Congo',
  'Ivory Coast': 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  'Czech Republic': 'Czech Republic',
  'Czechia': 'Czech Republic',
  'Holland': 'Netherlands',
  'Burma': 'Myanmar',
  'Swaziland': 'Eswatini'
};

/**
 * Check if a segment name is an actual country (not a region)
 * 
 * @param segmentName - The segment name to check
 * @returns true if it's a country, false if it's a region or unknown
 */
export function isActualCountry(segmentName: string): boolean {
  const normalized = segmentName.trim();
  
  // Direct match
  if (VALID_COUNTRY_NAMES.has(normalized)) {
    return true;
  }
  
  // Check aliases
  if (normalized in COUNTRY_ALIASES) {
    return true;
  }
  
  // Case-insensitive check
  const lowerNormalized = normalized.toLowerCase();
  for (const country of VALID_COUNTRY_NAMES) {
    if (country.toLowerCase() === lowerNormalized) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize a country name to match our database
 * 
 * @param segmentName - The segment name to normalize
 * @returns Normalized country name, or original if not found
 */
export function normalizeCountryName(segmentName: string): string {
  const normalized = segmentName.trim();
  
  // Direct match
  if (VALID_COUNTRY_NAMES.has(normalized)) {
    return normalized;
  }
  
  // Check aliases
  if (normalized in COUNTRY_ALIASES) {
    return COUNTRY_ALIASES[normalized];
  }
  
  // Case-insensitive match
  const lowerNormalized = normalized.toLowerCase();
  for (const country of VALID_COUNTRY_NAMES) {
    if (country.toLowerCase() === lowerNormalized) {
      return country;
    }
  }
  
  return normalized;
}

/**
 * Get all valid country names
 */
export function getAllCountryNames(): string[] {
  return Array.from(VALID_COUNTRY_NAMES);
}