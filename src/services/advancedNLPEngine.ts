/**
 * Advanced NLP Engine
 * 
 * Sophisticated natural language processing for geographic context recognition,
 * quantitative extraction, temporal understanding, and negative context detection.
 */

export interface GeographicContext {
  geography: string;
  contextType: 'expansion' | 'strategic' | 'operational' | 'market' | 'divestiture' | 'closure';
  sentiment: 'positive' | 'negative' | 'neutral';
  temporalContext: TemporalContext;
  quantitativeData?: QuantitativeExtraction;
  confidence: number;
  extractedText: string;
  businessContext: string;
}

export interface TemporalContext {
  timeframe: 'historical' | 'current' | 'future' | 'transition';
  specificPeriod?: string;
  startDate?: Date;
  endDate?: Date;
  isProjection: boolean;
  confidence: number;
}

export interface QuantitativeExtraction {
  value: number;
  unit: 'percentage' | 'absolute' | 'ratio';
  metricType: 'revenue' | 'employees' | 'facilities' | 'customers' | 'operations' | 'ebitda';
  geography: string;
  temporalContext: TemporalContext;
  confidence: number;
}

export interface NLPProcessingResult {
  geographicContexts: GeographicContext[];
  quantitativeExtractions: QuantitativeExtraction[];
  temporalTimeline: TemporalEvent[];
  negativeContexts: NegativeContext[];
  businessStrategies: BusinessStrategy[];
  overallConfidence: number;
  processingTime: number;
}

export interface TemporalEvent {
  event: string;
  geography: string;
  date: Date | string;
  eventType: 'entry' | 'expansion' | 'acquisition' | 'divestiture' | 'closure' | 'restructuring';
  confidence: number;
}

export interface NegativeContext {
  geography: string;
  negationType: 'divestiture' | 'closure' | 'reduction' | 'exclusion' | 'exit';
  description: string;
  temporalContext: TemporalContext;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface BusinessStrategy {
  geography: string;
  strategyType: 'growth' | 'consolidation' | 'diversification' | 'focus' | 'transformation';
  description: string;
  timeline: string;
  confidence: number;
}

export class AdvancedNLPEngine {
  private readonly EXPANSION_PATTERNS = [
    // Expansion context patterns
    /(?:expand|expanding|expansion)\s+(?:into|in|across|throughout)\s+([A-Za-z\s,]+?)(?:\s|,|;|\.)/gi,
    /(?:enter|entering|entry)\s+(?:into|in)?\s*([A-Za-z\s,]+?)\s+(?:market|markets|region|regions)/gi,
    /(?:launch|launching|establish|establishing)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /(?:new|additional)\s+(?:operations|presence|facilities)\s+in\s+([A-Za-z\s,]+)/gi,
    /(?:growing|growth)\s+(?:in|across)\s+([A-Za-z\s,]+?)\s+(?:market|markets|region)/gi
  ];

  private readonly STRATEGIC_PATTERNS = [
    // Strategic focus patterns
    /(?:focus|focusing|concentrate|concentrating)\s+on\s+([A-Za-z\s,]+?)\s+(?:market|markets|growth|operations)/gi,
    /(?:prioritize|prioritizing|priority)\s+([A-Za-z\s,]+?)\s+(?:market|markets|region|regions)/gi,
    /(?:key|important|critical|strategic)\s+(?:market|markets|region|regions)?\s*(?:in|include|includes)?\s*([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?)\s+(?:is|are|remains?)\s+(?:a\s+)?(?:key|important|critical|strategic)\s+(?:market|region)/gi
  ];

  private readonly OPERATIONAL_PATTERNS = [
    // Operational context patterns
    /(?:manufacturing|produce|producing|production)\s+(?:primarily|mainly|mostly)?\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /(?:R&D|research|development)\s+(?:primarily|mainly|concentrated|located)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /(?:operations|operating|operate)\s+(?:primarily|mainly|extensively)?\s+(?:in|across|throughout)\s+([A-Za-z\s,]+)/gi,
    /(?:facilities|offices|plants)\s+(?:located|situated|based)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly QUANTITATIVE_PATTERNS = [
    // Revenue attribution patterns
    /(\d+(?:\.\d+)?)\s*%\s+of\s+(?:total\s+)?(?:revenue|sales|income)\s+(?:from|in|generated\s+in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?)\s+(?:represents?|accounts?\s+for|contributes?)\s+(\d+(?:\.\d+)?)\s*%\s+of\s+(?:revenue|sales)/gi,
    /(?:revenue|sales)\s+(?:from|in)\s+([A-Za-z\s,]+?):\s*(\d+(?:\.\d+)?)\s*%/gi,
    
    // Employee distribution patterns
    /(\d+(?:\.\d+)?)\s*%\s+of\s+(?:employees|workforce|staff)\s+(?:in|located\s+in|based\s+in)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?):\s*(\d{1,3}(?:,\d{3})*)\s+(?:employees|people|staff)/gi,
    
    // Facility distribution patterns
    /(\d+)\s+(?:facilities|offices|plants|locations)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /([A-Za-z\s,]+?):\s*(\d+)\s+(?:facilities|offices|locations)/gi
  ];

  private readonly TEMPORAL_PATTERNS = [
    // Historical patterns
    /(?:previously|formerly|historically|in\s+the\s+past)\s+(?:operated|had\s+operations|maintained\s+presence)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    
    // Current patterns
    /(?:currently|presently|now)\s+(?:operating|operate|operates)\s+(?:in|across)\s+([A-Za-z\s,]+)/gi,
    /(?:active|present)\s+(?:in|across)\s+([A-Za-z\s,]+?)\s+(?:market|markets|region|regions)/gi,
    
    // Future patterns
    /(?:plan|planning|expect|expecting|target|targeting|will|intend|intending)\s+(?:to\s+)?(?:enter|expand|launch|establish)\s+(?:in|into|across)\s+([A-Za-z\s,]+?)(?:\s+by\s+(\d{4})|over\s+the\s+next\s+(\d+)\s+years?)?/gi,
    /(?:by\s+(\d{4})|over\s+the\s+next\s+(\d+)\s+years?),?\s*(?:expect|plan|target)\s+(?:to\s+)?(?:have|achieve|reach)\s+([^.]+?)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi
  ];

  private readonly NEGATIVE_PATTERNS = [
    // Divestiture patterns
    /(?:divest|divesting|divestiture|sell|selling|dispose|disposing)\s+(?:of\s+)?(?:operations|assets|business|facilities)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi,
    
    // Closure patterns
    /(?:close|closing|closure|shut\s+down|shutting\s+down)\s+(?:operations|facilities|offices|plants)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi,
    
    // Exit patterns
    /(?:exit|exiting|withdraw|withdrawing|leave|leaving)\s+(?:from\s+)?([A-Za-z\s,]+?)\s+(?:market|markets|operations)/gi,
    
    // Reduction patterns
    /(?:reduce|reducing|reduction|scale\s+down|scaling\s+down|downsize|downsizing)\s+(?:operations|presence|activities)\s+(?:in|from)\s+([A-Za-z\s,]+)/gi,
    
    // Exclusion patterns
    /(?:excluding|not\s+including|except\s+for)\s+([A-Za-z\s,]+?)\s+(?:operations|results|revenue)/gi
  ];

  /**
   * Process text with advanced NLP for geographic intelligence
   */
  async processText(text: string, sourceType: string): Promise<NLPProcessingResult> {
    console.log(`🧠 Processing text with advanced NLP (${text.length} characters)...`);
    
    const startTime = Date.now();
    
    // Extract different types of contexts
    const geographicContexts = this.extractGeographicContexts(text, sourceType);
    const quantitativeExtractions = this.extractQuantitativeData(text);
    const temporalTimeline = this.extractTemporalTimeline(text);
    const negativeContexts = this.extractNegativeContexts(text);
    const businessStrategies = this.extractBusinessStrategies(text);
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence([
      ...geographicContexts,
      ...quantitativeExtractions,
      ...temporalTimeline,
      ...negativeContexts,
      ...businessStrategies
    ]);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ NLP processing completed: ${geographicContexts.length} contexts, ${quantitativeExtractions.length} quantitative, ${negativeContexts.length} negative contexts`);
    
    return {
      geographicContexts,
      quantitativeExtractions,
      temporalTimeline,
      negativeContexts,
      businessStrategies,
      overallConfidence,
      processingTime
    };
  }

  /**
   * Extract geographic contexts with business understanding
   */
  private extractGeographicContexts(text: string, sourceType: string): GeographicContext[] {
    const contexts: GeographicContext[] = [];
    
    // Process expansion contexts
    for (const pattern of this.EXPANSION_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (geography) {
          contexts.push({
            geography,
            contextType: 'expansion',
            sentiment: 'positive',
            temporalContext: this.extractTemporalContextFromText(match[0]),
            quantitativeData: this.extractQuantitativeFromContext(match[0], geography),
            confidence: this.calculateContextConfidence(match[0], sourceType),
            extractedText: match[0],
            businessContext: 'Market expansion and growth initiatives'
          });
        }
      }
    }
    
    // Process strategic contexts
    for (const pattern of this.STRATEGIC_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (geography) {
          contexts.push({
            geography,
            contextType: 'strategic',
            sentiment: 'positive',
            temporalContext: this.extractTemporalContextFromText(match[0]),
            quantitativeData: this.extractQuantitativeFromContext(match[0], geography),
            confidence: this.calculateContextConfidence(match[0], sourceType),
            extractedText: match[0],
            businessContext: 'Strategic market prioritization and focus'
          });
        }
      }
    }
    
    // Process operational contexts
    for (const pattern of this.OPERATIONAL_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (geography) {
          contexts.push({
            geography,
            contextType: 'operational',
            sentiment: 'neutral',
            temporalContext: this.extractTemporalContextFromText(match[0]),
            quantitativeData: this.extractQuantitativeFromContext(match[0], geography),
            confidence: this.calculateContextConfidence(match[0], sourceType),
            extractedText: match[0],
            businessContext: 'Operational presence and activities'
          });
        }
      }
    }
    
    return this.deduplicateContexts(contexts);
  }

  /**
   * Extract quantitative data with geographic attribution
   */
  private extractQuantitativeData(text: string): QuantitativeExtraction[] {
    const extractions: QuantitativeExtraction[] = [];
    
    for (const pattern of this.QUANTITATIVE_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let value: number;
        let geography: string;
        let metricType: QuantitativeExtraction['metricType'];
        
        // Handle different pattern structures
        if (match[1] && match[2]) {
          // Pattern: "30% of revenue from Europe"
          if (!isNaN(parseFloat(match[1]))) {
            value = parseFloat(match[1]);
            geography = this.cleanGeographicReference(match[2]);
          } else {
            // Pattern: "Europe represents 30% of revenue"
            geography = this.cleanGeographicReference(match[1]);
            value = parseFloat(match[2]);
          }
        } else {
          continue;
        }
        
        if (!geography || isNaN(value)) continue;
        
        // Determine metric type
        const lowerText = match[0].toLowerCase();
        if (lowerText.includes('revenue') || lowerText.includes('sales') || lowerText.includes('income')) {
          metricType = 'revenue';
        } else if (lowerText.includes('employee') || lowerText.includes('workforce') || lowerText.includes('staff')) {
          metricType = 'employees';
        } else if (lowerText.includes('facilities') || lowerText.includes('offices') || lowerText.includes('locations')) {
          metricType = 'facilities';
        } else if (lowerText.includes('ebitda') || lowerText.includes('operating income')) {
          metricType = 'ebitda';
        } else {
          metricType = 'operations';
        }
        
        extractions.push({
          value,
          unit: lowerText.includes('%') ? 'percentage' : 'absolute',
          metricType,
          geography,
          temporalContext: this.extractTemporalContextFromText(match[0]),
          confidence: this.calculateQuantitativeConfidence(match[0], value)
        });
      }
    }
    
    return this.deduplicateQuantitative(extractions);
  }

  /**
   * Extract temporal timeline events
   */
  private extractTemporalTimeline(text: string): TemporalEvent[] {
    const events: TemporalEvent[] = [];
    
    for (const pattern of this.TEMPORAL_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (!geography) continue;
        
        let eventType: TemporalEvent['eventType'] = 'expansion';
        let timeframe = 'current';
        let date: Date | string = new Date();
        
        const lowerText = match[0].toLowerCase();
        
        // Determine event type
        if (lowerText.includes('acquire') || lowerText.includes('acquisition')) {
          eventType = 'acquisition';
        } else if (lowerText.includes('expand') || lowerText.includes('expansion')) {
          eventType = 'expansion';
        } else if (lowerText.includes('enter') || lowerText.includes('entry')) {
          eventType = 'entry';
        } else if (lowerText.includes('close') || lowerText.includes('closure')) {
          eventType = 'closure';
        } else if (lowerText.includes('divest') || lowerText.includes('sell')) {
          eventType = 'divestiture';
        }
        
        // Extract specific dates
        if (match[2]) { // Year match
          date = new Date(parseInt(match[2]), 0, 1);
          timeframe = 'future';
        } else if (match[3]) { // "next X years" match
          const years = parseInt(match[3]);
          date = new Date(new Date().getFullYear() + years, 0, 1);
          timeframe = 'future';
        } else if (lowerText.includes('previously') || lowerText.includes('historically')) {
          timeframe = 'historical';
          date = 'Historical';
        }
        
        events.push({
          event: match[0].trim(),
          geography,
          date,
          eventType,
          confidence: this.calculateContextConfidence(match[0], 'timeline')
        });
      }
    }
    
    return events.sort((a, b) => {
      if (typeof a.date === 'string' && typeof b.date === 'string') return 0;
      if (typeof a.date === 'string') return -1;
      if (typeof b.date === 'string') return 1;
      return a.date.getTime() - b.date.getTime();
    });
  }

  /**
   * Extract negative contexts (divestitures, closures, exits)
   */
  private extractNegativeContexts(text: string): NegativeContext[] {
    const negativeContexts: NegativeContext[] = [];
    
    for (const pattern of this.NEGATIVE_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (!geography) continue;
        
        let negationType: NegativeContext['negationType'] = 'reduction';
        let impact: NegativeContext['impact'] = 'medium';
        
        const lowerText = match[0].toLowerCase();
        
        // Determine negative context type
        if (lowerText.includes('divest') || lowerText.includes('sell') || lowerText.includes('dispose')) {
          negationType = 'divestiture';
          impact = 'high';
        } else if (lowerText.includes('close') || lowerText.includes('shut')) {
          negationType = 'closure';
          impact = 'high';
        } else if (lowerText.includes('exit') || lowerText.includes('withdraw') || lowerText.includes('leave')) {
          negationType = 'exit';
          impact = 'high';
        } else if (lowerText.includes('exclud') || lowerText.includes('not including')) {
          negationType = 'exclusion';
          impact = 'low';
        } else if (lowerText.includes('reduce') || lowerText.includes('scale down') || lowerText.includes('downsize')) {
          negationType = 'reduction';
          impact = 'medium';
        }
        
        negativeContexts.push({
          geography,
          negationType,
          description: match[0].trim(),
          temporalContext: this.extractTemporalContextFromText(match[0]),
          impact,
          confidence: this.calculateContextConfidence(match[0], 'negative')
        });
      }
    }
    
    return negativeContexts;
  }

  /**
   * Extract business strategies
   */
  private extractBusinessStrategies(text: string): BusinessStrategy[] {
    const strategies: BusinessStrategy[] = [];
    
    const strategyPatterns = [
      /(?:strategy|strategic|plan|planning)\s+(?:for|in|to)\s+([A-Za-z\s,]+?)\s+(?:market|region|growth|expansion)/gi,
      /([A-Za-z\s,]+?)\s+(?:strategy|strategic\s+plan|growth\s+plan|expansion\s+plan)/gi,
      /(?:focus|focusing)\s+on\s+([A-Za-z\s,]+?)\s+(?:growth|expansion|market|development)/gi
    ];
    
    for (const pattern of strategyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const geography = this.cleanGeographicReference(match[1]);
        if (!geography) continue;
        
        let strategyType: BusinessStrategy['strategyType'] = 'growth';
        const lowerText = match[0].toLowerCase();
        
        if (lowerText.includes('consolidat')) strategyType = 'consolidation';
        else if (lowerText.includes('diversif')) strategyType = 'diversification';
        else if (lowerText.includes('focus')) strategyType = 'focus';
        else if (lowerText.includes('transform')) strategyType = 'transformation';
        
        strategies.push({
          geography,
          strategyType,
          description: match[0].trim(),
          timeline: this.extractTimelineFromText(match[0]),
          confidence: this.calculateContextConfidence(match[0], 'strategy')
        });
      }
    }
    
    return strategies;
  }

  /**
   * Helper methods
   */
  private cleanGeographicReference(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractTemporalContextFromText(text: string): TemporalContext {
    const lowerText = text.toLowerCase();
    
    let timeframe: TemporalContext['timeframe'] = 'current';
    let isProjection = false;
    let specificPeriod = '';
    
    if (lowerText.includes('previously') || lowerText.includes('historically') || lowerText.includes('former')) {
      timeframe = 'historical';
    } else if (lowerText.includes('plan') || lowerText.includes('expect') || lowerText.includes('target') || lowerText.includes('will')) {
      timeframe = 'future';
      isProjection = true;
    } else if (lowerText.includes('transition') || lowerText.includes('moving') || lowerText.includes('shifting')) {
      timeframe = 'transition';
    }
    
    // Extract specific periods
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      specificPeriod = yearMatch[1];
    }
    
    const quarterMatch = text.match(/\b(Q[1-4])\s+(20\d{2})\b/i);
    if (quarterMatch) {
      specificPeriod = `${quarterMatch[1]} ${quarterMatch[2]}`;
    }
    
    return {
      timeframe,
      specificPeriod: specificPeriod || undefined,
      isProjection,
      confidence: 0.8
    };
  }

  private extractQuantitativeFromContext(text: string, geography: string): QuantitativeExtraction | undefined {
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const value = parseFloat(percentMatch[1]);
      let metricType: QuantitativeExtraction['metricType'] = 'operations';
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('revenue') || lowerText.includes('sales')) metricType = 'revenue';
      else if (lowerText.includes('employee') || lowerText.includes('workforce')) metricType = 'employees';
      else if (lowerText.includes('facilities') || lowerText.includes('offices')) metricType = 'facilities';
      
      return {
        value,
        unit: 'percentage',
        metricType,
        geography,
        temporalContext: this.extractTemporalContextFromText(text),
        confidence: 0.85
      };
    }
    
    return undefined;
  }

  private extractTimelineFromText(text: string): string {
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) return yearMatch[1];
    
    const nextYearsMatch = text.match(/next\s+(\d+)\s+years?/i);
    if (nextYearsMatch) return `Next ${nextYearsMatch[1]} years`;
    
    return 'Ongoing';
  }

  private calculateContextConfidence(text: string, sourceType: string): number {
    let confidence = 0.6; // Base confidence
    
    // Source type weighting
    const sourceWeights: Record<string, number> = {
      'sec_filing': 0.95,
      'sustainability_report': 0.85,
      'investor_presentation': 0.80,
      'website': 0.70,
      'job_posting': 0.60,
      'timeline': 0.75,
      'negative': 0.80,
      'strategy': 0.70
    };
    
    confidence *= (sourceWeights[sourceType] || 0.70);
    
    // Text quality indicators
    if (text.includes('%') || /\d+/.test(text)) confidence += 0.1;
    if (text.length > 50) confidence += 0.05;
    if (text.includes('million') || text.includes('billion')) confidence += 0.05;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private calculateQuantitativeConfidence(text: string, value: number): number {
    let confidence = 0.8; // Base confidence for quantitative data
    
    // Value reasonableness check
    if (value > 0 && value <= 100) confidence += 0.1; // Reasonable percentage
    if (value > 100 && value < 1000000) confidence += 0.05; // Reasonable absolute number
    
    // Context quality
    if (text.includes('revenue') || text.includes('sales')) confidence += 0.05;
    if (text.includes('total') || text.includes('approximately')) confidence -= 0.05;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private calculateOverallConfidence(items: any[]): number {
    if (items.length === 0) return 0;
    
    const totalConfidence = items.reduce((sum, item) => sum + (item.confidence || 0), 0);
    return totalConfidence / items.length;
  }

  private deduplicateContexts(contexts: GeographicContext[]): GeographicContext[] {
    const seen = new Map<string, GeographicContext>();
    
    for (const context of contexts) {
      const key = `${context.geography}-${context.contextType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < context.confidence) {
        seen.set(key, context);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateQuantitative(extractions: QuantitativeExtraction[]): QuantitativeExtraction[] {
    const seen = new Map<string, QuantitativeExtraction>();
    
    for (const extraction of extractions) {
      const key = `${extraction.geography}-${extraction.metricType}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < extraction.confidence) {
        seen.set(key, extraction);
      }
    }
    
    return Array.from(seen.values());
  }
}