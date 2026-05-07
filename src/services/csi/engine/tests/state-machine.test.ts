/**
 * State Machine Tests
 * Validates candidate lifecycle: CANDIDATE → VALIDATED → REJECTED/EXPIRED
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { eventCandidateStore } from '../state/EventCandidateStore';
import { EventCandidate, EventStatus, RiskVector, EscalationLevel } from '../types';

describe('Event Candidate State Machine', () => {
  let testCandidate: EventCandidate;

  beforeEach(() => {
    testCandidate = {
      candidateId: 'state_test_1',
      country: 'CHN',
      vector: RiskVector.POLITICAL,
      escalationLevel: EscalationLevel.MODERATE,
      supportingSignals: [],
      firstDetected: new Date(),
      lastUpdated: new Date(),
      status: EventStatus.CANDIDATE,
      gatingChecks: {
        tierValidation: false,
        crossSourceConfirmation: false,
        temporalCoherence: false,
        vectorAlignment: false
      },
      validationScore: 0
    };
  });

  describe('State Transitions', () => {
    it('should create candidate in CANDIDATE status', () => {
      eventCandidateStore.addCandidate(testCandidate);
      
      const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe(EventStatus.CANDIDATE);
    });

    it('should transition from CANDIDATE to VALIDATED', () => {
      eventCandidateStore.addCandidate(testCandidate);
      eventCandidateStore.updateCandidateStatus(testCandidate.candidateId, EventStatus.VALIDATED);
      
      const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
      expect(retrieved?.status).toBe(EventStatus.VALIDATED);
    });

    it('should transition from CANDIDATE to REJECTED', () => {
      eventCandidateStore.addCandidate(testCandidate);
      eventCandidateStore.updateCandidateStatus(testCandidate.candidateId, EventStatus.REJECTED);
      
      const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
      expect(retrieved?.status).toBe(EventStatus.REJECTED);
    });

    it('should transition from CANDIDATE to EXPIRED', () => {
      eventCandidateStore.addCandidate(testCandidate);
      eventCandidateStore.updateCandidateStatus(testCandidate.candidateId, EventStatus.EXPIRED);
      
      const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
      expect(retrieved?.status).toBe(EventStatus.EXPIRED);
    });

    it('should update lastUpdated timestamp on status change', () => {
      eventCandidateStore.addCandidate(testCandidate);
      const originalTime = testCandidate.lastUpdated.getTime();
      
      // Wait a bit
      setTimeout(() => {
        eventCandidateStore.updateCandidateStatus(testCandidate.candidateId, EventStatus.VALIDATED);
        
        const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
        expect(retrieved?.lastUpdated.getTime()).toBeGreaterThan(originalTime);
      }, 10);
    });
  });

  describe('Status Queries', () => {
    it('should retrieve candidates by status', () => {
      const candidate1 = { ...testCandidate, candidateId: 'status_test_1' };
      const candidate2 = { ...testCandidate, candidateId: 'status_test_2', status: EventStatus.VALIDATED };
      
      eventCandidateStore.addCandidate(candidate1);
      eventCandidateStore.addCandidate(candidate2);
      
      const pending = eventCandidateStore.getCandidatesByStatus(EventStatus.CANDIDATE);
      const validated = eventCandidateStore.getCandidatesByStatus(EventStatus.VALIDATED);
      
      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(validated.length).toBeGreaterThanOrEqual(1);
    });

    it('should get pending candidates', () => {
      eventCandidateStore.addCandidate(testCandidate);
      
      const pending = eventCandidateStore.getPendingCandidates();
      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(pending.some(c => c.candidateId === testCandidate.candidateId)).toBe(true);
    });

    it('should get validated candidates', () => {
      testCandidate.status = EventStatus.VALIDATED;
      eventCandidateStore.addCandidate(testCandidate);
      
      const validated = eventCandidateStore.getValidatedCandidates();
      expect(validated.some(c => c.candidateId === testCandidate.candidateId)).toBe(true);
    });
  });

  describe('Expiration Logic', () => {
    it('should expire old candidates', () => {
      const oldCandidate = {
        ...testCandidate,
        candidateId: 'old_candidate',
        lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      };
      
      eventCandidateStore.addCandidate(oldCandidate);
      
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const expiredCount = eventCandidateStore.expireOldCandidates(threshold);
      
      expect(expiredCount).toBeGreaterThanOrEqual(1);
      
      const retrieved = eventCandidateStore.getCandidate(oldCandidate.candidateId);
      expect(retrieved?.status).toBe(EventStatus.EXPIRED);
    });
  });

  describe('Statistics', () => {
    it('should calculate accurate statistics', () => {
      const candidates = [
        { ...testCandidate, candidateId: 'stat_1', status: EventStatus.CANDIDATE },
        { ...testCandidate, candidateId: 'stat_2', status: EventStatus.VALIDATED },
        { ...testCandidate, candidateId: 'stat_3', status: EventStatus.REJECTED },
        { ...testCandidate, candidateId: 'stat_4', status: EventStatus.EXPIRED }
      ];
      
      candidates.forEach(c => eventCandidateStore.addCandidate(c));
      
      const stats = eventCandidateStore.getStatistics();
      
      expect(stats.totalCandidates).toBeGreaterThanOrEqual(4);
      expect(stats.pendingCount).toBeGreaterThanOrEqual(1);
      expect(stats.validatedCount).toBeGreaterThanOrEqual(1);
      expect(stats.rejectedCount).toBeGreaterThanOrEqual(1);
      expect(stats.expiredCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Validation Score Tracking', () => {
    it('should track validation score', () => {
      testCandidate.validationScore = 0.85;
      eventCandidateStore.addCandidate(testCandidate);
      
      const retrieved = eventCandidateStore.getCandidate(testCandidate.candidateId);
      expect(retrieved?.validationScore).toBe(0.85);
    });

    it('should filter by minimum validation score', () => {
      const highScore = { ...testCandidate, candidateId: 'high_score', validationScore: 0.9 };
      const lowScore = { ...testCandidate, candidateId: 'low_score', validationScore: 0.5 };
      
      eventCandidateStore.addCandidate(highScore);
      eventCandidateStore.addCandidate(lowScore);
      
      const filtered = eventCandidateStore.queryCandidates({
        minValidationScore: 0.8
      });
      
      expect(filtered.some(c => c.candidateId === 'high_score')).toBe(true);
      expect(filtered.some(c => c.candidateId === 'low_score')).toBe(false);
    });
  });
});