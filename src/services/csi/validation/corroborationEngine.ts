/**
 * Corroboration Engine
 * 
 * Validates event candidates through multi-source corroboration.
 * Implements credibility scoring and persistence threshold checks.
 * 
 * Validation Rules:
 * - Require ≥2 independent sources
 * - 48-72 hour persistence threshold
 * - Weighted credibility score ≥ 0.7
 * - Source diversity requirements
 * 
 * @module validation/corroborationEngine
 */

import { EventCandidate, EventSource } from '../lifecycle/eventStateMachine';

export interface CorroborationResult {
  isCorroborated: boolean;
  confidence: number;
  sourceCount: number;
  independentSourceCount: number;
  avgCredibility: number;
  persistenceHours: number;
  validationDetails: ValidationDetail[];
  recommendation: CorroborationRecommendation;
}

export interface ValidationDetail {
  rule: string;
  passed: boolean;
  score: number;
  weight: number;
  message: string;
}

export enum CorroborationRecommendation {
  CONFIRM = 'CONFIRM',
  WAIT = 'WAIT',
  REJECT = 'REJECT',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export interface SourceCredibilityConfig {
  sourceId: string;
  sourceName: string;
  baseCredibility: number; // 0.0 - 1.0
  category: SourceCategory;
}

export enum SourceCategory {
  OFFICIAL = 'OFFICIAL', // Government, international orgs
  NEWS_TIER1 = 'NEWS_TIER1', // Major international news
  NEWS_TIER2 = 'NEWS_TIER2', // Regional/specialized news
  SOCIAL = 'SOCIAL', // Social media, blogs
  RESEARCH = 'RESEARCH', // Think tanks, research institutions
  COMMERCIAL = 'COMMERCIAL' // Commercial data providers
}

/**
 * Corroboration Engine
 * 
 * Validates events through multi-source analysis and credibility scoring.
 */
export class CorroborationEngine {
  private sourceCredibilityMap: Map<string, SourceCredibilityConfig>;
  private readonly MIN_INDEPENDENT_SOURCES = 2;
  private readonly MIN_PERSISTENCE_HOURS = 48;
  private readonly MAX_PERSISTENCE_HOURS = 72;
  private readonly MIN_AVG_CREDIBILITY = 0.7;

  constructor() {
    this.sourceCredibilityMap = this.initializeSourceCredibility();
  }

  /**
   * Initialize source credibility configurations
   */
  private initializeSourceCredibility(): Map<string, SourceCredibilityConfig> {
    const configs: SourceCredibilityConfig[] = [
      // Official sources
      { sourceId: 'un', sourceName: 'United Nations', baseCredibility: 0.95, category: SourceCategory.OFFICIAL },
      { sourceId: 'imf', sourceName: 'IMF', baseCredibility: 0.95, category: SourceCategory.OFFICIAL },
      { sourceId: 'worldbank', sourceName: 'World Bank', baseCredibility: 0.95, category: SourceCategory.OFFICIAL },
      { sourceId: 'wto', sourceName: 'WTO', baseCredibility: 0.95, category: SourceCategory.OFFICIAL },
      
      // Tier 1 News
      { sourceId: 'reuters', sourceName: 'Reuters', baseCredibility: 0.9, category: SourceCategory.NEWS_TIER1 },
      { sourceId: 'bloomberg', sourceName: 'Bloomberg', baseCredibility: 0.9, category: SourceCategory.NEWS_TIER1 },
      { sourceId: 'ft', sourceName: 'Financial Times', baseCredibility: 0.9, category: SourceCategory.NEWS_TIER1 },
      { sourceId: 'wsj', sourceName: 'Wall Street Journal', baseCredibility: 0.9, category: SourceCategory.NEWS_TIER1 },
      { sourceId: 'ap', sourceName: 'Associated Press', baseCredibility: 0.9, category: SourceCategory.NEWS_TIER1 },
      
      // Tier 2 News
      { sourceId: 'scmp', sourceName: 'South China Morning Post', baseCredibility: 0.8, category: SourceCategory.NEWS_TIER2 },
      { sourceId: 'nikkei', sourceName: 'Nikkei Asia', baseCredibility: 0.8, category: SourceCategory.NEWS_TIER2 },
      { sourceId: 'economist', sourceName: 'The Economist', baseCredibility: 0.85, category: SourceCategory.NEWS_TIER2 },
      
      // Research
      { sourceId: 'csis', sourceName: 'CSIS', baseCredibility: 0.85, category: SourceCategory.RESEARCH },
      { sourceId: 'chatham', sourceName: 'Chatham House', baseCredibility: 0.85, category: SourceCategory.RESEARCH },
      { sourceId: 'cfr', sourceName: 'Council on Foreign Relations', baseCredibility: 0.85, category: SourceCategory.RESEARCH },
      
      // Commercial
      { sourceId: 'ihs', sourceName: 'IHS Markit', baseCredibility: 0.8, category: SourceCategory.COMMERCIAL },
      { sourceId: 'oxford', sourceName: 'Oxford Economics', baseCredibility: 0.8, category: SourceCategory.COMMERCIAL },
      
      // Social (lower baseline)
      { sourceId: 'twitter', sourceName: 'Twitter/X', baseCredibility: 0.4, category: SourceCategory.SOCIAL },
      { sourceId: 'reddit', sourceName: 'Reddit', baseCredibility: 0.3, category: SourceCategory.SOCIAL }
    ];

    return new Map(configs.map(c => [c.sourceId, c]));
  }

  /**
   * Validate an event candidate through corroboration analysis
   * 
   * @param event - Event candidate to validate
   * @returns Corroboration result with recommendation
   */
  validate(event: EventCandidate): CorroborationResult {
    const validationDetails: ValidationDetail[] = [];

    // Rule 1: Independent source count
    const independentSourceCount = this.countIndependentSources(event.sources);
    const sourceCountPassed = independentSourceCount >= this.MIN_INDEPENDENT_SOURCES;
    validationDetails.push({
      rule: 'Independent Source Count',
      passed: sourceCountPassed,
      score: independentSourceCount / this.MIN_INDEPENDENT_SOURCES,
      weight: 0.3,
      message: `${independentSourceCount} independent sources (minimum: ${this.MIN_INDEPENDENT_SOURCES})`
    });

    // Rule 2: Persistence threshold
    const persistenceHours = this.calculatePersistenceHours(event.sources);
    const persistencePassed = persistenceHours >= this.MIN_PERSISTENCE_HOURS;
    validationDetails.push({
      rule: 'Persistence Threshold',
      passed: persistencePassed,
      score: Math.min(1.0, persistenceHours / this.MIN_PERSISTENCE_HOURS),
      weight: 0.25,
      message: `Event persisted for ${persistenceHours.toFixed(1)} hours (minimum: ${this.MIN_PERSISTENCE_HOURS})`
    });

    // Rule 3: Average credibility
    const avgCredibility = this.calculateAverageCredibility(event.sources);
    const credibilityPassed = avgCredibility >= this.MIN_AVG_CREDIBILITY;
    validationDetails.push({
      rule: 'Average Credibility',
      passed: credibilityPassed,
      score: avgCredibility,
      weight: 0.25,
      message: `Average source credibility: ${(avgCredibility * 100).toFixed(1)}% (minimum: ${this.MIN_AVG_CREDIBILITY * 100}%)`
    });

    // Rule 4: Source diversity
    const diversityScore = this.calculateSourceDiversity(event.sources);
    const diversityPassed = diversityScore >= 0.5;
    validationDetails.push({
      rule: 'Source Diversity',
      passed: diversityPassed,
      score: diversityScore,
      weight: 0.2,
      message: `Source diversity score: ${(diversityScore * 100).toFixed(1)}%`
    });

    // Calculate weighted confidence score
    const confidence = validationDetails.reduce(
      (sum, detail) => sum + (detail.score * detail.weight),
      0
    );

    // Determine if corroborated (all critical rules must pass)
    const isCorroborated = sourceCountPassed && persistencePassed && credibilityPassed;

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      isCorroborated,
      confidence,
      validationDetails,
      persistenceHours
    );

    return {
      isCorroborated,
      confidence,
      sourceCount: event.sources.length,
      independentSourceCount,
      avgCredibility,
      persistenceHours,
      validationDetails,
      recommendation
    };
  }

  /**
   * Count truly independent sources (different source IDs and categories)
   */
  private countIndependentSources(sources: EventSource[]): number {
    const uniqueSourceIds = new Set<string>();
    const sourceCategories = new Map<SourceCategory, number>();

    for (const source of sources) {
      uniqueSourceIds.add(source.sourceId);
      
      const config = this.sourceCredibilityMap.get(source.sourceId);
      if (config) {
        sourceCategories.set(
          config.category,
          (sourceCategories.get(config.category) || 0) + 1
        );
      }
    }

    // Penalize if all sources are from same category
    const categoryCount = sourceCategories.size;
    const categoryPenalty = categoryCount === 1 ? 0.5 : 1.0;

    return Math.floor(uniqueSourceIds.size * categoryPenalty);
  }

  /**
   * Calculate how long the event has persisted (hours since first detection)
   */
  private calculatePersistenceHours(sources: EventSource[]): number {
    if (sources.length === 0) return 0;

    const timestamps = sources.map(s => s.timestamp.getTime());
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    return (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60);
  }

  /**
   * Calculate weighted average credibility across all sources
   */
  private calculateAverageCredibility(sources: EventSource[]): number {
    if (sources.length === 0) return 0;

    const totalCredibility = sources.reduce((sum, source) => {
      const config = this.sourceCredibilityMap.get(source.sourceId);
      const credibility = config?.baseCredibility || source.credibility;
      return sum + credibility;
    }, 0);

    return totalCredibility / sources.length;
  }

  /**
   * Calculate source diversity score based on category distribution
   */
  private calculateSourceDiversity(sources: EventSource[]): number {
    if (sources.length === 0) return 0;

    const categoryCount = new Map<SourceCategory, number>();
    
    for (const source of sources) {
      const config = this.sourceCredibilityMap.get(source.sourceId);
      if (config) {
        categoryCount.set(
          config.category,
          (categoryCount.get(config.category) || 0) + 1
        );
      }
    }

    // Shannon entropy for diversity
    const totalSources = sources.length;
    let entropy = 0;
    
    for (const count of categoryCount.values()) {
      const probability = count / totalSources;
      entropy -= probability * Math.log2(probability);
    }

    // Normalize to 0-1 (max entropy for 6 categories is log2(6) ≈ 2.58)
    const maxEntropy = Math.log2(Object.keys(SourceCategory).length);
    return Math.min(1.0, entropy / maxEntropy);
  }

  /**
   * Generate recommendation based on validation results
   */
  private generateRecommendation(
    isCorroborated: boolean,
    confidence: number,
    validationDetails: ValidationDetail[],
    persistenceHours: number
  ): CorroborationRecommendation {
    // Confirmed: all rules passed
    if (isCorroborated && confidence >= 0.75) {
      return CorroborationRecommendation.CONFIRM;
    }

    // Reject: critical failures
    const criticalFailures = validationDetails.filter(
      d => !d.passed && d.weight >= 0.25
    );
    if (criticalFailures.length >= 2) {
      return CorroborationRecommendation.REJECT;
    }

    // Wait: not enough time has passed
    if (persistenceHours < this.MIN_PERSISTENCE_HOURS) {
      return CorroborationRecommendation.WAIT;
    }

    // Manual review: borderline cases
    if (confidence >= 0.6 && confidence < 0.75) {
      return CorroborationRecommendation.MANUAL_REVIEW;
    }

    // Default: wait for more evidence
    return CorroborationRecommendation.WAIT;
  }

  /**
   * Get source credibility configuration
   */
  getSourceCredibility(sourceId: string): SourceCredibilityConfig | undefined {
    return this.sourceCredibilityMap.get(sourceId);
  }

  /**
   * Add or update source credibility configuration
   */
  setSourceCredibility(config: SourceCredibilityConfig): void {
    this.sourceCredibilityMap.set(config.sourceId, config);
  }

  /**
   * Get all source credibility configurations
   */
  getAllSourceCredibility(): SourceCredibilityConfig[] {
    return Array.from(this.sourceCredibilityMap.values());
  }
}

// Singleton instance
export const corroborationEngine = new CorroborationEngine();