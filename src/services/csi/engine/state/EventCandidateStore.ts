/**
 * Event Candidate Store
 * Manages event candidates pending validation
 */

import { EventCandidate, EventStatus, RiskVector, EscalationLevel } from '../types';

export class EventCandidateStore {
  private candidates: Map<string, EventCandidate> = new Map();
  private candidatesByCountry: Map<string, Set<string>> = new Map();
  private candidatesByVector: Map<RiskVector, Set<string>> = new Map();
  private candidatesByStatus: Map<EventStatus, Set<string>> = new Map();

  /**
   * Add a new candidate
   */
  addCandidate(candidate: EventCandidate): void {
    if (!candidate.candidateId || !candidate.country || !candidate.vector) {
      throw new Error('Invalid candidate: missing required fields');
    }

    this.candidates.set(candidate.candidateId, candidate);

    // Index by country
    if (!this.candidatesByCountry.has(candidate.country)) {
      this.candidatesByCountry.set(candidate.country, new Set());
    }
    this.candidatesByCountry.get(candidate.country)!.add(candidate.candidateId);

    // Index by vector
    if (!this.candidatesByVector.has(candidate.vector)) {
      this.candidatesByVector.set(candidate.vector, new Set());
    }
    this.candidatesByVector.get(candidate.vector)!.add(candidate.candidateId);

    // Index by status
    if (!this.candidatesByStatus.has(candidate.status)) {
      this.candidatesByStatus.set(candidate.status, new Set());
    }
    this.candidatesByStatus.get(candidate.status)!.add(candidate.candidateId);
  }

  /**
   * Update candidate status
   */
  updateCandidateStatus(candidateId: string, status: EventStatus): void {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    // Remove from old status index
    this.candidatesByStatus.get(candidate.status)?.delete(candidateId);

    // Update status
    candidate.status = status;
    candidate.lastUpdated = new Date();

    // Add to new status index
    if (!this.candidatesByStatus.has(status)) {
      this.candidatesByStatus.set(status, new Set());
    }
    this.candidatesByStatus.get(status)!.add(candidateId);
  }

  /**
   * Get candidate by ID
   */
  getCandidate(candidateId: string): EventCandidate | undefined {
    return this.candidates.get(candidateId);
  }

  /**
   * Get candidates by country
   */
  getCandidatesByCountry(
    country: string,
    status?: EventStatus,
    vector?: RiskVector
  ): EventCandidate[] {
    const candidateIds = this.candidatesByCountry.get(country) || new Set();
    const candidates: EventCandidate[] = [];

    for (const candidateId of candidateIds) {
      const candidate = this.candidates.get(candidateId);
      if (!candidate) continue;

      // Filter by status
      if (status && candidate.status !== status) continue;

      // Filter by vector
      if (vector && candidate.vector !== vector) continue;

      candidates.push(candidate);
    }

    return candidates.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  /**
   * Get candidates by status
   */
  getCandidatesByStatus(status: EventStatus): EventCandidate[] {
    const candidateIds = this.candidatesByStatus.get(status) || new Set();
    const candidates: EventCandidate[] = [];

    for (const candidateId of candidateIds) {
      const candidate = this.candidates.get(candidateId);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  /**
   * Get pending candidates (requiring validation)
   */
  getPendingCandidates(): EventCandidate[] {
    return this.getCandidatesByStatus(EventStatus.CANDIDATE);
  }

  /**
   * Get validated candidates
   */
  getValidatedCandidates(country?: string): EventCandidate[] {
    const validated = this.getCandidatesByStatus(EventStatus.VALIDATED);
    
    if (country) {
      return validated.filter(c => c.country === country);
    }
    
    return validated;
  }

  /**
   * Query candidates with multiple criteria
   */
  queryCandidates(criteria: {
    country?: string;
    vector?: RiskVector;
    status?: EventStatus;
    escalationLevel?: EscalationLevel;
    minValidationScore?: number;
    since?: Date;
  }): EventCandidate[] {
    let candidates = Array.from(this.candidates.values());

    // Apply filters
    if (criteria.country) {
      candidates = candidates.filter(c => c.country === criteria.country);
    }
    if (criteria.vector) {
      candidates = candidates.filter(c => c.vector === criteria.vector);
    }
    if (criteria.status) {
      candidates = candidates.filter(c => c.status === criteria.status);
    }
    if (criteria.escalationLevel) {
      candidates = candidates.filter(c => c.escalationLevel === criteria.escalationLevel);
    }
    if (criteria.minValidationScore !== undefined) {
      candidates = candidates.filter(c => c.validationScore >= criteria.minValidationScore!);
    }
    if (criteria.since) {
      candidates = candidates.filter(c => c.firstDetected >= criteria.since!);
    }

    return candidates.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  /**
   * Check if candidate exists for country/vector
   */
  hasActiveCandidate(country: string, vector: RiskVector): boolean {
    const candidates = this.getCandidatesByCountry(country, EventStatus.CANDIDATE, vector);
    return candidates.length > 0;
  }

  /**
   * Expire old candidates
   */
  expireOldCandidates(expirationThreshold: Date): number {
    let expiredCount = 0;

    for (const candidate of this.candidates.values()) {
      if (
        candidate.status === EventStatus.CANDIDATE &&
        candidate.lastUpdated < expirationThreshold
      ) {
        this.updateCandidateStatus(candidate.candidateId, EventStatus.EXPIRED);
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCandidates: number;
    pendingCount: number;
    validatedCount: number;
    rejectedCount: number;
    expiredCount: number;
    avgValidationScore: number;
  } {
    const candidates = Array.from(this.candidates.values());
    const avgValidationScore = candidates.length > 0
      ? candidates.reduce((sum, c) => sum + c.validationScore, 0) / candidates.length
      : 0;

    return {
      totalCandidates: this.candidates.size,
      pendingCount: this.candidatesByStatus.get(EventStatus.CANDIDATE)?.size || 0,
      validatedCount: this.candidatesByStatus.get(EventStatus.VALIDATED)?.size || 0,
      rejectedCount: this.candidatesByStatus.get(EventStatus.REJECTED)?.size || 0,
      expiredCount: this.candidatesByStatus.get(EventStatus.EXPIRED)?.size || 0,
      avgValidationScore
    };
  }

  /**
   * Clear rejected and expired candidates (maintenance)
   */
  pruneInactiveCandidates(): number {
    let prunedCount = 0;

    for (const [candidateId, candidate] of this.candidates.entries()) {
      if (
        candidate.status === EventStatus.REJECTED ||
        candidate.status === EventStatus.EXPIRED
      ) {
        this.candidates.delete(candidateId);
        
        // Remove from indexes
        this.candidatesByCountry.get(candidate.country)?.delete(candidateId);
        this.candidatesByVector.get(candidate.vector)?.delete(candidateId);
        this.candidatesByStatus.get(candidate.status)?.delete(candidateId);
        
        prunedCount++;
      }
    }

    return prunedCount;
  }
}

// Singleton instance
export const eventCandidateStore = new EventCandidateStore();