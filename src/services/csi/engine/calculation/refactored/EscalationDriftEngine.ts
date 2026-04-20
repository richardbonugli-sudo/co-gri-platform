/**
 * Escalation Drift Engine - Phase 3A Complete
 * Calculates probability-weighted pre-event risk (Escalation Drift)
 * 
 * Phase 3A Changes:
 * - Per-factor drift tracking with separate drift calculation for each CSIRiskFactor
 * - Factor-scoped activeSignals storage (Map<country, Map<factor, Signal[]>>)
 * - Enhanced signal validation: exactly one risk_factor, expectation-based probability
 * - Cross-factor drift accumulation prevention with validation
 * - Source role enforcement (DETECTION sources only for signals)
 * - Updated getDriftBreakdown() with per-factor caps and decay stats
 * - Updated isSignalRelevantToEventType() to use CSI risk factors
 * 
 * Formula: Escalation_Drift = Σ(Signal × Probability × Persistence × Recency × Decay)
 * 
 * Constraints:
 * - Max drift per signal: 0.25 CSI points
 * - Max cumulative drift per factor per 30 days: 1.0 CSI points
 * - Escalation rate: 2x de-escalation rate (asymmetric)
 * - Every signal MUST have exactly one CSI risk factor
 * - Drift contributions ONLY accumulate within the same factor
 * - Cross-factor drift accumulation is PROHIBITED
 */

import { 
  Signal, 
  CSIRiskFactor, 
  FactorDriftContribution,
  SourceRole,
  ValidationResult,
  validateSignalRiskFactor,
  validateSourceRole
} from './types';
import { DecayScheduler, decayScheduler } from './DecayScheduler';
import { csiValidator } from './CSIValidator';

export interface EscalationDriftConfig {
  max_drift_per_signal: number; // 0.25 CSI points
  max_cumulative_drift_per_factor_per_30_days: number; // 1.0 CSI points per factor
  escalation_rate_multiplier: number; // 2.0 (escalation 2x faster than de-escalation)
  recency_decay_lambda: number; // 0.05
  persistence_threshold_hours: number; // 72 hours for full persistence factor
}

export interface DriftHistory {
  country: string;
  date: Date;
  total_drift: number;
  drift_by_factor: Map<CSIRiskFactor, number>;
  contributions: FactorDriftContribution[];
  signal_count: number;
}

/**
 * Factor-scoped signal storage structure
 * Enables efficient factor-level operations and prevents cross-factor contamination
 */
interface FactorScopedSignals {
  [country: string]: Map<CSIRiskFactor, Signal[]>;
}

export class EscalationDriftEngine {
  private config: EscalationDriftConfig;
  private driftHistory: Map<string, DriftHistory> = new Map();
  
  // Phase 3A: Factor-scoped active signals storage
  private activeSignalsByFactor: FactorScopedSignals = {};
  
  private decayScheduler: DecayScheduler;
  
  // Validation tracking
  private crossFactorAttempts: number = 0;
  private invalidSignalAttempts: number = 0;

  constructor(config?: Partial<EscalationDriftConfig>, customDecayScheduler?: DecayScheduler) {
    this.config = {
      max_drift_per_signal: 0.25,
      max_cumulative_drift_per_factor_per_30_days: 1.0,
      escalation_rate_multiplier: 2.0,
      recency_decay_lambda: 0.05,
      persistence_threshold_hours: 72,
      ...config
    };
    
    // Use provided decay scheduler or create a new one (not singleton for isolation)
    this.decayScheduler = customDecayScheduler || new DecayScheduler();
  }

  /**
   * Calculate total escalation drift for a country at a given timestamp
   * Aggregates across all factors
   */
  async calculate(country: string, timestamp: Date): Promise<number> {
    const driftByFactor = await this.calculateByFactor(country, timestamp);
    
    // Sum across all factors
    let totalDrift = 0;
    for (const drift of driftByFactor.values()) {
      totalDrift += drift;
    }
    
    return totalDrift;
  }

  /**
   * Calculate escalation drift broken down by CSI risk factor
   * This is the core method that enforces factor-scoped operations
   * Phase 3A: Enhanced with strict factor boundary enforcement
   */
  async calculateByFactor(
    country: string,
    timestamp: Date
  ): Promise<Map<CSIRiskFactor, number>> {
    const driftByFactor = new Map<CSIRiskFactor, number>();
    const contributionsByFactor = new Map<CSIRiskFactor, FactorDriftContribution[]>();

    // Initialize all factors
    for (const factor of Object.values(CSIRiskFactor)) {
      driftByFactor.set(factor, 0);
      contributionsByFactor.set(factor, []);
    }

    // Get factor-scoped signals
    const signalsByFactor = this.getSignalsByFactor(country);
    
    if (signalsByFactor.size === 0) {
      return driftByFactor;
    }

    // Process each factor independently (NO cross-factor operations)
    for (const [factor, signals] of signalsByFactor.entries()) {
      const factorContributions: FactorDriftContribution[] = [];
      
      for (const signal of signals) {
        // Phase 3A: Strict validation at calculation time
        const validationResults = this.validateSignalForDrift(signal);
        const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
        
        if (errors.length > 0) {
          console.error(`Signal validation failed for ${signal.signal_id}:`, errors);
          this.invalidSignalAttempts++;
          continue; // Skip invalid signals
        }

        // Phase 3A: Enforce factor boundaries
        if (signal.risk_factor !== factor) {
          console.error(
            `Cross-factor contamination detected: Signal ${signal.signal_id} ` +
            `has factor ${signal.risk_factor} but stored in ${factor}`
          );
          this.crossFactorAttempts++;
          continue; // Skip contaminated signals
        }
        
        // Update decay status for this signal
        await this.decayScheduler.updateDecayStatus(signal, timestamp);
        
        // Calculate contribution with decay applied (factor-scoped)
        const contribution = await this.calculateSignalContributionWithDecay(signal, timestamp);
        
        // Verify contribution is for correct factor
        if (contribution.factor !== factor) {
          console.error(
            `Contribution factor mismatch: Expected ${factor}, got ${contribution.factor}`
          );
          this.crossFactorAttempts++;
          continue;
        }
        
        factorContributions.push(contribution);
        
              }
      
      contributionsByFactor.set(factor, factorContributions);
    }

    // Apply per-factor drift caps and accumulate (factor-isolated)
    for (const [factor, contributions] of contributionsByFactor.entries()) {
      let factorDrift = contributions.reduce((sum, c) => sum + c.capped_contribution, 0);
      
      // Apply 30-day cumulative drift cap PER FACTOR (no cross-factor pooling)
      factorDrift = this.applyFactorDriftCap(country, factor, factorDrift, timestamp);
      
      driftByFactor.set(factor, factorDrift);
    }

    // Store drift history for audit
    const allContributions = Array.from(contributionsByFactor.values()).flat();
    const totalDrift = Array.from(driftByFactor.values()).reduce((sum, d) => sum + d, 0);
    this.recordDriftHistory(country, totalDrift, driftByFactor, allContributions, timestamp);

    return driftByFactor;
  }

  /**
   * Phase 3A: Comprehensive signal validation for drift calculation
   * Validates:
   * 1. Exactly one risk_factor
   * 2. Expectation-based probability (0-1 range)
   * 3. Source role enforcement (DETECTION only)
   * 4. No cross-factor contamination
   */
  private validateSignalForDrift(signal: Signal): ValidationResult[] {
    const results: ValidationResult[] = [];

    // 1. Validate exactly one risk_factor
    const factorValidation = validateSignalRiskFactor(signal);
    results.push(factorValidation);

    // 2. Validate expectation-based probability (0-1 range)
    if (signal.probability < 0 || signal.probability > 1) {
      results.push({
        check_name: 'probability_expectation_based',
        passed: false,
        message: `Signal ${signal.signal_id} has invalid probability ${signal.probability}. Must be 0-1 (expectation-based, not frequency).`,
        severity: 'ERROR'
      });
    } else {
      results.push({
        check_name: 'probability_expectation_based',
        passed: true,
        message: `Signal ${signal.signal_id} has valid expectation-based probability: ${signal.probability}`,
        severity: 'INFO'
      });
    }

    // 3. Validate source role enforcement (DETECTION only)
    if (!signal.sources || signal.sources.length === 0) {
      results.push({
        check_name: 'signal_sources_required',
        passed: false,
        message: `Signal ${signal.signal_id} has no sources`,
        severity: 'ERROR'
      });
    } else {
      for (const source of signal.sources) {
        const roleValidation = validateSourceRole(source, SourceRole.DETECTION, 'signal_generation');
        results.push(roleValidation);
      }
    }

    // 4. Validate severity range
    if (signal.severity < 0 || signal.severity > 1) {
      results.push({
        check_name: 'signal_severity_range',
        passed: false,
        message: `Signal ${signal.signal_id} has invalid severity ${signal.severity}. Must be 0-1.`,
        severity: 'ERROR'
      });
    }

    return results;
  }

  /**
   * Calculate individual signal's contribution to drift WITH DECAY
   * Phase 3A: Enhanced with factor boundary enforcement
   */
  private async calculateSignalContributionWithDecay(
    signal: Signal,
    timestamp: Date
  ): Promise<FactorDriftContribution> {
    // Base severity (0-1.0)
    const baseSeverity = Math.max(0, Math.min(1, signal.severity));
    
    // Probability of materialization (0-1.0, expectation-based)
    const probability = Math.max(0, Math.min(1, signal.probability));
    
    // Persistence factor (0-1.0, capped at threshold hours)
    const persistenceFactor = this.calculatePersistenceFactor(signal, timestamp);
    
    // Recency factor (exponential decay based on last update)
    const recencyFactor = this.calculateRecencyFactor(signal, timestamp);
    
    // Get decay factor from decay scheduler
    const decayedValue = await this.decayScheduler.calculateDecayedValue(signal.signal_id, timestamp);
    
    // Get or create decay schedule to get initial drift
    let schedule = this.decayScheduler.getSchedule(signal.signal_id);
    if (!schedule) {
      // Calculate initial drift without decay
      const initialDrift = baseSeverity * probability;
      schedule = await this.decayScheduler.scheduleDecay(signal, initialDrift);
    }
    
    // Decay factor is ratio of current to initial, bounded to [0, 1]
    let decayFactor = 1.0;
    if (schedule.initial_drift > 0 && decayedValue > 0) {
      decayFactor = Math.max(0, Math.min(1, decayedValue / schedule.initial_drift));
    } else if (decayedValue === 0 && schedule.status === 'EXPIRED') {
      decayFactor = 0;
    }
    
    // Combined contribution (before per-signal capping)
    const rawContribution = baseSeverity * probability * persistenceFactor * recencyFactor * decayFactor;
    
    // Ensure non-negative
    const boundedContribution = Math.max(0, rawContribution);
    
    // Apply per-signal cap
    const cappedContribution = Math.min(boundedContribution, this.config.max_drift_per_signal);
    
    return {
      factor: signal.risk_factor,  // Factor from signal (validated)
      signal_id: signal.signal_id,
      base_severity: baseSeverity,
      probability,
      persistence_factor: persistenceFactor,
      recency_factor: recencyFactor,
      decay_factor: decayFactor,
      contribution: boundedContribution,
      capped_contribution: cappedContribution
    };
  }

  /**
   * Calculate persistence factor based on how long signal has been active
   */
  private calculatePersistenceFactor(signal: Signal, currentTime: Date): number {
    const hoursSinceDetection = (currentTime.getTime() - signal.detected_date.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceDetection < 0) {
            return 0;
    }
    
    const persistenceFactor = Math.min(1.0, hoursSinceDetection / this.config.persistence_threshold_hours);
    return Math.max(0, persistenceFactor);
  }

  /**
   * Calculate recency factor with exponential decay
   */
  private calculateRecencyFactor(signal: Signal, currentTime: Date): number {
    const daysSinceUpdate = (currentTime.getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 0) {
      return 1.0;
    }
    
    const recencyFactor = Math.exp(-this.config.recency_decay_lambda * daysSinceUpdate);
    return Math.max(0, Math.min(1, recencyFactor));
  }

  /**
   * Apply 30-day cumulative drift cap PER FACTOR
   * Phase 3A: Enforces no cross-factor drift accumulation
   */
  private applyFactorDriftCap(
    country: string,
    factor: CSIRiskFactor,
    rawDrift: number,
    timestamp: Date
  ): number {
    // Get drift history for past 30 days FOR THIS FACTOR ONLY
    const history = this.getFactorDriftHistory(country, factor, 30, timestamp);
    const cumulativeDrift = history.reduce((sum, h) => {
      const factorDrift = h.drift_by_factor.get(factor) || 0;
      return sum + factorDrift;
    }, 0);
    
    // Check if adding rawDrift would exceed 30-day cap for this factor
    if (cumulativeDrift + rawDrift > this.config.max_cumulative_drift_per_factor_per_30_days) {
      const remainingCapacity = this.config.max_cumulative_drift_per_factor_per_30_days - cumulativeDrift;
      return Math.max(0, remainingCapacity);
    }
    
    return rawDrift;
  }

  /**
   * Get drift history for a specific factor within a time window
   */
  private getFactorDriftHistory(
    country: string,
    factor: CSIRiskFactor,
    days: number,
    currentTime: Date
  ): DriftHistory[] {
    const cutoffTime = new Date(currentTime.getTime() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.driftHistory.values()).filter(h =>
      h.country === country &&
      h.date >= cutoffTime &&
      h.date <= currentTime &&
      h.drift_by_factor.has(factor)
    );
  }

  /**
   * Record drift history for audit trail
   */
  private recordDriftHistory(
    country: string,
    totalDrift: number,
    driftByFactor: Map<CSIRiskFactor, number>,
    contributions: FactorDriftContribution[],
    timestamp: Date
  ): void {
    const historyKey = `${country}-${timestamp.toISOString().split('T')[0]}`;
    
    this.driftHistory.set(historyKey, {
      country,
      date: timestamp,
      total_drift: totalDrift,
      drift_by_factor: new Map(driftByFactor),
      contributions,
      signal_count: contributions.length
    });
  }

  /**
   * Phase 3A: Get active signals with their drift contributions
   * Returns per-factor breakdown with decay stats
   */
  async getActiveSignalsWithContributions(country: string): Promise<FactorDriftContribution[]> {
    const signalsByFactor = this.getSignalsByFactor(country);
    const currentTime = new Date();
    
    const contributions: FactorDriftContribution[] = [];
    for (const [factor, signals] of signalsByFactor.entries()) {
      for (const signal of signals) {
        const contribution = await this.calculateSignalContributionWithDecay(signal, currentTime);
        contributions.push(contribution);
      }
    }
    
    return contributions;
  }

  /**
   * Phase 3A: Get active signals for a specific factor (factor-scoped access)
   */
  getActiveSignalsByFactor(country: string, factor: CSIRiskFactor): Signal[] {
    if (!this.activeSignalsByFactor[country]) {
      return [];
    }
    
    return this.activeSignalsByFactor[country].get(factor) || [];
  }

  /**
   * Phase 3A: Get all signals grouped by factor (factor-scoped structure)
   */
  private getSignalsByFactor(country: string): Map<CSIRiskFactor, Signal[]> {
    if (!this.activeSignalsByFactor[country]) {
      return new Map();
    }
    
    return this.activeSignalsByFactor[country];
  }

  /**
   * Get all active signals for a country (flattened)
   */
  getActiveSignals(country: string): Signal[] {
    const signalsByFactor = this.getSignalsByFactor(country);
    const allSignals: Signal[] = [];
    
    for (const signals of signalsByFactor.values()) {
      allSignals.push(...signals);
    }
    
    return allSignals;
  }

  /**
   * Get total drift for a country (current time)
   */
  async getCurrentDrift(country: string): Promise<number> {
    return this.calculate(country, new Date());
  }

  /**
   * Phase 3A: Get drift breakdown with per-factor caps and decay stats
   * Enhanced to return factor-specific remaining capacity and decay information
   */
  async getDriftBreakdown(country: string): Promise<{
    total: number;
    by_factor: Map<CSIRiskFactor, number>;
    contributions: FactorDriftContribution[];
    cap_applied: boolean;
    remaining_capacity_by_factor: Map<CSIRiskFactor, number>;
    factor_caps: Map<CSIRiskFactor, { current: number; max: number; utilized_pct: number }>;
    decay_stats: {
      total_signals: number;
      signals_by_status: Record<string, number>;
      avg_decay_factor: number;
      by_factor: Map<CSIRiskFactor, {
        signal_count: number;
        avg_decay_factor: number;
        total_contribution: number;
      }>;
    };
  }> {
    const currentTime = new Date();
    const driftByFactor = await this.calculateByFactor(country, currentTime);
    const contributions = await this.getActiveSignalsWithContributions(country);
    
    const total = Array.from(driftByFactor.values()).reduce((sum, d) => sum + d, 0);
    
    // Calculate remaining capacity and utilization per factor
    const remainingCapacityByFactor = new Map<CSIRiskFactor, number>();
    const factorCaps = new Map<CSIRiskFactor, { current: number; max: number; utilized_pct: number }>();
    let capApplied = false;
    
    for (const factor of Object.values(CSIRiskFactor)) {
      const history = this.getFactorDriftHistory(country, factor, 30, currentTime);
      const cumulativeDrift = history.reduce((sum, h) => {
        return sum + (h.drift_by_factor.get(factor) || 0);
      }, 0);
      
      const maxCap = this.config.max_cumulative_drift_per_factor_per_30_days;
      const remaining = Math.max(0, maxCap - cumulativeDrift);
      const utilizedPct = (cumulativeDrift / maxCap) * 100;
      
      remainingCapacityByFactor.set(factor, remaining);
      factorCaps.set(factor, {
        current: cumulativeDrift,
        max: maxCap,
        utilized_pct: utilizedPct
      });
      
      if (remaining < maxCap) {
        capApplied = true;
      }
    }
    
    // Calculate decay stats per factor
    const decayStatsByFactor = new Map<CSIRiskFactor, {
      signal_count: number;
      avg_decay_factor: number;
      total_contribution: number;
    }>();
    
    const signalsByStatus: Record<string, number> = {
      ACTIVE: 0,
      DECAYING: 0,
      EXPIRED: 0
    };
    
    let totalDecayFactor = 0;
    let totalSignals = 0;
    
    for (const factor of Object.values(CSIRiskFactor)) {
      const factorSignals = this.getActiveSignalsByFactor(country, factor);
      const factorContributions = contributions.filter(c => c.factor === factor);
      
      let factorDecaySum = 0;
      let factorContributionSum = 0;
      
      for (const signal of factorSignals) {
        const schedule = this.decayScheduler.getSchedule(signal.signal_id);
        if (schedule) {
          signalsByStatus[schedule.status]++;
        }
        
        const contribution = factorContributions.find(c => c.signal_id === signal.signal_id);
        if (contribution) {
          factorDecaySum += contribution.decay_factor;
          factorContributionSum += contribution.capped_contribution;
          totalDecayFactor += contribution.decay_factor;
          totalSignals++;
        }
      }
      
      decayStatsByFactor.set(factor, {
        signal_count: factorSignals.length,
        avg_decay_factor: factorSignals.length > 0 ? factorDecaySum / factorSignals.length : 0,
        total_contribution: factorContributionSum
      });
    }
    
    return {
      total,
      by_factor: driftByFactor,
      contributions,
      cap_applied: capApplied,
      remaining_capacity_by_factor: remainingCapacityByFactor,
      factor_caps: factorCaps,
      decay_stats: {
        total_signals: totalSignals,
        signals_by_status: signalsByStatus,
        avg_decay_factor: totalSignals > 0 ? totalDecayFactor / totalSignals : 0,
        by_factor: decayStatsByFactor
      }
    ,

    remaining_capacity: total < this.config.max_cumulative_drift_per_factor_per_30_days ? this.config.max_cumulative_drift_per_factor_per_30_days - total : 0

    };
  }

  /**
   * Phase 3A: Add a signal to the factor-scoped active signals store
   * Validates signal before adding and enforces factor-scoped storage
   */
  addSignal(country: string, signal: Signal): void {
    // Phase 3A: Comprehensive validation before adding
    const validationResults = this.validateSignalForDrift(signal);
    const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
    
    if (errors.length > 0) {
      this.invalidSignalAttempts++;
      console.error(`Cannot add invalid signal ${signal.signal_id}:`, errors);
      throw new Error(`Signal validation failed: ${errors.map(e => e.message).join('; ')}`);
    }

    // Initialize country's factor map if needed
    if (!this.activeSignalsByFactor[country]) {
      this.activeSignalsByFactor[country] = new Map();
    }
    
    const factorMap = this.activeSignalsByFactor[country];
    const factor = signal.risk_factor;
    
    // Initialize factor's signal array if needed
    if (!factorMap.has(factor)) {
      factorMap.set(factor, []);
    }
    
    const signals = factorMap.get(factor)!;
    signals.push(signal);
    
    // Initialize decay schedule with bounded initial drift
    const initialDrift = Math.max(0, Math.min(1, signal.severity * signal.probability));
    this.decayScheduler.scheduleDecay(signal, initialDrift);
  }

  /**
   * Phase 3A: Remove a signal (factor-scoped removal)
   */
  removeSignal(country: string, signalId: string): void {
    if (!this.activeSignalsByFactor[country]) {
      return;
    }
    
    const factorMap = this.activeSignalsByFactor[country];
    
    // Search across all factors to find and remove the signal
    for (const [factor, signals] of factorMap.entries()) {
      const filtered = signals.filter(s => s.signal_id !== signalId);
      if (filtered.length < signals.length) {
        factorMap.set(factor, filtered);
        break;
      }
    }
    
    // Expire the decay schedule
    this.decayScheduler.expireSignal(signalId);
  }

  /**
   * Phase 3A: Update signal (factor-scoped update with validation)
   */
  updateSignal(country: string, signalId: string, updates: Partial<Signal>): void {
    if (!this.activeSignalsByFactor[country]) {
      return;
    }
    
    const factorMap = this.activeSignalsByFactor[country];
    
    // Find signal across all factors
    for (const [factor, signals] of factorMap.entries()) {
      const signal = signals.find(s => s.signal_id === signalId);
      
      if (signal) {
        // Phase 3A: Prevent factor changes via update
        if (updates.risk_factor && updates.risk_factor !== signal.risk_factor) {
          console.error(
            `Cannot change signal risk_factor via update. ` +
            `Signal ${signalId} is ${signal.risk_factor}, attempted change to ${updates.risk_factor}`
          );
          this.crossFactorAttempts++;
          throw new Error('Cannot change signal risk_factor via update. Remove and re-add signal instead.');
        }
        
        Object.assign(signal, updates);
        signal.last_updated = new Date();
        
        // Update decay schedule (resets inactivity window)
        this.decayScheduler.updateDecayStatus(signal);
        break;
      }
    }
  }

  /**
   * Phase 3A: Get drift attribution for event netting (same factor only)
   * Updated to use CSI risk factors instead of generic event types
   */
  async getDriftAttributionForEvent(
    country: string,
    factor: CSIRiskFactor,
    eventType: string,
    eventDate: Date
  ): Promise<number> {
    // Simply return the total drift for this factor at the event date
    // This allows events to net against any drift in their factor
    const driftByFactor = await this.calculateByFactor(country, eventDate);
    const factorDrift = driftByFactor.get(factor) || 0;
    
        
        
    return factorDrift;
  }

  /**
   * Phase 3A: Check if signal is relevant to event using CSI risk factors
   * Replaces old isSignalRelevantToEventType() with factor-based logic
   */
  private isSignalRelevantToEvent(
    signal: Signal,
    eventFactor: CSIRiskFactor,
    eventType: string
  ): boolean {
    // First check: signal and event must be in same factor
    if (signal.risk_factor !== eventFactor) {
      return false;
    }
    
    // Second check: signal type must be relevant to event type within the factor
    // Factor-specific signal-to-event mappings
    const factorMappings: Record<CSIRiskFactor, Record<string, string[]>> = {
      [CSIRiskFactor.TRADE_LOGISTICS]: {
        'tariff_imposed': ['tariff_threat', 'trade_investigation', 'trade_dispute_signal'],
        'trade_barrier': ['trade_restriction_signal', 'quota_warning'],
        'logistics_disruption': ['supply_chain_warning', 'port_closure_signal']
      },
      [CSIRiskFactor.SANCTIONS_REGULATORY]: {
        'sanctions_imposed': ['sanctions_warning', 'diplomatic_freeze', 'sanctions_threat'],
        'regulatory_change': ['policy_signal', 'regulatory_warning', 'compliance_alert']
      },
      [CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]: {
        'capital_controls': ['capital_control_warning', 'currency_crisis_signal', 'fx_restriction_signal'],
        'currency_devaluation': ['currency_pressure_signal', 'forex_intervention_signal']
      },
      [CSIRiskFactor.CONFLICT_SECURITY]: {
        'conflict_outbreak': ['conflict_escalation', 'military_buildup', 'border_tension_signal'],
        'military_action': ['military_mobilization_signal', 'security_threat_signal']
      },
      [CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]: {
        'political_crisis': ['political_instability_signal', 'governance_deterioration_signal'],
        'leadership_change': ['succession_crisis_signal', 'coup_threat_signal']
      },
      [CSIRiskFactor.PUBLIC_UNREST_CIVIL]: {
        'civil_unrest': ['protest_signal', 'social_tension_signal', 'unrest_escalation'],
        'mass_protest': ['mobilization_signal', 'strike_threat_signal']
      },
      [CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]: {
        'cyber_attack': ['cyber_threat_signal', 'vulnerability_alert'],
        'data_breach': ['security_incident_signal', 'data_sovereignty_threat']
      }
    };
    
    const factorMapping = factorMappings[eventFactor];
    if (!factorMapping) {
      return false;
    }
    
    const relevantSignalTypes = factorMapping[eventType] || [];
    return relevantSignalTypes.includes(signal.signal_type);
  }

  /**
   * Clear all history and active signals (for testing)
   */
  clearHistory(): void {
    this.driftHistory.clear();
    this.activeSignalsByFactor = {};
    this.crossFactorAttempts = 0;
    this.invalidSignalAttempts = 0;
  }

  /**
   * Clear old drift history (cleanup)
   */
  cleanupOldHistory(daysToKeep: number = 90): void {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    for (const [key, history] of this.driftHistory.entries()) {
      if (history.date < cutoffTime) {
        this.driftHistory.delete(key);
      }
    }
    
    // Also cleanup decay scheduler
    this.decayScheduler.cleanupExpiredSchedules();
  }

  /**
   * Get configuration
   */
  getConfig(): EscalationDriftConfig {
    return { ...this.config };
  }

  /**
   * Phase 3A: Get system health metrics with factor info and validation tracking
   */
  getHealthMetrics(): {
    total_countries: number;
    total_active_signals: number;
    signals_by_factor: Record<CSIRiskFactor, number>;
    avg_drift_per_country: number;
    drift_history_entries: number;
    decay_scheduler_health: any;
    validation_stats: {
      cross_factor_attempts_blocked: number;
      invalid_signal_attempts_blocked: number;
    };
  } {
    const totalCountries = Object.keys(this.activeSignalsByFactor).length;
    
    // Count signals by factor
    const signalsByFactor: Record<CSIRiskFactor, number> = {} as any;
    for (const factor of Object.values(CSIRiskFactor)) {
      signalsByFactor[factor] = 0;
    }
    
    let totalSignals = 0;
    for (const factorMap of Object.values(this.activeSignalsByFactor)) {
      for (const [factor, signals] of factorMap.entries()) {
        signalsByFactor[factor] += signals.length;
        totalSignals += signals.length;
      }
    }
    
    let totalDrift = 0;
    for (const country of Object.keys(this.activeSignalsByFactor)) {
      const drift = this.calculate(country, new Date());
      totalDrift += drift;
    }
    
    return {
      total_countries: totalCountries,
      total_active_signals: totalSignals,
      signals_by_factor: signalsByFactor,
      avg_drift_per_country: totalCountries > 0 ? totalDrift / totalCountries : 0,
      drift_history_entries: this.driftHistory.size,
      decay_scheduler_health: this.decayScheduler.getHealthMetrics(),
      validation_stats: {
        cross_factor_attempts_blocked: this.crossFactorAttempts,
        invalid_signal_attempts_blocked: this.invalidSignalAttempts
      }
    };
  }

  /**
   * Get decay scheduler instance (for advanced usage)
   */
  getDecayScheduler(): DecayScheduler {
    return this.decayScheduler;
  }

  /**
   * Phase 3A: Validate no cross-factor drift accumulation
   * Returns validation results for audit
   */
  validateNoCrossFactorDrift(country: string): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    const signalsByFactor = this.getSignalsByFactor(country);
    
    for (const [factor, signals] of signalsByFactor.entries()) {
      for (const signal of signals) {
        if (signal.risk_factor !== factor) {
          results.push({
            check_name: 'no_cross_factor_drift',
            passed: false,
            message: `Signal ${signal.signal_id} has factor ${signal.risk_factor} but stored in ${factor}`,
            severity: 'ERROR'
          });
        } else {
          results.push({
            check_name: 'no_cross_factor_drift',
            passed: true,
            message: `Signal ${signal.signal_id} correctly scoped to factor ${factor}`,
            severity: 'INFO'
          });
        }
      }
    }
    
    return results;
  }
}

// Singleton instance
export const escalationDriftEngine = new EscalationDriftEngine();