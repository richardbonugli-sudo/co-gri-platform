-- =====================================================
-- Structural Baselines Schema
-- For CSI v2.0 Recalibration (Phase 5C)
-- =====================================================

-- Structural Baselines Table
-- Stores the frozen baseline CSI for all countries as of cut date
CREATE TABLE IF NOT EXISTS structural_baselines (
  id SERIAL PRIMARY KEY,
  country VARCHAR(3) NOT NULL,
  cut_date DATE NOT NULL,
  version VARCHAR(10) NOT NULL,
  components JSONB NOT NULL,
  baseline_csi DECIMAL(5,2) NOT NULL CHECK (baseline_csi >= 0 AND baseline_csi <= 100),
  locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMP,
  data_quality VARCHAR(10) CHECK (data_quality IN ('high', 'medium', 'low')),
  sources JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country, cut_date, version),
  CHECK (locked = false OR locked_at IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_structural_baselines_country ON structural_baselines(country);
CREATE INDEX IF NOT EXISTS idx_structural_baselines_version ON structural_baselines(version);
CREATE INDEX IF NOT EXISTS idx_structural_baselines_locked ON structural_baselines(locked);
CREATE INDEX IF NOT EXISTS idx_structural_baselines_cut_date ON structural_baselines(cut_date);

-- CSI Time Series Table
-- Stores daily CSI values with decomposition
CREATE TABLE IF NOT EXISTS csi_time_series (
  id SERIAL PRIMARY KEY,
  country VARCHAR(3) NOT NULL,
  date DATE NOT NULL,
  csi_version VARCHAR(10) NOT NULL,
  structural_baseline DECIMAL(5,2) NOT NULL,
  escalation_drift DECIMAL(5,2) DEFAULT 0,
  event_csi_delta DECIMAL(5,2) DEFAULT 0,
  csi_total DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country, date, csi_version)
);

CREATE INDEX IF NOT EXISTS idx_csi_time_series_country ON csi_time_series(country);
CREATE INDEX IF NOT EXISTS idx_csi_time_series_date ON csi_time_series(date);
CREATE INDEX IF NOT EXISTS idx_csi_time_series_version ON csi_time_series(csi_version);
CREATE INDEX IF NOT EXISTS idx_csi_time_series_country_date ON csi_time_series(country, date);

-- CSI Versions Metadata
-- Tracks different CSI versions and their characteristics
CREATE TABLE IF NOT EXISTS csi_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) UNIQUE NOT NULL,
  cut_date DATE NOT NULL,
  locked_at TIMESTAMP,
  description TEXT,
  methodology TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Source Data Tables (for baseline calculation)

-- World Bank Worldwide Governance Indicators
CREATE TABLE IF NOT EXISTS world_bank_wgi (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  year INTEGER NOT NULL,
  governance_score DECIMAL(5,2) CHECK (governance_score >= 0 AND governance_score <= 100),
  voice_accountability DECIMAL(5,2),
  political_stability DECIMAL(5,2),
  government_effectiveness DECIMAL(5,2),
  regulatory_quality DECIMAL(5,2),
  rule_of_law DECIMAL(5,2),
  control_corruption DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country_code, year)
);

-- World Justice Project Rule of Law Index
CREATE TABLE IF NOT EXISTS wjp_rule_of_law (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  year INTEGER NOT NULL,
  rule_of_law_score DECIMAL(5,2) CHECK (rule_of_law_score >= 0 AND rule_of_law_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country_code, year)
);

-- Democracy Indices (Freedom House + V-Dem)
CREATE TABLE IF NOT EXISTS democracy_indices (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  year INTEGER NOT NULL,
  freedom_house_score DECIMAL(5,2) CHECK (freedom_house_score >= 0 AND freedom_house_score <= 100),
  vdem_score DECIMAL(5,2) CHECK (vdem_score >= 0 AND vdem_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country_code, year)
);

-- Sanctions Regimes
CREATE TABLE IF NOT EXISTS sanctions_regimes (
  id SERIAL PRIMARY KEY,
  target_country VARCHAR(3) NOT NULL,
  sanctioning_entity VARCHAR(50) NOT NULL, -- 'OFAC', 'EU', 'UN', etc.
  severity VARCHAR(20) CHECK (severity IN ('comprehensive', 'sectoral', 'targeted')),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_regimes_country ON sanctions_regimes(target_country);
CREATE INDEX IF NOT EXISTS idx_sanctions_regimes_dates ON sanctions_regimes(effective_date, expiry_date);

-- IMF AREAER (Capital Controls)
CREATE TABLE IF NOT EXISTS imf_areaer (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  year INTEGER NOT NULL,
  capital_controls_index DECIMAL(5,2) CHECK (capital_controls_index >= 0 AND capital_controls_index <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country_code, year)
);

-- Conflict Events (UCDP, ACLED)
CREATE TABLE IF NOT EXISTS conflict_events (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  event_date DATE NOT NULL,
  intensity INTEGER, -- Deaths/casualties
  event_type VARCHAR(50),
  source VARCHAR(20), -- 'UCDP', 'ACLED'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflict_events_country ON conflict_events(country_code);
CREATE INDEX IF NOT EXISTS idx_conflict_events_date ON conflict_events(event_date);

-- Freedom on the Net (Cyber Sovereignty)
CREATE TABLE IF NOT EXISTS freedom_on_the_net (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  year INTEGER NOT NULL,
  internet_freedom_score DECIMAL(5,2) CHECK (internet_freedom_score >= 0 AND internet_freedom_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country_code, year)
);

-- Countries Reference Table
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) UNIQUE NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  income_level VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample countries if table is empty
INSERT INTO countries (country_code, country_name, region, income_level, active)
SELECT * FROM (VALUES
  ('USA', 'United States', 'North America', 'High', true),
  ('CHN', 'China', 'East Asia', 'Upper Middle', true),
  ('JPN', 'Japan', 'East Asia', 'High', true),
  ('DEU', 'Germany', 'Europe', 'High', true),
  ('GBR', 'United Kingdom', 'Europe', 'High', true),
  ('FRA', 'France', 'Europe', 'High', true),
  ('IND', 'India', 'South Asia', 'Lower Middle', true),
  ('ITA', 'Italy', 'Europe', 'High', true),
  ('BRA', 'Brazil', 'South America', 'Upper Middle', true),
  ('CAN', 'Canada', 'North America', 'High', true),
  ('RUS', 'Russia', 'Europe/Asia', 'Upper Middle', true),
  ('KOR', 'South Korea', 'East Asia', 'High', true),
  ('AUS', 'Australia', 'Oceania', 'High', true),
  ('ESP', 'Spain', 'Europe', 'High', true),
  ('MEX', 'Mexico', 'North America', 'Upper Middle', true),
  ('IDN', 'Indonesia', 'Southeast Asia', 'Lower Middle', true),
  ('NLD', 'Netherlands', 'Europe', 'High', true),
  ('SAU', 'Saudi Arabia', 'Middle East', 'High', true),
  ('TUR', 'Turkey', 'Europe/Asia', 'Upper Middle', true),
  ('CHE', 'Switzerland', 'Europe', 'High', true)
) AS v(country_code, country_name, region, income_level, active)
WHERE NOT EXISTS (SELECT 1 FROM countries LIMIT 1);

-- Views for analysis

-- Latest Baseline by Country
CREATE OR REPLACE VIEW latest_baselines AS
SELECT 
  country,
  cut_date,
  version,
  baseline_csi,
  components,
  locked,
  data_quality
FROM structural_baselines
WHERE (country, cut_date, version) IN (
  SELECT country, MAX(cut_date), version
  FROM structural_baselines
  GROUP BY country, version
);

-- CSI Decomposition View
CREATE OR REPLACE VIEW csi_decomposition AS
SELECT 
  country,
  date,
  csi_version,
  structural_baseline,
  escalation_drift,
  event_csi_delta,
  csi_total,
  ROUND((escalation_drift / NULLIF(csi_total, 0)) * 100, 2) as drift_pct,
  ROUND((event_csi_delta / NULLIF(csi_total, 0)) * 100, 2) as event_pct
FROM csi_time_series
WHERE csi_total > 0;

-- Comments
COMMENT ON TABLE structural_baselines IS 'Frozen baseline CSI values for all countries as of cut date';
COMMENT ON TABLE csi_time_series IS 'Daily CSI time series with decomposition into baseline, drift, and events';
COMMENT ON TABLE csi_versions IS 'Metadata for different CSI calculation versions';
COMMENT ON COLUMN structural_baselines.components IS 'JSON object containing all 7 component scores';
COMMENT ON COLUMN structural_baselines.locked IS 'When true, baseline cannot be modified';
COMMENT ON COLUMN csi_time_series.escalation_drift IS 'Cumulative drift from provisional events';
COMMENT ON COLUMN csi_time_series.event_csi_delta IS 'Cumulative impact from confirmed events';