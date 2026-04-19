/**
 * Global Language Processing Engine - Phase 1 Implementation
 * 
 * Multi-language processing capabilities for global corporate geographic intelligence
 * with support for English, German, French, Japanese, and Chinese.
 */

export interface LanguageDetectionResult {
  language: 'en' | 'de' | 'fr' | 'ja' | 'zh';
  confidence: number;
  script?: 'latin' | 'hiragana' | 'katakana' | 'kanji' | 'simplified' | 'traditional';
}

export interface GeographicEntity {
  entity: string;
  type: 'country' | 'region' | 'city' | 'continent';
  confidence: number;
  normalizedName: string;
  coordinates?: { lat: number; lng: number };
  context: string;
  language: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  preservedEntities: string[];
}

export interface ProcessingContext {
  documentType: 'annual_report' | 'sustainability_report' | 'filing' | 'website' | 'press_release';
  jurisdiction: string;
  company: string;
  reportingPeriod?: string;
  language: string;
}

export class GlobalLanguageProcessor {
  private geographicPatterns: Map<string, RegExp[]> = new Map();
  private languageModels: Map<string, any> = new Map();
  private translationCache: Map<string, TranslationResult> = new Map();
  private entityNormalizations: Map<string, string> = new Map();

  constructor() {
    this.initializeLanguagePatterns();
    this.initializeEntityNormalizations();
  }

  /**
   * Detect language of input text
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Language detection patterns
    const patterns = {
      en: /\b(the|and|of|to|in|for|with|by|from|at|on|as|is|are|was|were|have|has|had|will|would|could|should|may|might)\b/g,
      de: /\b(der|die|das|und|oder|ist|sind|war|waren|haben|hat|hatte|wird|würde|könnte|sollte|für|mit|von|zu|in|an|auf|bei)\b/g,
      fr: /\b(le|la|les|et|ou|est|sont|était|étaient|avoir|a|avait|sera|serait|pourrait|devrait|pour|avec|de|du|des|dans|sur|par)\b/g,
      ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g,
      zh: /[\u4e00-\u9fff]/g
    };

    const scores = {
      en: (text.match(patterns.en) || []).length,
      de: (text.match(patterns.de) || []).length,
      fr: (text.match(patterns.fr) || []).length,
      ja: (text.match(patterns.ja) || []).length,
      zh: (text.match(patterns.zh) || []).length
    };

    // Determine primary language
    const maxScore = Math.max(...Object.values(scores));
    const detectedLanguage = Object.keys(scores).find(lang => scores[lang as keyof typeof scores] === maxScore) as 'en' | 'de' | 'fr' | 'ja' | 'zh';
    
    // Calculate confidence
    const totalMatches = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalMatches > 0 ? maxScore / totalMatches : 0.5;

    // Detect script for Asian languages
    let script: 'latin' | 'hiragana' | 'katakana' | 'kanji' | 'simplified' | 'traditional' | undefined;
    if (detectedLanguage === 'ja') {
      if (/[\u3040-\u309f]/.test(text)) script = 'hiragana';
      else if (/[\u30a0-\u30ff]/.test(text)) script = 'katakana';
      else if (/[\u4e00-\u9faf]/.test(text)) script = 'kanji';
    } else if (detectedLanguage === 'zh') {
      script = 'simplified'; // Default assumption, could be enhanced with more sophisticated detection
    }

    return {
      language: detectedLanguage || 'en',
      confidence: Math.max(confidence, 0.1),
      script
    };
  }

  /**
   * Extract geographic entities from multi-language text
   */
  extractGeographicEntities(text: string, context: ProcessingContext): GeographicEntity[] {
    const languageResult = this.detectLanguage(text);
    const entities: GeographicEntity[] = [];

    // Get language-specific patterns
    const patterns = this.geographicPatterns.get(languageResult.language) || this.geographicPatterns.get('en')!;

    // Extract entities using patterns
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalizedName = this.normalizeGeographicEntity(match, languageResult.language);
          if (normalizedName) {
            entities.push({
              entity: match,
              type: this.classifyEntityType(normalizedName),
              confidence: this.calculateEntityConfidence(match, text, context),
              normalizedName,
              context: this.extractContext(match, text),
              language: languageResult.language
            });
          }
        });
      }
    });

    // Remove duplicates and sort by confidence
    return this.deduplicateEntities(entities)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Translate text while preserving geographic entities
   */
  async translateText(text: string, targetLanguage: string = 'en'): Promise<TranslationResult> {
    const cacheKey = `${text.substring(0, 100)}_${targetLanguage}`;
    
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    const sourceLanguage = this.detectLanguage(text).language;
    
    if (sourceLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 1.0,
        preservedEntities: []
      };
    }

    // Extract entities before translation
    const entities = this.extractGeographicEntities(text, {
      documentType: 'filing',
      jurisdiction: 'unknown',
      company: 'unknown',
      language: sourceLanguage
    });

    // Simulate translation (in production, integrate with translation service)
    const translatedText = await this.performTranslation(text, sourceLanguage, targetLanguage);
    
    // Preserve geographic entities in translation
    const preservedEntities = entities.map(e => e.normalizedName);

    const result: TranslationResult = {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.85, // Simulated confidence
      preservedEntities
    };

    this.translationCache.set(cacheKey, result);
    return result;
  }

  /**
   * Process multi-language document for geographic intelligence
   */
  async processDocument(
    text: string, 
    context: ProcessingContext
  ): Promise<{
    entities: GeographicEntity[];
    translation?: TranslationResult;
    language: LanguageDetectionResult;
    processedText: string;
  }> {
    const language = this.detectLanguage(text);
    
    // Translate to English if needed
    let translation: TranslationResult | undefined;
    let processedText = text;
    
    if (language.language !== 'en') {
      translation = await this.translateText(text, 'en');
      processedText = translation.translatedText;
    }

    // Extract geographic entities
    const entities = this.extractGeographicEntities(processedText, {
      ...context,
      language: 'en'
    });

    return {
      entities,
      translation,
      language,
      processedText
    };
  }

  /**
   * Initialize language-specific geographic patterns
   */
  private initializeLanguagePatterns(): void {
    // English patterns
    this.geographicPatterns.set('en', [
      /\b(United States|USA|US|America|North America)\b/gi,
      /\b(United Kingdom|UK|Britain|Great Britain|England|Scotland|Wales)\b/gi,
      /\b(European Union|EU|Europe)\b/gi,
      /\b(China|People's Republic of China|PRC|Hong Kong|Taiwan)\b/gi,
      /\b(Japan|Nippon|Japanese)\b/gi,
      /\b(Canada|Canadian)\b/gi,
      /\b(Australia|Australian|New Zealand)\b/gi,
      /\b(Singapore|Malaysia|Thailand|Indonesia|Philippines)\b/gi,
      /\b(Germany|German|France|French|Italy|Italian|Spain|Spanish)\b/gi,
      /\b(Brazil|Mexico|Argentina|Chile|Colombia)\b/gi,
      /\b(India|Indian|South Korea|Korean)\b/gi
    ]);

    // German patterns
    this.geographicPatterns.set('de', [
      /\b(Deutschland|Bundesrepublik Deutschland|deutsche?[rn]?)\b/gi,
      /\b(Vereinigte Staaten|USA|Amerika|amerikanisch)\b/gi,
      /\b(Vereinigtes Königreich|Großbritannien|britisch)\b/gi,
      /\b(Europäische Union|EU|Europa|europäisch)\b/gi,
      /\b(China|chinesisch|Hongkong|Taiwan)\b/gi,
      /\b(Japan|japanisch|Nippon)\b/gi,
      /\b(Kanada|kanadisch)\b/gi,
      /\b(Australien|australisch|Neuseeland)\b/gi,
      /\b(Frankreich|französisch|Italien|italienisch|Spanien|spanisch)\b/gi
    ]);

    // French patterns
    this.geographicPatterns.set('fr', [
      /\b(France|français|République française)\b/gi,
      /\b(États-Unis|USA|Amérique|américain)\b/gi,
      /\b(Royaume-Uni|Grande-Bretagne|britannique|Angleterre)\b/gi,
      /\b(Union européenne|UE|Europe|européen)\b/gi,
      /\b(Chine|chinois|Hong Kong|Taïwan)\b/gi,
      /\b(Japon|japonais)\b/gi,
      /\b(Canada|canadien)\b/gi,
      /\b(Australie|australien|Nouvelle-Zélande)\b/gi,
      /\b(Allemagne|allemand|Italie|italien|Espagne|espagnol)\b/gi
    ]);

    // Japanese patterns (simplified)
    this.geographicPatterns.set('ja', [
      /\b(日本|にほん|ニホン|日本国)\b/g,
      /\b(アメリカ|米国|アメリカ合衆国|米|USA)\b/g,
      /\b(イギリス|英国|イングランド|UK)\b/g,
      /\b(ヨーロッパ|欧州|EU|欧州連合)\b/g,
      /\b(中国|中華人民共和国|香港|台湾)\b/g,
      /\b(カナダ|加)\b/g,
      /\b(オーストラリア|豪州|ニュージーランド)\b/g,
      /\b(ドイツ|独|フランス|仏|イタリア|伊|スペイン|西)\b/g
    ]);

    // Chinese patterns (simplified)
    this.geographicPatterns.set('zh', [
      /\b(中国|中华人民共和国|中國|中華人民共和國|香港|台湾|台灣)\b/g,
      /\b(美国|美國|美利坚合众国|美利堅合眾國|USA)\b/g,
      /\b(英国|英國|联合王国|聯合王國|UK)\b/g,
      /\b(欧洲|歐洲|欧盟|歐盟|EU)\b/g,
      /\b(日本|日)\b/g,
      /\b(加拿大|加)\b/g,
      /\b(澳大利亚|澳大利亞|澳洲|新西兰|新西蘭)\b/g,
      /\b(德国|德國|法国|法國|意大利|西班牙)\b/g
    ]);
  }

  /**
   * Initialize entity normalizations
   */
  private initializeEntityNormalizations(): void {
    // English normalizations
    this.entityNormalizations.set('USA', 'United States');
    this.entityNormalizations.set('US', 'United States');
    this.entityNormalizations.set('America', 'United States');
    this.entityNormalizations.set('UK', 'United Kingdom');
    this.entityNormalizations.set('Britain', 'United Kingdom');
    this.entityNormalizations.set('Great Britain', 'United Kingdom');
    this.entityNormalizations.set('EU', 'European Union');
    this.entityNormalizations.set('PRC', 'China');
    this.entityNormalizations.set('People\'s Republic of China', 'China');

    // German normalizations
    this.entityNormalizations.set('Deutschland', 'Germany');
    this.entityNormalizations.set('Bundesrepublik Deutschland', 'Germany');
    this.entityNormalizations.set('Vereinigte Staaten', 'United States');
    this.entityNormalizations.set('Vereinigtes Königreich', 'United Kingdom');
    this.entityNormalizations.set('Großbritannien', 'United Kingdom');
    this.entityNormalizations.set('Europäische Union', 'European Union');

    // French normalizations
    this.entityNormalizations.set('États-Unis', 'United States');
    this.entityNormalizations.set('Royaume-Uni', 'United Kingdom');
    this.entityNormalizations.set('Grande-Bretagne', 'United Kingdom');
    this.entityNormalizations.set('Union européenne', 'European Union');
    this.entityNormalizations.set('République française', 'France');

    // Japanese normalizations
    this.entityNormalizations.set('日本', 'Japan');
    this.entityNormalizations.set('にほん', 'Japan');
    this.entityNormalizations.set('ニホン', 'Japan');
    this.entityNormalizations.set('日本国', 'Japan');
    this.entityNormalizations.set('アメリカ', 'United States');
    this.entityNormalizations.set('米国', 'United States');
    this.entityNormalizations.set('アメリカ合衆国', 'United States');
    this.entityNormalizations.set('イギリス', 'United Kingdom');
    this.entityNormalizations.set('英国', 'United Kingdom');
    this.entityNormalizations.set('中国', 'China');
    this.entityNormalizations.set('中華人民共和国', 'China');

    // Chinese normalizations
    this.entityNormalizations.set('中国', 'China');
    this.entityNormalizations.set('中國', 'China');
    this.entityNormalizations.set('中华人民共和国', 'China');
    this.entityNormalizations.set('中華人民共和國', 'China');
    this.entityNormalizations.set('美国', 'United States');
    this.entityNormalizations.set('美國', 'United States');
    this.entityNormalizations.set('美利坚合众国', 'United States');
    this.entityNormalizations.set('美利堅合眾國', 'United States');
    this.entityNormalizations.set('英国', 'United Kingdom');
    this.entityNormalizations.set('英國', 'United Kingdom');
    this.entityNormalizations.set('联合王国', 'United Kingdom');
    this.entityNormalizations.set('聯合王國', 'United Kingdom');
  }

  /**
   * Normalize geographic entity to standard English name
   */
  private normalizeGeographicEntity(entity: string, language: string): string | null {
    const normalized = this.entityNormalizations.get(entity);
    if (normalized) return normalized;

    // Direct normalization for English entities
    if (language === 'en') {
      return entity;
    }

    // Return null if no normalization found
    return null;
  }

  /**
   * Classify entity type
   */
  private classifyEntityType(entity: string): 'country' | 'region' | 'city' | 'continent' {
    const countries = [
      'United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'China', 
      'Canada', 'Australia', 'Italy', 'Spain', 'Brazil', 'India', 'South Korea',
      'Mexico', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark'
    ];

    const regions = [
      'European Union', 'North America', 'South America', 'Middle East', 
      'Southeast Asia', 'Eastern Europe', 'Western Europe', 'Latin America'
    ];

    const continents = [
      'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'
    ];

    if (countries.includes(entity)) return 'country';
    if (regions.includes(entity)) return 'region';
    if (continents.includes(entity)) return 'continent';
    return 'city'; // Default assumption
  }

  /**
   * Calculate entity confidence based on context
   */
  private calculateEntityConfidence(entity: string, text: string, context: ProcessingContext): number {
    let confidence = 0.7; // Base confidence

    // Boost confidence for regulatory filings
    if (context.documentType === 'annual_report' || context.documentType === 'filing') {
      confidence += 0.2;
    }

    // Boost confidence if entity appears multiple times
    const occurrences = (text.match(new RegExp(entity, 'gi')) || []).length;
    if (occurrences > 1) {
      confidence += Math.min(0.1 * (occurrences - 1), 0.2);
    }

    // Boost confidence for revenue/sales context
    const revenueContext = /revenue|sales|income|earnings|operations|facilities|subsidiaries/i.test(text);
    if (revenueContext) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract context around entity
   */
  private extractContext(entity: string, text: string): string {
    const entityIndex = text.toLowerCase().indexOf(entity.toLowerCase());
    if (entityIndex === -1) return '';

    const start = Math.max(0, entityIndex - 100);
    const end = Math.min(text.length, entityIndex + entity.length + 100);
    
    return text.substring(start, end);
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateEntities(entities: GeographicEntity[]): GeographicEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.normalizedName}_${entity.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Simulate translation (replace with actual translation service in production)
   */
  private async performTranslation(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    // Simplified translation simulation
    // In production, integrate with Google Translate API, Azure Translator, or similar service
    
    if (sourceLanguage === 'de' && targetLanguage === 'en') {
      return text
        .replace(/Deutschland/gi, 'Germany')
        .replace(/Vereinigte Staaten/gi, 'United States')
        .replace(/Vereinigtes Königreich/gi, 'United Kingdom')
        .replace(/Europäische Union/gi, 'European Union');
    }
    
    if (sourceLanguage === 'fr' && targetLanguage === 'en') {
      return text
        .replace(/États-Unis/gi, 'United States')
        .replace(/Royaume-Uni/gi, 'United Kingdom')
        .replace(/Union européenne/gi, 'European Union');
    }
    
    // For Japanese and Chinese, return simplified version
    if ((sourceLanguage === 'ja' || sourceLanguage === 'zh') && targetLanguage === 'en') {
      return `[Translated from ${sourceLanguage}] ${text}`;
    }
    
    return text; // Fallback
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return ['en', 'de', 'fr', 'ja', 'zh'];
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    languagesSupported: number;
    entitiesNormalized: number;
    translationsCached: number;
  } {
    return {
      languagesSupported: this.geographicPatterns.size,
      entitiesNormalized: this.entityNormalizations.size,
      translationsCached: this.translationCache.size
    };
  }
}

// Export singleton instance
export const globalLanguageProcessor = new GlobalLanguageProcessor();