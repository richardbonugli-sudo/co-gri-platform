# CSI Engine - Phase 1 Implementation

## Overview

This is the complete Phase 1 implementation of the CSI (Country Stability Index) Engine based on Appendix B specifications. The engine provides a systematic framework for:

1. **Signal Ingestion**: Capturing escalation signals from multiple sources
2. **Event Validation**: Gating logic with cross-source confirmation
3. **CSI Calculation**: Real-time risk scoring using the formula `CSI(t) = Baseline + Drift + Delta`
4. **Decay Management**: Time-based decay of event impacts
5. **Audit Trail**: Complete traceability of all CSI movements

## Architecture

### Core Formula

```
CSI(t) = Baseline + Drift + Delta

Where:
- Baseline: Historical average from authoritative sources (WGI, Freedom House, V-Dem)
- Drift: Sustained changes from validated long-term events (6-month window)
- Delta: Recent event impacts with exponential decay (30-day half-life)
```

### State Management (Three-Tier System)

1. **Escalation Signal Log** (`state/EscalationSignalLog.ts`)
   - Immutable append-only log of all incoming signals
   - Multi-dimensional indexing: country, vector, source, time
   - Query capabilities for signal analysis

2. **Event Candidate Store** (`state/EventCandidateStore.ts`)
   - Manages events pending validation
   - Tracks validation status: CANDIDATE → VALIDATED → REJECTED/EXPIRED
   - Stores supporting signals and gating check results

3. **Event Delta Ledger** (`state/EventDeltaLedger.ts`)
   - Audit trail of all CSI-affecting events
   - Records: new events, escalations, de-escalations, expirations
   - Tracks CSI impact (vector delta, composite delta)
   - Override audit trail

### Source Classification

**Source Registry** (`sources/SourceRegistry.ts`)
- Pre-configured with 12 authoritative sources
- Three-tier hierarchy:
  - **Tier 1 (Authoritative)**: WGI, Freedom House, V-Dem, IMF, World Bank, ACLED, UCDP
  - **Tier 2 (Reputable)**: Reuters, Financial Times, EIU
  - **Tier 3 (Supplementary)**: Social media, local news aggregators
- Reliability scoring and geographic coverage tracking

### Gating Logic

**Gating Orchestrator** (`gating/GatingOrchestrator.ts`)
- Five validation rules:
  1. **Tier Validation**: Requires Tier 1 or Tier 2 source
  2. **Cross-Source Confirmation**: Minimum 2 independent sources
  3. **Temporal Coherence**: Signals within 72-hour window
  4. **Critical Validation**: Enhanced requirements for critical events (Tier 1 + 3 signals)
  5. **Vector Alignment**: Signals match source primary vectors
- Confidence scoring (75% threshold for validation)

### CSI Calculation

**CSI Engine** (`calculation/CSIEngine.ts`)
- Vector-specific scoring for 6 risk vectors:
  - Political (20%)
  - Economic (20%)
  - Security (20%)
  - Social (15%)
  - Environmental (15%)
  - Technological (10%)
- Composite score calculation with weighted averaging
- Confidence intervals (95% CI)
- Data quality metrics (coverage, recency, reliability)

**Baseline Calculator** (`calculation/BaselineCalculator.ts`)
- Historical baseline calculation from 2-year window
- Weighted composite: WGI (40%) + Freedom House (30%) + V-Dem (30%)
- Statistical analysis (mean, median, std dev)
- 90-day cache with automatic refresh

**Decay Engine** (`calculation/DecayEngine.ts`)
- Exponential decay: `w(t) = e^(-λt)` where `λ = ln(2) / 30 days`
- Persistence rules:
  - Standard events: 48-hour minimum
  - Critical events: 72-hour minimum
- Automatic expiration and cleanup

## Usage

### Initialization

```typescript
import { csiEngineOrchestrator } from './CSIEngineOrchestrator';

// Initialize with target countries
const countries = ['CHN', 'JPN', 'KOR', 'TWN', 'VNM'];
await csiEngineOrchestrator.initialize(countries);
```

### Processing Signals

```typescript
import { EscalationSignal, SourceTier, RiskVector, EscalationLevel } from './types';

// Create escalation signal
const signal: EscalationSignal = {
  signalId: 'sig_001',
  timestamp: new Date(),
  sourceId: 'freedom_house',
  sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
  country: 'CHN',
  vector: RiskVector.POLITICAL,
  escalationLevel: EscalationLevel.HIGH,
  rawContent: 'Political tensions detected',
  confidence: 0.92,
  metadata: {
    headline: 'Political Risk Update',
    url: 'https://example.com/report'
  }
};

// Process signal
const result = await csiEngineOrchestrator.processSignal(signal);
console.log('Validated:', result.validated);
```

### Getting CSI Scores

```typescript
// Get current CSI score
const score = await csiEngineOrchestrator.getCSIScore('CHN');

console.log('Composite Score:', score.compositeScore);
console.log('Political Vector:', score.vectorScores[RiskVector.POLITICAL].currentScore);
console.log('Trend:', score.vectorScores[RiskVector.POLITICAL].trend);
console.log('Data Quality:', score.dataQuality);
```

### System Health Monitoring

```typescript
// Get system health
const health = csiEngineOrchestrator.getSystemHealth();
console.log('Active Candidates:', health.activeCandidates);
console.log('Validated Events:', health.validatedEvents);

// Generate diagnostic report
const report = csiEngineOrchestrator.generateDiagnosticReport();
console.log(JSON.stringify(report, null, 2));

// Run maintenance
const maintenance = await csiEngineOrchestrator.runMaintenance();
console.log('Expired candidates:', maintenance.expiredCandidates);
```

## Demo

Run the complete demo to see the engine in action:

```typescript
import { runCSIEngineDemo, quickTest } from './demo/engineDemo';

// Full demo
await runCSIEngineDemo();

// Quick test
await quickTest();
```

## Key Features

### ✅ Complete State Machine
- Signal ingestion → Candidate creation → Gating validation → Event confirmation → CSI update

### ✅ Multi-Source Validation
- Cross-source confirmation required
- Tier-based authority hierarchy
- Source reliability scoring

### ✅ Time-Based Decay
- Exponential decay with 30-day half-life
- Configurable persistence rules
- Automatic event expiration

### ✅ Audit Trail
- Complete traceability of all CSI movements
- Override tracking with justification
- Delta ledger for compliance

### ✅ Data Quality Metrics
- Coverage scoring (vector completeness)
- Recency scoring (data freshness)
- Source reliability tracking

## Configuration

### Decay Parameters

```typescript
import { decayEngine } from './calculation/DecayEngine';

decayEngine.updateDecayParameters({
  halfLife: 30,              // days
  minimumPersistence: 48,    // hours
  criticalPersistence: 72,   // hours
  decayFunction: 'exponential'
});
```

### Gating Rules

```typescript
import { gatingOrchestrator } from './gating/GatingOrchestrator';

// Enable/disable rules
gatingOrchestrator.setRuleEnabled('critical_validation', true);

// Get all rules
const rules = gatingOrchestrator.getRules();
```

### Vector Weights

Modify in `CSIEngine.calculateCompositeScore()`:

```typescript
const weights: Record<RiskVector, number> = {
  [RiskVector.POLITICAL]: 0.20,
  [RiskVector.ECONOMIC]: 0.20,
  [RiskVector.SECURITY]: 0.20,
  [RiskVector.SOCIAL]: 0.15,
  [RiskVector.ENVIRONMENTAL]: 0.15,
  [RiskVector.TECHNOLOGICAL]: 0.10
};
```

## Assumptions Made

1. **Baseline Calculation**: Composite of WGI (40%) + Freedom House (30%) + V-Dem (30%)
2. **Decay Function**: Exponential with 30-day half-life
3. **Persistence Rules**: 48h minimum (72h for critical events)
4. **Spillover Logic**: Maximum 1 secondary vector, 3 countries per event
5. **Override Enforcement**: Strict with full audit trail (ADMIN role required)
6. **Historical Seeding**: 2-year baseline window with quarterly data points

## Next Steps (Phase 2)

1. **Vector Routing**: Deterministic SC1-SC7 classification
2. **Spillover Engine**: Multi-hop propagation with attenuation
3. **Override Management**: UI for manual adjustments with approval workflow
4. **API Layer**: REST endpoints for external integration
5. **Real-time Updates**: WebSocket support for live CSI streaming
6. **Historical Replay**: Backtesting and scenario analysis
7. **Integration**: Connect to actual data sources (WGI, Freedom House, ACLED, etc.)

## File Structure

```
src/services/csi/engine/
├── types.ts                          # Core type definitions
├── CSIEngineOrchestrator.ts          # Main orchestrator
├── index.ts                          # Public exports
├── README.md                         # This file
├── state/
│   ├── EscalationSignalLog.ts        # Signal storage
│   ├── EventCandidateStore.ts        # Candidate management
│   └── EventDeltaLedger.ts           # Audit trail
├── sources/
│   └── SourceRegistry.ts             # Source classification
├── gating/
│   └── GatingOrchestrator.ts         # Validation logic
├── calculation/
│   ├── BaselineCalculator.ts         # Historical baselines
│   ├── DecayEngine.ts                # Time-based decay
│   └── CSIEngine.ts                  # CSI calculation
└── demo/
    └── engineDemo.ts                 # Usage examples
```

## Testing

```bash
# Run demo
npm run demo:csi-engine

# Quick test
npm run test:csi-engine-quick
```

## Support

For questions or issues, refer to:
- Implementation Plan: `/workspace/shadcn-ui/docs/phase5/PHASE1_CSI_ENGINE_IMPLEMENTATION_PLAN.md`
- Appendix B: Original specifications document
- Technical Review: Contact the engineering team

---

**Status**: Phase 1 Complete ✅  
**Version**: 1.0.0  
**Last Updated**: 2026-02-01