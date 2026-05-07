/**
 * Supply Chain Channel Fallback Service - PHASE 2 REWRITE
 * 
 * Provides BILATERAL, TARGET-CENTRIC fallback for supply chain exposure
 * Uses manufacturing intensity data from Phase 1 (NOT flat multiple of trade)
 */

import { 
  getGDPByCountryName, 
  getDistance, 
  getManufacturingDataByName,
  getNetworkIntegrationMultiplier,
  shareProductionNetwork,
  getFinancialHubByName
} from '@/data/predictiveAnalytics';

/**
 * Calculate bilateral supply chain exposure using manufacturing intensity
 * This is NOT a flat multiple of trade - it incorporates manufacturing data
 */
export function calculateSupplyChainExposureFallback(
  sourceCountry: string,
  targetCountry: string,
  sector: string
): {
  exposure: number;
  method: 'manufacturing_intensity' | 'regional_network' | 'trade_proxy';
  confidence: number;
} {
  // Step 1: Calculate base trade exposure (gravity model)
  const sourceGDPData = getGDPByCountryName(sourceCountry);
  const targetGDPData = getGDPByCountryName(targetCountry);
  const distance = getDistance(sourceCountry, targetCountry);
  
  if (!sourceGDPData || !targetGDPData || !distance) {
    return { exposure: 0, method: 'trade_proxy', confidence: 0 };
  }
  
  const sourceGDP = sourceGDPData.gdp_usd;
  const targetGDP = targetGDPData.gdp_usd;
  
  // Get country codes for network checking
  const sourceCode = sourceGDPData.country_code;
  const targetCode = targetGDPData.country_code;
  
  // Gravity model with MUCH reduced GDP weight (use cube root to heavily reduce GDP dominance)
  // This allows smaller countries in same network to rank much higher
  const k = 8e-2;
  const baseTradeExposure = k * (Math.pow(sourceGDP, 1/3) * Math.pow(targetGDP, 1/3)) / Math.pow(distance, 3);
  
  // Step 2: Get manufacturing intensity (THIS IS KEY - NOT FLAT MULTIPLE)
  const manufacturingData = getManufacturingDataByName(sourceCountry);
  const manufacturingIntensity = manufacturingData?.manufacturing_va_percent || 15;
  const manufacturingFactor = manufacturingIntensity / 100;
  
  // Step 3: Get intermediate goods share by sector
  const intermediateGoodsShare = getIntermediateGoodsShare(sector);
  
  // Step 4: Get production network factor (EXTREMELY STRONGLY boosts East Asia, ASEAN, etc.)
  const networkFactor = getNetworkIntegrationMultiplier(sourceCode, targetCode);
  const inSameNetwork = shareProductionNetwork(sourceCode, targetCode);
  
  // Step 5: Check if source is a logistics/financial hub
  // Major hubs (top 10) get massive boost, other hubs (top 35) get moderate boost
  const sourceHub = getFinancialHubByName(sourceCountry);
  const isMajorHub = sourceHub?.is_major_hub || false; // Top 10
  const isRegionalHub = sourceHub && sourceHub.gfci_rank <= 35 && !isMajorHub; // Ranks 11-35
  
  // Apply network factor EXTREMELY aggressively
  let enhancedNetworkFactor: number;
  if (inSameNetwork) {
    enhancedNetworkFactor = Math.pow(networkFactor, 2.5);
    // Differentiated hub bonuses
    if (isMajorHub) {
      enhancedNetworkFactor *= 3.5; // 250% boost for major hubs (Singapore, Hong Kong)
    } else if (isRegionalHub) {
      enhancedNetworkFactor *= 2.2; // 120% boost for regional hubs (Malaysia, Thailand)
    }
  } else {
    // Countries not in same network get VERY heavily penalized
    enhancedNetworkFactor = networkFactor * 0.25;
  }
  
  // Step 6: Calculate supply chain exposure (NOT flat multiple of trade)
  const supplyChainExposure = baseTradeExposure 
                             * manufacturingFactor 
                             * intermediateGoodsShare 
                             * enhancedNetworkFactor;
  
  // Step 7: Determine method and confidence
  let method: 'manufacturing_intensity' | 'regional_network' | 'trade_proxy';
  let confidence: number;
  
  if (manufacturingData && networkFactor > 1.0) {
    method = 'manufacturing_intensity';
    confidence = 75;
  } else if (manufacturingData) {
    method = 'manufacturing_intensity';
    confidence = 65;
  } else if (networkFactor > 1.0) {
    method = 'regional_network';
    confidence = 55;
  } else {
    method = 'trade_proxy';
    confidence = 50;
  }
  
  return { exposure: supplyChainExposure, method, confidence };
}

/**
 * Get intermediate goods share by sector
 */
function getIntermediateGoodsShare(sector: string): number {
  const sectorShares: Record<string, number> = {
    'Technology': 0.7,
    'Electronics': 0.7,
    'Manufacturing': 0.5,
    'Automotive': 0.6,
    'Aerospace': 0.6,
    'Pharmaceuticals': 0.5,
    'Chemicals': 0.6,
    'Consumer Goods': 0.4,
    'Financial Services': 0.3,
    'Energy': 0.4,
    'Utilities': 0.3,
    'Real Estate': 0.2,
    'Healthcare': 0.3,
    'Telecommunications': 0.4
  };
  
  return sectorShares[sector] || 0.5;
}

interface SupplyChainFallback {
  country: string;
  weight: number;
  source: string;
  dataQuality: 'medium' | 'low';
}

export class SupplyChainFallbackService {
  /**
   * Get supply chain fallback exposure (bilateral, target-centric)
   */
  getSupplyChainFallback(
    sourceCountry: string,
    targetCountry: string,
    sector: string
  ): number {
    const result = calculateSupplyChainExposureFallback(sourceCountry, targetCountry, sector);
    return result.exposure;
  }
  
  /**
   * Get supply chain fallback with metadata
   */
  getSupplyChainFallbackWithMetadata(
    sourceCountry: string,
    targetCountry: string,
    sector: string
  ): {
    exposure: number;
    method: string;
    confidence: number;
  } {
    return calculateSupplyChainExposureFallback(sourceCountry, targetCountry, sector);
  }
}

export const supplyChainFallbackService = new SupplyChainFallbackService();