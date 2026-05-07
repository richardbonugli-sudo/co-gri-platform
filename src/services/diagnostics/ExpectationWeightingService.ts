/**
 * Expectation Weighting Diagnostic Service - Phase 2
 * Handles expectation weighting verification and validation
 */

export interface ExpectationWeightingEvent {
  event_id: string;
  ISO3: string;
  vector: string;
  raw_delta: number;
  probability_assigned: number;
  severity_score: number;
  relevance_weight: number;
  expected_delta: number;
  applied_delta: number;
  residual_error: number;
}

export interface AggregateMetrics {
  Mean_residual_error: number;
  Max_residual_error: number;
  Correlation_expected_vs_applied: number;
}

export class ExpectationWeightingService {
  /**
   * Generate expectation weighting verification CSV
   */
  static async generateExpectationWeighting(): Promise<string> {
    const response = await fetch('/expectation_weighting_verification.csv');
    if (!response.ok) {
      throw new Error('Failed to load expectation weighting verification data');
    }
    return await response.text();
  }

  /**
   * Generate aggregate metrics CSV
   */
  static async generateAggregateMetrics(): Promise<string> {
    const response = await fetch('/aggregate_metrics.csv');
    if (!response.ok) {
      throw new Error('Failed to load aggregate metrics data');
    }
    return await response.text();
  }

  /**
   * Generate flagged events CSV
   */
  static async generateFlaggedEvents(): Promise<string> {
    const response = await fetch('/flagged_events.csv');
    if (!response.ok) {
      throw new Error('Failed to load flagged events data');
    }
    const content = await response.text();
    if (!content || content.trim().length === 0) {
      throw new Error('flagged_events.csv is empty');
    }
    return content;
  }

  /**
   * Download CSV file
   */
  static downloadCSV(content: string, filename: string): void {
    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download all Phase 2 diagnostic files
   */
  static async downloadAllPhase2Files(): Promise<void> {
    try {
      const [weighting, metrics, flagged] = await Promise.all([
        this.generateExpectationWeighting(),
        this.generateAggregateMetrics(),
        this.generateFlaggedEvents()
      ]);

      // Verify content is not empty
      if (!weighting || weighting.trim().length === 0) {
        throw new Error('expectation_weighting_verification.csv is empty');
      }
      if (!metrics || metrics.trim().length === 0) {
        throw new Error('aggregate_metrics.csv is empty');
      }
      if (!flagged || flagged.trim().length === 0) {
        throw new Error('flagged_events.csv is empty');
      }

      // Download files with slight delays to avoid browser blocking
      this.downloadCSV(weighting, 'expectation_weighting_verification.csv');
      
      setTimeout(() => {
        this.downloadCSV(metrics, 'aggregate_metrics.csv');
      }, 300);
      
      setTimeout(() => {
        this.downloadCSV(flagged, 'flagged_events.csv');
      }, 600);
    } catch (error) {
      console.error('Error downloading Phase 2 files:', error);
      throw error;
    }
  }
}