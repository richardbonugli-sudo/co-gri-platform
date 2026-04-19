/**
 * US Trade Data Parser
 * 
 * Parses US import/export data from government sources to extract
 * objective evidence of supply chain and revenue channel exposures.
 * 
 * STRATEGIC VALUE:
 * - Supply Chain channel: Import origins = supplier countries (very high confidence)
 * - Revenue channel: Export destinations = customer countries (high confidence)
 * - Objective government data (no self-reporting bias)
 * - Granular product-level data via HS codes
 * 
 * DATA SOURCES:
 * 1. USA Trade Online (US Census Bureau) - https://usatrade.census.gov/
 * 2. PIERS (Port Import Export Reporting Service)
 * 3. US Customs and Border Protection data
 * 4. Bill of Lading databases
 * 
 * DATA STRUCTURE:
 * - HS Code (Harmonized System): 6-10 digit product classification
 * - Origin/Destination country
 * - Value (USD)
 * - Quantity
 * - Company name (importer/exporter of record)
 * - Port of entry/exit
 * - Date
 * 
 * METHODOLOGY:
 * 1. Match company name to ticker (fuzzy matching required)
 * 2. Aggregate imports by origin country (supply chain)
 * 3. Aggregate exports by destination country (revenue)
 * 4. Filter by relevant HS codes for company's sector
 * 5. Calculate exposure weights based on trade values
 */

import { normalizeCountryName, isActualCountry } from '../countryValidator';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TradeRecord {
  ticker: string;
  companyName: string;
  
  // Trade details
  tradeType: 'import' | 'export';
  hsCode: string;
  hsDescription: string;
  
  // Geography
  country: string; // Origin for imports, destination for exports
  portOfEntry?: string;
  
  // Value
  valueUSD: number;
  quantity?: number;
  unit?: string;
  
  // Timing
  year: number;
  month: number;
  
  // Metadata
  dataSource: 'usa_trade_online' | 'piers' | 'customs' | 'bill_of_lading';
  confidence: 'high' | 'medium' | 'low';
}

export interface TradeExposure {
  country: string;
  
  // Import data (supply chain)
  importValueUSD: number;
  importCount: number;
  topImportHSCodes: { code: string; description: string; value: number }[];
  
  // Export data (revenue)
  exportValueUSD: number;
  exportCount: number;
  topExportHSCodes: { code: string; description: string; value: number }[];
  
  // Combined
  totalTradeValueUSD: number;
  tradeBalance: number; // exports - imports
  
  confidence: 'high' | 'medium' | 'low';
}

export interface USTradeData {
  ticker: string;
  companyName: string;
  year: number;
  
  // Raw trade records
  imports: TradeRecord[];
  exports: TradeRecord[];
  
  // Country-level aggregation
  countryExposures: TradeExposure[];
  
  // Summary statistics
  totalImportValueUSD: number;
  totalExportValueUSD: number;
  totalTradeValueUSD: number;
  
  // Top trading partners
  topImportOrigins: { country: string; value: number; percentage: number }[];
  topExportDestinations: { country: string; value: number; percentage: number }[];
  
  // Metadata
  dataFound: boolean;
  parsingSuccess: boolean;
  parsingErrors: string[];
  
  // Quality metrics
  countriesIdentified: number;
  recordsProcessed: number;
  dataCompleteness: number; // 0-1 score
}

// ============================================================================
// HS CODE SECTOR MAPPING
// ============================================================================

/**
 * Map sectors to relevant HS code ranges
 * HS Code structure:
 * - Chapter (2 digits): Broad category
 * - Heading (4 digits): Product group
 * - Subheading (6 digits): Specific product
 * - National (8-10 digits): Country-specific detail
 */
const SECTOR_HS_CODES: Record<string, string[]> = {
  'Technology': [
    '84', // Nuclear reactors, boilers, machinery, computers
    '85', // Electrical machinery, equipment, telecommunications
    '90', // Optical, photographic, measuring, medical instruments
    '8471', // Automatic data processing machines (computers)
    '8517', // Telephone sets, communication apparatus
    '8542', // Electronic integrated circuits
  ],
  
  'Manufacturing': [
    '84', // Machinery
    '85', // Electrical equipment
    '86', // Railway locomotives
    '87', // Vehicles other than railway
    '88', // Aircraft, spacecraft
    '89', // Ships, boats
  ],
  
  'Consumer Goods': [
    '61', // Knitted apparel
    '62', // Woven apparel
    '63', // Textile articles
    '64', // Footwear
    '94', // Furniture, bedding, lamps
    '95', // Toys, games, sports equipment
  ],
  
  'Pharmaceuticals': [
    '30', // Pharmaceutical products
    '2936', // Provitamins and vitamins
    '3001', // Glands and organs for therapeutic use
    '3002', // Human blood, vaccines
    '3003', // Medicaments (unmixed)
    '3004', // Medicaments (mixed or unmixed)
  ],
  
  'Chemicals': [
    '28', // Inorganic chemicals
    '29', // Organic chemicals
    '32', // Tanning or dyeing extracts
    '33', // Essential oils, perfumes
    '34', // Soap, lubricants, waxes
    '38', // Miscellaneous chemical products
  ],
  
  'Energy': [
    '27', // Mineral fuels, oils, petroleum products
    '2709', // Petroleum oils, crude
    '2710', // Petroleum oils, refined
    '2711', // Petroleum gases
  ],
  
  'Food & Beverage': [
    '02', // Meat
    '04', // Dairy, eggs, honey
    '07', // Vegetables
    '08', // Fruit, nuts
    '09', // Coffee, tea, spices
    '10', // Cereals
    '16', // Meat, fish preparations
    '19', // Cereals, flour, starch preparations
    '20', // Vegetable, fruit preparations
    '21', // Miscellaneous edible preparations
    '22', // Beverages, spirits, vinegar
  ],
  
  'Automotive': [
    '87', // Vehicles other than railway
    '8701', // Tractors
    '8702', // Motor vehicles for transport of persons
    '8703', // Motor cars
    '8704', // Motor vehicles for transport of goods
    '8708', // Parts and accessories of motor vehicles
  ],
  
  'Aerospace': [
    '88', // Aircraft, spacecraft
    '8801', // Balloons, airships
    '8802', // Aircraft, helicopters
    '8803', // Parts of aircraft
  ],
  
  'Textiles': [
    '50', // Silk
    '51', // Wool
    '52', // Cotton
    '53', // Other vegetable textile fibers
    '54', // Man-made filaments
    '55', // Man-made staple fibers
    '56', // Wadding, felt, nonwovens
    '57', // Carpets
    '58', // Special woven fabrics
    '59', // Impregnated, coated textiles
    '60', // Knitted or crocheted fabrics
  ]
};

/**
 * Get relevant HS codes for a sector
 */
function getRelevantHSCodes(sector: string): string[] {
  return SECTOR_HS_CODES[sector] || [];
}

/**
 * Check if HS code matches sector
 */
function hsCodeMatchesSector(hsCode: string, sector: string): boolean {
  const relevantCodes = getRelevantHSCodes(sector);
  
  for (const code of relevantCodes) {
    if (hsCode.startsWith(code)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// COMPANY NAME MATCHING
// ============================================================================

/**
 * Fuzzy match company name to trade records
 * Trade records use "importer/exporter of record" which may differ from official name
 * 
 * Examples:
 * - "APPLE INC" vs "Apple Inc."
 * - "MICROSOFT CORPORATION" vs "Microsoft Corp"
 * - "AMAZON.COM INC" vs "Amazon.com, Inc."
 */
function fuzzyMatchCompanyName(
  officialName: string,
  tradeName: string,
  threshold: number = 0.8
): boolean {
  
  // Normalize both names
  const normalize = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[.,\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(inc|corp|corporation|ltd|limited|llc|co)\b/g, '')
      .trim();
  };
  
  const normalizedOfficial = normalize(officialName);
  const normalizedTrade = normalize(tradeName);
  
  // Exact match after normalization
  if (normalizedOfficial === normalizedTrade) {
    return true;
  }
  
  // Check if one contains the other
  if (normalizedOfficial.includes(normalizedTrade) || normalizedTrade.includes(normalizedOfficial)) {
    return true;
  }
  
  // Calculate Levenshtein distance ratio
  const distance = levenshteinDistance(normalizedOfficial, normalizedTrade);
  const maxLength = Math.max(normalizedOfficial.length, normalizedTrade.length);
  const similarity = 1 - (distance / maxLength);
  
  return similarity >= threshold;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// ============================================================================
// DATA FETCHING (PLACEHOLDER)
// ============================================================================

/**
 * Fetch trade data from USA Trade Online
 * 
 * API Documentation: https://usatrade.census.gov/data/
 * 
 * Query parameters:
 * - Company name
 * - HS code
 * - Year/month range
 * - Import/export
 * - Country
 * 
 * NOTE: Requires API key and subscription
 */
async function fetchUSATradeOnline(
  companyName: string,
  year: number,
  sector: string
): Promise<TradeRecord[]> {
  
  console.log(`[US Trade Parser] Fetching USA Trade Online data for ${companyName} (${year})...`);
  
  // TODO: Implement actual API call
  // For now, return empty array (placeholder)
  
  console.log(`[US Trade Parser] ⚠️ USA Trade Online API not yet implemented`);
  console.log(`[US Trade Parser] This would typically:`);
  console.log(`[US Trade Parser]   1. Query USA Trade Online API with company name`);
  console.log(`[US Trade Parser]   2. Filter by relevant HS codes for sector`);
  console.log(`[US Trade Parser]   3. Aggregate by origin/destination country`);
  console.log(`[US Trade Parser]   4. Return structured trade records`);
  
  return [];
}

/**
 * Fetch trade data from PIERS database
 * 
 * PIERS provides detailed bill of lading data
 * More granular than Census data but requires paid subscription
 */
async function fetchPIERSData(
  companyName: string,
  year: number
): Promise<TradeRecord[]> {
  
  console.log(`[US Trade Parser] Fetching PIERS data for ${companyName} (${year})...`);
  
  // TODO: Implement PIERS API integration
  
  console.log(`[US Trade Parser] ⚠️ PIERS API not yet implemented`);
  
  return [];
}

// ============================================================================
// AGGREGATION & ANALYSIS
// ============================================================================

/**
 * Aggregate trade records by country
 */
function aggregateByCountry(records: TradeRecord[]): TradeExposure[] {
  
  const countryMap = new Map<string, {
    imports: TradeRecord[];
    exports: TradeRecord[];
  }>();
  
  // Group by country
  for (const record of records) {
    if (!countryMap.has(record.country)) {
      countryMap.set(record.country, { imports: [], exports: [] });
    }
    
    const countryData = countryMap.get(record.country)!;
    if (record.tradeType === 'import') {
      countryData.imports.push(record);
    } else {
      countryData.exports.push(record);
    }
  }
  
  // Create exposure objects
  const exposures: TradeExposure[] = [];
  
  for (const [country, data] of countryMap.entries()) {
    const importValue = data.imports.reduce((sum, r) => sum + r.valueUSD, 0);
    const exportValue = data.exports.reduce((sum, r) => sum + r.valueUSD, 0);
    
    // Top HS codes for imports
    const importHSMap = new Map<string, { description: string; value: number }>();
    for (const record of data.imports) {
      const existing = importHSMap.get(record.hsCode);
      if (existing) {
        existing.value += record.valueUSD;
      } else {
        importHSMap.set(record.hsCode, {
          description: record.hsDescription,
          value: record.valueUSD
        });
      }
    }
    
    const topImportHSCodes = Array.from(importHSMap.entries())
      .map(([code, data]) => ({ code, description: data.description, value: data.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Top HS codes for exports
    const exportHSMap = new Map<string, { description: string; value: number }>();
    for (const record of data.exports) {
      const existing = exportHSMap.get(record.hsCode);
      if (existing) {
        existing.value += record.valueUSD;
      } else {
        exportHSMap.set(record.hsCode, {
          description: record.hsDescription,
          value: record.valueUSD
        });
      }
    }
    
    const topExportHSCodes = Array.from(exportHSMap.entries())
      .map(([code, data]) => ({ code, description: data.description, value: data.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    exposures.push({
      country,
      importValueUSD: importValue,
      importCount: data.imports.length,
      topImportHSCodes,
      exportValueUSD: exportValue,
      exportCount: data.exports.length,
      topExportHSCodes,
      totalTradeValueUSD: importValue + exportValue,
      tradeBalance: exportValue - importValue,
      confidence: 'high' // Government data = high confidence
    });
  }
  
  // Sort by total trade value
  exposures.sort((a, b) => b.totalTradeValueUSD - a.totalTradeValueUSD);
  
  return exposures;
}

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

/**
 * Parse US trade data for a company
 */
export async function parseUSTradeData(
  ticker: string,
  companyName: string,
  year: number,
  sector: string
): Promise<USTradeData> {
  
  console.log(`\n[US Trade Parser] ========================================`);
  console.log(`[US Trade Parser] Parsing US trade data for ${ticker}`);
  console.log(`[US Trade Parser] Company: ${companyName}`);
  console.log(`[US Trade Parser] Year: ${year}`);
  console.log(`[US Trade Parser] Sector: ${sector}`);
  console.log(`[US Trade Parser] ========================================\n`);
  
  const result: USTradeData = {
    ticker,
    companyName,
    year,
    imports: [],
    exports: [],
    countryExposures: [],
    totalImportValueUSD: 0,
    totalExportValueUSD: 0,
    totalTradeValueUSD: 0,
    topImportOrigins: [],
    topExportDestinations: [],
    dataFound: false,
    parsingSuccess: false,
    parsingErrors: [],
    countriesIdentified: 0,
    recordsProcessed: 0,
    dataCompleteness: 0
  };
  
  try {
    // Fetch trade data from multiple sources
    console.log(`[US Trade Parser] Step 1: Fetching trade data...`);
    
    const usaTradeRecords = await fetchUSATradeOnline(companyName, year, sector);
    const piersRecords = await fetchPIERSData(companyName, year);
    
    const allRecords = [...usaTradeRecords, ...piersRecords];
    
    if (allRecords.length === 0) {
      result.parsingErrors.push('No trade records found');
      console.log(`[US Trade Parser] ⚠️ No trade records found`);
      return result;
    }
    
    result.dataFound = true;
    result.recordsProcessed = allRecords.length;
    
    // Separate imports and exports
    result.imports = allRecords.filter(r => r.tradeType === 'import');
    result.exports = allRecords.filter(r => r.tradeType === 'export');
    
    console.log(`[US Trade Parser] ✅ Found ${result.imports.length} import records, ${result.exports.length} export records`);
    
    // Aggregate by country
    console.log(`[US Trade Parser] Step 2: Aggregating by country...`);
    result.countryExposures = aggregateByCountry(allRecords);
    
    // Calculate summary statistics
    result.totalImportValueUSD = result.imports.reduce((sum, r) => sum + r.valueUSD, 0);
    result.totalExportValueUSD = result.exports.reduce((sum, r) => sum + r.valueUSD, 0);
    result.totalTradeValueUSD = result.totalImportValueUSD + result.totalExportValueUSD;
    
    // Top trading partners
    result.topImportOrigins = result.countryExposures
      .filter(e => e.importValueUSD > 0)
      .map(e => ({
        country: e.country,
        value: e.importValueUSD,
        percentage: (e.importValueUSD / result.totalImportValueUSD) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    result.topExportDestinations = result.countryExposures
      .filter(e => e.exportValueUSD > 0)
      .map(e => ({
        country: e.country,
        value: e.exportValueUSD,
        percentage: (e.exportValueUSD / result.totalExportValueUSD) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    result.countriesIdentified = result.countryExposures.length;
    
    // Data completeness (based on number of records and countries)
    result.dataCompleteness = Math.min(
      (result.recordsProcessed / 100) * 0.5 + // More records = higher completeness
      (result.countriesIdentified / 20) * 0.5, // More countries = higher completeness
      1.0
    );
    
    result.parsingSuccess = true;
    
    console.log(`\n[US Trade Parser] ========================================`);
    console.log(`[US Trade Parser] PARSING COMPLETE`);
    console.log(`[US Trade Parser] Total trade value: $${(result.totalTradeValueUSD / 1e6).toFixed(2)}M`);
    console.log(`[US Trade Parser] Import value: $${(result.totalImportValueUSD / 1e6).toFixed(2)}M`);
    console.log(`[US Trade Parser] Export value: $${(result.totalExportValueUSD / 1e6).toFixed(2)}M`);
    console.log(`[US Trade Parser] Countries: ${result.countriesIdentified}`);
    console.log(`[US Trade Parser] Records processed: ${result.recordsProcessed}`);
    console.log(`[US Trade Parser] Data completeness: ${(result.dataCompleteness * 100).toFixed(1)}%`);
    console.log(`[US Trade Parser] Top 3 import origins:`);
    for (const origin of result.topImportOrigins.slice(0, 3)) {
      console.log(`[US Trade Parser]   ${origin.country}: $${(origin.value / 1e6).toFixed(2)}M (${origin.percentage.toFixed(1)}%)`);
    }
    console.log(`[US Trade Parser] Top 3 export destinations:`);
    for (const dest of result.topExportDestinations.slice(0, 3)) {
      console.log(`[US Trade Parser]   ${dest.country}: $${(dest.value / 1e6).toFixed(2)}M (${dest.percentage.toFixed(1)}%)`);
    }
    console.log(`[US Trade Parser] ========================================\n`);
    
  } catch (error) {
    result.parsingErrors.push(`Parsing error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[US Trade Parser] ❌ Parsing failed:`, error);
  }
  
  return result;
}

// ============================================================================
// INTEGRATION WITH CHANNEL EXPOSURE CALCULATION
// ============================================================================

/**
 * Convert trade data to channel exposure weights
 */
export function tradeDataToChannelWeights(
  tradeData: USTradeData,
  channel: 'supply' | 'revenue'
): Record<string, number> {
  
  const weights: Record<string, number> = {};
  
  console.log(`\n[US Trade Integration] Converting to ${channel} channel weights...`);
  
  for (const exposure of tradeData.countryExposures) {
    let weight = 0;
    
    if (channel === 'supply') {
      // Supply chain: Use import values
      weight = exposure.importValueUSD;
    } else if (channel === 'revenue') {
      // Revenue: Use export values
      weight = exposure.exportValueUSD;
    }
    
    if (weight > 0) {
      weights[exposure.country] = weight;
    }
  }
  
  // Normalize to sum to 1.0
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight > 0) {
    for (const country of Object.keys(weights)) {
      weights[country] = weights[country] / totalWeight;
    }
  }
  
  console.log(`[US Trade Integration] Generated weights for ${Object.keys(weights).length} countries`);
  console.log(`[US Trade Integration] Top 5:`);
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [country, weight] of sorted) {
    console.log(`[US Trade Integration]   ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  return weights;
}

// ============================================================================
// EXPORT
// ============================================================================

export const usTradeDataParser = {
  parseUSTradeData,
  tradeDataToChannelWeights,
  getRelevantHSCodes,
  hsCodeMatchesSector,
  fuzzyMatchCompanyName
};