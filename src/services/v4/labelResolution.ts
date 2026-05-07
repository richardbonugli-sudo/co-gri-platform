/**
 * Label Resolution Service - V.4 Compliant (Phase 2 Enhanced)
 * 
 * Handles label detection, membership lookup, and canonical label mapping.
 * Implements V.4 invariant: Narrative affects MEMBERSHIP only.
 * 
 * PHASE 2 ENHANCEMENTS:
 * 1. Expanded country name dictionary with 50+ variants and aliases
 * 2. Case-insensitive matching
 * 3. Context-aware extraction support
 * 4. Currency-to-country mapping
 */

import { EntityKind, MembershipResolution, NarrativeDefinition } from '@/types/v4Types';

// Known geographic labels with their standard memberships
export const KNOWN_LABELS: Record<string, string[]> = {
  // Americas
  'Americas': ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela'],
  'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia'],
  
  // Europe
  'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Ireland'],
  'Western Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Austria'],
  'Northern Europe': ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland'],
  'Southern Europe': ['Italy', 'Spain', 'Portugal', 'Greece'],
  'Eastern Europe': ['Poland', 'Czech Republic', 'Hungary', 'Romania'],
  
  // Asia Pacific
  'Asia Pacific': ['China', 'Japan', 'South Korea', 'Australia', 'India', 'Singapore', 'Taiwan', 'Hong Kong', 'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam', 'New Zealand'],
  'Greater China': ['China', 'Hong Kong', 'Taiwan'],
  'Southeast Asia': ['Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam'],
  'East Asia': ['China', 'Japan', 'South Korea', 'Taiwan', 'Hong Kong'],
  'South Asia': ['India', 'Pakistan', 'Bangladesh'],
  'Rest of Asia Pacific': ['Australia', 'New Zealand', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia'],
  
  // EMEA
  'EMEA': ['United Kingdom', 'Germany', 'France', 'UAE', 'Saudi Arabia', 'South Africa', 'Israel', 'Turkey'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Israel', 'Turkey', 'Qatar', 'Kuwait'],
  'Africa': ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco'],
  
  // Other regions
  'Oceania': ['Australia', 'New Zealand'],
};

/**
 * PHASE 2: Expanded canonical label mappings with 50+ variants
 * Handles common abbreviations, alternative names, and spelling variations
 */
const LABEL_ALIASES: Record<string, string> = {
  // United States variants
  'U.S.': 'United States',
  'USA': 'United States',
  'US': 'United States',
  'United States of America': 'United States',
  'U.S.A.': 'United States',
  'America': 'United States',
  
  // United Kingdom variants
  'UK': 'United Kingdom',
  'U.K.': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'Britain': 'United Kingdom',
  'England': 'United Kingdom',
  
  // China variants
  'PRC': 'China',
  "People's Republic of China": 'China',
  'Peoples Republic of China': 'China',
  'China mainland': 'China',
  'Mainland China': 'China',
  'Chinese mainland': 'China',
  
  // Taiwan variants
  'ROC': 'Taiwan',
  'Republic of China': 'Taiwan',
  'Chinese Taipei': 'Taiwan',
  
  // Hong Kong variants
  'HK': 'Hong Kong',
  'Hong Kong SAR': 'Hong Kong',
  'HKSAR': 'Hong Kong',
  
  // South Korea variants
  'ROK': 'South Korea',
  'Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'S. Korea': 'South Korea',
  'South Korean': 'South Korea',
  
  // Japan variants
  'JP': 'Japan',
  'JPN': 'Japan',
  
  // Germany variants
  'DE': 'Germany',
  'DEU': 'Germany',
  'Federal Republic of Germany': 'Germany',
  
  // France variants
  'FR': 'France',
  'FRA': 'France',
  
  // India variants
  'IN': 'India',
  'IND': 'India',
  'Republic of India': 'India',
  
  // Canada variants
  'CA': 'Canada',
  'CAN': 'Canada',
  
  // Australia variants
  'AU': 'Australia',
  'AUS': 'Australia',
  'Commonwealth of Australia': 'Australia',
  
  // Mexico variants
  'MX': 'Mexico',
  'MEX': 'Mexico',
  'United Mexican States': 'Mexico',
  
  // Brazil variants
  'BR': 'Brazil',
  'BRA': 'Brazil',
  'Brasil': 'Brazil',
  
  // Singapore variants
  'SG': 'Singapore',
  'SGP': 'Singapore',
  
  // UAE variants
  'United Arab Emirates': 'UAE',
  'U.A.E.': 'UAE',
  'Emirates': 'UAE',
  
  // Netherlands variants
  'NL': 'Netherlands',
  'NLD': 'Netherlands',
  'Holland': 'Netherlands',
  'The Netherlands': 'Netherlands',
  
  // Switzerland variants
  'CH': 'Switzerland',
  'CHE': 'Switzerland',
  
  // Spain variants
  'ES': 'Spain',
  'ESP': 'Spain',
  
  // Italy variants
  'IT': 'Italy',
  'ITA': 'Italy',
  
  // Russia variants
  'RU': 'Russia',
  'RUS': 'Russia',
  'Russian Federation': 'Russia',
  
  // Saudi Arabia variants
  'SA': 'Saudi Arabia',
  'SAU': 'Saudi Arabia',
  'KSA': 'Saudi Arabia',
  'Kingdom of Saudi Arabia': 'Saudi Arabia',
  
  // South Africa variants
  'ZA': 'South Africa',
  'ZAF': 'South Africa',
  'RSA': 'South Africa',
  
  // Vietnam variants
  'VN': 'Vietnam',
  'VNM': 'Vietnam',
  'Viet Nam': 'Vietnam',
  
  // Thailand variants
  'TH': 'Thailand',
  'THA': 'Thailand',
  
  // Malaysia variants
  'MY': 'Malaysia',
  'MYS': 'Malaysia',
  
  // Indonesia variants
  'ID': 'Indonesia',
  'IDN': 'Indonesia',
  
  // Philippines variants
  'PH': 'Philippines',
  'PHL': 'Philippines',
  'Philippine': 'Philippines',
  
  // New Zealand variants
  'NZ': 'New Zealand',
  'NZL': 'New Zealand',
};

/**
 * PHASE 2: Currency-to-country mapping for Financial channel
 * Maps currency codes and symbols to their primary countries
 */
export const CURRENCY_TO_COUNTRY: Record<string, string[]> = {
  // Major currencies
  'USD': ['United States'],
  'US$': ['United States'],
  '$': ['United States'], // Default $ to USD
  
  'EUR': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Ireland', 'Portugal', 'Greece'],
  '€': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands'],
  
  'GBP': ['United Kingdom'],
  '£': ['United Kingdom'],
  
  'JPY': ['Japan'],
  '¥': ['Japan'], // Can also be CNY, context-dependent
  
  'CNY': ['China'],
  'RMB': ['China'],
  '元': ['China'],
  
  'CHF': ['Switzerland'],
  
  'CAD': ['Canada'],
  'C$': ['Canada'],
  
  'AUD': ['Australia'],
  'A$': ['Australia'],
  
  'HKD': ['Hong Kong'],
  'HK$': ['Hong Kong'],
  
  'SGD': ['Singapore'],
  'S$': ['Singapore'],
  
  'KRW': ['South Korea'],
  '₩': ['South Korea'],
  
  'INR': ['India'],
  '₹': ['India'],
  
  'MXN': ['Mexico'],
  
  'BRL': ['Brazil'],
  'R$': ['Brazil'],
  
  'ZAR': ['South Africa'],
  
  'AED': ['UAE'],
  
  'SAR': ['Saudi Arabia'],
  
  'TWD': ['Taiwan'],
  'NT$': ['Taiwan'],
  
  'THB': ['Thailand'],
  '฿': ['Thailand'],
  
  'MYR': ['Malaysia'],
  
  'IDR': ['Indonesia'],
  
  'PHP': ['Philippines'],
  '₱': ['Philippines'],
  
  'VND': ['Vietnam'],
  '₫': ['Vietnam'],
  
  'NZD': ['New Zealand'],
  'NZ$': ['New Zealand'],
  
  'SEK': ['Sweden'],
  
  'NOK': ['Norway'],
  
  'DKK': ['Denmark'],
  
  'PLN': ['Poland'],
  
  'TRY': ['Turkey'],
  '₺': ['Turkey'],
  
  'RUB': ['Russia'],
  '₽': ['Russia'],
};

// Global country list (simplified - should be comprehensive in production)
export const GLOBAL_COUNTRIES = [
  'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France', 'India', 'Italy', 'Brazil', 'Canada',
  'South Korea', 'Spain', 'Australia', 'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia', 'Turkey', 'Switzerland',
  'Poland', 'Belgium', 'Sweden', 'Argentina', 'Austria', 'Norway', 'UAE', 'Israel', 'Hong Kong', 'Singapore',
  'Denmark', 'Malaysia', 'Philippines', 'Ireland', 'South Africa', 'Thailand', 'Chile', 'Finland', 'Colombia',
  'Pakistan', 'Bangladesh', 'Vietnam', 'Czech Republic', 'Romania', 'New Zealand', 'Peru', 'Greece', 'Portugal',
  'Qatar', 'Hungary', 'Kuwait', 'Morocco', 'Ecuador', 'Kenya', 'Taiwan'
];

/**
 * PHASE 2: Enhanced canonicalize function with case-insensitive matching
 * Handles variations and aliases with improved matching
 */
export function canonicalizeLabel(rawLabel: string): string {
  const trimmed = rawLabel.trim();
  
  // Check exact match first (case-sensitive for performance)
  if (LABEL_ALIASES[trimmed]) {
    return LABEL_ALIASES[trimmed];
  }
  
  // Check case-insensitive match
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [alias, canonical] of Object.entries(LABEL_ALIASES)) {
    if (lowerTrimmed === alias.toLowerCase()) {
      return canonical;
    }
  }
  
  // Check if it matches a country name directly (case-insensitive)
  for (const country of GLOBAL_COUNTRIES) {
    if (lowerTrimmed === country.toLowerCase()) {
      return country;
    }
  }
  
  return trimmed;
}

/**
 * PHASE 2: Extract country from currency code or symbol
 * Returns the primary country associated with a currency
 */
export function getCurrencyCountries(currency: string): string[] {
  const normalized = currency.trim().toUpperCase();
  
  // Check currency codes
  if (CURRENCY_TO_COUNTRY[normalized]) {
    return CURRENCY_TO_COUNTRY[normalized];
  }
  
  // Check currency symbols
  if (CURRENCY_TO_COUNTRY[currency.trim()]) {
    return CURRENCY_TO_COUNTRY[currency.trim()];
  }
  
  return [];
}

/**
 * Classify entity kind (V.4 compliant)
 */
export function classifyEntityKind(canonicalLabel: string, channel: string): EntityKind {
  // Check if it's a country
  if (isCountry(canonicalLabel)) {
    return EntityKind.COUNTRY;
  }
  
  // Check if it's a known geographic label
  if (isLabel(canonicalLabel)) {
    return EntityKind.GEO_LABEL;
  }
  
  // Check for nonstandard labels
  const nonstandardPatterns = [
    /^other/i,
    /^rest of/i,
    /^international/i,
    /^overseas/i,
    /^foreign/i,
    /^domestic/i,
    /^various/i
  ];
  
  for (const pattern of nonstandardPatterns) {
    if (pattern.test(canonicalLabel)) {
      return EntityKind.NONSTANDARD_LABEL;
    }
  }
  
  // Check for currency labels (financial channel)
  if (channel === 'FINANCIAL') {
    const currencyPatterns = [/USD/i, /EUR/i, /GBP/i, /JPY/i, /CNY/i];
    for (const pattern of currencyPatterns) {
      if (pattern.test(canonicalLabel)) {
        return EntityKind.CURRENCY_LABEL;
      }
    }
  }
  
  return EntityKind.UNKNOWN;
}

/**
 * Check if a label is a known geographic label
 */
export function isLabel(name: string): boolean {
  return name in KNOWN_LABELS;
}

/**
 * Check if a name is a country
 */
export function isCountry(name: string): boolean {
  return GLOBAL_COUNTRIES.includes(name);
}

/**
 * Check if a label is a standard bounded geographic label
 */
export function isStandardBoundedGeoLabel(label: string): boolean {
  return isLabel(label);
}

/**
 * Lookup membership for a label
 */
export function lookupMembership(label: string): string[] | null {
  return KNOWN_LABELS[label] || null;
}

/**
 * Expand UN M49 bounded label (simplified - uses KNOWN_LABELS)
 */
export function expandUN_M49(label: string): string[] {
  return KNOWN_LABELS[label] || [];
}

/**
 * Resolve membership for a label (V.4 priority: narrative definition first, then bounded map)
 */
export function resolveMembershipForLabel(
  label: string,
  narrativeDefinitions: Map<string, NarrativeDefinition>
): MembershipResolution {
  
  // 1) Primary narrative definition (mandatory first)
  if (narrativeDefinitions.has(label)) {
    const defn = narrativeDefinitions.get(label)!;
    
    // If ambiguous (low confidence), NOT resolvable
    if (defn.confidence < 0.75) {
      return {
        resolvable: false,
        members: new Set(),
        reason: 'primary narrative definition is open-ended/ambiguous'
      };
    }
    
    // Expand includes
    let members = new Set<string>(defn.includes);
    
    // Apply excludes
    for (const excluded of defn.excludes) {
      members.delete(excluded);
    }
    
    // Apply residual logic if present
    if (defn.residualOf) {
      // Simplified: just use includes for now
      // In production, would subtract other segments
    }
    
    if (members.size > 0) {
      return {
        resolvable: true,
        members,
        reason: 'primary narrative definition'
      };
    }
  }
  
  // 2) Standard bounded mapping (secondary)
  if (isStandardBoundedGeoLabel(label)) {
    const members = new Set(expandUN_M49(label));
    if (members.size > 0) {
      return {
        resolvable: true,
        members,
        reason: 'UN M49 bounded expansion'
      };
    }
  }
  
  // 3) Otherwise not resolvable
  return {
    resolvable: false,
    members: new Set(),
    reason: 'label not bounded and no usable primary definition'
  };
}

/**
 * Infer restricted set from narrative (for RF allocations)
 */
export function inferRestrictedSet(narrative: string): string[] {
  const countries: string[] = [];
  
  // Simple pattern matching for country mentions
  for (const country of GLOBAL_COUNTRIES) {
    if (narrative.toLowerCase().includes(country.toLowerCase())) {
      countries.push(country);
    }
  }
  
  return countries;
}

/**
 * Check if label is actually a country (misclassified)
 */
export function labelIsCountry(label: string): boolean {
  return isCountry(label);
}