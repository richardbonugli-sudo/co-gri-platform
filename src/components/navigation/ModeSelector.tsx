/**
 * Mode Selector Component
 * Five-mode navigation for the unified platform
 * Part of CO-GRI Platform Phase 3 - Week 6
 */

import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Building2, 
  TrendingUp, 
  Zap, 
  DollarSign 
} from 'lucide-react';
import { useGlobalState, Mode, getModeRoute } from '@/store/globalState';
import { cn } from '@/lib/utils';

const MODE_CONFIG: Record<Mode, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  available: boolean;
}> = {
  'Country': {
    icon: Globe,
    label: 'Country',
    color: 'text-blue-600',
    available: false
  },
  'Company': {
    icon: Building2,
    label: 'Company',
    color: 'text-green-600',
    available: true
  },
  'Forecast': {
    icon: TrendingUp,
    label: 'Forecast',
    color: 'text-purple-600',
    available: false
  },
  'Scenario': {
    icon: Zap,
    label: 'Scenario',
    color: 'text-orange-600',
    available: false
  },
  'Trading': {
    icon: DollarSign,
    label: 'Trading',
    color: 'text-indigo-600',
    available: false
  }
};

export function ModeSelector() {
  const [, setLocation] = useLocation();
  const activeMode = useGlobalState((state) => state.active_mode);
  const setActiveMode = useGlobalState((state) => state.setActiveMode);

  const handleModeChange = (mode: Mode) => {
    setActiveMode(mode);
    setLocation(getModeRoute(mode));
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([mode, config]) => {
        const Icon = config.icon;
        const isActive = activeMode === mode;
        const isAvailable = config.available;

        return (
          <Button
            key={mode}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange(mode)}
            disabled={!isAvailable && !isActive}
            className={cn(
              'gap-2 relative',
              isActive && 'shadow-sm',
              !isAvailable && !isActive && 'opacity-50'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive && config.color)} />
            <span>{config.label}</span>
            {!isAvailable && !isActive && (
              <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                Soon
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}