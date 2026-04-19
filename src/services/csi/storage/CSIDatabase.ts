/**
 * CSI Implementation Verification - Database Schema and Storage Layer
 * Phase 1A: Golden Test Harness - Database Tables
 */

import {
  CSITrace,
  CSIRiskVector,
  SignalRaw,
  SignalProcessed,
  EventConfirmed,
  Source,
  BaselineSnapshot,
  ReplayConfig,
  QuarantinedSignal,
  AcceptanceTestResult,
  SourceRole,
  SignalLifecycleState,
  EventLifecycleState,
  TEST_COUNTRIES
} from '../types/CSITypes';

// ============================================================================
// IN-MEMORY DATABASE STORAGE
// For Phase 1, we use in-memory storage with JSON persistence
// ============================================================================

/**
 * Database tables interface
 */
interface CSIDatabaseTables {
  // Core tables
  csi_traces: Map<string, CSITrace>;
  signals_raw: Map<string, SignalRaw>;
  signals_processed: Map<string, SignalProcessed>;
  events_confirmed: Map<string, EventConfirmed>;
  source_registry: Map<string, Source>;
  baseline_snapshots: Map<string, BaselineSnapshot>;
  
  // Replay tables
  replay_configs: Map<string, ReplayConfig>;
  
  // QA tables
  quarantined_signals: Map<string, QuarantinedSignal>;
  acceptance_test_results: Map<string, AcceptanceTestResult>;
}

/**
 * CSI Database class - manages all data storage and retrieval
 */
export class CSIDatabase {
  private static instance: CSIDatabase;
  private tables: CSIDatabaseTables;
  private initialized: boolean = false;

  private constructor() {
    this.tables = {
      csi_traces: new Map(),
      signals_raw: new Map(),
      signals_processed: new Map(),
      events_confirmed: new Map(),
      source_registry: new Map(),
      baseline_snapshots: new Map(),
      replay_configs: new Map(),
      quarantined_signals: new Map(),
      acceptance_test_results: new Map()
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CSIDatabase {
    if (!CSIDatabase.instance) {
      CSIDatabase.instance = new CSIDatabase();
    }
    return CSIDatabase.instance;
  }

  /**
   * Initialize database with seed data
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // Seed source registry
    await this.seedSourceRegistry();
    
    // Seed baseline snapshots for test countries
    await this.seedBaselineSnapshots();

    this.initialized = true;
    console.log('[CSIDatabase] Initialized with seed data');
  }

  /**
   * Reset database (for testing)
   */
  public reset(): void {
    this.tables = {
      csi_traces: new Map(),
      signals_raw: new Map(),
      signals_processed: new Map(),
      events_confirmed: new Map(),
      source_registry: new Map(),
      baseline_snapshots: new Map(),
      replay_configs: new Map(),
      quarantined_signals: new Map(),
      acceptance_test_results: new Map()
    };
    this.initialized = false;
  }

  // ============================================================================
  // SOURCE REGISTRY OPERATIONS
  // ============================================================================

  private async seedSourceRegistry(): Promise<void> {
    const sources: Source[] = [
      // Detection Sources (generate signals, cannot confirm)
      {
        source_id: 'reuters',
        name: 'Reuters',
        role: SourceRole.DETECTION,
        reliability_score: 0.9,
        authority_level: 'major_news_agency',
        description: 'Major international news agency',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'bloomberg',
        name: 'Bloomberg',
        role: SourceRole.DETECTION,
        reliability_score: 0.9,
        authority_level: 'major_news_agency',
        description: 'Financial news and data provider',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'ap_news',
        name: 'Associated Press',
        role: SourceRole.DETECTION,
        reliability_score: 0.9,
        authority_level: 'major_news_agency',
        description: 'Major international news agency',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'ft',
        name: 'Financial Times',
        role: SourceRole.DETECTION,
        reliability_score: 0.85,
        authority_level: 'major_news_agency',
        description: 'International business newspaper',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'scmp',
        name: 'South China Morning Post',
        role: SourceRole.DETECTION,
        reliability_score: 0.8,
        authority_level: 'regional_news',
        description: 'Hong Kong-based English newspaper',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'acled',
        name: 'ACLED',
        role: SourceRole.DETECTION,
        reliability_score: 0.95,
        authority_level: 'research_institution',
        description: 'Armed Conflict Location & Event Data Project',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'think_tank_csis',
        name: 'CSIS',
        role: SourceRole.DETECTION,
        reliability_score: 0.85,
        authority_level: 'think_tank',
        description: 'Center for Strategic and International Studies',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Confirmation Sources (confirm events, cannot generate signals)
      {
        source_id: 'ofac',
        name: 'OFAC',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'government_official',
        description: 'Office of Foreign Assets Control',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'eu_sanctions',
        name: 'EU Sanctions Registry',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'government_official',
        description: 'European Union sanctions database',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'un_security_council',
        name: 'UN Security Council',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'international_organization',
        description: 'United Nations Security Council',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'wto',
        name: 'WTO',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'international_organization',
        description: 'World Trade Organization',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'us_state_dept',
        name: 'US State Department',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'government_official',
        description: 'United States Department of State',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'china_mofcom',
        name: 'China MOFCOM',
        role: SourceRole.CONFIRMATION,
        reliability_score: 1.0,
        authority_level: 'government_official',
        description: 'Ministry of Commerce of China',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Baseline Sources (structural priors only)
      {
        source_id: 'world_bank_wgi',
        name: 'World Bank WGI',
        role: SourceRole.BASELINE,
        reliability_score: 0.95,
        authority_level: 'international_organization',
        description: 'World Bank Worldwide Governance Indicators',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'transparency_intl',
        name: 'Transparency International',
        role: SourceRole.BASELINE,
        reliability_score: 0.9,
        authority_level: 'research_institution',
        description: 'Corruption Perceptions Index',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'freedom_house',
        name: 'Freedom House',
        role: SourceRole.BASELINE,
        reliability_score: 0.85,
        authority_level: 'research_institution',
        description: 'Freedom in the World Index',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        source_id: 'imf_areaer',
        name: 'IMF AREAER',
        role: SourceRole.BASELINE,
        reliability_score: 0.95,
        authority_level: 'international_organization',
        description: 'IMF Annual Report on Exchange Arrangements',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const source of sources) {
      this.tables.source_registry.set(source.source_id, source);
    }
  }

  public getSource(sourceId: string): Source | undefined {
    return this.tables.source_registry.get(sourceId);
  }

  public getAllSources(): Source[] {
    return Array.from(this.tables.source_registry.values());
  }

  public getSourcesByRole(role: SourceRole): Source[] {
    return Array.from(this.tables.source_registry.values())
      .filter(s => s.role === role);
  }

  // ============================================================================
  // BASELINE SNAPSHOT OPERATIONS
  // ============================================================================

  private async seedBaselineSnapshots(): Promise<void> {
    // Create baseline snapshots for all test countries
    // These represent the structural baseline anchored prior to T0
    const baselineDate = new Date();
    baselineDate.setDate(baselineDate.getDate() - 90); // 90 days ago (prior to 60-day window)

    const countryBaselines: Record<string, Record<CSIRiskVector, number>> = {
      'CAN': {
        [CSIRiskVector.CONFLICT_SECURITY]: 5.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 3.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 4.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 3.5,
        [CSIRiskVector.CYBER_DATA]: 2.5,
        [CSIRiskVector.PUBLIC_UNREST]: 3.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 2.0
      },
      'USA': {
        [CSIRiskVector.CONFLICT_SECURITY]: 6.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 4.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 5.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 4.0,
        [CSIRiskVector.CYBER_DATA]: 3.5,
        [CSIRiskVector.PUBLIC_UNREST]: 4.5,
        [CSIRiskVector.CURRENCY_CAPITAL]: 2.5
      },
      'VEN': {
        [CSIRiskVector.CONFLICT_SECURITY]: 14.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 12.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 10.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 15.0,
        [CSIRiskVector.CYBER_DATA]: 5.0,
        [CSIRiskVector.PUBLIC_UNREST]: 12.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 10.0
      },
      'CHN': {
        [CSIRiskVector.CONFLICT_SECURITY]: 8.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 9.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 7.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 10.0,
        [CSIRiskVector.CYBER_DATA]: 8.0,
        [CSIRiskVector.PUBLIC_UNREST]: 6.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 7.0
      },
      'IRN': {
        [CSIRiskVector.CONFLICT_SECURITY]: 12.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 16.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 12.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 13.0,
        [CSIRiskVector.CYBER_DATA]: 7.0,
        [CSIRiskVector.PUBLIC_UNREST]: 10.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 9.0
      },
      'DNK': {
        [CSIRiskVector.CONFLICT_SECURITY]: 3.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 2.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 2.5,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 2.0,
        [CSIRiskVector.CYBER_DATA]: 2.0,
        [CSIRiskVector.PUBLIC_UNREST]: 2.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 1.5
      },
      'GRL': {
        [CSIRiskVector.CONFLICT_SECURITY]: 3.5,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 2.5,
        [CSIRiskVector.TRADE_LOGISTICS]: 3.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 3.0,
        [CSIRiskVector.CYBER_DATA]: 2.0,
        [CSIRiskVector.PUBLIC_UNREST]: 2.5,
        [CSIRiskVector.CURRENCY_CAPITAL]: 2.0
      },
      'RUS': {
        [CSIRiskVector.CONFLICT_SECURITY]: 15.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 16.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 14.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 14.0,
        [CSIRiskVector.CYBER_DATA]: 9.0,
        [CSIRiskVector.PUBLIC_UNREST]: 8.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 10.0
      },
      'TWN': {
        [CSIRiskVector.CONFLICT_SECURITY]: 10.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 5.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 6.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 4.0,
        [CSIRiskVector.CYBER_DATA]: 5.0,
        [CSIRiskVector.PUBLIC_UNREST]: 4.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 3.0
      },
      'CHE': {
        // Switzerland - quiet negative control
        [CSIRiskVector.CONFLICT_SECURITY]: 2.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 2.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 2.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 1.5,
        [CSIRiskVector.CYBER_DATA]: 2.0,
        [CSIRiskVector.PUBLIC_UNREST]: 1.5,
        [CSIRiskVector.CURRENCY_CAPITAL]: 1.5
      }
    };

    for (const country of TEST_COUNTRIES) {
      const byVector = countryBaselines[country.id] || {
        [CSIRiskVector.CONFLICT_SECURITY]: 5.0,
        [CSIRiskVector.SANCTIONS_REGULATORY]: 5.0,
        [CSIRiskVector.TRADE_LOGISTICS]: 5.0,
        [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 5.0,
        [CSIRiskVector.CYBER_DATA]: 5.0,
        [CSIRiskVector.PUBLIC_UNREST]: 5.0,
        [CSIRiskVector.CURRENCY_CAPITAL]: 5.0
      };

      const baselineTotal = Object.values(byVector).reduce((sum, val) => sum + val, 0);

      const snapshot: BaselineSnapshot = {
        snapshot_id: `baseline_${country.id}_${baselineDate.toISOString().split('T')[0]}`,
        country_id: country.id,
        snapshot_date: baselineDate,
        baseline_total: baselineTotal,
        by_vector: byVector,
        source_data: {
          wgi: 'world_bank_wgi',
          cpi: 'transparency_intl',
          freedom: 'freedom_house'
        },
        is_scheduled_update: true,
        created_at: new Date()
      };

      this.tables.baseline_snapshots.set(snapshot.snapshot_id, snapshot);
    }
  }

  public getBaselineSnapshot(countryId: string, beforeDate?: Date): BaselineSnapshot | undefined {
    const snapshots = Array.from(this.tables.baseline_snapshots.values())
      .filter(s => s.country_id === countryId)
      .filter(s => !beforeDate || s.snapshot_date <= beforeDate)
      .sort((a, b) => b.snapshot_date.getTime() - a.snapshot_date.getTime());
    
    return snapshots[0];
  }

  public saveBaselineSnapshot(snapshot: BaselineSnapshot): void {
    this.tables.baseline_snapshots.set(snapshot.snapshot_id, snapshot);
  }

  // ============================================================================
  // SIGNAL OPERATIONS
  // ============================================================================

  public saveSignalRaw(signal: SignalRaw): void {
    this.tables.signals_raw.set(signal.signal_id, signal);
  }

  public getSignalRaw(signalId: string): SignalRaw | undefined {
    return this.tables.signals_raw.get(signalId);
  }

  public saveSignalProcessed(signal: SignalProcessed): void {
    this.tables.signals_processed.set(signal.signal_id, signal);
  }

  public getSignalProcessed(signalId: string): SignalProcessed | undefined {
    return this.tables.signals_processed.get(signalId);
  }

  public getActiveSignals(countryId: string, timestamp: Date): SignalProcessed[] {
    return Array.from(this.tables.signals_processed.values())
      .filter(s => s.country_id === countryId)
      .filter(s => s.detected_at <= timestamp)
      .filter(s => s.lifecycle_state !== SignalLifecycleState.EXPIRED);
  }

  public getSignalsByVector(countryId: string, vectorId: CSIRiskVector, timestamp: Date): SignalProcessed[] {
    return this.getActiveSignals(countryId, timestamp)
      .filter(s => s.vector_id === vectorId);
  }

  public updateSignalState(signalId: string, state: SignalLifecycleState, currentValue?: number): void {
    const signal = this.tables.signals_processed.get(signalId);
    if (signal) {
      signal.lifecycle_state = state;
      if (currentValue !== undefined) {
        signal.current_value = currentValue;
      }
      signal.last_updated = new Date();
      this.tables.signals_processed.set(signalId, signal);
    }
  }

  // ============================================================================
  // EVENT OPERATIONS
  // ============================================================================

  public saveEvent(event: EventConfirmed): void {
    this.tables.events_confirmed.set(event.event_id, event);
  }

  public getEvent(eventId: string): EventConfirmed | undefined {
    return this.tables.events_confirmed.get(eventId);
  }

  public getActiveEvents(countryId: string, timestamp: Date): EventConfirmed[] {
    return Array.from(this.tables.events_confirmed.values())
      .filter(e => e.country_id === countryId)
      .filter(e => e.confirmation_date <= timestamp)
      .filter(e => e.lifecycle_state !== EventLifecycleState.EXPIRED);
  }

  public getEventsByVector(countryId: string, vectorId: CSIRiskVector, timestamp: Date): EventConfirmed[] {
    return this.getActiveEvents(countryId, timestamp)
      .filter(e => e.vector_id === vectorId);
  }

  // ============================================================================
  // CSI TRACE OPERATIONS
  // ============================================================================

  public saveCSITrace(trace: CSITrace): void {
    this.tables.csi_traces.set(trace.trace_id, trace);
  }

  public getCSITrace(traceId: string): CSITrace | undefined {
    return this.tables.csi_traces.get(traceId);
  }

  public getCSITraces(countryId: string, startDate: Date, endDate: Date): CSITrace[] {
    return Array.from(this.tables.csi_traces.values())
      .filter(t => t.country_id === countryId)
      .filter(t => t.timestamp >= startDate && t.timestamp <= endDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public getLatestCSITrace(countryId: string): CSITrace | undefined {
    const traces = Array.from(this.tables.csi_traces.values())
      .filter(t => t.country_id === countryId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return traces[0];
  }

  // ============================================================================
  // REPLAY CONFIG OPERATIONS
  // ============================================================================

  public saveReplayConfig(config: ReplayConfig): void {
    this.tables.replay_configs.set(config.run_id, config);
  }

  public getReplayConfig(runId: string): ReplayConfig | undefined {
    return this.tables.replay_configs.get(runId);
  }

  public getAllReplayConfigs(): ReplayConfig[] {
    return Array.from(this.tables.replay_configs.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  public updateReplayStatus(
    runId: string, 
    status: ReplayConfig['status'], 
    errorMessage?: string
  ): void {
    const config = this.tables.replay_configs.get(runId);
    if (config) {
      config.status = status;
      config.updated_at = new Date();
      if (status === 'running') {
        config.started_at = new Date();
      } else if (status === 'completed' || status === 'failed') {
        config.completed_at = new Date();
      }
      if (errorMessage) {
        config.error_message = errorMessage;
      }
      this.tables.replay_configs.set(runId, config);
    }
  }

  // ============================================================================
  // QUARANTINE OPERATIONS
  // ============================================================================

  public saveQuarantinedSignal(signal: QuarantinedSignal): void {
    this.tables.quarantined_signals.set(signal.quarantine_id, signal);
  }

  public getQuarantinedSignals(status?: 'pending' | 'reviewed' | 'resolved'): QuarantinedSignal[] {
    let signals = Array.from(this.tables.quarantined_signals.values());
    if (status) {
      signals = signals.filter(s => s.review_status === status);
    }
    return signals.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  // ============================================================================
  // ACCEPTANCE TEST OPERATIONS
  // ============================================================================

  public saveAcceptanceTestResult(result: AcceptanceTestResult): void {
    this.tables.acceptance_test_results.set(result.test_id, result);
  }

  public getAcceptanceTestResults(category?: string): AcceptanceTestResult[] {
    let results = Array.from(this.tables.acceptance_test_results.values());
    if (category) {
      results = results.filter(r => r.test_category === category);
    }
    return results.sort((a, b) => a.test_name.localeCompare(b.test_name));
  }

  // ============================================================================
  // EXPORT/IMPORT FOR PERSISTENCE
  // ============================================================================

  public exportToJSON(): string {
    const data = {
      csi_traces: Array.from(this.tables.csi_traces.entries()),
      signals_raw: Array.from(this.tables.signals_raw.entries()),
      signals_processed: Array.from(this.tables.signals_processed.entries()),
      events_confirmed: Array.from(this.tables.events_confirmed.entries()),
      source_registry: Array.from(this.tables.source_registry.entries()),
      baseline_snapshots: Array.from(this.tables.baseline_snapshots.entries()),
      replay_configs: Array.from(this.tables.replay_configs.entries()),
      quarantined_signals: Array.from(this.tables.quarantined_signals.entries()),
      acceptance_test_results: Array.from(this.tables.acceptance_test_results.entries())
    };
    return JSON.stringify(data, null, 2);
  }

  public importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    this.tables.csi_traces = new Map(data.csi_traces);
    this.tables.signals_raw = new Map(data.signals_raw);
    this.tables.signals_processed = new Map(data.signals_processed);
    this.tables.events_confirmed = new Map(data.events_confirmed);
    this.tables.source_registry = new Map(data.source_registry);
    this.tables.baseline_snapshots = new Map(data.baseline_snapshots);
    this.tables.replay_configs = new Map(data.replay_configs);
    this.tables.quarantined_signals = new Map(data.quarantined_signals);
    this.tables.acceptance_test_results = new Map(data.acceptance_test_results);
    
    this.initialized = true;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  public getStats(): Record<string, number> {
    return {
      csi_traces: this.tables.csi_traces.size,
      signals_raw: this.tables.signals_raw.size,
      signals_processed: this.tables.signals_processed.size,
      events_confirmed: this.tables.events_confirmed.size,
      source_registry: this.tables.source_registry.size,
      baseline_snapshots: this.tables.baseline_snapshots.size,
      replay_configs: this.tables.replay_configs.size,
      quarantined_signals: this.tables.quarantined_signals.size,
      acceptance_test_results: this.tables.acceptance_test_results.size
    };
  }
}

// Export singleton instance
export const csiDatabase = CSIDatabase.getInstance();