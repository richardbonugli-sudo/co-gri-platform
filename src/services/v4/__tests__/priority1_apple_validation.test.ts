/**
 * Priority 1 Fixes Validation Tests - Apple (AAPL) Test Cases
 * 
 * Tests the three critical fixes:
 * 1. Unit Drift: Raw values preserved until final normalization
 * 2. Direct Allocation Preservation: Japan, U.S., China survive in final output
 * 3. Column Selection: Most recent period selected from multi-period tables
 */

import { describe, it, expect } from 'vitest';
import { allocateChannel_V4 } from '../v4Orchestrator';
import { extractEvidenceBundle_V4 } from '../evidenceExtractor';
import { Channel, EntityKind } from '@/types/v4Types';

describe('Priority 1 Fixes - Apple Validation Tests', () => {
  
  /**
   * Test Fix 1.2: Direct Allocation Preservation - Revenue Channel
   * Expected: Japan appears at ~6.8% (not 0.0003%)
   */
  it('should preserve Japan direct allocation in Revenue channel (~6.8%)', () => {
    // Mock Apple revenue data with Japan as direct country
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      revenueGeography: [
        { segment: 'Americas', value: 178353, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 101328, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Greater China', value: 66952, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { country: 'Japan', value: 24257, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Rest of Asia Pacific', value: 29615, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4(evidenceBundle);
    
    // Verify Japan appears in final weights
    expect(result.weights.has('Japan')).toBe(true);
    
    // Verify Japan weight is approximately 6.8% (24257 / (178353 + 101328 + 66952 + 24257 + 29615) = 6.05%)
    const japanWeight = result.weights.get('Japan')!;
    expect(japanWeight).toBeGreaterThan(0.05); // At least 5%
    expect(japanWeight).toBeLessThan(0.08);    // At most 8%
    
    // Verify Japan is in direct allocations trace
    expect(result.trace.directAlloc.has('Japan')).toBe(true);
    
    // Verify no warning about Japan being lost
    const hasWarning = result.trace.stepLog.some(log => 
      log.includes('WARNING') && log.includes('Japan')
    );
    expect(hasWarning).toBe(false);
  });
  
  /**
   * Test Fix 1.2: Direct Allocation Preservation - Assets Channel
   * Expected: U.S. appears at ~80%, China at ~7%
   */
  it('should preserve U.S. and China direct allocations in Assets channel', () => {
    // Mock Apple assets data (PP&E table)
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      ppeData: {
        items: [
          { country: 'United States', value: 40274, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
          { country: 'China', value: 3617, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
          { label: 'Other countries', value: 5943, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
        ],
        total: 49834,
        source: 'Long-Lived Assets by Geographic Location'
      }
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4(evidenceBundle);
    
    // Verify U.S. appears in final weights
    expect(result.weights.has('United States')).toBe(true);
    
    // Verify U.S. weight is approximately 80% (40274 / 49834 = 80.8%)
    const usWeight = result.weights.get('United States')!;
    expect(usWeight).toBeGreaterThan(0.75); // At least 75%
    expect(usWeight).toBeLessThan(0.85);    // At most 85%
    
    // Verify China appears in final weights
    expect(result.weights.has('China')).toBe(true);
    
    // Verify China weight is approximately 7% (3617 / 49834 = 7.3%)
    const chinaWeight = result.weights.get('China')!;
    expect(chinaWeight).toBeGreaterThan(0.05); // At least 5%
    expect(chinaWeight).toBeLessThan(0.10);    // At most 10%
    
    // Verify both are in direct allocations trace
    expect(result.trace.directAlloc.has('United States')).toBe(true);
    expect(result.trace.directAlloc.has('China')).toBe(true);
  });
  
  /**
   * Test Fix 1.3: Deterministic Column Selection
   * Expected: Most recent year (2025) selected, not mixed with 2024 or 2023
   */
  it('should select most recent period from multi-period revenue table', () => {
    // Mock Apple data with multiple periods
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      revenueGeography: [
        // 2023 data
        { segment: 'Americas', value: 162560, unit: 'abs', period: '2023', year: 2023, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 94294, unit: 'abs', period: '2023', year: 2023, rawUnit: 'millions USD' },
        // 2024 data
        { segment: 'Americas', value: 167050, unit: 'abs', period: '2024', year: 2024, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 97080, unit: 'abs', period: '2024', year: 2024, rawUnit: 'millions USD' },
        // 2025 data (most recent)
        { segment: 'Americas', value: 178353, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 101328, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Greater China', value: 66952, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { country: 'Japan', value: 24257, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Rest of Asia Pacific', value: 29615, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify only 2025 data was extracted
    expect(evidenceBundle.structuredItems.length).toBe(5); // Only 2025 items
    
    // Verify all items are from 2025
    for (const item of evidenceBundle.structuredItems) {
      expect(item.year).toBe(2025);
      expect(item.period).toBe('2025');
    }
    
    // Verify Americas value matches 2025 (178353, not 162560 or 167050)
    const americasItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'Americas'
    );
    expect(americasItem).toBeDefined();
    expect(americasItem!.value).toBe(178353);
  });
  
  /**
   * Test Fix 1.1: Unit Drift Prevention
   * Expected: Raw values preserved as millions USD until final normalization
   */
  it('should preserve raw units (millions USD) until final normalization', () => {
    // Mock Apple revenue data with absolute values
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      revenueGeography: [
        { segment: 'Americas', value: 178353, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 101328, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Greater China', value: 66952, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { country: 'Japan', value: 24257, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Rest of Asia Pacific', value: 29615, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4(evidenceBundle);
    
    // Verify unit mode is tracked as 'abs'
    expect(result.trace.unitMode).toBe('abs');
    
    // Verify structured items preserve raw units
    for (const item of evidenceBundle.structuredItems) {
      expect(item.unit).toBe('abs');
      expect(item.rawUnit).toBe('millions USD');
      // Values should be in millions, not converted to percentages
      expect(item.value).toBeGreaterThan(1000); // Millions, not 0-1 range
    }
    
    // Verify final weights are normalized (sum to 1.0)
    let totalWeight = 0;
    for (const weight of result.weights.values()) {
      totalWeight += weight;
    }
    expect(totalWeight).toBeCloseTo(1.0, 2);
    
    // Verify label allocations track raw units
    for (const labelAlloc of result.trace.labelAllocations) {
      if (labelAlloc.rawUnit) {
        expect(labelAlloc.rawUnit).toBe('millions USD');
      }
    }
  });
  
  /**
   * Test Fix 1.3: Column Selection - Prefer Full Year over Quarters
   * Expected: Full year 2025 selected over Q4 2025
   */
  it('should prefer full year over quarterly data when both exist', () => {
    // Mock data with both full year and quarterly data
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      revenueGeography: [
        // Q4 2025 data
        { segment: 'Americas', value: 45000, unit: 'abs', period: '2025-Q4', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 25000, unit: 'abs', period: '2025-Q4', year: 2025, rawUnit: 'millions USD' },
        // Full year 2025 data (should be preferred)
        { segment: 'Americas', value: 178353, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 101328, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Greater China', value: 66952, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify full year data was selected
    const americasItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'Americas'
    );
    expect(americasItem).toBeDefined();
    expect(americasItem!.value).toBe(178353); // Full year value, not Q4 value
    expect(americasItem!.period).toBe('2025'); // Full year period, not Q4
  });
  
  /**
   * Integration Test: Complete Apple Revenue Channel
   * Tests all three fixes together
   */
  it('should correctly process complete Apple revenue data with all fixes applied', () => {
    const mockAppleData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      homeCountry: 'United States',
      sector: 'Technology',
      revenueGeography: [
        { segment: 'Americas', value: 178353, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Europe', value: 101328, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Greater China', value: 66952, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { country: 'Japan', value: 24257, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' },
        { segment: 'Rest of Asia Pacific', value: 29615, unit: 'abs', period: '2025', year: 2025, rawUnit: 'millions USD' }
      ],
      labelDefinitions: {
        'Greater China': {
          membership: ['China', 'Hong Kong', 'Taiwan'],
          membershipSource: 'Footnote: Greater China includes China, Hong Kong, and Taiwan',
          confidence: 0.9
        }
      }
    };
    
    const evidenceBundle = extractEvidenceBundle_V4(
      mockAppleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4(evidenceBundle);
    
    // Fix 1.2: Japan preserved
    expect(result.weights.has('Japan')).toBe(true);
    expect(result.weights.get('Japan')!).toBeGreaterThan(0.05);
    
    // Fix 1.1: Unit mode tracked correctly
    expect(result.trace.unitMode).toBe('abs');
    
    // Fix 1.3: Correct values extracted (not mixed periods)
    const japanDirect = result.trace.directAlloc.get('Japan');
    expect(japanDirect).toBeDefined();
    
    // Verify SSF allocation for Greater China
    const greaterChinaAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Greater China'
    );
    expect(greaterChinaAlloc).toBeDefined();
    expect(greaterChinaAlloc!.fallbackUsed).toBe('SSF');
    expect(greaterChinaAlloc!.membershipSet.size).toBeGreaterThan(0);
    
    // Verify final weights sum to 1.0
    let totalWeight = 0;
    for (const weight of result.weights.values()) {
      totalWeight += weight;
    }
    expect(totalWeight).toBeCloseTo(1.0, 2);
    
    // Verify no warnings about lost allocations
    const hasWarnings = result.trace.stepLog.some(log => log.includes('WARNING'));
    expect(hasWarnings).toBe(false);
  });
});