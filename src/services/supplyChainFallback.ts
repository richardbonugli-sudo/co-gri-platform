/**
 * Supply Chain Fallback Logic
 * 
 * Implements segment-specific fallback for supply chain exposure (Wₛ)
 * Based on EXPOSURE PARSING DECISION TREES methodology
 * 
 * Key Principle: Supply chain NEVER uses global fallback. Always use
 * sector-specific restricted fallback within defined regions.
 * 
 * PHASE 1 FIX - Task 2: Enhanced RF-B trigger with membership signal detection
 * 
 * Formula: Wₛ(c) = Σ_r S_r · w(c|r)
 * Where:
 * - S_r = supply region share (from narrative evidence)
 * - w(c|r) = sector-specific supply weight for country c within region r
 * - w(c|r) = T_s(c) / Σ_{k∈R_s} T_s(k) for c ∈ R_s
 * - T_s(c) = IndustrySupplyProxy (manufacturing capacity, supplier density, etc.)
 */

import { 
  constructRestrictedSet, 
  applyRestrictedFallback,
  calculateSectorPlausibility 
} from './restrictedFallback';
import { calculateSupplyIndustryDemand } from './channelSpecificFallback';

// ============================================================================
// SUPPLY REGION DEFINITIONS
// ============================================================================

/**
 * Apple's supply chain region definitions from 10-K narrative
 */
export const APPLE_SUPPLY_REGIONS: Record<string, string[]> = {
  'Asia': [
    'China',
    'Taiwan',
    'South Korea',
    'Japan',
    'Vietnam',
    'Thailand',
    'Malaysia',
    'Singapore',
    'India',
    'Indonesia',
    'Philippines'
  ],
  'Europe': [
    'Germany',
    'United Kingdom',
    'France',
    'Italy',
    'Spain',
    'Netherlands',
    'Switzerland',
    'Belgium',
    'Sweden',
    'Austria',
    'Poland',
    'Czech Republic',
    'Ireland'
  ],
  'United States': ['United States'],
  'North America': ['United States', 'Canada', 'Mexico']
};

/**
 * Generic supply region definitions for other companies
 */
export const GENERIC_SUPPLY_REGIONS: Record<string, string[]> = {
  'Asia': ['China', 'Taiwan', 'South Korea', 'Japan', 'Vietnam', 'Thailand', 'Malaysia', 'Singapore', 'India'],
  'Europe': ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Czech Republic'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'Latin America': ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia']
};

// ============================================================================
// SECTOR-SPECIFIC SUPPLY TEMPLATES (IndustrySupplyProxy)
// ============================================================================

/**
 * Apple-specific supply chain template
 * Based on: supplier density, manufacturing capacity, assembly operations
 * 
 * Evidence sources:
 * - 10-K: "significant majority of manufacturing is done by outsourcing partners in China, India, Japan, South Korea, Taiwan, Vietnam"
 * - 10-K: "partners primarily located in Asia for final assembly"
 * - Supplier list PDF showing dense clusters
 * - Recent news: China still dominant, but shifting to India and Vietnam
 */
export const APPLE_SUPPLY_TEMPLATE: Record<string, number> = {
  // Primary manufacturing hubs
  'China': 0.50,              // Still central for assembly & components (40-55%)
  'Vietnam': 0.15,            // Major new hub for components/assembly (10-20%)
  'India': 0.12,              // Rapidly growing, esp. US-bound iPhones (10-20%)
  
  // Key component suppliers
  'Taiwan': 0.08,             // Chips, key components (5-10%)
  'South Korea': 0.05,        // Displays, memory (3-7%)
  'Japan': 0.04,              // Precision components, camera modules (3-6%)
  
  // Secondary hubs
  'Thailand': 0.02,           // Components, hard drives
  'Malaysia': 0.015,          // Components, packaging
  'Singapore': 0.01,          // High-tech components
  
  // Emerging/strategic
  'Mexico': 0.008,            // Assembly for Americas
  'United States': 0.005,     // High-value fab, logistics
  'Indonesia': 0.003,
  'Philippines': 0.002
};

/**
 * Technology sector - Electronics manufacturing template
 */
export const TECH_ELECTRONICS_SUPPLY_TEMPLATE: Record<string, number> = {
  'China': 0.40,
  'Taiwan': 0.15,
  'South Korea': 0.12,
  'Vietnam': 0.10,
  'Japan': 0.08,
  'Thailand': 0.05,
  'Malaysia': 0.04,
  'India': 0.03,
  'Mexico': 0.02,
  'United States': 0.01
};

/**
 * Technology sector - Semiconductor template
 */
export const TECH_SEMICONDUCTOR_SUPPLY_TEMPLATE: Record<string, number> = {
  'Taiwan': 0.35,
  'South Korea': 0.25,
  'China': 0.15,
  'United States': 0.10,
  'Japan': 0.08,
  'Singapore': 0.04,
  'Malaysia': 0.02,
  'Germany': 0.01
};

/**
 * Manufacturing sector - General template
 */
export const MANUFACTURING_SUPPLY_TEMPLATE: Record<string, number> = {
  'China': 0.35,
  'Germany': 0.15,
  'United States': 0.12,
  'Japan': 0.10,
  'South Korea': 0.08,
  'Mexico': 0.07,
  'India': 0.05,
  'Vietnam': 0.04,
  'Thailand': 0.02,
  'Poland': 0.02
};

/**
 * Automotive sector - Supply template
 */
export const AUTOMOTIVE_SUPPLY_TEMPLATE: Record<string, number> = {
  'Germany': 0.25,
  'China': 0.20,
  'Japan': 0.15,
  'United States': 0.12,
  'South Korea': 0.10,
  'Mexico': 0.08,
  'Czech Republic': 0.04,
  'Poland': 0.03,
  'Slovakia': 0.02,
  'India': 0.01
};

/**
 * Pharmaceutical sector - Supply template
 */
export const PHARMA_SUPPLY_TEMPLATE: Record<string, number> = {
  'Switzerland': 0.20,
  'Ireland': 0.18,
  'India': 0.15,
  'United States': 0.12,
  'Germany': 0.10,
  'Singapore': 0.08,
  'China': 0.07,
  'United Kingdom': 0.05,
  'Belgium': 0.03,
  'Puerto Rico': 0.02
};

// ============================================================================
// SUPPLY CHAIN EVIDENCE EXTRACTION (PHASE 1 FIX - Task 2)
// ============================================================================

/**
 * PHASE 1 FIX - Task 2: Enhanced membership signal extraction
 * 
 * Extract explicit supply countries from narrative text with structured output
 * Looks for patterns like:
 * - "manufacturing partners in China, Vietnam, and India"
 * - "suppliers located in Asia"
 * - "assembly operations in China and Vietnam"
 * 
 * Returns structured data for RF-B triggering
 */
export interface MembershipSignals {
  explicitCountries: string[];
  regions: string[];
  hasMembershipSignals: boolean;
  signalStrength: 'strong' | 'medium' | 'weak';
  excludesHomeCountry: boolean;
}

export function extractSupplyCountriesFromNarrative(
  narrative: string,
  homeCountry: string = 'United States'
): MembershipSignals {
  const explicitCountries: Set<string> = new Set();
  const regions: Set<string> = new Set();
  
  // Enhanced country patterns with proper capitalization
  const countryPattern = /\b(China|Taiwan|South Korea|Japan|Vietnam|Thailand|Malaysia|Singapore|India|Indonesia|Philippines|United States|Mexico|Germany|United Kingdom|France|Italy|Spain|Brazil|Canada|Ireland|Switzerland|Poland|Czech Republic|Slovakia|Belgium|Netherlands|Sweden|Austria|Hong Kong|South Africa|Australia|New Zealand|Russia|Turkey|Israel|Saudi Arabia|United Arab Emirates|Egypt|Nigeria|Argentina|Chile|Colombia|Peru|Venezuela)(?:\s+\([^)]+\))?\b/gi;
  
  // Region patterns
  const regionPattern = /\b(Asia|Southeast Asia|East Asia|Europe|North America|Latin America|EMEA|APAC|Americas|Middle East|Africa)(?:\s+\([^)]+\))?\b/gi;
  
  // Extract countries
  const countryMatches = narrative.match(countryPattern);
  if (countryMatches) {
    countryMatches.forEach(match => {
      // Remove parenthetical descriptions like "(Foxconn)" or "(TSMC for chips)"
      const cleanMatch = match.replace(/\s*\([^)]+\)\s*/g, '').trim();
      // Normalize country names
      const normalized = cleanMatch
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      explicitCountries.add(normalized);
    });
  }
  
  // Extract regions
  const regionMatches = narrative.match(regionPattern);
  if (regionMatches) {
    regionMatches.forEach(match => {
      const cleanMatch = match.replace(/\s*\([^)]+\)\s*/g, '').trim();
      const normalized = cleanMatch
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      regions.add(normalized);
    });
  }
  
  // Determine if home country is explicitly mentioned
  const excludesHomeCountry = !explicitCountries.has(homeCountry);
  
  // Determine signal strength
  let signalStrength: 'strong' | 'medium' | 'weak' = 'weak';
  const countryCount = explicitCountries.size;
  
  if (countryCount >= 5) {
    signalStrength = 'strong';
  } else if (countryCount >= 3) {
    signalStrength = 'medium';
  } else if (countryCount >= 1) {
    signalStrength = 'weak';
  }
  
  // Has membership signals if we found explicit countries
  const hasMembershipSignals = explicitCountries.size > 0;
  
  console.log(`[Supply Chain] Membership signal extraction:`);
  console.log(`  Explicit countries: ${Array.from(explicitCountries).join(', ')}`);
  console.log(`  Regions: ${Array.from(regions).join(', ')}`);
  console.log(`  Signal strength: ${signalStrength}`);
  console.log(`  Excludes home country (${homeCountry}): ${excludesHomeCountry}`);
  
  return {
    explicitCountries: Array.from(explicitCountries),
    regions: Array.from(regions),
    hasMembershipSignals,
    signalStrength,
    excludesHomeCountry
  };
}

// ============================================================================
// RF-B INTEGRATION FOR SUPPLY CHAIN (PHASE 1 FIX - Task 2)
// ============================================================================

/**
 * PHASE 1 FIX - Task 2: Calculate supply chain exposure using RF-B when membership signals exist
 * 
 * Decision tree:
 * 1. Extract membership signals from narrative
 * 2. If strong/medium signals exist → trigger RF-B
 * 3. If weak signals or no signals → use sector templates
 * 
 * RF-B Formula for Supply Chain:
 * - Build restricted set P from explicitly named countries
 * - Exclude home country if not mentioned
 * - Apply sector-specific supply weights within P only
 * 
 * @param narrative - Supply chain narrative text
 * @param ticker - Company ticker
 * @param sector - Company sector
 * @param homeCountry - Company home country
 * @returns Record of country weights for supply chain exposure
 */
export function calculateSupplyChainExposureWithRFB(
  narrative: string,
  ticker: string,
  sector: string,
  homeCountry: string = 'United States'
): Record<string, number> {
  
  console.log(`\n[Supply Chain RF-B] ========================================`);
  console.log(`[Supply Chain RF-B] Calculating for ${ticker}`);
  console.log(`[Supply Chain RF-B] Home country: ${homeCountry}`);
  console.log(`[Supply Chain RF-B] Sector: ${sector}`);
  console.log(`[Supply Chain RF-B] ========================================`);
  
  // Step 1: Extract membership signals
  const signals = extractSupplyCountriesFromNarrative(narrative, homeCountry);
  
  // Step 2: Decide whether to trigger RF-B
  const shouldTriggerRFB = signals.hasMembershipSignals && 
                           (signals.signalStrength === 'strong' || signals.signalStrength === 'medium');
  
  if (shouldTriggerRFB) {
    console.log(`[Supply Chain RF-B] ✅ Triggering RF-B (${signals.signalStrength} membership signals)`);
    return applyRFBToSupplyChain(signals, ticker, sector, homeCountry);
  } else {
    console.log(`[Supply Chain RF-B] ⚠️ No strong membership signals, using sector template fallback`);
    return calculateSupplyChainExposureLegacy(signals.explicitCountries, signals.regions, ticker, sector);
  }
}

/**
 * PHASE 1 FIX - Task 2: Apply RF-B formula to supply chain
 * 
 * Process:
 * 1. Build restricted set P from explicit countries
 * 2. Exclude home country if not mentioned in narrative
 * 3. Calculate sector-specific supply weights within P
 * 4. Normalize to 100%
 */
function applyRFBToSupplyChain(
  signals: MembershipSignals,
  ticker: string,
  sector: string,
  homeCountry: string
): Record<string, number> {
  
  console.log(`[Supply Chain RF-B] Building restricted set P...`);
  
  // Build restricted set P
  const restrictedSet = signals.explicitCountries.filter(country => {
    // Exclude home country if not mentioned in supply chain narrative
    if (signals.excludesHomeCountry && country === homeCountry) {
      console.log(`[Supply Chain RF-B] Excluding home country ${homeCountry} (not in narrative)`);
      return false;
    }
    return true;
  });
  
  console.log(`[Supply Chain RF-B] Restricted set P: ${restrictedSet.join(', ')}`);
  console.log(`[Supply Chain RF-B] Set size: ${restrictedSet.length} countries`);
  
  if (restrictedSet.length === 0) {
    console.log(`[Supply Chain RF-B] ⚠️ Empty restricted set, falling back to sector template`);
    return calculateSupplyChainExposureLegacy(signals.explicitCountries, signals.regions, ticker, sector);
  }
  
  // Calculate supply industry demand for each country in P
  const weights: Record<string, number> = {};
  let totalWeight = 0;
  
  for (const country of restrictedSet) {
    const weight = calculateSupplyIndustryDemand(country, sector);
    weights[country] = weight;
    totalWeight += weight;
    console.log(`[Supply Chain RF-B]   ${country}: raw weight = ${weight.toFixed(4)}`);
  }
  
  // Normalize to 100%
  const result: Record<string, number> = {};
  if (totalWeight > 0) {
    for (const [country, weight] of Object.entries(weights)) {
      result[country] = weight / totalWeight;
      console.log(`[Supply Chain RF-B]   ${country}: ${(result[country] * 100).toFixed(2)}%`);
    }
  }
  
  // Validation
  const sum = Object.values(result).reduce((acc, val) => acc + val, 0);
  console.log(`[Supply Chain RF-B] Total allocation: ${(sum * 100).toFixed(2)}%`);
  console.log(`[Supply Chain RF-B] Countries allocated: ${Object.keys(result).length}`);
  
  // Verify home country exclusion if applicable
  if (signals.excludesHomeCountry && homeCountry in result) {
    console.warn(`[Supply Chain RF-B] ⚠️ WARNING: Home country ${homeCountry} in result despite exclusion flag`);
  } else if (signals.excludesHomeCountry) {
    console.log(`[Supply Chain RF-B] ✅ Home country ${homeCountry} correctly excluded`);
  }
  
  console.log(`[Supply Chain RF-B] ========================================\n`);
  
  return result;
}

// ============================================================================
// LEGACY SEGMENT-SPECIFIC SUPPLY FALLBACK
// ============================================================================

/**
 * Calculate supply chain exposure using segment-specific fallback (legacy method)
 * 
 * Process:
 * 1. Identify explicit countries from narrative/supplier lists
 * 2. Identify regions mentioned in narrative
 * 3. For explicit countries: use direct evidence
 * 4. For regions: apply IndustrySupplyProxy within that region
 * 5. NEVER use global fallback
 * 
 * @param explicitCountries - Countries explicitly named in evidence
 * @param regions - Regions mentioned in narrative
 * @param ticker - Company ticker
 * @param sector - Company sector
 * @returns Record of country weights for supply chain exposure
 */
export function calculateSupplyChainExposureLegacy(
  explicitCountries: string[],
  regions: string[],
  ticker: string,
  sector: string
): Record<string, number> {
  
  console.log(`\n[Supply Chain Fallback] ========================================`);
  console.log(`[Supply Chain Fallback] Calculating for ${ticker}`);
  console.log(`[Supply Chain Fallback] Explicit countries: ${explicitCountries.join(', ')}`);
  console.log(`[Supply Chain Fallback] Regions: ${regions.join(', ')}`);
  console.log(`[Supply Chain Fallback] ========================================`);
  
  const result: Record<string, number> = {};
  
  // Get appropriate template
  let template: Record<string, number>;
  
  if (ticker.toUpperCase() === 'AAPL') {
    template = APPLE_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using Apple-specific supply template`);
  } else if (sector === 'Technology') {
    template = TECH_ELECTRONICS_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using tech electronics template`);
  } else if (sector === 'Manufacturing') {
    template = MANUFACTURING_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using manufacturing template`);
  } else if (sector === 'Automotive') {
    template = AUTOMOTIVE_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using automotive template`);
  } else if (sector === 'Healthcare' || sector === 'Pharmaceuticals') {
    template = PHARMA_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using pharma template`);
  } else {
    // Default to tech electronics
    template = TECH_ELECTRONICS_SUPPLY_TEMPLATE;
    console.log(`[Supply Chain Fallback] Using default tech electronics template`);
  }
  
  // Build country set from explicit countries + regions
  const countrySet = new Set<string>(explicitCountries);
  
  // Expand regions
  for (const region of regions) {
    let regionCountries: string[] = [];
    
    if (ticker.toUpperCase() === 'AAPL' && region in APPLE_SUPPLY_REGIONS) {
      regionCountries = APPLE_SUPPLY_REGIONS[region];
      console.log(`[Supply Chain Fallback] Expanding Apple region "${region}" to ${regionCountries.length} countries`);
    } else if (region in GENERIC_SUPPLY_REGIONS) {
      regionCountries = GENERIC_SUPPLY_REGIONS[region];
      console.log(`[Supply Chain Fallback] Expanding generic region "${region}" to ${regionCountries.length} countries`);
    }
    
    regionCountries.forEach(c => countrySet.add(c));
  }
  
  console.log(`[Supply Chain Fallback] Total country set: ${countrySet.size} countries`);
  
  // If no evidence at all, use full template
  if (countrySet.size === 0) {
    console.log(`[Supply Chain Fallback] No evidence found, using full sector template`);
    return template;
  }
  
  // Calculate weights using template within country set
  let templateSum = 0;
  
  for (const country of countrySet) {
    if (country in template) {
      templateSum += template[country];
    }
  }
  
  console.log(`[Supply Chain Fallback] Template sum within country set: ${templateSum.toFixed(4)}`);
  
  // Normalize weights
  if (templateSum > 0) {
    for (const country of countrySet) {
      if (country in template) {
        result[country] = template[country] / templateSum;
        
        if (result[country] > 0.01) {
          console.log(`[Supply Chain Fallback]   ${country}: ${(result[country] * 100).toFixed(2)}%`);
        }
      }
    }
  } else {
    // Equal distribution fallback (should rarely happen)
    console.log(`[Supply Chain Fallback] ⚠️ No template weights found, using equal distribution`);
    const equalWeight = 1.0 / countrySet.size;
    for (const country of countrySet) {
      result[country] = equalWeight;
    }
  }
  
  // Validation
  const totalWeight = Object.values(result).reduce((sum, w) => sum + w, 0);
  console.log(`[Supply Chain Fallback] Total weight: ${(totalWeight * 100).toFixed(2)}%`);
  console.log(`[Supply Chain Fallback] Countries in result: ${Object.keys(result).length}`);
  
  // Log top countries
  console.log(`[Supply Chain Fallback] Top 10 supply countries:`);
  const sortedCountries = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  for (const [country, weight] of sortedCountries) {
    console.log(`  ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  console.log(`[Supply Chain Fallback] ========================================\n`);
  
  return result;
}

/**
 * PHASE 1 FIX - Task 2: Main entry point for supply chain exposure calculation
 * 
 * Automatically detects membership signals and routes to appropriate method
 */
export function calculateSupplyChainExposure(
  explicitCountries: string[],
  regions: string[],
  ticker: string,
  sector: string,
  narrative?: string,
  homeCountry?: string
): Record<string, number> {
  
  // If narrative is provided, use RF-B detection
  if (narrative && narrative.trim().length > 0) {
    return calculateSupplyChainExposureWithRFB(
      narrative,
      ticker,
      sector,
      homeCountry || 'United States'
    );
  }
  
  // Otherwise, use legacy method
  return calculateSupplyChainExposureLegacy(
    explicitCountries,
    regions,
    ticker,
    sector
  );
}

/**
 * Get supply region definition
 */
export function getSupplyRegionDefinition(
  regionName: string,
  ticker: string
): string[] {
  if (ticker.toUpperCase() === 'AAPL' && regionName in APPLE_SUPPLY_REGIONS) {
    return APPLE_SUPPLY_REGIONS[regionName];
  }
  
  if (regionName in GENERIC_SUPPLY_REGIONS) {
    return GENERIC_SUPPLY_REGIONS[regionName];
  }
  
  return [regionName];
}

/**
 * Check if a name is a supply region
 */
export function isSupplyRegion(regionName: string, ticker: string): boolean {
  if (ticker.toUpperCase() === 'AAPL') {
    return regionName in APPLE_SUPPLY_REGIONS;
  }
  
  return regionName in GENERIC_SUPPLY_REGIONS;
}

/**
 * Validate supply chain exposure
 */
export function validateSupplyChainExposure(
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
    const chinaWeight = exposure['China'] || 0;
    const vietnamWeight = exposure['Vietnam'] || 0;
    const indiaWeight = exposure['India'] || 0;
    const usWeight = exposure['United States'] || 0;
    
    // China should be dominant
    if (chinaWeight < 0.35) {
      warnings.push(`China weight (${(chinaWeight * 100).toFixed(2)}%) is lower than expected (40-55%)`);
    }
    
    // US should not dominate supply chain (not mentioned in narrative)
    if (usWeight > chinaWeight) {
      errors.push(`US weight (${(usWeight * 100).toFixed(2)}%) exceeds China weight (${(chinaWeight * 100).toFixed(2)}%)`);
    }
    
    // PHASE 1 FIX - Task 2: US should be 0% for Apple supply chain
    if (usWeight > 0.01) {
      warnings.push(`US weight (${(usWeight * 100).toFixed(2)}%) should be near 0% (not mentioned in supply chain narrative)`);
    }
    
    // Asia concentration check
    const asiaCountries = ['China', 'Vietnam', 'India', 'Taiwan', 'South Korea', 'Japan', 'Thailand', 'Malaysia', 'Singapore'];
    const asiaTotal = asiaCountries.reduce((sum, c) => sum + (exposure[c] || 0), 0);
    
    if (asiaTotal < 0.70) {
      warnings.push(`Asia concentration (${(asiaTotal * 100).toFixed(2)}%) is lower than expected (70-80%)`);
    }
  }
  
  // Check for zero weights on countries with no evidence
  const unexpectedCountries = ['Russia', 'Saudi Arabia', 'Nigeria', 'Argentina'];
  for (const country of unexpectedCountries) {
    if (country in exposure && exposure[country] > 0.001) {
      warnings.push(`Unexpected country ${country} has weight ${(exposure[country] * 100).toFixed(2)}%`);
    }
  }
  
  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}