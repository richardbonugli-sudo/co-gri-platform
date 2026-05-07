/**
 * Data Quality Validation Service
 * 
 * Validates and scores data quality for geographic exposure calculations
 * Ensures data consistency, completeness, and reliability
 */

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  warnings: string[];
  dataQuality: 'high' | 'medium' | 'low';
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

interface ChannelValidation {
  channel: string;
  hasData: boolean;
  dataSource: string;
  dataAge: number; // days
  completeness: number; // 0-1
  consistency: number; // 0-1
  quality: 'high' | 'medium' | 'low';
}

interface GeographicSegment {
  country: string;
  revenuePercentage: number;
  operationalPresence: boolean;
  lastUpdated?: string;
}

interface ChannelBreakdown {
  [country: string]: {
    revenue?: { weight: number; state: string; status: string; source: string };
    operations?: { weight: number; state: string; status: string; source: string };
    supply?: { weight: number; state: string; status: string; source: string };
    assets?: { weight: number; state: string; status: string; source: string };
    market?: { weight: number; state: string; status: string; source: string };
    blended: number;
  };
}

interface ChannelDataPoint {
  country: string;
  weight?: number;
  value?: number;
  source?: string;
  dataSource?: string;
  lastUpdated?: string;
}

export class DataQualityValidator {
  /**
   * Validate geographic exposure data
   */
  validateGeographicExposure(
    segments: GeographicSegment[],
    channelBreakdown: ChannelBreakdown | undefined,
    homeCountry: string
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Rule 1: Segments should sum to approximately 100%
    const totalPercentage = segments.reduce((sum, s) => sum + s.revenuePercentage, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      issues.push({
        severity: 'error',
        field: 'segments',
        message: `Segments sum to ${totalPercentage.toFixed(2)}%, expected 100%`,
        suggestion: 'Normalize segment percentages'
      });
      score -= 20;
    }

    // Rule 2: Home country should have positive exposure
    const homeSegment = segments.find(s => s.country === homeCountry);
    if (!homeSegment || homeSegment.revenuePercentage <= 0) {
      issues.push({
        severity: 'warning',
        field: 'homeCountry',
        message: `Home country ${homeCountry} has no revenue exposure`,
        suggestion: 'Verify home country is correct'
      });
      warnings.push(`Home country ${homeCountry} has no revenue exposure`);
      score -= 10;
    }

    // Rule 3: Check for negative values
    for (const segment of segments) {
      if (segment.revenuePercentage < 0) {
        issues.push({
          severity: 'error',
          field: `segment.${segment.country}`,
          message: `Negative revenue percentage: ${segment.revenuePercentage}%`,
          suggestion: 'Remove or correct negative values'
        });
        score -= 15;
      }
    }

    // Rule 4: Validate channel breakdown consistency
    if (channelBreakdown) {
      const channelValidation = this.validateChannelBreakdown(channelBreakdown);
      score -= (100 - channelValidation.score) * 0.3; // Channels contribute 30% to overall score
      issues.push(...channelValidation.issues);
      warnings.push(...channelValidation.warnings);
    }

    // Rule 5: Check for data staleness
    const dataAge = this.checkDataFreshness(segments);
    if (dataAge > 365) {
      warnings.push(`Data is ${dataAge} days old, consider updating`);
      score -= 5;
    }

    // Rule 6: Validate operational presence consistency
    for (const segment of segments) {
      if (segment.revenuePercentage > 5 && !segment.operationalPresence) {
        warnings.push(
          `${segment.country} has ${segment.revenuePercentage.toFixed(1)}% revenue but no operational presence`
        );
      }
    }

    // Determine overall data quality
    const dataQuality = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score: Math.max(0, Math.min(100, score)),
      issues,
      warnings,
      dataQuality
    };
  }

  /**
   * Validate channel breakdown data
   */
  private validateChannelBreakdown(channelBreakdown: ChannelBreakdown): {
    score: number;
    issues: ValidationIssue[];
    warnings: string[];
  } {
    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];
    let score = 100;

    const countries = Object.keys(channelBreakdown);
    
    for (const country of countries) {
      const channels = channelBreakdown[country];
      
      // Check for missing channels
      const requiredChannels = ['revenue', 'operations', 'supply', 'assets', 'market'];
      for (const channel of requiredChannels) {
        if (!channels[channel as keyof typeof channels]) {
          issues.push({
            severity: 'warning',
            field: `channelBreakdown.${country}.${channel}`,
            message: `Missing ${channel} channel data for ${country}`,
            suggestion: 'Add fallback data for missing channel'
          });
          score -= 2;
        }
      }

      // Check for negative weights
      for (const channel of requiredChannels) {
        const channelData = channels[channel as keyof typeof channels];
        if (channelData && typeof channelData === 'object' && 'weight' in channelData && channelData.weight < 0) {
          issues.push({
            severity: 'error',
            field: `channelBreakdown.${country}.${channel}`,
            message: `Negative weight for ${channel} channel: ${channelData.weight}`,
            suggestion: 'Correct negative weight value'
          });
          score -= 10;
        }
      }

      // Check for unknown state with high weight
      for (const channel of requiredChannels) {
        const channelData = channels[channel as keyof typeof channels];
        if (
          channelData &&
          typeof channelData === 'object' &&
          'state' in channelData &&
          'weight' in channelData &&
          channelData.state === 'unknown' &&
          channelData.weight > 0.1
        ) {
          warnings.push(
            `${country} ${channel} channel has unknown state but high weight (${(channelData.weight * 100).toFixed(1)}%)`
          );
        }
      }

      // Validate blended weight is reasonable
      if (channels.blended < 0 || channels.blended > 1) {
        issues.push({
          severity: 'error',
          field: `channelBreakdown.${country}.blended`,
          message: `Blended weight out of range: ${channels.blended}`,
          suggestion: 'Blended weight should be between 0 and 1'
        });
        score -= 15;
      }
    }

    return { score: Math.max(0, score), issues, warnings };
  }

  /**
   * Check data freshness
   */
  private checkDataFreshness(segments: GeographicSegment[]): number {
    // Look for lastUpdated field in segments
    const dates = segments
      .map(s => s.lastUpdated)
      .filter(d => d)
      .map(d => new Date(d as string));

    if (dates.length === 0) {
      return 0; // No date information
    }

    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

    return ageInDays;
  }

  /**
   * Validate individual channel data
   */
  validateChannelData(
    channelName: string,
    data: ChannelDataPoint[],
    expectedCountries?: string[]
  ): ChannelValidation {
    const hasData = data && data.length > 0;
    
    if (!hasData) {
      return {
        channel: channelName,
        hasData: false,
        dataSource: 'None',
        dataAge: 0,
        completeness: 0,
        consistency: 0,
        quality: 'low'
      };
    }

    // Calculate completeness
    let completeness = 1.0;
    if (expectedCountries) {
      const coveredCountries = new Set(data.map(d => d.country));
      const missingCount = expectedCountries.filter(c => !coveredCountries.has(c)).length;
      completeness = 1 - (missingCount / expectedCountries.length);
    }

    // Calculate consistency (check for outliers)
    const weights = data.map(d => d.weight || d.value || 0);
    const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    const stdDev = Math.sqrt(
      weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length
    );
    const outliers = weights.filter(w => Math.abs(w - mean) > 3 * stdDev).length;
    const consistency = 1 - (outliers / weights.length);

    // Determine data source
    const dataSources = [...new Set(data.map(d => d.source || d.dataSource).filter(s => s))];
    const dataSource = dataSources.join(', ') || 'Unknown';

    // Calculate data age
    const dates = data.map(d => d.lastUpdated).filter(d => d).map(d => new Date(d as string));
    const dataAge = dates.length > 0
      ? Math.floor((Date.now() - Math.min(...dates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24))
      : 0;

    // Determine quality
    let quality: 'high' | 'medium' | 'low';
    if (completeness >= 0.8 && consistency >= 0.8 && dataAge < 180) {
      quality = 'high';
    } else if (completeness >= 0.5 && consistency >= 0.6 && dataAge < 365) {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return {
      channel: channelName,
      hasData,
      dataSource,
      dataAge,
      completeness,
      consistency,
      quality
    };
  }

  /**
   * Cross-validate data from multiple sources
   */
  crossValidate(
    source1Data: ChannelDataPoint[],
    source2Data: ChannelDataPoint[],
    tolerance: number = 0.1
  ): {
    agreement: number; // 0-1
    conflicts: Array<{ country: string; source1Value: number; source2Value: number; difference: number }>;
  } {
    const conflicts: Array<{ country: string; source1Value: number; source2Value: number; difference: number }> = [];
    
    // Build maps for easy lookup
    const source1Map = new Map(source1Data.map(d => [d.country, d.weight || d.value || 0]));
    const source2Map = new Map(source2Data.map(d => [d.country, d.weight || d.value || 0]));

    // Get all countries
    const allCountries = new Set([...source1Map.keys(), ...source2Map.keys()]);

    let agreementCount = 0;
    let totalCount = 0;

    for (const country of allCountries) {
      const value1 = source1Map.get(country) || 0;
      const value2 = source2Map.get(country) || 0;
      
      const difference = Math.abs(value1 - value2);
      const maxValue = Math.max(value1, value2);
      
      totalCount++;
      
      if (maxValue === 0 || difference / maxValue <= tolerance) {
        agreementCount++;
      } else {
        conflicts.push({
          country,
          source1Value: value1,
          source2Value: value2,
          difference
        });
      }
    }

    const agreement = totalCount > 0 ? agreementCount / totalCount : 0;

    return { agreement, conflicts };
  }

  /**
   * Generate data quality report
   */
  generateQualityReport(validationResult: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Data Quality Report ===');
    lines.push(`Overall Score: ${validationResult.score.toFixed(1)}/100`);
    lines.push(`Data Quality: ${validationResult.dataQuality.toUpperCase()}`);
    lines.push(`Valid: ${validationResult.isValid ? 'YES' : 'NO'}`);
    lines.push('');

    if (validationResult.issues.length > 0) {
      lines.push('Issues:');
      for (const issue of validationResult.issues) {
        lines.push(`  [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (validationResult.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warning of validationResult.warnings) {
        lines.push(`  • ${warning}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const dataQualityValidator = new DataQualityValidator();