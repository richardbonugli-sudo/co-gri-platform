/**
 * Trade Relationships - Bilateral trade intensity data
 * 
 * Defines trade relationships with intensity scores (0-100) for propagation analysis.
 * Higher intensity = stronger trade linkage = higher propagation potential.
 */

export interface TradeRelationship {
  from: string;
  to: string;
  intensity: number; // 0-100 scale
  sectors?: string[]; // Affected sectors
}

/**
 * Global trade relationships matrix
 * Intensity scoring:
 * - 90-100: Critical trade partner (e.g., US-China, US-Mexico)
 * - 70-89: Major trade partner
 * - 50-69: Significant trade partner
 * - 30-49: Moderate trade partner
 * - 10-29: Minor trade partner
 */
export const TRADE_RELATIONSHIPS: TradeRelationship[] = [
  // United States relationships
  { from: 'United States', to: 'China', intensity: 95, sectors: ['Technology', 'Manufacturing', 'Consumer Goods'] },
  { from: 'United States', to: 'Mexico', intensity: 92, sectors: ['Automotive', 'Manufacturing', 'Agriculture'] },
  { from: 'United States', to: 'Canada', intensity: 90, sectors: ['Energy', 'Automotive', 'Agriculture'] },
  { from: 'United States', to: 'Japan', intensity: 75, sectors: ['Technology', 'Automotive', 'Finance'] },
  { from: 'United States', to: 'Germany', intensity: 70, sectors: ['Automotive', 'Pharmaceuticals', 'Technology'] },
  { from: 'United States', to: 'South Korea', intensity: 68, sectors: ['Technology', 'Automotive', 'Semiconductors'] },
  { from: 'United States', to: 'United Kingdom', intensity: 65, sectors: ['Finance', 'Pharmaceuticals', 'Technology'] },
  { from: 'United States', to: 'India', intensity: 60, sectors: ['Technology', 'Pharmaceuticals', 'Services'] },
  { from: 'United States', to: 'Taiwan', intensity: 58, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  { from: 'United States', to: 'Vietnam', intensity: 55, sectors: ['Manufacturing', 'Textiles', 'Electronics'] },
  
  // China relationships
  { from: 'China', to: 'United States', intensity: 95, sectors: ['Technology', 'Manufacturing', 'Consumer Goods'] },
  { from: 'China', to: 'Japan', intensity: 85, sectors: ['Manufacturing', 'Technology', 'Automotive'] },
  { from: 'China', to: 'South Korea', intensity: 82, sectors: ['Technology', 'Semiconductors', 'Manufacturing'] },
  { from: 'China', to: 'Germany', intensity: 75, sectors: ['Automotive', 'Manufacturing', 'Technology'] },
  { from: 'China', to: 'Vietnam', intensity: 72, sectors: ['Manufacturing', 'Textiles', 'Electronics'] },
  { from: 'China', to: 'Taiwan', intensity: 70, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  { from: 'China', to: 'Australia', intensity: 68, sectors: ['Mining', 'Agriculture', 'Energy'] },
  { from: 'China', to: 'Brazil', intensity: 65, sectors: ['Agriculture', 'Mining', 'Energy'] },
  { from: 'China', to: 'India', intensity: 62, sectors: ['Manufacturing', 'Pharmaceuticals', 'Technology'] },
  { from: 'China', to: 'Singapore', intensity: 60, sectors: ['Finance', 'Technology', 'Trade'] },
  
  // European Union relationships
  { from: 'Germany', to: 'United States', intensity: 70, sectors: ['Automotive', 'Pharmaceuticals', 'Technology'] },
  { from: 'Germany', to: 'China', intensity: 75, sectors: ['Automotive', 'Manufacturing', 'Technology'] },
  { from: 'Germany', to: 'France', intensity: 85, sectors: ['Manufacturing', 'Automotive', 'Energy'] },
  { from: 'Germany', to: 'United Kingdom', intensity: 72, sectors: ['Automotive', 'Finance', 'Manufacturing'] },
  { from: 'Germany', to: 'Poland', intensity: 68, sectors: ['Manufacturing', 'Automotive', 'Agriculture'] },
  
  { from: 'France', to: 'Germany', intensity: 85, sectors: ['Manufacturing', 'Automotive', 'Energy'] },
  { from: 'France', to: 'United Kingdom', intensity: 70, sectors: ['Finance', 'Energy', 'Manufacturing'] },
  { from: 'France', to: 'Spain', intensity: 75, sectors: ['Tourism', 'Manufacturing', 'Agriculture'] },
  { from: 'France', to: 'Italy', intensity: 72, sectors: ['Manufacturing', 'Fashion', 'Tourism'] },
  
  { from: 'United Kingdom', to: 'United States', intensity: 65, sectors: ['Finance', 'Pharmaceuticals', 'Technology'] },
  { from: 'United Kingdom', to: 'Germany', intensity: 72, sectors: ['Automotive', 'Finance', 'Manufacturing'] },
  { from: 'United Kingdom', to: 'France', intensity: 70, sectors: ['Finance', 'Energy', 'Manufacturing'] },
  { from: 'United Kingdom', to: 'Netherlands', intensity: 68, sectors: ['Finance', 'Trade', 'Energy'] },
  
  // Asia-Pacific relationships
  { from: 'Japan', to: 'United States', intensity: 75, sectors: ['Technology', 'Automotive', 'Finance'] },
  { from: 'Japan', to: 'China', intensity: 85, sectors: ['Manufacturing', 'Technology', 'Automotive'] },
  { from: 'Japan', to: 'South Korea', intensity: 70, sectors: ['Technology', 'Semiconductors', 'Automotive'] },
  { from: 'Japan', to: 'Taiwan', intensity: 65, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  { from: 'Japan', to: 'Thailand', intensity: 62, sectors: ['Automotive', 'Manufacturing', 'Electronics'] },
  
  { from: 'South Korea', to: 'United States', intensity: 68, sectors: ['Technology', 'Automotive', 'Semiconductors'] },
  { from: 'South Korea', to: 'China', intensity: 82, sectors: ['Technology', 'Semiconductors', 'Manufacturing'] },
  { from: 'South Korea', to: 'Japan', intensity: 70, sectors: ['Technology', 'Semiconductors', 'Automotive'] },
  { from: 'South Korea', to: 'Vietnam', intensity: 75, sectors: ['Manufacturing', 'Electronics', 'Textiles'] },
  
  { from: 'Taiwan', to: 'United States', intensity: 58, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  { from: 'Taiwan', to: 'China', intensity: 70, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  { from: 'Taiwan', to: 'Japan', intensity: 65, sectors: ['Semiconductors', 'Technology', 'Electronics'] },
  
  { from: 'Singapore', to: 'China', intensity: 60, sectors: ['Finance', 'Technology', 'Trade'] },
  { from: 'Singapore', to: 'Malaysia', intensity: 78, sectors: ['Manufacturing', 'Trade', 'Finance'] },
  { from: 'Singapore', to: 'Indonesia', intensity: 72, sectors: ['Trade', 'Finance', 'Manufacturing'] },
  
  { from: 'Vietnam', to: 'United States', intensity: 55, sectors: ['Manufacturing', 'Textiles', 'Electronics'] },
  { from: 'Vietnam', to: 'China', intensity: 72, sectors: ['Manufacturing', 'Textiles', 'Electronics'] },
  { from: 'Vietnam', to: 'South Korea', intensity: 75, sectors: ['Manufacturing', 'Electronics', 'Textiles'] },
  
  // Other major relationships
  { from: 'Canada', to: 'United States', intensity: 90, sectors: ['Energy', 'Automotive', 'Agriculture'] },
  { from: 'Mexico', to: 'United States', intensity: 92, sectors: ['Automotive', 'Manufacturing', 'Agriculture'] },
  { from: 'Australia', to: 'China', intensity: 68, sectors: ['Mining', 'Agriculture', 'Energy'] },
  { from: 'Brazil', to: 'China', intensity: 65, sectors: ['Agriculture', 'Mining', 'Energy'] },
  { from: 'India', to: 'United States', intensity: 60, sectors: ['Technology', 'Pharmaceuticals', 'Services'] },
  { from: 'India', to: 'China', intensity: 62, sectors: ['Manufacturing', 'Pharmaceuticals', 'Technology'] },
  { from: 'Russia', to: 'China', intensity: 70, sectors: ['Energy', 'Mining', 'Defense'] },
  { from: 'Russia', to: 'Germany', intensity: 55, sectors: ['Energy', 'Manufacturing'] },
  { from: 'Saudi Arabia', to: 'United States', intensity: 50, sectors: ['Energy', 'Defense'] },
  { from: 'Saudi Arabia', to: 'China', intensity: 58, sectors: ['Energy', 'Trade'] },
];

/**
 * Get trade partners for a country
 */
export function getTradePartners(country: string, minIntensity: number = 0): TradeRelationship[] {
  return TRADE_RELATIONSHIPS.filter(
    rel => rel.from === country && rel.intensity >= minIntensity
  );
}

/**
 * Get trade intensity between two countries
 */
export function getTradeIntensity(from: string, to: string): number {
  const relationship = TRADE_RELATIONSHIPS.find(
    rel => rel.from === from && rel.to === to
  );
  return relationship?.intensity || 0;
}

/**
 * Check if two countries have significant trade relationship
 */
export function hasSignificantTrade(from: string, to: string, threshold: number = 50): boolean {
  return getTradeIntensity(from, to) >= threshold;
}

/**
 * Get bidirectional trade intensity (average of both directions)
 */
export function getBidirectionalIntensity(country1: string, country2: string): number {
  const intensity1 = getTradeIntensity(country1, country2);
  const intensity2 = getTradeIntensity(country2, country1);
  return (intensity1 + intensity2) / 2;
}