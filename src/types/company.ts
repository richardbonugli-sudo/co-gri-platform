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

// ─── Global Company Extensions ────────────────────────────────────────────────
// Added in Phase 7 (Global Baseline) to support non-US exchange companies.

/**
 * Optional fields added to Company records for global (non-US) companies.
 * These fields are present on entries in companyDatabase.ts that are listed
 * on BVMF, HKG, JSE, LSE, SGX, TAI, or TSE exchanges.
 */
export interface GlobalCompanyFields {
  /**
   * Ticker of the US-listed ADR equivalent, if one exists.
   * e.g. VALE3 (BVMF) → 'VALE', PETR3 (BVMF) → 'PBR',
   *      RIO.L (LSE) → 'RIO', SHEL.L (LSE) → 'SHEL'
   * When present, the global baseline pipeline may reuse the SEC baseline
   * result for this ADR instead of fetching from the exchange portal.
   */
  adrEquivalent?: string;

  /**
   * Special classification for non-standard company structures.
   * - 'operating'       — standard operating company (default)
   * - 'commodity_trust' — Sprott physical bullion/uranium trusts (PHYS, PSLV, SPPP, U.UN)
   *                       Pipeline captures NAV and custodian location only;
   *                       narrative parsing is skipped.
   * - 'gdr'             — Global Depositary Receipt (e.g. HSBK listed on LSE
   *                       but underlying company is Halyk Bank, Kazakhstan)
   */
  companyType?: 'operating' | 'commodity_trust' | 'gdr';

  /**
   * Yahoo Finance-compatible symbol including exchange suffix and zero-padding.
   * Examples:
   *   HKG  — '0014.HK'  (ticker '14' zero-padded to 4 digits)
   *   BVMF — 'VALE3.SA'
   *   LSE  — 'GLEN.L'
   *   SGX  — 'F34.SI'
   *   TAI  — '2603.TW'
   *   TSE  — 'PHYS.TO', 'U-UN.TO' (U.UN mapped to U-UN)
   */
  yahooTicker?: string;

  /**
   * True for GDR (Global Depositary Receipt) listings.
   * GDRs represent shares in a foreign company traded on a non-home exchange.
   * Country attribution uses the underlying company's domicile, not the
   * listing exchange's country.
   * e.g. HSBK is listed on LSE but country = 'Kazakhstan'.
   */
  isGDR?: boolean;
}

// ─── Global Baseline Result Interface ────────────────────────────────────────
// Parallel to the SEC BaselineResult type in BaselineResultsDashboard.tsx.
// Produced by runGlobalBaseline.ts and stored in
// docs/global-baseline-results/latest.json.

/**
 * Filing source identifier — which exchange portal or data source provided
 * the annual report / financial data for this company.
 */
export type GlobalFilingSource =
  | 'HKEX'        // Hong Kong Exchange — hkexnews.hk
  | 'CVM'         // Brazil CVM / B3 — dados.cvm.gov.br DFP XML
  | 'FCA_NSM'     // UK FCA National Storage Mechanism — LSE companies
  | 'SGX'         // Singapore Exchange — api2.sgx.com
  | 'TWSE_MOPS'   // Taiwan TWSE MOPS — mops.twse.com.tw
  | 'SEDAR_PLUS'  // Canada SEDAR+ — sedarplus.ca
  | 'IR_PAGE'     // Company IR page (used for GDRs, e.g. Halyk Bank)
  | 'FMP'         // Financial Modeling Prep API (financial data fallback)
  | 'REUSED_SEC'; // ADR equivalent data reused from SEC baseline

/**
 * Per-run result for a single global company in the global baseline pipeline.
 *
 * Produced by runGlobalBaseline.ts (Phase 5) and consumed by
 * BaselineResultsDashboard.tsx (Phase 8) to render the "Global Baseline" tab.
 *
 * Field naming mirrors BaselineResult (SEC) where possible so the dashboard
 * can share rendering logic between the two tabs.
 */
export interface GlobalBaselineResult {
  // ── Identity ──────────────────────────────────────────────────────────────
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  yahooTicker: string;
  companyType: 'operating' | 'commodity_trust' | 'gdr';

  // ── Pipeline outcome flags (mirrors SEC BaselineResult) ───────────────────
  /** True if the pipeline successfully entered the data-fetch path for this company. */
  enteredDataPath: boolean;
  /** True if an annual report or financial data file was successfully fetched. */
  filingFetched: boolean;
  /** True if structured financial data (revenue, PP&E, debt, geo segments) was found. */
  structuredDataFound: boolean;
  /** True if geographic narrative parsing produced at least one country/region. */
  narrativeParsingSucceeded: boolean;
  /** True if evidence tiers were assigned to all four channels. */
  channelTiersAssigned: boolean;
  /**
   * Composite confidence score (0–100).
   * Weighted average of channel tier scores × recency multiplier.
   * Commodity trusts cap at 30 (NAV data only).
   */
  compositeConfidenceScore: number;

  // ── Geographic data ───────────────────────────────────────────────────────
  /** List of country/region names extracted from the filing (narrative + structured). */
  geographicSegments?: string[];

  // ── Financial data (FMP API) ──────────────────────────────────────────────
  /** Annual revenue in USD (converted from local currency using fxRateToUSD). */
  revenueUSD?: number;
  /** Total assets in USD. */
  totalAssetsUSD?: number;
  /** Reporting currency code (e.g. 'HKD', 'BRL', 'GBP', 'SGD', 'TWD', 'CAD'). */
  currency: string;
  /** FX rate used to convert local currency amounts to USD (1 local = fxRateToUSD USD). */
  fxRateToUSD: number;

  // ── Filing metadata ───────────────────────────────────────────────────────
  /** Which data source provided the annual report / financial data. */
  filingSource: GlobalFilingSource;
  /** Direct URL to the filing document, if available. */
  filingUrl?: string;
  /** ISO 8601 timestamp of when this result was produced. */
  runDate: string;

  // ── Error handling ────────────────────────────────────────────────────────
  /** Error message if any pipeline step failed; null on full success. */
  errorMessage?: string;

  // ── Commodity trust specific fields ──────────────────────────────────────
  /** Net asset value per unit (commodity trusts only). */
  navPerUnit?: number;
  /** Description of physical holdings (e.g. 'Physical gold bullion'). */
  physicalHoldings?: string;
  /** Location of the physical custodian (e.g. 'Canada' for Sprott trusts). */
  custodianLocation?: string;
}

/**
 * Top-level shape of docs/global-baseline-results/latest.json.
 * Produced by runGlobalBaseline.ts and loaded by BaselineResultsDashboard.tsx.
 */
export interface GlobalRunSummary {
  runId: string;
  exchange: string;
  startTime: string | null;
  endTime: string | null;
  durationMs: number;
  totalCompanies: number;
  completedCompanies: number;
  failedCompanies: number;
  skippedCompanies: number;
  results: GlobalBaselineResult[];
  error?: string;
  _partial?: boolean;
  _partialReason?: string;
}