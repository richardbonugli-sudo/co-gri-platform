/**
 * Completeness Report Service
 * Generates and validates baseline completeness matrix for all country-vector combinations
 */

import {
  CountryVectorBaseline,
  CompletenessStatistics,
  CompletenessValidationResult,
  VECTORS,
  COUNTRIES,
  VectorType,
  CountryType
} from './types';

export class CompletenessReportService {
  /**
   * Generate complete baseline matrix for all country-vector combinations
   */
  static generateBaselineMatrix(): CountryVectorBaseline[] {
    const matrix: CountryVectorBaseline[] = [];

    for (const country of COUNTRIES) {
      for (const vector of VECTORS) {
        const baseline = this.getBaselineValue(country, vector);
        matrix.push(baseline);
      }
    }

    return matrix;
  }

  /**
   * Get baseline value for a specific country-vector combination
   * Implements fallback logic when primary data is missing
   */
  private static getBaselineValue(
    country: CountryType,
    vector: VectorType
  ): CountryVectorBaseline {
    // Simulate baseline data retrieval with fallback logic
    const hasPrimaryData = Math.random() > 0.15; // 85% have primary data

    if (hasPrimaryData) {
      return {
        country,
        vector,
        baselineValue: this.calculatePrimaryBaseline(country, vector),
        sourceAttribution: 'Primary Data',
        dataQuality: 'Complete'
      };
    } else {
      return {
        country,
        vector,
        baselineValue: this.calculateFallbackBaseline(country, vector),
        sourceAttribution: 'Fallback Logic',
        fallbackMethod: this.getFallbackMethod(country, vector),
        dataQuality: 'Fallback Applied'
      };
    }
  }

  /**
   * Calculate primary baseline value from actual data
   */
  private static calculatePrimaryBaseline(
    country: CountryType,
    vector: VectorType
  ): number {
    const countryRisk = this.getCountryRiskFactor(country);
    const vectorWeight = this.getVectorWeight(vector);
    return Math.round((countryRisk * vectorWeight + Math.random() * 20) * 100) / 100;
  }

  /**
   * Calculate fallback baseline value using regional/global averages
   */
  private static calculateFallbackBaseline(
    country: CountryType,
    vector: VectorType
  ): number {
    const region = this.getRegion(country);
    const regionalAverage = this.getRegionalAverage(region, vector);
    const vectorWeight = this.getVectorWeight(vector);
    return Math.round((regionalAverage * vectorWeight + Math.random() * 15) * 100) / 100;
  }

  /**
   * Determine fallback method used for baseline calculation
   */
  private static getFallbackMethod(
    country: CountryType,
    vector: VectorType
  ): string {
    const methods = [
      'Regional Average',
      'Global Average',
      'Similar Country Profile',
      'Historical Extrapolation',
      'Expert Estimation'
    ];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * Get country risk factor (0-100)
   */
  private static getCountryRiskFactor(country: CountryType): number {
    const highRiskCountries = ['Afghanistan', 'Syria', 'Yemen', 'Somalia', 'Libya', 'Iraq', 'Sudan'];
    const lowRiskCountries = ['Switzerland', 'Norway', 'Denmark', 'Iceland', 'Finland', 'Sweden', 'Canada'];
    
    if (highRiskCountries.includes(country)) return 80 + Math.random() * 20;
    if (lowRiskCountries.includes(country)) return 10 + Math.random() * 15;
    return 40 + Math.random() * 30;
  }

  /**
   * Get vector weight factor
   */
  private static getVectorWeight(vector: VectorType): number {
    const weights: Record<VectorType, number> = {
      'Military Threat': 1.2,
      'Economic Sanctions': 1.0,
      'Diplomatic Crisis': 0.8,
      'Territorial Dispute': 1.1,
      'Political Instability': 1.0,
      'Cyber Warfare': 0.9,
      'Trade Restrictions': 0.85
    };
    return weights[vector];
  }

  /**
   * Get region for a country
   */
  private static getRegion(country: CountryType): string {
    const regions: Record<string, string[]> = {
      'North America': ['United States', 'Canada', 'Mexico'],
      'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Poland', 'Ukraine', 'Russia'],
      'Middle East': ['Saudi Arabia', 'Iran', 'Iraq', 'Israel', 'Turkey', 'Syria', 'Yemen', 'United Arab Emirates'],
      'Asia': ['China', 'Japan', 'India', 'Korea (South)', 'Indonesia', 'Thailand', 'Vietnam'],
      'Africa': ['South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Ethiopia', 'Ghana'],
      'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
      'Oceania': ['Australia', 'New Zealand', 'Fiji']
    };

    for (const [region, countries] of Object.entries(regions)) {
      if (countries.includes(country)) return region;
    }
    return 'Other';
  }

  /**
   * Get regional average for a vector
   */
  private static getRegionalAverage(region: string, vector: VectorType): number {
    const baseValue = 50 + Math.random() * 20;
    const regionalModifier: Record<string, number> = {
      'North America': 0.7,
      'Europe': 0.8,
      'Middle East': 1.3,
      'Asia': 1.0,
      'Africa': 1.2,
      'South America': 1.1,
      'Oceania': 0.6,
      'Other': 1.0
    };
    return baseValue * (regionalModifier[region] || 1.0);
  }

  /**
   * Calculate completeness statistics
   */
  static calculateStatistics(matrix: CountryVectorBaseline[]): CompletenessStatistics {
    const totalRows = matrix.length;
    const completeRows = matrix.filter(row => row.dataQuality === 'Complete').length;
    const fallbackRows = matrix.filter(row => row.dataQuality === 'Fallback Applied').length;
    const missingRows = matrix.filter(row => row.dataQuality === 'Missing').length;

    return {
      totalRows,
      completeRows,
      fallbackRows,
      missingRows,
      completenessPercentage: Math.round((completeRows / totalRows) * 10000) / 100,
      fallbackPercentage: Math.round((fallbackRows / totalRows) * 10000) / 100,
      countriesCount: COUNTRIES.length,
      vectorsCount: VECTORS.length
    };
  }

  /**
   * Validate baseline completeness
   */
  static validateCompleteness(): CompletenessValidationResult {
    const matrix = this.generateBaselineMatrix();
    const statistics = this.calculateStatistics(matrix);
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    // Validation 1: Check total row count
    const expectedRows = COUNTRIES.length * VECTORS.length;
    if (statistics.totalRows !== expectedRows) {
      validationErrors.push(
        `Expected ${expectedRows} rows (${COUNTRIES.length} countries × ${VECTORS.length} vectors), but got ${statistics.totalRows}`
      );
    }

    // Validation 2: Check for missing data
    if (statistics.missingRows > 0) {
      validationErrors.push(
        `Found ${statistics.missingRows} rows with missing baseline data`
      );
    }

    // Validation 3: Check fallback consistency
    if (statistics.fallbackRows > 0) {
      validationWarnings.push(
        `${statistics.fallbackRows} rows (${statistics.fallbackPercentage}%) use fallback logic`
      );
    }

    // Validation 4: Check each country has all vectors
    const countriesWithMissingVectors: string[] = [];
    for (const country of COUNTRIES) {
      const countryRows = matrix.filter(row => row.country === country);
      if (countryRows.length !== VECTORS.length) {
        countriesWithMissingVectors.push(country);
      }
    }
    if (countriesWithMissingVectors.length > 0) {
      validationErrors.push(
        `${countriesWithMissingVectors.length} countries missing vector data: ${countriesWithMissingVectors.slice(0, 5).join(', ')}${countriesWithMissingVectors.length > 5 ? '...' : ''}`
      );
    }

    // Validation 5: Check each vector covers all countries
    const vectorsWithMissingCountries: string[] = [];
    for (const vector of VECTORS) {
      const vectorRows = matrix.filter(row => row.vector === vector);
      if (vectorRows.length !== COUNTRIES.length) {
        vectorsWithMissingCountries.push(vector);
      }
    }
    if (vectorsWithMissingCountries.length > 0) {
      validationErrors.push(
        `${vectorsWithMissingCountries.length} vectors missing country data: ${vectorsWithMissingCountries.join(', ')}`
      );
    }

    const isValid = validationErrors.length === 0;

    return {
      isValid,
      statistics,
      matrix,
      validationErrors,
      validationWarnings
    };
  }

  /**
   * Export matrix to CSV format
   */
  static exportToCSV(matrix: CountryVectorBaseline[]): string {
    const headers = [
      'Country',
      'Vector',
      'Baseline Value',
      'Source Attribution',
      'Fallback Method',
      'Data Quality'
    ];

    const rows = matrix.map(row => [
      row.country,
      row.vector,
      row.baselineValue.toString(),
      row.sourceAttribution,
      row.fallbackMethod || 'N/A',
      row.dataQuality
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  static downloadCSV(matrix: CountryVectorBaseline[], filename: string = 'completeness-report.csv'): void {
    const csv = this.exportToCSV(matrix);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
