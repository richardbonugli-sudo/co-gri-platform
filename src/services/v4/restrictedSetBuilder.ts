/**
 * Restricted Set Builder - V.4 Compliant
 * 
 * Builds restricted set P for RF allocations.
 * V.4 mechanics: Named countries + bounded expansions + plausibility - exclusions
 */

import { EvidenceBundle, RestrictedSetResult } from '@/types/v4Types';
import { isStandardBoundedGeoLabel, expandUN_M49, GLOBAL_COUNTRIES } from './labelResolution';

/**
 * Build restricted set P (V4 mechanics)
 */
export function buildRestrictedSetP(
  evidenceBundle: EvidenceBundle,
  directAllocatedCountries: Set<string>,
  extraLabelHints: Set<string>
): RestrictedSetResult {
  
  let P = new Set<string>();
  const logs: string[] = [];
  
  // 1) Named countries (primary + supplementary)
  const namedCountries = new Set([
    ...evidenceBundle.narrative.namedCountries,
    ...evidenceBundle.supplementaryMembershipHints.namedCountries
  ]);
  
  for (const country of namedCountries) {
    P.add(country);
  }
  logs.push(`Added ${namedCountries.size} named countries`);
  
  // 2) Expand standard bounded labels (primary + supplementary + extra hints)
  const allGeoLabels = new Set([
    ...evidenceBundle.narrative.geoLabels,
    ...evidenceBundle.supplementaryMembershipHints.geoLabels,
    ...extraLabelHints
  ]);
  
  for (const label of allGeoLabels) {
    if (isStandardBoundedGeoLabel(label)) {
      const expanded = expandUN_M49(label);
      for (const country of expanded) {
        P.add(country);
      }
      logs.push(`Expanded label "${label}" to ${expanded.length} countries`);
    }
  }
  
  // 3) Nonstandard labels add NOTHING deterministically
  // (V4 rule: nonstandard -> plausibility, not full expansion)
  
  // 4) Channel/sector plausibility set
  const plausibilitySet = getChannelSectorPlausibilitySet(
    evidenceBundle.channel,
    evidenceBundle.sector
  );
  
  for (const country of plausibilitySet) {
    P.add(country);
  }
  logs.push(`Added ${plausibilitySet.length} countries from plausibility set`);
  
  // 5) Apply exclusions AFTER constructing P
  const exclusions = new Set<string>();
  
  // Exclude already-allocated countries
  for (const country of directAllocatedCountries) {
    exclusions.add(country);
  }
  
  // Exclude home country if exposure is foreign-only
  if (exposureIsForeignOnly(evidenceBundle.channel, evidenceBundle)) {
    exclusions.add(evidenceBundle.homeCountry);
  }
  
  // Apply exclusions
  for (const excluded of exclusions) {
    P.delete(excluded);
  }
  logs.push(`Excluded ${exclusions.size} countries (already allocated or home country)`);
  
  const log = logs.join('; ');
  
  return {
    P,
    log: `P built from named + bounded expansions + plausibility; exclusions applied last. ${log}`
  };
}

/**
 * Get channel/sector plausibility set
 */
function getChannelSectorPlausibilitySet(channel: string, sector: string): string[] {
  // Simplified plausibility logic
  // In production, this would be more sophisticated based on sector and channel
  
  // For now, return major economies that are plausible for most sectors
  const majorEconomies = [
    'United States', 'China', 'Japan', 'Germany', 'United Kingdom',
    'France', 'India', 'Italy', 'Brazil', 'Canada', 'South Korea',
    'Spain', 'Australia', 'Mexico', 'Indonesia', 'Netherlands',
    'Saudi Arabia', 'Turkey', 'Switzerland', 'Poland'
  ];
  
  // Technology sector: add more Asian countries
  if (sector === 'Technology') {
    return [
      ...majorEconomies,
      'Taiwan', 'Singapore', 'Hong Kong', 'Malaysia', 'Thailand', 'Vietnam'
    ];
  }
  
  // Manufacturing: add more emerging markets
  if (sector === 'Industrials' || sector === 'Consumer Discretionary') {
    return [
      ...majorEconomies,
      'Vietnam', 'Thailand', 'Malaysia', 'Philippines', 'Bangladesh'
    ];
  }
  
  // Energy: add oil-producing countries
  if (sector === 'Energy') {
    return [
      ...majorEconomies,
      'UAE', 'Qatar', 'Kuwait', 'Norway', 'Nigeria', 'Venezuela'
    ];
  }
  
  // Default: major economies
  return majorEconomies;
}

/**
 * Check if exposure is foreign-only (exclude home country)
 */
function exposureIsForeignOnly(channel: string, evidenceBundle: EvidenceBundle): boolean {
  // Check narrative for "international", "foreign", "overseas" keywords
  const narrative = evidenceBundle.narrative;
  
  const foreignKeywords = [
    'international',
    'foreign',
    'overseas',
    'outside',
    'abroad'
  ];
  
  for (const sentence of narrative.rawSentences) {
    const lower = sentence.toLowerCase();
    for (const keyword of foreignKeywords) {
      if (lower.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if exposure is plausibly worldwide
 */
export function exposurePlausiblyWorldwide(channel: string, sector: string): boolean {
  // Technology, Consumer Staples, Healthcare are typically worldwide
  const worldwideSectors = [
    'Technology',
    'Consumer Staples',
    'Healthcare',
    'Communication Services'
  ];
  
  if (worldwideSectors.includes(sector)) {
    return true;
  }
  
  // Financial channel is often worldwide
  if (channel === 'FINANCIAL') {
    return true;
  }
  
  return false;
}