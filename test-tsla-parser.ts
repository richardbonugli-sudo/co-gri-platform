/**
 * Test script for Tesla (TSLA) SEC filing parser
 * Diagnoses why TSLA shows "Global Fallback" instead of evidence-based data
 */

import { parseSECFiling } from './src/services/secFilingParser';

async function testTeslaParser() {
  console.log('\n==========================================================');
  console.log('TESLA (TSLA) SEC FILING PARSER DIAGNOSTIC TEST');
  console.log('==========================================================\n');
  
  const ticker = 'TSLA';
  
  try {
    console.log(`Starting parser test for ${ticker}...\n`);
    
    const result = await parseSECFiling(ticker);
    
    if (!result) {
      console.error('❌ Parser returned null - no data extracted');
      return;
    }
    
    console.log('\n==========================================================');
    console.log('PARSING RESULTS FOR TSLA');
    console.log('==========================================================\n');
    
    console.log('Filing Type:', result.formType);
    console.log('Filing Date:', result.filingDate);
    console.log('Report Date:', result.reportDate);
    console.log('CIK:', result.cik);
    console.log('Parsing Success:', result.parsingSuccess);
    console.log('Parsing Errors:', result.parsingErrors.length);
    
    if (result.parsingErrors.length > 0) {
      console.log('\nErrors:');
      result.parsingErrors.forEach(err => console.log('  -', err));
    }
    
    // Revenue Channel Analysis
    console.log('\n--- REVENUE CHANNEL (Wᵣ) ---');
    console.log('Revenue Table Found:', result.revenueTableFound);
    console.log('Revenue Segments:', result.revenueSegments.length);
    
    if (result.revenueSegments.length > 0) {
      console.log('\nRevenue Breakdown:');
      let total = 0;
      result.revenueSegments.forEach(seg => {
        console.log(`  - ${seg.region}: ${seg.revenuePercentage.toFixed(2)}% ($${(seg.revenueAmount / 1000).toFixed(1)}B) [${seg.source}, ${seg.confidence}]`);
        total += seg.revenuePercentage;
      });
      console.log(`\nTotal: ${total.toFixed(2)}%`);
    } else {
      console.log('⚠️ NO REVENUE SEGMENTS EXTRACTED');
    }
    
    // PP&E Channel Analysis
    console.log('\n--- PHYSICAL ASSETS CHANNEL (Wₚ) ---');
    console.log('PP&E Table Found:', result.ppeTableFound);
    console.log('PP&E Segments:', result.ppeSegments.length);
    console.log('Facility Locations:', result.facilityLocations.length);
    
    // Debt Channel Analysis
    console.log('\n--- FINANCIAL CHANNEL (W𝒻) ---');
    console.log('Debt Table Found:', result.debtTableFound);
    console.log('Debt Securities:', result.debtSecurities.length);
    console.log('Treasury Centers:', result.treasuryCenters.length);
    
    // Supply Chain Analysis
    console.log('\n--- SUPPLY CHAIN CHANNEL (Wₛ) ---');
    console.log('Supplier List Found:', result.supplierListFound);
    console.log('Supplier Locations:', result.supplierLocations.length);
    
    // LLM Extraction Analysis
    console.log('\n--- LLM NARRATIVE EXTRACTION (FIX #5) ---');
    console.log('LLM Extractions Used:', result.llmExtractionsUsed);
    console.log('LLM Sections Analyzed:', result.llmSectionsAnalyzed.join(', ') || 'None');
    
    // Sections Found
    console.log('\n--- SECTIONS FOUND ---');
    console.log('Total Sections:', result.sectionsFound.length);
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
    
    console.log('\nEVIDENCE HIERARCHY:');
    console.log('1. Structured Evidence:', result.revenueTableFound || result.ppeTableFound || result.debtTableFound ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('2. Narrative Evidence:', result.facilityLocations.length > 0 || result.supplierLocations.length > 0 ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('3. LLM Extraction:', result.llmExtractionsUsed ? '✅ USED' : '❌ NOT USED');
    
    if (result.revenueSegments.length === 0 && result.ppeSegments.length === 0) {
      console.log('\n⚠️ WARNING: No structured data extracted - will fall back to Global Fallback');
      console.log('\nPOSSIBLE CAUSES:');
      console.log('1. Tesla may not report geographic revenue segments in 10-K');
      console.log('2. Table format may be different from Apple (product-focused vs. geography-focused)');
      console.log('3. Revenue data may be in narrative sections only');
      console.log('4. May need to parse XBRL data instead of HTML tables');
    } else {
      console.log('\n✅ SUCCESS: Parser extracted structured data from SEC filing!');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

testTeslaParser();
