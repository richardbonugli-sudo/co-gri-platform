/**
 * Channel Risk Factors Database - Phase 2 Development
 * 
 * Defines risk factors for each channel and their impact on multiplier adjustments.
 * Risk factors are categorized by:
 * - Geopolitical risk
 * - Economic risk
 * - Operational risk
 * - Regulatory risk
 * - Concentration risk
 */

export interface ChannelRiskFactor {
  id: string;
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  category: 'geopolitical' | 'economic' | 'operational' | 'regulatory' | 'concentration';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  multiplierImpact: number; // Adjustment to base multiplier (-0.1 to +0.3)
  historicalExamples: Array<{
    event: string;
    date: string;
    impact: string;
    affectedCompanies: string[];
  }>;
  mitigationStrategies: string[];
}

/**
 * Channel risk factors database
 */
export const CHANNEL_RISK_FACTORS: ChannelRiskFactor[] = [
  // ========================================
  // REVENUE CHANNEL RISK FACTORS
  // ========================================
  {
    id: 'REV-GEO-001',
    channel: 'Revenue',
    category: 'geopolitical',
    name: 'Market Access Restrictions',
    description: 'Government-imposed barriers preventing companies from selling products or services in specific markets due to trade tensions, sanctions, or protectionist policies.',
    severity: 'high',
    multiplierImpact: 0.15,
    historicalExamples: [
      {
        event: 'US-China Tech Sanctions',
        date: '2019-2024',
        impact: 'Huawei banned from US market, affecting $10B+ in revenue',
        affectedCompanies: ['Huawei', 'ZTE', 'Semiconductor companies']
      },
      {
        event: 'Russia Sanctions',
        date: '2022-present',
        impact: 'Western companies lost access to Russian market (~$150B collective revenue)',
        affectedCompanies: ['McDonald\'s', 'Starbucks', 'Apple', 'Microsoft']
      }
    ],
    mitigationStrategies: [
      'Geographic diversification',
      'Local partnerships and joint ventures',
      'Product localization',
      'Regulatory compliance monitoring'
    ]
  },
  {
    id: 'REV-ECO-001',
    channel: 'Revenue',
    category: 'economic',
    name: 'Currency Fluctuations',
    description: 'Exchange rate volatility affecting revenue when converted to home currency, particularly in emerging markets with unstable currencies.',
    severity: 'medium',
    multiplierImpact: 0.08,
    historicalExamples: [
      {
        event: 'Turkish Lira Crisis',
        date: '2018',
        impact: 'Lira lost 40% value, affecting multinational revenues',
        affectedCompanies: ['Ford', 'Coca-Cola', 'P&G']
      }
    ],
    mitigationStrategies: [
      'Currency hedging programs',
      'Natural hedging through local sourcing',
      'Dynamic pricing strategies',
      'Multi-currency revenue streams'
    ]
  },
  {
    id: 'REV-REG-001',
    channel: 'Revenue',
    category: 'regulatory',
    name: 'Tariffs and Trade Barriers',
    description: 'Import duties, quotas, and non-tariff barriers that increase product costs and reduce competitiveness in foreign markets.',
    severity: 'high',
    multiplierImpact: 0.12,
    historicalExamples: [
      {
        event: 'US-China Trade War',
        date: '2018-2020',
        impact: 'Tariffs up to 25% on $360B of Chinese goods',
        affectedCompanies: ['Apple', 'Tesla', 'General Motors', 'Agricultural exporters']
      }
    ],
    mitigationStrategies: [
      'Supply chain relocation',
      'Free trade zone utilization',
      'Product redesign to avoid tariff categories',
      'Lobbying and trade advocacy'
    ]
  },

  // ========================================
  // SUPPLY CHAIN CHANNEL RISK FACTORS
  // ========================================
  {
    id: 'SUP-GEO-001',
    channel: 'Supply',
    category: 'geopolitical',
    name: 'Supplier Concentration in High-Risk Regions',
    description: 'Heavy reliance on suppliers located in geopolitically unstable regions or countries with adversarial relationships to home country.',
    severity: 'critical',
    multiplierImpact: 0.25,
    historicalExamples: [
      {
        event: 'Semiconductor Shortage',
        date: '2020-2023',
        impact: 'Taiwan concentration risk highlighted, $500B+ economic impact',
        affectedCompanies: ['Automotive industry', 'Consumer electronics', 'Industrial equipment']
      },
      {
        event: 'Rare Earth Minerals Dominance',
        date: 'Ongoing',
        impact: 'China controls 80% of rare earth supply, used in EVs and defense',
        affectedCompanies: ['Tesla', 'Defense contractors', 'Renewable energy companies']
      }
    ],
    mitigationStrategies: [
      'Dual sourcing strategies',
      'Nearshoring and friendshoring',
      'Vertical integration',
      'Strategic inventory buffers',
      'Supplier diversification programs'
    ]
  },
  {
    id: 'SUP-OPS-001',
    channel: 'Supply',
    category: 'operational',
    name: 'Transportation and Logistics Disruptions',
    description: 'Shipping route blockages, port closures, airspace restrictions, and logistics infrastructure failures affecting supply chain continuity.',
    severity: 'high',
    multiplierImpact: 0.18,
    historicalExamples: [
      {
        event: 'Suez Canal Blockage',
        date: '2021-03',
        impact: 'Ever Given blocked canal for 6 days, $9-10B daily trade impact',
        affectedCompanies: ['Global shipping industry', 'Retailers', 'Manufacturers']
      },
      {
        event: 'Red Sea Shipping Crisis',
        date: '2023-2024',
        impact: 'Houthi attacks forced rerouting around Africa, 20% longer transit',
        affectedCompanies: ['Maersk', 'MSC', 'European manufacturers']
      }
    ],
    mitigationStrategies: [
      'Multi-modal transportation options',
      'Route diversification',
      'Regional distribution centers',
      'Air freight contingency plans'
    ]
  },
  {
    id: 'SUP-REG-001',
    channel: 'Supply',
    category: 'regulatory',
    name: 'Export Controls and Technology Restrictions',
    description: 'Government restrictions on exporting critical technologies, dual-use items, and strategic materials to certain countries or entities.',
    severity: 'critical',
    multiplierImpact: 0.22,
    historicalExamples: [
      {
        event: 'US Semiconductor Export Controls to China',
        date: '2022-present',
        impact: 'Restrictions on advanced chips and manufacturing equipment',
        affectedCompanies: ['NVIDIA', 'AMD', 'Applied Materials', 'ASML']
      }
    ],
    mitigationStrategies: [
      'Export compliance programs',
      'Technology localization',
      'Alternative technology development',
      'Strategic partnerships with compliant suppliers'
    ]
  },
  {
    id: 'SUP-CON-001',
    channel: 'Supply',
    category: 'concentration',
    name: 'Single Point of Failure Dependencies',
    description: 'Critical components or materials available from only one or very few suppliers, creating catastrophic risk if supply is disrupted.',
    severity: 'critical',
    multiplierImpact: 0.28,
    historicalExamples: [
      {
        event: 'Renesas Fire',
        date: '2021-03',
        impact: 'Fire at Japanese chip plant worsened automotive semiconductor shortage',
        affectedCompanies: ['Toyota', 'Nissan', 'Honda', 'Global automakers']
      }
    ],
    mitigationStrategies: [
      'Qualification of alternate suppliers',
      'Component redesign for multi-sourcing',
      'Strategic stockpiling',
      'Supplier financial health monitoring'
    ]
  },

  // ========================================
  // ASSETS CHANNEL RISK FACTORS
  // ========================================
  {
    id: 'ASS-GEO-001',
    channel: 'Assets',
    category: 'geopolitical',
    name: 'Asset Nationalization and Expropriation',
    description: 'Government seizure of foreign-owned assets without adequate compensation, typically in resource-rich or politically unstable countries.',
    severity: 'critical',
    multiplierImpact: 0.30,
    historicalExamples: [
      {
        event: 'Russia Asset Seizures',
        date: '2022',
        impact: 'Western companies lost $100B+ in Russian assets',
        affectedCompanies: ['Shell', 'BP', 'ExxonMobil', 'Renault', 'McDonald\'s']
      },
      {
        event: 'Venezuela Oil Nationalizations',
        date: '2007-2012',
        impact: 'Chavez government seized foreign oil company assets',
        affectedCompanies: ['ExxonMobil', 'ConocoPhillips']
      }
    ],
    mitigationStrategies: [
      'Political risk insurance',
      'Joint ventures with local partners',
      'Asset-light business models',
      'Bilateral investment treaties',
      'Gradual asset deployment'
    ]
  },
  {
    id: 'ASS-REG-001',
    channel: 'Assets',
    category: 'regulatory',
    name: 'Foreign Ownership Restrictions',
    description: 'Legal limits on foreign ownership percentages in strategic sectors like telecommunications, media, energy, and defense.',
    severity: 'high',
    multiplierImpact: 0.15,
    historicalExamples: [
      {
        event: 'China Foreign Investment Restrictions',
        date: 'Ongoing',
        impact: 'Limits on foreign ownership in key sectors, forced JVs',
        affectedCompanies: ['Automotive JVs', 'Financial services', 'Media companies']
      }
    ],
    mitigationStrategies: [
      'Compliance with local ownership laws',
      'Strategic local partnerships',
      'Licensing and franchising models',
      'Technology transfer agreements'
    ]
  },
  {
    id: 'ASS-OPS-001',
    channel: 'Assets',
    category: 'operational',
    name: 'Infrastructure Dependencies',
    description: 'Reliance on local infrastructure (power, water, transportation, telecommunications) that may be unreliable or subject to government control.',
    severity: 'medium',
    multiplierImpact: 0.10,
    historicalExamples: [
      {
        event: 'South Africa Power Crisis',
        date: '2023-2024',
        impact: 'Rolling blackouts disrupted manufacturing operations',
        affectedCompanies: ['Mining companies', 'Manufacturers', 'Data centers']
      }
    ],
    mitigationStrategies: [
      'On-site power generation',
      'Redundant infrastructure systems',
      'Infrastructure investment partnerships',
      'Business continuity planning'
    ]
  },
  {
    id: 'ASS-CON-001',
    channel: 'Assets',
    category: 'concentration',
    name: 'Geographic Asset Concentration',
    description: 'Significant portion of physical assets concentrated in a single country or region, creating vulnerability to localized disruptions.',
    severity: 'high',
    multiplierImpact: 0.20,
    historicalExamples: [
      {
        event: 'Fukushima Nuclear Disaster',
        date: '2011',
        impact: 'Japanese manufacturing hub disrupted, global supply chain impact',
        affectedCompanies: ['Toyota', 'Sony', 'Semiconductor manufacturers']
      }
    ],
    mitigationStrategies: [
      'Geographic diversification of facilities',
      'Regional production hubs',
      'Flexible manufacturing networks',
      'Disaster recovery planning'
    ]
  },

  // ========================================
  // FINANCIAL CHANNEL RISK FACTORS
  // ========================================
  {
    id: 'FIN-GEO-001',
    channel: 'Financial',
    category: 'geopolitical',
    name: 'Banking Sanctions and SWIFT Restrictions',
    description: 'Exclusion from international payment systems (SWIFT) and banking sanctions that prevent cross-border transactions and access to global financial markets.',
    severity: 'critical',
    multiplierImpact: 0.25,
    historicalExamples: [
      {
        event: 'Russia SWIFT Sanctions',
        date: '2022',
        impact: 'Major Russian banks cut off from SWIFT, $300B+ reserves frozen',
        affectedCompanies: ['Sberbank', 'VTB', 'Western companies with Russian operations']
      },
      {
        event: 'Iran Banking Sanctions',
        date: '2012-present',
        impact: 'Iranian banks excluded from SWIFT, oil revenue access restricted',
        affectedCompanies: ['Iranian banks', 'Oil companies trading with Iran']
      }
    ],
    mitigationStrategies: [
      'Diversified banking relationships',
      'Alternative payment systems (e.g., CIPS)',
      'Cryptocurrency and blockchain solutions',
      'Regional payment networks',
      'Pre-positioning of funds'
    ]
  },
  {
    id: 'FIN-REG-001',
    channel: 'Financial',
    category: 'regulatory',
    name: 'Capital Flow Controls',
    description: 'Government restrictions on moving money across borders, including repatriation limits, dividend restrictions, and currency convertibility issues.',
    severity: 'high',
    multiplierImpact: 0.18,
    historicalExamples: [
      {
        event: 'Argentina Capital Controls',
        date: '2019-2020',
        impact: 'Strict limits on dollar purchases and capital outflows',
        affectedCompanies: ['Multinational corporations with Argentine subsidiaries']
      },
      {
        event: 'China Capital Controls',
        date: 'Ongoing',
        impact: 'Restrictions on capital outflows, dividend repatriation delays',
        affectedCompanies: ['Foreign companies operating in China']
      }
    ],
    mitigationStrategies: [
      'Transfer pricing optimization',
      'Intercompany loans and royalties',
      'Local reinvestment strategies',
      'Currency hedging',
      'Advance planning for repatriation'
    ]
  },
  {
    id: 'FIN-OPS-001',
    channel: 'Financial',
    category: 'operational',
    name: 'Payment System Disruptions',
    description: 'Technical failures, cyber attacks, or political interference affecting payment processing, banking systems, and financial infrastructure.',
    severity: 'medium',
    multiplierImpact: 0.12,
    historicalExamples: [
      {
        event: 'Bangladesh Bank Heist',
        date: '2016',
        impact: '$81M stolen via SWIFT system compromise',
        affectedCompanies: ['Bangladesh Bank', 'SWIFT network']
      }
    ],
    mitigationStrategies: [
      'Cybersecurity investments',
      'Multi-bank relationships',
      'Payment system redundancy',
      'Real-time transaction monitoring',
      'Incident response planning'
    ]
  },
  {
    id: 'FIN-REG-002',
    channel: 'Financial',
    category: 'regulatory',
    name: 'AML and Sanctions Compliance',
    description: 'Stringent anti-money laundering (AML) and sanctions compliance requirements that can result in fines, banking relationship termination, or criminal prosecution.',
    severity: 'high',
    multiplierImpact: 0.15,
    historicalExamples: [
      {
        event: 'HSBC AML Violations',
        date: '2012',
        impact: '$1.9B fine for AML failures and sanctions violations',
        affectedCompanies: ['HSBC']
      },
      {
        event: 'BNP Paribas Sanctions Violations',
        date: '2014',
        impact: '$8.9B fine for violating US sanctions',
        affectedCompanies: ['BNP Paribas']
      }
    ],
    mitigationStrategies: [
      'Robust compliance programs',
      'Sanctions screening systems',
      'Know Your Customer (KYC) procedures',
      'Regular compliance audits',
      'Employee training programs'
    ]
  }
];

/**
 * Get risk factors for a specific channel
 */
export function getRiskFactorsByChannel(channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial'): ChannelRiskFactor[] {
  return CHANNEL_RISK_FACTORS.filter(factor => factor.channel === channel);
}

/**
 * Get risk factors by category
 */
export function getRiskFactorsByCategory(category: string): ChannelRiskFactor[] {
  return CHANNEL_RISK_FACTORS.filter(factor => factor.category === category);
}

/**
 * Get risk factors by severity
 */
export function getRiskFactorsBySeverity(severity: string): ChannelRiskFactor[] {
  return CHANNEL_RISK_FACTORS.filter(factor => factor.severity === severity);
}

/**
 * Calculate aggregate risk impact for a channel
 */
export function calculateChannelRiskImpact(
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial',
  activeRiskFactorIds: string[]
): {
  totalImpact: number;
  riskCount: number;
  severityBreakdown: Record<string, number>;
} {
  const channelFactors = getRiskFactorsByChannel(channel);
  const activeFactors = channelFactors.filter(factor => activeRiskFactorIds.includes(factor.id));
  
  const totalImpact = activeFactors.reduce((sum, factor) => sum + factor.multiplierImpact, 0);
  const riskCount = activeFactors.length;
  
  const severityBreakdown: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  activeFactors.forEach(factor => {
    severityBreakdown[factor.severity]++;
  });
  
  return {
    totalImpact,
    riskCount,
    severityBreakdown
  };
}

/**
 * Get risk factor by ID
 */
export function getRiskFactorById(id: string): ChannelRiskFactor | undefined {
  return CHANNEL_RISK_FACTORS.find(factor => factor.id === id);
}

/**
 * Get all risk factor IDs for a channel
 */
export function getRiskFactorIds(channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial'): string[] {
  return getRiskFactorsByChannel(channel).map(factor => factor.id);
}

/**
 * Get risk factor statistics
 */
export function getRiskFactorStatistics(): {
  totalFactors: number;
  byChannel: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  averageMultiplierImpact: number;
} {
  const byChannel: Record<string, number> = {
    Revenue: 0,
    Supply: 0,
    Assets: 0,
    Financial: 0
  };
  
  const byCategory: Record<string, number> = {
    geopolitical: 0,
    economic: 0,
    operational: 0,
    regulatory: 0,
    concentration: 0
  };
  
  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  let totalImpact = 0;
  
  CHANNEL_RISK_FACTORS.forEach(factor => {
    byChannel[factor.channel]++;
    byCategory[factor.category]++;
    bySeverity[factor.severity]++;
    totalImpact += factor.multiplierImpact;
  });
  
  return {
    totalFactors: CHANNEL_RISK_FACTORS.length,
    byChannel,
    byCategory,
    bySeverity,
    averageMultiplierImpact: totalImpact / CHANNEL_RISK_FACTORS.length
  };
}