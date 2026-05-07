/**
 * Geographic Entity Extractor
 * 
 * Advanced NLP system for extracting and normalizing geographic references
 * from various document types with high accuracy and confidence scoring.
 */

export interface GeographicEntity {
  originalText: string;
  normalizedName: string;
  entityType: 'country' | 'region' | 'city' | 'continent' | 'economic_zone';
  confidence: number;
  context: string;
  aliases: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GeographicReference {
  entity: GeographicEntity;
  quantitativeData?: QuantitativeData;
  temporalContext?: TemporalContext;
  operationalContext?: OperationalContext;
}

export interface QuantitativeData {
  type: 'revenue_percentage' | 'employee_count' | 'facility_count' | 'market_share' | 'investment_amount';
  value: number;
  unit: string;
  confidence: number;
}

export interface TemporalContext {
  period: string;
  year?: number;
  quarter?: string;
  isHistorical: boolean;
  isForecast: boolean;
  confidence: number;
}

export interface OperationalContext {
  operationType: 'revenue' | 'manufacturing' | 'sales' | 'rd' | 'headquarters' | 'supply_chain';
  description: string;
  confidence: number;
}

export class GeographicEntityExtractor {
  private readonly COUNTRY_DATABASE = {
    // Major countries with common aliases
    'United States': {
      aliases: ['US', 'USA', 'America', 'United States of America', 'U.S.', 'U.S.A.'],
      continent: 'North America',
      region: 'North America',
      coordinates: { latitude: 39.8283, longitude: -98.5795 }
    },
    'China': {
      aliases: ['PRC', 'People\'s Republic of China', 'Mainland China', 'Chinese mainland'],
      continent: 'Asia',
      region: 'Asia Pacific',
      coordinates: { latitude: 35.8617, longitude: 104.1954 }
    },
    'United Kingdom': {
      aliases: ['UK', 'Britain', 'Great Britain', 'England', 'U.K.'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 55.3781, longitude: -3.4360 }
    },
    'Germany': {
      aliases: ['Deutschland', 'Federal Republic of Germany'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 51.1657, longitude: 10.4515 }
    },
    'Japan': {
      aliases: ['Nippon', 'Nihon'],
      continent: 'Asia',
      region: 'Asia Pacific',
      coordinates: { latitude: 36.2048, longitude: 138.2529 }
    },
    'France': {
      aliases: ['French Republic', 'République française'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 46.2276, longitude: 2.2137 }
    },
    'India': {
      aliases: ['Republic of India', 'Bharat'],
      continent: 'Asia',
      region: 'Asia Pacific',
      coordinates: { latitude: 20.5937, longitude: 78.9629 }
    },
    'Canada': {
      aliases: ['Dominion of Canada'],
      continent: 'North America',
      region: 'North America',
      coordinates: { latitude: 56.1304, longitude: -106.3468 }
    },
    'Australia': {
      aliases: ['Commonwealth of Australia', 'Oz'],
      continent: 'Oceania',
      region: 'Asia Pacific',
      coordinates: { latitude: -25.2744, longitude: 133.7751 }
    },
    'Brazil': {
      aliases: ['Federative Republic of Brazil', 'Brasil'],
      continent: 'South America',
      region: 'Latin America',
      coordinates: { latitude: -14.2350, longitude: -51.9253 }
    },
    'South Korea': {
      aliases: ['Korea', 'Republic of Korea', 'ROK', 'Korean Republic'],
      continent: 'Asia',
      region: 'Asia Pacific',
      coordinates: { latitude: 35.9078, longitude: 127.7669 }
    },
    'Italy': {
      aliases: ['Italian Republic', 'Repubblica Italiana'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 41.8719, longitude: 12.5674 }
    },
    'Spain': {
      aliases: ['Kingdom of Spain', 'España'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 40.4637, longitude: -3.7492 }
    },
    'Mexico': {
      aliases: ['United Mexican States', 'México'],
      continent: 'North America',
      region: 'Latin America',
      coordinates: { latitude: 23.6345, longitude: -102.5528 }
    },
    'Netherlands': {
      aliases: ['Holland', 'Kingdom of the Netherlands'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 52.1326, longitude: 5.2913 }
    },
    'Switzerland': {
      aliases: ['Swiss Confederation', 'Schweiz', 'Suisse'],
      continent: 'Europe',
      region: 'Europe',
      coordinates: { latitude: 46.8182, longitude: 8.2275 }
    }
  };

  private readonly REGION_DATABASE = {
    // Major regions with country mappings
    'North America': {
      aliases: ['Northern America', 'NA'],
      countries: ['United States', 'Canada', 'Mexico'],
      description: 'North American region including US, Canada, and Mexico'
    },
    'Europe': {
      aliases: ['European Union', 'EU', 'European Region', 'EMEA Europe'],
      countries: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland'],
      description: 'European region including major EU countries'
    },
    'Asia Pacific': {
      aliases: ['APAC', 'Asia-Pacific', 'Asia Pac', 'Asian Pacific', 'Pacific Rim'],
      countries: ['China', 'Japan', 'South Korea', 'India', 'Australia', 'Singapore', 'Thailand'],
      description: 'Asia Pacific region including East Asia, Southeast Asia, and Oceania'
    },
    'Latin America': {
      aliases: ['LATAM', 'South America', 'Central America', 'Latin American region'],
      countries: ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'],
      description: 'Latin American region including South and Central America'
    },
    'Middle East and Africa': {
      aliases: ['EMEA MEA', 'MEA', 'Middle East & Africa', 'Africa and Middle East'],
      countries: ['Saudi Arabia', 'UAE', 'South Africa', 'Israel', 'Turkey', 'Egypt'],
      description: 'Middle East and Africa region'
    },
    'Europe, Middle East and Africa': {
      aliases: ['EMEA', 'Europe, Middle East & Africa'],
      countries: ['United Kingdom', 'Germany', 'France', 'Saudi Arabia', 'UAE', 'South Africa'],
      description: 'Combined EMEA region'
    }
  };

  private readonly QUANTITATIVE_PATTERNS = {
    // Revenue patterns
    revenue: {
      percentage: /(\d+(?:\.\d+)?)\s*%\s*(?:of|from)?\s*(?:revenue|sales|income)/gi,
      amount: /(?:\$|USD|EUR|GBP|JPY|CNY)?\s*(\d+(?:\.\d+)?)\s*(billion|million|thousand|B|M|K)?\s*(?:in\s+)?(?:revenue|sales)/gi,
      growth: /(?:revenue|sales)\s+(?:grew|increased|decreased)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%/gi
    },
    
    // Employee patterns
    employees: /(\d{1,3}(?:,\d{3})*)\s*(?:employee|employees|people|staff|workforce|headcount)/gi,
    
    // Facility patterns
    facilities: /(\d+)\s*(?:office|offices|facility|facilities|location|locations|site|sites)/gi,
    
    // Market share patterns
    marketShare: /(?:market\s+share|share)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*%/gi,
    
    // Investment patterns
    investment: /(?:invest|investment)\s+(?:of\s+)?(?:\$|USD|EUR)?\s*(\d+(?:\.\d+)?)\s*(billion|million|B|M)/gi
  };

  private readonly TEMPORAL_PATTERNS = {
    // Year patterns
    year: /\b(19|20)\d{2}\b/g,
    
    // Quarter patterns
    quarter: /\b(?:Q[1-4]|first|second|third|fourth)\s+quarter\b/gi,
    
    // Period patterns
    period: /\b(?:FY|fiscal\s+year)\s*(19|20)\d{2}\b/gi,
    
    // Forecast indicators
    forecast: /\b(?:expect|forecast|guidance|outlook|projected?|estimated?)\b/gi,
    
    // Historical indicators
    historical: /\b(?:reported|actual|historical|previous|prior)\b/gi
  };

  private readonly OPERATIONAL_PATTERNS = {
    // Revenue operations
    revenue: /\b(?:revenue|sales|income|earnings)\b/gi,
    
    // Manufacturing operations
    manufacturing: /\b(?:manufacturing|production|assembly|fabrication|plant|factory)\b/gi,
    
    // Sales operations
    sales: /\b(?:sales|commercial|marketing|distribution|retail)\b/gi,
    
    // R&D operations
    rd: /\b(?:R&D|research|development|innovation|engineering|technology)\b/gi,
    
    // Headquarters operations
    headquarters: /\b(?:headquarters|HQ|head\s+office|corporate\s+office)\b/gi,
    
    // Supply chain operations
    supplyChain: /\b(?:supply\s+chain|supplier|vendor|procurement|sourcing)\b/gi
  };

  /**
   * Extract geographic entities from text with context
   */
  extractGeographicEntities(text: string): GeographicReference[] {
    console.log('🌍 Extracting geographic entities from text...');
    
    const entities: GeographicReference[] = [];
    
    // Extract countries
    entities.push(...this.extractCountries(text));
    
    // Extract regions
    entities.push(...this.extractRegions(text));
    
    // Extract cities (basic implementation)
    entities.push(...this.extractCities(text));
    
    console.log(`✅ Extracted ${entities.length} geographic entities`);
    
    return this.deduplicateEntities(entities);
  }

  /**
   * Extract countries from text
   */
  private extractCountries(text: string): GeographicReference[] {
    const references: GeographicReference[] = [];
    
    for (const [countryName, countryData] of Object.entries(this.COUNTRY_DATABASE)) {
      // Check main country name
      const mainPattern = new RegExp(`\\b${this.escapeRegex(countryName)}\\b`, 'gi');
      let match;
      
      while ((match = mainPattern.exec(text)) !== null) {
        const context = this.extractContext(text, match.index, match[0].length);
        
        const entity: GeographicEntity = {
          originalText: match[0],
          normalizedName: countryName,
          entityType: 'country',
          confidence: 0.95,
          context: context,
          aliases: countryData.aliases,
          coordinates: countryData.coordinates
        };
        
        const reference: GeographicReference = {
          entity,
          quantitativeData: this.extractQuantitativeData(context),
          temporalContext: this.extractTemporalContext(context),
          operationalContext: this.extractOperationalContext(context)
        };
        
        references.push(reference);
      }
      
      // Check aliases
      for (const alias of countryData.aliases) {
        const aliasPattern = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
        aliasPattern.lastIndex = 0;
        
        while ((match = aliasPattern.exec(text)) !== null) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          const entity: GeographicEntity = {
            originalText: match[0],
            normalizedName: countryName,
            entityType: 'country',
            confidence: 0.85, // Slightly lower confidence for aliases
            context: context,
            aliases: countryData.aliases,
            coordinates: countryData.coordinates
          };
          
          const reference: GeographicReference = {
            entity,
            quantitativeData: this.extractQuantitativeData(context),
            temporalContext: this.extractTemporalContext(context),
            operationalContext: this.extractOperationalContext(context)
          };
          
          references.push(reference);
        }
      }
    }
    
    return references;
  }

  /**
   * Extract regions from text
   */
  private extractRegions(text: string): GeographicReference[] {
    const references: GeographicReference[] = [];
    
    for (const [regionName, regionData] of Object.entries(this.REGION_DATABASE)) {
      // Check main region name
      const mainPattern = new RegExp(`\\b${this.escapeRegex(regionName)}\\b`, 'gi');
      let match;
      
      while ((match = mainPattern.exec(text)) !== null) {
        const context = this.extractContext(text, match.index, match[0].length);
        
        const entity: GeographicEntity = {
          originalText: match[0],
          normalizedName: regionName,
          entityType: 'region',
          confidence: 0.90,
          context: context,
          aliases: regionData.aliases
        };
        
        const reference: GeographicReference = {
          entity,
          quantitativeData: this.extractQuantitativeData(context),
          temporalContext: this.extractTemporalContext(context),
          operationalContext: this.extractOperationalContext(context)
        };
        
        references.push(reference);
      }
      
      // Check aliases
      for (const alias of regionData.aliases) {
        const aliasPattern = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
        aliasPattern.lastIndex = 0;
        
        while ((match = aliasPattern.exec(text)) !== null) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          const entity: GeographicEntity = {
            originalText: match[0],
            normalizedName: regionName,
            entityType: 'region',
            confidence: 0.80,
            context: context,
            aliases: regionData.aliases
          };
          
          const reference: GeographicReference = {
            entity,
            quantitativeData: this.extractQuantitativeData(context),
            temporalContext: this.extractTemporalContext(context),
            operationalContext: this.extractOperationalContext(context)
          };
          
          references.push(reference);
        }
      }
    }
    
    return references;
  }

  /**
   * Extract cities from text (basic implementation)
   */
  private extractCities(text: string): GeographicReference[] {
    const references: GeographicReference[] = [];
    
    // Major cities pattern (simplified)
    const majorCities = [
      'New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Shanghai', 'Beijing', 'Mumbai', 'Delhi',
      'Sydney', 'Toronto', 'São Paulo', 'Mexico City', 'Dubai', 'Singapore', 'Hong Kong',
      'Los Angeles', 'Chicago', 'Boston', 'San Francisco', 'Seattle', 'Washington DC',
      'Frankfurt', 'Amsterdam', 'Zurich', 'Milan', 'Madrid', 'Barcelona'
    ];
    
    for (const city of majorCities) {
      const pattern = new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'gi');
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const context = this.extractContext(text, match.index, match[0].length);
        
        // Only include if it appears to be in a business context
        if (this.isBusinessContext(context)) {
          const entity: GeographicEntity = {
            originalText: match[0],
            normalizedName: city,
            entityType: 'city',
            confidence: 0.70,
            context: context,
            aliases: []
          };
          
          const reference: GeographicReference = {
            entity,
            quantitativeData: this.extractQuantitativeData(context),
            temporalContext: this.extractTemporalContext(context),
            operationalContext: this.extractOperationalContext(context)
          };
          
          references.push(reference);
        }
      }
    }
    
    return references;
  }

  /**
   * Extract context around a geographic entity
   */
  private extractContext(text: string, index: number, length: number): string {
    const contextRadius = 100; // Characters before and after
    const start = Math.max(0, index - contextRadius);
    const end = Math.min(text.length, index + length + contextRadius);
    
    return text.substring(start, end).trim();
  }

  /**
   * Extract quantitative data from context
   */
  private extractQuantitativeData(context: string): QuantitativeData | undefined {
    // Check for revenue percentage
    let match = this.QUANTITATIVE_PATTERNS.revenue.percentage.exec(context);
    if (match) {
      return {
        type: 'revenue_percentage',
        value: parseFloat(match[1]),
        unit: 'percentage',
        confidence: 0.90
      };
    }
    
    // Check for revenue amount
    this.QUANTITATIVE_PATTERNS.revenue.amount.lastIndex = 0;
    match = this.QUANTITATIVE_PATTERNS.revenue.amount.exec(context);
    if (match) {
      let amount = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'billion' || unit === 'b') amount *= 1000000000;
      else if (unit === 'million' || unit === 'm') amount *= 1000000;
      else if (unit === 'thousand' || unit === 'k') amount *= 1000;
      
      return {
        type: 'revenue_percentage',
        value: amount,
        unit: 'currency',
        confidence: 0.85
      };
    }
    
    // Check for employee count
    this.QUANTITATIVE_PATTERNS.employees.lastIndex = 0;
    match = this.QUANTITATIVE_PATTERNS.employees.exec(context);
    if (match) {
      return {
        type: 'employee_count',
        value: parseInt(match[1].replace(/,/g, '')),
        unit: 'count',
        confidence: 0.80
      };
    }
    
    // Check for facility count
    this.QUANTITATIVE_PATTERNS.facilities.lastIndex = 0;
    match = this.QUANTITATIVE_PATTERNS.facilities.exec(context);
    if (match) {
      return {
        type: 'facility_count',
        value: parseInt(match[1]),
        unit: 'count',
        confidence: 0.75
      };
    }
    
    return undefined;
  }

  /**
   * Extract temporal context from text
   */
  private extractTemporalContext(context: string): TemporalContext | undefined {
    // Check for year
    const yearMatch = this.TEMPORAL_PATTERNS.year.exec(context);
    
    // Check for quarter
    this.TEMPORAL_PATTERNS.quarter.lastIndex = 0;
    const quarterMatch = this.TEMPORAL_PATTERNS.quarter.exec(context);
    
    // Check for period
    this.TEMPORAL_PATTERNS.period.lastIndex = 0;
    const periodMatch = this.TEMPORAL_PATTERNS.period.exec(context);
    
    // Check for forecast indicators
    this.TEMPORAL_PATTERNS.forecast.lastIndex = 0;
    const isForecast = this.TEMPORAL_PATTERNS.forecast.test(context);
    
    // Check for historical indicators
    this.TEMPORAL_PATTERNS.historical.lastIndex = 0;
    const isHistorical = this.TEMPORAL_PATTERNS.historical.test(context);
    
    if (yearMatch || quarterMatch || periodMatch || isForecast || isHistorical) {
      return {
        period: periodMatch?.[0] || yearMatch?.[0] || quarterMatch?.[0] || 'unspecified',
        year: yearMatch ? parseInt(yearMatch[0]) : undefined,
        quarter: quarterMatch?.[0],
        isHistorical,
        isForecast,
        confidence: 0.80
      };
    }
    
    return undefined;
  }

  /**
   * Extract operational context from text
   */
  private extractOperationalContext(context: string): OperationalContext | undefined {
    const operations = [
      { type: 'revenue' as const, pattern: this.OPERATIONAL_PATTERNS.revenue },
      { type: 'manufacturing' as const, pattern: this.OPERATIONAL_PATTERNS.manufacturing },
      { type: 'sales' as const, pattern: this.OPERATIONAL_PATTERNS.sales },
      { type: 'rd' as const, pattern: this.OPERATIONAL_PATTERNS.rd },
      { type: 'headquarters' as const, pattern: this.OPERATIONAL_PATTERNS.headquarters },
      { type: 'supply_chain' as const, pattern: this.OPERATIONAL_PATTERNS.supplyChain }
    ];
    
    for (const operation of operations) {
      operation.pattern.lastIndex = 0;
      if (operation.pattern.test(context)) {
        return {
          operationType: operation.type,
          description: `${operation.type} operations`,
          confidence: 0.75
        };
      }
    }
    
    return undefined;
  }

  /**
   * Check if context appears to be business-related
   */
  private isBusinessContext(context: string): boolean {
    const businessKeywords = [
      'office', 'headquarters', 'facility', 'revenue', 'sales', 'employee', 'operations',
      'manufacturing', 'distribution', 'market', 'business', 'company', 'subsidiary'
    ];
    
    const lowerContext = context.toLowerCase();
    return businessKeywords.some(keyword => lowerContext.includes(keyword));
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Deduplicate entities based on normalized name and context
   */
  private deduplicateEntities(entities: GeographicReference[]): GeographicReference[] {
    const seen = new Map<string, GeographicReference>();
    
    for (const entity of entities) {
      const key = `${entity.entity.normalizedName}-${entity.entity.entityType}`;
      
      if (!seen.has(key) || (seen.get(key)!.entity.confidence < entity.entity.confidence)) {
        seen.set(key, entity);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Normalize geographic name using standard conventions
   */
  normalizeGeographicName(name: string): string {
    // Remove extra whitespace
    name = name.trim().replace(/\s+/g, ' ');
    
    // Common normalizations
    const normalizations: Record<string, string> = {
      'US': 'United States',
      'USA': 'United States',
      'U.S.': 'United States',
      'U.S.A.': 'United States',
      'UK': 'United Kingdom',
      'U.K.': 'United Kingdom',
      'EU': 'Europe',
      'APAC': 'Asia Pacific',
      'EMEA': 'Europe, Middle East and Africa',
      'LATAM': 'Latin America'
    };
    
    return normalizations[name] || name;
  }

  /**
   * Get region for a given country
   */
  getRegionForCountry(country: string): string {
    for (const [regionName, regionData] of Object.entries(this.REGION_DATABASE)) {
      if (regionData.countries.includes(country)) {
        return regionName;
      }
    }
    return 'Other';
  }

  /**
   * Validate geographic entity
   */
  validateGeographicEntity(entity: GeographicEntity): boolean {
    // Basic validation rules
    if (entity.confidence < 0.1) return false;
    if (entity.normalizedName.length < 2) return false;
    if (entity.originalText.length < 2) return false;
    
    return true;
  }
}