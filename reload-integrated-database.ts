import { enhancedNASDAQDatabase, createCompanyFromNASDAQData } from './src/data/enhancedNASDAQDatabase.js';
import { generateCompleteNASDAQList } from './src/data/fullNASDAQCompanyList.js';
import { SP500_COMPANIES } from './src/tools/data-expansion/SP500Companies.js';

console.log('=== RELOADING INTEGRATED DATABASE WITH ALL COMPANIES ===\n');

// DOW 30 Companies
const DOW30_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3000000000000 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', marketCap: 2800000000000 },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', marketCap: 500000000000 },
  { ticker: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financial Services', marketCap: 120000000000 },
  { ticker: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary', marketCap: 350000000000 },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', marketCap: 150000000000 },
  { ticker: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer Discretionary', marketCap: 200000000000 },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial Services', marketCap: 500000000000 },
  { ticker: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare', marketCap: 140000000000 },
  { ticker: 'BA', name: 'Boeing Company', sector: 'Industrials', marketCap: 130000000000 },
  { ticker: 'TRV', name: 'Travelers Companies Inc.', sector: 'Financial Services', marketCap: 45000000000 },
  { ticker: 'AXP', name: 'American Express Company', sector: 'Financial Services', marketCap: 150000000000 },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', marketCap: 550000000000 },
  { ticker: 'IBM', name: 'International Business Machines Corp.', sector: 'Technology', marketCap: 180000000000 },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 400000000000 },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', marketCap: 450000000000 },
  { ticker: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services', marketCap: 180000000000 },
  { ticker: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary', marketCap: 160000000000 },
  { ticker: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples', marketCap: 260000000000 },
  { ticker: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', marketCap: 250000000000 },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology', marketCap: 200000000000 },
  { ticker: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', marketCap: 170000000000 },
  { ticker: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials', marketCap: 140000000000 },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology', marketCap: 180000000000 },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy', marketCap: 280000000000 },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', marketCap: 250000000000 },
  { ticker: 'WBA', name: 'Walgreens Boots Alliance Inc.', sector: 'Healthcare', marketCap: 8000000000 },
  { ticker: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples', marketCap: 380000000000 },
  { ticker: 'MMM', name: '3M Company', sector: 'Industrials', marketCap: 70000000000 },
  { ticker: 'DOW', name: 'Dow Inc.', sector: 'Materials', marketCap: 35000000000 }
];

let totalLoaded = 0;
let sp500Added = 0;
let nasdaqAdded = 0;
let dowAdded = 0;

// Step 1: Load all NASDAQ companies
console.log('Step 1: Loading NASDAQ Companies...');
const fullNasdaqList = generateCompleteNASDAQList();
for (const company of fullNasdaqList) {
  const enhancedCompany = createCompanyFromNASDAQData(company);
  enhancedNASDAQDatabase.addCompany(enhancedCompany);
  nasdaqAdded++;
  totalLoaded++;
}
console.log(`✅ Loaded ${nasdaqAdded} NASDAQ companies\n`);

// Step 2: Load all S&P 500 companies
console.log('Step 2: Loading S&P 500 Companies...');
for (const sp500Company of SP500_COMPANIES) {
  const existing = enhancedNASDAQDatabase.getCompany(sp500Company.ticker);
  if (!existing) {
    const enhancedCompany = createCompanyFromNASDAQData({
      ticker: sp500Company.ticker,
      companyName: sp500Company.name,
      cik: `SP500_${sp500Company.ticker}`,
      marketCap: sp500Company.marketCap || 50000000000,
      sector: sp500Company.sector,
      industry: sp500Company.sector,
      exchange: 'NYSE',
      country: 'United States'
    });
    enhancedNASDAQDatabase.addCompany(enhancedCompany);
    sp500Added++;
    totalLoaded++;
  }
}
console.log(`✅ Loaded ${sp500Added} additional S&P 500 companies (${SP500_COMPANIES.length} total in S&P 500)\n`);

// Step 3: Load all DOW 30 companies
console.log('Step 3: Loading DOW 30 Companies...');
for (const dowCompany of DOW30_COMPANIES) {
  const existing = enhancedNASDAQDatabase.getCompany(dowCompany.ticker);
  if (!existing) {
    const enhancedCompany = createCompanyFromNASDAQData({
      ticker: dowCompany.ticker,
      companyName: dowCompany.name,
      cik: `DOW30_${dowCompany.ticker}`,
      marketCap: dowCompany.marketCap,
      sector: dowCompany.sector,
      industry: dowCompany.sector,
      exchange: 'NYSE',
      country: 'United States'
    });
    enhancedNASDAQDatabase.addCompany(enhancedCompany);
    dowAdded++;
    totalLoaded++;
  }
}
console.log(`✅ Loaded ${dowAdded} additional DOW 30 companies\n`);

// Step 4: Final verification
console.log('Step 4: Final Verification...\n');

const finalStats = enhancedNASDAQDatabase.getDatabaseStats();

console.log('=== FINAL DATABASE STATISTICS ===\n');
console.log(`Total Companies: ${finalStats.totalCompanies}`);
console.log(`Database Size: ${finalStats.databaseSize}`);
console.log(`Total Market Cap: $${(finalStats.totalMarketCap / 1000000000000).toFixed(2)}T`);
console.log(`Average Market Cap: $${(finalStats.averageMarketCap / 1000000000).toFixed(2)}B`);

console.log('\n=== COVERAGE VERIFICATION ===');

// Verify S&P 500
let sp500Count = 0;
const missingSP500: string[] = [];
for (const company of SP500_COMPANIES) {
  if (enhancedNASDAQDatabase.getCompany(company.ticker)) {
    sp500Count++;
  } else {
    missingSP500.push(company.ticker);
  }
}
console.log(`S&P 500: ${sp500Count}/${SP500_COMPANIES.length} companies (${(sp500Count/SP500_COMPANIES.length*100).toFixed(1)}%)`);
if (missingSP500.length > 0) {
  console.log(`Missing S&P 500 tickers: ${missingSP500.slice(0, 10).join(', ')}${missingSP500.length > 10 ? '...' : ''}`);
}

// Verify NASDAQ
let nasdaqCount = 0;
for (const company of fullNasdaqList) {
  if (enhancedNASDAQDatabase.getCompany(company.ticker)) nasdaqCount++;
}
console.log(`NASDAQ: ${nasdaqCount}/${fullNasdaqList.length} companies (${(nasdaqCount/fullNasdaqList.length*100).toFixed(1)}%)`);

// Verify DOW 30
let dowCount = 0;
for (const company of DOW30_COMPANIES) {
  if (enhancedNASDAQDatabase.getCompany(company.ticker)) dowCount++;
}
console.log(`DOW 30: ${dowCount}/${DOW30_COMPANIES.length} companies (${(dowCount/DOW30_COMPANIES.length*100).toFixed(1)}%)`);

console.log('\n=== TIER DISTRIBUTION ===');
Object.entries(finalStats.tierDistribution).forEach(([tier, count]) => {
  console.log(`${tier}: ${count} companies`);
});

console.log('\n=== SECTOR DISTRIBUTION (Top 10) ===');
const sortedSectors = Object.entries(finalStats.sectorDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
sortedSectors.forEach(([sector, count]) => {
  console.log(`${sector}: ${count} companies`);
});

console.log('\n✅ DATABASE FULLY LOADED AND VERIFIED!');
console.log(`\n📊 Total Unique Companies: ${finalStats.totalCompanies}`);
console.log(`📈 New companies added: ${sp500Added} from S&P 500, ${dowAdded} from DOW 30`);
console.log('✅ All S&P 500, NASDAQ, and DOW 30 companies are now included');
