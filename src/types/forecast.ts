/**
 * Forecast Mode Type Definitions
 * Part of CO-GRI Platform Phase 3 - Week 7-8
 * 
 * Defines all data structures for Forecast Mode
 */

// ============================================================================
// FORECAST EVENT TYPES
// ============================================================================

/**
 * Forecast event probability level
 */
export type ProbabilityLevel = 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';

/**
 * Forecast event impact level
 */
export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low';

/**
 * Forecast event type
 */
export type ForecastEventType = 
  | 'Political'
  | 'Economic'
  | 'Military'
  | 'Social'
  | 'Environmental'
  | 'Technological';

/**
 * Forecast time horizon
 */
export type ForecastHorizon = 'Q2 2026' | 'Q3 2026' | 'Q4 2026' | 'Q1 2027';

/**
 * Core forecast event structure
 */
export interface ForecastEvent {
  event_id: string;
  event_name: string;
  description: string;
  event_type: ForecastEventType;
  
  // Probability and timing
  probability: number;              // [0,1]
  probability_level: ProbabilityLevel;
  timing: ForecastHorizon;
  timing_description: string;       // "Q2 2026" | "6-9 months"
  
  // Impact assessment
  impact_level: ImpactLevel;
  expected_delta_CO_GRI: number;    // Expected change in CO-GRI
  delta_range: {
    best_case: number;
    base_case: number;
    worst_case: number;
  };
  
  // Geographic and sector impact
  affected_countries: string[];
  affected_regions: string[];
  affected_sectors: string[];
  
  // Channel breakdown
  delta_by_channel: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  
  // Transmission and reasoning
  transmission_path: string[];      // Country propagation path
  reasoning: string;                // Why this event matters
  data_sources: string[];           // Source attribution
  
  // Metadata
  confidence: number;               // [0,1]
  last_updated: Date;
}

/**
 * Relevance-filtered forecast event for company
 */
export interface RelevantForecastEvent extends ForecastEvent {
  why_relevant: string;             // Explanation of relevance to company
  company_exposure: number;         // Company's exposure to affected countries
  materiality_score: number;        // Relevance score [0,100]
}

// ============================================================================
// FORECAST OUTLOOK TYPES
// ============================================================================

/**
 * Forecast outlook direction
 */
export type ForecastOutlookDirection = 'Headwind' | 'Tailwind' | 'Mixed' | 'Neutral';

/**
 * Confidence level
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Company-specific forecast outlook
 */
export interface CompanyForecastOutlook {
  ticker: string;
  company_name: string;
  
  // Outlook assessment
  outlook: ForecastOutlookDirection;
  confidence: ConfidenceLevel;
  horizon: string;                  // "6-12 months"
  
  // Expected impact
  expected_delta_CO_GRI: number;
  delta_range: {
    best_case: number;
    base_case: number;
    worst_case: number;
  };
  
  // Top drivers
  top_forecast_drivers: RelevantForecastEvent[];
  
  // Channel impact
  channel_impact_assessment: ChannelImpactAssessment[];
  
  // Recommendations
  recommended_actions: string[];
  
  // Metadata
  last_updated: Date;
  data_coverage: number;            // [0,1]
}

/**
 * Channel impact assessment for forecast
 */
export interface ChannelImpactAssessment {
  channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  direction: 'Increasing' | 'Decreasing' | 'Stable';
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
  contributing_events: string[];    // Event IDs
}

// ============================================================================
// GLOBAL FORECAST TYPES
// ============================================================================

/**
 * Global risk trajectory
 */
export interface GlobalRiskTrajectory {
  current_level: number;            // Current global risk index
  forecast_level: number;           // Forecast 6-12 month level
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  confidence: ConfidenceLevel;
  
  // Historical and forecast data points
  historical_data: Array<{
    date: string;
    level: number;
  }>;
  forecast_data: Array<{
    date: string;
    level: number;
    confidence_interval: [number, number];
  }>;
}

/**
 * Geopolitical theme
 */
export interface GeopoliticalTheme {
  theme_id: string;
  theme_name: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium';
  
  // Related events
  related_events: string[];         // Event IDs
  affected_regions: string[];
  affected_sectors: string[];
  
  // Impact
  expected_impact: ImpactLevel;
  probability: number;
}

/**
 * Regional hotspot
 */
export interface RegionalHotspot {
  region: string;
  countries: string[];
  risk_level: 'Critical' | 'High' | 'Elevated' | 'Moderate';
  trend: 'Escalating' | 'Stable' | 'De-escalating';
  
  // Key events
  key_events: string[];             // Event IDs
  
  // Impact
  expected_impact: string;
  affected_sectors: string[];
}

/**
 * Regional assessment
 */
export interface RegionalAssessment {
  region: string;
  countries: string[];
  
  // Risk outlook
  risk_trajectory: 'Increasing' | 'Decreasing' | 'Stable';
  current_level: number;
  forecast_level: number;
  
  // Key events
  key_events: ForecastEvent[];
  
  // Sector implications
  sector_implications: Array<{
    sector: string;
    impact: 'Positive' | 'Negative' | 'Mixed';
    reasoning: string;
  }>;
  
  // Summary
  summary: string;
}

// ============================================================================
// ASSET CLASS TYPES
// ============================================================================

/**
 * Asset class impact
 */
export type AssetClassImpact = 'Positive' | 'Negative' | 'Neutral' | 'Mixed';

/**
 * Asset class forecast
 */
export interface AssetClassForecast {
  asset_class: 'Equities' | 'Fixed Income' | 'Commodities' | 'Currencies';
  
  // By sector (for Equities) or by region (for others)
  breakdown: Array<{
    category: string;               // Sector name or region name
    impact: AssetClassImpact;
    reasoning: string;
    confidence: ConfidenceLevel;
    related_events: string[];       // Event IDs
  }>;
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

/**
 * Recommendation category
 */
export type RecommendationCategory = 'Portfolio Positioning' | 'Risk Mitigation' | 'Opportunities';

/**
 * Strategic recommendation
 */
export interface StrategicRecommendation {
  recommendation_id: string;
  category: RecommendationCategory;
  
  // Action
  action: string;
  rationale: string;
  
  // Confidence and timing
  confidence: ConfidenceLevel;
  time_horizon: string;             // "Immediate" | "3-6 months" | "6-12 months"
  priority: 'High' | 'Medium' | 'Low';
  
  // Related events
  related_events: string[];         // Event IDs
  affected_sectors: string[];
  affected_regions: string[];
}

// ============================================================================
// EXECUTIVE SUMMARY TYPES
// ============================================================================

/**
 * Executive summary data
 */
export interface ExecutiveSummary {
  // Global trajectory
  global_risk_trajectory: GlobalRiskTrajectory;
  
  // Top themes
  top_geopolitical_themes: GeopoliticalTheme[];
  
  // High-impact events
  high_impact_events_count: number;
  high_impact_events: ForecastEvent[];
  
  // Regional hotspots
  regional_hotspots: RegionalHotspot[];
  
  // Summary text
  summary_text: string;
  key_takeaways: string[];
  
  // Metadata
  last_updated: Date;
  forecast_horizon: string;
  confidence: ConfidenceLevel;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Forecast filter options
 */
export interface ForecastFilterOptions {
  probability_min?: number;
  impact_levels?: ImpactLevel[];
  event_types?: ForecastEventType[];
  regions?: string[];
  sectors?: string[];
  time_horizons?: ForecastHorizon[];
}

/**
 * Forecast sort options
 */
export type ForecastSortBy = 'date' | 'probability' | 'impact' | 'relevance';
export type ForecastSortOrder = 'asc' | 'desc';

/**
 * Relevance criteria for company
 */
export interface RelevanceCriteria {
  min_exposure_threshold: number;   // Default: 0.05 (5%)
  min_delta_threshold: number;      // Default: 2
  min_probability: number;          // Default: 0.3 (30%)
}

/**
 * Forecast validation result
 */
export interface ForecastValidationResult {
  is_valid: boolean;
  exposure_matrix_unchanged: boolean;
  no_new_exposures: boolean;
  relevance_filtered: boolean;
  errors: string[];
  warnings: string[];
}