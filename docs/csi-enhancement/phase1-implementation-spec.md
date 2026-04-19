# Phase 1 Implementation Specification
## CSI Enhancement - Foundation Layer

**Version**: 1.0  
**Date**: 2026-01-26  
**Status**: Draft - Awaiting Approval  
**Owner**: Engineering Team  
**Duration**: 3 months  

---

## 1. Phase 1 Overview

### 1.1 Goal
Build the foundational infrastructure for expectation-weighted CSI without impacting production CSI scores. This phase focuses on data ingestion, signal detection, and validation pipelines.

### 1.2 Success Criteria
- ✅ Ingesting 1000+ signals/day across 50+ countries
- ✅ <5% false positive rate on corroboration
- ✅ Zero impact on production CSI
- ✅ Internal monitoring dashboard operational
- ✅ Signal storage and retrieval <100ms latency

### 1.3 Non-Goals (Explicitly Out of Scope)
- ❌ No changes to user-facing CSI scores
- ❌ No UI/UX updates
- ❌ No baseline drift calculation (Phase 2)
- ❌ No event lifecycle state machine (Phase 3)

---

## 2. Architecture Overview

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 1 Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────┐                │
│  │ Data Sources │──────▶│ Signal Ingestion │                │
│  │  (External)  │      │     Pipeline      │                │
│  └──────────────┘      └─────────┬─────────┘                │
│                                   │                           │
│                                   ▼                           │
│                        ┌──────────────────┐                  │
│                        │ Persistence &    │                  │
│                        │ Corroboration    │                  │
│                        │     Filter       │                  │
│                        └─────────┬────────┘                  │
│                                  │                            │
│                                  ▼                            │
│                        ┌──────────────────┐                  │
│                        │  Signal Storage  │                  │
│                        │   (Database)     │                  │
│                        └─────────┬────────┘                  │
│                                  │                            │
│                                  ▼                            │
│                        ┌──────────────────┐                  │
│                        │   Internal       │                  │
│                        │   Monitoring     │                  │
│                        │   Dashboard      │                  │
│                        └──────────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Ingestion**: External feeds → Signal Ingestion Pipeline
2. **Parsing**: Raw data → Structured signals
3. **Enrichment**: Add metadata (country, vector, timestamp)
4. **Validation**: Corroboration & persistence checks
5. **Storage**: Qualified signals → Database
6. **Monitoring**: Real-time dashboard updates

---

## 3. Data Source Integration

### 3.1 Priority Data Sources (Phase 1)

#### Tier 1 - Critical (Must Have)
| Source | Type | Coverage | Update Frequency | Cost Estimate |
|--------|------|----------|------------------|---------------|
| **Reuters News API** | News Wire | Global | Real-time | $30-50K/year |
| **Bloomberg Terminal API** | Financial News | Global | Real-time | Existing license |
| **GDELT Project** | Event Database | Global | 15-min | Free |

#### Tier 2 - Important (Should Have)
| Source | Type | Coverage | Update Frequency | Cost Estimate |
|--------|------|----------|------------------|---------------|
| **Associated Press (AP)** | News Wire | Global | Real-time | $20-30K/year |
| **Financial Times API** | Business News | Global | Hourly | $15-25K/year |
| **ACLED** | Conflict Data | Global | Daily | Free/Academic |

#### Tier 3 - Nice to Have (Phase 2+)
- Defense monitors (Jane's, IHS Markit)
- OSINT aggregators (Recorded Future)
- Cyber incident trackers (FireEye, CrowdStrike)
- Diplomatic reporting feeds (Foreign Policy, Diplomat)

### 3.2 Data Source Requirements

#### 3.2.1 Technical Requirements
```typescript
interface DataSourceConfig {
  sourceId: string;
  sourceName: string;
  sourceType: 'news_wire' | 'event_database' | 'monitor' | 'osint';
  credibilityWeight: number; // 0.0-1.0
  apiEndpoint: string;
  authMethod: 'api_key' | 'oauth' | 'basic';
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}
```

#### 3.2.2 Data Quality Requirements
- **Latency**: <5 minutes from event to ingestion
- **Accuracy**: >95% correct country/actor attribution
- **Completeness**: >90% of major geopolitical events captured
- **Reliability**: >99.5% uptime

### 3.3 Data Source Licensing

#### 3.3.1 Licensing Checklist
- [ ] Reuters News API - Commercial license
- [ ] Bloomberg Terminal API - Verify existing terms
- [ ] GDELT - Review attribution requirements
- [ ] AP - Negotiate commercial terms
- [ ] FT - Commercial API access

#### 3.3.2 Legal Considerations
- Data redistribution rights (internal use only)
- Attribution requirements
- Geographic restrictions
- Usage caps and overage fees

---

## 4. Signal Ingestion Pipeline

### 4.1 Pipeline Architecture

```typescript
/**
 * Signal Ingestion Pipeline
 * Processes raw data from external sources into structured signals
 */

interface RawSignal {
  sourceId: string;
  rawContent: string;
  timestamp: Date;
  url?: string;
  metadata: Record<string, any>;
}

interface StructuredSignal {
  signalId: string; // UUID
  sourceId: string;
  detectedAt: Date;
  
  // Geographic Attribution
  countries: string[]; // ISO 3166-1 alpha-2 codes
  regions?: string[];
  
  // Risk Vector Attribution
  primaryVector: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  secondaryVector?: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  
  // Content
  headline: string;
  summary: string;
  fullText?: string;
  
  // Classification
  signalType: 'threat' | 'action' | 'policy' | 'conflict' | 'economic' | 'diplomatic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actors: string[]; // Countries, organizations, individuals
  
  // Metadata
  language: string;
  sourceCredibility: number; // 0.0-1.0
  url?: string;
  tags: string[];
}
```

### 4.2 Parsing & Enrichment

#### 4.2.1 NLP Processing Requirements
```typescript
interface NLPProcessor {
  /**
   * Extract geographic entities from text
   */
  extractCountries(text: string): {
    country: string; // ISO code
    confidence: number; // 0.0-1.0
    mentions: number;
  }[];
  
  /**
   * Classify signal into risk vectors
   */
  classifyVector(text: string): {
    vector: string; // SC1-SC7
    confidence: number;
    reasoning: string;
  };
  
  /**
   * Assess signal severity
   */
  assessSeverity(text: string): {
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    indicators: string[];
  };
  
  /**
   * Extract key actors
   */
  extractActors(text: string): {
    actor: string;
    type: 'country' | 'organization' | 'individual';
    role: 'source' | 'target' | 'mediator';
  }[];
}
```

#### 4.2.2 Vector Classification Rules

**SC1 - Sanctions & Trade Restrictions**
- Keywords: "sanctions", "embargo", "tariff", "trade war", "export controls"
- Actors: Government agencies, trade authorities
- Indicators: Policy announcements, legislative actions

**SC2 - Capital Controls & FX Restrictions**
- Keywords: "capital controls", "currency restrictions", "forex", "repatriation"
- Actors: Central banks, finance ministries
- Indicators: Regulatory changes, policy statements

**SC3 - Nationalization & Expropriation**
- Keywords: "nationalization", "expropriation", "seizure", "state takeover"
- Actors: Governments, state-owned enterprises
- Indicators: Legal actions, asset seizures

**SC4 - Conflict & Security**
- Keywords: "military", "conflict", "war", "invasion", "attack"
- Actors: Military, defense ministries
- Indicators: Troop movements, military exercises

**SC5 - Political Instability**
- Keywords: "protests", "riots", "coup", "regime change", "election"
- Actors: Political parties, opposition groups
- Indicators: Social unrest, government crises

**SC6 - Regulatory & Legal**
- Keywords: "regulation", "compliance", "investigation", "lawsuit"
- Actors: Regulators, courts, law enforcement
- Indicators: Legal proceedings, policy changes

**SC7 - Cyber & Technology**
- Keywords: "cyberattack", "hacking", "data breach", "technology ban"
- Actors: Cyber agencies, tech companies
- Indicators: Security incidents, tech policy

### 4.3 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Ingestion Latency | <5 minutes | Time from source publish to database |
| Processing Throughput | 1000+ signals/day | Sustained rate |
| Parsing Accuracy | >90% | Country/vector attribution |
| System Uptime | >99.5% | Monthly availability |
| Storage Latency | <100ms | Write to database |
| Query Latency | <50ms | Read from database |

---

## 5. Persistence & Corroboration Filter

### 5.1 Corroboration Logic

#### 5.1.1 Multi-Source Confirmation
```typescript
interface CorroborationRule {
  /**
   * Minimum number of independent sources required
   */
  minSources: number; // Default: 2
  
  /**
   * Time window for corroboration
   */
  timeWindowHours: number; // Default: 72
  
  /**
   * Minimum combined credibility score
   */
  minCombinedCredibility: number; // Default: 1.5 (e.g., 2 sources × 0.8 each)
  
  /**
   * Geographic consistency check
   */
  requireGeographicMatch: boolean; // Default: true
  
  /**
   * Vector consistency check
   */
  requireVectorMatch: boolean; // Default: true
}

interface CorroborationResult {
  isCorroborated: boolean;
  sourceCount: number;
  combinedCredibility: number;
  firstDetected: Date;
  lastDetected: Date;
  consistencyScore: number; // 0.0-1.0
  conflictingSignals: StructuredSignal[];
}
```

#### 5.1.2 Persistence Threshold
```typescript
interface PersistenceRule {
  /**
   * Minimum time signal must persist
   */
  minPersistenceHours: number; // Default: 48
  
  /**
   * Maximum gap between mentions
   */
  maxGapHours: number; // Default: 24
  
  /**
   * Minimum mention frequency
   */
  minMentionsPerDay: number; // Default: 2
  
  /**
   * Decay rate for old signals
   */
  decayRatePerDay: number; // Default: 0.1
}

interface PersistenceResult {
  isPersistent: boolean;
  durationHours: number;
  mentionCount: number;
  averageMentionsPerDay: number;
  lastMention: Date;
  persistenceScore: number; // 0.0-1.0
}
```

### 5.2 Signal Qualification Pipeline

```typescript
/**
 * Signal Qualification Process
 * Determines if a signal meets criteria for storage
 */
class SignalQualifier {
  /**
   * Step 1: Initial validation
   */
  async validateSignal(signal: StructuredSignal): Promise<ValidationResult> {
    // Check required fields
    // Validate country codes
    // Validate vector classification
    // Check severity assessment
  }
  
  /**
   * Step 2: Corroboration check
   */
  async checkCorroboration(
    signal: StructuredSignal,
    rule: CorroborationRule
  ): Promise<CorroborationResult> {
    // Find similar signals from other sources
    // Calculate combined credibility
    // Check geographic/vector consistency
  }
  
  /**
   * Step 3: Persistence check
   */
  async checkPersistence(
    signal: StructuredSignal,
    rule: PersistenceRule
  ): Promise<PersistenceResult> {
    // Check signal history
    // Calculate persistence score
    // Assess mention frequency
  }
  
  /**
   * Step 4: Final qualification
   */
  async qualifySignal(signal: StructuredSignal): Promise<{
    qualified: boolean;
    reason: string;
    corroboration: CorroborationResult;
    persistence: PersistenceResult;
  }> {
    // Combine all checks
    // Make final decision
    // Log reasoning
  }
}
```

### 5.3 Rejection Criteria

Signals are rejected if:
- ❌ <2 independent sources within 72 hours
- ❌ Combined credibility <1.5
- ❌ Persistence <48 hours
- ❌ Conflicting geographic attribution (>50% disagreement)
- ❌ Conflicting vector attribution (>50% disagreement)
- ❌ Severity assessment confidence <0.6
- ❌ Missing required fields (country, vector, timestamp)

---

## 6. Signal Storage (Database Schema)

### 6.1 Database Tables

#### 6.1.1 `signals` Table
```sql
CREATE TABLE signals (
  signal_id UUID PRIMARY KEY,
  source_id VARCHAR(50) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  
  -- Geographic Attribution
  countries VARCHAR(2)[] NOT NULL, -- Array of ISO codes
  regions VARCHAR(50)[],
  
  -- Risk Vector Attribution
  primary_vector VARCHAR(3) NOT NULL, -- SC1-SC7
  secondary_vector VARCHAR(3),
  
  -- Content
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_text TEXT,
  
  -- Classification
  signal_type VARCHAR(20) NOT NULL,
  severity VARCHAR(10) NOT NULL,
  actors JSONB,
  
  -- Metadata
  language VARCHAR(10),
  source_credibility DECIMAL(3,2),
  url TEXT,
  tags VARCHAR(50)[],
  
  -- Qualification Status
  is_qualified BOOLEAN DEFAULT FALSE,
  qualification_reason TEXT,
  qualified_at TIMESTAMP,
  
  -- Corroboration
  corroboration_count INTEGER DEFAULT 1,
  corroboration_score DECIMAL(3,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_countries USING GIN(countries),
  INDEX idx_detected_at (detected_at DESC),
  INDEX idx_primary_vector (primary_vector),
  INDEX idx_is_qualified (is_qualified),
  INDEX idx_source_id (source_id)
);
```

#### 6.1.2 `signal_corroboration` Table
```sql
CREATE TABLE signal_corroboration (
  corroboration_id UUID PRIMARY KEY,
  primary_signal_id UUID NOT NULL REFERENCES signals(signal_id),
  corroborating_signal_id UUID NOT NULL REFERENCES signals(signal_id),
  
  -- Similarity Metrics
  geographic_similarity DECIMAL(3,2), -- 0.0-1.0
  vector_similarity DECIMAL(3,2),
  content_similarity DECIMAL(3,2),
  temporal_proximity_hours INTEGER,
  
  -- Combined Score
  overall_similarity DECIMAL(3,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(primary_signal_id, corroborating_signal_id),
  CHECK (primary_signal_id != corroborating_signal_id)
);
```

#### 6.1.3 `signal_persistence` Table
```sql
CREATE TABLE signal_persistence (
  persistence_id UUID PRIMARY KEY,
  signal_cluster_id UUID NOT NULL, -- Groups related signals
  
  -- Persistence Metrics
  first_detected TIMESTAMP NOT NULL,
  last_detected TIMESTAMP NOT NULL,
  duration_hours INTEGER,
  mention_count INTEGER,
  mentions_per_day DECIMAL(5,2),
  
  -- Persistence Score
  persistence_score DECIMAL(3,2), -- 0.0-1.0
  is_persistent BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_signal_cluster (signal_cluster_id),
  INDEX idx_last_detected (last_detected DESC)
);
```

#### 6.1.4 `data_sources` Table
```sql
CREATE TABLE data_sources (
  source_id VARCHAR(50) PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  
  -- Credibility
  credibility_weight DECIMAL(3,2) NOT NULL, -- 0.0-1.0
  
  -- API Configuration
  api_endpoint TEXT,
  auth_method VARCHAR(20),
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_successful_fetch TIMESTAMP,
  last_error TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Database Indexes & Optimization

#### 6.2.1 Performance Indexes
```sql
-- Fast country lookup
CREATE INDEX idx_signals_countries_gin ON signals USING GIN(countries);

-- Fast time-range queries
CREATE INDEX idx_signals_detected_at_desc ON signals (detected_at DESC);

-- Fast vector filtering
CREATE INDEX idx_signals_primary_vector ON signals (primary_vector);

-- Fast qualification status
CREATE INDEX idx_signals_qualified ON signals (is_qualified) WHERE is_qualified = TRUE;

-- Composite index for common queries
CREATE INDEX idx_signals_country_vector_time 
  ON signals (primary_vector, detected_at DESC) 
  WHERE 'US' = ANY(countries);
```

#### 6.2.2 Partitioning Strategy
```sql
-- Partition by month for time-series data
CREATE TABLE signals_2026_01 PARTITION OF signals
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE signals_2026_02 PARTITION OF signals
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Auto-create partitions via cron job
```

### 6.3 Data Retention Policy

| Data Type | Retention Period | Archive Strategy |
|-----------|------------------|------------------|
| Raw signals (unqualified) | 30 days | Delete |
| Qualified signals | 2 years | Archive to cold storage |
| Corroboration records | 1 year | Archive with signals |
| Persistence records | 2 years | Archive with signals |
| Source metadata | Indefinite | Keep active |

---

## 7. Internal Monitoring Dashboard

### 7.1 Dashboard Requirements

#### 7.1.1 Real-Time Metrics
```typescript
interface DashboardMetrics {
  // Ingestion Metrics
  signalsIngested: {
    last1Hour: number;
    last24Hours: number;
    last7Days: number;
  };
  
  // Source Health
  sourceStatus: {
    sourceId: string;
    sourceName: string;
    isActive: boolean;
    lastFetch: Date;
    errorRate: number;
    signalsContributed: number;
  }[];
  
  // Qualification Metrics
  qualificationRate: {
    qualified: number;
    rejected: number;
    pending: number;
    qualificationRate: number; // %
  };
  
  // Geographic Coverage
  countryCoverage: {
    country: string;
    signalCount: number;
    qualifiedCount: number;
    lastSignal: Date;
  }[];
  
  // Vector Distribution
  vectorDistribution: {
    vector: string;
    signalCount: number;
    percentage: number;
  }[];
  
  // Performance Metrics
  performance: {
    avgIngestionLatency: number; // ms
    avgProcessingTime: number; // ms
    avgStorageLatency: number; // ms
    systemUptime: number; // %
  };
}
```

#### 7.1.2 Dashboard Views

**View 1: System Health**
- Real-time signal ingestion rate (chart)
- Source health status (table)
- Error rate trends (chart)
- System uptime (gauge)

**View 2: Signal Quality**
- Qualification rate over time (chart)
- Rejection reasons breakdown (pie chart)
- Corroboration success rate (gauge)
- Persistence score distribution (histogram)

**View 3: Geographic Coverage**
- Signals by country (map)
- Top 20 countries by signal count (bar chart)
- Coverage gaps (list)
- Regional distribution (pie chart)

**View 4: Vector Analysis**
- Signals by vector (bar chart)
- Vector trends over time (line chart)
- Multi-vector signals (table)
- Severity distribution by vector (stacked bar)

**View 5: Performance**
- Latency metrics (gauges)
- Throughput trends (line chart)
- Database performance (table)
- API response times (histogram)

### 7.2 Alerting System

#### 7.2.1 Alert Conditions
```typescript
interface AlertRule {
  alertId: string;
  alertName: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  notificationChannels: ('email' | 'slack' | 'pagerduty')[];
}

const ALERT_RULES: AlertRule[] = [
  {
    alertId: 'ingestion_rate_low',
    alertName: 'Low Ingestion Rate',
    condition: 'signalsIngested.last1Hour < 50',
    threshold: 50,
    severity: 'warning',
    notificationChannels: ['slack']
  },
  {
    alertId: 'source_down',
    alertName: 'Data Source Unavailable',
    condition: 'sourceStatus.isActive === false',
    threshold: 1,
    severity: 'critical',
    notificationChannels: ['email', 'slack', 'pagerduty']
  },
  {
    alertId: 'high_error_rate',
    alertName: 'High Error Rate',
    condition: 'sourceStatus.errorRate > 0.05',
    threshold: 0.05,
    severity: 'warning',
    notificationChannels: ['slack']
  },
  {
    alertId: 'low_qualification_rate',
    alertName: 'Low Qualification Rate',
    condition: 'qualificationRate.qualificationRate < 0.3',
    threshold: 0.3,
    severity: 'info',
    notificationChannels: ['email']
  },
  {
    alertId: 'high_latency',
    alertName: 'High Processing Latency',
    condition: 'performance.avgProcessingTime > 5000',
    threshold: 5000,
    severity: 'warning',
    notificationChannels: ['slack']
  }
];
```

#### 7.2.2 Notification Templates
```typescript
interface AlertNotification {
  alertId: string;
  alertName: string;
  severity: string;
  timestamp: Date;
  currentValue: number;
  threshold: number;
  message: string;
  dashboardUrl: string;
  runbookUrl?: string;
}
```

---

## 8. Development Milestones

### 8.1 Month 1: Data Source Integration & Basic Ingestion

**Week 1-2: Data Source Setup**
- [ ] Finalize data source licenses (Reuters, Bloomberg, GDELT)
- [ ] Set up API credentials and authentication
- [ ] Configure rate limiting and retry policies
- [ ] Create `data_sources` table and seed data
- [ ] Build basic API client wrappers

**Week 3-4: Signal Ingestion Pipeline**
- [ ] Implement raw signal fetching from sources
- [ ] Build signal parsing and enrichment logic
- [ ] Create `signals` table and indexes
- [ ] Implement basic NLP processing (country/vector extraction)
- [ ] Set up ingestion scheduler (cron/queue)

**Deliverables**:
- ✅ 3 data sources actively ingesting
- ✅ 500+ signals/day being parsed
- ✅ Database schema deployed
- ✅ Basic logging and error handling

### 8.2 Month 2: Corroboration & Persistence Logic

**Week 5-6: Corroboration Filter**
- [ ] Implement signal similarity matching
- [ ] Build multi-source corroboration logic
- [ ] Create `signal_corroboration` table
- [ ] Develop credibility scoring algorithm
- [ ] Add corroboration unit tests

**Week 7-8: Persistence Filter**
- [ ] Implement signal clustering (same event detection)
- [ ] Build persistence tracking logic
- [ ] Create `signal_persistence` table
- [ ] Develop decay scheduling
- [ ] Add persistence unit tests

**Deliverables**:
- ✅ Corroboration logic operational
- ✅ Persistence tracking functional
- ✅ <5% false positive rate achieved
- ✅ 1000+ signals/day qualified

### 8.3 Month 3: Monitoring Dashboard & Testing

**Week 9-10: Dashboard Development**
- [ ] Build dashboard backend API
- [ ] Create dashboard frontend (React)
- [ ] Implement real-time metrics collection
- [ ] Add alerting system
- [ ] Set up notification channels

**Week 11-12: Testing & Optimization**
- [ ] Comprehensive integration testing
- [ ] Performance optimization (query tuning)
- [ ] Load testing (simulate 5000 signals/day)
- [ ] Security audit
- [ ] Documentation completion

**Deliverables**:
- ✅ Monitoring dashboard live
- ✅ Alerting system operational
- ✅ All performance targets met
- ✅ Zero production impact confirmed

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('Signal Ingestion Pipeline', () => {
  describe('NLP Processing', () => {
    it('should extract countries with >90% accuracy', async () => {
      const text = "US imposes sanctions on China";
      const result = await nlpProcessor.extractCountries(text);
      expect(result).toContainEqual({ country: 'US', confidence: >0.9 });
      expect(result).toContainEqual({ country: 'CN', confidence: >0.9 });
    });
    
    it('should classify vectors correctly', async () => {
      const text = "Treasury announces new tariffs";
      const result = await nlpProcessor.classifyVector(text);
      expect(result.vector).toBe('SC1');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
  
  describe('Corroboration Filter', () => {
    it('should require 2+ sources for qualification', async () => {
      const signal = createTestSignal();
      const result = await corroborator.checkCorroboration(signal);
      expect(result.isCorroborated).toBe(false); // Only 1 source
    });
    
    it('should corroborate with multiple sources', async () => {
      const signal1 = createTestSignal({ sourceId: 'reuters' });
      const signal2 = createTestSignal({ sourceId: 'bloomberg' });
      await signalStore.save(signal1);
      const result = await corroborator.checkCorroboration(signal2);
      expect(result.isCorroborated).toBe(true);
      expect(result.sourceCount).toBe(2);
    });
  });
  
  describe('Persistence Filter', () => {
    it('should require 48+ hours persistence', async () => {
      const signal = createTestSignal({ detectedAt: new Date() });
      const result = await persistenceChecker.checkPersistence(signal);
      expect(result.isPersistent).toBe(false); // Too recent
    });
    
    it('should track persistence over time', async () => {
      const signals = createSignalSeries(5, 24); // 5 signals, 24hr apart
      for (const signal of signals) {
        await signalStore.save(signal);
      }
      const result = await persistenceChecker.checkPersistence(signals[0]);
      expect(result.isPersistent).toBe(true);
      expect(result.durationHours).toBeGreaterThan(48);
    });
  });
});
```

### 9.2 Integration Tests

```typescript
describe('End-to-End Signal Processing', () => {
  it('should process signal from ingestion to qualification', async () => {
    // 1. Ingest raw signal
    const rawSignal = createRawSignal();
    await ingestionPipeline.ingest(rawSignal);
    
    // 2. Verify parsing
    const parsed = await signalStore.findBySourceId(rawSignal.sourceId);
    expect(parsed).toBeDefined();
    expect(parsed.countries).toContain('US');
    
    // 3. Add corroborating signal
    const corroborating = createRawSignal({ sourceId: 'different_source' });
    await ingestionPipeline.ingest(corroborating);
    
    // 4. Wait for corroboration check
    await sleep(1000);
    
    // 5. Verify qualification
    const qualified = await signalStore.findQualified(parsed.signalId);
    expect(qualified.isQualified).toBe(true);
    expect(qualified.corroborationCount).toBeGreaterThanOrEqual(2);
  });
  
  it('should handle high-volume ingestion', async () => {
    const signals = Array(1000).fill(null).map(() => createRawSignal());
    
    const startTime = Date.now();
    await Promise.all(signals.map(s => ingestionPipeline.ingest(s)));
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(60000); // <1 minute for 1000 signals
    
    const stored = await signalStore.count();
    expect(stored).toBe(1000);
  });
});
```

### 9.3 Performance Tests

```typescript
describe('Performance Benchmarks', () => {
  it('should meet ingestion latency target', async () => {
    const signal = createRawSignal();
    const start = Date.now();
    await ingestionPipeline.ingest(signal);
    const latency = Date.now() - start;
    
    expect(latency).toBeLessThan(5000); // <5 seconds
  });
  
  it('should meet storage latency target', async () => {
    const signal = createStructuredSignal();
    const start = Date.now();
    await signalStore.save(signal);
    const latency = Date.now() - start;
    
    expect(latency).toBeLessThan(100); // <100ms
  });
  
  it('should meet query latency target', async () => {
    const start = Date.now();
    const signals = await signalStore.findByCountry('US', { limit: 100 });
    const latency = Date.now() - start;
    
    expect(latency).toBeLessThan(50); // <50ms
    expect(signals.length).toBeLessThanOrEqual(100);
  });
});
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

- ✅ **FR1**: System ingests signals from 3+ data sources
- ✅ **FR2**: Signals are parsed with >90% country attribution accuracy
- ✅ **FR3**: Signals are classified into SC1-SC7 vectors with >85% accuracy
- ✅ **FR4**: Corroboration requires 2+ independent sources
- ✅ **FR5**: Persistence requires 48+ hours of sustained mentions
- ✅ **FR6**: Qualified signals are stored in database
- ✅ **FR7**: Monitoring dashboard displays real-time metrics
- ✅ **FR8**: Alerting system sends notifications on threshold breaches

### 10.2 Non-Functional Requirements

- ✅ **NFR1**: Ingestion latency <5 minutes (p95)
- ✅ **NFR2**: Processing throughput >1000 signals/day
- ✅ **NFR3**: Storage latency <100ms (p95)
- ✅ **NFR4**: Query latency <50ms (p95)
- ✅ **NFR5**: System uptime >99.5%
- ✅ **NFR6**: False positive rate <5%
- ✅ **NFR7**: Database size <10GB (Month 1-3)
- ✅ **NFR8**: API rate limits respected (zero violations)

### 10.3 Quality Requirements

- ✅ **QR1**: Unit test coverage >80%
- ✅ **QR2**: Integration test coverage >70%
- ✅ **QR3**: All critical paths have performance tests
- ✅ **QR4**: Security audit passed (no critical vulnerabilities)
- ✅ **QR5**: Documentation complete (API, architecture, runbooks)
- ✅ **QR6**: Code review approval from 2+ engineers
- ✅ **QR7**: Load testing passed (5000 signals/day sustained)
- ✅ **QR8**: Zero impact on production CSI (verified via monitoring)

---

## 11. Risk Management

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data source API changes | Medium | High | Version pinning, fallback sources |
| NLP accuracy below target | Medium | Medium | Human-in-loop validation, model tuning |
| Database performance issues | Low | High | Query optimization, partitioning |
| High false positive rate | Medium | Medium | Stricter corroboration rules, tuning |
| API rate limit violations | Low | Medium | Rate limiter, request queuing |

### 11.2 Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data licensing delays | High | Medium | Start negotiations early, have alternatives |
| NLP development complexity | Medium | High | Use existing libraries (spaCy, NLTK) |
| Testing reveals major issues | Medium | High | Continuous testing, early integration |
| Resource constraints | Low | High | Clear prioritization, scope management |

### 11.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Production CSI impacted | Low | Critical | Strict isolation, monitoring, rollback plan |
| Data source outages | Medium | Medium | Multiple sources, graceful degradation |
| Security vulnerabilities | Low | High | Security audit, penetration testing |
| Cost overruns | Medium | Medium | Budget tracking, cost optimization |

---

## 12. Success Metrics

### 12.1 Phase 1 KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Signal Volume** | 1000+/day | Dashboard counter |
| **Qualification Rate** | 30-50% | Qualified / Total |
| **False Positive Rate** | <5% | Manual review sample |
| **Ingestion Latency** | <5 min (p95) | Timestamp diff |
| **System Uptime** | >99.5% | Monitoring alerts |
| **Country Coverage** | 50+ countries | Distinct country count |
| **Vector Distribution** | All SC1-SC7 | Signal classification |
| **Production Impact** | Zero | CSI score comparison |

### 12.2 Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Country Attribution Accuracy** | >90% | Manual review (n=100) |
| **Vector Classification Accuracy** | >85% | Manual review (n=100) |
| **Corroboration Precision** | >95% | True positives / Total |
| **Persistence Detection Accuracy** | >90% | Manual review (n=50) |
| **Code Coverage** | >80% | Jest/Pytest reports |
| **Documentation Completeness** | 100% | Review checklist |

---

## 13. Deliverables Checklist

### 13.1 Code Deliverables
- [ ] Signal ingestion pipeline (TypeScript/Python)
- [ ] NLP processing module
- [ ] Corroboration filter
- [ ] Persistence tracker
- [ ] Database schema and migrations
- [ ] API client wrappers (Reuters, Bloomberg, GDELT)
- [ ] Monitoring dashboard (React)
- [ ] Alerting system
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Performance tests

### 13.2 Documentation Deliverables
- [ ] Architecture documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema documentation
- [ ] Runbook (operations guide)
- [ ] Deployment guide
- [ ] Testing guide
- [ ] Troubleshooting guide
- [ ] Security documentation

### 13.3 Operational Deliverables
- [ ] Data source licenses secured
- [ ] Production environment configured
- [ ] Monitoring dashboard deployed
- [ ] Alerting channels configured
- [ ] Backup and recovery procedures
- [ ] Incident response plan
- [ ] Performance baseline established
- [ ] Security audit completed

---

## 14. Next Steps (Post-Phase 1)

Upon successful completion of Phase 1, proceed to:

1. **Phase 2: Baseline Drift Engine** (Months 4-6)
   - Implement expectation-weighted baseline calculation
   - Add drift caps and decay logic
   - Run parallel CSI calculation (legacy vs enhanced)
   - Conduct backtesting

2. **Phase 3: Event Lifecycle** (Months 7-9)
   - Build event state machine (DETECTED → PROVISIONAL → CONFIRMED)
   - Implement netting and de-duplication
   - Complete full CSI calculation
   - Add explainability layer

3. **Phase 4: Beta Launch** (Months 10-11)
   - UI/UX updates
   - User documentation
   - Beta user group
   - Feedback collection

4. **Phase 5: Production Launch** (Month 12+)
   - Full rollout
   - Marketing campaign
   - Continuous monitoring
   - Quarterly reviews

---

## 15. Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| Data Team Lead | | | |
| Security Officer | | | |
| Finance (Budget Approval) | | | |

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-26  
**Next Review**: 2026-02-26  
**Contact**: engineering@company.com