/**
 * Multi-Source Data Integration Framework
 * 
 * Combines data from multiple sources with confidence weighting,
 * cross-validation, conflict resolution, and data lineage tracking.
 */

import { SustainabilityData, SustainabilityReportParser } from './sustainabilityReportParser';
import { InvestorRelationsData, InvestorRelationsParser } from './investorRelationsParser';
import { GeographicReference, GeographicEntityExtractor } from './geographicEntityExtractor';

export interface IntegratedCompanyData {
  ticker: string;
  companyName: string;
  lastUpdated: Date;
  dataFreshness: number; // Days since last update
  overallConfidence: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  geographicExposures: IntegratedGeographicExposure[];
  operationalPresence: IntegratedOperationalPresence[];
  strategicInsights: IntegratedStrategicInsight[];
  dataLineage: DataLineage[];
  qualityMetrics: QualityMetrics;
}

export interface IntegratedGeographicExposure {
  geography: string;
  region: string;
  revenuePercentage?: number;
  revenueAmount?: number;
  employeeCount?: number;
  facilityCount?: number;
  marketShare?: number;
  confidence: number;
  evidenceCount: number;
  sources: string[];
  lastUpdated: Date;
  conflictResolution?: ConflictResolution;
}

export interface IntegratedOperationalPresence {
  geography: string;
  operationType: 'headquarters' | 'manufacturing' | 'sales' | 'rd' | 'supply_chain' | 'other';
  description: string;
  metrics: OperationalMetric[];
  confidence: number;
  sources: string[];
  lastUpdated: Date;
}

export interface IntegratedStrategicInsight {
  geography: string;
  insightType: 'expansion' | 'investment' | 'partnership' | 'divestiture' | 'guidance';
  description: string;
  timeline: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  sources: string[];
  lastUpdated: Date;
}

export interface OperationalMetric {
  metric: string;
  value: number | string;
  unit: string;
  confidence: number;
}

export interface DataLineage {
  sourceType: 'sec_filing' | 'sustainability_report' | 'investor_presentation' | 'earnings_call' | 'annual_report';
  sourceName: string;
  extractionDate: Date;
  dataPoints: number;
  confidence: number;
  url?: string;
}

export interface QualityMetrics {
  totalDataPoints: number;
  averageConfidence: number;
  sourceCount: number;
  crossValidatedPoints: number;
  conflictCount: number;
  freshnessScore: number; // 0-100, higher is fresher
  completenessScore: number; // 0-100, higher is more complete
}

export interface ConflictResolution {
  conflictType: 'value_mismatch' | 'source_disagreement' | 'temporal_inconsistency';
  conflictingValues: any[];
  resolutionMethod: 'highest_confidence' | 'most_recent' | 'weighted_average' | 'expert_judgment';
  resolvedValue: any;
  confidence: number;
}

export interface DataSource {
  type: 'sustainability' | 'investor_relations' | 'sec_filing' | 'website' | 'other';
  content: string;
  metadata: {
    ticker: string;
    companyName: string;
    documentType: string;
    period: string;
    url?: string;
    lastUpdated: Date;
    priority: 1 | 2 | 3;
  };
}

export class MultiSourceIntegrator {
  private sustainabilityParser: SustainabilityReportParser;
  private investorRelationsParser: InvestorRelationsParser;
  private geographicExtractor: GeographicEntityExtractor;

  constructor() {
    this.sustainabilityParser = new SustainabilityReportParser();
    this.investorRelationsParser = new InvestorRelationsParser();
    this.geographicExtractor = new GeographicEntityExtractor();
  }

  /**
   * Integrate data from multiple sources for a company
   */
  async integrateCompanyData(ticker: string, companyName: string, sources: DataSource[]): Promise<IntegratedCompanyData> {
    console.log(`🔄 Integrating data for ${ticker} from ${sources.length} sources...`);
    
    const startTime = Date.now();
    
    // Parse data from each source
    const parsedData = await this.parseAllSources(sources);
    
    // Extract geographic entities
    const geographicEntities = this.extractAllGeographicEntities(sources);
    
    // Integrate geographic exposures
    const geographicExposures = this.integrateGeographicExposures(parsedData, geographicEntities);
    
    // Integrate operational presence
    const operationalPresence = this.integrateOperationalPresence(parsedData);
    
    // Integrate strategic insights
    const strategicInsights = this.integrateStrategicInsights(parsedData);
    
    // Create data lineage
    const dataLineage = this.createDataLineage(sources, parsedData);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(geographicExposures, operationalPresence, strategicInsights, dataLineage);
    
    // Calculate overall confidence and evidence level
    const overallConfidence = this.calculateOverallConfidence(qualityMetrics);
    const evidenceLevel = this.determineEvidenceLevel(qualityMetrics, overallConfidence);
    
    const integratedData: IntegratedCompanyData = {
      ticker,
      companyName,
      lastUpdated: new Date(),
      dataFreshness: this.calculateDataFreshness(sources),
      overallConfidence,
      evidenceLevel,
      geographicExposures,
      operationalPresence,
      strategicInsights,
      dataLineage,
      qualityMetrics
    };
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Integration completed for ${ticker} in ${processingTime}ms`);
    console.log(`📊 Quality: ${evidenceLevel} evidence, ${overallConfidence.toFixed(2)} confidence, ${qualityMetrics.sourceCount} sources`);
    
    return integratedData;
  }

  /**
   * Parse data from all sources
   */
  private async parseAllSources(sources: DataSource[]): Promise<{
    sustainability: SustainabilityData[];
    investorRelations: InvestorRelationsData[];
  }> {
    const sustainability: SustainabilityData[] = [];
    const investorRelations: InvestorRelationsData[] = [];
    
    for (const source of sources) {
      try {
        if (source.type === 'sustainability') {
          const sustainabilitySource = {
            ticker: source.metadata.ticker,
            companyName: source.metadata.companyName,
            reportType: source.metadata.documentType as any,
            reportYear: parseInt(source.metadata.period),
            reportUrl: source.metadata.url || '',
            reportTitle: source.metadata.documentType,
            lastUpdated: source.metadata.lastUpdated,
            priority: source.metadata.priority
          };
          
          const data = await this.sustainabilityParser.parseSustainabilityReport(source.content, sustainabilitySource);
          sustainability.push(data);
        } else if (source.type === 'investor_relations') {
          const investorSource = {
            ticker: source.metadata.ticker,
            companyName: source.metadata.companyName,
            documentType: source.metadata.documentType as any,
            period: source.metadata.period,
            documentUrl: source.metadata.url || '',
            documentTitle: source.metadata.documentType,
            lastUpdated: source.metadata.lastUpdated,
            priority: source.metadata.priority
          };
          
          const data = await this.investorRelationsParser.parseInvestorRelationsDocument(source.content, investorSource);
          investorRelations.push(data);
        }
      } catch (error) {
        console.error(`Error parsing ${source.type} source:`, error);
      }
    }
    
    return { sustainability, investorRelations };
  }

  /**
   * Extract geographic entities from all sources
   */
  private extractAllGeographicEntities(sources: DataSource[]): GeographicReference[] {
    const allEntities: GeographicReference[] = [];
    
    for (const source of sources) {
      const entities = this.geographicExtractor.extractGeographicEntities(source.content);
      allEntities.push(...entities);
    }
    
    return allEntities;
  }

  /**
   * Integrate geographic exposures from multiple sources
   */
  private integrateGeographicExposures(
    parsedData: { sustainability: SustainabilityData[]; investorRelations: InvestorRelationsData[] },
    geographicEntities: GeographicReference[]
  ): IntegratedGeographicExposure[] {
    const exposureMap = new Map<string, IntegratedGeographicExposure>();
    
    // Process sustainability data
    for (const sustainabilityData of parsedData.sustainability) {
      // Process facility locations
      for (const facility of sustainabilityData.facilityLocations) {
        this.addOrUpdateExposure(exposureMap, {
          geography: facility.country,
          region: facility.region,
          facilityCount: facility.facilityCount,
          confidence: facility.confidence,
          source: facility.source,
          lastUpdated: new Date()
        });
      }
      
      // Process employee headcount
      for (const employee of sustainabilityData.employeeHeadcount) {
        this.addOrUpdateExposure(exposureMap, {
          geography: employee.country,
          region: employee.region,
          employeeCount: employee.employeeCount,
          confidence: employee.confidence,
          source: employee.source,
          lastUpdated: new Date()
        });
      }
    }
    
    // Process investor relations data
    for (const investorData of parsedData.investorRelations) {
      // Process revenue segments
      for (const segment of investorData.revenueSegments) {
        this.addOrUpdateExposure(exposureMap, {
          geography: segment.geography,
          region: this.geographicExtractor.getRegionForCountry(segment.geography),
          revenuePercentage: segment.revenuePercentage,
          revenueAmount: segment.revenueAmount,
          confidence: segment.confidence,
          source: segment.source,
          lastUpdated: new Date()
        });
      }
      
      // Process operational metrics
      for (const metric of investorData.operationalMetrics) {
        const updateData: any = {
          geography: metric.geography,
          region: this.geographicExtractor.getRegionForCountry(metric.geography),
          confidence: metric.confidence,
          source: metric.source,
          lastUpdated: new Date()
        };
        
        if (metric.metric === 'employees') {
          updateData.employeeCount = typeof metric.value === 'number' ? metric.value : parseInt(metric.value.toString());
        } else if (metric.metric === 'facilities') {
          updateData.facilityCount = typeof metric.value === 'number' ? metric.value : parseInt(metric.value.toString());
        } else if (metric.metric === 'market_share') {
          updateData.marketShare = typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString());
        }
        
        this.addOrUpdateExposure(exposureMap, updateData);
      }
    }
    
    // Process geographic entities for additional context
    for (const entity of geographicEntities) {
      if (entity.quantitativeData) {
        const updateData: any = {
          geography: entity.entity.normalizedName,
          region: this.geographicExtractor.getRegionForCountry(entity.entity.normalizedName),
          confidence: entity.entity.confidence,
          source: 'geographic_extraction',
          lastUpdated: new Date()
        };
        
        if (entity.quantitativeData.type === 'revenue_percentage') {
          updateData.revenuePercentage = entity.quantitativeData.value;
        } else if (entity.quantitativeData.type === 'employee_count') {
          updateData.employeeCount = entity.quantitativeData.value;
        } else if (entity.quantitativeData.type === 'facility_count') {
          updateData.facilityCount = entity.quantitativeData.value;
        }
        
        this.addOrUpdateExposure(exposureMap, updateData);
      }
    }
    
    return Array.from(exposureMap.values());
  }

  /**
   * Add or update geographic exposure
   */
  private addOrUpdateExposure(
    exposureMap: Map<string, IntegratedGeographicExposure>,
    updateData: {
      geography: string;
      region: string;
      revenuePercentage?: number;
      revenueAmount?: number;
      employeeCount?: number;
      facilityCount?: number;
      marketShare?: number;
      confidence: number;
      source: string;
      lastUpdated: Date;
    }
  ): void {
    const key = updateData.geography;
    
    if (exposureMap.has(key)) {
      const existing = exposureMap.get(key)!;
      
      // Merge data with conflict resolution
      const merged: IntegratedGeographicExposure = {
        ...existing,
        revenuePercentage: this.resolveConflict(existing.revenuePercentage, updateData.revenuePercentage, existing.confidence, updateData.confidence),
        revenueAmount: this.resolveConflict(existing.revenueAmount, updateData.revenueAmount, existing.confidence, updateData.confidence),
        employeeCount: this.resolveConflict(existing.employeeCount, updateData.employeeCount, existing.confidence, updateData.confidence),
        facilityCount: this.resolveConflict(existing.facilityCount, updateData.facilityCount, existing.confidence, updateData.confidence),
        marketShare: this.resolveConflict(existing.marketShare, updateData.marketShare, existing.confidence, updateData.confidence),
        confidence: Math.max(existing.confidence, updateData.confidence),
        evidenceCount: existing.evidenceCount + 1,
        sources: [...existing.sources, updateData.source],
        lastUpdated: new Date(Math.max(existing.lastUpdated.getTime(), updateData.lastUpdated.getTime()))
      };
      
      exposureMap.set(key, merged);
    } else {
      const newExposure: IntegratedGeographicExposure = {
        geography: updateData.geography,
        region: updateData.region,
        revenuePercentage: updateData.revenuePercentage,
        revenueAmount: updateData.revenueAmount,
        employeeCount: updateData.employeeCount,
        facilityCount: updateData.facilityCount,
        marketShare: updateData.marketShare,
        confidence: updateData.confidence,
        evidenceCount: 1,
        sources: [updateData.source],
        lastUpdated: updateData.lastUpdated
      };
      
      exposureMap.set(key, newExposure);
    }
  }

  /**
   * Resolve conflicts between data values
   */
  private resolveConflict<T>(existing: T | undefined, incoming: T | undefined, existingConfidence: number, incomingConfidence: number): T | undefined {
    if (existing === undefined) return incoming;
    if (incoming === undefined) return existing;
    
    // Use highest confidence value
    return incomingConfidence > existingConfidence ? incoming : existing;
  }

  /**
   * Integrate operational presence data
   */
  private integrateOperationalPresence(
    parsedData: { sustainability: SustainabilityData[]; investorRelations: InvestorRelationsData[] }
  ): IntegratedOperationalPresence[] {
    const presenceMap = new Map<string, IntegratedOperationalPresence>();
    
    // Process sustainability data
    for (const sustainabilityData of parsedData.sustainability) {
      // Manufacturing locations
      for (const manufacturing of sustainabilityData.manufacturingLocations) {
        const key = `${manufacturing.country}-manufacturing`;
        this.addOrUpdatePresence(presenceMap, key, {
          geography: manufacturing.country,
          operationType: 'manufacturing',
          description: `Manufacturing operations: ${manufacturing.productTypes.join(', ')}`,
          metrics: [
            { metric: 'facility_count', value: manufacturing.facilityCount, unit: 'count', confidence: manufacturing.confidence }
          ],
          confidence: manufacturing.confidence,
          sources: [manufacturing.source],
          lastUpdated: new Date()
        });
      }
      
      // R&D centers
      for (const rd of sustainabilityData.rdCenters) {
        const key = `${rd.country}-rd`;
        this.addOrUpdatePresence(presenceMap, key, {
          geography: rd.country,
          operationType: 'rd',
          description: `R&D operations: ${rd.focusAreas.join(', ')}`,
          metrics: [
            { metric: 'center_count', value: rd.centerCount, unit: 'count', confidence: rd.confidence }
          ],
          confidence: rd.confidence,
          sources: [rd.source],
          lastUpdated: new Date()
        });
      }
      
      // Sales offices
      for (const sales of sustainabilityData.salesOffices) {
        const key = `${sales.country}-sales`;
        this.addOrUpdatePresence(presenceMap, key, {
          geography: sales.country,
          operationType: 'sales',
          description: 'Sales operations',
          metrics: [
            { metric: 'office_count', value: sales.officeCount, unit: 'count', confidence: sales.confidence }
          ],
          confidence: sales.confidence,
          sources: [sales.source],
          lastUpdated: new Date()
        });
      }
    }
    
    return Array.from(presenceMap.values());
  }

  /**
   * Add or update operational presence
   */
  private addOrUpdatePresence(
    presenceMap: Map<string, IntegratedOperationalPresence>,
    key: string,
    presenceData: IntegratedOperationalPresence
  ): void {
    if (presenceMap.has(key)) {
      const existing = presenceMap.get(key)!;
      
      const merged: IntegratedOperationalPresence = {
        ...existing,
        description: `${existing.description}; ${presenceData.description}`,
        metrics: [...existing.metrics, ...presenceData.metrics],
        confidence: Math.max(existing.confidence, presenceData.confidence),
        sources: [...existing.sources, ...presenceData.sources],
        lastUpdated: new Date(Math.max(existing.lastUpdated.getTime(), presenceData.lastUpdated.getTime()))
      };
      
      presenceMap.set(key, merged);
    } else {
      presenceMap.set(key, presenceData);
    }
  }

  /**
   * Integrate strategic insights
   */
  private integrateStrategicInsights(
    parsedData: { sustainability: SustainabilityData[]; investorRelations: InvestorRelationsData[] }
  ): IntegratedStrategicInsight[] {
    const insights: IntegratedStrategicInsight[] = [];
    
    // Process investor relations data for strategic insights
    for (const investorData of parsedData.investorRelations) {
      // Strategic initiatives
      for (const initiative of investorData.strategicInitiatives) {
        insights.push({
          geography: initiative.geography,
          insightType: initiative.initiative === 'market_expansion' ? 'expansion' : 'investment',
          description: initiative.expectedOutcome,
          timeline: initiative.timeline,
          impact: initiative.investment && initiative.investment > 1000000000 ? 'high' : 'medium',
          confidence: initiative.confidence,
          sources: [initiative.source],
          lastUpdated: new Date()
        });
      }
      
      // Market expansion
      for (const expansion of investorData.marketExpansion) {
        insights.push({
          geography: expansion.targetGeography,
          insightType: 'expansion',
          description: `${expansion.expansionType} expansion planned`,
          timeline: expansion.timeline,
          impact: expansion.investment && expansion.investment > 500000000 ? 'high' : 'medium',
          confidence: expansion.confidence,
          sources: [expansion.source],
          lastUpdated: new Date()
        });
      }
      
      // Geographic guidance
      for (const guidance of investorData.geographicGuidance) {
        insights.push({
          geography: guidance.geography,
          insightType: 'guidance',
          description: `${guidance.guidanceType}: ${guidance.guidanceValue}`,
          timeline: guidance.period,
          impact: 'medium',
          confidence: guidance.confidence,
          sources: [guidance.source],
          lastUpdated: new Date()
        });
      }
    }
    
    return insights;
  }

  /**
   * Create data lineage tracking
   */
  private createDataLineage(sources: DataSource[], parsedData: any): DataLineage[] {
    const lineage: DataLineage[] = [];
    
    for (const source of sources) {
      let dataPoints = 0;
      let confidence = 0.5;
      
      // Count data points based on source type
      if (source.type === 'sustainability') {
        // Estimate data points from sustainability reports
        dataPoints = source.content.length / 1000; // Rough estimate
        confidence = 0.8;
      } else if (source.type === 'investor_relations') {
        // Estimate data points from investor relations
        dataPoints = source.content.length / 500; // Rough estimate
        confidence = 0.85;
      }
      
      lineage.push({
        sourceType: this.mapSourceType(source.type),
        sourceName: source.metadata.documentType,
        extractionDate: new Date(),
        dataPoints: Math.round(dataPoints),
        confidence,
        url: source.metadata.url
      });
    }
    
    return lineage;
  }

  /**
   * Map source type to lineage type
   */
  private mapSourceType(sourceType: string): DataLineage['sourceType'] {
    const mapping: Record<string, DataLineage['sourceType']> = {
      'sustainability': 'sustainability_report',
      'investor_relations': 'investor_presentation',
      'sec_filing': 'sec_filing',
      'website': 'annual_report',
      'other': 'annual_report'
    };
    
    return mapping[sourceType] || 'annual_report';
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    geographicExposures: IntegratedGeographicExposure[],
    operationalPresence: IntegratedOperationalPresence[],
    strategicInsights: IntegratedStrategicInsight[],
    dataLineage: DataLineage[]
  ): QualityMetrics {
    const totalDataPoints = geographicExposures.length + operationalPresence.length + strategicInsights.length;
    
    const allConfidences = [
      ...geographicExposures.map(e => e.confidence),
      ...operationalPresence.map(p => p.confidence),
      ...strategicInsights.map(s => s.confidence)
    ];
    
    const averageConfidence = allConfidences.length > 0 
      ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length 
      : 0;
    
    const sourceCount = dataLineage.length;
    
    const crossValidatedPoints = geographicExposures.filter(e => e.evidenceCount > 1).length;
    
    const conflictCount = 0; // TODO: Implement conflict detection
    
    // Calculate freshness score (0-100, based on most recent data)
    const mostRecentDate = Math.max(
      ...geographicExposures.map(e => e.lastUpdated.getTime()),
      ...operationalPresence.map(p => p.lastUpdated.getTime()),
      ...strategicInsights.map(s => s.lastUpdated.getTime())
    );
    
    const daysSinceUpdate = (Date.now() - mostRecentDate) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 100 - daysSinceUpdate * 2); // Decrease 2 points per day
    
    // Calculate completeness score (0-100, based on data coverage)
    const hasRevenue = geographicExposures.some(e => e.revenuePercentage !== undefined);
    const hasEmployees = geographicExposures.some(e => e.employeeCount !== undefined);
    const hasFacilities = geographicExposures.some(e => e.facilityCount !== undefined);
    const hasOperations = operationalPresence.length > 0;
    const hasStrategy = strategicInsights.length > 0;
    
    const completenessFactors = [hasRevenue, hasEmployees, hasFacilities, hasOperations, hasStrategy];
    const completenessScore = (completenessFactors.filter(Boolean).length / completenessFactors.length) * 100;
    
    return {
      totalDataPoints,
      averageConfidence,
      sourceCount,
      crossValidatedPoints,
      conflictCount,
      freshnessScore,
      completenessScore
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(qualityMetrics: QualityMetrics): number {
    const weights = {
      averageConfidence: 0.4,
      crossValidation: 0.2,
      sourceCount: 0.2,
      freshness: 0.1,
      completeness: 0.1
    };
    
    const crossValidationScore = qualityMetrics.totalDataPoints > 0 
      ? (qualityMetrics.crossValidatedPoints / qualityMetrics.totalDataPoints) 
      : 0;
    
    const sourceCountScore = Math.min(1, qualityMetrics.sourceCount / 5); // Normalize to 5 sources
    
    const overallConfidence = 
      qualityMetrics.averageConfidence * weights.averageConfidence +
      crossValidationScore * weights.crossValidation +
      sourceCountScore * weights.sourceCount +
      (qualityMetrics.freshnessScore / 100) * weights.freshness +
      (qualityMetrics.completenessScore / 100) * weights.completeness;
    
    return Math.min(0.95, Math.max(0.1, overallConfidence));
  }

  /**
   * Determine evidence level
   */
  private determineEvidenceLevel(qualityMetrics: QualityMetrics, overallConfidence: number): 'high' | 'medium' | 'low' {
    if (overallConfidence >= 0.8 && qualityMetrics.sourceCount >= 3 && qualityMetrics.crossValidatedPoints >= 2) {
      return 'high';
    } else if (overallConfidence >= 0.6 && qualityMetrics.sourceCount >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate data freshness in days
   */
  private calculateDataFreshness(sources: DataSource[]): number {
    if (sources.length === 0) return 365; // Default to 1 year if no sources
    
    const mostRecentDate = Math.max(...sources.map(s => s.metadata.lastUpdated.getTime()));
    return Math.round((Date.now() - mostRecentDate) / (1000 * 60 * 60 * 24));
  }
}