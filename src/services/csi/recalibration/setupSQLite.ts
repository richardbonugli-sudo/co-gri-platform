/**
 * SQLite Setup for Demo/Development
 * 
 * Sets up SQLite database as a fallback when PostgreSQL is not available.
 * This is for demonstration purposes only - production should use PostgreSQL.
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

class SQLiteSetup {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = './csi_platform.db') {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Create all required tables
   */
  async setupTables(): Promise<void> {
    console.log('Setting up SQLite database...\n');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Countries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT UNIQUE NOT NULL,
        country_name TEXT NOT NULL,
        region TEXT,
        income_level TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Structural baselines
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS structural_baselines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL,
        cut_date TEXT NOT NULL,
        version TEXT NOT NULL,
        components TEXT NOT NULL,
        baseline_csi REAL NOT NULL CHECK (baseline_csi >= 0 AND baseline_csi <= 100),
        locked INTEGER DEFAULT 0,
        locked_at TEXT,
        data_quality TEXT CHECK (data_quality IN ('high', 'medium', 'low')),
        sources TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (country, cut_date, version)
      )
    `);

    // CSI time series
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS csi_time_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL,
        date TEXT NOT NULL,
        csi_version TEXT NOT NULL,
        structural_baseline REAL NOT NULL,
        escalation_drift REAL DEFAULT 0,
        event_csi_delta REAL DEFAULT 0,
        csi_total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (country, date, csi_version)
      )
    `);

    // World Bank WGI
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS world_bank_wgi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        governance_score REAL CHECK (governance_score >= 0 AND governance_score <= 100),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (country_code, year)
      )
    `);

    // Democracy indices
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS democracy_indices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        freedom_house_score REAL CHECK (freedom_house_score >= 0 AND freedom_house_score <= 100),
        vdem_score REAL CHECK (vdem_score >= 0 AND vdem_score <= 100),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (country_code, year)
      )
    `);

    // Sanctions regimes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sanctions_regimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_country TEXT NOT NULL,
        sanctioning_entity TEXT NOT NULL,
        severity TEXT CHECK (severity IN ('comprehensive', 'sectoral', 'targeted')),
        effective_date TEXT NOT NULL,
        expiry_date TEXT,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conflict events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conflict_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        event_date TEXT NOT NULL,
        intensity INTEGER,
        event_type TEXT,
        source TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Historical signals
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS historical_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        detected_at TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_country TEXT NOT NULL,
        actor_country TEXT,
        event_type TEXT NOT NULL,
        severity INTEGER CHECK (severity >= 0 AND severity <= 100),
        goldstein_scale REAL,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (detected_at, source_id, target_country, event_type)
      )
    `);

    // Event candidates
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS event_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_country TEXT NOT NULL,
        vector_primary TEXT NOT NULL,
        lifecycle_state TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        confirmed_at TEXT,
        severity INTEGER,
        probability_score REAL,
        baseline_drift_applied INTEGER DEFAULT 0,
        baseline_drift_amount REAL DEFAULT 0,
        version TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CSI versions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS csi_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        cut_date TEXT NOT NULL,
        locked_at TEXT,
        description TEXT,
        methodology TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample countries
    const countries = [
      ['USA', 'United States', 'North America', 'High'],
      ['CHN', 'China', 'East Asia', 'Upper Middle'],
      ['JPN', 'Japan', 'East Asia', 'High'],
      ['DEU', 'Germany', 'Europe', 'High'],
      ['GBR', 'United Kingdom', 'Europe', 'High'],
      ['FRA', 'France', 'Europe', 'High'],
      ['IND', 'India', 'South Asia', 'Lower Middle'],
      ['ITA', 'Italy', 'Europe', 'High'],
      ['BRA', 'Brazil', 'South America', 'Upper Middle'],
      ['CAN', 'Canada', 'North America', 'High'],
      ['RUS', 'Russia', 'Europe/Asia', 'Upper Middle'],
      ['KOR', 'South Korea', 'East Asia', 'High'],
      ['AUS', 'Australia', 'Oceania', 'High'],
      ['ESP', 'Spain', 'Europe', 'High'],
      ['MEX', 'Mexico', 'North America', 'Upper Middle'],
      ['IDN', 'Indonesia', 'Southeast Asia', 'Lower Middle'],
      ['NLD', 'Netherlands', 'Europe', 'High'],
      ['SAU', 'Saudi Arabia', 'Middle East', 'High'],
      ['TUR', 'Turkey', 'Europe/Asia', 'Upper Middle'],
      ['CHE', 'Switzerland', 'Europe', 'High']
    ];

    const insertCountry = this.db.prepare(`
      INSERT OR IGNORE INTO countries (country_code, country_name, region, income_level)
      VALUES (?, ?, ?, ?)
    `);

    for (const country of countries) {
      insertCountry.run(country);
    }

    console.log('✅ SQLite database setup complete\n');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database instance
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

// CLI execution
if (require.main === module) {
  const setup = new SQLiteSetup();
  setup.setupTables()
    .then(() => {
      console.log('Database ready!');
      setup.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default SQLiteSetup;