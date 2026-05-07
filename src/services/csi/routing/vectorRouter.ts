/**
 * Vector Routing Engine
 * 
 * Routes detected events to appropriate risk vectors (SC1-SC7) based on
 * content analysis and keyword matching. Assigns primary and secondary vectors
 * with confidence scoring.
 * 
 * Risk Vectors:
 * - SC1: Conflict & Military Action
 * - SC2: Sanctions & Export Controls
 * - SC3: Trade Policy & Tariffs
 * - SC4: Governance & Political Instability
 * - SC5: Cyber & Technology Risk
 * - SC6: Social Unrest & Labor Disputes
 * - SC7: Currency & Capital Controls
 * 
 * @module routing/vectorRouter
 */

export enum RiskVector {
  SC1_CONFLICT = 'SC1',
  SC2_SANCTIONS = 'SC2',
  SC3_TRADE = 'SC3',
  SC4_GOVERNANCE = 'SC4',
  SC5_CYBER = 'SC5',
  SC6_UNREST = 'SC6',
  SC7_CURRENCY = 'SC7'
}

export interface VectorKeywords {
  vector: RiskVector;
  name: string;
  description: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  weight: number;
}

export interface RoutingResult {
  primaryVector: RiskVector;
  primaryConfidence: number;
  secondaryVectors: Array<{
    vector: RiskVector;
    confidence: number;
  }>;
  matchedKeywords: Record<RiskVector, string[]>;
  reasoning: string;
}

export interface EventContent {
  title: string;
  description: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Vector Router
 * 
 * Analyzes event content and routes to appropriate risk vectors
 * with confidence scoring.
 */
export class VectorRouter {
  private vectorDefinitions: VectorKeywords[];

  constructor() {
    this.vectorDefinitions = this.initializeVectorDefinitions();
  }

  /**
   * Initialize risk vector definitions with keywords
   */
  private initializeVectorDefinitions(): VectorKeywords[] {
    return [
      {
        vector: RiskVector.SC1_CONFLICT,
        name: 'Conflict & Military Action',
        description: 'Armed conflict, military operations, defense policy',
        primaryKeywords: [
          'war', 'conflict', 'military', 'invasion', 'attack', 'strike',
          'combat', 'warfare', 'armed forces', 'troops', 'deployment',
          'missile', 'bombing', 'casualties', 'ceasefire', 'hostilities'
        ],
        secondaryKeywords: [
          'defense', 'security', 'border', 'territorial', 'aggression',
          'escalation', 'tension', 'threat', 'weapons', 'naval', 'air force'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC2_SANCTIONS,
        name: 'Sanctions & Export Controls',
        description: 'Economic sanctions, trade restrictions, export controls',
        primaryKeywords: [
          'sanctions', 'embargo', 'export control', 'trade ban',
          'restrictions', 'blacklist', 'prohibited', 'blocked assets',
          'freezing', 'penalties', 'compliance', 'entity list',
          'economic sanctions'
        ],
        secondaryKeywords: [
          'license', 'permit', 'authorization', 'dual-use', 'technology transfer',
          'restricted party', 'screening', 'ofac', 'bis', 'treasury'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC3_TRADE,
        name: 'Trade Policy & Tariffs',
        description: 'Trade agreements, tariffs, customs, trade disputes',
        primaryKeywords: [
          'tariff', 'tariffs', 'trade war', 'customs', 'duty', 'quota',
          'trade agreement', 'wto', 'trade dispute', 'protectionism',
          'import', 'export', 'trade policy', 'trade barrier'
        ],
        secondaryKeywords: [
          'preferential', 'most favored nation', 'free trade', 'bilateral',
          'multilateral', 'trade deficit', 'trade surplus', 'dumping',
          'retaliatory'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC4_GOVERNANCE,
        name: 'Governance & Political Instability',
        description: 'Political risk, regime change, policy uncertainty',
        primaryKeywords: [
          'coup', 'regime change', 'election', 'government collapse',
          'political crisis', 'instability', 'uprising', 'revolution',
          'corruption', 'scandal', 'impeachment', 'resignation',
          'overthrow', 'government'
        ],
        secondaryKeywords: [
          'policy', 'legislation', 'regulation', 'reform', 'opposition',
          'parliament', 'congress', 'ruling party', 'coalition', 'political'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC5_CYBER,
        name: 'Cyber & Technology Risk',
        description: 'Cyber attacks, data breaches, technology restrictions',
        primaryKeywords: [
          'cyber attack', 'cyber', 'hack', 'hacking', 'breach', 'ransomware', 'malware',
          'data theft', 'espionage', 'vulnerability', 'exploit',
          'ddos', 'phishing', 'infrastructure attack', 'technology ban',
          'telecommunications', 'technology restrictions'
        ],
        secondaryKeywords: [
          'cybersecurity', 'encryption', 'firewall', 'network', 'server',
          'software', 'hardware', 'data breach'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC6_UNREST,
        name: 'Social Unrest & Labor Disputes',
        description: 'Protests, strikes, civil unrest, labor actions',
        primaryKeywords: [
          'protest', 'protests', 'strike', 'riot', 'demonstration', 'demonstrations',
          'unrest', 'civil unrest', 'labor dispute', 'walkout', 'boycott', 
          'civil disobedience', 'violence', 'clashes', 'martial law',
          'curfew', 'emergency'
        ],
        secondaryKeywords: [
          'union', 'workers', 'wages', 'conditions', 'rights',
          'movement', 'activism', 'rally', 'march', 'occupation'
        ],
        weight: 1.0
      },
      {
        vector: RiskVector.SC7_CURRENCY,
        name: 'Currency & Capital Controls',
        description: 'Currency restrictions, capital controls, forex policy',
        primaryKeywords: [
          'capital controls', 'capital control', 'currency restriction', 'forex',
          'exchange rate', 'devaluation', 'revaluation', 'peg',
          'convertibility', 'currency crisis', 'default', 'currency',
          'foreign exchange', 'monetary policy', 'central bank'
        ],
        secondaryKeywords: [
          'reserves', 'liquidity', 'repatriation', 'transfer', 
          'remittance', 'settlement', 'intervention', 'stabilize'
        ],
        weight: 1.0
      }
    ];
  }

  /**
   * Route an event to appropriate risk vectors
   * 
   * @param content - Event content to analyze
   * @returns Routing result with primary and secondary vectors
   */
  route(content: EventContent): RoutingResult {
    // Normalize content for matching
    const normalizedText = this.normalizeText(
      `${content.title} ${content.description} ${(content.tags || []).join(' ')}`
    );

    // Calculate scores for each vector
    const vectorScores: Array<{
      vector: RiskVector;
      score: number;
      matchedKeywords: string[];
    }> = [];

    for (const vectorDef of this.vectorDefinitions) {
      const { score, matchedKeywords } = this.calculateVectorScore(
        normalizedText,
        vectorDef
      );

      vectorScores.push({
        vector: vectorDef.vector,
        score,
        matchedKeywords
      });
    }

    // Sort by score descending
    vectorScores.sort((a, b) => b.score - a.score);

    // Select primary vector (highest score)
    const primary = vectorScores[0];
    
    // Select secondary vectors (score > 0.3 and not primary)
    const secondaryVectors = vectorScores
      .slice(1)
      .filter(v => v.score >= 0.3)
      .map(v => ({
        vector: v.vector,
        confidence: v.score
      }));

    // Build matched keywords map
    const matchedKeywords: Record<RiskVector, string[]> = {} as Record<RiskVector, string[]>;
    for (const vs of vectorScores) {
      if (vs.matchedKeywords.length > 0) {
        matchedKeywords[vs.vector] = vs.matchedKeywords;
      }
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(primary, secondaryVectors, matchedKeywords);

    return {
      primaryVector: primary.vector,
      primaryConfidence: primary.score,
      secondaryVectors,
      matchedKeywords,
      reasoning
    };
  }

  /**
   * Calculate score for a specific vector
   * Uses improved scoring that boosts confidence when multiple keywords match
   */
  private calculateVectorScore(
    normalizedText: string,
    vectorDef: VectorKeywords
  ): { score: number; matchedKeywords: string[] } {
    const matchedKeywords: string[] = [];
    let primaryMatches = 0;
    let secondaryMatches = 0;

    // Check primary keywords (weight: 1.0)
    for (const keyword of vectorDef.primaryKeywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        primaryMatches++;
        matchedKeywords.push(keyword);
      }
    }

    // Check secondary keywords (weight: 0.5)
    for (const keyword of vectorDef.secondaryKeywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        secondaryMatches++;
        matchedKeywords.push(keyword);
      }
    }

    // Improved scoring algorithm:
    // - Base score from keyword matches
    // - Boost when multiple primary keywords match
    // - Minimum threshold for any match
    
    if (primaryMatches === 0 && secondaryMatches === 0) {
      return { score: 0, matchedKeywords: [] };
    }

    // Base score calculation
    let score = 0;
    
    // Primary keyword contribution (each match adds significant score)
    if (primaryMatches > 0) {
      // First match gives 0.55, each additional gives 0.15 (up to cap)
      score = 0.55 + Math.min(primaryMatches - 1, 3) * 0.15;
    }
    
    // Secondary keyword contribution
    if (secondaryMatches > 0) {
      score += Math.min(secondaryMatches, 3) * 0.1;
    }

    // Cap at 1.0
    score = Math.min(1.0, score);

    return { score, matchedKeywords };
  }

  /**
   * Normalize text for keyword matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateReasoning(
    primary: { vector: RiskVector; score: number; matchedKeywords: string[] },
    secondaryVectors: Array<{ vector: RiskVector; confidence: number }>,
    matchedKeywords: Record<RiskVector, string[]>
  ): string {
    const vectorName = this.vectorDefinitions.find(
      v => v.vector === primary.vector
    )?.name || primary.vector;

    let reasoning = `Primary vector: ${vectorName} (confidence: ${(primary.score * 100).toFixed(1)}%)`;
    
    if (primary.matchedKeywords.length > 0) {
      reasoning += ` - Matched keywords: ${primary.matchedKeywords.slice(0, 5).join(', ')}`;
    }

    if (secondaryVectors.length > 0) {
      const secondaryNames = secondaryVectors.map(sv => {
        const name = this.vectorDefinitions.find(v => v.vector === sv.vector)?.name || sv.vector;
        return `${name} (${(sv.confidence * 100).toFixed(1)}%)`;
      });
      reasoning += `. Secondary vectors: ${secondaryNames.join(', ')}`;
    }

    return reasoning;
  }

  /**
   * Get vector definition by vector code
   */
  getVectorDefinition(vector: RiskVector): VectorKeywords | undefined {
    return this.vectorDefinitions.find(v => v.vector === vector);
  }

  /**
   * Get all vector definitions
   */
  getAllVectorDefinitions(): VectorKeywords[] {
    return [...this.vectorDefinitions];
  }
}

// Singleton instance
export const vectorRouter = new VectorRouter();