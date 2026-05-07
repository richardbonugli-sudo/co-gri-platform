/**
 * Mock Scenario Data Generator
 * Generates preset scenarios and mock scenario results
 * Part of CO-GRI Platform Phase 3 - Week 9-10
 */

import {
  Scenario,
  ScenarioType,
  PresetScenario,
  ScenarioResult,
  GlobalImpact,
  RegionalImpact,
  SectorImpact,
  CompanyImpact,
  TransmissionGraph,
  TransmissionNode,
  TransmissionEdge,
  ImpactLevel
} from '@/types/scenario';

/**
 * Generate preset scenarios
 */
export function generatePresetScenarios(): PresetScenario[] {
  return [
    {
      scenario_id: 'PRESET_001',
      name: 'US-China Tech Decoupling',
      type: 'Geopolitical',
      description: 'Escalating technology restrictions and supply chain decoupling between US and China, affecting semiconductor and AI industries.',
      initial_shock: {
        affected_countries: ['China', 'Taiwan', 'S. Korea', 'Japan', 'Vietnam'],
        shock_intensity: 75,
        channel_distribution: {
          revenue: 25,
          supply_chain: 50,
          physical_assets: 15,
          financial: 10
        },
        duration_months: 12,
        description: 'Major semiconductor supply chain disruption'
      },
      propagation_settings: {
        propagation_depth: 4,
        amplification_factor: 1.3,
        sector_filters: [],
        company_filters: {
          threshold_delta_CO_GRI: 2.0
        },
        transmission_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
        advanced_options: {
          enable_second_order_effects: true,
          enable_feedback_loops: true,
          time_decay_enabled: false
        }
      }
    },
    {
      scenario_id: 'PRESET_002',
      name: 'Middle East Oil Crisis',
      type: 'Economic',
      description: 'Major disruption to oil supply from Middle East due to regional conflicts, causing global energy price spike.',
      initial_shock: {
        affected_countries: ['Saudi Arabia', 'Iran', 'UAE', 'Iraq', 'Kuwait'],
        shock_intensity: 60,
        channel_distribution: {
          revenue: 40,
          supply_chain: 35,
          physical_assets: 15,
          financial: 10
        },
        duration_months: 6,
        description: 'Oil supply disruption and price volatility'
      },
      propagation_settings: {
        propagation_depth: 3,
        amplification_factor: 1.5,
        sector_filters: [],
        company_filters: {
          threshold_delta_CO_GRI: 1.5
        },
        transmission_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
        advanced_options: {
          enable_second_order_effects: true,
          enable_feedback_loops: false,
          time_decay_enabled: true,
          time_decay_rate: 0.2
        }
      }
    },
    {
      scenario_id: 'PRESET_003',
      name: 'European Energy Crisis',
      type: 'Economic',
      description: 'Severe energy supply constraints in Europe affecting industrial production and economic growth.',
      initial_shock: {
        affected_countries: ['Germany', 'France', 'Italy', 'Poland', 'Netherlands'],
        shock_intensity: 50,
        channel_distribution: {
          revenue: 30,
          supply_chain: 40,
          physical_assets: 20,
          financial: 10
        },
        duration_months: 12,
        description: 'Energy supply constraints and high costs'
      },
      propagation_settings: {
        propagation_depth: 3,
        amplification_factor: 1.2,
        sector_filters: ['Energy', 'Industrials', 'Materials'],
        company_filters: {
          threshold_delta_CO_GRI: 1.0
        },
        transmission_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
        advanced_options: {
          enable_second_order_effects: true,
          enable_feedback_loops: true,
          time_decay_enabled: false
        }
      }
    },
    {
      scenario_id: 'PRESET_004',
      name: 'Global Pandemic Outbreak',
      type: 'Pandemic',
      description: 'Rapid spread of a new pandemic causing widespread lockdowns and supply chain disruptions.',
      initial_shock: {
        affected_countries: ['China', 'United States', 'India', 'Brazil', 'UK', 'Germany', 'France', 'Italy', 'Japan', 'S. Korea'],
        shock_intensity: 85,
        channel_distribution: {
          revenue: 35,
          supply_chain: 40,
          physical_assets: 15,
          financial: 10
        },
        duration_months: 6,
        description: 'Global pandemic with widespread lockdowns'
      },
      propagation_settings: {
        propagation_depth: 5,
        amplification_factor: 1.8,
        sector_filters: [],
        company_filters: {
          threshold_delta_CO_GRI: 3.0
        },
        transmission_channels: ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'],
        advanced_options: {
          enable_second_order_effects: true,
          enable_feedback_loops: true,
          time_decay_enabled: true,
          time_decay_rate: 0.15
        }
      }
    },
    {
      scenario_id: 'PRESET_005',
      name: 'Climate Disaster - Asia Pacific',
      type: 'Climate',
      description: 'Severe climate events (typhoons, floods) disrupting manufacturing and logistics in Asia Pacific.',
      initial_shock: {
        affected_countries: ['China', 'Taiwan', 'Vietnam', 'Thailand', 'Philippines', 'Indonesia'],
        shock_intensity: 55,
        channel_distribution: {
          revenue: 20,
          supply_chain: 45,
          physical_assets: 30,
          financial: 5
        },
        duration_months: 3,
        description: 'Climate-related manufacturing and logistics disruption'
      },
      propagation_settings: {
        propagation_depth: 3,
        amplification_factor: 1.1,
        sector_filters: ['Technology', 'Industrials', 'Consumer Discretionary'],
        company_filters: {
          threshold_delta_CO_GRI: 1.5
        },
        transmission_channels: ['Supply Chain', 'Physical Assets', 'Revenue'],
        advanced_options: {
          enable_second_order_effects: true,
          enable_feedback_loops: false,
          time_decay_enabled: true,
          time_decay_rate: 0.3
        }
      }
    }
  ];
}

/**
 * Convert preset scenario to full scenario
 */
export function presetToScenario(preset: PresetScenario): Scenario {
  return {
    scenario_id: preset.scenario_id,
    scenario_name: preset.name,
    scenario_type: preset.type,
    description: preset.description,
    initial_shock: preset.initial_shock,
    propagation_settings: preset.propagation_settings,
    created_at: new Date(),
    last_modified: new Date(),
    is_preset: true
  };
}

/**
 * Generate mock scenario result
 */
export function generateMockScenarioResult(scenario: Scenario): ScenarioResult {
  // Generate mock company impacts
  const companyImpacts: CompanyImpact[] = [
    {
      ticker: 'AAPL',
      company_name: 'Apple Inc.',
      sector: 'Technology',
      baseline_CO_GRI: 52.3,
      scenario_delta_CO_GRI: 8.5,
      new_CO_GRI: 60.8,
      impact_level: 'High',
      transmission_path_length: 2,
      transmission_path: ['China', 'Technology Sector', 'Apple Inc.'],
      channel_breakdown: {
        revenue: 2.1,
        supply_chain: 4.8,
        physical_assets: 1.2,
        financial: 0.4
      },
      recovery_time_estimate_months: 9
    },
    {
      ticker: 'NVDA',
      company_name: 'NVIDIA Corporation',
      sector: 'Technology',
      baseline_CO_GRI: 47.1,
      scenario_delta_CO_GRI: 12.3,
      new_CO_GRI: 59.4,
      impact_level: 'Critical',
      transmission_path_length: 2,
      transmission_path: ['Taiwan', 'Technology Sector', 'NVIDIA Corporation'],
      channel_breakdown: {
        revenue: 3.2,
        supply_chain: 6.5,
        physical_assets: 2.1,
        financial: 0.5
      },
      recovery_time_estimate_months: 12
    },
    {
      ticker: 'TSLA',
      company_name: 'Tesla Inc.',
      sector: 'Consumer Discretionary',
      baseline_CO_GRI: 48.7,
      scenario_delta_CO_GRI: 6.2,
      new_CO_GRI: 54.9,
      impact_level: 'Medium',
      transmission_path_length: 3,
      transmission_path: ['China', 'Automotive Sector', 'Supply Chain', 'Tesla Inc.'],
      channel_breakdown: {
        revenue: 1.8,
        supply_chain: 3.2,
        physical_assets: 0.9,
        financial: 0.3
      },
      recovery_time_estimate_months: 6
    },
    {
      ticker: 'INTC',
      company_name: 'Intel Corporation',
      sector: 'Technology',
      baseline_CO_GRI: 44.2,
      scenario_delta_CO_GRI: 7.8,
      new_CO_GRI: 52.0,
      impact_level: 'High',
      transmission_path_length: 2,
      transmission_path: ['Taiwan', 'Technology Sector', 'Intel Corporation'],
      channel_breakdown: {
        revenue: 2.3,
        supply_chain: 4.1,
        physical_assets: 1.1,
        financial: 0.3
      },
      recovery_time_estimate_months: 10
    },
    {
      ticker: 'MSFT',
      company_name: 'Microsoft Corporation',
      sector: 'Technology',
      baseline_CO_GRI: 38.5,
      scenario_delta_CO_GRI: 4.2,
      new_CO_GRI: 42.7,
      impact_level: 'Medium',
      transmission_path_length: 3,
      transmission_path: ['China', 'Technology Sector', 'Cloud Services', 'Microsoft Corporation'],
      channel_breakdown: {
        revenue: 1.2,
        supply_chain: 2.1,
        physical_assets: 0.6,
        financial: 0.3
      },
      recovery_time_estimate_months: 5
    }
  ];

  // Generate global impact
  const globalImpact: GlobalImpact = {
    total_countries_affected: scenario.initial_shock.affected_countries.length + 15,
    total_companies_affected: companyImpacts.length,
    average_delta_CO_GRI: companyImpacts.reduce((sum, c) => sum + c.scenario_delta_CO_GRI, 0) / companyImpacts.length,
    max_delta_CO_GRI: Math.max(...companyImpacts.map(c => c.scenario_delta_CO_GRI)),
    min_delta_CO_GRI: Math.min(...companyImpacts.map(c => c.scenario_delta_CO_GRI)),
    total_economic_impact_estimate: 250.5
  };

  // Generate regional impacts
  const regionalImpacts: RegionalImpact[] = [
    {
      region: 'East Asia',
      countries_affected: ['China', 'Taiwan', 'S. Korea', 'Japan'],
      average_delta_CO_GRI: 9.2,
      companies_affected: 3,
      primary_transmission_channels: ['Supply Chain', 'Revenue']
    },
    {
      region: 'North America',
      countries_affected: ['United States', 'Canada', 'Mexico'],
      average_delta_CO_GRI: 5.8,
      companies_affected: 2,
      primary_transmission_channels: ['Revenue', 'Supply Chain']
    }
  ];

  // Generate sector impacts
  const sectorImpacts: SectorImpact[] = [
    {
      sector: 'Technology',
      average_delta_CO_GRI: 8.2,
      companies_affected: 4,
      most_affected_companies: ['NVDA', 'AAPL', 'INTC', 'MSFT'],
      primary_transmission_channels: ['Supply Chain', 'Revenue']
    },
    {
      sector: 'Consumer Discretionary',
      average_delta_CO_GRI: 6.2,
      companies_affected: 1,
      most_affected_companies: ['TSLA'],
      primary_transmission_channels: ['Supply Chain', 'Revenue']
    }
  ];

  // Generate transmission graph
  const transmissionGraph: TransmissionGraph = generateMockTransmissionGraph(scenario, companyImpacts);

  return {
    scenario,
    execution_time_ms: 2500,
    global_impact: globalImpact,
    regional_impacts: regionalImpacts,
    sector_impacts: sectorImpacts,
    company_impacts: companyImpacts,
    transmission_graph: transmissionGraph,
    generated_at: new Date()
  };
}

/**
 * Generate mock transmission graph
 */
function generateMockTransmissionGraph(scenario: Scenario, companyImpacts: CompanyImpact[]): TransmissionGraph {
  const nodes: TransmissionNode[] = [];
  const edges: TransmissionEdge[] = [];

  // Layer 0: Initial shock countries
  scenario.initial_shock.affected_countries.forEach((country, idx) => {
    nodes.push({
      node_id: `country_${country}`,
      node_type: 'Country',
      node_layer: 0,
      label: country,
      shock_intensity: scenario.initial_shock.shock_intensity,
      is_initial_shock: true,
      is_amplified: false,
      metadata: { country }
    });
  });

  // Layer 1: Affected sectors
  const sectors = ['Technology', 'Consumer Discretionary'];
  sectors.forEach((sector, idx) => {
    const sectorShock = scenario.initial_shock.shock_intensity * 0.8;
    nodes.push({
      node_id: `sector_${sector}`,
      node_type: 'Sector',
      node_layer: 1,
      label: sector,
      shock_intensity: sectorShock,
      is_initial_shock: false,
      is_amplified: false,
      metadata: { sector }
    });

    // Connect to initial countries
    scenario.initial_shock.affected_countries.slice(0, 2).forEach(country => {
      edges.push({
        source_node_id: `country_${country}`,
        target_node_id: `sector_${sector}`,
        transmission_intensity: sectorShock,
        transmission_channel: 'Supply Chain',
        attenuation_factor: 0.8
      });
    });
  });

  // Layer 2: Companies
  companyImpacts.forEach(company => {
    nodes.push({
      node_id: `company_${company.ticker}`,
      node_type: 'Company',
      node_layer: 2,
      label: company.company_name,
      shock_intensity: company.scenario_delta_CO_GRI,
      is_initial_shock: false,
      is_amplified: company.scenario_delta_CO_GRI > scenario.initial_shock.shock_intensity * 0.5,
      amplification_factor: company.scenario_delta_CO_GRI > scenario.initial_shock.shock_intensity * 0.5 ? 1.2 : undefined,
      metadata: {
        ticker: company.ticker,
        sector: company.sector,
        baseline_CO_GRI: company.baseline_CO_GRI
      }
    });

    // Connect to sector
    edges.push({
      source_node_id: `sector_${company.sector}`,
      target_node_id: `company_${company.ticker}`,
      transmission_intensity: company.scenario_delta_CO_GRI,
      transmission_channel: 'Supply Chain',
      attenuation_factor: 0.7
    });
  });

  return {
    nodes,
    edges,
    max_layer: 2,
    total_nodes: nodes.length,
    total_edges: edges.length
  };
}

/**
 * Determine impact level from delta CO-GRI
 */
export function getImpactLevel(deltaCOGRI: number): ImpactLevel {
  const absDelta = Math.abs(deltaCOGRI);
  if (absDelta >= 10) return 'Critical';
  if (absDelta >= 7) return 'High';
  if (absDelta >= 4) return 'Medium';
  if (absDelta >= 2) return 'Low';
  return 'Negligible';
}