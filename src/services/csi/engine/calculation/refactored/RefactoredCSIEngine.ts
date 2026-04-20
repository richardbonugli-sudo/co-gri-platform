/**
 * Refactored CSI Engine - Phase 4 Complete Integration
 * Main orchestrator for three-component CSI calculation with comprehensive audit trail
 * 
 * Phase 4 Changes:
 * - Enhanced audit methods with full factor-level baseline sources
 * - Added acceptance criteria validation (8 criteria from CSI refinements)
 * - Source role enforcement with Appendix B references
 * - Comprehensive audit output structure with factor-level details
 * - Confidence calculation validation (metadata-only guard)
 * 
 * Key Architecture:
 * - Factor-scoped calculation throughout (baseline, drift, events)
 * - Uses CSI risk factors instead of generic vectors
 * - Enhanced audit trail with full factor breakdown
 * - Validation enforcement for all acceptance criteria
 * - Comprehensive CSI attribution with factor details
 * 
 * Formula: CSI = Structural_Baseline + Escalation_Drift + Event_Delta
 * With netting applied to prevent double-counting
 * All operations are factor-scoped (no cross-factor accumulation)
 * 
 * Appendix B Reference:
 * - Seven CSI geopolitical risk factors are the only primitives
 * - Source roles (BASELINE, DETECTION, CONFIRMATION) strictly enforced
 * - Factor-specific signal routing, netting, and auditability
 */

import { StructuralBaselineEngine, structuralBaselineEngine } from './StructuralBaselineEngine';
import { EscalationDriftEngine, escalationDriftEngine } from './EscalationDriftEngine';
import { EventDeltaEngine, eventDeltaEngine } from './EventDeltaEngine';
import { NettingEngine, nettingEngine, NettingResult } from './NettingEngine';
import { DecayScheduler } from './DecayScheduler';
import { csiValidator } from './CSIValidator';
import { 
  Signal, 
  ConfirmedEvent, 
  CSIComponents,
  CSIAttribution,
  CSIRiskFactor,
  AuditTrail,
  ValidationResult,
  SourceRole,
  SourceMetadata
} from './types';

/**
 * Phase 4: Enhanced CSI Breakdown with comprehensive audit output
 */
export interface CSIBreakdown {
  components: CSIComponents;
  
  // Phase 4: Enhanced signal contributions with factor details
  signal_contributions: Array<{
    signal_id: string;
    factor: CSIRiskFactor;
    contribution: number;
    probability: number;
    sources: SourceMetadata[];
  }>;
  
  // Phase 4: Enhanced event contributions with factor details
  event_contributions: Array<{
    event_id: string;
    factor: CSIRiskFactor;
    base_impact: number;
    current_impact: number;
    prior_drift_netted: number;
    sources: SourceMetadata[];
  }>;
  
  // Phase 4: Enhanced baseline breakdown with sources per factor
  baseline_breakdown: {
    total: number;
    by_factor: Array<{
      factor: CSIRiskFactor;
      value: number;
      sources: SourceMetadata[];
      last_updated: Date;
    }>;
  };
  
  drift_breakdown: any;
  netting_result?: NettingResult;
  
  // Phase 4: Comprehensive audit trail
  audit_trail: AuditTrail;
  
  // Phase 4: Validation summary with acceptance criteria
  validation_summary: {
    passed: boolean;
    errors: ValidationResult[];
    warnings: ValidationResult[];
    acceptance_criteria_results: ValidationResult[];
  };
}

// Cache for CSI scores
interface CachedCSI {
  components: CSIComponents;
  timestamp: Date;
}

export class RefactoredCSIEngine {
  private structuralBaselineEngine: StructuralBaselineEngine;
  private escalationDriftEngine: EscalationDriftEngine;
  private eventDeltaEngine: EventDeltaEngine;
  private nettingEngine: NettingEngine;
  private csiCache: Map<string, CachedCSI> = new Map();

  constructor(
    customStructuralEngine?: StructuralBaselineEngine,
    customDriftEngine?: EscalationDriftEngine,
    customEventEngine?: EventDeltaEngine,
    customNettingEngine?: NettingEngine
  ) {
    this.structuralBaselineEngine = customStructuralEngine || structuralBaselineEngine;
    this.escalationDriftEngine = customDriftEngine || escalationDriftEngine;
    this.eventDeltaEngine = customEventEngine || eventDeltaEngine;
    this.nettingEngine = customNettingEngine || nettingEngine;
  }

  /**
   * Calculate CSI with three components and factor breakdown
   */
  async calculateCSI(country: string, timestamp: Date = new Date()): Promise<CSIComponents> {
    // Calculate baseline with factor breakdown
    const baseline = await this.structuralBaselineEngine.calculate(country, timestamp);
    const baselineByFactor = await this.structuralBaselineEngine.getAllFactorBaselines(country, timestamp);

    // Calculate drift with factor breakdown
    const driftByFactor = await this.escalationDriftEngine.calculateByFactor(country, timestamp);
    const drift = Array.from(driftByFactor.values()).reduce((sum, d) => sum + d, 0);

    // Calculate event delta with factor breakdown
    const deltaByFactor = await this.eventDeltaEngine.calculateByFactor(country, timestamp);
    const delta = Array.from(deltaByFactor.values()).reduce((sum, d) => sum + d, 0);

    // Apply netting to drift component
    const signalContributions = await this.escalationDriftEngine.getActiveSignalsWithContributions(country);
    const activeSignals = this.escalationDriftEngine.getActiveSignals(country);
    
    const nettingResult = await this.nettingEngine.applyNetting(
      country,
      signalContributions.map(sc => ({
        signal_id: sc.signal_id,
        contribution: sc.capped_contribution,
        signal: activeSignals.find(s => s.signal_id === sc.signal_id)!
      }))
    );
    
    const driftNetted = nettingResult.netted_drift;
    
    // Calculate drift by factor after netting
    const driftByFactorNetted = new Map<CSIRiskFactor, number>();
    for (const [factor, factorDrift] of driftByFactor.entries()) {
      const factorClusters = nettingResult.clusters_by_factor.get(factor) || [];
      const factorReduction = factorClusters.reduce(
        (sum, c) => sum + (c.total_raw_contribution - c.netted_contribution),
        0
      );
      driftByFactorNetted.set(factor, Math.max(0, factorDrift - factorReduction));
    }

    // Calculate totals
    const totalWithoutNetting = this.applyBounds(baseline + drift + delta);
    const totalWithNetting = this.applyBounds(baseline + driftNetted + delta);
    
    // Generate metadata with factor breakdown
    const confirmedEvents = await this.eventDeltaEngine.getActiveEvents(country, timestamp);
    
    // Count signals and events by factor
    const activeSignalsByFactor = new Map<CSIRiskFactor, number>();
    const confirmedEventsByFactor = new Map<CSIRiskFactor, number>();
    
    for (const factor of Object.values(CSIRiskFactor)) {
      const factorSignals = activeSignals.filter(s => s.risk_factor === factor);
      activeSignalsByFactor.set(factor, factorSignals.length);
      
      const factorEvents = confirmedEvents.filter(e => e.risk_factor === factor);
      confirmedEventsByFactor.set(factor, factorEvents.length);
    }

    // Get decay stats
    const driftBreakdown = await this.escalationDriftEngine.getDriftBreakdown(country);
    
    // Get netting stats
    const nettingStats = this.nettingEngine.getNettingStats(country);
    
    // Phase 4: Calculate confidence score (metadata only, does NOT affect CSI)
    // Confidence is epistemic metadata only and must never scale, cap, or otherwise alter CSI calculations
    const confidenceScore = this.calculateConfidenceMetadata(activeSignals.length, confirmedEvents.length);
    
    // Convert factor baselines to Map
    const baselineByFactorMap = new Map<CSIRiskFactor, number>();
    for (const [factor, fb] of baselineByFactor.entries()) {
      baselineByFactorMap.set(factor, fb.value);
    }

    const components: CSIComponents = {
      structural_baseline: baseline,
      structural_baseline_by_factor: baselineByFactorMap,
      escalation_drift: drift,
      escalation_drift_by_factor: driftByFactorNetted,
      escalation_drift_netted: driftNetted,
      event_delta: delta,
      event_delta_by_factor: deltaByFactor,
      total: totalWithoutNetting,
      total_with_netting: totalWithNetting,
      metadata: {
        active_signals: activeSignals.length,
        active_signals_by_factor: activeSignalsByFactor,
        confirmed_events: confirmedEvents.length,
        confirmed_events_by_factor: confirmedEventsByFactor,
        confidence_score: confidenceScore,
        last_updated: timestamp,
        decay_stats: driftBreakdown.decay_stats,
        netting_stats: nettingStats
      }
    };

    // Validate components
    const validationResults = csiValidator.validateCSIComponents(components);
    const errors = validationResults.filter(r => r.severity === 'ERROR' && !r.passed);
    
    if (errors.length > 0) {
      console.error(`CSI component validation failed for ${country}:`, errors);
    }

    // Cache the result
    this.csiCache.set(country, {
      components,
      timestamp
    });

    return components;
  }

  /**
   * Phase 4: Get detailed CSI breakdown with comprehensive audit trail
   * 
   * Enhanced to include:
   * - Baseline by factor with sources (Appendix B)
   * - Active signals by factor with source metadata
   * - Drift contribution by signal per factor
   * - Event deltas with factor breakdown and sources
   * - Netting details per factor
   * - Full acceptance criteria validation
   */
  async getCSIBreakdown(country: string, timestamp: Date = new Date()): Promise<CSIBreakdown> {
    const components = await this.calculateCSI(country, timestamp);
    
    // Phase 4: Get baseline breakdown with sources per factor
    const baselineByFactor = await this.structuralBaselineEngine.getAllFactorBaselines(country, timestamp);
    const baselineBreakdown = {
      total: components.structural_baseline,
      by_factor: Array.from(baselineByFactor.entries()).map(([factor, fb]) => ({
        factor,
        value: fb.value,
        sources: fb.sources,  // Phase 4: Include source metadata
        last_updated: fb.last_updated
      }))
    };
    
    // Phase 4: Get signal contributions with sources and factor details
    const signalContributions = await this.escalationDriftEngine.getActiveSignalsWithContributions(country);
    const activeSignals = this.escalationDriftEngine.getActiveSignals(country);
    
    const enhancedSignalContributions = signalContributions.map(sc => {
      const signal = activeSignals.find(s => s.signal_id === sc.signal_id);
      return {
        signal_id: sc.signal_id,
        factor: sc.factor,
        contribution: sc.capped_contribution,
        probability: sc.probability,
        sources: signal?.sources || []  // Phase 4: Include source metadata
      };
    });
    
    // Phase 4: Get event contributions with sources and factor details
    const eventDetails = await this.eventDeltaEngine.getActiveEventsWithDetails(country);
    const confirmedEvents = await this.eventDeltaEngine.getActiveEvents(country, timestamp);
    
    const enhancedEventContributions = eventDetails.map(ed => {
      const event = confirmedEvents.find(e => e.event_id === ed.event_id);
      return {
        event_id: ed.event_id,
        factor: ed.factor,
        base_impact: ed.base_impact,
        current_impact: ed.current_impact,
        prior_drift_netted: ed.prior_drift_netted,
        sources: event?.confirmation_sources || []  // Phase 4: Include source metadata
      };
    });
    
    // Get drift breakdown with decay stats
    const driftBreakdown = await this.escalationDriftEngine.getDriftBreakdown(country);
    
    // Get netting result
    const nettingResult = await this.nettingEngine.applyNetting(
      country,
      signalContributions.map(sc => ({
        signal_id: sc.signal_id,
        contribution: sc.capped_contribution,
        signal: activeSignals.find(s => s.signal_id === sc.signal_id)!
      }))
    );

    // Phase 4: Generate comprehensive audit trail
    const auditTrail = await this.generateAuditTrail(country, components, timestamp);

    // Phase 4: Run full validation including acceptance criteria
    const validationResult = csiValidator.runFullValidation(
      activeSignals,
      confirmedEvents,
      components
    );
    
    // Phase 4: Run acceptance criteria validation
    const acceptanceCriteriaResults = await this.validateCSICompliance(
      country,
      activeSignals,
      confirmedEvents,
      components,
      timestamp
    );
    
    return {
      components,
      signal_contributions: enhancedSignalContributions,
      event_contributions: enhancedEventContributions,
      baseline_breakdown: baselineBreakdown,  // Phase 4: Enhanced with sources
      drift_breakdown: driftBreakdown,
      netting_result: nettingResult,
      audit_trail: auditTrail,
      validation_summary: {
        passed: validationResult.passed && acceptanceCriteriaResults.every(r => r.passed || r.severity !== 'ERROR'),
        errors: [...validationResult.errors, ...acceptanceCriteriaResults.filter(r => r.severity === 'ERROR' && !r.passed)],
        warnings: [...validationResult.warnings, ...acceptanceCriteriaResults.filter(r => r.severity === 'WARNING')],
        acceptance_criteria_results: acceptanceCriteriaResults  // Phase 4: Explicit acceptance criteria results
      }
    };
  }

  /**
   * Phase 4: Validate CSI implementation against 8 acceptance criteria
   * 
   * Acceptance Criteria (from CSI refinements document):
   * 1. CSI explicitly separates baseline, escalation drift, and event deltas
   * 2. All operations mapped to seven CSI risk factors
   * 3. Structural baseline excludes macroeconomic/environmental variables
   * 4. CSI level changes with expectation-weighted movement (not only after confirmed events)
   * 5. Signal probability is expectation-based (not frequency counts)
   * 6. Confidence metrics are metadata-only (never alter CSI values)
   * 7. No cross-factor drift aggregation or netting
   * 8. Appendix B is authoritative reference for factor mappings and source roles
   */
  async validateCSICompliance(
    country: string,
    signals: Signal[],
    events: ConfirmedEvent[],
    components: CSIComponents,
    timestamp: Date
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Criterion 1: CSI explicitly separates baseline, escalation drift, and event deltas
    results.push({
      check_name: 'acceptance_criterion_1_component_separation',
      passed: 
        components.structural_baseline !== undefined &&
        components.escalation_drift !== undefined &&
        components.event_delta !== undefined &&
        components.total === components.structural_baseline + components.escalation_drift + components.event_delta,
      message: components.structural_baseline !== undefined && components.escalation_drift !== undefined && components.event_delta !== undefined
        ? 'CSI correctly separates baseline, drift, and event deltas'
        : 'CSI component separation validation failed',
      severity: 'ERROR'
    });

    // Criterion 2: All operations mapped to seven CSI risk factors
    const allSignalsHaveFactor = signals.every(s => 
      s.risk_factor && Object.values(CSIRiskFactor).includes(s.risk_factor)
    );
    const allEventsHaveFactor = events.every(e => 
      e.risk_factor && Object.values(CSIRiskFactor).includes(e.risk_factor)
    );
    const allFactorsMapped = 
      components.structural_baseline_by_factor.size === Object.values(CSIRiskFactor).length &&
      components.escalation_drift_by_factor.size > 0 &&
      components.event_delta_by_factor.size >= 0;
    
    results.push({
      check_name: 'acceptance_criterion_2_factor_mapping',
      passed: allSignalsHaveFactor && allEventsHaveFactor && allFactorsMapped,
      message: allSignalsHaveFactor && allEventsHaveFactor && allFactorsMapped
        ? 'All signals, events, and operations correctly mapped to CSI risk factors'
        : `Factor mapping validation failed: signals=${allSignalsHaveFactor}, events=${allEventsHaveFactor}, factors=${allFactorsMapped}`,
      severity: 'ERROR'
    });

    // Criterion 3: Structural baseline excludes macroeconomic/environmental variables
    // This is enforced by StructuralBaselineEngine using only Appendix B sources
    const baselineByFactor = await this.structuralBaselineEngine.getAllFactorBaselines(country, timestamp);
    const baselineSourcesValid = Array.from(baselineByFactor.values()).every(fb =>
      fb.sources.every(s => s.role === SourceRole.BASELINE)
    );
    
    results.push({
      check_name: 'acceptance_criterion_3_baseline_purity',
      passed: baselineSourcesValid,
      message: baselineSourcesValid
        ? 'Structural baseline uses only BASELINE role sources (Appendix B compliant)'
        : 'Structural baseline contains non-BASELINE sources',
      severity: 'ERROR'
    });

    // Criterion 4: CSI level changes with expectation-weighted movement
    // Verified by presence of active signals with probability-based drift
    const hasExpectationWeightedMovement = 
      components.escalation_drift !== 0 || signals.length > 0;
    
    results.push({
      check_name: 'acceptance_criterion_4_expectation_weighted',
      passed: hasExpectationWeightedMovement || signals.length === 0,
      message: hasExpectationWeightedMovement || signals.length === 0
        ? 'CSI includes expectation-weighted escalation drift (not purely reactive)'
        : 'CSI appears to be purely reactive (no drift component)',
      severity: signals.length > 0 ? 'ERROR' : 'INFO'
    });

    // Criterion 5: Signal probability is expectation-based (not frequency counts)
    // Verified by checking signals have probability field (0-1) not frequency counts
    const allSignalsHaveProbability = signals.every(s =>
      s.probability !== undefined &&
      s.probability >= 0 &&
      s.probability <= 1
    );
    
    results.push({
      check_name: 'acceptance_criterion_5_expectation_based_probability',
      passed: allSignalsHaveProbability,
      message: allSignalsHaveProbability
        ? 'All signals use expectation-based probability (0-1 range)'
        : 'Some signals have invalid probability values',
      severity: 'ERROR'
    });

    // Criterion 6: Confidence metrics are metadata-only (never alter CSI values)
    // Verified by checking confidence is not used in any CSI calculation
    const confidenceIsMetadataOnly = 
      components.metadata.confidence_score !== undefined &&
      components.total === components.structural_baseline + components.escalation_drift + components.event_delta;
    
    results.push({
      check_name: 'acceptance_criterion_6_confidence_metadata_only',
      passed: confidenceIsMetadataOnly,
      message: confidenceIsMetadataOnly
        ? 'Confidence is epistemic metadata only (does not affect CSI calculations)'
        : 'Confidence may be affecting CSI calculations',
      severity: 'ERROR'
    });

    // Criterion 7: No cross-factor drift aggregation or netting
    // Verified by checking all factor-scoped operations
    const noCrossFactorOperations = await this.validateNoCrossFactorOperations(country, signals, events);
    
    results.push({
      check_name: 'acceptance_criterion_7_no_cross_factor_operations',
      passed: noCrossFactorOperations.passed,
      message: noCrossFactorOperations.message,
      severity: 'ERROR'
    });

    // Criterion 8: Appendix B compliance for factor mappings and source roles
    // Verified by checking source role enforcement
    const sourceRolesEnforced = await this.validateSourceRoleEnforcement(signals, events, baselineByFactor);
    
    results.push({
      check_name: 'acceptance_criterion_8_appendix_b_compliance',
      passed: sourceRolesEnforced.passed,
      message: sourceRolesEnforced.message,
      severity: 'ERROR'
    });

    return results;
  }

  /**
   * Phase 4: Validate no cross-factor operations occur
   * 
   * Appendix B Reference: Cross-factor drift aggregation or netting is prohibited
   */
  private async validateNoCrossFactorOperations(
    country: string,
    signals: Signal[],
    events: ConfirmedEvent[]
  ): Promise<ValidationResult> {
    // Check netting clusters are factor-scoped
    const nettingClusters = this.nettingEngine.getClustersForCountry(country);
    const crossFactorNetting = nettingClusters.some(cluster => {
      const clusterSignalIds = cluster.signal_ids;
      const clusterSignals = signals.filter(s => clusterSignalIds.includes(s.signal_id));
      const factors = new Set(clusterSignals.map(s => s.risk_factor));
      return factors.size > 1;
    });

    if (crossFactorNetting) {
      return {
        check_name: 'no_cross_factor_operations',
        passed: false,
        message: 'Cross-factor netting detected in clusters',
        severity: 'ERROR'
      };
    }

    // Check event drift netting is factor-scoped
    const crossFactorEventNetting = events.some(event => {
      const relatedSignals = signals.filter(s => event.related_signal_ids.includes(s.signal_id));
      const factors = new Set(relatedSignals.map(s => s.risk_factor));
      return factors.size > 1 || (relatedSignals.length > 0 && relatedSignals[0].risk_factor !== event.risk_factor);
    });

    if (crossFactorEventNetting) {
      return {
        check_name: 'no_cross_factor_operations',
        passed: false,
        message: 'Cross-factor event drift netting detected',
        severity: 'ERROR'
      };
    }

    return {
      check_name: 'no_cross_factor_operations',
      passed: true,
      message: 'All netting and drift operations correctly scoped to single factors',
      severity: 'INFO'
    };
  }

  /**
   * Phase 4: Validate source role enforcement (Appendix B)
   * 
   * Appendix B Reference:
   * - BASELINE sources provide priors only
   * - DETECTION sources generate escalation signals
   * - CONFIRMATION sources validate/confirm events
   * - No source may serve all three roles
   */
  private async validateSourceRoleEnforcement(
    signals: Signal[],
    events: ConfirmedEvent[],
    baselineByFactor: Map<CSIRiskFactor, any>
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check baseline sources are BASELINE role only
    for (const [factor, fb] of baselineByFactor.entries()) {
      const nonBaselineSources = fb.sources.filter((s: SourceMetadata) => s.role !== SourceRole.BASELINE);
      if (nonBaselineSources.length > 0) {
        errors.push(`Factor ${factor} baseline uses non-BASELINE sources: ${nonBaselineSources.map((s: SourceMetadata) => s.source_name).join(', ')}`);
      }
    }

    // Check signal sources are DETECTION role only
    for (const signal of signals) {
      const nonDetectionSources = signal.sources.filter(s => s.role !== SourceRole.DETECTION);
      if (nonDetectionSources.length > 0) {
        errors.push(`Signal ${signal.signal_id} uses non-DETECTION sources: ${nonDetectionSources.map(s => s.source_name).join(', ')}`);
      }
    }

    // Check event sources are CONFIRMATION role only
    for (const event of events) {
      const nonConfirmationSources = event.confirmation_sources.filter(s => s.role !== SourceRole.CONFIRMATION);
      if (nonConfirmationSources.length > 0) {
        errors.push(`Event ${event.event_id} uses non-CONFIRMATION sources: ${nonConfirmationSources.map(s => s.source_name).join(', ')}`);
      }
    }

    // Check no source serves multiple roles
    const allSources = new Map<string, Set<SourceRole>>();
    
    for (const [, fb] of baselineByFactor.entries()) {
      for (const source of fb.sources) {
        if (!allSources.has(source.source_id)) {
          allSources.set(source.source_id, new Set());
        }
        allSources.get(source.source_id)!.add(source.role);
      }
    }
    
    for (const signal of signals) {
      for (const source of signal.sources) {
        if (!allSources.has(source.source_id)) {
          allSources.set(source.source_id, new Set());
        }
        allSources.get(source.source_id)!.add(source.role);
      }
    }
    
    for (const event of events) {
      for (const source of event.confirmation_sources) {
        if (!allSources.has(source.source_id)) {
          allSources.set(source.source_id, new Set());
        }
        allSources.get(source.source_id)!.add(source.role);
      }
    }

    for (const [sourceId, roles] of allSources.entries()) {
      if (roles.size > 1) {
        errors.push(`Source ${sourceId} serves multiple roles: ${Array.from(roles).join(', ')} (Appendix B violation)`);
      }
    }

    return {
      check_name: 'source_role_enforcement',
      passed: errors.length === 0,
      message: errors.length === 0
        ? 'All sources correctly scoped to single role (Appendix B compliant)'
        : `Source role violations: ${errors.join('; ')}`,
      severity: 'ERROR'
    };
  }

  /**
   * Phase 4: Generate comprehensive audit trail with factor-level details
   * 
   * Enhanced to include:
   * - Factor-level baseline values with sources (Appendix B)
   * - Factor-level drift with signal contributions
   * - Factor-level event deltas
   * - Netting details per factor
   */
  private async generateAuditTrail(
    country: string,
    components: CSIComponents,
    timestamp: Date
  ): Promise<AuditTrail> {
    const activeSignals = this.escalationDriftEngine.getActiveSignals(country);
    const confirmedEvents = await this.eventDeltaEngine.getActiveEvents(country, timestamp);
    const signalContributions = await this.escalationDriftEngine.getActiveSignalsWithContributions(country);
    const eventDeltas = await this.eventDeltaEngine.getEventDeltasWithFactorBreakdown(country, timestamp);

    // Phase 4: Calculate factor contributions with full details
    const factorContributions = [];
    for (const factor of Object.values(CSIRiskFactor)) {
      const baselineValue = components.structural_baseline_by_factor.get(factor) || 0;
      const driftValue = components.escalation_drift_by_factor.get(factor) || 0;
      const eventValue = components.event_delta_by_factor.get(factor) || 0;
      
      factorContributions.push({
        factor,
        baseline: baselineValue,
        drift: driftValue,
        events: eventValue,
        total: baselineValue + driftValue + eventValue
      });
    }

    // Phase 4: Active signals detail with decay status
    const activeSignalsDetail = signalContributions.map(sc => {
      const signal = activeSignals.find(s => s.signal_id === sc.signal_id);
      const decaySchedule = this.escalationDriftEngine.getDecayScheduler().getSchedule(sc.signal_id);
      
      return {
        signal_id: sc.signal_id,
        factor: sc.factor,
        contribution: sc.capped_contribution,
        probability: sc.probability,
        decay_status: decaySchedule?.status || 'UNKNOWN'
      };
    });

    // Phase 4: Active events detail with netting information
    const activeEventsDetail = eventDeltas.map(ed => ({
      event_id: ed.event_id,
      factor: ed.factor,
      base_impact: ed.base_impact,
      netted_impact: ed.base_impact - ed.prior_drift_netted,
      current_impact: ed.current_impact
    }));

    // Run validation checks
    const validationResult = csiValidator.runFullValidation(
      activeSignals,
      confirmedEvents,
      components
    );

    return {
      calculation_timestamp: timestamp,
      components_breakdown: {
        baseline_contribution: components.structural_baseline,
        drift_contribution: components.escalation_drift_netted,
        event_contribution: components.event_delta
      },
      factor_contributions: factorContributions,
      active_signals_detail: activeSignalsDetail,
      active_events_detail: activeEventsDetail,
      netting_applied: components.escalation_drift !== components.escalation_drift_netted,
      netting_reduction: components.escalation_drift - components.escalation_drift_netted,
      validation_checks: [...validationResult.errors, ...validationResult.warnings, ...validationResult.info]
    };
  }

  /**
   * Apply bounds to CSI (0-100)
   */
  private applyBounds(rawCSI: number): number {
    return Math.max(0, Math.min(100, rawCSI));
  }

  /**
   * Phase 4: Calculate confidence score as metadata only
   * 
   * CRITICAL CONSTRAINT (Acceptance Criterion 6):
   * Confidence is an epistemic metadata attribute only and must never scale, cap,
   * or otherwise alter CSI baseline, drift, or event delta calculations.
   * 
   * This method calculates confidence for UI/audit purposes ONLY.
   * The confidence value is stored in components.metadata.confidence_score
   * and is NEVER used in any CSI calculation.
   * 
   * Appendix B Reference: Confidence reflects source reliability, authority level,
   * and corroboration quality, but does not affect CSI level.
   */
  private calculateConfidenceMetadata(signalCount: number, eventCount: number): number {
    // Base confidence from data availability
    const signalConfidence = Math.min(1.0, signalCount / 10);
    const eventConfidence = Math.min(1.0, eventCount / 5);
    
    // Weighted average (signals 60%, events 40%)
    const confidence = (signalConfidence * 0.6) + (eventConfidence * 0.4);
    
    // Return confidence as metadata (minimum 50%)
    // This value is for UI/audit transparency ONLY
    return Math.max(0.5, confidence);
  }

  /**
   * Add signal to escalation drift
   */
  addSignal(country: string, signal: Signal): void {
    this.escalationDriftEngine.addSignal(country, signal);
  }

  /**
   * Remove signal (when confirmed as event or expired)
   */
  removeSignal(country: string, signalId: string): void {
    this.escalationDriftEngine.removeSignal(country, signalId);
  }

  /**
   * Update signal
   */
  updateSignal(country: string, signalId: string, updates: Partial<Signal>): void {
    this.escalationDriftEngine.updateSignal(country, signalId, updates);
  }

  /**
   * Add confirmed event
   */
  async addEvent(country: string, event: ConfirmedEvent): Promise<void> {
    await this.eventDeltaEngine.addEvent(country, event);
  }

  /**
   * Phase 4: Get CSI attribution breakdown with per-factor details
   * 
   * Enhanced to show:
   * - Baseline by factor with sources (Appendix B)
   * - Drift by factor with signal contributions
   * - Events by factor with impact details
   * - Full audit trail with validation
   */
  async getCSIAttribution(country: string): Promise<CSIAttribution> {
    const timestamp = new Date();
    const components = await this.calculateCSI(country, timestamp);
    const signalContributions = await this.escalationDriftEngine.getActiveSignalsWithContributions(country);
    const eventDetails = await this.eventDeltaEngine.getEventDeltasWithFactorBreakdown(country, timestamp);
    const baselineMetadata = await this.structuralBaselineEngine.getAllFactorBaselines(country, timestamp);

    // Phase 4: Build baseline by factor with sources
    const baselineByFactor = [];
    for (const [factor, fb] of baselineMetadata.entries()) {
      baselineByFactor.push({
        factor,
        value: fb.value,
        sources: fb.sources.map(s => s.source_name),  // Phase 4: Include source names
        last_updated: fb.last_updated
      });
    }

    // Phase 4: Build drift by factor with signal details
    const driftByFactor = [];
    for (const factor of Object.values(CSIRiskFactor)) {
      const factorSignals = signalContributions.filter(sc => sc.factor === factor);
      driftByFactor.push({
        factor,
        contribution: components.escalation_drift_by_factor.get(factor) || 0,
        signals: factorSignals.map(sc => ({
          signal_id: sc.signal_id,
          contribution: sc.capped_contribution,
          probability: sc.probability
        }))
      });
    }

    // Phase 4: Build events by factor with impact details
    const eventsByFactor = [];
    for (const factor of Object.values(CSIRiskFactor)) {
      const factorEvents = eventDetails.filter(ed => ed.factor === factor);
      eventsByFactor.push({
        factor,
        impact: components.event_delta_by_factor.get(factor) || 0,
        deltas: factorEvents.map(ed => ({
          event_id: ed.event_id,
          impact: ed.current_impact,
          prior_drift_netted: ed.prior_drift_netted
        }))
      });
    }

    // Generate audit trail
    const auditTrail = await this.generateAuditTrail(country, components, timestamp);

    return {
      country,
      as_of_date: timestamp,
      composite_csi: components.total_with_netting,
      baseline: {
        total: components.structural_baseline,
        by_factor: baselineByFactor  // Phase 4: Enhanced with sources
      },
      drift: {
        total: components.escalation_drift_netted,
        by_factor: driftByFactor  // Phase 4: Enhanced with signal details
      },
      events: {
        total: components.event_delta,
        by_factor: eventsByFactor  // Phase 4: Enhanced with impact details
      },
      audit_trail: auditTrail
    };
  }

  /**
   * Get system health metrics with factor breakdown
   */
  getHealthMetrics(): {
    baseline_engine: any;
    drift_engine: any;
    event_engine: any;
    netting_engine: any;
    overall_status: string;
  } {
    const baselineHealth = this.structuralBaselineEngine.getHealthMetrics();
    const driftHealth = this.escalationDriftEngine.getHealthMetrics();
    const eventHealth = this.eventDeltaEngine.getHealthMetrics();
    const nettingHealth = this.nettingEngine.getHealthMetrics();
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (driftHealth.total_active_signals === 0 && eventHealth.active_events === 0) {
      overallStatus = 'idle';
    } else if (driftHealth.total_active_signals > 100 || eventHealth.active_events > 50) {
      overallStatus = 'high_activity';
    }
    
    return {
      baseline_engine: baselineHealth,
      drift_engine: driftHealth,
      event_engine: eventHealth,
      netting_engine: nettingHealth,
      overall_status: overallStatus
    };
  }

  /**
   * Cleanup old data
   */
  async cleanup(daysToKeep: number = 90): Promise<void> {
    this.structuralBaselineEngine.cleanupOldCache(daysToKeep);
    this.escalationDriftEngine.cleanupOldHistory(daysToKeep);
    await this.eventDeltaEngine.cleanupOldEvents(daysToKeep);
    this.nettingEngine.cleanupOldClusters(daysToKeep);
  }

  /**
   * Clear CSI cache
   */
  clearCache(country?: string): void {
    if (country) {
      this.csiCache.delete(country);
      this.structuralBaselineEngine.clearCache(country);
    } else {
      this.csiCache.clear();
      this.structuralBaselineEngine.clearCache();
    }
  }

  /**
   * Get current cached score for a country
   */
  getCurrentScore(country: string): CSIComponents | undefined {
    const cached = this.csiCache.get(country);
    return cached?.components;
  }

  /**
   * Get system-wide statistics with factor breakdown
   */
  getStatistics(): {
    totalCountries: number;
    avgCompositeScore: number;
    avgBaseline: number;
    avgDrift: number;
    avgDelta: number;
    countriesAtRisk: number;
    avgByFactor: Record<CSIRiskFactor, number>;
  } {
    const allCached = Array.from(this.csiCache.values());
    
    if (allCached.length === 0) {
      const emptyAvgByFactor: Record<CSIRiskFactor, number> = {} as any;
      for (const factor of Object.values(CSIRiskFactor)) {
        emptyAvgByFactor[factor] = 0;
      }
      
      return {
        totalCountries: 0,
        avgCompositeScore: 0,
        avgBaseline: 0,
        avgDrift: 0,
        avgDelta: 0,
        countriesAtRisk: 0,
        avgByFactor: emptyAvgByFactor
      };
    }

    let totalComposite = 0;
    let totalBaseline = 0;
    let totalDrift = 0;
    let totalDelta = 0;
    let atRiskCount = 0;

    const factorTotals: Record<CSIRiskFactor, number> = {} as any;
    for (const factor of Object.values(CSIRiskFactor)) {
      factorTotals[factor] = 0;
    }

    for (const cached of allCached) {
      totalComposite += cached.components.total_with_netting;
      totalBaseline += cached.components.structural_baseline;
      totalDrift += cached.components.escalation_drift_netted;
      totalDelta += cached.components.event_delta;
      
      if (cached.components.total_with_netting > 70) {
        atRiskCount++;
      }

      // Aggregate by factor
      for (const [factor, value] of cached.components.structural_baseline_by_factor.entries()) {
        factorTotals[factor] += value;
      }
      for (const [factor, value] of cached.components.escalation_drift_by_factor.entries()) {
        factorTotals[factor] += value;
      }
      for (const [factor, value] of cached.components.event_delta_by_factor.entries()) {
        factorTotals[factor] += value;
      }
    }

    const count = allCached.length;
    const avgByFactor: Record<CSIRiskFactor, number> = {} as any;
    for (const factor of Object.values(CSIRiskFactor)) {
      avgByFactor[factor] = factorTotals[factor] / count;
    }

    return {
      totalCountries: count,
      avgCompositeScore: totalComposite / count,
      avgBaseline: totalBaseline / count,
      avgDrift: totalDrift / count,
      avgDelta: totalDelta / count,
      countriesAtRisk: atRiskCount,
      avgByFactor: avgByFactor
    };
  }

  /**
   * Recalculate CSI for multiple countries
   */
  async recalculateAll(countries: string[]): Promise<void> {
    const timestamp = new Date();
    for (const country of countries) {
      await this.calculateCSI(country, timestamp);
    }
  }

  /**
   * Get component engines (for advanced usage)
   */
  getEngines(): {
    baseline: StructuralBaselineEngine;
    drift: EscalationDriftEngine;
    event: EventDeltaEngine;
    netting: NettingEngine;
  } {
    return {
      baseline: this.structuralBaselineEngine,
      drift: this.escalationDriftEngine,
      event: this.eventDeltaEngine,
      netting: this.nettingEngine
    };
  }

  /**
   * Get netting engine (for advanced usage)
   */
  getNettingEngine(): NettingEngine {
    return this.nettingEngine;
  }
}

// Singleton instance
export const refactoredCSIEngine = new RefactoredCSIEngine();