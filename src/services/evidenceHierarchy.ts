/**
 * Evidence Hierarchy Implementation - V3.4 Specification
 * 
 * Implements the 4-tier evidence hierarchy system:
 * Tier 1: Structured Primary Evidence (highest priority)
 * Tier 2: Narrative Primary Evidence
 * Tier 3: Supplementary Evidence (NEW)
 * Tier 4: Fallback Logic (last resort)
 */

export interface EvidenceProcessor {
  processTier1Evidence(documents: any[], channel: string): Promise<StructuredPrimaryEvidence | null>;
  processTier2Evidence(documents: any[], channel: string): Promise<NarrativePrimaryEvidence | null>;
  processTier3Evidence(companyId: string, channel: string): Promise<SupplementaryEvidence | null>;
  processTier4Evidence(companyId: string, channel: string, context: FallbackContext): Promise<FallbackLogic>;
}

export interface StructuredPrimaryEvidence {
  type: 'structured';
  source: 'primary_filing';
  tables: GeographicTable[];
  confidence: number;
  jurisdiction: string;
  filingType: string;
  filingDate: Date;
  extractedAt: Date;
  validation: {
    tableCount: number;
    dataCompleteness: number;
    crossValidated: boolean;
  };
}

export interface NarrativePrimaryEvidence {
  type: 'narrative';
  source: 'primary_filing';
  countries: string[];
  regions: RegionDefinition[];
  descriptions: string[];
  confidence: number;
  jurisdiction: string;
  filingType: string;
  filingDate: Date;
  extractedAt: Date;
  validation: {
    entityCount: number;
    contextQuality: number;
    ambiguityScore: number;
  };
}

export interface SupplementaryEvidence {
  type: 'supplementary';
  source: 'sustainability' | 'supply_chain' | 'facilities' | 'esg' | 'operations';
  countries: string[];
  facilities: FacilityLocation[];
  suppliers: SupplierLocation[];
  confidence: number;
  documentUrl: string;
  retrievedAt: Date;
  extractedAt: Date;
  validation: {
    sourceReliability: number;
    dataFreshness: number;
    coverageScore: number;
  };
}

export interface FallbackLogic {
  type: 'fallback';
  fallbackType: 'SSF' | 'RF' | 'GF';
  channel: 'revenue' | 'supply_chain' | 'physical_assets' | 'financial';
  formula: string;
  weights: CountryWeight[];
  confidence: number;
  computedAt: Date;
  validation: {
    formulaApplicability: number;
    dataQuality: number;
    methodologyScore: number;
  };
}

export interface GeographicTable {
  tableId: string;
  tableType: 'revenue' | 'ppe' | 'fx' | 'subsidiaries' | 'other';
  countries: Record<string, number>;
  regions: Record<string, number>;
  total: number;
  currency?: string;
  period: string;
  source: string;
  extractionMethod: string;
  confidence: number;
}

export interface RegionDefinition {
  regionId: string;
  regionName: string;
  countries: string[];
  definition: string;
  source: string;
  confidence: number;
  ambiguity: 'low' | 'medium' | 'high';
}

export interface CountryWeight {
  country: string;
  weight: number;
  confidence: number;
  source: string;
  methodology: string;
  tier: 1 | 2 | 3 | 4;
  validationScore: number;
}

export interface FacilityLocation {
  facilityId: string;
  name: string;
  country: string;
  type: 'manufacturing' | 'office' | 'r&d' | 'warehouse' | 'retail' | 'distribution';
  coordinates?: { lat: number; lng: number };
  confidence: number;
  source: string;
  lastVerified: Date;
}

export interface SupplierLocation {
  supplierId?: string;
  name?: string;
  country: string;
  tier: 1 | 2 | 3;
  importance: number;
  confidence: number;
  source: string;
  relationship: 'direct' | 'indirect' | 'inferred';
}

export interface FallbackContext {
  tier1Evidence: StructuredPrimaryEvidence | null;
  tier2Evidence: NarrativePrimaryEvidence | null;
  tier3Evidence: SupplementaryEvidence | null;
  sector: string;
  issuerType: string;
  jurisdiction: string;
}

export class EvidenceHierarchyProcessor implements EvidenceProcessor {
  private processingStats = {
    tier1Processed: 0,
    tier2Processed: 0,
    tier3Processed: 0,
    tier4Processed: 0,
    successRate: 0
  };

  /**
   * Process Tier 1: Structured Primary Evidence
   * Highest priority - structured tables from statutory filings
   */
  async processTier1Evidence(
    documents: any[], 
    channel: string
  ): Promise<StructuredPrimaryEvidence | null> {
    console.log(`📊 Processing Tier 1 structured evidence for ${channel} channel...`);

    if (!documents || documents.length === 0) {
      console.log('No documents available for Tier 1 processing');
      return null;
    }

    try {
      const tables: GeographicTable[] = [];
      const primaryDocument = documents[0]; // Use most recent document

      // Channel-specific table extraction
      switch (channel) {
        case 'revenue':
          tables.push(...await this.extractRevenueTables(primaryDocument));
          break;
        case 'supply_chain':
          tables.push(...await this.extractSupplyChainTables(primaryDocument));
          break;
        case 'physical_assets':
          tables.push(...await this.extractAssetTables(primaryDocument));
          break;
        case 'financial':
          tables.push(...await this.extractFinancialTables(primaryDocument));
          break;
        default:
          console.warn(`Unknown channel: ${channel}`);
          return null;
      }

      if (tables.length === 0) {
        console.log(`No structured tables found for ${channel} channel`);
        return null;
      }

      // Validation
      const validation = this.validateStructuredEvidence(tables, channel);
      
      const evidence: StructuredPrimaryEvidence = {
        type: 'structured',
        source: 'primary_filing',
        tables,
        confidence: this.calculateStructuredConfidence(tables, validation),
        jurisdiction: primaryDocument.jurisdiction || 'unknown',
        filingType: primaryDocument.filingType || 'unknown',
        filingDate: primaryDocument.filingDate || new Date(),
        extractedAt: new Date(),
        validation
      };

      this.processingStats.tier1Processed++;
      console.log(`✅ Tier 1 evidence processed: ${tables.length} tables extracted`);

      return evidence;

    } catch (error) {
      console.error('Failed to process Tier 1 evidence:', error);
      return null;
    }
  }

  /**
   * Process Tier 2: Narrative Primary Evidence
   * Narrative descriptions from statutory filings
   */
  async processTier2Evidence(
    documents: any[], 
    channel: string
  ): Promise<NarrativePrimaryEvidence | null> {
    console.log(`📝 Processing Tier 2 narrative evidence for ${channel} channel...`);

    if (!documents || documents.length === 0) {
      console.log('No documents available for Tier 2 processing');
      return null;
    }

    try {
      const primaryDocument = documents[0];
      
      // Extract narrative content
      const narrativeContent = await this.extractNarrativeContent(primaryDocument, channel);
      
      if (!narrativeContent || narrativeContent.trim().length === 0) {
        console.log(`No narrative content found for ${channel} channel`);
        return null;
      }

      // Process geographic entities
      const entities = await this.processGeographicEntities(narrativeContent, channel);
      
      if (entities.countries.length === 0 && entities.regions.length === 0) {
        console.log(`No geographic entities found in narrative for ${channel} channel`);
        return null;
      }

      // Validation
      const validation = this.validateNarrativeEvidence(entities, narrativeContent);

      const evidence: NarrativePrimaryEvidence = {
        type: 'narrative',
        source: 'primary_filing',
        countries: entities.countries,
        regions: entities.regions,
        descriptions: entities.descriptions,
        confidence: this.calculateNarrativeConfidence(entities, validation),
        jurisdiction: primaryDocument.jurisdiction || 'unknown',
        filingType: primaryDocument.filingType || 'unknown',
        filingDate: primaryDocument.filingDate || new Date(),
        extractedAt: new Date(),
        validation
      };

      this.processingStats.tier2Processed++;
      console.log(`✅ Tier 2 evidence processed: ${entities.countries.length} countries, ${entities.regions.length} regions`);

      return evidence;

    } catch (error) {
      console.error('Failed to process Tier 2 evidence:', error);
      return null;
    }
  }

  /**
   * Process Tier 3: Supplementary Evidence (NEW in v3.4)
   * Evidence from sustainability reports, supply chain disclosures, facility listings
   */
  async processTier3Evidence(
    companyId: string, 
    channel: string
  ): Promise<SupplementaryEvidence | null> {
    console.log(`🔍 Processing Tier 3 supplementary evidence for ${companyId} ${channel} channel...`);

    try {
      // Attempt to retrieve supplementary documents
      const supplementaryData = await this.retrieveSupplementaryData(companyId, channel);
      
      if (!supplementaryData || supplementaryData.sources.length === 0) {
        console.log(`No supplementary data available for ${companyId}`);
        return null;
      }

      // Process supplementary sources
      const countries: string[] = [];
      const facilities: FacilityLocation[] = [];
      const suppliers: SupplierLocation[] = [];
      let primarySource: SupplementaryEvidence['source'] = 'operations';

      for (const source of supplementaryData.sources) {
        switch (source.type) {
          case 'sustainability':
            const sustainabilityData = await this.processSustainabilityReport(source);
            countries.push(...sustainabilityData.countries);
            facilities.push(...sustainabilityData.facilities);
            primarySource = 'sustainability';
            break;

          case 'supply_chain':
            const supplyChainData = await this.processSupplyChainDisclosure(source);
            countries.push(...supplyChainData.countries);
            suppliers.push(...supplyChainData.suppliers);
            primarySource = 'supply_chain';
            break;

          case 'facilities':
            const facilityData = await this.processFacilityListing(source);
            countries.push(...facilityData.countries);
            facilities.push(...facilityData.facilities);
            primarySource = 'facilities';
            break;

          case 'esg':
            const esgData = await this.processESGReport(source);
            countries.push(...esgData.countries);
            facilities.push(...esgData.facilities);
            primarySource = 'esg';
            break;
        }
      }

      // Remove duplicates
      const uniqueCountries = [...new Set(countries)];
      
      if (uniqueCountries.length === 0) {
        console.log(`No geographic information found in supplementary sources for ${companyId}`);
        return null;
      }

      // Validation
      const validation = this.validateSupplementaryEvidence(
        uniqueCountries, 
        facilities, 
        suppliers, 
        supplementaryData.sources
      );

      const evidence: SupplementaryEvidence = {
        type: 'supplementary',
        source: primarySource,
        countries: uniqueCountries,
        facilities,
        suppliers,
        confidence: this.calculateSupplementaryConfidence(validation),
        documentUrl: supplementaryData.sources[0]?.url || 'multiple_sources',
        retrievedAt: new Date(),
        extractedAt: new Date(),
        validation
      };

      this.processingStats.tier3Processed++;
      console.log(`✅ Tier 3 evidence processed: ${uniqueCountries.length} countries, ${facilities.length} facilities, ${suppliers.length} suppliers`);

      return evidence;

    } catch (error) {
      console.error('Failed to process Tier 3 evidence:', error);
      return null;
    }
  }

  /**
   * Process Tier 4: Fallback Logic
   * Last resort when no sufficient evidence is available
   */
  async processTier4Evidence(
    companyId: string, 
    channel: string, 
    context: FallbackContext
  ): Promise<FallbackLogic> {
    console.log(`⚙️ Processing Tier 4 fallback logic for ${companyId} ${channel} channel...`);

    try {
      // Determine fallback type based on available evidence
      const fallbackType = this.determineFallbackType(context, channel);
      
      // Compute fallback weights using appropriate formula
      const weights = await this.computeFallbackWeights(
        companyId, 
        channel, 
        fallbackType, 
        context
      );

      // Get formula description
      const formula = this.getFallbackFormula(channel, fallbackType, context.sector);

      // Validation
      const validation = this.validateFallbackLogic(fallbackType, weights, context);

      const evidence: FallbackLogic = {
        type: 'fallback',
        fallbackType,
        channel: channel as any,
        formula,
        weights,
        confidence: this.calculateFallbackConfidence(fallbackType, validation),
        computedAt: new Date(),
        validation
      };

      this.processingStats.tier4Processed++;
      console.log(`✅ Tier 4 fallback processed: ${fallbackType} with ${weights.length} countries`);

      return evidence;

    } catch (error) {
      console.error('Failed to process Tier 4 fallback:', error);
      
      // Return minimal fallback
      return {
        type: 'fallback',
        fallbackType: 'GF',
        channel: channel as any,
        formula: 'GDP(c) × SectorPrior(c)',
        weights: [],
        confidence: 0.3,
        computedAt: new Date(),
        validation: {
          formulaApplicability: 0.3,
          dataQuality: 0.3,
          methodologyScore: 0.3
        }
      };
    }
  }

  // Private helper methods

  private async extractRevenueTables(document: any): Promise<GeographicTable[]> {
    // Mock implementation - would use actual document parsing
    const tables: GeographicTable[] = [];
    
    // Simulate finding revenue tables
    if (Math.random() > 0.3) { // 70% chance of finding revenue tables
      tables.push({
        tableId: 'revenue_geographic_1',
        tableType: 'revenue',
        countries: {
          'United States': 65.5,
          'Europe': 20.3,
          'Asia Pacific': 14.2
        },
        regions: {
          'Americas': 67.1,
          'EMEA': 20.3,
          'APAC': 12.6
        },
        total: 100,
        currency: 'USD',
        period: '2023',
        source: 'Form 10-K',
        extractionMethod: 'table_parser_v2',
        confidence: 0.92
      });
    }
    
    return tables;
  }

  private async extractSupplyChainTables(document: any): Promise<GeographicTable[]> {
    // Mock implementation for supply chain tables
    return [];
  }

  private async extractAssetTables(document: any): Promise<GeographicTable[]> {
    // Mock implementation for asset tables
    return [];
  }

  private async extractFinancialTables(document: any): Promise<GeographicTable[]> {
    // Mock implementation for financial tables
    return [];
  }

  private async extractNarrativeContent(document: any, channel: string): Promise<string> {
    // Mock implementation - would extract relevant narrative sections
    const narrativeTexts = {
      'revenue': 'The Company operates primarily in the United States, with significant operations in Europe and growing presence in Asia Pacific. Our European operations include the United Kingdom, Germany, and France.',
      'supply_chain': 'Manufacturing facilities are located in China, Vietnam, and Mexico. Key suppliers are based in Taiwan, South Korea, and Malaysia.',
      'physical_assets': 'The Company owns facilities in the United States, Canada, and the United Kingdom. Research and development centers are located in California, Massachusetts, and London.',
      'financial': 'Currency exposure includes USD, EUR, GBP, and JPY. Significant cash holdings in European and Asian markets.'
    };
    
    return narrativeTexts[channel as keyof typeof narrativeTexts] || '';
  }

  private async processGeographicEntities(
    content: string, 
    channel: string
  ): Promise<{
    countries: string[];
    regions: RegionDefinition[];
    descriptions: string[];
  }> {
    // Mock NLP processing - would use actual entity extraction
    const countries: string[] = [];
    const regions: RegionDefinition[] = [];
    const descriptions: string[] = [];

    // Simple keyword matching (in real implementation, would use advanced NLP)
    const countryKeywords = [
      'United States', 'China', 'Germany', 'United Kingdom', 'France', 
      'Japan', 'Canada', 'Brazil', 'India', 'Australia', 'Taiwan', 
      'South Korea', 'Vietnam', 'Mexico', 'Malaysia'
    ];

    countryKeywords.forEach(country => {
      if (content.toLowerCase().includes(country.toLowerCase())) {
        countries.push(country);
      }
    });

    // Extract region definitions
    if (content.toLowerCase().includes('europe')) {
      regions.push({
        regionId: 'europe_1',
        regionName: 'Europe',
        countries: ['United Kingdom', 'Germany', 'France'],
        definition: 'European operations including UK, Germany, and France',
        source: 'narrative_extraction',
        confidence: 0.8,
        ambiguity: 'low'
      });
    }

    if (content.toLowerCase().includes('asia pacific')) {
      regions.push({
        regionId: 'apac_1',
        regionName: 'Asia Pacific',
        countries: ['Japan', 'China', 'Australia', 'South Korea'],
        definition: 'Asia Pacific region operations',
        source: 'narrative_extraction',
        confidence: 0.75,
        ambiguity: 'medium'
      });
    }

    descriptions.push(content);

    return { countries, regions, descriptions };
  }

  private async retrieveSupplementaryData(
    companyId: string, 
    channel: string
  ): Promise<{ sources: SupplementarySource[] } | null> {
    // Mock implementation - would attempt to retrieve actual supplementary documents
    const mockSources: SupplementarySource[] = [];

    // Simulate finding supplementary sources
    if (Math.random() > 0.4) { // 60% chance of finding supplementary data
      mockSources.push({
        type: 'sustainability',
        url: `/sustainability-report-${companyId}`,
        content: 'Sustainability operations in North America, Europe, and Asia...',
        lastUpdated: new Date(),
        reliability: 0.8
      });
    }

    if (Math.random() > 0.6) { // 40% chance of supply chain data
      mockSources.push({
        type: 'supply_chain',
        url: `/supply-chain-${companyId}`,
        content: 'Suppliers located in China, Vietnam, Taiwan, and Mexico...',
        lastUpdated: new Date(),
        reliability: 0.75
      });
    }

    return mockSources.length > 0 ? { sources: mockSources } : null;
  }

  private async processSustainabilityReport(source: SupplementarySource): Promise<{
    countries: string[];
    facilities: FacilityLocation[];
  }> {
    // Mock processing of sustainability report
    return {
      countries: ['United States', 'Germany', 'Japan'],
      facilities: [
        {
          facilityId: 'sus_facility_1',
          name: 'Green Manufacturing Plant',
          country: 'Germany',
          type: 'manufacturing',
          confidence: 0.8,
          source: 'sustainability_report',
          lastVerified: new Date()
        }
      ]
    };
  }

  private async processSupplyChainDisclosure(source: SupplementarySource): Promise<{
    countries: string[];
    suppliers: SupplierLocation[];
  }> {
    // Mock processing of supply chain disclosure
    return {
      countries: ['China', 'Vietnam', 'Taiwan'],
      suppliers: [
        {
          supplierId: 'supplier_1',
          name: 'Tech Components Ltd',
          country: 'Taiwan',
          tier: 1,
          importance: 0.8,
          confidence: 0.75,
          source: 'supply_chain_report',
          relationship: 'direct'
        }
      ]
    };
  }

  private async processFacilityListing(source: SupplementarySource): Promise<{
    countries: string[];
    facilities: FacilityLocation[];
  }> {
    // Mock processing of facility listing
    return {
      countries: ['United States', 'Canada'],
      facilities: [
        {
          facilityId: 'facility_1',
          name: 'Corporate Headquarters',
          country: 'United States',
          type: 'office',
          coordinates: { lat: 37.7749, lng: -122.4194 },
          confidence: 0.95,
          source: 'facility_listing',
          lastVerified: new Date()
        }
      ]
    };
  }

  private async processESGReport(source: SupplementarySource): Promise<{
    countries: string[];
    facilities: FacilityLocation[];
  }> {
    // Mock processing of ESG report
    return {
      countries: ['United States', 'United Kingdom'],
      facilities: []
    };
  }

  // Validation methods

  private validateStructuredEvidence(
    tables: GeographicTable[], 
    channel: string
  ): StructuredPrimaryEvidence['validation'] {
    const tableCount = tables.length;
    const totalDataPoints = tables.reduce((sum, table) => 
      sum + Object.keys(table.countries).length + Object.keys(table.regions).length, 0
    );
    
    return {
      tableCount,
      dataCompleteness: Math.min(1, totalDataPoints / 10), // Normalize to 0-1
      crossValidated: tableCount > 1
    };
  }

  private validateNarrativeEvidence(
    entities: any, 
    content: string
  ): NarrativePrimaryEvidence['validation'] {
    const entityCount = entities.countries.length + entities.regions.length;
    const contentLength = content.length;
    
    return {
      entityCount,
      contextQuality: Math.min(1, contentLength / 1000), // Normalize based on content length
      ambiguityScore: entities.regions.reduce((sum: number, region: RegionDefinition) => 
        sum + (region.ambiguity === 'high' ? 0.8 : region.ambiguity === 'medium' ? 0.5 : 0.2), 0
      ) / Math.max(1, entities.regions.length)
    };
  }

  private validateSupplementaryEvidence(
    countries: string[], 
    facilities: FacilityLocation[], 
    suppliers: SupplierLocation[], 
    sources: SupplementarySource[]
  ): SupplementaryEvidence['validation'] {
    const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    const dataPoints = countries.length + facilities.length + suppliers.length;
    
    return {
      sourceReliability: avgReliability,
      dataFreshness: 0.8, // Mock freshness score
      coverageScore: Math.min(1, dataPoints / 15) // Normalize coverage
    };
  }

  private validateFallbackLogic(
    fallbackType: 'SSF' | 'RF' | 'GF', 
    weights: CountryWeight[], 
    context: FallbackContext
  ): FallbackLogic['validation'] {
    const applicabilityScores = { 'SSF': 0.9, 'RF': 0.7, 'GF': 0.5 };
    
    return {
      formulaApplicability: applicabilityScores[fallbackType],
      dataQuality: weights.reduce((sum, w) => sum + w.confidence, 0) / Math.max(1, weights.length),
      methodologyScore: fallbackType === 'SSF' ? 0.9 : fallbackType === 'RF' ? 0.7 : 0.5
    };
  }

  // Confidence calculation methods

  private calculateStructuredConfidence(
    tables: GeographicTable[], 
    validation: StructuredPrimaryEvidence['validation']
  ): number {
    const baseConfidence = 0.9; // High base confidence for structured data
    const completenessBonus = validation.dataCompleteness * 0.05;
    const crossValidationBonus = validation.crossValidated ? 0.03 : 0;
    
    return Math.min(0.95, baseConfidence + completenessBonus + crossValidationBonus);
  }

  private calculateNarrativeConfidence(
    entities: any, 
    validation: NarrativePrimaryEvidence['validation']
  ): number {
    const baseConfidence = 0.7; // Medium base confidence for narrative data
    const entityBonus = Math.min(0.1, validation.entityCount * 0.02);
    const qualityBonus = validation.contextQuality * 0.05;
    const ambiguityPenalty = validation.ambiguityScore * 0.1;
    
    return Math.max(0.5, Math.min(0.85, baseConfidence + entityBonus + qualityBonus - ambiguityPenalty));
  }

  private calculateSupplementaryConfidence(
    validation: SupplementaryEvidence['validation']
  ): number {
    const baseConfidence = 0.6; // Lower base confidence for supplementary data
    const reliabilityBonus = validation.sourceReliability * 0.1;
    const freshnessBonus = validation.dataFreshness * 0.05;
    const coverageBonus = validation.coverageScore * 0.05;
    
    return Math.max(0.4, Math.min(0.8, baseConfidence + reliabilityBonus + freshnessBonus + coverageBonus));
  }

  private calculateFallbackConfidence(
    fallbackType: 'SSF' | 'RF' | 'GF', 
    validation: FallbackLogic['validation']
  ): number {
    const baseConfidences = { 'SSF': 0.75, 'RF': 0.65, 'GF': 0.5 };
    const baseConfidence = baseConfidences[fallbackType];
    
    const applicabilityBonus = validation.formulaApplicability * 0.05;
    const qualityBonus = validation.dataQuality * 0.05;
    const methodologyBonus = validation.methodologyScore * 0.03;
    
    return Math.max(0.3, Math.min(0.8, baseConfidence + applicabilityBonus + qualityBonus + methodologyBonus));
  }

  // Fallback logic methods

  private determineFallbackType(context: FallbackContext, channel: string): 'SSF' | 'RF' | 'GF' {
    // SSF: Region defined, membership knowable, region total known
    const hasDefinedRegion = context.tier2Evidence?.regions.length || 
                           context.tier1Evidence?.tables.some(t => Object.keys(t.regions).length > 0);
    const hasRegionTotal = context.tier1Evidence?.tables.some(t => Object.keys(t.regions).length > 0);
    
    if (hasDefinedRegion && hasRegionTotal) {
      return 'SSF';
    }
    
    // RF: Partial/ambiguous geography
    const hasPartialGeography = context.tier2Evidence?.countries.length || 
                               context.tier3Evidence?.countries.length ||
                               context.tier2Evidence?.regions.some(r => r.countries.length > 0);
    
    if (hasPartialGeography) {
      return 'RF';
    }
    
    // GF: No usable geography found
    return 'GF';
  }

  private async computeFallbackWeights(
    companyId: string, 
    channel: string, 
    fallbackType: 'SSF' | 'RF' | 'GF', 
    context: FallbackContext
  ): Promise<CountryWeight[]> {
    // Mock implementation - would use actual fallback computation
    const mockCountries = ['United States', 'China', 'Germany', 'United Kingdom', 'Japan'];
    const weights: CountryWeight[] = [];
    
    mockCountries.forEach((country, index) => {
      const weight = Math.random() * 50 + 10; // 10-60 range
      weights.push({
        country,
        weight,
        confidence: this.getFallbackTypeConfidence(fallbackType),
        source: fallbackType,
        methodology: `${channel}_${fallbackType.toLowerCase()}`,
        tier: 4,
        validationScore: 0.7 + Math.random() * 0.2
      });
    });
    
    // Normalize to 100%
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight > 0) {
      weights.forEach(w => {
        w.weight = (w.weight / totalWeight) * 100;
      });
    }
    
    return weights;
  }

  private getFallbackFormula(channel: string, fallbackType: 'SSF' | 'RF' | 'GF', sector: string): string {
    const formulas: Record<string, Record<string, string>> = {
      'revenue': {
        'SSF': `Population(c) × GDPpc(c) × RevenueDemandProxy_${sector}(c)`,
        'RF': `GDP(c) × SectorPlausibility_revenue,${sector}(c)`,
        'GF': `GDP(c) × SectorPrior_revenue,${sector}(c)`
      },
      'supply_chain': {
        'SSF': `TradeFlow_HS,${sector}(c) × AssemblyShare_${sector}(c)`,
        'RF': `GDP(c) × SectorPlausibility_supply_chain,${sector}(c)`,
        'GF': `GDP(c) × SectorPrior_supply_chain,${sector}(c)`
      },
      'physical_assets': {
        'SSF': `GDP(c) × AssetIntensity_${sector}(c)`,
        'RF': `GDP(c) × SectorPlausibility_physical_assets,${sector}(c)`,
        'GF': `GDP(c) × SectorPrior_physical_assets,${sector}(c)`
      },
      'financial': {
        'SSF': 'FXShare_currency × FinancialDepth(c)',
        'RF': 'GDP(c) × SectorPlausibility_financial(c)',
        'GF': 'GDP(c) × SectorPrior_financial(c)'
      }
    };
    
    return formulas[channel]?.[fallbackType] || `GDP(c) × SectorProxy_${sector}(c)`;
  }

  private getFallbackTypeConfidence(fallbackType: 'SSF' | 'RF' | 'GF'): number {
    const confidences = { 'SSF': 0.75, 'RF': 0.65, 'GF': 0.5 };
    return confidences[fallbackType];
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): typeof this.processingStats {
    const totalProcessed = this.processingStats.tier1Processed + 
                          this.processingStats.tier2Processed + 
                          this.processingStats.tier3Processed + 
                          this.processingStats.tier4Processed;
    
    this.processingStats.successRate = totalProcessed > 0 ? 
      (this.processingStats.tier1Processed + this.processingStats.tier2Processed + this.processingStats.tier3Processed) / totalProcessed : 0;
    
    return { ...this.processingStats };
  }

  /**
   * Reset processing statistics
   */
  resetStats(): void {
    this.processingStats = {
      tier1Processed: 0,
      tier2Processed: 0,
      tier3Processed: 0,
      tier4Processed: 0,
      successRate: 0
    };
  }
}

// Supporting interfaces
interface SupplementarySource {
  type: 'sustainability' | 'supply_chain' | 'facilities' | 'esg';
  url: string;
  content: string;
  lastUpdated: Date;
  reliability: number;
}

// Export singleton instance
export const evidenceHierarchyProcessor = new EvidenceHierarchyProcessor();