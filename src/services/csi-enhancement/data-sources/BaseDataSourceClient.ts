/**
 * Base Data Source Client
 * Abstract class for all data source integrations
 */

import type { RawSignal, DataSourceConfig, DataSourceHealth } from '@/types/csi-enhancement/signals';

export interface FetchOptions {
  limit?: number;
  offset?: number;
  countries?: string[];
  topics?: string[];
  urgency?: string[];
  language?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export abstract class BaseDataSourceClient {
  protected config: DataSourceConfig;
  protected retryPolicy: RetryPolicy;
  protected rateLimiter: RateLimiter;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.retryPolicy = {
      maxRetries: config.retryPolicy.maxRetries,
      backoffMultiplier: config.retryPolicy.backoffMultiplier,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'SERVICE_UNAVAILABLE', 'NETWORK_ERROR'],
      nonRetryableErrors: ['AUTHENTICATION_FAILED', 'INVALID_REQUEST', 'FORBIDDEN']
    };
    this.rateLimiter = new RateLimiter(
      config.rateLimit.requestsPerMinute,
      config.rateLimit.requestsPerDay
    );
  }

  /**
   * Fetch latest signals from source
   */
  abstract fetchLatest(options?: FetchOptions): Promise<RawSignal[]>;

  /**
   * Fetch signals by time range
   */
  abstract fetchByTimeRange(start: Date, end: Date, options?: FetchOptions): Promise<RawSignal[]>;

  /**
   * Fetch signals by country
   */
  abstract fetchByCountry(countryCode: string, options?: FetchOptions): Promise<RawSignal[]>;

  /**
   * Search signals by query
   */
  abstract search(query: string, options?: FetchOptions): Promise<RawSignal[]>;

  /**
   * Check API health
   */
  async healthCheck(): Promise<DataSourceHealth> {
    const startTime = Date.now();
    
    try {
      await this.fetchLatest({ limit: 1 });
      const latency = Date.now() - startTime;
      
      return {
        sourceId: this.config.sourceId,
        isHealthy: true,
        latency,
        lastSuccessfulFetch: new Date(),
        errorCount: 0,
        rateLimitStatus: await this.rateLimiter.getStatus()
      };
    } catch (error) {
      return {
        sourceId: this.config.sourceId,
        isHealthy: false,
        latency: Date.now() - startTime,
        lastSuccessfulFetch: new Date(0),
        errorCount: 1,
        rateLimitStatus: await this.rateLimiter.getStatus()
      };
    }
  }

  /**
   * Fetch with retry logic
   */
  protected async fetchWithRetry<T>(
    fetchFn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
      try {
        // Check rate limit
        await this.rateLimiter.waitForAvailability();
        
        // Execute fetch
        const result = await fetchFn();
        
        // Record success
        this.rateLimiter.recordRequest();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryable(error as Error)) {
          throw error;
        }
        
        // If not last attempt, wait and retry
        if (attempt < this.retryPolicy.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          console.log(`[${this.config.sourceId}] Retry attempt ${attempt + 1}/${this.retryPolicy.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Check if error is retryable
   */
  protected isRetryable(error: Error): boolean {
    return this.retryPolicy.retryableErrors.some(retryableError =>
      error.message.includes(retryableError) || error.name === retryableError
    );
  }

  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoff(attempt: number): number {
    const delay = this.retryPolicy.initialDelayMs * Math.pow(this.retryPolicy.backoffMultiplier, attempt);
    return Math.min(delay, this.retryPolicy.maxDelayMs);
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get source configuration
   */
  getConfig(): DataSourceConfig {
    return this.config;
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }
}

/**
 * Rate Limiter
 */
class RateLimiter {
  private requestsPerMinute: number;
  private requestsPerDay: number;
  private minuteRequests: number[] = [];
  private dailyRequests: number = 0;
  private lastDayReset: Date = new Date();

  constructor(requestsPerMinute: number, requestsPerDay: number) {
    this.requestsPerMinute = requestsPerMinute;
    this.requestsPerDay = requestsPerDay;
  }

  async waitForAvailability(): Promise<void> {
    const now = new Date();
    
    // Reset daily counter if needed
    if (now.getDate() !== this.lastDayReset.getDate()) {
      this.dailyRequests = 0;
      this.lastDayReset = now;
    }

    // Check daily limit
    if (this.dailyRequests >= this.requestsPerDay) {
      throw new Error('RATE_LIMIT_EXCEEDED: Daily rate limit exceeded');
    }

    // Clean old minute requests
    const oneMinuteAgo = now.getTime() - 60 * 1000;
    this.minuteRequests = this.minuteRequests.filter(time => time > oneMinuteAgo);

    // Check minute limit
    if (this.minuteRequests.length >= this.requestsPerMinute) {
      const waitTime = this.minuteRequests[0] + 60 * 1000 - now.getTime();
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  recordRequest(): void {
    const now = new Date();
    this.minuteRequests.push(now.getTime());
    this.dailyRequests++;
  }

  async getStatus() {
    const now = new Date();
    const oneMinuteAgo = now.getTime() - 60 * 1000;
    const recentRequests = this.minuteRequests.filter(time => time > oneMinuteAgo).length;
    
    return {
      remaining: Math.min(
        this.requestsPerMinute - recentRequests,
        this.requestsPerDay - this.dailyRequests
      ),
      limit: this.requestsPerMinute,
      resetAt: new Date(now.getTime() + 60 * 1000)
    };
  }
}