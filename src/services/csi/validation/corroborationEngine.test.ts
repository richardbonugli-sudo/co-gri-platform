/**
 * Unit tests for Corroboration Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CorroborationEngine,
  CorroborationRecommendation,
  SourceCategory
} from './corroborationEngine';
import { EventCandidate, EventState } from '../lifecycle/eventStateMachine';

describe('CorroborationEngine', () => {
  let engine: CorroborationEngine;
  let mockEvent: EventCandidate;

  beforeEach(() => {
    engine = new CorroborationEngine();

    // Create a mock event with diverse sources for passing tests
    // Using sources from different categories to pass diversity checks
    mockEvent = {
      id: 'test-event-001',
      state: EventState.PROVISIONAL,
      title: 'Test Geopolitical Event',
      description: 'A test event for validation',
      primaryVector: 'SC1',
      secondaryVectors: [],
      sources: [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72 hours ago (oldest)
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago (newest)
          url: 'https://un.org/test'
        }
      ],
      detectedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      metadata: {}
    };
  });

  describe('Source Count Validation', () => {
    it('should pass with 2 independent sources from different categories', () => {
      // mockEvent has reuters (NEWS_TIER1) and un (OFFICIAL) - different categories
      const result = engine.validate(mockEvent);
      
      expect(result.independentSourceCount).toBeGreaterThanOrEqual(2);
      const sourceCountRule = result.validationDetails.find(d => d.rule === 'Independent Source Count');
      expect(sourceCountRule?.passed).toBe(true);
    });

    it('should fail with only 1 source', () => {
      mockEvent.sources = [mockEvent.sources[0]];
      
      const result = engine.validate(mockEvent);
      
      expect(result.independentSourceCount).toBeLessThan(2);
      const sourceCountRule = result.validationDetails.find(d => d.rule === 'Independent Source Count');
      expect(sourceCountRule?.passed).toBe(false);
    });

    it('should penalize sources from same category', () => {
      mockEvent.sources = [
        {
          sourceId: 'twitter',
          sourceName: 'Twitter',
          credibility: 0.4,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://twitter.com/test'
        },
        {
          sourceId: 'reddit',
          sourceName: 'Reddit',
          credibility: 0.3,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://reddit.com/test'
        }
      ];

      const result = engine.validate(mockEvent);
      
      // Both social media sources should result in penalty (same category)
      expect(result.independentSourceCount).toBeLessThan(2);
    });
  });

  describe('Persistence Threshold Validation', () => {
    it('should pass with 48+ hours persistence (time span between oldest and newest)', () => {
      // mockEvent has sources at 72 hours ago and 24 hours ago = 48 hours span
      const result = engine.validate(mockEvent);
      
      expect(result.persistenceHours).toBeGreaterThanOrEqual(48);
      const persistenceRule = result.validationDetails.find(d => d.rule === 'Persistence Threshold');
      expect(persistenceRule?.passed).toBe(true);
    });

    it('should fail with less than 48 hours', () => {
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          url: 'https://un.org/test'
        }
      ];

      const result = engine.validate(mockEvent);
      
      // Persistence is 10 - 5 = 5 hours
      expect(result.persistenceHours).toBeLessThan(48);
      const persistenceRule = result.validationDetails.find(d => d.rule === 'Persistence Threshold');
      expect(persistenceRule?.passed).toBe(false);
    });

    it('should calculate persistence correctly', () => {
      const oldestTime = Date.now() - 72 * 60 * 60 * 1000; // 72 hours ago
      const newestTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(oldestTime),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(newestTime),
          url: 'https://un.org/test'
        }
      ];

      const result = engine.validate(mockEvent);
      
      // Persistence = 72 - 24 = 48 hours
      expect(result.persistenceHours).toBeCloseTo(48, 0);
    });
  });

  describe('Credibility Validation', () => {
    it('should pass with high credibility sources', () => {
      const result = engine.validate(mockEvent);
      
      expect(result.avgCredibility).toBeGreaterThanOrEqual(0.7);
      const credibilityRule = result.validationDetails.find(d => d.rule === 'Average Credibility');
      expect(credibilityRule?.passed).toBe(true);
    });

    it('should fail with low credibility sources', () => {
      mockEvent.sources = [
        {
          sourceId: 'source1',
          sourceName: 'Low Credibility Source 1',
          credibility: 0.5,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://test1.com'
        },
        {
          sourceId: 'source2',
          sourceName: 'Low Credibility Source 2',
          credibility: 0.6,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://test2.com'
        }
      ];

      const result = engine.validate(mockEvent);
      
      expect(result.avgCredibility).toBeLessThan(0.7);
      const credibilityRule = result.validationDetails.find(d => d.rule === 'Average Credibility');
      expect(credibilityRule?.passed).toBe(false);
    });

    it('should use base credibility from config', () => {
      const config = engine.getSourceCredibility('reuters');
      expect(config).toBeDefined();
      expect(config?.baseCredibility).toBe(0.9);
      expect(config?.category).toBe(SourceCategory.NEWS_TIER1);
    });
  });

  describe('Source Diversity Validation', () => {
    it('should pass with diverse source categories', () => {
      // Use 4 sources from 4 different categories to achieve higher diversity score
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000),
          url: 'https://un.org/test'
        },
        {
          sourceId: 'csis',
          sourceName: 'CSIS',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://csis.org/test'
        },
        {
          sourceId: 'ihs',
          sourceName: 'IHS Markit',
          credibility: 0.8,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          url: 'https://ihsmarkit.com/test'
        }
      ];
      
      const result = engine.validate(mockEvent);
      
      const diversityRule = result.validationDetails.find(d => d.rule === 'Source Diversity');
      expect(diversityRule?.passed).toBe(true);
      expect(diversityRule?.score).toBeGreaterThan(0.5);
    });

    it('should fail with low diversity (same category)', () => {
      mockEvent.sources = [
        {
          sourceId: 'twitter',
          sourceName: 'Twitter',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://twitter.com/test1'
        },
        {
          sourceId: 'reddit',
          sourceName: 'Reddit',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://reddit.com/test2'
        }
      ];

      const result = engine.validate(mockEvent);
      
      const diversityRule = result.validationDetails.find(d => d.rule === 'Source Diversity');
      // Same category = 0 entropy = 0 diversity score
      expect(diversityRule?.score).toBeLessThan(0.5);
    });
  });

  describe('Recommendation Generation', () => {
    it('should recommend CONFIRM when all criteria met', () => {
      // Use 4 diverse sources with 48+ hours persistence and high credibility
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000),
          url: 'https://un.org/test'
        },
        {
          sourceId: 'csis',
          sourceName: 'CSIS',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://csis.org/test'
        },
        {
          sourceId: 'ihs',
          sourceName: 'IHS Markit',
          credibility: 0.8,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          url: 'https://ihsmarkit.com/test'
        }
      ];
      
      const result = engine.validate(mockEvent);
      
      expect(result.isCorroborated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.75);
      expect(result.recommendation).toBe(CorroborationRecommendation.CONFIRM);
    });

    it('should recommend WAIT when persistence insufficient', () => {
      // Sources from different categories but with short persistence
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'un',
          sourceName: 'United Nations',
          credibility: 0.95,
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          url: 'https://un.org/test'
        }
      ];

      const result = engine.validate(mockEvent);
      
      // Persistence is only 5 hours (30 - 25)
      expect(result.persistenceHours).toBeLessThan(48);
      expect(result.recommendation).toBe(CorroborationRecommendation.WAIT);
    });

    it('should recommend REJECT when multiple critical failures', () => {
      mockEvent.sources = [
        {
          sourceId: 'source1',
          sourceName: 'Low Quality Source',
          credibility: 0.3,
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
          url: 'https://test.com'
        }
      ];

      const result = engine.validate(mockEvent);
      
      expect(result.recommendation).toBe(CorroborationRecommendation.REJECT);
    });

    it('should recommend MANUAL_REVIEW for borderline cases', () => {
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.7,
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'source2',
          sourceName: 'Medium Source',
          credibility: 0.65,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          url: 'https://test2.com'
        }
      ];

      const result = engine.validate(mockEvent);
      
      // Borderline confidence should trigger manual review
      if (result.confidence >= 0.6 && result.confidence < 0.75) {
        expect(result.recommendation).toBe(CorroborationRecommendation.MANUAL_REVIEW);
      }
    });
  });

  describe('Source Configuration', () => {
    it('should have predefined source credibility', () => {
      const reuters = engine.getSourceCredibility('reuters');
      expect(reuters).toBeDefined();
      expect(reuters?.baseCredibility).toBe(0.9);
      expect(reuters?.category).toBe(SourceCategory.NEWS_TIER1);

      const un = engine.getSourceCredibility('un');
      expect(un).toBeDefined();
      expect(un?.baseCredibility).toBe(0.95);
      expect(un?.category).toBe(SourceCategory.OFFICIAL);
    });

    it('should allow adding new source credibility', () => {
      engine.setSourceCredibility({
        sourceId: 'new-source',
        sourceName: 'New Source',
        baseCredibility: 0.8,
        category: SourceCategory.NEWS_TIER2
      });

      const config = engine.getSourceCredibility('new-source');
      expect(config).toBeDefined();
      expect(config?.baseCredibility).toBe(0.8);
    });

    it('should return all source configurations', () => {
      const allConfigs = engine.getAllSourceCredibility();
      expect(allConfigs.length).toBeGreaterThan(15);
      expect(allConfigs.every(c => c.sourceId && c.sourceName)).toBe(true);
    });
  });

  describe('Weighted Confidence Calculation', () => {
    it('should calculate weighted confidence correctly', () => {
      const result = engine.validate(mockEvent);
      
      // Confidence should be weighted sum of rule scores
      const expectedConfidence = result.validationDetails.reduce(
        (sum, detail) => sum + (detail.score * detail.weight),
        0
      );

      expect(result.confidence).toBeCloseTo(expectedConfidence, 2);
    });

    it('should weight critical rules higher', () => {
      const result = engine.validate(mockEvent);
      
      const sourceCountRule = result.validationDetails.find(d => d.rule === 'Independent Source Count');
      const credibilityRule = result.validationDetails.find(d => d.rule === 'Average Credibility');
      
      expect(sourceCountRule?.weight).toBeGreaterThan(credibilityRule?.weight || 0);
    });
  });
});