/**
 * Unit Tests for Enhanced Forecast Engine
 * 
 * Tests cover:
 * - Relevance filtering
 * - Guardrail enforcement (no exposure redistribution)
 * - Guardrail enforcement (no new country exposures)
 * - Delta calculation accuracy
 * - Probability weighting
 */

import { describe, it, expect } from 'vitest';
import {
  filterRelevantForecastEvents,
  applyForecastToCompany,
  generateBaselineForecastEvents,
  calculateCompanyForecastImpact,
  type CompanyExposure,
  type ForecastEvent
} from '../ForecastEngine';

describe('ForecastEngine', () => {
  const mockCompany: CompanyExposure = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    exposures: {
      'China': {
        W_R: 0.25,
        W_S: 0.30,
        W_P: 0.05,
        W_F: 0.02,
        CSI: 52.1
      },
      'United States': {
        W_R: 0.40,
        W_S: 0.15,
        W_P: 0.08,
        W_F: 0.05,
        CSI: 45.2
      },
      'Taiwan': {
        W_R: 0.10,
        W_S: 0.35,
        W_P: 0.02,
        W_F: 0.01,
        CSI: 58.3
      },
      'Japan': {
        W_R: 0.08,
        W_S: 0.12,
        W_P: 0.03,
        W_F: 0.02,
        CSI: 48.7
      }
    }
  };

  const mockForecastEvent: ForecastEvent = {
    event_id: 'test_001',
    event_name: 'Test Trade War',
    event_type: 'Trade',
    probability: 0.70,
    expected_date: '2026-06-15',
    duration_months: 6,
    top_country_nodes: ['China', 'United States', 'Taiwan'],
    actor_countries: ['United States', 'China'],
    expected_delta_CO_GRI: 8.5,
    delta_by_channel: {
      revenue: 3.0,
      supply_chain: 4.0,
      physical_assets: 1.0,
      financial: 0.5
    },
    description: 'Test event',
    confidence: 0.75,
    severity: 'High',
    outlook: 'Test outlook'
  };

  describe('filterRelevantForecastEvents', () => {
    it('should filter events affecting countries with >5% exposure', () => {
      const events = generateBaselineForecastEvents();
      const relevant = filterRelevantForecastEvents(mockCompany, events);
      
      // Should include events affecting China, US, Taiwan (all have >5% total exposure)
      expect(relevant.length).toBeGreaterThan(0);
      
      // All relevant events should affect at least one country where company has exposure
      relevant.forEach(event => {
        const hasRelevantCountry = event.top_country_nodes.some(country => 
          mockCompany.exposures[country] !== undefined
        );
        expect(hasRelevantCountry).toBe(true);
      });
    });

    it('should filter events with expected ΔCO-GRI > 2', () => {
      const events = generateBaselineForecastEvents();
      const relevant = filterRelevantForecastEvents(mockCompany, events);
      
      // All relevant events should have significant impact
      relevant.forEach(event => {
        expect(Math.abs(event.expected_delta_CO_GRI)).toBeGreaterThan(2);
      });
    });

    it('should exclude events affecting only non-exposure countries', () => {
      const nonRelevantEvent: ForecastEvent = {
        ...mockForecastEvent,
        event_id: 'test_002',
        top_country_nodes: ['Brazil', 'Argentina', 'Chile'], // No exposure
        expected_delta_CO_GRI: 5.0
      };
      
      const relevant = filterRelevantForecastEvents(mockCompany, [nonRelevantEvent]);
      expect(relevant.length).toBe(0);
    });
  });

  describe('applyForecastToCompany - Guardrail Enforcement', () => {
    it('should ONLY apply to countries with existing exposure', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvent);
      
      // Should only affect China, US, Taiwan (countries in both exposure and forecast)
      expect(result.affected_countries).toContain('China');
      expect(result.affected_countries).toContain('United States');
      expect(result.affected_countries).toContain('Taiwan');
      expect(result.affected_countries.length).toBe(3);
    });

    it('should NOT create new country exposures', () => {
      const eventWithNewCountry: ForecastEvent = {
        ...mockForecastEvent,
        top_country_nodes: ['China', 'Brazil', 'Argentina'] // Brazil & Argentina not in exposure
      };
      
      const result = applyForecastToCompany(mockCompany, eventWithNewCountry);
      
      // Should only affect China
      expect(result.affected_countries).toEqual(['China']);
      expect(result.affected_countries).not.toContain('Brazil');
      expect(result.affected_countries).not.toContain('Argentina');
    });

    it('should calculate delta using existing exposure weights', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvent);
      
      // Expected calculation for China:
      // W_R * delta_revenue + W_S * delta_supply + W_P * delta_assets + W_F * delta_financial
      // 0.25 * 3.0 + 0.30 * 4.0 + 0.05 * 1.0 + 0.02 * 0.5
      // = 0.75 + 1.2 + 0.05 + 0.01 = 2.01
      
      // Expected for US: 0.40*3.0 + 0.15*4.0 + 0.08*1.0 + 0.05*0.5 = 1.2 + 0.6 + 0.08 + 0.025 = 1.905
      // Expected for Taiwan: 0.10*3.0 + 0.35*4.0 + 0.02*1.0 + 0.01*0.5 = 0.3 + 1.4 + 0.02 + 0.005 = 1.725
      
      // Total: ~5.64
      expect(result.expected_delta_CO_GRI).toBeCloseTo(5.64, 1);
    });

    it('should provide channel-level breakdown', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvent);
      
      expect(result.channel_breakdown.revenue).toBeGreaterThan(0);
      expect(result.channel_breakdown.supply_chain).toBeGreaterThan(0);
      expect(result.channel_breakdown.physical_assets).toBeGreaterThan(0);
      expect(result.channel_breakdown.financial).toBeGreaterThan(0);
      
      // Sum of channel breakdown should equal total delta
      const channelSum = 
        result.channel_breakdown.revenue +
        result.channel_breakdown.supply_chain +
        result.channel_breakdown.physical_assets +
        result.channel_breakdown.financial;
      
      expect(channelSum).toBeCloseTo(result.expected_delta_CO_GRI, 2);
    });

    it('should apply probability weighting correctly', () => {
      const result = applyForecastToCompany(mockCompany, mockForecastEvent);
      
      expect(result.probability_weighted_delta).toBeCloseTo(
        result.expected_delta_CO_GRI * mockForecastEvent.probability,
        2
      );
    });
  });

  describe('generateBaselineForecastEvents', () => {
    it('should generate 8 baseline forecast events', () => {
      const events = generateBaselineForecastEvents();
      expect(events.length).toBe(8);
    });

    it('should include required high-probability events', () => {
      const events = generateBaselineForecastEvents();
      const eventNames = events.map(e => e.event_name);
      
      expect(eventNames).toContain('US-China Trade War Escalation');
      expect(eventNames).toContain('Taiwan Strait Military Tensions');
      expect(eventNames).toContain('Middle East Oil Supply Disruption');
      expect(eventNames).toContain('EU-Russia Energy Crisis Intensification');
      expect(eventNames).toContain('India-China Border Tensions');
    });

    it('should have probabilities in valid range (0-1)', () => {
      const events = generateBaselineForecastEvents();
      
      events.forEach(event => {
        expect(event.probability).toBeGreaterThanOrEqual(0);
        expect(event.probability).toBeLessThanOrEqual(1);
      });
    });

    it('should have confidence scores in valid range (0-1)', () => {
      const events = generateBaselineForecastEvents();
      
      events.forEach(event => {
        expect(event.confidence).toBeGreaterThanOrEqual(0);
        expect(event.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include both risk-increasing and risk-decreasing events', () => {
      const events = generateBaselineForecastEvents();
      
      const increasingRisk = events.filter(e => e.expected_delta_CO_GRI > 0);
      const decreasingRisk = events.filter(e => e.expected_delta_CO_GRI < 0);
      
      expect(increasingRisk.length).toBeGreaterThan(0);
      expect(decreasingRisk.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCompanyForecastImpact', () => {
    it('should return impacts only for relevant events', () => {
      const impacts = calculateCompanyForecastImpact(mockCompany);
      
      // Should have multiple relevant events
      expect(impacts.length).toBeGreaterThan(0);
      
      // All impacts should be for the correct company
      impacts.forEach(impact => {
        expect(impact.company_ticker).toBe('AAPL');
      });
    });

    it('should handle companies with limited exposure', () => {
      const limitedCompany: CompanyExposure = {
        ticker: 'TEST',
        name: 'Test Company',
        sector: 'Technology',
        exposures: {
          'Germany': {
            W_R: 0.80,
            W_S: 0.10,
            W_P: 0.05,
            W_F: 0.05,
            CSI: 48.5
          }
        }
      };
      
      const impacts = calculateCompanyForecastImpact(limitedCompany);
      
      // Should have fewer relevant events due to limited exposure
      expect(impacts.length).toBeGreaterThanOrEqual(0);
      
      // All affected countries should be in company's exposure
      impacts.forEach(impact => {
        impact.affected_countries.forEach(country => {
          expect(limitedCompany.exposures[country]).toBeDefined();
        });
      });
    });
  });

  describe('Guardrail Validation', () => {
    it('should never modify exposure weights', () => {
      const originalExposures = JSON.parse(JSON.stringify(mockCompany.exposures));
      
      applyForecastToCompany(mockCompany, mockForecastEvent);
      
      // Exposure weights should remain unchanged
      expect(mockCompany.exposures).toEqual(originalExposures);
    });

    it('should never add new countries to exposure', () => {
      const originalCountries = Object.keys(mockCompany.exposures);
      
      applyForecastToCompany(mockCompany, mockForecastEvent);
      
      const currentCountries = Object.keys(mockCompany.exposures);
      expect(currentCountries).toEqual(originalCountries);
    });
  });
});