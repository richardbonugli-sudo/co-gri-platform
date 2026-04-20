/**
 * Drift Calculator
 * Calculates baseline drift from qualified signals
 */

import type { StructuredSignal } from '@/types/csi-enhancement/signals';
import type { 
  DriftCalculationResult, 
  SignalContribution, 
  DriftConfig 
} from '@/types/csi-enhancement/drift';
import { VECTOR_WEIGHTS, SEVERITY_MULTIPLIERS, DEFAULT_DRIFT_CONFIG } from '@/types/csi-enhancement/drift';

export class DriftCalculator {
  private config: DriftConfig;

  constructor(config: DriftConfig = DEFAULT_DRIFT_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate drift for all country-vector pairs
   */
  async calculateAllDrifts(
    signals: StructuredSignal[],
    currentDate: Date = new Date()
  ): Promise<Map<string, DriftCalculationResult>> {
    const drifts = new Map<string, DriftCalculationResult>();

    // Get unique country-vector pairs
    const pairs = this.getCountryVectorPairs(signals);

    for (const [country, vector] of pairs) {
      const result = this.calculateDrift(country, vector, signals, currentDate);
      const key = `${country}:${vector}`;
      drifts.set(key, result);
    }

    return drifts;
  }

  /**
   * Calculate drift for specific country-vector
   */
  calculateDrift(
    country: string,
    vector: string,
    signals: StructuredSignal[],
    currentDate: Date = new Date()
  ): DriftCalculationResult {
    // Filter relevant signals
    const relevantSignals = signals.filter(s =>
      s.countries.includes(country) &&
      s.primaryVector === vector &&
      s.isQualified
    );

    // Calculate contributions from each signal
    const contributions: SignalContribution[] = [];
    let totalImpact = 0;

    for (const signal of relevantSignals) {
      const contribution = this.calculateSignalContribution(signal, currentDate);
      contributions.push(contribution);
      totalImpact += contribution.contribution;
    }

    // Apply drift cap
    const cappedDrift = this.applyDriftCap(totalImpact);

    return {
      country,
      vector,
      drift: cappedDrift,
      contributions: contributions.sort((a, b) => b.contribution - a.contribution),
      totalImpact,
      cappedDrift
    };
  }

  /**
   * Calculate signal contribution to drift
   */
  private calculateSignalContribution(
    signal: StructuredSignal,
    currentDate: Date
  ): SignalContribution {
    const impactScore = this.calculateSignalImpact(signal);
    const decayFactor = this.calculateDecayFactor(signal, currentDate);
    const contribution = impactScore * decayFactor;

    return {
      signalId: signal.signalId,
      signal,
      impactScore,
      decayFactor,
      contribution
    };
  }

  /**
   * Calculate signal impact
   * Impact = Vector Weight × Severity Multiplier × Credibility × Persistence
   */
  calculateSignalImpact(signal: StructuredSignal): number {
    // Base impact from vector weight
    const vectorWeight = this.config.vectorWeights[signal.primaryVector] || 2.0;

    // Severity multiplier
    const severityMultiplier = this.config.severityMultipliers[signal.severity] || 1.0;

    // Credibility factor (0.6-1.0)
    const credibilityFactor = signal.sourceCredibility;

    // Persistence factor (0.6-1.0)
    const persistenceFactor = signal.corroborationScore || 0.7;

    // Combined impact
    const impact = vectorWeight * severityMultiplier * credibilityFactor * persistenceFactor;

    return impact;
  }

  /**
   * Calculate decay factor
   * Decay = e^(-λt) where λ = ln(2) / half_life
   */
  calculateDecayFactor(signal: StructuredSignal, currentDate: Date): number {
    const lambda = Math.log(2) / this.config.halfLifeDays;
    
    const daysSinceDetection = (currentDate.getTime() - signal.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Ensure non-negative
    const days = Math.max(0, daysSinceDetection);
    
    const decayFactor = Math.exp(-lambda * days);
    
    return decayFactor;
  }

  /**
   * Apply drift cap (±max)
   */
  applyDriftCap(drift: number): number {
    const max = this.config.maxDrift;
    if (drift > max) return max;
    if (drift < -max) return -max;
    return drift;
  }

  /**
   * Get unique country-vector pairs from signals
   */
  private getCountryVectorPairs(signals: StructuredSignal[]): [string, string][] {
    const pairs = new Set<string>();

    for (const signal of signals) {
      if (!signal.isQualified) continue;
      
      for (const country of signal.countries) {
        const key = `${country}:${signal.primaryVector}`;
        pairs.add(key);
      }
    }

    return Array.from(pairs).map(key => {
      const [country, vector] = key.split(':');
      return [country, vector];
    });
  }

  /**
   * Get configuration
   */
  getConfig(): DriftConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DriftConfig>): void {
    this.config = { ...this.config, ...config };
  }
}