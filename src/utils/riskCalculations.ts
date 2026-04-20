/**
 * Risk Calculation Utilities
 * Supporting functions for Company Mode components
 * Part of CO-GRI Platform Phase 2 - Week 2
 */

import { RiskLevel, TrendDirection } from '@/types/company';

/**
 * Get risk level from score
 * Implements specification Part 1.5 - Risk Level Thresholds
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return RiskLevel.LOW;
  if (score < 50) return RiskLevel.MODERATE;
  if (score < 70) return RiskLevel.ELEVATED;
  return RiskLevel.HIGH;
}

/**
 * Get trend direction from delta
 * Implements specification Part 1.5 - Direction/Trend Classification
 */
export function getTrendDirection(current: number, previous: number): TrendDirection {
  const delta = current - previous;
  if (delta > 2) return TrendDirection.INCREASING;
  if (delta < -2) return TrendDirection.DECREASING;
  return TrendDirection.STABLE;
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for concentration
 * Implements specification Part 3.3 C1 - Concentration Calculation
 * 
 * @param riskShares - Array of risk contribution shares (as decimals, not percentages)
 * @returns Object with HHI value and concentration label
 */
export function calculateConcentration(riskShares: number[]): { 
  HHI: number; 
  label: 'Concentrated' | 'Diversified' 
} {
  const HHI = riskShares.reduce((sum, share) => sum + share * share, 0);
  const label = HHI >= 0.25 ? 'Concentrated' : 'Diversified';
  return { HHI, label };
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW:
      return 'bg-green-100 text-green-700 border-green-300';
    case RiskLevel.MODERATE:
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case RiskLevel.ELEVATED:
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case RiskLevel.HIGH:
      return 'bg-red-100 text-red-700 border-red-300';
  }
}

/**
 * Get trend direction icon and color
 */
export function getTrendStyle(direction: TrendDirection): {
  color: string;
  icon: 'up' | 'down' | 'stable';
} {
  switch (direction) {
    case TrendDirection.INCREASING:
      return { color: 'text-red-600', icon: 'up' };
    case TrendDirection.DECREASING:
      return { color: 'text-green-600', icon: 'down' };
    case TrendDirection.STABLE:
      return { color: 'text-gray-600', icon: 'stable' };
  }
}

/**
 * Format number as percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format delta with sign
 */
export function formatDelta(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Get contribution label based on share
 * Implements specification Part 3.3 C3 - Risk Contribution
 */
export function getContributionLabel(share: number): string {
  if (share >= 0.20) return 'Primary';      // >= 20%
  if (share >= 0.10) return 'Significant';  // >= 10%
  if (share >= 0.05) return 'Moderate';     // >= 5%
  return 'Minor';                           // < 5%
}

/**
 * Calculate volatility from time series data
 */
export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}