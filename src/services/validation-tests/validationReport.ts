/**
 * Validation Report Generator
 * 
 * Generates a markdown report of all validation results.
 * Includes summary statistics (total tests, passed, failed).
 * Outputs to console and optionally to a .md file.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ValidationSuiteResult {
  suiteName: string;
  results: Array<{
    testName: string;
    passed: boolean;
    checks: Array<{
      checkName: string;
      passed: boolean;
      expected: string;
      actual: string;
      message: string;
    }>;
  }>;
}

export interface ValidationSummary {
  totalSuites: number;
  totalTests: number;
  totalChecks: number;
  passedTests: number;
  failedTests: number;
  passedChecks: number;
  failedChecks: number;
  overallPassRate: number;
  timestamp: string;
  duration: number;
}

/**
 * Generate validation summary from suite results
 */
function generateSummary(suites: ValidationSuiteResult[], durationMs: number): ValidationSummary {
  let totalTests = 0;
  let totalChecks = 0;
  let passedTests = 0;
  let failedTests = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  for (const suite of suites) {
    for (const result of suite.results) {
      totalTests++;
      if (result.passed) {
        passedTests++;
      } else {
        failedTests++;
      }

      for (const check of result.checks) {
        totalChecks++;
        if (check.passed) {
          passedChecks++;
        } else {
          failedChecks++;
        }
      }
    }
  }

  return {
    totalSuites: suites.length,
    totalTests,
    totalChecks,
    passedTests,
    failedTests,
    passedChecks,
    failedChecks,
    overallPassRate: totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0,
    timestamp: new Date().toISOString(),
    duration: durationMs,
  };
}

/**
 * Generate markdown report
 */
export function generateMarkdownReport(suites: ValidationSuiteResult[], durationMs: number): string {
  const summary = generateSummary(suites, durationMs);
  const lines: string[] = [];

  // Header
  lines.push('# CSI Validation Suite Report');
  lines.push('');
  lines.push(`**Generated:** ${summary.timestamp}`);
  lines.push(`**Duration:** ${(summary.duration / 1000).toFixed(2)}s`);
  lines.push('');

  // Summary Box
  lines.push('## 📊 Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Suites | ${summary.totalSuites} |`);
  lines.push(`| Total Tests | ${summary.totalTests} |`);
  lines.push(`| Total Checks | ${summary.totalChecks} |`);
  lines.push(`| ✅ Passed Tests | ${summary.passedTests} |`);
  lines.push(`| ❌ Failed Tests | ${summary.failedTests} |`);
  lines.push(`| ✅ Passed Checks | ${summary.passedChecks} |`);
  lines.push(`| ❌ Failed Checks | ${summary.failedChecks} |`);
  lines.push(`| **Overall Pass Rate** | **${summary.overallPassRate.toFixed(1)}%** |`);
  lines.push('');

  // Overall Status
  const overallStatus = summary.failedTests === 0 ? '✅ ALL TESTS PASSED' :
    summary.overallPassRate >= 90 ? '⚠️ MOSTLY PASSING (some failures)' :
    '❌ SIGNIFICANT FAILURES';
  lines.push(`### Overall Status: ${overallStatus}`);
  lines.push('');

  // Detailed Results by Suite
  lines.push('---');
  lines.push('');
  lines.push('## 📋 Detailed Results');
  lines.push('');

  for (const suite of suites) {
    const suitePassedTests = suite.results.filter(r => r.passed).length;
    const suiteTotalTests = suite.results.length;
    const suiteStatus = suitePassedTests === suiteTotalTests ? '✅' : '⚠️';

    lines.push(`### ${suiteStatus} ${suite.suiteName} (${suitePassedTests}/${suiteTotalTests} tests passed)`);
    lines.push('');

    for (const result of suite.results) {
      const testStatus = result.passed ? '✅' : '❌';
      const passedChecks = result.checks.filter(c => c.passed).length;

      lines.push(`#### ${testStatus} ${result.testName} (${passedChecks}/${result.checks.length} checks)`);
      lines.push('');
      lines.push('| Check | Status | Expected | Actual |');
      lines.push('|-------|--------|----------|--------|');

      for (const check of result.checks) {
        const checkStatus = check.passed ? '✅' : '❌';
        const escapedExpected = check.expected.replace(/\|/g, '\\|');
        const escapedActual = check.actual.replace(/\|/g, '\\|');
        lines.push(`| ${check.checkName} | ${checkStatus} | ${escapedExpected} | ${escapedActual} |`);
      }

      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  // Failed Checks Summary
  const failedChecks: Array<{ suite: string; test: string; check: string; expected: string; actual: string }> = [];
  for (const suite of suites) {
    for (const result of suite.results) {
      for (const check of result.checks) {
        if (!check.passed) {
          failedChecks.push({
            suite: suite.suiteName,
            test: result.testName,
            check: check.checkName,
            expected: check.expected,
            actual: check.actual,
          });
        }
      }
    }
  }

  if (failedChecks.length > 0) {
    lines.push('## ❌ Failed Checks Summary');
    lines.push('');
    lines.push('| Suite | Test | Check | Expected | Actual |');
    lines.push('|-------|------|-------|----------|--------|');

    for (const fc of failedChecks) {
      lines.push(`| ${fc.suite} | ${fc.test} | ${fc.check} | ${fc.expected} | ${fc.actual} |`);
    }

    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by CSI Validation Suite*');
  lines.push(`*Validation Framework Version: 1.0.0*`);
  lines.push(`*Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`);

  return lines.join('\n');
}

/**
 * Print report to console
 */
export function printReportToConsole(suites: ValidationSuiteResult[], durationMs: number): void {
  const summary = generateSummary(suites, durationMs);

  console.log('\n' + '='.repeat(80));
  console.log('  CSI VALIDATION SUITE REPORT');
  console.log('='.repeat(80));
  console.log('');
  console.log(`  Timestamp:      ${summary.timestamp}`);
  console.log(`  Duration:       ${(summary.duration / 1000).toFixed(2)}s`);
  console.log(`  Total Suites:   ${summary.totalSuites}`);
  console.log(`  Total Tests:    ${summary.totalTests}`);
  console.log(`  Total Checks:   ${summary.totalChecks}`);
  console.log('');
  console.log(`  ✅ Passed Tests:  ${summary.passedTests}`);
  console.log(`  ❌ Failed Tests:  ${summary.failedTests}`);
  console.log(`  ✅ Passed Checks: ${summary.passedChecks}`);
  console.log(`  ❌ Failed Checks: ${summary.failedChecks}`);
  console.log('');
  console.log(`  📊 Overall Pass Rate: ${summary.overallPassRate.toFixed(1)}%`);
  console.log('');

  const overallStatus = summary.failedTests === 0 ? '✅ ALL TESTS PASSED' :
    summary.overallPassRate >= 90 ? '⚠️ MOSTLY PASSING' :
    '❌ SIGNIFICANT FAILURES';
  console.log(`  Status: ${overallStatus}`);
  console.log('');
  console.log('='.repeat(80));
}

/**
 * Save report to markdown file
 */
export function saveReportToFile(suites: ValidationSuiteResult[], durationMs: number, outputPath?: string): string {
  const markdown = generateMarkdownReport(suites, durationMs);
  const filePath = outputPath || path.join(process.cwd(), 'validation-report.md');

  try {
    fs.writeFileSync(filePath, markdown, 'utf-8');
    console.log(`\n📄 Report saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Failed to save report: ${error}`);
    return '';
  }
}