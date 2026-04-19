/**
 * Signal Parser
 * Parses raw signals into structured format with NLP processing
 */

import type { RawSignal, StructuredSignal } from '@/types/csi-enhancement/signals';
import { SOURCE_CREDIBILITY } from '@/types/csi-enhancement/signals';
import { v4 as uuidv4 } from 'uuid';

export class SignalParser {
  /**
   * Parse raw signal into structured format
   */
  async parse(rawSignal: RawSignal): Promise<StructuredSignal> {
    const content = this.extractContent(rawSignal);
    
    // Extract geographic entities
    const countries = await this.extractCountries(content);
    
    // Classify risk vector
    const { primaryVector, secondaryVector } = await this.classifyVector(content);
    
    // Assess severity
    const severity = await this.assessSeverity(content);
    
    // Classify signal type
    const signalType = await this.classifySignalType(content);
    
    // Extract actors
    const actors = await this.extractActors(content);
    
    // Detect language
    const language = this.detectLanguage(content);
    
    // Get source credibility
    const sourceCredibility = SOURCE_CREDIBILITY[rawSignal.sourceId] || 0.70;
    
    return {
      signalId: uuidv4(),
      sourceId: rawSignal.sourceId,
      detectedAt: rawSignal.timestamp,
      countries,
      primaryVector,
      secondaryVector,
      headline: this.extractHeadline(content),
      summary: this.extractSummary(content),
      fullText: content,
      signalType,
      severity,
      actors,
      language,
      sourceCredibility,
      url: rawSignal.url,
      tags: this.extractTags(content),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Extract content from raw signal
   */
  private extractContent(rawSignal: RawSignal): string {
    try {
      const parsed = JSON.parse(rawSignal.rawContent);
      return parsed.title || parsed.headline || parsed.body || rawSignal.rawContent;
    } catch {
      return rawSignal.rawContent;
    }
  }

  /**
   * Extract countries from text using NLP
   */
  private async extractCountries(text: string): Promise<string[]> {
    const countries: Set<string> = new Set();
    
    // Country name to ISO code mapping (partial list for demo)
    const countryMapping: Record<string, string> = {
      'united states': 'US',
      'usa': 'US',
      'america': 'US',
      'china': 'CN',
      'russia': 'RU',
      'united kingdom': 'GB',
      'uk': 'GB',
      'britain': 'GB',
      'germany': 'DE',
      'france': 'FR',
      'japan': 'JP',
      'india': 'IN',
      'brazil': 'BR',
      'canada': 'CA',
      'mexico': 'MX',
      'australia': 'AU',
      'south korea': 'KR',
      'italy': 'IT',
      'spain': 'ES',
      'iran': 'IR',
      'israel': 'IL',
      'saudi arabia': 'SA',
      'turkey': 'TR',
      'ukraine': 'UA',
      'venezuela': 'VE',
      'taiwan': 'TW',
      'hong kong': 'HK',
      'singapore': 'SG',
      'vietnam': 'VN',
      'thailand': 'TH',
      'indonesia': 'ID',
      'philippines': 'PH',
      'pakistan': 'PK',
      'bangladesh': 'BD',
      'egypt': 'EG',
      'south africa': 'ZA',
      'nigeria': 'NG',
      'argentina': 'AR',
      'chile': 'CL',
      'colombia': 'CO',
      'poland': 'PL',
      'netherlands': 'NL',
      'belgium': 'BE',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'finland': 'FI',
      'switzerland': 'CH',
      'austria': 'AT',
      'greece': 'GR',
      'portugal': 'PT',
      'czech republic': 'CZ',
      'hungary': 'HU',
      'romania': 'RO',
      'new zealand': 'NZ'
    };
    
    const lowerText = text.toLowerCase();
    
    // Check for each country
    for (const [name, code] of Object.entries(countryMapping)) {
      if (lowerText.includes(name)) {
        countries.add(code);
      }
    }
    
    // If no countries found, try to extract from metadata
    if (countries.size === 0 && text.includes('sourcecountry')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.sourcecountry) {
          countries.add(parsed.sourcecountry);
        }
      } catch {
        // Ignore parsing errors
      }
    }
    
    return Array.from(countries);
  }

  /**
   * Classify risk vector (SC1-SC7)
   */
  private async classifyVector(text: string): Promise<{
    primaryVector: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
    secondaryVector?: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  }> {
    const lowerText = text.toLowerCase();
    
    // Vector classification rules
    const vectorKeywords = {
      SC1: ['sanction', 'embargo', 'tariff', 'trade war', 'export control', 'import ban', 'trade restriction'],
      SC2: ['capital control', 'currency restriction', 'forex', 'repatriation', 'exchange control', 'capital flight'],
      SC3: ['nationalization', 'expropriation', 'seizure', 'state takeover', 'confiscation', 'asset freeze'],
      SC4: ['military', 'conflict', 'war', 'invasion', 'attack', 'troops', 'defense', 'armed forces'],
      SC5: ['protest', 'riot', 'coup', 'regime change', 'election', 'political crisis', 'unrest', 'demonstration'],
      SC6: ['regulation', 'compliance', 'investigation', 'lawsuit', 'legal', 'court', 'antitrust', 'fine'],
      SC7: ['cyberattack', 'hacking', 'data breach', 'technology ban', 'cyber', 'ransomware', 'espionage']
    };
    
    // Score each vector
    const scores: Record<string, number> = {};
    for (const [vector, keywords] of Object.entries(vectorKeywords)) {
      scores[vector] = keywords.filter(keyword => lowerText.includes(keyword)).length;
    }
    
    // Find primary and secondary vectors
    const sortedVectors = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);
    
    const primaryVector = (sortedVectors[0]?.[0] || 'SC5') as any;
    const secondaryVector = sortedVectors[1]?.[1] > 0 ? (sortedVectors[1][0] as any) : undefined;
    
    return { primaryVector, secondaryVector };
  }

  /**
   * Assess signal severity
   */
  private async assessSeverity(text: string): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const lowerText = text.toLowerCase();
    
    // Critical indicators
    const criticalKeywords = ['war', 'invasion', 'nuclear', 'attack', 'crisis', 'emergency'];
    if (criticalKeywords.some(kw => lowerText.includes(kw))) {
      return 'critical';
    }
    
    // High severity indicators
    const highKeywords = ['sanction', 'embargo', 'military', 'conflict', 'coup', 'nationalization'];
    if (highKeywords.some(kw => lowerText.includes(kw))) {
      return 'high';
    }
    
    // Medium severity indicators
    const mediumKeywords = ['tariff', 'protest', 'investigation', 'regulation', 'restriction'];
    if (mediumKeywords.some(kw => lowerText.includes(kw))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Classify signal type
   */
  private async classifySignalType(text: string): Promise<'threat' | 'action' | 'policy' | 'conflict' | 'economic' | 'diplomatic'> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('threaten') || lowerText.includes('warning') || lowerText.includes('may impose')) {
      return 'threat';
    }
    
    if (lowerText.includes('imposed') || lowerText.includes('enacted') || lowerText.includes('implemented')) {
      return 'action';
    }
    
    if (lowerText.includes('policy') || lowerText.includes('regulation') || lowerText.includes('law')) {
      return 'policy';
    }
    
    if (lowerText.includes('military') || lowerText.includes('conflict') || lowerText.includes('war')) {
      return 'conflict';
    }
    
    if (lowerText.includes('trade') || lowerText.includes('tariff') || lowerText.includes('economic')) {
      return 'economic';
    }
    
    return 'diplomatic';
  }

  /**
   * Extract actors from text
   */
  private async extractActors(text: string): Promise<string[]> {
    const actors: Set<string> = new Set();
    
    // Common actors
    const actorPatterns = [
      'president',
      'government',
      'ministry',
      'department',
      'administration',
      'congress',
      'parliament',
      'military',
      'central bank',
      'treasury',
      'white house',
      'kremlin',
      'beijing',
      'european union',
      'nato',
      'united nations'
    ];
    
    const lowerText = text.toLowerCase();
    for (const pattern of actorPatterns) {
      if (lowerText.includes(pattern)) {
        actors.add(pattern);
      }
    }
    
    return Array.from(actors);
  }

  /**
   * Detect language
   */
  private detectLanguage(text: string): string {
    // Simple language detection (can be enhanced with a proper library)
    const commonEnglishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a'];
    const lowerText = text.toLowerCase();
    
    const englishWordCount = commonEnglishWords.filter(word => 
      lowerText.includes(` ${word} `)
    ).length;
    
    return englishWordCount >= 3 ? 'en' : 'unknown';
  }

  /**
   * Extract headline
   */
  private extractHeadline(text: string): string {
    try {
      const parsed = JSON.parse(text);
      return parsed.title || parsed.headline || text.substring(0, 200);
    } catch {
      return text.substring(0, 200);
    }
  }

  /**
   * Extract summary
   */
  private extractSummary(text: string): string {
    try {
      const parsed = JSON.parse(text);
      return parsed.summary || parsed.description || text.substring(0, 500);
    } catch {
      return text.substring(0, 500);
    }
  }

  /**
   * Extract tags
   */
  private extractTags(text: string): string[] {
    const tags: Set<string> = new Set();
    const lowerText = text.toLowerCase();
    
    const tagKeywords = [
      'geopolitical',
      'trade',
      'sanctions',
      'military',
      'diplomatic',
      'economic',
      'political',
      'security',
      'cyber',
      'conflict'
    ];
    
    for (const tag of tagKeywords) {
      if (lowerText.includes(tag)) {
        tags.add(tag);
      }
    }
    
    return Array.from(tags);
  }
}