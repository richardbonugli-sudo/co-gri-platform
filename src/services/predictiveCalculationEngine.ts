/**
 * Phase 5D-3: Predictive Calculation Engine
 * 
 * Calculates forward-looking COGRI scores using geopolitical forecasts
 * with support for multiple time horizons and scenarios.
 */

import type {
  GeopoliticalForecast,
  PredictiveCOGRI,
  PredictiveCountryExposure,
  PredictiveCalculationInput,
  PredictiveCalculationResult,
  ForecastCalculationDetail,
  TimeHorizon,
  ScenarioType,
  ScenarioAnalysis,
  TimeSeriesForecast
} from '@/types/forecast.types';

import { getCurrentForecast } from './forecastIntegrationService';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface CalculationConfig {
  useRegionalPremiums: boolean;
  useSectorMultipliers: boolean;
  useEventImpacts: boolean;
  confidenceDecay: boolean;
  decayRate: number; // per year
}

const DEFAULT_CONFIG: CalculationConfig = {
  useRegionalPremiums: true,
  useSectorMultipliers: true,
  useEventImpacts: true,
  confidenceDecay: true,
  decayRate: 0.15 // 15% confidence decay per year
};

// ============================================================================
// TIME HORIZON ADJUSTMENTS
// ============================================================================

const TIME_HORIZON_FACTORS: Record<TimeHorizon, {
  weight: number;
  confidenceMultiplier: number;
  description: string;
}> = {
  '6m': {
    weight: 1.0,
    confidenceMultiplier: 0.95,
    description: 'Near-term (6 months) - High confidence'
  },
  '1y': {
    weight: 0.95,
    confidenceMultiplier: 0.90,
    description: 'Short-term (1 year) - Good confidence'
  },
  '2y': {
    weight: 0.85,
    confidenceMultiplier: 0.75,
    description: 'Medium-term (2 years) - Moderate confidence'
  },
  '5y': {
    weight: 0.70,
    confidenceMultiplier: 0.55,
    description: 'Long-term (5 years) - Lower confidence'
  }
};

// ============================================================================
// SCENARIO ADJUSTMENTS
// ============================================================================

const SCENARIO_FACTORS: Record<ScenarioType, {
  adjustmentMultiplier: number;
  eventProbabilityThreshold: number;
  description: string;
}> = {
  'base': {
    adjustmentMultiplier: 1.0,
    eventProbabilityThreshold: 0.5,
    description: 'Base case - Most likely scenario'
  },
  'optimistic': {
    adjustmentMultiplier: 0.7,
    eventProbabilityThreshold: 0.7,
    description: 'Optimistic - Favorable conditions'
  },
  'pessimistic': {
    adjustmentMultiplier: 1.3,
    eventProbabilityThreshold: 0.3,
    description: 'Pessimistic - Adverse conditions'
  }
};

// ============================================================================
// PREDICTIVE CALCULATION ENGINE
// ============================================================================

export class PredictiveCalculationEngine {
  private config: CalculationConfig;

  constructor(config: Partial<CalculationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[Predictive Engine] Initialized with config:', this.config);
  }

  // ==========================================================================
  // MAIN CALCULATION METHODS
  // ==========================================================================

  /**
   * Calculate predictive COGRI score
   */
  async calculatePredictiveCOGRI(
    input: PredictiveCalculationInput
  ): Promise<PredictiveCalculationResult> {
    console.log('[Predictive Engine] Calculating predictive COGRI:', {
      ticker: input.ticker,
      timeHorizon: input.timeHorizon,
      scenario: input.scenario
    });

    try {
      // Get time horizon and scenario factors
      const timeFactors = TIME_HORIZON_FACTORS[input.timeHorizon];
      const scenarioFactors = SCENARIO_FACTORS[input.scenario];

      // Calculate country-level forecasts
      const countryForecasts = this.calculateCountryForecasts(
        input,
        timeFactors,
        scenarioFactors
      );

      // Calculate detailed breakdown
      const calculationDetails = this.generateCalculationDetails(
        input,
        countryForecasts,
        timeFactors,
        scenarioFactors
      );

      // Identify applicable events
      const appliedEvents = this.identifyApplicableEvents(
        input,
        scenarioFactors.eventProbabilityThreshold
      );

      // Calculate predicted COGRI score
      const predictedScore = this.calculateWeightedScore(
        countryForecasts,
        input.sector,
        timeFactors,
        scenarioFactors
      );

      // Calculate confidence factors
      const confidenceFactors = this.calculateConfidenceFactors(
        input,
        timeFactors,
        appliedEvents
      );

      // Build predictive COGRI result
      const predictiveCOGRI = this.buildPredictiveCOGRI(
        input,
        predictedScore,
        timeFactors,
        scenarioFactors,
        confidenceFactors,
        countryForecasts
      );

      console.log('[Predictive Engine] Calculation complete:', {
        currentScore: input.currentCOGRI,
        predictedScore: predictiveCOGRI.predictedScore,
        delta: predictiveCOGRI.delta,
        confidence: confidenceFactors.overall
      });

      return {
        predictiveCOGRI,
        countryForecasts,
        calculationDetails,
        appliedEvents,
        confidenceFactors
      };

    } catch (error) {
      console.error('[Predictive Engine] Calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate scenario analysis
   */
  async calculateScenarioAnalysis(
    ticker: string,
    companyName: string,
    sector: string,
    currentCOGRI: number,
    countryExposures: PredictiveCalculationInput['countryExposures'],
    timeHorizon: TimeHorizon = '1y'
  ): Promise<ScenarioAnalysis> {
    console.log('[Predictive Engine] Calculating scenario analysis:', ticker);

    const forecast = getCurrentForecast();
    if (!forecast) {
      throw new Error('No forecast data available');
    }

    // Calculate all three scenarios
    const baseInput: PredictiveCalculationInput = {
      ticker,
      currentCOGRI,
      countryExposures,
      sector,
      timeHorizon,
      scenario: 'base',
      forecast
    };

    const optimisticInput = { ...baseInput, scenario: 'optimistic' as ScenarioType };
    const pessimisticInput = { ...baseInput, scenario: 'pessimistic' as ScenarioType };

    const [baseResult, optimisticResult, pessimisticResult] = await Promise.all([
      this.calculatePredictiveCOGRI(baseInput),
      this.calculatePredictiveCOGRI(optimisticInput),
      this.calculatePredictiveCOGRI(pessimisticInput)
    ]);

    // Calculate scenario range
    const scores = [
      baseResult.predictiveCOGRI.predictedScore,
      optimisticResult.predictiveCOGRI.predictedScore,
      pessimisticResult.predictiveCOGRI.predictedScore
    ];

    const scenarioRange = {
      min: Math.min(...scores),
      max: Math.max(...scores),
      spread: Math.max(...scores) - Math.min(...scores)
    };

    // Identify key risks and opportunities
    const keyRisks = this.identifyKeyRisks(pessimisticResult, baseResult);
    const keyOpportunities = this.identifyKeyOpportunities(optimisticResult, baseResult);
    const recommendedActions = this.generateRecommendations(
      baseResult,
      optimisticResult,
      pessimisticResult,
      scenarioRange
    );

    return {
      ticker,
      companyName,
      sector,
      baseCase: baseResult.predictiveCOGRI,
      optimisticCase: optimisticResult.predictiveCOGRI,
      pessimisticCase: pessimisticResult.predictiveCOGRI,
      scenarioRange,
      keyRisks,
      keyOpportunities,
      recommendedActions,
      analysisDate: new Date().toISOString()
    };
  }

  /**
   * Calculate time series forecast
   */
  async calculateTimeSeriesForecast(
    ticker: string,
    companyName: string,
    sector: string,
    currentCOGRI: number,
    countryExposures: PredictiveCalculationInput['countryExposures'],
    scenario: ScenarioType = 'base'
  ): Promise<TimeSeriesForecast> {
    console.log('[Predictive Engine] Calculating time series forecast:', ticker);

    const forecast = getCurrentForecast();
    if (!forecast) {
      throw new Error('No forecast data available');
    }

    // Calculate for all time horizons
    const timeHorizons: TimeHorizon[] = ['6m', '1y', '2y', '5y'];
    
    const results = await Promise.all(
      timeHorizons.map(timeHorizon => {
        const input: PredictiveCalculationInput = {
          ticker,
          currentCOGRI,
          countryExposures,
          sector,
          timeHorizon,
          scenario,
          forecast
        };
        return this.calculatePredictiveCOGRI(input);
      })
    );

    const forecasts = {
      '6m': results[0].predictiveCOGRI,
      '1y': results[1].predictiveCOGRI,
      '2y': results[2].predictiveCOGRI,
      '5y': results[3].predictiveCOGRI
    };

    // Determine trend direction
    const trendDirection = this.determineTrendDirection(forecasts);

    // Calculate volatility index
    const volatilityIndex = this.calculateVolatilityIndex(forecasts);

    // Calculate forecast reliability
    const forecastReliability = this.calculateForecastReliability(results);

    return {
      ticker,
      companyName,
      sector,
      forecasts,
      trendDirection,
      volatilityIndex,
      forecastReliability
    };
  }

  // ==========================================================================
  // COUNTRY-LEVEL CALCULATIONS
  // ==========================================================================

  /**
   * Calculate country-level forecasts
   */
  private calculateCountryForecasts(
    input: PredictiveCalculationInput,
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    scenarioFactors: typeof SCENARIO_FACTORS[ScenarioType]
  ): PredictiveCountryExposure[] {
    return input.countryExposures.map(exposure => {
      const countryAdjustment = input.forecast.countryAdjustments[exposure.country];
      
      if (!countryAdjustment) {
        // No forecast adjustment for this country
        return {
          country: exposure.country,
          currentExposure: exposure.exposurePercentage,
          predictedExposure: exposure.exposurePercentage,
          currentRisk: exposure.currentRisk,
          predictedRisk: exposure.currentRisk,
          timeHorizon: input.timeHorizon,
          scenario: input.scenario,
          confidence: 0.5,
          changeDrivers: ['No forecast data available']
        };
      }

      // Apply forecast adjustment
      const adjustedDelta = countryAdjustment.delta * 
                           timeFactors.weight * 
                           scenarioFactors.adjustmentMultiplier;

      const predictedRisk = Math.max(0, Math.min(100, 
        exposure.currentRisk + adjustedDelta
      ));

      // Exposure might shift based on risk changes
      const exposureShift = this.calculateExposureShift(
        exposure.exposurePercentage,
        countryAdjustment.outlook,
        input.scenario
      );

      const predictedExposure = Math.max(0, Math.min(100,
        exposure.exposurePercentage + exposureShift
      ));

      // Calculate confidence
      const confidence = this.calculateCountryConfidence(
        countryAdjustment,
        timeFactors,
        input.forecast.metadata.overallConfidence
      );

      return {
        country: exposure.country,
        currentExposure: exposure.exposurePercentage,
        predictedExposure,
        currentRisk: exposure.currentRisk,
        predictedRisk,
        timeHorizon: input.timeHorizon,
        scenario: input.scenario,
        confidence,
        changeDrivers: countryAdjustment.drivers
      };
    });
  }

  /**
   * Calculate exposure shift based on outlook
   */
  private calculateExposureShift(
    currentExposure: number,
    outlook: string,
    scenario: ScenarioType
  ): number {
    // Companies may reduce exposure to deteriorating markets
    let baseShift = 0;

    if (outlook === 'DETERIORATING') {
      baseShift = -currentExposure * 0.05; // 5% reduction
    } else if (outlook === 'IMPROVING') {
      baseShift = currentExposure * 0.03; // 3% increase
    }

    // Scenario adjustments
    if (scenario === 'optimistic') {
      baseShift *= 1.5; // More aggressive shifts
    } else if (scenario === 'pessimistic') {
      baseShift *= 0.5; // More conservative shifts
    }

    return baseShift;
  }

  /**
   * Calculate country-level confidence
   */
  private calculateCountryConfidence(
    adjustment: any,
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    overallConfidence: number
  ): number {
    // Start with overall forecast confidence
    let confidence = overallConfidence;

    // Apply time horizon decay
    confidence *= timeFactors.confidenceMultiplier;

    // Adjust based on number of drivers
    const driverBonus = Math.min(0.1, adjustment.drivers.length * 0.02);
    confidence += driverBonus;

    // Volatile outlooks have lower confidence
    if (adjustment.outlook === 'VOLATILE') {
      confidence *= 0.9;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  // ==========================================================================
  // SCORE CALCULATION
  // ==========================================================================

  /**
   * Calculate weighted predicted score
   */
  private calculateWeightedScore(
    countryForecasts: PredictiveCountryExposure[],
    sector: string,
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    scenarioFactors: typeof SCENARIO_FACTORS[ScenarioType]
  ): number {
    // Calculate base weighted score
    let weightedScore = 0;
    let totalWeight = 0;

    for (const forecast of countryForecasts) {
      const weight = forecast.predictedExposure / 100;
      weightedScore += forecast.predictedRisk * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      weightedScore /= totalWeight;
    }

    // Apply sector multiplier if configured
    if (this.config.useSectorMultipliers) {
      const sectorMultiplier = this.getSectorMultiplier(sector);
      weightedScore *= sectorMultiplier;
    }

    return weightedScore;
  }

  /**
   * Get sector multiplier from forecast
   */
  private getSectorMultiplier(sector: string): number {
    const forecast = getCurrentForecast();
    if (!forecast) return 1.0;

    return forecast.sectorMultipliers[sector] || 1.0;
  }

  // ==========================================================================
  // EVENT IMPACT ANALYSIS
  // ==========================================================================

  /**
   * Identify applicable geopolitical events
   */
  private identifyApplicableEvents(
    input: PredictiveCalculationInput,
    probabilityThreshold: number
  ): typeof input.forecast.geopoliticalEvents {
    if (!this.config.useEventImpacts) {
      return [];
    }

    const relevantCountries = new Set(
      input.countryExposures.map(e => e.country)
    );

    return input.forecast.geopoliticalEvents.filter(event => {
      // Check probability threshold
      if (event.probability < probabilityThreshold) {
        return false;
      }

      // Check if event affects any of the company's exposure countries
      const affectsCompany = event.affectedCountries.some(country =>
        relevantCountries.has(country)
      );

      return affectsCompany;
    });
  }

  // ==========================================================================
  // CONFIDENCE CALCULATION
  // ==========================================================================

  /**
   * Calculate confidence factors
   */
  private calculateConfidenceFactors(
    input: PredictiveCalculationInput,
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    appliedEvents: typeof input.forecast.geopoliticalEvents
  ): PredictiveCalculationResult['confidenceFactors'] {
    // Data quality (based on forecast metadata)
    const dataQuality = input.forecast.metadata.overallConfidence;

    // Forecast reliability (based on coverage)
    const coverageRatio = input.countryExposures.filter(e =>
      input.forecast.countryAdjustments[e.country]
    ).length / input.countryExposures.length;
    
    const forecastReliability = coverageRatio * 0.9 + 0.1; // 0.1-1.0 range

    // Time horizon adjustment
    const timeHorizonAdjustment = timeFactors.confidenceMultiplier;

    // Scenario confidence (base = 1.0, others lower)
    const scenarioConfidence = input.scenario === 'base' ? 1.0 : 0.85;

    // Overall confidence
    const overall = (
      dataQuality * 0.3 +
      forecastReliability * 0.3 +
      timeHorizonAdjustment * 0.25 +
      scenarioConfidence * 0.15
    );

    return {
      dataQuality,
      forecastReliability,
      timeHorizonAdjustment,
      scenarioConfidence,
      overall
    };
  }

  // ==========================================================================
  // RESULT BUILDING
  // ==========================================================================

  /**
   * Build predictive COGRI result
   */
  private buildPredictiveCOGRI(
    input: PredictiveCalculationInput,
    predictedScore: number,
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    scenarioFactors: typeof SCENARIO_FACTORS[ScenarioType],
    confidenceFactors: PredictiveCalculationResult['confidenceFactors'],
    countryForecasts: PredictiveCountryExposure[]
  ): PredictiveCOGRI {
    const delta = predictedScore - input.currentCOGRI;
    const percentageChange = (delta / input.currentCOGRI) * 100;

    // Determine risk level
    const riskLevel = this.determineRiskLevel(predictedScore);

    // Identify driving factors
    const drivingFactors = this.identifyDrivingFactors(
      countryForecasts,
      input.forecast
    );

    return {
      currentScore: input.currentCOGRI,
      predictedScore,
      timeHorizon: input.timeHorizon,
      scenario: input.scenario,
      confidence: confidenceFactors.overall,
      delta,
      percentageChange,
      drivingFactors,
      riskLevel,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): PredictiveCOGRI['riskLevel'] {
    if (score >= 70) return 'Very High Risk';
    if (score >= 55) return 'High Risk';
    if (score >= 40) return 'Moderate Risk';
    return 'Low Risk';
  }

  /**
   * Identify driving factors for prediction
   */
  private identifyDrivingFactors(
    countryForecasts: PredictiveCountryExposure[],
    forecast: GeopoliticalForecast
  ): string[] {
    const factors: string[] = [];

    // Find countries with largest risk changes
    const sortedByChange = [...countryForecasts]
      .sort((a, b) => 
        Math.abs(b.predictedRisk - b.currentRisk) - 
        Math.abs(a.predictedRisk - a.currentRisk)
      )
      .slice(0, 3);

    sortedByChange.forEach(forecast => {
      const change = forecast.predictedRisk - forecast.currentRisk;
      if (Math.abs(change) > 2) {
        const direction = change > 0 ? 'increasing' : 'decreasing';
        factors.push(`${forecast.country} risk ${direction} (${Math.abs(change).toFixed(1)} points)`);
      }
    });

    // Add high-probability events
    const highProbEvents = forecast.geopoliticalEvents
      .filter(e => e.probability > 0.6)
      .slice(0, 2);

    highProbEvents.forEach(event => {
      factors.push(`${event.event} (${(event.probability * 100).toFixed(0)}% probability)`);
    });

    return factors;
  }

  /**
   * Generate calculation details
   */
  private generateCalculationDetails(
    input: PredictiveCalculationInput,
    countryForecasts: PredictiveCountryExposure[],
    timeFactors: typeof TIME_HORIZON_FACTORS[TimeHorizon],
    scenarioFactors: typeof SCENARIO_FACTORS[ScenarioType]
  ): ForecastCalculationDetail[] {
    return countryForecasts.map(forecast => {
      const adjustment = input.forecast.countryAdjustments[forecast.country];
      const regionalPremium = this.getRegionalPremium(forecast.country, input.forecast);
      const sectorMultiplier = this.getSectorMultiplier(input.sector);
      
      // Calculate event impact for this country
      const eventImpact = this.calculateEventImpact(
        forecast.country,
        input.forecast.geopoliticalEvents,
        scenarioFactors.eventProbabilityThreshold
      );

      const contribution = (forecast.predictedExposure / 100) * forecast.predictedRisk;

      return {
        country: forecast.country,
        currentCSI: forecast.currentRisk,
        forecastedCSI: forecast.predictedRisk,
        delta: forecast.predictedRisk - forecast.currentRisk,
        exposureWeight: forecast.predictedExposure / 100,
        contribution,
        adjustmentFactors: {
          countryAdjustment: adjustment?.delta || 0,
          regionalPremium,
          sectorMultiplier,
          eventImpact
        },
        confidence: forecast.confidence
      };
    });
  }

  /**
   * Get regional premium for country
   */
  private getRegionalPremium(country: string, forecast: GeopoliticalForecast): number {
    if (!this.config.useRegionalPremiums) return 0;

    // Map countries to regions (simplified)
    const regionMap: Record<string, string> = {
      'US': 'North America', 'CA': 'North America', 'MX': 'North America',
      'DE': 'Europe', 'GB': 'Europe', 'FR': 'Europe',
      'CN': 'East Asia', 'JP': 'East Asia', 'KR': 'East Asia',
      'IN': 'South Asia',
      'SA': 'Middle East', 'AE': 'Middle East', 'IL': 'Middle East',
      'BR': 'Latin America', 'AR': 'Latin America',
      'AU': 'Oceania'
    };

    const region = regionMap[country];
    return region ? (forecast.regionalPremiums[region] || 0) : 0;
  }

  /**
   * Calculate event impact for country
   */
  private calculateEventImpact(
    country: string,
    events: GeopoliticalForecast['geopoliticalEvents'],
    probabilityThreshold: number
  ): number {
    let totalImpact = 0;

    const relevantEvents = events.filter(event =>
      event.probability >= probabilityThreshold &&
      event.affectedCountries.includes(country)
    );

    relevantEvents.forEach(event => {
      const weightedImpact = event.baseImpact * event.probability;
      totalImpact += weightedImpact;
    });

    return totalImpact;
  }

  // ==========================================================================
  // SCENARIO ANALYSIS HELPERS
  // ==========================================================================

  /**
   * Identify key risks from pessimistic scenario
   */
  private identifyKeyRisks(
    pessimistic: PredictiveCalculationResult,
    base: PredictiveCalculationResult
  ): string[] {
    const risks: string[] = [];

    // Find countries with worst deterioration
    pessimistic.countryForecasts.forEach((pForecast, index) => {
      const bForecast = base.countryForecasts[index];
      const deterioration = pForecast.predictedRisk - bForecast.predictedRisk;

      if (deterioration > 5) {
        risks.push(
          `${pForecast.country}: Additional ${deterioration.toFixed(1)} point risk increase in adverse scenario`
        );
      }
    });

    // Add high-impact events
    pessimistic.appliedEvents
      .filter(e => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH')
      .slice(0, 2)
      .forEach(event => {
        risks.push(`${event.event}: ${event.riskLevel} risk event`);
      });

    return risks.slice(0, 5);
  }

  /**
   * Identify key opportunities from optimistic scenario
   */
  private identifyKeyOpportunities(
    optimistic: PredictiveCalculationResult,
    base: PredictiveCalculationResult
  ): string[] {
    const opportunities: string[] = [];

    // Find countries with best improvement
    optimistic.countryForecasts.forEach((oForecast, index) => {
      const bForecast = base.countryForecasts[index];
      const improvement = bForecast.predictedRisk - oForecast.predictedRisk;

      if (improvement > 3) {
        opportunities.push(
          `${oForecast.country}: ${improvement.toFixed(1)} point risk reduction in favorable scenario`
        );
      }
    });

    return opportunities.slice(0, 5);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    base: PredictiveCalculationResult,
    optimistic: PredictiveCalculationResult,
    pessimistic: PredictiveCalculationResult,
    scenarioRange: ScenarioAnalysis['scenarioRange']
  ): string[] {
    const recommendations: string[] = [];

    // Range-based recommendations
    if (scenarioRange.spread > 15) {
      recommendations.push(
        'High uncertainty: Consider hedging strategies and scenario planning'
      );
    }

    // Trend-based recommendations
    const baseDelta = base.predictiveCOGRI.delta;
    if (baseDelta > 5) {
      recommendations.push(
        'Rising risk trend: Review exposure to high-risk markets and consider diversification'
      );
    } else if (baseDelta < -5) {
      recommendations.push(
        'Improving risk profile: Potential opportunity to expand in improving markets'
      );
    }

    // Confidence-based recommendations
    if (base.confidenceFactors.overall < 0.7) {
      recommendations.push(
        'Lower forecast confidence: Monitor developments closely and update assessment frequently'
      );
    }

    // Event-based recommendations
    const criticalEvents = base.appliedEvents.filter(e => e.riskLevel === 'CRITICAL');
    if (criticalEvents.length > 0) {
      recommendations.push(
        `Critical events identified: Develop contingency plans for ${criticalEvents[0].event}`
      );
    }

    return recommendations;
  }

  // ==========================================================================
  // TIME SERIES HELPERS
  // ==========================================================================

  /**
   * Determine trend direction
   */
  private determineTrendDirection(
    forecasts: TimeSeriesForecast['forecasts']
  ): TimeSeriesForecast['trendDirection'] {
    const scores = [
      forecasts['6m'].predictedScore,
      forecasts['1y'].predictedScore,
      forecasts['2y'].predictedScore,
      forecasts['5y'].predictedScore
    ];

    // Calculate trend
    let improvingCount = 0;
    let deterioratingCount = 0;

    for (let i = 1; i < scores.length; i++) {
      const change = scores[i] - scores[i - 1];
      if (change > 2) deterioratingCount++;
      else if (change < -2) improvingCount++;
    }

    if (improvingCount > deterioratingCount) return 'IMPROVING';
    if (deterioratingCount > improvingCount) return 'DETERIORATING';
    return 'STABLE';
  }

  /**
   * Calculate volatility index
   */
  private calculateVolatilityIndex(
    forecasts: TimeSeriesForecast['forecasts']
  ): number {
    const scores = [
      forecasts['6m'].predictedScore,
      forecasts['1y'].predictedScore,
      forecasts['2y'].predictedScore,
      forecasts['5y'].predictedScore
    ];

    // Calculate standard deviation
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-100 scale
    return Math.min(100, (stdDev / mean) * 100);
  }

  /**
   * Calculate forecast reliability
   */
  private calculateForecastReliability(
    results: PredictiveCalculationResult[]
  ): number {
    // Average confidence across all time horizons
    const avgConfidence = results.reduce(
      (sum, r) => sum + r.confidenceFactors.overall,
      0
    ) / results.length;

    return avgConfidence;
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update engine configuration
   */
  updateConfig(config: Partial<CalculationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Predictive Engine] Configuration updated:', config);
  }

  /**
   * Get current configuration
   */
  getConfig(): CalculationConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let engineInstance: PredictiveCalculationEngine | null = null;

/**
 * Get singleton instance
 */
export function getPredictiveEngine(): PredictiveCalculationEngine {
  if (!engineInstance) {
    engineInstance = new PredictiveCalculationEngine();
  }
  return engineInstance;
}

/**
 * Initialize predictive engine
 */
export function initializePredictiveEngine(
  config?: Partial<CalculationConfig>
): PredictiveCalculationEngine {
  const engine = getPredictiveEngine();
  
  if (config) {
    engine.updateConfig(config);
  }
  
  return engine;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick predictive COGRI calculation
 */
export async function calculatePredictiveCOGRI(
  input: PredictiveCalculationInput
): Promise<PredictiveCalculationResult> {
  return getPredictiveEngine().calculatePredictiveCOGRI(input);
}

/**
 * Quick scenario analysis
 */
export async function calculateScenarioAnalysis(
  ticker: string,
  companyName: string,
  sector: string,
  currentCOGRI: number,
  countryExposures: PredictiveCalculationInput['countryExposures'],
  timeHorizon?: TimeHorizon
): Promise<ScenarioAnalysis> {
  return getPredictiveEngine().calculateScenarioAnalysis(
    ticker,
    companyName,
    sector,
    currentCOGRI,
    countryExposures,
    timeHorizon
  );
}

/**
 * Quick time series forecast
 */
export async function calculateTimeSeriesForecast(
  ticker: string,
  companyName: string,
  sector: string,
  currentCOGRI: number,
  countryExposures: PredictiveCalculationInput['countryExposures'],
  scenario?: ScenarioType
): Promise<TimeSeriesForecast> {
  return getPredictiveEngine().calculateTimeSeriesForecast(
    ticker,
    companyName,
    sector,
    currentCOGRI,
    countryExposures,
    scenario
  );
}