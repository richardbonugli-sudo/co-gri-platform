import { unifiedDatabaseIntegrator } from './src/services/UnifiedDatabaseIntegrator';

async function testIntegration() {
  console.log('Starting database integration...\n');
  
  const result = await unifiedDatabaseIntegrator.executeIntegration();
  
  if (result.success) {
    console.log('\n=== INTEGRATION RESULTS ===\n');
    console.log(`Total Companies: ${result.stats.totalCompanies}`);
    console.log(`S&P 500 Companies: ${result.stats.sp500Companies}`);
    console.log(`NASDAQ Companies: ${result.stats.nasdaqCompanies}`);
    console.log(`Manual Entries: ${result.stats.manualEntries}`);
    console.log(`Integrated Companies: ${result.stats.integratedCompanies}`);
    console.log(`Conflict Resolutions: ${result.stats.conflictResolutions}`);
    console.log(`Geographic Segments: ${result.stats.geographicSegments}`);
    console.log(`Average Confidence: ${(result.stats.averageConfidence * 100).toFixed(2)}%`);
    console.log(`Evidence-Based Rate: ${result.stats.evidenceBasedRate.toFixed(2)}%`);
    
    console.log('\n=== QUALITY DISTRIBUTION ===');
    Object.entries(result.stats.qualityDistribution).forEach(([quality, count]) => {
      console.log(`${quality}: ${count} companies`);
    });
    
    console.log('\n=== CONFIDENCE DISTRIBUTION ===');
    Object.entries(result.stats.confidenceDistribution).forEach(([range, count]) => {
      console.log(`${range}: ${count} companies`);
    });
  } else {
    console.error('Integration failed:', result.errors);
  }
}

testIntegration().catch(console.error);
