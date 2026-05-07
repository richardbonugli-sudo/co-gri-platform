/**
 * Risk Level Thresholds and Classification
 * Consistent across CO-GRI Platform
 */

import { RiskLevel, TrendDirection } from '@/types/company';

export function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return RiskLevel.LOW;
  if (score < 50) return RiskLevel.MODERATE;
  if (score < 70) return RiskLevel.ELEVATED;
  return RiskLevel.HIGH;
}

export function getTrendDirection(current: number, previous: number): TrendDirection {
  const delta = current - previous;
  if (delta > 2) return TrendDirection.INCREASING;
  if (delta < -2) return TrendDirection.DECREASING;
  return TrendDirection.STABLE;
}

export function calculateConcentration(riskShares: number[]): { HHI: number; label: string } {
  const HHI = riskShares.reduce((sum, share) => sum + share * share, 0);
  const label = HHI >= 0.25 ? 'Concentrated' : 'Diversified';
  return { HHI, label };
}

export const RISK_COLORS = {
  LOW: '#10B981',        // Green
  MODERATE: '#F59E0B',   // Amber
  ELEVATED: '#F97316',   // Orange
  HIGH: '#EF4444'        // Red
} as const;

export const LENS_COLORS = {
  STRUCTURAL: '#3B82F6',      // Blue
  FORECAST_OVERLAY: '#8B5CF6', // Purple
  SCENARIO_SHOCK: '#F97316',   // Orange
  TRADING_SIGNAL: '#10B981'    // Green
} as const;
