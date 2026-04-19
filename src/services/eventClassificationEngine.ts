/**
 * Event Classification Engine
 * 
 * Provides intelligent classification and impact assessment for external events.
 * Uses rule-based classification with preparation for future ML model integration.
 * 
 * Key Functions:
 * - Event category classification
 * - Severity assessment
 * - CSI impact estimation
 * - Affected countries identification
 * - Vector impact breakdown
 */

import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

/**
 * Raw event from external sources (ACLED, GDELT, news feeds)
 */
export interface RawEvent {
  id: string;
  title: string;
  description: string;
  country?: string;
  location?: string;
  date: Date;
  source: string;
  actors?: string[];
  keywords?: string[];
  sentiment?: number;  // -1 to 1
  magnitude?: number;  // 0 to 10
  fatalities?: number;
  metadata?: Record<string, any>;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  category: EventCategory;
  confidence: number;  // 0 to 1
  alternativeCategories: Array<{ category: EventCategory; confidence: number }>;
}

/**
 * Severity assessment result
 */
export interface SeverityAssessment {
  severity: EventSeverity;
  confidence: number;
  factors: string[];
}

/**
 * CSI impact estimation result
 */
export interface CSIImpactEstimation {
  deltaCSI: number;
  confidence: number;
  reasoning: string;
}

/**
 * Vector impacts breakdown
 */
export interface VectorImpactsBreakdown {
  conflict?: number;
  sanctions?: number;
  trade?: number;
  governance?: number;
  cyber?: number;
  unrest?: number;
  currency?: number;
}

/**
 * Event Classification Engine
 */
export class EventClassificationEngine {
  private categoryKeywords: Map<EventCategory, string[]>;
  private severityFactors: Map<string, number>;

  constructor() {
    this.initializeCategoryKeywords();
    this.initializeSeverityFactors();
  }

  /**
   * Classify event into appropriate category
   */
  classifyEvent(rawEvent: RawEvent): ClassificationResult {
    const scores = new Map<EventCategory, number>();

    // Extract text for analysis
    const text = `${rawEvent.title} ${rawEvent.description}`.toLowerCase();
    const keywords = rawEvent.keywords || [];

    // Score each category based on keyword matches
    for (const [category, categoryKeywords] of this.categoryKeywords.entries()) {
      let score = 0;

      for (const keyword of categoryKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // Boost score if keywords array matches
      for (const keyword of keywords) {
        if (categoryKeywords.some(ck => keyword.toLowerCase().includes(ck.toLowerCase()))) {
          score += 0.5;
        }
      }

      scores.set(category, score);
    }

    // Apply actor-based rules
    if (rawEvent.actors) {
      this.applyActorRules(rawEvent.actors, scores);
    }

    // Apply metadata-based rules
    if (rawEvent.metadata) {
      this.applyMetadataRules(rawEvent.metadata, scores);
    }

    // Sort categories by score
    const sortedCategories = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Calculate confidence (normalized score)
    const totalScore = Array.from(scores.values()).reduce((sum, s) => sum + s, 0);
    const topScore = sortedCategories[0]?.[1] || 0;
    const confidence = totalScore > 0 ? topScore / totalScore : 0.5;

    return {
      category: sortedCategories[0]?.[0] || 'Governance',
      confidence,
      alternativeCategories: sortedCategories.slice(1, 4).map(([category, score]) => ({
        category,
        confidence: totalScore > 0 ? score / totalScore : 0
      }))
    };
  }

  /**
   * Assess event severity
   */
  assessSeverity(rawEvent: RawEvent): SeverityAssessment {
    const factors: string[] = [];
    let severityScore = 0;

    // Factor 1: Fatalities
    if (rawEvent.fatalities !== undefined) {
      if (rawEvent.fatalities > 100) {
        severityScore += 4;
        factors.push(`High fatalities (${rawEvent.fatalities})`);
      } else if (rawEvent.fatalities > 10) {
        severityScore += 3;
        factors.push(`Significant fatalities (${rawEvent.fatalities})`);
      } else if (rawEvent.fatalities > 0) {
        severityScore += 2;
        factors.push(`Fatalities reported (${rawEvent.fatalities})`);
      }
    }

    // Factor 2: Magnitude
    if (rawEvent.magnitude !== undefined) {
      if (rawEvent.magnitude > 8) {
        severityScore += 3;
        factors.push('Very high magnitude event');
      } else if (rawEvent.magnitude > 5) {
        severityScore += 2;
        factors.push('High magnitude event');
      } else if (rawEvent.magnitude > 3) {
        severityScore += 1;
        factors.push('Moderate magnitude event');
      }
    }

    // Factor 3: Sentiment (negative sentiment = higher severity)
    if (rawEvent.sentiment !== undefined && rawEvent.sentiment < -0.5) {
      severityScore += 2;
      factors.push('Highly negative sentiment');
    }

    // Factor 4: Keywords
    const text = `${rawEvent.title} ${rawEvent.description}`.toLowerCase();
    const criticalKeywords = ['war', 'attack', 'crisis', 'collapse', 'massacre', 'coup', 'invasion'];
    const highKeywords = ['conflict', 'violence', 'protest', 'strike', 'sanctions', 'cyber attack'];
    
    if (criticalKeywords.some(kw => text.includes(kw))) {
      severityScore += 3;
      factors.push('Critical keywords detected');
    } else if (highKeywords.some(kw => text.includes(kw))) {
      severityScore += 2;
      factors.push('High-severity keywords detected');
    }

    // Factor 5: Multiple actors (indicates complexity)
    if (rawEvent.actors && rawEvent.actors.length > 2) {
      severityScore += 1;
      factors.push('Multiple actors involved');
    }

    // Determine severity level
    let severity: EventSeverity;
    let confidence: number;

    if (severityScore >= 8) {
      severity = 'Critical';
      confidence = 0.9;
    } else if (severityScore >= 5) {
      severity = 'High';
      confidence = 0.8;
    } else if (severityScore >= 2) {
      severity = 'Moderate';
      confidence = 0.7;
    } else {
      severity = 'Low';
      confidence = 0.6;
    }

    return {
      severity,
      confidence,
      factors
    };
  }

  /**
   * Estimate CSI impact
   */
  estimateCSIImpact(rawEvent: RawEvent, category: EventCategory, severity: EventSeverity): CSIImpactEstimation {
    const reasoning: string[] = [];

    // Base impact from severity
    const severityImpacts: Record<EventSeverity, number> = {
      'Critical': 6.0,
      'High': 3.0,
      'Moderate': 1.5,
      'Low': 0.5
    };

    let deltaCSI = severityImpacts[severity];
    reasoning.push(`Base impact from ${severity} severity: ${deltaCSI}`);

    // Adjust based on category
    const categoryMultipliers: Record<EventCategory, number> = {
      'Conflict': 1.5,
      'Sanctions': 1.3,
      'Cyber': 1.2,
      'Unrest': 1.1,
      'Currency': 1.4,
      'Governance': 1.0,
      'Trade': 0.8,
      'Protest': 0.7,
      'Regulatory': 0.6,
      'Diplomatic': 0.5,
      'Infrastructure': 0.4,
      'Economic Policy': 0.8,
      'Military Posture': 1.2,
      'Corporate': 0.5
    };

    const multiplier = categoryMultipliers[category] || 1.0;
    deltaCSI *= multiplier;
    reasoning.push(`Category multiplier (${category}): ${multiplier}x`);

    // Adjust based on sentiment (negative events increase risk)
    if (rawEvent.sentiment !== undefined) {
      if (rawEvent.sentiment < 0) {
        deltaCSI *= (1 + Math.abs(rawEvent.sentiment) * 0.5);
        reasoning.push(`Negative sentiment adjustment: +${(Math.abs(rawEvent.sentiment) * 50).toFixed(0)}%`);
      } else {
        // Positive events decrease risk
        deltaCSI *= -(1 + rawEvent.sentiment * 0.3);
        reasoning.push(`Positive sentiment: risk decrease`);
      }
    }

    // Adjust based on fatalities
    if (rawEvent.fatalities && rawEvent.fatalities > 0) {
      const fatalityImpact = Math.min(rawEvent.fatalities * 0.05, 3.0);
      deltaCSI += fatalityImpact;
      reasoning.push(`Fatality impact: +${fatalityImpact.toFixed(1)}`);
    }

    // Cap deltaCSI
    deltaCSI = Math.max(-5.0, Math.min(10.0, deltaCSI));

    // Calculate confidence based on available data
    let confidence = 0.5;
    if (rawEvent.magnitude !== undefined) confidence += 0.1;
    if (rawEvent.sentiment !== undefined) confidence += 0.1;
    if (rawEvent.fatalities !== undefined) confidence += 0.1;
    if (rawEvent.actors && rawEvent.actors.length > 0) confidence += 0.1;
    confidence = Math.min(confidence, 0.9);

    return {
      deltaCSI: parseFloat(deltaCSI.toFixed(1)),
      confidence,
      reasoning: reasoning.join('; ')
    };
  }

  /**
   * Identify affected countries
   */
  identifyAffectedCountries(rawEvent: RawEvent): string[] {
    const affectedCountries = new Set<string>();

    // Primary country
    if (rawEvent.country) {
      affectedCountries.add(rawEvent.country);
    }

    // Extract countries from actors
    if (rawEvent.actors) {
      for (const actor of rawEvent.actors) {
        const country = this.extractCountryFromActor(actor);
        if (country) {
          affectedCountries.add(country);
        }
      }
    }

    // Extract countries from text
    const text = `${rawEvent.title} ${rawEvent.description}`;
    const countries = this.extractCountriesFromText(text);
    countries.forEach(c => affectedCountries.add(c));

    // Add regional spillover countries based on category
    const spilloverCountries = this.identifySpilloverCountries(
      Array.from(affectedCountries),
      rawEvent
    );
    spilloverCountries.forEach(c => affectedCountries.add(c));

    return Array.from(affectedCountries);
  }

  /**
   * Calculate vector impacts breakdown
   */
  calculateVectorImpacts(
    rawEvent: RawEvent,
    category: EventCategory,
    deltaCSI: number
  ): VectorImpactsBreakdown {
    const impacts: VectorImpactsBreakdown = {};

    // Primary vector based on category
    const primaryVectorMap: Record<EventCategory, keyof VectorImpactsBreakdown> = {
      'Conflict': 'conflict',
      'Sanctions': 'sanctions',
      'Trade': 'trade',
      'Governance': 'governance',
      'Cyber': 'cyber',
      'Unrest': 'unrest',
      'Currency': 'currency',
      'Protest': 'unrest',
      'Regulatory': 'governance',
      'Diplomatic': 'governance',
      'Infrastructure': 'trade',
      'Economic Policy': 'trade',
      'Military Posture': 'conflict',
      'Corporate': 'trade'
    };

    const primaryVector = primaryVectorMap[category];
    if (primaryVector) {
      impacts[primaryVector] = Math.abs(deltaCSI) * 0.7;
    }

    // Secondary vectors based on event characteristics
    if (category === 'Conflict' || category === 'Military Posture') {
      impacts.governance = Math.abs(deltaCSI) * 0.3;
    }

    if (category === 'Sanctions' || category === 'Trade') {
      impacts.currency = Math.abs(deltaCSI) * 0.2;
    }

    if (category === 'Unrest' || category === 'Protest') {
      impacts.governance = Math.abs(deltaCSI) * 0.4;
    }

    if (category === 'Cyber') {
      impacts.conflict = Math.abs(deltaCSI) * 0.2;
      impacts.governance = Math.abs(deltaCSI) * 0.2;
    }

    return impacts;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private initializeCategoryKeywords(): void {
    this.categoryKeywords = new Map([
      ['Conflict', ['war', 'battle', 'combat', 'military', 'armed', 'attack', 'strike', 'bombing', 'invasion', 'assault', 'fighting', 'casualties']],
      ['Sanctions', ['sanctions', 'embargo', 'restrictions', 'ban', 'export control', 'trade ban', 'economic pressure', 'penalties']],
      ['Trade', ['trade', 'tariff', 'export', 'import', 'commerce', 'agreement', 'deal', 'supply chain', 'goods', 'customs']],
      ['Governance', ['government', 'election', 'policy', 'legislation', 'parliament', 'congress', 'administration', 'regime', 'political', 'democracy']],
      ['Cyber', ['cyber', 'hack', 'breach', 'ransomware', 'malware', 'data', 'digital', 'internet', 'network', 'attack']],
      ['Unrest', ['unrest', 'riot', 'violence', 'clashes', 'disorder', 'chaos', 'turmoil', 'uprising']],
      ['Currency', ['currency', 'exchange', 'devaluation', 'inflation', 'monetary', 'central bank', 'interest rate', 'forex']],
      ['Protest', ['protest', 'demonstration', 'rally', 'march', 'strike', 'walkout', 'sit-in', 'boycott']],
      ['Regulatory', ['regulation', 'compliance', 'law', 'rule', 'standard', 'requirement', 'enforcement', 'oversight']],
      ['Diplomatic', ['diplomatic', 'negotiation', 'talks', 'summit', 'treaty', 'agreement', 'relations', 'ambassador']],
      ['Infrastructure', ['infrastructure', 'construction', 'project', 'facility', 'transport', 'energy', 'utilities', 'development']],
      ['Economic Policy', ['economic', 'fiscal', 'budget', 'stimulus', 'austerity', 'reform', 'gdp', 'growth']],
      ['Military Posture', ['deployment', 'exercises', 'readiness', 'defense', 'forces', 'troops', 'military base', 'strategic']],
      ['Corporate', ['company', 'corporation', 'business', 'industry', 'market', 'investment', 'merger', 'acquisition']]
    ]);
  }

  private initializeSeverityFactors(): void {
    // Severity factors for future ML model training
    // Currently used for reference in severity assessment
    this.severityFactors = new Map([
      ['fatalities', 3.0],
      ['magnitude', 2.0],
      ['sentiment', 1.5],
      ['actors', 1.0],
      ['keywords', 2.0]
    ]);
  }

  private applyActorRules(actors: string[], scores: Map<EventCategory, number>): void {
    for (const actor of actors) {
      const lowerActor = actor.toLowerCase();
      
      if (lowerActor.includes('military') || lowerActor.includes('armed forces')) {
        scores.set('Conflict', (scores.get('Conflict') || 0) + 2);
      }
      
      if (lowerActor.includes('government') || lowerActor.includes('ministry')) {
        scores.set('Governance', (scores.get('Governance') || 0) + 1.5);
      }
      
      if (lowerActor.includes('protesters') || lowerActor.includes('demonstrators')) {
        scores.set('Protest', (scores.get('Protest') || 0) + 2);
      }
    }
  }

  private applyMetadataRules(metadata: Record<string, any>, scores: Map<EventCategory, number>): void {
    if (metadata.eventType) {
      const eventType = metadata.eventType.toLowerCase();
      
      if (eventType.includes('cyber')) {
        scores.set('Cyber', (scores.get('Cyber') || 0) + 3);
      }
      
      if (eventType.includes('sanction')) {
        scores.set('Sanctions', (scores.get('Sanctions') || 0) + 3);
      }
    }
  }

  private extractCountryFromActor(actor: string): string | null {
    // Simple country extraction - in production, use NER or country detection library
    const countryKeywords = [
      'United States', 'China', 'Russia', 'India', 'Brazil', 'United Kingdom',
      'France', 'Germany', 'Japan', 'South Korea', 'Mexico', 'Canada',
      'Australia', 'Iraq', 'Iran', 'Israel', 'Saudi Arabia', 'Turkey'
    ];

    for (const country of countryKeywords) {
      if (actor.includes(country)) {
        return country;
      }
    }

    return null;
  }

  private extractCountriesFromText(text: string): string[] {
    const countries: string[] = [];
    const countryKeywords = [
      'United States', 'China', 'Russia', 'India', 'Brazil', 'United Kingdom',
      'France', 'Germany', 'Japan', 'South Korea', 'Mexico', 'Canada',
      'Australia', 'Iraq', 'Iran', 'Israel', 'Saudi Arabia', 'Turkey',
      'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Ethiopia'
    ];

    for (const country of countryKeywords) {
      if (text.includes(country)) {
        countries.push(country);
      }
    }

    return countries;
  }

  private identifySpilloverCountries(primaryCountries: string[], rawEvent: RawEvent): string[] {
    const spillover: string[] = [];

    // Regional spillover logic
    const regionalGroups: Record<string, string[]> = {
      'Middle East': ['Iraq', 'Iran', 'Israel', 'Saudi Arabia', 'Turkey', 'Syria', 'Lebanon', 'Jordan'],
      'East Asia': ['China', 'Japan', 'South Korea', 'Taiwan', 'North Korea'],
      'Europe': ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Poland'],
      'North America': ['United States', 'Canada', 'Mexico']
    };

    for (const country of primaryCountries) {
      for (const [region, countries] of Object.entries(regionalGroups)) {
        if (countries.includes(country)) {
          // Add neighboring countries if event is severe
          if (rawEvent.magnitude && rawEvent.magnitude > 7) {
            spillover.push(...countries.filter(c => c !== country));
          }
        }
      }
    }

    return spillover;
  }
}

/**
 * Singleton instance
 */
export const eventClassificationEngine = new EventClassificationEngine();