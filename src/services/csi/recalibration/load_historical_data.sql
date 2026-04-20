-- Load Historical Data for CSI Recalibration
-- SQLite version

-- Create additional tables for historical data sources
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

-- Load World Bank WGI data
INSERT OR REPLACE INTO world_bank_wgi (country_code, year, governance_score) VALUES
  ('USA', 2023, 85),
  ('CHN', 2023, 45),
  ('RUS', 2023, 25),
  ('DEU', 2023, 92),
  ('GBR', 2023, 90),
  ('FRA', 2023, 88),
  ('JPN', 2023, 87),
  ('IND', 2023, 55),
  ('BRA', 2023, 52),
  ('CAN', 2023, 91),
  ('KOR', 2023, 82),
  ('AUS', 2023, 89),
  ('ESP', 2023, 80),
  ('MEX', 2023, 48),
  ('IDN', 2023, 50),
  ('NLD', 2023, 93),
  ('SAU', 2023, 42),
  ('TUR', 2023, 38),
  ('CHE', 2023, 94),
  ('ITA', 2023, 75);

-- Load democracy indices
INSERT OR REPLACE INTO democracy_indices (country_code, year, freedom_house_score, vdem_score) VALUES
  ('USA', 2023, 83, 78),
  ('CHN', 2023, 9, 12),
  ('RUS', 2023, 19, 22),
  ('DEU', 2023, 94, 92),
  ('GBR', 2023, 93, 90),
  ('FRA', 2023, 90, 88),
  ('JPN', 2023, 96, 89),
  ('IND', 2023, 66, 58),
  ('BRA', 2023, 73, 70),
  ('CAN', 2023, 98, 92),
  ('KOR', 2023, 83, 80),
  ('AUS', 2023, 95, 91),
  ('ESP', 2023, 90, 85),
  ('MEX', 2023, 60, 55),
  ('IDN', 2023, 59, 54),
  ('NLD', 2023, 99, 93),
  ('SAU', 2023, 7, 10),
  ('TUR', 2023, 32, 35),
  ('CHE', 2023, 96, 94),
  ('ITA', 2023, 90, 84);

-- Load sanctions data
INSERT OR IGNORE INTO sanctions_regimes (target_country, sanctioning_entity, severity, effective_date, description) VALUES
  ('RUS', 'US', 'comprehensive', '2022-02-24', 'Comprehensive sanctions following Ukraine invasion'),
  ('RUS', 'EU', 'comprehensive', '2022-02-25', 'EU sanctions package'),
  ('IRN', 'US', 'sectoral', '2018-05-08', 'Sectoral sanctions on energy and finance'),
  ('PRK', 'UN', 'comprehensive', '2006-10-14', 'UN Security Council sanctions'),
  ('VEN', 'US', 'sectoral', '2019-01-28', 'Oil sector sanctions'),
  ('SYR', 'US', 'sectoral', '2011-08-18', 'Sanctions on government officials'),
  ('CUB', 'US', 'comprehensive', '1962-02-07', 'Long-standing embargo');

-- Load conflict history
INSERT OR IGNORE INTO conflict_events (country_code, event_date, intensity, event_type, source) VALUES
  ('UKR', '2024-01-15', 850, 'armed_conflict', 'UCDP'),
  ('UKR', '2024-02-20', 920, 'armed_conflict', 'UCDP'),
  ('ISR', '2024-10-07', 1200, 'armed_conflict', 'ACLED'),
  ('SYR', '2024-03-20', 430, 'armed_conflict', 'UCDP'),
  ('YEM', '2024-01-10', 320, 'armed_conflict', 'ACLED'),
  ('AFG', '2024-05-15', 280, 'armed_conflict', 'UCDP'),
  ('SDN', '2024-04-12', 650, 'armed_conflict', 'ACLED'),
  ('MMR', '2024-06-08', 180, 'armed_conflict', 'UCDP');

-- Load GDELT historical signals
INSERT OR IGNORE INTO historical_signals (
  detected_at, source_id, target_country, actor_country, 
  event_type, severity, goldstein_scale, title, description, url
) VALUES
  ('2024-01-15T10:30:00Z', 'gdelt', 'CHN', 'USA', 'trade_restriction', 65, -5.0, 'US considers new export controls on AI chips to China', 'Export control announcement', 'https://example.com/news1'),
  ('2024-03-15T14:20:00Z', 'gdelt', 'CHN', 'USA', 'tariff_announcement', 75, -6.5, 'Biden announces 25% tariffs on Chinese EVs', 'Tariff announcement', 'https://example.com/news2'),
  ('2024-06-20T09:15:00Z', 'gdelt', 'RUS', 'EU', 'sanctions', 70, -7.0, 'EU announces 14th sanctions package on Russia', 'Sanctions announcement', 'https://example.com/news3'),
  ('2024-10-07T06:00:00Z', 'gdelt', 'ISR', 'PSE', 'military_action', 95, -10.0, 'Major escalation in Gaza conflict', 'Military escalation', 'https://example.com/news4'),
  ('2024-02-14T11:45:00Z', 'gdelt', 'UKR', 'RUS', 'military_action', 85, -8.5, 'Ukraine conflict intensifies', 'Conflict intensification', 'https://example.com/news5'),
  ('2024-04-13T15:30:00Z', 'gdelt', 'IRN', 'ISR', 'military_action', 80, -8.0, 'Iran-Israel tensions escalate', 'Military tensions', 'https://example.com/news6'),
  ('2024-07-19T08:00:00Z', 'gdelt', 'USA', NULL, 'cyber_incident', 60, -4.0, 'CrowdStrike outage causes global disruption', 'Cyber incident', 'https://example.com/news7'),
  ('2024-05-10T12:00:00Z', 'gdelt', 'CHN', 'USA', 'trade_restriction', 68, -5.5, 'China retaliates with rare earth export controls', 'Export control retaliation', 'https://example.com/news8');