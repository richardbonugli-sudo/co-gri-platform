/**
 * Mock Forecast Data Generator
 * Generates sample forecast data for Forecast Mode
 */

import { 
  ForecastEvent, 
  ExecutiveSummary, 
  RegionalAssessment, 
  AssetClassForecast, 
  StrategicRecommendation,
  GlobalRiskTrajectory,
  GeopoliticalTheme,
  RegionalHotspot
} from '@/types/forecast';

export function generateMockForecastEvents(): ForecastEvent[] {
  return [
    {
      event_id: 'evt-001',
      event_name: 'US-China Trade Tensions Escalation',
      description: 'Renewed tariff discussions expected to impact tech and manufacturing sectors',
      event_type: 'Economic',
      probability: 0.65,
      probability_level: 'High',
      timing: 'Q2 2026',
      timing_description: '3-6 months',
      impact_level: 'High',
      expected_delta_CO_GRI: -4.5,
      delta_range: {
        best_case: -2.0,
        base_case: -4.5,
        worst_case: -7.0
      },
      affected_countries: ['United States', 'China', 'Taiwan', 'South Korea'],
      affected_regions: ['North America', 'Asia Pacific'],
      affected_sectors: ['Technology', 'Manufacturing', 'Semiconductors'],
      delta_by_channel: {
        revenue: -2.5,
        supply_chain: -1.5,
        physical_assets: -0.3,
        financial: -0.2
      },
      transmission_path: ['China', 'Taiwan', 'South Korea', 'United States'],
      reasoning: 'Escalating trade tensions could disrupt global supply chains and increase costs for tech companies',
      data_sources: ['Trade Policy Monitor', 'Economic Analysis'],
      confidence: 0.70,
      last_updated: new Date('2024-09-01')
    },
    {
      event_id: 'evt-002',
      event_name: 'European Energy Security Concerns',
      description: 'Ongoing energy supply challenges affecting industrial production',
      event_type: 'Economic',
      probability: 0.55,
      probability_level: 'Medium',
      timing: 'Q3 2026',
      timing_description: '6-12 months',
      impact_level: 'Medium',
      expected_delta_CO_GRI: -3.2,
      delta_range: {
        best_case: -1.5,
        base_case: -3.2,
        worst_case: -5.0
      },
      affected_countries: ['Germany', 'France', 'Italy', 'Poland'],
      affected_regions: ['Europe'],
      affected_sectors: ['Energy', 'Manufacturing', 'Chemicals'],
      delta_by_channel: {
        revenue: -1.5,
        supply_chain: -1.2,
        physical_assets: -0.3,
        financial: -0.2
      },
      transmission_path: ['Russia', 'Germany', 'France', 'Europe'],
      reasoning: 'Energy supply disruptions could increase operational costs and reduce production capacity',
      data_sources: ['Energy Market Analysis', 'Industrial Production Data'],
      confidence: 0.65,
      last_updated: new Date('2024-10-15')
    },
    {
      event_id: 'evt-003',
      event_name: 'Middle East Stability Risks',
      description: 'Regional tensions could impact oil prices and global supply chains',
      event_type: 'Political',
      probability: 0.45,
      probability_level: 'Medium',
      timing: 'Q2 2026',
      timing_description: '1-3 months',
      impact_level: 'High',
      expected_delta_CO_GRI: -5.5,
      delta_range: {
        best_case: -2.5,
        base_case: -5.5,
        worst_case: -9.0
      },
      affected_countries: ['Saudi Arabia', 'Iran', 'UAE', 'Israel'],
      affected_regions: ['Middle East', 'Global'],
      affected_sectors: ['Energy', 'Transportation', 'Logistics'],
      delta_by_channel: {
        revenue: -2.0,
        supply_chain: -2.5,
        physical_assets: -0.5,
        financial: -0.5
      },
      transmission_path: ['Middle East', 'Global Energy Markets', 'Transportation'],
      reasoning: 'Regional conflicts could disrupt oil supply and increase transportation costs globally',
      data_sources: ['Geopolitical Analysis', 'Energy Markets'],
      confidence: 0.60,
      last_updated: new Date('2024-08-01')
    }
  ];
}

export function generateMockExecutiveSummary(): ExecutiveSummary {
  const globalRiskTrajectory: GlobalRiskTrajectory = {
    current_level: 62.5,
    forecast_level: 65.8,
    trend: 'Increasing',
    confidence: 'Medium',
    historical_data: [
      { date: '2024-01', level: 58.2 },
      { date: '2024-02', level: 59.1 },
      { date: '2024-03', level: 60.5 },
      { date: '2024-04', level: 61.2 },
      { date: '2024-05', level: 62.5 }
    ],
    forecast_data: [
      { date: '2024-06', level: 63.5, confidence_interval: [61.0, 66.0] },
      { date: '2024-07', level: 64.2, confidence_interval: [61.5, 67.0] },
      { date: '2024-08', level: 65.0, confidence_interval: [62.0, 68.0] },
      { date: '2024-09', level: 65.8, confidence_interval: [62.5, 69.0] }
    ]
  };

  const topThemes: GeopoliticalTheme[] = [
    {
      theme_id: 'theme-001',
      theme_name: 'US-China Strategic Competition',
      description: 'Ongoing technological and trade rivalry between major powers',
      priority: 'Critical',
      related_events: ['evt-001'],
      affected_regions: ['North America', 'Asia Pacific'],
      affected_sectors: ['Technology', 'Manufacturing', 'Semiconductors'],
      expected_impact: 'High',
      probability: 0.75
    },
    {
      theme_id: 'theme-002',
      theme_name: 'Energy Transition Challenges',
      description: 'Supply chain disruptions and energy security concerns',
      priority: 'High',
      related_events: ['evt-002'],
      affected_regions: ['Europe', 'Global'],
      affected_sectors: ['Energy', 'Manufacturing'],
      expected_impact: 'Medium',
      probability: 0.65
    },
    {
      theme_id: 'theme-003',
      theme_name: 'Regional Conflicts',
      description: 'Ongoing tensions in Middle East affecting global markets',
      priority: 'High',
      related_events: ['evt-003'],
      affected_regions: ['Middle East', 'Global'],
      affected_sectors: ['Energy', 'Transportation'],
      expected_impact: 'High',
      probability: 0.55
    }
  ];

  const regionalHotspots: RegionalHotspot[] = [
    {
      region: 'East Asia',
      countries: ['China', 'Taiwan', 'South Korea', 'Japan'],
      risk_level: 'Critical',
      trend: 'Escalating',
      key_events: ['evt-001'],
      expected_impact: 'Technology supply chains at risk from trade tensions',
      affected_sectors: ['Technology', 'Semiconductors', 'Electronics']
    },
    {
      region: 'Europe',
      countries: ['Germany', 'France', 'Italy', 'Poland'],
      risk_level: 'High',
      trend: 'Stable',
      key_events: ['evt-002'],
      expected_impact: 'Energy costs impacting industrial competitiveness',
      affected_sectors: ['Energy', 'Manufacturing', 'Chemicals']
    },
    {
      region: 'Middle East',
      countries: ['Saudi Arabia', 'Iran', 'UAE', 'Israel'],
      risk_level: 'Critical',
      trend: 'Escalating',
      key_events: ['evt-003'],
      expected_impact: 'Oil supply disruptions affecting global energy markets',
      affected_sectors: ['Energy', 'Transportation', 'Logistics']
    }
  ];

  const events = generateMockForecastEvents();

  return {
    global_risk_trajectory: globalRiskTrajectory,
    top_geopolitical_themes: topThemes,
    high_impact_events_count: 3,
    high_impact_events: events,
    regional_hotspots: regionalHotspots,
    summary_text: 'Global geopolitical risks are trending upward, driven by US-China tensions, energy security concerns, and regional conflicts. Technology and energy sectors face the highest exposure.',
    key_takeaways: [
      'US-China trade tensions expected to escalate in Q2 2026',
      'European energy security remains a critical concern',
      'Middle East stability risks could disrupt global supply chains',
      'Technology sector faces significant headwinds from geopolitical factors'
    ],
    last_updated: new Date(),
    forecast_horizon: '6-12 months',
    confidence: 'Medium'
  };
}

export function generateMockRegionalAssessments(): RegionalAssessment[] {
  const events = generateMockForecastEvents();
  
  return [
    {
      region: 'North America',
      countries: ['United States', 'Canada', 'Mexico'],
      risk_trajectory: 'Stable',
      current_level: 55.0,
      forecast_level: 57.5,
      key_events: [events[0]],
      sector_implications: [
        {
          sector: 'Technology',
          impact: 'Negative',
          reasoning: 'Trade tensions with China affecting supply chains'
        },
        {
          sector: 'Manufacturing',
          impact: 'Mixed',
          reasoning: 'Nearshoring opportunities offset by input cost increases'
        }
      ],
      summary: 'North America maintains relative stability but faces challenges from trade tensions'
    },
    {
      region: 'Europe',
      countries: ['Germany', 'France', 'Italy', 'Spain', 'Poland'],
      risk_trajectory: 'Increasing',
      current_level: 62.0,
      forecast_level: 65.0,
      key_events: [events[1]],
      sector_implications: [
        {
          sector: 'Energy',
          impact: 'Negative',
          reasoning: 'Ongoing energy security challenges'
        },
        {
          sector: 'Manufacturing',
          impact: 'Negative',
          reasoning: 'High energy costs reducing competitiveness'
        }
      ],
      summary: 'Europe faces elevated risks from energy security concerns'
    },
    {
      region: 'Asia Pacific',
      countries: ['China', 'Japan', 'South Korea', 'Taiwan', 'India'],
      risk_trajectory: 'Increasing',
      current_level: 60.0,
      forecast_level: 63.5,
      key_events: [events[0]],
      sector_implications: [
        {
          sector: 'Technology',
          impact: 'Negative',
          reasoning: 'Supply chain disruptions from trade tensions'
        },
        {
          sector: 'Manufacturing',
          impact: 'Mixed',
          reasoning: 'Regional diversification creating opportunities'
        }
      ],
      summary: 'Asia Pacific faces rising tensions affecting technology supply chains'
    },
    {
      region: 'Middle East',
      countries: ['Saudi Arabia', 'UAE', 'Iran', 'Israel'],
      risk_trajectory: 'Increasing',
      current_level: 70.0,
      forecast_level: 75.0,
      key_events: [events[2]],
      sector_implications: [
        {
          sector: 'Energy',
          impact: 'Negative',
          reasoning: 'Regional conflicts threatening oil supply'
        },
        {
          sector: 'Transportation',
          impact: 'Negative',
          reasoning: 'Shipping routes at risk from instability'
        }
      ],
      summary: 'Middle East remains a critical hotspot with escalating tensions'
    }
  ];
}

export function generateMockAssetClassForecasts(): AssetClassForecast[] {
  return [
    {
      asset_class: 'Equities',
      breakdown: [
        {
          category: 'Technology',
          impact: 'Negative',
          reasoning: 'Trade tensions and supply chain disruptions',
          confidence: 'Medium',
          related_events: ['evt-001']
        },
        {
          category: 'Energy',
          impact: 'Mixed',
          reasoning: 'Supply concerns offset by price increases',
          confidence: 'Medium',
          related_events: ['evt-002', 'evt-003']
        },
        {
          category: 'Industrials',
          impact: 'Negative',
          reasoning: 'High input costs and supply chain challenges',
          confidence: 'Medium',
          related_events: ['evt-001', 'evt-002']
        }
      ]
    },
    {
      asset_class: 'Fixed Income',
      breakdown: [
        {
          category: 'Government Bonds',
          impact: 'Positive',
          reasoning: 'Flight to safety during geopolitical uncertainty',
          confidence: 'High',
          related_events: ['evt-001', 'evt-003']
        },
        {
          category: 'Corporate Bonds',
          impact: 'Negative',
          reasoning: 'Credit risks from operational challenges',
          confidence: 'Medium',
          related_events: ['evt-001', 'evt-002']
        }
      ]
    },
    {
      asset_class: 'Commodities',
      breakdown: [
        {
          category: 'Energy',
          impact: 'Positive',
          reasoning: 'Supply disruptions supporting prices',
          confidence: 'Medium',
          related_events: ['evt-002', 'evt-003']
        },
        {
          category: 'Metals',
          impact: 'Mixed',
          reasoning: 'Industrial demand concerns offset by supply constraints',
          confidence: 'Low',
          related_events: ['evt-001']
        }
      ]
    },
    {
      asset_class: 'Currencies',
      breakdown: [
        {
          category: 'USD',
          impact: 'Positive',
          reasoning: 'Safe haven demand during uncertainty',
          confidence: 'High',
          related_events: ['evt-001', 'evt-003']
        },
        {
          category: 'EUR',
          impact: 'Negative',
          reasoning: 'Energy challenges weighing on outlook',
          confidence: 'Medium',
          related_events: ['evt-002']
        }
      ]
    }
  ];
}

export function generateMockStrategicRecommendations(): StrategicRecommendation[] {
  return [
    {
      recommendation_id: 'rec-001',
      category: 'Risk Mitigation',
      action: 'Diversify supply chain away from single-country dependencies',
      rationale: 'Reduce exposure to US-China trade tensions and regional disruptions',
      confidence: 'High',
      time_horizon: '6-12 months',
      priority: 'High',
      related_events: ['evt-001'],
      affected_sectors: ['Technology', 'Manufacturing'],
      affected_regions: ['Asia Pacific', 'North America']
    },
    {
      recommendation_id: 'rec-002',
      category: 'Risk Mitigation',
      action: 'Implement dynamic hedging for energy and commodity exposure',
      rationale: 'Protect margins against geopolitical volatility in energy markets',
      confidence: 'High',
      time_horizon: '3-6 months',
      priority: 'High',
      related_events: ['evt-002', 'evt-003'],
      affected_sectors: ['Energy', 'Manufacturing'],
      affected_regions: ['Europe', 'Middle East']
    },
    {
      recommendation_id: 'rec-003',
      category: 'Portfolio Positioning',
      action: 'Increase allocation to defensive sectors and safe-haven assets',
      rationale: 'Position for heightened geopolitical uncertainty',
      confidence: 'Medium',
      time_horizon: 'Immediate',
      priority: 'Medium',
      related_events: ['evt-001', 'evt-003'],
      affected_sectors: ['All'],
      affected_regions: ['Global']
    },
    {
      recommendation_id: 'rec-004',
      category: 'Opportunities',
      action: 'Explore nearshoring and regional manufacturing opportunities',
      rationale: 'Capitalize on supply chain restructuring trends',
      confidence: 'Medium',
      time_horizon: '6-12 months',
      priority: 'Medium',
      related_events: ['evt-001'],
      affected_sectors: ['Manufacturing', 'Logistics'],
      affected_regions: ['North America', 'Europe']
    }
  ];
}