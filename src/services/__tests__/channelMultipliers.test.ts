/**
 * Channel Multiplier Tests - Phase 2 Task 1 Validation
 * 
 * Comprehensive tests for channel-specific multipliers:
 * - Channel multiplier calculation
 * - Multiplier aggregation logic
 * - Backward compatibility with Phase 1
 * - V.4 integration
 */

import { describe, it, expect } from 'vitest';
import {
  getChannelMultiplierMetadata,
  getAllChannelMultipliers,
  getChannelMultiplierWithConfidence,
  compareChannelMultipliers,
  validateChannelMultiplier,
  getChannelCalibrationStats
} from '../channelMultiplierMetadata';
import {
  calculateChannelMultiplier,
  calculateBlendedChannelMultiplier,
  getDefaultChannelMultipliers,
  calculateChannelMultiplierImpact,
  validateChannelMultiplierCalculation,
  type ChannelExposureData
} from '../channelMultiplierCalculation';

describe('Channel Multiplier Metadata', () => {
  it('should return correct base multipliers', () => {
    const multipliers = getAllChannelMultipliers();
    
    expect(multipliers.Revenue).toBe(1.00);
    expect(multipliers.Supply).toBe(1.05);
    expect(multipliers.Assets).toBe(1.03);
    expect(multipliers.Financial).toBe(1.02);
  });
  
  it('should provide metadata for all channels', () => {
    const channels = ['Revenue', 'Supply', 'Assets', 'Financial'];
    
    channels.forEach(channel => {
      const metadata = getChannelMultiplierMetadata(channel);
      
      expect(metadata).toBeDefined();
      expect(metadata.channel).toBe(channel);
      expect(metadata.baseMultiplier).toBeGreaterThan(0);
      expect(metadata.confidenceScore).toBeGreaterThan(0);
      expect(metadata.confidenceScore).toBeLessThanOrEqual(1);
    });
  });
  
  it('should return channel multiplier with confidence', () => {
    const result = getChannelMultiplierWithConfidence('Supply');
    
    expect(result.multiplier).toBe(1.05);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.rationale).toBeTruthy();
  });
  
  it('should compare channel multipliers', () => {
    const comparison = compareChannelMultipliers();
    
    expect(comparison.length).toBe(4);
    expect(comparison[0].channel).toBe('Revenue');
    expect(comparison[1].channel).toBe('Supply');
  });
  
  it('should validate channel multipliers', () => {
    const validation = validateChannelMultiplier('Supply', 0.3, 75);
    
    expect(validation).toBeDefined();
    expect(validation.confidence).toBeGreaterThan(0);
  });
  
  it('should provide calibration statistics', () => {
    const stats = getChannelCalibrationStats();
    
    expect(stats.totalSampleSize).toBeGreaterThan(0);
    expect(stats.averageAccuracy).toBeGreaterThan(0.8);
  });
});

describe('Channel Multiplier Calculation', () => {
  it('should calculate single channel multiplier', () => {
    const channelData: ChannelExposureData = {
      channel: 'Supply',
      exposureWeight: 0.35,
      countries: [
        { country: 'China', weight: 0.20, riskScore: 65 },
        { country: 'United States', weight: 0.15, riskScore: 35 }
      ]
    };
    
    const result = calculateChannelMultiplier(channelData);
    
    expect(result.channel).toBe('Supply');
    expect(result.baseMultiplier).toBe(1.05);
    expect(result.adjustedMultiplier).toBeGreaterThanOrEqual(1.05);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
  
  it('should calculate blended channel multiplier', () => {
    const channelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.40,
        countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.35,
        countries: [{ country: 'China', weight: 0.35, riskScore: 65 }]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.15,
        countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }]
      }
    ];
    
    const result = calculateBlendedChannelMultiplier(channelExposures);
    
    expect(result.blendedMultiplier).toBeGreaterThan(1.0);
    expect(result.blendedMultiplier).toBeLessThan(1.2);
    expect(result.channelResults.length).toBe(4);
    expect(result.weights.revenue).toBe(0.40);
    expect(result.weights.supply).toBe(0.35);
  });
  
  it('should get default channel multipliers', () => {
    const defaults = getDefaultChannelMultipliers();
    
    expect(defaults.Revenue).toBe(1.00);
    expect(defaults.Supply).toBe(1.05);
    expect(defaults.Assets).toBe(1.03);
    expect(defaults.Financial).toBe(1.02);
  });
  
  it('should calculate channel multiplier impact', () => {
    const rawScore = 46.15;
    const sectorMultiplier = 1.10;
    const channelMultiplier = 1.02;
    
    const impact = calculateChannelMultiplierImpact(rawScore, sectorMultiplier, channelMultiplier);
    
    expect(impact.withoutChannelMultiplier).toBeCloseTo(50.765, 2);
    expect(impact.withChannelMultiplier).toBeGreaterThan(impact.withoutChannelMultiplier);
    expect(impact.channelImpact).toBeGreaterThan(0);
  });
  
  it('should validate channel multiplier calculation', () => {
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [] }
    ];
    
    const blendedResult = calculateBlendedChannelMultiplier(channelExposures);
    const validation = validateChannelMultiplierCalculation(blendedResult);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });
});

describe('Backward Compatibility', () => {
  it('should work with Phase 1 sector multipliers', () => {
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const result = calculateBlendedChannelMultiplier(channelExposures);
    
    // Should be compatible with Phase 1 sector multiplier
    const rawScore = 46.15;
    const sectorMultiplier = 1.10; // Technology sector
    const phase1Score = rawScore * sectorMultiplier;
    const phase2Score = phase1Score * result.blendedMultiplier;
    
    expect(phase2Score).toBeGreaterThan(phase1Score);
    expect(phase2Score).toBeLessThan(phase1Score * 1.5); // Reasonable upper bound
  });
  
  it('should maintain calculation consistency', () => {
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const result1 = calculateBlendedChannelMultiplier(channelExposures);
    const result2 = calculateBlendedChannelMultiplier(channelExposures);
    
    // Should be deterministic
    expect(result1.blendedMultiplier).toBe(result2.blendedMultiplier);
  });
});

describe('V.4 Integration', () => {
  it('should work with V.4 channel breakdown data', () => {
    // Simulate V.4 enhanced channel data
    const v4ChannelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.50,
        countries: [
          { country: 'United States', weight: 0.30, riskScore: 35 },
          { country: 'China', weight: 0.20, riskScore: 65 }
        ]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.30,
        countries: [
          { country: 'China', weight: 0.25, riskScore: 65 },
          { country: 'Taiwan', weight: 0.05, riskScore: 55 }
        ]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.10,
        countries: [
          { country: 'United States', weight: 0.08, riskScore: 35 },
          { country: 'Ireland', weight: 0.02, riskScore: 28 }
        ]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [
          { country: 'United States', weight: 0.10, riskScore: 35 }
        ]
      }
    ];
    
    const result = calculateBlendedChannelMultiplier(v4ChannelExposures);
    
    expect(result.blendedMultiplier).toBeGreaterThan(1.0);
    expect(result.channelResults.length).toBe(4);
    expect(result.overallConfidence).toBeGreaterThan(0.7);
  });
});