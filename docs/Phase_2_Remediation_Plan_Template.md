# Phase 2 Remediation Plan Template

**Purpose:** This document provides a structured workflow for addressing root causes identified in the Phase 2.1 diagnostic rerun. Use this template to develop a detailed remediation plan based on the specific issues discovered.

---

## Root Cause Decision Tree

Use the following decision tree to determine the appropriate remediation scenario:

```
START: Phase 2.1 Diagnostic Complete
│
├─ Are pre-routing candidate counts (D1) low for specific vectors?
│  │
│  ├─ YES → **Scenario A: Coverage Gap**
│  │         (Signals never ingested)
│  │
│  └─ NO → Continue
│
├─ Are post-routing counts (D2) significantly different from pre-routing (D1)?
│  │
│  ├─ YES → **Scenario B: Routing Gap**
│  │         (Signals misclassified)
│  │
│  └─ NO → Continue
│
├─ Are suppression rates (D3) high for specific vectors?
│  │
│  ├─ YES → **Scenario C: Scoring Suppression**
│  │         (Signals capped/netted/decayed away)
│  │
│  └─ NO → Continue
│
└─ Multiple factors identified?
   │
   └─ YES → **Scenario D: Combination**
             (Prioritize by impact magnitude)
```

**Instructions:**
1. Review Section D tables (D1–D7) from the diagnostic rerun
2. Identify which scenario(s) apply
3. Follow the corresponding remediation workflow below
4. Document all decisions and changes in a remediation log

---

## Scenario A: Coverage Gap Remediation

**Root Cause:** Certain vectors have low signal volumes because relevant data sources are not integrated into the CSI pipeline.

### Diagnostic Evidence Required

Before proceeding, confirm the following from Section D tables:

| Table | Evidence | Threshold |
|-------|----------|-----------|
| **D1** | Pre-routing candidate counts | <100 candidates/month for vector |
| **D4** | Top detection sources | <3 distinct sources for vector |
| **D5** | Full source registry | Vector not listed in `vectors_supported` for key sources |
| **D7** | Structured vs media balance | <20% structured sources for vector |

**Example:** If Sanctions vector shows only 50 candidates/month in D1, and D4 shows only 2 detection sources (both media), this confirms a coverage gap.

### Remediation Workflow

#### Step 1: Source Gap Analysis (Week 1)

**Objective:** Identify missing data sources for under-covered vectors.

**Tasks:**
1. Review industry-standard sources for the affected vector(s):
   - **Sanctions:** OFAC, UN Sanctions List, EU Sanctions Database, SWIFT exclusions
   - **Trade:** WTO disputes, tariff announcements, trade agreement signings, export controls
   - **Cyber:** CISA alerts, threat intelligence feeds, major breach disclosures, attribution reports
   - **Unrest:** ACLED, GDELT protest data, labor strike databases, civil unrest indices
   - **Currency:** Central bank announcements, IMF reports, currency intervention notices, capital controls

2. Cross-reference against Section D5 (Full Source Registry) to identify gaps

3. Create a prioritized source addition list:

| Vector | Missing Source | Data Type | Estimated Volume | Priority | Integration Complexity |
|--------|---------------|-----------|------------------|----------|----------------------|
| Sanctions | OFAC SDN List | Structured | ~50 updates/month | High | Low (API available) |
| Cyber | CISA Alerts | Structured | ~100 alerts/month | High | Medium (RSS feed) |
| Trade | WTO Disputes | Structured | ~20 disputes/month | Medium | Medium (web scraping) |

**Deliverable:** Source Gap Analysis Report (max 3 pages)

#### Step 2: Source Integration (Weeks 2-4)

**Objective:** Add prioritized sources to the data pipeline.

**Tasks:**
1. For each prioritized source:
   - Develop data connector (API, RSS, web scraper, manual upload)
   - Map source fields to CSI schema (title, date, country, vector, severity)
   - Implement data validation (schema compliance, deduplication)
   - Add to ingestion schedule (real-time, daily, weekly)

2. Test integration:
   - Verify data flows into pre-routing stage (visible in D1 counts)
   - Confirm no pipeline errors or data corruption
   - Validate country mapping (ISO3 codes)

3. Document integration:
   - Update source registry (D5)
   - Add source to data dictionary
   - Create runbook for source maintenance

**Deliverable:** Source Integration Report with test results

#### Step 3: Volume Validation (Week 5)

**Objective:** Confirm that new sources increase candidate volumes to acceptable levels.

**Tasks:**
1. Rerun Section D1 (Pre-routing Candidate Inventory) for affected vectors
2. Compare pre- and post-integration volumes:

| Vector | Pre-Integration Candidates/Month | Post-Integration Candidates/Month | Target | Status |
|--------|--------------------------------|----------------------------------|--------|--------|
| Sanctions | 50 | 180 | >100 | ✅ Pass |
| Cyber | 75 | 220 | >100 | ✅ Pass |

3. If volumes remain low, repeat Step 1-2 with additional sources

**Acceptance Criteria:**
- All vectors show >100 candidates/month in D1
- All vectors have ≥3 distinct detection sources in D4
- Source concentration (D6) shows no vector with >50% items from single source

**Deliverable:** Volume Validation Report

#### Step 4: Baseline Refresh (Week 6)

**Objective:** Update baseline factors to incorporate new sources.

**Tasks:**
1. Recompute baseline factors for affected vectors using new sources
2. Validate baseline integrity (Section B tables)
3. Confirm reduction in `% neutral_50` and `% regional_avg` fallback rates
4. Update baseline source attribution (B3)

**Deliverable:** Baseline Refresh Report

### Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Source Gap Analysis | 1 week | Section D diagnostic complete |
| Source Integration | 3 weeks | Gap analysis approved, API access secured |
| Volume Validation | 1 week | Integration complete |
| Baseline Refresh | 1 week | Volume validation passed |
| **Total** | **6 weeks** | — |

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API access denied | Medium | High | Identify alternative sources upfront |
| Data quality issues | High | Medium | Implement robust validation and cleansing |
| Integration delays | Medium | Medium | Prioritize high-impact sources first |
| Baseline instability | Low | High | Run parallel baselines, validate before cutover |

---

## Scenario B: Routing Gap Remediation

**Root Cause:** Signals are being ingested but misclassified into incorrect vectors (typically Governance or Conflict).

### Diagnostic Evidence Required

| Table | Evidence | Threshold |
|-------|----------|-----------|
| **D1 vs D2** | Pre-routing vs post-routing discrepancy | >30% of candidates routed to wrong vector |
| **E1** | Confusion sample | >10% of sampled items misrouted |
| **D2** | Post-routing distribution | Governance + Conflict >60% of total |

**Example:** If D1 shows 200 Sanctions candidates but D2 shows only 50 routed to Sanctions (and 120 routed to Governance), this confirms a routing gap.

### Remediation Workflow

#### Step 1: Classifier Audit (Week 1)

**Objective:** Identify patterns in misrouted items.

**Tasks:**
1. Extract confusion sample (Section E) and expand to 200 items:
   - 50 items routed to Governance (should be other vectors)
   - 50 items routed to Conflict (should be other vectors)
   - 100 items routed correctly (control group)

2. Manual review by domain experts:
   - Annotate correct vector for each item
   - Identify common misrouting patterns (keywords, phrases, source types)

3. Analyze classifier features:
   - Review keyword lists for each vector
   - Check for overlapping keywords (e.g., "sanctions" appearing in Governance keywords)
   - Identify missing keywords (e.g., "OFAC" not in Sanctions keywords)

**Deliverable:** Classifier Audit Report with annotated confusion sample

#### Step 2: Keyword and Rule Refinement (Week 2)

**Objective:** Update classifier rules to reduce misrouting.

**Tasks:**
1. Update vector-specific keyword lists:
   - Add missing keywords identified in audit
   - Remove ambiguous keywords causing false positives
   - Adjust keyword weights/priorities

2. Implement disambiguation rules:
   - Example: "military aid" → Conflict (not Governance) if context includes "weapons" or "defense"
   - Example: "trade sanctions" → Sanctions (not Trade) if context includes "embargo" or "restrictions"

3. Add source-based routing hints:
   - Example: Items from OFAC → strongly favor Sanctions vector
   - Example: Items from ACLED → strongly favor Unrest vector

**Deliverable:** Updated Classifier Configuration

#### Step 3: Retraining (If ML-Based Classifier) (Weeks 3-4)

**Objective:** Retrain classifier on corrected labels.

**Tasks:**
1. Prepare training dataset:
   - Use annotated confusion sample (200 items) as seed
   - Expand with historical items (last 12 months)
   - Balance classes (equal representation per vector)

2. Retrain classifier:
   - Use same architecture as current classifier
   - Validate on held-out test set (20% of data)
   - Target accuracy: ≥95% per vector

3. A/B test:
   - Run old and new classifiers in parallel for 1 week
   - Compare routing distributions (D2)
   - Validate no regression in currently well-routed vectors

**Deliverable:** Retrained Classifier Model with validation report

#### Step 4: Routing Validation (Week 5)

**Objective:** Confirm routing improvements.

**Tasks:**
1. Rerun Section D2 (Post-routing Distribution) with new classifier
2. Compare pre- and post-remediation routing:

| Vector | Pre-Remediation % | Post-Remediation % | Target | Status |
|--------|------------------|-------------------|--------|--------|
| Sanctions | 8% | 14% | >12% | ✅ Pass |
| Governance | 35% | 22% | <25% | ✅ Pass |
| Conflict | 28% | 20% | <25% | ✅ Pass |

3. Rerun Section E (Confusion Sample) with new classifier
4. Validate accuracy: ≥90% correct routing in confusion sample

**Acceptance Criteria:**
- No vector shows <10% post-routing share (unless legitimately low volume)
- Governance + Conflict combined <50% of total
- Confusion sample accuracy ≥90%

**Deliverable:** Routing Validation Report

### Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Classifier Audit | 1 week | Section D, E diagnostics complete |
| Keyword/Rule Refinement | 1 week | Audit complete |
| Retraining (if ML) | 2 weeks | Training data prepared |
| Routing Validation | 1 week | New classifier deployed |
| **Total** | **5 weeks** | — |

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Overfitting to confusion sample | Medium | Medium | Use larger training set, cross-validation |
| Regression in other vectors | Medium | High | A/B testing, gradual rollout |
| Ambiguous items | High | Low | Implement multi-vector tagging for borderline cases |

---

## Scenario C: Scoring Suppression Remediation

**Root Cause:** Signals are ingested and routed correctly but contribute minimally to CSI due to aggressive capping, netting, or decay.

### Diagnostic Evidence Required

| Table | Evidence | Threshold |
|-------|----------|-----------|
| **D3** | Suppression rates | >40% of items capped/netted/decayed for vector |
| **D3** | Mean drift/event per item | <0.5 points per item |
| **C2/C3** | Realized drift/event shares | <5% for vector despite adequate routing |

**Example:** If D2 shows 150 Cyber items routed correctly, but D3 shows 60% are netted away and mean drift per item is 0.3 points, this confirms scoring suppression.

### Remediation Workflow

#### Step 1: Parameter Review (Week 1)

**Objective:** Identify which scoring parameters are causing suppression.

**Tasks:**
1. Review current parameter settings:

| Parameter | Current Value | Purpose | Potential Issue |
|-----------|--------------|---------|-----------------|
| `max_drift_per_item` | 2.0 | Cap individual drift contributions | May be too low for high-severity signals |
| `netting_window_days` | 7 | Prevent double-counting overlapping signals | May be too aggressive for slow-burn escalations |
| `decay_half_life_days` | 14 | Reduce impact of old signals | May decay too quickly for persistent risks |
| `vector_cap_multiplier` | 1.5 | Limit total vector contribution | May suppress legitimate spikes |

2. Analyze suppression by parameter type (from D3):

| Vector | % Capped | % Netted | % Decayed | Dominant Suppression Type |
|--------|----------|----------|-----------|---------------------------|
| Cyber | 15% | 45% | 20% | Netting |
| Unrest | 25% | 30% | 15% | Capping |
| Currency | 10% | 20% | 50% | Decay |

3. Identify parameter tuning targets:
   - If netting dominates: Review netting window and similarity threshold
   - If capping dominates: Review max_drift_per_item and vector_cap_multiplier
   - If decay dominates: Review decay_half_life_days and decay curve shape

**Deliverable:** Parameter Review Report

#### Step 2: Sensitivity Analysis (Week 2)

**Objective:** Model impact of parameter changes on CSI behavior.

**Tasks:**
1. Run historical replay with parameter variations:
   - Baseline: Current parameters
   - Scenario 1: Increase max_drift_per_item by 50%
   - Scenario 2: Increase netting_window_days by 50%
   - Scenario 3: Increase decay_half_life_days by 50%
   - Scenario 4: Combination of above

2. Measure impact on key metrics:

| Scenario | Mean CSI_total | Drift Ratio | Event Ratio | Cyber Drift Share | Unrest Drift Share | Spike Count |
|----------|---------------|-------------|-------------|-------------------|-------------------|-------------|
| Baseline | 58.2 | 5.3% | 4.8% | 8% | 10% | 45 |
| Scenario 1 | 61.5 | 7.1% | 5.2% | 11% | 14% | 52 |
| Scenario 2 | 59.8 | 6.2% | 5.0% | 9% | 12% | 48 |

3. Validate against known events:
   - Ensure parameter changes improve recall of known spikes (Section G)
   - Ensure no false positives (spurious spikes)

**Deliverable:** Sensitivity Analysis Report with recommended parameter settings

#### Step 3: Parameter Tuning (Week 3)

**Objective:** Implement recommended parameter changes.

**Tasks:**
1. Update scoring engine configuration:
   - Modify parameter values based on sensitivity analysis
   - Document rationale for each change
   - Version control configuration files

2. Implement parameter validation:
   - Add unit tests for new parameter ranges
   - Add integration tests for scoring edge cases
   - Add monitoring for suppression rates

3. Deploy to staging environment:
   - Run full historical replay (24 months)
   - Validate against acceptance criteria (below)

**Deliverable:** Updated Scoring Configuration

#### Step 4: Scoring Validation (Week 4)

**Objective:** Confirm scoring improvements.

**Tasks:**
1. Rerun Section D3 (Suppression Rates) with new parameters
2. Compare pre- and post-tuning suppression:

| Vector | Pre-Tuning % Suppressed | Post-Tuning % Suppressed | Target | Status |
|--------|------------------------|-------------------------|--------|--------|
| Cyber | 80% | 45% | <50% | ✅ Pass |
| Unrest | 70% | 40% | <50% | ✅ Pass |

3. Rerun Section C2/C3 (Realized Drift/Event Shares)
4. Validate vector balance: No vector <5% drift share (unless legitimately low volume)

**Acceptance Criteria:**
- Suppression rates <50% for all vectors
- Drift ratio (C1) increases to >8%
- Event ratio (C1) increases to >7%
- All vectors show ≥5% realized drift share (or justified exception)

**Deliverable:** Scoring Validation Report

### Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Parameter Review | 1 week | Section D3 diagnostic complete |
| Sensitivity Analysis | 1 week | Historical data available |
| Parameter Tuning | 1 week | Recommended settings approved |
| Scoring Validation | 1 week | Tuning deployed to staging |
| **Total** | **4 weeks** | — |

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-tuning (false positives) | Medium | High | Validate against known events, use conservative adjustments |
| Parameter interactions | High | Medium | Test combinations, not just individual parameters |
| Baseline instability | Low | High | Monitor baseline_ratio (C1) to ensure it remains ~85-90% |

---

## Scenario D: Combination Remediation

**Root Cause:** Multiple factors contribute to vector imbalance (coverage + routing + scoring).

### Prioritization Framework

When multiple root causes are identified, prioritize remediation by impact magnitude:

#### Step 1: Quantify Contribution of Each Factor (Week 1)

**Objective:** Determine which factor has the largest impact on vector imbalance.

**Method:**
1. **Coverage Impact:** Calculate potential volume increase if coverage gaps are filled
   - Example: If Sanctions has 50 candidates/month and industry standard sources provide 150 candidates/month, potential increase = 200%

2. **Routing Impact:** Calculate potential share increase if routing is corrected
   - Example: If 40% of Sanctions candidates are misrouted to Governance, potential increase = 67%

3. **Scoring Impact:** Calculate potential contribution increase if suppression is reduced
   - Example: If 60% of Sanctions items are netted away, potential increase = 150%

4. **Rank by impact:**

| Factor | Affected Vectors | Potential Impact | Priority |
|--------|-----------------|------------------|----------|
| Routing Gap | Sanctions, Cyber, Unrest | 67% average increase | 1 (High) |
| Scoring Suppression | Cyber, Currency | 150% average increase | 2 (High) |
| Coverage Gap | Trade, Unrest | 50% average increase | 3 (Medium) |

**Deliverable:** Impact Quantification Report

#### Step 2: Sequential Remediation (Weeks 2-10)

**Objective:** Address factors in priority order, validating after each step.

**Workflow:**
1. **Phase 1 (Weeks 2-6):** Address highest-priority factor using corresponding scenario workflow
   - Example: If routing gap is highest priority, follow Scenario B workflow

2. **Interim Validation (Week 7):**
   - Rerun Section D diagnostics
   - Measure improvement in affected vectors
   - Reassess remaining factors

3. **Phase 2 (Weeks 8-10):** Address second-priority factor
   - Use updated baseline from Phase 1
   - Validate no regression in Phase 1 improvements

4. **Phase 3 (if needed):** Address third-priority factor

**Decision Rule:** After each phase, if all vectors show ≥10% realized drift share and suppression rates <50%, remediation is complete. Otherwise, proceed to next phase.

**Deliverable:** Sequential Remediation Report

### Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Impact Quantification | 1 week | Section D diagnostic complete |
| Phase 1 Remediation | 4-6 weeks | Priority determined |
| Interim Validation | 1 week | Phase 1 complete |
| Phase 2 Remediation (if needed) | 3-5 weeks | Interim validation passed |
| **Total** | **9-13 weeks** | — |

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Factor interactions | High | High | Validate after each phase, adjust priorities if needed |
| Remediation fatigue | Medium | Medium | Celebrate interim wins, maintain clear roadmap |
| Scope creep | Medium | Medium | Stick to prioritized factors, defer low-impact items |

---

## Quality Assurance Checkpoints

Throughout all remediation scenarios, the following checkpoints must be completed:

### Checkpoint 1: Baseline Integrity (After Any Data/Routing Changes)

**Validation:**
- Rerun Section B (Baseline Factor Decomposition)
- Confirm baseline_ratio (C1) remains 85-92%
- Confirm no vector shows >30% `% neutral_50` fallback rate
- Confirm baseline_total distribution is plausible (no extreme outliers)

**Gate:** Baseline integrity must pass before proceeding to next remediation phase.

### Checkpoint 2: Routing Accuracy (After Routing Changes)

**Validation:**
- Rerun Section E (Confusion Sample) with 100 items
- Confirm ≥90% routing accuracy
- Confirm no vector shows >20% false positive rate

**Gate:** Routing accuracy must pass before proceeding to scoring validation.

### Checkpoint 3: Scoring Plausibility (After Scoring Changes)

**Validation:**
- Rerun Section G (Spikes) and validate against known events
- Confirm no spurious spikes (false positives)
- Confirm recall of major events ≥80%

**Gate:** Scoring plausibility must pass before production deployment.

### Checkpoint 4: Source Health (After Coverage Changes)

**Validation:**
- Rerun Section D5 (Full Source Registry)
- Confirm no source shows >180 days stale
- Confirm no vector depends on <3 distinct sources
- Confirm source concentration (D6) Gini coefficient <0.6

**Gate:** Source health must pass before marking remediation complete.

---

## Rollback Procedures

If remediation introduces regressions or instability, follow these rollback procedures:

### Immediate Rollback (Within 24 Hours)

**Trigger:** Critical issue detected (e.g., CSI values become negative, pipeline crashes, data corruption)

**Procedure:**
1. Revert to previous configuration (version control)
2. Restart services with old configuration
3. Validate system returns to pre-remediation state
4. Notify stakeholders of rollback

### Staged Rollback (Within 1 Week)

**Trigger:** Non-critical regression detected (e.g., one vector shows unexpected behavior, minor accuracy drop)

**Procedure:**
1. Isolate affected component (coverage, routing, or scoring)
2. Revert only that component to previous state
3. Validate other components remain functional
4. Root cause analysis of regression
5. Develop fix and retest before redeployment

### Rollback Validation

After any rollback:
- Rerun Section D diagnostics to confirm return to baseline
- Document root cause of regression
- Update remediation plan to prevent recurrence

---

## Documentation Requirements

Throughout remediation, maintain the following documentation:

### Remediation Log

**Format:** Markdown table

| Date | Action | Rationale | Outcome | Validated By |
|------|--------|-----------|---------|--------------|
| 2024-03-15 | Added OFAC source | Coverage gap in Sanctions | +120 candidates/month | David (Data Analyst) |
| 2024-03-22 | Updated Sanctions keywords | Routing gap (40% misrouted) | Routing accuracy 92% → 95% | Mike (Strategic Advisor) |

### Configuration Change Log

**Format:** Git commit messages with detailed descriptions

```
commit: Add OFAC SDN List integration
date: 2024-03-15
author: David (Data Analyst)
description: |
  Integrated OFAC Specially Designated Nationals (SDN) List as new detection source for Sanctions vector.
  - API endpoint: https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV
  - Update frequency: Daily
  - Expected volume: ~50 updates/month
  - Mapping: OFAC program → Sanctions vector, country field → ISO3
  - Validation: Deduplication by entity name + date
```

### Validation Reports

**Format:** PDF with tables and charts

**Required Sections:**
- Executive Summary (1 page)
- Diagnostic Results (Section D tables)
- Before/After Comparison
- Acceptance Criteria Status
- Recommendations

---

## Success Metrics

Remediation is considered successful when the following metrics are achieved:

### Primary Metrics (Must Pass All)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Vector Balance** | All vectors ≥10% realized drift share | Section C2 |
| **Suppression Rates** | All vectors <50% suppressed | Section D3 |
| **Routing Accuracy** | ≥90% correct routing | Section E |
| **Source Health** | All vectors ≥3 distinct sources | Section D4 |
| **Baseline Integrity** | baseline_ratio 85-92% | Section C1 |

### Secondary Metrics (Desirable)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Drift Ratio** | >8% | Section C1 |
| **Event Ratio** | >7% | Section C1 |
| **Spike Recall** | ≥80% of known events | Section G |
| **Source Concentration** | Gini <0.6 | Section D6 |

---

## Appendices

### Appendix A: Parameter Definitions

| Parameter | Definition | Typical Range | Impact |
|-----------|-----------|---------------|--------|
| `max_drift_per_item` | Maximum drift contribution per signal | 1.0 - 5.0 | Higher = more sensitive to individual signals |
| `netting_window_days` | Time window for deduplicating overlapping signals | 3 - 14 days | Higher = more aggressive deduplication |
| `decay_half_life_days` | Time for signal impact to decay by 50% | 7 - 30 days | Higher = longer-lasting impact |
| `vector_cap_multiplier` | Multiplier on baseline for vector contribution cap | 1.2 - 2.0 | Higher = allows larger spikes |

### Appendix B: Common Misrouting Patterns

| Pattern | Example | Correct Vector | Common Misroute | Fix |
|---------|---------|---------------|----------------|-----|
| Sanctions disguised as governance | "New anti-corruption law targets oligarchs" | Sanctions | Governance | Add "oligarch," "targeted" to Sanctions keywords |
| Cyber disguised as conflict | "Military systems hacked in ongoing conflict" | Cyber | Conflict | Add "hacked," "breach" to Cyber keywords with high weight |
| Trade disguised as sanctions | "Export controls on semiconductor technology" | Trade | Sanctions | Disambiguate "export controls" based on context (goods vs entities) |

### Appendix C: Source Recommendations by Vector

| Vector | Recommended Sources | Type | Update Frequency |
|--------|-------------------|------|------------------|
| **Sanctions** | OFAC SDN, UN Sanctions, EU Sanctions | Structured | Daily |
| **Trade** | WTO disputes, USTR reports, trade agreement texts | Structured | Weekly |
| **Cyber** | CISA alerts, threat intel feeds (e.g., Recorded Future) | Structured | Real-time |
| **Unrest** | ACLED, GDELT, labor strike databases | Structured | Daily |
| **Currency** | Central bank announcements, IMF reports | Structured | Weekly |
| **Governance** | World Bank governance indicators, Transparency International | Structured | Quarterly |
| **Conflict** | UCDP, ACLED, conflict databases | Structured | Daily |

---

**Document Control:**
- **Version:** 1.0
- **Date Issued:** [Current Date]
- **Next Review:** After Phase 2.1 diagnostic rerun
- **Classification:** Internal — Project Team Only