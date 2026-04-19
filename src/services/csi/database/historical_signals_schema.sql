-- =====================================================
-- Historical Signals Schema
-- For storing historical event signals for replay
-- =====================================================

-- Historical Signals Table (for replay)
CREATE TABLE IF NOT EXISTS historical_signals (
  id SERIAL PRIMARY KEY,
  detected_at TIMESTAMP NOT NULL,
  source_id VARCHAR(50) NOT NULL,
  target_country VARCHAR(3) NOT NULL,
  actor_country VARCHAR(3),
  event_type VARCHAR(100) NOT NULL,
  severity INTEGER CHECK (severity >= 0 AND severity <= 100),
  goldstein_scale DECIMAL(4,2),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (detected_at, source_id, target_country, event_type)
);

CREATE INDEX IF NOT EXISTS idx_historical_signals_date ON historical_signals(detected_at);
CREATE INDEX IF NOT EXISTS idx_historical_signals_country ON historical_signals(target_country);
CREATE INDEX IF NOT EXISTS idx_historical_signals_source ON historical_signals(source_id);

COMMENT ON TABLE historical_signals IS 'Historical event signals from GDELT and other sources for CSI recalibration replay';