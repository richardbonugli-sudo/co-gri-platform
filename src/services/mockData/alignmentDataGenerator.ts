import { AlignmentData } from '@/types/global';

/**
 * Mock Data Generator for Alignment Data
 * Generates realistic alignment data between countries
 */

interface AlignmentProfile {
  UNAlign: number;
  TreatyAlign: number;
  EconDepend: number;
}

// Alignment profiles for US relationships with key countries
const US_ALIGNMENTS: Record<string, AlignmentProfile> = {
  'China': { UNAlign: 0.2, TreatyAlign: 0.1, EconDepend: 0.6 },
  'Taiwan': { UNAlign: 0.8, TreatyAlign: 0.7, EconDepend: 0.5 },
  'Vietnam': { UNAlign: 0.6, TreatyAlign: 0.5, EconDepend: 0.4 },
  'Japan': { UNAlign: 0.9, TreatyAlign: 0.9, EconDepend: 0.7 },
  'S. Korea': { UNAlign: 0.85, TreatyAlign: 0.85, EconDepend: 0.6 },
  'Germany': { UNAlign: 0.85, TreatyAlign: 0.9, EconDepend: 0.5 },
  'Mexico': { UNAlign: 0.7, TreatyAlign: 0.8, EconDepend: 0.8 },
  'India': { UNAlign: 0.7, TreatyAlign: 0.6, EconDepend: 0.4 },
  'Russia': { UNAlign: 0.1, TreatyAlign: 0.0, EconDepend: 0.2 },
  'Ukraine': { UNAlign: 0.9, TreatyAlign: 0.7, EconDepend: 0.3 },
};

export function generateAlignmentData(
  homeCountry: string,
  exposureCountry: string
): AlignmentData {
  // For now, we only have US alignment data
  if (homeCountry !== 'US') {
    // Generate generic alignment data for other home countries
    return {
      home_country: homeCountry,
      exposure_country: exposureCountry,
      UNAlign: 0.5,
      TreatyAlign: 0.5,
      EconDepend: 0.5,
    };
  }

  const profile = US_ALIGNMENTS[exposureCountry] || {
    UNAlign: 0.5,
    TreatyAlign: 0.5,
    EconDepend: 0.5,
  };

  return {
    home_country: homeCountry,
    exposure_country: exposureCountry,
    ...profile,
  };
}

export function generateAllUSAlignments(): Map<string, AlignmentData> {
  const alignments = new Map<string, AlignmentData>();
  
  for (const [country, profile] of Object.entries(US_ALIGNMENTS)) {
    const key = `US-${country}`;
    alignments.set(key, {
      home_country: 'US',
      exposure_country: country,
      ...profile,
    });
  }
  
  return alignments;
}

export function generateAlignmentsForCompany(
  homeCountry: string,
  exposureCountries: string[]
): Map<string, AlignmentData> {
  const alignments = new Map<string, AlignmentData>();
  
  for (const country of exposureCountries) {
    const key = `${homeCountry}-${country}`;
    alignments.set(key, generateAlignmentData(homeCountry, country));
  }
  
  return alignments;
}