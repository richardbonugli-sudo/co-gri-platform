/**
 * Scenario Mode Integration Tests
 * Part of CO-GRI Platform Phase 3 - Week 9-10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generatePresetScenarios,
  generateScenarioResults,
  type PresetScenario
} from '@/services/mockData/scenarioDataGenerator';
import type { ShockConfig } from '@/types/scenario';

describe('Scenario Mode - Week 9-10 Integration Tests', () => {
  let presetScenarios: PresetScenario[];

  beforeEach(() => {
    presetScenarios = generatePresetScenarios();
  });

  // ============================================================================
  // PRESET SCENARIOS TESTS
  // ============================================================================

  describe('Preset Scenarios', () => {
    it('should generate preset scenarios', () => {
      expect(presetScenarios.length).toBeGreaterThan(0);
      
      presetScenarios.forEach(scenario => {
        expect(scenario.id).toBeTruthy();
        expect(scenario.name).toBeTruthy();
        expect(scenario.type).toBeTruthy();
        expect(scenario.description).toBeTruthy();
        expect(scenario.initial_shock).toBeDefined();
        expect(scenario.propagation_settings).toBeDefined();
      });
    });

    it('should have valid scenario types', () => {
      const validTypes = ['Geopolitical', 'Economic', 'Climate', 'Pandemic', 'Cyber'];
      
      presetScenarios.forEach(scenario => {
        expect(validTypes).toContain(scenario.type);
      });
    });

    it('should have valid initial shock configuration', () => {
      presetScenarios.forEach(scenario => {
        const shock = scenario.initial_shock;
        
        expect(shock.epicenter_countries.length).toBeGreaterThan(0);
        expect(shock.shock_intensity).toBeGreaterThan(0);
        expect(shock.shock_intensity).toBeLessThanOrEqual(100);
        expect(shock.affected_channels).toBeDefined();
        expect(Object.keys(shock.affected_channels).length).toBeGreaterThan(0);
      });
    });

    it('should have valid propagation settings', () => {
      presetScenarios.forEach(scenario => {
        const settings = scenario.propagation_settings;
        
        expect(settings.time_horizon).toBeGreaterThan(0);
        expect(settings.decay_rate).toBeGreaterThan(0);
        expect(settings.decay_rate).toBeLessThanOrEqual(1);
        expect(settings.contagion_factor).toBeGreaterThan(0);
        expect(settings.contagion_factor).toBeLessThanOrEqual(2);
      });
    });
  });

  // ============================================================================
  // SCENARIO RESULTS GENERATION TESTS
  // ============================================================================

  describe('Scenario Results Generation', () => {
    it('should generate scenario results', () => {
      const scenario = presetScenarios[0];
      const results = generateScenarioResults(scenario);
      
      expect(results.scenario_id).toBe(scenario.id);
      expect(results.scenario_name).toBe(scenario.name);
      expect(results.execution_timestamp).toBeDefined();
      expect(results.global_impact).toBeDefined();
      expect(results.country_impacts.length).toBeGreaterThan(0);
      expect(results.company_impacts.length).toBeGreaterThan(0);
      expect(results.propagation_timeline.length).toBeGreaterThan(0);
    });

    it('should have valid global impact metrics', () => {
      const scenario = presetScenarios[0];
      const results = generateScenarioResults(scenario);
      const globalImpact = results.global_impact;
      
      expect(globalImpact.avg_delta_CO_GRI).toBeDefined();
      expect(globalImpact.max_delta_CO_GRI).toBeGreaterThanOrEqual(globalImpact.avg_delta_CO_GRI);
      expect(globalImpact.affected_countries_count).toBeGreaterThan(0);
      expect(globalImpact.affected_companies_count).toBeGreaterThan(0);
      expect(globalImpact.total_economic_impact_usd).toBeGreaterThan(0);
    });

    it('should have valid country impacts', () => {
      const scenario = presetScenarios[0];
      const results = generateScenarioResults(scenario);
      
      results.country_impacts.forEach(impact => {
        expect(impact.country).toBeTruthy();
        expect(impact.baseline_CO_GRI).toBeGreaterThan(0);
        expect(impact.scenario_CO_GRI).toBeGreaterThan(0);
        expect(impact.delta_CO_GRI).toBeDefined();
        expect(['Direct', 'First-Order', 'Second-Order', 'Third-Order']).toContain(impact.impact_type);
        expect(impact.channel_breakdown).toBeDefined();
      });
    });

    it('should have valid company impacts', () => {
      const scenario = presetScenarios[0];
      const results = generateScenarioResults(scenario);
      
      results.company_impacts.forEach(impact => {
        expect(impact.ticker).toBeTruthy();
        expect(impact.company_name).toBeTruthy();
        expect(impact.baseline_CO_GRI).toBeGreaterThan(0);
        expect(impact.scenario_CO_GRI).toBeGreaterThan(0);
        expect(impact.delta_CO_GRI).toBeDefined();
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(impact.severity);
      });
    });

    it('should have valid propagation timeline', () => {
      const scenario = presetScenarios[0];
      const results = generateScenarioResults(scenario);
      
      expect(results.propagation_timeline.length).toBeGreaterThan(0);
      
      results.propagation_timeline.forEach(wave => {
        expect(wave.wave_number).toBeGreaterThan(0);
        expect(wave.time_period).toBeTruthy();
        expect(wave.affected_countries.length).toBeGreaterThan(0);
        expect(wave.avg_delta_CO_GRI).toBeDefined();
        expect(wave.cumulative_impact).toBeDefined();
      });
    });
  });

  // ============================================================================
  // SCENARIO COMPARISON TESTS
  // ============================================================================

  describe('Scenario Comparison', () => {
    it('should compare multiple scenarios', () => {
      const results1 = generateScenarioResults(presetScenarios[0]);
      const results2 = generateScenarioResults(presetScenarios[1]);
      
      expect(results1.scenario_id).not.toBe(results2.scenario_id);
      expect(results1.global_impact).toBeDefined();
      expect(results2.global_impact).toBeDefined();
    });

    it('should identify most severe scenario', () => {
      const allResults = presetScenarios.map(s => generateScenarioResults(s));
      
      const mostSevere = allResults.reduce((max, current) => 
        Math.abs(current.global_impact.avg_delta_CO_GRI) > Math.abs(max.global_impact.avg_delta_CO_GRI)
          ? current
          : max
      );
      
      expect(mostSevere).toBeDefined();
      expect(mostSevere.global_impact.avg_delta_CO_GRI).toBeDefined();
    });
  });

  // ============================================================================
  // END-TO-END INTEGRATION
  // ============================================================================

  describe('End-to-End Integration', () => {
    it('should complete full scenario analysis workflow', () => {
      // Step 1: Select preset scenario
      const scenario = presetScenarios[0];
      expect(scenario).toBeDefined();
      
      // Step 2: Generate scenario results
      const results = generateScenarioResults(scenario);
      expect(results).toBeDefined();
      
      // Step 3: Verify global impact
      expect(results.global_impact.avg_delta_CO_GRI).toBeDefined();
      
      // Step 4: Verify country impacts
      expect(results.country_impacts.length).toBeGreaterThan(0);
      
      // Step 5: Verify company impacts
      expect(results.company_impacts.length).toBeGreaterThan(0);
      
      // Step 6: Verify propagation timeline
      expect(results.propagation_timeline.length).toBeGreaterThan(0);
    });
  });
});