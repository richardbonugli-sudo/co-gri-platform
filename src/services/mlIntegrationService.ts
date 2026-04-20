/**
 * ML Integration Service
 * 
 * Integrates ML-based calibration with dynamic adjustment rules from Phase 2 Task 2.
 * Provides a unified interface for applying ML predictions to enhance dynamic adjustments.
 * 
 * Phase 2 Task 3 - Integration Layer
 */

import { mlPredictionService, type MultiplierPrediction, type PredictionInput } from './mlPredictionService';
import { calibrationRecommendationEngine, type MultiplierRecommendation } from './calibrationRecommendationEngine';
import { dynamicAdjustmentRules } from './dynamicAdjustmentRules';
import { geopoliticalEventMonitor } from './geopoliticalEventMonitor';
import { marketConditionAnalyzer } from './marketConditionAnalyzer';
import { featureFlags, isFeatureEnabled } from '../config/featureFlags';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MLEnhancedAdjustment {
  // Base dynamic adjustment (from Task 2)
  baseDynamicAdjustment: number;
  
  // ML prediction
  mlPredictedAdjustment: number;
  mlConfidence: number;
  
  // Final adjustment (blended or ML-only)
  finalAdjustment: number;
  
  // Blending strategy used
  strategy: 'ml_only' | 'rule_based_only' | 'weighted_blend' | 'confidence_based';
  blendWeight: number; // 0-1, weight given to ML prediction
  
  // Metadata
  recommendation?: MultiplierRecommendation;
  timestamp: Date;
}

export interface MLIntegrationConfig {
  // Blending strategy
  defaultStrategy: 'ml_only' | 'rule_based_only' | 'weighted_blend' | 'confidence_based';
  
  // Confidence thresholds
  highConfidenceThreshold: number; // Default 0.8
  lowConfidenceThreshold: number; // Default 0.5
  
  // Blending weights
  mlWeight: number; // Default 0.7 (70% ML, 30% rules)
  rulesWeight: number; // Default 0.3
  
  // Safety limits
  maxAdjustmentChange: number; // Maximum change from base adjustment
  requireApprovalThreshold: number; // Threshold for requiring human approval
}

// ============================================================================
// ML Integration Service
// ============================================================================

class MLIntegrationService {
  private config: MLIntegrationConfig = {
    defaultStrategy: 'confidence_based',
    highConfidenceThreshold: 0.8,
    lowConfidenceThreshold: 0.5,
    mlWeight: 0.7,
    rulesWeight: 0.3,
    maxAdjustmentChange: 0.3,
    requireApprovalThreshold: 0.2,
  };
  
  /**
   * Get enhanced dynamic adjustment using ML predictions
   */
  public getMLEnhancedAdjustment(
    ticker: string,
    sector: string,
    geographicExposure: {
      country: string;
      percentage: number;
      channel: 'revenue' | 'supply' | 'assets' | 'financial';
    }[],
    sectorMultiplier: number,
    baseChannelMultiplier: number
  ): MLEnhancedAdjustment {
    console.log(`[ML Integration] Getting ML-enhanced adjustment for ${ticker}`);
    
    // Check if ML calibration is enabled
    if (!isFeatureEnabled('enableMLCalibration')) {
      console.log('[ML Integration] ML calibration disabled, using rule-based only');
      const baseDynamic = this.getBaseDynamicAdjustment(ticker, geographicExposure);
      return {
        baseDynamicAdjustment: baseDynamic,
        mlPredictedAdjustment: 0,
        mlConfidence: 0,
        finalAdjustment: baseDynamic,
        strategy: 'rule_based_only',
        blendWeight: 0,
        timestamp: new Date(),
      };
    }
    
    // Get base dynamic adjustment from Task 2 rules
    const baseDynamicAdjustment = this.getBaseDynamicAdjustment(ticker, geographicExposure);
    
    // Prepare ML prediction input
    const predictionInput = this.preparePredictionInput(
      sector,
      geographicExposure,
      sectorMultiplier,
      baseChannelMultiplier
    );
    
    // Get ML prediction
    const mlPrediction = mlPredictionService.predict(predictionInput);
    
    // Determine blending strategy
    const strategy = this.determineBlendingStrategy(mlPrediction.confidence);
    
    // Calculate final adjustment
    const { finalAdjustment, blendWeight } = this.blendAdjustments(
      baseDynamicAdjustment,
      mlPrediction.predictedMultiplier,
      mlPrediction.confidence,
      strategy
    );
    
    // Apply safety limits
    const safeFinalAdjustment = this.applySafetyLimits(
      baseDynamicAdjustment,
      finalAdjustment
    );
    
    console.log(`[ML Integration] Base: ${baseDynamicAdjustment.toFixed(4)}, ML: ${mlPrediction.predictedMultiplier.toFixed(4)}, Final: ${safeFinalAdjustment.toFixed(4)}`);
    console.log(`[ML Integration] Strategy: ${strategy}, Blend Weight: ${blendWeight.toFixed(2)}`);
    
    return {
      baseDynamicAdjustment,
      mlPredictedAdjustment: mlPrediction.predictedMultiplier,
      mlConfidence: mlPrediction.confidence,
      finalAdjustment: safeFinalAdjustment,
      strategy,
      blendWeight,
      timestamp: new Date(),
    };
  }
  
  /**
   * Get base dynamic adjustment using Task 2 rules
   */
  private getBaseDynamicAdjustment(
    ticker: string,
    geographicExposure: {
      country: string;
      percentage: number;
      channel: 'revenue' | 'supply' | 'assets' | 'financial';
    }[]
  ): number {
    // Get geopolitical events
    const events = geopoliticalEventMonitor.getActiveEvents();
    
    // Get market conditions
    const marketConditions = marketConditionAnalyzer.analyzeMarketConditions();
    
    // Calculate base adjustment using dynamic rules
    let totalAdjustment = 0;
    
    // Apply rules for each country exposure
    geographicExposure.forEach(exposure => {
      const countryEvents = events.filter(e => 
        e.affectedCountries.includes(exposure.country)
      );
      
      countryEvents.forEach(event => {
        const eventAdjustment = dynamicAdjustmentRules.calculateEventAdjustment(
          event,
          exposure.channel,
          exposure.percentage
        );
        totalAdjustment += eventAdjustment;
      });
    });
    
    // Apply market condition adjustments
    const marketAdjustment = dynamicAdjustmentRules.calculateMarketAdjustment(
      marketConditions,
      geographicExposure
    );
    totalAdjustment += marketAdjustment;
    
    // Cap at 0.50 (50%)
    return Math.min(0.50, Math.max(0, totalAdjustment));
  }
  
  /**
   * Prepare prediction input for ML model
   */
  private preparePredictionInput(
    sector: string,
    geographicExposure: {
      country: string;
      percentage: number;
      channel: 'revenue' | 'supply' | 'assets' | 'financial';
    }[],
    sectorMultiplier: number,
    baseChannelMultiplier: number
  ): PredictionInput {
    // Calculate geographic features
    const topCountry = geographicExposure.reduce((max, exp) => 
      exp.percentage > max.percentage ? exp : max
    , geographicExposure[0]);
    
    const geographicConcentration = this.calculateHHI(geographicExposure);
    const highRiskExposure = this.calculateHighRiskExposure(geographicExposure);
    const emergingMarketExposure = this.calculateEmergingMarketExposure(geographicExposure);
    
    // Calculate channel weights
    const channelWeights = this.calculateChannelWeights(geographicExposure);
    
    // Get event features
    const events = geopoliticalEventMonitor.getActiveEvents();
    const eventFeatures = this.calculateEventFeatures(events);
    
    // Get market features
    const marketConditions = marketConditionAnalyzer.analyzeMarketConditions();
    
    return {
      sector,
      topCountryExposure: topCountry.percentage,
      geographicConcentration,
      highRiskCountryExposure: highRiskExposure,
      emergingMarketExposure,
      revenueChannelWeight: channelWeights.revenue,
      supplyChannelWeight: channelWeights.supply,
      assetsChannelWeight: channelWeights.assets,
      financialChannelWeight: channelWeights.financial,
      activeEventCount: events.length,
      maxEventSeverity: eventFeatures.maxSeverity,
      avgEventSeverity: eventFeatures.avgSeverity,
      sanctionEventsCount: eventFeatures.sanctionsCount,
      conflictEventsCount: eventFeatures.conflictsCount,
      marketStressIndex: marketConditions.stressIndex,
      currencyVolatility: marketConditions.currencyVolatility,
      commodityVolatility: marketConditions.commodityVolatility,
      sectorMultiplier,
      baseChannelMultiplier,
    };
  }
  
  /**
   * Calculate Herfindahl-Hirschman Index for geographic concentration
   */
  private calculateHHI(exposures: { country: string; percentage: number }[]): number {
    const countryTotals = new Map<string, number>();
    exposures.forEach(exp => {
      const current = countryTotals.get(exp.country) || 0;
      countryTotals.set(exp.country, current + exp.percentage);
    });
    
    let hhi = 0;
    countryTotals.forEach(percentage => {
      hhi += Math.pow(percentage, 2);
    });
    
    return hhi / 100;
  }
  
  /**
   * Calculate high-risk country exposure
   */
  private calculateHighRiskExposure(exposures: { country: string; percentage: number }[]): number {
    const highRiskCountries = ['Russia', 'China', 'Iran', 'North Korea', 'Venezuela', 'Belarus'];
    let total = 0;
    exposures.forEach(exp => {
      if (highRiskCountries.includes(exp.country)) {
        total += exp.percentage;
      }
    });
    return total;
  }
  
  /**
   * Calculate emerging market exposure
   */
  private calculateEmergingMarketExposure(exposures: { country: string; percentage: number }[]): number {
    const emergingMarkets = ['China', 'India', 'Brazil', 'Mexico', 'Turkey', 'Indonesia', 'Thailand', 'Vietnam'];
    let total = 0;
    exposures.forEach(exp => {
      if (emergingMarkets.includes(exp.country)) {
        total += exp.percentage;
      }
    });
    return total;
  }
  
  /**
   * Calculate channel weights
   */
  private calculateChannelWeights(exposures: { channel: string; percentage: number }[]) {
    const weights = { revenue: 0, supply: 0, assets: 0, financial: 0 };
    exposures.forEach(exp => {
      weights[exp.channel as keyof typeof weights] += exp.percentage;
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
   * Calculate event features
   */
  private calculateEventFeatures(events: any[]) {
    if (events.length === 0) {
      return { maxSeverity: 0, avgSeverity: 0, sanctionsCount: 0, conflictsCount: 0 };
    }
    
    const severities = events.map(e => e.severity);
    const maxSeverity = Math.max(...severities);
    const avgSeverity = severities.reduce((sum, s) => sum + s, 0) / severities.length;
    
    const sanctionsCount = events.filter(e => e.type === 'sanctions').length;
    const conflictsCount = events.filter(e => e.type === 'conflict').length;
    
    return { maxSeverity, avgSeverity, sanctionsCount, conflictsCount };
  }
  
  /**
   * Determine blending strategy based on ML confidence
   */
  private determineBlendingStrategy(confidence: number): MLEnhancedAdjustment['strategy'] {
    if (this.config.defaultStrategy !== 'confidence_based') {
      return this.config.defaultStrategy;
    }
    
    if (confidence >= this.config.highConfidenceThreshold) {
      return 'ml_only';
    } else if (confidence <= this.config.lowConfidenceThreshold) {
      return 'rule_based_only';
    } else {
      return 'weighted_blend';
    }
  }
  
  /**
   * Blend adjustments based on strategy
   */
  private blendAdjustments(
    baseAdjustment: number,
    mlAdjustment: number,
    confidence: number,
    strategy: MLEnhancedAdjustment['strategy']
  ): { finalAdjustment: number; blendWeight: number } {
    switch (strategy) {
      case 'ml_only':
        return { finalAdjustment: mlAdjustment, blendWeight: 1.0 };
      
      case 'rule_based_only':
        return { finalAdjustment: baseAdjustment, blendWeight: 0.0 };
      
      case 'weighted_blend':
        const mlWeight = this.config.mlWeight;
        const rulesWeight = this.config.rulesWeight;
        const blended = mlAdjustment * mlWeight + baseAdjustment * rulesWeight;
        return { finalAdjustment: blended, blendWeight: mlWeight };
      
      case 'confidence_based':
        // Use confidence as blend weight
        const confidenceWeight = confidence;
        const confidenceBlended = mlAdjustment * confidenceWeight + baseAdjustment * (1 - confidenceWeight);
        return { finalAdjustment: confidenceBlended, blendWeight: confidenceWeight };
      
      default:
        return { finalAdjustment: baseAdjustment, blendWeight: 0.0 };
    }
  }
  
  /**
   * Apply safety limits to prevent extreme adjustments
   */
  private applySafetyLimits(baseAdjustment: number, finalAdjustment: number): number {
    const maxChange = this.config.maxAdjustmentChange;
    const minAllowed = Math.max(0, baseAdjustment - maxChange);
    const maxAllowed = Math.min(0.50, baseAdjustment + maxChange);
    
    return Math.max(minAllowed, Math.min(maxAllowed, finalAdjustment));
  }
  
  /**
   * Check if human approval is required
   */
  public requiresApproval(enhancement: MLEnhancedAdjustment): boolean {
    const changeMagnitude = Math.abs(enhancement.finalAdjustment - enhancement.baseDynamicAdjustment);
    return changeMagnitude >= this.config.requireApprovalThreshold;
  }
  
  /**
   * Generate recommendation for ML-enhanced adjustment
   */
  public generateRecommendation(
    ticker: string,
    sector: string,
    enhancement: MLEnhancedAdjustment,
    currentMultipliers: {
      sector: number;
      channel: number;
      dynamic: number;
    },
    rawScore: number
  ): MultiplierRecommendation {
    // Create ML prediction object
    const mlPrediction: MultiplierPrediction = {
      predictedMultiplier: enhancement.mlPredictedAdjustment,
      confidence: enhancement.mlConfidence,
      predictionRange: {
        lower: enhancement.mlPredictedAdjustment * 0.9,
        upper: enhancement.mlPredictedAdjustment * 1.1,
      },
      modelUsed: {
        id: 'ml_integration',
        version: 'v1.0.0',
        algorithm: 'integrated',
      },
      timestamp: enhancement.timestamp,
    };
    
    return calibrationRecommendationEngine.generateRecommendation(
      ticker,
      sector,
      currentMultipliers,
      mlPrediction,
      rawScore
    );
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MLIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ML Integration] Configuration updated:', this.config);
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): MLIntegrationConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const mlIntegrationService = new MLIntegrationService();

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Get ML-enhanced dynamic adjustment
 * 
 * const enhancement = mlIntegrationService.getMLEnhancedAdjustment(
 *   'AAPL',
 *   'Technology',
 *   [
 *     { country: 'United States', percentage: 40, channel: 'revenue' },
 *     { country: 'China', percentage: 25, channel: 'supply' },
 *     { country: 'Germany', percentage: 15, channel: 'revenue' },
 *   ],
 *   1.10,
 *   1.025
 * );
 * 
 * console.log('Base adjustment:', enhancement.baseDynamicAdjustment);
 * console.log('ML predicted:', enhancement.mlPredictedAdjustment);
 * console.log('Final adjustment:', enhancement.finalAdjustment);
 * console.log('Strategy:', enhancement.strategy);
 * 
 * if (mlIntegrationService.requiresApproval(enhancement)) {
 *   const recommendation = mlIntegrationService.generateRecommendation(
 *     'AAPL',
 *     'Technology',
 *     enhancement,
 *     { sector: 1.10, channel: 1.025, dynamic: 0.15 },
 *     46.15
 *   );
 *   console.log('Approval required:', recommendation.approvalRequired);
 * }
 */
