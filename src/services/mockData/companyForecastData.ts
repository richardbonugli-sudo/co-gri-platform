/**
 * Company-Specific Forecast Data Generator
 * Generates company forecast outlooks based on exposure profiles
 * Part of CO-GRI Platform Phase 3 - Week 8
 */

import { CompanyForecastOutlook } from '@/types/forecast';
import { generateMockForecastEvents } from './forecastDataGenerator';
import { filterRelevantForecastEvents } from '@/services/forecast/eventRelevanceFilter';
import { 
  applyMultipleForecastEvents, 
  calculateForecastScenarios,
  getForecastOutlook,
  getConfidenceLevel
} from '@/services/forecast/forecastDeltaApplicator';
import { CountryExposure } from '@/services/cogriCalculationService';

/**
 * Generate company-specific forecast outlook
 */
export function generateCompanyForecastOutlook(
  ticker: string,
  companyName: string,
  exposures: CountryExposure[]
): CompanyForecastOutlook {
  // Get all forecast events
  const allEvents = generateMockForecastEvents();
  
  // Filter relevant events for this company
  const relevantEvents = filterRelevantForecastEvents(allEvents, exposures);
  
  // Apply forecast deltas
  const forecastResult = applyMultipleForecastEvents(relevantEvents, exposures);
  
  // Calculate scenarios
  const scenarios = calculateForecastScenarios(relevantEvents, exposures);
  
  // Determine outlook
  const outlook = getForecastOutlook(forecastResult.probability_weighted_delta);
  
  // Get confidence level
  const confidence = getConfidenceLevel(relevantEvents);
  
  // Get top 5 drivers
  const topDrivers = relevantEvents.slice(0, 5);
  
  // Generate channel impact assessment
  const channelImpact = generateChannelImpactAssessment(relevantEvents, exposures);
  
  // Generate recommendations
  const recommendations = generateCompanyRecommendations(outlook, topDrivers);
  
  return {
    ticker,
    company_name: companyName,
    outlook,
    confidence,
    horizon: '6-12 months',
    expected_delta_CO_GRI: forecastResult.probability_weighted_delta,
    delta_range: {
      best_case: scenarios.best_case,
      base_case: scenarios.base_case,
      worst_case: scenarios.worst_case
    },
    top_forecast_drivers: topDrivers,
    channel_impact_assessment: channelImpact,
    recommended_actions: recommendations,
    last_updated: new Date(),
    data_coverage: relevantEvents.length > 0 ? 0.85 : 0.5
  };
}

/**
 * Generate channel impact assessment
 */
function generateChannelImpactAssessment(
  events: any[],
  exposures: CountryExposure[]
): any[] {
  const channelImpacts = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0
  };
  
  // Aggregate channel impacts
  for (const event of events) {
    for (const country of event.affected_countries) {
      const exposure = exposures.find(exp => exp.country === country);
      if (!exposure) continue;
      
      const weight = exposure.exposureWeight;
      const prob = event.probability;
      
      channelImpacts.revenue += weight * event.delta_by_channel.revenue * prob;
      channelImpacts.supply_chain += weight * event.delta_by_channel.supply_chain * prob;
      channelImpacts.physical_assets += weight * event.delta_by_channel.physical_assets * prob;
      channelImpacts.financial += weight * event.delta_by_channel.financial * prob;
    }
  }
  
  // Convert to assessment format
  const assessments = [
    {
      channel: 'Revenue' as const,
      direction: channelImpacts.revenue > 0.5 ? 'Increasing' as const : 
                 channelImpacts.revenue < -0.5 ? 'Decreasing' as const : 'Stable' as const,
      severity: Math.abs(channelImpacts.revenue) > 2 ? 'High' as const : 
                Math.abs(channelImpacts.revenue) > 1 ? 'Medium' as const : 'Low' as const,
      explanation: generateChannelExplanation('Revenue', channelImpacts.revenue, events),
      contributing_events: events.slice(0, 3).map(e => e.event_id)
    },
    {
      channel: 'Supply Chain' as const,
      direction: channelImpacts.supply_chain > 0.5 ? 'Increasing' as const : 
                 channelImpacts.supply_chain < -0.5 ? 'Decreasing' as const : 'Stable' as const,
      severity: Math.abs(channelImpacts.supply_chain) > 2 ? 'High' as const : 
                Math.abs(channelImpacts.supply_chain) > 1 ? 'Medium' as const : 'Low' as const,
      explanation: generateChannelExplanation('Supply Chain', channelImpacts.supply_chain, events),
      contributing_events: events.slice(0, 3).map(e => e.event_id)
    },
    {
      channel: 'Physical Assets' as const,
      direction: channelImpacts.physical_assets > 0.5 ? 'Increasing' as const : 
                 channelImpacts.physical_assets < -0.5 ? 'Decreasing' as const : 'Stable' as const,
      severity: Math.abs(channelImpacts.physical_assets) > 2 ? 'High' as const : 
                Math.abs(channelImpacts.physical_assets) > 1 ? 'Medium' as const : 'Low' as const,
      explanation: generateChannelExplanation('Physical Assets', channelImpacts.physical_assets, events),
      contributing_events: events.slice(0, 3).map(e => e.event_id)
    },
    {
      channel: 'Financial' as const,
      direction: channelImpacts.financial > 0.5 ? 'Increasing' as const : 
                 channelImpacts.financial < -0.5 ? 'Decreasing' as const : 'Stable' as const,
      severity: Math.abs(channelImpacts.financial) > 2 ? 'High' as const : 
                Math.abs(channelImpacts.financial) > 1 ? 'Medium' as const : 'Low' as const,
      explanation: generateChannelExplanation('Financial', channelImpacts.financial, events),
      contributing_events: events.slice(0, 3).map(e => e.event_id)
    }
  ];
  
  return assessments;
}

/**
 * Generate channel-specific explanation
 */
function generateChannelExplanation(
  channel: string,
  impact: number,
  events: any[]
): string {
  if (Math.abs(impact) < 0.5) {
    return `${channel} exposure remains stable with minimal forecast impact.`;
  }
  
  const direction = impact > 0 ? 'elevated' : 'reduced';
  const topEvent = events[0];
  
  return `${channel} risk ${direction} by forecast events, primarily driven by ${topEvent.event_name}.`;
}

/**
 * Generate company-specific recommendations
 */
function generateCompanyRecommendations(
  outlook: string,
  topDrivers: any[]
): string[] {
  const recommendations: string[] = [];
  
  if (outlook === 'Headwind') {
    recommendations.push('Consider hedging strategies to mitigate elevated geopolitical risks');
    recommendations.push('Diversify supply chain exposure to reduce concentration risk');
    recommendations.push('Monitor forecast events closely and update risk assessments quarterly');
  } else if (outlook === 'Tailwind') {
    recommendations.push('Leverage favorable geopolitical trends for strategic expansion');
    recommendations.push('Maintain current geographic footprint while monitoring developments');
    recommendations.push('Consider opportunistic investments in improving regions');
  } else if (outlook === 'Mixed') {
    recommendations.push('Balance risk mitigation with opportunity capture');
    recommendations.push('Implement selective hedging for high-risk exposure channels');
    recommendations.push('Monitor both positive and negative forecast drivers');
  } else {
    recommendations.push('Maintain current risk management approach');
    recommendations.push('Continue monitoring geopolitical developments');
  }
  
  // Add event-specific recommendations
  if (topDrivers.length > 0) {
    const topEvent = topDrivers[0];
    if (topEvent.event_type === 'Political' || topEvent.event_type === 'Military') {
      recommendations.push('Enhance political risk monitoring and scenario planning');
    } else if (topEvent.event_type === 'Economic') {
      recommendations.push('Review economic exposure and currency hedging strategies');
    }
  }
  
  return recommendations.slice(0, 4);
}

/**
 * Mock company exposures for testing
 */
export const MOCK_COMPANY_EXPOSURES: Record<string, CountryExposure[]> = {
  'AAPL': [
    { country: 'China', exposureWeight: 0.35, adjustedShock: 61.2, riskContribution: 21.4, alignmentModifier: 0.3 },
    { country: 'Taiwan', exposureWeight: 0.25, adjustedShock: 58.3, riskContribution: 14.6, alignmentModifier: 0.67 },
    { country: 'Vietnam', exposureWeight: 0.15, adjustedShock: 38.5, riskContribution: 5.8, alignmentModifier: 0.5 },
    { country: 'Japan', exposureWeight: 0.12, adjustedShock: 27.2, riskContribution: 3.3, alignmentModifier: 0.83 },
    { country: 'S. Korea', exposureWeight: 0.08, adjustedShock: 32.1, riskContribution: 2.6, alignmentModifier: 0.77 }
  ],
  'NVDA': [
    { country: 'Taiwan', exposureWeight: 0.45, adjustedShock: 58.3, riskContribution: 26.2, alignmentModifier: 0.67 },
    { country: 'China', exposureWeight: 0.20, adjustedShock: 61.2, riskContribution: 12.2, alignmentModifier: 0.3 },
    { country: 'S. Korea', exposureWeight: 0.15, adjustedShock: 32.1, riskContribution: 4.8, alignmentModifier: 0.77 },
    { country: 'Japan', exposureWeight: 0.10, adjustedShock: 27.2, riskContribution: 2.7, alignmentModifier: 0.83 },
    { country: 'Singapore', exposureWeight: 0.05, adjustedShock: 22.5, riskContribution: 1.1, alignmentModifier: 0.9 }
  ],
  'INTC': [
    { country: 'China', exposureWeight: 0.28, adjustedShock: 61.2, riskContribution: 17.1, alignmentModifier: 0.3 },
    { country: 'Taiwan', exposureWeight: 0.18, adjustedShock: 58.3, riskContribution: 10.5, alignmentModifier: 0.67 },
    { country: 'Vietnam', exposureWeight: 0.12, adjustedShock: 38.5, riskContribution: 4.6, alignmentModifier: 0.5 },
    { country: 'Malaysia', exposureWeight: 0.10, adjustedShock: 35.2, riskContribution: 3.5, alignmentModifier: 0.55 },
    { country: 'Ireland', exposureWeight: 0.08, adjustedShock: 18.3, riskContribution: 1.5, alignmentModifier: 0.95 }
  ],
  'TSLA': [
    { country: 'China', exposureWeight: 0.40, adjustedShock: 61.2, riskContribution: 24.5, alignmentModifier: 0.3 },
    { country: 'Germany', exposureWeight: 0.20, adjustedShock: 24.1, riskContribution: 4.8, alignmentModifier: 0.9 },
    { country: 'United States', exposureWeight: 0.15, adjustedShock: 15.2, riskContribution: 2.3, alignmentModifier: 1.0 },
    { country: 'Netherlands', exposureWeight: 0.10, adjustedShock: 19.5, riskContribution: 2.0, alignmentModifier: 0.95 },
    { country: 'Japan', exposureWeight: 0.08, adjustedShock: 27.2, riskContribution: 2.2, alignmentModifier: 0.83 }
  ],
  'MSFT': [
    { country: 'United States', exposureWeight: 0.35, adjustedShock: 15.2, riskContribution: 5.3, alignmentModifier: 1.0 },
    { country: 'Ireland', exposureWeight: 0.15, adjustedShock: 18.3, riskContribution: 2.7, alignmentModifier: 0.95 },
    { country: 'Singapore', exposureWeight: 0.12, adjustedShock: 22.5, riskContribution: 2.7, alignmentModifier: 0.9 },
    { country: 'China', exposureWeight: 0.10, adjustedShock: 61.2, riskContribution: 6.1, alignmentModifier: 0.3 },
    { country: 'Japan', exposureWeight: 0.08, adjustedShock: 27.2, riskContribution: 2.2, alignmentModifier: 0.83 }
  ]
};

/**
 * Get mock company forecast outlook
 */
export function getMockCompanyForecastOutlook(ticker: string): CompanyForecastOutlook | null {
  const exposures = MOCK_COMPANY_EXPOSURES[ticker];
  if (!exposures) return null;
  
  const companyNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'NVDA': 'NVIDIA Corporation',
    'INTC': 'Intel Corporation',
    'TSLA': 'Tesla Inc.',
    'MSFT': 'Microsoft Corporation'
  };
  
  return generateCompanyForecastOutlook(
    ticker,
    companyNames[ticker] || ticker,
    exposures
  );
}