-- =====================================================
-- Historical Signals Schema (SQLite Version)
-- For storing historical event signals for replay
-- =====================================================

-- Historical Signals Table (for replay)
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
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (detected_at, source_id, target_country, event_type)
);

CREATE INDEX IF NOT EXISTS idx_historical_signals_date ON historical_signals(detected_at);
CREATE INDEX IF NOT EXISTS idx_historical_signals_country ON historical_signals(target_country);
CREATE INDEX IF NOT EXISTS idx_historical_signals_source ON historical_signals(source_id);