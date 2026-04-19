# Country Shock Index (CSI) Methodology
## Complete Technical Documentation - Version 4.0 (Factor-Scoped Architecture)

**Document Version:** 4.0 - Factor-Scoped Architecture with Binding Acceptance Criteria  
**Last Updated:** February 2026  
**Authors:** CO-GRI Research Team  
**Status:** Production Implementation

---

## Executive Summary

The Country Shock Index (CSI) measures the current level of geopolitical stress being priced in for a country, implied by both realized events and near-term escalation signals, weighted by probability, severity, and relevance, and constrained to a rolling near-term horizon.

### Core Properties

1. **Expectation-weighted**: CSI reflects probability-weighted expectations, not purely reactive measurements
2. **Near-term focused**: Constrained to rolling near-term horizon for actionable risk assessment
3. **Dynamic and directional**: Captures both escalation and de-escalation movements
4. **Auditable**: Explicit separation between baseline, escalation drift, and event deltas with full audit trail

### Key Updates in Version 4.0

1. **Seven CSI Risk Factors**: Replaced generic domains with geopolitical-specific risk factors
2. **Factor-Scoped Architecture**: All operations (drift, decay, netting) operate per factor
3. **Source Role Enforcement**: Detection sources generate signals only; confirmation sources validate only
4. **Binding Acceptance Criteria**: Implementation compliance requirements
5. **Enhanced Auditability**: Factor-level breakdown in all outputs

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Three-Component Architecture](#2-three-component-architecture)
3. [Component 1: Structural Baseline](#3-component-1-structural-baseline)
4. [Component 2: Escalation Drift Engine](#4-component-2-escalation-drift-engine)
5. [Component 3: Event Delta Engine](#5-component-3-event-delta-engine)
6. [Decay Scheduling System](#6-decay-scheduling-system)
7. [Netting Engine](#7-netting-engine)
8. [Data Sources and Quality](#8-data-sources-and-quality)
9. [Implementation Specifications](#9-implementation-specifications)
10. [Validation and Testing](#10-validation-and-testing)
11. [Implementation Acceptance Criteria](#11-implementation-acceptance-criteria)

---

## 1. Purpose and Scope

### 1.1 What CSI Measures

The Country Shock Index (CSI) measures the current level of geopolitical stress being priced in for a country, implied by both realized events and near-term escalation signals, weighted by probability, severity, and relevance, and constrained to a rolling near-term horizon.

**Core Properties:**

- **Expectation-weighted** (not purely reactive)
- **Near-term focused**
- **Dynamic and directional** (captures escalation and de-escalation)
- **Auditable**, with explicit separation between baseline, escalation drift, and event deltas

This definition governs how all downstream components behave.

### 1.2 What CSI Is NOT

- **Not a long-term forecast**: CSI reflects near-term conditions and expectations
- **Not a credit rating**: CSI focuses on geopolitical risk, not creditworthiness
- **Not a macroeconomic indicator**: CSI excludes GDP growth, inflation, debt levels
- **Not an environmental risk metric**: CSI excludes climate risk, natural disasters

### 1.3 CSI Score Interpretation

| Score Range | Risk Level | Description |
|-------------|------------|-------------|
| 0-25 | Low Risk | Stable geopolitical environment, minimal threats |
| 25-40 | Moderate Risk | Some institutional weaknesses or emerging tensions |
| 40-60 | High Risk | Significant instability or active geopolitical events |
| 60-100 | Very High Risk | Severe crisis conditions or major conflict |

---

## 2. Three-Component Architecture

### 2.1 Core Formula

The CSI score is calculated as the sum of three independent components:

```
CSI(country, t) = Structural_Baseline(country, t) 
                + Escalation_Drift_Netted(country, t) 
                + Event_Delta(country, t)
```

Where:
- **t** = timestamp (current time)
- **CSI** ∈ [0, 100] (bounded)

### 2.2 Component Weights and Ranges

| Component | Typical Range | Update Frequency | Description |
|-----------|---------------|------------------|-------------|
| Structural Baseline | 20-60 | Quarterly | Slow-moving institutional risk per factor |
| Escalation Drift | 0-20 | Real-time | Pre-event signal accumulation per factor |
| Event Delta | 0-20 | Real-time | Confirmed event impact per factor |

### 2.3 Continuous CSI Movement Between Baseline Updates

**Important:** CSI may change continuously between scheduled (e.g., quarterly) baseline updates via escalation drift and event deltas. While the Structural Baseline updates on a quarterly cadence, the Escalation Drift and Event Delta components update in real-time, allowing CSI to reflect current geopolitical conditions at any point in time. CSI is NOT a "quarterly-only" metric.

### 2.4 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CSI CALCULATION ENGINE                    │
│                  (Factor-Scoped Architecture)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SEVEN CSI RISK FACTORS                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│  │  │ Conflict &  │ │ Sanctions & │ │ Trade &     │    │  │
│  │  │ Security    │ │ Regulatory  │ │ Logistics   │    │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│  │  │ Governance  │ │ Cyber &     │ │ Public      │    │  │
│  │  │ & Rule of   │ │ Data        │ │ Unrest &    │    │  │
│  │  │ Law         │ │ Sovereignty │ │ Civil       │    │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │  │
│  │  ┌─────────────┐                                     │  │
│  │  │ Currency &  │                                     │  │
│  │  │ Capital     │                                     │  │
│  │  │ Controls    │                                     │  │
│  │  └─────────────┘                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   Structural     │  │   Escalation     │  │   Event   │ │
│  │    Baseline      │  │      Drift       │  │   Delta   │ │
│  │    Engine        │  │     Engine       │  │  Engine   │ │
│  │  (per factor)    │  │  (per factor)    │  │(per factor)│ │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘ │
│           │                     │                    │       │
│           │            ┌────────▼────────┐          │       │
│           │            │  Decay Scheduler │          │       │
│           │            │  (per factor)    │          │       │
│           │            └────────┬─────────┘          │       │
│           │                     │                    │       │
│           │            ┌────────▼────────┐          │       │
│           │            │ Netting Engine  │◄─────────┘       │
│           │            │ (per factor)    │                  │
│           │            └────────┬─────────┘                 │
│           │                     │                           │
│           └─────────────────────┴───────────────────────────┤
│                                 │                            │
│                         ┌───────▼────────┐                  │
│                         │  CSI Aggregator │                  │
│                         │  (sum factors)  │                  │
│                         └───────┬────────┘                  │
│                                 │                            │
│                         ┌───────▼────────┐                  │
│                         │  Final CSI     │                  │
│                         │  [0-100]       │                  │
│                         └────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Component 1: Structural Baseline

### 3.1 Purpose

The Structural Baseline captures **slow-moving institutional risk** based on authoritative sources. It updates quarterly and provides the foundation for the CSI score.

### 3.2 Seven CSI Risk Factors

The structural baseline is calculated **per risk factor**, not as a pooled composite. The seven CSI geopolitical risk factors are the **only primitives** used throughout the system:

| Factor | Description | Example Indicators |
|--------|-------------|-------------------|
| **Conflict & Security** | Military tensions, armed conflicts, terrorism | ACLED conflict data, terrorism indices |
| **Sanctions & Regulatory Pressure** | International sanctions, trade restrictions | OFAC lists, EU sanctions registry |
| **Trade & Logistics Disruption** | Supply chain risks, port closures, trade barriers | WTO disputes, shipping disruption data |
| **Governance & Rule of Law** | Government effectiveness, corruption, judicial independence | World Bank WGI, Transparency International |
| **Cyber & Data Sovereignty** | Cyber threats, data localization requirements | Cyber attack indices, data law changes |
| **Public Unrest & Civil Stability** | Protests, strikes, civil disorder | ACLED protest data, social stability indices |
| **Currency & Capital Controls** | FX restrictions, capital flow limitations | IMF AREAER, central bank announcements |

**Critical Constraint:** These seven factors must be the only primitives used throughout the system. The following are explicitly **excluded** from CSI:
- Macroeconomic indicators (GDP growth, inflation, debt levels)
- Environmental indicators (climate risk, natural disasters)

### 3.3 Calculation Formula

```
Structural_Baseline(country) = Σ(Factor_Baseline_i × Weight_i)
```

Where:
- **i** = CSI risk factor (1-7)
- Each factor may use **different baseline sources**
- Baseline sources and mappings are defined in Appendix B

### 3.4 Factor Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Conflict & Security | 20% | Military and security risk |
| Sanctions & Regulatory Pressure | 18% | International sanctions exposure |
| Trade & Logistics Disruption | 15% | Supply chain and trade risk |
| Governance & Rule of Law | 17% | Institutional quality |
| Cyber & Data Sovereignty | 10% | Digital and cyber risk |
| Public Unrest & Civil Stability | 12% | Social stability risk |
| Currency & Capital Controls | 8% | Financial flow restrictions |

### 3.5 Explicit Constraints

1. **Structural baseline updates on a scheduled cadence** (quarterly is acceptable)
2. **Structural baseline does NOT react to individual events**
3. **Baseline values are slow-moving anchors**, not escalation drivers
4. **Each factor uses factor-specific sources** as defined in Appendix B

### 3.6 Data Sources (Per Factor)

| Factor | Primary Sources | Update Frequency |
|--------|----------------|------------------|
| Conflict & Security | ACLED, Global Terrorism Index | Real-time / Annual |
| Sanctions & Regulatory Pressure | OFAC, EU Sanctions Registry | Real-time |
| Trade & Logistics Disruption | WTO, World Bank LPI | Quarterly |
| Governance & Rule of Law | World Bank WGI, TI CPI | Annual |
| Cyber & Data Sovereignty | Cyber indices, regulatory tracking | Quarterly |
| Public Unrest & Civil Stability | ACLED, Freedom House | Real-time / Annual |
| Currency & Capital Controls | IMF AREAER, central banks | Annual / Real-time |

### 3.7 Update Frequency

- **Scheduled Updates**: Quarterly (January, April, July, October)
- **Cache Duration**: 90 days
- **Stale Data Handling**: Use most recent available data, flag if >180 days old

### 3.8 Missing Data Treatment

```python
if indicator_data is None:
    if country in regional_average:
        indicator_value = regional_average[country.region]
    else:
        indicator_value = 50  # Neutral default
```

---

## 4. Component 2: Escalation Drift Engine

### 4.1 Purpose

The Escalation Drift Engine calculates **probability-weighted pre-event risk** from signals that may materialize into confirmed events. It integrates decay scheduling to handle signals that don't materialize.

### 4.2 Factor-Scoped Signal Assignment

**Critical Requirement:** Every signal must be assigned to **exactly one CSI risk factor** at ingestion.

Each signal must have:
- **risk_factor**: One of the seven CSI risk factors
- **base_probability**: Expectation-based probability (not frequency-based)
- **severity**: Impact severity if materialized
- **max_drift_cap**: Maximum drift contribution

### 4.3 Core Formula

```
Escalation_Drift(country, t) = Σ(Factor_Drift_i(t))
```

Where each factor's drift is calculated independently:

```
Factor_Drift_i(t) = Σ(Signal_Contribution_j(t)) for signals in factor i
```

**Hard Constraint:** Cross-factor drift accumulation is NOT permitted.

### 4.4 Signal Contribution Calculation

```
Signal_Contribution_j(t) = Severity_j 
                          × Probability_j 
                          × Persistence_Factor_j(t) 
                          × Recency_Factor_j(t) 
                          × Decay_Factor_j(t)
```

### 4.5 Factor Definitions

#### 4.5.1 Severity (Base Impact)

```
Severity ∈ [0, 1.0]
```

**Severity Levels:**
- **0.1-0.3**: Minor (e.g., diplomatic statement, minor protest)
- **0.3-0.6**: Moderate (e.g., trade investigation, sanctions warning)
- **0.6-0.9**: Major (e.g., military mobilization, capital control warning)
- **0.9-1.0**: Critical (e.g., conflict outbreak signal, regime collapse warning)

#### 4.5.2 Probability (Expectation-Based)

```
Probability ∈ [0, 1.0]
```

**Critical Requirement:** Probability must remain **expectation-based**, not frequency-based.

**Semantics Clarification:** Probability values are expectation-based, meaning they are assigned by analysts, classifiers, or models based on forward-looking assessment of likelihood. They are NOT inferred from historical event frequencies. This distinction ensures CSI captures emerging risks that may have no historical precedent.

**Probability Calculation:**
```
Probability = min(1.0, Corroboration_Count / 5 × Base_Probability)
```

**Probability Bands:**
- **0.1-0.3**: Low probability (single source, speculative)
- **0.3-0.6**: Moderate probability (2-3 sources, credible)
- **0.6-0.9**: High probability (4+ sources, imminent)
- **0.9-1.0**: Very high probability (official announcement, multiple confirmations)

#### 4.5.3 Persistence Factor (Time Active)

```
Persistence_Factor(t) = min(1.0, hours_since_detection / threshold_hours)
```

Where:
- **threshold_hours** = 72 hours (default)

#### 4.5.4 Recency Factor (Last Update)

```
Recency_Factor(t) = e^(-λ × days_since_last_update)
```

Where:
- **λ** = 0.05 (decay rate parameter)

#### 4.5.5 Decay Factor (Inactivity Decay)

```
if days_since_last_update < inactivity_window_days:
    Decay_Factor = 1.0
else:
    days_in_decay = days_since_last_update - inactivity_window_days
    Decay_Factor = e^(-λ_decay × days_in_decay)
```

### 4.6 Source Role Enforcement

**Critical Requirement:** Source roles must be strictly enforced:

| Source Role | Can Generate Signals | Can Confirm Events |
|-------------|---------------------|-------------------|
| Detection Source | ✓ Yes | ✗ No |
| Confirmation Source | ✗ No | ✓ Yes |

- **Detection sources** generate signals only
- **Confirmation sources** cannot generate drift
- **Confirmation** only validates or invalidates existing signals/events

Appendix B defines source roles and should be explicitly referenced.

### 4.7 Per-Signal Contribution Cap

```
Capped_Contribution_j = min(Signal_Contribution_j, max_drift_per_signal)
```

Where:
- **max_drift_per_signal** = 0.25 CSI points

### 4.8 Cumulative Drift Cap (Per Factor)

```
if Factor_Drift_i + cumulative_drift_30_days_i > max_cumulative_drift:
    Factor_Drift_i = max(0, max_cumulative_drift - cumulative_drift_30_days_i)
```

Where:
- **max_cumulative_drift** = 1.0 CSI points per 30 days per factor

### 4.9 Netting Integration

After calculating raw drift per factor, the **Netting Engine** is applied:

```
Factor_Drift_Netted_i = NettingEngine.applyNetting(country, factor_i, signal_contributions)
```

**Hard Constraint:** Netting operates within the same factor only.

---

## 5. Component 3: Event Delta Engine

### 5.1 Purpose

The Event Delta Engine calculates the impact of **confirmed geopolitical events** on the CSI score. It applies netting to prevent double-counting when signals materialize into events.

### 5.2 Factor Inheritance

**Critical Requirement:** Events inherit the risk-factor classification of the signals they confirm.

### 5.3 Core Formula

```
Event_Delta(country, t) = Σ(Factor_Event_Delta_i(t))
```

Where each factor's event delta is calculated independently:

```
Factor_Event_Delta_i(t) = Σ(Event_Impact_m(t) - Prior_Drift_Netted_m) for events in factor i
```

### 5.4 Netting Constraint

**Hard Constraint:** Event confirmation nets out prior drift **only within the same factor**.

```
Prior_Drift_Netted_m = Σ(Relevant_Signal_Contributions in same factor)
```

Cross-factor netting is NOT permitted. This preserves causal consistency and prevents drift leakage.

### 5.5 Event Impact Calculation

```
Event_Impact_m(t) = Base_Impact_m × Decay_Factor_m(t)
```

#### 5.5.1 Base Impact

```
Base_Impact ∈ [0, 20] CSI points
```

**Impact Levels:**
- **1-5 points**: Minor events (e.g., diplomatic protest, minor sanction)
- **5-10 points**: Moderate events (e.g., trade restrictions, capital controls)
- **10-15 points**: Major events (e.g., sanctions package, military action)
- **15-20 points**: Critical events (e.g., regime change, major conflict outbreak)

#### 5.5.2 Event Decay

Events decay over time based on their decay schedule:

**No Decay (Permanent Events):**
```
Decay_Factor = 1.0
```
Examples: Regime change, permanent sanctions

**Exponential Decay (Most Common):**
```
Decay_Factor = 0.5^(days_since_effective / half_life_days)
```
Where:
- **half_life_days** = 30 days (default)

### 5.6 Event Type Mapping (Per Factor)

| CSI Risk Factor | Event Types |
|-----------------|-------------|
| Conflict & Security | conflict_outbreak, military_action, terrorist_attack |
| Sanctions & Regulatory Pressure | sanctions_imposed, asset_freeze, export_ban |
| Trade & Logistics Disruption | tariff_imposed, port_closure, supply_chain_disruption |
| Governance & Rule of Law | regime_change, judicial_interference, constitutional_crisis |
| Cyber & Data Sovereignty | cyber_attack, data_breach, data_localization_mandate |
| Public Unrest & Civil Stability | mass_protest, strike, civil_unrest |
| Currency & Capital Controls | capital_controls, fx_restrictions, currency_crisis |

### 5.7 Event Lifecycle

```
┌─────────────┐
│   Signal    │  (Escalation Drift in Factor X)
│   Detected  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Signal    │  (Drift continues in Factor X)
│  Persists   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Event    │  (Transition to Event Delta in Factor X)
│  Confirmed  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Netting   │  (Remove prior drift in Factor X ONLY)
│   Applied   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Event    │  (Event Delta with decay in Factor X)
│   Decays    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Event     │  (Event Delta = 0)
│  Expires    │
└─────────────┘
```

---

## 6. Decay Scheduling System

### 6.1 Purpose

The Decay Scheduler manages the lifecycle of escalation signals that don't materialize into events. It implements a **two-phase decay model** with **factor-level tracking**.

### 6.2 Factor-Scoped Decay

**Critical Requirement:** Decay operates at the signal level and is factor-scoped.

- Each signal's decay is tracked independently
- Decay schedules are maintained per factor
- Decayed signals are excluded from active drift within their factor

### 6.3 Decay Schedule Structure

```typescript
interface DecaySchedule {
  signal_id: string;
  country: string;
  risk_factor: CSIRiskFactor;        // Factor assignment
  initial_drift: number;              // Initial contribution value
  decay_start_date: Date;             // When decay begins
  inactivity_window_days: number;     // 30 days default
  decay_rate: number;                 // 0.5 (half escalation rate)
  current_value: number;              // Current decayed value
  status: 'ACTIVE' | 'DECAYING' | 'EXPIRED';
  last_updated: Date;
  signal_last_updated: Date;
}
```

### 6.4 Decay Phases

#### Phase 1: Active (Inactivity Window)

```
if days_since_signal_update < inactivity_window_days:
    status = 'ACTIVE'
    current_value = initial_drift
    decay_factor = 1.0
```

**Duration**: 30 days (default)

#### Phase 2: Decaying

```
if days_since_signal_update >= inactivity_window_days:
    status = 'DECAYING'
    days_in_decay = days_since_signal_update - inactivity_window_days
    decay_factor = e^(-λ × days_in_decay × decay_rate)
    current_value = initial_drift × decay_factor
```

#### Phase 3: Expired

```
if current_value < initial_drift × expiration_threshold:
    status = 'EXPIRED'
    current_value = 0
    decay_factor = 0
```

Where:
- **expiration_threshold** = 0.01 (1% of initial value)

### 6.5 Decay Reset on Update

If a signal is updated, the decay schedule resets:

```
if signal.last_updated > schedule.signal_last_updated:
    schedule.status = 'ACTIVE'
    schedule.signal_last_updated = signal.last_updated
    schedule.decay_start_date = signal.last_updated + inactivity_window_days
    schedule.current_value = schedule.initial_drift
```

---

## 7. Netting Engine

### 7.1 Purpose

The Netting Engine prevents **double-counting** when multiple signals refer to the same underlying event or risk. It groups overlapping signals into clusters and applies netting strategies.

### 7.2 Factor-Scoped Netting

**Hard Constraint:** Signals may only be netted if they belong to the same country **AND** the same CSI risk factor.

### 7.3 Netting Process

```
┌─────────────────────────────────────────────────────────┐
│              NETTING ENGINE WORKFLOW                     │
│              (Factor-Scoped)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Filter Signals by Factor                            │
│     └─ Only signals in same CSI risk factor             │
│                                                          │
│  2. Identify Overlapping Signals                        │
│     ├─ Match by signal type within factor               │
│     ├─ Calculate similarity scores                      │
│     └─ Group by similarity threshold                    │
│                                                          │
│  3. Create Netting Clusters                             │
│     ├─ Assign signals to clusters (within factor)       │
│     ├─ Identify primary signal (highest contribution)   │
│     └─ Calculate cluster metadata                       │
│                                                          │
│  4. Apply Netting Strategy                              │
│     ├─ MAX: Use maximum contribution                    │
│     ├─ AVERAGE: Use average contribution                │
│     ├─ WEIGHTED: Weight by corroboration                │
│     └─ DIMINISHING: Diminishing returns formula         │
│                                                          │
│  5. Calculate Netted Drift (Per Factor)                 │
│     ├─ Sum netted cluster contributions                 │
│     ├─ Add standalone signal contributions              │
│     └─ Return factor-level netted drift                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 7.4 Similarity Calculation

Two signals are considered similar if they likely refer to the same underlying event:

```
Similarity_Score = Country_Match × 0.2 
                 + Factor_Match × 0.2 
                 + Temporal_Proximity × 0.3 
                 + Source_Overlap × 0.3
```

#### 7.4.1 Country Match

```
Country_Match = 1.0 if signal1.country == signal2.country else 0.0
```

**Required**: Signals must be for the same country.

#### 7.4.2 Factor Match

```
Factor_Match = 1.0 if signal1.risk_factor == signal2.risk_factor else 0.0
```

**Required**: Signals must be for the same CSI risk factor.

#### 7.4.3 Temporal Proximity

```
days_diff = |signal1.detected_date - signal2.detected_date| / (24 × 60 × 60 × 1000)
Temporal_Proximity = max(0, 1 - days_diff / 30)
```

#### 7.4.4 Source Overlap

```
intersection = signal1.sources ∩ signal2.sources
union = signal1.sources ∪ signal2.sources
Source_Overlap = |intersection| / |union|
```

### 7.5 Netting Rules (Per Factor)

```typescript
interface NettingRule {
  rule_id: string;
  risk_factor: CSIRiskFactor;         // Factor constraint
  signal_types: string[];              // Signal types to net
  event_type: string;                  // Target event type
  similarity_threshold: number;        // 0-1, minimum similarity
  netting_strategy: 'MAX' | 'AVERAGE' | 'WEIGHTED' | 'DIMINISHING';
}
```

### 7.6 Netting Strategies

#### 7.6.1 DIMINISHING Strategy (Most Common)

```
Netted_Contribution = contribution_1 × 1.0 
                    + contribution_2 × 0.5 
                    + contribution_3 × 0.25 
                    + ...
```

Where contributions are sorted in descending order.

#### 7.6.2 MAX Strategy

```
Netted_Contribution = max(contribution_1, contribution_2, ..., contribution_n)
```

#### 7.6.3 AVERAGE Strategy

```
Netted_Contribution = (contribution_1 + contribution_2 + ... + contribution_n) / n
```

#### 7.6.4 WEIGHTED Strategy

```
Netted_Contribution = Σ(contribution_i × corroboration_count_i) / Σ(corroboration_count_i)
```

---

## 8. Data Sources and Quality

### 8.1 Source Role Classification

**Critical Requirement:** Source roles must be explicitly enforced:

| Role | Purpose | Can Generate Signals | Can Confirm Events |
|------|---------|---------------------|-------------------|
| Baseline Source | Structural priors only | ✗ No | ✗ No |
| Detection Source | Escalation detection | ✓ Yes | ✗ No |
| Confirmation Source | State transition | ✗ No | ✓ Yes |

**Hard Constraint:** No source may serve all three roles.

### 8.2 Structural Baseline Sources (Per Factor)

| Factor | Sources | Notes |
|--------|---------|-------|
| Conflict & Security | ACLED, GTI | Must exclude economic indicators |
| Sanctions & Regulatory Pressure | OFAC, EU Registry | Official sources only |
| Trade & Logistics Disruption | WTO, LPI | Trade-specific metrics |
| Governance & Rule of Law | WGI, TI CPI | Institutional quality only |
| Cyber & Data Sovereignty | Cyber indices | Digital risk metrics |
| Public Unrest & Civil Stability | ACLED, Freedom House | Social stability only |
| Currency & Capital Controls | IMF AREAER | Financial restrictions only |

**Constraint:** Baseline sources must be mapped per risk factor and must exclude macroeconomic and environmental indicators.

### 8.3 Detection vs Confirmation Sources

| Source Type | Role | Examples |
|-------------|------|----------|
| News Agencies | Detection | Reuters, Bloomberg, AP |
| Social Media (verified) | Detection | Official government accounts |
| Expert Analysis | Detection | Think tanks, research institutions |
| Government Official | Confirmation | Official statements |
| International Organization | Confirmation | UN, WTO announcements |
| Major News Agency (3+) | Confirmation | Multi-source confirmation |

**Hard Constraints:**
- Detection sources may NOT confirm events
- Confirmation sources may NOT generate signals

### 8.4 Confidence Scoring

**Critical Constraint:** Confidence is an epistemic metadata attribute only and must **never** scale, cap, or otherwise alter CSI baseline, drift, or event delta calculations.

Confidence must reflect:
- Source reliability
- Authority level
- Corroboration quality

Confidence affects:
- Interpretation
- UI flags
- Audit transparency

Confidence does NOT affect:
- CSI level calculations
- Drift values
- Event delta values

---

## 9. Implementation Specifications

### 9.1 Signal Taxonomy Enforcement

**Required:** Every signal must include:

```typescript
interface Signal {
  signal_id: string;
  signal_type: string;
  risk_factor: CSIRiskFactor;         // One of seven factors
  severity: number;                    // Severity band
  base_probability: number;            // Expectation-based
  country: string;
  detected_date: Date;
  last_updated: Date;
  sources: string[];
  source_role: 'DETECTION';            // Detection sources only
}
```

### 9.2 Factor-Scoped Aggregation

**Required:** Drift, caps, decay, and netting operate per factor before aggregation:

```typescript
interface CSICalculation {
  country: string;
  timestamp: Date;
  
  // Per-factor breakdown
  factor_baselines: Record<CSIRiskFactor, number>;
  factor_drifts: Record<CSIRiskFactor, number>;
  factor_event_deltas: Record<CSIRiskFactor, number>;
  
  // Aggregated totals
  total_baseline: number;
  total_drift_netted: number;
  total_event_delta: number;
  final_csi: number;
}
```

### 9.3 Audit Trail Requirements

**Required:** CSI outputs must expose:

```typescript
interface CSIAuditTrail {
  calculation_id: string;
  country: string;
  timestamp: Date;
  
  // Factor-level breakdown
  baseline_by_factor: Record<CSIRiskFactor, number>;
  active_signals_by_factor: Record<CSIRiskFactor, Signal[]>;
  drift_contribution_by_signal: DriftContribution[];
  active_events_by_factor: Record<CSIRiskFactor, Event[]>;
  decay_state_by_signal: DecaySchedule[];
  
  // Netting details
  netting_clusters: NettingCluster[];
  
  // Final values
  final_csi: number;
  confidence_score: number;
}
```

Without this audit trail, CSI is not auditable.

### 9.4 API Response Format

```json
{
  "country": "China",
  "timestamp": "2026-02-07T12:00:00Z",
  "csi_score": 45.2,
  "components": {
    "structural_baseline": 38.5,
    "escalation_drift_netted": 3.5,
    "event_delta": 3.2
  },
  "factor_breakdown": {
    "CONFLICT_SECURITY": { "baseline": 8.2, "drift": 0.5, "event_delta": 1.0 },
    "SANCTIONS_REGULATORY": { "baseline": 7.5, "drift": 1.2, "event_delta": 0.8 },
    "TRADE_LOGISTICS": { "baseline": 6.8, "drift": 0.8, "event_delta": 0.5 },
    "GOVERNANCE_RULE_OF_LAW": { "baseline": 7.0, "drift": 0.3, "event_delta": 0.4 },
    "CYBER_DATA": { "baseline": 3.5, "drift": 0.2, "event_delta": 0.2 },
    "PUBLIC_UNREST": { "baseline": 3.5, "drift": 0.3, "event_delta": 0.2 },
    "CURRENCY_CAPITAL": { "baseline": 2.0, "drift": 0.2, "event_delta": 0.1 }
  },
  "metadata": {
    "active_signals": 8,
    "confirmed_events": 2,
    "confidence_score": 0.85,
    "last_updated": "2026-02-07T12:00:00Z"
  }
}
```

---

## 10. Validation and Testing

### 10.1 Unit Tests

**Coverage Target**: 90%+

**Test Categories:**

1. **Structural Baseline Engine**
   - Factor-specific baseline calculation
   - Weight application per factor
   - Exclusion of macro/environmental indicators

2. **Escalation Drift Engine**
   - Factor-scoped signal assignment
   - Expectation-based probability (not frequency)
   - Per-factor drift caps
   - Source role enforcement

3. **Event Delta Engine**
   - Factor inheritance from signals
   - Factor-scoped netting only
   - No cross-factor drift leakage

4. **Decay Scheduler**
   - Factor-scoped decay tracking
   - Phase transitions per factor

5. **Netting Engine**
   - Factor constraint enforcement
   - No cross-factor netting

### 10.2 Integration Tests

**Test Scenarios:**

1. **Factor Isolation**: Verify signals in one factor don't affect drift in another
2. **Source Role Enforcement**: Verify detection sources can't confirm events
3. **Netting Constraint**: Verify cross-factor netting is blocked
4. **Audit Trail**: Verify factor-level breakdown is exposed

### 10.3 Backtesting

**Historical Validation:**
- US-China Trade War (2018-2020)
- Russia-Ukraine Conflict (2022)
- COVID-19 Capital Controls (2020)
- Brexit (2016-2020)

---

## 11. Implementation Acceptance Criteria

### 11.1 Binding Compliance Requirements

The CSI implementation is **NON-COMPLIANT** if any of the following are true:

| # | Requirement | Compliance Check |
|---|-------------|------------------|
| 1 | CSI does not explicitly separate baseline, escalation drift, and event deltas | Must have three distinct components |
| 2 | Any signal, drift, event, or netting operation is not mapped to one of the seven CSI risk factors | All operations must be factor-scoped |
| 3 | Structural baseline inputs include macroeconomic or environmental variables | GDP, inflation, debt, climate risk must be excluded |
| 4 | CSI level changes only after confirmed events (no expectation-weighted movement) | Must show pre-event drift from signals |
| 5 | Signal probability is derived from frequency counts rather than expectation-based inference | Probability must be expectation-based |
| 6 | Confidence metrics alter CSI values rather than metadata or audit outputs | Confidence is metadata only |
| 7 | Cross-factor drift aggregation or netting occurs | Factor isolation must be enforced |

### 11.2 Authoritative Reference

**Appendix B remains the authoritative reference for:**
- Factor mappings
- Source roles
- Signal taxonomy

---

## Appendix A: Glossary

**CSI (Country Shock Index)**: A 0-100 scale metric measuring current geopolitical stress being priced in for a country.

**CSI Risk Factor**: One of seven geopolitical risk categories (Conflict & Security, Sanctions & Regulatory Pressure, Trade & Logistics Disruption, Governance & Rule of Law, Cyber & Data Sovereignty, Public Unrest & Civil Stability, Currency & Capital Controls).

**Structural Baseline**: Slow-moving institutional risk component per factor, updated quarterly.

**Escalation Drift**: Pre-event risk from signals per factor that may materialize into events.

**Event Delta**: Impact from confirmed geopolitical events per factor.

**Factor-Scoped**: Operations that are constrained to operate within a single CSI risk factor only.

**Detection Source**: A source authorized to generate signals but not confirm events.

**Confirmation Source**: A source authorized to confirm events but not generate signals.

**Expectation-Based Probability**: Probability derived from expert assessment and corroboration, not frequency counts.

---

## Appendix B: Change Log

### Version 4.0 (February 2026) - Factor-Scoped Architecture

**Major Changes:**
- Replaced six generic domains with seven CSI geopolitical risk factors
- Implemented factor-scoped architecture (all operations per factor)
- Added source role enforcement (detection vs confirmation)
- Added binding implementation acceptance criteria
- Enhanced audit trail with factor-level breakdown
- Removed macroeconomic and environmental contamination

**Definition Change:**
- Old: CSI is a current-state risk metric
- New: CSI measures current level of geopolitical stress being priced in, expectation-weighted

**New Constraints:**
- Cross-factor operations prohibited
- Source roles strictly enforced
- Confidence cannot alter CSI values

### Version 3.0 (January 2026)

**Changes:**
- Three-component architecture
- Decay Scheduler
- Netting Engine

### Version 2.0 (December 2025)

**Changes:**
- Event propagation logic
- Confidence scoring

### Version 1.0 (November 2025)

**Initial Release:**
- Five-component framework
- Basic CSI calculation

---

## Appendix C: Contact Information

**CO-GRI Research Team**  
Email: research@cedarowl.com  
Website: https://cedarowl.com

**Technical Support**  
Email: support@cedarowl.com  
Documentation: https://docs.cedarowl.com/csi

**For Academic Inquiries**  
Email: academic@cedarowl.com

---

**Document End**

*This methodology document is maintained by the CO-GRI Research Team and is updated quarterly. For the latest version, visit https://docs.cedarowl.com/csi/methodology*