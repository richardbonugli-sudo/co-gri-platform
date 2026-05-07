/**
 * Unit tests for Guardrails Validation Logic
 */

import { describe, test, expect } from 'vitest';
import {
  validateNoNewExposure,
  validateAdditiveDelta,
  validateExistingExposureOnly,
  validateExpectedPath,
  validateNoDensePropagation,
  validateClearLabeling
} from '../guardrails';
import { CEDAROWL_FORECAST_2026 } from '@/data/cedarOwlForecast2026';

describe('Guardrails Validation', () => {
  describe('Guardrail 1: No New Exposure Inference', () => {
    test('passes when no new exposures added', () => {
      const original = [
        { countryCode: 'US', baseCsi: 45.2 },
        { countryCode: 'CN', baseCsi: 52.1 }
      ];
      const adjusted = [
        { countryCode: 'US', baseCsi: 44.0 },
        { countryCode: 'CN', baseCsi: 54.9 }
      ];

      const result = validateNoNewExposure(original, adjusted);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails when new exposures added', () => {
      const original = [
        { countryCode: 'US', baseCsi: 45.2 }
      ];
      const adjusted = [
        { countryCode: 'US', baseCsi: 44.0 },
        { countryCode: 'CN', baseCsi: 54.9 }
      ];

      const result = validateNoNewExposure(original, adjusted);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('CN');
    });

    test('warns when exposures removed', () => {
      const original = [
        { countryCode: 'US', baseCsi: 45.2 },
        { countryCode: 'CN', baseCsi: 52.1 }
      ];
      const adjusted = [
        { countryCode: 'US', baseCsi: 44.0 }
      ];

      const result = validateNoNewExposure(original, adjusted);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CN');
    });
  });

  describe('Guardrail 2: Additive CSI Deltas Only', () => {
    test('passes for correct additive adjustment', () => {
      const result = validateAdditiveDelta(45.2, -1.2, 44.0);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails for non-additive adjustment', () => {
      const result = validateAdditiveDelta(45.2, -1.2, 40.0);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('handles floating-point precision', () => {
      const result = validateAdditiveDelta(45.2, -1.2, 44.0001);
      expect(result.valid).toBe(true);
    });

    test('warns for unusually large deltas', () => {
      const result = validateAdditiveDelta(50.0, 15.0, 65.0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Guardrail 3: Existing Exposure Only', () => {
    test('passes for valid exposures', () => {
      const exposures = [
        { countryCode: 'US', baseCsi: 45.2 },
        { countryCode: 'CN', baseCsi: 52.1 }
      ];

      const result = validateExistingExposureOnly(exposures);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails for invalid country codes', () => {
      const exposures = [
        { countryCode: 'USA', baseCsi: 45.2 },
        { countryCode: 'CHINA', baseCsi: 52.1 }
      ];

      const result = validateExistingExposureOnly(exposures);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('fails for missing CSI values', () => {
      const exposures = [
        { countryCode: 'US', baseCsi: NaN },
        { countryCode: 'CN', baseCsi: 52.1 }
      ];

      const result = validateExistingExposureOnly(exposures);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Guardrail 4: Expected Path, Not Stress', () => {
    test('passes for CedarOwl 2026 forecast', () => {
      const result = validateExpectedPath(CEDAROWL_FORECAST_2026);
      expect(result.valid).toBe(true);
    });

    test('warns for low confidence forecast', () => {
      const lowConfidenceForecast = {
        ...CEDAROWL_FORECAST_2026,
        metadata: {
          ...CEDAROWL_FORECAST_2026.metadata,
          overallConfidence: 0.3
        }
      };

      const result = validateExpectedPath(lowConfidenceForecast);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Guardrail 5: No Dense Propagation', () => {
    test('passes for sparse adjustments', () => {
      const adjustments = Object.values(CEDAROWL_FORECAST_2026.countryAdjustments);
      const result = validateNoDensePropagation(adjustments);
      expect(result.valid).toBe(true);
    });

    test('warns for uniform adjustments', () => {
      const uniformAdjustments = Array(50).fill({
        delta: 2.0,
        drivers: ['Test'],
        outlook: 'NEUTRAL',
        expectedReturn: 0.05,
        riskTrend: 'STABLE'
      });

      const result = validateNoDensePropagation(uniformAdjustments);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('handles empty adjustments', () => {
      const result = validateNoDensePropagation([]);
      expect(result.valid).toBe(true);
    });
  });

  describe('Guardrail 6: Clear Labeling', () => {
    test('passes for correctly labeled output', () => {
      const output = {
        mode: 'forecast-baseline',
        forecastYear: '2026',
        adjustedExposures: []
      };

      const result = validateClearLabeling(output);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails for missing mode label', () => {
      const output = {
        forecastYear: '2026',
        adjustedExposures: []
      };

      const result = validateClearLabeling(output);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('fails for incorrect mode label', () => {
      const output = {
        mode: 'event-driven',
        forecastYear: '2026',
        adjustedExposures: []
      };

      const result = validateClearLabeling(output);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('warns for missing forecast year', () => {
      const output = {
        mode: 'forecast-baseline',
        adjustedExposures: []
      };

      const result = validateClearLabeling(output);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
