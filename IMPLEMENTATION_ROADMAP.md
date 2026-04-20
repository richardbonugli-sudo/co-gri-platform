# CO-GRI Platform - Complete Implementation Roadmap
## Remaining Work & Priority Phases

**Document Version:** 1.0  
**Date:** 2026-03-02  
**Current Completion:** ~75-80%  
**Estimated Time to 100%:** 9-13 weeks

---

## 📊 EXECUTIVE SUMMARY

### Current State
- ✅ **Core Infrastructure (95%)** - CSI calculation, 4-channel exposure, political alignment
- ✅ **Data Integration (90%)** - OECD, IMF, BIS, UN data sources integrated
- ✅ **UI Components (85%)** - Main dashboard, visualizations, reporting
- ⚠️ **Real-Time Features (20%)** - CSI enhancement system exists but not activated
- ⚠️ **Evidence System (60%)** - V3.4 hierarchy defined but not enforced
- ❌ **Testing (15%)** - Minimal test coverage
- ❌ **Live Data (0%)** - No real-time feeds

### Critical Gaps
1. **CSI Enhancement System** - Framework exists but isolated from main flow
2. **Real-Time Event Processing** - No live data feeds or automated updates
3. **Evidence Hierarchy Enforcement** - Quality assessment not transparent
4. **Database Persistence** - File-based only, no production database
5. **Testing Coverage** - Only 5 test files, no integration/E2E tests

---

## 🎯 PHASE A: CRITICAL INTEGRATION (Weeks 1-3)
**Priority:** CRITICAL  
**Goal:** Activate existing systems and fix core functionality gaps

### Week 1: CSI Enhancement Activation

#### Day 1-2: Orchestrator Integration
**Objective:** Connect CSI enhancement system to main application flow

**Tasks:**
- [ ] **Integrate orchestrator into main service**
  ```typescript
  // File: src/services/geographicExposureService.ts
  import { csiEngineOrchestrator } from './csi-enhancement/orchestrator';
  
  // Add initialization in service startup
  export async function initializeServices() {
    await csiEngineOrchestrator.initialize(SUPPORTED_COUNTRIES);
  }
  ```

- [ ] **Add signal processing endpoint**
  ```typescript
  // File: src/services/csi-enhancement/api.ts
  export async function processEscalationSignal(signal: EscalationSignal) {
    return await csiEngineOrchestrator.processSignal(signal);
  }
  ```

- [ ] **Connect to CSI calculation**
  ```typescript
  // File: src/services/geographicExposureService.ts
  export async function getCountryShockIndex(country: string) {
    // Replace static lookup with dynamic CSI
    return await csiEngineOrchestrator.getCSIScore(country);
  }
  ```

**Deliverable:** CSI scores update dynamically based on events

#### Day 3-4: Event Processing Pipeline
**Objective:** Enable real-time event candidate creation and validation

**Tasks:**
- [ ] **Activate escalation signal log**
  ```typescript
  // File: src/services/csi-enhancement/state/EscalationSignalLog.ts
  // Already exists - ensure it's being called
  ```

- [ ] **Enable gating validation**
  ```typescript
  // File: src/services/csi-enhancement/gating/GatingOrchestrator.ts
  // Connect validation rules to production flow
  export function enableGatingInProduction() {
    return {
      tierValidation: true,
      crossSourceConfirmation: true,
      temporalCoherence: true,
      vectorAlignment: true
    };
  }
  ```

- [ ] **Implement decay scheduling**
  ```typescript
  // File: src/services/csi-enhancement/calculation/DecayEngine.ts
  // Add cron job or interval for decay updates
  setInterval(async () => {
    await decayEngine.processDecay();
  }, 60 * 60 * 1000); // Hourly
  ```

**Deliverable:** Events are validated and decay over time

#### Day 5: Source Registry Population
**Objective:** Add initial data sources for event detection

**Tasks:**
- [ ] **Configure detection sources**
  ```typescript
  // File: src/services/csi-enhancement/sources/SourceRegistry.ts
  sourceRegistry.registerSource({
    sourceId: 'reuters-api',
    name: 'Reuters News API',
    type: 'detection',
    credibility: 0.85,
    updateFrequency: 'hourly'
  });
  ```

- [ ] **Add confirmation sources**
  ```typescript
  sourceRegistry.registerSource({
    sourceId: 'un-reports',
    name: 'UN Official Reports',
    type: 'confirmation',
    credibility: 0.95,
    updateFrequency: 'daily'
  });
  ```

- [ ] **Set up baseline refresh**
  ```typescript
  // Schedule baseline data updates
  cron.schedule('0 0 * * *', async () => {
    await baselineCalculator.refreshBaselines();
  });
  ```

**Deliverable:** System has active data sources configured

**Week 1 Success Criteria:**
- ✅ CSI scores update when events occur
- ✅ Event candidates are created and validated
- ✅ At least 3 data sources registered
- ✅ Integration tests pass

---

### Week 2: Evidence Hierarchy Enforcement

#### Day 1-2: V3.4 Integration
**Objective:** Enable evidence quality classification throughout system

**Tasks:**
- [ ] **Activate evidence hierarchy in main service**
  ```typescript
  // File: src/services/geographicExposureService.ts
  import { V34IntegrationService } from './v34Integration';
  
  export async function getCompanyGeographicExposure(ticker: string) {
    // Enable v3.4 enhancements
    return await V34IntegrationService.getEnhancedGeographicExposure(
      ticker,
      companyName,
      sector,
      homeCountry,
      { enableV34Enhancements: true }
    );
  }
  ```

- [ ] **Enforce 4-tier classification**
  ```typescript
  // File: src/services/v34EvidenceHierarchy.ts
  export function classifyEvidence(source: DataSource): EvidenceLevel {
    if (isStructuredTable(source)) return 'structured';
    if (isNarrativeDisclosure(source)) return 'narrative';
    if (isSupplementaryData(source)) return 'supplementary';
    return 'fallback';
  }
  ```

- [ ] **Activate document caching**
  ```typescript
  // File: src/services/v34EvidenceHierarchy.ts
  const documentCache = new DocumentCache({
    maxSize: 1000,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  });
  ```

**Deliverable:** All data sources have evidence level classification

#### Day 3-4: Evidence Quality Indicators
**Objective:** Display evidence quality in UI

**Tasks:**
- [ ] **Add evidence badges to UI**
  ```typescript
  // File: src/components/EvidenceBadge.tsx
  export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
    const badges = {
      structured: { icon: '✅', color: 'green', label: 'Structured' },
      narrative: { icon: '📄', color: 'blue', label: 'Narrative' },
      supplementary: { icon: '📊', color: 'yellow', label: 'Supplementary' },
      fallback: { icon: '🔄', color: 'gray', label: 'Fallback' }
    };
    return <Badge {...badges[level]} />;
  }
  ```

- [ ] **Show confidence scores**
  ```typescript
  // File: src/components/CountryExposureTable.tsx
  <td>
    <EvidenceBadge level={exposure.evidenceLevel} />
    <span className="text-xs">
      Confidence: {(exposure.confidence * 100).toFixed(0)}%
    </span>
  </td>
  ```

- [ ] **Add source attribution**
  ```typescript
  // File: src/components/VerificationDrawer.tsx
  <div className="source-attribution">
    <h4>Data Sources</h4>
    {sources.map(source => (
      <div key={source.id}>
        <span>{source.name}</span>
        <EvidenceBadge level={source.evidenceLevel} />
      </div>
    ))}
  </div>
  ```

**Deliverable:** Evidence quality visible throughout UI

#### Day 5: Documentation & Testing
**Objective:** Document evidence system and validate

**Tasks:**
- [ ] **Create evidence documentation**
  ```markdown
  # Evidence Hierarchy System
  
  ## Levels
  1. Structured (Tier 1) - Financial tables, SEC filings
  2. Narrative (Tier 2) - Management discussion, disclosures
  3. Supplementary (Tier 3) - Industry reports, analyst estimates
  4. Fallback (Tier 4) - Statistical proxies, global averages
  
  ## Confidence Scores
  - Structured: 90-100%
  - Narrative: 70-89%
  - Supplementary: 50-69%
  - Fallback: 30-49%
  ```

- [ ] **Write evidence tests**
  ```typescript
  // File: src/services/__tests__/v34EvidenceHierarchy.test.ts
  describe('Evidence Hierarchy', () => {
    it('should classify structured data correctly', () => {
      const source = { type: 'sec-10k', table: true };
      expect(classifyEvidence(source)).toBe('structured');
    });
  });
  ```

**Deliverable:** Evidence system documented and tested

**Week 2 Success Criteria:**
- ✅ All data sources have evidence levels
- ✅ Evidence badges visible in UI
- ✅ Confidence scores displayed
- ✅ Documentation complete
- ✅ Tests pass

---

### Week 3: Audit Trail Integration

#### Day 1-2: Audit Logging
**Objective:** Connect audit components to main flow

**Tasks:**
- [ ] **Implement audit logger**
  ```typescript
  // File: src/services/auditLogger.ts
  export class AuditLogger {
    async logCalculation(
      ticker: string,
      inputs: any,
      outputs: any,
      steps: CalculationStep[]
    ) {
      await db.auditLog.create({
        timestamp: new Date(),
        ticker,
        inputs: JSON.stringify(inputs),
        outputs: JSON.stringify(outputs),
        steps: JSON.stringify(steps)
      });
    }
  }
  ```

- [ ] **Add logging to calculation pipeline**
  ```typescript
  // File: src/services/geographicExposureService.ts
  export async function calculateCOGRI(company: Company) {
    const inputs = { company, shocks, alignments };
    const result = await cogriEngine.calculate(inputs);
    
    // Log for audit
    await auditLogger.logCalculation(
      company.ticker,
      inputs,
      result,
      result.calculationSteps
    );
    
    return result;
  }
  ```

**Deliverable:** All calculations logged for audit

#### Day 3-4: Audit UI Integration
**Objective:** Display audit trail in interface

**Tasks:**
- [ ] **Connect audit components**
  ```typescript
  // File: src/components/audit/AuditTrailPanel.tsx
  export function AuditTrailPanel({ ticker }: { ticker: string }) {
    const auditLogs = useQuery(['audit', ticker], () => 
      fetchAuditLogs(ticker)
    );
    
    return (
      <div className="audit-trail">
        {auditLogs.data?.map(log => (
          <AuditLogEntry key={log.id} log={log} />
        ))}
      </div>
    );
  }
  ```

- [ ] **Add audit export**
  ```typescript
  // File: src/services/auditExport.ts
  export async function exportAuditReport(ticker: string) {
    const logs = await fetchAuditLogs(ticker);
    const pdf = generateAuditPDF(logs);
    return pdf;
  }
  ```

**Deliverable:** Audit trail visible and exportable

#### Day 5: Compliance Reporting
**Objective:** Generate compliance reports

**Tasks:**
- [ ] **Create compliance report template**
  ```typescript
  // File: src/services/complianceReport.ts
  export function generateComplianceReport(ticker: string) {
    return {
      ticker,
      assessmentDate: new Date(),
      methodology: 'CO-GRI v3.4',
      dataSources: listDataSources(),
      evidenceLevels: summarizeEvidenceLevels(),
      calculationSteps: getCalculationSteps(),
      auditTrail: getAuditTrail()
    };
  }
  ```

- [ ] **Add compliance export**
  ```typescript
  // File: src/components/ComplianceExportButton.tsx
  export function ComplianceExportButton({ ticker }: { ticker: string }) {
    const handleExport = async () => {
      const report = await generateComplianceReport(ticker);
      downloadPDF(report, `compliance_${ticker}.pdf`);
    };
    
    return <Button onClick={handleExport}>Export Compliance Report</Button>;
  }
  ```

**Deliverable:** Compliance reports available

**Week 3 Success Criteria:**
- ✅ All calculations logged
- ✅ Audit trail visible in UI
- ✅ Audit export functional
- ✅ Compliance reports generated

---

## 🚀 PHASE B: REAL-TIME CAPABILITIES (Weeks 4-7)
**Priority:** HIGH  
**Goal:** Enable live data feeds and real-time event detection

### Week 4-5: Live Data Integration

#### Week 4: News API Integration
**Objective:** Connect to news aggregators for real-time signals

**Tasks:**
- [ ] **Set up NewsAPI integration**
  ```typescript
  // File: src/services/newsApi.ts
  import NewsAPI from 'newsapi';
  
  const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
  
  export async function fetchGeopoliticalNews() {
    const response = await newsapi.v2.everything({
      q: 'geopolitical OR sanctions OR conflict',
      language: 'en',
      sortBy: 'publishedAt'
    });
    return response.articles;
  }
  ```

- [ ] **Implement signal extraction**
  ```typescript
  // File: src/services/signalExtractor.ts
  export function extractSignalsFromNews(articles: Article[]) {
    return articles.map(article => {
      const signal: EscalationSignal = {
        signalId: generateId(),
        timestamp: new Date(article.publishedAt),
        country: extractCountry(article),
        vector: classifyVector(article),
        escalationLevel: assessSeverity(article),
        sourceId: 'newsapi',
        confidence: 0.7
      };
      return signal;
    });
  }
  ```

- [ ] **Set up automated ingestion**
  ```typescript
  // File: src/services/newsIngestion.ts
  cron.schedule('*/15 * * * *', async () => { // Every 15 minutes
    const articles = await fetchGeopoliticalNews();
    const signals = extractSignalsFromNews(articles);
    
    for (const signal of signals) {
      await csiEngineOrchestrator.processSignal(signal);
    }
  });
  ```

**Deliverable:** Real-time news signals processed

#### Week 5: Event Detection System
**Objective:** Automated event candidate creation

**Tasks:**
- [ ] **Implement event detector**
  ```typescript
  // File: src/services/eventDetector.ts
  export class EventDetector {
    async detectEvents() {
      const recentSignals = await escalationSignalLog.getRecent(24); // Last 24h
      const clusters = clusterSignals(recentSignals);
      
      for (const cluster of clusters) {
        if (cluster.signals.length >= 3) { // Threshold
          await createEventCandidate(cluster);
        }
      }
    }
  }
  ```

- [ ] **Add alert notifications**
  ```typescript
  // File: src/services/alerting.ts
  export async function sendAlert(event: EventCandidate) {
    if (event.escalationLevel === 'CRITICAL') {
      await slack.send({
        channel: '#geopolitical-alerts',
        text: `🚨 Critical Event: ${event.country} - ${event.vector}`
      });
    }
  }
  ```

- [ ] **Create event dashboard**
  ```typescript
  // File: src/components/EventDashboard.tsx
  export function EventDashboard() {
    const events = useQuery('active-events', fetchActiveEvents);
    
    return (
      <div className="event-dashboard">
        <h2>Active Geopolitical Events</h2>
        {events.data?.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  }
  ```

**Deliverable:** Automated event detection operational

**Week 4-5 Success Criteria:**
- ✅ News API connected and fetching
- ✅ Signals extracted from news
- ✅ Events detected automatically
- ✅ Alerts sent for critical events
- ✅ Event dashboard functional

---

### Week 6-7: Database & Persistence

#### Week 6: PostgreSQL Setup
**Objective:** Migrate to production database

**Tasks:**
- [ ] **Set up PostgreSQL**
  ```bash
  # Install PostgreSQL
  brew install postgresql@14
  
  # Create database
  createdb cogri_production
  ```

- [ ] **Define database schema**
  ```sql
  -- File: migrations/001_initial_schema.sql
  CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    home_country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    cogri_score DECIMAL(5,2),
    assessment_date TIMESTAMP,
    calculation_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    action VARCHAR(100),
    inputs JSONB,
    outputs JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **Implement data access layer**
  ```typescript
  // File: src/db/repositories/CompanyRepository.ts
  export class CompanyRepository {
    async findByTicker(ticker: string) {
      return await db.company.findUnique({
        where: { ticker }
      });
    }
    
    async saveAssessment(assessment: Assessment) {
      return await db.assessment.create({
        data: assessment
      });
    }
  }
  ```

**Deliverable:** PostgreSQL database operational

#### Week 7: User Management
**Objective:** Add authentication and user features

**Tasks:**
- [ ] **Set up Auth0/Clerk**
  ```typescript
  // File: src/auth/config.ts
  import { ClerkProvider } from '@clerk/nextjs';
  
  export function AuthProvider({ children }) {
    return (
      <ClerkProvider publishableKey={process.env.CLERK_KEY}>
        {children}
      </ClerkProvider>
    );
  }
  ```

- [ ] **Implement user profiles**
  ```typescript
  // File: src/db/models/User.ts
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'analyst' | 'viewer';
    savedAssessments: string[];
    watchlist: string[];
  }
  ```

- [ ] **Add saved assessments**
  ```typescript
  // File: src/services/userService.ts
  export async function saveAssessment(userId: string, ticker: string) {
    await db.user.update({
      where: { id: userId },
      data: {
        savedAssessments: {
          push: ticker
        }
      }
    });
  }
  ```

- [ ] **Implement watchlist**
  ```typescript
  // File: src/components/Watchlist.tsx
  export function Watchlist() {
    const { user } = useAuth();
    const watchlist = useQuery(['watchlist', user.id], 
      () => fetchWatchlist(user.id)
    );
    
    return (
      <div className="watchlist">
        {watchlist.data?.map(ticker => (
          <WatchlistItem key={ticker} ticker={ticker} />
        ))}
      </div>
    );
  }
  ```

**Deliverable:** User authentication and profiles

**Week 6-7 Success Criteria:**
- ✅ PostgreSQL database running
- ✅ Data migrated from files
- ✅ User authentication working
- ✅ Saved assessments functional
- ✅ Watchlist operational

---

## 🎓 PHASE C: ADVANCED FEATURES (Weeks 8-13)
**Priority:** MEDIUM  
**Goal:** ML capabilities, comprehensive testing, production readiness

### Week 8-10: ML & Analytics

#### Week 8: ML Infrastructure
**Objective:** Set up machine learning pipeline

**Tasks:**
- [ ] **Set up Python ML service**
  ```python
  # File: ml_service/app.py
  from flask import Flask, request, jsonify
  import pandas as pd
  from sklearn.ensemble import RandomForestRegressor
  
  app = Flask(__name__)
  model = None
  
  @app.route('/predict', methods=['POST'])
  def predict():
      data = request.json
      prediction = model.predict(data)
      return jsonify({'prediction': prediction.tolist()})
  ```

- [ ] **Implement model training**
  ```python
  # File: ml_service/train.py
  def train_cogri_predictor():
      # Load historical data
      df = pd.read_csv('historical_cogri.csv')
      
      # Features: exposure weights, CSI scores, alignment factors
      X = df[['exposure_china', 'exposure_taiwan', 'csi_china', 'csi_taiwan', 'alignment']]
      y = df['cogri_score']
      
      # Train model
      model = RandomForestRegressor(n_estimators=100)
      model.fit(X, y)
      
      return model
  ```

- [ ] **Connect ML service to frontend**
  ```typescript
  // File: src/services/mlService.ts
  export async function predictCOGRI(features: Features) {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    return response.json();
  }
  ```

**Deliverable:** ML prediction service operational

#### Week 9: Predictive Analytics
**Objective:** Implement risk prediction features

**Tasks:**
- [ ] **Create prediction dashboard**
  ```typescript
  // File: src/components/PredictionDashboard.tsx
  export function PredictionDashboard({ ticker }: { ticker: string }) {
    const prediction = useQuery(['prediction', ticker], 
      () => predictFutureCOGRI(ticker)
    );
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>30-Day Risk Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={prediction.data} />
          <div className="confidence-interval">
            <span>95% CI: [{prediction.lower}, {prediction.upper}]</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  ```

- [ ] **Implement backtesting**
  ```typescript
  // File: src/services/backtesting.ts
  export async function backtestModel() {
    const historicalData = await fetchHistoricalData();
    const predictions = [];
    const actuals = [];
    
    for (const dataPoint of historicalData) {
      const pred = await predictCOGRI(dataPoint.features);
      predictions.push(pred);
      actuals.push(dataPoint.actual);
    }
    
    return {
      mae: calculateMAE(predictions, actuals),
      rmse: calculateRMSE(predictions, actuals),
      r2: calculateR2(predictions, actuals)
    };
  }
  ```

**Deliverable:** Predictive analytics functional

#### Week 10: Portfolio Analytics
**Objective:** Multi-company risk aggregation

**Tasks:**
- [ ] **Implement portfolio analyzer**
  ```typescript
  // File: src/services/portfolioAnalyzer.ts
  export async function analyzePortfolio(tickers: string[]) {
    const assessments = await Promise.all(
      tickers.map(ticker => getCompanyAssessment(ticker))
    );
    
    return {
      portfolioCOGRI: calculateWeightedAverage(assessments),
      concentration: calculatePortfolioConcentration(assessments),
      topRisks: aggregateTopRisks(assessments),
      diversification: calculateDiversificationScore(assessments)
    };
  }
  ```

- [ ] **Create portfolio dashboard**
  ```typescript
  // File: src/components/PortfolioDashboard.tsx
  export function PortfolioDashboard({ portfolio }: { portfolio: Portfolio }) {
    const analysis = useQuery(['portfolio', portfolio.id], 
      () => analyzePortfolio(portfolio.tickers)
    );
    
    return (
      <div className="portfolio-dashboard">
        <PortfolioSummary data={analysis.data} />
        <RiskHeatMap companies={portfolio.companies} />
        <ConcentrationChart data={analysis.data} />
      </div>
    );
  }
  ```

**Deliverable:** Portfolio-level analytics

**Week 8-10 Success Criteria:**
- ✅ ML service deployed
- ✅ Risk predictions working
- ✅ Backtesting implemented
- ✅ Portfolio analytics functional
- ✅ Model performance tracked

---

### Week 11-13: Testing & Monitoring

#### Week 11: Comprehensive Testing
**Objective:** Achieve >85% test coverage

**Tasks:**
- [ ] **Write unit tests**
  ```typescript
  // File: src/services/__tests__/cogriPipeline.test.ts
  describe('CO-GRI Pipeline', () => {
    describe('Alignment Modifier', () => {
      it('should calculate W_c correctly', () => {
        const alignment = { UNAlign: 0.2, TreatyAlign: 0.1, EconDepend: 0.6 };
        expect(calculateAlignmentModifier(alignment)).toBeCloseTo(0.3);
      });
      
      it('should adjust shock correctly', () => {
        expect(adjustShock(72, 0.3, 0.5)).toBeCloseTo(61.2);
      });
    });
    
    describe('Exposure Normalization', () => {
      it('should normalize to sum of 1', () => {
        const exposures = new Map([
          ['China', { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 }],
          ['Taiwan', { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 }]
        ]);
        const normalized = normalizeExposures(exposures);
        const sum = Array.from(normalized.values()).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0);
      });
    });
  });
  ```

- [ ] **Write integration tests**
  ```typescript
  // File: src/__tests__/integration/companyAssessment.test.ts
  describe('Company Assessment Integration', () => {
    it('should calculate CO-GRI end-to-end', async () => {
      const result = await getCompanyAssessment('AAPL');
      
      expect(result.cogri).toBeGreaterThan(0);
      expect(result.cogri).toBeLessThan(100);
      expect(result.countryExposures).toHaveLength(5);
      expect(result.calculationSteps).toBeDefined();
    });
    
    it('should handle missing data gracefully', async () => {
      const result = await getCompanyAssessment('INVALID');
      expect(result.error).toBeDefined();
    });
  });
  ```

- [ ] **Write E2E tests**
  ```typescript
  // File: tests/e2e/fullWorkflow.spec.ts
  import { test, expect } from '@playwright/test';
  
  test('complete assessment workflow', async ({ page }) => {
    await page.goto('/');
    
    // Search for company
    await page.fill('[data-testid="search-input"]', 'AAPL');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="cogri-score"]');
    
    // Verify score displayed
    const score = await page.textContent('[data-testid="cogri-score"]');
    expect(parseFloat(score)).toBeGreaterThan(0);
    
    // Export report
    await page.click('[data-testid="export-button"]');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('COGRI_Assessment');
  });
  ```

**Deliverable:** Comprehensive test suite

#### Week 12: Performance Testing
**Objective:** Optimize for production load

**Tasks:**
- [ ] **Implement load testing**
  ```typescript
  // File: tests/performance/loadTest.ts
  import { check } from 'k6';
  import http from 'k6/http';
  
  export let options = {
    stages: [
      { duration: '2m', target: 100 }, // Ramp up
      { duration: '5m', target: 100 }, // Stay at 100 users
      { duration: '2m', target: 0 },   // Ramp down
    ],
  };
  
  export default function() {
    const res = http.get('http://localhost:3000/api/assessment/AAPL');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  ```

- [ ] **Add performance monitoring**
  ```typescript
  // File: src/utils/performance.ts
  export class PerformanceMonitor {
    static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      return fn().finally(() => {
        const duration = performance.now() - start;
        console.log(`${name} took ${duration}ms`);
        
        if (duration > 1000) {
          console.warn(`Slow operation: ${name}`);
        }
      });
    }
  }
  ```

- [ ] **Optimize slow queries**
  ```typescript
  // File: src/db/optimizations.ts
  // Add database indexes
  await db.$executeRaw`
    CREATE INDEX idx_assessments_ticker ON assessments(company_id);
    CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
  `;
  
  // Implement caching
  const cache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5 // 5 minutes
  });
  ```

**Deliverable:** Performance optimized

#### Week 13: Monitoring & Alerting
**Objective:** Production monitoring setup

**Tasks:**
- [ ] **Set up Sentry**
  ```typescript
  // File: src/monitoring/sentry.ts
  import * as Sentry from '@sentry/react';
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  ```

- [ ] **Implement health checks**
  ```typescript
  // File: src/api/health.ts
  export async function healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: await checkDatabase(),
        csiEngine: await checkCSIEngine(),
        mlService: await checkMLService()
      }
    };
  }
  ```

- [ ] **Configure alerts**
  ```typescript
  // File: src/monitoring/alerts.ts
  export async function sendAlert(alert: Alert) {
    if (alert.severity === 'critical') {
      await pagerduty.trigger({
        routing_key: process.env.PAGERDUTY_KEY,
        event_action: 'trigger',
        payload: {
          summary: alert.message,
          severity: 'critical',
          source: 'cogri-platform'
        }
      });
    }
    
    await slack.send({
      channel: '#alerts',
      text: `${alert.severity.toUpperCase()}: ${alert.message}`
    });
  }
  ```

**Deliverable:** Production monitoring active

**Week 11-13 Success Criteria:**
- ✅ >85% test coverage
- ✅ All integration tests pass
- ✅ E2E tests pass
- ✅ Performance benchmarks met (<500ms response)
- ✅ Monitoring and alerting configured

---

## 📈 DETAILED TASK BREAKDOWN

### Critical Path Items

#### 1. CSI Enhancement Activation (Week 1)
**Files to Modify:**
- `src/services/geographicExposureService.ts` - Add orchestrator integration
- `src/services/csi-enhancement/orchestrator.ts` - Ensure initialization
- `src/services/csi-enhancement/state/EscalationSignalLog.ts` - Activate logging
- `src/services/csi-enhancement/gating/GatingOrchestrator.ts` - Enable validation

**New Files to Create:**
- `src/services/csi-enhancement/api.ts` - API endpoints
- `src/services/csi-enhancement/cron.ts` - Scheduled jobs

**Testing:**
```typescript
// Test: CSI updates dynamically
const initialCSI = await getCountryShockIndex('China');
await processEscalationSignal(criticalSignal);
const updatedCSI = await getCountryShockIndex('China');
expect(updatedCSI).toBeGreaterThan(initialCSI);
```

#### 2. Evidence Hierarchy Enforcement (Week 2)
**Files to Modify:**
- `src/services/geographicExposureService.ts` - Enable v3.4
- `src/services/v34EvidenceHierarchy.ts` - Activate classification
- `src/components/CountryExposureTable.tsx` - Add evidence badges

**New Files to Create:**
- `src/components/EvidenceBadge.tsx` - Evidence level indicator
- `src/services/evidenceClassifier.ts` - Classification logic

**Testing:**
```typescript
// Test: Evidence levels assigned
const result = await getCompanyGeographicExposure('AAPL');
expect(result.countryExposures[0].evidenceLevel).toBeDefined();
expect(['structured', 'narrative', 'supplementary', 'fallback'])
  .toContain(result.countryExposures[0].evidenceLevel);
```

#### 3. Audit Trail Integration (Week 3)
**Files to Modify:**
- `src/services/geographicExposureService.ts` - Add audit logging
- `src/components/VerificationDrawer.tsx` - Show audit trail

**New Files to Create:**
- `src/services/auditLogger.ts` - Audit logging service
- `src/components/audit/AuditTrailPanel.tsx` - Audit UI
- `src/services/complianceReport.ts` - Compliance reporting

**Testing:**
```typescript
// Test: Calculations are logged
await calculateCOGRI(company);
const logs = await fetchAuditLogs(company.ticker);
expect(logs.length).toBeGreaterThan(0);
expect(logs[0].inputs).toBeDefined();
expect(logs[0].outputs).toBeDefined();
```

---

## 🎯 SUCCESS METRICS & KPIs

### Technical Metrics

#### Code Quality
- [ ] Test coverage >85% for core logic
- [ ] Zero critical bugs in CO-GRI pipeline
- [ ] <200ms average response time
- [ ] WCAG 2.1 AA accessibility compliance

#### Data Quality
- [ ] 100% accuracy vs reference implementation
- [ ] 0 exposure redistribution violations
- [ ] All alignment calculations validated

### User Metrics

#### Adoption
- [ ] >60% users export reports
- [ ] >40% sessions use multiple modes
- [ ] <5% lens confusion rate

#### Satisfaction
- [ ] >80% user satisfaction score
- [ ] <10% support ticket rate
- [ ] >70% understand lens distinction

---

## 🚨 RISK MITIGATION

### Technical Risks

#### Risk 1: CSI Enhancement Integration Complexity
**Mitigation:**
- Start with read-only integration
- Add write operations incrementally
- Extensive testing at each step

#### Risk 2: Real-Time Data Feed Reliability
**Mitigation:**
- Implement fallback to cached data
- Add circuit breakers
- Monitor feed health continuously

#### Risk 3: Database Migration Issues
**Mitigation:**
- Test migration on staging first
- Implement rollback procedures
- Keep file-based backup during transition

### Resource Risks

#### Risk 1: Timeline Slippage
**Mitigation:**
- Weekly progress reviews
- Prioritize critical path items
- Have buffer weeks built in

#### Risk 2: Scope Creep
**Mitigation:**
- Strict adherence to roadmap
- Document all change requests
- Defer non-critical features

---

## 📋 DELIVERABLES CHECKLIST

### Phase A (Weeks 1-3)
- [ ] CSI enhancement system activated
- [ ] Evidence hierarchy enforced
- [ ] Audit trail integrated
- [ ] Documentation updated
- [ ] Tests written and passing

### Phase B (Weeks 4-7)
- [ ] News API integrated
- [ ] Event detection operational
- [ ] PostgreSQL database deployed
- [ ] User authentication working
- [ ] Real-time updates functional

### Phase C (Weeks 8-13)
- [ ] ML prediction service deployed
- [ ] Portfolio analytics functional
- [ ] >85% test coverage achieved
- [ ] Performance optimized
- [ ] Monitoring and alerting configured

---

## 🎓 NEXT STEPS

### Immediate Actions (This Week)
1. **Review this roadmap** with stakeholders
2. **Set up development environment** for Phase A
3. **Create project board** with all tasks
4. **Assign team members** to each phase
5. **Schedule weekly check-ins**

### Week 1 Kickoff
1. **Day 1:** Team meeting, assign Week 1 tasks
2. **Day 2-4:** Implement CSI orchestrator integration
3. **Day 5:** Review and test Week 1 deliverables
4. **Weekend:** Buffer for any issues

### Communication Plan
- **Daily standups:** 15 minutes, progress updates
- **Weekly demos:** Friday afternoon, show progress
- **Bi-weekly stakeholder reviews:** Present completed phases
- **Monthly retrospectives:** Identify improvements

---

## 📚 APPENDIX

### A. Technology Stack

**Current:**
- TypeScript, React, Recharts, Tailwind CSS, Vitest, Node.js

**To Add:**
- Zustand/Redux (state management)
- React Query (data fetching)
- D3.js (advanced visualizations)
- Playwright (E2E testing)
- PostgreSQL (database)
- Auth0/Clerk (authentication)
- Sentry (error tracking)
- Python/Flask (ML service)

### B. File Structure Reference

```
src/
├── components/
│   ├── common/
│   │   ├── LensBadge.tsx
│   │   ├── EvidenceBadge.tsx
│   │   └── RiskLevelBadge.tsx
│   ├── company/
│   │   ├── CompanySummaryPanel.tsx
│   │   ├── COGRITrendChart.tsx
│   │   └── [8 more components]
│   └── audit/
│       ├── AuditTrailPanel.tsx
│       └── ComplianceReport.tsx
├── services/
│   ├── geographicExposureService.ts
│   ├── csi-enhancement/
│   │   ├── orchestrator.ts
│   │   ├── api.ts
│   │   └── [existing modules]
│   ├── v34EvidenceHierarchy.ts
│   ├── v34Integration.ts
│   ├── auditLogger.ts
│   ├── newsApi.ts
│   ├── eventDetector.ts
│   └── mlService.ts
├── db/
│   ├── schema.sql
│   ├── repositories/
│   │   ├── CompanyRepository.ts
│   │   └── AssessmentRepository.ts
│   └── migrations/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### C. API Endpoints

```
GET  /api/companies/:ticker
GET  /api/assessment/:ticker
POST /api/assessment/calculate
GET  /api/csi/:country
POST /api/signals/process
GET  /api/events/active
GET  /api/audit/:ticker
POST /api/export/pdf
GET  /api/health
```

### D. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cogri

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# APIs
NEWS_API_KEY=...
GDELT_API_KEY=...

# Monitoring
SENTRY_DSN=...
PAGERDUTY_API_KEY=...
SLACK_WEBHOOK_URL=...

# ML Service
ML_SERVICE_URL=http://localhost:5000
```

---

## 🎉 CONCLUSION

This roadmap provides a clear, actionable path to completing the CO-GRI platform. The phased approach ensures:

1. **Critical gaps addressed first** (Weeks 1-3)
2. **Real-time capabilities added** (Weeks 4-7)
3. **Advanced features implemented** (Weeks 8-13)

**Total Timeline:** 13 weeks (3 months)  
**Current Completion:** 75-80%  
**Target Completion:** 100%

By following this roadmap, you will have a **production-ready, enterprise-grade geopolitical risk assessment platform** with:
- ✅ Dynamic CSI scores
- ✅ Real-time event detection
- ✅ Transparent evidence hierarchy
- ✅ Full audit trail
- ✅ ML-powered predictions
- ✅ Comprehensive testing
- ✅ Production monitoring

**Ready to start? Let's begin with Week 1!** 🚀