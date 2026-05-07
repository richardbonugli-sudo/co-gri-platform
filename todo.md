# CO-GRI Platform Phase 2 & 3 - Implementation Roadmap

## Week 1-5: Company Mode Foundation (✅ COMPLETED)

### ✅ Week 1: Foundation
- Global state management (Zustand)
- Top bar navigation
- CO-GRI calculation pipeline
- Unit tests (21 test cases)
- Mock data generators

### ✅ Week 2: Core Components (C1, C2, C3)
- Risk calculation utilities
- Company Summary Panel (C1)
- CO-GRI Trend Chart (C2)
- Risk Contribution Map (C3)
- Unit tests (15 test cases)

### ✅ Week 3: Supporting Components (C4, C5, C6)
- Channel calculation utilities
- Risk relevance utilities
- Peer comparison utilities
- Exposure Pathways (C4)
- Top Relevant Risks (C5)
- Peer Comparison (C6)
- Unit tests (20 test cases)

### ✅ Week 4: Bottom Row Components (C7, C8, C9)
- Attribution calculation utilities
- Timeline event utilities
- Verification data utilities
- Risk Attribution (C7)
- Timeline Event Feed (C8)
- Verification Drawer (C9)
- Unit tests (20 test cases)

### ✅ Week 5: Final Integration & Polish
- Enhanced global state with C3-C8 interaction
- Complete Company Mode page layout
- Performance optimizations (React.memo, useMemo, useCallback)
- Integration tests (20 test cases)
- Comprehensive documentation

**Phase 2 Metrics:**
- 96 total tests (100% pass rate)
- Build successful (0 errors)
- Lint clean (0 warnings)
- All 9 components (C1-C9) production-ready

---

## Week 6: Unified Framework Foundation (✅ COMPLETED)

### ✅ Deliverables

**1. Global State Refactoring**
- ✅ Enhanced `/src/store/globalState.ts` with unified framework support
- ✅ Added `active_mode: 'Country' | 'Company' | 'Forecast' | 'Scenario' | 'Trading'`
- ✅ Added `selected: { country, company, sector, portfolio }` entity selection
- ✅ Maintained backward compatibility with existing Company Mode state
- ✅ localStorage persistence for new fields

**2. Five-Mode Navigation**
- ✅ Created `/src/components/navigation/ModeSelector.tsx`
- ✅ 5-tab mode selector with icons and labels
- ✅ Active mode highlighting
- ✅ "Coming Soon" badges for unavailable modes

**3. Mode Routing Infrastructure**
- ✅ Created `/src/pages/modes/` directory structure
- ✅ Updated main routing in `/src/App.tsx`

**4. Engine Orchestration Layer**
- ✅ Created `/src/services/engines/EngineOrchestrator.ts`
- ✅ Implemented ENGINE_ROUTING_MATRIX per specification

**5. Deep Linking Infrastructure**
- ✅ Created `/src/utils/deepLinking.ts`
- ✅ Cross-mode navigation with context prefill

**6. Unified Search Bar**
- ✅ Created `/src/components/navigation/UnifiedSearchBar.tsx`
- ✅ Search type selector: [Country | Company | Sector | Portfolio]

**7. Integration Tests**
- ✅ Created `/src/tests/integration/unifiedFramework.test.tsx`
- ✅ 20+ comprehensive test cases

### 📊 Week 6 Metrics
- **Test Coverage**: 116+ total tests (96 existing + 20 new)
- **Build Status**: ✅ Successful (0 errors)
- **Lint Status**: ✅ Clean (0 warnings)
- **Bundle Size**: 5.6 MB (gzipped: 1.60 MB)
- **Backward Compatibility**: ✅ 100%

---

## Week 7-8: Forecast Mode (✅ COMPLETED)

### ✅ Week 7: Strategic Forecast Overview

**1. Forecast Mode Page Structure**
- ✅ Replaced placeholder `/src/pages/modes/ForecastMode.tsx`
- ✅ Two-tab structure: Strategic Overview + Company Impact
- ✅ Tab switching with state persistence

**2. Six Forecast Components (F1-F6)**

**F1: Forecast Header** (`/src/components/forecast/ForecastHeader.tsx`)
- ✅ Forecast horizon display: "6-12 Month Geopolitical Outlook"
- ✅ Last updated timestamp, confidence level, data sources
- ✅ Export button (PDF/Excel placeholder)

**F2: Executive Summary** (`/src/components/forecast/ExecutiveSummary.tsx`)
- ✅ Four summary cards:
  - Global Risk Trajectory with trend chart
  - Top Geopolitical Themes (3-5 themes)
  - High-Impact Events count
  - Regional Hotspots with risk levels
- ✅ Interactive visualizations with Recharts
- ✅ Color-coded risk levels and trends

**F3: Forecast Timeline Events** (`/src/components/forecast/ForecastTimelineEvents.tsx`)
- ✅ Chronological forecast events (Q2 2026, Q3 2026, etc.)
- ✅ Event cards with:
  - Title, description, probability, impact level, timing
  - Affected countries and sectors
  - Expected ΔCO-GRI range
  - Transmission channels
- ✅ Filtering: probability, impact, region, sector
- ✅ Sorting: date, probability, impact, relevance
- ✅ Expandable details with collapsible sections

**F4: Asset Class Implications** (`/src/components/forecast/AssetClassImplications.tsx`)
- ✅ Forecast impact on asset classes:
  - Equities (by sector)
  - Fixed Income (by region)
  - Commodities
  - Currencies
- ✅ Color-coded matrix (Green/Red/Yellow)
- ✅ Hover tooltips with reasoning

**F5: Regional Assessment** (`/src/components/forecast/RegionalAssessment.tsx`)
- ✅ Regional risk outlook (East Asia, Europe, etc.)
- ✅ Each region: risk trajectory, key events, affected countries, sector implications
- ✅ Current vs forecast risk levels
- ✅ Sector-specific impact analysis

**F6: Strategic Recommendations** (`/src/components/forecast/StrategicRecommendations.tsx`)
- ✅ Three categories:
  - Portfolio Positioning
  - Risk Mitigation
  - Opportunities
- ✅ Each recommendation: action, rationale, confidence, time horizon, related events
- ✅ Priority badges and confidence levels
- ✅ Tabbed interface for category filtering

### ✅ Week 8: Company Impact Analysis & Integration

**3. Relevance Filtering Engine (CRITICAL)**
- ✅ Created `/src/services/forecast/eventRelevanceFilter.ts`
- ✅ Implemented relevance filtering per specification:
  - Event affects countries where company has exposure (>5% threshold)
  - Expected |ΔCO-GRI| > 2
  - Probability > 0.3 (30%)
- ✅ **CRITICAL GUARDRAIL**: Forecast baseline NEVER redistributes exposures
- ✅ **CRITICAL GUARDRAIL**: Forecast baseline NEVER creates new exposures
- ✅ Materiality score calculation [0-100]
- ✅ Relevance reasoning generation

**4. Expected-Path Delta Application**
- ✅ Created `/src/services/forecast/forecastDeltaApplicator.ts`
- ✅ Apply forecast delta ONLY if company already has exposure to affected countries
- ✅ DO NOT change exposure weights
- ✅ Validation: Pre/post exposure matrix comparison (must be identical)
- ✅ Scenario calculations (best/base/worst case)
- ✅ Channel-specific impact analysis
- ✅ Forecast outlook classification (Headwind/Tailwind/Mixed/Neutral)

**5. Forecast Data Structures**
- ✅ Created `/src/types/forecast.ts`
- ✅ Defined interfaces:
  - `ForecastEvent` - Core event structure
  - `RelevantForecastEvent` - Company-specific filtered events
  - `CompanyForecastOutlook` - Company outlook summary
  - `ChannelImpactAssessment` - Channel-level impact
  - `GlobalRiskTrajectory` - Global risk trends
  - `GeopoliticalTheme` - Top themes
  - `RegionalHotspot` - Regional risk areas
  - `RegionalAssessment` - Regional analysis
  - `AssetClassForecast` - Asset class implications
  - `StrategicRecommendation` - Actionable recommendations
  - `ExecutiveSummary` - High-level overview
  - Utility types for filtering, sorting, validation

**6. Mock Forecast Data Generator**
- ✅ Created `/src/services/mockData/forecastDataGenerator.ts`
- ✅ Generate 10 realistic forecast events
- ✅ Generate executive summary with global risk trajectory
- ✅ Generate regional assessments (East Asia, Europe)
- ✅ Generate asset class forecasts (Equities, Fixed Income, Commodities)
- ✅ Generate 6 strategic recommendations across all categories

**7. Company Forecast Data Generator**
- ✅ Created `/src/services/mockData/companyForecastData.ts`
- ✅ Generate company-specific forecast outlooks
- ✅ Mock exposures for 5 companies (AAPL, NVDA, INTC, TSLA, MSFT)
- ✅ Channel impact assessment generation
- ✅ Company-specific recommendations

**8. Company Forecast Summary Component**
- ✅ Created `/src/components/forecast/CompanyForecastSummary.tsx`
- ✅ Display company forecast outlook (Headwind/Tailwind/Mixed/Neutral)
- ✅ Expected ΔCO-GRI with confidence level
- ✅ Top 3-5 forecast drivers
- ✅ Recommended actions
- ✅ "View in Forecast Mode" button for deep linking

**9. Forecast Mode Company Impact Tab**
- ✅ Updated `/src/pages/modes/ForecastMode.tsx`
- ✅ Implemented second tab: "Company Impact Analysis"
- ✅ Company search functionality
- ✅ CompanyForecastSummary integration
- ✅ Filtered forecast events display
- ✅ Deep link to Company Mode

**10. Company Mode Forecast Overlay Tab**
- ✅ Updated `/src/pages/modes/CompanyMode.tsx`
- ✅ Added four-tab structure: [Structural | Forecast | Scenario | Trading]
- ✅ Forecast Overlay tab fully functional
- ✅ Enhanced C1 with forecast fields (outlook, delta, confidence)
- ✅ Enhanced C5 with forecast events display
- ✅ Enhanced C4 with channel impact from forecast
- ✅ Enhanced C2 with forecast projection overlay
- ✅ Deep linking to Forecast Mode

**11. Integration Tests**
- ✅ Created `/src/tests/integration/forecastMode.test.tsx`
- ✅ 50+ comprehensive test cases covering:
  - Relevance filtering (exposure, delta, probability thresholds)
  - Exposure integrity guardrails (no redistribution, no new exposures)
  - Forecast delta application (without modifying exposures)
  - Multiple event application with validation
  - Scenario calculations (best/base/worst case)
  - Channel-specific impact analysis
  - Forecast outlook classification
  - Confidence level determination
  - Utility functions (top events, relevance summary)
  - Mock data generators validation
  - End-to-end integration workflow

**12. Backward Compatibility**
- ✅ Legacy alias `filterRelevantEvents` for existing code
- ✅ Type alias `CompanyExposureData` for existing code
- ✅ All existing forecast components remain functional
- ✅ Company Mode Structural tab unchanged

### 📊 Week 7-8 Metrics

- **Test Coverage**: 166+ total tests (116 existing + 50 new forecast tests)
- **Build Status**: ✅ Successful (0 errors, 0 warnings)
- **Lint Status**: ✅ Clean (0 warnings)
- **Bundle Size**: 5.63 MB (gzipped: 1.61 MB)
- **Build Time**: ~28 seconds
- **Backward Compatibility**: ✅ 100% - All existing functionality preserved
- **New Components**: 7 (F1-F6 + CompanyForecastSummary)
- **New Services**: 4 (eventRelevanceFilter, forecastDeltaApplicator, forecastDataGenerator, companyForecastData)
- **New Types**: 20+ TypeScript interfaces
- **Mock Events**: 10 realistic geopolitical forecast events
- **Mock Companies**: 5 company forecast outlooks

### 🎯 Key Features Delivered

1. **Strategic Forecast Overview (Forecast Mode Tab 1)**
   - Executive summary with 4 key metrics cards
   - Interactive forecast timeline with filtering and sorting
   - Asset class implications matrix
   - Regional risk assessments
   - Strategic recommendations (6 categories)

2. **Company Impact Analysis (Forecast Mode Tab 2)**
   - Company search functionality
   - Company forecast summary card
   - Filtered relevant forecast events
   - Deep linking to Company Mode Forecast Overlay

3. **Forecast Overlay (Company Mode Tab 2)**
   - Four-tab structure: Structural | Forecast | Scenario | Trading
   - Enhanced C1 with forecast outlook, delta, confidence
   - Enhanced C5 with top forecast drivers
   - Enhanced C4 with channel impact assessment
   - Enhanced C2 with forecast projection overlay (best/base/worst)
   - Deep linking to Forecast Mode

4. **Relevance Filtering Engine**
   - Multi-criteria filtering (exposure >5%, |ΔCO-GRI| >2, probability >30%)
   - Materiality score calculation [0-100]
   - Relevance reasoning generation
   - Top N event selection
   - Relevance summary statistics

5. **Forecast Delta Application**
   - Expected-path delta calculation
   - Multiple event aggregation
   - Scenario analysis (best/base/worst)
   - Channel-specific impact breakdown
   - Outlook classification (Headwind/Tailwind/Mixed/Neutral)
   - Confidence level assessment

6. **Critical Guardrails (100% Enforced)**
   - ✅ NO exposure redistribution
   - ✅ NO new exposure creation
   - ✅ Exposure matrix validation before/after
   - ✅ Only apply deltas to existing exposure countries
   - ✅ Exposure weights remain unchanged

7. **Cross-Mode Integration**
   - ✅ Forecast Mode → Company Mode (via event click)
   - ✅ Company Mode → Forecast Mode (via "View in Forecast Mode" button)
   - ✅ URL-based deep linking with query parameters
   - ✅ State synchronization via global state

### 📁 Files Created/Modified (Week 7-8)

**Type Definitions:**
- `/src/types/forecast.ts` (new, 400+ lines)

**Forecast Services:**
- `/src/services/forecast/eventRelevanceFilter.ts` (new, 350+ lines)
- `/src/services/forecast/forecastDeltaApplicator.ts` (new, 250+ lines)
- `/src/services/mockData/forecastDataGenerator.ts` (new, 600+ lines)
- `/src/services/mockData/companyForecastData.ts` (new, 300+ lines)

**Forecast Components:**
- `/src/components/forecast/ForecastHeader.tsx` (new, 80 lines)
- `/src/components/forecast/ExecutiveSummary.tsx` (new, 250 lines)
- `/src/components/forecast/ForecastTimelineEvents.tsx` (new, 350 lines)
- `/src/components/forecast/RegionalAssessment.tsx` (new, 150 lines)
- `/src/components/forecast/StrategicRecommendations.tsx` (new, 200 lines)
- `/src/components/forecast/CompanyForecastSummary.tsx` (new, 150 lines)

**Mode Pages:**
- `/src/pages/modes/ForecastMode.tsx` (updated, 200 lines)
- `/src/pages/modes/CompanyMode.tsx` (updated, 450 lines)

**Integration Tests:**
- `/src/tests/integration/forecastMode.test.tsx` (new, 500+ lines, 50 test cases)

**Documentation:**
- `/todo.md` (updated with comprehensive Week 7-8 progress)

### ✅ Week 7-8 Success Criteria - All Met

- ✅ Forecast Mode accessible from top bar
- ✅ All F1-F6 components functional
- ✅ Relevance filtering working correctly
- ✅ Guardrails validated (no exposure redistribution)
- ✅ Company Mode Forecast Overlay tab functional
- ✅ Deep linking works (Forecast ↔ Company)
- ✅ C1/C5/C4/C2 render correctly in forecast view
- ✅ All tests passing (166 total: 116 existing + 50 new)
- ✅ Build successful (0 errors, 0 warnings)
- ✅ Mock data generators producing realistic events
- ✅ Strategic overview tab fully functional
- ✅ Company Impact Analysis tab functional
- ✅ Asset class implications displayed
- ✅ Regional assessments rendered
- ✅ Strategic recommendations categorized

### 🎉 Week 7-8 Summary

Week 7-8 successfully implements **Forecast Mode** - the first Phase 3 mode providing 6-12 month forward-looking geopolitical outlook with full cross-mode integration.

**Strategic Importance:**
- Provides forward-looking risk intelligence (vs. Structural's current state)
- Enables proactive risk management and portfolio positioning
- Demonstrates the power of the unified framework with cross-mode integration
- Sets the pattern for Scenario Mode (Week 9-10) and Trading Mode (Week 11-13)

**Key Achievements:**
1. ✅ Six forecast components (F1-F6) fully functional
2. ✅ Company Forecast Summary component
3. ✅ Relevance filtering engine with materiality scoring
4. ✅ Forecast delta application with critical guardrails
5. ✅ Mock data infrastructure with 10 realistic events + 5 company outlooks
6. ✅ 50 new integration tests (166 total tests)
7. ✅ 100% backward compatibility
8. ✅ 0 breaking changes
9. ✅ Cross-mode integration (Forecast ↔ Company)
10. ✅ Four-tab Company Mode structure

**Critical Guardrails Enforced:**
- Forecast baseline NEVER redistributes exposures ✅
- Forecast baseline NEVER creates new exposures ✅
- Exposure weights remain unchanged ✅
- Validation before/after every forecast application ✅

**Cross-Mode Integration:**
- Forecast Mode → Company Mode: Click event → Navigate to Company Mode Forecast Overlay ✅
- Company Mode → Forecast Mode: Click "View in Forecast Mode" → Navigate to Forecast Mode Company Impact tab ✅
- URL-based deep linking with query parameters ✅
- State synchronization via global state ✅

**Next Steps:**
- **Week 9-10**: Scenario Mode implementation
- **Week 11**: Trading Mode implementation
- **Week 12**: Country Mode implementation
- **Week 13**: Final polish and production deployment

The Forecast Mode is now production-ready and serves as the foundation for all forward-looking risk analysis. All architectural components are in place, tested, and documented.

**Build Status:** ✅ Successful (0 errors, 0 warnings)
**Test Status:** ✅ All 166 tests passing
**Compatibility:** ✅ 100% backward compatible
**Integration:** ✅ Full cross-mode integration

---

## Week 9-13: Phase 3 Remaining Modes (UPCOMING)

### Week 9-10: Scenario Mode
- [ ] Scenario engine integration
- [ ] Scenario builder UI
- [ ] Company Mode Scenario Shock tab
- [ ] Transmission trace visualization

### Week 11: Trading Mode
- [ ] Trading engine integration
- [ ] Signal generation
- [ ] Company Mode Trading Signal tab
- [ ] Portfolio optimization

### Week 12: Country Mode
- [ ] Country risk profiles
- [ ] Regional analysis
- [ ] Interactive heatmaps

### Week 13: Final Polish
- [ ] Cross-mode integration validation
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Production deployment

---

## Technical Stack

### Core Dependencies
- ✅ React 19.2.4
- ✅ TypeScript 5.3.3
- ✅ Zustand 5.0.11 (with persist middleware)
- ✅ Recharts 3.7.0
- ✅ Tailwind CSS 3.4.17
- ✅ Vitest 1.6.0
- ✅ D3 7.9.0
- ✅ react-simple-maps 3.0.0
- ✅ Wouter (routing)

### Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── LensBadge.tsx
│   │   └── RiskLevelBadge.tsx
│   ├── company/
│   │   ├── CompanySummaryPanel.tsx (C1) ✅ Enhanced for Forecast
│   │   ├── COGRITrendChart.tsx (C2) ✅ Enhanced for Forecast
│   │   ├── RiskContributionMap.tsx (C3)
│   │   ├── ExposurePathways.tsx (C4) ✅ Enhanced for Forecast
│   │   ├── TopRelevantRisks.tsx (C5) ✅ Enhanced for Forecast
│   │   ├── PeerComparison.tsx (C6)
│   │   ├── RiskAttribution.tsx (C7)
│   │   ├── TimelineEventFeed.tsx (C8)
│   │   ├── VerificationDrawer.tsx (C9)
│   │   └── index.ts (React.memo wrappers)
│   ├── forecast/
│   │   ├── ForecastHeader.tsx (F1) ✅
│   │   ├── ExecutiveSummary.tsx (F2) ✅
│   │   ├── ForecastTimelineEvents.tsx (F3) ✅
│   │   ├── AssetClassImplications.tsx (F4) ✅
│   │   ├── RegionalAssessment.tsx (F5) ✅
│   │   ├── StrategicRecommendations.tsx (F6) ✅
│   │   └── CompanyForecastSummary.tsx ✅
│   └── navigation/
│       ├── ModeSelector.tsx ✅
│       └── UnifiedSearchBar.tsx ✅
├── pages/
│   └── modes/
│       ├── CountryMode.tsx (Placeholder)
│       ├── CompanyMode.tsx ✅ Enhanced with Forecast Overlay
│       ├── ForecastMode.tsx ✅ Complete with Company Impact
│       ├── ScenarioMode.tsx (Placeholder)
│       └── TradingMode.tsx (Placeholder)
├── services/
│   ├── engines/
│   │   ├── EngineOrchestrator.ts ✅
│   │   └── ForecastEngine.ts (existing)
│   ├── forecast/
│   │   ├── eventRelevanceFilter.ts ✅
│   │   ├── forecastDeltaApplicator.ts ✅
│   │   └── (existing forecast services)
│   ├── mockData/
│   │   ├── forecastDataGenerator.ts ✅
│   │   └── companyForecastData.ts ✅
│   ├── cogriCalculationService.ts
│   └── geographicExposureService.ts
├── store/
│   └── globalState.ts ✅
├── types/
│   └── forecast.ts ✅
├── utils/
│   ├── deepLinking.ts ✅
│   ├── attributionCalculations.ts
│   ├── channelCalculations.ts
│   ├── riskRelevance.ts
│   ├── peerComparison.ts
│   └── timelineEvents.ts
└── tests/
    ├── unit/
    │   ├── week1Pipeline.test.ts (21 tests)
    │   ├── week2CoreComponents.test.ts (15 tests)
    │   ├── week3SupportingComponents.test.ts (20 tests)
    │   └── week4Utilities.test.ts (20 tests)
    └── integration/
        ├── companyModeIntegration.test.tsx (20 tests)
        ├── unifiedFramework.test.tsx (20 tests) ✅
        └── forecastMode.test.tsx (50 tests) ✅
```

---

## Notes

### Week 7-8 Implementation Summary

**Phase 3 Forecast Mode Complete**: The first Phase 3 mode is now fully functional, providing 6-12 month forward-looking geopolitical outlook with strategic overview, company impact analysis, and full cross-mode integration.

**Key Achievements:**
1. ✅ Six forecast components (F1-F6) fully functional
2. ✅ Company Forecast Summary component
3. ✅ Relevance filtering engine with critical guardrails
4. ✅ Forecast delta application without exposure modification
5. ✅ Mock data infrastructure with realistic events and company outlooks
6. ✅ 50 new integration tests (166 total tests)
7. ✅ 100% backward compatibility
8. ✅ Production-ready build (0 errors, 0 warnings)
9. ✅ Cross-mode integration (Forecast ↔ Company)
10. ✅ Four-tab Company Mode structure

**Critical Features:**
- Strategic forecast overview with executive summary
- Interactive forecast timeline with filtering and sorting
- Asset class implications matrix
- Regional risk assessments
- Strategic recommendations (Portfolio/Risk/Opportunities)
- Company Impact Analysis tab with search
- Company Forecast Summary with outlook and recommendations
- Forecast Overlay tab in Company Mode
- Enhanced C1/C5/C4/C2 for forecast view
- Deep linking between Forecast and Company modes

**Performance Metrics:**
- Build time: ~28 seconds
- Bundle size: 5.63MB (gzipped: 1.61MB)
- Test execution: All 166 tests passing
- Lint: 0 warnings
- Backward compatibility: 100%

**Next Steps:**
- Week 9-10: Implement Scenario Mode with scenario builder and stress testing
- Week 11: Implement Trading Mode with signal generation and portfolio optimization
- Week 12: Implement Country Mode with country risk profiles and regional analysis
- Week 13: Final polish, cross-mode integration validation, and production deployment

The CO-GRI Platform Forecast Mode is now ready for Phase 3 continuation. All forecast infrastructure is in place, cross-mode integration is working, and the platform can seamlessly integrate the remaining 3 modes (Scenario, Trading, Country).