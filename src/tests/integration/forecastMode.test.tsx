/**
 * Forecast Mode Integration Tests
 * Part of CO-GRI Platform Phase 3 - Week 7-8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterRelevantForecastEvents,
  validateExposureIntegrity,
  getTopRelevantEvents,
  hasRelevantEvents,
  getRelevanceSummary
} from '@/services/forecast/eventRelevanceFilter';
import {
  applyForecastDelta,
  applyMultipleForecastEvents,
  calculateForecastScenarios,
  calculateChannelImpact,
  getForecastOutlook,
  getConfidenceLevel
} from '@/services/forecast/forecastDeltaApplicator';
import {
  generateMockForecastEvents,
  generateMockExecutiveSummary,
  generateMockRegionalAssessments,
  generateMockAssetClassForecasts,
  generateMockStrategicRecommendations
} from '@/services/mockData/forecastDataGenerator';
import { CountryExposure } from '@/services/cogriCalculationService';

describe('Forecast Mode - Week 7-8 Integration Tests', () => {
  let mockEvents: ReturnType<typeof generateMockForecastEvents>;
  let mockCompanyExposures: CountryExposure[];

  beforeEach(() => {
    mockEvents = generateMockForecastEvents();
    mockCompanyExposures = [
      {
        country: 'China',
        exposureWeight: 0.35,
        adjustedShock: 61.2,
        riskContribution: 21.4,
        alignmentModifier: 0.3
      },
      {
        country: 'Taiwan',
        exposureWeight: 0.25,
        adjustedShock: 58.3,
        riskContribution: 14.6,
        alignmentModifier: 0.67
      },
      {
        country: 'Vietnam',
        exposureWeight: 0.15,
        adjustedShock: 38.5,
        riskContribution: 5.8,
        alignmentModifier: 0.5
      },
      {
        country: 'Japan',
        exposureWeight: 0.12,
        adjustedShock: 27.2,
        riskContribution: 3.3,
        alignmentModifier: 0.83
      },
      {
        country: 'S. Korea',
        exposureWeight: 0.08,
        adjustedShock: 32.1,
        riskContribution: 2.6,
        alignmentModifier: 0.77
      }
    ];
  });

  // ============================================================================
  // RELEVANCE FILTERING TESTS
  // ============================================================================

  describe('Relevance Filtering', () => {
    it('should filter events by company exposure', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      
      expect(relevantEvents.length).toBeGreaterThan(0);
      expect(relevantEvents.length).toBeLessThanOrEqual(mockEvents.length);
      
      // All relevant events should affect countries where company has exposure
      relevantEvents.forEach(event => {
        const hasExposure = event.affected_countries.some(country =>
          mockCompanyExposures.find(exp => exp.country === country)
        );
        expect(hasExposure).toBe(true);
      });
    });

    it('should apply exposure threshold (>5%)', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures, {
        min_exposure_threshold: 0.05
      });
      
      relevantEvents.forEach(event => {
        const totalExposure = event.affected_countries.reduce((sum, country) => {
          const exp = mockCompanyExposures.find(e => e.country === country);
          return sum + (exp?.exposureWeight || 0);
        }, 0);
        
        expect(totalExposure).toBeGreaterThanOrEqual(0.05);
      });
    });

    it('should apply delta threshold (|ΔCO-GRI| > 2)', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures, {
        min_delta_threshold: 2
      });
      
      relevantEvents.forEach(event => {
        expect(Math.abs(event.expected_delta_CO_GRI)).toBeGreaterThanOrEqual(2);
      });
    });

    it('should apply probability threshold (>30%)', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures, {
        min_probability: 0.3
      });
      
      relevantEvents.forEach(event => {
        expect(event.probability).toBeGreaterThanOrEqual(0.3);
      });
    });

    it('should calculate materiality scores', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      
      relevantEvents.forEach(event => {
        expect(event.materiality_score).toBeGreaterThanOrEqual(0);
        expect(event.materiality_score).toBeLessThanOrEqual(100);
      });
      
      // Events should be sorted by materiality score (descending)
      for (let i = 0; i < relevantEvents.length - 1; i++) {
        expect(relevantEvents[i].materiality_score).toBeGreaterThanOrEqual(
          relevantEvents[i + 1].materiality_score
        );
      }
    });

    it('should generate relevance reasoning', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      
      relevantEvents.forEach(event => {
        expect(event.why_relevant).toBeTruthy();
        expect(event.why_relevant.length).toBeGreaterThan(0);
        expect(event.why_relevant).toContain('exposure');
      });
    });
  });

  // ============================================================================
  // EXPOSURE INTEGRITY GUARDRAILS
  // ============================================================================

  describe('Exposure Integrity Guardrails', () => {
    it('should validate exposure integrity - no changes', () => {
      const exposuresBefore = JSON.parse(JSON.stringify(mockCompanyExposures));
      const exposuresAfter = JSON.parse(JSON.stringify(mockCompanyExposures));
      
      const validation = validateExposureIntegrity(exposuresBefore, exposuresAfter);
      
      expect(validation.is_valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect exposure count changes', () => {
      const exposuresBefore = JSON.parse(JSON.stringify(mockCompanyExposures));
      const exposuresAfter = [...mockCompanyExposures, {
        country: 'Germany',
        exposureWeight: 0.05,
        adjustedShock: 45.0,
        riskContribution: 2.3,
        alignmentModifier: 0.9
      }];
      
      const validation = validateExposureIntegrity(exposuresBefore, exposuresAfter);
      
      expect(validation.is_valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Exposure count changed');
    });

    it('should detect new exposures', () => {
      const exposuresBefore = JSON.parse(JSON.stringify(mockCompanyExposures));
      const exposuresAfter = [...mockCompanyExposures];
      exposuresAfter[0] = { ...exposuresAfter[0], country: 'NewCountry' };
      
      const validation = validateExposureIntegrity(exposuresBefore, exposuresAfter);
      
      expect(validation.is_valid).toBe(false);
      expect(validation.errors.some(e => e.includes('New exposures created'))).toBe(true);
    });

    it('should detect exposure weight changes', () => {
      const exposuresBefore = JSON.parse(JSON.stringify(mockCompanyExposures));
      const exposuresAfter = JSON.parse(JSON.stringify(mockCompanyExposures));
      exposuresAfter[0].exposureWeight = 0.50; // Changed from 0.35
      
      const validation = validateExposureIntegrity(exposuresBefore, exposuresAfter);
      
      expect(validation.is_valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Exposure weight changed'))).toBe(true);
    });
  });

  // ============================================================================
  // FORECAST DELTA APPLICATION
  // ============================================================================

  describe('Forecast Delta Application', () => {
    it('should apply forecast delta without modifying exposures', () => {
      const exposuresBefore = JSON.parse(JSON.stringify(mockCompanyExposures));
      const event = mockEvents[0];
      
      const delta = applyForecastDelta(event, mockCompanyExposures);
      
      expect(typeof delta).toBe('number');
      
      // Validate exposures unchanged
      const validation = validateExposureIntegrity(exposuresBefore, mockCompanyExposures);
      expect(validation.is_valid).toBe(true);
    });

    it('should only apply delta to countries with existing exposure', () => {
      const limitedExposures: CountryExposure[] = [
        {
          country: 'China',
          exposureWeight: 0.50,
          adjustedShock: 61.2,
          riskContribution: 30.6,
          alignmentModifier: 0.3
        }
      ];
      
      const event = mockEvents.find(e => 
        e.affected_countries.includes('China') && 
        e.affected_countries.includes('Taiwan')
      )!;
      
      const delta = applyForecastDelta(event, limitedExposures);
      
      // Delta should only reflect China exposure, not Taiwan
      expect(delta).toBeDefined();
      expect(Math.abs(delta)).toBeGreaterThan(0);
    });

    it('should apply multiple forecast events correctly', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      const topEvents = relevantEvents.slice(0, 3);
      
      const result = applyMultipleForecastEvents(topEvents, mockCompanyExposures);
      
      expect(result.validation_passed).toBe(true);
      expect(result.event_contributions).toHaveLength(3);
      expect(typeof result.total_delta).toBe('number');
      expect(typeof result.probability_weighted_delta).toBe('number');
    });

    it('should calculate forecast scenarios (best/base/worst)', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      const topEvents = relevantEvents.slice(0, 5);
      
      const scenarios = calculateForecastScenarios(topEvents, mockCompanyExposures);
      
      expect(scenarios.best_case).toBeLessThanOrEqual(scenarios.base_case);
      expect(scenarios.base_case).toBeLessThanOrEqual(scenarios.worst_case);
    });

    it('should calculate channel-specific impact', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      const topEvents = relevantEvents.slice(0, 3);
      
      const channelImpact = calculateChannelImpact(topEvents, mockCompanyExposures);
      
      expect(channelImpact.revenue).toBeDefined();
      expect(channelImpact.supply_chain).toBeDefined();
      expect(channelImpact.physical_assets).toBeDefined();
      expect(channelImpact.financial).toBeDefined();
    });
  });

  // ============================================================================
  // FORECAST OUTLOOK CLASSIFICATION
  // ============================================================================

  describe('Forecast Outlook Classification', () => {
    it('should classify outlook as Headwind for positive delta', () => {
      const outlook = getForecastOutlook(5.5);
      expect(outlook).toBe('Headwind');
    });

    it('should classify outlook as Tailwind for negative delta', () => {
      const outlook = getForecastOutlook(-4.2);
      expect(outlook).toBe('Tailwind');
    });

    it('should classify outlook as Neutral for small delta', () => {
      const outlook = getForecastOutlook(0.5);
      expect(outlook).toBe('Neutral');
    });

    it('should classify outlook as Mixed for moderate delta', () => {
      const outlook = getForecastOutlook(2.1);
      expect(outlook).toBe('Mixed');
    });

    it('should determine confidence level from events', () => {
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      const confidence = getConfidenceLevel(relevantEvents);
      
      expect(['High', 'Medium', 'Low']).toContain(confidence);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('Utility Functions', () => {
    it('should get top N relevant events', () => {
      const topEvents = getTopRelevantEvents(mockEvents, mockCompanyExposures, 3);
      
      expect(topEvents).toHaveLength(3);
      
      // Should be sorted by materiality score
      for (let i = 0; i < topEvents.length - 1; i++) {
        expect(topEvents[i].materiality_score).toBeGreaterThanOrEqual(
          topEvents[i + 1].materiality_score
        );
      }
    });

    it('should check if relevant events exist', () => {
      const hasEvents = hasRelevantEvents(mockEvents, mockCompanyExposures);
      expect(typeof hasEvents).toBe('boolean');
    });

    it('should generate relevance summary statistics', () => {
      const summary = getRelevanceSummary(mockEvents, mockCompanyExposures);
      
      expect(summary.total_events).toBe(mockEvents.length);
      expect(summary.relevant_events).toBeGreaterThanOrEqual(0);
      expect(summary.relevance_rate).toBeGreaterThanOrEqual(0);
      expect(summary.relevance_rate).toBeLessThanOrEqual(1);
      expect(summary.avg_materiality_score).toBeGreaterThanOrEqual(0);
      expect(summary.avg_materiality_score).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // MOCK DATA GENERATORS
  // ============================================================================

  describe('Mock Data Generators', () => {
    it('should generate forecast events', () => {
      const events = generateMockForecastEvents();
      
      expect(events.length).toBeGreaterThan(0);
      
      events.forEach(event => {
        expect(event.event_id).toBeTruthy();
        expect(event.event_name).toBeTruthy();
        expect(event.probability).toBeGreaterThanOrEqual(0);
        expect(event.probability).toBeLessThanOrEqual(1);
        expect(event.affected_countries.length).toBeGreaterThan(0);
        expect(event.delta_by_channel).toBeDefined();
      });
    });

    it('should generate executive summary', () => {
      const summary = generateMockExecutiveSummary();
      
      expect(summary.global_risk_trajectory).toBeDefined();
      expect(summary.top_geopolitical_themes.length).toBeGreaterThan(0);
      expect(summary.high_impact_events_count).toBeGreaterThanOrEqual(0);
      expect(summary.regional_hotspots.length).toBeGreaterThan(0);
      expect(summary.summary_text).toBeTruthy();
      expect(summary.key_takeaways.length).toBeGreaterThan(0);
    });

    it('should generate regional assessments', () => {
      const assessments = generateMockRegionalAssessments();
      
      expect(assessments.length).toBeGreaterThan(0);
      
      assessments.forEach(assessment => {
        expect(assessment.region).toBeTruthy();
        expect(assessment.countries.length).toBeGreaterThan(0);
        expect(assessment.current_level).toBeGreaterThan(0);
        expect(assessment.forecast_level).toBeGreaterThan(0);
        expect(assessment.summary).toBeTruthy();
      });
    });

    it('should generate asset class forecasts', () => {
      const forecasts = generateMockAssetClassForecasts();
      
      expect(forecasts.length).toBeGreaterThan(0);
      
      forecasts.forEach(forecast => {
        expect(forecast.asset_class).toBeTruthy();
        expect(forecast.breakdown.length).toBeGreaterThan(0);
        
        forecast.breakdown.forEach(item => {
          expect(item.category).toBeTruthy();
          expect(['Positive', 'Negative', 'Neutral', 'Mixed']).toContain(item.impact);
          expect(item.reasoning).toBeTruthy();
        });
      });
    });

    it('should generate strategic recommendations', () => {
      const recommendations = generateMockStrategicRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.recommendation_id).toBeTruthy();
        expect(['Portfolio Positioning', 'Risk Mitigation', 'Opportunities']).toContain(rec.category);
        expect(rec.action).toBeTruthy();
        expect(rec.rationale).toBeTruthy();
        expect(['High', 'Medium', 'Low']).toContain(rec.confidence);
        expect(['High', 'Medium', 'Low']).toContain(rec.priority);
      });
    });
  });

  // ============================================================================
  // END-TO-END INTEGRATION
  // ============================================================================

  describe('End-to-End Integration', () => {
    it('should complete full forecast analysis workflow', () => {
      // Step 1: Filter relevant events
      const relevantEvents = filterRelevantForecastEvents(mockEvents, mockCompanyExposures);
      expect(relevantEvents.length).toBeGreaterThan(0);
      
      // Step 2: Apply forecast deltas
      const result = applyMultipleForecastEvents(relevantEvents, mockCompanyExposures);
      expect(result.validation_passed).toBe(true);
      
      // Step 3: Calculate scenarios
      const scenarios = calculateForecastScenarios(relevantEvents, mockCompanyExposures);
      expect(scenarios.base_case).toBeDefined();
      
      // Step 4: Determine outlook
      const outlook = getForecastOutlook(result.probability_weighted_delta);
      expect(['Headwind', 'Tailwind', 'Mixed', 'Neutral']).toContain(outlook);
      
      // Step 5: Get confidence
      const confidence = getConfidenceLevel(relevantEvents);
      expect(['High', 'Medium', 'Low']).toContain(confidence);
    });
  });
});