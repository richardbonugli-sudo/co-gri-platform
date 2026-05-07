/**
 * Simple verification script to test channel-specific fallback system
 * This can be imported and run to verify the system works
 */

import { getChannelFallbackTemplate, applyChannelFallback } from '@/services/channelFallbackService';
import { initializeChannel, addChannelEvidence, normalizeChannel, blendChannels } from '@/utils/channelExposureBuilder';
import { CHANNEL_WEIGHTS } from '@/utils/channelExposureBuilder';

export function testChannelSystem() {
  console.log('🧪 Testing Channel-Specific Fallback System...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test 1: Initialize channels
  try {
    const revenueChannel = initializeChannel('revenue', CHANNEL_WEIGHTS.revenue);
    console.log('✅ Test 1: Channel initialization - PASSED');
    console.log(`   Revenue channel weight: ${revenueChannel.weight}`);
    results.passed++;
    results.tests.push({ name: 'Channel initialization', status: 'PASSED' });
  } catch (error) {
    console.error('❌ Test 1: Channel initialization - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Channel initialization', status: 'FAILED', error: error.message });
  }
  
  // Test 2: Get fallback template
  try {
    const techSupplyTemplate = getChannelFallbackTemplate('supply', 'Technology', 'United States');
    console.log('\n✅ Test 2: Get fallback template - PASSED');
    console.log(`   Technology supply chain template has ${techSupplyTemplate.size} countries`);
    console.log(`   Sample countries: ${Array.from(techSupplyTemplate.keys()).slice(0, 5).join(', ')}`);
    results.passed++;
    results.tests.push({ name: 'Get fallback template', status: 'PASSED' });
  } catch (error) {
    console.error('\n❌ Test 2: Get fallback template - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Get fallback template', status: 'FAILED', error: error.message });
  }
  
  // Test 3: Add evidence
  try {
    const testChannel = initializeChannel('revenue', CHANNEL_WEIGHTS.revenue);
    addChannelEvidence(testChannel, 'United States', 0.42, 'evidence', 'SEC 10-K Filing');
    addChannelEvidence(testChannel, 'China', 0.19, 'evidence', 'SEC 10-K Filing');
    console.log('\n✅ Test 3: Add evidence - PASSED');
    console.log(`   Added evidence for 2 countries`);
    console.log(`   US: ${testChannel.countries.get('United States')?.value}`);
    console.log(`   China: ${testChannel.countries.get('China')?.value}`);
    results.passed++;
    results.tests.push({ name: 'Add evidence', status: 'PASSED' });
  } catch (error) {
    console.error('\n❌ Test 3: Add evidence - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Add evidence', status: 'FAILED', error: error.message });
  }
  
  // Test 4: Apply fallback with evidence protection
  try {
    const testChannel = initializeChannel('supply', CHANNEL_WEIGHTS.supply);
    addChannelEvidence(testChannel, 'United States', 0.10, 'evidence', 'Company Report');
    
    const beforeFallback = testChannel.countries.get('United States')?.value;
    const afterFallback = applyChannelFallback(testChannel.countries, 'supply', 'Technology', 'United States');
    const afterValue = afterFallback.get('United States')?.value;
    
    if (beforeFallback === afterValue) {
      console.log('\n✅ Test 4: Evidence protection - PASSED');
      console.log(`   US value protected: ${beforeFallback} (evidence not overwritten)`);
      results.passed++;
      results.tests.push({ name: 'Evidence protection', status: 'PASSED' });
    } else {
      throw new Error(`Evidence was overwritten! Before: ${beforeFallback}, After: ${afterValue}`);
    }
  } catch (error) {
    console.error('\n❌ Test 4: Evidence protection - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Evidence protection', status: 'FAILED', error: error.message });
  }
  
  // Test 5: Normalize channel
  try {
    const testChannel = initializeChannel('revenue', CHANNEL_WEIGHTS.revenue);
    addChannelEvidence(testChannel, 'United States', 0.42, 'evidence', 'SEC 10-K');
    addChannelEvidence(testChannel, 'China', 0.19, 'evidence', 'SEC 10-K');
    addChannelEvidence(testChannel, 'Europe', 0.25, 'evidence', 'SEC 10-K');
    
    normalizeChannel(testChannel);
    
    let total = 0;
    for (const [_, data] of testChannel.countries.entries()) {
      if (data.valueNorm > 0) {
        total += data.valueNorm;
      }
    }
    
    if (Math.abs(total - 1.0) < 0.001) {
      console.log('\n✅ Test 5: Channel normalization - PASSED');
      console.log(`   Total normalized: ${total.toFixed(4)} (should be 1.0)`);
      results.passed++;
      results.tests.push({ name: 'Channel normalization', status: 'PASSED' });
    } else {
      throw new Error(`Normalization failed! Total: ${total}, Expected: 1.0`);
    }
  } catch (error) {
    console.error('\n❌ Test 5: Channel normalization - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Channel normalization', status: 'FAILED', error: error.message });
  }
  
  // Test 6: Blend channels
  try {
    const channelBreakdown = {
      revenue: initializeChannel('revenue', CHANNEL_WEIGHTS.revenue),
      supply: initializeChannel('supply', CHANNEL_WEIGHTS.supply),
      assets: initializeChannel('assets', CHANNEL_WEIGHTS.assets),
      financial: initializeChannel('financial', CHANNEL_WEIGHTS.financial),
      counterparty: initializeChannel('counterparty', CHANNEL_WEIGHTS.counterparty)
    };
    
    // Add some test data
    addChannelEvidence(channelBreakdown.revenue, 'United States', 0.42, 'evidence', 'SEC 10-K');
    addChannelEvidence(channelBreakdown.supply, 'China', 0.35, 'fallback', 'Sector template');
    addChannelEvidence(channelBreakdown.assets, 'United States', 0.50, 'fallback', 'Sector template');
    
    normalizeChannel(channelBreakdown.revenue);
    normalizeChannel(channelBreakdown.supply);
    normalizeChannel(channelBreakdown.assets);
    normalizeChannel(channelBreakdown.financial);
    normalizeChannel(channelBreakdown.counterparty);
    
    const blended = blendChannels(channelBreakdown);
    
    console.log('\n✅ Test 6: Channel blending - PASSED');
    console.log(`   Blended ${blended.size} countries`);
    console.log(`   Sample: US blended value = ${blended.get('United States')?.blendedPreNorm.toFixed(4) || 'N/A'}`);
    results.passed++;
    results.tests.push({ name: 'Channel blending', status: 'PASSED' });
  } catch (error) {
    console.error('\n❌ Test 6: Channel blending - FAILED', error);
    results.failed++;
    results.tests.push({ name: 'Channel blending', status: 'FAILED', error: error.message });
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  
  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }
  
  console.log('='.repeat(60));
  
  return results;
}

// Auto-run if imported
if (typeof window !== 'undefined') {
  console.log('Channel verification module loaded. Call testChannelSystem() to run tests.');
}
