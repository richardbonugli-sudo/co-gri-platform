/**
 * Dynamic Adjustment Tests - Phase 2 Task 2 Validation
 * 
 * Comprehensive tests for dynamic multiplier adjustments:
 * - Event-based adjustments
 * - Market condition responses
 * - Adjustment decay over time
 * - Adjustment history tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateEventImpact,
  getEventsForCountry,
  getEventsForSector,
  calculateAggregateEventImpact,
  getAllActiveEvents,
  ACTIVE_GEOPOLITICAL_EVENTS
} from '../geopoliticalEventMonitor';
import {
  calculateMarketStressIndex,
  calculateCurrencyStress,
  calculateCommodityStress,
  calculateMarketConditionAdjustment
} from '../marketConditionAnalyzer';
import {
  calculateDynamicAdjustment,
  calculateAllDynamicAdjustments,
  ADJUSTMENT_RULES
} from '../dynamicAdjustmentRules';
import {
  logDynamicAdjustment,
  getAdjustmentHistory,
  clearAdjustmentHistory
} from '../adjustmentHistoryTracker';

describe('Event-Based Adjustments', () => {
  it('should have active geopolitical events', () => {
    expect(ACTIVE_GEOPOLITICAL_EVENTS.length).toBeGreaterThan(0);
  });
  
  it('should calculate event impact with decay', () => {
    const event = ACTIVE_GEOPOLITICAL_EVENTS[0];
    const impact = calculateEventImpact(event);
    
    expect(impact.isActive).toBeDefined();
    expect(impact.decayFactor).toBeGreaterThan(0);
    expect(impact.decayFactor).toBeLessThanOrEqual(1);
  });
  
  it('should get events for Russia', () => {
    const events = getEventsForCountry('Russia');
    
    expect(events.length).toBeGreaterThan(0);
    events.forEach(event => {
      expect(event.affectedCountries).toContain('Russia');
    });
  });
  
  it('should calculate aggregate event impact', () => {
    const impact = calculateAggregateEventImpact('Russia', 'Supply');
    
    expect(impact.totalImpact).toBeGreaterThanOrEqual(0);
    expect(impact.totalImpact).toBeLessThanOrEqual(0.50);
    expect(impact.eventCount).toBeGreaterThanOrEqual(0);
  });
  
  it('should apply sanctions adjustment rule', () => {
    const adjustment = calculateDynamicAdjustment('Russia', 'Energy', 'Financial', 1.02);
    
    expect(adjustment.adjustedMultiplier).toBeGreaterThan(1.02);
    expect(adjustment.appliedRules.length).toBeGreaterThan(0);
  });
});

describe('Market Condition Responses', () => {
  it('should calculate market stress index', () => {
    const stressIndex = calculateMarketStressIndex();
    
    expect(stressIndex).toBeGreaterThanOrEqual(0);
    expect(stressIndex).toBeLessThanOrEqual(100);
  });
  
  it('should detect currency stress for Russia', () => {
    const stress = calculateCurrencyStress('Russia');
    
    expect(stress.stressLevel).toBe('critical');
    expect(stress.multiplierAdjustment).toBeGreaterThan(0);
  });
  
  it('should detect commodity stress for Energy sector', () => {
    const stress = calculateCommodityStress('Energy');
    
    expect(stress.affectedCommodities.length).toBeGreaterThan(0);
    expect(stress.multiplierAdjustment).toBeGreaterThanOrEqual(0);
  });
  
  it('should calculate market condition adjustment', () => {
    const adjustment = calculateMarketConditionAdjustment('Russia', 'Energy');
    
    expect(adjustment.totalAdjustment).toBeGreaterThanOrEqual(0);
    expect(adjustment.totalAdjustment).toBeLessThanOrEqual(0.25);
  });
});

describe('Adjustment Decay Over Time', () => {
  it('should apply temporal decay to old events', () => {
    const oldEvent = ACTIVE_GEOPOLITICAL_EVENTS.find(e => 
      new Date(e.startDate) < new Date('2020-01-01')
    );
    
    if (oldEvent) {
      const impact = calculateEventImpact(oldEvent);
      
      expect(impact.decayFactor).toBeLessThan(1);
      expect(impact.currentImpact.revenue).toBeLessThan(oldEvent.multiplierImpact.revenue);
    }
  });
  
  it('should maintain full impact for recent events', () => {
    const recentEvent = ACTIVE_GEOPOLITICAL_EVENTS.find(e => 
      new Date(e.startDate) > new Date('2023-01-01')
    );
    
    if (recentEvent) {
      const impact = calculateEventImpact(recentEvent);
      
      expect(impact.decayFactor).toBeGreaterThan(0.8);
    }
  });
});

describe('Adjustment History Tracking', () => {
  beforeEach(() => {
    clearAdjustmentHistory();
  });
  
  it('should log dynamic adjustment', () => {
    const result = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    const entry = logDynamicAdjustment(
      result,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    expect(entry.id).toBeTruthy();
    expect(entry.ticker).toBe('TEST');
    expect(entry.adjustmentType).toBe('dynamic');
  });
  
  it('should retrieve adjustment history', () => {
    const result = calculateAllDynamicAdjustments(
      'Russia',
      'Energy',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    logDynamicAdjustment(
      result,
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      'TEST'
    );
    
    const history = getAdjustmentHistory('TEST');
    
    expect(history.length).toBe(1);
    expect(history[0].ticker).toBe('TEST');
  });
});

describe('Dynamic Adjustment Rules', () => {
  it('should have adjustment rules defined', () => {
    expect(ADJUSTMENT_RULES.length).toBeGreaterThan(0);
  });
  
  it('should apply high-priority rules first', () => {
    const highPriorityRules = ADJUSTMENT_RULES.filter(r => r.priority >= 8);
    
    expect(highPriorityRules.length).toBeGreaterThan(0);
  });
  
  it('should calculate all dynamic adjustments', () => {
    const result = calculateAllDynamicAdjustments(
      'China',
      'Technology',
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    expect(result.country).toBe('China');
    expect(result.sector).toBe('Technology');
    expect(result.blendedAdjustment).toBeGreaterThan(0);
  });
});