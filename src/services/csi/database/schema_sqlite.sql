-- Phase 5A Database Schema (SQLite Version)
-- CSI Enhancement: Event Lifecycle and Vector Routing

-- ============================================================================
-- TABLE: escalation_signals
-- Purpose: Store detected signals from high-frequency sources
-- ============================================================================
CREATE TABLE IF NOT EXISTS escalation_signals (
  signal_id TEXT PRIMARY KEY,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_id TEXT NOT NULL,
  source_url TEXT,
  raw_content TEXT,
  parsed_content TEXT,
  target_country TEXT NOT NULL,
  actor_country TEXT,
  vector_primary TEXT NOT NULL,
  vector_secondary TEXT,
  signal_type TEXT NOT NULL,
  severity_initial INTEGER,
  credibility_score REAL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'DETECTED',
  corroboration_count INTEGER DEFAULT 1,
  corroboration_sources TEXT,
  persistence_hours INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for escalation_signals
CREATE INDEX IF NOT EXISTS idx_escalation_signals_target_country ON escalation_signals(target_country);
CREATE INDEX IF NOT EXISTS idx_escalation_signals_vector ON escalation_signals(vector_primary);
CREATE INDEX IF NOT EXISTS idx_escalation_signals_status ON escalation_signals(status);
CREATE INDEX IF NOT EXISTS idx_escalation_signals_detected_at ON escalation_signals(detected_at);
CREATE INDEX IF NOT EXISTS idx_escalation_signals_source_id ON escalation_signals(source_id);

-- ============================================================================
-- TABLE: event_candidates
-- Purpose: Track event lifecycle from detection to resolution
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_candidates (
  event_id TEXT PRIMARY KEY,
  signal_ids TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'DETECTED',
  target_country TEXT NOT NULL,
  actor_country TEXT,
  vector_primary TEXT NOT NULL,
  vector_secondary TEXT,
  event_type TEXT NOT NULL,
  severity INTEGER,
  probability_weight REAL,
  detected_at TEXT NOT NULL,
  provisional_at TEXT,
  confirmed_at TEXT,
  resolved_at TEXT,
  confirmation_source_id TEXT,
  confirmation_url TEXT,
  baseline_drift_applied INTEGER DEFAULT 0,
  baseline_drift_amount REAL,
  event_csi_delta REAL,
  decay_schedule TEXT,
  audit_log TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for event_candidates
CREATE INDEX IF NOT EXISTS idx_event_candidates_lifecycle ON event_candidates(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_event_candidates_target_country ON event_candidates(target_country);
CREATE INDEX IF NOT EXISTS idx_event_candidates_vector ON event_candidates(vector_primary);
CREATE INDEX IF NOT EXISTS idx_event_candidates_detected_at ON event_candidates(detected_at);
CREATE INDEX IF NOT EXISTS idx_event_candidates_confirmed_at ON event_candidates(confirmed_at);

-- ============================================================================
-- TABLE: event_csi_delta_ledger
-- Purpose: Record confirmed event CSI impacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_csi_delta_ledger (
  ledger_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  country TEXT NOT NULL,
  vector TEXT NOT NULL,
  event_date TEXT NOT NULL,
  csi_delta REAL NOT NULL,
  prior_drift_netted REAL DEFAULT 0,
  net_csi_impact REAL NOT NULL,
  decay_half_life_days INTEGER DEFAULT 90,
  current_decay_factor REAL DEFAULT 1.0,
  audit_trail TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES event_candidates(event_id)
);

-- Indexes for event_csi_delta_ledger
CREATE INDEX IF NOT EXISTS idx_event_csi_delta_country_date ON event_csi_delta_ledger(country, event_date);
CREATE INDEX IF NOT EXISTS idx_event_csi_delta_vector ON event_csi_delta_ledger(vector);
CREATE INDEX IF NOT EXISTS idx_event_csi_delta_event_id ON event_csi_delta_ledger(event_id);

-- ============================================================================
-- TABLE: csi_time_series
-- Purpose: Store versioned CSI scores over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS csi_time_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,
  date TEXT NOT NULL,
  csi_version TEXT NOT NULL DEFAULT 'v2.0',
  structural_baseline REAL NOT NULL,
  escalation_drift REAL DEFAULT 0,
  event_csi_delta REAL DEFAULT 0,
  csi_total REAL NOT NULL,
  components TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (country, date, csi_version)
);

-- Indexes for csi_time_series
CREATE INDEX IF NOT EXISTS idx_csi_time_series_country_date ON csi_time_series(country, date);
CREATE INDEX IF NOT EXISTS idx_csi_time_series_version ON csi_time_series(csi_version);
CREATE INDEX IF NOT EXISTS idx_csi_time_series_date ON csi_time_series(date);

-- ============================================================================
-- TABLE: data_source_ingestion_log
-- Purpose: Track data source ingestion health and performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_source_ingestion_log (
  log_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  ingestion_start TEXT NOT NULL,
  ingestion_end TEXT,
  items_fetched INTEGER DEFAULT 0,
  items_parsed INTEGER DEFAULT 0,
  items_stored INTEGER DEFAULT 0,
  errors TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'RUNNING',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for data_source_ingestion_log
CREATE INDEX IF NOT EXISTS idx_ingestion_log_source_id ON data_source_ingestion_log(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_ingestion_start ON data_source_ingestion_log(ingestion_start);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_status ON data_source_ingestion_log(status);

-- ============================================================================
-- TABLE: state_transitions_audit
-- Purpose: Audit trail for all event state transitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS state_transitions_audit (
  audit_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  metadata TEXT DEFAULT '{}',
  transition_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES event_candidates(event_id)
);

-- Indexes for state_transitions_audit
CREATE INDEX IF NOT EXISTS idx_state_transitions_event_id ON state_transitions_audit(event_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_timestamp ON state_transitions_audit(transition_timestamp);

-- ============================================================================
-- TABLE: risk_vectors
-- Purpose: Vector definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS risk_vectors (
  vector_code TEXT PRIMARY KEY,
  vector_name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 50,
  active INTEGER DEFAULT 1
);

-- Insert vector definitions
INSERT OR IGNORE INTO risk_vectors (vector_code, vector_name, description, priority) VALUES
  ('SC1', 'Conflict & Military Action', 'Armed conflict, military operations, defense policy', 100),
  ('SC2', 'Sanctions & Export Controls', 'Economic sanctions, trade restrictions, export controls', 95),
  ('SC3', 'Trade Policy & Tariffs', 'Trade agreements, tariffs, customs, trade disputes', 90),
  ('SC4', 'Governance & Political Instability', 'Political risk, regime change, policy uncertainty', 85),
  ('SC5', 'Cyber & Technology Risk', 'Cyber attacks, data breaches, technology restrictions', 80),
  ('SC6', 'Social Unrest & Labor Disputes', 'Protests, strikes, civil unrest, labor actions', 75),
  ('SC7', 'Currency & Capital Controls', 'Currency restrictions, capital controls, forex policy', 70);

-- ============================================================================
-- TRIGGERS: Update timestamps automatically
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_escalation_signals_updated_at
  AFTER UPDATE ON escalation_signals
  FOR EACH ROW
BEGIN
  UPDATE escalation_signals SET updated_at = datetime('now') WHERE signal_id = NEW.signal_id;
END;

CREATE TRIGGER IF NOT EXISTS update_event_candidates_updated_at
  AFTER UPDATE ON event_candidates
  FOR EACH ROW
BEGIN
  UPDATE event_candidates SET updated_at = datetime('now') WHERE event_id = NEW.event_id;
END;