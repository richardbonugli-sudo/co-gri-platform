/**
 * Investor Relations Parser
 * 
 * Enhanced parser for investor presentations, earnings calls,
 * annual reports, and strategic planning documents.
 */

export interface InvestorRelationsData {
  revenueSegments: RevenueSegment[];
  operationalMetrics: OperationalMetric[];
  strategicInitiatives: StrategicInitiative[];
  marketExpansion: MarketExpansion[];
  geographicGuidance: GeographicGuidance[];
  competitivePositioning: CompetitivePositioning[];
}

export interface RevenueSegment {
  geography: string;
  revenueAmount?: number;
  revenuePercentage?: number;
  growthRate?: number;
  currency: string;
  period: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface OperationalMetric {
  geography: string;
  metric: string;
  value: number | string;
  unit: string;
  period: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface StrategicInitiative {
  geography: string;
  initiative: string;
  timeline: string;
  investment?: number;
  expectedOutcome: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface MarketExpansion {
  targetGeography: string;
  expansionType: 'organic' | 'acquisition' | 'partnership' | 'joint_venture';
  timeline: string;
  investment?: number;
  expectedRevenue?: number;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface GeographicGuidance {
  geography: string;
  guidanceType: 'revenue' | 'growth' | 'margin' | 'investment';
  guidanceValue: string;
  period: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface CompetitivePositioning {
  geography: string;
  marketPosition: string;
  marketShare?: number;
  competitors: string[];
  competitiveAdvantage: string;
  confidence: number;
  source: string;
  extractedText: string;
}

export interface InvestorRelationsSource {
  ticker: string;
  companyName: string;
  documentType: 'annual_report' | 'investor_presentation' | 'earnings_call' | 'investor_day' | 'strategic_plan';
  period: string;
  documentUrl: string;
  documentTitle: string;
  lastUpdated: Date;
  priority: 1 | 2 | 3;
}

export class InvestorRelationsParser {
  private readonly REVENUE_PATTERNS = {
    // Revenue by geography patterns
    revenueByGeography: /([A-Za-z\s,]+?)(?:\s+revenue|revenues?):\s*(?:\$|USD|EUR|GBP|JPY|CNY)?\s*(\d+(?:\.\d+)?)\s*(billion|million|thousand|B|M|K)?/gi,
    
    // Percentage revenue patterns
    revenuePercentage: /([A-Za-z\s,]+?)(?:\s+represented|accounted for|contributed)\s+(\d+(?:\.\d+)?)\s*%\s+of\s+(?:total\s+)?(?:revenue|sales)/gi,
    
    // Growth patterns
    growthRate: /([A-Za-z\s,]+?)(?:\s+revenue|sales)\s+(?:grew|increased|decreased)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%/gi,
    
    // Geographic revenue breakdown
    geographicBreakdown: /(?:revenue|sales)\s+by\s+(?:geography|region|country):\s*([^.]+)/gi
  };

  private readonly OPERATIONAL_PATTERNS = {
    // Employee metrics
    employees: /([A-Za-z\s,]+?):\s*(\d{1,3}(?:,\d{3})*)\s+(?:employee|employees|people|staff|workforce)/gi,
    
    // Facility metrics
    facilities: /([A-Za-z\s,]+?):\s*(\d+)\s+(?:office|offices|facility|facilities|location|locations)/gi,
    
    // Customer metrics
    customers: /([A-Za-z\s,]+?):\s*(\d+(?:\.\d+)?)\s*(?:million|thousand|M|K)?\s+(?:customer|customers|user|users)/gi,
    
    // Market share
    marketShare: /(?:market share|share)\s+in\s+([A-Za-z\s,]+?):\s*(\d+(?:\.\d+)?)\s*%/gi
  };

  private readonly STRATEGIC_PATTERNS = {
    // Expansion plans
    expansion: /(?:expand|expanding|expansion)\s+(?:into|in)\s+([A-Za-z\s,]+?)(?:\s+by\s+(\d{4})|over\s+the\s+next\s+(\d+)\s+years?)/gi,
    
    // Investment plans
    investment: /(?:invest|investing|investment)\s+(?:\$|USD|EUR)?\s*(\d+(?:\.\d+)?)\s*(billion|million|B|M)?\s+in\s+([A-Za-z\s,]+?)/gi,
    
    // Strategic initiatives
    initiatives: /(?:launch|launching|introduce|introducing)\s+([^.]+?)\s+in\s+([A-Za-z\s,]+?)/gi
  };

  private readonly GUIDANCE_PATTERNS = {
    // Revenue guidance
    revenueGuidance: /(?:expect|expecting|guidance|forecast)\s+([A-Za-z\s,]+?)\s+revenue\s+(?:of\s+)?(?:\$|USD)?\s*(\d+(?:\.\d+)?)\s*(billion|million|B|M)?/gi,
    
    // Growth guidance
    growthGuidance: /(?:expect|expecting|guidance|forecast)\s+([A-Za-z\s,]+?)\s+(?:to\s+)?grow\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%/gi,
    
    // Margin guidance
    marginGuidance: /(?:expect|expecting|guidance|forecast)\s+([A-Za-z\s,]+?)\s+margin\s+of\s+(\d+(?:\.\d+)?)\s*%/gi
  };

  /**
   * Parse investor relations document for geographic data
   */
  async parseInvestorRelationsDocument(content: string, source: InvestorRelationsSource): Promise<InvestorRelationsData> {
    console.log(`💼 Parsing investor relations document for ${source.ticker} (${source.documentType} ${source.period})`);
    
    const data: InvestorRelationsData = {
      revenueSegments: [],
      operationalMetrics: [],
      strategicInitiatives: [],
      marketExpansion: [],
      geographicGuidance: [],
      competitivePositioning: []
    };

    // Extract different types of data
    data.revenueSegments = this.extractRevenueSegments(content, source);
    data.operationalMetrics = this.extractOperationalMetrics(content, source);
    data.strategicInitiatives = this.extractStrategicInitiatives(content, source);
    data.marketExpansion = this.extractMarketExpansion(content, source);
    data.geographicGuidance = this.extractGeographicGuidance(content, source);
    data.competitivePositioning = this.extractCompetitivePositioning(content, source);

    console.log(`✅ Extracted ${data.revenueSegments.length} revenue segments, ${data.operationalMetrics.length} operational metrics, ${data.strategicInitiatives.length} strategic initiatives`);
    
    return data;
  }

  /**
   * Extract revenue segments from text
   */
  private extractRevenueSegments(content: string, source: InvestorRelationsSource): RevenueSegment[] {
    const segments: RevenueSegment[] = [];

    // Extract revenue by geography
    let match;
    while ((match = this.REVENUE_PATTERNS.revenueByGeography.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const amount = parseFloat(match[2]);
      const unit = match[3]?.toLowerCase();
      
      let revenueAmount = amount;
      if (unit === 'billion' || unit === 'b') revenueAmount *= 1000000000;
      else if (unit === 'million' || unit === 'm') revenueAmount *= 1000000;
      else if (unit === 'thousand' || unit === 'k') revenueAmount *= 1000;

      segments.push({
        geography,
        revenueAmount,
        currency: this.extractCurrency(match[0]),
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['revenue', 'sales']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract revenue percentages
    this.REVENUE_PATTERNS.revenuePercentage.lastIndex = 0;
    while ((match = this.REVENUE_PATTERNS.revenuePercentage.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const percentage = parseFloat(match[2]);

      segments.push({
        geography,
        revenuePercentage: percentage,
        currency: 'USD',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['revenue', 'sales', 'percentage']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract growth rates
    this.REVENUE_PATTERNS.growthRate.lastIndex = 0;
    while ((match = this.REVENUE_PATTERNS.growthRate.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const growthRate = parseFloat(match[2]);

      segments.push({
        geography,
        growthRate,
        currency: 'USD',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['growth', 'increased', 'grew']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    return this.deduplicateRevenueSegments(segments);
  }

  /**
   * Extract operational metrics from text
   */
  private extractOperationalMetrics(content: string, source: InvestorRelationsSource): OperationalMetric[] {
    const metrics: OperationalMetric[] = [];

    // Extract employee metrics
    let match;
    while ((match = this.OPERATIONAL_PATTERNS.employees.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const value = parseInt(match[2].replace(/,/g, ''));

      metrics.push({
        geography,
        metric: 'employees',
        value,
        unit: 'count',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['employee', 'workforce', 'staff']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract facility metrics
    this.OPERATIONAL_PATTERNS.facilities.lastIndex = 0;
    while ((match = this.OPERATIONAL_PATTERNS.facilities.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const value = parseInt(match[2]);

      metrics.push({
        geography,
        metric: 'facilities',
        value,
        unit: 'count',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['facility', 'office', 'location']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract customer metrics
    this.OPERATIONAL_PATTERNS.customers.lastIndex = 0;
    while ((match = this.OPERATIONAL_PATTERNS.customers.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      let value = parseFloat(match[2]);
      const unit = match[3]?.toLowerCase();
      
      if (unit === 'million' || unit === 'm') value *= 1000000;
      else if (unit === 'thousand' || unit === 'k') value *= 1000;

      metrics.push({
        geography,
        metric: 'customers',
        value,
        unit: 'count',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['customer', 'user', 'client']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract market share
    this.OPERATIONAL_PATTERNS.marketShare.lastIndex = 0;
    while ((match = this.OPERATIONAL_PATTERNS.marketShare.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const value = parseFloat(match[2]);

      metrics.push({
        geography,
        metric: 'market_share',
        value,
        unit: 'percentage',
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['market share', 'share']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    return this.deduplicateOperationalMetrics(metrics);
  }

  /**
   * Extract strategic initiatives from text
   */
  private extractStrategicInitiatives(content: string, source: InvestorRelationsSource): StrategicInitiative[] {
    const initiatives: StrategicInitiative[] = [];

    // Extract expansion plans
    let match;
    while ((match = this.STRATEGIC_PATTERNS.expansion.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const timeline = match[2] || (match[3] ? `next ${match[3]} years` : 'unspecified');

      initiatives.push({
        geography,
        initiative: 'market_expansion',
        timeline,
        expectedOutcome: 'increased market presence',
        confidence: this.calculateConfidence(match[0], ['expand', 'expansion', 'expanding']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract investment plans
    this.STRATEGIC_PATTERNS.investment.lastIndex = 0;
    while ((match = this.STRATEGIC_PATTERNS.investment.exec(content)) !== null) {
      const amount = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase();
      const geography = this.normalizeGeography(match[3]);
      
      let investment = amount;
      if (unit === 'billion' || unit === 'b') investment *= 1000000000;
      else if (unit === 'million' || unit === 'm') investment *= 1000000;

      initiatives.push({
        geography,
        initiative: 'investment',
        timeline: 'unspecified',
        investment,
        expectedOutcome: 'business growth',
        confidence: this.calculateConfidence(match[0], ['invest', 'investment', 'investing']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    return this.deduplicateStrategicInitiatives(initiatives);
  }

  /**
   * Extract market expansion plans from text
   */
  private extractMarketExpansion(content: string, source: InvestorRelationsSource): MarketExpansion[] {
    const expansions: MarketExpansion[] = [];

    const expansionPatterns = [
      /(?:enter|entering|launch|launching)\s+(?:in|into)\s+([A-Za-z\s,]+?)(?:\s+market)?(?:\s+by\s+(\d{4})|over\s+the\s+next\s+(\d+)\s+years?)?/gi,
      /(?:acquire|acquisition|partner|partnership)\s+in\s+([A-Za-z\s,]+?)/gi
    ];

    for (const pattern of expansionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const geography = this.normalizeGeography(match[1]);
        const timeline = match[2] || (match[3] ? `next ${match[3]} years` : 'unspecified');
        
        let expansionType: MarketExpansion['expansionType'] = 'organic';
        if (match[0].toLowerCase().includes('acquire') || match[0].toLowerCase().includes('acquisition')) {
          expansionType = 'acquisition';
        } else if (match[0].toLowerCase().includes('partner') || match[0].toLowerCase().includes('partnership')) {
          expansionType = 'partnership';
        }

        expansions.push({
          targetGeography: geography,
          expansionType,
          timeline,
          confidence: this.calculateConfidence(match[0], ['enter', 'launch', 'acquire', 'partner']),
          source: `${source.documentType} ${source.period}`,
          extractedText: match[0]
        });
      }
    }

    return this.deduplicateMarketExpansion(expansions);
  }

  /**
   * Extract geographic guidance from text
   */
  private extractGeographicGuidance(content: string, source: InvestorRelationsSource): GeographicGuidance[] {
    const guidance: GeographicGuidance[] = [];

    // Extract revenue guidance
    let match;
    while ((match = this.GUIDANCE_PATTERNS.revenueGuidance.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const amount = match[2];
      const unit = match[3];

      guidance.push({
        geography,
        guidanceType: 'revenue',
        guidanceValue: `${amount} ${unit || ''}`.trim(),
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['guidance', 'expect', 'forecast']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    // Extract growth guidance
    this.GUIDANCE_PATTERNS.growthGuidance.lastIndex = 0;
    while ((match = this.GUIDANCE_PATTERNS.growthGuidance.exec(content)) !== null) {
      const geography = this.normalizeGeography(match[1]);
      const growthRate = match[2];

      guidance.push({
        geography,
        guidanceType: 'growth',
        guidanceValue: `${growthRate}%`,
        period: source.period,
        confidence: this.calculateConfidence(match[0], ['guidance', 'expect', 'grow']),
        source: `${source.documentType} ${source.period}`,
        extractedText: match[0]
      });
    }

    return this.deduplicateGeographicGuidance(guidance);
  }

  /**
   * Extract competitive positioning from text
   */
  private extractCompetitivePositioning(content: string, source: InvestorRelationsSource): CompetitivePositioning[] {
    const positioning: CompetitivePositioning[] = [];

    const competitivePatterns = [
      /(?:leading|leader|#1|number one|market leader)\s+in\s+([A-Za-z\s,]+?)/gi,
      /(?:compete|competing|competition)\s+(?:with|against)\s+([^.]+?)\s+in\s+([A-Za-z\s,]+?)/gi
    ];

    for (const pattern of competitivePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (pattern === competitivePatterns[0]) {
          // Market leader pattern
          const geography = this.normalizeGeography(match[1]);
          
          positioning.push({
            geography,
            marketPosition: 'leader',
            competitors: [],
            competitiveAdvantage: 'market leadership',
            confidence: this.calculateConfidence(match[0], ['leading', 'leader', '#1']),
            source: `${source.documentType} ${source.period}`,
            extractedText: match[0]
          });
        } else {
          // Competition pattern
          const competitors = match[1].split(/,|\sand\s/).map(c => c.trim());
          const geography = this.normalizeGeography(match[2]);
          
          positioning.push({
            geography,
            marketPosition: 'competitor',
            competitors,
            competitiveAdvantage: 'competitive presence',
            confidence: this.calculateConfidence(match[0], ['compete', 'competition']),
            source: `${source.documentType} ${source.period}`,
            extractedText: match[0]
          });
        }
      }
    }

    return this.deduplicateCompetitivePositioning(positioning);
  }

  /**
   * Helper methods
   */
  private normalizeGeography(geography: string): string {
    const normalized = geography.trim()
      .replace(/\s+/g, ' ')
      .replace(/[,;]$/, '');
    
    // Common normalizations
    const normalizations: Record<string, string> = {
      'US': 'United States',
      'USA': 'United States',
      'UK': 'United Kingdom',
      'EU': 'Europe',
      'APAC': 'Asia Pacific',
      'EMEA': 'Europe, Middle East and Africa',
      'LATAM': 'Latin America'
    };
    
    return normalizations[normalized] || normalized;
  }

  private extractCurrency(text: string): string {
    if (text.includes('€') || text.includes('EUR')) return 'EUR';
    if (text.includes('£') || text.includes('GBP')) return 'GBP';
    if (text.includes('¥') || text.includes('JPY')) return 'JPY';
    if (text.includes('¥') || text.includes('CNY')) return 'CNY';
    return 'USD'; // Default
  }

  private calculateConfidence(text: string, keywords: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for specific keywords
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        confidence += 0.1;
      }
    }
    
    // Increase confidence for numbers
    if (/\d+/.test(text)) {
      confidence += 0.1;
    }
    
    // Increase confidence for percentages
    if (/%/.test(text)) {
      confidence += 0.1;
    }
    
    // Increase confidence for currency symbols
    if (/[\$€£¥]/.test(text)) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Deduplication methods
   */
  private deduplicateRevenueSegments(segments: RevenueSegment[]): RevenueSegment[] {
    const seen = new Set<string>();
    return segments.filter(segment => {
      const key = `${segment.geography}-${segment.period}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateOperationalMetrics(metrics: OperationalMetric[]): OperationalMetric[] {
    const seen = new Set<string>();
    return metrics.filter(metric => {
      const key = `${metric.geography}-${metric.metric}-${metric.period}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateStrategicInitiatives(initiatives: StrategicInitiative[]): StrategicInitiative[] {
    const seen = new Set<string>();
    return initiatives.filter(initiative => {
      const key = `${initiative.geography}-${initiative.initiative}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateMarketExpansion(expansions: MarketExpansion[]): MarketExpansion[] {
    const seen = new Set<string>();
    return expansions.filter(expansion => {
      const key = `${expansion.targetGeography}-${expansion.expansionType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateGeographicGuidance(guidance: GeographicGuidance[]): GeographicGuidance[] {
    const seen = new Set<string>();
    return guidance.filter(guide => {
      const key = `${guide.geography}-${guide.guidanceType}-${guide.period}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateCompetitivePositioning(positioning: CompetitivePositioning[]): CompetitivePositioning[] {
    const seen = new Set<string>();
    return positioning.filter(pos => {
      const key = `${pos.geography}-${pos.marketPosition}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}