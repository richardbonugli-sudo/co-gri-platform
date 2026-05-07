# Phase 1: CSI Engine Implementation Plan

## Executive Summary

This document provides a detailed implementation plan for building the core CSI (Country Shock Index) engine as specified in Appendix B. This is **backend-first** work that must be completed and validated before Phase 2 (UI integration).

**Goal**: Implement the deterministic CSI calculation engine with full auditability, state machine lifecycle, and source classification framework.

---

## Architecture Overview

### Core Formula
```
CSI(country, t) = Structural_Baseline(country) 
                  + Escalation_Drift(country, t) 
                  + Event_CSI_Δ(country, t)
```

### Three-Layer System

1. **Structural Baseline**: Long-run country risk (from WGI, Freedom House, etc.)
2. **Escalation Drift**: Probability-weighted signals that haven't materialized yet
3. **Event CSI Δ**: Confirmed events with authoritative sources, netted against prior drift

---

## File Structure

```
src/services/csi/
├── core/
│   ├── csiEngine.ts                    # Main CSI calculation engine
│   ├── stateManager.ts                 # State machine for candidate lifecycle
│   ├── auditLogger.ts                  # Audit trail management
│   └── replayEngine.ts                 # Baseline cut date & replay logic
│
├── state/
│   ├── escalationSignalLog.ts         # Probability-weighted drift tracking
│   ├── eventCandidateStore.ts         # DETECTED → CONFIRMED lifecycle
│   ├── eventDeltaLedger.ts            # Confirmed events with netting/decay
│   └── baselineStore.ts               # Structural baseline storage (refactor existing)
│
├── sources/
│   ├── sourceClassifier.ts            # Detection vs Confirmation classification
│   ├── detectionSources.ts            # Section 3 sources (Reuters, GDELT, etc.)
│   ├── confirmationSources.ts         # Section 4 authoritative sources
│   └── sourceRegistry.ts              # Central source metadata registry
│
├── gating/
│   ├── corroborationEngine.ts         # Multi-source corroboration (≥2 sources)
│   ├── persistenceChecker.ts          # 48-72 hour persistence validation
│   ├── credibilityScorer.ts           # Source credibility weighting
│   └── gatingOrchestrator.ts          # Coordinates all gating logic
│
├── routing/
│   ├── vectorRouter.ts                # SC1-SC7 deterministic routing
│   ├── entityResolver.ts              # Actor/target/spillover resolution
│   ├── vectorRules.ts                 # Vector-specific confirmation rules
│   └── routingOrchestrator.ts         # Coordinates routing logic
│
├── calculation/
│   ├── baselineCalculator.ts          # Structural baseline computation
│   ├── driftCalculator.ts             # Escalation drift computation
│   ├── deltaCalculator.ts             # Event delta with netting
│   ├── decayEngine.ts                 # Time-based decay logic
│   └── compositeCalculator.ts         # Final CSI(t) assembly (refactor existing)
│
└── api/
    ├── csiApi.ts                      # Public API for CSI queries
    ├── candidateApi.ts                # Candidate management endpoints
    └── auditApi.ts                    # Audit trail queries

tests/
└── csi/
    ├── core/
    ├── state/
    ├── gating/
    ├── routing/
    └── integration/
        └── endToEndFlow.test.ts       # Full pipeline validation
```

---

## Implementation Phases

### Phase 1.1: State Machine & Storage (Week 1-2)

#### 1.1.1 Escalation Signal Log

**File**: `src/services/csi/state/escalationSignalLog.ts`

**Purpose**: Track probability-weighted signals that create drift but haven't been confirmed yet.

**Data Structure**:
```typescript
interface EscalationSignal {
  signal_id: string;
  country: string;
  vector: VectorCode;
  signal_type: string;              // e.g., "tariff_threat", "sanctions_warning"
  probability: number;              // 0.0 to 1.0
  severity_if_realized: number;     // Potential ΔCSI if confirmed
  expected_drift: number;           // probability × severity
  detected_date: string;
  sources: SourceReference[];
  persistence_status: 'NEW' | 'PERSISTENT' | 'FADING' | 'EXPIRED';
  corroboration_count: number;
  last_seen_date: string;
  expiry_date?: string;
  audit_trail: AuditEntry[];
}

interface SourceReference {
  source_name: string;
  source_type: 'DETECTION' | 'CONFIRMATION';
  article_id: string;
  timestamp: string;
  credibility_score: number;
}
```

**Key Methods**:
```typescript
class EscalationSignalLog {
  // Add new signal
  addSignal(signal: CreateSignalInput): EscalationSignal;
  
  // Update signal probability as new info arrives
  updateSignalProbability(signal_id: string, new_probability: number, reason: string): void;
  
  // Mark signal as persistent (survived 48-72 hours)
  markAsPersistent(signal_id: string): void;
  
  // Expire signal (no longer relevant)
  expireSignal(signal_id: string, reason: string): void;
  
  // Get active signals for drift calculation
  getActiveSignals(country: string, vector?: VectorCode): EscalationSignal[];
  
  // Calculate total drift for a country
  calculateDrift(country: string, as_of_date: Date): number;
  
  // Get signals by persistence status
  getSignalsByStatus(status: PersistenceStatus): EscalationSignal[];
}
```

**Logic Flow**:
1. Detection sources create new signals with initial probability
2. Corroboration increases probability
3. Persistence checker validates 48-72 hour survival
4. Drift calculator sums `expected_drift` for all active signals
5. When event is confirmed, corresponding signal is expired (netted)

---

#### 1.1.2 Event Candidate Store

**File**: `src/services/csi/state/eventCandidateStore.ts`

**Purpose**: Manage candidate lifecycle from detection through confirmation.

**Data Structure**:
```typescript
interface EventCandidate {
  candidate_id: string;
  country: string;
  actor_country?: string;           // For cross-border events
  spillover_countries: string[];
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  
  // Lifecycle state
  state: 'DETECTED' | 'CORROBORATED' | 'PERSISTENT' | 'CONFIRMED' | 'REJECTED';
  
  // Detection info
  detected_date: string;
  detection_sources: SourceReference[];
  detection_confidence: number;
  
  // Corroboration info
  corroboration_count: number;
  corroboration_sources: SourceReference[];
  corroboration_date?: string;
  
  // Persistence info
  persistence_validated: boolean;
  persistence_validation_date?: string;
  hours_persistent: number;
  
  // Confirmation info
  confirmation_sources: SourceReference[];  // Must be authoritative
  confirmed_date?: string;
  confirmed_by?: string;
  
  // Severity & impact
  estimated_severity: number;       // Initial estimate
  confirmed_severity?: number;      // After confirmation
  delta_csi?: number;              // Final ΔCSI after confirmation
  
  // Metadata
  description: string;
  reasoning: string;
  affected_sectors: string[];
  entities: ExtractedEntities;
  
  // Audit
  state_transitions: StateTransition[];
  audit_trail: AuditEntry[];
  
  // Rejection (if applicable)
  rejection_reason?: string;
  rejected_date?: string;
  rejected_by?: string;
}

interface StateTransition {
  timestamp: string;
  from_state: CandidateState;
  to_state: CandidateState;
  reason: string;
  triggered_by: 'SYSTEM' | 'USER';
  user?: string;
}
```

**Key Methods**:
```typescript
class EventCandidateStore {
  // Create new candidate from detection
  createCandidate(input: CreateCandidateInput): EventCandidate;
  
  // Transition state with validation
  transitionState(
    candidate_id: string, 
    new_state: CandidateState, 
    reason: string,
    user?: string
  ): EventCandidate;
  
  // Add corroboration source
  addCorroboration(candidate_id: string, source: SourceReference): void;
  
  // Mark as persistent
  markPersistent(candidate_id: string, hours: number): void;
  
  // Add confirmation source (authoritative only)
  addConfirmation(
    candidate_id: string, 
    source: SourceReference,
    confirmed_severity: number,
    delta_csi: number
  ): EventCandidate;
  
  // Reject candidate
  rejectCandidate(candidate_id: string, reason: string, user: string): void;
  
  // Query methods
  getCandidatesByState(state: CandidateState): EventCandidate[];
  getCandidatesForCountry(country: string): EventCandidate[];
  getCandidatesAwaitingCorroboration(): EventCandidate[];
  getCandidatesAwaitingPersistence(): EventCandidate[];
  getCandidatesAwaitingConfirmation(): EventCandidate[];
  
  // Get candidate by ID
  getCandidate(candidate_id: string): EventCandidate | undefined;
}
```

**State Transition Rules**:
```
DETECTED → CORROBORATED:  Requires ≥2 independent sources
CORROBORATED → PERSISTENT: Requires 48-72 hour survival
PERSISTENT → CONFIRMED:    Requires authoritative source
Any state → REJECTED:      Manual or automatic rejection

Invalid transitions are blocked with error
```

---

#### 1.1.3 Event CSI Δ Ledger

**File**: `src/services/csi/state/eventDeltaLedger.ts`

**Purpose**: Track confirmed events with netting and decay.

**Data Structure**:
```typescript
interface EventDelta {
  event_id: string;
  candidate_id: string;             // Link back to candidate
  country: string;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  
  // Timing
  detected_date: string;
  confirmed_date: string;
  effective_date: string;           // When event takes effect
  
  // CSI impact
  base_delta_csi: number;           // Original ΔCSI
  netted_drift: number;             // Drift that was netted out
  net_delta_csi: number;            // base_delta - netted_drift
  current_delta_csi: number;        // After decay
  
  // Decay
  decay_schedule: DecaySchedule;
  decay_history: DecayRecord[];
  
  // Sources
  confirmation_sources: SourceReference[];
  
  // Status
  status: 'ACTIVE' | 'DECAYING' | 'RESOLVED' | 'SUPERSEDED';
  resolved_date?: string;
  superseded_by?: string;
  
  // Metadata
  description: string;
  severity: string;
  affected_sectors: string[];
  
  // Audit
  audit_trail: AuditEntry[];
}

interface DecayRecord {
  timestamp: string;
  delta_before: number;
  delta_after: number;
  decay_factor: number;
  days_since_effective: number;
}
```

**Key Methods**:
```typescript
class EventDeltaLedger {
  // Add confirmed event with netting
  addEventDelta(
    candidate: EventCandidate,
    base_delta_csi: number,
    netted_drift: number,
    decay_schedule: DecaySchedule
  ): EventDelta;
  
  // Apply decay to all active events
  applyDecay(as_of_date: Date): DecayRecord[];
  
  // Get current delta for a country
  getCurrentDelta(country: string, as_of_date: Date): number;
  
  // Get active events for a country
  getActiveEvents(country: string): EventDelta[];
  
  // Resolve event (mark as no longer active)
  resolveEvent(event_id: string, reason: string): void;
  
  // Supersede event (replaced by newer event)
  supersedeEvent(event_id: string, superseding_event_id: string): void;
  
  // Get event by ID
  getEvent(event_id: string): EventDelta | undefined;
  
  // Get events by vector
  getEventsByVector(vector: VectorCode): EventDelta[];
  
  // Calculate netting for new confirmation
  calculateNetting(candidate: EventCandidate): number;
}
```

**Netting Logic**:
```typescript
// When a candidate is confirmed:
1. Find corresponding escalation signal(s) for same country + vector
2. Sum their expected_drift
3. Net this from the event's base_delta_csi
4. Store both base_delta and net_delta in ledger
5. Expire the netted signals

Example:
- Signal: China tariff threat, probability=0.6, severity=10 → drift=6
- Event confirmed: China tariff imposed, base_delta=10
- Netting: net_delta = 10 - 6 = 4
- Result: CSI only moves by 4 (not 10) because market already priced in 6
```

---

### Phase 1.2: Source Classification (Week 2-3)

#### 1.2.1 Source Registry

**File**: `src/services/csi/sources/sourceRegistry.ts`

**Purpose**: Central metadata for all data sources with role classification.

**Data Structure**:
```typescript
interface SourceMetadata {
  source_id: string;
  source_name: string;
  source_type: 'RSS' | 'API' | 'SCRAPER' | 'MANUAL';
  
  // Role classification (from Appendix B)
  functional_role: 'DETECTION' | 'CONFIRMATION' | 'BASELINE';
  
  // Applicability
  applicable_vectors: VectorCode[] | 'ALL';
  applicable_countries: string[] | 'ALL';
  
  // Authority level
  is_authoritative: boolean;
  authority_scope?: {
    jurisdiction: string[];        // e.g., ["US", "EU"]
    event_types: EventType[];
    vectors: VectorCode[];
  };
  
  // Credibility
  base_credibility_score: number;  // 0.0 to 1.0
  credibility_factors: {
    timeliness: number;
    accuracy_history: number;
    editorial_standards: number;
  };
  
  // Technical
  url?: string;
  update_frequency: string;
  last_successful_fetch?: string;
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  added_date: string;
  notes?: string;
}
```

**Source Registry Content** (implement as JSON config):

```typescript
// Section 3: Detection Sources (from Appendix B)
const DETECTION_SOURCES: SourceMetadata[] = [
  {
    source_id: 'REUTERS_WORLD',
    source_name: 'Reuters World News',
    source_type: 'RSS',
    functional_role: 'DETECTION',
    applicable_vectors: 'ALL',
    applicable_countries: 'ALL',
    is_authoritative: false,
    base_credibility_score: 0.85,
    url: 'https://www.reuters.com/world/',
    update_frequency: 'CONTINUOUS',
    status: 'ACTIVE'
  },
  {
    source_id: 'GDELT',
    source_name: 'GDELT Event Database',
    source_type: 'API',
    functional_role: 'DETECTION',
    applicable_vectors: 'ALL',
    applicable_countries: 'ALL',
    is_authoritative: false,
    base_credibility_score: 0.75,
    url: 'https://api.gdeltproject.org/api/v2/doc/doc',
    update_frequency: 'CONTINUOUS',
    status: 'ACTIVE'
  },
  // ... more detection sources
];

// Section 4: Confirmation Sources (from Appendix B)
const CONFIRMATION_SOURCES: SourceMetadata[] = [
  {
    source_id: 'OFAC_SDN',
    source_name: 'OFAC SDN List',
    source_type: 'RSS',
    functional_role: 'CONFIRMATION',
    applicable_vectors: ['SC1'],  // Sanctions
    applicable_countries: 'ALL',
    is_authoritative: true,
    authority_scope: {
      jurisdiction: ['US'],
      event_types: ['SANCTIONS_IMPOSED'],
      vectors: ['SC1']
    },
    base_credibility_score: 1.0,
    url: 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml',
    update_frequency: 'DAILY',
    status: 'ACTIVE'
  },
  {
    source_id: 'EU_OFFICIAL_JOURNAL',
    source_name: 'EU Official Journal',
    source_type: 'SCRAPER',
    functional_role: 'CONFIRMATION',
    applicable_vectors: ['SC1', 'SC2'],
    applicable_countries: 'ALL',
    is_authoritative: true,
    authority_scope: {
      jurisdiction: ['EU'],
      event_types: ['SANCTIONS_IMPOSED', 'TRADE_RESTRICTION'],
      vectors: ['SC1', 'SC2']
    },
    base_credibility_score: 1.0,
    url: 'https://eur-lex.europa.eu/oj/direct-access.html',
    update_frequency: 'DAILY',
    status: 'ACTIVE'
  },
  // ... more confirmation sources
];
```

**Key Methods**:
```typescript
class SourceRegistry {
  // Get source metadata
  getSource(source_id: string): SourceMetadata | undefined;
  
  // Check if source can detect for vector
  canDetect(source_id: string, vector: VectorCode): boolean;
  
  // Check if source can confirm for vector
  canConfirm(source_id: string, vector: VectorCode, country: string): boolean;
  
  // Get all detection sources
  getDetectionSources(vector?: VectorCode): SourceMetadata[];
  
  // Get all confirmation sources
  getConfirmationSources(vector: VectorCode, country?: string): SourceMetadata[];
  
  // Get credibility score
  getCredibilityScore(source_id: string): number;
  
  // Validate source role
  validateSourceRole(source_id: string, intended_role: 'DETECTION' | 'CONFIRMATION'): boolean;
}
```

---

#### 1.2.2 Source Classifier

**File**: `src/services/csi/sources/sourceClassifier.ts`

**Purpose**: Enforce role separation - detection sources cannot confirm, confirmation sources are authoritative only.

**Key Methods**:
```typescript
class SourceClassifier {
  // Classify incoming data by source role
  classifySource(source_id: string): 'DETECTION' | 'CONFIRMATION' | 'BASELINE';
  
  // Validate that source is being used correctly
  validateSourceUsage(
    source_id: string,
    intended_action: 'CREATE_CANDIDATE' | 'CONFIRM_EVENT',
    vector: VectorCode,
    country: string
  ): ValidationResult;
  
  // Get required confirmation sources for a vector
  getRequiredConfirmationSources(vector: VectorCode, country: string): SourceMetadata[];
  
  // Check if source is authoritative for event type
  isAuthoritativeFor(
    source_id: string,
    event_type: EventType,
    vector: VectorCode,
    country: string
  ): boolean;
}
```

**Validation Rules**:
```typescript
// Rule 1: Detection sources can ONLY create candidates
if (source.functional_role === 'DETECTION' && action === 'CONFIRM_EVENT') {
  return { valid: false, error: 'Detection sources cannot confirm events' };
}

// Rule 2: Confirmation requires authoritative source
if (action === 'CONFIRM_EVENT' && !source.is_authoritative) {
  return { valid: false, error: 'Only authoritative sources can confirm events' };
}

// Rule 3: Authoritative source must have jurisdiction
if (source.is_authoritative && !source.authority_scope.jurisdiction.includes(country)) {
  return { valid: false, error: 'Source lacks jurisdiction for this country' };
}

// Rule 4: Source must be applicable to vector
if (!source.applicable_vectors.includes(vector) && source.applicable_vectors !== 'ALL') {
  return { valid: false, error: 'Source not applicable to this vector' };
}
```

---

### Phase 1.3: Gating Logic (Week 3-4)

#### 1.3.1 Corroboration Engine

**File**: `src/services/csi/gating/corroborationEngine.ts`

**Purpose**: Enforce ≥2 independent sources rule.

**Key Methods**:
```typescript
class CorroborationEngine {
  // Check if candidate has sufficient corroboration
  checkCorroboration(candidate: EventCandidate): CorroborationResult;
  
  // Add corroborating source
  addCorroboratingSource(
    candidate_id: string,
    source: SourceReference
  ): CorroborationResult;
  
  // Validate source independence
  areSourcesIndependent(source1: SourceReference, source2: SourceReference): boolean;
  
  // Calculate corroboration strength
  calculateCorroborationStrength(sources: SourceReference[]): number;
}

interface CorroborationResult {
  is_corroborated: boolean;
  source_count: number;
  independent_source_count: number;
  corroboration_strength: number;
  missing_requirements?: string[];
}
```

**Corroboration Rules**:
```typescript
// Minimum 2 independent sources
const MIN_INDEPENDENT_SOURCES = 2;

// Sources are independent if:
// 1. Different source_name
// 2. Different parent organization
// 3. Not syndicated content (check article similarity)

function areSourcesIndependent(s1: SourceReference, s2: SourceReference): boolean {
  // Check different source
  if (s1.source_name === s2.source_name) return false;
  
  // Check parent organization
  const parent1 = getParentOrg(s1.source_name);
  const parent2 = getParentOrg(s2.source_name);
  if (parent1 === parent2) return false;
  
  // Check content similarity (for syndication detection)
  const similarity = calculateContentSimilarity(s1.article_id, s2.article_id);
  if (similarity > 0.8) return false;  // Likely syndicated
  
  return true;
}

// Corroboration strength increases with:
// - Number of independent sources
// - Credibility of sources
// - Temporal clustering (all report within short window)
function calculateCorroborationStrength(sources: SourceReference[]): number {
  const independentSources = filterIndependentSources(sources);
  const avgCredibility = calculateAverageCredibility(independentSources);
  const temporalCluster = checkTemporalClustering(independentSources);
  
  let strength = independentSources.length * 20;  // Base: 20 per source
  strength *= avgCredibility;                      // Weight by credibility
  if (temporalCluster) strength *= 1.2;           // Boost for clustering
  
  return Math.min(strength, 100);
}
```

---

#### 1.3.2 Persistence Checker

**File**: `src/services/csi/gating/persistenceChecker.ts`

**Purpose**: Validate 48-72 hour persistence requirement.

**Key Methods**:
```typescript
class PersistenceChecker {
  // Check if candidate has persisted long enough
  checkPersistence(candidate: EventCandidate, as_of_date: Date): PersistenceResult;
  
  // Monitor persistence status
  monitorPersistence(candidate_id: string): void;
  
  // Get candidates ready for persistence validation
  getCandidatesForPersistenceCheck(): EventCandidate[];
  
  // Mark candidate as persistent
  markPersistent(candidate_id: string, hours: number): void;
  
  // Mark candidate as fading (losing sources)
  markFading(candidate_id: string, reason: string): void;
}

interface PersistenceResult {
  is_persistent: boolean;
  hours_since_detection: number;
  required_hours: number;
  source_stability: 'STABLE' | 'GROWING' | 'FADING';
  last_mention_date: string;
  persistence_score: number;
}
```

**Persistence Rules**:
```typescript
// Minimum persistence window
const MIN_PERSISTENCE_HOURS = 48;
const IDEAL_PERSISTENCE_HOURS = 72;

function checkPersistence(candidate: EventCandidate, as_of_date: Date): PersistenceResult {
  const detected = new Date(candidate.detected_date);
  const hoursSince = (as_of_date.getTime() - detected.getTime()) / (1000 * 60 * 60);
  
  // Check if minimum time has passed
  if (hoursSince < MIN_PERSISTENCE_HOURS) {
    return {
      is_persistent: false,
      hours_since_detection: hoursSince,
      required_hours: MIN_PERSISTENCE_HOURS,
      source_stability: 'UNKNOWN',
      persistence_score: 0
    };
  }
  
  // Check source stability
  const stability = checkSourceStability(candidate);
  
  // Persistent if:
  // 1. Minimum time passed
  // 2. Sources are stable or growing (not fading)
  // 3. Recent mentions exist
  const isPersistent = 
    hoursSince >= MIN_PERSISTENCE_HOURS &&
    stability !== 'FADING' &&
    hasRecentMentions(candidate, 24);  // Within last 24 hours
  
  return {
    is_persistent: isPersistent,
    hours_since_detection: hoursSince,
    required_hours: MIN_PERSISTENCE_HOURS,
    source_stability: stability,
    last_mention_date: getLastMentionDate(candidate),
    persistence_score: calculatePersistenceScore(hoursSince, stability)
  };
}

// Source stability check
function checkSourceStability(candidate: EventCandidate): 'STABLE' | 'GROWING' | 'FADING' {
  const recentSources = getSourcesInWindow(candidate, 24);  // Last 24 hours
  const priorSources = getSourcesInWindow(candidate, 48, 24);  // 24-48 hours ago
  
  if (recentSources.length > priorSources.length) return 'GROWING';
  if (recentSources.length < priorSources.length * 0.5) return 'FADING';
  return 'STABLE';
}
```

---

#### 1.3.3 Credibility Scorer

**File**: `src/services/csi/gating/credibilityScorer.ts`

**Purpose**: Weight sources by credibility to filter noise.

**Key Methods**:
```typescript
class CredibilityScorer {
  // Calculate credibility score for a source
  calculateSourceCredibility(source: SourceReference): number;
  
  // Calculate aggregate credibility for multiple sources
  calculateAggregateCredibility(sources: SourceReference[]): number;
  
  // Check if credibility threshold is met
  meetsCredibilityThreshold(
    sources: SourceReference[],
    threshold: number
  ): boolean;
  
  // Update source credibility based on historical accuracy
  updateSourceCredibility(source_id: string, accuracy_event: AccuracyEvent): void;
}

interface AccuracyEvent {
  source_id: string;
  prediction_date: string;
  outcome_date: string;
  was_accurate: boolean;
  event_type: EventType;
}
```

**Credibility Calculation**:
```typescript
function calculateSourceCredibility(source: SourceReference): number {
  const metadata = sourceRegistry.getSource(source.source_name);
  if (!metadata) return 0.5;  // Default for unknown sources
  
  // Start with base credibility
  let score = metadata.base_credibility_score;
  
  // Adjust for source type
  if (source.source_type === 'CONFIRMATION') {
    score *= 1.2;  // Boost authoritative sources
  }
  
  // Adjust for timeliness
  const hoursSincePublish = getHoursSince(source.timestamp);
  if (hoursSincePublish < 24) {
    score *= 1.1;  // Boost recent sources
  } else if (hoursSincePublish > 168) {  // 1 week
    score *= 0.9;  // Penalize stale sources
  }
  
  // Adjust for historical accuracy
  const accuracy = getHistoricalAccuracy(source.source_name);
  score *= accuracy;
  
  return Math.min(score, 1.0);
}

// Aggregate credibility: weighted average
function calculateAggregateCredibility(sources: SourceReference[]): number {
  if (sources.length === 0) return 0;
  
  const scores = sources.map(s => calculateSourceCredibility(s));
  const weights = sources.map(s => getSourceWeight(s));
  
  const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  return weightedSum / totalWeight;
}

// Credibility thresholds by event severity
const CREDIBILITY_THRESHOLDS = {
  LOW: 0.6,
  MEDIUM: 0.7,
  HIGH: 0.8,
  CRITICAL: 0.9
};
```

---

#### 1.3.4 Gating Orchestrator

**File**: `src/services/csi/gating/gatingOrchestrator.ts`

**Purpose**: Coordinate all gating checks before state transitions.

**Key Methods**:
```typescript
class GatingOrchestrator {
  // Check if candidate can transition to CORROBORATED
  canCorroborate(candidate: EventCandidate): GatingResult;
  
  // Check if candidate can transition to PERSISTENT
  canMarkPersistent(candidate: EventCandidate, as_of_date: Date): GatingResult;
  
  // Check if candidate can transition to CONFIRMED
  canConfirm(
    candidate: EventCandidate,
    confirmation_source: SourceReference
  ): GatingResult;
  
  // Run all gating checks
  runAllGates(candidate: EventCandidate, target_state: CandidateState): GatingResult;
}

interface GatingResult {
  passed: boolean;
  gates_passed: string[];
  gates_failed: string[];
  error_messages: string[];
  recommendations: string[];
}
```

**Gating Logic**:
```typescript
function canCorroborate(candidate: EventCandidate): GatingResult {
  const result: GatingResult = {
    passed: true,
    gates_passed: [],
    gates_failed: [],
    error_messages: [],
    recommendations: []
  };
  
  // Gate 1: Corroboration
  const corroboration = corroborationEngine.checkCorroboration(candidate);
  if (!corroboration.is_corroborated) {
    result.passed = false;
    result.gates_failed.push('CORROBORATION');
    result.error_messages.push(
      `Insufficient corroboration: ${corroboration.independent_source_count}/2 independent sources`
    );
    result.recommendations.push('Wait for additional independent sources');
  } else {
    result.gates_passed.push('CORROBORATION');
  }
  
  // Gate 2: Credibility
  const credibility = credibilityScorer.calculateAggregateCredibility(
    candidate.detection_sources
  );
  const threshold = CREDIBILITY_THRESHOLDS[candidate.estimated_severity];
  
  if (credibility < threshold) {
    result.passed = false;
    result.gates_failed.push('CREDIBILITY');
    result.error_messages.push(
      `Credibility too low: ${credibility.toFixed(2)} < ${threshold}`
    );
    result.recommendations.push('Wait for more credible sources');
  } else {
    result.gates_passed.push('CREDIBILITY');
  }
  
  return result;
}

function canMarkPersistent(candidate: EventCandidate, as_of_date: Date): GatingResult {
  const result: GatingResult = {
    passed: true,
    gates_passed: [],
    gates_failed: [],
    error_messages: [],
    recommendations: []
  };
  
  // Must already be corroborated
  if (candidate.state !== 'CORROBORATED') {
    result.passed = false;
    result.gates_failed.push('STATE_PREREQUISITE');
    result.error_messages.push('Candidate must be CORROBORATED first');
    return result;
  }
  
  // Gate: Persistence
  const persistence = persistenceChecker.checkPersistence(candidate, as_of_date);
  if (!persistence.is_persistent) {
    result.passed = false;
    result.gates_failed.push('PERSISTENCE');
    result.error_messages.push(
      `Not persistent: ${persistence.hours_since_detection.toFixed(1)}h < ${persistence.required_hours}h`
    );
    result.recommendations.push(`Wait ${(persistence.required_hours - persistence.hours_since_detection).toFixed(1)} more hours`);
  } else {
    result.gates_passed.push('PERSISTENCE');
  }
  
  return result;
}

function canConfirm(
  candidate: EventCandidate,
  confirmation_source: SourceReference
): GatingResult {
  const result: GatingResult = {
    passed: true,
    gates_passed: [],
    gates_failed: [],
    error_messages: [],
    recommendations: []
  };
  
  // Must be persistent
  if (candidate.state !== 'PERSISTENT') {
    result.passed = false;
    result.gates_failed.push('STATE_PREREQUISITE');
    result.error_messages.push('Candidate must be PERSISTENT first');
    return result;
  }
  
  // Gate 1: Source must be authoritative
  const isAuthoritative = sourceClassifier.isAuthoritativeFor(
    confirmation_source.source_name,
    candidate.event_type,
    candidate.primary_vector,
    candidate.country
  );
  
  if (!isAuthoritative) {
    result.passed = false;
    result.gates_failed.push('AUTHORITATIVE_SOURCE');
    result.error_messages.push(
      `Source ${confirmation_source.source_name} is not authoritative for ${candidate.primary_vector}`
    );
    result.recommendations.push(
      `Required sources: ${getRequiredConfirmationSources(candidate.primary_vector, candidate.country).join(', ')}`
    );
  } else {
    result.gates_passed.push('AUTHORITATIVE_SOURCE');
  }
  
  // Gate 2: Source must have jurisdiction
  const hasJurisdiction = checkJurisdiction(confirmation_source, candidate.country);
  if (!hasJurisdiction) {
    result.passed = false;
    result.gates_failed.push('JURISDICTION');
    result.error_messages.push('Source lacks jurisdiction for this country');
  } else {
    result.gates_passed.push('JURISDICTION');
  }
  
  return result;
}
```

---

### Phase 1.4: Vector Routing (Week 4-5)

#### 1.4.1 Vector Router

**File**: `src/services/csi/routing/vectorRouter.ts`

**Purpose**: Deterministic SC1-SC7 classification.

**Data Structure**:
```typescript
interface VectorRoutingRule {
  vector: VectorCode;
  priority: number;
  keywords: string[];
  event_types: EventType[];
  agencies: string[];
  policy_terms: string[];
  exclusions: string[];
}

// Vector routing rules (from Appendix B)
const VECTOR_ROUTING_RULES: VectorRoutingRule[] = [
  {
    vector: 'SC1',
    priority: 1,
    keywords: ['sanction', 'export control', 'embargo', 'asset freeze'],
    event_types: ['SANCTIONS_IMPOSED', 'EXPORT_CONTROL'],
    agencies: ['OFAC', 'BIS', 'EU', 'UN Security Council'],
    policy_terms: ['SDN', 'entity list', 'denied persons'],
    exclusions: []
  },
  {
    vector: 'SC2',
    priority: 2,
    keywords: ['tariff', 'duty', 'trade barrier', 'quota'],
    event_types: ['TARIFF_IMPOSED', 'TRADE_RESTRICTION'],
    agencies: ['USTR', 'MOFCOM', 'WTO'],
    policy_terms: ['Section 301', 'anti-dumping', 'countervailing'],
    exclusions: []
  },
  // ... SC3-SC7 rules
];
```

**Key Methods**:
```typescript
class VectorRouter {
  // Route candidate to primary vector
  routeToPrimaryVector(candidate: EventCandidate): VectorCode;
  
  // Identify secondary vectors (spillover)
  identifySecondaryVectors(candidate: EventCandidate): VectorCode[];
  
  // Validate vector assignment
  validateVectorAssignment(
    vector: VectorCode,
    candidate: EventCandidate
  ): ValidationResult;
  
  // Get routing confidence
  getRoutingConfidence(
    vector: VectorCode,
    candidate: EventCandidate
  ): number;
}
```

**Routing Logic**:
```typescript
function routeToPrimaryVector(candidate: EventCandidate): VectorCode {
  const scores = new Map<VectorCode, number>();
  
  // Score each vector
  for (const rule of VECTOR_ROUTING_RULES) {
    let score = 0;
    
    // Check event type match
    if (rule.event_types.includes(candidate.event_type)) {
      score += 50;
    }
    
    // Check keyword matches in description
    const description = candidate.description.toLowerCase();
    const keywordMatches = rule.keywords.filter(kw => 
      description.includes(kw.toLowerCase())
    ).length;
    score += keywordMatches * 10;
    
    // Check agency mentions
    const agencyMatches = rule.agencies.filter(agency =>
      candidate.entities.agencies.includes(agency)
    ).length;
    score += agencyMatches * 15;
    
    // Check policy terms
    const policyMatches = rule.policy_terms.filter(term =>
      candidate.entities.policyTerms.includes(term)
    ).length;
    score += policyMatches * 20;
    
    // Check exclusions
    const hasExclusions = rule.exclusions.some(excl =>
      description.includes(excl.toLowerCase())
    );
    if (hasExclusions) score = 0;
    
    scores.set(rule.vector, score);
  }
  
  // Return highest scoring vector
  let maxScore = 0;
  let primaryVector: VectorCode = 'SC1';
  
  scores.forEach((score, vector) => {
    if (score > maxScore) {
      maxScore = score;
      primaryVector = vector;
    }
  });
  
  return primaryVector;
}

function identifySecondaryVectors(candidate: EventCandidate): VectorCode[] {
  const scores = new Map<VectorCode, number>();
  
  // Score all vectors (same logic as primary)
  // ...
  
  // Return vectors with score > threshold, excluding primary
  const threshold = 30;
  const secondary: VectorCode[] = [];
  
  scores.forEach((score, vector) => {
    if (vector !== candidate.primary_vector && score > threshold) {
      secondary.push(vector);
    }
  });
  
  // Cap at 1 secondary vector (per Appendix B)
  return secondary.slice(0, 1);
}
```

---

#### 1.4.2 Entity Resolver

**File**: `src/services/csi/routing/entityResolver.ts`

**Purpose**: Resolve actor, target, and spillover countries.

**Key Methods**:
```typescript
class EntityResolver {
  // Resolve target country (primary affected)
  resolveTargetCountry(candidate: EventCandidate): string;
  
  // Resolve actor country (if cross-border)
  resolveActorCountry(candidate: EventCandidate): string | undefined;
  
  // Identify spillover countries
  identifySpilloverCountries(
    candidate: EventCandidate,
    maxSpillovers: number = 3
  ): string[];
  
  // Validate entity resolution
  validateEntityResolution(candidate: EventCandidate): ValidationResult;
}
```

**Resolution Logic**:
```typescript
function resolveTargetCountry(candidate: EventCandidate): string {
  // Priority 1: Explicit country in event type
  if (candidate.country) return candidate.country;
  
  // Priority 2: Most mentioned country in entities
  const countryCounts = new Map<string, number>();
  candidate.entities.countries.forEach(country => {
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  });
  
  let maxCount = 0;
  let targetCountry = '';
  countryCounts.forEach((count, country) => {
    if (count > maxCount) {
      maxCount = count;
      targetCountry = country;
    }
  });
  
  return targetCountry;
}

function resolveActorCountry(candidate: EventCandidate): string | undefined {
  // Only for cross-border events
  const crossBorderTypes = [
    'SANCTIONS_IMPOSED',
    'TARIFF_IMPOSED',
    'EXPORT_CONTROL',
    'TRADE_RESTRICTION'
  ];
  
  if (!crossBorderTypes.includes(candidate.event_type)) {
    return undefined;
  }
  
  // Look for agency mentions to identify actor
  const actorAgencies = {
    'US': ['OFAC', 'BIS', 'USTR', 'Treasury'],
    'EU': ['European Commission', 'EU Council'],
    'China': ['MOFCOM', 'NDRC'],
    'UK': ['FCDO', 'OFSI']
  };
  
  for (const [country, agencies] of Object.entries(actorAgencies)) {
    if (agencies.some(agency => candidate.entities.agencies.includes(agency))) {
      return country;
    }
  }
  
  return undefined;
}

function identifySpilloverCountries(
  candidate: EventCandidate,
  maxSpillovers: number = 3
): string[] {
  const target = candidate.country;
  const spillovers: string[] = [];
  
  // Identify spillovers based on:
  // 1. Trade relationships
  // 2. Supply chain linkages
  // 3. Geographic proximity
  // 4. Sector dependencies
  
  const tradePartners = getTopTradePartners(target, 5);
  const supplyChainLinks = getSupplyChainLinks(target, candidate.affected_sectors);
  
  // Combine and rank
  const candidates = new Set([...tradePartners, ...supplyChainLinks]);
  const ranked = Array.from(candidates).map(country => ({
    country,
    score: calculateSpilloverScore(country, target, candidate)
  })).sort((a, b) => b.score - a.score);
  
  // Take top N, excluding target
  return ranked
    .filter(c => c.country !== target)
    .slice(0, maxSpillovers)
    .map(c => c.country);
}
```

---

### Phase 1.5: CSI Calculation (Week 5-6)

#### 1.5.1 CSI Engine

**File**: `src/services/csi/core/csiEngine.ts`

**Purpose**: Main CSI calculation orchestrator.

**Key Methods**:
```typescript
class CSIEngine {
  // Calculate CSI for a country at a point in time
  calculateCSI(country: string, as_of_date: Date): CSIResult;
  
  // Calculate CSI for multiple countries
  calculateMultipleCSI(countries: string[], as_of_date: Date): Map<string, CSIResult>;
  
  // Get CSI time series
  getCSITimeSeries(
    country: string,
    start_date: Date,
    end_date: Date,
    interval: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): CSITimeSeries;
  
  // Get CSI attribution (what moved CSI)
  getCSIAttribution(country: string, as_of_date: Date): CSIAttribution;
}

interface CSIResult {
  country: string;
  as_of_date: string;
  
  // Components
  structural_baseline: number;
  escalation_drift: number;
  event_delta: number;
  composite_csi: number;
  
  // Metadata
  active_signals_count: number;
  active_events_count: number;
  last_event_date?: string;
  
  // Audit
  calculation_timestamp: string;
  calculation_method: string;
}

interface CSIAttribution {
  country: string;
  as_of_date: string;
  composite_csi: number;
  
  // Baseline
  baseline: {
    value: number;
    source: string;
    last_updated: string;
  };
  
  // Drift
  drift: {
    total: number;
    signals: Array<{
      signal_id: string;
      vector: VectorCode;
      expected_drift: number;
      probability: number;
      description: string;
    }>;
  };
  
  // Events
  events: {
    total: number;
    deltas: Array<{
      event_id: string;
      vector: VectorCode;
      net_delta_csi: number;
      current_delta_csi: number;
      confirmed_date: string;
      description: string;
    }>;
  };
}
```

**Calculation Logic**:
```typescript
function calculateCSI(country: string, as_of_date: Date): CSIResult {
  // Component 1: Structural Baseline
  const baseline = baselineCalculator.getBaseline(country);
  
  // Component 2: Escalation Drift
  const drift = driftCalculator.calculateDrift(country, as_of_date);
  
  // Component 3: Event Delta
  const delta = deltaCalculator.calculateDelta(country, as_of_date);
  
  // Composite CSI
  const composite = baseline + drift + delta;
  
  // Metadata
  const activeSignals = escalationSignalLog.getActiveSignals(country);
  const activeEvents = eventDeltaLedger.getActiveEvents(country);
  
  return {
    country,
    as_of_date: as_of_date.toISOString(),
    structural_baseline: baseline,
    escalation_drift: drift,
    event_delta: delta,
    composite_csi: composite,
    active_signals_count: activeSignals.length,
    active_events_count: activeEvents.length,
    last_event_date: getLastEventDate(activeEvents),
    calculation_timestamp: new Date().toISOString(),
    calculation_method: 'OPTION_2_EXPECTATION_WEIGHTED'
  };
}

function getCSIAttribution(country: string, as_of_date: Date): CSIAttribution {
  const csi = calculateCSI(country, as_of_date);
  
  // Get baseline details
  const baselineDetails = baselineStore.getBaseline(country);
  
  // Get drift details
  const signals = escalationSignalLog.getActiveSignals(country);
  const driftSignals = signals.map(s => ({
    signal_id: s.signal_id,
    vector: s.vector,
    expected_drift: s.expected_drift,
    probability: s.probability,
    description: s.description || `${s.signal_type} for ${s.country}`
  }));
  
  // Get event details
  const events = eventDeltaLedger.getActiveEvents(country);
  const eventDeltas = events.map(e => ({
    event_id: e.event_id,
    vector: e.primary_vector,
    net_delta_csi: e.net_delta_csi,
    current_delta_csi: e.current_delta_csi,
    confirmed_date: e.confirmed_date,
    description: e.description
  }));
  
  return {
    country,
    as_of_date: as_of_date.toISOString(),
    composite_csi: csi.composite_csi,
    baseline: {
      value: csi.structural_baseline,
      source: 'WGI + Freedom House + V-Dem',
      last_updated: baselineDetails?.last_updated || ''
    },
    drift: {
      total: csi.escalation_drift,
      signals: driftSignals
    },
    events: {
      total: csi.event_delta,
      deltas: eventDeltas
    }
  };
}
```

---

#### 1.5.2 Drift Calculator

**File**: `src/services/csi/calculation/driftCalculator.ts`

**Purpose**: Calculate escalation drift from active signals.

**Key Methods**:
```typescript
class DriftCalculator {
  // Calculate total drift for a country
  calculateDrift(country: string, as_of_date: Date): number;
  
  // Calculate drift by vector
  calculateDriftByVector(country: string, as_of_date: Date): Map<VectorCode, number>;
  
  // Get drift contributors
  getDriftContributors(country: string): EscalationSignal[];
}
```

**Calculation Logic**:
```typescript
function calculateDrift(country: string, as_of_date: Date): number {
  const signals = escalationSignalLog.getActiveSignals(country);
  
  // Sum expected_drift for all active signals
  const totalDrift = signals.reduce((sum, signal) => {
    // Only include persistent signals
    if (signal.persistence_status !== 'PERSISTENT') return sum;
    
    // expected_drift = probability × severity_if_realized
    return sum + signal.expected_drift;
  }, 0);
  
  return totalDrift;
}

function calculateDriftByVector(
  country: string,
  as_of_date: Date
): Map<VectorCode, number> {
  const signals = escalationSignalLog.getActiveSignals(country);
  const driftByVector = new Map<VectorCode, number>();
  
  signals.forEach(signal => {
    if (signal.persistence_status !== 'PERSISTENT') return;
    
    const currentDrift = driftByVector.get(signal.vector) || 0;
    driftByVector.set(signal.vector, currentDrift + signal.expected_drift);
  });
  
  return driftByVector;
}
```

---

#### 1.5.3 Delta Calculator

**File**: `src/services/csi/calculation/deltaCalculator.ts`

**Purpose**: Calculate event delta with netting and decay.

**Key Methods**:
```typescript
class DeltaCalculator {
  // Calculate total delta for a country
  calculateDelta(country: string, as_of_date: Date): number;
  
  // Calculate delta by vector
  calculateDeltaByVector(country: string, as_of_date: Date): Map<VectorCode, number>;
  
  // Calculate netting for new event
  calculateNetting(candidate: EventCandidate): number;
  
  // Apply decay to event
  applyDecay(event: EventDelta, as_of_date: Date): number;
}
```

**Calculation Logic**:
```typescript
function calculateDelta(country: string, as_of_date: Date): number {
  const events = eventDeltaLedger.getActiveEvents(country);
  
  // Sum current_delta_csi (after decay) for all active events
  const totalDelta = events.reduce((sum, event) => {
    const decayedDelta = applyDecay(event, as_of_date);
    return sum + decayedDelta;
  }, 0);
  
  return totalDelta;
}

function calculateNetting(candidate: EventCandidate): number {
  // Find signals for same country + vector
  const signals = escalationSignalLog.getActiveSignals(
    candidate.country,
    candidate.primary_vector
  );
  
  // Filter signals that match this event type
  const matchingSignals = signals.filter(signal =>
    isSignalMatchingEvent(signal, candidate)
  );
  
  // Sum their expected drift
  const nettedDrift = matchingSignals.reduce(
    (sum, signal) => sum + signal.expected_drift,
    0
  );
  
  return nettedDrift;
}

function applyDecay(event: EventDelta, as_of_date: Date): number {
  const schedule = event.decay_schedule;
  
  if (schedule.type === 'NONE') {
    return event.net_delta_csi;
  }
  
  const effectiveDate = new Date(event.effective_date);
  const daysSince = (as_of_date.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (schedule.type === 'LINEAR') {
    const decayRate = schedule.decay_rate || 0.01;
    const decayFactor = Math.max(0, 1 - daysSince * decayRate);
    return event.net_delta_csi * decayFactor;
  }
  
  if (schedule.type === 'EXPONENTIAL') {
    const halfLife = schedule.half_life_days || 30;
    const decayFactor = Math.pow(0.5, daysSince / halfLife);
    return event.net_delta_csi * decayFactor;
  }
  
  return event.net_delta_csi;
}
```

---

### Phase 1.6: Replay & Audit (Week 6-7)

#### 1.6.1 Replay Engine

**File**: `src/services/csi/core/replayEngine.ts`

**Purpose**: Support baseline cut date and replay-forward logic.

**Key Methods**:
```typescript
class ReplayEngine {
  // Set baseline cut date
  setBaselineCutDate(date: Date): void;
  
  // Replay CSI from cut date to target date
  replayCSI(
    country: string,
    cut_date: Date,
    target_date: Date
  ): ReplayResult;
  
  // Get CSI at historical date
  getHistoricalCSI(country: string, date: Date): CSIResult;
  
  // Reconstruct CSI time series
  reconstructTimeSeries(
    country: string,
    start_date: Date,
    end_date: Date
  ): CSITimeSeries;
}

interface ReplayResult {
  country: string;
  cut_date: string;
  target_date: string;
  
  baseline_at_cut: number;
  csi_at_cut: number;
  csi_at_target: number;
  
  events_applied: EventDelta[];
  signals_tracked: EscalationSignal[];
  
  replay_log: ReplayLogEntry[];
}

interface ReplayLogEntry {
  timestamp: string;
  action: 'SIGNAL_ADDED' | 'SIGNAL_EXPIRED' | 'EVENT_CONFIRMED' | 'DECAY_APPLIED';
  description: string;
  csi_before: number;
  csi_after: number;
  delta: number;
}
```

**Replay Logic**:
```typescript
function replayCSI(
  country: string,
  cut_date: Date,
  target_date: Date
): ReplayResult {
  const log: ReplayLogEntry[] = [];
  
  // Start with baseline at cut date
  let currentCSI = baselineStore.getBaseline(country, cut_date);
  const baselineAtCut = currentCSI;
  
  log.push({
    timestamp: cut_date.toISOString(),
    action: 'BASELINE_SET',
    description: `Baseline CSI set to ${currentCSI.toFixed(2)}`,
    csi_before: 0,
    csi_after: currentCSI,
    delta: currentCSI
  });
  
  // Get all signals and events between cut_date and target_date
  const signals = escalationSignalLog.getSignalsInRange(country, cut_date, target_date);
  const events = eventDeltaLedger.getEventsInRange(country, cut_date, target_date);
  
  // Create timeline of all CSI-affecting actions
  const timeline = createTimeline(signals, events);
  
  // Replay timeline
  for (const entry of timeline) {
    const csiBefore = currentCSI;
    
    if (entry.type === 'SIGNAL_ADDED') {
      currentCSI += entry.signal.expected_drift;
      log.push({
        timestamp: entry.timestamp,
        action: 'SIGNAL_ADDED',
        description: `Signal added: ${entry.signal.description}`,
        csi_before: csiBefore,
        csi_after: currentCSI,
        delta: entry.signal.expected_drift
      });
    }
    
    if (entry.type === 'EVENT_CONFIRMED') {
      // Net out corresponding signals
      const netting = calculateNetting(entry.event);
      currentCSI -= netting;  // Remove drift
      currentCSI += entry.event.net_delta_csi;  // Add event delta
      
      log.push({
        timestamp: entry.timestamp,
        action: 'EVENT_CONFIRMED',
        description: `Event confirmed: ${entry.event.description}`,
        csi_before: csiBefore,
        csi_after: currentCSI,
        delta: entry.event.net_delta_csi - netting
      });
    }
    
    if (entry.type === 'DECAY_APPLIED') {
      const decayAmount = entry.decay_amount;
      currentCSI -= decayAmount;
      
      log.push({
        timestamp: entry.timestamp,
        action: 'DECAY_APPLIED',
        description: `Decay applied to ${entry.event_id}`,
        csi_before: csiBefore,
        csi_after: currentCSI,
        delta: -decayAmount
      });
    }
  }
  
  return {
    country,
    cut_date: cut_date.toISOString(),
    target_date: target_date.toISOString(),
    baseline_at_cut: baselineAtCut,
    csi_at_cut: baselineAtCut,
    csi_at_target: currentCSI,
    events_applied: events,
    signals_tracked: signals,
    replay_log: log
  };
}
```

---

#### 1.6.2 Audit Logger

**File**: `src/services/csi/core/auditLogger.ts`

**Purpose**: Comprehensive audit trail for all CSI movements.

**Key Methods**:
```typescript
class AuditLogger {
  // Log CSI calculation
  logCalculation(result: CSIResult, attribution: CSIAttribution): void;
  
  // Log state transition
  logStateTransition(
    candidate_id: string,
    from_state: CandidateState,
    to_state: CandidateState,
    reason: string,
    user?: string
  ): void;
  
  // Log signal creation/update
  logSignal(action: 'CREATED' | 'UPDATED' | 'EXPIRED', signal: EscalationSignal): void;
  
  // Log event confirmation
  logEventConfirmation(event: EventDelta, candidate: EventCandidate): void;
  
  // Query audit trail
  getAuditTrail(
    entity_type: 'SIGNAL' | 'CANDIDATE' | 'EVENT' | 'CSI',
    entity_id: string
  ): AuditEntry[];
  
  // Get CSI movement history
  getCSIMovementHistory(country: string, start_date: Date, end_date: Date): AuditEntry[];
}

interface AuditEntry {
  audit_id: string;
  timestamp: string;
  entity_type: 'SIGNAL' | 'CANDIDATE' | 'EVENT' | 'CSI';
  entity_id: string;
  action: string;
  user?: string;
  details: any;
  csi_impact?: {
    country: string;
    csi_before: number;
    csi_after: number;
    delta: number;
  };
}
```

---

## Testing Strategy

### Unit Tests

Each module must have comprehensive unit tests:

```typescript
// Example: escalationSignalLog.test.ts
describe('EscalationSignalLog', () => {
  it('should add new signal', () => {
    const signal = signalLog.addSignal({
      country: 'China',
      vector: 'SC2',
      signal_type: 'tariff_threat',
      probability: 0.6,
      severity_if_realized: 10
    });
    
    expect(signal.expected_drift).toBe(6);  // 0.6 × 10
  });
  
  it('should calculate drift correctly', () => {
    // Add multiple signals
    signalLog.addSignal({ country: 'China', vector: 'SC2', probability: 0.6, severity: 10 });
    signalLog.addSignal({ country: 'China', vector: 'SC1', probability: 0.4, severity: 8 });
    
    const drift = signalLog.calculateDrift('China');
    expect(drift).toBe(9.2);  // 6 + 3.2
  });
  
  it('should net drift when event confirmed', () => {
    const signal = signalLog.addSignal({ country: 'China', vector: 'SC2', probability: 0.6, severity: 10 });
    
    const netting = deltaCalculator.calculateNetting({
      country: 'China',
      primary_vector: 'SC2',
      event_type: 'TARIFF_IMPOSED'
    });
    
    expect(netting).toBe(6);  // Should net out the signal
  });
});
```

### Integration Tests

Test full pipeline flows:

```typescript
// Example: endToEndFlow.test.ts
describe('CSI Engine End-to-End', () => {
  it('should process detection → confirmation → CSI update', async () => {
    // 1. Detection creates candidate
    const article = createMockArticle('China tariff threat');
    const candidate = await detectionPipeline.process(article);
    
    expect(candidate.state).toBe('DETECTED');
    
    // 2. Corroboration
    const article2 = createMockArticle('China tariff threat', 'Reuters');
    await detectionPipeline.process(article2);
    
    const updated = candidateStore.getCandidate(candidate.candidate_id);
    expect(updated.state).toBe('CORROBORATED');
    
    // 3. Persistence (simulate 48 hours)
    await advanceTime(48 * 60 * 60 * 1000);
    await persistenceChecker.checkAll();
    
    const persistent = candidateStore.getCandidate(candidate.candidate_id);
    expect(persistent.state).toBe('PERSISTENT');
    
    // 4. Confirmation
    const confirmation = createMockConfirmation('USTR', 'tariff_imposed');
    await confirmationPipeline.process(confirmation, candidate.candidate_id);
    
    const confirmed = candidateStore.getCandidate(candidate.candidate_id);
    expect(confirmed.state).toBe('CONFIRMED');
    
    // 5. CSI updated
    const csi = csiEngine.calculateCSI('China', new Date());
    expect(csi.event_delta).toBeGreaterThan(0);
    
    // 6. Drift netted
    const signals = escalationSignalLog.getActiveSignals('China', 'SC2');
    expect(signals.length).toBe(0);  // Signal should be expired
  });
});
```

---

## Validation Artifacts

Before Phase 2, produce these artifacts:

### 1. Sample CSI Time Series

```json
{
  "country": "China",
  "period": "2024-01-01 to 2024-03-01",
  "data_points": [
    {
      "date": "2024-01-01",
      "baseline": 45.2,
      "drift": 0,
      "delta": 0,
      "composite": 45.2
    },
    {
      "date": "2024-01-15",
      "baseline": 45.2,
      "drift": 6.0,
      "delta": 0,
      "composite": 51.2,
      "note": "Tariff threat signal added"
    },
    {
      "date": "2024-02-01",
      "baseline": 45.2,
      "drift": 6.0,
      "delta": 4.0,
      "composite": 55.2,
      "note": "Tariff confirmed, drift netted"
    },
    {
      "date": "2024-03-01",
      "baseline": 45.2,
      "drift": 6.0,
      "delta": 3.2,
      "composite": 54.4,
      "note": "Event decay applied"
    }
  ]
}
```

### 2. Candidate Lifecycle Log

```json
{
  "candidate_id": "CAND-CH-TARIFF-1705334400000",
  "lifecycle": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "state": "DETECTED",
      "sources": ["Reuters", "Bloomberg"],
      "confidence": 65
    },
    {
      "timestamp": "2024-01-15T14:30:00Z",
      "state": "CORROBORATED",
      "sources": ["Reuters", "Bloomberg", "AP"],
      "confidence": 75,
      "note": "3 independent sources"
    },
    {
      "timestamp": "2024-01-17T10:00:00Z",
      "state": "PERSISTENT",
      "hours_persistent": 48,
      "note": "Survived 48-hour window"
    },
    {
      "timestamp": "2024-02-01T09:00:00Z",
      "state": "CONFIRMED",
      "confirmation_source": "USTR",
      "confirmed_severity": 10,
      "delta_csi": 10,
      "netted_drift": 6,
      "net_delta_csi": 4
    }
  ]
}
```

### 3. Event Ledger Sample

```json
{
  "event_id": "EVT-CH-TARIFF-20240201",
  "candidate_id": "CAND-CH-TARIFF-1705334400000",
  "country": "China",
  "vector": "SC2",
  "detected_date": "2024-01-15",
  "confirmed_date": "2024-02-01",
  "effective_date": "2024-02-01",
  "base_delta_csi": 10,
  "netted_drift": 6,
  "net_delta_csi": 4,
  "current_delta_csi": 3.2,
  "decay_schedule": {
    "type": "EXPONENTIAL",
    "half_life_days": 30
  },
  "confirmation_sources": [
    {
      "source_name": "USTR",
      "source_type": "CONFIRMATION",
      "credibility": 1.0
    }
  ]
}
```

### 4. Walkthrough Document

Create a narrative document explaining:
- How a sample event flows through the system
- State transitions and gating checks
- CSI calculation at each step
- Netting and decay logic
- Audit trail

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1-2  | State Machine | EscalationSignalLog, EventCandidateStore, EventDeltaLedger |
| 2-3  | Source Classification | SourceRegistry, SourceClassifier, role enforcement |
| 3-4  | Gating Logic | Corroboration, Persistence, Credibility, Orchestrator |
| 4-5  | Vector Routing | VectorRouter, EntityResolver, routing rules |
| 5-6  | CSI Calculation | CSIEngine, DriftCalculator, DeltaCalculator |
| 6-7  | Replay & Audit | ReplayEngine, AuditLogger, validation artifacts |

---

## Success Criteria

Phase 1 is complete when:

1. ✅ All state stores implemented and tested
2. ✅ Source classification enforced (detection ≠ confirmation)
3. ✅ All gating checks operational (corroboration, persistence, credibility)
4. ✅ Vector routing deterministic and validated
5. ✅ CSI calculation produces correct output: CSI = Baseline + Drift + Delta
6. ✅ Netting logic works (drift netted when event confirmed)
7. ✅ Decay logic works (events decay over time)
8. ✅ Replay engine can reconstruct historical CSI
9. ✅ Full audit trail available for every CSI movement
10. ✅ Validation artifacts produced (time series, logs, walkthrough)
11. ✅ Integration tests pass for full pipeline
12. ✅ You can answer: "Why did CSI move?" with full attribution

---

## Next Steps After Phase 1

Once Phase 1 is validated:

1. **Phase 2A: UI Integration**
   - Wire CSI Analytics Dashboard to real CSI outputs
   - Display CSI(t) time series
   - Show baseline/drift/delta decomposition
   - Add "Why did CSI move?" explanations

2. **Phase 2B: Country Risk View**
   - Heat map of countries by CSI
   - Country drill-down pages
   - Attribution panels
   - Audit trail visibility

3. **Phase 2C: Controls**
   - Baseline cut date selector
   - Replay controls
   - Candidate management UI
   - Manual confirmation workflow

---

## Questions for Clarification

Before implementation, please confirm:

1. **Baseline Source**: Which structural baseline sources should we use? (WGI, Freedom House, V-Dem, or a composite?)

2. **Decay Defaults**: What should be the default decay schedule for events? (Linear 1%/day, Exponential 30-day half-life, or event-type specific?)

3. **Persistence Window**: Confirm 48-72 hours, or should it vary by event severity?

4. **Spillover Cap**: Confirm maximum 1 secondary vector and 3 spillover countries, or adjust?

5. **Manual Override**: Should there be a manual override for gating checks, or strictly enforce automation?

6. **Historical Data**: Do you have historical events to backfill for replay validation?

---

## Conclusion

This implementation plan provides a complete, deterministic CSI engine that matches Appendix B specifications. The architecture separates concerns (detection vs confirmation, signals vs events, drift vs delta), enforces gating rules, and provides full auditability.

The key difference from the current implementation:
- **Current**: Event analytics dashboard (descriptive)
- **Phase 1**: CSI calculation engine (prescriptive)

Phase 1 builds the engine. Phase 2 connects it to the UI.

**Estimated effort**: 6-7 weeks for a single full-time engineer, or 3-4 weeks for a team of 2.

Ready to proceed?