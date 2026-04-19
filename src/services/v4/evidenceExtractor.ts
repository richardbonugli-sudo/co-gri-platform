/**
 * Evidence Extraction Service - V.4 Compliant
 * 
 * Extracts structured and narrative evidence from SEC filings.
 * PRIORITY 1 FIX: Channel-specific evidence extraction with proper segment label preservation
 * PRIORITY 1 FIX: Deterministic column selection for multi-period tables
 * PRIORITY 2 FIX: Enhanced footnote parsing with exclusion, residual, and multi-source support
 */

import {
  Channel,
  EvidenceBundle,
  StructuredItem,
  NarrativeMentions,
  NarrativeDefinition,
  EntityKind
} from '@/types/v4Types';

import { canonicalizeLabel, classifyEntityKind, GLOBAL_COUNTRIES } from './labelResolution';

/**
 * Extract evidence bundle for a channel
 */
export function extractEvidenceBundle_V4(
  companyData: any,
  channel: Channel,
  sector: string,
  homeCountry: string
): EvidenceBundle {
  
  // Extract structured items from company data (channel-specific)
  const structuredItems = extractStructuredItems(companyData, channel);
  
  // Extract narrative mentions (channel-specific)
  const narrative = extractNarrativeMentions(companyData, channel);
  
  // Supplementary hints (empty for now - would come from additional sources)
  const supplementaryMembershipHints: NarrativeMentions = {
    namedCountries: new Set(),
    geoLabels: new Set(),
    nonStandardLabels: new Set(),
    currencyLabels: new Set(),
    definitions: new Map(),
    rawSentences: []
  };
  
  return {
    channel,
    structuredItems,
    narrative,
    supplementaryMembershipHints,
    homeCountry,
    sector
  };
}

/**
 * Extract structured items from company data (CHANNEL-SPECIFIC)
 * PRIORITY 1 FIX: Removed legacy exposure fallback to prevent cross-channel contamination
 */
function extractStructuredItems(
  companyData: any,
  channel: Channel
): StructuredItem[] {
  
  // Check for V4 channel-specific evidence FIRST
  if (companyData.channelEvidence && companyData.channelEvidence[channel.toLowerCase()]) {
    const channelEvidence = companyData.channelEvidence[channel.toLowerCase()];
    if (channelEvidence.structuredItems) {
      return channelEvidence.structuredItems;
    }
  }
  
  // Channel-specific extraction from raw filing
  switch (channel) {
    case Channel.REVENUE:
      return extractRevenueStructuredItems(companyData);
    case Channel.ASSETS:
      return extractAssetsStructuredItems(companyData);
    case Channel.SUPPLY:
      return extractSupplyStructuredItems(companyData);
    case Channel.FINANCIAL:
      return extractFinancialStructuredItems(companyData);
    default:
      return [];
  }
}

/**
 * PRIORITY 1 FIX: Select most recent and most complete period from multi-period data
 * Preference: Most recent year + Most complete period (full year > partial)
 */
function selectBestPeriod(items: any[]): any[] {
  if (!items || items.length === 0) {
    return [];
  }
  
  // Group by period/year
  const periodGroups = new Map<string, any[]>();
  
  for (const item of items) {
    const period = item.period || item.year || 'unknown';
    if (!periodGroups.has(period)) {
      periodGroups.set(period, []);
    }
    periodGroups.get(period)!.push(item);
  }
  
  // If only one period, return it
  if (periodGroups.size === 1) {
    return items;
  }
  
  // Find most recent year
  const years: number[] = [];
  for (const period of periodGroups.keys()) {
    const yearMatch = period.match(/(\d{4})/);
    if (yearMatch) {
      years.push(parseInt(yearMatch[1]));
    }
  }
  
  if (years.length === 0) {
    // No year information, return first group
    return Array.from(periodGroups.values())[0];
  }
  
  const mostRecentYear = Math.max(...years);
  
  // Find periods matching most recent year
  const recentPeriods: string[] = [];
  for (const period of periodGroups.keys()) {
    if (period.includes(mostRecentYear.toString())) {
      recentPeriods.push(period);
    }
  }
  
  if (recentPeriods.length === 0) {
    // Fallback to first group
    return Array.from(periodGroups.values())[0];
  }
  
  // Prefer full year over quarters
  // Full year patterns: "2025", "FY2025", "Year 2025"
  // Quarter patterns: "2025-Q1", "Q1 2025", "2025 Q1"
  const fullYearPeriod = recentPeriods.find(p => 
    !p.match(/Q[1-4]/i) && !p.match(/quarter/i)
  );
  
  if (fullYearPeriod) {
    return periodGroups.get(fullYearPeriod)!;
  }
  
  // If no full year, take the last quarter of most recent year
  const q4Period = recentPeriods.find(p => p.match(/Q4/i));
  if (q4Period) {
    return periodGroups.get(q4Period)!;
  }
  
  // Fallback: return first period of most recent year
  return periodGroups.get(recentPeriods[0])!;
}

/**
 * Extract Revenue channel structured items
 * CRITICAL: Preserve segment labels (Americas, Europe, Greater China, etc.) as GEO_LABEL
 * DO NOT convert segment labels to country names
 * PRIORITY 1 FIX: Deterministic column selection for multi-period tables
 */
function extractRevenueStructuredItems(companyData: any): StructuredItem[] {
  const items: StructuredItem[] = [];
  
  // Check for revenue geography data
  if (companyData.revenueGeography && Array.isArray(companyData.revenueGeography)) {
    // PRIORITY 1 FIX: Select best period if multiple periods exist
    const selectedItems = selectBestPeriod(companyData.revenueGeography);
    
    for (const item of selectedItems) {
      const rawLabel = item.segment || item.label || item.country;
      const canonicalLabel = canonicalizeLabel(rawLabel);
      const entityKind = classifyEntityKind(canonicalLabel, Channel.REVENUE);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind,
        value: item.value || (item.percentage ? item.percentage / 100 : 0),
        unit: item.unit || 'pct',
        sourceRef: item.source || 'Revenue by Geographic Segment',
        isTotalRow: item.isTotal || false,
        period: item.period,
        year: item.year,
        rawUnit: item.rawUnit || (item.unit === 'currency' ? 'millions USD' : undefined)
      });
    }
    return items;
  }
  
  // Check for geographic segments
  if (companyData.geographicSegments && Array.isArray(companyData.geographicSegments)) {
    // PRIORITY 1 FIX: Select best period if multiple periods exist
    const selectedItems = selectBestPeriod(companyData.geographicSegments);
    
    for (const segment of selectedItems) {
      const rawLabel = segment.name || segment.label;
      const canonicalLabel = canonicalizeLabel(rawLabel);
      const entityKind = classifyEntityKind(canonicalLabel, Channel.REVENUE);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind,
        value: segment.revenue || segment.value || 0,
        unit: segment.unit || 'currency',
        sourceRef: 'Net Sales by Geographic Segment',
        isTotalRow: false,
        period: segment.period,
        year: segment.year,
        rawUnit: segment.rawUnit || 'millions USD'
      });
    }
    return items;
  }
  
  // No revenue-specific structured data found
  return [];
}

/**
 * Extract Assets channel structured items
 * Parse PP&E / long-lived assets table
 * Preserve geographic labels correctly
 * Handle "Other countries" as NONSTANDARD_LABEL
 * PRIORITY 1 FIX: Deterministic column selection for multi-period tables
 */
function extractAssetsStructuredItems(companyData: any): StructuredItem[] {
  const items: StructuredItem[] = [];
  
  // Check for PP&E data
  if (companyData.ppeData && companyData.ppeData.items) {
    // PRIORITY 1 FIX: Select best period if multiple periods exist
    const selectedItems = selectBestPeriod(companyData.ppeData.items);
    
    for (const item of selectedItems) {
      const rawLabel = item.country || item.label || 'Unknown';
      const canonicalLabel = canonicalizeLabel(rawLabel);
      const entityKind = classifyEntityKind(canonicalLabel, Channel.ASSETS);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind,
        value: item.unit === 'pct' ? item.value / 100 : item.value,
        unit: item.unit,
        sourceRef: item.source || 'Long-Lived Assets by Geographic Location',
        isTotalRow: item.isTotal || false,
        period: item.period,
        year: item.year,
        rawUnit: item.rawUnit || (item.unit === 'abs' ? 'millions USD' : undefined)
      });
    }
    return items;
  }
  
  // Check for asset geography data
  if (companyData.assetGeography && Array.isArray(companyData.assetGeography)) {
    // PRIORITY 1 FIX: Select best period if multiple periods exist
    const selectedItems = selectBestPeriod(companyData.assetGeography);
    
    for (const item of selectedItems) {
      const rawLabel = item.country || item.label;
      const canonicalLabel = canonicalizeLabel(rawLabel);
      const entityKind = classifyEntityKind(canonicalLabel, Channel.ASSETS);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind,
        value: item.value || (item.percentage ? item.percentage / 100 : 0),
        unit: item.unit || 'pct',
        sourceRef: 'Property, Plant & Equipment',
        isTotalRow: item.isTotal || false,
        period: item.period,
        year: item.year,
        rawUnit: item.rawUnit || (item.unit === 'currency' ? 'millions USD' : undefined)
      });
    }
    return items;
  }
  
  // No assets-specific structured data found
  return [];
}

/**
 * Extract Supply Chain channel structured items
 * Supply chain typically has NO structured table
 * Return empty array - rely on narrative extraction only
 */
function extractSupplyStructuredItems(companyData: any): StructuredItem[] {
  // Supply chain evidence is typically narrative-only
  // No structured country tables expected
  return [];
}

/**
 * Extract Financial channel structured items
 * Parse currency composition data if available
 * Return items with EntityKind.CURRENCY_LABEL for currency codes
 */
function extractFinancialStructuredItems(companyData: any): StructuredItem[] {
  const items: StructuredItem[] = [];
  
  // Check for currency composition data
  if (companyData.currencyComposition && Array.isArray(companyData.currencyComposition)) {
    for (const item of companyData.currencyComposition) {
      const rawLabel = item.currency || item.label;
      const canonicalLabel = canonicalizeLabel(rawLabel);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind: EntityKind.CURRENCY_LABEL,
        value: item.value || (item.percentage ? item.percentage / 100 : 0),
        unit: item.unit || 'pct',
        sourceRef: item.source || 'Currency Composition',
        isTotalRow: false,
        period: item.period,
        year: item.year
      });
    }
    return items;
  }
  
  // Check for financial geography data
  if (companyData.financialGeography && Array.isArray(companyData.financialGeography)) {
    for (const item of companyData.financialGeography) {
      const rawLabel = item.label || item.country;
      const canonicalLabel = canonicalizeLabel(rawLabel);
      const entityKind = classifyEntityKind(canonicalLabel, Channel.FINANCIAL);
      
      items.push({
        rawLabel,
        canonicalLabel,
        entityKind,
        value: item.value || (item.percentage ? item.percentage / 100 : 0),
        unit: item.unit || 'pct',
        sourceRef: item.source || 'Financial Geographic Data',
        isTotalRow: false,
        period: item.period,
        year: item.year
      });
    }
    return items;
  }
  
  // No financial-specific structured data found
  return [];
}

/**
 * Extract narrative mentions from company data (CHANNEL-SPECIFIC)
 * PRIORITY 1 FIX: Added footnote parsing for membership definitions
 * PRIORITY 2 FIX: Enhanced with multi-source footnote parsing and definition merging
 */
function extractNarrativeMentions(
  companyData: any,
  channel: Channel
): NarrativeMentions {
  
  const mentions: NarrativeMentions = {
    namedCountries: new Set(),
    geoLabels: new Set(),
    nonStandardLabels: new Set(),
    currencyLabels: new Set(),
    definitions: new Map(),
    rawSentences: []
  };
  
  // PRIORITY 2: Parse footnotes from multiple sources
  const footnoteSources = [
    { data: companyData.footnotes, name: 'footnotes' },
    { data: companyData.tableFootnotes, name: 'tableFootnotes' },
    { data: companyData.narrativeFootnotes, name: 'narrativeFootnotes' },
    { data: companyData.mdaFootnotes, name: 'mdaFootnotes' }
  ];
  
  for (const source of footnoteSources) {
    if (source.data && Array.isArray(source.data)) {
      for (const footnote of source.data) {
        const def = parseFootnoteForMembership(footnote);
        if (def) {
          // Merge with existing definition if present
          const existing = mentions.definitions.get(def.label);
          if (existing) {
            mentions.definitions.set(def.label, mergeDefinitions(existing, def));
          } else {
            mentions.definitions.set(def.label, def);
          }
        }
      }
    }
  }
  
  // Check if company has V4 narrative text (channel-specific)
  const channelKey = channel.toLowerCase();
  if (companyData.narrativeText && companyData.narrativeText[channelKey]) {
    const narrativeText = companyData.narrativeText[channelKey];
    
    // Parse narrative text
    const sentences = narrativeText.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    mentions.rawSentences = sentences;
    
    // Extract country mentions
    for (const sentence of sentences) {
      for (const country of GLOBAL_COUNTRIES) {
        if (sentence.toLowerCase().includes(country.toLowerCase())) {
          mentions.namedCountries.add(country);
        }
      }
      
      // Extract geo label mentions
      const geoLabelPatterns = [
        /Americas?/i,
        /Europe/i,
        /Asia Pacific/i,
        /Greater China/i,
        /EMEA/i,
        /Middle East/i,
        /Latin America/i,
        /Rest of Asia Pacific/i
      ];
      
      for (const pattern of geoLabelPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          mentions.geoLabels.add(match[0]);
        }
      }
      
      // Extract nonstandard labels
      const nonstandardPatterns = [
        /International/i,
        /Other countries/i,
        /Overseas/i,
        /Foreign/i,
        /Rest of/i
      ];
      
      for (const pattern of nonstandardPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          mentions.nonStandardLabels.add(match[0]);
        }
      }
      
      // Extract currency labels (for Financial channel)
      if (channel === Channel.FINANCIAL) {
        const currencyPatterns = [
          /USD/i, /US Dollar/i,
          /EUR/i, /Euro/i,
          /GBP/i, /British Pound/i,
          /JPY/i, /Japanese Yen/i,
          /CNY/i, /Chinese Yuan/i,
          /CHF/i, /Swiss Franc/i,
          /CAD/i, /Canadian Dollar/i,
          /AUD/i, /Australian Dollar/i
        ];
        
        for (const pattern of currencyPatterns) {
          const match = sentence.match(pattern);
          if (match) {
            mentions.currencyLabels.add(match[0]);
          }
        }
      }
    }
  }
  
  // Check if company has V4 label definitions
  if (companyData.labelDefinitions) {
    for (const [label, def] of Object.entries(companyData.labelDefinitions)) {
      const typedDef = def as any;
      const labelDef: NarrativeDefinition = {
        label,
        includes: typedDef.membership || [],
        excludes: [],
        residualOf: null,
        confidence: typedDef.confidence || 0.9,
        sourceRef: typedDef.membershipSource || 'Label definition'
      };
      
      // Merge with existing if present
      const existing = mentions.definitions.get(label);
      if (existing) {
        mentions.definitions.set(label, mergeDefinitions(existing, labelDef));
      } else {
        mentions.definitions.set(label, labelDef);
      }
    }
  }
  
  // PRIORITY 2: Calculate confidence scores for all definitions
  // PHASE 2 FIX: Preserve explicitly set confidence values (e.g., from footnotes)
  for (const [label, def] of mentions.definitions.entries()) {
    // Only recalculate if confidence wasn't explicitly set (i.e., still at default/low value)
    // Preserve high-confidence values from explicit sources like footnotes (0.9) or labelDefinitions
    const shouldRecalculate = def.confidence < 0.85; // Threshold to preserve explicit high-confidence values
    
    const adjustedDef = {
      ...def,
      confidence: shouldRecalculate ? calculateDefinitionConfidence(def) : def.confidence
    };
    mentions.definitions.set(label, adjustedDef);
  }
  
  return mentions;
}

/**
 * PRIORITY 2: Parse footnote for membership definitions with enhanced patterns
 * Supports inclusion, exclusion, and residual patterns
 */
function parseFootnoteForMembership(footnote: string): NarrativeDefinition | null {
  
  // Try inclusion patterns first
  const inclusionPatterns = [
    /(\w+(?:\s+\w+)*)\s+includes?\s+([^.]+)/i,
    /(\w+(?:\s+\w+)*)\s+comprises?\s+([^.]+)/i,
    /(\w+(?:\s+\w+)*)\s+consists?\s+of\s+([^.]+)/i
  ];
  
  for (const pattern of inclusionPatterns) {
    const match = footnote.match(pattern);
    if (match) {
      return parseInclusionDefinition(match[1], match[2]);
    }
  }
  
  // Try exclusion patterns
  const exclusionPatterns = [
    /(\w+(?:\s+\w+)*)\s+excludes?\s+([^.]+)/i,
    /(\w+(?:\s+\w+)*)\s+other\s+than\s+([^.]+)/i,
    /(\w+(?:\s+\w+)*)\s+except\s+([^.]+)/i
  ];
  
  for (const pattern of exclusionPatterns) {
    const match = footnote.match(pattern);
    if (match) {
      return parseExclusionDefinition(match[1], match[2]);
    }
  }
  
  // Try residual patterns
  const residualPatterns = [
    /(\w+(?:\s+\w+)*)\s+represents?\s+all\s+other\s+countries/i,
    /(\w+(?:\s+\w+)*)\s+is\s+the\s+residual/i,
    /(\w+(?:\s+\w+)*)\s+includes?\s+all\s+remaining/i
  ];
  
  for (const pattern of residualPatterns) {
    const match = footnote.match(pattern);
    if (match) {
      return parseResidualDefinition(match[1]);
    }
  }
  
  return null;
}

/**
 * PRIORITY 2: Parse inclusion definition (e.g., "China includes Hong Kong and Taiwan")
 */
function parseInclusionDefinition(label: string, memberText: string): NarrativeDefinition {
  const members = splitMemberList(memberText);
  
  // PHASE 1 CRITICAL FIX: If the label itself is a country name, add it to members
  // Example: "China includes Hong Kong and Taiwan" means members = [China, Hong Kong, Taiwan]
  const canonicalLabel = canonicalizeLabel(label.trim());
  if (GLOBAL_COUNTRIES.includes(canonicalLabel) && !members.includes(canonicalLabel)) {
    members.unshift(canonicalLabel);
  }
  
  return {
    label: label.trim(),
    includes: members,
    excludes: [],
    residualOf: null,
    confidence: 0.9,
    sourceRef: 'Footnote definition (inclusion)'
  };
}

/**
 * PRIORITY 2: Parse exclusion definition (e.g., "Europe excludes United Kingdom")
 */
function parseExclusionDefinition(label: string, excludedText: string): NarrativeDefinition {
  const excluded = splitMemberList(excludedText);
  return {
    label: label.trim(),
    includes: [], // Would need to infer from context
    excludes: excluded,
    residualOf: null,
    confidence: 0.7, // Lower confidence for exclusions
    sourceRef: 'Footnote definition (exclusion)'
  };
}

/**
 * PRIORITY 2: Parse residual definition (e.g., "Other countries represents all other countries")
 */
function parseResidualDefinition(label: string): NarrativeDefinition {
  return {
    label: label.trim(),
    includes: [],
    excludes: [],
    residualOf: 'all_other', // Special marker
    confidence: 0.8,
    sourceRef: 'Footnote definition (residual)'
  };
}

/**
 * PRIORITY 2: Split member list handling various separators
 */
function splitMemberList(text: string): string[] {
  // Handle various separators: commas, "and", semicolons
  return text
    .split(/[,;]|\s+and\s+/i)
    .map(m => m.trim())
    .filter(m => m.length > 0)
    .map(m => canonicalizeLabel(m));
}

/**
 * PRIORITY 2: Merge two definitions, combining their information
 */
function mergeDefinitions(def1: NarrativeDefinition, def2: NarrativeDefinition): NarrativeDefinition {
  return {
    label: def1.label,
    includes: [...new Set([...def1.includes, ...def2.includes])],
    excludes: [...new Set([...def1.excludes, ...def2.excludes])],
    residualOf: def1.residualOf || def2.residualOf,
    confidence: Math.max(def1.confidence, def2.confidence),
    sourceRef: `${def1.sourceRef}; ${def2.sourceRef}`
  };
}

/**
 * PRIORITY 2: Calculate confidence score based on definition characteristics
 */
function calculateDefinitionConfidence(def: NarrativeDefinition): number {
  let confidence = 0.5; // Base confidence
  
  // Boost for explicit includes
  if (def.includes.length > 0) confidence += 0.2;
  
  // Boost for multiple sources
  if (def.sourceRef.includes(';')) confidence += 0.1;
  
  // Boost for residual definitions
  if (def.residualOf) confidence += 0.1;
  
  // Penalty for ambiguous patterns (no includes, no excludes, no residual)
  if (def.includes.length === 0 && def.excludes.length === 0 && !def.residualOf) {
    confidence -= 0.2;
  }
  
  // Penalty for very long member lists (likely incomplete)
  if (def.includes.length > 20) confidence -= 0.1;
  
  // Boost for reasonable member list size (2-10 members)
  if (def.includes.length >= 2 && def.includes.length <= 10) confidence += 0.1;
  
  // Ensure confidence is within valid range
  return Math.max(0.3, Math.min(0.95, confidence));
}