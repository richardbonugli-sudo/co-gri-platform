import { describe, it, expect } from 'vitest';
import { calculateCOGRI, normalizeScore, applyAlignmentModifier } from '../cogriPipeline';
import { generateCompanyExposure } from '../../mockData/companyExposureGenerator';
import { generateCountryShock } from '../../mockData/countryShockGenerator';
import { generateAlignmentData } from '../../mockData/alignmentDataGenerator';

describe('CO-GRI Pipeline', () => {
  describe('calculateCOGRI', () => {
    it('should calculate CO-GRI score for a company with country exposures', () => {
      const companyExposure = generateCompanyExposure('TEST', 'Test Company', 3);
      const countryShocks = Object.keys(companyExposure.exposures).map(country =>
        generateCountryShock(country)
      );

      const result = calculateCOGRI(companyExposure, countryShocks);

      expect(result).toHaveProperty('companyId', 'TEST');
      expect(result).toHaveProperty('cogriScore');
      expect(result).toHaveProperty('riskLevel');
      expect(typeof result.cogriScore).toBe('number');
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.riskLevel);
    });

    it('should return zero CO-GRI for company with no exposures', () => {
      const companyExposure = {
        companyId: 'EMPTY',
        companyName: 'Empty Company',
        exposures: {},
        lastUpdated: new Date().toISOString()
      };
      const countryShocks = [generateCountryShock('USA')];

      const result = calculateCOGRI(companyExposure, countryShocks);

      expect(result.cogriScore).toBe(0);
      expect(result.riskLevel).toBe('Low');
    });

    it('should weight country shocks by exposure amounts', () => {
      const companyExposure = {
        companyId: 'WEIGHTED',
        companyName: 'Weighted Company',
        exposures: {
          'USA': 0.8,
          'CHN': 0.2
        },
        lastUpdated: new Date().toISOString()
      };

      const countryShocks = [
        { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: 10 },
        { countryCode: 'CHN', date: '2024-01-01', shocks: {}, totalShock: 50 }
      ];

      const result = calculateCOGRI(companyExposure, countryShocks);

      // Expected: 0.8 * 10 + 0.2 * 50 = 8 + 10 = 18
      expect(result.cogriScore).toBeCloseTo(18, 1);
    });

    it('should handle missing country shock data gracefully', () => {
      const companyExposure = {
        companyId: 'PARTIAL',
        companyName: 'Partial Data Company',
        exposures: {
          'USA': 0.5,
          'CHN': 0.5
        },
        lastUpdated: new Date().toISOString()
      };

      const countryShocks = [
        { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: 20 }
        // CHN shock data missing
      ];

      const result = calculateCOGRI(companyExposure, countryShocks);

      // Should only calculate for USA: 0.5 * 20 = 10
      expect(result.cogriScore).toBeCloseTo(10, 1);
    });
  });

  describe('normalizeScore', () => {
    it('should normalize scores to 0-100 range', () => {
      expect(normalizeScore(0)).toBe(0);
      expect(normalizeScore(50)).toBe(50);
      expect(normalizeScore(100)).toBe(100);
    });

    it('should clamp negative scores to 0', () => {
      expect(normalizeScore(-10)).toBe(0);
      expect(normalizeScore(-100)).toBe(0);
    });

    it('should clamp scores above 100', () => {
      expect(normalizeScore(150)).toBe(100);
      expect(normalizeScore(200)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(normalizeScore(45.7)).toBeCloseTo(45.7, 1);
      expect(normalizeScore(78.3)).toBeCloseTo(78.3, 1);
    });
  });

  describe('applyAlignmentModifier', () => {
    it('should amplify score with negative alignment', () => {
      const baseScore = 50;
      const alignment = -0.5;

      const modified = applyAlignmentModifier(baseScore, alignment);

      // Negative alignment should increase risk
      expect(modified).toBeGreaterThan(baseScore);
    });

    it('should reduce score with positive alignment', () => {
      const baseScore = 50;
      const alignment = 0.5;

      const modified = applyAlignmentModifier(baseScore, alignment);

      // Positive alignment should decrease risk
      expect(modified).toBeLessThan(baseScore);
    });

    it('should not modify score with neutral alignment', () => {
      const baseScore = 50;
      const alignment = 0;

      const modified = applyAlignmentModifier(baseScore, alignment);

      expect(modified).toBeCloseTo(baseScore, 1);
    });

    it('should handle extreme alignment values', () => {
      const baseScore = 50;

      const maxNegative = applyAlignmentModifier(baseScore, -1);
      const maxPositive = applyAlignmentModifier(baseScore, 1);

      expect(maxNegative).toBeGreaterThan(baseScore);
      expect(maxPositive).toBeLessThan(baseScore);
      expect(maxNegative).toBeGreaterThan(maxPositive);
    });

    it('should always return non-negative scores', () => {
      const baseScore = 10;
      const alignment = 1; // Maximum positive alignment

      const modified = applyAlignmentModifier(baseScore, alignment);

      expect(modified).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('should calculate consistent CO-GRI across multiple runs', () => {
      const companyExposure = {
        companyId: 'CONSISTENT',
        companyName: 'Consistent Company',
        exposures: { 'USA': 0.6, 'CHN': 0.4 },
        lastUpdated: new Date().toISOString()
      };

      const countryShocks = [
        { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: 30 },
        { countryCode: 'CHN', date: '2024-01-01', shocks: {}, totalShock: 40 }
      ];

      const result1 = calculateCOGRI(companyExposure, countryShocks);
      const result2 = calculateCOGRI(companyExposure, countryShocks);

      expect(result1.cogriScore).toBe(result2.cogriScore);
      expect(result1.riskLevel).toBe(result2.riskLevel);
    });

    it('should produce different scores for different exposure profiles', () => {
      const highRiskExposure = {
        companyId: 'HIGH',
        companyName: 'High Risk Company',
        exposures: { 'CHN': 1.0 },
        lastUpdated: new Date().toISOString()
      };

      const lowRiskExposure = {
        companyId: 'LOW',
        companyName: 'Low Risk Company',
        exposures: { 'USA': 1.0 },
        lastUpdated: new Date().toISOString()
      };

      const countryShocks = [
        { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: 10 },
        { countryCode: 'CHN', date: '2024-01-01', shocks: {}, totalShock: 60 }
      ];

      const highResult = calculateCOGRI(highRiskExposure, countryShocks);
      const lowResult = calculateCOGRI(lowRiskExposure, countryShocks);

      expect(highResult.cogriScore).toBeGreaterThan(lowResult.cogriScore);
    });
  });

  describe('Reference Calculation Validation', () => {
    it('should match reference calculation for known inputs', () => {
      // Reference test case with known expected output
      const companyExposure = {
        companyId: 'REF',
        companyName: 'Reference Company',
        exposures: {
          'USA': 0.5,
          'GBR': 0.3,
          'DEU': 0.2
        },
        lastUpdated: new Date().toISOString()
      };

      const countryShocks = [
        { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: 20 },
        { countryCode: 'GBR', date: '2024-01-01', shocks: {}, totalShock: 30 },
        { countryCode: 'DEU', date: '2024-01-01', shocks: {}, totalShock: 25 }
      ];

      const result = calculateCOGRI(companyExposure, countryShocks);

      // Expected: 0.5*20 + 0.3*30 + 0.2*25 = 10 + 9 + 5 = 24
      expect(result.cogriScore).toBeCloseTo(24, 1);
    });

    it('should correctly classify risk levels', () => {
      const testCases = [
        { score: 15, expectedLevel: 'Low' },
        { score: 35, expectedLevel: 'Medium' },
        { score: 65, expectedLevel: 'High' },
        { score: 85, expectedLevel: 'Critical' }
      ];

      testCases.forEach(({ score, expectedLevel }) => {
        const companyExposure = {
          companyId: 'TEST',
          companyName: 'Test Company',
          exposures: { 'USA': 1.0 },
          lastUpdated: new Date().toISOString()
        };

        const countryShocks = [
          { countryCode: 'USA', date: '2024-01-01', shocks: {}, totalShock: score }
        ];

        const result = calculateCOGRI(companyExposure, countryShocks);
        expect(result.riskLevel).toBe(expectedLevel);
      });
    });
  });
});