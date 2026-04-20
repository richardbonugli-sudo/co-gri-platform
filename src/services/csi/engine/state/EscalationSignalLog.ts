/**
 * Escalation Signal Log
 * Immutable append-only log of all incoming signals
 */

import { EscalationSignal, SourceTier, RiskVector, EscalationLevel } from '../types';

export class EscalationSignalLog {
  private signals: Map<string, EscalationSignal> = new Map();
  private signalsByCountry: Map<string, Set<string>> = new Map();
  private signalsByVector: Map<RiskVector, Set<string>> = new Map();
  private signalsBySource: Map<string, Set<string>> = new Map();

  /**
   * Append a new signal to the log
   */
  append(signal: EscalationSignal): void {
    // Validate signal
    if (!signal.signalId || !signal.country || !signal.vector) {
      throw new Error('Invalid signal: missing required fields');
    }

    // Check for duplicate
    if (this.signals.has(signal.signalId)) {
      console.warn(`Signal ${signal.signalId} already exists, skipping`);
      return;
    }

    // Store signal
    this.signals.set(signal.signalId, signal);

    // Index by country
    if (!this.signalsByCountry.has(signal.country)) {
      this.signalsByCountry.set(signal.country, new Set());
    }
    this.signalsByCountry.get(signal.country)!.add(signal.signalId);

    // Index by vector
    if (!this.signalsByVector.has(signal.vector)) {
      this.signalsByVector.set(signal.vector, new Set());
    }
    this.signalsByVector.get(signal.vector)!.add(signal.signalId);

    // Index by source
    if (!this.signalsBySource.has(signal.sourceId)) {
      this.signalsBySource.set(signal.sourceId, new Set());
    }
    this.signalsBySource.get(signal.sourceId)!.add(signal.signalId);
  }

  /**
   * Get signal by ID
   */
  getSignal(signalId: string): EscalationSignal | undefined {
    return this.signals.get(signalId);
  }

  /**
   * Get signals for a country within a time window
   */
  getSignalsByCountry(
    country: string,
    since?: Date,
    vector?: RiskVector
  ): EscalationSignal[] {
    const signalIds = this.signalsByCountry.get(country) || new Set();
    const signals: EscalationSignal[] = [];

    for (const signalId of signalIds) {
      const signal = this.signals.get(signalId);
      if (!signal) continue;

      // Filter by time
      if (since && signal.timestamp < since) continue;

      // Filter by vector
      if (vector && signal.vector !== vector) continue;

      signals.push(signal);
    }

    return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get signals by vector
   */
  getSignalsByVector(
    vector: RiskVector,
    since?: Date,
    country?: string
  ): EscalationSignal[] {
    const signalIds = this.signalsByVector.get(vector) || new Set();
    const signals: EscalationSignal[] = [];

    for (const signalId of signalIds) {
      const signal = this.signals.get(signalId);
      if (!signal) continue;

      // Filter by time
      if (since && signal.timestamp < since) continue;

      // Filter by country
      if (country && signal.country !== country) continue;

      signals.push(signal);
    }

    return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get signals from a specific source
   */
  getSignalsBySource(sourceId: string, since?: Date): EscalationSignal[] {
    const signalIds = this.signalsBySource.get(sourceId) || new Set();
    const signals: EscalationSignal[] = [];

    for (const signalId of signalIds) {
      const signal = this.signals.get(signalId);
      if (!signal) continue;

      // Filter by time
      if (since && signal.timestamp < since) continue;

      signals.push(signal);
    }

    return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get signals matching multiple criteria
   */
  querySignals(criteria: {
    country?: string;
    vector?: RiskVector;
    sourceTier?: SourceTier;
    escalationLevel?: EscalationLevel;
    since?: Date;
    until?: Date;
    minConfidence?: number;
  }): EscalationSignal[] {
    let signals = Array.from(this.signals.values());

    // Apply filters
    if (criteria.country) {
      signals = signals.filter(s => s.country === criteria.country);
    }
    if (criteria.vector) {
      signals = signals.filter(s => s.vector === criteria.vector);
    }
    if (criteria.sourceTier) {
      signals = signals.filter(s => s.sourceTier === criteria.sourceTier);
    }
    if (criteria.escalationLevel) {
      signals = signals.filter(s => s.escalationLevel === criteria.escalationLevel);
    }
    if (criteria.since) {
      signals = signals.filter(s => s.timestamp >= criteria.since!);
    }
    if (criteria.until) {
      signals = signals.filter(s => s.timestamp <= criteria.until!);
    }
    if (criteria.minConfidence !== undefined) {
      signals = signals.filter(s => s.confidence >= criteria.minConfidence!);
    }

    return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get total signal count
   */
  getTotalSignals(): number {
    return this.signals.size;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSignals: number;
    countryCoverage: number;
    vectorCoverage: number;
    sourceCoverage: number;
    avgConfidence: number;
  } {
    const signals = Array.from(this.signals.values());
    const avgConfidence = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0;

    return {
      totalSignals: this.signals.size,
      countryCoverage: this.signalsByCountry.size,
      vectorCoverage: this.signalsByVector.size,
      sourceCoverage: this.signalsBySource.size,
      avgConfidence
    };
  }

  /**
   * Clear old signals (for maintenance)
   */
  pruneOldSignals(olderThan: Date): number {
    let prunedCount = 0;

    for (const [signalId, signal] of this.signals.entries()) {
      if (signal.timestamp < olderThan) {
        this.signals.delete(signalId);
        
        // Remove from indexes
        this.signalsByCountry.get(signal.country)?.delete(signalId);
        this.signalsByVector.get(signal.vector)?.delete(signalId);
        this.signalsBySource.get(signal.sourceId)?.delete(signalId);
        
        prunedCount++;
      }
    }

    return prunedCount;
  }
}

// Singleton instance
export const escalationSignalLog = new EscalationSignalLog();