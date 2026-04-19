/**
 * Replay Engine
 * 
 * Replays forward from cut date to present, processing all signals and events
 * with the new expectation-weighted methodology.
 * 
 * @module recalibration/replayEngine
 */

import { Pool } from 'pg';

export interface ReplayConfig {
  startDate: Date;
  endDate: Date;
  batchSize: number; // days per batch
  version: string;
}

export interface DailyReplayStats {
  date: Date;
  signalsIngested: number;
  candidatesCreated: number;
  candidatesValidated: number;
  provisionalEvents: number;
  confirmedEvents: number;
  driftApplied: number;
  countriesUpdated: number;
  duration: number;
}

export interface ReplayStats {
  totalDays: number;
  totalSignals: number;
  totalCandidates: number;
  totalProvisional: number;
  totalConfirmed: number;
  totalDrift: number;
  dailyStats: DailyReplayStats[];
  duration: number;
}

/**
 * Replay Engine
 */
export class ReplayEngine {
  private pool: Pool;
  private config: ReplayConfig;

  constructor(config: Partial<ReplayConfig> = {}) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.config = {
      startDate: config.startDate || new Date('2024-01-01'),
      endDate: config.endDate || new Date(),
      batchSize: config.batchSize || 1,
      version: config.version || 'v2.0'
    };
  }

  /**
   * Replay forward from start date to end date
   */
  async replayForward(): Promise<ReplayStats> {
    const startTime = Date.now();
    console.log(`\n=== Starting Replay Forward ===`);
    console.log(`From: ${this.config.startDate.toISOString().split('T')[0]}`);
    console.log(`To: ${this.config.endDate.toISOString().split('T')[0]}`);
    console.log(`Version: ${this.config.version}\n`);

    const stats: ReplayStats = {
      totalDays: 0,
      totalSignals: 0,
      totalCandidates: 0,
      totalProvisional: 0,
      totalConfirmed: 0,
      totalDrift: 0,
      dailyStats: [],
      duration: 0
    };

    let currentDate = new Date(this.config.startDate);

    while (currentDate <= this.config.endDate) {
      stats.totalDays++;
      
      const dailyStats = await this.processDay(currentDate);
      stats.dailyStats.push(dailyStats);

      // Aggregate stats
      stats.totalSignals += dailyStats.signalsIngested;
      stats.totalCandidates += dailyStats.candidatesCreated;
      stats.totalProvisional += dailyStats.provisionalEvents;
      stats.totalConfirmed += dailyStats.confirmedEvents;
      stats.totalDrift += dailyStats.driftApplied;

      // Progress update every 7 days
      if (stats.totalDays % 7 === 0) {
        console.log(`\n📊 Progress Update (Day ${stats.totalDays}):`);
        console.log(`  Signals: ${stats.totalSignals}`);
        console.log(`  Candidates: ${stats.totalCandidates}`);
        console.log(`  Provisional: ${stats.totalProvisional}`);
        console.log(`  Confirmed: ${stats.totalConfirmed}`);
      }

      // Move to next day
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    stats.duration = Date.now() - startTime;

    console.log(`\n=== Replay Complete ===`);
    console.log(`Total Days: ${stats.totalDays}`);
    console.log(`Total Signals: ${stats.totalSignals}`);
    console.log(`Total Candidates: ${stats.totalCandidates}`);
    console.log(`Total Provisional: ${stats.totalProvisional}`);
    console.log(`Total Confirmed: ${stats.totalConfirmed}`);
    console.log(`Duration: ${(stats.duration / 1000 / 60).toFixed(2)} minutes\n`);

    return stats;
  }

  /**
   * Process a single day
   */
  private async processDay(date: Date): Promise<DailyReplayStats> {
    const startTime = Date.now();
    const dateStr = date.toISOString().split('T')[0];

    const stats: DailyReplayStats = {
      date,
      signalsIngested: 0,
      candidatesCreated: 0,
      candidatesValidated: 0,
      provisionalEvents: 0,
      confirmedEvents: 0,
      driftApplied: 0,
      countriesUpdated: 0,
      duration: 0
    };

    try {
      // 1. Ingest signals for this day
      stats.signalsIngested = await this.ingestDailySignals(date);

      // 2. Create event candidates from signals
      stats.candidatesCreated = await this.createCandidates(date);

      // 3. Validate candidates (corroboration)
      stats.candidatesValidated = await this.validateCandidates(date);

      // 4. Route to vectors and mark as provisional
      stats.provisionalEvents = await this.routeAndMarkProvisional(date);

      // 5. Apply baseline drift for provisional events
      stats.driftApplied = await this.applyBaselineDrift(date);

      // 6. Check for authoritative confirmations
      stats.confirmedEvents = await this.checkAndConfirmEvents(date);

      // 7. Update CSI for all countries
      stats.countriesUpdated = await this.updateCSIForDate(date);

      stats.duration = Date.now() - startTime;

      if (stats.signalsIngested > 0 || stats.confirmedEvents > 0) {
        console.log(`${dateStr}: ${stats.signalsIngested} signals, ${stats.provisionalEvents} provisional, ${stats.confirmedEvents} confirmed (${stats.duration}ms)`);
      }

    } catch (error) {
      console.error(`Error processing ${dateStr}:`, error);
    }

    return stats;
  }

  /**
   * Ingest signals for a specific day (placeholder)
   */
  private async ingestDailySignals(date: Date): Promise<number> {
    // In production, this would fetch from GDELT, news archives, etc.
    // For now, return count from historical_signals table if it exists
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM historical_signals
        WHERE DATE(detected_at) = $1
      `, [date]);

      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      // Table doesn't exist, return 0
      return 0;
    }
  }

  /**
   * Create event candidates from signals
   */
  private async createCandidates(date: Date): Promise<number> {
    // Placeholder: In production, this would parse signals into structured candidates
    return 0;
  }

  /**
   * Validate candidates using corroboration rules
   */
  private async validateCandidates(date: Date): Promise<number> {
    // Placeholder: Apply corroboration engine
    return 0;
  }

  /**
   * Route candidates to vectors and mark as provisional
   */
  private async routeAndMarkProvisional(date: Date): Promise<number> {
    // Placeholder: Apply vector routing
    return 0;
  }

  /**
   * Apply baseline drift for provisional events
   */
  private async applyBaselineDrift(date: Date): Promise<number> {
    try {
      const result = await this.pool.query(`
        WITH provisional_events AS (
          SELECT 
            ec.id,
            ec.target_country,
            ec.severity,
            ec.probability_score,
            (ec.severity / 100.0) * COALESCE(ec.probability_score, 0.5) * 10 as drift_amount
          FROM event_candidates ec
          WHERE 
            ec.lifecycle_state = 'PROVISIONAL' AND
            DATE(ec.detected_at) = $1 AND
            ec.version = $2 AND
            ec.baseline_drift_applied = false
        )
        UPDATE csi_time_series cts
        SET 
          escalation_drift = escalation_drift + pe.drift_amount,
          csi_total = structural_baseline + escalation_drift + pe.drift_amount + event_csi_delta,
          updated_at = NOW()
        FROM provisional_events pe
        WHERE 
          cts.country = pe.target_country AND
          cts.date = $1 AND
          cts.csi_version = $2
        RETURNING pe.id
      `, [date, this.config.version]);

      // Mark events as having drift applied
      if (result.rowCount && result.rowCount > 0) {
        await this.pool.query(`
          UPDATE event_candidates
          SET baseline_drift_applied = true
          WHERE id = ANY($1)
        `, [result.rows.map(r => r.id)]);
      }

      return result.rowCount || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check for authoritative confirmations and confirm events
   */
  private async checkAndConfirmEvents(date: Date): Promise<number> {
    try {
      // Find matching provisional events for authoritative confirmations
      const result = await this.pool.query(`
        WITH confirmations AS (
          SELECT 
            ac.id as confirmation_id,
            ac.country,
            ac.vector,
            ac.published_at,
            ec.id as event_id,
            ec.baseline_drift_amount,
            (ec.severity / 10.0) as total_impact
          FROM authoritative_confirmations ac
          JOIN event_candidates ec ON 
            ec.target_country = ac.country AND
            ec.vector_primary = ac.vector AND
            ec.lifecycle_state = 'PROVISIONAL' AND
            ec.detected_at BETWEEN ac.published_at - INTERVAL '7 days' AND ac.published_at
          WHERE 
            DATE(ac.published_at) = $1 AND
            ac.version = $2
        )
        UPDATE event_candidates ec
        SET 
          lifecycle_state = 'CONFIRMED',
          confirmed_at = NOW(),
          confirming_source_id = c.confirmation_id
        FROM confirmations c
        WHERE ec.id = c.event_id
        RETURNING ec.id, c.country, c.total_impact, c.baseline_drift_amount
      `, [date, this.config.version]);

      // Update CSI: net prior drift and apply Event_CSI_Δ
      for (const row of result.rows) {
        const priorDrift = row.baseline_drift_amount || 0;
        const eventDelta = row.total_impact - priorDrift;

        await this.pool.query(`
          UPDATE csi_time_series
          SET 
            escalation_drift = escalation_drift - $1,
            event_csi_delta = event_csi_delta + $2,
            csi_total = structural_baseline + (escalation_drift - $1) + (event_csi_delta + $2),
            updated_at = NOW()
          WHERE 
            country = $3 AND
            date = $4 AND
            csi_version = $5
        `, [priorDrift, eventDelta, row.country, date, this.config.version]);
      }

      return result.rowCount || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update CSI for all countries on a specific date
   */
  private async updateCSIForDate(date: Date): Promise<number> {
    try {
      const result = await this.pool.query(`
        INSERT INTO csi_time_series (
          country, date, csi_version, structural_baseline, 
          escalation_drift, event_csi_delta, csi_total
        )
        SELECT 
          sb.country,
          $1 as date,
          $2 as csi_version,
          sb.baseline_csi as structural_baseline,
          COALESCE(SUM(es.drift_amount), 0) as escalation_drift,
          COALESCE(SUM(ed.csi_delta), 0) as event_csi_delta,
          sb.baseline_csi + COALESCE(SUM(es.drift_amount), 0) + COALESCE(SUM(ed.csi_delta), 0) as csi_total
        FROM structural_baselines sb
        LEFT JOIN escalation_signals es ON 
          es.target_country = sb.country AND 
          DATE(es.detected_at) <= $1 AND
          es.version = $2
        LEFT JOIN event_csi_delta_ledger ed ON 
          ed.country = sb.country AND 
          ed.event_date <= $1 AND
          ed.version = $2
        WHERE 
          sb.version = $2 AND 
          sb.locked = true
        GROUP BY sb.country, sb.baseline_csi
        ON CONFLICT (country, date, csi_version) 
        DO UPDATE SET
          escalation_drift = EXCLUDED.escalation_drift,
          event_csi_delta = EXCLUDED.event_csi_delta,
          csi_total = EXCLUDED.csi_total,
          updated_at = NOW()
      `, [date, this.config.version]);

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error updating CSI:', error);
      return 0;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}