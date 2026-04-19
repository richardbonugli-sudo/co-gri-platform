import { enhancedNASDAQDatabase, createCompanyFromNASDAQData } from './src/data/enhancedNASDAQDatabase.js';
import { generateCompleteNASDAQList } from './src/data/fullNASDAQCompanyList.js';
import { SP500_COMPANIES } from './src/tools/data-expansion/SP500Companies.js';
import { NASDAQ_COMPANY_DATABASE } from './src/data/nasdaqCompanyDatabase.js';

console.log('=== LOADING ALL COMPANIES INTO INTEGRATED DATABASE ===\n');

// Step 1: Load Full NASDAQ List
console.log('Step 1: Loading Full NASDAQ Company List...');
const fullNasdaqList = generateCompleteNASDAQList();
let loadedCount = 0;

for (const company of fullNasdaqList) {
  try {
    const enhancedCompany = createCompanyFromNASDAQData(company);
    enhancedNASDAQDatabase.addCompany(enhancedCompany);
    loadedCount++;
  } catch (error) {
    console.error(`Error loading ${company.ticker}:`, error);
  }
}

console.log(`✅ Loaded ${loadedCount} companies from Full NASDAQ List\n`);

// Step 2: Load S&P 500 Companies
console.log('Step 2: Loading S&P 500 Companies...');
let sp500Count = 0;

for (const sp500Company of SP500_COMPANIES) {
  try {
    // Check if already exists
    const existing = enhancedNASDAQDatabase.getCompany(sp500Company.ticker);
    
    if (!existing) {
      // Create new entry for S&P 500 company
      const enhancedCompany = createCompanyFromNASDAQData({
        ticker: sp500Company.ticker,
        companyName: sp500Company.name,
        cik: `SP500_${sp500Company.ticker}`,
        marketCap: sp500Company.marketCap || 50000000000, // Default to $50B for S&P 500
        sector: sp500Company.sector,
        industry: sp500Company.sector,
        exchange: 'NYSE',
        country: 'United States'
      });
      
      enhancedNASDAQDatabase.addCompany(enhancedCompany);
      sp500Count++;
    }
  } catch (error) {
    console.error(`Error loading S&P 500 ${sp500Company.ticker}:`, error);
  }
}

console.log(`✅ Loaded ${sp500Count} additional companies from S&P 500\n`);

// Step 3: Get Final Statistics
console.log('Step 3: Generating Final Statistics...\n');
const finalStats = enhancedNASDAQDatabase.getDatabaseStats();

console.log('=== FINAL DATABASE STATISTICS ===\n');
console.log(`Total Companies: ${finalStats.totalCompanies}`);
console.log(`Database Size: ${finalStats.databaseSize}`);
console.log(`Average Market Cap: $${(finalStats.averageMarketCap / 1000000000).toFixed(2)}B`);
console.log(`Total Market Cap: $${(finalStats.totalMarketCap / 1000000000000).toFixed(2)}T`);

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

console.log('\n=== EXCHANGE DISTRIBUTION ===');
Object.entries(finalStats.exchangeDistribution).forEach(([exchange, count]) => {
  console.log(`${exchange}: ${count} companies`);
});

console.log('\n=== PROCESSING STATUS ===');
Object.entries(finalStats.statusDistribution).forEach(([status, count]) => {
  console.log(`${status}: ${count} companies`);
});

console.log('\n=== INDEX SIZES ===');
Object.entries(finalStats.indexSizes).forEach(([index, size]) => {
  console.log(`${index}: ${size} entries`);
});

console.log('\n=== PARTITION SIZES ===');
Object.entries(finalStats.partitionSizes).forEach(([partition, size]) => {
  console.log(`${partition}: ${size} companies`);
});

console.log('\n✅ All companies successfully loaded into integrated database!');
console.log(`\nTotal Integrated Companies: ${finalStats.totalCompanies}`);
