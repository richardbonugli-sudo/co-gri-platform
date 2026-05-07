/**
 * Audit Report Generator
 * 
 * Generates audit reports in various formats (JSON, CSV, PDF)
 */

import { VectorMovementAuditResult, GroundTruthRecallAuditResult } from '../../types/audit.types';

export class AuditReportGenerator {
  /**
   * Generate JSON report
   */
  generateJSON(results: VectorMovementAuditResult | GroundTruthRecallAuditResult): string {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate CSV report
   */
  generateCSV(results: VectorMovementAuditResult | GroundTruthRecallAuditResult): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Audit Report');
    lines.push(`Generated: ${results.generated_at}`);
    lines.push(`Audit ID: ${results.audit_id}`);
    lines.push('');

    // Summary
    lines.push('Summary');
    lines.push(`Overall Assessment,${results.summary.overall_assessment}`);
    lines.push(`Sections Meeting Criteria,${results.summary.sections_meeting_criteria}/${results.summary.total_sections}`);
    lines.push('');

    // Key Findings
    lines.push('Key Findings');
    results.summary.key_findings.forEach(finding => {
      lines.push(finding);
    });
    lines.push('');

    // Recommendations
    lines.push('Recommendations');
    lines.push('Priority,Category,Description');
    results.recommendations.forEach(rec => {
      lines.push(`${rec.priority},${rec.category},"${rec.description}"`);
    });

    return lines.join('\n');
  }

  /**
   * Generate PDF report (placeholder - would use jsPDF in real implementation)
   */
  generatePDF(results: VectorMovementAuditResult | GroundTruthRecallAuditResult): Blob {
    // In a real implementation, this would use jsPDF to create a formatted PDF
    // For now, return a text blob
    const content = this.generateCSV(results);
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Download file
   */
  downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}