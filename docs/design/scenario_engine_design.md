# Scenario Engine System Design

## 1. Overview

The Scenario Engine enables users to create custom "what-if" scenarios and stress tests for geopolitical risk analysis. It builds upon the existing ForecastEngine to provide interactive scenario modeling, multi-stage conditional logic, and comparative analysis capabilities.

### Design Principles
- **Preserve Exposure Integrity**: Never redistribute exposure weights (W_R, W_S, W_P, W_F)
- **Additive Impact Model**: Apply scenario deltas to existing shock intensities only
- **Conditional Logic Support**: Enable multi-stage scenarios with triggers and dependencies
- **Extensibility**: Design for future scenario types and calculation methods
- **Performance**: Optimize for real-time scenario calculations and comparisons

---

## 2. Data Structures

### 2.1 Scenario Definition Schema

```typescript
interface Scenario {
  scenario_id: string;                    // UUID v4
  name: string;                           // User-defined name (max 100 chars)
  description: string;                    // Detailed description (max 500 chars)
  created_date: string;                   // ISO 8601 format
  created_by?: string;                    // User ID (optional)
  scenario_type: ScenarioType;            // 'single' | 'multi-stage' | 'comparative'
  status: ScenarioStatus;                 // 'draft' | 'active' | 'archived'
  parameters: ScenarioParameters;         // Core scenario configuration
  tags?: string[];                        // Optional categorization tags
  metadata?: Record<string, any>;         // Extensible metadata
}

type ScenarioType = 'single' | 'multi-stage' | 'comparative';
type ScenarioStatus = 'draft' | 'active' | 'archived';
```

### 2.2 Scenario Parameters

```typescript
interface ScenarioParameters {
  stress_tests: StressTest[];             // Array of stress test definitions
  conditional_logic?: ConditionalLogic;   // Optional multi-stage logic
  time_horizon: TimeHorizon;              // Temporal scope
  confidence_level?: number;              // 0-1, default 0.5
}

interface StressTest {
  stress_test_id: string;                 // UUID v4
  event_type: EventType;                  // Type of geopolitical event
  severity: Severity;                     // Impact magnitude
  probability: number;                    // 0-1 range
  duration: Duration;                     // Temporal extent
  affected_countries: string[];           // ISO 3166-1 alpha-3 codes
  affected_channels: Channel[];           // Risk transmission channels
  custom_parameters?: CustomParameters;   // Extensible parameters
}

type EventType = 
  | 'Trade War'
  | 'Military Conflict'
  | 'Sanctions'
  | 'Supply Chain Disruption'
  | 'Policy Change'
  | 'Economic Crisis'
  | 'Natural Disaster'
  | 'Cyber Attack'
  | 'Custom';

type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

interface Duration {
  duration_type: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  months: number;                         // Numeric representation (1-60)
}

type Channel = 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';

interface TimeHorizon {
  start_date: string;                     // ISO 8601
  end_date: string;                       // ISO 8601
  quarters: number;                       // Number of quarters covered
}

interface CustomParameters {
  intensity_multiplier?: number;          // 0.1-5.0, default 1.0
  geographic_spread?: number;             // 0-1, regional contagion factor
  channel_weights?: Partial<Record<Channel, number>>; // Override default weights
  [key: string]: any;                     // Extensible
}
```

### 2.3 Conditional Logic System

```typescript
interface ConditionalLogic {
  stages: ScenarioStage[];                // Ordered array of stages
  triggers: Trigger[];                    // Condition-based activations
  dependencies: Dependency[];             // Inter-stage dependencies
}

interface ScenarioStage {
  stage_id: string;                       // UUID v4
  stage_number: number;                   // Sequential order (1-based)
  name: string;                           // Stage name
  stress_tests: StressTest[];             // Tests for this stage
  activation_condition?: string;          // Condition expression (optional)
  delay_months?: number;                  // Delay after trigger (0-24)
}

interface Trigger {
  trigger_id: string;                     // UUID v4
  condition: TriggerCondition;            // Activation condition
  target_stage_id: string;                // Stage to activate
  priority: number;                       // Execution priority (1-10)
}

interface TriggerCondition {
  condition_type: 'threshold' | 'event' | 'time' | 'composite';
  expression: string;                     // Condition logic
  parameters: Record<string, any>;        // Condition parameters
}

// Example expressions:
// - Threshold: "delta_CO_GRI > 5.0"
// - Event: "stage_1_complete AND probability > 0.6"
// - Time: "months_elapsed >= 6"
// - Composite: "(delta_CO_GRI > 5.0 OR revenue_impact > 0.3) AND months_elapsed >= 3"

interface Dependency {
  dependency_id: string;                  // UUID v4
  source_stage_id: string;                // Prerequisite stage
  target_stage_id: string;                // Dependent stage
  dependency_type: 'sequential' | 'conditional' | 'parallel';
  condition?: string;                     // Optional condition expression
}
```

### 2.4 Impact Calculation Results

```typescript
interface ScenarioImpactResult {
  scenario_id: string;                    // Reference to scenario
  company_ticker: string;                 // Company identifier
  calculation_timestamp: string;          // ISO 8601
  baseline_CO_GRI: number;                // Original CO-GRI score
  scenario_CO_GRI: number;                // Post-scenario CO-GRI score
  delta_CO_GRI: number;                   // Net change
  confidence: number;                     // 0-1 confidence level
  channel_impacts: ChannelImpact[];       // Channel-level breakdown
  country_impacts: CountryImpact[];       // Country-level breakdown
  stage_impacts?: StageImpact[];          // Multi-stage breakdown (optional)
  risk_attribution: RiskAttribution;      // Detailed attribution
  warnings?: string[];                    // Validation warnings
}

interface ChannelImpact {
  channel: Channel;                       // Risk channel
  baseline_score: number;                 // Original channel score
  scenario_score: number;                 // Post-scenario score
  delta: number;                          // Net change
  contribution_to_total: number;          // % of total delta
  affected_countries: string[];           // Countries impacted via this channel
}

interface CountryImpact {
  country_code: string;                   // ISO 3166-1 alpha-3
  country_name: string;                   // Full country name
  baseline_exposure: number;              // Original exposure level
  scenario_exposure: number;              // Post-scenario exposure
  delta_exposure: number;                 // Net change
  affected_channels: Channel[];           // Channels impacted
  shock_intensity_delta: number;          // Change in shock intensity
  contribution_to_total: number;          // % of total delta
}

interface StageImpact {
  stage_id: string;                       // Stage identifier
  stage_number: number;                   // Sequential order
  stage_name: string;                     // Stage name
  delta_CO_GRI: number;                   // Incremental change from this stage
  cumulative_delta_CO_GRI: number;        // Cumulative change up to this stage
  activated: boolean;                     // Whether stage was triggered
  activation_date?: string;               // ISO 8601 (if activated)
}

interface RiskAttribution {
  top_contributing_countries: Array<{
    country_code: string;
    contribution_percent: number;
    delta_CO_GRI: number;
  }>;
  top_contributing_channels: Array<{
    channel: Channel;
    contribution_percent: number;
    delta_CO_GRI: number;
  }>;
  top_stress_tests: Array<{
    stress_test_id: string;
    event_type: EventType;
    contribution_percent: number;
    delta_CO_GRI: number;
  }>;
}
```

---

## 3. Core Components

### 3.1 ScenarioEngine Class

```typescript
class ScenarioEngineService {
  // Scenario Management
  createScenario(params: CreateScenarioParams): Scenario;
  updateScenario(scenario_id: string, updates: Partial<Scenario>): Scenario;
  deleteScenario(scenario_id: string): boolean;
  getScenario(scenario_id: string): Scenario | null;
  listScenarios(filters?: ScenarioFilters): Scenario[];
  
  // Scenario Execution
  applyScenario(company: Company, scenario: Scenario): ScenarioImpactResult;
  applyMultipleScenarios(company: Company, scenarios: Scenario[]): ScenarioComparisonResult;
  
  // Impact Calculation
  calculateImpact(company: Company, stressTests: StressTest[]): ScenarioImpactResult;
  calculateChannelImpact(company: Company, stressTest: StressTest, channel: Channel): ChannelImpact;
  calculateCountryImpact(company: Company, stressTest: StressTest, countryCode: string): CountryImpact;
  
  // Conditional Logic
  evaluateConditionalLogic(scenario: Scenario, currentState: ScenarioState): ScenarioStage[];
  evaluateTrigger(trigger: Trigger, state: ScenarioState): boolean;
  
  // Validation & Guardrails
  validateScenario(scenario: Scenario): ValidationResult;
  enforceGuardrails(company: Company, stressTest: StressTest): GuardrailResult;
  
  // Comparison & Analysis
  compareScenarios(results: ScenarioImpactResult[]): ScenarioComparisonResult;
  generateSensitivityAnalysis(company: Company, scenario: Scenario): SensitivityAnalysisResult;
}

interface CreateScenarioParams {
  name: string;
  description: string;
  scenario_type: ScenarioType;
  parameters: ScenarioParameters;
  tags?: string[];
}

interface ScenarioFilters {
  scenario_type?: ScenarioType;
  status?: ScenarioStatus;
  tags?: string[];
  created_after?: string;
  created_before?: string;
}

interface ScenarioState {
  current_stage: number;
  completed_stages: string[];
  active_stages: string[];
  elapsed_months: number;
  cumulative_delta_CO_GRI: number;
  trigger_history: Array<{
    trigger_id: string;
    activated_at: string;
    condition_met: boolean;
  }>;
}

interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  recommendation?: string;
}

interface GuardrailResult {
  passed: boolean;
  violations: GuardrailViolation[];
  adjusted_parameters?: Partial<StressTest>;
}

interface GuardrailViolation {
  guardrail: string;
  description: string;
  severity: 'critical' | 'warning';
}

interface ScenarioComparisonResult {
  scenarios: Array<{
    scenario_id: string;
    scenario_name: string;
    delta_CO_GRI: number;
    rank: number;
  }>;
  comparison_matrix: ComparisonMatrix;
  insights: ComparisonInsight[];
}

interface ComparisonMatrix {
  dimensions: string[];                   // ['delta_CO_GRI', 'revenue_impact', 'supply_impact', ...]
  values: number[][];                     // Matrix of values [scenario][dimension]
}

interface ComparisonInsight {
  insight_type: 'highest_impact' | 'lowest_impact' | 'most_divergent' | 'most_similar';
  description: string;
  scenario_ids: string[];
  metric: string;
  value: number;
}

interface SensitivityAnalysisResult {
  scenario_id: string;
  parameter_sensitivities: ParameterSensitivity[];
  tornado_chart_data: TornadoChartData;
}

interface ParameterSensitivity {
  parameter_name: string;
  base_value: number;
  sensitivity_coefficient: number;        // dCO-GRI / dParameter
  range: { min: number; max: number };
  impact_range: { min_delta: number; max_delta: number };
}

interface TornadoChartData {
  parameters: string[];
  low_values: number[];
  high_values: number[];
  base_value: number;
}
```

### 3.2 Scenario Builder Logic Flow

```
User Input → Scenario Builder UI → Validation → ScenarioEngine.createScenario()
                                                          ↓
                                                   Store Scenario
                                                          ↓
User Triggers Execution → ScenarioEngine.applyScenario(company, scenario)
                                                          ↓
                                          Evaluate Conditional Logic
                                                          ↓
                                          For Each Active Stage:
                                            - Load Stress Tests
                                            - Calculate Channel Impacts
                                            - Calculate Country Impacts
                                            - Aggregate Results
                                                          ↓
                                          Enforce Guardrails
                                                          ↓
                                          Return ScenarioImpactResult
                                                          ↓
                                          Update UI with Results
```

### 3.3 Integration Points

**With ForecastEngine:**
```typescript
// Scenario Engine can leverage ForecastEngine's baseline events
import { forecastEngineService, ForecastEvent } from '@/services/engines/ForecastEngine';

// Convert forecast events to stress tests
function convertForecastToStressTest(event: ForecastEvent): StressTest {
  return {
    stress_test_id: generateUUID(),
    event_type: event.event_type as EventType,
    severity: determineSeverity(event.expected_delta_CO_GRI),
    probability: event.probability,
    duration: {
      duration_type: 'medium-term',
      months: 6
    },
    affected_countries: event.top_country_nodes,
    affected_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
    custom_parameters: {
      intensity_multiplier: Math.abs(event.expected_delta_CO_GRI) / 5.0
    }
  };
}
```

**With Company Mode:**
```typescript
// Company Mode page imports ScenarioEngine
import { scenarioEngineService } from '@/services/engines/ScenarioEngine';

// Add scenario tab to Company Mode
<TabsTrigger value="scenario">Scenario Analysis</TabsTrigger>

// Execute scenario and display results
const handleRunScenario = async (scenario: Scenario) => {
  const result = scenarioEngineService.applyScenario(company, scenario);
  setScenarioResult(result);
};
```

### 3.4 State Management

```typescript
// Global state for scenarios (using Zustand or similar)
interface ScenarioState {
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  scenarioResults: Record<string, ScenarioImpactResult>;
  comparisonMode: boolean;
  selectedScenarios: string[];
  
  // Actions
  addScenario: (scenario: Scenario) => void;
  updateScenario: (scenario_id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (scenario_id: string) => void;
  setActiveScenario: (scenario_id: string | null) => void;
  setScenarioResult: (scenario_id: string, result: ScenarioImpactResult) => void;
  toggleComparisonMode: () => void;
  selectScenario: (scenario_id: string) => void;
  deselectScenario: (scenario_id: string) => void;
  clearResults: () => void;
}

// Local state for scenario builder
interface ScenarioBuilderState {
  currentStep: number;
  scenarioData: Partial<Scenario>;
  validationErrors: ValidationError[];
  isSubmitting: boolean;
}
```

---

## 4. Calculation Logic

### 4.1 Parameter Translation to CO-GRI Impacts

**Base Formula:**
```
ΔCO-GRI = Σ (StressTest_Impact × Probability × Duration_Factor × Severity_Multiplier)

Where:
- StressTest_Impact = Σ (Channel_Impact × Country_Exposure)
- Channel_Impact = f(Event_Type, Severity, Channel)
- Country_Exposure = Company's existing exposure to affected country
- Duration_Factor = 1.0 (immediate), 0.9 (short), 0.8 (medium), 0.7 (long)
- Severity_Multiplier = 0.5 (Low), 1.0 (Medium), 1.5 (High), 2.0 (Critical)
```

**Channel Impact Calculation:**
```typescript
function calculateChannelImpact(
  eventType: EventType,
  severity: Severity,
  channel: Channel,
  affectedCountries: string[],
  companyExposure: ExposurePathway[]
): number {
  // Get base impact from event-channel matrix
  const baseImpact = EVENT_CHANNEL_IMPACT_MATRIX[eventType][channel];
  
  // Apply severity multiplier
  const severityMultiplier = SEVERITY_MULTIPLIERS[severity];
  
  // Calculate exposure overlap
  const exposureOverlap = companyExposure
    .filter(exp => exp.channel === channel && affectedCountries.includes(exp.country_code))
    .reduce((sum, exp) => sum + exp.exposure_percentage, 0);
  
  // Final impact = base × severity × exposure
  return baseImpact * severityMultiplier * (exposureOverlap / 100);
}

// Event-Channel Impact Matrix (base values)
const EVENT_CHANNEL_IMPACT_MATRIX: Record<EventType, Record<Channel, number>> = {
  'Trade War': {
    'Revenue': 3.5,
    'Supply Chain': 4.0,
    'Physical Assets': 1.5,
    'Financial': 2.0
  },
  'Military Conflict': {
    'Revenue': 4.5,
    'Supply Chain': 5.0,
    'Physical Assets': 6.0,
    'Financial': 3.5
  },
  'Sanctions': {
    'Revenue': 4.0,
    'Supply Chain': 3.5,
    'Physical Assets': 2.0,
    'Financial': 5.0
  },
  'Supply Chain Disruption': {
    'Revenue': 2.5,
    'Supply Chain': 6.0,
    'Physical Assets': 1.5,
    'Financial': 2.0
  },
  'Policy Change': {
    'Revenue': 2.0,
    'Supply Chain': 2.0,
    'Physical Assets': 1.5,
    'Financial': 3.0
  },
  'Economic Crisis': {
    'Revenue': 3.5,
    'Supply Chain': 3.0,
    'Physical Assets': 2.5,
    'Financial': 5.0
  },
  'Natural Disaster': {
    'Revenue': 2.0,
    'Supply Chain': 4.5,
    'Physical Assets': 5.5,
    'Financial': 2.5
  },
  'Cyber Attack': {
    'Revenue': 2.5,
    'Supply Chain': 3.5,
    'Physical Assets': 1.0,
    'Financial': 4.0
  },
  'Custom': {
    'Revenue': 2.0,
    'Supply Chain': 2.0,
    'Physical Assets': 2.0,
    'Financial': 2.0
  }
};

const SEVERITY_MULTIPLIERS: Record<Severity, number> = {
  'Low': 0.5,
  'Medium': 1.0,
  'High': 1.5,
  'Critical': 2.0
};
```

### 4.2 Conditional Stress Test Formulas

**Multi-Stage Scenario Calculation:**
```typescript
function calculateMultiStageImpact(
  company: Company,
  scenario: Scenario
): ScenarioImpactResult {
  let cumulativeDelta = 0;
  const stageImpacts: StageImpact[] = [];
  const state: ScenarioState = initializeState();
  
  // Evaluate stages in order
  for (const stage of scenario.parameters.conditional_logic?.stages || []) {
    // Check if stage should be activated
    const shouldActivate = evaluateStageActivation(stage, state, scenario);
    
    if (shouldActivate) {
      // Calculate impact for this stage
      const stageResult = calculateStageImpact(company, stage);
      cumulativeDelta += stageResult.delta_CO_GRI;
      
      stageImpacts.push({
        stage_id: stage.stage_id,
        stage_number: stage.stage_number,
        stage_name: stage.name,
        delta_CO_GRI: stageResult.delta_CO_GRI,
        cumulative_delta_CO_GRI: cumulativeDelta,
        activated: true,
        activation_date: new Date().toISOString()
      });
      
      // Update state
      state.completed_stages.push(stage.stage_id);
      state.cumulative_delta_CO_GRI = cumulativeDelta;
      state.elapsed_months += stage.delay_months || 0;
    } else {
      stageImpacts.push({
        stage_id: stage.stage_id,
        stage_number: stage.stage_number,
        stage_name: stage.name,
        delta_CO_GRI: 0,
        cumulative_delta_CO_GRI: cumulativeDelta,
        activated: false
      });
    }
  }
  
  return {
    // ... standard result fields
    delta_CO_GRI: cumulativeDelta,
    stage_impacts: stageImpacts
  };
}

function evaluateStageActivation(
  stage: ScenarioStage,
  state: ScenarioState,
  scenario: Scenario
): boolean {
  // Check dependencies
  const dependencies = scenario.parameters.conditional_logic?.dependencies
    .filter(dep => dep.target_stage_id === stage.stage_id) || [];
  
  for (const dep of dependencies) {
    if (dep.dependency_type === 'sequential') {
      if (!state.completed_stages.includes(dep.source_stage_id)) {
        return false;
      }
    }
  }
  
  // Check activation condition
  if (stage.activation_condition) {
    return evaluateConditionExpression(stage.activation_condition, state);
  }
  
  return true;
}

function evaluateConditionExpression(
  expression: string,
  state: ScenarioState
): boolean {
  // Simple expression evaluator
  // Supports: >, <, >=, <=, ==, AND, OR
  // Example: "delta_CO_GRI > 5.0 AND months_elapsed >= 6"
  
  // Replace state variables
  let evaluableExpression = expression
    .replace(/delta_CO_GRI/g, state.cumulative_delta_CO_GRI.toString())
    .replace(/months_elapsed/g, state.elapsed_months.toString());
  
  // Evaluate (in production, use a safe expression evaluator)
  try {
    return eval(evaluableExpression);
  } catch (error) {
    console.error('Failed to evaluate condition:', expression, error);
    return false;
  }
}
```

### 4.3 Multi-Scenario Comparison

```typescript
function compareScenarios(
  results: ScenarioImpactResult[]
): ScenarioComparisonResult {
  // Rank scenarios by delta CO-GRI
  const rankedScenarios = results
    .map((result, index) => ({
      scenario_id: result.scenario_id,
      scenario_name: `Scenario ${index + 1}`, // Load from scenario data
      delta_CO_GRI: result.delta_CO_GRI,
      rank: 0
    }))
    .sort((a, b) => Math.abs(b.delta_CO_GRI) - Math.abs(a.delta_CO_GRI))
    .map((scenario, index) => ({ ...scenario, rank: index + 1 }));
  
  // Build comparison matrix
  const dimensions = [
    'delta_CO_GRI',
    'revenue_impact',
    'supply_impact',
    'assets_impact',
    'financial_impact'
  ];
  
  const values = results.map(result => [
    result.delta_CO_GRI,
    result.channel_impacts.find(c => c.channel === 'Revenue')?.delta || 0,
    result.channel_impacts.find(c => c.channel === 'Supply Chain')?.delta || 0,
    result.channel_impacts.find(c => c.channel === 'Physical Assets')?.delta || 0,
    result.channel_impacts.find(c => c.channel === 'Financial')?.delta || 0
  ]);
  
  // Generate insights
  const insights: ComparisonInsight[] = [];
  
  // Highest impact scenario
  const highestImpact = rankedScenarios[0];
  insights.push({
    insight_type: 'highest_impact',
    description: `${highestImpact.scenario_name} has the highest impact with ΔCO-GRI of ${highestImpact.delta_CO_GRI.toFixed(1)}`,
    scenario_ids: [highestImpact.scenario_id],
    metric: 'delta_CO_GRI',
    value: highestImpact.delta_CO_GRI
  });
  
  // Most divergent scenarios
  const deltas = rankedScenarios.map(s => s.delta_CO_GRI);
  const maxDelta = Math.max(...deltas);
  const minDelta = Math.min(...deltas);
  if (maxDelta - minDelta > 5.0) {
    insights.push({
      insight_type: 'most_divergent',
      description: `Scenarios show high divergence with ${(maxDelta - minDelta).toFixed(1)} point spread`,
      scenario_ids: [
        rankedScenarios.find(s => s.delta_CO_GRI === maxDelta)!.scenario_id,
        rankedScenarios.find(s => s.delta_CO_GRI === minDelta)!.scenario_id
      ],
      metric: 'delta_CO_GRI',
      value: maxDelta - minDelta
    });
  }
  
  return {
    scenarios: rankedScenarios,
    comparison_matrix: { dimensions, values },
    insights
  };
}
```

### 4.4 Validation Rules & Guardrails

```typescript
function validateScenario(scenario: Scenario): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Rule 1: Name must be non-empty and <= 100 chars
  if (!scenario.name || scenario.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Scenario name is required',
      severity: 'error'
    });
  } else if (scenario.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Scenario name must be 100 characters or less',
      severity: 'error'
    });
  }
  
  // Rule 2: Must have at least one stress test
  if (!scenario.parameters.stress_tests || scenario.parameters.stress_tests.length === 0) {
    errors.push({
      field: 'parameters.stress_tests',
      message: 'Scenario must include at least one stress test',
      severity: 'error'
    });
  }
  
  // Rule 3: Probabilities must be in valid range
  scenario.parameters.stress_tests.forEach((test, index) => {
    if (test.probability < 0 || test.probability > 1) {
      errors.push({
        field: `parameters.stress_tests[${index}].probability`,
        message: 'Probability must be between 0 and 1',
        severity: 'error'
      });
    }
  });
  
  // Rule 4: Affected countries must be valid ISO codes
  scenario.parameters.stress_tests.forEach((test, index) => {
    if (!test.affected_countries || test.affected_countries.length === 0) {
      warnings.push({
        field: `parameters.stress_tests[${index}].affected_countries`,
        message: 'No affected countries specified',
        recommendation: 'Add at least one country for more accurate impact calculation'
      });
    }
  });
  
  // Rule 5: Multi-stage scenarios must have valid conditional logic
  if (scenario.scenario_type === 'multi-stage') {
    if (!scenario.parameters.conditional_logic) {
      errors.push({
        field: 'parameters.conditional_logic',
        message: 'Multi-stage scenarios require conditional logic definition',
        severity: 'error'
      });
    } else {
      // Validate stage dependencies
      const stageIds = new Set(scenario.parameters.conditional_logic.stages.map(s => s.stage_id));
      scenario.parameters.conditional_logic.dependencies.forEach((dep, index) => {
        if (!stageIds.has(dep.source_stage_id) || !stageIds.has(dep.target_stage_id)) {
          errors.push({
            field: `parameters.conditional_logic.dependencies[${index}]`,
            message: 'Dependency references non-existent stage',
            severity: 'error'
          });
        }
      });
    }
  }
  
  // Rule 6: Warn if high severity with low probability
  scenario.parameters.stress_tests.forEach((test, index) => {
    if (test.severity === 'Critical' && test.probability < 0.2) {
      warnings.push({
        field: `parameters.stress_tests[${index}]`,
        message: 'Critical severity with low probability (<20%) may be unrealistic',
        recommendation: 'Review probability assignment for critical events'
      });
    }
  });
  
  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

function enforceGuardrails(
  company: Company,
  stressTest: StressTest
): GuardrailResult {
  const violations: GuardrailViolation[] = [];
  let adjustedParameters: Partial<StressTest> | undefined;
  
  // Guardrail 1: Only apply to countries with existing exposure
  const validCountries = stressTest.affected_countries.filter(countryCode => {
    return company.exposure_pathways.some(exp => exp.country_code === countryCode);
  });
  
  if (validCountries.length < stressTest.affected_countries.length) {
    violations.push({
      guardrail: 'Exposure Overlap',
      description: `${stressTest.affected_countries.length - validCountries.length} countries have no existing exposure and will be excluded`,
      severity: 'warning'
    });
    
    adjustedParameters = {
      ...adjustedParameters,
      affected_countries: validCountries
    };
  }
  
  // Guardrail 2: Never create new country exposures
  // (Already enforced by Guardrail 1)
  
  // Guardrail 3: Never modify exposure weights
  if (stressTest.custom_parameters?.channel_weights) {
    violations.push({
      guardrail: 'Exposure Weight Preservation',
      description: 'Custom channel weights are not allowed - exposure weights must be preserved',
      severity: 'critical'
    });
    
    adjustedParameters = {
      ...adjustedParameters,
      custom_parameters: {
        ...stressTest.custom_parameters,
        channel_weights: undefined
      }
    };
  }
  
  // Guardrail 4: Intensity multiplier bounds
  const intensityMultiplier = stressTest.custom_parameters?.intensity_multiplier;
  if (intensityMultiplier !== undefined && (intensityMultiplier < 0.1 || intensityMultiplier > 5.0)) {
    violations.push({
      guardrail: 'Intensity Multiplier Bounds',
      description: 'Intensity multiplier must be between 0.1 and 5.0',
      severity: 'critical'
    });
    
    adjustedParameters = {
      ...adjustedParameters,
      custom_parameters: {
        ...stressTest.custom_parameters,
        intensity_multiplier: Math.max(0.1, Math.min(5.0, intensityMultiplier))
      }
    };
  }
  
  return {
    passed: violations.filter(v => v.severity === 'critical').length === 0,
    violations,
    adjusted_parameters: adjustedParameters
  };
}
```

---

## 5. Technical Specifications

### 5.1 File Structure

```
src/
├── services/
│   └── engines/
│       ├── ForecastEngine.ts                    # Existing forecast engine
│       ├── ScenarioEngine.ts                    # NEW: Core scenario engine
│       ├── ScenarioCalculator.ts                # NEW: Impact calculation logic
│       ├── ScenarioValidator.ts                 # NEW: Validation & guardrails
│       └── __tests__/
│           ├── ScenarioEngine.test.ts           # NEW: Unit tests
│           ├── ScenarioCalculator.test.ts       # NEW: Calculation tests
│           └── ScenarioValidator.test.ts        # NEW: Validation tests
├── types/
│   ├── scenario.ts                              # NEW: Scenario type definitions
│   └── global.ts                                # Existing global types
├── store/
│   └── scenarioState.ts                         # NEW: Scenario state management
├── components/
│   └── scenario/
│       ├── ScenarioBuilder.tsx                  # NEW: Scenario creation UI
│       ├── ScenarioList.tsx                     # NEW: Scenario management
│       ├── ScenarioResults.tsx                  # NEW: Results display
│       ├── ScenarioComparison.tsx               # NEW: Multi-scenario comparison
│       ├── StressTestEditor.tsx                 # NEW: Stress test configuration
│       ├── ConditionalLogicBuilder.tsx          # NEW: Multi-stage logic editor
│       └── __tests__/
│           ├── ScenarioBuilder.test.tsx         # NEW: Component tests
│           └── ScenarioResults.test.tsx         # NEW: Component tests
└── pages/
    ├── CompanyModePage.tsx                      # UPDATED: Add scenario tab
    └── ScenarioModePage.tsx                     # NEW: Dedicated scenario page

docs/
└── design/
    └── scenario_engine_design.md                # This document
```

### 5.2 API Interfaces

```typescript
// ScenarioEngine.ts
export class ScenarioEngineService {
  // Public API
  public createScenario(params: CreateScenarioParams): Scenario;
  public applyScenario(company: Company, scenario: Scenario): ScenarioImpactResult;
  public compareScenarios(results: ScenarioImpactResult[]): ScenarioComparisonResult;
  
  // Private methods
  private calculateImpact(company: Company, stressTests: StressTest[]): ScenarioImpactResult;
  private evaluateConditionalLogic(scenario: Scenario, state: ScenarioState): ScenarioStage[];
  private enforceGuardrails(company: Company, stressTest: StressTest): GuardrailResult;
}

// Export singleton instance
export const scenarioEngineService = new ScenarioEngineService();

// ScenarioCalculator.ts
export class ScenarioCalculator {
  public calculateChannelImpact(
    eventType: EventType,
    severity: Severity,
    channel: Channel,
    affectedCountries: string[],
    companyExposure: ExposurePathway[]
  ): number;
  
  public calculateCountryImpact(
    company: Company,
    stressTest: StressTest,
    countryCode: string
  ): CountryImpact;
  
  public aggregateImpacts(
    channelImpacts: ChannelImpact[],
    countryImpacts: CountryImpact[]
  ): number;
}

// ScenarioValidator.ts
export class ScenarioValidator {
  public validateScenario(scenario: Scenario): ValidationResult;
  public enforceGuardrails(company: Company, stressTest: StressTest): GuardrailResult;
  public validateConditionalLogic(logic: ConditionalLogic): ValidationResult;
}
```

### 5.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interface Layer                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ScenarioBuilder  │  ScenarioList  │  ScenarioResults  │  Comparison   │
└──────────┬────────┴────────┬────────┴────────┬─────────┴────────┬──────┘
           │                 │                 │                  │
           ▼                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         State Management Layer                          │
├─────────────────────────────────────────────────────────────────────────┤
│                          scenarioState (Zustand)                        │
│  - scenarios[]                                                          │
│  - activeScenario                                                       │
│  - scenarioResults{}                                                    │
│  - selectedScenarios[]                                                  │
└──────────┬──────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Service Layer (Engine)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        ScenarioEngineService                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ ScenarioValidator│  │ScenarioCalculator│  │  ConditionalLogic│     │
│  │  - validate()    │  │  - calculate()   │  │  - evaluate()    │     │
│  │  - guardrails()  │  │  - aggregate()   │  │  - triggers()    │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
└──────────┬──────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Data Layer                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Company Data  │  Exposure Pathways  │  Forecast Events  │  Scenarios  │
└─────────────────────────────────────────────────────────────────────────┘

Flow:
1. User creates scenario → ScenarioBuilder → scenarioState.addScenario()
2. User runs scenario → scenarioState.setActiveScenario()
3. Engine validates → ScenarioValidator.validateScenario()
4. Engine calculates → ScenarioCalculator.calculateImpact()
5. Engine enforces guardrails → ScenarioValidator.enforceGuardrails()
6. Results stored → scenarioState.setScenarioResult()
7. UI updates → ScenarioResults displays results
```

### 5.4 Performance Considerations

**Optimization Strategies:**

1. **Lazy Calculation**
   - Only calculate impacts when scenario is executed
   - Cache results for repeated comparisons
   - Invalidate cache when scenario parameters change

2. **Incremental Updates**
   - For multi-stage scenarios, calculate stage-by-stage
   - Store intermediate results to avoid recalculation
   - Use memoization for expensive calculations

3. **Parallel Processing**
   - Calculate channel impacts in parallel (Promise.all)
   - Calculate country impacts in parallel
   - Aggregate results after parallel calculations complete

4. **Data Structures**
   - Use Map for O(1) lookups of scenarios by ID
   - Use Set for efficient country/channel filtering
   - Pre-compute exposure overlap matrices

5. **Memory Management**
   - Limit number of cached results (LRU cache, max 50 scenarios)
   - Clear old scenario results after 24 hours
   - Use weak references for large data structures

**Performance Targets:**
- Scenario validation: < 50ms
- Single scenario calculation: < 200ms
- Multi-scenario comparison (5 scenarios): < 1s
- Conditional logic evaluation: < 100ms per stage

**Code Example:**
```typescript
// Memoized calculation with caching
const calculationCache = new Map<string, ScenarioImpactResult>();

function calculateImpactWithCache(
  company: Company,
  scenario: Scenario
): ScenarioImpactResult {
  const cacheKey = `${company.ticker}_${scenario.scenario_id}_${scenario.updated_at}`;
  
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey)!;
  }
  
  const result = calculateImpact(company, scenario);
  
  // Limit cache size
  if (calculationCache.size > 50) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  calculationCache.set(cacheKey, result);
  return result;
}

// Parallel channel impact calculation
async function calculateChannelImpactsParallel(
  company: Company,
  stressTest: StressTest
): Promise<ChannelImpact[]> {
  const channels: Channel[] = ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'];
  
  const impactPromises = channels.map(channel =>
    Promise.resolve(calculateChannelImpact(
      stressTest.event_type,
      stressTest.severity,
      channel,
      stressTest.affected_countries,
      company.exposure_pathways
    )).then(delta => ({
      channel,
      baseline_score: getBaselineChannelScore(company, channel),
      scenario_score: getBaselineChannelScore(company, channel) + delta,
      delta,
      contribution_to_total: 0, // Will be calculated after aggregation
      affected_countries: stressTest.affected_countries
    }))
  );
  
  return Promise.all(impactPromises);
}
```

---

## 6. Implementation Phases

### Phase 1: Core Engine (Week 8, Days 1-2)
- Implement ScenarioEngine.ts with basic methods
- Implement ScenarioCalculator.ts with impact formulas
- Implement ScenarioValidator.ts with validation rules
- Write comprehensive unit tests (>85% coverage)

### Phase 2: UI Components (Week 8, Days 3-4)
- Build ScenarioBuilder.tsx for scenario creation
- Build StressTestEditor.tsx for stress test configuration
- Build ScenarioResults.tsx for results display
- Integrate with Company Mode page

### Phase 3: Advanced Features (Week 8, Day 5)
- Implement ConditionalLogicBuilder.tsx for multi-stage scenarios
- Implement ScenarioComparison.tsx for multi-scenario analysis
- Add sensitivity analysis functionality
- Performance optimization and caching

### Phase 4: Testing & Documentation (Week 8, Days 6-7)
- End-to-end integration testing
- User acceptance testing
- Documentation updates
- Bug fixes and refinements

---

## 7. Testing Strategy

### Unit Tests
- ScenarioEngine methods (createScenario, applyScenario, calculateImpact)
- ScenarioCalculator formulas (channel impact, country impact, aggregation)
- ScenarioValidator rules (validation, guardrails, conditional logic)
- Edge cases: empty scenarios, invalid parameters, extreme values

### Integration Tests
- Scenario creation → validation → execution → results
- Multi-stage scenario with conditional logic
- Scenario comparison with multiple scenarios
- Integration with ForecastEngine and Company Mode

### Performance Tests
- Scenario calculation time under load
- Memory usage with large number of scenarios
- Cache effectiveness and hit rates
- Parallel calculation performance

### User Acceptance Tests
- Create and execute simple scenario
- Create multi-stage scenario with conditions
- Compare multiple scenarios
- Export scenario results

---

## 8. Future Enhancements

1. **Machine Learning Integration**
   - Auto-suggest stress test parameters based on historical events
   - Predict scenario outcomes using ML models
   - Anomaly detection for unrealistic scenarios

2. **Collaborative Features**
   - Share scenarios with team members
   - Comment and discuss scenario assumptions
   - Version control for scenario iterations

3. **Advanced Visualizations**
   - Interactive scenario impact maps
   - Animated multi-stage scenario progression
   - 3D risk surface plots

4. **External Data Integration**
   - Import real-time geopolitical events
   - Connect to news APIs for scenario triggers
   - Integrate with economic indicators

5. **Optimization Engine**
   - Find optimal mitigation strategies
   - Portfolio-level scenario analysis
   - Risk-return optimization under scenarios

---

## 9. Appendix

### A. Glossary

- **Scenario**: A user-defined "what-if" analysis combining one or more stress tests
- **Stress Test**: A specific geopolitical event with defined parameters
- **Conditional Logic**: Rules governing multi-stage scenario progression
- **Guardrail**: Validation rule ensuring calculation integrity
- **Channel**: Risk transmission pathway (Revenue, Supply, Assets, Financial)
- **Exposure**: Company's presence/dependence on a specific country
- **Delta CO-GRI**: Change in CO-GRI score due to scenario

### B. References

- ForecastEngine implementation: `/workspace/shadcn-ui/src/services/engines/ForecastEngine.ts`
- Company Mode page: `/workspace/shadcn-ui/src/pages/CompanyModePage.tsx`
- CO-GRI calculation service: `/workspace/shadcn-ui/src/services/cogriCalculationService.ts`
- Global types: `/workspace/shadcn-ui/src/types/global.ts`

### C. Change Log

- 2026-03-02: Initial design document created

---

**Document Status**: Draft v1.0  
**Author**: Bob (System Architect)  
**Date**: 2026-03-02  
**Review Status**: Pending stakeholder review