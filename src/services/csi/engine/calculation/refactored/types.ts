/**
 * Type Definitions for Refactored CSI Engine
 * Updated to align with CSI Methodology (Appendix B)
 * 
 * Key Changes:
 * - Replaced generic RiskVector with 7 CSI geopolitical risk factors
 * - Added factor-scoped structures
 * - Enhanced audit trail support
 * - Added source role enforcement
 */

/**
 * Seven CSI Geopolitical Risk Factors (Appendix B)
 * These are the ONLY primitives used throughout the CSI system
 */
export enum CSIRiskFactor {
  CONFLICT_SECURITY = 'CONFLICT_SECURITY',
  SANCTIONS_REGULATORY = 'SANCTIONS_REGULATORY',
  TRADE_LOGISTICS = 'TRADE_LOGISTICS',
  GOVERNANCE_RULE_OF_LAW = 'GOVERNANCE_RULE_OF_LAW',
  CYBER_DATA_SOVEREIGNTY = 'CYBER_DATA_SOVEREIGNTY',
  PUBLIC_UNREST_CIVIL = 'PUBLIC_UNREST_CIVIL',
  CURRENCY_CAPITAL_CONTROLS = 'CURRENCY_CAPITAL_CONTROLS'
}

/**
 * Source role types (Appendix B)
 * Enforces separation of concerns
 */
export enum SourceRole {
  BASELINE = 'BASELINE',           // Provides structural baseline data only
  DETECTION = 'DETECTION',         // Generates escalation signals
  CONFIRMATION = 'CONFIRMATION'    // Validates/confirms events
}

/**
 * Source metadata with role enforcement
 */
export interface SourceMetadata {
  source_id: string;
  source_name: string;
  role: SourceRole;
  reliability_score: number;      // 0-1
  authority_level: 'HIGH' | 'MEDIUM' | 'LOW';
  applicable_factors: CSIRiskFactor[];
}

/**
 * Signal with mandatory CSI risk factor
 * Every signal MUST be assigned to exactly one CSI risk factor
 */
export interface Signal {
  signal_id: string;
  country: string;
  risk_factor: CSIRiskFactor;      // MANDATORY: exactly one factor
  signal_type: string;
  severity: number;                 // 0-1.0
  probability: number;              // 0-1.0, expectation-based
  detected_date: Date;
  last_updated: Date;
  persistence_hours: number;
  sources: SourceMetadata[];        // Must be DETECTION role only
  corroboration_count: number;
  max_drift_cap: number;           // Per-signal drift cap
  confidence_metadata?: ConfidenceMetadata;  // Metadata only, never affects CSI
}

/**
 * Confidence metadata (epistemic only, never affects calculations)
 */
export interface ConfidenceMetadata {
  source_reliability: number;
  authority_level_score: number;
  corroboration_quality: number;
  overall_confidence: number;      // 0-1, for UI/audit only
  flags: string[];                 // UI flags for interpretation
}

/**
 * Confirmed Event with factor inheritance
 */
export interface ConfirmedEvent {
  event_id: string;
  country: string;
  risk_factor: CSIRiskFactor;      // Inherited from confirming signal
  event_type: string;
  state: 'CONFIRMED' | 'RESOLVED';
  base_impact: number;              // 0-20 CSI points
  confirmed_date: Date;
  effective_date: Date;
  confirmation_sources: SourceMetadata[];  // Must be CONFIRMATION role only
  decay_schedule?: {
    type: 'NONE' | 'LINEAR' | 'EXPONENTIAL';
    decay_rate?: number;
    half_life_days?: number;
  };
  prior_drift_netted: number;       // Amount netted from same factor only
  related_signal_ids: string[];     // Signals that led to this event
}

/**
 * Per-factor baseline structure
 */
export interface FactorBaseline {
  factor: CSIRiskFactor;
  value: number;                    // 0-100
  sources: SourceMetadata[];        // Must be BASELINE role only
  last_updated: Date;
  calculation_method: string;
  is_stale: boolean;
}

/**
 * Per-factor drift contribution
 */
export interface FactorDriftContribution {
  factor: CSIRiskFactor;
  signal_id: string;
  base_severity: number;
  probability: number;
  persistence_factor: number;
  recency_factor: number;
  decay_factor: number;
  contribution: number;
  capped_contribution: number;
}

/**
 * Per-factor event delta
 */
export interface FactorEventDelta {
  factor: CSIRiskFactor;
  event_id: string;
  base_impact: number;
  prior_drift_netted: number;       // Only from same factor
  current_impact: number;           // After decay
  decay_applied: number;
}

/**
 * CSI Components with factor breakdown
 */
export interface CSIComponents {
  structural_baseline: number;
  structural_baseline_by_factor: Map<CSIRiskFactor, number>;
  escalation_drift: number;
  escalation_drift_by_factor: Map<CSIRiskFactor, number>;
  escalation_drift_netted: number;
  event_delta: number;
  event_delta_by_factor: Map<CSIRiskFactor, number>;
  total: number;
  total_with_netting: number;
  metadata: {
    active_signals: number;
    active_signals_by_factor: Map<CSIRiskFactor, number>;
    confirmed_events: number;
    confirmed_events_by_factor: Map<CSIRiskFactor, number>;
    confidence_score: number;       // Metadata only
    last_updated: Date;
    decay_stats?: any;
    netting_stats?: any;
  };
}

/**
 * CSI Attribution with full factor breakdown
 */
export interface CSIAttribution {
  country: string;
  as_of_date: Date;
  composite_csi: number;
  
  baseline: {
    total: number;
    by_factor: Array<{
      factor: CSIRiskFactor;
      value: number;
      sources: string[];
      last_updated: Date;
    }>;
  };
  
  drift: {
    total: number;
    by_factor: Array<{
      factor: CSIRiskFactor;
      contribution: number;
      signals: Array<{
        signal_id: string;
        contribution: number;
        probability: number;
      }>;
    }>;
  };
  
  events: {
    total: number;
    by_factor: Array<{
      factor: CSIRiskFactor;
      impact: number;
      deltas: Array<{
        event_id: string;
        impact: number;
        prior_drift_netted: number;
      }>;
    }>;
  };
  
  audit_trail: AuditTrail;
}

/**
 * Comprehensive audit trail
 */
export interface AuditTrail {
  calculation_timestamp: Date;
  components_breakdown: {
    baseline_contribution: number;
    drift_contribution: number;
    event_contribution: number;
  };
  factor_contributions: Array<{
    factor: CSIRiskFactor;
    baseline: number;
    drift: number;
    events: number;
    total: number;
  }>;
  active_signals_detail: Array<{
    signal_id: string;
    factor: CSIRiskFactor;
    contribution: number;
    probability: number;
    decay_status: string;
  }>;
  active_events_detail: Array<{
    event_id: string;
    factor: CSIRiskFactor;
    base_impact: number;
    netted_impact: number;
    current_impact: number;
  }>;
  netting_applied: boolean;
  netting_reduction: number;
  validation_checks: ValidationResult[];
}

/**
 * Validation result for acceptance criteria
 */
export interface ValidationResult {
  check_name: string;
  passed: boolean;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

/**
 * Drift contribution (legacy compatibility, will be deprecated)
 */
export interface DriftContribution {
  signal_id: string;
  base_severity: number;
  probability: number;
  persistence_factor: number;
  recency_factor: number;
  contribution: number;
}

/**
 * Backward compatibility export
 * @deprecated Use CSIRiskFactor instead
 */
export enum RiskVector {
  POLITICAL = 'POLITICAL',
  ECONOMIC = 'ECONOMIC',
  SECURITY = 'SECURITY',
  SOCIAL = 'SOCIAL',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  TECHNOLOGICAL = 'TECHNOLOGICAL'
}

/**
 * Mapping from legacy RiskVector to CSIRiskFactor
 * For migration purposes only
 */
export const RISK_VECTOR_TO_CSI_FACTOR: Record<RiskVector, CSIRiskFactor> = {
  [RiskVector.POLITICAL]: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,
  [RiskVector.ECONOMIC]: CSIRiskFactor.TRADE_LOGISTICS,
  [RiskVector.SECURITY]: CSIRiskFactor.CONFLICT_SECURITY,
  [RiskVector.SOCIAL]: CSIRiskFactor.PUBLIC_UNREST_CIVIL,
  [RiskVector.ENVIRONMENTAL]: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,  // Map to governance as fallback
  [RiskVector.TECHNOLOGICAL]: CSIRiskFactor.CYBER_DATA_SOVEREIGNTY
};

/**
 * Helper function to validate signal has exactly one risk factor
 */
export function validateSignalRiskFactor(signal: Signal): ValidationResult {
  if (!signal.risk_factor) {
    return {
      check_name: 'signal_risk_factor_required',
      passed: false,
      message: `Signal ${signal.signal_id} missing required risk_factor`,
      severity: 'ERROR'
    };
  }
  
  if (!Object.values(CSIRiskFactor).includes(signal.risk_factor)) {
    return {
      check_name: 'signal_risk_factor_valid',
      passed: false,
      message: `Signal ${signal.signal_id} has invalid risk_factor: ${signal.risk_factor}`,
      severity: 'ERROR'
    };
  }
  
  return {
    check_name: 'signal_risk_factor_valid',
    passed: true,
    message: `Signal ${signal.signal_id} has valid risk_factor: ${signal.risk_factor}`,
    severity: 'INFO'
  };
}

/**
 * Helper function to validate source role
 */
export function validateSourceRole(
  source: SourceMetadata,
  expectedRole: SourceRole,
  context: string
): ValidationResult {
  if (source.role !== expectedRole) {
    return {
      check_name: 'source_role_enforcement',
      passed: false,
      message: `Source ${source.source_name} has role ${source.role} but ${expectedRole} expected in ${context}`,
      severity: 'ERROR'
    };
  }
  
  return {
    check_name: 'source_role_enforcement',
    passed: true,
    message: `Source ${source.source_name} has correct role ${expectedRole} in ${context}`,
    severity: 'INFO'
  };
}

/**
 * Helper function to validate no cross-factor operations
 */
export function validateSameFactor(
  factor1: CSIRiskFactor,
  factor2: CSIRiskFactor,
  operation: string
): ValidationResult {
  if (factor1 !== factor2) {
    return {
      check_name: 'no_cross_factor_operation',
      passed: false,
      message: `Cross-factor ${operation} detected: ${factor1} and ${factor2}`,
      severity: 'ERROR'
    };
  }
  
  return {
    check_name: 'no_cross_factor_operation',
    passed: true,
    message: `${operation} correctly scoped to single factor: ${factor1}`,
    severity: 'INFO'
  };
}