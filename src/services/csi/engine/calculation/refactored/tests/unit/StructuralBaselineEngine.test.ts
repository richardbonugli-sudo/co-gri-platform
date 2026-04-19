/**
 * Unit Tests for Structural Baseline Engine - Phase 2
 * Tests per-factor baseline calculation and contamination removal
 */

import { StructuralBaselineEngine } from '../../StructuralBaselineEngine';
import { CSIRiskFactor, SourceRole } from '../../types';

describe('StructuralBaselineEngine - Phase 2', () => {
  let engine: StructuralBaselineEngine;

  beforeEach(() => {
    engine = new StructuralBaselineEngine();
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Per-Factor Baseline Calculation', () => {
    it('should calculate baseline for each of the 7 CSI risk factors', async () => {
      const country = 'TestCountry';
      const factorBaselines = await engine.getAllFactorBaselines(country);

      expect(factorBaselines.size).toBe(7);
      
      // Verify all 7 factors are present
      expect(factorBaselines.has(CSIRiskFactor.CONFLICT_SECURITY)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.SANCTIONS_REGULATORY)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.TRADE_LOGISTICS)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.GOVERNANCE_RULE_OF_LAW)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.CYBER_DATA_SOVEREIGNTY)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.PUBLIC_UNREST_CIVIL)).toBe(true);
      expect(factorBaselines.has(CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS)).toBe(true);
    });

    it('should calculate individual factor baseline', async () => {
      const country = 'TestCountry';
      const factor = CSIRiskFactor.CONFLICT_SECURITY;
      
      const baseline = await engine.calculateFactorBaseline(country, factor);

      expect(baseline).toBeDefined();
      expect(baseline.factor).toBe(factor);
      expect(baseline.value).toBeGreaterThanOrEqual(0);
      expect(baseline.value).toBeLessThanOrEqual(100);
      expect(baseline.sources.length).toBeGreaterThan(0);
      expect(baseline.calculation_method).toBe('weighted_average_authoritative_sources_appendix_b');
    });

    it('should use factor-specific sources from Appendix B', async () => {
      const country = 'TestCountry';
      
      // Check Conflict & Security sources
      const conflictBaseline = await engine.calculateFactorBaseline(
        country,
        CSIRiskFactor.CONFLICT_SECURITY
      );
      expect(conflictBaseline.sources.some(s => s.source_name.includes('UCDP'))).toBe(true);
      expect(conflictBaseline.sources.some(s => s.source_name.includes('Peace Index'))).toBe(true);

      // Check Sanctions sources
      const sanctionsBaseline = await engine.calculateFactorBaseline(
        country,
        CSIRiskFactor.SANCTIONS_REGULATORY
      );
      expect(sanctionsBaseline.sources.some(s => s.source_name.includes('OFAC'))).toBe(true);
      expect(sanctionsBaseline.sources.some(s => s.source_name.includes('UN Sanctions'))).toBe(true);
    });

    it('should enforce BASELINE source role for all sources', async () => {
      const country = 'TestCountry';
      const factorBaselines = await engine.getAllFactorBaselines(country);

      for (const [factor, baseline] of factorBaselines.entries()) {
        for (const source of baseline.sources) {
          expect(source.role).toBe(SourceRole.BASELINE);
        }
      }
    });
  });

  describe('CSI Methodology Weights', () => {
    it('should apply correct weights per factor', () => {
      const weights = engine.getFactorWeights();

      expect(weights[CSIRiskFactor.CONFLICT_SECURITY]).toBe(0.25); // 25%
      expect(weights[CSIRiskFactor.SANCTIONS_REGULATORY]).toBe(0.20); // 20%
      expect(weights[CSIRiskFactor.TRADE_LOGISTICS]).toBe(0.15); // 15%
      expect(weights[CSIRiskFactor.GOVERNANCE_RULE_OF_LAW]).toBe(0.15); // 15%
      expect(weights[CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS]).toBe(0.12); // 12%
      expect(weights[CSIRiskFactor.PUBLIC_UNREST_CIVIL]).toBe(0.08); // 8%
      expect(weights[CSIRiskFactor.CYBER_DATA_SOVEREIGNTY]).toBe(0.05); // 5%
    });

    it('should have weights that sum to 1.0', () => {
      const weights = engine.getFactorWeights();
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001);
    });

    it('should use weighted sum in aggregate calculation', async () => {
      const country = 'TestCountry';
      const aggregateBaseline = await engine.calculate(country);

      expect(aggregateBaseline).toBeGreaterThanOrEqual(0);
      expect(aggregateBaseline).toBeLessThanOrEqual(100);
    });
  });

  describe('No Macroeconomic Contamination', () => {
    it('should not include GDP-related sources', async () => {
      const country = 'TestCountry';
      const factorBaselines = await engine.getAllFactorBaselines(country);

      for (const [factor, baseline] of factorBaselines.entries()) {
        for (const source of baseline.sources) {
          expect(source.source_name.toLowerCase()).not.toContain('gdp');
          expect(source.source_name.toLowerCase()).not.toContain('growth');
          expect(source.source_name.toLowerCase()).not.toContain('inflation');
          expect(source.source_name.toLowerCase()).not.toContain('debt');
          expect(source.source_name.toLowerCase()).not.toContain('deficit');
        }
      }
    });

    it('should not include environmental sources', async () => {
      const country = 'TestCountry';
      const factorBaselines = await engine.getAllFactorBaselines(country);

      for (const [factor, baseline] of factorBaselines.entries()) {
        for (const source of baseline.sources) {
          expect(source.source_name.toLowerCase()).not.toContain('climate');
          expect(source.source_name.toLowerCase()).not.toContain('weather');
          expect(source.source_name.toLowerCase()).not.toContain('environmental');
          expect(source.source_name.toLowerCase()).not.toContain('natural disaster');
        }
      }
    });

    it('should pass validation for no contamination', () => {
      const validationResults = engine.validateConfiguration();
      
      const contaminationErrors = validationResults.filter(
        r => r.check_name === 'no_macro_environmental_contamination' && !r.passed
      );

      expect(contaminationErrors.length).toBe(0);
    });
  });

  describe('Quarterly Update Enforcement', () => {
    it('should cache baseline with next update due date', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      const metadata = engine.getBaselineMetadata(country);
      expect(metadata).toBeDefined();
      expect(metadata?.nextUpdateDue).toBeDefined();
      expect(metadata?.nextUpdateDue).toBeInstanceOf(Date);
    });

    it('should return cached value if not stale', async () => {
      const country = 'TestCountry';
      const firstCalc = await engine.calculate(country);
      const secondCalc = await engine.calculate(country);

      expect(firstCalc).toBe(secondCalc);
    });

    it('should block event-driven update attempts', async () => {
      const country = 'TestCountry';
      
      // Initial calculation
      await engine.calculate(country);

      // Attempt event-driven update
      const allowed = engine.attemptUpdate(country, 'event');
      expect(allowed).toBe(false);

      const health = engine.getHealthMetrics();
      expect(health.event_update_attempts_blocked).toBeGreaterThan(0);
    });

    it('should block signal-driven update attempts', async () => {
      const country = 'TestCountry';
      
      // Initial calculation
      await engine.calculate(country);

      // Attempt signal-driven update
      const allowed = engine.attemptUpdate(country, 'signal');
      expect(allowed).toBe(false);

      const health = engine.getHealthMetrics();
      expect(health.event_update_attempts_blocked).toBeGreaterThan(0);
    });

    it('should allow quarterly scheduled updates', async () => {
      const country = 'TestCountry';
      const now = new Date();
      
      // Initial calculation
      await engine.calculate(country, now);

      // Simulate 91 days later (beyond quarterly)
      const futureDate = new Date(now.getTime() + 91 * 24 * 60 * 60 * 1000);
      const allowed = engine.attemptUpdate(country, 'scheduled', futureDate);
      
      expect(allowed).toBe(true);
    });

    it('should track next updates due in health metrics', async () => {
      const country1 = 'Country1';
      const country2 = 'Country2';
      
      await engine.calculate(country1);
      await engine.calculate(country2);

      const health = engine.getHealthMetrics();
      expect(health.next_updates_due).toBeDefined();
      expect(health.next_updates_due.length).toBeGreaterThan(0);
      expect(health.next_updates_due[0].country).toBeDefined();
      expect(health.next_updates_due[0].due_date).toBeInstanceOf(Date);
    });
  });

  describe('Factor-Based Cache Structure', () => {
    it('should cache factor-level baselines', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      const metadata = engine.getBaselineMetadata(country);
      expect(metadata?.by_factor).toBeDefined();
      expect(metadata?.by_factor?.size).toBe(7);
    });

    it('should retrieve individual factor from cache', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      const conflictBaseline = await engine.getFactorBaseline(
        country,
        CSIRiskFactor.CONFLICT_SECURITY
      );

      expect(conflictBaseline).toBeDefined();
      expect(conflictBaseline.factor).toBe(CSIRiskFactor.CONFLICT_SECURITY);
    });

    it('should clear factor-based cache', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      expect(engine.getBaselineMetadata(country)).toBeDefined();

      engine.clearCache(country);
      expect(engine.getBaselineMetadata(country)).toBeUndefined();
    });
  });

  describe('Health Metrics with Factor Coverage', () => {
    it('should report factor coverage in health metrics', async () => {
      await engine.calculate('Country1');
      await engine.calculate('Country2');

      const health = engine.getHealthMetrics();

      expect(health.factor_coverage).toBeDefined();
      expect(health.factor_coverage[CSIRiskFactor.CONFLICT_SECURITY]).toBeGreaterThan(0);
      expect(health.factor_coverage[CSIRiskFactor.SANCTIONS_REGULATORY]).toBeGreaterThan(0);
    });

    it('should track event update attempts blocked', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      engine.attemptUpdate(country, 'event');
      engine.attemptUpdate(country, 'signal');

      const health = engine.getHealthMetrics();
      expect(health.event_update_attempts_blocked).toBe(2);
    });

    it('should report stale baselines', async () => {
      const country = 'TestCountry';
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      
      await engine.calculate(country, oldDate);

      const health = engine.getHealthMetrics();
      expect(health.stale_count).toBeGreaterThan(0);
    });
  });

  describe('Source Transparency', () => {
    it('should expose factor sources for transparency', () => {
      const conflictSources = engine.getFactorSources(CSIRiskFactor.CONFLICT_SECURITY);
      
      expect(conflictSources.length).toBeGreaterThan(0);
      expect(conflictSources[0].source_id).toBeDefined();
      expect(conflictSources[0].source_name).toBeDefined();
      expect(conflictSources[0].role).toBe(SourceRole.BASELINE);
    });

    it('should provide different sources for different factors', () => {
      const conflictSources = engine.getFactorSources(CSIRiskFactor.CONFLICT_SECURITY);
      const sanctionsSources = engine.getFactorSources(CSIRiskFactor.SANCTIONS_REGULATORY);

      expect(conflictSources).not.toEqual(sanctionsSources);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate baseline configuration', () => {
      const validationResults = engine.validateConfiguration();

      expect(validationResults).toBeDefined();
      expect(Array.isArray(validationResults)).toBe(true);
    });

    it('should pass weight sum validation', () => {
      const validationResults = engine.validateConfiguration();
      
      const weightCheck = validationResults.find(r => r.check_name === 'factor_weights_sum');
      expect(weightCheck).toBeDefined();
      expect(weightCheck?.passed).toBe(true);
    });

    it('should pass source role validation', () => {
      const validationResults = engine.validateConfiguration();
      
      const roleErrors = validationResults.filter(
        r => r.check_name === 'baseline_source_role' && !r.passed
      );

      expect(roleErrors.length).toBe(0);
    });
  });

  describe('Baseline Stability', () => {
    it('should produce stable baselines across multiple calls', async () => {
      const country = 'TestCountry';
      
      const baseline1 = await engine.calculate(country);
      const baseline2 = await engine.calculate(country);
      const baseline3 = await engine.calculate(country);

      expect(baseline1).toBe(baseline2);
      expect(baseline2).toBe(baseline3);
    });

    it('should maintain factor-level stability', async () => {
      const country = 'TestCountry';
      
      const factors1 = await engine.getAllFactorBaselines(country);
      const factors2 = await engine.getAllFactorBaselines(country);

      for (const factor of Object.values(CSIRiskFactor)) {
        const value1 = factors1.get(factor)?.value;
        const value2 = factors2.get(factor)?.value;
        expect(value1).toBe(value2);
      }
    });
  });

  describe('Cache Management', () => {
    it('should cleanup old cache entries', async () => {
      const country = 'TestCountry';
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      
      await engine.calculate(country, oldDate);
      expect(engine.getBaselineMetadata(country)).toBeDefined();

      engine.cleanupOldCache(90);
      expect(engine.getBaselineMetadata(country)).toBeUndefined();
    });

    it('should preserve recent cache entries during cleanup', async () => {
      const country = 'TestCountry';
      await engine.calculate(country);

      engine.cleanupOldCache(90);
      expect(engine.getBaselineMetadata(country)).toBeDefined();
    });
  });
});