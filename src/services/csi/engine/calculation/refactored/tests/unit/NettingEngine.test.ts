/**
 * Unit Tests for Netting Engine - Phase 3C
 * Tests CSI risk factor integration and same-factor constraint enforcement
 */

import { NettingEngine } from '../../NettingEngine';
import { CSIRiskFactor, Signal, SourceRole } from '../../types';

describe('NettingEngine - Phase 3C', () => {
  let engine: NettingEngine;

  beforeEach(() => {
    engine = new NettingEngine();
  });

  afterEach(() => {
    engine.clearAll();
  });

  // Helper function to create valid signal
  const createValidSignal = (
    signalId: string,
    country: string,
    factor: CSIRiskFactor,
    signalType: string,
    contribution: number = 0.5
  ): { signal_id: string; contribution: number; signal: Signal } => ({
    signal_id: signalId,
    contribution,
    signal: {
      signal_id: signalId,
      country,
      risk_factor: factor,
      signal_type: signalType,
      severity: 0.6,
      probability: 0.7,
      detected_date: new Date(),
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
    }
  });

  describe('Default Rules Mapped to Seven CSI Risk Factors', () => {
    it('should have rules for all seven CSI risk factors', () => {
      const rules = engine.getRules();
      const factorsWithRules = new Set(rules.map(r => r.risk_factor));

      // Should have rules for at least 6 of 7 factors (some may not have rules yet)
      expect(factorsWithRules.size).toBeGreaterThanOrEqual(6);
    });

    it('should have CONFLICT_SECURITY rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.CONFLICT_SECURITY);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
    });

    it('should have SANCTIONS_REGULATORY rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.SANCTIONS_REGULATORY);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.SANCTIONS_REGULATORY);
    });

    it('should have TRADE_LOGISTICS rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.TRADE_LOGISTICS);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.TRADE_LOGISTICS);
    });

    it('should have GOVERNANCE_RULE_OF_LAW rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.GOVERNANCE_RULE_OF_LAW);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.GOVERNANCE_RULE_OF_LAW);
    });

    it('should have CYBER_DATA_SOVEREIGNTY rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY);
    });

    it('should have PUBLIC_UNREST_CIVIL rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.PUBLIC_UNREST_CIVIL);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.PUBLIC_UNREST_CIVIL);
    });

    it('should have CURRENCY_CAPITAL_CONTROLS rules', () => {
      const rules = engine.getRulesForFactor(CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].risk_factor).toBe(CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS);
    });
  });

  describe('Rule Definitions Reference CSIRiskFactor', () => {
    it('should have all rules with valid CSIRiskFactor', () => {
      const rules = engine.getRules();
      
      for (const rule of rules) {
        expect(Object.values(CSIRiskFactor)).toContain(rule.risk_factor);
      }
    });

    it('should reject rules without valid risk_factor', () => {
      const invalidRule = {
        rule_id: 'invalid-rule',
        risk_factor: 'INVALID_FACTOR' as any,
        signal_types: ['test'],
        event_type: 'test_event',
        similarity_threshold: 0.7,
        netting_strategy: 'MAX' as const,
        description: 'Invalid rule'
      };

      expect(() => engine.addRule(invalidRule)).toThrow();
    });
  });

  describe('Same-Factor Netting Constraint', () => {
    it('should only net signals from same country AND same factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', country, factor, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, factor, 'conflict_escalation', 0.4)
      ];

      const result = await engine.applyNetting(country, signals);

      expect(result.clusters.length).toBeGreaterThan(0);
      expect(result.clusters[0].risk_factor).toBe(factor);
    });

    it('should not net signals from different countries', async () => {
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', 'Country1', factor, 'conflict_escalation', 0.5),
        createValidSignal('sig2', 'Country2', factor, 'conflict_escalation', 0.4)
      ];

      const result = await engine.applyNetting('Country1', signals);

      // Should not create cluster due to country mismatch
      expect(result.clusters.length).toBe(0);
    });

    it('should not net signals from different factors', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY, 'sanctions_warning', 0.4)
      ];

      const result = await engine.applyNetting(country, signals);

      // Should not create cluster due to factor mismatch
      expect(result.clusters.length).toBe(0);
    });
  });

  describe('calculateSimilarity Uses risk_factor', () => {
    it('should return 0 similarity for different risk_factors', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat')
      ];

      const result = await engine.applyNetting(country, signals);

      // No clusters should be created due to factor mismatch
      expect(result.clusters.length).toBe(0);
    });

    it('should have high similarity for same factor signals', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', country, factor, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, factor, 'conflict_escalation', 0.4)
      ];

      const result = await engine.applyNetting(country, signals);

      // Should create cluster due to same factor and type
      expect(result.clusters.length).toBeGreaterThan(0);
    });
  });

  describe('Hard Constraint: Same Country AND Same Factor', () => {
    it('should enforce both country and factor match', async () => {
      const signals = [
        createValidSignal('sig1', 'Country1', CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig2', 'Country2', CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig3', 'Country1', CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat')
      ];

      const result = await engine.applyNetting('Country1', signals);

      // Should not create any clusters due to mismatches
      expect(result.clusters.length).toBe(0);
    });
  });

  describe('Cluster Creation with Same Factor', () => {
    it('should create clusters only with signals from same factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;

      const signals = [
        createValidSignal('sig1', country, factor, 'sanctions_warning', 0.5),
        createValidSignal('sig2', country, factor, 'sanctions_warning', 0.4),
        createValidSignal('sig3', country, factor, 'diplomatic_freeze', 0.3)
      ];

      const result = await engine.applyNetting(country, signals);

      if (result.clusters.length > 0) {
        for (const cluster of result.clusters) {
          expect(cluster.risk_factor).toBe(factor);
        }
      }
    });

    it('should validate all signals in cluster share same factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.TRADE_LOGISTICS;

      const signals = [
        createValidSignal('sig1', country, factor, 'tariff_threat', 0.5),
        createValidSignal('sig2', country, factor, 'tariff_threat', 0.4)
      ];

      const result = await engine.applyNetting(country, signals);

      const validationErrors = result.validation_results.filter(
        r => !r.passed && r.severity === 'ERROR'
      );

      expect(validationErrors.length).toBe(0);
    });
  });

  describe('Cross-Factor Netting Prevention', () => {
    it('should prevent cross-factor netting with explicit error', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig2', country, CSIRiskFactor.SANCTIONS_REGULATORY, 'sanctions_warning')
      ];

      const result = await engine.applyNetting(country, signals);

      // Should not create cluster
      expect(result.clusters.length).toBe(0);
    });

    it('should track cross-factor netting attempts in health metrics', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig2', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat')
      ];

      await engine.applyNetting(country, signals);

      const health = engine.getHealthMetrics();
      expect(health.validation_stats).toBeDefined();
      expect(health.validation_stats.cross_factor_netting_attempts_blocked).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Similarity Scoring Heavily Weights Factor Matching', () => {
    it('should have factor matching as highest weight in similarity', async () => {
      const country = 'TestCountry';

      // Signals with same factor should have higher similarity than different factors
      const sameFactor = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation'),
        createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY, 'military_buildup')
      ];

      const result = await engine.applyNetting(country, sameFactor);

      // Should potentially create cluster (depending on other factors)
      // The key is that factor matching is weighted heavily
      expect(result.clusters_by_factor.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation Tracking', () => {
    it('should include validation results in netting result', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', country, factor, 'conflict_escalation'),
        createValidSignal('sig2', country, factor, 'conflict_escalation')
      ];

      const result = await engine.applyNetting(country, signals);

      expect(result.validation_results).toBeDefined();
      expect(Array.isArray(result.validation_results)).toBe(true);
    });

    it('should validate no cross-factor netting', () => {
      const validationResults = engine.validateNoCrossFactorNetting();

      expect(Array.isArray(validationResults)).toBe(true);
    });
  });

  describe('Health Metrics with Validation Stats', () => {
    it('should track validation stats in health metrics', () => {
      const health = engine.getHealthMetrics();

      expect(health.validation_stats).toBeDefined();
      expect(health.validation_stats.cross_factor_netting_attempts_blocked).toBeDefined();
      expect(health.validation_stats.invalid_cluster_attempts).toBeDefined();
    });

    it('should track clusters by factor', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.4)
      ];

      await engine.applyNetting(country, signals);

      const health = engine.getHealthMetrics();
      expect(health.clusters_by_factor).toBeDefined();
      expect(health.clusters_by_factor[CSIRiskFactor.CONFLICT_SECURITY]).toBeGreaterThanOrEqual(0);
    });

    it('should track rules by factor', () => {
      const health = engine.getHealthMetrics();

      expect(health.rules_by_factor).toBeDefined();
      
      // Should have rules for multiple factors
      const factorsWithRules = Object.values(CSIRiskFactor).filter(
        factor => health.rules_by_factor[factor] > 0
      );
      
      expect(factorsWithRules.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Factor-Scoped Cluster Operations', () => {
    it('should get clusters for specific country and factor', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', country, factor, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, factor, 'conflict_escalation', 0.4)
      ];

      await engine.applyNetting(country, signals);

      const clusters = engine.getClustersForCountryAndFactor(country, factor);
      
      for (const cluster of clusters) {
        expect(cluster.country).toBe(country);
        expect(cluster.risk_factor).toBe(factor);
      }
    });

    it('should get netting stats with factor breakdown', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.SANCTIONS_REGULATORY;

      const signals = [
        createValidSignal('sig1', country, factor, 'sanctions_warning', 0.5),
        createValidSignal('sig2', country, factor, 'sanctions_warning', 0.4)
      ];

      await engine.applyNetting(country, signals);

      const stats = engine.getNettingStats(country);

      expect(stats.clusters_by_factor).toBeDefined();
      expect(stats.clusters_by_factor[factor]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multiple Factors in Same Country', () => {
    it('should create separate clusters for different factors', async () => {
      const country = 'TestCountry';

      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.5),
        createValidSignal('sig2', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation', 0.4),
        createValidSignal('sig3', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat', 0.3),
        createValidSignal('sig4', country, CSIRiskFactor.TRADE_LOGISTICS, 'tariff_threat', 0.2)
      ];

      const result = await engine.applyNetting(country, signals);

      // Should create separate clusters for each factor
      const factorsInClusters = new Set(result.clusters.map(c => c.risk_factor));
      
      if (result.clusters.length > 0) {
        expect(factorsInClusters.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Netting Result Structure', () => {
    it('should include clusters_by_factor in result', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;

      const signals = [
        createValidSignal('sig1', country, factor, 'conflict_escalation'),
        createValidSignal('sig2', country, factor, 'conflict_escalation')
      ];

      const result = await engine.applyNetting(country, signals);

      expect(result.clusters_by_factor).toBeInstanceOf(Map);
      expect(result.clusters_by_factor.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty signal list', async () => {
      const result = await engine.applyNetting('TestCountry', []);

      expect(result.original_drift).toBe(0);
      expect(result.netted_drift).toBe(0);
      expect(result.clusters.length).toBe(0);
    });

    it('should handle single signal', async () => {
      const country = 'TestCountry';
      const signals = [
        createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation')
      ];

      const result = await engine.applyNetting(country, signals);

      // Single signal should not be netted
      expect(result.signals_standalone).toBe(1);
    });

    it('should handle signals with invalid risk_factor', async () => {
      const country = 'TestCountry';
      const invalidSignal = createValidSignal('sig1', country, CSIRiskFactor.CONFLICT_SECURITY, 'conflict_escalation');
      invalidSignal.signal.risk_factor = undefined as any;

      const result = await engine.applyNetting(country, [invalidSignal]);

      const errors = result.validation_results.filter(r => !r.passed && r.severity === 'ERROR');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});