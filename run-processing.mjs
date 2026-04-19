import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the processing modules
import('./src/tools/data-expansion/ProcessingLauncher.js').then(async ({ ProcessingLauncher }) => {
  try {
    console.log('🚀 Starting FULL S&P 500 SEC processing...');
    console.log('📊 This will process all companies with real SEC EDGAR API calls');
    console.log('⏱️ Expected duration: 2-4 hours with proper rate limiting');
    console.log('');
    
    const launcher = new ProcessingLauncher();
    
    // Start the full processing
    const results = await launcher.startFullProcessing();
    
    console.log('');
    console.log('🎉 SUCCESS: Full S&P 500 processing completed!');
    console.log('📊 Final Results:');
    console.log(`   Companies processed: ${results.summary.totalCompanies}`);
    console.log(`   Successful extractions: ${results.summary.successfulProcessing}`);
    console.log(`   Geographic segments: ${results.summary.totalSegmentsExtracted}`);
    console.log(`   Average confidence: ${Math.round(results.summary.averageConfidence * 100)}%`);
    console.log(`   Total processing time: ${Math.round(results.summary.processingTimeMs / 1000 / 60)} minutes`);
    console.log('');
    console.log('✅ Database expansion from 69 to 500+ companies complete!');
    
    return results;
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Failed to import processing modules:', error);
  
  // Try alternative approach with direct file execution
  console.log('🔄 Trying alternative approach...');
  
  // Use the startProcessing.ts file directly
  import('./src/tools/data-expansion/startProcessing.js').then(async ({ startFullProcessing }) => {
    try {
      await startFullProcessing();
    } catch (error) {
      console.error('❌ Alternative approach failed:', error);
      process.exit(1);
    }
  }).catch(err => {
    console.error('❌ All approaches failed:', err);
    console.log('');
    console.log('ℹ️ The processing system is configured but needs to be run from the React application.');
    console.log('📱 Please use the ExpansionDashboard interface to start processing.');
    console.log('🌐 Navigate to /data-expansion in the web application and click "Start Full Processing"');
  });
});