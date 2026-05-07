/**
 * V5 Channel Builder
 *
 * Builds independent per-channel ChannelData objects for each country.
 * Fixes the channel contamination bug where all four channels shared the same
 * channelData object (Step 1.1 of V5 implementation).
 *
 * Each channel uses channel-specific logic:
 *   - Revenue: revenuePercentage if available, else revenue prior (GDP-weighted demand)
 *   - Supply:  supplyPercentage if available, else supply prior (manufacturing-weighted)
 *   - Assets:  assetsPercentage if available, else asset prior (capital-stock weighted, λ=0.35)
 *   - Financial: financialPercentage if available, else financial depth prior
 */

import { allocateWithPrior, buildGlobalFallbackV5, type ChannelType } from './channelPriors';

// ============================================================================
// TYPES (mirrors ChannelData from geographicExposureService.ts)
// ============================================================================

export interface ChannelDataV5 {
  weight: number;
  state: 'known-zero' | 'known-positive' | 'unknown';
  status: 'evidence' | 'high_confidence_estimate' | 'fallback';
  source: string;
  dataQuality: 'high' | 'medium' | 'low';
  evidenceType: 'structured_table' | 'narrative' | 'fallback';
  fallbackType: 'SSF' | 'RF' | 'GF' | 'none';
  tier: 'DIRECT' | 'ALLOCATED' | 'MODELED';
}

export interface CompanySpecificExposure {
  country: string;
  percentage: number;
  revenuePercentage?: number;
  supplyPercentage?: number;
  assetsPercentage?: number;
  financialPercentage?: number;
}

export interface CompanySpecificData {
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  dataSource: string;
  lastUpdated: string;
  exposures: CompanySpecificExposure[];
}

// ============================================================================
// CHANNEL-SPECIFIC BUILDERS
// ============================================================================

/**
 * Build revenue channel data for a country.
 * Uses revenuePercentage if available, else blended percentage, else revenue prior.
 */
export function buildRevenueChannelData(
  exposure: CompanySpecificExposure,
  companySpecific: CompanySpecificData,
  allCountries: string[]
): ChannelDataV5 {
  // If explicit revenue percentage available → DIRECT evidence
  if (exposure.revenuePercentage !== undefined && exposure.revenuePercentage > 0) {
    return {
      weight: exposure.revenuePercentage / 100,
      state: 'known-positive',
      status: 'evidence',
      source: `Company-Specific Revenue Data: ${companySpecific.dataSource}`,
      dataQuality: 'high',
      evidenceType: 'structured_table',
      fallbackType: 'none',
      tier: 'DIRECT',
    };
  }

  // If blended percentage available → use it with revenue prior scaling
  if (exposure.percentage > 0) {
    return {
      weight: exposure.percentage / 100,
      state: 'known-positive',
      status: 'evidence',
      source: `Company-Specific Blended Data (Revenue): ${companySpecific.dataSource}`,
      dataQuality: 'high',
      evidenceType: 'structured_table',
      fallbackType: 'none',
      tier: 'DIRECT',
    };
  }

  // Fallback: revenue prior
  const priorWeights = allocateWithPrior(allCountries, 'revenue', companySpecific.sector);
  const weight = priorWeights[exposure.country] || 0;
  return {
    weight,
    state: 'unknown',
    status: 'fallback',
    source: `Revenue Prior (GDP-weighted demand): ${companySpecific.sector}`,
    dataQuality: 'low',
    evidenceType: 'fallback',
    fallbackType: 'GF',
    tier: 'MODELED',
  };
}

/**
 * Build supply chain channel data for a country.
 * Uses supplyPercentage if available, else blended percentage (ALLOCATED), else supply prior (manufacturing-weighted).
 * CRITICAL: US and Germany suppressed for tech hardware; China/Vietnam/India/Taiwan dominate.
 *
 * Fix 1.A: Added blended-percentage fallback path before prior.
 * When only blended `percentage` is stored (no channel-specific supplyPercentage),
 * the blended value is used as ALLOCATED evidence rather than discarding it in favour
 * of the manufacturing prior.
 */
export function buildSupplyChannelData(
  exposure: CompanySpecificExposure,
  companySpecific: CompanySpecificData,
  allCountries: string[]
): ChannelDataV5 {
  // If explicit supply percentage available → DIRECT evidence
  if (exposure.supplyPercentage !== undefined && exposure.supplyPercentage > 0) {
    return {
      weight: exposure.supplyPercentage / 100,
      state: 'known-positive',
      status: 'evidence',
      source: `Company-Specific Supply Data: ${companySpecific.dataSource}`,
      dataQuality: 'high',
      evidenceType: 'structured_table',
      fallbackType: 'none',
      tier: 'DIRECT',
    };
  }

  // Fix 1.A: If blended percentage available → use as ALLOCATED evidence
  // The blended percentage contains supply information; treating it as MODELED/prior
  // discards real evidence. Use ALLOCATED tier to signal derived (not prior-only) data.
  if (exposure.percentage > 0) {
    return {
      weight: exposure.percentage / 100,
      state: 'known-positive',
      status: 'high_confidence_estimate',
      source: `Company-Specific Blended Data (Supply): ${companySpecific.dataSource}`,
      dataQuality: 'medium',
      evidenceType: 'structured_table',
      fallbackType: 'SSF',
      tier: 'ALLOCATED',
    };
  }

  // No supply-specific data and no blended data → use supply prior (manufacturing-weighted, NOT GDP-weighted)
  // This ensures China/Vietnam/India/Taiwan dominate for tech, NOT US/Germany
  const priorWeights = allocateWithPrior(allCountries, 'supply', companySpecific.sector);
  const weight = priorWeights[exposure.country] || 0;
  return {
    weight,
    state: 'unknown',
    status: 'fallback',
    source: `Supply Chain Prior (manufacturing-weighted): ${companySpecific.sector}`,
    dataQuality: 'low',
    evidenceType: 'fallback',
    fallbackType: 'GF',
    tier: 'MODELED',
  };
}

/**
 * Build physical assets channel data for a country.
 * Uses assetsPercentage if available, else blended percentage (ALLOCATED), else asset prior (capital-stock weighted, λ=0.35).
 * Home country bias is higher here (λ=0.35 per V5 spec).
 *
 * Fix 1.A: Added blended-percentage fallback path before prior.
 */
export function buildAssetsChannelData(
  exposure: CompanySpecificExposure,
  companySpecific: CompanySpecificData,
  allCountries: string[]
): ChannelDataV5 {
  // If explicit assets percentage available → DIRECT evidence
  if (exposure.assetsPercentage !== undefined && exposure.assetsPercentage > 0) {
    return {
      weight: exposure.assetsPercentage / 100,
      state: 'known-positive',
      status: 'evidence',
      source: `Company-Specific Assets Data: ${companySpecific.dataSource}`,
      dataQuality: 'high',
      evidenceType: 'structured_table',
      fallbackType: 'none',
      tier: 'DIRECT',
    };
  }

  // Fix 1.A: If blended percentage available → use as ALLOCATED evidence
  if (exposure.percentage > 0) {
    return {
      weight: exposure.percentage / 100,
      state: 'known-positive',
      status: 'high_confidence_estimate',
      source: `Company-Specific Blended Data (Assets): ${companySpecific.dataSource}`,
      dataQuality: 'medium',
      evidenceType: 'structured_table',
      fallbackType: 'SSF',
      tier: 'ALLOCATED',
    };
  }

  // No assets-specific data and no blended data → use asset prior with home-country bias (λ=0.35)
  const gfWeights = buildGlobalFallbackV5(
    companySpecific.homeCountry,
    'assets',
    companySpecific.sector,
    allCountries
  );
  const weight = gfWeights[exposure.country] || 0;
  return {
    weight,
    state: 'unknown',
    status: 'fallback',
    source: `Asset Prior (capital-stock weighted, λ=0.35): ${companySpecific.sector}`,
    dataQuality: 'low',
    evidenceType: 'fallback',
    fallbackType: 'GF',
    tier: 'MODELED',
  };
}

/**
 * Build financial channel data for a country.
 * Uses financialPercentage if available, else blended percentage (ALLOCATED), else financial depth prior (BIS/financial-center weighted).
 *
 * Fix 1.A: Added blended-percentage fallback path before prior.
 */
export function buildFinancialChannelData(
  exposure: CompanySpecificExposure,
  companySpecific: CompanySpecificData,
  allCountries: string[]
): ChannelDataV5 {
  // If explicit financial percentage available → DIRECT evidence
  if (exposure.financialPercentage !== undefined && exposure.financialPercentage > 0) {
    return {
      weight: exposure.financialPercentage / 100,
      state: 'known-positive',
      status: 'evidence',
      source: `Company-Specific Financial Data: ${companySpecific.dataSource}`,
      dataQuality: 'high',
      evidenceType: 'structured_table',
      fallbackType: 'none',
      tier: 'DIRECT',
    };
  }

  // Fix 1.A: If blended percentage available → use as ALLOCATED evidence
  if (exposure.percentage > 0) {
    return {
      weight: exposure.percentage / 100,
      state: 'known-positive',
      status: 'high_confidence_estimate',
      source: `Company-Specific Blended Data (Financial): ${companySpecific.dataSource}`,
      dataQuality: 'medium',
      evidenceType: 'structured_table',
      fallbackType: 'SSF',
      tier: 'ALLOCATED',
    };
  }

  // No financial-specific data and no blended data → use financial depth prior (BIS/financial-center weighted)
  const priorWeights = allocateWithPrior(allCountries, 'financial', companySpecific.sector);
  const weight = priorWeights[exposure.country] || 0;
  return {
    weight,
    state: 'unknown',
    status: 'fallback',
    source: `Financial Depth Prior (BIS/financial-center weighted): ${companySpecific.sector}`,
    dataQuality: 'low',
    evidenceType: 'fallback',
    fallbackType: 'GF',
    tier: 'MODELED',
  };
}