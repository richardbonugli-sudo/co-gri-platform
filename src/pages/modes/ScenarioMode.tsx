/**
 * Scenario Mode Page
 * Custom geopolitical shock scenarios with transmission trace
 * Part of CO-GRI Platform Phase 3 - Weeks 9-10
 * Phase 1 Critical Fix: Global navigation always visible
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, BarChart3, Network, AlertCircle, Loader2 } from 'lucide-react';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';

// Import Scenario Components
import { ScenarioBuilderHeader } from '@/components/scenario/ScenarioBuilderHeader';
import { InitialShockConfig } from '@/components/scenario/InitialShockConfig';
import { PropagationSettings } from '@/components/scenario/PropagationSettings';

// Import Types and Services
import { 
  Scenario, 
  ScenarioType, 
  InitialShock, 
  PropagationSettings as PropagationSettingsType,
  ScenarioResult,
  ScenarioExecutionStatus
} from '@/types/scenario';
import { 
  generatePresetScenarios, 
  presetToScenario, 
  generateMockScenarioResult 
} from '@/services/mockData/scenarioDataGenerator';

// Default initial shock
const DEFAULT_INITIAL_SHOCK: InitialShock = {
  affected_countries: [],
  shock_intensity: 50,
  channel_distribution: {
    revenue: 25,
    supply_chain: 50,
    physical_assets: 15,
    financial: 10
  },
  duration_months: 6,
  description: ''
};

// Default propagation settings
const DEFAULT_PROPAGATION_SETTINGS: PropagationSettingsType = {
  propagation_depth: 3,
  amplification_factor: 1.0,
  sector_filters: [],
  company_filters: {},
  transmission_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
  advanced_options: {
    enable_second_order_effects: true,
    enable_feedback_loops: false,
    time_decay_enabled: false
  }
};

export default function ScenarioMode() {
  const [activeTab, setActiveTab] = useState('builder');
  
  // Global Dashboard State
  const {
    setActiveMode,
  } = useGlobalDashboardStore();

  // Set active mode to Scenario on mount
  useEffect(() => {
    setActiveMode('Scenario');
  }, [setActiveMode]);
  
  // Scenario State
  const [scenarioName, setScenarioName] = useState('Custom Scenario');
  const [scenarioType, setScenarioType] = useState<ScenarioType>('Custom');
  const [initialShock, setInitialShock] = useState<InitialShock>(DEFAULT_INITIAL_SHOCK);
  const [propagationSettings, setPropagationSettings] = useState<PropagationSettingsType>(DEFAULT_PROPAGATION_SETTINGS);
  
  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ScenarioExecutionStatus | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Preset scenarios
  const presetScenarios = useMemo(() => generatePresetScenarios(), []);

  // Validate scenario
  const validateScenario = (): boolean => {
    const errors: string[] = [];

    if (!scenarioName.trim()) {
      errors.push('Scenario name is required');
    }

    if (initialShock.affected_countries.length === 0) {
      errors.push('At least one country must be selected');
    }

    if (initialShock.affected_countries.length > 10) {
      errors.push('Maximum 10 countries can be selected');
    }

    const channelSum = 
      initialShock.channel_distribution.revenue +
      initialShock.channel_distribution.supply_chain +
      initialShock.channel_distribution.physical_assets +
      initialShock.channel_distribution.financial;

    if (Math.abs(channelSum - 100) > 0.1) {
      errors.push('Channel distribution must sum to 100%');
    }

    if (propagationSettings.transmission_channels.length === 0) {
      errors.push('At least one transmission channel must be selected');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check if scenario can run
  const canRun = useMemo(() => {
    return (
      scenarioName.trim() !== '' &&
      initialShock.affected_countries.length > 0 &&
      initialShock.affected_countries.length <= 10 &&
      Math.abs(
        initialShock.channel_distribution.revenue +
        initialShock.channel_distribution.supply_chain +
        initialShock.channel_distribution.physical_assets +
        initialShock.channel_distribution.financial - 100
      ) < 0.1 &&
      propagationSettings.transmission_channels.length > 0
    );
  }, [scenarioName, initialShock, propagationSettings]);

  // Run scenario
  const handleRunScenario = async () => {
    if (!validateScenario()) {
      return;
    }

    setIsRunning(true);
    setValidationErrors([]);

    // Create scenario object
    const scenario: Scenario = {
      scenario_id: `CUSTOM_${Date.now()}`,
      scenario_name: scenarioName,
      scenario_type: scenarioType,
      description: initialShock.description,
      initial_shock: initialShock,
      propagation_settings: propagationSettings,
      created_at: new Date(),
      last_modified: new Date(),
      is_preset: false
    };

    try {
      // Simulate execution steps
      const steps = [
        { step: 'Validating' as const, progress: 10, delay: 300 },
        { step: 'Applying Initial Shock' as const, progress: 25, delay: 500 },
        { step: 'Propagating Layer 1' as const, progress: 40, delay: 600 },
        { step: 'Propagating Layer 2' as const, progress: 55, delay: 600 },
        { step: 'Propagating Layer 3' as const, progress: 70, delay: 600 },
        { step: 'Calculating Company Impacts' as const, progress: 85, delay: 500 },
        { step: 'Generating Results' as const, progress: 95, delay: 400 }
      ];

      for (const { step, progress, delay } of steps) {
        setExecutionStatus({
          current_step: step,
          progress_percentage: progress,
          estimated_time_remaining_seconds: Math.ceil((100 - progress) / 10)
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Generate mock result
      const result = generateMockScenarioResult(scenario);
      setScenarioResult(result);

      setExecutionStatus({
        current_step: 'Complete',
        progress_percentage: 100
      });

      // Switch to results tab
      setTimeout(() => {
        setActiveTab('results');
        setIsRunning(false);
        setExecutionStatus(null);
      }, 500);

    } catch (error) {
      console.error('Scenario execution error:', error);
      setExecutionStatus({
        current_step: 'Error',
        progress_percentage: 0,
        error_message: 'Failed to execute scenario'
      });
      setIsRunning(false);
    }
  };

  // Save scenario
  const handleSaveScenario = () => {
    console.log('Save scenario:', { scenarioName, scenarioType, initialShock, propagationSettings });
    // TODO: Implement save to localStorage or backend
  };

  // Load scenario
  const handleLoadScenario = () => {
    console.log('Load scenario');
    // TODO: Implement load from localStorage or backend
    // For now, load first preset
    if (presetScenarios.length > 0) {
      const preset = presetScenarios[0];
      setScenarioName(preset.name);
      setScenarioType(preset.type);
      setInitialShock(preset.initial_shock);
      setPropagationSettings(preset.propagation_settings);
    }
  };

  // Reset scenario
  const handleResetScenario = () => {
    setScenarioName('Custom Scenario');
    setScenarioType('Custom');
    setInitialShock(DEFAULT_INITIAL_SHOCK);
    setPropagationSettings(DEFAULT_PROPAGATION_SETTINGS);
    setValidationErrors([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation Bar - Always Visible */}
      <GlobalNavigationBar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Secondary Navigation: Three-Tab Structure */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="builder" className="gap-2">
              <Wrench className="h-4 w-4" />
              Scenario Builder
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!scenarioResult}>
              <BarChart3 className="h-4 w-4" />
              Scenario Results
            </TabsTrigger>
            <TabsTrigger value="transmission" className="gap-2" disabled={!scenarioResult}>
              <Network className="h-4 w-4" />
              Transmission Trace
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Scenario Builder */}
          <TabsContent value="builder" className="space-y-6 mt-6">
            {/* Header */}
            <ScenarioBuilderHeader
              scenarioName={scenarioName}
              scenarioType={scenarioType}
              onScenarioNameChange={setScenarioName}
              onScenarioTypeChange={setScenarioType}
              onSave={handleSaveScenario}
              onLoad={handleLoadScenario}
              onReset={handleResetScenario}
              onRun={handleRunScenario}
              canRun={canRun}
              isRunning={isRunning}
            />

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Execution Progress */}
            {isRunning && executionStatus && (
              <div className="border rounded-lg p-6 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <p className="font-medium">Running Scenario</p>
                      <p className="text-sm text-muted-foreground">{executionStatus.current_step}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{executionStatus.progress_percentage}%</p>
                    {executionStatus.estimated_time_remaining_seconds && (
                      <p className="text-xs text-muted-foreground">
                        ~{executionStatus.estimated_time_remaining_seconds}s remaining
                      </p>
                    )}
                  </div>
                </div>
                <Progress value={executionStatus.progress_percentage} className="h-2" />
              </div>
            )}

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Initial Shock Configuration */}
              <InitialShockConfig
                shock={initialShock}
                onShockChange={setInitialShock}
              />

              {/* Right: Propagation Settings */}
              <PropagationSettings
                settings={propagationSettings}
                onSettingsChange={setPropagationSettings}
              />
            </div>

            {/* Preset Scenarios */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Preset Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presetScenarios.map(preset => (
                  <div
                    key={preset.scenario_id}
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => {
                      setScenarioName(preset.name);
                      setScenarioType(preset.type);
                      setInitialShock(preset.initial_shock);
                      setPropagationSettings(preset.propagation_settings);
                    }}
                  >
                    <h4 className="font-medium mb-2">{preset.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {preset.initial_shock.affected_countries.length} countries
                      </span>
                      <Button size="sm" variant="outline">
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Scenario Results */}
          <TabsContent value="results" className="space-y-6 mt-6">
            {scenarioResult ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Scenario Results</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Results visualization components coming in Week 10
                </p>
                <div className="text-left max-w-2xl mx-auto space-y-2">
                  <p className="text-sm">
                    <strong>Global Impact:</strong> {scenarioResult.company_impacts.length} companies affected
                  </p>
                  <p className="text-sm">
                    <strong>Average ΔCO-GRI:</strong> {scenarioResult.global_impact.average_delta_CO_GRI.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Execution Time:</strong> {scenarioResult.execution_time_ms}ms
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Run a scenario to see results
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Transmission Trace */}
          <TabsContent value="transmission" className="space-y-6 mt-6">
            {scenarioResult ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Network className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Transmission Trace</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Interactive network visualization coming in Week 10
                </p>
                <div className="text-left max-w-2xl mx-auto space-y-2">
                  <p className="text-sm">
                    <strong>Total Nodes:</strong> {scenarioResult.transmission_graph.total_nodes}
                  </p>
                  <p className="text-sm">
                    <strong>Total Edges:</strong> {scenarioResult.transmission_graph.total_edges}
                  </p>
                  <p className="text-sm">
                    <strong>Max Layer:</strong> {scenarioResult.transmission_graph.max_layer}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Network className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Transmission Data</h3>
                <p className="text-sm text-muted-foreground">
                  Run a scenario to see transmission trace
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}