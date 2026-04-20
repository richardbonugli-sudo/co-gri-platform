# Strategic Forecast Baseline Redesign - Technical Specification

**Version:** 1.0  
**Date:** 2026-01-15  
**Status:** Draft  
**Owner:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Requirements Mapping](#requirements-mapping)
3. [Architecture Changes](#architecture-changes)
4. [Implementation Phases](#implementation-phases)
5. [Code Changes Detail](#code-changes-detail)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)

---

## 1. Executive Summary

### Purpose
Redesign the Strategic Forecast Baseline feature to transform it from a technical diagnostic tool into an investor-focused intelligence product.

### Key Changes
1. **Event Relevance Filtering**: Filter forecast events by company exposure
2. **Bottom-Line Interpretation**: Generate structured 4-sentence investor summary
3. **UI Restructuring**: Hide technical details, promote narrative insights
4. **Exposure Pathways**: Add channel-by-channel explainability layer

### Success Criteria
- Users see 3-5 relevant events (down from 15-20 generic events)
- 80% of displayed content is narrative insights (up from 20%)
- Clear bottom-line interpretation present (currently missing)
- Technical details collapsed by default (currently prominent)

---

## 2. Requirements Mapping

### 2.1 Appendix B.1 Part I → Backend Services

| Requirement | Current Implementation | Required Changes | Priority |
|-------------|----------------------|------------------|----------|
| **1. Forecast Ingestion** | ✅ `gurusForecastAdapter.ts` | Minor enhancements | P2 |
| **2. Event Relevance Filtering** | ❌ Missing | **NEW SERVICE REQUIRED** | **P0** |
| **3. Exposure Transmission Logic** | ⚠️ Partial (`scenarioEngine.ts`) | Refactor for forecast mode | P1 |
| **4. Aggregation to Company Outlook** | ❌ Missing | **NEW AGGREGATOR REQUIRED** | **P0** |

### 2.2 Appendix B.1 Part II → Frontend Components

| Requirement | Current Implementation | Required Changes | Priority |
|-------------|----------------------|------------------|----------|
| **1. Company Geopolitical Outlook** | ❌ Missing | **NEW COMPONENT** | **P0** |
| **2. Exposure Pathways** | ❌ Missing | **NEW COMPONENT** | **P0** |
| **3. Bottom-Line Interpretation** | ❌ Missing | **NEW GENERATOR + COMPONENT** | **P0** |
| **4. Quantitative Support** | ✅ Exists but prominent | Collapse by default | P1 |

---

## 3. Architecture Changes

### 3.1 New Services (Backend)

```
src/services/
├── forecast/
│   ├── eventRelevanceFilter.ts          [NEW - P0]
│   ├── bottomLineGenerator.ts           [NEW - P0]
│   ├── exposurePathwayAnalyzer.ts       [NEW - P0]
│   ├── companyOutlookAggregator.ts      [NEW - P0]
│   └── __tests__/
│       ├── eventRelevanceFilter.test.ts
│       ├── bottomLineGenerator.test.ts
│       ├── exposurePathwayAnalyzer.test.ts
│       └── companyOutlookAggregator.test.ts
```

### 3.2 Modified Services (Backend)

```
src/services/
├── forecastEngine.ts                    [REFACTOR - P1]
├── gurusForecastAdapter.ts              [ENHANCE - P2]
└── scenarioEngine.ts                    [REFACTOR - P1]
```

### 3.3 New Components (Frontend)

```
src/components/forecast/
├── CompanyGeopoliticalOutlook.tsx       [NEW - P0]
├── ExposurePathways.tsx                 [NEW - P0]
├── BottomLineInterpretation.tsx         [NEW - P0]
├── QuantitativeSupport.tsx              [NEW - P1]
└── __tests__/
    ├── CompanyGeopoliticalOutlook.test.tsx
    ├── ExposurePathways.test.tsx
    ├── BottomLineInterpretation.test.tsx
    └── QuantitativeSupport.test.tsx
```

### 3.4 Modified Components (Frontend)

```
src/components/
├── ForecastOutputRenderer.tsx           [MAJOR REFACTOR - P0]
└── ForecastReport2026.tsx               [REFACTOR - P1]
```

### 3.5 New Types

```
src/types/
└── forecastCompany.ts                   [NEW - P0]
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Weeks 1-2) - **CURRENT PHASE**

**Objective:** Build core filtering and interpretation logic

#### Deliverables:
1. `eventRelevanceFilter.ts` - Filter events by company exposure
2. `bottomLineGenerator.ts` - Generate 4-sentence interpretation
3. `exposurePathwayAnalyzer.ts` - Analyze channel-level impacts
4. `companyOutlookAggregator.ts` - Aggregate to company outlook
5. `forecastCompany.ts` - Type definitions
6. Unit tests for all new services (>90% coverage)

#### Dependencies:
- Existing: `geographicExposureService.ts`
- Existing: `gurusForecastAdapter.ts`
- Existing: `forecastEngine.ts`

#### Success Criteria:
- Event filtering reduces 15-20 events to 3-5 relevant events
- Bottom-line interpretation passes readability test
- All unit tests pass
- No breaking changes to existing functionality

---

### Phase 2: UI Restructuring (Weeks 3-4)

**Objective:** Redesign user interface per Appendix B.1 Part II

#### Deliverables:
1. `CompanyGeopoliticalOutlook.tsx` - Primary view
2. `ExposurePathways.tsx` - Explainability layer
3. `BottomLineInterpretation.tsx` - Required summary
4. `QuantitativeSupport.tsx` - Collapsed technical details
5. Refactored `ForecastOutputRenderer.tsx`
6. Component tests

#### Dependencies:
- Phase 1 services completed
- Design mockups approved

#### Success Criteria:
- 80% of displayed content is narrative insights
- Technical details collapsed by default
- Bottom-line interpretation prominently displayed
- Responsive design works on mobile

---

### Phase 3: Validation (Week 5)

**Objective:** Test with real companies and validate logic

#### Deliverables:
1. Test with Apple (worked example)
2. Test with 10 diverse companies
3. Edge case testing
4. Performance testing
5. User acceptance testing

#### Success Criteria:
- Apple output matches Appendix B.1 example
- Event filtering logic validated across sectors
- No performance degradation
- User feedback positive

---

### Phase 4: Rollout (Week 6)

**Objective:** Deploy to production

#### Deliverables:
1. Production deployment
2. Documentation updates
3. User communication
4. Monitoring setup

#### Success Criteria:
- Zero critical bugs
- User adoption >80%
- Performance metrics met

---

## 5. Code Changes Detail

### 5.1 NEW: `eventRelevanceFilter.ts`

**Purpose:** Filter forecast events by company exposure

**Location:** `src/services/forecast/eventRelevanceFilter.ts`

**Interface:**
```typescript
export interface EventRelevanceFilter {
  filterRelevantEvents(
    company: CompanyExposure,
    forecastEvents: GeopoliticalEvent[]
  ): RelevantEvent[];
}

export interface RelevantEvent extends GeopoliticalEvent {
  relevanceScore: number;
  relevanceReasons: string[];
  affectedChannels: Channel[];
  affectedCountries: string[];
}
```

**Algorithm:**
```typescript
function isEventRelevant(
  event: GeopoliticalEvent,
  company: CompanyExposure
): boolean {
  // Rule 1: Company has exposure to affected country
  const hasCountryExposure = event.affectedCountries.some(country =>
    company.exposures.some(exp => exp.country === country && exp.percentage > 0.5)
  );

  // Rule 2: Event affects company's sector
  const affectsSector = event.affectedSectors.includes(company.sector);

  // Rule 3: Event transmits through company's channels
  const affectsChannels = event.transmissionChannels.some(channel =>
    hasSignificantChannelExposure(company, channel, event.affectedCountries)
  );

  return hasCountryExposure || affectsSector || affectsChannels;
}
```

**Dependencies:**
- `@/types/forecast.ts` - GeopoliticalEvent
- `@/services/geographicExposureService.ts` - CompanyExposure
- `@/types/v4Types.ts` - Channel

**Test Cases:**
1. Event affects company's top exposure country → Relevant
2. Event affects company's sector → Relevant
3. Event transmits through company's supply chain → Relevant
4. Event unrelated to company → Not relevant
5. Edge case: Company with minimal exposure → Not relevant

---

### 5.2 NEW: `bottomLineGenerator.ts`

**Purpose:** Generate structured 4-sentence bottom-line interpretation

**Location:** `src/services/forecast/bottomLineGenerator.ts`

**Interface:**
```typescript
export interface BottomLineInterpretation {
  netDirection: 'elevated' | 'reduced' | 'mixed';
  primaryDriver: string;
  primaryChannel: Channel;
  offsets: string[];
  conclusion: 'headwind' | 'tailwind' | 'mixed';
  fullText: string;
}

export function generateBottomLineInterpretation(
  companyOutlook: CompanyOutlook
): BottomLineInterpretation;
```

**Algorithm:**
```typescript
function generateBottomLineInterpretation(
  outlook: CompanyOutlook
): BottomLineInterpretation {
  // Sentence 1: Net direction
  const netDirection = determineNetDirection(outlook.channelImpacts);
  const sentence1 = `${outlook.companyName}'s geopolitical risk exposure is ${netDirection} relative to its historical baseline`;

  // Sentence 2: Primary driver
  const primaryDriver = identifyPrimaryDriver(outlook.relevantEvents);
  const primaryChannel = identifyPrimaryChannel(outlook.channelImpacts);
  const sentence2 = `driven primarily by ${primaryChannel} exposure to ${primaryDriver}`;

  // Sentence 3: Offsets/nuance
  const offsets = identifyOffsets(outlook.channelImpacts);
  const sentence3 = offsets.length > 0
    ? `While ${offsets.join(' and ')} mitigate some downside`
    : ``;

  // Sentence 4: Conclusion
  const conclusion = determineConclusion(netDirection, offsets);
  const sentence4 = `the geopolitical environment over the next year represents a net ${conclusion}`;

  return {
    netDirection,
    primaryDriver,
    primaryChannel,
    offsets,
    conclusion,
    fullText: `${sentence1}, ${sentence2}. ${sentence3}, ${sentence4}.`
  };
}
```

**Dependencies:**
- `@/types/forecastCompany.ts` - CompanyOutlook
- `@/types/v4Types.ts` - Channel

**Test Cases:**
1. Apple example → Matches Appendix B.1 output
2. Company with net positive outlook → "tailwind"
3. Company with mixed outlook → "mixed environment"
4. Company with strong offsets → Mentions diversification
5. Edge case: No relevant events → Neutral baseline

---

### 5.3 NEW: `exposurePathwayAnalyzer.ts`

**Purpose:** Analyze channel-by-channel impact pathways

**Location:** `src/services/forecast/exposurePathwayAnalyzer.ts`

**Interface:**
```typescript
export interface ChannelPathway {
  channel: Channel;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  affectedCountries: string[];
  relevantEvents: string[];
}

export function analyzeExposurePathways(
  company: CompanyExposure,
  relevantEvents: RelevantEvent[]
): ChannelPathway[];
```

**Algorithm:**
```typescript
function analyzeChannelPathway(
  channel: Channel,
  company: CompanyExposure,
  events: RelevantEvent[]
): ChannelPathway {
  // Filter events affecting this channel
  const channelEvents = events.filter(e => 
    e.affectedChannels.includes(channel)
  );

  // Calculate net impact
  const netImpact = calculateNetImpact(channelEvents, company, channel);

  // Determine severity
  const severity = determineSeverity(netImpact, company, channel);

  // Generate plain-language explanation
  const explanation = generateChannelExplanation(
    channel,
    netImpact,
    severity,
    channelEvents,
    company
  );

  return {
    channel,
    impact: netImpact,
    severity,
    explanation,
    affectedCountries: extractAffectedCountries(channelEvents, company),
    relevantEvents: channelEvents.map(e => e.event)
  };
}
```

**Dependencies:**
- `@/types/forecastCompany.ts` - ChannelPathway
- `@/types/v4Types.ts` - Channel
- `@/services/geographicExposureService.ts` - CompanyExposure

**Test Cases:**
1. Supply chain channel with China exposure → "Negative (High)"
2. Revenue channel with diversified exposure → "Mixed"
3. Assets channel with minimal exposure → "Neutral"
4. Financial channel with USD dominance → "Neutral"
5. Edge case: Multiple offsetting events → "Mixed"

---

### 5.4 NEW: `companyOutlookAggregator.ts`

**Purpose:** Aggregate all analyses into company-level outlook

**Location:** `src/services/forecast/companyOutlookAggregator.ts`

**Interface:**
```typescript
export interface CompanyOutlook {
  companyName: string;
  ticker: string;
  sector: string;
  netImpact: 'positive' | 'negative' | 'mixed';
  confidence: 'high' | 'medium' | 'low';
  horizon: string;
  narrativeSummary: string;
  relevantEvents: RelevantEvent[];
  channelPathways: ChannelPathway[];
  bottomLineInterpretation: BottomLineInterpretation;
  quantitativeSupport?: QuantitativeSupport;
}

export async function generateCompanyOutlook(
  ticker: string,
  forecastYear: string
): Promise<CompanyOutlook>;
```

**Algorithm:**
```typescript
async function generateCompanyOutlook(
  ticker: string,
  forecastYear: string
): Promise<CompanyOutlook> {
  // Step 1: Get company exposure data
  const company = await getCompanyGeographicExposure(ticker);

  // Step 2: Load forecast events
  const forecastEvents = loadForecastScenarios(forecastYear);

  // Step 3: Filter relevant events
  const relevantEvents = filterRelevantEvents(company, forecastEvents);

  // Step 4: Analyze exposure pathways
  const channelPathways = analyzeExposurePathways(company, relevantEvents);

  // Step 5: Generate bottom-line interpretation
  const bottomLine = generateBottomLineInterpretation({
    companyName: company.company,
    relevantEvents,
    channelPathways
  });

  // Step 6: Generate narrative summary
  const narrativeSummary = generateNarrativeSummary(
    company,
    relevantEvents,
    channelPathways
  );

  // Step 7: Calculate quantitative support (optional)
  const quantitativeSupport = calculateQuantitativeSupport(
    company,
    relevantEvents,
    channelPathways
  );

  return {
    companyName: company.company,
    ticker: ticker.toUpperCase(),
    sector: company.sector,
    netImpact: bottomLine.netDirection === 'elevated' ? 'negative' : 
               bottomLine.netDirection === 'reduced' ? 'positive' : 'mixed',
    confidence: determineConfidence(relevantEvents),
    horizon: `Next 6-12 months (${forecastYear})`,
    narrativeSummary,
    relevantEvents,
    channelPathways,
    bottomLineInterpretation: bottomLine,
    quantitativeSupport
  };
}
```

**Dependencies:**
- All Phase 1 services
- `@/services/geographicExposureService.ts`
- `@/services/gurusForecastAdapter.ts`

**Test Cases:**
1. Apple → Matches Appendix B.1 example
2. Company with no relevant events → Neutral outlook
3. Company with positive outlook → Tailwind
4. Company with mixed outlook → Mixed
5. Edge case: Insufficient data → Low confidence

---

### 5.5 NEW: `forecastCompany.ts` (Types)

**Purpose:** Type definitions for company-level forecast analysis

**Location:** `src/types/forecastCompany.ts`

**Content:**
```typescript
import { Channel } from './v4Types';
import { GeopoliticalEvent } from './forecast';

/**
 * Event filtered for company relevance
 */
export interface RelevantEvent extends GeopoliticalEvent {
  relevanceScore: number;
  relevanceReasons: string[];
  affectedChannels: Channel[];
  affectedCountries: string[];
}

/**
 * Channel-level impact pathway
 */
export interface ChannelPathway {
  channel: Channel;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  affectedCountries: string[];
  relevantEvents: string[];
}

/**
 * Bottom-line interpretation
 */
export interface BottomLineInterpretation {
  netDirection: 'elevated' | 'reduced' | 'mixed';
  primaryDriver: string;
  primaryChannel: Channel;
  offsets: string[];
  conclusion: 'headwind' | 'tailwind' | 'mixed';
  fullText: string;
}

/**
 * Quantitative support (collapsed by default)
 */
export interface QuantitativeSupport {
  structuralCOGRI: number;
  forecastAdjustedCOGRI: number;
  directionalChange: 'up' | 'down' | 'neutral';
  channelContributions: Record<Channel, number>;
}

/**
 * Complete company outlook
 */
export interface CompanyOutlook {
  companyName: string;
  ticker: string;
  sector: string;
  netImpact: 'positive' | 'negative' | 'mixed';
  confidence: 'high' | 'medium' | 'low';
  horizon: string;
  narrativeSummary: string;
  relevantEvents: RelevantEvent[];
  channelPathways: ChannelPathway[];
  bottomLineInterpretation: BottomLineInterpretation;
  quantitativeSupport?: QuantitativeSupport;
}
```

---

### 5.6 REFACTOR: `ForecastOutputRenderer.tsx`

**Purpose:** Redesign UI per Appendix B.1 Part II

**Location:** `src/components/ForecastOutputRenderer.tsx`

**Current Structure (REMOVE):**
```tsx
// ❌ Current (Technical-first)
<div>
  <h2>Strategic Forecast Baseline</h2>
  <div>CSI Changes: +1.2 points</div>
  <div>Sector Multiplier: 1.25x</div>
  <div>Key Events (15 items)...</div>
  <div>Calculation Steps...</div>
</div>
```

**New Structure (IMPLEMENT):**
```tsx
// ✅ New (Investor-first)
<div>
  {/* 1. Company Geopolitical Outlook (Primary) */}
  <CompanyGeopoliticalOutlook outlook={companyOutlook} />

  {/* 2. Exposure Pathways (Explainability) */}
  <ExposurePathways pathways={companyOutlook.channelPathways} />

  {/* 3. Bottom-Line Interpretation (Required) */}
  <BottomLineInterpretation interpretation={companyOutlook.bottomLineInterpretation} />

  {/* 4. Quantitative Support (Collapsed) */}
  <Collapsible defaultOpen={false}>
    <QuantitativeSupport data={companyOutlook.quantitativeSupport} />
  </Collapsible>
</div>
```

**Dependencies:**
- New components from Phase 2
- `companyOutlookAggregator.ts` from Phase 1

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Coverage Target:** >90%

**Key Test Suites:**

1. **Event Relevance Filter**
   - Test with Apple (15 events → 3 relevant)
   - Test with company with no exposure
   - Test with company in affected sector
   - Test edge cases (minimal exposure, offsetting events)

2. **Bottom-Line Generator**
   - Test Apple example matches Appendix B.1
   - Test all net directions (elevated, reduced, mixed)
   - Test all conclusions (headwind, tailwind, mixed)
   - Test with/without offsets

3. **Exposure Pathway Analyzer**
   - Test all 4 channels (Revenue, Supply, Assets, Financial)
   - Test all impact levels (positive, negative, neutral)
   - Test all severity levels (high, medium, low)

4. **Company Outlook Aggregator**
   - Test end-to-end with Apple
   - Test with 10 diverse companies
   - Test error handling

### 6.2 Integration Tests

1. **Backend Integration**
   - Test full pipeline: ticker → outlook
   - Test with real forecast data
   - Test performance (<2s response time)

2. **Frontend Integration**
   - Test component rendering
   - Test collapsible sections
   - Test responsive design

### 6.3 E2E Tests

1. **User Workflows**
   - Select company → View outlook
   - Expand/collapse quantitative support
   - Compare multiple companies

2. **Edge Cases**
   - Company with no relevant events
   - Company with insufficient data
   - Forecast data unavailable

---

## 7. Rollout Plan

### 7.1 Pre-Deployment Checklist

- [ ] All unit tests pass (>90% coverage)
- [ ] All integration tests pass
- [ ] Apple example matches Appendix B.1
- [ ] 10 diverse companies validated
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation updated
- [ ] User guide created

### 7.2 Deployment Strategy

**Approach:** Phased rollout with feature flag

**Phase A: Internal Testing (Week 6, Days 1-2)**
- Deploy to staging environment
- Internal team testing
- Bug fixes

**Phase B: Beta Users (Week 6, Days 3-4)**
- Enable feature flag for 10% of users
- Collect feedback
- Monitor metrics

**Phase C: Full Rollout (Week 6, Day 5)**
- Enable for 100% of users
- Monitor for 24 hours
- Disable old implementation

### 7.3 Rollback Plan

**Trigger Conditions:**
- Critical bug affecting >10% of users
- Performance degradation >50%
- Data accuracy issues

**Rollback Steps:**
1. Disable feature flag
2. Revert to old implementation
3. Investigate root cause
4. Fix and re-deploy

### 7.4 Success Metrics

**Week 1 Post-Launch:**
- [ ] Zero critical bugs
- [ ] User adoption >80%
- [ ] Average response time <2s
- [ ] Event filtering accuracy >95%

**Week 4 Post-Launch:**
- [ ] User satisfaction score >4.0/5.0
- [ ] Feature usage >90% of forecast users
- [ ] Support tickets <5 per week

---

## 8. Open Questions

1. **Event Relevance Threshold:** What minimum exposure % qualifies as "has exposure"? (Proposed: 0.5%)
2. **Confidence Scoring:** How to calculate forecast confidence? (Proposed: Based on event probabilities)
3. **Narrative Generation:** Use templates or NLP? (Proposed: Templates for Phase 1, NLP for Phase 2+)
4. **Performance:** Cache company outlooks? (Proposed: Yes, 1-hour TTL)
5. **Localization:** Support multiple languages? (Proposed: English only for Phase 1)

---

## 9. Appendix

### 9.1 Apple Example (Reference)

**Expected Output (from Appendix B.1):**

**1. Company Geopolitical Outlook**
- Net Impact: Mixed / Net Negative
- Confidence: High
- Horizon: Next 6-12 months
- Summary: "Apple faces elevated geopolitical headwinds driven primarily by high-probability US–China technology decoupling. While diversification into India and Vietnam provides meaningful offsets, supply-chain concentration in China remains the dominant risk over the forecast horizon."

**2. Exposure Pathways**
- Supply Chain: Negative (High) - "China assembly and component concentration exposes Apple to export controls and logistics risk."
- Revenue: Moderately Negative - "China consumer demand uncertainty partially offset by India and ASEAN growth."
- Physical Assets: Neutral - "Limited fixed assets in high-risk regions."
- Financial: Neutral - "USD-based funding structure with limited EM exposure."

**3. Bottom Line**
"Apple's geopolitical risk exposure is elevated relative to its historical baseline, driven primarily by supply-chain exposure to China. While diversification efforts mitigate some downside, the geopolitical environment over the next year represents a net headwind rather than a tailwind."

**4. Quantitative Support (Collapsed)**
- CO-GRI Directional Change: ↑
- Primary driver: Supply Chain exposure
- Secondary driver: Revenue exposure

---

## 10. Sign-Off

**Technical Lead:** _________________  
**Product Manager:** _________________  
**Date:** _________________

---

**END OF SPECIFICATION**
