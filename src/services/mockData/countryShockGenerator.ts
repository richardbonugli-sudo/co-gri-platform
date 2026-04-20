import { CountryShock, CountryVectors } from '@/types/country';

/**
 * Mock Data Generator for Country Shocks
 * Generates realistic country shock data for testing
 */

const COUNTRIES = [
  'China',
  'Taiwan',
  'Vietnam',
  'Japan',
  'S. Korea',
  'Germany',
  'Mexico',
  'India',
  'Russia',
  'Ukraine',
];

function generateVectors(baseShock: number): CountryVectors {
  // Generate vectors that average to approximately the base shock
  const variance = 15;
  
  return {
    political: Math.max(0, Math.min(100, baseShock + (Math.random() - 0.5) * variance)),
    economic: Math.max(0, Math.min(100, baseShock + (Math.random() - 0.5) * variance)),
    social: Math.max(0, Math.min(100, baseShock + (Math.random() - 0.5) * variance)),
    military: Math.max(0, Math.min(100, baseShock + (Math.random() - 0.5) * variance)),
    environmental: Math.max(0, Math.min(100, baseShock + (Math.random() - 0.5) * variance)),
  };
}

export function generateCountryShock(country: string, S_c?: number): CountryShock {
  // Use provided S_c or generate based on country risk profile
  const shockValue = S_c ?? getDefaultShock(country);
  
  return {
    country,
    timestamp: new Date(),
    S_c: shockValue,
    vectors: generateVectors(shockValue),
    drivers: [],
  };
}

function getDefaultShock(country: string): number {
  // Default shock values based on typical geopolitical risk profiles
  const shockProfiles: Record<string, number> = {
    'China': 72,
    'Taiwan': 68,
    'Russia': 85,
    'Ukraine': 90,
    'Vietnam': 45,
    'Japan': 32,
    'S. Korea': 38,
    'Germany': 28,
    'Mexico': 42,
    'India': 48,
  };

  return shockProfiles[country] ?? 50;
}

export function generateAllCountryShocks(): Map<string, CountryShock> {
  const shocks = new Map<string, CountryShock>();
  
  for (const country of COUNTRIES) {
    shocks.set(country, generateCountryShock(country));
  }
  
  return shocks;
}

export function generateTimeSeriesShocks(
  country: string,
  days: number = 90
): CountryShock[] {
  const shocks: CountryShock[] = [];
  const baseShock = getDefaultShock(country);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some random walk to the shock value
    const variance = 5;
    const shock = Math.max(0, Math.min(100, 
      baseShock + (Math.random() - 0.5) * variance * Math.sqrt(days - i)
    ));
    
    shocks.push({
      country,
      timestamp: date,
      S_c: shock,
      vectors: generateVectors(shock),
      drivers: [],
    });
  }
  
  return shocks;
}