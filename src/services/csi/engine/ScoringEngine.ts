/**
 * CSI Implementation Verification - Scoring Engine
 * Phase 1A: Core CSI calculation with vector-scoped operations
 */

import {
  CSIRiskVector,
  CSIRiskVectorNames,
  CSIRiskVectorWeights,
  CSITrace,
  CSIVectorTrace,
  SignalTrace,
  EventTrace,
  SignalProcessed,
  EventConfirmed,
  BaselineSnapshot,
  DecaySchedule,
  SignalLifecycleState,
  EventLifecycleState,
  TEST_COUNTRIES
} from '../types/CSITypes';
import { csiDatabase } from '../storage/CSIDatabase';
import { vectorRouter } from './VectorRouter';

// ============================================================================
// CONSTANTS
// ============================================================================

const CSI_CONFIG = {
  // Drift caps
  MAX_DRIFT_PER_SIGNAL: 0.25,           // CSI points per signal
  MAX_CUMULATIVE_DRIFT_30_DAYS: 1.0,    // CSI points per 30 days per factor
  
  // Decay parameters
  DEFAULT_INACTIVITY_WINDOW_DAYS: 30,
  DEFAULT_DECAY_RATE: 0.5,
  DEFAULT_HALF_LIFE_DAYS: 30,
  EXPIRATION_THRESHOLD: 0.01,           // 1% of initial value
  
  // Persistence
  DEFAULT_PERSISTENCE_HOURS: 72,
  
  // Probability
  CORROBORATION_DIVISOR: 5,
  
  // Recency decay
  RECENCY_LAMBDA: 0.05
};

// ============================================================================
// SCORING ENGINE CLASS
// ============================================================================

/**
 * CSI Scoring Engine - computes CSI scores with full auditability
 */
export class ScoringEngine {
  private static instance: ScoringEngine;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ScoringEngine {
    if (!ScoringEngine.instance) {
      ScoringEngine.instance = new ScoringEngine();
    }
    return ScoringEngine.instance;
  }

  // ============================================================================
  // MAIN CSI CALCULATION
  // ============================================================================

  /**
   * Compute complete CSI score for a country at a specific timestamp
   * Returns full trace object for auditability
   */
  public computeCSI(
    countryId: string,
    timestamp: Date,
    baselineAnchorDate?: Date,
    replayRunId?: string
  ): CSITrace {
    const startTime = Date.now();

    // Get country info
    const country = TEST_COUNTRIES.find(c => c.id === countryId);
    const countryName = country?.name || countryId;

    // Initialize vector traces
    const byVector: Record<CSIRiskVector, CSIVectorTrace> = {} as Record<CSIRiskVector, CSIVectorTrace>;
    
    for (const vectorId of Object.values(CSIRiskVector)) {
      byVector[vectorId] = {
        vector_id: vectorId,
        vector_name: CSIRiskVectorNames[vectorId],
        baseline_v: 0,
        drift_v: 0,
        event_delta_v: 0,
        total_v: 0,
        caps_applied_v: {
          drift_cap_applied: false,
          drift_cap_amount: 0,
          cumulative_cap_applied: false,
          cumulative_cap_amount: 0
        },
        active_signals: [],
        active_events: []
      };
    }

    // 1. Compute structural baseline (per vector)
    const baselineResult = this.computeBaseline(countryId, baselineAnchorDate || timestamp);
    for (const vectorId of Object.values(CSIRiskVector)) {
      byVector[vectorId].baseline_v = baselineResult.by_vector[vectorId] || 0;
    }

    // 2. Compute escalation drift (per vector)
    const driftResult = this.computeDrift(countryId, timestamp);
    for (const vectorId of Object.values(CSIRiskVector)) {
      const vectorDrift = driftResult.by_vector[vectorId];
      byVector[vectorId].drift_v = vectorDrift.netted_drift;
      byVector[vectorId].caps_applied_v = vectorDrift.caps_applied;
      byVector[vectorId].active_signals = vectorDrift.signal_traces;
    }

    // 3. Compute event delta (per vector)
    const eventResult = this.computeEventDelta(countryId, timestamp);
    for (const vectorId of Object.values(CSIRiskVector)) {
      const vectorEvent = eventResult.by_vector[vectorId];
      byVector[vectorId].event_delta_v = vectorEvent.total_delta;
      byVector[vectorId].active_events = vectorEvent.event_traces;
    }

    // 4. Calculate totals per vector
    for (const vectorId of Object.values(CSIRiskVector)) {
      byVector[vectorId].total_v = 
        byVector[vectorId].baseline_v + 
        byVector[vectorId].drift_v + 
        byVector[vectorId].event_delta_v;
    }

    // 5. Aggregate totals
    const baseline_total = Object.values(byVector).reduce((sum, v) => sum + v.baseline_v, 0);
    const escalation_drift_total = Object.values(byVector).reduce((sum, v) => sum + v.drift_v, 0);
    const event_delta_total = Object.values(byVector).reduce((sum, v) => sum + v.event_delta_v, 0);
    const csi_total = Math.min(100, Math.max(0, baseline_total + escalation_drift_total + event_delta_total));

    // 6. Calculate metadata
    const active_signals_count = Object.values(byVector).reduce((sum, v) => sum + v.active_signals.length, 0);
    const confirmed_events_count = Object.values(byVector).reduce((sum, v) => sum + v.active_events.length, 0);
    const confidence_score = this.calculateConfidenceScore(byVector);

    // 7. Create trace object
    const trace: CSITrace = {
      trace_id: `trace_${countryId}_${timestamp.toISOString()}`,
      country_id: countryId,
      country_name: countryName,
      timestamp,
      csi_total,
      baseline_total,
      escalation_drift_total,
      event_delta_total,
      by_vector: byVector,
      confidence_score,
      active_signals_count,
      confirmed_events_count,
      replay_run_id: replayRunId,
      computation_time_ms: Date.now() - startTime,
      created_at: new Date()
    };

    // Save trace to database
    csiDatabase.saveCSITrace(trace);

    return trace;
  }

  // ============================================================================
  // COMPONENT 1: STRUCTURAL BASELINE
  // ============================================================================

  /**
   * Compute structural baseline for a country
   * Baseline is anchored and does NOT react to individual events
   */
  public computeBaseline(
    countryId: string,
    anchorDate: Date
  ): { total: number; by_vector: Record<CSIRiskVector, number> } {
    // Get the most recent baseline snapshot prior to anchor date
    const snapshot = csiDatabase.getBaselineSnapshot(countryId, anchorDate);

    if (!snapshot) {
      // Return neutral defaults if no snapshot available
      const defaultBaseline: Record<CSIRiskVector, number> = {
        [CSIRiskVector.CONFLICT_SECURITY]: 5.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 5.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 5.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 5.0,
        [CSIRiskVector.CYBER_DATA]: 5.0,
        [CSIRiskVector.PUBLIC_UNREST]: 5.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 5.0
      };
      return {
        total: 35.0,
        by_vector: defaultBaseline
      };
    }

    return {
      total: snapshot.baseline_total,
      by_vector: snapshot.by_vector
    };
  }

  // ============================================================================
  // COMPONENT 2: ESCALATION DRIFT
  // ============================================================================

  /**
   * Compute escalation drift for a country (per vector)
   * Drift is probability-weighted pre-event risk from signals
   */
  public computeDrift(
    countryId: string,
    timestamp: Date
  ): {
    total: number;
    by_vector: Record<CSIRiskVector, {
      raw_drift: number;
      netted_drift: number;
      caps_applied: {
        drift_cap_applied: boolean;
        drift_cap_amount: number;
        cumulative_cap_applied: boolean;
        cumulative_cap_amount: number;
      };
      signal_traces: SignalTrace[];
    }>;
  } {
    const result: Record<CSIRiskVector, {
      raw_drift: number;
      netted_drift: number;
      caps_applied: {
        drift_cap_applied: boolean;
        drift_cap_amount: number;
        cumulative_cap_applied: boolean;
        cumulative_cap_amount: number;
      };
      signal_traces: SignalTrace[];
    }> = {} as any;

    // Process each vector independently
    for (const vectorId of Object.values(CSIRiskVector)) {
      const signals = csiDatabase.getSignalsByVector(countryId, vectorId, timestamp);
      const signalTraces: SignalTrace[] = [];
      let rawDrift = 0;

      for (const signal of signals) {
        // Calculate signal contribution
        const contribution = this.calculateSignalContribution(signal, timestamp);
        
        // Apply per-signal cap
        const cappedContribution = Math.min(contribution, CSI_CONFIG.MAX_DRIFT_PER_SIGNAL);
        rawDrift += cappedContribution;

        // Create signal trace
        signalTraces.push({
          signal_id: signal.signal_id,
          vector_id: signal.vector_id,
          source_id: signal.source_id,
          source_role: signal.source_role,
          severity: signal.severity,
          base_probability: signal.base_probability,
          adjusted_probability: signal.adjusted_probability,
          drift_contribution: cappedContribution,
          lifecycle_state: signal.lifecycle_state,
          persistence_window_hours: signal.persistence_window_hours,
          decay_status: this.getDecayStatus(signal, timestamp),
          detected_at: signal.detected_at,
          last_updated: signal.last_updated
        });
      }

      // Apply cumulative drift cap (per 30 days per factor)
      let nettedDrift = rawDrift;
      let cumulativeCapApplied = false;
      let cumulativeCapAmount = 0;

      if (nettedDrift > CSI_CONFIG.MAX_CUMULATIVE_DRIFT_30_DAYS) {
        cumulativeCapAmount = nettedDrift - CSI_CONFIG.MAX_CUMULATIVE_DRIFT_30_DAYS;
        nettedDrift = CSI_CONFIG.MAX_CUMULATIVE_DRIFT_30_DAYS;
        cumulativeCapApplied = true;
      }

      result[vectorId] = {
        raw_drift: rawDrift,
        netted_drift: nettedDrift,
        caps_applied: {
          drift_cap_applied: rawDrift !== nettedDrift,
          drift_cap_amount: rawDrift - nettedDrift,
          cumulative_cap_applied: cumulativeCapApplied,
          cumulative_cap_amount: cumulativeCapAmount
        },
        signal_traces: signalTraces
      };
    }

    const total = Object.values(result).reduce((sum, v) => sum + v.netted_drift, 0);

    return { total, by_vector: result };
  }

  /**
   * Calculate individual signal contribution
   * Formula: Severity × Probability × Persistence × Recency × Decay
   */
  private calculateSignalContribution(signal: SignalProcessed, timestamp: Date): number {
    const severity = signal.severity;
    const probability = signal.adjusted_probability;
    const persistenceFactor = this.calculatePersistenceFactor(signal, timestamp);
    const recencyFactor = this.calculateRecencyFactor(signal, timestamp);
    const decayFactor = this.calculateDecayFactor(signal, timestamp);

    return severity * probability * persistenceFactor * recencyFactor * decayFactor;
  }

  /**
   * Calculate persistence factor
   * Persistence_Factor(t) = min(1.0, hours_since_detection / threshold_hours)
   */
  private calculatePersistenceFactor(signal: SignalProcessed, timestamp: Date): number {
    const hoursSinceDetection = (timestamp.getTime() - signal.detected_at.getTime()) / (1000 * 60 * 60);
    const thresholdHours = signal.persistence_window_hours || CSI_CONFIG.DEFAULT_PERSISTENCE_HOURS;
    return Math.min(1.0, hoursSinceDetection / thresholdHours);
  }

  /**
   * Calculate recency factor
   * Recency_Factor(t) = e^(-λ × days_since_last_update)
   */
  private calculateRecencyFactor(signal: SignalProcessed, timestamp: Date): number {
    const daysSinceUpdate = (timestamp.getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    return Math.exp(-CSI_CONFIG.RECENCY_LAMBDA * daysSinceUpdate);
  }

  /**
   * Calculate decay factor for signal
   */
  private calculateDecayFactor(signal: SignalProcessed, timestamp: Date): number {
    const daysSinceUpdate = (timestamp.getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    const inactivityWindow = CSI_CONFIG.DEFAULT_INACTIVITY_WINDOW_DAYS;

    if (daysSinceUpdate < inactivityWindow) {
      return 1.0; // Active phase
    }

    // Decaying phase
    const daysInDecay = daysSinceUpdate - inactivityWindow;
    const decayRate = signal.decay_rate || CSI_CONFIG.DEFAULT_DECAY_RATE;
    return Math.exp(-CSI_CONFIG.RECENCY_LAMBDA * daysInDecay * decayRate);
  }

  /**
   * Get decay status string for signal
   */
  private getDecayStatus(signal: SignalProcessed, timestamp: Date): string {
    const daysSinceUpdate = (timestamp.getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    const inactivityWindow = CSI_CONFIG.DEFAULT_INACTIVITY_WINDOW_DAYS;

    if (daysSinceUpdate < inactivityWindow) {
      return 'ACTIVE';
    }

    const decayFactor = this.calculateDecayFactor(signal, timestamp);
    if (decayFactor < CSI_CONFIG.EXPIRATION_THRESHOLD) {
      return 'EXPIRED';
    }

    return 'DECAYING';
  }

  // ============================================================================
  // COMPONENT 3: EVENT DELTA
  // ============================================================================

  /**
   * Compute event delta for a country (per vector)
   * Event delta = confirmed event impact minus netted prior drift
   */
  public computeEventDelta(
    countryId: string,
    timestamp: Date
  ): {
    total: number;
    by_vector: Record<CSIRiskVector, {
      total_delta: number;
      event_traces: EventTrace[];
    }>;
  } {
    const result: Record<CSIRiskVector, {
      total_delta: number;
      event_traces: EventTrace[];
    }> = {} as any;

    // Process each vector independently
    for (const vectorId of Object.values(CSIRiskVector)) {
      const events = csiDatabase.getEventsByVector(countryId, vectorId, timestamp);
      const eventTraces: EventTrace[] = [];
      let totalDelta = 0;

      for (const event of events) {
        // Calculate event impact with decay
        const impact = this.calculateEventImpact(event, timestamp);
        totalDelta += impact;

        // Create event trace
        eventTraces.push({
          event_id: event.event_id,
          vector_id: event.vector_id,
          event_type: event.event_type,
          confirmation_sources: event.confirmation_sources,
          delta_applied: impact,
          netting_action: event.netting_action,
          decay_schedule: event.decay_schedule,
          confirmed_at: event.confirmation_date
        });
      }

      result[vectorId] = {
        total_delta: totalDelta,
        event_traces: eventTraces
      };
    }

    const total = Object.values(result).reduce((sum, v) => sum + v.total_delta, 0);

    return { total, by_vector: result };
  }

  /**
   * Calculate event impact with decay
   */
  private calculateEventImpact(event: EventConfirmed, timestamp: Date): number {
    if (event.is_permanent) {
      return event.delta_applied;
    }

    // Apply exponential decay
    const daysSinceEffective = (timestamp.getTime() - event.effective_date.getTime()) / (1000 * 60 * 60 * 24);
    const halfLifeDays = event.decay_schedule.half_life_days || CSI_CONFIG.DEFAULT_HALF_LIFE_DAYS;
    const decayFactor = Math.pow(0.5, daysSinceEffective / halfLifeDays);

    return event.delta_applied * decayFactor;
  }

  // ============================================================================
  // CONFIDENCE SCORING
  // ============================================================================

  /**
   * Calculate confidence score (metadata only, does NOT affect CSI math)
   */
  private calculateConfidenceScore(byVector: Record<CSIRiskVector, CSIVectorTrace>): number {
    let totalSignals = 0;
    let weightedConfidence = 0;

    for (const vectorTrace of Object.values(byVector)) {
      for (const signal of vectorTrace.active_signals) {
        totalSignals++;
        // Higher confidence for higher corroboration and recency
        const signalConfidence = Math.min(1.0, signal.adjusted_probability);
        weightedConfidence += signalConfidence;
      }
    }

    if (totalSignals === 0) {
      return 0.5; // Neutral confidence when no signals
    }

    return weightedConfidence / totalSignals;
  }

  // ============================================================================
  // NETTING ENGINE
  // ============================================================================

  /**
   * Apply netting when event confirms prior signals
   * HARD CONSTRAINT: Netting only within the same vector
   */
  public applyEventNetting(
    countryId: string,
    vectorId: CSIRiskVector,
    eventId: string,
    relatedSignalIds: string[]
  ): { netted_drift: number; netting_action: string } {
    let nettedDrift = 0;
    const nettedSignals: string[] = [];

    for (const signalId of relatedSignalIds) {
      const signal = csiDatabase.getSignalProcessed(signalId);
      if (signal && signal.vector_id === vectorId && signal.country_id === countryId) {
        nettedDrift += signal.drift_contribution;
        nettedSignals.push(signalId);
        
        // Update signal state to confirmed
        csiDatabase.updateSignalState(signalId, SignalLifecycleState.CONFIRMED, 0);
      }
    }

    const nettingAction = nettedSignals.length > 0
      ? `Netted ${nettedSignals.length} signals in ${vectorId}: ${nettedSignals.join(', ')}`
      : 'No prior drift to net';

    return { netted_drift: nettedDrift, netting_action: nettingAction };
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Compute CSI for all test countries at a specific timestamp
   */
  public computeCSIForAllCountries(
    timestamp: Date,
    baselineAnchorDate?: Date,
    replayRunId?: string
  ): CSITrace[] {
    const traces: CSITrace[] = [];

    for (const country of TEST_COUNTRIES) {
      const trace = this.computeCSI(country.id, timestamp, baselineAnchorDate, replayRunId);
      traces.push(trace);
    }

    return traces;
  }

  /**
   * Generate time series for a country over a date range
   */
  public generateTimeSeries(
    countryId: string,
    startDate: Date,
    endDate: Date,
    intervalHours: number = 4,
    baselineAnchorDate?: Date,
    replayRunId?: string
  ): CSITrace[] {
    const traces: CSITrace[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const trace = this.computeCSI(countryId, new Date(currentDate), baselineAnchorDate, replayRunId);
      traces.push(trace);
      currentDate.setHours(currentDate.getHours() + intervalHours);
    }

    return traces;
  }
}

// Export singleton instance
export const scoringEngine = ScoringEngine.getInstance();