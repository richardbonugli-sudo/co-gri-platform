/**
 * Forecast Guardrail Validation Tests
 * Week 1 - Task 1a: Ensure forecast never redistributes exposures or creates new country exposures
 * 
 * Critical Guardrails:
 * 1. Forecast never redistributes exposures (exposure weights unchanged)
 * 2. Forecast never creates new country exposures
 * 3. Relevance filtering: >5% exposure threshold, |ΔCO-GRI| > 2
 * 4. Only apply deltas to existing exposure countries
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock data structures
interface CompanyExposure {
  company_id: string;
  ticker: string;
  home_country: string;
  sector: string;
  exposures: {
    [country: string]: {
      W_R: number;  // Revenue exposure [0,1]
      W_S: number;  // Supply chain exposure [0,1]
      W_P: number;  // Physical assets exposure [0,1]
      W_F: number;  // Financial exposure [0,1]
    };
  };
  M_sector: number;
}

interface ForecastEvent {
  event_name: string;
  probability: number;
  timing: string;
  expected_delta_CO_GRI: number;
  delta_by_channel: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  top_country_nodes: string[];
}

/**
 * GUARDRAIL 1: Forecast never redistributes exposures
 * Implementation: Check company.exposures[country] exists before applying delta
 */
function applyForecastToCompany(
  company: CompanyExposure,
  forecastEvent: ForecastEvent
): { delta_CO_GRI: number; exposures_before: any; exposures_after: any } {
  const exposures_before = JSON.parse(JSON.stringify(company.exposures));
  let delta_CO_GRI = 0;

  for (const country of forecastEvent.top_country_nodes) {
    // GUARDRAIL: ONLY apply if company already has exposure to this country
    if (!company.exposures[country]) continue;

    const existingExposure = company.exposures[country];

    // Apply forecast delta to existing shock intensity
    // DO NOT change exposure weights
    const forecastDelta = forecastEvent.delta_by_channel;

    delta_CO_GRI += (
      existingExposure.W_R * forecastDelta.revenue +
      existingExposure.W_S * forecastDelta.supply_chain +
      existingExposure.W_P * forecastDelta.physical_assets +
      existingExposure.W_F * forecastDelta.financial
    );
  }

  const exposures_after = JSON.parse(JSON.stringify(company.exposures));

  return { delta_CO_GRI, exposures_before, exposures_after };
}

/**
 * GUARDRAIL 2: Relevance filtering
 * Implementation: Filter events by exposure threshold (>5%) and impact threshold (|ΔCO-GRI| > 2)
 */
function filterRelevantForecastEvents(
  company: CompanyExposure,
  allForecastEvents: ForecastEvent[]
): ForecastEvent[] {
  return allForecastEvents.filter(event => {
    // Relevance criteria:
    // 1. Event affects countries where company has exposure
    const affectedCountries = event.top_country_nodes;
    const hasExposure = affectedCountries.some(country => {
      const exposure = company.exposures[country];
      if (!exposure) return false;
      
      // Check if any channel has >5% exposure
      return Object.values(exposure).some(w => w > 0.05);
    });

    // 2. Expected ΔCO-GRI > threshold (±2)
    const significantImpact = Math.abs(event.expected_delta_CO_GRI) > 2;

    return hasExposure && significantImpact;
  });
}

describe('Forecast Guardrail Validation Tests', () => {
  let mockCompany: CompanyExposure;
  let mockForecastEvents: ForecastEvent[];

  beforeEach(() => {
    // Mock company with exposures in China, Taiwan, Vietnam
    mockCompany = {
      company_id: 'AAPL',
      ticker: 'AAPL',
      home_country: 'US',
      sector: 'Technology',
      exposures: {
        'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
        'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 },
        'Vietnam': { W_R: 0.03, W_S: 0.15, W_P: 0.01, W_F: 0.00 }
      },
      M_sector: 1.2
    };

    mockForecastEvents = [
      {
        event_name: 'US-China Trade Escalation',
        probability: 0.7,
        timing: 'Q2 2026',
        expected_delta_CO_GRI: 8.5,
        delta_by_channel: {
          revenue: 5.0,
          supply_chain: 12.0,
          physical_assets: 2.0,
          financial: 1.0
        },
        top_country_nodes: ['China', 'Taiwan']
      },
      {
        event_name: 'India Tech Growth',
        probability: 0.6,
        timing: 'Q3 2026',
        expected_delta_CO_GRI: -3.2,
        delta_by_channel: {
          revenue: -2.0,
          supply_chain: -4.0,
          physical_assets: -1.0,
          financial: -0.5
        },
        top_country_nodes: ['India']  // Company has NO exposure to India
      },
      {
        event_name: 'Minor Policy Change',
        probability: 0.8,
        timing: 'Q1 2026',
        expected_delta_CO_GRI: 1.5,  // Below threshold
        delta_by_channel: {
          revenue: 1.0,
          supply_chain: 1.5,
          physical_assets: 0.5,
          financial: 0.2
        },
        top_country_nodes: ['China']
      }
    ];
  });

  describe('GUARDRAIL 1: Exposure Weight Preservation', () => {
    it('should NOT modify exposure weights when applying forecast', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvents[0]);

      // Verify exposure weights are EXACTLY the same
      expect(result.exposures_after).toEqual(result.exposures_before);
      
      // Verify each country's exposure weights unchanged
      Object.keys(mockCompany.exposures).forEach(country => {
        expect(result.exposures_after[country]).toEqual(result.exposures_before[country]);
      });
    });

    it('should preserve exposure weights for all channels', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvents[0]);

      // Check each channel for each country
      Object.entries(mockCompany.exposures).forEach(([country, exposure]) => {
        expect(result.exposures_after[country].W_R).toBe(exposure.W_R);
        expect(result.exposures_after[country].W_S).toBe(exposure.W_S);
        expect(result.exposures_after[country].W_P).toBe(exposure.W_P);
        expect(result.exposures_after[country].W_F).toBe(exposure.W_F);
      });
    });

    it('should maintain exposure weight sum across all countries', () => {
      const sumBefore = Object.values(mockCompany.exposures).reduce((sum, exp) => {
        return sum + exp.W_R + exp.W_S + exp.W_P + exp.W_F;
      }, 0);

      applyForecastToCompany(mockCompany, mockForecastEvents[0]);

      const sumAfter = Object.values(mockCompany.exposures).reduce((sum, exp) => {
        return sum + exp.W_R + exp.W_S + exp.W_P + exp.W_F;
      }, 0);

      expect(sumAfter).toBeCloseTo(sumBefore, 10);
    });
  });

  describe('GUARDRAIL 2: No New Country Exposures', () => {
    it('should NOT create new country exposures', () => {
      const countriesBefore = Object.keys(mockCompany.exposures);
      
      applyForecastToCompany(mockCompany, mockForecastEvents[0]);
      
      const countriesAfter = Object.keys(mockCompany.exposures);

      expect(countriesAfter).toEqual(countriesBefore);
      expect(countriesAfter.length).toBe(countriesBefore.length);
    });

    it('should ignore forecast events for countries with no existing exposure', () => {
      // Event affects India, but company has no India exposure
      const result = applyForecastToCompany(mockCompany, mockForecastEvents[1]);

      // Should have zero delta since company has no India exposure
      expect(result.delta_CO_GRI).toBe(0);

      // Exposure map should be unchanged
      expect(Object.keys(mockCompany.exposures)).not.toContain('India');
    });

    it('should only apply deltas to existing exposure countries', () => {
      const event: ForecastEvent = {
        event_name: 'Mixed Event',
        probability: 0.7,
        timing: 'Q2 2026',
        expected_delta_CO_GRI: 5.0,
        delta_by_channel: {
          revenue: 3.0,
          supply_chain: 5.0,
          physical_assets: 1.0,
          financial: 0.5
        },
        top_country_nodes: ['China', 'India', 'Brazil']  // Only China exists in exposures
      };

      const result = applyForecastToCompany(mockCompany, event);

      // Delta should only come from China (existing exposure)
      expect(result.delta_CO_GRI).toBeGreaterThan(0);
      
      // Should not have added India or Brazil
      expect(Object.keys(mockCompany.exposures)).not.toContain('India');
      expect(Object.keys(mockCompany.exposures)).not.toContain('Brazil');
    });
  });

  describe('GUARDRAIL 3: Relevance Filtering', () => {
    it('should filter events by exposure threshold (>5%)', () => {
      const filtered = filterRelevantForecastEvents(mockCompany, mockForecastEvents);

      // Event 1: Affects China (has >5% exposure) - SHOULD be included
      // Event 2: Affects India (no exposure) - SHOULD be filtered out
      // Event 3: Affects China but delta < 2 - SHOULD be filtered out

      expect(filtered.length).toBe(1);
      expect(filtered[0].event_name).toBe('US-China Trade Escalation');
    });

    it('should filter events by impact threshold (|ΔCO-GRI| > 2)', () => {
      const filtered = filterRelevantForecastEvents(mockCompany, mockForecastEvents);

      // Only events with |ΔCO-GRI| > 2 should pass
      filtered.forEach(event => {
        expect(Math.abs(event.expected_delta_CO_GRI)).toBeGreaterThan(2);
      });
    });

    it('should require BOTH exposure and impact thresholds', () => {
      const testEvents: ForecastEvent[] = [
        {
          event_name: 'High Impact, No Exposure',
          probability: 0.7,
          timing: 'Q2 2026',
          expected_delta_CO_GRI: 10.0,  // High impact
          delta_by_channel: { revenue: 5, supply_chain: 8, physical_assets: 2, financial: 1 },
          top_country_nodes: ['India']  // No exposure
        },
        {
          event_name: 'Low Impact, Has Exposure',
          probability: 0.8,
          timing: 'Q2 2026',
          expected_delta_CO_GRI: 1.0,  // Low impact
          delta_by_channel: { revenue: 0.5, supply_chain: 1, physical_assets: 0.3, financial: 0.1 },
          top_country_nodes: ['China']  // Has exposure
        },
        {
          event_name: 'High Impact, Has Exposure',
          probability: 0.75,
          timing: 'Q2 2026',
          expected_delta_CO_GRI: 8.0,  // High impact
          delta_by_channel: { revenue: 4, supply_chain: 10, physical_assets: 2, financial: 1 },
          top_country_nodes: ['China']  // Has exposure
        }
      ];

      const filtered = filterRelevantForecastEvents(mockCompany, testEvents);

      // Only the last event should pass both filters
      expect(filtered.length).toBe(1);
      expect(filtered[0].event_name).toBe('High Impact, Has Exposure');
    });

    it('should check all channels for exposure threshold', () => {
      const companyLowExposure: CompanyExposure = {
        ...mockCompany,
        exposures: {
          'China': { W_R: 0.02, W_S: 0.03, W_P: 0.01, W_F: 0.01 }  // All below 5%
        }
      };

      const event: ForecastEvent = {
        event_name: 'Test Event',
        probability: 0.7,
        timing: 'Q2 2026',
        expected_delta_CO_GRI: 5.0,
        delta_by_channel: { revenue: 3, supply_chain: 5, physical_assets: 1, financial: 0.5 },
        top_country_nodes: ['China']
      };

      const filtered = filterRelevantForecastEvents(companyLowExposure, [event]);

      // Should be filtered out since no channel has >5% exposure
      expect(filtered.length).toBe(0);
    });
  });

  describe('GUARDRAIL 4: Delta Application Correctness', () => {
    it('should calculate delta only from existing exposures', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvents[0]);

      // Manual calculation for China and Taiwan
      const chinaExposure = mockCompany.exposures['China'];
      const taiwanExposure = mockCompany.exposures['Taiwan'];
      const delta = mockForecastEvents[0].delta_by_channel;

      const expectedDelta = (
        chinaExposure.W_R * delta.revenue +
        chinaExposure.W_S * delta.supply_chain +
        chinaExposure.W_P * delta.physical_assets +
        chinaExposure.W_F * delta.financial +
        taiwanExposure.W_R * delta.revenue +
        taiwanExposure.W_S * delta.supply_chain +
        taiwanExposure.W_P * delta.physical_assets +
        taiwanExposure.W_F * delta.financial
      );

      expect(result.delta_CO_GRI).toBeCloseTo(expectedDelta, 5);
    });

    it('should return zero delta when no countries match', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvents[1]);

      // Event affects India, company has no India exposure
      expect(result.delta_CO_GRI).toBe(0);
    });

    it('should handle negative deltas correctly', () => {
      const negativeEvent: ForecastEvent = {
        event_name: 'Positive Development',
        probability: 0.6,
        timing: 'Q3 2026',
        expected_delta_CO_GRI: -5.0,
        delta_by_channel: {
          revenue: -3.0,
          supply_chain: -6.0,
          physical_assets: -1.0,
          financial: -0.5
        },
        top_country_nodes: ['China']
      };

      const result = applyForecastToCompany(mockCompany, negativeEvent);

      // Delta should be negative
      expect(result.delta_CO_GRI).toBeLessThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty forecast events array', () => {
      const filtered = filterRelevantForecastEvents(mockCompany, []);
      expect(filtered).toEqual([]);
    });

    it('should handle company with no exposures', () => {
      const emptyCompany: CompanyExposure = {
        ...mockCompany,
        exposures: {}
      };

      const filtered = filterRelevantForecastEvents(emptyCompany, mockForecastEvents);
      expect(filtered.length).toBe(0);
    });

    it('should handle forecast event with empty country nodes', () => {
      const emptyNodeEvent: ForecastEvent = {
        event_name: 'Empty Event',
        probability: 0.7,
        timing: 'Q2 2026',
        expected_delta_CO_GRI: 5.0,
        delta_by_channel: { revenue: 3, supply_chain: 5, physical_assets: 1, financial: 0.5 },
        top_country_nodes: []
      };

      const result = applyForecastToCompany(mockCompany, emptyNodeEvent);
      expect(result.delta_CO_GRI).toBe(0);
    });

    it('should handle zero exposure weights', () => {
      const zeroExposureCompany: CompanyExposure = {
        ...mockCompany,
        exposures: {
          'China': { W_R: 0, W_S: 0, W_P: 0, W_F: 0 }
        }
      };

      const result = applyForecastToCompany(zeroExposureCompany, mockForecastEvents[0]);
      expect(result.delta_CO_GRI).toBe(0);
    });
  });
});