import * as fs from 'fs';

// Read the existing manual entries
const existingFile = fs.readFileSync('src/data/companySpecificExposures.ts', 'utf-8');

// Read the automated entries
const automatedFile = fs.readFileSync('merged_exposures.ts', 'utf-8');

// Extract the automated entries
const automatedMatch = automatedFile.match(/export const AUTOMATED_COMPANY_EXPOSURES[^{]*\{([\s\S]+)\};/);
if (!automatedMatch) {
  console.error('Failed to extract automated entries');
  process.exit(1);
}

const automatedEntries = automatedMatch[1];

// Extract the existing manual entries (TSLA, J36.SI, etc.)
const existingMatch = existingFile.match(/export const COMPANY_SPECIFIC_EXPOSURES[^{]*\{([\s\S]+)\};/);
if (!existingMatch) {
  console.error('Failed to extract existing entries');
  process.exit(1);
}

const existingEntries = existingMatch[1];

// Count entries
const existingCount = (existingEntries.match(/'[A-Z.]+'\s*:/g) || []).length;
const automatedCount = (automatedEntries.match(/'[A-Z.]+'\s*:/g) || []).length;

console.log(`Existing manual entries: ${existingCount}`);
console.log(`Automated entries to add: ${automatedCount}`);
console.log(`Total after integration: ${existingCount + automatedCount}`);

// Create the integrated file
const integratedContent = `/**
 * Company-Specific Geographic Exposures
 * 
 * This file contains geographic exposure data for specific companies.
 * 
 * Data Sources:
 * - Manual entries (7): Verified from annual reports and investor relations
 * - Automated entries (${automatedCount}): Extracted from SEC 10-K filings via batch processing
 * 
 * Last updated: ${new Date().toISOString().split('T')[0]}
 */

export interface CompanyExposure {
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: {
    country: string;
    percentage: number;
    description?: string;
  }[];
  dataSource: string;
  lastUpdated: string;
}

export const COMPANY_SPECIFIC_EXPOSURES: Record<string, CompanyExposure> = {
  // ========================================
  // MANUAL ENTRIES (Verified from Annual Reports)
  // ========================================
${existingEntries},

  // ========================================
  // AUTOMATED ENTRIES (Extracted from SEC 10-K Filings)
  // Total: ${automatedCount} companies from S&P 100
  // ========================================
${automatedEntries}
};

/**
 * Get company-specific exposure data if available
 */
export function getCompanySpecificExposure(ticker: string): CompanyExposure | null {
  const upperTicker = ticker.toUpperCase();
  return COMPANY_SPECIFIC_EXPOSURES[upperTicker] || null;
}

/**
 * Check if a company has specific exposure data
 */
export function hasCompanySpecificExposure(ticker: string): boolean {
  return ticker.toUpperCase() in COMPANY_SPECIFIC_EXPOSURES;
}

/**
 * Get all tickers with company-specific exposure data
 */
export function getCompaniesWithSpecificExposures(): string[] {
  return Object.keys(COMPANY_SPECIFIC_EXPOSURES);
}

/**
 * Get statistics about the exposure database
 */
export function getExposureStats() {
  const allTickers = Object.keys(COMPANY_SPECIFIC_EXPOSURES);
  const manualEntries = ['AAPL', 'TSLA', 'J36.SI', 'J37.SI', 'C07.SI', 'H78.SI', 'M44U.SI'];
  const automatedEntries = allTickers.filter(t => !manualEntries.includes(t));
  
  return {
    total: allTickers.length,
    manual: manualEntries.length,
    automated: automatedEntries.length,
    lastUpdated: '${new Date().toISOString().split('T')[0]}'
  };
}
`;

// Write the integrated file
fs.writeFileSync('src/data/companySpecificExposures.ts', integratedContent);

console.log('\n✅ Successfully integrated automated data into companySpecificExposures.ts');
console.log(`\nFinal database contains ${existingCount + automatedCount} companies:`);
console.log(`  - ${existingCount} manual entries (verified from annual reports)`);
console.log(`  - ${automatedCount} automated entries (extracted from SEC 10-K filings)`);
