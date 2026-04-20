/**
 * Evidence Extraction Service - V.4 Enhanced (Phase 2 Fix)
 * 
 * PHASE 1 ENHANCEMENTS:
 * 1. Enhanced table detection for Apple-style tables
 * 2. Better handling of segment labels vs country names
 * 3. Footnote definition extraction
 * 4. Improved entity classification
 * 
 * PHASE 2 ENHANCEMENTS:
 * 1. Context-aware country name extraction
 * 2. Currency mention extraction for Financial channel
 * 3. Enhanced Supply Chain narrative extraction
 * 4. Text preprocessing and normalization
 */

import {
  Channel,
  EvidenceBundle,
  StructuredItem,
  NarrativeMentions,
  NarrativeDefinition,
  EntityKind
} from '@/types/v4Types';

import { 
  canonicalizeLabel, 
  classifyEntityKind, 
  GLOBAL_COUNTRIES,
  getCurrencyCountries,
  CURRENCY_TO_COUNTRY
} from './labelResolution';

/**
 * PHASE 1 FIX: Enhanced table detection patterns
 */
const TABLE_PATTERNS = {
  // Revenue tables
  SEGMENT_OPERATING_PERFORMANCE: /segment\s+operating\s+performance|net\s+sales\s+by\s+segment/i,
  NET_SALES_BY_COUNTRY: /net\s+sales|revenue\s+by\s+(geographic|country)/i,
  
  // Asset tables
  LONG_LIVED_ASSETS: /long[- ]lived\s+assets|property[,\s]+plant\s+(?:and|&)\s+equipment|pp&e/i,
  
  // Common table indicators
  TOTAL_ROW: /^total$/i,
  
  // Footnote patterns
  INCLUDES_DEFINITION: /includes?\s+([^.]+)/i,
  COMPRISES_DEFINITION: /comprises?\s+([^.]+)/i
};

/**
 * PHASE 1 FIX: Enhanced segment label patterns
 */
const SEGMENT_LABELS = {
  AMERICAS: /^americas?$/i,
  EUROPE: /^europe$/i,
  ASIA_PACIFIC: /^asia[- ]pacific|rest\s+of\s+asia|asia\s+excluding/i,
  GREATER_CHINA: /^greater\s+china|china\s+region/i,
  OTHER_COUNTRIES: /^other\s+countries|rest\s+of\s+world|other\s+regions?/i
};

/**
 * PHASE 2: Context patterns for country extraction
 * These patterns help identify country names in narrative text
 */
const COUNTRY_CONTEXT_PATTERNS = [
  // Location/operations patterns
  /(?:located|based|headquartered|established|incorporated|operates?|operating)\s+in\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:facilities|operations|offices|plants|factories|manufacturing)\s+in\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:presence|footprint)\s+in\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  
  // Supply chain patterns
  /(?:sourced?|sourcing|procured?|procurement|purchased?|obtained?)\s+(?:from|in)\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:manufactured?|produced?|made|assembled?)\s+in\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:suppliers?|vendors?|contractors?)\s+(?:in|from)\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:imports?|imported?|importing)\s+from\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:exports?|exported?|exporting)\s+to\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  
  // Market/sales patterns
  /(?:markets?|sells?|selling|sold|distributes?|distributed?)\s+(?:in|to)\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  /(?:customers?|clients?)\s+in\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  
  // Testing/operations patterns
  /(?:testing|conducted|performed)\s+in\s+(?:the\s+)?([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
  
  // Financial patterns
  /(?:denominated?|translated?|converted?)\s+(?:in|from|to)\s+([A-Z]{3})/gi,
  /(?:currency|currencies)\s+(?:of|in)\s+([A-Z][a-z\s]+(?:[A-Z][a-z]+)?)/gi,
];

/**
 * PHASE 2: Currency patterns for Financial channel
 */
const CURRENCY_PATTERNS = [
  // Currency codes (ISO 4217)
  /\b([A-Z]{3})\b/g,
  
  // Currency symbols with context
  /(?:denominated|translated|converted|expressed)\s+(?:in|from|to)\s+([$€£¥₹₽₩฿₱₫]|[A-Z]{3})/gi,
  /\b(USD|EUR|GBP|JPY|CNY|RMB|CHF|CAD|AUD|HKD|SGD|KRW|INR|MXN|BRL|ZAR|AED|SAR|TWD|THB|MYR|IDR|PHP|VND|NZD|SEK|NOK|DKK|PLN|TRY|RUB)\b/gi,
  
  // Currency symbols
  /([$€£¥₹₽₩฿₱₫])\s*[\d,]+/g,
];

/**
 * Extract evidence bundle for a channel (ENHANCED)
 */
export function extractEvidenceBundle_V4_Enhanced(
  companyData: any,
  channel: Channel,
  sector: string,
  homeCountry: string
): EvidenceBundle {
  
  // PHASE 1: Enhanced structured extraction with table detection
  const structuredItems = extractStructuredItemsEnhanced(companyData, channel);
  
  // PHASE 2: Enhanced narrative extraction with context-aware extraction
  const narrative = extractNarrativeMentionsEnhanced(companyData, channel);
  
  // Supplementary hints (empty for now)
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
 * PHASE 1 FIX: Enhanced structured item extraction
 */
function extractStructuredItemsEnhanced(
  companyData: any,
  channel: Channel
): StructuredItem[] {
  
  // Check for V4 channel-specific evidence
  if (companyData.channelEvidence && companyData.channelEvidence[channel.toLowerCase()]) {
    const channelEvidence = companyData.channelEvidence[channel.toLowerCase()];
    if (channelEvidence.structuredItems) {
      return enhanceStructuredItems(channelEvidence.structuredItems, channel);
    }
  }
  
  // Channel-specific extraction
  switch (channel) {
    case Channel.REVENUE:
      return extractRevenueStructuredItemsEnhanced(companyData);
    case Channel.ASSETS:
      return extractAssetsStructuredItemsEnhanced(companyData);
    case Channel.SUPPLY:
      return []; // Supply chain is narrative-only
    case Channel.FINANCIAL:
      return []; // Financial is narrative-only
    default:
      return [];
  }
}

/**
 * PHASE 1 FIX: Enhanced Revenue extraction with better table detection
 */
function extractRevenueStructuredItemsEnhanced(companyData: any): StructuredItem[] {
  const items: StructuredItem[] = [];
  
  // Try multiple data sources
  const dataSources = [
    companyData.revenueGeography,
    companyData.geographicSegments,
    companyData.segmentData?.revenue,
    companyData.tables?.revenue
  ];
  
  for (const dataSource of dataSources) {
    if (dataSource && Array.isArray(dataSource) && dataSource.length > 0) {
      for (const item of dataSource) {
        const rawLabel = item.segment || item.label || item.country || item.name;
        if (!rawLabel) continue;
        
        const canonicalLabel = canonicalizeLabel(rawLabel);
        
        // PHASE 1 FIX: Better entity classification
        const entityKind = classifyEntityKindEnhanced(canonicalLabel, rawLabel, Channel.REVENUE);
        
        // PHASE 1 FIX: Better value handling - check if already in decimal form
        let value = item.value;
        if (item.percentage !== undefined) {
          // If percentage field exists, use it (assume it's already 0-100 range)
          value = item.percentage / 100;
        } else if (item.unit === 'pct' && value > 1) {
          // If unit is pct and value > 1, assume it's in 0-100 range
          value = value / 100;
        }
        // Otherwise use value as-is (assume it's already in decimal form)
        
        items.push({
          rawLabel,
          canonicalLabel,
          entityKind,
          value,
          unit: item.unit || (item.percentage ? 'pct' : 'currency'),
          sourceRef: item.source || 'Revenue by Geographic Segment',
          isTotalRow: item.isTotal || TABLE_PATTERNS.TOTAL_ROW.test(rawLabel)
        });
      }
      
      // If we found items, return them
      if (items.length > 0) {
        return items;
      }
    }
  }
  
  return [];
}

/**
 * PHASE 1 FIX: Enhanced Assets extraction with better table detection
 */
function extractAssetsStructuredItemsEnhanced(companyData: any): StructuredItem[] {
  const items: StructuredItem[] = [];
  
  // Try multiple data sources
  const dataSources = [
    companyData.ppeData?.items,
    companyData.assetGeography,
    companyData.longLivedAssets,
    companyData.tables?.assets
  ];
  
  for (const dataSource of dataSources) {
    if (dataSource && Array.isArray(dataSource) && dataSource.length > 0) {
      for (const item of dataSource) {
        const rawLabel = item.country || item.label || item.name;
        if (!rawLabel) continue;
        
        const canonicalLabel = canonicalizeLabel(rawLabel);
        
        // PHASE 1 FIX: Better entity classification
        const entityKind = classifyEntityKindEnhanced(canonicalLabel, rawLabel, Channel.ASSETS);
        
        // PHASE 1 FIX: Better value handling - values are already in decimal form (0.81 = 81%)
        let value = item.value;
        // Don't divide by 100 if value is already < 1 (it's already in decimal form)
        
        items.push({
          rawLabel,
          canonicalLabel,
          entityKind,
          value,
          unit: item.unit || 'pct',
          sourceRef: item.source || 'Long-Lived Assets by Geographic Location',
          isTotalRow: item.isTotal || TABLE_PATTERNS.TOTAL_ROW.test(rawLabel)
        });
      }
      
      // If we found items, return them
      if (items.length > 0) {
        return items;
      }
    }
  }
  
  return [];
}

/**
 * PHASE 1 FIX: Enhanced entity classification
 */
function classifyEntityKindEnhanced(
  canonicalLabel: string,
  rawLabel: string,
  channel: Channel
): EntityKind {
  
  // PHASE 1 FIX: Check "Other countries" FIRST (before other patterns)
  if (SEGMENT_LABELS.OTHER_COUNTRIES.test(rawLabel) || SEGMENT_LABELS.OTHER_COUNTRIES.test(canonicalLabel)) {
    return EntityKind.NONSTANDARD_LABEL;
  }
  
  // Check if it's a known segment label
  for (const [key, pattern] of Object.entries(SEGMENT_LABELS)) {
    if (key !== 'OTHER_COUNTRIES' && (pattern.test(rawLabel) || pattern.test(canonicalLabel))) {
      return EntityKind.GEO_LABEL;
    }
  }
  
  // Use standard classification
  return classifyEntityKind(canonicalLabel, channel);
}

/**
 * PHASE 2: Enhanced narrative extraction with context-aware extraction
 */
function extractNarrativeMentionsEnhanced(
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
  
  // PHASE 1 FIX: Extract from multiple narrative sources
  let narrativeText: string;
  
  // Try different narrative field structures
  if (companyData.narrativeText) {
    // Handle narrativeText object with channel-specific fields
    if (typeof companyData.narrativeText === 'object') {
      narrativeText = companyData.narrativeText[channel.toLowerCase()] || 
                      companyData.narrativeText.revenue || 
                      companyData.narrativeText.general || 
                      '';
    } else {
      narrativeText = companyData.narrativeText;
    }
  } else {
    narrativeText = companyData.narrative || companyData.businessDescription || '';
  }
  
  if (narrativeText) {
    // PHASE 2: Enhanced country name extraction with context awareness
    extractCountryNamesFromNarrativeEnhanced(narrativeText, mentions, channel);
    
    // PHASE 1 FIX: Extract geographic labels
    extractGeoLabelsFromNarrative(narrativeText, mentions);
    
    // PHASE 2: Extract currency mentions for Financial channel
    if (channel === Channel.FINANCIAL) {
      extractCurrencyMentionsFromNarrative(narrativeText, mentions);
    }
    
    mentions.rawSentences.push(narrativeText);
  }
  
  // PHASE 1 FIX: Extract definitions from footnotes
  extractDefinitionsFromFootnotes(companyData, mentions);
  
  return mentions;
}

/**
 * PHASE 2: Enhanced country name extraction with context awareness
 * Handles Supply Chain and Financial channel narratives
 */
function extractCountryNamesFromNarrativeEnhanced(
  text: string,
  mentions: NarrativeMentions,
  channel: Channel
): void {
  
  // PHASE 2: Text preprocessing
  const normalizedText = preprocessText(text);
  
  // PHASE 2 FIX: Extract standalone abbreviations FIRST
  // Fixed pattern to handle periods and commas correctly
  const abbreviationPatterns = [
    /(the\s+)?(U\.S\.|USA|US)(?=\s|$|\.|,)/gi,
    /(the\s+)?(UK|U\.K\.)(?=\s|$|\.|,)/gi,
    /(PRC)(?=\s|$|\.|,)/gi,
    /(HK|HKSAR)(?=\s|$|\.|,)/gi,
    /(ROK|ROC)(?=\s|$|\.|,)/gi,
  ];
  
  for (const pattern of abbreviationPatterns) {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      // For patterns with 2 groups: group 1 is optional "the ", group 2 is the abbreviation
      // For patterns with 1 group: group 1 is the abbreviation
      const abbr = match[2] || match[1];
      if (abbr) {
        const country = canonicalizeLabel(abbr);
        if (GLOBAL_COUNTRIES.includes(country)) {
          mentions.namedCountries.add(country);
        }
      }
    }
  }
  
  // PHASE 2: Context-aware extraction using patterns
  for (const pattern of COUNTRY_CONTEXT_PATTERNS) {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      const extracted = match[1];
      if (extracted) {
        const country = canonicalizeLabel(extracted);
        if (GLOBAL_COUNTRIES.includes(country)) {
          mentions.namedCountries.add(country);
        }
      }
    }
  }
  
  // PHASE 1: Direct country name patterns (enhanced with more countries)
  const countryPatterns = [
    // Major economies
    /\b(China|India|Japan|South Korea|Taiwan|Vietnam|United States)\b/gi,
    /\b(Germany|France|United Kingdom|Italy|Spain)\b/gi,
    /\b(Brazil|Mexico|Canada|Argentina)\b/gi,
    
    // Asian countries
    /\b(Singapore|Hong Kong|Malaysia|Indonesia|Thailand|Philippines)\b/gi,
    /\b(Pakistan|Bangladesh|Sri Lanka)\b/gi,
    
    // European countries
    /\b(Netherlands|Belgium|Switzerland|Austria|Sweden|Norway|Denmark|Finland)\b/gi,
    /\b(Poland|Czech Republic|Hungary|Romania|Greece|Portugal|Ireland)\b/gi,
    
    // Middle East & Africa
    /\b(UAE|Saudi Arabia|Israel|Turkey|Qatar|Kuwait)\b/gi,
    /\b(South Africa|Nigeria|Egypt|Kenya|Morocco)\b/gi,
    
    // Oceania
    /\b(Australia|New Zealand)\b/gi,
    
    // Americas
    /\b(Chile|Colombia|Peru|Venezuela|Ecuador)\b/gi,
  ];
  
  for (const pattern of countryPatterns) {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      const country = canonicalizeLabel(match[1]);
      if (GLOBAL_COUNTRIES.includes(country)) {
        mentions.namedCountries.add(country);
      }
    }
  }
}

/**
 * PHASE 2: Text preprocessing for better extraction
 * Normalizes text while preserving important patterns
 */
function preprocessText(text: string): string {
  // Remove excessive whitespace
  let processed = text.replace(/\s+/g, ' ');
  
  // Normalize common abbreviations (but keep them recognizable)
  processed = processed.replace(/\bU\.S\.A\./gi, 'USA');
  processed = processed.replace(/\bP\.R\.C\./gi, 'PRC');
  
  return processed.trim();
}

/**
 * PHASE 2: Extract currency mentions from Financial narrative
 * Maps currencies to their primary countries
 */
function extractCurrencyMentionsFromNarrative(
  text: string,
  mentions: NarrativeMentions
): void {
  
  const normalizedText = preprocessText(text);
  const foundCurrencies = new Set<string>();
  
  // Extract currency codes and symbols
  for (const pattern of CURRENCY_PATTERNS) {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      const currency = match[1];
      if (currency) {
        foundCurrencies.add(currency.toUpperCase());
        mentions.currencyLabels.add(currency.toUpperCase());
      }
    }
  }
  
  // Map currencies to countries
  for (const currency of foundCurrencies) {
    const countries = getCurrencyCountries(currency);
    for (const country of countries) {
      mentions.namedCountries.add(country);
    }
  }
}

/**
 * PHASE 1 FIX: Extract geographic labels from narrative
 */
function extractGeoLabelsFromNarrative(text: string, mentions: NarrativeMentions): void {
  const geoLabelPatterns = [
    /\b(Asia|Europe|Americas?|Africa|Oceania)\b/gi,
    /\b(Asia[- ]Pacific|EMEA|LATAM|North America|South America)\b/gi,
    /\b(Western Europe|Eastern Europe|Northern Europe|Southern Europe)\b/gi,
    /\b(Southeast Asia|East Asia|South Asia|Middle East)\b/gi,
  ];
  
  for (const pattern of geoLabelPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      mentions.geoLabels.add(canonicalizeLabel(match[1]));
    }
  }
}

/**
 * PHASE 1 FIX: Extract definitions from footnotes
 * CRITICAL FIX: When a country name appears as a label (e.g., "China includes Hong Kong and Taiwan"),
 * we need to add the country itself to the members list
 */
function extractDefinitionsFromFootnotes(companyData: any, mentions: NarrativeMentions): void {
  const footnotes = companyData.footnotes || companyData.tableFootnotes || [];
  
  for (const footnote of footnotes) {
    const text = footnote.text || footnote;
    
    // Pattern: "Greater China includes China mainland, Hong Kong and Taiwan"
    // Pattern: "China includes Hong Kong and Taiwan"
    const includesMatch = text.match(/([A-Za-z\s]+)\s+includes?\s+([^.]+)/i);
    if (includesMatch) {
      const label = canonicalizeLabel(includesMatch[1].trim());
      const memberText = includesMatch[2];
      
      // Split by comma and "and"
      const members = memberText
        .split(/,\s*(?:and\s+)?|\s+and\s+/)
        .map(m => {
          // Handle "China mainland" -> "China"
          let cleaned = m.trim();
          if (cleaned.toLowerCase().includes('china mainland')) {
            cleaned = 'China';
          }
          return canonicalizeLabel(cleaned);
        })
        .filter(m => m.length > 0);
      
      // PHASE 1 CRITICAL FIX: If the label itself is a country name, add it to members
      // Example: "China includes Hong Kong and Taiwan" means members = [China, Hong Kong, Taiwan]
      console.log('[DEBUG] Label:', label, 'In GLOBAL_COUNTRIES?', GLOBAL_COUNTRIES.includes(label), 'In members?', members.includes(label), 'Members:', members);
      if (GLOBAL_COUNTRIES.includes(label) && !members.includes(label)) {
        console.log('[DEBUG] Adding label to members');
        members.unshift(label);
      }
      
      mentions.definitions.set(label, {
        label,
        includes: members,
        excludes: [],
        residualOf: null,
        confidence: 0.9,
        sourceRef: 'footnote'
      });
    }
    
    // Pattern: "Americas comprises North and South America"
    const comprisesMatch = text.match(/([A-Za-z\s]+)\s+comprises?\s+([^.]+)/i);
    if (comprisesMatch) {
      const label = canonicalizeLabel(comprisesMatch[1].trim());
      const memberText = comprisesMatch[2];
      
      const members = memberText
        .split(/,\s*(?:and\s+)?|\s+and\s+/)
        .map(m => canonicalizeLabel(m.trim()))
        .filter(m => m.length > 0);
      
      // PHASE 1 CRITICAL FIX: If the label itself is a country name, add it to members
      if (GLOBAL_COUNTRIES.includes(label) && !members.includes(label)) {
        members.unshift(label);
      }
      
      mentions.definitions.set(label, {
        label,
        includes: members,
        excludes: [],
        residualOf: null,
        confidence: 0.9,
        sourceRef: 'footnote'
      });
    }
  }
}

/**
 * Enhance existing structured items with better classification
 */
function enhanceStructuredItems(items: StructuredItem[], channel: Channel): StructuredItem[] {
  return items.map(item => ({
    ...item,
    entityKind: classifyEntityKindEnhanced(item.canonicalLabel, item.rawLabel, channel)
  }));
}

// Export original function for backward compatibility
export { extractEvidenceBundle_V4_Enhanced as extractEvidenceBundle_V4 };