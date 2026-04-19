-- Lock CSI v2.0 Version
-- SQLite version

-- Create version metadata table if not exists
CREATE TABLE IF NOT EXISTS csi_versions (
  version TEXT PRIMARY KEY,
  cut_date TEXT NOT NULL,
  locked_at TEXT,
  description TEXT,
  methodology TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert or update CSI v2.0 version metadata
INSERT OR REPLACE INTO csi_versions (version, cut_date, locked_at, description, methodology)
VALUES (
  'v2.0',
  '2024-01-01',
  datetime('now'),
  'Expectation-weighted risk intelligence platform',
  'Dynamic forward-looking CSI with event lifecycle management, baseline drift, and authoritative confirmation'
);

-- Add locked flag to structural_baselines if column doesn't exist
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we'll check first
-- This will be handled by the validation script

-- Lock all structural baselines for v2.0 (if table exists)
UPDATE structural_baselines
SET locked = 1, locked_at = datetime('now')
WHERE version = 'v2.0' AND (locked = 0 OR locked IS NULL);

-- Create archive tables for v2.0 data (if source tables exist)
CREATE TABLE IF NOT EXISTS escalation_signals_v2_0 AS 
SELECT * FROM escalation_signals WHERE version = 'v2.0';

CREATE TABLE IF NOT EXISTS event_candidates_v2_0 AS 
SELECT * FROM event_candidates WHERE version = 'v2.0';

CREATE TABLE IF NOT EXISTS event_csi_delta_ledger_v2_0 AS 
SELECT * FROM event_csi_delta_ledger WHERE version = 'v2.0';

CREATE TABLE IF NOT EXISTS csi_time_series_v2_0 AS 
SELECT * FROM csi_time_series WHERE csi_version = 'v2.0';

-- Verify lock status
SELECT 
  'CSI v2.0 Lock Status:' as info,
  version,
  locked_at,
  description
FROM csi_versions
WHERE version = 'v2.0';