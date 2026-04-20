import React from 'react';
import { useGlobalState, Mode } from '@/store/globalState';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Building2, 
  TrendingUp, 
  Zap, 
  LineChart 
} from 'lucide-react';

/**
 * ModeNavigation Component
 * Persistent top bar navigation with 5 mode toggles
 * Implements the global UI framework from specification Part 1.2
 */

const modes: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
  { id: 'Country', label: 'Country', icon: <Globe className="w-4 h-4" /> },
  { id: 'Company', label: 'Company', icon: <Building2 className="w-4 h-4" /> },
  { id: 'Forecast', label: 'Forecast', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'Scenario', label: 'Scenario', icon: <Zap className="w-4 h-4" /> },
  { id: 'Trading', label: 'Trading', icon: <LineChart className="w-4 h-4" /> },
];

export const ModeNavigation: React.FC = () => {
  const { active_mode, setActiveMode } = useGlobalState();

  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
      {modes.map((mode) => (
        <Button
          key={mode.id}
          variant={active_mode === mode.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveMode(mode.id)}
          className="flex items-center gap-2"
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </Button>
      ))}
    </div>
  );
};