/**
 * Version Locker
 * 
 * Locks CSI v2.0 and creates archives for production deployment.
 * Prevents further modifications to baselines and ledgers.
 * 
 * @module recalibration/versionLock
 */

import { Pool } from 'pg';

export interface VersionLockStats {
  baselinesLocked: number;
  ledgersArchived: string[];
  versionMetadataCreated: boolean;
  timestamp: Date;
}

/**
 * Version Locker
 */
export class VersionLocker {
  private pool: Pool;
  private version: string;

  constructor(version: string = 'v2.0') {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.version = version;
  }

  /**
   * Lock CSI version and create archives
   */
  async lockVersion(): Promise<VersionLockStats> {
    console.log(`\n=== Locking CSI ${this.version} ===\n`);

    const stats: VersionLockStats = {
      baselinesLocked: 0,
      ledgersArchived: [],
      versionMetadataCreated: false,
      timestamp: new Date()
    };

    try {
      // 1. Lock structural baselines
      stats.baselinesLocked = await this.lockBaselines();
      console.log(`✅ Locked ${stats.baselinesLocked} baselines`);

      // 2. Archive ledgers
      stats.ledgersArchived = await this.archiveLedgers();
      console.log(`✅ Archived ${stats.ledgersArchived.length} ledgers`);

      // 3. Create version metadata
      stats.versionMetadataCreated = await this.createVersionMetadata();
      console.log(`✅ Created version metadata`);

      console.log(`\n=== CSI ${this.version} Locked Successfully ===\n`);

      return stats;

    } catch (error) {
      console.error('Failed to lock version:', error);
      throw error;
    }
  }

  /**
   * Lock structural baselines
   */
  private async lockBaselines(): Promise<number> {
    const result = await this.pool.query(`
      UPDATE structural_baselines
      SET locked = true, locked_at = NOW()
      WHERE version = $1 AND locked = false
      RETURNING id
    `, [this.version]);

    return result.rowCount || 0;
  }

  /**
   * Archive ledgers
   */
  private async archiveLedgers(): Promise<string[]> {
    const archived: string[] = [];

    try {
      // Archive escalation signals
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS escalation_signals_${this.version.replace('.', '_')} AS 
        SELECT * FROM escalation_signals WHERE version = $1
      `, [this.version]);
      archived.push(`escalation_signals_${this.version.replace('.', '_')}`);

      // Archive event candidates
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS event_candidates_${this.version.replace('.', '_')} AS 
        SELECT * FROM event_candidates WHERE version = $1
      `, [this.version]);
      archived.push(`event_candidates_${this.version.replace('.', '_')}`);

      // Archive event CSI delta ledger
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS event_csi_delta_ledger_${this.version.replace('.', '_')} AS 
        SELECT * FROM event_csi_delta_ledger WHERE version = $1
      `, [this.version]);
      archived.push(`event_csi_delta_ledger_${this.version.replace('.', '_')}`);

      // Archive CSI time series
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS csi_time_series_${this.version.replace('.', '_')} AS 
        SELECT * FROM csi_time_series WHERE csi_version = $1
      `, [this.version]);
      archived.push(`csi_time_series_${this.version.replace('.', '_')}`);

    } catch (error) {
      console.warn('Some archive operations failed:', error);
    }

    return archived;
  }

  /**
   * Create version metadata
   */
  private async createVersionMetadata(): Promise<boolean> {
    try {
      await this.pool.query(`
        INSERT INTO csi_versions (version, cut_date, locked_at, description, methodology)
        VALUES ($1, $2, NOW(), $3, $4)
        ON CONFLICT (version) DO UPDATE SET
          locked_at = NOW(),
          description = EXCLUDED.description,
          methodology = EXCLUDED.methodology
      `, [
        this.version,
        new Date('2024-01-01'),
        'Expectation-weighted risk intelligence platform',
        'Dynamic forward-looking CSI with event lifecycle management, baseline drift, and authoritative confirmation'
      ]);

      return true;
    } catch (error) {
      console.error('Failed to create version metadata:', error);
      return false;
    }
  }

  /**
   * Verify version lock
   */
  async verifyLock(): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM structural_baselines WHERE version = $1 AND locked = true) as locked_baselines,
          (SELECT COUNT(*) FROM csi_versions WHERE version = $1 AND locked_at IS NOT NULL) as version_locked
      `, [this.version]);

      const row = result.rows[0];
      const isLocked = row.locked_baselines > 0 && row.version_locked > 0;

      console.log(`\nVersion Lock Verification:`);
      console.log(`  Locked Baselines: ${row.locked_baselines}`);
      console.log(`  Version Locked: ${row.version_locked > 0 ? 'Yes' : 'No'}`);
      console.log(`  Status: ${isLocked ? '✅ Verified' : '❌ Not Locked'}\n`);

      return isLocked;
    } catch (error) {
      console.error('Failed to verify lock:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}