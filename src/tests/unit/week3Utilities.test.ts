import { describe, it, expect } from 'vitest';
import {
  STANDARD_CHANNEL_WEIGHTS,
  calculateChannelRiskScores,
  getTopCountriesForChannel
} from '@/utils/channelCalculations';
import {
  getTopStructuralDrivers,
  filterRelevantForecastEvents,
  rankForecastEventsByRelevance
} from '@/utils/riskRelevance';
import {
  generatePeerCompanies,
  rankPeersByRisk,
  getCompanyRank,
  calculateSectorAverage
} from '@/utils/peerComparison';
import { CountryExposure, RiskLevel } from '@/types/company';

describe('Week 3 Utilities - Unit Tests', () => {
  // Sample test data
  const sampleCountryExposures: CountryExposure[] = [
    { country: 'China', exposureWeight: 0.40, countryShockIndex: 65, contribution: 26.0, region: 'Asia' },
    { country: 'Taiwan', exposureWeight: 0.25, countryShockIndex: 55, contribution: 13.75, region: 'Asia' },
    { country: 'Vietnam', exposureWeight: 0.15, countryShockIndex: 45, contribution: 6.75, region: 'Asia' },
    { country: 'Germany', exposureWeight: 0.10, countryShockIndex: 35, contribution: 3.5, region: 'Europe' },
    { country: 'Mexico', exposureWeight: 0.10, countryShockIndex: 40, contribution: 4.0, region: 'Americas' }
  ];

  describe('Channel Calculations', () => {
    it('should have correct standard channel weights', () => {
      expect(STANDARD_CHANNEL_WEIGHTS['Revenue']).toBe(0.35);
      expect(STANDARD_CHANNEL_WEIGHTS['Supply Chain']).toBe(0.30);
      expect(STANDARD_CHANNEL_WEIGHTS['Physical Assets']).toBe(0.20);
      expect(STANDARD_CHANNEL_WEIGHTS['Financial']).toBe(0.15);
    });

    it('should sum channel weights to 1.0', () => {
      const sum = Object.values(STANDARD_CHANNEL_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should calculate channel risk scores', () => {
      const scores = calculateChannelRiskScores(sampleCountryExposures);
      
      expect(scores['Revenue']).toBeGreaterThan(0);
      expect(scores['Supply Chain']).toBeGreaterThan(0);
      expect(scores['Physical Assets']).toBeGreaterThan(0);
      expect(scores['Financial']).toBeGreaterThan(0);
    });

    it('should get top countries for channel', () => {
      const topCountries = getTopCountriesForChannel(sampleCountryExposures, 'Revenue', 3);
      
      expect(topCountries).toHaveLength(3);
      expect(topCountries[0].country).toBe('China'); // Highest contribution
      expect(topCountries[0].percentage).toBeCloseTo(40, 1);
    });
  });

  describe('Risk Relevance', () => {
    it('should get top structural drivers', () => {
      const drivers = getTopStructuralDrivers(sampleCountryExposures, 2);
      
      expect(drivers).toHaveLength(2);
      expect(drivers[0].country).toBe('China'); // Highest contribution
      expect(drivers[0].risk_contribution).toBeCloseTo(26.0, 1);
      expect(drivers[0].risk_share).toBeGreaterThan(0);
      expect(drivers[0].explanation).toContain('China');
    });

    it('should filter relevant forecast events', () => {
      const forecastEvents = [
        {
          event_id: 'E1',
          event_name: 'Event 1',
          probability: 0.6,
          timing: '6 months',
          affected_countries: ['China', 'Taiwan'],
          affected_channels: ['Supply Chain'],
          expected_delta_CO_GRI: 5.0,
          why_relevant: 'Test'
        },
        {
          event_id: 'E2',
          event_name: 'Event 2',
          probability: 0.2, // Too low
          timing: '12 months',
          affected_countries: ['Germany'],
          affected_channels: ['Revenue'],
          expected_delta_CO_GRI: 3.0,
          why_relevant: 'Test'
        },
        {
          event_id: 'E3',
          event_name: 'Event 3',
          probability: 0.7,
          timing: '9 months',
          affected_countries: ['Unknown'], // No exposure
          affected_channels: ['Financial'],
          expected_delta_CO_GRI: 4.0,
          why_relevant: 'Test'
        }
      ];

      const relevant = filterRelevantForecastEvents(forecastEvents, sampleCountryExposures);
      
      // Only E1 should pass all filters
      expect(relevant).toHaveLength(1);
      expect(relevant[0].event_id).toBe('E1');
    });

    it('should rank forecast events by relevance', () => {
      const forecastEvents = [
        {
          event_id: 'E1',
          event_name: 'Low Impact',
          probability: 0.4,
          timing: '6 months',
          affected_countries: ['Mexico'],
          affected_channels: ['Financial'],
          expected_delta_CO_GRI: 2.0,
          why_relevant: 'Test'
        },
        {
          event_id: 'E2',
          event_name: 'High Impact',
          probability: 0.8,
          timing: '12 months',
          affected_countries: ['China', 'Taiwan'],
          affected_channels: ['Supply Chain'],
          expected_delta_CO_GRI: 8.0,
          why_relevant: 'Test'
        }
      ];

      const ranked = rankForecastEventsByRelevance(forecastEvents, sampleCountryExposures);
      
      // E2 should rank higher due to higher probability, impact, and exposure
      expect(ranked[0].event_id).toBe('E2');
      expect(ranked[1].event_id).toBe('E1');
    });
  });

  describe('Peer Comparison', () => {
    it('should generate peer companies', () => {
      const peers = generatePeerCompanies('AAPL', 'Technology', 55.0, 5);
      
      expect(peers).toHaveLength(5);
      expect(peers.every(p => p.ticker !== 'AAPL')).toBe(true);
      expect(peers.every(p => p.sector === 'Technology')).toBe(true);
      expect(peers.every(p => p.CO_GRI >= 0 && p.CO_GRI <= 100)).toBe(true);
    });

    it('should rank peers by risk', () => {
      const peers = [
        { ticker: 'A', name: 'Company A', sector: 'Tech', CO_GRI: 30, risk_level: RiskLevel.LOW },
        { ticker: 'B', name: 'Company B', sector: 'Tech', CO_GRI: 60, risk_level: RiskLevel.ELEVATED },
        { ticker: 'C', name: 'Company C', sector: 'Tech', CO_GRI: 45, risk_level: RiskLevel.MODERATE }
      ];

      const ranked = rankPeersByRisk(peers);
      
      expect(ranked[0].ticker).toBe('B'); // Highest risk
      expect(ranked[1].ticker).toBe('C');
      expect(ranked[2].ticker).toBe('A'); // Lowest risk
    });

    it('should calculate company rank', () => {
      const peers = [
        { ticker: 'A', name: 'Company A', sector: 'Tech', CO_GRI: 30, risk_level: RiskLevel.LOW },
        { ticker: 'B', name: 'Company B', sector: 'Tech', CO_GRI: 60, risk_level: RiskLevel.ELEVATED },
        { ticker: 'C', name: 'Company C', sector: 'Tech', CO_GRI: 45, risk_level: RiskLevel.MODERATE }
      ];

      const rank = getCompanyRank(50, peers);
      
      expect(rank.rank).toBe(2); // 2nd highest (60 > 50 > 45 > 30)
      expect(rank.total).toBe(4); // 3 peers + current company
    });

    it('should calculate sector average', () => {
      const peers = [
        { ticker: 'A', name: 'Company A', sector: 'Tech', CO_GRI: 30, risk_level: RiskLevel.LOW },
        { ticker: 'B', name: 'Company B', sector: 'Tech', CO_GRI: 60, risk_level: RiskLevel.ELEVATED },
        { ticker: 'C', name: 'Company C', sector: 'Tech', CO_GRI: 45, risk_level: RiskLevel.MODERATE }
      ];

      const average = calculateSectorAverage(peers);
      
      expect(average).toBeCloseTo(45.0, 1); // (30 + 60 + 45) / 3 = 45
    });

    it('should handle empty peer list', () => {
      const average = calculateSectorAverage([]);
      expect(average).toBe(0);
    });
  });
});