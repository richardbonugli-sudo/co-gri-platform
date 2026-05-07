/**
 * ML Prediction Service
 * 
 * Loads trained ML models and generates multiplier recommendations with confidence scores.
 * Supports A/B testing framework and real-time predictions for COGRI assessments.
 * 
 * Phase 2 Task 3 - Part 3 of 5
 */

import { mlModelTrainer, type TrainedModel, type PredictionInput, type ModelWeights } from './mlModelTrainer';
import { mlHistoricalDataCollector } from './mlHistoricalDataCollector';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MultiplierPrediction {
  predictedMultiplier: number;
  confidence: number; // 0-1 scale
  predictionRange: {
    lower: number; // Lower bound (confidence interval)
    upper: number; // Upper bound (confidence interval)
  };
  modelUsed: {
    id: string;
    version: string;
    algorithm: string;
  };
  timestamp: Date;
}

export interface PredictionComparison {
  ticker: string;
  sector: string;
  
  // Current multipliers
  currentSectorMultiplier: number;
  currentChannelMultiplier: number;
  currentDynamicAdjustment: number;
  currentTotalMultiplier: number;
  
  // ML predictions
  mlPredictedAdjustment: number;
  mlPredictedTotalMultiplier: number;
  mlConfidence: number;
  
  // Comparison
  difference: number; // ML - Current
  percentageDifference: number;
  recommendation: 'increase' | 'decrease' | 'maintain';
  
  // Impact analysis
  expectedScoreImpact: number;
  riskLevelChange?: string;
}

export interface ABTestGroup {
  groupId: string;
  name: string;
  description: string;
  useMLPredictions: boolean;
  tickers: string[];
  startDate: Date;
  endDate?: Date;
  
  // Performance metrics
  metrics?: {
    avgAccuracy: number;
    avgPredictionError: number;
    materializationRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
}

export interface ABTestResult {
  testId: string;
  controlGroup: ABTestGroup;
  treatmentGroup: ABTestGroup;
  
  // Comparison metrics
  comparison: {
    accuracyImprovement: number;
    errorReduction: number;
    materializationDetectionImprovement: number;
  };
  
  // Statistical significance
  statisticalSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceLevel: number;
  };
  
  recommendation: 'adopt_ml' | 'keep_current' | 'needs_more_data';
}

export interface PredictionHistory {
  id: string;
  ticker: string;
  timestamp: Date;
  prediction: MultiplierPrediction;
  actualOutcome?: {
    actualMultiplier: number;
    actualRiskScore: number;
    materializationOccurred: boolean;
  };
  predictionError?: number;
}

// ============================================================================
// Feature Engineering Helper (reused from trainer)
// ============================================================================

class PredictionFeatureEngineering {
  private sectorEncoding: Record<string, number> = {
    'Technology': 0,
    'Consumer Discretionary': 1,
    'Financials': 2,
    'Energy': 3,
    'Healthcare': 4,
    'Industrials': 5,
    'Materials': 6,
    'Consumer Staples': 7,
    'Utilities': 8,
    'Real Estate': 9,
    'Communication Services': 10,
  };
  
  private featureMeans: Record<string, number> = {};
  private featureStds: Record<string, number> = {};
  
  public setNormalizationParams(means: Record<string, number>, stds: Record<string, number>): void {
    this.featureMeans = means;
    this.featureStds = stds;
  }
  
  public encodeSector(sector: string): number {
    return this.sectorEncoding[sector] || 0;
  }
  
  public extractFeatures(input: PredictionInput): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Encode sector
    features.sectorEncoded = this.encodeSector(input.sector);
    
    // Geographic features
    features.topCountryExposure = input.topCountryExposure;
    features.geographicConcentration = input.geographicConcentration;
    features.highRiskCountryExposure = input.highRiskCountryExposure;
    features.emergingMarketExposure = input.emergingMarketExposure;
    
    // Channel features
    features.revenueChannelWeight = input.revenueChannelWeight;
    features.supplyChannelWeight = input.supplyChannelWeight;
    features.assetsChannelWeight = input.assetsChannelWeight;
    features.financialChannelWeight = input.financialChannelWeight;
    
    // Event features
    features.activeEventCount = input.activeEventCount;
    features.maxEventSeverity = input.maxEventSeverity;
    features.avgEventSeverity = input.avgEventSeverity;
    features.sanctionEventsCount = input.sanctionEventsCount;
    features.conflictEventsCount = input.conflictEventsCount;
    
    // Market features
    features.marketStressIndex = input.marketStressIndex;
    features.currencyVolatility = input.currencyVolatility;
    features.commodityVolatility = input.commodityVolatility;
    
    // Current multipliers
    features.sectorMultiplier = input.sectorMultiplier;
    features.baseChannelMultiplier = input.baseChannelMultiplier;
    
    // Engineered features
    features.riskScore = (
      input.highRiskCountryExposure * 0.4 +
      input.geographicConcentration * 0.3 +
      input.maxEventSeverity * 0.3
    );
    
    features.channelDiversity = 1 - Math.pow(
      Math.pow(input.revenueChannelWeight, 2) +
      Math.pow(input.supplyChannelWeight, 2) +
      Math.pow(input.assetsChannelWeight, 2) +
      Math.pow(input.financialChannelWeight, 2),
      0.5
    );
    
    return features;
  }
  
  public normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    Object.keys(features).forEach(key => {
      const mean = this.featureMeans[key] || 0;
      const std = this.featureStds[key] || 1;
      normalized[key] = (features[key] - mean) / std;
    });
    
    return normalized;
  }
}

// ============================================================================
// ML Prediction Service
// ============================================================================

class MLPredictionServiceClass {
  private featureEngineering: PredictionFeatureEngineering;
  private activeModel: TrainedModel | null = null;
  private predictionHistory: Map<string, PredictionHistory[]> = new Map();
  private abTests: Map<string, ABTestGroup> = new Map();
  
  constructor() {
    this.featureEngineering = new PredictionFeatureEngineering();
    this.initializeDefaultModel();
  }
  
  /**
   * Initialize with the latest trained model
   */
  private initializeDefaultModel(): void {
    const latestModel = mlModelTrainer.getLatestModel();
    if (latestModel) {
      this.loadModel(latestModel.id);
    }
  }
  
  /**
   * Load a specific trained model
   */
  public loadModel(modelId: string): boolean {
    const model = mlModelTrainer.getModel(modelId);
    if (!model) {
      console.error(`[ML Prediction] Model ${modelId} not found`);
      return false;
    }
    
    this.activeModel = model;
    console.log(`[ML Prediction] Loaded model ${model.id} (${model.version})`);
    console.log(`[ML Prediction] Model R² Score: ${model.metrics.r2Score.toFixed(4)}`);
    console.log(`[ML Prediction] Model MAE: ${model.metrics.mae.toFixed(4)}`);
    
    return true;
  }
  
  /**
   * Make a prediction for a given input
   */
  public predict(input: PredictionInput): MultiplierPrediction {
    if (!this.activeModel) {
      throw new Error('No model loaded. Please load a model first.');
    }
    
    console.log(`[ML Prediction] Making prediction for ${input.sector} sector`);
    
    // Extract and normalize features
    const features = this.featureEngineering.extractFeatures(input);
    const normalizedFeatures = this.featureEngineering.normalizeFeatures(features);
    
    // Make prediction using model weights
    const weights = this.activeModel.weights;
    let prediction = weights.intercept;
    
    Object.keys(weights.coefficients).forEach(feature => {
      const value = normalizedFeatures[feature] || 0;
      prediction += weights.coefficients[feature] * value;
    });
    
    // Calculate confidence based on model metrics and input characteristics
    const confidence = this.calculateConfidence(input, this.activeModel);
    
    // Calculate prediction interval (95% confidence)
    const predictionStd = this.activeModel.metrics.residualStd || this.activeModel.metrics.rmse;
    const marginOfError = 1.96 * predictionStd; // 95% confidence interval
    
    const result: MultiplierPrediction = {
      predictedMultiplier: Math.max(0, prediction), // Ensure non-negative
      confidence,
      predictionRange: {
        lower: Math.max(0, prediction - marginOfError),
        upper: prediction + marginOfError,
      },
      modelUsed: {
        id: this.activeModel.id,
        version: this.activeModel.version,
        algorithm: this.activeModel.algorithm,
      },
      timestamp: new Date(),
    };
    
    console.log(`[ML Prediction] Predicted multiplier: ${result.predictedMultiplier.toFixed(4)}`);
    console.log(`[ML Prediction] Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`[ML Prediction] Range: [${result.predictionRange.lower.toFixed(4)}, ${result.predictionRange.upper.toFixed(4)}]`);
    
    return result;
  }
  
  /**
   * Calculate prediction confidence based on model metrics and input characteristics
   */
  private calculateConfidence(input: PredictionInput, model: TrainedModel): number {
    // Base confidence from model R² score
    let confidence = model.metrics.r2Score;
    
    // Adjust for cross-validation consistency
    if (model.metrics.avgCVR2) {
      const cvConsistency = 1 - Math.abs(model.metrics.r2Score - model.metrics.avgCVR2);
      confidence *= (0.7 + 0.3 * cvConsistency);
    }
    
    // Penalize for high-risk scenarios (more uncertainty)
    const riskFactor = input.highRiskCountryExposure / 100;
    confidence *= (1 - 0.2 * riskFactor);
    
    // Penalize for high event count (more volatility)
    const eventFactor = Math.min(input.activeEventCount / 10, 1);
    confidence *= (1 - 0.15 * eventFactor);
    
    // Penalize for high market stress
    const stressFactor = input.marketStressIndex / 100;
    confidence *= (1 - 0.1 * stressFactor);
    
    // Ensure confidence is between 0 and 1
    return Math.max(0.1, Math.min(1.0, confidence));
  }
  
  /**
   * Compare ML prediction with current multipliers
   */
  public comparePrediction(
    ticker: string,
    input: PredictionInput,
    currentDynamicAdjustment: number,
    rawScore: number
  ): PredictionComparison {
    const prediction = this.predict(input);
    
    const currentTotalMultiplier = 
      input.sectorMultiplier * input.baseChannelMultiplier * (1 + currentDynamicAdjustment);
    
    const mlPredictedTotalMultiplier = 
      input.sectorMultiplier * input.baseChannelMultiplier * (1 + prediction.predictedMultiplier);
    
    const difference = prediction.predictedMultiplier - currentDynamicAdjustment;
    const percentageDifference = (difference / (currentDynamicAdjustment || 1)) * 100;
    
    // Determine recommendation
    let recommendation: 'increase' | 'decrease' | 'maintain';
    if (Math.abs(difference) < 0.02) {
      recommendation = 'maintain';
    } else if (difference > 0) {
      recommendation = 'increase';
    } else {
      recommendation = 'decrease';
    }
    
    // Calculate expected score impact
    const currentFinalScore = rawScore * currentTotalMultiplier;
    const mlFinalScore = rawScore * mlPredictedTotalMultiplier;
    const expectedScoreImpact = mlFinalScore - currentFinalScore;
    
    // Determine risk level change
    let riskLevelChange: string | undefined;
    if (Math.abs(expectedScoreImpact) > 5) {
      if (expectedScoreImpact > 0) {
        riskLevelChange = 'Increase risk level';
      } else {
        riskLevelChange = 'Decrease risk level';
      }
    }
    
    const comparison: PredictionComparison = {
      ticker,
      sector: input.sector,
      currentSectorMultiplier: input.sectorMultiplier,
      currentChannelMultiplier: input.baseChannelMultiplier,
      currentDynamicAdjustment,
      currentTotalMultiplier,
      mlPredictedAdjustment: prediction.predictedMultiplier,
      mlPredictedTotalMultiplier,
      mlConfidence: prediction.confidence,
      difference,
      percentageDifference,
      recommendation,
      expectedScoreImpact,
      riskLevelChange,
    };
    
    console.log(`[ML Prediction] Comparison for ${ticker}:`);
    console.log(`  Current adjustment: ${currentDynamicAdjustment.toFixed(4)}`);
    console.log(`  ML predicted adjustment: ${prediction.predictedMultiplier.toFixed(4)}`);
    console.log(`  Difference: ${difference.toFixed(4)} (${percentageDifference.toFixed(1)}%)`);
    console.log(`  Recommendation: ${recommendation}`);
    console.log(`  Expected score impact: ${expectedScoreImpact > 0 ? '+' : ''}${expectedScoreImpact.toFixed(2)}`);
    
    return comparison;
  }
  
  /**
   * Record prediction for historical tracking
   */
  public recordPrediction(
    ticker: string,
    prediction: MultiplierPrediction
  ): void {
    const history: PredictionHistory = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker,
      timestamp: new Date(),
      prediction,
    };
    
    if (!this.predictionHistory.has(ticker)) {
      this.predictionHistory.set(ticker, []);
    }
    
    this.predictionHistory.get(ticker)!.push(history);
    console.log(`[ML Prediction] Recorded prediction for ${ticker}`);
  }
  
  /**
   * Update prediction with actual outcome
   */
  public updatePredictionOutcome(
    predictionId: string,
    actualMultiplier: number,
    actualRiskScore: number,
    materializationOccurred: boolean
  ): void {
    // Find prediction in history
    for (const [ticker, histories] of this.predictionHistory.entries()) {
      const history = histories.find(h => h.id === predictionId);
      if (history) {
        history.actualOutcome = {
          actualMultiplier,
          actualRiskScore,
          materializationOccurred,
        };
        history.predictionError = Math.abs(
          history.prediction.predictedMultiplier - actualMultiplier
        );
        
        console.log(`[ML Prediction] Updated outcome for prediction ${predictionId}`);
        console.log(`  Prediction error: ${history.predictionError.toFixed(4)}`);
        break;
      }
    }
  }
  
  /**
   * Get prediction accuracy for a ticker
   */
  public getPredictionAccuracy(ticker: string): {
    avgError: number;
    avgConfidence: number;
    totalPredictions: number;
    predictionsWithOutcome: number;
  } | null {
    const histories = this.predictionHistory.get(ticker);
    if (!histories || histories.length === 0) {
      return null;
    }
    
    const withOutcome = histories.filter(h => h.actualOutcome !== undefined);
    
    if (withOutcome.length === 0) {
      return {
        avgError: 0,
        avgConfidence: histories.reduce((sum, h) => sum + h.prediction.confidence, 0) / histories.length,
        totalPredictions: histories.length,
        predictionsWithOutcome: 0,
      };
    }
    
    const avgError = withOutcome.reduce((sum, h) => sum + (h.predictionError || 0), 0) / withOutcome.length;
    const avgConfidence = withOutcome.reduce((sum, h) => sum + h.prediction.confidence, 0) / withOutcome.length;
    
    return {
      avgError,
      avgConfidence,
      totalPredictions: histories.length,
      predictionsWithOutcome: withOutcome.length,
    };
  }
  
  /**
   * Create A/B test group
   */
  public createABTestGroup(
    name: string,
    description: string,
    useMLPredictions: boolean,
    tickers: string[]
  ): ABTestGroup {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const group: ABTestGroup = {
      groupId,
      name,
      description,
      useMLPredictions,
      tickers,
      startDate: new Date(),
    };
    
    this.abTests.set(groupId, group);
    
    console.log(`[ML Prediction] Created A/B test group: ${name}`);
    console.log(`  Group ID: ${groupId}`);
    console.log(`  Use ML: ${useMLPredictions}`);
    console.log(`  Tickers: ${tickers.join(', ')}`);
    
    return group;
  }
  
  /**
   * Run A/B test comparison
   */
  public runABTest(
    controlGroupId: string,
    treatmentGroupId: string
  ): ABTestResult {
    const controlGroup = this.abTests.get(controlGroupId);
    const treatmentGroup = this.abTests.get(treatmentGroupId);
    
    if (!controlGroup || !treatmentGroup) {
      throw new Error('Invalid group IDs for A/B test');
    }
    
    // Calculate metrics for each group
    const controlMetrics = this.calculateGroupMetrics(controlGroup);
    const treatmentMetrics = this.calculateGroupMetrics(treatmentGroup);
    
    controlGroup.metrics = controlMetrics;
    treatmentGroup.metrics = treatmentMetrics;
    
    // Compare metrics
    const accuracyImprovement = treatmentMetrics.avgAccuracy - controlMetrics.avgAccuracy;
    const errorReduction = controlMetrics.avgPredictionError - treatmentMetrics.avgPredictionError;
    const materializationDetectionImprovement = 
      treatmentMetrics.materializationRate - controlMetrics.materializationRate;
    
    // Calculate statistical significance (simplified t-test)
    const pValue = this.calculatePValue(controlMetrics, treatmentMetrics);
    const isSignificant = pValue < 0.05;
    const confidenceLevel = (1 - pValue) * 100;
    
    // Make recommendation
    let recommendation: 'adopt_ml' | 'keep_current' | 'needs_more_data';
    if (!isSignificant) {
      recommendation = 'needs_more_data';
    } else if (accuracyImprovement > 0.05 && errorReduction > 0) {
      recommendation = 'adopt_ml';
    } else {
      recommendation = 'keep_current';
    }
    
    const result: ABTestResult = {
      testId: `test_${Date.now()}`,
      controlGroup,
      treatmentGroup,
      comparison: {
        accuracyImprovement,
        errorReduction,
        materializationDetectionImprovement,
      },
      statisticalSignificance: {
        pValue,
        isSignificant,
        confidenceLevel,
      },
      recommendation,
    };
    
    console.log(`[ML Prediction] A/B Test Results:`);
    console.log(`  Accuracy improvement: ${(accuracyImprovement * 100).toFixed(2)}%`);
    console.log(`  Error reduction: ${errorReduction.toFixed(4)}`);
    console.log(`  Statistical significance: ${isSignificant ? 'YES' : 'NO'} (p=${pValue.toFixed(4)})`);
    console.log(`  Recommendation: ${recommendation}`);
    
    return result;
  }
  
  /**
   * Calculate metrics for an A/B test group
   */
  private calculateGroupMetrics(group: ABTestGroup): ABTestGroup['metrics'] {
    let totalError = 0;
    let totalAccuracy = 0;
    let materializationCount = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalWithOutcome = 0;
    
    group.tickers.forEach(ticker => {
      const accuracy = this.getPredictionAccuracy(ticker);
      if (accuracy && accuracy.predictionsWithOutcome > 0) {
        totalError += accuracy.avgError;
        totalAccuracy += (1 - accuracy.avgError); // Simplified accuracy
        totalWithOutcome++;
        
        // Calculate materialization metrics (simplified)
        const histories = this.predictionHistory.get(ticker) || [];
        histories.forEach(h => {
          if (h.actualOutcome) {
            if (h.actualOutcome.materializationOccurred) {
              materializationCount++;
              if (h.prediction.predictedMultiplier < 0.1) {
                falseNegatives++;
              }
            } else {
              if (h.prediction.predictedMultiplier > 0.2) {
                falsePositives++;
              }
            }
          }
        });
      }
    });
    
    const totalPredictions = totalWithOutcome || 1;
    
    return {
      avgAccuracy: totalAccuracy / totalPredictions,
      avgPredictionError: totalError / totalPredictions,
      materializationRate: materializationCount / totalPredictions,
      falsePositiveRate: falsePositives / totalPredictions,
      falseNegativeRate: falseNegatives / totalPredictions,
    };
  }
  
  /**
   * Calculate p-value for statistical significance (simplified)
   */
  private calculatePValue(
    controlMetrics: ABTestGroup['metrics'],
    treatmentMetrics: ABTestGroup['metrics']
  ): number {
    if (!controlMetrics || !treatmentMetrics) {
      return 1.0;
    }
    
    // Simplified calculation based on accuracy difference
    const accuracyDiff = Math.abs(
      treatmentMetrics.avgAccuracy - controlMetrics.avgAccuracy
    );
    
    // Simplified p-value estimation
    if (accuracyDiff > 0.1) return 0.01;
    if (accuracyDiff > 0.05) return 0.05;
    if (accuracyDiff > 0.02) return 0.1;
    return 0.5;
  }
  
  /**
   * Get active model information
   */
  public getActiveModel(): TrainedModel | null {
    return this.activeModel;
  }
  
  /**
   * Get prediction history for a ticker
   */
  public getPredictionHistory(ticker: string): PredictionHistory[] {
    return this.predictionHistory.get(ticker) || [];
  }
  
  /**
   * Get all A/B test groups
   */
  public getABTestGroups(): ABTestGroup[] {
    return Array.from(this.abTests.values());
  }
  
  /**
   * Batch predictions for multiple inputs
   */
  public batchPredict(inputs: PredictionInput[]): MultiplierPrediction[] {
    console.log(`[ML Prediction] Making batch predictions for ${inputs.length} inputs`);
    return inputs.map(input => this.predict(input));
  }
  
  /**
   * Get model performance summary
   */
  public getModelPerformanceSummary(): {
    modelInfo: {
      id: string;
      version: string;
      algorithm: string;
      trainingDate: Date;
    };
    metrics: {
      r2Score: number;
      mae: number;
      rmse: number;
      avgCVR2: number;
    };
    predictionStats: {
      totalPredictions: number;
      avgConfidence: number;
      avgError: number;
    };
  } | null {
    if (!this.activeModel) {
      return null;
    }
    
    // Calculate prediction statistics
    let totalPredictions = 0;
    let totalConfidence = 0;
    let totalError = 0;
    let totalWithError = 0;
    
    for (const histories of this.predictionHistory.values()) {
      totalPredictions += histories.length;
      histories.forEach(h => {
        totalConfidence += h.prediction.confidence;
        if (h.predictionError !== undefined) {
          totalError += h.predictionError;
          totalWithError++;
        }
      });
    }
    
    return {
      modelInfo: {
        id: this.activeModel.id,
        version: this.activeModel.version,
        algorithm: this.activeModel.algorithm,
        trainingDate: this.activeModel.trainingDate,
      },
      metrics: {
        r2Score: this.activeModel.metrics.r2Score,
        mae: this.activeModel.metrics.mae,
        rmse: this.activeModel.metrics.rmse,
        avgCVR2: this.activeModel.metrics.avgCVR2 || 0,
      },
      predictionStats: {
        totalPredictions,
        avgConfidence: totalPredictions > 0 ? totalConfidence / totalPredictions : 0,
        avgError: totalWithError > 0 ? totalError / totalWithError : 0,
      },
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const mlPredictionService = new MLPredictionServiceClass();

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Make a prediction
 * 
 * // Load a trained model
 * mlPredictionService.loadModel('model_123456');
 * 
 * // Prepare input
 * const input: PredictionInput = {
 *   sector: 'Technology',
 *   topCountryExposure: 45.5,
 *   geographicConcentration: 35.2,
 *   highRiskCountryExposure: 25.0,
 *   emergingMarketExposure: 30.0,
 *   revenueChannelWeight: 0.45,
 *   supplyChannelWeight: 0.35,
 *   assetsChannelWeight: 0.12,
 *   financialChannelWeight: 0.08,
 *   activeEventCount: 3,
 *   maxEventSeverity: 7.5,
 *   avgEventSeverity: 6.0,
 *   sanctionEventsCount: 1,
 *   conflictEventsCount: 1,
 *   marketStressIndex: 65.0,
 *   currencyVolatility: 0.25,
 *   commodityVolatility: 0.18,
 *   sectorMultiplier: 1.10,
 *   baseChannelMultiplier: 1.025,
 * };
 * 
 * // Make prediction
 * const prediction = mlPredictionService.predict(input);
 * console.log('Predicted multiplier:', prediction.predictedMultiplier);
 * console.log('Confidence:', prediction.confidence);
 * 
 * // Compare with current
 * const comparison = mlPredictionService.comparePrediction(
 *   'AAPL',
 *   input,
 *   0.15, // current dynamic adjustment
 *   46.15 // raw score
 * );
 * console.log('Recommendation:', comparison.recommendation);
 * console.log('Expected impact:', comparison.expectedScoreImpact);
 */
