# Phase 3: Output Tiers
## Detailed Task Breakdown (Week 3)

**Duration:** January 27-31, 2026 (5 days)  
**Lead:** Full-Stack Engineer  
**Support:** UI/UX Designer (part-time)

---

## DAY 1: Monday, January 27 (Design & Architecture)

### Task 3.1: Design 3-Tier Output Layout (4 hours)
**Assignee:** UI/UX Designer + Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create Figma mockups for 3-tier output structure
- Design Tier 1: Strategic Outlook layout
- Design Tier 2: Exposure Mapping layout
- Design Tier 3: Quantitative Anchors layout
- Define responsive breakpoints
- Review with Product Manager

**Deliverables:**
- Figma design file with all 3 tiers
- Design specifications document
- Responsive design guidelines

**Acceptance Criteria:**
- All 3 tiers designed
- Design approved by Product Manager
- Responsive specifications clear

---

### Task 3.2: Create Output Renderer Architecture (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/components/ForecastOutputRenderer.tsx` main component
- Define component structure for 3 tiers
- Set up state management for tier expansion/collapse
- Create type definitions for output data

**Deliverables:**
- `ForecastOutputRenderer.tsx` skeleton
- Type definitions for output data

**Code Template:**
```typescript
// src/components/ForecastOutputRenderer.tsx

import React, { useState } from 'react'
import { StrategicOutlookTier } from './StrategicOutlookTier'
import { ExposureMappingTier } from './ExposureMappingTier'
import { QuantitativeAnchorsTier } from './QuantitativeAnchorsTier'
import type { ForecastResult } from '../services/forecastEngine'
import type { CedarOwlForecast } from '../types/forecast'

interface ForecastOutputRendererProps {
  result: ForecastResult
  forecast: CedarOwlForecast
  companyName: string
}

export function ForecastOutputRenderer({
  result,
  forecast,
  companyName
}: ForecastOutputRendererProps) {
  const [expandedTiers, setExpandedTiers] = useState({
    tier1: true,
    tier2: true,
    tier3: true
  })

  const toggleTier = (tier: 'tier1' | 'tier2' | 'tier3') => {
    setExpandedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }))
  }

  return (
    <div className="forecast-output-renderer">
      <h2>CO-GRI Strategic Forecast Baseline - {companyName}</h2>
      
      <StrategicOutlookTier
        forecast={forecast}
        isExpanded={expandedTiers.tier1}
        onToggle={() => toggleTier('tier1')}
      />

      <ExposureMappingTier
        result={result}
        forecast={forecast}
        companyName={companyName}
        isExpanded={expandedTiers.tier2}
        onToggle={() => toggleTier('tier2')}
      />

      <QuantitativeAnchorsTier
        result={result}
        isExpanded={expandedTiers.tier3}
        onToggle={() => toggleTier('tier3')}
      />
    </div>
  )
}
```

**Acceptance Criteria:**
- Component structure defined
- Type definitions complete
- Ready for tier implementation

---

## DAY 2: Tuesday, January 28 (Tier 1: Strategic Outlook)

### Task 3.3: Implement Strategic Outlook Tier (6 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/components/StrategicOutlookTier.tsx`
- Implement asset class forecasts display
- Implement regional outlook display
- Implement geopolitical events timeline
- Add expand/collapse functionality
- Style according to design specifications

**Deliverables:**
- `StrategicOutlookTier.tsx` component
- Component tests

**Code Template:**
```typescript
// src/components/StrategicOutlookTier.tsx

import React from 'react'
import type { CedarOwlForecast } from '../types/forecast'

interface StrategicOutlookTierProps {
  forecast: CedarOwlForecast
  isExpanded: boolean
  onToggle: () => void
}

export function StrategicOutlookTier({
  forecast,
  isExpanded,
  onToggle
}: StrategicOutlookTierProps) {
  return (
    <div className="tier tier-1">
      <div className="tier-header" onClick={onToggle}>
        <h3>Tier 1: Strategic Outlook</h3>
        <button>{isExpanded ? '▼' : '▶'}</button>
      </div>

      {isExpanded && (
        <div className="tier-content">
          {/* Asset Class Forecasts */}
          <section className="asset-class-forecasts">
            <h4>2026 Asset Class Forecasts</h4>
            <div className="forecast-grid">
              {Object.entries(forecast.assetClassForecasts).map(([key, assetClass]) => (
                <div key={key} className="asset-card">
                  <h5>{assetClass.assetClass}</h5>
                  <div className="return">
                    {assetClass.expectedReturn > 0 ? '+' : ''}
                    {assetClass.expectedReturn}%
                  </div>
                  <div className={`recommendation ${assetClass.recommendation.toLowerCase()}`}>
                    {assetClass.recommendation}
                  </div>
                  <ul className="rationale">
                    {assetClass.rationale.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Regional Outlook */}
          <section className="regional-outlook">
            <h4>Regional Risk & Opportunity Outlook</h4>
            <div className="region-grid">
              {Object.entries(forecast.regionalOutlook).map(([key, region]) => (
                <div key={key} className="region-card">
                  <h5>{region.region}</h5>
                  <div className={`risk-level ${region.riskLevel.toLowerCase()}`}>
                    {region.riskLevel}
                  </div>
                  <div className="key-themes">
                    <strong>Key Themes:</strong>
                    <ul>
                      {region.keyThemes.map((theme, idx) => (
                        <li key={idx}>{theme}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="opportunities">
                    <strong>Opportunities:</strong>
                    <ul>
                      {region.opportunities.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="strategy">
                    <strong>Strategy:</strong> {region.strategy}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Geopolitical Events Timeline */}
          <section className="events-timeline">
            <h4>2026 Geopolitical Events Timeline</h4>
            <div className="timeline">
              {forecast.geopoliticalEvents.map((event, idx) => (
                <div key={idx} className="event-card">
                  <div className="event-header">
                    <h5>{event.event}</h5>
                    <span className="timeline-badge">{event.timeline}</span>
                  </div>
                  <div className="event-meta">
                    <span className="probability">
                      Probability: {(event.probability * 100).toFixed(0)}%
                    </span>
                    <span className={`risk-level ${event.riskLevel.toLowerCase()}`}>
                      {event.riskLevel}
                    </span>
                  </div>
                  <p className="description">{event.description}</p>
                  <div className="investment-impact">
                    <strong>Investment Impact:</strong> {event.investmentImpact}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- All sections implemented
- Data displays correctly
- Responsive design works
- Component tests passing

---

## DAY 3: Wednesday, January 29 (Tier 2: Exposure Mapping)

### Task 3.4: Implement Exposure Mapping Tier (6 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/components/ExposureMappingTier.tsx`
- Implement key risk drivers display
- Implement channel drivers breakdown
- Implement regional contribution display
- Implement net exposure classification
- Add expand/collapse functionality

**Deliverables:**
- `ExposureMappingTier.tsx` component
- Component tests

**Code Template:**
```typescript
// src/components/ExposureMappingTier.tsx

import React from 'react'
import type { ForecastResult } from '../services/forecastEngine'
import type { CedarOwlForecast } from '../types/forecast'

interface ExposureMappingTierProps {
  result: ForecastResult
  forecast: CedarOwlForecast
  companyName: string
  isExpanded: boolean
  onToggle: () => void
}

export function ExposureMappingTier({
  result,
  forecast,
  companyName,
  isExpanded,
  onToggle
}: ExposureMappingTierProps) {
  return (
    <div className="tier tier-2">
      <div className="tier-header" onClick={onToggle}>
        <h3>Tier 2: Exposure Mapping - {companyName}</h3>
        <button>{isExpanded ? '▼' : '▶'}</button>
      </div>

      {isExpanded && (
        <div className="tier-content">
          {/* Key Risk Drivers */}
          <section className="risk-drivers">
            <h4>Key Forecasted Risk Drivers</h4>
            <div className="drivers-list">
              {result.primaryDrivers.map((driver, idx) => (
                <div key={idx} className="driver-card">
                  <span className="rank">#{idx + 1}</span>
                  <span className="driver-text">{driver}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Channel Drivers */}
          <section className="channel-drivers">
            <h4>Channel-Level Impact</h4>
            <div className="channel-grid">
              <div className="channel-card">
                <h5>Revenue</h5>
                <div className={`delta ${result.channelDeltas.revenue >= 0 ? 'positive' : 'negative'}`}>
                  {result.channelDeltas.revenue >= 0 ? '+' : ''}
                  {result.channelDeltas.revenue.toFixed(2)}
                </div>
              </div>
              <div className="channel-card">
                <h5>Supply Chain</h5>
                <div className={`delta ${result.channelDeltas.supplyChain >= 0 ? 'positive' : 'negative'}`}>
                  {result.channelDeltas.supplyChain >= 0 ? '+' : ''}
                  {result.channelDeltas.supplyChain.toFixed(2)}
                </div>
              </div>
              <div className="channel-card">
                <h5>Physical Assets</h5>
                <div className={`delta ${result.channelDeltas.physicalAssets >= 0 ? 'positive' : 'negative'}`}>
                  {result.channelDeltas.physicalAssets >= 0 ? '+' : ''}
                  {result.channelDeltas.physicalAssets.toFixed(2)}
                </div>
              </div>
              <div className="channel-card">
                <h5>Financial</h5>
                <div className={`delta ${result.channelDeltas.financial >= 0 ? 'positive' : 'negative'}`}>
                  {result.channelDeltas.financial >= 0 ? '+' : ''}
                  {result.channelDeltas.financial.toFixed(2)}
                </div>
              </div>
            </div>
          </section>

          {/* Net Exposure Classification */}
          <section className="exposure-classification">
            <h4>Net Exposure Classification</h4>
            <div className="classification-card">
              <div className={`risk-trend ${result.riskTrend.toLowerCase()}`}>
                {result.riskTrend}
              </div>
              <div className="confidence">
                Confidence: {result.confidenceLevel}
              </div>
            </div>
          </section>

          {/* Strategic Implications */}
          <section className="strategic-implications">
            <h4>Strategic Implications</h4>
            <div className="implications-text">
              Based on the forecast, {companyName}'s geopolitical risk is expected to{' '}
              {result.riskTrend === 'DETERIORATING' ? 'increase' : 
               result.riskTrend === 'IMPROVING' ? 'decrease' : 'remain stable'}{' '}
              in 2026, with a CO-GRI delta of {result.cogriDelta >= 0 ? '+' : ''}
              {result.cogriDelta.toFixed(1)} points ({result.percentChange >= 0 ? '+' : ''}
              {result.percentChange.toFixed(1)}%).
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- All sections implemented
- Data displays correctly
- Responsive design works
- Component tests passing

---

## DAY 4: Thursday, January 30 (Tier 3: Quantitative Anchors)

### Task 3.5: Implement Quantitative Anchors Tier (6 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Create `src/components/QuantitativeAnchorsTier.tsx`
- Implement CO-GRI score comparison display
- Implement delta visualization
- Implement channel-level deltas table
- Add expand/collapse functionality

**Deliverables:**
- `QuantitativeAnchorsTier.tsx` component
- Component tests

**Code Template:**
```typescript
// src/components/QuantitativeAnchorsTier.tsx

import React from 'react'
import type { ForecastResult } from '../services/forecastEngine'

interface QuantitativeAnchorsTierProps {
  result: ForecastResult
  isExpanded: boolean
  onToggle: () => void
}

export function QuantitativeAnchorsTier({
  result,
  isExpanded,
  onToggle
}: QuantitativeAnchorsTierProps) {
  return (
    <div className="tier tier-3">
      <div className="tier-header" onClick={onToggle}>
        <h3>Tier 3: Quantitative Anchors</h3>
        <button>{isExpanded ? '▼' : '▶'}</button>
      </div>

      {isExpanded && (
        <div className="tier-content">
          {/* CO-GRI Score Comparison */}
          <section className="cogri-comparison">
            <h4>CO-GRI Score Analysis</h4>
            <div className="comparison-grid">
              <div className="score-card baseline">
                <h5>Structural CO-GRI</h5>
                <div className="score">{result.baselineCOGRI.toFixed(1)}</div>
                <div className="label">Current State</div>
              </div>
              
              <div className="arrow">→</div>
              
              <div className="score-card forecast">
                <h5>Forecast-Adjusted CO-GRI</h5>
                <div className="score">{result.forecastAdjustedCOGRI.toFixed(1)}</div>
                <div className="label">2026 Expected</div>
              </div>
              
              <div className="delta-card">
                <h5>ΔCO-GRI</h5>
                <div className={`delta ${result.cogriDelta >= 0 ? 'increase' : 'decrease'}`}>
                  {result.cogriDelta >= 0 ? '+' : ''}{result.cogriDelta.toFixed(1)}
                </div>
                <div className="percent">
                  ({result.percentChange >= 0 ? '+' : ''}{result.percentChange.toFixed(1)}%)
                </div>
              </div>
            </div>
          </section>

          {/* Channel-Level Deltas */}
          <section className="channel-deltas-table">
            <h4>Channel-Level Impact Breakdown</h4>
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Delta</th>
                  <th>Contribution</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Revenue</td>
                  <td className={result.channelDeltas.revenue >= 0 ? 'positive' : 'negative'}>
                    {result.channelDeltas.revenue >= 0 ? '+' : ''}
                    {result.channelDeltas.revenue.toFixed(2)}
                  </td>
                  <td>
                    {((result.channelDeltas.revenue / result.cogriDelta) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td>Supply Chain</td>
                  <td className={result.channelDeltas.supplyChain >= 0 ? 'positive' : 'negative'}>
                    {result.channelDeltas.supplyChain >= 0 ? '+' : ''}
                    {result.channelDeltas.supplyChain.toFixed(2)}
                  </td>
                  <td>
                    {((result.channelDeltas.supplyChain / result.cogriDelta) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td>Physical Assets</td>
                  <td className={result.channelDeltas.physicalAssets >= 0 ? 'positive' : 'negative'}>
                    {result.channelDeltas.physicalAssets >= 0 ? '+' : ''}
                    {result.channelDeltas.physicalAssets.toFixed(2)}
                  </td>
                  <td>
                    {((result.channelDeltas.physicalAssets / result.cogriDelta) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td>Financial</td>
                  <td className={result.channelDeltas.financial >= 0 ? 'positive' : 'negative'}>
                    {result.channelDeltas.financial >= 0 ? '+' : ''}
                    {result.channelDeltas.financial.toFixed(2)}
                  </td>
                  <td>
                    {((result.channelDeltas.financial / result.cogriDelta) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Methodology Note */}
          <section className="methodology-note">
            <p>
              <strong>Methodology:</strong> CO-GRI Strategic Forecast Baseline applies 
              probability-weighted adjustments from 15 expert analysts to your company's 
              existing exposure profile. Confidence level: {result.confidenceLevel}.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- All sections implemented
- Data displays correctly
- Responsive design works
- Component tests passing

---

## DAY 5: Friday, January 31 (Integration & Testing)

### Task 3.6: Integrate Output Tiers with Strategic Forecast UI (3 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** CRITICAL

**Activities:**
- Update `StrategicForecastUI.tsx` to display output
- Connect forecast engine results to output renderer
- Implement loading states
- Implement error handling

**Deliverables:**
- Updated `StrategicForecastUI.tsx`
- Integration tests

**Acceptance Criteria:**
- Output displays after analysis runs
- Loading states work correctly
- Error handling functional

---

### Task 3.7: Responsive Design Implementation (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Implement responsive CSS for all tiers
- Test on mobile, tablet, desktop
- Fix any layout issues

**Deliverables:**
- Responsive CSS
- Cross-device testing report

**Acceptance Criteria:**
- Works on all screen sizes
- No layout breaking
- Usable on mobile

---

### Task 3.8: Phase 3 Testing & Documentation (2 hours)
**Assignee:** Full-Stack Engineer  
**Priority:** HIGH

**Activities:**
- Run all Phase 3 tests
- Fix any bugs
- Update documentation
- Prepare Phase 4 handoff

**Deliverables:**
- All tests passing
- Updated documentation
- Phase 3 completion report

**Acceptance Criteria:**
- Test coverage >90%
- All tests passing
- Documentation complete
- Ready for Phase 4

---

## PHASE 3 DELIVERABLES CHECKLIST

### Code Files
- [ ] `src/components/ForecastOutputRenderer.tsx`
- [ ] `src/components/StrategicOutlookTier.tsx`
- [ ] `src/components/ExposureMappingTier.tsx`
- [ ] `src/components/QuantitativeAnchorsTier.tsx`
- [ ] `src/components/StrategicForecastUI.tsx` (complete)
- [ ] CSS files for all tiers

### Test Files
- [ ] Component tests for all tiers
- [ ] Integration tests
- [ ] Responsive design tests

### Documentation
- [ ] Output tier documentation
- [ ] UI component documentation
- [ ] Phase 3 completion report

### Quality Metrics
- [ ] Test coverage >90%
- [ ] All tests passing
- [ ] Responsive design verified
- [ ] No critical bugs

---

**Phase 3 Status:** READY TO START  
**Next Phase:** Phase 4 (Testing & Validation)  
**Phase 3 Kickoff:** Monday, January 27, 2026, 9:00 AM
