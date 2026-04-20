import { batchProcessCompanies, SP100_TICKERS, generateCompanyExposuresCode } from './src/scripts/batchProcessCompanies';
import * as fs from 'fs';

async function runBatch4() {
  const batch4 = SP100_TICKERS.slice(60, 80);
  
  console.log('=== BATCH 4: Processing Companies 61-80 ===');
  console.log(`Companies: ${batch4.join(', ')}`);
  
  const results = await batchProcessCompanies(batch4, 1);
  
  const successful = results.filter(r => r.success && r.exposure);
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== BATCH 4 RESULTS ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const exposures = successful.map(r => r.exposure!);
    const code = generateCompanyExposuresCode(exposures);
    fs.writeFileSync('batch4_exposures.ts', code);
    console.log(`\n✅ Saved ${successful.length} companies to batch4_exposures.ts`);
  }
  
  if (failed.length > 0) {
    fs.writeFileSync('batch4_failed.txt', failed.map(r => `${r.ticker}: ${r.error}`).join('\n'));
  }
  
  console.log('\n=== SUCCESSFUL ===');
  successful.forEach(r => console.log(`✅ ${r.ticker}: ${r.countriesIdentified} countries`));
  
  console.log('\n=== FAILED ===');
  failed.forEach(r => console.log(`❌ ${r.ticker}`));
}

runBatch4().catch(console.error);
