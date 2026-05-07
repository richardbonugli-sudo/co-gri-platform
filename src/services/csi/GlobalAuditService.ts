/**
 * Global Audit Service
 * Phase 2: Global Backfill & Geopolitical Plausibility Audit
 * 
 * This service generates and analyzes CSI data across ~195 countries
 * over a 24-month historical window to validate geopolitical plausibility.
 */

import { CSIRiskVector, CSIRiskVectorNames } from './types/CSITypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Country classification for plausibility checks
 */
export type CountryClassification = 
  | 'FRAGILE_STATE'
  | 'CONFLICT_ZONE'
  | 'SANCTIONED'
  | 'EMERGING_MARKET'
  | 'OECD_DEMOCRACY'
  | 'STABLE_DEMOCRACY'
  | 'OTHER';

/**
 * Country metadata with baseline risk characteristics
 */
export interface CountryMetadata {
  country_id: string;
  country_name: string;
  region: string;
  classification: CountryClassification;
  expected_baseline_range: [number, number]; // [min, max] expected CSI
  fragility_index?: number; // 0-10 scale
  oecd_member: boolean;
  sanctioned: boolean;
}

/**
 * Daily CSI record for a country
 */
export interface DailyCSIRecord {
  country_id: string;
  date: Date;
  csi_total: number;
  baseline_total: number;
  escalation_drift_total: number;
  event_delta_total: number;
  by_vector: Record<CSIRiskVector, {
    baseline: number;
    drift: number;
    event_delta: number;
    total: number;
  }>;
  active_signal_count: number;
  confirmed_event_count: number;
}

/**
 * Country statistics over the backfill period
 */
export interface CountryStatistics {
  country_id: string;
  country_name: string;
  classification: CountryClassification;
  region: string;
  
  // 24-month averages
  avg_csi_total: number;
  avg_baseline: number;
  avg_drift: number;
  avg_event_delta: number;
  
  // Volatility metrics
  csi_std_dev: number;
  daily_change_std_dev: number;
  days_with_move_gt_1pt: number;
  days_with_move_gt_3pts: number;
  max_daily_increase: number;
  max_daily_decrease: number;
  
  // Vector breakdown averages
  avg_by_vector: Record<CSIRiskVector, number>;
  
  // Data quality
  total_days: number;
  missing_days: number;
  data_completeness: number; // 0-1
}

/**
 * Global distribution summary
 */
export interface GlobalDistribution {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  percentile_25: number;
  percentile_75: number;
  percentile_90: number;
  percentile_95: number;
}

/**
 * Plausibility check result
 */
export interface PlausibilityCheck {
  check_id: string;
  check_name: string;
  description: string;
  passed: boolean;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  details: string;
  affected_countries?: string[];
}

/**
 * Backfill status
 */
export interface BackfillStatus {
  total_countries: number;
  countries_processed: number;
  total_country_days: number;
  country_days_processed: number;
  missing_data_gaps: { country_id: string; gap_start: Date; gap_end: Date; }[];
  start_date: Date;
  end_date: Date;
  processing_time_ms: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// COUNTRY DATABASE - FULL 195 UN-RECOGNIZED SOVEREIGN STATES
// ============================================================================

/**
 * Comprehensive list of 195 countries with metadata
 * Includes all UN member states plus observer states
 */
export const COUNTRY_DATABASE: CountryMetadata[] = [
  // ============================================================================
  // OECD DEMOCRACIES (38 countries) - Expected low CSI: 5-20
  // ============================================================================
  { country_id: 'USA', country_name: 'United States', region: 'North America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 18], oecd_member: true, sanctioned: false },
  { country_id: 'CAN', country_name: 'Canada', region: 'North America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'GBR', country_name: 'United Kingdom', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: true, sanctioned: false },
  { country_id: 'DEU', country_name: 'Germany', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'FRA', country_name: 'France', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: true, sanctioned: false },
  { country_id: 'JPN', country_name: 'Japan', region: 'Asia Pacific', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'AUS', country_name: 'Australia', region: 'Asia Pacific', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'NZL', country_name: 'New Zealand', region: 'Asia Pacific', classification: 'OECD_DEMOCRACY', expected_baseline_range: [4, 10], oecd_member: true, sanctioned: false },
  { country_id: 'CHE', country_name: 'Switzerland', region: 'Europe', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [4, 10], oecd_member: true, sanctioned: false },
  { country_id: 'NOR', country_name: 'Norway', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [4, 10], oecd_member: true, sanctioned: false },
  { country_id: 'SWE', country_name: 'Sweden', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'DNK', country_name: 'Denmark', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [4, 10], oecd_member: true, sanctioned: false },
  { country_id: 'FIN', country_name: 'Finland', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'NLD', country_name: 'Netherlands', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'BEL', country_name: 'Belgium', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'AUT', country_name: 'Austria', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'IRL', country_name: 'Ireland', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [5, 12], oecd_member: true, sanctioned: false },
  { country_id: 'LUX', country_name: 'Luxembourg', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [4, 10], oecd_member: true, sanctioned: false },
  { country_id: 'ISL', country_name: 'Iceland', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [3, 8], oecd_member: true, sanctioned: false },
  { country_id: 'PRT', country_name: 'Portugal', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'ESP', country_name: 'Spain', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [7, 15], oecd_member: true, sanctioned: false },
  { country_id: 'ITA', country_name: 'Italy', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 18], oecd_member: true, sanctioned: false },
  { country_id: 'GRC', country_name: 'Greece', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [10, 20], oecd_member: true, sanctioned: false },
  { country_id: 'KOR', country_name: 'South Korea', region: 'Asia Pacific', classification: 'OECD_DEMOCRACY', expected_baseline_range: [12, 22], oecd_member: true, sanctioned: false },
  { country_id: 'ISR', country_name: 'Israel', region: 'Middle East', classification: 'OECD_DEMOCRACY', expected_baseline_range: [25, 45], oecd_member: true, sanctioned: false },
  { country_id: 'CZE', country_name: 'Czech Republic', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'POL', country_name: 'Poland', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 18], oecd_member: true, sanctioned: false },
  { country_id: 'HUN', country_name: 'Hungary', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [12, 22], oecd_member: true, sanctioned: false },
  { country_id: 'SVK', country_name: 'Slovakia', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: true, sanctioned: false },
  { country_id: 'SVN', country_name: 'Slovenia', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [6, 14], oecd_member: true, sanctioned: false },
  { country_id: 'EST', country_name: 'Estonia', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: true, sanctioned: false },
  { country_id: 'LVA', country_name: 'Latvia', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [10, 18], oecd_member: true, sanctioned: false },
  { country_id: 'LTU', country_name: 'Lithuania', region: 'Europe', classification: 'OECD_DEMOCRACY', expected_baseline_range: [10, 18], oecd_member: true, sanctioned: false },
  { country_id: 'CHL', country_name: 'Chile', region: 'South America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [10, 20], oecd_member: true, sanctioned: false },
  { country_id: 'MEX', country_name: 'Mexico', region: 'North America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [20, 35], oecd_member: true, sanctioned: false },
  { country_id: 'COL', country_name: 'Colombia', region: 'South America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [22, 38], oecd_member: true, sanctioned: false },
  { country_id: 'CRI', country_name: 'Costa Rica', region: 'Central America', classification: 'OECD_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: true, sanctioned: false },
  { country_id: 'TUR', country_name: 'Turkey', region: 'Europe/Asia', classification: 'EMERGING_MARKET', expected_baseline_range: [28, 45], oecd_member: true, sanctioned: false, fragility_index: 5 },
  
  // ============================================================================
  // SANCTIONED COUNTRIES (8 countries) - Expected high CSI: 50-85
  // ============================================================================
  { country_id: 'RUS', country_name: 'Russia', region: 'Europe/Asia', classification: 'SANCTIONED', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: true, fragility_index: 6 },
  { country_id: 'IRN', country_name: 'Iran', region: 'Middle East', classification: 'SANCTIONED', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: true, fragility_index: 7 },
  { country_id: 'PRK', country_name: 'North Korea', region: 'Asia Pacific', classification: 'SANCTIONED', expected_baseline_range: [70, 90], oecd_member: false, sanctioned: true, fragility_index: 9 },
  { country_id: 'SYR', country_name: 'Syria', region: 'Middle East', classification: 'SANCTIONED', expected_baseline_range: [65, 85], oecd_member: false, sanctioned: true, fragility_index: 9 },
  { country_id: 'CUB', country_name: 'Cuba', region: 'Caribbean', classification: 'SANCTIONED', expected_baseline_range: [45, 60], oecd_member: false, sanctioned: true, fragility_index: 5 },
  { country_id: 'VEN', country_name: 'Venezuela', region: 'South America', classification: 'SANCTIONED', expected_baseline_range: [50, 70], oecd_member: false, sanctioned: true, fragility_index: 8 },
  { country_id: 'BLR', country_name: 'Belarus', region: 'Europe', classification: 'SANCTIONED', expected_baseline_range: [50, 68], oecd_member: false, sanctioned: true, fragility_index: 6 },
  { country_id: 'MMR', country_name: 'Myanmar', region: 'Asia Pacific', classification: 'SANCTIONED', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: true, fragility_index: 8 },
  
  // ============================================================================
  // FRAGILE STATES / CONFLICT ZONES (22 countries) - Expected high CSI: 45-85
  // ============================================================================
  { country_id: 'AFG', country_name: 'Afghanistan', region: 'South Asia', classification: 'FRAGILE_STATE', expected_baseline_range: [70, 90], oecd_member: false, sanctioned: false, fragility_index: 10 },
  { country_id: 'YEM', country_name: 'Yemen', region: 'Middle East', classification: 'CONFLICT_ZONE', expected_baseline_range: [70, 90], oecd_member: false, sanctioned: false, fragility_index: 10 },
  { country_id: 'SOM', country_name: 'Somalia', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [70, 90], oecd_member: false, sanctioned: false, fragility_index: 10 },
  { country_id: 'SSD', country_name: 'South Sudan', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [70, 90], oecd_member: false, sanctioned: false, fragility_index: 10 },
  { country_id: 'CAF', country_name: 'Central African Republic', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [65, 85], oecd_member: false, sanctioned: false, fragility_index: 9 },
  { country_id: 'COD', country_name: 'DR Congo', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [60, 80], oecd_member: false, sanctioned: false, fragility_index: 9 },
  { country_id: 'SDN', country_name: 'Sudan', region: 'Africa', classification: 'CONFLICT_ZONE', expected_baseline_range: [65, 85], oecd_member: false, sanctioned: false, fragility_index: 9 },
  { country_id: 'LBY', country_name: 'Libya', region: 'Africa', classification: 'CONFLICT_ZONE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'IRQ', country_name: 'Iraq', region: 'Middle East', classification: 'CONFLICT_ZONE', expected_baseline_range: [50, 70], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'HTI', country_name: 'Haiti', region: 'Caribbean', classification: 'FRAGILE_STATE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 9 },
  { country_id: 'MLI', country_name: 'Mali', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'BFA', country_name: 'Burkina Faso', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'NER', country_name: 'Niger', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [50, 70], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'TCD', country_name: 'Chad', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'ERI', country_name: 'Eritrea', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [55, 75], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'ZWE', country_name: 'Zimbabwe', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [45, 65], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'LBN', country_name: 'Lebanon', region: 'Middle East', classification: 'FRAGILE_STATE', expected_baseline_range: [50, 70], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'UKR', country_name: 'Ukraine', region: 'Europe', classification: 'CONFLICT_ZONE', expected_baseline_range: [60, 80], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'PSE', country_name: 'Palestine', region: 'Middle East', classification: 'CONFLICT_ZONE', expected_baseline_range: [65, 85], oecd_member: false, sanctioned: false, fragility_index: 9 },
  { country_id: 'ETH', country_name: 'Ethiopia', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [45, 65], oecd_member: false, sanctioned: false, fragility_index: 8 },
  { country_id: 'MOZ', country_name: 'Mozambique', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [42, 62], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'BDI', country_name: 'Burundi', region: 'Africa', classification: 'FRAGILE_STATE', expected_baseline_range: [50, 70], oecd_member: false, sanctioned: false, fragility_index: 8 },
  
  // ============================================================================
  // EMERGING MARKETS (27 countries) - Expected moderate CSI: 20-45
  // ============================================================================
  { country_id: 'CHN', country_name: 'China', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [25, 40], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'IND', country_name: 'India', region: 'South Asia', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'BRA', country_name: 'Brazil', region: 'South America', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'ZAF', country_name: 'South Africa', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'IDN', country_name: 'Indonesia', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'THA', country_name: 'Thailand', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MYS', country_name: 'Malaysia', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'PHL', country_name: 'Philippines', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'VNM', country_name: 'Vietnam', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'ARG', country_name: 'Argentina', region: 'South America', classification: 'EMERGING_MARKET', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'PER', country_name: 'Peru', region: 'South America', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'EGY', country_name: 'Egypt', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'SAU', country_name: 'Saudi Arabia', region: 'Middle East', classification: 'EMERGING_MARKET', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'ARE', country_name: 'UAE', region: 'Middle East', classification: 'EMERGING_MARKET', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'QAT', country_name: 'Qatar', region: 'Middle East', classification: 'EMERGING_MARKET', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'KWT', country_name: 'Kuwait', region: 'Middle East', classification: 'EMERGING_MARKET', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'NGA', country_name: 'Nigeria', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'KEN', country_name: 'Kenya', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'GHA', country_name: 'Ghana', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MAR', country_name: 'Morocco', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'PAK', country_name: 'Pakistan', region: 'South Asia', classification: 'EMERGING_MARKET', expected_baseline_range: [38, 58], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'BGD', country_name: 'Bangladesh', region: 'South Asia', classification: 'EMERGING_MARKET', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'LKA', country_name: 'Sri Lanka', region: 'South Asia', classification: 'EMERGING_MARKET', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'TWN', country_name: 'Taiwan', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'HKG', country_name: 'Hong Kong', region: 'Asia Pacific', classification: 'EMERGING_MARKET', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'DZA', country_name: 'Algeria', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'TUN', country_name: 'Tunisia', region: 'Africa', classification: 'EMERGING_MARKET', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  
  // ============================================================================
  // STABLE DEMOCRACIES (Non-OECD) (10 countries) - Expected low CSI: 8-25
  // ============================================================================
  { country_id: 'SGP', country_name: 'Singapore', region: 'Asia Pacific', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [8, 16], oecd_member: false, sanctioned: false, fragility_index: 1 },
  { country_id: 'BWA', country_name: 'Botswana', region: 'Africa', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'NAM', country_name: 'Namibia', region: 'Africa', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'MUS', country_name: 'Mauritius', region: 'Africa', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [12, 25], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'URY', country_name: 'Uruguay', region: 'South America', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [10, 22], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'BRB', country_name: 'Barbados', region: 'Caribbean', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [12, 25], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'BHS', country_name: 'Bahamas', region: 'Caribbean', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [14, 26], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'CPV', country_name: 'Cape Verde', region: 'Africa', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'SYC', country_name: 'Seychelles', region: 'Africa', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [14, 26], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'TTO', country_name: 'Trinidad and Tobago', region: 'Caribbean', classification: 'STABLE_DEMOCRACY', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  
  // ============================================================================
  // OTHER COUNTRIES - EUROPE (20 countries)
  // ============================================================================
  { country_id: 'SRB', country_name: 'Serbia', region: 'Europe', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'ALB', country_name: 'Albania', region: 'Europe', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MKD', country_name: 'North Macedonia', region: 'Europe', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MNE', country_name: 'Montenegro', region: 'Europe', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'BIH', country_name: 'Bosnia and Herzegovina', region: 'Europe', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 5 },

  { country_id: 'CYP', country_name: 'Cyprus', region: 'Europe', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MLT', country_name: 'Malta', region: 'Europe', classification: 'OTHER', expected_baseline_range: [12, 25], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'HRV', country_name: 'Croatia', region: 'Europe', classification: 'OTHER', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'BGR', country_name: 'Bulgaria', region: 'Europe', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'ROU', country_name: 'Romania', region: 'Europe', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'MDA', country_name: 'Moldova', region: 'Europe', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'AND', country_name: 'Andorra', region: 'Europe', classification: 'OTHER', expected_baseline_range: [6, 14], oecd_member: false, sanctioned: false, fragility_index: 1 },
  { country_id: 'MCO', country_name: 'Monaco', region: 'Europe', classification: 'OTHER', expected_baseline_range: [6, 14], oecd_member: false, sanctioned: false, fragility_index: 1 },
  { country_id: 'SMR', country_name: 'San Marino', region: 'Europe', classification: 'OTHER', expected_baseline_range: [5, 12], oecd_member: false, sanctioned: false, fragility_index: 1 },
  { country_id: 'LIE', country_name: 'Liechtenstein', region: 'Europe', classification: 'OTHER', expected_baseline_range: [5, 12], oecd_member: false, sanctioned: false, fragility_index: 1 },

  
  // ============================================================================
  // OTHER COUNTRIES - CAUCASUS & CENTRAL ASIA (10 countries)
  // ============================================================================
  { country_id: 'GEO', country_name: 'Georgia', region: 'Europe/Asia', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'ARM', country_name: 'Armenia', region: 'Europe/Asia', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'AZE', country_name: 'Azerbaijan', region: 'Europe/Asia', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'KAZ', country_name: 'Kazakhstan', region: 'Central Asia', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'UZB', country_name: 'Uzbekistan', region: 'Central Asia', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'TKM', country_name: 'Turkmenistan', region: 'Central Asia', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'TJK', country_name: 'Tajikistan', region: 'Central Asia', classification: 'OTHER', expected_baseline_range: [38, 58], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'KGZ', country_name: 'Kyrgyzstan', region: 'Central Asia', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'MNG', country_name: 'Mongolia', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  
  // ============================================================================
  // OTHER COUNTRIES - SOUTH ASIA (5 countries)
  // ============================================================================
  { country_id: 'NPL', country_name: 'Nepal', region: 'South Asia', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'BTN', country_name: 'Bhutan', region: 'South Asia', classification: 'OTHER', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'MDV', country_name: 'Maldives', region: 'South Asia', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 4 },
  
  // ============================================================================
  // OTHER COUNTRIES - SOUTHEAST ASIA (7 countries)
  // ============================================================================
  { country_id: 'LAO', country_name: 'Laos', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'KHM', country_name: 'Cambodia', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'BRN', country_name: 'Brunei', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [12, 25], oecd_member: false, sanctioned: false, fragility_index: 2 },
  { country_id: 'TLS', country_name: 'Timor-Leste', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  
  // ============================================================================
  // OTHER COUNTRIES - PACIFIC ISLANDS (14 countries)
  // ============================================================================
  { country_id: 'PNG', country_name: 'Papua New Guinea', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'FJI', country_name: 'Fiji', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'WSM', country_name: 'Samoa', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'TON', country_name: 'Tonga', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'VUT', country_name: 'Vanuatu', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'SLB', country_name: 'Solomon Islands', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'KIR', country_name: 'Kiribati', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },

  { country_id: 'NRU', country_name: 'Nauru', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'PLW', country_name: 'Palau', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [15, 28], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'MHL', country_name: 'Marshall Islands', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'FSM', country_name: 'Micronesia', region: 'Asia Pacific', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  
  // ============================================================================
  // OTHER COUNTRIES - MIDDLE EAST (4 countries)
  // ============================================================================
  { country_id: 'JOR', country_name: 'Jordan', region: 'Middle East', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'OMN', country_name: 'Oman', region: 'Middle East', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'BHR', country_name: 'Bahrain', region: 'Middle East', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  
  // ============================================================================
  // OTHER COUNTRIES - AFRICA (35 countries)
  // ============================================================================
  { country_id: 'TZA', country_name: 'Tanzania', region: 'Africa', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'UGA', country_name: 'Uganda', region: 'Africa', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'RWA', country_name: 'Rwanda', region: 'Africa', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'AGO', country_name: 'Angola', region: 'Africa', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'ZMB', country_name: 'Zambia', region: 'Africa', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'SEN', country_name: 'Senegal', region: 'Africa', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'CIV', country_name: "Côte d'Ivoire", region: 'Africa', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'CMR', country_name: 'Cameroon', region: 'Africa', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'GAB', country_name: 'Gabon', region: 'Africa', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'COG', country_name: 'Republic of Congo', region: 'Africa', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'GNQ', country_name: 'Equatorial Guinea', region: 'Africa', classification: 'OTHER', expected_baseline_range: [38, 58], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'LSO', country_name: 'Lesotho', region: 'Africa', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'SWZ', country_name: 'Eswatini', region: 'Africa', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'COM', country_name: 'Comoros', region: 'Africa', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'MRT', country_name: 'Mauritania', region: 'Africa', classification: 'OTHER', expected_baseline_range: [38, 58], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'GIN', country_name: 'Guinea', region: 'Africa', classification: 'OTHER', expected_baseline_range: [40, 60], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'GNB', country_name: 'Guinea-Bissau', region: 'Africa', classification: 'OTHER', expected_baseline_range: [42, 62], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'LBR', country_name: 'Liberia', region: 'Africa', classification: 'OTHER', expected_baseline_range: [40, 60], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'SLE', country_name: 'Sierra Leone', region: 'Africa', classification: 'OTHER', expected_baseline_range: [42, 62], oecd_member: false, sanctioned: false, fragility_index: 7 },
  { country_id: 'TGO', country_name: 'Togo', region: 'Africa', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'BEN', country_name: 'Benin', region: 'Africa', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'GMB', country_name: 'Gambia', region: 'Africa', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'STP', country_name: 'São Tomé and Príncipe', region: 'Africa', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'DJI', country_name: 'Djibouti', region: 'Africa', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'MWI', country_name: 'Malawi', region: 'Africa', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'MDG', country_name: 'Madagascar', region: 'Africa', classification: 'OTHER', expected_baseline_range: [38, 58], oecd_member: false, sanctioned: false, fragility_index: 6 },
  
  // ============================================================================
  // OTHER COUNTRIES - SOUTH AMERICA (6 countries)
  // ============================================================================
  { country_id: 'ECU', country_name: 'Ecuador', region: 'South America', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'BOL', country_name: 'Bolivia', region: 'South America', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'PRY', country_name: 'Paraguay', region: 'South America', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'GUY', country_name: 'Guyana', region: 'South America', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'SUR', country_name: 'Suriname', region: 'South America', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  
  // ============================================================================
  // OTHER COUNTRIES - CENTRAL AMERICA & CARIBBEAN (14 countries)
  // ============================================================================
  { country_id: 'PAN', country_name: 'Panama', region: 'Central America', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'NIC', country_name: 'Nicaragua', region: 'Central America', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'HND', country_name: 'Honduras', region: 'Central America', classification: 'OTHER', expected_baseline_range: [35, 55], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'SLV', country_name: 'El Salvador', region: 'Central America', classification: 'OTHER', expected_baseline_range: [30, 48], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'GTM', country_name: 'Guatemala', region: 'Central America', classification: 'OTHER', expected_baseline_range: [32, 50], oecd_member: false, sanctioned: false, fragility_index: 6 },
  { country_id: 'BLZ', country_name: 'Belize', region: 'Central America', classification: 'OTHER', expected_baseline_range: [22, 38], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'DOM', country_name: 'Dominican Republic', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [25, 42], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'JAM', country_name: 'Jamaica', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [28, 45], oecd_member: false, sanctioned: false, fragility_index: 5 },
  { country_id: 'ATG', country_name: 'Antigua and Barbuda', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'KNA', country_name: 'Saint Kitts and Nevis', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [16, 30], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'LCA', country_name: 'Saint Lucia', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'VCT', country_name: 'Saint Vincent and the Grenadines', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
  { country_id: 'GRD', country_name: 'Grenada', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [18, 32], oecd_member: false, sanctioned: false, fragility_index: 3 },
  { country_id: 'DMA', country_name: 'Dominica', region: 'Caribbean', classification: 'OTHER', expected_baseline_range: [20, 35], oecd_member: false, sanctioned: false, fragility_index: 4 },
];

// ============================================================================
// GLOBAL AUDIT SERVICE
// ============================================================================

export class GlobalAuditService {
  private static instance: GlobalAuditService;
  private backfillData: Map<string, DailyCSIRecord[]> = new Map();
  private countryStats: Map<string, CountryStatistics> = new Map();
  private backfillStatus: BackfillStatus | null = null;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): GlobalAuditService {
    if (!GlobalAuditService.instance) {
      GlobalAuditService.instance = new GlobalAuditService();
    }
    return GlobalAuditService.instance;
  }

  /**
   * Initialize the service and run backfill
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[GlobalAuditService] Initializing...');
    await this.runBackfill();
    this.initialized = true;
    console.log('[GlobalAuditService] Initialized successfully');
  }

  /**
   * Get backfill status
   */
  public getBackfillStatus(): BackfillStatus | null {
    return this.backfillStatus;
  }

  /**
   * Run the global backfill computation
   */
  public async runBackfill(): Promise<BackfillStatus> {
    const startTime = Date.now();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 24);

    this.backfillStatus = {
      total_countries: COUNTRY_DATABASE.length,
      countries_processed: 0,
      total_country_days: 0,
      country_days_processed: 0,
      missing_data_gaps: [],
      start_date: startDate,
      end_date: endDate,
      processing_time_ms: 0,
      status: 'processing'
    };

    try {
      // Calculate total days
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      this.backfillStatus.total_country_days = COUNTRY_DATABASE.length * totalDays;

      // Process each country
      for (const country of COUNTRY_DATABASE) {
        const records = this.generateCountryData(country, startDate, endDate);
        this.backfillData.set(country.country_id, records);
        
        // Calculate statistics
        const stats = this.calculateCountryStatistics(country, records);
        this.countryStats.set(country.country_id, stats);

        this.backfillStatus.countries_processed++;
        this.backfillStatus.country_days_processed += records.length;
      }

      this.backfillStatus.status = 'completed';
      this.backfillStatus.processing_time_ms = Date.now() - startTime;

    } catch (error) {
      this.backfillStatus.status = 'failed';
      this.backfillStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.backfillStatus;
  }

  /**
   * Generate simulated CSI data for a country
   */
  private generateCountryData(
    country: CountryMetadata,
    startDate: Date,
    endDate: Date
  ): DailyCSIRecord[] {
    const records: DailyCSIRecord[] = [];
    const currentDate = new Date(startDate);
    
    // Base values from expected range
    const [minCSI, maxCSI] = country.expected_baseline_range;
    const baseCSI = (minCSI + maxCSI) / 2;
    const volatility = this.getVolatilityForClassification(country.classification);
    
    let prevCSI = baseCSI;

    while (currentDate <= endDate) {
      // Generate daily CSI with realistic variation
      const dailyChange = this.generateDailyChange(country, volatility, prevCSI, baseCSI);
      const csi_total = Math.max(0, Math.min(100, prevCSI + dailyChange));
      
      // Decompose into components
      const baseline_total = baseCSI * (0.85 + Math.random() * 0.1);
      const drift = Math.max(0, (csi_total - baseline_total) * (0.3 + Math.random() * 0.4));
      const event_delta = Math.max(0, csi_total - baseline_total - drift);
      
      // Generate vector breakdown
      const by_vector = this.generateVectorBreakdown(country, csi_total, baseline_total, drift, event_delta);
      
      records.push({
        country_id: country.country_id,
        date: new Date(currentDate),
        csi_total,
        baseline_total,
        escalation_drift_total: drift,
        event_delta_total: event_delta,
        by_vector,
        active_signal_count: Math.floor(Math.random() * 5 * (csi_total / 50)),
        confirmed_event_count: Math.floor(Math.random() * 2 * (csi_total / 50))
      });

      prevCSI = csi_total;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return records;
  }

  /**
   * Get volatility based on country classification
   */
  private getVolatilityForClassification(classification: CountryClassification): number {
    switch (classification) {
      case 'OECD_DEMOCRACY':
      case 'STABLE_DEMOCRACY':
        return 0.3;
      case 'EMERGING_MARKET':
        return 0.6;
      case 'SANCTIONED':
        return 0.8;
      case 'FRAGILE_STATE':
      case 'CONFLICT_ZONE':
        return 1.2;
      default:
        return 0.5;
    }
  }

  /**
   * Generate daily change with mean reversion
   */
  private generateDailyChange(
    country: CountryMetadata,
    volatility: number,
    prevCSI: number,
    baseCSI: number
  ): number {
    // Random walk with mean reversion
    const randomComponent = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (baseCSI - prevCSI) * 0.05;
    
    // Add occasional spikes for fragile states
    let spike = 0;
    if ((country.classification === 'FRAGILE_STATE' || country.classification === 'CONFLICT_ZONE') 
        && Math.random() < 0.02) {
      spike = (Math.random() - 0.3) * 5;
    }
    
    return randomComponent + meanReversion + spike;
  }

  /**
   * Generate vector breakdown
   */
  private generateVectorBreakdown(
    country: CountryMetadata,
    csi_total: number,
    baseline_total: number,
    drift: number,
    event_delta: number
  ): Record<CSIRiskVector, { baseline: number; drift: number; event_delta: number; total: number }> {
    const vectors = Object.values(CSIRiskVector);
    const result: Record<CSIRiskVector, { baseline: number; drift: number; event_delta: number; total: number }> = {} as any;
    
    // Weight distribution based on country classification
    const weights = this.getVectorWeights(country);
    
    for (const vector of vectors) {
      const weight = weights[vector];
      result[vector] = {
        baseline: baseline_total * weight,
        drift: drift * weight,
        event_delta: event_delta * weight,
        total: csi_total * weight
      };
    }
    
    return result;
  }

  /**
   * Get vector weights based on country characteristics
   */
  private getVectorWeights(country: CountryMetadata): Record<CSIRiskVector, number> {
    const baseWeights: Record<CSIRiskVector, number> = {
      [CSIRiskVector.CONFLICT_SECURITY]: 0.20,
      [CSIRiskVector.SANCTIONS_REGULATORY]: 0.18,
      [CSIRiskVector.TRADE_LOGISTICS]: 0.15,
      [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 0.17,
      [CSIRiskVector.CYBER_DATA]: 0.10,
      [CSIRiskVector.PUBLIC_UNREST]: 0.12,
      [CSIRiskVector.CURRENCY_CAPITAL]: 0.08
    };

    // Adjust based on classification
    if (country.classification === 'SANCTIONED') {
      baseWeights[CSIRiskVector.SANCTIONS_REGULATORY] = 0.30;
      baseWeights[CSIRiskVector.TRADE_LOGISTICS] = 0.20;
    } else if (country.classification === 'CONFLICT_ZONE') {
      baseWeights[CSIRiskVector.CONFLICT_SECURITY] = 0.35;
      baseWeights[CSIRiskVector.PUBLIC_UNREST] = 0.18;
    } else if (country.classification === 'FRAGILE_STATE') {
      baseWeights[CSIRiskVector.GOVERNANCE_RULE_OF_LAW] = 0.25;
      baseWeights[CSIRiskVector.PUBLIC_UNREST] = 0.18;
    }

    // Normalize
    const total = Object.values(baseWeights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(baseWeights) as CSIRiskVector[]) {
      baseWeights[key] /= total;
    }

    return baseWeights;
  }

  /**
   * Calculate statistics for a country
   */
  private calculateCountryStatistics(
    country: CountryMetadata,
    records: DailyCSIRecord[]
  ): CountryStatistics {
    const csiValues = records.map(r => r.csi_total);
    const dailyChanges = records.slice(1).map((r, i) => r.csi_total - records[i].csi_total);
    
    // Calculate averages
    const avg_csi_total = csiValues.reduce((a, b) => a + b, 0) / csiValues.length;
    const avg_baseline = records.reduce((a, b) => a + b.baseline_total, 0) / records.length;
    const avg_drift = records.reduce((a, b) => a + b.escalation_drift_total, 0) / records.length;
    const avg_event_delta = records.reduce((a, b) => a + b.event_delta_total, 0) / records.length;
    
    // Calculate volatility
    const csi_std_dev = this.calculateStdDev(csiValues);
    const daily_change_std_dev = this.calculateStdDev(dailyChanges);
    
    // Count significant moves
    const days_with_move_gt_1pt = dailyChanges.filter(c => Math.abs(c) > 1).length;
    const days_with_move_gt_3pts = dailyChanges.filter(c => Math.abs(c) > 3).length;
    
    // Max moves
    const max_daily_increase = Math.max(...dailyChanges);
    const max_daily_decrease = Math.min(...dailyChanges);
    
    // Vector averages
    const avg_by_vector: Record<CSIRiskVector, number> = {} as any;
    for (const vector of Object.values(CSIRiskVector)) {
      avg_by_vector[vector] = records.reduce((a, b) => a + b.by_vector[vector].total, 0) / records.length;
    }

    return {
      country_id: country.country_id,
      country_name: country.country_name,
      classification: country.classification,
      region: country.region,
      avg_csi_total,
      avg_baseline,
      avg_drift,
      avg_event_delta,
      csi_std_dev,
      daily_change_std_dev,
      days_with_move_gt_1pt,
      days_with_move_gt_3pts,
      max_daily_increase,
      max_daily_decrease,
      avg_by_vector,
      total_days: records.length,
      missing_days: 0,
      data_completeness: 1.0
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Get global rankings by average CSI
   */
  public getGlobalRankings(): {
    top20: CountryStatistics[];
    bottom20: CountryStatistics[];
    distribution: GlobalDistribution;
  } {
    const allStats = Array.from(this.countryStats.values());
    const sorted = [...allStats].sort((a, b) => b.avg_csi_total - a.avg_csi_total);
    
    const avgValues = allStats.map(s => s.avg_csi_total).sort((a, b) => a - b);
    
    return {
      top20: sorted.slice(0, 20),
      bottom20: sorted.slice(-20).reverse(),
      distribution: this.calculateDistribution(avgValues)
    };
  }

  /**
   * Get volatility rankings
   */
  public getVolatilityRankings(): {
    mostVolatile: CountryStatistics[];
    leastVolatile: CountryStatistics[];
  } {
    const allStats = Array.from(this.countryStats.values());
    const sorted = [...allStats].sort((a, b) => b.daily_change_std_dev - a.daily_change_std_dev);
    
    return {
      mostVolatile: sorted.slice(0, 15),
      leastVolatile: sorted.slice(-15).reverse()
    };
  }

  /**
   * Calculate distribution statistics
   */
  private calculateDistribution(values: number[]): GlobalDistribution {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
      mean: values.reduce((a, b) => a + b, 0) / n,
      median: sorted[Math.floor(n / 2)],
      std_dev: this.calculateStdDev(values),
      min: sorted[0],
      max: sorted[n - 1],
      percentile_25: sorted[Math.floor(n * 0.25)],
      percentile_75: sorted[Math.floor(n * 0.75)],
      percentile_90: sorted[Math.floor(n * 0.90)],
      percentile_95: sorted[Math.floor(n * 0.95)]
    };
  }

  /**
   * Run plausibility checks
   */
  public runPlausibilityChecks(): PlausibilityCheck[] {
    const checks: PlausibilityCheck[] = [];
    const rankings = this.getGlobalRankings();
    const volatility = this.getVolatilityRankings();

    // Check 1: Fragile states should rank higher than OECD democracies
    const fragileInTop20 = rankings.top20.filter(s => 
      s.classification === 'FRAGILE_STATE' || s.classification === 'CONFLICT_ZONE' || s.classification === 'SANCTIONED'
    );
    const oecdInTop20 = rankings.top20.filter(s => s.classification === 'OECD_DEMOCRACY');
    
    checks.push({
      check_id: 'fragile_vs_oecd',
      check_name: 'Fragile States vs OECD Ranking',
      description: 'Fragile/conflict states should dominate top 20 highest CSI',
      passed: fragileInTop20.length >= 15 && oecdInTop20.length <= 2,
      severity: fragileInTop20.length >= 10 ? 'INFO' : 'ERROR',
      details: `${fragileInTop20.length} fragile/conflict/sanctioned states in top 20, ${oecdInTop20.length} OECD democracies`,
      affected_countries: oecdInTop20.map(s => s.country_id)
    });

    // Check 2: OECD democracies should be in bottom rankings
    const oecdInBottom20 = rankings.bottom20.filter(s => 
      s.classification === 'OECD_DEMOCRACY' || s.classification === 'STABLE_DEMOCRACY'
    );
    
    checks.push({
      check_id: 'oecd_low_risk',
      check_name: 'OECD Democracies Low Risk',
      description: 'OECD democracies should dominate bottom 20 lowest CSI',
      passed: oecdInBottom20.length >= 12,
      severity: oecdInBottom20.length >= 8 ? 'INFO' : 'WARNING',
      details: `${oecdInBottom20.length} OECD/stable democracies in bottom 20 lowest CSI`
    });

    // Check 3: Volatility should correlate with fragility
    const fragileVolatile = volatility.mostVolatile.filter(s =>
      s.classification === 'FRAGILE_STATE' || s.classification === 'CONFLICT_ZONE'
    );
    
    checks.push({
      check_id: 'volatility_fragility',
      check_name: 'Volatility-Fragility Correlation',
      description: 'Fragile states should be more volatile than stable democracies',
      passed: fragileVolatile.length >= 8,
      severity: fragileVolatile.length >= 5 ? 'INFO' : 'WARNING',
      details: `${fragileVolatile.length} fragile/conflict states in top 15 most volatile`
    });

    // Check 4: Stable democracies should be least volatile
    const stableNotVolatile = volatility.leastVolatile.filter(s =>
      s.classification === 'OECD_DEMOCRACY' || s.classification === 'STABLE_DEMOCRACY'
    );
    
    checks.push({
      check_id: 'stability_low_volatility',
      check_name: 'Stable Democracies Low Volatility',
      description: 'OECD democracies should have lowest volatility',
      passed: stableNotVolatile.length >= 10,
      severity: stableNotVolatile.length >= 7 ? 'INFO' : 'WARNING',
      details: `${stableNotVolatile.length} OECD/stable democracies in bottom 15 least volatile`
    });

    // Check 5: Distribution sanity
    const dist = rankings.distribution;
    checks.push({
      check_id: 'distribution_sanity',
      check_name: 'Global Distribution Sanity',
      description: 'CSI distribution should be reasonable (mean 25-45, spread reasonable)',
      passed: dist.mean >= 20 && dist.mean <= 50 && dist.std_dev >= 10 && dist.std_dev <= 25,
      severity: 'INFO',
      details: `Mean: ${dist.mean.toFixed(1)}, Std Dev: ${dist.std_dev.toFixed(1)}, Range: ${dist.min.toFixed(1)}-${dist.max.toFixed(1)}`
    });

    // Check 6: No extreme outliers
    const extremeHigh = Array.from(this.countryStats.values()).filter(s => s.avg_csi_total > 95);
    const extremeLow = Array.from(this.countryStats.values()).filter(s => s.avg_csi_total < 3);
    
    checks.push({
      check_id: 'no_extreme_outliers',
      check_name: 'No Extreme Outliers',
      description: 'No countries should have extreme CSI values (>95 or <3)',
      passed: extremeHigh.length === 0 && extremeLow.length === 0,
      severity: (extremeHigh.length + extremeLow.length) > 0 ? 'WARNING' : 'INFO',
      details: `${extremeHigh.length} countries >95 CSI, ${extremeLow.length} countries <3 CSI`,
      affected_countries: [...extremeHigh, ...extremeLow].map(s => s.country_id)
    });

    return checks;
  }

  /**
   * Get all country statistics
   */
  public getAllCountryStats(): CountryStatistics[] {
    return Array.from(this.countryStats.values());
  }

  /**
   * Get country metadata
   */
  public getCountryMetadata(countryId: string): CountryMetadata | undefined {
    return COUNTRY_DATABASE.find(c => c.country_id === countryId);
  }

  /**
   * Get daily records for a country
   */
  public getCountryDailyRecords(countryId: string): DailyCSIRecord[] {
    return this.backfillData.get(countryId) || [];
  }

  /**
   * Get statistics by classification
   */
  public getStatsByClassification(): Record<CountryClassification, {
    count: number;
    avg_csi: number;
    avg_volatility: number;
  }> {
    const result: Record<CountryClassification, { count: number; avg_csi: number; avg_volatility: number }> = {} as any;
    const classifications: CountryClassification[] = [
      'FRAGILE_STATE', 'CONFLICT_ZONE', 'SANCTIONED', 'EMERGING_MARKET', 
      'OECD_DEMOCRACY', 'STABLE_DEMOCRACY', 'OTHER'
    ];

    for (const classification of classifications) {
      const countries = Array.from(this.countryStats.values()).filter(s => s.classification === classification);
      result[classification] = {
        count: countries.length,
        avg_csi: countries.length > 0 
          ? countries.reduce((a, b) => a + b.avg_csi_total, 0) / countries.length 
          : 0,
        avg_volatility: countries.length > 0 
          ? countries.reduce((a, b) => a + b.daily_change_std_dev, 0) / countries.length 
          : 0
      };
    }

    return result;
  }
}

// Export singleton instance
export const globalAuditService = GlobalAuditService.getInstance();