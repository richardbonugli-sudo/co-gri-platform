/**
 * ML Calibration System Test Suite
 * 
 * Comprehensive tests for all ML calibration services:
 * - mlHistoricalDataCollector
 * - mlModelTrainer
 * - mlPredictionService
 * - calibrationRecommendationEngine
 * - mlModelEvaluation
 * - mlIntegrationService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mlHistoricalDataCollector } from '../mlHistoricalDataCollector';
import { mlModelTrainer } from '../mlModelTrainer';
import { mlPredictionService } from '../mlPredictionService';
import { calibrationRecommendationEngine } from '../calibrationRecommendationEngine';
import { mlModelEvaluation } from '../mlModelEvaluation';
import { mlIntegrationService } from '../mlIntegrationService';

describe('ML Calibration System', () => {
  describe('Historical Data Collector', () => {
    it('should build training dataset with correct structure', () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      expect(dataset).toBeDefined();
      expect(dataset.dataPoints).toBeInstanceOf(Array);
      expect(dataset.dataPoints.length).toBeGreaterThan(0);
      expect(dataset.metadata).toBeDefined();
      expect(dataset.metadata.totalAssessments).toBe(dataset.dataPoints.length);
    });

    it('should export dataset to JSON format', () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const jsonData = mlHistoricalDataCollector.exportToJSON(dataset);
      expect(jsonData).toBeDefined();
      expect(typeof jsonData).toBe('string');
      
      const parsed = JSON.parse(jsonData);
      expect(parsed.dataPoints).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it('should export dataset to CSV format', () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const csvData = mlHistoricalDataCollector.exportToCSV(dataset);
      expect(csvData).toBeDefined();
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('ticker,sector');
    });

    it('should calculate dataset statistics', () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const stats = mlHistoricalDataCollector.getDatasetStatistics(dataset);
      expect(stats).toBeDefined();
      expect(stats.totalDataPoints).toBe(dataset.dataPoints.length);
      expect(stats.featureStatistics).toBeDefined();
      expect(stats.materializationStatistics).toBeDefined();
    });
  });

  describe('ML Model Trainer', () => {
    let dataset: any;

    beforeEach(() => {
      dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });
    });

    it('should train a ridge regression model', async () => {
      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        testSplitRatio: 0.2,
        crossValidationFolds: 5,
        hyperparameters: { alpha: 1.0 },
      });

      expect(trainedModel).toBeDefined();
      expect(trainedModel.id).toBeDefined();
      expect(trainedModel.version).toBeDefined();
      expect(trainedModel.algorithm).toBe('ridge');
      expect(trainedModel.weights).toBeDefined();
      expect(trainedModel.metrics).toBeDefined();
      expect(trainedModel.metrics.r2Score).toBeGreaterThanOrEqual(0);
      expect(trainedModel.metrics.mae).toBeGreaterThanOrEqual(0);
    });

    it('should train a linear regression model', async () => {
      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'linear',
        testSplitRatio: 0.2,
      });

      expect(trainedModel).toBeDefined();
      expect(trainedModel.algorithm).toBe('linear');
      expect(trainedModel.metrics.r2Score).toBeDefined();
    });

    it('should calculate feature importance', async () => {
      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        testSplitRatio: 0.2,
      });

      expect(trainedModel.featureImportance).toBeDefined();
      expect(Object.keys(trainedModel.featureImportance).length).toBeGreaterThan(0);
    });

    it('should retrieve trained models', async () => {
      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
      });

      const retrieved = mlModelTrainer.getModel(trainedModel.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(trainedModel.id);

      const latest = mlModelTrainer.getLatestModel();
      expect(latest).toBeDefined();
    });

    it('should compare multiple models', async () => {
      const model1 = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        hyperparameters: { alpha: 0.5 },
      });

      const model2 = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        hyperparameters: { alpha: 2.0 },
      });

      const comparison = mlModelTrainer.compareModels([model1.id, model2.id]);
      expect(comparison).toBeDefined();
      expect(comparison.models.length).toBe(2);
      expect(comparison.comparison).toBeDefined();
    });
  });

  describe('ML Prediction Service', () => {
    let trainedModel: any;

    beforeEach(async () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        testSplitRatio: 0.2,
      });

      mlPredictionService.loadModel(trainedModel.id);
    });

    it('should make predictions', () => {
      const input = {
        sector: 'Technology',
        topCountryExposure: 45.5,
        geographicConcentration: 35.2,
        highRiskCountryExposure: 25.0,
        emergingMarketExposure: 30.0,
        revenueChannelWeight: 0.45,
        supplyChannelWeight: 0.35,
        assetsChannelWeight: 0.12,
        financialChannelWeight: 0.08,
        activeEventCount: 3,
        maxEventSeverity: 7.5,
        avgEventSeverity: 6.0,
        sanctionEventsCount: 1,
        conflictEventsCount: 1,
        marketStressIndex: 65.0,
        currencyVolatility: 0.25,
        commodityVolatility: 0.18,
        sectorMultiplier: 1.10,
        baseChannelMultiplier: 1.025,
      };

      const prediction = mlPredictionService.predict(input);
      expect(prediction).toBeDefined();
      expect(prediction.predictedMultiplier).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.predictionRange).toBeDefined();
      expect(prediction.modelUsed).toBeDefined();
    });

    it('should compare predictions with current multipliers', () => {
      const input = {
        sector: 'Technology',
        topCountryExposure: 45.5,
        geographicConcentration: 35.2,
        highRiskCountryExposure: 25.0,
        emergingMarketExposure: 30.0,
        revenueChannelWeight: 0.45,
        supplyChannelWeight: 0.35,
        assetsChannelWeight: 0.12,
        financialChannelWeight: 0.08,
        activeEventCount: 3,
        maxEventSeverity: 7.5,
        avgEventSeverity: 6.0,
        sanctionEventsCount: 1,
        conflictEventsCount: 1,
        marketStressIndex: 65.0,
        currencyVolatility: 0.25,
        commodityVolatility: 0.18,
        sectorMultiplier: 1.10,
        baseChannelMultiplier: 1.025,
      };

      const comparison = mlPredictionService.comparePrediction(
        'AAPL',
        input,
        0.15,
        46.15
      );

      expect(comparison).toBeDefined();
      expect(comparison.ticker).toBe('AAPL');
      expect(comparison.recommendation).toMatch(/increase|decrease|maintain/);
      expect(comparison.difference).toBeDefined();
    });

    it('should create A/B test groups', () => {
      const controlGroup = mlPredictionService.createABTestGroup(
        'Control Group',
        'Traditional approach',
        false,
        ['AAPL', 'TSLA']
      );

      expect(controlGroup).toBeDefined();
      expect(controlGroup.groupId).toBeDefined();
      expect(controlGroup.useMLPredictions).toBe(false);
      expect(controlGroup.tickers).toEqual(['AAPL', 'TSLA']);
    });

    it('should get model performance summary', () => {
      const summary = mlPredictionService.getModelPerformanceSummary();
      expect(summary).toBeDefined();
      expect(summary?.modelInfo).toBeDefined();
      expect(summary?.metrics).toBeDefined();
    });
  });

  describe('Calibration Recommendation Engine', () => {
    let mlPrediction: any;

    beforeEach(async () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
      });

      mlPredictionService.loadModel(trainedModel.id);

      const input = {
        sector: 'Technology',
        topCountryExposure: 45.5,
        geographicConcentration: 35.2,
        highRiskCountryExposure: 25.0,
        emergingMarketExposure: 30.0,
        revenueChannelWeight: 0.45,
        supplyChannelWeight: 0.35,
        assetsChannelWeight: 0.12,
        financialChannelWeight: 0.08,
        activeEventCount: 3,
        maxEventSeverity: 7.5,
        avgEventSeverity: 6.0,
        sanctionEventsCount: 1,
        conflictEventsCount: 1,
        marketStressIndex: 65.0,
        currencyVolatility: 0.25,
        commodityVolatility: 0.18,
        sectorMultiplier: 1.10,
        baseChannelMultiplier: 1.025,
      };

      mlPrediction = mlPredictionService.predict(input);
    });

    it('should generate recommendations', () => {
      const recommendation = calibrationRecommendationEngine.generateRecommendation(
        'AAPL',
        'Technology',
        { sector: 1.10, channel: 1.025, dynamic: 0.15 },
        mlPrediction,
        46.15
      );

      expect(recommendation).toBeDefined();
      expect(recommendation.id).toBeDefined();
      expect(recommendation.ticker).toBe('AAPL');
      expect(recommendation.priority).toMatch(/critical|high|medium|low/);
      expect(recommendation.status).toBe('pending');
      expect(recommendation.rationale).toBeDefined();
      expect(recommendation.impact).toBeDefined();
    });

    it('should create approval requests', () => {
      const recommendation = calibrationRecommendationEngine.generateRecommendation(
        'AAPL',
        'Technology',
        { sector: 1.10, channel: 1.025, dynamic: 0.15 },
        mlPrediction,
        46.15
      );

      const approvalRequest = calibrationRecommendationEngine.createApprovalRequest(
        recommendation.id,
        'analyst@company.com',
        'High confidence ML prediction'
      );

      expect(approvalRequest).toBeDefined();
      expect(approvalRequest.recommendationId).toBe(recommendation.id);
      expect(approvalRequest.requestedBy).toBe('analyst@company.com');
    });

    it('should process approval decisions', () => {
      const recommendation = calibrationRecommendationEngine.generateRecommendation(
        'AAPL',
        'Technology',
        { sector: 1.10, channel: 1.025, dynamic: 0.15 },
        mlPrediction,
        46.15
      );

      calibrationRecommendationEngine.processApprovalDecision(
        recommendation.id,
        {
          recommendationId: recommendation.id,
          approvedBy: 'manager@company.com',
          approvedAt: new Date(),
          decision: 'approved',
          comments: 'Approved',
        }
      );

      const updated = calibrationRecommendationEngine.getRecommendation(recommendation.id);
      expect(updated?.status).toBe('approved');
    });

    it('should get recommendations by priority', () => {
      calibrationRecommendationEngine.generateRecommendation(
        'AAPL',
        'Technology',
        { sector: 1.10, channel: 1.025, dynamic: 0.15 },
        mlPrediction,
        46.15
      );

      const highPriority = calibrationRecommendationEngine.getRecommendationsByPriority('high');
      expect(highPriority).toBeInstanceOf(Array);
    });

    it('should get recommendation statistics', () => {
      const stats = calibrationRecommendationEngine.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.byPriority).toBeDefined();
      expect(stats.byStatus).toBeDefined();
    });
  });

  describe('ML Model Evaluation', () => {
    let trainedModel: any;

    beforeEach(async () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
      });

      mlModelEvaluation.setBaselineModel(trainedModel.id);
    });

    it('should capture performance snapshots', () => {
      const snapshot = mlModelEvaluation.capturePerformanceSnapshot(trainedModel.id);
      expect(snapshot).toBeDefined();
      expect(snapshot.modelId).toBe(trainedModel.id);
      expect(snapshot.metrics).toBeDefined();
      expect(snapshot.predictionStats).toBeDefined();
    });

    it('should detect drift', () => {
      mlModelEvaluation.capturePerformanceSnapshot(trainedModel.id);
      mlModelEvaluation.capturePerformanceSnapshot(trainedModel.id);

      const driftResult = mlModelEvaluation.detectDrift(trainedModel.id);
      expect(driftResult).toBeDefined();
      expect(driftResult.driftScore).toBeGreaterThanOrEqual(0);
      expect(driftResult.driftType).toMatch(/concept_drift|data_drift|prediction_drift|none/);
    });

    it('should generate retraining recommendations', () => {
      const recommendation = mlModelEvaluation.generateRetrainingRecommendation(trainedModel.id);
      expect(recommendation).toBeDefined();
      expect(recommendation.priority).toMatch(/critical|high|medium|low/);
      expect(recommendation.triggers).toBeDefined();
      expect(recommendation.recommendations).toBeDefined();
    });

    it('should compare models', async () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const model2 = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        hyperparameters: { alpha: 2.0 },
      });

      const comparison = mlModelEvaluation.compareModels(trainedModel.id, model2.id);
      expect(comparison).toBeDefined();
      expect(comparison.baselineModel).toBeDefined();
      expect(comparison.currentModel).toBeDefined();
      expect(comparison.recommendation).toMatch(/keep_current|rollback_to_baseline|retrain_needed/);
    });

    it('should get evaluation summary', () => {
      mlModelEvaluation.capturePerformanceSnapshot(trainedModel.id);

      const summary = mlModelEvaluation.getEvaluationSummary(trainedModel.id);
      expect(summary).toBeDefined();
      expect(summary.totalSnapshots).toBeGreaterThan(0);
      expect(summary.latestAccuracy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ML Integration Service', () => {
    beforeEach(async () => {
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });

      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
      });

      mlPredictionService.loadModel(trainedModel.id);
    });

    it('should get ML-enhanced adjustments', () => {
      const enhancement = mlIntegrationService.getMLEnhancedAdjustment(
        'AAPL',
        'Technology',
        [
          { country: 'United States', percentage: 40, channel: 'revenue' },
          { country: 'China', percentage: 25, channel: 'supply' },
        ],
        1.10,
        1.025
      );

      expect(enhancement).toBeDefined();
      expect(enhancement.baseDynamicAdjustment).toBeGreaterThanOrEqual(0);
      expect(enhancement.finalAdjustment).toBeGreaterThanOrEqual(0);
      expect(enhancement.strategy).toMatch(/ml_only|rule_based_only|weighted_blend|confidence_based/);
    });

    it('should check approval requirements', () => {
      const enhancement = mlIntegrationService.getMLEnhancedAdjustment(
        'AAPL',
        'Technology',
        [
          { country: 'United States', percentage: 40, channel: 'revenue' },
          { country: 'China', percentage: 25, channel: 'supply' },
        ],
        1.10,
        1.025
      );

      const requiresApproval = mlIntegrationService.requiresApproval(enhancement);
      expect(typeof requiresApproval).toBe('boolean');
    });

    it('should update configuration', () => {
      const currentConfig = mlIntegrationService.getConfig();
      expect(currentConfig).toBeDefined();

      mlIntegrationService.updateConfig({
        defaultStrategy: 'ml_only',
        mlWeight: 0.8,
      });

      const updatedConfig = mlIntegrationService.getConfig();
      expect(updatedConfig.defaultStrategy).toBe('ml_only');
      expect(updatedConfig.mlWeight).toBe(0.8);
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full ML calibration workflow', async () => {
      // Step 1: Build training dataset
      const dataset = mlHistoricalDataCollector.buildTrainingDataset({
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
      });
      expect(dataset.dataPoints.length).toBeGreaterThan(0);

      // Step 2: Train model
      const trainedModel = await mlModelTrainer.trainModel(dataset, {
        algorithm: 'ridge',
        testSplitRatio: 0.2,
        crossValidationFolds: 5,
      });
      expect(trainedModel.metrics.r2Score).toBeGreaterThanOrEqual(0);

      // Step 3: Load model and make prediction
      mlPredictionService.loadModel(trainedModel.id);
      const input = {
        sector: 'Technology',
        topCountryExposure: 45.5,
        geographicConcentration: 35.2,
        highRiskCountryExposure: 25.0,
        emergingMarketExposure: 30.0,
        revenueChannelWeight: 0.45,
        supplyChannelWeight: 0.35,
        assetsChannelWeight: 0.12,
        financialChannelWeight: 0.08,
        activeEventCount: 3,
        maxEventSeverity: 7.5,
        avgEventSeverity: 6.0,
        sanctionEventsCount: 1,
        conflictEventsCount: 1,
        marketStressIndex: 65.0,
        currencyVolatility: 0.25,
        commodityVolatility: 0.18,
        sectorMultiplier: 1.10,
        baseChannelMultiplier: 1.025,
      };
      const prediction = mlPredictionService.predict(input);
      expect(prediction.confidence).toBeGreaterThan(0);

      // Step 4: Generate recommendation
      const recommendation = calibrationRecommendationEngine.generateRecommendation(
        'AAPL',
        'Technology',
        { sector: 1.10, channel: 1.025, dynamic: 0.15 },
        prediction,
        46.15
      );
      expect(recommendation.priority).toBeDefined();

      // Step 5: Evaluate model
      mlModelEvaluation.setBaselineModel(trainedModel.id);
      const snapshot = mlModelEvaluation.capturePerformanceSnapshot(trainedModel.id);
      expect(snapshot.metrics).toBeDefined();

      // Step 6: Get ML-enhanced adjustment
      const enhancement = mlIntegrationService.getMLEnhancedAdjustment(
        'AAPL',
        'Technology',
        [
          { country: 'United States', percentage: 40, channel: 'revenue' },
          { country: 'China', percentage: 25, channel: 'supply' },
        ],
        1.10,
        1.025
      );
      expect(enhancement.finalAdjustment).toBeGreaterThanOrEqual(0);
    });
  });
});
