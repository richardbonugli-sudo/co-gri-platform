/**
 * Historical Backtesting Engine
 * 
 * Replays historical geopolitical events through the CSI calculation system,
 * compares model predictions against actual outcomes, and calculates
 * accuracy metrics for model validation.
 */

import { 
  GROUND_TRUTH_EVENTS, 
  type GroundTruthEvent,
  getGroundTruthEventsByPeriod,
  calculatePredictionErrors
} from '@/data/groundTruthEvents';
import { eventClassificationEngine, type ClassificationResult } from './eventClassificationEngine';
import { regionalPropagationEngine, type PropagationChain } from './regionalPropagationEngine';
import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

export interface BacktestResult {
  eventId: string;
  event: GroundTruthEvent;
  modelPrediction: {
    deltaCSI: number;
    classification: ClassificationResult;
    propagation: PropagationChain;
  };
  actual: {
    deltaCSI: number;
    marketImpact: GroundTruthEvent['marketImpact'];
  };
  error: number;
  absoluteError: number;
  percentageError: number;
  direction: 'correct' | 'incorrect';
  magnitude: 'accurate' | 'underestimate' | 'overestimate';
}

export interface BacktestSummary {
  totalEvents: number;
  processedEvents: number;
  timeRange: { start: Date; end: Date };
  metrics: AccuracyMetrics;
  byCategory: Record<string, CategoryMetrics>;
  byRegion: Record<string, RegionMetrics>;
  bySeverity: Record<string, SeverityMetrics>;
  outliers: BacktestResult[];
  calibrationRecommendations: CalibrationRecommendation[];
}

export interface AccuracyMetrics {
  mae: number;                    // Mean Absolute Error
  rmse: number;                   // Root Mean Square Error
  mape: number;                   // Mean Absolute Percentage Error
  correlation: number;            // Pearson correlation coefficient
  r2: number;                     // R-squared
  directionalAccuracy: number;    // % of correct direction predictions
  magnitudeAccuracy: number;      // % within 20% of actual
  bias: number;                   // Average prediction bias
}

export interface CategoryMetrics {
  category: EventCategory;
  eventCount: number;
  mae: number;
  rmse: number;
  directionalAccuracy: number;
  avgPrediction: number;
  avgActual: number;
  bias: number;
}

export interface RegionMetrics {
  region: string;
  eventCount: number;
  mae: number;
  directionalAccuracy: number;
  avgPrediction: number;
  avgActual: number;
}

export interface SeverityMetrics {
  severity: EventSeverity;
  eventCount: number;
  mae: number;
  directionalAccuracy: number;
  avgPrediction: number;
  avgActual: number;
}

export interface CalibrationRecommendation {
  type: 'vector_weight' | 'severity_mapping' | 'propagation_decay' | 'regional_bias';
  target: string;
  currentValue: number;
  recommendedValue: number;
  expectedImprovement: number;
  reasoning: string;
}

class BacktestingEngine {
  private results: Map<string, BacktestResult> = new Map();
  private lastBacktestSummary: BacktestSummary | null = null;

  /**
   * Run full backtest on historical events
   */
  runBacktest(
    startDate?: Date,
    endDate?: Date
  ): BacktestSummary {
    const start = startDate || new Date('2023-01-01');
    const end = endDate || new Date('2025-12-31');
    
    console.log(`[Backtesting] 🔄 Running backtest from ${start.toISOString()} to ${end.toISOString()}`);
    
    // Get events in range
    const events = getGroundTruthEventsByPeriod(start, end);
    console.log(`[Backtesting] 📊 Processing ${events.length} events`);
    
    // Clear previous results
    this.results.clear();
    
    // Process each event
    events.forEach(event => {
      const result = this.processEvent(event);
      this.results.set(event.id, result);
    });
    
    // Calculate summary
    const summary = this.calculateSummary(start, end);
    this.lastBacktestSummary = summary;
    
    console.log(`[Backtesting] ✅ Backtest complete. MAE: ${summary.metrics.mae.toFixed(2)}, Correlation: ${summary.metrics.correlation.toFixed(3)}`);
    
    return summary;
  }

  /**
   * Process a single event through the model
   */
  private processEvent(event: GroundTruthEvent): BacktestResult {
    // Create normalized event for classification
    const normalizedEvent = {
      id: event.id,
      source: 'BACKTEST' as const,
      timestamp: event.date,
      headline: event.title,
      description: event.description,
      country: event.primaryCountry,
      region: event.region,
      category: event.category,
      severity: event.severity,
      confidence: 0.95,
      status: 'processed' as const,
      processedAt: new Date()
    };
    
    // Run through classification engine
    const classification = eventClassificationEngine.classifyEvent(normalizedEvent as any);
    
    // Run through propagation engine
    const propagation = regionalPropagationEngine.calculatePropagation(
      event.id,
      event.primaryCountry,
      classification
    );
    
    // Calculate error metrics
    const predicted = classification.estimatedDeltaCSI;
    const actual = event.actualDeltaCSI;
    const error = predicted - actual;
    const absoluteError = Math.abs(error);
    const percentageError = actual !== 0 ? (absoluteError / Math.abs(actual)) * 100 : 0;
    
    // Determine direction accuracy
    const predictedDirection = predicted > 0 ? 'increase' : predicted < 0 ? 'decrease' : 'neutral';
    const actualDirection = actual > 0 ? 'increase' : actual < 0 ? 'decrease' : 'neutral';
    const direction = predictedDirection === actualDirection ? 'correct' : 'incorrect';
    
    // Determine magnitude accuracy
    let magnitude: 'accurate' | 'underestimate' | 'overestimate';
    if (percentageError <= 20) {
      magnitude = 'accurate';
    } else if (Math.abs(predicted) < Math.abs(actual)) {
      magnitude = 'underestimate';
    } else {
      magnitude = 'overestimate';
    }
    
    return {
      eventId: event.id,
      event,
      modelPrediction: {
        deltaCSI: predicted,
        classification,
        propagation
      },
      actual: {
        deltaCSI: actual,
        marketImpact: event.marketImpact
      },
      error,
      absoluteError,
      percentageError,
      direction,
      magnitude
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(startDate: Date, endDate: Date): BacktestSummary {
    const results = Array.from(this.results.values());
    
    // Calculate overall metrics
    const metrics = this.calculateAccuracyMetrics(results);
    
    // Calculate by category
    const byCategory = this.calculateCategoryMetrics(results);
    
    // Calculate by region
    const byRegion = this.calculateRegionMetrics(results);
    
    // Calculate by severity
    const bySeverity = this.calculateSeverityMetrics(results);
    
    // Identify outliers (>2 std dev from mean error)
    const meanError = results.reduce((sum, r) => sum + r.absoluteError, 0) / results.length;
    const stdError = Math.sqrt(
      results.reduce((sum, r) => sum + Math.pow(r.absoluteError - meanError, 2), 0) / results.length
    );
    const outliers = results.filter(r => r.absoluteError > meanError + 2 * stdError);
    
    // Generate calibration recommendations
    const calibrationRecommendations = this.generateCalibrationRecommendations(byCategory, byRegion, metrics);
    
    return {
      totalEvents: GROUND_TRUTH_EVENTS.length,
      processedEvents: results.length,
      timeRange: { start: startDate, end: endDate },
      metrics,
      byCategory,
      byRegion,
      bySeverity,
      outliers,
      calibrationRecommendations
    };
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(results: BacktestResult[]): AccuracyMetrics {
    if (results.length === 0) {
      return {
        mae: 0, rmse: 0, mape: 0, correlation: 0, r2: 0,
        directionalAccuracy: 0, magnitudeAccuracy: 0, bias: 0
      };
    }
    
    const n = results.length;
    const predictions = results.map(r => r.modelPrediction.deltaCSI);
    const actuals = results.map(r => r.actual.deltaCSI);
    const errors = results.map(r => r.error);
    const absErrors = results.map(r => r.absoluteError);
    
    // MAE
    const mae = absErrors.reduce((a, b) => a + b, 0) / n;
    
    // RMSE
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n);
    
    // MAPE
    const mape = results.reduce((sum, r) => {
      return sum + (r.actual.deltaCSI !== 0 ? r.percentageError : 0);
    }, 0) / n;
    
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
    
    // R-squared
    const ssRes = errors.reduce((sum, e) => sum + e * e, 0);
    const ssTot = actuals.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
    const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    
    // Directional accuracy
    const correctDirection = results.filter(r => r.direction === 'correct').length;
    const directionalAccuracy = (correctDirection / n) * 100;
    
    // Magnitude accuracy (within 20%)
    const accurateMagnitude = results.filter(r => r.magnitude === 'accurate').length;
    const magnitudeAccuracy = (accurateMagnitude / n) * 100;
    
    // Bias
    const bias = errors.reduce((a, b) => a + b, 0) / n;
    
    return {
      mae,
      rmse,
      mape,
      correlation,
      r2,
      directionalAccuracy,
      magnitudeAccuracy,
      bias
    };
  }

  /**
   * Calculate metrics by category
   */
  private calculateCategoryMetrics(results: BacktestResult[]): Record<string, CategoryMetrics> {
    const byCategory: Record<string, CategoryMetrics> = {};
    const categories = ['Conflict', 'Sanctions', 'Trade', 'Governance', 'Cyber', 'Unrest', 'Currency'];
    
    categories.forEach(cat => {
      const catResults = results.filter(r => r.event.category === cat);
      if (catResults.length > 0) {
        const errors = catResults.map(r => r.error);
        const absErrors = catResults.map(r => r.absoluteError);
        const predictions = catResults.map(r => r.modelPrediction.deltaCSI);
        const actuals = catResults.map(r => r.actual.deltaCSI);
        
        byCategory[cat] = {
          category: cat as EventCategory,
          eventCount: catResults.length,
          mae: absErrors.reduce((a, b) => a + b, 0) / catResults.length,
          rmse: Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / catResults.length),
          directionalAccuracy: (catResults.filter(r => r.direction === 'correct').length / catResults.length) * 100,
          avgPrediction: predictions.reduce((a, b) => a + b, 0) / catResults.length,
          avgActual: actuals.reduce((a, b) => a + b, 0) / catResults.length,
          bias: errors.reduce((a, b) => a + b, 0) / catResults.length
        };
      }
    });
    
    return byCategory;
  }

  /**
   * Calculate metrics by region
   */
  private calculateRegionMetrics(results: BacktestResult[]): Record<string, RegionMetrics> {
    const byRegion: Record<string, RegionMetrics> = {};
    const regions = [...new Set(results.map(r => r.event.region))];
    
    regions.forEach(region => {
      const regionResults = results.filter(r => r.event.region === region);
      if (regionResults.length > 0) {
        const absErrors = regionResults.map(r => r.absoluteError);
        const predictions = regionResults.map(r => r.modelPrediction.deltaCSI);
        const actuals = regionResults.map(r => r.actual.deltaCSI);
        
        byRegion[region] = {
          region,
          eventCount: regionResults.length,
          mae: absErrors.reduce((a, b) => a + b, 0) / regionResults.length,
          directionalAccuracy: (regionResults.filter(r => r.direction === 'correct').length / regionResults.length) * 100,
          avgPrediction: predictions.reduce((a, b) => a + b, 0) / regionResults.length,
          avgActual: actuals.reduce((a, b) => a + b, 0) / regionResults.length
        };
      }
    });
    
    return byRegion;
  }

  /**
   * Calculate metrics by severity
   */
  private calculateSeverityMetrics(results: BacktestResult[]): Record<string, SeverityMetrics> {
    const bySeverity: Record<string, SeverityMetrics> = {};
    const severities: EventSeverity[] = ['Critical', 'High', 'Moderate', 'Low'];
    
    severities.forEach(severity => {
      const sevResults = results.filter(r => r.event.severity === severity);
      if (sevResults.length > 0) {
        const absErrors = sevResults.map(r => r.absoluteError);
        const predictions = sevResults.map(r => r.modelPrediction.deltaCSI);
        const actuals = sevResults.map(r => r.actual.deltaCSI);
        
        bySeverity[severity] = {
          severity,
          eventCount: sevResults.length,
          mae: absErrors.reduce((a, b) => a + b, 0) / sevResults.length,
          directionalAccuracy: (sevResults.filter(r => r.direction === 'correct').length / sevResults.length) * 100,
          avgPrediction: predictions.reduce((a, b) => a + b, 0) / sevResults.length,
          avgActual: actuals.reduce((a, b) => a + b, 0) / sevResults.length
        };
      }
    });
    
    return bySeverity;
  }

  /**
   * Generate calibration recommendations
   */
  private generateCalibrationRecommendations(
    byCategory: Record<string, CategoryMetrics>,
    byRegion: Record<string, RegionMetrics>,
    metrics: AccuracyMetrics
  ): CalibrationRecommendation[] {
    const recommendations: CalibrationRecommendation[] = [];
    
    // Check for category-specific biases
    Object.entries(byCategory).forEach(([cat, catMetrics]) => {
      if (Math.abs(catMetrics.bias) > 1.5) {
        const currentWeight = this.getVectorWeight(cat);
        const adjustmentFactor = catMetrics.bias > 0 ? 0.9 : 1.1;
        
        recommendations.push({
          type: 'vector_weight',
          target: cat,
          currentValue: currentWeight,
          recommendedValue: currentWeight * adjustmentFactor,
          expectedImprovement: Math.abs(catMetrics.bias) * 0.3,
          reasoning: `${cat} events show ${catMetrics.bias > 0 ? 'over' : 'under'}estimation bias of ${Math.abs(catMetrics.bias).toFixed(2)}. Adjusting weight by ${((adjustmentFactor - 1) * 100).toFixed(0)}%.`
        });
      }
    });
    
    // Check for regional biases
    Object.entries(byRegion).forEach(([region, regionMetrics]) => {
      const bias = regionMetrics.avgPrediction - regionMetrics.avgActual;
      if (Math.abs(bias) > 2.0 && regionMetrics.eventCount >= 3) {
        recommendations.push({
          type: 'regional_bias',
          target: region,
          currentValue: 0,
          recommendedValue: -bias * 0.5,
          expectedImprovement: Math.abs(bias) * 0.25,
          reasoning: `${region} shows systematic ${bias > 0 ? 'over' : 'under'}estimation of ${Math.abs(bias).toFixed(2)} points. Consider regional adjustment factor.`
        });
      }
    });
    
    // Check overall model bias
    if (Math.abs(metrics.bias) > 1.0) {
      recommendations.push({
        type: 'severity_mapping',
        target: 'global',
        currentValue: 1.0,
        recommendedValue: metrics.bias > 0 ? 0.92 : 1.08,
        expectedImprovement: Math.abs(metrics.bias) * 0.4,
        reasoning: `Overall model shows ${metrics.bias > 0 ? 'over' : 'under'}estimation bias of ${Math.abs(metrics.bias).toFixed(2)}. Consider global severity scaling adjustment.`
      });
    }
    
    return recommendations;
  }

  /**
   * Get vector weight for a category
   */
  private getVectorWeight(category: string): number {
    const weights: Record<string, number> = {
      'Conflict': 0.22,
      'Sanctions': 0.18,
      'Trade': 0.16,
      'Governance': 0.14,
      'Cyber': 0.12,
      'Unrest': 0.10,
      'Currency': 0.08
    };
    return weights[category] || 0.1;
  }

  /**
   * Get backtest results
   */
  getResults(): BacktestResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get result by event ID
   */
  getResultByEventId(eventId: string): BacktestResult | undefined {
    return this.results.get(eventId);
  }

  /**
   * Get last backtest summary
   */
  getLastSummary(): BacktestSummary | null {
    return this.lastBacktestSummary;
  }

  /**
   * Get accuracy metrics
   */
  getAccuracyMetrics(): AccuracyMetrics | null {
    return this.lastBacktestSummary?.metrics || null;
  }

  /**
   * Get event comparison data for visualization
   */
  getEventComparison(): { predicted: number; actual: number; event: string; date: Date }[] {
    return Array.from(this.results.values()).map(r => ({
      predicted: r.modelPrediction.deltaCSI,
      actual: r.actual.deltaCSI,
      event: r.event.title,
      date: r.event.date
    }));
  }

  /**
   * Clear backtest results
   */
  clear(): void {
    this.results.clear();
    this.lastBacktestSummary = null;
    console.log('[Backtesting] 🧹 Results cleared');
  }
}

// Singleton instance
export const backtestingEngine = new BacktestingEngine();