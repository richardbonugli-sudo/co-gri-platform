/**
 * Feature Flags Configuration - PHASE 1 & 2 COMPLETE + Phase 2 Task 2 + Task 3
 * 
 * Controls feature availability and A/B testing across the application.
 * Phase 1: Sector Multiplier Transparency
 * Phase 2 Task 1: Channel-Specific Multipliers
 * Phase 2 Task 2: Dynamic Multiplier Adjustments
 * Phase 2 Task 3: ML-Based Calibration
 * V.4 Integration: Feature flag for V.4 vs legacy routing
 */

export interface FeatureFlags {
  // Phase 1: Sector Multiplier Transparency
  enableSectorMultiplierTransparency: boolean;
  showSectorMultiplierCard: boolean;
  showValidationWarnings: boolean;
  enableEnhancedCalculation: boolean;
  
  // V.4 Integration (Phase 2 Enhanced)
  enableV4Logic: boolean;
  v4RolloutPercentage: number; // 0-100, controls gradual rollout
  enableV4ForSpecificTickers?: string[]; // Ticker-specific overrides
  fallbackToV34OnError?: boolean; // Auto-fallback on errors
  v4DataValidation?: boolean; // Validate V.4 data before use
  
  // Phase 2: Channel-Specific Multipliers (Task 1)
  enableChannelSpecificMultipliers: boolean;
  
  // Phase 2: Dynamic Multiplier Adjustments (Task 2)
  enableDynamicMultipliers: boolean;
  
  // Phase 2: ML-Based Calibration (Task 3)
  enableMLCalibration: boolean;
  
  // Future phases
  enableMLCalibration: boolean;
}

/**
 * Default feature flags configuration
 * Phase 1 features are enabled by default
 * Phase 2 features are disabled by default (ready for testing)
 * V.4 is enabled at 100% rollout with safety features
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Phase 1: Enabled
  enableSectorMultiplierTransparency: true,
  showSectorMultiplierCard: true,
  showValidationWarnings: true,
  enableEnhancedCalculation: true,
  
  // V.4 Integration: Enabled at 100% with safety features
  enableV4Logic: true,
  v4RolloutPercentage: 100,
  enableV4ForSpecificTickers: ['AAPL', 'TSLA'], // Whitelist for initial rollout
  fallbackToV34OnError: true, // Always fallback on errors
  v4DataValidation: true, // Validate data before use
  
  // Phase 2 Task 1: Channel-Specific Multipliers (Disabled, ready for testing)
  enableChannelSpecificMultipliers: true,
  
  // Phase 2 Task 2: Dynamic Multiplier Adjustments (Disabled, ready for testing)
  enableDynamicMultipliers: true,
  
  // Phase 2 Task 3: ML-Based Calibration (Disabled, ready for testing)
  enableMLCalibration: true
};

/**
 * Mutable feature flags (for runtime updates)
 */
let FEATURE_FLAGS = { ...DEFAULT_FEATURE_FLAGS };

/**
 * Get current feature flags (can be extended to read from environment/API)
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...FEATURE_FLAGS };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[feature] as boolean;
}

/**
 * Set a feature flag (for testing/development)
 */
export function setFeatureFlag(feature: keyof FeatureFlags, value: boolean | number): void {
  (FEATURE_FLAGS[feature] as boolean | number) = value;
  console.log(`[Feature Flags] Set ${feature} = ${value}`);
}

/**
 * Toggle a feature flag (for testing/development)
 */
export function toggleFeature(feature: keyof FeatureFlags): void {
  if (typeof FEATURE_FLAGS[feature] === 'boolean') {
    (FEATURE_FLAGS[feature] as boolean) = !(FEATURE_FLAGS[feature] as boolean);
    console.log(`[Feature Flags] Toggled ${feature} to ${FEATURE_FLAGS[feature]}`);
  }
}

/**
 * Get Phase 1 status
 */
export function isPhase1Enabled(): boolean {
  return FEATURE_FLAGS.enableSectorMultiplierTransparency && 
         FEATURE_FLAGS.showSectorMultiplierCard && 
         FEATURE_FLAGS.enableEnhancedCalculation;
}

/**
 * PHASE 2: Check if V.4 logic should be used for a specific ticker
 * 
 * Enhanced logic with ticker-specific overrides and validation
 */
export function shouldUseV4(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase();
  
  // If V.4 is globally disabled, return false
  if (!FEATURE_FLAGS.enableV4Logic) {
    console.log(`[shouldUseV4] V.4 globally disabled for ${upperTicker}`);
    return false;
  }
  
  // Check ticker-specific whitelist first (Phase 2)
  if (FEATURE_FLAGS.enableV4ForSpecificTickers && FEATURE_FLAGS.enableV4ForSpecificTickers.length > 0) {
    const inWhitelist = FEATURE_FLAGS.enableV4ForSpecificTickers.includes(upperTicker);
    console.log(`[shouldUseV4] ${upperTicker} in whitelist: ${inWhitelist}`);
    return inWhitelist;
  }
  
  // If rollout is at 100%, use V.4 for all tickers
  if (FEATURE_FLAGS.v4RolloutPercentage >= 100) {
    console.log(`[shouldUseV4] V.4 at 100% rollout for ${upperTicker}`);
    return true;
  }
  
  // If rollout is at 0%, use legacy for all tickers
  if (FEATURE_FLAGS.v4RolloutPercentage <= 0) {
    console.log(`[shouldUseV4] V.4 at 0% rollout for ${upperTicker}`);
    return false;
  }
  
  // For gradual rollout, use deterministic hash-based selection
  const hash = simpleHash(upperTicker);
  const threshold = (FEATURE_FLAGS.v4RolloutPercentage / 100) * 0xFFFFFFFF;
  const selected = hash < threshold;
  
  console.log(`[shouldUseV4] ${upperTicker} hash-based selection: ${selected} (${FEATURE_FLAGS.v4RolloutPercentage}%)`);
  return selected;
}

/**
 * PHASE 2: Check if V.4 is enabled for a specific ticker (alias)
 */
export function isV4EnabledForTicker(ticker: string): boolean {
  return shouldUseV4(ticker);
}

/**
 * PHASE 2: Get V.4 rollout status
 */
export function getV4RolloutStatus(): { 
  enabled: boolean; 
  percentage: number; 
  tickerCount: number;
  whitelistedTickers: string[];
} {
  return {
    enabled: FEATURE_FLAGS.enableV4Logic,
    percentage: FEATURE_FLAGS.v4RolloutPercentage,
    tickerCount: FEATURE_FLAGS.enableV4ForSpecificTickers?.length || 0,
    whitelistedTickers: FEATURE_FLAGS.enableV4ForSpecificTickers || []
  };
}

/**
 * PHASE 2: Should fallback to V3.4 on error
 */
export function shouldFallbackToV34(error: Error): boolean {
  // Always fallback if flag is set
  if (FEATURE_FLAGS.fallbackToV34OnError) {
    console.log(`[shouldFallbackToV34] Auto-fallback enabled, falling back due to:`, error.message);
    return true;
  }
  
  // Check for specific error types that should trigger fallback
  const fallbackErrors = [
    'No V.4 data',
    'V.4 calculation failed',
    'Invalid V.4 result',
    'Network error',
    'Timeout'
  ];
  
  const shouldFallback = fallbackErrors.some(errType => 
    error.message.toLowerCase().includes(errType.toLowerCase())
  );
  
  if (shouldFallback) {
    console.log(`[shouldFallbackToV34] Error type requires fallback:`, error.message);
  }
  
  return shouldFallback;
}

/**
 * Simple hash function for deterministic ticker selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get V.4 rollout statistics
 */
export function getV4RolloutStats(): {
  enabled: boolean;
  percentage: number;
  description: string;
  whitelistedTickers: string[];
} {
  const description = !FEATURE_FLAGS.enableV4Logic
    ? 'V.4 logic is globally disabled'
    : FEATURE_FLAGS.enableV4ForSpecificTickers && FEATURE_FLAGS.enableV4ForSpecificTickers.length > 0
    ? `V.4 logic is enabled for ${FEATURE_FLAGS.enableV4ForSpecificTickers.length} whitelisted tickers`
    : FEATURE_FLAGS.v4RolloutPercentage >= 100
    ? 'V.4 logic is enabled for all tickers'
    : FEATURE_FLAGS.v4RolloutPercentage <= 0
    ? 'V.4 logic is disabled for all tickers'
    : `V.4 logic is enabled for ${FEATURE_FLAGS.v4RolloutPercentage}% of tickers`;
  
  return {
    enabled: FEATURE_FLAGS.enableV4Logic,
    percentage: FEATURE_FLAGS.v4RolloutPercentage,
    description,
    whitelistedTickers: FEATURE_FLAGS.enableV4ForSpecificTickers || []
  };
}

/**
 * Get calculation mode information
 * Returns details about which calculation mode is active
 */
export function getCalculationMode(): {
  mode: 'phase2-ml' | 'phase2-dynamic' | 'phase2' | 'enhanced' | 'legacy';
  description: string;
  features: string[];
} {
  // Phase 2 Task 3: ML Calibration
  if (FEATURE_FLAGS.enableMLCalibration &&
      FEATURE_FLAGS.enableDynamicMultipliers && 
      FEATURE_FLAGS.enableChannelSpecificMultipliers && 
      FEATURE_FLAGS.enableEnhancedCalculation) {
    return {
      mode: 'phase2-ml',
      description: 'Phase 2 ML: Channel-Specific Multipliers with ML-Based Calibration',
      features: [
        'ML-based multiplier optimization',
        'Predictive risk analysis',
        'Automated calibration recommendations',
        'Dynamic multiplier adjustments based on geopolitical events',
        'Real-time market condition analysis',
        'Channel-specific risk multipliers',
        'Sector multiplier transparency',
        'V.4 orchestrator routing'
      ]
    };
  }
  
  // Phase 2 Task 2: Dynamic Multipliers
  if (FEATURE_FLAGS.enableDynamicMultipliers && 
      FEATURE_FLAGS.enableChannelSpecificMultipliers && 
      FEATURE_FLAGS.enableEnhancedCalculation) {
    return {
      mode: 'phase2-dynamic',
      description: 'Phase 2 Dynamic: Channel-Specific Multipliers with Real-Time Adjustments',
      features: [
        'Dynamic multiplier adjustments based on geopolitical events',
        'Real-time market condition analysis',
        'Event-driven multiplier updates',
        'Adjustment history tracking',
        'Channel-specific risk multipliers',
        'Sector multiplier transparency',
        'V.4 orchestrator routing'
      ]
    };
  }
  
  // Phase 2 Task 1: Channel-Specific Multipliers
  if (FEATURE_FLAGS.enableChannelSpecificMultipliers && 
      FEATURE_FLAGS.enableEnhancedCalculation) {
    return {
      mode: 'phase2',
      description: 'Phase 2: Channel-Specific Multipliers with Sector Transparency',
      features: [
        'Channel-specific risk multipliers',
        'Blended four-channel calculation',
        'Risk factor analysis per channel',
        'Sector multiplier transparency',
        'V.4 orchestrator routing'
      ]
    };
  }
  
  // Phase 1: Enhanced Calculation
  if (FEATURE_FLAGS.enableEnhancedCalculation && FEATURE_FLAGS.enableSectorMultiplierTransparency) {
    return {
      mode: 'enhanced',
      description: 'Enhanced COGRI with Phase 1 Sector Multiplier Transparency + V.4 Integration',
      features: [
        'Sector multiplier validation',
        'Transparency layer with rationale',
        'Context-aware warnings',
        'Confidence scoring',
        'V.4 orchestrator routing',
        'Automatic fallback to legacy'
      ]
    };
  }
  
  return {
    mode: 'legacy',
    description: 'Standard COGRI calculation',
    features: [
      'Four-channel exposure analysis',
      'Country shock index',
      'Political alignment amplification'
    ]
  };
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  FEATURE_FLAGS = { ...DEFAULT_FEATURE_FLAGS };
  console.log('[Feature Flags] Reset to defaults');
}