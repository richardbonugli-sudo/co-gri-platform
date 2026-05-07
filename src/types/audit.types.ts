/**
 * CSI Audit Systems Type Definitions
 * 
 * This module defines types for:
 * 1. Vector Movement Forensic Audit
 * 2. Ground-Truth Recall Audit
 * 
 * Version: 1.0
 * Date: 2026-02-24
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * CSI Risk Vector Enumeration
 */
export enum CSIRiskVector {
  CONFLICT_SECURITY = 'conflict_security',
  SANCTIONS_REGULATORY = 'sanctions_regulatory',
  TRADE_LOGISTICS = 'trade_logistics',
  GOVERNANCE_RULE_OF_LAW = 'governance_rule_of_law',
  CYBER_DATA = 'cyber_data',
  CIVIL_UNREST = 'civil_unrest',
  CURRENCY_CAPITAL_CONTROLS = 'currency_capital_controls'
}

export const CSIRiskVectorNames: Record<CSIRiskVector, string> = {
  [CSIRiskVector.CONFLICT_SECURITY]: 'Conflict & Security',
  [CSIRiskVector.SANCTIONS_REGULATORY]: 'Sanctions & Regulatory Pressure',
  [CSIRiskVector.TRADE_LOGISTICS]: 'Trade & Logistics',
  [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 'Governance & Rule of Law',
  [CSIRiskVector.CYBER_DATA]: 'Cyber & Data',
  [CSIRiskVector.CIVIL_UNREST]: 'Civil Unrest & Domestic Stability',
  [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: 'Currency & Capital Controls'
};

/**
 * Time window for audit execution
 */
export interface TimeWindow {
  type: 'last_90_days' | 'last_12_months' | 'last_24_months' | 'custom';
  start_date?: Date;
  end_date?: Date;
}

/**
 * Audit progress tracking
 */
export interface AuditProgress {
  current_section: number;
  total_sections: number;
  section_name: string;
  percentage_complete: number;
  estimated_time_remaining_seconds: number;
}

/**
 * Audit summary
 */
export interface AuditSummary {
  sections_meeting_criteria: number;
  total_sections: number;
  overall_assessment: 'structural_integrity_confirmed' | 'partial_functionality' | 'fundamental_issues';
  key_findings: string[];
  critical_issues: string[];
}

/**
 * Recommendation
 */
export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  affected_vectors: CSIRiskVector[];
  remediation_steps: string[];
}

/**
 * Export result
 */
export interface ExportResult {
  format: 'json' | 'csv' | 'pdf';
  data?: string;
  file_path?: string;
  success: boolean;
  error?: string;
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affected_vectors?: CSIRiskVector[];
  data?: any;
}

// ============================================================================
// VECTOR MOVEMENT FORENSIC AUDIT TYPES
// ============================================================================

/**
 * Section result base interface
 */
export interface SectionResult {
  section_id: number;
  section_name: string;
  success_criteria_met: boolean;
  anomalies: Anomaly[];
  generated_at: Date;
}

/**
 * Section 1: Absolute Movement Ledger
 */
export interface VectorTotals {
  vector: CSIRiskVector;
  total_drift_points: number;
  total_event_points: number;
  total_movement_points: number;
  total_confirmed_items: number;
  total_detected_items: number;
  items_suppressed: number;
  items_discarded_pre_scoring: number;
}

export interface Section1Result extends SectionResult {
  data: VectorTotals[];
}

/**
 * Section 2: Movement Denominator Reconciliation
 */
export interface DenominatorMetrics {
  vector: CSIRiskVector;
  drift_total: number;
  event_total: number;
  movement_total: number;
  drift_share_pct: number;
  event_share_pct: number;
  dominance_vs_avg_pct: number;
  share_of_total_pct: number;
}

export interface Section2Result extends SectionResult {
  data: DenominatorMetrics[];
  aggregates: {
    total_drift_all: number;
    total_event_all: number;
    total_movement_all: number;
    avg_movement: number;
  };
}

/**
 * Section 3: Routing & Confirmation Sample
 */
export interface RoutingSample {
  item_id: string;
  raw_headline: string;
  date: Date;
  predicted_vector: CSIRiskVector;
  confirmation_status: 'confirmed' | 'active' | 'suppressed' | 'discarded';
  drift_points: number;
  event_points: number;
  suppressed: boolean;
  suppression_reason?: string;
}

export interface Section3Result extends SectionResult {
  samples: RoutingSample[];
  vector_distribution: Record<CSIRiskVector, number>;
  confirmation_rates: Record<CSIRiskVector, number>;
  suppression_rates: Record<CSIRiskVector, number>;
  misrouting_rate: number;
}

/**
 * Section 4: Rolling Vector Activity
 */
export interface VectorActivityData {
  month: string;
  vector: CSIRiskVector;
  total_drift_points: number;
  total_event_points: number;
  confirmed_items: number;
}

export interface BenchmarkEvent {
  event_name: string;
  date: Date;
  vector: CSIRiskVector;
  severity: 'MAJOR' | 'MODERATE' | 'MINOR';
}

export interface Section4Result extends SectionResult {
  time_series: VectorActivityData[];
  benchmark_events: BenchmarkEvent[];
  flatline_issues: Array<{
    vector: CSIRiskVector;
    months: string[];
    issue_type: 'zero_activity' | 'confirmation_bottleneck';
  }>;
}

/**
 * Section 5: Suppression & Scoring Dynamics
 */
export interface SuppressionMetrics {
  vector: CSIRiskVector;
  pct_capped: number;
  pct_netted: number;
  pct_decayed: number;
  mean_drift_before: number;
  mean_drift_after: number;
  mean_event_before: number;
  mean_event_after: number;
}

export interface Section5Result extends SectionResult {
  data: SuppressionMetrics[];
  disproportionate_suppression: CSIRiskVector[];
}

/**
 * Section 6: Baseline Factor Matrix
 */
export interface BaselineFactor {
  country_id: string;
  country_name: string;
  vector: CSIRiskVector;
  factor_value: number;
  source: string;
  timestamp: Date;
  fallback_type: 'direct' | 'regional' | 'neutral';
  weight: number;
  weighted_contribution: number;
}

export interface Section6Result extends SectionResult {
  sample_countries: BaselineFactor[];
  completeness_issues: string[];
  fallback_rates: Record<CSIRiskVector, number>;
  stale_data_count: number;
}

/**
 * Section 7: Source-to-Vector Concentration
 */
export interface SourceConcentration {
  vector: CSIRiskVector;
  total_detections: number;
  top_sources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  pct_from_top_1: number;
  pct_from_top_3: number;
  hhi_concentration: number;
}

export interface Section7Result extends SectionResult {
  data: SourceConcentration[];
  over_reliance_vectors: CSIRiskVector[];
}

/**
 * Section 8: Expectation Weighting Integrity
 */
export interface ExpectationWeightingSample {
  event_id: string;
  vector: CSIRiskVector;
  probability_assigned: number;
  severity_score: number;
  relevance_weight: number;
  raw_delta: number;
  applied_delta: number;
  days_active: number;
}

export interface Section8Result extends SectionResult {
  samples: ExpectationWeightingSample[];
  probability_variance: number;
  severity_variance: number;
  correlation_coefficient: number;
  formula_deviation_rate: number;
}

/**
 * Section 9: Decay Behavior
 */
export interface DecayAnalysis {
  event_id: string;
  vector: CSIRiskVector;
  peak_delta: number;
  days_to_peak: number;
  decay_half_life: number;
  days_until_zero: number;
  residual_after_30d: number;
  residual_after_60d: number;
  current_contribution: number;
}

export interface Section9Result extends SectionResult {
  high_impact_events: DecayAnalysis[];
  decay_consistency: Record<CSIRiskVector, number>;
  permanent_inflation_detected: boolean;
}

/**
 * Complete Vector Movement Audit Result
 */
export interface VectorMovementAuditResult {
  audit_id: string;
  generated_at: Date;
  time_window: TimeWindow;
  sections: {
    section_1: Section1Result;
    section_2: Section2Result;
    section_3: Section3Result;
    section_4: Section4Result;
    section_5: Section5Result;
    section_6: Section6Result;
    section_7: Section7Result;
    section_8: Section8Result;
    section_9: Section9Result;
  };
  summary: AuditSummary;
  recommendations: Recommendation[];
}

// ============================================================================
// GROUND-TRUTH RECALL AUDIT TYPES
// ============================================================================

/**
 * Event types
 */
export enum EventType {
  DISCRETE = 'DISCRETE',
  ESCALATION = 'ESCALATION',
  SUSTAINED = 'SUSTAINED'
}

/**
 * Ground-truth event
 */
export interface GroundTruthEvent {
  event_id: string;
  event_name: string;
  event_type: EventType;
  event_date: Date;
  detection_window_start: Date;
  detection_window_end: Date;
  anticipation_window_start: Date;
  primary_country: string;
  affected_countries: string[];
  region: string;
  primary_vector: CSIRiskVector;
  secondary_vectors: CSIRiskVector[];
  severity: 'MAJOR' | 'MODERATE' | 'MINOR';
  expected_drift: boolean;
  expected_confirmation: boolean;
  expected_drift_magnitude: number;
  expected_delta_magnitude: number;
  source_url: string;
  source_type: 'GOVERNMENT' | 'INTERNATIONAL_ORG' | 'MEDIA' | 'REGISTRY';
  verification_confidence: number;
  is_anticipated: boolean;
  is_surprise: boolean;
  has_lead_indicators: boolean;
  selection_rationale: string;
  expected_keywords: string[];
  notes: string;
}

/**
 * Match types
 */
export enum MatchType {
  EXACT_MATCH = 'EXACT_MATCH',
  PROBABLE_MATCH = 'PROBABLE_MATCH',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  NO_MATCH = 'NO_MATCH'
}

/**
 * Detection status
 */
export enum DetectionStatus {
  DETECTED_CORRECT = 'DETECTED_CORRECT',
  DETECTED_MISROUTED = 'DETECTED_MISROUTED',
  DETECTED_SUPPRESSED = 'DETECTED_SUPPRESSED',
  NOT_DETECTED = 'NOT_DETECTED'
}

/**
 * False negative reasons
 */
export enum FalseNegativeReason {
  COVERAGE_GAP = 'COVERAGE_GAP',
  ROUTING_FAILURE = 'ROUTING_FAILURE',
  SCORING_SUPPRESSION = 'SCORING_SUPPRESSION',
  KEYWORD_MISMATCH = 'KEYWORD_MISMATCH',
  TEMPORAL_MISMATCH = 'TEMPORAL_MISMATCH',
  GEOGRAPHIC_FILTER = 'GEOGRAPHIC_FILTER',
  DUPLICATE_SUPPRESSION = 'DUPLICATE_SUPPRESSION',
  CONFIRMATION_ONLY = 'CONFIRMATION_ONLY'
}

/**
 * Detection match
 */
export interface DetectionMatch {
  ground_truth_event_id: string;
  detection_id: string | null;
  detection_date: Date | null;
  detection_source: string | null;
  detection_text: string | null;
  match_type: MatchType;
  match_confidence: number;
  match_method: string;
  temporal_offset_days: number;
  routed_vector: CSIRiskVector | null;
  routing_correct: boolean;
  routing_confidence: number;
  produced_drift: boolean;
  produced_event_delta: boolean;
  drift_magnitude: number;
  event_delta_magnitude: number;
  detection_status: DetectionStatus;
  false_negative_reason: FalseNegativeReason | null;
}

/**
 * Recall metrics
 */
export interface VectorRecallMetrics {
  vector: CSIRiskVector;
  total_events: number;
  detected: number;
  missed: number;
  recall_rate: number;
  mean_detection_latency_days: number;
  routing_accuracy: number;
  common_misrouting_targets: Array<{
    vector: CSIRiskVector;
    count: number;
  }>;
}

export interface StratifiedRecallMetrics {
  category: string;
  total_events: number;
  detected: number;
  recall_rate: number;
}

export interface LatencyDistribution {
  mean: number;
  median: number;
  p90: number;
  p95: number;
  distribution: Array<{
    days: number;
    count: number;
  }>;
}

export interface RecallMetrics {
  total_ground_truth_events: number;
  total_detected: number;
  total_missed: number;
  overall_recall_rate: number;
  by_vector: Record<CSIRiskVector, VectorRecallMetrics>;
  by_severity: Record<'MAJOR' | 'MODERATE' | 'MINOR', StratifiedRecallMetrics>;
  by_region: Record<string, StratifiedRecallMetrics>;
  by_event_type: Record<EventType, StratifiedRecallMetrics>;
  detection_latency: LatencyDistribution;
  routing_accuracy: number;
}

/**
 * Confusion matrix
 */
export interface ConfusionMatrix {
  matrix: Record<CSIRiskVector, Record<CSIRiskVector, number>>;
  row_totals: Record<CSIRiskVector, number>;
  column_totals: Record<CSIRiskVector, number>;
  diagonal: Record<CSIRiskVector, number>;
  precision: Record<CSIRiskVector, number>;
  recall: Record<CSIRiskVector, number>;
  f1_score: Record<CSIRiskVector, number>;
}

/**
 * Routing validation
 */
export interface RoutingValidation {
  total_detected: number;
  correctly_routed: number;
  misrouted: number;
  routing_accuracy: number;
  confusion_matrix: ConfusionMatrix;
  misrouting_patterns: Array<{
    from_vector: CSIRiskVector;
    to_vector: CSIRiskVector;
    count: number;
    percentage: number;
    example_events: string[];
    suspected_cause: string;
  }>;
}

/**
 * False negative catalog
 */
export interface FalseNegativeDetail {
  event_id: string;
  event_name: string;
  reason: FalseNegativeReason;
  details: string;
  remediation: string;
}

export interface FalseNegativeCatalog {
  total_false_negatives: number;
  by_reason: Record<FalseNegativeReason, number>;
  by_vector: Record<CSIRiskVector, FalseNegativeDetail[]>;
  priority_remediations: Array<{
    reason: FalseNegativeReason;
    affected_events: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    recommended_action: string;
  }>;
}

/**
 * Expectation weighting validation
 */
export interface ExpectationWeightingDetail {
  event_id: string;
  event_name: string;
  anticipation_window_start: Date;
  event_date: Date;
  drift_detected: boolean;
  drift_start_date: Date | null;
  drift_magnitude: number;
  drift_within_window: boolean;
  confirmation_detected: boolean;
  confirmation_date: Date | null;
  event_delta_magnitude: number;
  netting_occurred: boolean;
  netting_amount: number;
  validation_passed: boolean;
  failure_reason: string | null;
}

export interface ExpectationWeightingValidation {
  total_anticipated_events: number;
  events_with_drift: number;
  drift_before_confirmation_rate: number;
  mean_anticipation_lead_time: number;
  netting_success_rate: number;
  validations: ExpectationWeightingDetail[];
}

/**
 * Complete Ground-Truth Recall Audit Result
 */
export interface GroundTruthRecallAuditResult {
  audit_id: string;
  generated_at: Date;
  time_window: TimeWindow;
  ground_truth_registry_version: string;
  recall_metrics: RecallMetrics;
  routing_validation: RoutingValidation;
  false_negative_catalog: FalseNegativeCatalog;
  expectation_weighting_validation: ExpectationWeightingValidation;
  summary: AuditSummary;
  recommendations: Recommendation[];
}