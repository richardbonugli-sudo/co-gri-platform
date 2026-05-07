/**
 * Facility Locator Scraper
 * 
 * Specialized scraper for extracting facility location data from company websites
 * including offices, manufacturing plants, R&D centers, and retail locations.
 */

import { WebScrapingUtils, ScrapingResult } from '../utils/webScrapingUtils';
import { GeographicNormalizer, NormalizedLocation } from '../utils/geographicNormalizer';

export interface FacilityLocation {
  name: string;
  type: 'headquarters' | 'office' | 'manufacturing' | 'rd' | 'warehouse' | 'retail' | 'datacenter' | 'other';
  address: string;
  city: string;
  state?: string;
  country: string;
  normalizedLocation: NormalizedLocation;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  employeeCount?: number;
  description?: string;
  openingDate?: Date;
  website?: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface FacilityScrapingResult {
  ticker: string;
  companyName: string;
  facilities: FacilityLocation[];
  scrapingTimestamp: Date;
  sourcesScraped: string[];
  totalFacilities: number;
  facilitiesByType: Record<string, number>;
  facilitiesByCountry: Record<string, number>;
  confidence: number;
}

export class FacilityLocatorScraper {
  private scraper: WebScrapingUtils;
  private normalizer: GeographicNormalizer;

  constructor() {
    this.scraper = new WebScrapingUtils({
      rateLimit: 3000, // 3 seconds between requests for facility pages
      timeout: 45000, // 45 seconds timeout for facility pages
      respectRobotsTxt: true
    });
    this.normalizer = new GeographicNormalizer();
  }

  /**
   * Scrape facility locations for a company
   */
  async scrapeFacilities(ticker: string, companyName: string, baseUrl: string): Promise<FacilityScrapingResult> {
    console.log(`🏢 Scraping facility locations for ${ticker} from ${baseUrl}`);
    
    const startTime = Date.now();
    const facilities: FacilityLocation[] = [];
    const sourcesScraped: string[] = [];

    try {
      // Discover facility-related pages
      const facilityUrls = await this.discoverFacilityPages(baseUrl);
      console.log(`📍 Found ${facilityUrls.length} potential facility pages for ${ticker}`);

      // Scrape each facility page
      for (const url of facilityUrls) {
        try {
          const result = await this.scraper.scrapeUrl(url);
          sourcesScraped.push(url);
          
          const extractedFacilities = await this.extractFacilitiesFromPage(result, ticker, companyName);
          facilities.push(...extractedFacilities);
          
          console.log(`✅ Extracted ${extractedFacilities.length} facilities from ${url}`);
          
        } catch (error) {
          console.warn(`⚠️ Failed to scrape facility page ${url}:`, error);
        }
      }

      // Deduplicate and normalize facilities
      const uniqueFacilities = this.deduplicateFacilities(facilities);
      
      // Calculate statistics
      const facilitiesByType = this.calculateFacilitiesByType(uniqueFacilities);
      const facilitiesByCountry = this.calculateFacilitiesByCountry(uniqueFacilities);
      const overallConfidence = this.calculateOverallConfidence(uniqueFacilities);

      const result: FacilityScrapingResult = {
        ticker,
        companyName,
        facilities: uniqueFacilities,
        scrapingTimestamp: new Date(),
        sourcesScraped,
        totalFacilities: uniqueFacilities.length,
        facilitiesByType,
        facilitiesByCountry,
        confidence: overallConfidence
      };

      console.log(`🎉 Facility scraping completed for ${ticker}: ${uniqueFacilities.length} facilities found`);
      console.log(`📊 By type: ${JSON.stringify(facilitiesByType)}`);
      console.log(`🌍 By country: ${JSON.stringify(facilitiesByCountry)}`);

      return result;

    } catch (error) {
      console.error(`❌ Facility scraping failed for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Discover facility-related pages on a company website
   */
  private async discoverFacilityPages(baseUrl: string): Promise<string[]> {
    const facilityUrls = new Set<string>();
    
    try {
      // Common facility page patterns
      const facilityPagePatterns = [
        '/locations',
        '/offices',
        '/facilities',
        '/about/locations',
        '/about/offices',
        '/company/locations',
        '/company/offices',
        '/contact/locations',
        '/contact/offices',
        '/find-us',
        '/where-we-are',
        '/global-presence',
        '/worldwide',
        '/international',
        '/our-locations',
        '/our-offices'
      ];

      // Try common facility page URLs
      for (const pattern of facilityPagePatterns) {
        const candidateUrl = new URL(pattern, baseUrl).href;
        try {
          const response = await fetch(candidateUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            facilityUrls.add(candidateUrl);
            console.log(`✅ Found facility page: ${candidateUrl}`);
          }
        } catch (error) {
          // Page doesn't exist, continue
        }
      }

      // Scrape main page to find facility links
      try {
        const mainPageResult = await this.scraper.scrapeUrl(baseUrl);
        const links = this.scraper.extractLinks(mainPageResult.content, baseUrl);
        
        // Filter for facility-related links
        const facilityKeywords = [
          'location', 'office', 'facility', 'contact', 'about', 'find',
          'where', 'global', 'worldwide', 'international', 'presence'
        ];
        
        for (const link of links) {
          const linkLower = link.toLowerCase();
          if (facilityKeywords.some(keyword => linkLower.includes(keyword))) {
            // Additional filtering to avoid irrelevant pages
            if (!linkLower.includes('career') && 
                !linkLower.includes('job') && 
                !linkLower.includes('news') &&
                !linkLower.includes('blog') &&
                !linkLower.includes('investor')) {
              facilityUrls.add(link);
            }
          }
        }
      } catch (error) {
        console.warn('Could not scrape main page for facility links:', error);
      }

    } catch (error) {
      console.error('Error discovering facility pages:', error);
    }

    return Array.from(facilityUrls).slice(0, 10); // Limit to 10 pages to avoid overloading
  }

  /**
   * Extract facility information from a scraped page
   */
  private async extractFacilitiesFromPage(
    result: ScrapingResult, 
    ticker: string, 
    companyName: string
  ): Promise<FacilityLocation[]> {
    const facilities: FacilityLocation[] = [];
    const content = result.content;

    // Extract structured data first
    const structuredData = this.scraper.extractStructuredData(content);
    for (const data of structuredData) {
      if (data.type === 'json-ld') {
        const facilityFromStructured = this.extractFacilityFromStructuredData(data.data, result.url);
        if (facilityFromStructured) {
          facilities.push(facilityFromStructured);
        }
      }
    }

    // Extract from common HTML patterns
    const htmlFacilities = this.extractFacilitiesFromHTML(content, result.url);
    facilities.push(...htmlFacilities);

    // Normalize all facilities
    for (const facility of facilities) {
      const normalized = this.normalizer.normalize(facility.country);
      if (normalized) {
        facility.normalizedLocation = normalized;
        facility.confidence = Math.min(facility.confidence, normalized.confidence);
      }
    }

    return facilities;
  }

  /**
   * Extract facility from structured data (JSON-LD)
   */
  private extractFacilityFromStructuredData(data: any, sourceUrl: string): FacilityLocation | null {
    try {
      // Handle Organization schema
      if (data['@type'] === 'Organization' && data.address) {
        const address = data.address;
        return {
          name: data.name || 'Corporate Office',
          type: 'headquarters',
          address: this.formatAddress(address),
          city: address.addressLocality || '',
          state: address.addressRegion || '',
          country: address.addressCountry || '',
          normalizedLocation: null as any, // Will be set later
          description: data.description,
          website: data.url,
          confidence: 0.90,
          source: sourceUrl,
          extractedText: JSON.stringify(data)
        };
      }

      // Handle LocalBusiness schema
      if (data['@type'] === 'LocalBusiness' && data.address) {
        const address = data.address;
        return {
          name: data.name || 'Local Office',
          type: this.determineFacilityType(data.name || ''),
          address: this.formatAddress(address),
          city: address.addressLocality || '',
          state: address.addressRegion || '',
          country: address.addressCountry || '',
          normalizedLocation: null as any,
          coordinates: data.geo ? {
            latitude: parseFloat(data.geo.latitude),
            longitude: parseFloat(data.geo.longitude)
          } : undefined,
          description: data.description,
          website: data.url,
          confidence: 0.85,
          source: sourceUrl,
          extractedText: JSON.stringify(data)
        };
      }

    } catch (error) {
      console.warn('Error extracting facility from structured data:', error);
    }

    return null;
  }

  /**
   * Extract facilities from HTML content using patterns
   */
  private extractFacilitiesFromHTML(content: string, sourceUrl: string): FacilityLocation[] {
    const facilities: FacilityLocation[] = [];

    // Pattern 1: Address blocks with common class names
    const addressPatterns = [
      /<div[^>]*class="[^"]*(?:address|location|office|facility)[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*(?:contact|branch|site)[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class="[^"]*(?:location|office)[^"]*"[^>]*>(.*?)<\/section>/gis
    ];

    for (const pattern of addressPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const addressBlock = match[1];
        const facility = this.parseAddressBlock(addressBlock, sourceUrl);
        if (facility) {
          facilities.push(facility);
        }
      }
    }

    // Pattern 2: List items with location information
    const listItemPattern = /<li[^>]*>(.*?)<\/li>/gis;
    let match;
    while ((match = listItemPattern.exec(content)) !== null) {
      const listItem = match[1];
      if (this.containsLocationKeywords(listItem)) {
        const facility = this.parseAddressBlock(listItem, sourceUrl);
        if (facility) {
          facilities.push(facility);
        }
      }
    }

    // Pattern 3: Table rows with location data
    const tableRowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
    while ((match = tableRowPattern.exec(content)) !== null) {
      const tableRow = match[1];
      if (this.containsLocationKeywords(tableRow)) {
        const facility = this.parseTableRow(tableRow, sourceUrl);
        if (facility) {
          facilities.push(facility);
        }
      }
    }

    return facilities;
  }

  /**
   * Parse an address block to extract facility information
   */
  private parseAddressBlock(addressBlock: string, sourceUrl: string): FacilityLocation | null {
    try {
      // Clean HTML tags
      const cleanText = addressBlock.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (cleanText.length < 10) return null; // Too short to be a valid address

      // Extract facility name (usually the first line or in a header tag)
      const nameMatch = addressBlock.match(/<(?:h[1-6]|strong|b)[^>]*>(.*?)<\/(?:h[1-6]|strong|b)>/i);
      const facilityName = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : 'Office';

      // Extract addresses using utility method
      const addresses = this.scraper.extractAddresses(cleanText);
      if (addresses.length === 0) {
        // Try to extract country at least
        const geographicRefs = this.normalizer.extractGeographicReferences(cleanText);
        if (geographicRefs.length === 0) return null;
        
        return {
          name: facilityName,
          type: this.determineFacilityType(facilityName),
          address: cleanText,
          city: '',
          country: geographicRefs[0].countryName,
          normalizedLocation: geographicRefs[0],
          confidence: 0.60,
          source: sourceUrl,
          extractedText: cleanText
        };
      }

      // Parse the first address
      const address = addresses[0];
      const addressParts = address.split(',').map(part => part.trim());
      
      let city = '';
      let state = '';
      let country = '';
      
      if (addressParts.length >= 3) {
        city = addressParts[addressParts.length - 3] || '';
        const stateZip = addressParts[addressParts.length - 2] || '';
        state = stateZip.replace(/\s+\d{5}.*$/, '').trim(); // Remove ZIP code
        country = addressParts[addressParts.length - 1] || '';
      }

      // If no country found in address, try to extract from surrounding text
      if (!country) {
        const geographicRefs = this.normalizer.extractGeographicReferences(cleanText);
        if (geographicRefs.length > 0) {
          country = geographicRefs[0].countryName;
        }
      }

      if (!country) return null; // Must have at least a country

      return {
        name: facilityName,
        type: this.determineFacilityType(facilityName),
        address: address,
        city: city,
        state: state,
        country: country,
        normalizedLocation: null as any, // Will be set later
        confidence: 0.75,
        source: sourceUrl,
        extractedText: cleanText
      };

    } catch (error) {
      console.warn('Error parsing address block:', error);
      return null;
    }
  }

  /**
   * Parse a table row to extract facility information
   */
  private parseTableRow(tableRow: string, sourceUrl: string): FacilityLocation | null {
    try {
      // Extract table cells
      const cellPattern = /<td[^>]*>(.*?)<\/td>/gis;
      const cells: string[] = [];
      let match;
      
      while ((match = cellPattern.exec(tableRow)) !== null) {
        const cellContent = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        cells.push(cellContent);
      }

      if (cells.length < 2) return null;

      // Assume first cell is name/location, others contain address info
      const facilityName = cells[0];
      const addressInfo = cells.slice(1).join(', ');

      // Extract geographic references
      const geographicRefs = this.normalizer.extractGeographicReferences(addressInfo);
      if (geographicRefs.length === 0) return null;

      return {
        name: facilityName,
        type: this.determineFacilityType(facilityName),
        address: addressInfo,
        city: '',
        country: geographicRefs[0].countryName,
        normalizedLocation: geographicRefs[0],
        confidence: 0.70,
        source: sourceUrl,
        extractedText: `${facilityName} | ${addressInfo}`
      };

    } catch (error) {
      console.warn('Error parsing table row:', error);
      return null;
    }
  }

  /**
   * Check if text contains location-related keywords
   */
  private containsLocationKeywords(text: string): boolean {
    const locationKeywords = [
      'address', 'location', 'office', 'facility', 'headquarters', 'hq',
      'street', 'avenue', 'road', 'boulevard', 'drive', 'lane',
      'city', 'state', 'country', 'zip', 'postal',
      'phone', 'tel', 'email', 'contact'
    ];

    const lowerText = text.toLowerCase();
    return locationKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Determine facility type based on name and context
   */
  private determineFacilityType(name: string): FacilityLocation['type'] {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('headquarters') || lowerName.includes('hq') || lowerName.includes('corporate')) {
      return 'headquarters';
    }
    if (lowerName.includes('manufacturing') || lowerName.includes('plant') || lowerName.includes('factory')) {
      return 'manufacturing';
    }
    if (lowerName.includes('r&d') || lowerName.includes('research') || lowerName.includes('development') || lowerName.includes('lab')) {
      return 'rd';
    }
    if (lowerName.includes('warehouse') || lowerName.includes('distribution') || lowerName.includes('fulfillment')) {
      return 'warehouse';
    }
    if (lowerName.includes('store') || lowerName.includes('retail') || lowerName.includes('shop')) {
      return 'retail';
    }
    if (lowerName.includes('datacenter') || lowerName.includes('data center') || lowerName.includes('server')) {
      return 'datacenter';
    }
    
    return 'office'; // Default to office
  }

  /**
   * Format address from structured data
   */
  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    
    const parts = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
      address.addressCountry
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Deduplicate facilities based on similarity
   */
  private deduplicateFacilities(facilities: FacilityLocation[]): FacilityLocation[] {
    const unique: FacilityLocation[] = [];
    const seen = new Set<string>();

    for (const facility of facilities) {
      // Create a key based on name, city, and country
      const key = `${facility.name.toLowerCase()}-${facility.city.toLowerCase()}-${facility.country.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(facility);
      } else {
        // If duplicate found, keep the one with higher confidence
        const existingIndex = unique.findIndex(f => 
          f.name.toLowerCase() === facility.name.toLowerCase() &&
          f.city.toLowerCase() === facility.city.toLowerCase() &&
          f.country.toLowerCase() === facility.country.toLowerCase()
        );
        
        if (existingIndex >= 0 && facility.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = facility;
        }
      }
    }

    return unique;
  }

  /**
   * Calculate facilities by type
   */
  private calculateFacilitiesByType(facilities: FacilityLocation[]): Record<string, number> {
    const byType: Record<string, number> = {};
    
    for (const facility of facilities) {
      byType[facility.type] = (byType[facility.type] || 0) + 1;
    }
    
    return byType;
  }

  /**
   * Calculate facilities by country
   */
  private calculateFacilitiesByCountry(facilities: FacilityLocation[]): Record<string, number> {
    const byCountry: Record<string, number> = {};
    
    for (const facility of facilities) {
      const country = facility.normalizedLocation?.countryName || facility.country;
      byCountry[country] = (byCountry[country] || 0) + 1;
    }
    
    return byCountry;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(facilities: FacilityLocation[]): number {
    if (facilities.length === 0) return 0;
    
    const totalConfidence = facilities.reduce((sum, facility) => sum + facility.confidence, 0);
    return totalConfidence / facilities.length;
  }
}