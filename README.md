# CO-GRI Platform - Company Mode

A comprehensive geopolitical risk analysis platform for company-level risk assessment.

## Architecture Overview

### Technology Stack

- **Frontend Framework**: React 19.2.4 with TypeScript 5.3.3
- **State Management**: Zustand 5.0.11 with persistence
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Charts**: Recharts 3.7.0
- **Maps**: react-simple-maps 3.0.0 with D3 7.9.0
- **Testing**: Vitest 1.6.0
- **Build Tool**: Vite 5.x

### Project Structure

```
src/
├── components/
│   ├── common/           # Shared components (LensBadge, RiskLevelBadge)
│   └── company/          # 9 core Company Mode components (C1-C9)
├── pages/
│   └── CompanyModePage.tsx  # Main integrated layout
├── store/
│   └── globalState.ts    # Zustand global state management
├── services/
│   └── cogriCalculationService.ts  # CO-GRI calculation pipeline
├── utils/
│   ├── riskCalculations.ts        # Risk metrics (HHI, etc.)
│   ├── channelCalculations.ts     # Four-channel attribution
│   ├── riskRelevance.ts           # Forecast event filtering
│   ├── peerComparison.ts          # Peer analysis
│   ├── attributionCalculations.ts # Risk attribution
│   ├── timelineEvents.ts          # Event management
│   └── verificationData.ts        # Calculation verification
└── tests/
    ├── unit/             # 76 unit tests
    └── integration/      # Integration tests
```

## Component Architecture (C1-C9)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Top Bar Navigation                        │
├───────────────┬─────────────────────────┬───────────────────┤
│   Left 25%    │      Center 50%         │    Right 25%      │
│               │                         │                   │
│  C5: Top      │  C3: Risk Contribution  │  C1: Company      │
│  Relevant     │      Map                │      Summary      │
│  Risks        │                         │      Panel        │
│               ├─────────────────────────┤                   │
│  C4: Exposure │  C2: CO-GRI Trend       │  C6: Peer         │
│  Pathways     │      Chart              │      Comparison   │
│               │                         │                   │
├───────────────┴─────────────────────────┴───────────────────┤
│                   Bottom Row (Full Width)                    │
│  C7: Risk Attribution (full width)                           │
│  OR                                                          │
│  C8: Timeline Feed (40%) + C9: Verification (60%)           │
└──────────────────────────────────────────────────────────────┘
```

### Core Components

1. **C1: Company Summary Panel** - Overview card with CO-GRI score, risk level, key metrics
2. **C2: CO-GRI Trend Chart** - Time series visualization with risk bands
3. **C3: Risk Contribution Map** - Interactive world map with country risk visualization
4. **C4: Exposure Pathways** - Four-channel breakdown (Revenue, Supply Chain, Assets, Financial)
5. **C5: Top Relevant Risks** - Most material geopolitical risks (structural/forecast)
6. **C6: Peer Comparison** - Sortable peer table with sector benchmarking
7. **C7: Risk Attribution** - Detailed country-level risk contribution analysis
8. **C8: Timeline Event Feed** - Chronological geopolitical events with filtering
9. **C9: Verification Drawer** - Calculation transparency and sensitivity analysis

### Cross-Component Interactions

#### C3-C8 Interactive Integration

The Risk Contribution Map (C3) and Timeline Event Feed (C8) are interconnected:

1. **Event → Map Highlighting**
   - Clicking an event in C8 highlights affected countries on C3 map
   - Visual feedback with blue border on selected event
   - "Clear Highlights" button to reset

2. **Map → Timeline Filtering**
   - Clicking a country on C3 map filters C8 timeline to related events
   - Shows most recent event affecting that country

3. **State Management**
   ```typescript
   // Global state tracks interaction
   highlightedCountries: string[]
   selectedEvent: TimelineEvent | null
   ```

## CO-GRI Calculation Pipeline

### 7-Step Calculation Process

1. **Geographic Exposure Normalization** - Ensure exposures sum to 100%
2. **Four-Channel Attribution** - Blend Revenue, Supply Chain, Assets, Financial
3. **Country Shock Index Assignment** - Assign baseline geopolitical risk scores
4. **Political Alignment Modifier** - Adjust based on US-country relationships
5. **Country Risk Contribution** - Calculate weighted risk per country
6. **Raw Score Aggregation** - Sum all country contributions
7. **Sector Risk Adjustment** - Apply sector-specific multiplier

### Key Formulas

```
W_blended = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial
AdjS_c = S_c × (1 + λ × (1 - A_c))
Risk_c = W_norm_c × AdjS_c
CO-GRI = RawScore × M_sector
```

### Channel Weights (Standard)

- Revenue: 35%
- Supply Chain: 30%
- Physical Assets: 20%
- Financial: 15%

## State Management

### Global State (Zustand)

```typescript
interface GlobalState {
  // Lens and Time Window
  active_lens: 'Structural' | 'Forecast Overlay' | 'Scenario Shock' | 'Trading Signal'
  time_window: '1M' | '3M' | '6M' | '1Y' | '2Y' | 'All'
  
  // C3-C8 Interactive State
  highlightedCountries: string[]
  selectedEvent: TimelineEvent | null
  
  // Bottom Row Layout
  bottomRowView: 'attribution' | 'timeline'
  
  // User Preferences (persisted to localStorage)
  preferences: {
    defaultLens: LensType
    defaultTimeWindow: TimeWindow
    defaultBottomRowView: BottomRowView
  }
}
```

## Performance Optimizations

1. **React.memo** - All 9 components wrapped for shallow prop comparison
2. **useMemo** - Expensive calculations (CO-GRI pipeline, risk attribution)
3. **useCallback** - Event handlers to prevent unnecessary re-renders
4. **Lazy Loading** - Bottom row components loaded on demand
5. **Error Boundaries** - Graceful error handling per component section

## Testing

### Test Coverage

- **Unit Tests**: 76 tests across 4 weeks
  - Week 1 (Pipeline): 21 tests
  - Week 2 (Core Components): 15 tests
  - Week 3 (Supporting Components): 20 tests
  - Week 4 (Bottom Row): 20 tests
- **Integration Tests**: C3-C8 interaction, state management, lens switching
- **Coverage**: >85% for core calculation logic

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/tests/unit/week1Pipeline.test.ts

# Run with coverage
pnpm test --coverage

# Run integration tests
pnpm test src/tests/integration/
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint
```

### Adding New Components

1. Create component in `src/components/company/`
2. Add utility functions in `src/utils/`
3. Write unit tests in `src/tests/unit/`
4. Update `src/components/company/index.ts` with React.memo wrapper
5. Integrate into `CompanyModePage.tsx`

### Code Style

- TypeScript strict mode enabled
- ESLint with max 0 warnings
- Prettier for code formatting
- Tailwind CSS for styling

## Key Features

### Lens System

Four analytical perspectives:

1. **Structural** - Current state risk analysis
2. **Forecast Overlay** - 6-12 month forward-looking projections
3. **Scenario Shock** - Custom scenario modeling
4. **Trading Signal** - Investment decision support

### Time Windows

- 1M, 3M, 6M, 1Y, 2Y, All
- Synchronized across all time-series components
- Persisted to user preferences

### Export Functionality

- Timeline events: CSV export
- Verification report: TXT export
- Future: PDF reports, Excel data exports

## Critical Implementation Notes

### Forecast Guardrails

- Forecast baseline NEVER redistributes exposures
- Forecast baseline NEVER creates new exposures
- Only apply forecast delta if company has existing exposure in affected countries
- DO NOT change exposure weights in forecast mode

### Risk Attribution

- Shows "risk contribution share, NOT exposure share"
- Risk contribution = Exposure × Country Shock × Alignment Modifier
- Color scheme consistent with C3 Risk Contribution Map

### Relevance Filtering (C5)

- Exposure in affected countries > 5%
- |Expected ΔCO-GRI| > 2
- Probability > 0.3 (30%)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: Responsive design with breakpoints at 1024px, 1440px, 1920px

## License

Proprietary - CO-GRI Platform

## Contact

For questions or support, contact the development team.