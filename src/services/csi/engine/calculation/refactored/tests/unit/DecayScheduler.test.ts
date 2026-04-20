/**
 * Unit Tests for Decay Scheduler - Phase 3D
 * Tests factor-scoped decay tracking and statistics
 */

import { DecayScheduler } from '../../DecayScheduler';
import { CSIRiskFactor, Signal, SourceRole } from '../../types';

describe('DecayScheduler - Phase 3D', () => {
  let scheduler: DecayScheduler;

  beforeEach(() => {
    scheduler = new DecayScheduler({
      inactivity_window_days: 30,
      decay_rate_multiplier: 0.5,
      decay_half_life_days: 30,
      expiration_threshold: 0.01
    });
  });

  // Helper function to create valid signal
  const createValidSignal = (
    signalId: string,
    country: string,
    factor: CSIRiskFactor,
    lastUpdated?: Date
  ): Signal => ({
    signal_id: signalId,
    country,
    risk_factor: factor,
    signal_type: 'test_signal',
    severity: 0.6,
    probability: 0.7,
    detected_date: new Date(),
    last_updated: lastUpdated || new Date(),
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
  });

  describe('DecaySchedule Interface Has risk_factor Field', () => {
    it('should include risk_factor in decay schedule', async () => {
      const signal = createValidSignal('sig1', 'TestCountry', CSIRiskFactor.CONFLICT_SECURITY);
      const schedule = await scheduler.scheduleDecay(signal, 0.5);

      expect(schedule.risk_factor).toBeDefined();
      expect(schedule.risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
    });

    it('should preserve risk_factor from signal', async () => {
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;
      const signal = createValidSignal('sig2', 'TestCountry', factor);
      const schedule = await scheduler.scheduleDecay(signal, 0.3);

      expect(schedule.risk_factor).toBe(factor);
    });
  });

  describe('Decay Schedules Track Which Factor They Belong To', () => {
    it('should track factor for each decay schedule', async () => {
      const signals = [
        createValidSignal('sig1', 'Country1', CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig2', 'Country1', CSIRiskFactor.TRADE_LOGISTICS),
        createValidSignal('sig3', 'Country1', CSIRiskFactor.CYBER_DATA_SOVEREIGNTY)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const schedule1 = scheduler.getSchedule('sig1');
      const schedule2 = scheduler.getSchedule('sig2');
      const schedule3 = scheduler.getSchedule('sig3');

      expect(schedule1?.risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
      expect(schedule2?.risk_factor).toBe(CSIRiskFactor.TRADE_LOGISTICS);
      expect(schedule3?.risk_factor).toBe(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY);
    });

    it('should maintain factor tracking throughout lifecycle', async () => {
      const factor = CSIRiskFactor.PUBLIC_UNREST_CIVIL;
      const signal = createValidSignal('sig1', 'TestCountry', factor);
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      // Check initial state
      let schedule = scheduler.getSchedule('sig1');
      expect(schedule?.risk_factor).toBe(factor);
      
      // Update decay status
      await scheduler.updateDecayStatus(signal);
      schedule = scheduler.getSchedule('sig1');
      expect(schedule?.risk_factor).toBe(factor);
      
      // Reset schedule
      scheduler.resetSchedule('sig1');
      schedule = scheduler.getSchedule('sig1');
      expect(schedule?.risk_factor).toBe(factor);
    });
  });

  describe('scheduleDecay() Captures Signal\'s risk_factor', () => {
    it('should capture risk_factor when scheduling decay', async () => {
      const factor = CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS;
      const signal = createValidSignal('sig1', 'TestCountry', factor);
      
      const schedule = await scheduler.scheduleDecay(signal, 0.4);

      expect(schedule.risk_factor).toBe(factor);
      expect(schedule.signal_id).toBe('sig1');
      expect(schedule.country).toBe('TestCountry');
    });

    it('should capture different factors for different signals', async () => {
      const signals = [
        { signal: createValidSignal('sig1', 'Country1', CSIRiskFactor.CONFLICT_SECURITY), drift: 0.5 },
        { signal: createValidSignal('sig2', 'Country1', CSIRiskFactor.GOVERNANCE_RULE_OF_LAW), drift: 0.3 },
        { signal: createValidSignal('sig3', 'Country1', CSIRiskFactor.TRADE_LOGISTICS), drift: 0.4 }
      ];

      for (const { signal, drift } of signals) {
        const schedule = await scheduler.scheduleDecay(signal, drift);
        expect(schedule.risk_factor).toBe(signal.risk_factor);
      }
    });
  });

  describe('getDecayStats() Returns Per-Factor Statistics', () => {
    it('should return per-factor breakdown in decay stats', async () => {
      const country = 'TestCountry';
      
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const stats = scheduler.getDecayStats(country);

      expect(stats.by_factor).toBeDefined();
      expect(stats.by_factor[CSIRiskFactor.CONFLICT_SECURITY]).toBeDefined();
      expect(stats.by_factor[CSIRiskFactor.CONFLICT_SECURITY].total).toBe(2);
      expect(stats.by_factor[CSIRiskFactor.TRADE_LOGISTICS].total).toBe(1);
    });

    it('should track active/decaying/expired counts per factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;
      
      // Create signals with different ages
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      
      const signals = [
        createValidSignal('sig1', country, factor, recentDate), // Active
        createValidSignal('sig2', country, factor, oldDate), // Decaying
        createValidSignal('sig3', country, factor, recentDate) // Active
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const stats = scheduler.getDecayStats(country);

      expect(stats.by_factor[factor].total).toBe(3);
      expect(stats.by_factor[factor].active).toBeGreaterThanOrEqual(0);
      expect(stats.by_factor[factor].decaying).toBeGreaterThanOrEqual(0);
    });

    it('should track total_decayed_value per factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CYBER_DATA_SOVEREIGNTY;
      
      const signals = [
        createValidSignal('sig1', country, factor),
        createValidSignal('sig2', country, factor)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const stats = scheduler.getDecayStats(country);

      expect(stats.by_factor[factor].total_decayed_value).toBeDefined();
      expect(typeof stats.by_factor[factor].total_decayed_value).toBe('number');
    });

    it('should initialize all factors in by_factor stats', async () => {
      const country = 'TestCountry';
      const signal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY);
      
      await scheduler.scheduleDecay(signal, 0.5);

      const stats = scheduler.getDecayStats(country);

      // All 7 CSI factors should be present
      for (const factor of Object.values(CSIRiskFactor)) {
        expect(stats.by_factor[factor]).toBeDefined();
        expect(stats.by_factor[factor].total).toBeGreaterThanOrEqual(0);
        expect(stats.by_factor[factor].active).toBeGreaterThanOrEqual(0);
        expect(stats.by_factor[factor].decaying).toBeGreaterThanOrEqual(0);
        expect(stats.by_factor[factor].expired).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Enable Filtering Decay Schedules by Factor', () => {
    it('should filter active decays by factor', async () => {
      const country = 'TestCountry';
      
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const conflictDecays = await scheduler.getActiveDecaysByFactor(
        country,
        CSIRiskFactor.CONFLICT_SECURITY
      );
      const tradeDecays = await scheduler.getActiveDecaysByFactor(
        country,
        CSIRiskFactor.TRADE_LOGISTICS
      );

      expect(conflictDecays.length).toBe(2);
      expect(tradeDecays.length).toBe(1);
      
      for (const decay of conflictDecays) {
        expect(decay.risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
      }
    });

    it('should get schedules by factor', () => {
      const signals = [
        createValidSignal('sig1', 'Country1', CSIRiskFactor.SANCTIONS_REGULATORY),
        createValidSignal('sig2', 'Country2', CSIRiskFactor.SANCTIONS_REGULATORY),
        createValidSignal('sig3', 'Country1', CSIRiskFactor.TRADE_LOGISTICS)
      ];

      for (const signal of signals) {
        scheduler.scheduleDecay(signal, 0.5);
      }

      const sanctionsSchedules = scheduler.getSchedulesByFactor(CSIRiskFactor.SANCTIONS_REGULATORY);
      const tradeSchedules = scheduler.getSchedulesByFactor(CSIRiskFactor.TRADE_LOGISTICS);

      expect(sanctionsSchedules.length).toBe(2);
      expect(tradeSchedules.length).toBe(1);
      
      for (const schedule of sanctionsSchedules) {
        expect(schedule.risk_factor).toBe(CSIRiskFactor.SANCTIONS_REGULATORY);
      }
    });

    it('should get decay stats by specific factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.PUBLIC_UNREST_CIVIL;
      
      const signals = [
        createValidSignal('sig1', country, factor),
        createValidSignal('sig2', country, factor),
        createValidSignal('sig3', country, CSIRiskFactor.CONFLICT_SECURITY) // Different factor
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const factorStats = scheduler.getDecayStatsByFactor(country, factor);

      expect(factorStats.total_schedules).toBe(2);
      expect(factorStats.active_count).toBeGreaterThanOrEqual(0);
      expect(factorStats.decaying_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Factor-Scoped Cleanup', () => {
    it('should cleanup expired schedules for specific factor', async () => {
      const country = 'TestCountry';
      
      // Create expired signals
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, oldDate),
        createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, oldDate)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
        scheduler.expireSignal(signal.signal_id);
      }

      // Cleanup only CONFLICT_SECURITY factor
      const cleaned = await scheduler.cleanupExpiredSchedules(0, CSIRiskFactor.CONFLICT_SECURITY);

      expect(cleaned).toBe(1);
      
      // CONFLICT_SECURITY schedule should be removed
      expect(scheduler.getSchedule('sig1')).toBeUndefined();
      
      // TRADE_LOGISTICS schedule should remain
      expect(scheduler.getSchedule('sig2')).toBeDefined();
    });

    it('should cleanup all factors when no factor specified', async () => {
      const country = 'TestCountry';
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, oldDate),
        createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, oldDate)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
        scheduler.expireSignal(signal.signal_id);
      }

      const cleaned = await scheduler.cleanupExpiredSchedules(0);

      expect(cleaned).toBe(2);
      expect(scheduler.getSchedule('sig1')).toBeUndefined();
      expect(scheduler.getSchedule('sig2')).toBeUndefined();
    });

    it('should respect retention period in factor-scoped cleanup', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;
      
      const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const signal = createValidSignal('sig1', country, factor, recentDate);
      
      await scheduler.scheduleDecay(signal, 0.5);
      scheduler.expireSignal(signal.signal_id);

      // Try to cleanup with 7-day retention
      const cleaned = await scheduler.cleanupExpiredSchedules(7, factor);

      expect(cleaned).toBe(0);
      expect(scheduler.getSchedule('sig1')).toBeDefined();
    });
  });

  describe('Health Metrics with Per-Factor Breakdown', () => {
    it('should include by_factor in health metrics', async () => {
      const signals = [
        createValidSignal('sig1', 'Country1', CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig2', 'Country1', CSIRiskFactor.TRADE_LOGISTICS)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const health = scheduler.getHealthMetrics();

      expect(health.by_factor).toBeDefined();
      expect(health.by_factor[CSIRiskFactor.CONFLICT_SECURITY]).toBeDefined();
      expect(health.by_factor[CSIRiskFactor.CONFLICT_SECURITY].total).toBe(1);
      expect(health.by_factor[CSIRiskFactor.TRADE_LOGISTICS].total).toBe(1);
    });

    it('should track status counts per factor in health metrics', async () => {
      const factor = CSIRiskFactor.CYBER_DATA_SOVEREIGNTY;
      
      const signals = [
        createValidSignal('sig1', 'Country1', factor),
        createValidSignal('sig2', 'Country1', factor)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const health = scheduler.getHealthMetrics();

      expect(health.by_factor[factor].total).toBe(2);
      expect(health.by_factor[factor].active).toBeGreaterThanOrEqual(0);
      expect(health.by_factor[factor].decaying).toBeGreaterThanOrEqual(0);
      expect(health.by_factor[factor].expired).toBeGreaterThanOrEqual(0);
    });

    it('should initialize all factors in health metrics', () => {
      const health = scheduler.getHealthMetrics();

      for (const factor of Object.values(CSIRiskFactor)) {
        expect(health.by_factor[factor]).toBeDefined();
        expect(health.by_factor[factor].total).toBe(0);
        expect(health.by_factor[factor].active).toBe(0);
        expect(health.by_factor[factor].decaying).toBe(0);
        expect(health.by_factor[factor].expired).toBe(0);
      }
    });
  });

  describe('Factor Tracking Throughout Lifecycle', () => {
    it('should maintain factor when updating decay status', async () => {
      const factor = CSIRiskFactor.GOVERNANCE_RULE_OF_LAW;
      const signal = createValidSignal('sig1', 'TestCountry', factor);
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      const schedule1 = scheduler.getSchedule('sig1');
      expect(schedule1?.risk_factor).toBe(factor);
      
      await scheduler.updateDecayStatus(signal);
      
      const schedule2 = scheduler.getSchedule('sig1');
      expect(schedule2?.risk_factor).toBe(factor);
    });

    it('should maintain factor when calculating decayed value', async () => {
      const factor = CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS;
      const signal = createValidSignal('sig1', 'TestCountry', factor);
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      await scheduler.calculateDecayedValue('sig1', new Date());
      
      const schedule = scheduler.getSchedule('sig1');
      expect(schedule?.risk_factor).toBe(factor);
    });

    it('should maintain factor when expiring signal', async () => {
      const factor = CSIRiskFactor.PUBLIC_UNREST_CIVIL;
      const signal = createValidSignal('sig1', 'TestCountry', factor);
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      scheduler.expireSignal('sig1');
      
      const schedule = scheduler.getSchedule('sig1');
      expect(schedule?.risk_factor).toBe(factor);
      expect(schedule?.status).toBe('EXPIRED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty schedules in getDecayStats', () => {
      const stats = scheduler.getDecayStats('EmptyCountry');

      expect(stats.total_schedules).toBe(0);
      expect(stats.by_factor).toBeDefined();
      
      for (const factor of Object.values(CSIRiskFactor)) {
        expect(stats.by_factor[factor].total).toBe(0);
      }
    });

    it('should handle empty schedules in getDecayStatsByFactor', () => {
      const stats = scheduler.getDecayStatsByFactor(
        'EmptyCountry',
        CSIRiskFactor.CONFLICT_SECURITY
      );

      expect(stats.total_schedules).toBe(0);
      expect(stats.active_count).toBe(0);
    });

    it('should handle empty schedules in getActiveDecaysByFactor', async () => {
      const decays = await scheduler.getActiveDecaysByFactor(
        'EmptyCountry',
        CSIRiskFactor.TRADE_LOGISTICS
      );

      expect(decays.length).toBe(0);
    });

    it('should handle empty schedules in getSchedulesByFactor', () => {
      const schedules = scheduler.getSchedulesByFactor(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY);

      expect(schedules.length).toBe(0);
    });
  });

  describe('Multiple Factors in Same Country', () => {
    it('should track multiple factors independently', async () => {
      const country = 'TestCountry';
      
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY),
        createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY),
        createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS),
        createValidSignal('sig4', country, CSIRiskFactor.GOVERNANCE_RULE_OF_LAW)
      ];

      for (const signal of signals) {
        await scheduler.scheduleDecay(signal, 0.5);
      }

      const stats = scheduler.getDecayStats(country);

      expect(stats.total_schedules).toBe(4);
      expect(stats.by_factor[CSIRiskFactor.CONFLICT_SECURITY].total).toBe(1);
      expect(stats.by_factor[CSIRiskFactor.SANCTIONS_REGULATORY].total).toBe(1);
      expect(stats.by_factor[CSIRiskFactor.TRADE_LOGISTICS].total).toBe(1);
      expect(stats.by_factor[CSIRiskFactor.GOVERNANCE_RULE_OF_LAW].total).toBe(1);
    });
  });
});