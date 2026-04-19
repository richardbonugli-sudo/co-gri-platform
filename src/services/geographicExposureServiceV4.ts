/**
 * Geographic Exposure Service V.4 Integration
 * 
 * This service provides a unified interface for geographic exposure data,
 * automatically routing to V.4 or legacy based on feature flags and data availability.
 */

import { shouldUseV4, getFeatureFlags } from '@/config/featureFlags';
import { ENHANCED_COMPANY_EXPOSURES, hasV4Enhancements, getLegacyExposures } from '@/data/enhancedCompanyExposures';
import { COMPANY_SPECIFIC_EXPOSURES, getCompanySpecificExposure } from '@/data/companySpecificExposures';
import { calculateV4Exposures } from './v4Integration';

export interface GeographicExposureResult {
  ticker: string;
  company: string;
  homeCountry: string;
  sector: string;
  segments: Array<{
    country: string;
    revenuePercentage?: number;
  }>;
  channelBreakdown?: any;
  dataSource: string;
  isV4: boolean;
  v4Metadata?: {
    version: string;
    hasEnhancements: boolean;
    enhancementStatus: string;
  };
}

/**
 * Get geographic exposure data with automatic V.4/legacy routing
 */
export async function getGeographicExposureV4(
  ticker: string
): Promise<GeographicExposureResult | null> {
  
  const upperTicker = ticker.toUpperCase();
  const flags = getFeatureFlags();
  
  console.log(`[Geographic Exposure V.4] Fetching data for ${upperTicker}`);
  
  // Check if we should use V.4
  const useV4 = shouldUseV4(upperTicker);
  
  if (useV4 && hasV4Enhancements(upperTicker)) {
    console.log(`[Geographic Exposure V.4] Using V.4 enhanced data for ${upperTicker}`);
    return getV4EnhancedData(upperTicker);
  } else {
    console.log(`[Geographic Exposure V.4] Using legacy data for ${upperTicker}`);
    return getLegacyData(upperTicker);
  }
}

/**
 * Get V.4 enhanced data
 */
async function getV4EnhancedData(ticker: string): Promise<GeographicExposureResult | null> {
  const companyData = ENHANCED_COMPANY_EXPOSURES[ticker];
  
  if (!companyData) {
    console.log(`[Geographic Exposure V.4] No V.4 data found for ${ticker}`);
    return null;
  }
  
  try {
    // Calculate V.4 exposures
    const v4Results = await calculateV4Exposures(ticker);
    
    // 🔍 DEBUG: Log what each channel returned
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Channel results for ${ticker}:`);
    console.log(`  Revenue countries: ${Array.from(v4Results.revenue.keys()).join(', ')}`);
    console.log(`  Supply countries: ${Array.from(v4Results.supply.keys()).join(', ')}`);
    console.log(`  Assets countries: ${Array.from(v4Results.assets.keys()).join(', ')}`);
    console.log(`  Financial countries: ${Array.from(v4Results.financial.keys()).join(', ')}`);
    
    // FIX: Aggregate countries from ALL channels, not just revenue
    const allCountries = new Set<string>();
    
    // Add countries from all channels
    v4Results.revenue.forEach((_, country) => allCountries.add(country));
    v4Results.supply.forEach((_, country) => allCountries.add(country));
    v4Results.assets.forEach((_, country) => allCountries.add(country));
    v4Results.financial.forEach((_, country) => allCountries.add(country));
    
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Total unique countries: ${allCountries.size}`);
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Countries list: ${Array.from(allCountries).join(', ')}`);
    
    // CRITICAL FIX: Calculate blended weight for each country first, then create segments
    // This ensures we include ALL countries with exposure in ANY channel
    const countryWeights = new Map<string, { revenue: number; blended: number }>();
    
    for (const country of allCountries) {
      const revWeight = v4Results.revenue.get(country) || 0;
      const supWeight = v4Results.supply.get(country) || 0;
      const assWeight = v4Results.assets.get(country) || 0;
      const finWeight = v4Results.financial.get(country) || 0;
      
      const blended = 
        revWeight * 0.40 +
        supWeight * 0.35 +
        assWeight * 0.15 +
        finWeight * 0.10;
      
      countryWeights.set(country, {
        revenue: revWeight,
        blended: blended
      });
    }
    
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Country weights calculated for ${countryWeights.size} countries`);
    
    // Convert to geographic segments using BLENDED weight (not just revenue)
    // Include ALL countries that have exposure in ANY channel
    const segments = Array.from(countryWeights.entries())
      .filter(([_, weights]) => weights.blended > 0) // Filter by blended weight, not revenue
      .map(([country, weights]) => ({
        country,
        revenuePercentage: weights.revenue * 100 // Still show revenue % for display
      }));
    
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Final segments count: ${segments.length}`);
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Segments: ${segments.map(s => `${s.country}: ${s.revenuePercentage.toFixed(2)}%`).join(', ')}`);
    
    // Build channel breakdown for ALL countries
    const channelBreakdown: any = {};
    
    for (const [country, weights] of countryWeights.entries()) {
      // Only include countries with blended exposure > 0
      if (weights.blended > 0) {
        const revWeight = v4Results.revenue.get(country) || 0;
        const supWeight = v4Results.supply.get(country) || 0;
        const assWeight = v4Results.assets.get(country) || 0;
        const finWeight = v4Results.financial.get(country) || 0;
        
        channelBreakdown[country] = {
          revenue: {
            weight: revWeight,
            status: revWeight > 0 ? 'evidence' : 'no_exposure',
            fallbackType: 'none',
            evidenceLevel: 'direct_evidence',
            evidenceScore: 95,
            confidence: 0.95
          },
          supply: {
            weight: supWeight,
            status: supWeight > 0 ? 'high_confidence_estimate' : 'no_exposure',
            fallbackType: 'SSF',
            evidenceLevel: 'high_confidence',
            evidenceScore: 85,
            confidence: 0.85
          },
          assets: {
            weight: assWeight,
            status: assWeight > 0 ? 'high_confidence_estimate' : 'no_exposure',
            fallbackType: 'SSF',
            evidenceLevel: 'high_confidence',
            evidenceScore: 85,
            confidence: 0.85
          },
          operations: {
            weight: finWeight,
            status: finWeight > 0 ? 'high_confidence_estimate' : 'no_exposure',
            fallbackType: 'SSF',
            evidenceLevel: 'high_confidence',
            evidenceScore: 88,
            confidence: 0.88
          },
          blended: weights.blended
        };
      }
    }
    
    console.log(`[Geographic Exposure V.4] 🔍 DEBUG: Channel breakdown countries: ${Object.keys(channelBreakdown).join(', ')}`);
    
    return {
      ticker,
      company: companyData.companyName,
      homeCountry: companyData.homeCountry,
      sector: companyData.sector,
      segments,
      channelBreakdown,
      dataSource: 'V.4 Enhanced Multi-Channel Assessment',
      isV4: true,
      v4Metadata: companyData.v4Metadata
    };
    
  } catch (error) {
    console.error(`[Geographic Exposure V.4] Error calculating V.4 exposures for ${ticker}:`, error);
    // Fallback to legacy
    return getLegacyData(ticker);
  }
}

/**
 * Get legacy data
 */
function getLegacyData(ticker: string): GeographicExposureResult | null {
  // Try enhanced database first (for backward compatibility)
  const enhancedData = ENHANCED_COMPANY_EXPOSURES[ticker];
  if (enhancedData) {
    const segments = enhancedData.exposures.map(exp => ({
      country: exp.country,
      revenuePercentage: exp.percentage
    }));
    
    return {
      ticker,
      company: enhancedData.companyName,
      homeCountry: enhancedData.homeCountry,
      sector: enhancedData.sector,
      segments,
      dataSource: enhancedData.dataSource,
      isV4: false
    };
  }
  
  // Try legacy database
  const legacyData = COMPANY_SPECIFIC_EXPOSURES[ticker];
  if (legacyData) {
    const segments = legacyData.exposures.map(exp => ({
      country: exp.country,
      revenuePercentage: exp.percentage
    }));
    
    return {
      ticker,
      company: legacyData.companyName,
      homeCountry: legacyData.homeCountry,
      sector: legacyData.sector,
      segments,
      dataSource: legacyData.dataSource,
      isV4: false
    };
  }
  
  console.log(`[Geographic Exposure V.4] No data found for ${ticker}`);
  return null;
}

/**
 * Check if geographic exposure data exists for a ticker
 */
export function hasGeographicExposure(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase();
  return upperTicker in ENHANCED_COMPANY_EXPOSURES || 
         upperTicker in COMPANY_SPECIFIC_EXPOSURES;
}

/**
 * Get list of all tickers with geographic exposure data
 */
export function getAllExposureTickers(): string[] {
  const enhancedTickers = Object.keys(ENHANCED_COMPANY_EXPOSURES);
  const legacyTickers = Object.keys(COMPANY_SPECIFIC_EXPOSURES);
  
  // Combine and deduplicate
  return Array.from(new Set([...enhancedTickers, ...legacyTickers]));
}

/**
 * Get exposure statistics
 */
export function getExposureStatistics(): {
  total: number;
  v4Enhanced: number;
  legacy: number;
  v4Percentage: number;
} {
  const enhancedTickers = Object.keys(ENHANCED_COMPANY_EXPOSURES);
  const v4Enhanced = enhancedTickers.filter(ticker => hasV4Enhancements(ticker)).length;
  const legacy = enhancedTickers.length - v4Enhanced + Object.keys(COMPANY_SPECIFIC_EXPOSURES).length;
  const total = enhancedTickers.length + Object.keys(COMPANY_SPECIFIC_EXPOSURES).length;
  
  return {
    total,
    v4Enhanced,
    legacy,
    v4Percentage: total > 0 ? (v4Enhanced / total) * 100 : 0
  };
}