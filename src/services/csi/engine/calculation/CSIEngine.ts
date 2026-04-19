/**
 * CSI Engine
 * Core calculation engine: CSI(t) = Baseline + Drift + Delta
 */

import { CSIScore, VectorScore, RiskVector, EventCandidate, EventDelta } from '../types';
import { baselineCalculator } from './BaselineCalculator';
import { decayEngine } from './DecayEngine';
import { eventCandidateStore } from '../state/EventCandidateStore';
import { eventDeltaLedger } from '../state/EventDeltaLedger';

export class CSIEngine {
  private currentScores: Map<string, CSIScore> = new Map();

  /**
   * Calculate CSI score for country
   * Formula: CSI(t) = Baseline + Drift + Delta
   */
  async calculateCSI(country: string): Promise<CSIScore> {
    const timestamp = new Date();
    const vectorScores: Record<RiskVector, VectorScore> = {} as any;

    // Calculate score for each vector
    for (const vector of Object.values(RiskVector)) {
      vectorScores[vector] = await this.calculateVectorScore(country, vector, timestamp);
    }

    // Calculate composite score (weighted average)
    const compositeScore = this.calculateCompositeScore(vectorScores);

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(vectorScores);

    // Calculate data quality metrics
    const dataQuality = this.calculateDataQuality(country, vectorScores);

    const csiScore: CSIScore = {
      country,
      timestamp,
      compositeScore,
      vectorScores,
      confidenceInterval,
      dataQuality
    };

    // Cache score
    this.currentScores.set(country, csiScore);

    return csiScore;
  }

  /**
   * Calculate score for a specific vector
   * CSI_vector(t) = Baseline_vector + Drift_vector + Delta_vector
   */
  private async calculateVectorScore(
    country: string,
    vector: RiskVector,
    timestamp: Date
  ): Promise<VectorScore> {
    // Get baseline
    const baseline = await baselineCalculator.getOrCalculateBaseline(country, vector);
    const baselineScore = baseline.baselineScore;

    // Calculate drift (from validated events)
    const drift = this.calculateDrift(country, vector, timestamp);

    // Calculate delta (from recent events with decay)
    const delta = this.calculateDelta(country, vector, timestamp);

    // Current score = Baseline + Drift + Delta
    const currentScore = Math.max(0, Math.min(100, baselineScore + drift + delta));

    // Get active events
    const activeEvents = this.getActiveEvents(country, vector);

    // Determine trend
    const trend = this.determineTrend(country, vector, currentScore, baselineScore);

    return {
      vector,
      baselineScore,
      currentScore,
      activeEvents,
      lastUpdated: timestamp,
      trend
    };
  }

  /**
   * Calculate drift component
   * Drift represents sustained changes from validated long-term events
   */
  private calculateDrift(country: string, vector: RiskVector, timestamp: Date): number {
    // Get validated events from the last 6 months
    const sixMonthsAgo = new Date(timestamp.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const deltas = eventDeltaLedger.getDeltasForCountry(country, sixMonthsAgo, vector);
    
    // Sum up vector deltas from validated events
    let drift = 0;
    for (const delta of deltas) {
      if (delta.deltaType === 'new' || delta.deltaType === 'escalation') {
        drift += delta.csiImpact.vectorDelta;
      } else if (delta.deltaType === 'de-escalation') {
        drift -= Math.abs(delta.csiImpact.vectorDelta);
      }
    }

    return drift;
  }

  /**
   * Calculate delta component
   * Delta represents recent events with time-based decay
   */
  private calculateDelta(country: string, vector: RiskVector, timestamp: Date): number {
    // Get recent deltas (last 90 days)
    const ninetyDaysAgo = new Date(timestamp.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const deltas = eventDeltaLedger.getDeltasForCountry(country, ninetyDaysAgo, vector);
    
    // Apply decay to each delta
    let delta = 0;
    for (const deltaRecord of deltas) {
      const weight = decayEngine.calculateWeight(deltaRecord.eventId);
      const impact = deltaRecord.csiImpact.vectorDelta * weight;
      delta += impact;
    }

    return delta;
  }

  /**
   * Get active events for country/vector
   */
  private getActiveEvents(country: string, vector: RiskVector): string[] {
    const candidates = eventCandidateStore.getValidatedCandidates(country);
    
    return candidates
      .filter(c => c.vector === vector && !decayEngine.isExpired(c.candidateId))
      .map(c => c.candidateId);
  }

  /**
   * Calculate composite score from vector scores
   */
  private calculateCompositeScore(vectorScores: Record<RiskVector, VectorScore>): number {
    // Equal weighting for now (can be adjusted based on requirements)
    const weights: Record<RiskVector, number> = {
      [RiskVector.POLITICAL]: 0.20,
      [RiskVector.ECONOMIC]: 0.20,
      [RiskVector.SECURITY]: 0.20,
      [RiskVector.SOCIAL]: 0.15,
      [RiskVector.ENVIRONMENTAL]: 0.15,
      [RiskVector.TECHNOLOGICAL]: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [vector, score] of Object.entries(vectorScores)) {
      const weight = weights[vector as RiskVector];
      weightedSum += score.currentScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    vectorScores: Record<RiskVector, VectorScore>
  ): { lower: number; upper: number } {
    const scores = Object.values(vectorScores).map(v => v.currentScore);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    // Calculate standard deviation
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (±1.96 * stdDev)
    const margin = 1.96 * stdDev;

    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(100, mean + margin)
    };
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(
    country: string,
    vectorScores: Record<RiskVector, VectorScore>
  ): CSIScore['dataQuality'] {
    // Coverage: How many vectors have active events
    const vectorsWithEvents = Object.values(vectorScores)
      .filter(v => v.activeEvents.length > 0).length;
    const coverageScore = vectorsWithEvents / Object.keys(RiskVector).length;

    // Recency: Average age of last updates
    const now = Date.now();
    const ages = Object.values(vectorScores)
      .map(v => now - v.lastUpdated.getTime());
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const recencyScore = Math.max(0, 1 - (avgAge / maxAge));

    // Source reliability: Average from active events
    // (Simplified - in production, would check actual source reliability)
    const sourceReliability = 0.85; // Default

    return {
      coverageScore,
      recencyScore,
      sourceReliability
    };
  }

  /**
   * Determine trend direction
   */
  private determineTrend(
    country: string,
    vector: RiskVector,
    currentScore: number,
    baselineScore: number
  ): 'improving' | 'stable' | 'deteriorating' {
    const diff = currentScore - baselineScore;
    const threshold = 5; // 5-point threshold for stability

    if (diff > threshold) {
      return 'deteriorating'; // Higher score = higher risk
    } else if (diff < -threshold) {
      return 'improving'; // Lower score = lower risk
    } else {
      return 'stable';
    }
  }

  /**
   * Get current score for country
   */
  getCurrentScore(country: string): CSIScore | undefined {
    return this.currentScores.get(country);
  }

  /**
   * Get vector score
   */
  getVectorScore(country: string, vector: RiskVector): VectorScore | undefined {
    const score = this.currentScores.get(country);
    return score?.vectorScores[vector];
  }

  /**
   * Recalculate all scores
   */
  async recalculateAll(countries: string[]): Promise<void> {
    for (const country of countries) {
      try {
        await this.calculateCSI(country);
        console.log(`Recalculated CSI for ${country}`);
      } catch (error) {
        console.error(`Failed to recalculate CSI for ${country}:`, error);
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCountries: number;
    avgCompositeScore: number;
    avgDataQuality: number;
    countriesAtRisk: number; // Score > 70
  } {
    const scores = Array.from(this.currentScores.values());
    
    if (scores.length === 0) {
      return {
        totalCountries: 0,
        avgCompositeScore: 0,
        avgDataQuality: 0,
        countriesAtRisk: 0
      };
    }

    const avgCompositeScore = scores.reduce((sum, s) => sum + s.compositeScore, 0) / scores.length;
    
    const avgDataQuality = scores.reduce((sum, s) => {
      const dq = s.dataQuality;
      return sum + (dq.coverageScore + dq.recencyScore + dq.sourceReliability) / 3;
    }, 0) / scores.length;

    const countriesAtRisk = scores.filter(s => s.compositeScore > 70).length;

    return {
      totalCountries: scores.length,
      avgCompositeScore,
      avgDataQuality,
      countriesAtRisk
    };
  }
}

// Singleton instance
export const csiEngine = new CSIEngine();