# CO-GRI Strategic Forecast Baseline - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** January 8, 2026  
**Target Audience:** Developers, Technical Staff

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Hierarchy](#component-hierarchy)
3. [Data Flow](#data-flow)
4. [Phase 1: Data Layer](#phase-1-data-layer)
5. [Phase 2: Forecast Engine](#phase-2-forecast-engine)
6. [Phase 3: Output Components](#phase-3-output-components)
7. [Integration Guide](#integration-guide)
8. [Configuration](#configuration)
9. [Deployment](#deployment)
10. [Maintenance](#maintenance)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CO-GRI Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Phase 1    │      │   Phase 2    │      │  Phase 3  │ │
│  │  Data Layer  │─────▶│Forecast Engine│─────▶│  Output   │ │
│  │              │      │              │      │Components │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│  ┌──────▼─────────────────────▼─────────────────────▼─────┐ │
│  │              User Interface (React)                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.x
- TypeScript 5.x
- shadcn-ui component library
- Tailwind CSS
- Lucide React icons

**Build Tools:**
- Vite
- pnpm package manager
- ESLint + Prettier

**Testing:**
- Vitest
- React Testing Library
- jest-axe (accessibility)
- axe-core

**Data Format:**
- TypeScript interfaces
- JSON-compatible structures
- Immutable data patterns

---

## Component Hierarchy

### Complete Component Tree

```
App
└── COGRIPage
    ├── ModeSelector (Phase 2)
    │   ├── Radio: Event-Driven Scenario
    │   └── Radio: Strategic Forecast Baseline
    │
    └── [Conditional Rendering based on mode]
        │
        ├── StandardCOGRIOutput (Event-Driven)
        │   └── [Original CO-GRI output]
        │
        └── ForecastOutputRenderer (Strategic Forecast Baseline)
            ├── Header
            │   ├── Title
            │   ├── Company Name
            │   └── Action Buttons (Print, Export)
            │
            ├── Metadata Banner
            │   ├── Forecast Period
            │   ├── Countries Analyzed
            │   ├── Average Delta
            │   └── Confidence Level
            │
            ├── StrategicOutlookTier (Tier 1)
            │   ├── Executive Summary Cards
            │   │   ├── Net Portfolio Impact
            │   │   ├── Risk Trend
            │   │   └── Forecast Confidence
            │   ├── Key Geopolitical Events (Top 3)
            │   ├── Top Risk Movers
            │   │   ├── Highest Increases (Top 5)
            │   │   └── Highest Decreases (Top 5)
            │   └── Investment Implications
            │
            ├── ExposureMappingTier (Tier 2)
            │   ├── Summary Statistics
            │   ├── Filters & Search
            │   │   ├── Search Input
            │   │   ├── Outlook Filter
            │   │   └── Trend Filter
            │   ├── Exposure Table
            │   │   ├── Table Headers (sortable)
            │   │   └── Table Rows (expandable)
            │   │       └── Row Details
            │   │           ├── Risk Drivers
            │   │           ├── Expected Return
            │   │           └── Applicable Events
            │   └── Pagination
            │
            ├── QuantitativeAnchorsTier (Tier 3)
            │   ├── Sector Multipliers Table
            │   ├── Regional Premiums Table
            │   ├── Asset Class Forecasts Table
            │   ├── Geopolitical Events (Complete)
            │   │   └── Event Cards (expandable)
            │   ├── Forecast Metadata
            │   └── Methodology Notes
            │
            └── Footer
```

### Component Responsibilities

**ModeSelector:**
- Manages mode selection state
- Triggers recalculation on mode change
- Displays forecast metadata when in forecast mode

**ForecastOutputRenderer:**
- Orchestrates all three tiers
- Manages tier expansion state
- Calculates summary metrics
- Handles print/export actions

**StrategicOutlookTier:**
- Displays executive-level insights
- Calculates top movers
- Determines risk trends
- Shows investment implications

**ExposureMappingTier:**
- Displays detailed country table
- Manages filtering and sorting
- Handles row expansion
- Exports to CSV

**QuantitativeAnchorsTier:**
- Displays technical data
- Shows complete methodology
- Provides copy-to-clipboard
- Expandable event details

---

## Data Flow

### Complete Data Pipeline

```
1. User Input
   └─▶ Portfolio Exposures (Exposure[])

2. Mode Selection
   └─▶ User selects "Strategic Forecast Baseline"

3. Phase 1: Data Loading
   └─▶ loadCedarOwlForecast('2026')
       └─▶ CedarOwlForecast object
           ├── countryAdjustments (195 countries)
           ├── geopoliticalEvents (6 events)
           ├── sectorMultipliers (15 sectors)
           ├── regionalPremiums (6 regions)
           ├── assetClassForecasts (6 classes)
           └── metadata

4. Phase 2: Forecast Application
   └─▶ applyForecastToPortfolio(exposures)
       ├── For each exposure:
       │   ├── Get country adjustment
       │   ├── Apply sector multiplier (if applicable)
       │   ├── Calculate adjusted CSI
       │   ├── Determine outlook
       │   ├── Determine risk trend
       │   ├── Link applicable events
       │   └── Calculate expected return
       │
       ├── Validate guardrails:
       │   ├── Guardrail 1: No new exposures
       │   ├── Guardrail 2: Additive deltas only
       │   ├── Guardrail 3: Existing exposure only
       │   ├── Guardrail 4: Expected path, not stress
       │   ├── Guardrail 5: No dense propagation
       │   └── Guardrail 6: Clear labeling
       │
       └─▶ ForecastApplicationResult
           ├── adjustedExposures (AdjustedExposure[])
           ├── validationResults (GuardrailResults)
           ├── errors (string[])
           ├── warnings (string[])
           └── metadata

5. Phase 2: CO-GRI Calculation
   └─▶ calculateCOGRI(exposures, { useForecast: true })
       └─▶ COGRIResult
           ├── score (number)
           ├── riskLevel (RiskLevel)
           ├── countryBreakdown (CountryRiskBreakdown[])
           └── forecastMetadata (ForecastMetadata)

6. Phase 3: Output Rendering
   └─▶ ForecastOutputRenderer
       ├── Tier 1: Strategic insights
       ├── Tier 2: Country details
       └── Tier 3: Technical data
```

### State Management

**Global State:**
- Mode selection (event-driven vs. forecast-baseline)
- Portfolio exposures
- Forecast data (loaded once, cached)

**Component State:**
- Tier expansion (ForecastOutputRenderer)
- Filters and sorting (ExposureMappingTier)
- Row expansion (ExposureMappingTier)
- Section expansion (QuantitativeAnchorsTier)
- Copy feedback (QuantitativeAnchorsTier)

**Derived State:**
- Adjusted exposures (calculated from forecast)
- CO-GRI result (calculated from exposures)
- Summary metrics (calculated from results)
- Filtered/sorted data (calculated from filters)

---

## Phase 1: Data Layer

### File Structure

```
src/
├── data/
│   └── cedarOwlForecast2026.ts       # Forecast data
├── types/
│   └── forecast.ts                    # Type definitions
└── utils/
    └── forecastDataAccess.ts          # Data access utilities
```

### Key Types

```typescript
// Country adjustment
interface CountryAdjustment {
  countryCode: string;
  delta: number;
  drivers: string[];
  outlook: Outlook;
  expectedReturn: number;
  riskTrend: RiskTrend;
}

// Geopolitical event
interface GeopoliticalEvent {
  id: string;
  name: string;
  description: string;
  timeline: string;
  probability: number;
  riskLevel: RiskLevel;
  affectedCountries: string[];
  sectorImpacts: Record<string, number>;
  baseImpactScore: number;
  investmentImpact: string;
}

// Complete forecast
interface CedarOwlForecast {
  metadata: ForecastMetadata;
  countryAdjustments: CountryAdjustment[];
  geopoliticalEvents: GeopoliticalEvent[];
  sectorMultipliers: Record<string, number>;
  regionalPremiums: Record<string, number>;
  assetClassForecasts: AssetClassForecast[];
}
```

### Data Access Functions

```typescript
// Load forecast data
loadCedarOwlForecast(year: string): CedarOwlForecast

// Get country adjustment
getCountryAdjustment(countryCode: string): CountryAdjustment | null

// Get top countries by expected return
getTopCountriesByReturn(count: number): CountryAdjustment[]

// Get countries with highest risk increase
getCountriesWithHighestRiskIncrease(count: number): CountryAdjustment[]

// Get countries with highest risk decrease
getCountriesWithHighestRiskDecrease(count: number): CountryAdjustment[]

// Get high probability events
getHighProbabilityEvents(threshold: number): GeopoliticalEvent[]

// Get forecast summary
getForecastSummary(): ForecastSummary
```

---

## Phase 2: Forecast Engine

### File Structure

```
src/
├── services/
│   └── forecastEngine.ts              # Core forecast logic
├── utils/
│   ├── guardrails.ts                  # Validation logic
│   └── cogriCalculator.ts             # CO-GRI calculation
└── components/
    └── ModeSelector.tsx               # Mode selection UI
```

### Core Functions

**applyForecastToPortfolio:**
```typescript
function applyForecastToPortfolio(
  exposures: Exposure[]
): ForecastApplicationResult {
  // 1. Load forecast data
  const forecast = loadCedarOwlForecast('2026');
  
  // 2. Apply to each exposure
  const adjustedExposures = exposures.map(exposure => {
    const adjustment = getCountryAdjustment(exposure.countryCode);
    const sectorMultiplier = getSectorMultiplier(exposure.sector);
    const delta = adjustment.delta * sectorMultiplier;
    const adjustedCsi = exposure.baseCsi + delta;
    
    return {
      ...exposure,
      adjustedCsi,
      delta,
      forecastDrivers: adjustment.drivers,
      outlook: adjustment.outlook,
      riskTrend: adjustment.riskTrend,
      expectedReturn: adjustment.expectedReturn,
      sectorMultiplier,
      applicableEvents: getApplicableEvents(exposure.countryCode)
    };
  });
  
  // 3. Validate guardrails
  const validationResults = validateGuardrails(exposures, adjustedExposures);
  
  // 4. Return result
  return {
    adjustedExposures,
    validationResults,
    errors: [],
    warnings: [],
    metadata: { ... }
  };
}
```

**calculateCOGRI:**
```typescript
function calculateCOGRI(
  exposures: Exposure[],
  options?: { useForecast?: boolean; forecastYear?: string }
): COGRIResult {
  // 1. Apply forecast if requested
  let adjustedExposures = exposures;
  let forecastMetadata = undefined;
  
  if (options?.useForecast) {
    const result = applyForecastToPortfolio(exposures);
    adjustedExposures = result.adjustedExposures;
    forecastMetadata = {
      applied: true,
      forecastYear: options.forecastYear,
      adjustedExposures: result.adjustedExposures.length,
      totalExposures: exposures.length,
      guardrailsValid: Object.values(result.validationResults).every(v => v)
    };
  }
  
  // 2. Calculate CO-GRI score
  const score = calculateScore(adjustedExposures);
  const riskLevel = determineRiskLevel(score);
  const countryBreakdown = calculateCountryBreakdown(adjustedExposures);
  
  // 3. Return result
  return {
    score,
    riskLevel,
    countryBreakdown,
    forecastMetadata
  };
}
```

### Guardrails Implementation

**Guardrail 1: No New Exposures**
```typescript
function validateNoNewExposure(
  original: Exposure[],
  adjusted: Exposure[]
): ValidationResult {
  const originalCodes = new Set(original.map(e => e.countryCode));
  const adjustedCodes = new Set(adjusted.map(e => e.countryCode));
  
  const newExposures = [...adjustedCodes].filter(code => !originalCodes.has(code));
  
  return {
    valid: newExposures.length === 0,
    errors: newExposures.length > 0 
      ? [`New exposures added: ${newExposures.join(', ')}`] 
      : [],
    warnings: []
  };
}
```

**Guardrail 2: Additive Deltas Only**
```typescript
function validateAdditiveDelta(
  originalCsi: number,
  delta: number,
  adjustedCsi: number
): ValidationResult {
  const expected = originalCsi + delta;
  const difference = Math.abs(adjustedCsi - expected);
  
  return {
    valid: difference < 0.01,
    errors: difference >= 0.01 
      ? [`Non-additive adjustment: ${adjustedCsi} ≠ ${expected}`] 
      : [],
    warnings: []
  };
}
```

---

## Phase 3: Output Components

### File Structure

```
src/
└── components/
    ├── ForecastOutputRenderer.tsx     # Main orchestrator
    ├── StrategicOutlookTier.tsx       # Tier 1
    ├── ExposureMappingTier.tsx        # Tier 2
    └── QuantitativeAnchorsTier.tsx    # Tier 3
```

### Component APIs

**ForecastOutputRenderer:**
```typescript
interface ForecastOutputRendererProps {
  result: COGRIResult;
  forecast: CedarOwlForecast;
  companyName: string;
  exposures: Exposure[];
  adjustedExposures: AdjustedExposure[];
}
```

**StrategicOutlookTier:**
```typescript
interface StrategicOutlookTierProps {
  result: COGRIResult;
  forecast: CedarOwlForecast;
  exposures: AdjustedExposure[];
  isExpanded: boolean;
  onToggle: () => void;
}
```

**ExposureMappingTier:**
```typescript
interface ExposureMappingTierProps {
  exposures: AdjustedExposure[];
  forecast: CedarOwlForecast;
  isExpanded: boolean;
  onToggle: () => void;
}
```

**QuantitativeAnchorsTier:**
```typescript
interface QuantitativeAnchorsTierProps {
  forecast: CedarOwlForecast;
  result: COGRIResult;
  isExpanded: boolean;
  onToggle: () => void;
}
```

### Performance Optimizations

**Memoization:**
```typescript
// In ExposureMappingTier
const filteredAndSortedExposures = React.useMemo(() => {
  let result = exposures;
  
  // Apply search filter
  if (searchTerm) {
    result = result.filter(e => 
      e.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply outlook filter
  if (outlookFilter !== 'all') {
    result = result.filter(e => e.outlook === outlookFilter);
  }
  
  // Apply sorting
  result = [...result].sort((a, b) => {
    // Sorting logic
  });
  
  return result;
}, [exposures, searchTerm, outlookFilter, sortField, sortDirection]);
```

**Pagination:**
```typescript
const paginatedExposures = React.useMemo(() => {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return filteredAndSortedExposures.slice(start, end);
}, [filteredAndSortedExposures, currentPage]);
```

---

## Integration Guide

### Adding to Existing CO-GRI Page

**Step 1: Import Components**
```typescript
import { ModeSelector } from '@/components/ModeSelector';
import { ForecastOutputRenderer } from '@/components/ForecastOutputRenderer';
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import { calculateCOGRI } from '@/utils/cogriCalculator';
import { applyForecastToPortfolio } from '@/services/forecastEngine';
```

**Step 2: Add State**
```typescript
const [selectedMode, setSelectedMode] = useState<'event-driven' | 'forecast-baseline'>('event-driven');
```

**Step 3: Calculate Results**
```typescript
// Load forecast data
const forecast = loadCedarOwlForecast('2026');

// Calculate CO-GRI with or without forecast
const cogriResult = calculateCOGRI(exposures, {
  useForecast: selectedMode === 'forecast-baseline',
  forecastYear: '2026'
});

// Get adjusted exposures if using forecast
const adjustedExposures = selectedMode === 'forecast-baseline'
  ? applyForecastToPortfolio(exposures).adjustedExposures
  : [];
```

**Step 4: Render UI**
```typescript
return (
  <div>
    <ModeSelector
      selectedMode={selectedMode}
      onModeChange={setSelectedMode}
    />
    
    {selectedMode === 'event-driven' ? (
      <StandardCOGRIOutput result={cogriResult} />
    ) : (
      <ForecastOutputRenderer
        result={cogriResult}
        forecast={forecast}
        companyName={companyName}
        exposures={exposures}
        adjustedExposures={adjustedExposures}
      />
    )}
  </div>
);
```

---

## Configuration

### Environment Variables

```bash
# Not currently used, but reserved for future
VITE_FORECAST_API_URL=https://api.cedarowl.com
VITE_FORECAST_API_KEY=your_api_key_here
```

### Build Configuration

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**vitest.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Deployment

### Build Process

```bash
# Install dependencies
pnpm install

# Run linter
pnpm run lint

# Run tests
pnpm test

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Production Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build completes successfully
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Cross-browser testing complete
- [ ] Documentation up to date

### Deployment Steps

1. **Build:** `pnpm run build`
2. **Test:** Verify dist/ folder
3. **Deploy:** Upload dist/ to hosting
4. **Verify:** Test in production environment
5. **Monitor:** Check for errors

---

## Maintenance

### Updating Forecast Data

**Quarterly Update Process:**

1. Receive new forecast data from CedarOwl
2. Update `src/data/cedarOwlForecast2026.ts`
3. Update metadata (publish date, version)
4. Run validation tests
5. Update documentation
6. Deploy new version

**Data Validation:**
```bash
pnpm test src/data/__tests__/cedarOwlForecast2026.test.ts
```

### Monitoring

**Key Metrics:**
- Page load time
- Forecast application time
- CO-GRI calculation time
- Error rate
- User engagement

**Logging:**
```typescript
// Add logging for key operations
console.log('Forecast applied:', {
  countries: adjustedExposures.length,
  guardrailsValid: validationResults,
  timestamp: new Date().toISOString()
});
```

### Troubleshooting

**Common Issues:**

1. **Forecast data not loading:**
   - Check file path
   - Verify import statement
   - Check browser console for errors

2. **Guardrail violations:**
   - Review validation logic
   - Check input data
   - Verify forecast data integrity

3. **Performance issues:**
   - Check portfolio size
   - Review memoization
   - Consider pagination

---

## API Reference

See `docs/API_REFERENCE.md` for complete function signatures and usage examples.

---

**Technical Documentation Version:** 1.0.0  
**Last Updated:** January 8, 2026  
**Maintainer:** Engineering Team

---

*End of Technical Documentation*