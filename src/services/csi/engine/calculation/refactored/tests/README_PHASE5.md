# Phase 5: Testing & Validation Suite

## Overview

This directory contains comprehensive tests for the CSI Engine refactored components, implementing Phase 5 of the CSI Enhancement project. The test suite targets 90%+ code coverage and validates all core functionality.

## Test Structure

```
tests/
├── unit/                           # Unit tests (90%+ coverage target)
│   ├── DecayScheduler.test.ts      # Decay scheduling and management
│   ├── EscalationDriftEngine.test.ts # Drift calculation and signal management
│   ├── NettingEngine.test.ts       # Anti-double-counting logic
│   ├── StructuralBaselineEngine.test.ts # Baseline calculation
│   └── RefactoredCSIEngine.test.ts # Main CSI engine orchestration
├── integration.test.ts             # Original integration tests
├── integration-expanded.test.ts    # Expanded end-to-end workflow tests
├── backtesting.test.ts             # Original backtesting validation
├── backtesting-expanded.test.ts    # Expanded historical event validation
├── netting.test.ts                 # Original netting tests
├── performance.test.ts             # Performance benchmarking
├── audit-explainability.test.ts    # Audit trail and explainability validation
└── README_PHASE5.md                # This file
```

## Test Categories

### 1. Unit Tests (`unit/`)

Target: **90%+ code coverage**

#### DecayScheduler.test.ts
- Constructor and configuration
- Decay scheduling lifecycle
- Status transitions (ACTIVE → DECAYING → EXPIRED)
- Decay value calculations
- Cleanup and maintenance
- Health metrics

#### EscalationDriftEngine.test.ts
- Signal management (add, remove, update)
- Drift calculation with factors:
  - Severity × Probability × Persistence × Recency × Decay
- Per-signal cap enforcement (0.25)
- 30-day cumulative cap enforcement (1.0)
- Contribution breakdown
- Event attribution

#### NettingEngine.test.ts
- Signal similarity detection
- Netting strategies (MAX, AVERAGE, WEIGHTED, DIMINISHING)
- Cluster formation and management
- Temporal proximity handling
- Source overlap detection
- Rule management

#### StructuralBaselineEngine.test.ts
- Baseline calculation
- Cache management
- Quarterly update frequency
- Weighted sum calculation

#### RefactoredCSIEngine.test.ts
- Three-component CSI calculation
- Netting integration
- Signal and event management
- Health metrics aggregation
- Cleanup coordination

### 2. Integration Tests

#### integration.test.ts (Original)
- Three-component architecture validation
- Escalation drift component
- Event delta component with netting
- CSI attribution
- Backward compatibility

#### integration-expanded.test.ts (New)
- End-to-end CSI calculation workflow
- Multi-country workflow
- Decay integration workflow
- Netting integration workflow
- Full lifecycle integration
- Component integration validation
- Breakdown consistency
- Cleanup integration
- Health metrics integration

### 3. Backtesting & Validation

#### backtesting.test.ts (Original)
- US-China Trade War (2018) scenario
- Decay mechanics validation
- Drift caps enforcement
- Persistence factor validation
- Recency factor validation
- Full lifecycle validation

#### backtesting-expanded.test.ts (New)
- Russia-Ukraine Conflict (2022) scenario
- Brexit Referendum (2016) scenario
- COVID-19 Pandemic (2020) scenario
- False alarm decay scenarios
- Overlapping signal netting validation
- Cap enforcement validation
- Full system validation

### 4. Performance Benchmarking (`performance.test.ts`)

#### Latency Tests
- DecayScheduler: 1000 schedules < 100ms
- DecayScheduler: 1000 calculations < 50ms
- EscalationDriftEngine: 100 signals < 200ms
- NettingEngine: 50 signals < 100ms
- RefactoredCSIEngine: Full CSI < 500ms

#### Throughput Tests
- High-frequency signal additions
- High-frequency netting operations

#### Memory Tests
- Memory leak detection
- Cleanup effectiveness

#### Stress Tests
- 10,000 signals handling
- Rapid signal lifecycle

### 5. Audit & Explainability (`audit-explainability.test.ts`)

#### CSI Attribution Audit Trail
- Complete attribution breakdown
- Metadata with timestamps
- Decay and netting statistics

#### Signal Contribution Explainability
- Factor breakdown (severity, probability, persistence, recency, decay)
- Cap application explanation

#### Decay Schedule Audit Trail
- Lifecycle tracking
- Status transitions
- Progress information

#### Netting Cluster Audit Trail
- Cluster formation tracking
- Membership tracking
- Netting factor calculation

#### Provenance Metadata
- Source tracking
- Corroboration count
- Timestamps
- Risk vector classification

#### Configuration Audit
- Decay scheduler configuration
- Drift engine configuration
- Netting rules

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/DecayScheduler.test.ts

# Run with coverage
pnpm test --coverage

# Run performance tests
pnpm test tests/performance.test.ts
```

## Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| DecayScheduler | 90%+ | ✅ |
| EscalationDriftEngine | 90%+ | ✅ |
| NettingEngine | 90%+ | ✅ |
| StructuralBaselineEngine | 90%+ | ✅ |
| RefactoredCSIEngine | 90%+ | ✅ |

## Validation Criteria

### Phase 3: Escalation & Decay
- ✅ Drift rises before events
- ✅ Drift decays when threats don't materialize
- ✅ Per-signal cap enforced (0.25)
- ✅ 30-day cumulative cap enforced (1.0)
- ✅ Persistence factor works correctly
- ✅ Recency factor works correctly
- ✅ Full lifecycle works

### Phase 4: Netting & Anti-Double-Counting
- ✅ Detects overlapping signals
- ✅ Applies netting strategies correctly
- ✅ Tracks netting clusters
- ✅ Provides transparency through statistics
- ✅ Handles edge cases
- ✅ Integrates with CSI calculation

### Phase 5: Testing & Validation
- ✅ Unit tests with 90%+ coverage
- ✅ Integration tests
- ✅ Backtesting validation
- ✅ Performance benchmarking
- ✅ Audit & explainability validation

## Historical Event Validation

| Event | Pre-Event Drift Rise | Decay Behavior | Netting Behavior |
|-------|---------------------|----------------|------------------|
| US-China Trade War (2018) | ✅ Validated | ✅ Validated | ✅ Validated |
| Russia-Ukraine Conflict (2022) | ✅ Validated | N/A | N/A |
| Brexit Referendum (2016) | ✅ Validated | N/A | N/A |
| COVID-19 Pandemic (2020) | ✅ Validated | N/A | N/A |

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Schedule 1000 decays | < 100ms | ✅ |
| Calculate 1000 decayed values | < 50ms | ✅ |
| Calculate drift (100 signals) | < 200ms | ✅ |
| Apply netting (50 signals) | < 100ms | ✅ |
| Full CSI calculation | < 500ms | ✅ |
| 10 country calculations | < 3000ms | ✅ |

## Notes

1. **Mock Dependencies**: Some tests use mocks for external dependencies (e.g., baselineCalculator) to ensure isolation.

2. **Time-Sensitive Tests**: Some tests use fixed dates to ensure reproducibility. Be aware of this when debugging.

3. **Performance Tests**: Performance benchmarks may vary based on CI environment. Thresholds are set conservatively.

4. **Memory Tests**: Memory tests use `process.memoryUsage()` which may not be available in all environments.