/**
 * Adjustment History Tracker - Phase 2 Task 2
 * 
 * Tracks all dynamic multiplier adjustments with timestamps and reasons.
 * Provides audit trail and rollback capabilities.
 */

import type { DynamicAdjustmentResult } from './dynamicAdjustmentRules';

export interface AdjustmentHistoryEntry {
  id: string;
  timestamp: string;
  country: string;
  sector: string;
  ticker?: string;
  adjustmentType: 'dynamic' | 'manual' | 'rollback';
  adjustments: {
    revenue: {
      before: number;
      after: number;
      change: number;
      reasons: string[];
    };
    supply: {
      before: number;
      after: number;
      change: number;
      reasons: string[];
    };
    assets: {
      before: number;
      after: number;
      change: number;
      reasons: string[];
    };
    financial: {
      before: number;
      after: number;
      change: number;
      reasons: string[];
    };
  };
  blendedMultiplier: {
    before: number;
    after: number;
    change: number;
  };
  appliedRules: string[];
  confidence: number;
  triggeredBy: string; // 'system', 'user', 'event'
  notes?: string;
}

export interface AdjustmentAuditTrail {
  ticker: string;
  totalAdjustments: number;
  firstAdjustment: string;
  lastAdjustment: string;
  history: AdjustmentHistoryEntry[];
  currentMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
    blended: number;
  };
  baselineMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
    blended: number;
  };
}

/**
 * In-memory adjustment history storage
 * In production, this would be persisted to database
 */
const ADJUSTMENT_HISTORY: Map<string, AdjustmentHistoryEntry[]> = new Map();

/**
 * Generate unique ID for adjustment entry
 */
function generateAdjustmentId(): string {
  return `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log dynamic adjustment
 */
export function logDynamicAdjustment(
  result: DynamicAdjustmentResult,
  baseMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  },
  ticker?: string,
  triggeredBy: string = 'system',
  notes?: string
): AdjustmentHistoryEntry {
  const id = generateAdjustmentId();
  
  const entry: AdjustmentHistoryEntry = {
    id,
    timestamp: result.timestamp,
    country: result.country,
    sector: result.sector,
    ticker,
    adjustmentType: 'dynamic',
    adjustments: {
      revenue: {
        before: baseMultipliers.revenue,
        after: result.adjustments.revenue.adjustedMultiplier,
        change: result.adjustments.revenue.totalAdjustment,
        reasons: result.adjustments.revenue.reasons
      },
      supply: {
        before: baseMultipliers.supply,
        after: result.adjustments.supply.adjustedMultiplier,
        change: result.adjustments.supply.totalAdjustment,
        reasons: result.adjustments.supply.reasons
      },
      assets: {
        before: baseMultipliers.assets,
        after: result.adjustments.assets.adjustedMultiplier,
        change: result.adjustments.assets.totalAdjustment,
        reasons: result.adjustments.assets.reasons
      },
      financial: {
        before: baseMultipliers.financial,
        after: result.adjustments.financial.adjustedMultiplier,
        change: result.adjustments.financial.totalAdjustment,
        reasons: result.adjustments.financial.reasons
      }
    },
    blendedMultiplier: {
      before: (baseMultipliers.revenue * 0.40 + baseMultipliers.supply * 0.35 + 
               baseMultipliers.assets * 0.15 + baseMultipliers.financial * 0.10),
      after: result.blendedAdjustment,
      change: result.blendedAdjustment - (baseMultipliers.revenue * 0.40 + baseMultipliers.supply * 0.35 + 
                                          baseMultipliers.assets * 0.15 + baseMultipliers.financial * 0.10)
    },
    appliedRules: [
      ...result.adjustments.revenue.appliedRules,
      ...result.adjustments.supply.appliedRules,
      ...result.adjustments.assets.appliedRules,
      ...result.adjustments.financial.appliedRules
    ],
    confidence: result.overallConfidence,
    triggeredBy,
    notes
  };
  
  // Store in history
  const key = ticker || `${result.country}-${result.sector}`;
  const history = ADJUSTMENT_HISTORY.get(key) || [];
  history.push(entry);
  ADJUSTMENT_HISTORY.set(key, history);
  
  console.log(`[Adjustment History] Logged adjustment ${id} for ${key}`);
  console.log(`[Adjustment History]   Blended: ${entry.blendedMultiplier.before.toFixed(4)} → ${entry.blendedMultiplier.after.toFixed(4)} (${entry.blendedMultiplier.change >= 0 ? '+' : ''}${(entry.blendedMultiplier.change * 100).toFixed(2)}%)`);
  
  return entry;
}

/**
 * Log manual adjustment
 */
export function logManualAdjustment(
  country: string,
  sector: string,
  adjustments: {
    revenue?: number;
    supply?: number;
    assets?: number;
    financial?: number;
  },
  baseMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  },
  reason: string,
  ticker?: string,
  triggeredBy: string = 'user'
): AdjustmentHistoryEntry {
  const id = generateAdjustmentId();
  
  const entry: AdjustmentHistoryEntry = {
    id,
    timestamp: new Date().toISOString(),
    country,
    sector,
    ticker,
    adjustmentType: 'manual',
    adjustments: {
      revenue: {
        before: baseMultipliers.revenue,
        after: adjustments.revenue || baseMultipliers.revenue,
        change: (adjustments.revenue || baseMultipliers.revenue) - baseMultipliers.revenue,
        reasons: [reason]
      },
      supply: {
        before: baseMultipliers.supply,
        after: adjustments.supply || baseMultipliers.supply,
        change: (adjustments.supply || baseMultipliers.supply) - baseMultipliers.supply,
        reasons: [reason]
      },
      assets: {
        before: baseMultipliers.assets,
        after: adjustments.assets || baseMultipliers.assets,
        change: (adjustments.assets || baseMultipliers.assets) - baseMultipliers.assets,
        reasons: [reason]
      },
      financial: {
        before: baseMultipliers.financial,
        after: adjustments.financial || baseMultipliers.financial,
        change: (adjustments.financial || baseMultipliers.financial) - baseMultipliers.financial,
        reasons: [reason]
      }
    },
    blendedMultiplier: {
      before: (baseMultipliers.revenue * 0.40 + baseMultipliers.supply * 0.35 + 
               baseMultipliers.assets * 0.15 + baseMultipliers.financial * 0.10),
      after: ((adjustments.revenue || baseMultipliers.revenue) * 0.40 + 
              (adjustments.supply || baseMultipliers.supply) * 0.35 + 
              (adjustments.assets || baseMultipliers.assets) * 0.15 + 
              (adjustments.financial || baseMultipliers.financial) * 0.10),
      change: 0 // Will be calculated
    },
    appliedRules: [],
    confidence: 1.0, // Manual adjustments have full confidence
    triggeredBy,
    notes: `Manual adjustment: ${reason}`
  };
  
  entry.blendedMultiplier.change = entry.blendedMultiplier.after - entry.blendedMultiplier.before;
  
  // Store in history
  const key = ticker || `${country}-${sector}`;
  const history = ADJUSTMENT_HISTORY.get(key) || [];
  history.push(entry);
  ADJUSTMENT_HISTORY.set(key, history);
  
  console.log(`[Adjustment History] Logged manual adjustment ${id} for ${key}`);
  
  return entry;
}

/**
 * Rollback to baseline multipliers
 */
export function rollbackToBaseline(
  country: string,
  sector: string,
  baselineMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  },
  ticker?: string,
  reason: string = 'Rollback to baseline'
): AdjustmentHistoryEntry {
  const key = ticker || `${country}-${sector}`;
  const history = ADJUSTMENT_HISTORY.get(key) || [];
  
  if (history.length === 0) {
    console.warn(`[Adjustment History] No history found for ${key}, nothing to rollback`);
    throw new Error(`No adjustment history found for ${key}`);
  }
  
  const lastEntry = history[history.length - 1];
  const id = generateAdjustmentId();
  
  const entry: AdjustmentHistoryEntry = {
    id,
    timestamp: new Date().toISOString(),
    country,
    sector,
    ticker,
    adjustmentType: 'rollback',
    adjustments: {
      revenue: {
        before: lastEntry.adjustments.revenue.after,
        after: baselineMultipliers.revenue,
        change: baselineMultipliers.revenue - lastEntry.adjustments.revenue.after,
        reasons: [reason]
      },
      supply: {
        before: lastEntry.adjustments.supply.after,
        after: baselineMultipliers.supply,
        change: baselineMultipliers.supply - lastEntry.adjustments.supply.after,
        reasons: [reason]
      },
      assets: {
        before: lastEntry.adjustments.assets.after,
        after: baselineMultipliers.assets,
        change: baselineMultipliers.assets - lastEntry.adjustments.assets.after,
        reasons: [reason]
      },
      financial: {
        before: lastEntry.adjustments.financial.after,
        after: baselineMultipliers.financial,
        change: baselineMultipliers.financial - lastEntry.adjustments.financial.after,
        reasons: [reason]
      }
    },
    blendedMultiplier: {
      before: lastEntry.blendedMultiplier.after,
      after: (baselineMultipliers.revenue * 0.40 + baselineMultipliers.supply * 0.35 + 
              baselineMultipliers.assets * 0.15 + baselineMultipliers.financial * 0.10),
      change: 0 // Will be calculated
    },
    appliedRules: [],
    confidence: 1.0,
    triggeredBy: 'system',
    notes: reason
  };
  
  entry.blendedMultiplier.change = entry.blendedMultiplier.after - entry.blendedMultiplier.before;
  
  history.push(entry);
  ADJUSTMENT_HISTORY.set(key, history);
  
  console.log(`[Adjustment History] Rolled back ${key} to baseline`);
  
  return entry;
}

/**
 * Get adjustment history for ticker or country-sector
 */
export function getAdjustmentHistory(
  ticker?: string,
  country?: string,
  sector?: string
): AdjustmentHistoryEntry[] {
  const key = ticker || (country && sector ? `${country}-${sector}` : null);
  
  if (!key) {
    console.warn(`[Adjustment History] Invalid query: must provide ticker or country+sector`);
    return [];
  }
  
  return ADJUSTMENT_HISTORY.get(key) || [];
}

/**
 * Get audit trail for ticker
 */
export function getAuditTrail(
  ticker: string,
  baselineMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  }
): AdjustmentAuditTrail {
  const history = getAdjustmentHistory(ticker);
  
  if (history.length === 0) {
    const baselineBlended = (baselineMultipliers.revenue * 0.40 + baselineMultipliers.supply * 0.35 + 
                             baselineMultipliers.assets * 0.15 + baselineMultipliers.financial * 0.10);
    
    return {
      ticker,
      totalAdjustments: 0,
      firstAdjustment: 'N/A',
      lastAdjustment: 'N/A',
      history: [],
      currentMultipliers: {
        ...baselineMultipliers,
        blended: baselineBlended
      },
      baselineMultipliers: {
        ...baselineMultipliers,
        blended: baselineBlended
      }
    };
  }
  
  const lastEntry = history[history.length - 1];
  const baselineBlended = (baselineMultipliers.revenue * 0.40 + baselineMultipliers.supply * 0.35 + 
                           baselineMultipliers.assets * 0.15 + baselineMultipliers.financial * 0.10);
  
  return {
    ticker,
    totalAdjustments: history.length,
    firstAdjustment: history[0].timestamp,
    lastAdjustment: lastEntry.timestamp,
    history,
    currentMultipliers: {
      revenue: lastEntry.adjustments.revenue.after,
      supply: lastEntry.adjustments.supply.after,
      assets: lastEntry.adjustments.assets.after,
      financial: lastEntry.adjustments.financial.after,
      blended: lastEntry.blendedMultiplier.after
    },
    baselineMultipliers: {
      ...baselineMultipliers,
      blended: baselineBlended
    }
  };
}

/**
 * Get adjustment statistics
 */
export function getAdjustmentStatistics(): {
  totalAdjustments: number;
  byType: Record<string, number>;
  byTrigger: Record<string, number>;
  averageConfidence: number;
  mostAdjustedTickers: Array<{ ticker: string; count: number }>;
} {
  let totalAdjustments = 0;
  const byType: Record<string, number> = {};
  const byTrigger: Record<string, number> = {};
  let totalConfidence = 0;
  const tickerCounts: Map<string, number> = new Map();
  
  ADJUSTMENT_HISTORY.forEach((history, key) => {
    totalAdjustments += history.length;
    
    history.forEach(entry => {
      byType[entry.adjustmentType] = (byType[entry.adjustmentType] || 0) + 1;
      byTrigger[entry.triggeredBy] = (byTrigger[entry.triggeredBy] || 0) + 1;
      totalConfidence += entry.confidence;
      
      if (entry.ticker) {
        tickerCounts.set(entry.ticker, (tickerCounts.get(entry.ticker) || 0) + 1);
      }
    });
  });
  
  const mostAdjustedTickers = Array.from(tickerCounts.entries())
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalAdjustments,
    byType,
    byTrigger,
    averageConfidence: totalAdjustments > 0 ? totalConfidence / totalAdjustments : 0,
    mostAdjustedTickers
  };
}

/**
 * Clear adjustment history (for testing)
 */
export function clearAdjustmentHistory(ticker?: string): void {
  if (ticker) {
    ADJUSTMENT_HISTORY.delete(ticker);
    console.log(`[Adjustment History] Cleared history for ${ticker}`);
  } else {
    ADJUSTMENT_HISTORY.clear();
    console.log(`[Adjustment History] Cleared all history`);
  }
}

/**
 * Export adjustment history to JSON
 */
export function exportAdjustmentHistory(ticker?: string): string {
  if (ticker) {
    const history = getAdjustmentHistory(ticker);
    return JSON.stringify(history, null, 2);
  } else {
    const allHistory: Record<string, AdjustmentHistoryEntry[]> = {};
    ADJUSTMENT_HISTORY.forEach((history, key) => {
      allHistory[key] = history;
    });
    return JSON.stringify(allHistory, null, 2);
  }
}

/**
 * Generate adjustment report
 */
export function generateAdjustmentReport(ticker: string): string {
  const auditTrail = getAuditTrail(ticker, {
    revenue: 1.00,
    supply: 1.05,
    assets: 1.03,
    financial: 1.02
  });
  
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push(`DYNAMIC MULTIPLIER ADJUSTMENT REPORT`);
  lines.push(`Ticker: ${ticker}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Adjustments: ${auditTrail.totalAdjustments}`);
  lines.push(`First Adjustment: ${auditTrail.firstAdjustment}`);
  lines.push(`Last Adjustment: ${auditTrail.lastAdjustment}`);
  lines.push('');
  
  lines.push('CURRENT MULTIPLIERS');
  lines.push('-'.repeat(80));
  lines.push(`Revenue:   ${auditTrail.currentMultipliers.revenue.toFixed(4)}x (Baseline: ${auditTrail.baselineMultipliers.revenue.toFixed(4)}x)`);
  lines.push(`Supply:    ${auditTrail.currentMultipliers.supply.toFixed(4)}x (Baseline: ${auditTrail.baselineMultipliers.supply.toFixed(4)}x)`);
  lines.push(`Assets:    ${auditTrail.currentMultipliers.assets.toFixed(4)}x (Baseline: ${auditTrail.baselineMultipliers.assets.toFixed(4)}x)`);
  lines.push(`Financial: ${auditTrail.currentMultipliers.financial.toFixed(4)}x (Baseline: ${auditTrail.baselineMultipliers.financial.toFixed(4)}x)`);
  lines.push(`Blended:   ${auditTrail.currentMultipliers.blended.toFixed(4)}x (Baseline: ${auditTrail.baselineMultipliers.blended.toFixed(4)}x)`);
  lines.push('');
  
  lines.push('ADJUSTMENT HISTORY');
  lines.push('-'.repeat(80));
  
  auditTrail.history.forEach((entry, index) => {
    lines.push('');
    lines.push(`${index + 1}. ${entry.adjustmentType.toUpperCase()} - ${entry.timestamp}`);
    lines.push(`   ID: ${entry.id}`);
    lines.push(`   Triggered By: ${entry.triggeredBy}`);
    lines.push(`   Confidence: ${(entry.confidence * 100).toFixed(1)}%`);
    lines.push(`   Blended: ${entry.blendedMultiplier.before.toFixed(4)} → ${entry.blendedMultiplier.after.toFixed(4)} (${entry.blendedMultiplier.change >= 0 ? '+' : ''}${(entry.blendedMultiplier.change * 100).toFixed(2)}%)`);
    
    if (entry.appliedRules.length > 0) {
      lines.push(`   Applied Rules: ${entry.appliedRules.join(', ')}`);
    }
    
    if (entry.notes) {
      lines.push(`   Notes: ${entry.notes}`);
    }
  });
  
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('END OF REPORT');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}