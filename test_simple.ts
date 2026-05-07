import { parseSECFiling } from './src/services/secFilingParser';

async function test() {
  console.log('Testing MSFT parsing...\n');
  const result = await parseSECFiling('MSFT');
  
  if (result) {
    console.log(`\n=== MSFT Results ===`);
    console.log(`Revenue segments found: ${result.revenueSegments.length}`);
    console.log(`Revenue table found: ${result.revenueTableFound}`);
    
    if (result.revenueSegments.length > 0) {
      console.log('\nRevenue segments:');
      result.revenueSegments.forEach(seg => {
        console.log(`  ${seg.region}: ${seg.revenuePercentage.toFixed(1)}%`);
      });
    }
  }
}

test().catch(console.error);
