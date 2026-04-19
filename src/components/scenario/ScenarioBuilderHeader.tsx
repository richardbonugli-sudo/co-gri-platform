/**
 * Scenario Builder Header (S1)
 * Scenario name, type selection, and action buttons
 * Part of CO-GRI Platform Phase 3 - Week 9
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Upload, RotateCcw, Play } from 'lucide-react';
import { ScenarioType } from '@/types/scenario';

interface ScenarioBuilderHeaderProps {
  scenarioName: string;
  scenarioType: ScenarioType;
  onScenarioNameChange: (name: string) => void;
  onScenarioTypeChange: (type: ScenarioType) => void;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
  onRun: () => void;
  canRun: boolean;
  isRunning: boolean;
}

export const ScenarioBuilderHeader: React.FC<ScenarioBuilderHeaderProps> = ({
  scenarioName,
  scenarioType,
  onScenarioNameChange,
  onScenarioTypeChange,
  onSave,
  onLoad,
  onReset,
  onRun,
  canRun,
  isRunning
}) => {
  const scenarioTypeColors: Record<ScenarioType, string> = {
    'Geopolitical': 'bg-red-100 text-red-800',
    'Economic': 'bg-blue-100 text-blue-800',
    'Climate': 'bg-green-100 text-green-800',
    'Pandemic': 'bg-purple-100 text-purple-800',
    'Custom': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between gap-6">
        {/* Left: Scenario Info */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Scenario Name</label>
            <Input
              value={scenarioName}
              onChange={(e) => onScenarioNameChange(e.target.value)}
              placeholder="Enter scenario name..."
              className="max-w-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Scenario Type</label>
            <div className="flex items-center gap-3">
              <Select value={scenarioType} onValueChange={(v) => onScenarioTypeChange(v as ScenarioType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geopolitical">Geopolitical</SelectItem>
                  <SelectItem value="Economic">Economic</SelectItem>
                  <SelectItem value="Climate">Climate</SelectItem>
                  <SelectItem value="Pandemic">Pandemic</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={scenarioTypeColors[scenarioType]}>
                {scenarioType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onRun}
            disabled={!canRun || isRunning}
            className="gap-2"
            size="lg"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run Scenario'}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLoad}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};