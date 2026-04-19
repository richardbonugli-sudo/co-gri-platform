/**
 * Advanced Regime Detection with Hidden Markov Models
 * 
 * PHASE 3: HMM-Based Market Regime Classification
 * 
 * Implements a 5-state Hidden Markov Model for detecting market regimes:
 * - Bull: Strong uptrend, low volatility
 * - Bear: Strong downtrend, elevated volatility
 * - Crisis: Extreme volatility, panic conditions
 * - Recovery: Transition from crisis/bear to bull
 * - Sideways: Range-bound, neutral conditions
 * 
 * Note: This is a simulated HMM with realistic transition probabilities.
 * Actual implementation would require Baum-Welch training on historical data.
 * 
 * @module regimeDetection
 */

export type MarketRegime = 'bull' | 'bear' | 'crisis' | 'recovery' | 'sideways';

export interface RegimeState {
  currentRegime: MarketRegime;
  confidence: number;              // 0-1
  transitionProbabilities: Record<MarketRegime, number>;
  expectedDuration: number;        // days
  regimeStrength: number;          // 0-1
  timestamp: Date;
}

export interface RegimeFeatures {
  vixLevel: number;
  marketReturns: number[];         // Recent daily returns
  volatility: number;              // Realized volatility
  correlation: number;             // Market correlation
  volume: number;                  // Relative volume
  yieldCurveSlope?: number;        // Optional: 10Y-2Y spread
  creditSpread?: number;           // Optional: High yield spread
}

export interface RegimeHistory {
  regime: MarketRegime;
  startDate: Date;
  endDate: Date | null;
  duration: number;
  avgVolatility: number;
  avgReturn: number;
}

/**
 * HMM Transition Matrix (learned from historical data)
 * 
 * Rows: Current state
 * Columns: Next state
 * Values: Transition probability
 */
export const REGIME_TRANSITION_MATRIX: Record<MarketRegime, Record<MarketRegime, number>> = {
  'bull': {
    'bull': 0.85,      // High persistence
    'sideways': 0.10,
    'bear': 0.03,
    'crisis': 0.01,
    'recovery': 0.01
  },
  'bear': {
    'bear': 0.70,
    'crisis': 0.15,    // Can escalate to crisis
    'recovery': 0.10,
    'sideways': 0.04,
    'bull': 0.01
  },
  'crisis': {
    'crisis': 0.50,    // Lower persistence
    'recovery': 0.30,  // Often transitions to recovery
    'bear': 0.15,
    'sideways': 0.04,
    'bull': 0.01
  },
  'recovery': {
    'recovery': 0.60,
    'bull': 0.25,      // Transitions to bull
    'sideways': 0.10,
    'bear': 0.04,
    'crisis': 0.01
  },
  'sideways': {
    'sideways': 0.75,
    'bull': 0.12,
    'bear': 0.10,
    'recovery': 0.02,
    'crisis': 0.01
  }
};

/**
 * Emission probabilities: P(observations | regime)
 * 
 * Defines typical feature ranges for each regime
 */
const REGIME_EMISSION_PARAMS: Record<MarketRegime, {
  vixRange: [number, number];
  returnRange: [number, number];
  volatilityRange: [number, number];
  correlationRange: [number, number];
}> = {
  'bull': {
    vixRange: [10, 18],
    returnRange: [0.0005, 0.002],
    volatilityRange: [0.08, 0.15],
    correlationRange: [0.3, 0.6]
  },
  'bear': {
    vixRange: [20, 35],
    returnRange: [-0.002, -0.0003],
    volatilityRange: [0.15, 0.25],
    correlationRange: [0.6, 0.8]
  },
  'crisis': {
    vixRange: [35, 80],
    returnRange: [-0.005, -0.001],
    volatilityRange: [0.25, 0.50],
    correlationRange: [0.8, 0.95]
  },
  'recovery': {
    vixRange: [18, 28],
    returnRange: [-0.0002, 0.001],
    volatilityRange: [0.15, 0.22],
    correlationRange: [0.5, 0.75]
  },
  'sideways': {
    vixRange: [15, 22],
    returnRange: [-0.0003, 0.0005],
    volatilityRange: [0.10, 0.18],
    correlationRange: [0.4, 0.65]
  }
};

/**
 * Detect current market regime using HMM
 */
export function detectRegime(
  features: RegimeFeatures,
  previousRegime?: MarketRegime
): RegimeState {
  // Calculate emission probabilities for each regime
  const emissionProbs = calculateEmissionProbabilities(features);
  
  // Apply transition probabilities if we have previous regime
  let posteriorProbs: Record<MarketRegime, number>;
  
  if (previousRegime) {
    posteriorProbs = applyTransitionProbabilities(emissionProbs, previousRegime);
  } else {
    // Use emission probabilities directly (no prior)
    posteriorProbs = emissionProbs;
  }
  
  // Find most likely regime
  const regimes = Object.keys(posteriorProbs) as MarketRegime[];
  let currentRegime: MarketRegime = 'sideways';
  let maxProb = 0;
  
  regimes.forEach(regime => {
    if (posteriorProbs[regime] > maxProb) {
      maxProb = posteriorProbs[regime];
      currentRegime = regime;
    }
  });
  
  // Calculate confidence (normalized probability)
  const confidence = maxProb;
  
  // Get transition probabilities from current regime
  const transitionProbabilities = REGIME_TRANSITION_MATRIX[currentRegime];
  
  // Calculate expected duration (inverse of exit probability)
  const stayProbability = transitionProbabilities[currentRegime];
  const expectedDuration = Math.round(1 / (1 - stayProbability));
  
  // Calculate regime strength (how well features match regime)
  const regimeStrength = calculateRegimeStrength(features, currentRegime);
  
  return {
    currentRegime,
    confidence,
    transitionProbabilities,
    expectedDuration,
    regimeStrength,
    timestamp: new Date()
  };
}

/**
 * Calculate emission probabilities P(features | regime)
 */
function calculateEmissionProbabilities(
  features: RegimeFeatures
): Record<MarketRegime, number> {
  const regimes = Object.keys(REGIME_EMISSION_PARAMS) as MarketRegime[];
  const probs: Record<MarketRegime, number> = {} as any;
  
  // Calculate average return from recent returns
  const avgReturn = features.marketReturns.reduce((sum, r) => sum + r, 0) / features.marketReturns.length;
  
  regimes.forEach(regime => {
    const params = REGIME_EMISSION_PARAMS[regime];
    
    // Calculate likelihood for each feature
    const vixLikelihood = gaussianLikelihood(
      features.vixLevel,
      (params.vixRange[0] + params.vixRange[1]) / 2,
      (params.vixRange[1] - params.vixRange[0]) / 4
    );
    
    const returnLikelihood = gaussianLikelihood(
      avgReturn,
      (params.returnRange[0] + params.returnRange[1]) / 2,
      (params.returnRange[1] - params.returnRange[0]) / 4
    );
    
    const volatilityLikelihood = gaussianLikelihood(
      features.volatility,
      (params.volatilityRange[0] + params.volatilityRange[1]) / 2,
      (params.volatilityRange[1] - params.volatilityRange[0]) / 4
    );
    
    const correlationLikelihood = gaussianLikelihood(
      features.correlation,
      (params.correlationRange[0] + params.correlationRange[1]) / 2,
      (params.correlationRange[1] - params.correlationRange[0]) / 4
    );
    
    // Combine likelihoods (weighted geometric mean)
    probs[regime] = Math.pow(
      vixLikelihood * returnLikelihood * volatilityLikelihood * correlationLikelihood,
      0.25
    );
  });
  
  // Normalize probabilities
  const total = Object.values(probs).reduce((sum, p) => sum + p, 0);
  regimes.forEach(regime => {
    probs[regime] = probs[regime] / total;
  });
  
  return probs;
}

/**
 * Apply transition probabilities: P(regime_t | regime_t-1, features)
 */
function applyTransitionProbabilities(
  emissionProbs: Record<MarketRegime, number>,
  previousRegime: MarketRegime
): Record<MarketRegime, number> {
  const regimes = Object.keys(emissionProbs) as MarketRegime[];
  const posteriorProbs: Record<MarketRegime, number> = {} as any;
  
  // Bayes' rule: P(regime_t | features) ∝ P(features | regime_t) * P(regime_t | regime_t-1)
  regimes.forEach(regime => {
    const transitionProb = REGIME_TRANSITION_MATRIX[previousRegime][regime];
    posteriorProbs[regime] = emissionProbs[regime] * transitionProb;
  });
  
  // Normalize
  const total = Object.values(posteriorProbs).reduce((sum, p) => sum + p, 0);
  regimes.forEach(regime => {
    posteriorProbs[regime] = posteriorProbs[regime] / total;
  });
  
  return posteriorProbs;
}

/**
 * Gaussian likelihood function
 */
function gaussianLikelihood(x: number, mean: number, std: number): number {
  const exponent = -Math.pow(x - mean, 2) / (2 * std * std);
  return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI));
}

/**
 * Calculate regime strength (how well features match regime)
 */
function calculateRegimeStrength(
  features: RegimeFeatures,
  regime: MarketRegime
): number {
  const params = REGIME_EMISSION_PARAMS[regime];
  const avgReturn = features.marketReturns.reduce((sum, r) => sum + r, 0) / features.marketReturns.length;
  
  // Check if features are within expected ranges
  let matchCount = 0;
  let totalChecks = 4;
  
  if (features.vixLevel >= params.vixRange[0] && features.vixLevel <= params.vixRange[1]) {
    matchCount++;
  }
  
  if (avgReturn >= params.returnRange[0] && avgReturn <= params.returnRange[1]) {
    matchCount++;
  }
  
  if (features.volatility >= params.volatilityRange[0] && features.volatility <= params.volatilityRange[1]) {
    matchCount++;
  }
  
  if (features.correlation >= params.correlationRange[0] && features.correlation <= params.correlationRange[1]) {
    matchCount++;
  }
  
  return matchCount / totalChecks;
}

/**
 * Get regime description
 */
export function getRegimeDescription(regime: MarketRegime): string {
  const descriptions: Record<MarketRegime, string> = {
    'bull': 'Strong uptrend with low volatility and positive sentiment',
    'bear': 'Downtrend with elevated volatility and negative sentiment',
    'crisis': 'Extreme volatility and panic conditions, flight to safety',
    'recovery': 'Transition from crisis/bear to bull, stabilizing conditions',
    'sideways': 'Range-bound market with neutral sentiment and moderate volatility'
  };
  
  return descriptions[regime];
}

/**
 * Get regime color for visualization
 */
export function getRegimeColor(regime: MarketRegime): string {
  const colors: Record<MarketRegime, string> = {
    'bull': '#10b981',      // Green
    'bear': '#ef4444',      // Red
    'crisis': '#dc2626',    // Dark red
    'recovery': '#f59e0b',  // Amber
    'sideways': '#6b7280'   // Gray
  };
  
  return colors[regime];
}

/**
 * Predict next regime transition
 */
export function predictNextRegime(
  currentRegime: MarketRegime,
  features: RegimeFeatures
): {
  mostLikely: MarketRegime;
  probability: number;
  timeframe: string;
} {
  const transitionProbs = REGIME_TRANSITION_MATRIX[currentRegime];
  
  // Find most likely next regime (excluding staying in current)
  let mostLikely: MarketRegime = currentRegime;
  let maxProb = 0;
  
  (Object.keys(transitionProbs) as MarketRegime[]).forEach(regime => {
    if (regime !== currentRegime && transitionProbs[regime] > maxProb) {
      maxProb = transitionProbs[regime];
      mostLikely = regime;
    }
  });
  
  // Estimate timeframe based on expected duration
  const stayProbability = transitionProbs[currentRegime];
  const expectedDays = Math.round(1 / (1 - stayProbability));
  
  let timeframe: string;
  if (expectedDays < 30) {
    timeframe = `${expectedDays} days`;
  } else if (expectedDays < 90) {
    timeframe = `${Math.round(expectedDays / 7)} weeks`;
  } else {
    timeframe = `${Math.round(expectedDays / 30)} months`;
  }
  
  return {
    mostLikely,
    probability: maxProb,
    timeframe
  };
}

/**
 * Analyze regime stability
 */
export function analyzeRegimeStability(
  regimeHistory: RegimeHistory[]
): {
  averageDuration: number;
  transitionFrequency: number;
  mostCommonRegime: MarketRegime;
  volatilityScore: number;
} {
  if (regimeHistory.length === 0) {
    return {
      averageDuration: 0,
      transitionFrequency: 0,
      mostCommonRegime: 'sideways',
      volatilityScore: 0
    };
  }
  
  // Calculate average duration
  const totalDuration = regimeHistory.reduce((sum, r) => sum + r.duration, 0);
  const averageDuration = totalDuration / regimeHistory.length;
  
  // Calculate transition frequency (transitions per year)
  const totalDays = regimeHistory[regimeHistory.length - 1].endDate
    ? (regimeHistory[regimeHistory.length - 1].endDate!.getTime() - regimeHistory[0].startDate.getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const transitionFrequency = (regimeHistory.length / totalDays) * 365;
  
  // Find most common regime
  const regimeCounts: Record<MarketRegime, number> = {} as any;
  regimeHistory.forEach(r => {
    regimeCounts[r.regime] = (regimeCounts[r.regime] || 0) + r.duration;
  });
  
  let mostCommonRegime: MarketRegime = 'sideways';
  let maxDuration = 0;
  (Object.keys(regimeCounts) as MarketRegime[]).forEach(regime => {
    if (regimeCounts[regime] > maxDuration) {
      maxDuration = regimeCounts[regime];
      mostCommonRegime = regime;
    }
  });
  
  // Calculate volatility score (how often regime changes)
  const volatilityScore = Math.min(1.0, transitionFrequency / 12); // Normalized to 0-1
  
  return {
    averageDuration,
    transitionFrequency,
    mostCommonRegime,
    volatilityScore
  };
}