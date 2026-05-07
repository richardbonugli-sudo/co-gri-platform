# Phase 2 Implementation Specification
## Baseline Drift Engine - Expectation-Weighted CSI

**Version**: 1.0  
**Date**: 2026-01-26  
**Status**: In Development  
**Owner**: Engineering Team  
**Duration**: 3 months (Months 4-6)  

---

## 1. Phase 2 Overview

### 1.1 Goal
Implement the expectation-weighted baseline drift calculation that transforms CSI from an event-reactive indicator to a forward-looking geopolitical risk pricing signal.

### 1.2 Core Innovation
**Traditional CSI**: Reacts to events after they occur  
**Enhanced CSI**: Prices in expectations before events materialize

### 1.3 Success Criteria
- ✅ Baseline drift calculated for all qualified signals
- ✅ Drift caps applied correctly (±10 points max)
- ✅ Decay functions working (3-month half-life)
- ✅ Parallel CSI calculation (legacy vs. enhanced)
- ✅ Backtesting shows improved predictive power
- ✅ Explainability layer provides clear reasoning

### 1.4 Dependencies
- ✅ Phase 1 operational (signals collecting)
- ✅ 30+ days of historical signal data
- ✅ Validated corroboration/persistence logic
- ✅ Production infrastructure stable

---

## 2. Baseline Drift Calculation

### 2.1 Conceptual Formula

```
Enhanced CSI = Legacy CSI + Baseline Drift

Where:
Baseline Drift = Σ (Signal Impact × Decay Factor × Drift Cap)

Signal Impact = f(severity, credibility, persistence, vector weight)
Decay Factor = e^(-λt) where λ = ln(2) / half_life
Drift Cap = min(|drift|, 10 points)
```

### 2.2 Mathematical Model

```typescript
interface BaselineDriftModel {
  /**
   * Calculate baseline drift for a country-vector pair
   */
  calculateDrift(
    country: string,
    vector: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7',
    signals: QualifiedSignal[],
    currentDate: Date
  ): number;

  /**
   * Calculate signal impact
   */
  calculateSignalImpact(signal: QualifiedSignal): number;

  /**
   * Calculate decay factor
   */
  calculateDecayFactor(signal: QualifiedSignal, currentDate: Date): number;

  /**
   * Apply drift cap
   */
  applyDriftCap(drift: number, maxDrift: number): number;
}
```

### 2.3 Signal Impact Calculation

```typescript
/**
 * Signal Impact = Base Impact × Severity Multiplier × Credibility × Persistence
 */
function calculateSignalImpact(signal: QualifiedSignal): number {
  // Base impact by vector
  const vectorWeights = {
    SC1: 3.0,  // Sanctions - High impact
    SC2: 2.5,  // Capital Controls - High impact
    SC3: 4.0,  // Nationalization - Very high impact
    SC4: 5.0,  // Conflict - Maximum impact
    SC5: 2.0,  // Political Instability - Medium impact
    SC6: 1.5,  // Regulatory - Lower impact
    SC7: 2.0   // Cyber - Medium impact
  };

  const baseImpact = vectorWeights[signal.primaryVector];

  // Severity multiplier
  const severityMultipliers = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    critical: 2.0
  };

  const severityMultiplier = severityMultipliers[signal.severity];

  // Credibility factor (0.6-1.0)
  const credibilityFactor = signal.sourceCredibility;

  // Persistence factor (0.6-1.0)
  const persistenceFactor = signal.persistenceScore || 0.7;

  // Combined impact
  const impact = baseImpact * severityMultiplier * credibilityFactor * persistenceFactor;

  return impact;
}
```

### 2.4 Decay Function

```typescript
/**
 * Exponential decay with 3-month half-life
 * Decay Factor = e^(-λt) where λ = ln(2) / 90 days
 */
function calculateDecayFactor(signal: QualifiedSignal, currentDate: Date): number {
  const halfLifeDays = 90; // 3 months
  const lambda = Math.log(2) / halfLifeDays;
  
  const daysSinceDetection = (currentDate.getTime() - signal.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  const decayFactor = Math.exp(-lambda * daysSinceDetection);
  
  return decayFactor;
}
```

### 2.5 Drift Cap Application

```typescript
/**
 * Apply ±10 point drift cap
 */
function applyDriftCap(drift: number, maxDrift: number = 10): number {
  if (drift > maxDrift) return maxDrift;
  if (drift < -maxDrift) return -maxDrift;
  return drift;
}
```

### 2.6 Complete Drift Calculation

```typescript
/**
 * Calculate baseline drift for country-vector pair
 */
function calculateBaselineDrift(
  country: string,
  vector: string,
  signals: QualifiedSignal[],
  currentDate: Date
): number {
  // Filter signals for this country-vector
  const relevantSignals = signals.filter(s =>
    s.countries.includes(country) &&
    s.primaryVector === vector &&
    s.isQualified
  );

  // Calculate drift contribution from each signal
  let totalDrift = 0;

  for (const signal of relevantSignals) {
    const impact = calculateSignalImpact(signal);
    const decay = calculateDecayFactor(signal, currentDate);
    const contribution = impact * decay;
    
    totalDrift += contribution;
  }

  // Apply drift cap
  const cappedDrift = applyDriftCap(totalDrift, 10);

  return cappedDrift;
}
```

---

## 3. Enhanced CSI Calculation

### 3.1 CSI Formula

```typescript
/**
 * Enhanced CSI = Legacy CSI + Baseline Drift
 */
interface EnhancedCSI {
  country: string;
  vector: string;
  legacyCSI: number;        // Original CSI (0-100)
  baselineDrift: number;    // Calculated drift (±10)
  enhancedCSI: number;      // Final score (0-100, clamped)
  signals: QualifiedSignal[]; // Contributing signals
  lastUpdated: Date;
  explanation: string;
}

function calculateEnhancedCSI(
  country: string,
  vector: string,
  legacyCSI: number,
  signals: QualifiedSignal[],
  currentDate: Date
): EnhancedCSI {
  // Calculate baseline drift
  const baselineDrift = calculateBaselineDrift(country, vector, signals, currentDate);

  // Calculate enhanced CSI
  let enhancedCSI = legacyCSI + baselineDrift;

  // Clamp to 0-100 range
  enhancedCSI = Math.max(0, Math.min(100, enhancedCSI));

  // Generate explanation
  const explanation = generateExplanation(country, vector, legacyCSI, baselineDrift, signals);

  return {
    country,
    vector,
    legacyCSI,
    baselineDrift,
    enhancedCSI,
    signals: signals.filter(s => s.countries.includes(country) && s.primaryVector === vector),
    lastUpdated: currentDate,
    explanation
  };
}
```

### 3.2 Explanation Generation

```typescript
/**
 * Generate human-readable explanation
 */
function generateExplanation(
  country: string,
  vector: string,
  legacyCSI: number,
  baselineDrift: number,
  signals: QualifiedSignal[]
): string {
  const vectorName = RISK_VECTORS[vector];
  const driftDirection = baselineDrift > 0 ? 'increased' : 'decreased';
  const driftMagnitude = Math.abs(baselineDrift).toFixed(1);

  const relevantSignals = signals.filter(s =>
    s.countries.includes(country) && s.primaryVector === vector
  );

  const topSignals = relevantSignals
    .sort((a, b) => calculateSignalImpact(b) - calculateSignalImpact(a))
    .slice(0, 3);

  let explanation = `${country} ${vectorName} CSI ${driftDirection} by ${driftMagnitude} points due to:\n`;

  topSignals.forEach((signal, i) => {
    const impact = calculateSignalImpact(signal);
    explanation += `${i + 1}. ${signal.headline} (impact: ${impact.toFixed(1)})\n`;
  });

  return explanation;
}
```

---

## 4. Database Schema Extensions

### 4.1 New Tables

```sql
-- Enhanced CSI scores
CREATE TABLE enhanced_csi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country VARCHAR(2) NOT NULL,
  vector VARCHAR(3) NOT NULL,
  
  -- Scores
  legacy_csi DECIMAL(5,2) NOT NULL,
  baseline_drift DECIMAL(5,2) NOT NULL,
  enhanced_csi DECIMAL(5,2) NOT NULL,
  
  -- Metadata
  signal_count INTEGER NOT NULL,
  top_signals UUID[],
  explanation TEXT,
  
  -- Timestamps
  calculated_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(country, vector, calculated_at),
  CHECK (enhanced_csi >= 0 AND enhanced_csi <= 100),
  CHECK (baseline_drift >= -10 AND baseline_drift <= 10)
);

CREATE INDEX idx_enhanced_csi_country ON enhanced_csi (country);
CREATE INDEX idx_enhanced_csi_vector ON enhanced_csi (vector);
CREATE INDEX idx_enhanced_csi_calculated_at ON enhanced_csi (calculated_at DESC);

-- CSI calculation history
CREATE TABLE csi_calculation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_run_id UUID NOT NULL,
  
  -- Statistics
  countries_processed INTEGER,
  vectors_processed INTEGER,
  total_calculations INTEGER,
  avg_drift DECIMAL(5,2),
  max_drift DECIMAL(5,2),
  min_drift DECIMAL(5,2),
  
  -- Performance
  duration_ms INTEGER,
  signals_analyzed INTEGER,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calculation_log_run_id ON csi_calculation_log (calculation_run_id);
CREATE INDEX idx_calculation_log_started_at ON csi_calculation_log (started_at DESC);

-- Signal contributions (for explainability)
CREATE TABLE signal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enhanced_csi_id UUID NOT NULL REFERENCES enhanced_csi(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  
  -- Contribution metrics
  impact_score DECIMAL(5,2) NOT NULL,
  decay_factor DECIMAL(5,4) NOT NULL,
  contribution DECIMAL(5,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(enhanced_csi_id, signal_id)
);

CREATE INDEX idx_contributions_csi ON signal_contributions (enhanced_csi_id);
CREATE INDEX idx_contributions_signal ON signal_contributions (signal_id);
```

### 4.2 Views

```sql
-- Latest enhanced CSI scores
CREATE OR REPLACE VIEW latest_enhanced_csi AS
SELECT DISTINCT ON (country, vector)
  country,
  vector,
  legacy_csi,
  baseline_drift,
  enhanced_csi,
  signal_count,
  explanation,
  calculated_at
FROM enhanced_csi
ORDER BY country, vector, calculated_at DESC;

-- CSI comparison (legacy vs enhanced)
CREATE OR REPLACE VIEW csi_comparison AS
SELECT
  country,
  vector,
  legacy_csi,
  enhanced_csi,
  baseline_drift,
  (enhanced_csi - legacy_csi) as difference,
  CASE
    WHEN ABS(enhanced_csi - legacy_csi) > 5 THEN 'significant'
    WHEN ABS(enhanced_csi - legacy_csi) > 2 THEN 'moderate'
    ELSE 'minor'
  END as divergence_level,
  calculated_at
FROM latest_enhanced_csi;

-- Top drift countries
CREATE OR REPLACE VIEW top_drift_countries AS
SELECT
  country,
  vector,
  baseline_drift,
  signal_count,
  calculated_at
FROM latest_enhanced_csi
ORDER BY ABS(baseline_drift) DESC
LIMIT 50;
```

---

## 5. Implementation Components

### 5.1 Drift Calculator

```typescript
// File: src/services/csi-enhancement/drift/DriftCalculator.ts

export class DriftCalculator {
  private halfLifeDays: number = 90;
  private maxDrift: number = 10;

  /**
   * Calculate drift for all country-vector pairs
   */
  async calculateAllDrifts(
    signals: QualifiedSignal[],
    currentDate: Date
  ): Promise<Map<string, number>> {
    const drifts = new Map<string, number>();

    // Get unique country-vector pairs
    const pairs = this.getCountryVectorPairs(signals);

    for (const [country, vector] of pairs) {
      const drift = this.calculateDrift(country, vector, signals, currentDate);
      const key = `${country}:${vector}`;
      drifts.set(key, drift);
    }

    return drifts;
  }

  /**
   * Calculate drift for specific country-vector
   */
  calculateDrift(
    country: string,
    vector: string,
    signals: QualifiedSignal[],
    currentDate: Date
  ): number {
    const relevantSignals = signals.filter(s =>
      s.countries.includes(country) &&
      s.primaryVector === vector &&
      s.isQualified
    );

    let totalDrift = 0;

    for (const signal of relevantSignals) {
      const impact = this.calculateSignalImpact(signal);
      const decay = this.calculateDecayFactor(signal, currentDate);
      totalDrift += impact * decay;
    }

    return this.applyDriftCap(totalDrift);
  }

  // ... implementation methods
}
```

### 5.2 CSI Engine

```typescript
// File: src/services/csi-enhancement/csi/CSIEngine.ts

export class CSIEngine {
  private driftCalculator: DriftCalculator;
  private storage: SignalStorage;
  private csiStorage: CSIStorage;

  /**
   * Calculate enhanced CSI for all countries
   */
  async calculateEnhancedCSI(
    currentDate: Date = new Date()
  ): Promise<EnhancedCSI[]> {
    // Get qualified signals
    const signals = await this.storage.findQualifiedSignals();

    // Calculate drifts
    const drifts = await this.driftCalculator.calculateAllDrifts(signals, currentDate);

    // Get legacy CSI scores
    const legacyScores = await this.getLegacyCSIScores();

    // Calculate enhanced CSI
    const enhancedScores: EnhancedCSI[] = [];

    for (const [key, drift] of drifts) {
      const [country, vector] = key.split(':');
      const legacyCSI = legacyScores.get(key) || 50; // Default to 50 if no legacy score

      const enhanced = this.calculateEnhanced(
        country,
        vector,
        legacyCSI,
        drift,
        signals,
        currentDate
      );

      enhancedScores.push(enhanced);
    }

    // Save to database
    await this.csiStorage.saveEnhancedCSI(enhancedScores);

    return enhancedScores;
  }

  // ... implementation methods
}
```

---

## 6. Development Milestones

### Month 4: Core Drift Engine

**Week 1-2: Drift Calculation**
- [ ] Implement DriftCalculator class
- [ ] Signal impact calculation
- [ ] Decay function implementation
- [ ] Drift cap application
- [ ] Unit tests

**Week 3-4: CSI Engine**
- [ ] Implement CSIEngine class
- [ ] Legacy CSI integration
- [ ] Enhanced CSI calculation
- [ ] Database schema extensions
- [ ] Integration tests

**Deliverables:**
- ✅ Drift calculator operational
- ✅ CSI engine functional
- ✅ Database schema deployed
- ✅ Unit tests passing

### Month 5: Explainability & Validation

**Week 5-6: Explainability Layer**
- [ ] Explanation generator
- [ ] Signal contribution tracking
- [ ] Visualization components
- [ ] API endpoints

**Week 7-8: Backtesting**
- [ ] Historical data preparation
- [ ] Parallel CSI calculation
- [ ] Performance comparison
- [ ] Validation metrics

**Deliverables:**
- ✅ Explainability working
- ✅ Backtesting complete
- ✅ Validation passed
- ✅ Performance metrics

### Month 6: Integration & Launch

**Week 9-10: System Integration**
- [ ] Integrate with Phase 1
- [ ] Scheduler updates
- [ ] Monitoring enhancements
- [ ] API documentation

**Week 11-12: Beta Testing**
- [ ] Beta user group
- [ ] Feedback collection
- [ ] Bug fixes
- [ ] Production deployment

**Deliverables:**
- ✅ Full system integrated
- ✅ Beta testing complete
- ✅ Production ready
- ✅ Documentation complete

---

## 7. Acceptance Criteria

### Functional Requirements
- ✅ FR1: Drift calculated for all country-vector pairs
- ✅ FR2: Drift capped at ±10 points
- ✅ FR3: Decay function with 3-month half-life
- ✅ FR4: Enhanced CSI clamped to 0-100
- ✅ FR5: Explanation generated for each score
- ✅ FR6: Parallel calculation (legacy + enhanced)
- ✅ FR7: Historical backtesting functional
- ✅ FR8: API endpoints operational

### Non-Functional Requirements
- ✅ NFR1: Calculation latency <30 seconds for all countries
- ✅ NFR2: Daily CSI refresh
- ✅ NFR3: 99.9% calculation accuracy
- ✅ NFR4: Explainability for 100% of scores
- ✅ NFR5: Backtesting shows >10% improvement in predictive power

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Drift Coverage** | 100% of country-vectors | Count |
| **Calculation Speed** | <30 sec | Timer |
| **Accuracy** | >99% | Validation |
| **Predictive Power** | +10% vs legacy | Backtesting |
| **Explainability** | 100% | Coverage |

---

**Phase 2 Specification Complete**  
**Ready for Implementation**  
**ETA: 3 months (Months 4-6)**