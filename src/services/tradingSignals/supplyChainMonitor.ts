/**
 * Real-Time Supply Chain Disruption Monitoring
 * 
 * PHASE 3: Supply Chain Risk Assessment
 * 
 * Monitors global supply chain conditions and identifies disruptions
 * that could impact company operations and CO-GRI scores.
 * 
 * UPDATED: Now integrates with real supply chain data sources:
 * - Freightos Baltic Index (shipping rates)
 * - Port Congestion Data
 * - Commodity Price Feeds
 * 
 * Falls back to static/simulated data when APIs are unavailable.
 * 
 * Tracks:
 * - Shipping delays and port congestion
 * - Energy price volatility
 * - Commodity supply disruptions
 * - Geopolitical events affecting trade routes
 * 
 * @module supplyChainMonitor
 */

import { supplyChainDataService, type SupplyChainStatus, type PortStatus, type CommodityPrice } from '../supplyChainDataService';

export type DisruptionType = 'shipping' | 'energy' | 'commodity' | 'geopolitical' | 'pandemic' | 'weather';

export interface SupplyChainDisruption {
  id: string;
  severity: number;              // 0-100
  affectedCountries: string[];
  disruptionType: DisruptionType;
  impact: string;
  recommendation: string;
  startDate: Date;
  estimatedDuration: number;     // days
  confidence: number;            // 0-1
  dataSource?: 'live' | 'cached' | 'static';
}

export interface SupplyChainMetrics {
  shippingIndex: number;         // 0-100 (higher = more delays)
  energyPriceVolatility: number; // Annualized volatility
  commodityDisruption: number;   // 0-100
  geopoliticalRisk: number;      // 0-100
  portCongestion: Record<string, number>; // Port name -> congestion score
  tradeRouteStatus: Record<string, number>; // Route -> health score
  dataSource?: 'live' | 'cached' | 'static';
}

export interface SupplyChainAlert {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedSectors: string[];
  actionRequired: boolean;
}

/**
 * Get real-time supply chain metrics from live data sources
 * Falls back to simulated data when APIs are unavailable
 */
export async function getSupplyChainMetricsLive(): Promise<SupplyChainMetrics> {
  try {
    console.log('📦 Fetching live supply chain data...');
    const status = await supplyChainDataService.getSupplyChainStatus();
    
    // Convert live data to metrics format
    const metrics = convertStatusToMetrics(status);
    console.log(`✅ Supply chain metrics loaded (${status.dataSource})`);
    return metrics;
  } catch (error) {
    console.error('❌ Failed to fetch live supply chain data:', error);
    console.warn('Falling back to static supply chain metrics');
    return getSimulatedSupplyChainMetrics();
  }
}

/**
 * Convert SupplyChainStatus to SupplyChainMetrics
 */
function convertStatusToMetrics(status: SupplyChainStatus): SupplyChainMetrics {
  // Calculate shipping index from shipping rates
  const avgShippingRate = status.shippingRates.length > 0
    ? status.shippingRates.reduce((sum, r) => sum + r.rate, 0) / status.shippingRates.length
    : 2500;
  const historicalAvgRate = 2500;
  const shippingIndex = Math.min(100, Math.max(0, ((avgShippingRate / historicalAvgRate) - 0.5) * 100));
  
  // Calculate port congestion from port status
  const portCongestion: Record<string, number> = {};
  status.portStatus.forEach(port => {
    const congestionScore = calculatePortCongestionScore(port);
    portCongestion[port.portName] = congestionScore;
  });
  
  // Calculate energy price volatility from commodity prices
  const energyCommodities = status.commodityPrices.filter(c => 
    ['CL', 'BZ', 'NG'].includes(c.symbol) || 
    c.name.toLowerCase().includes('oil') || 
    c.name.toLowerCase().includes('gas')
  );
  const energyVolatility = energyCommodities.length > 0
    ? energyCommodities.reduce((sum, c) => sum + Math.abs(c.changePercent), 0) / energyCommodities.length / 100
    : 0.25;
  
  // Calculate commodity disruption from price changes
  const commodityDisruption = calculateCommodityDisruption(status.commodityPrices);
  
  // Calculate trade route status
  const tradeRouteStatus: Record<string, number> = {};
  status.shippingRates.forEach(rate => {
    // Higher rates = lower health
    const healthScore = Math.max(0, 100 - (rate.rate / 50));
    tradeRouteStatus[rate.route] = healthScore;
  });
  
  return {
    shippingIndex,
    energyPriceVolatility: energyVolatility,
    commodityDisruption,
    geopoliticalRisk: status.overallStress * 0.8, // Use overall stress as proxy
    portCongestion,
    tradeRouteStatus,
    dataSource: status.dataSource
  };
}

/**
 * Calculate port congestion score from port status
 */
function calculatePortCongestionScore(port: PortStatus): number {
  const congestionLevelScores: Record<string, number> = {
    'low': 20,
    'moderate': 50,
    'high': 75,
    'severe': 95
  };
  
  const baseScore = congestionLevelScores[port.congestionLevel] || 50;
  const waitTimeScore = Math.min(100, port.vesselWaitDays * 20);
  const dwellTimeScore = Math.min(100, port.containerDwellTime * 15);
  const utilizationScore = port.capacityUtilization;
  
  return (baseScore * 0.4 + waitTimeScore * 0.25 + dwellTimeScore * 0.15 + utilizationScore * 0.2);
}

/**
 * Calculate commodity disruption from price changes
 */
function calculateCommodityDisruption(commodities: CommodityPrice[]): number {
  if (commodities.length === 0) return 30;
  
  // Higher absolute price changes = higher disruption
  const avgAbsChange = commodities.reduce((sum, c) => sum + Math.abs(c.changePercent), 0) / commodities.length;
  
  // Normalize to 0-100 scale
  return Math.min(100, avgAbsChange * 15);
}

/**
 * Get simulated supply chain metrics (fallback)
 */
export function getSimulatedSupplyChainMetrics(): SupplyChainMetrics {
  return {
    shippingIndex: 45 + Math.random() * 20,
    energyPriceVolatility: 0.25 + Math.random() * 0.15,
    commodityDisruption: 35 + Math.random() * 20,
    geopoliticalRisk: 40 + Math.random() * 25,
    portCongestion: {
      'Los Angeles': 55 + Math.random() * 20,
      'Long Beach': 50 + Math.random() * 20,
      'Shanghai': 30 + Math.random() * 15,
      'Shenzhen': 25 + Math.random() * 15,
      'Rotterdam': 35 + Math.random() * 15,
      'Hamburg': 40 + Math.random() * 20,
      'Singapore': 25 + Math.random() * 10,
      'Busan': 30 + Math.random() * 15
    },
    tradeRouteStatus: {
      'China-US West Coast': 65 + Math.random() * 20,
      'China-US East Coast': 60 + Math.random() * 20,
      'China-Europe': 70 + Math.random() * 15,
      'Europe-US East Coast': 75 + Math.random() * 15,
      'Asia-Mediterranean': 70 + Math.random() * 15,
      'Intra-Asia': 80 + Math.random() * 10
    },
    dataSource: 'static'
  };
}

/**
 * Monitor supply chain conditions and identify disruptions
 * Phase 3: Now uses live data when available
 */
export function monitorSupplyChain(metrics: SupplyChainMetrics): SupplyChainDisruption[] {
  const disruptions: SupplyChainDisruption[] = [];
  const dataSource = metrics.dataSource || 'static';
  
  // Check shipping disruptions
  if (metrics.shippingIndex > 60) {
    disruptions.push({
      id: `shipping-${Date.now()}`,
      severity: metrics.shippingIndex,
      affectedCountries: identifyAffectedCountries('shipping', metrics),
      disruptionType: 'shipping',
      impact: getShippingImpact(metrics.shippingIndex),
      recommendation: getShippingRecommendation(metrics.shippingIndex),
      startDate: new Date(),
      estimatedDuration: estimateDisruptionDuration('shipping', metrics.shippingIndex),
      confidence: dataSource === 'live' ? 0.90 : 0.75,
      dataSource
    });
  }
  
  // Check energy disruptions
  if (metrics.energyPriceVolatility > 0.40) {
    disruptions.push({
      id: `energy-${Date.now()}`,
      severity: Math.min(100, metrics.energyPriceVolatility * 150),
      affectedCountries: identifyAffectedCountries('energy', metrics),
      disruptionType: 'energy',
      impact: getEnergyImpact(metrics.energyPriceVolatility),
      recommendation: getEnergyRecommendation(metrics.energyPriceVolatility),
      startDate: new Date(),
      estimatedDuration: estimateDisruptionDuration('energy', metrics.energyPriceVolatility * 100),
      confidence: dataSource === 'live' ? 0.85 : 0.70,
      dataSource
    });
  }
  
  // Check commodity disruptions
  if (metrics.commodityDisruption > 50) {
    disruptions.push({
      id: `commodity-${Date.now()}`,
      severity: metrics.commodityDisruption,
      affectedCountries: identifyAffectedCountries('commodity', metrics),
      disruptionType: 'commodity',
      impact: getCommodityImpact(metrics.commodityDisruption),
      recommendation: getCommodityRecommendation(metrics.commodityDisruption),
      startDate: new Date(),
      estimatedDuration: estimateDisruptionDuration('commodity', metrics.commodityDisruption),
      confidence: dataSource === 'live' ? 0.82 : 0.65,
      dataSource
    });
  }
  
  // Check geopolitical disruptions
  if (metrics.geopoliticalRisk > 65) {
    disruptions.push({
      id: `geopolitical-${Date.now()}`,
      severity: metrics.geopoliticalRisk,
      affectedCountries: identifyAffectedCountries('geopolitical', metrics),
      disruptionType: 'geopolitical',
      impact: getGeopoliticalImpact(metrics.geopoliticalRisk),
      recommendation: getGeopoliticalRecommendation(metrics.geopoliticalRisk),
      startDate: new Date(),
      estimatedDuration: estimateDisruptionDuration('geopolitical', metrics.geopoliticalRisk),
      confidence: dataSource === 'live' ? 0.78 : 0.60,
      dataSource
    });
  }
  
  return disruptions;
}

/**
 * Monitor supply chain with live data
 */
export async function monitorSupplyChainLive(): Promise<{
  metrics: SupplyChainMetrics;
  disruptions: SupplyChainDisruption[];
  alerts: SupplyChainAlert[];
  health: ReturnType<typeof calculateSupplyChainHealth>;
}> {
  const metrics = await getSupplyChainMetricsLive();
  const disruptions = monitorSupplyChain(metrics);
  const alerts = generateSupplyChainAlerts(disruptions);
  const health = calculateSupplyChainHealth(metrics, disruptions);
  
  return { metrics, disruptions, alerts, health };
}

/**
 * Identify countries affected by disruption type
 */
function identifyAffectedCountries(
  disruptionType: DisruptionType,
  metrics: SupplyChainMetrics
): string[] {
  const affectedCountries: string[] = [];
  
  switch (disruptionType) {
    case 'shipping':
      // Major shipping hubs
      if (metrics.shippingIndex > 60) {
        affectedCountries.push('China', 'United States', 'Singapore', 'South Korea', 'Japan');
      }
      if (metrics.shippingIndex > 75) {
        affectedCountries.push('Germany', 'Netherlands', 'United Kingdom', 'Taiwan');
      }
      break;
      
    case 'energy':
      // Energy-dependent economies
      affectedCountries.push('Germany', 'Japan', 'South Korea', 'Italy', 'Spain');
      if (metrics.energyPriceVolatility > 0.50) {
        affectedCountries.push('China', 'India', 'Turkey');
      }
      break;
      
    case 'commodity':
      // Manufacturing and commodity-dependent
      affectedCountries.push('China', 'United States', 'Germany', 'Japan', 'South Korea');
      break;
      
    case 'geopolitical':
      // Geopolitically sensitive regions
      affectedCountries.push('China', 'Russia', 'Ukraine', 'Taiwan', 'Israel');
      if (metrics.geopoliticalRisk > 75) {
        affectedCountries.push('Iran', 'Saudi Arabia', 'Turkey', 'India');
      }
      break;
  }
  
  return affectedCountries;
}

/**
 * Get shipping disruption impact description
 */
function getShippingImpact(severity: number): string {
  if (severity > 80) {
    return 'Severe shipping delays (20-30 days). Major port congestion affecting global supply chains. Expect significant cost increases and delivery delays.';
  } else if (severity > 70) {
    return 'Significant shipping delays (10-20 days). Port congestion in major hubs. Moderate cost increases and supply chain bottlenecks.';
  } else {
    return 'Moderate shipping delays (5-10 days). Some port congestion. Minor cost increases and delivery delays.';
  }
}

/**
 * Get shipping disruption recommendation
 */
function getShippingRecommendation(severity: number): string {
  if (severity > 80) {
    return 'CRITICAL: Reduce supply channel weight by 25-30%. Increase inventory buffers. Consider alternative suppliers with diversified shipping routes.';
  } else if (severity > 70) {
    return 'HIGH: Reduce supply channel weight by 15-20%. Monitor lead times closely. Evaluate backup suppliers.';
  } else {
    return 'MODERATE: Reduce supply channel weight by 10%. Continue monitoring. Prepare contingency plans.';
  }
}

/**
 * Get energy disruption impact description
 */
function getEnergyImpact(volatility: number): string {
  if (volatility > 0.60) {
    return 'Extreme energy price volatility. Major disruptions to energy-intensive industries. Significant cost pressures and potential production cuts.';
  } else if (volatility > 0.50) {
    return 'High energy price volatility. Moderate disruptions to manufacturing. Increased operational costs and margin pressure.';
  } else {
    return 'Elevated energy price volatility. Minor disruptions. Manageable cost increases.';
  }
}

/**
 * Get energy disruption recommendation
 */
function getEnergyRecommendation(volatility: number): string {
  if (volatility > 0.60) {
    return 'CRITICAL: Reduce positions in energy-intensive sectors (Basic Materials, Industrials). Increase assets channel weight to capture energy infrastructure exposure.';
  } else if (volatility > 0.50) {
    return 'HIGH: Monitor energy-intensive companies closely. Consider hedging strategies. Adjust sector allocations.';
  } else {
    return 'MODERATE: Continue monitoring energy markets. Prepare for potential cost increases.';
  }
}

/**
 * Get commodity disruption impact description
 */
function getCommodityImpact(severity: number): string {
  if (severity > 75) {
    return 'Severe commodity supply disruptions. Critical shortages in key materials. Major production constraints and price spikes.';
  } else if (severity > 60) {
    return 'Significant commodity supply constraints. Moderate shortages. Price increases and allocation challenges.';
  } else {
    return 'Moderate commodity supply tightness. Minor constraints. Some price pressure.';
  }
}

/**
 * Get commodity disruption recommendation
 */
function getCommodityRecommendation(severity: number): string {
  if (severity > 75) {
    return 'CRITICAL: Reduce supply channel weight by 20-25%. Avoid companies with high commodity exposure. Consider commodity producers as hedges.';
  } else if (severity > 60) {
    return 'HIGH: Reduce supply channel weight by 15%. Monitor commodity-dependent sectors. Evaluate supply chain resilience.';
  } else {
    return 'MODERATE: Reduce supply channel weight by 10%. Continue monitoring commodity markets.';
  }
}

/**
 * Get geopolitical disruption impact description
 */
function getGeopoliticalImpact(severity: number): string {
  if (severity > 80) {
    return 'Critical geopolitical tensions. High risk of trade disruptions, sanctions, or military conflicts. Major uncertainty for global supply chains.';
  } else if (severity > 70) {
    return 'Elevated geopolitical risks. Increased probability of trade restrictions or policy changes. Moderate supply chain uncertainty.';
  } else {
    return 'Heightened geopolitical concerns. Some trade friction. Manageable supply chain risks.';
  }
}

/**
 * Get geopolitical disruption recommendation
 */
function getGeopoliticalRecommendation(severity: number): string {
  if (severity > 80) {
    return 'CRITICAL: Significantly reduce exposure to affected regions. Diversify geographic risk. Increase financial channel weight for liquidity.';
  } else if (severity > 70) {
    return 'HIGH: Reduce exposure to high-risk regions. Monitor policy developments closely. Prepare contingency plans.';
  } else {
    return 'MODERATE: Continue monitoring geopolitical developments. Maintain diversified geographic exposure.';
  }
}

/**
 * Estimate disruption duration
 */
function estimateDisruptionDuration(
  disruptionType: DisruptionType,
  severity: number
): number {
  const baseDurations: Record<DisruptionType, number> = {
    'shipping': 45,
    'energy': 90,
    'commodity': 60,
    'geopolitical': 180,
    'pandemic': 365,
    'weather': 30
  };
  
  const baseDuration = baseDurations[disruptionType];
  const severityMultiplier = 0.5 + (severity / 100);
  
  return Math.round(baseDuration * severityMultiplier);
}

/**
 * Adjust supply channel weight based on disruptions
 */
export function adjustSupplyChannelWeight(
  baseWeight: number,
  disruptionSeverity: number
): number {
  // Reduce supply channel weight during disruptions
  // Formula: baseWeight * (1 - disruptionSeverity / 200)
  // Max reduction: 50% at severity 100
  const adjustment = 1 - (disruptionSeverity / 200);
  return baseWeight * Math.max(0.5, adjustment);
}

/**
 * Generate supply chain alerts
 */
export function generateSupplyChainAlerts(
  disruptions: SupplyChainDisruption[]
): SupplyChainAlert[] {
  const alerts: SupplyChainAlert[] = [];
  
  disruptions.forEach(disruption => {
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let actionRequired = false;
    
    if (disruption.severity > 80) {
      level = 'critical';
      actionRequired = true;
    } else if (disruption.severity > 65) {
      level = 'high';
      actionRequired = true;
    } else if (disruption.severity > 50) {
      level = 'medium';
      actionRequired = false;
    }
    
    const affectedSectors = getAffectedSectors(disruption.disruptionType);
    const sourceInfo = disruption.dataSource === 'live' ? ' [LIVE DATA]' : ' [STATIC DATA]';
    
    alerts.push({
      level,
      message: `${disruption.disruptionType.toUpperCase()} disruption detected (severity: ${disruption.severity.toFixed(0)}).${sourceInfo} ${disruption.impact}`,
      affectedSectors,
      actionRequired
    });
  });
  
  return alerts;
}

/**
 * Get sectors affected by disruption type
 */
function getAffectedSectors(disruptionType: DisruptionType): string[] {
  const sectorMap: Record<DisruptionType, string[]> = {
    'shipping': ['Technology', 'Consumer Cyclical', 'Industrials', 'Basic Materials'],
    'energy': ['Energy', 'Basic Materials', 'Industrials', 'Utilities'],
    'commodity': ['Basic Materials', 'Industrials', 'Energy', 'Consumer Defensive'],
    'geopolitical': ['All Sectors'],
    'pandemic': ['All Sectors'],
    'weather': ['Agriculture', 'Energy', 'Utilities']
  };
  
  return sectorMap[disruptionType] || [];
}

/**
 * Calculate overall supply chain health score
 */
export function calculateSupplyChainHealth(
  metrics: SupplyChainMetrics,
  disruptions: SupplyChainDisruption[]
): {
  healthScore: number;       // 0-100
  status: string;
  trend: 'improving' | 'stable' | 'deteriorating';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dataSource: 'live' | 'cached' | 'static';
} {
  // Calculate base health score (inverse of disruption metrics)
  const shippingHealth = 100 - metrics.shippingIndex;
  const energyHealth = 100 - Math.min(100, metrics.energyPriceVolatility * 150);
  const commodityHealth = 100 - metrics.commodityDisruption;
  const geopoliticalHealth = 100 - metrics.geopoliticalRisk;
  
  const healthScore = (shippingHealth + energyHealth + commodityHealth + geopoliticalHealth) / 4;
  
  // Determine status
  let status: string;
  if (healthScore > 80) {
    status = 'Excellent - Supply chains operating smoothly';
  } else if (healthScore > 65) {
    status = 'Good - Minor disruptions, manageable risks';
  } else if (healthScore > 50) {
    status = 'Fair - Moderate disruptions, elevated risks';
  } else if (healthScore > 35) {
    status = 'Poor - Significant disruptions, high risks';
  } else {
    status = 'Critical - Severe disruptions, extreme risks';
  }
  
  // Determine trend (simulated - would compare to historical data)
  const trend: 'improving' | 'stable' | 'deteriorating' = 
    healthScore > 70 ? 'stable' :
    healthScore > 50 ? 'deteriorating' :
    'deteriorating';
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (disruptions.length === 0) {
    riskLevel = 'low';
  } else {
    const maxSeverity = Math.max(...disruptions.map(d => d.severity));
    if (maxSeverity > 80) {
      riskLevel = 'critical';
    } else if (maxSeverity > 65) {
      riskLevel = 'high';
    } else if (maxSeverity > 50) {
      riskLevel = 'medium';
    }
  }
  
  return {
    healthScore,
    status,
    trend,
    riskLevel,
    dataSource: metrics.dataSource || 'static'
  };
}

/**
 * Get supply chain service status for UI display
 */
export function getSupplyChainServiceStatus(): {
  services: { name: string; status: 'live' | 'cached' | 'static' | 'offline'; apiKeyRequired: boolean }[];
} {
  return {
    services: supplyChainDataService.getServiceStatus()
  };
}