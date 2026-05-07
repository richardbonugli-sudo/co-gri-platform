/**
 * CSI Implementation Verification - Replay Engine
 * Phase 1A: Deterministic replay for golden test harness
 */

import {
  CSIRiskVector,
  CSITrace,
  SignalRaw,
  SignalProcessed,
  EventConfirmed,
  ReplayConfig,
  TEST_COUNTRIES,
  SourceRole,
  SignalLifecycleState,
  EventLifecycleState,
  DecaySchedule,
  QA_SCENARIOS
} from '../types/CSITypes';
import { csiDatabase } from '../storage/CSIDatabase';
import { scoringEngine } from './ScoringEngine';
import { vectorRouter } from './VectorRouter';

// ============================================================================
// REPLAY ENGINE CLASS
// ============================================================================

/**
 * Replay Engine - manages deterministic CSI replay runs
 */
export class ReplayEngine {
  private static instance: ReplayEngine;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ReplayEngine {
    if (!ReplayEngine.instance) {
      ReplayEngine.instance = new ReplayEngine();
    }
    return ReplayEngine.instance;
  }

  // ============================================================================
  // REPLAY CONFIGURATION
  // ============================================================================

  /**
   * Create a new replay configuration
   */
  public createReplayConfig(
    name: string,
    description?: string,
    windowDays: number = 60,
    samplingIntervalHours: number = 4
  ): ReplayConfig {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - windowDays);

    // Baseline anchor is 90 days before start (prior to T0)
    const baselineAnchorDate = new Date(startDate);
    baselineAnchorDate.setDate(baselineAnchorDate.getDate() - 30);

    const config: ReplayConfig = {
      run_id: `replay_${Date.now()}`,
      name,
      description,
      start_date: startDate,
      end_date: now,
      sampling_interval_hours: samplingIntervalHours,
      country_ids: TEST_COUNTRIES.map(c => c.id),
      baseline_anchor_date: baselineAnchorDate,
      baseline_is_fixed: true,
      use_snapshot_data: true,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    csiDatabase.saveReplayConfig(config);
    return config;
  }

  /**
   * Get replay configuration
   */
  public getReplayConfig(runId: string): ReplayConfig | undefined {
    return csiDatabase.getReplayConfig(runId);
  }

  // ============================================================================
  // SIGNAL INGESTION (REPLAY MODE)
  // ============================================================================

  /**
   * Ingest a raw signal and process it
   * In replay mode, reads from snapshot store
   */
  public ingestSignal(
    sourceId: string,
    countryId: string,
    content: string,
    detectedAt: Date,
    metadata: Record<string, unknown> = {}
  ): SignalProcessed | null {
    // Validate source can generate signals
    const source = csiDatabase.getSource(sourceId);
    if (!source) {
      console.warn(`[ReplayEngine] Unknown source: ${sourceId}`);
      return null;
    }

    if (!vectorRouter.validateSourceCanGenerateSignal(source.role)) {
      console.warn(`[ReplayEngine] Source ${sourceId} cannot generate signals (role: ${source.role})`);
      return null;
    }

    // Create raw signal
    const signalId = `signal_${countryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rawSignal: SignalRaw = {
      signal_id: signalId,
      source_id: sourceId,
      country_id: countryId,
      detected_at: detectedAt,
      raw_content: content,
      raw_metadata: metadata,
      ingested_at: new Date()
    };
    csiDatabase.saveSignalRaw(rawSignal);

    // Classify signal to vector
    const classification = vectorRouter.classifySignalToVector(
      content,
      metadata.signal_type as string | undefined,
      metadata
    );

    if (!classification.vectorId) {
      // Quarantine unclassifiable signal
      vectorRouter.quarantineSignal(signalId, { content, metadata }, 'Unable to classify to a single vector');
      return null;
    }

    // Calculate probabilities
    const baseProbability = (metadata.base_probability as number) || 0.3;
    const corroborationCount = (metadata.corroboration_count as number) || 1;
    const adjustedProbability = Math.min(1.0, (corroborationCount / 5) * baseProbability);

    // Create processed signal
    const processedSignal: SignalProcessed = {
      signal_id: signalId,
      source_id: sourceId,
      source_role: source.role,
      country_id: countryId,
      vector_id: classification.vectorId,
      signal_type: classification.signalType,
      severity: (metadata.severity as number) || 0.5,
      base_probability: baseProbability,
      adjusted_probability: adjustedProbability,
      corroboration_count: corroborationCount,
      corroboration_sources: (metadata.corroboration_sources as string[]) || [sourceId],
      drift_contribution: 0, // Will be calculated by scoring engine
      lifecycle_state: SignalLifecycleState.DETECTED,
      detected_at: detectedAt,
      last_updated: detectedAt,
      persistence_window_hours: 72,
      decay_rate: 0.5,
      current_value: 0,
      metadata
    };

    csiDatabase.saveSignalProcessed(processedSignal);
    return processedSignal;
  }

  /**
   * Ingest a confirmed event
   */
  public ingestEvent(
    countryId: string,
    vectorId: CSIRiskVector,
    eventType: string,
    confirmationSources: string[],
    confirmationDate: Date,
    baseImpact: number,
    relatedSignalIds: string[] = [],
    isPermanent: boolean = false,
    metadata: Record<string, unknown> = {}
  ): EventConfirmed | null {
    // Validate all confirmation sources can confirm events
    for (const sourceId of confirmationSources) {
      const source = csiDatabase.getSource(sourceId);
      if (!source) {
        console.warn(`[ReplayEngine] Unknown confirmation source: ${sourceId}`);
        continue;
      }
      if (!vectorRouter.validateSourceCanConfirmEvent(source.role)) {
        console.warn(`[ReplayEngine] Source ${sourceId} cannot confirm events (role: ${source.role})`);
        return null;
      }
    }

    // Apply netting for related signals (same vector only)
    const nettingResult = scoringEngine.applyEventNetting(
      countryId,
      vectorId,
      `event_${Date.now()}`,
      relatedSignalIds
    );

    // Calculate delta (base impact minus netted prior drift)
    const deltaApplied = Math.max(0, baseImpact - nettingResult.netted_drift);

    // Create decay schedule
    const decaySchedule: DecaySchedule = {
      initial_value: deltaApplied,
      current_value: deltaApplied,
      decay_start_date: confirmationDate,
      inactivity_window_days: 0,
      decay_rate: 0.5,
      half_life_days: isPermanent ? Infinity : 30,
      expiration_threshold: 0.01,
      status: 'ACTIVE'
    };

    // Create confirmed event
    const event: EventConfirmed = {
      event_id: `event_${countryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      country_id: countryId,
      vector_id: vectorId,
      event_type: eventType,
      confirmation_sources: confirmationSources,
      confirmation_date: confirmationDate,
      base_impact: baseImpact,
      delta_applied: deltaApplied,
      prior_drift_netted: nettingResult.netted_drift,
      netting_action: nettingResult.netting_action,
      decay_schedule: decaySchedule,
      lifecycle_state: EventLifecycleState.CONFIRMED,
      effective_date: confirmationDate,
      is_permanent: isPermanent,
      metadata
    };

    csiDatabase.saveEvent(event);
    return event;
  }

  // ============================================================================
  // REPLAY EXECUTION
  // ============================================================================

  /**
   * Execute a full replay run
   */
  public async executeReplay(runId: string): Promise<{
    success: boolean;
    traces: CSITrace[];
    error?: string;
  }> {
    const config = csiDatabase.getReplayConfig(runId);
    if (!config) {
      return { success: false, traces: [], error: 'Replay config not found' };
    }

    try {
      // Update status to running
      csiDatabase.updateReplayStatus(runId, 'running');

      const allTraces: CSITrace[] = [];

      // Generate time series for each country
      for (const countryId of config.country_ids) {
        console.log(`[ReplayEngine] Processing country: ${countryId}`);
        
        const traces = scoringEngine.generateTimeSeries(
          countryId,
          config.start_date,
          config.end_date,
          config.sampling_interval_hours,
          config.baseline_anchor_date,
          runId
        );

        allTraces.push(...traces);
      }

      // Update status to completed
      csiDatabase.updateReplayStatus(runId, 'completed');

      return { success: true, traces: allTraces };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      csiDatabase.updateReplayStatus(runId, 'failed', errorMessage);
      return { success: false, traces: [], error: errorMessage };
    }
  }

  // ============================================================================
  // SCENARIO DATA SEEDING
  // ============================================================================

  /**
   * Seed test data for QA scenarios
   * This creates realistic signals and events for the 60-day window
   */
  public seedQAScenarioData(): void {
    const now = new Date();
    
    // Scenario A: U.S./Canada trade tensions
    this.seedScenarioA(now);
    
    // Scenario B: Iran sanctions rhetoric
    this.seedScenarioB(now);
    
    // Scenario C: Denmark/Greenland sovereignty
    this.seedScenarioC(now);
    
    // Scenario D: Venezuela escalation
    this.seedScenarioD(now);
    
    // Scenario E: Russia ongoing sanctions
    this.seedScenarioE(now);
    
    // Scenario F: China silver export restrictions
    this.seedScenarioF(now);
    
    // Scenario G: China-Taiwan tensions
    this.seedScenarioG(now);

    console.log('[ReplayEngine] QA scenario data seeded');
  }

  private seedScenarioA(now: Date): void {
    // U.S./Canada coercive trade & infrastructure threats
    const day45Ago = new Date(now);
    day45Ago.setDate(day45Ago.getDate() - 45);

    const day40Ago = new Date(now);
    day40Ago.setDate(day40Ago.getDate() - 40);

    const day30Ago = new Date(now);
    day30Ago.setDate(day30Ago.getDate() - 30);

    // Signal: Tariff threat rhetoric
    this.ingestSignal('reuters', 'CAN', 
      'US administration threatens 25% tariffs on Canadian goods amid trade dispute',
      day45Ago,
      { signal_type: 'tariff_threat', severity: 0.6, base_probability: 0.5, corroboration_count: 2 }
    );

    this.ingestSignal('bloomberg', 'USA',
      'Trade tensions escalate as US considers infrastructure restrictions on Canadian companies',
      day40Ago,
      { signal_type: 'infrastructure_threat', severity: 0.5, base_probability: 0.4, corroboration_count: 2 }
    );

    // Signal: Trade restriction warning
    this.ingestSignal('ft', 'CAN',
      'Canada warns of retaliatory measures if US tariffs proceed',
      day30Ago,
      { signal_type: 'trade_restriction', severity: 0.5, base_probability: 0.6, corroboration_count: 3 }
    );
  }

  private seedScenarioB(now: Date): void {
    // Iran-related tariff or secondary sanctions rhetoric
    const day50Ago = new Date(now);
    day50Ago.setDate(day50Ago.getDate() - 50);

    const day35Ago = new Date(now);
    day35Ago.setDate(day35Ago.getDate() - 35);

    // Signal: Sanctions threat
    this.ingestSignal('reuters', 'IRN',
      'US Treasury signals potential new sanctions on Iranian entities',
      day50Ago,
      { signal_type: 'sanctions_threat', severity: 0.7, base_probability: 0.6, corroboration_count: 2 }
    );

    this.ingestSignal('ap_news', 'IRN',
      'Secondary sanctions rhetoric intensifies against Iran trading partners',
      day35Ago,
      { signal_type: 'secondary_sanctions', severity: 0.6, base_probability: 0.5, corroboration_count: 2 }
    );
  }

  private seedScenarioC(now: Date): void {
    // Denmark/Greenland sovereignty pressure
    const day55Ago = new Date(now);
    day55Ago.setDate(day55Ago.getDate() - 55);

    const day40Ago = new Date(now);
    day40Ago.setDate(day40Ago.getDate() - 40);

    // Signal: Sovereignty pressure
    this.ingestSignal('reuters', 'DNK',
      'External pressure on Greenland autonomy raises sovereignty concerns',
      day55Ago,
      { signal_type: 'sovereignty_threat', severity: 0.5, base_probability: 0.4, corroboration_count: 2 }
    );

    this.ingestSignal('ft', 'GRL',
      'Greenland governance discussions intensify amid external interest',
      day40Ago,
      { signal_type: 'governance_pressure', severity: 0.4, base_probability: 0.5, corroboration_count: 2 }
    );
  }

  private seedScenarioD(now: Date): void {
    // Venezuela escalation dynamics
    const day58Ago = new Date(now);
    day58Ago.setDate(day58Ago.getDate() - 58);

    const day45Ago = new Date(now);
    day45Ago.setDate(day45Ago.getDate() - 45);

    const day30Ago = new Date(now);
    day30Ago.setDate(day30Ago.getDate() - 30);

    // Signal: Political instability
    this.ingestSignal('reuters', 'VEN',
      'Venezuela political crisis deepens as opposition challenges government',
      day58Ago,
      { signal_type: 'regime_instability', severity: 0.8, base_probability: 0.7, corroboration_count: 3 }
    );

    this.ingestSignal('ap_news', 'VEN',
      'US considers additional sanctions on Venezuelan officials',
      day45Ago,
      { signal_type: 'sanctions_threat', severity: 0.7, base_probability: 0.6, corroboration_count: 2 }
    );

    // Event: Sanctions confirmed
    this.ingestEvent('VEN', CSIRiskVector.SANCTIONS_REGULATORY,
      'sanctions_imposed',
      ['ofac'],
      day30Ago,
      5.0,
      [],
      false,
      { description: 'New sanctions on Venezuelan officials' }
    );
  }

  private seedScenarioE(now: Date): void {
    // Russia ongoing sanctions & security actions
    const day55Ago = new Date(now);
    day55Ago.setDate(day55Ago.getDate() - 55);

    const day40Ago = new Date(now);
    day40Ago.setDate(day40Ago.getDate() - 40);

    const day25Ago = new Date(now);
    day25Ago.setDate(day25Ago.getDate() - 25);

    const day15Ago = new Date(now);
    day15Ago.setDate(day15Ago.getDate() - 15);

    // Signal: Military activity
    this.ingestSignal('reuters', 'RUS',
      'Russian military exercises near border raise security concerns',
      day55Ago,
      { signal_type: 'military_exercise', severity: 0.7, base_probability: 0.8, corroboration_count: 4 }
    );

    // Signal: Sanctions expansion
    this.ingestSignal('bloomberg', 'RUS',
      'EU considers expanding sanctions on Russian entities',
      day40Ago,
      { signal_type: 'sanctions_threat', severity: 0.8, base_probability: 0.7, corroboration_count: 3 }
    );

    // Event: Sanctions confirmed
    this.ingestEvent('RUS', CSIRiskVector.SANCTIONS_REGULATORY,
      'sanctions_imposed',
      ['eu_sanctions'],
      day25Ago,
      8.0,
      [],
      false,
      { description: 'EU expands sanctions on Russian entities' }
    );

    // Signal: Trade disruption
    this.ingestSignal('ft', 'RUS',
      'Trade routes disrupted as logistics companies avoid Russian territory',
      day15Ago,
      { signal_type: 'supply_chain_disruption', severity: 0.6, base_probability: 0.8, corroboration_count: 3 }
    );
  }

  private seedScenarioF(now: Date): void {
    // China silver export restrictions (effective Jan 1, 2026)
    const day50Ago = new Date(now);
    day50Ago.setDate(day50Ago.getDate() - 50);

    const day35Ago = new Date(now);
    day35Ago.setDate(day35Ago.getDate() - 35);

    const day20Ago = new Date(now);
    day20Ago.setDate(day20Ago.getDate() - 20);

    // Signal: Export control signaling
    this.ingestSignal('scmp', 'CHN',
      'China signals new export controls on silver and strategic minerals',
      day50Ago,
      { signal_type: 'export_controls', severity: 0.6, base_probability: 0.6, corroboration_count: 2 }
    );

    this.ingestSignal('reuters', 'CHN',
      'Draft rules for silver export restrictions published by Chinese authorities',
      day35Ago,
      { signal_type: 'commodity_restriction', severity: 0.7, base_probability: 0.7, corroboration_count: 3 }
    );

    // Event: Export controls confirmed
    this.ingestEvent('CHN', CSIRiskVector.TRADE_LOGISTICS,
      'export_controls',
      ['china_mofcom'],
      day20Ago,
      4.0,
      [],
      false,
      { description: 'Silver export restrictions formally enacted' }
    );
  }

  private seedScenarioG(now: Date): void {
    // China-Taiwan tensions & PRC sanctions on US firms
    const day45Ago = new Date(now);
    day45Ago.setDate(day45Ago.getDate() - 45);

    const day35Ago = new Date(now);
    day35Ago.setDate(day35Ago.getDate() - 35);

    const day25Ago = new Date(now);
    day25Ago.setDate(day25Ago.getDate() - 25);

    const day15Ago = new Date(now);
    day15Ago.setDate(day15Ago.getDate() - 15);

    // Signal: Military tensions
    this.ingestSignal('reuters', 'CHN',
      'Chinese military exercises near Taiwan intensify regional tensions',
      day45Ago,
      { signal_type: 'military_exercise', severity: 0.7, base_probability: 0.8, corroboration_count: 4 }
    );

    this.ingestSignal('ap_news', 'TWN',
      'Taiwan raises alert level as cross-strait tensions escalate',
      day35Ago,
      { signal_type: 'defense_escalation', severity: 0.7, base_probability: 0.7, corroboration_count: 3 }
    );

    // Signal: Sanctions on US firms
    this.ingestSignal('bloomberg', 'CHN',
      'China signals sanctions on US defense contractors',
      day25Ago,
      { signal_type: 'sanctions_threat', severity: 0.6, base_probability: 0.7, corroboration_count: 3 }
    );

    // Event: PRC sanctions on US firms
    this.ingestEvent('CHN', CSIRiskVector.SANCTIONS_REGULATORY,
      'sanctions_imposed',
      ['china_mofcom'],
      day15Ago,
      3.0,
      [],
      false,
      { description: 'PRC sanctions on ~20 US defense-related firms' }
    );
  }

  // ============================================================================
  // SNAPSHOT MANAGEMENT
  // ============================================================================

  /**
   * Create a snapshot of current data for replay
   */
  public createSnapshot(snapshotVersion: string): string {
    const snapshot = {
      version: snapshotVersion,
      created_at: new Date().toISOString(),
      data: csiDatabase.exportToJSON()
    };
    return JSON.stringify(snapshot);
  }

  /**
   * Load a snapshot for replay
   */
  public loadSnapshot(snapshotJson: string): void {
    const snapshot = JSON.parse(snapshotJson);
    csiDatabase.importFromJSON(snapshot.data);
  }
}

// Export singleton instance
export const replayEngine = ReplayEngine.getInstance();