import { batchProcessCompanies, SP100_TICKERS, generateCompanyExposuresCode } from './src/scripts/batchProcessCompanies';
import * as fs from 'fs';

async function runBatch3() {
  const batch3 = SP100_TICKERS.slice(40, 60);
  
  console.log('=== BATCH 3: Processing Companies 41-60 ===');
  console.log(`Companies: ${batch3.join(', ')}`);
  
  const results = await batchProcessCompanies(batch3, 1);
  
  const successful = results.filter(r => r.success && r.exposure);
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== BATCH 3 RESULTS ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Success Rate: ${Math.round((successful.length / results.length) * 100)}%`);
  
  if (successful.length > 0) {
    const exposures = successful.map(r => r.exposure!);
    const code = generateCompanyExposuresCode(exposures);
    fs.writeFileSync('batch3_exposures.ts', code);
    console.log(`\n✅ Saved ${successful.length} companies to batch3_exposures.ts`);
  }
  
  if (failed.length > 0) {
    const failedList = failed.map(r => `${r.ticker}: ${r.error}`).join('\n');
    fs.writeFileSync('batch3_failed.txt', failedList);
  }
  
  console.log('\n=== SUCCESSFUL ===');
  successful.forEach(r => console.log(`✅ ${r.ticker}: ${r.countriesIdentified} countries`));
  
  console.log('\n=== FAILED ===');
  failed.forEach(r => console.log(`❌ ${r.ticker}`));
}

runBatch3().catch(console.error);
