/**
 * Test script for Region Decomposition (Phase 2 - Task 1)
 * 
 * Verifies that:
 * 1. Americas decomposed correctly (U.S. 90%, Canada 7%, Latin America 3%)
 * 2. Europe decomposed using GDP weights
 * 3. Rest of Asia Pacific decomposed using GDP weights
 * 4. Decomposed values sum to original totals
 * 5. Integration with Apple's actual revenue geography data
 */

import { ENHANCED_COMPANY_EXPOSURES } from './src/data/enhancedCompanyExposures';
import {
  decomposeAmericas,
  decomposeEurope,
  decomposeRestOfAsiaPacific,
  decomposeRevenueGeography,
  convertToPercentages,
  type RegionalSegment
} from './src/services/regionDecomposition';

console.log('='.repeat(80));
console.log('PHASE 2 - TASK 1: Region Decomposition Test');
console.log('='.repeat(80));

// Test Case 1: Americas Decomposition
console.log('\n📊 TEST CASE 1: Americas Decomposition');
console.log('-'.repeat(80));

const americasValue = 169148; // Apple's Americas revenue in millions USD
const americasResult = decomposeAmericas(americasValue, 'millions_usd');

console.log('\n✅ Americas Decomposition Results:');
for (const allocation of americasResult.countries) {
  console.log(`   ${allocation.country.padEnd(20)} $${allocation.value.toFixed(0).padStart(8)}M (${allocation.percentage.toFixed(1)}%)`);
}

console.log('\n📋 Validation:');
console.log(`   Original value: $${americasResult.originalValue.toFixed(0)}M`);
console.log(`   Decomposed total: $${americasResult.totalDecomposed.toFixed(0)}M`);
console.log(`   Validation: ${americasResult.validationPassed ? '✅ PASS' : '❌ FAIL'}`);
if (americasResult.validationError) {
  console.log(`   Error: ${americasResult.validationError}`);
}

// Test Case 2: Europe Decomposition
console.log('\n\n📊 TEST CASE 2: Europe Decomposition');
console.log('-'.repeat(80));

const europeValue = 101328; // Apple's Europe revenue in millions USD
const europeResult = decomposeEurope(europeValue, 'millions_usd');

console.log('\n✅ Europe Decomposition Results (Top 10):');
for (const allocation of europeResult.countries.slice(0, 10)) {
  console.log(`   ${allocation.country.padEnd(20)} $${allocation.value.toFixed(0).padStart(8)}M (${allocation.percentage.toFixed(1)}%)`);
}

console.log('\n📋 Validation:');
console.log(`   Original value: $${europeResult.originalValue.toFixed(0)}M`);
console.log(`   Decomposed total: $${europeResult.totalDecomposed.toFixed(0)}M`);
console.log(`   Countries allocated: ${europeResult.countries.length}`);
console.log(`   Validation: ${europeResult.validationPassed ? '✅ PASS' : '❌ FAIL'}`);

// Test Case 3: Rest of Asia Pacific Decomposition
console.log('\n\n📊 TEST CASE 3: Rest of Asia Pacific Decomposition');
console.log('-'.repeat(80));

const apacValue = 29615; // Apple's Rest of Asia Pacific revenue in millions USD
const apacResult = decomposeRestOfAsiaPacific(apacValue, 'millions_usd');

console.log('\n✅ Rest of Asia Pacific Decomposition Results:');
for (const allocation of apacResult.countries) {
  console.log(`   ${allocation.country.padEnd(20)} $${allocation.value.toFixed(0).padStart(8)}M (${allocation.percentage.toFixed(1)}%)`);
}

console.log('\n📋 Validation:');
console.log(`   Original value: $${apacResult.originalValue.toFixed(0)}M`);
console.log(`   Decomposed total: $${apacResult.totalDecomposed.toFixed(0)}M`);
console.log(`   Countries allocated: ${apacResult.countries.length}`);
console.log(`   Validation: ${apacResult.validationPassed ? '✅ PASS' : '❌ FAIL'}`);

// Test Case 4: Full Apple Revenue Geography Decomposition
console.log('\n\n📊 TEST CASE 4: Apple (AAPL) - Full Revenue Geography Decomposition');
console.log('-'.repeat(80));

const appleData = ENHANCED_COMPANY_EXPOSURES['AAPL'];
const appleRevenueGeo: RegionalSegment[] = appleData.revenueGeography.map(seg => ({
  segment: seg.segment,
  value: seg.value,
  unit: 'millions_usd'
}));

console.log('\n📥 Original Apple Revenue Geography:');
let totalOriginal = 0;
for (const seg of appleRevenueGeo) {
  console.log(`   ${seg.segment.padEnd(30)} $${seg.value.toFixed(0).padStart(8)}M`);
  totalOriginal += seg.value;
}
console.log(`   ${'Total'.padEnd(30)} $${totalOriginal.toFixed(0).padStart(8)}M`);

const appleAllocations = decomposeRevenueGeography(appleRevenueGeo);
const applePercentages = convertToPercentages(appleAllocations);

console.log('\n✅ Decomposed Country-Level Allocations (Top 15):');
const sortedApple = Array.from(applePercentages.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

for (const [country, percentage] of sortedApple) {
  const absoluteValue = appleAllocations.get(country) || 0;
  console.log(`   ${country.padEnd(20)} ${percentage.toFixed(1).padStart(5)}%  $${absoluteValue.toFixed(0).padStart(8)}M`);
}

// Validation
const totalDecomposed = Array.from(appleAllocations.values()).reduce((sum, val) => sum + val, 0);
const totalPercentage = Array.from(applePercentages.values()).reduce((sum, val) => sum + val, 0);

console.log('\n📋 Validation:');
console.log(`   Original total: $${totalOriginal.toFixed(0)}M`);
console.log(`   Decomposed total: $${totalDecomposed.toFixed(0)}M`);
console.log(`   Difference: $${Math.abs(totalOriginal - totalDecomposed).toFixed(2)}M`);
console.log(`   Total percentage: ${totalPercentage.toFixed(2)}%`);
console.log(`   Validation: ${Math.abs(totalOriginal - totalDecomposed) < 1 && Math.abs(totalPercentage - 100) < 0.1 ? '✅ PASS' : '❌ FAIL'}`);

// Test Case 5: Expected Country Allocations
console.log('\n\n📊 TEST CASE 5: Expected vs Actual Country Allocations');
console.log('-'.repeat(80));

const expectedAllocations: Record<string, { min: number; max: number }> = {
  'United States': { min: 35, max: 42 },  // ~39% expected (90% of 43% Americas)
  'China': { min: 15, max: 19 },          // ~17% (Greater China)
  'Germany': { min: 4, max: 7 },          // ~5.7% (22% of 26% Europe)
  'United Kingdom': { min: 3, max: 6 },   // ~4.7% (18% of 26% Europe)
  'Japan': { min: 5, max: 7 },            // ~6% (direct)
  'Canada': { min: 2, max: 4 },           // ~3% (7% of 43% Americas)
  'Australia': { min: 2, max: 4 }         // ~2.8% (35% of 8% APAC)
};

console.log('\nCountry Allocation Validation:');
let passedChecks = 0;
let totalChecks = 0;

for (const [country, expected] of Object.entries(expectedAllocations)) {
  const actual = applePercentages.get(country) || 0;
  const inRange = actual >= expected.min && actual <= expected.max;
  const status = inRange ? '✅' : '❌';
  
  console.log(`   ${country.padEnd(20)} Expected: ${expected.min}-${expected.max}%  Actual: ${actual.toFixed(1)}%  ${status}`);
  
  if (inRange) passedChecks++;
  totalChecks++;
}

console.log(`\n   Passed: ${passedChecks}/${totalChecks} checks`);

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));

console.log('\n✅ Task 1 Implementation Status:');
console.log('   1. ✅ Americas decomposition implemented (U.S. 90%, Canada 7%, Latin America 3%)');
console.log('   2. ✅ Europe decomposition implemented (GDP-weighted)');
console.log('   3. ✅ Rest of Asia Pacific decomposition implemented (GDP-weighted)');
console.log(`   4. ${americasResult.validationPassed && europeResult.validationPassed && apacResult.validationPassed ? '✅' : '❌'} All decompositions pass validation`);
console.log(`   5. ${Math.abs(totalOriginal - totalDecomposed) < 1 ? '✅' : '❌'} Full pipeline validation passed`);
console.log(`   6. ${passedChecks >= 5 ? '✅' : '⚠️'} Country allocations within expected ranges (${passedChecks}/${totalChecks})`);

console.log('\n🎯 Key Metrics:');
console.log(`   - U.S. allocation: ${(applePercentages.get('United States') || 0).toFixed(1)}% (expected: 35-42%)`);
console.log(`   - China allocation: ${(applePercentages.get('China') || 0).toFixed(1)}% (expected: 15-19%)`);
console.log(`   - Total countries: ${appleAllocations.size}`);
console.log(`   - Total percentage: ${totalPercentage.toFixed(2)}%`);

console.log('\n' + '='.repeat(80));
console.log('Test completed!');
console.log('='.repeat(80));