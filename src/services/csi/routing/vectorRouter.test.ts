/**
 * Unit tests for Vector Router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorRouter, RiskVector, EventContent } from './vectorRouter';

describe('VectorRouter', () => {
  let router: VectorRouter;

  beforeEach(() => {
    router = new VectorRouter();
  });

  describe('Conflict & Security (SC1)', () => {
    it('should route military conflict to SC1', () => {
      const content: EventContent = {
        title: 'Military forces clash at border',
        description: 'Armed conflict erupts between two nations with troops deployed',
        tags: ['military', 'conflict']
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC1_CONFLICT);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route missile attack to SC1', () => {
      const content: EventContent = {
        title: 'Missile strike targets military base',
        description: 'Multiple missiles launched in coordinated attack on defense installations'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC1_CONFLICT);
    });

    it('should detect war-related keywords', () => {
      const content: EventContent = {
        title: 'War escalates with bombing campaign',
        description: 'Aerial bombing intensifies as hostilities continue'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC1_CONFLICT);
      expect(result.matchedKeywords[RiskVector.SC1_CONFLICT]).toContain('war');
      expect(result.matchedKeywords[RiskVector.SC1_CONFLICT]).toContain('bombing');
    });
  });

  describe('Sanctions & Export Controls (SC2)', () => {
    it('should route sanctions announcement to SC2', () => {
      const content: EventContent = {
        title: 'New sanctions imposed on country',
        description: 'Economic sanctions target key sectors with asset freezes and export controls'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC2_SANCTIONS);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route embargo to SC2', () => {
      const content: EventContent = {
        title: 'Trade embargo announced',
        description: 'Comprehensive embargo restricts all trade activities'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC2_SANCTIONS);
    });

    it('should route entity list additions to SC2', () => {
      const content: EventContent = {
        title: 'Companies added to blacklist',
        description: 'Export control entity list expanded with new prohibited parties'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC2_SANCTIONS);
    });
  });

  describe('Trade Policy & Tariffs (SC3)', () => {
    it('should route tariff announcement to SC3', () => {
      const content: EventContent = {
        title: 'New tariffs on imports',
        description: '25% tariff imposed on imported goods in trade war escalation'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC3_TRADE);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route trade dispute to SC3', () => {
      const content: EventContent = {
        title: 'WTO trade dispute filed',
        description: 'Country files complaint over trade barriers and protectionism'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC3_TRADE);
    });

    it('should route customs restrictions to SC3', () => {
      const content: EventContent = {
        title: 'Customs delays at border',
        description: 'New import quotas and duty requirements slow trade'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC3_TRADE);
    });
  });

  describe('Governance & Political Instability (SC4)', () => {
    it('should route coup attempt to SC4', () => {
      const content: EventContent = {
        title: 'Military coup attempt',
        description: 'Government faces attempted overthrow amid political crisis'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC4_GOVERNANCE);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route election to SC4', () => {
      const content: EventContent = {
        title: 'National election results disputed',
        description: 'Political instability follows contested election outcome'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC4_GOVERNANCE);
    });

    it('should route corruption scandal to SC4', () => {
      const content: EventContent = {
        title: 'Government corruption scandal',
        description: 'High-level officials implicated in corruption investigation'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC4_GOVERNANCE);
    });
  });

  describe('Cyber & Technology Risk (SC5)', () => {
    it('should route cyber attack to SC5', () => {
      const content: EventContent = {
        title: 'Major cyber attack on infrastructure',
        description: 'Ransomware attack targets critical systems causing data breach'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC5_CYBER);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route data breach to SC5', () => {
      const content: EventContent = {
        title: 'Massive data breach exposed',
        description: 'Hacking incident compromises sensitive information'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC5_CYBER);
    });

    it('should route technology ban to SC5', () => {
      const content: EventContent = {
        title: 'Technology restrictions announced',
        description: 'Government bans foreign telecommunications equipment'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC5_CYBER);
    });
  });

  describe('Social Unrest & Labor Disputes (SC6)', () => {
    it('should route mass protest to SC6', () => {
      const content: EventContent = {
        title: 'Mass protests erupt',
        description: 'Widespread demonstrations and civil unrest with riot police deployed'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC6_UNREST);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route general strike to SC6', () => {
      const content: EventContent = {
        title: 'National strike paralyzes economy',
        description: 'Labor unions call general strike over working conditions'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC6_UNREST);
    });

    it('should route emergency declaration to SC6', () => {
      const content: EventContent = {
        title: 'State of emergency declared',
        description: 'Government imposes curfew amid social unrest'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC6_UNREST);
    });
  });

  describe('Currency & Capital Controls (SC7)', () => {
    it('should route capital controls to SC7', () => {
      const content: EventContent = {
        title: 'Capital controls imposed',
        description: 'Central bank restricts foreign exchange and currency transfers'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC7_CURRENCY);
      expect(result.primaryConfidence).toBeGreaterThan(0.7);
    });

    it('should route currency devaluation to SC7', () => {
      const content: EventContent = {
        title: 'Currency devaluation announced',
        description: 'Monetary policy shift leads to forex crisis'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC7_CURRENCY);
    });

    it('should route central bank intervention to SC7', () => {
      const content: EventContent = {
        title: 'Central bank emergency measures',
        description: 'Monetary authority intervenes to stabilize currency'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC7_CURRENCY);
    });
  });

  describe('Secondary Vectors', () => {
    it('should identify secondary vectors when multiple themes present', () => {
      const content: EventContent = {
        title: 'Sanctions trigger trade war with tariffs',
        description: 'Economic sanctions lead to retaliatory tariffs and trade dispute escalation'
      };

      const result = router.route(content);
      // Both SC2 (sanctions) and SC3 (trade) should have high scores
      // The primary could be either depending on keyword matches
      const hasSanctionsOrTrade = 
        result.primaryVector === RiskVector.SC2_SANCTIONS || 
        result.primaryVector === RiskVector.SC3_TRADE;
      expect(hasSanctionsOrTrade).toBe(true);
      
      // Should have secondary vectors
      expect(result.secondaryVectors.length).toBeGreaterThan(0);
      
      // The other vector should be in secondary
      const otherVector = result.primaryVector === RiskVector.SC2_SANCTIONS 
        ? RiskVector.SC3_TRADE 
        : RiskVector.SC2_SANCTIONS;
      expect(result.secondaryVectors.some(sv => sv.vector === otherVector)).toBe(true);
    });

    it('should not assign secondary vector if confidence too low', () => {
      const content: EventContent = {
        title: 'Cyber attack',
        description: 'Hacking incident reported'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC5_CYBER);
      // All secondary vectors should have confidence below 0.3 (filtered out)
      // or there should be no secondary vectors at all
      expect(result.secondaryVectors.every(sv => sv.confidence >= 0.3)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const content: EventContent = {
        title: '',
        description: ''
      };

      const result = router.route(content);
      expect(result.primaryConfidence).toBeLessThan(0.3);
    });

    it('should handle ambiguous content', () => {
      const content: EventContent = {
        title: 'Country faces challenges',
        description: 'Multiple issues affecting the nation'
      };

      const result = router.route(content);
      expect(result.primaryConfidence).toBeLessThan(0.5);
    });

    it('should normalize text correctly', () => {
      const content: EventContent = {
        title: 'MILITARY!!! Attack??? (Breaking)',
        description: 'Armed-forces deployed... conflict escalates!!!'
      };

      const result = router.route(content);
      expect(result.primaryVector).toBe(RiskVector.SC1_CONFLICT);
    });
  });

  describe('Utility Methods', () => {
    it('should return vector definition', () => {
      const definition = router.getVectorDefinition(RiskVector.SC1_CONFLICT);
      expect(definition).toBeDefined();
      expect(definition?.vector).toBe(RiskVector.SC1_CONFLICT);
      expect(definition?.name).toBe('Conflict & Military Action');
    });

    it('should return all vector definitions', () => {
      const definitions = router.getAllVectorDefinitions();
      expect(definitions.length).toBe(7);
      expect(definitions.every(d => d.vector && d.name)).toBe(true);
    });
  });
});