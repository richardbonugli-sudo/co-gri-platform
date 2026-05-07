/**
 * Exhibit 21 Parser - Subsidiary Extraction
 * 
 * Parses Exhibit 21 (Subsidiaries of the Registrant) from SEC filings
 * to extract direct evidence of operational presence in countries worldwide.
 * 
 * STRATEGIC VALUE:
 * - Direct evidence of legal entity presence (100% confidence)
 * - Operations channel: Subsidiary = operational presence
 * - Assets channel: Legal entities typically own/lease facilities
 * - Revenue channel: Local subsidiaries often indicate market presence
 * 
 * EXHIBIT 21 STRUCTURE:
 * - Table format: Subsidiary Name | Jurisdiction of Incorporation | Ownership %
 * - Located near end of 10-K filing
 * - Required disclosure for all material subsidiaries
 * 
 * PARSING STRATEGY:
 * 1. Locate Exhibit 21 section in HTML
 * 2. Extract table data (name, jurisdiction, ownership)
 * 3. Normalize jurisdiction names to standard country names
 * 4. Filter by materiality (typically >50% ownership)
 * 5. Aggregate by country for exposure calculation
 */

import * as cheerio from 'cheerio';
import { normalizeCountryName, isActualCountry } from '../countryValidator';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Subsidiary {
  name: string;
  jurisdiction: string;
  normalizedCountry: string;
  ownershipPercentage: number;
  isMaterial: boolean;
  source: string;
}

export interface SubsidiaryExposure {
  country: string;
  subsidiaryCount: number;
  subsidiaries: Subsidiary[];
  totalOwnership: number; // Sum of ownership percentages
  averageOwnership: number;
  hasMajorityOwned: boolean; // At least one >50% owned
  hasWhollyOwned: boolean; // At least one 100% owned
}

export interface Exhibit21Data {
  ticker: string;
  filingDate: string;
  fiscalYear: number;
  
  subsidiaries: Subsidiary[];
  totalSubsidiaries: number;
  
  // Country-level aggregation
  countryExposures: SubsidiaryExposure[];
  
  // Metadata
  exhibit21Found: boolean;
  parsingSuccess: boolean;
  parsingErrors: string[];
  
  // Quality metrics
  jurisdictionsIdentified: number;
  jurisdictionsNormalized: number;
  unmappedJurisdictions: string[];
}

// ============================================================================
// JURISDICTION MAPPING
// ============================================================================

/**
 * Maps common SEC filing jurisdiction names to standard country names
 * Handles US states, territories, and international variations
 */
const JURISDICTION_COUNTRY_MAP: Record<string, string> = {
  // US States (all map to United States)
  'Delaware': 'United States',
  'California': 'United States',
  'New York': 'United States',
  'Texas': 'United States',
  'Nevada': 'United States',
  'Florida': 'United States',
  'Illinois': 'United States',
  'Massachusetts': 'United States',
  'Virginia': 'United States',
  'Washington': 'United States',
  'Colorado': 'United States',
  'Georgia': 'United States',
  'Maryland': 'United States',
  'Michigan': 'United States',
  'New Jersey': 'United States',
  'North Carolina': 'United States',
  'Ohio': 'United States',
  'Pennsylvania': 'United States',
  'Arizona': 'United States',
  'Minnesota': 'United States',
  'Oregon': 'United States',
  'Tennessee': 'United States',
  'Wisconsin': 'United States',
  
  // US Territories
  'Puerto Rico': 'United States',
  'U.S. Virgin Islands': 'United States',
  'Guam': 'United States',
  
  // Common variations
  'United States of America': 'United States',
  'USA': 'United States',
  'U.S.': 'United States',
  'U.S.A.': 'United States',
  
  // UK variations
  'England': 'United Kingdom',
  'Scotland': 'United Kingdom',
  'Wales': 'United Kingdom',
  'Northern Ireland': 'United Kingdom',
  'England and Wales': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'UK': 'United Kingdom',
  
  // China variations
  'People\'s Republic of China': 'China',
  'PRC': 'China',
  'Hong Kong SAR': 'Hong Kong',
  'Macau SAR': 'Macau',
  
  // Tax havens (commonly used for subsidiaries)
  'Cayman Islands': 'Cayman Islands',
  'British Virgin Islands': 'British Virgin Islands',
  'Bermuda': 'Bermuda',
  'Luxembourg': 'Luxembourg',
  'Ireland': 'Ireland',
  'Netherlands': 'Netherlands',
  'Singapore': 'Singapore',
  'Switzerland': 'Switzerland',
  
  // Other common variations
  'Republic of Korea': 'South Korea',
  'Korea': 'South Korea',
  'Republic of China': 'Taiwan',
  'UAE': 'United Arab Emirates',
  'Czech Republic': 'Czech Republic',
  'Russian Federation': 'Russia'
};

/**
 * Normalize jurisdiction name to standard country name
 */
function normalizeJurisdiction(jurisdiction: string): string {
  const trimmed = jurisdiction.trim();
  
  // Check direct mapping first
  if (JURISDICTION_COUNTRY_MAP[trimmed]) {
    return JURISDICTION_COUNTRY_MAP[trimmed];
  }
  
  // Try case-insensitive match
  const lowerJurisdiction = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(JURISDICTION_COUNTRY_MAP)) {
    if (key.toLowerCase() === lowerJurisdiction) {
      return value;
    }
  }
  
  // Try country validator
  if (isActualCountry(trimmed)) {
    return normalizeCountryName(trimmed);
  }
  
  // Return as-is if no mapping found
  return trimmed;
}

// ============================================================================
// EXHIBIT 21 LOCATION & EXTRACTION
// ============================================================================

/**
 * Locate Exhibit 21 section in SEC filing HTML
 */
function locateExhibit21Section(html: string): string | null {
  const $ = cheerio.load(html);
  
  console.log(`[Exhibit 21 Parser] Searching for Exhibit 21 section...`);
  
  // Common patterns for Exhibit 21 headers
  const exhibit21Patterns = [
    /exhibit\s+21/i,
    /exhibit\s+21\.0/i,
    /exhibit\s+21\.1/i,
    /subsidiaries\s+of\s+the\s+registrant/i,
    /list\s+of\s+subsidiaries/i
  ];
  
  let exhibit21Html = '';
  let foundHeader = false;
  
  // Search through all text elements
  $('body').find('*').each((_, element) => {
    const text = $(element).text();
    
    // Check if this element contains an Exhibit 21 header
    if (!foundHeader) {
      for (const pattern of exhibit21Patterns) {
        if (pattern.test(text)) {
          console.log(`[Exhibit 21 Parser] ✅ Found Exhibit 21 header: "${text.substring(0, 100)}..."`);
          foundHeader = true;
          break;
        }
      }
    }
    
    // Once header is found, collect subsequent content
    if (foundHeader) {
      exhibit21Html += $(element).html() + '\n';
      
      // Stop if we hit the next exhibit or signature page
      if (/exhibit\s+22/i.test(text) || /exhibit\s+23/i.test(text) || /signatures/i.test(text)) {
        return false; // Break the loop
      }
    }
  });
  
  if (!foundHeader) {
    console.log(`[Exhibit 21 Parser] ⚠️ Exhibit 21 section not found`);
    return null;
  }
  
  console.log(`[Exhibit 21 Parser] ✅ Extracted Exhibit 21 section (${exhibit21Html.length} chars)`);
  return exhibit21Html;
}

/**
 * Extract subsidiary table from Exhibit 21 HTML
 */
function extractSubsidiaryTable(exhibit21Html: string): Subsidiary[] {
  const subsidiaries: Subsidiary[] = [];
  const $ = cheerio.load(exhibit21Html);
  
  console.log(`[Exhibit 21 Parser] Parsing subsidiary table...`);
  
  // Find all tables in the exhibit
  const tables = $('table');
  
  if (tables.length === 0) {
    console.log(`[Exhibit 21 Parser] ⚠️ No tables found in Exhibit 21 section`);
    return subsidiaries;
  }
  
  console.log(`[Exhibit 21 Parser] Found ${tables.length} table(s)`);
  
  // Process each table
  tables.each((tableIdx, table) => {
    const rows: string[][] = [];
    
    $(table).find('tr').each((_, row) => {
      const cells: string[] = [];
      $(row).find('td, th').each((_, cell) => {
        cells.push($(cell).text().trim());
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length < 2) {
      return; // Skip empty tables
    }
    
    console.log(`[Exhibit 21 Parser] Table ${tableIdx + 1}: ${rows.length} rows`);
    
    // Identify column indices
    const headerRow = rows[0];
    let nameColIdx = 0;
    let jurisdictionColIdx = 1;
    let ownershipColIdx = 2;
    
    headerRow.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('name') || headerLower.includes('subsidiary')) {
        nameColIdx = idx;
      }
      if (headerLower.includes('jurisdiction') || headerLower.includes('incorporation') || headerLower.includes('organization')) {
        jurisdictionColIdx = idx;
      }
      if (headerLower.includes('ownership') || headerLower.includes('percent') || headerLower.includes('%')) {
        ownershipColIdx = idx;
      }
    });
    
    console.log(`[Exhibit 21 Parser] Column mapping: Name=${nameColIdx}, Jurisdiction=${jurisdictionColIdx}, Ownership=${ownershipColIdx}`);
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length <= Math.max(nameColIdx, jurisdictionColIdx)) {
        continue; // Skip incomplete rows
      }
      
      const name = row[nameColIdx];
      const jurisdiction = row[jurisdictionColIdx];
      
      // Skip if name or jurisdiction is empty
      if (!name || !jurisdiction || name.length === 0 || jurisdiction.length === 0) {
        continue;
      }
      
      // Parse ownership percentage
      let ownershipPercentage = 100; // Default to 100% if not specified
      if (row.length > ownershipColIdx) {
        const ownershipStr = row[ownershipColIdx];
        const ownershipMatch = ownershipStr.match(/(\d+(?:\.\d+)?)/);
        if (ownershipMatch) {
          ownershipPercentage = parseFloat(ownershipMatch[1]);
        }
      }
      
      // Normalize jurisdiction to country
      const normalizedCountry = normalizeJurisdiction(jurisdiction);
      
      subsidiaries.push({
        name,
        jurisdiction,
        normalizedCountry,
        ownershipPercentage,
        isMaterial: ownershipPercentage >= 50, // Material if majority-owned
        source: 'Exhibit 21 - Subsidiaries of the Registrant'
      });
    }
  });
  
  console.log(`[Exhibit 21 Parser] ✅ Extracted ${subsidiaries.length} subsidiaries`);
  
  return subsidiaries;
}

// ============================================================================
// COUNTRY-LEVEL AGGREGATION
// ============================================================================

/**
 * Aggregate subsidiaries by country
 */
function aggregateByCountry(subsidiaries: Subsidiary[]): SubsidiaryExposure[] {
  const countryMap = new Map<string, Subsidiary[]>();
  
  // Group by country
  for (const subsidiary of subsidiaries) {
    const country = subsidiary.normalizedCountry;
    if (!countryMap.has(country)) {
      countryMap.set(country, []);
    }
    countryMap.get(country)!.push(subsidiary);
  }
  
  // Create exposure objects
  const exposures: SubsidiaryExposure[] = [];
  
  for (const [country, subs] of countryMap.entries()) {
    const totalOwnership = subs.reduce((sum, s) => sum + s.ownershipPercentage, 0);
    const hasMajorityOwned = subs.some(s => s.ownershipPercentage > 50);
    const hasWhollyOwned = subs.some(s => s.ownershipPercentage === 100);
    
    exposures.push({
      country,
      subsidiaryCount: subs.length,
      subsidiaries: subs,
      totalOwnership,
      averageOwnership: totalOwnership / subs.length,
      hasMajorityOwned,
      hasWhollyOwned
    });
  }
  
  // Sort by subsidiary count (descending)
  exposures.sort((a, b) => b.subsidiaryCount - a.subsidiaryCount);
  
  return exposures;
}

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

/**
 * Parse Exhibit 21 from SEC filing HTML
 */
export async function parseExhibit21(
  html: string,
  ticker: string,
  filingDate: string,
  fiscalYear: number
): Promise<Exhibit21Data> {
  
  console.log(`\n[Exhibit 21 Parser] ========================================`);
  console.log(`[Exhibit 21 Parser] Parsing Exhibit 21 for ${ticker}`);
  console.log(`[Exhibit 21 Parser] Filing Date: ${filingDate}`);
  console.log(`[Exhibit 21 Parser] ========================================\n`);
  
  const result: Exhibit21Data = {
    ticker,
    filingDate,
    fiscalYear,
    subsidiaries: [],
    totalSubsidiaries: 0,
    countryExposures: [],
    exhibit21Found: false,
    parsingSuccess: false,
    parsingErrors: [],
    jurisdictionsIdentified: 0,
    jurisdictionsNormalized: 0,
    unmappedJurisdictions: []
  };
  
  try {
    // Step 1: Locate Exhibit 21 section
    const exhibit21Html = locateExhibit21Section(html);
    
    if (!exhibit21Html) {
      result.parsingErrors.push('Exhibit 21 section not found in filing');
      console.log(`[Exhibit 21 Parser] ❌ Exhibit 21 not found`);
      return result;
    }
    
    result.exhibit21Found = true;
    
    // Step 2: Extract subsidiary table
    const subsidiaries = extractSubsidiaryTable(exhibit21Html);
    
    if (subsidiaries.length === 0) {
      result.parsingErrors.push('No subsidiaries extracted from Exhibit 21 table');
      console.log(`[Exhibit 21 Parser] ⚠️ No subsidiaries extracted`);
      return result;
    }
    
    result.subsidiaries = subsidiaries;
    result.totalSubsidiaries = subsidiaries.length;
    
    // Step 3: Aggregate by country
    result.countryExposures = aggregateByCountry(subsidiaries);
    
    // Step 4: Calculate quality metrics
    const uniqueJurisdictions = new Set(subsidiaries.map(s => s.jurisdiction));
    result.jurisdictionsIdentified = uniqueJurisdictions.size;
    
    const uniqueCountries = new Set(subsidiaries.map(s => s.normalizedCountry));
    result.jurisdictionsNormalized = uniqueCountries.size;
    
    // Identify unmapped jurisdictions
    for (const jurisdiction of uniqueJurisdictions) {
      const normalized = normalizeJurisdiction(jurisdiction);
      if (normalized === jurisdiction && !isActualCountry(jurisdiction)) {
        result.unmappedJurisdictions.push(jurisdiction);
      }
    }
    
    result.parsingSuccess = true;
    
    console.log(`\n[Exhibit 21 Parser] ========================================`);
    console.log(`[Exhibit 21 Parser] PARSING COMPLETE`);
    console.log(`[Exhibit 21 Parser] Total subsidiaries: ${result.totalSubsidiaries}`);
    console.log(`[Exhibit 21 Parser] Unique jurisdictions: ${result.jurisdictionsIdentified}`);
    console.log(`[Exhibit 21 Parser] Normalized to countries: ${result.jurisdictionsNormalized}`);
    console.log(`[Exhibit 21 Parser] Unmapped jurisdictions: ${result.unmappedJurisdictions.length}`);
    
    if (result.unmappedJurisdictions.length > 0) {
      console.log(`[Exhibit 21 Parser] ⚠️ Unmapped: ${result.unmappedJurisdictions.slice(0, 5).join(', ')}${result.unmappedJurisdictions.length > 5 ? '...' : ''}`);
    }
    
    console.log(`[Exhibit 21 Parser] Top 5 countries by subsidiary count:`);
    for (const exposure of result.countryExposures.slice(0, 5)) {
      console.log(`[Exhibit 21 Parser]   ${exposure.country}: ${exposure.subsidiaryCount} subsidiaries (avg ${exposure.averageOwnership.toFixed(1)}% ownership)`);
    }
    console.log(`[Exhibit 21 Parser] ========================================\n`);
    
  } catch (error) {
    result.parsingErrors.push(`Parsing error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[Exhibit 21 Parser] ❌ Parsing failed:`, error);
  }
  
  return result;
}

// ============================================================================
// INTEGRATION WITH CHANNEL EXPOSURE CALCULATION
// ============================================================================

/**
 * Convert Exhibit 21 data to channel exposure weights
 * 
 * METHODOLOGY:
 * - Operations channel: Subsidiary count indicates operational scale
 * - Assets channel: Subsidiaries typically own/lease facilities
 * - Revenue channel: Local subsidiaries often serve local markets
 * 
 * WEIGHTING:
 * - Base weight = subsidiary count / total subsidiaries
 * - Boost for wholly-owned (100%) subsidiaries
 * - Boost for multiple subsidiaries in same country
 */
export function exhibit21ToChannelWeights(
  exhibit21Data: Exhibit21Data,
  channel: 'operations' | 'assets' | 'revenue'
): Record<string, number> {
  
  const weights: Record<string, number> = {};
  
  if (!exhibit21Data.parsingSuccess || exhibit21Data.totalSubsidiaries === 0) {
    return weights;
  }
  
  console.log(`\n[Exhibit 21 Integration] Converting to ${channel} channel weights...`);
  
  for (const exposure of exhibit21Data.countryExposures) {
    let weight = 0;
    
    // Base weight: proportion of total subsidiaries
    const baseWeight = exposure.subsidiaryCount / exhibit21Data.totalSubsidiaries;
    
    // Channel-specific adjustments
    switch (channel) {
      case 'operations':
        // Operations: Higher weight for more subsidiaries
        weight = baseWeight;
        // Boost for wholly-owned subsidiaries
        if (exposure.hasWhollyOwned) {
          weight *= 1.2;
        }
        break;
        
      case 'assets':
        // Assets: Similar to operations, but slightly lower confidence
        weight = baseWeight * 0.9;
        break;
        
      case 'revenue':
        // Revenue: Lower confidence (subsidiary presence doesn't guarantee revenue)
        weight = baseWeight * 0.7;
        // Boost for multiple subsidiaries (indicates market importance)
        if (exposure.subsidiaryCount >= 3) {
          weight *= 1.3;
        }
        break;
    }
    
    weights[exposure.country] = weight;
  }
  
  // Normalize to sum to 1.0
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight > 0) {
    for (const country of Object.keys(weights)) {
      weights[country] = weights[country] / totalWeight;
    }
  }
  
  console.log(`[Exhibit 21 Integration] Generated weights for ${Object.keys(weights).length} countries`);
  console.log(`[Exhibit 21 Integration] Top 5:`);
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [country, weight] of sorted) {
    console.log(`[Exhibit 21 Integration]   ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  return weights;
}

// ============================================================================
// EXPORT
// ============================================================================

export const exhibit21Parser = {
  parseExhibit21,
  exhibit21ToChannelWeights,
  normalizeJurisdiction
};