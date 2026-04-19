import { describe, it, expect } from 'vitest';
import {
  calculateCountryAttribution,
  getTopCountriesForAttribution,
  calculateChannelBreakdown,
  getCountryColor,
  getContributionLabel
} from '@/utils/attributionCalculations';
import {
  sortEventsByDate,
  filterEventsByType,
  filterEventsByImpact,
  getImpactColor,
  getEventTypeColor
} from '@/utils/timelineEvents';
import {
  generateCalculationSteps,
  generateSensitivityAnalysis
} from '@/utils/verificationData';
import { CountryExposure } from '@/types/company';

describe('Week 4 Utilities - Unit Tests', () => {
  // Sample test data
  const sampleCountryExposures: CountryExposure[] = [
    { country: 'China', exposureWeight: 0.40, countryShockIndex: 65, contribution: 26.0, region: 'Asia' },
    { country: 'Taiwan', exposureWeight: 0.25, countryShockIndex: 55, contribution: 13.75, region: 'Asia' },
    { country: 'Vietnam', exposureWeight: 0.15, countryShockIndex: 45, contribution: 6.75, region: 'Asia' },
    { country: 'Germany', exposureWeight: 0.10, countryShockIndex: 35, contribution: 3.5, region: 'Europe' },
    { country: 'Mexico', exposureWeight: 0.10, countryShockIndex: 40, contribution: 4.0, region: 'Americas' }
  ];

  describe('Attribution Calculations', () => {
    it('should calculate country attribution correctly', () => {
      const attributions = calculateCountryAttribution(sampleCountryExposures);
      
      expect(attributions).toHaveLength(5);
      expect(attributions[0].country).toBe('China'); // Highest contribution
      expect(attributions[0].risk_contribution).toBeCloseTo(26.0, 1);
      
      // Check risk shares sum to ~100%
      const totalShare = attributions.reduce((sum, a) => sum + a.risk_share, 0);
      expect(totalShare).toBeCloseTo(100, 1);
    });

    it('should sort attributions by risk contribution descending', () => {
      const attributions = calculateCountryAttribution(sampleCountryExposures);
      
      for (let i = 0; i < attributions.length - 1; i++) {
        expect(attributions[i].risk_contribution).toBeGreaterThanOrEqual(
          attributions[i + 1].risk_contribution
        );
      }
    });

    it('should get top N countries for attribution', () => {
      const attributions = calculateCountryAttribution(sampleCountryExposures);
      const top3 = getTopCountriesForAttribution(attributions, 3);
      
      expect(top3).toHaveLength(3);
      expect(top3[0].country).toBe('China');
      expect(top3[1].country).toBe('Taiwan');
      expect(top3[2].country).toBe('Vietnam');
    });

    it('should calculate channel breakdown', () => {
      const breakdown = calculateChannelBreakdown('China', 26.0);
      
      expect(breakdown).toHaveLength(4);
      expect(breakdown.map(b => b.channel)).toEqual([
        'Revenue', 'Supply Chain', 'Physical Assets', 'Financial'
      ]);
      
      // Check percentages sum to 100
      const totalPercentage = breakdown.reduce((sum, b) => sum + b.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
      
      // Check contributions sum to total
      const totalContribution = breakdown.reduce((sum, b) => sum + b.contribution, 0);
      expect(totalContribution).toBeCloseTo(26.0, 1);
    });

    it('should get correct country color based on risk share', () => {
      expect(getCountryColor(25)).toBe('#EF4444'); // red-500 (>20%)
      expect(getCountryColor(15)).toBe('#F97316'); // orange-500 (10-20%)
      expect(getCountryColor(7)).toBe('#F59E0B');  // amber-500 (5-10%)
      expect(getCountryColor(3)).toBe('#10B981');  // green-500 (<5%)
    });

    it('should get correct contribution label', () => {
      expect(getContributionLabel(25)).toBe('Primary');
      expect(getContributionLabel(15)).toBe('Significant');
      expect(getContributionLabel(7)).toBe('Moderate');
      expect(getContributionLabel(3)).toBe('Minor');
    });
  });

  describe('Timeline Events', () => {
    const sampleEvents = [
      {
        event_id: 'E1',
        date: new Date('2024-01-15'),
        title: 'Event 1',
        description: 'Test event 1',
        event_type: 'Historical' as const,
        impact_level: 'High' as const,
        affected_countries: ['China'],
        affected_channels: ['Supply Chain']
      },
      {
        event_id: 'E2',
        date: new Date('2024-03-20'),
        title: 'Event 2',
        description: 'Test event 2',
        event_type: 'Forecast' as const,
        impact_level: 'Medium' as const,
        affected_countries: ['Taiwan'],
        affected_channels: ['Revenue']
      },
      {
        event_id: 'E3',
        date: new Date('2024-02-10'),
        title: 'Event 3',
        description: 'Test event 3',
        event_type: 'Historical' as const,
        impact_level: 'Low' as const,
        affected_countries: ['Germany'],
        affected_channels: ['Financial']
      }
    ];

    it('should sort events by date descending', () => {
      const sorted = sortEventsByDate(sampleEvents);
      
      expect(sorted[0].event_id).toBe('E2'); // March (most recent)
      expect(sorted[1].event_id).toBe('E3'); // February
      expect(sorted[2].event_id).toBe('E1'); // January
    });

    it('should filter events by type', () => {
      const historical = filterEventsByType(sampleEvents, ['Historical']);
      expect(historical).toHaveLength(2);
      expect(historical.every(e => e.event_type === 'Historical')).toBe(true);

      const forecast = filterEventsByType(sampleEvents, ['Forecast']);
      expect(forecast).toHaveLength(1);
      expect(forecast[0].event_type).toBe('Forecast');

      const all = filterEventsByType(sampleEvents, ['all']);
      expect(all).toHaveLength(3);
    });

    it('should filter events by impact level', () => {
      const highOnly = filterEventsByImpact(sampleEvents, 'High');
      expect(highOnly).toHaveLength(1);
      expect(highOnly[0].impact_level).toBe('High');

      const mediumPlus = filterEventsByImpact(sampleEvents, 'Medium');
      expect(mediumPlus).toHaveLength(2); // High + Medium
      expect(mediumPlus.every(e => e.impact_level === 'High' || e.impact_level === 'Medium')).toBe(true);

      const lowPlus = filterEventsByImpact(sampleEvents, 'Low');
      expect(lowPlus).toHaveLength(3); // All events
    });

    it('should get correct impact color', () => {
      expect(getImpactColor('High')).toContain('red');
      expect(getImpactColor('Medium')).toContain('yellow');
      expect(getImpactColor('Low')).toContain('green');
    });

    it('should get correct event type color', () => {
      expect(getEventTypeColor('Historical')).toContain('blue');
      expect(getEventTypeColor('Forecast')).toContain('purple');
      expect(getEventTypeColor('Scenario')).toContain('orange');
    });
  });

  describe('Verification Data', () => {
    it('should generate calculation steps', () => {
      const steps = generateCalculationSteps('AAPL', 55.0);
      
      expect(steps).toHaveLength(5);
      expect(steps[0].step_name).toBe('Country Exposure Normalization');
      expect(steps[4].step_name).toBe('Sector Multiplier Application');
      
      // Check each step has required fields
      steps.forEach(step => {
        expect(step).toHaveProperty('step_number');
        expect(step).toHaveProperty('formula');
        expect(step).toHaveProperty('inputs');
        expect(step).toHaveProperty('output');
        expect(step).toHaveProperty('explanation');
      });
    });

    it('should generate sensitivity analysis', () => {
      const analysis = generateSensitivityAnalysis(55.0);
      
      expect(analysis.length).toBeGreaterThan(0);
      
      // Check each analysis has required fields
      analysis.forEach(item => {
        expect(item).toHaveProperty('parameter');
        expect(item).toHaveProperty('baseline_value');
        expect(item).toHaveProperty('change_percentage');
        expect(item).toHaveProperty('new_value');
        expect(item).toHaveProperty('impact_on_CO_GRI');
        expect(item).toHaveProperty('percentage_change');
      });

      // Check ±10% changes are symmetric
      const chinaPlus = analysis.find(a => 
        a.parameter === 'China Exposure Weight' && a.change_percentage === 10
      );
      const chinaMinus = analysis.find(a => 
        a.parameter === 'China Exposure Weight' && a.change_percentage === -10
      );
      
      expect(chinaPlus).toBeDefined();
      expect(chinaMinus).toBeDefined();
      expect(Math.abs(chinaPlus!.impact_on_CO_GRI)).toBeCloseTo(
        Math.abs(chinaMinus!.impact_on_CO_GRI), 
        1
      );
    });

    it('should calculate percentage changes correctly', () => {
      const baselineScore = 50.0;
      const analysis = generateSensitivityAnalysis(baselineScore);
      
      analysis.forEach(item => {
        const expectedPercentage = (item.impact_on_CO_GRI / baselineScore) * 100;
        expect(item.percentage_change).toBeCloseTo(expectedPercentage, 1);
      });
    });
  });
});