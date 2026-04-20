/**
 * Phase 2 Addendum Report Generator
 * 
 * Generates professional PDF reports from Phase 2 Addendum diagnostics
 * Uses jsPDF with jspdf-autotable for structured tables
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Phase2AddendumReport,
  CoverageReport,
  BaselineDecomposition,
  MovementAttribution,
  CoverageRoutingDiagnostics,
  EmergentSpikeDiscovery,
  AnchorEventValidationAddendum,
  SpilloverContaminationAudit,
  CalibrationStressTest,
  FinalVerdictAddendum,
  CountryBaselineDetail,
  MissingCountryDetail,
  ValidatedSpike,
  TopFix
} from './GlobalAuditServicePhase2Addendum';
import { CSIRiskVectorNames } from './types/CSITypes';

export class Phase2AddendumReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private lineHeight: number = 7;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate complete PDF report
   */
  public generateReport(report: Phase2AddendumReport): Blob {
    this.addCoverPage(report);
    this.addExecutiveSummary(report);
    this.addStep1Coverage(report.step1_coverage);
    this.addStep2Baseline(report.step2_baseline);
    this.addStep3Movement(report.step3_movement);
    this.addStep4Routing(report.step4_routing);
    this.addStep5Spikes(report.step5_spikes);
    this.addStep6Anchors(report.step6_anchors);
    this.addStep7Spillover(report.step7_spillover);
    this.addStep8Calibration(report.step8_calibration);
    this.addStep9Verdict(report.step9_verdict);
    this.addAppendix(report);

    return this.doc.output('blob');
  }

  /**
   * Download report as PDF
   */
  public downloadReport(report: Phase2AddendumReport, filename: string = 'Phase2_Addendum_Report.pdf'): void {
    this.generateReport(report);
    this.doc.save(filename);
  }

  // ============================================================================
  // COVER PAGE
  // ============================================================================

  private addCoverPage(report: Phase2AddendumReport): void {
    // Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CSI v4.0', this.pageWidth / 2, 60, { align: 'center' });
    
    this.doc.setFontSize(24);
    this.doc.text('Phase 2 Addendum Report', this.pageWidth / 2, 75, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Global Backfill Diagnostics & Production Readiness', this.pageWidth / 2, 90, { align: 'center' });

    // Verdict badge
    const verdict = report.step9_verdict.verdict;
    const verdictColor = verdict === 'READY' ? [34, 197, 94] : 
                        verdict === 'REQUIRES_CALIBRATION' ? [234, 179, 8] : 
                        [239, 68, 68];
    
    this.doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2]);
    this.doc.roundedRect(this.pageWidth / 2 - 40, 105, 80, 15, 3, 3, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(verdict, this.pageWidth / 2, 115, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);

    // Metadata
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated: ${report.generation_timestamp.toLocaleString()}`, this.pageWidth / 2, 140, { align: 'center' });
    this.doc.text(`Countries Processed: ${report.step1_coverage.countries_processed}/195`, this.pageWidth / 2, 148, { align: 'center' });
    this.doc.text(`Total Country-Days: ${report.step1_coverage.total_country_days.toLocaleString()}`, this.pageWidth / 2, 156, { align: 'center' });

    // Footer
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text('CedarOwl Geopolitical Intelligence', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    this.doc.text('Confidential - Internal Use Only', this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });

    this.addNewPage();
  }

  // ============================================================================
  // EXECUTIVE SUMMARY
  // ============================================================================

  private addExecutiveSummary(report: Phase2AddendumReport): void {
    this.addSectionHeader('Executive Summary');

    // Overall status
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Overall Status:', this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const summaryText = this.doc.splitTextToSize(report.step9_verdict.summary, this.pageWidth - 2 * this.margin);
    this.doc.text(summaryText, this.margin, this.currentY);
    this.currentY += summaryText.length * this.lineHeight + 5;

    // Key metrics table
    this.addSubsectionHeader('Key Metrics');
    
    const metricsData = [
      ['Countries Processed', `${report.step1_coverage.countries_processed}/195`, report.step1_coverage.pass_gate ? '✓' : '✗'],
      ['Baseline Plausibility', report.step2_baseline.pass_gate ? 'Pass' : 'Fail', report.step2_baseline.pass_gate ? '✓' : '✗'],
      ['Movement Attribution', report.step3_movement.pass_gate ? 'Pass' : 'Fail', report.step3_movement.pass_gate ? '✓' : '✗'],
      ['Routing Diagnostics', report.step4_routing.pass_gate ? 'Pass' : 'Fail', report.step4_routing.pass_gate ? '✓' : '✗'],
      ['Spike Quality', report.step5_spikes.pass_gate ? 'Pass' : 'Fail', report.step5_spikes.pass_gate ? '✓' : '✗'],
      ['Anchor Validation', report.step6_anchors.pass_gate ? 'Pass' : 'Fail', report.step6_anchors.pass_gate ? '✓' : '✗'],
      ['Spillover Check', report.step7_spillover.pass_gate ? 'Pass' : 'Fail', report.step7_spillover.pass_gate ? '✓' : '✗'],
      ['Calibration Test', report.step8_calibration.pass_gate ? 'Pass' : 'Fail', report.step8_calibration.pass_gate ? '✓' : '✗']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Diagnostic Step', 'Status', 'Gate']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Top 5 Fixes
    this.checkPageBreak(60);
    this.addSubsectionHeader('Top 5 Priority Fixes');

    const fixesData = report.step9_verdict.top5_fixes.map(fix => [
      fix.rank.toString(),
      fix.issue,
      fix.owner,
      fix.priority.toUpperCase(),
      fix.description
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Issue', 'Owner', 'Priority', 'Description']],
      body: fixesData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 1: COVERAGE REPORT
  // ============================================================================

  private addStep1Coverage(coverage: CoverageReport): void {
    this.addSectionHeader('Step 1: Coverage Report');

    // Coverage status
    this.doc.setFontSize(11);
    this.doc.text(`Countries Processed: ${coverage.countries_processed}/${coverage.countries_required}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Total Country-Days: ${coverage.total_country_days.toLocaleString()}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Pass Gate: ${coverage.pass_gate ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Missing countries
    if (coverage.missing_countries.length > 0) {
      this.checkPageBreak(40);
      this.addSubsectionHeader(`Missing Countries (${coverage.missing_countries.length})`);

      const missingData = coverage.missing_countries.slice(0, 20).map(mc => [
        mc.iso3,
        mc.country_name,
        mc.error_reason.replace(/_/g, ' '),
        mc.proposed_fix
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['ISO3', 'Country', 'Error Reason', 'Proposed Fix']],
        body: missingData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 'auto' }
        },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor!.y + 10;
        }
      });

      if (coverage.missing_countries.length > 20) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(`... and ${coverage.missing_countries.length - 20} more countries`, this.margin, this.currentY);
        this.doc.setTextColor(0, 0, 0);
        this.currentY += this.lineHeight + 5;
      }
    }

    // Data freshness
    this.checkPageBreak(50);
    this.addSubsectionHeader('Data Freshness');

    const freshnessData = [
      ...coverage.data_freshness.baseline_sources.map(s => ['Baseline', s.source_name, s.days_stale.toString(), s.is_stale ? 'Stale' : 'Fresh']),
      ...coverage.data_freshness.detection_sources.map(s => ['Detection', s.source_name, s.days_stale.toString(), s.is_stale ? 'Stale' : 'Fresh']),
      ...coverage.data_freshness.confirmation_sources.map(s => ['Confirmation', s.source_name, s.days_stale.toString(), s.is_stale ? 'Stale' : 'Fresh'])
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Source Type', 'Source Name', 'Days Stale', 'Status']],
      body: freshnessData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 2: BASELINE DECOMPOSITION
  // ============================================================================

  private addStep2Baseline(baseline: BaselineDecomposition): void {
    this.addSectionHeader('Step 2: Baseline Factor Decomposition');

    // Global stats
    this.doc.setFontSize(11);
    this.doc.text(`Global Mean Baseline: ${baseline.global_stats.mean_baseline_total.toFixed(2)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Pass Gate: ${baseline.pass_gate ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Top 20 countries by baseline
    this.checkPageBreak(60);
    this.addSubsectionHeader('Top 20 Countries by Baseline');

    const top20Data = baseline.top20_by_baseline.slice(0, 10).map(c => [
      c.country_name,
      c.classification.replace(/_/g, ' '),
      c.baseline_total.toFixed(2),
      (c.vector_breakdown[Object.keys(c.vector_breakdown)[0] as any].share_of_baseline * 100).toFixed(1) + '%'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Country', 'Classification', 'Baseline Total', 'Top Vector Share']],
      body: top20Data,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Plausibility verification
    this.checkPageBreak(40);
    this.addSubsectionHeader('Baseline Plausibility Verification');

    const plausibilityData = [
      ['Fragile/Conflict vs OECD Elevated', baseline.plausibility_verification.fragile_vs_oecd_elevated ? 'YES ✓' : 'NO ✗'],
      ['Sanctioned Show Sanctions Baseline', baseline.plausibility_verification.sanctioned_show_sanctions_baseline ? 'YES ✓' : 'NO ✗'],
      ['Capital Controls Show Currency Baseline', baseline.plausibility_verification.capital_controls_show_currency_baseline ? 'YES ✓' : 'NO ✗'],
      ['Misranking Examples Found', baseline.plausibility_verification.misranking_examples.length.toString()]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Check', 'Result']],
      body: plausibilityData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 3: MOVEMENT ATTRIBUTION
  // ============================================================================

  private addStep3Movement(movement: MovementAttribution): void {
    this.addSectionHeader('Step 3: Movement Attribution Audit');

    // Global composition
    this.addSubsectionHeader('Global Composition');

    const compositionData = [
      ['Baseline Ratio', (movement.global_composition.baseline_ratio * 100).toFixed(1) + '%'],
      ['Drift Ratio', (movement.global_composition.drift_ratio * 100).toFixed(1) + '%'],
      ['Event Ratio', (movement.global_composition.event_ratio * 100).toFixed(1) + '%']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Component', 'Global Average']],
      body: compositionData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Activity diagnostics
    this.checkPageBreak(40);
    this.addSubsectionHeader('Activity Diagnostics');

    this.doc.setFontSize(11);
    this.doc.text(`Diagnosis: ${movement.activity_diagnostics.diagnosis.toUpperCase()}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Days with Negligible Movement: ${movement.activity_diagnostics.pct_days_movement_negligible.toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Days with Drift Dominant: ${movement.activity_diagnostics.pct_days_drift_dominant.toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Days with Event Dominant: ${movement.activity_diagnostics.pct_days_event_dominant.toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Drift share by vector
    this.checkPageBreak(60);
    this.addSubsectionHeader('Drift Share by Vector');

    const driftData = Object.values(movement.drift_share_by_vector).map(v => [
      v.vector_name,
      (v.global_share * 100).toFixed(1) + '%',
      (v.median * 100).toFixed(1) + '%'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Vector', 'Global Share', 'Median']],
      body: driftData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 4: ROUTING DIAGNOSTICS
  // ============================================================================

  private addStep4Routing(routing: CoverageRoutingDiagnostics): void {
    this.addSectionHeader('Step 4: Coverage vs Routing Diagnostics');

    // Conclusion
    this.addSubsectionHeader('Diagnostic Conclusion');

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Primary Cause: ${routing.conclusion.primary_cause.toUpperCase()}`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight + 3;

    const evidenceText = this.doc.splitTextToSize(
      'Evidence: ' + routing.conclusion.evidence.join('; '),
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(evidenceText, this.margin, this.currentY);
    this.currentY += evidenceText.length * this.lineHeight + 5;

    // Pre-routing inventory
    this.checkPageBreak(60);
    this.addSubsectionHeader('Pre-Routing Inventory');

    this.doc.setFontSize(11);
    this.doc.text(`Total Raw Detections: ${routing.pre_routing_inventory.total_raw_detections}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Total Raw Confirmations: ${routing.pre_routing_inventory.total_raw_confirmations}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Coverage Gaps: ${routing.pre_routing_inventory.coverage_gaps.length} vectors`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Synthetic injection results
    this.checkPageBreak(40);
    this.addSubsectionHeader('Synthetic Injection Test');

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Overall Accuracy: ${(routing.synthetic_injection.overall_accuracy * 100).toFixed(1)}%`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight;
    this.doc.text(`Pass Threshold (95%): ${routing.synthetic_injection.pass ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    const injectionData = Object.entries(routing.synthetic_injection.per_vector_results).map(([vector, result]: [any, any]) => [
      CSIRiskVectorNames[vector as any],
      result.injected.toString(),
      result.correctly_routed.toString(),
      (result.routing_accuracy * 100).toFixed(1) + '%'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Vector', 'Injected', 'Correct', 'Accuracy']],
      body: injectionData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 5: SPIKE DISCOVERY
  // ============================================================================

  private addStep5Spikes(spikes: EmergentSpikeDiscovery): void {
    this.addSectionHeader('Step 5: Emergent Spike Discovery');

    // Quality assessment
    this.addSubsectionHeader('Spike Quality Assessment');

    const qualityData = [
      ['Total Spikes Analyzed', spikes.spike_quality_assessment.total_spikes.toString()],
      ['Valid Spikes', spikes.spike_quality_assessment.valid_count.toString()],
      ['Spurious Spikes', spikes.spike_quality_assessment.spurious_count.toString()],
      ['Uncertain Spikes', spikes.spike_quality_assessment.uncertain_count.toString()],
      ['With Documentary Support', spikes.spike_quality_assessment.pct_with_documentary_support.toFixed(1) + '%'],
      ['Geopolitically Plausible', spikes.spike_quality_assessment.geopolitically_plausible ? 'YES ✓' : 'NO ✗']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: qualityData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Top 10 validated spikes
    this.checkPageBreak(80);
    this.addSubsectionHeader('Top 10 Validated Spikes');

    const spikeData = spikes.top100_spikes.slice(0, 10).map(spike => [
      spike.country_name,
      spike.date.toLocaleDateString(),
      spike.magnitude.toFixed(2),
      CSIRiskVectorNames[spike.dominant_vector],
      spike.validation_status.toUpperCase()
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Country', 'Date', 'Magnitude', 'Dominant Vector', 'Status']],
      body: spikeData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 45 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Missed crises
    if (spikes.missed_crises.length > 0) {
      this.checkPageBreak(60);
      this.addSubsectionHeader('Missed Crises');

      const missedData = spikes.missed_crises.map(crisis => [
        crisis.description,
        crisis.date.toLocaleDateString(),
        crisis.root_cause.replace(/_/g, ' '),
        crisis.affected_countries.join(', ')
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Description', 'Date', 'Root Cause', 'Countries']],
        body: missedData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor!.y + 10;
        }
      });
    }

    this.addNewPage();
  }

  // ============================================================================
  // STEP 6: ANCHOR VALIDATION
  // ============================================================================

  private addStep6Anchors(anchors: AnchorEventValidationAddendum): void {
    this.addSectionHeader('Step 6: Anchor Event Validation');

    this.doc.setFontSize(11);
    this.doc.text(`Overall Pass Rate: ${(anchors.overall_pass_rate * 100).toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Failures Explained: ${anchors.failures_explained ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Pass Gate: ${anchors.pass_gate ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Anchor event results
    this.checkPageBreak(80);
    this.addSubsectionHeader('Anchor Event Results');

    const anchorData = anchors.anchor_events.map(result => [
      result.event.name,
      result.event.effective_date.toLocaleDateString(),
      result.pass ? 'PASS ✓' : 'FAIL ✗',
      result.correct_vector_routing ? '✓' : '✗',
      result.drift_before_confirmation ? '✓' : '✗'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Event', 'Date', 'Overall', 'Routing', 'Drift']],
      body: anchorData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    this.addNewPage();
  }

  // ============================================================================
  // STEP 7: SPILLOVER
  // ============================================================================

  private addStep7Spillover(spillover: SpilloverContaminationAudit): void {
    this.addSectionHeader('Step 7: Spillover & Vector Contamination');

    this.doc.setFontSize(11);
    this.doc.text(`Cross-Country Spillover Incidents: ${spillover.cross_country_spillover.length}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Vector Contamination Incidents: ${spillover.vector_contamination.length}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Macro Contamination Incidents: ${spillover.macro_contamination.length}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Pass Gate: ${spillover.pass_gate ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 10;

    if (spillover.cross_country_spillover.length === 0 && 
        spillover.vector_contamination.length === 0 && 
        spillover.macro_contamination.length === 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(34, 197, 94);
      this.doc.text('✓ No spillover or contamination incidents detected', this.margin, this.currentY);
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
      this.currentY += this.lineHeight + 5;
    }

    this.addNewPage();
  }

  // ============================================================================
  // STEP 8: CALIBRATION
  // ============================================================================

  private addStep8Calibration(calibration: CalibrationStressTest): void {
    this.addSectionHeader('Step 8: Calibration Stress Test');

    // Vector dominance
    this.addSubsectionHeader('Vector Dominance Analysis');

    const dominanceData = calibration.vector_dominance_analysis.map(v => [
      v.vector_name,
      (v.global_movement_share * 100).toFixed(1) + '%',
      v.is_dominating ? 'YES' : 'NO',
      v.dominance_type || '-'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Vector', 'Movement Share', 'Dominating', 'Type']],
      body: dominanceData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Structural weight verification
    this.checkPageBreak(40);
    this.addSubsectionHeader('Structural Weight Verification');

    this.doc.setFontSize(11);
    this.doc.text(`Weights Applied Correctly: ${calibration.structural_weight_verification.pass ? 'YES ✓' : 'NO ✗'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`Deviations Found: ${calibration.structural_weight_verification.deviations.length}`, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;

    // Parameter imbalances
    if (calibration.parameter_imbalances.length > 0) {
      this.checkPageBreak(60);
      this.addSubsectionHeader('Parameter Imbalances');

      const imbalanceData = calibration.parameter_imbalances.map(imb => [
        imb.parameter,
        imb.issue,
        imb.severity.toUpperCase()
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Parameter', 'Issue', 'Severity']],
        body: imbalanceData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor!.y + 10;
        }
      });
    }

    // Recommended adjustments
    if (calibration.recommended_adjustments.length > 0) {
      this.checkPageBreak(60);
      this.addSubsectionHeader('Recommended Parameter Adjustments');

      const adjustmentData = calibration.recommended_adjustments.map(adj => [
        adj.parameter,
        String(adj.current_value),
        String(adj.recommended_value),
        adj.priority.toUpperCase()
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Parameter', 'Current', 'Recommended', 'Priority']],
        body: adjustmentData,
        theme: 'striped',
        headStyles: { fillColor: [13, 95, 95], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor!.y + 10;
        }
      });
    }

    this.addNewPage();
  }

  // ============================================================================
  // STEP 9: FINAL VERDICT
  // ============================================================================

  private addStep9Verdict(verdict: FinalVerdictAddendum): void {
    this.addSectionHeader('Step 9: Final Production Readiness Verdict');

    // Verdict badge
    const verdictColor = verdict.verdict === 'READY' ? [34, 197, 94] : 
                        verdict.verdict === 'REQUIRES_CALIBRATION' ? [234, 179, 8] : 
                        [239, 68, 68];
    
    this.doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2]);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 3, 3, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(verdict.verdict_label, this.pageWidth / 2, this.currentY + 13, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += 30;

    // Summary
    this.doc.setFontSize(11);
    const summaryText = this.doc.splitTextToSize(verdict.summary, this.pageWidth - 2 * this.margin);
    this.doc.text(summaryText, this.margin, this.currentY);
    this.currentY += summaryText.length * this.lineHeight + 10;

    // Plausibility answers
    this.checkPageBreak(80);
    this.addSubsectionHeader('Plausibility Questions');

    const plausibilityData = [
      ['Structural Ranking Plausible?', verdict.plausibility_answers.structural_ranking_plausible ? 'YES ✓' : 'NO ✗'],
      ['Responds Proportionally?', verdict.plausibility_answers.responds_proportionally ? 'YES ✓' : 'NO ✗'],
      ['Distinguishes Noise?', verdict.plausibility_answers.distinguishes_noise ? 'YES ✓' : 'NO ✗'],
      ['Behaves Coherently?', verdict.plausibility_answers.behaves_coherently ? 'YES ✓' : 'NO ✗'],
      ['Vectors Calibrated?', verdict.plausibility_answers.vectors_calibrated ? 'YES ✓' : 'NO ✗'],
      ['Tuning Required?', verdict.plausibility_answers.tuning_required ? 'YES' : 'NO']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Question', 'Answer']],
      body: plausibilityData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });

    // Top 5 fixes
    this.checkPageBreak(80);
    this.addSubsectionHeader('Top 5 Priority Fixes');

    const fixesData = verdict.top5_fixes.map(fix => [
      fix.rank.toString(),
      fix.issue,
      fix.owner,
      fix.priority.toUpperCase(),
      fix.expected_impact
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Issue', 'Owner', 'Priority', 'Expected Impact']],
      body: fixesData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor!.y + 10;
      }
    });
  }

  // ============================================================================
  // APPENDIX
  // ============================================================================

  private addAppendix(report: Phase2AddendumReport): void {
    this.addNewPage();
    this.addSectionHeader('Appendix: Methodology & Definitions');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const appendixSections = [
      {
        title: 'Coverage Requirement',
        text: 'All 195 UN-recognized countries must be processed. Missing countries indicate data pipeline failures that must be resolved before production deployment.'
      },
      {
        title: 'Baseline vs Movement',
        text: 'Baseline represents structural geopolitical risk factors. Movement (drift + events) represents dynamic changes. Healthy balance: 60-80% baseline, 10-25% drift, 5-20% events.'
      },
      {
        title: 'Routing Diagnostics',
        text: 'Separates coverage issues (missing data feeds) from routing issues (misclassification) from scoring issues (caps/decay). Synthetic injection test requires ≥95% accuracy.'
      },
      {
        title: 'Spillover & Contamination',
        text: 'Cross-country spillover: inappropriate propagation between unrelated countries. Vector contamination: signals leaking into wrong vectors. Both indicate pipeline bugs.'
      },
      {
        title: 'Calibration Stress Test',
        text: 'Verifies structural weights (20/18/15/17/10/12/8) are applied correctly and no single vector dominates (>40% movement share).'
      }
    ];

    for (const section of appendixSections) {
      this.checkPageBreak(30);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(section.title, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      const text = this.doc.splitTextToSize(section.text, this.pageWidth - 2 * this.margin);
      this.doc.text(text, this.margin, this.currentY);
      this.currentY += text.length * this.lineHeight + 5;
    }

    // Footer
    this.doc.setFontSize(8);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text('End of Report', this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });
    this.doc.text(`Generated: ${report.generation_timestamp.toLocaleString()}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = 20;
    this.addPageNumber();
  }

  private addPageNumber(): void {
    const pageCount = this.doc.getNumberOfPages();
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(
      `Page ${pageCount}`,
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: 'right' }
    );
    this.doc.setTextColor(0, 0, 0);
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(20);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(13, 95, 95);
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight + 5;
  }

  private addSubsectionHeader(title: string): void {
    this.checkPageBreak(15);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += this.lineHeight + 3;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.addNewPage();
    }
  }
}

// Export singleton instance
export const phase2AddendumReportGenerator = new Phase2AddendumReportGenerator();