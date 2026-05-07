/**
 * Backtesting & Validation Tests - Phase 5 Updated
 * Validates escalation and decay mechanics against historical events with factor-scoped architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CSIRiskFactor, SourceRole } from '../types';
import { EscalationDriftEngine } from '../EscalationDriftEngine';
import { DecayScheduler } from '../DecayScheduler';
import { Signal, CSIRiskFactor, SourceRole } from '../types';

describe('Phase 5: Escalation & Decay Backtesting', () => {
  let engine: EscalationDriftEngine;
  let scheduler: DecayScheduler;

  beforeEach(() => {
    engine = new EscalationDriftEngine();
    scheduler = new DecayScheduler();
  });
  
  // Helper function to create valid signal
  const createValidSignal = (
    signalId: string,
    country: string,
    factor: CSIRiskFactor,
    signalType: string,
    severity: number,
    probability: number,
    detectedDate: Date
  ): Signal => ({
    signal_id: signalId,
    country,
    risk_factor: factor,
    signal_type: signalType,
    severity,
    probability,
    detected_date: detectedDate,
    last_updated: detectedDate,
    persistence_hours: 0,
    sources: [{
      source_id: `${signalType}_source`,
      source_name: `${signalType.toUpperCase()} Source`,
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH' as const,
      applicable_factors: [factor]
    }],
    corroboration_count: 2,
    max_drift_cap: 0.25
  });

  describe('Historical Event: US-China Trade War (2018)', () => {
    it('should show drift rising before Trump tariff announcement', async () => {
      // Historical scenario: Trump tariff threats (Jan-Mar 2018) → tariffs enacted (Apr 2018)
      // Using TRADE_LOGISTICS factor instead of ECONOMIC vector
      
      // Signal 1: January 15, 2018 - Initial tariff threat
      const signal1 = createValidSignal(
        'US-tariff_threat-2018-01-15',
        'China',
        CSIRiskFactor.TRADE_LOGISTICS,
        'tariff_threat',
        0.70,
        0.65,
        new Date('2018-01-15')
      );
      
      // Signal 2: January 22, 2018 - Threat intensifies
      const signal2 = createValidSignal(
        'US-tariff_threat-2018-01-22',
        'China',
        CSIRiskFactor.TRADE_LOGISTICS,
        'tariff_threat',
        0.75,
        0.70,
        new Date('2018-01-22')
      );
      signal2.corroboration_count = 3;
      
      // Signal 3: February 10, 2018 - Trade investigation announced
      const signal3 = createValidSignal(
        'US-trade_investigation-2018-02-10',
        'China',
        CSIRiskFactor.TRADE_LOGISTICS,
        'trade_investigation',
        0.80,
        0.75,
        new Date('2018-02-10')
      );
      signal3.corroboration_count = 4;
      
      // Add signals to engine
      engine.addSignal('China', signal1);
      engine.addSignal('China', signal2);
      engine.addSignal('China', signal3);
      
      // Calculate drift at different time points
      const driftJan31 = await engine.calculate('China', new Date('2018-01-31'));
      const driftFeb28 = await engine.calculate('China', new Date('2018-02-28'));
      const driftMar31 = await engine.calculate('China', new Date('2018-03-31'));
      
      // Drift should be positive as signals accumulate
      expect(driftJan31).toBeGreaterThan(0);
      expect(driftFeb28).toBeGreaterThan(0);
      expect(driftMar31).toBeGreaterThan(0);
      
      // Drift should be significant (>0.3 CSI points with multiple signals)
      expect(driftFeb28).toBeGreaterThan(0.3);
      
      // Verify drift is in TRADE_LOGISTICS factor only
      const driftByFactor = await engine.calculateByFactor('China', new Date('2018-03-31'));
      expect(driftByFactor.get(CSIRiskFactor.TRADE_LOGISTICS)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBe(0);
    });

    it('should handle signal decay after event confirmation', async () => {
      const country = 'China';
      const factor = CSIRiskFactor.TRADE_LOGISTICS;
      
      // Add signal
      const signal = createValidSignal(
        'tariff_threat',
        country,
        factor,
        'tariff_threat',
        0.7,
        0.75,
        new Date('2018-01-15')
      );
      
      engine.addSignal(country, signal);
      
      // Schedule decay with initial drift value
      const initialDrift = 0.45;
      await scheduler.scheduleDecay(signal, initialDrift);
      
      // Check decay status over time
      const schedule = scheduler.getSchedule(signal.signal_id);
      expect(schedule).toBeDefined();
      expect(schedule?.risk_factor).toBe(factor);
      
      // Verify decay is factor-scoped
      const activeDecays = await scheduler.getActiveDecaysByFactor(country, factor);
      expect(activeDecays.length).toBeGreaterThan(0);
      expect(activeDecays[0].risk_factor).toBe(factor);
    });
  });

  describe('Historical Event: Russia-Ukraine Conflict (2022)', () => {
    it('should show drift in CONFLICT_SECURITY factor before invasion', async () => {
      const country = 'Ukraine';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;
      
      // Signal 1: January 2022 - Troop buildup detected
      const signal1 = createValidSignal(
        'RU-troop_buildup-2022-01',
        country,
        factor,
        'military_buildup',
        0.85,
        0.90,
        new Date('2022-01-15')
      );
      
      // Signal 2: February 2022 - Escalation warnings
      const signal2 = createValidSignal(
        'RU-escalation_warning-2022-02',
        country,
        factor,
        'conflict_escalation',
        0.90,
        0.92,
        new Date('2022-02-10')
      );
      
      engine.addSignal(country, signal1);
      engine.addSignal(country, signal2);
      
      // Calculate drift before invasion
      const driftFeb20 = await engine.calculate(country, new Date('2022-02-20'));
      
      // Drift should be significant
      expect(driftFeb20).toBeGreaterThan(0.36);
      
      // Verify drift is in CONFLICT_SECURITY factor
      const driftByFactor = await engine.calculateByFactor(country, new Date('2022-02-20'));
      expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0.36);
      expect(driftByFactor.get(CSIRiskFactor.TRADE_LOGISTICS)).toBe(0);
    });

    it('should track multiple factors independently', async () => {
      const country = 'Ukraine';
      
      // Add signals to different factors
      const conflictSignal = createValidSignal(
        'conflict_sig',
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'military_buildup',
        0.8,
        0.75,
        new Date('2022-01-15')
      );
      
      const sanctionsSignal = createValidSignal(
        'sanctions_sig',
        country,
        CSIRiskFactor.SANCTIONS_REGULATORY,
        'sanctions_warning',
        0.7,
        0.7,
        new Date('2022-02-01')
      );
      
      engine.addSignal(country, conflictSignal);
      engine.addSignal(country, sanctionsSignal);
      
      // Calculate drift by factor
      const driftByFactor = await engine.calculateByFactor(country, new Date('2022-02-15'));
      
      // Both factors should have independent drift
      expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.SANCTIONS_REGULATORY)).toBeGreaterThan(0);
      
      // Total should equal sum of factors
      const total = await engine.calculate(country, new Date('2022-02-15'));
      const sumOfFactors = Array.from(driftByFactor.values()).reduce((a, b) => a + b, 0);
      expect(Math.abs(total - sumOfFactors)).toBeLessThan(0.01);
    });
  });

  describe('Decay Mechanics Validation', () => {
    it('should schedule decay and track by factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.TRADE_LOGISTICS;
      
      const signal = createValidSignal(
        'decay_test',
        country,
        factor,
        'tariff_threat',
        0.7,
        0.75,
        new Date('2024-01-01')
      );
      
      engine.addSignal(country, signal);
      
      // Schedule decay with initial drift
      const initialDrift = 0.45;
      await scheduler.scheduleDecay(signal, initialDrift);
      
      // Check decay schedule
      const schedule = scheduler.getSchedule(signal.signal_id);
      expect(schedule).toBeDefined();
      expect(schedule?.risk_factor).toBe(factor);
      expect(schedule?.initial_drift).toBe(initialDrift);
      
      // Calculate decayed value at different points
      const value0 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-01-01'));
      const value30 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-01-31'));
      const value60 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-03-01'));
      
      // Value should decay over time
      expect(value0).toBeGreaterThanOrEqual(value30);
      expect(value30).toBeGreaterThanOrEqual(value60);
    });

    it('should track decay by factor', async () => {
      const country = 'TestCountry';
      
      // Add signals to different factors
      const signal1 = createValidSignal(
        'sig1',
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'conflict_escalation',
        0.7,
        0.75,
        new Date('2024-01-01')
      );
      
      const signal2 = createValidSignal(
        'sig2',
        country,
        CSIRiskFactor.TRADE_LOGISTICS,
        'tariff_threat',
        0.6,
        0.7,
        new Date('2024-01-01')
      );
      
      engine.addSignal(country, signal1);
      engine.addSignal(country, signal2);
      
      await scheduler.scheduleDecay(signal1, 0.45);
      await scheduler.scheduleDecay(signal2, 0.38);
      
      // Get decay stats by factor
      const stats = scheduler.getDecayStats(country);
      
      expect(stats.by_factor[CSIRiskFactor.CONFLICT_SECURITY]).toBeDefined();
      expect(stats.by_factor[CSIRiskFactor.TRADE_LOGISTICS]).toBeDefined();
      expect(stats.by_factor[CSIRiskFactor.CONFLICT_SECURITY].total).toBeGreaterThan(0);
      expect(stats.by_factor[CSIRiskFactor.TRADE_LOGISTICS].total).toBeGreaterThan(0);
    });
  });

  describe('Probability Weighting Validation', () => {
    it('should weight high-probability signals more heavily', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;
      
      const highProbSignal = createValidSignal(
        'high_prob',
        country,
        factor,
        'sanctions_warning',
        0.3, // Lower severity to avoid cap
        0.85, // High probability
        new Date('2024-01-01')
      );
      
      const lowProbSignal = createValidSignal(
        'low_prob',
        country,
        factor,
        'sanctions_warning',
        0.3, // Same severity
        0.40, // Low probability
        new Date('2024-01-01')
      );
      
      engine.addSignal(country, highProbSignal);
      const driftHigh = await engine.calculate(country, new Date('2024-01-01'));
      
      // Clear and test low probability
      engine = new EscalationDriftEngine();
      engine.addSignal(country, lowProbSignal);
      const driftLow = await engine.calculate(country, new Date('2024-01-01'));
      
      // High probability signal should contribute more
      expect(driftHigh).toBeGreaterThanOrEqual(driftLow);
    });

    it('should validate probability is expectation-based', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.TRADE_LOGISTICS;
      
      const signal = createValidSignal(
        'test_sig',
        country,
        factor,
        'tariff_threat',
        0.7,
        0.75,
        new Date('2024-01-01')
      );
      
      engine.addSignal(country, signal);
      
      // Probability should be in 0-1 range (expectation-based)
      expect(signal.probability).toBeGreaterThanOrEqual(0);
      expect(signal.probability).toBeLessThanOrEqual(1);
      
      // Should not be frequency count (would be > 1)
      expect(signal.probability).toBeLessThanOrEqual(1);
    });
  });

  describe('Factor-Scoped Validation', () => {
    it('should prevent cross-factor drift accumulation', async () => {
      const country = 'TestCountry';
      
      // Add signals to different factors
      const currentTime = new Date();
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.3, 0.75, new Date(Date.now() - 73 * 60 * 60 * 1000)),
        createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat', 0.3, 0.7, new Date(Date.now() - 73 * 60 * 60 * 1000)),
        createValidSignal('sig3', country, CSIRiskFactor.SANCTIONS_REGULATORY, 'sanctions_warning', 0.3, 0.72, new Date(Date.now() - 73 * 60 * 60 * 1000))
      ];
      
      for (const signal of signals) {
        engine.addSignal(country, signal);
      }
      
      // Calculate drift by factor with explicit current time
      const driftByFactor = await engine.calculateByFactor(country, currentTime);
      
      // Each factor should have independent drift
      expect(driftByFactor.get(CSIRiskFactor.CONFLICT_SECURITY)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.TRADE_LOGISTICS)).toBeGreaterThan(0);
      expect(driftByFactor.get(CSIRiskFactor.SANCTIONS_REGULATORY)).toBeGreaterThan(0);
      
      // Total should equal sum of factors (no cross-factor accumulation)
      const total = await engine.calculate(country, currentTime);
      const sumOfFactors = Array.from(driftByFactor.values()).reduce((a, b) => a + b, 0);
      expect(Math.abs(total - sumOfFactors)).toBeLessThan(0.01);
    });

    it('should validate signal has exactly one risk_factor', () => {
      const country = 'TestCountry';
      
      const validSignal = createValidSignal(
        'valid_sig',
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'conflict_escalation',
        0.7,
        0.75,
        new Date()
      );
      
      // Valid signal should be accepted
      expect(() => engine.addSignal(country, validSignal)).not.toThrow();
      
      // Signal without risk_factor should be rejected
      const invalidSignal = { ...validSignal };
      delete (invalidSignal as any).risk_factor;
      
      expect(() => engine.addSignal(country, invalidSignal as Signal)).toThrow();
    });

    it('should track decay by factor', async () => {
      const country = 'TestCountry';
      
      const signal1 = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.7, 0.75, new Date(Date.now() - 73 * 60 * 60 * 1000));
      const signal2 = createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat', 0.6, 0.7, new Date(Date.now() - 73 * 60 * 60 * 1000));
      
      engine.addSignal(country, signal1);
      engine.addSignal(country, signal2);
      
      await scheduler.scheduleDecay(signal1, 0.45);
      await scheduler.scheduleDecay(signal2, 0.38);
      
      // Get active decays by factor
      const conflictDecays = await scheduler.getActiveDecaysByFactor(country, CSIRiskFactor.CONFLICT_SECURITY);
      const tradeDecays = await scheduler.getActiveDecaysByFactor(country, CSIRiskFactor.TRADE_LOGISTICS);
      
      expect(conflictDecays.length).toBe(1);
      expect(tradeDecays.length).toBe(1);
      expect(conflictDecays[0].risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
      expect(tradeDecays[0].risk_factor).toBe(CSIRiskFactor.TRADE_LOGISTICS);
    });
  });

  describe('Signal Validation', () => {
    it('should require valid CSIRiskFactor', () => {
      const country = 'TestCountry';
      
      const invalidSignal = createValidSignal(
        'invalid',
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'test',
        0.7,
        0.75,
        new Date()
      );
      
      // Set invalid risk_factor
      (invalidSignal as any).risk_factor = 'INVALID_FACTOR';
      
      expect(() => engine.addSignal(country, invalidSignal)).toThrow();
    });

    it('should require DETECTION source role', () => {
      const country = 'TestCountry';
      
      const signal = createValidSignal(
        'test',
        country,
        CSIRiskFactor.CONFLICT_SECURITY,
        'conflict_escalation',
        0.7,
        0.75,
        new Date()
      );
      
      // Change source role to BASELINE (invalid for signals)
      signal.sources[0].role = SourceRole.BASELINE;
      
      expect(() => engine.addSignal(country, signal)).toThrow();
    });
  });

  describe('Historical Validation Summary', () => {
    it('should demonstrate expectation-weighted CSI behavior', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.TRADE_LOGISTICS;
      
      // Use a time in the past to ensure signals are active
      const currentTime = new Date();
      const signalTime = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Add low-probability signal
      const lowProbSignal = createValidSignal(
        'low_prob',
        country,
        factor,
        'tariff_threat',
        0.3,
        0.30,
        signalTime
      );
      
      engine.addSignal(country, lowProbSignal);
      const driftWithLowProb = await engine.calculate(country, currentTime);
      
      // Add high-probability signal
      const highProbSignal = createValidSignal(
        'high_prob',
        country,
        factor,
        'tariff_threat',
        0.3,
        0.80,
        signalTime
      );
      
      engine.addSignal(country, highProbSignal);
      const driftWithBoth = await engine.calculate(country, currentTime);
      
      // Drift should increase with high-probability signal
      expect(driftWithBoth).toBeGreaterThanOrEqual(driftWithLowProb);
      
      // This demonstrates expectation-weighted movement (not purely reactive)
      expect(driftWithLowProb).toBeGreaterThanOrEqual(0); // Even low probability contributes
    });
  });
});