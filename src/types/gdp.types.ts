/**
 * GDP Data Type Definitions
 * 
 * This module defines types for PPP GDP data used in GDP-weighted Global CSI calculations.
 */

/**
 * PPP GDP data for a single country
 */
export interface CountryGDPData {
  country: string;              // Country name (matches GLOBAL_COUNTRIES)
  iso3: string;                 // ISO 3-letter code (e.g., "USA")
  ppp_gdp: number;              // PPP GDP in current international $ (e.g., 27360935000000)
  ppp_gdp_year: number;         // Reference year (e.g., 2023)
  gdp_weight: number;           // Calculated weight (0-1, sum to 1.0)
  data_source: 'WorldBank' | 'IMF' | 'Manual';
  last_updated: string;         // ISO date string
  confidence: 'High' | 'Medium' | 'Low';  // Data quality indicator
}

/**
 * Complete GDP dataset for all countries
 */
export interface GlobalGDPDataset {
  total_gdp: number;            // Sum of all PPP GDPs
  reference_year: number;       // Year of GDP data (e.g., 2023)
  country_data: CountryGDPData[];
  last_sync: string;            // Last API sync timestamp (ISO date)
  coverage_percentage: number;  // % of countries with GDP data (target: >95%)
  data_vintage: string;         // Human-readable data age (e.g., "2023 data")
}

/**
 * GDP weight lookup map (optimized for calculations)
 */
export type GDPWeightMap = Map<string, number>;

/**
 * Top contributor to global risk
 */
export interface TopContributor {
  country: string;
  csi: number;
  gdp_weight: number;           // As decimal (e.g., 0.238 for 23.8%)
  gdp_weight_percentage: string; // Formatted (e.g., "23.8%")
  weighted_contribution: number; // w_i × CSI_i
  contribution_percentage: string; // % of total global CSI
}

/**
 * Global CSI calculation result with dual metrics
 */
export interface GlobalCSIResult {
  // GDP-Weighted Metrics (Primary)
  gdp_weighted_csi: number;
  gdp_weighted_change: number;
  gdp_weighted_direction: 'Increasing' | 'Decreasing' | 'Stable';
  
  // Equal-Weighted Metrics (Secondary)
  equal_weighted_csi: number;
  equal_weighted_change: number;
  equal_weighted_direction: 'Increasing' | 'Decreasing' | 'Stable';
  
  // Comparison Metrics
  metric_delta: number;         // GDP-weighted minus equal-weighted
  delta_interpretation: string; // Human-readable explanation
  delta_percentage: number;     // Delta as % of equal-weighted
  
  // Metadata
  total_countries: number;
  gdp_coverage: number;         // % of global GDP represented
  calculation_date: string;     // ISO date string
  time_window: string;          // e.g., "30D"
  gdp_data_year: number;        // Year of GDP weights used
  
  // Top Contributors (for UI display)
  top_contributors: TopContributor[];
  
  // Data Quality
  data_quality: {
    gdp_data_confidence: 'High' | 'Medium' | 'Low';
    missing_countries: string[];
    fallback_used: boolean;
  };
}

/**
 * Metric type selector
 */
export type MetricType = 'gdp-weighted' | 'equal-weighted';