/**
 * Supply Chain Intelligence
 * 
 * Advanced analysis of supply chain geographic distribution,
 * manufacturing networks, and logistics infrastructure.
 */

export interface SupplyChainMapping {
  ticker: string;
  companyName: string;
  supplierDistribution: SupplierGeography[];
  manufacturingNetwork: ManufacturingFacility[];
  distributionNetwork: DistributionCenter[];
  rawMaterialSources: RawMaterialSource[];
  logisticsInfrastructure: LogisticsNode[];
  supplyChainRisks: SupplyChainRisk[];
  geographicDiversification: DiversificationMetrics;
  analysisTimestamp: Date;
  confidence: number;
}

export interface SupplierGeography {
  geography: string;
  supplierCount: number;
  supplierPercentage?: number;
  spendPercentage?: number;
  supplierTier: 'tier1' | 'tier2' | 'tier3' | 'strategic' | 'critical';
  supplierTypes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  diversificationOptions: string[];
  confidence: number;
  source: string;
  extractedText: string;
}

export interface ManufacturingFacility {
  geography: string;
  facilityType: 'assembly' | 'component' | 'final_assembly' | 'testing' | 'packaging';
  capacity?: string;
  productLines: string[];
  employeeCount?: number;
  annualOutput?: string;
  utilizationRate?: number;
  strategicImportance: 'critical' | 'important' | 'standard' | 'backup';
  redundancy: boolean;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface DistributionCenter {
  geography: string;
  centerType: 'regional_hub' | 'local_warehouse' | 'fulfillment_center' | 'cross_dock' | 'returns_center';
  serviceArea: string[];
  capacity?: string;
  throughput?: string;
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  lastMileCapability: boolean;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface RawMaterialSource {
  geography: string;
  materialType: string;
  sourcePercentage?: number;
  criticalityLevel: 'critical' | 'important' | 'standard' | 'substitutable';
  sustainabilityRating?: string;
  riskFactors: string[];
  alternativeSources: string[];
  confidence: number;
  source: string;
  extractedText: string;
}

export interface LogisticsNode {
  geography: string;
  nodeType: 'port' | 'airport' | 'rail_terminal' | 'trucking_hub' | 'border_crossing';
  throughputCapacity?: string;
  serviceRoutes: string[];
  strategicImportance: 'critical' | 'important' | 'standard';
  bottleneckRisk: boolean;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface SupplyChainRisk {
  geography: string;
  riskType: 'geopolitical' | 'natural_disaster' | 'economic' | 'regulatory' | 'operational' | 'cyber';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationStrategies: string[];
  impactAssessment: string;
  confidence: number;
  source: string;
}

export interface DiversificationMetrics {
  supplierConcentration: number; // 0-100, lower is better
  geographicSpread: number; // 0-100, higher is better
  singlePointOfFailureRisk: number; // 0-100, lower is better
  redundancyLevel: number; // 0-100, higher is better
  overallRiskScore: number; // 0-100, lower is better
}

export class SupplyChainIntelligence {
  private readonly SUPPLIER_PATTERNS = [
    // Supplier geographic distribution
    /(?:supplier|suppliers|vendor|vendors)\s+(?:located|based|distributed)\s+(?:in|across|throughout)\s+([A-Za-z\s,]+)/gi,
    /(\d+(?:\.\d+)?)\s*%\s+of\s+(?:supplier|suppliers|vendor|vendors)\s+(?:in|from|located\s+in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?):\s*(\d+)\s+(?:supplier|suppliers|vendor|vendors)/gi,
    /(?:key|critical|strategic)\s+(?:supplier|suppliers)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi,
    /(?:supply\s+chain|supplier\s+base)\s+(?:spans|extends|covers)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly MANUFACTURING_PATTERNS = [
    // Manufacturing facility patterns
    /(?:manufacturing|production|assembly)\s+(?:facility|facilities|plant|plants)\s+(?:in|located\s+in|based\s+in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?)\s+(?:manufacturing|production|assembly)\s+(?:facility|plant|center)/gi,
    /(?:produce|produces|manufacturing)\s+([^.]+?)\s+(?:in|at)\s+([A-Za-z\s,]+)/gi,
    /(\d+)\s+(?:manufacturing|production)\s+(?:facilities|plants|sites)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /(?:final\s+assembly|component\s+manufacturing|testing\s+facility)\s+(?:in|at)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly DISTRIBUTION_PATTERNS = [
    // Distribution and logistics patterns
    /(?:distribution|fulfillment|warehouse)\s+(?:center|centers|facility|facilities)\s+(?:in|located\s+in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?)\s+(?:distribution|fulfillment|logistics)\s+(?:center|hub|facility)/gi,
    /(?:serve|serves|serving)\s+([A-Za-z\s,]+?)\s+(?:from|through)\s+([A-Za-z\s,]+?)\s+(?:facility|center)/gi,
    /(?:regional|local)\s+(?:distribution|fulfillment)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly RAW_MATERIAL_PATTERNS = [
    // Raw material sourcing patterns
    /(?:source|sources|sourcing|sourced)\s+([^.]+?)\s+(?:from|in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?)\s+(?:provides|supplies|sources)\s+(\d+(?:\.\d+)?)\s*%\s+of\s+([^.]+)/gi,
    /(?:raw\s+materials?|components?|parts?)\s+(?:from|sourced\s+from)\s+([A-Za-z\s,]+)/gi,
    /(?:critical|key|essential)\s+(?:materials?|components?)\s+(?:from|sourced\s+in)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly RISK_PATTERNS = [
    // Supply chain risk patterns
    /(?:risk|risks|vulnerability|vulnerabilities)\s+(?:in|from|related\s+to)\s+([A-Za-z\s,]+?)\s+(?:supply\s+chain|operations|suppliers)/gi,
    /(?:geopolitical|regulatory|economic|natural\s+disaster)\s+(?:risk|risks)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi,
    /(?:single\s+source|concentration\s+risk|dependency)\s+(?:in|on)\s+([A-Za-z\s,]+)/gi,
    /(?:diversif|mitigat|reduc)\w+\s+(?:risk|dependency)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi
  ];

  /**
   * Analyze supply chain intelligence from multiple sources
   */
  async analyzeSupplyChain(
    ticker: string,
    companyName: string,
    sources: { type: string; content: string; url: string }[]
  ): Promise<SupplyChainMapping> {
    console.log(`🏭 Analyzing supply chain intelligence for ${ticker} from ${sources.length} sources...`);
    
    const supplierDistribution: SupplierGeography[] = [];
    const manufacturingNetwork: ManufacturingFacility[] = [];
    const distributionNetwork: DistributionCenter[] = [];
    const rawMaterialSources: RawMaterialSource[] = [];
    const logisticsInfrastructure: LogisticsNode[] = [];
    const supplyChainRisks: SupplyChainRisk[] = [];

    // Process each source
    for (const source of sources) {
      try {
        // Extract supplier information
        supplierDistribution.push(...this.extractSupplierGeography(source.content, source.type, source.url));
        
        // Extract manufacturing facilities
        manufacturingNetwork.push(...this.extractManufacturingFacilities(source.content, source.type, source.url));
        
        // Extract distribution centers
        distributionNetwork.push(...this.extractDistributionCenters(source.content, source.type, source.url));
        
        // Extract raw material sources
        rawMaterialSources.push(...this.extractRawMaterialSources(source.content, source.type, source.url));
        
        // Extract logistics infrastructure
        logisticsInfrastructure.push(...this.extractLogisticsNodes(source.content, source.type, source.url));
        
        // Extract supply chain risks
        supplyChainRisks.push(...this.extractSupplyChainRisks(source.content, source.type, source.url));
        
      } catch (error) {
        console.warn(`⚠️ Error processing source ${source.url}:`, error);
      }
    }

    // Deduplicate and consolidate
    const uniqueSuppliers = this.deduplicateSuppliers(supplierDistribution);
    const uniqueManufacturing = this.deduplicateManufacturing(manufacturingNetwork);
    const uniqueDistribution = this.deduplicateDistribution(distributionNetwork);
    const uniqueRawMaterials = this.deduplicateRawMaterials(rawMaterialSources);
    const uniqueLogistics = this.deduplicateLogistics(logisticsInfrastructure);
    const uniqueRisks = this.deduplicateRisks(supplyChainRisks);

    // Calculate diversification metrics
    const geographicDiversification = this.calculateDiversificationMetrics(
      uniqueSuppliers,
      uniqueManufacturing,
      uniqueDistribution
    );

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence([
      ...uniqueSuppliers,
      ...uniqueManufacturing,
      ...uniqueDistribution,
      ...uniqueRawMaterials,
      ...uniqueLogistics
    ]);

    const result: SupplyChainMapping = {
      ticker,
      companyName,
      supplierDistribution: uniqueSuppliers,
      manufacturingNetwork: uniqueManufacturing,
      distributionNetwork: uniqueDistribution,
      rawMaterialSources: uniqueRawMaterials,
      logisticsInfrastructure: uniqueLogistics,
      supplyChainRisks: uniqueRisks,
      geographicDiversification,
      analysisTimestamp: new Date(),
      confidence: overallConfidence
    };

    console.log(`✅ Supply chain analysis completed for ${ticker}`);
    console.log(`📊 Found: ${uniqueSuppliers.length} supplier regions, ${uniqueManufacturing.length} manufacturing sites, ${uniqueDistribution.length} distribution centers`);
    console.log(`🎯 Diversification score: ${geographicDiversification.overallRiskScore.toFixed(1)}/100`);

    return result;
  }

  /**
   * Extract supplier geographic distribution
   */
  private extractSupplierGeography(content: string, sourceType: string, sourceUrl: string): SupplierGeography[] {
    const suppliers: SupplierGeography[] = [];

    for (const pattern of this.SUPPLIER_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let geography: string;
        let supplierCount = 0;
        let supplierPercentage: number | undefined;

        if (match[1] && match[2]) {
          // Handle percentage patterns
          if (!isNaN(parseFloat(match[1]))) {
            supplierPercentage = parseFloat(match[1]);
            geography = this.cleanGeographicReference(match[2]);
          } else if (!isNaN(parseInt(match[2]))) {
            geography = this.cleanGeographicReference(match[1]);
            supplierCount = parseInt(match[2]);
          } else {
            geography = this.cleanGeographicReference(match[1]);
          }
        } else {
          geography = this.cleanGeographicReference(match[1]);
        }

        if (!geography) continue;

        // Determine supplier tier and type
        const supplierTier = this.determineSupplierTier(match[0]);
        const supplierTypes = this.extractSupplierTypes(match[0]);
        const riskLevel = this.assessSupplierRisk(geography, match[0]);

        suppliers.push({
          geography,
          supplierCount: supplierCount || 1,
          supplierPercentage,
          supplierTier,
          supplierTypes,
          riskLevel,
          diversificationOptions: this.identifyDiversificationOptions(geography),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl,
          extractedText: match[0]
        });
      }
    }

    return suppliers;
  }

  /**
   * Extract manufacturing facilities
   */
  private extractManufacturingFacilities(content: string, sourceType: string, sourceUrl: string): ManufacturingFacility[] {
    const facilities: ManufacturingFacility[] = [];

    for (const pattern of this.MANUFACTURING_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let geography: string;
        let productLines: string[] = [];

        if (match[1] && match[2]) {
          // Handle patterns with product and location
          if (this.isGeographicReference(match[2])) {
            productLines = [match[1]];
            geography = this.cleanGeographicReference(match[2]);
          } else {
            geography = this.cleanGeographicReference(match[1]);
          }
        } else {
          geography = this.cleanGeographicReference(match[1]);
        }

        if (!geography) continue;

        const facilityType = this.determineFacilityType(match[0]);
        const strategicImportance = this.assessStrategicImportance(match[0], geography);

        facilities.push({
          geography,
          facilityType,
          productLines,
          strategicImportance,
          redundancy: this.assessRedundancy(match[0]),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl,
          extractedText: match[0]
        });
      }
    }

    return facilities;
  }

  /**
   * Extract distribution centers
   */
  private extractDistributionCenters(content: string, sourceType: string, sourceUrl: string): DistributionCenter[] {
    const centers: DistributionCenter[] = [];

    for (const pattern of this.DISTRIBUTION_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let geography: string;
        let serviceArea: string[] = [];

        if (match[1] && match[2]) {
          // Handle patterns with service area and location
          serviceArea = [match[1]];
          geography = this.cleanGeographicReference(match[2]);
        } else {
          geography = this.cleanGeographicReference(match[1]);
        }

        if (!geography) continue;

        const centerType = this.determineCenterType(match[0]);
        const automationLevel = this.assessAutomationLevel(match[0]);

        centers.push({
          geography,
          centerType,
          serviceArea,
          automationLevel,
          lastMileCapability: this.assessLastMileCapability(match[0]),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl,
          extractedText: match[0]
        });
      }
    }

    return centers;
  }

  /**
   * Extract raw material sources
   */
  private extractRawMaterialSources(content: string, sourceType: string, sourceUrl: string): RawMaterialSource[] {
    const sources: RawMaterialSource[] = [];

    for (const pattern of this.RAW_MATERIAL_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let geography: string;
        let materialType: string;
        let sourcePercentage: number | undefined;

        if (match[1] && match[2] && match[3]) {
          // Handle percentage patterns
          geography = this.cleanGeographicReference(match[1]);
          sourcePercentage = parseFloat(match[2]);
          materialType = match[3];
        } else if (match[1] && match[2]) {
          materialType = match[1];
          geography = this.cleanGeographicReference(match[2]);
        } else {
          geography = this.cleanGeographicReference(match[1]);
          materialType = 'General materials';
        }

        if (!geography) continue;

        const criticalityLevel = this.assessMaterialCriticality(match[0]);
        const riskFactors = this.identifyRiskFactors(geography, materialType);

        sources.push({
          geography,
          materialType,
          sourcePercentage,
          criticalityLevel,
          riskFactors,
          alternativeSources: this.identifyAlternativeSources(geography, materialType),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl,
          extractedText: match[0]
        });
      }
    }

    return sources;
  }

  /**
   * Extract logistics nodes
   */
  private extractLogisticsNodes(content: string, sourceType: string, sourceUrl: string): LogisticsNode[] {
    const nodes: LogisticsNode[] = [];

    const logisticsPatterns = [
      /(?:port|ports|seaport|airport|rail\s+terminal|trucking\s+hub)\s+(?:in|at|located\s+in)\s+([A-Za-z\s,]+)/gi,
      /(?:logistics|transportation)\s+(?:hub|center|facility)\s+(?:in|at)\s+([A-Za-z\s,]+)/gi,
      /(?:ship|shipping|transport|transportation)\s+(?:through|via)\s+([A-Za-z\s,]+)/gi
    ];

    for (const pattern of logisticsPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (!geography) continue;

        const nodeType = this.determineNodeType(match[0]);
        const strategicImportance = this.assessLogisticsImportance(match[0]);

        nodes.push({
          geography,
          nodeType,
          serviceRoutes: [geography],
          strategicImportance,
          bottleneckRisk: this.assessBottleneckRisk(match[0], geography),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl,
          extractedText: match[0]
        });
      }
    }

    return nodes;
  }

  /**
   * Extract supply chain risks
   */
  private extractSupplyChainRisks(content: string, sourceType: string, sourceUrl: string): SupplyChainRisk[] {
    const risks: SupplyChainRisk[] = [];

    for (const pattern of this.RISK_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (!geography) continue;

        const riskType = this.determineRiskType(match[0]);
        const riskLevel = this.assessRiskLevel(match[0]);
        const mitigationStrategies = this.extractMitigationStrategies(match[0]);

        risks.push({
          geography,
          riskType,
          riskLevel,
          description: match[0].trim(),
          mitigationStrategies,
          impactAssessment: this.assessRiskImpact(match[0]),
          confidence: this.calculateConfidence(match[0], sourceType),
          source: sourceUrl
        });
      }
    }

    return risks;
  }

  /**
   * Calculate diversification metrics
   */
  private calculateDiversificationMetrics(
    suppliers: SupplierGeography[],
    manufacturing: ManufacturingFacility[],
    distribution: DistributionCenter[]
  ): DiversificationMetrics {
    // Calculate supplier concentration (Herfindahl-Hirschman Index style)
    const supplierConcentration = this.calculateConcentration(
      suppliers.map(s => s.supplierPercentage || (100 / suppliers.length))
    );

    // Calculate geographic spread
    const allGeographies = new Set([
      ...suppliers.map(s => s.geography),
      ...manufacturing.map(m => m.geography),
      ...distribution.map(d => d.geography)
    ]);
    const geographicSpread = Math.min(100, allGeographies.size * 10);

    // Assess single point of failure risk
    const criticalSuppliers = suppliers.filter(s => s.supplierTier === 'critical').length;
    const criticalManufacturing = manufacturing.filter(m => m.strategicImportance === 'critical').length;
    const singlePointOfFailureRisk = Math.min(100, (criticalSuppliers + criticalManufacturing) * 20);

    // Calculate redundancy level
    const redundantFacilities = manufacturing.filter(m => m.redundancy).length;
    const redundancyLevel = manufacturing.length > 0 ? (redundantFacilities / manufacturing.length) * 100 : 0;

    // Overall risk score (lower is better)
    const overallRiskScore = (supplierConcentration * 0.3) + 
                            ((100 - geographicSpread) * 0.25) + 
                            (singlePointOfFailureRisk * 0.25) + 
                            ((100 - redundancyLevel) * 0.2);

    return {
      supplierConcentration,
      geographicSpread,
      singlePointOfFailureRisk,
      redundancyLevel,
      overallRiskScore
    };
  }

  /**
   * Helper methods
   */
  private cleanGeographicReference(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private isGeographicReference(text: string): boolean {
    const geographicKeywords = [
      'china', 'usa', 'europe', 'asia', 'america', 'japan', 'germany', 'france', 'uk', 'india',
      'mexico', 'canada', 'brazil', 'australia', 'korea', 'singapore', 'thailand', 'vietnam'
    ];
    
    const lowerText = text.toLowerCase();
    return geographicKeywords.some(keyword => lowerText.includes(keyword));
  }

  private determineSupplierTier(text: string): SupplierGeography['supplierTier'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('key') || lowerText.includes('strategic')) {
      return 'critical';
    } else if (lowerText.includes('tier 1') || lowerText.includes('primary')) {
      return 'tier1';
    } else if (lowerText.includes('tier 2') || lowerText.includes('secondary')) {
      return 'tier2';
    } else if (lowerText.includes('tier 3')) {
      return 'tier3';
    }
    
    return 'strategic';
  }

  private extractSupplierTypes(text: string): string[] {
    const types: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('component')) types.push('Component Supplier');
    if (lowerText.includes('material')) types.push('Material Supplier');
    if (lowerText.includes('service')) types.push('Service Provider');
    if (lowerText.includes('logistics')) types.push('Logistics Provider');
    if (lowerText.includes('technology')) types.push('Technology Supplier');
    
    return types.length > 0 ? types : ['General Supplier'];
  }

  private assessSupplierRisk(geography: string, text: string): SupplierGeography['riskLevel'] {
    const lowerText = text.toLowerCase();
    const lowerGeography = geography.toLowerCase();
    
    // High-risk indicators
    if (lowerText.includes('risk') || lowerText.includes('vulnerable') || lowerText.includes('critical dependency')) {
      return 'high';
    }
    
    // Geographic risk assessment (simplified)
    const highRiskRegions = ['russia', 'ukraine', 'belarus', 'myanmar'];
    if (highRiskRegions.some(region => lowerGeography.includes(region))) {
      return 'high';
    }
    
    const mediumRiskRegions = ['china', 'turkey', 'venezuela'];
    if (mediumRiskRegions.some(region => lowerGeography.includes(region))) {
      return 'medium';
    }
    
    return 'low';
  }

  private identifyDiversificationOptions(geography: string): string[] {
    const options: string[] = [];
    const lowerGeography = geography.toLowerCase();
    
    // Suggest regional alternatives
    if (lowerGeography.includes('china')) {
      options.push('Vietnam', 'Thailand', 'Malaysia', 'India');
    } else if (lowerGeography.includes('europe')) {
      options.push('Eastern Europe', 'Turkey', 'North Africa');
    } else if (lowerGeography.includes('usa') || lowerGeography.includes('america')) {
      options.push('Mexico', 'Canada', 'Central America');
    }
    
    return options;
  }

  private determineFacilityType(text: string): ManufacturingFacility['facilityType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('final assembly') || lowerText.includes('final manufacturing')) {
      return 'final_assembly';
    } else if (lowerText.includes('component') || lowerText.includes('parts')) {
      return 'component';
    } else if (lowerText.includes('testing') || lowerText.includes('quality')) {
      return 'testing';
    } else if (lowerText.includes('packaging') || lowerText.includes('packing')) {
      return 'packaging';
    }
    
    return 'assembly';
  }

  private assessStrategicImportance(text: string, geography: string): ManufacturingFacility['strategicImportance'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('key') || lowerText.includes('primary')) {
      return 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('main') || lowerText.includes('major')) {
      return 'important';
    } else if (lowerText.includes('backup') || lowerText.includes('secondary') || lowerText.includes('alternative')) {
      return 'backup';
    }
    
    return 'standard';
  }

  private assessRedundancy(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('redundan') || lowerText.includes('backup') || lowerText.includes('alternative') || lowerText.includes('multiple');
  }

  private determineCenterType(text: string): DistributionCenter['centerType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('regional hub') || lowerText.includes('distribution hub')) {
      return 'regional_hub';
    } else if (lowerText.includes('fulfillment') || lowerText.includes('e-commerce')) {
      return 'fulfillment_center';
    } else if (lowerText.includes('cross dock') || lowerText.includes('cross-dock')) {
      return 'cross_dock';
    } else if (lowerText.includes('returns') || lowerText.includes('reverse logistics')) {
      return 'returns_center';
    }
    
    return 'local_warehouse';
  }

  private assessAutomationLevel(text: string): DistributionCenter['automationLevel'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('fully automated') || lowerText.includes('robotic') || lowerText.includes('ai-powered')) {
      return 'fully_automated';
    } else if (lowerText.includes('semi-automated') || lowerText.includes('partially automated')) {
      return 'semi_automated';
    }
    
    return 'manual';
  }

  private assessLastMileCapability(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('last mile') || lowerText.includes('delivery') || lowerText.includes('direct to consumer');
  }

  private assessMaterialCriticality(text: string): RawMaterialSource['criticalityLevel'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('essential') || lowerText.includes('key')) {
      return 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('significant')) {
      return 'important';
    } else if (lowerText.includes('substitutable') || lowerText.includes('replaceable')) {
      return 'substitutable';
    }
    
    return 'standard';
  }

  private identifyRiskFactors(geography: string, materialType: string): string[] {
    const risks: string[] = [];
    const lowerGeography = geography.toLowerCase();
    
    // Geographic risks
    if (lowerGeography.includes('china')) {
      risks.push('Geopolitical tensions', 'Trade restrictions');
    }
    if (lowerGeography.includes('russia') || lowerGeography.includes('ukraine')) {
      risks.push('War and conflict', 'Sanctions');
    }
    
    // Material-specific risks
    if (materialType.toLowerCase().includes('semiconductor') || materialType.toLowerCase().includes('chip')) {
      risks.push('Technology restrictions', 'Supply shortage');
    }
    if (materialType.toLowerCase().includes('rare earth') || materialType.toLowerCase().includes('lithium')) {
      risks.push('Resource scarcity', 'Price volatility');
    }
    
    return risks;
  }

  private identifyAlternativeSources(geography: string, materialType: string): string[] {
    const alternatives: string[] = [];
    const lowerGeography = geography.toLowerCase();
    
    // Geographic alternatives
    if (lowerGeography.includes('china')) {
      alternatives.push('Southeast Asia', 'India', 'Latin America');
    } else if (lowerGeography.includes('russia')) {
      alternatives.push('Australia', 'Canada', 'Brazil');
    }
    
    return alternatives;
  }

  private determineNodeType(text: string): LogisticsNode['nodeType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('port') || lowerText.includes('seaport')) {
      return 'port';
    } else if (lowerText.includes('airport')) {
      return 'airport';
    } else if (lowerText.includes('rail')) {
      return 'rail_terminal';
    } else if (lowerText.includes('trucking') || lowerText.includes('highway')) {
      return 'trucking_hub';
    } else if (lowerText.includes('border') || lowerText.includes('crossing')) {
      return 'border_crossing';
    }
    
    return 'trucking_hub';
  }

  private assessLogisticsImportance(text: string): LogisticsNode['strategicImportance'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('key') || lowerText.includes('primary')) {
      return 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('major')) {
      return 'important';
    }
    
    return 'standard';
  }

  private assessBottleneckRisk(text: string, geography: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('bottleneck') || lowerText.includes('congestion') || lowerText.includes('capacity constraint');
  }

  private determineRiskType(text: string): SupplyChainRisk['riskType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('geopolitical') || lowerText.includes('political') || lowerText.includes('trade war')) {
      return 'geopolitical';
    } else if (lowerText.includes('natural disaster') || lowerText.includes('earthquake') || lowerText.includes('flood')) {
      return 'natural_disaster';
    } else if (lowerText.includes('economic') || lowerText.includes('recession') || lowerText.includes('inflation')) {
      return 'economic';
    } else if (lowerText.includes('regulatory') || lowerText.includes('compliance') || lowerText.includes('regulation')) {
      return 'regulatory';
    } else if (lowerText.includes('cyber') || lowerText.includes('security') || lowerText.includes('hack')) {
      return 'cyber';
    }
    
    return 'operational';
  }

  private assessRiskLevel(text: string): SupplyChainRisk['riskLevel'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('severe') || lowerText.includes('high risk')) {
      return 'critical';
    } else if (lowerText.includes('significant') || lowerText.includes('major') || lowerText.includes('high')) {
      return 'high';
    } else if (lowerText.includes('moderate') || lowerText.includes('medium')) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractMitigationStrategies(text: string): string[] {
    const strategies: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('diversif')) strategies.push('Geographic diversification');
    if (lowerText.includes('alternative') || lowerText.includes('backup')) strategies.push('Alternative sourcing');
    if (lowerText.includes('inventory') || lowerText.includes('stock')) strategies.push('Strategic inventory');
    if (lowerText.includes('contract') || lowerText.includes('agreement')) strategies.push('Long-term contracts');
    
    return strategies;
  }

  private assessRiskImpact(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('significant impact') || lowerText.includes('major disruption')) {
      return 'High impact on operations and revenue';
    } else if (lowerText.includes('moderate impact') || lowerText.includes('some disruption')) {
      return 'Moderate impact on specific operations';
    }
    
    return 'Limited impact with existing mitigation measures';
  }

  private calculateConcentration(percentages: number[]): number {
    // Calculate Herfindahl-Hirschman Index (0-100 scale)
    const hhi = percentages.reduce((sum, pct) => sum + Math.pow(pct, 2), 0);
    return Math.min(100, hhi / 100); // Normalize to 0-100
  }

  private calculateConfidence(text: string, sourceType: string): number {
    let confidence = 0.6; // Base confidence
    
    // Source type weighting
    const sourceWeights: Record<string, number> = {
      'sustainability_report': 0.90,
      'sec_filing': 0.85,
      'investor_presentation': 0.80,
      'website': 0.70
    };
    
    confidence *= (sourceWeights[sourceType] || 0.70);
    
    // Text quality indicators
    if (text.includes('%') || /\d+/.test(text)) confidence += 0.1;
    if (text.length > 50) confidence += 0.05;
    if (text.includes('critical') || text.includes('key') || text.includes('strategic')) confidence += 0.05;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private calculateOverallConfidence(items: any[]): number {
    if (items.length === 0) return 0;
    
    const totalConfidence = items.reduce((sum, item) => sum + (item.confidence || 0), 0);
    return totalConfidence / items.length;
  }

  /**
   * Deduplication methods
   */
  private deduplicateSuppliers(suppliers: SupplierGeography[]): SupplierGeography[] {
    const seen = new Map<string, SupplierGeography>();
    
    for (const supplier of suppliers) {
      const key = `${supplier.geography}-${supplier.supplierTier}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < supplier.confidence) {
        seen.set(key, supplier);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateManufacturing(facilities: ManufacturingFacility[]): ManufacturingFacility[] {
    const seen = new Map<string, ManufacturingFacility>();
    
    for (const facility of facilities) {
      const key = `${facility.geography}-${facility.facilityType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < facility.confidence) {
        seen.set(key, facility);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateDistribution(centers: DistributionCenter[]): DistributionCenter[] {
    const seen = new Map<string, DistributionCenter>();
    
    for (const center of centers) {
      const key = `${center.geography}-${center.centerType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < center.confidence) {
        seen.set(key, center);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateRawMaterials(sources: RawMaterialSource[]): RawMaterialSource[] {
    const seen = new Map<string, RawMaterialSource>();
    
    for (const source of sources) {
      const key = `${source.geography}-${source.materialType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < source.confidence) {
        seen.set(key, source);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateLogistics(nodes: LogisticsNode[]): LogisticsNode[] {
    const seen = new Map<string, LogisticsNode>();
    
    for (const node of nodes) {
      const key = `${node.geography}-${node.nodeType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < node.confidence) {
        seen.set(key, node);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateRisks(risks: SupplyChainRisk[]): SupplyChainRisk[] {
    const seen = new Map<string, SupplyChainRisk>();
    
    for (const risk of risks) {
      const key = `${risk.geography}-${risk.riskType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < risk.confidence) {
        seen.set(key, risk);
      }
    }
    
    return Array.from(seen.values());
  }
}