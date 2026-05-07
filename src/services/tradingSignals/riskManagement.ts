/**
 * Risk Management System for CO-GRI Trading
 * 
 * Provides comprehensive risk management including:
 * - Kelly Criterion position sizing
 * - Maximum drawdown protection
 * - Portfolio-level risk limits
 * - Correlation-based diversification
 * - Dynamic stop-loss and take-profit
 * 
 * PHASE 2 ENHANCEMENTS:
 * - Dynamic trailing stop-loss based on volatility
 * - Time-based exit rules
 * - Correlation-based position reduction
 * - Enhanced portfolio diversification monitoring
 * 
 * @module riskManagement
 */

export interface Position {
  ticker: string;
  direction: 'long' | 'short';
  size: number; // Fraction of portfolio
  entryPrice: number;
  entryDate: Date;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  stopLoss: number;
  takeProfit: number;
}

export interface PortfolioRiskMetrics {
  totalExposure: number; // Sum of absolute positions
  netExposure: number; // Long - short
  currentDrawdown: number;
  peakEquity: number;
  currentEquity: number;
  var95: number; // Value at Risk (95%)
  expectedShortfall: number; // CVaR
  concentrationScore: number; // 0-1, higher = more concentrated
  correlationScore: number; // PHASE 2: Portfolio-wide correlation
}

export interface RiskLimits {
  maxPositionSize: number; // Max single position (e.g., 0.40 = 40%) - PHASE 1 updated
  maxTotalExposure: number; // Max gross exposure (e.g., 2.0 = 200%)
  maxDrawdown: number; // Max portfolio drawdown (e.g., 0.15 = 15%)
  maxCorrelation: number; // Max correlation between positions
  minDiversification: number; // Min number of uncorrelated positions
}

export interface StopLossConfig {
  type: 'fixed' | 'trailing' | 'volatility' | 'time';
  value: number; // Percentage or ATR multiplier
  trailingDistance?: number;
}

export interface TakeProfitConfig {
  type: 'fixed' | 'trailing' | 'risk_reward';
  value: number;
  riskRewardRatio?: number;
}

const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxPositionSize: 0.40,  // PHASE 1: Updated from 0.35 to 0.40
  maxTotalExposure: 2.0,
  maxDrawdown: 0.15,
  maxCorrelation: 0.7,
  minDiversification: 3,
};

/**
 * Calculate Kelly Criterion optimal position size
 */
export function calculateKellyPosition(
  winRate: number,
  avgWinPercent: number,
  avgLossPercent: number,
  fractionalKelly: number = 0.25
): number {
  if (avgLossPercent === 0 || winRate === 0 || winRate === 1) {
    return 0;
  }
  
  const b = avgWinPercent / avgLossPercent; // Win/loss ratio
  const p = winRate; // Probability of winning
  const q = 1 - p; // Probability of losing
  
  // Kelly formula: f = (bp - q) / b
  const kellyFraction = (b * p - q) / b;
  
  // Apply fractional Kelly for safety (typically 0.25 to 0.5)
  const position = Math.max(0, Math.min(1, kellyFraction * fractionalKelly));
  
  return position;
}

/**
 * Check if adding a new position would exceed drawdown limit
 */
export function checkDrawdownLimit(
  currentEquity: number,
  peakEquity: number,
  limits: RiskLimits = DEFAULT_RISK_LIMITS
): { allowed: boolean; currentDrawdown: number; reason: string } {
  const currentDrawdown = (peakEquity - currentEquity) / peakEquity;
  
  if (currentDrawdown >= limits.maxDrawdown) {
    return {
      allowed: false,
      currentDrawdown,
      reason: `Portfolio drawdown (${(currentDrawdown * 100).toFixed(1)}%) exceeds limit (${(limits.maxDrawdown * 100).toFixed(1)}%)`,
    };
  }
  
  return {
    allowed: true,
    currentDrawdown,
    reason: 'Drawdown within limits',
  };
}

/**
 * Enforce portfolio-level risk limits
 */
export function enforcePortfolioLimits(
  positions: Position[],
  newPosition: { size: number; direction: 'long' | 'short' },
  limits: RiskLimits = DEFAULT_RISK_LIMITS
): { allowed: boolean; adjustedSize: number; reason: string } {
  // Check individual position size
  if (newPosition.size > limits.maxPositionSize) {
    return {
      allowed: true,
      adjustedSize: limits.maxPositionSize,
      reason: `Position size reduced to max limit (${(limits.maxPositionSize * 100).toFixed(0)}%)`,
    };
  }
  
  // Calculate current exposure
  const longExposure = positions
    .filter(p => p.direction === 'long')
    .reduce((sum, p) => sum + p.size, 0);
  const shortExposure = positions
    .filter(p => p.direction === 'short')
    .reduce((sum, p) => sum + p.size, 0);
  const totalExposure = longExposure + shortExposure;
  
  // Check total exposure limit
  const newTotalExposure = totalExposure + newPosition.size;
  if (newTotalExposure > limits.maxTotalExposure) {
    const allowedSize = Math.max(0, limits.maxTotalExposure - totalExposure);
    
    if (allowedSize === 0) {
      return {
        allowed: false,
        adjustedSize: 0,
        reason: `Total exposure limit reached (${(limits.maxTotalExposure * 100).toFixed(0)}%)`,
      };
    }
    
    return {
      allowed: true,
      adjustedSize: allowedSize,
      reason: `Position size reduced to stay within total exposure limit`,
    };
  }
  
  return {
    allowed: true,
    adjustedSize: newPosition.size,
    reason: 'Position within all limits',
  };
}

/**
 * Calculate portfolio diversification score
 */
export function calculateDiversificationScore(
  positions: Position[],
  correlationMatrix: { [ticker: string]: { [ticker: string]: number } }
): number {
  if (positions.length === 0) return 0;
  if (positions.length === 1) return 0;
  
  // Calculate weighted average correlation
  let totalCorrelation = 0;
  let pairCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const ticker1 = positions[i].ticker;
      const ticker2 = positions[j].ticker;
      const correlation = correlationMatrix[ticker1]?.[ticker2] || 0;
      const weight = (positions[i].size * positions[j].size);
      
      totalCorrelation += Math.abs(correlation) * weight;
      pairCount++;
    }
  }
  
  const avgCorrelation = pairCount > 0 ? totalCorrelation / pairCount : 0;
  
  // Diversification score: 1 = perfectly diversified, 0 = perfectly correlated
  const diversificationScore = 1 - avgCorrelation;
  
  return diversificationScore;
}

/**
 * PHASE 2: Calculate portfolio-wide correlation score
 */
export function calculatePortfolioCorrelation(
  positions: Position[],
  correlationMatrix: { [ticker: string]: { [ticker: string]: number } }
): number {
  if (positions.length <= 1) return 0;
  
  let totalCorrelation = 0;
  let pairCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const ticker1 = positions[i].ticker;
      const ticker2 = positions[j].ticker;
      const correlation = Math.abs(correlationMatrix[ticker1]?.[ticker2] || 0);
      
      totalCorrelation += correlation;
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalCorrelation / pairCount : 0;
}

/**
 * Calculate dynamic stop-loss level
 */
export function calculateDynamicStopLoss(
  entryPrice: number,
  direction: 'long' | 'short',
  config: StopLossConfig,
  atr?: number // Average True Range for volatility-based stops
): number {
  switch (config.type) {
    case 'fixed':
      // Fixed percentage stop
      if (direction === 'long') {
        return entryPrice * (1 - config.value);
      } else {
        return entryPrice * (1 + config.value);
      }
    
    case 'volatility':
      // ATR-based stop
      if (!atr) throw new Error('ATR required for volatility-based stop');
      const stopDistance = atr * config.value;
      if (direction === 'long') {
        return entryPrice - stopDistance;
      } else {
        return entryPrice + stopDistance;
      }
    
    case 'trailing':
      // Initial stop, will be updated as price moves
      if (direction === 'long') {
        return entryPrice * (1 - config.value);
      } else {
        return entryPrice * (1 + config.value);
      }
    
    case 'time':
      // Time-based stop (not price-based)
      return direction === 'long' ? 0 : Infinity;
    
    default:
      return direction === 'long' ? 0 : Infinity;
  }
}

/**
 * PHASE 2: Calculate dynamic trailing stop-loss based on volatility
 * Adjusts stop distance based on current market volatility
 */
export function calculateTrailingStopLoss(
  entryPrice: number,
  currentPrice: number,
  volatility: number
): number {
  // Stop distance: 8-12% based on volatility
  const stopDistance = Math.max(0.08, Math.min(0.12, volatility * 0.5));
  return currentPrice * (1 - stopDistance);
}

/**
 * Update trailing stop-loss
 */
export function updateTrailingStop(
  currentPrice: number,
  currentStop: number,
  direction: 'long' | 'short',
  trailingDistance: number
): number {
  if (direction === 'long') {
    // For long positions, only move stop up
    const newStop = currentPrice * (1 - trailingDistance);
    return Math.max(currentStop, newStop);
  } else {
    // For short positions, only move stop down
    const newStop = currentPrice * (1 + trailingDistance);
    return Math.min(currentStop, newStop);
  }
}

/**
 * Calculate take-profit level
 */
export function calculateTakeProfit(
  entryPrice: number,
  stopLoss: number,
  direction: 'long' | 'short',
  config: TakeProfitConfig
): number {
  switch (config.type) {
    case 'fixed':
      // Fixed percentage profit target
      if (direction === 'long') {
        return entryPrice * (1 + config.value);
      } else {
        return entryPrice * (1 - config.value);
      }
    
    case 'risk_reward':
      // Based on risk/reward ratio
      const riskRewardRatio = config.riskRewardRatio || 2.0;
      const riskAmount = Math.abs(entryPrice - stopLoss);
      const rewardAmount = riskAmount * riskRewardRatio;
      
      if (direction === 'long') {
        return entryPrice + rewardAmount;
      } else {
        return entryPrice - rewardAmount;
      }
    
    case 'trailing':
      // Trailing take-profit (will be updated)
      if (direction === 'long') {
        return entryPrice * (1 + config.value);
      } else {
        return entryPrice * (1 - config.value);
      }
    
    default:
      return direction === 'long' ? Infinity : 0;
  }
}

/**
 * PHASE 2: Time-based exit rule
 * Exit losing positions after 90 days
 */
export function shouldExitByTime(
  entryDate: Date,
  currentDate: Date,
  pnl: number
): boolean {
  const daysHeld = (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysHeld > 90 && pnl <= 0;
}

/**
 * PHASE 2: Correlation-based position reduction
 * Reduce position size when portfolio correlation is too high
 */
export function shouldReduceByCorrelation(
  portfolioCorrelation: number
): number {
  if (portfolioCorrelation > 0.8) return 0.75; // Reduce to 75%
  if (portfolioCorrelation > 0.7) return 0.85; // Reduce to 85%
  return 1.0; // No reduction
}

/**
 * Calculate portfolio Value at Risk (VaR)
 */
export function calculateVaR(
  positions: Position[],
  historicalReturns: number[],
  confidence: number = 0.95
): number {
  if (historicalReturns.length === 0) return 0;
  
  // Sort returns
  const sortedReturns = [...historicalReturns].sort((a, b) => a - b);
  
  // Find VaR at confidence level
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  const var95 = Math.abs(sortedReturns[index]);
  
  // Scale by current portfolio value
  const portfolioValue = positions.reduce((sum, p) => sum + Math.abs(p.pnl), 0);
  
  return var95 * portfolioValue;
}

/**
 * Calculate Expected Shortfall (CVaR)
 */
export function calculateExpectedShortfall(
  positions: Position[],
  historicalReturns: number[],
  confidence: number = 0.95
): number {
  if (historicalReturns.length === 0) return 0;
  
  // Sort returns
  const sortedReturns = [...historicalReturns].sort((a, b) => a - b);
  
  // Calculate average of returns below VaR threshold
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, index);
  const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  
  // Scale by current portfolio value
  const portfolioValue = positions.reduce((sum, p) => sum + Math.abs(p.pnl), 0);
  
  return Math.abs(avgTailReturn) * portfolioValue;
}

/**
 * Calculate comprehensive portfolio risk metrics
 * PHASE 2: Added correlationScore
 */
export function calculatePortfolioRiskMetrics(
  positions: Position[],
  peakEquity: number,
  currentEquity: number,
  historicalReturns: number[],
  correlationMatrix: { [ticker: string]: { [ticker: string]: number } }
): PortfolioRiskMetrics {
  const longExposure = positions
    .filter(p => p.direction === 'long')
    .reduce((sum, p) => sum + p.size, 0);
  const shortExposure = positions
    .filter(p => p.direction === 'short')
    .reduce((sum, p) => sum + p.size, 0);
  
  const totalExposure = longExposure + shortExposure;
  const netExposure = longExposure - shortExposure;
  const currentDrawdown = (peakEquity - currentEquity) / peakEquity;
  
  const var95 = calculateVaR(positions, historicalReturns);
  const expectedShortfall = calculateExpectedShortfall(positions, historicalReturns);
  const concentrationScore = 1 - calculateDiversificationScore(positions, correlationMatrix);
  const correlationScore = calculatePortfolioCorrelation(positions, correlationMatrix); // PHASE 2
  
  return {
    totalExposure,
    netExposure,
    currentDrawdown,
    peakEquity,
    currentEquity,
    var95,
    expectedShortfall,
    concentrationScore,
    correlationScore, // PHASE 2
  };
}

/**
 * Check if a position should be closed based on risk rules
 * PHASE 2: Added time-based exit check
 */
export function shouldClosePosition(
  position: Position,
  riskMetrics: PortfolioRiskMetrics,
  limits: RiskLimits = DEFAULT_RISK_LIMITS,
  currentDate: Date = new Date()
): { shouldClose: boolean; reason: string } {
  // Check stop-loss
  if (position.direction === 'long' && position.currentPrice <= position.stopLoss) {
    return {
      shouldClose: true,
      reason: `Stop-loss hit at ${position.stopLoss.toFixed(2)}`,
    };
  }
  if (position.direction === 'short' && position.currentPrice >= position.stopLoss) {
    return {
      shouldClose: true,
      reason: `Stop-loss hit at ${position.stopLoss.toFixed(2)}`,
    };
  }
  
  // Check take-profit
  if (position.direction === 'long' && position.currentPrice >= position.takeProfit) {
    return {
      shouldClose: true,
      reason: `Take-profit hit at ${position.takeProfit.toFixed(2)}`,
    };
  }
  if (position.direction === 'short' && position.currentPrice <= position.takeProfit) {
    return {
      shouldClose: true,
      reason: `Take-profit hit at ${position.takeProfit.toFixed(2)}`,
    };
  }
  
  // PHASE 2: Check time-based exit
  if (shouldExitByTime(position.entryDate, currentDate, position.pnl)) {
    return {
      shouldClose: true,
      reason: `Time-based exit: held >90 days with negative P&L`,
    };
  }
  
  // Check portfolio drawdown
  if (riskMetrics.currentDrawdown >= limits.maxDrawdown) {
    return {
      shouldClose: true,
      reason: `Portfolio drawdown limit exceeded (${(riskMetrics.currentDrawdown * 100).toFixed(1)}%)`,
    };
  }
  
  return {
    shouldClose: false,
    reason: 'All risk checks passed',
  };
}

/**
 * PHASE 2: Filter positions by correlation
 * Limits total correlated exposure to prevent concentration risk
 */
export function filterByCorrelation(
  newPosition: { ticker: string; size: number },
  existingPositions: Position[],
  correlationMatrix: { [ticker: string]: { [ticker: string]: number } },
  maxCorrelatedExposure: number = 0.40
): { allowed: boolean; adjustedSize: number; reason: string } {
  
  // Calculate total exposure to correlated positions
  let correlatedExposure = 0;
  
  for (const position of existingPositions) {
    const correlation = Math.abs(correlationMatrix[newPosition.ticker]?.[position.ticker] || 0);
    if (correlation > 0.7) {
      correlatedExposure += position.size;
    }
  }
  
  // Check if adding new position would exceed limit
  const newCorrelatedExposure = correlatedExposure + newPosition.size;
  
  if (newCorrelatedExposure > maxCorrelatedExposure) {
    const allowedSize = Math.max(0, maxCorrelatedExposure - correlatedExposure);
    
    if (allowedSize === 0) {
      return {
        allowed: false,
        adjustedSize: 0,
        reason: `Correlated exposure limit reached (${(maxCorrelatedExposure * 100).toFixed(0)}%)`,
      };
    }
    
    return {
      allowed: true,
      adjustedSize: allowedSize,
      reason: `Position size reduced due to correlation (current correlated exposure: ${(correlatedExposure * 100).toFixed(0)}%)`,
    };
  }
  
  return {
    allowed: true,
    adjustedSize: newPosition.size,
    reason: 'Correlation check passed',
  };
}