/**
 * Sector Exposure Data - Dynamic Calculation System with Percentile-Based Scoring
 * 
 * This file now uses percentile-based normalization for more intuitive score interpretation.
 * Scores reflect global ranking (0 = lowest globally, 100 = highest globally).
 * 
 * Risk Level Bands (Percentile-Based):
 * - Severe: 80-100 (Top 20% highest risk globally)
 * - Very High: 60-80 (Top 40% highest risk globally)
 * - High: 40-60 (Middle 20% risk range)
 * - Moderate: 20-40 (Lower 40% risk range)
 * - Low: 0-20 (Bottom 20% lowest risk globally)
 * 
 * Contribution: Percentage contribution to overall CSI
 * Trend: Increasing, Stable, Decreasing
 */

import {
  calculateAllCountrySectorExposures,
  calculateAllGlobalSectorExposures,
} from '@/utils/sectorCalculations';
import { ALL_SECTORS } from '@/data/sectorMultipliers';

export interface SectorExposure {
  sector: string;
  riskScore: number; // 0-100 percentile score (global ranking)
  contribution: number; // Percentage contribution to CSI
  sensitivity: 'Very High' | 'High' | 'Moderate' | 'Low';
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  description: string;
}

export interface CountrySectorProfile {
  country: string;
  sectors: SectorExposure[];
}

// Sector definitions
export const SECTORS = ALL_SECTORS;

// Helper function to determine sensitivity based on percentile score
function getSensitivity(score: number): 'Very High' | 'High' | 'Moderate' | 'Low' {
  if (score >= 75) return 'Very High';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Moderate';
  return 'Low';
}

// Sector descriptions (static, for UI display)
const SECTOR_DESCRIPTIONS: Record<string, string> = {
  'Energy & Resources': 'Oil, gas, mining, and renewable energy sectors exposed to supply disruptions and sanctions',
  'Financial Services': 'Banking, insurance, and capital markets affected by sanctions and regulatory changes',
  'Manufacturing & Industry': 'Industrial production vulnerable to supply chain disruptions and trade barriers',
  'Technology & Telecom': 'Tech sector facing export controls, cyber threats, and data sovereignty issues',
  'Trade & Logistics': 'Transportation and logistics networks disrupted by sanctions and route closures',
  'Agriculture & Food': 'Food production and exports impacted by climate, conflicts, and trade restrictions',
  'Healthcare & Pharma': 'Medical supplies and pharmaceuticals affected by sanctions and regulatory barriers',
  'Tourism & Services': 'Travel and hospitality sector sensitive to security concerns and travel advisories',
  'Real Estate & Construction': 'Property and construction markets affected by economic instability and capital flows',
  'Defense & Security': 'Defense industry and security services responding to geopolitical tensions',
};

// Sector trends (can be updated based on time-series analysis)
const SECTOR_TRENDS: Record<string, 'Increasing' | 'Stable' | 'Decreasing'> = {
  'Energy & Resources': 'Increasing',
  'Financial Services': 'Stable',
  'Manufacturing & Industry': 'Stable',
  'Technology & Telecom': 'Increasing',
  'Trade & Logistics': 'Stable',
  'Agriculture & Food': 'Increasing',
  'Healthcare & Pharma': 'Stable',
  'Tourism & Services': 'Decreasing',
  'Real Estate & Construction': 'Increasing',
  'Defense & Security': 'Increasing',
};

/**
 * Calculate contribution percentage for a sector
 * Based on the sector's relative exposure compared to total
 */
function calculateContribution(sectorScore: number, allScores: number[]): number {
  const total = allScores.reduce((sum, score) => sum + score, 0);
  if (total === 0) return 0;
  return Math.round((sectorScore / total) * 100);
}

/**
 * Get sector data for a specific country (Country Mode)
 * Uses percentile-based scoring for global context
 * 
 * @param country - Country name
 * @returns Array of sector exposures with percentile-based risk scores
 */
export function getCountrySectorData(country: string): SectorExposure[] {
  // Calculate all sector exposures for the country (now using percentile-based scoring)
  const sectorExposures = calculateAllCountrySectorExposures(country);
  
  // Get all display scores for contribution calculation
  const allDisplayScores = Object.values(sectorExposures).map(e => e.display);
  
  // Build sector exposure array
  return ALL_SECTORS.map(sector => {
    const exposure = sectorExposures[sector];
    const contribution = calculateContribution(exposure.display, allDisplayScores);
    
    return {
      sector,
      riskScore: Math.round(exposure.display), // 0-100 percentile score
      contribution,
      sensitivity: getSensitivity(exposure.display),
      trend: SECTOR_TRENDS[sector] || 'Stable',
      description: SECTOR_DESCRIPTIONS[sector] || `${sector} sector exposure`,
    };
  });
}

/**
 * Get global sector data (Global Mode)
 * Uses percentile-based scoring for global context
 * 
 * @returns Array of sector exposures with percentile-based global risk scores
 */
export function getGlobalSectorData(): SectorExposure[] {
  // Calculate all global sector exposures (now using percentile-based scoring)
  const sectorExposures = calculateAllGlobalSectorExposures();
  
  // Get all display scores for contribution calculation
  const allDisplayScores = Object.values(sectorExposures).map(e => e.display);
  
  // Build sector exposure array
  return ALL_SECTORS.map(sector => {
    const exposure = sectorExposures[sector];
    const contribution = calculateContribution(exposure.display, allDisplayScores);
    
    return {
      sector,
      riskScore: Math.round(exposure.display), // 0-100 percentile score
      contribution,
      sensitivity: getSensitivity(exposure.display),
      trend: SECTOR_TRENDS[sector] || 'Stable',
      description: SECTOR_DESCRIPTIONS[sector] || `${sector} sector exposure`,
    };
  });
}

/**
 * BACKWARD COMPATIBILITY: Legacy static data
 * Kept for reference but no longer used by components
 * All components now use getCountrySectorData() or getGlobalSectorData()
 */

// Legacy country sector data (deprecated - use getCountrySectorData() instead)
export const COUNTRY_SECTOR_DATA: Record<string, SectorExposure[]> = {};

// Legacy global sector averages (deprecated - use getGlobalSectorData() instead)
export const GLOBAL_SECTOR_AVERAGES: SectorExposure[] = [];

/**
 * CALCULATION METHODOLOGY FOOTER NOTES
 * 
 * Global Mode Formula:
 * GlobalSectorExposure = Σ[CountryWeight × CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment]
 * 
 * Where:
 * - CountryWeight = 0.6 × GDPWeight + 0.4 × TradeWeight
 * - CSI = Country Shock Index (geopolitical risk score)
 * - SectorSensitivity = CO-GRI sector multiplier (structural sensitivity)
 * - CountrySectorImportance = 0.5 × GDPShare + 0.3 × ExportShare + 0.2 × StrategicImportance
 * - VectorAdjustment = Σ[CountryVectorWeight × SectorVectorSensitivity]
 * 
 * Country Mode Formula:
 * CountrySectorExposure = CSI × SectorSensitivity × CountrySectorImportance × VectorAdjustment
 * 
 * Percentile-Based Normalization (NEW):
 * DisplayScore = Percentile rank of RawScore across ALL country-sector pairs globally
 * 
 * Benefits:
 * - Scores reflect global context (0 = lowest globally, 100 = highest globally)
 * - Natural distribution (not every country has 0 and 100)
 * - Extreme values only for true outliers
 * - More intuitive interpretation
 * 
 * Data Sources:
 * - GDP & Trade: World Bank, IMF, OECD (2023)
 * - CSI Vectors: 7-vector risk model (SC1-SC7)
 * - Sector Multipliers: CO-GRI methodology
 * - Vector Sensitivity: Sector-specific risk transmission coefficients
 */