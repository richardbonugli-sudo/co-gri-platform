/**
 * Phase 2 End-to-End Integration Tests
 * 
 * Comprehensive integration tests for Phase 2:
 * - Complete Phase 2 workflow
 * - Phase 1 + V.4 + Phase 2 compatibility
 * - Feature flag combinations
 * - Calculation consistency
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setFeatureFlag, getFeatureFlags, getCalculationMode } from '@/config/featureFlags';
import type { ChannelExposureData } from '../channelMultiplierCalculation';
import { calculateBlendedChannelMultiplier } from '../channelMultiplierCalculation';
import { calculateChannelMultipliersWithDynamic } from '../channelMultiplierCalculationWithDynamic';
import { clearAdjustmentHistory } from '../adjustmentHistoryTracker';

describe('Phase 2 Complete Workflow', () => {
  beforeEach(() => {
    clearAdjustmentHistory();
  });
  
  it('should execute Task 1: Channel Multipliers', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', false);
    setFeatureFlag('enableMLCalibration', false);
    
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const result = calculateBlendedChannelMultiplier(channelExposures);
    
    expect(result.blendedMultiplier).toBeGreaterThan(1.0);
    expect(result.channelResults.length).toBe(4);
    
    // Restore flags
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
    setFeatureFlag('enableMLCalibration', originalFlags.enableMLCalibration);
  });
  
  it('should execute Task 2: Dynamic Adjustments', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', true);
    setFeatureFlag('enableMLCalibration', false);
    
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'Russia', weight: 0.40, riskScore: 75 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'Russia', weight: 0.35, riskScore: 75 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Russia', weight: 0.15, riskScore: 75 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'Russia', weight: 0.10, riskScore: 75 }] }
    ];
    
    const result = calculateChannelMultipliersWithDynamic(channelExposures, 'Russia', 'Energy', 'TEST');
    
    expect(result.isDynamic).toBe(true);
    expect(result.dynamicAdjustments).toBeDefined();
    expect(result.finalBlendedMultiplier).toBeGreaterThan(result.blendedMultiplier);
    
    // Restore flags
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
    setFeatureFlag('enableMLCalibration', originalFlags.enableMLCalibration);
  });
});

describe('Phase 1 + Phase 2 Compatibility', () => {
  it('should work with Phase 1 sector multipliers', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    
    // Simulate Phase 1 calculation
    const rawScore = 46.15;
    const sectorMultiplier = 1.10; // Technology
    const phase1Score = rawScore * sectorMultiplier; // 50.765
    
    // Apply Phase 2 channel multipliers
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const result = calculateBlendedChannelMultiplier(channelExposures);
    const phase2Score = phase1Score * result.blendedMultiplier;
    
    expect(phase2Score).toBeGreaterThan(phase1Score);
    expect(phase2Score).toBeLessThan(phase1Score * 1.5);
    
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
});

describe('Feature Flag Combinations', () => {
  it('should route to correct calculation mode', () => {
    const originalFlags = getFeatureFlags();
    
    // Test Phase 2 mode
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', false);
    setFeatureFlag('enableMLCalibration', false);
    
    let mode = getCalculationMode();
    expect(['phase2', 'v4']).toContain(mode);
    
    // Test Phase 2 Dynamic mode
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', true);
    setFeatureFlag('enableMLCalibration', false);
    
    mode = getCalculationMode();
    expect(['phase2-dynamic', 'v4']).toContain(mode);
    
    // Test Phase 2 ML mode
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', true);
    setFeatureFlag('enableMLCalibration', true);
    
    mode = getCalculationMode();
    expect(['phase2-ml', 'v4']).toContain(mode);
    
    // Restore flags
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
    setFeatureFlag('enableMLCalibration', originalFlags.enableMLCalibration);
  });
});

describe('Calculation Consistency', () => {
  it('should produce deterministic results', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const result1 = calculateBlendedChannelMultiplier(channelExposures);
    const result2 = calculateBlendedChannelMultiplier(channelExposures);
    
    expect(result1.blendedMultiplier).toBe(result2.blendedMultiplier);
    
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
  });
  
  it('should maintain score bounds', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'Russia', weight: 0.40, riskScore: 75 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'Russia', weight: 0.35, riskScore: 75 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Russia', weight: 0.15, riskScore: 75 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'Russia', weight: 0.10, riskScore: 75 }] }
    ];
    
    const result = calculateChannelMultipliersWithDynamic(channelExposures, 'Russia', 'Energy');
    
    // Multipliers should be reasonable
    expect(result.finalBlendedMultiplier).toBeGreaterThan(1.0);
    expect(result.finalBlendedMultiplier).toBeLessThan(2.0); // Should not exceed 2x
    
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
});

describe('Performance Testing', () => {
  it('should complete calculation in reasonable time', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableChannelSpecificMultipliers', true);
    setFeatureFlag('enableDynamicMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      { channel: 'Revenue', exposureWeight: 0.40, countries: [{ country: 'United States', weight: 0.40, riskScore: 35 }] },
      { channel: 'Supply', exposureWeight: 0.35, countries: [{ country: 'China', weight: 0.35, riskScore: 65 }] },
      { channel: 'Assets', exposureWeight: 0.15, countries: [{ country: 'Germany', weight: 0.15, riskScore: 30 }] },
      { channel: 'Financial', exposureWeight: 0.10, countries: [{ country: 'United Kingdom', weight: 0.10, riskScore: 32 }] }
    ];
    
    const startTime = Date.now();
    calculateChannelMultipliersWithDynamic(channelExposures, 'United States', 'Technology');
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    
    // Should complete in less than 2 seconds
    expect(duration).toBeLessThan(2000);
    
    setFeatureFlag('enableChannelSpecificMultipliers', originalFlags.enableChannelSpecificMultipliers);
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
});