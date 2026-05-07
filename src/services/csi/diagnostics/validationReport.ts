/**
 * Validation Report Generator
 * Creates detailed validation reports for CSI system health
 */

import { csiDiagnosticService } from './CSIDiagnosticService';
import { csiIntegrationTester } from './testCSIIntegration';
import type { CSIDiagnosticReport } from './CSIDiagnosticService';
import type { IntegrationTestReport } from './testCSIIntegration';

export interface ValidationReport {
  timestamp: string;
  reportType: 'full' | 'quick' | 'country-specific';
  systemStatus: 'healthy' | 'degraded' | 'critical';
  diagnosticReport: CSIDiagnosticReport;
  integrationTestReport?: IntegrationTestReport;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    implementation: string;
  }>;
  nextSteps: string[];
}

export class ValidationReportGenerator {
  /**
   * Generate full validation report
   */
  async generateFullReport(): Promise<ValidationReport> {
    console.log('📊 Generating Full Validation Report...\n');

    // Run diagnostic
    const diagnosticReport = await csiDiagnosticService.runDiagnostic();

    // Run integration tests
    const integrationTestReport = await csiIntegrationTester.runAllTests();

    // Determine system status
    const systemStatus = this.determineSystemStatus(diagnosticReport, integrationTestReport);

    // Generate recommendations
    const recommendations = this.generateRecommendations(diagnosticReport, integrationTestReport);

    // Generate next steps
    const nextSteps = this.generateNextSteps(systemStatus, recommendations);

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      reportType: 'full',
      systemStatus,
      diagnosticReport,
      integrationTestReport,
      recommendations,
      nextSteps
    };

    this.printValidationReport(report);
    return report;
  }

  /**
   * Generate quick validation report (diagnostic only)
   */
  async generateQuickReport(): Promise<ValidationReport> {
    console.log('📊 Generating Quick Validation Report...\n');

    const diagnosticReport = await csiDiagnosticService.runDiagnostic();
    const systemStatus = diagnosticReport.summary.systemHealth;
    const recommendations = diagnosticReport.recommendations.map(r => ({
      priority: r.priority,
      action: r.issue,
      rationale: r.recommendation,
      implementation: r.implementation
    }));
    const nextSteps = this.generateNextSteps(systemStatus, recommendations);

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      reportType: 'quick',
      systemStatus,
      diagnosticReport,
      recommendations,
      nextSteps
    };

    this.printValidationReport(report);
    return report;
  }

  /**
   * Generate country-specific validation report
   */
  async generateCountryReport(countries: string[]): Promise<ValidationReport> {
    console.log(`📊 Generating Country-Specific Validation Report for: ${countries.join(', ')}\n`);

    const diagnosticReport = await csiDiagnosticService.runDiagnostic(countries);
    const systemStatus = diagnosticReport.summary.systemHealth;
    const recommendations = diagnosticReport.recommendations.map(r => ({
      priority: r.priority,
      action: r.issue,
      rationale: r.recommendation,
      implementation: r.implementation
    }));
    const nextSteps = this.generateNextSteps(systemStatus, recommendations);

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      reportType: 'country-specific',
      systemStatus,
      diagnosticReport,
      recommendations,
      nextSteps
    };

    this.printValidationReport(report);
    return report;
  }

  /**
   * Determine overall system status
   */
  private determineSystemStatus(
    diagnostic: CSIDiagnosticReport,
    integration?: IntegrationTestReport
  ): 'healthy' | 'degraded' | 'critical' {
    // Check diagnostic status
    if (diagnostic.summary.systemHealth === 'critical') {
      return 'critical';
    }

    // Check integration tests if available
    if (integration && integration.failedTests > 0) {
      return integration.failedTests > 2 ? 'critical' : 'degraded';
    }

    // Check for critical recommendations
    const criticalRecs = diagnostic.recommendations.filter(r => r.priority === 'critical');
    if (criticalRecs.length > 0) {
      return 'critical';
    }

    // Check for affected countries
    if (diagnostic.summary.affectedCountries.length > 5) {
      return 'degraded';
    }

    return diagnostic.summary.systemHealth;
  }

  /**
   * Generate consolidated recommendations
   */
  private generateRecommendations(
    diagnostic: CSIDiagnosticReport,
    integration?: IntegrationTestReport
  ): ValidationReport['recommendations'] {
    const recommendations: ValidationReport['recommendations'] = [];

    // Add diagnostic recommendations
    diagnostic.recommendations.forEach(r => {
      recommendations.push({
        priority: r.priority,
        action: r.issue,
        rationale: r.recommendation,
        implementation: r.implementation
      });
    });

    // Add integration test-based recommendations
    if (integration && integration.failedTests > 0) {
      const failedTests = integration.testResults.filter(t => !t.passed);
      failedTests.forEach(test => {
        recommendations.push({
          priority: 'high',
          action: `Fix failed integration test: ${test.testName}`,
          rationale: test.details,
          implementation: 'Review test failure details and implement necessary fixes'
        });
      });
    }

    return recommendations;
  }

  /**
   * Generate next steps based on system status
   */
  private generateNextSteps(
    status: 'healthy' | 'degraded' | 'critical',
    recommendations: ValidationReport['recommendations']
  ): string[] {
    const nextSteps: string[] = [];

    if (status === 'critical') {
      nextSteps.push('🚨 IMMEDIATE ACTION REQUIRED: Address all critical issues before proceeding');
      nextSteps.push('1. Update dashboard components to use composite CSI calculator');
      nextSteps.push('2. Verify event detection pipeline is running');
      nextSteps.push('3. Re-run validation tests to confirm fixes');
    } else if (status === 'degraded') {
      nextSteps.push('⚠️ System requires attention: Address high-priority issues');
      nextSteps.push('1. Review and implement high-priority recommendations');
      nextSteps.push('2. Monitor system health over next 24 hours');
      nextSteps.push('3. Run validation tests after implementing fixes');
    } else {
      nextSteps.push('✅ System is healthy: Continue with normal operations');
      nextSteps.push('1. Monitor for any new events');
      nextSteps.push('2. Perform periodic validation checks');
      nextSteps.push('3. Review medium/low priority recommendations for optimization');
    }

    // Add specific recommendations
    const criticalRecs = recommendations.filter(r => r.priority === 'critical');
    if (criticalRecs.length > 0) {
      nextSteps.push('\nCritical Actions:');
      criticalRecs.forEach((rec, idx) => {
        nextSteps.push(`${idx + 1}. ${rec.action}`);
      });
    }

    return nextSteps;
  }

  /**
   * Print validation report to console
   */
  private printValidationReport(report: ValidationReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Report Type: ${report.reportType}`);
    console.log(`System Status: ${report.systemStatus.toUpperCase()}`);
    console.log('='.repeat(80));

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      console.log('-'.repeat(80));
      report.recommendations.forEach((rec, idx) => {
        const priorityIcon = rec.priority === 'critical' ? '🚨' : 
                           rec.priority === 'high' ? '⚠️' : 
                           rec.priority === 'medium' ? '📌' : 'ℹ️';
        console.log(`${idx + 1}. ${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`   Rationale: ${rec.rationale}`);
        console.log(`   Implementation: ${rec.implementation}`);
        console.log('');
      });
    }

    // Print next steps
    console.log('\nNEXT STEPS:');
    console.log('-'.repeat(80));
    report.nextSteps.forEach(step => {
      console.log(step);
    });

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Export report as JSON
   */
  exportReport(report: ValidationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as Markdown
   */
  exportReportAsMarkdown(report: ValidationReport): string {
    let markdown = `# CSI Validation Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Report Type:** ${report.reportType}\n`;
    markdown += `**System Status:** ${report.systemStatus.toUpperCase()}\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- **Total Issues:** ${report.diagnosticReport.summary.totalIssues}\n`;
    markdown += `- **Critical Issues:** ${report.diagnosticReport.summary.criticalIssues}\n`;
    markdown += `- **Affected Countries:** ${report.diagnosticReport.summary.affectedCountries.length}\n\n`;

    if (report.integrationTestReport) {
      markdown += `## Integration Tests\n\n`;
      markdown += `- **Total Tests:** ${report.integrationTestReport.totalTests}\n`;
      markdown += `- **Passed:** ${report.integrationTestReport.passedTests}\n`;
      markdown += `- **Failed:** ${report.integrationTestReport.failedTests}\n`;
      markdown += `- **Status:** ${report.integrationTestReport.overallStatus}\n\n`;
    }

    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, idx) => {
      markdown += `### ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.action}\n\n`;
      markdown += `**Rationale:** ${rec.rationale}\n\n`;
      markdown += `**Implementation:** ${rec.implementation}\n\n`;
    });

    markdown += `## Next Steps\n\n`;
    report.nextSteps.forEach(step => {
      markdown += `${step}\n\n`;
    });

    return markdown;
  }
}

// Singleton instance
export const validationReportGenerator = new ValidationReportGenerator();

/**
 * Quick validation runner for console
 */
export async function runQuickValidation(): Promise<ValidationReport> {
  return await validationReportGenerator.generateQuickReport();
}

export async function runFullValidation(): Promise<ValidationReport> {
  return await validationReportGenerator.generateFullReport();
}

export async function runCountryValidation(countries: string[]): Promise<ValidationReport> {
  return await validationReportGenerator.generateCountryReport(countries);
}