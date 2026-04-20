/**
 * Revenue Segment Fallback Logic
 * 
 * Provides fallback calculations and region definitions for geographic segments
 * when primary data sources are incomplete or missing.
 */

export interface SegmentFallback {
  geography: string;
  percentage: number;
  confidence: number;
  method: 'industry_average' | 'size_based' | 'sector_proxy' | 'regional_proxy';
  source: string;
}

export interface RegionDefinition {
  name: string;
  countries: string[];
  aliases: string[];
  isRegion: boolean;
}

// Industry average geographic distributions by sector
const INDUSTRY_AVERAGES: Record<string, Record<string, number>> = {
  'Technology': {
    'United States': 45.0,
    'China': 18.0,
    'Europe': 16.0,
    'Japan': 8.0,
    'Other Asia Pacific': 10.0,
    'Other': 3.0
  },
  'Healthcare': {
    'United States': 52.0,
    'Europe': 20.0,
    'China': 12.0,
    'Japan': 7.0,
    'Other Asia Pacific': 6.0,
    'Other': 3.0
  },
  'Financial Services': {
    'United States': 60.0,
    'Europe': 15.0,
    'Asia Pacific': 12.0,
    'Latin America': 8.0,
    'Other': 5.0
  },
  'Consumer Staples': {
    'United States': 38.0,
    'China': 20.0,
    'Europe': 18.0,
    'Latin America': 10.0,
    'Other Asia Pacific': 10.0,
    'Other': 4.0
  },
  'Consumer Discretionary': {
    'United States': 42.0,
    'China': 16.0,
    'Europe': 17.0,
    'Latin America': 11.0,
    'Other Asia Pacific': 11.0,
    'Other': 3.0
  },
  'Industrials': {
    'United States': 48.0,
    'International': 28.0,
    'Europe': 16.0,
    'Other': 8.0
  },
  'Energy': {
    'United States': 47.0,
    'International': 28.0,
    'Europe': 16.0,
    'Other': 9.0
  },
  'Communication Services': {
    'United States': 49.0,
    'International': 26.0,
    'Europe': 17.0,
    'Other': 8.0
  }
};

// Company size-based adjustments
const SIZE_ADJUSTMENTS: Record<string, Record<string, number>> = {
  'large_cap': {
    'United States': -5.0, // Large caps tend to be more international
    'International': +3.0,
    'Europe': +1.5,
    'Asia Pacific': +0.5
  },
  'mid_cap': {
    'United States': 0.0, // Base case
    'International': 0.0,
    'Europe': 0.0,
    'Asia Pacific': 0.0
  },
  'small_cap': {
    'United States': +8.0, // Small caps tend to be more domestic
    'International': -5.0,
    'Europe': -2.0,
    'Asia Pacific': -1.0
  }
};

// Regional definitions
const REGION_DEFINITIONS: RegionDefinition[] = [
  {
    name: 'Europe',
    countries: ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark'],
    aliases: ['European Union', 'EU', 'EMEA Europe'],
    isRegion: true
  },
  {
    name: 'Asia Pacific',
    countries: ['Japan', 'South Korea', 'Australia', 'Singapore', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia', 'Indonesia'],
    aliases: ['APAC', 'Asia-Pacific', 'Other Asia Pacific'],
    isRegion: true
  },
  {
    name: 'Latin America',
    countries: ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'],
    aliases: ['LATAM', 'South America', 'Central America'],
    isRegion: true
  },
  {
    name: 'Middle East and Africa',
    countries: ['Saudi Arabia', 'UAE', 'South Africa', 'Egypt', 'Nigeria', 'Israel'],
    aliases: ['MEA', 'EMEA MEA', 'Africa and Middle East'],
    isRegion: true
  },
  {
    name: 'International',
    countries: [],
    aliases: ['Non-US', 'Rest of World', 'Other International'],
    isRegion: true
  }
];

/**
 * Calculate fallback geographic segments for a company
 */
export function calculateSegmentFallback(
  ticker: string,
  sector: string,
  marketCap?: number,
  existingSegments?: any[]
): SegmentFallback[] {
  console.log(`🔄 Calculating fallback segments for ${ticker} (${sector})`);
  
  // Determine company size category
  const sizeCategory = determineSizeCategory(marketCap);
  
  // Get base industry averages
  const baseDistribution = INDUSTRY_AVERAGES[sector] || INDUSTRY_AVERAGES['Technology'];
  
  // Apply size adjustments
  const adjustedDistribution = applySizeAdjustments(baseDistribution, sizeCategory);
  
  // Convert to fallback segments
  const fallbackSegments: SegmentFallback[] = Object.entries(adjustedDistribution).map(([geography, percentage]) => ({
    geography,
    percentage,
    confidence: 0.60, // Lower confidence for fallback data
    method: 'industry_average',
    source: `Industry average for ${sector} sector with ${sizeCategory} adjustments`
  }));
  
  console.log(`✅ Generated ${fallbackSegments.length} fallback segments for ${ticker}`);
  return fallbackSegments;
}

/**
 * Get region definition for a geographic name
 */
export function getSegmentRegionDefinition(geographyName: string): RegionDefinition | null {
  const lowerName = geographyName.toLowerCase();
  
  return REGION_DEFINITIONS.find(region => 
    region.name.toLowerCase() === lowerName ||
    region.aliases.some(alias => alias.toLowerCase() === lowerName) ||
    region.countries.some(country => country.toLowerCase() === lowerName)
  ) || null;
}

/**
 * Check if a geographic name represents a region (vs individual country)
 */
export function isSegmentRegion(geographyName: string): boolean {
  const definition = getSegmentRegionDefinition(geographyName);
  return definition?.isRegion || false;
}

/**
 * Normalize geographic segment names to standard format
 */
export function normalizeSegmentGeography(geography: string): string {
  const normalized = geography.trim();
  
  // Common normalization mappings
  const mappings: Record<string, string> = {
    'US': 'United States',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'EU': 'Europe',
    'APAC': 'Asia Pacific',
    'LATAM': 'Latin America',
    'MEA': 'Middle East and Africa',
    'ROW': 'Other',
    'Rest of World': 'Other'
  };
  
  return mappings[normalized] || normalized;
}

/**
 * Validate segment percentages sum to reasonable total
 */
export function validateSegmentPercentages(segments: { percentage: number }[]): {
  isValid: boolean;
  total: number;
  issues: string[];
} {
  const total = segments.reduce((sum, seg) => sum + seg.percentage, 0);
  const issues: string[] = [];
  
  if (total < 85) {
    issues.push(`Total percentage (${total.toFixed(1)}%) is unusually low - may be missing segments`);
  }
  
  if (total > 115) {
    issues.push(`Total percentage (${total.toFixed(1)}%) exceeds 100% - may have overlapping segments`);
  }
  
  const hasNegative = segments.some(seg => seg.percentage < 0);
  if (hasNegative) {
    issues.push('Contains negative percentages');
  }
  
  const hasZero = segments.some(seg => seg.percentage === 0);
  if (hasZero) {
    issues.push('Contains zero percentages');
  }
  
  return {
    isValid: issues.length === 0 && total >= 85 && total <= 115,
    total,
    issues
  };
}

/**
 * Merge overlapping geographic segments
 */
export function mergeOverlappingSegments(segments: any[]): any[] {
  const merged = new Map<string, any>();
  
  for (const segment of segments) {
    const normalizedGeo = normalizeSegmentGeography(segment.geography);
    
    if (merged.has(normalizedGeo)) {
      // Merge with existing segment
      const existing = merged.get(normalizedGeo)!;
      existing.percentage += segment.percentage;
      existing.confidence = Math.max(existing.confidence, segment.confidence);
      
      // Combine sources
      if (!existing.source.includes(segment.source)) {
        existing.source += `, ${segment.source}`;
      }
    } else {
      // Add new segment
      merged.set(normalizedGeo, {
        ...segment,
        geography: normalizedGeo
      });
    }
  }
  
  return Array.from(merged.values());
}

/**
 * Generate sector-based proxy segments
 */
export function generateSectorProxy(sector: string, ticker: string): SegmentFallback[] {
  console.log(`📊 Generating sector proxy for ${ticker} based on ${sector} sector averages`);
  
  const sectorAverages = INDUSTRY_AVERAGES[sector] || INDUSTRY_AVERAGES['Technology'];
  
  return Object.entries(sectorAverages).map(([geography, percentage]) => ({
    geography: normalizeSegmentGeography(geography),
    percentage,
    confidence: 0.55, // Lower confidence for sector proxy
    method: 'sector_proxy' as const,
    source: `${sector} sector average`
  }));
}

/**
 * Helper functions
 */
function determineSizeCategory(marketCap?: number): string {
  if (!marketCap) return 'mid_cap';
  
  if (marketCap > 10000000000) return 'large_cap'; // > $10B
  if (marketCap > 2000000000) return 'mid_cap';    // $2B - $10B
  return 'small_cap';                              // < $2B
}

function applySizeAdjustments(
  baseDistribution: Record<string, number>,
  sizeCategory: string
): Record<string, number> {
  const adjustments = SIZE_ADJUSTMENTS[sizeCategory] || SIZE_ADJUSTMENTS['mid_cap'];
  const adjusted: Record<string, number> = {};
  
  for (const [geography, basePercentage] of Object.entries(baseDistribution)) {
    const adjustment = adjustments[geography] || 0;
    adjusted[geography] = Math.max(0, basePercentage + adjustment);
  }
  
  // Normalize to ensure total is 100%
  const total = Object.values(adjusted).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const geography of Object.keys(adjusted)) {
      adjusted[geography] = (adjusted[geography] / total) * 100;
    }
  }
  
  return adjusted;
}

/**
 * Get all available sector options
 */
export function getAvailableSectors(): string[] {
  return Object.keys(INDUSTRY_AVERAGES);
}

/**
 * Get all region definitions
 */
export function getAllRegionDefinitions(): RegionDefinition[] {
  return [...REGION_DEFINITIONS];
}

/**
 * Calculate confidence score for fallback segments
 */
export function calculateFallbackConfidence(
  method: SegmentFallback['method'],
  dataQuality: string,
  hasPartialData: boolean
): number {
  let baseConfidence = 0.60;
  
  // Adjust based on method
  switch (method) {
    case 'industry_average':
      baseConfidence = 0.65;
      break;
    case 'size_based':
      baseConfidence = 0.60;
      break;
    case 'sector_proxy':
      baseConfidence = 0.55;
      break;
    case 'regional_proxy':
      baseConfidence = 0.50;
      break;
  }
  
  // Adjust based on data quality
  if (dataQuality === 'High') baseConfidence += 0.10;
  else if (dataQuality === 'Medium') baseConfidence += 0.05;
  else if (dataQuality === 'Low') baseConfidence -= 0.05;
  
  // Adjust if we have some partial data
  if (hasPartialData) baseConfidence += 0.05;
  
  return Math.min(0.85, Math.max(0.30, baseConfidence));
}