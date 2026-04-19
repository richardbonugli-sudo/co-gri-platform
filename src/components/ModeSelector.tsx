/**
 * Mode Selector Component
 * 
 * Allows users to switch between "Event-Driven Scenario" analysis (existing)
 * and "Strategic Forecast Baseline" analysis (CedarOwl integration).
 * 
 * @module ModeSelector
 */

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';

export type AnalysisMode = 'event-driven' | 'forecast-baseline';

export interface ModeSelectorProps {
  /** Currently selected analysis mode */
  selectedMode: AnalysisMode;
  /** Callback fired when mode changes */
  onModeChange: (mode: AnalysisMode) => void;
  /** Optional CSS class name */
  className?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Mode Selector Component
 * 
 * Provides a radio button interface for selecting between two analysis modes:
 * 1. Event-Driven Scenario (existing functionality)
 * 2. Strategic Forecast Baseline (CedarOwl forecast integration)
 * 
 * @example
 * ```tsx
 * <ModeSelector
 *   selectedMode={mode}
 *   onModeChange={(newMode) => setMode(newMode)}
 * />
 * ```
 */
export function ModeSelector({
  selectedMode,
  onModeChange,
  className = '',
  disabled = false
}: ModeSelectorProps) {
  const handleValueChange = (value: string) => {
    onModeChange(value as AnalysisMode);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Analysis Mode</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of risk analysis to perform
        </p>
      </div>

      <RadioGroup
        value={selectedMode}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="space-y-4"
      >
        {/* Event-Driven Scenario Mode */}
        <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
          <RadioGroupItem
            value="event-driven"
            id="mode-event-driven"
            className="mt-1"
            aria-label="Event-Driven Scenario mode"
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="mode-event-driven"
              className="text-base font-medium cursor-pointer"
            >
              Event-Driven Scenario
            </Label>
            <p className="text-sm text-muted-foreground">
              Analyze specific geopolitical events and their potential impact on your portfolio.
              Create custom scenarios to stress-test your exposures.
            </p>
            <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Use this mode to model hypothetical events (e.g., "What if there's a conflict in Region X?")
              </span>
            </div>
          </div>
        </div>

        {/* Strategic Forecast Baseline Mode */}
        <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
          <RadioGroupItem
            value="forecast-baseline"
            id="mode-forecast-baseline"
            className="mt-1"
            aria-label="Strategic Forecast Baseline mode"
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="mode-forecast-baseline"
              className="text-base font-medium cursor-pointer"
            >
              Strategic Forecast Baseline
            </Label>
            <p className="text-sm text-muted-foreground">
              Apply expert-consensus geopolitical forecasts to adjust your risk baseline.
              Incorporates CedarOwl's integrated analysis from 15 leading experts.
            </p>
            <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Use this mode for strategic planning based on expected geopolitical developments in 2026
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                195 Countries
              </span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                6 Major Events
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                85% Confidence
              </span>
            </div>
          </div>
        </div>
      </RadioGroup>

      {/* Mode-specific information */}
      {selectedMode === 'forecast-baseline' && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">
                Forecast Baseline Active
              </p>
              <p className="text-blue-700">
                Your CO-GRI scores will be adjusted based on CedarOwl's 2026 geopolitical forecast.
                This represents the expected path, not a stress scenario.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}