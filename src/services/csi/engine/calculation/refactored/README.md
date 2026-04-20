# Refactored CSI Engine - Phase 1 Implementation

## Overview

This directory contains the **Phase 1: Core Architecture Redesign** implementation of the CSI (Country Shock Index) engine. The refactored engine implements a three-component architecture aligned with the CSI methodology specification.

## Architecture

### Three-Component Formula

```
CSI(t) = Structural_Baseline(t) + Escalation_Drift(t) + Event_CSI_Δ(t)
```

### Components

1. **Structural Baseline Engine** (`StructuralBaselineEngine.ts`)
   - Calculates slow-moving institutional risk
   - Updates quarterly (90-day cache)
   - Based on authoritative sources (World Bank, IMF, PRS/EIU)
   - Weighted domain scoring

2. **Escalation Drift Engine** (`EscalationDriftEngine.ts`)
   - Calculates probability-weighted pre-event risk
   - Updates daily
   - Formula: `Drift = Σ(Severity × Probability × Persistence × Recency)`
   - Caps: 0.25 per signal, 1.0 cumulative per 30 days

3. **Event Delta Engine** (`EventDeltaEngine.ts`)
   - Calculates confirmed event impact
   - Updates in real-time
   - **Netting logic**: Subtracts prior drift when events are confirmed
   - Exponential decay (30-day half-life)

## Key Features

### ✅ Expectation-Weighted Architecture
- Drift uses probability × severity (not historical events)
- Signals contribute to CSI before they're confirmed
- Forward-looking risk pricing

### ✅ Netting Logic
- When events are confirmed, prior drift is netted out
- Prevents double-counting of risk
- Ensures CSI moves incrementally, not in jumps

### ✅ Component Decomposition
- Clear separation: Baseline (quarterly) + Drift (daily) + Delta (real-time)
- Each component independently calculable and auditable
- Full attribution available

### ✅ Backward Compatibility
- Maps to existing `RiskVector` system
- Uses existing stores (`escalationSignalLog`, `eventCandidateStore`, etc.)
- Can run alongside current engine

## Files

```
refactored/
├── StructuralBaselineEngine.ts    # Quarterly baseline calculation
├── EscalationDriftEngine.ts       # Probability-weighted drift
├── EventDeltaEngine.ts            # Event impact with netting
├── RefactoredCSIEngine.ts         # Main orchestrator
├── types.ts                       # Type definitions
├── index.ts                       # Export module
├── tests/
│   └── integration.test.ts        # Integration tests
└── README.md                      # This file
```

## Usage

### Basic Usage

```typescript
import { refactoredCSIEngine } from './calculation/refactored';

// Calculate CSI with three components
const csi = await refactoredCSIEngine.calculateCSI('China');

console.log({
  total: csi.total,                    // e.g., 58.24
  baseline: csi.structural_baseline,   // e.g., 52.50 (quarterly)
  drift: csi.escalation_drift,         // e.g., 3.74 (from active signals)
  delta: csi.event_delta,              // e.g., 2.00 (from confirmed events)
  
  // Metadata
  activeSignals: csi.metadata.active_signals.length,
  confirmedEvents: csi.metadata.confirmed_events.length,
  confidence: csi.metadata.confidence_score
});
```

### Get Attribution (What Moved CSI)

```typescript
const attribution = await refactoredCSIEngine.getCSIAttribution('China');

console.log({
  baseline: attribution.baseline,
  drift: {
    total: attribution.drift.total,
    signals: attribution.drift.signals  // List of contributing signals
  },
  events: {
    total: attribution.events.total,
    deltas: attribution.events.deltas   // List of confirmed events
  }
});
```

### Using the Refactored Orchestrator

```typescript
import { refactoredCSIEngineOrchestrator } from './RefactoredCSIEngineOrchestrator';

// Initialize
await refactoredCSIEngineOrchestrator.initialize(['China', 'Germany', 'France']);

// Process signal
const result = await refactoredCSIEngineOrchestrator.processSignal({
  signalId: 'signal_123',
  country: 'China',
  vector: RiskVector.ECONOMIC,
  escalationLevel: EscalationLevel.HIGH,
  detectedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  status: 'active',
  sourceId: 'reuters',
  eventType: 'tariff_threat'
});

console.log({
  candidateCreated: result.candidateCreated,
  validated: result.validated,
  csiUpdated: result.csiUpdated,
  csiComponents: result.csiComponents
});

// Get CSI score
const score = await refactoredCSIEngineOrchestrator.getCSIScore('China');
console.log(score);

// Get system health
const health = refactoredCSIEngineOrchestrator.getSystemHealth();
console.log(health);
```

## Testing

Run integration tests:

```bash
npm test -- refactored/tests/integration.test.ts
```

Tests cover:
- Three-component architecture
- Escalation drift calculation
- Event delta with netting
- CSI attribution
- Backward compatibility
- Statistics and monitoring
- Cache management

## Migration from Legacy Engine

The refactored engine is designed to run alongside the legacy engine. To migrate:

1. **Parallel Operation**: Both engines can run simultaneously
2. **Gradual Cutover**: Use `setEngineMode()` to switch between engines
3. **Validation**: Compare outputs between engines during transition
4. **Full Cutover**: Once validated, deprecate legacy engine

```typescript
// Switch to refactored engine
refactoredCSIEngineOrchestrator.setEngineMode('refactored');

// Switch back to legacy (for testing)
refactoredCSIEngineOrchestrator.setEngineMode('legacy');
```

## Performance

- **Baseline Calculation**: ~50ms (cached for 90 days)
- **Drift Calculation**: ~20ms (per country)
- **Delta Calculation**: ~30ms (per country)
- **Total CSI Calculation**: ~100ms (per country)

## Next Steps (Phase 2)

1. **UI Integration**: Wire CSI Analytics Dashboard to refactored engine
2. **Visualization**: Display baseline/drift/delta decomposition
3. **Attribution Panel**: Show "Why did CSI move?" explanations
4. **Real-time Updates**: WebSocket integration for live CSI updates

## Support

For questions or issues, please refer to:
- Implementation Plan: `/docs/csi-alignment-2026/CSI_ALIGNMENT_IMPLEMENTATION_PLAN.md`
- Original Specification: Appendix B and CSI Option 2 documents