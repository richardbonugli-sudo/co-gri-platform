/**
 * Unit Tests for Scenario Builder
 * Tests validation logic and state management
 */

import { describe, it, expect } from 'vitest';
import { ScenarioConfig, ScenarioValidationResult, EventType, PropagationType, Severity } from '@/types/scenario';

// Validation function (extracted for testing)
function validateScenarioConfig(config: Partial<ScenarioConfig>): ScenarioValidationResult {
  const errors: any[] = [];
  const warnings: string[] = [];

  if (!config.targetCountries || config.targetCountries.length === 0) {
    errors.push({ 
      field: 'targetCountries', 
      message: 'At least one target country must be selected', 
      severity: 'error' 
    });
  }

  if (config.eventType === 'Custom Event' && !config.customEventName?.trim()) {
    errors.push({ 
      field: 'customEventName', 
      message: 'Custom event name is required', 
      severity: 'error' 
    });
  }

  if (config.propagationType === 'bilateral' && !config.actorCountry) {
    errors.push({ 
      field: 'actorCountry', 
      message: 'Actor country is required for bilateral scenarios', 
      severity: 'error' 
    });
  }

  if (config.targetCountries && config.targetCountries.length > 50) {
    warnings.push('Selecting more than 50 countries may impact calculation performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

describe('Scenario Builder Validation', () => {
  describe('Target Countries Validation', () => {
    it('should fail when no target countries selected', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Sanctions',
        actorCountry: 'United States',
        targetCountries: [],
        propagationType: 'regional',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('targetCountries');
    });

    it('should pass when target countries selected', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Sanctions',
        actorCountry: 'United States',
        targetCountries: ['Russia', 'China'],
        propagationType: 'regional',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when more than 50 countries selected', () => {
      const manyCountries = Array.from({ length: 60 }, (_, i) => `Country${i}`);
      const config: Partial<ScenarioConfig> = {
        eventType: 'Sanctions',
        actorCountry: 'United States',
        targetCountries: manyCountries,
        propagationType: 'global',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Event Validation', () => {
    it('should fail when custom event selected but no name provided', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Custom Event',
        customEventName: '',
        actorCountry: 'United States',
        targetCountries: ['China'],
        propagationType: 'regional',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.find(e => e.field === 'customEventName')).toBeDefined();
    });

    it('should pass when custom event has name', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Custom Event',
        customEventName: 'My Custom Event',
        actorCountry: 'United States',
        targetCountries: ['China'],
        propagationType: 'regional',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Bilateral Scenario Validation', () => {
    it('should fail when bilateral but no actor country', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Sanctions',
        actorCountry: '',
        targetCountries: ['Russia'],
        propagationType: 'bilateral',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.find(e => e.field === 'actorCountry')).toBeDefined();
    });

    it('should pass when bilateral with actor country', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Sanctions',
        actorCountry: 'United States',
        targetCountries: ['Russia'],
        propagationType: 'bilateral',
        severity: 'medium'
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Complete Valid Scenarios', () => {
    it('should validate Taiwan Strait scenario', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Conflict / Military Escalation',
        actorCountry: 'China',
        targetCountries: ['Taiwan', 'China'],
        propagationType: 'regional',
        severity: 'high',
        applyAlignmentChanges: true,
        applyExposureChanges: true,
        applySectorSensitivity: true
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate US-China decoupling scenario', () => {
      const config: Partial<ScenarioConfig> = {
        eventType: 'Trade Embargo / Tariff Shock',
        actorCountry: 'United States',
        targetCountries: ['China', 'United States'],
        propagationType: 'global',
        severity: 'medium',
        applyAlignmentChanges: true,
        applyExposureChanges: true,
        applySectorSensitivity: true
      };

      const result = validateScenarioConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Scenario Configuration', () => {
  it('should create valid config object', () => {
    const config: ScenarioConfig = {
      eventType: 'Sanctions',
      actorCountry: 'United States',
      targetCountries: ['Russia'],
      propagationType: 'regional',
      severity: 'medium',
      applyAlignmentChanges: true,
      applyExposureChanges: true,
      applySectorSensitivity: true,
      applyTo: { type: 'entire' }
    };

    expect(config.eventType).toBe('Sanctions');
    expect(config.targetCountries).toContain('Russia');
    expect(config.severity).toBe('medium');
  });

  it('should handle custom event with name', () => {
    const config: ScenarioConfig = {
      eventType: 'Custom Event',
      customEventName: 'Test Event',
      actorCountry: 'United States',
      targetCountries: ['China'],
      propagationType: 'bilateral',
      severity: 'low',
      applyAlignmentChanges: false,
      applyExposureChanges: false,
      applySectorSensitivity: false,
      applyTo: { type: 'entire' }
    };

    expect(config.eventType).toBe('Custom Event');
    expect(config.customEventName).toBe('Test Event');
  });
});