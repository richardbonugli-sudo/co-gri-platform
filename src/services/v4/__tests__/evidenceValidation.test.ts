/**
 * Evidence Validation Test Suite
 * Tests for Priority 3 Fix - Evidence Quality and Channel Isolation Validation
 */

import { describe, it, expect } from 'vitest';
import { validateEvidenceBundle } from '../evidenceCapture';
import { Channel, EntityKind, EvidenceBundle } from '@/types/v4Types';

describe('Evidence Validation - Priority 3 Fix', () => {
  
  describe('Channel Isolation Validation', () => {
    it('should detect cross-channel contamination in source references', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'Americas',
            canonicalLabel: 'Americas',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Revenue by Geographic Segment',
            isTotalRow: false
          }
        ],
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
        channel: Channel.ASSETS, // Wrong channel!
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.ASSETS);
      
      expect(report.isValid).toBe(false);
      expect(report.warnings.some(w => w.category === 'contamination')).toBe(true);
      expect(report.warnings.some(w => w.severity === 'critical')).toBe(true);
    });
    
    it('should detect Supply channel with structured items', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Some source',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(['China', 'Vietnam']),
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
        channel: Channel.SUPPLY,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.SUPPLY);
      
      expect(report.isValid).toBe(false);
      const warning = report.warnings.find(w => w.category === 'contamination');
      expect(warning?.severity).toBe('critical');
      expect(warning?.message).toContain('Supply channel should have empty structured items');
    });
    
    it('should pass validation for empty Supply channel', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(['China', 'Vietnam', 'Mexico']),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map(),
          rawSentences: ['Manufacturing in China, Vietnam, and Mexico']
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
      
      const report = validateEvidenceBundle(bundle, Channel.SUPPLY);
      
      const criticalWarnings = report.warnings.filter(w => w.severity === 'critical');
      expect(criticalWarnings.length).toBe(0);
      expect(report.isValid).toBe(true);
    });
  });
  
  describe('Entity Kind Validation', () => {
    it('should detect Revenue without segment labels', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY, // Should have GEO_LABEL
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          },
          {
            rawLabel: 'China',
            canonicalLabel: 'China',
            entityKind: EntityKind.COUNTRY,
            value: 0.3,
            unit: 'pct',
            sourceRef: 'Revenue',
            isTotalRow: false
          }
        ],
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
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.REVENUE);
      
      const warning = report.warnings.find(w => w.category === 'completeness');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('no segment labels');
      expect(warning?.severity).toBe('high');
    });
    
    it('should detect unexpected entity kind in Financial channel', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY, // Should be CURRENCY_LABEL or empty
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Financial',
            isTotalRow: false
          }
        ],
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
      
      const report = validateEvidenceBundle(bundle, Channel.FINANCIAL);
      
      const warning = report.warnings.find(w => w.category === 'entity_kind');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('high');
    });
  });
  
  describe('Completeness Validation', () => {
    it('should pass validation for correct Revenue bundle with segment labels', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'Americas',
            canonicalLabel: 'Americas',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.428,
            unit: 'pct',
            sourceRef: 'Revenue by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Europe',
            canonicalLabel: 'Europe',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.262,
            unit: 'pct',
            sourceRef: 'Revenue by Geographic Segment',
            isTotalRow: false
          },
          {
            rawLabel: 'Japan',
            canonicalLabel: 'Japan',
            entityKind: EntityKind.COUNTRY,
            value: 0.070,
            unit: 'pct',
            sourceRef: 'Revenue by Geographic Segment',
            isTotalRow: false
          }
        ],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(),
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
      
      const report = validateEvidenceBundle(bundle, Channel.REVENUE);
      
      const criticalWarnings = report.warnings.filter(w => w.severity === 'critical');
      expect(criticalWarnings.length).toBe(0);
      expect(report.isValid).toBe(true);
    });
    
    it('should warn about missing total row', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'United States',
            canonicalLabel: 'United States',
            entityKind: EntityKind.COUNTRY,
            value: 0.808,
            unit: 'pct',
            sourceRef: 'Long-Lived Assets',
            isTotalRow: false
          }
        ],
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
        channel: Channel.ASSETS,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.ASSETS);
      
      const warning = report.warnings.find(w => w.category === 'completeness' && w.message.includes('total row'));
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('low');
    });
  });
  
  describe('Confidence Validation', () => {
    it('should warn about low confidence definitions', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Ambiguous Label', {
              label: 'Ambiguous Label',
              includes: [],
              excludes: [],
              residualOf: null,
              confidence: 0.3, // Low confidence
              sourceRef: 'Unclear footnote'
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
      
      const report = validateEvidenceBundle(bundle, Channel.REVENUE);
      
      const warning = report.warnings.find(w => w.category === 'confidence');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('Low confidence');
    });
    
    it('should warn about definitions with no membership information', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [],
        narrative: {
          namedCountries: new Set(),
          geoLabels: new Set(),
          nonStandardLabels: new Set(),
          currencyLabels: new Set(),
          definitions: new Map([
            ['Empty Definition', {
              label: 'Empty Definition',
              includes: [],
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
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.REVENUE);
      
      const warning = report.warnings.find(w => w.message.includes('no membership information'));
      expect(warning).toBeDefined();
      expect(warning?.category).toBe('confidence');
    });
  });
  
  describe('Source Reference Validation', () => {
    it('should warn about unexpected source reference patterns', () => {
      const bundle: EvidenceBundle = {
        structuredItems: [
          {
            rawLabel: 'Americas',
            canonicalLabel: 'Americas',
            entityKind: EntityKind.GEO_LABEL,
            value: 0.5,
            unit: 'pct',
            sourceRef: 'Unrelated source', // Doesn't match expected patterns
            isTotalRow: false
          }
        ],
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
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(bundle, Channel.REVENUE);
      
      const warning = report.warnings.find(w => w.category === 'source_ref');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('medium');
    });
  });
  
  describe('Integration Tests', () => {
    it('should validate complete Apple-like data correctly', () => {
      const revenueBundle: EvidenceBundle = {
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
        channel: Channel.REVENUE,
        homeCountry: 'United States',
        sector: 'Technology'
      };
      
      const report = validateEvidenceBundle(revenueBundle, Channel.REVENUE);
      
      // Should have no critical warnings
      const criticalWarnings = report.warnings.filter(w => w.severity === 'critical');
      expect(criticalWarnings.length).toBe(0);
      expect(report.isValid).toBe(true);
    });
  });
});