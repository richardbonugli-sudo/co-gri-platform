/**
 * CSI Implementation Verification - Core Type Definitions
 * Phase 1: Golden Test Harness for Deterministic Replay
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * The seven CSI Risk Vectors (Factors)
 * These are the ONLY primitives used throughout the system
 */
export enum CSIRiskVector {
  CONFLICT_SECURITY = 'v1',           // Conflict & Security
  SANCTIONS_REGULATORY = 'v2',        // Sanctions & Regulatory Pressure
  TRADE_LOGISTICS = 'v3',             // Trade & Logistics Disruption
  GOVERNANCE_RULE_OF_LAW = 'v4',      // Governance & Rule of Law
  CYBER_DATA = 'v5',                  // Cyber & Data Sovereignty
  PUBLIC_UNREST = 'v6',               // Public Unrest & Civil Stability
  CURRENCY_CAPITAL = 'v7'             // Currency & Capital Controls
}

/**
 * Human-readable names for risk vectors
 */
export const CSIRiskVectorNames: Record<CSIRiskVector, string> = {
  [CSIRiskVector.CONFLICT_SECURITY]: 'Conflict & Security',
  [CSIRiskVector.SANCTIONS_REGULATORY]: 'Sanctions & Regulatory Pressure',
  [CSIRiskVector.TRADE_LOGISTICS]: 'Trade & Logistics Disruption',
  [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 'Governance & Rule of Law',
  [CSIRiskVector.CYBER_DATA]: 'Cyber & Data Sovereignty',
  [CSIRiskVector.PUBLIC_UNREST]: 'Public Unrest & Civil Stability',
  [CSIRiskVector.CURRENCY_CAPITAL]: 'Currency & Capital Controls'
};

/**
 * Default weights for each risk vector
 */
export const CSIRiskVectorWeights: Record<CSIRiskVector, number> = {
  [CSIRiskVector.CONFLICT_SECURITY]: 0.20,
  [CSIRiskVector.SANCTIONS_REGULATORY]: 0.18,
  [CSIRiskVector.TRADE_LOGISTICS]: 0.15,
  [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 0.17,
  [CSIRiskVector.CYBER_DATA]: 0.10,
  [CSIRiskVector.PUBLIC_UNREST]: 0.12,
  [CSIRiskVector.CURRENCY_CAPITAL]: 0.08
};

/**
 * Source roles - strictly enforced
 */
export enum SourceRole {
  BASELINE = 'baseline',           // Structural priors only
  DETECTION = 'detection',         // Escalation detection - generates signals
  CONFIRMATION = 'confirmation'    // State transition - confirms events
}

/**
 * Signal lifecycle states
 */
export enum SignalLifecycleState {
  DETECTED = 'detected',
  ACTIVE = 'active',
  CONFIRMED = 'confirmed',
  DECAYING = 'decaying',
  EXPIRED = 'expired'
}

/**
 * Event lifecycle states
 */
export enum EventLifecycleState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DECAYING = 'decaying',
  EXPIRED = 'expired'
}

/**
 * Netting strategies
 */
export enum NettingStrategy {
  MAX = 'MAX',
  AVERAGE = 'AVERAGE',
  WEIGHTED = 'WEIGHTED',
  DIMINISHING = 'DIMINISHING'
}

// ============================================================================
// TEST COUNTRIES
// ============================================================================

/**
 * Phase 1 test countries
 */
export const TEST_COUNTRIES = [
  { id: 'CAN', name: 'Canada', isSubEntity: false },
  { id: 'USA', name: 'United States', isSubEntity: false },
  { id: 'VEN', name: 'Venezuela', isSubEntity: false },
  { id: 'CHN', name: 'China', isSubEntity: false },
  { id: 'IRN', name: 'Iran', isSubEntity: false },
  { id: 'DNK', name: 'Denmark', isSubEntity: false },
  { id: 'GRL', name: 'Greenland', isSubEntity: true, parentEntity: 'DNK' },
  { id: 'RUS', name: 'Russia', isSubEntity: false },
  { id: 'TWN', name: 'Taiwan', isSubEntity: false },
  { id: 'CHE', name: 'Switzerland', isSubEntity: false } // Quiet negative control
] as const;

export type TestCountryId = typeof TEST_COUNTRIES[number]['id'];

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Source registry entry
 */
export interface Source {
  source_id: string;
  name: string;
  role: SourceRole;
  reliability_score: number;  // 0-1
  authority_level: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Raw signal from detection sources
 */
export interface SignalRaw {
  signal_id: string;
  source_id: string;
  country_id: string;
  detected_at: Date;
  raw_content: string;
  raw_metadata: Record<string, unknown>;
  ingested_at: Date;
}

/**
 * Processed signal with vector assignment
 */
export interface SignalProcessed {
  signal_id: string;
  source_id: string;
  source_role: SourceRole;
  country_id: string;
  vector_id: CSIRiskVector;  // Exactly one vector
  signal_type: string;
  severity: number;          // 0-1
  base_probability: number;  // 0-1, expectation-based
  adjusted_probability: number;
  corroboration_count: number;
  corroboration_sources: string[];
  drift_contribution: number;
  lifecycle_state: SignalLifecycleState;
  detected_at: Date;
  last_updated: Date;
  persistence_window_hours: number;
  decay_start_date?: Date;
  decay_rate: number;
  current_value: number;
  metadata: Record<string, unknown>;
}

/**
 * Confirmed event
 */
export interface EventConfirmed {
  event_id: string;
  country_id: string;
  vector_id: CSIRiskVector;
  event_type: string;
  confirmation_sources: string[];
  confirmation_date: Date;
  base_impact: number;       // 0-20 CSI points
  delta_applied: number;
  prior_drift_netted: number;
  netting_action: string;
  decay_schedule: DecaySchedule;
  lifecycle_state: EventLifecycleState;
  effective_date: Date;
  expiry_date?: Date;
  is_permanent: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Decay schedule for signals and events
 */
export interface DecaySchedule {
  initial_value: number;
  current_value: number;
  decay_start_date: Date;
  inactivity_window_days: number;
  decay_rate: number;
  half_life_days: number;
  expiration_threshold: number;
  status: 'ACTIVE' | 'DECAYING' | 'EXPIRED';
}

/**
 * Structural baseline snapshot
 */
export interface BaselineSnapshot {
  snapshot_id: string;
  country_id: string;
  snapshot_date: Date;
  baseline_total: number;
  by_vector: Record<CSIRiskVector, number>;
  source_data: Record<string, unknown>;
  is_scheduled_update: boolean;
  created_at: Date;
}

// ============================================================================
// CSI TRACE STRUCTURES (Full Auditability)
// ============================================================================

/**
 * Vector-level breakdown in CSI trace
 */
export interface CSIVectorTrace {
  vector_id: CSIRiskVector;
  vector_name: string;
  baseline_v: number;
  drift_v: number;
  event_delta_v: number;
  total_v: number;
  caps_applied_v: {
    drift_cap_applied: boolean;
    drift_cap_amount: number;
    cumulative_cap_applied: boolean;
    cumulative_cap_amount: number;
  };
  active_signals: SignalTrace[];
  active_events: EventTrace[];
}

/**
 * Signal-level trace
 */
export interface SignalTrace {
  signal_id: string;
  vector_id: CSIRiskVector;
  source_id: string;
  source_role: SourceRole;
  severity: number;
  base_probability: number;
  adjusted_probability: number;
  drift_contribution: number;
  lifecycle_state: SignalLifecycleState;
  persistence_window_hours: number;
  decay_status: string;
  detected_at: Date;
  last_updated: Date;
}

/**
 * Event-level trace
 */
export interface EventTrace {
  event_id: string;
  vector_id: CSIRiskVector;
  event_type: string;
  confirmation_sources: string[];
  delta_applied: number;
  netting_action: string;
  decay_schedule: DecaySchedule;
  confirmed_at: Date;
}

/**
 * Complete CSI trace object for a (country, timestamp) pair
 */
export interface CSITrace {
  trace_id: string;
  country_id: string;
  country_name: string;
  timestamp: Date;
  
  // Top-level scores
  csi_total: number;
  
  // Component separation
  baseline_total: number;
  escalation_drift_total: number;
  event_delta_total: number;
  
  // By risk factor (7 vectors)
  by_vector: Record<CSIRiskVector, CSIVectorTrace>;
  
  // Metadata
  confidence_score: number;
  active_signals_count: number;
  confirmed_events_count: number;
  
  // Audit info
  replay_run_id?: string;
  computation_time_ms: number;
  created_at: Date;
}

// ============================================================================
// REPLAY CONFIGURATION
// ============================================================================

/**
 * Replay run configuration for deterministic execution
 */
export interface ReplayConfig {
  run_id: string;
  name: string;
  description?: string;
  
  // Time window
  start_date: Date;        // T0
  end_date: Date;          // T1
  sampling_interval_hours: number;  // 4 hours default
  
  // Countries to process
  country_ids: string[];
  
  // Baseline anchoring
  baseline_anchor_date: Date;  // Most recent snapshot prior to T0
  baseline_is_fixed: boolean;  // Should be true for Phase 1
  
  // Execution settings
  use_snapshot_data: boolean;  // True for replay mode
  snapshot_version?: string;
  
  // Status
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * QA Scenario definition
 */
export interface QAScenario {
  scenario_id: string;
  name: string;
  description: string;
  countries_affected: string[];
  expected_vectors: CSIRiskVector[];
  expected_behavior: {
    should_show_drift_before_confirmation: boolean;
    expected_drift_vectors: CSIRiskVector[];
    expected_event_vectors: CSIRiskVector[];
    unaffected_vectors: CSIRiskVector[];
  };
  validation_criteria: string[];
  time_window?: {
    start: Date;
    end: Date;
  };
}

/**
 * Phase 1 QA Scenarios
 */
export const QA_SCENARIOS: QAScenario[] = [
  {
    scenario_id: 'scenario_a',
    name: 'U.S./Canada coercive trade & infrastructure threats',
    description: 'Trade tensions and infrastructure threats between US and Canada',
    countries_affected: ['USA', 'CAN'],
    expected_vectors: [CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.TRADE_LOGISTICS, CSIRiskVector.SANCTIONS_REGULATORY],
      expected_event_vectors: [CSIRiskVector.TRADE_LOGISTICS],
      unaffected_vectors: [CSIRiskVector.CYBER_DATA, CSIRiskVector.CURRENCY_CAPITAL]
    },
    validation_criteria: [
      'Immediate drift in Trade & Logistics (v3)',
      'Potential drift in Sanctions/Regulatory (v2)',
      'Event delta only if confirmed',
      'No macro contamination'
    ]
  },
  {
    scenario_id: 'scenario_b',
    name: 'Iran-related tariff or secondary sanctions rhetoric',
    description: 'Sanctions and tariff rhetoric related to Iran',
    countries_affected: ['IRN'],
    expected_vectors: [CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
      expected_event_vectors: [CSIRiskVector.SANCTIONS_REGULATORY],
      unaffected_vectors: [CSIRiskVector.CYBER_DATA, CSIRiskVector.PUBLIC_UNREST]
    },
    validation_criteria: [
      'Drift first in v2/v3',
      'Confirmation only on formal action',
      'No macro contamination'
    ]
  },
  {
    scenario_id: 'scenario_c',
    name: 'Denmark/Greenland sovereignty pressure',
    description: 'Sovereignty and governance pressure on Denmark/Greenland',
    countries_affected: ['DNK', 'GRL'],
    expected_vectors: [CSIRiskVector.GOVERNANCE_RULE_OF_LAW, CSIRiskVector.CONFLICT_SECURITY],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.GOVERNANCE_RULE_OF_LAW, CSIRiskVector.CONFLICT_SECURITY],
      expected_event_vectors: [CSIRiskVector.GOVERNANCE_RULE_OF_LAW],
      unaffected_vectors: [CSIRiskVector.CURRENCY_CAPITAL, CSIRiskVector.CYBER_DATA]
    },
    validation_criteria: [
      'Drift routed to Governance & Rule of Law (v4)',
      'Potential drift in Conflict & Security (v1)',
      'Movement on signals, not only formal acts'
    ]
  },
  {
    scenario_id: 'scenario_d',
    name: 'Venezuela escalation dynamics',
    description: 'Political and security escalation in Venezuela',
    countries_affected: ['VEN'],
    expected_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.GOVERNANCE_RULE_OF_LAW],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.GOVERNANCE_RULE_OF_LAW],
      expected_event_vectors: [CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.GOVERNANCE_RULE_OF_LAW],
      unaffected_vectors: [CSIRiskVector.CYBER_DATA]
    },
    validation_criteria: [
      'High sensitivity in v1 (Security)',
      'High sensitivity in v2 (Sanctions)',
      'High sensitivity in v4 (Governance)',
      'Confirmation nets prior drift'
    ]
  },
  {
    scenario_id: 'scenario_e',
    name: 'Russia ongoing sanctions & security actions',
    description: 'Persistent sanctions and security actions against Russia',
    countries_affected: ['RUS'],
    expected_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
      expected_event_vectors: [CSIRiskVector.SANCTIONS_REGULATORY, CSIRiskVector.TRADE_LOGISTICS],
      unaffected_vectors: [CSIRiskVector.CYBER_DATA]
    },
    validation_criteria: [
      'Persistent drift and confirmations in v1/v2/v3',
      'Baseline remains structurally anchored'
    ]
  },
  {
    scenario_id: 'scenario_f',
    name: 'China silver export restrictions',
    description: 'China silver export restrictions effective Jan 1, 2026',
    countries_affected: ['CHN'],
    expected_vectors: [CSIRiskVector.TRADE_LOGISTICS, CSIRiskVector.SANCTIONS_REGULATORY],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.TRADE_LOGISTICS, CSIRiskVector.SANCTIONS_REGULATORY],
      expected_event_vectors: [CSIRiskVector.TRADE_LOGISTICS],
      unaffected_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.PUBLIC_UNREST]
    },
    validation_criteria: [
      'Early escalation drift in Trade & Logistics (v3)',
      'Sanctions/Regulatory (v2) drift if framed as strategic export control',
      'Event delta only upon formal enforcement confirmation',
      'Spillover countries should not be affected'
    ]
  },
  {
    scenario_id: 'scenario_g',
    name: 'China-Taiwan tensions & PRC sanctions on US firms',
    description: 'Rising China-Taiwan tensions and PRC sanctions on ~20 US defense firms',
    countries_affected: ['CHN', 'TWN'],
    expected_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY],
    expected_behavior: {
      should_show_drift_before_confirmation: true,
      expected_drift_vectors: [CSIRiskVector.CONFLICT_SECURITY, CSIRiskVector.SANCTIONS_REGULATORY],
      expected_event_vectors: [CSIRiskVector.SANCTIONS_REGULATORY],
      unaffected_vectors: [CSIRiskVector.CURRENCY_CAPITAL, CSIRiskVector.PUBLIC_UNREST]
    },
    validation_criteria: [
      'Conflict & Security (v1) drift for China and Taiwan',
      'Sanctions/Regulatory (v2) drift for China and affected US entities',
      'CSI moves on credible signaling before sanctions lists finalized',
      'Confirmation nets prior drift within same vectors only'
    ]
  }
];

// ============================================================================
// ACCEPTANCE TEST TYPES
// ============================================================================

/**
 * Acceptance test result
 */
export interface AcceptanceTestResult {
  test_id: string;
  test_name: string;
  test_category: string;
  passed: boolean;
  error_message?: string;
  trace_excerpt?: Partial<CSITrace>;
  assertions: {
    assertion: string;
    passed: boolean;
    actual_value?: unknown;
    expected_value?: unknown;
  }[];
  executed_at: Date;
}

/**
 * Phase 1 acceptance test categories
 */
export enum AcceptanceTestCategory {
  BASELINE_ISOLATION = 'baseline_isolation',
  EXPECTATION_WEIGHTED = 'expectation_weighted',
  FACTOR_SCOPING = 'factor_scoping',
  SOURCE_ROLE_ENFORCEMENT = 'source_role_enforcement',
  CONFIDENCE_HANDLING = 'confidence_handling'
}

// ============================================================================
// QUARANTINE TYPES
// ============================================================================

/**
 * Quarantined signal for manual review
 */
export interface QuarantinedSignal {
  quarantine_id: string;
  signal_id: string;
  reason: string;
  raw_data: Record<string, unknown>;
  suggested_vectors: CSIRiskVector[];
  review_status: 'pending' | 'reviewed' | 'resolved';
  reviewer_notes?: string;
  resolved_vector?: CSIRiskVector;
  created_at: Date;
  reviewed_at?: Date;
}