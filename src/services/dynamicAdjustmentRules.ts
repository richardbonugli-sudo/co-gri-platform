/**
 * Dynamic Adjustment Rules Engine - Phase 2 Task 2
 * 
 * Defines rules for dynamic multiplier adjustments based on:
 * - Geopolitical events
 * - Market conditions
 * - Country-specific factors
 * - Sector-specific factors
 * - Channel-specific factors
 */

import {
  calculateAggregateEventImpact,
  getEventsForCountry,
  getEventsForSector,
  type GeopoliticalEvent
} from './geopoliticalEventMonitor';
import {
  calculateMarketConditionAdjustment,
  getMarketConditionSummary
} from './marketConditionAnalyzer';

export interface DynamicAdjustment {
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  baseMultiplier: number;
  geopoliticalAdjustment: number;
  marketConditionAdjustment: number;
  totalAdjustment: number;
  adjustedMultiplier: number;
  confidence: number;
  reasons: string[];
  appliedRules: string[];
}

export interface DynamicAdjustmentResult {
  country: string;
  sector: string;
  timestamp: string;
  adjustments: {
    revenue: DynamicAdjustment;
    supply: DynamicAdjustment;
    assets: DynamicAdjustment;
    financial: DynamicAdjustment;
  };
  blendedAdjustment: number;
  overallConfidence: number;
  summary: string;
}

/**
 * Adjustment rule definitions
 */
export interface AdjustmentRule {
  id: string;
  name: string;
  description: string;
  condition: (context: AdjustmentContext) => boolean;
  adjustment: (context: AdjustmentContext) => number;
  channels: Array<'Revenue' | 'Supply' | 'Assets' | 'Financial'>;
  priority: number; // 1-10, higher = more important
}

export interface AdjustmentContext {
  country: string;
  sector: string;
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  baseMultiplier: number;
  geopoliticalEvents: ReturnType<typeof getEventsForCountry>;
  marketConditions: ReturnType<typeof getMarketConditionSummary>;
  currentDate: Date;
}

/**
 * Dynamic adjustment rules
 */
export const ADJUSTMENT_RULES: AdjustmentRule[] = [
  {
    id: 'RULE-001',
    name: 'Active Sanctions Adjustment',
    description: 'Increase multiplier for countries under active sanctions',
    condition: (ctx) => {
      const sanctionEvents = ctx.geopoliticalEvents.filter(e => e.type === 'sanctions');
      return sanctionEvents.length > 0;
    },
    adjustment: (ctx) => {
      const sanctionEvents = ctx.geopoliticalEvents.filter(e => e.type === 'sanctions');
      const totalSeverity = sanctionEvents.reduce((sum, e) => sum + e.severity, 0);
      return Math.min(totalSeverity / 50, 0.20); // Cap at 0.20
    },
    channels: ['Revenue', 'Supply', 'Assets', 'Financial'],
    priority: 10
  },
  {
    id: 'RULE-002',
    name: 'Military Conflict Adjustment',
    description: 'Increase multiplier for countries in active military conflicts',
    condition: (ctx) => {
      const conflictEvents = ctx.geopoliticalEvents.filter(e => e.type === 'military_conflict');
      return conflictEvents.length > 0;
    },
    adjustment: (ctx) => {
      const conflictEvents = ctx.geopoliticalEvents.filter(e => e.type === 'military_conflict');
      const maxSeverity = Math.max(...conflictEvents.map(e => e.severity));
      return Math.min(maxSeverity / 40, 0.25); // Cap at 0.25
    },
    channels: ['Revenue', 'Supply', 'Assets'],
    priority: 9
  },
  {
    id: 'RULE-003',
    name: 'Currency Crisis Adjustment',
    description: 'Increase multiplier for countries with currency stress',
    condition: (ctx) => {
      const marketAdj = calculateMarketConditionAdjustment(ctx.country, ctx.sector);
      return marketAdj.breakdown.currency.stressLevel === 'high' || 
             marketAdj.breakdown.currency.stressLevel === 'critical';
    },
    adjustment: (ctx) => {
      const marketAdj = calculateMarketConditionAdjustment(ctx.country, ctx.sector);
      return marketAdj.currencyAdjustment;
    },
    channels: ['Revenue', 'Financial'],
    priority: 8
  },
  {
    id: 'RULE-004',
    name: 'Supply Chain Disruption Adjustment',
    description: 'Increase supply channel multiplier during logistics disruptions',
    condition: (ctx) => {
      return ctx.channel === 'Supply' && ctx.geopoliticalEvents.some(e => 
        e.tags.includes('supply_chain') || e.tags.includes('logistics')
      );
    },
    adjustment: (ctx) => {
      const supplyEvents = ctx.geopoliticalEvents.filter(e => 
        e.tags.includes('supply_chain') || e.tags.includes('logistics')
      );
      return Math.min(supplyEvents.length * 0.05, 0.15);
    },
    channels: ['Supply'],
    priority: 9
  },
  {
    id: 'RULE-005',
    name: 'Asset Seizure Risk Adjustment',
    description: 'Increase assets channel multiplier when asset seizure risk is high',
    condition: (ctx) => {
      return ctx.channel === 'Assets' && ctx.geopoliticalEvents.some(e => 
        e.tags.includes('asset_seizures') || e.type === 'regime_change'
      );
    },
    adjustment: (ctx) => {
      const assetRiskEvents = ctx.geopoliticalEvents.filter(e => 
        e.tags.includes('asset_seizures') || e.type === 'regime_change'
      );
      const maxSeverity = Math.max(...assetRiskEvents.map(e => e.severity), 0);
      return Math.min(maxSeverity / 30, 0.30); // Cap at 0.30
    },
    channels: ['Assets'],
    priority: 10
  },
  {
    id: 'RULE-006',
    name: 'Banking Sanctions Adjustment',
    description: 'Increase financial channel multiplier for banking sanctions',
    condition: (ctx) => {
      return ctx.channel === 'Financial' && ctx.geopoliticalEvents.some(e => 
        e.tags.includes('banking_sanctions') || e.tags.includes('swift_restrictions')
      );
    },
    adjustment: (ctx) => {
      const bankingEvents = ctx.geopoliticalEvents.filter(e => 
        e.tags.includes('banking_sanctions') || e.tags.includes('swift_restrictions')
      );
      return Math.min(bankingEvents.length * 0.10, 0.30);
    },
    channels: ['Financial'],
    priority: 10
  },
  {
    id: 'RULE-007',
    name: 'High Market Volatility Adjustment',
    description: 'Increase all multipliers during high market volatility',
    condition: (ctx) => {
      return ctx.marketConditions.volatilityIndex > 30;
    },
    adjustment: (ctx) => {
      return Math.min((ctx.marketConditions.volatilityIndex - 30) / 200, 0.10);
    },
    channels: ['Revenue', 'Supply', 'Assets', 'Financial'],
    priority: 6
  },
  {
    id: 'RULE-008',
    name: 'Commodity Price Volatility Adjustment',
    description: 'Increase multipliers for sectors affected by commodity price swings',
    condition: (ctx) => {
      const marketAdj = calculateMarketConditionAdjustment(ctx.country, ctx.sector);
      return marketAdj.breakdown.commodity.stressLevel === 'high' || 
             marketAdj.breakdown.commodity.stressLevel === 'critical';
    },
    adjustment: (ctx) => {
      const marketAdj = calculateMarketConditionAdjustment(ctx.country, ctx.sector);
      return marketAdj.commodityAdjustment;
    },
    channels: ['Supply', 'Revenue'],
    priority: 7
  },
  {
    id: 'RULE-009',
    name: 'Technology Sector Export Controls',
    description: 'Increase multipliers for technology sector under export controls',
    condition: (ctx) => {
      return ctx.sector === 'Technology' && ctx.geopoliticalEvents.some(e => 
        e.tags.includes('export_controls') || e.tags.includes('technology_transfer')
      );
    },
    adjustment: (ctx) => {
      return 0.15;
    },
    channels: ['Revenue', 'Supply'],
    priority: 9
  },
  {
    id: 'RULE-010',
    name: 'Energy Sector Sanctions',
    description: 'Increase multipliers for energy sector under sanctions',
    condition: (ctx) => {
      return ctx.sector === 'Energy' && ctx.geopoliticalEvents.some(e => 
        e.tags.includes('oil_sanctions') || e.tags.includes('energy_crisis')
      );
    },
    adjustment: (ctx) => {
      return 0.18;
    },
    channels: ['Revenue', 'Supply', 'Financial'],
    priority: 9
  }
];

/**
 * Calculate dynamic adjustment for a specific channel
 */
export function calculateDynamicAdjustment(
  country: string,
  sector: string,
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial',
  baseMultiplier: number,
  currentDate: Date = new Date()
): DynamicAdjustment {
  console.log(`[Dynamic Adjustment] Calculating for ${country} - ${sector} - ${channel}`);
  
  // Get context
  const geopoliticalEvents = getEventsForCountry(country, currentDate);
  const marketConditions = getMarketConditionSummary();
  
  const context: AdjustmentContext = {
    country,
    sector,
    channel,
    baseMultiplier,
    geopoliticalEvents,
    marketConditions,
    currentDate
  };
  
  // Calculate geopolitical adjustment
  const eventImpact = calculateAggregateEventImpact(country, channel, currentDate);
  const geopoliticalAdjustment = eventImpact.totalImpact;
  
  // Calculate market condition adjustment
  const marketAdj = calculateMarketConditionAdjustment(country, sector);
  const marketConditionAdjustment = marketAdj.totalAdjustment;
  
  // Apply rules
  const appliedRules: string[] = [];
  const reasons: string[] = [];
  let ruleAdjustment = 0;
  
  const relevantRules = ADJUSTMENT_RULES
    .filter(rule => rule.channels.includes(channel))
    .sort((a, b) => b.priority - a.priority);
  
  relevantRules.forEach(rule => {
    if (rule.condition(context)) {
      const adj = rule.adjustment(context);
      ruleAdjustment += adj;
      appliedRules.push(rule.id);
      reasons.push(`${rule.name}: +${(adj * 100).toFixed(1)}%`);
      console.log(`[Dynamic Adjustment]   Applied ${rule.id}: +${(adj * 100).toFixed(2)}%`);
    }
  });
  
  // Add event-specific reasons
  eventImpact.events.forEach(event => {
    if (event.impact > 0.01) {
      reasons.push(`${event.name}: +${(event.impact * 100).toFixed(1)}%`);
    }
  });
  
  // Total adjustment (cap at 0.50)
  const totalAdjustment = Math.min(
    geopoliticalAdjustment + marketConditionAdjustment + ruleAdjustment,
    0.50
  );
  
  const adjustedMultiplier = baseMultiplier + totalAdjustment;
  
  // Calculate confidence (decreases with more adjustments)
  const confidence = Math.max(0.70, 0.95 - (appliedRules.length * 0.05));
  
  console.log(`[Dynamic Adjustment]   Base: ${baseMultiplier.toFixed(4)}, Adjusted: ${adjustedMultiplier.toFixed(4)}`);
  
  return {
    channel,
    baseMultiplier,
    geopoliticalAdjustment,
    marketConditionAdjustment,
    totalAdjustment,
    adjustedMultiplier,
    confidence,
    reasons,
    appliedRules
  };
}

/**
 * Calculate dynamic adjustments for all channels
 */
export function calculateAllDynamicAdjustments(
  country: string,
  sector: string,
  baseMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  },
  currentDate: Date = new Date()
): DynamicAdjustmentResult {
  console.log(`[Dynamic Adjustment] ===== CALCULATING DYNAMIC ADJUSTMENTS =====`);
  console.log(`[Dynamic Adjustment] Country: ${country}, Sector: ${sector}`);
  
  const adjustments = {
    revenue: calculateDynamicAdjustment(country, sector, 'Revenue', baseMultipliers.revenue, currentDate),
    supply: calculateDynamicAdjustment(country, sector, 'Supply', baseMultipliers.supply, currentDate),
    assets: calculateDynamicAdjustment(country, sector, 'Assets', baseMultipliers.assets, currentDate),
    financial: calculateDynamicAdjustment(country, sector, 'Financial', baseMultipliers.financial, currentDate)
  };
  
  // Calculate blended adjustment using four-channel weights
  const weights = { revenue: 0.40, supply: 0.35, assets: 0.15, financial: 0.10 };
  const blendedAdjustment = 
    adjustments.revenue.adjustedMultiplier * weights.revenue +
    adjustments.supply.adjustedMultiplier * weights.supply +
    adjustments.assets.adjustedMultiplier * weights.assets +
    adjustments.financial.adjustedMultiplier * weights.financial;
  
  // Calculate overall confidence
  const overallConfidence = (
    adjustments.revenue.confidence * weights.revenue +
    adjustments.supply.confidence * weights.supply +
    adjustments.assets.confidence * weights.assets +
    adjustments.financial.confidence * weights.financial
  );
  
  // Generate summary
  const totalRules = new Set([
    ...adjustments.revenue.appliedRules,
    ...adjustments.supply.appliedRules,
    ...adjustments.assets.appliedRules,
    ...adjustments.financial.appliedRules
  ]).size;
  
  const summary = `Applied ${totalRules} dynamic adjustment rules. Blended multiplier: ${blendedAdjustment.toFixed(4)}x (${((blendedAdjustment - 1) * 100).toFixed(1)}% above baseline)`;
  
  console.log(`[Dynamic Adjustment] ${summary}`);
  console.log(`[Dynamic Adjustment] ===== DYNAMIC ADJUSTMENTS COMPLETE =====`);
  
  return {
    country,
    sector,
    timestamp: currentDate.toISOString(),
    adjustments,
    blendedAdjustment,
    overallConfidence,
    summary
  };
}

/**
 * Get adjustment rules summary
 */
export function getAdjustmentRulesSummary(): {
  totalRules: number;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  highPriorityRules: AdjustmentRule[];
} {
  const byChannel: Record<string, number> = {
    Revenue: 0,
    Supply: 0,
    Assets: 0,
    Financial: 0
  };
  
  const byPriority: Record<string, number> = {};
  
  ADJUSTMENT_RULES.forEach(rule => {
    rule.channels.forEach(channel => {
      byChannel[channel]++;
    });
    byPriority[rule.priority.toString()] = (byPriority[rule.priority.toString()] || 0) + 1;
  });
  
  const highPriorityRules = ADJUSTMENT_RULES.filter(rule => rule.priority >= 8);
  
  return {
    totalRules: ADJUSTMENT_RULES.length,
    byChannel,
    byPriority,
    highPriorityRules
  };
}