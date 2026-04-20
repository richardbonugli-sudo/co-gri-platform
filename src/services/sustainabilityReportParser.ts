/**
 * Sustainability Report Parser
 * 
 * Advanced PDF parsing system for ESG reports, sustainability reports,
 * impact reports, and corporate responsibility documents.
 */

export interface SustainabilityData {
  facilityLocations: GeographicFacility[];
  supplierDistribution: GeographicSupplier[];
  employeeHeadcount: GeographicEmployee[];
  manufacturingLocations: GeographicManufacturing[];
  rdCenters: GeographicRD[];
  salesOffices: GeographicSales[];
  environmentalMetrics: EnvironmentalMetric[];
  socialMetrics: SocialMetric[];
  governanceMetrics: GovernanceMetric[];
}

export interface GeographicFacility {
  country: string;
  region: string;
  facilityType: 'headquarters' | 'office' | 'warehouse' | 'datacenter' | 'retail' | 'other';
  facilityCount: number;
  employeeCount?: number;
  squareFootage?: number;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicSupplier {
  country: string;
  region: string;
  supplierCount: number;
  spendPercentage?: number;
  supplierType: 'tier1' | 'tier2' | 'tier3' | 'strategic' | 'other';
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicEmployee {
  country: string;
  region: string;
  employeeCount: number;
  employeePercentage?: number;
  employeeType: 'fulltime' | 'contractor' | 'seasonal' | 'all';
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicManufacturing {
  country: string;
  region: string;
  facilityCount: number;
  productionCapacity?: string;
  productTypes: string[];
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicRD {
  country: string;
  region: string;
  centerCount: number;
  employeeCount?: number;
  focusAreas: string[];
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicSales {
  country: string;
  region: string;
  officeCount: number;
  employeeCount?: number;
  revenuePercentage?: number;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface EnvironmentalMetric {
  metric: string;
  value: number | string;
  unit: string;
  geography?: string;
  year: number;
  confidence: number;
  source: string;
}

export interface SocialMetric {
  metric: string;
  value: number | string;
  unit: string;
  geography?: string;
  year: number;
  confidence: number;
  source: string;
}

export interface GovernanceMetric {
  metric: string;
  value: number | string;
  unit: string;
  geography?: string;
  year: number;
  confidence: number;
  source: string;
}

export interface SustainabilityReportSource {
  ticker: string;
  companyName: string;
  reportType: 'sustainability' | 'esg' | 'impact' | 'responsibility' | 'environmental';
  reportYear: number;
  reportUrl: string;
  reportTitle: string;
  lastUpdated: Date;
  priority: 1 | 2 | 3;
}

export class SustainabilityReportParser {
  private readonly GEOGRAPHIC_PATTERNS = {
    // Country patterns
    countries: /\b(United States|USA|US|China|Japan|Germany|United Kingdom|UK|France|Italy|Spain|Canada|Australia|India|Brazil|Mexico|South Korea|Netherlands|Switzerland|Belgium|Sweden|Norway|Denmark|Finland|Ireland|Austria|Portugal|Poland|Czech Republic|Hungary|Romania|Bulgaria|Croatia|Slovenia|Slovakia|Estonia|Latvia|Lithuania|Luxembourg|Malta|Cyprus|Greece|Turkey|Russia|Ukraine|Israel|Egypt|South Africa|Nigeria|Kenya|Morocco|Saudi Arabia|UAE|Qatar|Kuwait|Oman|Bahrain|Jordan|Lebanon|Iraq|Iran|Pakistan|Bangladesh|Sri Lanka|Thailand|Malaysia|Singapore|Indonesia|Philippines|Vietnam|Hong Kong|Taiwan|New Zealand|Argentina|Chile|Colombia|Peru|Venezuela|Ecuador|Uruguay|Paraguay|Bolivia|Costa Rica|Panama|Guatemala|Honduras|El Salvador|Nicaragua|Cuba|Dominican Republic|Jamaica|Trinidad and Tobago|Barbados|Bahamas|Haiti)\b/gi,
    
    // Regional patterns
    regions: /\b(North America|South America|Latin America|Europe|European Union|EU|Asia|Asia Pacific|APAC|Asia-Pacific|Middle East|Africa|EMEA|LATAM|Americas|Oceania|Nordic|Scandinavia|Eastern Europe|Western Europe|Central Europe|Southeast Asia|East Asia|Central Asia|South Asia|Sub-Saharan Africa|North Africa|Caribbean|Pacific|Atlantic|Indian Ocean)\b/gi,
    
    // Facility indicators
    facilities: /\b(office|offices|facility|facilities|plant|plants|factory|factories|warehouse|warehouses|distribution center|fulfillment center|data center|datacenter|headquarters|HQ|campus|site|sites|location|locations|building|buildings)\b/gi,
    
    // Employee indicators
    employees: /\b(employee|employees|workforce|staff|personnel|headcount|team member|team members|associate|associates|contractor|contractors)\b/gi,
    
    // Manufacturing indicators
    manufacturing: /\b(manufacturing|production|assembly|fabrication|processing|plant|factory|mill|refinery|foundry|facility)\b/gi,
    
    // Supplier indicators
    suppliers: /\b(supplier|suppliers|vendor|vendors|partner|partners|contractor|contractors|third party|third-party|supply chain|procurement)\b/gi,
    
    // R&D indicators
    rd: /\b(research and development|R&D|RnD|research|development|innovation|lab|laboratory|laboratories|center of excellence|technical center|engineering center)\b/gi,
    
    // Sales indicators
    sales: /\b(sales|sales office|regional office|branch|branch office|subsidiary|affiliate|representative office|commercial office)\b/gi
  };

  private readonly QUANTITATIVE_PATTERNS = {
    // Percentage patterns
    percentage: /(\d+(?:\.\d+)?)\s*%/g,
    
    // Number patterns with units
    employeeCount: /(\d{1,3}(?:,\d{3})*)\s*(?:employee|employees|people|staff|workforce|headcount)/gi,
    facilityCount: /(\d+)\s*(?:office|offices|facility|facilities|location|locations|site|sites)/gi,
    
    // Revenue patterns
    revenue: /(\d+(?:\.\d+)?)\s*(?:billion|million|thousand|%)\s*(?:of|in)?\s*(?:revenue|sales|income)/gi,
    
    // Geographic distribution patterns
    distribution: /(\d+(?:\.\d+)?)\s*%\s*(?:of|in|from)?\s*([A-Za-z\s]+?)(?:\s|,|;|\.)/g
  };

  /**
   * Parse sustainability report content for geographic data
   */
  async parseSustainabilityReport(content: string, source: SustainabilityReportSource): Promise<SustainabilityData> {
    console.log(`🌱 Parsing sustainability report for ${source.ticker} (${source.reportType} ${source.reportYear})`);
    
    const data: SustainabilityData = {
      facilityLocations: [],
      supplierDistribution: [],
      employeeHeadcount: [],
      manufacturingLocations: [],
      rdCenters: [],
      salesOffices: [],
      environmentalMetrics: [],
      socialMetrics: [],
      governanceMetrics: []
    };

    // Split content into sections for better parsing
    const sections = this.splitIntoSections(content);
    
    // Parse each section for different types of geographic data
    for (const section of sections) {
      // Extract facility locations
      data.facilityLocations.push(...this.extractFacilityLocations(section, source));
      
      // Extract employee headcount data
      data.employeeHeadcount.push(...this.extractEmployeeHeadcount(section, source));
      
      // Extract manufacturing locations
      data.manufacturingLocations.push(...this.extractManufacturingLocations(section, source));
      
      // Extract supplier distribution
      data.supplierDistribution.push(...this.extractSupplierDistribution(section, source));
      
      // Extract R&D centers
      data.rdCenters.push(...this.extractRDCenters(section, source));
      
      // Extract sales offices
      data.salesOffices.push(...this.extractSalesOffices(section, source));
    }

    console.log(`✅ Extracted ${data.facilityLocations.length} facilities, ${data.employeeHeadcount.length} employee records, ${data.manufacturingLocations.length} manufacturing sites`);
    
    return data;
  }

  /**
   * Split content into logical sections
   */
  private splitIntoSections(content: string): string[] {
    // Split by common section headers
    const sectionHeaders = [
      /^(?:Our )?Global (?:Presence|Operations|Footprint)/mi,
      /^(?:Geographic|Regional) (?:Distribution|Breakdown|Presence)/mi,
      /^(?:Facilities|Locations|Operations)/mi,
      /^(?:Employees|Workforce|People)/mi,
      /^(?:Manufacturing|Production)/mi,
      /^(?:Supply Chain|Suppliers)/mi,
      /^(?:Research|R&D|Innovation)/mi,
      /^(?:Sales|Commercial|Market)/mi
    ];

    let sections = [content]; // Start with full content
    
    for (const header of sectionHeaders) {
      const newSections: string[] = [];
      for (const section of sections) {
        const parts = section.split(header);
        newSections.push(...parts);
      }
      sections = newSections;
    }

    // Filter out very short sections
    return sections.filter(section => section.trim().length > 100);
  }

  /**
   * Extract facility locations from text
   */
  private extractFacilityLocations(text: string, source: SustainabilityReportSource): GeographicFacility[] {
    const facilities: GeographicFacility[] = [];
    
    // Look for patterns like "offices in 25 countries" or "facilities across Europe"
    const facilityPatterns = [
      /(\d+)\s+(?:office|offices|facilities?|locations?)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(?:office|offices|facilities?|locations?)\s+(?:in|across|throughout)\s+([^.]+?)(?:\s|,|;|\.)/gi,
      /([^.]+?)\s+(?:office|offices|facilities?|locations?)/gi
    ];

    for (const pattern of facilityPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countStr = match[1];
        const locationText = match[2] || match[1];

        // Extract countries and regions from location text
        const countries = this.extractCountries(locationText);
        const regions = this.extractRegions(locationText);

        // Create facility records
        for (const country of countries) {
          facilities.push({
            country: country,
            region: this.getRegionForCountry(country),
            facilityType: this.determineFacilityType(extractedText),
            facilityCount: countStr ? parseInt(countStr) : 1,
            confidence: this.calculateConfidence(extractedText, ['facility', 'office', 'location']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }

        for (const region of regions) {
          facilities.push({
            country: 'Multiple',
            region: region,
            facilityType: this.determineFacilityType(extractedText),
            facilityCount: countStr ? parseInt(countStr) : 1,
            confidence: this.calculateConfidence(extractedText, ['facility', 'office', 'location']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }
      }
    }

    return this.deduplicateFacilities(facilities);
  }

  /**
   * Extract employee headcount data from text
   */
  private extractEmployeeHeadcount(text: string, source: SustainabilityReportSource): GeographicEmployee[] {
    const employees: GeographicEmployee[] = [];
    
    const employeePatterns = [
      /(\d{1,3}(?:,\d{3})*)\s+(?:employee|employees|people|staff)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(?:employee|employees|people|staff)\s+(?:in|across|throughout)\s+([^.]+?):\s*(\d{1,3}(?:,\d{3})*)/gi,
      /([^.]+?):\s*(\d{1,3}(?:,\d{3})*)\s+(?:employee|employees|people|staff)/gi
    ];

    for (const pattern of employeePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countStr = match[1] || match[2];
        const locationText = match[2] || match[1];

        if (countStr && locationText) {
          const count = parseInt(countStr.replace(/,/g, ''));
          const countries = this.extractCountries(locationText);
          const regions = this.extractRegions(locationText);

          for (const country of countries) {
            employees.push({
              country: country,
              region: this.getRegionForCountry(country),
              employeeCount: count,
              employeeType: 'fulltime',
              confidence: this.calculateConfidence(extractedText, ['employee', 'staff', 'workforce']),
              source: `${source.reportType} ${source.reportYear}`,
              extractedText: extractedText
            });
          }

          for (const region of regions) {
            employees.push({
              country: 'Multiple',
              region: region,
              employeeCount: count,
              employeeType: 'fulltime',
              confidence: this.calculateConfidence(extractedText, ['employee', 'staff', 'workforce']),
              source: `${source.reportType} ${source.reportYear}`,
              extractedText: extractedText
            });
          }
        }
      }
    }

    return this.deduplicateEmployees(employees);
  }

  /**
   * Extract manufacturing locations from text
   */
  private extractManufacturingLocations(text: string, source: SustainabilityReportSource): GeographicManufacturing[] {
    const manufacturing: GeographicManufacturing[] = [];
    
    const manufacturingPatterns = [
      /(\d+)\s+(?:manufacturing|production|assembly)\s+(?:plant|plants|facility|facilities)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(?:manufacturing|production|assembly)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /([^.]+?)\s+(?:manufacturing|production|assembly)\s+(?:plant|plants|facility|facilities)/gi
    ];

    for (const pattern of manufacturingPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countStr = match[1];
        const locationText = match[2] || match[1];

        const countries = this.extractCountries(locationText);
        const regions = this.extractRegions(locationText);

        for (const country of countries) {
          manufacturing.push({
            country: country,
            region: this.getRegionForCountry(country),
            facilityCount: countStr ? parseInt(countStr) : 1,
            productTypes: this.extractProductTypes(extractedText),
            confidence: this.calculateConfidence(extractedText, ['manufacturing', 'production', 'plant']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }

        for (const region of regions) {
          manufacturing.push({
            country: 'Multiple',
            region: region,
            facilityCount: countStr ? parseInt(countStr) : 1,
            productTypes: this.extractProductTypes(extractedText),
            confidence: this.calculateConfidence(extractedText, ['manufacturing', 'production', 'plant']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }
      }
    }

    return this.deduplicateManufacturing(manufacturing);
  }

  /**
   * Extract supplier distribution from text
   */
  private extractSupplierDistribution(text: string, source: SustainabilityReportSource): GeographicSupplier[] {
    const suppliers: GeographicSupplier[] = [];
    
    const supplierPatterns = [
      /(\d+)\s+(?:supplier|suppliers|vendor|vendors)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(\d+(?:\.\d+)?)\s*%\s+of\s+(?:supplier|suppliers|vendor|vendors)\s+(?:in|from)\s+([^.]+)/gi,
      /(?:supplier|suppliers|vendor|vendors)\s+(?:in|across|throughout)\s+([^.]+)/gi
    ];

    for (const pattern of supplierPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countOrPercentage = match[1];
        const locationText = match[2] || match[1];

        const countries = this.extractCountries(locationText);
        const regions = this.extractRegions(locationText);

        for (const country of countries) {
          suppliers.push({
            country: country,
            region: this.getRegionForCountry(country),
            supplierCount: countOrPercentage && !countOrPercentage.includes('.') ? parseInt(countOrPercentage) : 1,
            spendPercentage: countOrPercentage && countOrPercentage.includes('.') ? parseFloat(countOrPercentage) : undefined,
            supplierType: 'other',
            confidence: this.calculateConfidence(extractedText, ['supplier', 'vendor', 'supply chain']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }

        for (const region of regions) {
          suppliers.push({
            country: 'Multiple',
            region: region,
            supplierCount: countOrPercentage && !countOrPercentage.includes('.') ? parseInt(countOrPercentage) : 1,
            spendPercentage: countOrPercentage && countOrPercentage.includes('.') ? parseFloat(countOrPercentage) : undefined,
            supplierType: 'other',
            confidence: this.calculateConfidence(extractedText, ['supplier', 'vendor', 'supply chain']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }
      }
    }

    return this.deduplicateSuppliers(suppliers);
  }

  /**
   * Extract R&D centers from text
   */
  private extractRDCenters(text: string, source: SustainabilityReportSource): GeographicRD[] {
    const rdCenters: GeographicRD[] = [];
    
    const rdPatterns = [
      /(\d+)\s+(?:R&D|research|development|innovation)\s+(?:center|centers|facility|facilities|lab|laboratories)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(?:R&D|research|development|innovation)\s+(?:center|centers|facility|facilities|lab|laboratories)\s+(?:in|across|throughout)\s+([^.]+)/gi
    ];

    for (const pattern of rdPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countStr = match[1];
        const locationText = match[2] || match[1];

        const countries = this.extractCountries(locationText);
        const regions = this.extractRegions(locationText);

        for (const country of countries) {
          rdCenters.push({
            country: country,
            region: this.getRegionForCountry(country),
            centerCount: countStr ? parseInt(countStr) : 1,
            focusAreas: this.extractFocusAreas(extractedText),
            confidence: this.calculateConfidence(extractedText, ['R&D', 'research', 'development', 'innovation']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }

        for (const region of regions) {
          rdCenters.push({
            country: 'Multiple',
            region: region,
            centerCount: countStr ? parseInt(countStr) : 1,
            focusAreas: this.extractFocusAreas(extractedText),
            confidence: this.calculateConfidence(extractedText, ['R&D', 'research', 'development', 'innovation']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }
      }
    }

    return this.deduplicateRD(rdCenters);
  }

  /**
   * Extract sales offices from text
   */
  private extractSalesOffices(text: string, source: SustainabilityReportSource): GeographicSales[] {
    const salesOffices: GeographicSales[] = [];
    
    const salesPatterns = [
      /(\d+)\s+(?:sales|commercial|regional)\s+(?:office|offices)\s+(?:in|across|throughout)\s+([^.]+)/gi,
      /(?:sales|commercial|regional)\s+(?:office|offices)\s+(?:in|across|throughout)\s+([^.]+)/gi
    ];

    for (const pattern of salesPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedText = match[0];
        const countStr = match[1];
        const locationText = match[2] || match[1];

        const countries = this.extractCountries(locationText);
        const regions = this.extractRegions(locationText);

        for (const country of countries) {
          salesOffices.push({
            country: country,
            region: this.getRegionForCountry(country),
            officeCount: countStr ? parseInt(countStr) : 1,
            confidence: this.calculateConfidence(extractedText, ['sales', 'commercial', 'office']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }

        for (const region of regions) {
          salesOffices.push({
            country: 'Multiple',
            region: region,
            officeCount: countStr ? parseInt(countStr) : 1,
            confidence: this.calculateConfidence(extractedText, ['sales', 'commercial', 'office']),
            source: `${source.reportType} ${source.reportYear}`,
            extractedText: extractedText
          });
        }
      }
    }

    return this.deduplicateSales(salesOffices);
  }

  /**
   * Extract countries from text
   */
  private extractCountries(text: string): string[] {
    const matches = text.match(this.GEOGRAPHIC_PATTERNS.countries) || [];
    return [...new Set(matches.map(match => this.normalizeCountryName(match)))];
  }

  /**
   * Extract regions from text
   */
  private extractRegions(text: string): string[] {
    const matches = text.match(this.GEOGRAPHIC_PATTERNS.regions) || [];
    return [...new Set(matches.map(match => this.normalizeRegionName(match)))];
  }

  /**
   * Normalize country names
   */
  private normalizeCountryName(country: string): string {
    const normalizations: Record<string, string> = {
      'USA': 'United States',
      'US': 'United States',
      'UK': 'United Kingdom',
      'UAE': 'United Arab Emirates'
    };
    
    return normalizations[country] || country;
  }

  /**
   * Normalize region names
   */
  private normalizeRegionName(region: string): string {
    const normalizations: Record<string, string> = {
      'APAC': 'Asia Pacific',
      'EMEA': 'Europe, Middle East and Africa',
      'LATAM': 'Latin America',
      'EU': 'Europe'
    };
    
    return normalizations[region] || region;
  }

  /**
   * Get region for country
   */
  private getRegionForCountry(country: string): string {
    const countryToRegion: Record<string, string> = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'China': 'Asia Pacific',
      'Japan': 'Asia Pacific',
      'South Korea': 'Asia Pacific',
      'India': 'Asia Pacific',
      'Australia': 'Asia Pacific',
      'Germany': 'Europe',
      'United Kingdom': 'Europe',
      'France': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'Netherlands': 'Europe',
      'Switzerland': 'Europe',
      'Brazil': 'Latin America',
      'Argentina': 'Latin America',
      'Chile': 'Latin America',
      'Colombia': 'Latin America'
    };
    
    return countryToRegion[country] || 'Other';
  }

  /**
   * Determine facility type from text
   */
  private determineFacilityType(text: string): GeographicFacility['facilityType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('headquarters') || lowerText.includes('hq')) return 'headquarters';
    if (lowerText.includes('warehouse') || lowerText.includes('distribution')) return 'warehouse';
    if (lowerText.includes('datacenter') || lowerText.includes('data center')) return 'datacenter';
    if (lowerText.includes('retail') || lowerText.includes('store')) return 'retail';
    if (lowerText.includes('office')) return 'office';
    
    return 'other';
  }

  /**
   * Extract product types from text
   */
  private extractProductTypes(text: string): string[] {
    const productPatterns = [
      /(?:produce|manufacturing|assembly)\s+([^.]+)/gi,
      /([^.]+?)\s+(?:production|manufacturing)/gi
    ];
    
    const products: string[] = [];
    for (const pattern of productPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const product = match[1].trim();
        if (product.length > 3 && product.length < 50) {
          products.push(product);
        }
      }
    }
    
    return [...new Set(products)];
  }

  /**
   * Extract focus areas from text
   */
  private extractFocusAreas(text: string): string[] {
    const focusPatterns = [
      /(?:focus|research|development)\s+(?:on|in|areas?):\s*([^.]+)/gi,
      /([^.]+?)\s+(?:research|development|innovation)/gi
    ];
    
    const areas: string[] = [];
    for (const pattern of focusPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const area = match[1].trim();
        if (area.length > 3 && area.length < 50) {
          areas.push(area);
        }
      }
    }
    
    return [...new Set(areas)];
  }

  /**
   * Calculate confidence score based on text quality and keywords
   */
  private calculateConfidence(text: string, keywords: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for specific keywords
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        confidence += 0.1;
      }
    }
    
    // Increase confidence for numbers
    if (/\d+/.test(text)) {
      confidence += 0.1;
    }
    
    // Increase confidence for specific geographic references
    if (this.GEOGRAPHIC_PATTERNS.countries.test(text)) {
      confidence += 0.15;
    }
    
    // Decrease confidence for vague language
    if (/(?:approximately|around|about|roughly)/i.test(text)) {
      confidence -= 0.05;
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Deduplication methods
   */
  private deduplicateFacilities(facilities: GeographicFacility[]): GeographicFacility[] {
    const seen = new Set<string>();
    return facilities.filter(facility => {
      const key = `${facility.country}-${facility.facilityType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateEmployees(employees: GeographicEmployee[]): GeographicEmployee[] {
    const seen = new Set<string>();
    return employees.filter(employee => {
      const key = `${employee.country}-${employee.employeeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateManufacturing(manufacturing: GeographicManufacturing[]): GeographicManufacturing[] {
    const seen = new Set<string>();
    return manufacturing.filter(mfg => {
      const key = `${mfg.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateSuppliers(suppliers: GeographicSupplier[]): GeographicSupplier[] {
    const seen = new Set<string>();
    return suppliers.filter(supplier => {
      const key = `${supplier.country}-${supplier.supplierType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateRD(rdCenters: GeographicRD[]): GeographicRD[] {
    const seen = new Set<string>();
    return rdCenters.filter(rd => {
      const key = `${rd.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateSales(salesOffices: GeographicSales[]): GeographicSales[] {
    const seen = new Set<string>();
    return salesOffices.filter(sales => {
      const key = `${sales.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}