/**
 * Phase 2 Narrative Extraction Tests
 * 
 * Tests for enhanced narrative extraction capabilities:
 * 1. Context-aware country name extraction
 * 2. Currency mention extraction
 * 3. Supply Chain narrative handling
 * 4. Financial narrative handling
 * 5. Country name variants and aliases
 */

import { describe, it, expect } from 'vitest';
import { extractEvidenceBundle_V4 } from '../evidenceExtractor_enhanced';
import { canonicalizeLabel, getCurrencyCountries } from '../labelResolution';
import { Channel } from '@/types/v4Types';

describe('Phase 2 - Narrative Extraction Enhancement', () => {
  
  describe('Country Name Variants and Aliases', () => {
    
    it('should recognize U.S. variants', () => {
      expect(canonicalizeLabel('U.S.')).toBe('United States');
      expect(canonicalizeLabel('USA')).toBe('United States');
      expect(canonicalizeLabel('US')).toBe('United States');
      expect(canonicalizeLabel('U.S.A.')).toBe('United States');
      expect(canonicalizeLabel('America')).toBe('United States');
    });
    
    it('should recognize UK variants', () => {
      expect(canonicalizeLabel('UK')).toBe('United Kingdom');
      expect(canonicalizeLabel('U.K.')).toBe('United Kingdom');
      expect(canonicalizeLabel('Great Britain')).toBe('United Kingdom');
      expect(canonicalizeLabel('Britain')).toBe('United Kingdom');
    });
    
    it('should recognize China variants', () => {
      expect(canonicalizeLabel('PRC')).toBe('China');
      expect(canonicalizeLabel('China mainland')).toBe('China');
      expect(canonicalizeLabel('Mainland China')).toBe('China');
      expect(canonicalizeLabel("People's Republic of China")).toBe('China');
    });
    
    it('should recognize South Korea variants', () => {
      expect(canonicalizeLabel('ROK')).toBe('South Korea');
      expect(canonicalizeLabel('Korea')).toBe('South Korea');
      expect(canonicalizeLabel('S. Korea')).toBe('South Korea');
      expect(canonicalizeLabel('Republic of Korea')).toBe('South Korea');
    });
    
    it('should handle case-insensitive matching', () => {
      expect(canonicalizeLabel('usa')).toBe('United States');
      expect(canonicalizeLabel('UK')).toBe('United Kingdom');
      expect(canonicalizeLabel('prc')).toBe('China');
    });
  });
  
  describe('Supply Chain Narrative Extraction', () => {
    
    it('should extract countries from sourcing context', () => {
      const mockData = {
        narrativeText: {
          supply: 'We source raw materials from China, Vietnam, and India. Components are procured from South Korea and Taiwan.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Vietnam')).toBe(true);
      expect(bundle.narrative.namedCountries.has('India')).toBe(true);
      expect(bundle.narrative.namedCountries.has('South Korea')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Taiwan')).toBe(true);
      expect(bundle.narrative.namedCountries.size).toBeGreaterThanOrEqual(5);
    });
    
    it('should extract countries from manufacturing context', () => {
      const mockData = {
        narrativeText: {
          supply: 'Products are manufactured in China and assembled in Mexico. Final testing is conducted in the U.S.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Manufacturing',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Mexico')).toBe(true);
      expect(bundle.narrative.namedCountries.has('United States')).toBe(true);
    });
    
    it('should extract countries from supplier context', () => {
      const mockData = {
        narrativeText: {
          supply: 'Our suppliers are located in Germany, Japan, and South Korea. We also work with vendors in Taiwan.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('Germany')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Japan')).toBe(true);
      expect(bundle.narrative.namedCountries.has('South Korea')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Taiwan')).toBe(true);
    });
    
    it('should extract countries from import/export context', () => {
      const mockData = {
        narrativeText: {
          supply: 'We import components from China and export finished goods to Canada, Mexico, and Brazil.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Manufacturing',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Canada')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Mexico')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Brazil')).toBe(true);
    });
    
    it('should handle complex supply chain narrative', () => {
      const mockData = {
        narrativeText: {
          supply: 'Our global supply chain includes facilities in China, Vietnam, and Thailand for manufacturing. ' +
                  'Raw materials are sourced from India and Indonesia. Components are procured from suppliers in ' +
                  'South Korea, Taiwan, and Japan. Distribution centers are located in the United States, Germany, ' +
                  'and Singapore.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      // Should extract at least 10 countries
      expect(bundle.narrative.namedCountries.size).toBeGreaterThanOrEqual(10);
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Vietnam')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Thailand')).toBe(true);
      expect(bundle.narrative.namedCountries.has('India')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Indonesia')).toBe(true);
    });
  });
  
  describe('Financial Narrative - Currency Extraction', () => {
    
    it('should extract USD and map to United States', () => {
      const mockData = {
        narrativeText: {
          financial: 'Revenue is denominated in USD. Financial statements are expressed in U.S. dollars.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.currencyLabels.has('USD')).toBe(true);
      expect(bundle.narrative.namedCountries.has('United States')).toBe(true);
    });
    
    it('should extract EUR and map to European countries', () => {
      const mockData = {
        narrativeText: {
          financial: 'European operations are denominated in EUR. Currency translation from Euro to USD.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.currencyLabels.has('EUR')).toBe(true);
      // Should map to at least one European country
      const hasEuropeanCountry = 
        bundle.narrative.namedCountries.has('Germany') ||
        bundle.narrative.namedCountries.has('France') ||
        bundle.narrative.namedCountries.has('Italy');
      expect(hasEuropeanCountry).toBe(true);
    });
    
    it('should extract JPY and map to Japan', () => {
      const mockData = {
        narrativeText: {
          financial: 'Japanese subsidiary reports in JPY. Yen-denominated transactions are translated to USD.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.currencyLabels.has('JPY')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Japan')).toBe(true);
    });
    
    it('should extract CNY/RMB and map to China', () => {
      const mockData = {
        narrativeText: {
          financial: 'Chinese operations are denominated in CNY. RMB-denominated revenues are significant.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(
        bundle.narrative.currencyLabels.has('CNY') || 
        bundle.narrative.currencyLabels.has('RMB')
      ).toBe(true);
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
    });
    
    it('should extract multiple currencies', () => {
      const mockData = {
        narrativeText: {
          financial: 'We operate in multiple currencies including USD, EUR, GBP, JPY, and CNY. ' +
                    'Currency translation impacts are significant.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.currencyLabels.size).toBeGreaterThanOrEqual(5);
      expect(bundle.narrative.currencyLabels.has('USD')).toBe(true);
      expect(bundle.narrative.currencyLabels.has('EUR')).toBe(true);
      expect(bundle.narrative.currencyLabels.has('GBP')).toBe(true);
      expect(bundle.narrative.currencyLabels.has('JPY')).toBe(true);
      expect(bundle.narrative.currencyLabels.has('CNY')).toBe(true);
    });
  });
  
  describe('Currency-to-Country Mapping', () => {
    
    it('should map USD to United States', () => {
      const countries = getCurrencyCountries('USD');
      expect(countries).toContain('United States');
    });
    
    it('should map EUR to European countries', () => {
      const countries = getCurrencyCountries('EUR');
      expect(countries.length).toBeGreaterThan(0);
      expect(countries).toContain('Germany');
      expect(countries).toContain('France');
    });
    
    it('should map GBP to United Kingdom', () => {
      const countries = getCurrencyCountries('GBP');
      expect(countries).toContain('United Kingdom');
    });
    
    it('should map JPY to Japan', () => {
      const countries = getCurrencyCountries('JPY');
      expect(countries).toContain('Japan');
    });
    
    it('should map CNY to China', () => {
      const countries = getCurrencyCountries('CNY');
      expect(countries).toContain('China');
    });
    
    it('should handle currency symbols', () => {
      expect(getCurrencyCountries('$')).toContain('United States');
      expect(getCurrencyCountries('£')).toContain('United Kingdom');
      expect(getCurrencyCountries('€').length).toBeGreaterThan(0);
    });
  });
  
  describe('Context-Aware Extraction', () => {
    
    it('should extract from "operates in" context', () => {
      const mockData = {
        narrativeText: {
          supply: 'The company operates in China, India, and Brazil.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
      expect(bundle.narrative.namedCountries.has('India')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Brazil')).toBe(true);
    });
    
    it('should extract from "facilities in" context', () => {
      const mockData = {
        narrativeText: {
          supply: 'We have manufacturing facilities in Mexico and Vietnam.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Manufacturing',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('Mexico')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Vietnam')).toBe(true);
    });
    
    it('should extract from "markets in" context', () => {
      const mockData = {
        narrativeText: {
          revenue: 'We sell our products in markets including Germany, France, and Italy.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.REVENUE,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('Germany')).toBe(true);
      expect(bundle.narrative.namedCountries.has('France')).toBe(true);
      expect(bundle.narrative.namedCountries.has('Italy')).toBe(true);
    });
  });
  
  describe('Empty Evidence Prevention', () => {
    
    it('should extract evidence from minimal Supply Chain narrative', () => {
      const mockData = {
        narrativeText: {
          supply: 'Sourced from China.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.size).toBeGreaterThan(0);
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
    });
    
    it('should extract evidence from minimal Financial narrative', () => {
      const mockData = {
        narrativeText: {
          financial: 'Denominated in EUR.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.FINANCIAL,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.currencyLabels.size).toBeGreaterThan(0);
      expect(bundle.narrative.currencyLabels.has('EUR')).toBe(true);
    });
    
    it('should handle narrative with country abbreviations', () => {
      const mockData = {
        narrativeText: {
          supply: 'Operations in US, UK, and PRC.'
        }
      };
      
      const bundle = extractEvidenceBundle_V4(
        mockData,
        Channel.SUPPLY,
        'Technology',
        'United States'
      );
      
      expect(bundle.narrative.namedCountries.has('United States')).toBe(true);
      expect(bundle.narrative.namedCountries.has('United Kingdom')).toBe(true);
      expect(bundle.narrative.namedCountries.has('China')).toBe(true);
    });
  });
});