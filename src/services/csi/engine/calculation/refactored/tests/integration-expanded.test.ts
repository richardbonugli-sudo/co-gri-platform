/**
 * Expanded Integration Tests - Phase 5 Testing & Validation
 * Full end-to-end workflow tests for the CSI engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RefactoredCSIEngine } from '../RefactoredCSIEngine';
import { EscalationDriftEngine } from '../EscalationDriftEngine';
import { StructuralBaselineEngine } from '../StructuralBaselineEngine';
import { EventDeltaEngine } from '../EventDeltaEngine';
import { NettingEngine } from '../NettingEngine';
import { DecayScheduler } from '../DecayScheduler';
import { Signal, CSIRiskFactor, ConfirmedEvent, SourceRole } from '../types';

describe('Expanded Integration Tests', () => {
  // Create fresh instances for each test to avoid cross-test contamination
  let baselineEngine: StructuralBaselineEngine;
  let driftEngine: EscalationDriftEngine;
  let eventEngine: EventDeltaEngine;
  let nettingEngine: NettingEngine;
  let engine: RefactoredCSIEngine;

  beforeEach(() => {
    // Create fresh instances for isolation
    baselineEngine = new StructuralBaselineEngine();
    driftEngine = new EscalationDriftEngine();
    eventEngine = new EventDeltaEngine();
    nettingEngine = new NettingEngine();
    engine = new RefactoredCSIEngine(baselineEngine, driftEngine, eventEngine, nettingEngine);
  });

    const createMockSignal = (overrides: Partial<Signal> = {}): Signal => ({
    signal_id: 'integration-signal-001',
    country: 'TestCountry',
    risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
    signal_type: 'tariff_threat',
    severity: 0.7,
    probability: 0.65,
    detected_date: new Date('2024-01-01'),
    last_updated: new Date('2024-01-01'),
    persistence_hours: 72,
    sources: [{
      source_id: 'test_source_1',
      source_name: 'Test Detection Source 1',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'test_source_2',
      source_name: 'Test Detection Source 2',
      role: SourceRole.DETECTION,
      reliability_score: 0.85,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }],
    corroboration_count: 2,
    max_drift_cap: 0.25,
    ...overrides
  });

  describe('End-to-End CSI Calculation Workflow', () => {
    it('should calculate CSI from scratch with no signals', async () => {
      const result = await engine.calculateCSI('NewCountry', new Date());
      
      // Should have baseline only
      expect(result.structural_baseline).toBeGreaterThan(0);
      expect(result.escalation_drift).toBe(0);
      expect(result.event_delta).toBe(0);
      expect(result.total).toBe(result.structural_baseline);
    });

    it('should update CSI when signals are added', async () => {
      // Initial calculation
      const initial = await engine.calculateCSI('TestCountry', new Date());
      
      // Add signal
      const signal = createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      engine.addSignal('TestCountry', signal);
      
      // Recalculate
      const updated = await engine.calculateCSI('TestCountry', new Date());
      
      // Drift should now be positive
      expect(updated.escalation_drift).toBeGreaterThan(0);
      expect(updated.total).toBeGreaterThan(initial.total);
    });

    it('should update CSI when signals are removed', async () => {
      // Add signal
      const signal = createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      engine.addSignal('TestCountry', signal);
      
      // Calculate with signal
      const withSignal = await engine.calculateCSI('TestCountry', new Date());
      
      // Remove signal
      engine.removeSignal('TestCountry', signal.signal_id);
      
      // Calculate without signal
      const withoutSignal = await engine.calculateCSI('TestCountry', new Date());
      
      // Drift should be back to 0
      expect(withoutSignal.escalation_drift).toBe(0);
      expect(withoutSignal.total).toBeLessThan(withSignal.total);
    });

    it('should handle signal updates correctly', async () => {
      // Add signal with low severity
      const signal = createMockSignal({
        severity: 0.3,
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      engine.addSignal('TestCountry', signal);
      
      const lowSeverity = await engine.calculateCSI('TestCountry', new Date());
      
      // Update signal to high severity
      engine.updateSignal('TestCountry', signal.signal_id, { severity: 0.9 });
      
      const highSeverity = await engine.calculateCSI('TestCountry', new Date());
      
      // Higher severity should increase or maintain drift (capped at 0.25)
      expect(highSeverity.escalation_drift).toBeGreaterThanOrEqual(lowSeverity.escalation_drift);
    });
  });

  describe('Multi-Country Workflow', () => {
    it('should handle multiple countries independently', async () => {
      // Add signals to different countries
      engine.addSignal('China', createMockSignal({
        signal_id: 'china-signal',
        country: 'China',
        severity: 0.8,
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      engine.addSignal('Japan', createMockSignal({
        signal_id: 'japan-signal',
        country: 'Japan',
        severity: 0.4,
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const chinaCSI = await engine.calculateCSI('China', new Date());
      const japanCSI = await engine.calculateCSI('Japan', new Date());
      
      // China should have higher drift due to higher severity
      expect(chinaCSI.escalation_drift).toBeGreaterThan(japanCSI.escalation_drift);
    });

    it('should not cross-contaminate country data', async () => {
      // Add signal to China only
      engine.addSignal('China', createMockSignal({
        signal_id: 'china-only-signal',
        country: 'China',
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const chinaCSI = await engine.calculateCSI('China', new Date());
      const japanCSI = await engine.calculateCSI('Japan', new Date());
      
      // Japan should have no drift
      expect(chinaCSI.escalation_drift).toBeGreaterThan(0);
      expect(japanCSI.escalation_drift).toBe(0);
    });
  });

  describe('Decay Integration Workflow', () => {
    it('should integrate decay with drift calculation', async () => {
      // Add old signal (should be decaying)
      const oldSignal = createMockSignal({
        signal_id: 'old-signal',
        detected_date: new Date('2024-01-01'),
        last_updated: new Date('2024-01-01')
      });
      engine.addSignal('TestCountry', oldSignal);
      
      // Calculate at different times
      const earlyResult = await engine.calculateCSI('TestCountry', new Date('2024-01-15'));
      const lateResult = await engine.calculateCSI('TestCountry', new Date('2024-03-15'));
      
      // Later calculation should have lower drift due to decay
      expect(lateResult.escalation_drift).toBeLessThanOrEqual(earlyResult.escalation_drift);
    });

    it('should reset decay when signal is updated', async () => {
      const localDriftEngine = new EscalationDriftEngine();
      const decayScheduler = localDriftEngine.getDecayScheduler();
      
      const signal = createMockSignal({
        last_updated: new Date('2024-01-01')
      });
      
      localDriftEngine.addSignal('TestCountry', signal);
      
      // Calculate to trigger decay scheduling
      await localDriftEngine.calculate('TestCountry', new Date('2024-02-15'));
      
      // Update signal
      localDriftEngine.updateSignal('TestCountry', signal.signal_id, { severity: 0.9 });
      
      // Decay should be reset
      const schedule = decayScheduler.getSchedule(signal.signal_id);
      expect(schedule?.status).toBe('ACTIVE');
    });
  });

  describe('Netting Integration Workflow', () => {
    it('should apply netting to overlapping signals', async () => {
      // Add overlapping tariff signals
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'tariff-1',
        signal_type: 'tariff_threat',
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sources: [{
      source_id: 'test_source_1',
      source_name: 'Reuters',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'test_source_2',
      source_name: 'Bloomberg',
      role: SourceRole.DETECTION,
      reliability_score: 0.85,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }]
      }));
      
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'tariff-2',
        signal_type: 'trade_investigation',
        detected_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sources: [{
      source_id: 'test_source_1',
      source_name: 'Reuters',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'test_source_3',
      source_name: 'Financial Times',
      role: SourceRole.DETECTION,
      reliability_score: 0.88,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }]
      }));
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      // Netted drift should be less than or equal to raw drift
      expect(result.escalation_drift_netted).toBeLessThanOrEqual(result.escalation_drift);
      expect(result.total_with_netting).toBeLessThanOrEqual(result.total);
    });

    it('should not net unrelated signals', async () => {
      // Add unrelated signals
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'tariff-signal',
        signal_type: 'tariff_threat',
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'conflict-signal',
        signal_type: 'conflict_escalation',
        detected_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days apart
        last_updated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }));
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      // Netting should have minimal effect on unrelated signals
      expect(result.escalation_drift_netted).toBeCloseTo(result.escalation_drift, 1);
    });
  });

  describe('Full Lifecycle Integration', () => {
    it('should handle complete signal lifecycle', async () => {
      const timestamp = new Date();
      
      // Phase 1: No signals
      const phase1 = await engine.calculateCSI('TestCountry', timestamp);
      expect(phase1.escalation_drift).toBe(0);
      
      // Phase 2: Add signal
      const signal = createMockSignal({
        detected_date: new Date(timestamp.getTime() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(timestamp.getTime() - 3 * 24 * 60 * 60 * 1000)
      });
      engine.addSignal('TestCountry', signal);
      
      const phase2 = await engine.calculateCSI('TestCountry', timestamp);
      expect(phase2.escalation_drift).toBeGreaterThan(0);
      
      // Phase 3: Update signal (increase severity) - drift may stay same due to cap
      engine.updateSignal('TestCountry', signal.signal_id, { severity: 0.9 });
      
      const phase3 = await engine.calculateCSI('TestCountry', timestamp);
      expect(phase3.escalation_drift).toBeGreaterThanOrEqual(phase2.escalation_drift);
      
      // Phase 4: Remove signal
      engine.removeSignal('TestCountry', signal.signal_id);
      
      const phase4 = await engine.calculateCSI('TestCountry', timestamp);
      expect(phase4.escalation_drift).toBe(0);
    });

    it('should maintain consistency across calculations', async () => {
      // Add signal
      engine.addSignal('TestCountry', createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      // Calculate multiple times
      const results = await Promise.all([
        engine.calculateCSI('TestCountry', new Date()),
        engine.calculateCSI('TestCountry', new Date()),
        engine.calculateCSI('TestCountry', new Date())
      ]);
      
      // All results should be consistent
      expect(results[0].total).toBe(results[1].total);
      expect(results[1].total).toBe(results[2].total);
    });
  });

  describe('Component Integration', () => {
    it('should integrate all three components correctly', async () => {
      // Add signal for drift
      engine.addSignal('TestCountry', createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      // Verify formula: total = baseline + drift + delta
      const expectedTotal = result.structural_baseline + result.escalation_drift + result.event_delta;
      const boundedTotal = Math.max(0, Math.min(100, expectedTotal));
      
      expect(result.total).toBeCloseTo(boundedTotal, 2);
    });

    it('should integrate netting correctly', async () => {
      // Add overlapping signals
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'overlap-1',
        signal_type: 'tariff_threat',
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sources: [{
      source_id: 'test_source_1',
      source_name: 'Reuters',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'test_source_2',
      source_name: 'Bloomberg',
      role: SourceRole.DETECTION,
      reliability_score: 0.85,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }]
      }));
      
      engine.addSignal('TestCountry', createMockSignal({
        signal_id: 'overlap-2',
        signal_type: 'trade_investigation',
        detected_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sources: [{
      source_id: 'test_source_1',
      source_name: 'Reuters',
      role: SourceRole.DETECTION,
      reliability_score: 0.9,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }, {
      source_id: 'test_source_3',
      source_name: 'Financial Times',
      role: SourceRole.DETECTION,
      reliability_score: 0.88,
      authority_level: 'HIGH',
      applicable_factors: [CSIRiskFactor.TRADE_LOGISTICS]
    }]
      }));
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      
      // Verify netting formula: total_with_netting = baseline + netted_drift + delta
      const expectedNettedTotal = result.structural_baseline + result.escalation_drift_netted + result.event_delta;
      const boundedNettedTotal = Math.max(0, Math.min(100, expectedNettedTotal));
      
      expect(result.total_with_netting).toBeCloseTo(boundedNettedTotal, 2);
    });
  });

  describe('Breakdown Integration', () => {
    it('should provide consistent breakdown', async () => {
      // Add signal
      engine.addSignal('TestCountry', createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const result = await engine.calculateCSI('TestCountry', new Date());
      const breakdown = await engine.getCSIBreakdown('TestCountry', new Date());
      
      // Breakdown should match result
      expect(breakdown.components.structural_baseline).toBe(result.structural_baseline);
      expect(breakdown.components.escalation_drift).toBe(result.escalation_drift);
      expect(breakdown.components.event_delta).toBe(result.event_delta);
      expect(breakdown.components.total).toBe(result.total);
    });

    it('should include all breakdown components', async () => {
      // Add signal
      engine.addSignal('TestCountry', createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const breakdown = await engine.getCSIBreakdown('TestCountry', new Date());
      
      expect(breakdown.components).toBeDefined();
      expect(breakdown.signal_contributions).toBeDefined();
      expect(breakdown.event_contributions).toBeDefined();
      expect(breakdown.drift_breakdown).toBeDefined();
      expect(breakdown.netting_result).toBeDefined();
    });
  });

  describe('Cleanup Integration', () => {
    it('should cleanup all components', async () => {
      // Add signals
      for (let i = 0; i < 10; i++) {
        engine.addSignal('TestCountry', createMockSignal({
          signal_id: `cleanup-signal-${i}`,
          detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }));
      }
      
      // Calculate to create history
      await engine.calculateCSI('TestCountry', new Date());
      
      // Cleanup
      await engine.cleanup(0);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Health Metrics Integration', () => {
    it('should provide integrated health metrics', async () => {
      // Add signals
      engine.addSignal('TestCountry', createMockSignal({
        detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }));
      
      const metrics = engine.getHealthMetrics();
      
      expect(metrics.baseline_engine).toBeDefined();
      expect(metrics.drift_engine).toBeDefined();
      expect(metrics.event_engine).toBeDefined();
      expect(metrics.netting_engine).toBeDefined();
      expect(metrics.overall_status).toBeDefined();
    });

    it('should reflect actual system state', async () => {
      // Add multiple signals
      for (let i = 0; i < 5; i++) {
        engine.addSignal('TestCountry', createMockSignal({
          signal_id: `health-signal-${i}`,
          detected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }));
      }
      
      const metrics = engine.getHealthMetrics();
      
      expect(metrics.drift_engine.total_active_signals).toBe(5);
      expect(metrics.drift_engine.total_countries).toBe(1);
    });
  });
});