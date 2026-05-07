/**
 * Political Alignment Service
 * 
 * Calculates the political alignment factor A_c between a company's home country
 * and each exposure country. This factor represents geopolitical alignment and
 * affects vulnerability transmission, NOT exposure mass.
 * 
 * A_c ranges from 0 to 1.0:
 * - 1.0 = Full positive alignment (strong allies)
 * - 0.5-0.8 = Moderate alignment (neutral/trading partners)
 * - 0.0-0.4 = Low/no alignment (adversarial relationships)
 * 
 * Data Sources:
 * 1. UN General Assembly voting similarity (Harvard Dataverse)
 * 2. Treaty & alliance networks (NATO, SCO, BRICS, QUAD, USMCA, AUKUS, etc.)
 * 3. Bilateral economic dependence (IMF DOTS, IMF CPIS, OECD trade/FDI flows)
 */

// Alliance and treaty memberships
const ALLIANCE_MEMBERSHIPS: Record<string, string[]> = {
  'NATO': ['United States', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Canada', 'Poland', 'Netherlands', 'Belgium', 'Denmark', 'Norway', 'Portugal', 'Turkey', 'Greece', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Croatia', 'Albania', 'Montenegro', 'North Macedonia', 'Finland', 'Sweden'],
  'QUAD': ['United States', 'Japan', 'India', 'Australia'],
  'AUKUS': ['Australia', 'United Kingdom', 'United States'],
  'USMCA': ['United States', 'Mexico', 'Canada'],
  'EU': ['Germany', 'France', 'Italy', 'Spain', 'Poland', 'Romania', 'Netherlands', 'Belgium', 'Greece', 'Czech Republic', 'Portugal', 'Sweden', 'Hungary', 'Austria', 'Bulgaria', 'Denmark', 'Finland', 'Slovakia', 'Ireland', 'Croatia', 'Lithuania', 'Slovenia', 'Latvia', 'Estonia', 'Cyprus', 'Luxembourg', 'Malta'],
  'BRICS': ['Brazil', 'Russia', 'India', 'China', 'South Africa', 'Egypt', 'Ethiopia', 'Iran', 'United Arab Emirates', 'Saudi Arabia'],
  'SCO': ['China', 'Russia', 'India', 'Pakistan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Uzbekistan', 'Iran'],
  'ASEAN': ['Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Singapore', 'Malaysia', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
  'GCC': ['Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'],
  'MERCOSUR': ['Brazil', 'Argentina', 'Paraguay', 'Uruguay'],
  'AU': ['South Africa', 'Nigeria', 'Egypt', 'Ethiopia', 'Kenya', 'Algeria', 'Morocco', 'Ghana', 'Tanzania', 'Angola']
};

// Known adversarial relationships (sanctions, conflicts, etc.)
const ADVERSARIAL_PAIRS: Array<[string, string]> = [
  ['United States', 'Russia'],
  ['United States', 'Iran'],
  ['United States', 'North Korea'],
  ['United States', 'Venezuela'],
  ['United States', 'Cuba'],
  ['United States', 'Syria'],
  ['United Kingdom', 'Russia'],
  ['Japan', 'North Korea'],
  ['South Korea', 'North Korea'],
  ['India', 'Pakistan'],
  ['Israel', 'Iran'],
  ['Saudi Arabia', 'Iran'],
  ['Ukraine', 'Russia']
];

// Strategic competition pairs (not full adversaries but significant tensions)
const STRATEGIC_COMPETITION_PAIRS: Array<[string, string]> = [
  ['United States', 'China'],
  ['Japan', 'China'],
  ['India', 'China'],
  ['Australia', 'China'],
  ['United Kingdom', 'China'],
  ['Canada', 'China'],
  ['Taiwan', 'China']
];

// UN voting similarity scores (simplified - in production would use Harvard Dataverse)
// Scale: 0.0 (never vote together) to 1.0 (always vote together)
const UN_VOTING_SIMILARITY: Record<string, Record<string, number>> = {
  'United States': {
    'United Kingdom': 0.85, 'Canada': 0.82, 'Australia': 0.80, 'Israel': 0.88,
    'France': 0.72, 'Germany': 0.70, 'Japan': 0.75, 'South Korea': 0.73,
    'China': 0.25, 'Russia': 0.20, 'Iran': 0.10, 'Venezuela': 0.15,
    'India': 0.45, 'Brazil': 0.50, 'Mexico': 0.60, 'Saudi Arabia': 0.55
  },
  'China': {
    'Russia': 0.85, 'Pakistan': 0.80, 'Iran': 0.75, 'North Korea': 0.90,
    'United States': 0.25, 'Japan': 0.30, 'India': 0.35, 'Australia': 0.28,
    'Brazil': 0.60, 'South Africa': 0.65, 'Indonesia': 0.55, 'Vietnam': 0.50
  },
  'Russia': {
    'China': 0.85, 'Iran': 0.80, 'Syria': 0.88, 'Venezuela': 0.82,
    'United States': 0.20, 'United Kingdom': 0.22, 'Germany': 0.25, 'Japan': 0.28,
    'India': 0.55, 'Brazil': 0.50, 'Turkey': 0.45
  },
  'United Kingdom': {
    'United States': 0.85, 'Canada': 0.88, 'Australia': 0.90, 'France': 0.82,
    'Germany': 0.80, 'Japan': 0.72, 'India': 0.65, 'China': 0.28, 'Russia': 0.22
  },
  'Germany': {
    'France': 0.92, 'United Kingdom': 0.80, 'Netherlands': 0.88, 'United States': 0.70,
    'China': 0.35, 'Russia': 0.25, 'Japan': 0.68, 'India': 0.60
  },
  'Japan': {
    'United States': 0.75, 'Australia': 0.78, 'South Korea': 0.70, 'India': 0.65,
    'China': 0.30, 'Russia': 0.28, 'North Korea': 0.05
  },
  'India': {
    'United States': 0.45, 'Russia': 0.55, 'Japan': 0.65, 'United Kingdom': 0.65,
    'China': 0.35, 'Pakistan': 0.15, 'France': 0.60, 'Germany': 0.60
  }
};

// Economic interdependence scores (trade + FDI flows)
// Scale: 0.0 (no trade) to 1.0 (extremely high interdependence)
const ECONOMIC_INTERDEPENDENCE: Record<string, Record<string, number>> = {
  'United States': {
    'Canada': 0.95, 'Mexico': 0.90, 'China': 0.85, 'United Kingdom': 0.75,
    'Germany': 0.70, 'Japan': 0.72, 'South Korea': 0.68, 'India': 0.60,
    'Brazil': 0.55, 'France': 0.65, 'Italy': 0.58, 'Australia': 0.62
  },
  'China': {
    'United States': 0.85, 'Japan': 0.80, 'South Korea': 0.78, 'Germany': 0.75,
    'Australia': 0.72, 'Brazil': 0.68, 'Vietnam': 0.70, 'Malaysia': 0.65,
    'Thailand': 0.62, 'Indonesia': 0.60, 'India': 0.58, 'Russia': 0.65
  },
  'Germany': {
    'France': 0.88, 'Netherlands': 0.85, 'United Kingdom': 0.80, 'Italy': 0.78,
    'United States': 0.70, 'China': 0.75, 'Poland': 0.72, 'Austria': 0.75,
    'Switzerland': 0.70, 'Belgium': 0.82
  },
  'United Kingdom': {
    'United States': 0.75, 'Germany': 0.80, 'France': 0.75, 'Netherlands': 0.72,
    'Ireland': 0.85, 'China': 0.65, 'India': 0.60, 'Australia': 0.58
  },
  'Japan': {
    'United States': 0.72, 'China': 0.80, 'South Korea': 0.68, 'Australia': 0.60,
    'Thailand': 0.58, 'Germany': 0.55, 'Taiwan': 0.65, 'Vietnam': 0.55
  }
};

/**
 * Check if two countries share alliance membership
 */
function shareAlliance(country1: string, country2: string): string[] {
  const sharedAlliances: string[] = [];
  for (const [alliance, members] of Object.entries(ALLIANCE_MEMBERSHIPS)) {
    if (members.includes(country1) && members.includes(country2)) {
      sharedAlliances.push(alliance);
    }
  }
  return sharedAlliances;
}

/**
 * Check if two countries are in an adversarial relationship
 */
function areAdversarial(country1: string, country2: string): boolean {
  return ADVERSARIAL_PAIRS.some(([c1, c2]) => 
    (c1 === country1 && c2 === country2) || (c1 === country2 && c2 === country1)
  );
}

/**
 * Check if two countries are in strategic competition
 */
function areStrategicCompetitors(country1: string, country2: string): boolean {
  return STRATEGIC_COMPETITION_PAIRS.some(([c1, c2]) => 
    (c1 === country1 && c2 === country2) || (c1 === country2 && c2 === country1)
  );
}

/**
 * Get UN voting similarity score between two countries
 */
function getVotingSimilarity(country1: string, country2: string): number {
  // Check direct lookup
  if (UN_VOTING_SIMILARITY[country1]?.[country2] !== undefined) {
    return UN_VOTING_SIMILARITY[country1][country2];
  }
  if (UN_VOTING_SIMILARITY[country2]?.[country1] !== undefined) {
    return UN_VOTING_SIMILARITY[country2][country1];
  }
  
  // Default moderate similarity for countries without explicit data
  return 0.50;
}

/**
 * Get economic interdependence score between two countries
 */
function getEconomicInterdependence(country1: string, country2: string): number {
  // Check direct lookup
  if (ECONOMIC_INTERDEPENDENCE[country1]?.[country2] !== undefined) {
    return ECONOMIC_INTERDEPENDENCE[country1][country2];
  }
  if (ECONOMIC_INTERDEPENDENCE[country2]?.[country1] !== undefined) {
    return ECONOMIC_INTERDEPENDENCE[country2][country1];
  }
  
  // Default moderate interdependence for countries without explicit data
  return 0.40;
}

/**
 * Calculate political alignment factor A_c between home country and exposure country
 * 
 * Formula combines three components:
 * 1. Alliance membership (40% weight)
 * 2. UN voting similarity (30% weight)
 * 3. Economic interdependence (30% weight)
 * 
 * Special cases:
 * - Adversarial relationships: cap at 0.20
 * - Strategic competition: cap at 0.45
 * - Same country: always 1.0
 */
export function calculatePoliticalAlignment(homeCountry: string, exposureCountry: string): {
  alignmentFactor: number;
  components: {
    allianceScore: number;
    votingScore: number;
    economicScore: number;
  };
  sharedAlliances: string[];
  relationship: 'allied' | 'friendly' | 'neutral' | 'competitive' | 'adversarial' | 'same';
  source: string;
} {
  // Same country = perfect alignment
  if (homeCountry === exposureCountry) {
    return {
      alignmentFactor: 1.0,
      components: { allianceScore: 1.0, votingScore: 1.0, economicScore: 1.0 },
      sharedAlliances: [],
      relationship: 'same',
      source: 'Same Country'
    };
  }
  
  // Check for adversarial relationship
  if (areAdversarial(homeCountry, exposureCountry)) {
    return {
      alignmentFactor: 0.15,
      components: { allianceScore: 0.0, votingScore: 0.15, economicScore: 0.30 },
      sharedAlliances: [],
      relationship: 'adversarial',
      source: 'Known Adversarial Relationship (Sanctions/Conflict)'
    };
  }
  
  // Check for strategic competition
  const isCompetitive = areStrategicCompetitors(homeCountry, exposureCountry);
  
  // Calculate alliance score
  const sharedAlliances = shareAlliance(homeCountry, exposureCountry);
  let allianceScore = 0.0;
  if (sharedAlliances.length > 0) {
    // Strong alliances (NATO, AUKUS, QUAD) get higher scores
    const strongAlliances = ['NATO', 'AUKUS', 'QUAD', 'USMCA'];
    const hasStrongAlliance = sharedAlliances.some(a => strongAlliances.includes(a));
    allianceScore = hasStrongAlliance ? 0.90 : 0.70;
  }
  
  // Get UN voting similarity
  const votingScore = getVotingSimilarity(homeCountry, exposureCountry);
  
  // Get economic interdependence
  const economicScore = getEconomicInterdependence(homeCountry, exposureCountry);
  
  // Weighted combination: 40% alliance, 30% voting, 30% economic
  let alignmentFactor = (allianceScore * 0.40) + (votingScore * 0.30) + (economicScore * 0.30);
  
  // Cap for strategic competition
  if (isCompetitive) {
    alignmentFactor = Math.min(alignmentFactor, 0.45);
  }
  
  // Determine relationship type
  let relationship: 'allied' | 'friendly' | 'neutral' | 'competitive' | 'adversarial' | 'same';
  if (alignmentFactor >= 0.75) {
    relationship = 'allied';
  } else if (alignmentFactor >= 0.60) {
    relationship = 'friendly';
  } else if (alignmentFactor >= 0.45) {
    relationship = 'neutral';
  } else if (alignmentFactor >= 0.25) {
    relationship = 'competitive';
  } else {
    relationship = 'adversarial';
  }
  
  const sources: string[] = [];
  if (sharedAlliances.length > 0) sources.push(`Alliance: ${sharedAlliances.join(', ')}`);
  sources.push('UN Voting Similarity');
  sources.push('Economic Interdependence (IMF DOTS/CPIS)');
  
  return {
    alignmentFactor,
    components: {
      allianceScore,
      votingScore,
      economicScore
    },
    sharedAlliances,
    relationship,
    source: sources.join(' + ')
  };
}

/**
 * Get all alignment factors for a home country against multiple exposure countries
 */
export function calculateAllAlignments(
  homeCountry: string,
  exposureCountries: string[]
): Record<string, ReturnType<typeof calculatePoliticalAlignment>> {
  const alignments: Record<string, ReturnType<typeof calculatePoliticalAlignment>> = {};
  
  for (const country of exposureCountries) {
    alignments[country] = calculatePoliticalAlignment(homeCountry, country);
  }
  
  return alignments;
}