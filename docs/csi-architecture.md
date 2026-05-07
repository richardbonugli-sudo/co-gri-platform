# CSI Architecture - PHASE 1: Baseline vs Event Separation

## Overview

The Country Shock Index (CSI) system has been transformed from a static value system to a two-layer architecture that separates slow-moving structural risk (baseline) from discrete geopolitical shocks (events).

## Architecture Components

### 1. Baseline CSI (Stock)
- **Definition**: Slow-moving structural risk inherent to a country
- **Update Frequency**: Quarterly or when structural changes occur
- **Rate Limits**: 
  - Maximum ±1.0 change per 30-day rolling window
  - Maximum ±0.25 change per single update
- **Storage**: In-memory Map in `baselineManager`
- **Initialization**: Populated from `GLOBAL_COUNTRIES` array on first load

### 2. Event ΔCSI (Flow)
- **Definition**: Discrete time-stamped geopolitical shock events
- **Examples**: Sanctions, export controls, conflicts, coups
- **Lifecycle States**:
  - `DETECTED`: Initial detection, not yet verified
  - `PROVISIONAL`: Under review, preliminary assessment
  - `CONFIRMED`: Verified and active (contributes to composite CSI)
  - `RESOLVED`: Event concluded, no longer active
- **Storage**: In-memory Map in `eventStore`
- **Audit Trail**: All changes logged with timestamp, user, and reason

### 3. Composite CSI
- **Formula**: `Composite CSI = Baseline CSI + Σ(Active Event ΔCSI)`
- **Active Events**: Only events in `CONFIRMED` state contribute
- **Decay Support**: Events can decay over time (LINEAR, EXPONENTIAL, NONE)
- **Calculation**: On-demand via `compositeCalculator`

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL_COUNTRIES Array                    │
│              (Static baseline CSI values)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  initializeBaselines() │
         │  (One-time on load)    │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Baseline Manager     │
         │  (In-memory storage)   │
         │  - Baseline CSI values │
         │  - Drift history       │
         │  - Rate limit checks   │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Event Store          │
         │  (In-memory storage)   │
         │  - Event records       │
         │  - State management    │
         │  - Audit trails        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Composite Calculator  │
         │  - Baseline + Events   │
         │  - Decay application   │
         │  - On-demand calc      │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ getCountryShockIndex() │
         │  (External API)        │
         │  Returns: Composite    │
         └────────────────────────┘
```

## Event Lifecycle

```
DETECTED ──────► PROVISIONAL ──────► CONFIRMED ──────► RESOLVED
   │                  │                   │                │
   │                  │                   │                │
   └──────────────────┴───────────────────┴────────────────┘
                  (Can jump to RESOLVED)
```

### State Transition Rules
- `DETECTED` → `PROVISIONAL` or `RESOLVED`
- `PROVISIONAL` → `CONFIRMED` or `RESOLVED`
- `CONFIRMED` → `RESOLVED`
- `RESOLVED` is terminal (no further transitions)

## Example: China Silver Export Restriction

### Before Event (Baseline Only)
```typescript
Country: China
Baseline CSI: 75.0
Active Events: 0
Composite CSI: 75.0
```

### After Event Creation (DETECTED)
```typescript
Country: China
Baseline CSI: 75.0
Active Events: 0 (DETECTED state doesn't contribute)
Composite CSI: 75.0
```

### After Event Confirmation (CONFIRMED)
```typescript
Country: China
Baseline CSI: 75.0
Active Events: 1
  - Event: CN-SILVER-2026-01-01
  - Type: EXPORT_CONTROL
  - ΔCSI: +2.5
  - State: CONFIRMED
Composite CSI: 77.5 (75.0 + 2.5)
```

### After Event Resolution (RESOLVED)
```typescript
Country: China
Baseline CSI: 75.0
Active Events: 0 (RESOLVED events don't contribute)
Composite CSI: 75.0
```

## API Reference

### Backward Compatible API
```typescript
// Returns composite CSI (baseline + events)
const csi = getCountryShockIndex('China');
// Returns: 77.5 (if China silver event is CONFIRMED)
```

### New Detailed API
```typescript
// Returns full breakdown
const details = getCountryCSIDetails('China');
// Returns: {
//   country: 'China',
//   baseline_csi: 75.0,
//   event_csi: 2.5,
//   composite_csi: 77.5,
//   active_events: [{ event_id: 'CN-SILVER-...', ... }],
//   as_of_date: '2026-01-02T...',
//   calculation_metadata: {
//     num_active_events: 1,
//     event_ids: ['CN-SILVER-2026-01-01-...'],
//     decay_applied: false
//   }
// }
```

### Event Management API
```typescript
import { eventStore, baselineManager, compositeCalculator } from '@/services/csi';

// Create event
const event = eventStore.createEvent({
  country: 'China',
  event_type: 'EXPORT_CONTROL',
  primary_vector: 'SC3',
  severity: 6,
  delta_csi: 2.5,
  detected_date: '2026-01-01',
  description: 'Export restriction on silver',
  sources: ['https://...'],
  rationale: 'Strategic commodity control',
  created_by: 'ADMIN'
});

// Transition state
eventStore.transitionEventState({
  event_id: event.event_id,
  new_state: 'CONFIRMED',
  user: 'ADMIN',
  reason: 'Verified from official source'
});

// Update baseline (with rate limit validation)
baselineManager.updateBaselineCSI(
  'China',
  75.5,
  'Structural governance improvement',
  'ADMIN'
);

// Calculate composite
const composite = compositeCalculator.calculateCompositeCSI('China');
```

## Rate Limit Enforcement

### Purpose
Prevent rapid baseline changes that could mask discrete events or create double-counting.

### Limits
1. **Single Update**: Maximum ±0.25 per update
2. **Rolling 30-Day Window**: Maximum ±1.0 total drift

### Validation Example
```typescript
// Current baseline: 75.0
// Attempt to update to 75.3 (Δ +0.3)
// Result: REJECTED (exceeds single update limit of 0.25)

// Attempt to update to 75.2 (Δ +0.2)
// Result: ACCEPTED (within single update limit)

// After 10 days, attempt to update to 75.4 (Δ +0.2)
// Result: ACCEPTED (total 30-day drift = +0.4, within limit)

// After 20 days, attempt to update to 75.8 (Δ +0.4)
// Result: REJECTED (total 30-day drift would be +1.0, at limit)
```

## Audit Trail

Every event change is logged:
```typescript
{
  timestamp: '2026-01-02T10:30:00Z',
  action: 'STATE_TRANSITION',
  user: 'ADMIN',
  details: 'Verified from official government source',
  previous_state: 'PROVISIONAL',
  new_state: 'CONFIRMED'
}
```

## UI: CSI Event Manager

### Access
Navigate to `/csi-events` or use the admin interface.

### Features
1. **Event List**: View all events with state, country, type, ΔCSI
2. **Event Details**: Full breakdown with audit trail
3. **Create Event**: Form-based event entry with validation
4. **State Transitions**: One-click state changes with reason logging
5. **Delete Event**: Remove events with confirmation

### Workflow
1. Create event in `DETECTED` state
2. Review and transition to `PROVISIONAL`
3. Verify sources and transition to `CONFIRMED`
4. Event now contributes to composite CSI
5. When event concludes, transition to `RESOLVED`

## Testing Checklist

### Backward Compatibility
- [x] `getCountryShockIndex('China')` returns 75.0 before event
- [x] `getCountryShockIndex('China')` returns 77.5 after event confirmation
- [x] All existing COGRI calculations produce identical results

### Event Lifecycle
- [x] Create event in DETECTED state
- [x] Transition DETECTED → PROVISIONAL
- [x] Transition PROVISIONAL → CONFIRMED
- [x] Transition CONFIRMED → RESOLVED
- [x] Invalid transitions rejected

### Rate Limits
- [x] Single update >0.25 rejected
- [x] 30-day rolling drift >1.0 rejected
- [x] Valid updates accepted

### Audit Trail
- [x] All changes logged with timestamp, user, details
- [x] State transitions include previous and new state

### UI
- [x] Event list displays correctly
- [x] Create event form validates inputs
- [x] State transition buttons work
- [x] Audit trail displays for selected event

## Future Phases

### PHASE 2: Automated Event Detection
- Web scraping for news sources
- NLP for event extraction
- Automated DETECTED event creation

### PHASE 3: Event Propagation
- Trade partner impact analysis
- Supply chain ripple effects
- Automated propagation to affected countries

### PHASE 4: Machine Learning Calibration
- Historical event analysis
- ΔCSI prediction models
- Automated severity scoring

## Migration Notes

### For Existing Code
No changes required. The `getCountryShockIndex()` function maintains backward compatibility by returning composite CSI.

### For New Features
Use `getCountryCSIDetails()` to access full breakdown including baseline, events, and metadata.

### For Administrators
Use CSI Event Manager UI at `/csi-events` to manage events and baselines.

## Conclusion

PHASE 1 establishes the foundation for a transparent, auditable, and scalable CSI system. The baseline vs event separation enables:
- Clear attribution of risk changes
- Prevention of double-counting
- Full audit trails
- Foundation for automation

All existing functionality remains intact while new capabilities are available for advanced users.