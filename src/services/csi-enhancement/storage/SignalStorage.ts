/**
 * Signal Storage
 * Database operations for signals
 */

import type { StructuredSignal, CorroborationResult, PersistenceResult } from '@/types/csi-enhancement/signals';
import { Pool } from 'pg';

export class SignalStorage {
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
   * Save signal to database
   */
  async saveSignal(signal: StructuredSignal): Promise<void> {
    const query = `
      INSERT INTO signals (
        signal_id, source_id, detected_at, countries, regions,
        primary_vector, secondary_vector, headline, summary, full_text,
        signal_type, severity, actors, language, source_credibility,
        url, tags, is_qualified, qualification_reason, qualified_at,
        corroboration_count, corroboration_score, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24
      )
      ON CONFLICT (signal_id) DO UPDATE SET
        is_qualified = EXCLUDED.is_qualified,
        qualification_reason = EXCLUDED.qualification_reason,
        qualified_at = EXCLUDED.qualified_at,
        corroboration_count = EXCLUDED.corroboration_count,
        corroboration_score = EXCLUDED.corroboration_score,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      signal.signalId,
      signal.sourceId,
      signal.detectedAt,
      signal.countries,
      signal.regions || null,
      signal.primaryVector,
      signal.secondaryVector || null,
      signal.headline,
      signal.summary,
      signal.fullText || null,
      signal.signalType,
      signal.severity,
      JSON.stringify(signal.actors),
      signal.language,
      signal.sourceCredibility,
      signal.url || null,
      signal.tags,
      signal.isQualified || false,
      signal.qualificationReason || null,
      signal.qualifiedAt || null,
      signal.corroborationCount || 1,
      signal.corroborationScore || null,
      signal.createdAt,
      signal.updatedAt
    ];

    await this.pool.query(query, values);
  }

  /**
   * Find signals by country
   */
  async findByCountry(countryCode: string, limit: number = 100): Promise<StructuredSignal[]> {
    const query = `
      SELECT * FROM signals
      WHERE $1 = ANY(countries)
      ORDER BY detected_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [countryCode, limit]);
    return result.rows.map(row => this.rowToSignal(row));
  }

  /**
   * Find signals by vector
   */
  async findByVector(vector: string, limit: number = 100): Promise<StructuredSignal[]> {
    const query = `
      SELECT * FROM signals
      WHERE primary_vector = $1
      ORDER BY detected_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [vector, limit]);
    return result.rows.map(row => this.rowToSignal(row));
  }

  /**
   * Find recent signals for corroboration
   */
  async findRecentSignals(hoursBack: number = 72): Promise<StructuredSignal[]> {
    const query = `
      SELECT * FROM signals
      WHERE detected_at > NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY detected_at DESC
    `;

    const result = await this.pool.query(query);
    return result.rows.map(row => this.rowToSignal(row));
  }

  /**
   * Find qualified signals
   */
  async findQualifiedSignals(limit: number = 100): Promise<StructuredSignal[]> {
    const query = `
      SELECT * FROM signals
      WHERE is_qualified = TRUE
      ORDER BY detected_at DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => this.rowToSignal(row));
  }

  /**
   * Save corroboration relationship
   */
  async saveCorroboration(
    primarySignalId: string,
    corroboratingSignalId: string,
    similarity: {
      geographic: number;
      vector: number;
      content: number;
      temporal: number;
      overall: number;
    }
  ): Promise<void> {
    const query = `
      INSERT INTO signal_corroboration (
        primary_signal_id, corroborating_signal_id,
        geographic_similarity, vector_similarity, content_similarity,
        temporal_proximity_hours, overall_similarity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (primary_signal_id, corroborating_signal_id) DO NOTHING
    `;

    const values = [
      primarySignalId,
      corroboratingSignalId,
      similarity.geographic,
      similarity.vector,
      similarity.content,
      similarity.temporal,
      similarity.overall
    ];

    await this.pool.query(query, values);
  }

  /**
   * Save persistence record
   */
  async savePersistence(
    signalClusterId: string,
    persistence: PersistenceResult
  ): Promise<void> {
    const query = `
      INSERT INTO signal_persistence (
        signal_cluster_id, first_detected, last_detected,
        duration_hours, mention_count, mentions_per_day,
        persistence_score, is_persistent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (signal_cluster_id) DO UPDATE SET
        last_detected = EXCLUDED.last_detected,
        duration_hours = EXCLUDED.duration_hours,
        mention_count = EXCLUDED.mention_count,
        mentions_per_day = EXCLUDED.mentions_per_day,
        persistence_score = EXCLUDED.persistence_score,
        is_persistent = EXCLUDED.is_persistent,
        updated_at = NOW()
    `;

    const firstDetected = new Date(persistence.lastMention.getTime() - persistence.durationHours * 60 * 60 * 1000);

    const values = [
      signalClusterId,
      firstDetected,
      persistence.lastMention,
      persistence.durationHours,
      persistence.mentionCount,
      persistence.averageMentionsPerDay,
      persistence.persistenceScore,
      persistence.isPersistent
    ];

    await this.pool.query(query, values);
  }

  /**
   * Get signal statistics
   */
  async getStatistics(): Promise<{
    totalSignals: number;
    qualifiedSignals: number;
    signalsByCountry: Record<string, number>;
    signalsByVector: Record<string, number>;
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM signals';
    const qualifiedQuery = 'SELECT COUNT(*) as count FROM signals WHERE is_qualified = TRUE';
    const countryQuery = 'SELECT * FROM signal_stats_by_country';
    const vectorQuery = 'SELECT * FROM signal_stats_by_vector';

    const [totalResult, qualifiedResult, countryResult, vectorResult] = await Promise.all([
      this.pool.query(totalQuery),
      this.pool.query(qualifiedQuery),
      this.pool.query(countryQuery),
      this.pool.query(vectorQuery)
    ]);

    const signalsByCountry: Record<string, number> = {};
    for (const row of countryResult.rows) {
      signalsByCountry[row.country] = parseInt(row.total_signals);
    }

    const signalsByVector: Record<string, number> = {};
    for (const row of vectorResult.rows) {
      signalsByVector[row.primary_vector] = parseInt(row.total_signals);
    }

    return {
      totalSignals: parseInt(totalResult.rows[0].count),
      qualifiedSignals: parseInt(qualifiedResult.rows[0].count),
      signalsByCountry,
      signalsByVector
    };
  }

  /**
   * Convert database row to StructuredSignal
   */
  private rowToSignal(row: any): StructuredSignal {
    return {
      signalId: row.signal_id,
      sourceId: row.source_id,
      detectedAt: new Date(row.detected_at),
      countries: row.countries,
      regions: row.regions,
      primaryVector: row.primary_vector,
      secondaryVector: row.secondary_vector,
      headline: row.headline,
      summary: row.summary,
      fullText: row.full_text,
      signalType: row.signal_type,
      severity: row.severity,
      actors: row.actors ? JSON.parse(row.actors) : [],
      language: row.language,
      sourceCredibility: parseFloat(row.source_credibility),
      url: row.url,
      tags: row.tags,
      isQualified: row.is_qualified,
      qualificationReason: row.qualification_reason,
      qualifiedAt: row.qualified_at ? new Date(row.qualified_at) : undefined,
      corroborationCount: row.corroboration_count,
      corroborationScore: row.corroboration_score ? parseFloat(row.corroboration_score) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}