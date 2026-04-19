/**
 * Structured Data Integrator
 *
 * Integrates SEC filing structured data with the four-channel exposure calculation.
 * Implements EXPOSURE PARSING DECISION TREES - Evidence Hierarchy.
 *
 * V5 WIRING (GAP 1 FIX): All four channel integration functions now delegate to
 * the V5 equivalents from structuredDataIntegratorV5.ts. The old functions are
 * preserved as named exports for backward compatibility but are no longer the
 * primary execution path.
 *
 * Priority Order:
 * 1. Structured Evidence (Primary) - SEC tables, Exhibit 21, Sustainability Reports
 * 2. Narrative Evidence (Secondary) - SEC narrative sections
 * 3. Segment-Specific Fallback (SSF) - Region membership fully known
 * 4. Restricted Fallback (RF) - Geography partially known but ambiguous
 * 5. Global Fallback (GF) - Region membership completely unknown
 *
 * CHANGELOG:
 * - 2025-12-09: Integrated Exhibit 21 subsidiary data for operations/assets channels
 * - 2025-12-09: Integrated Sustainability Reports for supply chain, operations, and assets channels (Phase 2)
 * - 2026-03-23: V5 wiring — all channels now route through V5 integrators (GAP 1 fix)
 * - 2026-03-23: Added `tier` field to IntegratedChannelData (GAP 2 fix)
 */

import { parseSECFiling, ParsedSECData, RevenueSegment, PPESegment, DebtSecurity, SupplierLocation, FacilityLocation } from './secFilingParser';
import {
  isKnownRegion,
  getRegionCountries,
  decideFallback,
  FallbackDecision
} from './fallbackLogic';
import {
  calculateSegmentFallback,
  getSegmentRegionDefinition,
  isSegmentRegion
} from './revenueSegmentFallback';
import {
  calculateSupplyChainExposure,
  extractSupplyCountriesFromNarrative,
  validateSupplyChainExposure
} from './supplyChainFallback';
import {
  calculatePhysicalAssetsExposure,
  validatePhysicalAssetsExposure
} from './physicalAssetsFallback';
import {
  calculateFinancialExposure,
  validateFinancialExposure
} from './financialExposureFallback';
import { isActualCountry, normalizeCountryName } from './countryValidator';
import { exhibit21ToChannelWeights } from './dataIntegration/exhibit21Parser';
import {
  fetchSustainabilityReport,
  parseSustainabilityReport,
  sustainabilityToChannelWeights,
  SustainabilityReportData
} from './dataIntegration/sustainabilityReportParser';

// GAP 1 FIX: Import V5 channel integrators — these are now the primary execution path
import {
  integrateRevenueChannelV5,
  integrateSupplyChannelV5,
  integrateAssetsChannelV5,
  integrateFinancialChannelV5,
  type IntegratedChannelDataV5,
} from './v5/structuredDataIntegratorV5';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IntegratedChannelData {
  country: string;
  weight: number;
  state: 'known-zero' | 'known-positive' | 'unknown';
  status: 'evidence' | 'high_confidence_estimate' | 'fallback';
  source: string;
  dataQuality: 'high' | 'medium' | 'low';
  evidenceType: 'structured_table' | 'narrative' | 'fallback' | 'exhibit_21' | 'sustainability_report';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  /**
   * GAP 2 FIX (Step 1.5): Evidence tier label.
   *   DIRECT    — explicitly disclosed in filing (structured_table, no fallback)
   *   ALLOCATED — derived from structural constraint (region total → prior allocation)
   *   MODELED   — prior-based inference, no direct constraint
   * Defaults to 'MODELED' for backward-compatible channel data that predates V5.
   */
  tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED';
  rawData?: RevenueSegment | PPESegment | DebtSecurity | SupplierLocation | FacilityLocation;
}

/**
 * Convert V5 IntegratedChannelDataV5 to the main IntegratedChannelData shape.
 * This bridges the V5 integrators (which return IntegratedChannelDataV5) with
 * the existing IntegratedExposureData interface consumed by the rest of the app.
 */
function fromV5(v5: IntegratedChannelDataV5): IntegratedChannelData {
  return {
    country: v5.country,
    weight: v5.weight,
    state: v5.state,
    status: v5.status,
    source: v5.source,
    dataQuality: v5.dataQuality,
    evidenceType: v5.evidenceType,
    fallbackType: v5.fallbackType,
    tier: v5.tier,
    rawData: v5.rawData as RevenueSegment | PPESegment | undefined,
  };
}

function v5ChannelToMain(
  v5Channel: Record<string, IntegratedChannelDataV5>
): Record<string, IntegratedChannelData> {
  const result: Record<string, IntegratedChannelData> = {};
  for (const [country, data] of Object.entries(v5Channel)) {
    result[country] = fromV5(data);
  }
  return result;
}

export interface IntegratedExposureData {
  ticker: string;
  
  // Revenue channel (Wᵣ)
  revenueChannel: Record<string, IntegratedChannelData>;
  revenueEvidenceLevel: 'structured' | 'narrative' | 'fallback';
  revenueTableFound: boolean;
  revenueFallbackType?: 'SSF' | 'RF' | 'GF';
  
  // Supply chain channel (Wₛ)
  supplyChannel: Record<string, IntegratedChannelData>;
  supplyEvidenceLevel: 'structured' | 'narrative' | 'fallback';
  supplyListFound: boolean;
  supplyFallbackType?: 'SSF' | 'RF' | 'GF';
  sustainabilityReportFound: boolean;
  
  // Physical assets channel (Wₚ)
  assetsChannel: Record<string, IntegratedChannelData>;
  assetsEvidenceLevel: 'structured' | 'narrative' | 'fallback';
  ppeTableFound: boolean;
  assetsFallbackType?: 'SSF' | 'RF' | 'GF';
  exhibit21Found: boolean;
  
  // Financial channel (W𝒻)
  financialChannel: Record<string, IntegratedChannelData>;
  financialEvidenceLevel: 'structured' | 'narrative' | 'fallback';
  debtTableFound: boolean;
  financialFallbackType?: 'SSF' | 'RF' | 'GF';
  
  // Metadata
  secFilingData?: ParsedSECData;
  sustainabilityReportData?: SustainabilityReportData;
  integrationTimestamp: string;
  validationResults: ValidationResult[];
}

export interface ValidationResult {
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// REVENUE CHANNEL INTEGRATION (Wᵣ)
// ============================================================================

/**
 * Integrate revenue data following EXPOSURE PARSING DECISION TREES
 *
 * FIXED: Now checks if segment is already a country before applying fallback
 * NEW: Can use Exhibit 21 as supplementary evidence for revenue channel
 *
 * @deprecated Fix 3: Direct callers of this function should use `integrateStructuredData`
 * instead, which routes through V5 integrators via `integrateRevenueChannelV5`.
 * This function is preserved only for backward-compatible named exports.
 * The primary execution path is: integrateStructuredData → integrateRevenueChannelV5 → fromV5.
 */
export function integrateRevenueChannel(
  secData: ParsedSECData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): { 
  channel: Record<string, IntegratedChannelData>; 
  evidenceLevel: 'structured' | 'narrative' | 'fallback'; 
  validations: ValidationResult[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
} {
  console.warn(
    `[structuredDataIntegrator] integrateRevenueChannel called directly for ${ticker}. ` +
    `This is a deprecated path — use integrateStructuredData() which routes through V5 integrators.`
  );
  
  const channel: Record<string, IntegratedChannelData> = {};
  const validations: ValidationResult[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;
  
  console.log(`\n[Revenue Integration] ========================================`);
  console.log(`[Revenue Integration] Integrating revenue data for ${ticker}`);
  console.log(`[Revenue Integration] ========================================`);
  
  if (secData?.revenueTableFound && secData.revenueSegments.length > 0) {
    console.log(`[Revenue Integration] ✅ STRUCTURED EVIDENCE FOUND`);
    evidenceLevel = 'structured';
    
    const countryAppearances = new Map<string, number>();
    
    for (const segment of secData.revenueSegments) {
      const regionName = segment.region;
      const segmentShare = segment.revenuePercentage / 100;
      
      // Check if this is already a specific country
      if (isActualCountry(regionName)) {
        const countryName = normalizeCountryName(regionName);
        console.log(`[Revenue Integration] ✅ DIRECT EVIDENCE: "${regionName}" is a country, using ${(segmentShare * 100).toFixed(2)}% directly`);
        
        countryAppearances.set(countryName, (countryAppearances.get(countryName) || 0) + 1);
        
        if (countryName in channel) {
          channel[countryName].weight += segmentShare;
        } else {
          channel[countryName] = {
            country: countryName,
            weight: segmentShare,
            state: 'known-positive',
            status: 'evidence',
            source: `SEC 10-K Revenue Segment: ${regionName} (${segment.fiscalYear}) - Direct Evidence`,
            dataQuality: 'high',
            evidenceType: 'structured_table',
            fallbackType: 'none',
            rawData: segment
          };
        }
      } else {
        // This is a region - apply segment-specific fallback
        console.log(`[Revenue Integration] Region "${regionName}" requires SSF distribution`);
        const segmentWeights = calculateSegmentFallback(regionName, segmentShare, ticker, sector);
        
        for (const [country, weight] of Object.entries(segmentWeights)) {
          if (weight > 0) {
            countryAppearances.set(country, (countryAppearances.get(country) || 0) + 1);
            
            if (country in channel) {
              channel[country].weight += weight;
            } else {
              channel[country] = {
                country,
                weight,
                state: 'known-positive',
                status: 'evidence',
                source: `SEC 10-K Revenue Segment: ${regionName} (${segment.fiscalYear}) - SSF`,
                dataQuality: 'high',
                evidenceType: 'structured_table',
                fallbackType: 'SSF',
                rawData: segment
              };
            }
          }
        }
        
        if (!fallbackType) {
          fallbackType = 'SSF';
        }
      }
    }
    
    let multipleAppearances = 0;
    for (const [country, count] of countryAppearances) {
      if (count > 1) {
        multipleAppearances++;
        validations.push({
          channel: 'revenue',
          rule: 'No country in multiple regions',
          passed: false,
          message: `${country} appears in ${count} regions`,
          severity: 'error'
        });
      }
    }
    
    if (multipleAppearances === 0) {
      validations.push({
        channel: 'revenue',
        rule: 'No country in multiple regions',
        passed: true,
        message: 'All countries appear in exactly one region',
        severity: 'info'
      });
    }
    
    const totalWeight = Object.values(channel).reduce((sum, data) => sum + data.weight, 0);
    const sumValid = Math.abs(totalWeight - 1.0) < 0.01;
    
    validations.push({
      channel: 'revenue',
      rule: 'Sum of weights = 1',
      passed: sumValid,
      message: `Total weight: ${(totalWeight * 100).toFixed(2)}%`,
      severity: sumValid ? 'info' : 'error'
    });
    
    validations.push({
      channel: 'revenue',
      rule: 'Structured table exists → Direct evidence or SSF used',
      passed: true,
      message: fallbackType === 'SSF' 
        ? 'Using segment-specific fallback (SSF) for regions only' 
        : 'Using direct evidence from country-specific segments',
      severity: 'info'
    });
    
  } else if (secData?.exhibit21Found && secData.exhibit21Data) {
    // NEW: Use Exhibit 21 as supplementary evidence for revenue channel
    console.log(`[Revenue Integration] ⚠️ No revenue table, using Exhibit 21 subsidiaries as proxy`);
    evidenceLevel = 'structured';
    fallbackType = 'none';
    
    const exhibit21Weights = exhibit21ToChannelWeights(secData.exhibit21Data, 'revenue');
    
    for (const [country, weight] of Object.entries(exhibit21Weights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'high_confidence_estimate',
        source: `Exhibit 21 Subsidiaries (${secData.exhibit21Data.totalSubsidiaries} total) - Revenue Proxy`,
        dataQuality: 'medium',
        evidenceType: 'exhibit_21',
        fallbackType: 'none'
      };
    }
    
    validations.push({
      channel: 'revenue',
      rule: 'Exhibit 21 used as revenue proxy',
      passed: true,
      message: `Using ${secData.exhibit21Data.totalSubsidiaries} subsidiaries across ${secData.exhibit21Data.countriesIdentified} countries`,
      severity: 'info'
    });
    
  } else {
    console.log(`[Revenue Integration] ⚠️ No structured revenue table or Exhibit 21 found`);
    evidenceLevel = 'fallback';
    fallbackType = 'GF';
    
    channel[homeCountry] = {
      country: homeCountry,
      weight: 0.85,
      state: 'known-positive',
      status: 'fallback',
      source: 'Home Country Estimate (No SEC Revenue Table)',
      dataQuality: 'low',
      evidenceType: 'fallback',
      fallbackType: 'GF'
    };
    
    validations.push({
      channel: 'revenue',
      rule: 'Structured evidence preferred',
      passed: false,
      message: 'No revenue segment table or Exhibit 21 found in SEC filing',
      severity: 'warning'
    });
  }
  
  console.log(`[Revenue Integration] Evidence level: ${evidenceLevel}`);
  console.log(`[Revenue Integration] Fallback type: ${fallbackType || 'none'}`);
  console.log(`[Revenue Integration] Countries: ${Object.keys(channel).length}\n`);
  
  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// SUPPLY CHAIN CHANNEL INTEGRATION (Wₛ) - PHASE 2 ENHANCED
// ============================================================================

/**
 * Integrate supply chain data following EXPOSURE PARSING DECISION TREES
 *
 * PHASE 2 ENHANCEMENT: Prioritizes sustainability report as PRIMARY evidence
 * Evidence Hierarchy:
 * 1. Sustainability Report (Tier 1/2/3 suppliers) - PRIMARY
 * 2. SEC Supplier List (structured) - SECONDARY
 * 3. SEC Narrative Evidence - TERTIARY
 * 4. Sector-Specific Fallback - LAST RESORT
 *
 * @deprecated Fix 3: Direct callers should use `integrateStructuredData` instead,
 * which routes through `integrateSupplyChannelV5`. This function is preserved only
 * for backward-compatible named exports.
 */
export async function integrateSupplyChannel(
  secData: ParsedSECData | null,
  sustainabilityData: SustainabilityReportData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): Promise<{ 
  channel: Record<string, IntegratedChannelData>; 
  evidenceLevel: 'structured' | 'narrative' | 'fallback'; 
  validations: ValidationResult[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
}> {
  console.warn(
    `[structuredDataIntegrator] integrateSupplyChannel called directly for ${ticker}. ` +
    `This is a deprecated path — use integrateStructuredData() which routes through V5 integrators.`
  );
  
  const channel: Record<string, IntegratedChannelData> = {};
  const validations: ValidationResult[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback' = 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;
  
  console.log(`\n[Supply Integration] ========================================`);
  console.log(`[Supply Integration] Integrating supply chain data for ${ticker}`);
  console.log(`[Supply Integration] ========================================`);
  
  // PHASE 2: Check sustainability report FIRST (highest priority)
  if (sustainabilityData && sustainabilityData.supplierData.length > 0) {
    console.log(`[Supply Integration] ✅ SUSTAINABILITY REPORT FOUND - USING AS PRIMARY EVIDENCE`);
    evidenceLevel = 'structured';
    fallbackType = 'none';
    
    const sustainabilityWeights = sustainabilityToChannelWeights(sustainabilityData, 'supply');
    
    for (const [country, weight] of Object.entries(sustainabilityWeights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `Sustainability Report ${sustainabilityData.reportYear} - Supplier Transparency (${sustainabilityData.totalTier1Suppliers} Tier 1 suppliers)`,
        dataQuality: 'high',
        evidenceType: 'sustainability_report',
        fallbackType: 'none'
      };
    }
    
    validations.push({
      channel: 'supply',
      rule: 'Sustainability report provides direct supplier evidence',
      passed: true,
      message: `Using ${sustainabilityData.supplierData.length} supplier entries from sustainability report (Tier 1: ${sustainabilityData.totalTier1Suppliers}, Tier 2: ${sustainabilityData.totalTier2Suppliers}, Tier 3: ${sustainabilityData.totalTier3Suppliers})`,
      severity: 'info'
    });
    
    console.log(`[Supply Integration] ✅ Sustainability Report: ${sustainabilityData.supplierData.length} supplier entries, ${sustainabilityData.countriesIdentified} countries`);
    
  } else {
    // Fall back to SEC evidence if no sustainability report
    const explicitCountries: Set<string> = new Set();
    const regions: Set<string> = new Set();
    
    if (secData?.supplierLocations && secData.supplierLocations.length > 0) {
      evidenceLevel = secData.supplierListFound ? 'structured' : 'narrative';
      
      for (const supplier of secData.supplierLocations) {
        explicitCountries.add(supplier.country);
      }
    }
    
    if (secData?.supplyChainNarrativeContext) {
      const narrativeEvidence = extractSupplyCountriesFromNarrative(secData.supplyChainNarrativeContext);
      
      narrativeEvidence.explicitCountries.forEach(c => explicitCountries.add(c));
      narrativeEvidence.regions.forEach(r => regions.add(r));
      
      if (narrativeEvidence.explicitCountries.length > 0 || narrativeEvidence.regions.length > 0) {
        if (evidenceLevel === 'fallback') {
          evidenceLevel = 'narrative';
        }
      }
    }
    
    if (explicitCountries.size > 0 || regions.size > 0) {
      const supplyWeights = calculateSupplyChainExposure(
        Array.from(explicitCountries),
        Array.from(regions),
        ticker,
        sector
      );
      
      // Determine fallback type: RF if partial evidence, SSF if full region
      fallbackType = regions.size > 0 ? 'SSF' : 'RF';
      
      for (const [country, weight] of Object.entries(supplyWeights)) {
        channel[country] = {
          country,
          weight,
          state: 'known-positive',
          status: 'evidence',
          source: `Supply Chain Evidence (${evidenceLevel})`,
          dataQuality: evidenceLevel === 'structured' ? 'high' : 'medium',
          evidenceType: evidenceLevel === 'structured' ? 'structured_table' : 'narrative',
          fallbackType
        };
      }
      
      const validation = validateSupplyChainExposure(supplyWeights, ticker, sector);
      
      validations.push({
        channel: 'supply',
        rule: 'At least one supply region detected',
        passed: true,
        message: `Found ${Object.keys(channel).length} supply countries (Fallback: ${fallbackType})`,
        severity: 'info'
      });
      
      validations.push({
        channel: 'supply',
        rule: 'Sum of weights = 1',
        passed: validation.passed,
        message: validation.errors.length > 0 ? validation.errors.join('; ') : 'Total weight is 100%',
        severity: validation.passed ? 'info' : 'error'
      });
      
      for (const warning of validation.warnings) {
        validations.push({
          channel: 'supply',
          rule: 'Supply chain pattern validation',
          passed: true,
          message: warning,
          severity: 'warning'
        });
      }
      
    } else {
      evidenceLevel = 'fallback';
      fallbackType = 'RF';
      
      const supplyWeights = calculateSupplyChainExposure([], [], ticker, sector);
      
      for (const [country, weight] of Object.entries(supplyWeights)) {
        channel[country] = {
          country,
          weight,
          state: 'unknown',
          status: 'fallback',
          source: `Sector-Specific Supply Chain Fallback (${sector})`,
          dataQuality: 'low',
          evidenceType: 'fallback',
          fallbackType: 'RF'
        };
      }
      
      validations.push({
        channel: 'supply',
        rule: 'Supplier evidence preferred',
        passed: false,
        message: 'No supplier locations found in SEC filing or sustainability report',
        severity: 'warning'
      });
    }
  }
  
  validations.push({
    channel: 'supply',
    rule: 'Supply chain uses RF/SSF only',
    passed: true,
    message: `Using ${fallbackType === 'SSF' ? 'segment-specific' : fallbackType === 'none' ? 'direct evidence' : 'restricted'} fallback (NOT global)`,
    severity: 'info'
  });
  
  console.log(`[Supply Integration] Evidence level: ${evidenceLevel}`);
  console.log(`[Supply Integration] Fallback type: ${fallbackType || 'none'}`);
  console.log(`[Supply Integration] Countries: ${Object.keys(channel).length}\n`);
  
  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// PHYSICAL ASSETS CHANNEL INTEGRATION (Wₚ) - PHASE 2 ENHANCED
// ============================================================================

/**
 * Integrate physical assets data following EXPOSURE PARSING DECISION TREES
 *
 * PHASE 2 ENHANCEMENT: Adds sustainability report facility data as TERTIARY evidence
 * Evidence Hierarchy:
 * 1. Exhibit 21 Subsidiaries - PRIMARY
 * 2. PP&E Geographic Table - SECONDARY
 * 3. Sustainability Report Facilities - TERTIARY
 * 4. SEC Facility Locations (narrative) - QUATERNARY
 * 5. Sector-Specific Fallback - LAST RESORT
 *
 * @deprecated Fix 3: Direct callers should use `integrateStructuredData` instead,
 * which routes through `integrateAssetsChannelV5`. This function is preserved only
 * for backward-compatible named exports.
 */
export async function integrateAssetsChannel(
  secData: ParsedSECData | null,
  sustainabilityData: SustainabilityReportData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): Promise<{ 
  channel: Record<string, IntegratedChannelData>; 
  evidenceLevel: 'structured' | 'narrative' | 'fallback'; 
  validations: ValidationResult[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
}> {
  console.warn(
    `[structuredDataIntegrator] integrateAssetsChannel called directly for ${ticker}. ` +
    `This is a deprecated path — use integrateStructuredData() which routes through V5 integrators.`
  );
  
  const channel: Record<string, IntegratedChannelData> = {};
  const validations: ValidationResult[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;
  
  console.log(`\n[Assets Integration] ========================================`);
  console.log(`[Assets Integration] Integrating physical assets data for ${ticker}`);
  console.log(`[Assets Integration] ========================================`);
  
  // Priority 1: Exhibit 21 (PRIMARY)
  if (secData?.exhibit21Found && secData.exhibit21Data && secData.exhibit21Data.totalSubsidiaries > 0) {
    console.log(`[Assets Integration] ✅ EXHIBIT 21 FOUND - USING AS PRIMARY EVIDENCE`);
    evidenceLevel = 'structured';
    fallbackType = 'none';
    
    const exhibit21Weights = exhibit21ToChannelWeights(secData.exhibit21Data, 'assets');
    
    for (const [country, weight] of Object.entries(exhibit21Weights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `Exhibit 21 Subsidiaries (${secData.exhibit21Data.subsidiariesByCountry.find(c => c.country === country)?.subsidiaryCount || 0} subsidiaries)`,
        dataQuality: 'high',
        evidenceType: 'exhibit_21',
        fallbackType: 'none'
      };
    }
    
    validations.push({
      channel: 'assets',
      rule: 'Exhibit 21 provides direct subsidiary evidence',
      passed: true,
      message: `Using ${secData.exhibit21Data.totalSubsidiaries} subsidiaries across ${secData.exhibit21Data.countriesIdentified} countries (100% confidence)`,
      severity: 'info'
    });
    
    console.log(`[Assets Integration] ✅ Exhibit 21: ${secData.exhibit21Data.totalSubsidiaries} subsidiaries, ${secData.exhibit21Data.countriesIdentified} countries`);
    
  } else if (secData?.ppeTableFound && secData.ppeSegments.length > 0) {
    // Priority 2: PP&E Table (SECONDARY)
    console.log(`[Assets Integration] ✅ STRUCTURED PP&E TABLE FOUND`);
    evidenceLevel = 'structured';
    fallbackType = 'SSF';
    
    for (const segment of secData.ppeSegments) {
      const regionName = segment.region;
      const ppePercentage = segment.ppePercentage;
      
      // Check if this is already a specific country
      if (isActualCountry(regionName)) {
        const countryName = normalizeCountryName(regionName);
        console.log(`[Assets Integration] ✅ DIRECT EVIDENCE: "${regionName}" is a country, using ${ppePercentage.toFixed(2)}% directly`);
        
        channel[countryName] = {
          country: countryName,
          weight: ppePercentage / 100,
          state: 'known-positive',
          status: 'evidence',
          source: `SEC 10-K PP&E Geographic Table - ${segment.fiscalYear} - Direct Evidence`,
          dataQuality: 'high',
          evidenceType: 'structured_table',
          fallbackType: 'none',
          rawData: segment
        };
      } else {
        // This is a region - apply segment-specific fallback
        console.log(`[Assets Integration] Region "${regionName}" requires SSF distribution`);
        let countries: string[] = [];
        
        if (isKnownRegion(regionName)) {
          const regionCountries = getRegionCountries(regionName);
          if (regionCountries) {
            countries = regionCountries;
          }
        } else {
          countries = [regionName];
        }
        
        const perCountryWeight = (ppePercentage / 100) / countries.length;
        
        for (const country of countries) {
          channel[country] = {
            country,
            weight: perCountryWeight,
            state: 'known-positive',
            status: 'evidence',
            source: `SEC 10-K PP&E Geographic Table - ${segment.fiscalYear} - SSF`,
            dataQuality: 'high',
            evidenceType: 'structured_table',
            fallbackType: 'SSF',
            rawData: segment
          };
        }
      }
    }
    
    validations.push({
      channel: 'assets',
      rule: 'PP&E anchors preserved',
      passed: true,
      message: 'Structured PP&E data used as primary evidence (direct or SSF)',
      severity: 'info'
    });
    
  } else if (sustainabilityData && sustainabilityData.facilities.length > 0) {
    // PHASE 2: Priority 3: Sustainability Report Facilities (TERTIARY)
    console.log(`[Assets Integration] ✅ SUSTAINABILITY REPORT FACILITIES FOUND`);
    evidenceLevel = 'structured';
    fallbackType = 'none';
    
    const sustainabilityWeights = sustainabilityToChannelWeights(sustainabilityData, 'assets');
    
    for (const [country, weight] of Object.entries(sustainabilityWeights)) {
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'high_confidence_estimate',
        source: `Sustainability Report ${sustainabilityData.reportYear} - Facility Locations (${sustainabilityData.totalFacilities} facilities)`,
        dataQuality: 'medium',
        evidenceType: 'sustainability_report',
        fallbackType: 'none'
      };
    }
    
    validations.push({
      channel: 'assets',
      rule: 'Sustainability report provides facility evidence',
      passed: true,
      message: `Using ${sustainabilityData.totalFacilities} facilities from sustainability report across ${sustainabilityData.countriesIdentified} countries`,
      severity: 'info'
    });
    
    console.log(`[Assets Integration] ✅ Sustainability Report: ${sustainabilityData.totalFacilities} facilities, ${sustainabilityData.countriesIdentified} countries`);
    
  } else if (secData?.facilityLocations && secData.facilityLocations.length > 0) {
    // Priority 4: SEC Facility Locations (QUATERNARY)
    console.log(`[Assets Integration] ✅ FACILITY LOCATIONS FOUND (NARRATIVE)`);
    evidenceLevel = 'narrative';
    fallbackType = 'none';
    
    const countryFacilities = new Map<string, number>();
    for (const facility of secData.facilityLocations) {
      countryFacilities.set(facility.country, (countryFacilities.get(facility.country) || 0) + 1);
    }
    
    const totalFacilities = secData.facilityLocations.length;
    
    for (const [country, count] of countryFacilities) {
      const weight = count / totalFacilities;
      
      channel[country] = {
        country,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `SEC Item 2 Properties (${count} facilities)`,
        dataQuality: 'medium',
        evidenceType: 'narrative',
        fallbackType: 'none'
      };
    }
    
  } else {
    // Priority 5: Fallback (LAST RESORT)
    console.log(`[Assets Integration] ⚠️ No PP&E, facility, sustainability, or Exhibit 21 evidence found`);
    evidenceLevel = 'fallback';
    fallbackType = 'RF';
    
    const assetWeights = calculatePhysicalAssetsExposure(ticker, sector);
    
    for (const [country, weight] of Object.entries(assetWeights)) {
      channel[country] = {
        country,
        weight,
        state: 'unknown',
        status: 'fallback',
        source: `Sector-Specific Asset Priors (${sector})`,
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'RF'
      };
    }
    
    validations.push({
      channel: 'assets',
      rule: 'PP&E, Exhibit 21, or sustainability report evidence preferred',
      passed: false,
      message: 'No PP&E table, facility locations, sustainability report, or Exhibit 21 found',
      severity: 'warning'
    });
  }
  
  console.log(`[Assets Integration] Evidence level: ${evidenceLevel}`);
  console.log(`[Assets Integration] Fallback type: ${fallbackType || 'none'}`);
  console.log(`[Assets Integration] Countries: ${Object.keys(channel).length}\n`);
  
  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// FINANCIAL CHANNEL INTEGRATION (W𝒻)
// ============================================================================

/**
 * Integrate financial exposure data following EXPOSURE PARSING DECISION TREES
 *
 * W𝒻 uses direct evidence from debt securities + global fallback for unspecified portions
 *
 * @deprecated Fix 3: Direct callers should use `integrateStructuredData` instead,
 * which routes through `integrateFinancialChannelV5`. This function is preserved only
 * for backward-compatible named exports.
 */
export function integrateFinancialChannel(
  secData: ParsedSECData | null,
  homeCountry: string,
  sector: string,
  ticker: string
): { 
  channel: Record<string, IntegratedChannelData>; 
  evidenceLevel: 'structured' | 'narrative' | 'fallback'; 
  validations: ValidationResult[];
  fallbackType?: 'SSF' | 'RF' | 'GF';
} {
  console.warn(
    `[structuredDataIntegrator] integrateFinancialChannel called directly for ${ticker}. ` +
    `This is a deprecated path — use integrateStructuredData() which routes through V5 integrators.`
  );
  
  const channel: Record<string, IntegratedChannelData> = {};
  const validations: ValidationResult[] = [];
  let evidenceLevel: 'structured' | 'narrative' | 'fallback';
  let fallbackType: 'SSF' | 'RF' | 'GF' | undefined;
  
  console.log(`\n[Financial Integration] ========================================`);
  console.log(`[Financial Integration] Integrating financial exposure data for ${ticker}`);
  console.log(`[Financial Integration] ========================================`);
  
  // Check for Note 4 international exposure confirmation
  let hasInternationalExposure = false;
  if (secData?.financialInstrumentsNote) {
    console.log(`[Financial Integration] ✅ Note 4 Financial Instruments found`);
    console.log(`[Financial Integration] Confirms international financial exposure`);
    hasInternationalExposure = true;
  }
  
  if (secData?.debtTableFound && secData.debtSecurities.length > 0) {
    console.log(`[Financial Integration] ✅ STRUCTURED DEBT TABLE FOUND`);
    evidenceLevel = 'structured';
    fallbackType = 'none';
    
    const jurisdictionAmounts = new Map<string, number>();
    let totalPrincipal = 0;
    
    for (const security of secData.debtSecurities) {
      const amount = security.principalAmount;
      jurisdictionAmounts.set(
        security.jurisdiction,
        (jurisdictionAmounts.get(security.jurisdiction) || 0) + amount
      );
      totalPrincipal += amount;
    }
    
    for (const [jurisdiction, amount] of jurisdictionAmounts) {
      const weight = amount / totalPrincipal;
      
      channel[jurisdiction] = {
        country: jurisdiction,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: `SEC Debt Securities Table`,
        dataQuality: 'high',
        evidenceType: 'structured_table',
        fallbackType: 'none'
      };
    }
    
    validations.push({
      channel: 'financial',
      rule: 'At least one direct-evidence jurisdiction',
      passed: true,
      message: `Found ${jurisdictionAmounts.size} debt issuance jurisdictions`,
      severity: 'info'
    });
    
  } else if (secData?.treasuryCenters && secData.treasuryCenters.length > 0) {
    console.log(`[Financial Integration] ✅ TREASURY CENTERS FOUND (NARRATIVE)`);
    evidenceLevel = 'narrative';
    fallbackType = 'none';
    
    const weight = 1.0 / secData.treasuryCenters.length;
    
    for (const center of secData.treasuryCenters) {
      channel[center] = {
        country: center,
        weight,
        state: 'known-positive',
        status: 'evidence',
        source: 'SEC Filing Treasury Center Mention',
        dataQuality: 'medium',
        evidenceType: 'narrative',
        fallbackType: 'none'
      };
    }
    
  } else {
    console.log(`[Financial Integration] ⚠️ No debt or treasury evidence found`);
    evidenceLevel = 'fallback';
    fallbackType = 'GF';
    
    const financialWeights = calculateFinancialExposure(ticker, hasInternationalExposure);
    
    for (const [country, weight] of Object.entries(financialWeights)) {
      channel[country] = {
        country,
        weight,
        state: 'unknown',
        status: 'fallback',
        source: 'Financial Depth Priors (No SEC Debt Data)',
        dataQuality: 'low',
        evidenceType: 'fallback',
        fallbackType: 'GF'
      };
    }
    
    validations.push({
      channel: 'financial',
      rule: 'Debt evidence preferred',
      passed: false,
      message: 'No debt securities or treasury centers found',
      severity: 'warning'
    });
  }
  
  validations.push({
    channel: 'financial',
    rule: 'Financial channel uses GF only (never SSF/RF)',
    passed: true,
    message: 'Using direct evidence + global fallback only (NOT segment/restricted fallback)',
    severity: 'info'
  });
  
  console.log(`[Financial Integration] Evidence level: ${evidenceLevel}`);
  console.log(`[Financial Integration] Fallback type: ${fallbackType || 'none'}`);
  console.log(`[Financial Integration] Countries: ${Object.keys(channel).length}\n`);
  
  return { channel, evidenceLevel, validations, fallbackType };
}

// ============================================================================
// MAIN INTEGRATION FUNCTION (PHASE 2 ENHANCED)
// ============================================================================

/**
 * Integrate all SEC filing data + sustainability reports into four-channel exposure calculation
 * 
 * PHASE 2: Automatically fetches and parses sustainability reports for enhanced evidence
 */
export async function integrateStructuredData(
  ticker: string,
  homeCountry: string,
  sector: string,
  options: {
    fetchSustainabilityReport?: boolean;
    sustainabilityReportYear?: number;
  } = {}
): Promise<IntegratedExposureData> {
  
  console.log(`\n[Structured Data Integration] ========================================`);
  console.log(`[Structured Data Integration] Starting integration for ${ticker}`);
  console.log(`[Structured Data Integration] Home Country: ${homeCountry}`);
  console.log(`[Structured Data Integration] Sector: ${sector}`);
  console.log(`[Structured Data Integration] ========================================\n`);
  
  const secData = await parseSECFiling(ticker);
  
  // PHASE 2: Fetch sustainability report if enabled (default: true)
  let sustainabilityData: SustainabilityReportData | null = null;
  
  if (options.fetchSustainabilityReport !== false) {
    console.log(`\n[Structured Data Integration] Attempting to fetch sustainability report...`);
    
    try {
      const reportResult = await fetchSustainabilityReport(ticker, options.sustainabilityReportYear);
      
      if (reportResult) {
        console.log(`[Structured Data Integration] ✅ Sustainability report found, parsing...`);
        sustainabilityData = await parseSustainabilityReport(
          ticker,
          options.sustainabilityReportYear || new Date().getFullYear() - 1,
          reportResult.content,
          reportResult.fileType,
          reportResult.url
        );
        
        console.log(`[Structured Data Integration] ✅ Sustainability report parsed: ${sustainabilityData.countriesIdentified} countries, ${sustainabilityData.dataCompleteness * 100}% complete`);
      } else {
        console.log(`[Structured Data Integration] ⚠️ No sustainability report found for ${ticker}`);
      }
    } catch (error) {
      console.error(`[Structured Data Integration] ❌ Error fetching sustainability report:`, error);
    }
  }
  
  // GAP 1 FIX: Route all four channels through V5 integrators.
  // V5 integrators implement Steps 1.2–1.5 (region priors, admissible sets,
  // coverage checks, DIRECT/ALLOCATED/MODELED tier labelling).
  console.log(`\n[Structured Data Integration] 🔀 Routing to V5 channel integrators...`);

  const revenueV5 = integrateRevenueChannelV5(secData, homeCountry, sector, ticker);
  const supplyV5 = await integrateSupplyChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
  const assetsV5 = await integrateAssetsChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
  const financialV5 = integrateFinancialChannelV5(secData, homeCountry, sector, ticker);

  // Bridge V5 output to the existing IntegratedChannelData shape
  const revenueResult = {
    channel: v5ChannelToMain(revenueV5.channel),
    evidenceLevel: revenueV5.evidenceLevel,
    validations: revenueV5.validations as ValidationResult[],
    fallbackType: revenueV5.fallbackType,
  };
  const supplyResult = {
    channel: v5ChannelToMain(supplyV5.channel),
    evidenceLevel: supplyV5.evidenceLevel,
    validations: supplyV5.validations as ValidationResult[],
    fallbackType: supplyV5.fallbackType,
  };
  const assetsResult = {
    channel: v5ChannelToMain(assetsV5.channel),
    evidenceLevel: assetsV5.evidenceLevel,
    validations: assetsV5.validations as ValidationResult[],
    fallbackType: assetsV5.fallbackType,
  };
  const financialResult = {
    channel: v5ChannelToMain(financialV5.channel),
    evidenceLevel: financialV5.evidenceLevel,
    validations: financialV5.validations as ValidationResult[],
    fallbackType: financialV5.fallbackType,
  };
  
  const allValidations = [
    ...revenueResult.validations,
    ...supplyResult.validations,
    ...assetsResult.validations,
    ...financialResult.validations
  ];
  
  const result: IntegratedExposureData = {
    ticker,
    revenueChannel: revenueResult.channel,
    revenueEvidenceLevel: revenueResult.evidenceLevel,
    revenueTableFound: secData?.revenueTableFound || false,
    revenueFallbackType: revenueResult.fallbackType,
    supplyChannel: supplyResult.channel,
    supplyEvidenceLevel: supplyResult.evidenceLevel,
    supplyListFound: secData?.supplierListFound || false,
    supplyFallbackType: supplyResult.fallbackType,
    sustainabilityReportFound: sustainabilityData?.reportFound || false,
    assetsChannel: assetsResult.channel,
    assetsEvidenceLevel: assetsResult.evidenceLevel,
    ppeTableFound: secData?.ppeTableFound || false,
    assetsFallbackType: assetsResult.fallbackType,
    exhibit21Found: secData?.exhibit21Found || false,
    financialChannel: financialResult.channel,
    financialEvidenceLevel: financialResult.evidenceLevel,
    debtTableFound: secData?.debtTableFound || false,
    financialFallbackType: financialResult.fallbackType,
    secFilingData: secData || undefined,
    sustainabilityReportData: sustainabilityData || undefined,
    integrationTimestamp: new Date().toISOString(),
    validationResults: allValidations
  };
  
  // Fix 4: Channel distinctness guard — detect shared object references that would
  // cause channel override contamination (all four channels must be independent objects).
  if (
    result.revenueChannel === result.supplyChannel ||
    result.revenueChannel === result.assetsChannel ||
    result.revenueChannel === result.financialChannel ||
    result.supplyChannel === result.assetsChannel ||
    result.supplyChannel === result.financialChannel ||
    result.assetsChannel === result.financialChannel
  ) {
    console.warn('[StructuredDataIntegrator] CHANNEL LEAKAGE DETECTED: two or more channel objects share the same reference. This will cause channel override contamination.');
  }

  console.log(`\n[Structured Data Integration] ========================================`);
  console.log(`[Structured Data Integration] INTEGRATION COMPLETE`);
  console.log(`[Structured Data Integration] Revenue: ${revenueResult.evidenceLevel} (${Object.keys(revenueResult.channel).length} countries) [${revenueResult.fallbackType || 'none'}]`);
  console.log(`[Structured Data Integration] Supply: ${supplyResult.evidenceLevel} (${Object.keys(supplyResult.channel).length} countries) [${supplyResult.fallbackType || 'none'}]`);
  if (sustainabilityData?.reportFound) {
    console.log(`[Structured Data Integration] Sustainability Report: ${sustainabilityData.supplierData.length} supplier entries, ${sustainabilityData.totalFacilities} facilities`);
  }
  console.log(`[Structured Data Integration] Assets: ${assetsResult.evidenceLevel} (${Object.keys(assetsResult.channel).length} countries) [${assetsResult.fallbackType || 'none'}]`);
  if (secData?.exhibit21Found) {
    console.log(`[Structured Data Integration] Exhibit 21: ${secData.exhibit21Data?.totalSubsidiaries} subsidiaries in ${secData.exhibit21Data?.countriesIdentified} countries`);
  }
  console.log(`[Structured Data Integration] Financial: ${financialResult.evidenceLevel} (${Object.keys(financialResult.channel).length} countries) [${financialResult.fallbackType || 'none'}]`);
  console.log(`[Structured Data Integration] Total validations: ${allValidations.length}`);
  console.log(`[Structured Data Integration] Failed validations: ${allValidations.filter(v => !v.passed).length}`);
  console.log(`[Structured Data Integration] ========================================\n`);
  
  return result;
}

// ============================================================================
// EXPORT
// ============================================================================

export const structuredDataIntegrator = {
  integrateStructuredData,
  integrateRevenueChannel,
  integrateSupplyChannel,
  integrateAssetsChannel,
  integrateFinancialChannel
};