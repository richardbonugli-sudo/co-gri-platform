# Scenario Mode - Technical Documentation

## Architecture Overview

### Component Hierarchy

```
ScenarioMode (Page)
├── ScenarioBuilder (S1)
│   ├── Template Selection
│   ├── Event Configuration
│   ├── Country Selection
│   ├── Propagation Settings
│   └── Advanced Options
├── ScenarioImpactSummary (S2)
│   ├── ΔCO-GRI Display
│   ├── Risk Level Badges
│   └── Confidence Indicators
├── ChannelAttribution (S3)
│   ├── Stacked Bar Chart
│   ├── Channel Cards
│   └── Evidence Indicators
├── NodeAttribution (S4)
│   ├── Sortable Table
│   ├── Filter Controls
│   ├── Expandable Rows
│   └── Export Functions
└── TransmissionTrace (S5)
    ├── Network Graph (React Flow)
    ├── Layout Controls
    ├── Layer Toggles
    └── Interactive Controls
```

### State Management Flow

```
User Action → S1 (Scenario Builder)
              ↓
         runScenario()
              ↓
    useScenarioState (Zustand)
              ↓
    calculateScenarioImpact() (Scenario Engine)
              ↓
    applyScenarioToCompany() (Scenario Engine)
              ↓
    ScenarioResult (State Update)
              ↓
    ┌─────────┬─────────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓         ↓
   S2        S3        S4        S5    (Re-render)
```

### Data Flow

```
ScenarioConfig (User Input)
    ↓
CountryShockChange[] (Scenario Engine)
    ↓
CompanyScenarioResult (Scenario Engine)
    ↓
ScenarioResult (State)
    ↓
Component Props (S2-S5)
```

## State Management

### Global State (useGlobalState)

**Location**: `/workspace/shadcn-ui/src/store/globalState.ts`

**Purpose**: Manage application-wide state

**Key Properties**:
```typescript
interface GlobalState {
  mode: 'Overview' | 'Enhanced' | 'Portfolio' | 'Scenario';
  lens: 'Country Shock' | 'Scenario Shock' | 'Alignment' | 'Sector';
  selectedCompany: string | null;
  setMode: (mode: string) => void;
  setLens: (lens: string) => void;
  setSelectedCompany: (ticker: string) => void;
}
```

**Usage**:
```typescript
const { setMode, setLens, setSelectedCompany } = useGlobalState();

// Set mode on page mount
useEffect(() => {
  setMode('Scenario');
  setLens('Scenario Shock');
  setSelectedCompany('AAPL');
}, []);
```

### Scenario State (useScenarioState)

**Location**: `/workspace/shadcn-ui/src/store/scenarioState.ts`

**Purpose**: Manage scenario-specific state

**Key Properties**:
```typescript
interface ScenarioState {
  // Active scenario
  activeScenario: ScenarioInput | null;
  scenarioResult: ScenarioResult | null;
  
  // Saved scenarios
  savedScenarios: ScenarioTemplate[];
  
  // Comparison mode
  comparisonMode: boolean;
  comparedScenarios: ScenarioResult[];
  
  // UI state
  isCalculating: boolean;
  calculationProgress: number;
  error: string | null;
  
  // Actions
  setActiveScenario: (scenario: ScenarioInput) => void;
  runScenario: (config: ScenarioConfig, ticker: string) => Promise<void>;
  saveScenario: (scenario: ScenarioInput) => void;
  loadScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  toggleComparisonMode: () => void;
  addToComparison: (result: ScenarioResult) => void;
  removeFromComparison: (scenarioId: string) => void;
  clearComparison: () => void;
  reset: () => void;
  clearError: () => void;
}
```

**Usage**:
```typescript
const { runScenario, scenarioResult, isCalculating, error } = useScenarioState();

// Run scenario
const handleRunScenario = async () => {
  await runScenario(config, ticker);
};

// Access results
if (scenarioResult) {
  console.log('ΔCO-GRI:', scenarioResult.deltaCOGRI);
}
```

## Scenario Engine API

### Core Functions

#### calculateScenarioImpact()

**Location**: `/workspace/shadcn-ui/src/services/scenarioEngine.ts`

**Purpose**: Calculate country-level shock changes from scenario configuration

**Signature**:
```typescript
function calculateScenarioImpact(
  config: ScenarioConfig
): CountryShockChange[]
```

**Parameters**:
```typescript
interface ScenarioConfig {
  eventType: EventType;
  actorCountry: string;
  targetCountries: string[];
  propagationType: PropagationType;
  severity: Severity;
  alignmentChange?: number;
  exposureChange?: number;
  sectorSensitivity?: number;
}
```

**Returns**:
```typescript
interface CountryShockChange {
  country: string;
  baseCSI: number;
  scenarioCSI: number;
  delta: number;
  impactReason: string;
}
```

**Example**:
```typescript
const config: ScenarioConfig = {
  eventType: 'Sanctions',
  actorCountry: 'United States',
  targetCountries: ['China', 'Taiwan'],
  propagationType: 'Regional',
  severity: 'High',
};

const shockChanges = calculateScenarioImpact(config);
// Returns array of CountryShockChange for all affected countries
```

#### applyScenarioToCompany()

**Location**: `/workspace/shadcn-ui/src/services/scenarioEngine.ts`

**Purpose**: Apply scenario shocks to company exposures and calculate ΔCO-GRI

**Signature**:
```typescript
async function applyScenarioToCompany(
  ticker: string,
  shockChanges: CountryShockChange[],
  config: ScenarioConfig
): Promise<CompanyScenarioResult>
```

**Parameters**:
- `ticker`: Company ticker symbol (e.g., 'AAPL')
- `shockChanges`: Array of country shock changes from calculateScenarioImpact()
- `config`: Original scenario configuration

**Returns**:
```typescript
interface CompanyScenarioResult {
  ticker: string;
  baselineScore: number;
  scenarioScore: number;
  scoreDelta: number;
  percentChange: number;
  baselineRiskLevel: string;
  scenarioRiskLevel: string;
  countryExposures: CountryExposureResult[];
  channelBreakdown: ChannelBreakdown;
}
```

**Example**:
```typescript
const result = await applyScenarioToCompany(
  'AAPL',
  shockChanges,
  config
);

console.log('Baseline CO-GRI:', result.baselineScore);
console.log('Scenario CO-GRI:', result.scenarioScore);
console.log('ΔCO-GRI:', result.scoreDelta);
```

### Helper Functions

#### getPropagationEngine()

**Purpose**: Get propagation engine based on type

**Signature**:
```typescript
function getPropagationEngine(
  type: PropagationType
): PropagationEngine
```

#### applyEventImpact()

**Purpose**: Calculate CSI delta for a country based on event type and severity

**Signature**:
```typescript
function applyEventImpact(
  baseCSI: number,
  eventType: EventType,
  severity: Severity,
  isTarget: boolean,
  isActor: boolean
): number
```

## Type Definitions

### ScenarioConfig

```typescript
interface ScenarioConfig {
  eventType: EventType;
  actorCountry: string;
  targetCountries: string[];
  propagationType: PropagationType;
  severity: Severity;
  alignmentChange?: number;      // -100 to +100
  exposureChange?: number;        // -100 to +100
  sectorSensitivity?: number;     // 0 to 2
}

type EventType = 
  | 'Sanctions'
  | 'Capital Controls'
  | 'Nationalization'
  | 'Export Ban'
  | 'Foreign Investment Restriction'
  | 'Trade Embargo'
  | 'Conflict'
  | 'Domestic Instability'
  | 'Energy Restriction'
  | 'Cyberattack'
  | 'Custom';

type PropagationType = 
  | 'Unilateral'   // Only targets
  | 'Bilateral'    // Actor + targets
  | 'Regional'     // + spillover via economic links
  | 'Global';      // All countries

type Severity = 'Low' | 'Medium' | 'High';
```

### ScenarioResult

```typescript
interface ScenarioResult {
  scenarioId: string;
  companyId: string;
  ticker: string;
  
  // Impact metrics
  baselineCOGRI: number;
  scenarioCOGRI: number;
  deltaCOGRI: number;
  deltaPercentage: number;
  
  // Risk levels
  baselineRiskLevel: RiskLevel;
  scenarioRiskLevel: RiskLevel;
  riskLevelChange: 'Upgrade' | 'Downgrade' | 'Stable';
  
  // Confidence
  confidence: number;
  dataQuality: DataQuality;
  
  // Attribution
  channelAttribution: ChannelDelta[];
  nodeAttribution: NodeDelta[];
  
  // Metadata
  calculatedAt: Date;
  calculationTime: number;
}
```

### ChannelDelta

```typescript
interface ChannelDelta {
  channelName: 'Trade' | 'Alignment' | 'Sector';
  baselineScore: number;
  scenarioScore: number;
  deltaContribution: number;
  confidence: number;
  evidenceLevel: EvidenceLevel;
  dataSource: DataSource;
}

type EvidenceLevel = 'A+' | 'A' | 'B' | 'C' | 'D' | 'None';
type DataSource = 
  | 'Direct Data'
  | 'OECD ICIO'
  | 'IMF CPIS'
  | 'Sector Estimate'
  | 'Fallback'
  | 'Known Zero';
```

### NodeDelta

```typescript
interface NodeDelta {
  country: string;
  baselineRisk: number;
  scenarioRisk: number;
  delta: number;
  deltaPercentage: number;
  contribution: number;
  dominantChannel: 'Trade' | 'Supply Chain' | 'Financial' | 'Alignment';
  channelBreakdown: {
    revenue: number;
    supplyChain: number;
    physicalAssets: number;
    financial: number;
  };
  baselineShock: number;
  scenarioShock: number;
  shockDelta: number;
}
```

## Component Integration

### S1 (Scenario Builder) Integration

**Props**: None (uses URL parameter for ticker)

**State Dependencies**:
- `useScenarioState`: runScenario, isCalculating, error
- `useGlobalState`: selectedCompany

**Key Functions**:
```typescript
const handleRunScenario = async () => {
  const config: ScenarioConfig = {
    eventType: selectedEventType,
    actorCountry: selectedActor,
    targetCountries: selectedTargets,
    propagationType: selectedPropagation,
    severity: selectedSeverity,
  };
  
  await runScenario(config, ticker);
};
```

### S2 (Impact Summary) Integration

**Props**:
```typescript
interface ScenarioImpactSummaryProps {
  result: ScenarioResult | null;
  scenarioName?: string;
  isLoading?: boolean;
}
```

**Usage**:
```typescript
<ScenarioImpactSummary 
  result={scenarioResult}
  scenarioName={activeScenario?.name}
  isLoading={isCalculating}
/>
```

### S3 (Channel Attribution) Integration

**Props**:
```typescript
interface ChannelAttributionProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
}
```

**Data Access**:
```typescript
const channels = result?.channelAttribution || [];
const tradeChannel = channels.find(c => c.channelName === 'Trade');
```

### S4 (Node Attribution) Integration

**Props**:
```typescript
interface NodeAttributionProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
  actorCountry?: string;
  targetCountries?: string[];
}
```

**Data Processing**:
```typescript
const processedCountries = result.nodeAttribution.map((node) => {
  const delta = node.scenarioRisk - node.baselineRisk;
  const percentage = (delta / node.baselineRisk) * 100;
  
  let impactType: 'actor' | 'direct' | 'spillover' = 'spillover';
  if (actorCountry === node.country) impactType = 'actor';
  else if (targetCountries.includes(node.country)) impactType = 'direct';
  
  return { ...node, delta, percentage, impactType };
});
```

### S5 (Transmission Trace) Integration

**Props**:
```typescript
interface TransmissionTraceProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
  actorCountry?: string;
  targetCountries?: string[];
}
```

**Graph Construction**:
```typescript
const nodes: Node[] = processedCountries.map((country) => ({
  id: country.country,
  position: calculatePosition(country, layout),
  data: { label: country.country },
  style: {
    background: getNodeColor(country.impactType),
    width: calculateNodeSize(country.delta),
  },
}));

const edges: Edge[] = createEdges(actor, targets, spillovers);
```

## Testing Strategy

### Unit Tests

**Location**: `/workspace/shadcn-ui/src/__tests__/unit/`

**Coverage**:
- Component rendering
- State management
- Data transformations
- Calculation logic
- Sorting/filtering algorithms
- Layout algorithms

**Example**:
```typescript
describe('Node Attribution - Delta Calculations', () => {
  it('should calculate ΔCO-GRI correctly', () => {
    const exposure = {
      baseContribution: 16.25,
      scenarioContribution: 20.0,
    };
    
    const delta = exposure.scenarioContribution - exposure.baseContribution;
    expect(delta).toBeCloseTo(3.75, 2);
  });
});
```

### Integration Tests

**Location**: `/workspace/shadcn-ui/src/__tests__/e2e/`

**Coverage**:
- Complete workflow (navigation → configuration → calculation → results)
- State synchronization between components
- Error handling
- Edge cases

**Example**:
```typescript
describe('Scenario Mode - End-to-End', () => {
  it('should display all components when scenario result exists', () => {
    render(<ScenarioMode />);
    
    expect(screen.getByText(/Scenario Impact Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Channel Attribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Node Attribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Transmission Trace/i)).toBeInTheDocument();
  });
});
```

### Performance Tests

**Metrics Tracked**:
- Component render time
- Scenario calculation time
- Memory usage
- Bundle size

**Targets**:
- Initial load: < 1s (WiFi)
- Scenario calculation: < 2s (Global)
- Component render: < 300ms (100 countries)
- Memory usage: < 100MB

## Deployment Considerations

### Build Optimization

**Current Bundle Size**: 5,376 KB (1,537 KB gzipped)

**Recommendations**:
1. **Code Splitting**: Lazy load React Flow
   ```typescript
   const TransmissionTrace = lazy(() => import('./TransmissionTrace'));
   ```

2. **Tree Shaking**: Ensure unused code is removed
   ```typescript
   // Import only what's needed
   import { useNodesState } from 'reactflow';
   ```

3. **Chunk Optimization**: Configure manual chunks
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'react-flow': ['reactflow'],
           'vendor': ['react', 'react-dom', 'zustand'],
         },
       },
     },
   }
   ```

### Environment Variables

```env
# API endpoints (if needed)
VITE_API_BASE_URL=https://api.example.com

# Feature flags
VITE_ENABLE_COMPARISON_MODE=true
VITE_ENABLE_SCENARIO_SAVE=false

# Performance
VITE_MAX_COUNTRIES=100
VITE_DEFAULT_DISPLAY_LIMIT=30
```

### Error Handling

**Strategy**:
1. **User-facing errors**: Display in Alert component
2. **Console errors**: Log for debugging
3. **Sentry integration**: Track production errors

**Example**:
```typescript
try {
  await runScenario(config, ticker);
} catch (error) {
  console.error('Scenario calculation failed:', error);
  setError('Failed to calculate scenario. Please try again.');
  // Send to Sentry
  Sentry.captureException(error);
}
```

### Monitoring

**Metrics to Track**:
- Page load time
- Scenario calculation time
- Error rate
- User engagement (scenarios run per session)
- Browser/device distribution

**Tools**:
- Google Analytics for usage tracking
- Sentry for error tracking
- Lighthouse for performance audits

## API Documentation

See `/workspace/shadcn-ui/docs/SCENARIO_ENGINE_API.md` for detailed API documentation.

## Future Enhancements

### Short-term (Q2 2026)
1. Scenario comparison mode (side-by-side)
2. Save/load scenarios (localStorage)
3. Export reports (PDF)
4. Keyboard shortcuts for power users

### Medium-term (Q3 2026)
1. Web Workers for calculation parallelization
2. Historical scenario tracking
3. Scenario templates library (user-contributed)
4. Advanced filtering (custom queries)

### Long-term (Q4 2026)
1. Real-time scenario monitoring
2. AI-powered scenario suggestions
3. Multi-company portfolio scenarios
4. Scenario sensitivity analysis

## Version History

- **v1.0.0** (2026-03-01): Initial release with S1-S5 components
- **v0.9.0** (2026-02-15): Beta release with S1-S4 components
- **v0.8.0** (2026-02-01): Alpha release with S1-S3 components

## Contributors

- **Alex** (Engineer): Implementation of all components and scenario engine
- **Mike** (Team Leader): Architecture design and requirements
- **Bob** (Architect): System design and technical specifications

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-03-01  
**Next Review**: 2026-06-01