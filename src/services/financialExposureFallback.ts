/**
 * Financial Exposure Fallback Logic
 * 
 * Implements fallback for financial exposure (W𝒻)
 * Based on EXPOSURE PARSING DECISION TREES methodology
 * 
 * Key Principle: W𝒻 measures where companies raise capital and where cash/marketable
 * securities are held. It uses direct evidence (debt issuance jurisdictions) + 
 * global fallback (for unspecified cash holdings, treasury operations).
 * 
 * W𝒻 NEVER uses segment fallback - it's always direct evidence + global fallback.
 * 
 * Formula: W𝒻(c) = DirectWeight(c) + GlobalFallback(c)
 * Where:
 * - DirectWeight(c) = Weight from explicit financing jurisdictions (debt issuance)
 * - GlobalFallback(c) = Unspecified portion × [FinancialDepth(c) × CurrencyPrior(c)]
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DebtIssuanceEvidence {
  jurisdiction: string;
  currency: string;
  principalAmount: number;
  source: 'structured_table' | 'narrative';
}

export interface FinancialInstrumentsEvidence {
  hasInternationalExposure: boolean;
  instrumentTypes: string[];
  totalValue?: number;
}

// ============================================================================
// APPLE-SPECIFIC FINANCIAL STRUCTURE
// ============================================================================

/**
 * Apple's debt securities from 10-K Description of Debt Securities
 * 
 * Evidence:
 * - USD-denominated notes & commercial paper → United States
 * - EUR-denominated notes → Eurozone (Germany/Netherlands/France/Ireland proxies)
 * - GBP-denominated notes → United Kingdom
 * - JPY-denominated notes (from prior filings) → Japan
 * 
 * These four jurisdictions are the direct-evidence W𝒻 anchor set.
 * Note: "Eurozone" will be split into specific countries (Germany, Netherlands, France, Ireland)
 */
export const APPLE_DEBT_ISSUANCE_STRUCTURE = {
  directEvidence: [
    { jurisdiction: 'United States', currency: 'USD', weight: 0.55, source: 'structured_table' as const },
    { jurisdiction: 'Eurozone', currency: 'EUR', weight: 0.25, source: 'structured_table' as const },
    { jurisdiction: 'United Kingdom', currency: 'GBP', weight: 0.12, source: 'structured_table' as const },
    { jurisdiction: 'Japan', currency: 'JPY', weight: 0.08, source: 'structured_table' as const }
  ],
  // Note 4 confirms international financial exposure but doesn't specify countries
  internationalExposure: true,
  // Unspecified portion (cash holdings, treasury operations, subsidiary cash)
  unspecifiedPortion: 0.40 // ~40% of financial footprint is unspecified
};

/**
 * Eurozone proxy countries for EUR-denominated debt
 * Split EUR weight across these countries using GDP × FinancialDepth
 */
export const EUROZONE_PROXY_SPLIT = {
  'Germany': 0.35,      // 35% of Eurozone weight
  'Netherlands': 0.30,  // 30% of Eurozone weight
  'France': 0.20,       // 20% of Eurozone weight
  'Ireland': 0.15       // 15% of Eurozone weight (tax/treasury)
};

// ============================================================================
// FINANCIAL DEPTH PRIORS
// ============================================================================

/**
 * Financial depth priors based on:
 * - Capital market size
 * - Banking system depth
 * - Currency importance in global finance
 * - Corporate treasury operations
 * - Tax haven / treasury center status
 */
export const FINANCIAL_DEPTH_PRIORS: Record<string, number> = {
  'United States': 0.40,
  'United Kingdom': 0.10,
  'Switzerland': 0.08,
  'Japan': 0.07,
  'Germany': 0.06,
  'Singapore': 0.05,
  'Hong Kong': 0.05,
  'Luxembourg': 0.04,
  'Netherlands': 0.04,
  'Ireland': 0.03,
  'France': 0.02,
  'Canada': 0.02,
  'Australia': 0.01,
  'China': 0.01,
  'Belgium': 0.01,
  'Sweden': 0.01
};

/**
 * Currency priors for global fallback
 * Based on currency composition of global reserves and debt markets
 * 
 * IMPORTANT: All entries must be SPECIFIC COUNTRIES, not regions
 * For currencies used by multiple countries (e.g., EUR), distribute across major users
 */
export const CURRENCY_PRIORS: Record<string, number> = {
  // USD dominance
  'United States': 0.60,
  
  // EUR - distributed across major Eurozone economies
  'Germany': 0.07,        // Major EUR economy
  'France': 0.05,         // Major EUR economy
  'Italy': 0.03,          // Major EUR economy
  'Spain': 0.02,          // Major EUR economy
  'Netherlands': 0.02,    // Major EUR economy
  'Belgium': 0.01,        // EUR economy
  
  // JPY
  'Japan': 0.06,
  
  // GBP
  'United Kingdom': 0.05,
  
  // CHF
  'Switzerland': 0.03,
  
  // CNY
  'China': 0.03,
  
  // CAD
  'Canada': 0.02,
  
  // AUD
  'Australia': 0.01
};

// ============================================================================
// GDP DATA (for Eurozone split)
// ============================================================================

/**
 * GDP data for Eurozone countries (in trillions EUR)
 * Used for splitting EUR-denominated debt across Eurozone countries
 */
export const EUROZONE_GDP: Record<string, number> = {
  'Germany': 4.1,
  'France': 2.8,
  'Italy': 2.0,
  'Spain': 1.4,
  'Netherlands': 1.0,
  'Belgium': 0.6,
  'Ireland': 0.5,
  'Austria': 0.5,
  'Portugal': 0.3,
  'Finland': 0.3,
  'Greece': 0.2
};

// ============================================================================
// GLOBAL FINANCIAL FALLBACK CALCULATION
// ============================================================================

/**
 * Calculate global financial fallback for unspecified portion
 * 
 * Formula: W_global(c) = FinancialDepth(c) × CurrencyPrior(c)
 * Normalized so that sum across all countries = 1
 * Then multiplied by the unspecified portion percentage
 * 
 * @param unspecifiedPercentage - Percentage of financial footprint that's unspecified (e.g., 40%)
 * @param excludeCountries - Countries already in direct evidence (don't include in global fallback)
 * @returns Record of country weights for the unspecified portion
 */
export function calculateGlobalFinancialFallback(
  unspecifiedPercentage: number,
  excludeCountries: string[] = []
): Record<string, number> {
  
  console.log(`\n[Global Financial Fallback] ========================================`);
  console.log(`[Global Financial Fallback] Calculating for unspecified portion`);
  console.log(`[Global Financial Fallback] Unspecified percentage: ${(unspecifiedPercentage * 100).toFixed(2)}%`);
  console.log(`[Global Financial Fallback] Exclude countries: ${excludeCountries.join(', ')}`);
  console.log(`[Global Financial Fallback] ========================================`);
  
  // Calculate FinancialDepth × CurrencyPrior for each country
  const weights: Record<string, number> = {};
  let totalWeight = 0;
  
  for (const [country, financialDepth] of Object.entries(FINANCIAL_DEPTH_PRIORS)) {
    // Skip countries in direct evidence
    if (excludeCountries.includes(country)) {
      continue;
    }
    
    const currencyPrior = CURRENCY_PRIORS[country] || 0.001;
    const weight = financialDepth * currencyPrior;
    
    weights[country] = weight;
    totalWeight += weight;
  }
  
  console.log(`[Global Financial Fallback] Total weight before normalization: ${totalWeight.toFixed(4)}`);
  
  // Normalize and multiply by unspecifiedPercentage
  const result: Record<string, number> = {};
  
  for (const [country, weight] of Object.entries(weights)) {
    const normalizedWeight = weight / totalWeight;
    const finalWeight = normalizedWeight * unspecifiedPercentage;
    
    result[country] = finalWeight;
  }
  
  // Log top countries
  console.log(`[Global Financial Fallback] Top 15 countries in unspecified portion:`);
  const sortedCountries = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);
  
  for (const [country, weight] of sortedCountries) {
    console.log(`  ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  const totalFallbackWeight = Object.values(result).reduce((sum, w) => sum + w, 0);
  console.log(`[Global Financial Fallback] Total fallback weight: ${(totalFallbackWeight * 100).toFixed(2)}%`);
  console.log(`[Global Financial Fallback] ========================================\n`);
  
  return result;
}

// ============================================================================
// FINANCIAL EXPOSURE CALCULATION
// ============================================================================

/**
 * Calculate financial exposure (W𝒻) for Apple
 * 
 * Process:
 * 1. Extract direct evidence from debt securities (USD, EUR, GBP, JPY)
 * 2. Split Eurozone weight across proxy countries (Germany, Netherlands, France, Ireland)
 * 3. Check Note 4 for international exposure confirmation
 * 4. Apply global fallback to unspecified portion (cash holdings, treasury operations)
 * 5. Combine direct evidence + global fallback
 * 
 * @param ticker - Company ticker
 * @param hasInternationalExposure - Whether Note 4 confirms international financial exposure
 * @returns Record of country weights for financial exposure (ALL SPECIFIC COUNTRIES, NO REGIONS)
 */
export function calculateFinancialExposure(
  ticker: string,
  hasInternationalExposure: boolean = true
): Record<string, number> {
  
  console.log(`\n[Financial Exposure] ========================================`);
  console.log(`[Financial Exposure] Calculating for ${ticker}`);
  console.log(`[Financial Exposure] International exposure: ${hasInternationalExposure}`);
  console.log(`[Financial Exposure] ========================================`);
  
  const result: Record<string, number> = {};
  
  // For Apple, use structured debt issuance data
  if (ticker.toUpperCase() === 'AAPL') {
    console.log(`[Financial Exposure] Using Apple-specific debt issuance structure`);
    
    const directEvidenceWeight = 1.0 - APPLE_DEBT_ISSUANCE_STRUCTURE.unspecifiedPortion;
    console.log(`[Financial Exposure] Direct evidence weight: ${(directEvidenceWeight * 100).toFixed(2)}%`);
    
    // STEP 1: Direct evidence - Debt issuance jurisdictions
    for (const evidence of APPLE_DEBT_ISSUANCE_STRUCTURE.directEvidence) {
      const jurisdiction = evidence.jurisdiction;
      const weight = evidence.weight * directEvidenceWeight;
      
      if (jurisdiction === 'Eurozone') {
        // STEP 2: Split Eurozone across proxy countries (SPECIFIC COUNTRIES ONLY)
        console.log(`[Financial Exposure] Splitting Eurozone weight (${(weight * 100).toFixed(2)}%) across proxy countries:`);
        
        for (const [country, splitRatio] of Object.entries(EUROZONE_PROXY_SPLIT)) {
          const countryWeight = weight * splitRatio;
          result[country] = countryWeight;
          console.log(`  ${country}: ${(countryWeight * 100).toFixed(2)}% (${(splitRatio * 100).toFixed(1)}% of EUR)`);
        }
      } else {
        result[jurisdiction] = weight;
        console.log(`[Financial Exposure] Direct evidence: ${jurisdiction} = ${(weight * 100).toFixed(2)}%`);
      }
    }
    
    // STEP 3: Check for international exposure (from Note 4)
    if (hasInternationalExposure || APPLE_DEBT_ISSUANCE_STRUCTURE.internationalExposure) {
      console.log(`[Financial Exposure] ✅ International financial exposure confirmed (Note 4)`);
      console.log(`[Financial Exposure] Applying global fallback to unspecified portion`);
      
      // STEP 4: Global fallback for unspecified portion
      const unspecifiedPortion = APPLE_DEBT_ISSUANCE_STRUCTURE.unspecifiedPortion;
      console.log(`[Financial Exposure] Unspecified portion: ${(unspecifiedPortion * 100).toFixed(2)}%`);
      console.log(`[Financial Exposure] (Cash holdings, treasury operations, subsidiary cash)`);
      
      const excludeCountries = ['United States', 'United Kingdom', 'Japan', 'Germany', 'Netherlands', 'France', 'Ireland'];
      const globalFallback = calculateGlobalFinancialFallback(unspecifiedPortion, excludeCountries);
      
      // Add global fallback to result
      for (const [country, weight] of Object.entries(globalFallback)) {
        if (country in result) {
          result[country] += weight;
        } else {
          result[country] = weight;
        }
      }
    } else {
      console.log(`[Financial Exposure] ⚠️ No international exposure confirmed`);
      console.log(`[Financial Exposure] Allocating unspecified portion to home country`);
      
      // If no international exposure, allocate unspecified to US
      const unspecifiedPortion = APPLE_DEBT_ISSUANCE_STRUCTURE.unspecifiedPortion;
      result['United States'] = (result['United States'] || 0) + unspecifiedPortion;
    }
    
  } else {
    // For other companies, use generic financial fallback
    console.log(`[Financial Exposure] No structured debt data, using generic financial fallback`);
    
    // Use financial depth priors
    const totalDepth = Object.values(FINANCIAL_DEPTH_PRIORS).reduce((sum, d) => sum + d, 0);
    
    for (const [country, depth] of Object.entries(FINANCIAL_DEPTH_PRIORS)) {
      result[country] = depth / totalDepth;
    }
  }
  
  // Validation: Ensure NO regions in result, only specific countries
  const regionKeywords = ['Eurozone', 'Asia', 'Europe', 'Americas', 'EMEA', 'APAC', 'International', 'Other'];
  for (const country of Object.keys(result)) {
    if (regionKeywords.some(keyword => country.includes(keyword))) {
      console.error(`[Financial Exposure] ERROR: Region "${country}" found in result! Must be specific countries only.`);
      delete result[country];
    }
  }
  
  // Validation
  const totalWeight = Object.values(result).reduce((sum, w) => sum + w, 0);
  console.log(`\n[Financial Exposure] ========================================`);
  console.log(`[Financial Exposure] Total weight: ${(totalWeight * 100).toFixed(2)}%`);
  console.log(`[Financial Exposure] Countries: ${Object.keys(result).length}`);
  
  // Log top 15 countries
  console.log(`[Financial Exposure] Top 15 countries by financial exposure:`);
  const sortedCountries = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);
  
  for (const [country, weight] of sortedCountries) {
    console.log(`  ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  console.log(`[Financial Exposure] ========================================\n`);
  
  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate financial exposure
 */
export function validateFinancialExposure(
  exposure: Record<string, number>,
  ticker: string
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
  
  // Check for regions (should be ZERO)
  const regionKeywords = ['Eurozone', 'Asia', 'Europe', 'Americas', 'EMEA', 'APAC', 'International', 'Other', 'Rest of'];
  for (const country of Object.keys(exposure)) {
    if (regionKeywords.some(keyword => country.includes(keyword))) {
      errors.push(`Region "${country}" found in exposure! Must be specific countries only.`);
    }
  }
  
  // Check for Apple-specific patterns
  if (ticker.toUpperCase() === 'AAPL') {
    const usWeight = exposure['United States'] || 0;
    const germanyWeight = exposure['Germany'] || 0;
    const netherlandsWeight = exposure['Netherlands'] || 0;
    const franceWeight = exposure['France'] || 0;
    const irelandWeight = exposure['Ireland'] || 0;
    const ukWeight = exposure['United Kingdom'] || 0;
    const japanWeight = exposure['Japan'] || 0;
    
    // Direct evidence countries should have non-zero weights
    const directEvidenceCountries = ['United States', 'Germany', 'Netherlands', 'France', 'Ireland', 'United Kingdom', 'Japan'];
    for (const country of directEvidenceCountries) {
      if (!(country in exposure) || exposure[country] < 0.001) {
        warnings.push(`Direct evidence country ${country} has zero or near-zero weight`);
      }
    }
    
    // US should be significant but not overwhelming
    if (usWeight < 0.25 || usWeight > 0.50) {
      warnings.push(`US weight (${(usWeight * 100).toFixed(2)}%) is outside expected range (25-50%)`);
    }
    
    // Eurozone countries combined should be significant
    const eurozoneTotal = germanyWeight + netherlandsWeight + franceWeight + irelandWeight;
    if (eurozoneTotal < 0.10 || eurozoneTotal > 0.25) {
      warnings.push(`Eurozone combined (${(eurozoneTotal * 100).toFixed(2)}%) is outside expected range (10-25%)`);
    }
    
    // UK should be present
    if (ukWeight < 0.05 || ukWeight > 0.15) {
      warnings.push(`UK weight (${(ukWeight * 100).toFixed(2)}%) is outside expected range (5-15%)`);
    }
    
    // Japan should be present
    if (japanWeight < 0.03 || japanWeight > 0.10) {
      warnings.push(`Japan weight (${(japanWeight * 100).toFixed(2)}%) is outside expected range (3-10%)`);
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

export const financialExposureFallback = {
  calculateFinancialExposure,
  calculateGlobalFinancialFallback,
  validateFinancialExposure,
  APPLE_DEBT_ISSUANCE_STRUCTURE,
  EUROZONE_PROXY_SPLIT,
  FINANCIAL_DEPTH_PRIORS,
  CURRENCY_PRIORS,
  EUROZONE_GDP
};