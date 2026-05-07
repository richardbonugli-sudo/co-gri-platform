import { batchProcessCompanies } from './src/scripts/batchProcessCompanies';

const TEST_TICKERS = ['AAPL', 'MSFT', 'GOOGL'];

async function runTest() {
  console.log('Starting batch processor test on 3 companies...');
  const results = await batchProcessCompanies(TEST_TICKERS, 1);
  
  console.log('\n=== SUMMARY ===');
  console.log(`Success: ${results.filter(r => r.success).length}/${results.length}`);
  
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.ticker}: ${r.countriesIdentified} countries`);
    } else {
      console.log(`❌ ${r.ticker}: ${r.error}`);
    }
  });
}

runTest().catch(console.error);
