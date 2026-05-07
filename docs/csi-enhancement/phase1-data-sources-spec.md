# Phase 1 Data Sources Specification
## High-Frequency Data Source Requirements

**Version**: 1.0  
**Date**: 2026-01-26  
**Status**: Draft  
**Owner**: Data Engineering Team  

---

## 1. Overview

This document specifies the high-frequency data sources required for Phase 1 of the CSI enhancement project. It provides detailed requirements for each source type, including API specifications, data formats, licensing considerations, and integration priorities.

---

## 2. Data Source Categories

### 2.1 Tier 1 - Critical (Must Have for Phase 1)

#### 2.1.1 Reuters News API

**Purpose**: Primary real-time news wire for geopolitical events

**Coverage**:
- Global coverage (195+ countries)
- 24/7 real-time updates
- Multiple languages (English, Spanish, French, German, Chinese, Arabic)

**Technical Specifications**:
```typescript
interface ReutersAPIConfig {
  endpoint: 'https://api.reuters.com/v2/news';
  authentication: 'OAuth 2.0';
  rateLimit: {
    requestsPerMinute: 100;
    requestsPerDay: 10000;
  };
  latency: '<30 seconds from event';
  dataFormat: 'JSON';
}

interface ReutersArticle {
  id: string;
  headline: string;
  body: string;
  publishedAt: Date;
  updatedAt: Date;
  countries: string[]; // ISO codes
  topics: string[];
  urgency: 1 | 2 | 3; // 1=flash, 2=urgent, 3=normal
  language: string;
  source: 'Reuters' | 'Reuters Partner';
  url: string;
  metadata: {
    wordCount: number;
    hasVideo: boolean;
    hasImage: boolean;
  };
}
```

**Filtering Criteria**:
- Topics: Politics, Economics, Trade, Military, Diplomacy
- Urgency: 1 (flash) and 2 (urgent) only
- Countries: All
- Language: English (primary), expand later

**Cost Estimate**: $30,000-50,000/year

**Licensing Requirements**:
- Commercial use license
- Data redistribution: Internal only
- Attribution: Required in outputs
- Geographic restrictions: None

**Integration Priority**: **HIGH** - Week 1-2

---

#### 2.1.2 Bloomberg Terminal API

**Purpose**: Financial news and market-moving events

**Coverage**:
- Global financial markets
- Real-time breaking news
- Government policy announcements
- Corporate actions

**Technical Specifications**:
```typescript
interface BloombergAPIConfig {
  endpoint: 'bloomberg-api://news';
  authentication: 'Bloomberg Terminal Credentials';
  rateLimit: {
    requestsPerMinute: 200;
    requestsPerDay: 20000;
  };
  latency: '<1 minute from event';
  dataFormat: 'Bloomberg Proprietary';
}

interface BloombergStory {
  storyId: string;
  headline: string;
  summary: string;
  fullText: string;
  publishedAt: Date;
  tickers: string[]; // Affected securities
  countries: string[];
  categories: string[];
  urgency: 'BREAKING' | 'URGENT' | 'NORMAL';
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  url: string;
}
```

**Filtering Criteria**:
- Categories: Government, Economics, Trade, Geopolitics
- Urgency: BREAKING and URGENT only
- Sentiment: All (for context)

**Cost Estimate**: Included in existing Bloomberg Terminal license (verify terms)

**Licensing Requirements**:
- Verify existing license covers API access
- Data redistribution: Likely restricted
- Attribution: Required
- Usage caps: Check contract

**Integration Priority**: **HIGH** - Week 1-2

---

#### 2.1.3 GDELT Project

**Purpose**: Global event database with 15-minute updates

**Coverage**:
- 195+ countries
- 100+ languages
- News, social media, government sources
- Event coding (CAMEO taxonomy)

**Technical Specifications**:
```typescript
interface GDELTAPIConfig {
  endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc';
  authentication: 'None (Public API)';
  rateLimit: {
    requestsPerMinute: 60;
    requestsPerDay: 'Unlimited';
  };
  latency: '15 minutes';
  dataFormat: 'JSON / CSV';
}

interface GDELTEvent {
  globalEventId: string;
  eventDate: Date;
  actor1: {
    code: string;
    name: string;
    countryCode: string;
    type: string;
  };
  actor2: {
    code: string;
    name: string;
    countryCode: string;
    type: string;
  };
  eventCode: string; // CAMEO code
  eventBaseCode: string;
  eventRootCode: string;
  quadClass: 1 | 2 | 3 | 4; // Verbal cooperation, Material cooperation, Verbal conflict, Material conflict
  goldsteinScale: number; // -10 to +10
  numMentions: number;
  numSources: number;
  numArticles: number;
  avgTone: number; // -100 to +100
  countries: string[];
  url: string;
}
```

**Filtering Criteria**:
- QuadClass: 3 (Verbal conflict) and 4 (Material conflict)
- GoldsteinScale: <-2.0 (negative events)
- NumSources: ≥2 (corroborated)
- EventRootCode: Focus on sanctions, trade, military, political

**Cost Estimate**: Free (academic/non-profit use), verify commercial terms

**Licensing Requirements**:
- Open data (verify commercial use)
- Attribution: Required
- Data redistribution: Allowed with attribution

**Integration Priority**: **HIGH** - Week 1-2

---

### 2.2 Tier 2 - Important (Should Have for Phase 1)

#### 2.2.1 Associated Press (AP) News API

**Purpose**: Complementary news wire for corroboration

**Coverage**:
- Global coverage
- Real-time updates
- High credibility

**Technical Specifications**:
```typescript
interface APAPIConfig {
  endpoint: 'https://api.ap.org/v2/content';
  authentication: 'API Key';
  rateLimit: {
    requestsPerMinute: 50;
    requestsPerDay: 5000;
  };
  latency: '<1 minute from event';
  dataFormat: 'JSON';
}

interface APArticle {
  id: string;
  headline: string;
  body: string;
  publishedAt: Date;
  updatedAt: Date;
  locations: {
    name: string;
    countryCode: string;
    type: 'COUNTRY' | 'CITY' | 'REGION';
  }[];
  topics: string[];
  urgency: 'FLASH' | 'URGENT' | 'ADVISORY' | 'REGULAR';
  language: string;
  url: string;
}
```

**Cost Estimate**: $20,000-30,000/year

**Integration Priority**: **MEDIUM** - Week 3-4

---

#### 2.2.2 Financial Times API

**Purpose**: Business and geopolitical analysis

**Coverage**:
- Global business news
- Policy analysis
- Trade and economics

**Technical Specifications**:
```typescript
interface FTAPIConfig {
  endpoint: 'https://api.ft.com/content/search/v1';
  authentication: 'API Key';
  rateLimit: {
    requestsPerMinute: 30;
    requestsPerDay: 3000;
  };
  latency: 'Hourly updates';
  dataFormat: 'JSON';
}

interface FTArticle {
  id: string;
  title: string;
  summary: string;
  bodyXML: string;
  publishedDate: Date;
  locations: string[];
  topics: string[];
  isPremium: boolean;
  url: string;
}
```

**Cost Estimate**: $15,000-25,000/year

**Integration Priority**: **MEDIUM** - Week 3-4

---

#### 2.2.3 ACLED (Armed Conflict Location & Event Data)

**Purpose**: Conflict and political violence tracking

**Coverage**:
- 195+ countries
- Real-time conflict events
- Protest and riot data

**Technical Specifications**:
```typescript
interface ACLEDAPIConfig {
  endpoint: 'https://api.acleddata.com/acled/read';
  authentication: 'API Key (Free Academic)';
  rateLimit: {
    requestsPerMinute: 10;
    requestsPerDay: 1000;
  };
  latency: 'Daily updates';
  dataFormat: 'JSON';
}

interface ACLEDEvent {
  eventId: string;
  eventDate: Date;
  eventType: string;
  subEventType: string;
  country: string;
  region: string;
  location: string;
  latitude: number;
  longitude: number;
  actor1: string;
  actor2: string;
  fatalities: number;
  notes: string;
  source: string;
  sourceScale: string;
}
```

**Cost Estimate**: Free (academic), $5,000-10,000/year (commercial)

**Integration Priority**: **MEDIUM** - Week 3-4

---

### 2.3 Tier 3 - Nice to Have (Phase 2+)

#### 2.3.1 Jane's Defense & Security

**Purpose**: Military intelligence and defense analysis

**Coverage**: Global military activities, defense policy

**Cost Estimate**: $50,000-100,000/year

**Integration Priority**: **LOW** - Phase 2

---

#### 2.3.2 Recorded Future

**Purpose**: OSINT aggregation and threat intelligence

**Coverage**: Cyber threats, geopolitical risks

**Cost Estimate**: $30,000-60,000/year

**Integration Priority**: **LOW** - Phase 2

---

#### 2.3.3 FireEye / Mandiant

**Purpose**: Cyber incident tracking

**Coverage**: Global cyber attacks, state-sponsored threats

**Cost Estimate**: $40,000-80,000/year

**Integration Priority**: **LOW** - Phase 2

---

## 3. Data Source Credibility Weights

### 3.1 Credibility Scoring

```typescript
const SOURCE_CREDIBILITY: Record<string, number> = {
  // Tier 1 - Highest Credibility (0.9-1.0)
  'reuters': 0.95,
  'bloomberg': 0.95,
  'ap': 0.95,
  'ft': 0.90,
  
  // Tier 2 - High Credibility (0.8-0.89)
  'gdelt': 0.85, // Aggregator, so slightly lower
  'acled': 0.85,
  'wsj': 0.85,
  'economist': 0.85,
  
  // Tier 3 - Medium Credibility (0.7-0.79)
  'local_news': 0.75,
  'regional_news': 0.75,
  'industry_publications': 0.75,
  
  // Tier 4 - Lower Credibility (0.6-0.69)
  'social_media': 0.60,
  'blogs': 0.60,
  'unverified_sources': 0.60
};
```

### 3.2 Credibility Adjustment Rules

```typescript
interface CredibilityAdjustment {
  /**
   * Boost credibility if source is first to report
   */
  firstReporter: +0.05;
  
  /**
   * Boost if source has exclusive access
   */
  exclusiveAccess: +0.05;
  
  /**
   * Reduce if source has history of retractions
   */
  retractionHistory: -0.10;
  
  /**
   * Reduce if source is known for sensationalism
   */
  sensationalism: -0.05;
  
  /**
   * Boost if source cites official documents
   */
  officialDocuments: +0.05;
}
```

---

## 4. Data Quality Requirements

### 4.1 Minimum Quality Standards

| Attribute | Requirement | Validation Method |
|-----------|-------------|-------------------|
| **Country Attribution** | >90% accuracy | Manual review (n=100) |
| **Timestamp Accuracy** | ±5 minutes | Compare with source |
| **Duplicate Rate** | <5% | Deduplication check |
| **Missing Fields** | <2% | Schema validation |
| **Language Detection** | >95% accuracy | Language model |
| **Entity Extraction** | >85% accuracy | NER validation |

### 4.2 Data Validation Pipeline

```typescript
interface DataValidator {
  /**
   * Validate required fields
   */
  validateSchema(signal: RawSignal): ValidationResult;
  
  /**
   * Validate country codes
   */
  validateCountryCodes(countries: string[]): ValidationResult;
  
  /**
   * Validate timestamp
   */
  validateTimestamp(timestamp: Date): ValidationResult;
  
  /**
   * Detect duplicates
   */
  detectDuplicate(signal: RawSignal): DuplicateCheckResult;
  
  /**
   * Validate content quality
   */
  validateContentQuality(content: string): QualityScore;
}
```

---

## 5. API Integration Specifications

### 5.1 Standard API Client Interface

```typescript
interface DataSourceClient {
  /**
   * Fetch latest signals from source
   */
  fetchLatest(options: FetchOptions): Promise<RawSignal[]>;
  
  /**
   * Fetch signals by time range
   */
  fetchByTimeRange(start: Date, end: Date): Promise<RawSignal[]>;
  
  /**
   * Fetch signals by country
   */
  fetchByCountry(countryCode: string): Promise<RawSignal[]>;
  
  /**
   * Search signals by query
   */
  search(query: string): Promise<RawSignal[]>;
  
  /**
   * Check API health
   */
  healthCheck(): Promise<HealthStatus>;
  
  /**
   * Get rate limit status
   */
  getRateLimitStatus(): Promise<RateLimitStatus>;
}

interface FetchOptions {
  limit?: number;
  offset?: number;
  countries?: string[];
  topics?: string[];
  urgency?: string[];
  language?: string;
}

interface HealthStatus {
  isHealthy: boolean;
  latency: number;
  lastSuccessfulFetch: Date;
  errorCount: number;
}

interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: Date;
}
```

### 5.2 Error Handling & Retry Logic

```typescript
interface RetryPolicy {
  maxRetries: 3;
  backoffMultiplier: 2;
  initialDelayMs: 1000;
  maxDelayMs: 30000;
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'NETWORK_ERROR'
  ];
  nonRetryableErrors: [
    'AUTHENTICATION_FAILED',
    'INVALID_REQUEST',
    'FORBIDDEN'
  ];
}

class APIClient {
  async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    retryPolicy: RetryPolicy
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error, retryPolicy)) {
          throw error;
        }
        
        if (attempt < retryPolicy.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryPolicy);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  private isRetryable(error: Error, policy: RetryPolicy): boolean {
    return policy.retryableErrors.includes(error.name);
  }
  
  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
    return Math.min(delay, policy.maxDelayMs);
  }
}
```

---

## 6. Data Ingestion Schedule

### 6.1 Ingestion Frequency

| Source | Frequency | Batch Size | Processing Time |
|--------|-----------|------------|-----------------|
| Reuters | Real-time (webhook) | N/A | <1 min |
| Bloomberg | Real-time (streaming) | N/A | <1 min |
| GDELT | Every 15 minutes | 100-500 events | 2-5 min |
| AP | Real-time (webhook) | N/A | <1 min |
| FT | Every 1 hour | 50-100 articles | 2-3 min |
| ACLED | Every 24 hours | 500-1000 events | 5-10 min |

### 6.2 Ingestion Pipeline

```typescript
class IngestionScheduler {
  /**
   * Schedule real-time sources (webhooks)
   */
  scheduleRealtime(sources: string[]): void {
    sources.forEach(source => {
      this.webhookServer.register(source, async (payload) => {
        await this.processSignal(source, payload);
      });
    });
  }
  
  /**
   * Schedule polling sources (cron)
   */
  schedulePolling(source: string, intervalMinutes: number): void {
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
      await this.pollSource(source);
    });
  }
  
  /**
   * Process incoming signal
   */
  private async processSignal(source: string, payload: any): Promise<void> {
    try {
      const rawSignal = await this.parser.parse(source, payload);
      const structuredSignal = await this.enricher.enrich(rawSignal);
      await this.validator.validate(structuredSignal);
      await this.storage.save(structuredSignal);
      
      this.metrics.recordSuccess(source);
    } catch (error) {
      this.metrics.recordError(source, error);
      this.logger.error(`Failed to process signal from ${source}`, error);
    }
  }
}
```

---

## 7. Cost Analysis

### 7.1 Phase 1 Data Source Costs

| Source | Annual Cost | Setup Cost | Total Year 1 |
|--------|-------------|------------|--------------|
| Reuters News API | $40,000 | $5,000 | $45,000 |
| Bloomberg Terminal API | $0 (existing) | $2,000 | $2,000 |
| GDELT Project | $0 (free) | $1,000 | $1,000 |
| AP News API | $25,000 | $3,000 | $28,000 |
| Financial Times API | $20,000 | $2,000 | $22,000 |
| ACLED | $7,500 | $1,000 | $8,500 |
| **Total** | **$92,500** | **$14,000** | **$106,500** |

### 7.2 Infrastructure Costs

| Component | Monthly Cost | Annual Cost |
|-----------|--------------|-------------|
| Database (PostgreSQL) | $500 | $6,000 |
| Storage (S3) | $200 | $2,400 |
| Compute (EC2) | $800 | $9,600 |
| Monitoring (DataDog) | $300 | $3,600 |
| CDN (CloudFront) | $100 | $1,200 |
| **Total** | **$1,900** | **$22,800** |

### 7.3 Total Phase 1 Budget

| Category | Year 1 Cost |
|----------|-------------|
| Data Sources | $106,500 |
| Infrastructure | $22,800 |
| Engineering (3 FTE × 3 months) | $225,000 |
| **Total** | **$354,300** |

---

## 8. Implementation Timeline

### 8.1 Data Source Onboarding Schedule

**Week 1-2: Tier 1 Sources**
- [ ] Day 1-2: Reuters licensing and setup
- [ ] Day 3-4: Bloomberg API configuration
- [ ] Day 5-7: GDELT integration
- [ ] Day 8-10: Initial testing and validation

**Week 3-4: Tier 2 Sources**
- [ ] Day 11-13: AP licensing and setup
- [ ] Day 14-16: FT API configuration
- [ ] Day 17-19: ACLED integration
- [ ] Day 20-21: Comprehensive testing

**Week 5-6: Integration & Optimization**
- [ ] Day 22-24: Performance tuning
- [ ] Day 25-27: Error handling improvements
- [ ] Day 28-30: Documentation

---

## 9. Monitoring & Alerting

### 9.1 Data Source Health Metrics

```typescript
interface SourceHealthMetrics {
  sourceId: string;
  
  // Availability
  uptime: number; // %
  lastSuccessfulFetch: Date;
  consecutiveFailures: number;
  
  // Performance
  avgLatency: number; // ms
  p95Latency: number; // ms
  p99Latency: number; // ms
  
  // Volume
  signalsPerHour: number;
  signalsPerDay: number;
  
  // Quality
  validationPassRate: number; // %
  duplicateRate: number; // %
  missingFieldRate: number; // %
  
  // Rate Limiting
  rateLimitRemaining: number;
  rateLimitResetAt: Date;
  rateLimitViolations: number;
}
```

### 9.2 Alert Conditions

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Source Down | consecutiveFailures > 3 | Critical | Page on-call engineer |
| High Latency | p95Latency > 5000ms | Warning | Investigate performance |
| Low Volume | signalsPerHour < 10 | Warning | Check source status |
| High Duplicate Rate | duplicateRate > 10% | Info | Review deduplication |
| Rate Limit Approaching | rateLimitRemaining < 100 | Warning | Throttle requests |
| Validation Failures | validationPassRate < 90% | Warning | Review parser logic |

---

## 10. Security & Compliance

### 10.1 API Key Management

```typescript
interface APIKeyConfig {
  keyId: string;
  sourceId: string;
  keyValue: string; // Encrypted
  createdAt: Date;
  expiresAt: Date;
  rotationSchedule: 'monthly' | 'quarterly' | 'annually';
  lastRotated: Date;
  permissions: string[];
}

class SecretManager {
  /**
   * Retrieve API key from secure vault
   */
  async getAPIKey(sourceId: string): Promise<string> {
    const encrypted = await this.vault.get(`api_keys/${sourceId}`);
    return this.decrypt(encrypted);
  }
  
  /**
   * Rotate API key
   */
  async rotateAPIKey(sourceId: string): Promise<void> {
    const newKey = await this.generateNewKey(sourceId);
    await this.vault.set(`api_keys/${sourceId}`, this.encrypt(newKey));
    await this.notifyRotation(sourceId);
  }
}
```

### 10.2 Data Privacy & Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Data Encryption** | AES-256 at rest, TLS 1.3 in transit |
| **Access Control** | Role-based access (RBAC) |
| **Audit Logging** | All API calls logged with timestamp, user, action |
| **Data Retention** | 2 years active, 5 years archived |
| **GDPR Compliance** | PII detection and masking |
| **SOC 2 Type II** | Annual audit required |

---

## 11. Acceptance Criteria

### 11.1 Data Source Integration

- ✅ All Tier 1 sources (Reuters, Bloomberg, GDELT) actively ingesting
- ✅ At least 2 Tier 2 sources (AP, FT) actively ingesting
- ✅ >90% uptime for all sources
- ✅ <5 minute average latency from source to database
- ✅ >95% validation pass rate
- ✅ Zero rate limit violations

### 11.2 Data Quality

- ✅ >90% country attribution accuracy (n=100 manual review)
- ✅ <5% duplicate rate
- ✅ <2% missing required fields
- ✅ >95% language detection accuracy
- ✅ >85% entity extraction accuracy

### 11.3 Performance

- ✅ 1000+ signals ingested per day
- ✅ <100ms storage latency (p95)
- ✅ <50ms query latency (p95)
- ✅ >99.5% system uptime

---

## 12. Appendix

### 12.1 Country Code Mapping

```typescript
const ISO_3166_ALPHA2: Record<string, string> = {
  'US': 'United States',
  'CN': 'China',
  'RU': 'Russia',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'IN': 'India',
  'BR': 'Brazil',
  // ... 195 total countries
};
```

### 12.2 Risk Vector Mapping (SC1-SC7)

```typescript
const RISK_VECTORS: Record<string, string> = {
  'SC1': 'Sanctions & Trade Restrictions',
  'SC2': 'Capital Controls & FX Restrictions',
  'SC3': 'Nationalization & Expropriation',
  'SC4': 'Conflict & Security',
  'SC5': 'Political Instability',
  'SC6': 'Regulatory & Legal',
  'SC7': 'Cyber & Technology'
};
```

### 12.3 CAMEO Event Codes (GDELT)

```typescript
const CAMEO_CODES: Record<string, string> = {
  '14': 'Protest',
  '15': 'Exhibit force posture',
  '16': 'Reduce relations',
  '17': 'Coerce',
  '18': 'Assault',
  '19': 'Fight',
  '20': 'Use unconventional mass violence'
};
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-26  
**Next Review**: 2026-02-26  
**Contact**: data-engineering@company.com