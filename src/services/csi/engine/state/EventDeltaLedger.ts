/**
 * Event Delta Ledger
 * Immutable audit trail of all CSI-affecting events
 */

import { EventDelta, RiskVector } from '../types';

export class EventDeltaLedger {
  private deltas: Map<string, EventDelta> = new Map();
  private deltasByEvent: Map<string, Set<string>> = new Map();
  private deltasByCountry: Map<string, Set<string>> = new Map();
  private deltasByVector: Map<RiskVector, Set<string>> = new Map();

  /**
   * Record a new delta
   */
  recordDelta(delta: EventDelta): void {
    if (!delta.deltaId || !delta.eventId || !delta.country || !delta.vector) {
      throw new Error('Invalid delta: missing required fields');
    }

    // Check for duplicate
    if (this.deltas.has(delta.deltaId)) {
      console.warn(`Delta ${delta.deltaId} already exists, skipping`);
      return;
    }

    // Store delta
    this.deltas.set(delta.deltaId, delta);

    // Index by event
    if (!this.deltasByEvent.has(delta.eventId)) {
      this.deltasByEvent.set(delta.eventId, new Set());
    }
    this.deltasByEvent.get(delta.eventId)!.add(delta.deltaId);

    // Index by country
    if (!this.deltasByCountry.has(delta.country)) {
      this.deltasByCountry.set(delta.country, new Set());
    }
    this.deltasByCountry.get(delta.country)!.add(delta.deltaId);

    // Index by vector
    if (!this.deltasByVector.has(delta.vector)) {
      this.deltasByVector.set(delta.vector, new Set());
    }
    this.deltasByVector.get(delta.vector)!.add(delta.deltaId);
  }

  /**
   * Get delta by ID
   */
  getDelta(deltaId: string): EventDelta | undefined {
    return this.deltas.get(deltaId);
  }

  /**
   * Get all deltas for an event
   */
  getDeltasForEvent(eventId: string): EventDelta[] {
    const deltaIds = this.deltasByEvent.get(eventId) || new Set();
    const deltas: EventDelta[] = [];

    for (const deltaId of deltaIds) {
      const delta = this.deltas.get(deltaId);
      if (delta) {
        deltas.push(delta);
      }
    }

    return deltas.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get deltas for a country
   */
  getDeltasForCountry(
    country: string,
    since?: Date,
    vector?: RiskVector
  ): EventDelta[] {
    const deltaIds = this.deltasByCountry.get(country) || new Set();
    const deltas: EventDelta[] = [];

    for (const deltaId of deltaIds) {
      const delta = this.deltas.get(deltaId);
      if (!delta) continue;

      // Filter by time
      if (since && delta.timestamp < since) continue;

      // Filter by vector
      if (vector && delta.vector !== vector) continue;

      deltas.push(delta);
    }

    return deltas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get deltas by vector
   */
  getDeltasByVector(
    vector: RiskVector,
    since?: Date,
    country?: string
  ): EventDelta[] {
    const deltaIds = this.deltasByVector.get(vector) || new Set();
    const deltas: EventDelta[] = [];

    for (const deltaId of deltaIds) {
      const delta = this.deltas.get(deltaId);
      if (!delta) continue;

      // Filter by time
      if (since && delta.timestamp < since) continue;

      // Filter by country
      if (country && delta.country !== country) continue;

      deltas.push(delta);
    }

    return deltas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Query deltas with multiple criteria
   */
  queryDeltas(criteria: {
    country?: string;
    vector?: RiskVector;
    deltaType?: EventDelta['deltaType'];
    since?: Date;
    until?: Date;
    overridesOnly?: boolean;
  }): EventDelta[] {
    let deltas = Array.from(this.deltas.values());

    // Apply filters
    if (criteria.country) {
      deltas = deltas.filter(d => d.country === criteria.country);
    }
    if (criteria.vector) {
      deltas = deltas.filter(d => d.vector === criteria.vector);
    }
    if (criteria.deltaType) {
      deltas = deltas.filter(d => d.deltaType === criteria.deltaType);
    }
    if (criteria.since) {
      deltas = deltas.filter(d => d.timestamp >= criteria.since!);
    }
    if (criteria.until) {
      deltas = deltas.filter(d => d.timestamp <= criteria.until!);
    }
    if (criteria.overridesOnly) {
      deltas = deltas.filter(d => d.auditTrail.overrideApplied);
    }

    return deltas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent deltas (last N)
   */
  getRecentDeltas(limit: number = 50): EventDelta[] {
    const deltas = Array.from(this.deltas.values());
    return deltas
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Calculate total CSI impact for a country/vector
   */
  calculateCumulativeImpact(
    country: string,
    vector: RiskVector,
    since: Date
  ): number {
    const deltas = this.getDeltasForCountry(country, since, vector);
    return deltas.reduce((sum, delta) => sum + delta.csiImpact.vectorDelta, 0);
  }

  /**
   * Get override audit trail
   */
  getOverrideAuditTrail(country?: string): EventDelta[] {
    return this.queryDeltas({
      country,
      overridesOnly: true
    });
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDeltas: number;
    newEvents: number;
    escalations: number;
    deEscalations: number;
    expirations: number;
    overridesApplied: number;
    avgVectorImpact: number;
    avgCompositeImpact: number;
  } {
    const deltas = Array.from(this.deltas.values());
    
    const newEvents = deltas.filter(d => d.deltaType === 'new').length;
    const escalations = deltas.filter(d => d.deltaType === 'escalation').length;
    const deEscalations = deltas.filter(d => d.deltaType === 'de-escalation').length;
    const expirations = deltas.filter(d => d.deltaType === 'expiration').length;
    const overridesApplied = deltas.filter(d => d.auditTrail.overrideApplied).length;

    const avgVectorImpact = deltas.length > 0
      ? deltas.reduce((sum, d) => sum + Math.abs(d.csiImpact.vectorDelta), 0) / deltas.length
      : 0;

    const avgCompositeImpact = deltas.length > 0
      ? deltas.reduce((sum, d) => sum + Math.abs(d.csiImpact.compositeDelta), 0) / deltas.length
      : 0;

    return {
      totalDeltas: this.deltas.size,
      newEvents,
      escalations,
      deEscalations,
      expirations,
      overridesApplied,
      avgVectorImpact,
      avgCompositeImpact
    };
  }

  /**
   * Export audit trail for compliance
   */
  exportAuditTrail(
    startDate: Date,
    endDate: Date,
    country?: string
  ): EventDelta[] {
    return this.queryDeltas({
      country,
      since: startDate,
      until: endDate
    });
  }
}

// Singleton instance
export const eventDeltaLedger = new EventDeltaLedger();