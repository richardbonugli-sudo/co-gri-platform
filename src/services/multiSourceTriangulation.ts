import { CountryExposure, ChannelData, EvidenceStatus, FallbackType } from '@/pages/COGRI';

// Data Source Types and Interfaces
export interface DataSource {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'estimated';
  reliability: number; // 0-100%
  weight: number; // Confidence weighting
  lastUpdated: Date;
  status: 'active' | 'stale' | 'unavailable';
  url?: string;
}

export interface TriangulationResult {
  exposureValue: number;
  confidenceScore: number; // 0-100%
  agreementScore: number; // Percentage of sources that agree
  reliabilityIndex: number; // Weighted average based on source quality
  evidenceStrength: number; // Number of independent sources
  temporalConsistency: number; // Historical validation score
  sources: DataSourceResult[];
  discrepancies: Discrepancy[];
  investigationRequired: boolean;
}

export interface DataSourceResult {
  source: DataSource;
  value: number;
  confidence: number;
  status: 'confirmed' | 'conflicting' | 'missing' | 'outdated';
  deviation: number; // Percentage deviation from consensus
}

export interface Discrepancy {
  type: 'major' | 'minor' | 'temporal';
  description: string;
  sources: string[];
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface TriangulationMatrix {
  country: string;
  channels: {
    revenue: TriangulationResult;
    supply: TriangulationResult;
    assets: TriangulationResult;
    financial: TriangulationResult;
  };
  overallQuality: number;
  investigationFlags: string[];
}

// Data Source Definitions
export const DATA_SOURCES: Record<string, DataSource> = {
  SEC_FILINGS: {
    id: 'sec_filings',
    name: 'SEC 10-K/20-F Filings',
    type: 'primary',
    reliability: 95,
    weight: 0.95,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://www.sec.gov/edgar'
  },
  UN_COMTRADE: {
    id: 'un_comtrade',
    name: 'UN COMTRADE Trade Statistics',
    type: 'secondary',
    reliability: 90,
    weight: 0.85,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://comtradeplus.un.org/'
  },
  OECD_ICIO: {
    id: 'oecd_icio',
    name: 'OECD Inter-Country Input-Output Tables',
    type: 'secondary',
    reliability: 88,
    weight: 0.85,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://www.oecd.org/sti/ind/inter-country-input-output-tables.htm'
  },
  FACTSET_REVERE: {
    id: 'factset_revere',
    name: 'FactSet Revere Supply Chain',
    type: 'secondary',
    reliability: 85,
    weight: 0.80,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://www.factset.com/data/revere'
  },
  BIS_BANKING: {
    id: 'bis_banking',
    name: 'BIS Consolidated Banking Statistics',
    type: 'secondary',
    reliability: 92,
    weight: 0.88,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://www.bis.org/statistics/consstats.htm'
  },
  IMF_CPIS: {
    id: 'imf_cpis',
    name: 'IMF Coordinated Portfolio Investment Survey',
    type: 'secondary',
    reliability: 90,
    weight: 0.85,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://data.imf.org/CPIS'
  },
  WORLD_BANK_GDP: {
    id: 'world_bank_gdp',
    name: 'World Bank GDP Statistics',
    type: 'tertiary',
    reliability: 85,
    weight: 0.75,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD'
  },
  STATISTA: {
    id: 'statista',
    name: 'Statista Market Research',
    type: 'tertiary',
    reliability: 75,
    weight: 0.70,
    lastUpdated: new Date(),
    status: 'active',
    url: 'https://www.statista.com/'
  },
  COMPANY_REPORTS: {
    id: 'company_reports',
    name: 'Company Annual Reports',
    type: 'secondary',
    reliability: 85,
    weight: 0.80,
    lastUpdated: new Date(),
    status: 'active'
  },
  FALLBACK_ESTIMATION: {
    id: 'fallback_estimation',
    name: 'Fallback Estimation Model',
    type: 'estimated',
    reliability: 50,
    weight: 0.50,
    lastUpdated: new Date(),
    status: 'active'
  }
};

// Triangulation Algorithms
export class MultiSourceTriangulation {
  private static readonly AGREEMENT_THRESHOLD = 0.15; // 15% deviation threshold
  private static readonly MIN_SOURCES = 2;
  private static readonly TEMPORAL_DECAY_MONTHS = 12;

  /**
   * Perform multi-source triangulation for a specific exposure value
   */
  static triangulateExposure(
    country: string,
    channel: 'revenue' | 'supply' | 'assets' | 'financial',
    sourceValues: Map<string, { value: number; timestamp: Date; confidence: number }>
  ): TriangulationResult {
    const sources: DataSourceResult[] = [];
    let totalWeight = 0;
    let weightedSum = 0;
    let agreementCount = 0;
    const discrepancies: Discrepancy[] = [];

    // Convert source values to results
    const values: number[] = [];
    for (const [sourceId, data] of sourceValues.entries()) {
      const source = DATA_SOURCES[sourceId];
      if (!source) continue;

      const temporalWeight = this.calculateTemporalWeight(data.timestamp);
      const adjustedWeight = source.weight * temporalWeight;
      
      sources.push({
        source,
        value: data.value,
        confidence: data.confidence * temporalWeight,
        status: this.determineSourceStatus(data.value, data.confidence, temporalWeight),
        deviation: 0 // Will be calculated after consensus
      });

      values.push(data.value);
      totalWeight += adjustedWeight;
      weightedSum += data.value * adjustedWeight;
    }

    if (sources.length === 0) {
      return this.createEmptyResult();
    }

    // Calculate consensus value
    const consensusValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const median = this.calculateMedian(values);
    const standardDeviation = this.calculateStandardDeviation(values);

    // Calculate deviations and agreement
    sources.forEach(sourceResult => {
      const deviation = Math.abs(sourceResult.value - consensusValue) / consensusValue;
      sourceResult.deviation = deviation * 100;
      
      if (deviation <= this.AGREEMENT_THRESHOLD) {
        agreementCount++;
      } else {
        // Flag major discrepancy
        discrepancies.push({
          type: deviation > 0.5 ? 'major' : 'minor',
          description: `${sourceResult.source.name} shows ${(deviation * 100).toFixed(1)}% deviation from consensus`,
          sources: [sourceResult.source.name],
          impact: deviation > 0.5 ? 'high' : deviation > 0.25 ? 'medium' : 'low',
          recommendation: this.generateDiscrepancyRecommendation(sourceResult, consensusValue)
        });
      }
    });

    // Calculate quality metrics
    const agreementScore = (agreementCount / sources.length) * 100;
    const reliabilityIndex = this.calculateReliabilityIndex(sources);
    const evidenceStrength = sources.filter(s => s.status === 'confirmed').length;
    const temporalConsistency = this.calculateTemporalConsistency(sources);
    const confidenceScore = this.calculateOverallConfidence(
      agreementScore,
      reliabilityIndex,
      evidenceStrength,
      temporalConsistency
    );

    return {
      exposureValue: consensusValue,
      confidenceScore,
      agreementScore,
      reliabilityIndex,
      evidenceStrength,
      temporalConsistency,
      sources,
      discrepancies,
      investigationRequired: discrepancies.some(d => d.impact === 'high')
    };
  }

  /**
   * Perform comprehensive triangulation for all channels of a country
   */
  static triangulateCountryExposure(
    country: string,
    channelData: {
      revenue?: Map<string, { value: number; timestamp: Date; confidence: number }>;
      supply?: Map<string, { value: number; timestamp: Date; confidence: number }>;
      assets?: Map<string, { value: number; timestamp: Date; confidence: number }>;
      financial?: Map<string, { value: number; timestamp: Date; confidence: number }>;
    }
  ): TriangulationMatrix {
    const channels = {
      revenue: channelData.revenue ? 
        this.triangulateExposure(country, 'revenue', channelData.revenue) : 
        this.createEmptyResult(),
      supply: channelData.supply ? 
        this.triangulateExposure(country, 'supply', channelData.supply) : 
        this.createEmptyResult(),
      assets: channelData.assets ? 
        this.triangulateExposure(country, 'assets', channelData.assets) : 
        this.createEmptyResult(),
      financial: channelData.financial ? 
        this.triangulateExposure(country, 'financial', channelData.financial) : 
        this.createEmptyResult()
    };

    // Calculate overall quality score
    const channelScores = [
      channels.revenue.confidenceScore,
      channels.supply.confidenceScore,
      channels.assets.confidenceScore,
      channels.financial.confidenceScore
    ];
    const overallQuality = channelScores.reduce((sum, score) => sum + score, 0) / channelScores.length;

    // Collect investigation flags
    const investigationFlags: string[] = [];
    Object.entries(channels).forEach(([channelName, result]) => {
      if (result.investigationRequired) {
        investigationFlags.push(`${channelName} channel requires investigation`);
      }
      result.discrepancies.forEach(disc => {
        if (disc.impact === 'high') {
          investigationFlags.push(`${channelName}: ${disc.description}`);
        }
      });
    });

    return {
      country,
      channels,
      overallQuality,
      investigationFlags
    };
  }

  /**
   * Cross-validate revenue channel data
   */
  static validateRevenueChannel(
    country: string,
    secFilingValue: number,
    unComtradeValue: number,
    statistaValue: number,
    companyReportValue?: number
  ): TriangulationResult {
    const sourceValues = new Map<string, { value: number; timestamp: Date; confidence: number }>();
    
    sourceValues.set('SEC_FILINGS', {
      value: secFilingValue,
      timestamp: new Date(),
      confidence: 0.95
    });
    
    sourceValues.set('UN_COMTRADE', {
      value: unComtradeValue,
      timestamp: new Date(),
      confidence: 0.85
    });
    
    sourceValues.set('STATISTA', {
      value: statistaValue,
      timestamp: new Date(),
      confidence: 0.75
    });

    if (companyReportValue !== undefined) {
      sourceValues.set('COMPANY_REPORTS', {
        value: companyReportValue,
        timestamp: new Date(),
        confidence: 0.80
      });
    }

    return this.triangulateExposure(country, 'revenue', sourceValues);
  }

  /**
   * Cross-validate supply chain data
   */
  static validateSupplyChannel(
    country: string,
    oecdIcioValue: number,
    factsetValue: number,
    unComtradeValue: number,
    companyDisclosureValue?: number
  ): TriangulationResult {
    const sourceValues = new Map<string, { value: number; timestamp: Date; confidence: number }>();
    
    sourceValues.set('OECD_ICIO', {
      value: oecdIcioValue,
      timestamp: new Date(),
      confidence: 0.88
    });
    
    sourceValues.set('FACTSET_REVERE', {
      value: factsetValue,
      timestamp: new Date(),
      confidence: 0.85
    });
    
    sourceValues.set('UN_COMTRADE', {
      value: unComtradeValue,
      timestamp: new Date(),
      confidence: 0.85
    });

    if (companyDisclosureValue !== undefined) {
      sourceValues.set('SEC_FILINGS', {
        value: companyDisclosureValue,
        timestamp: new Date(),
        confidence: 0.95
      });
    }

    return this.triangulateExposure(country, 'supply', sourceValues);
  }

  /**
   * Cross-validate assets channel data
   */
  static validateAssetsChannel(
    country: string,
    secFilingValue: number,
    worldBankValue: number,
    imfValue?: number
  ): TriangulationResult {
    const sourceValues = new Map<string, { value: number; timestamp: Date; confidence: number }>();
    
    sourceValues.set('SEC_FILINGS', {
      value: secFilingValue,
      timestamp: new Date(),
      confidence: 0.95
    });
    
    sourceValues.set('WORLD_BANK_GDP', {
      value: worldBankValue,
      timestamp: new Date(),
      confidence: 0.85
    });

    if (imfValue !== undefined) {
      sourceValues.set('IMF_CPIS', {
        value: imfValue,
        timestamp: new Date(),
        confidence: 0.90
      });
    }

    return this.triangulateExposure(country, 'assets', sourceValues);
  }

  /**
   * Cross-validate financial channel data
   */
  static validateFinancialChannel(
    country: string,
    bisBankingValue: number,
    imfCpisValue: number,
    imfIfsValue?: number
  ): TriangulationResult {
    const sourceValues = new Map<string, { value: number; timestamp: Date; confidence: number }>();
    
    sourceValues.set('BIS_BANKING', {
      value: bisBankingValue,
      timestamp: new Date(),
      confidence: 0.92
    });
    
    sourceValues.set('IMF_CPIS', {
      value: imfCpisValue,
      timestamp: new Date(),
      confidence: 0.90
    });

    if (imfIfsValue !== undefined) {
      sourceValues.set('IMF_IFS', {
        value: imfIfsValue,
        timestamp: new Date(),
        confidence: 0.90
      });
    }

    return this.triangulateExposure(country, 'financial', sourceValues);
  }

  // Helper Methods
  private static calculateTemporalWeight(timestamp: Date): number {
    const monthsOld = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0.1, 1 - (monthsOld / this.TEMPORAL_DECAY_MONTHS));
  }

  private static determineSourceStatus(
    value: number,
    confidence: number,
    temporalWeight: number
  ): 'confirmed' | 'conflicting' | 'missing' | 'outdated' {
    if (value === 0) return 'missing';
    if (temporalWeight < 0.3) return 'outdated';
    if (confidence < 0.5) return 'conflicting';
    return 'confirmed';
  }

  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private static calculateReliabilityIndex(sources: DataSourceResult[]): number {
    const totalWeight = sources.reduce((sum, s) => sum + s.source.weight, 0);
    const weightedReliability = sources.reduce((sum, s) => sum + (s.source.reliability * s.source.weight), 0);
    return totalWeight > 0 ? weightedReliability / totalWeight : 0;
  }

  private static calculateTemporalConsistency(sources: DataSourceResult[]): number {
    const confirmedSources = sources.filter(s => s.status === 'confirmed');
    return (confirmedSources.length / sources.length) * 100;
  }

  private static calculateOverallConfidence(
    agreementScore: number,
    reliabilityIndex: number,
    evidenceStrength: number,
    temporalConsistency: number
  ): number {
    // Weighted combination of quality metrics
    const weights = {
      agreement: 0.35,
      reliability: 0.25,
      evidence: 0.25,
      temporal: 0.15
    };

    const evidenceScore = Math.min(100, (evidenceStrength / this.MIN_SOURCES) * 100);
    
    return (
      agreementScore * weights.agreement +
      reliabilityIndex * weights.reliability +
      evidenceScore * weights.evidence +
      temporalConsistency * weights.temporal
    );
  }

  private static generateDiscrepancyRecommendation(
    sourceResult: DataSourceResult,
    consensusValue: number
  ): string {
    const deviation = sourceResult.deviation;
    const sourceName = sourceResult.source.name;
    
    if (deviation > 50) {
      return `Major discrepancy detected in ${sourceName}. Recommend manual investigation and potential data source exclusion.`;
    } else if (deviation > 25) {
      return `Moderate discrepancy in ${sourceName}. Review source methodology and consider temporal factors.`;
    } else {
      return `Minor discrepancy in ${sourceName}. Monitor for pattern consistency in future assessments.`;
    }
  }

  private static createEmptyResult(): TriangulationResult {
    return {
      exposureValue: 0,
      confidenceScore: 0,
      agreementScore: 0,
      reliabilityIndex: 0,
      evidenceStrength: 0,
      temporalConsistency: 0,
      sources: [],
      discrepancies: [],
      investigationRequired: false
    };
  }

  /**
   * Get real-time data source status
   */
  static getDataSourceStatus(): Record<string, DataSource> {
    // In a real implementation, this would check actual API endpoints
    // For now, we'll simulate status based on predefined reliability
    const status = { ...DATA_SOURCES };
    
    Object.keys(status).forEach(key => {
      const source = status[key];
      // Simulate occasional stale data
      if (Math.random() < 0.1) {
        source.status = 'stale';
        source.reliability *= 0.8;
      }
      // Simulate rare unavailability
      if (Math.random() < 0.02) {
        source.status = 'unavailable';
        source.reliability = 0;
      }
    });
    
    return status;
  }

  /**
   * Generate triangulation quality report
   */
  static generateQualityReport(matrices: TriangulationMatrix[]): {
    overallScore: number;
    sourceReliability: Record<string, number>;
    investigationQueue: string[];
    recommendations: string[];
  } {
    const overallScore = matrices.reduce((sum, matrix) => sum + matrix.overallQuality, 0) / matrices.length;
    
    const sourceReliability: Record<string, number> = {};
    const investigationQueue: string[] = [];
    const recommendations: string[] = [];
    
    // Aggregate source performance
    matrices.forEach(matrix => {
      Object.values(matrix.channels).forEach(channel => {
        channel.sources.forEach(sourceResult => {
          const sourceId = sourceResult.source.id;
          if (!sourceReliability[sourceId]) {
            sourceReliability[sourceId] = 0;
          }
          sourceReliability[sourceId] += sourceResult.confidence;
        });
      });
      
      // Collect investigation items
      investigationQueue.push(...matrix.investigationFlags);
    });
    
    // Generate recommendations
    if (overallScore < 70) {
      recommendations.push('Overall data quality is below threshold. Consider expanding data source coverage.');
    }
    
    Object.entries(sourceReliability).forEach(([sourceId, reliability]) => {
      if (reliability < 60) {
        const sourceName = DATA_SOURCES[sourceId]?.name || sourceId;
        recommendations.push(`${sourceName} showing low reliability. Review data integration.`);
      }
    });
    
    return {
      overallScore,
      sourceReliability,
      investigationQueue: [...new Set(investigationQueue)], // Remove duplicates
      recommendations
    };
  }
}

// Export utility functions for integration
export const triangulationUtils = {
  getSourceStatus: MultiSourceTriangulation.getDataSourceStatus,
  validateRevenue: MultiSourceTriangulation.validateRevenueChannel,
  validateSupply: MultiSourceTriangulation.validateSupplyChannel,
  validateAssets: MultiSourceTriangulation.validateAssetsChannel,
  validateFinancial: MultiSourceTriangulation.validateFinancialChannel,
  triangulateCountry: MultiSourceTriangulation.triangulateCountryExposure,
  generateReport: MultiSourceTriangulation.generateQualityReport
};