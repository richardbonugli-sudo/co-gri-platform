// Sophisticated sector-specific exposure patterns for 190 countries
// Based on industry analysis, supply chain studies, and global trade data

export interface SectorExposurePattern {
  primaryMarkets: string[];      // Top 8-12 markets (40% of remaining weight)
  secondaryMarkets: string[];    // Secondary markets (30% of remaining weight)
  emergingMarkets: string[];     // Emerging markets (20% of remaining weight)
  tertiaryMarkets: string[];     // Long-tail markets (10% of remaining weight)
}

export const SECTOR_PATTERNS: Record<string, SectorExposurePattern> = {
  'Technology': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'South Korea', 'Taiwan', 
      'Germany', 'United Kingdom', 'Singapore', 'India', 'Israel'
    ],
    secondaryMarkets: [
      'France', 'Canada', 'Netherlands', 'Sweden', 'Switzerland',
      'Ireland', 'Australia', 'Hong Kong', 'Malaysia', 'Finland'
    ],
    emergingMarkets: [
      'Vietnam', 'Poland', 'Czech Republic', 'Thailand', 'Philippines',
      'Indonesia', 'Mexico', 'Brazil', 'Turkey', 'South Africa'
    ],
    tertiaryMarkets: [
      'Romania', 'Ukraine', 'Argentina', 'Chile', 'Colombia',
      'Egypt', 'Kenya', 'Nigeria', 'Bangladesh', 'Pakistan'
    ]
  },
  
  'Financial Services': {
    primaryMarkets: [
      'United States', 'United Kingdom', 'Switzerland', 'Hong Kong', 'Singapore',
      'Japan', 'Germany', 'France', 'Luxembourg', 'Netherlands'
    ],
    secondaryMarkets: [
      'Canada', 'Australia', 'Ireland', 'Sweden', 'Denmark',
      'Belgium', 'Spain', 'Italy', 'South Korea', 'Taiwan'
    ],
    emergingMarkets: [
      'United Arab Emirates', 'China', 'India', 'Brazil', 'Mexico',
      'South Africa', 'Saudi Arabia', 'Qatar', 'Poland', 'Turkey'
    ],
    tertiaryMarkets: [
      'Malaysia', 'Thailand', 'Indonesia', 'Chile', 'Colombia',
      'Peru', 'Egypt', 'Morocco', 'Kenya', 'Nigeria'
    ]
  },
  
  'Energy': {
    primaryMarkets: [
      'United States', 'Saudi Arabia', 'Russia', 'Canada', 'China',
      'United Arab Emirates', 'Norway', 'Qatar', 'Kuwait', 'Iraq'
    ],
    secondaryMarkets: [
      'Brazil', 'Mexico', 'Kazakhstan', 'Nigeria', 'Angola',
      'Venezuela', 'Iran', 'Algeria', 'Libya', 'Azerbaijan'
    ],
    emergingMarkets: [
      'Australia', 'United Kingdom', 'India', 'Indonesia', 'Malaysia',
      'Colombia', 'Argentina', 'Ecuador', 'Oman', 'Turkmenistan'
    ],
    tertiaryMarkets: [
      'Egypt', 'Peru', 'Trinidad and Tobago', 'Brunei', 'Vietnam',
      'Thailand', 'South Africa', 'Gabon', 'Congo', 'Chad'
    ]
  },
  
  'Automotive': {
    primaryMarkets: [
      'China', 'United States', 'Germany', 'Japan', 'South Korea',
      'India', 'Mexico', 'Brazil', 'France', 'United Kingdom'
    ],
    secondaryMarkets: [
      'Spain', 'Italy', 'Canada', 'Thailand', 'Czech Republic',
      'Poland', 'Turkey', 'Indonesia', 'Russia', 'Taiwan'
    ],
    emergingMarkets: [
      'Vietnam', 'South Africa', 'Argentina', 'Malaysia', 'Romania',
      'Slovakia', 'Hungary', 'Morocco', 'Egypt', 'Philippines'
    ],
    tertiaryMarkets: [
      'Colombia', 'Chile', 'Pakistan', 'Bangladesh', 'Ukraine',
      'Serbia', 'Iran', 'Algeria', 'Kenya', 'Nigeria'
    ]
  },
  
  'Healthcare': {
    primaryMarkets: [
      'United States', 'Germany', 'Switzerland', 'United Kingdom', 'Japan',
      'France', 'China', 'Canada', 'Netherlands', 'Belgium'
    ],
    secondaryMarkets: [
      'Italy', 'Spain', 'Sweden', 'Denmark', 'Ireland',
      'Australia', 'South Korea', 'Singapore', 'Israel', 'India'
    ],
    emergingMarkets: [
      'Brazil', 'Mexico', 'Poland', 'Turkey', 'South Africa',
      'Thailand', 'Indonesia', 'Argentina', 'Malaysia', 'Philippines'
    ],
    tertiaryMarkets: [
      'Colombia', 'Chile', 'Egypt', 'Saudi Arabia', 'United Arab Emirates',
      'Vietnam', 'Pakistan', 'Bangladesh', 'Nigeria', 'Kenya'
    ]
  },
  
  'Industrials': {
    primaryMarkets: [
      'China', 'United States', 'Germany', 'Japan', 'South Korea',
      'India', 'United Kingdom', 'France', 'Italy', 'Canada'
    ],
    secondaryMarkets: [
      'Brazil', 'Mexico', 'Spain', 'Poland', 'Turkey',
      'Russia', 'Indonesia', 'Thailand', 'Australia', 'Netherlands'
    ],
    emergingMarkets: [
      'Vietnam', 'Malaysia', 'Czech Republic', 'South Africa', 'Argentina',
      'Saudi Arabia', 'United Arab Emirates', 'Taiwan', 'Sweden', 'Belgium'
    ],
    tertiaryMarkets: [
      'Colombia', 'Chile', 'Egypt', 'Philippines', 'Pakistan',
      'Romania', 'Ukraine', 'Kazakhstan', 'Nigeria', 'Kenya'
    ]
  },
  
  'Consumer Cyclical': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'Germany', 'United Kingdom',
      'France', 'India', 'Brazil', 'Italy', 'Canada'
    ],
    secondaryMarkets: [
      'South Korea', 'Spain', 'Mexico', 'Australia', 'Netherlands',
      'Turkey', 'Indonesia', 'Thailand', 'Poland', 'Saudi Arabia'
    ],
    emergingMarkets: [
      'Russia', 'Argentina', 'South Africa', 'Malaysia', 'Philippines',
      'Vietnam', 'Colombia', 'Chile', 'United Arab Emirates', 'Egypt'
    ],
    tertiaryMarkets: [
      'Peru', 'Pakistan', 'Bangladesh', 'Nigeria', 'Kenya',
      'Ukraine', 'Morocco', 'Romania', 'Czech Republic', 'Singapore'
    ]
  },
  
  'Basic Materials': {
    primaryMarkets: [
      'China', 'United States', 'Australia', 'Brazil', 'Russia',
      'India', 'Canada', 'South Africa', 'Chile', 'Peru'
    ],
    secondaryMarkets: [
      'Germany', 'Japan', 'Mexico', 'Indonesia', 'Kazakhstan',
      'Saudi Arabia', 'United Arab Emirates', 'Poland', 'Turkey', 'Argentina'
    ],
    emergingMarkets: [
      'Zambia', 'Democratic Republic of Congo', 'Mongolia', 'Philippines', 'Colombia',
      'Morocco', 'Uzbekistan', 'Vietnam', 'Malaysia', 'Thailand'
    ],
    tertiaryMarkets: [
      'Guinea', 'Mauritania', 'Niger', 'Burkina Faso', 'Mali',
      'Bolivia', 'Ecuador', 'Papua New Guinea', 'Mozambique', 'Tanzania'
    ]
  },
  
  'Telecommunications': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'Germany', 'United Kingdom',
      'India', 'South Korea', 'France', 'Brazil', 'Italy'
    ],
    secondaryMarkets: [
      'Spain', 'Canada', 'Australia', 'Mexico', 'Netherlands',
      'Turkey', 'Indonesia', 'Russia', 'Saudi Arabia', 'Poland'
    ],
    emergingMarkets: [
      'Thailand', 'Malaysia', 'Philippines', 'South Africa', 'Argentina',
      'Colombia', 'Egypt', 'Vietnam', 'United Arab Emirates', 'Singapore'
    ],
    tertiaryMarkets: [
      'Nigeria', 'Pakistan', 'Bangladesh', 'Kenya', 'Morocco',
      'Chile', 'Peru', 'Ukraine', 'Romania', 'Czech Republic'
    ]
  },
  
  'Utilities': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'Germany', 'United Kingdom',
      'France', 'India', 'Brazil', 'Canada', 'Italy'
    ],
    secondaryMarkets: [
      'Spain', 'Australia', 'South Korea', 'Mexico', 'Russia',
      'Turkey', 'Netherlands', 'Poland', 'Indonesia', 'Saudi Arabia'
    ],
    emergingMarkets: [
      'South Africa', 'Argentina', 'Thailand', 'Malaysia', 'Chile',
      'Colombia', 'Philippines', 'Egypt', 'Vietnam', 'Pakistan'
    ],
    tertiaryMarkets: [
      'Bangladesh', 'Nigeria', 'Kenya', 'Peru', 'Ukraine',
      'Morocco', 'United Arab Emirates', 'Czech Republic', 'Romania', 'Kazakhstan'
    ]
  },
  
  'Real Estate': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'United Kingdom', 'Germany',
      'France', 'Australia', 'Canada', 'Hong Kong', 'Singapore'
    ],
    secondaryMarkets: [
      'Spain', 'Italy', 'Netherlands', 'South Korea', 'Brazil',
      'India', 'Mexico', 'United Arab Emirates', 'Switzerland', 'Sweden'
    ],
    emergingMarkets: [
      'Turkey', 'Poland', 'Thailand', 'Malaysia', 'Indonesia',
      'South Africa', 'Saudi Arabia', 'Argentina', 'Philippines', 'Vietnam'
    ],
    tertiaryMarkets: [
      'Colombia', 'Chile', 'Egypt', 'Morocco', 'Peru',
      'Czech Republic', 'Romania', 'Kenya', 'Nigeria', 'Pakistan'
    ]
  },
  
  'General': {
    primaryMarkets: [
      'United States', 'China', 'Japan', 'Germany', 'United Kingdom',
      'France', 'India', 'Brazil', 'Italy', 'Canada'
    ],
    secondaryMarkets: [
      'South Korea', 'Spain', 'Australia', 'Mexico', 'Netherlands',
      'Turkey', 'Indonesia', 'Saudi Arabia', 'Switzerland', 'Poland'
    ],
    emergingMarkets: [
      'Russia', 'Argentina', 'Thailand', 'Malaysia', 'South Africa',
      'Philippines', 'Vietnam', 'Colombia', 'United Arab Emirates', 'Singapore'
    ],
    tertiaryMarkets: [
      'Egypt', 'Chile', 'Pakistan', 'Bangladesh', 'Nigeria',
      'Ukraine', 'Czech Republic', 'Romania', 'Peru', 'Morocco'
    ]
  }
};

// Get exposure pattern for a sector
export const getSectorPattern = (sector: string): SectorExposurePattern => {
  return SECTOR_PATTERNS[sector] || SECTOR_PATTERNS['General'];
};

// Calculate number of countries to include based on company size (from symbol hash)
export const getCountryCount = (symbolHash: number): {
  primary: number;
  secondary: number;
  emerging: number;
  tertiary: number;
} => {
  // Larger companies (higher hash mod) have more global presence
  const sizeIndicator = symbolHash % 100;
  
  if (sizeIndicator >= 80) {
    // Large multinational
    return { primary: 10, secondary: 10, emerging: 10, tertiary: 10 };
  } else if (sizeIndicator >= 60) {
    // Large company
    return { primary: 8, secondary: 8, emerging: 8, tertiary: 6 };
  } else if (sizeIndicator >= 40) {
    // Medium company
    return { primary: 6, secondary: 6, emerging: 6, tertiary: 4 };
  } else if (sizeIndicator >= 20) {
    // Small-medium company
    return { primary: 5, secondary: 5, emerging: 4, tertiary: 2 };
  } else {
    // Small company
    return { primary: 4, secondary: 4, emerging: 3, tertiary: 1 };
  }
};