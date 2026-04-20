/**
 * Cedar Owl 2026 Geopolitical Forecast Data
 * 
 * Static forecast data for 2026 geopolitical risk projections
 * Source: Cedar Owl Geopolitical Intelligence
 */

import type { GeopoliticalForecast } from '@/types/forecast.types';

export const CEDAROWL_FORECAST_2026: GeopoliticalForecast = {
  metadata: {
    forecastId: 'CEDAR_OWL_2026_Q1',
    version: '1.0.0',
    forecastPeriod: '2026',
    generatedDate: '2024-01-15T00:00:00Z',
    nextUpdate: '2027-12-31T23:59:59Z',
    dataSource: 'Cedar Owl',
    methodology: 'Multi-factor geopolitical risk modeling with machine learning',
    overallConfidence: 0.82,
    analystNotes: 'Based on current geopolitical trends, economic indicators, and historical patterns. Key focus areas: US-China relations, Middle East stability, European energy security, and emerging market dynamics.'
  },

  countryAdjustments: {
    // Major Powers
    'US': {
      delta: -1.5,
      drivers: ['Political polarization concerns', 'Debt ceiling debates', 'Election year volatility'],
      outlook: 'STABLE',
      expectedReturn: 0.02,
      riskTrend: 'STABLE'
    },
    'CN': {
      delta: 3.2,
      drivers: ['Economic slowdown', 'Property sector stress', 'Geopolitical tensions', 'Tech restrictions'],
      outlook: 'DETERIORATING',
      expectedReturn: -0.05,
      riskTrend: 'INCREASING'
    },
    'RU': {
      delta: 2.8,
      drivers: ['Ongoing conflicts', 'Sanctions impact', 'Economic isolation'],
      outlook: 'VOLATILE',
      expectedReturn: -0.08,
      riskTrend: 'INCREASING'
    },

    // Europe
    'DE': {
      delta: 1.2,
      drivers: ['Energy transition challenges', 'Manufacturing competitiveness', 'Political fragmentation'],
      outlook: 'STABLE',
      expectedReturn: 0.01,
      riskTrend: 'STABLE'
    },
    'GB': {
      delta: 0.8,
      drivers: ['Post-Brexit adjustments', 'Trade realignment', 'Political stability'],
      outlook: 'IMPROVING',
      expectedReturn: 0.03,
      riskTrend: 'DECREASING'
    },
    'FR': {
      delta: 1.5,
      drivers: ['Fiscal pressures', 'Social unrest risks', 'Energy security'],
      outlook: 'STABLE',
      expectedReturn: 0.00,
      riskTrend: 'STABLE'
    },

    // Asia Pacific
    'JP': {
      delta: -0.5,
      drivers: ['Monetary policy normalization', 'Regional security cooperation', 'Tech leadership'],
      outlook: 'IMPROVING',
      expectedReturn: 0.04,
      riskTrend: 'DECREASING'
    },
    'IN': {
      delta: -2.0,
      drivers: ['Economic growth momentum', 'Manufacturing expansion', 'Infrastructure investment'],
      outlook: 'IMPROVING',
      expectedReturn: 0.06,
      riskTrend: 'DECREASING'
    },
    'KR': {
      delta: 1.0,
      drivers: ['North Korea tensions', 'Semiconductor competition', 'China dependency'],
      outlook: 'STABLE',
      expectedReturn: 0.02,
      riskTrend: 'STABLE'
    },
    'TW': {
      delta: 4.5,
      drivers: ['Cross-strait tensions', 'Geopolitical flashpoint', 'Tech sector vulnerability'],
      outlook: 'DETERIORATING',
      expectedReturn: -0.03,
      riskTrend: 'INCREASING'
    },

    // Middle East
    'SA': {
      delta: -1.0,
      drivers: ['Economic diversification', 'Regional diplomacy', 'Energy transition'],
      outlook: 'IMPROVING',
      expectedReturn: 0.03,
      riskTrend: 'DECREASING'
    },
    'AE': {
      delta: -1.5,
      drivers: ['Business hub status', 'Diversification success', 'Regional stability'],
      outlook: 'IMPROVING',
      expectedReturn: 0.04,
      riskTrend: 'DECREASING'
    },
    'IL': {
      delta: 2.0,
      drivers: ['Regional tensions', 'Political instability', 'Security concerns'],
      outlook: 'VOLATILE',
      expectedReturn: -0.02,
      riskTrend: 'INCREASING'
    },
    'TR': {
      delta: 3.0,
      drivers: ['Economic instability', 'Currency volatility', 'Political uncertainty'],
      outlook: 'DETERIORATING',
      expectedReturn: -0.06,
      riskTrend: 'INCREASING'
    },

    // Latin America
    'BR': {
      delta: 1.8,
      drivers: ['Political polarization', 'Fiscal challenges', 'Environmental concerns'],
      outlook: 'STABLE',
      expectedReturn: 0.01,
      riskTrend: 'STABLE'
    },
    'MX': {
      delta: 0.5,
      drivers: ['Nearshoring benefits', 'USMCA stability', 'Security challenges'],
      outlook: 'STABLE',
      expectedReturn: 0.03,
      riskTrend: 'STABLE'
    },
    'AR': {
      delta: 4.0,
      drivers: ['Economic crisis', 'Currency instability', 'Political transition'],
      outlook: 'VOLATILE',
      expectedReturn: -0.10,
      riskTrend: 'INCREASING'
    },

    // Other Key Markets
    'CA': {
      delta: -0.5,
      drivers: ['Economic resilience', 'Trade diversification', 'Resource strength'],
      outlook: 'STABLE',
      expectedReturn: 0.02,
      riskTrend: 'STABLE'
    },
    'AU': {
      delta: 0.0,
      drivers: ['China trade balance', 'Resource exports', 'Regional security'],
      outlook: 'STABLE',
      expectedReturn: 0.02,
      riskTrend: 'STABLE'
    },
    'SG': {
      delta: -0.8,
      drivers: ['Financial hub status', 'Tech leadership', 'Regional stability'],
      outlook: 'IMPROVING',
      expectedReturn: 0.04,
      riskTrend: 'DECREASING'
    },
    'CH': {
      delta: -1.0,
      drivers: ['Neutrality advantage', 'Financial stability', 'Innovation leadership'],
      outlook: 'STABLE',
      expectedReturn: 0.03,
      riskTrend: 'STABLE'
    }
  },

  geopoliticalEvents: [
    {
      event: 'US-China Tech Decoupling Acceleration',
      timeline: '2026-Q1-Q4',
      probability: 0.75,
      riskLevel: 'HIGH',
      baseImpact: 8.0,
      affectedCountries: ['US', 'CN', 'TW', 'KR', 'JP', 'DE'],
      sectorImpacts: {
        'Technology': 1.25,
        'Automotive': 1.15,
        'Industrials': 1.10,
        'Healthcare': 1.05
      },
      description: 'Continued expansion of export controls, investment restrictions, and technology transfer limitations between US and China',
      investmentImpact: 'High impact on semiconductor, AI, and advanced manufacturing sectors. Supply chain restructuring required.'
    },
    {
      event: 'Middle East Conflict Escalation',
      timeline: '2026-Q2',
      probability: 0.45,
      riskLevel: 'CRITICAL',
      baseImpact: 12.0,
      affectedCountries: ['IL', 'SA', 'AE', 'TR', 'US', 'GB', 'FR'],
      sectorImpacts: {
        'Energy': 1.30,
        'Basic Materials': 1.15,
        'Industrials': 1.10,
        'Financial Services': 1.08
      },
      description: 'Potential escalation of regional conflicts affecting energy supplies and global trade routes',
      investmentImpact: 'Severe impact on energy markets, potential oil price spikes, shipping route disruptions.'
    },
    {
      event: 'European Energy Security Crisis',
      timeline: '2026-Q4',
      probability: 0.35,
      riskLevel: 'HIGH',
      baseImpact: 7.5,
      affectedCountries: ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'],
      sectorImpacts: {
        'Energy': 1.20,
        'Utilities': 1.18,
        'Industrials': 1.12,
        'Basic Materials': 1.10
      },
      description: 'Winter energy supply concerns and transition challenges in European energy markets',
      investmentImpact: 'Manufacturing competitiveness concerns, potential industrial relocations, energy price volatility.'
    },
    {
      event: 'Taiwan Strait Tensions Increase',
      timeline: '2026-Q3',
      probability: 0.60,
      riskLevel: 'CRITICAL',
      baseImpact: 15.0,
      affectedCountries: ['TW', 'CN', 'US', 'JP', 'KR', 'AU'],
      sectorImpacts: {
        'Technology': 1.35,
        'Automotive': 1.20,
        'Industrials': 1.15,
        'Financial Services': 1.12
      },
      description: 'Heightened military activities and diplomatic tensions in Taiwan Strait region',
      investmentImpact: 'Critical semiconductor supply chain risks, potential for severe global economic disruption.'
    },
    {
      event: 'Emerging Market Debt Crisis',
      timeline: '2026-Q2-Q3',
      probability: 0.40,
      riskLevel: 'HIGH',
      baseImpact: 9.0,
      affectedCountries: ['AR', 'TR', 'BR', 'EG', 'PK'],
      sectorImpacts: {
        'Financial Services': 1.25,
        'Basic Materials': 1.12,
        'Energy': 1.08,
        'Consumer Cyclical': 1.10
      },
      description: 'Sovereign debt distress in multiple emerging markets due to high interest rates and currency pressures',
      investmentImpact: 'Financial contagion risks, currency volatility, potential defaults affecting global credit markets.'
    },
    {
      event: 'Global Supply Chain Cyber Attacks',
      timeline: '2026-Q1-Q4',
      probability: 0.55,
      riskLevel: 'MEDIUM',
      baseImpact: 5.5,
      affectedCountries: ['US', 'CN', 'DE', 'GB', 'JP', 'KR'],
      sectorImpacts: {
        'Technology': 1.15,
        'Financial Services': 1.12,
        'Industrials': 1.10,
        'Healthcare': 1.08
      },
      description: 'Increased sophistication and frequency of state-sponsored cyber attacks on critical infrastructure',
      investmentImpact: 'Cybersecurity investment requirements, operational disruptions, data security concerns.'
    },
    {
      event: 'India Manufacturing Boom',
      timeline: '2026-Q1-Q4',
      probability: 0.70,
      riskLevel: 'LOW',
      baseImpact: -4.0,
      affectedCountries: ['IN', 'US', 'JP', 'KR', 'SG'],
      sectorImpacts: {
        'Technology': 0.92,
        'Industrials': 0.94,
        'Automotive': 0.95,
        'Healthcare': 0.96
      },
      description: 'Accelerated manufacturing relocation to India as part of China+1 strategy',
      investmentImpact: 'Positive for India-exposed companies, supply chain diversification benefits, new market opportunities.'
    },
    {
      event: 'Climate Policy Divergence',
      timeline: '2026-Q2-Q4',
      probability: 0.65,
      riskLevel: 'MEDIUM',
      baseImpact: 6.0,
      affectedCountries: ['US', 'CN', 'DE', 'GB', 'FR', 'AU'],
      sectorImpacts: {
        'Energy': 1.18,
        'Utilities': 1.15,
        'Basic Materials': 1.12,
        'Industrials': 1.08
      },
      description: 'Increasing divergence in climate policies creating competitive imbalances and trade tensions',
      investmentImpact: 'Carbon border adjustment impacts, stranded asset risks, transition investment requirements.'
    }
  ],

  regionalPremiums: {
    'North America': -0.5,
    'Europe': 1.0,
    'East Asia': 1.5,
    'Southeast Asia': 0.5,
    'South Asia': -0.8,
    'Middle East': 2.0,
    'Latin America': 1.2,
    'Africa': 1.5,
    'Oceania': 0.0
  },

  sectorMultipliers: {
    'Technology': 1.12,
    'Automotive': 1.18,
    'Energy': 1.15,
    'Financial Services': 1.08,
    'Healthcare': 1.10,
    'Industrials': 1.09,
    'Consumer Cyclical': 1.06,
    'Basic Materials': 1.11,
    'Utilities': 1.05,
    'Real Estate': 1.02,
    'Communication Services': 1.07,
    'Consumer Defensive': 1.04
  }
};