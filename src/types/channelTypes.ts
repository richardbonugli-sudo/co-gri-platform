/**
 * Channel-Specific Data Types
 * 
 * This module defines the data structures for per-channel geographic exposure tracking.
 * Each of the 5 channels (Revenue, Supply Chain, Physical Assets, Financial, Counterparty)
 * is tracked independently with its own evidence status.
 */

export type ChannelType = 'revenue' | 'supply' | 'assets' | 'financial' | 'counterparty';

export type EvidenceStatus = 'evidence' | 'known_zero' | 'unknown' | 'fallback';

/**
 * Country-level exposure data for a single channel
 */
export interface ChannelCountryData {
  country: string;
  value: number; // Pre-normalization weight
  valueNormalized: number; // Normalized weight (after channel normalization)
  status: EvidenceStatus;
  dataSource?: string;
  region?: string;
}

/**
 * Complete exposure data for a single channel
 */
export interface ChannelEvidence {
  channel: ChannelType;
  channelLabel: string; // Human-readable label
  hasEvidence: boolean; // True if ANY country has evidence
  evidenceCount: number; // Number of countries with evidence
  fallbackCount: number; // Number of countries using fallback
  knownZeroCount: number; // Number of countries with known zero
  countries: ChannelCountryData[];
  totalPreNorm: number; // Sum of all pre-norm values
  totalNormalized: number; // Sum of all normalized values (should be 1.0)
  dataQuality: 'verified' | 'partial' | 'fallback'; // Overall quality indicator
}

/**
 * Complete channel breakdown for a company
 */
export interface CompanyChannelData {
  ticker: string;
  companyName: string;
  channels: {
    revenue: ChannelEvidence;
    supply: ChannelEvidence;
    assets: ChannelEvidence;
    financial: ChannelEvidence;
    counterparty: ChannelEvidence;
  };
}

/**
 * Per-channel breakdown for a specific country
 */
export interface CountryChannelBreakdown {
  country: string;
  W_r: { value: number; valueNorm: number; status: EvidenceStatus; dataSource?: string };
  W_s: { value: number; valueNorm: number; status: EvidenceStatus; dataSource?: string };
  W_p: { value: number; valueNorm: number; status: EvidenceStatus; dataSource?: string };
  W_f: { value: number; valueNorm: number; status: EvidenceStatus; dataSource?: string };
  W_c: { value: number; valueNorm: number; status: EvidenceStatus; dataSource?: string };
  blendedPreNorm: number; // 0.35*W_r + 0.30*W_s + 0.20*W_p + 0.10*W_f + 0.05*W_c
  blendedNormalized: number; // Final normalized exposure weight
}

/**
 * Channel coefficients for blending
 */
export const CHANNEL_COEFFICIENTS = {
  revenue: 0.35,
  supply: 0.30,
  assets: 0.20,
  financial: 0.10,
  counterparty: 0.05
} as const;

/**
 * Channel labels for display
 */
export const CHANNEL_LABELS: Record<ChannelType, string> = {
  revenue: 'Revenue (W_r)',
  supply: 'Supply Chain (W_s)',
  assets: 'Physical Assets (W_p)',
  financial: 'Financial Exposure (W_f)',
  counterparty: 'Counterparty Risk (W_c)'
};

/**
 * Get evidence quality badge emoji
 */
export function getEvidenceQualityBadge(quality: 'verified' | 'partial' | 'fallback'): string {
  switch (quality) {
    case 'verified':
      return '✅';
    case 'partial':
      return '⚠️';
    case 'fallback':
      return '📊';
  }
}

/**
 * Get evidence status badge emoji
 */
export function getEvidenceStatusBadge(status: EvidenceStatus): string {
  switch (status) {
    case 'evidence':
      return '✅';
    case 'known_zero':
      return '🔒';
    case 'unknown':
      return '❓';
    case 'fallback':
      return '📊';
  }
}