/**
 * Sector Multiplier Metadata - Phase 1 Transparency Layer
 * 
 * Provides comprehensive documentation, rationale, and historical context
 * for sector risk multipliers used in COGRI calculations.
 */

export interface SectorMultiplierMetadata {
  value: number;
  rationale: string;
  dataSource: string;
  lastReviewed: string;
  confidenceScore: number;
  riskFactors: string[];
  historicalValues: Array<{
    value: number;
    effectiveDate: string;
    reason: string;
  }>;
  relatedSectors: string[];
  validationNotes: string[];
}

export interface MultiplierValidationResult {
  multiplier: number;
  confidence: number;
  warnings: string[];
  adjustmentFactors: {
    concentrationRisk: number;
    volatilityRisk: number;
    geopoliticalRisk: number;
  };
  metadata: SectorMultiplierMetadata;
}

/**
 * Comprehensive sector multiplier metadata with full transparency
 */
export const SECTOR_MULTIPLIER_METADATA: Record<string, SectorMultiplierMetadata> = {
  'Automotive': {
    value: 1.15,
    rationale: 'High supply chain complexity, geographic concentration in manufacturing, and sensitivity to trade policies. Automotive sector faces significant risks from tariffs, semiconductor shortages, and regional production dependencies.',
    dataSource: 'Historical automotive sector volatility analysis (2015-2024), including chip shortage impact and trade war effects',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.88,
    riskFactors: [
      'Complex global supply chains with single points of failure',
      'High exposure to semiconductor supply disruptions',
      'Sensitivity to trade policies and tariffs',
      'Geographic concentration in China, Germany, Japan',
      'EV transition creating new supply chain dependencies'
    ],
    historicalValues: [
      { value: 1.10, effectiveDate: '2020-01-01', reason: 'Pre-pandemic baseline' },
      { value: 1.25, effectiveDate: '2021-06-01', reason: 'Semiconductor shortage crisis' },
      { value: 1.20, effectiveDate: '2023-01-01', reason: 'Supply chain normalization' },
      { value: 1.15, effectiveDate: '2024-01-01', reason: 'Stabilization with residual risks' }
    ],
    relatedSectors: ['Technology', 'Basic Materials', 'Industrials'],
    validationNotes: [
      'Monitor semiconductor supply chain developments',
      'Track EV battery supply chain concentration',
      'Review quarterly for trade policy changes'
    ]
  },

  'Energy': {
    value: 1.12,
    rationale: 'Extreme geopolitical sensitivity due to resource concentration, sanctions exposure, price volatility, and critical infrastructure dependencies. Energy sector is highly vulnerable to geopolitical conflicts and policy changes.',
    dataSource: 'Historical energy sector analysis (2010-2024), including Russia-Ukraine conflict, OPEC decisions, and sanctions impact',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.92,
    riskFactors: [
      'Geographic concentration of oil/gas reserves',
      'High exposure to sanctions and embargoes',
      'Extreme price volatility during conflicts',
      'Critical infrastructure vulnerability',
      'Energy transition policy uncertainty'
    ],
    historicalValues: [
      { value: 1.10, effectiveDate: '2020-01-01', reason: 'Pre-pandemic baseline' },
      { value: 1.25, effectiveDate: '2022-03-01', reason: 'Russia-Ukraine conflict impact' },
      { value: 1.18, effectiveDate: '2023-06-01', reason: 'Market adaptation to new supply routes' },
      { value: 1.12, effectiveDate: '2024-01-01', reason: 'Stabilization with structural changes' }
    ],
    relatedSectors: ['Basic Materials', 'Utilities', 'Industrials'],
    validationNotes: [
      'Monitor geopolitical developments in major oil/gas regions',
      'Track sanctions and embargo announcements',
      'Review monthly during high volatility periods'
    ]
  },

  'Technology': {
    value: 1.10,
    rationale: 'Moderate-high risk due to supply chain concentration in Asia, intellectual property concerns, export controls, and data sovereignty issues. Technology sector faces increasing geopolitical scrutiny.',
    dataSource: 'Technology sector geopolitical risk analysis (2018-2024), including US-China tech tensions and semiconductor export controls',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.85,
    riskFactors: [
      'Supply chain concentration in Taiwan, South Korea, China',
      'Export control restrictions on advanced technology',
      'Data sovereignty and privacy regulations',
      'Intellectual property theft concerns',
      'Strategic competition in AI and semiconductors'
    ],
    historicalValues: [
      { value: 1.08, effectiveDate: '2020-01-01', reason: 'Pre-trade war baseline' },
      { value: 1.15, effectiveDate: '2021-01-01', reason: 'US-China tech decoupling' },
      { value: 1.12, effectiveDate: '2023-01-01', reason: 'Diversification efforts' },
      { value: 1.10, effectiveDate: '2024-01-01', reason: 'New equilibrium with controls' }
    ],
    relatedSectors: ['Communication Services', 'Industrials', 'Consumer Discretionary'],
    validationNotes: [
      'Monitor export control policy changes',
      'Track semiconductor manufacturing capacity shifts',
      'Review quarterly for tech policy developments'
    ]
  },

  'Basic Materials': {
    value: 1.09,
    rationale: 'Moderate-high risk from resource nationalism, supply concentration, environmental regulations, and critical mineral dependencies. Materials sector vulnerable to export restrictions.',
    dataSource: 'Materials sector analysis (2015-2024), including rare earth supply dynamics and resource nationalism trends',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.82,
    riskFactors: [
      'Geographic concentration of critical minerals',
      'Resource nationalism and export restrictions',
      'Environmental regulation variability',
      'Supply chain dependencies for rare earths',
      'Strategic mineral competition'
    ],
    historicalValues: [
      { value: 1.08, effectiveDate: '2020-01-01', reason: 'Baseline assessment' },
      { value: 1.12, effectiveDate: '2022-01-01', reason: 'Critical mineral supply concerns' },
      { value: 1.09, effectiveDate: '2024-01-01', reason: 'Diversification progress' }
    ],
    relatedSectors: ['Energy', 'Industrials', 'Technology'],
    validationNotes: [
      'Monitor critical mineral supply developments',
      'Track resource nationalism policies',
      'Review semi-annually for regulatory changes'
    ]
  },

  'Healthcare': {
    value: 1.08,
    rationale: 'Moderate risk from pharmaceutical supply chain dependencies, regulatory divergence, intellectual property issues, and pandemic-related disruptions.',
    dataSource: 'Healthcare sector analysis (2019-2024), including COVID-19 supply chain lessons and pharmaceutical manufacturing shifts',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.80,
    riskFactors: [
      'API (Active Pharmaceutical Ingredient) supply concentration',
      'Regulatory approval divergence across regions',
      'Intellectual property and patent disputes',
      'Medical device supply chain complexity',
      'Pandemic-related supply disruptions'
    ],
    historicalValues: [
      { value: 1.05, effectiveDate: '2020-01-01', reason: 'Pre-pandemic baseline' },
      { value: 1.15, effectiveDate: '2020-04-01', reason: 'COVID-19 supply chain crisis' },
      { value: 1.10, effectiveDate: '2022-01-01', reason: 'Supply chain recovery' },
      { value: 1.08, effectiveDate: '2024-01-01', reason: 'New normal with resilience measures' }
    ],
    relatedSectors: ['Consumer Staples', 'Technology', 'Basic Materials'],
    validationNotes: [
      'Monitor pharmaceutical supply chain developments',
      'Track regulatory harmonization efforts',
      'Review annually for pandemic preparedness'
    ]
  },

  'Industrials': {
    value: 1.07,
    rationale: 'Moderate risk from diversified supply chains, defense sector exposure, infrastructure dependencies, and trade policy sensitivity.',
    dataSource: 'Industrials sector analysis (2015-2024), including defense spending trends and infrastructure investment patterns',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.78,
    riskFactors: [
      'Defense sector geopolitical exposure',
      'Infrastructure project political dependencies',
      'Trade policy impact on equipment exports',
      'Supply chain complexity for large projects',
      'Aerospace sector concentration'
    ],
    historicalValues: [
      { value: 1.06, effectiveDate: '2020-01-01', reason: 'Baseline assessment' },
      { value: 1.09, effectiveDate: '2022-03-01', reason: 'Defense spending increase' },
      { value: 1.07, effectiveDate: '2024-01-01', reason: 'Stabilization' }
    ],
    relatedSectors: ['Technology', 'Basic Materials', 'Energy'],
    validationNotes: [
      'Monitor defense spending and policy changes',
      'Track infrastructure investment trends',
      'Review semi-annually'
    ]
  },

  'Consumer Cyclical': {
    value: 1.06,
    rationale: 'Moderate risk from retail supply chain dependencies, e-commerce cross-border complexities, and consumer spending sensitivity to geopolitical events.',
    dataSource: 'Consumer cyclical analysis (2018-2024), including e-commerce growth and supply chain shifts',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.75,
    riskFactors: [
      'Retail supply chain from Asia concentration',
      'E-commerce cross-border regulatory complexity',
      'Consumer confidence impact from conflicts',
      'Fashion/apparel manufacturing dependencies',
      'Luxury goods market sensitivity'
    ],
    historicalValues: [
      { value: 1.05, effectiveDate: '2020-01-01', reason: 'Baseline' },
      { value: 1.08, effectiveDate: '2021-01-01', reason: 'Supply chain disruptions' },
      { value: 1.06, effectiveDate: '2024-01-01', reason: 'Recovery and adaptation' }
    ],
    relatedSectors: ['Technology', 'Industrials', 'Communication Services'],
    validationNotes: [
      'Monitor retail supply chain developments',
      'Track consumer confidence indicators',
      'Review quarterly'
    ]
  },

  'Financial Services': {
    value: 1.05,
    rationale: 'Moderate risk from sanctions exposure, cross-border payment systems, regulatory divergence, and financial infrastructure dependencies.',
    dataSource: 'Financial services analysis (2015-2024), including SWIFT sanctions and payment system fragmentation',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.85,
    riskFactors: [
      'Sanctions and payment system exclusions',
      'Cross-border regulatory complexity',
      'Currency risk and capital controls',
      'Cybersecurity and infrastructure threats',
      'Financial system fragmentation'
    ],
    historicalValues: [
      { value: 1.04, effectiveDate: '2020-01-01', reason: 'Baseline' },
      { value: 1.08, effectiveDate: '2022-03-01', reason: 'SWIFT sanctions impact' },
      { value: 1.05, effectiveDate: '2024-01-01', reason: 'Adaptation to new payment systems' }
    ],
    relatedSectors: ['Technology', 'Real Estate', 'Communication Services'],
    validationNotes: [
      'Monitor sanctions and payment system changes',
      'Track regulatory harmonization efforts',
      'Review quarterly for financial stability'
    ]
  },

  'Communication Services': {
    value: 1.05,
    rationale: 'Moderate risk from content regulation, data sovereignty, telecommunications infrastructure, and digital service restrictions.',
    dataSource: 'Communication services analysis (2018-2024), including content regulation trends and telecom infrastructure policies',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.77,
    riskFactors: [
      'Content regulation and censorship',
      'Data localization requirements',
      'Telecommunications infrastructure restrictions',
      'Digital service taxation divergence',
      'Social media platform restrictions'
    ],
    historicalValues: [
      { value: 1.04, effectiveDate: '2020-01-01', reason: 'Baseline' },
      { value: 1.07, effectiveDate: '2022-01-01', reason: 'Increased regulation' },
      { value: 1.05, effectiveDate: '2024-01-01', reason: 'Regulatory stabilization' }
    ],
    relatedSectors: ['Technology', 'Consumer Discretionary', 'Industrials'],
    validationNotes: [
      'Monitor content regulation changes',
      'Track data sovereignty developments',
      'Review semi-annually'
    ]
  },

  'Consumer Defensive': {
    value: 1.04,
    rationale: 'Low-moderate risk due to essential goods nature, but exposed to agricultural supply chains, food security policies, and trade restrictions.',
    dataSource: 'Consumer staples analysis (2015-2024), including food security trends and agricultural trade patterns',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.82,
    riskFactors: [
      'Agricultural supply chain weather sensitivity',
      'Food security and export restriction policies',
      'Commodity price volatility',
      'Packaging and logistics dependencies',
      'Consumer goods trade restrictions'
    ],
    historicalValues: [
      { value: 1.03, effectiveDate: '2020-01-01', reason: 'Baseline - essential goods' },
      { value: 1.06, effectiveDate: '2022-03-01', reason: 'Food security concerns' },
      { value: 1.04, effectiveDate: '2024-01-01', reason: 'Supply normalization' }
    ],
    relatedSectors: ['Basic Materials', 'Industrials', 'Healthcare'],
    validationNotes: [
      'Monitor food security policy changes',
      'Track agricultural commodity trends',
      'Review annually'
    ]
  },

  'Utilities': {
    value: 1.03,
    rationale: 'Low risk due to regulated nature and local focus, but exposed to energy security, infrastructure vulnerability, and renewable transition policies.',
    dataSource: 'Utilities sector analysis (2015-2024), including energy security trends and renewable transition impacts',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.88,
    riskFactors: [
      'Energy security and supply dependencies',
      'Critical infrastructure vulnerability',
      'Renewable transition policy uncertainty',
      'Grid interconnection dependencies',
      'Natural gas supply geopolitics'
    ],
    historicalValues: [
      { value: 1.02, effectiveDate: '2020-01-01', reason: 'Baseline - regulated sector' },
      { value: 1.05, effectiveDate: '2022-03-01', reason: 'Energy security concerns' },
      { value: 1.03, effectiveDate: '2024-01-01', reason: 'Infrastructure resilience' }
    ],
    relatedSectors: ['Energy', 'Industrials', 'Real Estate'],
    validationNotes: [
      'Monitor energy security developments',
      'Track renewable transition policies',
      'Review annually'
    ]
  },

  'Real Estate': {
    value: 1.02,
    rationale: 'Low risk due to local nature, but exposed to foreign investment restrictions, property rights, and cross-border capital flow regulations.',
    dataSource: 'Real estate sector analysis (2015-2024), including foreign investment policy trends and capital control impacts',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.80,
    riskFactors: [
      'Foreign investment restrictions',
      'Property rights and legal system stability',
      'Cross-border capital flow regulations',
      'Real estate market policy divergence',
      'Currency risk for international REITs'
    ],
    historicalValues: [
      { value: 1.02, effectiveDate: '2020-01-01', reason: 'Baseline - local sector' },
      { value: 1.04, effectiveDate: '2022-01-01', reason: 'Capital control tightening' },
      { value: 1.02, effectiveDate: '2024-01-01', reason: 'Policy stabilization' }
    ],
    relatedSectors: ['Financial Services', 'Industrials', 'Consumer Discretionary'],
    validationNotes: [
      'Monitor foreign investment policy changes',
      'Track capital control developments',
      'Review annually'
    ]
  },

  'General': {
    value: 1.00,
    rationale: 'Neutral baseline for unclassified or diversified companies. No sector-specific risk adjustment applied.',
    dataSource: 'Default baseline - no sector-specific analysis',
    lastReviewed: '2024-12-01',
    confidenceScore: 0.50,
    riskFactors: [
      'No sector-specific risk factors identified',
      'Diversified or unclassified business model',
      'Requires manual review for accurate classification'
    ],
    historicalValues: [
      { value: 1.00, effectiveDate: '2020-01-01', reason: 'Default baseline' }
    ],
    relatedSectors: [],
    validationNotes: [
      'Attempt to classify into specific sector',
      'Review company business model',
      'Consider manual sector assignment'
    ]
  }
};

/**
 * Get sector multiplier metadata
 */
export function getSectorMultiplierMetadata(sector: string): SectorMultiplierMetadata {
  return SECTOR_MULTIPLIER_METADATA[sector] || SECTOR_MULTIPLIER_METADATA['General'];
}

/**
 * Get all available sectors with metadata
 */
export function getAllSectorMetadata(): Array<{ sector: string; metadata: SectorMultiplierMetadata }> {
  return Object.entries(SECTOR_MULTIPLIER_METADATA).map(([sector, metadata]) => ({
    sector,
    metadata
  }));
}
