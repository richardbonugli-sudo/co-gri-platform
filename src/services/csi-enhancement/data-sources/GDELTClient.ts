/**
 * GDELT Data Source Client
 * Integrates with GDELT Project API for global event data
 */

import { BaseDataSourceClient, type FetchOptions } from './BaseDataSourceClient';
import type { RawSignal, DataSourceConfig } from '@/types/csi-enhancement/signals';

interface GDELTEvent {
  url: string;
  urlmobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GDELTResponse {
  articles: GDELTEvent[];
}

export class GDELTClient extends BaseDataSourceClient {
  private apiEndpoint: string;

  constructor(config: DataSourceConfig) {
    super(config);
    this.apiEndpoint = config.apiEndpoint;
  }

  /**
   * Fetch latest signals from GDELT
   */
  async fetchLatest(options?: FetchOptions): Promise<RawSignal[]> {
    return this.fetchWithRetry(async () => {
      const limit = options?.limit || 250;
      const query = this.buildQuery(options);
      
      const url = `${this.apiEndpoint}?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&format=json`;
      
      console.log(`[GDELT] Fetching latest signals: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status} ${response.statusText}`);
      }
      
      const data: GDELTResponse = await response.json();
      
      return this.transformToRawSignals(data.articles || []);
    });
  }

  /**
   * Fetch signals by time range
   */
  async fetchByTimeRange(start: Date, end: Date, options?: FetchOptions): Promise<RawSignal[]> {
    return this.fetchWithRetry(async () => {
      const query = this.buildQuery(options);
      const startDate = this.formatDate(start);
      const endDate = this.formatDate(end);
      
      const url = `${this.apiEndpoint}?query=${encodeURIComponent(query)}&mode=artlist&startdatetime=${startDate}&enddatetime=${endDate}&format=json`;
      
      console.log(`[GDELT] Fetching time range: ${startDate} to ${endDate}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status}`);
      }
      
      const data: GDELTResponse = await response.json();
      
      return this.transformToRawSignals(data.articles || []);
    });
  }

  /**
   * Fetch signals by country
   */
  async fetchByCountry(countryCode: string, options?: FetchOptions): Promise<RawSignal[]> {
    const countryQuery = `sourcecountry:${countryCode}`;
    const baseQuery = this.buildQuery(options);
    const combinedQuery = baseQuery ? `${baseQuery} ${countryQuery}` : countryQuery;
    
    return this.fetchLatest({
      ...options,
      countries: [countryCode]
    });
  }

  /**
   * Search signals by query
   */
  async search(query: string, options?: FetchOptions): Promise<RawSignal[]> {
    return this.fetchWithRetry(async () => {
      const limit = options?.limit || 250;
      const url = `${this.apiEndpoint}?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&format=json`;
      
      console.log(`[GDELT] Searching: ${query}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status}`);
      }
      
      const data: GDELTResponse = await response.json();
      
      return this.transformToRawSignals(data.articles || []);
    });
  }

  /**
   * Build GDELT query from options
   */
  private buildQuery(options?: FetchOptions): string {
    const queryParts: string[] = [];
    
    // Geopolitical keywords
    const geopoliticalTerms = [
      'sanctions',
      'tariff',
      'trade war',
      'military',
      'conflict',
      'diplomatic',
      'embargo',
      'nationalization',
      'capital controls',
      'cyberattack',
      'protest',
      'coup',
      'election'
    ];
    
    queryParts.push(`(${geopoliticalTerms.join(' OR ')})`);
    
    // Add country filter if specified
    if (options?.countries && options.countries.length > 0) {
      const countryFilter = options.countries.map(c => `sourcecountry:${c}`).join(' OR ');
      queryParts.push(`(${countryFilter})`);
    }
    
    // Add language filter
    if (options?.language) {
      queryParts.push(`sourcelang:${options.language}`);
    } else {
      queryParts.push('sourcelang:eng'); // Default to English
    }
    
    return queryParts.join(' ');
  }

  /**
   * Transform GDELT events to raw signals
   */
  private transformToRawSignals(events: GDELTEvent[]): RawSignal[] {
    return events.map(event => ({
      sourceId: this.config.sourceId,
      rawContent: JSON.stringify(event),
      timestamp: this.parseGDELTDate(event.seendate),
      url: event.url,
      metadata: {
        title: event.title,
        domain: event.domain,
        language: event.language,
        sourceCountry: event.sourcecountry,
        socialImage: event.socialimage
      }
    }));
  }

  /**
   * Parse GDELT date format (YYYYMMDDHHmmss)
   */
  private parseGDELTDate(dateStr: string): Date {
    if (!dateStr || dateStr.length < 14) {
      return new Date();
    }
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(8, 10));
    const minute = parseInt(dateStr.substring(10, 12));
    const second = parseInt(dateStr.substring(12, 14));
    
    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Format date for GDELT API (YYYYMMDDHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }
}