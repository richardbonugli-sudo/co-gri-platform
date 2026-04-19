/**
 * Restricted Fallback (RF) Implementation
 * 
 * Based on: Appendix v3.3 — CO-GRI EXPOSURE FALLBACK LOGIC
 * 
 * RF is used when geography is partially known but not structurally defined:
 * - Case A: Non-standard region naming (EMEA, International, Overseas)
 * - Case B: Partial country evidence + incomplete membership
 * - Case C: Domestic + ambiguous foreign bucket (U.S. + International)
 * 
 * RF Formula:
 * Step 1: W_fallback(c) = SectorPlausibility(c) / Σ SectorPlausibility(c) for c in P
 * Step 2: W_normalized(c) = W_fallback(c) × W_bucket
 * 
 * Where P = restricted plausible country set:
 * - Countries explicitly named
 * - Countries in narrative region names
 * - Sector-specific plausible exposures
 * - EXCLUDING: domestic country (if foreign bucket), structured evidence, true zeros
 */

import { COUNTRY_GDP_2023 } from './fallbackLogic';

// Sector-specific plausible country lists for Restricted Fallback
export const SECTOR_PLAUSIBLE_COUNTRIES: Record<string, string[]> = {
  'Technology': [
    'China', 'Taiwan', 'South Korea', 'Japan', 'Vietnam', 'Malaysia', 'Thailand', 'India',
    'Singapore', 'Philippines', 'Mexico', 'Germany', 'United Kingdom', 'Ireland', 'Israel',
    'United States', 'Canada', 'Brazil', 'Australia'
  ],
  'Manufacturing': [
    'China', 'Germany', 'Japan', 'South Korea', 'United States', 'Italy', 'Mexico', 'India',
    'Vietnam', 'Thailand', 'Poland', 'Czech Republic', 'Turkey', 'Brazil', 'Indonesia'
  ],
  'Financial Services': [
    'United States', 'United Kingdom', 'Switzerland', 'Singapore', 'Hong Kong', 'Luxembourg',
    'Germany', 'France', 'Japan', 'Ireland', 'Netherlands', 'Canada', 'Australia'
  ],
  'Energy': [
    'Saudi Arabia', 'Russia', 'United States', 'United Arab Emirates', 'Norway', 'Canada',
    'Brazil', 'Qatar', 'Kuwait', 'Iraq', 'Iran', 'Nigeria', 'Angola', 'Kazakhstan', 'Venezuela'
  ],
  'Healthcare': [
    'United States', 'Switzerland', 'Germany', 'United Kingdom', 'France', 'Japan', 'Belgium',
    'Ireland', 'Singapore', 'Netherlands', 'India', 'China', 'Canada', 'Australia'
  ],
  'Consumer Goods': [
    'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France', 'Italy', 'Brazil',
    'India', 'Mexico', 'South Korea', 'Spain', 'Canada', 'Australia', 'Indonesia'
  ],
  'Telecommunications': [
    'United States', 'China', 'Japan', 'South Korea', 'United Kingdom', 'Germany', 'India',
    'Brazil', 'France', 'Spain', 'Italy', 'Mexico', 'Canada', 'Australia', 'Russia'
  ],
  'Retail': [
    'United States', 'China', 'United Kingdom', 'Germany', 'Japan', 'France', 'Brazil', 'India',
    'Canada', 'Australia', 'Mexico', 'Spain', 'Italy', 'South Korea', 'Netherlands'
  ]
};

// Non-standard region keywords that trigger RF (Case A)
export const NON_STANDARD_REGIONS = [
  'emea', 'international', 'overseas', 'foreign', 'non-us', 'non-domestic',
  'international markets', 'overseas markets', 'foreign operations',
  'rest of world', 'other countries', 'other regions', 'abroad', 'external markets'
];

/**
 * Check if a region name is non-standard (triggers RF Case A)
 */
export function isNonStandardRegion(regionName: string): boolean {
  const normalized = regionName.toLowerCase().trim();
  return NON_STANDARD_REGIONS.some(keyword => normalized.includes(keyword));
}

/**
 * Construct restricted plausible country set P for RF
 * 
 * P includes:
 * - Countries explicitly named in evidence
 * - Countries in narrative region names
 * - Sector-specific plausible exposures
 * 
 * P excludes:
 * - Domestic country (if bucket is foreign)
 * - Countries with structured evidence
 * - True zeros
 */
export function constructRestrictedSet(
  explicitCountries: string[],
  narrativeRegions: string[],
  sector: string,
  homeCountry: string,
  isForeignBucket: boolean,
  structuredEvidenceCountries: Set<string>,
  trueZeroCountries: Set<string>
): string[] {
  const P = new Set<string>();
  
  // Add explicitly named countries
  for (const country of explicitCountries) {
    P.add(country);
  }
  
  // Add countries from narrative regions (if any)
  for (const region of narrativeRegions) {
    // This would need region-to-country mapping
    // For now, we'll use sector plausibility
  }
  
  // Add sector-specific plausible countries
  const sectorCountries = SECTOR_PLAUSIBLE_COUNTRIES[sector] || [];
  for (const country of sectorCountries) {
    P.add(country);
  }
  
  // Remove domestic country if this is a foreign bucket
  if (isForeignBucket) {
    P.delete(homeCountry);
  }
  
  // Remove countries with structured evidence
  for (const country of structuredEvidenceCountries) {
    P.delete(country);
  }
  
  // Remove true zeros
  for (const country of trueZeroCountries) {
    P.delete(country);
  }
  
  return Array.from(P);
}

/**
 * Calculate sector plausibility score for a country
 * Used in RF formula: W_fallback(c) = SectorPlausibility(c)
 */
export function calculateSectorPlausibility(
  country: string,
  sector: string,
  channel: 'revenue' | 'supply' | 'assets' | 'financial'
): number {
  const gdp = COUNTRY_GDP_2023[country] || 0.01;
  let plausibilityScore = gdp;
  
  // Channel-specific adjustments
  switch (channel) {
    case 'revenue': {
      // Consumer market size proxy
      plausibilityScore = gdp * 1.0;
      break;
    }
    
    case 'supply': {
      // Manufacturing hub bonus
      const manufacturingHubs = ['China', 'Vietnam', 'Taiwan', 'South Korea', 'Thailand', 'Malaysia', 'Mexico', 'India'];
      const isHub = manufacturingHubs.includes(country);
      plausibilityScore = gdp * (isHub ? 1.5 : 0.8);
      break;
    }
    
    case 'assets': {
      // Asset intensity by sector
      const assetIntensity: Record<string, number> = {
        'Technology': 0.8,
        'Manufacturing': 1.5,
        'Financial Services': 0.6,
        'Energy': 2.5,
        'Healthcare': 1.2,
        'Consumer Goods': 1.0,
        'Telecommunications': 2.0,
        'Retail': 1.2
      };
      const intensity = assetIntensity[sector] || 1.0;
      plausibilityScore = gdp * intensity;
      break;
    }
    
    case 'financial': {
      // Financial center bonus
      const financialCenters = ['United States', 'United Kingdom', 'Switzerland', 'Singapore', 'Hong Kong', 'Luxembourg', 'Ireland'];
      const isCenter = financialCenters.includes(country);
      plausibilityScore = gdp * (isCenter ? 1.5 : 1.0);
      break;
    }
  }
  
  return plausibilityScore;
}

/**
 * Apply Restricted Fallback (RF)
 * 
 * Formula:
 * Step 1: W_fallback(c) = SectorPlausibility(c) / Σ SectorPlausibility(c) for c in P
 * Step 2: W_normalized(c) = W_fallback(c) × W_bucket
 */
export function applyRestrictedFallback(
  restrictedSet: string[],
  sector: string,
  channel: 'revenue' | 'supply' | 'assets' | 'financial',
  bucketWeight: number
): Record<string, number> {
  console.log(`[Restricted Fallback] Applying RF for ${channel} channel`);
  console.log(`[Restricted Fallback] Restricted set P: ${restrictedSet.length} countries`);
  console.log(`[Restricted Fallback] Bucket weight: ${(bucketWeight * 100).toFixed(2)}%`);
  
  if (restrictedSet.length === 0) {
    console.log(`[Restricted Fallback] Empty restricted set, returning empty weights`);
    return {};
  }
  
  // Step 1: Calculate raw plausibility scores
  const plausibilityScores: Record<string, number> = {};
  let totalPlausibility = 0;
  
  for (const country of restrictedSet) {
    const score = calculateSectorPlausibility(country, sector, channel);
    plausibilityScores[country] = score;
    totalPlausibility += score;
  }
  
  // Step 2: Normalize within restricted set P
  const result: Record<string, number> = {};
  
  if (totalPlausibility > 0) {
    for (const [country, score] of Object.entries(plausibilityScores)) {
      const normalizedWeight = (score / totalPlausibility) * bucketWeight;
      if (normalizedWeight > 0.001) { // 0.1% threshold
        result[country] = normalizedWeight;
        console.log(`  ${country}: ${(normalizedWeight * 100).toFixed(4)}% (plausibility=${score.toFixed(2)})`);
      }
    }
  }
  
  console.log(`[Restricted Fallback] Allocated to ${Object.keys(result).length} countries within P`);
  return result;
}

/**
 * Validate RF allocation
 */
export function validateRestrictedFallback(
  allocation: Record<string, number>,
  restrictedSet: string[],
  bucketWeight: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check all allocated countries are in restricted set
  for (const country of Object.keys(allocation)) {
    if (!restrictedSet.includes(country)) {
      errors.push(`${country} allocated but not in restricted set P`);
    }
  }
  
  // Check sum equals bucket weight
  const totalWeight = Object.values(allocation).reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - bucketWeight) > 0.01) {
    errors.push(`Total weight ${(totalWeight * 100).toFixed(2)}% does not match bucket weight ${(bucketWeight * 100).toFixed(2)}%`);
  }
  
  // Check for concentration
  const maxWeight = Math.max(...Object.values(allocation));
  if (maxWeight > bucketWeight * 0.5) {
    warnings.push(`High concentration: ${(maxWeight * 100).toFixed(2)}% in single country`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate RF summary for reporting
 */
export function generateRFSummary(
  restrictedSet: string[],
  allocation: Record<string, number>,
  sector: string,
  channel: string,
  reasoning: string
): string {
  const lines: string[] = [];
  
  lines.push(`\n=== RESTRICTED FALLBACK (RF) SUMMARY ===`);
  lines.push(`Channel: ${channel.toUpperCase()}`);
  lines.push(`Sector: ${sector}`);
  lines.push(`Reasoning: ${reasoning}`);
  lines.push(`\nRestricted Set P: ${restrictedSet.length} countries`);
  lines.push(`Countries: ${restrictedSet.slice(0, 10).join(', ')}${restrictedSet.length > 10 ? '...' : ''}`);
  lines.push(`\nAllocated: ${Object.keys(allocation).length} countries`);
  
  if (Object.keys(allocation).length > 0) {
    lines.push(`\nTop 10 allocations:`);
    const sorted = Object.entries(allocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [country, weight] of sorted) {
      lines.push(`  ${country}: ${(weight * 100).toFixed(4)}%`);
    }
  }
  
  return lines.join('\n');
}