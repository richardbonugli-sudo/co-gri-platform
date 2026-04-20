/**
 * Ledger Initializer
 * 
 * Initializes empty ledgers for CSI v2.0 recalibration.
 * Clears existing v2.0 data and prepares tables for replay.
 * 
 * @module recalibration/initializeLedgers
 */

import { Pool } from 'pg';

export interface LedgerInitializationStats {
  escalationSignalsCleared: number;
  eventCandidatesCleared: number;
  eventDeltasCleared: number;
  timeSeriesCleared: number;
  tablesVerified: string[];
  duration: number;
}

/**
 * Ledger Initializer
 */
export class LedgerInitializer {
  private pool: Pool;
  private version: string;

  constructor(version: string = 'v2.0') {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.version = version;
  }

  /**
   * Initialize all ledgers for v2.0
   */
  async initializeAllLedgers(): Promise<LedgerInitializationStats> {
    const startTime = Date.now();
    console.log(`Initializing CSI ${this.version} ledgers...`);

    const stats: LedgerInitializationStats = {
      escalationSignalsCleared: 0,
      eventCandidatesCleared: 0,
      eventDeltasCleared: 0,
      timeSeriesCleared: 0,
      tablesVerified: [],
      duration: 0
    };

    try {
      // Clear existing v2.0 data
      const clearStats = await this.clearExistingData();
      Object.assign(stats, clearStats);

      // Verify ledger tables exist
      stats.tablesVerified = await this.verifyLedgerTables();

      stats.duration = Date.now() - startTime;

      console.log('\nLedger Initialization Summary:');
      console.log(`  Escalation Signals Cleared: ${stats.escalationSignalsCleared}`);
      console.log(`  Event Candidates Cleared: ${stats.eventCandidatesCleared}`);
      console.log(`  Event Deltas Cleared: ${stats.eventDeltasCleared}`);
      console.log(`  Time Series Records Cleared: ${stats.timeSeriesCleared}`);
      console.log(`  Tables Verified: ${stats.tablesVerified.join(', ')}`);
      console.log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s`);

      console.log('✅ Ledgers initialized successfully');

      return stats;

    } catch (error) {
      console.error('Failed to initialize ledgers:', error);
      throw error;
    }
  }

  /**
   * Clear existing v2.0 data
   */
  private async clearExistingData(): Promise<Partial<LedgerInitializationStats>> {
    console.log(`Clearing existing ${this.version} data...`);

    const stats: Partial<LedgerInitializationStats> = {
      escalationSignalsCleared: 0,
      eventCandidatesCleared: 0,
      eventDeltasCleared: 0,
      timeSeriesCleared: 0
    };

    try {
      // Clear escalation signals
      const escalationResult = await this.pool.query(`
        DELETE FROM escalation_signals WHERE version = $1
        RETURNING id
      `, [this.version]);
      stats.escalationSignalsCleared = escalationResult.rowCount || 0;

      // Clear event candidates
      const candidatesResult = await this.pool.query(`
        DELETE FROM event_candidates WHERE version = $1
        RETURNING id
      `, [this.version]);
      stats.eventCandidatesCleared = candidatesResult.rowCount || 0;

      // Clear event CSI delta ledger
      const deltaResult = await this.pool.query(`
        DELETE FROM event_csi_delta_ledger WHERE version = $1
        RETURNING id
      `, [this.version]);
      stats.eventDeltasCleared = deltaResult.rowCount || 0;

      // Clear CSI time series
      const timeSeriesResult = await this.pool.query(`
        DELETE FROM csi_time_series WHERE csi_version = $1
        RETURNING id
      `, [this.version]);
      stats.timeSeriesCleared = timeSeriesResult.rowCount || 0;

      console.log(`  Cleared ${stats.escalationSignalsCleared + stats.eventCandidatesCleared + stats.eventDeltasCleared + stats.timeSeriesCleared} total records`);

    } catch (error) {
      console.warn('Some tables may not exist yet, continuing...', error);
    }

    return stats;
  }

  /**
   * Verify ledger tables exist
   */
  private async verifyLedgerTables(): Promise<string[]> {
    console.log('Verifying ledger tables...');

    const requiredTables = [
      'escalation_signals',
      'event_candidates',
      'event_csi_delta_ledger',
      'csi_time_series',
      'structural_baselines'
    ];

    const verifiedTables: string[] = [];

    try {
      const result = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY($1)
      `, [requiredTables]);

      verifiedTables.push(...result.rows.map(row => row.table_name));

      const missingTables = requiredTables.filter(t => !verifiedTables.includes(t));

      if (missingTables.length > 0) {
        console.warn(`  Missing tables: ${missingTables.join(', ')}`);
        console.warn('  Run Phase 5A schema creation first');
      } else {
        console.log(`  All ${requiredTables.length} required tables verified`);
      }

    } catch (error) {
      console.error('Failed to verify tables:', error);
    }

    return verifiedTables;
  }

  /**
   * Initialize time series for all countries
   */
  async initializeTimeSeriesForAllCountries(startDate: Date, endDate: Date): Promise<number> {
    console.log(`Initializing time series from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);

    let recordsCreated = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
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
          0 as escalation_drift,
          0 as event_csi_delta,
          sb.baseline_csi as csi_total
        FROM structural_baselines sb
        WHERE sb.version = $2 AND sb.locked = true
        ON CONFLICT (country, date, csi_version) DO NOTHING
      `, [currentDate, this.version]);

      recordsCreated += result.rowCount || 0;

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`  Created ${recordsCreated} time series records`);
    return recordsCreated;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}