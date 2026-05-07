/**
 * CO-GRI EXPOSURE FALLBACK LOGIC v3.3
 *
 * Based on: Appendix v3.3 — CO-GRI EXPOSURE FALLBACK LOGIC
 *
 * THREE-TIER FALLBACK SYSTEM:
 * 1. Segment-Specific Fallback (SSF) - Region membership fully known
 * 2. Restricted Fallback (RF) - Geography partially known but ambiguous
 * 3. Global Fallback (GF) - Region membership completely unknown
 *
 * EVIDENCE HIERARCHY:
 * 1. Structured Evidence (highest priority) - Tables with explicit country/region data
 * 2. Narrative Evidence - Text mentions of countries/regions (adds to universe, not weights)
 * 3. Segment-Specific Fallback (SSF) - When region membership is fully known
 * 4. Restricted Fallback (RF) - When geography is partially known
 * 5. Global Fallback (GF) - When region membership is unknown
 * 6. True Zero - Explicit exclusion or commercial impossibility
 *
 * DECISION TREE:
 * Step 1: Do we know the region membership?
 *   - YES → SSF
 *   - NO → Go to Step 2
 * Step 2: Is there partial evidence (non-standard regions, partial lists)?
 *   - YES → RF
 *   - NO → Go to Step 3
 * Step 3: Is exposure plausible globally?
 *   - YES → GF
 *   - NO → True Zero
 */

import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import {
  isNonStandardRegion,
  constructRestrictedSet,
  applyRestrictedFallback,
  validateRestrictedFallback,
  generateRFSummary
} from './restrictedFallback';
import {
  getIndustryDemandProxy,
  generateChannelFallbackExplanation
} from './channelSpecificFallback';
import {
  allocateWithPrior,
  buildGlobalFallbackV5,
  type ChannelType,
} from './v5/channelPriors';

// UN M49 Standard Region Definitions
// Source: https://unstats.un.org/unsd/methodology/m49/
export const UN_M49_REGIONS: Record<string, string[]> = {
  // Geographic Regions - Level 1
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
    'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Democratic Republic of the Congo',
    'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
    'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar',
    'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
    'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],

  'Americas': [
    'Antigua and Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belize', 'Bolivia', 'Brazil', 'Canada',
    'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic', 'Ecuador', 'El Salvador',
    'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama',
    'Paraguay', 'Peru', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Suriname', 'Trinidad and Tobago', 'United States', 'Uruguay', 'Venezuela'
  ],

  'Asia': [
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
    'China', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal',
    'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore',
    'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey',
    'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'
  ],

  'Europe': [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia',
    'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
    'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
    'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal',
    'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
    'Ukraine', 'United Kingdom', 'Vatican City'
  ],

  'Oceania': [
    'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 'Palau',
    'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'
  ],

  // Sub-regions - Level 2
  'Northern Africa': ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia'],
  'Sub-Saharan Africa': [
    'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
    'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Democratic Republic of the Congo',
    'Djibouti', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
    'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Madagascar',
    'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
    'Somalia', 'South Africa', 'South Sudan', 'Tanzania', 'Togo', 'Uganda', 'Zambia', 'Zimbabwe'
  ],

  'Northern America': ['Canada', 'United States'],
  'Latin America and the Caribbean': [
    'Antigua and Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belize', 'Bolivia', 'Brazil',
    'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic', 'Ecuador',
    'El Salvador', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Mexico',
    'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Suriname', 'Trinidad and Tobago', 'Uruguay', 'Venezuela'
  ],

  'Central Asia': ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
  'Eastern Asia': ['China', 'Hong Kong', 'Japan', 'Macau', 'Mongolia', 'North Korea', 'South Korea', 'Taiwan'],
  'South-Eastern Asia': ['Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Timor-Leste', 'Vietnam'],
  'Southern Asia': ['Afghanistan', 'Bangladesh', 'Bhutan', 'India', 'Iran', 'Maldives', 'Nepal', 'Pakistan', 'Sri Lanka'],
  'Western Asia': ['Armenia', 'Azerbaijan', 'Bahrain', 'Cyprus', 'Georgia', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'],

  'Eastern Europe': ['Belarus', 'Bulgaria', 'Czech Republic', 'Hungary', 'Moldova', 'Poland', 'Romania', 'Russia', 'Slovakia', 'Ukraine'],
  'Northern Europe': ['Denmark', 'Estonia', 'Finland', 'Iceland', 'Ireland', 'Latvia', 'Lithuania', 'Norway', 'Sweden', 'United Kingdom'],
  'Southern Europe': ['Albania', 'Andorra', 'Bosnia and Herzegovina', 'Croatia', 'Cyprus', 'Greece', 'Italy', 'Kosovo', 'Malta', 'Montenegro', 'North Macedonia', 'Portugal', 'San Marino', 'Serbia', 'Slovenia', 'Spain', 'Vatican City'],
  'Western Europe': ['Austria', 'Belgium', 'France', 'Germany', 'Liechtenstein', 'Luxembourg', 'Monaco', 'Netherlands', 'Switzerland'],

  'Australia and New Zealand': ['Australia', 'New Zealand'],
  'Melanesia': ['Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu'],
  'Micronesia': ['Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'Palau'],
  'Polynesia': ['Samoa', 'Tonga', 'Tuvalu']
};

// Composite regions commonly used in corporate reporting
export const COMPOSITE_REGIONS: Record<string, string[]> = {
  'Greater China': ['China', 'Hong Kong', 'Taiwan', 'Macau'],
  'Rest of Asia Pacific': ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Singapore', 'Taiwan', 'Hong Kong', 'New Zealand', 'Pakistan'],
  'Asia Pacific': ['China', 'Japan', 'South Korea', 'India', 'Australia', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Taiwan', 'Hong Kong', 'New Zealand'],
  'EMEA': [...UN_M49_REGIONS['Europe'], ...UN_M49_REGIONS['Africa'], ...UN_M49_REGIONS['Western Asia']],
  'Latin America': ['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Guatemala', 'Costa Rica'],
  'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Turkey', 'Iran', 'Iraq', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay'],
  'Central America': ['Mexico', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Belize'],
  'Caribbean': ['Cuba', 'Haiti', 'Dominican Republic', 'Jamaica', 'Trinidad and Tobago', 'Bahamas', 'Barbados'],
  'Eurozone': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Ireland', 'Portugal', 'Greece', 'Finland'],
  'Nordic Countries': ['Denmark', 'Finland', 'Iceland', 'Norway', 'Sweden'],
  'BRICS': ['Brazil', 'Russia', 'India', 'China', 'South Africa'],
  'G7': ['United States', 'Japan', 'Germany', 'United Kingdom', 'France', 'Italy', 'Canada'],
  'ASEAN': ['Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Singapore', 'Malaysia', 'Myanmar', 'Cambodia', 'Laos', 'Brunei']
};

// Keywords that trigger GLOBAL fallback (region membership unknown)
export const GLOBAL_FALLBACK_KEYWORDS = [
  'international',
  'rest of world',
  'other',
  'foreign',
  'non-us',
  'global markets',
  'worldwide',
  'other countries',
  'other regions',
  'rest of the world',
  'international markets',
  'overseas',
  'abroad',
  'external markets'
];

// GDP data for global fallback (2023 nominal GDP in trillions USD)
// Source: IMF World Economic Outlook Database
export const COUNTRY_GDP_2023: Record<string, number> = {
  'United States': 27.36, 'China': 17.96, 'Japan': 4.41, 'Germany': 4.31, 'India': 3.73,
  'United Kingdom': 3.34, 'France': 3.05, 'Italy': 2.19, 'Brazil': 2.13, 'Canada': 2.12,
  'Russia': 2.06, 'South Korea': 1.71, 'Spain': 1.58, 'Australia': 1.55, 'Mexico': 1.46,
  'Indonesia': 1.39, 'Netherlands': 1.09, 'Saudi Arabia': 1.06, 'Turkey': 1.03, 'Switzerland': 0.91,
  'Poland': 0.84, 'Belgium': 0.63, 'Sweden': 0.59, 'Ireland': 0.55, 'Israel': 0.52,
  'United Arab Emirates': 0.50, 'Norway': 0.49, 'Austria': 0.48, 'Singapore': 0.47, 'Vietnam': 0.43,
  'Bangladesh': 0.42, 'Malaysia': 0.41, 'South Africa': 0.38, 'Philippines': 0.44, 'Thailand': 0.51,
  'Egypt': 0.39, 'Denmark': 0.40, 'Hong Kong': 0.38, 'Colombia': 0.36, 'Pakistan': 0.34,
  'Chile': 0.34, 'Finland': 0.30, 'Romania': 0.35, 'Czech Republic': 0.33, 'New Zealand': 0.25,
  'Portugal': 0.29, 'Peru': 0.27, 'Greece': 0.24, 'Qatar': 0.24, 'Kazakhstan': 0.26,
  'Algeria': 0.24, 'Hungary': 0.21, 'Kuwait': 0.18, 'Morocco': 0.14, 'Ecuador': 0.12,
  'Ethiopia': 0.13, 'Kenya': 0.13, 'Angola': 0.12, 'Ghana': 0.08, 'Tanzania': 0.08,
  'Oman': 0.11, 'Bahrain': 0.04, 'Taiwan': 0.79, 'Nigeria': 0.48, 'Argentina': 0.64,
  'Ukraine': 0.18, 'Venezuela': 0.09, 'Iraq': 0.25, 'Iran': 0.39
};

// Sector priors for global fallback
export const SECTOR_PRIORS: Record<string, Record<string, number>> = {
  'Technology': {
    'United States': 1.5, 'China': 1.3, 'Japan': 1.1, 'South Korea': 1.2, 'Taiwan': 1.4,
    'Germany': 1.0, 'United Kingdom': 1.0, 'India': 1.1, 'Singapore': 1.2, 'Israel': 1.3
  },
  'Financial Services': {
    'United States': 1.6, 'United Kingdom': 1.5, 'Switzerland': 1.4, 'Singapore': 1.3, 'Hong Kong': 1.3,
    'Germany': 1.1, 'France': 1.1, 'Japan': 1.0, 'Luxembourg': 1.4, 'Ireland': 1.2
  },
  'Energy': {
    'Saudi Arabia': 2.0, 'Russia': 1.8, 'United States': 1.5, 'United Arab Emirates': 1.7, 'Norway': 1.6,
    'Canada': 1.4, 'Brazil': 1.3, 'Qatar': 1.9, 'Kuwait': 1.8, 'Iraq': 1.7
  },
  'Healthcare': {
    'United States': 1.6, 'Switzerland': 1.4, 'Germany': 1.3, 'United Kingdom': 1.2, 'France': 1.2,
    'Japan': 1.1, 'Belgium': 1.2, 'Ireland': 1.3, 'Singapore': 1.2, 'Netherlands': 1.1
  },
  'Manufacturing': {
    'China': 1.5, 'Germany': 1.4, 'Japan': 1.3, 'United States': 1.2, 'South Korea': 1.3,
    'Italy': 1.2, 'Mexico': 1.2, 'India': 1.1, 'Vietnam': 1.2, 'Thailand': 1.1
  },
  'Consumer Goods': {
    'United States': 1.3, 'China': 1.4, 'Japan': 1.1, 'Germany': 1.1, 'United Kingdom': 1.1,
    'France': 1.1, 'Italy': 1.0, 'Brazil': 1.1, 'India': 1.2, 'Mexico': 1.1
  },
  'Telecommunications': {
    'United States': 1.3, 'China': 1.4, 'Japan': 1.2, 'South Korea': 1.3, 'United Kingdom': 1.1,
    'Germany': 1.1, 'India': 1.2, 'Brazil': 1.1, 'France': 1.0, 'Spain': 1.0
  },
  'Retail': {
    'United States': 1.4, 'China': 1.3, 'United Kingdom': 1.2, 'Germany': 1.1, 'Japan': 1.1,
    'France': 1.1, 'Brazil': 1.1, 'India': 1.2, 'Canada': 1.1, 'Australia': 1.1
  }
};

/**
 * Check if a segment name triggers GLOBAL fallback
 */
export function isGlobalFallbackSegment(segmentName: string): boolean {
  const normalized = segmentName.toLowerCase().trim();
  return GLOBAL_FALLBACK_KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Check if a segment name is a known region (triggers SEGMENT-SPECIFIC fallback)
 */
export function isKnownRegion(segmentName: string): boolean {
  const normalized = segmentName.trim();
  return normalized in UN_M49_REGIONS || normalized in COMPOSITE_REGIONS;
}

/**
 * Get countries in a region (from UN M49 or composite definitions)
 */
export function getRegionCountries(regionName: string): string[] | null {
  const normalized = regionName.trim();
  if (normalized in UN_M49_REGIONS) return UN_M49_REGIONS[normalized];
  if (normalized in COMPOSITE_REGIONS) return COMPOSITE_REGIONS[normalized];
  return null;
}

/**
 * FIX 2: Build a plausible-country set for Global Fallback.
 *
 * Plausibility is determined by structural criteria (not GDP magnitude).
 * A country is excluded if it:
 *   - Already has direct evidence (evidenceCountries)
 *   - Has confirmed zero exposure (knownZeroCountries)
 *   - Is a microstate with negligible commercial activity
 *   - Is a sanctioned country (for US-home companies)
 *
 * This is STEP 1 of the two-step V5 process (plausibility gate).
 */
export function buildPlausibleSet(
  evidenceCountries: Set<string>,
  knownZeroCountries: Set<string>,
  homeCountry?: string
): string[] {
  const microstates = new Set([
    'Vatican City', 'Monaco', 'San Marino', 'Liechtenstein', 'Andorra',
    'Nauru', 'Tuvalu', 'Palau', 'Marshall Islands', 'Micronesia',
  ]);
  const sanctioned = new Set(['North Korea', 'Syria', 'Cuba']);
  const conditionalSanctioned = new Set(['Iran', 'Venezuela']);

  const allCountries = Object.keys(COUNTRY_GDP_2023);
  return allCountries.filter(c => {
    if (evidenceCountries.has(c)) return false;
    if (knownZeroCountries.has(c)) return false;
    if (microstates.has(c)) return false;
    if (sanctioned.has(c)) return false;
    if (homeCountry === 'United States' && conditionalSanctioned.has(c)) return false;
    return true;
  });
}

/**
 * FIX 2 + FIX 3 + FIX 5: Apply GLOBAL fallback using V5 GF formula.
 *
 * Replaces the legacy GDP × SectorPrior formula with:
 *   p_c = λ·HomeBias(c) + (1-λ)·GlobalPrior_channel_sector(c)
 * where λ = HOME_BIAS_LAMBDA[channel] (channel-specific, NOT a fixed 85/15 split).
 *
 * Two-step V5 process:
 *   Step 1 (plausibility): buildPlausibleSet() → string[]
 *   Step 2 (magnitude):    buildGlobalFallbackV5() → Record<country, weight>
 *
 * @param sector            - Company sector
 * @param unknownPortion    - Total weight to allocate (0–1)
 * @param evidenceCountries - Countries that already have direct evidence
 * @param knownZeroCountries - Countries with confirmed zero exposure
 * @param channel           - Channel type (drives λ and prior formula)
 * @param homeCountry       - Company home country (for home-bias term)
 *
 * @deprecated Use `buildGlobalFallbackV5(homeCountry, channel, sector)` from
 *   `src/services/v5/channelPriors.ts` directly for new call sites.
 *   This wrapper is retained for backward compatibility and emergency rollback only.
 *   It already delegates to `buildGlobalFallbackV5()` internally (FIX 5).
 */
export function applyGlobalFallback(
  sector: string,
  unknownPortion: number,
  evidenceCountries: Set<string>,
  knownZeroCountries: Set<string>,
  channel: ChannelType = 'revenue',
  homeCountry: string = 'United States'
): Record<string, number> {
  console.log(
    `[Global Fallback V5 (GF)] channel=${channel} sector=${sector} ` +
    `unknownPortion=${(unknownPortion * 100).toFixed(2)}%`
  );

  // STEP 1 — Plausibility gate (structural, not magnitude-based)
  const plausibleSet = buildPlausibleSet(evidenceCountries, knownZeroCountries, homeCountry);
  console.log(`[Global Fallback V5 (GF)] Plausible set: ${plausibleSet.length} countries`);

  if (plausibleSet.length === 0) {
    console.log(`[Global Fallback V5 (GF)] No plausible countries — returning empty`);
    return {};
  }

  // STEP 2 — Magnitude assignment via V5 GF formula (channel-specific λ + prior)
  const gfDistribution = buildGlobalFallbackV5(homeCountry, channel, sector, plausibleSet);

  // Scale to unknownPortion and apply micro-exposure filter (0.01% = 1 basis point)
  const result: Record<string, number> = {};
  for (const [country, share] of Object.entries(gfDistribution)) {
    const w = share * unknownPortion;
    if (w >= 0.0001) {
      result[country] = w;
    }
  }

  console.log(`[Global Fallback V5 (GF)] Allocated to ${Object.keys(result).length} countries`);
  return result;
}

/**
 * FIX 2 + FIX 3: Apply SEGMENT-SPECIFIC fallback (SSF) using V5 channel-specific priors.
 *
 * Replaces the legacy IndustryDemandProxy formula with allocateWithPrior().
 *
 * Two-step V5 process:
 *   Step 1 (plausibility): Filter regionCountries to eligible set (not evidence, not zero).
 *                          Plausibility is determined by region membership — NOT by magnitude.
 *   Step 2 (magnitude):    allocateWithPrior() assigns weights using channel-specific prior.
 *
 * @deprecated Use `allocateWithPrior(admissibleSet, channel, sector, unknownPortion)` from
 *   `src/services/v5/channelPriors.ts` directly for new call sites.
 *   This wrapper is retained for backward compatibility and emergency rollback only.
 *   It already delegates to `allocateWithPrior()` internally (FIX 3).
 */
export function applySegmentFallback(
  regionName: string,
  regionCountries: string[],
  sector: string,
  unknownPortion: number,
  evidenceCountries: Set<string>,
  knownZeroCountries: Set<string>,
  channel: ChannelType
): Record<string, number> {
  console.log(
    `[Segment-Specific Fallback V5 (SSF)] region="${regionName}" ` +
    `channel=${channel} unknownPortion=${(unknownPortion * 100).toFixed(2)}%`
  );

  // STEP 1 — Plausibility gate: region membership defines the admissible set.
  // Countries are excluded only if they have direct evidence or are known zeros.
  const admissibleSet = regionCountries.filter(
    c => !evidenceCountries.has(c) && !knownZeroCountries.has(c)
  );

  console.log(`[Segment-Specific Fallback V5 (SSF)] Admissible set: ${admissibleSet.length} countries`);

  if (admissibleSet.length === 0) {
    console.log(`[Segment-Specific Fallback V5 (SSF)] No admissible countries — returning empty`);
    return {};
  }

  // STEP 2 — Magnitude assignment via V5 channel-specific prior
  const allocated = allocateWithPrior(admissibleSet, channel, sector, unknownPortion);

  // Apply micro-exposure filter (0.01% = 1 basis point) — display filter only, not plausibility gate
  const result: Record<string, number> = {};
  for (const [country, w] of Object.entries(allocated)) {
    if (w >= 0.0001) {
      result[country] = w;
      console.log(`  ${country}: ${(w * 100).toFixed(4)}%`);
    }
  }

  console.log(`[Segment-Specific Fallback V5 (SSF)] Allocated to ${Object.keys(result).length} countries within region`);
  return result;
}

/**
 * Determine if a country should be a TRUE ZERO.
 * True zero when BOTH conditions met:
 * 1. Outside all structured/narrative segments
 * 2. No plausible commercial exposure
 */
export function isTrueZero(
  country: string,
  allSegmentCountries: Set<string>,
  sector: string,
  homeCountry: string
): boolean {
  if (allSegmentCountries.has(country)) return false;

  const microstates = [
    'Vatican City', 'Monaco', 'San Marino', 'Liechtenstein', 'Andorra',
    'Nauru', 'Tuvalu', 'Palau', 'Marshall Islands', 'Micronesia'
  ];
  if (microstates.includes(country)) return true;

  const sanctionedCountries = ['North Korea', 'Syria', 'Iran', 'Venezuela', 'Cuba'];
  if (sanctionedCountries.includes(country) && homeCountry === 'United States') return true;

  if (!(country in COUNTRY_GDP_2023)) return true;

  return false;
}

/**
 * FIX 1: Main fallback decision function - THREE-TIER SYSTEM (V5 compliant)
 *
 * V5 changes vs legacy:
 *   - applyGlobalFallback now uses V5 GF formula (channel-specific λ + prior)
 *   - applySegmentFallback now uses allocateWithPrior (channel-specific prior)
 *   - channel and homeCountry are forwarded to GF so home-bias term is applied
 *   - Coverage ≥ 95% suppression: unknownPortion < 0.05 returns no-fallback
 *
 * Returns: SSF, RF, or GF with weights assigned by channel-specific priors.
 * Fallback NEVER overwrites structured evidence (enforced by evidenceCountries set).
 */
export interface FallbackDecision {
  type: 'segment-specific' | 'restricted' | 'global' | 'true-zero' | 'no-fallback';
  countries: Record<string, number>;
  reasoning: string;
  restrictedSet?: string[];
}

export function decideFallback(
  segmentName: string,
  segmentCountries: string[] | null,
  narrativeCountries: string[] | null,
  explicitCountries: string[],
  sector: string,
  homeCountry: string,
  channel: ChannelType,
  unknownPortion: number,
  evidenceCountries: Set<string>,
  knownZeroCountries: Set<string>,
  allSegmentCountries: Set<string>,
  isForeignBucket: boolean = false
): FallbackDecision {
  console.log(`\n[Fallback Decision V5] Segment: "${segmentName}", Channel: ${channel}`);
  console.log(`[Fallback Decision V5] Unknown portion: ${(unknownPortion * 100).toFixed(2)}%`);
  console.log(`[Fallback Decision V5] Foreign bucket: ${isForeignBucket}`);

  // FIX 1: V5 coverage gate — if evidence covers ≥ 95%, suppress fallback entirely.
  if (unknownPortion < 0.05) {
    return {
      type: 'no-fallback',
      countries: {},
      reasoning: `Evidence covers ${((1 - unknownPortion) * 100).toFixed(1)}% (≥ 95%), fallback suppressed`
    };
  }

  // STEP 1: Do we know the region membership? (SSF)
  if (narrativeCountries && narrativeCountries.length > 0) {
    console.log(`[Fallback Decision V5] ✅ SSF: Narrative provides ${narrativeCountries.length} countries for segment`);
    return {
      type: 'segment-specific',
      countries: applySegmentFallback(segmentName, narrativeCountries, sector, unknownPortion, evidenceCountries, knownZeroCountries, channel),
      reasoning: `SSF: Narrative defines ${narrativeCountries.length} countries in "${segmentName}"`
    };
  }

  if (segmentCountries && segmentCountries.length > 0 && isKnownRegion(segmentName)) {
    console.log(`[Fallback Decision V5] ✅ SSF: Segment "${segmentName}" is a known region with ${segmentCountries.length} countries`);
    return {
      type: 'segment-specific',
      countries: applySegmentFallback(segmentName, segmentCountries, sector, unknownPortion, evidenceCountries, knownZeroCountries, channel),
      reasoning: `SSF: "${segmentName}" is a defined region with ${segmentCountries.length} countries`
    };
  }

  // STEP 2: Is there partial evidence? (RF)

  // Case A: Non-standard region naming (EMEA, International, etc.)
  if (isNonStandardRegion(segmentName)) {
    console.log(`[Fallback Decision V5] ⚠️ RF Case A: Non-standard region "${segmentName}"`);
    const restrictedSet = constructRestrictedSet(
      explicitCountries, [], sector, homeCountry, isForeignBucket, evidenceCountries, knownZeroCountries
    );
    const allocation = applyRestrictedFallback(restrictedSet, sector, channel, unknownPortion);
    return {
      type: 'restricted',
      countries: allocation,
      reasoning: `RF Case A: Non-standard region "${segmentName}" (${restrictedSet.length} plausible countries)`,
      restrictedSet
    };
  }

  // Case B: Partial country evidence + incomplete membership
  if (explicitCountries.length > 0 && !isKnownRegion(segmentName)) {
    console.log(`[Fallback Decision V5] ⚠️ RF Case B: Partial evidence (${explicitCountries.length} explicit countries, region incomplete)`);
    const restrictedSet = constructRestrictedSet(
      explicitCountries, [], sector, homeCountry, isForeignBucket, evidenceCountries, knownZeroCountries
    );
    const allocation = applyRestrictedFallback(restrictedSet, sector, channel, unknownPortion);
    return {
      type: 'restricted',
      countries: allocation,
      reasoning: `RF Case B: Partial evidence (${explicitCountries.length} named, region incomplete)`,
      restrictedSet
    };
  }

  // Case C: Domestic + ambiguous foreign bucket
  if (isForeignBucket) {
    console.log(`[Fallback Decision V5] ⚠️ RF Case C: Domestic + ambiguous foreign bucket`);
    const restrictedSet = constructRestrictedSet(
      explicitCountries, [], sector, homeCountry, true, evidenceCountries, knownZeroCountries
    );
    const allocation = applyRestrictedFallback(restrictedSet, sector, channel, unknownPortion);
    return {
      type: 'restricted',
      countries: allocation,
      reasoning: `RF Case C: Foreign bucket excluding ${homeCountry} (${restrictedSet.length} plausible countries)`,
      restrictedSet
    };
  }

  // STEP 3: Is exposure plausible globally? (GF) — V5 formula with channel-specific λ
  if (isGlobalFallbackSegment(segmentName)) {
    console.log(`[Fallback Decision V5] 🌍 GF: Segment "${segmentName}" triggers global fallback (V5 formula)`);
    return {
      type: 'global',
      countries: applyGlobalFallback(sector, unknownPortion, evidenceCountries, knownZeroCountries, channel, homeCountry),
      reasoning: `GF V5: "${segmentName}" indicates unknown region membership (λ=${channel})`
    };
  }

  // Default: Region membership unknown, apply V5 global fallback
  console.log(`[Fallback Decision V5] 🌍 GF: Region membership unknown for "${segmentName}", applying V5 global fallback`);
  return {
    type: 'global',
    countries: applyGlobalFallback(sector, unknownPortion, evidenceCountries, knownZeroCountries, channel, homeCountry),
    reasoning: `GF V5: Region membership unknown for "${segmentName}" (λ=${channel})`
  };
}

/**
 * Validate that fallback respects the hierarchy rules
 */
export function validateFallbackHierarchy(
  countryData: Record<string, { state: 'known-zero' | 'known-positive' | 'unknown'; weight: number }>,
  fallbackData: Record<string, number>
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const [country, fallbackWeight] of Object.entries(fallbackData)) {
    const existing = countryData[country];

    if (existing && existing.state === 'known-zero' && fallbackWeight > 0) {
      violations.push(`${country}: Known zero received fallback weight ${(fallbackWeight * 100).toFixed(2)}%`);
    }

    if (existing && existing.state === 'known-positive' && fallbackWeight > 0) {
      violations.push(`${country}: Known evidence overwritten by fallback weight ${(fallbackWeight * 100).toFixed(2)}%`);
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Generate fallback summary for reporting - Enhanced with three-tier info
 */
export function generateFallbackSummary(
  decision: FallbackDecision,
  channel: 'revenue' | 'supply' | 'assets' | 'financial',
  sector: string
): string {
  const lines: string[] = [];

  lines.push(`\n=== FALLBACK SUMMARY: ${channel.toUpperCase()} CHANNEL ===`);
  lines.push(`Type: ${decision.type.toUpperCase()} (${
    decision.type === 'segment-specific' ? 'SSF' :
    decision.type === 'restricted' ? 'RF' :
    decision.type === 'global' ? 'GF' : 'N/A'
  })`);
  lines.push(`Reasoning: ${decision.reasoning}`);

  if (decision.restrictedSet) {
    lines.push(`\nRestricted Set P: ${decision.restrictedSet.length} countries`);
    lines.push(`Countries: ${decision.restrictedSet.slice(0, 10).join(', ')}${decision.restrictedSet.length > 10 ? '...' : ''}`);
  }

  lines.push(`\nCountries allocated: ${Object.keys(decision.countries).length}`);

  if (Object.keys(decision.countries).length > 0) {
    lines.push(`\nTop 10 allocations:`);
    const sorted = Object.entries(decision.countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [country, weight] of sorted) {
      lines.push(`  ${country}: ${(weight * 100).toFixed(4)}%`);
    }
  }

  lines.push(generateChannelFallbackExplanation(
    channel, sector,
    decision.type === 'segment-specific' ? 'SSF' : decision.type === 'restricted' ? 'RF' : 'GF'
  ));

  return lines.join('\n');
}

// Re-export for consumers that import from this module
export { validateRestrictedFallback, generateRFSummary, getIndustryDemandProxy };
export type { ChannelType };