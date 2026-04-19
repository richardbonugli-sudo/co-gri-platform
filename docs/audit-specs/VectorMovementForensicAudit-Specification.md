# CSI Vector Movement & Expectation-Weighted Forensic Audit
## Technical Specification Document

**Document Version:** 1.0  
**Date:** February 24, 2026  
**Status:** Phase 1 - Specification Only (No Implementation)  
**Audit Type:** Standalone Internal Integrity Diagnostic  

---

## Executive Summary

### Purpose
This audit validates the internal structural integrity of the Country Shock Index (CSI) system by examining raw movement totals, routing behavior, suppression dynamics, baseline construction, probability/severity scaling, and decay behavior across all seven risk vectors.

### Core Question
Is the CSI system functioning as a real-time, expectation-weighted, 7-vector geopolitical risk model, or is it effectively operating as only a 2-vector (Governance + Conflict) system?

### Scope
- **Time Period:** Last 24 months (primary window: last 90 days; secondary window: rolling 12 months)
- **Execution:** On-demand (not scheduled)
- **Approach:** Work from raw pipeline data upward, no dashboard aggregates
- **Output:** Pure diagnostic report with no pass/fail language

### Key Objectives
1. Reconcile whether Governance/Conflict truly dominate raw movement or if prior contradictions were aggregation artifacts
2. Resolve contradictions between distributed drift shares (~20% each) and dominance values in thousands of percent
3. Identify misrouting, confirmation bottlenecks, vector starvation, and suppression bias
4. Validate that all 7 vectors generate non-trivial movement
5. Confirm probability weighting varies appropriately and events decay properly

---

## Audit Objectives

### Primary Objectives
1. **Vector Activity Validation:** Confirm all 7 CSI risk vectors are generating measurable movement (drift + event deltas)
2. **Routing Integrity:** Verify signals are correctly classified to their appropriate risk vector
3. **Suppression Analysis:** Identify whether certain vectors are disproportionately suppressed downstream
4. **Baseline Structural Correctness:** Validate baseline factors are populated for all vectors across all countries
5. **Expectation Weighting Verification:** Confirm probability and severity scaling is functioning as designed
6. **Decay Behavior Validation:** Ensure events decay appropriately without permanent CSI inflation

### Secondary Objectives
1. Identify feed imbalances or over-reliance on specific data sources
2. Detect confirmation bottlenecks that may prevent event delta application
3. Reconcile denominator inconsistencies in dominance calculations
4. Validate near-term horizon constraints are functioning

---

## Technical Architecture

### System Context

The CSI system processes geopolitical signals through a multi-stage pipeline:

```
Ingestion → Routing → Scoring → Weighting → Output
```

**7 CSI Risk Vectors:**
1. Conflict & Security
2. Sanctions & Regulatory Pressure
3. Trade & Logistics
4. Governance & Rule of Law
5. Cyber & Data
6. Civil Unrest & Domestic Stability
7. Currency & Capital Controls

**CSI Calculation Formula:**
```
CSI(country, date) = Baseline + Escalation_Drift + Event_Delta
```

Where:
- **Baseline:** Historical structural risk level
- **Escalation_Drift:** Pre-confirmation signals indicating rising risk
- **Event_Delta:** Confirmed event impacts with expectation weighting

### Audit Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Raw Pipeline)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Signals  │  │ Events   │  │ Baseline │  │ CSI      │   │
│  │ Table    │  │ Table    │  │ Factors  │  │ Traces   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Analysis Layer (9 Sections)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Absolute Movement Ledger                          │   │
│  │ 2. Movement Denominator Reconciliation               │   │
│  │ 3. Real-World Routing & Confirmation Sample          │   │
│  │ 4. Rolling Vector Activity (12-Month Time Series)    │   │
│  │ 5. Suppression & Scoring Dynamics                    │   │
│  │ 6. Baseline Factor Structural Matrix                 │   │
│  │ 7. Source-to-Vector Ingestion & Concentration        │   │
│  │ 8. Expectation Weighting Integrity                   │   │
│  │ 9. Near-Term Horizon & Decay Behavior                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Report Generation                       │
│              (Markdown + Interactive Dashboard)              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Extract:** Query raw pipeline tables (signals, events, baseline_factors, csi_traces)
2. **Transform:** Apply section-specific calculations and aggregations
3. **Analyze:** Generate diagnostic metrics and identify anomalies
4. **Report:** Output structured findings with supporting data tables

---

## Data Requirements

### Primary Data Sources

#### 1. Signals Table
**Purpose:** Raw detected signals before confirmation

**Required Fields:**
```typescript
interface Signal {
  signal_id: string;
  country_id: string;
  detection_date: Date;
  raw_headline: string;
  source: string;
  predicted_vector: CSIRiskVector;
  confidence_score: number;
  status: 'active' | 'confirmed' | 'suppressed' | 'discarded';
  suppression_reason?: string;
  drift_points: number;
  created_at: Date;
}
```

**Classification Rules:**
- **Suppressed:** Signal detected and routed but prevented from contributing to CSI due to netting, capping, or quality filters
- **Discarded:** Signal filtered out before scoring (pre-routing rejection, duplicate, low confidence)

#### 2. Events Table
**Purpose:** Confirmed events with applied deltas

**Required Fields:**
```typescript
interface Event {
  event_id: string;
  country_id: string;
  confirmation_date: Date;
  event_description: string;
  vector: CSIRiskVector;
  probability: number; // 0.0 - 1.0
  severity_score: number; // 0.0 - 10.0
  relevance_weight: number; // 0.0 - 1.0
  raw_delta: number;
  applied_delta: number;
  days_active: number;
  decay_half_life: number;
  peak_delta: number;
  days_to_peak: number;
  created_at: Date;
}
```

#### 3. Baseline Factors Table
**Purpose:** Structural baseline risk components

**Required Fields:**
```typescript
interface BaselineFactor {
  country_id: string;
  vector: CSIRiskVector;
  factor_value: number;
  source: string;
  timestamp: Date;
  fallback_type: 'direct' | 'regional' | 'neutral';
  weight: number;
  weighted_contribution: number;
}
```

#### 4. CSI Traces Table
**Purpose:** Historical CSI calculations

**Required Fields:**
```typescript
interface CSITrace {
  country_id: string;
  calculation_date: Date;
  csi_total: number;
  baseline_total: number;
  escalation_drift_total: number;
  event_delta_total: number;
  by_vector: {
    [vector: string]: {
      baseline: number;
      drift_v: number;
      event_delta_v: number;
      active_signals: number;
      active_events: number;
    };
  };
}
```

### Data Quality Requirements

1. **Completeness:** All 195 UN-recognized countries must have baseline factors for all 7 vectors
2. **Freshness:** Data must include at least the last 24 months
3. **Granularity:** Daily-level data for time series analysis
4. **Traceability:** All signals must have source attribution and routing decisions logged

---

## Section-by-Section Specifications

### SECTION 1: Absolute Movement Ledger (Raw Totals Only)

**Objective:** Reconcile whether Governance/Conflict truly dominate raw movement or if prior contradictions were aggregation artifacts.

**Time Window:** Last 90 days

**Data Query:**
```sql
SELECT 
  vector,
  SUM(drift_points) as total_drift_points,
  SUM(CASE WHEN status = 'confirmed' THEN event_delta ELSE 0 END) as total_event_points,
  SUM(drift_points) + SUM(CASE WHEN status = 'confirmed' THEN event_delta ELSE 0 END) as total_movement_points,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as total_confirmed_items,
  COUNT(*) as total_detected_items,
  COUNT(CASE WHEN status = 'suppressed' THEN 1 END) as items_suppressed,
  COUNT(CASE WHEN status = 'discarded' THEN 1 END) as items_discarded_pre_scoring
FROM signals
WHERE detection_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY vector
ORDER BY total_movement_points DESC;
```

**Calculation Formulas:**

1. **Total Drift Points:**
   ```
   Total_Drift_Points(vector) = Σ drift_points for all signals in vector
   ```

2. **Total Event Points:**
   ```
   Total_Event_Points(vector) = Σ applied_delta for all confirmed events in vector
   ```

3. **Total Movement Points:**
   ```
   Total_Movement_Points(vector) = Total_Drift_Points + Total_Event_Points
   ```

**Output Format:**
```
| Vector                          | Total Drift | Total Event | Total Movement | Confirmed | Detected | Suppressed | Discarded |
|                                 | Points      | Points      | Points         | Items     | Items    | Items      | Pre-Score |
|---------------------------------|-------------|-------------|----------------|-----------|----------|------------|-----------|
| Conflict & Security             | 245.3       | 89.7        | 335.0          | 23        | 156      | 12         | 45        |
| Sanctions & Regulatory Pressure | 178.2       | 67.4        | 245.6          | 18        | 134      | 8          | 38        |
| Trade & Logistics               | 156.8       | 45.2        | 202.0          | 15        | 98       | 6          | 22        |
| Governance & Rule of Law        | 312.5       | 112.3       | 424.8          | 31        | 203      | 15         | 67        |
| Cyber & Data                    | 89.4        | 23.1        | 112.5          | 8         | 67       | 4          | 18        |
| Civil Unrest & Domestic Stab.   | 134.6       | 56.8        | 191.4          | 14        | 112      | 7          | 29        |
| Currency & Capital Controls     | 98.7        | 34.5        | 133.2          | 11        | 89       | 5          | 24        |
```

**Success Criteria:**
- **Non-Trivial Movement:** Each vector should show Total Movement Points > 50.0 over 90 days
- **Detection Activity:** Each vector should have Detected Items > 50 over 90 days
- **Balanced Distribution:** No single vector should account for >40% of total movement points

---

### SECTION 2: Movement Denominator Reconciliation

**Objective:** Resolve contradictions between distributed drift shares and dominance values in thousands of percent.

**Explicit Definitions Required:**

1. **Drift Share by Vector:**
   ```
   Drift_Share(vector) = Total_Drift_Points(vector) / Σ Total_Drift_Points(all vectors)
   ```
   **Denominator:** Sum of drift points across all 7 vectors

2. **Event Share by Vector:**
   ```
   Event_Share(vector) = Total_Event_Points(vector) / Σ Total_Event_Points(all vectors)
   ```
   **Denominator:** Sum of event points across all 7 vectors

3. **Vector Dominance %:**
   ```
   Vector_Dominance(vector) = (Total_Movement_Points(vector) / Average_Movement_Points(all vectors)) × 100%
   ```
   **Denominator:** Average (mean) movement points across all 7 vectors
   
   **Note:** This can exceed 100% if a vector is above average. A value of 200% means the vector has twice the average movement.

4. **Alternative Dominance (Share-Based):**
   ```
   Vector_Share(vector) = Total_Movement_Points(vector) / Σ Total_Movement_Points(all vectors) × 100%
   ```
   **Denominator:** Sum of movement points across all 7 vectors
   
   **Note:** This will always sum to 100% across all vectors.

**Data Query:**
```sql
WITH vector_totals AS (
  SELECT 
    vector,
    SUM(drift_points) as drift_total,
    SUM(CASE WHEN status = 'confirmed' THEN event_delta ELSE 0 END) as event_total,
    SUM(drift_points) + SUM(CASE WHEN status = 'confirmed' THEN event_delta ELSE 0 END) as movement_total
  FROM signals
  WHERE detection_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY vector
),
aggregates AS (
  SELECT 
    SUM(drift_total) as total_drift_all,
    SUM(event_total) as total_event_all,
    SUM(movement_total) as total_movement_all,
    AVG(movement_total) as avg_movement
  FROM vector_totals
)
SELECT 
  vt.vector,
  vt.drift_total,
  vt.event_total,
  vt.movement_total,
  (vt.drift_total / a.total_drift_all * 100) as drift_share_pct,
  (vt.event_total / a.total_event_all * 100) as event_share_pct,
  (vt.movement_total / a.avg_movement * 100) as dominance_vs_avg_pct,
  (vt.movement_total / a.total_movement_all * 100) as share_of_total_pct
FROM vector_totals vt
CROSS JOIN aggregates a
ORDER BY vt.movement_total DESC;
```

**Output Format:**
```
| Vector                          | Drift   | Event   | Movement | Drift  | Event  | Dominance | Share of |
|                                 | Total   | Total   | Total    | Share% | Share% | vs Avg %  | Total %  |
|---------------------------------|---------|---------|----------|--------|--------|-----------|----------|
| Governance & Rule of Law        | 312.5   | 112.3   | 424.8    | 21.8%  | 26.1%  | 234%      | 23.4%    |
| Conflict & Security             | 245.3   | 89.7    | 335.0    | 17.1%  | 20.9%  | 184%      | 18.4%    |
| Sanctions & Regulatory Pressure | 178.2   | 67.4    | 245.6    | 12.4%  | 15.7%  | 135%      | 13.5%    |
| Trade & Logistics               | 156.8   | 45.2    | 202.0    | 10.9%  | 10.5%  | 111%      | 11.1%    |
| Civil Unrest & Domestic Stab.   | 134.6   | 56.8    | 191.4    | 9.4%   | 13.2%  | 105%      | 10.5%    |
| Currency & Capital Controls     | 98.7    | 34.5    | 133.2    | 6.9%   | 8.0%   | 73%       | 7.3%     |
| Cyber & Data                    | 89.4    | 23.1    | 112.5    | 6.2%   | 5.4%   | 62%       | 6.2%     |
```

**Explanation of Metrics:**
- **Drift Share %:** Percentage of total drift points attributed to this vector (sums to 100%)
- **Event Share %:** Percentage of total event points attributed to this vector (sums to 100%)
- **Dominance vs Avg %:** How this vector compares to the average across all vectors (100% = average)
- **Share of Total %:** Percentage of total movement points (sums to 100%)

**Success Criteria:**
- All percentages should be mathematically consistent
- Dominance values >100% indicate above-average activity (not an error)
- No vector should show Share of Total >50% (indicating over-dominance)

---

### SECTION 3: Real-World Routing & Confirmation Sample (Non-Synthetic)

**Objective:** Identify misrouting, confirmation bottlenecks, vector starvation, and downstream suppression bias.

**Sample Requirements:**
- **Sample Size:** 100 real detected items from last 180 days
- **Distribution:** Attempt ≥10 items per vector (if unavailable, state actual count)
- **Exclusions:** Synthetic test injections excluded
- **Selection Method:** Random sampling stratified by vector

**Data Query:**
```sql
WITH vector_samples AS (
  SELECT 
    signal_id,
    country_id,
    raw_headline,
    detection_date,
    predicted_vector,
    status as confirmation_status,
    drift_points,
    COALESCE(event_delta, 0) as event_points,
    CASE WHEN status = 'suppressed' THEN 'Y' ELSE 'N' END as suppressed,
    suppression_reason,
    ROW_NUMBER() OVER (PARTITION BY predicted_vector ORDER BY RANDOM()) as rn
  FROM signals
  WHERE detection_date >= CURRENT_DATE - INTERVAL '180 days'
    AND source != 'synthetic_test'
)
SELECT 
  signal_id as item_id,
  raw_headline,
  detection_date as date,
  predicted_vector,
  confirmation_status,
  drift_points,
  event_points,
  suppressed,
  suppression_reason
FROM vector_samples
WHERE rn <= 15  -- Oversample to ensure ≥10 per vector
ORDER BY predicted_vector, detection_date DESC
LIMIT 100;
```

**Output Format:**
```
| Item ID | Raw Headline                          | Date       | Predicted Vector | Confirmation | Drift | Event | Suppressed | Suppression Reason      |
|         |                                       |            |                  | Status       | Pts   | Pts   | (Y/N)      |                         |
|---------|---------------------------------------|------------|------------------|--------------|-------|-------|------------|-------------------------|
| SIG001  | Russia announces new sanctions...     | 2025-12-15 | Sanctions        | confirmed    | 8.5   | 12.3  | N          | -                       |
| SIG002  | Trade tariffs imposed on China...     | 2025-12-14 | Trade            | confirmed    | 6.2   | 9.1   | N          | -                       |
| SIG003  | Cyber attack targets government...    | 2025-12-13 | Cyber            | active       | 4.8   | 0.0   | N          | -                       |
| SIG004  | Protests erupt in capital city...     | 2025-12-12 | Unrest           | confirmed    | 7.3   | 10.5  | N          | -                       |
| SIG005  | Currency controls announced...        | 2025-12-11 | Currency         | suppressed   | 5.1   | 0.0   | Y          | Netted with SIG006      |
| SIG006  | Central bank restricts forex...       | 2025-12-10 | Governance       | confirmed    | 9.2   | 14.7  | N          | -                       |
...
```

**Analysis Requirements:**

1. **Vector Distribution Check:**
   ```
   Count items per vector
   Identify vectors with <10 samples
   Flag as "Vector Starvation Risk"
   ```

2. **Confirmation Rate Analysis:**
   ```
   Confirmation_Rate(vector) = Confirmed Items / Total Items per vector
   Flag vectors with <30% confirmation rate
   ```

3. **Suppression Bias Detection:**
   ```
   Suppression_Rate(vector) = Suppressed Items / Total Items per vector
   Flag vectors with >20% suppression rate
   ```

4. **Misrouting Identification:**
   - Manual review of headlines vs. predicted vector
   - Flag obvious misclassifications
   - Example: "Trade tariff announcement" routed to Governance instead of Trade

**Success Criteria:**
- All 7 vectors should have ≥10 samples
- Confirmation rates should be relatively balanced (within 20 percentage points)
- Suppression rates should be <15% for all vectors
- Misrouting rate should be <5% based on manual review

---

### SECTION 4: Rolling Vector Activity (12-Month Time Series)

**Objective:** Verify that vectors respond appropriately to real-world events in their domains.

**Time Window:** Rolling 12 months (monthly aggregation)

**Data Query:**
```sql
SELECT 
  DATE_TRUNC('month', detection_date) as month,
  predicted_vector as vector,
  SUM(drift_points) as total_drift_points,
  SUM(CASE WHEN status = 'confirmed' THEN event_delta ELSE 0 END) as total_event_points,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_items
FROM signals
WHERE detection_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', detection_date), predicted_vector
ORDER BY month DESC, vector;
```

**Output Format:**
```
| Vector                          | Month    | Total Drift | Total Event | Confirmed |
|                                 |          | Points      | Points      | Items     |
|---------------------------------|----------|-------------|-------------|-----------|
| Conflict & Security             | 2026-01  | 89.3        | 34.2        | 8         |
| Conflict & Security             | 2025-12  | 76.5        | 28.9        | 7         |
| Conflict & Security             | 2025-11  | 92.1        | 41.3        | 9         |
| Sanctions & Regulatory Pressure | 2026-01  | 67.2        | 23.4        | 6         |
| Sanctions & Regulatory Pressure | 2025-12  | 134.8       | 67.9        | 14        |
| Sanctions & Regulatory Pressure | 2025-11  | 45.3        | 18.7        | 5         |
...
```

**Validation Checks:**

1. **Trade Vector Responsiveness:**
   - Should show spikes during known tariff announcement periods
   - Example: US-China tariff escalations, EU trade policy changes

2. **Sanctions Vector Responsiveness:**
   - Should show spikes during major sanction waves
   - Example: Russia sanctions (Feb-Mar 2022), Iran sanctions updates

3. **Currency Vector Responsiveness:**
   - Should show spikes during FX stress periods
   - Example: Currency crises, capital control implementations

4. **Cyber Vector Responsiveness:**
   - Should show spikes during major cyber incident periods
   - Example: State-sponsored attacks, major breaches

5. **Unrest Vector Responsiveness:**
   - Should show spikes during protest waves
   - Example: Large-scale demonstrations, civil disturbances

**Flatline Detection:**
```
For each vector:
  If Total_Drift_Points < 10.0 for 3+ consecutive months:
    Flag as "Potential Structural Malfunction"
  If Confirmed_Items = 0 for 2+ consecutive months:
    Flag as "Confirmation Bottleneck"
```

**Success Criteria:**
- No vector should be flatlined (near-zero activity) for >2 consecutive months
- Vectors should show observable spikes correlating with known real-world events
- Activity patterns should be distinct across vectors (not identical time series)

---

### SECTION 5: Suppression & Scoring Dynamics

**Objective:** Determine whether certain vectors are disproportionately suppressed downstream.

**Time Window:** Last 90 days

**Data Query:**
```sql
WITH suppression_stats AS (
  SELECT 
    predicted_vector as vector,
    COUNT(*) as total_signals,
    COUNT(CASE WHEN capped = true THEN 1 END) as capped_count,
    COUNT(CASE WHEN netted = true THEN 1 END) as netted_count,
    COUNT(CASE WHEN decayed = true THEN 1 END) as decayed_count,
    AVG(CASE WHEN status != 'suppressed' THEN drift_points END) as mean_drift_before,
    AVG(CASE WHEN status = 'suppressed' THEN drift_points END) as mean_drift_after,
    AVG(CASE WHEN status = 'confirmed' AND status != 'suppressed' THEN event_delta END) as mean_event_before,
    AVG(CASE WHEN status = 'confirmed' AND status = 'suppressed' THEN event_delta END) as mean_event_after
  FROM signals
  WHERE detection_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY predicted_vector
)
SELECT 
  vector,
  (capped_count::float / total_signals * 100) as pct_capped,
  (netted_count::float / total_signals * 100) as pct_netted,
  (decayed_count::float / total_signals * 100) as pct_decayed,
  mean_drift_before,
  mean_drift_after,
  mean_event_before,
  mean_event_after
FROM suppression_stats
ORDER BY pct_capped + pct_netted + pct_decayed DESC;
```

**Suppression Mechanism Definitions:**

1. **Capped:** Signal or event exceeds maximum allowed contribution and is reduced
2. **Netted:** Signal is offset by opposing signal in same vector (prevents double-counting)
3. **Decayed:** Event has aged beyond active window and contribution is reduced/eliminated

**Output Format:**
```
| Vector                          | % Capped | % Netted | % Decayed | Mean Drift | Mean Drift | Mean Event | Mean Event |
|                                 |          |          |           | Before     | After      | Before     | After      |
|                                 |          |          |           | Suppress.  | Suppress.  | Suppress.  | Suppress.  |
|---------------------------------|----------|----------|-----------|------------|------------|------------|------------|
| Conflict & Security             | 8.3%     | 12.1%    | 45.2%     | 6.8        | 3.2        | 11.5       | 5.8        |
| Sanctions & Regulatory Pressure | 6.7%     | 9.8%     | 42.1%     | 5.9        | 2.9        | 10.2       | 5.1        |
| Trade & Logistics               | 5.2%     | 8.4%     | 39.8%     | 5.3        | 2.6        | 9.1        | 4.5        |
| Governance & Rule of Law        | 9.1%     | 14.3%    | 48.7%     | 7.2        | 3.5        | 12.8       | 6.4        |
| Cyber & Data                    | 4.8%     | 7.1%     | 36.2%     | 4.7        | 2.3        | 7.8        | 3.9        |
| Civil Unrest & Domestic Stab.   | 7.5%     | 11.2%    | 44.3%     | 6.5        | 3.1        | 10.9       | 5.4        |
| Currency & Capital Controls     | 6.1%     | 9.5%     | 40.5%     | 5.6        | 2.8        | 9.5        | 4.7        |
```

**Disproportionate Suppression Detection:**
```
For each vector:
  Total_Suppression_Rate = % Capped + % Netted
  
  If Total_Suppression_Rate > (Average_Suppression_Rate × 1.5):
    Flag as "Disproportionately Suppressed"
  
  If Mean_Drift_After / Mean_Drift_Before < 0.4:
    Flag as "Excessive Drift Reduction"
```

**Success Criteria:**
- Total suppression rates should be balanced across vectors (within 10 percentage points)
- Mean values after suppression should retain >40% of original magnitude
- Decay rates should be similar across vectors (within 15 percentage points)

---

### SECTION 6: Baseline Factor Structural Matrix

**Objective:** Validate that all 7 vectors are populated for all countries with correct weight application and no silent defaulting.

**Sample Requirements:**
- **Sample Size:** 20 randomly sampled countries
- **Coverage:** All 195 UN-recognized countries must have complete baseline data

**Data Query:**
```sql
WITH country_sample AS (
  SELECT country_id
  FROM countries
  WHERE is_test_country = false
  ORDER BY RANDOM()
  LIMIT 20
)
SELECT 
  c.country_id,
  c.country_name,
  bf.vector,
  bf.factor_value,
  bf.source,
  bf.timestamp,
  bf.fallback_type,
  bf.weight,
  bf.weighted_contribution
FROM country_sample cs
JOIN countries c ON cs.country_id = c.country_id
JOIN baseline_factors bf ON c.country_id = bf.country_id
ORDER BY c.country_name, bf.vector;
```

**Output Format:**
```
| Country | Vector                          | Baseline | Source           | Timestamp  | Fallback  | Weight | Weighted |
|         |                                 | Factor   |                  |            | Type      |        | Contrib. |
|---------|----------------------------------|----------|------------------|------------|-----------|--------|----------|
| ARG     | Conflict & Security             | 4.2      | IISS Military    | 2025-12-01 | direct    | 1.0    | 4.2      |
| ARG     | Sanctions & Regulatory Pressure | 2.8      | OFAC Registry    | 2025-11-15 | direct    | 1.0    | 2.8      |
| ARG     | Trade & Logistics               | 3.5      | WTO Trade Index  | 2025-12-10 | direct    | 1.0    | 3.5      |
| ARG     | Governance & Rule of Law        | 5.1      | V-Dem Index      | 2025-10-01 | direct    | 1.0    | 5.1      |
| ARG     | Cyber & Data                    | 3.0      | Regional Average | 2025-12-01 | regional  | 0.7    | 2.1      |
| ARG     | Civil Unrest & Domestic Stab.   | 4.8      | ACLED Data       | 2025-12-15 | direct    | 1.0    | 4.8      |
| ARG     | Currency & Capital Controls     | 3.7      | IMF AREAER       | 2025-11-01 | direct    | 1.0    | 3.7      |
...
```

**Validation Checks:**

1. **Completeness Check:**
   ```
   For each country:
     If COUNT(DISTINCT vector) != 7:
       Flag as "Incomplete Baseline Coverage"
   ```

2. **Fallback Analysis:**
   ```
   For each vector across all countries:
     Fallback_Rate = COUNT(fallback_type != 'direct') / COUNT(*)
     
     If Fallback_Rate > 0.30:
       Flag as "High Fallback Dependency"
   ```

3. **Freshness Check:**
   ```
   For each baseline factor:
     Age_Days = CURRENT_DATE - timestamp
     
     If Age_Days > 365:
       Flag as "Stale Baseline Data"
   ```

4. **Weight Application Verification:**
   ```
   For each baseline factor:
     Expected_Contribution = factor_value × weight
     
     If ABS(Expected_Contribution - weighted_contribution) > 0.01:
       Flag as "Weight Calculation Error"
   ```

**Success Criteria:**
- All sampled countries must have exactly 7 baseline factors (one per vector)
- Fallback rate should be <20% for each vector
- No baseline data should be >12 months old
- Weighted contributions must match factor_value × weight

---

### SECTION 7: Source-to-Vector Ingestion & Concentration

**Objective:** Detect feed imbalances or over-reliance on specific data sources.

**Time Window:** Last 90 days

**Data Query:**
```sql
WITH source_counts AS (
  SELECT 
    predicted_vector as vector,
    source,
    COUNT(*) as detection_count
  FROM signals
  WHERE detection_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY predicted_vector, source
),
vector_totals AS (
  SELECT 
    predicted_vector as vector,
    COUNT(*) as total_detections
  FROM signals
  WHERE detection_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY predicted_vector
),
ranked_sources AS (
  SELECT 
    sc.vector,
    sc.source,
    sc.detection_count,
    vt.total_detections,
    (sc.detection_count::float / vt.total_detections * 100) as pct_of_vector,
    ROW_NUMBER() OVER (PARTITION BY sc.vector ORDER BY sc.detection_count DESC) as source_rank
  FROM source_counts sc
  JOIN vector_totals vt ON sc.vector = vt.vector
)
SELECT 
  vector,
  total_detections,
  MAX(CASE WHEN source_rank = 1 THEN source END) as top_source_1,
  MAX(CASE WHEN source_rank = 1 THEN detection_count END) as top_1_count,
  MAX(CASE WHEN source_rank = 2 THEN source END) as top_source_2,
  MAX(CASE WHEN source_rank = 2 THEN detection_count END) as top_2_count,
  MAX(CASE WHEN source_rank = 3 THEN source END) as top_source_3,
  MAX(CASE WHEN source_rank = 3 THEN detection_count END) as top_3_count,
  MAX(CASE WHEN source_rank = 4 THEN source END) as top_source_4,
  MAX(CASE WHEN source_rank = 4 THEN detection_count END) as top_4_count,
  MAX(CASE WHEN source_rank = 5 THEN source END) as top_source_5,
  MAX(CASE WHEN source_rank = 5 THEN detection_count END) as top_5_count,
  MAX(CASE WHEN source_rank = 1 THEN pct_of_vector END) as pct_from_top_1,
  SUM(CASE WHEN source_rank <= 3 THEN pct_of_vector ELSE 0 END) as pct_from_top_3
FROM ranked_sources
GROUP BY vector, total_detections
ORDER BY total_detections DESC;
```

**HHI (Herfindahl-Hirschman Index) Calculation:**
```
HHI(vector) = Σ (market_share_i)² × 10,000

Where market_share_i = detection_count_i / total_detections for source i

Interpretation:
- HHI < 1,500: Competitive (low concentration)
- HHI 1,500-2,500: Moderate concentration
- HHI > 2,500: High concentration (potential over-reliance)
```

**Output Format:**
```
| Vector                          | Total    | Top 5 Sources (count)                                      | % from | % from | HHI    |
|                                 | Detect.  |                                                            | Top 1  | Top 3  | Conc.  |
|---------------------------------|----------|-------------------------------------------------------------|--------|--------|--------|
| Conflict & Security             | 156      | Reuters(45), AFP(32), BBC(28), AP(21), Bloomberg(18)       | 28.8%  | 67.3%  | 2,234  |
| Sanctions & Regulatory Pressure | 134      | OFAC Feed(67), EU Sanctions(38), Reuters(15), FT(9), WSJ(5)| 50.0%  | 89.6%  | 3,456  |
| Trade & Logistics               | 98       | WTO Alerts(28), Reuters(24), Bloomberg(19), FT(15), CNBC(12)| 28.6%  | 72.4%  | 2,145  |
| Governance & Rule of Law        | 203      | V-Dem Updates(56), Freedom House(48), Reuters(34), BBC(29), AP(23)| 27.6%  | 68.0%  | 2,089  |
| Cyber & Data                    | 67       | CISA Alerts(38), CrowdStrike(15), Mandiant(8), Reuters(4), FireEye(2)| 56.7%  | 91.0%  | 4,123  |
| Civil Unrest & Domestic Stab.   | 112      | ACLED(42), Reuters(28), BBC(19), AFP(13), AP(10)           | 37.5%  | 79.5%  | 2,789  |
| Currency & Capital Controls     | 89       | IMF Notices(34), Central Bank Feeds(26), Bloomberg(15), Reuters(9), FT(5)| 38.2%  | 84.3%  | 2,956  |
```

**Over-Reliance Detection:**
```
For each vector:
  If % from Top 1 > 50%:
    Flag as "Single Source Over-Reliance"
  
  If % from Top 3 > 85%:
    Flag as "Limited Source Diversity"
  
  If HHI > 2,500:
    Flag as "High Source Concentration Risk"
```

**Success Criteria:**
- No vector should have >50% of detections from a single source
- Top 3 sources should account for <80% of detections
- HHI should be <2,500 for all vectors (moderate concentration or lower)

---

### SECTION 8: Expectation Weighting Integrity (Probability & Severity Scaling)

**Objective:** Validate that CSI is truly expectation-weighted, not uniform.

**Sample Requirements:**
- **Sample Size:** 50 confirmed events from last 90 days
- **Selection Method:** Random sampling across all vectors

**Data Query:**
```sql
SELECT 
  event_id,
  vector,
  probability_assigned,
  severity_score,
  relevance_weight,
  raw_delta,
  applied_delta,
  days_active
FROM events
WHERE confirmation_date >= CURRENT_DATE - INTERVAL '90 days'
  AND status = 'confirmed'
ORDER BY RANDOM()
LIMIT 50;
```

**Expectation Weighting Formulas:**

1. **Applied Delta Calculation:**
   ```
   Applied_Delta = Raw_Delta × Probability × Relevance_Weight × Severity_Multiplier
   
   Where:
   - Raw_Delta: Base impact score (0-100)
   - Probability: Likelihood of event occurring/materializing (0.0-1.0)
   - Relevance_Weight: Geographic/sectoral relevance (0.0-1.0)
   - Severity_Multiplier: f(severity_score), typically severity_score / 10
   ```

2. **Probability Modification:**
   ```
   If Probability = 1.0: Event is certain (confirmed)
   If Probability = 0.7: Event is likely but not confirmed
   If Probability = 0.3: Event is possible but uncertain
   
   Applied_Delta should scale linearly with Probability
   ```

3. **Severity Modification:**
   ```
   Severity_Score ranges from 0.0 (minimal) to 10.0 (catastrophic)
   
   Severity_Multiplier = Severity_Score / 10
   
   Applied_Delta should scale with Severity_Score
   ```

**Output Format:**
```
| Event ID | Vector      | Probability | Severity | Relevance | Raw   | Applied | Days   |
|          |             | Assigned    | Score    | Weight    | Delta | Delta   | Active |
|----------|-------------|-------------|----------|-----------|-------|---------|--------|
| EVT001   | Sanctions   | 1.0         | 8.5      | 0.95      | 45.0  | 36.3    | 14     |
| EVT002   | Trade       | 0.8         | 6.2      | 0.88      | 38.0  | 16.6    | 21     |
| EVT003   | Conflict    | 1.0         | 9.1      | 1.0       | 52.0  | 47.3    | 7      |
| EVT004   | Cyber       | 0.6         | 5.8      | 0.75      | 28.0  | 7.3     | 18     |
| EVT005   | Governance  | 1.0         | 7.3      | 0.92      | 41.0  | 27.5    | 12     |
| EVT006   | Unrest      | 0.9         | 6.9      | 0.85      | 35.0  | 18.5    | 9      |
| EVT007   | Currency    | 1.0         | 8.2      | 0.98      | 48.0  | 38.6    | 5      |
...
```

**Validation Checks:**

1. **Probability Variance Check:**
   ```
   Probability_StdDev = STDDEV(probability_assigned)
   
   If Probability_StdDev < 0.15:
     Flag as "Low Probability Variance - Possible Uniform Weighting"
   ```

2. **Severity Variance Check:**
   ```
   Severity_StdDev = STDDEV(severity_score)
   
   If Severity_StdDev < 1.5:
     Flag as "Low Severity Variance - Possible Uniform Weighting"
   ```

3. **Applied Delta Correlation:**
   ```
   Correlation(Applied_Delta, Probability × Severity_Score)
   
   Expected: r > 0.85 (strong positive correlation)
   
   If r < 0.70:
     Flag as "Weak Expectation Weighting Correlation"
   ```

4. **Formula Verification:**
   ```
   For each event:
     Expected_Applied = Raw_Delta × Probability × Relevance_Weight × (Severity_Score / 10)
     Actual_Applied = applied_delta
     
     Deviation = ABS(Expected_Applied - Actual_Applied) / Expected_Applied
     
     If Deviation > 0.10:
       Flag as "Formula Application Error"
   ```

**Success Criteria:**
- Probability values should vary meaningfully (StdDev > 0.15)
- Severity scores should vary meaningfully (StdDev > 1.5)
- Applied deltas should correlate strongly with probability × severity (r > 0.85)
- Formula application should be consistent (<5% deviation rate)

---

### SECTION 9: Near-Term Horizon & Decay Behavior

**Objective:** Confirm events decay appropriately without permanent CSI inflation and that the rolling near-term horizon constraint functions.

**Sample Requirements:**
- **Sample Size:** 20 highest-impact events in last 6 months
- **Selection Criteria:** Events with peak_delta in top 20

**Data Query:**
```sql
SELECT 
  event_id,
  vector,
  confirmation_date,
  peak_delta,
  days_to_peak,
  decay_half_life,
  days_until_zero,
  residual_after_30d,
  residual_after_60d,
  current_contribution
FROM events
WHERE confirmation_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY peak_delta DESC
LIMIT 20;
```

**Decay Formula:**
```
Event_Contribution(t) = Peak_Delta × exp(-ln(2) × (t - t_peak) / decay_half_life)

Where:
- t: Current time (days since confirmation)
- t_peak: Time when event reached peak impact
- decay_half_life: Days for contribution to reduce by 50%

Residual_After_Nd = Peak_Delta × exp(-ln(2) × N / decay_half_life)
```

**Output Format:**
```
| Event ID | Vector      | Peak   | Days to | Decay      | Days Until | Residual | Residual | Current  |
|          |             | Delta  | Peak    | Half-Life  | Zero       | After    | After    | Contrib. |
|          |             |        |         | (days)     |            | 30d      | 60d      |          |
|----------|-------------|--------|---------|------------|------------|----------|----------|----------|
| EVT123   | Conflict    | 47.3   | 2       | 21         | 147        | 32.1     | 21.8     | 18.5     |
| EVT124   | Sanctions   | 42.8   | 1       | 28         | 196        | 31.5     | 23.2     | 19.8     |
| EVT125   | Governance  | 39.5   | 3       | 18         | 126        | 22.8     | 13.2     | 8.9      |
| EVT126   | Trade       | 36.7   | 2       | 24         | 168        | 26.4     | 19.0     | 15.2     |
| EVT127   | Unrest      | 34.2   | 1       | 15         | 105        | 18.9     | 10.4     | 6.1      |
| EVT128   | Cyber       | 31.8   | 4       | 12         | 84         | 13.2     | 5.5      | 2.8      |
| EVT129   | Currency    | 29.5   | 2       | 26         | 182        | 21.8     | 16.1     | 12.7     |
...
```

**Validation Checks:**

1. **Decay Half-Life Consistency:**
   ```
   For each vector:
     Avg_Half_Life = MEAN(decay_half_life)
     StdDev_Half_Life = STDDEV(decay_half_life)
     
     If StdDev_Half_Life / Avg_Half_Life > 0.5:
       Flag as "Inconsistent Decay Rates"
   ```

2. **Residual Calculation Verification:**
   ```
   For each event:
     Expected_Residual_30d = Peak_Delta × exp(-ln(2) × 30 / decay_half_life)
     Actual_Residual_30d = residual_after_30d
     
     Deviation = ABS(Expected_Residual_30d - Actual_Residual_30d) / Expected_Residual_30d
     
     If Deviation > 0.10:
       Flag as "Decay Calculation Error"
   ```

3. **Zero Convergence Check:**
   ```
   For each event:
     Age_Days = CURRENT_DATE - confirmation_date
     
     If Age_Days > days_until_zero AND current_contribution > 0.01:
       Flag as "Event Not Decaying to Zero"
   ```

4. **Permanent Inflation Check:**
   ```
   For all countries:
     CSI_Baseline_Drift = MEAN(csi_total - baseline_total) over last 12 months
     
     If CSI_Baseline_Drift shows positive trend (slope > 0.1 per month):
       Flag as "Potential Permanent CSI Inflation"
   ```

**Success Criteria:**
- Decay half-life should be consistent within each vector (CV < 0.5)
- Residual calculations should match expected decay formula (<10% deviation)
- Events should converge to zero contribution within specified timeframe
- No evidence of permanent CSI inflation (baseline drift should be stable)

---

## Benchmark Historical Events for Validation

### Event Selection Criteria

To validate vector responsiveness in Section 4, the following benchmark events should be used:

**Selection Requirements:**
- 3-5 major events per vector (21-35 total)
- Last 24 months (Feb 2024 - Feb 2026)
- Publicly documented with clear dates
- Significant geopolitical impact
- Clear expected CSI vector assignment
- Varying severity levels: 40% major, 40% moderate, 20% minor
- Geographic diversity

### Benchmark Event Set

#### 1. Conflict & Security (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| Gaza Escalation 2024 | Oct 2024 | ISR/PSE | Major | Major military escalation in Gaza Strip |
| Armenia-Azerbaijan Border Clash | Sep 2024 | ARM/AZE | Moderate | Border skirmishes in Nagorno-Karabakh region |
| Sudan Civil War Intensification | Apr 2024 | SDN | Major | RSF-SAF conflict escalation in Khartoum |
| Myanmar Border Offensive | Mar 2024 | MMR | Moderate | Ethnic armed groups offensive in Shan State |
| South China Sea Incident | Jun 2024 | CHN/PHL | Moderate | Naval confrontation near Second Thomas Shoal |

#### 2. Sanctions & Regulatory Pressure (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| Russia Oil Price Cap Expansion | Dec 2024 | RUS | Major | G7 expands oil price cap to $50/barrel |
| Iran Sanctions Escalation | Aug 2024 | IRN | Major | US secondary sanctions on Iranian oil exports |
| Venezuela Sanctions Relief | Feb 2024 | VEN | Moderate | Partial US sanctions relief for oil sector |
| North Korea Crypto Sanctions | May 2024 | PRK | Moderate | UN sanctions on DPRK crypto operations |
| Belarus Sectoral Sanctions | Nov 2024 | BLR | Minor | EU sanctions on Belarusian potash exports |

#### 3. Trade & Logistics (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| US-China Chip Export Controls | Oct 2024 | CHN | Major | US expands semiconductor export restrictions |
| EU Carbon Border Adjustment | Oct 2024 | Multiple | Major | CBAM implementation phase begins |
| India-Canada Trade Suspension | Sep 2024 | CAN/IND | Moderate | Trade negotiations suspended over diplomatic row |
| Red Sea Shipping Disruption | Jan 2024 | YEM | Major | Houthi attacks disrupt Suez Canal traffic |
| Argentina Trade Liberalization | Dec 2024 | ARG | Minor | Removal of import restrictions under Milei |

#### 4. Governance & Rule of Law (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| Poland Judicial Reforms | Mar 2024 | POL | Moderate | Reversal of previous judicial independence changes |
| El Salvador Constitutional Crisis | Feb 2024 | SLV | Major | Constitutional court dissolved by legislature |
| Pakistan Political Turmoil | Feb 2024 | PAK | Major | Post-election political crisis and protests |
| Tunisia Democratic Backsliding | Jul 2024 | TUN | Moderate | Further consolidation of presidential power |
| Guatemala Transition Crisis | Jan 2024 | GTM | Minor | Delayed presidential transition and legal challenges |

#### 5. Cyber & Data (4 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| Microsoft Exchange Breach | Mar 2024 | USA | Major | State-sponsored breach affecting government agencies |
| Ukraine Power Grid Attack | Jan 2024 | UKR | Major | Russian cyberattack on energy infrastructure |
| India Data Localization Enforcement | Jun 2024 | IND | Moderate | Strict enforcement of data localization rules |
| Australia Port Cyber Incident | Nov 2024 | AUS | Moderate | Ransomware attack disrupts major ports |

#### 6. Civil Unrest & Domestic Stability (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| France Pension Protests | Mar 2024 | FRA | Moderate | Nationwide strikes and demonstrations |
| Kenya Finance Bill Protests | Jun 2024 | KEN | Major | Violent protests against tax increases |
| Bangladesh Political Unrest | Jul 2024 | BGD | Major | Student protests and government crackdown |
| Peru Mining Protests | Feb 2024 | PER | Moderate | Regional protests against mining operations |
| Serbia Election Protests | Dec 2024 | SRB | Minor | Post-election demonstrations in Belgrade |

#### 7. Currency & Capital Controls (5 events)

| Event | Date | Country | Severity | Description |
|-------|------|---------|----------|-------------|
| Argentina Currency Devaluation | Dec 2024 | ARG | Major | 50% peso devaluation and capital controls |
| Egypt FX Crisis | Mar 2024 | EGY | Major | Pound devaluation and IMF program |
| Nigeria FX Unification | Jun 2024 | NGA | Moderate | Central bank unifies multiple exchange rates |
| Turkey Capital Flow Restrictions | Aug 2024 | TUR | Moderate | New restrictions on foreign currency deposits |
| Lebanon Banking Crisis | May 2024 | LBN | Minor | Further tightening of withdrawal limits |

### Validation Methodology

For each benchmark event:

1. **Detection Check:**
   ```
   Query signals table for detection_date within ±7 days of event date
   Filter by country_id matching event country
   Expected: At least 1 signal detected
   ```

2. **Routing Verification:**
   ```
   Check predicted_vector matches expected vector
   Expected: ≥80% of related signals routed to correct vector
   ```

3. **Movement Response:**
   ```
   Calculate Total_Movement_Points for vector in event month
   Compare to baseline (3-month average prior to event)
   Expected: Increase of ≥50% for major events, ≥25% for moderate events
   ```

4. **Temporal Correlation:**
   ```
   Plot vector activity time series
   Visual inspection: Spike should align with event date (±14 days)
   ```

---

## Success Criteria

### Quantitative Thresholds

#### Section 1: Absolute Movement Ledger
- ✅ Each vector shows Total Movement Points > 50.0 over 90 days
- ✅ Each vector has Detected Items > 50 over 90 days
- ✅ No single vector accounts for >40% of total movement points

#### Section 2: Movement Denominator Reconciliation
- ✅ All percentage calculations sum to 100% (±0.1% rounding)
- ✅ Dominance values are mathematically consistent with share calculations
- ✅ No vector shows Share of Total >50%

#### Section 3: Real-World Routing & Confirmation Sample
- ✅ All 7 vectors have ≥10 samples in 100-item set
- ✅ Confirmation rates balanced within 20 percentage points
- ✅ Suppression rates <15% for all vectors
- ✅ Misrouting rate <5% based on manual review

#### Section 4: Rolling Vector Activity
- ✅ No vector flatlined (near-zero activity) for >2 consecutive months
- ✅ Vectors show observable spikes correlating with benchmark events
- ✅ Activity patterns distinct across vectors (not identical time series)

#### Section 5: Suppression & Scoring Dynamics
- ✅ Total suppression rates balanced across vectors (within 10 percentage points)
- ✅ Mean values after suppression retain >40% of original magnitude
- ✅ Decay rates similar across vectors (within 15 percentage points)

#### Section 6: Baseline Factor Structural Matrix
- ✅ All sampled countries have exactly 7 baseline factors
- ✅ Fallback rate <20% for each vector
- ✅ No baseline data >12 months old
- ✅ Weighted contributions match factor_value × weight

#### Section 7: Source-to-Vector Ingestion & Concentration
- ✅ No vector has >50% detections from single source
- ✅ Top 3 sources account for <80% of detections
- ✅ HHI <2,500 for all vectors

#### Section 8: Expectation Weighting Integrity
- ✅ Probability StdDev > 0.15
- ✅ Severity StdDev > 1.5
- ✅ Applied delta correlation with probability × severity: r > 0.85
- ✅ Formula application deviation <10% for >95% of events

#### Section 9: Near-Term Horizon & Decay Behavior
- ✅ Decay half-life CV < 0.5 within each vector
- ✅ Residual calculations match expected formula (<10% deviation)
- ✅ Events converge to zero within specified timeframe
- ✅ No permanent CSI inflation (baseline drift stable)

### Qualitative Indicators

#### Structural Integrity
- All 7 vectors demonstrate independent, meaningful activity
- Routing decisions are consistent with signal content
- Suppression mechanisms apply uniformly across vectors

#### Expectation Weighting
- Probability and severity scaling is functioning as designed
- High-probability, high-severity events produce larger deltas
- Low-probability events are appropriately discounted

#### Temporal Behavior
- Events decay smoothly without permanent CSI inflation
- Near-term horizon constraint prevents indefinite accumulation
- Vector activity responds to real-world developments

### Overall Assessment Framework

**If all quantitative thresholds are met:**
> The CSI system is structurally behaving as a real-time, expectation-weighted, 7-vector geopolitical stress model.

**If 5-6 of 9 sections meet thresholds:**
> The CSI system is partially functional but requires targeted fixes in specific areas.

**If <5 sections meet thresholds:**
> The CSI system has fundamental structural issues requiring comprehensive review.

---

## Implementation Roadmap

### Phase 1: Data Infrastructure (Weeks 1-2)

**Objective:** Establish data access and extraction layer

**Tasks:**
1. Validate database schema matches specification requirements
2. Create SQL query library for all 9 sections
3. Implement data extraction functions with error handling
4. Set up data validation checks (completeness, freshness)

**Deliverables:**
- SQL query library (9 section-specific queries)
- Data extraction service with logging
- Data quality validation report

### Phase 2: Analysis Engine (Weeks 3-4)

**Objective:** Build calculation and analysis logic

**Tasks:**
1. Implement calculation functions for all metrics
2. Build statistical analysis functions (correlation, StdDev, etc.)
3. Create anomaly detection logic for each section
4. Develop benchmark event matching algorithms

**Deliverables:**
- Analysis service with 9 section modules
- Statistical utility library
- Anomaly detection rule engine

### Phase 3: Report Generation (Weeks 5-6)

**Objective:** Create report output and visualization

**Tasks:**
1. Design report template (Markdown + HTML)
2. Implement table and chart generation
3. Build narrative generation for findings
4. Create interactive dashboard components

**Deliverables:**
- Report generation service
- Markdown and HTML templates
- Interactive dashboard (React components)

### Phase 4: Integration & Testing (Weeks 7-8)

**Objective:** Integrate with existing system and validate

**Tasks:**
1. Connect to existing CSI database
2. Implement on-demand execution trigger
3. Add audit report to Developer Tools section
4. Conduct end-to-end testing with real data

**Deliverables:**
- Integrated audit service
- On-demand execution interface
- Developer Tools UI update
- Test report with findings

### Phase 5: Documentation & Deployment (Week 9)

**Objective:** Finalize documentation and deploy

**Tasks:**
1. Write user guide for interpreting audit results
2. Document maintenance procedures
3. Deploy to production environment
4. Conduct stakeholder training

**Deliverables:**
- User guide
- Maintenance documentation
- Production deployment
- Training materials

---

## Integration Points with Existing System

### Database Connections

**Primary Tables:**
- `signals` - Raw detected signals
- `events` - Confirmed events with deltas
- `baseline_factors` - Structural baseline components
- `csi_traces` - Historical CSI calculations
- `countries` - Country metadata

**Access Pattern:**
- Read-only access to production database
- No modifications to existing data
- Separate audit results table for caching

### Service Dependencies

**Existing Services:**
- `CSIVerificationService` - For baseline data access
- `GlobalAuditService` - For country metadata
- `RealTimeDataService` - For source information

**Integration Approach:**
- Import existing services as dependencies
- Reuse data models and type definitions
- Avoid duplicating data access logic

### UI Integration

**Location:** Developer Tools section on home page

**UI Components:**
```typescript
// New button in Developer Tools
<Button onClick={runVectorMovementAudit}>
  Run Vector Movement Forensic Audit
</Button>

// Results displayed in modal or new page
<VectorMovementAuditDashboard 
  auditResults={results}
  onExport={exportReport}
/>
```

**Navigation:**
```
Home Page
  └── Developer Tools
      ├── CSI Verification Dashboard (existing)
      ├── Global Audit Dashboard (existing)
      ├── Phase 2 Addendum Dashboard (existing)
      ├── Phase 2.1 Addendum Dashboard (existing)
      ├── ⭐ Vector Movement Forensic Audit (NEW)
      └── Ground-Truth Recall Audit (NEW)
```

### API Endpoints

**New Endpoints:**
```typescript
// Trigger audit execution
POST /api/audits/vector-movement/run
Response: { audit_id: string, status: 'running' }

// Get audit status
GET /api/audits/vector-movement/{audit_id}/status
Response: { status: 'running' | 'completed' | 'failed', progress: number }

// Get audit results
GET /api/audits/vector-movement/{audit_id}/results
Response: { sections: [...], summary: {...}, generated_at: Date }

// Export audit report
GET /api/audits/vector-movement/{audit_id}/export?format=markdown|html|pdf
Response: File download
```

### Data Flow

```
User clicks "Run Audit"
  ↓
POST /api/audits/vector-movement/run
  ↓
Audit Service initializes
  ↓
For each section (1-9):
  - Extract data from database
  - Apply calculations
  - Detect anomalies
  - Generate section report
  ↓
Aggregate section reports
  ↓
Generate summary and recommendations
  ↓
Store results in audit_results table
  ↓
Return audit_id to UI
  ↓
UI polls for completion
  ↓
Display results in dashboard
```

---

## Appendix A: Data Structure Definitions

### Signal Status Taxonomy

```typescript
type SignalStatus = 
  | 'active'      // Detected, routed, contributing to drift
  | 'confirmed'   // Escalated to event, contributing to event delta
  | 'suppressed'  // Detected but prevented from contributing (netted/capped)
  | 'discarded'   // Filtered out before scoring
  | 'expired';    // Aged out of active window

interface SignalSuppressionReason {
  type: 'netted' | 'capped' | 'quality_filter' | 'duplicate' | 'other';
  details: string;
  related_signal_id?: string; // For netting
}
```

### CSI Risk Vector Enumeration

```typescript
enum CSIRiskVector {
  CONFLICT_SECURITY = 'conflict_security',
  SANCTIONS_REGULATORY = 'sanctions_regulatory',
  TRADE_LOGISTICS = 'trade_logistics',
  GOVERNANCE_RULE_OF_LAW = 'governance_rule_of_law',
  CYBER_DATA = 'cyber_data',
  CIVIL_UNREST = 'civil_unrest',
  CURRENCY_CAPITAL_CONTROLS = 'currency_capital_controls'
}

const CSIRiskVectorNames: Record<CSIRiskVector, string> = {
  [CSIRiskVector.CONFLICT_SECURITY]: 'Conflict & Security',
  [CSIRiskVector.SANCTIONS_REGULATORY]: 'Sanctions & Regulatory Pressure',
  [CSIRiskVector.TRADE_LOGISTICS]: 'Trade & Logistics',
  [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 'Governance & Rule of Law',
  [CSIRiskVector.CYBER_DATA]: 'Cyber & Data',
  [CSIRiskVector.CIVIL_UNREST]: 'Civil Unrest & Domestic Stability',
  [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: 'Currency & Capital Controls'
};
```

### Audit Result Schema

```typescript
interface VectorMovementAuditResult {
  audit_id: string;
  generated_at: Date;
  time_window: {
    primary_start: Date;
    primary_end: Date;
    secondary_start: Date;
    secondary_end: Date;
  };
  sections: {
    section_1: AbsoluteMovementLedger;
    section_2: MovementDenominatorReconciliation;
    section_3: RoutingConfirmationSample;
    section_4: RollingVectorActivity;
    section_5: SuppressionScoringDynamics;
    section_6: BaselineFactorMatrix;
    section_7: SourceVectorConcentration;
    section_8: ExpectationWeightingIntegrity;
    section_9: DecayBehavior;
  };
  summary: {
    sections_meeting_criteria: number;
    total_sections: number;
    overall_assessment: 'structural_integrity_confirmed' | 'partial_functionality' | 'fundamental_issues';
    key_findings: string[];
    recommendations: string[];
  };
}
```

---

## Appendix B: Calculation Reference

### Statistical Formulas

**Standard Deviation:**
```
σ = sqrt(Σ(x_i - μ)² / N)

Where:
- x_i: Individual values
- μ: Mean of values
- N: Number of values
```

**Coefficient of Variation:**
```
CV = σ / μ

Interpretation:
- CV < 0.3: Low variability
- CV 0.3-0.5: Moderate variability
- CV > 0.5: High variability
```

**Pearson Correlation:**
```
r = Σ((x_i - x̄)(y_i - ȳ)) / sqrt(Σ(x_i - x̄)² × Σ(y_i - ȳ)²)

Interpretation:
- r > 0.7: Strong positive correlation
- r 0.3-0.7: Moderate positive correlation
- r < 0.3: Weak correlation
```

**Herfindahl-Hirschman Index (HHI):**
```
HHI = Σ(s_i)² × 10,000

Where:
- s_i: Market share of source i (as decimal)

Interpretation:
- HHI < 1,500: Competitive market
- HHI 1,500-2,500: Moderate concentration
- HHI > 2,500: High concentration
```

### Decay Formulas

**Exponential Decay:**
```
C(t) = C_peak × exp(-λt)

Where:
- C(t): Contribution at time t
- C_peak: Peak contribution
- λ: Decay constant = ln(2) / half_life
- t: Time since peak
```

**Half-Life Calculation:**
```
half_life = ln(2) / λ

Or inversely:
λ = ln(2) / half_life
```

**Time to Zero (99% decay):**
```
t_zero = -ln(0.01) / λ ≈ 4.605 × half_life
```

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-24 | Emma (Product Manager) | Initial specification |

**Review Status:** Pending stakeholder review

**Approval Required From:**
- Technical Lead (CSI System)
- Data Engineering Lead
- Product Owner

**Next Steps:**
1. Stakeholder review and feedback (Week 1)
2. Technical feasibility assessment (Week 2)
3. Implementation planning (Week 3)
4. Development kickoff (Week 4)

---

**END OF DOCUMENT**