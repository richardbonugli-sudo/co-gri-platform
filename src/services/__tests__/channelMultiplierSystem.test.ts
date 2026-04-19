/**
 * Channel Multiplier System Test Suite - Phase 2 Development
 * 
 * Comprehensive tests for channel-specific multipliers:
 * 1. Channel multiplier metadata
 * 2. Channel risk factors
 * 3. Channel multiplier calculation
 * 4. Blended multiplier calculation
 * 5. Integration with COGRI orchestrator
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
  getRiskFactorsByChannel,
  getRiskFactorsByCategory,
  getRiskFactorsBySeverity,
  calculateChannelRiskImpact,
  getRiskFactorStatistics
} from '@/data/channelRiskFactors';
import {
  calculateChannelMultiplier,
  calculateBlendedChannelMultiplier,
  getDefaultChannelMultipliers,
  calculateChannelMultiplierImpact,
  validateChannelMultiplierCalculation,
  type ChannelExposureData
} from '../channelMultiplierCalculation';
import {
  orchestrateCOGRICalculation,
  getCalculationMode,
  isPhase2Result,
  type Phase2COGRICalculationResult
} from '../cogriCalculationOrchestrator';
import { getFeatureFlags, setFeatureFlag } from '@/config/featureFlags';

describe('Channel Multiplier Metadata', () => {
  it('should return correct base multipliers for all channels', () => {
    const multipliers = getAllChannelMultipliers();
    
    expect(multipliers.Revenue).toBe(1.00);
    expect(multipliers.Supply).toBe(1.05);
    expect(multipliers.Assets).toBe(1.03);
    expect(multipliers.Financial).toBe(1.02);
  });
  
  it('should provide metadata for each channel', () => {
    const channels = ['Revenue', 'Supply', 'Assets', 'Financial'];
    
    channels.forEach(channel => {
      const metadata = getChannelMultiplierMetadata(channel);
      
      expect(metadata).toBeDefined();
      expect(metadata.channel).toBe(channel);
      expect(metadata.baseMultiplier).toBeGreaterThan(0);
      expect(metadata.confidenceScore).toBeGreaterThan(0);
      expect(metadata.confidenceScore).toBeLessThanOrEqual(1);
      expect(metadata.rationale).toBeTruthy();
      expect(metadata.riskFactors.length).toBeGreaterThan(0);
    });
  });
  
  it('should return channel multiplier with confidence', () => {
    const result = getChannelMultiplierWithConfidence('Supply');
    
    expect(result.multiplier).toBe(1.05);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.rationale).toContain('supply chain');
  });
  
  it('should compare channel multipliers correctly', () => {
    const comparison = compareChannelMultipliers();
    
    expect(comparison.length).toBe(4);
    expect(comparison[0].channel).toBe('Revenue');
    expect(comparison[0].premium).toBe('Baseline');
    expect(comparison[1].channel).toBe('Supply');
    expect(comparison[1].premium).toBe('+5.0%');
  });
  
  it('should validate channel multipliers', () => {
    const validation = validateChannelMultiplier('Supply', 0.3, 75);
    
    expect(validation).toBeDefined();
    expect(validation.confidence).toBeGreaterThan(0);
    expect(Array.isArray(validation.warnings)).toBe(true);
  });
  
  it('should provide calibration statistics', () => {
    const stats = getChannelCalibrationStats();
    
    expect(stats.totalSampleSize).toBeGreaterThan(0);
    expect(stats.averageAccuracy).toBeGreaterThan(0.8);
    expect(stats.averagePrecision).toBeGreaterThan(0.7);
    expect(stats.averageRecall).toBeGreaterThan(0.8);
    expect(stats.lastCalibrationDate).toBeTruthy();
  });
});

describe('Channel Risk Factors', () => {
  it('should return risk factors for each channel', () => {
    const channels: Array<'Revenue' | 'Supply' | 'Assets' | 'Financial'> = ['Revenue', 'Supply', 'Assets', 'Financial'];
    
    channels.forEach(channel => {
      const factors = getRiskFactorsByChannel(channel);
      
      expect(factors.length).toBeGreaterThan(0);
      factors.forEach(factor => {
        expect(factor.channel).toBe(channel);
        expect(factor.id).toBeTruthy();
        expect(factor.name).toBeTruthy();
        expect(factor.multiplierImpact).toBeGreaterThan(0);
      });
    });
  });
  
  it('should filter risk factors by category', () => {
    const geopoliticalFactors = getRiskFactorsByCategory('geopolitical');
    
    expect(geopoliticalFactors.length).toBeGreaterThan(0);
    geopoliticalFactors.forEach(factor => {
      expect(factor.category).toBe('geopolitical');
    });
  });
  
  it('should filter risk factors by severity', () => {
    const criticalFactors = getRiskFactorsBySeverity('critical');
    
    expect(criticalFactors.length).toBeGreaterThan(0);
    criticalFactors.forEach(factor => {
      expect(factor.severity).toBe('critical');
      expect(factor.multiplierImpact).toBeGreaterThan(0.15);
    });
  });
  
  it('should calculate channel risk impact', () => {
    const supplyFactors = getRiskFactorsByChannel('Supply');
    const activeFactorIds = supplyFactors.slice(0, 2).map(f => f.id);
    
    const impact = calculateChannelRiskImpact('Supply', activeFactorIds);
    
    expect(impact.totalImpact).toBeGreaterThan(0);
    expect(impact.riskCount).toBe(2);
    expect(impact.severityBreakdown).toBeDefined();
  });
  
  it('should provide risk factor statistics', () => {
    const stats = getRiskFactorStatistics();
    
    expect(stats.totalFactors).toBeGreaterThan(10);
    expect(stats.byChannel.Revenue).toBeGreaterThan(0);
    expect(stats.byChannel.Supply).toBeGreaterThan(0);
    expect(stats.byChannel.Assets).toBeGreaterThan(0);
    expect(stats.byChannel.Financial).toBeGreaterThan(0);
    expect(stats.averageMultiplierImpact).toBeGreaterThan(0);
  });
});

describe('Channel Multiplier Calculation', () => {
  it('should calculate channel multiplier for single channel', () => {
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
    expect(result.rationale).toBeTruthy();
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
    expect(result.weights.assets).toBe(0.15);
    expect(result.weights.financial).toBe(0.10);
    expect(result.overallConfidence).toBeGreaterThan(0.7);
  });
  
  it('should get default channel multipliers', () => {
    const defaults = getDefaultChannelMultipliers();
    
    expect(defaults.Revenue).toBe(1.00);
    expect(defaults.Supply).toBe(1.05);
    expect(defaults.Assets).toBe(1.03);
    expect(defaults.Financial).toBe(1.02);
  });
  
  it('should calculate channel multiplier impact on final score', () => {
    const rawScore = 46.15;
    const sectorMultiplier = 1.10;
    const channelMultiplier = 1.02;
    
    const impact = calculateChannelMultiplierImpact(rawScore, sectorMultiplier, channelMultiplier);
    
    expect(impact.withoutChannelMultiplier).toBeCloseTo(50.765, 2);
    expect(impact.withChannelMultiplier).toBeCloseTo(51.78, 2);
    expect(impact.channelImpact).toBeGreaterThan(0);
    expect(impact.percentageChange).toBeGreaterThan(0);
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

describe('COGRI Orchestrator Phase 2 Integration', () => {
  it('should report Phase 2 mode when channel multipliers enabled', () => {
    // Save original flags
    const originalFlags = getFeatureFlags();
    
    // Enable Phase 2
    setFeatureFlag('enableEnhancedCalculation', true);
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    
    const mode = getCalculationMode();
    
    expect(mode.mode).toBe('phase2');
    expect(mode.description).toContain('Channel-Specific');
    expect(mode.features.length).toBeGreaterThan(5);
    
    // Restore original flags
    setFeatureFlag('enableEnhancedCalculation', originalFlags.enableEnhancedCalculation);
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
  
  it('should calculate Phase 2 COGRI score with channel multipliers', () => {
    // Save original flags
    const originalFlags = getFeatureFlags();
    
    // Enable Phase 2
    setFeatureFlag('enableEnhancedCalculation', true);
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    
    const input = {
      segments: [
        { country: 'United States', weight: 0.60 },
        { country: 'China', weight: 0.40 }
      ],
      sector: 'Technology',
      channelBreakdown: {
        'United States': {
          revenue: { weight: 0.50, intensity: 0.8 },
          supply: { weight: 0.10, intensity: 0.3 },
          assets: { weight: 0.05, intensity: 0.2 },
          operations: { weight: 0.05, intensity: 0.1 }
        },
        'China': {
          revenue: { weight: 0.10, intensity: 0.5 },
          supply: { weight: 0.60, intensity: 0.9 },
          assets: { weight: 0.05, intensity: 0.4 },
          operations: { weight: 0.05, intensity: 0.3 }
        }
      }
    };
    
    const result = orchestrateCOGRICalculation(input);
    
    expect(isPhase2Result(result)).toBe(true);
    
    if (isPhase2Result(result)) {
      expect(result.channelMultiplierDetails).toBeDefined();
      expect(result.channelMultiplierDetails.blendedMultiplier).toBeGreaterThan(1.0);
      expect(result.channelMultiplierDetails.channelResults.length).toBe(4);
      expect(result.finalScoreWithChannelMultiplier).toBeGreaterThan(0);
      expect(result.channelMultiplierImpact).toBeDefined();
    }
    
    // Restore original flags
    setFeatureFlag('enableEnhancedCalculation', originalFlags.enableEnhancedCalculation);
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
});

describe('Phase 2 Feature Flag Control', () => {
  it('should route to Phase 2 when both flags enabled', () => {
    const originalFlags = getFeatureFlags();
    
    setFeatureFlag('enableEnhancedCalculation', true);
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    
    const mode = getCalculationMode();
    expect(mode.mode).toBe('phase2');
    
    setFeatureFlag('enableEnhancedCalculation', originalFlags.enableEnhancedCalculation);
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
  
  it('should route to Phase 1 when only enhanced calculation enabled', () => {
    const originalFlags = getFeatureFlags();
    
    setFeatureFlag('enableEnhancedCalculation', true);
    setFeatureFlag('enableChannelSpecificMultipliers', false);
    
    const mode = getCalculationMode();
    expect(mode.mode).toBe('enhanced');
    
    setFeatureFlag('enableEnhancedCalculation', originalFlags.enableEnhancedCalculation);
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
  
  it('should route to legacy when both flags disabled', () => {
    const originalFlags = getFeatureFlags();
    
    setFeatureFlag('enableEnhancedCalculation', false);
    setFeatureFlag('enableChannelSpecificMultipliers', false);
    
    const mode = getCalculationMode();
    expect(mode.mode).toBe('legacy');
    
    setFeatureFlag('enableEnhancedCalculation', originalFlags.enableEnhancedCalculation);
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
});