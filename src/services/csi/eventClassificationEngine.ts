/**
 * Event Classification Engine
 * 
 * Automatically classifies geopolitical events into the 7 CSI vectors
 * and calculates severity and ΔCSI impact estimates.
 * 
 * 7-Vector CSI Model:
 * SC1: Conflict & Security (0.22 weight)
 * SC2: Sanctions & Regulatory Pressure (0.18 weight)
 * SC3: Trade & Logistics Disruption (0.16 weight)
 * SC4: Governance & Rule of Law (0.14 weight)
 * SC5: Cyber & Data Sovereignty (0.12 weight)
 * SC6: Public Unrest & Labor Instability (0.10 weight)
 * SC7: Currency & Capital Controls (0.08 weight)
 */

import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';
import type { NormalizedEvent, EventSourceType } from './eventIngestionPipeline';

export interface VectorClassification {
  vector: EventCategory;
  vectorCode: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  weight: number;
  confidence: number;
  keywords: string[];
}

export interface ClassificationResult {
  eventId: string;
  primaryVector: VectorClassification;
  secondaryVectors: VectorClassification[];
  severity: EventSeverity;
  severityScore: number; // 0-100
  estimatedDeltaCSI: number;
  confidence: number;
  classifiedAt: Date;
  reasoning: string;
}

// Vector definitions with keywords and source mappings
const VECTOR_DEFINITIONS: Record<string, {
  code: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  category: EventCategory;
  weight: number;
  keywords: string[];
  sources: EventSourceType[];
  baseSeverityMultiplier: number;
}> = {
  conflict: {
    code: 'SC1',
    category: 'Conflict',
    weight: 0.22,
    keywords: [
      'war', 'military', 'attack', 'missile', 'bomb', 'strike', 'invasion',
      'troops', 'combat', 'battle', 'offensive', 'defense', 'armed', 'weapon',
      'casualty', 'death', 'killed', 'wounded', 'conflict', 'violence',
      'terrorism', 'insurgent', 'rebel', 'militia', 'army', 'navy', 'air force',
      'drone', 'airstrike', 'shelling', 'artillery', 'border', 'territorial',
      'escalation', 'ceasefire', 'hostility', 'aggression'
    ],
    sources: ['GDELT', 'ACLED', 'UCDP', 'SIPRI', 'CSIS', 'IISS', 'EMBASSY'],
    baseSeverityMultiplier: 1.5
  },
  sanctions: {
    code: 'SC2',
    category: 'Sanctions',
    weight: 0.18,
    keywords: [
      'sanction', 'embargo', 'restriction', 'ban', 'blacklist', 'entity list',
      'export control', 'import ban', 'asset freeze', 'travel ban', 'penalty',
      'fine', 'compliance', 'regulatory', 'OFAC', 'treasury', 'designation',
      'prohibited', 'blocked', 'restricted', 'license', 'waiver'
    ],
    sources: ['OFAC', 'EU_CFSP', 'BIS', 'UN_SANCTIONS'],
    baseSeverityMultiplier: 1.3
  },
  trade: {
    code: 'SC3',
    category: 'Trade',
    weight: 0.16,
    keywords: [
      'tariff', 'trade', 'export', 'import', 'customs', 'duty', 'quota',
      'supply chain', 'logistics', 'shipping', 'port', 'cargo', 'freight',
      'container', 'maritime', 'chokepoint', 'blockade', 'trade agreement',
      'free trade', 'protectionism', 'trade war', 'commerce', 'goods'
    ],
    sources: ['WTO', 'USTR', 'OECD', 'MARITIME'],
    baseSeverityMultiplier: 1.1
  },
  governance: {
    code: 'SC4',
    category: 'Governance',
    weight: 0.14,
    keywords: [
      'election', 'government', 'parliament', 'president', 'prime minister',
      'coup', 'regime', 'constitution', 'law', 'court', 'judiciary', 'corruption',
      'democracy', 'authoritarian', 'political', 'reform', 'policy', 'legislation',
      'opposition', 'ruling party', 'cabinet', 'minister', 'official'
    ],
    sources: ['WORLD_BANK_WGI', 'FREEDOM_HOUSE', 'TRANSPARENCY_INTL'],
    baseSeverityMultiplier: 1.0
  },
  cyber: {
    code: 'SC5',
    category: 'Cyber',
    weight: 0.12,
    keywords: [
      'cyber', 'hack', 'breach', 'malware', 'ransomware', 'phishing', 'DDoS',
      'data', 'privacy', 'encryption', 'network', 'infrastructure', 'critical',
      'internet', 'outage', 'blackout', 'digital', 'information', 'security',
      'vulnerability', 'exploit', 'APT', 'state-sponsored'
    ],
    sources: ['CISA', 'ENISA', 'NETBLOCKS', 'ICT_TRACKER'],
    baseSeverityMultiplier: 1.2
  },
  unrest: {
    code: 'SC6',
    category: 'Unrest',
    weight: 0.10,
    keywords: [
      'protest', 'demonstration', 'riot', 'unrest', 'strike', 'labor', 'union',
      'march', 'rally', 'civil', 'disorder', 'crowd', 'mob', 'looting',
      'tear gas', 'police', 'crackdown', 'arrest', 'detention', 'activist',
      'dissent', 'opposition', 'movement', 'uprising'
    ],
    sources: ['OSINT', 'ACLED', 'ILO', 'LABOR_MINISTRY'],
    baseSeverityMultiplier: 0.9
  },
  currency: {
    code: 'SC7',
    category: 'Currency',
    weight: 0.08,
    keywords: [
      'currency', 'exchange rate', 'devaluation', 'inflation', 'deflation',
      'central bank', 'interest rate', 'monetary', 'fiscal', 'debt', 'default',
      'capital control', 'forex', 'FX', 'dollar', 'euro', 'yen', 'yuan',
      'bond', 'credit', 'rating', 'downgrade', 'IMF', 'bailout', 'crisis'
    ],
    sources: ['IMF_AREAER', 'BIS_FX', 'EXPORT_CONTROLS'],
    baseSeverityMultiplier: 0.8
  }
};

// Severity keywords and multipliers
const SEVERITY_INDICATORS = {
  critical: {
    keywords: ['war', 'invasion', 'mass casualty', 'nuclear', 'collapse', 'crisis', 'emergency', 'catastrophic'],
    multiplier: 2.0
  },
  high: {
    keywords: ['attack', 'strike', 'escalation', 'major', 'significant', 'severe', 'serious', 'critical'],
    multiplier: 1.5
  },
  moderate: {
    keywords: ['tension', 'dispute', 'concern', 'warning', 'risk', 'potential', 'possible'],
    multiplier: 1.0
  },
  low: {
    keywords: ['minor', 'limited', 'small', 'local', 'isolated', 'stable', 'improvement', 'progress'],
    multiplier: 0.5
  }
};

class EventClassificationEngine {
  private classificationCache: Map<string, ClassificationResult> = new Map();

  /**
   * Classify an event into CSI vectors
   */
  classifyEvent(event: NormalizedEvent): ClassificationResult {
    // Check cache
    const cached = this.classificationCache.get(event.id);
    if (cached) return cached;

    const text = `${event.headline} ${event.description}`.toLowerCase();
    
    // Calculate vector scores
    const vectorScores = this.calculateVectorScores(text, event.source);
    
    // Sort by score to get primary and secondary vectors
    const sortedVectors = vectorScores.sort((a, b) => b.confidence - a.confidence);
    const primaryVector = sortedVectors[0];
    const secondaryVectors = sortedVectors.slice(1).filter(v => v.confidence > 0.2);

    // Calculate severity
    const { severity, severityScore } = this.calculateSeverity(text, primaryVector);

    // Estimate ΔCSI
    const estimatedDeltaCSI = this.estimateDeltaCSI(primaryVector, severityScore, event.confidence);

    // Generate reasoning
    const reasoning = this.generateReasoning(primaryVector, secondaryVectors, severity);

    const result: ClassificationResult = {
      eventId: event.id,
      primaryVector,
      secondaryVectors,
      severity,
      severityScore,
      estimatedDeltaCSI,
      confidence: primaryVector.confidence * event.confidence,
      classifiedAt: new Date(),
      reasoning
    };

    // Cache result
    this.classificationCache.set(event.id, result);

    console.log(`[Classification Engine] 🏷️ Classified ${event.id}: ${primaryVector.vector} (${severity}) ΔCSI: ${estimatedDeltaCSI.toFixed(1)}`);

    return result;
  }

  /**
   * Calculate scores for all vectors
   */
  private calculateVectorScores(text: string, source: EventSourceType): VectorClassification[] {
    return Object.entries(VECTOR_DEFINITIONS).map(([_, def]) => {
      // Count keyword matches
      const matchedKeywords = def.keywords.filter(kw => text.includes(kw));
      const keywordScore = matchedKeywords.length / def.keywords.length;

      // Source bonus
      const sourceBonus = def.sources.includes(source) ? 0.2 : 0;

      // Calculate confidence
      const confidence = Math.min(1, keywordScore * 2 + sourceBonus);

      return {
        vector: def.category,
        vectorCode: def.code,
        weight: def.weight,
        confidence,
        keywords: matchedKeywords
      };
    });
  }

  /**
   * Calculate event severity
   */
  private calculateSeverity(text: string, primaryVector: VectorClassification): { severity: EventSeverity; severityScore: number } {
    let severityScore = 50; // Base score
    let severity: EventSeverity = 'Moderate';

    // Check severity indicators
    for (const [level, indicators] of Object.entries(SEVERITY_INDICATORS)) {
      const matches = indicators.keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        severityScore = Math.max(severityScore, matches.length * 20 * indicators.multiplier);
        
        if (level === 'critical' && matches.length >= 1) severity = 'Critical';
        else if (level === 'high' && matches.length >= 1 && severity !== 'Critical') severity = 'High';
        else if (level === 'low' && matches.length >= 2) severity = 'Low';
      }
    }

    // Apply vector multiplier
    const vectorDef = Object.values(VECTOR_DEFINITIONS).find(v => v.category === primaryVector.vector);
    if (vectorDef) {
      severityScore *= vectorDef.baseSeverityMultiplier;
    }

    // Clamp score
    severityScore = Math.min(100, Math.max(0, severityScore));

    return { severity, severityScore };
  }

  /**
   * Estimate ΔCSI impact
   */
  private estimateDeltaCSI(primaryVector: VectorClassification, severityScore: number, eventConfidence: number): number {
    // Base impact from severity (0-10 range)
    const baseImpact = (severityScore / 100) * 10;

    // Apply vector weight
    const weightedImpact = baseImpact * primaryVector.weight * 5;

    // Apply confidence
    const confidenceAdjusted = weightedImpact * eventConfidence;

    // Add some variance
    const variance = (Math.random() - 0.5) * 2;

    return parseFloat((confidenceAdjusted + variance).toFixed(1));
  }

  /**
   * Generate classification reasoning
   */
  private generateReasoning(
    primary: VectorClassification,
    secondary: VectorClassification[],
    severity: EventSeverity
  ): string {
    const parts: string[] = [];

    parts.push(`Primary classification: ${primary.vector} (${primary.vectorCode}) with ${(primary.confidence * 100).toFixed(0)}% confidence.`);
    
    if (primary.keywords.length > 0) {
      parts.push(`Key indicators: ${primary.keywords.slice(0, 5).join(', ')}.`);
    }

    if (secondary.length > 0) {
      parts.push(`Secondary vectors: ${secondary.map(v => v.vector).join(', ')}.`);
    }

    parts.push(`Severity assessment: ${severity}.`);

    return parts.join(' ');
  }

  /**
   * Batch classify events
   */
  classifyBatch(events: NormalizedEvent[]): ClassificationResult[] {
    return events.map(event => this.classifyEvent(event));
  }

  /**
   * Get classification from cache
   */
  getClassification(eventId: string): ClassificationResult | undefined {
    return this.classificationCache.get(eventId);
  }

  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.classificationCache.clear();
    console.log('[Classification Engine] 🧹 Cache cleared');
  }

  /**
   * Get vector definitions
   */
  getVectorDefinitions(): typeof VECTOR_DEFINITIONS {
    return VECTOR_DEFINITIONS;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; byVector: Record<string, number> } {
    const byVector: Record<string, number> = {};
    
    this.classificationCache.forEach(result => {
      byVector[result.primaryVector.vector] = (byVector[result.primaryVector.vector] || 0) + 1;
    });

    return {
      size: this.classificationCache.size,
      byVector
    };
  }
}

// Singleton instance
export const eventClassificationEngine = new EventClassificationEngine();