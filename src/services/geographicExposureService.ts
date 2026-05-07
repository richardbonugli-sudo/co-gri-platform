/**
 * Geographic Exposure Service - Phase 3.0 with SEC Filing Integration
 * 
 * PHASE 3.0 REVISION: STRUCTURED DATA EXTRACTION + FALLBACK LOGIC
 * Based on: EXPOSURE PARSING DECISION TREES + REVISED FALLBACK LOGIC
 * 
 * KEY FEATURES:
 * 1. Company-specific exposure overrides (highest priority)
 * 2. SEC filing structured data extraction (revenue tables, PP&E, debt)
 * 3. Evidence hierarchy: Company-Specific → Structured → Narrative → Fallback
 * 4. Global vs Segment-Specific fallback
 * 5. True zero detection
 * 6. Validation and anti-pattern detection
 * 7. ALL OUTPUTS ARE SPECIFIC COUNTRIES - NO REGIONS
 * 8. ENHANCED LOGGING: Comprehensive diagnostic output for fallback logic verification
 *
 * R1 FIX: upgradeChannelBreakdownWithSEC() now runs on BOTH the live path AND the
 *         static fallback path. The live path no longer replaces the static channel
 *         breakdown entirely — it upgrades only MODELED entries with DIRECT/ALLOCATED
 *         evidence from live SEC integration.
 * R4 FIX: Added missing sector coefficients for Communication Services, Consumer
 *         Discretionary, Industrials, Materials, Utilities, Real Estate.
 */

import { getSectorFallbackTemplate } from '../utils/sectorFallbackTemplates';
import { getCompanySpecificExposure, hasCompanySpecificExposure } from '../data/companySpecificExposures';
import { polygonService } from './polygonService';
import { secEdgarService } from './secEdgarService';
import { alphaVantageService } from './alphaVantageService';
import { sectorClassificationService } from './sectorClassificationService';
import { unComtradeService } from './dataIntegration/unComtradeService';
import { supplyChainDataService } from './dataIntegration/supplyChainDataService';
import { dataQualityValidator } from './dataIntegration/dataQualityValidator';
import { resolveADRCountry } from './adrCountryResolver';
import { calculatePoliticalAlignment, calculateAllAlignments } from './politicalAlignmentService';
import { parseNarrativeText } from './narrativeParser';
import {
  isGlobalFallbackSegment,
  isKnownRegion,
  getRegionCountries,
  decideFallback,
  isTrueZero,
  validateFallbackHierarchy,
  generateFallbackSummary,
  type FallbackDecision
} from './fallbackLogic';
import { 
  integrateStructuredData, 
  type IntegratedExposureData,
  type IntegratedChannelData,
  type ValidationResult
} from './structuredDataIntegrator';
import { buildIndependentChannelBreakdown, type ChannelBreakdownV5 } from './v5/companySpecificChannelFix';
import type { IntegratedChannelDataV5 } from './v5/structuredDataIntegratorV5';
import { fetchLiveOrFallback, LEGACY_STATIC_OVERRIDE } from './v5/liveEdgarPipeline';
import {
  buildGlobalFallbackV5,
  type ChannelType as V5ChannelType,
} from './v5/channelPriors';

type ExposureState = 'known-zero' | 'known-positive' | 'unknown';
type DataStatus = 'evidence' | 'high_confidence_estimate' | 'fallback';

interface GeographicSegment {
  country: string;
  revenuePercentage: number;
  operationalPresence: boolean;
  subsidiaries?: number;
  facilities?: number;
  isRegionalAggregate?: boolean;
  regionalDefinition?: string[];
}

interface ChannelData {
  weight: number;
  state: ExposureState;
  status: DataStatus;
  source: string;
  dataQuality?: 'high' | 'medium' | 'low';
  evidenceType?: 'structured_table' | 'narrative' | 'fallback' | 'exhibit_21' | 'sustainability_report';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  /** V5 Step 1.5: Evidence tier label */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED';
}

interface ChannelBreakdown {
  [country: string]: {
    revenue: ChannelData;
    /** BUG #5 FIX: Renamed from "operations" to "financial" to match cogriCalculationService.
     *  This is the canonical field name per the shared ExposureChannels interface. */
    financial: ChannelData;
    supply: ChannelData;
    assets: ChannelData;
    blended: number;
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
  };
}

interface CompanyGeographicData {
  ticker: string;
  companyName: string;
  company?: string;
  headquartersCountry: string;
  fiscalYear: number;
  dataSource: string;
  segments: GeographicSegment[];
  lastUpdated: string;
  sector?: string;
  sectorMultiplier?: number;
  hasVerifiedData?: boolean;
  hasDetailedComponents?: boolean;
  sectorClassificationConfidence?: number;
  sectorClassificationSources?: string[];
  homeCountry?: string;
  channelBreakdown?: ChannelBreakdown;
  adrResolution?: {
    isADR: boolean;
    confidence: 'high' | 'medium' | 'low';
    source: string;
  };
  secFilingIntegration?: {
    revenueTableFound: boolean;
    ppeTableFound: boolean;
    debtTableFound: boolean;
    supplierListFound: boolean;
    revenueEvidenceLevel: 'structured' | 'narrative' | 'fallback';
    supplyEvidenceLevel: 'structured' | 'narrative' | 'fallback';
    assetsEvidenceLevel: 'structured' | 'narrative' | 'fallback';
    financialEvidenceLevel: 'structured' | 'narrative' | 'fallback';
    validationResults: ValidationResult[];
    sectionsFound: string[];
  };
}

interface CompanyInfo {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  industry: string;
  cik?: string;
  location?: string;
  description?: string;
  address?: string;
  officialSite?: string;
  dataSource: string;
}

// PHASE 3.0: Updated coefficients - removed market channel
const DEFAULT_EXPOSURE_COEFFICIENTS = {
  revenue: 0.40,
  supply: 0.35,
  assets: 0.15,
  financial: 0.10
};

/**
 * R4 FIX: Added missing sector coefficients.
 * Previously missing: Communication Services, Consumer Discretionary, Industrials,
 * Materials, Utilities, Real Estate — these all fell through to DEFAULT_EXPOSURE_COEFFICIENTS
 * which caused incorrect channel weighting for META (Communication Services),
 * AMZN (Consumer Discretionary), etc.
 */
const SECTOR_EXPOSURE_COEFFICIENTS: Record<string, typeof DEFAULT_EXPOSURE_COEFFICIENTS> = {
  // ── Original entries ──────────────────────────────────────────────────────
  'Technology': { revenue: 0.45, supply: 0.35, assets: 0.10, financial: 0.10 },
  'Manufacturing': { revenue: 0.30, supply: 0.45, assets: 0.20, financial: 0.05 },
  'Financial Services': { revenue: 0.40, supply: 0.05, assets: 0.15, financial: 0.40 },
  'Energy': { revenue: 0.35, supply: 0.30, assets: 0.30, financial: 0.05 },
  'Healthcare': { revenue: 0.45, supply: 0.30, assets: 0.15, financial: 0.10 },
  'Consumer Goods': { revenue: 0.45, supply: 0.30, assets: 0.15, financial: 0.10 },
  'Telecommunications': { revenue: 0.50, supply: 0.20, assets: 0.25, financial: 0.05 },
  'Retail': { revenue: 0.50, supply: 0.25, assets: 0.20, financial: 0.05 },

  // ── R4 FIX: New sector entries ────────────────────────────────────────────
  /**
   * Communication Services (META, GOOGL, NFLX, DIS)
   * Revenue-dominant (advertising/subscriptions), minimal supply chain,
   * moderate assets (data centres), low financial exposure.
   */
  'Communication Services': { revenue: 0.55, supply: 0.15, assets: 0.20, financial: 0.10 },

  /**
   * Consumer Discretionary (AMZN, TSLA, NKE, MCD)
   * Revenue and supply chain both significant (global sourcing),
   * moderate assets (stores/warehouses), low financial.
   */
  'Consumer Discretionary': { revenue: 0.40, supply: 0.35, assets: 0.18, financial: 0.07 },

  /**
   * Industrials (BA, GE, CAT, HON)
   * Supply chain critical (global parts sourcing), significant assets
   * (factories/equipment), moderate revenue, low financial.
   */
  'Industrials': { revenue: 0.30, supply: 0.40, assets: 0.25, financial: 0.05 },

  /**
   * Materials (LIN, APD, FCX, NEM)
   * Assets dominant (mines/plants), supply chain important,
   * moderate revenue, low financial.
   */
  'Materials': { revenue: 0.25, supply: 0.35, assets: 0.35, financial: 0.05 },

  /**
   * Utilities (NEE, DUK, SO, AEP)
   * Assets heavily dominant (infrastructure), revenue mostly domestic,
   * minimal supply chain, moderate financial (bond-funded capex).
   */
  'Utilities': { revenue: 0.30, supply: 0.15, assets: 0.40, financial: 0.15 },

  /**
   * Real Estate (AMT, PLD, CCI, EQIX)
   * Assets dominant (property portfolio), revenue from rents,
   * minimal supply chain, significant financial (REIT debt structure).
   */
  'Real Estate': { revenue: 0.25, supply: 0.05, assets: 0.50, financial: 0.20 },

  // ── Aliases for common sector name variants ───────────────────────────────
  'Information Technology': { revenue: 0.45, supply: 0.35, assets: 0.10, financial: 0.10 },
  'Consumer Staples': { revenue: 0.45, supply: 0.30, assets: 0.15, financial: 0.10 },
  'Health Care': { revenue: 0.45, supply: 0.30, assets: 0.15, financial: 0.10 },
  'Financials': { revenue: 0.40, supply: 0.05, assets: 0.15, financial: 0.40 },
  'Finance': { revenue: 0.40, supply: 0.05, assets: 0.15, financial: 0.40 },
};

function getSectorExposureCoefficients(sector: string): typeof DEFAULT_EXPOSURE_COEFFICIENTS {
  return SECTOR_EXPOSURE_COEFFICIENTS[sector] || DEFAULT_EXPOSURE_COEFFICIENTS;
}

/**
 * Convert IntegratedChannelData to ChannelData format
 */
function convertIntegratedToChannelData(integrated: IntegratedChannelData): ChannelData {
  return {
    weight: integrated.weight,
    state: integrated.state,
    status: integrated.status,
    source: integrated.source,
    dataQuality: integrated.dataQuality,
    evidenceType: integrated.evidenceType,
    fallbackType: integrated.fallbackType
  };
}

/**
 * ENHANCED LOGGING: Log detailed channel data for diagnostic purposes
 */
function logChannelDiagnostics(
  ticker: string,
  channelName: string,
  channelData: Record<string, IntegratedChannelData>,
  fallbackType?: 'SSF' | 'RF' | 'GF'
) {
  console.log(`\n[${ticker}] ========================================`);
  console.log(`[${ticker}] ${channelName.toUpperCase()} CHANNEL DIAGNOSTIC REPORT`);
  console.log(`[${ticker}] ========================================`);
  console.log(`[${ticker}] Overall Fallback Type: ${fallbackType || 'none'}`);
  console.log(`[${ticker}] Total Countries: ${Object.keys(channelData).length}`);
  
  const totalWeight = Object.values(channelData).reduce((sum, data) => sum + data.weight, 0);
  console.log(`[${ticker}] Total Weight: ${(totalWeight * 100).toFixed(6)}%`);
  
  console.log(`\n[${ticker}] Country-by-Country Breakdown:`);
  console.log(`[${ticker}] ${'='.repeat(80)}`);
  
  const sortedCountries = Object.entries(channelData)
    .sort(([, a], [, b]) => b.weight - a.weight);
  
  for (const [country, data] of sortedCountries) {
    console.log(`\n[${ticker}] 📍 ${country}:`);
    console.log(`[${ticker}]    Weight: ${(data.weight * 100).toFixed(6)}%`);
    console.log(`[${ticker}]    State: ${data.state}`);
    console.log(`[${ticker}]    Status: ${data.status}`);
    console.log(`[${ticker}]    Data Quality: ${data.dataQuality}`);
    console.log(`[${ticker}]    Evidence Type: ${data.evidenceType}`);
    console.log(`[${ticker}]    Fallback Type: ${data.fallbackType || 'none'}`);
    console.log(`[${ticker}]    Source: ${data.source}`);
  }
  
  console.log(`\n[${ticker}] ========================================\n`);
}

/**
 * R1 FIX: upgradeChannelBreakdownWithSEC now runs on BOTH the live path AND the
 * static fallback path.
 *
 * Fix 4.A helper: Upgrade MODELED channel entries in a company-specific breakdown
 * with DIRECT/ALLOCATED evidence from SEC integration.
 *
 * Only upgrades entries whose current tier is 'MODELED' — DIRECT and ALLOCATED
 * entries from company-specific data are never downgraded.
 */
function upgradeChannelBreakdownWithSEC(
  channelBreakdown: ReturnType<typeof buildIndependentChannelBreakdown>['channelBreakdown'],
  secIntegration: IntegratedExposureData,
  ticker: string
): void {
  for (const [country, entry] of Object.entries(channelBreakdown)) {
    // Revenue: upgrade if SEC has DIRECT/ALLOCATED evidence
    if (entry.revenue.tier === 'MODELED' && secIntegration.revenueChannel[country]) {
      const secRev = secIntegration.revenueChannel[country];
      if (secRev.tier === 'DIRECT' || secRev.tier === 'ALLOCATED') {
        console.log(`[${ticker}] Fix 4.A: Upgrading ${country} revenue from MODELED to ${secRev.tier}`);
        entry.revenue = {
          weight: secRev.weight,
          state: secRev.state,
          status: secRev.status,
          source: secRev.source,
          dataQuality: secRev.dataQuality,
          evidenceType: secRev.evidenceType,
          fallbackType: secRev.fallbackType,
          tier: secRev.tier,
        };
      }
    }

    // Supply: upgrade if SEC has DIRECT/ALLOCATED evidence
    if (entry.supply.tier === 'MODELED' && secIntegration.supplyChannel[country]) {
      const secSup = secIntegration.supplyChannel[country];
      if (secSup.tier === 'DIRECT' || secSup.tier === 'ALLOCATED') {
        console.log(`[${ticker}] Fix 4.A: Upgrading ${country} supply from MODELED to ${secSup.tier}`);
        entry.supply = {
          weight: secSup.weight,
          state: secSup.state,
          status: secSup.status,
          source: secSup.source,
          dataQuality: secSup.dataQuality,
          evidenceType: secSup.evidenceType,
          fallbackType: secSup.fallbackType,
          tier: secSup.tier,
        };
      }
    }

    // Assets: upgrade if SEC has DIRECT/ALLOCATED evidence
    if (entry.assets.tier === 'MODELED' && secIntegration.assetsChannel[country]) {
      const secAst = secIntegration.assetsChannel[country];
      if (secAst.tier === 'DIRECT' || secAst.tier === 'ALLOCATED') {
        console.log(`[${ticker}] Fix 4.A: Upgrading ${country} assets from MODELED to ${secAst.tier}`);
        entry.assets = {
          weight: secAst.weight,
          state: secAst.state,
          status: secAst.status,
          source: secAst.source,
          dataQuality: secAst.dataQuality,
          evidenceType: secAst.evidenceType,
          fallbackType: secAst.fallbackType,
          tier: secAst.tier,
        };
      }
    }

    // Financial: upgrade if SEC has DIRECT/ALLOCATED evidence
    if (entry.financial.tier === 'MODELED' && secIntegration.financialChannel[country]) {
      const secFin = secIntegration.financialChannel[country];
      if (secFin.tier === 'DIRECT' || secFin.tier === 'ALLOCATED') {
        console.log(`[${ticker}] Fix 4.A: Upgrading ${country} financial from MODELED to ${secFin.tier}`);
        entry.financial = {
          weight: secFin.weight,
          state: secFin.state,
          status: secFin.status,
          source: secFin.source,
          dataQuality: secFin.dataQuality,
          evidenceType: secFin.evidenceType,
          fallbackType: secFin.fallbackType,
          tier: secFin.tier,
        };
      }
    }
  }
}

/**
 * PHASE 3.0: Four-Channel Calculation with Company-Specific Override
 * FIXED: Always prioritize SEC filing data over template-based fallback
 * ENHANCED: Comprehensive logging for diagnostic verification
 *
 * R1 FIX: When liveDataAvailable=true, build independent channel breakdown from
 * static table FIRST (preserving channel differentiation), then call
 * upgradeChannelBreakdownWithSEC() to upgrade only MODELED entries with
 * DIRECT/ALLOCATED evidence from live SEC integration.
 * This prevents the live path from replacing the static breakdown entirely,
 * which was causing channel homogeneity (all channels sharing the same weights).
 */
async function calculateIndependentChannelExposuresWithSEC(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string,
  isADRHomeCountry: boolean
): Promise<{ 
  channelBreakdown: ChannelBreakdown; 
  blendedWeights: Record<string, number>;
  secIntegration: IntegratedExposureData | null;
  usedCompanySpecific: boolean;
}> {
  const coefficients = getSectorExposureCoefficients(sector);
  
  console.log(`\n[${ticker}] ========================================`);
  console.log(`[${ticker}] FOUR-CHANNEL CALCULATION WITH COMPANY-SPECIFIC OVERRIDE`);
  console.log(`[${ticker}] Company: ${companyName}`);
  console.log(`[${ticker}] Home Country: ${homeCountry} ${isADRHomeCountry ? '(ADR-Resolved)' : ''}`);
  console.log(`[${ticker}] Sector: ${sector}`);
  console.log(`[${ticker}] Channel Coefficients:`);
  console.log(`[${ticker}]   - Revenue (α): ${coefficients.revenue.toFixed(4)}`);
  console.log(`[${ticker}]   - Supply (β): ${coefficients.supply.toFixed(4)}`);
  console.log(`[${ticker}]   - Assets (γ): ${coefficients.assets.toFixed(4)}`);
  console.log(`[${ticker}]   - Financial (δ): ${coefficients.financial.toFixed(4)}`);
  console.log(`[${ticker}] ========================================`);
  
  // Check for company-specific exposure data first (HIGHEST PRIORITY)
  const companySpecific = getCompanySpecificExposure(ticker);
  if (companySpecific) {
    console.log(`[${ticker}] ✅ Found company-specific exposure data!`);
    console.log(`[${ticker}] Data Source: ${companySpecific.dataSource}`);
    console.log(`[${ticker}] Last Updated: ${companySpecific.lastUpdated}`);
    console.log(`[${ticker}] Company-Specific Name: ${companySpecific.companyName}`);
    console.log(`[${ticker}] Company-Specific Sector: ${companySpecific.sector}`);
    console.log(`[${ticker}] LEGACY_STATIC_OVERRIDE: ${LEGACY_STATIC_OVERRIDE}`);

    // ── R1 FIX: Always build independent channel breakdown from static table FIRST ──
    // Previously, when liveDataAvailable=true, the live path completely replaced the
    // static channel breakdown, discarding the carefully differentiated per-channel
    // values (e.g. Apple: China revenue=16.9% vs supply=35.0%).
    //
    // New behaviour:
    //   1. Build independent channel breakdown from static snapshot (preserves differentiation)
    //   2. Attempt live EDGAR pipeline
    //   3. If live data available: call upgradeChannelBreakdownWithSEC() to upgrade
    //      only MODELED entries — DIRECT/ALLOCATED entries are never downgraded
    //   4. If live data unavailable: same upgrade pass with integrateStructuredData()
    //
    // This ensures channel differentiation is preserved regardless of live path outcome.
    console.log(`[${ticker}] R1 FIX: Building independent channel breakdown from static snapshot FIRST...`);
    const { channelBreakdown, blendedWeights } = buildIndependentChannelBreakdown(
      companySpecific,
      coefficients
    );
    console.log(`[${ticker}] R1 FIX: Static channel breakdown built for ${Object.keys(channelBreakdown).length} countries`);

    // ── Attempt live EDGAR pipeline ──────────────────────────────────────────
    console.log(`[${ticker}] R1 FIX: Attempting live EDGAR pipeline (LEGACY_STATIC_OVERRIDE=${LEGACY_STATIC_OVERRIDE})...`);
    const liveResult = await fetchLiveOrFallback(ticker, homeCountry, sector);
    console.log(`[${ticker}] R1 FIX: Live pipeline result — source=${liveResult.source}, liveDataAvailable=${liveResult.liveDataAvailable}`);

    let secIntegrationForMerge: IntegratedExposureData | null = null;

    if (liveResult.liveDataAvailable && liveResult.secIntegration) {
      // Live pipeline succeeded: upgrade MODELED entries with live EDGAR evidence
      console.log(`[${ticker}] R1 FIX: Live EDGAR available — upgrading MODELED entries (NOT replacing breakdown)`);
      secIntegrationForMerge = liveResult.secIntegration;
      upgradeChannelBreakdownWithSEC(channelBreakdown, secIntegrationForMerge, ticker);
      console.log(`[${ticker}] R1 FIX: Live EDGAR upgrade pass complete`);
    } else {
      // Live pipeline failed: attempt SEC integration for upgrade pass
      console.log(`[${ticker}] R1 FIX: Live EDGAR unavailable — attempting SEC integration for upgrade pass...`);
      try {
        secIntegrationForMerge = await integrateStructuredData(ticker, homeCountry, sector);
        if (secIntegrationForMerge) {
          upgradeChannelBreakdownWithSEC(channelBreakdown, secIntegrationForMerge, ticker);
          console.log(`[${ticker}] R1 FIX: SEC integration upgrade pass complete`);
        }
      } catch (e) {
        console.warn(`[${ticker}] R1 FIX: SEC integration failed during upgrade pass:`, e);
      }
    }

    // Log per-country channel summary (after potential SEC upgrade)
    for (const [country, entry] of Object.entries(channelBreakdown)) {
      console.log(
        `[${ticker}] ${country}: ` +
        `rev=${(entry.revenue.weight * 100).toFixed(2)}%[${entry.revenue.tier}] ` +
        `sup=${(entry.supply.weight * 100).toFixed(2)}%[${entry.supply.tier}] ` +
        `ast=${(entry.assets.weight * 100).toFixed(2)}%[${entry.assets.tier}] ` +
        `fin=${(entry.financial.weight * 100).toFixed(2)}%[${entry.financial.tier}] ` +
        `blended=${(entry.blended * 100).toFixed(4)}%`
      );
    }

    return {
      channelBreakdown,
      blendedWeights,
      secIntegration: secIntegrationForMerge,
      usedCompanySpecific: true,
    };
  }
  
  // PRIORITY 2: Try to integrate SEC filing data
  // CRITICAL FIX: Always attempt SEC filing integration, don't skip to template fallback
  let secIntegration: IntegratedExposureData | null = null;
  
  console.log(`[${ticker}] Attempting SEC filing integration...`);
  try {
    secIntegration = await integrateStructuredData(ticker, homeCountry, sector);
    
    if (secIntegration) {
      console.log(`[${ticker}] ✅ SEC filing integration complete`);
      console.log(`[${ticker}]   - Revenue evidence: ${secIntegration.revenueEvidenceLevel} (table found: ${secIntegration.revenueTableFound})`);
      console.log(`[${ticker}]   - Revenue fallback: ${secIntegration.revenueFallbackType || 'none'}`);
      console.log(`[${ticker}]   - Supply evidence: ${secIntegration.supplyEvidenceLevel}`);
      console.log(`[${ticker}]   - Supply fallback: ${secIntegration.supplyFallbackType || 'none'}`);
      console.log(`[${ticker}]   - Assets evidence: ${secIntegration.assetsEvidenceLevel} (table found: ${secIntegration.ppeTableFound})`);
      console.log(`[${ticker}]   - Assets fallback: ${secIntegration.assetsFallbackType || 'none'}`);
      console.log(`[${ticker}]   - Financial evidence: ${secIntegration.financialEvidenceLevel} (table found: ${secIntegration.debtTableFound})`);
      console.log(`[${ticker}]   - Financial fallback: ${secIntegration.financialFallbackType || 'none'}`);
      
      // ENHANCED LOGGING: Log each channel's diagnostic data
      logChannelDiagnostics(ticker, 'Revenue', secIntegration.revenueChannel, secIntegration.revenueFallbackType);
      logChannelDiagnostics(ticker, 'Supply', secIntegration.supplyChannel, secIntegration.supplyFallbackType);
      logChannelDiagnostics(ticker, 'Assets', secIntegration.assetsChannel, secIntegration.assetsFallbackType);
      logChannelDiagnostics(ticker, 'Financial', secIntegration.financialChannel, secIntegration.financialFallbackType);
    }
  } catch (error) {
    console.log(`[${ticker}] ⚠️ SEC filing integration error:`, error);
  }
  
  // Build channel breakdown
  const channelBreakdown: ChannelBreakdown = {};
  const blendedWeights: Record<string, number> = {};

  // CRITICAL FIX: Check if SEC integration returned ANY data (even if it's fallback data)
  const hasAnySECData = secIntegration && (
    Object.keys(secIntegration.revenueChannel).length > 0 ||
    Object.keys(secIntegration.supplyChannel).length > 0 ||
    Object.keys(secIntegration.assetsChannel).length > 0 ||
    Object.keys(secIntegration.financialChannel).length > 0
  );

  if (hasAnySECData) {
    // Use SEC-integrated data (structured, narrative, or proper SSF/RF/GF fallback)
    console.log(`[${ticker}] ✅ Using SEC-integrated channel data`);
    console.log(`[${ticker}]   - Revenue fallback type: ${secIntegration!.revenueFallbackType || 'none'}`);
    console.log(`[${ticker}]   - Supply fallback type: ${secIntegration!.supplyFallbackType || 'none'}`);
    console.log(`[${ticker}]   - Assets fallback type: ${secIntegration!.assetsFallbackType || 'none'}`);
    console.log(`[${ticker}]   - Financial fallback type: ${secIntegration!.financialFallbackType || 'none'}`);

    const allCountries = new Set([
      ...Object.keys(secIntegration!.revenueChannel),
      ...Object.keys(secIntegration!.supplyChannel),
      ...Object.keys(secIntegration!.assetsChannel),
      ...Object.keys(secIntegration!.financialChannel)
    ]);
    
    console.log(`[${ticker}] Total unique countries from SEC data: ${allCountries.size}`);
    
    const alignments = calculateAllAlignments(homeCountry, Array.from(allCountries));
    
    console.log(`\n[${ticker}] ========================================`);
    console.log(`[${ticker}] BLENDED WEIGHT CALCULATION (COUNTRY-BY-COUNTRY)`);
    console.log(`[${ticker}] ========================================`);
    
    for (const country of allCountries) {
      const revenue = secIntegration!.revenueChannel[country] || { 
        country, weight: 0, state: 'unknown' as const, status: 'fallback' as const, 
        source: 'No Data', dataQuality: 'low' as const, evidenceType: 'fallback' as const,
        fallbackType: 'GF' as const
      };
      const supply = secIntegration!.supplyChannel[country] || { 
        country, weight: 0, state: 'unknown' as const, status: 'fallback' as const, 
        source: 'No Data', dataQuality: 'low' as const, evidenceType: 'fallback' as const,
        fallbackType: 'GF' as const
      };
      const assets = secIntegration!.assetsChannel[country] || { 
        country, weight: 0, state: 'unknown' as const, status: 'fallback' as const, 
        source: 'No Data', dataQuality: 'low' as const, evidenceType: 'fallback' as const,
        fallbackType: 'GF' as const
      };
      const financial = secIntegration!.financialChannel[country] || { 
        country, weight: 0, state: 'unknown' as const, status: 'fallback' as const, 
        source: 'No Data', dataQuality: 'low' as const, evidenceType: 'fallback' as const,
        fallbackType: 'GF' as const
      };
      
      const revenueContribution = revenue.state === 'known-zero' ? 0 : coefficients.revenue * revenue.weight;
      const supplyContribution = supply.state === 'known-zero' ? 0 : coefficients.supply * supply.weight;
      const assetsContribution = assets.state === 'known-zero' ? 0 : coefficients.assets * assets.weight;
      const financialContribution = financial.state === 'known-zero' ? 0 : coefficients.financial * financial.weight;
      
      const blendedWeight = revenueContribution + supplyContribution + assetsContribution + financialContribution;
      
      // ENHANCED LOGGING: Detailed calculation for each country
      console.log(`\n[${ticker}] 📍 ${country}:`);
      console.log(`[${ticker}]    Revenue: ${(revenue.weight * 100).toFixed(6)}% × ${coefficients.revenue.toFixed(4)} = ${(revenueContribution * 100).toFixed(6)}% [${revenue.fallbackType || 'none'}]`);
      console.log(`[${ticker}]    Supply: ${(supply.weight * 100).toFixed(6)}% × ${coefficients.supply.toFixed(4)} = ${(supplyContribution * 100).toFixed(6)}% [${supply.fallbackType || 'none'}]`);
      console.log(`[${ticker}]    Assets: ${(assets.weight * 100).toFixed(6)}% × ${coefficients.assets.toFixed(4)} = ${(assetsContribution * 100).toFixed(6)}% [${assets.fallbackType || 'none'}]`);
      console.log(`[${ticker}]    Financial: ${(financial.weight * 100).toFixed(6)}% × ${coefficients.financial.toFixed(4)} = ${(financialContribution * 100).toFixed(6)}% [${financial.fallbackType || 'none'}]`);
      console.log(`[${ticker}]    ✅ Blended Weight: ${(blendedWeight * 100).toFixed(6)}%`);
      
      // BUG #6 FIX: Aligned threshold with cogriCalculationService PRIORITY 3 FIX.
      if (blendedWeight < 0.0001) {
        console.log(`[${ticker}]    ⚠️ Below micro-exposure threshold (0.01%), excluding from final results`);
        continue;
      }
      
      const alignment = alignments[country];
      
      blendedWeights[country] = blendedWeight;
      
      // BUG #5 FIX: Write "financial" key (not "operations") to match cogriCalculationService
      channelBreakdown[country] = {
        revenue: convertIntegratedToChannelData(revenue),
        financial: convertIntegratedToChannelData(financial),
        supply: convertIntegratedToChannelData(supply),
        assets: convertIntegratedToChannelData(assets),
        blended: blendedWeight,
        politicalAlignment: {
          alignmentFactor: alignment.alignmentFactor,
          relationship: alignment.relationship,
          source: alignment.source
        }
      };
    }
  } else {
    // LAST RESORT: Only use template-based fallback when SEC integration completely fails.
    // FIX 5 + FIX 4: Replace hardcoded 85/15 split with per-channel V5 GF formula.
    console.log(`[${ticker}] ⚠️ SEC filing integration returned no data - using V5 GF template fallback (LAST RESORT)`);
    console.log(`[${ticker}] FIX 5: Replacing hardcoded 85/15 with per-channel buildGlobalFallbackV5()`);

    const revGF  = buildGlobalFallbackV5(homeCountry, 'revenue'   as V5ChannelType, sector);
    const supGF  = buildGlobalFallbackV5(homeCountry, 'supply'    as V5ChannelType, sector);
    const astGF  = buildGlobalFallbackV5(homeCountry, 'assets'    as V5ChannelType, sector);
    const finGF  = buildGlobalFallbackV5(homeCountry, 'financial' as V5ChannelType, sector);

    const gfCountries = new Set<string>([
      ...Object.keys(revGF),
      ...Object.keys(supGF),
      ...Object.keys(astGF),
      ...Object.keys(finGF),
    ]);

    const alignments = calculateAllAlignments(homeCountry, Array.from(gfCountries));

    console.log(`\n[${ticker}] ========================================`);
    console.log(`[${ticker}] V5 GF TEMPLATE FALLBACK (per-channel λ)`);
    console.log(`[${ticker}] ========================================`);

    for (const country of gfCountries) {
      const revW = revGF[country] ?? 0;
      const supW = supGF[country] ?? 0;
      const astW = astGF[country] ?? 0;
      const finW = finGF[country] ?? 0;

      const revenueChannelData: ChannelData = {
        weight: revW,
        state: 'unknown',
        status: 'fallback',
        source: `V5 GF Revenue (λ=0.25, ${sector})`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };

      const supplyChannelData: ChannelData = {
        weight: supW,
        state: 'unknown',
        status: 'fallback',
        source: `V5 GF Supply (λ=0.10, ${sector})`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };

      const assetsChannelData: ChannelData = {
        weight: astW,
        state: 'unknown',
        status: 'fallback',
        source: `V5 GF Assets (λ=0.35, ${sector})`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };

      const financialChannelData: ChannelData = {
        weight: finW,
        state: 'unknown',
        status: 'fallback',
        source: `V5 GF Financial (λ=0.30, ${sector})`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF',
        tier: 'MODELED',
      };

      const blendedWeight =
        coefficients.revenue   * revW +
        coefficients.supply    * supW +
        coefficients.assets    * astW +
        coefficients.financial * finW;

      console.log(
        `[${ticker}] ${country}: rev=${(revW*100).toFixed(2)}% sup=${(supW*100).toFixed(2)}%` +
        ` ast=${(astW*100).toFixed(2)}% fin=${(finW*100).toFixed(2)}%` +
        ` → blended=${(blendedWeight*100).toFixed(4)}% [V5 GF]`
      );

      if (blendedWeight < 0.0001) continue;

      const alignment = alignments[country];
      blendedWeights[country] = blendedWeight;

      channelBreakdown[country] = {
        revenue:   revenueChannelData,
        financial: financialChannelData,
        supply:    supplyChannelData,
        assets:    assetsChannelData,
        blended:   blendedWeight,
        politicalAlignment: {
          alignmentFactor: alignment.alignmentFactor,
          relationship:    alignment.relationship,
          source:          alignment.source,
        },
      };
    }
  }
  
  // Normalize
  console.log(`\n[${ticker}] === NORMALIZATION ===`);
  const totalBlended = Object.values(blendedWeights).reduce((sum, w) => sum + w, 0);
  console.log(`[${ticker}] Pre-normalization total: ${(totalBlended * 100).toFixed(6)}%`);
  
  if (totalBlended > 0) {
    console.log(`[${ticker}] Normalization factor: ${(1 / totalBlended).toFixed(8)}`);
    
    for (const country of Object.keys(blendedWeights)) {
      const preNorm = blendedWeights[country];
      const normalizedWeight = preNorm / totalBlended;
      const change = ((normalizedWeight / preNorm - 1) * 100);
      
      blendedWeights[country] = normalizedWeight;
      channelBreakdown[country].blended = normalizedWeight;
      
      console.log(`[${ticker}] ${country}: ${(preNorm * 100).toFixed(6)}% → ${(normalizedWeight * 100).toFixed(6)}% (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`);
    }
  }
  
  const postNormTotal = Object.values(blendedWeights).reduce((sum, w) => sum + w, 0);
  console.log(`[${ticker}] Post-normalization total: ${(postNormTotal * 100).toFixed(6)}%`);
  console.log(`[${ticker}] Normalization complete. Total countries: ${Object.keys(blendedWeights).length}`);
  
  return { channelBreakdown, blendedWeights, secIntegration, usedCompanySpecific: false };
}

/**
 * REMOVED: VERIFIED_COMPANY_DATABASE with hardcoded regions
 * All data now comes from company-specific overrides, SEC filing integration or fallback templates
 */

export function getVerifiedCompanies(): string[] {
  return [];
}

export function hasVerifiedData(ticker: string): boolean {
  return hasCompanySpecificExposure(ticker);
}

export function hasDetailedComponents(ticker: string): boolean {
  return hasCompanySpecificExposure(ticker);
}

export function getVerifiedCompanyData(ticker: string): CompanyGeographicData | null {
  const companySpecific = getCompanySpecificExposure(ticker);
  if (!companySpecific) return null;
  
  const segments: GeographicSegment[] = companySpecific.exposures.map(exp => ({
    country: exp.country,
    revenuePercentage: exp.percentage,
    operationalPresence: exp.percentage >= 5
  }));
  
  return {
    ticker: companySpecific.ticker,
    companyName: companySpecific.companyName,
    company: companySpecific.companyName,
    headquartersCountry: companySpecific.homeCountry,
    fiscalYear: new Date().getFullYear(),
    dataSource: companySpecific.dataSource,
    segments,
    lastUpdated: companySpecific.lastUpdated,
    sector: companySpecific.sector
  };
}

export async function resolveTickerWithPolygon(input: string): Promise<CompanyInfo | null> {
  try {
    return await polygonService.resolveTicker(input);
  } catch (error) {
    console.error('Error resolving ticker with Polygon:', error);
    return null;
  }
}

export async function resolveCompanyWithSEC(input: string): Promise<CompanyInfo | null> {
  try {
    return await secEdgarService.resolveCompany(input);
  } catch (error) {
    console.error('Error resolving company with SEC Edgar:', error);
    return null;
  }
}

export async function resolveCompanyWithAlphaVantage(input: string): Promise<CompanyInfo | null> {
  try {
    return await alphaVantageService.resolveCompany(input);
  } catch (error) {
    console.error('Error resolving company with Alpha Vantage:', error);
    return null;
  }
}

export async function resolveTickerMultiSource(input: string): Promise<CompanyInfo | null> {
  try {
    const [polygonResult, secResult, alphaVantageResult] = await Promise.all([
      resolveTickerWithPolygon(input),
      resolveCompanyWithSEC(input),
      resolveCompanyWithAlphaVantage(input)
    ]);
    
    const sources: string[] = [];
    if (polygonResult) sources.push('Polygon.io');
    if (secResult) sources.push('SEC Edgar');
    if (alphaVantageResult) sources.push('Alpha Vantage');
    
    if (polygonResult || secResult || alphaVantageResult) {
      const ticker = (polygonResult?.ticker || secResult?.ticker || alphaVantageResult?.ticker || '').toUpperCase();
      const name = alphaVantageResult?.name || polygonResult?.name || secResult?.name || '';
      const exchange = polygonResult?.exchange || secResult?.exchange || alphaVantageResult?.exchange || '';
      const apiCountry = alphaVantageResult?.country || polygonResult?.country || 'United States';
      
      const adrResolution = resolveADRCountry(ticker, name, apiCountry, exchange);
      
      console.log(`[ADR Resolution] ${ticker}: API returned "${apiCountry}", resolved to "${adrResolution.country}" (${adrResolution.confidence} confidence, ${adrResolution.source})`);
      
      return {
        ticker,
        name,
        exchange,
        country: adrResolution.country,
        sector: alphaVantageResult?.sector || secResult?.sector || polygonResult?.sector || '',
        industry: alphaVantageResult?.industry || secResult?.industry || '',
        cik: alphaVantageResult?.cik || polygonResult?.cik || secResult?.cik,
        location: secResult?.location || alphaVantageResult?.address,
        description: alphaVantageResult?.description,
        address: alphaVantageResult?.address,
        officialSite: alphaVantageResult?.officialSite,
        dataSource: sources.join(' + ')
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving ticker with multiple sources:', error);
    return null;
  }
}

export function getCompanyGeographicExposureSync(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string
): CompanyGeographicData {
  const companySpecific = getCompanySpecificExposure(ticker);
  if (companySpecific) {
    const segments: GeographicSegment[] = companySpecific.exposures.map(exp => ({
      country: exp.country,
      revenuePercentage: exp.percentage,
      operationalPresence: exp.percentage >= 5
    }));
    
    return {
      ticker: companySpecific.ticker,
      companyName: companySpecific.companyName,
      company: companySpecific.companyName,
      headquartersCountry: companySpecific.homeCountry,
      fiscalYear: new Date().getFullYear(),
      dataSource: companySpecific.dataSource,
      segments,
      lastUpdated: companySpecific.lastUpdated,
      sector: companySpecific.sector
    };
  }
  
  // FIX 5: Replace hardcoded 85% home-country with V5 GF revenue prior (λ=0.25).
  const revGFSync = buildGlobalFallbackV5(homeCountry, 'revenue' as V5ChannelType, sector);
  const segments: GeographicSegment[] = [];

  for (const [country, share] of Object.entries(revGFSync)) {
    const percentage = share * 100;
    if (percentage >= 0.5) {
      segments.push({
        country,
        revenuePercentage: percentage,
        operationalPresence: percentage >= 1.0,
      });
    }
  }

  segments.sort((a, b) => b.revenuePercentage - a.revenuePercentage);
  
  return {
    ticker: ticker.toUpperCase(),
    companyName,
    company: companyName,
    headquartersCountry: homeCountry,
    fiscalYear: new Date().getFullYear(),
    dataSource: `Sector-Specific Intelligent Estimate (${sector})`,
    segments: segments,
    lastUpdated: new Date().toISOString().split('T')[0],
    sector: sector
  };
}

/**
 * Main function with Company-Specific Override + SEC Filing Integration
 * ENSURES: ALL outputs are specific countries, NO regions
 */
export async function getCompanyGeographicExposure(
  ticker: string,
  companyName?: string,
  sector?: string,
  homeCountry?: string
): Promise<CompanyGeographicData> {
  let resolvedCompany = null;
  let sectorClassification: any;
  let adrResolutionInfo = null;
  
  const companySpecific = getCompanySpecificExposure(ticker);
  console.log(`\n[${ticker}] ========== MAIN FUNCTION START ==========`);
  console.log(`[${ticker}] Company-specific data found: ${!!companySpecific}`);
  if (companySpecific) {
    console.log(`[${ticker}] Company-specific name: ${companySpecific.companyName}`);
    console.log(`[${ticker}] Company-specific sector: ${companySpecific.sector}`);
  }
  
  if (!companyName || !sector || !homeCountry) {
    resolvedCompany = await resolveTickerMultiSource(ticker);
    
    if (!resolvedCompany) {
      const geoData = getCompanyGeographicExposureSync(ticker, companyName || ticker, sector || 'Technology', homeCountry || 'United States');
      const multiplier = sectorClassificationService.getSectorMultiplier(sector || 'Technology');
      
      return {
        ...geoData,
        company: geoData.company || geoData.companyName,
        sector: geoData.sector || sector || 'Technology',
        sectorMultiplier: multiplier,
        hasVerifiedData: hasCompanySpecificExposure(ticker),
        homeCountry: homeCountry || 'United States'
      };
    }
    
    const apiCountry = resolvedCompany.country;
    const adrCheck = resolveADRCountry(ticker, resolvedCompany.name, apiCountry, resolvedCompany.exchange);
    adrResolutionInfo = {
      isADR: adrCheck.isADR,
      confidence: adrCheck.confidence,
      source: adrCheck.source
    };
  }
  
  const finalTicker = resolvedCompany?.ticker || ticker;
  const finalName = companySpecific?.companyName || resolvedCompany?.name || companyName || ticker;
  const finalCountry = companySpecific?.homeCountry || resolvedCompany?.country || homeCountry || 'United States';
  const apiSector = resolvedCompany?.sector || sector;
  const apiIndustry = resolvedCompany?.industry;
  const apiDescription = resolvedCompany?.description;
  
  console.log(`[${ticker}] Final name resolution:`);
  console.log(`[${ticker}]   - companySpecific?.companyName: ${companySpecific?.companyName}`);
  console.log(`[${ticker}]   - resolvedCompany?.name: ${resolvedCompany?.name}`);
  console.log(`[${ticker}]   - companyName param: ${companyName}`);
  console.log(`[${ticker}]   - ticker: ${ticker}`);
  console.log(`[${ticker}]   - FINAL NAME: ${finalName}`);
  
  try {
    sectorClassification = await sectorClassificationService.classifySector(finalTicker, finalName, apiSector, apiIndustry, apiDescription);
  } catch (error) {
    console.error('Error classifying sector:', error);
    sectorClassification = {
      sector: apiSector || 'Technology',
      multiplier: sectorClassificationService.getSectorMultiplier(apiSector || 'Technology'),
      confidence: 0,
      sources: []
    };
  }
  
  const finalSector = companySpecific?.sector || sectorClassification?.sector || 'Technology';
  const sectorMultiplier = sectorClassification?.multiplier || 1.0;
  
  console.log(`[${ticker}] Final sector resolution:`);
  console.log(`[${ticker}]   - companySpecific?.sector: ${companySpecific?.sector}`);
  console.log(`[${ticker}]   - sectorClassification?.sector: ${sectorClassification?.sector}`);
  console.log(`[${ticker}]   - FINAL SECTOR: ${finalSector}`);
  
  console.log(`\n[${finalTicker}] ========================================`);
  console.log(`[${finalTicker}] PHASE 3.0: COMPANY-SPECIFIC + SEC FILING INTEGRATION`);
  console.log(`[${finalTicker}] ========================================`);
  
  const isADRHomeCountry = adrResolutionInfo?.isADR && adrResolutionInfo.confidence === 'high';
  
  const { channelBreakdown, secIntegration, usedCompanySpecific } = await calculateIndependentChannelExposuresWithSEC(
    finalTicker,
    finalName,
    finalSector,
    finalCountry,
    isADRHomeCountry
  );
  
  const geoData = getCompanyGeographicExposureSync(finalTicker, finalName, finalSector, finalCountry);
  
  const validation = dataQualityValidator.validateGeographicExposure(geoData.segments, channelBreakdown, finalCountry);
  
  console.log('[Phase 3.0] Data Quality Report:');
  console.log(dataQualityValidator.generateQualityReport(validation));
  
  const finalResult = {
    ...geoData,
    company: finalName,
    companyName: finalName,
    sector: finalSector,
    sectorMultiplier: sectorMultiplier,
    hasVerifiedData: usedCompanySpecific,
    hasDetailedComponents: usedCompanySpecific,
    sectorClassificationConfidence: sectorClassification?.confidence,
    sectorClassificationSources: sectorClassification?.sources || [],
    homeCountry: finalCountry,
    channelBreakdown,
    adrResolution: adrResolutionInfo || undefined,
    secFilingIntegration: secIntegration ? {
      revenueTableFound: secIntegration.revenueTableFound,
      ppeTableFound: secIntegration.ppeTableFound,
      debtTableFound: secIntegration.debtTableFound,
      supplierListFound: secIntegration.supplierListFound,
      revenueEvidenceLevel: secIntegration.revenueEvidenceLevel,
      supplyEvidenceLevel: secIntegration.supplyEvidenceLevel,
      assetsEvidenceLevel: secIntegration.assetsEvidenceLevel,
      financialEvidenceLevel: secIntegration.financialEvidenceLevel,
      validationResults: secIntegration.validationResults,
      sectionsFound: secIntegration.secFilingData?.sectionsFound || []
    } : undefined
  };
  
  console.log(`[${ticker}] ========== FINAL RESULT ==========`);
  console.log(`[${ticker}] Returning company name: ${finalResult.company}`);
  console.log(`[${ticker}] Returning companyName: ${finalResult.companyName}`);
  console.log(`[${ticker}] Returning sector: ${finalResult.sector}`);
  console.log(`[${ticker}] ========================================\n`);
  
  return finalResult;
}

export function getDataSourceInfo(ticker: string): {
  hasVerifiedData: boolean;
  dataSource: string;
  lastUpdated?: string;
  polygonAvailable: boolean;
  secEdgarAvailable: boolean;
  alphaVantageAvailable: boolean;
} {
  const companySpecific = getCompanySpecificExposure(ticker);
  
  return {
    hasVerifiedData: !!companySpecific,
    dataSource: companySpecific ? companySpecific.dataSource : 'SEC Filing Integration + Sector-Specific Fallback',
    lastUpdated: companySpecific?.lastUpdated,
    polygonAvailable: true,
    secEdgarAvailable: true,
    alphaVantageAvailable: true
  };
}