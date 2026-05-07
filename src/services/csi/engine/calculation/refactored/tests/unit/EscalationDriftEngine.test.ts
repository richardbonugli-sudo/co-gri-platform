/**
 * Unit Tests for Escalation Drift Engine - Phase 3A
 * Tests factor-scoped drift tracking and validation
 */

import { EscalationDriftEngine } from '../../EscalationDriftEngine';
import { CSIRiskFactor, Signal, SourceRole, SourceMetadata } from '../../types';
import { DecayScheduler } from '../../DecayScheduler';

describe('EscalationDriftEngine - Phase 3A', () => {
  let engine: EscalationDriftEngine;
  let mockDecayScheduler: DecayScheduler;

  beforeEach(() => {
    mockDecayScheduler = new DecayScheduler();
    engine = new EscalationDriftEngine(undefined, mockDecayScheduler);
  });

  afterEach(() => {
    engine.clearHistory();
  });

  // Helper function to create valid signal with past detected_date for persistence
  const createValidSignal = (
    signalId: string,
    country: string,
    factor: CSIRiskFactor,
    severity: number = 0.5,
    probability: number = 0.6
  ): Signal => {
    // Set detected_date to 72+ hours ago to ensure full persistence factor
    const detectedDate = new Date(Date.now() - 73 * 60 * 60 * 1000);
    
    return {
      signal_id: signalId,
      country,
      risk_factor: factor,
      signal_type: 'test_signal',
      severity,
      probability,
      detected_date: detectedDate,
      last_updated: new Date(),
      persistence_hours: 72,
      sources: [{
        source_id: 'test_source',
        source_name: 'Test Detection Source',
        role: SourceRole.DETECTION,
        reliability_score: 0.9,
        authority_level: 'HIGH',
        applicable_factors: [factor]
      }],
      corroboration_count: 1,
      max_drift_cap: 0.25
    };
  };

  describe('Per-Factor Drift Tracking', () => {
    it('should calculate drift separately for each CSI risk factor', async () => {
      const country = 'TestCountry';
      
      // Add signals to different factors
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 0.6, 0.7));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY, 0.5, 0.6));
      engine.addSignal(country, createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS, 0.4, 0.5));

      const driftByFactor = await engine.calculateByFactor(country, new Date());

      expect(driftByFactor.size).toBe(7); // All 7 factors
      expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.SANCTIONS_REGULATORY)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.TRADE_LOGISTICS)).toBeGreaterThan(0);
      
      // Factors without signals should have 0 drift
      expect(driftByFactor.get(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY)).toBe(0);
    });

    it('should store signals in factor-scoped structure', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig3', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      const conflictSignals = engine.getActiveSignalsByFactor(country, CSIRiskFactor.CONFLICT_SECURITY);
      const sanctionsSignals = engine.getActiveSignalsByFactor(country, CSIRiskFactor.SANCTIONS_REGULATORY);

      expect(conflictSignals.length).toBe(2);
      expect(sanctionsSignals.length).toBe(1);
      expect(conflictSignals[0].risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
      expect(sanctionsSignals[0].risk_factor).toBe(CSIRiskFactor.SANCTIONS_REGULATORY);
    });

    it('should prevent cross-factor drift accumulation', async () => {
      const country = 'TestCountry';
      
      // Use different severity/probability values to ensure different drift values
      // Signal 1: lower values (contribution ~0.12, below cap)
      // Signal 2: higher values (contribution ~0.25, at cap)
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 0.3, 0.4));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY, 0.5, 0.6));

      const driftByFactor = await engine.calculateByFactor(country, new Date());
      
      // Each factor should have its own drift, not combined
      const conflictDrift = driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY) || 0;
      const sanctionsDrift = driftByFactor.get(CSIRiskFactor.SANCTIONS_REGULATORY) || 0;
      
      expect(conflictDrift).toBeGreaterThan(0);
      expect(sanctionsDrift).toBeGreaterThan(0);
      
      // Verify they are calculated independently (different values due to different severity/probability)
      expect(conflictDrift).not.toBe(sanctionsDrift);
    });
  });

  describe('Signal Validation at Ingestion', () => {
    it('should validate signal has exactly one risk_factor', () => {
      const country = 'TestCountry';
      const invalidSignal = {
        ...createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY),
        risk_factor: undefined as any
      };

      expect(() => engine.addSignal(country, invalidSignal)).toThrow();
    });

    it('should validate probability is expectation-based (0-1 range)', () => {
      const country = 'TestCountry';
      const invalidSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      invalidSignal.probability = 1.5; // Invalid

      expect(() => engine.addSignal(country, invalidSignal)).toThrow();
    });

    it('should accept valid expectation-based probability', () => {
      const country = 'TestCountry';
      const validSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      validSignal.probability = 0.75; // Valid

      expect(() => engine.addSignal(country, validSignal)).not.toThrow();
    });

    it('should validate sources have DETECTION role', () => {
      const country = 'TestCountry';
      const invalidSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      invalidSignal.sources[0].role = SourceRole.CONFIRMATION; // Wrong role

      expect(() => engine.addSignal(country, invalidSignal)).toThrow();
    });

    it('should reject signals with no sources', () => {
      const country = 'TestCountry';
      const invalidSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      invalidSignal.sources = [];

      expect(() => engine.addSignal(country, invalidSignal)).toThrow();
    });
  });

  describe('Cross-Factor Drift Prevention', () => {
    it('should validate no cross-factor drift accumulation', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      const validationResults = engine.validateNoCrossFactorDrift(country);
      
      const errors = validationResults.filter(r => !r.passed && r.severity === 'ERROR');
      expect(errors.length).toBe(0);
    });

    it('should prevent factor changes via update', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      
      engine.addSignal(country, signal);

      expect(() => {
        engine.updateSignal(country, 'sig1', {
          risk_factor: CSIRiskFactor.SANCTIONS_REGULATORY
        });
      }).toThrow();
    });

    it('should track cross-factor attempts in health metrics', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      
      engine.addSignal(country, signal);

      try {
        engine.updateSignal(country, 'sig1', {
          risk_factor: CSIRiskFactor.SANCTIONS_REGULATORY
        });
      } catch (e) {
        // Expected
      }

      const health = engine.getHealthMetrics();
      expect(health.validation_stats.cross_factor_attempts_blocked).toBeGreaterThan(0);
    });
  });

  describe('Source Role Enforcement', () => {
    it('should only accept DETECTION sources for signals', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      
      // Valid DETECTION source
      expect(() => engine.addSignal(country, signal)).not.toThrow();
    });

    it('should reject BASELINE sources for signals', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.sources[0].role = SourceRole.BASELINE;

      expect(() => engine.addSignal(country, signal)).toThrow();
    });

    it('should reject CONFIRMATION sources for signals', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.sources[0].role = SourceRole.CONFIRMATION;

      expect(() => engine.addSignal(country, signal)).toThrow();
    });
  });

  describe('Per-Factor Drift Caps', () => {
    it('should apply per-factor 30-day drift cap', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;
      
      // Add signals that would exceed cap
      for (let i = 0; i < 10; i++) {
        engine.addSignal(country, createValidSignal(`sig${i}`, country, factor, 0.9, 0.9));
      }

      const driftByFactor = await engine.calculateByFactor(country, new Date());
      const factorDrift = driftByFactor.get(factor) || 0;

      // Should be capped at 1.0
      expect(factorDrift).toBeLessThanOrEqual(1.0);
    });

    it('should track remaining capacity per factor', async () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 0.5, 0.6));

      const breakdown = await engine.getDriftBreakdown(country);
      
      expect(breakdown.remaining_capacity_by_factor).toBeDefined();
      expect(breakdown.remaining_capacity_by_factor.size).toBe(7);
      
      const conflictCapacity = breakdown.remaining_capacity_by_factor.get(CSIRiskFactor.CONFLICT_SECURITY);
      expect(conflictCapacity).toBeDefined();
      expect(conflictCapacity).toBeLessThanOrEqual(1.0);
    });

    it('should calculate factor cap utilization percentage', async () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 0.5, 0.6));

      const breakdown = await engine.getDriftBreakdown(country);
      
      expect(breakdown.factor_caps).toBeDefined();
      
      const conflictCap = breakdown.factor_caps.get(CSIRiskFactor.CONFLICT_SECURITY);
      expect(conflictCap).toBeDefined();
      expect(conflictCap?.current).toBeGreaterThanOrEqual(0);
      expect(conflictCap?.max).toBe(1.0);
      expect(conflictCap?.utilized_pct).toBeGreaterThanOrEqual(0);
      expect(conflictCap?.utilized_pct).toBeLessThanOrEqual(100);
    });
  });

  describe('Enhanced getDriftBreakdown', () => {
    it('should return per-factor breakdown', async () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      const breakdown = await engine.getDriftBreakdown(country);

      expect(breakdown.by_factor).toBeDefined();
      expect(breakdown.by_factor.size).toBe(7);
      expect(breakdown.by_factor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0);
      expect(breakdown.by_factor.get(CSIRiskFactor.SANCTIONS_REGULATORY)).toBeGreaterThan(0);
    });

    it('should include decay stats by factor', async () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      const breakdown = await engine.getDriftBreakdown(country);

      expect(breakdown.decay_stats).toBeDefined();
      expect(breakdown.decay_stats.by_factor).toBeDefined();
      expect(breakdown.decay_stats.by_factor.size).toBe(7);
      
      const conflictStats = breakdown.decay_stats.by_factor.get(CSIRiskFactor.CONFLICT_SECURITY);
      expect(conflictStats).toBeDefined();
      expect(conflictStats?.signal_count).toBeGreaterThan(0);
      expect(conflictStats?.avg_decay_factor).toBeGreaterThanOrEqual(0);
      expect(conflictStats?.avg_decay_factor).toBeLessThanOrEqual(1);
    });

    it('should include signals by status', async () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));

      const breakdown = await engine.getDriftBreakdown(country);

      expect(breakdown.decay_stats.signals_by_status).toBeDefined();
      expect(breakdown.decay_stats.signals_by_status.ACTIVE).toBeDefined();
      expect(breakdown.decay_stats.signals_by_status.DECAYING).toBeDefined();
      expect(breakdown.decay_stats.signals_by_status.EXPIRED).toBeDefined();
    });
  });

  describe('Updated isSignalRelevantToEvent with CSI Risk Factors', () => {
    it('should only match signals in same factor as event', async () => {
      const country = 'TestCountry';
      const eventDate = new Date();
      
      // Add signal to CONFLICT_SECURITY
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.signal_type = 'conflict_escalation';
      engine.addSignal(country, signal);

      // Try to get attribution for SANCTIONS event (different factor)
      const attribution = await engine.getDriftAttributionForEvent(
        country,
        CSIRiskFactor.SANCTIONS_REGULATORY,
        'sanctions_imposed',
        eventDate
      );

      // Should be 0 because signal is in different factor
      expect(attribution).toBe(0);
    });

    it('should match signals in same factor with relevant type', async () => {
      const country = 'TestCountry';
      const eventDate = new Date(Date.now() + 1000); // Event after signal
      
      // Add signal to CONFLICT_SECURITY with relevant type
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.signal_type = 'conflict_escalation';
      signal.detected_date = new Date(Date.now() - 73 * 60 * 60 * 1000); // 73 hours ago for persistence
      engine.addSignal(country, signal);

      // Get attribution for CONFLICT event (same factor)
      const attribution = await engine.getDriftAttributionForEvent(
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'conflict_outbreak',
        eventDate
      );

      // Should be > 0 because signal is in same factor and relevant
      expect(attribution).toBeGreaterThan(0);
    });

    it('should use factor-specific signal-to-event mappings', async () => {
      const country = 'TestCountry';
      const eventDate = new Date(Date.now() + 1000);
      
      // Trade factor signal
      const tradeSignal = createValidSignal('sig1', country, CSIRiskFactor.TRADE_LOGISTICS);
      tradeSignal.signal_type = 'tariff_threat';
      tradeSignal.detected_date = new Date(Date.now() - 73 * 60 * 60 * 1000);
      engine.addSignal(country, tradeSignal);

      // Should match tariff_imposed event in TRADE_LOGISTICS factor
      const attribution = await engine.getDriftAttributionForEvent(
        country,
        CSIRiskFactor.TRADE_LOGISTICS,
        'tariff_imposed',
        eventDate
      );

      expect(attribution).toBeGreaterThan(0);
    });
  });

  describe('Health Metrics with Validation Stats', () => {
    it('should track signals by factor', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig3', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      const health = engine.getHealthMetrics();

      expect(health.signals_by_factor).toBeDefined();
      expect(health.signals_by_factor[CSIRiskFactor.CONFLICT_SECURITY]).toBe(2);
      expect(health.signals_by_factor[CSIRiskFactor.SANCTIONS_REGULATORY]).toBe(1);
    });

    it('should track validation stats', () => {
      const health = engine.getHealthMetrics();

      expect(health.validation_stats).toBeDefined();
      expect(health.validation_stats.cross_factor_attempts_blocked).toBeDefined();
      expect(health.validation_stats.invalid_signal_attempts_blocked).toBeDefined();
    });

    it('should increment invalid signal attempts on validation failure', () => {
      const country = 'TestCountry';
      const invalidSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      invalidSignal.probability = 1.5; // Invalid

      try {
        engine.addSignal(country, invalidSignal);
      } catch (e) {
        // Expected
      }

      const health = engine.getHealthMetrics();
      expect(health.validation_stats.invalid_signal_attempts_blocked).toBeGreaterThan(0);
    });
  });

  describe('Factor-Scoped Signal Operations', () => {
    it('should remove signal from correct factor', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY));

      expect(engine.getActiveSignalsByFactor(country, CSIRiskFactor.CONFLICT_SECURITY).length).toBe(1);

      engine.removeSignal(country, 'sig1');

      expect(engine.getActiveSignalsByFactor(country, CSIRiskFactor.CONFLICT_SECURITY).length).toBe(0);
      expect(engine.getActiveSignalsByFactor(country, CSIRiskFactor.SANCTIONS_REGULATORY).length).toBe(1);
    });

    it('should update signal within same factor', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));

      engine.updateSignal(country, 'sig1', { severity: 0.8 });

      const signals = engine.getActiveSignalsByFactor(country, CSIRiskFactor.CONFLICT_SECURITY);
      expect(signals[0].severity).toBe(0.8);
    });

    it('should get all signals flattened across factors', () => {
      const country = 'TestCountry';
      
      engine.addSignal(country, createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY));
      engine.addSignal(country, createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY));
      engine.addSignal(country, createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS));

      const allSignals = engine.getActiveSignals(country);
      expect(allSignals.length).toBe(3);
    });
  });

  describe('Probability Validation', () => {
    it('should reject probability > 1', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.probability = 1.2;

      expect(() => engine.addSignal(country, signal)).toThrow(/probability/i);
    });

    it('should reject probability < 0', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.probability = -0.1;

      expect(() => engine.addSignal(country, signal)).toThrow(/probability/i);
    });

    it('should accept probability = 0', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.probability = 0;

      expect(() => engine.addSignal(country, signal)).not.toThrow();
    });

    it('should accept probability = 1', () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      signal.probability = 1;

      expect(() => engine.addSignal(country, signal)).not.toThrow();
    });
  });
});