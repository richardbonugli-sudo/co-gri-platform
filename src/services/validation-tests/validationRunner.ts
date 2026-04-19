/**
 * Validation Runner
 * 
 * Main entry point that imports and executes ALL validators.
 * Runs each validator sequentially, collects all results,
 * and passes them to the report generator.
 * 
 * Execute with: npx ts-node src/services/validation-tests/validationRunner.ts
 */

import { runTimeSeriesValidation } from './timeSeriesValidator';
import { runSignalTraceValidation } from './signalTraceValidator';
import { runQAScenarioValidation } from './qaScenarioValidator';
import { runDecayBehaviorValidation } from './decayBehaviorValidator';
import { runNettingValidation } from './nettingValidator';
import { runCrossVectorContaminationValidation } from './crossVectorContaminationValidator';
import {
  type ValidationSuiteResult,
  printReportToConsole,
  saveReportToFile,
} from './validationReport';

/**
 * Main validation runner
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           CSI VALIDATION SUITE - FULL EXECUTION            ║');
  console.log('║                                                            ║');
  console.log('║  Validators:                                               ║');
  console.log('║    1. Time Series Validator                                ║');
  console.log('║    2. Signal Trace Validator                               ║');
  console.log('║    3. QA Scenario Validator                                ║');
  console.log('║    4. Decay Behavior Validator                             ║');
  console.log('║    5. Netting Validator                                    ║');
  console.log('║    6. Cross-Vector Contamination Validator                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const suiteResults: ValidationSuiteResult[] = [];

  // ============================================================
  // 1. Time Series Validation
  // ============================================================
  try {
    const timeSeriesResults = runTimeSeriesValidation();
    suiteResults.push({
      suiteName: 'Time Series Validation',
      results: timeSeriesResults.map(r => ({
        testName: r.scenarioName,
        passed: r.passed,
        checks: r.checks,
      })),
    });
  } catch (error) {
    console.error('❌ Time Series Validation failed:', error);
    suiteResults.push({
      suiteName: 'Time Series Validation',
      results: [{
        testName: 'Time Series Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // 2. Signal Trace Validation
  // ============================================================
  try {
    const signalTraceResults = runSignalTraceValidation();
    suiteResults.push({
      suiteName: 'Signal Trace Validation',
      results: signalTraceResults.map(r => ({
        testName: r.eventName,
        passed: r.passed,
        checks: r.checks,
      })),
    });
  } catch (error) {
    console.error('❌ Signal Trace Validation failed:', error);
    suiteResults.push({
      suiteName: 'Signal Trace Validation',
      results: [{
        testName: 'Signal Trace Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // 3. QA Scenario Validation
  // ============================================================
  try {
    const qaResults = runQAScenarioValidation();
    suiteResults.push({
      suiteName: 'QA Scenario Validation',
      results: qaResults.map(r => ({
        testName: `${r.country}: ${r.description}`,
        passed: r.passed,
        checks: r.criteriaResults.map(cr => ({
          checkName: cr.name,
          passed: cr.passed,
          expected: cr.expectedOutcome,
          actual: cr.passed ? 'PASSED' : 'FAILED',
          message: cr.message,
        })),
      })),
    });
  } catch (error) {
    console.error('❌ QA Scenario Validation failed:', error);
    suiteResults.push({
      suiteName: 'QA Scenario Validation',
      results: [{
        testName: 'QA Scenario Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // 4. Decay Behavior Validation
  // ============================================================
  try {
    const decayResults = runDecayBehaviorValidation();
    suiteResults.push({
      suiteName: 'Decay Behavior Validation',
      results: decayResults.map(r => ({
        testName: r.testName,
        passed: r.passed,
        checks: r.checks,
      })),
    });
  } catch (error) {
    console.error('❌ Decay Behavior Validation failed:', error);
    suiteResults.push({
      suiteName: 'Decay Behavior Validation',
      results: [{
        testName: 'Decay Behavior Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // 5. Netting Validation
  // ============================================================
  try {
    const nettingResults = runNettingValidation();
    suiteResults.push({
      suiteName: 'Netting Validation',
      results: nettingResults.map(r => ({
        testName: r.testName,
        passed: r.passed,
        checks: r.checks,
      })),
    });
  } catch (error) {
    console.error('❌ Netting Validation failed:', error);
    suiteResults.push({
      suiteName: 'Netting Validation',
      results: [{
        testName: 'Netting Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // 6. Cross-Vector Contamination Validation
  // ============================================================
  try {
    const contaminationResults = runCrossVectorContaminationValidation();
    suiteResults.push({
      suiteName: 'Cross-Vector Contamination Validation',
      results: contaminationResults.map(r => ({
        testName: r.testName,
        passed: r.passed,
        checks: r.checks,
      })),
    });
  } catch (error) {
    console.error('❌ Cross-Vector Contamination Validation failed:', error);
    suiteResults.push({
      suiteName: 'Cross-Vector Contamination Validation',
      results: [{
        testName: 'Cross-Vector Contamination Validation (ERROR)',
        passed: false,
        checks: [{
          checkName: 'Execution',
          passed: false,
          expected: 'Successful execution',
          actual: `Error: ${error}`,
          message: `Validation suite failed to execute: ${error}`,
        }],
      }],
    });
  }

  // ============================================================
  // Generate Report
  // ============================================================
  const endTime = Date.now();
  const durationMs = endTime - startTime;

  // Print console report
  printReportToConsole(suiteResults, durationMs);

  // Save markdown report
  const reportPath = saveReportToFile(suiteResults, durationMs, '/workspace/shadcn-ui/validation-report.md');

  if (reportPath) {
    console.log(`\n✅ Validation complete! Report saved to: ${reportPath}`);
  } else {
    console.log('\n✅ Validation complete! (Report save failed, see console output above)');
  }
}

// Execute
main().catch(error => {
  console.error('Fatal error in validation runner:', error);
  process.exit(1);
});