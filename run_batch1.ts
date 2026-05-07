import { batchProcessCompanies, SP100_TICKERS, generateCompanyExposuresCode } from './src/scripts/batchProcessCompanies';
import * as fs from 'fs';

async function runBatch1() {
  const batch1 = SP100_TICKERS.slice(0, 20);
  
  console.log('=== BATCH 1: Processing Top 20 Companies ===');
  console.log(`Companies: ${batch1.join(', ')}`);
  
  const results = await batchProcessCompanies(batch1, 1); // Process 1 at a time
  
  const successful = results.filter(r => r.success && r.exposure);
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== BATCH 1 RESULTS ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Success Rate: ${Math.round((successful.length / results.length) * 100)}%`);
  
  if (successful.length > 0) {
    const exposures = successful.map(r => r.exposure!);
    const code = generateCompanyExposuresCode(exposures);
    fs.writeFileSync('batch1_exposures.ts', code);
    console.log(`\n✅ Saved ${successful.length} companies to batch1_exposures.ts`);
  }
  
  if (failed.length > 0) {
    const failedList = failed.map(r => `${r.ticker}: ${r.error}`).join('\n');
    fs.writeFileSync('batch1_failed.txt', failedList);
    console.log(`\n⚠️ Failed companies saved to batch1_failed.txt`);
  }
  
  console.log('\n=== SUCCESSFUL COMPANIES ===');
  successful.forEach(r => {
    console.log(`✅ ${r.ticker}: ${r.countriesIdentified} countries`);
  });
  
  console.log('\n=== FAILED COMPANIES ===');
  failed.forEach(r => {
    console.log(`❌ ${r.ticker}: ${r.error}`);
  });
}

runBatch1().catch(console.error);
