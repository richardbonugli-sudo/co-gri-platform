/**
 * CSI Type Definitions - PHASE 1-3
 * 
 * This module defines the core types for the Country Shock Index (CSI) system,
 * implementing the baseline vs event separation architecture with propagation support.
 */

/**
 * Event lifecycle states
 */
export type EventState = 
  | 'DETECTED'      // Initial detection, not yet verified
  | 'PROVISIONAL'   // Under review, preliminary assessment
  | 'CONFIRMED'     // Verified and active
  | 'RESOLVED';     // Event concluded, no longer active

/**
 * Event types for categorization
 */
export type EventType = 
  | 'SANCTION'
  | 'EXPORT_CONTROL'
  | 'TARIFF'
  | 'KINETIC'
  | 'CAPITAL_CONTROL'
  | 'COUP'
  | 'CYBER_ATTACK'
  | 'TRADE_RESTRICTION'
  | 'REGULATORY_CHANGE'
  | 'POLITICAL_INSTABILITY';

/**
 * Shock vector codes aligned with COGRI methodology
 */
export type VectorCode = 
  | 'SC1'  // Kinetic Conflict
  | 'SC2'  // Sanctions
  | 'SC3'  // Trade/Export Controls
  | 'SC4'  // Governance/Regulatory
  | 'SC5'  // Capital Controls
  | 'SC6'  // Political Instability/Coup
  | 'SC7'; // Cyber/Tech Restrictions

/**
 * Event decay configuration
 */
export interface DecaySchedule {
  type: 'NONE' | 'LINEAR' | 'EXPONENTIAL';
  half_life_days?: number;  // For exponential decay
  decay_rate?: number;      // For linear decay (per day)
  end_date?: string;        // When decay completes
}

/**
 * Audit trail entry for event changes
 */
export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  previous_state?: EventState;
  new_state?: EventState;
}

/**
 * Discrete time-stamped geopolitical shock event
 */
export interface EventRecord {
  event_id: string;
  country: string;
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors?: VectorCode[];
  state: EventState;
  severity: number;  // 1-10 scale
  delta_csi: number; // ΔCSI contribution
  
  // Temporal data
  detected_date: string;      // ISO 8601
  effective_date?: string;    // When event takes effect
  confirmed_date?: string;    // When confirmed
  resolved_date?: string;     // When resolved
  
  // Documentation
  description: string;
  sources: string[];          // URLs or references
  rationale: string;          // Why this ΔCSI value
  affected_sectors?: string[]; // Sectors affected by this event
  
  // Decay configuration
  decay_schedule: DecaySchedule;
  
  // Propagation (PHASE 3)
  propagation_eligible: boolean;
  propagated_events?: string[];   // IDs of events created by propagation
  origin_event_id?: string;       // If this is a propagated event
  propagation_hop?: number;       // Hop count if propagated
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  audit_trail: AuditEntry[];
}

/**
 * Vector contribution to baseline CSI
 */
export interface VectorContribution {
  vector_code: VectorCode;
  contribution: number;
  weight: number;
}

/**
 * Historical baseline drift record
 */
export interface DriftRecord {
  timestamp: string;
  previous_value: number;
  new_value: number;
  delta: number;
  reason: string;
  updated_by: string;
}

/**
 * Baseline CSI - slow-moving structural risk
 */
export interface BaselineCSI {
  country: string;
  baseline_value: number;
  vector_contributions: VectorContribution[];
  last_updated: string;
  drift_history: DriftRecord[];
  validation_status: 'VALID' | 'NEEDS_REVIEW' | 'OUTDATED';
}

/**
 * Composite CSI - baseline + active events
 */
export interface CompositeCSI {
  country: string;
  baseline_csi: number;
  event_csi: number;        // Sum of all active event ΔCSI
  composite_csi: number;    // baseline + event
  active_events: EventRecord[];
  as_of_date: string;
  calculation_metadata: {
    num_active_events: number;
    event_ids: string[];
    decay_applied: boolean;
  };
}

/**
 * Rate limit validation result
 */
export interface RateLimitValidation {
  valid: boolean;
  current_drift: number;
  proposed_drift: number;
  rolling_window_drift: number;
  max_allowed: number;
  error_message?: string;
}

/**
 * Event creation input
 */
export interface CreateEventInput {
  country: string;
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors?: VectorCode[];
  severity: number;
  delta_csi: number;
  detected_date: string;
  effective_date?: string;
  description: string;
  sources: string[];
  rationale: string;
  affected_sectors?: string[];
  decay_schedule?: DecaySchedule;
  propagation_eligible?: boolean;
  created_by: string;
}

/**
 * Event update input
 */
export interface UpdateEventInput {
  event_id: string;
  severity?: number;
  delta_csi?: number;
  description?: string;
  sources?: string[];
  rationale?: string;
  decay_schedule?: DecaySchedule;
  updated_by: string;
}

/**
 * State transition input
 */
export interface StateTransitionInput {
  event_id: string;
  new_state: EventState;
  user: string;
  reason: string;
}