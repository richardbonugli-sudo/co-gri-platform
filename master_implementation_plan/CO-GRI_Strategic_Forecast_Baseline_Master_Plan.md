# CO-GRI Strategic Forecast Baseline
## Master Implementation Plan

**Document Version:** 1.0  
**Date:** January 8, 2026  
**Status:** Production-Ready  
**Prepared By:** Strategic Analysis Team  

---

## EXECUTIVE SUMMARY

### Strategic Recommendation: PROCEED WITH INTEGRATION - HIGH STRATEGIC VALUE

The CedarOwl Integrated Geopolitical Gurus Risk Forecast represents a high-quality, expert-driven geopolitical intelligence product that will significantly enhance the Predictive Analysis service.

**Key Decision:** Implement as separate **analysis mode**, NOT as event type.

**Investment:** 3-4 weeks, ~$24,000  
**Expected ROI:** $315K annual revenue (1,312% first year ROI)  
**Risk Level:** LOW

---

## PART 1: STRATEGIC FOUNDATION

### 1.1 Business Case
- **Value Proposition:** Only platform with predictive + reactive geopolitical risk analysis
- **Market Differentiation:** Forward-looking (6-12 months) vs reactive scenario modeling
- **Expert-Driven:** 15 leading analysts, 195 countries, 85% confidence
- **Revenue Potential:** $315K Year 1, $1.67M over 3 years

### 1.2 CedarOwl Forecast Analysis
- **Coverage:** 195 countries, 6 major events, 4 regions, 6 asset classes
- **Key Events:** US-Venezuela (95%), New START expiry (100%), US-China tech decoupling (80%)
- **Asset Classes:** Gold +15%, Commodities +12%, EM Equities +10%, Bonds -2%
- **Data Quality:** HIGH - suitable for integration

---

## PART 2: ARCHITECTURAL DESIGN

### 2.1 Core Decision: Mode vs. Event Type

**DECISION:** Implement as separate mode, NOT event type

**Two Analysis Modes:**
1. **Event-Driven Scenario** (existing) - "What if X happens?"
2. **Strategic Forecast Baseline** (new) - "What will happen?"

**Rationale:**
- Different analytical questions require different input/output contracts
- Prevents architectural complexity
- Clear user experience
- Maintains methodological integrity

### 2.2 Integration Model

**Current:** User Input → Scenario Engine → CO-GRI Calculator → Output

**NEW:** Mode Selector → [Event Path OR Forecast Path] → CO-GRI Calculator → Outputs

**Key Components:**
- Mode Selector (NEW)
- Forecast Engine (NEW)
- 3-Tier Output Renderer (NEW)
- CO-GRI Calculator (minor modification)

### 2.3 Required Guardrails

1. **No new exposure inference** - Apply forecast only to existing company exposures
2. **Additive CSI deltas only** - Don't replace structural CSI components
3. **Existing exposure only** - No phantom exposure to countries without business presence
4. **Expected path, not stress** - Probability-weighted, not full-severity shock
5. **No dense propagation** - Respect company's specific exposure profile
6. **Clear labeling** - "Strategic Forecast Baseline — Probability-Weighted Expected Path"

---

## PART 3: TECHNICAL SPECIFICATION

### 3.1 Input Contract

**User Inputs (Simplified):**
- Analysis scope: Company / Sector / Portfolio
- (No event parameters - system-defined)

**System Inputs (From CedarOwl):**
- Forecasted events (6 major events)
- Country CSI deltas (195 countries)
- Sector multipliers (Technology 1.25x, Energy 1.40x, Defense 1.60x)
- Regional risk premiums (Europe 1.12, Middle East 1.35, Asia-Pacific 0.92)
- Expert confidence (85%)

### 3.2 Output Contract (3-Tier Structure)

**Tier 1: Strategic Outlook**
- Asset-class implications (Gold +15%, EM Equities +10%)
- Regional risk & opportunity outlook
- Geopolitical events timeline

**Tier 2: Exposure Mapping**
- Key forecasted risk drivers
- Channel drivers (supply chain, revenue, assets, financial)
- Regional contribution
- Net exposure classification
- Strategic implications

**Tier 3: Quantitative Anchors**
- Structural CO-GRI score
- Forecast-adjusted CO-GRI score
- ΔCO-GRI
- Channel-level deltas

### 3.3 UI Behavior

**Mode Selector:** Top of page, radio buttons, clear descriptions

**Strategic Forecast Mode:**
- HIDE: Event type, actor/target country, severity, propagation mode
- SHOW: Analysis scope, forecast parameters (read-only), informational advanced options
- 3-tier output display

**Advanced Options:** Read-only/informational (no user customization)

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Data Modeling (Week 1)
- Parse CedarOwl forecast into structured data
- Create country adjustment mappings (195 countries)
- Build geopolitical event timeline
- Define regional risk premiums

**Deliverables:**
- `cedarOwlForecast2026.ts` data file
- Country adjustment mappings
- Event timeline data structure

### Phase 2: Mode Architecture (Week 2)
- Implement mode selector UI
- Create forecast engine
- Implement guardrails
- Modify CO-GRI calculator (add optional forecast parameter)

**Deliverables:**
- `ModeSelector.tsx` component
- `forecastEngine.ts` service
- Guardrail enforcement logic
- Updated `cogriCalculator.ts`

### Phase 3: Output Tiers (Week 3)
- Design 3-tier output UI
- Implement Tier 1: Strategic Outlook
- Implement Tier 2: Exposure Mapping
- Implement Tier 3: Quantitative Anchors

**Deliverables:**
- `ForecastOutputRenderer.tsx` component
- `StrategicOutlookTier.tsx`
- `ExposureMappingTier.tsx`
- `QuantitativeAnchorsTier.tsx`

### Phase 4: Testing & Validation (Week 4)
- Unit tests (guardrails, forecast logic)
- Integration tests (mode switching, data flow)
- End-to-end tests (Apple example, other companies)
- Performance testing
- Documentation

**Deliverables:**
- Test suite (>90% coverage)
- Performance benchmarks
- User documentation
- Technical documentation

---

## PART 5: RISK MANAGEMENT

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Forecast data quality | LOW | HIGH | Validate against multiple sources |
| Update delays | MEDIUM | MEDIUM | Staleness warnings, use last forecast |
| Calculation complexity | LOW | MEDIUM | Comprehensive unit tests |
| Performance impact | LOW | LOW | Static forecast data |
| User confusion | MEDIUM | MEDIUM | Clear documentation, tutorials |

**Overall Technical Risk: LOW**

### Strategic Risks

| Risk | Mitigation |
|------|------------|
| Forecast accuracy | Display confidence levels, track accuracy |
| Update frequency | Quarterly updates, staleness warnings |
| Complexity | Clear UI/UX, tutorials, simplified views |
| Licensing | Verify terms, negotiate rights |

---

## PART 6: SUCCESS CRITERIA

### Technical Success
- ✅ Mode selector functional
- ✅ Guardrails enforced
- ✅ 3-tier outputs display correctly
- ✅ Apple example validates correctly
- ✅ Performance <2s response time

### Business Success
- ✅ 30-40% adoption rate
- ✅ $315K+ annual revenue
- ✅ NPS >50
- ✅ Competitive differentiation achieved

---

## APPENDICES

### Appendix A: Sample Data Structure

```typescript
export const CEDAROWL_FORECAST_2026 = {
  metadata: {
    forecastPeriod: '2026-01-01 to 2026-12-31',
    publishDate: '2026-01-07',
    expertSources: 15,
    overallConfidence: 0.85
  },
  countryAdjustments: {
    'Germany': { delta: -3.5, outlook: 'UNDERPERFORM' },
    'Poland': { delta: +4.2, outlook: 'OUTPERFORM' },
    'China': { delta: +2.8, outlook: 'OVERWEIGHT' }
  },
  geopoliticalEvents: [
    {
      event: 'US-China Tech Decoupling',
      timeline: '2026-09',
      probability: 0.80,
      riskLevel: 'HIGH'
    }
  ],
  sectorMultipliers: {
    'Technology': 1.25,
    'Energy': 1.40,
    'Defense': 1.60
  }
}
```

### Appendix B: File Structure

```
src/
├── components/
│   ├── ModeSelector.tsx (NEW)
│   ├── ForecastOutputRenderer.tsx (NEW)
│   └── EventScenarioUI.tsx (existing)
├── services/
│   ├── forecastEngine.ts (NEW)
│   └── cogriCalculator.ts (modified)
├── data/
│   └── cedarOwlForecast2026.ts (NEW)
└── pages/
    └── PredictiveAnalysis.tsx (modified)
```

---

## CONCLUSION

**Final Recommendation: PROCEED WITH INTEGRATION**

**Score: 9.3/10 (Highly Recommended)**

**Rationale:**
1. ✅ High strategic value - market differentiation
2. ✅ Strong data quality - 15 expert sources
3. ✅ Natural fit - aligns with CO-GRI methodology
4. ✅ Manageable complexity - 3-4 weeks, low risk
5. ✅ Clear ROI - $315K Year 1, 1,312% ROI
6. ✅ User demand - addresses proactive planning needs

**Next Steps:**
1. Approve integration recommendation
2. Assign engineering resources
3. Kick off Phase 1 (Data Modeling)
4. Begin 4-week implementation timeline

---

**Document Status:** COMPLETE - Ready for Implementation
**Prepared By:** Strategic Analysis Team
**Date:** January 8, 2026
