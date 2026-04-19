# Phase 2: Mode Architecture
## Detailed Task Breakdown (Week 2)

**Duration:** January 20-24, 2026 (5 days)  
**Lead:** Full-Stack Engineer  
**Support:** UI/UX Designer (part-time)

---

## DAY 1: Monday, January 20 (Mode Selector UI)

### Task 2.1: Design Mode Selector Component (3 hours)
**Assignee:** UI/UX Designer + Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create Figma mockups for mode selector
- Design radio button UI with clear descriptions
- Define visual states (selected, hover, disabled)
- Review with Product Manager

**Deliverables:**
- Figma design file
- Design specifications document

**Acceptance Criteria:**
- Design approved by Product Manager
- Clear visual distinction between modes
- Responsive design specifications

---

### Task 2.2: Implement Mode Selector Component (4 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/components/ModeSelector.tsx`
- Implement radio button logic
- Add mode descriptions
- Implement state management
- Add mode change confirmation dialog

**Deliverables:**
- `src/components/ModeSelector.tsx` file
- Component tests

**Code Template:**
```typescript
// src/components/ModeSelector.tsx

import React, { useState } from 'react'

export type AnalysisMode = 'event' | 'forecast'

interface ModeSelectorProps {
  selectedMode: AnalysisMode
  onModeChange: (mode: AnalysisMode) => void
  hasUnsavedChanges?: boolean
}

export function ModeSelector({
  selectedMode,
  onModeChange,
  hasUnsavedChanges = false
}: ModeSelectorProps) {
  const handleModeChange = (newMode: AnalysisMode) => {
    if (hasUnsavedChanges && newMode !== selectedMode) {
      const confirmed = window.confirm(
        'Changing mode will clear your current inputs. Continue?'
      )
      if (!confirmed) return
    }
    onModeChange(newMode)
  }

  return (
    <div className="mode-selector">
      <h3>Select Analysis Mode:</h3>
      
      <label className={selectedMode === 'event' ? 'selected' : ''}>
        <input
          type="radio"
          name="mode"
          value="event"
          checked={selectedMode === 'event'}
          onChange={() => handleModeChange('event')}
        />
        <div>
          <strong>Event-Driven Scenario</strong>
          <p>
            Stress-test your company against hypothetical geopolitical events.
            You define the event parameters and severity.
          </p>
        </div>
      </label>

      <label className={selectedMode === 'forecast' ? 'selected' : ''}>
        <input
          type="radio"
          name="mode"
          value="forecast"
          checked={selectedMode === 'forecast'}
          onChange={() => handleModeChange('forecast')}
        />
        <div>
          <strong>CO-GRI Strategic Forecast Baseline (2026)</strong>
          <p>
            Assess your company against expert-driven geopolitical forecasts
            for 2026. System applies probability-weighted expected path.
          </p>
        </div>
      </label>
    </div>
  )
}
```

**Acceptance Criteria:**
- Component renders correctly
- Mode switching functional
- Confirmation dialog works
- Component tests passing

---

## DAY 2: Tuesday, January 21 (Forecast Engine - Part 1)

### Task 2.3: Create Forecast Engine Service (4 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/services/forecastEngine.ts`
- Implement core forecast application logic
- Implement country CSI adjustment logic
- Add probability weighting

**Deliverables:**
- `src/services/forecastEngine.ts` file
- Unit tests

**Code Template:**
```typescript
// src/services/forecastEngine.ts

import type { Company } from '../types/company'
import type { CedarOwlForecast, CountryAdjustment } from '../types/forecast'
import { loadCedarOwlForecast } from '../utils/forecastDataAccess'

export interface ForecastResult {
  baselineCOGRI: number
  forecastAdjustedCOGRI: number
  cogriDelta: number
  percentChange: number
  baselineCSI: Record<string, number>
  forecastAdjustedCSI: Record<string, number>
  channelDeltas: {
    revenue: number
    supplyChain: number
    physicalAssets: number
    financial: number
  }
  riskTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  primaryDrivers: string[]
}

export function applyCedarOwlForecast(
  company: Company,
  forecast: CedarOwlForecast
): ForecastResult {
  // Step 1: Calculate baseline CO-GRI (existing logic)
  const baselineCOGRI = calculateBaselineCOGRI(company)
  const baselineCSI = getBaselineCSI(company)

  // Step 2: Apply forecast adjustments to CSI
  const forecastAdjustedCSI = applyForecastAdjustments(
    company,
    baselineCSI,
    forecast
  )

  // Step 3: Calculate forecast-adjusted CO-GRI
  const forecastAdjustedCOGRI = calculateCOGRI(company, forecastAdjustedCSI)

  // Step 4: Calculate deltas
  const cogriDelta = forecastAdjustedCOGRI - baselineCOGRI
  const percentChange = (cogriDelta / baselineCOGRI) * 100

  // Step 5: Determine risk trend
  const riskTrend = determineRiskTrend(cogriDelta)

  // Step 6: Calculate channel-level deltas
  const channelDeltas = calculateChannelDeltas(
    company,
    baselineCSI,
    forecastAdjustedCSI
  )

  // Step 7: Identify primary drivers
  const primaryDrivers = identifyPrimaryDrivers(
    company,
    forecast,
    channelDeltas
  )

  return {
    baselineCOGRI,
    forecastAdjustedCOGRI,
    cogriDelta,
    percentChange,
    baselineCSI,
    forecastAdjustedCSI,
    channelDeltas,
    riskTrend,
    confidenceLevel: 'HIGH', // From forecast metadata
    primaryDrivers
  }
}

function applyForecastAdjustments(
  company: Company,
  baselineCSI: Record<string, number>,
  forecast: CedarOwlForecast
): Record<string, number> {
  const adjustedCSI: Record<string, number> = { ...baselineCSI }

  // GUARDRAIL 1: Apply forecast only to existing company exposures
  for (const [country, exposure] of Object.entries(company.exposure)) {
    if (exposure > 0) {
      const countryAdjustment = forecast.countryAdjustments[country]
      if (countryAdjustment) {
        // GUARDRAIL 2: Additive CSI deltas only
        const probabilityWeighted = 
          countryAdjustment.delta * forecast.metadata.overallConfidence
        
        adjustedCSI[country] = baselineCSI[country] + probabilityWeighted

        // Apply sector multiplier
        const sectorMultiplier = forecast.sectorMultipliers[company.sector] || 1.0
        adjustedCSI[country] *= sectorMultiplier

        // Apply regional premium
        const region = getRegionForCountry(country)
        const regionalPremium = forecast.regionalPremiums[region] || 1.0
        adjustedCSI[country] *= regionalPremium
      }
    }
  }

  return adjustedCSI
}

function determineRiskTrend(cogriDelta: number): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
  if (cogriDelta < -2) return 'IMPROVING'
  if (cogriDelta > 2) return 'DETERIORATING'
  return 'STABLE'
}
```

**Acceptance Criteria:**
- Core forecast logic implemented
- Guardrails enforced
- Unit tests passing
- Code coverage >90%

---

### Task 2.4: Implement Guardrail Enforcement (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/services/guardrails.ts`
- Implement all 6 guardrails:
  1. No new exposure inference
  2. Additive CSI deltas only
  3. Existing exposure only
  4. Expected path, not stress
  5. No dense propagation
  6. Clear labeling
- Add validation and error handling

**Deliverables:**
- `src/services/guardrails.ts` file
- Guardrail validation tests

**Code Template:**
```typescript
// src/services/guardrails.ts

import type { Company } from '../types/company'
import type { CedarOwlForecast } from '../types/forecast'

export function enforceGuardrails(
  company: Company,
  forecast: CedarOwlForecast,
  adjustedCSI: Record<string, number>
): void {
  // Guardrail 1: No new exposure inference
  enforceNoNewExposureInference(company, adjustedCSI)

  // Guardrail 2: Additive CSI deltas only
  enforceAdditiveCSIDeltas(company, adjustedCSI)

  // Guardrail 3: Existing exposure only
  enforceExistingExposureOnly(company, adjustedCSI)

  // Guardrail 4: Expected path, not stress
  enforceExpectedPath(forecast)

  // Guardrail 5: No dense propagation
  enforceNoDensePropagation(company, adjustedCSI)
}

function enforceNoNewExposureInference(
  company: Company,
  adjustedCSI: Record<string, number>
): void {
  // Verify no new countries added to exposure
  const originalCountries = new Set(Object.keys(company.exposure))
  const adjustedCountries = new Set(Object.keys(adjustedCSI))

  for (const country of adjustedCountries) {
    if (!originalCountries.has(country)) {
      throw new Error(
        `Guardrail violation: New exposure inferred for ${country}`
      )
    }
  }
}

function enforceAdditiveCSIDeltas(
  company: Company,
  adjustedCSI: Record<string, number>
): void {
  // Verify CSI adjustments are additive, not replacements
  for (const [country, adjustedValue] of Object.entries(adjustedCSI)) {
    const baselineValue = company.baselineCSI[country]
    if (baselineValue && adjustedValue < baselineValue * 0.5) {
      console.warn(
        `Potential guardrail violation: Large CSI decrease for ${country}`
      )
    }
  }
}

function enforceExistingExposureOnly(
  company: Company,
  adjustedCSI: Record<string, number>
): void {
  // Verify adjustments only applied to countries with existing exposure
  for (const country of Object.keys(adjustedCSI)) {
    if (!company.exposure[country] || company.exposure[country] === 0) {
      throw new Error(
        `Guardrail violation: Adjustment applied to country with no exposure: ${country}`
      )
    }
  }
}
```

**Acceptance Criteria:**
- All 6 guardrails implemented
- Validation tests passing
- Error messages clear

---

## DAY 3: Wednesday, January 22 (Forecast Engine - Part 2)

### Task 2.5: Implement Channel Delta Calculations (4 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Implement channel-level impact calculations
- Calculate revenue channel delta
- Calculate supply chain channel delta
- Calculate physical assets channel delta
- Calculate financial channel delta

**Deliverables:**
- Channel calculation functions
- Unit tests

**Code Template:**
```typescript
// src/services/forecastEngine.ts (continued)

function calculateChannelDeltas(
  company: Company,
  baselineCSI: Record<string, number>,
  forecastAdjustedCSI: Record<string, number>
): {
  revenue: number
  supplyChain: number
  physicalAssets: number
  financial: number
} {
  let revenueDelta = 0
  let supplyChainDelta = 0
  let physicalAssetsDelta = 0
  let financialDelta = 0

  for (const [country, exposure] of Object.entries(company.exposure)) {
    if (exposure > 0) {
      const csiDelta = forecastAdjustedCSI[country] - baselineCSI[country]

      // Distribute delta across channels based on company's channel weights
      const channelWeights = company.channelWeights[country] || {
        revenue: 0.4,
        supplyChain: 0.4,
        physicalAssets: 0.1,
        financial: 0.1
      }

      revenueDelta += csiDelta * exposure * channelWeights.revenue
      supplyChainDelta += csiDelta * exposure * channelWeights.supplyChain
      physicalAssetsDelta += csiDelta * exposure * channelWeights.physicalAssets
      financialDelta += csiDelta * exposure * channelWeights.financial
    }
  }

  return {
    revenue: revenueDelta,
    supplyChain: supplyChainDelta,
    physicalAssets: physicalAssetsDelta,
    financial: financialDelta
  }
}
```

**Acceptance Criteria:**
- Channel deltas calculated correctly
- Tests validate accuracy
- Edge cases handled

---

### Task 2.6: Implement Primary Drivers Identification (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** MEDIUM

**Activities:**
- Implement logic to identify top 3 risk drivers
- Rank by contribution to CO-GRI delta
- Generate human-readable driver descriptions

**Deliverables:**
- Primary drivers identification function
- Unit tests

**Acceptance Criteria:**
- Top 3 drivers identified correctly
- Descriptions clear and actionable
- Tests passing

---

## DAY 4: Thursday, January 23 (CO-GRI Calculator Integration)

### Task 2.7: Modify CO-GRI Calculator (4 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Modify `src/services/cogriCalculator.ts`
- Add optional `forecastAdjustments` parameter
- Maintain backward compatibility
- Add forecast-specific calculation path

**Deliverables:**
- Updated `cogriCalculator.ts`
- Integration tests

**Code Template:**
```typescript
// src/services/cogriCalculator.ts (modified)

import type { Company } from '../types/company'
import type { Scenario } from '../types/scenario'
import type { ForecastAdjustments } from '../types/forecast'

export interface COGRIResult {
  baselineCOGRI: number
  adjustedCOGRI: number
  delta: number
  // ... other fields
}

export function calculateCOGRI(
  company: Company,
  scenario?: Scenario,
  forecastAdjustments?: ForecastAdjustments // NEW, optional
): COGRIResult {
  // Existing logic for baseline CO-GRI
  const baselineCOGRI = calculateBaselineCOGRI(company)

  // Existing logic for scenario adjustments
  if (scenario) {
    return applyScenario(baselineCOGRI, scenario)
  }

  // NEW logic for forecast adjustments
  if (forecastAdjustments) {
    return applyForecastAdjustments(baselineCOGRI, forecastAdjustments)
  }

  return {
    baselineCOGRI,
    adjustedCOGRI: baselineCOGRI,
    delta: 0
  }
}

function applyForecastAdjustments(
  baselineCOGRI: number,
  forecastAdjustments: ForecastAdjustments
): COGRIResult {
  // Apply forecast-specific logic
  const adjustedCOGRI = baselineCOGRI + forecastAdjustments.totalDelta

  return {
    baselineCOGRI,
    adjustedCOGRI,
    delta: forecastAdjustments.totalDelta
  }
}
```

**Acceptance Criteria:**
- Backward compatibility maintained
- Forecast path functional
- All existing tests still passing
- New forecast tests passing

---

### Task 2.8: Integration Testing (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create integration tests for forecast engine + CO-GRI calculator
- Test data flow from forecast data → engine → calculator → result
- Test guardrail enforcement
- Test error handling

**Deliverables:**
- Integration test suite
- All tests passing

**Acceptance Criteria:**
- Integration tests comprehensive
- All tests passing
- Edge cases covered

---

## DAY 5: Friday, January 24 (UI Integration & Testing)

### Task 2.9: Integrate Mode Selector into Predictive Analysis Page (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Modify `src/pages/PredictiveAnalysis.tsx`
- Add mode selector at top of page
- Implement conditional rendering based on mode
- Add mode state management
- Clear inputs on mode change

**Deliverables:**
- Updated `PredictiveAnalysis.tsx`
- Component tests

**Code Template:**
```typescript
// src/pages/PredictiveAnalysis.tsx (modified)

import React, { useState } from 'react'
import { ModeSelector, type AnalysisMode } from '../components/ModeSelector'
import { EventScenarioUI } from '../components/EventScenarioUI'
import { StrategicForecastUI } from '../components/StrategicForecastUI'

export function PredictiveAnalysisPage() {
  const [mode, setMode] = useState<AnalysisMode>('event')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode)
    setHasUnsavedChanges(false)
    // Clear all inputs
    clearInputs()
  }

  return (
    <div className="predictive-analysis-page">
      <h1>Predictive Analysis</h1>

      <ModeSelector
        selectedMode={mode}
        onModeChange={handleModeChange}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {mode === 'event' && (
        <EventScenarioUI
          onInputChange={() => setHasUnsavedChanges(true)}
        />
      )}

      {mode === 'forecast' && (
        <StrategicForecastUI
          onInputChange={() => setHasUnsavedChanges(true)}
        />
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- Mode selector integrated
- Conditional rendering works
- Mode switching functional
- Tests passing

---

### Task 2.10: Create Strategic Forecast UI Skeleton (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** MEDIUM

**Activities:**
- Create `src/components/StrategicForecastUI.tsx` skeleton
- Add analysis scope selector
- Add forecast parameters display (read-only)
- Add "Run Analysis" button

**Deliverables:**
- `StrategicForecastUI.tsx` skeleton file

**Acceptance Criteria:**
- Component renders
- Basic inputs functional
- Ready for Phase 3 output implementation

---

### Task 2.11: Phase 2 Testing & Documentation (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Run all Phase 2 tests
- Fix any bugs
- Update documentation
- Prepare Phase 3 handoff

**Deliverables:**
- All tests passing
- Updated documentation
- Phase 2 completion report

**Acceptance Criteria:**
- Test coverage >90%
- All tests passing
- Documentation complete
- Ready for Phase 3

---

## PHASE 2 DELIVERABLES CHECKLIST

### Code Files
- [ ] `src/components/ModeSelector.tsx`
- [ ] `src/components/StrategicForecastUI.tsx` (skeleton)
- [ ] `src/services/forecastEngine.ts`
- [ ] `src/services/guardrails.ts`
- [ ] `src/services/cogriCalculator.ts` (modified)
- [ ] `src/pages/PredictiveAnalysis.tsx` (modified)

### Test Files
- [ ] `src/components/__tests__/ModeSelector.test.tsx`
- [ ] `src/services/__tests__/forecastEngine.test.ts`
- [ ] `src/services/__tests__/guardrails.test.ts`
- [ ] Integration tests

### Documentation
- [ ] Mode architecture documentation
- [ ] Guardrail documentation
- [ ] Phase 2 completion report

### Quality Metrics
- [ ] Test coverage >90%
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No critical bugs

---

**Phase 2 Status:** READY TO START  
**Next Phase:** Phase 3 (Output Tiers)  
**Phase 2 Kickoff:** Monday, January 20, 2026, 9:00 AM
