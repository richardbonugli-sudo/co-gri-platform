import { enhancedNASDAQDatabase } from './src/data/enhancedNASDAQDatabase.js';
import { generateCompleteNASDAQList } from './src/data/fullNASDAQCompanyList.js';
import { SP500_COMPANIES } from './src/tools/data-expansion/SP500Companies.js';

console.log('=== VERIFYING CURRENT DATABASE COVERAGE ===\n');

const currentStats = enhancedNASDAQDatabase.getDatabaseStats();
console.log(`Current Total Companies: ${currentStats.totalCompanies}\n`);

// Check S&P 500 coverage
console.log('Checking S&P 500 Coverage...');
let sp500Missing = 0;
const missingSP500: string[] = [];

for (const company of SP500_COMPANIES) {
  const existing = enhancedNASDAQDatabase.getCompany(company.ticker);
  if (!existing) {
    sp500Missing++;
    missingSP500.push(company.ticker);
  }
}

console.log(`S&P 500 Total: ${SP500_COMPANIES.length} companies`);
console.log(`S&P 500 in Database: ${SP500_COMPANIES.length - sp500Missing} companies`);
console.log(`S&P 500 Missing: ${sp500Missing} companies`);
if (sp500Missing > 0) {
  console.log(`Missing S&P 500 tickers: ${missingSP500.slice(0, 20).join(', ')}${missingSP500.length > 20 ? '...' : ''}`);
}

// Check NASDAQ coverage
console.log('\nChecking NASDAQ Coverage...');
const fullNasdaqList = generateCompleteNASDAQList();
let nasdaqMissing = 0;

for (const company of fullNasdaqList) {
  const existing = enhancedNASDAQDatabase.getCompany(company.ticker);
  if (!existing) {
    nasdaqMissing++;
  }
}

console.log(`NASDAQ Total: ${fullNasdaqList.length} companies`);
console.log(`NASDAQ in Database: ${fullNasdaqList.length - nasdaqMissing} companies`);
console.log(`NASDAQ Missing: ${nasdaqMissing} companies`);

// DOW 30 companies
const DOW30_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  { ticker: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financial Services' },
  { ticker: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { ticker: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer Discretionary' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
  { ticker: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
  { ticker: 'BA', name: 'Boeing Company', sector: 'Industrials' },
  { ticker: 'TRV', name: 'Travelers Companies Inc.', sector: 'Financial Services' },
  { ticker: 'AXP', name: 'American Express Company', sector: 'Financial Services' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  { ticker: 'IBM', name: 'International Business Machines Corp.', sector: 'Technology' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
  { ticker: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
  { ticker: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples' },
  { ticker: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology' },
  { ticker: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services' },
  { ticker: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  { ticker: 'WBA', name: 'Walgreens Boots Alliance Inc.', sector: 'Healthcare' },
  { ticker: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples' },
  { ticker: 'MMM', name: '3M Company', sector: 'Industrials' },
  { ticker: 'DOW', name: 'Dow Inc.', sector: 'Materials' }
];

console.log('\nChecking DOW 30 Coverage...');
let dowMissing = 0;
const missingDOW: string[] = [];

for (const company of DOW30_COMPANIES) {
  const existing = enhancedNASDAQDatabase.getCompany(company.ticker);
  if (!existing) {
    dowMissing++;
    missingDOW.push(company.ticker);
  }
}

console.log(`DOW 30 Total: ${DOW30_COMPANIES.length} companies`);
console.log(`DOW 30 in Database: ${DOW30_COMPANIES.length - dowMissing} companies`);
console.log(`DOW 30 Missing: ${dowMissing} companies`);
if (dowMissing > 0) {
  console.log(`Missing DOW tickers: ${missingDOW.join(', ')}`);
}

console.log('\n=== SUMMARY ===');
console.log(`Total Missing Companies: ${sp500Missing + nasdaqMissing + dowMissing}`);
console.log(`\nDatabase should contain: ${SP500_COMPANIES.length + fullNasdaqList.length + DOW30_COMPANIES.length} companies (with overlaps)`);
console.log(`Current Database: ${currentStats.totalCompanies} companies`);

// Calculate expected total (accounting for overlaps)
const allTickers = new Set<string>();
SP500_COMPANIES.forEach(c => allTickers.add(c.ticker));
fullNasdaqList.forEach(c => allTickers.add(c.ticker));
DOW30_COMPANIES.forEach(c => allTickers.add(c.ticker));

console.log(`\nExpected Unique Total: ${allTickers.size} companies`);
console.log(`Gap: ${allTickers.size - currentStats.totalCompanies} companies need to be added`);
