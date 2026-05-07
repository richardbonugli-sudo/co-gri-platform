import { describe, it, expect } from 'vitest';
import {
  blendExposures,
  normalizeExposures,
  calculateAlignmentModifier,
  adjustShock,
  calculateCountryRisk,
  calculateCOGRI,
  calculateCompanyCOGRI,
  CHANNEL_WEIGHTS,
  LAMBDA,
} from '@/services/calculations/cogriPipeline';
import { ExposureChannels } from '@/types/company';
import { AlignmentFactors } from '@/types/global';

describe('CO-GRI Pipeline - Unit Tests', () => {
  describe('blendExposures', () => {
    it('should correctly blend exposure channels with weights', () => {
      const exposure: ExposureChannels = {
        W_R: 0.18,
        W_S: 0.65,
        W_P: 0.05,
        W_F: 0.02,
      };

      const W_geo = blendExposures(exposure);
      
      // Expected: 0.35*0.18 + 0.30*0.65 + 0.20*0.05 + 0.10*0.02
      // = 0.063 + 0.195 + 0.010 + 0.002 = 0.270
      expect(W_geo).toBeCloseTo(0.270, 3);
    });

    it('should handle zero exposures', () => {
      const exposure: ExposureChannels = {
        W_R: 0,
        W_S: 0,
        W_P: 0,
        W_F: 0,
      };

      const W_geo = blendExposures(exposure);
      expect(W_geo).toBe(0);
    });

    it('should handle single channel exposure', () => {
      const exposure: ExposureChannels = {
        W_R: 1.0,
        W_S: 0,
        W_P: 0,
        W_F: 0,
      };

      const W_geo = blendExposures(exposure);
      expect(W_geo).toBeCloseTo(CHANNEL_WEIGHTS.REVENUE, 3);
    });
  });

  describe('normalizeExposures', () => {
    it('should normalize exposures to sum to 1', () => {
      const exposures = new Map<string, ExposureChannels>([
        ['China', { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 }],
        ['Taiwan', { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 }],
      ]);

      const W_norm = normalizeExposures(exposures);
      const sum = Array.from(W_norm.values()).reduce((a, b) => a + b, 0);
      
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should maintain relative proportions', () => {
      const exposures = new Map<string, ExposureChannels>([
        ['China', { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 }],
        ['Taiwan', { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 }],
      ]);

      const W_norm = normalizeExposures(exposures);
      const china = W_norm.get('China')!;
      const taiwan = W_norm.get('Taiwan')!;
      
      // China should have higher normalized weight than Taiwan
      expect(china).toBeGreaterThan(taiwan);
    });
  });

  describe('calculateAlignmentModifier', () => {
    it('should calculate alignment modifier correctly', () => {
      const alignment: AlignmentFactors = {
        UNAlign: 0.2,
        TreatyAlign: 0.1,
        EconDepend: 0.6,
      };

      const W_c = calculateAlignmentModifier(alignment);
      expect(W_c).toBeCloseTo(0.3, 2);
    });

    it('should handle perfect alignment', () => {
      const alignment: AlignmentFactors = {
        UNAlign: 1.0,
        TreatyAlign: 1.0,
        EconDepend: 1.0,
      };

      const W_c = calculateAlignmentModifier(alignment);
      expect(W_c).toBe(1.0);
    });

    it('should handle zero alignment', () => {
      const alignment: AlignmentFactors = {
        UNAlign: 0,
        TreatyAlign: 0,
        EconDepend: 0,
      };

      const W_c = calculateAlignmentModifier(alignment);
      expect(W_c).toBe(0);
    });
  });

  describe('adjustShock', () => {
    it('should adjust shock correctly with alignment', () => {
      const S_c = 72;
      const W_c = 0.3;
      const lambda = 0.5;

      const AdjS = adjustShock(S_c, W_c, lambda);
      
      // Expected: 72 * (1 - 0.5 * 0.3) = 72 * 0.85 = 61.2
      expect(AdjS).toBeCloseTo(61.2, 1);
    });

    it('should not reduce shock when alignment is zero', () => {
      const S_c = 72;
      const W_c = 0;

      const AdjS = adjustShock(S_c, W_c);
      expect(AdjS).toBe(S_c);
    });

    it('should reduce shock by half when alignment is perfect and lambda is 1', () => {
      const S_c = 100;
      const W_c = 1.0;
      const lambda = 1.0;

      const AdjS = adjustShock(S_c, W_c, lambda);
      expect(AdjS).toBe(0);
    });

    it('should use default lambda when not provided', () => {
      const S_c = 72;
      const W_c = 0.3;

      const AdjS = adjustShock(S_c, W_c);
      expect(AdjS).toBeCloseTo(61.2, 1);
    });
  });

  describe('calculateCountryRisk', () => {
    it('should calculate country risk correctly', () => {
      const W_norm = 0.574;
      const AdjS = 61.2;

      const risk = calculateCountryRisk(W_norm, AdjS);
      
      // Expected: 0.574 * 61.2 = 35.1
      expect(risk).toBeCloseTo(35.1, 1);
    });

    it('should return zero when exposure is zero', () => {
      const W_norm = 0;
      const AdjS = 61.2;

      const risk = calculateCountryRisk(W_norm, AdjS);
      expect(risk).toBe(0);
    });

    it('should return zero when shock is zero', () => {
      const W_norm = 0.574;
      const AdjS = 0;

      const risk = calculateCountryRisk(W_norm, AdjS);
      expect(risk).toBe(0);
    });
  });

  describe('calculateCOGRI', () => {
    it('should apply sector multiplier at final aggregation', () => {
      const countryRisks = new Map([
        ['China', 35.1],
        ['Taiwan', 14.6],
        ['Vietnam', 7.3],
        ['Japan', 5.4],
        ['S. Korea', 3.6],
      ]);

      const M_sector = 1.2;

      const CO_GRI = calculateCOGRI(countryRisks, M_sector);
      
      // Expected: (35.1 + 14.6 + 7.3 + 5.4 + 3.6) * 1.2 = 66.0 * 1.2 = 79.2
      expect(CO_GRI).toBeCloseTo(79.2, 1);
    });

    it('should not amplify when sector multiplier is 1', () => {
      const countryRisks = new Map([
        ['China', 35.1],
        ['Taiwan', 14.6],
      ]);

      const M_sector = 1.0;

      const CO_GRI = calculateCOGRI(countryRisks, M_sector);
      
      // Expected: 35.1 + 14.6 = 49.7
      expect(CO_GRI).toBeCloseTo(49.7, 1);
    });

    it('should handle empty country risks', () => {
      const countryRisks = new Map<string, number>();
      const M_sector = 1.2;

      const CO_GRI = calculateCOGRI(countryRisks, M_sector);
      expect(CO_GRI).toBe(0);
    });
  });

  describe('calculateCompanyCOGRI - Integration Tests', () => {
    it('should calculate CO-GRI end-to-end', () => {
      const company = {
        company_id: 'AAPL',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        home_country: 'US',
        sector: 'Technology',
        exposures: {
          'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
          'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 },
        },
        M_sector: 1.2,
      };

      const shocks = new Map([
        ['China', { country: 'China', S_c: 72, timestamp: new Date(), vectors: {} as any, drivers: [] }],
        ['Taiwan', { country: 'Taiwan', S_c: 68, timestamp: new Date(), vectors: {} as any, drivers: [] }],
      ]);

      const alignments = new Map([
        ['US-China', { 
          home_country: 'US', 
          exposure_country: 'China', 
          UNAlign: 0.2, 
          TreatyAlign: 0.1, 
          EconDepend: 0.6 
        }],
        ['US-Taiwan', { 
          home_country: 'US', 
          exposure_country: 'Taiwan', 
          UNAlign: 0.8, 
          TreatyAlign: 0.7, 
          EconDepend: 0.5 
        }],
      ]);

      const result = calculateCompanyCOGRI(company, shocks, alignments);

      // Verify intermediate steps
      expect(result.intermediateSteps.W_c['China']).toBeCloseTo(0.3, 2);
      expect(result.intermediateSteps.AdjS['China']).toBeCloseTo(61.2, 1);

      // Verify final CO-GRI
      expect(result.CO_GRI).toBeGreaterThan(0);
      expect(result.CO_GRI).toBeLessThan(100);
    });

    it('should throw error when company has no exposures', () => {
      const company = {
        company_id: 'TEST',
        ticker: 'TEST',
        name: 'Test Company',
        home_country: 'US',
        sector: 'Technology',
        exposures: {},
        M_sector: 1.0,
      };

      const shocks = new Map();
      const alignments = new Map();

      expect(() => calculateCompanyCOGRI(company, shocks, alignments)).toThrow(
        'Company has no exposure data'
      );
    });

    it('should handle missing shock data gracefully', () => {
      const company = {
        company_id: 'AAPL',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        home_country: 'US',
        sector: 'Technology',
        exposures: {
          'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
          'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 },
        },
        M_sector: 1.2,
      };

      const shocks = new Map([
        ['China', { country: 'China', S_c: 72, timestamp: new Date(), vectors: {} as any, drivers: [] }],
        // Taiwan shock missing
      ]);

      const alignments = new Map([
        ['US-China', { 
          home_country: 'US', 
          exposure_country: 'China', 
          UNAlign: 0.2, 
          TreatyAlign: 0.1, 
          EconDepend: 0.6 
        }],
      ]);

      const result = calculateCompanyCOGRI(company, shocks, alignments);

      // Should still calculate with available data
      expect(result.CO_GRI).toBeGreaterThan(0);
      expect(result.countryRisks.has('China')).toBe(true);
      expect(result.countryRisks.has('Taiwan')).toBe(false);
    });
  });
});