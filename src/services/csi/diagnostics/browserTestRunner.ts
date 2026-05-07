/**
 * Browser Test Runner
 * Allows running CSI integration tests from browser console
 * 
 * Usage in browser console:
 * import('/src/services/csi/diagnostics/browserTestRunner.ts').then(m => m.runBrowserTests())
 */

import { runCSIIntegrationTests } from './testCSIIntegration';
import { runQuickValidation, runFullValidation } from './validationReport';
import { csiDiagnosticService } from './CSIDiagnosticService';

/**
 * Run all browser-based tests
 */
export async function runBrowserTests() {
  console.log('🚀 Starting Browser-Based CSI Tests...\n');
  
  try {
    // Run integration tests
    const testReport = await runCSIIntegrationTests();
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testReport.totalTests}`);
    console.log(`Passed: ${testReport.passedTests} ✅`);
    console.log(`Failed: ${testReport.failedTests} ❌`);
    console.log(`Status: ${testReport.overallStatus}`);
    console.log('='.repeat(80) + '\n');
    
    return testReport;
  } catch (error) {
    console.error('❌ Browser tests failed:', error);
    throw error;
  }
}

/**
 * Run quick diagnostic
 */
export async function runQuickDiagnostic() {
  console.log('🔍 Running Quick Diagnostic...\n');
  
  try {
    const report = await csiDiagnosticService.runDiagnostic();
    csiDiagnosticService.printReport(report);
    return report;
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  }
}

/**
 * Run quick validation
 */
export async function runQuickValidationTest() {
  console.log('📊 Running Quick Validation...\n');
  
  try {
    const report = await runQuickValidation();
    return report;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

/**
 * Run full validation
 */
export async function runFullValidationTest() {
  console.log('📊 Running Full Validation...\n');
  
  try {
    const report = await runFullValidation();
    return report;
  } catch (error) {
    console.error('❌ Full validation failed:', error);
    throw error;
  }
}

/**
 * Test specific countries
 */
export async function testCountries(countries: string[]) {
  console.log(`🔍 Testing Countries: ${countries.join(', ')}\n`);
  
  try {
    const report = await csiDiagnosticService.runDiagnostic(countries);
    csiDiagnosticService.printReport(report);
    return report;
  } catch (error) {
    console.error('❌ Country test failed:', error);
    throw error;
  }
}

// Export for window object (for easy console access)
if (typeof window !== 'undefined') {
  (window as any).csiTests = {
    runBrowserTests,
    runQuickDiagnostic,
    runQuickValidation: runQuickValidationTest,
    runFullValidation: runFullValidationTest,
    testCountries
  };
  
  console.log('✅ CSI Test Suite loaded. Available commands:');
  console.log('  - window.csiTests.runBrowserTests()');
  console.log('  - window.csiTests.runQuickDiagnostic()');
  console.log('  - window.csiTests.runQuickValidation()');
  console.log('  - window.csiTests.runFullValidation()');
  console.log('  - window.csiTests.testCountries(["United States", "Iran", "Iraq"])');
}