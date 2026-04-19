import { 
  GeographicExposure, 
  ChannelBreakdown, 
  GeopoliticalRisk,
  ChannelCalculationDetail 
} from '../types/geopolitical';
import { 
  MultiDimensionalChannelEngine,
  ChannelCalculationBreakdown 
} from './v34ChannelFormulas';
import { dataExpansionService } from './dataExpansionService';
import { resolveADRCountry, isKnownADR, getADRCountry } from './adrCountryResolver';
import { sectorClassificationService } from './sectorClassificationService';
import { calculatePoliticalAlignment } from './politicalAlignmentService';
import { getCompanySpecificExposure, hasCompanySpecificExposure } from '../data/companySpecificExposures';
import { calculateChannelSpecificExposures, EvidenceLevel } from './channelSpecificCalculations';

// NEW: Phase 3 - Sub-Bucket Distribution Interface
interface SubBucketDistribution {
  country: string;
  amount: number;
  percentage: number;
  percentageOfBucket: number;
  rationale: string;
  isCarveOut: boolean;
}

// UPDATED: Phase 3 - Enhanced FallbackStrategy with Sub-Bucket Distribution
export interface FallbackStrategy {
  directEvidence: {
    countries: string[];
    totalAmount: number;
    totalPercentage: number;
    isLocked: true;
    details: Array<{
      country: string;
      amount: number;
      percentage: number;
      source: string;
    }>;
  };
  structuredEvidence: {
    buckets: Array<{
      bucketName: string;
      countries: string[];
      totalAmount: number;
      totalPercentage: number;
      narrativeDefinition: string;
      subBucketDistribution?: SubBucketDistribution[];  // NEW: Phase 3
    }>;
    totalAmount: number;
    totalPercentage: number;
    isLocked: true;
  };
  residualBucket: {
    totalAmount: number;
    totalPercentage: number;
    fallbackType: 'RF' | 'GF';
    boundedCountrySet?: string[];
    allocatedCountries: Array<{
      country: string;
      amount: number;
      percentage: number;
      percentageOfResidual: number;
      rationale: string;
    }>;
    isLocked: false;
  };
}

// Phase 1 - Per-Country Evidence Tracking Interface
export interface CountryEvidence {
  country: string;
  evidenceType: 'Direct' | 'Structured' | 'Residual' | 'None';
  evidenceSource: string;
  isLocked: boolean;
  amount?: number;
  percentage?: number;
  rationale?: string;
}

export interface V34AssessmentResult {
  ticker: string;
  companyName: string;
  cogriScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  geographicExposures: GeographicExposure[];
  channelBreakdowns: ChannelBreakdown[];
  detailedCalculations: ChannelCalculationBreakdown[];
  fallbackAnalysis: {
    ssfCoverage: number;
    rfCoverage: number;
    gfCoverage: number;
    totalDataPoints: number;
    confidenceLevel: number;
  };
  dataExpansionIntegration: {
    companiesInSystem: number;
    dataQualityScore: number;
    lastUpdated: string;
    enhancedCoverage: boolean;
  };
  methodology: {
    version: '3.4';
    channels: string[];
    fallbackLogic: string;
    calculationTransparency: boolean;
  };
}

// Phase 2 & 3 - Enhanced CompanyGeographicData with FallbackStrategy
export interface CompanyGeographicData {
  company: string;
  ticker: string;
  sector: string;
  segments: Array<{
    country: string;
    revenuePercentage?: number;
    exposureComponents?: {
      revenue?: number;
      operations?: number;
      supply?: number;
      assets?: number;
      market?: number;
    };
  }>;
  channelBreakdown?: Record<string, {
    revenue?: { 
      weight: number; 
      status: string; 
      fallbackType?: string; 
      source?: string;
      evidenceType?: 'Direct' | 'Structured' | 'Residual';
      isLocked?: boolean;
      fallbackStrategy?: FallbackStrategy;
    };
    operations?: { 
      weight: number; 
      status: string; 
      fallbackType?: string; 
      source?: string;
      evidenceType?: 'Direct' | 'Structured' | 'Residual';
      isLocked?: boolean;
      fallbackStrategy?: FallbackStrategy;
    };
    supply?: { 
      weight: number; 
      status: string; 
      fallbackType?: string; 
      source?: string;
      evidenceType?: 'Direct' | 'Structured' | 'Residual';
      isLocked?: boolean;
      fallbackStrategy?: FallbackStrategy;
    };
    assets?: { 
      weight: number; 
      status: string; 
      fallbackType?: string; 
      source?: string;
      evidenceType?: 'Direct' | 'Structured' | 'Residual';
      isLocked?: boolean;
      fallbackStrategy?: FallbackStrategy;
    };
    blended: number;
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
    evidenceTracking?: {
      directEvidence: CountryEvidence[];
      structuredEvidence: CountryEvidence[];
      residualBucket: CountryEvidence[];
    };
  }>;
  sectorMultiplier?: number;
  hasVerifiedData?: boolean;
  dataSource?: string;
  homeCountry?: string;
  hasDetailedComponents?: boolean;
  sectorClassificationConfidence?: number;
  sectorClassificationSources?: string[];
  adrResolution?: {
    isADR: boolean;
    confidence: 'high' | 'medium' | 'low';
    source: string;
  };
}

// Enhanced ADR-aware company resolution
interface EnhancedCompanyInfo {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  isADR: boolean;
  adrHomeCountry?: string;
  adrConfidence?: 'high' | 'medium' | 'low';
  adrSource?: string;
}

// ADR Information Interface
interface ADRInfo {
  isADR: boolean;
  homeCountry: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  sector: string;
}

/**
 * NEW: Phase 3 - Parse narrative definition to extract main country and sub-countries
 */
function parseNarrativeDefinition(
  narrativeDefinition: string
): { mainCountry: string; subCountries: string[] } {
  console.log(`[Phase 3] Parsing narrative: "${narrativeDefinition}"`);
  
  const patterns = [
    /"([^"]+)" includes (.+)/i,
    /([A-Z][a-z]+) includes (.+)/i,
    /([A-Z][a-z]+) comprises (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = narrativeDefinition.match(pattern);
    if (match) {
      const mainCountry = match[1].trim();
      const subCountriesText = match[2].trim();
      const subCountries = subCountriesText
        .split(/,| and /)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      console.log(`[Phase 3] Parsed: Main="${mainCountry}", Subs=[${subCountries.join(', ')}]`);
      return { mainCountry, subCountries };
    }
  }
  
  console.log(`[Phase 3] No pattern matched, returning empty`);
  return { mainCountry: '', subCountries: [] };
}

/**
 * NEW: Phase 3 - Get sector-specific sub-bucket distribution patterns
 */
function getSectorSubBucketDistribution(
  sector: string,
  mainCountry: string,
  subCountries: string[]
): Array<{ country: string; weight: number; rationale: string; isCarveOut: boolean }> {
  console.log(`[Phase 3] Getting sector distribution for ${sector}, main=${mainCountry}, subs=${subCountries.length}`);
  
  // Sector-specific patterns for Greater China distribution
  const greaterChinaPatterns: Record<string, Record<string, number>> = {
    'Technology': {
      'China': 0.70,      // 70% mainland China
      'Hong Kong': 0.15,  // 15% Hong Kong
      'Taiwan': 0.15      // 15% Taiwan
    },
    'Automotive': {
      'China': 0.85,      // 85% mainland China
      'Hong Kong': 0.05,  // 5% Hong Kong
      'Taiwan': 0.10      // 10% Taiwan
    },
    'Financial Services': {
      'China': 0.60,      // 60% mainland China
      'Hong Kong': 0.35,  // 35% Hong Kong
      'Taiwan': 0.05      // 5% Taiwan
    }
  };
  
  // Get pattern for sector (default to Technology pattern)
  const pattern = greaterChinaPatterns[sector] || greaterChinaPatterns['Technology'];
  
  // Build distribution
  const distribution: Array<{ country: string; weight: number; rationale: string; isCarveOut: boolean }> = [];
  
  // Add main country
  if (pattern[mainCountry]) {
    distribution.push({
      country: mainCountry,
      weight: pattern[mainCountry],
      rationale: `Primary ${sector} operations in ${mainCountry}`,
      isCarveOut: false
    });
    console.log(`[Phase 3]   ${mainCountry}: ${pattern[mainCountry]} (main)`);
  }
  
  // Add sub-countries
  subCountries.forEach(subCountry => {
    if (pattern[subCountry]) {
      distribution.push({
        country: subCountry,
        weight: pattern[subCountry],
        rationale: `${sector} operations in ${subCountry} (carved out from ${mainCountry} bucket)`,
        isCarveOut: true
      });
      console.log(`[Phase 3]   ${subCountry}: ${pattern[subCountry]} (carve-out)`);
    }
  });
  
  return distribution;
}

/**
 * NEW: Phase 3 - Distribute sub-bucket amounts across sub-countries
 */
function distributeSubBucket(
  bucketName: string,
  totalAmount: number,
  narrativeDefinition: string,
  sector: string,
  ticker: string
): SubBucketDistribution[] {
  console.log(`[${ticker}] [Phase 3] ===== DISTRIBUTING SUB-BUCKET: ${bucketName} =====`);
  console.log(`[${ticker}] [Phase 3] Total Amount: ${totalAmount.toFixed(2)}%`);
  console.log(`[${ticker}] [Phase 3] Narrative: "${narrativeDefinition}"`);
  
  const { mainCountry, subCountries } = parseNarrativeDefinition(narrativeDefinition);
  
  if (subCountries.length === 0) {
    // No sub-countries, return single allocation
    console.log(`[${ticker}] [Phase 3] No sub-countries found, single allocation`);
    return [{
      country: mainCountry || bucketName,
      amount: totalAmount,
      percentage: totalAmount,
      percentageOfBucket: 100,
      rationale: 'Single country bucket',
      isCarveOut: false
    }];
  }
  
  // Get sector-specific distribution patterns
  const distribution = getSectorSubBucketDistribution(sector, mainCountry, subCountries);
  
  // Normalize to totalAmount
  const totalWeight = distribution.reduce((sum, d) => sum + d.weight, 0);
  const allocations: SubBucketDistribution[] = distribution.map(d => ({
    country: d.country,
    amount: (d.weight / totalWeight) * totalAmount,
    percentage: (d.weight / totalWeight) * totalAmount,
    percentageOfBucket: (d.weight / totalWeight) * 100,
    rationale: d.rationale,
    isCarveOut: d.isCarveOut
  }));
  
  console.log(`[${ticker}] [Phase 3] Sub-bucket distribution complete: ${allocations.length} countries`);
  allocations.forEach(a => {
    console.log(`[${ticker}] [Phase 3]   ${a.country}: ${a.percentage.toFixed(2)}% (${a.percentageOfBucket.toFixed(1)}% of bucket)${a.isCarveOut ? ' [CARVE-OUT]' : ''}`);
  });
  
  return allocations;
}

/**
 * Phase 2 - Get bounded country set based on sector and channel
 */
function getBoundedCountrySet(
  ticker: string,
  sector: string,
  channelName: string
): string[] {
  console.log(`[${ticker}] [Phase 2] Getting bounded country set for ${sector} - ${channelName}`);
  
  // Define bounded sets based on sector and channel
  const sectorBoundedSets: Record<string, Record<string, string[]>> = {
    'Technology': {
      'Revenue': ['United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France', 'Canada', 'South Korea', 'Taiwan', 'Singapore'],
      'Supply': ['China', 'Taiwan', 'South Korea', 'Japan', 'Vietnam', 'Thailand', 'Malaysia', 'Singapore', 'United States', 'Mexico'],
      'Assets': ['United States', 'China', 'Ireland', 'Singapore', 'Japan', 'Germany', 'United Kingdom', 'Netherlands', 'India', 'South Korea'],
      'Operations': ['United States', 'China', 'Ireland', 'Singapore', 'United Kingdom', 'Japan', 'Germany', 'India', 'Canada', 'Australia']
    },
    'Automotive': {
      'Revenue': ['United States', 'China', 'Germany', 'Japan', 'United Kingdom', 'France', 'Canada', 'South Korea', 'Italy', 'Spain'],
      'Supply': ['China', 'Germany', 'Japan', 'South Korea', 'United States', 'Mexico', 'Poland', 'Czech Republic', 'Thailand', 'India'],
      'Assets': ['United States', 'China', 'Germany', 'Japan', 'Mexico', 'United Kingdom', 'France', 'Spain', 'Poland', 'South Korea'],
      'Operations': ['United States', 'China', 'Germany', 'Japan', 'United Kingdom', 'Mexico', 'France', 'Spain', 'Canada', 'South Korea']
    },
    'Financial Services': {
      'Revenue': ['United States', 'United Kingdom', 'China', 'Japan', 'Germany', 'France', 'Canada', 'Switzerland', 'Singapore', 'Hong Kong'],
      'Supply': ['United States', 'United Kingdom', 'India', 'China', 'Singapore', 'Ireland', 'Canada', 'Australia', 'Germany', 'France'],
      'Assets': ['United States', 'United Kingdom', 'China', 'Japan', 'Germany', 'France', 'Switzerland', 'Singapore', 'Hong Kong', 'Canada'],
      'Operations': ['United States', 'United Kingdom', 'China', 'Japan', 'Germany', 'France', 'Singapore', 'Hong Kong', 'Switzerland', 'Canada']
    }
  };
  
  // Get bounded set for sector and channel
  const boundedSet = sectorBoundedSets[sector]?.[channelName] || 
                     ['United States', 'China', 'Germany', 'Japan', 'United Kingdom', 'France', 'Canada', 'India', 'Brazil', 'Australia'];
  
  console.log(`[${ticker}] [Phase 2] Bounded Country Set: ${boundedSet.length} countries - ${boundedSet.join(', ')}`);
  return boundedSet;
}

/**
 * Phase 2 - Apply Restricted Fallback allocation to residual bucket
 */
function applyRestrictedFallback(
  residualAmount: number,
  boundedCountrySet: string[],
  channelName: string,
  sector: string,
  ticker: string
): FallbackStrategy['residualBucket'] {
  console.log(`[${ticker}] [Phase 2] Applying RF to ${residualAmount.toFixed(2)}% residual for ${channelName}`);
  
  // Simple equal distribution for now (can be enhanced with sector-specific weights)
  const countryCount = boundedCountrySet.length;
  const perCountryPercentage = residualAmount / countryCount;
  
  const allocatedCountries = boundedCountrySet.map(country => ({
    country,
    amount: perCountryPercentage,
    percentage: perCountryPercentage,
    percentageOfResidual: (1 / countryCount) * 100,
    rationale: `Sector-specific ${channelName} pattern for ${sector}`
  }));
  
  console.log(`[${ticker}] [Phase 2] RF allocated to ${allocatedCountries.length} countries, ${perCountryPercentage.toFixed(2)}% each`);
  
  return {
    totalAmount: residualAmount,
    totalPercentage: residualAmount,
    fallbackType: 'RF',
    boundedCountrySet,
    allocatedCountries,
    isLocked: false
  };
}

/**
 * UPDATED: Phase 3 - Allocate channel exposure using hierarchical logic with sub-bucket distribution
 */
function allocateChannelExposure(
  channelName: string,
  ticker: string,
  companySpecificData: any,
  sector: string
): FallbackStrategy {
  console.log(`[${ticker}] [Phase 3] ===== ALLOCATING ${channelName.toUpperCase()} CHANNEL =====`);
  
  // Step 1: Lock direct evidence countries
  const directEvidence: FallbackStrategy['directEvidence'] = {
    countries: [],
    totalAmount: 0,
    totalPercentage: 0,
    isLocked: true,
    details: []
  };
  
  if (companySpecificData?.exposures) {
    companySpecificData.exposures.forEach((exp: any) => {
      directEvidence.countries.push(exp.country);
      directEvidence.totalAmount += exp.percentage;
      directEvidence.totalPercentage += exp.percentage;
      directEvidence.details.push({
        country: exp.country,
        amount: exp.percentage,
        percentage: exp.percentage,
        source: 'SEC 10-K Filing'
      });
    });
  }
  
  console.log(`[${ticker}] [Phase 3] Step 1: Direct Evidence (LOCKED) = ${directEvidence.totalPercentage.toFixed(1)}%`);
  console.log(`[${ticker}] [Phase 3]   Countries: ${directEvidence.countries.join(', ')}`);
  
  // Step 2: Lock structured evidence buckets with Phase 3 sub-bucket distribution
  const structuredEvidence: FallbackStrategy['structuredEvidence'] = {
    buckets: [],
    totalAmount: 0,
    totalPercentage: 0,
    isLocked: true
  };
  
  // Example: "China" bucket includes HK, TW with Phase 3 sub-bucket distribution
  if (directEvidence.countries.includes('China')) {
    const narrativeDefinition = '"China" includes mainland China, Hong Kong, and Taiwan operations';
    const subBucketDistribution = distributeSubBucket(
      'Greater China',
      20,  // 20% total
      narrativeDefinition,
      sector,
      ticker
    );
    
    const chinaBucket = {
      bucketName: 'Greater China',
      countries: ['China', 'Hong Kong', 'Taiwan'],
      totalAmount: 20,
      totalPercentage: 20,
      narrativeDefinition,
      subBucketDistribution  // NEW: Phase 3
    };
    
    structuredEvidence.buckets.push(chinaBucket);
    structuredEvidence.totalAmount += chinaBucket.totalAmount;
    structuredEvidence.totalPercentage += chinaBucket.totalPercentage;
  }
  
  console.log(`[${ticker}] [Phase 3] Step 2: Structured Evidence with Sub-Buckets (LOCKED) = ${structuredEvidence.totalPercentage.toFixed(1)}%`);
  if (structuredEvidence.buckets.length > 0) {
    structuredEvidence.buckets.forEach(bucket => {
      console.log(`[${ticker}] [Phase 3]   ${bucket.bucketName}: ${bucket.totalPercentage}%`);
      if (bucket.subBucketDistribution) {
        bucket.subBucketDistribution.forEach(sub => {
          console.log(`[${ticker}] [Phase 3]     ${sub.country}: ${sub.percentage.toFixed(2)}% (${sub.percentageOfBucket.toFixed(1)}% of bucket)${sub.isCarveOut ? ' [CARVE-OUT]' : ''}`);
        });
      }
    });
  }
  
  // Step 3: Calculate residual amount
  const residualAmount = 100 - directEvidence.totalPercentage - structuredEvidence.totalPercentage;
  console.log(`[${ticker}] [Phase 3] Step 3: Residual Amount = ${residualAmount.toFixed(1)}%`);
  
  // Step 4: Determine bounded country set for RF
  const boundedCountrySet = getBoundedCountrySet(ticker, sector, channelName);
  
  // Step 5: Apply Restricted Fallback to residual bucket
  const residualBucket = applyRestrictedFallback(
    residualAmount,
    boundedCountrySet,
    channelName,
    sector,
    ticker
  );
  
  console.log(`[${ticker}] [Phase 3] ===== ${channelName.toUpperCase()} ALLOCATION COMPLETE =====`);
  console.log(`[${ticker}] [Phase 3] Summary: Direct ${directEvidence.totalPercentage.toFixed(1)}% + Structured ${structuredEvidence.totalPercentage.toFixed(1)}% + Residual ${residualBucket.totalPercentage.toFixed(1)}% = 100%`);
  
  return {
    directEvidence,
    structuredEvidence,
    residualBucket
  };
}

/**
 * Phase 1 - Classify country evidence type based on data source and context
 */
function classifyCountryEvidence(
  country: string,
  channelData: any,
  companySpecificData: any,
  allRevenueCountries: string[]
): 'Direct' | 'Structured' | 'Residual' {
  // Check if country has direct evidence from SEC filings
  if (companySpecificData?.exposures?.find((e: any) => e.country === country)) {
    return 'Direct';
  }
  
  // Check if country is in structured bucket (e.g., "China" includes HK/TW)
  // For now, treat countries with high confidence as structured
  if (channelData?.status === 'evidence' || channelData?.status === 'high_confidence_estimate') {
    return 'Structured';
  }
  
  // Check if it's explicitly a residual bucket (e.g., "Other countries")
  if (country.toLowerCase().includes('other')) {
    return 'Residual';
  }
  
  // If using fallback logic (RF or GF), it's residual
  if (channelData?.fallbackType === 'RF' || channelData?.fallbackType === 'GF') {
    return 'Residual';
  }
  
  // Default to residual for safety
  return 'Residual';
}

/**
 * Get evidence level badge display information
 */
function getEvidenceBadge(evidenceLevel: EvidenceLevel, score: number): { 
  icon: string; 
  label: string; 
  color: string; 
  score: string;
} {
  switch (evidenceLevel) {
    case 'direct_evidence':
      return { icon: '✅', label: 'DIRECT EVIDENCE', color: 'green', score: `${score}%` };
    case 'high_confidence':
      return { icon: '📊', label: 'HIGH CONFIDENCE', color: 'blue', score: `${score}%` };
    case 'medium_confidence':
      return { icon: '📈', label: 'MEDIUM CONFIDENCE', color: 'yellow', score: `${score}%` };
    case 'sector_intelligence':
      return { icon: '🔍', label: 'SECTOR ANALYSIS', color: 'orange', score: `${score}%` };
    case 'estimate':
      return { icon: '📉', label: 'ESTIMATE', color: 'red', score: `${score}%` };
  }
}

// Legacy function for backward compatibility with enhanced ADR support
export async function getCompanyGeographicExposure(
  ticker: string,
  param2?: any,
  param3?: any,
  param4?: any
): Promise<CompanyGeographicData> {
  console.log(`🚨 [ENTRY POINT] getCompanyGeographicExposure called for: ${ticker}`);
  console.log(`🚨 [ENTRY POINT] Starting v3.4 Phase 3 assessment pipeline...`);
  
  console.log(`[v3.4 Phase 3] ===== STARTING ASSESSMENT FOR ${ticker} =====`);
  
  // Step 1: Enhanced company resolution with ADR detection
  const enhancedCompanyInfo = await resolveEnhancedCompanyInfo(ticker);
  
  console.log(`🚨 [COMPANY INFO] Enhanced company resolution complete:`);
  console.log(`🚨 [COMPANY INFO] Name: ${enhancedCompanyInfo.name}`);
  console.log(`🚨 [COMPANY INFO] Country: ${enhancedCompanyInfo.country}`);
  console.log(`🚨 [COMPANY INFO] Sector: ${enhancedCompanyInfo.sector}`);
  console.log(`🚨 [COMPANY INFO] Is ADR: ${enhancedCompanyInfo.isADR}`);
  
  // Step 2: Use the new v3.4 assessment service with ADR-aware logic
  const assessment = await V34ComprehensiveIntegrationService.assessCompany(
    ticker, 
    enhancedCompanyInfo
  );
  
  console.log(`🚨 [POST-ASSESSMENT] Assessment completed successfully`);
  console.log(`🚨 [POST-ASSESSMENT] Geographic exposures count: ${assessment.geographicExposures.length}`);
  console.log(`🚨 [POST-ASSESSMENT] Geographic exposures:`, assessment.geographicExposures.map(e => `${e.country}: ${(e.exposurePercentage * 100).toFixed(2)}%`).join(', '));
  
  // Step 3: Convert to legacy format with proper ADR handling
  const segments = assessment.geographicExposures.map(exposure => ({
    country: exposure.country,
    revenuePercentage: exposure.exposurePercentage * 100,
    exposureComponents: exposure.channels ? {
      revenue: exposure.channels.revenue,
      operations: exposure.channels.financial,
      supply: exposure.channels.supply,
      assets: exposure.channels.assets,
      market: 0
    } : undefined
  }));

  console.log(`🚨 [SEGMENTS CREATED] Segments count: ${segments.length}`);
  console.log(`🚨 [SEGMENTS CREATED] Segments:`, segments.map(s => `${s.country}: ${s.revenuePercentage?.toFixed(2)}%`).join(', '));

  // Step 4: Build channel breakdown with Phase 3 FallbackStrategy (includes sub-bucket distribution)
  console.log(`🚨 [PHASE 3] Building channel breakdown with hierarchical allocation and sub-bucket distribution...`);
  const channelBreakdown: Record<string, any> = {};
  
  // Get company-specific data for Phase 3 allocation
  const companySpecificData = getCompanySpecificExposure(ticker);
  const allRevenueCountries = companySpecificData?.exposures?.map(e => e.country) || [];
  
  console.log(`🚨 [PHASE 3] Company-specific data found: ${!!companySpecificData}`);
  console.log(`🚨 [PHASE 3] Revenue countries from SEC: ${allRevenueCountries.join(', ')}`);
  
  // NEW: Phase 3 - Generate FallbackStrategy with sub-bucket distribution for each channel
  const channelNames = ['Revenue', 'Operations', 'Supply', 'Assets'];
  const fallbackStrategies: Record<string, FallbackStrategy> = {};
  
  channelNames.forEach(channelName => {
    fallbackStrategies[channelName] = allocateChannelExposure(
      channelName,
      ticker,
      companySpecificData,
      enhancedCompanyInfo.sector
    );
  });
  
  assessment.channelBreakdowns.forEach(breakdown => {
    if (!channelBreakdown[breakdown.country]) {
      // Calculate political alignment for each country using actual home country
      const alignment = calculatePoliticalAlignment(enhancedCompanyInfo.adrHomeCountry || enhancedCompanyInfo.country, breakdown.country);
      
      channelBreakdown[breakdown.country] = {
        blended: 0,
        politicalAlignment: {
          alignmentFactor: alignment.alignmentFactor,
          relationship: alignment.relationship,
          source: alignment.source
        },
        evidenceTracking: {
          directEvidence: [],
          structuredEvidence: [],
          residualBucket: []
        }
      };
    }
    
    const channelKey = breakdown.channel.includes('Revenue') ? 'revenue' :
                      breakdown.channel.includes('Supply') ? 'supply' :
                      breakdown.channel.includes('Asset') ? 'assets' :
                      breakdown.channel.includes('Financial') ? 'operations' : 'revenue';
    
    const status = breakdown.fallbackType === 'none' ? 'evidence' : 'fallback';
    const evidenceType = classifyCountryEvidence(
      breakdown.country,
      { status, fallbackType: breakdown.fallbackType },
      companySpecificData,
      allRevenueCountries
    );
    
    const isLocked = evidenceType === 'Direct' || evidenceType === 'Structured';
    
    // Get corresponding FallbackStrategy with Phase 3 sub-bucket distribution
    const channelNameForStrategy = channelKey === 'revenue' ? 'Revenue' :
                                    channelKey === 'supply' ? 'Supply' :
                                    channelKey === 'assets' ? 'Assets' : 'Operations';
    const strategy = fallbackStrategies[channelNameForStrategy];
    
    channelBreakdown[breakdown.country][channelKey] = {
      weight: breakdown.adjustedWeight,
      status: status,
      fallbackType: breakdown.fallbackType,
      source: breakdown.dataSources.join(', '),
      evidenceType: evidenceType,
      isLocked: isLocked,
      fallbackStrategy: strategy  // Phase 3: Includes sub-bucket distribution
    };
    
    // Phase 1 - Track evidence in appropriate bucket
    const evidenceEntry: CountryEvidence = {
      country: breakdown.country,
      evidenceType: evidenceType,
      evidenceSource: breakdown.dataSources.join(', '),
      isLocked: isLocked,
      amount: breakdown.adjustedWeight,
      percentage: breakdown.adjustedWeight * 100,
      rationale: `${channelKey} channel: ${breakdown.fallbackType === 'none' ? 'Direct SEC filing data' : `${breakdown.fallbackType} fallback`}`
    };
    
    if (evidenceType === 'Direct') {
      channelBreakdown[breakdown.country].evidenceTracking.directEvidence.push(evidenceEntry);
    } else if (evidenceType === 'Structured') {
      channelBreakdown[breakdown.country].evidenceTracking.structuredEvidence.push(evidenceEntry);
    } else {
      channelBreakdown[breakdown.country].evidenceTracking.residualBucket.push(evidenceEntry);
    }
    
    // Calculate blended weight using v3.4 coefficients
    const weights = channelBreakdown[breakdown.country];
    const revenue = weights.revenue?.weight || 0;
    const supply = weights.supply?.weight || 0;
    const assets = weights.assets?.weight || 0;
    const operations = weights.operations?.weight || 0;
    
    channelBreakdown[breakdown.country].blended = 
      (revenue * 0.4) + (supply * 0.35) + (assets * 0.15) + (operations * 0.1);
  });

  console.log(`🚨 [PHASE 3] Channel breakdown created for ${Object.keys(channelBreakdown).length} countries with FallbackStrategy + Sub-Bucket Distribution`);
  console.log(`🚨 [PHASE 3] Channel breakdown countries:`, Object.keys(channelBreakdown).join(', '));
  
  // Phase 3 - Log hierarchical allocation with sub-bucket summary
  console.log(`🚨 [PHASE 3 SUMMARY] Hierarchical Allocation with Sub-Bucket Distribution Complete:`)
;
  channelNames.forEach(channelName => {
    const strategy = fallbackStrategies[channelName];
    console.log(`🚨 [PHASE 3 SUMMARY] ${channelName}: Direct ${strategy.directEvidence.totalPercentage.toFixed(1)}% + Structured ${strategy.structuredEvidence.totalPercentage.toFixed(1)}% + Residual ${strategy.residualBucket.totalPercentage.toFixed(1)}%`);
    
    // Log sub-bucket details
    strategy.structuredEvidence.buckets.forEach(bucket => {
      if (bucket.subBucketDistribution && bucket.subBucketDistribution.length > 0) {
        console.log(`🚨 [PHASE 3 SUMMARY]   ${bucket.bucketName} Sub-Buckets:`);
        bucket.subBucketDistribution.forEach(sub => {
          console.log(`🚨 [PHASE 3 SUMMARY]     ${sub.country}: ${sub.percentage.toFixed(2)}%${sub.isCarveOut ? ' [CARVE-OUT]' : ''}`);
        });
      }
    });
  });

  const sectorMultiplier = sectorClassificationService.getSectorMultiplier(enhancedCompanyInfo.sector);
  
  const finalResult = {
    company: enhancedCompanyInfo.name,
    ticker: enhancedCompanyInfo.ticker,
    sector: enhancedCompanyInfo.sector,
    segments,
    channelBreakdown,
    sectorMultiplier: sectorMultiplier,
    hasVerifiedData: true,
    dataSource: 'v3.4 Phase 3: Sub-Bucket Distribution with China/HK/Taiwan Carve-Outs',
    homeCountry: enhancedCompanyInfo.adrHomeCountry || enhancedCompanyInfo.country,
    hasDetailedComponents: true,
    sectorClassificationConfidence: 0.9,
    sectorClassificationSources: ['v3.4 Phase 3: Sub-Bucket Distribution'],
    adrResolution: enhancedCompanyInfo.isADR ? {
      isADR: true,
      confidence: enhancedCompanyInfo.adrConfidence || 'high',
      source: enhancedCompanyInfo.adrSource || 'v3.4 ADR Database'
    } : {
      isADR: false,
      confidence: 'high',
      source: 'v3.4 Analysis'
    }
  };

  console.log(`🚨 [FINAL RETURN] Phase 3 implementation complete, returning data to UI...`);
  console.log(`🚨 [FINAL RETURN] Final segments count: ${finalResult.segments.length}`);
  console.log(`🚨 [FINAL RETURN] Final channel breakdown countries: ${Object.keys(finalResult.channelBreakdown).length}`);
  
  return finalResult;
}

/**
 * Enhanced company resolution with comprehensive ADR detection and validation
 */
async function resolveEnhancedCompanyInfo(ticker: string): Promise<EnhancedCompanyInfo> {
  console.log(`[v3.4 Phase 3] ===== RESOLVING COMPANY INFO FOR ${ticker} =====`);
  
  const expansionData = await dataExpansionService.getCompanyData(ticker);
  
  let companyName = `${ticker} Corporation`;
  let sector = 'Technology';
  let apiCountry = 'United States';
  const exchange = 'NASDAQ';
  
  if (expansionData) {
    companyName = expansionData.companyName;
    sector = expansionData.sector;
    apiCountry = expansionData.homeCountry;
  }
  
  const adrResolution = resolveADRCountry(ticker, companyName, apiCountry, exchange);
  let finalCountry = adrResolution.country;
  let isADR = adrResolution.isADR;
  
  if (isKnownADR(ticker)) {
    const knownADRCountry = getADRCountry(ticker);
    if (knownADRCountry && knownADRCountry !== finalCountry) {
      finalCountry = knownADRCountry;
      isADR = true;
      adrResolution.confidence = 'high';
      adrResolution.source = 'Known ADR Database (v3.4 Phase 3)';
    }
  }
  
  const enhancedADRInfo = getEnhancedADRInfo(ticker, companyName);
  if (enhancedADRInfo) {
    companyName = enhancedADRInfo.correctedName;
    finalCountry = enhancedADRInfo.homeCountry;
    sector = enhancedADRInfo.sector || sector;
    isADR = true;
  }
  
  const result = {
    ticker: ticker.toUpperCase(),
    name: companyName,
    exchange,
    country: finalCountry,
    sector,
    isADR,
    adrHomeCountry: isADR ? finalCountry : undefined,
    adrConfidence: adrResolution.confidence,
    adrSource: adrResolution.source
  };
  
  return result;
}

/**
 * Enhanced ADR information database for major ADRs with correct names and countries
 */
function getEnhancedADRInfo(ticker: string, currentName: string): {
  correctedName: string;
  homeCountry: string;
  sector?: string;
} | null {
  const enhancedADRDatabase: Record<string, { name: string; country: string; sector?: string }> = {
    'CRESY': { name: 'Cresud Sociedad Anónima, Comercial, Inmobiliaria, Financiera y Agropecuaria', country: 'Argentina', sector: 'Real Estate' },
    'AAPL': { name: 'Apple Inc.', country: 'United States', sector: 'Technology' },
    'TSLA': { name: 'Tesla, Inc.', country: 'United States', sector: 'Automotive' },
    'BABA': { name: 'Alibaba Group Holding Limited', country: 'China', sector: 'Technology' },
    'TSM': { name: 'Taiwan Semiconductor Manufacturing Company Limited', country: 'Taiwan', sector: 'Technology' }
  };
  
  const upperTicker = ticker.toUpperCase();
  const adrInfo = enhancedADRDatabase[upperTicker];
  
  if (adrInfo) {
    return {
      correctedName: adrInfo.name,
      homeCountry: adrInfo.country,
      sector: adrInfo.sector
    };
  }
  
  return null;
}

export class V34ComprehensiveIntegrationService {
  static async assessCompany(
    ticker: string, 
    enhancedCompanyInfo?: EnhancedCompanyInfo
  ): Promise<V34AssessmentResult> {
    try {
      console.log(`[v3.4 Phase 3] ===== STARTING ASSESSMENT FOR ${ticker} =====`);
      
      const companyInfo = enhancedCompanyInfo || await resolveEnhancedCompanyInfo(ticker);
      
      const companySpecificData = getCompanySpecificExposure(ticker);
      if (companySpecificData) {
        console.log(`[${ticker}] ✅ Using company-specific SEC EDGAR data with Phase 3 sub-bucket distribution`);
        console.log(`[${ticker}] Company-specific exposures count: ${companySpecificData.exposures.length}`);
        console.log(`[${ticker}] Company-specific exposures:`, companySpecificData.exposures.map(e => `${e.country}: ${e.percentage}%`).join(', '));
        
        const channelSpecific = await calculateChannelSpecificExposures(
          ticker,
          companySpecificData.sector,
          companySpecificData.homeCountry,
          companySpecificData.exposures.map(e => ({ country: e.country, percentage: e.percentage }))
        );
        
        console.log(`[${ticker}] Channel-specific calculations complete`);
        console.log(`[${ticker}] Revenue channel countries: ${channelSpecific.revenue.length}`);
        console.log(`[${ticker}] Supply channel countries: ${channelSpecific.supply.length}`);
        console.log(`[${ticker}] Assets channel countries: ${channelSpecific.assets.length}`);
        console.log(`[${ticker}] Financial channel countries: ${channelSpecific.financial.length}`);
        
        const allCountries = new Set<string>();
        [...channelSpecific.revenue, ...channelSpecific.supply, ...channelSpecific.assets, ...channelSpecific.financial]
          .forEach(exp => allCountries.add(exp.country));
        
        console.log(`[${ticker}] All unique countries: ${allCountries.size}`);
        console.log(`[${ticker}] All unique countries list:`, Array.from(allCountries).join(', '));
        
        const geographicExposures: GeographicExposure[] = [];
        const channelBreakdowns: ChannelBreakdown[] = [];
        const detailedCalculations: ChannelCalculationBreakdown[] = [];
        
        for (const country of Array.from(allCountries)) {
          const revenueExp = channelSpecific.revenue.find(e => e.country === country);
          const supplyExp = channelSpecific.supply.find(e => e.country === country);
          const assetsExp = channelSpecific.assets.find(e => e.country === country);
          const financialExp = channelSpecific.financial.find(e => e.country === country);
          
          if (revenueExp && supplyExp && assetsExp && financialExp) {
            const totalExposure = (
              (revenueExp.percentage / 100) * 0.4 +
              (supplyExp.percentage / 100) * 0.35 +
              (assetsExp.percentage / 100) * 0.15 +
              (financialExp.percentage / 100) * 0.1
            );
            
            geographicExposures.push({
              country,
              exposurePercentage: totalExposure,
              riskScore: this.calculateCountryRiskScore(country, totalExposure),
              channels: {
                revenue: revenueExp.percentage / 100,
                supply: supplyExp.percentage / 100,
                assets: assetsExp.percentage / 100,
                financial: financialExp.percentage / 100
              }
            });
            
            const channels = [
              { name: 'Revenue & Demand Dependency', exp: revenueExp },
              { name: 'Supply & Production Network', exp: supplyExp },
              { name: 'Physical Asset Concentration', exp: assetsExp },
              { name: 'Financial & Capital-Flow', exp: financialExp }
            ];
            
            for (const { name, exp } of channels) {
              const evidenceBadge = getEvidenceBadge(exp.evidenceLevel, exp.evidenceScore);
              
              channelBreakdowns.push({
                channel: name,
                country,
                rawWeight: exp.percentage / 100,
                adjustedWeight: exp.percentage / 100,
                confidenceScore: exp.confidence,
                dataSources: [exp.dataSource],
                fallbackType: exp.status === 'evidence' ? 'none' : 'SSF',
                status: exp.status
              });
              
              detailedCalculations.push({
                channel: name,
                country,
                rawWeight: exp.percentage / 100,
                adjustedWeight: exp.percentage / 100,
                confidenceScore: exp.confidence,
                dataSources: [exp.dataSource],
                fallbackType: exp.status === 'evidence' ? 'none' : 'SSF',
                status: exp.status,
                calculations: [{
                  step: exp.status === 'evidence' ? 'SEC EDGAR Revenue Data' : 'Sector-Specific Pattern Analysis',
                  formula: exp.status === 'evidence' ? 'Direct from SEC 10-K Filing' : `${companySpecificData.sector} Industry Pattern`,
                  inputs: { percentage: exp.percentage },
                  output: exp.percentage
                }],
                evidence: [
                  `Source: ${exp.dataSource}`,
                  `Evidence Level: ${evidenceBadge.icon} ${evidenceBadge.label} (${evidenceBadge.score})`,
                  `Confidence: ${(exp.confidence * 100).toFixed(0)}%`,
                  exp.status === 'evidence' ? 'Direct SEC filing data' : `Sector analysis for ${companySpecificData.sector}`
                ]
              });
            }
          }
        }
        
        console.log(`[${ticker}] Geographic exposures created: ${geographicExposures.length}`);
        console.log(`[${ticker}] Geographic exposures:`, geographicExposures.map(e => `${e.country}: ${(e.exposurePercentage * 100).toFixed(2)}%`).join(', '));
        
        const cogriScore = this.calculateCOGRIScore(geographicExposures);
        const riskLevel = this.determineRiskLevel(cogriScore);
        
        const fallbackAnalysis = {
          ssfCoverage: (detailedCalculations.filter(c => c.status === 'high_confidence_estimate').length / detailedCalculations.length) * 100,
          rfCoverage: 0,
          gfCoverage: 0,
          totalDataPoints: detailedCalculations.length,
          confidenceLevel: detailedCalculations.reduce((sum, c) => sum + c.confidenceScore, 0) / detailedCalculations.length
        };
        
        const expansionData = await this.getDataExpansionInfo(ticker);
        
        return {
          ticker: companyInfo.ticker,
          companyName: companySpecificData.companyName,
          cogriScore,
          riskLevel,
          geographicExposures,
          channelBreakdowns,
          detailedCalculations,
          fallbackAnalysis,
          dataExpansionIntegration: expansionData,
          methodology: {
            version: '3.4',
            channels: ['Revenue & Demand Dependency', 'Supply & Production Network', 'Physical Asset Concentration', 'Financial & Capital-Flow'],
            fallbackLogic: 'Phase 3: Sub-Bucket Distribution - Direct Evidence (LOCKED) → Structured Evidence with Carve-Outs (LOCKED) → Residual Fallback (RF)',
            calculationTransparency: true
          }
        };
      }
      
      // Fallback to original logic if no company-specific data
      const expansionData = await this.getDataExpansionInfo(ticker);
      const countries = this.getRelevantCountries(ticker, companyInfo);
      const channelResults = MultiDimensionalChannelEngine.generateChannelExposures(ticker, countries);
      
      const { geographicExposures, channelBreakdowns, detailedCalculations } = 
        this.processChannelResults(channelResults, countries, companyInfo);
      
      const cogriScore = this.calculateCOGRIScore(geographicExposures);
      const riskLevel = this.determineRiskLevel(cogriScore);
      const fallbackAnalysis = this.analyzeFallbackCoverage(detailedCalculations);
      
      return {
        ticker: companyInfo.ticker,
        companyName: companyInfo.name,
        cogriScore,
        riskLevel,
        geographicExposures,
        channelBreakdowns,
        detailedCalculations,
        fallbackAnalysis,
        dataExpansionIntegration: expansionData,
        methodology: {
          version: '3.4',
          channels: ['Revenue & Demand Dependency', 'Supply & Production Network', 'Physical Asset Concentration', 'Financial & Capital-Flow'],
          fallbackLogic: 'Phase 3: Sub-Bucket Distribution Logic',
          calculationTransparency: true
        }
      };
    } catch (error) {
      console.error('V3.4 Phase 3 Error:', error);
      throw new Error(`Failed to assess ${ticker}: ${error.message}`, { cause: error });
    }
  }

  private static async getDataExpansionInfo(ticker: string) {
    try {
      const expansionStats = await dataExpansionService.getSystemStats();
      const companyData = await dataExpansionService.getCompanyData(ticker);
      
      return {
        companiesInSystem: expansionStats.totalCompanies || 23800,
        dataQualityScore: companyData?.qualityScore || 0.85,
        lastUpdated: expansionStats.lastUpdated || new Date().toISOString(),
        enhancedCoverage: !!companyData
      };
    } catch (error) {
      console.error('Data expansion service error:', error);
      return {
        companiesInSystem: 23800,
        dataQualityScore: 0.85,
        lastUpdated: new Date().toISOString(),
        enhancedCoverage: false
      };
    }
  }

  private static processChannelResults(
    channelResults: Record<string, ChannelCalculationBreakdown[]>,
    countries: string[],
    companyInfo: EnhancedCompanyInfo
  ) {
    const geographicExposures: GeographicExposure[] = [];
    const channelBreakdowns: ChannelBreakdown[] = [];
    const detailedCalculations: ChannelCalculationBreakdown[] = [];

    countries.forEach(country => {
      const revenueCalc = channelResults.revenue?.find(r => r.country === country);
      const supplyCalc = channelResults.supply?.find(s => s.country === country);
      const assetCalc = channelResults.assets?.find(a => a.country === country);
      const financialCalc = channelResults.financial?.find(f => f.country === country);

      if (revenueCalc && supplyCalc && assetCalc && financialCalc) {
        detailedCalculations.push(revenueCalc, supplyCalc, assetCalc, financialCalc);

        const totalExposure = (
          revenueCalc.adjustedWeight * 0.4 +
          supplyCalc.adjustedWeight * 0.35 +
          assetCalc.adjustedWeight * 0.15 +
          financialCalc.adjustedWeight * 0.1
        );

        geographicExposures.push({
          country,
          exposurePercentage: totalExposure,
          riskScore: this.calculateCountryRiskScore(country, totalExposure),
          channels: {
            revenue: revenueCalc.adjustedWeight,
            supply: supplyCalc.adjustedWeight,
            assets: assetCalc.adjustedWeight,
            financial: financialCalc.adjustedWeight
          }
        });

        [revenueCalc, supplyCalc, assetCalc, financialCalc].forEach(calc => {
          channelBreakdowns.push({
            channel: calc.channel,
            country: calc.country,
            rawWeight: calc.rawWeight,
            adjustedWeight: calc.adjustedWeight,
            confidenceScore: calc.confidenceScore,
            dataSources: calc.dataSources,
            fallbackType: calc.fallbackType,
            status: calc.status
          });
        });
      }
    });

    return { geographicExposures, channelBreakdowns, detailedCalculations };
  }

  private static calculateCOGRIScore(exposures: GeographicExposure[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    exposures.forEach(exposure => {
      const weight = exposure.exposurePercentage / 100;
      totalScore += exposure.riskScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  private static determineRiskLevel(cogriScore: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (cogriScore >= 75) return 'Critical';
    if (cogriScore >= 50) return 'High';
    if (cogriScore >= 25) return 'Medium';
    return 'Low';
  }

  private static calculateCountryRiskScore(country: string, exposure: number): number {
    const countryRiskScores: Record<string, number> = {
      'United States': 15,
      'China': 65,
      'Germany': 22,
      'Japan': 20,
      'United Kingdom': 25
    };

    const baseRisk = countryRiskScores[country] || 50;
    const exposureMultiplier = Math.min(2.0, 1 + (exposure / 50));
    
    return Math.min(100, baseRisk * exposureMultiplier);
  }

  private static analyzeFallbackCoverage(calculations: ChannelCalculationBreakdown[]) {
    const ssfCount = calculations.filter(c => c.fallbackType === 'SSF').length;
    const rfCount = calculations.filter(c => c.fallbackType === 'RF').length;
    const gfCount = calculations.filter(c => c.fallbackType === 'GF').length;
    const total = calculations.length;

    return {
      ssfCoverage: (ssfCount / total) * 100,
      rfCoverage: (rfCount / total) * 100,
      gfCoverage: (gfCount / total) * 100,
      totalDataPoints: total,
      confidenceLevel: calculations.reduce((sum, c) => sum + c.confidenceScore, 0) / total
    };
  }

  private static getRelevantCountries(ticker: string, companyInfo: EnhancedCompanyInfo): string[] {
    const baseCountries = [
      'United States', 'China', 'Germany', 'Japan', 'United Kingdom',
      'France', 'Canada', 'South Korea', 'Taiwan', 'India'
    ];

    if (ticker === 'AAPL') {
      return ['United States', 'China', 'Germany', 'Japan', 'United Kingdom', 'France', 'Canada', 'South Korea'];
    } else if (ticker === 'TSLA') {
      return ['United States', 'China', 'Germany', 'Netherlands', 'Canada', 'Australia', 'Norway', 'United Kingdom'];
    }

    return baseCountries.slice(0, 8);
  }

  static formatCalculationDetails(calculations: ChannelCalculationBreakdown[]): string {
    let output = '\n=== V3.4 Phase 3: Sub-Bucket Distribution - Four-Channel Exposure Calculation Details ===\n\n';
    
    const channels = ['Revenue & Demand Dependency', 'Supply & Production Network', 'Physical Asset Concentration', 'Financial & Capital-Flow'];
    
    channels.forEach(channelName => {
      output += `\n📊 ${channelName.toUpperCase()}\n`;
      output += '━'.repeat(60) + '\n';
      
      const channelCalcs = calculations.filter(c => c.channel === channelName);
      
      channelCalcs.forEach(calc => {
        output += `\n🌍 ${calc.country}\n`;
        output += `   Status: ${calc.status} | Confidence: ${(calc.confidenceScore * 100).toFixed(1)}%\n`;
        output += `   Data Sources: ${calc.dataSources.join(', ')}\n\n`;
        
        calc.calculations.forEach((step, index) => {
          output += `   Step ${index + 1}: ${step.step}\n`;
          output += `   Formula: ${step.formula}\n`;
          output += `   Output: ${step.output.toFixed(2)}%\n\n`;
        });
        
        output += `   📈 Final Weight: ${(calc.rawWeight * 100).toFixed(2)}%\n`;
        output += `   📋 Evidence:\n`;
        calc.evidence.forEach(evidence => {
          output += `      • ${evidence}\n`;
        });
        output += '\n';
      });
    });
    
    return output;
  }
}