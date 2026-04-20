# GDP-Weighted Global CSI - File Structure

## Project Directory Structure

```
shadcn-ui/
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       ├── GlobalRiskIndex.tsx                    [ENHANCED] Main component with dual-metric display
│   │       ├── MetricComparisonChart.tsx              [NEW] Visual comparison of GDP vs Equal weighted
│   │       ├── TopContributorsPanel.tsx               [NEW] Top 5 countries driving global risk
│   │       ├── GDPWeightTooltip.tsx                   [NEW] Detailed country GDP information
│   │       ├── MetricSelector.tsx                     [NEW] Toggle between GDP/Equal weighted
│   │       ├── DataVintageIndicator.tsx               [NEW] Shows GDP data year and quality
│   │       ├── CountrySummaryPanel.tsx                [EXISTING] Unchanged
│   │       ├── GlobalRiskHeatmap.tsx                  [EXISTING] Unchanged
│   │       └── ...other existing components
│   │
│   ├── data/
│   │   ├── gdpData.ts                                 [NEW] Static 2023 PPP GDP data for all countries
│   │   ├── globalCountries.ts                         [EXISTING] Unchanged
│   │   ├── geopoliticalEvents.ts                      [EXISTING] Unchanged
│   │   └── historicalGeopoliticalEvents.ts            [EXISTING] Unchanged
│   │
│   ├── hooks/
│   │   ├── useGlobalCSI.ts                            [NEW] Custom hook for global CSI state
│   │   ├── useCompositeCSI.ts                         [EXISTING] Unchanged
│   │   ├── useRealTimeData.ts                         [EXISTING] Unchanged
│   │   └── useRefactoredCSI.ts                        [EXISTING] Unchanged
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── worldBankAPI.ts                        [NEW] World Bank API integration
│   │   │   ├── imfAPI.ts                              [NEW] IMF WEO API integration (fallback)
│   │   │   └── eventRoutes.ts                         [EXISTING] Unchanged
│   │   │
│   │   └── csi/
│   │       ├── compositeCalculator.ts                 [ENHANCED] Add GDP-weighted methods
│   │       ├── gdpWeightedCalculator.ts               [NEW] Core GDP-weighted calculation logic
│   │       ├── gdpDataService.ts                      [NEW] GDP data fetching, caching, fallbacks
│   │       ├── csiCache.ts                            [ENHANCED] Add GDP result caching
│   │       ├── csiWorkerService.ts                    [ENHANCED] Add GDP calculation to worker
│   │       ├── baselineManager.ts                     [EXISTING] Unchanged
│   │       ├── eventStore.ts                          [EXISTING] Unchanged
│   │       └── ...other existing services
│   │
│   ├── store/
│   │   ├── globalCSIStore.ts                          [NEW] Zustand store for global CSI state
│   │   └── ...other stores (if any)
│   │
│   ├── types/
│   │   ├── csi.types.ts                               [ENHANCED] Add GlobalCSIResult, TopContributor, etc.
│   │   ├── gdp.types.ts                               [NEW] GDP data types and interfaces
│   │   └── ...other existing types
│   │
│   ├── utils/
│   │   ├── gdpCalculations.ts                         [NEW] Helper functions for GDP calculations
│   │   ├── cacheManager.ts                            [ENHANCED] Add GDP cache management
│   │   ├── formatters.ts                              [ENHANCED] Add GDP formatting utilities
│   │   └── ...other existing utils
│   │
│   ├── workers/
│   │   ├── csiCalculationWorker.ts                    [ENHANCED] Add GDP-weighted calculations
│   │   └── gdpCalculationWorker.ts                    [NEW] Dedicated worker for heavy GDP calcs
│   │
│   └── scripts/
│       ├── updateGDPData.ts                           [NEW] Automated script to fetch and update GDP data
│       ├── validateGDPData.ts                         [NEW] Validation script for GDP data quality
│       └── generateGDPReport.ts                       [NEW] Generate GDP data coverage report
│
├── public/
│   └── ...existing public files
│
├── docs/
│   ├── system_design.md                               [NEW] This system design document
│   ├── gdp_weighted_global_csi_research_report.md     [EXISTING] Emma's research report
│   └── ...other documentation
│
├── architect.plantuml                                  [NEW] System architecture diagram
├── class_diagram.plantuml                              [NEW] Class diagram
├── sequence_diagram.plantuml                           [NEW] Sequence diagrams
├── package.json                                        [EXISTING] No new dependencies
├── tsconfig.json                                       [EXISTING] Unchanged
└── README.md                                           [ENHANCED] Add GDP-weighted feature documentation
```

## File Descriptions

### New Files

#### Components

**`MetricComparisonChart.tsx`**
- Visual comparison of GDP-weighted vs Equal-weighted CSI
- Dual horizontal bars with delta indicator
- Responsive design for mobile/tablet/desktop
- Dependencies: Recharts, Tailwind CSS

**`TopContributorsPanel.tsx`**
- Displays top 5 countries by weighted contribution
- Expandable to show all countries
- Country cards with GDP weight badges and contribution bars
- Dependencies: Lucide icons, Tailwind CSS

**`GDPWeightTooltip.tsx`**
- Detailed tooltip showing country GDP information
- Displays PPP GDP, global share, CSI, and contribution
- Triggered on hover over country names
- Dependencies: Radix UI Tooltip, Tailwind CSS

**`MetricSelector.tsx`**
- Toggle button to switch between GDP-weighted and Equal-weighted
- Active state styling
- Keyboard accessible
- Dependencies: Radix UI Toggle, Tailwind CSS

**`DataVintageIndicator.tsx`**
- Shows GDP data year and last update date
- Data quality indicator (High/Medium/Low)
- Warning badge if data is stale (>18 months)
- Dependencies: Lucide icons, Tailwind CSS

#### Data

**`gdpData.ts`**
- Static 2023 PPP GDP data for all 195 countries
- Exported constants: `GDP_DATA_2023`, `COUNTRY_ISO3_MAP`
- Helper functions: `getGDPWeight()`, `getGDPWeightMap()`
- Size: ~50KB (compressed)

#### Services

**`gdpWeightedCalculator.ts`**
- Core GDP-weighted calculation logic
- Methods:
  - `calculateGDPWeightedGlobalCSI()`
  - `calculateGDPWeightedTimeSeries()`
  - `getTopContributors()`
  - `compareMetrics()`
- Dependencies: compositeCalculator, gdpDataService

**`gdpDataService.ts`**
- GDP data fetching, caching, and fallback management
- Methods:
  - `fetchGDPData()`
  - `getGDPWeights()`
  - `refreshGDPData()`
  - `applyFallbackStrategy()`
- Dependencies: worldBankAPI, imfAPI, IndexedDB

**`worldBankAPI.ts`**
- World Bank API integration
- Endpoint: `/v2/country/{codes}/indicator/NY.GDP.MKTP.PP.CD`
- Response parsing and error handling
- Dependencies: native fetch

**`imfAPI.ts`**
- IMF WEO API integration (fallback)
- SDMX format parsing
- Dependencies: native fetch

#### State Management

**`globalCSIStore.ts`**
- Zustand store for global CSI state
- State: currentResult, selectedMetric, gdpDataset, etc.
- Actions: setSelectedMetric, loadGDPData, calculateGlobalCSI, etc.
- Dependencies: Zustand, gdpWeightedCalculator

#### Hooks

**`useGlobalCSI.ts`**
- Custom hook for accessing global CSI state
- Provides: currentResult, loading states, actions
- Memoized selectors for performance
- Dependencies: globalCSIStore

#### Types

**`gdp.types.ts`**
- Type definitions for GDP data structures
- Interfaces: CountryGDPData, GlobalGDPDataset, GDPWeightMap, etc.
- Enums: DataSource, Confidence
- Dependencies: None (pure types)

#### Utils

**`gdpCalculations.ts`**
- Helper functions for GDP calculations
- Functions: `calculateWeight()`, `normalizeWeights()`, `interpolateGDP()`
- Dependencies: None

#### Workers

**`gdpCalculationWorker.ts`**
- Dedicated Web Worker for heavy GDP calculations
- Handles time series calculations (100+ data points)
- Message types: CALCULATE_TIME_SERIES, CALCULATE_STATISTICS
- Dependencies: compositeCalculator (bundled)

#### Scripts

**`updateGDPData.ts`**
- Automated script to fetch latest GDP data from World Bank
- Formats data to TypeScript file
- Validates data quality and coverage
- Usage: `npm run update-gdp-data`

**`validateGDPData.ts`**
- Validates GDP data quality
- Checks for missing countries, outliers, data consistency
- Generates validation report
- Usage: `npm run validate-gdp-data`

**`generateGDPReport.ts`**
- Generates comprehensive GDP data coverage report
- Outputs: coverage percentage, missing countries, data sources
- Usage: `npm run generate-gdp-report`

### Enhanced Files

#### Components

**`GlobalRiskIndex.tsx`**
- Add metric selector toggle
- Add comparison section
- Add top contributors panel
- Add data vintage indicator
- Integrate with globalCSIStore
- Estimated changes: +200 lines

#### Services

**`compositeCalculator.ts`**
- Add `calculateGDPWeightedGlobalCSI()` method
- Add `calculateDualMetricGlobalCSI()` method
- Integrate with gdpWeightedCalculator
- Estimated changes: +50 lines

**`csiCache.ts`**
- Add GDP result caching methods
- Add cache expiry for GDP weights (90 days)
- Add cache expiry for results (24 hours)
- Estimated changes: +30 lines

**`csiWorkerService.ts`**
- Add GDP-weighted calculation message types
- Add time series calculation support
- Estimated changes: +40 lines

#### Workers

**`csiCalculationWorker.ts`**
- Add GDP-weighted calculation handlers
- Add time series calculation logic
- Estimated changes: +60 lines

#### Types

**`csi.types.ts`**
- Add GlobalCSIResult interface
- Add TopContributor interface
- Add MetricType type
- Add MetricComparison interface
- Estimated changes: +80 lines

#### Utils

**`cacheManager.ts`**
- Add GDP cache management methods
- Add cache invalidation logic
- Estimated changes: +40 lines

**`formatters.ts`**
- Add GDP formatting functions
- Add percentage formatting
- Add large number formatting (trillions)
- Estimated changes: +30 lines

#### Documentation

**`README.md`**
- Add GDP-weighted feature section
- Add usage examples
- Add API documentation links
- Estimated changes: +50 lines

## File Size Estimates

| File | Type | Size (KB) | Lines |
|------|------|-----------|-------|
| gdpData.ts | Data | 50 | 250 |
| gdpWeightedCalculator.ts | Service | 15 | 400 |
| gdpDataService.ts | Service | 12 | 350 |
| globalCSIStore.ts | Store | 8 | 200 |
| MetricComparisonChart.tsx | Component | 6 | 150 |
| TopContributorsPanel.tsx | Component | 8 | 200 |
| GDPWeightTooltip.tsx | Component | 4 | 100 |
| MetricSelector.tsx | Component | 3 | 80 |
| worldBankAPI.ts | API | 5 | 120 |
| gdp.types.ts | Types | 3 | 100 |
| **Total New Code** | - | **114** | **2,950** |

## Dependencies

### No New NPM Dependencies Required

All functionality can be implemented using existing dependencies:
- React 18.x (already installed)
- TypeScript 5.x (already installed)
- Zustand (already installed)
- Recharts (already installed)
- Tailwind CSS (already installed)
- Radix UI components (already installed)
- Lucide icons (already installed)

### Optional Dependencies (for future enhancements)

- `date-fns` - For advanced date calculations (if not already present)
- `zod` - For runtime type validation of API responses

## Build Configuration

No changes required to:
- `package.json` (no new dependencies)
- `tsconfig.json` (existing config supports all features)
- `vite.config.ts` (existing config supports workers)
- `tailwind.config.js` (existing config sufficient)

## Development Workflow

1. **Phase 1: Data Layer**
   - Create `gdpData.ts` with static 2023 data
   - Implement `gdpDataService.ts`
   - Add `worldBankAPI.ts` integration
   - Write tests

2. **Phase 2: Calculation Engine**
   - Implement `gdpWeightedCalculator.ts`
   - Enhance `compositeCalculator.ts`
   - Add worker support
   - Write tests

3. **Phase 3: State Management**
   - Create `globalCSIStore.ts`
   - Implement `useGlobalCSI.ts` hook
   - Write tests

4. **Phase 4: UI Components**
   - Enhance `GlobalRiskIndex.tsx`
   - Create new components
   - Implement responsive design
   - Write tests

5. **Phase 5: Integration**
   - Connect all layers
   - End-to-end testing
   - Performance optimization

## Testing Strategy

### Unit Tests

- `gdpDataService.test.ts` - Test data fetching and fallbacks
- `gdpWeightedCalculator.test.ts` - Test calculation accuracy
- `globalCSIStore.test.ts` - Test state management
- `gdpCalculations.test.ts` - Test utility functions

### Integration Tests

- `gdpWeightedFlow.test.ts` - Test complete GDP-weighted flow
- `metricComparison.test.ts` - Test dual-metric comparison
- `caching.test.ts` - Test cache behavior

### E2E Tests

- `globalRiskIndex.e2e.ts` - Test UI interactions
- `metricToggle.e2e.ts` - Test metric switching
- `dataLoading.e2e.ts` - Test data loading and error states

## Deployment Checklist

- [ ] All new files created
- [ ] All enhanced files updated
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance benchmarks met (<100ms calculation)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Staging deployment successful
- [ ] Production deployment ready

---

**Total New Files**: 19  
**Total Enhanced Files**: 10  
**Total New Lines of Code**: ~2,950  
**Estimated Implementation Time**: 16-20 days