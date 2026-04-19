# Phase 1: Data Modeling
## Detailed Task Breakdown (Week 1)

**Duration:** January 13-17, 2026 (5 days)  
**Lead:** Full-Stack Engineer  
**Support:** Data Analyst (part-time)

---

## DAY 1: Monday, January 13 (Data Structure Design)

### Task 1.1: Review Source Data (2 hours)
**Assignee:** Full-Stack Engineer + Data Analyst  
**Priority:** CRITICAL

**Activities:**
- Review CedarOwl Integrated Geopolitical Gurus Risk Forecast PDF
- Identify all data elements to be extracted
- Document data format and structure
- Identify any data quality issues

**Deliverables:**
- Data extraction checklist
- Data quality assessment document

**Acceptance Criteria:**
- All data elements identified
- Data quality issues documented
- Team alignment on data structure

---

### Task 1.2: Design TypeScript Type Definitions (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `types/forecast.ts` with all type definitions
- Define interfaces for:
  - `CedarOwlForecast`
  - `ForecastMetadata`
  - `CountryAdjustment`
  - `GeopoliticalEvent`
  - `RegionalPremiums`
  - `SectorMultipliers`
  - `AssetClassForecasts`
  - `RegionalOutlook`

**Deliverables:**
- `src/types/forecast.ts` file

**Code Template:**
```typescript
// src/types/forecast.ts

export interface ForecastMetadata {
  forecastPeriod: string
  publishDate: string
  expertSources: number
  overallConfidence: number
  nextUpdate: string
  coverage: {
    countries: number
    events: number
    regions: number
    assetClasses: number
  }
}

export interface CountryAdjustment {
  delta: number
  drivers: string[]
  outlook: string
  expectedReturn: number
  riskTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
}

export interface GeopoliticalEvent {
  event: string
  timeline: string
  probability: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  baseImpact: number
  affectedCountries: string[]
  sectorImpacts: Record<string, number>
  description: string
  investmentImpact: string
}

export interface RegionalPremiums {
  [region: string]: number
}

export interface SectorMultipliers {
  [sector: string]: number
}

export interface AssetClassForecast {
  assetClass: string
  expectedReturn: number
  recommendation: 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT'
  rationale: string[]
}

export interface RegionalOutlook {
  region: string
  riskLevel: string
  keyThemes: string[]
  opportunities: string[]
  strategy: string
}

export interface CedarOwlForecast {
  metadata: ForecastMetadata
  countryAdjustments: Record<string, CountryAdjustment>
  geopoliticalEvents: GeopoliticalEvent[]
  regionalPremiums: RegionalPremiums
  sectorMultipliers: SectorMultipliers
  assetClassForecasts: Record<string, AssetClassForecast>
  regionalOutlook: Record<string, RegionalOutlook>
}
```

**Acceptance Criteria:**
- All types defined
- TypeScript compiles without errors
- Types match source data structure

---

### Task 1.3: Set Up Data File Structure (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create `src/data/cedarOwlForecast2026.ts` file
- Set up basic structure with metadata
- Add placeholder comments for data sections
- Configure module exports

**Deliverables:**
- `src/data/cedarOwlForecast2026.ts` skeleton file

**Acceptance Criteria:**
- File structure created
- Imports/exports configured
- Ready for data population

---

## DAY 2: Tuesday, January 14 (Country Adjustments)

### Task 1.4: Extract Country Adjustment Data (4 hours)
**Assignee:** Data Analyst + Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Extract country-level data from CedarOwl forecast (195 countries)
- Populate `countryAdjustments` object
- Verify data accuracy
- Document any missing or unclear data

**Data to Extract per Country:**
- CSI delta (-10 to +10)
- Risk drivers (array of strings)
- Investment outlook (UNDERPERFORM, NEUTRAL, OUTPERFORM, etc.)
- Expected return (percentage)
- Risk trend (IMPROVING, STABLE, DETERIORATING)

**Deliverables:**
- Populated `countryAdjustments` section in data file
- Data extraction log

**Acceptance Criteria:**
- All 195 countries populated
- Data format matches type definitions
- No TypeScript errors

---

### Task 1.5: Create Data Validation Utilities (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create `src/utils/forecastValidation.ts`
- Implement validation functions:
  - `validateForecastMetadata()`
  - `validateCountryAdjustments()`
  - `validateGeopoliticalEvents()`
  - `validateForecast()` (comprehensive)
- Add error handling and logging

**Deliverables:**
- `src/utils/forecastValidation.ts` file
- Unit tests for validation functions

**Code Template:**
```typescript
// src/utils/forecastValidation.ts

export function validateForecastMetadata(metadata: ForecastMetadata): boolean {
  if (!metadata.forecastPeriod || !metadata.publishDate) {
    throw new Error('Missing required metadata fields')
  }
  if (metadata.overallConfidence < 0 || metadata.overallConfidence > 1) {
    throw new Error('Invalid confidence value')
  }
  return true
}

export function validateCountryAdjustments(
  adjustments: Record<string, CountryAdjustment>
): boolean {
  for (const [country, adjustment] of Object.entries(adjustments)) {
    if (adjustment.delta < -10 || adjustment.delta > 10) {
      throw new Error(`Invalid delta for ${country}`)
    }
    if (!adjustment.drivers || adjustment.drivers.length === 0) {
      throw new Error(`Missing drivers for ${country}`)
    }
  }
  return true
}

export function validateForecast(forecast: CedarOwlForecast): boolean {
  validateForecastMetadata(forecast.metadata)
  validateCountryAdjustments(forecast.countryAdjustments)
  // ... other validations
  return true
}
```

**Acceptance Criteria:**
- All validation functions implemented
- Unit tests passing
- Error messages clear and actionable

---

## DAY 3: Wednesday, January 15 (Geopolitical Events)

### Task 1.6: Extract Geopolitical Events Data (3 hours)
**Assignee:** Data Analyst + Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Extract 6 major geopolitical events from CedarOwl forecast
- Populate `geopoliticalEvents` array
- Include all event details:
  - Event name
  - Timeline (H1/H2 2026, specific month)
  - Probability (0.0 to 1.0)
  - Risk level
  - Base impact
  - Affected countries
  - Sector impacts
  - Description
  - Investment impact

**Deliverables:**
- Populated `geopoliticalEvents` section in data file

**Events to Extract:**
1. US-Venezuela Intervention (January 2026)
2. New START Treaty Expiry (February 2026)
3. Ukraine Peace Negotiations (March 2026)
4. NATO Summit - Ukraine Security (July 2026)
5. US-China Tech Decoupling (September 2026)
6. BRICS Payment System Launch (October 2026)

**Acceptance Criteria:**
- All 6 events populated
- Data format matches type definitions
- Probabilities and impacts accurate

---

### Task 1.7: Extract Regional and Sector Data (3 hours)
**Assignee:** Data Analyst + Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Extract regional risk premiums (4 regions)
- Extract sector multipliers (7+ sectors)
- Extract asset class forecasts (6 asset classes)
- Extract regional outlook (4 regions)
- Populate corresponding sections in data file

**Deliverables:**
- Populated `regionalPremiums` section
- Populated `sectorMultipliers` section
- Populated `assetClassForecasts` section
- Populated `regionalOutlook` section

**Acceptance Criteria:**
- All sections populated
- Data format matches type definitions
- No missing data

---

### Task 1.8: Write Unit Tests for Data Integrity (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create `src/data/__tests__/cedarOwlForecast2026.test.ts`
- Write tests to verify:
  - Data structure integrity
  - All required fields present
  - Data types correct
  - Value ranges valid
  - No duplicate entries

**Deliverables:**
- `cedarOwlForecast2026.test.ts` file
- All tests passing

**Test Template:**
```typescript
// src/data/__tests__/cedarOwlForecast2026.test.ts

import { CEDAROWL_FORECAST_2026 } from '../cedarOwlForecast2026'
import { validateForecast } from '../../utils/forecastValidation'

describe('CedarOwl Forecast 2026 Data', () => {
  test('should have valid metadata', () => {
    expect(CEDAROWL_FORECAST_2026.metadata).toBeDefined()
    expect(CEDAROWL_FORECAST_2026.metadata.expertSources).toBe(15)
    expect(CEDAROWL_FORECAST_2026.metadata.overallConfidence).toBe(0.85)
  })

  test('should have 195 country adjustments', () => {
    const countryCount = Object.keys(CEDAROWL_FORECAST_2026.countryAdjustments).length
    expect(countryCount).toBe(195)
  })

  test('should have 6 geopolitical events', () => {
    expect(CEDAROWL_FORECAST_2026.geopoliticalEvents).toHaveLength(6)
  })

  test('should pass comprehensive validation', () => {
    expect(() => validateForecast(CEDAROWL_FORECAST_2026)).not.toThrow()
  })
})
```

**Acceptance Criteria:**
- All tests written
- All tests passing
- Code coverage >90%

---

## DAY 4: Thursday, January 16 (Data Utilities)

### Task 1.9: Create Data Access Utilities (4 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create `src/utils/forecastDataAccess.ts`
- Implement utility functions:
  - `loadCedarOwlForecast(year: string): CedarOwlForecast`
  - `getCountryAdjustment(country: string): CountryAdjustment`
  - `getGeopoliticalEvents(): GeopoliticalEvent[]`
  - `getEventsByTimeline(timeline: string): GeopoliticalEvent[]`
  - `getSectorMultiplier(sector: string): number`
  - `getRegionalPremium(region: string): number`
  - `getAssetClassForecast(assetClass: string): AssetClassForecast`

**Deliverables:**
- `src/utils/forecastDataAccess.ts` file
- Unit tests for all utility functions

**Code Template:**
```typescript
// src/utils/forecastDataAccess.ts

import { CEDAROWL_FORECAST_2026 } from '../data/cedarOwlForecast2026'
import type { CedarOwlForecast, CountryAdjustment, GeopoliticalEvent } from '../types/forecast'

export function loadCedarOwlForecast(year: string): CedarOwlForecast {
  if (year === '2026') {
    return CEDAROWL_FORECAST_2026
  }
  throw new Error(`Forecast data not available for year ${year}`)
}

export function getCountryAdjustment(country: string): CountryAdjustment | null {
  const forecast = CEDAROWL_FORECAST_2026
  return forecast.countryAdjustments[country] || null
}

export function getGeopoliticalEvents(): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents
}

export function getEventsByTimeline(timeline: string): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(
    event => event.timeline.includes(timeline)
  )
}

export function getSectorMultiplier(sector: string): number {
  return CEDAROWL_FORECAST_2026.sectorMultipliers[sector] || 1.0
}

export function getRegionalPremium(region: string): number {
  return CEDAROWL_FORECAST_2026.regionalPremiums[region] || 1.0
}
```

**Acceptance Criteria:**
- All utility functions implemented
- Error handling for missing data
- Unit tests passing
- Code coverage >90%

---

### Task 1.10: Create Data Versioning System (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** MEDIUM

**Activities:**
- Create `src/data/forecastRegistry.ts`
- Implement versioning system to support multiple forecast years
- Add metadata tracking (publish date, update date, version)
- Implement forecast staleness detection

**Deliverables:**
- `src/data/forecastRegistry.ts` file
- Versioning documentation

**Code Template:**
```typescript
// src/data/forecastRegistry.ts

import { CEDAROWL_FORECAST_2026 } from './cedarOwlForecast2026'
import type { CedarOwlForecast } from '../types/forecast'

interface ForecastRegistry {
  [year: string]: CedarOwlForecast
}

export const FORECAST_REGISTRY: ForecastRegistry = {
  '2026': CEDAROWL_FORECAST_2026
}

export function getAvailableForecastYears(): string[] {
  return Object.keys(FORECAST_REGISTRY)
}

export function getLatestForecast(): CedarOwlForecast {
  const years = getAvailableForecastYears()
  const latestYear = years.sort().reverse()[0]
  return FORECAST_REGISTRY[latestYear]
}

export function isForecastStale(forecast: CedarOwlForecast): boolean {
  const nextUpdate = new Date(forecast.metadata.nextUpdate)
  const now = new Date()
  return now > nextUpdate
}
```

**Acceptance Criteria:**
- Versioning system functional
- Staleness detection working
- Documentation complete

---

## DAY 5: Friday, January 17 (Testing & Documentation)

### Task 1.11: Comprehensive Data Testing (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Run all unit tests
- Verify data integrity
- Test data access utilities
- Test validation functions
- Fix any bugs found

**Deliverables:**
- All tests passing
- Bug fix log

**Acceptance Criteria:**
- Test coverage >90%
- All tests passing
- No critical bugs

---

### Task 1.12: Create Data Documentation (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Create `docs/DATA_STRUCTURE.md`
- Document data format
- Document data access patterns
- Document validation rules
- Add code examples

**Deliverables:**
- `docs/DATA_STRUCTURE.md` file

**Acceptance Criteria:**
- Documentation complete
- Examples clear and accurate
- Ready for Phase 2 team

---

### Task 1.13: Phase 1 Review & Handoff (2 hours)
**Assignee:** Full-Stack Engineer + Product Manager  
**Priority:** CRITICAL

**Activities:**
- Review Phase 1 deliverables
- Verify all acceptance criteria met
- Prepare handoff documentation for Phase 2
- Conduct Phase 1 retrospective

**Deliverables:**
- Phase 1 completion report
- Phase 2 handoff document

**Acceptance Criteria:**
- All Phase 1 tasks complete
- All tests passing
- Documentation complete
- Ready for Phase 2

---

## PHASE 1 DELIVERABLES CHECKLIST

### Code Files
- [ ] `src/types/forecast.ts` - Type definitions
- [ ] `src/data/cedarOwlForecast2026.ts` - Forecast data
- [ ] `src/data/forecastRegistry.ts` - Versioning system
- [ ] `src/utils/forecastValidation.ts` - Validation utilities
- [ ] `src/utils/forecastDataAccess.ts` - Data access utilities

### Test Files
- [ ] `src/data/__tests__/cedarOwlForecast2026.test.ts`
- [ ] `src/utils/__tests__/forecastValidation.test.ts`
- [ ] `src/utils/__tests__/forecastDataAccess.test.ts`

### Documentation
- [ ] `docs/DATA_STRUCTURE.md`
- [ ] Data extraction log
- [ ] Phase 1 completion report

### Quality Metrics
- [ ] Test coverage >90%
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] No critical bugs

---

## PHASE 1 RISKS & MITIGATIONS

**Risk:** Data extraction errors  
**Mitigation:** Dual review by engineer and data analyst  
**Status:** MONITORED

**Risk:** Type definition mismatches  
**Mitigation:** Iterative validation, early testing  
**Status:** MONITORED

**Risk:** Missing data from source  
**Mitigation:** Document assumptions, flag for Product Manager  
**Status:** MONITORED

---

**Phase 1 Status:** READY TO START  
**Next Phase:** Phase 2 (Mode Architecture)  
**Phase 1 Kickoff:** Monday, January 13, 2026, 9:00 AM
