/**
 * Web Scraping Utilities
 * 
 * Comprehensive utilities for intelligent web scraping with rate limiting,
 * error recovery, and dynamic content handling.
 */

export interface ScrapingConfig {
  userAgent: string;
  rateLimit: number; // milliseconds between requests
  timeout: number;
  maxRetries: number;
  respectRobotsTxt: boolean;
  enableJavaScript: boolean;
}

export interface ScrapingResult {
  url: string;
  content: string;
  statusCode: number;
  headers: Record<string, string>;
  timestamp: Date;
  processingTime: number;
  error?: string;
}

export interface RobotsTxtRules {
  allowed: string[];
  disallowed: string[];
  crawlDelay: number;
  sitemaps: string[];
}

export class WebScrapingUtils {
  private config: ScrapingConfig;
  private robotsCache = new Map<string, RobotsTxtRules>();
  private requestQueue: Array<{ url: string; resolve: Function; reject: Function }> = [];
  private isProcessingQueue = false;

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      userAgent: 'Mozilla/5.0 (compatible; DataExpansionBot/1.0; +https://example.com/bot)',
      rateLimit: 2000, // 2 seconds between requests
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      respectRobotsTxt: true,
      enableJavaScript: false,
      ...config
    };
  }

  /**
   * Scrape a single URL with intelligent error handling
   */
  async scrapeUrl(url: string): Promise<ScrapingResult> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        const result = await this.performScrape(request.url);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
      
      // Rate limiting
      if (this.requestQueue.length > 0) {
        await this.delay(this.config.rateLimit);
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Perform actual scraping with retries
   */
  private async performScrape(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    // Check robots.txt if enabled
    if (this.config.respectRobotsTxt) {
      const isAllowed = await this.checkRobotsTxt(url);
      if (!isAllowed) {
        throw new Error(`Scraping not allowed by robots.txt: ${url}`);
      }
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔍 Scraping ${url} (attempt ${attempt}/${this.config.maxRetries})`);
        
        const response = await this.fetchWithTimeout(url);
        const content = await response.text();
        
        const result: ScrapingResult = {
          url,
          content,
          statusCode: response.status,
          headers: this.responseHeadersToObject(response.headers),
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        };
        
        console.log(`✅ Successfully scraped ${url} (${content.length} chars)`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Scraping attempt ${attempt} failed for ${url}:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          await this.delay(1000 * Math.pow(2, attempt));
        }
      }
    }
    
    throw lastError || new Error(`Failed to scrape ${url} after ${this.config.maxRetries} attempts`);
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check robots.txt permissions
   */
  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      // Check cache first
      if (this.robotsCache.has(baseUrl)) {
        const rules = this.robotsCache.get(baseUrl)!;
        return this.isUrlAllowed(url, rules);
      }
      
      // Fetch robots.txt
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await this.fetchWithTimeout(robotsUrl);
      
      if (response.status === 404) {
        // No robots.txt means everything is allowed
        const rules: RobotsTxtRules = {
          allowed: ['*'],
          disallowed: [],
          crawlDelay: 0,
          sitemaps: []
        };
        this.robotsCache.set(baseUrl, rules);
        return true;
      }
      
      const robotsContent = await response.text();
      const rules = this.parseRobotsTxt(robotsContent);
      this.robotsCache.set(baseUrl, rules);
      
      return this.isUrlAllowed(url, rules);
      
    } catch (error) {
      console.warn(`Could not check robots.txt for ${url}:`, error);
      return true; // Allow by default if robots.txt check fails
    }
  }

  /**
   * Parse robots.txt content
   */
  private parseRobotsTxt(content: string): RobotsTxtRules {
    const rules: RobotsTxtRules = {
      allowed: [],
      disallowed: [],
      crawlDelay: 0,
      sitemaps: []
    };
    
    const lines = content.split('\n');
    let currentUserAgent = '';
    let isRelevantSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const [directive, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();
      
      switch (directive.toLowerCase()) {
        case 'user-agent':
          currentUserAgent = value;
          isRelevantSection = value === '*' || value.toLowerCase().includes('bot');
          break;
          
        case 'disallow':
          if (isRelevantSection) {
            rules.disallowed.push(value);
          }
          break;
          
        case 'allow':
          if (isRelevantSection) {
            rules.allowed.push(value);
          }
          break;
          
        case 'crawl-delay':
          if (isRelevantSection) {
            rules.crawlDelay = parseInt(value) || 0;
          }
          break;
          
        case 'sitemap':
          rules.sitemaps.push(value);
          break;
      }
    }
    
    return rules;
  }

  /**
   * Check if URL is allowed by robots.txt rules
   */
  private isUrlAllowed(url: string, rules: RobotsTxtRules): boolean {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Check explicit allows first
    for (const allowedPath of rules.allowed) {
      if (allowedPath === '*' || path.startsWith(allowedPath)) {
        return true;
      }
    }
    
    // Check disallows
    for (const disallowedPath of rules.disallowed) {
      if (disallowedPath === '*' || path.startsWith(disallowedPath)) {
        return false;
      }
    }
    
    return true; // Allow by default
  }

  /**
   * Extract structured data from HTML
   */
  extractStructuredData(html: string): any[] {
    const structuredData: any[] = [];
    
    // Extract JSON-LD
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          const data = JSON.parse(jsonContent);
          structuredData.push({ type: 'json-ld', data });
        } catch (error) {
          console.warn('Failed to parse JSON-LD:', error);
        }
      }
    }
    
    // Extract microdata (simplified)
    const microdataMatches = html.match(/itemscope[^>]*itemtype=["']([^"']+)["'][^>]*>/gi);
    if (microdataMatches) {
      for (const match of microdataMatches) {
        const typeMatch = match.match(/itemtype=["']([^"']+)["']/i);
        if (typeMatch) {
          structuredData.push({ type: 'microdata', itemType: typeMatch[1] });
        }
      }
    }
    
    return structuredData;
  }

  /**
   * Extract all links from HTML
   */
  extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
    
    if (linkMatches) {
      for (const match of linkMatches) {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          try {
            const url = new URL(hrefMatch[1], baseUrl);
            links.push(url.href);
          } catch (error) {
            // Invalid URL, skip
          }
        }
      }
    }
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Extract text content from HTML elements
   */
  extractTextContent(html: string, selector: string): string[] {
    // Simple regex-based extraction (in production, use a proper HTML parser)
    const results: string[] = [];
    
    // Handle common selectors
    if (selector.startsWith('.')) {
      // Class selector
      const className = selector.substring(1);
      const regex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)<\/[^>]+>`, 'gis');
      const matches = html.match(regex);
      if (matches) {
        matches.forEach(match => {
          const textContent = match.replace(/<[^>]+>/g, '').trim();
          if (textContent) results.push(textContent);
        });
      }
    } else if (selector.startsWith('#')) {
      // ID selector
      const id = selector.substring(1);
      const regex = new RegExp(`<[^>]*id=["']${id}["'][^>]*>(.*?)<\/[^>]+>`, 'gis');
      const matches = html.match(regex);
      if (matches) {
        matches.forEach(match => {
          const textContent = match.replace(/<[^>]+>/g, '').trim();
          if (textContent) results.push(textContent);
        });
      }
    } else {
      // Tag selector
      const regex = new RegExp(`<${selector}[^>]*>(.*?)<\/${selector}>`, 'gis');
      const matches = html.match(regex);
      if (matches) {
        matches.forEach(match => {
          const textContent = match.replace(/<[^>]+>/g, '').trim();
          if (textContent) results.push(textContent);
        });
      }
    }
    
    return results;
  }

  /**
   * Discover regional website variations
   */
  async discoverRegionalSites(baseUrl: string): Promise<string[]> {
    const regionalSites: string[] = [];
    
    try {
      const urlObj = new URL(baseUrl);
      const baseDomain = urlObj.hostname.replace(/^www\./, '');
      
      // Common regional domain patterns
      const regionalPatterns = [
        // Country-specific TLDs
        '.co.uk', '.de', '.fr', '.it', '.es', '.nl', '.be', '.ch', '.at',
        '.ca', '.au', '.nz', '.jp', '.cn', '.kr', '.sg', '.hk', '.tw',
        '.br', '.mx', '.ar', '.cl', '.co', '.pe',
        '.in', '.ae', '.sa', '.za', '.eg', '.ma',
        '.ru', '.pl', '.cz', '.hu', '.ro', '.bg',
        '.se', '.no', '.dk', '.fi',
        
        // Subdomain patterns
        'uk.', 'de.', 'fr.', 'it.', 'es.', 'nl.', 'be.', 'ch.', 'at.',
        'ca.', 'au.', 'nz.', 'jp.', 'cn.', 'kr.', 'sg.', 'hk.', 'tw.',
        'br.', 'mx.', 'ar.', 'cl.', 'co.', 'pe.',
        'in.', 'ae.', 'sa.', 'za.', 'eg.', 'ma.',
        'ru.', 'pl.', 'cz.', 'hu.', 'ro.', 'bg.',
        'se.', 'no.', 'dk.', 'fi.'
      ];
      
      for (const pattern of regionalPatterns) {
        let candidateUrl: string;
        
        if (pattern.startsWith('.')) {
          // TLD pattern
          candidateUrl = `https://${baseDomain}${pattern}`;
        } else {
          // Subdomain pattern
          candidateUrl = `https://${pattern}${baseDomain}`;
        }
        
        try {
          // Quick check if the site exists
          const response = await fetch(candidateUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            regionalSites.push(candidateUrl);
            console.log(`✅ Found regional site: ${candidateUrl}`);
          }
        } catch (error) {
          // Site doesn't exist or is unreachable, continue
        }
      }
      
    } catch (error) {
      console.error('Error discovering regional sites:', error);
    }
    
    return regionalSites;
  }

  /**
   * Utility methods
   */
  private responseHeadersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean and normalize text content
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ') // Replace newlines with space
      .trim();
  }

  /**
   * Extract email addresses from text
   */
  extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text
   */
  extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const matches = text.match(phoneRegex) || [];
    return matches.map(match => match.trim());
  }

  /**
   * Extract addresses from text (simplified)
   */
  extractAddresses(text: string): string[] {
    const addresses: string[] = [];
    
    // Look for patterns like "123 Main St, City, State ZIP"
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/g;
    const matches = text.match(addressRegex);
    
    if (matches) {
      addresses.push(...matches.map(match => match.trim()));
    }
    
    return addresses;
  }
}