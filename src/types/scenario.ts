/**
 * Scenario Mode Type Definitions
 * Part of CO-GRI Platform Phase 3 - Weeks 9-10
 */

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export type ScenarioType = 'Geopolitical' | 'Economic' | 'Climate' | 'Pandemic' | 'Custom';

export type ShockIntensity = number; // -100 to +100

export type PropagationDepth = 1 | 2 | 3 | 4 | 5;

export type DurationMonths = 1 | 3 | 6 | 12;

export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Negligible';

export type TransmissionChannel = 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';

// ============================================================================
// INITIAL SHOCK
// ============================================================================

export interface InitialShock {
  affected_countries: string[]; // 1-10 countries
  shock_intensity: ShockIntensity; // -100 to +100
  channel_distribution: {
    revenue: number; // 0-100
    supply_chain: number; // 0-100
    physical_assets: number; // 0-100
    financial: number; // 0-100
  }; // Must sum to 100
  duration_months: DurationMonths;
  description: string;
}

// ============================================================================
// PROPAGATION SETTINGS
// ============================================================================

export interface PropagationSettings {
  propagation_depth: PropagationDepth; // 1-5 hops
  amplification_factor: number; // 0.5-2.0
  sector_filters: string[]; // Empty = all sectors
  company_filters: {
    threshold_delta_CO_GRI?: number; // Minimum ΔCO-GRI to include
    specific_tickers?: string[]; // Specific companies to analyze
  };
  transmission_channels: TransmissionChannel[]; // Which channels to propagate through
  advanced_options: {
    enable_second_order_effects: boolean;
    enable_feedback_loops: boolean;
    time_decay_enabled: boolean;
    time_decay_rate?: number; // 0-1, if time_decay_enabled
  };
}

// ============================================================================
// SCENARIO
// ============================================================================

export interface Scenario {
  scenario_id: string;
  scenario_name: string;
  scenario_type: ScenarioType;
  description: string;
  initial_shock: InitialShock;
  propagation_settings: PropagationSettings;
  created_at: Date;
  last_modified: Date;
  is_preset: boolean; // True for built-in scenarios
}

// ============================================================================
// SCENARIO RESULTS
// ============================================================================

export interface GlobalImpact {
  total_countries_affected: number;
  total_companies_affected: number;
  average_delta_CO_GRI: number;
  max_delta_CO_GRI: number;
  min_delta_CO_GRI: number;
  total_economic_impact_estimate?: number; // USD billions
}

export interface RegionalImpact {
  region: string;
  countries_affected: string[];
  average_delta_CO_GRI: number;
  companies_affected: number;
  primary_transmission_channels: TransmissionChannel[];
}

export interface SectorImpact {
  sector: string;
  average_delta_CO_GRI: number;
  companies_affected: number;
  most_affected_companies: string[]; // Top 5 tickers
  primary_transmission_channels: TransmissionChannel[];
}

export interface CompanyImpact {
  ticker: string;
  company_name: string;
  sector: string;
  baseline_CO_GRI: number;
  scenario_delta_CO_GRI: number;
  new_CO_GRI: number;
  impact_level: ImpactLevel;
  transmission_path_length: number; // Number of hops from initial shock
  transmission_path: string[]; // [Country → Sector → Company]
  channel_breakdown: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  recovery_time_estimate_months?: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  execution_time_ms: number;
  global_impact: GlobalImpact;
  regional_impacts: RegionalImpact[];
  sector_impacts: SectorImpact[];
  company_impacts: CompanyImpact[];
  transmission_graph: TransmissionGraph;
  generated_at: Date;
}

// ============================================================================
// TRANSMISSION TRACE
// ============================================================================

export type NodeType = 'Country' | 'Sector' | 'Company';

export type NodeLayer = 0 | 1 | 2 | 3 | 4 | 5; // Layer 0 = initial shock

export interface TransmissionNode {
  node_id: string;
  node_type: NodeType;
  node_layer: NodeLayer;
  label: string; // Display name
  shock_intensity: number; // Current shock intensity at this node
  is_initial_shock: boolean;
  is_amplified: boolean; // True if shock was amplified
  amplification_factor?: number; // If amplified
  metadata?: {
    country?: string;
    sector?: string;
    ticker?: string;
    baseline_CO_GRI?: number;
  };
}

export interface TransmissionEdge {
  source_node_id: string;
  target_node_id: string;
  transmission_intensity: number; // Shock intensity transmitted
  transmission_channel: TransmissionChannel;
  attenuation_factor: number; // 0-1, how much shock was dampened
}

export interface TransmissionGraph {
  nodes: TransmissionNode[];
  edges: TransmissionEdge[];
  max_layer: NodeLayer;
  total_nodes: number;
  total_edges: number;
}

// ============================================================================
// SCENARIO EXECUTION STATUS
// ============================================================================

export type ExecutionStep = 
  | 'Validating'
  | 'Applying Initial Shock'
  | 'Propagating Layer 1'
  | 'Propagating Layer 2'
  | 'Propagating Layer 3'
  | 'Propagating Layer 4'
  | 'Propagating Layer 5'
  | 'Calculating Company Impacts'
  | 'Generating Results'
  | 'Complete'
  | 'Error';

export interface ScenarioExecutionStatus {
  current_step: ExecutionStep;
  progress_percentage: number; // 0-100
  estimated_time_remaining_seconds?: number;
  error_message?: string;
}

// ============================================================================
// PRESET SCENARIOS
// ============================================================================

export interface PresetScenario {
  scenario_id: string;
  name: string;
  type: ScenarioType;
  description: string;
  thumbnail?: string; // Image URL
  initial_shock: InitialShock;
  propagation_settings: PropagationSettings;
}

// ============================================================================
// SCENARIO FILTERS
// ============================================================================

export interface ScenarioResultFilters {
  sector?: string[];
  impact_level?: ImpactLevel[];
  min_delta_CO_GRI?: number;
  max_delta_CO_GRI?: number;
  transmission_path_length?: number[];
  search_query?: string; // Company name or ticker
}

export interface ScenarioResultSorting {
  sort_by: 'delta_CO_GRI' | 'company_name' | 'sector' | 'transmission_path_length';
  sort_order: 'asc' | 'desc';
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ScenarioValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ChannelDistribution {
  revenue: number;
  supply_chain: number;
  physical_assets: number;
  financial: number;
}

export interface TransmissionPathNode {
  node_id: string;
  node_type: NodeType;
  label: string;
  shock_intensity: number;
}

export interface CompanyScenarioSummary {
  ticker: string;
  scenario_name: string;
  scenario_type: ScenarioType;
  delta_CO_GRI: number;
  impact_level: ImpactLevel;
  transmission_path_length: number;
  transmission_path: TransmissionPathNode[];
  primary_channels: TransmissionChannel[];
}