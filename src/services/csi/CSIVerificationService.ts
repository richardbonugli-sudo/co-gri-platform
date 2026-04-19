/**
 * CSI Implementation Verification Service
 * Phase 1: Main entry point for the Golden Test Harness
 */

import {
  CSIRiskVector,
  CSIRiskVectorNames,
  CSITrace,
  ReplayConfig,
  AcceptanceTestResult,
  QA_SCENARIOS,
  TEST_COUNTRIES
} from './types/CSITypes';
import { csiDatabase } from './storage/CSIDatabase';
import { scoringEngine } from './engine/ScoringEngine';
import { replayEngine } from './engine/ReplayEngine';
import { vectorRouter } from './engine/VectorRouter';
import { acceptanceTestHarness } from './tests/AcceptanceTests';

// ============================================================================
// CSI VERIFICATION SERVICE
// ============================================================================

/**
 * Main service for CSI Implementation Verification
 */
export class CSIVerificationService {
  private static instance: CSIVerificationService;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CSIVerificationService {
    if (!CSIVerificationService.instance) {
      CSIVerificationService.instance = new CSIVerificationService();
    }
    return CSIVerificationService.instance;
  }

  /**
   * Initialize the verification service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[CSIVerificationService] Initializing...');
    
    // Initialize database with seed data
    await csiDatabase.initialize();
    
    // Seed QA scenario data
    replayEngine.seedQAScenarioData();

    this.initialized = true;
    console.log('[CSIVerificationService] Initialized successfully');
  }

  /**
   * Reset the service (for testing)
   */
  public reset(): void {
    csiDatabase.reset();
    this.initialized = false;
  }

  // ============================================================================
  // REPLAY OPERATIONS
  // ============================================================================

  /**
   * Create and execute a new replay run
   */
  public async runFullReplay(
    name: string = 'Phase 1 Verification',
    description?: string
  ): Promise<{
    config: ReplayConfig;
    traces: CSITrace[];
    success: boolean;
    error?: string;
  }> {
    await this.initialize();

    // Create replay config
    const config = replayEngine.createReplayConfig(name, description);
    console.log(`[CSIVerificationService] Created replay config: ${config.run_id}`);

    // Execute replay
    const result = await replayEngine.executeReplay(config.run_id);
    
    return {
      config: csiDatabase.getReplayConfig(config.run_id)!,
      traces: result.traces,
      success: result.success,
      error: result.error
    };
  }

  /**
   * Get CSI time series for a country
   */
  public getCountryTimeSeries(
    countryId: string,
    days: number = 60
  ): CSITrace[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    return csiDatabase.getCSITraces(countryId, startDate, now);
  }

  /**
   * Get current CSI for a country
   */
  public getCurrentCSI(countryId: string): CSITrace {
    return scoringEngine.computeCSI(countryId, new Date());
  }

  /**
   * Get CSI for all test countries
   */
  public getAllCountriesCSI(): CSITrace[] {
    return scoringEngine.computeCSIForAllCountries(new Date());
  }

  // ============================================================================
  // ACCEPTANCE TESTS
  // ============================================================================

  /**
   * Run all acceptance tests
   */
  public async runAcceptanceTests(): Promise<{
    passed: boolean;
    total: number;
    passed_count: number;
    failed_count: number;
    results: AcceptanceTestResult[];
    report: string;
  }> {
    await this.initialize();

    const testResults = await acceptanceTestHarness.runAllTests();
    const report = acceptanceTestHarness.generateReport();

    return {
      ...testResults,
      report
    };
  }

  /**
   * Get acceptance test results
   */
  public getAcceptanceTestResults(): AcceptanceTestResult[] {
    return csiDatabase.getAcceptanceTestResults();
  }

  // ============================================================================
  // QA SCENARIO VALIDATION
  // ============================================================================

  /**
   * Validate a specific QA scenario
   */
  public validateScenario(scenarioId: string): {
    scenario_id: string;
    scenario_name: string;
    validation_results: {
      criterion: string;
      passed: boolean;
      details: string;
    }[];
    overall_passed: boolean;
  } {
    const scenario = QA_SCENARIOS.find(s => s.scenario_id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const validationResults: {
      criterion: string;
      passed: boolean;
      details: string;
    }[] = [];

    const now = new Date();

    // Check each affected country
    for (const countryId of scenario.countries_affected) {
      const csiTrace = this.getCurrentCSI(countryId);

      // Check for drift in expected vectors
      for (const expectedVector of scenario.expected_behavior.expected_drift_vectors) {
        const vectorTrace = csiTrace.by_vector[expectedVector];
        const hasDrift = vectorTrace.drift_v > 0 || vectorTrace.active_signals.length > 0;
        
        validationResults.push({
          criterion: `${countryId}: Drift in ${CSIRiskVectorNames[expectedVector]}`,
          passed: hasDrift,
          details: `Drift: ${vectorTrace.drift_v.toFixed(3)}, Signals: ${vectorTrace.active_signals.length}`
        });
      }

      // Check that unaffected vectors remain quiet
      for (const unaffectedVector of scenario.expected_behavior.unaffected_vectors) {
        const vectorTrace = csiTrace.by_vector[unaffectedVector];
        const isQuiet = vectorTrace.drift_v < 0.1 && vectorTrace.active_signals.length === 0;
        
        validationResults.push({
          criterion: `${countryId}: ${CSIRiskVectorNames[unaffectedVector]} remains quiet`,
          passed: isQuiet,
          details: `Drift: ${vectorTrace.drift_v.toFixed(3)}, Signals: ${vectorTrace.active_signals.length}`
        });
      }

      // Check for pre-confirmation drift if expected
      if (scenario.expected_behavior.should_show_drift_before_confirmation) {
        const hasDriftBeforeEvents = csiTrace.escalation_drift_total > 0;
        validationResults.push({
          criterion: `${countryId}: Shows drift before confirmation`,
          passed: hasDriftBeforeEvents,
          details: `Escalation drift: ${csiTrace.escalation_drift_total.toFixed(3)}`
        });
      }
    }

    return {
      scenario_id: scenario.scenario_id,
      scenario_name: scenario.name,
      validation_results: validationResults,
      overall_passed: validationResults.every(r => r.passed)
    };
  }

  /**
   * Validate all QA scenarios
   */
  public validateAllScenarios(): {
    scenarios: {
      scenario_id: string;
      scenario_name: string;
      passed: boolean;
      details: string;
    }[];
    overall_passed: boolean;
  } {
    const results = QA_SCENARIOS.map(scenario => {
      try {
        const validation = this.validateScenario(scenario.scenario_id);
        return {
          scenario_id: scenario.scenario_id,
          scenario_name: scenario.name,
          passed: validation.overall_passed,
          details: `${validation.validation_results.filter(r => r.passed).length}/${validation.validation_results.length} criteria passed`
        };
      } catch (error) {
        return {
          scenario_id: scenario.scenario_id,
          scenario_name: scenario.name,
          passed: false,
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    return {
      scenarios: results,
      overall_passed: results.every(r => r.passed)
    };
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  /**
   * Get all test countries
   */
  public getTestCountries(): typeof TEST_COUNTRIES {
    return TEST_COUNTRIES;
  }

  /**
   * Get all QA scenarios
   */
  public getQAScenarios(): typeof QA_SCENARIOS {
    return QA_SCENARIOS;
  }

  /**
   * Get database statistics
   */
  public getStats(): Record<string, number> {
    return csiDatabase.getStats();
  }

  /**
   * Get all replay configurations
   */
  public getReplayConfigs(): ReplayConfig[] {
    return csiDatabase.getAllReplayConfigs();
  }

  /**
   * Get quarantined signals
   */
  public getQuarantinedSignals(): ReturnType<typeof csiDatabase.getQuarantinedSignals> {
    return csiDatabase.getQuarantinedSignals();
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export all data as JSON
   */
  public exportData(): string {
    return csiDatabase.exportToJSON();
  }

  /**
   * Generate comprehensive verification report
   */
  public async generateVerificationReport(): Promise<string> {
    await this.initialize();

    let report = '# CSI Phase 1 Implementation Verification Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Database stats
    const stats = this.getStats();
    report += '## Database Statistics\n\n';
    report += '| Table | Count |\n';
    report += '|-------|-------|\n';
    for (const [table, count] of Object.entries(stats)) {
      report += `| ${table} | ${count} |\n`;
    }
    report += '\n';

    // Test countries
    report += '## Test Countries\n\n';
    report += '| ID | Name | Sub-Entity |\n';
    report += '|----|------|------------|\n';
    for (const country of TEST_COUNTRIES) {
      report += `| ${country.id} | ${country.name} | ${country.isSubEntity ? 'Yes' : 'No'} |\n`;
    }
    report += '\n';

    // Current CSI scores
    report += '## Current CSI Scores\n\n';
    report += '| Country | CSI Total | Baseline | Drift | Event Delta |\n';
    report += '|---------|-----------|----------|-------|-------------|\n';
    const allCSI = this.getAllCountriesCSI();
    for (const trace of allCSI) {
      report += `| ${trace.country_name} | ${trace.csi_total.toFixed(1)} | ${trace.baseline_total.toFixed(1)} | ${trace.escalation_drift_total.toFixed(2)} | ${trace.event_delta_total.toFixed(2)} |\n`;
    }
    report += '\n';

    // Acceptance test results
    report += '## Acceptance Tests\n\n';
    const testResults = await this.runAcceptanceTests();
    report += `**Status:** ${testResults.passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
    report += `- Total: ${testResults.total}\n`;
    report += `- Passed: ${testResults.passed_count}\n`;
    report += `- Failed: ${testResults.failed_count}\n\n`;

    // QA Scenario validation
    report += '## QA Scenario Validation\n\n';
    const scenarioResults = this.validateAllScenarios();
    report += `**Status:** ${scenarioResults.overall_passed ? '✅ ALL SCENARIOS PASSED' : '⚠️ SOME SCENARIOS NEED ATTENTION'}\n\n`;
    report += '| Scenario | Status | Details |\n';
    report += '|----------|--------|----------|\n';
    for (const scenario of scenarioResults.scenarios) {
      const status = scenario.passed ? '✅' : '⚠️';
      report += `| ${scenario.scenario_name} | ${status} | ${scenario.details} |\n`;
    }
    report += '\n';

    return report;
  }
}

// Export singleton instance
export const csiVerificationService = CSIVerificationService.getInstance();

// Export all types and utilities
export * from './types/CSITypes';
export { csiDatabase } from './storage/CSIDatabase';
export { scoringEngine } from './engine/ScoringEngine';
export { replayEngine } from './engine/ReplayEngine';
export { vectorRouter } from './engine/VectorRouter';
export { acceptanceTestHarness } from './tests/AcceptanceTests';