/**
 * Unit Tests for Scenario Engine
 * 
 * Comprehensive test suite covering:
 * - Scenario creation and validation
 * - Impact calculations
 * - Multi-scenario analysis
 * - Edge cases and error handling
 * 
 * Part of CO-GRI Platform Week 8 Implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { scenarioEngineService } from '../ScenarioEngine';
import type { ScenarioParameters, CompanyExposure } from '../ScenarioEngine';

describe('ScenarioEngine', () => {
  // Mock company data for testing
  const mockCompany: CompanyExposure = {
    ticker: 'TEST',
    name: 'Test Company',
    sector: 'Technology',
    home_country: 'United States',
    cogri_score: 45.0,
    segments: [
      { country: 'United States', exposureWeight: 0.4, countryRisk: 25.0 },
      { country: 'China', exposureWeight: 0.3, countryRisk: 65.0 },
      { country: 'Germany', exposureWeight: 0.2, countryRisk: 30.0 },
      { country: 'Japan', exposureWeight: 0.1, countryRisk: 35.0 }
    ],
    channel_breakdown: {
      revenue: 0.4,
      supply_chain: 0.35,
      physical_assets: 0.15,
      financial: 0.1
    }
  };

  beforeEach(() => {
    // Clear any existing scenarios before each test
    const allScenarios = scenarioEngineService.getAllScenarios();
    allScenarios.forEach(s => scenarioEngineService.deleteScenario(s.scenario_id));
  });

  describe('Scenario Creation', () => {
    it('should create scenario with valid parameters', () => {
      const params: ScenarioParameters = {
        name: 'US-China Trade War',
        description: 'Escalating trade tensions between US and China',
        event_type: 'Trade',
        severity: 'High',
        probability: 0.7,
        duration_months: 12,
        affected_countries: ['United States', 'China'],
        affected_channels: ['Revenue', 'Supply']
      };

      const scenario = scenarioEngineService.createScenario(params);

      expect(scenario.scenario_id).toBeDefined();
      expect(scenario.scenario_id).toMatch(/^scenario_/);
      expect(scenario.name).toBe('US-China Trade War');
      expect(scenario.event_type).toBe('Trade');
      expect(scenario.severity).toBe('High');
      expect(scenario.probability).toBe(0.7);
      expect(scenario.duration_months).toBe(12);
      expect(scenario.affected_countries).toEqual(['United States', 'China']);
      expect(scenario.affected_channels).toEqual(['Revenue', 'Supply']);
      expect(scenario.is_active).toBe(true);
      expect(scenario.created_date).toBeDefined();
    });

    it('should create scenario with optional tags', () => {
      const params: ScenarioParameters = {
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue'],
        tags: ['trade', 'high-priority']
      };

      const scenario = scenarioEngineService.createScenario(params);

      expect(scenario.tags).toEqual(['trade', 'high-priority']);
    });

    it('should throw error for invalid scenario name', () => {
      const params: ScenarioParameters = {
        name: '', // Empty name
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      };

      expect(() => scenarioEngineService.createScenario(params)).toThrow();
    });

    it('should throw error for invalid probability', () => {
      const params: ScenarioParameters = {
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.5, // Invalid: > 1
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      };

      expect(() => scenarioEngineService.createScenario(params)).toThrow();
    });

    it('should throw error for invalid duration', () => {
      const params: ScenarioParameters = {
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 0, // Invalid: must be >= 1
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      };

      expect(() => scenarioEngineService.createScenario(params)).toThrow();
    });

    it('should throw error for empty affected countries', () => {
      const params: ScenarioParameters = {
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: [], // Empty
        affected_channels: ['Revenue']
      };

      expect(() => scenarioEngineService.createScenario(params)).toThrow();
    });

    it('should throw error for empty affected channels', () => {
      const params: ScenarioParameters = {
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: [] // Empty
      };

      expect(() => scenarioEngineService.createScenario(params)).toThrow();
    });
  });

  describe('Scenario Validation', () => {
    it('should validate correct scenario', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Valid Scenario',
        description: 'Valid description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const validation = scenarioEngineService.validateScenario(scenario);

      expect(validation.is_valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid probability', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      // Manually set invalid probability
      scenario.probability = 1.5;

      const validation = scenarioEngineService.validateScenario(scenario);

      expect(validation.is_valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('probability'))).toBe(true);
    });

    it('should warn about extreme severity', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Critical Scenario',
        description: 'Very severe scenario',
        event_type: 'Military',
        severity: 'Critical',
        probability: 0.9,
        duration_months: 24,
        affected_countries: ['United States', 'China', 'Russia'],
        affected_channels: ['Revenue', 'Supply', 'Assets', 'Financial']
      });

      const validation = scenarioEngineService.validateScenario(scenario);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Severity Multipliers', () => {
    it('should apply Low severity multiplier (1.0x)', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Low Severity',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Low',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      // Low severity should have minimal impact
      expect(result.delta_CO_GRI).toBeGreaterThan(0);
      expect(result.delta_CO_GRI).toBeLessThan(5);
    });

    it('should apply Medium severity multiplier (2.5x)', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Medium Severity',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.delta_CO_GRI).toBeGreaterThan(0);
    });

    it('should apply High severity multiplier (5.0x)', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'High Severity',
        description: 'Test',
        event_type: 'Trade',
        severity: 'High',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.delta_CO_GRI).toBeGreaterThan(0);
    });

    it('should apply Critical severity multiplier (10.0x)', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Critical Severity',
        description: 'Test',
        event_type: 'Military',
        severity: 'Critical',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      // Critical severity should have significant impact
      expect(result.delta_CO_GRI).toBeGreaterThan(10);
    });

    it('should scale impact with severity', () => {
      const lowScenario = scenarioEngineService.createScenario({
        name: 'Low',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Low',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const highScenario = scenarioEngineService.createScenario({
        name: 'High',
        description: 'Test',
        event_type: 'Trade',
        severity: 'High',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const lowResult = scenarioEngineService.applyScenario(mockCompany, lowScenario);
      const highResult = scenarioEngineService.applyScenario(mockCompany, highScenario);

      // High severity should have significantly larger impact than Low
      expect(highResult.delta_CO_GRI).toBeGreaterThan(lowResult.delta_CO_GRI * 3);
    });
  });

  describe('Impact Calculations', () => {
    it('should calculate ΔCO-GRI correctly', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States', 'China'],
        affected_channels: ['Revenue', 'Supply']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.scenario_id).toBe(scenario.scenario_id);
      expect(result.company_ticker).toBe(mockCompany.ticker);
      expect(result.delta_CO_GRI).toBeDefined();
      expect(result.delta_CO_GRI).toBeGreaterThan(0);
    });

    it('should calculate probability-weighted delta', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.probability_weighted_delta).toBe(result.delta_CO_GRI * 0.5);
    });

    it('should calculate channel impacts', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue', 'Supply']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.channel_impacts).toBeDefined();
      expect(result.channel_impacts.revenue).toBeGreaterThan(0);
      expect(result.channel_impacts.supply_chain).toBeGreaterThan(0);
      expect(result.channel_impacts.physical_assets).toBe(0); // Not affected
      expect(result.channel_impacts.financial).toBe(0); // Not affected
    });

    it('should calculate country impacts', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States', 'China'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.country_impacts).toBeDefined();
      expect(result.country_impacts.length).toBeGreaterThan(0);
      
      const usImpact = result.country_impacts.find(c => c.country === 'United States');
      const chinaImpact = result.country_impacts.find(c => c.country === 'China');
      
      expect(usImpact).toBeDefined();
      expect(chinaImpact).toBeDefined();
      expect(usImpact!.delta_contribution).toBeGreaterThan(0);
      expect(chinaImpact!.delta_contribution).toBeGreaterThan(0);
    });

    it('should generate timeline projection', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 12,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBe(13); // 0 to 12 months
      expect(result.timeline[0].month).toBe(0);
      expect(result.timeline[0].cumulative_delta).toBe(0);
      expect(result.timeline[12].month).toBe(12);
      expect(result.timeline[12].cumulative_delta).toBeCloseTo(result.delta_CO_GRI, 1);
    });

    it('should respect exposure weights in calculations', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States', 'Japan'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      const usImpact = result.country_impacts.find(c => c.country === 'United States');
      const japanImpact = result.country_impacts.find(c => c.country === 'Japan');

      // US has 40% exposure, Japan has 10%
      // US impact should be roughly 4x Japan impact
      expect(usImpact!.delta_contribution).toBeGreaterThan(japanImpact!.delta_contribution * 2);
    });

    it('should only affect specified countries', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      const germanyImpact = result.country_impacts.find(c => c.country === 'Germany');
      
      // Germany should not be affected
      expect(germanyImpact).toBeUndefined();
    });
  });

  describe('Multi-Scenario Analysis', () => {
    it('should compare multiple scenarios', () => {
      const scenario1 = scenarioEngineService.createScenario({
        name: 'Scenario 1',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Low',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const scenario2 = scenarioEngineService.createScenario({
        name: 'Scenario 2',
        description: 'Test',
        event_type: 'Military',
        severity: 'High',
        probability: 0.7,
        duration_months: 12,
        affected_countries: ['China'],
        affected_channels: ['Supply']
      });

      const comparison = scenarioEngineService.compareScenarios(mockCompany, [scenario1, scenario2]);

      expect(comparison.scenarios).toHaveLength(2);
      expect(comparison.best_case_scenario_id).toBeDefined();
      expect(comparison.worst_case_scenario_id).toBeDefined();
      expect(comparison.average_delta).toBeGreaterThan(0);
    });

    it('should rank scenarios by risk', () => {
      const lowRisk = scenarioEngineService.createScenario({
        name: 'Low Risk',
        description: 'Test',
        event_type: 'Policy',
        severity: 'Low',
        probability: 0.3,
        duration_months: 3,
        affected_countries: ['Germany'],
        affected_channels: ['Financial']
      });

      const highRisk = scenarioEngineService.createScenario({
        name: 'High Risk',
        description: 'Test',
        event_type: 'Military',
        severity: 'Critical',
        probability: 0.9,
        duration_months: 24,
        affected_countries: ['United States', 'China'],
        affected_channels: ['Revenue', 'Supply', 'Assets']
      });

      const comparison = scenarioEngineService.compareScenarios(mockCompany, [lowRisk, highRisk]);

      const lowRiskRanking = comparison.scenarios.find(s => s.scenario_id === lowRisk.scenario_id);
      const highRiskRanking = comparison.scenarios.find(s => s.scenario_id === highRisk.scenario_id);

      expect(lowRiskRanking!.risk_rank).toBeGreaterThan(highRiskRanking!.risk_rank);
    });
  });

  describe('Scenario Management', () => {
    it('should retrieve scenario by ID', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const retrieved = scenarioEngineService.getScenario(scenario.scenario_id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.scenario_id).toBe(scenario.scenario_id);
      expect(retrieved!.name).toBe('Test Scenario');
    });

    it('should return null for non-existent scenario', () => {
      const retrieved = scenarioEngineService.getScenario('non_existent_id');

      expect(retrieved).toBeNull();
    });

    it('should get all scenarios', () => {
      scenarioEngineService.createScenario({
        name: 'Scenario 1',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      scenarioEngineService.createScenario({
        name: 'Scenario 2',
        description: 'Test',
        event_type: 'Military',
        severity: 'High',
        probability: 0.7,
        duration_months: 12,
        affected_countries: ['China'],
        affected_channels: ['Supply']
      });

      const allScenarios = scenarioEngineService.getAllScenarios();

      expect(allScenarios.length).toBe(2);
    });

    it('should get active scenarios only', () => {
      const scenario1 = scenarioEngineService.createScenario({
        name: 'Active Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const scenario2 = scenarioEngineService.createScenario({
        name: 'Inactive Scenario',
        description: 'Test',
        event_type: 'Military',
        severity: 'High',
        probability: 0.7,
        duration_months: 12,
        affected_countries: ['China'],
        affected_channels: ['Supply']
      });

      // Deactivate scenario2
      scenarioEngineService.updateScenario(scenario2.scenario_id, { is_active: false });

      const activeScenarios = scenarioEngineService.getActiveScenarios();

      expect(activeScenarios.length).toBe(1);
      expect(activeScenarios[0].scenario_id).toBe(scenario1.scenario_id);
    });

    it('should update scenario', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Original Name',
        description: 'Original description',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const updated = scenarioEngineService.updateScenario(scenario.scenario_id, {
        name: 'Updated Name',
        severity: 'High'
      });

      expect(updated!.name).toBe('Updated Name');
      expect(updated!.severity).toBe('High');
      expect(updated!.description).toBe('Original description'); // Unchanged
    });

    it('should delete scenario', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 0.5,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const deleted = scenarioEngineService.deleteScenario(scenario.scenario_id);

      expect(deleted).toBe(true);
      expect(scenarioEngineService.getScenario(scenario.scenario_id)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero exposure country', () => {
      const companyWithZeroExposure: CompanyExposure = {
        ...mockCompany,
        segments: [
          { country: 'United States', exposureWeight: 1.0, countryRisk: 25.0 }
        ]
      };

      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['China'], // No exposure
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(companyWithZeroExposure, scenario);

      // Should have minimal or zero impact since company has no China exposure
      expect(result.delta_CO_GRI).toBe(0);
    });

    it('should handle extreme probability (0)', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Zero Probability',
        description: 'Test',
        event_type: 'Trade',
        severity: 'Critical',
        probability: 0.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.probability_weighted_delta).toBe(0);
    });

    it('should handle all channels affected', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'All Channels',
        description: 'Test',
        event_type: 'Military',
        severity: 'Critical',
        probability: 1.0,
        duration_months: 12,
        affected_countries: ['United States', 'China'],
        affected_channels: ['Revenue', 'Supply', 'Assets', 'Financial']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.channel_impacts.revenue).toBeGreaterThan(0);
      expect(result.channel_impacts.supply_chain).toBeGreaterThan(0);
      expect(result.channel_impacts.physical_assets).toBeGreaterThan(0);
      expect(result.channel_impacts.financial).toBeGreaterThan(0);
    });

    it('should handle very long duration', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Long Duration',
        description: 'Test',
        event_type: 'Policy',
        severity: 'Medium',
        probability: 1.0,
        duration_months: 60,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      expect(result.timeline.length).toBe(61); // 0 to 60 months
      expect(result.timeline[60].cumulative_delta).toBeCloseTo(result.delta_CO_GRI, 1);
    });
  });

  describe('Guardrails', () => {
    it('should not redistribute exposure weights', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'High',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      // Verify original exposure weights remain unchanged
      expect(mockCompany.segments[0].exposureWeight).toBe(0.4);
      expect(mockCompany.segments[1].exposureWeight).toBe(0.3);
      expect(mockCompany.segments[2].exposureWeight).toBe(0.2);
      expect(mockCompany.segments[3].exposureWeight).toBe(0.1);

      // Sum should still equal 1.0
      const totalWeight = mockCompany.segments.reduce((sum, s) => sum + s.exposureWeight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('should not create new country exposures', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'High',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['Brazil'], // Not in company exposure
        affected_channels: ['Revenue']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      // Brazil should not appear in country impacts since company has no exposure
      const brazilImpact = result.country_impacts.find(c => c.country === 'Brazil');
      expect(brazilImpact).toBeUndefined();
    });

    it('should preserve channel breakdown weights', () => {
      const scenario = scenarioEngineService.createScenario({
        name: 'Test Scenario',
        description: 'Test',
        event_type: 'Trade',
        severity: 'High',
        probability: 1.0,
        duration_months: 6,
        affected_countries: ['United States'],
        affected_channels: ['Revenue', 'Supply']
      });

      const result = scenarioEngineService.applyScenario(mockCompany, scenario);

      // Verify original channel weights remain unchanged
      expect(mockCompany.channel_breakdown.revenue).toBe(0.4);
      expect(mockCompany.channel_breakdown.supply_chain).toBe(0.35);
      expect(mockCompany.channel_breakdown.physical_assets).toBe(0.15);
      expect(mockCompany.channel_breakdown.financial).toBe(0.1);

      // Sum should still equal 1.0
      const totalWeight = Object.values(mockCompany.channel_breakdown).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
  });
});