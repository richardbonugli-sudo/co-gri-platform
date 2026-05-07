/**
 * Segment Filter for Geographic Exposure Data
 * 
 * This module identifies and filters out non-geographic segments from company data,
 * such as financial line items, business segments, and accounting notes.
 */

export interface FilterResult {
  originalCount: number;
  filteredCount: number;
  removedSegments: string[];
  confidence: number; // 0-1 confidence in filtering accuracy
}

export interface GeographicSegment {
  country: string;
  percentage: number;
  description?: string;
  isValid: boolean;
  confidence: number;
}

export class SegmentFilter {
  private validCountries: Set<string>;
  private suspiciousPatterns: RegExp[];
  private businessSegmentPatterns: RegExp[];
  private financialPatterns: RegExp[];

  constructor() {
    // Comprehensive list of valid countries and territories
    this.validCountries = new Set([
      // Major Countries
      'United States', 'USA', 'US', 'U.S.', 'United States of America',
      'China', 'People\'s Republic of China', 'PRC', 'China (including Hong Kong)',
      'Japan', 'Germany', 'United Kingdom', 'UK', 'U.K.', 'Britain', 'Great Britain',
      'France', 'Italy', 'Spain', 'Canada', 'Australia', 'Brazil', 'India',
      'South Korea', 'Korea', 'Republic of Korea', 'Netherlands', 'Switzerland',
      'Singapore', 'Hong Kong', 'Hong Kong SAR', 'HK', 'Taiwan', 'Republic of China',
      'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador',
      'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam', 'New Zealand',
      'South Africa', 'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Israel',
      'Turkey', 'Egypt', 'Russia', 'Norway', 'Sweden', 'Denmark', 'Belgium',
      'Austria', 'Ireland', 'Finland', 'Poland', 'Czech Republic', 'Hungary',
      'Portugal', 'Greece', 'Romania', 'Bulgaria', 'Croatia', 'Slovakia',
      'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
      'Cyprus', 'Iceland', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan',
      'Lebanon', 'Morocco', 'Tunisia', 'Algeria', 'Nigeria', 'Kenya', 'Ghana',
      'Ethiopia', 'Tanzania', 'Uganda', 'Zimbabwe', 'Botswana', 'Namibia',
      'Zambia', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles',
      
      // Regional Groupings (Valid)
      'Europe', 'Asia', 'Americas', 'Africa', 'Oceania', 'North America',
      'South America', 'Central America', 'Caribbean', 'Middle East',
      'Southeast Asia', 'East Asia', 'South Asia', 'Central Asia',
      'Eastern Europe', 'Western Europe', 'Northern Europe', 'Southern Europe',
      'Sub-Saharan Africa', 'North Africa', 'West Africa', 'East Africa',
      'Central Africa', 'Southern Africa'
    ]);

    // Patterns for suspicious non-geographic segments
    this.suspiciousPatterns = [
      // Financial Statement Items
      /^Note \d+/i,                    // "Note 16: Employee Benefit Plans"
      /^\(/,                           // "(in millions)"
      /^\$/,                           // "$ in millions"
      /dollars? in/i,                  // "U.S. dollars in millions"
      /^Item \d+/i,                   // "Item 7A. Quantitative..."
      /report of/i,                    // "Report of Independent..."
      /years? ended/i,                 // "Years ended December 31"
      /management/i,                   // "Management's Report..."
      /^\d+$/,                        // Pure numbers like "113", "110"
      /^\d+\.\d+$/,                   // Decimal numbers like "10.15"
      /^\*\d+/,                       // Asterisk numbers like "*31.1.1"
      
      // Financial and Accounting Terms
      /revenue/i, /sales/i, /income/i, /earnings/i, /profit/i,
      /elimination/i, /intersegment/i, /consolidat/i,
      /depreciation/i, /amortization/i, /impairment/i,
      /acquisition/i, /divestiture/i, /disposal/i,
      /goodwill/i, /intangible/i, /asset/i, /liability/i,
      /debt/i, /equity/i, /capital/i, /cash flow/i,
      /balance sheet/i, /pension/i, /derivative/i,
      /fair value/i, /lease/i, /contingenc/i, /commitment/i,
      /restructur/i, /reserve/i, /provision/i,
      /effective tax rate/i, /statutory rate/i,
      /foreign currency/i, /hedging/i, /translation/i,
      
      // Business Function Terms
      /segment/i, /division/i, /unit/i, /group/i,
      /corporate/i, /headquarters/i, /admin/i,
      /unallocated/i, /other/i, /miscellaneous/i,
      /eliminations/i, /adjustments/i, /reconcil/i
    ];

    // Business segment patterns (products/services, not geography)
    this.businessSegmentPatterns = [
      // Product Categories
      /^(commercial|industrial|residential|transportation)$/i,
      /^(equipment|apparel|systems|software|hardware)$/i,
      /^(automotive|aerospace|defense|healthcare|energy)$/i,
      /^(retail|wholesale|manufacturing|services)$/i,
      
      // Specific Business Lines
      /fabric & home care/i, /baby.*feminine.*family care/i,
      /beauty/i, /grooming/i, /health care/i,
      /gum.*candy/i, /chocolate/i, /beverages/i, /cheese.*grocery/i,
      /orthopaedics/i, /medical/i, /trauma.*extremities/i,
      /endoscopy/i, /neurovascular/i, /spinal implants/i,
      /test.*measurement.*electronics/i, /food equipment/i,
      /welding/i, /polymers.*fluids/i,
      /recurring revenues/i, /interconnection/i, /managed infrastructure/i,
      /defense.*propulsion/i, /commercial airplanes/i,
      /wireless service/i, /business service/i,
      /bottling investments/i, /global ventures/i,
      /pet nutrition/i, /specialty therapies/i
    ];

    // Financial statement line items
    this.financialPatterns = [
      /net premiums earned/i, /policy acquisition costs/i,
      /policy benefits/i, /unearned premiums/i,
      /compensation/i, /benefits/i, /purchased transportation/i,
      /remeasurement/i, /foreign currency exchange/i,
      /interest.bearing/i, /signatures/i, /pretax earnings/i,
      /segment allocations/i, /personnel/i, /credit card/i,
      /equipment lease financing/i, /nondiscretionary/i,
      /efficiency/i, /institutional asset management/i,
      /brokerage fees/i, /return on.*assets/i
    ];
  }

  /**
   * Filter out suspicious segments from company exposure data
   */
  filterSuspiciousSegments(exposures: any[]): FilterResult {
    const originalCount = exposures.length;
    const removedSegments: string[] = [];
    
    const validExposures = exposures.filter(exposure => {
      const isValid = this.isValidGeographicSegment(exposure.country);
      if (!isValid) {
        removedSegments.push(exposure.country);
      }
      return isValid;
    });

    const filteredCount = validExposures.length;
    const confidence = this.calculateFilterConfidence(exposures, validExposures);

    return {
      originalCount,
      filteredCount,
      removedSegments,
      confidence
    };
  }

  /**
   * Analyze and classify all segments in exposure data
   */
  analyzeSegments(exposures: any[]): GeographicSegment[] {
    return exposures.map(exposure => {
      const isValid = this.isValidGeographicSegment(exposure.country);
      const confidence = this.calculateSegmentConfidence(exposure.country);
      
      return {
        country: exposure.country,
        percentage: exposure.percentage,
        description: exposure.description,
        isValid,
        confidence
      };
    });
  }

  /**
   * Check if a segment name represents a valid geographic region
   */
  private isValidGeographicSegment(segmentName: string): boolean {
    const normalized = segmentName.trim();
    
    // Check if it's a known valid country/region
    if (this.isKnownCountry(normalized)) {
      return true;
    }
    
    // Check against suspicious patterns
    if (this.matchesPattern(normalized, this.suspiciousPatterns)) {
      return false;
    }
    
    // Check against business segment patterns
    if (this.matchesPattern(normalized, this.businessSegmentPatterns)) {
      return false;
    }
    
    // Check against financial patterns
    if (this.matchesPattern(normalized, this.financialPatterns)) {
      return false;
    }
    
    // If it contains geographic keywords, likely valid
    const geoKeywords = ['region', 'countries', 'international', 'domestic', 'overseas', 'foreign'];
    if (geoKeywords.some(keyword => normalized.toLowerCase().includes(keyword))) {
      return true;
    }
    
    // Default to invalid for unknown segments to be conservative
    return false;
  }

  /**
   * Check if segment name is a known country or region
   */
  private isKnownCountry(segmentName: string): boolean {
    // Direct match
    if (this.validCountries.has(segmentName)) {
      return true;
    }
    
    // Case-insensitive match
    const lowerName = segmentName.toLowerCase();
    for (const country of this.validCountries) {
      if (country.toLowerCase() === lowerName) {
        return true;
      }
    }
    
    // Check for common variations and abbreviations
    const variations: Record<string, string[]> = {
      'United States': ['US', 'USA', 'U.S.', 'America', 'United States of America'],
      'United Kingdom': ['UK', 'U.K.', 'Britain', 'Great Britain', 'England'],
      'China': ['PRC', 'People\'s Republic of China', 'Mainland China'],
      'South Korea': ['Korea', 'Republic of Korea', 'ROK'],
      'Hong Kong': ['HK', 'Hong Kong SAR'],
      'Taiwan': ['Republic of China', 'Chinese Taipei', 'Formosa'],
      'United Arab Emirates': ['UAE', 'Emirates'],
      'Saudi Arabia': ['KSA', 'Kingdom of Saudi Arabia']
    };
    
    for (const [standard, alts] of Object.entries(variations)) {
      if (alts.some(alt => alt.toLowerCase() === lowerName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if segment matches any pattern in the given array
   */
  private matchesPattern(segmentName: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(segmentName));
  }

  /**
   * Calculate confidence score for filtering accuracy
   */
  private calculateFilterConfidence(original: any[], filtered: any[]): number {
    if (original.length === 0) return 1.0;
    
    const removedCount = original.length - filtered.length;
    const removalRate = removedCount / original.length;
    
    // High confidence if we removed obvious non-geographic items
    // Lower confidence if we removed too many or too few items
    if (removalRate >= 0.3 && removalRate <= 0.8) {
      return 0.9; // High confidence in moderate filtering
    } else if (removalRate < 0.1) {
      return 0.7; // Medium confidence - maybe missed some
    } else if (removalRate > 0.9) {
      return 0.5; // Low confidence - maybe over-filtered
    } else {
      return 0.8; // Good confidence for other ranges
    }
  }

  /**
   * Calculate confidence score for individual segment classification
   */
  private calculateSegmentConfidence(segmentName: string): number {
    if (this.isKnownCountry(segmentName)) {
      return 0.95; // Very confident it's geographic
    }
    
    if (this.matchesPattern(segmentName, this.suspiciousPatterns)) {
      return 0.05; // Very confident it's not geographic
    }
    
    if (this.matchesPattern(segmentName, this.businessSegmentPatterns)) {
      return 0.1; // Very confident it's business segment
    }
    
    if (this.matchesPattern(segmentName, this.financialPatterns)) {
      return 0.05; // Very confident it's financial item
    }
    
    // Unknown segments get medium confidence
    return 0.5;
  }

  /**
   * Get statistics about filtering results
   */
  getFilteringStats(results: FilterResult[]): any {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalCount, 0);
    const totalFiltered = results.reduce((sum, r) => sum + r.filteredCount, 0);
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    const allRemovedSegments = results.flatMap(r => r.removedSegments);
    const uniqueRemovedSegments = [...new Set(allRemovedSegments)];
    
    // Categorize removed segments
    const categories = {
      financialItems: uniqueRemovedSegments.filter(s => this.matchesPattern(s, this.financialPatterns)),
      businessSegments: uniqueRemovedSegments.filter(s => this.matchesPattern(s, this.businessSegmentPatterns)),
      accountingNotes: uniqueRemovedSegments.filter(s => /^Note \d+/i.test(s)),
      other: uniqueRemovedSegments.filter(s => 
        !this.matchesPattern(s, this.financialPatterns) &&
        !this.matchesPattern(s, this.businessSegmentPatterns) &&
        !/^Note \d+/i.test(s)
      )
    };
    
    return {
      totalCompanies: results.length,
      totalOriginalSegments: totalOriginal,
      totalFilteredSegments: totalFiltered,
      segmentsRemoved: totalOriginal - totalFiltered,
      removalRate: ((totalOriginal - totalFiltered) / totalOriginal * 100).toFixed(1) + '%',
      avgConfidence: (avgConfidence * 100).toFixed(1) + '%',
      uniqueRemovedSegments: uniqueRemovedSegments.length,
      categorizedRemovals: {
        financialItems: categories.financialItems.length,
        businessSegments: categories.businessSegments.length,
        accountingNotes: categories.accountingNotes.length,
        other: categories.other.length
      },
      topRemovedSegments: this.getTopRemovedSegments(allRemovedSegments)
    };
  }

  /**
   * Get most frequently removed segments
   */
  private getTopRemovedSegments(removedSegments: string[]): Array<{segment: string, count: number}> {
    const counts = removedSegments.reduce((acc, segment) => {
      acc[segment] = (acc[segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([segment, count]) => ({ segment, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}