/**
 * Regional Website Analyzer
 * 
 * Analyzes regional variations of company websites to extract
 * geographic market intelligence and localization patterns.
 */

import { WebScrapingUtils, ScrapingResult } from '../utils/webScrapingUtils';
import { GeographicNormalizer, NormalizedLocation } from '../utils/geographicNormalizer';

export interface RegionalWebsite {
  url: string;
  domain: string;
  country: string;
  normalizedLocation: NormalizedLocation;
  language: string;
  isActive: boolean;
  lastChecked: Date;
  responseTime: number;
  statusCode: number;
}

export interface RegionalContent {
  website: RegionalWebsite;
  products: string[];
  services: string[];
  pricing: PricingInfo[];
  localizations: LocalizationFeature[];
  marketAdaptations: MarketAdaptation[];
  contactInfo: ContactInfo;
  confidence: number;
}

export interface PricingInfo {
  product: string;
  price: string;
  currency: string;
  availability: string;
}

export interface LocalizationFeature {
  type: 'language' | 'currency' | 'date_format' | 'address_format' | 'phone_format' | 'cultural';
  description: string;
  value: string;
}

export interface MarketAdaptation {
  type: 'product_variant' | 'service_offering' | 'partnership' | 'compliance' | 'cultural_content';
  description: string;
  significance: 'high' | 'medium' | 'low';
}

export interface ContactInfo {
  addresses: string[];
  phoneNumbers: string[];
  emails: string[];
  socialMedia: string[];
}

export interface RegionalAnalysisResult {
  ticker: string;
  companyName: string;
  baseUrl: string;
  regionalWebsites: RegionalWebsite[];
  regionalContent: RegionalContent[];
  marketPriorities: MarketPriority[];
  localizationScore: number;
  globalPresenceScore: number;
  analysisTimestamp: Date;
  confidence: number;
}

export interface MarketPriority {
  country: string;
  priority: 'primary' | 'secondary' | 'emerging' | 'minimal';
  indicators: string[];
  score: number;
}

export class RegionalWebsiteAnalyzer {
  private scraper: WebScrapingUtils;
  private normalizer: GeographicNormalizer;

  constructor() {
    this.scraper = new WebScrapingUtils({
      rateLimit: 2500, // 2.5 seconds between requests
      timeout: 30000,
      respectRobotsTxt: true
    });
    this.normalizer = new GeographicNormalizer();
  }

  /**
   * Analyze regional websites for a company
   */
  async analyzeRegionalWebsites(ticker: string, companyName: string, baseUrl: string): Promise<RegionalAnalysisResult> {
    console.log(`🌍 Analyzing regional websites for ${ticker} from ${baseUrl}`);
    
    const startTime = Date.now();

    try {
      // Step 1: Discover regional websites
      const regionalWebsites = await this.discoverRegionalWebsites(baseUrl);
      console.log(`📍 Found ${regionalWebsites.length} regional websites for ${ticker}`);

      // Step 2: Analyze content from each regional website
      const regionalContent: RegionalContent[] = [];
      
      for (const website of regionalWebsites) {
        if (website.isActive) {
          try {
            const content = await this.analyzeRegionalContent(website);
            regionalContent.push(content);
            console.log(`✅ Analyzed content for ${website.country} (${website.url})`);
          } catch (error) {
            console.warn(`⚠️ Failed to analyze content for ${website.url}:`, error);
          }
        }
      }

      // Step 3: Calculate market priorities
      const marketPriorities = this.calculateMarketPriorities(regionalWebsites, regionalContent);

      // Step 4: Calculate scores
      const localizationScore = this.calculateLocalizationScore(regionalContent);
      const globalPresenceScore = this.calculateGlobalPresenceScore(regionalWebsites);
      const overallConfidence = this.calculateOverallConfidence(regionalContent);

      const result: RegionalAnalysisResult = {
        ticker,
        companyName,
        baseUrl,
        regionalWebsites,
        regionalContent,
        marketPriorities,
        localizationScore,
        globalPresenceScore,
        analysisTimestamp: new Date(),
        confidence: overallConfidence
      };

      console.log(`🎉 Regional analysis completed for ${ticker}`);
      console.log(`📊 Global presence: ${globalPresenceScore.toFixed(1)}/100, Localization: ${localizationScore.toFixed(1)}/100`);
      console.log(`🏆 Top markets: ${marketPriorities.slice(0, 3).map(m => `${m.country} (${m.priority})`).join(', ')}`);

      return result;

    } catch (error) {
      console.error(`❌ Regional website analysis failed for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Discover regional websites for a company
   */
  private async discoverRegionalWebsites(baseUrl: string): Promise<RegionalWebsite[]> {
    const regionalWebsites: RegionalWebsite[] = [];
    
    try {
      const urlObj = new URL(baseUrl);
      const baseDomain = urlObj.hostname.replace(/^www\./, '');
      
      // Get potential regional sites from scraper utility
      const candidateUrls = await this.scraper.discoverRegionalSites(baseUrl);
      
      // Test each candidate URL
      for (const candidateUrl of candidateUrls) {
        try {
          const startTime = Date.now();
          const response = await fetch(candidateUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          
          const responseTime = Date.now() - startTime;
          const isActive = response.ok;
          
          // Extract country from URL
          const country = this.extractCountryFromUrl(candidateUrl);
          const normalizedLocation = country ? this.normalizer.normalize(country) : null;
          
          if (normalizedLocation) {
            const regionalWebsite: RegionalWebsite = {
              url: candidateUrl,
              domain: new URL(candidateUrl).hostname,
              country: normalizedLocation.countryName,
              normalizedLocation,
              language: this.detectLanguageFromUrl(candidateUrl),
              isActive,
              lastChecked: new Date(),
              responseTime,
              statusCode: response.status
            };
            
            regionalWebsites.push(regionalWebsite);
            
            if (isActive) {
              console.log(`✅ Active regional site: ${candidateUrl} (${country})`);
            } else {
              console.log(`❌ Inactive regional site: ${candidateUrl} (${response.status})`);
            }
          }
          
        } catch (error) {
          console.warn(`⚠️ Could not check regional site ${candidateUrl}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error discovering regional websites:', error);
    }
    
    return regionalWebsites.sort((a, b) => {
      // Sort by active status first, then by response time
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.responseTime - b.responseTime;
    });
  }

  /**
   * Analyze content from a regional website
   */
  private async analyzeRegionalContent(website: RegionalWebsite): Promise<RegionalContent> {
    try {
      const result = await this.scraper.scrapeUrl(website.url);
      
      const content: RegionalContent = {
        website,
        products: this.extractProducts(result.content),
        services: this.extractServices(result.content),
        pricing: this.extractPricing(result.content, website.country),
        localizations: this.extractLocalizations(result.content, website),
        marketAdaptations: this.extractMarketAdaptations(result.content, website),
        contactInfo: this.extractContactInfo(result.content),
        confidence: this.calculateContentConfidence(result.content)
      };
      
      return content;
      
    } catch (error) {
      console.error(`Error analyzing content for ${website.url}:`, error);
      throw error;
    }
  }

  /**
   * Extract products from website content
   */
  private extractProducts(content: string): string[] {
    const products: string[] = [];
    
    // Look for product-related sections
    const productPatterns = [
      /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/section>/gis,
      /<h[1-6][^>]*>[^<]*product[^<]*<\/h[1-6]>/gi,
      /<a[^>]*href="[^"]*product[^"]*"[^>]*>(.*?)<\/a>/gis
    ];
    
    for (const pattern of productPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const productText = match[1] || match[0];
        const cleanText = productText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (cleanText.length > 3 && cleanText.length < 100) {
          products.push(cleanText);
        }
      }
    }
    
    // Extract from navigation menus
    const navProducts = this.scraper.extractTextContent(content, 'nav');
    products.push(...navProducts.filter(text => 
      text.length > 3 && text.length < 50 && 
      !text.toLowerCase().includes('about') &&
      !text.toLowerCase().includes('contact')
    ));
    
    return [...new Set(products)].slice(0, 20); // Limit and deduplicate
  }

  /**
   * Extract services from website content
   */
  private extractServices(content: string): string[] {
    const services: string[] = [];
    
    const servicePatterns = [
      /<div[^>]*class="[^"]*service[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class="[^"]*service[^"]*"[^>]*>(.*?)<\/section>/gis,
      /<h[1-6][^>]*>[^<]*service[^<]*<\/h[1-6]>/gi
    ];
    
    for (const pattern of servicePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const serviceText = match[1] || match[0];
        const cleanText = serviceText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (cleanText.length > 3 && cleanText.length < 100) {
          services.push(cleanText);
        }
      }
    }
    
    return [...new Set(services)].slice(0, 15);
  }

  /**
   * Extract pricing information
   */
  private extractPricing(content: string, country: string): PricingInfo[] {
    const pricing: PricingInfo[] = [];
    
    // Look for price patterns with currency symbols
    const pricePatterns = [
      /([A-Za-z\s]+?)[\s:]+([€£¥$₹₽])\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /([A-Za-z\s]+?)[\s:]+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|CNY|INR|CAD|AUD)/gi
    ];
    
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const product = match[1].trim();
        const price = match[2] + match[3] || match[2];
        const currency = this.detectCurrencyFromSymbol(match[2]) || match[4] || 'USD';
        
        if (product.length > 2 && product.length < 50) {
          pricing.push({
            product,
            price,
            currency,
            availability: country
          });
        }
      }
    }
    
    return pricing.slice(0, 10);
  }

  /**
   * Extract localization features
   */
  private extractLocalizations(content: string, website: RegionalWebsite): LocalizationFeature[] {
    const localizations: LocalizationFeature[] = [];
    
    // Language detection
    const langMatch = content.match(/<html[^>]*lang="([^"]+)"/i);
    if (langMatch) {
      localizations.push({
        type: 'language',
        description: 'HTML language attribute',
        value: langMatch[1]
      });
    }
    
    // Currency detection
    const currencies = content.match(/[€£¥$₹₽]/g);
    if (currencies) {
      const uniqueCurrencies = [...new Set(currencies)];
      localizations.push({
        type: 'currency',
        description: 'Currency symbols found',
        value: uniqueCurrencies.join(', ')
      });
    }
    
    // Date format detection
    const dateFormats = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g, // MM/DD/YYYY or DD/MM/YYYY
      /\d{1,2}-\d{1,2}-\d{4}/g,   // MM-DD-YYYY or DD-MM-YYYY
      /\d{4}-\d{1,2}-\d{1,2}/g    // YYYY-MM-DD
    ];
    
    for (const pattern of dateFormats) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        localizations.push({
          type: 'date_format',
          description: 'Date format pattern',
          value: matches[0]
        });
        break;
      }
    }
    
    // Phone format detection
    const phoneNumbers = this.scraper.extractPhoneNumbers(content);
    if (phoneNumbers.length > 0) {
      localizations.push({
        type: 'phone_format',
        description: 'Phone number format',
        value: phoneNumbers[0]
      });
    }
    
    return localizations;
  }

  /**
   * Extract market adaptations
   */
  private extractMarketAdaptations(content: string, website: RegionalWebsite): MarketAdaptation[] {
    const adaptations: MarketAdaptation[] = [];
    
    // Look for country-specific content
    const countrySpecificPatterns = [
      new RegExp(`${website.country}[^a-zA-Z]`, 'gi'),
      /local\s+(?:partner|distributor|office|team)/gi,
      /regional\s+(?:office|team|support)/gi,
      /(?:compliance|regulation|standard|certification)\s+(?:with|for|in)/gi
    ];
    
    for (const pattern of countrySpecificPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        adaptations.push({
          type: 'cultural_content',
          description: `Country-specific references found: ${matches.slice(0, 3).join(', ')}`,
          significance: 'medium'
        });
      }
    }
    
    // Look for partnerships
    const partnershipKeywords = ['partner', 'distributor', 'reseller', 'authorized', 'certified'];
    for (const keyword of partnershipKeywords) {
      const pattern = new RegExp(`${keyword}[^.]*${website.country}|${website.country}[^.]*${keyword}`, 'gi');
      const matches = content.match(pattern);
      if (matches) {
        adaptations.push({
          type: 'partnership',
          description: `Local partnerships mentioned: ${keyword}`,
          significance: 'high'
        });
      }
    }
    
    return adaptations;
  }

  /**
   * Extract contact information
   */
  private extractContactInfo(content: string): ContactInfo {
    return {
      addresses: this.scraper.extractAddresses(content),
      phoneNumbers: this.scraper.extractPhoneNumbers(content),
      emails: this.scraper.extractEmails(content),
      socialMedia: this.extractSocialMediaLinks(content)
    };
  }

  /**
   * Extract social media links
   */
  private extractSocialMediaLinks(content: string): string[] {
    const socialPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];
    const socialLinks: string[] = [];
    
    for (const platform of socialPlatforms) {
      const pattern = new RegExp(`https?://[^\\s"']*${platform}[^\\s"']*`, 'gi');
      const matches = content.match(pattern);
      if (matches) {
        socialLinks.push(...matches);
      }
    }
    
    return [...new Set(socialLinks)];
  }

  /**
   * Calculate market priorities based on website analysis
   */
  private calculateMarketPriorities(websites: RegionalWebsite[], content: RegionalContent[]): MarketPriority[] {
    const priorities: MarketPriority[] = [];
    
    for (const website of websites) {
      const regionContent = content.find(c => c.website.url === website.url);
      
      let score = 0;
      const indicators: string[] = [];
      
      // Base score for having a regional website
      if (website.isActive) {
        score += 30;
        indicators.push('Active regional website');
      }
      
      // Response time indicator (faster = higher priority)
      if (website.responseTime < 2000) {
        score += 10;
        indicators.push('Fast response time');
      }
      
      if (regionContent) {
        // Content richness
        if (regionContent.products.length > 5) {
          score += 20;
          indicators.push(`${regionContent.products.length} products listed`);
        }
        
        if (regionContent.services.length > 3) {
          score += 15;
          indicators.push(`${regionContent.services.length} services offered`);
        }
        
        // Localization depth
        if (regionContent.localizations.length > 3) {
          score += 15;
          indicators.push('High localization');
        }
        
        // Local contact presence
        if (regionContent.contactInfo.addresses.length > 0) {
          score += 10;
          indicators.push('Local contact information');
        }
        
        // Market adaptations
        const highSigAdaptations = regionContent.marketAdaptations.filter(a => a.significance === 'high');
        if (highSigAdaptations.length > 0) {
          score += 20;
          indicators.push('Market-specific adaptations');
        }
      }
      
      let priority: MarketPriority['priority'];
      if (score >= 80) priority = 'primary';
      else if (score >= 60) priority = 'secondary';
      else if (score >= 40) priority = 'emerging';
      else priority = 'minimal';
      
      priorities.push({
        country: website.country,
        priority,
        indicators,
        score
      });
    }
    
    return priorities.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate localization score
   */
  private calculateLocalizationScore(content: RegionalContent[]): number {
    if (content.length === 0) return 0;
    
    let totalScore = 0;
    
    for (const regionContent of content) {
      let regionScore = 0;
      
      // Language localization (20 points)
      const hasLanguage = regionContent.localizations.some(l => l.type === 'language');
      if (hasLanguage) regionScore += 20;
      
      // Currency localization (20 points)
      const hasCurrency = regionContent.localizations.some(l => l.type === 'currency');
      if (hasCurrency) regionScore += 20;
      
      // Contact localization (15 points)
      if (regionContent.contactInfo.addresses.length > 0) regionScore += 15;
      
      // Content adaptation (25 points)
      const adaptationScore = Math.min(25, regionContent.marketAdaptations.length * 5);
      regionScore += adaptationScore;
      
      // Product/service localization (20 points)
      const contentScore = Math.min(20, (regionContent.products.length + regionContent.services.length) * 2);
      regionScore += contentScore;
      
      totalScore += regionScore;
    }
    
    return totalScore / content.length;
  }

  /**
   * Calculate global presence score
   */
  private calculateGlobalPresenceScore(websites: RegionalWebsite[]): number {
    const activeWebsites = websites.filter(w => w.isActive);
    
    // Base score for number of regional sites
    let score = Math.min(60, activeWebsites.length * 10);
    
    // Bonus for geographic diversity
    const regions = new Set(activeWebsites.map(w => w.normalizedLocation.region));
    score += Math.min(25, regions.size * 5);
    
    // Bonus for major market coverage
    const majorMarkets = ['United States', 'China', 'Germany', 'Japan', 'United Kingdom'];
    const coveredMajorMarkets = activeWebsites.filter(w => majorMarkets.includes(w.country)).length;
    score += Math.min(15, coveredMajorMarkets * 3);
    
    return Math.min(100, score);
  }

  /**
   * Calculate content confidence
   */
  private calculateContentConfidence(content: string): number {
    let confidence = 0.5; // Base confidence
    
    // Content length indicator
    if (content.length > 10000) confidence += 0.2;
    else if (content.length > 5000) confidence += 0.1;
    
    // Structured content indicators
    if (content.includes('json-ld') || content.includes('microdata')) confidence += 0.1;
    
    // Navigation structure
    if (content.includes('<nav') || content.includes('menu')) confidence += 0.1;
    
    // Contact information presence
    if (content.includes('@') || content.includes('phone') || content.includes('address')) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(content: RegionalContent[]): number {
    if (content.length === 0) return 0;
    
    const totalConfidence = content.reduce((sum, c) => sum + c.confidence, 0);
    return totalConfidence / content.length;
  }

  /**
   * Utility methods
   */
  private extractCountryFromUrl(url: string): string | null {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Extract from TLD
    const tld = hostname.split('.').pop();
    const tldToCountry: Record<string, string> = {
      'uk': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France',
      'it': 'Italy',
      'es': 'Spain',
      'nl': 'Netherlands',
      'ca': 'Canada',
      'au': 'Australia',
      'jp': 'Japan',
      'cn': 'China',
      'kr': 'South Korea',
      'in': 'India',
      'br': 'Brazil',
      'mx': 'Mexico'
    };
    
    if (tld && tldToCountry[tld]) {
      return tldToCountry[tld];
    }
    
    // Extract from subdomain
    const subdomain = hostname.split('.')[0];
    if (tldToCountry[subdomain]) {
      return tldToCountry[subdomain];
    }
    
    return null;
  }

  private detectLanguageFromUrl(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('/en/') || urlLower.includes('en.')) return 'en';
    if (urlLower.includes('/de/') || urlLower.includes('de.')) return 'de';
    if (urlLower.includes('/fr/') || urlLower.includes('fr.')) return 'fr';
    if (urlLower.includes('/es/') || urlLower.includes('es.')) return 'es';
    if (urlLower.includes('/it/') || urlLower.includes('it.')) return 'it';
    if (urlLower.includes('/ja/') || urlLower.includes('ja.')) return 'ja';
    if (urlLower.includes('/zh/') || urlLower.includes('zh.')) return 'zh';
    
    return 'en'; // Default to English
  }

  private detectCurrencyFromSymbol(symbol: string): string {
    const symbolToCurrency: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR',
      '₽': 'RUB'
    };
    
    return symbolToCurrency[symbol] || 'USD';
  }
}