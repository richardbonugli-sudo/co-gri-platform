/**
 * Data Quality Checker for Company Geographic Exposures
 * 
 * This tool validates and updates geographic exposure data for companies
 * by checking data freshness, validating country names, and identifying anomalies.
 */

export interface DataQualityReport {
  companyTicker: string;
  companyName: string;
  lastUpdated: string;
  dataAge: number; // days since last update
  issues: DataQualityIssue[];
  score: number; // 0-100 quality score
  recommendations: string[];
}

export interface DataQualityIssue {
  type: 'STALE_DATA' | 'INVALID_COUNTRY' | 'MISSING_PERCENTAGE' | 'PERCENTAGE_MISMATCH' | 'SUSPICIOUS_SEGMENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  field: string;
  value?: string;
}

export interface UpdateResult {
  ticker: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  updatedFields: string[];
  errors: string[];
  newDataSource?: string;
}

export class DataQualityChecker {
  private validCountries: Set<string>;
  private suspiciousPatterns: RegExp[];

  constructor() {
    // Initialize with known country names and common variations
    this.validCountries = new Set([
      'United States', 'USA', 'US', 'China', 'Japan', 'Germany', 'United Kingdom', 'UK',
      'France', 'Italy', 'Spain', 'Canada', 'Australia', 'Brazil', 'India', 'South Korea',
      'Netherlands', 'Switzerland', 'Singapore', 'Hong Kong', 'Taiwan', 'Mexico',
      'Argentina', 'Chile', 'Colombia', 'Peru', 'Indonesia', 'Thailand', 'Malaysia',
      'Philippines', 'Vietnam', 'South Africa', 'United Arab Emirates', 'Saudi Arabia',
      'Israel', 'Turkey', 'Egypt', 'Russia', 'Norway', 'Sweden', 'Denmark', 'Belgium',
      'Austria', 'Ireland', 'Finland', 'Poland', 'Czech Republic', 'Hungary',
      'New Zealand', 'Portugal', 'Greece', 'Romania', 'Bulgaria', 'Croatia'
    ]);

    // Patterns that indicate non-geographic segments
    this.suspiciousPatterns = [
      /^Note \d+/i,                    // "Note 16: Employee Benefit Plans"
      /^\(/,                           // "(in millions)"
      /revenue/i,                      // "Revenues, excluding hedging effect"
      /segment/i,                      // "Reportable segment net sales"
      /elimination/i,                  // "Eliminations"
      /depreciation/i,                 // "Depreciation and amortization"
      /^Item \d+/i,                   // "Item 7A. Quantitative..."
      /report of/i,                    // "Report of Independent..."
      /years? ended/i,                 // "Years ended December 31"
      /^\d+$/,                        // Pure numbers like "113", "110"
      /^\d+\.\d+$/,                   // Decimal numbers like "10.15"
      /^\*\d+/,                       // Asterisk numbers like "*31.1.1"
      /management/i,                   // "Management's Report..."
      /^[A-Z]{2,5}$/,                 // Acronyms like "APJC", "EMEA", "LATAM"
      /effective tax rate/i,           // Tax-related items
      /acquisition/i,                  // "Acquisitions and Divestitures"
      /goodwill/i,                    // "Goodwill and Intangible Assets"
      /debt/i,                        // "Long-Term Debt"
      /equity/i,                      // "Shareholders' Equity"
      /earnings/i,                    // "Earnings Per Share"
      /cash flow/i,                   // "Cash Flow Information"
      /balance sheet/i,               // "Balance Sheet"
      /pension/i,                     // "Pension and Postretirement"
      /derivative/i,                  // "Derivative Instruments"
      /fair value/i,                  // "Fair Value Measurements"
      /lease/i,                       // "Leases"
      /contingenc/i,                  // "Contingencies"
      /commitment/i,                  // "Commitments"
      /restructur/i,                  // "Restructuring"
      /^(commercial|industrial|residential|transportation)$/i, // Business segments
      /^(equipment|apparel|systems)$/i, // Product categories
    ];
  }

  /**
   * Run comprehensive data quality check on all companies
   */
  async runFullQualityCheck(): Promise<DataQualityReport[]> {
    const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = await import('../data/companySpecificExposures');
    const companies = getCompaniesWithSpecificExposures();
    const reports: DataQualityReport[] = [];

    for (const ticker of companies) {
      const exposure = getCompanySpecificExposure(ticker);
      if (exposure) {
        const report = this.checkCompanyDataQuality(exposure);
        reports.push(report);
      }
    }

    return reports.sort((a, b) => a.score - b.score); // Worst quality first
  }

  /**
   * Check data quality for a single company
   */
  checkCompanyDataQuality(exposure: any): DataQualityReport {
    const issues: DataQualityIssue[] = [];
    const recommendations: string[] = [];

    // Check data freshness
    const dataAge = this.calculateDataAge(exposure.lastUpdated);
    if (dataAge > 365) {
      issues.push({
        type: 'STALE_DATA',
        severity: 'HIGH',
        description: `Data is ${dataAge} days old, exceeds 12-month threshold`,
        field: 'lastUpdated',
        value: exposure.lastUpdated
      });
      recommendations.push('Update with latest annual report or 10-K filing');
    } else if (dataAge > 180) {
      issues.push({
        type: 'STALE_DATA',
        severity: 'MEDIUM',
        description: `Data is ${dataAge} days old, approaching staleness threshold`,
        field: 'lastUpdated',
        value: exposure.lastUpdated
      });
      recommendations.push('Consider updating with latest quarterly filing');
    }

    // Validate country names and identify suspicious segments
    let totalPercentage = 0;
    let validCountryCount = 0;
    let suspiciousSegmentCount = 0;

    for (const exp of exposure.exposures) {
      // Check if country name is valid
      if (!this.isValidCountry(exp.country)) {
        const isSuspicious = this.isSuspiciousSegment(exp.country);
        
        if (isSuspicious) {
          issues.push({
            type: 'SUSPICIOUS_SEGMENT',
            severity: 'HIGH',
            description: `"${exp.country}" appears to be a financial segment, not a geographic region`,
            field: 'exposures.country',
            value: exp.country
          });
          suspiciousSegmentCount++;
        } else {
          issues.push({
            type: 'INVALID_COUNTRY',
            severity: 'MEDIUM',
            description: `"${exp.country}" is not a recognized country name`,
            field: 'exposures.country',
            value: exp.country
          });
        }
      } else {
        validCountryCount++;
      }

      // Check percentage validity
      if (exp.percentage == null || exp.percentage < 0 || exp.percentage > 100) {
        issues.push({
          type: 'MISSING_PERCENTAGE',
          severity: 'HIGH',
          description: `Invalid percentage value: ${exp.percentage}`,
          field: 'exposures.percentage',
          value: String(exp.percentage)
        });
      } else {
        totalPercentage += exp.percentage;
      }
    }

    // Check if percentages add up reasonably (allowing for rounding and "Other" categories)
    if (totalPercentage > 110) {
      issues.push({
        type: 'PERCENTAGE_MISMATCH',
        severity: 'MEDIUM',
        description: `Total percentages sum to ${totalPercentage.toFixed(1)}%, exceeds 100%`,
        field: 'exposures.percentage'
      });
    }

    // Generate recommendations based on issues found
    if (suspiciousSegmentCount > validCountryCount) {
      recommendations.push('Data appears to contain mostly non-geographic segments - requires manual review and cleaning');
    }
    if (suspiciousSegmentCount > 0) {
      recommendations.push('Filter out financial statement line items and business segments from geographic data');
    }
    if (validCountryCount === 0) {
      recommendations.push('No valid countries detected - data may need complete re-extraction');
    }

    // Calculate quality score (0-100)
    let score = 100;
    score -= issues.filter(i => i.severity === 'HIGH').length * 20;
    score -= issues.filter(i => i.severity === 'MEDIUM').length * 10;
    score -= issues.filter(i => i.severity === 'LOW').length * 5;
    score = Math.max(0, score);

    return {
      companyTicker: exposure.ticker,
      companyName: exposure.companyName,
      lastUpdated: exposure.lastUpdated,
      dataAge,
      issues,
      score,
      recommendations
    };
  }

  /**
   * Attempt to update company data from latest filings
   */
  async updateCompanyData(ticker: string): Promise<UpdateResult> {
    // This would integrate with SEC EDGAR API or other data sources
    // For now, return a mock implementation
    return {
      ticker,
      status: 'FAILED',
      updatedFields: [],
      errors: ['Automatic update not yet implemented - requires SEC EDGAR API integration']
    };
  }

  /**
   * Generate summary statistics for the entire dataset
   */
  generateQualitySummary(reports: DataQualityReport[]) {
    const totalCompanies = reports.length;
    const highQuality = reports.filter(r => r.score >= 80).length;
    const mediumQuality = reports.filter(r => r.score >= 60 && r.score < 80).length;
    const lowQuality = reports.filter(r => r.score < 60).length;
    
    const staleData = reports.filter(r => r.dataAge > 180).length;
    const suspiciousData = reports.filter(r => 
      r.issues.some(i => i.type === 'SUSPICIOUS_SEGMENT')
    ).length;

    const avgScore = reports.reduce((sum, r) => sum + r.score, 0) / totalCompanies;
    const avgAge = reports.reduce((sum, r) => sum + r.dataAge, 0) / totalCompanies;

    return {
      totalCompanies,
      qualityDistribution: {
        high: highQuality,
        medium: mediumQuality,
        low: lowQuality
      },
      avgScore: Math.round(avgScore),
      avgAge: Math.round(avgAge),
      staleDataCount: staleData,
      suspiciousDataCount: suspiciousData,
      recommendedActions: [
        staleData > 0 ? `Update ${staleData} companies with stale data` : null,
        suspiciousData > 0 ? `Clean ${suspiciousData} companies with suspicious segments` : null,
        lowQuality > 0 ? `Review ${lowQuality} companies with low quality scores` : null
      ].filter(Boolean)
    };
  }

  private calculateDataAge(lastUpdated: string): number {
    const updateDate = new Date(lastUpdated);
    const now = new Date();
    return Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isValidCountry(countryName: string): boolean {
    // Normalize the country name
    const normalized = countryName.trim();
    
    // Check exact matches
    if (this.validCountries.has(normalized)) {
      return true;
    }

    // Check common variations
    const variations: Record<string, string[]> = {
      'United States': ['US', 'USA', 'U.S.', 'United States of America'],
      'United Kingdom': ['UK', 'U.K.', 'Britain', 'Great Britain'],
      'China': ['China (including Hong Kong)', 'People\'s Republic of China', 'PRC'],
      'South Korea': ['Korea', 'Republic of Korea'],
      'Hong Kong': ['Hong Kong SAR', 'HK'],
      'Taiwan': ['Republic of China', 'Chinese Taipei'],
    };

    for (const [standard, alts] of Object.entries(variations)) {
      if (alts.some(alt => alt.toLowerCase() === normalized.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private isSuspiciousSegment(segmentName: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(segmentName));
  }
}