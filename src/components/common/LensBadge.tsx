import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CompanyLens } from '@/store/globalState';
import { Activity, TrendingUp, Zap, LineChart } from 'lucide-react';

/**
 * LensBadge Component
 * Displays the active analytical lens across all Company Mode components
 * CRITICAL: Every panel MUST display its active lens (Specification Part 3.1)
 */

interface LensBadgeProps {
  lens: CompanyLens;
  className?: string;
}

const LENS_CONFIG: Record<CompanyLens, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  'Structural': {
    label: 'Current State',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
    icon: <Activity className="w-3 h-3" />,
  },
  'Forecast Overlay': {
    label: 'Probability-Weighted Expected Path',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 hover:bg-purple-200',
    icon: <TrendingUp className="w-3 h-3" />,
  },
  'Scenario Shock': {
    label: 'Conditional Stress Test',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 hover:bg-orange-200',
    icon: <Zap className="w-3 h-3" />,
  },
  'Trading Signal': {
    label: 'Implementation Output',
    color: 'text-green-700',
    bgColor: 'bg-green-100 hover:bg-green-200',
    icon: <LineChart className="w-3 h-3" />,
  },
};

export const LensBadge: React.FC<LensBadgeProps> = ({ lens, className = '' }) => {
  const config = LENS_CONFIG[lens];

  return (
    <Badge 
      variant="secondary" 
      className={`${config.bgColor} ${config.color} flex items-center gap-1 ${className}`}
    >
      {config.icon}
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
};