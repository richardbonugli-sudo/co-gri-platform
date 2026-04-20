/**
 * CO-GRI v3.4 EVIDENCE HIERARCHY IMPLEMENTATION
 * 
 * PHASE 3: EVIDENCE HIERARCHY ENHANCEMENT
 * 
 * Implements the 4-tier evidence system:
 * 1. Structured Evidence (SEC tables, regulatory filings)
 * 2. Narrative Evidence (text mentions, management discussions)
 * 3. Supplementary Evidence (industry reports, third-party data)
 * 4. Fallback Evidence (mathematical models SSF/RF/GF)
 * 
 * BACKWARD COMPATIBILITY: Extends existing functionality without modification
 */

import { 
  EvidenceLevel, 
  EvidenceSufficiency, 
  EvidenceMetadata, 
  CachedEvidence, 
  V34ChannelData,
  EvidenceSufficiencyEvaluator
} from './v34FallbackCore';

import { IntegratedChannelData, IntegratedExposureData } from './structuredDataIntegrator';

// ===== EVIDENCE HIERARCHY PROCESSOR =====

export interface EvidenceSource {
  id: string;
  type: EvidenceLevel;
  source: string;
  confidence: number;
  coverage: number;
  timestamp: string;
  data: Record<string, number>;
  metadata: EvidenceMetadata;
}

export interface ProcessedEvidence {
  ticker: string;
  channels: {
    revenue: EvidenceSource[];
    supply: EvidenceSource[];
    assets: EvidenceSource[];
    financial: EvidenceSource[];
  };
  overallSufficiency: EvidenceSufficiency;
  evidenceGaps: string[];
  recommendations: string[];
  processingTimestamp: string;
}

export class V34EvidenceHierarchy {
  
  /**
   * Process integrated exposure data through v3.4 evidence hierarchy
   */
  static processIntegratedData(
    integratedData: IntegratedExposureData,
    ticker: string,
    sector: string,
    homeCountry: string
  ): ProcessedEvidence {
    
    console.log(`\n[v3.4 Evidence Hierarchy] ========================================`);
    console.log(`[v3.4 Evidence Hierarchy] Processing ${ticker} through 4-tier evidence system`);
    console.log(`[v3.4 Evidence Hierarchy] ========================================`);
    
    const processedChannels = {
      revenue: this.processChannelEvidence(integratedData.revenueChannel, 'revenue', ticker, sector),
      supply: this.processChannelEvidence(integratedData.supplyChannel, 'supply', ticker, sector),
      assets: this.processChannelEvidence(integratedData.assetsChannel, 'assets', ticker, sector),
      financial: this.processChannelEvidence(integratedData.financialChannel, 'financial', ticker, sector)
    };
    
    // Evaluate overall sufficiency
    const allEvidenceSources = [
      ...processedChannels.revenue,
      ...processedChannels.supply,
      ...processedChannels.assets,
      ...processedChannels.financial
    ];
    
    const overallSufficiency = this.evaluateOverallSufficiency(allEvidenceSources);
    const evidenceGaps = this.identifyEvidenceGaps(processedChannels, ticker, sector);
    const recommendations = this.generateRecommendations(processedChannels, overallSufficiency, ticker);
    
    console.log(`[v3.4 Evidence Hierarchy] Overall Sufficiency: ${overallSufficiency}`);
    console.log(`[v3.4 Evidence Hierarchy] Evidence Gaps: ${evidenceGaps.length}`);
    console.log(`[v3.4 Evidence Hierarchy] Recommendations: ${recommendations.length}`);
    
    return {
      ticker,
      channels: processedChannels,
      overallSufficiency,
      evidenceGaps,
      recommendations,
      processingTimestamp: new Date().toISOString()
    };
  }
  
  /**
   * Process individual channel evidence through hierarchy
   */
  private static processChannelEvidence(
    channelData: Record<string, IntegratedChannelData>,
    channelName: string,
    ticker: string,
    sector: string
  ): EvidenceSource[] {
    
    const evidenceSources: EvidenceSource[] = [];
    
    // Group by evidence type and source
    const evidenceGroups = new Map<string, IntegratedChannelData[]>();
    
    for (const [country, data] of Object.entries(channelData)) {
      const groupKey = `${data.evidenceType}_${data.source}`;
      if (!evidenceGroups.has(groupKey)) {
        evidenceGroups.set(groupKey, []);
      }
      evidenceGroups.get(groupKey)!.push(data);
    }
    
    // Convert each group to evidence source
    let sourceIndex = 0;
    for (const [groupKey, dataList] of evidenceGroups) {
      const firstData = dataList[0];
      const evidenceLevel = this.mapEvidenceTypeToLevel(firstData.evidenceType);
      
      // Aggregate data from all countries in this source
      const aggregatedData: Record<string, number> = {};
      let totalWeight = 0;
      
      for (const data of dataList) {
        aggregatedData[data.country] = data.weight;
        totalWeight += data.weight;
      }
      
      const confidence = this.calculateSourceConfidence(firstData, dataList.length, totalWeight);
      const coverage = totalWeight;
      
      const evidenceSource: EvidenceSource = {
        id: `${ticker}_${channelName}_${sourceIndex++}`,
        type: evidenceLevel,
        source: firstData.source,
        confidence,
        coverage,
        timestamp: new Date().toISOString(),
        data: aggregatedData,
        metadata: {
          level: evidenceLevel,
          sufficiency: this.evaluateSourceSufficiency(coverage, confidence),
          confidence,
          coverage,
          source: firstData.source,
          timestamp: new Date().toISOString(),
          jurisdiction: 'US', // TODO: Extract from data
          validationScore: this.calculateValidationScore(firstData, dataList)
        }
      };
      
      evidenceSources.push(evidenceSource);
      
      console.log(`[v3.4 Evidence Hierarchy] ${channelName.toUpperCase()}: ${evidenceLevel} evidence from "${firstData.source}" (${dataList.length} countries, ${(coverage * 100).toFixed(2)}% coverage, ${(confidence * 100).toFixed(1)}% confidence)`);
    }
    
    // Sort by evidence hierarchy priority
    evidenceSources.sort((a, b) => {
      const priorityOrder = { 'structured': 4, 'narrative': 3, 'supplementary': 2, 'fallback': 1 };
      const aPriority = priorityOrder[a.type] || 0;
      const bPriority = priorityOrder[b.type] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, sort by confidence
      return b.confidence - a.confidence;
    });
    
    return evidenceSources;
  }
  
  /**
   * Map existing evidence types to v3.4 hierarchy levels
   */
  private static mapEvidenceTypeToLevel(evidenceType: string): EvidenceLevel {
    switch (evidenceType) {
      case 'structured_table':
      case 'exhibit_21':
        return 'structured';
      
      case 'narrative':
        return 'narrative';
      
      case 'sustainability_report':
        return 'supplementary';
      
      case 'fallback':
      default:
        return 'fallback';
    }
  }
  
  /**
   * Calculate confidence score for evidence source
   */
  private static calculateSourceConfidence(
    firstData: IntegratedChannelData,
    countryCount: number,
    totalWeight: number
  ): number {
    let baseConfidence: number;
    
    // Base confidence by data quality
    switch (firstData.dataQuality) {
      case 'high': baseConfidence = 0.9; break;
      case 'medium': baseConfidence = 0.7; break;
      case 'low': baseConfidence = 0.4; break;
      default: baseConfidence = 0.5;
    }
    
    // Adjust for coverage completeness
    const coverageBonus = Math.min(totalWeight, 1.0) * 0.1;
    
    // Adjust for geographic diversity (more countries = higher confidence in global exposure)
    const diversityBonus = Math.min(countryCount / 10, 0.1);
    
    // Penalty for fallback evidence
    const fallbackPenalty = firstData.evidenceType === 'fallback' ? 0.2 : 0;
    
    return Math.max(0.1, Math.min(1.0, baseConfidence + coverageBonus + diversityBonus - fallbackPenalty));
  }
  
  /**
   * Evaluate sufficiency for individual evidence source
   */
  private static evaluateSourceSufficiency(coverage: number, confidence: number): EvidenceSufficiency {
    const compositeScore = coverage * confidence;
    
    if (compositeScore >= 0.8 && confidence >= 0.7) {
      return 'sufficient';
    } else if (compositeScore >= 0.4 && confidence >= 0.5) {
      return 'partial';
    } else {
      return 'insufficient';
    }
  }
  
  /**
   * Calculate validation score for evidence source
   */
  private static calculateValidationScore(
    firstData: IntegratedChannelData,
    dataList: IntegratedChannelData[]
  ): number {
    let score = 0.5; // Base score
    
    // Structured evidence gets higher validation score
    if (firstData.evidenceType === 'structured_table') {
      score += 0.3;
    } else if (firstData.evidenceType === 'exhibit_21') {
      score += 0.25;
    } else if (firstData.evidenceType === 'sustainability_report') {
      score += 0.2;
    }
    
    // Consistency across countries
    const avgWeight = dataList.reduce((sum, d) => sum + d.weight, 0) / dataList.length;
    const variance = dataList.reduce((sum, d) => sum + Math.pow(d.weight - avgWeight, 2), 0) / dataList.length;
    const consistencyBonus = Math.max(0, 0.2 - variance);
    
    return Math.min(1.0, score + consistencyBonus);
  }
  
  /**
   * Evaluate overall evidence sufficiency across all channels
   */
  private static evaluateOverallSufficiency(evidenceSources: EvidenceSource[]): EvidenceSufficiency {
    if (evidenceSources.length === 0) {
      return 'insufficient';
    }
    
    const structuredSources = evidenceSources.filter(s => s.type === 'structured');
    const narrativeSources = evidenceSources.filter(s => s.type === 'narrative');
    const supplementarySources = evidenceSources.filter(s => s.type === 'supplementary');
    
    const totalStructuredCoverage = structuredSources.reduce((sum, s) => sum + s.coverage, 0);
    const totalNarrativeCoverage = narrativeSources.reduce((sum, s) => sum + s.coverage, 0);
    const avgConfidence = evidenceSources.reduce((sum, s) => sum + s.confidence, 0) / evidenceSources.length;
    
    // v3.4 Sufficiency Rules
    if (totalStructuredCoverage >= 0.8 && avgConfidence >= 0.8) {
      return 'sufficient';
    } else if ((totalStructuredCoverage + totalNarrativeCoverage) >= 0.6 && avgConfidence >= 0.6) {
      return 'partial';
    } else {
      return 'insufficient';
    }
  }
  
  /**
   * Identify evidence gaps for improvement recommendations
   */
  private static identifyEvidenceGaps(
    processedChannels: { [key: string]: EvidenceSource[] },
    ticker: string,
    sector: string
  ): string[] {
    
    const gaps: string[] = [];
    
    for (const [channelName, sources] of Object.entries(processedChannels)) {
      const structuredSources = sources.filter(s => s.type === 'structured');
      const totalCoverage = sources.reduce((sum, s) => sum + s.coverage, 0);
      const avgConfidence = sources.length > 0 ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length : 0;
      
      if (structuredSources.length === 0) {
        gaps.push(`${channelName}: No structured evidence found - recommend SEC filing analysis`);
      }
      
      if (totalCoverage < 0.7) {
        gaps.push(`${channelName}: Low coverage (${(totalCoverage * 100).toFixed(1)}%) - recommend additional data sources`);
      }
      
      if (avgConfidence < 0.6) {
        gaps.push(`${channelName}: Low confidence (${(avgConfidence * 100).toFixed(1)}%) - recommend data quality improvement`);
      }
      
      // Sector-specific gap analysis
      if (sector === 'Technology' && channelName === 'supply' && structuredSources.length === 0) {
        gaps.push(`${channelName}: Technology sector requires supply chain transparency - recommend sustainability report analysis`);
      }
      
      if (sector === 'Financial Services' && channelName === 'financial' && structuredSources.length === 0) {
        gaps.push(`${channelName}: Financial sector requires regulatory filing analysis - recommend debt securities review`);
      }
    }
    
    return gaps;
  }
  
  /**
   * Generate improvement recommendations based on evidence analysis
   */
  private static generateRecommendations(
    processedChannels: { [key: string]: EvidenceSource[] },
    overallSufficiency: EvidenceSufficiency,
    ticker: string
  ): string[] {
    
    const recommendations: string[] = [];
    
    if (overallSufficiency === 'insufficient') {
      recommendations.push('PRIORITY: Enhance structured evidence collection through comprehensive SEC filing analysis');
      recommendations.push('Consider sustainability report integration for supply chain and operations channels');
      recommendations.push('Implement third-party data validation for fallback estimates');
    } else if (overallSufficiency === 'partial') {
      recommendations.push('Supplement existing evidence with narrative analysis from management discussions');
      recommendations.push('Cross-validate structured evidence with industry reports and third-party sources');
      recommendations.push('Consider international regulatory filing analysis for non-US operations');
    } else {
      recommendations.push('Maintain current evidence quality through regular updates and validation');
      recommendations.push('Consider advanced analytics for predictive exposure modeling');
    }
    
    // Channel-specific recommendations
    for (const [channelName, sources] of Object.entries(processedChannels)) {
      const hasStructured = sources.some(s => s.type === 'structured');
      const hasNarrative = sources.some(s => s.type === 'narrative');
      
      if (!hasStructured && !hasNarrative) {
        recommendations.push(`${channelName}: Implement evidence discovery automation for improved data collection`);
      }
      
      if (channelName === 'supply' && !sources.some(s => s.source.includes('Sustainability'))) {
        recommendations.push(`${channelName}: Integrate ESG reporting for enhanced supply chain transparency`);
      }
      
      if (channelName === 'assets' && !sources.some(s => s.source.includes('Exhibit 21'))) {
        recommendations.push(`${channelName}: Analyze subsidiary structure through Exhibit 21 for asset allocation insights`);
      }
    }
    
    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }
}

// ===== DOCUMENT CACHE IMPLEMENTATION =====

export interface DocumentCacheEntry {
  documentId: string;
  ticker: string;
  documentType: 'sec_filing' | 'sustainability_report' | 'regulatory_filing' | 'third_party';
  content: string;
  metadata: {
    filingDate: string;
    fiscalYear: number;
    documentUrl?: string;
    fileSize: number;
    processingStatus: 'pending' | 'processed' | 'error';
    lastProcessed?: string;
    version: string;
  };
  extractedEvidence: EvidenceSource[];
  cacheTimestamp: string;
  expiresAt: string;
}

export class V34DocumentCache {
  private static cache = new Map<string, DocumentCacheEntry>();
  
  /**
   * Store document in cache with evidence extraction
   */
  static async storeDocument(
    ticker: string,
    documentType: DocumentCacheEntry['documentType'],
    content: string,
    metadata: Partial<DocumentCacheEntry['metadata']>
  ): Promise<string> {
    
    const documentId = `${ticker}_${documentType}_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const entry: DocumentCacheEntry = {
      documentId,
      ticker,
      documentType,
      content,
      metadata: {
        filingDate: metadata.filingDate || now.toISOString(),
        fiscalYear: metadata.fiscalYear || now.getFullYear(),
        documentUrl: metadata.documentUrl,
        fileSize: content.length,
        processingStatus: 'pending',
        version: '3.4.0'
      },
      extractedEvidence: [], // Will be populated by evidence extraction
      cacheTimestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    this.cache.set(documentId, entry);
    
    console.log(`[v3.4 Document Cache] Stored ${documentType} for ${ticker} (ID: ${documentId})`);
    
    return documentId;
  }
  
  /**
   * Retrieve document from cache
   */
  static getDocument(documentId: string): DocumentCacheEntry | null {
    const entry = this.cache.get(documentId);
    
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (new Date() > new Date(entry.expiresAt)) {
      this.cache.delete(documentId);
      console.log(`[v3.4 Document Cache] Expired document removed: ${documentId}`);
      return null;
    }
    
    return entry;
  }
  
  /**
   * Get all documents for a ticker
   */
  static getTickerDocuments(ticker: string): DocumentCacheEntry[] {
    const documents: DocumentCacheEntry[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.ticker === ticker && new Date() <= new Date(entry.expiresAt)) {
        documents.push(entry);
      }
    }
    
    return documents.sort((a, b) => 
      new Date(b.cacheTimestamp).getTime() - new Date(a.cacheTimestamp).getTime()
    );
  }
  
  /**
   * Update evidence extraction results
   */
  static updateExtractedEvidence(documentId: string, evidence: EvidenceSource[]): boolean {
    const entry = this.cache.get(documentId);
    
    if (!entry) {
      return false;
    }
    
    entry.extractedEvidence = evidence;
    entry.metadata.processingStatus = 'processed';
    entry.metadata.lastProcessed = new Date().toISOString();
    
    console.log(`[v3.4 Document Cache] Updated evidence for ${documentId}: ${evidence.length} sources`);
    
    return true;
  }
  
  /**
   * Clean expired entries
   */
  static cleanExpired(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [id, entry] of this.cache.entries()) {
      if (now > new Date(entry.expiresAt)) {
        this.cache.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[v3.4 Document Cache] Cleaned ${cleaned} expired entries`);
    }
    
    return cleaned;
  }
}

// ===== EVIDENCE-CONFIRMED CACHE =====

export interface ConfirmedEvidenceEntry {
  cacheId: string;
  ticker: string;
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  evidenceData: V34ChannelData[];
  sufficiencyLevel: EvidenceSufficiency;
  validationScore: number;
  sourceDocuments: string[]; // Document IDs
  supersededBy?: string;
  confirmationTimestamp: string;
  expiresAt: string;
  metadata: {
    sector: string;
    homeCountry: string;
    processingVersion: string;
    qualityMetrics: {
      structuredCoverage: number;
      narrativeCoverage: number;
      supplementaryCoverage: number;
      fallbackCoverage: number;
      averageConfidence: number;
    };
  };
}

export class V34EvidenceConfirmedCache {
  private static cache = new Map<string, ConfirmedEvidenceEntry>();
  
  /**
   * Store confirmed evidence with validation
   */
  static storeConfirmedEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel'],
    evidenceData: V34ChannelData[],
    sufficiencyLevel: EvidenceSufficiency,
    validationScore: number,
    sourceDocuments: string[],
    metadata: ConfirmedEvidenceEntry['metadata']
  ): string {
    
    const cacheId = `${ticker}_${channel}_confirmed_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Check for existing entries to supersede
    const existingEntries = this.getTickerChannelEvidence(ticker, channel);
    for (const existing of existingEntries) {
      if (!existing.supersededBy) {
        existing.supersededBy = cacheId;
        console.log(`[v3.4 Evidence Cache] Superseded ${existing.cacheId} with ${cacheId}`);
      }
    }
    
    const entry: ConfirmedEvidenceEntry = {
      cacheId,
      ticker,
      channel,
      evidenceData,
      sufficiencyLevel,
      validationScore,
      sourceDocuments,
      confirmationTimestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata
    };
    
    this.cache.set(cacheId, entry);
    
    console.log(`[v3.4 Evidence Cache] Stored confirmed ${channel} evidence for ${ticker} (ID: ${cacheId}, Score: ${(validationScore * 100).toFixed(1)}%)`);
    
    return cacheId;
  }
  
  /**
   * Get latest confirmed evidence for ticker and channel
   */
  static getLatestConfirmedEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel']
  ): ConfirmedEvidenceEntry | null {
    
    const entries = this.getTickerChannelEvidence(ticker, channel);
    const activeEntries = entries.filter(e => !e.supersededBy && new Date() <= new Date(e.expiresAt));
    
    if (activeEntries.length === 0) {
      return null;
    }
    
    // Return most recent
    return activeEntries.sort((a, b) => 
      new Date(b.confirmationTimestamp).getTime() - new Date(a.confirmationTimestamp).getTime()
    )[0];
  }
  
  /**
   * Get all evidence entries for ticker and channel
   */
  private static getTickerChannelEvidence(
    ticker: string,
    channel: ConfirmedEvidenceEntry['channel']
  ): ConfirmedEvidenceEntry[] {
    
    const entries: ConfirmedEvidenceEntry[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.ticker === ticker && entry.channel === channel) {
        entries.push(entry);
      }
    }
    
    return entries;
  }
  
  /**
   * Validate evidence freshness and quality
   */
  static validateEvidenceFreshness(cacheId: string): {
    isValid: boolean;
    isFresh: boolean;
    qualityScore: number;
    recommendations: string[];
  } {
    
    const entry = this.cache.get(cacheId);
    
    if (!entry) {
      return {
        isValid: false,
        isFresh: false,
        qualityScore: 0,
        recommendations: ['Evidence not found in cache']
      };
    }
    
    const now = new Date();
    const isValid = !entry.supersededBy && now <= new Date(entry.expiresAt);
    const ageHours = (now.getTime() - new Date(entry.confirmationTimestamp).getTime()) / (1000 * 60 * 60);
    const isFresh = ageHours <= 24; // Fresh if less than 24 hours old
    
    const qualityScore = entry.validationScore * entry.metadata.qualityMetrics.averageConfidence;
    
    const recommendations: string[] = [];
    
    if (!isFresh) {
      recommendations.push('Consider refreshing evidence with latest filings');
    }
    
    if (qualityScore < 0.7) {
      recommendations.push('Low quality score - recommend additional evidence sources');
    }
    
    if (entry.metadata.qualityMetrics.structuredCoverage < 0.5) {
      recommendations.push('Low structured evidence coverage - recommend SEC filing analysis');
    }
    
    return {
      isValid,
      isFresh,
      qualityScore,
      recommendations
    };
  }
}

export default {
  V34EvidenceHierarchy,
  V34DocumentCache,
  V34EvidenceConfirmedCache
};