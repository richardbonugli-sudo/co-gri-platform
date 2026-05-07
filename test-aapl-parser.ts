/**
 * Test Script: AAPL SEC Parser
 * 
 * Tests the enhanced SEC parser with all 5 fixes on Apple's 10-K filing
 * 
 * Run with: npx tsx test-aapl-parser.ts
 */

import { parseSECFiling } from './src/services/secFilingParser';

async function testAAPLParser() {
  console.log('\n==========================================================');
  console.log('TESTING ENHANCED SEC PARSER WITH AAPL');
  console.log('==========================================================\n');
  
  console.log('Testing all 5 fixes:');
  console.log('✅ Fix #1: Expanded table pattern recognition (+20 patterns)');
  console.log('✅ Fix #2: SSF for regional aggregates');
  console.log('✅ Fix #3: CIK lookup retry logic');
  console.log('✅ Fix #4: Relaxed validation rules (±2% tolerance)');
  console.log('✅ Fix #5: LLM-based narrative extraction\n');
  
  const result = await parseSECFiling('AAPL');
  
  if (!result) {
    console.error('❌ Parser returned null');
    return;
  }
  
  console.log('\n==========================================================');
  console.log('PARSING RESULTS FOR AAPL');
  console.log('==========================================================\n');
  
  console.log(`Filing Type: ${result.formType}`);
  console.log(`Filing Date: ${result.filingDate}`);
  console.log(`Report Date: ${result.reportDate}`);
  console.log(`CIK: ${result.cik}`);
  console.log(`Parsing Success: ${result.parsingSuccess}`);
  console.log(`Parsing Errors: ${result.parsingErrors.length}`);
  if (result.parsingErrors.length > 0) {
    result.parsingErrors.forEach(err => console.log(`  - ${err}`));
  }
  
  console.log('\n--- REVENUE CHANNEL (Wᵣ) ---');
  console.log(`Revenue Table Found: ${result.revenueTableFound}`);
  console.log(`Revenue Segments: ${result.revenueSegments.length}`);
  if (result.revenueSegments.length > 0) {
    console.log('\nRevenue Breakdown:');
    result.revenueSegments.forEach(seg => {
      console.log(`  - ${seg.region}: ${seg.revenuePercentage.toFixed(2)}% ($${(seg.revenueAmount / 1000).toFixed(1)}B) [${seg.source}, ${seg.confidence}]`);
    });
    
    const totalPercentage = result.revenueSegments.reduce((sum, seg) => sum + seg.revenuePercentage, 0);
    console.log(`\nTotal: ${totalPercentage.toFixed(2)}%`);
  }
  
  console.log('\n--- PHYSICAL ASSETS CHANNEL (Wₚ) ---');
  console.log(`PP&E Table Found: ${result.ppeTableFound}`);
  console.log(`PP&E Segments: ${result.ppeSegments.length}`);
  if (result.ppeSegments.length > 0) {
    console.log('\nPP&E Breakdown:');
    result.ppeSegments.forEach(seg => {
      console.log(`  - ${seg.region}: ${seg.ppePercentage.toFixed(2)}% ($${(seg.ppeAmount / 1000).toFixed(1)}B) [${seg.source}, ${seg.confidence}]`);
    });
  }
  console.log(`Facility Locations: ${result.facilityLocations.length}`);
  if (result.facilityLocations.length > 0) {
    const facilitiesByCountry = result.facilityLocations.reduce((acc, fac) => {
      acc[fac.country] = (acc[fac.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Facilities by Country:');
    Object.entries(facilitiesByCountry).forEach(([country, count]) => {
      console.log(`  - ${country}: ${count} facilities`);
    });
  }
  
  console.log('\n--- FINANCIAL CHANNEL (W𝒻) ---');
  console.log(`Debt Table Found: ${result.debtTableFound}`);
  console.log(`Debt Securities: ${result.debtSecurities.length}`);
  if (result.debtSecurities.length > 0) {
    console.log('\nDebt Securities:');
    const debtByJurisdiction = result.debtSecurities.reduce((acc, debt) => {
      acc[debt.jurisdiction] = (acc[debt.jurisdiction] || 0) + debt.principalAmount;
      return acc;
    }, {} as Record<string, number>);
    
    const totalDebt = Object.values(debtByJurisdiction).reduce((sum, amt) => sum + amt, 0);
    
    Object.entries(debtByJurisdiction).forEach(([jurisdiction, amount]) => {
      const percentage = (amount / totalDebt) * 100;
      console.log(`  - ${jurisdiction}: ${percentage.toFixed(2)}% ($${(amount / 1000).toFixed(1)}B)`);
    });
  }
  console.log(`Treasury Centers: ${result.treasuryCenters.length}`);
  if (result.treasuryCenters.length > 0) {
    console.log(`  - ${result.treasuryCenters.join(', ')}`);
  }
  
  console.log('\n--- SUPPLY CHAIN CHANNEL (Wₛ) ---');
  console.log(`Supplier List Found: ${result.supplierListFound}`);
  console.log(`Supplier Locations: ${result.supplierLocations.length}`);
  if (result.supplierLocations.length > 0) {
    const suppliersByCountry = result.supplierLocations.reduce((acc, sup) => {
      acc[sup.country] = (acc[sup.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Suppliers by Country:');
    Object.entries(suppliersByCountry).forEach(([country, count]) => {
      console.log(`  - ${country}: ${count} suppliers`);
    });
  }
  
  console.log('\n--- LLM NARRATIVE EXTRACTION (FIX #5) ---');
  console.log(`LLM Extractions Used: ${result.llmExtractionsUsed}`);
  console.log(`LLM Sections Analyzed: ${result.llmSectionsAnalyzed.join(', ')}`);
  if (result.llmProcessingTime) {
    console.log(`LLM Processing Time: ${result.llmProcessingTime}ms`);
  }
  
  console.log('\n--- SECTIONS FOUND ---');
  console.log(`Total Sections: ${result.sectionsFound.length}`);
  result.sectionsFound.forEach(section => {
    console.log(`  ✅ ${section}`);
  });
  
  console.log('\n==========================================================');
  console.log('TEST COMPLETE');
  console.log('==========================================================\n');
  
  // Summary
  console.log('SUMMARY:');
  console.log(`- Revenue segments extracted: ${result.revenueSegments.length}`);
  console.log(`- PP&E segments extracted: ${result.ppeSegments.length}`);
  console.log(`- Debt securities extracted: ${result.debtSecurities.length}`);
  console.log(`- Facility locations extracted: ${result.facilityLocations.length}`);
  console.log(`- Supplier locations extracted: ${result.supplierLocations.length}`);
  console.log(`- Treasury centers extracted: ${result.treasuryCenters.length}`);
  console.log(`- LLM extractions used: ${result.llmExtractionsUsed ? 'YES' : 'NO'}`);
  
  const hasStructuredData = result.revenueTableFound || result.ppeTableFound || result.debtTableFound;
  const hasNarrativeData = result.facilityLocations.length > 0 || result.supplierLocations.length > 0;
  const hasLLMData = result.llmExtractionsUsed;
  
  console.log('\nEVIDENCE HIERARCHY:');
  console.log(`1. Structured Evidence: ${hasStructuredData ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`2. Narrative Evidence: ${hasNarrativeData ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`3. LLM Extraction: ${hasLLMData ? '✅ USED' : '❌ NOT USED'}`);
  
  if (hasStructuredData) {
    console.log('\n✅ SUCCESS: Parser extracted structured data from SEC filing!');
  } else {
    console.log('\n⚠️ WARNING: No structured tables found, falling back to narrative/LLM extraction');
  }
}

// Run the test
testAAPLParser().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});