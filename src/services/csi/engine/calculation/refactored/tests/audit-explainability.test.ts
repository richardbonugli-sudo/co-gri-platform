/**
 * Audit & Explainability Validation Tests - Phase 5 Testing & Validation
 * Validates audit trails, provenance metadata, and explainability outputs
 */

import { RefactoredCSIEngine, CSIComponents, CSIBreakdown } from '../RefactoredCSIEngine';
import { EscalationDriftEngine, DriftContribution } from '../EscalationDriftEngine';
import { DecayScheduler, DecaySchedule } from '../DecayScheduler';
import { NettingEngine, NettingCluster, NettingResult } from '../NettingEngine';
import { Signal, CSIRiskFactor, ConfirmedEvent, SourceRole } from '../types';

describe('Audit & Explainability Validation', () => {
  const createMockSignal = (overrides: Partial<Signal> = {}): Signal => ({
    signal_id: 'audit-signal-001',
    country: 'TestCountry',
    risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
    signal_type: 'tariff_threat',
    severity: 0.7,
    probability: 0.65,
    detected_date: new Date('2024-01-01'),
    last_updated: new Date('2024-01-01'),
    persistence_hours: 72,
    sources: [{
      source_id: 'reuters',
      source_name: 'Reuters',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH' as const,
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'bloomberg',
      source_name: 'Bloomberg',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH' as const,
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }],
    corroboration_count: 2,
    max_drift_cap: 0.25,
    ...overrides
  });

  describe('CSI Attribution Audit Trail', () => {
    it('should provide complete attribution breakdown', async () => {
      const engine = new RefactoredCSIEngine();
      
      const breakdown = await engine.getCSIBreakdown('TestCountry', new Date());
      
      // Verify all attribution components are present
      expect(breakdown.components).toBeDefined();
      expect(breakdown.components.structural_baseline).toBeDefined();
      expect(breakdown.components.escalation_drift).toBeDefined();
      expect(breakdown.components.escalation_drift_netted).toBeDefined();
      expect(breakdown.components.event_delta).toBeDefined();
      expect(breakdown.components.total).toBeDefined();
      expect(breakdown.components.total_with_netting).toBeDefined();
    });

    it('should include metadata with timestamps', async () => {
      const engine = new RefactoredCSIEngine();
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      expect(result.metadata.last_updated).toBeInstanceOf(Date);
      expect(result.metadata.confidence_score).toBeDefined();
      expect(result.metadata.active_signals).toBeDefined();
      expect(result.metadata.confirmed_events).toBeDefined();
    });

    it('should track decay statistics', async () => {
      const engine = new RefactoredCSIEngine();
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      expect(result.metadata.decay_stats).toBeDefined();
    });

    it('should track netting statistics', async () => {
      const engine = new RefactoredCSIEngine();
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      expect(result.metadata.netting_stats).toBeDefined();
    });
  });

  describe('Signal Contribution Explainability', () => {
    it('should explain each signal contribution factor', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal();
      
      driftEngine.addSignal('TestCountry', signal);
      
      const contributions = await driftEngine.getActiveSignalsWithContributions('TestCountry');
      
      expect(contributions.length).toBeGreaterThan(0);
      
      const contribution = contributions[0];
      
      // All factors should be explained
      expect(contribution.signal_id).toBe(signal.signal_id);
      expect(contribution.base_severity).toBeDefined();
      expect(contribution.probability).toBeDefined();
      expect(contribution.persistence_factor).toBeDefined();
      expect(contribution.recency_factor).toBeDefined();
      expect(contribution.decay_factor).toBeDefined();
      expect(contribution.contribution).toBeDefined();
      expect(contribution.capped_contribution).toBeDefined();
    });

    it('should show contribution formula components', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal({
        severity: 0.8,
        probability: 0.7
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const contributions = await driftEngine.getActiveSignalsWithContributions('TestCountry');
      const contribution = contributions[0];
      
      // Verify formula: contribution = severity × probability × persistence × recency × decay
      expect(contribution.base_severity).toBe(0.8);
      expect(contribution.probability).toBe(0.7);
      expect(contribution.persistence_factor).toBeGreaterThanOrEqual(0);
      expect(contribution.persistence_factor).toBeLessThanOrEqual(1);
      expect(contribution.recency_factor).toBeGreaterThanOrEqual(0);
      expect(contribution.recency_factor).toBeLessThanOrEqual(1);
      expect(contribution.decay_factor).toBeGreaterThanOrEqual(0);
      expect(contribution.decay_factor).toBeLessThanOrEqual(1);
    });

    it('should explain capping when applied', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal({
        severity: 1.0,
        probability: 1.0,
        detected_date: new Date('2024-01-01'),
        last_updated: new Date('2024-01-01')
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const contributions = await driftEngine.getActiveSignalsWithContributions('TestCountry');
      const contribution = contributions[0];
      
      // Raw contribution might exceed cap
      // Capped contribution should be <= 0.25
      expect(contribution.capped_contribution).toBeLessThanOrEqual(0.25);
    });
  });

  describe('Decay Schedule Audit Trail', () => {
    it('should track decay schedule lifecycle', async () => {
      const scheduler = new DecayScheduler();
      const signal = createMockSignal();
      
      // Schedule decay
      const schedule = await scheduler.scheduleDecay(signal, 0.5);
      
      // Verify audit information
      expect(schedule.signal_id).toBe(signal.signal_id);
      expect(schedule.country).toBe(signal.country);
      expect(schedule.initial_drift).toBe(0.5);
      expect(schedule.decay_start_date).toBeInstanceOf(Date);
      expect(schedule.status).toBe('ACTIVE');
      expect(schedule.last_updated).toBeInstanceOf(Date);
    });

    it('should track status transitions', async () => {
      const scheduler = new DecayScheduler();
      const signal = createMockSignal({
        last_updated: new Date('2024-01-01')
      });
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      // Check initial status
      let schedule = scheduler.getSchedule(signal.signal_id);
      expect(schedule?.status).toBe('ACTIVE');
      
      // Calculate far in future to trigger decay
      await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-03-01'));
      
      schedule = scheduler.getSchedule(signal.signal_id);
      expect(['ACTIVE', 'DECAYING', 'EXPIRED']).toContain(schedule?.status);
    });

    it('should provide decay progress information', async () => {
      const scheduler = new DecayScheduler();
      const signal = createMockSignal();
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      const progress = scheduler.getDecayProgress(signal.signal_id, new Date());
      
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('should provide time until expiration', async () => {
      const scheduler = new DecayScheduler();
      const signal = createMockSignal({
        last_updated: new Date()
      });
      
      await scheduler.scheduleDecay(signal, 0.5);
      
      const timeUntilExpiration = scheduler.getTimeUntilExpiration(signal.signal_id);
      
      expect(timeUntilExpiration).toBeGreaterThan(0);
    });
  });

  describe('Netting Cluster Audit Trail', () => {
    it('should track netting cluster formation', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'netting-audit-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'netting-audit-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.2, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.22, signal: signal2 }
      ];
      
      const result = await nettingEngine.applyNetting('TestCountry', contributions);
      
      // Verify netting result audit information
      expect(result.original_drift).toBeDefined();
      expect(result.netted_drift).toBeDefined();
      expect(result.reduction_amount).toBeDefined();
      expect(result.reduction_percentage).toBeDefined();
      expect(result.signals_netted).toBeDefined();
      expect(result.signals_standalone).toBeDefined();
    });

    it('should track cluster membership', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'cluster-member-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'cluster-member-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.2, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.22, signal: signal2 }
      ];
      
      await nettingEngine.applyNetting('TestCountry', contributions);
      
      // Check cluster membership
      const cluster1 = nettingEngine.getClusterForSignal('cluster-member-1');
      const cluster2 = nettingEngine.getClusterForSignal('cluster-member-2');
      
      if (cluster1 && cluster2) {
        expect(cluster1.cluster_id).toBe(cluster2.cluster_id);
        expect(cluster1.signal_ids).toContain('cluster-member-1');
        expect(cluster1.signal_ids).toContain('cluster-member-2');
      }
    });

    it('should identify primary signal in cluster', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'primary-audit-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'primary-audit-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.25, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.15, signal: signal2 }
      ];
      
      await nettingEngine.applyNetting('TestCountry', contributions);
      
      const clusters = nettingEngine.getClustersForCountry('TestCountry');
      
      if (clusters.length > 0) {
        expect(clusters[0].primary_signal_id).toBeDefined();
        expect(clusters[0].netting_factor).toBeDefined();
      }
    });

    it('should track netting factor calculation', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'factor-audit-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'factor-audit-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.2, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.2, signal: signal2 }
      ];
      
      await nettingEngine.applyNetting('TestCountry', contributions);
      
      const clusters = nettingEngine.getClustersForCountry('TestCountry');
      
      if (clusters.length > 0) {
        const cluster = clusters[0];
        
        // Verify netting factor is calculated correctly
        expect(cluster.total_raw_contribution).toBeDefined();
        expect(cluster.netted_contribution).toBeDefined();
        expect(cluster.netting_factor).toBeDefined();
        
        // Netting factor should be netted/raw
        if (cluster.total_raw_contribution > 0) {
          const expectedFactor = cluster.netted_contribution / cluster.total_raw_contribution;
          expect(cluster.netting_factor).toBeCloseTo(expectedFactor, 2);
        }
      }
    });
  });

  describe('Provenance Metadata', () => {
    it('should track signal sources', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal({
        sources: [{
          source_id: 'reuters',
          source_name: 'Reuters',
          role: SourceRole.DETECTION,
          reliability_score: 0.9,
          authority_level: 'HIGH' as const,
          applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
        }, {
          source_id: 'bloomberg',
          source_name: 'Bloomberg',
          role: SourceRole.DETECTION,
          reliability_score: 0.9,
          authority_level: 'HIGH' as const,
          applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
        }, {
          source_id: 'ft',
          source_name: 'Financial Times',
          role: SourceRole.DETECTION,
          reliability_score: 0.9,
          authority_level: 'HIGH' as const,
          applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
        }]
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const activeSignals = driftEngine.getActiveSignals('TestCountry');
      
      expect(activeSignals[0].sources.length).toBe(3);
    });

    it('should track corroboration count', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal({
        corroboration_count: 5
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const activeSignals = driftEngine.getActiveSignals('TestCountry');
      
      expect(activeSignals[0].corroboration_count).toBe(5);
    });

    it('should track detection and update timestamps', async () => {
      const driftEngine = new EscalationDriftEngine();
      const detectedDate = new Date('2024-01-01');
      const updatedDate = new Date('2024-01-15');
      
      const signal = createMockSignal({
        detected_date: detectedDate,
        last_updated: updatedDate
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const activeSignals = driftEngine.getActiveSignals('TestCountry');
      
      expect(activeSignals[0].detected_date).toEqual(detectedDate);
      expect(activeSignals[0].last_updated).toEqual(updatedDate);
    });

    it('should track risk factor classification', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal({
        risk_factor: CSIRiskFactor.CONFLICT_SECURITY
      });
      
      driftEngine.addSignal('TestCountry', signal);
      
      const activeSignals = driftEngine.getActiveSignals('TestCountry');
      
      expect(activeSignals[0].risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
    });
  });

  describe('Drift Breakdown Explainability', () => {
    it('should provide complete drift breakdown', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal();
      
      driftEngine.addSignal('TestCountry', signal);
      await driftEngine.calculate('TestCountry', new Date('2024-01-04'));
      
      const breakdown = await driftEngine.getDriftBreakdown('TestCountry');
      
      expect(breakdown).toHaveProperty('total');
      expect(breakdown).toHaveProperty('contributions');
      expect(breakdown).toHaveProperty('cap_applied');
      expect(breakdown).toHaveProperty('remaining_capacity');
      expect(breakdown).toHaveProperty('decay_stats');
    });

    it('should explain cap application', async () => {
      const driftEngine = new EscalationDriftEngine();
      
      // Add many high-severity signals to trigger cap
      for (let i = 0; i < 10; i++) {
        const signal = createMockSignal({
          signal_id: `cap-explain-${i}`,
          severity: 1.0,
          probability: 1.0
        });
        driftEngine.addSignal('TestCountry', signal);
      }
      
      await driftEngine.calculate('TestCountry', new Date('2024-01-04'));
      
      const breakdown = await driftEngine.getDriftBreakdown('TestCountry');
      
      expect(typeof breakdown.cap_applied).toBe('boolean');
      expect(breakdown.remaining_capacity).toBeDefined();
    });

    it('should include decay statistics', async () => {
      const driftEngine = new EscalationDriftEngine();
      const signal = createMockSignal();
      
      driftEngine.addSignal('TestCountry', signal);
      await driftEngine.calculate('TestCountry', new Date('2024-01-04'));
      
      const breakdown = await driftEngine.getDriftBreakdown('TestCountry');
      
      expect(breakdown.decay_stats).toBeDefined();
    });
  });

  describe('Netting Statistics Explainability', () => {
    it('should provide netting statistics', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'stats-explain-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'stats-explain-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.2, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.2, signal: signal2 }
      ];
      
      await nettingEngine.applyNetting('TestCountry', contributions);
      
      const stats = nettingEngine.getNettingStats('TestCountry');
      
      expect(stats).toHaveProperty('total_clusters');
      expect(stats).toHaveProperty('total_signals_netted');
      expect(stats).toHaveProperty('total_reduction');
      expect(stats).toHaveProperty('avg_netting_factor');
      expect(stats).toHaveProperty('clusters_by_type');
    });

    it('should categorize clusters by event type', async () => {
      const nettingEngine = new NettingEngine();
      
      const signal1 = createMockSignal({
        signal_id: 'type-cat-1',
        signal_type: 'tariff_threat',
        detected_date: new Date('2024-01-10')
      });
      const signal2 = createMockSignal({
        signal_id: 'type-cat-2',
        signal_type: 'trade_investigation',
        detected_date: new Date('2024-01-12')
      });
      
      const contributions = [
        { signal_id: signal1.signal_id, contribution: 0.2, signal: signal1 },
        { signal_id: signal2.signal_id, contribution: 0.2, signal: signal2 }
      ];
      
      await nettingEngine.applyNetting('TestCountry', contributions);
      
      const stats = nettingEngine.getNettingStats('TestCountry');
      
      expect(stats.clusters_by_type).toBeDefined();
      expect(typeof stats.clusters_by_type).toBe('object');
    });
  });

  describe('Health Metrics for Audit', () => {
    it('should provide decay scheduler health metrics', () => {
      const scheduler = new DecayScheduler();
      
      const metrics = scheduler.getHealthMetrics();
      
      expect(metrics).toHaveProperty('total_schedules');
      expect(metrics).toHaveProperty('active_schedules');
      expect(metrics).toHaveProperty('decaying_schedules');
      expect(metrics).toHaveProperty('expired_schedules');
      expect(metrics).toHaveProperty('avg_current_value');
    });

    it('should provide drift engine health metrics', () => {
      const driftEngine = new EscalationDriftEngine();
      
      const metrics = driftEngine.getHealthMetrics();
      
      expect(metrics).toHaveProperty('total_countries');
      expect(metrics).toHaveProperty('total_active_signals');
      expect(metrics).toHaveProperty('avg_drift_per_country');
      expect(metrics).toHaveProperty('drift_history_entries');
      expect(metrics).toHaveProperty('decay_scheduler_health');
    });

    it('should provide netting engine health metrics', () => {
      const nettingEngine = new NettingEngine();
      
      const metrics = nettingEngine.getHealthMetrics();
      
      expect(metrics).toHaveProperty('total_clusters');
      expect(metrics).toHaveProperty('total_rules');
      expect(metrics).toHaveProperty('cache_size');
      expect(metrics).toHaveProperty('avg_cluster_size');
    });

    it('should provide CSI engine overall health', () => {
      const csiEngine = new RefactoredCSIEngine();
      
      const metrics = csiEngine.getHealthMetrics();
      
      expect(metrics).toHaveProperty('baseline_engine');
      expect(metrics).toHaveProperty('drift_engine');
      expect(metrics).toHaveProperty('event_engine');
      expect(metrics).toHaveProperty('netting_engine');
      expect(metrics).toHaveProperty('overall_status');
    });
  });

  describe('Configuration Audit', () => {
    it('should expose decay scheduler configuration', () => {
      const scheduler = new DecayScheduler();
      
      const config = scheduler.getConfig();
      
      expect(config).toHaveProperty('inactivity_window_days');
      expect(config).toHaveProperty('decay_rate_multiplier');
      expect(config).toHaveProperty('decay_half_life_days');
      expect(config).toHaveProperty('expiration_threshold');
    });

    it('should expose drift engine configuration', () => {
      const driftEngine = new EscalationDriftEngine();
      
      const config = driftEngine.getConfig();
      
      expect(config).toHaveProperty('max_drift_per_signal');
      expect(config).toHaveProperty('max_cumulative_drift_per_factor_per_30_days');
      expect(config).toHaveProperty('escalation_rate_multiplier');
      expect(config).toHaveProperty('recency_decay_lambda');
      expect(config).toHaveProperty('persistence_threshold_hours');
    });

    it('should expose netting rules', () => {
      const nettingEngine = new NettingEngine();
      
      const rules = nettingEngine.getRules();
      
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      
      const rule = rules[0];
      expect(rule).toHaveProperty('rule_id');
      expect(rule).toHaveProperty('signal_types');
      expect(rule).toHaveProperty('event_type');
      expect(rule).toHaveProperty('similarity_threshold');
      expect(rule).toHaveProperty('netting_strategy');
      expect(rule).toHaveProperty('description');
    });
  });

  describe('Audit Trail Completeness', () => {
    it('should provide full audit trail for CSI calculation', async () => {
      const engine = new RefactoredCSIEngine();
      
      // Add a signal
      const signal = createMockSignal();
      engine.addSignal('TestCountry', signal);
      
      // Calculate CSI
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      // Get breakdown
      const breakdown = await engine.getCSIBreakdown('TestCountry', new Date());
      
      // Verify complete audit trail
      expect(result.structural_baseline).toBeDefined();
      expect(result.escalation_drift).toBeDefined();
      expect(result.escalation_drift_netted).toBeDefined();
      expect(result.event_delta).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.total_with_netting).toBeDefined();
      
      expect(result.metadata.active_signals).toBeDefined();
      expect(result.metadata.confirmed_events).toBeDefined();
      expect(result.metadata.confidence_score).toBeDefined();
      expect(result.metadata.last_updated).toBeDefined();
      expect(result.metadata.decay_stats).toBeDefined();
      expect(result.metadata.netting_stats).toBeDefined();
      
      expect(breakdown.signal_contributions).toBeDefined();
      expect(breakdown.event_contributions).toBeDefined();
      expect(breakdown.drift_breakdown).toBeDefined();
      expect(breakdown.netting_result).toBeDefined();
    });

    it('should maintain audit trail consistency', async () => {
      const engine = new RefactoredCSIEngine();
      
      // Calculate multiple times
      const result1 = await engine.calculateCSI('TestCountry', new Date());
      const result2 = await engine.calculateCSI('TestCountry', new Date());
      
      // Results should be consistent
      expect(result1.structural_baseline).toBe(result2.structural_baseline);
      expect(result1.escalation_drift).toBe(result2.escalation_drift);
      expect(result1.event_delta).toBe(result2.event_delta);
    });
  });
});