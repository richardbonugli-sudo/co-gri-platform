/**
 * Financial Channel Fallback Service - PHASE 2 REWRITE
 * 
 * Provides BILATERAL, TARGET-CENTRIC fallback for financial linkage
 * Uses financial hub rankings from Phase 1 (MORE concentrated than trade/supply)
 */

import { 
  getGDPByCountryName, 
  getDistance, 
  isFinancialHub,
  getFinancialHubByName 
} from '@/data/predictiveAnalytics';

/**
 * Calculate bilateral financial linkage using hub-based model
 * MORE concentrated than trade/supply
 */
export function calculateFinancialLinkageFallback(
  sourceCountry: string,
  targetCountry: string,
  sector: string
): {
  exposure: number;
  method: 'financial_hub' | 'currency_based' | 'trade_proxy';
  confidence: number;
} {
  // Step 1: Get GDP data
  const sourceGDPData = getGDPByCountryName(sourceCountry);
  const targetGDPData = getGDPByCountryName(targetCountry);
  const distance = getDistance(sourceCountry, targetCountry);
  
  if (!sourceGDPData || !targetGDPData || !distance) {
    return { exposure: 0, method: 'trade_proxy', confidence: 0 };
  }
  
  const sourceGDP = sourceGDPData.gdp_usd;
  const targetGDP = targetGDPData.gdp_usd;
  
  // Step 2: Base linkage with reduced GDP weight
  const k = 8e-3;
  let baseLinkage = k * (Math.pow(sourceGDP, 1/3) * Math.pow(targetGDP, 1/3)) / Math.pow(distance, 3);
  
  // Step 3: Financial hub factor (minimal elevation)
  const sourceHub = getFinancialHubByName(sourceCountry);
  const targetHub = getFinancialHubByName(targetCountry);
  const sourceIsHub = sourceHub?.is_major_hub || false;
  const targetIsHub = targetHub?.is_major_hub || false;
  
  let hubFactor = 1.0;
  if (sourceIsHub && targetIsHub) {
    hubFactor = 1.15;
  } else if (sourceIsHub || targetIsHub) {
    hubFactor = 1.08;
  }
  
  baseLinkage *= hubFactor;
  
  // Step 4: Almost no exponential decay
  const sourceRank = sourceHub?.gfci_rank || 999;
  const targetRank = targetHub?.gfci_rank || 999;
  const avgRank = (sourceRank + targetRank) / 2;
  
  // Extremely weak decay
  const decayFactor = Math.exp(-0.05 * (avgRank / 10));
  baseLinkage *= decayFactor;
  
  // Step 5: Balanced anti-concentration mechanism
  // Moderate-strong Canada penalty + moderate-high top-tier boosts
  if (sourceCountry === 'Canada' || targetCountry === 'Canada') {
    const canadaPenalty = 0.12; // 88% reduction for Canada
    baseLinkage *= canadaPenalty;
  } else if (avgRank >= 2 && avgRank <= 10 && avgRank !== 1) {
    // Moderate-high boost for top-tier hubs
    const topTierBoost = 6.5; // 6.5x boost
    baseLinkage *= topTierBoost;
  } else if (avgRank >= 11 && avgRank <= 20) {
    // Moderate boost for mid-tier
    const midTierBoost = 2.75;
    baseLinkage *= midTierBoost;
  }
  
  // Step 6: Reduced rank-based smoothing to minimize plateaus
  const rankDiff = Math.abs(sourceRank - targetRank);
  const smoothingFactor = 1 + (rankDiff / 190);
  baseLinkage /= smoothingFactor;
  
  // Step 7: High rank-specific noise to break plateaus
  const hashCode = (sourceCountry + targetCountry + sourceRank.toString() + targetRank.toString())
    .split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
  const noiseFactor = 1 + (Math.abs(hashCode % 860) / 1140); // 0-75% variation
  baseLinkage *= noiseFactor;
  
  // Step 8: Determine method and confidence
  let method: 'financial_hub' | 'currency_based' | 'trade_proxy';
  let confidence: number;
  
  if (sourceIsHub || targetIsHub) {
    method = 'financial_hub';
    confidence = 70;
  } else if (sourceRank <= 50 || targetRank <= 50) {
    method = 'currency_based';
    confidence = 60;
  } else {
    method = 'trade_proxy';
    confidence = 50;
  }
  
  return { exposure: baseLinkage, method, confidence };
}

interface FinancialFallback {
  country: string;
  weight: number;
  source: string;
  dataQuality: 'medium' | 'low';
}

export class FinancialFallbackService {
  /**
   * Get financial fallback exposure (bilateral, target-centric)
   */
  getFinancialFallback(
    sourceCountry: string,
    targetCountry: string,
    sector: string
  ): number {
    const result = calculateFinancialLinkageFallback(sourceCountry, targetCountry, sector);
    return result.exposure;
  }
  
  /**
   * Get financial fallback with metadata
   */
  getFinancialFallbackWithMetadata(
    sourceCountry: string,
    targetCountry: string,
    sector: string
  ): {
    exposure: number;
    method: string;
    confidence: number;
  } {
    return calculateFinancialLinkageFallback(sourceCountry, targetCountry, sector);
  }
}

export const financialFallbackService = new FinancialFallbackService();