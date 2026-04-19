/**
 * Named Entity Recognition (NER) Engine
 * 
 * Extracts entities from text: countries, agencies, companies, sectors, policy terms.
 * Uses regex and keyword matching for high-precision extraction.
 */

import { GLOBAL_COUNTRIES } from '@/data/globalCountries';

export interface ExtractedEntities {
  countries: string[];
  agencies: string[];
  companies: string[];
  sectors: string[];
  policyTerms: string[];
  confidence: number;
}

// Policy term dictionaries by category
const POLICY_TERMS = {
  sanctions: [
    'sanction', 'sanctions', 'sanctioned', 'sanctioning',
    'embargo', 'embargoes', 'embargoed',
    'blacklist', 'blacklisted',
    'restricted', 'restriction', 'restrictions',
    'prohibited', 'prohibition',
    'blocked', 'blocking'
  ],
  export_control: [
    'export control', 'export controls', 'export restriction',
    'export ban', 'export license', 'export licensing',
    'dual-use', 'controlled technology',
    'export administration', 'export regulation'
  ],
  tariff: [
    'tariff', 'tariffs', 'duty', 'duties',
    'import tax', 'customs duty',
    'trade barrier', 'trade restriction',
    'anti-dumping', 'countervailing'
  ],
  conflict: [
    'conflict', 'war', 'warfare', 'armed conflict',
    'military action', 'invasion', 'attack',
    'hostilities', 'combat', 'battle',
    'ceasefire', 'peace agreement'
  ],
  capital_control: [
    'capital control', 'capital controls',
    'currency control', 'exchange control',
    'capital flight', 'capital restriction',
    'foreign exchange', 'forex restriction'
  ],
  cyber: [
    'cyber attack', 'cyberattack', 'cyber threat',
    'data localization', 'data sovereignty',
    'internet shutdown', 'network disruption',
    'hacking', 'malware', 'ransomware'
  ],
  unrest: [
    'protest', 'protests', 'demonstration',
    'riot', 'riots', 'civil unrest',
    'strike', 'labor strike', 'walkout',
    'coup', 'coup attempt', 'uprising'
  ]
};

// Government agencies and organizations
const AGENCIES = [
  'OFAC', 'Treasury', 'Department of Treasury',
  'BIS', 'Bureau of Industry and Security',
  'Commerce Department', 'Department of Commerce',
  'State Department', 'Department of State',
  'MOFCOM', 'Ministry of Commerce',
  'European Commission', 'EU Commission',
  'UN Security Council', 'United Nations',
  'WTO', 'World Trade Organization',
  'IMF', 'International Monetary Fund',
  'World Bank', 'Federal Reserve', 'ECB',
  'CISA', 'NSA', 'FBI', 'CIA'
];

// Major sectors
const SECTORS = [
  'technology', 'semiconductor', 'chip', 'microchip',
  'defense', 'military', 'weapons', 'arms',
  'energy', 'oil', 'gas', 'petroleum',
  'finance', 'banking', 'financial',
  'telecommunications', 'telecom', '5G',
  'aerospace', 'aviation', 'aircraft',
  'automotive', 'automobile', 'vehicle',
  'pharmaceutical', 'medicine', 'drug',
  'agriculture', 'food', 'grain',
  'mining', 'mineral', 'rare earth'
];

/**
 * Extract entities from text
 */
export function extractEntities(text: string): ExtractedEntities {
  const normalizedText = text.toLowerCase();
  
  // Extract countries
  const countries = extractCountries(normalizedText);
  
  // Extract agencies
  const agencies = extractAgencies(normalizedText);
  
  // Extract companies (placeholder - would use more sophisticated NER in production)
  const companies: string[] = [];
  
  // Extract sectors
  const sectors = extractSectors(normalizedText);
  
  // Extract policy terms
  const policyTerms = extractPolicyTerms(normalizedText);
  
  // Calculate confidence based on entity counts
  const confidence = calculateConfidence(countries, agencies, policyTerms);
  
  return {
    countries,
    agencies,
    companies,
    sectors,
    policyTerms,
    confidence
  };
}

/**
 * Extract country names from text
 */
function extractCountries(text: string): string[] {
  const found = new Set<string>();
  
  GLOBAL_COUNTRIES.forEach(countryData => {
    const country = countryData.country;
    const pattern = new RegExp(`\\b${country.toLowerCase()}\\b`, 'i');
    
    if (pattern.test(text)) {
      found.add(country);
    }
    
    // Check for common variations
    if (country === 'United States' && /\b(us|usa|u\.s\.|america)\b/i.test(text)) {
      found.add(country);
    }
    if (country === 'United Kingdom' && /\b(uk|u\.k\.|britain)\b/i.test(text)) {
      found.add(country);
    }
    if (country === 'China' && /\b(prc|people's republic)\b/i.test(text)) {
      found.add(country);
    }
  });
  
  return Array.from(found);
}

/**
 * Extract agency names from text
 */
function extractAgencies(text: string): string[] {
  const found = new Set<string>();
  
  AGENCIES.forEach(agency => {
    const pattern = new RegExp(`\\b${agency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) {
      found.add(agency);
    }
  });
  
  return Array.from(found);
}

/**
 * Extract sector keywords from text
 */
function extractSectors(text: string): string[] {
  const found = new Set<string>();
  
  SECTORS.forEach(sector => {
    const pattern = new RegExp(`\\b${sector}\\b`, 'i');
    if (pattern.test(text)) {
      found.add(sector);
    }
  });
  
  return Array.from(found);
}

/**
 * Extract policy terms from text
 */
function extractPolicyTerms(text: string): string[] {
  const found = new Set<string>();
  
  Object.entries(POLICY_TERMS).forEach(([category, terms]) => {
    terms.forEach(term => {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) {
        found.add(term);
      }
    });
  });
  
  return Array.from(found);
}

/**
 * Calculate confidence score based on extracted entities
 */
function calculateConfidence(
  countries: string[],
  agencies: string[],
  policyTerms: string[]
): number {
  let score = 0;
  
  // Countries: 30 points max
  score += Math.min(countries.length * 15, 30);
  
  // Agencies: 30 points max
  score += Math.min(agencies.length * 15, 30);
  
  // Policy terms: 40 points max
  score += Math.min(policyTerms.length * 10, 40);
  
  return Math.min(score, 100);
}

/**
 * Check if text contains specific policy category
 */
export function containsPolicyCategory(text: string, category: keyof typeof POLICY_TERMS): boolean {
  const normalizedText = text.toLowerCase();
  const terms = POLICY_TERMS[category];
  
  return terms.some(term => {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(normalizedText);
  });
}

/**
 * Get policy categories present in text
 */
export function getPolicyCategories(text: string): string[] {
  const categories: string[] = [];
  
  Object.keys(POLICY_TERMS).forEach(category => {
    if (containsPolicyCategory(text, category as keyof typeof POLICY_TERMS)) {
      categories.push(category);
    }
  });
  
  return categories;
}