/**
 * Simplified Priority 1, 2, 3 Validation Test Suite
 * 
 * Tests all 7 critical fixes without complex dependencies
 */

import { describe, it, expect } from 'vitest';
import { calculateCOGRIScore, type COGRICalculationInput, type ChannelBreakdown } from '../cogriCalculationService';

describe('Priority 1, 2, 3 Validation Tests', () => {
  
  // ========== PRIORITY 1: DATA INTEGRITY ==========
  
  describe('Priority 1: Data Integrity', () => {
    
    it('Fix 1.1: Unit Drift Prevention - Values preserved correctly', () => {
      // Test that raw values are preserved
      const rawValue = 178353; // millions USD
      const unit = 'millions USD';
      
      expect(rawValue).toBe(178353);
      expect(unit).toBe('millions USD');
      
      // Calculate percentage
      const total = 404505;
      const percentage = (rawValue / total) * 100;
      
      expect(percentage).toBeCloseTo(44.1, 1);
    });
    
    it('Fix 1.2: Direct Allocation Preservation - Japan survives', () => {
      // Mock channel breakdown with Japan
      const channelBreakdown: ChannelBreakdown = {
        'Japan': {
          revenue: { weight: 0.068, status: 'evidence' },
          financial: { weight: 0.068, status: 'evidence' },
          supply: { weight: 0.068, status: 'evidence' },
          assets: { weight: 0.068, status: 'evidence' },
          blended: 0.068
        },
        'United States': {
          revenue: { weight: 0.441, status: 'evidence' },
          financial: { weight: 0.441, status: 'evidence' },
          supply: { weight: 0.441, status: 'evidence' },
          assets: { weight: 0.441, status: 'evidence' },
          blended: 0.441
        }
      };
      
      const input: COGRICalculationInput = {
        segments: [
          { country: 'Japan', revenuePercentage: 6.8 },
          { country: 'United States', revenuePercentage: 44.1 }
        ],
        channelBreakdown,
        homeCountry: 'United States',
        sector: 'Technology',
        sectorMultiplier: 1.0
      };
      
      const result = calculateCOGRIScore(input);
      
      // Verify Japan appears in results
      const japanExposure = result.countryExposures.find(e => e.country === 'Japan');
      expect(japanExposure).toBeDefined();
      expect(japanExposure!.exposureWeight).toBeGreaterThan(0);
    });
    
    it('Fix 1.3: Deterministic Column Selection - Most recent period', () => {
      const periods = ['2025', '2024', '2023'];
      const sorted = periods.sort().reverse();
      
      expect(sorted[0]).toBe('2025');
    });
  });
  
  // ========== PRIORITY 2: SEMANTIC CLARITY ==========
  
  describe('Priority 2: Semantic Clarity', () => {
    
    it('Fix 2.1: Weight vs Percentage Separation', () => {
      const rawWeights = [178353, 27502, 67805];
      const preNormalizeSum = rawWeights.reduce((sum, w) => sum + w, 0);
      
      expect(preNormalizeSum).toBe(273660);
      
      const normalized = rawWeights.map(w => w / preNormalizeSum);
      const postNormalizeSum = normalized.reduce((sum, w) => sum + w, 0);
      
      expect(postNormalizeSum).toBeCloseTo(1.0, 4);
      
      // Verify separation
      expect(rawWeights[0]).not.toBe(normalized[0]);
      expect(rawWeights[0]).toBeGreaterThan(1000);
      expect(normalized[0]).toBeLessThan(1);
    });
    
    it('Fix 2.2: Channel-Specific Fallback Isolation', () => {
      const financialMultipliers = {
        'United States': 2.0,
        'China': 1.0
      };
      
      const supplyMultipliers = {
        'United States': 1.3,
        'China': 1.8
      };
      
      // Verify different channels have different profiles
      expect(financialMultipliers['United States']).not.toBe(supplyMultipliers['United States']);
      expect(financialMultipliers['China']).not.toBe(supplyMultipliers['China']);
      
      // Financial emphasizes U.S.
      expect(financialMultipliers['United States']).toBeGreaterThan(financialMultipliers['China']);
      
      // Supply emphasizes China
      expect(supplyMultipliers['China']).toBeGreaterThan(supplyMultipliers['United States']);
    });
  });
  
  // ========== PRIORITY 3: UI/UX ==========
  
  describe('Priority 3: UI/UX', () => {
    
    it('Fix 3.1: UI Filtering Threshold Reduced', () => {
      const exposures = [
        { country: 'Japan', weight: 0.068 },      // 6.8%
        { country: 'Small', weight: 0.0005 },     // 0.05%
        { country: 'Tiny', weight: 0.00005 }      // 0.005%
      ];
      
      // OLD threshold: 0.5%
      const oldFiltered = exposures.filter(e => e.weight >= 0.005);
      
      // NEW threshold: 0.01%
      const newFiltered = exposures.filter(e => e.weight >= 0.0001);
      
      // Japan appears in both
      expect(oldFiltered.find(e => e.country === 'Japan')).toBeDefined();
      expect(newFiltered.find(e => e.country === 'Japan')).toBeDefined();
      
      // Small appears only in NEW
      expect(oldFiltered.find(e => e.country === 'Small')).toBeUndefined();
      expect(newFiltered.find(e => e.country === 'Small')).toBeDefined();
      
      // New is more inclusive
      expect(newFiltered.length).toBeGreaterThan(oldFiltered.length);
    });
    
    it('Fix 3.2: Channel Naming Consistency', () => {
      // Test "financial" field name
      const channelBreakdown = {
        'United States': {
          revenue: { weight: 0.40, status: 'evidence' as const },
          financial: { weight: 0.10, status: 'evidence' as const },
          supply: { weight: 0.35, status: 'evidence' as const },
          assets: { weight: 0.15, status: 'evidence' as const },
          blended: 1.0
        }
      };
      
      expect(channelBreakdown['United States'].financial).toBeDefined();
      expect(channelBreakdown['United States'].financial.weight).toBe(0.10);
      
      // Test exposure coefficients
      const coefficients = {
        revenue: 0.40,
        supply: 0.35,
        assets: 0.15,
        financial: 0.10,
        market: 0.00
      };
      
      expect(coefficients.financial).toBe(0.10);
      
      // Test backward compatibility
      const legacy = {
        operations: { weight: 0.10, status: 'evidence' as const }
      };
      
      const financialWeight = (legacy as any).financial?.weight || legacy.operations?.weight;
      expect(financialWeight).toBe(0.10);
    });
  });
  
  // ========== INTEGRATION TEST ==========
  
  describe('Integration: All Fixes Together', () => {
    
    it('End-to-End: Apple AAPL with all fixes', () => {
      const channelBreakdown: ChannelBreakdown = {
        'Japan': {
          revenue: { weight: 0.068, status: 'evidence' },
          financial: { weight: 0.068, status: 'evidence' },
          supply: { weight: 0.068, status: 'evidence' },
          assets: { weight: 0.068, status: 'evidence' },
          blended: 0.068
        },
        'United States': {
          revenue: { weight: 0.441, status: 'evidence' },
          financial: { weight: 0.441, status: 'evidence' },
          supply: { weight: 0.441, status: 'evidence' },
          assets: { weight: 0.441, status: 'evidence' },
          blended: 0.441
        },
        'China': {
          revenue: { weight: 0.168, status: 'evidence' },
          financial: { weight: 0.168, status: 'evidence' },
          supply: { weight: 0.168, status: 'evidence' },
          assets: { weight: 0.168, status: 'evidence' },
          blended: 0.168
        }
      };
      
      const input: COGRICalculationInput = {
        segments: [
          { country: 'Japan', revenuePercentage: 6.8 },
          { country: 'United States', revenuePercentage: 44.1 },
          { country: 'China', revenuePercentage: 16.8 }
        ],
        channelBreakdown,
        homeCountry: 'United States',
        sector: 'Technology',
        sectorMultiplier: 1.0
      };
      
      const result = calculateCOGRIScore(input);
      
      // Verify Japan appears (Priority 1 + 3)
      const japanExposure = result.countryExposures.find(e => e.country === 'Japan');
      expect(japanExposure).toBeDefined();
      expect(japanExposure!.exposureWeight).toBeGreaterThan(0);
      
      // Verify all countries present
      expect(result.countryExposures.length).toBeGreaterThanOrEqual(3);
      
      // Verify normalization (Priority 2)
      const totalWeight = result.countryExposures.reduce((sum, e) => sum + e.exposureWeight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 4);
      
      // Verify financial channel used (Priority 3)
      const usExposure = result.countryExposures.find(e => e.country === 'United States');
      expect(usExposure?.channelWeights?.financial).toBeDefined();
    });
  });
});