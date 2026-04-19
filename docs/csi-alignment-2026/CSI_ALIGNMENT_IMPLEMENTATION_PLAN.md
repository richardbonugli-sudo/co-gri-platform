# Country Shock Index (CSI) Alignment Implementation Plan
## Technical Specification for Expectation-Weighted Architecture

**Document Version:** 1.0  
**Date:** February 6, 2026  
**Status:** DRAFT - Awaiting Stakeholder Approval  
**Classification:** Internal - Strategic Planning

---

## Executive Summary

### Purpose
This document provides a comprehensive technical implementation plan to align the Country Shock Index (CSI) with its governing appendices (Appendix B: Data Sources & Parsing Logic, and CSI Option 2: Expectation-Weighted Architecture). The current CSI implementation operates as a **lagging indicator**; this plan transforms it into a **leading, expectation-weighted risk-pricing signal**.

### Business Impact
- **Current State:** CSI updates quarterly, reacts only after events occur, misses escalation signals
- **Target State:** CSI updates continuously, prices risk before events materialize, captures market-relevant escalation
- **Value Proposition:** First-mover advantage in geopolitical risk detection, competitive differentiation vs. traditional indices

### Implementation Timeline
**Total Duration:** 8 weeks (40 business days)
- **Phase 1:** Core Architecture Redesign (2 weeks)
- **Phase 2:** High-Frequency Detection Layer (2 weeks)
- **Phase 3:** Escalation & Decay Mechanics (2 weeks)
- **Phase 4:** Netting & Anti-Double-Counting (1 week)
- **Phase 5:** Testing, Validation & Documentation (1 week)

### Resource Requirements
- **Engineering:** 2 senior backend engineers (full-time), 1 data engineer (full-time)
- **Data Science:** 1 data scientist (50% allocation for backtesting)
- **Product:** 1 product manager (25% allocation for requirements validation)
- **QA:** 1 QA engineer (full-time for final 2 weeks)
- **Budget:** $15K for data source subscriptions (Reuters, GDELT Pro, etc.)

### Success Criteria
1. CSI moves in response to escalation signals BEFORE events are confirmed
2. Event confirmation produces incremental (not full) CSI impact
3. Unconfirmed escalations decay according to specified schedules
4. All CSI movements are fully auditable with source attribution
5. Backtesting shows CSI leads market reactions by 7-14 days on average

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Target Architecture](#2-target-architecture)
3. [Phase 1: Core Architecture Redesign](#3-phase-1-core-architecture-redesign)
4. [Phase 2: High-Frequency Detection Layer](#4-phase-2-high-frequency-detection-layer)
5. [Phase 3: Escalation & Decay Mechanics](#5-phase-3-escalation-decay-mechanics)
6. [Phase 4: Netting & Anti-Double-Counting](#6-phase-4-netting-anti-double-counting)
7. [Phase 5: Testing & Validation](#7-phase-5-testing-validation)
8. [Data Architecture](#8-data-architecture)
9. [API Specifications](#9-api-specifications)
10. [Risk Mitigation](#10-risk-mitigation)
11. [Rollout Strategy](#11-rollout-strategy)
12. [Appendices](#12-appendices)

---

## 1. Current State Assessment

### 1.1 Existing CSI Architecture

**Current Formula:**
```
CSI_j = Σ(Component_i,j × Weight_i) for i = 1 to 5

Components:
- Political Stability (30%)
- Economic Conditions (25%)
- Regulatory Environment (20%)
- Geopolitical Tensions (15%)
- Social Factors (10%)
```

**Current Data Sources:**
- World Bank WGI (annual, 6-month lag)
- IMF WEO (quarterly, 3-month lag)
- PRS/EIU (monthly, 1-month lag)
- UCDP/ACLED (annual, 2-month lag)

**Current Update Cadence:**
- Quarterly baseline recalculation
- Event-driven adjustments (manual trigger)

### 1.2 Critical Gaps Identified

| Gap Category | Current Behavior | Required Behavior | Impact |
|--------------|------------------|-------------------|--------|
| **Conceptual Framework** | Current-state composite | Expectation-weighted pricing signal | HIGH - Fundamental misalignment |
| **Data Architecture** | Low-frequency structural sources only | High-frequency detection + structural baseline | CRITICAL - No real-time capability |
| **Event Lifecycle** | No lifecycle state machine | DETECTED → PROVISIONAL → CONFIRMED → DECAY | CRITICAL - Cannot track escalation |
| **Escalation Drift** | No drift mechanism | Probability-weighted signal contributions | CRITICAL - Cannot price pre-event risk |
| **Decay Logic** | Simple exponential smoothing | Explicit decay schedules with persistence tracking | HIGH - Risk overstays or vanishes prematurely |
| **Source Classification** | No role separation | Detection vs. Confirmation tiers | HIGH - Noise vs. signal confusion |
| **Netting Logic** | No netting | Event impacts netted against prior drift | MODERATE - Risk of double-counting |

### 1.3 Code Modules Requiring Changes

**Files to Modify:**
```
/workspace/shadcn-ui/src/services/csi/
├── engine/
│   ├── CSIEngine.ts ⚠️ MAJOR REFACTOR
│   └── CSIEngineOrchestrator.ts ⚠️ MAJOR REFACTOR
├── eventStore.ts ⚠️ MODERATE CHANGES
├── dataSources/
│   └── expandedConfig.ts ⚠️ MINOR ADDITIONS
└── [NEW] escalation/
    ├── escalationDriftEngine.ts ✨ NEW
    ├── decayScheduler.ts ✨ NEW
    └── nettingEngine.ts ✨ NEW
```

**New Modules to Create:**
```
/workspace/shadcn-ui/src/services/csi/
├── detection/
│   ├── highFrequencyIngestion.ts ✨ NEW
│   ├── candidateSignalStore.ts ✨ NEW
│   └── corroborationEngine.ts ✨ NEW
├── lifecycle/
│   ├── eventLifecycleManager.ts ✨ NEW
│   └── stateTransitionValidator.ts ✨ NEW
└── audit/
    ├── auditLogger.ts ✨ NEW
    └── explainabilityEngine.ts ✨ NEW
```

---

## 2. Target Architecture

### 2.1 New CSI Formula

```
CSI_j(t) = Structural_Baseline_j(t) + Escalation_Drift_j(t) + Event_CSI_Δ_j(t)

Where:
- Structural_Baseline_j(t) = Slow-moving institutional risk (quarterly updates)
- Escalation_Drift_j(t) = Probability-weighted pre-event risk (daily updates)
- Event_CSI_Δ_j(t) = Confirmed regime changes (real-time updates)
```

### 2.2 Component Breakdown

#### **Structural Baseline (Quarterly)**
```
Structural_Baseline_j(t) = Σ(Domain_i,j × Weight_i) for i = 1 to 5

Domains (same as current):
- Political Stability (30%)
- Economic Conditions (25%)
- Regulatory Environment (20%)
- Geopolitical Tensions (15%)
- Social Factors (10%)

Data Sources: World Bank, IMF, PRS, EIU (unchanged)
Update Frequency: Quarterly
```

#### **Escalation Drift (Daily)**
```
Escalation_Drift_j(t) = Σ(Signal_k × Probability_k × Persistence_k × Recency_k)

For all qualifying signals k where:
- Signal_k = Base severity score (0-1.0)
- Probability_k = Likelihood of materialization (0-1.0)
- Persistence_k = Time signal has persisted / 72 hours (capped at 1.0)
- Recency_k = e^(-λ × days_since_last_update), λ = 0.05

Constraints:
- Max drift per signal: 0.25 CSI points
- Max cumulative drift per 30 days: 1.0 CSI points
- Escalation rate: 2x de-escalation rate (asymmetric)
```

#### **Event CSI Delta (Real-Time)**
```
Event_CSI_Δ_j(t) = Σ(Event_m × Confirmation_Factor_m - Prior_Drift_m)

For all confirmed events m where:
- Event_m = Base event impact (0-20 CSI points)
- Confirmation_Factor_m = Source credibility × Scope multiplier
- Prior_Drift_m = Escalation drift attributable to this event (netting)

Decay (for temporary events):
Event_Impact(t) = Base_Impact × e^(-λ × quarters), λ = 0.10
```

### 2.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HIGH-FREQUENCY DETECTION LAYER (Continuous)                │
│                                                               │
│  Sources: Reuters, AP, BBC, GDELT, ReliefWeb, CrisisWatch   │
│  Frequency: Real-time / 15-minute batches                    │
│  Output: Candidate Signals (noisy, high recall)             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PARSING & CLASSIFICATION ENGINE                             │
│                                                               │
│  • Entity resolution (actor, target, spillover countries)    │
│  • Event vs. signal typing                                   │
│  • Initial severity tagging                                  │
│  • Vector routing (SC1-SC7 or Domain 1-5)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CORROBORATION & PERSISTENCE FILTER                          │
│                                                               │
│  Rules:                                                       │
│  • ≥2 independent sources required                           │
│  • Must persist >48-72 hours                                 │
│  • Source credibility weighting applied                      │
│                                                               │
│  Output: Qualified Escalation Signals                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  EVENT LIFECYCLE STATE MACHINE                               │
│                                                               │
│  DETECTED → PROVISIONAL → CONFIRMED → RESOLVED/SUNSET        │
│                                                               │
│  State Transitions:                                          │
│  • DETECTED: Initial signal captured                         │
│  • PROVISIONAL: Corroborated, awaiting authoritative source │
│  • CONFIRMED: Verified via Tier 1 source                    │
│  • RESOLVED: Event ended or fully decayed                   │
└─────────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────────────────┐
│ ESCALATION DRIFT    │   │ EVENT CSI DELTA                 │
│ ENGINE              │   │ ENGINE                          │
│                     │   │                                 │
│ • Probability calc  │   │ • Confirmation impact           │
│ • Persistence track │   │ • Prior drift netting           │
│ • Decay scheduling  │   │ • Decay curve application       │
│ • Drift caps        │   │                                 │
└─────────────────────┘   └─────────────────────────────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CSI AGGREGATION & OUTPUT                                    │
│                                                               │
│  CSI_j(t) = Structural_Baseline_j(t)                         │
│           + Escalation_Drift_j(t)                            │
│           + Event_CSI_Δ_j(t)                                 │
│                                                               │
│  Outputs:                                                     │
│  • Total CSI score                                           │
│  • Component breakdown (Baseline, Drift, Events)            │
│  • Active signals & events list                             │
│  • Confidence score                                          │
│  • Full audit trail                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Source Classification Framework

**Tier 1: Authoritative Confirmation Sources**
- **Role:** Confirm events only (cannot initiate detection)
- **Examples:** OFAC sanctions list, UN Security Council resolutions, government gazettes, central bank circulars, official military announcements
- **Confidence Boost:** 95-100%
- **Update Frequency:** Real-time (monitored continuously)

**Tier 2: High-Credibility Detection Sources**
- **Role:** Detect candidate signals, provide context
- **Examples:** Reuters, Bloomberg, AP, FT, major international news agencies
- **Confidence Boost:** 80-90%
- **Update Frequency:** Real-time / 15-minute batches

**Tier 3: Broad Coverage Detection Sources**
- **Role:** Maximize coverage, accept higher noise
- **Examples:** GDELT, ReliefWeb, CrisisWatch, regional news, OSINT aggregators
- **Confidence Boost:** 60-75%
- **Update Frequency:** Hourly batches

**Structural Baseline Sources (Unchanged)**
- **Role:** Quarterly recalibration only
- **Examples:** World Bank, IMF, PRS, EIU, UCDP, Freedom House
- **Update Frequency:** Quarterly

---

## 3. Phase 1: Core Architecture Redesign

**Duration:** 2 weeks (10 business days)  
**Team:** 2 senior backend engineers  
**Objective:** Implement new CSI formula with three-component decomposition

### 3.1 Tasks

#### Task 1.1: Refactor CSI Engine Core (3 days)
**File:** `/workspace/shadcn-ui/src/services/csi/engine/CSIEngine.ts`

**Current Code Structure:**
```typescript
class CSIEngine {
  calculateCSI(country: string): number {
    const components = this.calculateComponents(country);
    return this.weightedSum(components);
  }
}
```

**New Code Structure:**
```typescript
interface CSIComponents {
  structural_baseline: number;
  escalation_drift: number;
  event_delta: number;
  total: number;
  metadata: {
    active_signals: Signal[];
    confirmed_events: Event[];
    confidence_score: number;
    last_updated: Date;
  };
}

class CSIEngine {
  private structuralBaselineEngine: StructuralBaselineEngine;
  private escalationDriftEngine: EscalationDriftEngine;
  private eventDeltaEngine: EventDeltaEngine;
  
  async calculateCSI(country: string, timestamp: Date): Promise<CSIComponents> {
    // Calculate three components in parallel
    const [baseline, drift, events] = await Promise.all([
      this.structuralBaselineEngine.calculate(country, timestamp),
      this.escalationDriftEngine.calculate(country, timestamp),
      this.eventDeltaEngine.calculate(country, timestamp)
    ]);
    
    // Apply bounds and constraints
    const total = this.applyBounds(baseline + drift + events);
    
    // Generate metadata
    const metadata = await this.generateMetadata(country, timestamp);
    
    return {
      structural_baseline: baseline,
      escalation_drift: drift,
      event_delta: events,
      total,
      metadata
    };
  }
  
  private applyBounds(rawCSI: number): number {
    return Math.max(0, Math.min(100, rawCSI));
  }
}
```

**Acceptance Criteria:**
- [ ] CSI calculation returns three separate components
- [ ] Each component is independently testable
- [ ] Total CSI is sum of components with bounds enforcement
- [ ] Metadata includes active signals and events
- [ ] Unit tests achieve 90%+ coverage

#### Task 1.2: Create Structural Baseline Engine (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/engine/StructuralBaselineEngine.ts` (NEW)

**Implementation:**
```typescript
interface StructuralBaselineConfig {
  domains: {
    political_stability: { weight: 0.30, indicators: string[] };
    economic_conditions: { weight: 0.25, indicators: string[] };
    regulatory_environment: { weight: 0.20, indicators: string[] };
    geopolitical_tensions: { weight: 0.15, indicators: string[] };
    social_factors: { weight: 0.10, indicators: string[] };
  };
  update_frequency_days: 90; // Quarterly
  data_sources: DataSource[];
}

class StructuralBaselineEngine {
  private config: StructuralBaselineConfig;
  private cache: Map<string, CachedBaseline>;
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    // Check cache first (baseline only updates quarterly)
    const cached = this.getCachedBaseline(country, timestamp);
    if (cached && !this.isStale(cached, timestamp)) {
      return cached.value;
    }
    
    // Recalculate if stale or missing
    const domainScores = await this.calculateDomainScores(country);
    const baseline = this.weightedSum(domainScores);
    
    // Cache result
    this.cacheBaseline(country, baseline, timestamp);
    
    return baseline;
  }
  
  private async calculateDomainScores(country: string): Promise<Record<string, number>> {
    // Existing domain calculation logic (unchanged)
    // Uses World Bank, IMF, PRS, EIU data
    return {
      political_stability: await this.calculatePoliticalStability(country),
      economic_conditions: await this.calculateEconomicConditions(country),
      regulatory_environment: await this.calculateRegulatoryEnvironment(country),
      geopolitical_tensions: await this.calculateGeopoliticalTensions(country),
      social_factors: await this.calculateSocialFactors(country)
    };
  }
  
  private isStale(cached: CachedBaseline, current: Date): boolean {
    const daysSinceUpdate = (current.getTime() - cached.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > this.config.update_frequency_days;
  }
}
```

**Acceptance Criteria:**
- [ ] Baseline calculation matches existing CSI component logic
- [ ] Quarterly caching implemented correctly
- [ ] Stale data detection works
- [ ] Backward compatibility maintained (same output as current CSI for baseline component)

#### Task 1.3: Stub Escalation Drift Engine (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/EscalationDriftEngine.ts` (NEW)

**Initial Implementation (Stub):**
```typescript
interface Signal {
  signal_id: string;
  country: string;
  signal_type: string;
  severity: number; // 0-1.0
  probability: number; // 0-1.0
  detected_date: Date;
  last_updated: Date;
  sources: string[];
  corroboration_count: number;
  persistence_hours: number;
}

class EscalationDriftEngine {
  private signalStore: SignalStore;
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    // Phase 1: Return 0 (stub)
    // Phase 3: Implement full logic
    return 0;
  }
  
  async getActiveSignals(country: string): Promise<Signal[]> {
    return this.signalStore.getSignalsByCountry(country)
      .filter(s => s.state === 'ACTIVE');
  }
}
```

**Acceptance Criteria:**
- [ ] Stub returns 0 (no drift yet)
- [ ] Interface defined for Phase 3 implementation
- [ ] Signal store integration ready
- [ ] Unit tests pass with stub behavior

#### Task 1.4: Stub Event Delta Engine (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/EventDeltaEngine.ts` (NEW)

**Initial Implementation (Stub):**
```typescript
interface ConfirmedEvent {
  event_id: string;
  country: string;
  event_type: string;
  state: 'CONFIRMED' | 'RESOLVED';
  base_impact: number; // 0-20 CSI points
  confirmed_date: Date;
  decay_schedule?: DecaySchedule;
  prior_drift_netted: number; // Amount netted from escalation drift
}

class EventDeltaEngine {
  private eventStore: EventStore;
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    const confirmedEvents = await this.getActiveEvents(country, timestamp);
    
    let totalDelta = 0;
    for (const event of confirmedEvents) {
      const decayedImpact = this.applyDecay(event, timestamp);
      totalDelta += decayedImpact;
    }
    
    return totalDelta;
  }
  
  private applyDecay(event: ConfirmedEvent, currentTime: Date): number {
    if (!event.decay_schedule || event.decay_schedule.type === 'NONE') {
      return event.base_impact;
    }
    
    const quartersSinceConfirmation = this.getQuartersSince(event.confirmed_date, currentTime);
    const decayRate = event.decay_schedule.lambda || 0.10;
    
    return event.base_impact * Math.exp(-decayRate * quartersSinceConfirmation);
  }
  
  private async getActiveEvents(country: string, timestamp: Date): Promise<ConfirmedEvent[]> {
    return this.eventStore.getEventsByCountry(country)
      .filter(e => e.state === 'CONFIRMED' && this.isStillActive(e, timestamp));
  }
}
```

**Acceptance Criteria:**
- [ ] Event delta calculation works for confirmed events
- [ ] Decay logic implemented correctly
- [ ] Integration with existing event store
- [ ] Unit tests cover decay scenarios

#### Task 1.5: Integration & Testing (1 day)
**Objective:** Wire up three engines and test end-to-end

**Integration Test:**
```typescript
describe('CSI Engine Integration', () => {
  it('should calculate CSI with three components', async () => {
    const engine = new CSIEngine();
    const result = await engine.calculateCSI('China', new Date('2026-02-06'));
    
    expect(result.structural_baseline).toBeGreaterThan(0);
    expect(result.escalation_drift).toBe(0); // Stub in Phase 1
    expect(result.event_delta).toBeGreaterThanOrEqual(0);
    expect(result.total).toBe(result.structural_baseline + result.escalation_drift + result.event_delta);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });
  
  it('should match legacy CSI for baseline component', async () => {
    const legacyCSI = await calculateLegacyCSI('Germany');
    const newEngine = new CSIEngine();
    const result = await newEngine.calculateCSI('Germany', new Date());
    
    // Baseline should match legacy CSI (since drift and events are 0 in Phase 1)
    expect(result.structural_baseline).toBeCloseTo(legacyCSI, 1);
  });
});
```

**Acceptance Criteria:**
- [ ] All three engines integrate successfully
- [ ] CSI calculation returns valid output
- [ ] Backward compatibility maintained (baseline matches legacy CSI)
- [ ] Integration tests pass

### 3.2 Deliverables
- [ ] Refactored `CSIEngine.ts` with three-component architecture
- [ ] New `StructuralBaselineEngine.ts` (functional)
- [ ] New `EscalationDriftEngine.ts` (stub)
- [ ] New `EventDeltaEngine.ts` (functional)
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] Documentation: Architecture Decision Record (ADR)

---

## 4. Phase 2: High-Frequency Detection Layer

**Duration:** 2 weeks (10 business days)  
**Team:** 1 senior backend engineer, 1 data engineer  
**Objective:** Implement real-time signal detection and corroboration

### 4.1 Tasks

#### Task 2.1: Data Source Integration (4 days)
**Objective:** Integrate high-frequency news feeds

**Data Sources to Integrate:**
1. **Reuters (Tier 2)** - RSS feed + API
2. **GDELT (Tier 3)** - Event database API
3. **ReliefWeb (Tier 3)** - Humanitarian news API
4. **CrisisWatch (Tier 3)** - Conflict monitoring feed

**Implementation:**
```typescript
// File: /workspace/shadcn-ui/src/services/csi/detection/highFrequencyIngestion.ts

interface NewsArticle {
  article_id: string;
  source: string;
  source_tier: 1 | 2 | 3;
  title: string;
  content: string;
  published_date: Date;
  url: string;
  entities: {
    countries: string[];
    actors: string[];
    event_types: string[];
  };
}

class HighFrequencyIngestionEngine {
  private sources: DataSource[];
  private ingestionQueue: Queue<NewsArticle>;
  
  async startIngestion(): Promise<void> {
    // Start polling all sources
    for (const source of this.sources) {
      this.scheduleSourcePoll(source);
    }
  }
  
  private async scheduleSourcePoll(source: DataSource): Promise<void> {
    setInterval(async () => {
      try {
        const articles = await this.fetchFromSource(source);
        for (const article of articles) {
          await this.ingestionQueue.enqueue(article);
        }
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
      }
    }, source.update_frequency_minutes * 60 * 1000);
  }
  
  private async fetchFromSource(source: DataSource): Promise<NewsArticle[]> {
    switch (source.id) {
      case 'reuters':
        return this.fetchReutersRSS(source.rss_feed!);
      case 'gdelt':
        return this.fetchGDELTEvents();
      case 'reliefweb':
        return this.fetchReliefWebAPI();
      case 'crisiswatch':
        return this.fetchCrisisWatchFeed();
      default:
        return [];
    }
  }
  
  private async fetchReutersRSS(feedUrl: string): Promise<NewsArticle[]> {
    // RSS parsing logic
    const response = await fetch(feedUrl);
    const xml = await response.text();
    const parsed = parseRSS(xml);
    
    return parsed.items.map(item => ({
      article_id: generateId(item.link),
      source: 'reuters',
      source_tier: 2,
      title: item.title,
      content: item.description,
      published_date: new Date(item.pubDate),
      url: item.link,
      entities: this.extractEntities(item.title + ' ' + item.description)
    }));
  }
  
  private extractEntities(text: string): { countries: string[]; actors: string[]; event_types: string[] } {
    // NLP entity extraction (use existing library or simple regex for MVP)
    // TODO: Integrate with spaCy or similar NER model
    return {
      countries: this.extractCountries(text),
      actors: this.extractActors(text),
      event_types: this.classifyEventTypes(text)
    };
  }
}
```

**Acceptance Criteria:**
- [ ] Reuters RSS feed integration working
- [ ] GDELT API integration working
- [ ] ReliefWeb API integration working
- [ ] CrisisWatch feed integration working
- [ ] Articles ingested into queue successfully
- [ ] Entity extraction produces reasonable results (>70% accuracy on test set)

#### Task 2.2: Candidate Signal Store (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/detection/candidateSignalStore.ts` (NEW)

**Implementation:**
```typescript
interface CandidateSignal {
  signal_id: string;
  country: string;
  signal_type: string; // 'tariff_threat', 'sanctions_warning', 'conflict_escalation', etc.
  severity: number; // 0-1.0
  detected_date: Date;
  last_updated: Date;
  sources: ArticleReference[];
  corroboration_count: number;
  state: 'CANDIDATE' | 'CORROBORATED' | 'PROMOTED' | 'EXPIRED';
  persistence_hours: number;
}

interface ArticleReference {
  article_id: string;
  source: string;
  source_tier: number;
  published_date: Date;
  relevance_score: number;
}

class CandidateSignalStore {
  private signals: Map<string, CandidateSignal> = new Map();
  private countryIndex: Map<string, Set<string>> = new Map();
  
  async addCandidate(article: NewsArticle): Promise<CandidateSignal[]> {
    const signals: CandidateSignal[] = [];
    
    // Extract potential signals from article
    for (const country of article.entities.countries) {
      for (const eventType of article.entities.event_types) {
        const signal = await this.createOrUpdateSignal(country, eventType, article);
        signals.push(signal);
      }
    }
    
    return signals;
  }
  
  private async createOrUpdateSignal(
    country: string, 
    eventType: string, 
    article: NewsArticle
  ): Promise<CandidateSignal> {
    // Check if similar signal already exists (deduplication)
    const existingSignal = this.findSimilarSignal(country, eventType, article.published_date);
    
    if (existingSignal) {
      // Update existing signal (add source, increment corroboration)
      existingSignal.sources.push({
        article_id: article.article_id,
        source: article.source,
        source_tier: article.source_tier,
        published_date: article.published_date,
        relevance_score: this.calculateRelevance(article, eventType)
      });
      existingSignal.corroboration_count = this.countUniqueSources(existingSignal.sources);
      existingSignal.last_updated = new Date();
      existingSignal.persistence_hours = this.calculatePersistence(existingSignal);
      
      return existingSignal;
    } else {
      // Create new candidate signal
      const signal: CandidateSignal = {
        signal_id: this.generateSignalId(country, eventType),
        country,
        signal_type: eventType,
        severity: this.estimateSeverity(article, eventType),
        detected_date: article.published_date,
        last_updated: article.published_date,
        sources: [{
          article_id: article.article_id,
          source: article.source,
          source_tier: article.source_tier,
          published_date: article.published_date,
          relevance_score: 1.0
        }],
        corroboration_count: 1,
        state: 'CANDIDATE',
        persistence_hours: 0
      };
      
      this.signals.set(signal.signal_id, signal);
      this.updateCountryIndex(country, signal.signal_id);
      
      return signal;
    }
  }
  
  private findSimilarSignal(country: string, eventType: string, timestamp: Date): CandidateSignal | undefined {
    const countrySignals = this.getSignalsByCountry(country);
    const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return countrySignals.find(s => 
      s.signal_type === eventType &&
      s.state !== 'EXPIRED' &&
      Math.abs(s.detected_date.getTime() - timestamp.getTime()) < timeWindow
    );
  }
  
  private countUniqueSources(sources: ArticleReference[]): number {
    const uniqueSources = new Set(sources.map(s => s.source));
    return uniqueSources.size;
  }
  
  private calculatePersistence(signal: CandidateSignal): number {
    const hoursSinceDetection = (new Date().getTime() - signal.detected_date.getTime()) / (1000 * 60 * 60);
    return hoursSinceDetection;
  }
  
  getSignalsByCountry(country: string): CandidateSignal[] {
    const signalIds = this.countryIndex.get(country) || new Set();
    return Array.from(signalIds)
      .map(id => this.signals.get(id))
      .filter((s): s is CandidateSignal => s !== undefined);
  }
  
  getCorroboratedSignals(minSources: number = 2, minPersistenceHours: number = 48): CandidateSignal[] {
    return Array.from(this.signals.values()).filter(s =>
      s.corroboration_count >= minSources &&
      s.persistence_hours >= minPersistenceHours &&
      s.state === 'CANDIDATE'
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Candidate signals stored correctly
- [ ] Deduplication logic works (similar signals merged)
- [ ] Corroboration count tracks unique sources
- [ ] Persistence hours calculated correctly
- [ ] Country indexing enables fast queries

#### Task 2.3: Corroboration Engine (3 days)
**File:** `/workspace/shadcn-ui/src/services/csi/detection/corroborationEngine.ts` (NEW)

**Implementation:**
```typescript
interface CorroborationRules {
  min_sources: number; // Default: 2
  min_persistence_hours: number; // Default: 48-72
  source_credibility_weights: Record<string, number>;
  time_decay_lambda: number; // Default: 0.05
}

class CorroborationEngine {
  private rules: CorroborationRules;
  private signalStore: CandidateSignalStore;
  
  async evaluateSignals(): Promise<Signal[]> {
    const candidates = this.signalStore.getCorroboratedSignals(
      this.rules.min_sources,
      this.rules.min_persistence_hours
    );
    
    const qualifiedSignals: Signal[] = [];
    
    for (const candidate of candidates) {
      if (this.meetsCorroborationThreshold(candidate)) {
        const signal = this.promoteToQualifiedSignal(candidate);
        qualifiedSignals.push(signal);
        
        // Update candidate state
        candidate.state = 'PROMOTED';
      }
    }
    
    return qualifiedSignals;
  }
  
  private meetsCorroborationThreshold(candidate: CandidateSignal): boolean {
    // Check 1: Minimum sources
    if (candidate.corroboration_count < this.rules.min_sources) {
      return false;
    }
    
    // Check 2: Minimum persistence
    if (candidate.persistence_hours < this.rules.min_persistence_hours) {
      return false;
    }
    
    // Check 3: Source credibility score
    const credibilityScore = this.calculateCredibilityScore(candidate);
    if (credibilityScore < 0.70) { // 70% threshold
      return false;
    }
    
    return true;
  }
  
  private calculateCredibilityScore(candidate: CandidateSignal): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const source of candidate.sources) {
      const sourceWeight = this.rules.source_credibility_weights[source.source] || 0.5;
      const tierBoost = source.source_tier === 1 ? 1.0 : source.source_tier === 2 ? 0.85 : 0.70;
      const recencyDecay = Math.exp(-this.rules.time_decay_lambda * this.getDaysSince(source.published_date));
      
      const effectiveWeight = sourceWeight * tierBoost * recencyDecay * source.relevance_score;
      
      weightedSum += effectiveWeight;
      totalWeight += 1.0;
    }
    
    return weightedSum / totalWeight;
  }
  
  private promoteToQualifiedSignal(candidate: CandidateSignal): Signal {
    const probability = this.estimateProbability(candidate);
    
    return {
      signal_id: candidate.signal_id,
      country: candidate.country,
      signal_type: candidate.signal_type,
      severity: candidate.severity,
      probability,
      detected_date: candidate.detected_date,
      last_updated: new Date(),
      sources: candidate.sources.map(s => s.source),
      corroboration_count: candidate.corroboration_count,
      persistence_hours: candidate.persistence_hours
    };
  }
  
  private estimateProbability(candidate: CandidateSignal): number {
    // Probability estimation based on:
    // 1. Number of corroborating sources (more sources = higher probability)
    // 2. Source credibility (higher tier sources = higher probability)
    // 3. Persistence (longer persistence = higher probability)
    // 4. Signal type (some types more likely to materialize than others)
    
    const sourcesFactor = Math.min(1.0, candidate.corroboration_count / 5); // Cap at 5 sources
    const credibilityFactor = this.calculateCredibilityScore(candidate);
    const persistenceFactor = Math.min(1.0, candidate.persistence_hours / 168); // Cap at 1 week
    const typeFactor = this.getSignalTypeProbability(candidate.signal_type);
    
    return (sourcesFactor * 0.25) + (credibilityFactor * 0.35) + (persistenceFactor * 0.20) + (typeFactor * 0.20);
  }
  
  private getSignalTypeProbability(signalType: string): number {
    // Historical probability that signal type materializes
    const probabilities: Record<string, number> = {
      'tariff_threat': 0.65,
      'sanctions_warning': 0.75,
      'conflict_escalation': 0.50,
      'trade_investigation': 0.80,
      'capital_control_warning': 0.60,
      'cyber_policy_signal': 0.55,
      'diplomatic_freeze': 0.70
    };
    
    return probabilities[signalType] || 0.50; // Default 50%
  }
  
  private getDaysSince(date: Date): number {
    return (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  }
}
```

**Acceptance Criteria:**
- [ ] Corroboration rules enforced correctly
- [ ] Credibility scoring works
- [ ] Probability estimation reasonable (validated against historical data)
- [ ] Qualified signals promoted successfully
- [ ] Unit tests cover edge cases

#### Task 2.4: Integration & Testing (1 day)
**Objective:** Wire up detection layer end-to-end

**Integration Test:**
```typescript
describe('High-Frequency Detection Layer', () => {
  it('should detect and corroborate signals from multiple sources', async () => {
    const ingestion = new HighFrequencyIngestionEngine();
    const signalStore = new CandidateSignalStore();
    const corroboration = new CorroborationEngine();
    
    // Simulate articles from 3 sources about same event
    const articles = [
      createMockArticle('reuters', 'US announces tariff investigation on Chinese EVs'),
      createMockArticle('bloomberg', 'Biden administration to probe China EV subsidies'),
      createMockArticle('ft', 'White House considers tariffs on Chinese electric vehicles')
    ];
    
    // Ingest articles
    for (const article of articles) {
      await signalStore.addCandidate(article);
    }
    
    // Wait for persistence threshold (simulate 48 hours)
    await simulateTimePassing(48 * 60 * 60 * 1000);
    
    // Evaluate corroboration
    const qualifiedSignals = await corroboration.evaluateSignals();
    
    expect(qualifiedSignals).toHaveLength(1);
    expect(qualifiedSignals[0].country).toBe('China');
    expect(qualifiedSignals[0].signal_type).toBe('tariff_threat');
    expect(qualifiedSignals[0].corroboration_count).toBe(3);
    expect(qualifiedSignals[0].probability).toBeGreaterThan(0.60);
  });
});
```

**Acceptance Criteria:**
- [ ] End-to-end detection flow works
- [ ] Multiple sources corroborate correctly
- [ ] Persistence tracking accurate
- [ ] Integration tests pass

### 4.2 Deliverables
- [ ] `HighFrequencyIngestionEngine.ts` (functional)
- [ ] `CandidateSignalStore.ts` (functional)
- [ ] `CorroborationEngine.ts` (functional)
- [ ] Data source integrations (Reuters, GDELT, ReliefWeb, CrisisWatch)
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] Documentation: Data Source Integration Guide

---

## 5. Phase 3: Escalation & Decay Mechanics

**Duration:** 2 weeks (10 business days)  
**Team:** 1 senior backend engineer, 1 data scientist (50%)  
**Objective:** Implement escalation drift calculation and decay scheduling

### 5.1 Tasks

#### Task 3.1: Escalation Drift Calculation (4 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/EscalationDriftEngine.ts` (IMPLEMENT)

**Full Implementation:**
```typescript
interface EscalationDriftConfig {
  max_drift_per_signal: number; // 0.25 CSI points
  max_cumulative_drift_per_30_days: number; // 1.0 CSI points
  escalation_rate_multiplier: number; // 2.0 (escalation 2x faster than de-escalation)
  recency_decay_lambda: number; // 0.05
}

interface DriftContribution {
  signal_id: string;
  base_severity: number;
  probability: number;
  persistence_factor: number;
  recency_factor: number;
  contribution: number;
}

class EscalationDriftEngine {
  private config: EscalationDriftConfig;
  private signalStore: SignalStore;
  private driftHistory: Map<string, DriftHistory> = new Map();
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    const activeSignals = await this.signalStore.getActiveSignals(country);
    
    if (activeSignals.length === 0) {
      return 0;
    }
    
    let totalDrift = 0;
    const contributions: DriftContribution[] = [];
    
    for (const signal of activeSignals) {
      const contribution = this.calculateSignalContribution(signal, timestamp);
      contributions.push(contribution);
      totalDrift += contribution.contribution;
    }
    
    // Apply drift caps
    totalDrift = this.applyDriftCaps(country, totalDrift, timestamp);
    
    // Store drift history
    this.recordDriftHistory(country, totalDrift, contributions, timestamp);
    
    return totalDrift;
  }
  
  private calculateSignalContribution(signal: Signal, timestamp: Date): DriftContribution {
    // Base severity (0-1.0)
    const baseSeverity = signal.severity;
    
    // Probability of materialization (0-1.0)
    const probability = signal.probability;
    
    // Persistence factor (0-1.0, capped at 72 hours)
    const persistenceFactor = Math.min(1.0, signal.persistence_hours / 72);
    
    // Recency factor (exponential decay)
    const daysSinceUpdate = (timestamp.getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-this.config.recency_decay_lambda * daysSinceUpdate);
    
    // Combined contribution
    const rawContribution = baseSeverity * probability * persistenceFactor * recencyFactor;
    
    // Apply per-signal cap
    const cappedContribution = Math.min(rawContribution, this.config.max_drift_per_signal);
    
    return {
      signal_id: signal.signal_id,
      base_severity: baseSeverity,
      probability,
      persistence_factor: persistenceFactor,
      recency_factor: recencyFactor,
      contribution: cappedContribution
    };
  }
  
  private applyDriftCaps(country: string, rawDrift: number, timestamp: Date): number {
    // Get drift history for past 30 days
    const history = this.getDriftHistory(country, 30, timestamp);
    const cumulativeDrift = history.reduce((sum, h) => sum + h.total_drift, 0);
    
    // Check if adding rawDrift would exceed 30-day cap
    if (cumulativeDrift + rawDrift > this.config.max_cumulative_drift_per_30_days) {
      const remainingCapacity = this.config.max_cumulative_drift_per_30_days - cumulativeDrift;
      return Math.max(0, remainingCapacity);
    }
    
    return rawDrift;
  }
  
  private recordDriftHistory(
    country: string, 
    totalDrift: number, 
    contributions: DriftContribution[], 
    timestamp: Date
  ): void {
    const historyKey = `${country}-${timestamp.toISOString().split('T')[0]}`;
    
    this.driftHistory.set(historyKey, {
      country,
      date: timestamp,
      total_drift: totalDrift,
      contributions,
      signal_count: contributions.length
    });
  }
  
  private getDriftHistory(country: string, days: number, currentTime: Date): DriftHistory[] {
    const cutoffTime = new Date(currentTime.getTime() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.driftHistory.values()).filter(h =>
      h.country === country &&
      h.date >= cutoffTime &&
      h.date <= currentTime
    );
  }
  
  async getActiveSignalsWithContributions(country: string): Promise<DriftContribution[]> {
    const activeSignals = await this.signalStore.getActiveSignals(country);
    return activeSignals.map(s => this.calculateSignalContribution(s, new Date()));
  }
}
```

**Acceptance Criteria:**
- [ ] Drift calculation follows formula exactly
- [ ] Per-signal cap enforced (0.25 points)
- [ ] 30-day cumulative cap enforced (1.0 points)
- [ ] Recency decay applied correctly
- [ ] Drift history stored for audit

#### Task 3.2: Decay Scheduler (3 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/DecayScheduler.ts` (NEW)

**Implementation:**
```typescript
interface DecaySchedule {
  signal_id: string;
  country: string;
  initial_drift: number;
  decay_start_date: Date;
  inactivity_window_days: number; // Default: 30
  decay_rate: number; // Slower than escalation rate
  current_value: number;
  status: 'ACTIVE' | 'DECAYING' | 'EXPIRED';
}

class DecayScheduler {
  private schedules: Map<string, DecaySchedule> = new Map();
  private config: {
    inactivity_window_days: number; // 30
    decay_rate_multiplier: number; // 0.5 (decay at half the escalation rate)
  };
  
  async scheduleDecay(signal: Signal, initialDrift: number): Promise<void> {
    const schedule: DecaySchedule = {
      signal_id: signal.signal_id,
      country: signal.country,
      initial_drift: initialDrift,
      decay_start_date: new Date(signal.last_updated.getTime() + this.config.inactivity_window_days * 24 * 60 * 60 * 1000),
      inactivity_window_days: this.config.inactivity_window_days,
      decay_rate: this.config.decay_rate_multiplier,
      current_value: initialDrift,
      status: 'ACTIVE'
    };
    
    this.schedules.set(signal.signal_id, schedule);
  }
  
  async updateDecayStatus(signal: Signal): Promise<void> {
    const schedule = this.schedules.get(signal.signal_id);
    if (!schedule) return;
    
    // If signal updated recently, reset decay timer
    const daysSinceUpdate = (new Date().getTime() - signal.last_updated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < this.config.inactivity_window_days) {
      schedule.status = 'ACTIVE';
      schedule.decay_start_date = new Date(signal.last_updated.getTime() + this.config.inactivity_window_days * 24 * 60 * 60 * 1000);
    } else {
      schedule.status = 'DECAYING';
    }
  }
  
  async calculateDecayedValue(signalId: string, currentTime: Date): Promise<number> {
    const schedule = this.schedules.get(signalId);
    if (!schedule) return 0;
    
    if (schedule.status === 'ACTIVE') {
      return schedule.initial_drift;
    }
    
    if (schedule.status === 'DECAYING') {
      const daysSinceDecayStart = (currentTime.getTime() - schedule.decay_start_date.getTime()) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-schedule.decay_rate * daysSinceDecayStart / 30); // Decay over 30 days
      
      const decayedValue = schedule.initial_drift * decayFactor;
      
      // Mark as expired if decayed below threshold
      if (decayedValue < 0.01) {
        schedule.status = 'EXPIRED';
        return 0;
      }
      
      schedule.current_value = decayedValue;
      return decayedValue;
    }
    
    return 0; // EXPIRED
  }
  
  async getActiveDecays(country: string): Promise<DecaySchedule[]> {
    return Array.from(this.schedules.values()).filter(s =>
      s.country === country &&
      (s.status === 'ACTIVE' || s.status === 'DECAYING')
    );
  }
  
  async cleanupExpiredSchedules(): Promise<void> {
    for (const [signalId, schedule] of this.schedules.entries()) {
      if (schedule.status === 'EXPIRED') {
        this.schedules.delete(signalId);
      }
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Decay schedules created correctly
- [ ] 30-day inactivity window enforced
- [ ] Decay rate slower than escalation rate
- [ ] Expired schedules cleaned up
- [ ] Unit tests cover decay scenarios

#### Task 3.3: Integration with Escalation Engine (2 days)
**Objective:** Wire decay scheduler into escalation drift calculation

**Updated EscalationDriftEngine:**
```typescript
class EscalationDriftEngine {
  private decayScheduler: DecayScheduler;
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    const activeSignals = await this.signalStore.getActiveSignals(country);
    
    let totalDrift = 0;
    
    for (const signal of activeSignals) {
      // Update decay status
      await this.decayScheduler.updateDecayStatus(signal);
      
      // Calculate contribution with decay applied
      const rawContribution = this.calculateSignalContribution(signal, timestamp);
      const decayedContribution = await this.decayScheduler.calculateDecayedValue(signal.signal_id, timestamp);
      
      // Use decayed value if signal is decaying
      const effectiveContribution = Math.min(rawContribution.contribution, decayedContribution);
      
      totalDrift += effectiveContribution;
    }
    
    // Apply drift caps
    totalDrift = this.applyDriftCaps(country, totalDrift, timestamp);
    
    return totalDrift;
  }
}
```

**Acceptance Criteria:**
- [ ] Decay applied to escalation drift correctly
- [ ] Active signals maintain full drift
- [ ] Decaying signals reduce over time
- [ ] Integration tests pass

#### Task 3.4: Backtesting & Validation (1 day)
**Objective:** Validate escalation and decay mechanics against historical events

**Backtesting Framework:**
```typescript
describe('Escalation & Decay Backtesting', () => {
  it('should show drift rising before Trump tariff announcement (2018)', async () => {
    // Historical scenario: Trump tariff threats (Jan-Mar 2018) → tariffs enacted (Apr 2018)
    
    const engine = new EscalationDriftEngine();
    
    // Simulate signals detected in January 2018
    const signals = [
      createHistoricalSignal('US', 'tariff_threat', new Date('2018-01-15'), 0.70, 0.65),
      createHistoricalSignal('US', 'tariff_threat', new Date('2018-01-22'), 0.75, 0.70),
      createHistoricalSignal('US', 'tariff_threat', new Date('2018-02-10'), 0.80, 0.75)
    ];
    
    // Calculate drift over time
    const driftJan = await engine.calculate('China', new Date('2018-01-31'));
    const driftFeb = await engine.calculate('China', new Date('2018-02-28'));
    const driftMar = await engine.calculate('China', new Date('2018-03-31'));
    
    // Drift should rise as signals accumulate and persist
    expect(driftFeb).toBeGreaterThan(driftJan);
    expect(driftMar).toBeGreaterThan(driftFeb);
    
    // After tariffs enacted (event confirmed), drift should be netted out
    const eventDelta = 8.0; // Tariff event impact
    const nettedDelta = eventDelta - driftMar; // Net impact after drift
    
    expect(nettedDelta).toBeLessThan(eventDelta); // Confirms netting logic
  });
  
  it('should show drift decaying when threats not materialized', async () => {
    // Simulate threat that doesn't materialize
    const signal = createHistoricalSignal('Country', 'sanctions_warning', new Date('2024-01-01'), 0.60, 0.70);
    
    const scheduler = new DecayScheduler();
    await scheduler.scheduleDecay(signal, 0.50);
    
    // Check drift at different time points
    const drift_day_0 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-01-01'));
    const drift_day_30 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-01-31')); // Inactivity window
    const drift_day_60 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-03-01')); // Decay started
    const drift_day_90 = await scheduler.calculateDecayedValue(signal.signal_id, new Date('2024-03-31')); // Further decay
    
    expect(drift_day_0).toBe(0.50);
    expect(drift_day_30).toBe(0.50); // Still active
    expect(drift_day_60).toBeLessThan(0.50); // Decaying
    expect(drift_day_90).toBeLessThan(drift_day_60); // Further decayed
  });
});
```

**Acceptance Criteria:**
- [ ] Backtesting shows drift rises before events
- [ ] Backtesting shows drift decays when threats don't materialize
- [ ] Historical validation passes for 5+ major events
- [ ] Drift timing aligns with market reactions (7-14 day lead)

### 5.2 Deliverables
- [ ] `EscalationDriftEngine.ts` (fully implemented)
- [ ] `DecayScheduler.ts` (functional)
- [ ] Integration with CSI engine
- [ ] Backtesting framework
- [ ] Historical validation report
- [ ] Unit tests (90%+ coverage)
- [ ] Documentation: Escalation & Decay Mechanics Guide

---

## 6. Phase 4: Netting & Anti-Double-Counting

**Duration:** 1 week (5 business days)  
**Team:** 1 senior backend engineer  
**Objective:** Implement netting logic to prevent double-counting

### 6.1 Tasks

#### Task 4.1: Drift Attribution Tracking (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/DriftAttributionTracker.ts` (NEW)

**Implementation:**
```typescript
interface DriftAttribution {
  signal_id: string;
  country: string;
  event_type: string; // What event this drift is anticipating
  drift_amount: number;
  attribution_date: Date;
  status: 'PENDING' | 'NETTED' | 'EXPIRED';
}

class DriftAttributionTracker {
  private attributions: Map<string, DriftAttribution> = new Map();
  
  async recordDriftAttribution(signal: Signal, driftAmount: number): Promise<void> {
    const attribution: DriftAttribution = {
      signal_id: signal.signal_id,
      country: signal.country,
      event_type: this.inferEventType(signal.signal_type),
      drift_amount: driftAmount,
      attribution_date: new Date(),
      status: 'PENDING'
    };
    
    this.attributions.set(signal.signal_id, attribution);
  }
  
  async getAttributabledrift(country: string, eventType: string): Promise<number> {
    const relevantAttributions = Array.from(this.attributions.values()).filter(a =>
      a.country === country &&
      a.event_type === eventType &&
      a.status === 'PENDING'
    );
    
    return relevantAttributions.reduce((sum, a) => sum + a.drift_amount, 0);
  }
  
  async markAsNetted(signalIds: string[]): Promise<void> {
    for (const signalId of signalIds) {
      const attribution = this.attributions.get(signalId);
      if (attribution) {
        attribution.status = 'NETTED';
      }
    }
  }
  
  private inferEventType(signalType: string): string {
    // Map signal types to event types
    const mapping: Record<string, string> = {
      'tariff_threat': 'tariffs_enacted',
      'sanctions_warning': 'sanctions_imposed',
      'conflict_escalation': 'armed_conflict',
      'trade_investigation': 'trade_restrictions',
      'capital_control_warning': 'capital_controls_enacted'
    };
    
    return mapping[signalType] || 'unknown';
  }
}
```

**Acceptance Criteria:**
- [ ] Drift attributions recorded correctly
- [ ] Attribution retrieval by country and event type works
- [ ] Netting status tracked
- [ ] Unit tests pass

#### Task 4.2: Netting Engine (2 days)
**File:** `/workspace/shadcn-ui/src/services/csi/escalation/NettingEngine.ts` (NEW)

**Implementation:**
```typescript
class NettingEngine {
  private attributionTracker: DriftAttributionTracker;
  
  async calculateNettedEventImpact(event: ConfirmedEvent): Promise<number> {
    // Get prior drift attributable to this event
    const priorDrift = await this.attributionTracker.getAttributabledrift(
      event.country,
      event.event_type
    );
    
    // Calculate net impact
    const baseImpact = event.base_impact;
    const nettedImpact = Math.max(0, baseImpact - priorDrift);
    
    // Record netting in event metadata
    event.prior_drift_netted = priorDrift;
    
    // Mark drift as netted
    const relevantSignals = await this.getRelevantSignals(event);
    await this.attributionTracker.markAsNetted(relevantSignals.map(s => s.signal_id));
    
    return nettedImpact;
  }
  
  private async getRelevantSignals(event: ConfirmedEvent): Promise<Signal[]> {
    // Find signals that anticipated this event
    const allSignals = await this.signalStore.getSignalsByCountry(event.country);
    
    return allSignals.filter(s =>
      this.isSignalRelevantToEvent(s, event) &&
      this.isWithinTimeWindow(s, event)
    );
  }
  
  private isSignalRelevantToEvent(signal: Signal, event: ConfirmedEvent): boolean {
    // Check if signal type maps to event type
    const expectedEventType = this.inferEventType(signal.signal_type);
    return expectedEventType === event.event_type;
  }
  
  private isWithinTimeWindow(signal: Signal, event: ConfirmedEvent): boolean {
    // Signal must have been detected within 90 days before event
    const daysBetween = (event.confirmed_date.getTime() - signal.detected_date.getTime()) / (1000 * 60 * 60 * 24);
    return daysBetween >= 0 && daysBetween <= 90;
  }
}
```

**Acceptance Criteria:**
- [ ] Netting calculation correct
- [ ] Prior drift subtracted from event impact
- [ ] Relevant signals identified correctly
- [ ] Time window enforced (90 days)
- [ ] Unit tests pass

#### Task 4.3: Integration with Event Delta Engine (1 day)
**Objective:** Wire netting engine into event delta calculation

**Updated EventDeltaEngine:**
```typescript
class EventDeltaEngine {
  private nettingEngine: NettingEngine;
  
  async calculate(country: string, timestamp: Date): Promise<number> {
    const confirmedEvents = await this.getActiveEvents(country, timestamp);
    
    let totalDelta = 0;
    
    for (const event of confirmedEvents) {
      // Apply netting
      const nettedImpact = await this.nettingEngine.calculateNettedEventImpact(event);
      
      // Apply decay
      const decayedImpact = this.applyDecay(event, timestamp);
      
      // Use minimum of netted and decayed
      const effectiveImpact = Math.min(nettedImpact, decayedImpact);
      
      totalDelta += effectiveImpact;
    }
    
    return totalDelta;
  }
}
```

**Acceptance Criteria:**
- [ ] Netting applied to all confirmed events
- [ ] Event delta reflects netted impact
- [ ] Integration tests pass

### 6.2 Deliverables
- [ ] `DriftAttributionTracker.ts` (functional)
- [ ] `NettingEngine.ts` (functional)
- [ ] Integration with Event Delta Engine
- [ ] Unit tests (90%+ coverage)
- [ ] Documentation: Netting Logic Guide

---

## 7. Phase 5: Testing & Validation

**Duration:** 1 week (5 business days)  
**Team:** 1 QA engineer, 1 senior backend engineer, 1 data scientist (50%)  
**Objective:** Comprehensive testing and validation

### 7.1 Testing Strategy

#### 7.1.1 Unit Tests
- **Coverage Target:** 90%+
- **Focus Areas:**
  - Each engine in isolation
  - Edge cases (empty data, extreme values, etc.)
  - Constraint enforcement (caps, bounds, etc.)

#### 7.1.2 Integration Tests
- **Scenarios:**
  - End-to-end CSI calculation with all three components
  - Signal detection → corroboration → escalation drift → event confirmation → netting
  - Decay over time
  - Multiple concurrent signals and events

#### 7.1.3 Backtesting
- **Historical Events (5+):**
  1. US-China Trade War (2018-2019)
  2. Russia-Ukraine Conflict (2022)
  3. COVID-19 Pandemic (2020)
  4. Brexit (2016-2020)
  5. Iran Nuclear Deal Withdrawal (2018)

- **Validation Criteria:**
  - CSI drift rises 7-14 days before event confirmation
  - Event confirmation produces incremental (not full) impact
  - Unconfirmed threats decay appropriately
  - CSI movements align with market reactions (stock prices, currency, etc.)

#### 7.1.4 Performance Tests
- **Metrics:**
  - CSI calculation latency (<500ms for single country)
  - Ingestion throughput (>1000 articles/minute)
  - Database query performance
  - Memory usage under load

#### 7.1.5 Audit & Explainability Tests
- **Requirements:**
  - Every CSI movement traceable to source data
  - Audit logs complete and accurate
  - Explainability API returns correct attributions

### 7.2 Validation Checklist

**Functional Validation:**
- [ ] CSI formula matches specification exactly
- [ ] Structural baseline unchanged from legacy CSI
- [ ] Escalation drift rises before events
- [ ] Event confirmation produces netted impact
- [ ] Decay curves match specification
- [ ] Drift caps enforced correctly
- [ ] Source classification respected

**Data Validation:**
- [ ] All data sources integrated correctly
- [ ] Entity extraction accuracy >70%
- [ ] Corroboration logic working
- [ ] No duplicate signals/events

**Performance Validation:**
- [ ] CSI calculation <500ms
- [ ] Ingestion throughput >1000 articles/min
- [ ] Database queries optimized
- [ ] No memory leaks

**Audit Validation:**
- [ ] All CSI movements auditable
- [ ] Source attribution correct
- [ ] Explainability API functional

### 7.3 Deliverables
- [ ] Test suite (unit + integration + backtesting)
- [ ] Backtesting report with 5+ historical events
- [ ] Performance benchmarking report
- [ ] Audit & explainability validation report
- [ ] Bug fixes from testing
- [ ] Final documentation update

---

## 8. Data Architecture

### 8.1 Database Schema

**New Tables:**

```sql
-- Candidate Signals
CREATE TABLE candidate_signals (
  signal_id VARCHAR(255) PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  severity DECIMAL(3,2) NOT NULL,
  detected_date TIMESTAMP NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  corroboration_count INT NOT NULL,
  persistence_hours DECIMAL(10,2) NOT NULL,
  state VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country (country),
  INDEX idx_state (state),
  INDEX idx_detected_date (detected_date)
);

-- Signal Sources (many-to-many)
CREATE TABLE signal_sources (
  signal_id VARCHAR(255) NOT NULL,
  article_id VARCHAR(255) NOT NULL,
  source VARCHAR(100) NOT NULL,
  source_tier INT NOT NULL,
  published_date TIMESTAMP NOT NULL,
  relevance_score DECIMAL(3,2) NOT NULL,
  PRIMARY KEY (signal_id, article_id),
  FOREIGN KEY (signal_id) REFERENCES candidate_signals(signal_id),
  INDEX idx_source (source)
);

-- Qualified Signals (promoted from candidates)
CREATE TABLE qualified_signals (
  signal_id VARCHAR(255) PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  severity DECIMAL(3,2) NOT NULL,
  probability DECIMAL(3,2) NOT NULL,
  detected_date TIMESTAMP NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  corroboration_count INT NOT NULL,
  persistence_hours DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country (country),
  INDEX idx_last_updated (last_updated)
);

-- Drift Attributions
CREATE TABLE drift_attributions (
  attribution_id VARCHAR(255) PRIMARY KEY,
  signal_id VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  drift_amount DECIMAL(10,4) NOT NULL,
  attribution_date TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  netted_event_id VARCHAR(255),
  FOREIGN KEY (signal_id) REFERENCES qualified_signals(signal_id),
  INDEX idx_country_event (country, event_type),
  INDEX idx_status (status)
);

-- Decay Schedules
CREATE TABLE decay_schedules (
  schedule_id VARCHAR(255) PRIMARY KEY,
  signal_id VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  initial_drift DECIMAL(10,4) NOT NULL,
  decay_start_date TIMESTAMP NOT NULL,
  inactivity_window_days INT NOT NULL,
  decay_rate DECIMAL(5,4) NOT NULL,
  current_value DECIMAL(10,4) NOT NULL,
  status VARCHAR(50) NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES qualified_signals(signal_id),
  INDEX idx_country (country),
  INDEX idx_status (status)
);

-- CSI Components History
CREATE TABLE csi_components_history (
  history_id VARCHAR(255) PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  calculation_date TIMESTAMP NOT NULL,
  structural_baseline DECIMAL(10,4) NOT NULL,
  escalation_drift DECIMAL(10,4) NOT NULL,
  event_delta DECIMAL(10,4) NOT NULL,
  total_csi DECIMAL(10,4) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  active_signals_count INT NOT NULL,
  confirmed_events_count INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country_date (country, calculation_date),
  INDEX idx_calculation_date (calculation_date)
);

-- Audit Log
CREATE TABLE csi_audit_log (
  log_id VARCHAR(255) PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  action VARCHAR(100) NOT NULL,
  component VARCHAR(50) NOT NULL,
  delta_csi DECIMAL(10,4) NOT NULL,
  source_ids TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country_timestamp (country, timestamp),
  INDEX idx_action (action)
);
```

### 8.2 Data Retention Policy

| Data Type | Retention Period | Archival Strategy |
|-----------|------------------|-------------------|
| Candidate Signals | 90 days | Archive to cold storage |
| Qualified Signals | 2 years | Archive after resolution |
| Drift Attributions | 2 years | Archive after netting |
| Decay Schedules | 1 year | Delete after expiration |
| CSI Components History | Indefinite | Compress after 1 year |
| Audit Log | Indefinite | Compress after 6 months |

### 8.3 Performance Optimization

**Indexes:**
- Country-based queries (most common)
- Date range queries
- State/status filters

**Caching Strategy:**
- Structural baseline: 90-day cache
- Active signals: 1-hour cache
- CSI components: 15-minute cache

**Query Optimization:**
- Batch signal processing
- Parallel component calculation
- Pre-aggregated drift history

---

## 9. API Specifications

### 9.1 CSI Calculation API

**Endpoint:** `GET /api/csi/calculate`

**Request:**
```json
{
  "country": "China",
  "timestamp": "2026-02-06T12:00:00Z",
  "include_breakdown": true,
  "include_metadata": true
}
```

**Response:**
```json
{
  "country": "China",
  "timestamp": "2026-02-06T12:00:00Z",
  "csi": {
    "total": 58.24,
    "structural_baseline": 52.50,
    "escalation_drift": 3.74,
    "event_delta": 2.00
  },
  "breakdown": {
    "domains": {
      "political_stability": 62.5,
      "economic_conditions": 48.3,
      "regulatory_environment": 55.8,
      "geopolitical_tensions": 68.2,
      "social_factors": 52.1
    },
    "active_signals": [
      {
        "signal_id": "CHN-tariff_threat-2026-02-01-A3F2",
        "signal_type": "tariff_threat",
        "severity": 0.75,
        "probability": 0.70,
        "drift_contribution": 0.52,
        "detected_date": "2026-02-01T10:30:00Z",
        "persistence_hours": 120,
        "sources": ["reuters", "bloomberg", "ft"]
      },
      {
        "signal_id": "CHN-trade_investigation-2026-01-28-B7K9",
        "signal_type": "trade_investigation",
        "severity": 0.80,
        "probability": 0.85,
        "drift_contribution": 0.68,
        "detected_date": "2026-01-28T14:15:00Z",
        "persistence_hours": 216,
        "sources": ["reuters", "ap", "wsj", "nyt"]
      }
    ],
    "confirmed_events": [
      {
        "event_id": "CHN-sanctions_imposed-2026-01-15-C4M1",
        "event_type": "sanctions_imposed",
        "base_impact": 5.0,
        "prior_drift_netted": 3.0,
        "netted_impact": 2.0,
        "confirmed_date": "2026-01-15T09:00:00Z",
        "decay_status": "active"
      }
    ]
  },
  "metadata": {
    "confidence_score": 0.87,
    "data_completeness": 0.92,
    "last_updated": "2026-02-06T12:00:00Z",
    "calculation_time_ms": 342
  }
}
```

### 9.2 Signal Detection API

**Endpoint:** `POST /api/csi/signals/detect`

**Request:**
```json
{
  "article": {
    "title": "US announces tariff investigation on Chinese EVs",
    "content": "The Biden administration announced today...",
    "source": "reuters",
    "published_date": "2026-02-06T10:30:00Z",
    "url": "https://reuters.com/..."
  }
}
```

**Response:**
```json
{
  "signals_detected": [
    {
      "signal_id": "CHN-tariff_threat-2026-02-06-D8N3",
      "country": "China",
      "signal_type": "tariff_threat",
      "severity": 0.75,
      "detected_date": "2026-02-06T10:30:00Z",
      "state": "CANDIDATE",
      "corroboration_count": 1
    }
  ]
}
```

### 9.3 Explainability API

**Endpoint:** `GET /api/csi/explain`

**Request:**
```json
{
  "country": "China",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

**Response:**
```json
{
  "country": "China",
  "timestamp": "2026-02-06T12:00:00Z",
  "csi_total": 58.24,
  "explanation": {
    "structural_baseline": {
      "value": 52.50,
      "description": "Quarterly baseline based on World Bank, IMF, PRS data",
      "last_updated": "2026-01-01T00:00:00Z"
    },
    "escalation_drift": {
      "value": 3.74,
      "description": "Rising risk from 2 active escalation signals",
      "contributors": [
        {
          "signal_id": "CHN-tariff_threat-2026-02-01-A3F2",
          "contribution": 0.52,
          "reason": "Tariff threat detected 5 days ago, corroborated by 3 sources"
        },
        {
          "signal_id": "CHN-trade_investigation-2026-01-28-B7K9",
          "contribution": 0.68,
          "reason": "Trade investigation announced 9 days ago, corroborated by 4 sources"
        }
      ]
    },
    "event_delta": {
      "value": 2.00,
      "description": "Impact from 1 confirmed event",
      "contributors": [
        {
          "event_id": "CHN-sanctions_imposed-2026-01-15-C4M1",
          "contribution": 2.00,
          "reason": "Sanctions imposed 22 days ago, netted against prior drift of 3.0 points"
        }
      ]
    }
  },
  "audit_trail": [
    {
      "timestamp": "2026-02-06T12:00:00Z",
      "action": "CSI_CALCULATED",
      "delta": 0.00,
      "details": "Routine calculation"
    },
    {
      "timestamp": "2026-02-01T10:30:00Z",
      "action": "SIGNAL_DETECTED",
      "delta": +0.52,
      "details": "Tariff threat signal detected"
    },
    {
      "timestamp": "2026-01-15T09:00:00Z",
      "action": "EVENT_CONFIRMED",
      "delta": +2.00,
      "details": "Sanctions event confirmed (netted from 5.0)"
    }
  ]
}
```

---

## 10. Risk Mitigation

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data source API downtime | HIGH | MEDIUM | Implement fallback sources, caching, graceful degradation |
| Entity extraction accuracy <70% | HIGH | MEDIUM | Use pre-trained NER models, manual review for critical signals |
| Performance degradation under load | MEDIUM | MEDIUM | Load testing, query optimization, horizontal scaling |
| Drift calculation bugs | HIGH | LOW | Extensive unit tests, backtesting, manual validation |
| Database migration issues | MEDIUM | LOW | Staged rollout, backup/restore procedures |

### 10.2 Data Quality Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| False positive signals | MEDIUM | HIGH | Corroboration thresholds, source credibility weighting |
| Missed escalation signals | HIGH | MEDIUM | Multiple data sources, broad coverage, manual monitoring |
| Stale data from sources | MEDIUM | MEDIUM | Staleness detection, data quality penalties |
| Duplicate signals/events | LOW | MEDIUM | Deduplication logic, clustering algorithms |

### 10.3 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CSI behavior doesn't match expectations | HIGH | MEDIUM | Stakeholder demos, backtesting validation, parallel operation |
| Users don't understand new CSI | MEDIUM | HIGH | Documentation, training, explainability API |
| Competitive response | LOW | LOW | Patent filing, trade secret protection |
| Regulatory scrutiny | MEDIUM | LOW | Audit trails, transparency, compliance review |

---

## 11. Rollout Strategy

### 11.1 Phased Rollout

**Phase 1: Internal Testing (Week 1)**
- Deploy to staging environment
- Internal team testing
- Bug fixes

**Phase 2: Beta Testing (Week 2)**
- Deploy to production (shadow mode)
- Run old CSI and new CSI in parallel
- Compare outputs, identify discrepancies
- Selected beta users (5-10 companies)

**Phase 3: Limited Release (Week 3)**
- Enable new CSI for 25% of users
- Monitor performance, user feedback
- A/B testing

**Phase 4: Full Rollout (Week 4)**
- Enable new CSI for 100% of users
- Deprecate old CSI
- Monitor closely for 2 weeks

### 11.2 Rollback Plan

**Trigger Conditions:**
- Critical bug discovered
- Performance degradation >50%
- User complaints >10% of base

**Rollback Procedure:**
1. Disable new CSI calculation
2. Revert to old CSI formula
3. Notify users of temporary rollback
4. Fix issues in staging
5. Re-test and re-deploy

### 11.3 Communication Plan

**Internal:**
- Weekly status updates to leadership
- Daily standups with engineering team
- Slack channel for real-time updates

**External:**
- Beta user onboarding emails
- Documentation updates
- Webinar for all users (post-rollout)
- Release notes and changelog

---

## 12. Appendices

### Appendix A: Glossary

- **Escalation Drift:** Probability-weighted pre-event risk contribution to CSI
- **Netting:** Subtracting prior escalation drift from confirmed event impact to avoid double-counting
- **Corroboration:** Validation of a signal by multiple independent sources
- **Persistence:** Duration a signal has been active without resolution
- **Decay:** Gradual reduction of signal/event impact over time
- **Structural Baseline:** Slow-moving institutional risk component (quarterly updates)
- **Event Delta:** Confirmed regime change impact (real-time updates)

### Appendix B: References

1. Appendix B: Data Sources, Vector Mapping, and Parsing Logic
2. CSI Option 2: Expectation-Weighted Current Risk Architecture
3. CSI Alignment Input Document
4. Caldara, D., & Iacoviello, M. (2022). "Measuring Geopolitical Risk." *American Economic Review*
5. World Bank Worldwide Governance Indicators
6. IMF World Economic Outlook Database

### Appendix C: Contact Information

**Project Team:**
- **Project Lead:** [Name], [Email]
- **Engineering Lead:** [Name], [Email]
- **Data Science Lead:** [Name], [Email]
- **Product Manager:** [Name], [Email]

**Escalation Path:**
- **Technical Issues:** Engineering Lead → CTO
- **Data Quality Issues:** Data Science Lead → Chief Data Officer
- **Business Issues:** Product Manager → VP Product

---

## Approval & Sign-Off

**Document Prepared By:**
- [Your Name], Strategic Advisor
- Date: February 6, 2026

**Approval Required From:**
- [ ] CTO (Technical Feasibility)
- [ ] Chief Data Officer (Data Architecture)
- [ ] VP Product (Business Requirements)
- [ ] CFO (Budget Approval)

**Estimated Budget:** $150K (engineering time + data subscriptions)  
**Estimated Timeline:** 8 weeks  
**Expected ROI:** 15-20% increase in CSI predictive accuracy, 7-14 day lead time vs. competitors

---

**END OF DOCUMENT**