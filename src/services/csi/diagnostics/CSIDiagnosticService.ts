/**
 * CSI Diagnostic Service
 * Comprehensive diagnostic tool for investigating CSI responsiveness issues
 * 
 * This service identifies the disconnect between events and CSI display values
 */

import { csiEngineOrchestrator } from '../engine/CSIEngineOrchestrator';
import { getDetectionMetrics } from '../detection/detectionMonitor';
import { compositeCalculator } from '../compositeCalculator';
import { GLOBAL_COUNTRIES, getCountryShockIndex, getCountryCSIDetails } from '@/data/globalCountries';

export interface CSIDiagnosticReport {
  timestamp: string;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    affectedCountries: string[];
    systemHealth: 'healthy' | 'degraded' | 'critical';
  };
  systemHealth: {
    engineInitialized: boolean;
    totalSignals: number;
    activeCandidates: number;
    validatedEvents: number;
    activeCountries: number;
    avgDataQuality: number;
  };
  detectionPipeline: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalArticlesProcessed: number;
    totalCandidatesDetected: number;
    totalEventsCreated: number;
    detectionRate: number;
    confirmationRate: number;
    lastRunTime: string | null;
  };
  dataFlowAnalysis: {
    issue: string;
    rootCause: string;
    affectedComponents: string[];
    impact: string;
  };
  countryAnalysis: Array<{
    country: string;
    displayedCSI: number;
    baselineCSI: number;
    eventCSI: number;
    compositeCSI: number;
    activeEvents: number;
    discrepancy: number;
    status: 'correct' | 'incorrect' | 'missing_events';
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    implementation: string;
  }>;
}

export class CSIDiagnosticService {
  /**
   * Run comprehensive diagnostic
   */
  async runDiagnostic(testCountries?: string[]): Promise<CSIDiagnosticReport> {
    console.log('🔍 Starting CSI Diagnostic...');
    
    const timestamp = new Date().toISOString();
    
    // 1. Check system health
    const systemHealth = csiEngineOrchestrator.getSystemHealth();
    console.log('✅ System health checked');
    
    // 2. Check detection pipeline
    const detectionMetrics = getDetectionMetrics();
    console.log('✅ Detection pipeline checked');
    
    // 3. Analyze data flow
    const dataFlowAnalysis = this.analyzeDataFlow();
    console.log('✅ Data flow analyzed');
    
    // 4. Analyze country CSI values
    const countriesToTest = testCountries || [
      'United States', 'Iran', 'Iraq', 'Israel', 'Russia', 'China', 
      'Ukraine', 'Taiwan', 'Syria', 'Yemen'
    ];
    const countryAnalysis = this.analyzeCountryCSI(countriesToTest);
    console.log('✅ Country analysis complete');
    
    // 5. Generate recommendations
    const recommendations = this.generateRecommendations(
      systemHealth,
      detectionMetrics,
      dataFlowAnalysis,
      countryAnalysis
    );
    console.log('✅ Recommendations generated');
    
    // Calculate summary
    const criticalIssues = recommendations.filter(r => r.priority === 'critical').length;
    const totalIssues = recommendations.length;
    const affectedCountries = countryAnalysis
      .filter(c => c.status !== 'correct')
      .map(c => c.country);
    
    let systemHealthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalIssues > 0 || affectedCountries.length > 5) {
      systemHealthStatus = 'critical';
    } else if (totalIssues > 3 || affectedCountries.length > 0) {
      systemHealthStatus = 'degraded';
    }
    
    const report: CSIDiagnosticReport = {
      timestamp,
      summary: {
        totalIssues,
        criticalIssues,
        affectedCountries,
        systemHealth: systemHealthStatus
      },
      systemHealth,
      detectionPipeline: {
        totalRuns: detectionMetrics.total_runs,
        successfulRuns: detectionMetrics.successful_runs,
        failedRuns: detectionMetrics.failed_runs,
        totalArticlesProcessed: detectionMetrics.total_articles_processed,
        totalCandidatesDetected: detectionMetrics.total_candidates_detected,
        totalEventsCreated: detectionMetrics.total_events_created,
        detectionRate: detectionMetrics.detection_rate,
        confirmationRate: detectionMetrics.confirmation_rate,
        lastRunTime: detectionMetrics.last_run?.start_time || null
      },
      dataFlowAnalysis,
      countryAnalysis,
      recommendations
    };
    
    console.log('✅ Diagnostic complete');
    return report;
  }
  
  /**
   * Analyze data flow to identify disconnection points
   */
  private analyzeDataFlow(): CSIDiagnosticReport['dataFlowAnalysis'] {
    return {
      issue: 'Dashboard displays static baseline CSI values instead of event-driven composite CSI',
      rootCause: 'GlobalRiskIndex and other dashboard components read CSI directly from GLOBAL_COUNTRIES array (static baseline values) instead of calling compositeCalculator.calculateCompositeCSI() which combines baseline + active events',
      affectedComponents: [
        'GlobalRiskIndex.tsx - Uses GLOBAL_COUNTRIES.csi directly',
        'GlobalRiskHeatmap.tsx - Uses GLOBAL_COUNTRIES.csi directly',
        'CountrySummaryPanel.tsx - Uses GLOBAL_COUNTRIES.csi directly',
        'TopRiskMovers.tsx - Uses GLOBAL_COUNTRIES.csi directly',
        'globalCountries.ts - Provides getCountryShockIndex() but dashboard components bypass it'
      ],
      impact: 'Events are being detected, stored, and calculated correctly, but the dashboard never queries the composite CSI values. Users see outdated baseline values that do not reflect recent geopolitical events.'
    };
  }
  
  /**
   * Analyze CSI values for specific countries
   */
  private analyzeCountryCSI(countries: string[]): CSIDiagnosticReport['countryAnalysis'] {
    const analysis: CSIDiagnosticReport['countryAnalysis'] = [];
    
    for (const country of countries) {
      try {
        // Get displayed CSI (what dashboard shows)
        const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
        const displayedCSI = countryData?.csi || 0;
        
        // Get composite CSI (what should be shown)
        const composite = compositeCalculator.calculateCompositeCSI(country);
        const baselineCSI = composite.baseline_csi;
        const eventCSI = composite.event_csi;
        const compositeCSI = composite.composite_csi;
        const activeEvents = composite.active_events.length;
        
        // Calculate discrepancy
        const discrepancy = Math.abs(displayedCSI - compositeCSI);
        
        // Determine status
        let status: 'correct' | 'incorrect' | 'missing_events' = 'correct';
        if (discrepancy > 5) {
          status = 'incorrect';
        } else if (activeEvents > 0 && discrepancy > 1) {
          status = 'missing_events';
        }
        
        analysis.push({
          country,
          displayedCSI,
          baselineCSI,
          eventCSI,
          compositeCSI,
          activeEvents,
          discrepancy,
          status
        });
      } catch (error) {
        console.error(`Error analyzing ${country}:`, error);
      }
    }
    
    return analysis;
  }
  
  /**
   * Generate recommendations based on diagnostic results
   */
  private generateRecommendations(
    systemHealth: any,
    detectionMetrics: any,
    dataFlow: any,
    countryAnalysis: any[]
  ): CSIDiagnosticReport['recommendations'] {
    const recommendations: CSIDiagnosticReport['recommendations'] = [];
    
    // Critical: Dashboard not using composite CSI
    const affectedCountries = countryAnalysis.filter(c => c.status !== 'correct');
    if (affectedCountries.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Data Integration',
        issue: `Dashboard displays static baseline CSI for ${affectedCountries.length} countries instead of event-driven composite CSI`,
        recommendation: 'Update all dashboard components to use compositeCalculator.calculateCompositeCSI() instead of reading GLOBAL_COUNTRIES.csi directly',
        implementation: 'Modify GlobalRiskIndex.tsx, GlobalRiskHeatmap.tsx, CountrySummaryPanel.tsx, TopRiskMovers.tsx to call getCountryShockIndex() or getCountryCSIDetails() from globalCountries.ts'
      });
    }
    
    // High: Event detection not running
    if (detectionMetrics.total_runs === 0) {
      recommendations.push({
        priority: 'high',
        category: 'Event Detection',
        issue: 'Event detection pipeline has never run',
        recommendation: 'Initialize and start the event detection scheduler',
        implementation: 'Call detectionScheduler.start() on application initialization'
      });
    }
    
    // High: CSI Engine not initialized
    if (!systemHealth.initialized) {
      recommendations.push({
        priority: 'high',
        category: 'System Initialization',
        issue: 'CSI Engine not initialized',
        recommendation: 'Initialize CSI Engine with country list',
        implementation: 'Call csiEngineOrchestrator.initialize(countries) on application startup'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Print diagnostic report to console
   */
  printReport(report: CSIDiagnosticReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('CSI DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`System Health: ${report.summary.systemHealth.toUpperCase()}`);
    console.log(`Total Issues: ${report.summary.totalIssues} (${report.summary.criticalIssues} critical)`);
    console.log(`Affected Countries: ${report.summary.affectedCountries.length}`);
    
    console.log('\n' + '-'.repeat(80));
    console.log('COUNTRY ANALYSIS');
    console.log('-'.repeat(80));
    console.log('Country'.padEnd(25) + 'Displayed'.padEnd(12) + 'Composite'.padEnd(12) + 'Events'.padEnd(10) + 'Status');
    console.log('-'.repeat(80));
    report.countryAnalysis.forEach(c => {
      const statusIcon = c.status === 'correct' ? '✅' : c.status === 'missing_events' ? '⚠️' : '❌';
      console.log(
        c.country.padEnd(25) +
        c.displayedCSI.toFixed(1).padEnd(12) +
        c.compositeCSI.toFixed(1).padEnd(12) +
        c.activeEvents.toString().padEnd(10) +
        `${statusIcon} ${c.status}`
      );
    });
    
    console.log('\n' + '='.repeat(80));
  }
  
  /**
   * Export report as JSON
   */
  exportReport(report: CSIDiagnosticReport): string {
    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const csiDiagnosticService = new CSIDiagnosticService();
