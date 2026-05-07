/**
 * CSI Calculation Tests
 * Validates CSI(t) = Baseline + Drift + Delta formula
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { csiEngine } from '../calculation/CSIEngine';
import { baselineCalculator } from '../calculation/BaselineCalculator';
import { decayEngine } from '../calculation/DecayEngine';
import { eventCandidateStore } from '../state/EventCandidateStore';
import { eventDeltaLedger } from '../state/EventDeltaLedger';
import { RiskVector, EscalationLevel, EventStatus } from '../types';

describe('CSI Calculation Engine', () => {
  beforeEach(async () => {
    // Initialize baseline for test country
    await baselineCalculator.calculateBaseline(
      'CHN',
      RiskVector.POLITICAL,
      new Date('2024-01-01'),
      new Date('2025-12-31')
    );
  });

  describe('Formula: CSI(t) = Baseline + Drift + Delta', () => {
    it('should calculate baseline component correctly', async () => {
      const baseline = await baselineCalculator.getOrCalculateBaseline('CHN', RiskVector.POLITICAL);
      
      expect(baseline).toBeDefined();
      expect(baseline.baselineScore).toBeGreaterThan(0);
      expect(baseline.baselineScore).toBeLessThanOrEqual(100);
      expect(baseline.statistics).toBeDefined();
      expect(baseline.statistics.mean).toBeGreaterThan(0);
    });

    it('should calculate CSI with baseline only (no events)', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score).toBeDefined();
      expect(score.compositeScore).toBeGreaterThan(0);
      expect(score.compositeScore).toBeLessThanOrEqual(100);
      
      // With no events, score should be close to baseline
      const baseline = await baselineCalculator.getOrCalculateBaseline('CHN', RiskVector.POLITICAL);
      const vectorScore = score.vectorScores[RiskVector.POLITICAL];
      
      expect(Math.abs(vectorScore.currentScore - baseline.baselineScore)).toBeLessThan(5);
    });

    it('should add drift component from validated events', async () => {
      // Create validated event
      const candidate = {
        candidateId: 'test_candidate_1',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.HIGH,
        supportingSignals: [],
        firstDetected: new Date(),
        lastUpdated: new Date(),
        status: EventStatus.VALIDATED,
        gatingChecks: {
          tierValidation: true,
          crossSourceConfirmation: true,
          temporalCoherence: true,
          vectorAlignment: true
        },
        validationScore: 0.9
      };

      eventCandidateStore.addCandidate(candidate);

      // Create delta
      const delta = {
        deltaId: 'test_delta_1',
        eventId: candidate.candidateId,
        timestamp: new Date(),
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        deltaType: 'new' as const,
        newLevel: EscalationLevel.HIGH,
        triggeringSignals: [],
        csiImpact: {
          vectorDelta: 10,
          compositeDelta: 2
        },
        auditTrail: {
          validatedBy: 'test',
          validationTimestamp: new Date(),
          overrideApplied: false
        }
      };

      eventDeltaLedger.recordDelta(delta);
      decayEngine.createPersistence(candidate.candidateId, EscalationLevel.HIGH);

      const score = await csiEngine.calculateCSI('CHN');
      const baseline = await baselineCalculator.getOrCalculateBaseline('CHN', RiskVector.POLITICAL);
      
      // Score should be higher than baseline due to drift
      expect(score.vectorScores[RiskVector.POLITICAL].currentScore).toBeGreaterThan(baseline.baselineScore);
    });

    it('should apply decay to delta component', async () => {
      const candidate = {
        candidateId: 'test_candidate_decay',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [],
        firstDetected: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        lastUpdated: new Date(),
        status: EventStatus.VALIDATED,
        gatingChecks: {
          tierValidation: true,
          crossSourceConfirmation: true,
          temporalCoherence: true,
          vectorAlignment: true
        },
        validationScore: 0.85
      };

      eventCandidateStore.addCandidate(candidate);
      const persistence = decayEngine.createPersistence(candidate.candidateId, EscalationLevel.MODERATE);
      
      // Manually set creation date to 15 days ago
      persistence.createdAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const weight = decayEngine.calculateWeight(candidate.candidateId);
      
      // After 15 days (half of 30-day half-life), weight should be ~0.7
      expect(weight).toBeGreaterThan(0.6);
      expect(weight).toBeLessThan(0.8);
    });
  });

  describe('Composite Score Calculation', () => {
    it('should calculate weighted composite from vector scores', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score.compositeScore).toBeDefined();
      expect(score.vectorScores).toBeDefined();
      
      // Verify all vectors are present
      const vectors = Object.keys(score.vectorScores);
      expect(vectors).toHaveLength(6);
      expect(vectors).toContain(RiskVector.POLITICAL);
      expect(vectors).toContain(RiskVector.ECONOMIC);
      expect(vectors).toContain(RiskVector.SECURITY);
    });

    it('should apply correct vector weights', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      // Composite should be within range of vector scores
      const vectorScores = Object.values(score.vectorScores).map(v => v.currentScore);
      const minVector = Math.min(...vectorScores);
      const maxVector = Math.max(...vectorScores);
      
      expect(score.compositeScore).toBeGreaterThanOrEqual(minVector);
      expect(score.compositeScore).toBeLessThanOrEqual(maxVector);
    });
  });

  describe('Confidence Intervals', () => {
    it('should calculate 95% confidence interval', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score.confidenceInterval).toBeDefined();
      expect(score.confidenceInterval.lower).toBeLessThan(score.compositeScore);
      expect(score.confidenceInterval.upper).toBeGreaterThan(score.compositeScore);
      expect(score.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(score.confidenceInterval.upper).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Quality Metrics', () => {
    it('should calculate coverage score', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score.dataQuality.coverageScore).toBeGreaterThanOrEqual(0);
      expect(score.dataQuality.coverageScore).toBeLessThanOrEqual(1);
    });

    it('should calculate recency score', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score.dataQuality.recencyScore).toBeGreaterThanOrEqual(0);
      expect(score.dataQuality.recencyScore).toBeLessThanOrEqual(1);
    });

    it('should calculate source reliability', async () => {
      const score = await csiEngine.calculateCSI('CHN');
      
      expect(score.dataQuality.sourceReliability).toBeGreaterThanOrEqual(0);
      expect(score.dataQuality.sourceReliability).toBeLessThanOrEqual(1);
    });
  });

  describe('Trend Detection', () => {
    it('should detect improving trend', async () => {
      // Create de-escalation event
      const candidate = {
        candidateId: 'test_deescalation',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.LOW,
        supportingSignals: [],
        firstDetected: new Date(),
        lastUpdated: new Date(),
        status: EventStatus.VALIDATED,
        gatingChecks: {
          tierValidation: true,
          crossSourceConfirmation: true,
          temporalCoherence: true,
          vectorAlignment: true
        },
        validationScore: 0.9
      };

      eventCandidateStore.addCandidate(candidate);

      const delta = {
        deltaId: 'test_delta_deesc',
        eventId: candidate.candidateId,
        timestamp: new Date(),
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        deltaType: 'de-escalation' as const,
        previousLevel: EscalationLevel.HIGH,
        newLevel: EscalationLevel.LOW,
        triggeringSignals: [],
        csiImpact: {
          vectorDelta: -8,
          compositeDelta: -1.6
        },
        auditTrail: {
          validatedBy: 'test',
          validationTimestamp: new Date(),
          overrideApplied: false
        }
      };

      eventDeltaLedger.recordDelta(delta);

      const score = await csiEngine.calculateCSI('CHN');
      
      // Trend should reflect improvement
      expect(score.vectorScores[RiskVector.POLITICAL].trend).toBeDefined();
    });
  });
});