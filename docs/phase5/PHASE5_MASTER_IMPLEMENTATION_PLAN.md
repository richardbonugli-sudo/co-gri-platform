# Phase 5 Master Implementation Plan
## CSI Enhancement: Expectation-Weighted Risk Intelligence Platform

**Project Name:** CSI Enhancement Phase 5 - Data Source Upgrade & Vector Architecture  
**Version:** 1.0  
**Date:** January 26, 2026  
**Status:** DRAFT - Awaiting Approval  
**Owner:** Engineering Team  
**Strategic Advisor:** Mike (Team Leader)  

---

## EXECUTIVE SUMMARY

### Project Overview
Phase 5 represents a **fundamental architectural transformation** of the Country Shock Index (CSI) system from a static, backward-looking indicator to a dynamic, expectation-weighted geopolitical risk intelligence platform. This upgrade implements the methodology outlined in the attached guidance documents and positions the platform to compete with professional-grade risk intelligence services like GeoQuant.

### Strategic Objectives
1. **Real-Time Detection:** Capture geopolitical escalations 24-72 hours before confirmation
2. **Expectation Pricing:** Price future risk probability, not just past events
3. **Full Auditability:** Every CSI movement traceable to source citations
4. **Competitive Differentiation:** Unique methodology vs. existing platforms
5. **Product Extension:** Foundation for standalone Country Risk Intelligence product

### Success Metrics
- **Detection Speed:** <30 minutes from signal to candidate event
- **Accuracy:** >95% correct country/vector attribution
- **Coverage:** 1000+ signals/day across 195 countries
- **False Positive Rate:** <5% after corroboration
- **Audit Completeness:** 100% of CSI movements explainable

### Budget & Timeline
- **Total Budget:** $350,000 (development) + $60,000/year (operations)
- **Timeline:** 18-20 weeks (4.5-5 months)
- **Team Size:** 4 FTEs (Senior Backend, Data Engineer, Frontend, QA)
- **Expected ROI:** 3-5x within 18 months

---

## TABLE OF CONTENTS

1. [Current State Analysis](#1-current-state-analysis)
2. [Phase 5 Architecture](#2-phase-5-architecture)
3. [Implementation Phases](#3-implementation-phases)
4. [Technical Specifications](#4-technical-specifications)
5. [Data Source Integration](#5-data-source-integration)
6. [Vector Routing Logic](#6-vector-routing-logic)
7. [CSI Recalibration Process](#7-csi-recalibration-process)
8. [UI/UX Enhancements](#8-uiux-enhancements)
9. [Testing & Validation](#9-testing--validation)
10. [Resource Allocation](#10-resource-allocation)
11. [Risk Management](#11-risk-management)
12. [Success Criteria](#12-success-criteria)
13. [Appendices](#13-appendices)

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Existing System Capabilities ✅

**What Works:**
- ✅ Basic event store architecture (`eventStore.ts`)
- ✅ Data source configuration framework (`config.ts`, `expandedConfig.ts`)
- ✅ RSS feed ingestion pipeline (`rssFeedIngestion.ts`)
- ✅ CSI Analytics Dashboard (Phase 4)
- ✅ Event Propagation Network visualization (Phase 4)
- ✅ 17 data sources configured (Tier 1-3)
- ✅ Basic correlation detection and impact analysis

### 1.2 Critical Gaps ❌

**What's Missing:**
- ❌ **No vector-specific routing logic (SC1-SC7)**
- ❌ **No DETECTED → PROVISIONAL → CONFIRMED → RESOLVED lifecycle**
- ❌ **No persistence/corroboration rules (≥2 sources, 48-72hr)**
- ❌ **No authoritative confirmation layer**
- ❌ **No baseline drift calculation**
- ❌ **No Event_CSI_Δ ledger**
- ❌ **Static CSI scores (not recalibrated since implementation)**
- ❌ **No GDELT integration (critical backbone missing)**

### 1.3 Impact Assessment

**Business Impact:**
- Current system cannot detect real-time escalations
- CSI scores are backward-looking only
- Cannot distinguish between signals and confirmed events
- Limited competitive positioning vs. professional platforms
- Missed opportunities for forward-looking investment insights

**Technical Debt:**
- Event lifecycle management incomplete
- No audit trail for CSI movements
- Limited scalability for high-frequency ingestion
- Manual recalibration required

---

## 2. PHASE 5 ARCHITECTURE

### 2.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 5 ARCHITECTURE OVERVIEW                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: GLOBAL DETECTION (Section 3 - Appendix B)                 │
│  ─────────────────────────────────────────────────────────────────  │
│  Purpose: Cross-cutting, vector-agnostic candidate generation        │
│                                                                       │
│  Sources:                                                             │
│  • GDELT (primary backbone) ⭐ NEW                                   │
│  • Reuters (free RSS)                                                 │
│  • Associated Press ⭐ NEW                                           │
│  • BBC World News ⭐ NEW                                             │
│  • Al Jazeera ⭐ NEW                                                 │
│  • Deutsche Welle ⭐ NEW                                             │
│  • France 24 ⭐ NEW                                                  │
│  • UN News ⭐ NEW                                                    │
│  • ReliefWeb ⭐ NEW                                                  │
│  • CrisisWatch ⭐ NEW                                                │
│                                                                       │
│  Output: Candidate Signals/Events (no CSI impact yet)                │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PARSING & CLASSIFICATION ENGINE ⭐ NEW                              │
│  ─────────────────────────────────────────────────────────────────  │
│  • Entity resolution (actor/target countries)                        │
│  • Event vs. signal typing                                           │
│  • Initial severity tagging                                          │
│  • Timestamp normalization                                           │
│                                                                       │
│  Output: Structured Candidates                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: VECTOR ROUTING & VALIDATION (Section 4 - Appendix B) ⭐   │
│  ─────────────────────────────────────────────────────────────────  │
│  Purpose: Route to risk vectors, apply persistence rules             │
│                                                                       │
│  Risk Vectors (SC1-SC7):                                              │
│  • SC1: Conflict & Security                                          │
│  • SC2: Sanctions & Regulatory Pressure                              │
│  • SC3: Trade & Logistics Disruption                                 │
│  • SC4: Governance & Rule of Law                                     │
│  • SC5: Cyber & Data Sovereignty                                     │
│  • SC6: Public Unrest & Labor Instability                            │
│  • SC7: Currency & Capital Controls                                  │
│                                                                       │
│  Validation Rules:                                                    │
│  • Corroboration: ≥2 independent sources                             │
│  • Persistence: 48-72 hour threshold                                 │
│  • Credibility weighting                                             │
│                                                                       │
│  Output: Eligible Escalation or Event Candidate                      │
└─────────────────────────────────────────────────────────────────────┘
           ▼                                          ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│  BASELINE_CSI DRIFT ⭐   │          │  EVENT_CSI_Δ ⭐          │
│  (Expectation Layer)     │          │  (Realized Shocks)       │
│  ──────────────────────  │          │  ──────────────────────  │
│  • Escalation signals    │          │  • Confirmed via         │
│  • Probability-weighted  │          │    authoritative sources │
│  • Capped & decayed      │          │  • Net of prior drift    │
│  • Pre-event pricing     │          │  • Full audit trail      │
└──────────────────────────┘          └──────────────────────────┘
           │                                          │
           └──────────────────┬───────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: AUTHORITATIVE CONFIRMATION (Section 4 - Appendix B) ⭐     │
│  ─────────────────────────────────────────────────────────────────  │
│  Purpose: Confirm events via jurisdiction-specific sources           │
│                                                                       │
│  Authoritative Sources by Vector:                                    │
│  • SC1: UN Security Council, MoD/DoD, UCDP                           │
│  • SC2: OFAC, EU Official Journal, UN Sanctions                      │
│  • SC3: USTR, BIS, China MOFCOM, WTO                                 │
│  • SC4: Election commissions, government gazettes                    │
│  • SC5: CISA, ENISA, government cyber statements                     │
│  • SC6: Emergency declarations, interior ministry                    │
│  • SC7: Central bank circulars, IMF notifications                    │
│                                                                       │
│  Output: Confirmed Events → Event_CSI_Δ                              │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CSI OUTPUT                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  CSI(country, t) = Structural_Baseline                                │
│                  + Escalation_Drift(t)                                │
│                  + Event_CSI_Δ(t)                                     │
│                                                                       │
│  Fully auditable & reproducible                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Architectural Principles

1. **Separation of Concerns:** Detection ≠ Confirmation
2. **Explicit Lifecycle:** DETECTED → PROVISIONAL → CONFIRMED → RESOLVED
3. **Rule-Based Routing:** No probabilistic vector assignment
4. **Full Auditability:** Every CSI movement traceable
5. **Noise Tolerance:** Accept noise in detection, filter via validation
6. **Backward Compatibility:** No breaking changes to existing APIs

---

## 3. IMPLEMENTATION PHASES

### Phase 5A: Core Architecture (Weeks 1-6)
**Goal:** Build event lifecycle and vector routing engine

**Deliverables:**
1. Event lifecycle state machine (DETECTED → PROVISIONAL → CONFIRMED → RESOLVED)
2. Vector routing engine (SC1-SC7 classification logic)
3. Persistence and corroboration rules engine
4. Escalation Signal Log (persisted store)
5. Event Candidate Store (lifecycle tracking)
6. Event_CSI_Δ Ledger (confirmed event shocks)
7. Audit trail infrastructure

**Success Criteria:**
- ✅ State transitions working correctly
- ✅ Vector routing >95% accurate (manual validation)
- ✅ Corroboration rules enforced
- ✅ Full audit logs generated

---

### Phase 5B: Data Source Integration (Weeks 7-14)
**Goal:** Integrate 40+ data sources per Appendix B

**Priority 1: Critical Backbone (Weeks 7-9)**
- GDELT integration (15-minute batch ingestion)
- Associated Press RSS
- BBC World News RSS
- UN News RSS
- ReliefWeb RSS

**Priority 2: Authoritative Confirmation (Weeks 10-12)**
- OFAC sanctions RSS
- EU Official Journal
- UN Security Council resolutions
- USTR press releases
- BIS export control notices
- China MOFCOM announcements
- WTO dispute filings

**Priority 3: Vector-Specific Sources (Weeks 13-14)**
- CISA cyber alerts
- ENISA bulletins
- NetBlocks internet observatory
- CrisisWatch
- ACLED conflict data
- Central bank circulars (Fed, ECB, BoJ, PBoC)

**Success Criteria:**
- ✅ 1000+ signals/day ingested
- ✅ <5 minute latency from source to ingestion
- ✅ >99.5% uptime for critical sources
- ✅ All authoritative sources operational

---

### Phase 5C: CSI Recalibration (Weeks 15-17)
**Goal:** Recalibrate CSI using new methodology

**Step 1: Freeze Structural Baseline (Week 15)**
- Select baseline cut date: **January 1, 2024**
- Recompute Structural Baseline CSI for all 195 countries
- Lock baseline (no high-frequency events after cut date)

**Step 2: Initialize Empty Ledgers (Week 15)**
- Escalation Signal Log
- Event Candidate Store
- Event_CSI_Δ Ledger

**Step 3: Replay Forward (Week 16)**
- Daily batch from January 1, 2024 to present
- Ingest high-frequency detection sources
- Parse and structure candidates
- Apply persistence and corroboration rules
- Apply baseline drift where thresholds met
- Confirm events via authoritative sources
- Net prior drift and apply Event_CSI_Δ

**Step 4: Validate Against Known Events (Week 17)**
- Checklist of 20+ known recent developments:
  - US-China tariff threats (2024-2025)
  - Russia-Ukraine sanctions escalations
  - Middle East export restrictions
  - EU regulatory actions
  - Major diplomatic/military escalations
- Validate detection, routing, drift, confirmation, CSI movement

**Step 5: Version and Lock Outputs (Week 17)**
- Version CSI time series (v2.0)
- Store baseline, drift, event ledgers separately
- Preserve full audit trails

**Success Criteria:**
- ✅ All 195 countries recalibrated
- ✅ >90% of known events detected
- ✅ <10% false positive rate
- ✅ CSI movements match expected patterns
- ✅ Full audit trail for every movement

---

### Phase 5D: UI/UX Enhancements (Weeks 18-20)
**Goal:** Create Country Risk Intelligence interface

**Deliverables:**
1. **Global CSI Heat Map**
   - Interactive world map
   - Color-coded by CSI score
   - Hover for quick stats
   - Click to drill down

2. **Country-Specific CSI Pages**
   - Historical CSI time series chart
   - Recent key events timeline
   - Risk vector breakdown (SC1-SC7)
   - Escalation signals vs. confirmed events
   - Export to PDF/CSV

3. **Event Explorer**
   - Filterable event list
   - Search by country, vector, date range
   - Event lifecycle status
   - Source citations
   - Audit trail view

4. **Risk Alerts Dashboard**
   - Real-time escalation alerts
   - Customizable thresholds
   - Email/SMS notifications
   - Alert history

**Success Criteria:**
- ✅ Heat map renders <2s
- ✅ Country pages load <1s
- ✅ WCAG 2.1 AA accessible
- ✅ Mobile responsive
- ✅ User testing >85% satisfaction

---

## 4. TECHNICAL SPECIFICATIONS

### 4.1 Technology Stack

**Backend:**
- Node.js 18+ (existing)
- TypeScript 5+ (existing)
- PostgreSQL 15 (existing + expansion)
- Redis (new - caching layer)

**Frontend:**
- React 18+ (existing)
- shadcn-ui (existing)
- Tailwind CSS (existing)
- D3.js (existing - visualization)
- Recharts (new - time series charts)

**Data Pipeline:**
- Apache Kafka (new - event streaming)
- Apache Airflow (new - batch orchestration)
- Python 3.11+ (new - GDELT processing)

**Monitoring:**
- Prometheus (new - metrics)
- Grafana (new - dashboards)
- Sentry (existing - error tracking)

### 4.2 Database Schema

**New Tables:**

```sql
-- Escalation Signal Log
CREATE TABLE escalation_signals (
  signal_id UUID PRIMARY KEY,
  detected_at TIMESTAMP NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  source_url TEXT,
  raw_content TEXT,
  parsed_content JSONB,
  target_country VARCHAR(3) NOT NULL,
  actor_country VARCHAR(3),
  vector_primary VARCHAR(10) NOT NULL,
  vector_secondary VARCHAR(10),
  signal_type VARCHAR(50) NOT NULL,
  severity_initial INTEGER,
  credibility_score DECIMAL(3,2),
  status VARCHAR(20) NOT NULL, -- DETECTED, CORROBORATED, EXPIRED
  corroboration_count INTEGER DEFAULT 1,
  corroboration_sources TEXT[],
  persistence_hours INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_target_country (target_country),
  INDEX idx_vector (vector_primary),
  INDEX idx_status (status),
  INDEX idx_detected_at (detected_at)
);

-- Event Candidate Store
CREATE TABLE event_candidates (
  event_id UUID PRIMARY KEY,
  signal_ids UUID[] NOT NULL,
  lifecycle_state VARCHAR(20) NOT NULL, -- DETECTED, PROVISIONAL, CONFIRMED, RESOLVED
  target_country VARCHAR(3) NOT NULL,
  actor_country VARCHAR(3),
  vector_primary VARCHAR(10) NOT NULL,
  vector_secondary VARCHAR(10),
  event_type VARCHAR(50) NOT NULL,
  severity INTEGER,
  probability_weight DECIMAL(3,2),
  detected_at TIMESTAMP NOT NULL,
  provisional_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  confirmation_source_id VARCHAR(100),
  confirmation_url TEXT,
  baseline_drift_applied BOOLEAN DEFAULT FALSE,
  baseline_drift_amount DECIMAL(5,2),
  event_csi_delta DECIMAL(5,2),
  decay_schedule JSONB,
  audit_log JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_lifecycle (lifecycle_state),
  INDEX idx_target_country (target_country),
  INDEX idx_vector (vector_primary),
  INDEX idx_detected_at (detected_at)
);

-- Event_CSI_Δ Ledger
CREATE TABLE event_csi_delta_ledger (
  ledger_id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES event_candidates(event_id),
  country VARCHAR(3) NOT NULL,
  vector VARCHAR(10) NOT NULL,
  event_date DATE NOT NULL,
  csi_delta DECIMAL(5,2) NOT NULL,
  prior_drift_netted DECIMAL(5,2),
  net_csi_impact DECIMAL(5,2) NOT NULL,
  decay_half_life_days INTEGER,
  current_decay_factor DECIMAL(3,2),
  audit_trail JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_country_date (country, event_date),
  INDEX idx_vector (vector)
);

-- CSI Time Series (Versioned)
CREATE TABLE csi_time_series (
  id SERIAL PRIMARY KEY,
  country VARCHAR(3) NOT NULL,
  date DATE NOT NULL,
  csi_version VARCHAR(10) NOT NULL, -- v1.0, v2.0, etc.
  structural_baseline DECIMAL(5,2) NOT NULL,
  escalation_drift DECIMAL(5,2) DEFAULT 0,
  event_csi_delta DECIMAL(5,2) DEFAULT 0,
  csi_total DECIMAL(5,2) NOT NULL,
  components JSONB, -- breakdown by vector
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (country, date, csi_version),
  INDEX idx_country_date (country, date),
  INDEX idx_version (csi_version)
);

-- Data Source Ingestion Log
CREATE TABLE data_source_ingestion_log (
  log_id UUID PRIMARY KEY,
  source_id VARCHAR(100) NOT NULL,
  ingestion_start TIMESTAMP NOT NULL,
  ingestion_end TIMESTAMP,
  items_fetched INTEGER,
  items_parsed INTEGER,
  items_stored INTEGER,
  errors JSONB,
  status VARCHAR(20) NOT NULL, -- SUCCESS, PARTIAL, FAILED
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_source_id (source_id),
  INDEX idx_ingestion_start (ingestion_start)
);
```

### 4.3 API Endpoints (New)

```typescript
// Event Lifecycle Management
POST   /api/v2/events/candidates          // Create candidate event
GET    /api/v2/events/candidates/:id      // Get candidate details
PATCH  /api/v2/events/candidates/:id      // Update lifecycle state
GET    /api/v2/events/candidates          // List candidates (filterable)

// Signal Management
POST   /api/v2/signals                    // Create signal
GET    /api/v2/signals/:id                // Get signal details
GET    /api/v2/signals                    // List signals (filterable)

// CSI v2.0 Endpoints
GET    /api/v2/csi/:country               // Get CSI for country (v2.0)
GET    /api/v2/csi/:country/history       // Get CSI time series
GET    /api/v2/csi/:country/breakdown     // Get CSI by vector
GET    /api/v2/csi/:country/events        // Get events affecting CSI
GET    /api/v2/csi/:country/audit         // Get audit trail

// Vector Analytics
GET    /api/v2/vectors/:vector/countries  // Countries by vector exposure
GET    /api/v2/vectors/:vector/events     // Events by vector

// Data Source Status
GET    /api/v2/sources                    // List all sources
GET    /api/v2/sources/:id/status         // Source health check
GET    /api/v2/sources/:id/ingestion-log  // Ingestion history
```

### 4.4 Event Lifecycle State Machine

```typescript
enum EventLifecycleState {
  DETECTED = 'DETECTED',           // Initial signal detected
  PROVISIONAL = 'PROVISIONAL',     // Corroborated, persistent
  CONFIRMED = 'CONFIRMED',         // Authoritative source confirmed
  RESOLVED = 'RESOLVED'            // Event concluded, fully decayed
}

interface StateTransition {
  from: EventLifecycleState;
  to: EventLifecycleState;
  conditions: TransitionCondition[];
  actions: TransitionAction[];
}

// Example transitions
const transitions: StateTransition[] = [
  {
    from: 'DETECTED',
    to: 'PROVISIONAL',
    conditions: [
      { type: 'corroboration', minSources: 2 },
      { type: 'persistence', minHours: 48 },
      { type: 'credibility', minScore: 0.7 }
    ],
    actions: [
      { type: 'apply_baseline_drift' },
      { type: 'notify_analysts' }
    ]
  },
  {
    from: 'PROVISIONAL',
    to: 'CONFIRMED',
    conditions: [
      { type: 'authoritative_source', required: true }
    ],
    actions: [
      { type: 'net_baseline_drift' },
      { type: 'apply_event_csi_delta' },
      { type: 'create_audit_entry' }
    ]
  },
  {
    from: 'CONFIRMED',
    to: 'RESOLVED',
    conditions: [
      { type: 'decay_complete', threshold: 0.01 }
    ],
    actions: [
      { type: 'archive_event' },
      { type: 'update_csi_final' }
    ]
  }
];
```

---

## 5. DATA SOURCE INTEGRATION

### 5.1 Global Detection Sources (Layer 1)

**Implementation per Appendix B, Section 3**

#### 5.1.1 GDELT Integration (CRITICAL)

**Overview:**
- Primary real-time backbone for global event detection
- 15-minute batch updates
- 100+ million events/year
- Free, open-source

**Technical Approach:**
```python
# GDELT Ingestion Pipeline (Python)
import requests
import pandas as pd
from datetime import datetime, timedelta

class GDELTIngestion:
    BASE_URL = "http://data.gdeltproject.org/gdeltv2/"
    
    def fetch_latest_batch(self):
        """Fetch last 15 minutes of GDELT data"""
        now = datetime.utcnow()
        batch_time = now - timedelta(minutes=15)
        filename = f"{batch_time.strftime('%Y%m%d%H%M%S')}.export.CSV.zip"
        url = f"{self.BASE_URL}{filename}"
        
        # Download and parse
        df = pd.read_csv(url, compression='zip', sep='\t', header=None)
        return self.parse_gdelt_events(df)
    
    def parse_gdelt_events(self, df):
        """Parse GDELT format into structured events"""
        events = []
        for _, row in df.iterrows():
            event = {
                'event_id': row[0],
                'event_date': row[1],
                'actor1_country': row[7],
                'actor2_country': row[17],
                'event_code': row[26],
                'goldstein_scale': row[30],
                'num_mentions': row[31],
                'num_sources': row[32],
                'source_url': row[57]
            }
            events.append(event)
        return events
    
    def route_to_vectors(self, event):
        """Map GDELT event codes to CSI vectors"""
        event_code = event['event_code']
        
        # GDELT CAMEO codes → CSI vectors
        vector_mapping = {
            '14': 'SC1',  # Protest
            '17': 'SC1',  # Coerce
            '18': 'SC1',  # Assault
            '19': 'SC1',  # Fight
            '20': 'SC1',  # Use unconventional mass violence
            '04': 'SC2',  # Consult, negotiate
            '06': 'SC3',  # Economic cooperation
            '16': 'SC3',  # Reduce relations
            # ... (full mapping in implementation)
        }
        
        return vector_mapping.get(event_code[:2], None)
```

**Deployment:**
- Airflow DAG for 15-minute batch ingestion
- Kafka topic: `gdelt-raw-events`
- Processing: Python worker pool (4 workers)
- Storage: PostgreSQL `escalation_signals` table

**Success Metrics:**
- ✅ <5 minute latency from GDELT publish to ingestion
- ✅ >95% parsing success rate
- ✅ >90% vector routing accuracy

---

#### 5.1.2 News Wire Integration

**Sources:**
- Reuters (free RSS)
- Associated Press (commercial API)
- BBC World News (free RSS)
- Al Jazeera (free RSS)
- Deutsche Welle (free RSS)
- France 24 (free RSS)
- UN News (free RSS)

**Technical Approach:**
```typescript
// RSS Feed Ingestion (TypeScript)
import Parser from 'rss-parser';
import { EventEmitter } from 'events';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  categories: string[];
}

class NewsWireIngestion extends EventEmitter {
  private parser: Parser;
  private sources: Map<string, string>; // source_id → RSS URL
  
  constructor() {
    super();
    this.parser = new Parser();
    this.sources = new Map([
      ['reuters', 'https://www.reuters.com/rssfeed/worldNews'],
      ['bbc', 'http://feeds.bbci.co.uk/news/world/rss.xml'],
      ['aljazeera', 'https://www.aljazeera.com/xml/rss/all.xml'],
      // ... (full list)
    ]);
  }
  
  async ingestAll(): Promise<void> {
    const promises = Array.from(this.sources.entries()).map(
      ([sourceId, url]) => this.ingestSource(sourceId, url)
    );
    await Promise.all(promises);
  }
  
  async ingestSource(sourceId: string, url: string): Promise<void> {
    try {
      const feed = await this.parser.parseURL(url);
      const articles = feed.items.map(item => this.parseArticle(item, sourceId));
      
      // Emit for downstream processing
      this.emit('articles', articles);
      
      // Log ingestion
      await this.logIngestion(sourceId, articles.length);
    } catch (error) {
      console.error(`Failed to ingest ${sourceId}:`, error);
      await this.logIngestionError(sourceId, error);
    }
  }
  
  private parseArticle(item: any, source: string): NewsArticle {
    return {
      title: item.title,
      description: item.contentSnippet || item.description,
      link: item.link,
      pubDate: new Date(item.pubDate),
      source,
      categories: item.categories || []
    };
  }
}
```

**Deployment:**
- Cron job: Every 15 minutes
- Kafka topic: `news-wire-articles`
- Processing: Node.js worker pool (2 workers)
- Storage: PostgreSQL `escalation_signals` table

---

### 5.2 Authoritative Confirmation Sources (Layer 3)

**Implementation per Appendix B, Section 4**

#### 5.2.1 SC1 (Conflict & Security)

**Sources:**
- UN Security Council resolutions
- Official military announcements (MoD/DoD)
- Government gazettes (emergency declarations)
- UCDP (Uppsala Conflict Data Program)
- ACLED (Armed Conflict Location & Event Data)

**Integration:**
```typescript
interface AuthoritativeSource {
  sourceId: string;
  vector: string;
  url: string;
  checkFrequency: number; // hours
  parser: (data: any) => ConfirmationEvent[];
}

const SC1_SOURCES: AuthoritativeSource[] = [
  {
    sourceId: 'un-security-council',
    vector: 'SC1',
    url: 'https://www.un.org/securitycouncil/content/resolutions',
    checkFrequency: 1,
    parser: parseUNResolutions
  },
  {
    sourceId: 'us-dod',
    vector: 'SC1',
    url: 'https://www.defense.gov/News/Releases/',
    checkFrequency: 1,
    parser: parseDoDReleases
  },
  // ... (full list)
];
```

#### 5.2.2 SC2 (Sanctions & Regulatory Pressure)

**Sources:**
- OFAC RSS (US Treasury)
- EU Official Journal
- UK OFSI consolidated list
- UN Security Council sanctions
- Global Affairs Canada sanctions

**Integration:**
```typescript
const SC2_SOURCES: AuthoritativeSource[] = [
  {
    sourceId: 'ofac-sanctions',
    vector: 'SC2',
    url: 'https://ofac.treasury.gov/rss.xml',
    checkFrequency: 1,
    parser: parseOFACSanctions
  },
  {
    sourceId: 'eu-official-journal',
    vector: 'SC2',
    url: 'https://eur-lex.europa.eu/oj/direct-access.html',
    checkFrequency: 1,
    parser: parseEUOfficialJournal
  },
  // ... (full list)
];
```

#### 5.2.3 SC3 (Trade & Logistics Disruption)

**Sources:**
- USTR press releases
- US BIS export control notices
- EU trade policy releases
- China MOFCOM announcements
- China Customs notices
- WTO dispute filings

**Integration:**
```typescript
const SC3_SOURCES: AuthoritativeSource[] = [
  {
    sourceId: 'ustr',
    vector: 'SC3',
    url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
    checkFrequency: 1,
    parser: parseUSTRReleases
  },
  {
    sourceId: 'bis-export-controls',
    vector: 'SC3',
    url: 'https://www.bis.doc.gov/index.php/documents/rss',
    checkFrequency: 1,
    parser: parseBISNotices
  },
  {
    sourceId: 'china-mofcom',
    vector: 'SC3',
    url: 'http://english.mofcom.gov.cn/rss/LatestNews.xml',
    checkFrequency: 1,
    parser: parseMOFCOMAnnouncements
  },
  // ... (full list)
];
```

#### 5.2.4 SC4 (Governance & Rule of Law)

**Sources:**
- Official election commissions
- Government gazettes (emergency decrees)
- Court/constitutional rulings

#### 5.2.5 SC5 (Cyber & Data Sovereignty)

**Sources:**
- CISA advisories
- ENISA bulletins
- Official government cyber incident statements

#### 5.2.6 SC6 (Public Unrest & Labor Instability)

**Sources:**
- Official emergency declarations
- Interior ministry/police announcements

#### 5.2.7 SC7 (Currency & Capital Controls)

**Sources:**
- Central bank circulars
- Finance ministry decrees
- IMF notifications

---

### 5.3 Data Source Summary

**Total Sources: 45+**

| Category | Count | Examples |
|----------|-------|----------|
| Global Detection | 10 | GDELT, Reuters, AP, BBC, UN News |
| SC1 Authoritative | 5 | UN Security Council, MoD, UCDP |
| SC2 Authoritative | 5 | OFAC, EU Official Journal, UN Sanctions |
| SC3 Authoritative | 6 | USTR, BIS, MOFCOM, WTO |
| SC4 Authoritative | 4 | Election commissions, gazettes |
| SC5 Authoritative | 3 | CISA, ENISA, NetBlocks |
| SC6 Authoritative | 3 | Emergency declarations, ACLED |
| SC7 Authoritative | 4 | Central banks, IMF |
| Structural Baseline | 5 | World Bank WGI, Freedom House, V-Dem |

---

## 6. VECTOR ROUTING LOGIC

### 6.1 Vector Definitions

**Per Appendix B, Section 4**

```typescript
enum RiskVector {
  SC1 = 'SC1', // Conflict & Security
  SC2 = 'SC2', // Sanctions & Regulatory Pressure
  SC3 = 'SC3', // Trade & Logistics Disruption
  SC4 = 'SC4', // Governance & Rule of Law
  SC5 = 'SC5', // Cyber & Data Sovereignty
  SC6 = 'SC6', // Public Unrest & Labor Instability
  SC7 = 'SC7'  // Currency & Capital Controls
}

interface VectorRoutingRule {
  vector: RiskVector;
  keywords: string[];
  eventTypes: string[];
  actorTypes: string[];
  priority: number;
}
```

### 6.2 Routing Rules

```typescript
const VECTOR_ROUTING_RULES: VectorRoutingRule[] = [
  // SC1: Conflict & Security
  {
    vector: 'SC1',
    keywords: [
      'military', 'conflict', 'war', 'armed', 'combat', 'troops',
      'invasion', 'attack', 'missile', 'bombing', 'ceasefire',
      'peacekeeping', 'defense', 'security threat'
    ],
    eventTypes: [
      'military_action', 'armed_conflict', 'border_clash',
      'terrorist_attack', 'coup_attempt', 'civil_war'
    ],
    actorTypes: ['military', 'armed_group', 'defense_ministry'],
    priority: 100
  },
  
  // SC2: Sanctions & Regulatory Pressure
  {
    vector: 'SC2',
    keywords: [
      'sanctions', 'embargo', 'blacklist', 'entity list',
      'export controls', 'asset freeze', 'travel ban',
      'designated', 'sanctioned', 'restricted'
    ],
    eventTypes: [
      'sanctions_imposed', 'sanctions_lifted', 'entity_listed',
      'regulatory_action', 'compliance_violation'
    ],
    actorTypes: ['treasury', 'ofac', 'foreign_ministry', 'eu_commission'],
    priority: 95
  },
  
  // SC3: Trade & Logistics Disruption
  {
    vector: 'SC3',
    keywords: [
      'tariff', 'trade war', 'import ban', 'export restriction',
      'quota', 'customs', 'supply chain', 'logistics',
      'trade agreement', 'wto', 'trade dispute'
    ],
    eventTypes: [
      'tariff_imposed', 'trade_restriction', 'import_ban',
      'export_control', 'trade_agreement_signed', 'wto_dispute'
    ],
    actorTypes: ['trade_ministry', 'customs', 'ustr', 'mofcom'],
    priority: 90
  },
  
  // SC4: Governance & Rule of Law
  {
    vector: 'SC4',
    keywords: [
      'election', 'coup', 'constitution', 'democracy',
      'authoritarian', 'corruption', 'rule of law',
      'judicial', 'legislature', 'parliament', 'government collapse'
    ],
    eventTypes: [
      'election_held', 'coup_attempt', 'constitutional_crisis',
      'government_change', 'corruption_scandal', 'judicial_ruling'
    ],
    actorTypes: ['government', 'election_commission', 'judiciary'],
    priority: 85
  },
  
  // SC5: Cyber & Data Sovereignty
  {
    vector: 'SC5',
    keywords: [
      'cyber attack', 'hacking', 'data breach', 'ransomware',
      'internet shutdown', 'data localization', 'privacy',
      'surveillance', 'encryption', 'cyber espionage'
    ],
    eventTypes: [
      'cyber_attack', 'data_breach', 'internet_shutdown',
      'data_localization_law', 'surveillance_program'
    ],
    actorTypes: ['cyber_agency', 'intelligence', 'tech_regulator'],
    priority: 80
  },
  
  // SC6: Public Unrest & Labor Instability
  {
    vector: 'SC6',
    keywords: [
      'protest', 'riot', 'strike', 'demonstration',
      'civil unrest', 'labor dispute', 'social movement',
      'emergency declaration', 'curfew', 'state of emergency'
    ],
    eventTypes: [
      'mass_protest', 'general_strike', 'riot',
      'emergency_declared', 'curfew_imposed'
    ],
    actorTypes: ['interior_ministry', 'police', 'labor_union'],
    priority: 75
  },
  
  // SC7: Currency & Capital Controls
  {
    vector: 'SC7',
    keywords: [
      'currency', 'capital controls', 'foreign exchange',
      'devaluation', 'central bank', 'monetary policy',
      'capital flight', 'currency crisis', 'forex'
    ],
    eventTypes: [
      'capital_controls_imposed', 'currency_devaluation',
      'central_bank_intervention', 'forex_restrictions'
    ],
    actorTypes: ['central_bank', 'finance_ministry', 'imf'],
    priority: 70
  }
];
```

### 6.3 Routing Algorithm

```typescript
class VectorRouter {
  route(signal: EscalationSignal): VectorAssignment {
    const scores = new Map<RiskVector, number>();
    
    // Score each vector
    for (const rule of VECTOR_ROUTING_RULES) {
      let score = 0;
      
      // Keyword matching
      const text = `${signal.title} ${signal.description}`.toLowerCase();
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      // Event type matching
      if (rule.eventTypes.includes(signal.eventType)) {
        score += 50;
      }
      
      // Actor type matching
      if (rule.actorTypes.includes(signal.actorType)) {
        score += 30;
      }
      
      // Source priority boost
      if (signal.sourceType === 'authoritative') {
        score *= 1.5;
      }
      
      scores.set(rule.vector, score);
    }
    
    // Select primary and secondary vectors
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      primary: sorted[0][0],
      secondary: sorted[1][1] > 20 ? sorted[1][0] : null,
      confidence: sorted[0][1] / 100
    };
  }
}
```

### 6.4 Validation Rules

**Per Appendix B, Section 6**

```typescript
interface ValidationRule {
  name: string;
  check: (signal: EscalationSignal) => boolean;
  weight: number;
}

const VALIDATION_RULES: ValidationRule[] = [
  // Corroboration: ≥2 independent sources
  {
    name: 'corroboration',
    check: (signal) => signal.corroborationCount >= 2,
    weight: 1.0
  },
  
  // Persistence: 48-72 hour threshold
  {
    name: 'persistence',
    check: (signal) => signal.persistenceHours >= 48,
    weight: 0.8
  },
  
  // Credibility: Source reliability score
  {
    name: 'credibility',
    check: (signal) => signal.credibilityScore >= 0.7,
    weight: 0.6
  },
  
  // Recency: Not stale (< 7 days old)
  {
    name: 'recency',
    check: (signal) => {
      const age = Date.now() - signal.detectedAt.getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    },
    weight: 0.4
  }
];

function validateSignal(signal: EscalationSignal): boolean {
  let totalWeight = 0;
  let passedWeight = 0;
  
  for (const rule of VALIDATION_RULES) {
    totalWeight += rule.weight;
    if (rule.check(signal)) {
      passedWeight += rule.weight;
    }
  }
  
  // Pass if >70% of weighted rules pass
  return (passedWeight / totalWeight) >= 0.7;
}
```

---

## 7. CSI RECALIBRATION PROCESS

### 7.1 Baseline Freeze

**Step 1: Select Cut Date**
- **Recommended:** January 1, 2024
- **Rationale:** Recent enough for validation, far enough for historical context

**Step 2: Compute Structural Baseline**

```typescript
interface StructuralBaseline {
  country: string;
  cutDate: Date;
  components: {
    governance: number;        // World Bank WGI
    ruleOfLaw: number;         // World Justice Project
    democracy: number;         // Freedom House, V-Dem
    sanctions: number;         // Standing sanctions regimes
    capitalControls: number;   // IMF AREAER
    conflictHistory: number;   // UCDP, ACLED baselines
    cyberSovereignty: number;  // Freedom on the Net
  };
  baselineCSI: number;
}

async function computeStructuralBaseline(
  country: string,
  cutDate: Date
): Promise<StructuralBaseline> {
  // Fetch slow-moving indicators as of cut date
  const governance = await fetchWGI(country, cutDate);
  const ruleOfLaw = await fetchWJP(country, cutDate);
  const democracy = await fetchFreedomHouse(country, cutDate);
  const sanctions = await fetchSanctionsRegime(country, cutDate);
  const capitalControls = await fetchIMFAREAER(country, cutDate);
  const conflictHistory = await fetchUCDP(country, cutDate);
  const cyberSovereignty = await fetchFreedomNet(country, cutDate);
  
  // Weighted average
  const baselineCSI = (
    governance * 0.20 +
    ruleOfLaw * 0.15 +
    democracy * 0.15 +
    sanctions * 0.15 +
    capitalControls * 0.10 +
    conflictHistory * 0.15 +
    cyberSovereignty * 0.10
  );
  
  return {
    country,
    cutDate,
    components: {
      governance,
      ruleOfLaw,
      democracy,
      sanctions,
      capitalControls,
      conflictHistory,
      cyberSovereignty
    },
    baselineCSI
  };
}
```

### 7.2 Replay Forward

**Step 3: Daily Batch Processing**

```typescript
async function replayForward(
  startDate: Date,
  endDate: Date
): Promise<void> {
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    console.log(`Processing ${currentDate.toISOString()}`);
    
    // 1. Ingest high-frequency sources for this day
    const signals = await ingestDailySignals(currentDate);
    
    // 2. Parse and structure candidates
    const candidates = signals.map(parseSignal);
    
    // 3. Apply persistence and corroboration rules
    const validated = candidates.filter(validateSignal);
    
    // 4. Route to vectors
    const routed = validated.map(routeToVector);
    
    // 5. Apply baseline drift for provisional events
    for (const event of routed) {
      if (event.lifecycleState === 'PROVISIONAL') {
        await applyBaselineDrift(event, currentDate);
      }
    }
    
    // 6. Check for authoritative confirmations
    const confirmations = await checkAuthoritativeSources(currentDate);
    for (const confirmation of confirmations) {
      await confirmEvent(confirmation, currentDate);
    }
    
    // 7. Update CSI for all countries
    await updateCSIForDate(currentDate);
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
  }
}
```

### 7.3 Validation Checklist

**Step 4: Known Events Validation**

```typescript
interface KnownEvent {
  date: Date;
  country: string;
  vector: RiskVector;
  description: string;
  expectedDetection: boolean;
  expectedConfirmation: boolean;
  expectedCSIImpact: number;
}

const VALIDATION_EVENTS: KnownEvent[] = [
  // US-China Trade
  {
    date: new Date('2024-03-15'),
    country: 'CHN',
    vector: 'SC3',
    description: 'US announces 25% tariffs on Chinese EVs',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 5.2
  },
  
  // Russia Sanctions
  {
    date: new Date('2024-06-20'),
    country: 'RUS',
    vector: 'SC2',
    description: 'EU 14th sanctions package',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 3.8
  },
  
  // Middle East Conflict
  {
    date: new Date('2024-10-07'),
    country: 'ISR',
    vector: 'SC1',
    description: 'Major military escalation',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 8.5
  },
  
  // ... (20+ total validation events)
];

async function validateRecalibration(): Promise<ValidationReport> {
  const results = [];
  
  for (const event of VALIDATION_EVENTS) {
    // Check detection
    const detected = await checkDetection(event);
    
    // Check confirmation
    const confirmed = await checkConfirmation(event);
    
    // Check CSI impact
    const actualImpact = await getCSIImpact(event);
    
    results.push({
      event,
      detected,
      confirmed,
      actualImpact,
      impactError: Math.abs(actualImpact - event.expectedCSIImpact)
    });
  }
  
  // Calculate metrics
  const detectionRate = results.filter(r => r.detected).length / results.length;
  const confirmationRate = results.filter(r => r.confirmed).length / results.length;
  const avgImpactError = results.reduce((sum, r) => sum + r.impactError, 0) / results.length;
  
  return {
    detectionRate,
    confirmationRate,
    avgImpactError,
    results
  };
}
```

### 7.4 Version and Lock

**Step 5: Finalize CSI v2.0**

```sql
-- Version all CSI outputs
INSERT INTO csi_time_series (country, date, csi_version, structural_baseline, escalation_drift, event_csi_delta, csi_total)
SELECT 
  country,
  date,
  'v2.0' as csi_version,
  structural_baseline,
  escalation_drift,
  event_csi_delta,
  (structural_baseline + escalation_drift + event_csi_delta) as csi_total
FROM csi_recalibration_temp
WHERE date >= '2024-01-01';

-- Lock baseline
UPDATE structural_baselines
SET locked = true, locked_at = NOW()
WHERE cut_date = '2024-01-01';

-- Archive ledgers
CREATE TABLE escalation_signals_v2 AS SELECT * FROM escalation_signals;
CREATE TABLE event_candidates_v2 AS SELECT * FROM event_candidates;
CREATE TABLE event_csi_delta_ledger_v2 AS SELECT * FROM event_csi_delta_ledger;
```

---

## 8. UI/UX ENHANCEMENTS

### 8.1 Global CSI Heat Map

**Component:** `src/pages/GlobalCSIHeatMap.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from '@/components/ui/tooltip';

interface CountryCSI {
  country: string;
  csi: number;
  riskBand: 'low' | 'medium' | 'high' | 'critical';
  recentEvents: number;
}

export const GlobalCSIHeatMap: React.FC = () => {
  const [data, setData] = useState<CountryCSI[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCSIData().then(setData);
  }, []);
  
  const colorScale = scaleLinear<string>()
    .domain([0, 25, 50, 75, 100])
    .range(['#10b981', '#fbbf24', '#f97316', '#ef4444', '#7f1d1d']);
  
  return (
    <div className="w-full h-screen">
      <h1 className="text-3xl font-bold mb-4">Global Country Shock Index</h1>
      
      <ComposableMap>
        <Geographies geography="/world-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryData = data.find(d => d.country === geo.id);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={countryData ? colorScale(countryData.csi) : '#e5e7eb'}
                  stroke="#fff"
                  strokeWidth={0.5}
                  onMouseEnter={() => setSelectedCountry(geo.id)}
                  onMouseLeave={() => setSelectedCountry(null)}
                  onClick={() => navigateToCountry(geo.id)}
                  style={{
                    hover: { fill: '#3b82f6', cursor: 'pointer' }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      {selectedCountry && (
        <Tooltip>
          <CountryQuickStats country={selectedCountry} />
        </Tooltip>
      )}
    </div>
  );
};
```

### 8.2 Country-Specific CSI Page

**Component:** `src/pages/CountryCSIPage.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const CountryCSIPage: React.FC = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [csiData, setCSIData] = useState<CSITimeSeries[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [vectorBreakdown, setVectorBreakdown] = useState<VectorBreakdown>({});
  
  useEffect(() => {
    fetchCountryData(countryCode).then(data => {
      setCSIData(data.timeSeries);
      setEvents(data.events);
      setVectorBreakdown(data.vectorBreakdown);
    });
  }, [countryCode]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        {getCountryName(countryCode)} - Country Shock Index
      </h1>
      
      {/* Current CSI Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current CSI Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold text-center">
            {csiData[csiData.length - 1]?.csi.toFixed(1)}
          </div>
          <div className="text-center text-muted-foreground">
            Risk Band: {getRiskBand(csiData[csiData.length - 1]?.csi)}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="timeseries">
        <TabsList>
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="vectors">Vector Breakdown</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        
        {/* Time Series Chart */}
        <TabsContent value="timeseries">
          <Card>
            <CardHeader>
              <CardTitle>CSI Historical Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart width={1000} height={400} data={csiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="structural_baseline" stroke="#8884d8" name="Structural Baseline" />
                <Line type="monotone" dataKey="escalation_drift" stroke="#fbbf24" name="Escalation Drift" />
                <Line type="monotone" dataKey="event_csi_delta" stroke="#ef4444" name="Event Shocks" />
                <Line type="monotone" dataKey="csi_total" stroke="#10b981" strokeWidth={3} name="Total CSI" />
              </LineChart>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recent Events */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Geopolitical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTimeline events={events} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Vector Breakdown */}
        <TabsContent value="vectors">
          <Card>
            <CardHeader>
              <CardTitle>Risk Vector Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <VectorBreakdownChart data={vectorBreakdown} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Audit Trail */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>CSI Movement Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTrailTable countryCode={countryCode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 8.3 Event Explorer

**Component:** `src/pages/EventExplorer.tsx`

```typescript
import React, { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const EventExplorer: React.FC = () => {
  const [filters, setFilters] = useState({
    country: '',
    vector: '',
    lifecycleState: '',
    dateRange: { start: null, end: null }
  });
  
  const columns = [
    { header: 'Event ID', accessor: 'eventId' },
    { header: 'Date', accessor: 'detectedAt' },
    { header: 'Country', accessor: 'targetCountry' },
    { header: 'Vector', accessor: 'vectorPrimary' },
    { 
      header: 'Lifecycle State',
      accessor: 'lifecycleState',
      cell: (value) => (
        <Badge variant={getStateVariant(value)}>
          {value}
        </Badge>
      )
    },
    { header: 'Event Type', accessor: 'eventType' },
    { header: 'Sources', accessor: 'corroborationCount' },
    { 
      header: 'Actions',
      cell: (row) => (
        <Button onClick={() => viewEventDetails(row.eventId)}>
          View Details
        </Button>
      )
    }
  ];
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Event Explorer</h1>
      
      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Search country..."
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
        />
        <Select
          value={filters.vector}
          onChange={(value) => setFilters({ ...filters, vector: value })}
        >
          <option value="">All Vectors</option>
          <option value="SC1">SC1 - Conflict</option>
          <option value="SC2">SC2 - Sanctions</option>
          <option value="SC3">SC3 - Trade</option>
          <option value="SC4">SC4 - Governance</option>
          <option value="SC5">SC5 - Cyber</option>
          <option value="SC6">SC6 - Unrest</option>
          <option value="SC7">SC7 - Currency</option>
        </Select>
        <Select
          value={filters.lifecycleState}
          onChange={(value) => setFilters({ ...filters, lifecycleState: value })}
        >
          <option value="">All States</option>
          <option value="DETECTED">Detected</option>
          <option value="PROVISIONAL">Provisional</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
        <DateRangePicker
          value={filters.dateRange}
          onChange={(range) => setFilters({ ...filters, dateRange: range })}
        />
      </div>
      
      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        pagination
        sortable
      />
    </div>
  );
};
```

### 8.4 Risk Alerts Dashboard

**Component:** `src/pages/RiskAlertsDashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, Info } from 'lucide-react';

interface RiskAlert {
  id: string;
  timestamp: Date;
  country: string;
  vector: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  csiImpact: number;
}

export const RiskAlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [preferences, setPreferences] = useState({
    minSeverity: 'medium',
    vectors: ['SC1', 'SC2', 'SC3'],
    countries: ['USA', 'CHN', 'RUS']
  });
  
  useEffect(() => {
    // WebSocket connection for real-time alerts
    const ws = new WebSocket('wss://api.example.com/alerts');
    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      if (shouldShowAlert(alert, preferences)) {
        setAlerts(prev => [alert, ...prev]);
        showNotification(alert);
      }
    };
    return () => ws.close();
  }, [preferences]);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Risk Alerts</h1>
        <Button onClick={() => openPreferences()}>
          <Bell className="mr-2" />
          Configure Alerts
        </Button>
      </div>
      
      {/* Active Alerts */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {alert.country} - {alert.vector}: {alert.title}
            </AlertTitle>
            <AlertDescription>
              {alert.description}
              <div className="mt-2 text-sm">
                CSI Impact: +{alert.csiImpact.toFixed(1)} | {formatTimestamp(alert.timestamp)}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};
```

---

## 9. TESTING & VALIDATION

### 9.1 Unit Tests

**Coverage Target: >90%**

```typescript
// Example: Vector Routing Tests
describe('VectorRouter', () => {
  let router: VectorRouter;
  
  beforeEach(() => {
    router = new VectorRouter();
  });
  
  test('should route tariff threat to SC3', () => {
    const signal = {
      title: 'US threatens 25% tariffs on Chinese EVs',
      description: 'Trade tensions escalate...',
      eventType: 'tariff_threat'
    };
    
    const result = router.route(signal);
    expect(result.primary).toBe('SC3');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  test('should route sanctions to SC2', () => {
    const signal = {
      title: 'EU imposes new sanctions on Russia',
      description: 'Targeting energy sector...',
      eventType: 'sanctions_imposed'
    };
    
    const result = router.route(signal);
    expect(result.primary).toBe('SC2');
  });
  
  test('should handle ambiguous signals', () => {
    const signal = {
      title: 'Country X faces economic pressure',
      description: 'Multiple factors at play...',
      eventType: 'general_risk'
    };
    
    const result = router.route(signal);
    expect(result.confidence).toBeLessThan(0.6);
  });
});
```

### 9.2 Integration Tests

```typescript
describe('Event Lifecycle Integration', () => {
  test('complete lifecycle: detection → confirmation', async () => {
    // 1. Detect signal
    const signal = await ingestSignal({
      source: 'reuters',
      content: 'Breaking: Country X imposes capital controls'
    });
    expect(signal.lifecycleState).toBe('DETECTED');
    
    // 2. Corroborate (2nd source)
    await ingestSignal({
      source: 'bloomberg',
      content: 'Country X restricts foreign exchange'
    });
    
    const event = await getEventCandidate(signal.eventId);
    expect(event.lifecycleState).toBe('PROVISIONAL');
    expect(event.baselineDriftApplied).toBe(true);
    
    // 3. Confirm via authoritative source
    await ingestSignal({
      source: 'central-bank-x',
      content: 'Official circular: Capital controls effective immediately'
    });
    
    const confirmedEvent = await getEventCandidate(signal.eventId);
    expect(confirmedEvent.lifecycleState).toBe('CONFIRMED');
    expect(confirmedEvent.eventCSIDelta).toBeGreaterThan(0);
    
    // 4. Verify CSI updated
    const csi = await getCSI('X');
    expect(csi.eventCSIDelta).toBe(confirmedEvent.eventCSIDelta);
  });
});
```

### 9.3 End-to-End Tests

```typescript
describe('CSI Recalibration E2E', () => {
  test('replay forward from baseline', async () => {
    // 1. Freeze baseline
    await freezeBaseline('2024-01-01');
    
    // 2. Replay 30 days
    await replayForward(
      new Date('2024-01-01'),
      new Date('2024-01-30')
    );
    
    // 3. Validate known events detected
    const usaChinaTariffs = await getEvent({
      country: 'CHN',
      date: '2024-01-15',
      type: 'tariff_threat'
    });
    expect(usaChinaTariffs).toBeDefined();
    expect(usaChinaTariffs.lifecycleState).toBe('CONFIRMED');
    
    // 4. Validate CSI movement
    const csiChina = await getCSITimeSeries('CHN', '2024-01-01', '2024-01-30');
    expect(csiChina.some(d => d.escalationDrift > 0)).toBe(true);
  });
});
```

### 9.4 Performance Tests

```typescript
describe('Performance Benchmarks', () => {
  test('GDELT batch ingestion < 5 minutes', async () => {
    const start = Date.now();
    await ingestGDELTBatch(); // ~10K events
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5 * 60 * 1000);
  });
  
  test('vector routing < 100ms per signal', async () => {
    const signal = createTestSignal();
    const start = Date.now();
    await router.route(signal);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
  
  test('CSI calculation < 500ms for 195 countries', async () => {
    const start = Date.now();
    await calculateCSIForAllCountries();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

### 9.5 Validation Against Known Events

```typescript
const VALIDATION_SUITE = [
  {
    name: 'US-China Tariffs (March 2024)',
    expectedDetection: true,
    expectedVector: 'SC3',
    expectedCSIImpact: 5.2,
    tolerance: 0.5
  },
  {
    name: 'EU Russia Sanctions (June 2024)',
    expectedDetection: true,
    expectedVector: 'SC2',
    expectedCSIImpact: 3.8,
    tolerance: 0.5
  },
  // ... (20+ events)
];

async function runValidationSuite(): Promise<ValidationReport> {
  const results = [];
  
  for (const test of VALIDATION_SUITE) {
    const actual = await getActualEvent(test);
    const passed = (
      actual.detected === test.expectedDetection &&
      actual.vector === test.expectedVector &&
      Math.abs(actual.csiImpact - test.expectedCSIImpact) <= test.tolerance
    );
    
    results.push({ test, actual, passed });
  }
  
  const passRate = results.filter(r => r.passed).length / results.length;
  return { passRate, results };
}
```

---

## 10. RESOURCE ALLOCATION

### 10.1 Team Structure

**Core Team (4 FTEs)**

| Role | Responsibilities | Allocation | Duration |
|------|-----------------|------------|----------|
| **Senior Backend Engineer** | Event lifecycle, vector routing, CSI recalibration | 100% | 20 weeks |
| **Data Engineer** | Data source integration, GDELT pipeline, parsing logic | 100% | 20 weeks |
| **Frontend Engineer** | UI/UX enhancements, heat map, country pages | 100% | 12 weeks (Weeks 9-20) |
| **QA Engineer** | Testing, validation, performance benchmarking | 100% | 20 weeks |

**Supporting Roles (Part-Time)**

| Role | Responsibilities | Allocation | Duration |
|------|-----------------|------------|----------|
| **DevOps Engineer** | Infrastructure, Kafka, Airflow, monitoring | 50% | 20 weeks |
| **Data Analyst** | Validation suite, known events checklist | 25% | 8 weeks (Weeks 13-20) |
| **Technical Writer** | Documentation, API reference | 25% | 8 weeks (Weeks 13-20) |

### 10.2 Budget Breakdown

**Personnel Costs (20 weeks)**

| Role | Rate | Allocation | Total |
|------|------|------------|-------|
| Senior Backend Engineer | $150/hr | 800 hrs | $120,000 |
| Data Engineer | $140/hr | 800 hrs | $112,000 |
| Frontend Engineer | $130/hr | 480 hrs | $62,400 |
| QA Engineer | $120/hr | 800 hrs | $96,000 |
| DevOps Engineer (50%) | $140/hr | 400 hrs | $56,000 |
| Data Analyst (25%) | $100/hr | 160 hrs | $16,000 |
| Technical Writer (25%) | $80/hr | 160 hrs | $12,800 |
| **Subtotal** | | | **$475,200** |

**Data/API Costs (Annual)**

| Source | Type | Cost |
|--------|------|------|
| GDELT | Free | $0 |
| Reuters RSS | Free (limited) | $0 |
| Associated Press API | Commercial | $25,000 |
| Authoritative sources | Mostly free | $0 |
| Premium sources (optional) | Commercial | $35,000 |
| **Subtotal** | | **$60,000** |

**Infrastructure Costs (Annual)**

| Service | Cost |
|---------|------|
| PostgreSQL expansion | $3,000 |
| Redis caching | $1,200 |
| Kafka cluster | $4,800 |
| Airflow orchestration | $2,400 |
| Monitoring (Prometheus, Grafana) | $1,200 |
| Additional storage | $1,200 |
| **Subtotal** | **$13,800** |

**Total Budget**
- **Development (One-Time):** $475,200
- **Operations (Annual):** $73,800
- **First Year Total:** $549,000

**Revised Budget (with 20% contingency):**
- **Development:** $570,000
- **Operations:** $88,000
- **First Year Total:** $658,000

### 10.3 Timeline & Milestones

```
Week 1-6: Phase 5A - Core Architecture
├── Week 1-2: Event lifecycle state machine
├── Week 3-4: Vector routing engine
├── Week 5: Persistence & corroboration rules
└── Week 6: Audit trail infrastructure
    Milestone: Core architecture complete, unit tests passing

Week 7-14: Phase 5B - Data Source Integration
├── Week 7-9: GDELT + Priority 1 sources
├── Week 10-12: Authoritative confirmation sources
└── Week 13-14: Vector-specific sources
    Milestone: 1000+ signals/day ingested, <5% false positives

Week 15-17: Phase 5C - CSI Recalibration
├── Week 15: Freeze baseline, initialize ledgers
├── Week 16: Replay forward (Jan 2024 - present)
└── Week 17: Validation against known events
    Milestone: CSI v2.0 recalibrated, >90% detection rate

Week 18-20: Phase 5D - UI/UX Enhancements
├── Week 18: Global heat map
├── Week 19: Country pages, event explorer
└── Week 20: Risk alerts, final testing
    Milestone: UI complete, user testing >85% satisfaction

Week 21: Production Deployment
└── Go-live, monitoring, support
    Milestone: Phase 5 complete, production stable
```

---

## 11. RISK MANAGEMENT

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **GDELT integration complexity** | Medium | High | Start early (Week 7), allocate 3 weeks, fallback to Reuters/AP only |
| **Data quality/noise** | High | Medium | Implement strict corroboration rules, tune thresholds iteratively |
| **Performance degradation** | Medium | Medium | Load testing from Week 10, optimize queries, add caching |
| **Source API rate limits** | Low | Medium | Implement exponential backoff, distribute requests, cache responses |
| **Vector routing accuracy** | Medium | High | Manual validation on 1000+ samples, adjust rules, A/B testing |

### 11.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **API access denied** | Low | High | Use open sources first, negotiate licenses early, have fallbacks |
| **Budget overrun** | Medium | Medium | 20% contingency, weekly budget reviews, scope management |
| **Timeline delays** | Medium | Medium | Buffer weeks built in, parallel workstreams, agile sprints |
| **User adoption low** | Low | High | User testing from Week 18, iterative feedback, training materials |
| **Regulatory compliance** | Low | High | Legal review of data sources, attribution compliance, privacy audit |

### 11.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Team turnover** | Low | High | Cross-training, documentation, knowledge sharing sessions |
| **Infrastructure outage** | Low | Medium | Multi-region deployment, automated failover, 24/7 monitoring |
| **Data source downtime** | Medium | Low | Multiple sources per vector, graceful degradation, alerting |
| **Security breach** | Low | High | Penetration testing, encryption, access controls, audit logs |

---

## 12. SUCCESS CRITERIA

### 12.1 Technical Success Criteria

**Phase 5A: Core Architecture**
- ✅ Event lifecycle state machine operational
- ✅ Vector routing >95% accurate (manual validation)
- ✅ Corroboration rules enforced correctly
- ✅ Full audit trail for every event
- ✅ Unit test coverage >90%

**Phase 5B: Data Source Integration**
- ✅ 1000+ signals/day ingested
- ✅ <5 minute latency from source to ingestion
- ✅ >99.5% uptime for critical sources
- ✅ <5% false positive rate after corroboration
- ✅ All 45+ sources operational

**Phase 5C: CSI Recalibration**
- ✅ All 195 countries recalibrated
- ✅ >90% of known events detected
- ✅ <10% false positive rate
- ✅ CSI movements match expected patterns
- ✅ Full audit trail for every CSI movement

**Phase 5D: UI/UX Enhancements**
- ✅ Heat map renders <2s
- ✅ Country pages load <1s
- ✅ WCAG 2.1 AA accessible
- ✅ Mobile responsive
- ✅ User testing >85% satisfaction

### 12.2 Business Success Criteria

**Year 1 (Post-Launch)**
- ✅ Platform uptime >99.9%
- ✅ User engagement +50% (time on platform)
- ✅ New user signups +30%
- ✅ Subscription upgrades +25%
- ✅ Customer satisfaction >4.5/5

**Year 2**
- ✅ Launch Country Risk Intelligence product
- ✅ Institutional clients +20
- ✅ Revenue from CSI v2.0 features >$500K
- ✅ ROI >300%

### 12.3 Product Success Criteria

**Competitive Positioning**
- ✅ Real-time detection faster than competitors
- ✅ Unique expectation-weighted methodology
- ✅ Full auditability (vs. black-box competitors)
- ✅ Broader source coverage (45+ vs. 10-20)

**User Value**
- ✅ Forward-looking insights (not just backward)
- ✅ Explainable CSI movements
- ✅ Actionable risk alerts
- ✅ Professional-grade analytics

---

## 13. APPENDICES

### Appendix A: Glossary

**Baseline CSI:** Static risk score based on slow-moving structural indicators (governance, rule of law, etc.)

**Escalation Drift:** Probability-weighted CSI adjustment for detected but unconfirmed escalation signals

**Event_CSI_Δ:** CSI shock from confirmed geopolitical events, net of prior escalation drift

**Lifecycle States:**
- **DETECTED:** Initial signal captured from high-frequency source
- **PROVISIONAL:** Signal corroborated (≥2 sources) and persistent (48-72hr)
- **CONFIRMED:** Event validated by authoritative jurisdiction-specific source
- **RESOLVED:** Event concluded, CSI impact fully decayed

**Risk Vectors (SC1-SC7):**
- **SC1:** Conflict & Security
- **SC2:** Sanctions & Regulatory Pressure
- **SC3:** Trade & Logistics Disruption
- **SC4:** Governance & Rule of Law
- **SC5:** Cyber & Data Sovereignty
- **SC6:** Public Unrest & Labor Instability
- **SC7:** Currency & Capital Controls

### Appendix B: Reference Documents

1. **Data Sources for CSI Enhancement** (attached)
2. **Appendix B: Data Sources, Vector Mapping, and Parsing Logic** (attached)
3. **Phase 1-4 Completion Reports** (existing)
4. **Current System Architecture** (existing)

### Appendix C: API Reference

See Technical Documentation (Section 4.3)

### Appendix D: Database Schema

See Technical Specifications (Section 4.2)

### Appendix E: Validation Checklist

See Testing & Validation (Section 9.5)

---

## APPROVAL & SIGN-OFF

### Stakeholder Review

- [ ] **Engineering Lead:** _________________ Date: _______
- [ ] **Data Science Lead:** _________________ Date: _______
- [ ] **Product Manager:** _________________ Date: _______
- [ ] **CTO:** _________________ Date: _______
- [ ] **CEO:** _________________ Date: _______

### Budget Approval

- [ ] **CFO:** _________________ Date: _______
- [ ] **Budget Authorized:** $_________ Date: _______

### Project Kickoff

- [ ] **Kickoff Meeting Scheduled:** _______
- [ ] **Team Onboarded:** _______
- [ ] **Development Start Date:** _______

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Prepared By:** Mike (Team Leader)  
**Status:** DRAFT - Awaiting Approval

---

*End of Phase 5 Master Implementation Plan*