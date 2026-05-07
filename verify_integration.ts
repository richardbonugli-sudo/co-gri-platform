import { COMPANY_SPECIFIC_EXPOSURES, getExposureStats } from './src/data/companySpecificExposures';

console.log('=== VERIFICATION OF INTEGRATED DATABASE ===\n');

// Get all tickers
const allTickers = Object.keys(COMPANY_SPECIFIC_EXPOSURES);
console.log(`Total companies in database: ${allTickers.length}`);

// Categorize entries
const manualEntries = ['AAPL', 'TSLA', 'J36.SI', 'J37.SI', 'C07.SI', 'H78.SI', 'M44U.SI'];
const automatedEntries = allTickers.filter(t => !manualEntries.includes(t));

console.log(`\nManual entries: ${manualEntries.filter(t => allTickers.includes(t)).length}`);
console.log(`Automated entries: ${automatedEntries.length}`);

// Sample some entries
console.log('\n=== SAMPLE MANUAL ENTRIES ===');
['AAPL', 'TSLA'].forEach(ticker => {
  if (COMPANY_SPECIFIC_EXPOSURES[ticker]) {
    const company = COMPANY_SPECIFIC_EXPOSURES[ticker];
    console.log(`\n${ticker} - ${company.companyName}`);
    console.log(`  Home: ${company.homeCountry}`);
    console.log(`  Countries: ${company.exposures.length}`);
    console.log(`  Source: ${company.dataSource}`);
  }
});

console.log('\n=== SAMPLE AUTOMATED ENTRIES ===');
['GOOGL', 'META', 'JPM', 'GE', 'BA'].forEach(ticker => {
  if (COMPANY_SPECIFIC_EXPOSURES[ticker]) {
    const company = COMPANY_SPECIFIC_EXPOSURES[ticker];
    console.log(`\n${ticker} - ${company.companyName}`);
    console.log(`  Home: ${company.homeCountry}`);
    console.log(`  Countries: ${company.exposures.length}`);
    console.log(`  Source: ${company.dataSource}`);
  }
});

// Check for data quality issues
console.log('\n=== DATA QUALITY CHECKS ===');

let issuesFound = 0;

// Check for companies with too many countries (likely errors)
allTickers.forEach(ticker => {
  const company = COMPANY_SPECIFIC_EXPOSURES[ticker];
  if (company.exposures.length > 100) {
    console.log(`⚠️ ${ticker}: ${company.exposures.length} countries (possible data error)`);
    issuesFound++;
  }
});

// Check for missing required fields
allTickers.forEach(ticker => {
  const company = COMPANY_SPECIFIC_EXPOSURES[ticker];
  if (!company.ticker || !company.companyName || !company.homeCountry || !company.sector) {
    console.log(`⚠️ ${ticker}: Missing required fields`);
    issuesFound++;
  }
});

if (issuesFound === 0) {
  console.log('✅ No data quality issues detected');
} else {
  console.log(`\n⚠️ Found ${issuesFound} potential issues`);
}

console.log('\n=== TOP 10 COMPANIES BY COUNTRY COVERAGE ===');
const sortedByCountries = allTickers
  .map(ticker => ({
    ticker,
    name: COMPANY_SPECIFIC_EXPOSURES[ticker].companyName,
    countries: COMPANY_SPECIFIC_EXPOSURES[ticker].exposures.length
  }))
  .sort((a, b) => b.countries - a.countries)
  .slice(0, 10);

sortedByCountries.forEach((company, index) => {
  console.log(`${index + 1}. ${company.ticker} - ${company.countries} countries`);
});

console.log('\n=== INTEGRATION SUMMARY ===');
console.log(`✅ Successfully integrated ${allTickers.length} companies`);
console.log(`✅ Database expanded from 7 to ${allTickers.length} companies`);
console.log(`✅ Growth factor: ${(allTickers.length / 7).toFixed(1)}x`);
console.log(`✅ S&P 100 coverage: ${automatedEntries.length}/100 companies (${Math.round(automatedEntries.length)}%)`);
