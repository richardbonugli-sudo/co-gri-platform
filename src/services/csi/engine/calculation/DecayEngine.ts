/**
 * Decay Engine
 * Manages time-based decay of event impacts
 */

import { EventPersistence, DecayParameters, EscalationLevel } from '../types';

export class DecayEngine {
  private persistenceRecords: Map<string, EventPersistence> = new Map();
  private decayParams: DecayParameters;

  constructor() {
    // Default decay parameters (30-day half-life, exponential)
    this.decayParams = {
      halfLife: 30, // days
      minimumPersistence: 48, // hours
      criticalPersistence: 72, // hours
      decayFunction: 'exponential'
    };
  }

  /**
   * Create persistence record for new event
   */
  createPersistence(
    eventId: string,
    escalationLevel: EscalationLevel
  ): EventPersistence {
    const now = new Date();
    
    // Determine persistence duration based on escalation level
    const persistenceHours = escalationLevel === EscalationLevel.CRITICAL
      ? this.decayParams.criticalPersistence
      : this.decayParams.minimumPersistence;

    const expiresAt = new Date(now.getTime() + persistenceHours * 60 * 60 * 1000);

    const persistence: EventPersistence = {
      eventId,
      createdAt: now,
      lastRefreshed: now,
      expiresAt,
      decayRate: this.calculateDecayRate(),
      currentWeight: 1.0,
      persistenceExtensions: []
    };

    this.persistenceRecords.set(eventId, persistence);
    return persistence;
  }

  /**
   * Calculate decay rate based on half-life
   */
  private calculateDecayRate(): number {
    // For exponential decay: rate = ln(2) / half-life
    return Math.log(2) / this.decayParams.halfLife;
  }

  /**
   * Calculate current weight for an event
   */
  calculateWeight(eventId: string): number {
    const persistence = this.persistenceRecords.get(eventId);
    if (!persistence) return 0;

    const now = new Date();

    // Check if expired
    if (now >= persistence.expiresAt) {
      return 0;
    }

    // Calculate age in days
    const ageMs = now.getTime() - persistence.createdAt.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);

    // Apply decay function
    let weight: number;
    
    switch (this.decayParams.decayFunction) {
      case 'exponential':
        // w(t) = e^(-λt) where λ = ln(2) / half-life
        weight = Math.exp(-persistence.decayRate * ageDays);
        break;
      
      case 'linear':
        // w(t) = 1 - (t / (2 * half-life))
        weight = Math.max(0, 1 - (ageDays / (2 * this.decayParams.halfLife)));
        break;
      
      case 'step':
        // w(t) = 1 if t < half-life, 0.5 if t < 2*half-life, 0 otherwise
        if (ageDays < this.decayParams.halfLife) {
          weight = 1.0;
        } else if (ageDays < 2 * this.decayParams.halfLife) {
          weight = 0.5;
        } else {
          weight = 0;
        }
        break;
      
      default:
        weight = 1.0;
    }

    // Update current weight
    persistence.currentWeight = weight;
    
    return weight;
  }

  /**
   * Refresh event persistence (extends expiration)
   */
  refreshPersistence(
    eventId: string,
    reason: string,
    extensionHours: number = 24
  ): void {
    const persistence = this.persistenceRecords.get(eventId);
    if (!persistence) return;

    const now = new Date();
    persistence.lastRefreshed = now;
    
    // Extend expiration
    const newExpiration = new Date(
      persistence.expiresAt.getTime() + extensionHours * 60 * 60 * 1000
    );
    persistence.expiresAt = newExpiration;

    // Record extension
    persistence.persistenceExtensions.push({
      timestamp: now,
      reason,
      extendedBy: extensionHours
    });
  }

  /**
   * Check if event has expired
   */
  isExpired(eventId: string): boolean {
    const persistence = this.persistenceRecords.get(eventId);
    if (!persistence) return true;

    return new Date() >= persistence.expiresAt;
  }

  /**
   * Get persistence record
   */
  getPersistence(eventId: string): EventPersistence | undefined {
    return this.persistenceRecords.get(eventId);
  }

  /**
   * Get all active events (not expired)
   */
  getActiveEvents(): EventPersistence[] {
    const now = new Date();
    return Array.from(this.persistenceRecords.values())
      .filter(p => now < p.expiresAt);
  }

  /**
   * Get expiring events (within next N hours)
   */
  getExpiringEvents(withinHours: number = 24): EventPersistence[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
    
    return Array.from(this.persistenceRecords.values())
      .filter(p => now < p.expiresAt && p.expiresAt <= threshold);
  }

  /**
   * Clean up expired events
   */
  pruneExpiredEvents(): number {
    const now = new Date();
    let prunedCount = 0;

    for (const [eventId, persistence] of this.persistenceRecords.entries()) {
      if (now >= persistence.expiresAt) {
        this.persistenceRecords.delete(eventId);
        prunedCount++;
      }
    }

    return prunedCount;
  }

  /**
   * Update decay parameters
   */
  updateDecayParameters(params: Partial<DecayParameters>): void {
    this.decayParams = { ...this.decayParams, ...params };
    
    // Recalculate decay rate if half-life changed
    if (params.halfLife !== undefined) {
      const newRate = this.calculateDecayRate();
      
      // Update all persistence records
      for (const persistence of this.persistenceRecords.values()) {
        persistence.decayRate = newRate;
      }
    }
  }

  /**
   * Get decay parameters
   */
  getDecayParameters(): DecayParameters {
    return { ...this.decayParams };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEvents: number;
    activeEvents: number;
    expiredEvents: number;
    avgWeight: number;
    expiringIn24h: number;
  } {
    const now = new Date();
    const threshold24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    let activeCount = 0;
    let expiredCount = 0;
    let expiringCount = 0;
    let totalWeight = 0;

    for (const persistence of this.persistenceRecords.values()) {
      if (now >= persistence.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
        totalWeight += this.calculateWeight(persistence.eventId);
        
        if (persistence.expiresAt <= threshold24h) {
          expiringCount++;
        }
      }
    }

    return {
      totalEvents: this.persistenceRecords.size,
      activeEvents: activeCount,
      expiredEvents: expiredCount,
      avgWeight: activeCount > 0 ? totalWeight / activeCount : 0,
      expiringIn24h: expiringCount
    };
  }
}

// Singleton instance
export const decayEngine = new DecayEngine();