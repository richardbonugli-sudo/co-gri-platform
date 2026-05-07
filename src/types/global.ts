/**
 * Global Types for CO-GRI Platform
 * Part of CO-GRI Platform Phase 2 & 3 Implementation
 */

export type Mode = 'Country' | 'Company' | 'Forecast' | 'Scenario' | 'Trading';
export type TimeWindow = '7D' | '30D' | '90D' | '12M' | '3Y' | '5Y' | '10Y';

// Extended time window type for historical analysis
export type ExtendedTimeWindow = TimeWindow;

// Type guard for extended time windows
export function isExtendedTimeWindow(window: TimeWindow): window is '3Y' | '5Y' | '10Y' {
  return window === '3Y' || window === '5Y' || window === '10Y';
}

// Type guard for standard time windows
export function isStandardTimeWindow(window: TimeWindow): window is '7D' | '30D' | '90D' | '12M' {
  return window === '7D' || window === '30D' || window === '90D' || window === '12M';
}

// Get days for time window
export function getTimeWindowDays(window: TimeWindow): number {
  switch (window) {
    case '7D': return 7;
    case '30D': return 30;
    case '90D': return 90;
    case '12M': return 365;
    case '3Y': return 1095;
    case '5Y': return 1825;
    case '10Y': return 3650;
    default: return 30;
  }
}
export type Lens = 'Structural' | 'Forecast Overlay' | 'Scenario Shock' | 'Trading Signal';

export interface SelectedEntity {
  country: string | null;
  company: string | null;
  sector: string | null;
  portfolio: string | null;
}

export interface GlobalState {
  active_mode: Mode;
  active_lens: Lens;
  time_window: TimeWindow;
  selected: SelectedEntity;
}

export interface AlignmentData {
  home_country: string;
  exposure_country: string;
  UNAlign: number;
  TreatyAlign: number;
  EconDepend: number;
}

export interface AlignmentFactors {
  UNAlign: number;
  TreatyAlign: number;
  EconDepend: number;
}