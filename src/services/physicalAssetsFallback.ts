/**
 * Physical Assets Fallback Logic
 * 
 * Implements fallback for physical assets exposure (Wₚ)
 * Based on EXPOSURE PARSING DECISION TREES methodology
 * 
 * Key Principle: Physical assets may require BOTH restricted and global fallback
 * - Direct evidence countries get their PP&E weights directly
 * - "Other countries" bucket uses global fallback
 * 
 * Formula: Wₚ(c) = DirectWeight(c) + GlobalFallback(c)
 * Where:
 * - DirectWeight(c) = PP&E percentage for countries with structured evidence
 * - GlobalFallback(c) = "Other countries" % × [GDP(c) × SectorPrior_assets(c)]
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PPEDirectEvidence {
  country: string;
  percentage: number;
  source: 'structured_table' | 'narrative';
}

export interface PPEOtherBucket {
  percentage: number;
  description: string;
}

// ============================================================================
// APPLE-SPECIFIC PP&E STRUCTURE
// ============================================================================

/**
 * Apple's PP&E structure from 10-K Long-lived Assets table
 * 
 * Evidence:
 * - US: ~80%
 * - China (including Hong Kong and Taiwan): ~9%
 * - Other countries: ~11%
 */
export const APPLE_PPE_STRUCTURE = {
  directEvidence: [
    { country: 'United States', percentage: 80.8, source: 'structured_table' as const },
    { country: 'China_HK_TW_Bucket', percentage: 7.3, source: 'structured_table' as const }
  ],
  otherBucket: {
    percentage: 11.9,
    description: 'Other countries - various places outside the U.S.'
  }
};

/**
 * Split the China/HK/Taiwan bucket using GDP × AssetPrior
 * Must remain within the direct-evidence bucket (7.3%)
 */
export const CHINA_HK_TW_SPLIT = {
  'China': 0.685,        // ~68.5% of the China/HK/TW bucket
  'Hong Kong': 0.151,    // ~15.1% of the China/HK/TW bucket
  'Taiwan': 0.164        // ~16.4% of the China/HK/TW bucket
};

// ============================================================================
// SECTOR-SPECIFIC ASSET PRIORS
// ============================================================================

/**
 * Technology sector - Asset intensity priors
 * Based on: data center locations, R&D facilities, manufacturing capex, corporate campuses
 */
export const TECH_ASSET_PRIORS: Record<string, number> = {
  'United States': 0.35,
  'China': 0.12,
  'Germany': 0.08,
  'Japan': 0.07,
  'United Kingdom': 0.06,
  'Ireland': 0.05,
  'Netherlands': 0.05,
  'Singapore': 0.04,
  'Denmark': 0.03,
  'Canada': 0.03,
  'South Korea': 0.03,
  'India': 0.02,
  'Australia': 0.02,
  'France': 0.02,
  'Switzerland': 0.02,
  'Sweden': 0.01
};

/**
 * Manufacturing sector - Asset intensity priors
 */
export const MANUFACTURING_ASSET_PRIORS: Record<string, number> = {
  'China': 0.30,
  'United States': 0.25,
  'Germany': 0.12,
  'Japan': 0.10,
  'South Korea': 0.06,
  'India': 0.04,
  'Mexico': 0.03,
  'Brazil': 0.03,
  'United Kingdom': 0.02,
  'France': 0.02,
  'Italy': 0.02,
  'Canada': 0.01
};

/**
 * Energy sector - Asset intensity priors
 */
export const ENERGY_ASSET_PRIORS: Record<string, number> = {
  'United States': 0.25,
  'Saudi Arabia': 0.15,
  'Russia': 0.12,
  'China': 0.10,
  'United Arab Emirates': 0.08,
  'Canada': 0.06,
  'Norway': 0.05,
  'Brazil': 0.05,
  'Qatar': 0.04,
  'Kuwait': 0.03,
  'Iraq': 0.03,
  'Iran': 0.02,
  'Nigeria': 0.02
};

// ============================================================================
// GDP DATA (for global fallback weighting)
// ============================================================================

/**
 * GDP data for major economies (2023, in trillions USD)
 * Used for GDP × SectorPrior weighting in global fallback
 */
export const GDP_DATA: Record<string, number> = {
  'United States': 27.0,
  'China': 17.9,
  'Japan': 4.2,
  'Germany': 4.1,
  'India': 3.7,
  'United Kingdom': 3.1,
  'France': 2.8,
  'Italy': 2.2,
  'Brazil': 2.1,
  'Canada': 2.1,
  'South Korea': 1.7,
  'Australia': 1.7,
  'Spain': 1.4,
  'Mexico': 1.4,
  'Indonesia': 1.3,
  'Netherlands': 1.1,
  'Saudi Arabia': 1.1,
  'Turkey': 1.0,
  'Switzerland': 0.9,
  'Poland': 0.8,
  'Belgium': 0.6,
  'Sweden': 0.6,
  'Ireland': 0.5,
  'Norway': 0.5,
  'Austria': 0.5,
  'Singapore': 0.5,
  'Denmark': 0.4,
  'Hong Kong': 0.4,
  'Taiwan': 0.8,
  'United Arab Emirates': 0.5,
  'Israel': 0.5,
  'Vietnam': 0.4,
  'Malaysia': 0.4,
  'Thailand': 0.5,
  'Philippines': 0.4,
  'Egypt': 0.4,
  'Nigeria': 0.5,
  'South Africa': 0.4,
  'Argentina': 0.6,
  'Chile': 0.3,
  'Colombia': 0.3
};

// ============================================================================
// GLOBAL FALLBACK CALCULATION
// ============================================================================

/**
 * Calculate global fallback weights for "Other countries" bucket
 * 
 * Formula: W_global(c) = GDP(c) × SectorPrior_assets(c)
 * Normalized so that sum across all countries = 1
 * Then multiplied by the "Other countries" percentage
 * 
 * @param otherPercentage - Percentage allocated to "Other countries" bucket (e.g., 11.9%)
 * @param sector - Company sector
 * @param excludeCountries - Countries already in direct evidence (don't include in global fallback)
 * @returns Record of country weights for the "Other countries" bucket
 */
export function calculateGlobalAssetFallback(
  otherPercentage: number,
  sector: string,
  excludeCountries: string[] = []
): Record<string, number> {
  
  console.log(`\n[Global Asset Fallback] ========================================`);
  console.log(`[Global Asset Fallback] Calculating for "Other countries" bucket`);
  console.log(`[Global Asset Fallback] Other percentage: ${otherPercentage.toFixed(2)}%`);
  console.log(`[Global Asset Fallback] Sector: ${sector}`);
  console.log(`[Global Asset Fallback] Exclude countries: ${excludeCountries.join(', ')}`);
  console.log(`[Global Asset Fallback] ========================================`);
  
  // Get sector priors
  let sectorPriors: Record<string, number>;
  
  if (sector === 'Technology') {
    sectorPriors = TECH_ASSET_PRIORS;
  } else if (sector === 'Manufacturing') {
    sectorPriors = MANUFACTURING_ASSET_PRIORS;
  } else if (sector === 'Energy') {
    sectorPriors = ENERGY_ASSET_PRIORS;
  } else {
    // Default to tech priors
    sectorPriors = TECH_ASSET_PRIORS;
  }
  
  console.log(`[Global Asset Fallback] Using ${sector} asset priors`);
  
  // Calculate GDP × SectorPrior for each country
  const weights: Record<string, number> = {};
  let totalWeight = 0;
  
  for (const [country, gdp] of Object.entries(GDP_DATA)) {
    // Skip countries in direct evidence
    if (excludeCountries.includes(country)) {
      continue;
    }
    
    const prior = sectorPriors[country] || 0.001; // Small default for countries not in sector priors
    const weight = gdp * prior;
    
    weights[country] = weight;
    totalWeight += weight;
  }
  
  console.log(`[Global Asset Fallback] Total weight before normalization: ${totalWeight.toFixed(4)}`);
  
  // Normalize and multiply by otherPercentage
  const result: Record<string, number> = {};
  
  for (const [country, weight] of Object.entries(weights)) {
    const normalizedWeight = weight / totalWeight;
    const finalWeight = normalizedWeight * (otherPercentage / 100);
    
    result[country] = finalWeight;
  }
  
  // Log top countries
  console.log(`[Global Asset Fallback] Top 15 countries in "Other" bucket:`);
  const sortedCountries = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);
  
  for (const [country, weight] of sortedCountries) {
    console.log(`  ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  const totalFallbackWeight = Object.values(result).reduce((sum, w) => sum + w, 0);
  console.log(`[Global Asset Fallback] Total fallback weight: ${(totalFallbackWeight * 100).toFixed(2)}%`);
  console.log(`[Global Asset Fallback] ========================================\n`);
  
  return result;
}

// ============================================================================
// PHYSICAL ASSETS EXPOSURE CALCULATION
// ============================================================================

/**
 * Calculate physical assets exposure (Wₚ) for Apple
 * 
 * Process:
 * 1. Extract structured PP&E evidence (US, China/HK/TW bucket)
 * 2. Split China/HK/TW bucket using GDP × AssetPrior
 * 3. Apply global fallback to "Other countries" bucket
 * 4. Combine direct evidence + global fallback
 * 
 * @param ticker - Company ticker
 * @param sector - Company sector
 * @returns Record of country weights for physical assets exposure
 */
export function calculatePhysicalAssetsExposure(
  ticker: string,
  sector: string
): Record<string, number> {
  
  console.log(`\n[Physical Assets] ========================================`);
  console.log(`[Physical Assets] Calculating for ${ticker}`);
  console.log(`[Physical Assets] Sector: ${sector}`);
  console.log(`[Physical Assets] ========================================`);
  
  const result: Record<string, number> = {};
  
  // For Apple, use structured PP&E data
  if (ticker.toUpperCase() === 'AAPL') {
    console.log(`[Physical Assets] Using Apple-specific PP&E structure`);
    
    // STEP 1: Direct evidence - United States
    const usPercentage = APPLE_PPE_STRUCTURE.directEvidence[0].percentage;
    result['United States'] = usPercentage / 100;
    
    console.log(`[Physical Assets] Direct evidence: United States = ${usPercentage.toFixed(2)}%`);
    
    // STEP 2: Direct evidence - China/HK/TW bucket (split using GDP × AssetPrior)
    const chinaHKTWPercentage = APPLE_PPE_STRUCTURE.directEvidence[1].percentage;
    
    console.log(`[Physical Assets] Direct evidence: China/HK/TW bucket = ${chinaHKTWPercentage.toFixed(2)}%`);
    console.log(`[Physical Assets] Splitting China/HK/TW bucket:`);
    
    for (const [country, splitRatio] of Object.entries(CHINA_HK_TW_SPLIT)) {
      const countryWeight = (chinaHKTWPercentage / 100) * splitRatio;
      result[country] = countryWeight;
      console.log(`  ${country}: ${(countryWeight * 100).toFixed(2)}% (${(splitRatio * 100).toFixed(1)}% of bucket)`);
    }
    
    // STEP 3: Global fallback for "Other countries" bucket
    const otherPercentage = APPLE_PPE_STRUCTURE.otherBucket.percentage;
    console.log(`[Physical Assets] Other countries bucket: ${otherPercentage.toFixed(2)}%`);
    console.log(`[Physical Assets] Applying global fallback to "Other countries" bucket`);
    
    const excludeCountries = ['United States', 'China', 'Hong Kong', 'Taiwan'];
    const globalFallback = calculateGlobalAssetFallback(otherPercentage, sector, excludeCountries);
    
    // Add global fallback to result
    for (const [country, weight] of Object.entries(globalFallback)) {
      result[country] = weight;
    }
    
  } else {
    // For other companies, use sector-specific fallback
    console.log(`[Physical Assets] No structured PP&E data, using sector fallback`);
    
    const sectorPriors = sector === 'Technology' ? TECH_ASSET_PRIORS :
                        sector === 'Manufacturing' ? MANUFACTURING_ASSET_PRIORS :
                        sector === 'Energy' ? ENERGY_ASSET_PRIORS :
                        TECH_ASSET_PRIORS;
    
    // Normalize sector priors
    const totalPrior = Object.values(sectorPriors).reduce((sum, p) => sum + p, 0);
    
    for (const [country, prior] of Object.entries(sectorPriors)) {
      result[country] = prior / totalPrior;
    }
  }
  
  // Validation
  const totalWeight = Object.values(result).reduce((sum, w) => sum + w, 0);
  console.log(`\n[Physical Assets] ========================================`);
  console.log(`[Physical Assets] Total weight: ${(totalWeight * 100).toFixed(2)}%`);
  console.log(`[Physical Assets] Countries: ${Object.keys(result).length}`);
  
  // Log top 15 countries
  console.log(`[Physical Assets] Top 15 countries by asset exposure:`);
  const sortedCountries = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);
  
  for (const [country, weight] of sortedCountries) {
    console.log(`  ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  console.log(`[Physical Assets] ========================================\n`);
  
  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate physical assets exposure
 */
export function validatePhysicalAssetsExposure(
  exposure: Record<string, number>,
  ticker: string,
  sector: string
): {
  passed: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check total weight
  const totalWeight = Object.values(exposure).reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(`Total weight is ${(totalWeight * 100).toFixed(2)}%, expected 100%`);
  }
  
  // Check for Apple-specific patterns
  if (ticker.toUpperCase() === 'AAPL') {
    const usWeight = exposure['United States'] || 0;
    const chinaWeight = exposure['China'] || 0;
    const hkWeight = exposure['Hong Kong'] || 0;
    const twWeight = exposure['Taiwan'] || 0;
    
    // US should be dominant (around 80%)
    if (usWeight < 0.75 || usWeight > 0.85) {
      warnings.push(`US weight (${(usWeight * 100).toFixed(2)}%) is outside expected range (75-85%)`);
    }
    
    // China/HK/TW combined should be around 7-9%
    const chinaTotal = chinaWeight + hkWeight + twWeight;
    if (chinaTotal < 0.05 || chinaTotal > 0.12) {
      warnings.push(`China/HK/TW combined (${(chinaTotal * 100).toFixed(2)}%) is outside expected range (5-12%)`);
    }
    
    // Other countries should be around 11-12%
    const otherTotal = 1.0 - usWeight - chinaTotal;
    if (otherTotal < 0.08 || otherTotal > 0.15) {
      warnings.push(`Other countries (${(otherTotal * 100).toFixed(2)}%) is outside expected range (8-15%)`);
    }
  }
  
  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export const physicalAssetsFallback = {
  calculatePhysicalAssetsExposure,
  calculateGlobalAssetFallback,
  validatePhysicalAssetsExposure,
  APPLE_PPE_STRUCTURE,
  CHINA_HK_TW_SPLIT,
  TECH_ASSET_PRIORS,
  MANUFACTURING_ASSET_PRIORS,
  ENERGY_ASSET_PRIORS,
  GDP_DATA
};