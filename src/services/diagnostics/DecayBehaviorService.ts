/**
 * Decay Behavior Diagnostic Service - Phase 3
 * Handles near-term horizon and decay behavior validation
 */

export interface DecayBehaviorEvent {
  event_id: string;
  ISO3: string;
  vector: string;
  initial_delta: number;
  decay_rate: number;
  half_life_days: number;
  current_delta: number;
  days_elapsed: number;
  expected_decay: number;
  actual_decay: number;
  decay_error: number;
}

export interface PerVectorDecayMetrics {
  vector: string;
  mean_decay_rate: number;
  median_half_life: number;
  decay_consistency: number;
  events_analyzed: number;
}

export class DecayBehaviorService {
  /**
   * Fetch CSV file from public directory
   */
  private static async fetchCSVFile(filename: string): Promise<string> {
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
      }
      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Generate decay behavior verification CSV
   */
  static async generateDecayBehavior(): Promise<string> {
    return await this.fetchCSVFile('decay_behavior_verification.csv');
  }

  /**
   * Generate per-vector decay metrics CSV
   */
  static async generatePerVectorMetrics(): Promise<string> {
    return await this.fetchCSVFile('per_vector_decay_metrics.csv');
  }

  /**
   * Generate flagged decay events CSV
   */
  static async generateFlaggedDecayEvents(): Promise<string> {
    return await this.fetchCSVFile('flagged_decay_events.csv');
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
   * Generate and download all Phase 3 diagnostic files
   */
  static async downloadAllPhase3Files(): Promise<void> {
    try {
      const [decay, metrics, flagged] = await Promise.all([
        this.generateDecayBehavior(),
        this.generatePerVectorMetrics(),
        this.generateFlaggedDecayEvents()
      ]);

      // Verify content is not empty
      if (!decay || decay.trim().length === 0) {
        throw new Error('decay_behavior_verification.csv is empty');
      }
      if (!metrics || metrics.trim().length === 0) {
        throw new Error('per_vector_decay_metrics.csv is empty');
      }
      if (!flagged || flagged.trim().length === 0) {
        throw new Error('flagged_decay_events.csv is empty');
      }

      // Download files with slight delays to avoid browser blocking
      this.downloadCSV(decay, 'decay_behavior_verification.csv');
      
      setTimeout(() => {
        this.downloadCSV(metrics, 'per_vector_decay_metrics.csv');
      }, 300);
      
      setTimeout(() => {
        this.downloadCSV(flagged, 'flagged_decay_events.csv');
      }, 600);
    } catch (error) {
      console.error('Error downloading Phase 3 files:', error);
      throw error;
    }
  }
}