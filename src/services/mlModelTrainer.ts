/**
 * ML Model Trainer Service
 * 
 * Implements regression models for multiplier prediction using historical data.
 * Supports multiple algorithms, model versioning, and comprehensive accuracy metrics.
 * 
 * Phase 2 Task 3 - Part 2 of 5
 */

import { mlHistoricalDataCollector, type TrainingDataPoint, type MLDataset } from './mlHistoricalDataCollector';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type RegressionAlgorithm = 'linear' | 'ridge' | 'polynomial' | 'ensemble';

export interface ModelWeights {
  intercept: number;
  coefficients: Record<string, number>;
}

export interface TrainedModel {
  id: string;
  version: string;
  algorithm: RegressionAlgorithm;
  weights: ModelWeights;
  trainingDate: Date;
  trainingDataSize: number;
  
  // Hyperparameters
  hyperparameters: {
    alpha?: number; // Ridge regression regularization
    degree?: number; // Polynomial degree
    learningRate?: number;
    iterations?: number;
  };
  
  // Performance metrics
  metrics: ModelMetrics;
  
  // Feature importance
  featureImportance: Record<string, number>;
  
  // Metadata
  metadata: {
    trainingDuration: number; // milliseconds
    datasetDateRange: { start: Date; end: Date };
    sectorDistribution: Record<string, number>;
  };
}

export interface ModelMetrics {
  // Regression metrics
  r2Score: number; // R-squared (coefficient of determination)
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mse: number; // Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  
  // Cross-validation metrics
  cvR2Scores?: number[];
  cvMAEScores?: number[];
  avgCVR2?: number;
  avgCVMAE?: number;
  
  // Additional metrics
  adjustedR2?: number;
  residualStd?: number;
}

export interface TrainingOptions {
  algorithm?: RegressionAlgorithm;
  testSplitRatio?: number; // Default 0.2 (20% test)
  crossValidationFolds?: number; // Default 5
  hyperparameters?: {
    alpha?: number;
    degree?: number;
    learningRate?: number;
    iterations?: number;
  };
  featureSelection?: string[]; // Specific features to use
  normalizeFeatures?: boolean; // Default true
}

export interface PredictionInput {
  sector: string;
  topCountryExposure: number;
  geographicConcentration: number;
  highRiskCountryExposure: number;
  emergingMarketExposure: number;
  revenueChannelWeight: number;
  supplyChannelWeight: number;
  assetsChannelWeight: number;
  financialChannelWeight: number;
  activeEventCount: number;
  maxEventSeverity: number;
  avgEventSeverity: number;
  sanctionEventsCount: number;
  conflictEventsCount: number;
  marketStressIndex: number;
  currencyVolatility: number;
  commodityVolatility: number;
  sectorMultiplier: number;
  baseChannelMultiplier: number;
}

// ============================================================================
// Feature Engineering and Preprocessing
// ============================================================================

class FeatureEngineering {
  private featureMeans: Record<string, number> = {};
  private featureStds: Record<string, number> = {};
  private sectorEncoding: Record<string, number> = {};
  
  /**
   * Encode categorical features (sector)
   */
  public encodeSector(sector: string): number {
    if (!this.sectorEncoding[sector]) {
      this.sectorEncoding[sector] = Object.keys(this.sectorEncoding).length;
    }
    return this.sectorEncoding[sector];
  }
  
  /**
   * Calculate normalization parameters from training data
   */
  public fitNormalization(dataPoints: TrainingDataPoint[]): void {
    const numericFeatures = this.extractNumericFeatures(dataPoints[0]);
    const featureNames = Object.keys(numericFeatures);
    
    // Calculate means
    featureNames.forEach(feature => {
      const values = dataPoints.map(dp => this.extractNumericFeatures(dp)[feature]);
      this.featureMeans[feature] = values.reduce((sum, v) => sum + v, 0) / values.length;
    });
    
    // Calculate standard deviations
    featureNames.forEach(feature => {
      const values = dataPoints.map(dp => this.extractNumericFeatures(dp)[feature]);
      const variance = values.reduce((sum, v) => 
        sum + Math.pow(v - this.featureMeans[feature], 2), 0
      ) / values.length;
      this.featureStds[feature] = Math.sqrt(variance) || 1; // Avoid division by zero
    });
  }
  
  /**
   * Normalize features using z-score normalization
   */
  public normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    Object.keys(features).forEach(key => {
      const mean = this.featureMeans[key] || 0;
      const std = this.featureStds[key] || 1;
      normalized[key] = (features[key] - mean) / std;
    });
    
    return normalized;
  }
  
  /**
   * Extract numeric features from training data point
   */
  public extractNumericFeatures(dataPoint: TrainingDataPoint | PredictionInput): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Encode sector if present
    if ('sector' in dataPoint) {
      features.sectorEncoded = this.encodeSector(dataPoint.sector);
    }
    
    // Geographic features
    features.topCountryExposure = dataPoint.topCountryExposure;
    features.geographicConcentration = dataPoint.geographicConcentration;
    features.highRiskCountryExposure = dataPoint.highRiskCountryExposure;
    features.emergingMarketExposure = dataPoint.emergingMarketExposure;
    
    // Channel features
    features.revenueChannelWeight = dataPoint.revenueChannelWeight;
    features.supplyChannelWeight = dataPoint.supplyChannelWeight;
    features.assetsChannelWeight = dataPoint.assetsChannelWeight;
    features.financialChannelWeight = dataPoint.financialChannelWeight;
    
    // Event features
    features.activeEventCount = dataPoint.activeEventCount;
    features.maxEventSeverity = dataPoint.maxEventSeverity;
    features.avgEventSeverity = dataPoint.avgEventSeverity;
    features.sanctionEventsCount = dataPoint.sanctionEventsCount;
    features.conflictEventsCount = dataPoint.conflictEventsCount;
    
    // Market features
    features.marketStressIndex = dataPoint.marketStressIndex;
    features.currencyVolatility = dataPoint.currencyVolatility;
    features.commodityVolatility = dataPoint.commodityVolatility;
    
    // Current multipliers
    features.sectorMultiplier = dataPoint.sectorMultiplier;
    features.baseChannelMultiplier = dataPoint.baseChannelMultiplier;
    
    // Engineered features
    features.riskScore = (
      dataPoint.highRiskCountryExposure * 0.4 +
      dataPoint.geographicConcentration * 0.3 +
      dataPoint.maxEventSeverity * 0.3
    );
    
    features.channelDiversity = 1 - Math.pow(
      Math.pow(dataPoint.revenueChannelWeight, 2) +
      Math.pow(dataPoint.supplyChannelWeight, 2) +
      Math.pow(dataPoint.assetsChannelWeight, 2) +
      Math.pow(dataPoint.financialChannelWeight, 2),
      0.5
    );
    
    return features;
  }
  
  /**
   * Create polynomial features
   */
  public createPolynomialFeatures(
    features: Record<string, number>,
    degree: number
  ): Record<string, number> {
    const polyFeatures = { ...features };
    const featureNames = Object.keys(features);
    
    // Add squared terms
    if (degree >= 2) {
      featureNames.forEach(name => {
        polyFeatures[`${name}_squared`] = Math.pow(features[name], 2);
      });
    }
    
    // Add interaction terms (selected pairs)
    if (degree >= 2) {
      polyFeatures.risk_market_interaction = 
        features.highRiskCountryExposure * features.marketStressIndex;
      polyFeatures.event_volatility_interaction = 
        features.maxEventSeverity * features.currencyVolatility;
      polyFeatures.concentration_risk_interaction = 
        features.geographicConcentration * features.highRiskCountryExposure;
    }
    
    return polyFeatures;
  }
}

// ============================================================================
// Regression Models Implementation
// ============================================================================

class RegressionModel {
  private weights: ModelWeights = { intercept: 0, coefficients: {} };
  
  /**
   * Linear Regression using Ordinary Least Squares (OLS)
   */
  public trainLinearRegression(
    X: Record<string, number>[],
    y: number[]
  ): ModelWeights {
    const n = X.length;
    const featureNames = Object.keys(X[0]);
    const p = featureNames.length;
    
    // Create design matrix (add intercept column)
    const XMatrix: number[][] = X.map(features => [
      1, // intercept
      ...featureNames.map(name => features[name])
    ]);
    
    // Calculate (X^T * X)
    const XTX = this.matrixMultiply(this.transpose(XMatrix), XMatrix);
    
    // Calculate (X^T * y)
    const XTy = this.matrixVectorMultiply(this.transpose(XMatrix), y);
    
    // Solve (X^T * X)^-1 * X^T * y
    const XTXInv = this.matrixInverse(XTX);
    const beta = this.matrixVectorMultiply(XTXInv, XTy);
    
    // Extract intercept and coefficients
    const intercept = beta[0];
    const coefficients: Record<string, number> = {};
    featureNames.forEach((name, i) => {
      coefficients[name] = beta[i + 1];
    });
    
    this.weights = { intercept, coefficients };
    return this.weights;
  }
  
  /**
   * Ridge Regression (L2 regularization)
   */
  public trainRidgeRegression(
    X: Record<string, number>[],
    y: number[],
    alpha: number = 1.0
  ): ModelWeights {
    const n = X.length;
    const featureNames = Object.keys(X[0]);
    const p = featureNames.length;
    
    // Create design matrix
    const XMatrix: number[][] = X.map(features => [
      1,
      ...featureNames.map(name => features[name])
    ]);
    
    // Calculate (X^T * X + alpha * I)
    const XTX = this.matrixMultiply(this.transpose(XMatrix), XMatrix);
    const identity = this.createIdentityMatrix(p + 1);
    identity[0][0] = 0; // Don't regularize intercept
    
    const regularized = this.matrixAdd(XTX, this.scalarMultiply(identity, alpha));
    
    // Calculate (X^T * y)
    const XTy = this.matrixVectorMultiply(this.transpose(XMatrix), y);
    
    // Solve
    const regularizedInv = this.matrixInverse(regularized);
    const beta = this.matrixVectorMultiply(regularizedInv, XTy);
    
    // Extract weights
    const intercept = beta[0];
    const coefficients: Record<string, number> = {};
    featureNames.forEach((name, i) => {
      coefficients[name] = beta[i + 1];
    });
    
    this.weights = { intercept, coefficients };
    return this.weights;
  }
  
  /**
   * Gradient Descent for flexible optimization
   */
  public trainGradientDescent(
    X: Record<string, number>[],
    y: number[],
    learningRate: number = 0.01,
    iterations: number = 1000
  ): ModelWeights {
    const featureNames = Object.keys(X[0]);
    const n = X.length;
    
    // Initialize weights
    let intercept = 0;
    const coefficients: Record<string, number> = {};
    featureNames.forEach(name => {
      coefficients[name] = 0;
    });
    
    // Gradient descent
    for (let iter = 0; iter < iterations; iter++) {
      let interceptGrad = 0;
      const coeffGrads: Record<string, number> = {};
      featureNames.forEach(name => {
        coeffGrads[name] = 0;
      });
      
      // Calculate gradients
      for (let i = 0; i < n; i++) {
        const prediction = this.predict(X[i], { intercept, coefficients });
        const error = prediction - y[i];
        
        interceptGrad += error;
        featureNames.forEach(name => {
          coeffGrads[name] += error * X[i][name];
        });
      }
      
      // Update weights
      intercept -= (learningRate / n) * interceptGrad;
      featureNames.forEach(name => {
        coefficients[name] -= (learningRate / n) * coeffGrads[name];
      });
    }
    
    this.weights = { intercept, coefficients };
    return this.weights;
  }
  
  /**
   * Make prediction using trained weights
   */
  public predict(features: Record<string, number>, weights?: ModelWeights): number {
    const w = weights || this.weights;
    let prediction = w.intercept;
    
    Object.keys(w.coefficients).forEach(name => {
      prediction += w.coefficients[name] * (features[name] || 0);
    });
    
    return prediction;
  }
  
  // ============================================================================
  // Matrix Operations (Helper Methods)
  // ============================================================================
  
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }
  
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < A[0].length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }
  
  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }
  
  private matrixAdd(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }
  
  private scalarMultiply(matrix: number[][], scalar: number): number[][] {
    return matrix.map(row => row.map(val => val * scalar));
  }
  
  private createIdentityMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = i === j ? 1 : 0;
      }
    }
    return matrix;
  }
  
  private matrixInverse(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = matrix.map((row, i) => [
      ...row,
      ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
    ]);
    
    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make diagonal 1
      const divisor = augmented[i][i];
      if (Math.abs(divisor) < 1e-10) continue; // Singular matrix
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= divisor;
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Extract inverse
    return augmented.map(row => row.slice(n));
  }
}

// ============================================================================
// Model Evaluation and Metrics
// ============================================================================

class ModelEvaluator {
  /**
   * Calculate R² (coefficient of determination)
   */
  public calculateR2(yTrue: number[], yPred: number[]): number {
    const yMean = yTrue.reduce((sum, y) => sum + y, 0) / yTrue.length;
    
    const ssTotal = yTrue.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yTrue.reduce((sum, y, i) => 
      sum + Math.pow(y - yPred[i], 2), 0
    );
    
    return 1 - (ssResidual / ssTotal);
  }
  
  /**
   * Calculate Mean Absolute Error
   */
  public calculateMAE(yTrue: number[], yPred: number[]): number {
    const sum = yTrue.reduce((acc, y, i) => 
      acc + Math.abs(y - yPred[i]), 0
    );
    return sum / yTrue.length;
  }
  
  /**
   * Calculate Root Mean Squared Error
   */
  public calculateRMSE(yTrue: number[], yPred: number[]): number {
    const mse = this.calculateMSE(yTrue, yPred);
    return Math.sqrt(mse);
  }
  
  /**
   * Calculate Mean Squared Error
   */
  public calculateMSE(yTrue: number[], yPred: number[]): number {
    const sum = yTrue.reduce((acc, y, i) => 
      acc + Math.pow(y - yPred[i], 2), 0
    );
    return sum / yTrue.length;
  }
  
  /**
   * Calculate Mean Absolute Percentage Error
   */
  public calculateMAPE(yTrue: number[], yPred: number[]): number {
    const sum = yTrue.reduce((acc, y, i) => {
      if (Math.abs(y) < 1e-10) return acc; // Avoid division by zero
      return acc + Math.abs((y - yPred[i]) / y);
    }, 0);
    return (sum / yTrue.length) * 100;
  }
  
  /**
   * Calculate Adjusted R²
   */
  public calculateAdjustedR2(r2: number, n: number, p: number): number {
    return 1 - ((1 - r2) * (n - 1)) / (n - p - 1);
  }
  
  /**
   * Calculate residual standard deviation
   */
  public calculateResidualStd(yTrue: number[], yPred: number[]): number {
    const residuals = yTrue.map((y, i) => y - yPred[i]);
    const mean = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const variance = residuals.reduce((sum, r) => 
      sum + Math.pow(r - mean, 2), 0
    ) / (residuals.length - 1);
    return Math.sqrt(variance);
  }
  
  /**
   * Perform k-fold cross-validation
   */
  public crossValidate(
    X: Record<string, number>[],
    y: number[],
    k: number,
    trainFunc: (X: Record<string, number>[], y: number[]) => ModelWeights,
    predictFunc: (features: Record<string, number>, weights: ModelWeights) => number
  ): { r2Scores: number[]; maeScores: number[] } {
    const n = X.length;
    const foldSize = Math.floor(n / k);
    const r2Scores: number[] = [];
    const maeScores: number[] = [];
    
    for (let fold = 0; fold < k; fold++) {
      // Split data
      const testStart = fold * foldSize;
      const testEnd = fold === k - 1 ? n : (fold + 1) * foldSize;
      
      const XTrain = [...X.slice(0, testStart), ...X.slice(testEnd)];
      const yTrain = [...y.slice(0, testStart), ...y.slice(testEnd)];
      const XTest = X.slice(testStart, testEnd);
      const yTest = y.slice(testStart, testEnd);
      
      // Train model
      const weights = trainFunc(XTrain, yTrain);
      
      // Make predictions
      const yPred = XTest.map(features => predictFunc(features, weights));
      
      // Calculate metrics
      r2Scores.push(this.calculateR2(yTest, yPred));
      maeScores.push(this.calculateMAE(yTest, yPred));
    }
    
    return { r2Scores, maeScores };
  }
}

// ============================================================================
// ML Model Trainer Service
// ============================================================================

class MLModelTrainerService {
  private featureEngineering: FeatureEngineering;
  private regressionModel: RegressionModel;
  private evaluator: ModelEvaluator;
  private trainedModels: Map<string, TrainedModel>;
  
  constructor() {
    this.featureEngineering = new FeatureEngineering();
    this.regressionModel = new RegressionModel();
    this.evaluator = new ModelEvaluator();
    this.trainedModels = new Map();
  }
  
  /**
   * Train a model on historical data
   */
  public async trainModel(
    dataset: MLDataset,
    options: TrainingOptions = {}
  ): Promise<TrainedModel> {
    const startTime = Date.now();
    
    console.log('[ML Trainer] Starting model training...');
    console.log(`[ML Trainer] Dataset size: ${dataset.dataPoints.length} samples`);
    
    // Set defaults
    const algorithm = options.algorithm || 'ridge';
    const testSplitRatio = options.testSplitRatio || 0.2;
    const cvFolds = options.crossValidationFolds || 5;
    const normalizeFeatures = options.normalizeFeatures !== false;
    
    // Prepare data
    const dataPoints = dataset.dataPoints;
    const n = dataPoints.length;
    const testSize = Math.floor(n * testSplitRatio);
    
    // Shuffle and split
    const shuffled = this.shuffleArray([...dataPoints]);
    const trainData = shuffled.slice(0, n - testSize);
    const testData = shuffled.slice(n - testSize);
    
    console.log(`[ML Trainer] Train size: ${trainData.length}, Test size: ${testData.length}`);
    
    // Extract features and target
    let XTrain = trainData.map(dp => this.featureEngineering.extractNumericFeatures(dp));
    let XTest = testData.map(dp => this.featureEngineering.extractNumericFeatures(dp));
    
    // Add polynomial features if needed
    if (algorithm === 'polynomial') {
      const degree = options.hyperparameters?.degree || 2;
      XTrain = XTrain.map(x => this.featureEngineering.createPolynomialFeatures(x, degree));
      XTest = XTest.map(x => this.featureEngineering.createPolynomialFeatures(x, degree));
    }
    
    // Normalize features
    if (normalizeFeatures) {
      this.featureEngineering.fitNormalization(trainData);
      XTrain = XTrain.map(x => this.featureEngineering.normalizeFeatures(x));
      XTest = XTest.map(x => this.featureEngineering.normalizeFeatures(x));
    }
    
    // Target variable: dynamic adjustment (what we want to predict)
    const yTrain = trainData.map(dp => dp.dynamicAdjustment);
    const yTest = testData.map(dp => dp.dynamicAdjustment);
    
    console.log(`[ML Trainer] Training ${algorithm} regression model...`);
    
    // Train model based on algorithm
    let weights: ModelWeights;
    switch (algorithm) {
      case 'linear':
        weights = this.regressionModel.trainLinearRegression(XTrain, yTrain);
        break;
      case 'ridge':
        const alpha = options.hyperparameters?.alpha || 1.0;
        weights = this.regressionModel.trainRidgeRegression(XTrain, yTrain, alpha);
        break;
      case 'polynomial':
        weights = this.regressionModel.trainLinearRegression(XTrain, yTrain);
        break;
      default:
        weights = this.regressionModel.trainRidgeRegression(XTrain, yTrain, 1.0);
    }
    
    console.log('[ML Trainer] Model training completed');
    
    // Make predictions
    const yTrainPred = XTrain.map(x => this.regressionModel.predict(x, weights));
    const yTestPred = XTest.map(x => this.regressionModel.predict(x, weights));
    
    // Calculate metrics
    const trainR2 = this.evaluator.calculateR2(yTrain, yTrainPred);
    const testR2 = this.evaluator.calculateR2(yTest, yTestPred);
    const testMAE = this.evaluator.calculateMAE(yTest, yTestPred);
    const testRMSE = this.evaluator.calculateRMSE(yTest, yTestPred);
    const testMSE = this.evaluator.calculateMSE(yTest, yTestPred);
    const testMAPE = this.evaluator.calculateMAPE(yTest, yTestPred);
    const adjustedR2 = this.evaluator.calculateAdjustedR2(
      testR2,
      testData.length,
      Object.keys(XTest[0]).length
    );
    const residualStd = this.evaluator.calculateResidualStd(yTest, yTestPred);
    
    console.log(`[ML Trainer] Test R² Score: ${testR2.toFixed(4)}`);
    console.log(`[ML Trainer] Test MAE: ${testMAE.toFixed(4)}`);
    console.log(`[ML Trainer] Test RMSE: ${testRMSE.toFixed(4)}`);
    
    // Cross-validation
    console.log(`[ML Trainer] Performing ${cvFolds}-fold cross-validation...`);
    const cvResults = this.evaluator.crossValidate(
      XTrain,
      yTrain,
      cvFolds,
      (X, y) => {
        if (algorithm === 'ridge') {
          return this.regressionModel.trainRidgeRegression(
            X, y, options.hyperparameters?.alpha || 1.0
          );
        }
        return this.regressionModel.trainLinearRegression(X, y);
      },
      (features, w) => this.regressionModel.predict(features, w)
    );
    
    const avgCVR2 = cvResults.r2Scores.reduce((sum, s) => sum + s, 0) / cvResults.r2Scores.length;
    const avgCVMAE = cvResults.maeScores.reduce((sum, s) => sum + s, 0) / cvResults.maeScores.length;
    
    console.log(`[ML Trainer] CV R² Score: ${avgCVR2.toFixed(4)} ± ${this.std(cvResults.r2Scores).toFixed(4)}`);
    console.log(`[ML Trainer] CV MAE: ${avgCVMAE.toFixed(4)} ± ${this.std(cvResults.maeScores).toFixed(4)}`);
    
    // Calculate feature importance
    const featureImportance = this.calculateFeatureImportance(weights);
    
    // Create trained model
    const modelId = `model_${Date.now()}`;
    const version = `v${this.trainedModels.size + 1}.0.0`;
    
    const trainedModel: TrainedModel = {
      id: modelId,
      version,
      algorithm,
      weights,
      trainingDate: new Date(),
      trainingDataSize: trainData.length,
      hyperparameters: options.hyperparameters || {},
      metrics: {
        r2Score: testR2,
        mae: testMAE,
        rmse: testRMSE,
        mse: testMSE,
        mape: testMAPE,
        cvR2Scores: cvResults.r2Scores,
        cvMAEScores: cvResults.maeScores,
        avgCVR2,
        avgCVMAE,
        adjustedR2,
        residualStd,
      },
      featureImportance,
      metadata: {
        trainingDuration: Date.now() - startTime,
        datasetDateRange: dataset.metadata.dateRange,
        sectorDistribution: dataset.metadata.sectorDistribution,
      },
    };
    
    // Store model
    this.trainedModels.set(modelId, trainedModel);
    
    console.log(`[ML Trainer] Model ${modelId} (${version}) trained successfully`);
    console.log(`[ML Trainer] Training duration: ${trainedModel.metadata.trainingDuration}ms`);
    
    return trainedModel;
  }
  
  /**
   * Calculate feature importance from model weights
   */
  private calculateFeatureImportance(weights: ModelWeights): Record<string, number> {
    const importance: Record<string, number> = {};
    const coefficients = weights.coefficients;
    
    // Calculate absolute values
    const absValues = Object.values(coefficients).map(Math.abs);
    const maxAbs = Math.max(...absValues);
    
    // Normalize to 0-1 scale
    Object.keys(coefficients).forEach(feature => {
      importance[feature] = maxAbs > 0 ? Math.abs(coefficients[feature]) / maxAbs : 0;
    });
    
    return importance;
  }
  
  /**
   * Get trained model by ID
   */
  public getModel(modelId: string): TrainedModel | undefined {
    return this.trainedModels.get(modelId);
  }
  
  /**
   * Get latest trained model
   */
  public getLatestModel(): TrainedModel | undefined {
    const models = Array.from(this.trainedModels.values());
    if (models.length === 0) return undefined;
    
    return models.reduce((latest, model) => 
      model.trainingDate > latest.trainingDate ? model : latest
    );
  }
  
  /**
   * Get all trained models
   */
  public getAllModels(): TrainedModel[] {
    return Array.from(this.trainedModels.values());
  }
  
  /**
   * Compare multiple models
   */
  public compareModels(modelIds: string[]): {
    models: TrainedModel[];
    comparison: {
      bestR2: string;
      bestMAE: string;
      bestRMSE: string;
    };
  } {
    const models = modelIds
      .map(id => this.trainedModels.get(id))
      .filter(m => m !== undefined) as TrainedModel[];
    
    if (models.length === 0) {
      throw new Error('No valid models found for comparison');
    }
    
    const bestR2 = models.reduce((best, model) => 
      model.metrics.r2Score > best.metrics.r2Score ? model : best
    );
    
    const bestMAE = models.reduce((best, model) => 
      model.metrics.mae < best.metrics.mae ? model : best
    );
    
    const bestRMSE = models.reduce((best, model) => 
      model.metrics.rmse < best.metrics.rmse ? model : best
    );
    
    return {
      models,
      comparison: {
        bestR2: bestR2.id,
        bestMAE: bestMAE.id,
        bestRMSE: bestRMSE.id,
      },
    };
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private std(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const mlModelTrainer = new MLModelTrainerService();

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Train a model
 * 
 * const dataset = mlHistoricalDataCollector.buildTrainingDataset({
 *   startDate: new Date('2022-01-01'),
 *   endDate: new Date('2024-01-01'),
 * });
 * 
 * const trainedModel = await mlModelTrainer.trainModel(dataset, {
 *   algorithm: 'ridge',
 *   testSplitRatio: 0.2,
 *   crossValidationFolds: 5,
 *   hyperparameters: { alpha: 1.0 },
 * });
 * 
 * console.log('Model Metrics:', trainedModel.metrics);
 * console.log('Feature Importance:', trainedModel.featureImportance);
 */
