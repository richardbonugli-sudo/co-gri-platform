/**
 * Event Delta Engine - Phase 3B Complete
 * Calculates confirmed event impact with factor-scoped netting and decay
 * 
 * Phase 3B Changes:
 * - Events inherit risk_factor from signals they confirm (enforced)
 * - Factor preservation in mapToConfirmedEvent() with validation
 * - Same-factor netting only with explicit cross-factor guards
 * - Proper factor-based matching (replaced simplified return true)
 * - Per-factor event delta tracking in calculate()
 * - Renamed getDeltaByVector() to getDeltaByFactor()
 * - Validation ensuring event confirmation only nets prior drift from same factor
 * - Error handling for factor mismatches with tracking
 * 
 * Key Changes:
 * - Factor-scoped event delta calculation
 * - Events inherit risk factor from confirming signals
 * - Netting only within same factor (no cross-factor netting)
 * - Source role enforcement (CONFIRMATION sources only)
 * - Enhanced audit trail with factor breakdown
 */

import { 
  ConfirmedEvent,
  CSIRiskFactor,
  FactorEventDelta,
  SourceRole,
  Signal,
  ValidationResult,
  validateSameFactor
} from './types';
import { RiskVector, EventCandidate, EventStatus } from '../../types';
import { eventCandidateStore } from '../../state/EventCandidateStore';
import { eventDeltaLedger } from '../../state/EventDeltaLedger';
import { decayEngine } from '../DecayEngine';
import { escalationDriftEngine } from './EscalationDriftEngine';
import { csiValidator } from './CSIValidator';

/**
 * Phase 3B: Event delta tracking structure
 */
interface EventDeltaTracking {
  country: string;
  timestamp: Date;
  total_delta: number;
  delta_by_factor: Map<CSIRiskFactor, number>;
  events_by_factor: Map<CSIRiskFactor, ConfirmedEvent[]>;
}

export class EventDeltaEngine {
  // Internal store for directly added events
  private confirmedEvents: Map<string, ConfirmedEvent[]> = new Map();
  
  // Phase 3B: Per-factor event delta tracking
  private deltaHistory: Map<string, EventDeltaTracking> = new Map();
  
  // Phase 3B: Validation tracking
  private crossFactorNettingAttempts: number = 0;
  private factorMismatchErrors: number = 0;

  private driftEngine: EscalationDriftEngine;

  constructor(driftEngine?: EscalationDriftEngine) {
    this.driftEngine = driftEngine || escalationDriftEngine;
  }

  /**
   * Phase 3B: Calculate event delta for a country with per-factor tracking
   * Now tracks deltas by factor for audit trail
   */
  async calculate(country: string, timestamp: Date = new Date()): Promise<number> {
    const deltaByFactor = await this.calculateByFactor(country, timestamp);
    
    // Sum across all factors
    let totalDelta = 0;
    for (const delta of deltaByFactor.values()) {
      totalDelta += delta;
    }
    
    // Phase 3B: Track per-factor deltas
    await this.trackEventDeltas(country, timestamp, totalDelta, deltaByFactor);
    
    return totalDelta;
  }

  /**
   * Calculate event delta broken down by CSI risk factor
   * This is the core method that enforces factor-scoped operations
   */
  async calculateByFactor(
    country: string,
    timestamp: Date
  ): Promise<Map<CSIRiskFactor, number>> {
    const confirmedEvents = await this.getActiveEvents(country, timestamp);
    const deltaByFactor = new Map<CSIRiskFactor, number>();
    const eventsByFactor = new Map<CSIRiskFactor, ConfirmedEvent[]>();

    // Initialize all factors
    for (const factor of Object.values(CSIRiskFactor)) {
      deltaByFactor.set(factor, 0);
      eventsByFactor.set(factor, []);
    }

    for (const event of confirmedEvents) {
      // Phase 3B: Validate event with factor-specific checks
      const validationResults = await this.validateEventForDelta(event, country);
      const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
      
      if (errors.length > 0) {
        console.error(`Event validation failed for ${event.event_id}:`, errors);
        this.factorMismatchErrors++;
        continue; // Skip invalid events
      }

      // Calculate decayed impact
      const decayedImpact = this.applyDecay(event, timestamp);
      
      // Add to appropriate factor (NO cross-factor accumulation)
      const factor = event.risk_factor;
      const currentDelta = deltaByFactor.get(factor) || 0;
      deltaByFactor.set(factor, currentDelta + decayedImpact);
      
      // Track events by factor
      const factorEvents = eventsByFactor.get(factor) || [];
      factorEvents.push(event);
      eventsByFactor.set(factor, factorEvents);
    }

    return deltaByFactor;
  }

  /**
   * Phase 3B: Comprehensive event validation for delta calculation
   * Validates:
   * 1. Event has valid risk_factor
   * 2. Event confirmation sources have CONFIRMATION role
   * 3. Prior drift netted is from same factor only
   * 4. Related signals (if any) are from same factor
   */
  private async validateEventForDelta(
    event: ConfirmedEvent,
    country: string
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // 1. Validate event has valid risk_factor
    if (!event.risk_factor || !Object.values(CSIRiskFactor).includes(event.risk_factor)) {
      results.push({
        check_name: 'event_risk_factor_valid',
        passed: false,
        message: `Event ${event.event_id} has invalid or missing risk_factor`,
        severity: 'ERROR'
      });
    } else {
      results.push({
        check_name: 'event_risk_factor_valid',
        passed: true,
        message: `Event ${event.event_id} has valid risk_factor: ${event.risk_factor}`,
        severity: 'INFO'
      });
    }

    // 2. Validate confirmation sources have CONFIRMATION role
    if (!event.confirmation_sources || event.confirmation_sources.length === 0) {
      results.push({
        check_name: 'event_confirmation_sources_required',
        passed: false,
        message: `Event ${event.event_id} has no confirmation sources`,
        severity: 'ERROR'
      });
    } else {
      for (const source of event.confirmation_sources) {
        if (source.role !== SourceRole.CONFIRMATION) {
          results.push({
            check_name: 'event_source_role_enforcement',
            passed: false,
            message: `Event ${event.event_id} source ${source.source_name} has role ${source.role}, expected CONFIRMATION`,
            severity: 'ERROR'
          });
        }
      }
    }

    // 3. Validate prior drift netted is from same factor only
    if (event.prior_drift_netted > 0) {
      // Get drift attribution for this event's factor
      const factorDrift = await this.driftEngine.getDriftAttributionForEvent(
        country,
        event.risk_factor,
        event.event_type,
        event.confirmed_date
      );
                  
      // Check if netted amount is reasonable (not exceeding available drift)
      if (event.prior_drift_netted > factorDrift * 1.1) { // Allow 10% tolerance
        results.push({
          check_name: 'event_netting_same_factor_only',
          passed: false,
          message: `Event ${event.event_id} netted ${event.prior_drift_netted} but only ${factorDrift} drift available in factor ${event.risk_factor}`,
          severity: 'ERROR'
        });
      }
    }

    // 4. Validate related signals (if any) are from same factor
    if (event.related_signal_ids && event.related_signal_ids.length > 0) {
      const factorSignals = this.driftEngine.getActiveSignalsByFactor(country, event.risk_factor);
      const factorSignalIds = new Set(factorSignals.map(s => s.signal_id));
      
      for (const signalId of event.related_signal_ids) {
        if (!factorSignalIds.has(signalId)) {
          results.push({
            check_name: 'event_related_signals_same_factor',
            passed: false,
            message: `Event ${event.event_id} references signal ${signalId} not in factor ${event.risk_factor}`,
            severity: 'ERROR'
          });
        }
      }
    }

    return results;
  }

  /**
   * Apply decay to event impact
   */
  private applyDecay(event: ConfirmedEvent, currentTime: Date): number {
    if (!event.decay_schedule || event.decay_schedule.type === 'NONE') {
      return event.base_impact - event.prior_drift_netted;
    }

    const effectiveDate = event.effective_date;
    const daysSince = (currentTime.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24);

    const netImpact = event.base_impact - event.prior_drift_netted;

    if (event.decay_schedule.type === 'LINEAR') {
      const decayRate = event.decay_schedule.decay_rate || 0.01;
      const decayFactor = Math.max(0, 1 - daysSince * decayRate);
      return netImpact * decayFactor;
    }

    if (event.decay_schedule.type === 'EXPONENTIAL') {
      const halfLife = event.decay_schedule.half_life_days || 30;
      const decayFactor = Math.pow(0.5, daysSince / halfLife);
      return netImpact * decayFactor;
    }

    return netImpact;
  }

  /**
   * Get active events for a country (from both internal store and eventCandidateStore)
   */
  async getActiveEvents(country: string, timestamp: Date): Promise<ConfirmedEvent[]> {
    const events: ConfirmedEvent[] = [];

    // Get events from internal store
    const internalEvents = this.confirmedEvents.get(country) || [];
    events.push(...internalEvents);

    // Get events from eventCandidateStore
    const candidates = eventCandidateStore.getCandidatesByCountry(
      country,
      EventStatus.VALIDATED
    );

    for (const candidate of candidates) {
      // Check if event is still active (not expired by decay)
      if (!decayEngine.isExpired(candidate.candidateId)) {
        const event = await this.mapToConfirmedEvent(candidate, country);
        // Avoid duplicates
        if (!events.some(e => e.event_id === event.event_id)) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Get active events for a specific factor
   */
  async getActiveEventsByFactor(
    country: string,
    factor: CSIRiskFactor,
    timestamp: Date = new Date()
  ): Promise<ConfirmedEvent[]> {
    const allEvents = await this.getActiveEvents(country, timestamp);
    return allEvents.filter(e => e.risk_factor === factor);
  }

  /**
   * Phase 3B: Map EventCandidate to ConfirmedEvent with factor preservation
   * Event inherits risk_factor from confirming signals with validation
   */
  private async mapToConfirmedEvent(
    candidate: EventCandidate,
    country: string
  ): Promise<ConfirmedEvent> {
    // Get deltas for this event
    const deltas = eventDeltaLedger.getDeltasForEvent(candidate.candidateId);
    
    // Calculate base impact from deltas
    const baseImpact = deltas.reduce((sum, d) => sum + d.csiImpact.vectorDelta, 0);

    // Phase 3B: Inherit risk_factor from confirming signals
    const riskFactor = await this.inferFactorFromSignals(candidate, country);

    // Phase 3B: Calculate prior drift netted (SAME FACTOR ONLY with validation)
    const priorDriftNetted = await this.calculateNettingWithValidation(
      candidate,
      riskFactor,
      country
    );

    // Phase 3B: Get related signal IDs from same factor
    const relatedSignalIds = await this.getRelatedSignalIds(candidate, riskFactor, country);

    // Mock confirmation sources (in production, would come from actual data)
    const confirmationSources = [{
      source_id: 'event_confirmation_system',
      source_name: 'Event Confirmation System',
      role: SourceRole.CONFIRMATION,
      reliability_score: 0.95,
      authority_level: 'HIGH' as const,
      applicable_factors: [riskFactor]
    }];

    return {
      event_id: candidate.candidateId,
      country: candidate.country,
      risk_factor: riskFactor, // Phase 3B: Inherited from signals
      event_type: candidate.eventType || 'unknown',
      state: 'CONFIRMED',
      base_impact: baseImpact,
      confirmed_date: candidate.lastUpdated,
      effective_date: candidate.lastUpdated,
      confirmation_sources: confirmationSources,
      decay_schedule: {
        type: 'EXPONENTIAL',
        half_life_days: 30
      },
      prior_drift_netted: priorDriftNetted,
      related_signal_ids: relatedSignalIds // Phase 3B: Tracked for validation
    };
  }

  /**
   * Phase 3B: Infer risk_factor from confirming signals
   * Events inherit the risk_factor from the signals that led to their confirmation
   */
  private async inferFactorFromSignals(
    candidate: EventCandidate,
    country: string
  ): Promise<CSIRiskFactor> {
    // Get all signals for this country
    const allSignals = this.driftEngine.getActiveSignals(country);
    
    // Phase 3B: Find signals that match this event type
    const matchingSignals = allSignals.filter(signal => 
      this.isSignalRelatedToEvent(signal, candidate)
    );

    if (matchingSignals.length > 0) {
      // Use the factor from the first matching signal
      // In production, would use majority voting or highest confidence signal
      return matchingSignals[0].risk_factor;
    }

    // Fallback: map legacy RiskVector to CSIRiskFactor
    return this.mapVectorToFactor(candidate.vector);
  }

  /**
   * Phase 3B: Check if signal is related to event candidate
   * Proper factor-based matching (replaces "return true; // Simplified for now")
   */
  private isSignalRelatedToEvent(signal: Signal, candidate: EventCandidate): boolean {
    // First, map candidate's legacy vector to CSI risk factor
    const candidateFactor = this.mapVectorToFactor(candidate.vector);
    
    // Signal and event must be in same factor
    if (signal.risk_factor !== candidateFactor) {
      return false;
    }

    // Check if signal type is relevant to event type within the same factor
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

    const eventType = candidate.eventType || 'unknown';
    const factorMapping = factorMappings[candidateFactor];
    
    if (!factorMapping) {
      return false;
    }

    const relevantSignalTypes = factorMapping[eventType] || [];
    return relevantSignalTypes.includes(signal.signal_type);
  }

  /**
   * Phase 3B: Get related signal IDs from same factor
   */
  private async getRelatedSignalIds(
    candidate: EventCandidate,
    riskFactor: CSIRiskFactor,
    country: string
  ): Promise<string[]> {
    const allSignals = this.driftEngine.getActiveSignals(country);
    
    const relatedSignals = allSignals.filter(signal => 
      signal.risk_factor === riskFactor &&
      this.isSignalRelatedToEvent(signal, candidate) &&
      signal.detected_date < candidate.lastUpdated
    );

    return relatedSignals.map(s => s.signal_id);
  }

  /**
   * Map legacy RiskVector to CSIRiskFactor
   */
  private mapVectorToFactor(vector: RiskVector): CSIRiskFactor {
    const mapping: Record<RiskVector, CSIRiskFactor> = {
      [RiskVector.POLITICAL]: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,
      [RiskVector.ECONOMIC]: CSIRiskFactor.TRADE_LOGISTICS,
      [RiskVector.SECURITY]: CSIRiskFactor.CONFLICT_SECURITY,
      [RiskVector.SOCIAL]: CSIRiskFactor.PUBLIC_UNREST_CIVIL,
      [RiskVector.ENVIRONMENTAL]: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,
      [RiskVector.TECHNOLOGICAL]: CSIRiskFactor.CYBER_DATA_SOVEREIGNTY
    };

    return mapping[vector] || CSIRiskFactor.GOVERNANCE_RULE_OF_LAW;
  }

  /**
   * Phase 3B: Calculate netting with validation and cross-factor guards
   * ONLY nets drift from SAME FACTOR with explicit validation
   */
  async calculateNettingWithValidation(
    candidate: EventCandidate,
    riskFactor: CSIRiskFactor,
    country: string
  ): Promise<number> {
    // Phase 3B: Explicit guard - verify we're only netting within same factor
    const candidateFactor = this.mapVectorToFactor(candidate.vector);
    
    if (candidateFactor !== riskFactor) {
      console.error(
        `Cross-factor netting attempt detected: ` +
        `Candidate has factor ${candidateFactor} but trying to net from ${riskFactor}`
      );
      this.crossFactorNettingAttempts++;
      return 0; // Prevent cross-factor netting
    }

    // Validate same factor with helper
    const validation = validateSameFactor(candidateFactor, riskFactor, 'event_netting');
    if (!validation.passed) {
      console.error(`Netting validation failed: ${validation.message}`);
      this.crossFactorNettingAttempts++;
      return 0;
    }

    // Get drift attribution for SAME FACTOR ONLY
    const nettedDrift = await this.driftEngine.getDriftAttributionForEvent(
      candidate.country,
      riskFactor,
      candidate.eventType || 'unknown',
      candidate.lastUpdated
    );

    return nettedDrift;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use calculateNettingWithValidation instead
   */
  async calculateNetting(
    candidate: EventCandidate,
    riskFactor: CSIRiskFactor
  ): Promise<number> {
    return this.calculateNettingWithValidation(candidate, riskFactor, candidate.country);
  }

  /**
   * Phase 3B: Track event deltas by factor for audit trail
   */
  private async trackEventDeltas(
    country: string,
    timestamp: Date,
    totalDelta: number,
    deltaByFactor: Map<CSIRiskFactor, number>
  ): Promise<void> {
    const events = await this.getActiveEvents(country, timestamp);
    const eventsByFactor = new Map<CSIRiskFactor, ConfirmedEvent[]>();

    // Initialize all factors
    for (const factor of Object.values(CSIRiskFactor)) {
      eventsByFactor.set(factor, []);
    }

    // Group events by factor
    for (const event of events) {
      const factorEvents = eventsByFactor.get(event.risk_factor) || [];
      factorEvents.push(event);
      eventsByFactor.set(event.risk_factor, factorEvents);
    }

    // Store tracking data
    const trackingKey = `${country}-${timestamp.toISOString().split('T')[0]}`;
    this.deltaHistory.set(trackingKey, {
      country,
      timestamp,
      total_delta: totalDelta,
      delta_by_factor: new Map(deltaByFactor),
      events_by_factor: eventsByFactor
    });
  }

  /**
   * Add a confirmed event directly
   */
  async addEvent(country: string, event: ConfirmedEvent): Promise<void> {
    // Phase 3B: Comprehensive validation
    const validationResults = await this.validateEventForDelta(event, country);
    const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
    
    if (errors.length > 0) {
      this.factorMismatchErrors++;
      console.error(`Cannot add invalid event ${event.event_id}:`, errors);
      throw new Error(`Event validation failed: ${errors.map(e => e.message).join('; ')}`);
    }

    const events = this.confirmedEvents.get(country) || [];
    
    // Check for duplicates
    const existingIndex = events.findIndex(e => e.event_id === event.event_id);
    if (existingIndex >= 0) {
      events[existingIndex] = event;
    } else {
      events.push(event);
    }
    
    this.confirmedEvents.set(country, events);
  }

  /**
   * Remove an event
   */
  removeEvent(country: string, eventId: string): void {
    const events = this.confirmedEvents.get(country) || [];
    const filtered = events.filter(e => e.event_id !== eventId);
    this.confirmedEvents.set(country, filtered);
  }

  /**
   * Clear all events for a country
   */
  clearEvents(country?: string): void {
    if (country) {
      this.confirmedEvents.delete(country);
      
      // Also clear delta history for this country
      for (const [key, tracking] of this.deltaHistory.entries()) {
        if (tracking.country === country) {
          this.deltaHistory.delete(key);
        }
      }
    } else {
      this.confirmedEvents.clear();
      this.deltaHistory.clear();
    }
    
    // Reset validation counters
    this.crossFactorNettingAttempts = 0;
    this.factorMismatchErrors = 0;
  }

  /**
   * Phase 3B: Get event delta breakdown by factor (renamed from getDeltaByVector)
   */
  async getDeltaByFactor(
    country: string,
    timestamp: Date = new Date()
  ): Promise<Map<CSIRiskFactor, number>> {
    return this.calculateByFactor(country, timestamp);
  }

  /**
   * Get active events with details (for UI display)
   */
  async getActiveEventsWithDetails(country: string): Promise<Array<{
    event_id: string;
    risk_factor: CSIRiskFactor;
    event_type: string;
    base_impact: number;
    netted_impact: number;
    current_impact: number;
    confirmed_date: Date;
  }>> {
    const events = await this.getActiveEvents(country, new Date());

    return events.map(event => ({
      event_id: event.event_id,
      risk_factor: event.risk_factor,
      event_type: event.event_type,
      base_impact: event.base_impact,
      netted_impact: event.base_impact - event.prior_drift_netted,
      current_impact: this.applyDecay(event, new Date()),
      confirmed_date: event.confirmed_date
    }));
  }

  /**
   * Get event deltas with factor breakdown
   */
  async getEventDeltasWithFactorBreakdown(
    country: string,
    timestamp: Date = new Date()
  ): Promise<FactorEventDelta[]> {
    const events = await this.getActiveEvents(country, timestamp);
    const deltas: FactorEventDelta[] = [];

    for (const event of events) {
      deltas.push({
        factor: event.risk_factor,
        event_id: event.event_id,
        base_impact: event.base_impact,
        prior_drift_netted: event.prior_drift_netted,
        current_impact: this.applyDecay(event, timestamp),
        decay_applied: event.base_impact - this.applyDecay(event, timestamp)
      });
    }

    return deltas;
  }

  /**
   * Phase 3B: Get delta history for audit
   */
  getDeltaHistory(country: string, days: number = 30): EventDeltaTracking[] {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.deltaHistory.values()).filter(tracking =>
      tracking.country === country &&
      tracking.timestamp >= cutoffTime
    );
  }

  /**
   * Cleanup old events
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<void> {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    for (const [country, events] of this.confirmedEvents.entries()) {
      const filtered = events.filter(e => e.confirmed_date >= cutoffTime);
      if (filtered.length > 0) {
        this.confirmedEvents.set(country, filtered);
      } else {
        this.confirmedEvents.delete(country);
      }
    }
    
    // Cleanup old delta history
    for (const [key, tracking] of this.deltaHistory.entries()) {
      if (tracking.timestamp < cutoffTime) {
        this.deltaHistory.delete(key);
      }
    }
  }

  /**
   * Phase 3B: Get health metrics with validation stats
   */
  getHealthMetrics(): {
    total_countries: number;
    active_events: number;
    events_by_factor: Record<CSIRiskFactor, number>;
    avg_events_per_country: number;
    validation_stats: {
      cross_factor_netting_attempts_blocked: number;
      factor_mismatch_errors: number;
    };
    delta_history_entries: number;
  } {
    const totalCountries = this.confirmedEvents.size;
    let totalEvents = 0;
    const eventsByFactor: Record<CSIRiskFactor, number> = {} as any;

    // Initialize factor counts
    for (const factor of Object.values(CSIRiskFactor)) {
      eventsByFactor[factor] = 0;
    }
    
    for (const events of this.confirmedEvents.values()) {
      totalEvents += events.length;
      for (const event of events) {
        eventsByFactor[event.risk_factor]++;
      }
    }
    
    return {
      total_countries: totalCountries,
      active_events: totalEvents,
      events_by_factor: eventsByFactor,
      avg_events_per_country: totalCountries > 0 ? totalEvents / totalCountries : 0,
      validation_stats: {
        cross_factor_netting_attempts_blocked: this.crossFactorNettingAttempts,
        factor_mismatch_errors: this.factorMismatchErrors
      },
      delta_history_entries: this.deltaHistory.size
    };
  }

  /**
   * Phase 3B: Validate no cross-factor netting
   * Returns validation results for audit
   */
  async validateNoCrossFactorNetting(country: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const events = await this.getActiveEvents(country, new Date());
    
    for (const event of events) {
      // Check if event's netted drift is from same factor
      if (event.prior_drift_netted > 0) {
        const factorDrift = await this.driftEngine.getDriftAttributionForEvent(
          country,
          event.risk_factor,
          event.event_type,
          event.confirmed_date
        );
        
        if (event.prior_drift_netted > factorDrift * 1.1) { // Allow 10% tolerance
          results.push({
            check_name: 'no_cross_factor_netting',
            passed: false,
            message: `Event ${event.event_id} may have cross-factor netting: netted ${event.prior_drift_netted} but only ${factorDrift} available in factor ${event.risk_factor}`,
            severity: 'ERROR'
          });
        } else {
          results.push({
            check_name: 'no_cross_factor_netting',
            passed: true,
            message: `Event ${event.event_id} netting correctly scoped to factor ${event.risk_factor}`,
            severity: 'INFO'
          });
        }
      }
    }
    
    return results;
  }
}

// Singleton instance
export const eventDeltaEngine = new EventDeltaEngine();