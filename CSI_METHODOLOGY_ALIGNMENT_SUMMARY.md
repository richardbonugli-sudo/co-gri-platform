# CSI Methodology Alignment - Implementation Summary

## Overview
This document summarizes the comprehensive refactoring of the CSI (Country Shock Index) engine to align with the updated CSI methodology as defined in Appendix B and the refinements document.

**Implementation Date:** 2026-02-09  
**Status:** Phase 1 Complete - Foundation and Core Architecture

---

## Key Changes Implemented

### 1. Risk Factor Architecture (Critical Structural Change)

**Before:** Generic domains (political, economic, environmental, etc.)  
**After:** Seven CSI Geopolitical Risk Factors

#### The Seven CSI Risk Factors:
1. **Conflict & Security** - Military conflicts, border tensions, security threats
2. **Sanctions & Regulatory Pressure** - International sanctions, regulatory changes
3. **Trade & Logistics Disruption** - Tariffs, trade barriers, supply chain issues
4. **Governance & Rule of Law** - Political stability, corruption, institutional quality
5. **Cyber & Data Sovereignty** - Cybersecurity threats, data protection issues
6. **Public Unrest & Civil Stability** - Protests, civil unrest, social tensions
7. **Currency & Capital Controls** - FX restrictions, capital flow limitations

**Impact:**
- Eliminated macroeconomic contamination (GDP, inflation, debt)
- Eliminated environmental contamination (climate, natural disasters)
- Enabled factor-specific signal routing and netting
- Improved auditability with clear factor attribution

---

### 2. Updated Definition

**New Definition:**
> The Country Shock Index (CSI) measures the current level of geopolitical stress being priced in for a country, implied by both realized events and near-term escalation signals, weighted by probability, severity, and relevance, and constrained to a rolling near-term horizon.

**Key Properties:**
- ✅ Expectation-weighted (not purely reactive)
- ✅ Near-term focused
- ✅ Dynamic and directional (captures escalation and de-escalation)
- ✅ Auditable with explicit component separation

---

### 3. Structural Baseline Engine Enhancements

**Changes:**
- Per-factor baseline calculation (no pooled composite)
- Factor-specific source mappings from Appendix B
- Quarterly update cadence (slow-moving anchors)
- Baseline does NOT react to individual events
- Source role enforcement (BASELINE sources only)

**Source Mappings (Examples):**
- Conflict & Security: UCDP Conflict Index, Global Peace Index
- Sanctions: OFAC Sanctions List, UN Sanctions Database
- Trade: WTO Trade Restrictions, World Bank LPI
- Governance: World Governance Indicators, Transparency CPI

**Validation:**
- Excludes macroeconomic indicators
- Excludes environmental variables
- All sources must have BASELINE role

---

### 4. Escalation Drift Engine Enhancements

**Changes:**
- Factor-scoped drift calculation
- Every signal assigned to exactly ONE risk factor
- Per-factor drift caps (1.0 CSI points per factor per 30 days)
- No cross-factor drift accumulation
- Source role enforcement (DETECTION sources only)
- Probability remains expectation-based (not frequency-based)

**Constraints:**
- Max drift per signal: 0.25 CSI points
- Max cumulative drift per factor per 30 days: 1.0 CSI points
- Escalation rate: 2x de-escalation rate (asymmetric)

**Formula:**
```
Escalation_Drift_Factor = Σ(Signal × Probability × Persistence × Recency × Decay)
```

---

### 5. Event Delta Engine Enhancements

**Changes:**
- Factor-scoped event delta calculation
- Events inherit risk factor from confirming signals
- Netting only within same factor (no cross-factor netting)
- Source role enforcement (CONFIRMATION sources only)
- Enhanced audit trail with factor breakdown

**Netting Rules:**
- Event confirmation nets out prior drift from SAME FACTOR ONLY
- Cross-factor netting is prohibited
- Preserves causal consistency

---

### 6. Netting Engine Enhancements

**Changes:**
- Factor-scoped netting clusters
- Hard constraint: signals netted only if same country AND same factor
- Factor-specific netting rules
- Enhanced validation for cross-factor prevention

**Netting Strategies:**
- MAX: Use maximum contribution (most conservative)
- AVERAGE: Use average contribution
- WEIGHTED: Weight by corroboration count
- DIMINISHING: Diminishing returns (first signal full, subsequent discounted)

---

### 7. Source Role Enforcement

**Three Distinct Roles:**

1. **BASELINE Sources**
   - Provide structural baseline data only
   - Cannot generate signals or confirm events
   - Examples: WGI, UCDP, IMF AREAER

2. **DETECTION Sources**
   - Generate escalation signals only
   - Cannot confirm events
   - Examples: News feeds, social media monitoring, expert analysis

3. **CONFIRMATION Sources**
   - Validate/confirm events only
   - Cannot generate signals
   - Examples: Official government announcements, verified news agencies

**Validation:** System enforces that no source serves multiple roles

---

### 8. Confidence Scoring (Metadata Only)

**Critical Constraint:**
> Confidence is an epistemic metadata attribute only and must never scale, cap, or otherwise alter CSI baseline, drift, or event delta calculations.

**Confidence Reflects:**
- Source reliability
- Authority level
- Corroboration quality

**Usage:**
- UI flags and interpretation
- Audit transparency
- Risk communication
- **NEVER affects CSI calculation**

---

### 9. Enhanced Audit Trail

**New Audit Trail Includes:**

1. **Component Breakdown**
   - Baseline contribution
   - Drift contribution
   - Event contribution

2. **Factor Contributions** (for each of 7 factors)
   - Baseline by factor
   - Drift by factor
   - Events by factor
   - Total by factor

3. **Active Signals Detail**
   - Signal ID
   - Risk factor
   - Contribution
   - Probability
   - Decay status

4. **Active Events Detail**
   - Event ID
   - Risk factor
   - Base impact
   - Netted impact
   - Current impact (after decay)

5. **Netting Information**
   - Netting applied (yes/no)
   - Netting reduction amount
   - Clusters by factor

6. **Validation Results**
   - All acceptance criteria checks
   - Errors, warnings, and info messages

---

### 10. Validation Framework

**New CSIValidator Class** enforces acceptance criteria:

#### Acceptance Criteria (Binding):

1. ✅ **Component Separation**
   - CSI explicitly separates baseline, drift, and event deltas

2. ✅ **Factor Mapping**
   - All operations mapped to one of seven CSI risk factors

3. ✅ **No Macro/Environmental Contamination**
   - Baseline excludes macroeconomic and environmental variables

4. ✅ **Expectation-Weighted**
   - CSI includes escalation drift (not purely reactive)

5. ✅ **Expectation-Based Probability**
   - Signal probability is expectation-based (not frequency counts)

6. ✅ **Confidence Metadata Only**
   - Confidence never alters CSI values

7. ✅ **No Cross-Factor Operations**
   - No cross-factor drift accumulation or netting

**Validation Methods:**
- `validateSignal()` - Validates signal structure and source roles
- `validateEvent()` - Validates event structure and factor inheritance
- `validateCSIComponents()` - Validates overall CSI structure
- `validateDriftAccumulation()` - Ensures no cross-factor drift
- `validateNettingScope()` - Ensures no cross-factor netting
- `validateBaselineSources()` - Checks for contamination
- `runFullValidation()` - Comprehensive validation suite

---

## File Structure

### Core Engine Files (Updated)
```
/workspace/shadcn-ui/src/services/csi/engine/calculation/refactored/
├── types.ts                          # NEW: CSI risk factors, enhanced types
├── CSIValidator.ts                   # NEW: Validation framework
├── StructuralBaselineEngine.ts       # UPDATED: Per-factor baselines
├── EscalationDriftEngine.ts          # UPDATED: Factor-scoped drift
├── EventDeltaEngine.ts               # UPDATED: Factor-scoped events
├── NettingEngine.ts                  # UPDATED: Factor-scoped netting
├── DecayScheduler.ts                 # UNCHANGED: Decay logic
├── RefactoredCSIEngine.ts            # UPDATED: Main orchestrator
└── tests/
    └── unit/
        └── RefactoredCSIEngine.test.ts  # UPDATED: New test cases
```

---

## API Changes

### Signal Structure (Breaking Change)
```typescript
// OLD
interface Signal {
  vector: RiskVector;  // Generic vector
  ...
}

// NEW
interface Signal {
  risk_factor: CSIRiskFactor;  // Specific CSI risk factor (REQUIRED)
  sources: SourceMetadata[];    // With role enforcement
  confidence_metadata?: ConfidenceMetadata;  // Metadata only
  ...
}
```

### Event Structure (Breaking Change)
```typescript
// OLD
interface ConfirmedEvent {
  vector: RiskVector;
  ...
}

// NEW
interface ConfirmedEvent {
  risk_factor: CSIRiskFactor;  // Inherited from signal
  confirmation_sources: SourceMetadata[];  // CONFIRMATION role only
  related_signal_ids: string[];  // For netting
  ...
}
```

### CSI Components (Enhanced)
```typescript
interface CSIComponents {
  // Aggregated values
  structural_baseline: number;
  escalation_drift: number;
  escalation_drift_netted: number;
  event_delta: number;
  total: number;
  total_with_netting: number;
  
  // NEW: Factor breakdowns
  structural_baseline_by_factor: Map<CSIRiskFactor, number>;
  escalation_drift_by_factor: Map<CSIRiskFactor, number>;
  event_delta_by_factor: Map<CSIRiskFactor, number>;
  
  // Enhanced metadata
  metadata: {
    active_signals_by_factor: Map<CSIRiskFactor, number>;
    confirmed_events_by_factor: Map<CSIRiskFactor, number>;
    confidence_score: number;  // Metadata only
    ...
  };
}
```

---

## Migration Guide

### For Existing Signals
1. Map `vector` to `risk_factor` using `RISK_VECTOR_TO_CSI_FACTOR`
2. Add `sources` array with proper `SourceRole.DETECTION`
3. Optional: Add `confidence_metadata` for UI display

### For Existing Events
1. Map `vector` to `risk_factor`
2. Add `confirmation_sources` with `SourceRole.CONFIRMATION`
3. Add `related_signal_ids` for proper netting

### For Baseline Sources
1. Review all baseline sources
2. Remove macroeconomic indicators (GDP, inflation, debt)
3. Remove environmental indicators (climate, disasters)
4. Assign proper `SourceRole.BASELINE`
5. Map to specific CSI risk factors

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All signals have exactly one CSI risk factor
- [ ] All signals use DETECTION sources only
- [ ] All events have risk factor inherited from signals
- [ ] All events use CONFIRMATION sources only
- [ ] Baseline sources exclude macro/environmental data
- [ ] No cross-factor drift accumulation occurs
- [ ] No cross-factor netting occurs
- [ ] Confidence metadata does not affect CSI values
- [ ] Audit trail shows factor-level breakdown
- [ ] All acceptance criteria pass validation

---

## Testing Status

### Unit Tests
- ✅ RefactoredCSIEngine basic calculations
- ✅ Factor-scoped operations
- ✅ Signal and event management
- ✅ Validation enforcement
- ✅ Audit trail generation

### Integration Tests
- ⏳ Pending update for factor-scoped operations

### Performance Tests
- ⏳ Pending update for factor-scoped operations

### Backtesting
- ⏳ Pending update for factor-scoped operations

---

## Next Steps (Remaining Phases)

### Phase 2: Integration Tests Update
- Update integration tests for factor-scoped operations
- Test cross-factor isolation
- Test netting within factors

### Phase 3: Performance Optimization
- Benchmark factor-scoped calculations
- Optimize factor-level caching
- Profile memory usage

### Phase 4: Backtesting & Validation
- Validate against historical events
- Test escalation and decay mechanics
- Verify netting effectiveness

### Phase 5: Documentation & Training
- Update API documentation
- Create migration guides
- Train team on new methodology

### Phase 6: Production Deployment
- Gradual rollout with monitoring
- A/B testing against old methodology
- Performance monitoring

### Phase 7: Monitoring & Refinement
- Track validation failures
- Monitor factor-level metrics
- Refine source mappings

### Phase 8: Final Validation
- Comprehensive acceptance testing
- Stakeholder sign-off
- Production readiness review

---

## References

- **Appendix B**: Authoritative source for factor mappings and source roles
- **CSI Refinements Document**: Detailed list of required fixes
- **Acceptance Criteria**: Binding requirements for implementation compliance

---

## Contact & Support

For questions about this implementation:
- Review the CSI Refinements document
- Check Appendix B for authoritative mappings
- Consult the CSIValidator for acceptance criteria
- Review audit trails for factor-level details

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-09  
**Status:** Phase 1 Complete - Ready for Phase 2