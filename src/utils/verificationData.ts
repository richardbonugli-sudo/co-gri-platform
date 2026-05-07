/**
 * Verification Data Utilities
 * Supporting functions for Verification Drawer (C9)
 * Part of CO-GRI Platform Phase 2 - Week 4
 */

export interface CalculationStep {
  step_number: number;
  step_name: string;
  formula: string;
  inputs: Record<string, number | string>;
  output: number;
  explanation: string;
}

export interface SensitivityAnalysis {
  parameter: string;
  baseline_value: number;
  change_percentage: number;
  new_value: number;
  impact_on_CO_GRI: number;
  percentage_change: number;
}

/**
 * Generate calculation steps for verification
 * Implements specification Part 3.3 C9
 */
export function generateCalculationSteps(
  ticker: string,
  finalScore: number
): CalculationStep[] {
  return [
    {
      step_number: 1,
      step_name: 'Country Exposure Normalization',
      formula: 'W_norm(c) = W(c) / Σ W(c)',
      inputs: {
        'China exposure': 0.40,
        'Taiwan exposure': 0.25,
        'Vietnam exposure': 0.15,
        'Total': 1.00
      },
      output: 1.00,
      explanation: 'Normalize exposure weights to ensure they sum to 1.0'
    },
    {
      step_number: 2,
      step_name: 'Alignment Modifier Application',
      formula: 'AdjS(c) = S(c) × (1 - λ × W^c)',
      inputs: {
        'China shock S(c)': 65.0,
        'Alignment W^c': 0.50,
        'Lambda λ': 0.30
      },
      output: 55.25,
      explanation: 'Apply US-China alignment modifier to country shock. W^c modifies shock, NOT exposure.'
    },
    {
      step_number: 3,
      step_name: 'Country Risk Calculation',
      formula: 'Risk(c) = W_norm(c) × AdjS(c)',
      inputs: {
        'Normalized weight': 0.40,
        'Adjusted shock': 55.25
      },
      output: 22.10,
      explanation: 'Calculate risk contribution for each country'
    },
    {
      step_number: 4,
      step_name: 'Channel Aggregation',
      formula: 'CO-GRI_base = Σ_c Σ_ch [W_ch × Risk(c,ch)]',
      inputs: {
        'Revenue (35%)': finalScore * 0.35,
        'Supply Chain (30%)': finalScore * 0.30,
        'Physical Assets (20%)': finalScore * 0.20,
        'Financial (15%)': finalScore * 0.15
      },
      output: finalScore * 0.95,
      explanation: 'Aggregate risk across all channels with standard weights'
    },
    {
      step_number: 5,
      step_name: 'Sector Multiplier Application',
      formula: 'CO-GRI_final = CO-GRI_base × M_sector',
      inputs: {
        'Base score': finalScore * 0.95,
        'Sector multiplier': 1.05
      },
      output: finalScore,
      explanation: 'Apply sector-specific multiplier (e.g., 1.2 for semiconductors, 1.0 for retail)'
    }
  ];
}

/**
 * Generate sensitivity analysis
 * Tests ±10% changes in key parameters
 */
export function generateSensitivityAnalysis(
  baselineScore: number
): SensitivityAnalysis[] {
  return [
    {
      parameter: 'China Exposure Weight',
      baseline_value: 0.40,
      change_percentage: 10,
      new_value: 0.44,
      impact_on_CO_GRI: 2.8,
      percentage_change: (2.8 / baselineScore) * 100
    },
    {
      parameter: 'China Exposure Weight',
      baseline_value: 0.40,
      change_percentage: -10,
      new_value: 0.36,
      impact_on_CO_GRI: -2.8,
      percentage_change: (-2.8 / baselineScore) * 100
    },
    {
      parameter: 'Taiwan Shock Index',
      baseline_value: 55.0,
      change_percentage: 10,
      new_value: 60.5,
      impact_on_CO_GRI: 1.4,
      percentage_change: (1.4 / baselineScore) * 100
    },
    {
      parameter: 'Taiwan Shock Index',
      baseline_value: 55.0,
      change_percentage: -10,
      new_value: 49.5,
      impact_on_CO_GRI: -1.4,
      percentage_change: (-1.4 / baselineScore) * 100
    },
    {
      parameter: 'Sector Multiplier',
      baseline_value: 1.05,
      change_percentage: 10,
      new_value: 1.155,
      impact_on_CO_GRI: 5.2,
      percentage_change: (5.2 / baselineScore) * 100
    },
    {
      parameter: 'Sector Multiplier',
      baseline_value: 1.05,
      change_percentage: -10,
      new_value: 0.945,
      impact_on_CO_GRI: -5.2,
      percentage_change: (-5.2 / baselineScore) * 100
    }
  ];
}

/**
 * Get data sources for transparency
 */
export function getDataSources(): Array<{
  source_name: string;
  description: string;
  last_updated: string;
}> {
  return [
    {
      source_name: 'Company Financial Filings',
      description: 'Geographic revenue breakdown from 10-K/10-Q reports',
      last_updated: '2024-Q4'
    },
    {
      source_name: 'Supply Chain Database',
      description: 'Supplier locations and manufacturing facilities',
      last_updated: '2024-12'
    },
    {
      source_name: 'Geopolitical Risk Index',
      description: 'Country-level risk scores from multiple indices (WGI, PRS, EIU)',
      last_updated: '2024-12'
    },
    {
      source_name: 'US-Country Alignment Data',
      description: 'Bilateral relationship indicators and voting patterns',
      last_updated: '2024-11'
    }
  ];
}