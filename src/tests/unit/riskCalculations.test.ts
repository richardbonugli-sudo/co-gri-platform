import { describe, it, expect } from 'vitest';
import {
  getRiskLevel,
  getTrendDirection,
  calculateConcentration,
  getContributionLabel,
  calculateVolatility
} from '@/utils/riskCalculations';
import { RiskLevel, TrendDirection } from '@/types/company';

describe('Risk Calculations - Unit Tests', () => {
  describe('getRiskLevel', () => {
    it('should return LOW for scores < 30', () => {
      expect(getRiskLevel(0)).toBe(RiskLevel.LOW);
      expect(getRiskLevel(15)).toBe(RiskLevel.LOW);
      expect(getRiskLevel(29.9)).toBe(RiskLevel.LOW);
    });

    it('should return MODERATE for scores 30-49', () => {
      expect(getRiskLevel(30)).toBe(RiskLevel.MODERATE);
      expect(getRiskLevel(40)).toBe(RiskLevel.MODERATE);
      expect(getRiskLevel(49.9)).toBe(RiskLevel.MODERATE);
    });

    it('should return ELEVATED for scores 50-69', () => {
      expect(getRiskLevel(50)).toBe(RiskLevel.ELEVATED);
      expect(getRiskLevel(60)).toBe(RiskLevel.ELEVATED);
      expect(getRiskLevel(69.9)).toBe(RiskLevel.ELEVATED);
    });

    it('should return HIGH for scores >= 70', () => {
      expect(getRiskLevel(70)).toBe(RiskLevel.HIGH);
      expect(getRiskLevel(85)).toBe(RiskLevel.HIGH);
      expect(getRiskLevel(100)).toBe(RiskLevel.HIGH);
    });
  });

  describe('getTrendDirection', () => {
    it('should return INCREASING when delta > 2', () => {
      expect(getTrendDirection(65, 60)).toBe(TrendDirection.INCREASING);
      expect(getTrendDirection(50, 45)).toBe(TrendDirection.INCREASING);
    });

    it('should return DECREASING when delta < -2', () => {
      expect(getTrendDirection(60, 65)).toBe(TrendDirection.DECREASING);
      expect(getTrendDirection(45, 50)).toBe(TrendDirection.DECREASING);
    });

    it('should return STABLE when |delta| <= 2', () => {
      expect(getTrendDirection(60, 60)).toBe(TrendDirection.STABLE);
      expect(getTrendDirection(60, 61)).toBe(TrendDirection.STABLE);
      expect(getTrendDirection(60, 59)).toBe(TrendDirection.STABLE);
      expect(getTrendDirection(60, 62)).toBe(TrendDirection.STABLE);
      expect(getTrendDirection(60, 58)).toBe(TrendDirection.STABLE);
    });
  });

  describe('calculateConcentration', () => {
    it('should calculate HHI correctly', () => {
      const riskShares = [0.40, 0.30, 0.20, 0.10]; // 40%, 30%, 20%, 10%
      const result = calculateConcentration(riskShares);
      
      // HHI = 0.40^2 + 0.30^2 + 0.20^2 + 0.10^2 = 0.16 + 0.09 + 0.04 + 0.01 = 0.30
      expect(result.HHI).toBeCloseTo(0.30, 2);
    });

    it('should label as Concentrated when HHI >= 0.25', () => {
      const riskShares = [0.50, 0.30, 0.20]; // HHI = 0.38
      const result = calculateConcentration(riskShares);
      
      expect(result.HHI).toBeGreaterThanOrEqual(0.25);
      expect(result.label).toBe('Concentrated');
    });

    it('should label as Diversified when HHI < 0.25', () => {
      const riskShares = [0.20, 0.20, 0.20, 0.20, 0.20]; // HHI = 0.20
      const result = calculateConcentration(riskShares);
      
      expect(result.HHI).toBeLessThan(0.25);
      expect(result.label).toBe('Diversified');
    });

    it('should handle perfect concentration (single source)', () => {
      const riskShares = [1.0]; // HHI = 1.0
      const result = calculateConcentration(riskShares);
      
      expect(result.HHI).toBe(1.0);
      expect(result.label).toBe('Concentrated');
    });

    it('should handle perfect diversification (many equal sources)', () => {
      const riskShares = Array(10).fill(0.10); // 10 sources at 10% each, HHI = 0.10
      const result = calculateConcentration(riskShares);
      
      expect(result.HHI).toBeCloseTo(0.10, 2);
      expect(result.label).toBe('Diversified');
    });
  });

  describe('getContributionLabel', () => {
    it('should return Primary for share >= 0.20', () => {
      expect(getContributionLabel(0.20)).toBe('Primary');
      expect(getContributionLabel(0.45)).toBe('Primary');
      expect(getContributionLabel(1.0)).toBe('Primary');
    });

    it('should return Significant for share >= 0.10', () => {
      expect(getContributionLabel(0.10)).toBe('Significant');
      expect(getContributionLabel(0.15)).toBe('Significant');
      expect(getContributionLabel(0.19)).toBe('Significant');
    });

    it('should return Moderate for share >= 0.05', () => {
      expect(getContributionLabel(0.05)).toBe('Moderate');
      expect(getContributionLabel(0.07)).toBe('Moderate');
      expect(getContributionLabel(0.09)).toBe('Moderate');
    });

    it('should return Minor for share < 0.05', () => {
      expect(getContributionLabel(0.04)).toBe('Minor');
      expect(getContributionLabel(0.01)).toBe('Minor');
      expect(getContributionLabel(0)).toBe('Minor');
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate standard deviation correctly', () => {
      const values = [10, 12, 14, 16, 18];
      const volatility = calculateVolatility(values);
      
      // Mean = 14, Variance = 8, StdDev = 2.828...
      expect(volatility).toBeCloseTo(2.828, 2);
    });

    it('should return 0 for single value', () => {
      const values = [50];
      const volatility = calculateVolatility(values);
      
      expect(volatility).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const values: number[] = [];
      const volatility = calculateVolatility(values);
      
      expect(volatility).toBe(0);
    });

    it('should return 0 for constant values', () => {
      const values = [50, 50, 50, 50, 50];
      const volatility = calculateVolatility(values);
      
      expect(volatility).toBe(0);
    });

    it('should handle high volatility', () => {
      const values = [10, 50, 20, 80, 30];
      const volatility = calculateVolatility(values);
      
      expect(volatility).toBeGreaterThan(20);
    });
  });
});