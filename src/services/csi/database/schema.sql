-- Phase 5A Database Schema
-- CSI Enhancement: Event Lifecycle and Vector Routing

-- ============================================================================
-- TABLE: escalation_signals
-- Purpose: Store detected signals from high-frequency sources
-- ============================================================================
CREATE TABLE IF NOT EXISTS escalation_signals (
  signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source_id VARCHAR(100) NOT NULL,
  source_url TEXT,
  raw_content TEXT,
  parsed_content JSONB,
  target_country VARCHAR(3) NOT NULL,
  actor_country VARCHAR(3),
  vector_primary VARCHAR(10) NOT NULL,
  vector_secondary VARCHAR(10),
  signal_type VARCHAR(50) NOT NULL,
  severity_initial INTEGER,
  credibility_score DECIMAL(3,2) DEFAULT 0.5,
  status VARCHAR(20) NOT NULL DEFAULT 'DETECTED',
  corroboration_count INTEGER DEFAULT 1,
  corroboration_sources TEXT[],
  persistence_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_ids UUID[] NOT NULL,
  lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'DETECTED',
  target_country VARCHAR(3) NOT NULL,
  actor_country VARCHAR(3),
  vector_primary VARCHAR(10) NOT NULL,
  vector_secondary VARCHAR(10),
  event_type VARCHAR(50) NOT NULL,
  severity INTEGER,
  probability_weight DECIMAL(3,2),
  detected_at TIMESTAMP NOT NULL,
  provisional_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  confirmation_source_id VARCHAR(100),
  confirmation_url TEXT,
  baseline_drift_applied BOOLEAN DEFAULT FALSE,
  baseline_drift_amount DECIMAL(5,2),
  event_csi_delta DECIMAL(5,2),
  decay_schedule JSONB,
  audit_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event_candidates(event_id),
  country VARCHAR(3) NOT NULL,
  vector VARCHAR(10) NOT NULL,
  event_date DATE NOT NULL,
  csi_delta DECIMAL(5,2) NOT NULL,
  prior_drift_netted DECIMAL(5,2) DEFAULT 0,
  net_csi_impact DECIMAL(5,2) NOT NULL,
  decay_half_life_days INTEGER DEFAULT 90,
  current_decay_factor DECIMAL(3,2) DEFAULT 1.0,
  audit_trail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
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
  id SERIAL PRIMARY KEY,
  country VARCHAR(3) NOT NULL,
  date DATE NOT NULL,
  csi_version VARCHAR(10) NOT NULL DEFAULT 'v2.0',
  structural_baseline DECIMAL(5,2) NOT NULL,
  escalation_drift DECIMAL(5,2) DEFAULT 0,
  event_csi_delta DECIMAL(5,2) DEFAULT 0,
  csi_total DECIMAL(5,2) NOT NULL,
  components JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
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
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR(100) NOT NULL,
  ingestion_start TIMESTAMP NOT NULL,
  ingestion_end TIMESTAMP,
  items_fetched INTEGER DEFAULT 0,
  items_parsed INTEGER DEFAULT 0,
  items_stored INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
  created_at TIMESTAMP DEFAULT NOW()
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
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event_candidates(event_id),
  from_state VARCHAR(20) NOT NULL,
  to_state VARCHAR(20) NOT NULL,
  trigger VARCHAR(50) NOT NULL,
  actor VARCHAR(100) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  transition_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for state_transitions_audit
CREATE INDEX IF NOT EXISTS idx_state_transitions_event_id ON state_transitions_audit(event_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_timestamp ON state_transitions_audit(transition_timestamp);

-- ============================================================================
-- FUNCTIONS: Update timestamps automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_escalation_signals_updated_at
  BEFORE UPDATE ON escalation_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_candidates_updated_at
  BEFORE UPDATE ON event_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Convenience views for common queries
-- ============================================================================

-- Active events view
CREATE OR REPLACE VIEW active_events AS
SELECT 
  ec.*,
  COUNT(DISTINCT unnest(ec.signal_ids)) as signal_count,
  EXTRACT(EPOCH FROM (NOW() - ec.detected_at))/3600 as hours_since_detection
FROM event_candidates ec
WHERE ec.lifecycle_state IN ('DETECTED', 'PROVISIONAL', 'CONFIRMED')
GROUP BY ec.event_id;

-- Recent CSI movements view
CREATE OR REPLACE VIEW recent_csi_movements AS
SELECT 
  country,
  date,
  csi_total,
  escalation_drift,
  event_csi_delta,
  (csi_total - LAG(csi_total) OVER (PARTITION BY country ORDER BY date)) as daily_change
FROM csi_time_series
WHERE csi_version = 'v2.0'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY country, date DESC;

-- Source health dashboard view
CREATE OR REPLACE VIEW source_health_dashboard AS
SELECT 
  source_id,
  COUNT(*) as total_ingestions,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_ingestions,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_ingestions,
  AVG(EXTRACT(EPOCH FROM (ingestion_end - ingestion_start))) as avg_duration_seconds,
  MAX(ingestion_start) as last_ingestion,
  SUM(items_stored) as total_items_stored
FROM data_source_ingestion_log
WHERE ingestion_start >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY source_id
ORDER BY failed_ingestions DESC, last_ingestion DESC;

-- ============================================================================
-- COMMENTS: Table and column documentation
-- ============================================================================
COMMENT ON TABLE escalation_signals IS 'Stores detected signals from high-frequency data sources';
COMMENT ON TABLE event_candidates IS 'Tracks event lifecycle from detection through resolution';
COMMENT ON TABLE event_csi_delta_ledger IS 'Records confirmed event CSI impacts with audit trail';
COMMENT ON TABLE csi_time_series IS 'Versioned CSI scores over time for all countries';
COMMENT ON TABLE data_source_ingestion_log IS 'Tracks data source ingestion health and performance';
COMMENT ON TABLE state_transitions_audit IS 'Audit trail for all event state transitions';

-- ============================================================================
-- INITIAL DATA: Vector definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS risk_vectors (
  vector_code VARCHAR(10) PRIMARY KEY,
  vector_name VARCHAR(100) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT TRUE
);

INSERT INTO risk_vectors (vector_code, vector_name, description, priority) VALUES
  ('SC1', 'Conflict & Military Action', 'Armed conflict, military operations, defense policy', 100),
  ('SC2', 'Sanctions & Export Controls', 'Economic sanctions, trade restrictions, export controls', 95),
  ('SC3', 'Trade Policy & Tariffs', 'Trade agreements, tariffs, customs, trade disputes', 90),
  ('SC4', 'Governance & Political Instability', 'Political risk, regime change, policy uncertainty', 85),
  ('SC5', 'Cyber & Technology Risk', 'Cyber attacks, data breaches, technology restrictions', 80),
  ('SC6', 'Social Unrest & Labor Disputes', 'Protests, strikes, civil unrest, labor actions', 75),
  ('SC7', 'Currency & Capital Controls', 'Currency restrictions, capital controls, forex policy', 70)
ON CONFLICT (vector_code) DO NOTHING;