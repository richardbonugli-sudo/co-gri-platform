/**
 * Calibration Service
 * 
 * Adjusts model parameters based on backtesting results to improve
 * prediction accuracy. Supports A/B testing of configurations and
 * maintains calibration history for rollback.
 */

import { backtestingEngine, type BacktestSummary, type AccuracyMetrics, type CalibrationRecommendation } from './backtestingEngine';
import type { EventCategory } from '@/data/geopoliticalEvents';

export interface VectorWeights {
  conflict: number;
  sanctions: number;
  trade: number;
  governance: number;
  cyber: number;
  unrest: number;
  currency: number;
}

export interface SeverityMapping {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface PropagationDecay {
  neighbor: number;
  ally: number;
  rival: number;
  trade: number;
  regional: number;
  global: number;
}

export interface CalibrationConfig {
  id: string;
  name: string;
  description: string;
  vectorWeights: VectorWeights;
  severityMapping: SeverityMapping;
  propagationDecay: PropagationDecay;
  regionalAdjustments: Record<string, number>;
  globalScalingFactor: number;
  createdAt: Date;
  isActive: boolean;
}

export interface CalibrationResult {
  configId: string;
  configName: string;
  metrics: AccuracyMetrics;
  improvement: {
    maeChange: number;
    rmseChange: number;
    correlationChange: number;
    directionalAccuracyChange: number;
  };
  backtestSummary: BacktestSummary;
  timestamp: Date;
}

export interface ABTestResult {
  configA: CalibrationResult;
  configB: CalibrationResult;
  winner: 'A' | 'B' | 'tie';
  confidenceLevel: number;
  recommendation: string;
}

// Default configuration
const DEFAULT_CONFIG: CalibrationConfig = {
  id: 'default-v1',
  name: 'Default Configuration',
  description: 'Original model parameters',
  vectorWeights: {
    conflict: 0.22,
    sanctions: 0.18,
    trade: 0.16,
    governance: 0.14,
    cyber: 0.12,
    unrest: 0.10,
    currency: 0.08
  },
  severityMapping: {
    critical: 2.0,
    high: 1.5,
    moderate: 1.0,
    low: 0.5
  },
  propagationDecay: {
    neighbor: 0.4,
    ally: 0.35,
    rival: 0.5,
    trade: 0.25,
    regional: 0.2,
    global: 0.1
  },
  regionalAdjustments: {},
  globalScalingFactor: 1.0,
  createdAt: new Date('2024-01-01'),
  isActive: true
};

class CalibrationService {
  private configurations: Map<string, CalibrationConfig> = new Map();
  private activeConfig: CalibrationConfig;
  private calibrationHistory: CalibrationResult[] = [];
  private baselineMetrics: AccuracyMetrics | null = null;

  constructor() {
    this.configurations.set(DEFAULT_CONFIG.id, DEFAULT_CONFIG);
    this.activeConfig = DEFAULT_CONFIG;
  }

  /**
   * Initialize with baseline metrics from backtest
   */
  initializeBaseline(): AccuracyMetrics {
    const summary = backtestingEngine.runBacktest();
    this.baselineMetrics = summary.metrics;
    
    const result: CalibrationResult = {
      configId: this.activeConfig.id,
      configName: this.activeConfig.name,
      metrics: summary.metrics,
      improvement: {
        maeChange: 0,
        rmseChange: 0,
        correlationChange: 0,
        directionalAccuracyChange: 0
      },
      backtestSummary: summary,
      timestamp: new Date()
    };
    
    this.calibrationHistory.push(result);
    console.log('[Calibration] 📊 Baseline established:', summary.metrics);
    
    return summary.metrics;
  }

  /**
   * Optimize weights based on backtesting results
   */
  optimizeWeights(recommendations?: CalibrationRecommendation[]): CalibrationConfig {
    const summary = backtestingEngine.getLastSummary();
    if (!summary) {
      throw new Error('No backtest results available. Run backtest first.');
    }
    
    const recs = recommendations || summary.calibrationRecommendations;
    
    // Create new configuration based on recommendations
    const newConfig: CalibrationConfig = {
      id: `optimized-${Date.now()}`,
      name: `Optimized Configuration ${new Date().toISOString().split('T')[0]}`,
      description: `Auto-optimized based on ${recs.length} recommendations`,
      vectorWeights: { ...this.activeConfig.vectorWeights },
      severityMapping: { ...this.activeConfig.severityMapping },
      propagationDecay: { ...this.activeConfig.propagationDecay },
      regionalAdjustments: { ...this.activeConfig.regionalAdjustments },
      globalScalingFactor: this.activeConfig.globalScalingFactor,
      createdAt: new Date(),
      isActive: false
    };
    
    // Apply recommendations
    recs.forEach(rec => {
      switch (rec.type) {
        case 'vector_weight':
          const vectorKey = rec.target.toLowerCase() as keyof VectorWeights;
          if (vectorKey in newConfig.vectorWeights) {
            newConfig.vectorWeights[vectorKey] = rec.recommendedValue;
          }
          break;
        case 'severity_mapping':
          if (rec.target === 'global') {
            newConfig.globalScalingFactor = rec.recommendedValue;
          }
          break;
        case 'regional_bias':
          newConfig.regionalAdjustments[rec.target] = rec.recommendedValue;
          break;
        case 'propagation_decay':
          const decayKey = rec.target.toLowerCase() as keyof PropagationDecay;
          if (decayKey in newConfig.propagationDecay) {
            newConfig.propagationDecay[decayKey] = rec.recommendedValue;
          }
          break;
      }
    });
    
    // Normalize vector weights to sum to 1
    const weightSum = Object.values(newConfig.vectorWeights).reduce((a, b) => a + b, 0);
    Object.keys(newConfig.vectorWeights).forEach(key => {
      newConfig.vectorWeights[key as keyof VectorWeights] /= weightSum;
    });
    
    // Store configuration
    this.configurations.set(newConfig.id, newConfig);
    
    console.log('[Calibration] ⚙️ Created optimized configuration:', newConfig.id);
    
    return newConfig;
  }

  /**
   * Compare two configurations via A/B test
   */
  compareConfigurations(configIdA: string, configIdB: string): ABTestResult {
    const configA = this.configurations.get(configIdA);
    const configB = this.configurations.get(configIdB);
    
    if (!configA || !configB) {
      throw new Error('One or both configurations not found');
    }
    
    // Run backtest with config A
    this.applyConfiguration(configA);
    const summaryA = backtestingEngine.runBacktest();
    const resultA: CalibrationResult = {
      configId: configA.id,
      configName: configA.name,
      metrics: summaryA.metrics,
      improvement: this.calculateImprovement(summaryA.metrics),
      backtestSummary: summaryA,
      timestamp: new Date()
    };
    
    // Run backtest with config B
    this.applyConfiguration(configB);
    const summaryB = backtestingEngine.runBacktest();
    const resultB: CalibrationResult = {
      configId: configB.id,
      configName: configB.name,
      metrics: summaryB.metrics,
      improvement: this.calculateImprovement(summaryB.metrics),
      backtestSummary: summaryB,
      timestamp: new Date()
    };
    
    // Determine winner
    const scoreA = this.calculateConfigScore(summaryA.metrics);
    const scoreB = this.calculateConfigScore(summaryB.metrics);
    const scoreDiff = Math.abs(scoreA - scoreB);
    
    let winner: 'A' | 'B' | 'tie';
    let confidenceLevel: number;
    let recommendation: string;
    
    if (scoreDiff < 0.05) {
      winner = 'tie';
      confidenceLevel = 0.5;
      recommendation = 'Both configurations perform similarly. Consider other factors for selection.';
    } else if (scoreA > scoreB) {
      winner = 'A';
      confidenceLevel = Math.min(0.95, 0.5 + scoreDiff);
      recommendation = `Configuration A (${configA.name}) outperforms B with ${(confidenceLevel * 100).toFixed(0)}% confidence.`;
    } else {
      winner = 'B';
      confidenceLevel = Math.min(0.95, 0.5 + scoreDiff);
      recommendation = `Configuration B (${configB.name}) outperforms A with ${(confidenceLevel * 100).toFixed(0)}% confidence.`;
    }
    
    console.log(`[Calibration] 🔬 A/B Test Result: ${winner} wins with ${(confidenceLevel * 100).toFixed(0)}% confidence`);
    
    return {
      configA: resultA,
      configB: resultB,
      winner,
      confidenceLevel,
      recommendation
    };
  }

  /**
   * Apply a configuration
   */
  applyCalibration(configId: string): void {
    const config = this.configurations.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    this.applyConfiguration(config);
    
    // Mark as active
    this.configurations.forEach(c => c.isActive = false);
    config.isActive = true;
    this.activeConfig = config;
    
    console.log(`[Calibration] ✅ Applied configuration: ${config.name}`);
  }

  /**
   * Apply configuration to the model (internal)
   */
  private applyConfiguration(config: CalibrationConfig): void {
    // In a real implementation, this would update the classification engine
    // and propagation engine with the new parameters
    this.activeConfig = config;
    
    // Log the applied configuration
    console.log(`[Calibration] Applying config ${config.id}:`, {
      vectorWeights: config.vectorWeights,
      globalScaling: config.globalScalingFactor
    });
  }

  /**
   * Calculate improvement over baseline
   */
  private calculateImprovement(metrics: AccuracyMetrics): CalibrationResult['improvement'] {
    if (!this.baselineMetrics) {
      return {
        maeChange: 0,
        rmseChange: 0,
        correlationChange: 0,
        directionalAccuracyChange: 0
      };
    }
    
    return {
      maeChange: ((this.baselineMetrics.mae - metrics.mae) / this.baselineMetrics.mae) * 100,
      rmseChange: ((this.baselineMetrics.rmse - metrics.rmse) / this.baselineMetrics.rmse) * 100,
      correlationChange: metrics.correlation - this.baselineMetrics.correlation,
      directionalAccuracyChange: metrics.directionalAccuracy - this.baselineMetrics.directionalAccuracy
    };
  }

  /**
   * Calculate overall configuration score
   */
  private calculateConfigScore(metrics: AccuracyMetrics): number {
    // Weighted combination of metrics (lower MAE is better, higher correlation is better)
    const normalizedMAE = 1 - Math.min(1, metrics.mae / 10); // Normalize MAE to 0-1
    const normalizedCorrelation = (metrics.correlation + 1) / 2; // Normalize correlation to 0-1
    const normalizedDirectional = metrics.directionalAccuracy / 100;
    
    return (
      normalizedMAE * 0.3 +
      normalizedCorrelation * 0.4 +
      normalizedDirectional * 0.3
    );
  }

  /**
   * Create a new configuration manually
   */
  createConfiguration(
    name: string,
    description: string,
    params: Partial<{
      vectorWeights: Partial<VectorWeights>;
      severityMapping: Partial<SeverityMapping>;
      propagationDecay: Partial<PropagationDecay>;
      regionalAdjustments: Record<string, number>;
      globalScalingFactor: number;
    }>
  ): CalibrationConfig {
    const newConfig: CalibrationConfig = {
      id: `custom-${Date.now()}`,
      name,
      description,
      vectorWeights: { ...this.activeConfig.vectorWeights, ...params.vectorWeights },
      severityMapping: { ...this.activeConfig.severityMapping, ...params.severityMapping },
      propagationDecay: { ...this.activeConfig.propagationDecay, ...params.propagationDecay },
      regionalAdjustments: { ...this.activeConfig.regionalAdjustments, ...params.regionalAdjustments },
      globalScalingFactor: params.globalScalingFactor ?? this.activeConfig.globalScalingFactor,
      createdAt: new Date(),
      isActive: false
    };
    
    this.configurations.set(newConfig.id, newConfig);
    console.log(`[Calibration] 📝 Created custom configuration: ${name}`);
    
    return newConfig;
  }

  /**
   * Get all configurations
   */
  getConfigurations(): CalibrationConfig[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get active configuration
   */
  getActiveConfiguration(): CalibrationConfig {
    return this.activeConfig;
  }

  /**
   * Get calibration history
   */
  getHistory(): CalibrationResult[] {
    return [...this.calibrationHistory];
  }

  /**
   * Get baseline metrics
   */
  getBaselineMetrics(): AccuracyMetrics | null {
    return this.baselineMetrics;
  }

  /**
   * Rollback to a previous configuration
   */
  rollback(configId: string): void {
    const config = this.configurations.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    this.applyCalibration(configId);
    console.log(`[Calibration] ⏪ Rolled back to: ${config.name}`);
  }

  /**
   * Delete a configuration
   */
  deleteConfiguration(configId: string): boolean {
    if (configId === DEFAULT_CONFIG.id) {
      console.warn('[Calibration] Cannot delete default configuration');
      return false;
    }
    
    if (this.activeConfig.id === configId) {
      this.applyCalibration(DEFAULT_CONFIG.id);
    }
    
    return this.configurations.delete(configId);
  }

  /**
   * Export configuration
   */
  exportConfiguration(configId: string): string {
    const config = this.configurations.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration
   */
  importConfiguration(json: string): CalibrationConfig {
    const config = JSON.parse(json) as CalibrationConfig;
    config.id = `imported-${Date.now()}`;
    config.createdAt = new Date();
    config.isActive = false;
    
    this.configurations.set(config.id, config);
    console.log(`[Calibration] 📥 Imported configuration: ${config.name}`);
    
    return config;
  }
}

// Singleton instance
export const calibrationService = new CalibrationService();