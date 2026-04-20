/**
 * Assets Channel Fallback Service
 * 
 * Provides channel-specific fallback for Wₚ (Physical Assets) when evidence is missing
 * Data Sources: GDP-weighted priors with asset-intensity adjustments
 */

interface AssetsFallback {
  country: string;
  weight: number;
  source: string;
  dataQuality: 'medium' | 'low';
}

export class AssetsFallbackService {
  /**
   * Get assets fallback using GDP-weighted priors × asset-intensity
   * This is used ONLY for unknown/missing data, NOT for known zeros
   */
  getAssetsFallback(
    sector: string,
    homeCountry: string,
    evidenceCountries: Set<string>,
    knownZeroCountries: Set<string>,
    unknownPortion: number
  ): Record<string, AssetsFallback> {
    const fallback: Record<string, AssetsFallback> = {};
    
    if (unknownPortion <= 0.01) {
      return fallback;
    }
    
    // GDP-based asset concentration patterns by sector
    // These reflect typical physical asset (PP&E, facilities) distributions
    const gdpAssetPatterns: Record<string, Record<string, number>> = {
      'Technology': {
        'United States': 0.45,
        'China': 0.20,
        'Taiwan': 0.10,
        'South Korea': 0.08,
        'Japan': 0.07,
        'Germany': 0.04,
        'Singapore': 0.03,
        'Ireland': 0.03
      },
      'Manufacturing': {
        'United States': 0.30,
        'China': 0.25,
        'Germany': 0.15,
        'Japan': 0.10,
        'South Korea': 0.08,
        'Mexico': 0.05,
        'India': 0.04,
        'Brazil': 0.03
      },
      'Energy': {
        'United States': 0.35,
        'Saudi Arabia': 0.15,
        'Russia': 0.12,
        'China': 0.10,
        'Canada': 0.08,
        'United Arab Emirates': 0.07,
        'Norway': 0.06,
        'Brazil': 0.04,
        'Qatar': 0.03
      },
      'Healthcare': {
        'United States': 0.50,
        'Germany': 0.12,
        'Switzerland': 0.10,
        'United Kingdom': 0.08,
        'Japan': 0.06,
        'France': 0.05,
        'China': 0.04,
        'Ireland': 0.03,
        'Singapore': 0.02
      },
      'Consumer Goods': {
        'United States': 0.35,
        'China': 0.25,
        'Germany': 0.10,
        'United Kingdom': 0.08,
        'Japan': 0.06,
        'France': 0.05,
        'Italy': 0.04,
        'Mexico': 0.04,
        'Brazil': 0.03
      },
      'Retail': {
        'United States': 0.40,
        'China': 0.20,
        'United Kingdom': 0.10,
        'Germany': 0.08,
        'Japan': 0.06,
        'France': 0.05,
        'Canada': 0.04,
        'Australia': 0.04,
        'Brazil': 0.03
      },
      'Telecommunications': {
        'United States': 0.35,
        'China': 0.25,
        'Japan': 0.10,
        'Germany': 0.08,
        'United Kingdom': 0.07,
        'South Korea': 0.05,
        'France': 0.04,
        'India': 0.03,
        'Brazil': 0.03
      },
      'Financial Services': {
        'United States': 0.50,
        'United Kingdom': 0.15,
        'Japan': 0.10,
        'China': 0.08,
        'Germany': 0.05,
        'France': 0.04,
        'Switzerland': 0.03,
        'Singapore': 0.03,
        'Hong Kong': 0.02
      }
    };
    
    // Asset-intensity multipliers (capital-intensive sectors get higher concentration)
    const assetIntensityMultipliers: Record<string, number> = {
      'Energy': 1.3,           // Very capital intensive
      'Manufacturing': 1.2,     // Capital intensive
      'Telecommunications': 1.2, // Capital intensive
      'Technology': 1.0,        // Moderate
      'Healthcare': 1.0,        // Moderate
      'Consumer Goods': 0.9,    // Less capital intensive
      'Retail': 0.8,            // Less capital intensive
      'Financial Services': 0.7 // Least capital intensive (mostly intangible)
    };
    
    const pattern = gdpAssetPatterns[sector] || gdpAssetPatterns['Technology'];
    const intensityMultiplier = assetIntensityMultipliers[sector] || 1.0;
    
    // Build effective template excluding evidence and known-zero countries
    const effectiveTemplate: Record<string, number> = {};
    let sumTemplate = 0;
    
    for (const [country, weight] of Object.entries(pattern)) {
      if (!evidenceCountries.has(country) && !knownZeroCountries.has(country) && weight > 0.01) {
        // Apply asset-intensity adjustment
        let adjustedWeight = weight;
        
        // Home country gets intensity boost (assets tend to concentrate at HQ)
        if (country === homeCountry) {
          adjustedWeight *= (1.0 + intensityMultiplier * 0.2);
        }
        
        effectiveTemplate[country] = adjustedWeight;
        sumTemplate += adjustedWeight;
      }
    }
    
    // Distribute unknown portion according to template
    if (sumTemplate > 0) {
      for (const [country, weight] of Object.entries(effectiveTemplate)) {
        const finalWeight = (weight / sumTemplate) * unknownPortion;
        fallback[country] = {
          country,
          weight: finalWeight,
          source: 'GDP-Weighted Asset Priors × Asset-Intensity Adjustments',
          dataQuality: 'medium'
        };
      }
    } else if (unknownPortion > 0) {
      // Last resort: allocate to home country (assets typically concentrated at HQ)
      fallback[homeCountry] = {
        country: homeCountry,
        weight: unknownPortion,
        source: 'Home Country Asset Concentration (Default Fallback)',
        dataQuality: 'low'
      };
    }
    
    return fallback;
  }
}

export const assetsFallbackService = new AssetsFallbackService();