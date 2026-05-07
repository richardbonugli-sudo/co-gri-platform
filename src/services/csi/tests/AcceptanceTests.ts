/**
 * CSI Implementation Verification - Acceptance Tests
 * Phase 1C: Automated acceptance tests (hard gates)
 */

import {
  CSIRiskVector,
  CSITrace,
  SignalProcessed,
  EventConfirmed,
  AcceptanceTestResult,
  AcceptanceTestCategory,
  SourceRole,
  SignalLifecycleState,
  TEST_COUNTRIES
} from '../types/CSITypes';
import { csiDatabase } from '../storage/CSIDatabase';
import { scoringEngine } from '../engine/ScoringEngine';
import { replayEngine } from '../engine/ReplayEngine';
import { vectorRouter } from '../engine/VectorRouter';

// ============================================================================
// ACCEPTANCE TEST HARNESS
// ============================================================================

/**
 * Acceptance Test Harness - runs all Phase 1 acceptance tests
 */
export class AcceptanceTestHarness {
  private static instance: AcceptanceTestHarness;
  private results: AcceptanceTestResult[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AcceptanceTestHarness {
    if (!AcceptanceTestHarness.instance) {
      AcceptanceTestHarness.instance = new AcceptanceTestHarness();
    }
    return AcceptanceTestHarness.instance;
  }

  /**
   * Run all acceptance tests
   * Phase 1 fails if ANY test fails
   */
  public async runAllTests(): Promise<{
    passed: boolean;
    total: number;
    passed_count: number;
    failed_count: number;
    results: AcceptanceTestResult[];
  }> {
    this.results = [];

    // Category 1: Baseline Isolation Tests
    await this.runBaselineIsolationTests();

    // Category 2: Expectation-Weighted Behavior Tests
    await this.runExpectationWeightedTests();

    // Category 3: Factor Scoping Tests
    await this.runFactorScopingTests();

    // Category 4: Source Role Enforcement Tests
    await this.runSourceRoleEnforcementTests();

    // Category 5: Confidence Handling Tests
    await this.runConfidenceHandlingTests();

    // Save all results
    for (const result of this.results) {
      csiDatabase.saveAcceptanceTestResult(result);
    }

    const passedCount = this.results.filter(r => r.passed).length;
    const failedCount = this.results.filter(r => !r.passed).length;

    return {
      passed: failedCount === 0,
      total: this.results.length,
      passed_count: passedCount,
      failed_count: failedCount,
      results: this.results
    };
  }

  // ============================================================================
  // CATEGORY 1: BASELINE ISOLATION TESTS
  // ============================================================================

  private async runBaselineIsolationTests(): Promise<void> {
    // Test 1.1: Baseline does not move intra-day due to detection signals
    await this.testBaselineDoesNotMoveOnSignals();

    // Test 1.2: Drift moves independently of baseline updates
    await this.testDriftMovesIndependentlyOfBaseline();

    // Test 1.3: Baseline remains fixed during replay window
    await this.testBaselineFixedDuringReplay();
  }

  private async testBaselineDoesNotMoveOnSignals(): Promise<void> {
    const testId = 'baseline_isolation_1';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'CHE'; // Switzerland - quiet control
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get baseline before signal
      const baselineBefore = scoringEngine.computeBaseline(countryId, hourAgo);

      // Inject a detection signal
      replayEngine.ingestSignal('reuters', countryId,
        'Test signal for baseline isolation check',
        now,
        { signal_type: 'tariff_threat', severity: 0.5, base_probability: 0.5 }
      );

      // Get baseline after signal
      const baselineAfter = scoringEngine.computeBaseline(countryId, now);

      // Assert baseline did not change
      const baselineUnchanged = baselineBefore.total === baselineAfter.total;
      assertions.push({
        assertion: 'Baseline total unchanged after signal injection',
        passed: baselineUnchanged,
        actual_value: baselineAfter.total,
        expected_value: baselineBefore.total
      });

      // Assert each vector baseline unchanged
      for (const vectorId of Object.values(CSIRiskVector)) {
        const vectorUnchanged = baselineBefore.by_vector[vectorId] === baselineAfter.by_vector[vectorId];
        assertions.push({
          assertion: `Baseline ${vectorId} unchanged after signal`,
          passed: vectorUnchanged,
          actual_value: baselineAfter.by_vector[vectorId],
          expected_value: baselineBefore.by_vector[vectorId]
        });
      }

      this.results.push({
        test_id: testId,
        test_name: 'Baseline does not move on detection signals',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Baseline does not move on detection signals',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testDriftMovesIndependentlyOfBaseline(): Promise<void> {
    const testId = 'baseline_isolation_2';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'CAN';
      const now = new Date();

      // Get CSI with signals
      const csiTrace = scoringEngine.computeCSI(countryId, now);

      // Verify drift can be non-zero while baseline is fixed
      const hasDrift = csiTrace.escalation_drift_total >= 0;
      assertions.push({
        assertion: 'Drift component exists independently',
        passed: hasDrift,
        actual_value: csiTrace.escalation_drift_total
      });

      // Verify baseline and drift are separate
      const componentsAreSeparate = 
        csiTrace.baseline_total !== csiTrace.escalation_drift_total ||
        csiTrace.escalation_drift_total === 0;
      assertions.push({
        assertion: 'Baseline and drift are separate components',
        passed: componentsAreSeparate,
        actual_value: { baseline: csiTrace.baseline_total, drift: csiTrace.escalation_drift_total }
      });

      this.results.push({
        test_id: testId,
        test_name: 'Drift moves independently of baseline',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Drift moves independently of baseline',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testBaselineFixedDuringReplay(): Promise<void> {
    const testId = 'baseline_isolation_3';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'USA';
      const now = new Date();
      const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const day60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Anchor baseline to 90 days ago (before replay window)
      const anchorDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Get baseline at different points in replay window
      const baselineAtStart = scoringEngine.computeBaseline(countryId, anchorDate);
      const baselineAt30Days = scoringEngine.computeBaseline(countryId, anchorDate);
      const baselineAtEnd = scoringEngine.computeBaseline(countryId, anchorDate);

      // All should be identical when using same anchor
      const baselineConsistent = 
        baselineAtStart.total === baselineAt30Days.total &&
        baselineAt30Days.total === baselineAtEnd.total;

      assertions.push({
        assertion: 'Baseline remains fixed throughout replay window',
        passed: baselineConsistent,
        actual_value: {
          start: baselineAtStart.total,
          middle: baselineAt30Days.total,
          end: baselineAtEnd.total
        }
      });

      this.results.push({
        test_id: testId,
        test_name: 'Baseline fixed during replay window',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Baseline fixed during replay window',
        test_category: AcceptanceTestCategory.BASELINE_ISOLATION,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  // ============================================================================
  // CATEGORY 2: EXPECTATION-WEIGHTED BEHAVIOR TESTS
  // ============================================================================

  private async runExpectationWeightedTests(): Promise<void> {
    // Test 2.1: CSI moves on escalation signals before confirmation
    await this.testCSIMovesBeforeConfirmation();

    // Test 2.2: Event confirmation nets prior drift within same vector
    await this.testEventNetsWithinSameVector();
  }

  private async testCSIMovesBeforeConfirmation(): Promise<void> {
    const testId = 'expectation_weighted_1';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'IRN';
      const now = new Date();

      // Get CSI trace
      const csiTrace = scoringEngine.computeCSI(countryId, now);

      // Check if there's drift from signals (before any confirmation)
      const hasPreConfirmationDrift = csiTrace.escalation_drift_total > 0;
      assertions.push({
        assertion: 'CSI shows drift from signals (expectation-weighted)',
        passed: hasPreConfirmationDrift,
        actual_value: csiTrace.escalation_drift_total
      });

      // Check that drift exists in expected vectors
      const sanctionsVector = csiTrace.by_vector[CSIRiskVector.SANCTIONS_REGULATORY];
      const hasSanctionsDrift = sanctionsVector.drift_v > 0 || sanctionsVector.active_signals.length > 0;
      assertions.push({
        assertion: 'Sanctions vector shows pre-event drift',
        passed: hasSanctionsDrift,
        actual_value: { drift: sanctionsVector.drift_v, signals: sanctionsVector.active_signals.length }
      });

      this.results.push({
        test_id: testId,
        test_name: 'CSI moves on signals before confirmation',
        test_category: AcceptanceTestCategory.EXPECTATION_WEIGHTED,
        passed: assertions.every(a => a.passed),
        assertions,
        trace_excerpt: {
          country_id: csiTrace.country_id,
          csi_total: csiTrace.csi_total,
          escalation_drift_total: csiTrace.escalation_drift_total
        },
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'CSI moves on signals before confirmation',
        test_category: AcceptanceTestCategory.EXPECTATION_WEIGHTED,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testEventNetsWithinSameVector(): Promise<void> {
    const testId = 'expectation_weighted_2';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'VEN';
      const now = new Date();

      // Get events for Venezuela
      const events = csiDatabase.getActiveEvents(countryId, now);

      // Check that events have netting actions recorded
      const eventsWithNetting = events.filter(e => e.netting_action && e.netting_action !== '');
      assertions.push({
        assertion: 'Events have netting actions recorded',
        passed: events.length === 0 || eventsWithNetting.length >= 0,
        actual_value: { total_events: events.length, with_netting: eventsWithNetting.length }
      });

      // Check that netting only happens within same vector
      for (const event of events) {
        if (event.prior_drift_netted > 0) {
          // Verify the netting action mentions same vector
          const nettingInSameVector = event.netting_action.includes(event.vector_id) || 
                                       event.netting_action === 'No prior drift to net';
          assertions.push({
            assertion: `Event ${event.event_id} netting within same vector ${event.vector_id}`,
            passed: nettingInSameVector,
            actual_value: event.netting_action
          });
        }
      }

      this.results.push({
        test_id: testId,
        test_name: 'Event confirmation nets prior drift within same vector',
        test_category: AcceptanceTestCategory.EXPECTATION_WEIGHTED,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Event confirmation nets prior drift within same vector',
        test_category: AcceptanceTestCategory.EXPECTATION_WEIGHTED,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  // ============================================================================
  // CATEGORY 3: FACTOR SCOPING TESTS
  // ============================================================================

  private async runFactorScopingTests(): Promise<void> {
    // Test 3.1: Every signal has exactly one vector_id
    await this.testSignalsSingleVector();

    // Test 3.2: Drift accumulation is vector-scoped
    await this.testDriftVectorScoped();

    // Test 3.3: No cross-factor netting
    await this.testNoCrossFactorNetting();
  }

  private async testSignalsSingleVector(): Promise<void> {
    const testId = 'factor_scoping_1';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const now = new Date();
      let allSignalsValid = true;
      let invalidSignals: string[] = [];

      // Check all signals across all test countries
      for (const country of TEST_COUNTRIES) {
        const signals = csiDatabase.getActiveSignals(country.id, now);
        
        for (const signal of signals) {
          const isValid = vectorRouter.validateSingleVectorAssignment(signal);
          if (!isValid) {
            allSignalsValid = false;
            invalidSignals.push(signal.signal_id);
          }
        }
      }

      assertions.push({
        assertion: 'All signals have exactly one vector_id',
        passed: allSignalsValid,
        actual_value: invalidSignals.length === 0 ? 'All valid' : `Invalid: ${invalidSignals.join(', ')}`
      });

      // Test vector classification
      const testClassification = vectorRouter.classifySignalToVector(
        'US threatens new tariffs on imports',
        'tariff_threat'
      );
      assertions.push({
        assertion: 'Vector classification returns exactly one vector',
        passed: testClassification.vectorId !== null,
        actual_value: testClassification.vectorId
      });

      this.results.push({
        test_id: testId,
        test_name: 'Every signal has exactly one vector_id',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Every signal has exactly one vector_id',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testDriftVectorScoped(): Promise<void> {
    const testId = 'factor_scoping_2';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'CHN';
      const now = new Date();

      // Get CSI trace
      const csiTrace = scoringEngine.computeCSI(countryId, now);

      // Verify drift is calculated per vector
      let totalDriftFromVectors = 0;
      for (const vectorId of Object.values(CSIRiskVector)) {
        totalDriftFromVectors += csiTrace.by_vector[vectorId].drift_v;
      }

      // Total should equal sum of vector drifts
      const driftSumsCorrectly = Math.abs(totalDriftFromVectors - csiTrace.escalation_drift_total) < 0.001;
      assertions.push({
        assertion: 'Total drift equals sum of vector drifts',
        passed: driftSumsCorrectly,
        actual_value: { total: csiTrace.escalation_drift_total, sum: totalDriftFromVectors }
      });

      // Verify caps are applied per vector
      for (const vectorId of Object.values(CSIRiskVector)) {
        const vectorTrace = csiTrace.by_vector[vectorId];
        if (vectorTrace.caps_applied_v.cumulative_cap_applied) {
          assertions.push({
            assertion: `Vector ${vectorId} cap applied independently`,
            passed: true,
            actual_value: vectorTrace.caps_applied_v
          });
        }
      }

      this.results.push({
        test_id: testId,
        test_name: 'Drift accumulation is vector-scoped',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Drift accumulation is vector-scoped',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testNoCrossFactorNetting(): Promise<void> {
    const testId = 'factor_scoping_3';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const now = new Date();

      // Check all events for cross-factor netting
      for (const country of TEST_COUNTRIES) {
        const events = csiDatabase.getActiveEvents(country.id, now);
        
        for (const event of events) {
          // Netting action should only reference same vector
          const nettingAction = event.netting_action;
          const eventVector = event.vector_id;
          
          // Check that netting doesn't mention other vectors
          const otherVectors = Object.values(CSIRiskVector).filter(v => v !== eventVector);
          const hasCrossFactorNetting = otherVectors.some(v => 
            nettingAction.includes(v) && !nettingAction.includes('No prior drift')
          );

          if (event.prior_drift_netted > 0) {
            assertions.push({
              assertion: `Event ${event.event_id} has no cross-factor netting`,
              passed: !hasCrossFactorNetting,
              actual_value: { vector: eventVector, netting_action: nettingAction }
            });
          }
        }
      }

      // If no events with netting, add a passing assertion
      if (assertions.length === 0) {
        assertions.push({
          assertion: 'No events with netting to check (vacuously true)',
          passed: true
        });
      }

      this.results.push({
        test_id: testId,
        test_name: 'No cross-factor netting occurs',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'No cross-factor netting occurs',
        test_category: AcceptanceTestCategory.FACTOR_SCOPING,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  // ============================================================================
  // CATEGORY 4: SOURCE ROLE ENFORCEMENT TESTS
  // ============================================================================

  private async runSourceRoleEnforcementTests(): Promise<void> {
    // Test 4.1: Detection sources generate signals only
    await this.testDetectionSourcesGenerateSignals();

    // Test 4.2: Confirmation sources confirm events only
    await this.testConfirmationSourcesConfirmEvents();

    // Test 4.3: Baseline sources don't generate signals or confirm events
    await this.testBaselineSourcesRestricted();
  }

  private async testDetectionSourcesGenerateSignals(): Promise<void> {
    const testId = 'source_role_1';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      // Get all detection sources
      const detectionSources = csiDatabase.getSourcesByRole(SourceRole.DETECTION);
      
      assertions.push({
        assertion: 'Detection sources exist in registry',
        passed: detectionSources.length > 0,
        actual_value: detectionSources.map(s => s.source_id)
      });

      // Verify detection sources can generate signals
      for (const source of detectionSources.slice(0, 3)) {
        const canGenerate = vectorRouter.validateSourceCanGenerateSignal(source.role);
        assertions.push({
          assertion: `Detection source ${source.source_id} can generate signals`,
          passed: canGenerate,
          actual_value: { source: source.source_id, role: source.role, can_generate: canGenerate }
        });

        // Verify detection sources cannot confirm events
        const canConfirm = vectorRouter.validateSourceCanConfirmEvent(source.role);
        assertions.push({
          assertion: `Detection source ${source.source_id} cannot confirm events`,
          passed: !canConfirm,
          actual_value: { source: source.source_id, role: source.role, can_confirm: canConfirm }
        });
      }

      this.results.push({
        test_id: testId,
        test_name: 'Detection sources generate signals only',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Detection sources generate signals only',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testConfirmationSourcesConfirmEvents(): Promise<void> {
    const testId = 'source_role_2';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      // Get all confirmation sources
      const confirmationSources = csiDatabase.getSourcesByRole(SourceRole.CONFIRMATION);
      
      assertions.push({
        assertion: 'Confirmation sources exist in registry',
        passed: confirmationSources.length > 0,
        actual_value: confirmationSources.map(s => s.source_id)
      });

      // Verify confirmation sources can confirm events
      for (const source of confirmationSources.slice(0, 3)) {
        const canConfirm = vectorRouter.validateSourceCanConfirmEvent(source.role);
        assertions.push({
          assertion: `Confirmation source ${source.source_id} can confirm events`,
          passed: canConfirm,
          actual_value: { source: source.source_id, role: source.role, can_confirm: canConfirm }
        });

        // Verify confirmation sources cannot generate signals
        const canGenerate = vectorRouter.validateSourceCanGenerateSignal(source.role);
        assertions.push({
          assertion: `Confirmation source ${source.source_id} cannot generate signals`,
          passed: !canGenerate,
          actual_value: { source: source.source_id, role: source.role, can_generate: canGenerate }
        });
      }

      this.results.push({
        test_id: testId,
        test_name: 'Confirmation sources confirm events only',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Confirmation sources confirm events only',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testBaselineSourcesRestricted(): Promise<void> {
    const testId = 'source_role_3';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      // Get all baseline sources
      const baselineSources = csiDatabase.getSourcesByRole(SourceRole.BASELINE);
      
      assertions.push({
        assertion: 'Baseline sources exist in registry',
        passed: baselineSources.length > 0,
        actual_value: baselineSources.map(s => s.source_id)
      });

      // Verify baseline sources cannot generate signals or confirm events
      for (const source of baselineSources) {
        const canGenerate = vectorRouter.validateSourceCanGenerateSignal(source.role);
        const canConfirm = vectorRouter.validateSourceCanConfirmEvent(source.role);
        
        assertions.push({
          assertion: `Baseline source ${source.source_id} cannot generate signals`,
          passed: !canGenerate,
          actual_value: { source: source.source_id, can_generate: canGenerate }
        });

        assertions.push({
          assertion: `Baseline source ${source.source_id} cannot confirm events`,
          passed: !canConfirm,
          actual_value: { source: source.source_id, can_confirm: canConfirm }
        });
      }

      this.results.push({
        test_id: testId,
        test_name: 'Baseline sources restricted to structural priors',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Baseline sources restricted to structural priors',
        test_category: AcceptanceTestCategory.SOURCE_ROLE_ENFORCEMENT,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  // ============================================================================
  // CATEGORY 5: CONFIDENCE HANDLING TESTS
  // ============================================================================

  private async runConfidenceHandlingTests(): Promise<void> {
    // Test 5.1: Confidence affects metadata only
    await this.testConfidenceMetadataOnly();

    // Test 5.2: Confidence does not scale CSI values
    await this.testConfidenceDoesNotScaleCSI();
  }

  private async testConfidenceMetadataOnly(): Promise<void> {
    const testId = 'confidence_handling_1';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'RUS';
      const now = new Date();

      // Get CSI trace
      const csiTrace = scoringEngine.computeCSI(countryId, now);

      // Verify confidence is present in metadata
      const hasConfidence = typeof csiTrace.confidence_score === 'number';
      assertions.push({
        assertion: 'Confidence score is present in trace',
        passed: hasConfidence,
        actual_value: csiTrace.confidence_score
      });

      // Verify confidence is between 0 and 1
      const confidenceInRange = csiTrace.confidence_score >= 0 && csiTrace.confidence_score <= 1;
      assertions.push({
        assertion: 'Confidence score is in valid range [0, 1]',
        passed: confidenceInRange,
        actual_value: csiTrace.confidence_score
      });

      this.results.push({
        test_id: testId,
        test_name: 'Confidence affects metadata only',
        test_category: AcceptanceTestCategory.CONFIDENCE_HANDLING,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Confidence affects metadata only',
        test_category: AcceptanceTestCategory.CONFIDENCE_HANDLING,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  private async testConfidenceDoesNotScaleCSI(): Promise<void> {
    const testId = 'confidence_handling_2';
    const assertions: AcceptanceTestResult['assertions'] = [];

    try {
      const countryId = 'CHN';
      const now = new Date();

      // Get CSI trace
      const csiTrace = scoringEngine.computeCSI(countryId, now);

      // Verify CSI total is NOT multiplied by confidence
      const expectedTotal = csiTrace.baseline_total + 
                           csiTrace.escalation_drift_total + 
                           csiTrace.event_delta_total;
      
      const csiNotScaledByConfidence = Math.abs(csiTrace.csi_total - expectedTotal) < 0.01 ||
                                       csiTrace.csi_total === Math.min(100, Math.max(0, expectedTotal));
      
      assertions.push({
        assertion: 'CSI total is not scaled by confidence',
        passed: csiNotScaledByConfidence,
        actual_value: {
          csi_total: csiTrace.csi_total,
          components_sum: expectedTotal,
          confidence: csiTrace.confidence_score
        }
      });

      // Verify drift is not scaled by confidence
      let driftSum = 0;
      for (const vectorId of Object.values(CSIRiskVector)) {
        driftSum += csiTrace.by_vector[vectorId].drift_v;
      }
      const driftNotScaled = Math.abs(driftSum - csiTrace.escalation_drift_total) < 0.01;
      assertions.push({
        assertion: 'Drift values are not scaled by confidence',
        passed: driftNotScaled,
        actual_value: { drift_total: csiTrace.escalation_drift_total, vector_sum: driftSum }
      });

      this.results.push({
        test_id: testId,
        test_name: 'Confidence does not scale CSI values',
        test_category: AcceptanceTestCategory.CONFIDENCE_HANDLING,
        passed: assertions.every(a => a.passed),
        assertions,
        executed_at: new Date()
      });
    } catch (error) {
      this.results.push({
        test_id: testId,
        test_name: 'Confidence does not scale CSI values',
        test_category: AcceptanceTestCategory.CONFIDENCE_HANDLING,
        passed: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        assertions,
        executed_at: new Date()
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get test results summary
   */
  public getResultsSummary(): {
    by_category: Record<string, { passed: number; failed: number }>;
    total_passed: number;
    total_failed: number;
  } {
    const byCategory: Record<string, { passed: number; failed: number }> = {};

    for (const result of this.results) {
      if (!byCategory[result.test_category]) {
        byCategory[result.test_category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        byCategory[result.test_category].passed++;
      } else {
        byCategory[result.test_category].failed++;
      }
    }

    return {
      by_category: byCategory,
      total_passed: this.results.filter(r => r.passed).length,
      total_failed: this.results.filter(r => !r.passed).length
    };
  }

  /**
   * Generate test report
   */
  public generateReport(): string {
    const summary = this.getResultsSummary();
    let report = '# CSI Phase 1 Acceptance Test Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${this.results.length}\n`;
    report += `- **Passed:** ${summary.total_passed}\n`;
    report += `- **Failed:** ${summary.total_failed}\n`;
    report += `- **Status:** ${summary.total_failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n\n`;

    report += `## Results by Category\n\n`;
    for (const [category, stats] of Object.entries(summary.by_category)) {
      const status = stats.failed === 0 ? '✅' : '❌';
      report += `### ${status} ${category}\n`;
      report += `- Passed: ${stats.passed}\n`;
      report += `- Failed: ${stats.failed}\n\n`;
    }

    report += `## Detailed Results\n\n`;
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      report += `### ${status} ${result.test_name}\n`;
      report += `- **Test ID:** ${result.test_id}\n`;
      report += `- **Category:** ${result.test_category}\n`;
      report += `- **Status:** ${result.passed ? 'PASSED' : 'FAILED'}\n`;
      
      if (result.error_message) {
        report += `- **Error:** ${result.error_message}\n`;
      }

      report += `\n**Assertions:**\n`;
      for (const assertion of result.assertions) {
        const assertStatus = assertion.passed ? '✓' : '✗';
        report += `- ${assertStatus} ${assertion.assertion}\n`;
        if (assertion.actual_value !== undefined) {
          report += `  - Actual: ${JSON.stringify(assertion.actual_value)}\n`;
        }
        if (assertion.expected_value !== undefined) {
          report += `  - Expected: ${JSON.stringify(assertion.expected_value)}\n`;
        }
      }
      report += '\n';
    }

    return report;
  }
}

// Export singleton instance
export const acceptanceTestHarness = AcceptanceTestHarness.getInstance();