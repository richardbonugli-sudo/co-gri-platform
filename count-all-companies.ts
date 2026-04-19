import { NASDAQ_COMPANY_DATABASE } from './src/data/nasdaqCompanyDatabase.js';
import { enhancedNASDAQDatabase } from './src/data/enhancedNASDAQDatabase.js';
import { generateCompleteNASDAQList } from './src/data/fullNASDAQCompanyList.js';
import { SP500_COMPANIES } from './src/tools/data-expansion/SP500Companies.js';
import { companySpecificExposures } from './src/data/companySpecificExposures.js';
import { lookupCompany, searchCompanies, getAllCountries } from './src/utils/companyDatabase.js';

console.log('=== COMPREHENSIVE DATABASE COUNT ===\n');

// Count NASDAQ Company Database
const nasdaqCount = Object.keys(NASDAQ_COMPANY_DATABASE).length;
console.log(`1. NASDAQ Company Database (nasdaqCompanyDatabase.ts): ${nasdaqCount} companies`);

// Count Full NASDAQ List
const fullNasdaqList = generateCompleteNASDAQList();
console.log(`2. Full NASDAQ Company List (fullNASDAQCompanyList.ts): ${fullNasdaqList.length} companies`);

// Count S&P 500
console.log(`3. S&P 500 Companies (SP500Companies.ts): ${SP500_COMPANIES.length} companies`);

// Count Company Specific Exposures
const exposuresCount = Object.keys(companySpecificExposures).length;
console.log(`4. Company Specific Exposures (companySpecificExposures.ts): ${exposuresCount} companies`);

// Count Enhanced NASDAQ Database (currently loaded)
const enhancedStats = enhancedNASDAQDatabase.getDatabaseStats();
console.log(`5. Enhanced NASDAQ Database (in-memory): ${enhancedStats.totalCompanies} companies`);

console.log('\n=== UNIQUE COMPANY TOTALS ===\n');

// Calculate unique companies across main sources
const allTickers = new Set<string>();

// Add from NASDAQ database
Object.keys(NASDAQ_COMPANY_DATABASE).forEach(ticker => allTickers.add(ticker));

// Add from Full NASDAQ list
fullNasdaqList.forEach(company => allTickers.add(company.ticker));

// Add from S&P 500
SP500_COMPANIES.forEach(company => allTickers.add(company.ticker));

console.log(`Total Unique Tickers Across All Sources: ${allTickers.size} companies`);

console.log('\n=== BREAKDOWN BY SOURCE ===\n');
console.log(`- Full NASDAQ List: ${fullNasdaqList.length} companies`);
console.log(`- S&P 500 List: ${SP500_COMPANIES.length} companies`);
console.log(`- Manual Exposures: ${exposuresCount} companies`);

console.log('\n=== SYSTEM CAPACITY ===\n');
console.log('Infrastructure supports: 23,800+ companies across 50+ countries');
console.log(`Currently available for integration: ${allTickers.size} unique companies`);
