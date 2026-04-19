/**
 * Sector-Specific Fallback Templates
 * 
 * These templates provide intelligent fallback exposure distributions
 * when evidence-based data is incomplete. They represent typical
 * geographic footprints for each sector based on:
 * - Industry trade patterns
 * - Global market analysis
 * - Supply chain research
 * - Historical company data
 * 
 * Weights are normalized and represent relative likelihood of exposure
 * in countries where no direct evidence exists.
 */

export interface SectorFallbackTemplate {
  [country: string]: number;
}

export const SECTOR_FALLBACK_TEMPLATES: Record<string, SectorFallbackTemplate> = {
  'Technology': {
    'United States': 0.25,
    'China': 0.18,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.07,
    'South Korea': 0.06,
    'Taiwan': 0.05,
    'Singapore': 0.04,
    'India': 0.05,
    'Israel': 0.03,
    'France': 0.03,
    'Canada': 0.02,
    'Netherlands': 0.02,
    'Sweden': 0.01,
    'Ireland': 0.01
  },

  'Financial Services': {
    'United States': 0.30,
    'United Kingdom': 0.15,
    'Switzerland': 0.10,
    'Hong Kong': 0.08,
    'Singapore': 0.07,
    'Japan': 0.06,
    'Germany': 0.05,
    'France': 0.04,
    'Luxembourg': 0.03,
    'Netherlands': 0.03,
    'Canada': 0.03,
    'Australia': 0.02,
    'Ireland': 0.02,
    'China': 0.01,
    'United Arab Emirates': 0.01
  },

  'Energy': {
    'United States': 0.20,
    'Saudi Arabia': 0.15,
    'Russia': 0.12,
    'Canada': 0.10,
    'China': 0.08,
    'United Arab Emirates': 0.07,
    'Norway': 0.06,
    'Qatar': 0.05,
    'Kuwait': 0.04,
    'Iraq': 0.03,
    'Brazil': 0.03,
    'Mexico': 0.02,
    'Nigeria': 0.02,
    'Australia': 0.02,
    'United Kingdom': 0.01
  },

  'Automotive': {
    'China': 0.22,
    'United States': 0.18,
    'Germany': 0.12,
    'Japan': 0.10,
    'South Korea': 0.08,
    'India': 0.07,
    'Mexico': 0.05,
    'Brazil': 0.04,
    'France': 0.03,
    'United Kingdom': 0.03,
    'Spain': 0.02,
    'Italy': 0.02,
    'Thailand': 0.02,
    'Czech Republic': 0.01,
    'Poland': 0.01
  },

  'Healthcare': {
    'United States': 0.30,
    'Germany': 0.12,
    'Switzerland': 0.10,
    'United Kingdom': 0.08,
    'Japan': 0.07,
    'France': 0.06,
    'China': 0.05,
    'Canada': 0.04,
    'Netherlands': 0.03,
    'Belgium': 0.03,
    'Italy': 0.03,
    'Spain': 0.02,
    'Sweden': 0.02,
    'Denmark': 0.02,
    'India': 0.02,
    'Ireland': 0.01
  },

  'Industrials': {
    'China': 0.25,
    'United States': 0.18,
    'Germany': 0.12,
    'Japan': 0.10,
    'South Korea': 0.06,
    'India': 0.05,
    'United Kingdom': 0.04,
    'France': 0.04,
    'Italy': 0.03,
    'Canada': 0.03,
    'Brazil': 0.02,
    'Mexico': 0.02,
    'Spain': 0.02,
    'Poland': 0.02,
    'Turkey': 0.01,
    'Russia': 0.01
  },

  'Consumer Cyclical': {
    'United States': 0.22,
    'China': 0.20,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.07,
    'France': 0.05,
    'India': 0.05,
    'Brazil': 0.04,
    'Italy': 0.03,
    'Canada': 0.03,
    'South Korea': 0.03,
    'Spain': 0.02,
    'Mexico': 0.02,
    'Australia': 0.02,
    'Netherlands': 0.02,
    'Turkey': 0.01,
    'Indonesia': 0.01
  },

  'Consumer Defensive': {
    'United States': 0.20,
    'China': 0.15,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.07,
    'France': 0.06,
    'Brazil': 0.05,
    'India': 0.05,
    'Mexico': 0.04,
    'Italy': 0.03,
    'Spain': 0.03,
    'Canada': 0.03,
    'Russia': 0.03,
    'Australia': 0.02,
    'South Korea': 0.02,
    'Indonesia': 0.02,
    'Turkey': 0.01,
    'Thailand': 0.01
  },

  'Basic Materials': {
    'China': 0.30,
    'United States': 0.15,
    'Australia': 0.10,
    'Brazil': 0.08,
    'Russia': 0.07,
    'India': 0.05,
    'Canada': 0.05,
    'South Africa': 0.04,
    'Chile': 0.03,
    'Peru': 0.03,
    'Germany': 0.02,
    'Japan': 0.02,
    'Mexico': 0.02,
    'Indonesia': 0.02,
    'Kazakhstan': 0.01,
    'Saudi Arabia': 0.01
  },

  'Telecommunications': {
    'United States': 0.20,
    'China': 0.18,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.07,
    'India': 0.06,
    'South Korea': 0.05,
    'France': 0.04,
    'Brazil': 0.04,
    'Italy': 0.03,
    'Spain': 0.03,
    'Canada': 0.03,
    'Australia': 0.02,
    'Mexico': 0.02,
    'Netherlands': 0.02,
    'Turkey': 0.01,
    'Indonesia': 0.01,
    'Russia': 0.01
  },

  'Utilities': {
    'United States': 0.22,
    'China': 0.20,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.06,
    'France': 0.05,
    'India': 0.05,
    'Brazil': 0.04,
    'Canada': 0.04,
    'Italy': 0.03,
    'Spain': 0.03,
    'Australia': 0.02,
    'South Korea': 0.02,
    'Mexico': 0.02,
    'Russia': 0.02,
    'Turkey': 0.01,
    'Indonesia': 0.01
  },

  'Real Estate': {
    'United States': 0.20,
    'China': 0.15,
    'Japan': 0.10,
    'United Kingdom': 0.07,
    'Germany': 0.06,
    'Argentina': 0.06,
    'Brazil': 0.05,
    'France': 0.04,
    'Australia': 0.04,
    'Canada': 0.04,
    'Hong Kong': 0.03,
    'Singapore': 0.03,
    'Spain': 0.03,
    'Mexico': 0.02,
    'Chile': 0.02,
    'Italy': 0.02,
    'Netherlands': 0.02,
    'South Korea': 0.01,
    'United Arab Emirates': 0.01
  },

  'Communication Services': {
    'United States': 0.28,
    'China': 0.15,
    'Japan': 0.10,
    'United Kingdom': 0.08,
    'Germany': 0.07,
    'South Korea': 0.06,
    'France': 0.05,
    'Canada': 0.04,
    'India': 0.04,
    'Brazil': 0.03,
    'Australia': 0.02,
    'Spain': 0.02,
    'Italy': 0.02,
    'Mexico': 0.02,
    'Netherlands': 0.01,
    'Indonesia': 0.01
  },

  'General': {
    'United States': 0.22,
    'China': 0.18,
    'Japan': 0.10,
    'Germany': 0.08,
    'United Kingdom': 0.07,
    'France': 0.05,
    'India': 0.05,
    'Brazil': 0.04,
    'Italy': 0.03,
    'Canada': 0.03,
    'South Korea': 0.03,
    'Spain': 0.03,
    'Australia': 0.02,
    'Mexico': 0.02,
    'Netherlands': 0.02,
    'Turkey': 0.01,
    'Indonesia': 0.01,
    'Russia': 0.01
  }
};

/**
 * Get sector fallback template
 * Returns the template for the specified sector, or General if not found
 */
export function getSectorFallbackTemplate(sector: string): SectorFallbackTemplate {
  return SECTOR_FALLBACK_TEMPLATES[sector] || SECTOR_FALLBACK_TEMPLATES['General'];
}

/**
 * Normalize a fallback template to ensure weights sum to 1.0
 */
export function normalizeFallbackTemplate(template: SectorFallbackTemplate): SectorFallbackTemplate {
  const total = Object.values(template).reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return template;
  
  const normalized: SectorFallbackTemplate = {};
  for (const [country, weight] of Object.entries(template)) {
    normalized[country] = weight / total;
  }
  return normalized;
}