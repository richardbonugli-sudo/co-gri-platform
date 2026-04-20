/**
 * Company Mode Type Definitions
 * Part of CO-GRI Platform Phase 2
 *
 * SCHEMA V2 (2026-03-30):
 * Added per-channel exposure fields to CountryExposure and CompanyExposureEntry
 * to support the V5 channel-specific weighting methodology.
 */

export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  ELEVATED = 'Elevated',
  HIGH = 'High'
}

export enum TrendDirection {
  INCREASING = 'Increasing',
  DECREASING = 'Decreasing',
  STABLE = 'Stable'
}

/**
 * Shared ExposureChannels interface — single source of truth for channel field names.
 * Both geographicExposureService and cogriCalculationService must use this interface.
 * IMPORTANT: The financial channel field is named "financial" (NOT "operations").
 */
export interface ExposureChannels {
  /** Revenue channel weight (α coefficient: 0.40 default) */
  revenue: number;
  /** Financial/operations channel weight (δ coefficient: 0.10 default).
   *  Field is named "financial" everywhere — do NOT use "operations". */
  financial: number;
  /** Supply chain channel weight (β coefficient: 0.35 default) */
  supply: number;
  /** Physical assets channel weight (γ coefficient: 0.15 default) */
  assets: number;
  /** Market channel weight (currently 0 — removed from calculation) */
  market: number;
}

/**
 * Per-channel exposure percentages for a single country entry.
 *
 * V5 Schema V2: These four fields replace the single blended `percentage` as the
 * primary data source for channel-specific calculations. All values are 0–100
 * representing percentage of the company's total exposure in that channel.
 *
 * The legacy `percentage` field is retained for backward compatibility and is
 * computed as: 0.40 × revenue + 0.35 × supply + 0.15 × assets + 0.10 × financial
 */
export interface ChannelExposurePercentages {
  /**
   * Share of company revenue sourced from / sold into this country (0–100).
   * Source: SEC 10-K geographic revenue segment table.
   * Maps to channelBuilder.ts `revenuePercentage`.
   */
  revenueExposure: number;
  /**
   * Share of supply-chain / manufacturing activity located in this country (0–100).
   * Source: Supplier Responsibility / Sustainability report, SEC supplier list.
   * Maps to channelBuilder.ts `supplyPercentage`.
   */
  supplyChainExposure: number;
  /**
   * Share of physical assets (PP&E) located in this country (0–100).
   * Source: SEC 10-K PP&E geographic table or Exhibit 21.
   * Maps to channelBuilder.ts `assetsPercentage`.
   */
  assetsExposure: number;
  /**
   * Share of financial exposure (debt issuance, treasury centres) in this country (0–100).
   * Source: SEC 10-K debt securities table, treasury centre disclosures.
   * Maps to channelBuilder.ts `financialPercentage`.
   */
  financialExposure: number;
}

export interface CountryExposure {
  country: string;
  exposureWeight: number;
  preNormalizedWeight?: number;
  countryShockIndex: number;
  contribution: number;
  status?: 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  /** P1-3: Primary V5 evidence tier label — authoritative per V5 Step 1.5.
   *  Derived from best available channel tier (DIRECT > ALLOCATED > MODELED > FALLBACK). */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  /** Fix 2: Evidence tier derived from bestStatus — kept for backward compatibility. */
  dataSource?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  region?: string;
  /** Per-channel weights from the four-channel blending calculation.
   *  Uses the shared ExposureChannels interface — field names are canonical. */
  channelWeights?: ExposureChannels;
  /**
   * V5 Schema V2: Per-channel exposure percentages (0–100) for this country.
   * When present, these override the legacy blended `percentage` in channelBuilder.ts.
   * Populated for company-specific entries (AAPL, TSLA, MSFT) from SEC filings.
   */
  channelExposures?: ChannelExposurePercentages;
  politicalAlignment?: {
    alignmentFactor: number;
    relationship: string;
    source: string;
  };
}

export interface CompanyData {
  ticker: string;
  name: string;
  sector: string;
  homeCountry: string;
  cogriScore: number;
  riskLevel: RiskLevel;
  previousScore?: number;
  calculationResult?: {
    countryExposures: CountryExposure[];
    channelBreakdown?: any;
  };
}

export interface TrendDataPoint {
  timestamp: Date;
  CO_GRI: number;
  top_contributors?: Array<{
    country: string;
    AdjS: number;
    risk_share: number;
  }>;
  channel_shares?: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
}

export interface RiskContribution {
  country: string;
  risk_share: number;
  contribution_label: string;
  dominant_channel: string;
  AdjS?: number;
  W_c?: number;
}

/**
 * V5 Schema V2: Canonical company exposure entry used by companySpecificExposures.ts.
 *
 * Each country entry carries four per-channel exposure percentages (revenueExposure,
 * supplyChainExposure, assetsExposure, financialExposure) in addition to the legacy
 * blended `percentage` field. The blended field is computed automatically and marked
 * @deprecated to signal that downstream code should migrate to the four channel fields.
 *
 * Field name mapping between this interface and channelBuilder.ts:
 *   revenueExposure    → revenuePercentage
 *   supplyChainExposure → supplyPercentage
 *   assetsExposure     → assetsPercentage
 *   financialExposure  → financialPercentage
 */
export interface CompanyExposureEntry extends ChannelExposurePercentages {
  country: string;
  /**
   * Legacy blended percentage (0–100).
   * Computed as: 0.40 × revenueExposure + 0.35 × supplyChainExposure
   *            + 0.15 × assetsExposure  + 0.10 × financialExposure
   * @deprecated Use the four per-channel fields for V5 calculations.
   *             Retained for backward compatibility only.
   */
  percentage: number;
  description?: string;
  /** Evidence tier for this entry */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
}

/**
 * V5 Schema V2: Full company exposure record as stored in COMPANY_SPECIFIC_EXPOSURES.
 */
export interface CompanyExposureRecord {
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: CompanyExposureEntry[];
  dataSource: string;
  lastUpdated: string;
  /** Schema version — 'V2' indicates per-channel fields are populated */
  schemaVersion?: 'V1' | 'V2';
}