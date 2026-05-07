/**
 * Model Accuracy Tracker
 * 
 * Tracks prediction accuracy over time, computes rolling metrics,
 * identifies systematic biases, and generates accuracy reports.
 */

import type { AccuracyMetrics, BacktestResult } from './backtestingEngine';
import type { EventCategory } from '@/data/geopoliticalEvents';

export interface AccuracyDataPoint {
  timestamp: Date;
  eventId: string;
  predicted: number;
  actual: number;
  error: number;
  absoluteError: number;
  category: EventCategory;
  region: string;
  isCorrectDirection: boolean;
}

export interface RollingMetrics {
  window: '7D' | '30D' | '90D';
  startDate: Date;
  endDate: Date;
  mae: number;
  rmse: number;
  correlation: number;
  directionalAccuracy: number;
  eventCount: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface BiasAnalysis {
  overallBias: number;
  byCategory: Record<string, { bias: number; count: number; significance: 'high' | 'medium' | 'low' }>;
  byRegion: Record<string, { bias: number; count: number; significance: 'high' | 'medium' | 'low' }>;
  bySeverity: Record<string, { bias: number; count: number }>;
  systematicPatterns: string[];
}

export interface AccuracyReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  overallMetrics: AccuracyMetrics;
  rollingMetrics: {
    '7D': RollingMetrics;
    '30D': RollingMetrics;
    '90D': RollingMetrics;
  };
  biasAnalysis: BiasAnalysis;
  alerts: AccuracyAlert[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface AccuracyAlert {
  id: string;
  type: 'accuracy_drop' | 'bias_detected' | 'outlier' | 'data_quality';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

// Alert thresholds
const THRESHOLDS = {
  mae: { warning: 2.5, critical: 4.0 },
  directionalAccuracy: { warning: 70, critical: 60 },
  correlation: { warning: 0.7, critical: 0.5 },
  bias: { warning: 1.5, critical: 3.0 }
};

class ModelAccuracyTracker {
  private dataPoints: AccuracyDataPoint[] = [];
  private alerts: AccuracyAlert[] = [];
  private alertIdCounter = 0;
  private lastReport: AccuracyReport | null = null;

  /**
   * Record a prediction result
   */
  recordPrediction(result: BacktestResult): void {
    const dataPoint: AccuracyDataPoint = {
      timestamp: result.event.date,
      eventId: result.eventId,
      predicted: result.modelPrediction.deltaCSI,
      actual: result.actual.deltaCSI,
      error: result.error,
      absoluteError: result.absoluteError,
      category: result.event.category,
      region: result.event.region,
      isCorrectDirection: result.direction === 'correct'
    };
    
    this.dataPoints.push(dataPoint);
    this.dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Record multiple predictions
   */
  recordBatch(results: BacktestResult[]): void {
    results.forEach(result => {
      const dataPoint: AccuracyDataPoint = {
        timestamp: result.event.date,
        eventId: result.eventId,
        predicted: result.modelPrediction.deltaCSI,
        actual: result.actual.deltaCSI,
        error: result.error,
        absoluteError: result.absoluteError,
        category: result.event.category,
        region: result.event.region,
        isCorrectDirection: result.direction === 'correct'
      };
      this.dataPoints.push(dataPoint);
    });
    
    this.dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.checkAlerts();
    
    console.log(`[Accuracy Tracker] 📊 Recorded ${results.length} predictions`);
  }

  /**
   * Calculate rolling metrics for a time window
   */
  getRollingMetrics(window: '7D' | '30D' | '90D'): RollingMetrics {
    const windowDays = window === '7D' ? 7 : window === '30D' ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);
    
    const windowData = this.dataPoints.filter(
      dp => dp.timestamp >= startDate && dp.timestamp <= endDate
    );
    
    if (windowData.length === 0) {
      return {
        window,
        startDate,
        endDate,
        mae: 0,
        rmse: 0,
        correlation: 0,
        directionalAccuracy: 0,
        eventCount: 0,
        trend: 'stable'
      };
    }
    
    const metrics = this.calculateMetrics(windowData);
    const trend = this.calculateTrend(window);
    
    return {
      window,
      startDate,
      endDate,
      mae: metrics.mae,
      rmse: metrics.rmse,
      correlation: metrics.correlation,
      directionalAccuracy: metrics.directionalAccuracy,
      eventCount: windowData.length,
      trend
    };
  }

  /**
   * Calculate metrics from data points
   */
  private calculateMetrics(data: AccuracyDataPoint[]): {
    mae: number;
    rmse: number;
    correlation: number;
    directionalAccuracy: number;
  } {
    if (data.length === 0) {
      return { mae: 0, rmse: 0, correlation: 0, directionalAccuracy: 0 };
    }
    
    const n = data.length;
    const absErrors = data.map(d => d.absoluteError);
    const errors = data.map(d => d.error);
    const predictions = data.map(d => d.predicted);
    const actuals = data.map(d => d.actual);
    
    // MAE
    const mae = absErrors.reduce((a, b) => a + b, 0) / n;
    
    // RMSE
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n);
    
    // Correlation
    const meanPred = predictions.reduce((a, b) => a + b, 0) / n;
    const meanActual = actuals.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomPred = 0;
    let denomActual = 0;
    
    for (let i = 0; i < n; i++) {
      const diffPred = predictions[i] - meanPred;
      const diffActual = actuals[i] - meanActual;
      numerator += diffPred * diffActual;
      denomPred += diffPred * diffPred;
      denomActual += diffActual * diffActual;
    }
    
    const correlation = denomPred > 0 && denomActual > 0
      ? numerator / Math.sqrt(denomPred * denomActual)
      : 0;
    
    // Directional accuracy
    const correctDirection = data.filter(d => d.isCorrectDirection).length;
    const directionalAccuracy = (correctDirection / n) * 100;
    
    return { mae, rmse, correlation, directionalAccuracy };
  }

  /**
   * Calculate trend for a window
   */
  private calculateTrend(window: '7D' | '30D' | '90D'): 'improving' | 'stable' | 'degrading' {
    const windowDays = window === '7D' ? 7 : window === '30D' ? 30 : 90;
    const now = new Date();
    
    // Current period
    const currentStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const currentData = this.dataPoints.filter(dp => dp.timestamp >= currentStart);
    
    // Previous period
    const prevEnd = currentStart;
    const prevStart = new Date(prevEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const prevData = this.dataPoints.filter(dp => dp.timestamp >= prevStart && dp.timestamp < prevEnd);
    
    if (currentData.length < 3 || prevData.length < 3) {
      return 'stable';
    }
    
    const currentMAE = this.calculateMetrics(currentData).mae;
    const prevMAE = this.calculateMetrics(prevData).mae;
    
    const change = (currentMAE - prevMAE) / prevMAE;
    
    if (change < -0.1) return 'improving';
    if (change > 0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Analyze systematic biases
   */
  analyzeBias(): BiasAnalysis {
    const byCategory: BiasAnalysis['byCategory'] = {};
    const byRegion: BiasAnalysis['byRegion'] = {};
    const bySeverity: BiasAnalysis['bySeverity'] = {};
    const systematicPatterns: string[] = [];
    
    // Overall bias
    const overallBias = this.dataPoints.length > 0
      ? this.dataPoints.reduce((sum, d) => sum + d.error, 0) / this.dataPoints.length
      : 0;
    
    // By category
    const categories = [...new Set(this.dataPoints.map(d => d.category))];
    categories.forEach(cat => {
      const catData = this.dataPoints.filter(d => d.category === cat);
      if (catData.length > 0) {
        const bias = catData.reduce((sum, d) => sum + d.error, 0) / catData.length;
        const significance = Math.abs(bias) > 2 ? 'high' : Math.abs(bias) > 1 ? 'medium' : 'low';
        byCategory[cat] = { bias, count: catData.length, significance };
        
        if (significance === 'high') {
          systematicPatterns.push(
            `${cat} events show ${bias > 0 ? 'over' : 'under'}estimation bias of ${Math.abs(bias).toFixed(2)} points`
          );
        }
      }
    });
    
    // By region
    const regions = [...new Set(this.dataPoints.map(d => d.region))];
    regions.forEach(region => {
      const regionData = this.dataPoints.filter(d => d.region === region);
      if (regionData.length > 0) {
        const bias = regionData.reduce((sum, d) => sum + d.error, 0) / regionData.length;
        const significance = Math.abs(bias) > 2 ? 'high' : Math.abs(bias) > 1 ? 'medium' : 'low';
        byRegion[region] = { bias, count: regionData.length, significance };
        
        if (significance === 'high' && regionData.length >= 3) {
          systematicPatterns.push(
            `${region} events show ${bias > 0 ? 'over' : 'under'}estimation bias of ${Math.abs(bias).toFixed(2)} points`
          );
        }
      }
    });
    
    return {
      overallBias,
      byCategory,
      byRegion,
      bySeverity,
      systematicPatterns
    };
  }

  /**
   * Generate comprehensive accuracy report
   */
  generateReport(): AccuracyReport {
    const now = new Date();
    const startDate = this.dataPoints.length > 0 
      ? this.dataPoints[0].timestamp 
      : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const overallMetrics = this.calculateMetrics(this.dataPoints);
    const rollingMetrics = {
      '7D': this.getRollingMetrics('7D'),
      '30D': this.getRollingMetrics('30D'),
      '90D': this.getRollingMetrics('90D')
    };
    const biasAnalysis = this.analyzeBias();
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overallMetrics.mae > THRESHOLDS.mae.warning) {
      recommendations.push('Consider recalibrating model weights to reduce prediction error.');
    }
    
    if (overallMetrics.directionalAccuracy < THRESHOLDS.directionalAccuracy.warning) {
      recommendations.push('Directional accuracy is below target. Review event classification logic.');
    }
    
    if (Math.abs(biasAnalysis.overallBias) > THRESHOLDS.bias.warning) {
      recommendations.push(`Model shows ${biasAnalysis.overallBias > 0 ? 'over' : 'under'}estimation bias. Apply global scaling adjustment.`);
    }
    
    biasAnalysis.systematicPatterns.forEach(pattern => {
      recommendations.push(`Address systematic pattern: ${pattern}`);
    });
    
    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (overallMetrics.correlation > 0.8 && overallMetrics.directionalAccuracy > 80) {
      confidence = 'high';
    } else if (overallMetrics.correlation > 0.6 && overallMetrics.directionalAccuracy > 65) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    const report: AccuracyReport = {
      generatedAt: now,
      period: { start: startDate, end: now },
      overallMetrics: {
        mae: overallMetrics.mae,
        rmse: overallMetrics.rmse,
        mape: 0, // Calculate if needed
        correlation: overallMetrics.correlation,
        r2: overallMetrics.correlation * overallMetrics.correlation,
        directionalAccuracy: overallMetrics.directionalAccuracy,
        magnitudeAccuracy: 0, // Calculate if needed
        bias: biasAnalysis.overallBias
      },
      rollingMetrics,
      biasAnalysis,
      alerts: this.alerts.filter(a => !a.acknowledged),
      recommendations,
      confidence
    };
    
    this.lastReport = report;
    console.log('[Accuracy Tracker] 📋 Generated accuracy report');
    
    return report;
  }

  /**
   * Check and generate alerts
   */
  private checkAlerts(): void {
    const metrics = this.getRollingMetrics('30D');
    
    // Check MAE
    if (metrics.mae > THRESHOLDS.mae.critical) {
      this.createAlert('accuracy_drop', 'critical', 
        `MAE has exceeded critical threshold (${metrics.mae.toFixed(2)} > ${THRESHOLDS.mae.critical})`,
        'mae', metrics.mae, THRESHOLDS.mae.critical);
    } else if (metrics.mae > THRESHOLDS.mae.warning) {
      this.createAlert('accuracy_drop', 'warning',
        `MAE is above warning threshold (${metrics.mae.toFixed(2)} > ${THRESHOLDS.mae.warning})`,
        'mae', metrics.mae, THRESHOLDS.mae.warning);
    }
    
    // Check directional accuracy
    if (metrics.directionalAccuracy < THRESHOLDS.directionalAccuracy.critical) {
      this.createAlert('accuracy_drop', 'critical',
        `Directional accuracy below critical threshold (${metrics.directionalAccuracy.toFixed(1)}% < ${THRESHOLDS.directionalAccuracy.critical}%)`,
        'directionalAccuracy', metrics.directionalAccuracy, THRESHOLDS.directionalAccuracy.critical);
    } else if (metrics.directionalAccuracy < THRESHOLDS.directionalAccuracy.warning) {
      this.createAlert('accuracy_drop', 'warning',
        `Directional accuracy below warning threshold (${metrics.directionalAccuracy.toFixed(1)}% < ${THRESHOLDS.directionalAccuracy.warning}%)`,
        'directionalAccuracy', metrics.directionalAccuracy, THRESHOLDS.directionalAccuracy.warning);
    }
    
    // Check bias
    const bias = this.analyzeBias().overallBias;
    if (Math.abs(bias) > THRESHOLDS.bias.critical) {
      this.createAlert('bias_detected', 'critical',
        `Systematic bias detected (${bias.toFixed(2)} > ${THRESHOLDS.bias.critical})`,
        'bias', bias, THRESHOLDS.bias.critical);
    } else if (Math.abs(bias) > THRESHOLDS.bias.warning) {
      this.createAlert('bias_detected', 'warning',
        `Bias above warning threshold (${bias.toFixed(2)} > ${THRESHOLDS.bias.warning})`,
        'bias', bias, THRESHOLDS.bias.warning);
    }
  }

  /**
   * Create an alert
   */
  private createAlert(
    type: AccuracyAlert['type'],
    severity: AccuracyAlert['severity'],
    message: string,
    metric: string,
    currentValue: number,
    threshold: number
  ): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      a => a.type === type && a.metric === metric && !a.acknowledged
    );
    
    if (existingAlert) {
      existingAlert.currentValue = currentValue;
      existingAlert.timestamp = new Date();
      return;
    }
    
    const alert: AccuracyAlert = {
      id: `alert-${++this.alertIdCounter}`,
      type,
      severity,
      message,
      metric,
      currentValue,
      threshold,
      timestamp: new Date(),
      acknowledged: false
    };
    
    this.alerts.push(alert);
    console.log(`[Accuracy Tracker] ⚠️ Alert: ${message}`);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AccuracyAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): AccuracyAlert[] {
    return [...this.alerts];
  }

  /**
   * Get data points
   */
  getDataPoints(): AccuracyDataPoint[] {
    return [...this.dataPoints];
  }

  /**
   * Get last report
   */
  getLastReport(): AccuracyReport | null {
    return this.lastReport;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.dataPoints = [];
    this.alerts = [];
    this.lastReport = null;
    console.log('[Accuracy Tracker] 🧹 Data cleared');
  }
}

// Singleton instance
export const modelAccuracyTracker = new ModelAccuracyTracker();