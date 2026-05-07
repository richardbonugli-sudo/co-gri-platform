/**
 * V.4 Implementation Test Suite
 * 
 * Tests V.4 implementation with Apple (AAPL) and Tesla (TSLA).
 */

import { Channel } from '@/types/v4Types';
import { extractEvidenceBundle_V4, allocateChannel_V4 } from './v4Orchestrator';
import { ENHANCED_COMPANY_EXPOSURES } from '@/data/enhancedCompanyExposures';
import { formatV4Results, compareV4WithLegacy } from '../v4Integration';

/**
 * Test Apple (AAPL) - Label-to-country mapping
 */
export async function testApple(): Promise<{
  success: boolean;
  results: any;
  issues: string[];
}> {
  
  console.log('\n=== TESTING APPLE (AAPL) - V.4 IMPLEMENTATION ===\n');
  
  const issues: string[] = [];
  const companyData = ENHANCED_COMPANY_EXPOSURES['AAPL'];
  
  if (!companyData) {
    return {
      success: false,
      results: null,
      issues: ['Company AAPL not found']
    };
  }
  
  // Test Revenue Channel
  console.log('Testing Revenue Channel...');
  const revenueEvidence = extractEvidenceBundle_V4(
    companyData,
    Channel.REVENUE,
    companyData.sector,
    companyData.homeCountry
  );
  
  const revenueResult = allocateChannel_V4(revenueEvidence);
  const revenueFormatted = formatV4Results(revenueResult.weights, revenueResult.trace);
  
  console.log('\nRevenue Allocation:');
  console.log('Top 10 Countries:');
  for (const item of revenueFormatted.countries.slice(0, 10)) {
    console.log(`  ${item.country}: ${item.percentage}`);
  }
  
  console.log('\nEvidence Classification:');
  console.log(`  Direct Evidence: ${revenueFormatted.evidenceClassification.direct.join(', ') || 'None'}`);
  console.log(`  SSF Labels: ${revenueFormatted.evidenceClassification.ssf.join(', ') || 'None'}`);
  console.log(`  RF Labels: ${revenueFormatted.evidenceClassification.rf.join(', ') || 'None'}`);
  console.log(`  GF Used: ${revenueFormatted.evidenceClassification.gf ? 'Yes' : 'No'}`);
  
  // Validate: Should have direct evidence for countries in exposures
  const directCountries = revenueFormatted.evidenceClassification.direct;
  if (directCountries.length === 0) {
    issues.push('Expected direct evidence for countries, but found none');
  }
  
  // Test Assets Channel (should use PP&E data)
  console.log('\n\nTesting Assets Channel...');
  const assetsEvidence = extractEvidenceBundle_V4(
    companyData,
    Channel.ASSETS,
    companyData.sector,
    companyData.homeCountry
  );
  
  const assetsResult = allocateChannel_V4(assetsEvidence);
  const assetsFormatted = formatV4Results(assetsResult.weights, assetsResult.trace);
  
  console.log('\nAssets Allocation:');
  console.log('Top 5 Countries:');
  for (const item of assetsFormatted.countries.slice(0, 5)) {
    console.log(`  ${item.country}: ${item.percentage}`);
  }
  
  // Validate: Should have PP&E data
  if (!companyData.ppeData) {
    issues.push('Expected PP&E data for assets channel');
  }
  
  // Compare with legacy
  console.log('\n\nComparing V.4 with Legacy...');
  const comparison = compareV4WithLegacy(
    'AAPL',
    revenueResult.weights,
    companyData.exposures
  );
  
  console.log(`Total Difference: ${(comparison.summary.totalDifference * 100).toFixed(2)}%`);
  console.log(`Max Difference: ${(comparison.summary.maxDifference * 100).toFixed(2)}%`);
  console.log(`Countries Added: ${comparison.summary.countriesAdded.length}`);
  console.log(`Countries Removed: ${comparison.summary.countriesRemoved.length}`);
  
  if (comparison.differences.length > 0) {
    console.log('\nTop 5 Differences:');
    for (const diff of comparison.differences.slice(0, 5)) {
      console.log(`  ${diff.country}: V4=${(diff.v4Weight * 100).toFixed(2)}% vs Legacy=${(diff.legacyWeight * 100).toFixed(2)}% (Δ=${(diff.difference * 100).toFixed(2)}%)`);
    }
  }
  
  return {
    success: issues.length === 0,
    results: {
      revenue: revenueFormatted,
      assets: assetsFormatted,
      comparison
    },
    issues
  };
}

/**
 * Test Tesla (TSLA) - PP&E table detection
 */
export async function testTesla(): Promise<{
  success: boolean;
  results: any;
  issues: string[];
}> {
  
  console.log('\n=== TESTING TESLA (TSLA) - V.4 IMPLEMENTATION ===\n');
  
  const issues: string[] = [];
  const companyData = ENHANCED_COMPANY_EXPOSURES['TSLA'];
  
  if (!companyData) {
    return {
      success: false,
      results: null,
      issues: ['Company TSLA not found']
    };
  }
  
  // Test Assets Channel (PP&E detection)
  console.log('Testing Assets Channel (PP&E Detection)...');
  const assetsEvidence = extractEvidenceBundle_V4(
    companyData,
    Channel.ASSETS,
    companyData.sector,
    companyData.homeCountry
  );
  
  const assetsResult = allocateChannel_V4(assetsEvidence);
  const assetsFormatted = formatV4Results(assetsResult.weights, assetsResult.trace);
  
  console.log('\nAssets Allocation:');
  for (const item of assetsFormatted.countries) {
    console.log(`  ${item.country}: ${item.percentage}`);
  }
  
  console.log('\nEvidence Classification:');
  console.log(`  Direct Evidence: ${assetsFormatted.evidenceClassification.direct.join(', ') || 'None'}`);
  console.log(`  SSF Labels: ${assetsFormatted.evidenceClassification.ssf.join(', ') || 'None'}`);
  console.log(`  RF Labels: ${assetsFormatted.evidenceClassification.rf.join(', ') || 'None'}`);
  
  // Validate: Should have direct evidence for US and China
  const directCountries = assetsFormatted.evidenceClassification.direct;
  if (!directCountries.includes('United States')) {
    issues.push('Expected direct evidence for United States in assets');
  }
  if (!directCountries.includes('China')) {
    issues.push('Expected direct evidence for China in assets');
  }
  
  // Validate: Should have RF for "Other"
  const rfLabels = assetsFormatted.evidenceClassification.rf;
  if (rfLabels.length === 0) {
    issues.push('Expected RF allocation for residual "Other" countries');
  }
  
  // Test Revenue Channel
  console.log('\n\nTesting Revenue Channel...');
  const revenueEvidence = extractEvidenceBundle_V4(
    companyData,
    Channel.REVENUE,
    companyData.sector,
    companyData.homeCountry
  );
  
  const revenueResult = allocateChannel_V4(revenueEvidence);
  const revenueFormatted = formatV4Results(revenueResult.weights, revenueResult.trace);
  
  console.log('\nRevenue Allocation:');
  console.log('Top 10 Countries:');
  for (const item of revenueFormatted.countries.slice(0, 10)) {
    console.log(`  ${item.country}: ${item.percentage}`);
  }
  
  return {
    success: issues.length === 0,
    results: {
      assets: assetsFormatted,
      revenue: revenueFormatted
    },
    issues
  };
}

/**
 * Run all V.4 tests
 */
export async function runAllV4Tests(): Promise<{
  apple: any;
  tesla: any;
  overallSuccess: boolean;
}> {
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         V.4 IMPLEMENTATION TEST SUITE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const appleResults = await testApple();
  const teslaResults = await testTesla();
  
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Apple (AAPL): ${appleResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  if (appleResults.issues.length > 0) {
    console.log('  Issues:');
    for (const issue of appleResults.issues) {
      console.log(`    - ${issue}`);
    }
  }
  
  console.log(`\nTesla (TSLA): ${teslaResults.success ? '✅ PASSED' : '❌ FAILED'}`);
  if (teslaResults.issues.length > 0) {
    console.log('  Issues:');
    for (const issue of teslaResults.issues) {
      console.log(`    - ${issue}`);
    }
  }
  
  const overallSuccess = appleResults.success && teslaResults.success;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Overall: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`${'='.repeat(60)}\n`);
  
  return {
    apple: appleResults,
    tesla: teslaResults,
    overallSuccess
  };
}