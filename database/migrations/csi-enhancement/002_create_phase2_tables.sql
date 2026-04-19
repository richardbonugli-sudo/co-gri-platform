-- Phase 2 CSI Enhancement - Database Schema
-- Migration 002: Create enhanced CSI tables

-- Enhanced CSI scores table
CREATE TABLE IF NOT EXISTS enhanced_csi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country VARCHAR(2) NOT NULL,
  vector VARCHAR(3) NOT NULL CHECK (vector IN ('SC1', 'SC2', 'SC3', 'SC4', 'SC5', 'SC6', 'SC7')),
  
  -- Scores
  legacy_csi DECIMAL(5,2) NOT NULL CHECK (legacy_csi >= 0 AND legacy_csi <= 100),
  baseline_drift DECIMAL(5,2) NOT NULL CHECK (baseline_drift >= -10 AND baseline_drift <= 10),
  enhanced_csi DECIMAL(5,2) NOT NULL CHECK (enhanced_csi >= 0 AND enhanced_csi <= 100),
  
  -- Metadata
  signal_count INTEGER NOT NULL DEFAULT 0,
  top_signals UUID[],
  explanation TEXT,
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(country, vector, calculated_at)
);

-- Indexes for enhanced_csi
CREATE INDEX idx_enhanced_csi_country ON enhanced_csi (country);
CREATE INDEX idx_enhanced_csi_vector ON enhanced_csi (vector);
CREATE INDEX idx_enhanced_csi_calculated_at ON enhanced_csi (calculated_at DESC);
CREATE INDEX idx_enhanced_csi_country_vector ON enhanced_csi (country, vector);
CREATE INDEX idx_enhanced_csi_drift ON enhanced_csi (ABS(baseline_drift) DESC);

-- CSI calculation log table
CREATE TABLE IF NOT EXISTS csi_calculation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_run_id UUID NOT NULL,
  
  -- Statistics
  countries_processed INTEGER DEFAULT 0,
  vectors_processed INTEGER DEFAULT 0,
  total_calculations INTEGER DEFAULT 0,
  avg_drift DECIMAL(5,2) DEFAULT 0,
  max_drift DECIMAL(5,2) DEFAULT 0,
  min_drift DECIMAL(5,2) DEFAULT 0,
  
  -- Performance
  duration_ms INTEGER DEFAULT 0,
  signals_analyzed INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for csi_calculation_log
CREATE INDEX idx_calculation_log_run_id ON csi_calculation_log (calculation_run_id);
CREATE INDEX idx_calculation_log_started_at ON csi_calculation_log (started_at DESC);
CREATE INDEX idx_calculation_log_status ON csi_calculation_log (status);

-- Signal contributions table (for explainability)
CREATE TABLE IF NOT EXISTS signal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enhanced_csi_id UUID NOT NULL REFERENCES enhanced_csi(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  
  -- Contribution metrics
  impact_score DECIMAL(5,2) NOT NULL,
  decay_factor DECIMAL(5,4) NOT NULL CHECK (decay_factor >= 0 AND decay_factor <= 1),
  contribution DECIMAL(5,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(enhanced_csi_id, signal_id)
);

-- Indexes for signal_contributions
CREATE INDEX idx_contributions_csi ON signal_contributions (enhanced_csi_id);
CREATE INDEX idx_contributions_signal ON signal_contributions (signal_id);
CREATE INDEX idx_contributions_contribution ON signal_contributions (ABS(contribution) DESC);

-- View: Latest enhanced CSI scores
CREATE OR REPLACE VIEW latest_enhanced_csi AS
SELECT DISTINCT ON (country, vector)
  id,
  country,
  vector,
  legacy_csi,
  baseline_drift,
  enhanced_csi,
  signal_count,
  top_signals,
  explanation,
  calculated_at,
  valid_until
FROM enhanced_csi
ORDER BY country, vector, calculated_at DESC;

-- View: CSI comparison (legacy vs enhanced)
CREATE OR REPLACE VIEW csi_comparison AS
SELECT
  country,
  vector,
  legacy_csi,
  enhanced_csi,
  baseline_drift,
  (enhanced_csi - legacy_csi) as difference,
  CASE
    WHEN ABS(enhanced_csi - legacy_csi) > 5 THEN 'significant'
    WHEN ABS(enhanced_csi - legacy_csi) > 2 THEN 'moderate'
    ELSE 'minor'
  END as divergence_level,
  signal_count,
  calculated_at
FROM latest_enhanced_csi;

-- View: Top drift countries
CREATE OR REPLACE VIEW top_drift_countries AS
SELECT
  country,
  vector,
  baseline_drift,
  enhanced_csi,
  signal_count,
  calculated_at
FROM latest_enhanced_csi
ORDER BY ABS(baseline_drift) DESC
LIMIT 50;

-- View: Enhanced CSI statistics
CREATE OR REPLACE VIEW enhanced_csi_stats AS
SELECT
  COUNT(DISTINCT country) as total_countries,
  COUNT(DISTINCT vector) as total_vectors,
  COUNT(*) as total_scores,
  AVG(baseline_drift) as avg_drift,
  MAX(baseline_drift) as max_drift,
  MIN(baseline_drift) as min_drift,
  AVG(signal_count) as avg_signal_count,
  MAX(calculated_at) as last_calculation
FROM latest_enhanced_csi;

-- View: Drift distribution by vector
CREATE OR REPLACE VIEW drift_by_vector AS
SELECT
  vector,
  COUNT(*) as country_count,
  AVG(baseline_drift) as avg_drift,
  MAX(baseline_drift) as max_drift,
  MIN(baseline_drift) as min_drift,
  STDDEV(baseline_drift) as drift_stddev,
  AVG(signal_count) as avg_signals
FROM latest_enhanced_csi
GROUP BY vector
ORDER BY vector;

-- View: Drift distribution by country
CREATE OR REPLACE VIEW drift_by_country AS
SELECT
  country,
  COUNT(*) as vector_count,
  AVG(baseline_drift) as avg_drift,
  MAX(baseline_drift) as max_drift,
  MIN(baseline_drift) as min_drift,
  SUM(signal_count) as total_signals
FROM latest_enhanced_csi
GROUP BY country
ORDER BY ABS(AVG(baseline_drift)) DESC;

-- View: Recent calculation runs
CREATE OR REPLACE VIEW recent_calculations AS
SELECT
  calculation_run_id,
  status,
  countries_processed,
  vectors_processed,
  total_calculations,
  avg_drift,
  duration_ms,
  signals_analyzed,
  started_at,
  completed_at
FROM csi_calculation_log
ORDER BY started_at DESC
LIMIT 20;

-- Function: Get enhanced CSI with contributions
CREATE OR REPLACE FUNCTION get_enhanced_csi_with_contributions(
  p_country VARCHAR(2),
  p_vector VARCHAR(3)
)
RETURNS TABLE (
  country VARCHAR(2),
  vector VARCHAR(3),
  legacy_csi DECIMAL(5,2),
  baseline_drift DECIMAL(5,2),
  enhanced_csi DECIMAL(5,2),
  signal_id UUID,
  signal_headline TEXT,
  impact_score DECIMAL(5,2),
  decay_factor DECIMAL(5,4),
  contribution DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.country,
    ec.vector,
    ec.legacy_csi,
    ec.baseline_drift,
    ec.enhanced_csi,
    sc.signal_id,
    s.headline as signal_headline,
    sc.impact_score,
    sc.decay_factor,
    sc.contribution
  FROM latest_enhanced_csi ec
  LEFT JOIN signal_contributions sc ON ec.id = sc.enhanced_csi_id
  LEFT JOIN signals s ON sc.signal_id = s.signal_id
  WHERE ec.country = p_country AND ec.vector = p_vector
  ORDER BY ABS(sc.contribution) DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE enhanced_csi IS 'Enhanced CSI scores with baseline drift from qualified signals';
COMMENT ON TABLE csi_calculation_log IS 'Log of CSI calculation runs with statistics and performance metrics';
COMMENT ON TABLE signal_contributions IS 'Individual signal contributions to enhanced CSI scores for explainability';

COMMENT ON VIEW latest_enhanced_csi IS 'Most recent enhanced CSI score for each country-vector pair';
COMMENT ON VIEW csi_comparison IS 'Comparison between legacy and enhanced CSI scores';
COMMENT ON VIEW top_drift_countries IS 'Countries with largest baseline drift (positive or negative)';
COMMENT ON VIEW enhanced_csi_stats IS 'Overall statistics for enhanced CSI system';
COMMENT ON VIEW drift_by_vector IS 'Drift statistics grouped by risk vector';
COMMENT ON VIEW drift_by_country IS 'Drift statistics grouped by country';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO csi_readonly;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO csi_admin;