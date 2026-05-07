/**
 * CSI Storage
 * Database operations for enhanced CSI scores
 */

import type { EnhancedCSI, CSICalculationLog, SignalContribution, CSIComparison } from '@/types/csi-enhancement/drift';
import { Pool } from 'pg';

export class CSIStorage {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Save enhanced CSI scores
   */
  async saveEnhancedCSI(scores: EnhancedCSI[]): Promise<void> {
    const query = `
      INSERT INTO enhanced_csi (
        id, country, vector, legacy_csi, baseline_drift, enhanced_csi,
        signal_count, top_signals, explanation, calculated_at, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (country, vector, calculated_at) DO UPDATE SET
        legacy_csi = EXCLUDED.legacy_csi,
        baseline_drift = EXCLUDED.baseline_drift,
        enhanced_csi = EXCLUDED.enhanced_csi,
        signal_count = EXCLUDED.signal_count,
        top_signals = EXCLUDED.top_signals,
        explanation = EXCLUDED.explanation,
        valid_until = EXCLUDED.valid_until
    `;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const score of scores) {
        await client.query(query, [
          score.id,
          score.country,
          score.vector,
          score.legacyCSI,
          score.baselineDrift,
          score.enhancedCSI,
          score.signalCount,
          score.topSignals,
          score.explanation,
          score.calculatedAt,
          score.validUntil
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save signal contributions
   */
  async saveSignalContributions(
    enhancedCSIId: string,
    contributions: SignalContribution[]
  ): Promise<void> {
    const query = `
      INSERT INTO signal_contributions (
        enhanced_csi_id, signal_id, impact_score, decay_factor, contribution
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (enhanced_csi_id, signal_id) DO UPDATE SET
        impact_score = EXCLUDED.impact_score,
        decay_factor = EXCLUDED.decay_factor,
        contribution = EXCLUDED.contribution
    `;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const contrib of contributions) {
        await client.query(query, [
          enhancedCSIId,
          contrib.signalId,
          contrib.impactScore,
          contrib.decayFactor,
          contrib.contribution
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get enhanced CSI by country
   */
  async getEnhancedCSIByCountry(country: string): Promise<EnhancedCSI[]> {
    const query = `
      SELECT * FROM latest_enhanced_csi
      WHERE country = $1
      ORDER BY vector
    `;

    const result = await this.pool.query(query, [country]);
    return result.rows.map(row => this.rowToEnhancedCSI(row));
  }

  /**
   * Get enhanced CSI by vector
   */
  async getEnhancedCSIByVector(vector: string): Promise<EnhancedCSI[]> {
    const query = `
      SELECT * FROM latest_enhanced_csi
      WHERE vector = $1
      ORDER BY country
    `;

    const result = await this.pool.query(query, [vector]);
    return result.rows.map(row => this.rowToEnhancedCSI(row));
  }

  /**
   * Get CSI comparison
   */
  async getCSIComparison(): Promise<CSIComparison[]> {
    const query = `
      SELECT * FROM csi_comparison
      ORDER BY ABS(baseline_drift) DESC
      LIMIT 50
    `;

    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      country: row.country,
      vector: row.vector,
      legacyCSI: parseFloat(row.legacy_csi),
      enhancedCSI: parseFloat(row.enhanced_csi),
      baselineDrift: parseFloat(row.baseline_drift),
      difference: parseFloat(row.difference),
      divergenceLevel: row.divergence_level,
      calculatedAt: new Date(row.calculated_at)
    }));
  }

  /**
   * Start calculation log
   */
  async startCalculationLog(log: Partial<CSICalculationLog>): Promise<void> {
    const query = `
      INSERT INTO csi_calculation_log (
        calculation_run_id, status, started_at
      ) VALUES ($1, $2, $3)
    `;

    await this.pool.query(query, [
      log.calculationRunId,
      log.status,
      log.startedAt
    ]);
  }

  /**
   * Complete calculation log
   */
  async completeCalculationLog(
    calculationRunId: string,
    updates: Partial<CSICalculationLog>
  ): Promise<void> {
    const query = `
      UPDATE csi_calculation_log
      SET
        countries_processed = $2,
        vectors_processed = $3,
        total_calculations = $4,
        avg_drift = $5,
        max_drift = $6,
        min_drift = $7,
        duration_ms = $8,
        signals_analyzed = $9,
        status = $10,
        error_message = $11,
        completed_at = NOW()
      WHERE calculation_run_id = $1
    `;

    await this.pool.query(query, [
      calculationRunId,
      updates.countriesProcessed || 0,
      updates.vectorsProcessed || 0,
      updates.totalCalculations || 0,
      updates.avgDrift || 0,
      updates.maxDrift || 0,
      updates.minDrift || 0,
      updates.durationMs || 0,
      updates.signalsAnalyzed || 0,
      updates.status || 'completed',
      updates.errorMessage || null
    ]);
  }

  /**
   * Get calculation history
   */
  async getCalculationHistory(limit: number = 20): Promise<CSICalculationLog[]> {
    const query = `
      SELECT * FROM csi_calculation_log
      ORDER BY started_at DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      calculationRunId: row.calculation_run_id,
      countriesProcessed: row.countries_processed,
      vectorsProcessed: row.vectors_processed,
      totalCalculations: row.total_calculations,
      avgDrift: parseFloat(row.avg_drift),
      maxDrift: parseFloat(row.max_drift),
      minDrift: parseFloat(row.min_drift),
      durationMs: row.duration_ms,
      signalsAnalyzed: row.signals_analyzed,
      status: row.status,
      errorMessage: row.error_message,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Convert database row to EnhancedCSI
   */
  private rowToEnhancedCSI(row: any): EnhancedCSI {
    return {
      id: row.id,
      country: row.country,
      vector: row.vector,
      legacyCSI: parseFloat(row.legacy_csi),
      baselineDrift: parseFloat(row.baseline_drift),
      enhancedCSI: parseFloat(row.enhanced_csi),
      signalCount: row.signal_count,
      topSignals: row.top_signals || [],
      explanation: row.explanation,
      calculatedAt: new Date(row.calculated_at),
      validUntil: new Date(row.valid_until),
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}