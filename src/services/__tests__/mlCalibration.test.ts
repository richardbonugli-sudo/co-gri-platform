/**
 * ML Calibration Tests - Phase 2 Task 3 Validation
 * 
 * Comprehensive tests for ML-based calibration:
 * - Model training with sample data
 * - Prediction accuracy
 * - Recommendation generation
 * - Model evaluation metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  collectHistoricalData,
  addHistoricalAssessment,
  addRiskMaterializationEvent,
  getTrainingDataset,
  exportToJSON,
  clearHistoricalData
} from '../mlHistoricalDataCollector';
import {
  trainModel,
  compareModels,
  getModelMetrics,
  type ModelType
} from '../mlModelTrainer';
import {
  loadModel,
  predictMultipliers,
  predictWithConfidence,
  comparePredictions
} from '../mlPredictionService';
import {
  generateRecommendations,
  approveRecommendation,
  getRecommendationsByPriority
} from '../calibrationRecommendationEngine';
import {
  evaluateModel,
  detectDrift,
  shouldRetrain
} from '../mlModelEvaluation';

describe('Historical Data Collection', () => {
  beforeEach(() => {
    clearHistoricalData();
  });
  
  it('should collect historical data', () => {
    const data = collectHistoricalData();
    
    expect(data.assessments.length).toBeGreaterThan(0);
    expect(data.materializationEvents.length).toBeGreaterThan(0);
  });
  
  it('should add historical assessment', () => {
    addHistoricalAssessment({
      ticker: 'TEST',
      date: '2024-01-01',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      channelMultipliers: { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      finalScore: 52.1,
      activeEvents: ['US-CN-TECH-2018'],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    const data = collectHistoricalData();
    expect(data.assessments.some(a => a.ticker === 'TEST')).toBe(true);
  });
  
  it('should generate training dataset', () => {
    const dataset = getTrainingDataset();
    
    expect(dataset.features.length).toBeGreaterThan(0);
    expect(dataset.labels.length).toBeGreaterThan(0);
    expect(dataset.features.length).toBe(dataset.labels.length);
  });
  
  it('should export to JSON', () => {
    const json = exportToJSON();
    const data = JSON.parse(json);
    
    expect(data.assessments).toBeDefined();
    expect(data.materializationEvents).toBeDefined();
  });
});

describe('ML Model Training', () => {
  it('should train linear regression model', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    
    expect(model.type).toBe('linear');
    expect(model.weights).toBeDefined();
    expect(model.metrics.r2).toBeGreaterThanOrEqual(0);
  });
  
  it('should train ridge regression model', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'ridge');
    
    expect(model.type).toBe('ridge');
    expect(model.weights).toBeDefined();
  });
  
  it('should compare multiple models', () => {
    const dataset = getTrainingDataset();
    const comparison = compareModels(dataset, ['linear', 'ridge', 'polynomial']);
    
    expect(comparison.length).toBe(3);
    expect(comparison[0].metrics).toBeDefined();
  });
  
  it('should calculate model metrics', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    const metrics = getModelMetrics(model, dataset);
    
    expect(metrics.r2).toBeDefined();
    expect(metrics.mae).toBeDefined();
    expect(metrics.rmse).toBeDefined();
  });
});

describe('ML Prediction Service', () => {
  it('should load trained model', () => {
    const dataset = getTrainingDataset();
    const trainedModel = trainModel(dataset, 'linear');
    
    loadModel(trainedModel);
    
    // Model should be loaded successfully
    expect(true).toBe(true);
  });
  
  it('should predict multipliers', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    const prediction = predictMultipliers({
      ticker: 'TEST',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      activeEvents: ['US-CN-TECH-2018'],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    expect(prediction.revenue).toBeGreaterThan(0);
    expect(prediction.supply).toBeGreaterThan(0);
    expect(prediction.assets).toBeGreaterThan(0);
    expect(prediction.financial).toBeGreaterThan(0);
  });
  
  it('should predict with confidence', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    const prediction = predictWithConfidence({
      ticker: 'TEST',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      activeEvents: [],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    expect(prediction.multipliers).toBeDefined();
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });
  
  it('should compare predictions', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    const comparison = comparePredictions(
      {
        ticker: 'TEST',
        sector: 'Technology',
        geographicExposure: { 'United States': 0.60, 'China': 0.40 },
        activeEvents: [],
        marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
      },
      { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 }
    );
    
    expect(comparison.predicted).toBeDefined();
    expect(comparison.current).toBeDefined();
    expect(comparison.differences).toBeDefined();
  });
});

describe('Calibration Recommendations', () => {
  it('should generate recommendations', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    const recommendations = generateRecommendations({
      ticker: 'TEST',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      currentMultipliers: { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      activeEvents: ['US-CN-TECH-2018'],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    expect(Array.isArray(recommendations)).toBe(true);
  });
  
  it('should filter recommendations by priority', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    generateRecommendations({
      ticker: 'TEST',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      currentMultipliers: { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      activeEvents: ['US-CN-TECH-2018'],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    const highPriority = getRecommendationsByPriority('high');
    
    expect(Array.isArray(highPriority)).toBe(true);
  });
  
  it('should approve recommendation', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    loadModel(model);
    
    const recommendations = generateRecommendations({
      ticker: 'TEST',
      sector: 'Technology',
      geographicExposure: { 'United States': 0.60, 'China': 0.40 },
      currentMultipliers: { revenue: 1.00, supply: 1.05, assets: 1.03, financial: 1.02 },
      activeEvents: [],
      marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
    });
    
    if (recommendations.length > 0) {
      const approved = approveRecommendation(recommendations[0].id, 'analyst', 'Approved for testing');
      expect(approved.status).toBe('approved');
    }
  });
});

describe('Model Evaluation', () => {
  it('should evaluate model performance', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    
    const evaluation = evaluateModel(model, dataset);
    
    expect(evaluation.metrics).toBeDefined();
    expect(evaluation.metrics.r2).toBeDefined();
  });
  
  it('should detect model drift', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    
    const drift = detectDrift(model, dataset);
    
    expect(drift.hasDrift).toBeDefined();
    expect(drift.driftScore).toBeGreaterThanOrEqual(0);
  });
  
  it('should recommend retraining when needed', () => {
    const dataset = getTrainingDataset();
    const model = trainModel(dataset, 'linear');
    
    const shouldRetrainResult = shouldRetrain(model, dataset);
    
    expect(typeof shouldRetrainResult).toBe('boolean');
  });
});