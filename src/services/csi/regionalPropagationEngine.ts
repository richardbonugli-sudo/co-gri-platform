/**
 * Regional Propagation Engine
 * 
 * Calculates spillover effects of geopolitical events to related countries.
 * Manages regional relationships and applies decay factors based on
 * geographic and political distance.
 */

import type { EventCategory } from '@/data/geopoliticalEvents';
import type { ClassificationResult } from './eventClassificationEngine';

export interface RegionalRelationship {
  country: string;
  region: string;
  neighbors: string[];
  allies: string[];
  rivals: string[];
  tradePartners: string[];
  regionalBloc?: string;
}

export interface PropagationEffect {
  targetCountry: string;
  sourceCountry: string;
  sourceEventId: string;
  propagationType: 'neighbor' | 'ally' | 'rival' | 'trade' | 'regional' | 'global';
  decayFactor: number; // 0-1, how much the effect is reduced
  propagatedDeltaCSI: number;
  vectorCategory: EventCategory;
  propagatedAt: Date;
  reasoning: string;
}

export interface PropagationChain {
  originEventId: string;
  originCountry: string;
  effects: PropagationEffect[];
  totalAffectedCountries: number;
  totalPropagatedCSI: number;
}

// Regional bloc definitions
const REGIONAL_BLOCS: Record<string, string[]> = {
  'EU': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Poland', 'Romania', 'Czech Republic', 'Hungary', 'Portugal', 'Greece', 'Sweden', 'Austria', 'Bulgaria', 'Denmark', 'Finland', 'Slovakia', 'Ireland', 'Croatia', 'Lithuania', 'Slovenia', 'Latvia', 'Estonia', 'Cyprus', 'Luxembourg', 'Malta'],
  'NATO': ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Italy', 'Spain', 'Turkey', 'Poland', 'Netherlands', 'Belgium', 'Czech Republic', 'Hungary', 'Portugal', 'Greece', 'Norway', 'Denmark', 'Romania', 'Bulgaria', 'Slovakia', 'Slovenia', 'Croatia', 'Albania', 'Lithuania', 'Latvia', 'Estonia', 'Iceland', 'Luxembourg', 'Montenegro', 'North Macedonia', 'Finland', 'Sweden'],
  'GCC': ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
  'ASEAN': ['Indonesia', 'Thailand', 'Malaysia', 'Singapore', 'Philippines', 'Vietnam', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
  'BRICS': ['Brazil', 'Russia', 'India', 'China', 'South Africa', 'Iran', 'Egypt', 'Ethiopia', 'United Arab Emirates'],
  'AU': ['Egypt', 'Nigeria', 'South Africa', 'Ethiopia', 'Kenya', 'Algeria', 'Morocco', 'Sudan', 'Ghana', 'Tanzania'],
  'MERCOSUR': ['Brazil', 'Argentina', 'Paraguay', 'Uruguay'],
  'SCO': ['China', 'Russia', 'India', 'Pakistan', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Iran', 'Belarus'],
};

// Country relationships database
const COUNTRY_RELATIONSHIPS: Record<string, Partial<RegionalRelationship>> = {
  // Middle East
  'Iran': {
    neighbors: ['Iraq', 'Turkey', 'Afghanistan', 'Pakistan', 'Turkmenistan', 'Azerbaijan', 'Armenia'],
    allies: ['Syria', 'Lebanon', 'Yemen', 'Russia', 'China'],
    rivals: ['Israel', 'Saudi Arabia', 'United States', 'United Arab Emirates'],
    tradePartners: ['China', 'Turkey', 'Iraq', 'United Arab Emirates', 'India']
  },
  'Israel': {
    neighbors: ['Lebanon', 'Syria', 'Jordan', 'Egypt', 'Palestine'],
    allies: ['United States', 'United Kingdom', 'Germany', 'France'],
    rivals: ['Iran', 'Syria', 'Lebanon'],
    tradePartners: ['United States', 'China', 'United Kingdom', 'Germany', 'Belgium']
  },
  'Lebanon': {
    neighbors: ['Syria', 'Israel'],
    allies: ['Iran', 'France'],
    rivals: ['Israel'],
    tradePartners: ['United Arab Emirates', 'Saudi Arabia', 'China', 'Turkey']
  },
  'Saudi Arabia': {
    neighbors: ['Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait', 'Iraq', 'Jordan'],
    allies: ['United States', 'United Kingdom', 'United Arab Emirates', 'Egypt'],
    rivals: ['Iran', 'Qatar'],
    tradePartners: ['China', 'Japan', 'South Korea', 'India', 'United States']
  },
  'Yemen': {
    neighbors: ['Saudi Arabia', 'Oman'],
    allies: ['Iran'],
    rivals: ['Saudi Arabia', 'United Arab Emirates'],
    tradePartners: ['China', 'United Arab Emirates', 'India', 'Saudi Arabia']
  },
  'Syria': {
    neighbors: ['Turkey', 'Iraq', 'Jordan', 'Israel', 'Lebanon'],
    allies: ['Russia', 'Iran'],
    rivals: ['Israel', 'Turkey', 'United States'],
    tradePartners: ['Russia', 'Iran', 'China', 'Lebanon']
  },
  // Eastern Europe / Russia
  'Russia': {
    neighbors: ['Ukraine', 'Belarus', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Georgia', 'Azerbaijan', 'Kazakhstan', 'Mongolia', 'China', 'North Korea'],
    allies: ['Belarus', 'China', 'Iran', 'North Korea', 'Syria'],
    rivals: ['United States', 'United Kingdom', 'Ukraine', 'Poland'],
    tradePartners: ['China', 'Germany', 'Netherlands', 'Turkey', 'Belarus']
  },
  'Ukraine': {
    neighbors: ['Russia', 'Belarus', 'Poland', 'Slovakia', 'Hungary', 'Romania', 'Moldova'],
    allies: ['United States', 'United Kingdom', 'Poland', 'Germany', 'France'],
    rivals: ['Russia', 'Belarus'],
    tradePartners: ['China', 'Poland', 'Russia', 'Turkey', 'Germany']
  },
  'Belarus': {
    neighbors: ['Russia', 'Ukraine', 'Poland', 'Lithuania', 'Latvia'],
    allies: ['Russia', 'China'],
    rivals: ['Poland', 'Lithuania', 'Ukraine'],
    tradePartners: ['Russia', 'Ukraine', 'China', 'Germany', 'Poland']
  },
  // East Asia
  'China': {
    neighbors: ['Russia', 'Mongolia', 'North Korea', 'Vietnam', 'Laos', 'Myanmar', 'India', 'Bhutan', 'Nepal', 'Pakistan', 'Afghanistan', 'Tajikistan', 'Kyrgyzstan', 'Kazakhstan'],
    allies: ['Russia', 'Pakistan', 'North Korea', 'Iran'],
    rivals: ['United States', 'Japan', 'India', 'Taiwan', 'Australia'],
    tradePartners: ['United States', 'Japan', 'South Korea', 'Vietnam', 'Germany']
  },
  'Taiwan': {
    neighbors: ['China', 'Japan', 'Philippines'],
    allies: ['United States', 'Japan'],
    rivals: ['China'],
    tradePartners: ['China', 'United States', 'Japan', 'Singapore', 'South Korea']
  },
  'North Korea': {
    neighbors: ['South Korea', 'China', 'Russia'],
    allies: ['China', 'Russia'],
    rivals: ['South Korea', 'United States', 'Japan'],
    tradePartners: ['China', 'Russia']
  },
  'South Korea': {
    neighbors: ['North Korea'],
    allies: ['United States', 'Japan'],
    rivals: ['North Korea'],
    tradePartners: ['China', 'United States', 'Vietnam', 'Japan', 'Hong Kong']
  },
  // South Asia
  'India': {
    neighbors: ['Pakistan', 'China', 'Nepal', 'Bhutan', 'Bangladesh', 'Myanmar', 'Sri Lanka'],
    allies: ['United States', 'Japan', 'France', 'United Kingdom'],
    rivals: ['Pakistan', 'China'],
    tradePartners: ['United States', 'China', 'United Arab Emirates', 'Saudi Arabia', 'Iraq']
  },
  'Pakistan': {
    neighbors: ['India', 'China', 'Afghanistan', 'Iran'],
    allies: ['China', 'Turkey', 'Saudi Arabia'],
    rivals: ['India', 'Afghanistan'],
    tradePartners: ['China', 'United Arab Emirates', 'United States', 'Saudi Arabia', 'Indonesia']
  },
  // Africa
  'Sudan': {
    neighbors: ['Egypt', 'Libya', 'Chad', 'Central African Republic', 'South Sudan', 'Ethiopia', 'Eritrea'],
    allies: ['Russia', 'China', 'United Arab Emirates'],
    rivals: ['Ethiopia'],
    tradePartners: ['China', 'United Arab Emirates', 'Saudi Arabia', 'India', 'Egypt']
  },
  'Nigeria': {
    neighbors: ['Benin', 'Niger', 'Chad', 'Cameroon'],
    allies: ['United States', 'United Kingdom', 'China'],
    rivals: [],
    tradePartners: ['India', 'Spain', 'Netherlands', 'France', 'China']
  },
  // Americas
  'Venezuela': {
    neighbors: ['Colombia', 'Brazil', 'Guyana'],
    allies: ['Russia', 'China', 'Cuba', 'Iran'],
    rivals: ['United States', 'Colombia'],
    tradePartners: ['China', 'India', 'United States', 'Spain', 'Brazil']
  },
  'Haiti': {
    neighbors: ['Dominican Republic'],
    allies: ['United States', 'France'],
    rivals: [],
    tradePartners: ['United States', 'Dominican Republic', 'China']
  }
};

// Decay factors by relationship type
const DECAY_FACTORS: Record<string, number> = {
  neighbor: 0.4,      // 40% of original impact
  ally: 0.35,         // 35% of original impact
  rival: 0.5,         // 50% of original impact (rivals are highly affected)
  trade: 0.25,        // 25% of original impact
  regional: 0.2,      // 20% of original impact (same regional bloc)
  global: 0.1         // 10% of original impact (global spillover)
};

class RegionalPropagationEngine {
  private propagationHistory: Map<string, PropagationChain> = new Map();

  /**
   * Calculate propagation effects for an event
   */
  calculatePropagation(
    eventId: string,
    sourceCountry: string,
    classification: ClassificationResult
  ): PropagationChain {
    const effects: PropagationEffect[] = [];
    const affectedCountries = new Set<string>();

    const relationships = COUNTRY_RELATIONSHIPS[sourceCountry] || {};

    // Propagate to neighbors
    relationships.neighbors?.forEach(neighbor => {
      if (!affectedCountries.has(neighbor)) {
        const effect = this.createPropagationEffect(
          eventId, sourceCountry, neighbor, 'neighbor', classification
        );
        effects.push(effect);
        affectedCountries.add(neighbor);
      }
    });

    // Propagate to allies
    relationships.allies?.forEach(ally => {
      if (!affectedCountries.has(ally)) {
        const effect = this.createPropagationEffect(
          eventId, sourceCountry, ally, 'ally', classification
        );
        effects.push(effect);
        affectedCountries.add(ally);
      }
    });

    // Propagate to rivals (often more affected)
    relationships.rivals?.forEach(rival => {
      if (!affectedCountries.has(rival)) {
        const effect = this.createPropagationEffect(
          eventId, sourceCountry, rival, 'rival', classification
        );
        effects.push(effect);
        affectedCountries.add(rival);
      }
    });

    // Propagate to trade partners
    relationships.tradePartners?.forEach(partner => {
      if (!affectedCountries.has(partner)) {
        const effect = this.createPropagationEffect(
          eventId, sourceCountry, partner, 'trade', classification
        );
        effects.push(effect);
        affectedCountries.add(partner);
      }
    });

    // Propagate to regional bloc members
    const blocs = this.findCountryBlocs(sourceCountry);
    blocs.forEach(bloc => {
      REGIONAL_BLOCS[bloc]?.forEach(member => {
        if (member !== sourceCountry && !affectedCountries.has(member)) {
          const effect = this.createPropagationEffect(
            eventId, sourceCountry, member, 'regional', classification
          );
          effects.push(effect);
          affectedCountries.add(member);
        }
      });
    });

    const totalPropagatedCSI = effects.reduce((sum, e) => sum + Math.abs(e.propagatedDeltaCSI), 0);

    const chain: PropagationChain = {
      originEventId: eventId,
      originCountry: sourceCountry,
      effects,
      totalAffectedCountries: affectedCountries.size,
      totalPropagatedCSI: parseFloat(totalPropagatedCSI.toFixed(1))
    };

    // Store in history
    this.propagationHistory.set(eventId, chain);

    console.log(`[Propagation Engine] 🌐 Event ${eventId} propagated to ${affectedCountries.size} countries`);

    return chain;
  }

  /**
   * Create a single propagation effect
   */
  private createPropagationEffect(
    eventId: string,
    sourceCountry: string,
    targetCountry: string,
    propagationType: PropagationEffect['propagationType'],
    classification: ClassificationResult
  ): PropagationEffect {
    const decayFactor = DECAY_FACTORS[propagationType];
    const propagatedDeltaCSI = parseFloat((classification.estimatedDeltaCSI * decayFactor).toFixed(1));

    return {
      targetCountry,
      sourceCountry,
      sourceEventId: eventId,
      propagationType,
      decayFactor,
      propagatedDeltaCSI,
      vectorCategory: classification.primaryVector.vector,
      propagatedAt: new Date(),
      reasoning: `${propagationType} relationship with ${sourceCountry}: ${decayFactor * 100}% spillover effect`
    };
  }

  /**
   * Find regional blocs a country belongs to
   */
  private findCountryBlocs(country: string): string[] {
    const blocs: string[] = [];
    
    Object.entries(REGIONAL_BLOCS).forEach(([bloc, members]) => {
      if (members.includes(country)) {
        blocs.push(bloc);
      }
    });

    return blocs;
  }

  /**
   * Get propagation chain for an event
   */
  getPropagationChain(eventId: string): PropagationChain | undefined {
    return this.propagationHistory.get(eventId);
  }

  /**
   * Get all propagation effects for a target country
   */
  getEffectsForCountry(country: string): PropagationEffect[] {
    const effects: PropagationEffect[] = [];
    
    this.propagationHistory.forEach(chain => {
      chain.effects.forEach(effect => {
        if (effect.targetCountry === country) {
          effects.push(effect);
        }
      });
    });

    return effects;
  }

  /**
   * Get country relationships
   */
  getCountryRelationships(country: string): Partial<RegionalRelationship> | undefined {
    return COUNTRY_RELATIONSHIPS[country];
  }

  /**
   * Get regional blocs
   */
  getRegionalBlocs(): typeof REGIONAL_BLOCS {
    return REGIONAL_BLOCS;
  }

  /**
   * Get decay factors
   */
  getDecayFactors(): typeof DECAY_FACTORS {
    return DECAY_FACTORS;
  }

  /**
   * Clear propagation history
   */
  clearHistory(): void {
    this.propagationHistory.clear();
    console.log('[Propagation Engine] 🧹 History cleared');
  }

  /**
   * Get propagation statistics
   */
  getStatistics(): {
    totalChains: number;
    totalEffects: number;
    byPropagationType: Record<string, number>;
    topAffectedCountries: { country: string; effectCount: number }[];
  } {
    const byPropagationType: Record<string, number> = {};
    const countryEffects: Record<string, number> = {};

    this.propagationHistory.forEach(chain => {
      chain.effects.forEach(effect => {
        byPropagationType[effect.propagationType] = (byPropagationType[effect.propagationType] || 0) + 1;
        countryEffects[effect.targetCountry] = (countryEffects[effect.targetCountry] || 0) + 1;
      });
    });

    const topAffectedCountries = Object.entries(countryEffects)
      .map(([country, effectCount]) => ({ country, effectCount }))
      .sort((a, b) => b.effectCount - a.effectCount)
      .slice(0, 10);

    return {
      totalChains: this.propagationHistory.size,
      totalEffects: Object.values(byPropagationType).reduce((a, b) => a + b, 0),
      byPropagationType,
      topAffectedCountries
    };
  }
}

// Singleton instance
export const regionalPropagationEngine = new RegionalPropagationEngine();