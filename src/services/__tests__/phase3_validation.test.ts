/**
 * Phase 3 Validation Tests - Bilateral Fallback Implementation
 * 
 * Tests the Phase 2 bilateral fallback services to verify:
 * 1. China supply chain rankings match expectations
 * 2. US financial linkage shows proper concentration
 * 3. Sparse tail distribution (long-tail behavior)
 * 4. Smooth decay without plateaus
 * 5. COGRI services remain unaffected (regression test)
 */

import { calculateSupplyChainExposureFallback } from '../dataIntegration/supplyChainFallbackService';
import { calculateFinancialLinkageFallback } from '../dataIntegration/financialFallbackService';

describe('Phase 3 Validation: China Supply Chain Rankings', () => {
  test('Test Case 1: China as target, verify spillover country rankings', () => {
    const targetCountry = 'China';
    const spilloverCountries = ['Vietnam', 'Taiwan', 'South Korea', 'Malaysia', 'Thailand', 'Japan', 'Singapore', 'Indonesia', 'Philippines', 'India', 'United States', 'Germany'];
    const sector = 'Technology';
    
    const results = spilloverCountries.map(country => {
      const result = calculateSupplyChainExposureFallback(country, targetCountry, sector);
      return {
        country,
        exposure: result.exposure,
        exposurePercent: (result.exposure * 100).toFixed(6),
        method: result.method,
        confidence: result.confidence
      };
    });
    
    // Sort by exposure (descending)
    results.sort((a, b) => b.exposure - a.exposure);
    
    console.log('\n=== CHINA SUPPLY CHAIN RANKINGS (Technology Sector) ===');
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.country} → China: ${r.exposurePercent}% (raw: ${r.exposure.toExponential(3)}) (${r.method}, ${r.confidence}% confidence)`);
    });
    
    // EXPECTED RANKINGS (from proposal document):
    // Top 7: Vietnam, Taiwan, South Korea, Malaysia, Thailand, Japan, Singapore (East Asia + ASEAN)
    // Medium: Indonesia, Philippines, India (rank 8-10)
    // Lower: United States, Germany (rank 11-12)
    
    const top7 = results.slice(0, 7).map(r => r.country);
    const expectedTop7 = ['Vietnam', 'Taiwan', 'South Korea', 'Malaysia', 'Thailand', 'Japan', 'Singapore'];
    
    console.log('\nExpected Top 7:', expectedTop7);
    console.log('Actual Top 7:', top7);
    
    // Verify top 7 contains expected countries (order may vary slightly)
    expectedTop7.forEach(country => {
      expect(top7).toContain(country);
    });
    
    // Verify United States and Germany are in bottom 2
    const bottom2 = results.slice(-2).map(r => r.country);
    expect(bottom2).toContain('United States');
    expect(bottom2).toContain('Germany');
    
    // Verify sparse tail (bottom countries should be << 1%)
    const bottomExposure = results[results.length - 1].exposure;
    expect(bottomExposure).toBeLessThan(0.01); // < 1%
    
    console.log('\n✅ Test Case 1: PASSED - China supply chain rankings match expectations');
  });
});

describe('Phase 3 Validation: US Financial Linkage Concentration', () => {
  test('Test Case 2: US as target, verify concentration in top 5', () => {
    const targetCountry = 'United States';
    const spilloverCountries = ['United Kingdom', 'Japan', 'Switzerland', 'Canada', 'Germany', 'Singapore', 'Hong Kong', 'France', 'Netherlands', 'Australia'];
    const sector = 'Financial Services';
    
    const results = spilloverCountries.map(country => {
      const result = calculateFinancialLinkageFallback(country, targetCountry, sector);
      return {
        country,
        exposure: result.exposure,
        exposurePercent: (result.exposure * 100).toFixed(6),
        method: result.method,
        confidence: result.confidence
      };
    });
    
    // Sort by exposure (descending)
    results.sort((a, b) => b.exposure - a.exposure);
    
    console.log('\n=== US FINANCIAL LINKAGE CONCENTRATION (Financial Services Sector) ===');
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.country} → US: ${r.exposurePercent}% (raw: ${r.exposure.toExponential(3)}) (${r.method}, ${r.confidence}% confidence)`);
    });
    
    // EXPECTED: Top 5 (UK, Japan, Switzerland, Canada, Germany) should be 70-80% of total
    const top5Exposure = results.slice(0, 5).reduce((sum, r) => sum + r.exposure, 0);
    const totalExposure = results.reduce((sum, r) => sum + r.exposure, 0);
    const top5Share = (top5Exposure / totalExposure) * 100;
    
    console.log(`\nTop 5 concentration: ${top5Share.toFixed(1)}%`);
    console.log('Expected: 70-80%');
    
    // Verify concentration
    expect(top5Share).toBeGreaterThanOrEqual(70);
    expect(top5Share).toBeLessThanOrEqual(80);
    
    // Verify rapid decay after top 5
    const top5AvgExposure = top5Exposure / 5;
    const bottom5AvgExposure = results.slice(5).reduce((sum, r) => sum + r.exposure, 0) / 5;
    const decayRatio = top5AvgExposure / bottom5AvgExposure;
    
    console.log(`\nDecay ratio (top 5 avg / bottom 5 avg): ${decayRatio.toFixed(2)}x`);
    console.log('Expected: > 3x (rapid decay)');
    
    expect(decayRatio).toBeGreaterThan(3);
    
    console.log('\n✅ Test Case 2: PASSED - US financial linkage shows expected concentration');
  });
});

describe('Phase 3 Validation: Sparse Tail Distribution', () => {
  test('Test Case 3: Verify long-tail behavior (most countries near zero)', () => {
    const targetCountry = 'China';
    const allCountries = [
      'Vietnam', 'Taiwan', 'South Korea', 'Malaysia', 'Thailand', 'Japan', 'Singapore', 'Indonesia', 'Philippines', 'India', 'United States', 'Germany',
      'Brazil', 'Mexico', 'Argentina', 'Chile', 'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Australia', 'New Zealand'
    ];
    const sector = 'Technology';
    
    const results = allCountries.map(country => {
      const result = calculateSupplyChainExposureFallback(country, targetCountry, sector);
      return {
        country,
        exposure: result.exposure,
        exposurePercent: (result.exposure * 100).toFixed(6)
      };
    });
    
    // Sort by exposure (descending)
    results.sort((a, b) => b.exposure - a.exposure);
    
    console.log('\n=== SPARSE TAIL DISTRIBUTION TEST ===');
    
    // Count countries in different exposure ranges
    const veryHigh = results.filter(r => r.exposure >= 0.10).length; // >= 10%
    const high = results.filter(r => r.exposure >= 0.05 && r.exposure < 0.10).length; // 5-10%
    const medium = results.filter(r => r.exposure >= 0.01 && r.exposure < 0.05).length; // 1-5%
    const low = results.filter(r => r.exposure < 0.01).length; // < 1%
    
    console.log(`Very High (>= 10%): ${veryHigh} countries`);
    console.log(`High (5-10%): ${high} countries`);
    console.log(`Medium (1-5%): ${medium} countries`);
    console.log(`Low (< 1%): ${low} countries`);
    
    const totalCountries = results.length;
    const lowPercentage = (low / totalCountries) * 100;
    
    console.log(`\nLow exposure countries: ${lowPercentage.toFixed(1)}% of total`);
    console.log('Expected: > 50% (sparse tail)');
    
    // Verify sparse tail (more than 50% of countries should be < 1%)
    expect(lowPercentage).toBeGreaterThan(50);
    
    console.log('\n✅ Test Case 3: PASSED - Sparse tail distribution verified');
  });
});

describe('Phase 3 Validation: Smooth Decay', () => {
  test('Test Case 4: Verify no plateaus in ranking decay', () => {
    const targetCountry = 'United States';
    const spilloverCountries = [
      'United Kingdom', 'Japan', 'Switzerland', 'Canada', 'Germany', 'France', 'Singapore', 'Hong Kong', 'Netherlands', 'Australia',
      'Italy', 'Spain', 'South Korea', 'Brazil', 'India', 'Mexico', 'Sweden', 'Belgium', 'Norway', 'Denmark'
    ];
    const sector = 'Financial Services';
    
    const results = spilloverCountries.map(country => {
      const result = calculateFinancialLinkageFallback(country, targetCountry, sector);
      return {
        country,
        exposure: result.exposure
      };
    });
    
    // Sort by exposure (descending)
    results.sort((a, b) => b.exposure - a.exposure);
    
    console.log('\n=== SMOOTH DECAY TEST (No Plateaus) ===');
    
    // Calculate decay ratios between consecutive ranks
    const decayRatios: number[] = [];
    for (let i = 0; i < results.length - 1; i++) {
      const ratio = results[i].exposure / results[i + 1].exposure;
      decayRatios.push(ratio);
      console.log(`Rank ${i + 1} → ${i + 2}: ${ratio.toFixed(3)}x decay`);
    }
    
    // Check for plateaus (decay ratio close to 1.0)
    const plateauThreshold = 1.05; // Less than 5% decay = plateau
    const plateaus = decayRatios.filter(ratio => ratio < plateauThreshold);
    
    console.log(`\nPlateaus detected (< ${plateauThreshold}x decay): ${plateaus.length}`);
    console.log('Expected: < 3 (smooth decay, no significant plateaus)');
    
    // Verify smooth decay (no more than 2 plateaus allowed)
    expect(plateaus.length).toBeLessThan(3);
    
    // Verify overall decay trend (top should be >> bottom)
    const topExposure = results[0].exposure;
    const bottomExposure = results[results.length - 1].exposure;
    const overallDecay = topExposure / bottomExposure;
    
    console.log(`\nOverall decay (top / bottom): ${overallDecay.toFixed(2)}x`);
    console.log('Expected: > 10x (smooth exponential decay)');
    
    expect(overallDecay).toBeGreaterThan(10);
    
    console.log('\n✅ Test Case 4: PASSED - Smooth decay verified, no plateaus');
  });
});

describe('Phase 3 Validation: Regression Test', () => {
  test('Test Case 5: Verify scenarioEngine still works correctly', async () => {
    console.log('\n=== REGRESSION TEST: Scenario Engine ===');
    
    // Import scenario engine
    const { calculateScenarioImpact } = await import('../scenarioEngine');
    
    // Test scenario configuration
    const testConfig = {
      eventType: 'Sanctions',
      actorCountry: 'United States',
      targetCountries: ['China'],
      propagationType: 'regional' as const,
      severity: 'high' as const,
      applyAlignmentChanges: false,
      applyExposureChanges: false,
      applySectorSensitivity: false,
      applyTo: {
        type: 'entire' as const
      }
    };
    
    try {
      const scenarioResult = calculateScenarioImpact(testConfig);
      
      console.log('Scenario calculation successful');
      console.log(`Event: ${testConfig.eventType}`);
      console.log(`Target: ${testConfig.targetCountries[0]}`);
      console.log(`Propagation: ${testConfig.propagationType}`);
      console.log(`Countries affected: ${scenarioResult.propagatedCountries.length}`);
      
      // Verify scenario result structure
      expect(scenarioResult).toHaveProperty('shockChanges');
      expect(scenarioResult).toHaveProperty('propagatedCountries');
      expect(scenarioResult).toHaveProperty('inclusionAnalysis');
      expect(scenarioResult.shockChanges.length).toBeGreaterThan(0);
      expect(scenarioResult.propagatedCountries.length).toBeGreaterThan(0);
      
      // Verify bilateral fallback is being used
      const spilloverCountries = scenarioResult.shockChanges.filter(
        sc => !testConfig.targetCountries.includes(sc.country) && sc.country !== testConfig.actorCountry
      );
      
      console.log(`Spillover countries: ${spilloverCountries.length}`);
      
      // Check if any spillover country has channel data sources
      const hasChannelData = spilloverCountries.some(sc => 
        sc.channelDataSources && sc.channelDataSources.length > 0
      );
      
      expect(hasChannelData).toBe(true);
      
      console.log('\n✅ Test Case 5: PASSED - Scenario engine working correctly');
    } catch (error) {
      console.error('❌ Scenario calculation failed:', error);
      throw error;
    }
  });
});