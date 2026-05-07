/**
 * CSI Integration Test Utility
 * Comprehensive testing suite for validating CSI responsiveness fix
 * 
 * Tests:
 * 1. Event storage and retrieval
 * 2. Composite CSI calculation
 * 3. Dashboard data integration
 * 4. End-to-end data flow
 */

import { csiDiagnosticService } from './CSIDiagnosticService';
import { compositeCalculator } from '../compositeCalculator';
import { eventStore } from '../eventStore';
import { baselineManager } from '../baselineManager';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import type { CreateEventInput, EventRecord } from '@/types/csi.types';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  timestamp: string;
  duration: number;
}

export interface IntegrationTestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallStatus: 'PASS' | 'FAIL';
  testResults: TestResult[];
  diagnosticReport?: any;
  summary: string;
}

export class CSIIntegrationTester {
  private testResults: TestResult[] = [];

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🧪 Starting CSI Integration Tests...\n');
    
    this.testResults = [];
    const startTime = Date.now();

    // Test 1: Baseline Manager
    await this.testBaselineManager();

    // Test 2: Event Storage
    await this.testEventStorage();

    // Test 3: Composite CSI Calculation
    await this.testCompositeCalculation();

    // Test 4: Dashboard Data Flow
    await this.testDashboardDataFlow();

    // Test 5: Event-Driven Updates
    await this.testEventDrivenUpdates();

    // Test 6: Multi-Country Validation
    await this.testMultiCountryValidation();

    // Run diagnostic service
    const diagnosticReport = await csiDiagnosticService.runDiagnostic();

    const totalDuration = Date.now() - startTime;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = this.testResults.filter(t => !t.passed).length;

    const report: IntegrationTestReport = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      overallStatus: failedTests === 0 ? 'PASS' : 'FAIL',
      testResults: this.testResults,
      diagnosticReport,
      summary: this.generateSummary(passedTests, failedTests, totalDuration)
    };

    this.printReport(report);
    return report;
  }

  /**
   * Test 1: Baseline Manager
   */
  private async testBaselineManager(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Baseline Manager Initialization';

    try {
      // Check if baselines exist for test countries
      const testCountries = ['United States', 'Iran', 'Iraq', 'Israel'];
      let allBaselinesExist = true;
      const missingCountries: string[] = [];

      for (const country of testCountries) {
        const baseline = baselineManager.getBaselineCSI(country);
        if (!baseline) {
          allBaselinesExist = false;
          missingCountries.push(country);
        }
      }

      const passed = allBaselinesExist;
      const details = passed
        ? `All ${testCountries.length} test countries have baseline CSI values`
        : `Missing baselines for: ${missingCountries.join(', ')}`;

      this.addTestResult(testName, passed, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Test 2: Event Storage
   */
  private async testEventStorage(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Event Storage and Retrieval';

    try {
      // Create a test event
      const testEvent: CreateEventInput = {
        country: 'United States',
        event_type: 'SANCTION',
        primary_vector: 'sanctions',
        severity: 'HIGH',
        delta_csi: 5.0,
        detected_date: new Date().toISOString(),
        description: 'Test event for integration testing',
        sources: ['TEST_SOURCE'],
        rationale: 'Integration test validation',
        affected_sectors: ['Technology'],
        created_by: 'test_system'
      };

      const createdEvent = eventStore.createEvent(testEvent);
      const retrievedEvent = eventStore.getEvent(createdEvent.event_id);

      const passed = retrievedEvent !== undefined && 
                    retrievedEvent.country === testEvent.country &&
                    retrievedEvent.delta_csi === testEvent.delta_csi;

      const details = passed
        ? `Event created and retrieved successfully (ID: ${createdEvent.event_id})`
        : 'Failed to create or retrieve test event';

      // Clean up test event
      if (createdEvent) {
        eventStore.deleteEvent(createdEvent.event_id, 'test_system', 'Test cleanup');
      }

      this.addTestResult(testName, passed, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Test 3: Composite CSI Calculation
   */
  private async testCompositeCalculation(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Composite CSI Calculation';

    try {
      const testCountry = 'United States';
      
      // Get baseline
      const baseline = baselineManager.getBaselineCSI(testCountry);
      if (!baseline) {
        this.addTestResult(testName, false, `No baseline found for ${testCountry}`, Date.now() - startTime);
        return;
      }

      // Calculate composite
      const composite = compositeCalculator.calculateCompositeCSI(testCountry);

      // Validate calculation
      const passed = 
        composite.country === testCountry &&
        composite.baseline_csi === baseline.baseline_value &&
        composite.composite_csi === composite.baseline_csi + composite.event_csi &&
        composite.active_events !== undefined;

      const details = passed
        ? `Composite CSI calculated: Baseline=${composite.baseline_csi.toFixed(1)}, Events=${composite.event_csi.toFixed(1)}, Total=${composite.composite_csi.toFixed(1)} (${composite.active_events.length} active events)`
        : 'Composite calculation validation failed';

      this.addTestResult(testName, passed, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Test 4: Dashboard Data Flow
   */
  private async testDashboardDataFlow(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Dashboard Data Flow Integration';

    try {
      const testCountries = ['United States', 'Iran', 'Iraq', 'Israel'];
      const results: string[] = [];
      let allCorrect = true;

      for (const country of testCountries) {
        // Get what dashboard would display (from GLOBAL_COUNTRIES)
        const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
        const displayedCSI = countryData?.csi || 0;

        // Get what should be displayed (composite CSI)
        const composite = compositeCalculator.calculateCompositeCSI(country);
        const correctCSI = composite.composite_csi;

        const discrepancy = Math.abs(displayedCSI - correctCSI);
        
        if (discrepancy > 1) {
          allCorrect = false;
          results.push(`${country}: Displayed=${displayedCSI.toFixed(1)}, Should be=${correctCSI.toFixed(1)} (Δ=${discrepancy.toFixed(1)})`);
        } else {
          results.push(`${country}: ✓ Correct (${correctCSI.toFixed(1)})`);
        }
      }

      const details = allCorrect
        ? `All ${testCountries.length} countries display correct CSI values`
        : `Discrepancies found:\n${results.join('\n')}`;

      this.addTestResult(testName, allCorrect, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Test 5: Event-Driven Updates
   */
  private async testEventDrivenUpdates(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Event-Driven CSI Updates';

    try {
      const testCountry = 'Iran';
      
      // Get initial composite CSI
      const initialComposite = compositeCalculator.calculateCompositeCSI(testCountry);
      const initialCSI = initialComposite.composite_csi;

      // Create a test event
      const testEvent: CreateEventInput = {
        country: testCountry,
        event_type: 'SANCTION',
        primary_vector: 'sanctions',
        severity: 'HIGH',
        delta_csi: 10.0,
        detected_date: new Date().toISOString(),
        description: 'Test event for update validation',
        sources: ['TEST_SOURCE'],
        rationale: 'Testing event-driven updates',
        affected_sectors: ['Energy'],
        created_by: 'test_system'
      };

      const createdEvent = eventStore.createEvent(testEvent);

      // Transition to CONFIRMED state (this makes it active)
      await eventStore.transitionEventState({
        event_id: createdEvent.event_id,
        new_state: 'CONFIRMED',
        user: 'test_system',
        reason: 'Test validation'
      });

      // Get updated composite CSI
      const updatedComposite = compositeCalculator.calculateCompositeCSI(testCountry);
      const updatedCSI = updatedComposite.composite_csi;

      // Validate that CSI increased by approximately the delta
      const expectedIncrease = testEvent.delta_csi;
      const actualIncrease = updatedCSI - initialCSI;
      const passed = Math.abs(actualIncrease - expectedIncrease) < 0.1;

      const details = passed
        ? `CSI updated correctly: Initial=${initialCSI.toFixed(1)}, After Event=${updatedCSI.toFixed(1)}, Increase=${actualIncrease.toFixed(1)} (Expected=${expectedIncrease.toFixed(1)})`
        : `CSI update mismatch: Expected increase=${expectedIncrease.toFixed(1)}, Actual=${actualIncrease.toFixed(1)}`;

      // Clean up test event
      eventStore.deleteEvent(createdEvent.event_id, 'test_system', 'Test cleanup');

      this.addTestResult(testName, passed, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Test 6: Multi-Country Validation
   */
  private async testMultiCountryValidation(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Multi-Country CSI Validation';

    try {
      const testCountries = ['United States', 'Iran', 'Iraq', 'Israel', 'Russia', 'China'];
      const validationResults: string[] = [];
      let allValid = true;

      for (const country of testCountries) {
        const composite = compositeCalculator.calculateCompositeCSI(country);
        
        // Validate composite calculation
        const calculatedSum = composite.baseline_csi + composite.event_csi;
        const isValid = Math.abs(calculatedSum - composite.composite_csi) < 0.01;

        if (!isValid) {
          allValid = false;
          validationResults.push(`${country}: INVALID - Baseline(${composite.baseline_csi}) + Events(${composite.event_csi}) ≠ Composite(${composite.composite_csi})`);
        } else {
          validationResults.push(`${country}: ✓ Valid (Composite=${composite.composite_csi.toFixed(1)}, Events=${composite.active_events.length})`);
        }
      }

      const details = allValid
        ? `All ${testCountries.length} countries have valid CSI calculations`
        : `Validation errors:\n${validationResults.join('\n')}`;

      this.addTestResult(testName, allValid, details, Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `Error: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * Add test result
   */
  private addTestResult(testName: string, passed: boolean, details: string, duration: number): void {
    const result: TestResult = {
      testName,
      passed,
      details,
      timestamp: new Date().toISOString(),
      duration
    };

    this.testResults.push(result);

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    console.log(`   ${details}`);
    console.log(`   Duration: ${duration}ms\n`);
  }

  /**
   * Generate summary
   */
  private generateSummary(passed: number, failed: number, duration: number): string {
    const total = passed + failed;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    return `
Integration Test Summary:
- Total Tests: ${total}
- Passed: ${passed} (${passRate}%)
- Failed: ${failed}
- Total Duration: ${duration}ms
- Status: ${failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
    `.trim();
  }

  /**
   * Print report to console
   */
  private printReport(report: IntegrationTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('CSI INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    console.log(report.summary);
    console.log('='.repeat(80) + '\n');

    // Print failed tests details
    const failedTests = report.testResults.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('FAILED TESTS DETAILS:');
      console.log('-'.repeat(80));
      failedTests.forEach(test => {
        console.log(`❌ ${test.testName}`);
        console.log(`   ${test.details}`);
        console.log('');
      });
    }
  }

  /**
   * Export report as JSON
   */
  exportReport(report: IntegrationTestReport): string {
    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const csiIntegrationTester = new CSIIntegrationTester();

/**
 * Quick test runner for console
 */
export async function runCSIIntegrationTests(): Promise<IntegrationTestReport> {
  return await csiIntegrationTester.runAllTests();
}