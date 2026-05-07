import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * RiskLevelBadge Component
 * Displays risk level with consistent color coding
 * Implements specification Part 1.5 - Risk Level Thresholds
 */

export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  ELEVATED = 'Elevated',
  HIGH = 'High',
}

interface RiskLevelBadgeProps {
  score: number;
  className?: string;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return RiskLevel.LOW;
  if (score < 50) return RiskLevel.MODERATE;
  if (score < 70) return RiskLevel.ELEVATED;
  return RiskLevel.HIGH;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  [RiskLevel.LOW]: { bg: 'bg-green-100', text: 'text-green-700' },
  [RiskLevel.MODERATE]: { bg: 'bg-amber-100', text: 'text-amber-700' },
  [RiskLevel.ELEVATED]: { bg: 'bg-orange-100', text: 'text-orange-700' },
  [RiskLevel.HIGH]: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ score, className = '' }) => {
  const riskLevel = getRiskLevel(score);
  const colors = RISK_COLORS[riskLevel];

  return (
    <Badge 
      variant="secondary" 
      className={`${colors.bg} ${colors.text} ${className}`}
    >
      {riskLevel}
    </Badge>
  );
};