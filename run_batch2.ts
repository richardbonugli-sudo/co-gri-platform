import { batchProcessCompanies, SP100_TICKERS, generateCompanyExposuresCode } from './src/scripts/batchProcessCompanies';
import * as fs from 'fs';

async function runBatch2() {
  const batch2 = SP100_TICKERS.slice(20, 40);
  
  console.log('=== BATCH 2: Processing Companies 21-40 ===');
  console.log(`Companies: ${batch2.join(', ')}`);
  
  const results = await batchProcessCompanies(batch2, 1);
  
  const successful = results.filter(r => r.success && r.exposure);
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== BATCH 2 RESULTS ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Success Rate: ${Math.round((successful.length / results.length) * 100)}%`);
  
  if (successful.length > 0) {
    const exposures = successful.map(r => r.exposure!);
    const code = generateCompanyExposuresCode(exposures);
    fs.writeFileSync('batch2_exposures.ts', code);
    console.log(`\n✅ Saved ${successful.length} companies to batch2_exposures.ts`);
  }
  
  if (failed.length > 0) {
    const failedList = failed.map(r => `${r.ticker}: ${r.error}`).join('\n');
    fs.writeFileSync('batch2_failed.txt', failedList);
  }
  
  console.log('\n=== SUCCESSFUL ===');
  successful.forEach(r => console.log(`✅ ${r.ticker}: ${r.countriesIdentified} countries`));
  
  console.log('\n=== FAILED ===');
  failed.forEach(r => console.log(`❌ ${r.ticker}`));
}

runBatch2().catch(console.error);
