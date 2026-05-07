/**
 * Gating Logic Tests
 * Validates corroboration, persistence, and credibility requirements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { gatingOrchestrator } from '../gating/GatingOrchestrator';
import { sourceRegistry } from '../sources/SourceRegistry';
import { 
  EventCandidate, 
  EscalationSignal, 
  EventStatus, 
  RiskVector, 
  EscalationLevel,
  SourceTier 
} from '../types';

describe('Gating Logic', () => {
  describe('Tier Validation', () => {
    it('should pass with Tier 1 source', () => {
      const signal: EscalationSignal = {
        signalId: 'tier1_test',
        timestamp: new Date(),
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_tier1',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['tier_validation']).toBe(true);
    });

    it('should pass with Tier 2 source', () => {
      const signal: EscalationSignal = {
        signalId: 'tier2_test',
        timestamp: new Date(),
        sourceId: 'reuters',
        sourceTier: SourceTier.TIER_2_REPUTABLE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.85,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_tier2',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['tier_validation']).toBe(true);
    });

    it('should fail with only Tier 3 source', () => {
      const signal: EscalationSignal = {
        signalId: 'tier3_test',
        timestamp: new Date(),
        sourceId: 'social_media_aggregator',
        sourceTier: SourceTier.TIER_3_SUPPLEMENTARY,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.7,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_tier3_only',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['tier_validation']).toBe(false);
    });
  });

  describe('Cross-Source Confirmation', () => {
    it('should pass with 2+ independent sources', () => {
      const signal1: EscalationSignal = {
        signalId: 'cross_source_1',
        timestamp: new Date(),
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const signal2: EscalationSignal = {
        signalId: 'cross_source_2',
        timestamp: new Date(),
        sourceId: 'reuters',
        sourceTier: SourceTier.TIER_2_REPUTABLE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.85,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_cross_source',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal1, signal2],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['cross_source_confirmation']).toBe(true);
    });

    it('should fail with single source', () => {
      const signal: EscalationSignal = {
        signalId: 'single_source',
        timestamp: new Date(),
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_single_source',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['cross_source_confirmation']).toBe(false);
    });

    it('should fail with duplicate sources', () => {
      const signal1: EscalationSignal = {
        signalId: 'dup_source_1',
        timestamp: new Date(),
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const signal2: EscalationSignal = {
        signalId: 'dup_source_2',
        timestamp: new Date(),
        sourceId: 'wgi', // Same source
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_dup_source',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal1, signal2],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['cross_source_confirmation']).toBe(false);
    });
  });

  describe('Temporal Coherence', () => {
    it('should pass when signals within 72-hour window', () => {
      const now = new Date();
      const signal1: EscalationSignal = {
        signalId: 'temporal_1',
        timestamp: now,
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const signal2: EscalationSignal = {
        signalId: 'temporal_2',
        timestamp: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours later
        sourceId: 'reuters',
        sourceTier: SourceTier.TIER_2_REPUTABLE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.85,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_temporal',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal1, signal2],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['temporal_coherence']).toBe(true);
    });

    it('should fail when signals exceed 72-hour window', () => {
      const now = new Date();
      const signal1: EscalationSignal = {
        signalId: 'temporal_fail_1',
        timestamp: now,
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.9,
        metadata: {}
      };

      const signal2: EscalationSignal = {
        signalId: 'temporal_fail_2',
        timestamp: new Date(now.getTime() + 80 * 60 * 60 * 1000), // 80 hours later
        sourceId: 'reuters',
        sourceTier: SourceTier.TIER_2_REPUTABLE,
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test content',
        confidence: 0.85,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_temporal_fail',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal1, signal2],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['temporal_coherence']).toBe(false);
    });
  });

  describe('Critical Event Validation', () => {
    it('should require Tier 1 source + 3 signals for critical events', () => {
      const signals: EscalationSignal[] = [
        {
          signalId: 'critical_1',
          timestamp: new Date(),
          sourceId: 'wgi',
          sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
          country: 'CHN',
          vector: RiskVector.POLITICAL,
          escalationLevel: EscalationLevel.CRITICAL,
          rawContent: 'Test',
          confidence: 0.95,
          metadata: {}
        },
        {
          signalId: 'critical_2',
          timestamp: new Date(),
          sourceId: 'reuters',
          sourceTier: SourceTier.TIER_2_REPUTABLE,
          country: 'CHN',
          vector: RiskVector.POLITICAL,
          escalationLevel: EscalationLevel.CRITICAL,
          rawContent: 'Test',
          confidence: 0.9,
          metadata: {}
        },
        {
          signalId: 'critical_3',
          timestamp: new Date(),
          sourceId: 'ft',
          sourceTier: SourceTier.TIER_2_REPUTABLE,
          country: 'CHN',
          vector: RiskVector.POLITICAL,
          escalationLevel: EscalationLevel.CRITICAL,
          rawContent: 'Test',
          confidence: 0.88,
          metadata: {}
        }
      ];

      const candidate: EventCandidate = {
        candidateId: 'test_critical',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.CRITICAL,
        supportingSignals: signals,
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['critical_validation']).toBe(true);
    });
  });

  describe('Vector Alignment', () => {
    it('should pass when signal vector matches source primary vectors', () => {
      const signal: EscalationSignal = {
        signalId: 'vector_align',
        timestamp: new Date(),
        sourceId: 'wgi',
        sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
        country: 'CHN',
        vector: RiskVector.POLITICAL, // WGI covers political
        escalationLevel: EscalationLevel.MODERATE,
        rawContent: 'Test',
        confidence: 0.9,
        metadata: {}
      };

      const candidate: EventCandidate = {
        candidateId: 'test_vector_align',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: [signal],
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.ruleResults['vector_alignment']).toBe(true);
    });
  });

  describe('Overall Validation', () => {
    it('should pass with confidence >= 75%', () => {
      const signals: EscalationSignal[] = [
        {
          signalId: 'overall_1',
          timestamp: new Date(),
          sourceId: 'wgi',
          sourceTier: SourceTier.TIER_1_AUTHORITATIVE,
          country: 'CHN',
          vector: RiskVector.POLITICAL,
          escalationLevel: EscalationLevel.MODERATE,
          rawContent: 'Test',
          confidence: 0.9,
          metadata: {}
        },
        {
          signalId: 'overall_2',
          timestamp: new Date(),
          sourceId: 'reuters',
          sourceTier: SourceTier.TIER_2_REPUTABLE,
          country: 'CHN',
          vector: RiskVector.POLITICAL,
          escalationLevel: EscalationLevel.MODERATE,
          rawContent: 'Test',
          confidence: 0.85,
          metadata: {}
        }
      ];

      const candidate: EventCandidate = {
        candidateId: 'test_overall',
        country: 'CHN',
        vector: RiskVector.POLITICAL,
        escalationLevel: EscalationLevel.MODERATE,
        supportingSignals: signals,
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

      const result = gatingOrchestrator.validateCandidate(candidate);
      expect(result.passed).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });
  });
});