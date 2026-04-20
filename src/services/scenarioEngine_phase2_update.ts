/**
 * PHASE 2 UPDATES FOR scenarioEngine.ts
 * 
 * This file contains the updated functions that need to be integrated into scenarioEngine.ts
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace estimateSupplyChainFallback function (around line 797)
 * 2. Replace estimateFinancialFallback function (around line 902)
 * 3. Add calculateTradeExposureFallback function (new)
 * 4. Add helper functions at the end
 */

import { 
  getGDPByCountryCode, 
  getDistance, 
  hasTradeAgreement,
  getRegionalNeighbors 
} from '@/data/predictiveAnalytics';

import { supplyChainFallbackService } from './dataIntegration/supplyChainFallbackService';
import { financialFallbackService } from './dataIntegration/financialFallbackService';

/**
 * PRIORITY 2: Calculate bilateral trade exposure using gravity model
 */
function calculateTradeExposureFallback(
  sourceCountry: string,
  targetCountry: string,
  sector: string
): {
  exposure: number;
  method: 'gravity_model' | 'regional_share' | 'mirror_stats';
  confidence: number;
} {
  // Step 1: Get GDP data
  const sourceGDP = getGDPByCountryCode(sourceCountry);
  const targetGDP = getGDPByCountryCode(targetCountry);
  const distance = getDistance(sourceCountry, targetCountry);
  
  if (!sourceGDP || !targetGDP || !distance) {
    return { exposure: 0, method: 'gravity_model', confidence: 0 };
  }
  
  // Step 2: Gravity model - GDP(c) × GDP(T) / Distance²
  const k = 1e-15; // Calibration constant (adjust to normalize to ~1% for major partners)
  let tradeExposure = k * (sourceGDP * targetGDP) / (distance * distance);
  
  // Step 3: Sector factor (some sectors trade more than others)
  const sectorFactor = getSectorTradeFactor(sector);
  tradeExposure *= sectorFactor;
  
  // Step 4: Regional factor (same region trades more)
  const regionalNeighbors = getRegionalNeighbors(sourceCountry);
  const isRegionalNeighbor = regionalNeighbors.includes(targetCountry);
  const regionalFactor = isRegionalNeighbor ? 1.2 : 1.0;
  tradeExposure *= regionalFactor;
  
  // Step 5: Trade agreement factor
  const hasFTA = hasTradeAgreement(sourceCountry, targetCountry);
  const ftaFactor = hasFTA ? 1.1 : 1.0;
  tradeExposure *= ftaFactor;
  
  // Step 6: Determine confidence
  let confidence = 60; // Base confidence for gravity model
  if (isRegionalNeighbor) confidence += 10;
  if (hasFTA) confidence += 10;
  
  return { 
    exposure: tradeExposure, 
    method: 'gravity_model', 
    confidence: Math.min(confidence, 80) 
  };
}

/**
 * Get sector trade intensity factor
 */
function getSectorTradeFactor(sector: string): number {
  const sectorFactors: Record<string, number> = {
    'Technology': 1.3,
    'Electronics': 1.3,
    'Manufacturing': 1.2,
    'Automotive': 1.2,
    'Energy': 1.1,
    'Consumer Goods': 1.1,
    'Pharmaceuticals': 1.0,
    'Financial Services': 0.8,
    'Utilities': 0.7,
    'Real Estate': 0.6,
    'Telecommunications': 0.9
  };
  
  return sectorFactors[sector] || 1.0;
}

/**
 * PRIORITY 1: Enhanced supply chain fallback (UPDATED)
 * Now uses bilateral manufacturing intensity calculations
 */
function estimateSupplyChainFallback(
  sourceCountry: string,
  targetCountry: string,
  tradeIntensity: number
): { 
  value: number; 
  method: 'trade-proxy' | 'sector-pattern' | 'regional' | 'known-zero' | 'oecd-icio' | 'manufacturing-intensity'; 
  confidence: number; 
  knownZeroReason?: string;
  sectorSpecificMethod?: string;
} {
  // ENHANCEMENT 3: Check for Known Zero FIRST (keep existing logic)
  // ... existing known zero checks ...
  
  // PHASE 1 DATA INTEGRATION: Check OECD ICIO data SECOND (keep existing logic)
  // ... existing OECD ICIO checks ...
  
  // PHASE 2: NEW BILATERAL FALLBACK - Use manufacturing intensity
  const sector = detectSector(sourceCountry, targetCountry);
  const fallbackResult = supplyChainFallbackService.getSupplyChainFallbackWithMetadata(
    sourceCountry,
    targetCountry,
    sector
  );
  
  if (fallbackResult.exposure > 0) {
    return {
      value: fallbackResult.exposure,
      method: 'manufacturing-intensity',
      confidence: fallbackResult.confidence,
      sectorSpecificMethod: `Manufacturing intensity method (${fallbackResult.method}, ${fallbackResult.confidence}% confidence)`
    };
  }
  
  // Fallback to trade-proxy if no manufacturing data
  if (tradeIntensity > 0.01) {
    const estimate = Math.max(0.0001, tradeIntensity * 0.30);
    return {
      value: estimate,
      method: 'trade-proxy',
      confidence: 65
    };
  }
  
  // Minimal estimate
  return {
    value: 0.01,
    method: 'regional',
    confidence: 40
  };
}

/**
 * PRIORITY 3: Enhanced financial fallback (UPDATED)
 * Now uses bilateral hub-based calculations
 */
function estimateFinancialFallback(
  sourceCountry: string,
  targetCountry: string,
  tradeIntensity: number
): { 
  value: number; 
  method: 'trade-proxy' | 'currency-pattern' | 'regional' | 'known-zero' | 'unified-financial' | 'imf-cpis' | 'oecd-fdi' | 'bis-banking' | 'financial-hub'; 
  confidence: number; 
  knownZeroReason?: string;
  sectorSpecificMethod?: string;
} {
  // ENHANCEMENT 3: Check for Known Zero FIRST (keep existing logic)
  // ... existing known zero checks ...
  
  // PHASE 2 DATA INTEGRATION: Check Unified Financial FIRST (keep existing logic)
  // ... existing unified financial checks ...
  
  // PHASE 1 DATA INTEGRATION: Check IMF CPIS, OECD FDI, BIS Banking (keep existing logic)
  // ... existing data source checks ...
  
  // PHASE 2: NEW BILATERAL FALLBACK - Use financial hub rankings
  const sector = detectSector(sourceCountry, targetCountry);
  const fallbackResult = financialFallbackService.getFinancialFallbackWithMetadata(
    sourceCountry,
    targetCountry,
    sector
  );
  
  if (fallbackResult.exposure > 0) {
    return {
      value: fallbackResult.exposure,
      method: 'financial-hub',
      confidence: fallbackResult.confidence,
      sectorSpecificMethod: `Financial hub method (${fallbackResult.method}, ${fallbackResult.confidence}% confidence)`
    };
  }
  
  // Fallback to trade-proxy if no hub data
  if (tradeIntensity > 0.01) {
    const estimate = Math.max(0.0001, tradeIntensity * 0.20);
    return {
      value: estimate,
      method: 'trade-proxy',
      confidence: 60
    };
  }
  
  // Minimal estimate
  return {
    value: 0.0001,
    method: 'regional',
    confidence: 40
  };
}

/**
 * Helper function to detect sector (keep existing implementation)
 */
function detectSector(sourceCountry: string, targetCountry: string): string {
  // Use existing COUNTRY_SECTOR_MAPPING logic
  return 'Technology'; // Placeholder
}