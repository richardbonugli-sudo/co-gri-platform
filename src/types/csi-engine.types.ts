/**
 * CSI Engine Type Definitions
 * 
 * Core types for Phase 1 CSI Engine implementation per Appendix B
 */

// ===== Enums and Constants =====

export type VectorCode = 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';

export type EventType = 
  | 'SANCTIONS_IMPOSED'
  | 'EXPORT_CONTROL'
  | 'TARIFF_IMPOSED'
  | 'TRADE_RESTRICTION'
  | 'SUPPLY_CHAIN_DISRUPTION'
  | 'KINETIC_CONFLICT'
  | 'CAPITAL_CONTROLS'
  | 'POLITICAL_INSTABILITY'
  | 'CYBER_INCIDENT'
  | 'REGULATORY_CHANGE';

export type CandidateState = 'DETECTED' | 'CORROBORATED' | 'PERSISTENT' | 'CONFIRMED' | 'REJECTED';

export type PersistenceStatus = 'NEW' | 'PERSISTENT' | 'FADING' | 'EXPIRED';

export type SourceRole = 'DETECTION' | 'CONFIRMATION' | 'BASELINE';

export type DecayType = 'NONE' | 'LINEAR' | 'EXPONENTIAL';

// ===== Source References =====

export interface SourceReference {
  source_name: string;
  source_type: SourceRole;
  article_id: string;
  timestamp: string;
  credibility_score: number;
  url?: string;
}

// ===== Escalation Signals =====

export interface EscalationSignal {
  signal_id: string;
  country: string;
  vector: VectorCode;
  signal_type: string;
  probability: number;              // 0.0 to 1.0
  severity_if_realized: number;     // Potential ΔCSI if confirmed
  expected_drift: number;           // probability × severity
  detected_date: string;
  sources: SourceReference[];
  persistence_status: PersistenceStatus;
  corroboration_count: number;
  last_seen_date: string;
  expiry_date?: string;
  audit_trail: AuditEntry[];
}

export interface CreateSignalInput {
  country: string;
  vector: VectorCode;
  signal_type: string;
  probability: number;
  severity_if_realized: number;
  sources: SourceReference[];
  description?: string;
}

// ===== Event Candidates =====

export interface ExtractedEntities {
  countries: string[];
  agencies: string[];
  companies: string[];
  sectors: string[];
  policyTerms: string[];
  confidence: number;
}

export interface StateTransition {
  timestamp: string;
  from_state: CandidateState;
  to_state: CandidateState;
  reason: string;
  triggered_by: 'SYSTEM' | 'USER';
  user?: string;
}

export interface EventCandidate {
  candidate_id: string;
  country: string;
  actor_country?: string;
  spillover_countries: string[];
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  
  // Lifecycle state
  state: CandidateState;
  
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
  confirmation_sources: SourceReference[];
  confirmed_date?: string;
  confirmed_by?: string;
  
  // Severity & impact
  estimated_severity: number;
  confirmed_severity?: number;
  delta_csi?: number;
  
  // Metadata
  description: string;
  reasoning: string;
  affected_sectors: string[];
  entities: ExtractedEntities;
  
  // Audit
  state_transitions: StateTransition[];
  audit_trail: AuditEntry[];
  
  // Rejection
  rejection_reason?: string;
  rejected_date?: string;
  rejected_by?: string;
}

export interface CreateCandidateInput {
  country: string;
  event_type: EventType;
  primary_vector: VectorCode;
  description: string;
  sources: SourceReference[];
  entities: ExtractedEntities;
  estimated_severity: number;
  affected_sectors: string[];
}

// ===== Event Deltas =====

export interface DecaySchedule {
  type: DecayType;
  decay_rate?: number;        // For LINEAR
  half_life_days?: number;    // For EXPONENTIAL
}

export interface DecayRecord {
  timestamp: string;
  delta_before: number;
  delta_after: number;
  decay_factor: number;
  days_since_effective: number;
}

export interface EventDelta {
  event_id: string;
  candidate_id: string;
  country: string;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  
  // Timing
  detected_date: string;
  confirmed_date: string;
  effective_date: string;
  
  // CSI impact
  base_delta_csi: number;
  netted_drift: number;
  net_delta_csi: number;
  current_delta_csi: number;
  
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

// ===== Source Metadata =====

export interface AuthorityScope {
  jurisdiction: string[];
  event_types: EventType[];
  vectors: VectorCode[];
}

export interface CredibilityFactors {
  timeliness: number;
  accuracy_history: number;
  editorial_standards: number;
}

export interface SourceMetadata {
  source_id: string;
  source_name: string;
  source_type: 'RSS' | 'API' | 'SCRAPER' | 'MANUAL';
  functional_role: SourceRole;
  applicable_vectors: VectorCode[] | 'ALL';
  applicable_countries: string[] | 'ALL';
  is_authoritative: boolean;
  authority_scope?: AuthorityScope;
  base_credibility_score: number;
  credibility_factors: CredibilityFactors;
  url?: string;
  update_frequency: string;
  last_successful_fetch?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  added_date: string;
  notes?: string;
}

// ===== Gating Results =====

export interface CorroborationResult {
  is_corroborated: boolean;
  source_count: number;
  independent_source_count: number;
  corroboration_strength: number;
  missing_requirements?: string[];
}

export interface PersistenceResult {
  is_persistent: boolean;
  hours_since_detection: number;
  required_hours: number;
  source_stability: 'STABLE' | 'GROWING' | 'FADING';
  last_mention_date: string;
  persistence_score: number;
}

export interface GatingResult {
  passed: boolean;
  gates_passed: string[];
  gates_failed: string[];
  error_messages: string[];
  recommendations: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// ===== CSI Calculation =====

export interface CSIResult {
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

export interface CSIAttribution {
  country: string;
  as_of_date: string;
  composite_csi: number;
  
  baseline: {
    value: number;
    source: string;
    last_updated: string;
  };
  
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

export interface CSITimeSeries {
  country: string;
  start_date: string;
  end_date: string;
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  data_points: Array<{
    date: string;
    baseline: number;
    drift: number;
    delta: number;
    composite: number;
    note?: string;
  }>;
}

// ===== Baseline =====

export interface VectorContribution {
  vector_code: VectorCode;
  contribution: number;
  weight: number;
}

export interface DriftRecord {
  timestamp: string;
  previous_value: number;
  new_value: number;
  delta: number;
  reason: string;
  updated_by: string;
}

export interface BaselineCSI {
  country: string;
  baseline_value: number;
  vector_contributions: VectorContribution[];
  last_updated: string;
  drift_history: DriftRecord[];
  validation_status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID';
}

// ===== Audit =====

export interface AuditEntry {
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

// ===== Replay =====

export interface ReplayLogEntry {
  timestamp: string;
  action: 'SIGNAL_ADDED' | 'SIGNAL_EXPIRED' | 'EVENT_CONFIRMED' | 'DECAY_APPLIED' | 'BASELINE_SET';
  description: string;
  csi_before: number;
  csi_after: number;
  delta: number;
}

export interface ReplayResult {
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

// ===== Vector Routing =====

export interface VectorRoutingRule {
  vector: VectorCode;
  priority: number;
  keywords: string[];
  event_types: EventType[];
  agencies: string[];
  policy_terms: string[];
  exclusions: string[];
}

// ===== Accuracy Tracking =====

export interface AccuracyEvent {
  source_id: string;
  prediction_date: string;
  outcome_date: string;
  was_accurate: boolean;
  event_type: EventType;
}