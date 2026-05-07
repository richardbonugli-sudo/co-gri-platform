-- Phase 1 CSI Enhancement - Database Schema
-- Migration 001: Create core signal tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
  signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id VARCHAR(50) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  
  -- Geographic Attribution
  countries VARCHAR(2)[] NOT NULL,
  regions VARCHAR(50)[],
  
  -- Risk Vector Attribution
  primary_vector VARCHAR(3) NOT NULL CHECK (primary_vector IN ('SC1', 'SC2', 'SC3', 'SC4', 'SC5', 'SC6', 'SC7')),
  secondary_vector VARCHAR(3) CHECK (secondary_vector IN ('SC1', 'SC2', 'SC3', 'SC4', 'SC5', 'SC6', 'SC7')),
  
  -- Content
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_text TEXT,
  
  -- Classification
  signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('threat', 'action', 'policy', 'conflict', 'economic', 'diplomatic')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  actors JSONB,
  
  -- Metadata
  language VARCHAR(10),
  source_credibility DECIMAL(3,2) CHECK (source_credibility >= 0 AND source_credibility <= 1),
  url TEXT,
  tags VARCHAR(50)[],
  
  -- Qualification Status
  is_qualified BOOLEAN DEFAULT FALSE,
  qualification_reason TEXT,
  qualified_at TIMESTAMP,
  
  -- Corroboration
  corroboration_count INTEGER DEFAULT 1,
  corroboration_score DECIMAL(3,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for signals table
CREATE INDEX idx_signals_countries_gin ON signals USING GIN(countries);
CREATE INDEX idx_signals_detected_at_desc ON signals (detected_at DESC);
CREATE INDEX idx_signals_primary_vector ON signals (primary_vector);
CREATE INDEX idx_signals_is_qualified ON signals (is_qualified) WHERE is_qualified = TRUE;
CREATE INDEX idx_signals_source_id ON signals (source_id);
CREATE INDEX idx_signals_country_vector_time ON signals (primary_vector, detected_at DESC);

-- Create signal_corroboration table
CREATE TABLE IF NOT EXISTS signal_corroboration (
  corroboration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_signal_id UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  corroborating_signal_id UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  
  -- Similarity Metrics
  geographic_similarity DECIMAL(3,2) CHECK (geographic_similarity >= 0 AND geographic_similarity <= 1),
  vector_similarity DECIMAL(3,2) CHECK (vector_similarity >= 0 AND vector_similarity <= 1),
  content_similarity DECIMAL(3,2) CHECK (content_similarity >= 0 AND content_similarity <= 1),
  temporal_proximity_hours INTEGER,
  
  -- Combined Score
  overall_similarity DECIMAL(3,2) CHECK (overall_similarity >= 0 AND overall_similarity <= 1),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(primary_signal_id, corroborating_signal_id),
  CHECK (primary_signal_id != corroborating_signal_id)
);

CREATE INDEX idx_corroboration_primary ON signal_corroboration (primary_signal_id);
CREATE INDEX idx_corroboration_corroborating ON signal_corroboration (corroborating_signal_id);

-- Create signal_persistence table
CREATE TABLE IF NOT EXISTS signal_persistence (
  persistence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_cluster_id UUID NOT NULL,
  
  -- Persistence Metrics
  first_detected TIMESTAMP NOT NULL,
  last_detected TIMESTAMP NOT NULL,
  duration_hours INTEGER,
  mention_count INTEGER,
  mentions_per_day DECIMAL(5,2),
  
  -- Persistence Score
  persistence_score DECIMAL(3,2) CHECK (persistence_score >= 0 AND persistence_score <= 1),
  is_persistent BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_persistence_cluster ON signal_persistence (signal_cluster_id);
CREATE INDEX idx_persistence_last_detected ON signal_persistence (last_detected DESC);

-- Create data_sources table
CREATE TABLE IF NOT EXISTS data_sources (
  source_id VARCHAR(50) PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('news_wire', 'event_database', 'monitor', 'osint')),
  
  -- Credibility
  credibility_weight DECIMAL(3,2) NOT NULL CHECK (credibility_weight >= 0 AND credibility_weight <= 1),
  
  -- API Configuration
  api_endpoint TEXT,
  auth_method VARCHAR(20) CHECK (auth_method IN ('api_key', 'oauth', 'basic')),
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_successful_fetch TIMESTAMP,
  last_error TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial data sources
INSERT INTO data_sources (source_id, source_name, source_type, credibility_weight, api_endpoint, auth_method, rate_limit_per_minute, rate_limit_per_day, is_active) VALUES
('reuters', 'Reuters News API', 'news_wire', 0.95, 'https://api.reuters.com/v2/news', 'oauth', 100, 10000, true),
('bloomberg', 'Bloomberg Terminal API', 'news_wire', 0.95, 'bloomberg-api://news', 'basic', 200, 20000, true),
('gdelt', 'GDELT Project', 'event_database', 0.85, 'https://api.gdeltproject.org/api/v2/doc/doc', 'api_key', 60, 100000, true),
('ap', 'Associated Press', 'news_wire', 0.95, 'https://api.ap.org/v2/content', 'api_key', 50, 5000, false),
('ft', 'Financial Times', 'news_wire', 0.90, 'https://api.ft.com/content/search/v1', 'api_key', 30, 3000, false),
('acled', 'ACLED', 'event_database', 0.85, 'https://api.acleddata.com/acled/read', 'api_key', 10, 1000, false);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persistence_updated_at BEFORE UPDATE ON signal_persistence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for qualified signals
CREATE OR REPLACE VIEW qualified_signals AS
SELECT 
  s.*,
  ds.source_name,
  ds.source_type,
  COUNT(sc.corroborating_signal_id) as corroboration_count_actual
FROM signals s
LEFT JOIN data_sources ds ON s.source_id = ds.source_id
LEFT JOIN signal_corroboration sc ON s.signal_id = sc.primary_signal_id
WHERE s.is_qualified = TRUE
GROUP BY s.signal_id, ds.source_name, ds.source_type;

-- Create view for signal statistics by country
CREATE OR REPLACE VIEW signal_stats_by_country AS
SELECT 
  unnest(countries) as country,
  COUNT(*) as total_signals,
  SUM(CASE WHEN is_qualified THEN 1 ELSE 0 END) as qualified_signals,
  AVG(source_credibility) as avg_credibility,
  MAX(detected_at) as last_signal_date
FROM signals
GROUP BY unnest(countries);

-- Create view for signal statistics by vector
CREATE OR REPLACE VIEW signal_stats_by_vector AS
SELECT 
  primary_vector,
  COUNT(*) as total_signals,
  SUM(CASE WHEN is_qualified THEN 1 ELSE 0 END) as qualified_signals,
  AVG(source_credibility) as avg_credibility,
  COUNT(DISTINCT source_id) as source_count
FROM signals
GROUP BY primary_vector;

COMMENT ON TABLE signals IS 'Core table storing all detected geopolitical signals';
COMMENT ON TABLE signal_corroboration IS 'Tracks corroboration relationships between signals';
COMMENT ON TABLE signal_persistence IS 'Tracks persistence metrics for signal clusters';
COMMENT ON TABLE data_sources IS 'Configuration and status of external data sources';