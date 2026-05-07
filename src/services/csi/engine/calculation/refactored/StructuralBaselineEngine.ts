/**
 * Structural Baseline Engine - Phase 2 Complete
 * Calculates slow-moving institutional risk per CSI risk factor (quarterly updates)
 * 
 * Phase 2 Changes:
 * - Per-factor baseline calculation (no pooled composite)
 * - Removed ENVIRONMENTAL factor completely
 * - Removed macroeconomic contamination (GDP, inflation, debt)
 * - Factor-specific source mappings from Appendix B
 * - Quarterly update enforcement with explicit guards
 * - Event-driven updates explicitly prevented
 * - Factor-based cache structure
 * 
 * Appendix B Reference: Authoritative source for baseline mappings
 */

import { 
  CSIRiskFactor, 
  FactorBaseline, 
  SourceRole, 
  SourceMetadata,
  ValidationResult
} from './types';
import { csiValidator } from './CSIValidator';

interface CachedBaseline {
  value: number;
  timestamp: Date;
  lastUpdated: Date;
  by_factor: Map<CSIRiskFactor, FactorBaseline>;
  nextUpdateDue: Date;  // NEW: Quarterly update enforcement
}

/**
 * Baseline source mappings per CSI risk factor (Appendix B)
 * These are authoritative, slow-moving sources only
 * NO macroeconomic or environmental variables
 */
const BASELINE_SOURCE_MAPPINGS: Record<CSIRiskFactor, SourceMetadata[]> = {
  [CSIRiskFactor.CONFLICT_SECURITY]: [
    {
      source_id: 'ucdp_conflict_index',
      source_name: 'UCDP Conflict Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.95,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.CONFLICT_SECURITY]
    },
    {
      source_id: 'gpi_peace_index',
      source_name: 'Global Peace Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.90,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.CONFLICT_SECURITY]
    },
    {
      source_id: 'iiss_armed_conflict',
      source_name: 'IISS Armed Conflict Database',
      role: SourceRole.BASELINE,
      reliability_score: 0.92,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.CONFLICT_SECURITY]
    }
  ],
  [CSIRiskFactor.SANCTIONS_REGULATORY]: [
    {
      source_id: 'ofac_sanctions_list',
      source_name: 'OFAC Sanctions List',
      role: SourceRole.BASELINE,
      reliability_score: 0.98,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.SANCTIONS_REGULATORY]
    },
    {
      source_id: 'un_sanctions_database',
      source_name: 'UN Sanctions Database',
      role: SourceRole.BASELINE,
      reliability_score: 0.95,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.SANCTIONS_REGULATORY]
    },
    {
      source_id: 'eu_sanctions_map',
      source_name: 'EU Sanctions Map',
      role: SourceRole.BASELINE,
      reliability_score: 0.93,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.SANCTIONS_REGULATORY]
    }
  ],
  [CSIRiskFactor.TRADE_LOGISTICS]: [
    {
      source_id: 'wto_trade_restrictions',
      source_name: 'WTO Trade Restrictions Database',
      role: SourceRole.BASELINE,
      reliability_score: 0.92,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    },
    {
      source_id: 'world_bank_lpi',
      source_name: 'World Bank Logistics Performance Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.88,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    },
    {
      source_id: 'unctad_trade_barriers',
      source_name: 'UNCTAD Non-Tariff Measures Database',
      role: SourceRole.BASELINE,
      reliability_score: 0.85,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }
  ],
  [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]: [
    {
      source_id: 'wgi_governance',
      source_name: 'World Governance Indicators',
      role: SourceRole.BASELINE,
      reliability_score: 0.90,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]
    },
    {
      source_id: 'transparency_cpi',
      source_name: 'Transparency International CPI',
      role: SourceRole.BASELINE,
      reliability_score: 0.88,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]
    },
    {
      source_id: 'freedom_house_index',
      source_name: 'Freedom House Freedom Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.87,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]
    }
  ],
  [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]: [
    {
      source_id: 'itu_cybersecurity_index',
      source_name: 'ITU Global Cybersecurity Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.85,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]
    },
    {
      source_id: 'ncsi_index',
      source_name: 'National Cyber Security Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.82,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]
    },
    {
      source_id: 'oxford_cyber_index',
      source_name: 'Oxford Cybersecurity Capacity Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.80,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]
    }
  ],
  [CSIRiskFactor.PUBLIC_UNREST_CIVIL]: [
    {
      source_id: 'acled_civil_unrest',
      source_name: 'ACLED Civil Unrest Data',
      role: SourceRole.BASELINE,
      reliability_score: 0.90,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.PUBLIC_UNREST_CIVIL]
    },
    {
      source_id: 'mass_mobilization_index',
      source_name: 'Mass Mobilization Project',
      role: SourceRole.BASELINE,
      reliability_score: 0.85,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.PUBLIC_UNREST_CIVIL]
    },
    {
      source_id: 'gdelt_protest_index',
      source_name: 'GDELT Protest and Unrest Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.78,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.PUBLIC_UNREST_CIVIL]
    }
  ],
  [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]: [
    {
      source_id: 'imf_areaer',
      source_name: 'IMF AREAER Database',
      role: SourceRole.BASELINE,
      reliability_score: 0.95,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]
    },
    {
      source_id: 'bis_capital_flows',
      source_name: 'BIS Capital Flow Restrictions',
      role: SourceRole.BASELINE,
      reliability_score: 0.90,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]
    },
    {
      source_id: 'fernandez_capital_controls',
      source_name: 'Fernández et al. Capital Controls Index',
      role: SourceRole.BASELINE,
      reliability_score: 0.85,
      authority_level: 'MEDIUM',
      applicable_factors: [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]
    }
  ]
};

/**
 * CSI Methodology Weights per Factor (Appendix B)
 * These weights reflect the relative importance of each factor in geopolitical risk
 * Total: 100%
 */
const CSI_FACTOR_WEIGHTS: Record<CSIRiskFactor, number> = {
  [CSIRiskFactor.CONFLICT_SECURITY]: 0.25,           // 25% - Highest weight
  [CSIRiskFactor.SANCTIONS_REGULATORY]: 0.20,        // 20%
  [CSIRiskFactor.TRADE_LOGISTICS]: 0.15,             // 15%
  [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]: 0.15,      // 15%
  [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]: 0.12,   // 12%
  [CSIRiskFactor.PUBLIC_UNREST_CIVIL]: 0.08,         // 8%
  [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]: 0.05       // 5% - Emerging risk
};

export class StructuralBaselineEngine {
  private cache: Map<string, CachedBaseline> = new Map();
  private readonly UPDATE_FREQUENCY_DAYS = 90; // Quarterly updates only
  private eventUpdateAttempts: number = 0; // Track event-driven update attempts

  /**
   * Calculate structural baseline for a country (aggregated across all factors)
   * This method enforces quarterly updates and prevents event-driven updates
   */
  async calculate(country: string, timestamp: Date = new Date()): Promise<number> {
    // Check cache first (baseline only updates quarterly)
    const cached = this.getCachedBaseline(country, timestamp);
    if (cached && !this.isStale(cached, timestamp)) {
      return cached.value;
    }

    // Guard: Prevent event-driven updates
    if (cached && !this.isQuarterlyUpdateDue(cached, timestamp)) {
      console.warn(`Baseline update attempted for ${country} outside quarterly schedule. Returning cached value.`);
      return cached.value;
    }

    // Calculate per-factor baselines
    const factorBaselines = await this.calculateAllFactorBaselines(country, timestamp);

    // Aggregate with CSI methodology weights
    const totalBaseline = this.weightedSumByFactor(factorBaselines);

    // Calculate next update due date (90 days from now)
    const nextUpdateDue = new Date(timestamp.getTime() + this.UPDATE_FREQUENCY_DAYS * 24 * 60 * 60 * 1000);

    // Cache result
    this.cacheBaseline(country, totalBaseline, factorBaselines, timestamp, nextUpdateDue);

    return totalBaseline;
  }

  /**
   * Calculate baseline for a specific CSI risk factor
   * Uses factor-specific sources from Appendix B
   */
  async calculateFactorBaseline(
    country: string,
    factor: CSIRiskFactor,
    timestamp: Date = new Date()
  ): Promise<FactorBaseline> {
    // Get sources for this factor from Appendix B mappings
    const sources = BASELINE_SOURCE_MAPPINGS[factor];

    // Validate sources (no macro/environmental contamination)
    const validationResults = csiValidator.validateBaselineSources(
      factor,
      sources.map(s => ({ source_name: s.source_name, role: s.role }))
    );

    const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
    if (errors.length > 0) {
      console.error(`Baseline validation failed for ${country} ${factor}:`, errors);
    }

    // Calculate baseline score from sources
    const baselineValue = await this.calculateFromSources(country, factor, sources);

    return {
      factor,
      value: baselineValue,
      sources,
      last_updated: timestamp,
      calculation_method: 'weighted_average_authoritative_sources_appendix_b',
      is_stale: false
    };
  }

  /**
   * Calculate all factor baselines for a country
   * Processes each of the 7 CSI risk factors independently
   */
  private async calculateAllFactorBaselines(
    country: string,
    timestamp: Date
  ): Promise<Map<CSIRiskFactor, FactorBaseline>> {
    const factorBaselines = new Map<CSIRiskFactor, FactorBaseline>();

    // Process all 7 CSI risk factors (ENVIRONMENTAL removed)
    for (const factor of Object.values(CSIRiskFactor)) {
      const baseline = await this.calculateFactorBaseline(country, factor, timestamp);
      factorBaselines.set(factor, baseline);
    }

    return factorBaselines;
  }

  /**
   * Calculate weighted sum using CSI methodology weights
   * Replaces old weightedSum() with factor-specific weights from Appendix B
   */
  private weightedSumByFactor(factorBaselines: Map<CSIRiskFactor, FactorBaseline>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [factor, baseline] of factorBaselines.entries()) {
      const weight = CSI_FACTOR_WEIGHTS[factor];
      weightedSum += baseline.value * weight;
      totalWeight += weight;
    }

    // Normalize to 0-100 scale
    return totalWeight > 0 ? weightedSum / totalWeight : 50; // Default neutral
  }

  /**
   * Calculate baseline value from authoritative sources
   * This is a placeholder - in production, would fetch from actual data sources
   */
  private async calculateFromSources(
    country: string,
    factor: CSIRiskFactor,
    sources: SourceMetadata[]
  ): Promise<number> {
    // Placeholder implementation
    // In production, this would:
    // 1. Fetch data from each source
    // 2. Normalize to 0-100 scale
    // 3. Weight by reliability_score and authority_level
    // 4. Return weighted average

    let weightedSum = 0;
    let totalWeight = 0;

    for (const source of sources) {
      // Mock data fetch - would be real API calls in production
      const sourceValue = this.mockSourceValue(country, factor, source);
      const weight = source.reliability_score;

      weightedSum += sourceValue * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50; // Default neutral
  }

  /**
   * Mock source value (placeholder for production data fetching)
   * Returns baseline values based on factor
   * NO macroeconomic or environmental variables
   */
  private mockSourceValue(
    country: string,
    factor: CSIRiskFactor,
    source: SourceMetadata
  ): number {
    // Return mock baseline values based on factor
    // In production, this would fetch from actual data sources
    const mockBaselines: Record<CSIRiskFactor, number> = {
      [CSIRiskFactor.CONFLICT_SECURITY]: 45,
      [CSIRiskFactor.SANCTIONS_REGULATORY]: 40,
      [CSIRiskFactor.TRADE_LOGISTICS]: 35,
      [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]: 50,
      [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]: 48,
      [CSIRiskFactor.PUBLIC_UNREST_CIVIL]: 42,
      [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]: 38
    };

    return mockBaselines[factor] || 50;
  }

  /**
   * Get baseline for a specific factor (from cache if available)
   */
  async getFactorBaseline(
    country: string,
    factor: CSIRiskFactor,
    timestamp: Date = new Date()
  ): Promise<FactorBaseline> {
    const cached = this.getCachedBaseline(country, timestamp);
    
    if (cached && !this.isStale(cached, timestamp)) {
      const factorBaseline = cached.by_factor.get(factor);
      if (factorBaseline) {
        return factorBaseline;
      }
    }

    // Recalculate if not in cache or stale
    return this.calculateFactorBaseline(country, factor, timestamp);
  }

  /**
   * Get all factor baselines for a country
   */
  async getAllFactorBaselines(
    country: string,
    timestamp: Date = new Date()
  ): Promise<Map<CSIRiskFactor, FactorBaseline>> {
    const cached = this.getCachedBaseline(country, timestamp);
    
    if (cached && !this.isStale(cached, timestamp)) {
      return cached.by_factor;
    }

    // Recalculate if not in cache or stale
    return this.calculateAllFactorBaselines(country, timestamp);
  }

  /**
   * Get cached baseline
   */
  private getCachedBaseline(country: string, timestamp: Date): CachedBaseline | undefined {
    return this.cache.get(country);
  }

  /**
   * Check if cached baseline is stale (beyond quarterly update)
   */
  private isStale(cached: CachedBaseline, current: Date): boolean {
    const daysSinceUpdate = (current.getTime() - cached.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > this.UPDATE_FREQUENCY_DAYS;
  }

  /**
   * Check if quarterly update is due
   * Enforces quarterly update schedule
   */
  private isQuarterlyUpdateDue(cached: CachedBaseline, current: Date): boolean {
    return current >= cached.nextUpdateDue;
  }

  /**
   * Cache baseline result with factor-based structure
   */
  private cacheBaseline(
    country: string,
    value: number,
    byFactor: Map<CSIRiskFactor, FactorBaseline>,
    timestamp: Date,
    nextUpdateDue: Date
  ): void {
    this.cache.set(country, {
      value,
      timestamp,
      lastUpdated: new Date(),
      by_factor: byFactor,
      nextUpdateDue
    });
  }

  /**
   * Attempt to update baseline (with event-driven guard)
   * This method explicitly prevents event-driven updates
   */
  attemptUpdate(country: string, reason: string, timestamp: Date = new Date()): boolean {
    const cached = this.getCachedBaseline(country, timestamp);
    
    if (!cached) {
      // No cache, allow initial calculation
      return true;
    }

    if (reason === 'event' || reason === 'signal') {
      this.eventUpdateAttempts++;
      console.warn(
        `Baseline update blocked for ${country}. Reason: ${reason}. ` +
        `Baseline does NOT react to individual events or signals. ` +
        `Next scheduled update: ${cached.nextUpdateDue.toISOString()}`
      );
      return false;
    }

    if (this.isQuarterlyUpdateDue(cached, timestamp)) {
      return true;
    }

    console.warn(
      `Baseline update blocked for ${country}. ` +
      `Quarterly update not yet due. Next update: ${cached.nextUpdateDue.toISOString()}`
    );
    return false;
  }

  /**
   * Get baseline metadata with quarterly schedule info
   */
  getBaselineMetadata(country: string): {
    value: number;
    lastUpdated: Date;
    isStale: boolean;
    nextUpdateDue?: Date;
    by_factor?: Map<CSIRiskFactor, FactorBaseline>;
  } | undefined {
    const cached = this.cache.get(country);
    if (!cached) return undefined;

    return {
      value: cached.value,
      lastUpdated: cached.lastUpdated,
      isStale: this.isStale(cached, new Date()),
      nextUpdateDue: cached.nextUpdateDue,
      by_factor: cached.by_factor
    };
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(country?: string): void {
    if (country) {
      this.cache.delete(country);
    } else {
      this.cache.clear();
    }
    this.eventUpdateAttempts = 0;
  }

  /**
   * Cleanup old cache entries (for maintenance)
   */
  cleanupOldCache(daysToKeep: number = 90): void {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    for (const [country, cached] of this.cache.entries()) {
      if (cached.timestamp < cutoffTime) {
        this.cache.delete(country);
      }
    }
  }

  /**
   * Get health metrics for monitoring with factor coverage
   */
  getHealthMetrics(): {
    cached_countries: number;
    stale_count: number;
    avg_baseline_value: number;
    oldest_cache_age_days: number;
    factor_coverage: Record<CSIRiskFactor, number>;
    event_update_attempts_blocked: number;
    next_updates_due: Array<{ country: string; due_date: Date }>;
  } {
    const allCached = Array.from(this.cache.values());
    const now = new Date();
    
    let staleCount = 0;
    let totalValue = 0;
    let oldestAge = 0;
    const factorCoverage: Record<CSIRiskFactor, number> = {} as any;
    const nextUpdatesDue: Array<{ country: string; due_date: Date }> = [];

    // Initialize factor coverage
    for (const factor of Object.values(CSIRiskFactor)) {
      factorCoverage[factor] = 0;
    }
    
    for (const [country, cached] of this.cache.entries()) {
      if (this.isStale(cached, now)) {
        staleCount++;
      }
      totalValue += cached.value;
      
      const ageDays = (now.getTime() - cached.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > oldestAge) {
        oldestAge = ageDays;
      }

      // Count factor coverage
      for (const factor of cached.by_factor.keys()) {
        factorCoverage[factor]++;
      }

      // Track next updates due
      nextUpdatesDue.push({
        country,
        due_date: cached.nextUpdateDue
      });
    }
    
    // Sort by due date
    nextUpdatesDue.sort((a, b) => a.due_date.getTime() - b.due_date.getTime());
    
    return {
      cached_countries: allCached.length,
      stale_count: staleCount,
      avg_baseline_value: allCached.length > 0 ? totalValue / allCached.length : 0,
      oldest_cache_age_days: oldestAge,
      factor_coverage: factorCoverage,
      event_update_attempts_blocked: this.eventUpdateAttempts,
      next_updates_due: nextUpdatesDue.slice(0, 10) // Top 10 upcoming updates
    };
  }

  /**
   * Get CSI factor weights (for transparency)
   */
  getFactorWeights(): Record<CSIRiskFactor, number> {
    return { ...CSI_FACTOR_WEIGHTS };
  }

  /**
   * Get baseline sources for a factor (for transparency)
   */
  getFactorSources(factor: CSIRiskFactor): SourceMetadata[] {
    return [...BASELINE_SOURCE_MAPPINGS[factor]];
  }

  /**
   * Validate baseline configuration
   * Ensures no macro/environmental contamination
   */
  validateConfiguration(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Validate all factor sources
    for (const factor of Object.values(CSIRiskFactor)) {
      const sources = BASELINE_SOURCE_MAPPINGS[factor];
      const factorResults = csiValidator.validateBaselineSources(
        factor,
        sources.map(s => ({ source_name: s.source_name, role: s.role }))
      );
      results.push(...factorResults);
    }

    // Validate weights sum to 1.0
    const totalWeight = Object.values(CSI_FACTOR_WEIGHTS).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      results.push({
        check_name: 'factor_weights_sum',
        passed: false,
        message: `Factor weights sum to ${totalWeight}, expected 1.0`,
        severity: 'ERROR'
      });
    } else {
      results.push({
        check_name: 'factor_weights_sum',
        passed: true,
        message: 'Factor weights correctly sum to 1.0',
        severity: 'INFO'
      });
    }

    return results;
  }
}

// Singleton instance
export const structuralBaselineEngine = new StructuralBaselineEngine();