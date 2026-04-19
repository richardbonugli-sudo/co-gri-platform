/**
 * Dynamic Multiplier System Test Suite - Phase 2 Task 2
 * 
 * Comprehensive tests for dynamic multiplier adjustments:
 * 1. Geopolitical event monitoring
 * 2. Market condition analysis
 * 3. Dynamic adjustment rules
 * 4. Adjustment history tracking
 * 5. Integration with channel multipliers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateEventImpact,
  getEventsForCountry,
  getEventsForSector,
  getEventsForChannel,
  calculateAggregateEventImpact,
  getAllActiveEvents,
  getEventStatistics,
  ACTIVE_GEOPOLITICAL_EVENTS
} from '../geopoliticalEventMonitor';
import {
  calculateMarketStressIndex,
  calculateCurrencyStress,
  calculateCommodityStress,
  calculateMarketConditionAdjustment,
  getMarketConditionSummary
} from '../marketConditionAnalyzer';
import {
  calculateDynamicAdjustment,
  calculateAllDynamicAdjustments,
  getAdjustmentRulesSummary,
  ADJUSTMENT_RULES
} from '../dynamicAdjustmentRules';
import {
  logDynamicAdjustment,
  logManualAdjustment,
  rollbackToBaseline,
  getAdjustmentHistory,
  getAuditTrail,
  getAdjustmentStatistics,
  clearAdjustmentHistory
} from '../adjustmentHistoryTracker';
import {
  calculateChannelMultipliersWithDynamic,
  compareDynamicImpact,
  getDynamicAdjustmentSummary
} from '../channelMultiplierCalculationWithDynamic';
import { setFeatureFlag, getFeatureFlags } from '@/config/featureFlags';
import type { ChannelExposureData } from '../channelMultiplierCalculation';

describe('Geopolitical Event Monitor', () => {
  it('should have active geopolitical events', () => {
    expect(ACTIVE_GEOPOLITICAL_EVENTS.length).toBeGreaterThan(0);
    
    ACTIVE_GEOPOLITICAL_EVENTS.forEach(event => {
      expect(event.id).toBeTruthy();
      expect(event.type).toBeTruthy();
      expect(event.severity).toBeGreaterThanOrEqual(1);
      expect(event.severity).toBeLessThanOrEqual(10);
      expect(event.affectedCountries.length).toBeGreaterThan(0);
    });
  });
  
  it('should calculate event impact with temporal decay', () => {
    const event = ACTIVE_GEOPOLITICAL_EVENTS[0];
    const impact = calculateEventImpact(event);
    
    expect(impact.isActive).toBeDefined();
    expect(impact.daysSinceStart).toBeGreaterThanOrEqual(0);
    expect(impact.decayFactor).toBeGreaterThan(0);
    expect(impact.decayFactor).toBeLessThanOrEqual(1);
    expect(impact.currentImpact).toBeDefined();
  });
  
  it('should get events for specific country', () => {
    const russiaEvents = getEventsForCountry('Russia');
    
    expect(russiaEvents.length).toBeGreaterThan(0);
    russiaEvents.forEach(event => {
      expect(event.affectedCountries).toContain('Russia');
      expect(event.currentImpact.isActive).toBe(true);
    });
  });
  
  it('should get events for specific sector', () => {
    const techEvents = getEventsForSector('Technology');
    
    expect(techEvents.length).toBeGreaterThan(0);
    techEvents.forEach(event => {
      expect(event.affectedSectors).toContain('Technology');
    });
  });
  
  it('should get events for specific channel', () => {
    const supplyEvents = getEventsForChannel('Supply');
    
    expect(supplyEvents.length).toBeGreaterThan(0);
    supplyEvents.forEach(event => {
      expect(event.affectedChannels).toContain('Supply');
    });
  });
  
  it('should calculate aggregate event impact', () => {
    const impact = calculateAggregateEventImpact('Russia', 'Supply');
    
    expect(impact.totalImpact).toBeGreaterThanOrEqual(0);
    expect(impact.totalImpact).toBeLessThanOrEqual(0.50); // Capped at 0.50
    expect(impact.eventCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(impact.events)).toBe(true);
  });
  
  it('should get event statistics', () => {
    const stats = getEventStatistics();
    
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.activeEvents).toBeGreaterThanOrEqual(0);
    expect(stats.averageSeverity).toBeGreaterThan(0);
  });
});

describe('Market Condition Analyzer', () => {
  it('should calculate market stress index', () => {
    const stressIndex = calculateMarketStressIndex();
    
    expect(stressIndex).toBeGreaterThanOrEqual(0);
    expect(stressIndex).toBeLessThanOrEqual(100);
  });
  
  it('should calculate currency stress for high-risk countries', () => {
    const russiaStress = calculateCurrencyStress('Russia');
    
    expect(russiaStress.stressLevel).toBe('critical');
    expect(russiaStress.volatility).toBeGreaterThan(10);
    expect(russiaStress.multiplierAdjustment).toBeGreaterThan(0);
  });
  
  it('should calculate currency stress for stable countries', () => {
    const usStress = calculateCurrencyStress('United States');
    
    expect(usStress.stressLevel).toBe('low');
    expect(usStress.multiplierAdjustment).toBe(0);
  });
  
  it('should calculate commodity stress for energy sector', () => {
    const energyStress = calculateCommodityStress('Energy');
    
    expect(energyStress.affectedCommodities.length).toBeGreaterThan(0);
    expect(energyStress.averageVolatility).toBeGreaterThan(0);
    expect(energyStress.multiplierAdjustment).toBeGreaterThanOrEqual(0);
  });
  
  it('should calculate market condition adjustment', () => {
    const adjustment = calculateMarketConditionAdjustment('Russia', 'Energy');
    
    expect(adjustment.totalAdjustment).toBeGreaterThanOrEqual(0);
    expect(adjustment.totalAdjustment).toBeLessThanOrEqual(0.25); // Capped
    expect(adjustment.breakdown).toBeDefined();
  });
  
  it('should get market condition summary', () => {
    const summary = getMarketConditionSummary();
    
    expect(summary.marketStressIndex).toBeGreaterThanOrEqual(0);
    expect(summary.stressLevel).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(summary.stressLevel);
  });
});

describe('Dynamic Adjustment Rules', () => {
  it('should have adjustment rules defined', () => {
    expect(ADJUSTMENT_RULES.length).toBeGreaterThan(0);
    
    ADJUSTMENT_RULES.forEach(rule => {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.channels.length).toBeGreaterThan(0);
      expect(rule.priority).toBeGreaterThanOrEqual(1);
      expect(rule.priority).toBeLessThanOrEqual(10);
    });
  });
  
  it('should calculate dynamic adjustment for Russia', () => {
    const adjustment = calculateDynamicAdjustment('Russia', 'Energy', 'Supply', 1.05);
    
    expect(adjustment.channel).toBe('Supply');
    expect(adjustment.baseMultiplier).toBe(1.05);
    expect(adjustment.adjustedMultiplier).toBeGreaterThanOrEqual(1.05);
    expect(adjustment.totalAdjustment).toBeGreaterThanOrEqual(0);
    expect(adjustment.appliedRules.length).toBeGreaterThan(0);
  });
  
  it('should calculate dynamic adjustment for stable country', () => {
    const adjustment = calculateDynamicAdjustment('United States', 'Technology', 'Revenue', 1.00);
    
    expect(adjustment.channel).toBe('Revenue');
    expect(adjustment.baseMultiplier).toBe(1.00);
    // US might still have some adjustments due to global market conditions
    expect(adjustment.adjustedMultiplier).toBeGreaterThanOrEqual(1.00);
  });
  
  it('should calculate all dynamic adjustments', () => {
    const result = calculateAllDynamicAdjustments(
      'China',
      'Technology',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    expect(result.country).toBe('China');
    expect(result.sector).toBe('Technology');
    expect(result.adjustments.revenue).toBeDefined();
    expect(result.adjustments.supply).toBeDefined();
    expect(result.adjustments.assets).toBeDefined();
    expect(result.adjustments.financial).toBeDefined();
    expect(result.blendedAdjustment).toBeGreaterThan(0);
  });
  
  it('should get adjustment rules summary', () => {
    const summary = getAdjustmentRulesSummary();
    
    expect(summary.totalRules).toBe(ADJUSTMENT_RULES.length);
    expect(summary.byChannel.Revenue).toBeGreaterThan(0);
    expect(summary.byChannel.Supply).toBeGreaterThan(0);
    expect(summary.highPriorityRules.length).toBeGreaterThan(0);
  });
});

describe('Adjustment History Tracker', () => {
  beforeEach(() => {
    clearAdjustmentHistory();
  });
  
  it('should log dynamic adjustment', () => {
    const dynamicResult = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    const entry = logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST',
      'system'
    );
    
    expect(entry.id).toBeTruthy();
    expect(entry.ticker).toBe('TEST');
    expect(entry.adjustmentType).toBe('dynamic');
    expect(entry.appliedRules.length).toBeGreaterThan(0);
  });
  
  it('should log manual adjustment', () => {
    const entry = logManualAdjustment(
      'Russia',
      'Energy',
      { supply: 1.20 },
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'Manual override due to analyst recommendation',
      'TEST',
      'user'
    );
    
    expect(entry.adjustmentType).toBe('manual');
    expect(entry.triggeredBy).toBe('user');
    expect(entry.adjustments.supply.after).toBe(1.20);
  });
  
  it('should get adjustment history', () => {
    const dynamicResult = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    const history = getAdjustmentHistory('TEST');
    
    expect(history.length).toBe(1);
    expect(history[0].ticker).toBe('TEST');
  });
  
  it('should get audit trail', () => {
    const dynamicResult = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    const auditTrail = getAuditTrail('TEST', {
      revenue: 1.00,
      supply: 1.05,
      assets: 1.03,
      financial: 1.02
    });
    
    expect(auditTrail.ticker).toBe('TEST');
    expect(auditTrail.totalAdjustments).toBe(1);
    expect(auditTrail.currentMultipliers).toBeDefined();
  });
  
  it('should rollback to baseline', () => {
    const dynamicResult = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    const rollback = rollbackToBaseline(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    expect(rollback.adjustmentType).toBe('rollback');
    expect(rollback.adjustments.revenue.after).toBe(1.00);
    expect(rollback.adjustments.supply.after).toBe(1.05);
  });
  
  it('should get adjustment statistics', () => {
    const dynamicResult = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST1'
    );
    
    logDynamicAdjustment(
      dynamicResult,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST2'
    );
    
    const stats = getAdjustmentStatistics();
    
    expect(stats.totalAdjustments).toBe(2);
    expect(stats.byType.dynamic).toBe(2);
  });
});

describe('Channel Multipliers with Dynamic Adjustments', () => {
  beforeEach(() => {
    clearAdjustmentHistory();
  });
  
  it('should calculate channel multipliers without dynamic when flag disabled', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableDynamicMultipliers', false);
    
    const channelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.40,
        countries: [{ country: 'Russia', weight: 0.40, riskScore: 75 }]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.35,
        countries: [{ country: 'Russia', weight: 0.35, riskScore: 75 }]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.15,
        countries: [{ country: 'Russia', weight: 0.15, riskScore: 75 }]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [{ country: 'Russia', weight: 0.10, riskScore: 75 }]
      }
    ];
    
    const result = calculateChannelMultipliersWithDynamic(
      channelExposures,
      'Russia',
      'Energy',
      'TEST'
    );
    
    expect(result.isDynamic).toBe(false);
    expect(result.dynamicAdjustments).toBeUndefined();
    expect(result.finalBlendedMultiplier).toBe(result.blendedMultiplier);
    
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
  
  it('should calculate channel multipliers with dynamic when flag enabled', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableDynamicMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.40,
        countries: [{ country: 'Russia', weight: 0.40, riskScore: 75 }]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.35,
        countries: [{ country: 'Russia', weight: 0.35, riskScore: 75 }]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.15,
        countries: [{ country: 'Russia', weight: 0.15, riskScore: 75 }]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [{ country: 'Russia', weight: 0.10, riskScore: 75 }]
      }
    ];
    
    const result = calculateChannelMultipliersWithDynamic(
      channelExposures,
      'Russia',
      'Energy',
      'TEST'
    );
    
    expect(result.isDynamic).toBe(true);
    expect(result.dynamicAdjustments).toBeDefined();
    expect(result.finalBlendedMultiplier).toBeGreaterThan(result.blendedMultiplier);
    expect(result.adjustmentHistory).toBeDefined();
    
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
  
  it('should compare dynamic impact', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableDynamicMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.40,
        countries: [{ country: 'China', weight: 0.40, riskScore: 65 }]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.35,
        countries: [{ country: 'China', weight: 0.35, riskScore: 65 }]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.15,
        countries: [{ country: 'China', weight: 0.15, riskScore: 65 }]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [{ country: 'China', weight: 0.10, riskScore: 65 }]
      }
    ];
    
    const comparison = compareDynamicImpact(channelExposures, 'China', 'Technology');
    
    expect(comparison.baseMultiplier).toBeGreaterThan(0);
    expect(comparison.dynamicMultiplier).toBeGreaterThanOrEqual(comparison.baseMultiplier);
    expect(comparison.impact).toBeGreaterThanOrEqual(0);
    
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
  
  it('should get dynamic adjustment summary', () => {
    const originalFlags = getFeatureFlags();
    setFeatureFlag('enableDynamicMultipliers', true);
    
    const channelExposures: ChannelExposureData[] = [
      {
        channel: 'Revenue',
        exposureWeight: 0.40,
        countries: [{ country: 'Russia', weight: 0.40, riskScore: 75 }]
      },
      {
        channel: 'Supply',
        exposureWeight: 0.35,
        countries: [{ country: 'Russia', weight: 0.35, riskScore: 75 }]
      },
      {
        channel: 'Assets',
        exposureWeight: 0.15,
        countries: [{ country: 'Russia', weight: 0.15, riskScore: 75 }]
      },
      {
        channel: 'Financial',
        exposureWeight: 0.10,
        countries: [{ country: 'Russia', weight: 0.10, riskScore: 75 }]
      }
    ];
    
    calculateChannelMultipliersWithDynamic(channelExposures, 'Russia', 'Energy', 'TEST');
    
    const summary = getDynamicAdjustmentSummary('TEST');
    
    expect(summary.hasHistory).toBe(true);
    expect(summary.totalAdjustments).toBe(1);
    expect(summary.currentMultipliers).toBeDefined();
    
    setFeatureFlag('enableDynamicMultipliers', originalFlags.enableDynamicMultipliers);
  });
});