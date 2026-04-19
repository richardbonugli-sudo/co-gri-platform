/**
 * Debug Bundle Generation Script
 * 
 * Generates debug bundles for AAPL, MSFT, and TSLA
 */

import { generateDebugBundles } from '../v4Integration';

/**
 * Generate debug bundles for multiple tickers
 */
export async function generateDebugBundlesForTickers(
  tickers: string[],
  outputPath?: string
): Promise<{
  results: Array<{
    ticker: string;
    success: boolean;
    debugBundlePaths: string[];
    error?: string;
  }>;
  summary: {
    totalSuccess: number;
    totalFailed: number;
    totalBundles: number;
  };
}> {
  
  const results: Array<{
    ticker: string;
    success: boolean;
    debugBundlePaths: string[];
    error?: string;
  }> = [];
  
  console.log('='.repeat(80));
  console.log('V.4 DEBUG BUNDLE GENERATION');
  console.log('='.repeat(80));
  console.log('');
  
  for (const ticker of tickers) {
    console.log(`\n[${'='.repeat(40)}]`);
    console.log(`Generating debug bundles for ${ticker}...`);
    console.log(`[${'='.repeat(40)}]\n`);
    
    try {
      const result = await generateDebugBundles(ticker, outputPath);
      
      results.push({
        ticker,
        success: result.success,
        debugBundlePaths: result.debugBundlePaths,
        error: result.error
      });
      
      if (result.success) {
        console.log(`✅ SUCCESS: Generated ${result.debugBundlePaths.length} debug bundles for ${ticker}`);
        for (const path of result.debugBundlePaths) {
          console.log(`   📄 ${path}`);
        }
      } else {
        console.log(`❌ FAILED: ${result.error}`);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ FAILED: ${errorMsg}`);
      
      results.push({
        ticker,
        success: false,
        debugBundlePaths: [],
        error: errorMsg
      });
    }
  }
  
  // Generate summary
  const totalSuccess = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;
  const totalBundles = results.reduce((sum, r) => sum + r.debugBundlePaths.length, 0);
  
  console.log('\n');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tickers Processed: ${tickers.length}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total Debug Bundles Generated: ${totalBundles}`);
  console.log('='.repeat(80));
  console.log('');
  
  return {
    results,
    summary: {
      totalSuccess,
      totalFailed,
      totalBundles
    }
  };
}

/**
 * Main execution function
 */
export async function main() {
  const tickers = ['AAPL', 'MSFT', 'TSLA'];
  const outputPath = '/workspace/shadcn-ui/debug_output';
  
  const result = await generateDebugBundlesForTickers(tickers, outputPath);
  
  // Print detailed results
  console.log('\nDETAILED RESULTS:');
  console.log('');
  
  for (const tickerResult of result.results) {
    console.log(`${tickerResult.ticker}:`);
    console.log(`  Status: ${tickerResult.success ? '✅ Success' : '❌ Failed'}`);
    
    if (tickerResult.success) {
      console.log(`  Bundles: ${tickerResult.debugBundlePaths.length}`);
      for (const path of tickerResult.debugBundlePaths) {
        const filename = path.split('/').pop();
        console.log(`    - ${filename}`);
      }
    } else {
      console.log(`  Error: ${tickerResult.error}`);
    }
    console.log('');
  }
  
  return result;
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('Debug bundle generation completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}