/**
 * Historical Data Loader (SQLite Version)
 * 
 * Loads historical data from various sources for CSI baseline calculation
 * and replay. Uses sample data for demonstration purposes.
 * 
 * @module recalibration/loadHistoricalData_sqlite
 */

import Database from 'better-sqlite3';
import * as path from 'path';

export interface DataLoadingStats {
  wgiRecords: number;
  democracyRecords: number;
  sanctionsRecords: number;
  conflictRecords: number;
  signalRecords: number;
  duration: number;
}

/**
 * Historical Data Loader
 */
class HistoricalDataLoader {
  private db: Database.Database;

  constructor(dbPath: string = './csi_recalibration.db') {
    const fullPath = path.resolve(dbPath);
    console.log(`Connecting to database: ${fullPath}`);
    this.db = new Database(fullPath);
    this.createTables();
  }

  /**
   * Create necessary tables if they don't exist
   */
  private createTables(): void {
    // Create tables for historical data sources
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS world_bank_wgi (
        country_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        governance_score REAL NOT NULL,
        PRIMARY KEY (country_code, year)
      );

      CREATE TABLE IF NOT EXISTS democracy_indices (
        country_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        freedom_house_score REAL NOT NULL,
        vdem_score REAL NOT NULL,
        PRIMARY KEY (country_code, year)
      );

      CREATE TABLE IF NOT EXISTS sanctions_regimes (
        target_country TEXT NOT NULL,
        sanctioning_entity TEXT NOT NULL,
        severity TEXT NOT NULL,
        effective_date TEXT NOT NULL,
        description TEXT,
        expiry_date TEXT,
        PRIMARY KEY (target_country, sanctioning_entity, effective_date)
      );

      CREATE TABLE IF NOT EXISTS conflict_events (
        country_code TEXT NOT NULL,
        event_date TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        PRIMARY KEY (country_code, event_date, event_type)
      );
    `);
  }

  /**
   * Load all historical data sources
   */
  async loadAll(): Promise<DataLoadingStats> {
    const startTime = Date.now();
    console.log('=== Loading Historical Data ===\n');

    const stats: DataLoadingStats = {
      wgiRecords: 0,
      democracyRecords: 0,
      sanctionsRecords: 0,
      conflictRecords: 0,
      signalRecords: 0,
      duration: 0
    };

    try {
      // 1. Load World Bank WGI data
      console.log('1. Loading World Bank WGI data...');
      stats.wgiRecords = await this.loadWorldBankWGI();
      console.log(`   ✅ Loaded ${stats.wgiRecords} WGI records\n`);

      // 2. Load democracy indices
      console.log('2. Loading democracy indices...');
      stats.democracyRecords = await this.loadDemocracyIndices();
      console.log(`   ✅ Loaded ${stats.democracyRecords} democracy records\n`);

      // 3. Load sanctions data
      console.log('3. Loading sanctions data...');
      stats.sanctionsRecords = await this.loadSanctionsData();
      console.log(`   ✅ Loaded ${stats.sanctionsRecords} sanctions records\n`);

      // 4. Load conflict history
      console.log('4. Loading conflict history...');
      stats.conflictRecords = await this.loadConflictHistory();
      console.log(`   ✅ Loaded ${stats.conflictRecords} conflict records\n`);

      // 5. Load GDELT historical signals
      console.log('5. Loading GDELT historical signals...');
      stats.signalRecords = await this.loadGDELTSignals();
      console.log(`   ✅ Loaded ${stats.signalRecords} signal records\n`);

      stats.duration = Date.now() - startTime;

      console.log('=== Data Loading Summary ===');
      console.log(`Total Records: ${stats.wgiRecords + stats.democracyRecords + stats.sanctionsRecords + stats.conflictRecords + stats.signalRecords}`);
      console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s\n`);
      console.log('✅ All historical data loaded successfully!\n');

      return stats;

    } catch (error) {
      console.error('Error loading historical data:', error);
      throw error;
    }
  }

  /**
   * Load World Bank WGI data
   */
  private async loadWorldBankWGI(): Promise<number> {
    const sampleData = [
      { country_code: 'USA', year: 2023, governance_score: 85 },
      { country_code: 'CHN', year: 2023, governance_score: 45 },
      { country_code: 'RUS', year: 2023, governance_score: 25 },
      { country_code: 'DEU', year: 2023, governance_score: 92 },
      { country_code: 'GBR', year: 2023, governance_score: 90 },
      { country_code: 'FRA', year: 2023, governance_score: 88 },
      { country_code: 'JPN', year: 2023, governance_score: 87 },
      { country_code: 'IND', year: 2023, governance_score: 55 },
      { country_code: 'BRA', year: 2023, governance_score: 52 },
      { country_code: 'CAN', year: 2023, governance_score: 91 },
      { country_code: 'KOR', year: 2023, governance_score: 82 },
      { country_code: 'AUS', year: 2023, governance_score: 89 },
      { country_code: 'ESP', year: 2023, governance_score: 80 },
      { country_code: 'MEX', year: 2023, governance_score: 48 },
      { country_code: 'IDN', year: 2023, governance_score: 50 },
      { country_code: 'NLD', year: 2023, governance_score: 93 },
      { country_code: 'SAU', year: 2023, governance_score: 42 },
      { country_code: 'TUR', year: 2023, governance_score: 38 },
      { country_code: 'CHE', year: 2023, governance_score: 94 },
      { country_code: 'ITA', year: 2023, governance_score: 75 }
    ];

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO world_bank_wgi (country_code, year, governance_score)
      VALUES (?, ?, ?)
    `);

    let count = 0;
    for (const data of sampleData) {
      try {
        stmt.run(data.country_code, data.year, data.governance_score);
        count++;
      } catch (error) {
        console.warn(`Failed to insert WGI data for ${data.country_code}:`, error);
      }
    }

    return count;
  }

  /**
   * Load democracy indices
   */
  private async loadDemocracyIndices(): Promise<number> {
    const sampleData = [
      { country_code: 'USA', year: 2023, freedom_house_score: 83, vdem_score: 78 },
      { country_code: 'CHN', year: 2023, freedom_house_score: 9, vdem_score: 12 },
      { country_code: 'RUS', year: 2023, freedom_house_score: 19, vdem_score: 22 },
      { country_code: 'DEU', year: 2023, freedom_house_score: 94, vdem_score: 92 },
      { country_code: 'GBR', year: 2023, freedom_house_score: 93, vdem_score: 90 },
      { country_code: 'FRA', year: 2023, freedom_house_score: 90, vdem_score: 88 },
      { country_code: 'JPN', year: 2023, freedom_house_score: 96, vdem_score: 89 },
      { country_code: 'IND', year: 2023, freedom_house_score: 66, vdem_score: 58 },
      { country_code: 'BRA', year: 2023, freedom_house_score: 73, vdem_score: 70 },
      { country_code: 'CAN', year: 2023, freedom_house_score: 98, vdem_score: 92 },
      { country_code: 'KOR', year: 2023, freedom_house_score: 83, vdem_score: 80 },
      { country_code: 'AUS', year: 2023, freedom_house_score: 95, vdem_score: 91 },
      { country_code: 'ESP', year: 2023, freedom_house_score: 90, vdem_score: 85 },
      { country_code: 'MEX', year: 2023, freedom_house_score: 60, vdem_score: 55 },
      { country_code: 'IDN', year: 2023, freedom_house_score: 59, vdem_score: 54 },
      { country_code: 'NLD', year: 2023, freedom_house_score: 99, vdem_score: 93 },
      { country_code: 'SAU', year: 2023, freedom_house_score: 7, vdem_score: 10 },
      { country_code: 'TUR', year: 2023, freedom_house_score: 32, vdem_score: 35 },
      { country_code: 'CHE', year: 2023, freedom_house_score: 96, vdem_score: 94 },
      { country_code: 'ITA', year: 2023, freedom_house_score: 90, vdem_score: 84 }
    ];

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO democracy_indices (country_code, year, freedom_house_score, vdem_score)
      VALUES (?, ?, ?, ?)
    `);

    let count = 0;
    for (const data of sampleData) {
      try {
        stmt.run(data.country_code, data.year, data.freedom_house_score, data.vdem_score);
        count++;
      } catch (error) {
        console.warn(`Failed to insert democracy data for ${data.country_code}:`, error);
      }
    }

    return count;
  }

  /**
   * Load sanctions data
   */
  private async loadSanctionsData(): Promise<number> {
    const sampleData = [
      { target_country: 'RUS', sanctioning_entity: 'US', severity: 'comprehensive', effective_date: '2022-02-24', description: 'Comprehensive sanctions following Ukraine invasion' },
      { target_country: 'RUS', sanctioning_entity: 'EU', severity: 'comprehensive', effective_date: '2022-02-25', description: 'EU sanctions package' },
      { target_country: 'IRN', sanctioning_entity: 'US', severity: 'sectoral', effective_date: '2018-05-08', description: 'Sectoral sanctions on energy and finance' },
      { target_country: 'PRK', sanctioning_entity: 'UN', severity: 'comprehensive', effective_date: '2006-10-14', description: 'UN Security Council sanctions' },
      { target_country: 'VEN', sanctioning_entity: 'US', severity: 'sectoral', effective_date: '2019-01-28', description: 'Oil sector sanctions' },
      { target_country: 'SYR', sanctioning_entity: 'US', severity: 'sectoral', effective_date: '2011-08-18', description: 'Sanctions on government officials' },
      { target_country: 'CUB', sanctioning_entity: 'US', severity: 'comprehensive', effective_date: '1962-02-07', description: 'Long-standing embargo' }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO sanctions_regimes (target_country, sanctioning_entity, severity, effective_date, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const data of sampleData) {
      try {
        stmt.run(data.target_country, data.sanctioning_entity, data.severity, data.effective_date, data.description);
        count++;
      } catch (error) {
        console.warn(`Failed to insert sanctions data for ${data.target_country}:`, error);
      }
    }

    return count;
  }

  /**
   * Load conflict history
   */
  private async loadConflictHistory(): Promise<number> {
    const sampleData = [
      { country_code: 'UKR', event_date: '2024-01-15', intensity: 850, event_type: 'armed_conflict', source: 'UCDP' },
      { country_code: 'UKR', event_date: '2024-02-20', intensity: 920, event_type: 'armed_conflict', source: 'UCDP' },
      { country_code: 'ISR', event_date: '2024-10-07', intensity: 1200, event_type: 'armed_conflict', source: 'ACLED' },
      { country_code: 'SYR', event_date: '2024-03-20', intensity: 430, event_type: 'armed_conflict', source: 'UCDP' },
      { country_code: 'YEM', event_date: '2024-01-10', intensity: 320, event_type: 'armed_conflict', source: 'ACLED' },
      { country_code: 'AFG', event_date: '2024-05-15', intensity: 280, event_type: 'armed_conflict', source: 'UCDP' },
      { country_code: 'SDN', event_date: '2024-04-12', intensity: 650, event_type: 'armed_conflict', source: 'ACLED' },
      { country_code: 'MMR', event_date: '2024-06-08', intensity: 180, event_type: 'armed_conflict', source: 'UCDP' }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO conflict_events (country_code, event_date, intensity, event_type, source)
      VALUES (?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const data of sampleData) {
      try {
        stmt.run(data.country_code, data.event_date, data.intensity, data.event_type, data.source);
        count++;
      } catch (error) {
        console.warn(`Failed to insert conflict data for ${data.country_code}:`, error);
      }
    }

    return count;
  }

  /**
   * Load GDELT historical signals
   */
  private async loadGDELTSignals(): Promise<number> {
    const sampleSignals = [
      { detected_at: '2024-01-15T10:30:00Z', source_id: 'gdelt', target_country: 'CHN', actor_country: 'USA', event_type: 'trade_restriction', severity: 65, goldstein_scale: -5.0, title: 'US considers new export controls on AI chips to China', description: 'Export control announcement', url: 'https://example.com/news1' },
      { detected_at: '2024-03-15T14:20:00Z', source_id: 'gdelt', target_country: 'CHN', actor_country: 'USA', event_type: 'tariff_announcement', severity: 75, goldstein_scale: -6.5, title: 'Biden announces 25% tariffs on Chinese EVs', description: 'Tariff announcement', url: 'https://example.com/news2' },
      { detected_at: '2024-06-20T09:15:00Z', source_id: 'gdelt', target_country: 'RUS', actor_country: 'EU', event_type: 'sanctions', severity: 70, goldstein_scale: -7.0, title: 'EU announces 14th sanctions package on Russia', description: 'Sanctions announcement', url: 'https://example.com/news3' },
      { detected_at: '2024-10-07T06:00:00Z', source_id: 'gdelt', target_country: 'ISR', actor_country: 'PSE', event_type: 'military_action', severity: 95, goldstein_scale: -10.0, title: 'Major escalation in Gaza conflict', description: 'Military escalation', url: 'https://example.com/news4' },
      { detected_at: '2024-02-14T11:45:00Z', source_id: 'gdelt', target_country: 'UKR', actor_country: 'RUS', event_type: 'military_action', severity: 85, goldstein_scale: -8.5, title: 'Ukraine conflict intensifies', description: 'Conflict intensification', url: 'https://example.com/news5' },
      { detected_at: '2024-04-13T15:30:00Z', source_id: 'gdelt', target_country: 'IRN', actor_country: 'ISR', event_type: 'military_action', severity: 80, goldstein_scale: -8.0, title: 'Iran-Israel tensions escalate', description: 'Military tensions', url: 'https://example.com/news6' },
      { detected_at: '2024-07-19T08:00:00Z', source_id: 'gdelt', target_country: 'USA', actor_country: null, event_type: 'cyber_incident', severity: 60, goldstein_scale: -4.0, title: 'CrowdStrike outage causes global disruption', description: 'Cyber incident', url: 'https://example.com/news7' },
      { detected_at: '2024-05-10T12:00:00Z', source_id: 'gdelt', target_country: 'CHN', actor_country: 'USA', event_type: 'trade_restriction', severity: 68, goldstein_scale: -5.5, title: 'China retaliates with rare earth export controls', description: 'Export control retaliation', url: 'https://example.com/news8' }
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO historical_signals (
        detected_at, source_id, target_country, actor_country, 
        event_type, severity, goldstein_scale, title, description, url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const signal of sampleSignals) {
      try {
        stmt.run(
          signal.detected_at, signal.source_id, signal.target_country,
          signal.actor_country, signal.event_type, signal.severity,
          signal.goldstein_scale, signal.title, signal.description, signal.url
        );
        count++;
      } catch (error) {
        console.warn(`Failed to insert signal:`, error);
      }
    }

    return count;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// CLI execution
if (require.main === module) {
  const dbPath = process.argv[2] || './csi_recalibration.db';
  const loader = new HistoricalDataLoader(dbPath);
  loader.loadAll()
    .then((stats) => {
      console.log('Historical data loading complete!');
      loader.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error loading historical data:', error);
      loader.close();
      process.exit(1);
    });
}

export default HistoricalDataLoader;