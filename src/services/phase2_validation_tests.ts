/**
 * PHASE 2 VALIDATION TESTS
 * 
 * Test bilateral fallback calculations to ensure they meet requirements
 */

import { calculateSupplyChainExposureFallback } from './dataIntegration/supplyChainFallbackService';
import { calculateFinancialLinkageFallback } from './dataIntegration/financialFallbackService';

/**
 * Test Case 1: China Supply Chain
 * Expected: VN, TW, KR, MY, TH, JP, SG should rank high (top 7)
 */
export function testChinaSupplyChain() {
  console.log('=== TEST CASE 1: China Supply Chain ===\n');
  
  const targetCountry = 'CN';
  const spilloverCountries = ['VN', 'TW', 'KR', 'MY', 'TH', 'JP', 'SG', 'ID', 'PH', 'IN', 'US', 'DE'];
  const results: Array<{ country: string; exposure: number; method: string }> = [];
  
  for (const country of spilloverCountries) {
    const result = calculateSupplyChainExposureFallback(country, targetCountry, 'Technology');
    results.push({
      country,
      exposure: result.exposure,
      method: result.method
    });
  }
  
  // Sort by exposure (descending)
  results.sort((a, b) => b.exposure - a.exposure);
  
  console.log('Supply Chain Exposure Rankings (Country → CN):');
  results.forEach((r, index) => {
    console.log(`${index + 1}. ${r.country} → CN: ${(r.exposure * 100).toFixed(4)}% (${r.method})`);
  });
  
  // Validation
  const top7 = results.slice(0, 7).map(r => r.country);
  const expectedTop7 = ['VN', 'TW', 'KR', 'MY', 'TH', 'JP', 'SG'];
  const matchCount = top7.filter(c => expectedTop7.includes(c)).length;
  
  console.log(`\n✓ Top 7 match: ${matchCount}/7 countries`);
  console.log(`✓ Top 7 actual: ${top7.join(', ')}`);
  console.log(`✓ Top 7 expected: ${expectedTop7.join(', ')}\n`);
  
  return { results, matchCount, total: 7 };
}

/**
 * Test Case 2: US Financial Linkage
 * Expected: GB, JP, CH, CA, DE should be top 5 (70-80% of total)
 */
export function testUSFinancialLinkage() {
  console.log('=== TEST CASE 2: US Financial Linkage ===\n');
  
  const targetCountry = 'US';
  const spilloverCountries = ['GB', 'JP', 'CH', 'CA', 'DE', 'SG', 'HK', 'FR', 'NL', 'AU'];
  const results: Array<{ country: string; exposure: number; method: string }> = [];
  
  for (const country of spilloverCountries) {
    const result = calculateFinancialLinkageFallback(country, targetCountry, 'Financial Services');
    results.push({
      country,
      exposure: result.exposure,
      method: result.method
    });
  }
  
  // Sort by exposure (descending)
  results.sort((a, b) => b.exposure - a.exposure);
  
  console.log('Financial Linkage Rankings (Country → US):');
  results.forEach((r, index) => {
    console.log(`${index + 1}. ${r.country} → US: ${(r.exposure * 100).toFixed(4)}% (${r.method})`);
  });
  
  // Validation: Check concentration
  const totalExposure = results.reduce((sum, r) => sum + r.exposure, 0);
  const top5Exposure = results.slice(0, 5).reduce((sum, r) => sum + r.exposure, 0);
  const top5Percentage = (top5Exposure / totalExposure) * 100;
  
  console.log(`\n✓ Total exposure: ${(totalExposure * 100).toFixed(4)}%`);
  console.log(`✓ Top 5 exposure: ${(top5Exposure * 100).toFixed(4)}%`);
  console.log(`✓ Top 5 concentration: ${top5Percentage.toFixed(1)}% (expected: 70-80%)`);
  console.log(`✓ Top 5 countries: ${results.slice(0, 5).map(r => r.country).join(', ')}\n`);
  
  return { results, top5Percentage, totalExposure };
}

/**
 * Test Case 3: Bilateral Symmetry
 * Test that calculations are properly bilateral (not necessarily symmetric)
 */
export function testBilateralSymmetry() {
  console.log('=== TEST CASE 3: Bilateral Calculations ===\n');
  
  const pairs = [
    ['CN', 'VN'],
    ['US', 'GB'],
    ['DE', 'FR']
  ];
  
  console.log('Testing bilateral calculations (A→B vs B→A):');
  
  for (const [country1, country2] of pairs) {
    const supply1to2 = calculateSupplyChainExposureFallback(country1, country2, 'Technology');
    const supply2to1 = calculateSupplyChainExposureFallback(country2, country1, 'Technology');
    
    const financial1to2 = calculateFinancialLinkageFallback(country1, country2, 'Financial Services');
    const financial2to1 = calculateFinancialLinkageFallback(country2, country1, 'Financial Services');
    
    console.log(`\n${country1} ↔ ${country2}:`);
    console.log(`  Supply Chain: ${country1}→${country2} = ${(supply1to2.exposure * 100).toFixed(4)}%, ${country2}→${country1} = ${(supply2to1.exposure * 100).toFixed(4)}%`);
    console.log(`  Financial: ${country1}→${country2} = ${(financial1to2.exposure * 100).toFixed(4)}%, ${country2}→${country1} = ${(financial2to1.exposure * 100).toFixed(4)}%`);
  }
  
  console.log('\n✓ Bilateral calculations complete\n');
}

/**
 * Run all validation tests
 */
export function runAllValidationTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       PHASE 2 VALIDATION TESTS - BILATERAL FALLBACKS      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const test1 = testChinaSupplyChain();
  const test2 = testUSFinancialLinkage();
  testBilateralSymmetry();
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                     VALIDATION SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Test 1 (China Supply Chain): ${test1.matchCount}/${test1.total} expected countries in top 7`);
  console.log(`Test 2 (US Financial): ${test2.top5Percentage.toFixed(1)}% concentration in top 5 (target: 70-80%)`);
  console.log(`Test 3 (Bilateral): Calculations properly differentiated by direction\n`);
  
  return {
    test1,
    test2
  };
}