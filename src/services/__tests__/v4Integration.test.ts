/**
 * V.4 Integration Tests - PHASE 5
 * 
 * Comprehensive test suite for V.4 integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  shouldUseV4, 
  isV4EnabledForTicker,
  getV4RolloutStatus,
  shouldFallbackToV34,
  getFeatureFlags
} from '@/config/featureFlags';
import { hasV4Enhancements } from '@/data/enhancedCompanyExposures';
import { testV4Routing, getV4RoutingStats } from '@/services/v34ComprehensiveIntegrationV4';

describe('V.4 Integration - Feature Flags', () => {
  
  it('should check if V.4 is enabled globally', () => {
    const flags = getFeatureFlags();
    expect(flags.enableV4Logic).toBeDefined();
    expect(typeof flags.enableV4Logic).toBe('boolean');
  });
  
  it('should return V.4 rollout status', () => {
    const status = getV4RolloutStatus();
    expect(status).toHaveProperty('enabled');
    expect(status).toHaveProperty('percentage');
    expect(status).toHaveProperty('whitelistedTickers');
    expect(Array.isArray(status.whitelistedTickers)).toBe(true);
  });
  
  it('should check V.4 for whitelisted tickers', () => {
    const status = getV4RolloutStatus();
    
    if (status.whitelistedTickers.length > 0) {
      const firstTicker = status.whitelistedTickers[0];
      const shouldUse = shouldUseV4(firstTicker);
      
      if (status.enabled) {
        expect(shouldUse).toBe(true);
      }
    }
  });
  
  it('should handle fallback logic', () => {
    const error1 = new Error('No V.4 data available');
    const error2 = new Error('Network timeout');
    const error3 = new Error('Some other error');
    
    // These should trigger fallback
    expect(shouldFallbackToV34(error1)).toBe(true);
    
    // Generic errors should also fallback if flag is set
    const flags = getFeatureFlags();
    if (flags.fallbackToV34OnError) {
      expect(shouldFallbackToV34(error3)).toBe(true);
    }
  });
});

describe('V.4 Integration - Data Availability', () => {
  
  it('should identify V.4 enhanced tickers', () => {
    expect(hasV4Enhancements('AAPL')).toBe(true);
    expect(hasV4Enhancements('TSLA')).toBe(true);
    expect(hasV4Enhancements('MSFT')).toBe(false); // Legacy format
  });
  
  it('should return false for non-existent tickers', () => {
    expect(hasV4Enhancements('INVALID123')).toBe(false);
  });
  
  it('should get V.4 routing statistics', () => {
    const stats = getV4RoutingStats();
    expect(stats).toHaveProperty('v4Enabled');
    expect(stats).toHaveProperty('rolloutPercentage');
    expect(stats).toHaveProperty('enhancedTickers');
    expect(stats).toHaveProperty('totalEnhanced');
    
    expect(Array.isArray(stats.enhancedTickers)).toBe(true);
    expect(stats.totalEnhanced).toBeGreaterThanOrEqual(0);
    
    // Should have at least AAPL and TSLA
    expect(stats.totalEnhanced).toBeGreaterThanOrEqual(2);
  });
});

describe('V.4 Integration - Routing Logic', () => {
  
  it('should test V.4 routing for AAPL', () => {
    const result = testV4Routing('AAPL');
    
    expect(result.ticker).toBe('AAPL');
    expect(result).toHaveProperty('shouldUseV4');
    expect(result).toHaveProperty('hasV4Data');
    expect(result).toHaveProperty('willRoute');
    expect(result).toHaveProperty('reason');
    
    // AAPL has V.4 data
    expect(result.hasV4Data).toBe(true);
    
    // If V.4 is enabled and AAPL is in whitelist, should route to V.4
    const status = getV4RolloutStatus();
    if (status.enabled && status.whitelistedTickers.includes('AAPL')) {
      expect(result.willRoute).toBe('v4');
    }
  });
  
  it('should test V.4 routing for TSLA', () => {
    const result = testV4Routing('TSLA');
    
    expect(result.ticker).toBe('TSLA');
    expect(result.hasV4Data).toBe(true);
    
    const status = getV4RolloutStatus();
    if (status.enabled && status.whitelistedTickers.includes('TSLA')) {
      expect(result.willRoute).toBe('v4');
    }
  });
  
  it('should test V.4 routing for MSFT (legacy)', () => {
    const result = testV4Routing('MSFT');
    
    expect(result.ticker).toBe('MSFT');
    expect(result.hasV4Data).toBe(false);
    expect(result.willRoute).toBe('legacy');
  });
  
  it('should handle case-insensitive tickers', () => {
    const result1 = testV4Routing('aapl');
    const result2 = testV4Routing('AAPL');
    
    expect(result1.ticker).toBe('AAPL');
    expect(result2.ticker).toBe('AAPL');
    expect(result1.hasV4Data).toBe(result2.hasV4Data);
  });
});

describe('V.4 Integration - Phase 1 Compatibility', () => {
  
  it('should maintain Phase 1 feature flags', () => {
    const flags = getFeatureFlags();
    
    expect(flags).toHaveProperty('enableSectorMultiplierTransparency');
    expect(flags).toHaveProperty('showSectorMultiplierCard');
    expect(flags).toHaveProperty('showValidationWarnings');
    expect(flags).toHaveProperty('enableEnhancedCalculation');
  });
  
  it('should not break Phase 1 when V.4 is enabled', () => {
    const flags = getFeatureFlags();
    
    // Both Phase 1 and V.4 can be enabled simultaneously
    if (flags.enableV4Logic && flags.enableSectorMultiplierTransparency) {
      expect(flags.enableEnhancedCalculation).toBe(true);
    }
  });
});

describe('V.4 Integration - Error Handling', () => {
  
  it('should provide meaningful error messages', () => {
    const result = testV4Routing('INVALID_TICKER');
    
    expect(result.willRoute).toBe('legacy');
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });
  
  it('should handle empty ticker', () => {
    const result = testV4Routing('');
    
    expect(result.ticker).toBe('');
    expect(result.willRoute).toBe('legacy');
  });
});

/**
 * Integration Test Summary
 * 
 * ✅ Feature Flags: V.4 logic controlled by feature flags
 * ✅ Data Availability: V.4 enhancements detected correctly
 * ✅ Routing Logic: Proper routing to V.4 or legacy
 * ✅ Phase 1 Compatibility: Phase 1 features work with V.4
 * ✅ Error Handling: Graceful fallback on errors
 * 
 * Test Coverage:
 * - Feature flag validation
 * - V.4 data detection (AAPL, TSLA, MSFT)
 * - Routing decision logic
 * - Whitelist functionality
 * - Fallback error handling
 * - Phase 1 compatibility
 * - Case-insensitive ticker handling
 */