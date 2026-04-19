/**
 * Source Registry
 * Manages source profiles and tier classifications
 */

import { SourceProfile, SourceTier, RiskVector } from '../types';

export class SourceRegistry {
  private sources: Map<string, SourceProfile> = new Map();
  private sourcesByTier: Map<SourceTier, Set<string>> = new Map();
  private sourcesByVector: Map<RiskVector, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultSources();
  }

  /**
   * Initialize default authoritative sources
   */
  private initializeDefaultSources(): void {
    // TIER 1: AUTHORITATIVE SOURCES
    
    // Political Vector
    this.registerSource({
      sourceId: 'wgi',
      name: 'World Bank Worldwide Governance Indicators',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.POLITICAL],
      geographicCoverage: ['*'], // Global
      reliabilityScore: 0.95,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://info.worldbank.org/governance/wgi/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'freedom_house',
      name: 'Freedom House',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.POLITICAL, RiskVector.SOCIAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.93,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://freedomhouse.org/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'vdem',
      name: 'V-Dem Institute',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.POLITICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.94,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.v-dem.net/',
        credentialRequired: false
      }
    });

    // Economic Vector
    this.registerSource({
      sourceId: 'imf_weo',
      name: 'IMF World Economic Outlook',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.ECONOMIC],
      geographicCoverage: ['*'],
      reliabilityScore: 0.96,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.imf.org/en/Publications/WEO',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'world_bank_data',
      name: 'World Bank Open Data',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.ECONOMIC, RiskVector.SOCIAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.95,
      updateFrequency: 'monthly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://data.worldbank.org/',
        credentialRequired: false
      }
    });

    // Security Vector
    this.registerSource({
      sourceId: 'acled',
      name: 'Armed Conflict Location & Event Data Project',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.SECURITY],
      geographicCoverage: ['*'],
      reliabilityScore: 0.92,
      updateFrequency: 'daily',
      lastValidated: new Date(),
      metadata: {
        url: 'https://acleddata.com/',
        credentialRequired: true
      }
    });

    this.registerSource({
      sourceId: 'ucdp',
      name: 'Uppsala Conflict Data Program',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.SECURITY],
      geographicCoverage: ['*'],
      reliabilityScore: 0.94,
      updateFrequency: 'monthly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://ucdp.uu.se/',
        credentialRequired: false
      }
    });

    // Social Vector - NEW
    this.registerSource({
      sourceId: 'undp_hdi',
      name: 'UNDP Human Development Index',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.SOCIAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.94,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://hdr.undp.org/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'who_health',
      name: 'WHO Global Health Observatory',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.SOCIAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.93,
      updateFrequency: 'monthly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.who.int/data/gho',
        credentialRequired: false
      }
    });

    // Environmental Vector - NEW
    this.registerSource({
      sourceId: 'unep_geo',
      name: 'UNEP Global Environment Outlook',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.ENVIRONMENTAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.93,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.unep.org/geo/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'yale_epi',
      name: 'Yale Environmental Performance Index',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.ENVIRONMENTAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.92,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://epi.yale.edu/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'ipcc_climate',
      name: 'IPCC Climate Data',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.ENVIRONMENTAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.95,
      updateFrequency: 'monthly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.ipcc.ch/',
        credentialRequired: false
      }
    });

    // Technological Vector - NEW
    this.registerSource({
      sourceId: 'wipo_gii',
      name: 'WIPO Global Innovation Index',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.TECHNOLOGICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.92,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.wipo.int/global_innovation_index/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'itu_ict',
      name: 'ITU ICT Development Index',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.TECHNOLOGICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.91,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.itu.int/en/ITU-D/Statistics/',
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'wef_nri',
      name: 'WEF Network Readiness Index',
      tier: SourceTier.TIER_1_AUTHORITATIVE,
      primaryVectors: [RiskVector.TECHNOLOGICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.90,
      updateFrequency: 'quarterly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://networkreadinessindex.org/',
        credentialRequired: false
      }
    });

    // TIER 2: REPUTABLE SOURCES

    this.registerSource({
      sourceId: 'reuters',
      name: 'Reuters News',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.POLITICAL, RiskVector.ECONOMIC, RiskVector.SECURITY],
      geographicCoverage: ['*'],
      reliabilityScore: 0.88,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.reuters.com/',
        credentialRequired: true
      }
    });

    this.registerSource({
      sourceId: 'ft',
      name: 'Financial Times',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.ECONOMIC, RiskVector.POLITICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.87,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.ft.com/',
        credentialRequired: true
      }
    });

    this.registerSource({
      sourceId: 'economist_intelligence',
      name: 'Economist Intelligence Unit',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.POLITICAL, RiskVector.ECONOMIC],
      geographicCoverage: ['*'],
      reliabilityScore: 0.89,
      updateFrequency: 'weekly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.eiu.com/',
        credentialRequired: true
      }
    });

    // Tier 2 Environmental
    this.registerSource({
      sourceId: 'climate_central',
      name: 'Climate Central',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.ENVIRONMENTAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.85,
      updateFrequency: 'weekly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.climatecentral.org/',
        credentialRequired: false
      }
    });

    // Tier 2 Technological
    this.registerSource({
      sourceId: 'mit_tech_review',
      name: 'MIT Technology Review',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.TECHNOLOGICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.86,
      updateFrequency: 'weekly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.technologyreview.com/',
        credentialRequired: true
      }
    });

    // Tier 2 Social
    this.registerSource({
      sourceId: 'pew_research',
      name: 'Pew Research Center',
      tier: SourceTier.TIER_2_REPUTABLE,
      primaryVectors: [RiskVector.SOCIAL, RiskVector.POLITICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.88,
      updateFrequency: 'weekly',
      lastValidated: new Date(),
      metadata: {
        url: 'https://www.pewresearch.org/',
        credentialRequired: false
      }
    });

    // TIER 3: SUPPLEMENTARY SOURCES

    this.registerSource({
      sourceId: 'social_media_aggregator',
      name: 'Social Media Event Aggregator',
      tier: SourceTier.TIER_3_SUPPLEMENTARY,
      primaryVectors: [RiskVector.SOCIAL, RiskVector.POLITICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.65,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        credentialRequired: false
      }
    });

    this.registerSource({
      sourceId: 'local_news_aggregator',
      name: 'Local News Aggregator',
      tier: SourceTier.TIER_3_SUPPLEMENTARY,
      primaryVectors: [RiskVector.POLITICAL, RiskVector.SOCIAL, RiskVector.SECURITY],
      geographicCoverage: ['*'],
      reliabilityScore: 0.70,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        credentialRequired: false
      }
    });

    // Tier 3 Environmental
    this.registerSource({
      sourceId: 'env_news_aggregator',
      name: 'Environmental News Aggregator',
      tier: SourceTier.TIER_3_SUPPLEMENTARY,
      primaryVectors: [RiskVector.ENVIRONMENTAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.68,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        credentialRequired: false
      }
    });

    // Tier 3 Technological
    this.registerSource({
      sourceId: 'tech_news_aggregator',
      name: 'Tech News Aggregator',
      tier: SourceTier.TIER_3_SUPPLEMENTARY,
      primaryVectors: [RiskVector.TECHNOLOGICAL],
      geographicCoverage: ['*'],
      reliabilityScore: 0.67,
      updateFrequency: 'real-time',
      lastValidated: new Date(),
      metadata: {
        credentialRequired: false
      }
    });
  }

  /**
   * Register a new source
   */
  registerSource(profile: SourceProfile): void {
    this.sources.set(profile.sourceId, profile);

    // Index by tier
    if (!this.sourcesByTier.has(profile.tier)) {
      this.sourcesByTier.set(profile.tier, new Set());
    }
    this.sourcesByTier.get(profile.tier)!.add(profile.sourceId);

    // Index by vectors
    for (const vector of profile.primaryVectors) {
      if (!this.sourcesByVector.has(vector)) {
        this.sourcesByVector.set(vector, new Set());
      }
      this.sourcesByVector.get(vector)!.add(profile.sourceId);
    }
  }

  /**
   * Get source profile
   */
  getSource(sourceId: string): SourceProfile | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get sources by tier
   */
  getSourcesByTier(tier: SourceTier): SourceProfile[] {
    const sourceIds = this.sourcesByTier.get(tier) || new Set();
    const sources: SourceProfile[] = [];

    for (const sourceId of sourceIds) {
      const source = this.sources.get(sourceId);
      if (source) {
        sources.push(source);
      }
    }

    return sources;
  }

  /**
   * Get sources for a vector
   */
  getSourcesForVector(vector: RiskVector, tier?: SourceTier): SourceProfile[] {
    const sourceIds = this.sourcesByVector.get(vector) || new Set();
    const sources: SourceProfile[] = [];

    for (const sourceId of sourceIds) {
      const source = this.sources.get(sourceId);
      if (!source) continue;

      // Filter by tier if specified
      if (tier && source.tier !== tier) continue;

      sources.push(source);
    }

    return sources.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  /**
   * Get authoritative sources for a vector
   */
  getAuthoritativeSources(vector: RiskVector): SourceProfile[] {
    return this.getSourcesForVector(vector, SourceTier.TIER_1_AUTHORITATIVE);
  }

  /**
   * Validate source tier
   */
  validateSourceTier(sourceId: string, expectedTier: SourceTier): boolean {
    const source = this.sources.get(sourceId);
    return source?.tier === expectedTier;
  }

  /**
   * Get source reliability
   */
  getSourceReliability(sourceId: string): number {
    const source = this.sources.get(sourceId);
    return source?.reliabilityScore || 0;
  }

  /**
   * Check if source covers country
   */
  sourceCoversCountry(sourceId: string, country: string): boolean {
    const source = this.sources.get(sourceId);
    if (!source) return false;

    return source.geographicCoverage.includes('*') || 
           source.geographicCoverage.includes(country);
  }

  /**
   * Get all sources
   */
  getAllSources(): SourceProfile[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSources: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    avgReliability: number;
  } {
    const sources = Array.from(this.sources.values());
    const avgReliability = sources.length > 0
      ? sources.reduce((sum, s) => sum + s.reliabilityScore, 0) / sources.length
      : 0;

    return {
      totalSources: this.sources.size,
      tier1Count: this.sourcesByTier.get(SourceTier.TIER_1_AUTHORITATIVE)?.size || 0,
      tier2Count: this.sourcesByTier.get(SourceTier.TIER_2_REPUTABLE)?.size || 0,
      tier3Count: this.sourcesByTier.get(SourceTier.TIER_3_SUPPLEMENTARY)?.size || 0,
      avgReliability
    };
  }
}

// Singleton instance
export const sourceRegistry = new SourceRegistry();