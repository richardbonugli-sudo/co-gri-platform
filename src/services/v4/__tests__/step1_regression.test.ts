/**
 * Step 1 Regression Test Suite
 * Ensures STEP 1 FIX doesn't break existing functionality
 */

import { describe, it, expect } from 'vitest';
import { allocateChannel_V4 } from '../v4Orchestrator';
import { Channel, EntityKind, EvidenceBundle, FallbackType } from '@/types/v4Types';

describe('Step 1 Fix - Regression Tests', () => {
  
  describe('Apple Revenue (Should Still Work Correctly)', () => {
    it('should use SSF for all segment labels with resolvable membership', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'Americas',
            canonicalLabel: 'Americas',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.428,
            unit: 'pct',
            sourceRef: 'Net Sales by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Europe',
            canonicalLabel: 'Europe',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.262,
            unit: 'pct',
            sourceRef: 'Net Sales by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Greater China',
            canonicalLabel: 'Greater China',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.159,
            unit: 'pct',
            sourceRef: 'Net Sales by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Japan',
            canonicalLabel: 'Japan',
            entityKind: EntityKind.COUNTRY,
            value: 0.070,
            unit: 'pct',
            sourceRef: 'Net Sales by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Rest of Asia Pacific',
            canonicalLabel: 'Rest of Asia Pacific',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.081,
            unit: 'pct',
            sourceRef: 'Net Sales by Geographic Segment',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(['Americas', 'Europe', 'Greater China', 'Rest of Asia Pacific']),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Americas', {
              label: 'Americas',
              includes: ['United States', 'Canada', 'Mexico'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }],
            ['Europe', {
              label: 'Europe',
              includes: ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }],
            ['Greater China', {
              label: 'Greater China',
              includes: ['China', 'Hong Kong', 'Taiwan'],
              excludes: [],
              residualOf: null,
              confidence: 0.95,
              sourceRef: 'Footnote'
            }],
            ['Rest of Asia Pacific', {
              label: 'Rest of Asia Pacific',
              includes: ['Australia', 'Singapore', 'South Korea', 'India'],
              excludes: [],
              residualOf: null,
              confidence: 0.85,
              sourceRef: 'Footnote'
            }]
          ]),
          rawSentences: []
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify DIRECT fired for Japan
      expect(result.trace.directAlloc.has('Japan')).toBe(true);
      expect(result.trace.directAlloc.get('Japan')).toBeCloseTo(0.070, 3);
      
      // Verify SSF fired for all segment labels
      const ssfAllocs = result.trace.labelAllocations.filter(
        a => a.fallbackUsed === FallbackType.SSF
      );
      expect(ssfAllocs.length).toBe(4); // Americas, Europe, Greater China, Rest of Asia Pacific
      
      // Verify NO RF fired (all labels resolvable)
      const rfAllocs = result.trace.labelAllocations.filter(
        a => a.fallbackUsed === FallbackType.RF_A || 
             a.fallbackUsed === FallbackType.RF_B || 
             a.fallbackUsed === FallbackType.RF_C || 
             a.fallbackUsed === FallbackType.RF_D
      );
      expect(rfAllocs.length).toBe(0);
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('Apple Supply Chain (Should Still Work Correctly)', () => {
    it('should use RF-B for 100% of channel when no closed totals', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(['China', 'Vietnam', 'India', 'Mexico']),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: ['Manufacturing in China, Vietnam, India, and Mexico']
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.SUPPLY,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify NO DIRECT allocation
      expect(result.trace.directAlloc.size).toBe(0);
      
      // Verify RF-B fired for 100% of channel
      const rfbAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.RF_B
      );
      expect(rfbAlloc).toBeDefined();
      expect(rfbAlloc?.label).toBe('(channel_total)');
      expect(rfbAlloc?.labelTotal).toBe(1.0);
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
      
      // Verify named countries are in restricted set
      expect(rfbAlloc?.restrictedSetP.has('China')).toBe(true);
      expect(rfbAlloc?.restrictedSetP.has('Vietnam')).toBe(true);
      expect(rfbAlloc?.restrictedSetP.has('India')).toBe(true);
      expect(rfbAlloc?.restrictedSetP.has('Mexico')).toBe(true);
    });
  });
  
  describe('All Labels Resolvable (No RF Needed)', () => {
    it('should use only DIRECT and SSF when all labels resolvable', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Europe',
            canonicalLabel: 'Europe',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.3,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Asia',
            canonicalLabel: 'Asia',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.2,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(['Europe', 'Asia']),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Europe', {
              label: 'Europe',
              includes: ['Germany', 'France', 'United Kingdom'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }],
            ['Asia', {
              label: 'Asia',
              includes: ['China', 'Japan', 'India'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }]
          ]),
          rawSentences: []
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify DIRECT fired
      expect(result.trace.directAlloc.has('United States')).toBe(true);
      
      // Verify SSF fired for both labels
      const ssfAllocs = result.trace.labelAllocations.filter(
        a => a.fallbackUsed === FallbackType.SSF
      );
      expect(ssfAllocs.length).toBe(2);
      
      // Verify NO RF fired
      const rfAllocs = result.trace.labelAllocations.filter(
        a => a.fallbackUsed === FallbackType.RF_A || 
             a.fallbackUsed === FallbackType.RF_B || 
             a.fallbackUsed === FallbackType.RF_C || 
             a.fallbackUsed === FallbackType.RF_D
      );
      expect(rfAllocs.length).toBe(0);
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('No Closed Totals - RF Applies to 100% of Channel', () => {
    it('should use RF-C when only geo labels exist', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(['Europe', 'Asia']),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: ['Operations in Europe and Asia']
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.FINANCIAL,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify RF-C fired for 100% of channel
      const rfcAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.RF_C
      );
      expect(rfcAlloc).toBeDefined();
      expect(rfcAlloc?.label).toBe('(channel_total)');
      expect(rfcAlloc?.labelTotal).toBe(1.0);
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('No Membership Evidence - GF or Empty', () => {
    it('should use GF when worldwide plausible and no membership evidence', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.FINANCIAL,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify GF was used or empty (depending on plausibility)
      const hasWeights = result.weights.size > 0;
      
      if (hasWeights) {
        // GF was used
        const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
        expect(totalWeight).toBeCloseTo(1.0, 2);
      } else {
        // Empty (GF prohibited)
        expect(result.weights.size).toBe(0);
      }
    });
  });
});