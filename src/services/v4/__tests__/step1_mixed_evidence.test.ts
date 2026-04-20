/**
 * Step 1 Mixed Evidence Test Suite
 * Tests for STEP 1 FIX - Direct + SSF + RF-B/C/D coexistence
 */

import { describe, it, expect } from 'vitest';
import { allocateChannel_V4 } from '../v4Orchestrator';
import { Channel, EntityKind, EvidenceBundle, FallbackType } from '@/types/v4Types';

describe('Step 1 Fix - Mixed Evidence Coexistence', () => {
  
  describe('Direct + SSF + RF-B Coexistence', () => {
    it('should handle Apple PP&E example: US (direct) + China bucket (SSF) + Other countries (RF-B)', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.808,
            unit: 'pct',
            sourceRef: 'Long-Lived Assets',
            isTotalRow: false
          },
          {
            rawLabel: 'China',
            canonicalLabel: 'China',
            entityKind: EntityKind.COUNTRY,
            value: 0.073,
            unit: 'pct',
            sourceRef: 'Long-Lived Assets',
            isTotalRow: false
          },
          {
            rawLabel: 'Other countries',
            canonicalLabel: 'Other countries',
            entityKind: EntityKind.NONSTANDARD_LABEL,
            value: 0.119,
            unit: 'pct',
            sourceRef: 'Long-Lived Assets',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(['Vietnam', 'India', 'Mexico']),
          geoLabels: new Set(),
          nonStandardLabels: new Set(['Other countries']),
          currencyLabels: new Set(),
          definitions: new Map([
            ['China', {
              label: 'China',
              includes: ['China', 'Hong Kong', 'Taiwan'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }]
          ]),
          rawSentences: ['Manufacturing in Vietnam, India, and Mexico']
        },
        supplementaryMembershipHints: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: []
        },
        channel: Channel.ASSETS,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify all three mechanisms fired
      expect(result.trace.directAlloc.size).toBeGreaterThan(0); // DIRECT: US
      
      const ssfAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.SSF
      );
      expect(ssfAlloc).toBeDefined();
      expect(ssfAlloc?.label).toBe('China');
      
      const rfbAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.RF_B
      );
      expect(rfbAlloc).toBeDefined();
      expect(rfbAlloc?.label).toBe('Other countries');
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
      
      // Verify US has highest weight
      expect(result.weights.get('United States')).toBeGreaterThan(0.7);
    });
  });
  
  describe('Direct + SSF + RF-C Coexistence', () => {
    it('should handle case with geo labels in narrative', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.6,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Europe',
            canonicalLabel: 'Europe',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.25,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Rest of World',
            canonicalLabel: 'Rest of World',
            entityKind: EntityKind.NONSTANDARD_LABEL,
            value: 0.15,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(['Asia', 'Latin America']),
          nonStandardLabels: new Set(['Rest of World']),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Europe', {
              label: 'Europe',
              includes: ['Germany', 'France', 'United Kingdom'],
              excludes: [],
              residualOf: null,
              confidence: 0.85,
              sourceRef: 'Footnote'
            }]
          ]),
          rawSentences: ['Operations in Asia and Latin America']
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
      
      // Verify SSF fired for Europe
      const ssfAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.SSF && a.label === 'Europe'
      );
      expect(ssfAlloc).toBeDefined();
      
      // Verify RF-C fired for Rest of World
      const rfcAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.RF_C && a.label === 'Rest of World'
      );
      expect(rfcAlloc).toBeDefined();
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('Direct + SSF + RF-D Coexistence', () => {
    it('should handle case with partial structured evidence', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Assets',
            isTotalRow: false
          },
          {
            rawLabel: 'Europe',
            canonicalLabel: 'Europe',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.3,
            unit: 'pct',
            sourceRef: 'Assets',
            isTotalRow: false
          },
          {
            rawLabel: 'Other',
            canonicalLabel: 'Other',
            entityKind: EntityKind.NONSTANDARD_LABEL,
            value: 0.2,
            unit: 'pct',
            sourceRef: 'Assets',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(['Other']),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Europe', {
              label: 'Europe',
              includes: ['Germany', 'France'],
              excludes: [],
              residualOf: null,
              confidence: 0.8,
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
        channel: Channel.ASSETS,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const result = allocateChannel_V4(evidenceBundle);
      
      // Verify DIRECT fired
      expect(result.trace.directAlloc.has('United States')).toBe(true);
      
      // Verify SSF fired for Europe
      const ssfAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.SSF && a.label === 'Europe'
      );
      expect(ssfAlloc).toBeDefined();
      
      // Verify RF-D fired for Other (partial structured evidence detected)
      const rfdAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.RF_D && a.label === 'Other'
      );
      expect(rfdAlloc).toBeDefined();
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('Multiple Residual Labels', () => {
    it('should handle multiple residual labels with different RF types', () => {
      const evidenceBundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.4,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Defined Region',
            canonicalLabel: 'Defined Region',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.3,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Other Asia',
            canonicalLabel: 'Other Asia',
            entityKind: EntityKind.NONSTANDARD_LABEL,
            value: 0.15,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'Rest of World',
            canonicalLabel: 'Rest of World',
            entityKind: EntityKind.NONSTANDARD_LABEL,
            value: 0.15,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(['Japan', 'South Korea']),
          geoLabels: new Set(['Latin America']),
          nonStandardLabels: new Set(['Other Asia', 'Rest of World']),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Defined Region', {
              label: 'Defined Region',
              includes: ['Germany', 'France', 'United Kingdom'],
              excludes: [],
              residualOf: null,
              confidence: 0.9,
              sourceRef: 'Footnote'
            }]
          ]),
          rawSentences: ['Operations in Japan, South Korea, and Latin America']
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
      
      // Verify SSF fired for Defined Region
      const ssfAlloc = result.trace.labelAllocations.find(
        a => a.fallbackUsed === FallbackType.SSF
      );
      expect(ssfAlloc).toBeDefined();
      
      // Verify RF-B fired for at least one residual label (named countries exist)
      const rfbAllocs = result.trace.labelAllocations.filter(
        a => a.fallbackUsed === FallbackType.RF_B
      );
      expect(rfbAllocs.length).toBeGreaterThan(0);
      
      // Verify final weights sum to ~1.0
      const totalWeight = Array.from(result.weights.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
});