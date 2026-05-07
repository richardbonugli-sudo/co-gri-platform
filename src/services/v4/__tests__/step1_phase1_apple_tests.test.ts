/**
 * Step 1 Phase 1 Tests - Apple (AAPL) Test Cases
 * 
 * Tests the Phase 1 fixes for:
 * 1. Enhanced table detection
 * 2. Evidence locking mechanism
 * 3. RF-B/C/D decision logic
 * 4. Proper evidence priority
 */

import { describe, it, expect } from 'vitest';
import { Channel, EntityKind, FallbackType } from '@/types/v4Types';
import { allocateChannel_V4_Enhanced } from '../v4Orchestrator_enhanced';
import { extractEvidenceBundle_V4_Enhanced } from '../evidenceExtractor_enhanced';

describe('Step 1 Phase 1 - Apple Revenue Channel Tests', () => {
  
  it('should detect and use structured revenue tables', () => {
    // Apple Revenue Data: Segment Operating Performance + Net Sales tables
    const appleData = {
      ticker: 'AAPL',
      revenueGeography: [
        { segment: 'Americas', value: 178353, unit: 'currency', percentage: 43 },
        { segment: 'Europe', value: 111032, unit: 'currency', percentage: 27 },
        { segment: 'Greater China', value: 64377, unit: 'currency', percentage: 15 },
        { segment: 'Japan', value: 28703, unit: 'currency', percentage: 7 },
        { segment: 'Rest of Asia Pacific', value: 33696, unit: 'currency', percentage: 8 },
        { label: 'Total', value: 416161, unit: 'currency', isTotal: true }
      ],
      geographicSegments: [
        { name: 'United States', revenue: 151790, percentage: 36 },
        { name: 'China', revenue: 64377, percentage: 15 },
        { name: 'Other countries', revenue: 199994, percentage: 48 }
      ],
      footnotes: [
        { text: 'Greater China includes China mainland, Hong Kong and Taiwan' },
        { text: 'Americas includes North and South America' },
        { text: 'Europe includes Europe, India, the Middle East and Africa' },
        { text: 'Rest of Asia Pacific includes Australia, New Zealand, and Asian countries not included elsewhere' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify structured items detected
    expect(evidenceBundle.structuredItems.length).toBeGreaterThan(0);
    
    // Verify segment labels classified correctly
    const americasItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'Americas'
    );
    expect(americasItem).toBeDefined();
    expect(americasItem?.entityKind).toBe(EntityKind.GEO_LABEL);
    
    // Verify Japan classified as COUNTRY
    const japanItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'Japan'
    );
    expect(japanItem).toBeDefined();
    expect(japanItem?.entityKind).toBe(EntityKind.COUNTRY);
    
    // Verify definitions extracted from footnotes
    expect(evidenceBundle.narrative.definitions.size).toBeGreaterThan(0);
    
    const greaterChinaDef = evidenceBundle.narrative.definitions.get('Greater China');
    expect(greaterChinaDef).toBeDefined();
    expect(greaterChinaDef?.includes).toContain('China');
    expect(greaterChinaDef?.includes).toContain('Hong Kong');
    expect(greaterChinaDef?.includes).toContain('Taiwan');
  });
  
  it('should allocate Japan as DIRECT and lock it', () => {
    const appleData = {
      ticker: 'AAPL',
      revenueGeography: [
        { segment: 'Japan', value: 0.07, unit: 'pct' },
        { segment: 'Greater China', value: 0.15, unit: 'pct' },
        { segment: 'Americas', value: 0.43, unit: 'pct' },
        { segment: 'Europe', value: 0.27, unit: 'pct' },
        { segment: 'Rest of Asia Pacific', value: 0.08, unit: 'pct' }
      ],
      footnotes: [
        { text: 'Greater China includes China mainland, Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify Japan allocated directly
    expect(result.trace.directAlloc.has('Japan')).toBe(true);
    expect(result.trace.directAlloc.get('Japan')).toBeCloseTo(0.07, 2);
    
    // Verify Japan is locked (appears in step log)
    const lockLog = result.trace.stepLog.find(log => 
      log.includes('locked') && log.includes('1 countries')
    );
    expect(lockLog).toBeDefined();
    
    // Verify final weights include Japan
    expect(result.weights.has('Japan')).toBe(true);
  });
  
  it('should apply SSF to Greater China label', () => {
    const appleData = {
      ticker: 'AAPL',
      revenueGeography: [
        { segment: 'Greater China', value: 0.15, unit: 'pct' }
      ],
      footnotes: [
        { text: 'Greater China includes China mainland, Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify SSF was used for Greater China
    const greaterChinaAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Greater China'
    );
    expect(greaterChinaAlloc).toBeDefined();
    expect(greaterChinaAlloc?.fallbackUsed).toBe(FallbackType.SSF);
    
    // Verify China, Hong Kong, Taiwan all received allocation
    expect(result.weights.has('China')).toBe(true);
    expect(result.weights.has('Hong Kong')).toBe(true);
    expect(result.weights.has('Taiwan')).toBe(true);
    
    // Verify total for these three countries is approximately 15%
    const chinaWeight = result.weights.get('China') || 0;
    const hkWeight = result.weights.get('Hong Kong') || 0;
    const twWeight = result.weights.get('Taiwan') || 0;
    const totalWeight = chinaWeight + hkWeight + twWeight;
    expect(totalWeight).toBeCloseTo(0.15, 2);
  });
  
  it('should enforce China cap at 15% (not exceed Greater China bucket)', () => {
    const appleData = {
      ticker: 'AAPL',
      revenueGeography: [
        { segment: 'Greater China', value: 0.15, unit: 'pct' },
        { segment: 'Americas', value: 0.43, unit: 'pct' },
        { segment: 'Europe', value: 0.27, unit: 'pct' },
        { segment: 'Japan', value: 0.07, unit: 'pct' },
        { segment: 'Rest of Asia Pacific', value: 0.08, unit: 'pct' }
      ],
      footnotes: [
        { text: 'Greater China includes China mainland, Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // China should not exceed 15% (the Greater China bucket total)
    const chinaWeight = result.weights.get('China') || 0;
    expect(chinaWeight).toBeLessThanOrEqual(0.15);
    
    // China + Hong Kong + Taiwan should equal approximately 15%
    const hkWeight = result.weights.get('Hong Kong') || 0;
    const twWeight = result.weights.get('Taiwan') || 0;
    const totalWeight = chinaWeight + hkWeight + twWeight;
    expect(totalWeight).toBeCloseTo(0.15, 2);
  });
});

describe('Step 1 Phase 1 - Apple Physical Assets Channel Tests', () => {
  
  it('should detect long-lived assets table', () => {
    const appleData = {
      ticker: 'AAPL',
      ppeData: {
        items: [
          { country: 'United States', value: 0.81, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.12, unit: 'pct' }
        ]
      },
      footnotes: [
        { text: 'China includes Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    // Verify structured items detected
    expect(evidenceBundle.structuredItems.length).toBe(3);
    
    // Verify US classified as COUNTRY
    const usItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'United States'
    );
    expect(usItem).toBeDefined();
    expect(usItem?.entityKind).toBe(EntityKind.COUNTRY);
    
    // Verify "Other countries" classified as NONSTANDARD_LABEL
    const otherItem = evidenceBundle.structuredItems.find(item => 
      item.canonicalLabel === 'Other countries'
    );
    expect(otherItem).toBeDefined();
    expect(otherItem?.entityKind).toBe(EntityKind.NONSTANDARD_LABEL);
  });
  
  it('should allocate US at 81% via DIRECT and lock it', () => {
    const appleData = {
      ticker: 'AAPL',
      ppeData: {
        items: [
          { country: 'United States', value: 0.81, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.12, unit: 'pct' }
        ]
      },
      footnotes: [
        { text: 'China includes Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify US allocated directly at 81%
    expect(result.trace.directAlloc.has('United States')).toBe(true);
    expect(result.trace.directAlloc.get('United States')).toBeCloseTo(0.81, 2);
    
    // Verify US is locked
    const lockLog = result.trace.stepLog.find(log => 
      log.includes('locked') && log.includes('1 countries')
    );
    expect(lockLog).toBeDefined();
    
    // Verify final weight for US is 81%
    expect(result.weights.get('United States')).toBeCloseTo(0.81, 2);
  });
  
  it('should apply SSF to China bucket (includes HK and Taiwan)', () => {
    const appleData = {
      ticker: 'AAPL',
      ppeData: {
        items: [
          { country: 'United States', value: 0.81, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.12, unit: 'pct' }
        ]
      },
      footnotes: [
        { text: 'China includes Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    // Verify China definition extracted
    const chinaDef = evidenceBundle.narrative.definitions.get('China');
    expect(chinaDef).toBeDefined();
    expect(chinaDef?.includes).toContain('China');
    expect(chinaDef?.includes).toContain('Hong Kong');
    expect(chinaDef?.includes).toContain('Taiwan');
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify SSF was used for China bucket
    const chinaAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'China'
    );
    expect(chinaAlloc?.fallbackUsed).toBe(FallbackType.SSF);
    
    // Verify China, Hong Kong, Taiwan all received allocation
    expect(result.weights.has('China')).toBe(true);
    expect(result.weights.has('Hong Kong')).toBe(true);
    expect(result.weights.has('Taiwan')).toBe(true);
    
    // Verify total is approximately 7%
    const chinaWeight = result.weights.get('China') || 0;
    const hkWeight = result.weights.get('Hong Kong') || 0;
    const twWeight = result.weights.get('Taiwan') || 0;
    const totalWeight = chinaWeight + hkWeight + twWeight;
    expect(totalWeight).toBeCloseTo(0.07, 2);
  });
  
  it('should apply RF-A or RF-B to "Other countries" residual', () => {
    const appleData = {
      ticker: 'AAPL',
      ppeData: {
        items: [
          { country: 'United States', value: 0.81, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.12, unit: 'pct' }
        ]
      },
      footnotes: [
        { text: 'China includes Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify RF was used for "Other countries"
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other countries'
    );
    expect(otherAlloc).toBeDefined();
    expect([FallbackType.RF_A, FallbackType.RF_B, FallbackType.RF_C, FallbackType.RF_D])
      .toContain(otherAlloc?.fallbackUsed);
    
    // Verify "Other countries" allocated to multiple countries (not just one)
    const otherCountries = otherAlloc?.outputCountries;
    expect(otherCountries?.size).toBeGreaterThan(1);
    
    // Verify total weight is approximately 12%
    let totalOtherWeight = 0;
    otherCountries?.forEach(weight => {
      totalOtherWeight += weight;
    });
    expect(totalOtherWeight).toBeCloseTo(0.12, 2);
  });
  
  it('should NOT show Ireland (not in latest 10-K)', () => {
    // This test verifies that cached/stale data is not used
    const appleData = {
      ticker: 'AAPL',
      ppeData: {
        items: [
          { country: 'United States', value: 0.81, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.12, unit: 'pct' }
        ]
      },
      footnotes: [
        { text: 'China includes Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      appleData,
      Channel.ASSETS,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Ireland should NOT appear as a direct allocation
    expect(result.trace.directAlloc.has('Ireland')).toBe(false);
    
    // If Ireland appears in final weights, it should only be from RF allocation
    // of "Other countries", not as a direct structured item
    const structuredCountries = evidenceBundle.structuredItems
      .filter(item => item.entityKind === EntityKind.COUNTRY)
      .map(item => item.canonicalLabel);
    
    expect(structuredCountries).not.toContain('Ireland');
  });
});

describe('Step 1 Phase 1 - Evidence Locking Tests', () => {
  
  it('should prevent RF from overriding DIRECT allocations', () => {
    const testData = {
      ticker: 'TEST',
      revenueGeography: [
        { segment: 'United States', value: 0.50, unit: 'pct' },
        { segment: 'Other countries', value: 0.50, unit: 'pct' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      testData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify US was allocated directly
    expect(result.trace.directAlloc.has('United States')).toBe(true);
    expect(result.trace.directAlloc.get('United States')).toBeCloseTo(0.50, 2);
    
    // Verify US weight in final result is still 50% (not overridden by RF)
    expect(result.weights.get('United States')).toBeCloseTo(0.50, 2);
    
    // Verify "Other countries" was allocated via RF
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other countries'
    );
    expect(otherAlloc).toBeDefined();
    
    // Verify US was excluded from RF allocation
    expect(otherAlloc?.exclusionsApplied.has('United States')).toBe(true);
  });
  
  it('should lock countries after SSF allocation', () => {
    const testData = {
      ticker: 'TEST',
      revenueGeography: [
        { segment: 'Greater China', value: 0.30, unit: 'pct' },
        { segment: 'Other countries', value: 0.70, unit: 'pct' }
      ],
      footnotes: [
        { text: 'Greater China includes China, Hong Kong and Taiwan' }
      ]
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      testData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify Greater China allocated via SSF
    const gcAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Greater China'
    );
    expect(gcAlloc?.fallbackUsed).toBe(FallbackType.SSF);
    
    // Verify "Other countries" allocated via RF
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other countries'
    );
    expect(otherAlloc).toBeDefined();
    
    // Verify China, Hong Kong, Taiwan were excluded from "Other countries" RF allocation
    expect(otherAlloc?.exclusionsApplied.has('China')).toBe(true);
    expect(otherAlloc?.exclusionsApplied.has('Hong Kong')).toBe(true);
    expect(otherAlloc?.exclusionsApplied.has('Taiwan')).toBe(true);
  });
});

describe('Step 1 Phase 1 - RF-B/C/D Decision Logic Tests', () => {
  
  it('should return RF-B when named countries exist', () => {
    const testData = {
      ticker: 'TEST',
      revenueGeography: [
        { segment: 'Other countries', value: 1.0, unit: 'pct' }
      ],
      narrativeText: {
        revenue: 'Our products are manufactured primarily in China, Vietnam, and India.'
      }
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      testData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify named countries extracted
    expect(evidenceBundle.narrative.namedCountries.size).toBeGreaterThan(0);
    expect(evidenceBundle.narrative.namedCountries.has('China')).toBe(true);
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify RF-B was used (not RF-A)
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other countries'
    );
    expect(otherAlloc?.fallbackUsed).toBe(FallbackType.RF_B);
    expect(otherAlloc?.reason).toContain('named countries');
  });
  
  it('should return RF-C when geo labels exist', () => {
    const testData = {
      ticker: 'TEST',
      revenueGeography: [
        { segment: 'Other regions', value: 1.0, unit: 'pct' }
      ],
      narrativeText: {
        revenue: 'We operate primarily in Asia and Europe.'
      }
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      testData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify geo labels extracted
    expect(evidenceBundle.narrative.geoLabels.size).toBeGreaterThan(0);
    expect(evidenceBundle.narrative.geoLabels.has('Asia')).toBe(true);
    expect(evidenceBundle.narrative.geoLabels.has('Europe')).toBe(true);
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify RF-C was used
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other regions'
    );
    expect(otherAlloc?.fallbackUsed).toBe(FallbackType.RF_C);
    expect(otherAlloc?.reason).toContain('geo labels');
  });
  
  it('should return RF-A when no membership evidence exists', () => {
    const testData = {
      ticker: 'TEST',
      revenueGeography: [
        { segment: 'Other countries', value: 1.0, unit: 'pct' }
      ]
      // No narrative, no named countries, no geo labels
    };
    
    const evidenceBundle = extractEvidenceBundle_V4_Enhanced(
      testData,
      Channel.REVENUE,
      'Technology',
      'United States'
    );
    
    // Verify no membership evidence
    expect(evidenceBundle.narrative.namedCountries.size).toBe(0);
    expect(evidenceBundle.narrative.geoLabels.size).toBe(0);
    
    const result = allocateChannel_V4_Enhanced(evidenceBundle);
    
    // Verify RF-A was used (conservative fallback)
    const otherAlloc = result.trace.labelAllocations.find(alloc => 
      alloc.label === 'Other countries'
    );
    expect(otherAlloc?.fallbackUsed).toBe(FallbackType.RF_A);
    expect(otherAlloc?.reason).toContain('no other evidence');
  });
});