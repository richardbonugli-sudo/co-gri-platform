/**
 * Channel-Specific Geographic Exposure Calculations - HYBRID APPROACH WITH GRADUATED EVIDENCE SCORING
 * 
 * This module implements differentiated calculations for each of the 4 channels:
 * 1. Revenue & Demand Dependency - Uses SEC revenue data (evidence-based)
 * 2. Supply & Production Network - Uses SEC countries + sector-specific multipliers
 * 3. Physical Asset Concentration - Uses SEC countries + facility multipliers
 * 4. Financial & Capital-Flow - Uses SEC countries + home country bias multipliers
 * 
 * KEY PRINCIPLE: All channels use the SAME country set (from SEC revenue data),
 * but apply different multipliers to adjust percentages based on business reality.
 * 
 * EVIDENCE SCORING SYSTEM (5 Levels):
 * - Direct Evidence (A+): 95-100% confidence - Direct SEC filing data
 * - High Confidence (A): 85-94% confidence - Parsed SEC + sector validation
 * - Medium Confidence (B): 70-84% confidence - Multiple indirect sources
 * - Sector Intelligence (C): 60-69% confidence - Sector patterns + limited data
 * - Estimate (D): 50-59% confidence - Pure sector-based estimate
 * 
 * Data Sources (READ-ONLY):
 * - SEC EDGAR revenue data from companySpecificExposures.ts
 * - Integrated Database from enhancedNASDAQDatabase.ts
 * - Sector intelligence multipliers
 */

import { dataExpansionService } from './dataExpansionService';

/**
 * Evidence Level Classification (5-Level System)
 */
export type EvidenceLevel = 
  | 'direct_evidence'        // A+ (95-100%) - Direct SEC filing data
  | 'high_confidence'        // A  (85-94%) - Parsed SEC + sector validation
  | 'medium_confidence'      // B  (70-84%) - Multiple indirect sources
  | 'sector_intelligence'    // C  (60-69%) - Sector patterns + limited data
  | 'estimate';             // D  (50-59%) - Pure sector-based estimate

export interface ChannelExposure {
  country: string;
  percentage: number;
  confidence: number;
  dataSource: string;
  status: 'evidence' | 'high_confidence_estimate' | 'estimate';
  evidenceLevel: EvidenceLevel;  // NEW: Graduated evidence level
  evidenceScore: number;          // NEW: Numeric score (0-100)
}

export interface ChannelSpecificResult {
  revenue: ChannelExposure[];
  supply: ChannelExposure[];
  assets: ChannelExposure[];
  financial: ChannelExposure[];
}

/**
 * Map confidence score and data source to evidence level
 */
function getEvidenceLevel(confidence: number, dataSource: string): EvidenceLevel {
  // Direct SEC filing data - highest confidence
  if (dataSource.includes('SEC 10-K') && confidence >= 0.95) {
    return 'direct_evidence';
  }
  
  // High confidence from sector analysis with strong validation
  if (confidence >= 0.85) {
    return 'high_confidence';
  }
  
  // Medium confidence from sector analysis with moderate validation
  if (confidence >= 0.70) {
    return 'medium_confidence';
  }
  
  // Sector intelligence with limited validation
  if (confidence >= 0.60) {
    return 'sector_intelligence';
  }
  
  // Pure estimate based on sector patterns
  return 'estimate';
}

/**
 * Calculate channel-specific exposures for a company using HYBRID APPROACH
 * All channels use the same countries (from SEC revenue), but with different multipliers
 */
export async function calculateChannelSpecificExposures(
  ticker: string,
  sector: string,
  homeCountry: string,
  revenueExposures: { country: string; percentage: number }[]
): Promise<ChannelSpecificResult> {
  console.log(`[CHANNEL-SPECIFIC HYBRID] Starting calculations for ${ticker}`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Sector: ${sector}, Home Country: ${homeCountry}`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Revenue exposures (BASE):`, revenueExposures.map(e => `${e.country}: ${e.percentage.toFixed(1)}%`));

  // Channel 1: Revenue (keep SEC data as-is) - DIRECT EVIDENCE
  const revenueChannel = revenueExposures.map(exp => {
    const confidence = 0.95;
    const dataSource = 'SEC 10-K Filing';
    
    return {
      country: exp.country,
      percentage: exp.percentage,
      confidence: confidence,
      dataSource: dataSource,
      status: 'evidence' as const,
      evidenceLevel: getEvidenceLevel(confidence, dataSource),
      evidenceScore: Math.round(confidence * 100)
    };
  });

  // Channel 2: Supply & Production Network (apply supply chain multipliers)
  const supplyChannel = calculateSupplyChainExposure(
    ticker,
    sector,
    homeCountry,
    revenueExposures
  );

  // Channel 3: Physical Asset Concentration (apply asset multipliers)
  const assetsChannel = calculateAssetExposure(
    ticker,
    sector,
    homeCountry,
    revenueExposures
  );

  // Channel 4: Financial & Capital-Flow (apply financial multipliers)
  const financialChannel = calculateFinancialExposure(
    ticker,
    sector,
    homeCountry,
    revenueExposures
  );

  console.log(`[CHANNEL-SPECIFIC HYBRID] Completed calculations for ${ticker}`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] All channels have ${revenueExposures.length} countries (same as SEC revenue)`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Revenue evidence: ${revenueChannel[0].evidenceLevel} (${revenueChannel[0].evidenceScore}%)`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Supply evidence: ${supplyChannel[0].evidenceLevel} (${supplyChannel[0].evidenceScore}%)`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Assets evidence: ${assetsChannel[0].evidenceLevel} (${assetsChannel[0].evidenceScore}%)`);
  console.log(`[CHANNEL-SPECIFIC HYBRID] Financial evidence: ${financialChannel[0].evidenceLevel} (${financialChannel[0].evidenceScore}%)`);

  return {
    revenue: revenueChannel,
    supply: supplyChannel,
    assets: assetsChannel,
    financial: financialChannel
  };
}

/**
 * Calculate Supply & Production Network exposure using HYBRID APPROACH
 * Starts with SEC revenue countries, applies sector-specific supply chain multipliers
 * Evidence Level: MEDIUM CONFIDENCE (B) - 75% confidence
 */
function calculateSupplyChainExposure(
  ticker: string,
  sector: string,
  homeCountry: string,
  revenueExposures: { country: string; percentage: number }[]
): ChannelExposure[] {
  console.log(`[SUPPLY CHAIN HYBRID] Calculating for ${ticker} (${sector})`);

  // Get sector-specific supply chain multipliers
  const multipliers = getSupplyChainMultipliers(sector, homeCountry);
  
  console.log(`[SUPPLY CHAIN HYBRID] Multipliers for ${sector}:`, multipliers);

  // Medium confidence for sector-based supply chain multipliers
  const confidence = 0.75;
  const dataSource = `Sector Analysis: ${sector} Supply Chain Pattern`;

  // Apply multipliers to each SEC revenue country
  const exposures: ChannelExposure[] = revenueExposures.map(revExp => {
    const multiplier = multipliers[revExp.country] || multipliers['default'] || 1.0;
    
    return {
      country: revExp.country,
      percentage: revExp.percentage * multiplier,
      confidence: confidence,
      dataSource: dataSource,
      status: 'high_confidence_estimate' as const,
      evidenceLevel: getEvidenceLevel(confidence, dataSource),
      evidenceScore: Math.round(confidence * 100)
    };
  });

  // Normalize to 100%
  const total = exposures.reduce((sum, exp) => sum + exp.percentage, 0);
  if (total > 0) {
    exposures.forEach(exp => {
      exp.percentage = (exp.percentage / total) * 100;
    });
  }

  return exposures.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculate Physical Asset Concentration exposure using HYBRID APPROACH
 * Starts with SEC revenue countries, applies facility location multipliers
 * Evidence Level: MEDIUM CONFIDENCE (B) - 72% confidence
 */
function calculateAssetExposure(
  ticker: string,
  sector: string,
  homeCountry: string,
  revenueExposures: { country: string; percentage: number }[]
): ChannelExposure[] {
  console.log(`[ASSETS HYBRID] Calculating for ${ticker} (${sector})`);

  // Get sector-specific asset multipliers
  const multipliers = getAssetMultipliers(sector, homeCountry);
  
  console.log(`[ASSETS HYBRID] Multipliers for ${sector}:`, multipliers);

  // Medium confidence for sector-based asset location patterns
  const confidence = 0.72;
  const dataSource = `Sector Analysis: ${sector} Asset Location Pattern`;

  // Apply multipliers to each SEC revenue country
  const exposures: ChannelExposure[] = revenueExposures.map(revExp => {
    const multiplier = multipliers[revExp.country] || multipliers['default'] || 1.0;
    
    return {
      country: revExp.country,
      percentage: revExp.percentage * multiplier,
      confidence: confidence,
      dataSource: dataSource,
      status: 'high_confidence_estimate' as const,
      evidenceLevel: getEvidenceLevel(confidence, dataSource),
      evidenceScore: Math.round(confidence * 100)
    };
  });

  // Normalize to 100%
  const total = exposures.reduce((sum, exp) => sum + exp.percentage, 0);
  if (total > 0) {
    exposures.forEach(exp => {
      exp.percentage = (exp.percentage / total) * 100;
    });
  }

  return exposures.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculate Financial & Capital-Flow exposure using HYBRID APPROACH
 * Starts with SEC revenue countries, applies home country bias multipliers
 * Evidence Level: HIGH CONFIDENCE (A) - 88% confidence
 */
function calculateFinancialExposure(
  ticker: string,
  sector: string,
  homeCountry: string,
  revenueExposures: { country: string; percentage: number }[]
): ChannelExposure[] {
  console.log(`[FINANCIAL HYBRID] Calculating for ${ticker} (${sector})`);

  // Get financial operations multipliers (strong home country bias)
  const multipliers = getFinancialMultipliers(homeCountry);
  
  console.log(`[FINANCIAL HYBRID] Multipliers (home country bias):`, multipliers);

  // High confidence for financial operations (well-established home country bias)
  const confidence = 0.88;
  const dataSource = `Sector Analysis: ${sector} Financial Operations Pattern`;

  // Apply multipliers to each SEC revenue country
  const exposures: ChannelExposure[] = revenueExposures.map(revExp => {
    const multiplier = multipliers[revExp.country] || multipliers['default'] || 1.0;
    
    return {
      country: revExp.country,
      percentage: revExp.percentage * multiplier,
      confidence: confidence,
      dataSource: dataSource,
      status: 'high_confidence_estimate' as const,
      evidenceLevel: getEvidenceLevel(confidence, dataSource),
      evidenceScore: Math.round(confidence * 100)
    };
  });

  // Normalize to 100%
  const total = exposures.reduce((sum, exp) => sum + exp.percentage, 0);
  if (total > 0) {
    exposures.forEach(exp => {
      exp.percentage = (exp.percentage / total) * 100;
    });
  }

  return exposures.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Get sector-specific supply chain multipliers
 * These adjust SEC revenue percentages to reflect supply chain reality
 */
function getSupplyChainMultipliers(sector: string, homeCountry: string): Record<string, number> {
  const patterns: Record<string, Record<string, number>> = {
    'Technology': {
      'United States': 0.4,      // Reduce US (less manufacturing)
      'China': 2.0,              // Increase China (major manufacturing hub)
      'Taiwan': 2.5,             // Increase Taiwan (semiconductor manufacturing)
      'South Korea': 1.8,        // Increase South Korea (component manufacturing)
      'Japan': 1.2,              // Slight increase (precision components)
      'Vietnam': 1.5,            // Increase Vietnam (assembly operations)
      'Germany': 0.9,            // Slight decrease (more demand than supply)
      'United Kingdom': 0.7,     // Decrease UK (primarily demand market)
      'France': 0.7,             // Decrease France (primarily demand market)
      'Italy': 0.6,              // Decrease Italy (primarily demand market)
      'Spain': 0.6,              // Decrease Spain (primarily demand market)
      'Netherlands': 0.8,        // Slight decrease (logistics hub, not manufacturing)
      'Canada': 0.7,             // Decrease Canada (primarily demand market)
      'Singapore': 1.3,          // Increase Singapore (regional manufacturing)
      'India': 1.4,              // Increase India (growing manufacturing)
      'default': 0.8             // Slight decrease for others
    },
    'Consumer Discretionary': {
      'United States': 0.6,
      'China': 2.2,
      'Mexico': 2.0,
      'Vietnam': 1.8,
      'Germany': 1.0,
      'Taiwan': 1.3,
      'South Korea': 1.2,
      'default': 0.8
    },
    'Automotive': {
      'United States': 0.9,
      'Mexico': 2.0,
      'China': 1.5,
      'Germany': 1.2,
      'Japan': 1.3,
      'South Korea': 1.4,
      'Canada': 1.1,
      'default': 0.7
    },
    'Healthcare': {
      'United States': 1.3,
      'Ireland': 1.5,
      'Switzerland': 1.4,
      'Germany': 1.2,
      'United Kingdom': 1.1,
      'China': 0.6,
      'India': 0.8,
      'default': 0.9
    },
    'Financial Services': {
      'United States': 1.2,
      'United Kingdom': 1.3,
      'Singapore': 1.2,
      'Hong Kong': 1.2,
      'Switzerland': 1.3,
      'default': 0.8
    },
    'Energy': {
      'United States': 1.1,
      'Canada': 1.4,
      'Norway': 1.5,
      'United Kingdom': 1.2,
      'Netherlands': 1.3,
      'default': 0.9
    },
    'Basic Materials': {
      'China': 1.8,
      'Australia': 1.6,
      'Brazil': 1.5,
      'Chile': 1.7,
      'South Africa': 1.6,
      'Canada': 1.4,
      'default': 0.9
    },
    'Industrials': {
      'United States': 1.0,
      'China': 1.6,
      'Germany': 1.3,
      'Japan': 1.2,
      'Mexico': 1.4,
      'default': 0.9
    }
  };

  return patterns[sector] || { 'default': 1.0 };
}

/**
 * Get sector-specific asset location multipliers
 * These adjust SEC revenue percentages to reflect physical asset concentration
 */
function getAssetMultipliers(sector: string, homeCountry: string): Record<string, number> {
  const patterns: Record<string, Record<string, number>> = {
    'Technology': {
      'United States': 1.1,      // Increase US (R&D centers, corporate HQ)
      'China': 1.5,              // Increase China (manufacturing facilities)
      'Ireland': 2.0,            // Increase Ireland (tax optimization, data centers)
      'Singapore': 1.8,          // Increase Singapore (regional HQ, data centers)
      'Germany': 1.0,            // Neutral (balanced market)
      'United Kingdom': 0.9,     // Slight decrease
      'France': 0.9,             // Slight decrease
      'Japan': 1.1,              // Slight increase (R&D facilities)
      'Taiwan': 1.3,             // Increase (manufacturing facilities)
      'South Korea': 1.2,        // Increase (manufacturing facilities)
      'Netherlands': 1.4,        // Increase (European HQ, data centers)
      'Canada': 0.9,             // Slight decrease
      'India': 1.2,              // Increase (development centers)
      'default': 0.8
    },
    'Consumer Discretionary': {
      'United States': 1.2,
      'China': 1.6,
      'Germany': 1.1,
      'Netherlands': 1.5,
      'United Kingdom': 1.0,
      'default': 0.8
    },
    'Automotive': {
      'United States': 1.2,
      'Germany': 1.4,
      'China': 1.5,
      'Mexico': 1.3,
      'Japan': 1.2,
      'South Korea': 1.3,
      'default': 0.7
    },
    'Healthcare': {
      'United States': 1.4,
      'Switzerland': 1.5,
      'Germany': 1.3,
      'United Kingdom': 1.2,
      'Ireland': 1.4,
      'default': 0.8
    },
    'Financial Services': {
      'United States': 1.5,
      'United Kingdom': 1.3,
      'Singapore': 1.2,
      'Hong Kong': 1.2,
      'Switzerland': 1.4,
      'default': 0.7
    },
    'Energy': {
      'United States': 1.3,
      'Canada': 1.4,
      'Norway': 1.5,
      'United Kingdom': 1.3,
      'Netherlands': 1.4,
      'default': 0.8
    },
    'Basic Materials': {
      'United States': 0.9,
      'Australia': 1.6,
      'Brazil': 1.5,
      'Chile': 1.7,
      'South Africa': 1.6,
      'Canada': 1.4,
      'China': 1.3,
      'default': 0.9
    },
    'Industrials': {
      'United States': 1.2,
      'Germany': 1.4,
      'China': 1.3,
      'Japan': 1.3,
      'United Kingdom': 1.1,
      'default': 0.9
    }
  };

  return patterns[sector] || { 'default': 1.0 };
}

/**
 * Get financial operations multipliers
 * Strong home country bias for treasury operations, banking relationships
 */
function getFinancialMultipliers(homeCountry: string): Record<string, number> {
  // Financial operations have strong home country bias across all sectors
  const multipliers: Record<string, number> = {
    [homeCountry]: 1.5,        // Increase home country (treasury, banking)
    'United States': homeCountry === 'United States' ? 1.5 : 1.1,  // US financial markets importance
    'United Kingdom': 1.0,     // London financial center
    'Singapore': 0.9,          // Asian financial hub
    'Switzerland': 0.9,        // European financial center
    'Hong Kong': 0.9,          // Asian financial hub
    'Germany': 0.8,
    'France': 0.8,
    'Japan': 0.8,
    'China': 0.7,              // Decrease (capital controls)
    'default': 0.7             // Decrease for others
  };

  return multipliers;
}