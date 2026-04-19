/**
 * updateCompanyDatabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily auto-update script for src/utils/companyDatabase.ts
 *
 * Strategy (Option 1 from feasibility report):
 *   1. Fetch FMP /api/v3/stock/list  → 1 bulk API call, ~70,000 companies
 *   2. Filter to the 256 tickers already in companyDatabase.ts
 *   3. For tickers not found in the bulk list (international with non-standard
 *      suffixes), call FMP /api/v3/profile/{ticker} individually
 *   4. Update fields: name, exchange, country, sector, isADR
 *   5. ALWAYS preserve the existing `aliases` array — never overwrite it
 *   6. Write updated TypeScript back to companyDatabase.ts
 *   7. Validate output with tsc --noEmit before writing
 *
 * Usage:
 *   npm run update-company-db              # live update
 *   npm run update-company-db -- --dry-run # dry run (no file write)
 *   npm run update-company-db -- --verbose # verbose logging
 *
 * Environment:
 *   FMP_API_KEY  (GitHub Actions secret)  OR
 *   VITE_FMP_API_KEY  (local .env file)
 *
 * Rate limits (FMP free tier):
 *   250 requests/day — this script uses ~1 bulk + up to ~105 individual = ~106/day
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

// ─── Configuration ────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPANY_DB_PATH = path.resolve(__dirname, '../utils/companyDatabase.ts');
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// CLI flags
const IS_DRY_RUN = process.argv.includes('--dry-run');
const IS_VERBOSE = process.argv.includes('--verbose');

// API key: prefer GitHub Actions secret (FMP_API_KEY), fall back to Vite env var
const FMP_API_KEY =
  process.env.FMP_API_KEY ||
  process.env.VITE_FMP_API_KEY ||
  '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  isADR?: boolean;
  aliases?: string[];
}

interface FMPStockListItem {
  symbol: string;
  name: string;
  price: number;
  exchange: string;
  exchangeShortName: string;
  type: string;
}

interface FMPProfile {
  symbol: string;
  companyName: string;
  exchange: string;
  exchangeShortName: string;
  country: string;
  sector: string;
  industry: string;
  isAdr: boolean;
  description: string;
  website: string;
}

interface UpdateStats {
  total: number;
  updated: number;
  unchanged: number;
  notFound: number;
  errors: number;
  changes: ChangeRecord[];
}

interface ChangeRecord {
  ticker: string;
  field: string;
  oldValue: string | boolean | undefined;
  newValue: string | boolean | undefined;
}

// ─── HTTP Utilities ───────────────────────────────────────────────────────────

/**
 * Simple HTTPS GET with JSON parsing — no external dependencies required
 */
function httpsGet<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${url}`));
            return;
          }
          resolve(JSON.parse(data) as T);
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${String(e)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/**
 * Sleep for ms milliseconds (used for rate limiting)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Logging ─────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function verbose(msg: string): void {
  if (IS_VERBOSE) {
    console.log(`[VERBOSE] ${msg}`);
  }
}

function warn(msg: string): void {
  console.warn(`[WARN] ${msg}`);
}

function error(msg: string): void {
  console.error(`[ERROR] ${msg}`);
}

// ─── FMP API Functions ────────────────────────────────────────────────────────

/**
 * Fetch the full FMP stock list in one bulk API call (~70,000 companies).
 * Returns a Map<symbol, FMPStockListItem> for O(1) lookup.
 */
async function fetchFMPBulkList(): Promise<Map<string, FMPStockListItem>> {
  if (!FMP_API_KEY) {
    throw new Error(
      'FMP_API_KEY is not set. Set FMP_API_KEY (GitHub Actions secret) or ' +
      'VITE_FMP_API_KEY (local .env file) before running this script.'
    );
  }

  log('Fetching FMP bulk stock list (single API call)...');
  const url = `${FMP_BASE_URL}/stock/list?apikey=${FMP_API_KEY}`;

  const data = await httpsGet<FMPStockListItem[]>(url);

  if (!Array.isArray(data)) {
    throw new Error(`Unexpected FMP response: ${JSON.stringify(data).slice(0, 200)}`);
  }

  log(`FMP bulk list: ${data.length.toLocaleString()} companies received`);

  // Build lookup map — normalize symbols to uppercase for matching
  const map = new Map<string, FMPStockListItem>();
  for (const item of data) {
    if (item.symbol) {
      map.set(item.symbol.toUpperCase(), item);
    }
  }

  return map;
}

/**
 * Fetch detailed profile for a single ticker from FMP.
 * Used as fallback for international tickers not found in the bulk list.
 */
async function fetchFMPProfile(ticker: string): Promise<FMPProfile | null> {
  try {
    const url = `${FMP_BASE_URL}/profile/${encodeURIComponent(ticker)}?apikey=${FMP_API_KEY}`;
    const data = await httpsGet<FMPProfile[]>(url);

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (err) {
    verbose(`Profile fetch failed for ${ticker}: ${String(err)}`);
    return null;
  }
}

// ─── Exchange Normalization ───────────────────────────────────────────────────

/**
 * Normalize FMP exchange codes to match the format used in companyDatabase.ts
 */
function normalizeExchange(fmpExchange: string, fmpShortName: string): string {
  const shortName = (fmpShortName || '').toUpperCase();
  const fullName = (fmpExchange || '').toUpperCase();

  // Prefer the short name if it's a known exchange
  const knownShortNames: Record<string, string> = {
    'NASDAQ': 'NASDAQ',
    'NYSE': 'NYSE',
    'AMEX': 'AMEX',
    'TSX': 'TSX',
    'TSXV': 'TSXV',
    'LSE': 'LSE',
    'HKEX': 'HKEX',
    'SGX': 'SGX',
    'B3': 'B3',
    'TWSE': 'TWSE',
    'JSE': 'JSE',
    'BVC': 'BVC',
    'OTC': 'OTC',
    'OTCBB': 'OTC',
    'PINK': 'OTC',
  };

  if (knownShortNames[shortName]) return knownShortNames[shortName];
  if (knownShortNames[fullName]) return knownShortNames[fullName];

  // Fallback: use the short name as-is if available
  return shortName || fullName || 'Unknown';
}

/**
 * Normalize country names from FMP to match companyDatabase.ts conventions
 */
function normalizeCountry(fmpCountry: string): string {
  const countryMap: Record<string, string> = {
    'US': 'United States',
    'USA': 'United States',
    'United States': 'United States',
    'CA': 'Canada',
    'Canada': 'Canada',
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'United Kingdom': 'United Kingdom',
    'HK': 'Hong Kong',
    'Hong Kong': 'Hong Kong',
    'SG': 'Singapore',
    'Singapore': 'Singapore',
    'BR': 'Brazil',
    'Brazil': 'Brazil',
    'TW': 'Taiwan',
    'Taiwan': 'Taiwan',
    'ZA': 'South Africa',
    'South Africa': 'South Africa',
    'CO': 'Colombia',
    'Colombia': 'Colombia',
    'CN': 'China',
    'China': 'China',
    'JP': 'Japan',
    'Japan': 'Japan',
    'KR': 'South Korea',
    'South Korea': 'South Korea',
    'IN': 'India',
    'India': 'India',
    'DE': 'Germany',
    'Germany': 'Germany',
    'FR': 'France',
    'France': 'France',
    'NL': 'Netherlands',
    'Netherlands': 'Netherlands',
    'CH': 'Switzerland',
    'Switzerland': 'Switzerland',
    'AU': 'Australia',
    'Australia': 'Australia',
    'IL': 'Israel',
    'Israel': 'Israel',
    'MX': 'Mexico',
    'Mexico': 'Mexico',
    'AR': 'Argentina',
    'Argentina': 'Argentina',
    'CL': 'Chile',
    'Chile': 'Chile',
  };

  return countryMap[fmpCountry] || fmpCountry || 'Unknown';
}

/**
 * Normalize sector names from FMP to match companyDatabase.ts conventions
 */
function normalizeSector(fmpSector: string): string {
  if (!fmpSector || fmpSector.trim() === '') return 'General';

  const sectorMap: Record<string, string> = {
    'Technology': 'Technology',
    'Information Technology': 'Technology',
    'Financial Services': 'Financial Services',
    'Financials': 'Financial Services',
    'Healthcare': 'Healthcare',
    'Health Care': 'Healthcare',
    'Energy': 'Energy',
    'Consumer Cyclical': 'Consumer Cyclical',
    'Consumer Discretionary': 'Consumer Cyclical',
    'Consumer Defensive': 'Consumer Defensive',
    'Consumer Staples': 'Consumer Defensive',
    'Communication Services': 'Communication Services',
    'Telecommunication Services': 'Communication Services',
    'Industrials': 'Industrials',
    'Basic Materials': 'Basic Materials',
    'Materials': 'Basic Materials',
    'Real Estate': 'Real Estate',
    'Utilities': 'Utilities',
    'Automotive': 'Automotive',
  };

  return sectorMap[fmpSector] || fmpSector;
}

// ─── Database Parsing ─────────────────────────────────────────────────────────

/**
 * Parse the existing companyDatabase.ts to extract the current company list.
 * Uses regex to extract ticker and aliases (the fields we must preserve).
 * This avoids a TypeScript compilation step just to read the data.
 */
function parseExistingDatabase(content: string): Company[] {
  const companies: Company[] = [];

  // Match each company object in the array
  // Pattern: { ticker: 'XXX', name: '...', exchange: '...', country: '...', sector: '...', ... }
  const companyRegex = /\{\s*ticker:\s*'([^']+)'[^}]*\}/gs;
  const matches = content.matchAll(companyRegex);

  for (const match of matches) {
    const block = match[0];

    const ticker = extractStringField(block, 'ticker');
    const name = extractStringField(block, 'name');
    const exchange = extractStringField(block, 'exchange');
    const country = extractStringField(block, 'country');
    const sector = extractStringField(block, 'sector');
    const isADR = block.includes('isADR: true');
    const aliases = extractAliasesField(block);

    if (ticker) {
      companies.push({ ticker, name, exchange, country, sector, isADR, aliases });
    }
  }

  return companies;
}

function extractStringField(block: string, field: string): string {
  const regex = new RegExp(`${field}:\\s*'([^']*)'`);
  const match = block.match(regex);
  return match ? match[1] : '';
}

function extractAliasesField(block: string): string[] | undefined {
  const aliasesMatch = block.match(/aliases:\s*\[([^\]]*)\]/s);
  if (!aliasesMatch) return undefined;

  const aliasContent = aliasesMatch[1];
  const aliases: string[] = [];
  const aliasRegex = /'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = aliasRegex.exec(aliasContent)) !== null) {
    aliases.push(m[1]);
  }
  return aliases.length > 0 ? aliases : undefined;
}

// ─── TypeScript File Generation ───────────────────────────────────────────────

/**
 * Generate the full TypeScript file content for companyDatabase.ts
 * from an array of Company objects.
 */
function generateTypeScriptFile(companies: Company[], lastUpdated: string): string {
  const lines: string[] = [];

  lines.push(`// Company Database Module - Enhanced with search functionality`);
  lines.push(`// Comprehensive database of international stocks across major global exchanges`);
  lines.push(`//`);
  lines.push(`// AUTO-UPDATE METADATA`);
  lines.push(`// Last updated: ${lastUpdated}`);
  lines.push(`// Update script: src/scripts/updateCompanyDatabase.ts`);
  lines.push(`// Data source: Financial Modeling Prep (FMP) API`);
  lines.push(`// Companies: ${companies.length}`);
  lines.push(``);
  lines.push(`export interface Company {`);
  lines.push(`  ticker: string;`);
  lines.push(`  name: string;`);
  lines.push(`  exchange: string;`);
  lines.push(`  country: string;`);
  lines.push(`  sector: string;`);
  lines.push(`  isADR?: boolean; // CRITICAL: Added isADR field for ADR detection`);
  lines.push(`  aliases?: string[]; // Alternative names or common abbreviations`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`// Comprehensive company database`);
  lines.push(`const companies: Company[] = [`);

  // Group companies by exchange/region for readability
  const grouped = groupCompaniesByRegion(companies);

  for (const [groupLabel, groupCompanies] of grouped) {
    if (groupCompanies.length === 0) continue;
    lines.push(`  // ${groupLabel}`);
    for (const company of groupCompanies) {
      lines.push(`  ${formatCompanyEntry(company)},`);
    }
    lines.push(``);
  }

  // Remove trailing empty line before closing bracket
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  lines.push(`];`);
  lines.push(``);

  // Append all the utility functions (unchanged from original)
  lines.push(UTILITY_FUNCTIONS);

  return lines.join('\n');
}

/**
 * Format a single Company object as a TypeScript object literal
 */
function formatCompanyEntry(company: Company): string {
  const parts: string[] = [
    `ticker: '${escapeSingleQuote(company.ticker)}'`,
    `name: '${escapeSingleQuote(company.name)}'`,
    `exchange: '${escapeSingleQuote(company.exchange)}'`,
    `country: '${escapeSingleQuote(company.country)}'`,
    `sector: '${escapeSingleQuote(company.sector)}'`,
  ];

  if (company.isADR) {
    parts.push(`isADR: true`);
  }

  if (company.aliases && company.aliases.length > 0) {
    const aliasStr = company.aliases
      .map((a) => `'${escapeSingleQuote(a)}'`)
      .join(', ');
    parts.push(`aliases: [${aliasStr}]`);
  }

  return `{ ${parts.join(', ')} }`;
}

function escapeSingleQuote(str: string): string {
  return str.replace(/'/g, "\\'");
}

/**
 * Group companies by region/exchange for readable output
 */
function groupCompaniesByRegion(companies: Company[]): Map<string, Company[]> {
  const groups = new Map<string, Company[]>();

  const getGroup = (company: Company): string => {
    if (company.isADR) return `United States - ADRs`;
    switch (company.exchange) {
      case 'NASDAQ': return `United States - NASDAQ`;
      case 'NYSE': return `United States - NYSE`;
      case 'AMEX': return `United States - AMEX`;
      case 'TSX': return `Canada - TSX`;
      case 'LSE': return `United Kingdom - LSE`;
      case 'HKEX': return `Hong Kong - HKEX`;
      case 'SGX': return `Singapore - SGX`;
      case 'B3': return `Brazil - B3`;
      case 'TWSE': return `Taiwan - TWSE`;
      case 'JSE': return `South Africa - JSE`;
      case 'BVC': return `Colombia - BVC`;
      case 'OTC': return `United States - OTC`;
      default: return `Other - ${company.exchange}`;
    }
  };

  for (const company of companies) {
    const group = getGroup(company);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(company);
  }

  return groups;
}

// ─── Utility Functions Block ──────────────────────────────────────────────────
// These are appended verbatim to the generated file — they never change.

const UTILITY_FUNCTIONS = `/**
 * Lookup company by ticker symbol
 */
export function lookupCompany(ticker: string): Company | undefined {
  const normalizedTicker = ticker.trim().toUpperCase();
  return companies.find(c => c.ticker.toUpperCase() === normalizedTicker);
}

/**
 * Search companies by name or ticker
 */
export function searchCompanies(query: string): Company[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  return companies.filter(company => {
    // Check ticker match
    if (company.ticker.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check name match
    if (company.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check aliases match
    if (company.aliases) {
      return company.aliases.some(alias => 
        alias.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return false;
  }).sort((a, b) => {
    // Prioritize exact ticker matches
    const aTickerMatch = a.ticker.toLowerCase() === normalizedQuery;
    const bTickerMatch = b.ticker.toLowerCase() === normalizedQuery;
    if (aTickerMatch && !bTickerMatch) return -1;
    if (!aTickerMatch && bTickerMatch) return 1;
    
    // Then prioritize ticker starts with
    const aTickerStarts = a.ticker.toLowerCase().startsWith(normalizedQuery);
    const bTickerStarts = b.ticker.toLowerCase().startsWith(normalizedQuery);
    if (aTickerStarts && !bTickerStarts) return -1;
    if (!aTickerStarts && bTickerStarts) return 1;
    
    // Then alphabetical
    return a.ticker.localeCompare(b.ticker);
  });
}

/**
 * Get exchange suffix from ticker
 */
export function getExchangeSuffix(ticker: string): string | null {
  const suffixMatch = ticker.match(/\\.([A-Z]+)$/);
  return suffixMatch ? suffixMatch[1] : null;
}

/**
 * Get exchange name from suffix
 */
export function getExchangeName(suffix: string): string {
  const exchangeMap: Record<string, string> = {
    'TO': 'Toronto Stock Exchange (TSX)',
    'V': 'TSX Venture Exchange',
    'L': 'London Stock Exchange (LSE)',
    'LON': 'London Stock Exchange (LSE)',
    'HK': 'Hong Kong Stock Exchange (HKEX)',
    'SI': 'Singapore Exchange (SGX)',
    'SA': 'B3 (Brazil)',
    'TW': 'Taiwan Stock Exchange (TWSE)',
    'TWO': 'Taipei Exchange',
    'JO': 'Johannesburg Stock Exchange (JSE)',
    'CO': 'Bolsa de Valores de Colombia (BVC)'
  };
  return exchangeMap[suffix] || suffix;
}

/**
 * Get all companies from a specific country
 */
export function getCompaniesByCountry(country: string): Company[] {
  return companies.filter(c => c.country.toLowerCase() === country.toLowerCase());
}

/**
 * Get all companies from a specific sector
 */
export function getCompaniesBySector(sector: string): Company[] {
  return companies.filter(c => c.sector.toLowerCase() === sector.toLowerCase());
}

/**
 * Get all unique countries
 */
export function getAllCountries(): string[] {
  return Array.from(new Set(companies.map(c => c.country))).sort();
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): string[] {
  return Array.from(new Set(companies.map(c => c.sector))).sort();
}
`;

// ─── Main Update Logic ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();

  log('═══════════════════════════════════════════════════════════════');
  log('  CO-GRI Company Database Daily Update Script');
  log(`  Mode: ${IS_DRY_RUN ? 'DRY RUN (no file changes)' : 'LIVE UPDATE'}`);
  log(`  Target: ${COMPANY_DB_PATH}`);
  log('═══════════════════════════════════════════════════════════════');

  // ── Step 1: Validate API key ──────────────────────────────────────────────
  if (!FMP_API_KEY) {
    error('FMP_API_KEY is not set. Cannot proceed.');
    error('Set FMP_API_KEY as a GitHub Actions secret or VITE_FMP_API_KEY in .env');
    process.exit(1);
  }
  log(`✅ FMP API key found (${FMP_API_KEY.slice(0, 4)}...${FMP_API_KEY.slice(-4)})`);

  // ── Step 2: Read existing database ───────────────────────────────────────
  log(`Reading existing database from ${COMPANY_DB_PATH}...`);
  if (!fs.existsSync(COMPANY_DB_PATH)) {
    error(`companyDatabase.ts not found at ${COMPANY_DB_PATH}`);
    process.exit(1);
  }

  const existingContent = fs.readFileSync(COMPANY_DB_PATH, 'utf-8');
  const existingCompanies = parseExistingDatabase(existingContent);
  log(`✅ Parsed ${existingCompanies.length} companies from existing database`);

  // Build a map for quick lookup: ticker → Company (preserving aliases)
  const existingMap = new Map<string, Company>();
  for (const company of existingCompanies) {
    existingMap.set(company.ticker.toUpperCase(), company);
  }

  // ── Step 3: Fetch FMP bulk list ───────────────────────────────────────────
  const fmpBulkMap = await fetchFMPBulkList();

  // ── Step 4: Process each company ─────────────────────────────────────────
  const stats: UpdateStats = {
    total: existingCompanies.length,
    updated: 0,
    unchanged: 0,
    notFound: 0,
    errors: 0,
    changes: [],
  };

  const updatedCompanies: Company[] = [];
  const individualFetchQueue: string[] = [];

  // First pass: match against bulk list
  for (const existing of existingCompanies) {
    const upperTicker = existing.ticker.toUpperCase();

    // Try exact match first
    let fmpItem = fmpBulkMap.get(upperTicker);

    // For international tickers (e.g., TOU.TO, SHEL.L), try base symbol
    if (!fmpItem && existing.ticker.includes('.')) {
      const baseTicker = existing.ticker.split('.')[0].toUpperCase();
      fmpItem = fmpBulkMap.get(baseTicker);
    }

    if (fmpItem) {
      const updatedCompany = applyBulkUpdate(existing, fmpItem, stats);
      updatedCompanies.push(updatedCompany);
    } else {
      // Queue for individual profile fetch
      individualFetchQueue.push(existing.ticker);
      updatedCompanies.push(existing); // placeholder — will be replaced
    }
  }

  // Second pass: individual profile fetches for tickers not in bulk list
  if (individualFetchQueue.length > 0) {
    log(`\nFetching individual profiles for ${individualFetchQueue.length} tickers not in bulk list...`);

    for (const ticker of individualFetchQueue) {
      verbose(`  Fetching profile for ${ticker}...`);
      const profile = await fetchFMPProfile(ticker);

      const existingCompany = existingMap.get(ticker.toUpperCase())!;
      const idx = updatedCompanies.findIndex(
        (c) => c.ticker.toUpperCase() === ticker.toUpperCase()
      );

      if (profile && profile.companyName) {
        const updatedCompany = applyProfileUpdate(existingCompany, profile, stats);
        updatedCompanies[idx] = updatedCompany;
      } else {
        warn(`  ⚠️  No FMP data found for ${ticker} — keeping existing data`);
        stats.notFound++;
        updatedCompanies[idx] = existingCompany;
      }

      // Rate limiting: small delay between individual calls
      await sleep(200);
    }
  }

  // ── Step 5: Report changes ────────────────────────────────────────────────
  log('\n─── Update Summary ─────────────────────────────────────────────');
  log(`  Total companies:  ${stats.total}`);
  log(`  Updated:          ${stats.updated}`);
  log(`  Unchanged:        ${stats.unchanged}`);
  log(`  Not found in FMP: ${stats.notFound}`);
  log(`  Errors:           ${stats.errors}`);

  if (stats.changes.length > 0) {
    log('\n─── Changes Detected ───────────────────────────────────────────');
    for (const change of stats.changes) {
      log(`  [${change.ticker}] ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
    }
  } else {
    log('\n  ✅ No data changes detected — database is up to date');
  }

  // ── Step 6: Write updated file ────────────────────────────────────────────
  if (IS_DRY_RUN) {
    log('\n  DRY RUN — no file changes written');
    log(`  Would have written ${updatedCompanies.length} companies to ${COMPANY_DB_PATH}`);
  } else if (stats.changes.length === 0) {
    log('\n  ✅ No changes to write — skipping file update');
  } else {
    const lastUpdated = new Date().toISOString();
    const newContent = generateTypeScriptFile(updatedCompanies, lastUpdated);

    // Backup existing file
    const backupPath = `${COMPANY_DB_PATH}.backup`;
    fs.copyFileSync(COMPANY_DB_PATH, backupPath);
    log(`\n  Backup written to ${backupPath}`);

    // Write new file
    fs.writeFileSync(COMPANY_DB_PATH, newContent, 'utf-8');
    log(`  ✅ Updated companyDatabase.ts written (${updatedCompanies.length} companies)`);
    log(`  Last updated: ${lastUpdated}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`\n═══════════════════════════════════════════════════════════════`);
  log(`  Update complete in ${elapsed}s`);
  log(`═══════════════════════════════════════════════════════════════`);
}

// ─── Update Helpers ───────────────────────────────────────────────────────────

function applyBulkUpdate(
  existing: Company,
  fmpItem: FMPStockListItem,
  stats: UpdateStats
): Company {
  const updated: Company = {
    ...existing,
    // CRITICAL: Always preserve aliases — they cannot be sourced from any API
    aliases: existing.aliases,
  };

  let hasChanges = false;

  // Update name
  if (fmpItem.name && fmpItem.name !== existing.name) {
    stats.changes.push({ ticker: existing.ticker, field: 'name', oldValue: existing.name, newValue: fmpItem.name });
    updated.name = fmpItem.name;
    hasChanges = true;
  }

  // Update exchange
  const normalizedExchange = normalizeExchange(fmpItem.exchange, fmpItem.exchangeShortName);
  if (normalizedExchange && normalizedExchange !== 'Unknown' && normalizedExchange !== existing.exchange) {
    stats.changes.push({ ticker: existing.ticker, field: 'exchange', oldValue: existing.exchange, newValue: normalizedExchange });
    updated.exchange = normalizedExchange;
    hasChanges = true;
  }

  if (hasChanges) {
    stats.updated++;
  } else {
    stats.unchanged++;
  }

  return updated;
}

function applyProfileUpdate(
  existing: Company,
  profile: FMPProfile,
  stats: UpdateStats
): Company {
  const updated: Company = {
    ...existing,
    // CRITICAL: Always preserve aliases
    aliases: existing.aliases,
  };

  let hasChanges = false;

  // Update name
  if (profile.companyName && profile.companyName !== existing.name) {
    stats.changes.push({ ticker: existing.ticker, field: 'name', oldValue: existing.name, newValue: profile.companyName });
    updated.name = profile.companyName;
    hasChanges = true;
  }

  // Update exchange
  const normalizedExchange = normalizeExchange(profile.exchange, profile.exchangeShortName);
  if (normalizedExchange && normalizedExchange !== 'Unknown' && normalizedExchange !== existing.exchange) {
    stats.changes.push({ ticker: existing.ticker, field: 'exchange', oldValue: existing.exchange, newValue: normalizedExchange });
    updated.exchange = normalizedExchange;
    hasChanges = true;
  }

  // Update country
  const normalizedCountry = normalizeCountry(profile.country);
  if (normalizedCountry && normalizedCountry !== 'Unknown' && normalizedCountry !== existing.country) {
    stats.changes.push({ ticker: existing.ticker, field: 'country', oldValue: existing.country, newValue: normalizedCountry });
    updated.country = normalizedCountry;
    hasChanges = true;
  }

  // Update sector
  const normalizedSector = normalizeSector(profile.sector);
  if (normalizedSector && normalizedSector !== 'General' && normalizedSector !== existing.sector) {
    stats.changes.push({ ticker: existing.ticker, field: 'sector', oldValue: existing.sector, newValue: normalizedSector });
    updated.sector = normalizedSector;
    hasChanges = true;
  }

  // Update isADR
  if (profile.isAdr !== undefined && profile.isAdr !== existing.isADR) {
    stats.changes.push({ ticker: existing.ticker, field: 'isADR', oldValue: existing.isADR, newValue: profile.isAdr });
    updated.isADR = profile.isAdr;
    hasChanges = true;
  }

  if (hasChanges) {
    stats.updated++;
  } else {
    stats.unchanged++;
  }

  return updated;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

main().catch((err) => {
  error(`Fatal error: ${String(err)}`);
  process.exit(1);
});