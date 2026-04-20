import { batchProcessCompanies, SP100_TICKERS, generateCompanyExposuresCode } from './src/scripts/batchProcessCompanies';
import * as fs from 'fs';

async function runFullBatch() {
  console.log('Starting S&P 100 batch processing...');
  console.log(`Total companies: ${SP100_TICKERS.length}`);
  
  const results = await batchProcessCompanies(SP100_TICKERS, 3);
  
  const successful = results.filter(r => r.success && r.exposure);
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== FINAL RESULTS ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Success Rate: ${Math.round((successful.length / results.length) * 100)}%`);
  
  // Save successful companies
  if (successful.length > 0) {
    const exposures = successful.map(r => r.exposure!);
    const code = generateCompanyExposuresCode(exposures);
    fs.writeFileSync('automated_exposures.ts', code);
    console.log(`\n✅ Saved ${successful.length} companies to automated_exposures.ts`);
  }
  
  // Save failed companies list
  if (failed.length > 0) {
    const failedList = failed.map(r => `${r.ticker}: ${r.error}`).join('\n');
    fs.writeFileSync('failed_companies.txt', failedList);
    console.log(`\n⚠️ Saved ${failed.length} failed companies to failed_companies.txt`);
  }
  
  console.log('\n=== TOP 10 SUCCESSFUL ===');
  successful.slice(0, 10).forEach(r => {
    console.log(`${r.ticker}: ${r.countriesIdentified} countries`);
  });
  
  console.log('\n=== TOP 10 FAILED ===');
  failed.slice(0, 10).forEach(r => {
    console.log(`${r.ticker}: ${r.error}`);
  });
}

runFullBatch().catch(console.error);
