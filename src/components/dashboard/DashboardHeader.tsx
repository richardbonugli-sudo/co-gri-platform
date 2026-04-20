/**
 * Dashboard Header Component
 * Global top bar with navigation, mode selector, and actions
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/store/globalState';
import { Mode, TimeWindow } from '@/types/global';

export const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { active_mode, time_window, setMode, setTimeWindow } = useGlobalState();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleModeChange = (mode: Mode) => {
    setMode(mode);
    navigate(`/dashboard/${mode.toLowerCase()}`);
  };

  const handleTimeWindowChange = (window: TimeWindow) => {
    setTimeWindow(window);
  };

  const getCurrentMode = () => {
    const path = location.pathname.split('/').pop();
    return path?.charAt(0).toUpperCase() + path?.slice(1) || 'Dashboard';
  };

  const modes: Mode[] = ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'];
  const timeWindows: TimeWindow[] = ['7D', '30D', '90D', '12M'];

  return (
    <header className="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs flex items-center gap-2 text-sm mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600">Dashboard</span>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-900">
            {getCurrentMode()} Mode
          </span>
        </nav>

        {/* Main Header */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">CO-GRI Platform</h1>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 mr-2">Mode:</span>
            {modes.map((mode) => (
              <Button
                key={mode}
                variant={active_mode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>

          {/* Time Window & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Window:</span>
              {timeWindows.map((window) => (
                <Button
                  key={window}
                  variant={time_window === window ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTimeWindowChange(window)}
                >
                  {window}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
