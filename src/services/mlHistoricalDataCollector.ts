/**
 * ML Historical Data Collector Service
 * 
 * Collects historical COGRI assessments, geopolitical events, and builds
 * training datasets for ML-based calibration.
 * 
 * Phase 2 Task 3 - Part 1 of 5
 */

import { sectorClassificationService } from './sectorClassificationService';
import { geopoliticalEventMonitor, type GeopoliticalEvent } from './geopoliticalEventMonitor';
import { marketConditionAnalyzer } from './marketConditionAnalyzer';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface HistoricalAssessment {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  timestamp: Date;
  
  // Geographic exposure
  geographicExposure: {
    country: string;
    percentage: number;
    channel: 'revenue' | 'supply' | 'assets' | 'financial';
  }[];
  
  // Multipliers used
  sectorMultiplier: number;
  channelMultipliers: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
  dynamicAdjustment: number;
  
  // Scores
  rawScore: number;
  finalScore: number;
  riskLevel: string;
  
  // Context
  activeEvents: string[]; // Event IDs
  marketConditions: {
    stressIndex: number;
    currencyVolatility: number;
    commodityVolatility: number;
  };
}

export interface RiskMaterializationEvent {
  id: string;
  ticker: string;
  timestamp: Date;
  eventType: 'sanctions' | 'asset_seizure' | 'supply_disruption' | 'revenue_loss' | 'regulatory_action' | 'other';
  severity: number; // 1-10
  affectedCountries: string[];
  affectedChannels: ('revenue' | 'supply' | 'assets' | 'financial')[];
  financialImpact?: number; // USD millions
  description: string;
}

export interface TrainingDataPoint {
  // Input features
  ticker: string;
  sector: string;
  
  // Geographic exposure features
  topCountryExposure: number;
  geographicConcentration: number; // HHI
  highRiskCountryExposure: number;
  emergingMarketExposure: number;
  
  // Channel distribution
  revenueChannelWeight: number;
  supplyChannelWeight: number;
  assetsChannelWeight: number;
  financialChannelWeight: number;
  
  // Event features
  activeEventCount: number;
  maxEventSeverity: number;
  avgEventSeverity: number;
  sanctionEventsCount: number;
  conflictEventsCount: number;
  
  // Market condition features
  marketStressIndex: number;
  currencyVolatility: number;
  commodityVolatility: number;
  
  // Current multipliers
  sectorMultiplier: number;
  baseChannelMultiplier: number;
  dynamicAdjustment: number;
  
  // Target variable (actual risk materialization)
  actualRiskScore: number; // 0-10 based on materialization events
  riskMaterialized: boolean;
  materializationSeverity: number;
  
  // Metadata
  assessmentDate: Date;
  materializationDate?: Date;
  daysToMaterialization?: number;
}

export interface MLDataset {
  dataPoints: TrainingDataPoint[];
  metadata: {
    collectionDate: Date;
    totalAssessments: number;
    totalMaterializationEvents: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    sectorDistribution: Record<string, number>;
    materializationRate: number;
  };
}

// ============================================================================
// Historical Data Storage (Mock Database)
// ============================================================================

class HistoricalDataStore {
  private assessments: HistoricalAssessment[] = [];
  private materializationEvents: RiskMaterializationEvent[] = [];
  
  constructor() {
    this.initializeMockData();
  }
  
  private initializeMockData(): void {
    // Initialize with mock historical data for demonstration
    this.assessments = this.generateMockAssessments();
    this.materializationEvents = this.generateMockMaterializationEvents();
  }
  
  private generateMockAssessments(): HistoricalAssessment[] {
    const mockAssessments: HistoricalAssessment[] = [];
    const tickers = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'JPM', 'BAC', 'XOM'];
    const sectors = ['Technology', 'Consumer Discretionary', 'Financials', 'Energy'];
    
    // Generate 100 historical assessments over the past 2 years
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2024-01-01');
    
    for (let i = 0; i < 100; i++) {
      const ticker = tickers[i % tickers.length];
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const timestamp = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      mockAssessments.push({
        id: `assessment_${i + 1}`,
        ticker,
        companyName: `${ticker} Company`,
        sector,
        timestamp,
        geographicExposure: this.generateMockGeographicExposure(),
        sectorMultiplier: 1.0 + Math.random() * 0.2,
        channelMultipliers: {
          revenue: 1.0,
          supply: 1.05,
          assets: 1.03,
          financial: 1.02,
        },
        dynamicAdjustment: Math.random() * 0.3,
        rawScore: 30 + Math.random() * 40,
        finalScore: 35 + Math.random() * 45,
        riskLevel: ['Low', 'Moderate', 'High', 'Critical'][Math.floor(Math.random() * 4)],
        activeEvents: this.generateMockActiveEvents(),
        marketConditions: {
          stressIndex: Math.random() * 100,
          currencyVolatility: Math.random() * 0.5,
          commodityVolatility: Math.random() * 0.4,
        },
      });
    }
    
    return mockAssessments;
  }
  
  private generateMockGeographicExposure() {
    const countries = ['United States', 'China', 'Germany', 'United Kingdom', 'Japan', 'Russia', 'India'];
    const channels: ('revenue' | 'supply' | 'assets' | 'financial')[] = ['revenue', 'supply', 'assets', 'financial'];
    
    const exposures = [];
    const numExposures = 3 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numExposures; i++) {
      exposures.push({
        country: countries[Math.floor(Math.random() * countries.length)],
        percentage: 10 + Math.random() * 30,
        channel: channels[Math.floor(Math.random() * channels.length)],
      });
    }
    
    return exposures;
  }
  
  private generateMockActiveEvents(): string[] {
    const eventCount = Math.floor(Math.random() * 4);
    const events = [];
    for (let i = 0; i < eventCount; i++) {
      events.push(`event_${Math.floor(Math.random() * 10) + 1}`);
    }
    return events;
  }
  
  private generateMockMaterializationEvents(): RiskMaterializationEvent[] {
    const events: RiskMaterializationEvent[] = [];
    const tickers = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'META'];
    const eventTypes: RiskMaterializationEvent['eventType'][] = [
      'sanctions', 'asset_seizure', 'supply_disruption', 'revenue_loss', 'regulatory_action'
    ];
    
    // Generate 30 materialization events
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date('2022-01-01');
      timestamp.setDate(timestamp.getDate() + Math.floor(Math.random() * 730));
      
      events.push({
        id: `materialization_${i + 1}`,
        ticker: tickers[Math.floor(Math.random() * tickers.length)],
        timestamp,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        severity: 3 + Math.floor(Math.random() * 7),
        affectedCountries: ['China', 'Russia', 'Ukraine'][Math.floor(Math.random() * 3)] ? ['China'] : ['Russia'],
        affectedChannels: ['supply', 'revenue'],
        financialImpact: 10 + Math.random() * 500,
        description: `Risk materialization event ${i + 1}`,
      });
    }
    
    return events;
  }
  
  public addAssessment(assessment: HistoricalAssessment): void {
    this.assessments.push(assessment);
  }
  
  public addMaterializationEvent(event: RiskMaterializationEvent): void {
    this.materializationEvents.push(event);
  }
  
  public getAssessments(filters?: {
    ticker?: string;
    sector?: string;
    startDate?: Date;
    endDate?: Date;
  }): HistoricalAssessment[] {
    let filtered = [...this.assessments];
    
    if (filters?.ticker) {
      filtered = filtered.filter(a => a.ticker === filters.ticker);
    }
    if (filters?.sector) {
      filtered = filtered.filter(a => a.sector === filters.sector);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(a => a.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(a => a.timestamp <= filters.endDate!);
    }
    
    return filtered;
  }
  
  public getMaterializationEvents(filters?: {
    ticker?: string;
    startDate?: Date;
    endDate?: Date;
  }): RiskMaterializationEvent[] {
    let filtered = [...this.materializationEvents];
    
    if (filters?.ticker) {
      filtered = filtered.filter(e => e.ticker === filters.ticker);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }
    
    return filtered;
  }
  
  public getAllAssessments(): HistoricalAssessment[] {
    return [...this.assessments];
  }
  
  public getAllMaterializationEvents(): RiskMaterializationEvent[] {
    return [...this.materializationEvents];
  }
}

// ============================================================================
// Historical Data Collector Service
// ============================================================================

class MLHistoricalDataCollectorService {
  private dataStore: HistoricalDataStore;
  
  constructor() {
    this.dataStore = new HistoricalDataStore();
  }
  
  /**
   * Record a new COGRI assessment for historical tracking
   */
  public recordAssessment(assessment: HistoricalAssessment): void {
    this.dataStore.addAssessment(assessment);
    console.log(`[ML Data Collector] Recorded assessment for ${assessment.ticker} at ${assessment.timestamp}`);
  }
  
  /**
   * Record a risk materialization event
   */
  public recordMaterializationEvent(event: RiskMaterializationEvent): void {
    this.dataStore.addMaterializationEvent(event);
    console.log(`[ML Data Collector] Recorded materialization event for ${event.ticker}: ${event.eventType}`);
  }
  
  /**
   * Calculate geographic concentration using Herfindahl-Hirschman Index (HHI)
   */
  private calculateGeographicConcentration(exposures: HistoricalAssessment['geographicExposure']): number {
    const countryTotals = new Map<string, number>();
    
    exposures.forEach(exp => {
      const current = countryTotals.get(exp.country) || 0;
      countryTotals.set(exp.country, current + exp.percentage);
    });
    
    let hhi = 0;
    countryTotals.forEach(percentage => {
      hhi += Math.pow(percentage, 2);
    });
    
    return hhi / 100; // Normalize to 0-100 scale
  }
  
  /**
   * Calculate exposure to high-risk countries
   */
  private calculateHighRiskExposure(exposures: HistoricalAssessment['geographicExposure']): number {
    const highRiskCountries = ['Russia', 'China', 'Iran', 'North Korea', 'Venezuela', 'Belarus'];
    
    let totalHighRisk = 0;
    exposures.forEach(exp => {
      if (highRiskCountries.includes(exp.country)) {
        totalHighRisk += exp.percentage;
      }
    });
    
    return totalHighRisk;
  }
  
  /**
   * Calculate exposure to emerging markets
   */
  private calculateEmergingMarketExposure(exposures: HistoricalAssessment['geographicExposure']): number {
    const emergingMarkets = ['China', 'India', 'Brazil', 'Mexico', 'Turkey', 'Indonesia', 'Thailand', 'Vietnam'];
    
    let totalEmerging = 0;
    exposures.forEach(exp => {
      if (emergingMarkets.includes(exp.country)) {
        totalEmerging += exp.percentage;
      }
    });
    
    return totalEmerging;
  }
  
  /**
   * Calculate channel weights from geographic exposure
   */
  private calculateChannelWeights(exposures: HistoricalAssessment['geographicExposure']) {
    const weights = {
      revenue: 0,
      supply: 0,
      assets: 0,
      financial: 0,
    };
    
    exposures.forEach(exp => {
      weights[exp.channel] += exp.percentage;
    });
    
    const total = weights.revenue + weights.supply + weights.assets + weights.financial;
    
    if (total > 0) {
      weights.revenue /= total;
      weights.supply /= total;
      weights.assets /= total;
      weights.financial /= total;
    }
    
    return weights;
  }
  
  /**
   * Calculate actual risk score based on materialization events
   */
  private calculateActualRiskScore(
    ticker: string,
    assessmentDate: Date,
    lookAheadDays: number = 180
  ): { score: number; materialized: boolean; severity: number; daysTo?: number } {
    const endDate = new Date(assessmentDate);
    endDate.setDate(endDate.getDate() + lookAheadDays);
    
    const events = this.dataStore.getMaterializationEvents({
      ticker,
      startDate: assessmentDate,
      endDate,
    });
    
    if (events.length === 0) {
      return { score: 0, materialized: false, severity: 0 };
    }
    
    // Calculate weighted risk score based on events
    let totalScore = 0;
    let maxSeverity = 0;
    let earliestEvent = events[0];
    
    events.forEach(event => {
      totalScore += event.severity;
      maxSeverity = Math.max(maxSeverity, event.severity);
      if (event.timestamp < earliestEvent.timestamp) {
        earliestEvent = event;
      }
    });
    
    const avgScore = totalScore / events.length;
    const daysToMaterialization = Math.floor(
      (earliestEvent.timestamp.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      score: avgScore,
      materialized: true,
      severity: maxSeverity,
      daysTo: daysToMaterialization,
    };
  }
  
  /**
   * Build training dataset from historical assessments
   */
  public buildTrainingDataset(options?: {
    startDate?: Date;
    endDate?: Date;
    ticker?: string;
    sector?: string;
    lookAheadDays?: number;
  }): MLDataset {
    const lookAheadDays = options?.lookAheadDays || 180;
    
    const assessments = this.dataStore.getAssessments({
      ticker: options?.ticker,
      sector: options?.sector,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });
    
    const dataPoints: TrainingDataPoint[] = [];
    
    assessments.forEach(assessment => {
      const topCountry = assessment.geographicExposure.reduce((max, exp) => 
        exp.percentage > max.percentage ? exp : max
      , assessment.geographicExposure[0]);
      
      const channelWeights = this.calculateChannelWeights(assessment.geographicExposure);
      
      const actualRisk = this.calculateActualRiskScore(
        assessment.ticker,
        assessment.timestamp,
        lookAheadDays
      );
      
      dataPoints.push({
        ticker: assessment.ticker,
        sector: assessment.sector,
        topCountryExposure: topCountry.percentage,
        geographicConcentration: this.calculateGeographicConcentration(assessment.geographicExposure),
        highRiskCountryExposure: this.calculateHighRiskExposure(assessment.geographicExposure),
        emergingMarketExposure: this.calculateEmergingMarketExposure(assessment.geographicExposure),
        revenueChannelWeight: channelWeights.revenue,
        supplyChannelWeight: channelWeights.supply,
        assetsChannelWeight: channelWeights.assets,
        financialChannelWeight: channelWeights.financial,
        activeEventCount: assessment.activeEvents.length,
        maxEventSeverity: assessment.activeEvents.length > 0 ? 8 : 0,
        avgEventSeverity: assessment.activeEvents.length > 0 ? 6 : 0,
        sanctionEventsCount: Math.floor(assessment.activeEvents.length * 0.3),
        conflictEventsCount: Math.floor(assessment.activeEvents.length * 0.2),
        marketStressIndex: assessment.marketConditions.stressIndex,
        currencyVolatility: assessment.marketConditions.currencyVolatility,
        commodityVolatility: assessment.marketConditions.commodityVolatility,
        sectorMultiplier: assessment.sectorMultiplier,
        baseChannelMultiplier: (
          assessment.channelMultipliers.revenue * 0.4 +
          assessment.channelMultipliers.supply * 0.35 +
          assessment.channelMultipliers.assets * 0.15 +
          assessment.channelMultipliers.financial * 0.1
        ),
        dynamicAdjustment: assessment.dynamicAdjustment,
        actualRiskScore: actualRisk.score,
        riskMaterialized: actualRisk.materialized,
        materializationSeverity: actualRisk.severity,
        assessmentDate: assessment.timestamp,
        materializationDate: actualRisk.materialized ? new Date(assessment.timestamp.getTime() + (actualRisk.daysTo || 0) * 24 * 60 * 60 * 1000) : undefined,
        daysToMaterialization: actualRisk.daysTo,
      });
    });
    
    // Calculate metadata
    const sectorDistribution: Record<string, number> = {};
    dataPoints.forEach(dp => {
      sectorDistribution[dp.sector] = (sectorDistribution[dp.sector] || 0) + 1;
    });
    
    const materializationCount = dataPoints.filter(dp => dp.riskMaterialized).length;
    
    const dates = dataPoints.map(dp => dp.assessmentDate);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return {
      dataPoints,
      metadata: {
        collectionDate: new Date(),
        totalAssessments: dataPoints.length,
        totalMaterializationEvents: materializationCount,
        dateRange: {
          start: minDate,
          end: maxDate,
        },
        sectorDistribution,
        materializationRate: dataPoints.length > 0 ? materializationCount / dataPoints.length : 0,
      },
    };
  }
  
  /**
   * Export training dataset to JSON format
   */
  public exportToJSON(dataset: MLDataset): string {
    return JSON.stringify(dataset, null, 2);
  }
  
  /**
   * Export training dataset to CSV format
   */
  public exportToCSV(dataset: MLDataset): string {
    const headers = [
      'ticker', 'sector', 'topCountryExposure', 'geographicConcentration',
      'highRiskCountryExposure', 'emergingMarketExposure',
      'revenueChannelWeight', 'supplyChannelWeight', 'assetsChannelWeight', 'financialChannelWeight',
      'activeEventCount', 'maxEventSeverity', 'avgEventSeverity',
      'sanctionEventsCount', 'conflictEventsCount',
      'marketStressIndex', 'currencyVolatility', 'commodityVolatility',
      'sectorMultiplier', 'baseChannelMultiplier', 'dynamicAdjustment',
      'actualRiskScore', 'riskMaterialized', 'materializationSeverity',
      'assessmentDate', 'daysToMaterialization'
    ];
    
    const rows = dataset.dataPoints.map(dp => [
      dp.ticker,
      dp.sector,
      dp.topCountryExposure.toFixed(2),
      dp.geographicConcentration.toFixed(2),
      dp.highRiskCountryExposure.toFixed(2),
      dp.emergingMarketExposure.toFixed(2),
      dp.revenueChannelWeight.toFixed(3),
      dp.supplyChannelWeight.toFixed(3),
      dp.assetsChannelWeight.toFixed(3),
      dp.financialChannelWeight.toFixed(3),
      dp.activeEventCount,
      dp.maxEventSeverity.toFixed(1),
      dp.avgEventSeverity.toFixed(1),
      dp.sanctionEventsCount,
      dp.conflictEventsCount,
      dp.marketStressIndex.toFixed(2),
      dp.currencyVolatility.toFixed(3),
      dp.commodityVolatility.toFixed(3),
      dp.sectorMultiplier.toFixed(3),
      dp.baseChannelMultiplier.toFixed(3),
      dp.dynamicAdjustment.toFixed(3),
      dp.actualRiskScore.toFixed(2),
      dp.riskMaterialized ? '1' : '0',
      dp.materializationSeverity.toFixed(1),
      dp.assessmentDate.toISOString(),
      dp.daysToMaterialization?.toString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  
  /**
   * Get dataset statistics
   */
  public getDatasetStatistics(dataset: MLDataset) {
    const dataPoints = dataset.dataPoints;
    
    const calculateStats = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      
      return {
        mean,
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
      };
    };
    
    return {
      totalDataPoints: dataPoints.length,
      materializationRate: dataset.metadata.materializationRate,
      sectorDistribution: dataset.metadata.sectorDistribution,
      
      featureStatistics: {
        topCountryExposure: calculateStats(dataPoints.map(dp => dp.topCountryExposure)),
        geographicConcentration: calculateStats(dataPoints.map(dp => dp.geographicConcentration)),
        highRiskCountryExposure: calculateStats(dataPoints.map(dp => dp.highRiskCountryExposure)),
        activeEventCount: calculateStats(dataPoints.map(dp => dp.activeEventCount)),
        marketStressIndex: calculateStats(dataPoints.map(dp => dp.marketStressIndex)),
        sectorMultiplier: calculateStats(dataPoints.map(dp => dp.sectorMultiplier)),
        dynamicAdjustment: calculateStats(dataPoints.map(dp => dp.dynamicAdjustment)),
        actualRiskScore: calculateStats(dataPoints.map(dp => dp.actualRiskScore)),
      },
      
      materializationStatistics: {
        totalMaterialized: dataPoints.filter(dp => dp.riskMaterialized).length,
        avgDaysToMaterialization: dataPoints
          .filter(dp => dp.daysToMaterialization !== undefined)
          .reduce((sum, dp) => sum + (dp.daysToMaterialization || 0), 0) / 
          dataPoints.filter(dp => dp.daysToMaterialization !== undefined).length,
        avgMaterializationSeverity: dataPoints
          .filter(dp => dp.riskMaterialized)
          .reduce((sum, dp) => sum + dp.materializationSeverity, 0) /
          dataPoints.filter(dp => dp.riskMaterialized).length,
      },
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const mlHistoricalDataCollector = new MLHistoricalDataCollectorService();

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Build and export training dataset
 * 
 * const dataset = mlHistoricalDataCollector.buildTrainingDataset({
 *   startDate: new Date('2022-01-01'),
 *   endDate: new Date('2024-01-01'),
 *   lookAheadDays: 180,
 * });
 * 
 * const jsonData = mlHistoricalDataCollector.exportToJSON(dataset);
 * const csvData = mlHistoricalDataCollector.exportToCSV(dataset);
 * const stats = mlHistoricalDataCollector.getDatasetStatistics(dataset);
 * 
 * console.log('Dataset Statistics:', stats);
 */
