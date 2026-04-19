/**
 * Evidence Extractor Test Suite
 * Tests for Priority 1 Fix - Channel-Specific Evidence Extraction
 */

import { describe, it, expect } from 'vitest';
import {
  extractEvidenceBundle_V4
} from '../evidenceExtractor';
import {
  Channel,
  EntityKind,
  StructuredItem,
  EvidenceBundle
} from '@/types/v4Types';

// Note: Since extraction functions are not exported, we test through the public API
// extractEvidenceBundle_V4 which calls the internal functions

describe('Evidence Extractor - Priority 1 Fix Validation', () => {
  
  describe('Revenue Channel - Segment Label Preservation', () => {
    it('should preserve segment labels as GEO_LABEL entities', () => {
      const mockCompanyData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' },
          { label: 'Europe', value: 82329, unit: 'millions' },
          { label: 'Greater China', value: 49884, unit: 'millions' },
          { label: 'Japan', value: 22067, unit: 'millions' },
          { label: 'Rest of Asia Pacific', value: 25254, unit: 'millions' }
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      // Verify we have structured items
      expect(bundle.structuredItems.length).toBe(5);
      
      // Verify segment labels are GEO_LABEL
      const americas = bundle.structuredItems.find(i => i.canonicalLabel === 'Americas');
      expect(americas).toBeDefined();
      expect(americas?.entityKind).toBe(EntityKind.GEO_LABEL);
      
      const europe = bundle.structuredItems.find(i => i.canonicalLabel === 'Europe');
      expect(europe).toBeDefined();
      expect(europe?.entityKind).toBe(EntityKind.GEO_LABEL);
      
      const greaterChina = bundle.structuredItems.find(i => i.canonicalLabel === 'Greater China');
      expect(greaterChina).toBeDefined();
      expect(greaterChina?.entityKind).toBe(EntityKind.GEO_LABEL);
      
      // Verify Japan is COUNTRY
      const japan = bundle.structuredItems.find(i => i.canonicalLabel === 'Japan');
      expect(japan).toBeDefined();
      expect(japan?.entityKind).toBe(EntityKind.COUNTRY);
      
      // Verify Rest of Asia Pacific is GEO_LABEL
      const restOfAsiaPacific = bundle.structuredItems.find(
        i => i.canonicalLabel === 'Rest of Asia Pacific'
      );
      expect(restOfAsiaPacific).toBeDefined();
      expect(restOfAsiaPacific?.entityKind).toBe(EntityKind.GEO_LABEL);
    });
    
    it('should NOT convert segment labels to countries', () => {
      const mockCompanyData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' },
          { label: 'Europe', value: 82329, unit: 'millions' }
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      // Verify Americas is NOT converted to "United States"
      const unitedStates = bundle.structuredItems.find(i => i.canonicalLabel === 'United States');
      expect(unitedStates).toBeUndefined();
      
      // Verify Europe is NOT exploded into individual countries
      const germany = bundle.structuredItems.find(i => i.canonicalLabel === 'Germany');
      expect(germany).toBeUndefined();
      
      const france = bundle.structuredItems.find(i => i.canonicalLabel === 'France');
      expect(france).toBeUndefined();
    });
    
    it('should handle geographicSegments data source', () => {
      const mockCompanyData = {
        geographicSegments: [
          { name: 'Americas', revenue: 134161, unit: 'currency' },
          { name: 'EMEA', revenue: 82329, unit: 'currency' }
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(2);
      
      const americas = bundle.structuredItems.find(i => i.canonicalLabel === 'Americas');
      expect(americas?.entityKind).toBe(EntityKind.GEO_LABEL);
      
      const emea = bundle.structuredItems.find(i => i.canonicalLabel === 'EMEA');
      expect(emea?.entityKind).toBe(EntityKind.GEO_LABEL);
    });
  });
  
  describe('Assets Channel - PP&E Table Parsing', () => {
    it('should parse PP&E table correctly', () => {
      const mockCompanyData = {
        ppeData: {
          items: [
            { country: 'United States', value: 40274, unit: 'millions' },
            { country: 'China', value: 3617, unit: 'millions' },
            { label: 'Other countries', value: 5943, unit: 'millions' }
          ]
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(3);
      
      // Verify US is COUNTRY
      const us = bundle.structuredItems.find(i => i.canonicalLabel === 'United States');
      expect(us).toBeDefined();
      expect(us?.entityKind).toBe(EntityKind.COUNTRY);
      
      // Verify China is COUNTRY (or GEO_LABEL if footnote exists)
      const china = bundle.structuredItems.find(i => i.canonicalLabel === 'China');
      expect(china).toBeDefined();
      // EntityKind depends on classifyEntityKind logic
      
      // Verify "Other countries" is NONSTANDARD_LABEL
      const other = bundle.structuredItems.find(i => i.canonicalLabel === 'Other countries');
      expect(other).toBeDefined();
      expect(other?.entityKind).toBe(EntityKind.NONSTANDARD_LABEL);
    });
    
    it('should handle assetGeography data source', () => {
      const mockCompanyData = {
        assetGeography: [
          { country: 'United States', value: 0.80, unit: 'pct' },
          { country: 'China', value: 0.07, unit: 'pct' },
          { label: 'Other countries', value: 0.13, unit: 'pct' }
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(3);
      
      const us = bundle.structuredItems.find(i => i.canonicalLabel === 'United States');
      expect(us?.value).toBe(0.80);
    });
    
    it('should return empty array when no PP&E data exists', () => {
      const mockCompanyData = {
        // No ppeData or assetGeography
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(0);
    });
  });
  
  describe('Supply Chain Channel - Empty Structured Items', () => {
    it('should return empty array (narrative only)', () => {
      const mockCompanyData = {
        narrativeText: {
          supply: 'Manufacturing facilities in China, Vietnam, and Mexico. Key suppliers in Taiwan, South Korea, and Malaysia.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      // Supply chain should have NO structured items
      expect(bundle.structuredItems.length).toBe(0);
      
      // But should have narrative mentions
      expect(bundle.narrative.namedCountries.size).toBeGreaterThan(0);
    });
    
    it('should NOT receive Revenue channel data', () => {
      const mockCompanyData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' },
          { label: 'Europe', value: 82329, unit: 'millions' }
        ]
      };
      
      const supplyBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      // Supply should NOT have Revenue's structured items
      expect(supplyBundle.structuredItems.length).toBe(0);
      
      const americas = supplyBundle.structuredItems.find(i => i.canonicalLabel === 'Americas');
      expect(americas).toBeUndefined();
    });
  });
  
  describe('Financial Channel - Currency Labels', () => {
    it('should parse currency composition with CURRENCY_LABEL', () => {
      const mockCompanyData = {
        currencyComposition: [
          { currency: 'USD', percentage: 60 },
          { currency: 'EUR', percentage: 20 },
          { currency: 'GBP', percentage: 10 },
          { currency: 'JPY', percentage: 10 }
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(4);
      
      const usd = bundle.structuredItems.find(i => i.canonicalLabel === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.entityKind).toBe(EntityKind.CURRENCY_LABEL);
      expect(usd?.value).toBe(0.60);
      
      const eur = bundle.structuredItems.find(i => i.canonicalLabel === 'EUR');
      expect(eur?.entityKind).toBe(EntityKind.CURRENCY_LABEL);
      expect(eur?.value).toBe(0.20);
    });
    
    it('should return empty array when no currency data exists', () => {
      const mockCompanyData = {
        // No currencyComposition or financialGeography
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.structuredItems.length).toBe(0);
    });
    
    it('should NOT receive Revenue channel data', () => {
      const mockCompanyData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' }
        ]
      };
      
      const financialBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      // Financial should NOT have Revenue's structured items
      expect(financialBundle.structuredItems.length).toBe(0);
      
      const americas = financialBundle.structuredItems.find(i => i.canonicalLabel === 'Americas');
      expect(americas).toBeUndefined();
    });
  });
  
  describe('Channel Isolation - Cross-Channel Contamination Prevention', () => {
    it('should return different items for different channels', () => {
      const mockCompanyData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' },
          { label: 'Europe', value: 82329, unit: 'millions' }
        ],
        ppeData: {
          items: [
            { country: 'United States', value: 40274, unit: 'millions' },
            { country: 'China', value: 3617, unit: 'millions' }
          ]
        }
      };
      
      const revenueBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      const assetsBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      const supplyBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      const financialBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      // Verify Revenue has items
      expect(revenueBundle.structuredItems.length).toBe(2);
      
      // Verify Assets has different items
      expect(assetsBundle.structuredItems.length).toBe(2);
      expect(assetsBundle.structuredItems).not.toEqual(revenueBundle.structuredItems);
      
      // Verify Supply has no structured items
      expect(supplyBundle.structuredItems.length).toBe(0);
      
      // Verify Financial has no structured items (no currency data)
      expect(financialBundle.structuredItems.length).toBe(0);
      
      // Verify no cross-channel contamination
      const revenueLabels = revenueBundle.structuredItems.map(i => i.canonicalLabel);
      const assetsLabels = assetsBundle.structuredItems.map(i => i.canonicalLabel);
      
      expect(revenueLabels).toContain('Americas');
      expect(revenueLabels).toContain('Europe');
      expect(assetsLabels).toContain('United States');
      expect(assetsLabels).toContain('China');
      
      // Revenue should NOT have Assets labels
      expect(revenueLabels).not.toContain('United States');
      expect(revenueLabels).not.toContain('China');
      
      // Assets should NOT have Revenue labels
      expect(assetsLabels).not.toContain('Americas');
      expect(assetsLabels).not.toContain('Europe');
    });
    
    it('should handle V4 channelEvidence correctly', () => {
      const mockCompanyData = {
        channelEvidence: {
          revenue: {
            structuredItems: [
              {
                rawLabel: 'Americas',
                canonicalLabel: 'Americas',
                entityKind: EntityKind.GEO_LABEL,
                value: 0.428,
                unit: 'pct',
                sourceRef: 'Revenue table',
                isTotalRow: false
              }
            ]
          },
          assets: {
            structuredItems: [
              {
                rawLabel: 'United States',
                canonicalLabel: 'United States',
                entityKind: EntityKind.COUNTRY,
                value: 0.808,
                unit: 'pct',
                sourceRef: 'PP&E table',
                isTotalRow: false
              }
            ]
          }
        }
      };
      
      const revenueBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      const assetsBundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      // Verify V4 channelEvidence is used
      expect(revenueBundle.structuredItems.length).toBe(1);
      expect(revenueBundle.structuredItems[0].canonicalLabel).toBe('Americas');
      
      expect(assetsBundle.structuredItems.length).toBe(1);
      expect(assetsBundle.structuredItems[0].canonicalLabel).toBe('United States');
    });
  });
  
  describe('Footnote Parsing - Membership Definitions', () => {
    it('should parse footnote with "includes" pattern', () => {
      const mockCompanyData = {
        footnotes: [
          'China includes Hong Kong and Taiwan'
        ],
        ppeData: {
          items: [
            { country: 'China', value: 3617, unit: 'millions' }
          ]
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      // Verify footnote definition was parsed
      const chinaDef = bundle.narrative.definitions.get('China');
      expect(chinaDef).toBeDefined();
      expect(chinaDef?.includes).toContain('China');
      expect(chinaDef?.includes).toContain('Hong Kong');
      expect(chinaDef?.includes).toContain('Taiwan');
      expect(chinaDef?.confidence).toBe(0.9);
    });
    
    it('should parse footnote with "comprises" pattern', () => {
      const mockCompanyData = {
        footnotes: [
          'EMEA comprises Europe, Middle East, and Africa'
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      const emeaDef = bundle.narrative.definitions.get('EMEA');
      expect(emeaDef).toBeDefined();
      expect(emeaDef?.includes).toContain('Europe');
      expect(emeaDef?.includes).toContain('Middle East');
      expect(emeaDef?.includes).toContain('Africa');
    });
    
    it('should parse footnote with "consists of" pattern', () => {
      const mockCompanyData = {
        footnotes: [
          'Asia Pacific consists of Japan, Australia, and New Zealand'
        ]
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockCompanyData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      const asiaPacificDef = bundle.narrative.definitions.get('Asia Pacific');
      expect(asiaPacificDef).toBeDefined();
      expect(asiaPacificDef?.includes).toContain('Japan');
      expect(asiaPacificDef?.includes).toContain('Australia');
      expect(asiaPacificDef?.includes).toContain('New Zealand');
    });
  });
  
  describe('Integration Tests - Full Pipeline', () => {
    it('should create channel-isolated evidence bundles for Apple-like data', () => {
      const mockAppleData = {
        revenueGeography: [
          { label: 'Americas', value: 134161, unit: 'millions' },
          { label: 'Europe', value: 82329, unit: 'millions' },
          { label: 'Greater China', value: 49884, unit: 'millions' },
          { label: 'Japan', value: 22067, unit: 'millions' },
          { label: 'Rest of Asia Pacific', value: 25254, unit: 'millions' }
        ],
        ppeData: {
          items: [
            { country: 'United States', value: 40274, unit: 'millions' },
            { country: 'China', value: 3617, unit: 'millions' },
            { label: 'Other countries', value: 5943, unit: 'millions' }
          ]
        },
        footnotes: [
          'China includes Hong Kong and Taiwan'
        ],
        narrativeText: {
          supply: 'Manufacturing facilities in China, Vietnam, and Mexico.',
          financial: 'Significant cash holdings in European and Asian markets.'
        }
      };
      
      const revenueBundle = extractEvidenceBundle_V4(
        mockAppleData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      const assetsBundle = extractEvidenceBundle_V4(
        mockAppleData,
        Channel.ASSETS,
        'Technology',
        'United States'
      );
      
      const supplyBundle = extractEvidenceBundle_V4(
        mockAppleData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      const financialBundle = extractEvidenceBundle_V4(
        mockAppleData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      // Revenue: 5 segment labels
      expect(revenueBundle.structuredItems.length).toBe(5);
      expect(revenueBundle.structuredItems.filter(i => i.entityKind === EntityKind.GEO_LABEL).length).toBe(4);
      expect(revenueBundle.structuredItems.filter(i => i.entityKind === EntityKind.COUNTRY).length).toBe(1);
      
      // Assets: 3 items (US, China, Other countries)
      expect(assetsBundle.structuredItems.length).toBe(3);
      expect(assetsBundle.narrative.definitions.has('China')).toBe(true);
      
      // Supply: 0 structured items, narrative mentions
      expect(supplyBundle.structuredItems.length).toBe(0);
      expect(supplyBundle.narrative.namedCountries.size).toBeGreaterThan(0);
      
      // Financial: 0 structured items, narrative mentions
      expect(financialBundle.structuredItems.length).toBe(0);
      expect(financialBundle.narrative.geoLabels.size).toBeGreaterThan(0);
      
      // Verify complete isolation
      expect(revenueBundle.structuredItems).not.toEqual(assetsBundle.structuredItems);
      expect(supplyBundle.structuredItems).not.toEqual(revenueBundle.structuredItems);
      expect(financialBundle.structuredItems).not.toEqual(revenueBundle.structuredItems);
    });
  });
});