/**
 * Geographic Normalizer
 * 
 * Comprehensive utility for normalizing geographic references to standard
 * country codes and regional classifications.
 */

export interface NormalizedLocation {
  originalText: string;
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
  region: string;
  continent: string;
  confidence: number;
  aliases: string[];
}

export interface GeographicMapping {
  countries: Record<string, CountryInfo>;
  regions: Record<string, RegionInfo>;
  aliases: Record<string, string>; // alias -> standard name
}

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  continent: string;
  aliases: string[];
  domains: string[]; // Common TLDs for this country
  currencies: string[];
  languages: string[];
}

export interface RegionInfo {
  name: string;
  countries: string[];
  aliases: string[];
  description: string;
}

export class GeographicNormalizer {
  private mapping: GeographicMapping;

  constructor() {
    this.mapping = this.initializeMapping();
  }

  /**
   * Normalize a geographic reference to standard format
   */
  normalize(text: string): NormalizedLocation | null {
    const cleanText = this.cleanText(text);
    
    // Try exact country name match first
    for (const [countryCode, info] of Object.entries(this.mapping.countries)) {
      if (info.name.toLowerCase() === cleanText.toLowerCase()) {
        return {
          originalText: text,
          countryCode: info.code,
          countryName: info.name,
          region: info.region,
          continent: info.continent,
          confidence: 0.95,
          aliases: info.aliases
        };
      }
    }

    // Try alias matching
    const aliasKey = cleanText.toLowerCase();
    if (this.mapping.aliases[aliasKey]) {
      const standardName = this.mapping.aliases[aliasKey];
      const country = this.findCountryByName(standardName);
      if (country) {
        return {
          originalText: text,
          countryCode: country.code,
          countryName: country.name,
          region: country.region,
          continent: country.continent,
          confidence: 0.90,
          aliases: country.aliases
        };
      }
    }

    // Try partial matching
    const partialMatch = this.findPartialMatch(cleanText);
    if (partialMatch) {
      return {
        originalText: text,
        countryCode: partialMatch.code,
        countryName: partialMatch.name,
        region: partialMatch.region,
        continent: partialMatch.continent,
        confidence: 0.75,
        aliases: partialMatch.aliases
      };
    }

    // Try region matching
    const regionMatch = this.findRegionMatch(cleanText);
    if (regionMatch) {
      return {
        originalText: text,
        countryCode: 'REGION',
        countryName: regionMatch.name,
        region: regionMatch.name,
        continent: 'Multiple',
        confidence: 0.80,
        aliases: regionMatch.aliases
      };
    }

    return null;
  }

  /**
   * Normalize multiple geographic references
   */
  normalizeMultiple(texts: string[]): NormalizedLocation[] {
    const results: NormalizedLocation[] = [];
    const seen = new Set<string>();

    for (const text of texts) {
      const normalized = this.normalize(text);
      if (normalized && !seen.has(normalized.countryCode)) {
        results.push(normalized);
        seen.add(normalized.countryCode);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract geographic references from text
   */
  extractGeographicReferences(text: string): NormalizedLocation[] {
    const references: NormalizedLocation[] = [];
    
    // Common patterns for geographic references
    const patterns = [
      // "in [Country]", "from [Country]", "to [Country]"
      /\b(?:in|from|to|across|throughout)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      
      // "[Country] operations", "[Country] market"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:operations|market|business|office|facility|plant|center)/g,
      
      // Standalone country names (capitalized)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const candidate = match[1];
        const normalized = this.normalize(candidate);
        
        if (normalized && normalized.confidence >= 0.7) {
          // Check if we already have this location
          const exists = references.some(ref => ref.countryCode === normalized.countryCode);
          if (!exists) {
            references.push(normalized);
          }
        }
      }
    }

    return references.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get country information by code
   */
  getCountryByCode(code: string): CountryInfo | null {
    return this.mapping.countries[code] || null;
  }

  /**
   * Get region information by name
   */
  getRegionByName(name: string): RegionInfo | null {
    return this.mapping.regions[name] || null;
  }

  /**
   * Get all countries in a region
   */
  getCountriesInRegion(regionName: string): CountryInfo[] {
    const region = this.mapping.regions[regionName];
    if (!region) return [];

    return region.countries
      .map(countryCode => this.mapping.countries[countryCode])
      .filter(Boolean);
  }

  /**
   * Detect country from domain
   */
  detectCountryFromDomain(domain: string): NormalizedLocation | null {
    const tld = domain.split('.').pop()?.toLowerCase();
    if (!tld) return null;

    for (const [countryCode, info] of Object.entries(this.mapping.countries)) {
      if (info.domains.includes(tld)) {
        return {
          originalText: domain,
          countryCode: info.code,
          countryName: info.name,
          region: info.region,
          continent: info.continent,
          confidence: 0.85,
          aliases: info.aliases
        };
      }
    }

    return null;
  }

  /**
   * Private helper methods
   */
  private cleanText(text: string): string {
    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private findCountryByName(name: string): CountryInfo | null {
    for (const info of Object.values(this.mapping.countries)) {
      if (info.name.toLowerCase() === name.toLowerCase()) {
        return info;
      }
    }
    return null;
  }

  private findPartialMatch(text: string): CountryInfo | null {
    const lowerText = text.toLowerCase();
    
    for (const info of Object.values(this.mapping.countries)) {
      // Check if any part of the country name matches
      const nameParts = info.name.toLowerCase().split(' ');
      if (nameParts.some(part => part.length > 3 && lowerText.includes(part))) {
        return info;
      }
      
      // Check aliases for partial matches
      for (const alias of info.aliases) {
        if (alias.toLowerCase().includes(lowerText) || lowerText.includes(alias.toLowerCase())) {
          return info;
        }
      }
    }
    
    return null;
  }

  private findRegionMatch(text: string): RegionInfo | null {
    const lowerText = text.toLowerCase();
    
    for (const info of Object.values(this.mapping.regions)) {
      if (info.name.toLowerCase() === lowerText) {
        return info;
      }
      
      for (const alias of info.aliases) {
        if (alias.toLowerCase() === lowerText) {
          return info;
        }
      }
    }
    
    return null;
  }

  /**
   * Initialize comprehensive geographic mapping
   */
  private initializeMapping(): GeographicMapping {
    const countries: Record<string, CountryInfo> = {
      'US': {
        code: 'US',
        name: 'United States',
        region: 'North America',
        continent: 'North America',
        aliases: ['USA', 'America', 'United States of America', 'U.S.', 'U.S.A.'],
        domains: ['us', 'com'],
        currencies: ['USD'],
        languages: ['en']
      },
      'CN': {
        code: 'CN',
        name: 'China',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['PRC', 'People\'s Republic of China', 'Mainland China', 'Chinese mainland'],
        domains: ['cn', 'com.cn'],
        currencies: ['CNY'],
        languages: ['zh']
      },
      'GB': {
        code: 'GB',
        name: 'United Kingdom',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['UK', 'Britain', 'Great Britain', 'England', 'U.K.'],
        domains: ['uk', 'co.uk'],
        currencies: ['GBP'],
        languages: ['en']
      },
      'DE': {
        code: 'DE',
        name: 'Germany',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Deutschland', 'Federal Republic of Germany'],
        domains: ['de'],
        currencies: ['EUR'],
        languages: ['de']
      },
      'JP': {
        code: 'JP',
        name: 'Japan',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Nippon', 'Nihon'],
        domains: ['jp', 'co.jp'],
        currencies: ['JPY'],
        languages: ['ja']
      },
      'FR': {
        code: 'FR',
        name: 'France',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['French Republic', 'République française'],
        domains: ['fr'],
        currencies: ['EUR'],
        languages: ['fr']
      },
      'IN': {
        code: 'IN',
        name: 'India',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Republic of India', 'Bharat'],
        domains: ['in', 'co.in'],
        currencies: ['INR'],
        languages: ['hi', 'en']
      },
      'CA': {
        code: 'CA',
        name: 'Canada',
        region: 'North America',
        continent: 'North America',
        aliases: ['Dominion of Canada'],
        domains: ['ca'],
        currencies: ['CAD'],
        languages: ['en', 'fr']
      },
      'AU': {
        code: 'AU',
        name: 'Australia',
        region: 'Asia Pacific',
        continent: 'Oceania',
        aliases: ['Commonwealth of Australia', 'Oz'],
        domains: ['au', 'com.au'],
        currencies: ['AUD'],
        languages: ['en']
      },
      'BR': {
        code: 'BR',
        name: 'Brazil',
        region: 'Latin America',
        continent: 'South America',
        aliases: ['Federative Republic of Brazil', 'Brasil'],
        domains: ['br', 'com.br'],
        currencies: ['BRL'],
        languages: ['pt']
      },
      'KR': {
        code: 'KR',
        name: 'South Korea',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Korea', 'Republic of Korea', 'ROK', 'Korean Republic'],
        domains: ['kr', 'co.kr'],
        currencies: ['KRW'],
        languages: ['ko']
      },
      'IT': {
        code: 'IT',
        name: 'Italy',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Italian Republic', 'Repubblica Italiana'],
        domains: ['it'],
        currencies: ['EUR'],
        languages: ['it']
      },
      'ES': {
        code: 'ES',
        name: 'Spain',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Kingdom of Spain', 'España'],
        domains: ['es'],
        currencies: ['EUR'],
        languages: ['es']
      },
      'MX': {
        code: 'MX',
        name: 'Mexico',
        region: 'Latin America',
        continent: 'North America',
        aliases: ['United Mexican States', 'México'],
        domains: ['mx', 'com.mx'],
        currencies: ['MXN'],
        languages: ['es']
      },
      'NL': {
        code: 'NL',
        name: 'Netherlands',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Holland', 'Kingdom of the Netherlands'],
        domains: ['nl'],
        currencies: ['EUR'],
        languages: ['nl']
      },
      'CH': {
        code: 'CH',
        name: 'Switzerland',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Swiss Confederation', 'Schweiz', 'Suisse'],
        domains: ['ch'],
        currencies: ['CHF'],
        languages: ['de', 'fr', 'it']
      },
      'SG': {
        code: 'SG',
        name: 'Singapore',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Republic of Singapore'],
        domains: ['sg', 'com.sg'],
        currencies: ['SGD'],
        languages: ['en', 'zh', 'ms', 'ta']
      },
      'HK': {
        code: 'HK',
        name: 'Hong Kong',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Hong Kong SAR', 'HKSAR'],
        domains: ['hk', 'com.hk'],
        currencies: ['HKD'],
        languages: ['zh', 'en']
      },
      'TW': {
        code: 'TW',
        name: 'Taiwan',
        region: 'Asia Pacific',
        continent: 'Asia',
        aliases: ['Republic of China', 'ROC', 'Chinese Taipei'],
        domains: ['tw', 'com.tw'],
        currencies: ['TWD'],
        languages: ['zh']
      },
      'RU': {
        code: 'RU',
        name: 'Russia',
        region: 'Europe',
        continent: 'Europe',
        aliases: ['Russian Federation', 'RF'],
        domains: ['ru'],
        currencies: ['RUB'],
        languages: ['ru']
      },
      'ZA': {
        code: 'ZA',
        name: 'South Africa',
        region: 'Middle East and Africa',
        continent: 'Africa',
        aliases: ['Republic of South Africa', 'RSA'],
        domains: ['za', 'co.za'],
        currencies: ['ZAR'],
        languages: ['en', 'af']
      }
    };

    const regions: Record<string, RegionInfo> = {
      'North America': {
        name: 'North America',
        countries: ['US', 'CA', 'MX'],
        aliases: ['Northern America', 'NA', 'Americas North'],
        description: 'North American region including US, Canada, and Mexico'
      },
      'Europe': {
        name: 'Europe',
        countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'RU'],
        aliases: ['European Union', 'EU', 'European Region', 'EMEA Europe'],
        description: 'European region including major EU countries'
      },
      'Asia Pacific': {
        name: 'Asia Pacific',
        countries: ['CN', 'JP', 'KR', 'IN', 'AU', 'SG', 'HK', 'TW'],
        aliases: ['APAC', 'Asia-Pacific', 'Asia Pac', 'Asian Pacific', 'Pacific Rim'],
        description: 'Asia Pacific region including East Asia, Southeast Asia, and Oceania'
      },
      'Latin America': {
        name: 'Latin America',
        countries: ['BR', 'MX'],
        aliases: ['LATAM', 'South America', 'Central America', 'Latin American region'],
        description: 'Latin American region including South and Central America'
      },
      'Middle East and Africa': {
        name: 'Middle East and Africa',
        countries: ['ZA'],
        aliases: ['EMEA MEA', 'MEA', 'Middle East & Africa', 'Africa and Middle East'],
        description: 'Middle East and Africa region'
      },
      'Europe, Middle East and Africa': {
        name: 'Europe, Middle East and Africa',
        countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'RU', 'ZA'],
        aliases: ['EMEA', 'Europe, Middle East & Africa'],
        description: 'Combined EMEA region'
      }
    };

    // Build aliases mapping
    const aliases: Record<string, string> = {};
    for (const country of Object.values(countries)) {
      for (const alias of country.aliases) {
        aliases[alias.toLowerCase()] = country.name;
      }
    }
    for (const region of Object.values(regions)) {
      for (const alias of region.aliases) {
        aliases[alias.toLowerCase()] = region.name;
      }
    }

    return { countries, regions, aliases };
  }

  /**
   * Validate geographic data consistency
   */
  validateGeographicData(locations: NormalizedLocation[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for duplicate countries
    const countrySet = new Set<string>();
    const duplicates: string[] = [];
    
    for (const location of locations) {
      if (countrySet.has(location.countryCode)) {
        duplicates.push(location.countryName);
      } else {
        countrySet.add(location.countryCode);
      }
    }

    if (duplicates.length > 0) {
      issues.push(`Duplicate countries found: ${duplicates.join(', ')}`);
      suggestions.push('Merge duplicate country entries and sum their values');
    }

    // Check confidence levels
    const lowConfidence = locations.filter(loc => loc.confidence < 0.7);
    if (lowConfidence.length > 0) {
      issues.push(`${lowConfidence.length} locations have low confidence scores`);
      suggestions.push('Review and validate low-confidence geographic references');
    }

    // Check for regional vs country mixing
    const regions = locations.filter(loc => loc.countryCode === 'REGION');
    const countries = locations.filter(loc => loc.countryCode !== 'REGION');
    
    if (regions.length > 0 && countries.length > 0) {
      issues.push('Mixed regional and country-level data found');
      suggestions.push('Standardize geographic granularity to either country or regional level');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}