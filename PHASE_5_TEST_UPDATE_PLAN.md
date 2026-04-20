# Phase 5: Testing & Validation - Update Plan

## Overview
Update all tests to validate the new factor-scoped architecture and ensure comprehensive test coverage for all 8 acceptance criteria.

## Test Files to Update

### 1. Unit Tests (Already Updated in Previous Phases)
- ✅ StructuralBaselineEngine.test.ts - Already uses CSIRiskFactor
- ✅ EscalationDriftEngine.test.ts - Already uses CSIRiskFactor (Phase 3A)
- ✅ EventDeltaEngine.test.ts - Already uses CSIRiskFactor (Phase 3B)
- ✅ NettingEngine.test.ts - Already uses CSIRiskFactor (Phase 3C)
- ✅ DecayScheduler.test.ts - Already uses CSIRiskFactor (Phase 3D)
- ✅ RefactoredCSIEngine.test.ts - Already uses CSIRiskFactor (Phase 4)

### 2. Integration Tests (Need Update)
- ❌ integration.test.ts - Uses RiskVector, needs CSIRiskFactor update
- ❌ integration-expanded.test.ts - May use RiskVector

### 3. Backtesting Tests (Need Update)
- ❌ backtesting.test.ts - Uses RiskVector, needs CSIRiskFactor update
- ❌ backtesting-expanded.test.ts - May use RiskVector

### 4. Other Tests (Need Review)
- ❌ audit-explainability.test.ts - May need updates
- ❌ netting.test.ts - May need updates
- ❌ performance.test.ts - May need updates

## Key Changes Needed

### Replace RiskVector with CSIRiskFactor
```typescript
// OLD
import { RiskVector } from '../types';
vector: RiskVector.ECONOMIC

// NEW
import { CSIRiskFactor, SourceRole } from '../types';
risk_factor: CSIRiskFactor.TRADE_LOGISTICS
```

### Update Signal Structure
```typescript
// OLD
const signal = {
  signal_id: 'test',
  country: 'China',
  vector: RiskVector.ECONOMIC,
  signal_type: 'tariff_threat',
  severity: 0.7,
  probability: 0.75,
  detected_date: new Date(),
  last_updated: new Date(),
  sources: ['reuters'],
  corroboration_count: 1
};

// NEW
const signal = {
  signal_id: 'test',
  country: 'China',
  risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
  signal_type: 'tariff_threat',
  severity: 0.7,
  probability: 0.75,
  detected_date: new Date(),
  last_updated: new Date(),
  persistence_hours: 72,
  sources: [{
    source_id: 'reuters',
    source_name: 'Reuters',
    role: SourceRole.DETECTION,
    reliability_score: 0.9,
    authority_level: 'HIGH',
    applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
  }],
  corroboration_count: 1,
  max_drift_cap: 0.25
};
```

### Update Event Structure
```typescript
// OLD
const event = {
  event_id: 'test',
  country: 'China',
  vector: RiskVector.ECONOMIC,
  event_type: 'tariff_imposed',
  state: 'CONFIRMED',
  base_impact: 5.0,
  confirmed_date: new Date(),
  effective_date: new Date(),
  prior_drift_netted: 0
};

// NEW
const event = {
  event_id: 'test',
  country: 'China',
  risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
  event_type: 'tariff_imposed',
  state: 'CONFIRMED',
  base_impact: 5.0,
  confirmed_date: new Date(),
  effective_date: new Date(),
  confirmation_sources: [{
    source_id: 'reuters',
    source_name: 'Reuters',
    role: SourceRole.CONFIRMATION,
    reliability_score: 0.95,
    authority_level: 'HIGH',
    applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
  }],
  decay_schedule: { type: 'NONE' },
  prior_drift_netted: 0,
  related_signal_ids: []
};
```

## New Validation Tests to Add

### 1. Signal Must Have Exactly One risk_factor
```typescript
it('should require signal to have exactly one risk_factor', () => {
  const invalidSignal = { ...validSignal };
  delete invalidSignal.risk_factor;
  
  expect(() => engine.addSignal('TestCountry', invalidSignal)).toThrow();
});
```

### 2. Cross-Factor Drift Accumulation Prevention
```typescript
it('should prevent cross-factor drift accumulation', async () => {
  // Add signals from different factors
  const signal1 = createSignal('sig1', CSIRiskFactor.CONFLICT_SECURITY);
  const signal2 = createSignal('sig2', CSIRiskFactor.TRADE_LOGISTICS);
  
  engine.addSignal('TestCountry', signal1);
  engine.addSignal('TestCountry', signal2);
  
  // Get drift by factor
  const driftByFactor = await engine.calculateByFactor('TestCountry');
  
  // Each factor should have independent drift
  expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0);
  expect(driftByFactor.get(CSIRiskFactor.TRADE_LOGISTICS)).toBeGreaterThan(0);
  
  // Total should equal sum of factors (no cross-factor accumulation)
  const total = await engine.calculate('TestCountry');
  const sumOfFactors = Array.from(driftByFactor.values()).reduce((a, b) => a + b, 0);
  expect(Math.abs(total - sumOfFactors)).toBeLessThan(0.01);
});
```

### 3. Cross-Factor Netting Prevention
```typescript
it('should prevent cross-factor netting', async () => {
  const signals = [
    createSignal('sig1', CSIRiskFactor.CONFLICT_SECURITY),
    createSignal('sig2', CSIRiskFactor.TRADE_LOGISTICS)
  ];
  
  const result = await nettingEngine.applyNetting('TestCountry', signals);
  
  // Should not create cluster due to different factors
  expect(result.clusters.length).toBe(0);
  
  // Validation should flag cross-factor attempt
  const validation = nettingEngine.validateNoCrossFactorNetting();
  expect(validation.some(v => v.check_name.includes('cross_factor'))).toBe(true);
});
```

### 4. Baseline Doesn't React to Events
```typescript
it('should not update baseline in response to events', async () => {
  const country = 'TestCountry';
  
  // Get initial baseline
  const baseline1 = await baselineEngine.calculate(country);
  
  // Add event
  const event = createEvent('evt1', CSIRiskFactor.CONFLICT_SECURITY);
  await eventEngine.addEvent(country, event);
  
  // Baseline should remain unchanged
  const baseline2 = await baselineEngine.calculate(country);
  expect(baseline1).toBe(baseline2);
  
  // Attempt event-driven update should be blocked
  const allowed = baselineEngine.attemptUpdate(country, 'event');
  expect(allowed).toBe(false);
});
```

### 5. Confidence Doesn't Affect CSI Calculations
```typescript
it('should ensure confidence never affects CSI calculations', async () => {
  const country = 'TestCountry';
  
  // Calculate CSI
  const components = await engine.calculateCSI(country);
  
  // Verify confidence is metadata only
  expect(components.metadata.confidence_score).toBeDefined();
  
  // Verify CSI total equals sum of components (not scaled by confidence)
  const expectedTotal = components.structural_baseline + 
                       components.escalation_drift_netted + 
                       components.event_delta;
  
  expect(Math.abs(components.total_with_netting - expectedTotal)).toBeLessThan(0.01);
  
  // Confidence should not appear in calculation formula
  expect(components.total).not.toContain(components.metadata.confidence_score);
});
```

### 6. Acceptance Criteria Validation
```typescript
it('should validate all 8 acceptance criteria', async () => {
  const breakdown = await engine.getCSIBreakdown('TestCountry');
  
  const criteria = breakdown.validation_summary.acceptance_criteria_results;
  
  // Should have all 8 criteria
  expect(criteria.length).toBeGreaterThanOrEqual(8);
  
  // Check each criterion
  const criteriaNames = criteria.map(c => c.check_name);
  expect(criteriaNames).toContain('acceptance_criterion_1_component_separation');
  expect(criteriaNames).toContain('acceptance_criterion_2_factor_mapping');
  expect(criteriaNames).toContain('acceptance_criterion_3_baseline_purity');
  expect(criteriaNames).toContain('acceptance_criterion_4_expectation_weighted');
  expect(criteriaNames).toContain('acceptance_criterion_5_expectation_based_probability');
  expect(criteriaNames).toContain('acceptance_criterion_6_confidence_metadata_only');
  expect(criteriaNames).toContain('acceptance_criterion_7_no_cross_factor_operations');
  expect(criteriaNames).toContain('acceptance_criterion_8_appendix_b_compliance');
});
```

## Implementation Order

1. ✅ Review existing unit tests (already updated)
2. ⏳ Update integration.test.ts
3. ⏳ Update backtesting.test.ts
4. ⏳ Update other test files as needed
5. ⏳ Add new validation tests
6. ⏳ Run all tests and verify passing
7. ⏳ Create Phase 5 completion summary

## Success Criteria

- ✅ All tests use CSIRiskFactor instead of RiskVector
- ✅ All tests use proper Signal/Event structure with SourceMetadata
- ✅ All 8 acceptance criteria have dedicated tests
- ✅ Cross-factor prevention tests added
- ✅ Confidence metadata-only tests added
- ✅ Baseline stability tests added
- ✅ All tests pass with 0 errors
- ✅ 100% lint compliance