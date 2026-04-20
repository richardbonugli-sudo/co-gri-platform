/**
 * Channel-Specific Fallback Formulations
 * 
 * Based on: Appendix v3.3 — Section 5: EXPOSURE CHANNELS — SPECIFIC FORMULATIONS
 * 
 * Each channel has different IndustryDemandProxy and sector variables:
 * - Revenue (Wᵣ): Penetration × Market Size
 * - Supply (Wₛ): HS code × AssemblyShare × ICIO flows
 * - Assets (Wₚ): GDP × AssetIntensity
 * - Financial (W𝒻): FinancialDepth (BIS × CPIS flows)
 * 
 * PHASE 1 FIX - Task 3: Added home country bias for financial channel
 */

import { COUNTRY_GDP_2023 } from './fallbackLogic';

// ============================================================================
// REVENUE CHANNEL FORMULATIONS
// ============================================================================

/**
 * Device/Product Penetration Rates by Country (for Tech sector)
 * Source: ITU, World Bank, Statista
 */
export const DEVICE_PENETRATION: Record<string, number> = {
  'United States': 0.95,
  'United Kingdom': 0.92,
  'Germany': 0.90,
  'Japan': 0.88,
  'South Korea': 0.96,
  'Singapore': 0.94,
  'Australia': 0.91,
  'Canada': 0.93,
  'France': 0.89,
  'Italy': 0.85,
  'Spain': 0.87,
  'China': 0.75,
  'India': 0.45,
  'Brazil': 0.70,
  'Mexico': 0.68,
  'Russia': 0.72,
  'Indonesia': 0.55,
  'Thailand': 0.65,
  'Vietnam': 0.60,
  'Philippines': 0.58
};

/**
 * Healthcare Expenditure as % of GDP (for Healthcare sector)
 * Source: WHO, World Bank
 */
export const HEALTHCARE_EXPENDITURE: Record<string, number> = {
  'United States': 0.17,
  'Switzerland': 0.12,
  'Germany': 0.12,
  'France': 0.12,
  'Japan': 0.11,
  'United Kingdom': 0.10,
  'Canada': 0.11,
  'Netherlands': 0.11,
  'Austria': 0.11,
  'Belgium': 0.10,
  'China': 0.06,
  'India': 0.04,
  'Brazil': 0.09,
  'Mexico': 0.06
};

/**
 * Vehicle Ownership per 1000 people (for Auto sector)
 * Source: OICA, World Bank
 */
export const VEHICLE_OWNERSHIP: Record<string, number> = {
  'United States': 850,
  'Italy': 695,
  'Germany': 589,
  'Japan': 591,
  'France': 569,
  'United Kingdom': 544,
  'Spain': 593,
  'Canada': 686,
  'Australia': 747,
  'South Korea': 459,
  'China': 173,
  'India': 22,
  'Brazil': 249,
  'Mexico': 278,
  'Russia': 373
};

/**
 * Calculate Revenue Channel IndustryDemandProxy
 * Formula: W_revenue(c) = (Penetration(c) × GDP(c)) / Σ(Penetration × GDP)
 */
export function calculateRevenueIndustryDemand(
  country: string,
  sector: string
): number {
  const gdp = COUNTRY_GDP_2023[country] || 0.01;
  let penetrationFactor: number;
  
  switch (sector) {
    case 'Technology':
      penetrationFactor = DEVICE_PENETRATION[country] || 0.5;
      break;
    case 'Healthcare':
      penetrationFactor = (HEALTHCARE_EXPENDITURE[country] || 0.05) * 10; // Scale up
      break;
    case 'Consumer Goods':
    case 'Retail':
      // Use GDP per capita proxy (higher GDP = higher consumption)
      penetrationFactor = Math.min(gdp / 1.0, 1.5); // Cap at 1.5x
      break;
    default:
      penetrationFactor = 1.0;
  }
  
  return gdp * penetrationFactor;
}

// ============================================================================
// SUPPLY CHAIN CHANNEL FORMULATIONS
// ============================================================================

/**
 * Assembly Share by Country (for Manufacturing/Tech sectors)
 * Represents final assembly vs component sourcing
 * Source: OECD ICIO, UN Comtrade
 */
export const ASSEMBLY_SHARE: Record<string, number> = {
  'China': 0.45,
  'Vietnam': 0.25,
  'Taiwan': 0.15,
  'South Korea': 0.20,
  'Thailand': 0.20,
  'Malaysia': 0.18,
  'Mexico': 0.30,
  'India': 0.22,
  'United States': 0.35,
  'Germany': 0.30,
  'Japan': 0.28
};

/**
 * HS Code Import Intensity (proxy for supply chain importance)
 * Higher values = more critical in global supply chains
 */
export const IMPORT_INTENSITY: Record<string, number> = {
  'China': 1.8,
  'Taiwan': 1.6,
  'South Korea': 1.5,
  'Vietnam': 1.4,
  'Thailand': 1.3,
  'Malaysia': 1.3,
  'Mexico': 1.2,
  'Germany': 1.4,
  'Japan': 1.3,
  'United States': 1.2,
  'India': 1.1
};

/**
 * Calculate Supply Chain IndustryDemandProxy
 * Formula: W_supply(c) = (ImportIntensity(c) × AssemblyShare(c) × ICIO_flow(c))
 */
export function calculateSupplyIndustryDemand(
  country: string,
  sector: string
): number {
  const gdp = COUNTRY_GDP_2023[country] || 0.01;
  const importIntensity = IMPORT_INTENSITY[country] || 0.8;
  const assemblyShare = ASSEMBLY_SHARE[country] || 0.1;
  
  // ICIO flow proxy (GDP-based with manufacturing adjustment)
  const isManufacturingEconomy = ['China', 'Germany', 'Japan', 'South Korea', 'Taiwan'].includes(country);
  const icioFlow = gdp * (isManufacturingEconomy ? 1.5 : 1.0);
  
  return importIntensity * assemblyShare * icioFlow;
}

// ============================================================================
// PHYSICAL ASSETS CHANNEL FORMULATIONS
// ============================================================================

/**
 * Asset Intensity Multipliers by Sector
 * Source: Industry reports, company 10-K analysis
 */
export const ASSET_INTENSITY_MULTIPLIERS: Record<string, number> = {
  'Energy': 2.8,
  'Telecommunications': 2.0,
  'Manufacturing': 1.7,
  'Retail': 1.2,
  'Healthcare': 1.2,
  'Consumer Goods': 1.0,
  'Technology': 0.8,
  'Financial Services': 0.6
};

/**
 * Calculate Physical Assets IndustryDemandProxy
 * Formula: W_assets(c) = GDP(c) × AssetIntensity(sector)
 */
export function calculateAssetsIndustryDemand(
  country: string,
  sector: string
): number {
  const gdp = COUNTRY_GDP_2023[country] || 0.01;
  const assetIntensity = ASSET_INTENSITY_MULTIPLIERS[sector] || 1.0;
  
  return gdp * assetIntensity;
}

// ============================================================================
// FINANCIAL CHANNEL FORMULATIONS
// ============================================================================

/**
 * Major Currency Distribution (Global Corporate Debt Patterns)
 * Source: BIS, IMF CPIS
 */
export const CURRENCY_DISTRIBUTION: Record<string, number> = {
  'USD': 0.45,  // United States
  'EUR': 0.25,  // Eurozone
  'JPY': 0.08,  // Japan
  'GBP': 0.07,  // United Kingdom
  'CNY': 0.06,  // China
  'CHF': 0.03,  // Switzerland
  'CAD': 0.02,  // Canada
  'AUD': 0.02,  // Australia
  'Other': 0.02
};

/**
 * Currency to Country Mapping
 */
export const CURRENCY_TO_COUNTRIES: Record<string, string[]> = {
  'USD': ['United States'],
  'EUR': ['Germany', 'France', 'Netherlands', 'Ireland', 'Belgium', 'Spain', 'Italy'],
  'JPY': ['Japan'],
  'GBP': ['United Kingdom'],
  'CNY': ['China'],
  'CHF': ['Switzerland'],
  'CAD': ['Canada'],
  'AUD': ['Australia']
};

/**
 * PHASE 1 FIX - Task 3: Country to Currency reverse mapping
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'United States': 'USD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Netherlands': 'EUR',
  'Ireland': 'EUR',
  'Belgium': 'EUR',
  'Spain': 'EUR',
  'Italy': 'EUR',
  'Japan': 'JPY',
  'United Kingdom': 'GBP',
  'China': 'CNY',
  'Switzerland': 'CHF',
  'Canada': 'CAD',
  'Australia': 'AUD'
};

/**
 * Financial Depth Index (BIS × CPIS flows)
 * Higher values = more important financial centers
 */
export const FINANCIAL_DEPTH: Record<string, number> = {
  'United States': 2.0,
  'United Kingdom': 1.8,
  'Switzerland': 1.6,
  'Singapore': 1.5,
  'Hong Kong': 1.5,
  'Luxembourg': 1.7,
  'Ireland': 1.4,
  'Germany': 1.3,
  'France': 1.2,
  'Japan': 1.2,
  'Netherlands': 1.3,
  'China': 1.1
};

/**
 * PHASE 1 FIX - Task 3: Extract mentioned currencies from narrative text
 */
export function extractMentionedCurrencies(narrativeText: string): string[] {
  const currencyPatterns = [
    /\bUSD\b/gi, /\bUS Dollar\b/gi,
    /\bEUR\b/gi, /\bEuro\b/gi,
    /\bJPY\b/gi, /\bJapanese Yen\b/gi, /\bYen\b/gi,
    /\bGBP\b/gi, /\bBritish Pound\b/gi, /\bPound Sterling\b/gi,
    /\bCNY\b/gi, /\bChinese Yuan\b/gi, /\bYuan\b/gi, /\bRMB\b/gi,
    /\bCHF\b/gi, /\bSwiss Franc\b/gi,
    /\bCAD\b/gi, /\bCanadian Dollar\b/gi,
    /\bAUD\b/gi, /\bAustralian Dollar\b/gi
  ];
  
  const currencyMapping: Record<string, string> = {
    'US DOLLAR': 'USD',
    'EURO': 'EUR',
    'JAPANESE YEN': 'JPY',
    'YEN': 'JPY',
    'BRITISH POUND': 'GBP',
    'POUND STERLING': 'GBP',
    'CHINESE YUAN': 'CNY',
    'YUAN': 'CNY',
    'RMB': 'CNY',
    'SWISS FRANC': 'CHF',
    'CANADIAN DOLLAR': 'CAD',
    'AUSTRALIAN DOLLAR': 'AUD'
  };
  
  const mentionedCurrencies = new Set<string>();
  
  for (const pattern of currencyPatterns) {
    const matches = narrativeText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const normalized = match.toUpperCase();
        const currency = currencyMapping[normalized] || normalized;
        
        // Only add if it's a valid 3-letter currency code
        if (currency.length === 3 && currency in CURRENCY_DISTRIBUTION) {
          mentionedCurrencies.add(currency);
        }
      }
    }
  }
  
  console.log(`[Financial Channel] Extracted currencies from narrative: ${Array.from(mentionedCurrencies).join(', ')}`);
  
  return Array.from(mentionedCurrencies);
}

/**
 * PHASE 1 FIX - Task 3: Calculate Financial Channel IndustryDemandProxy with home country bias
 * 
 * Formula: W_financial(c) = FinancialDepth(c) × CurrencyShare(c)
 * 
 * Home Country Bias:
 * - For U.S. issuers: Minimum 45% USD allocation (home currency bias)
 * - For other countries: Minimum 30-40% home currency allocation
 * - Mentioned currencies get boosted allocation
 * - Non-mentioned currencies get reduced allocation
 * 
 * @param country - Target country for allocation
 * @param sector - Company sector
 * @param homeCountry - Company's home country (optional)
 * @param mentionedCurrencies - Currencies explicitly mentioned in narrative (optional)
 */
export function calculateFinancialIndustryDemand(
  country: string,
  sector: string,
  homeCountry?: string,
  mentionedCurrencies?: string[]
): number {
  const financialDepth = FINANCIAL_DEPTH[country] || 0.5;
  
  // Find currency share for this country
  let currencyShare = 0;
  let countryCurrency = '';
  
  for (const [currency, countries] of Object.entries(CURRENCY_TO_COUNTRIES)) {
    if (countries.includes(country)) {
      currencyShare = CURRENCY_DISTRIBUTION[currency] || 0;
      countryCurrency = currency;
      break;
    }
  }
  
  // Base weight calculation
  let weight = financialDepth * currencyShare;
  
  // Sector adjustment (minimal for financial channel)
  const sectorAdjustment = sector === 'Financial Services' ? 1.2 : 1.0;
  weight *= sectorAdjustment;
  
  // PHASE 1 FIX - Task 3: Apply mentioned currency boost/reduction
  if (mentionedCurrencies && mentionedCurrencies.length > 0) {
    const isMentioned = mentionedCurrencies.includes(countryCurrency);
    const isHome = homeCountry && country === homeCountry;
    
    if (isMentioned && !isHome) {
      // Boost mentioned non-home currencies by 1.2x
      weight *= 1.2;
    } else if (!isMentioned && !isHome) {
      // Reduce non-mentioned, non-home currencies by 0.6x
      weight *= 0.6;
    }
    // Home country weight is not modified by mention status
  }
  
  return weight;
}

/**
 * PHASE 1 FIX - Task 3: Calculate financial channel exposure with home country bias
 * 
 * This is the main entry point for financial channel allocation
 * 
 * @param homeCountry - Company's home country
 * @param sector - Company sector
 * @param narrativeText - Financial narrative text (optional)
 * @returns Record of country weights
 */
export function calculateFinancialChannelExposure(
  homeCountry: string,
  sector: string,
  narrativeText?: string
): Record<string, number> {
  
  console.log(`\n[Financial Channel] ========================================`);
  console.log(`[Financial Channel] Calculating for home country: ${homeCountry}`);
  console.log(`[Financial Channel] Sector: ${sector}`);
  console.log(`[Financial Channel] ========================================`);
  
  // Extract mentioned currencies from narrative
  let mentionedCurrencies: string[] = [];
  if (narrativeText && narrativeText.trim().length > 0) {
    mentionedCurrencies = extractMentionedCurrencies(narrativeText);
  }
  
  // PHASE 1 FIX - Task 3: Add home currency if not mentioned (for U.S. issuers)
  const homeCurrency = COUNTRY_TO_CURRENCY[homeCountry];
  if (homeCurrency && !mentionedCurrencies.includes(homeCurrency)) {
    console.log(`[Financial Channel] Adding home currency ${homeCurrency} (not explicitly mentioned but implied)`);
    mentionedCurrencies.push(homeCurrency);
  }
  
  console.log(`[Financial Channel] Final currency set: ${mentionedCurrencies.join(', ')}`);
  
  // Calculate weights for all relevant countries
  const weights: Record<string, number> = {};
  
  // Get all countries that have currencies
  const allCountries = new Set<string>();
  for (const countries of Object.values(CURRENCY_TO_COUNTRIES)) {
    countries.forEach(c => allCountries.add(c));
  }
  
  // Calculate raw weights
  for (const country of allCountries) {
    const weight = calculateFinancialIndustryDemand(
      country,
      sector,
      homeCountry,
      mentionedCurrencies
    );
    
    if (weight > 0.001) {
      weights[country] = weight;
    }
  }
  
  // PHASE 1 FIX - Task 3: Apply home country minimum AFTER calculating all weights
  const homeCountryMinimum = homeCountry === 'United States' ? 0.47 : 0.35;
  
  // Calculate total weight excluding home country
  let totalWeightExcludingHome = 0;
  for (const [country, weight] of Object.entries(weights)) {
    if (country !== homeCountry) {
      totalWeightExcludingHome += weight;
    }
  }
  
  const homeWeight = weights[homeCountry] || 0;
  const totalWeight = homeWeight + totalWeightExcludingHome;
  
  // Calculate home country's natural share
  const homeNaturalShare = totalWeight > 0 ? homeWeight / totalWeight : 0;
  
  console.log(`[Financial Channel] Home country natural share: ${(homeNaturalShare * 100).toFixed(2)}%`);
  console.log(`[Financial Channel] Home country minimum: ${(homeCountryMinimum * 100).toFixed(0)}%`);
  
  // Normalize to 100% with home country bias
  const result: Record<string, number> = {};
  
  if (homeNaturalShare < homeCountryMinimum) {
    // Home country needs boost
    console.log(`[Financial Channel] Applying home country bias (boosting from ${(homeNaturalShare * 100).toFixed(2)}% to ${(homeCountryMinimum * 100).toFixed(0)}%)`);
    
    result[homeCountry] = homeCountryMinimum;
    
    // Distribute remaining weight proportionally among other countries
    const remainingWeight = 1.0 - homeCountryMinimum;
    
    if (totalWeightExcludingHome > 0) {
      for (const [country, weight] of Object.entries(weights)) {
        if (country !== homeCountry) {
          result[country] = (weight / totalWeightExcludingHome) * remainingWeight;
        }
      }
    }
  } else {
    // Normal normalization
    console.log(`[Financial Channel] Home country natural share sufficient, using normal normalization`);
    
    if (totalWeight > 0) {
      for (const [country, weight] of Object.entries(weights)) {
        result[country] = weight / totalWeight;
      }
    }
  }
  
  // Log results
  console.log(`\n[Financial Channel] Allocation Results:`);
  const sortedCountries = Object.entries(result)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [country, weight] of sortedCountries) {
    const currency = COUNTRY_TO_CURRENCY[country] || 'N/A';
    const isHome = country === homeCountry ? '(HOME)' : '';
    const isMentioned = mentionedCurrencies.includes(currency) ? '(MENTIONED)' : '';
    console.log(`  ${country.padEnd(20)} ${currency.padEnd(5)} ${(weight * 100).toFixed(2)}% ${isHome} ${isMentioned}`);
  }
  
  // Validation
  const totalAllocation = Object.values(result).reduce((sum, w) => sum + w, 0);
  const homeAllocation = result[homeCountry] || 0;
  
  console.log(`\n[Financial Channel] Validation:`);
  console.log(`  Total allocation: ${(totalAllocation * 100).toFixed(2)}%`);
  console.log(`  Home country (${homeCountry}): ${(homeAllocation * 100).toFixed(2)}%`);
  
  if (homeAllocation < 0.40 && homeCountry === 'United States') {
    console.warn(`  ⚠️ WARNING: U.S. home country allocation (${(homeAllocation * 100).toFixed(2)}%) below expected minimum (45%)`);
  } else if (homeAllocation >= homeCountryMinimum) {
    console.log(`  ✅ Home country allocation meets minimum requirement`);
  }
  
  console.log(`[Financial Channel] ========================================\n`);
  
  return result;
}

// ============================================================================
// UNIFIED INTERFACE
// ============================================================================

/**
 * Get IndustryDemandProxy for any channel
 */
export function getIndustryDemandProxy(
  country: string,
  sector: string,
  channel: 'revenue' | 'supply' | 'assets' | 'financial'
): number {
  switch (channel) {
    case 'revenue':
      return calculateRevenueIndustryDemand(country, sector);
    case 'supply':
      return calculateSupplyIndustryDemand(country, sector);
    case 'assets':
      return calculateAssetsIndustryDemand(country, sector);
    case 'financial':
      return calculateFinancialIndustryDemand(country, sector);
    default:
      return COUNTRY_GDP_2023[country] || 0.01;
  }
}

/**
 * Generate channel-specific fallback explanation
 */
export function generateChannelFallbackExplanation(
  channel: 'revenue' | 'supply' | 'assets' | 'financial',
  sector: string,
  fallbackType: 'SSF' | 'RF' | 'GF'
): string {
  const lines: string[] = [];
  
  lines.push(`\n📊 ${channel.toUpperCase()} CHANNEL - ${fallbackType} METHODOLOGY:`);
  
  switch (channel) {
    case 'revenue':
      lines.push(`Formula: W_revenue(c) = (Penetration(c) × GDP(c)) / Σ(Penetration × GDP)`);
      lines.push(`Sector Variable: ${sector === 'Technology' ? 'Device Penetration' : sector === 'Healthcare' ? 'Healthcare Expenditure' : 'Consumer Spending Proxy'}`);
      if (fallbackType === 'SSF') {
        lines.push(`Application: Within defined region only`);
      } else if (fallbackType === 'RF') {
        lines.push(`Application: Within restricted plausible set P`);
      } else {
        lines.push(`Application: Global universe`);
      }
      break;
      
    case 'supply':
      lines.push(`Formula: W_supply(c) = ImportIntensity(c) × AssemblyShare(c) × ICIO_flow(c)`);
      lines.push(`Data Sources: UN COMTRADE, OECD ICIO, Assembly Share adjustments`);
      if (fallbackType === 'SSF') {
        lines.push(`Application: Within defined supply region only`);
      } else if (fallbackType === 'RF') {
        lines.push(`Application: Sector-specific manufacturing hubs`);
      } else {
        lines.push(`Application: Global supply chain network`);
      }
      break;
      
    case 'assets':
      lines.push(`Formula: W_assets(c) = GDP(c) × AssetIntensity(sector)`);
      lines.push(`Asset Intensity Multiplier: ${ASSET_INTENSITY_MULTIPLIERS[sector] || 1.0}x`);
      if (fallbackType === 'SSF') {
        lines.push(`Application: Within defined asset region only`);
      } else if (fallbackType === 'RF') {
        lines.push(`Application: GDP-weighted within plausible set`);
      } else {
        lines.push(`Application: Global GDP-weighted distribution`);
      }
      break;
      
    case 'financial':
      lines.push(`Formula: W_financial(c) = FinancialDepth(c) × CurrencyShare(c) × HomeCountryBias`);
      lines.push(`Data Sources: BIS Banking Statistics, IMF CPIS`);
      lines.push(`Major Currencies: USD (45%), EUR (25%), JPY (8%), GBP (7%), CNY (6%)`);
      lines.push(`PHASE 1 FIX: Home country bias ensures minimum 47% allocation to home currency for US issuers`);
      if (fallbackType === 'SSF') {
        lines.push(`Application: Within defined financial region (rare)`);
      } else if (fallbackType === 'RF') {
        lines.push(`Application: Currency decomposition within plausible set`);
      } else {
        lines.push(`Application: Global currency distribution with home country bias`);
      }
      break;
  }
  
  return lines.join('\n');
}