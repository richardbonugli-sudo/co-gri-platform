/**
 * Country Shock Data Types
 * Part of CO-GRI Platform Phase 2 Implementation
 */

export interface CountryVectors {
  political: number;
  economic: number;
  social: number;
  military: number;
  environmental: number;
}

export interface CountryShock {
  country: string;
  timestamp: Date;
  S_c: number;  // Country Shock Index [0,100]
  vectors: CountryVectors;
  drivers: Event[];
}

export interface Event {
  date: Date;
  event_type: string;
  description: string;
  impact: number;
  vectors_affected: string[];
}