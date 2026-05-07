# CO-GRI Platform Phase 2 & 3 - Technical Implementation Specification

**Version:** 2.0  
**Date:** 2026-02-28  
**Priority Order:** As specified by implementation guardrails

---

## Document Structure

This specification follows the exact implementation priority order:

1. **Unified Dashboard Specification v2.0** → Authoritative functional spec
2. **Platform Architecture Diagram** → Mode separation and engine routing
3. **Company Mode Implementation Spec** → CO-GRI pipeline and attribution logic
4. **Visual Dashboard Mockups** → Layout and UX reference
5. **CO-GRI Pipeline Correction** → Authoritative mathematical reference

---

# PART 1: UNIFIED DASHBOARD SPECIFICATION v2.0 (Authoritative Functional Spec)

## 1.1 Platform Overview

### Purpose
Single unified, institutional-grade CO-GRI platform integrating:
- **Country Risk Dashboard** (Phase 1 - reference implementation)
- **Company Intelligence Dashboard** (Phase 2)
- **Predictive Analytics** (Phase 3: Forecast Baseline + Scenario Stress Tests)
- **Trading Signal Service** (Phase 3)

### Core Principles
- **Single Source of Truth**: Each calculation has one authoritative engine
- **Lens-Based Architecture**: Clear separation of Structural vs Forecast vs Scenario vs Trading
- **Institutional Grade**: Bloomberg-style integrated workspace
- **Explainable Attribution**: Channels + country nodes + transmission trace

---

## 1.2 Global UI Framework (Persistent Across All Modes)

### Top Bar Layout (Required)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [CO-GRI Logo] │ Search: [Country|Company|Sector|Portfolio] [Input Box] │
│               │ Mode: [Country][Company][Forecast][Scenario][Trading]   │
│               │ Window: 7D|30D|90D|12M  Export|Save|Watchlist|Settings │
└─────────────────────────────────────────────────────────────────────────┘
```

### Global State Schema (Required)
```typescript
interface GlobalState {
  active_mode: 'Country' | 'Company' | 'Forecast' | 'Scenario' | 'Trading';
  time_window: '7D' | '30D' | '90D' | '12M';
  selected: {
    country: string | null;
    company: string | null;  // ticker symbol
    sector: string | null;
    portfolio: string | null;
  };
}
```

### State Management Rules
1. **Search Selector + Search Input** → Sets `selected_entity` (what you're looking at)
2. **Mode Toggle** → Sets `active_mode` (how you're looking at it; changes layout + engines)
3. **Time Window** → Controls all deltas/trend classifications unless component overrides

---

## 1.3 Mode Definitions (5 Operational Workspaces)

### Mode 1: Country Mode (Phase 1)
- **Purpose**: Country-level geopolitical risk measurement
- **Primary Engine**: Country Risk Engine (CSI)
- **Authoritative Spec**: Phase 1 CSI Dashboard Specification
- **Key Outputs**: Global Risk Index, Country Risk Score (CSI), vector breakdown, drivers

### Mode 2: Company Mode (Phase 2 Core)
- **Purpose**: Company risk intelligence workspace
- **Primary Engine**: Company Structural Engine (CO-GRI)
- **Sub-Tabs**: [Structural] [Forecast Overlay] [Scenario Shock] [Trading Signal]
- **Key Outputs**: CO-GRI score, risk contribution map, channel attribution, concentration

### Mode 3: Forecast Mode (Phase 3)
- **Purpose**: 6-12 month geopolitical outlook dashboard
- **Primary Engine**: Forecast Baseline Engine
- **Sub-Views**: Strategic Forecast Overview | Forecast Impact on Company/Portfolio
- **Key Outputs**: Event catalog with probabilities, global risk trajectory, asset class implications

### Mode 4: Scenario Mode (Phase 3)
- **Purpose**: User-defined event stress testing
- **Primary Engine**: Scenario Stress Test Engine
- **Workspaces**: Scenario Builder | Results | Attribution | Transmission Trace
- **Key Outputs**: ΔCO-GRI, Δ by channel, Δ by nodes, transmission trace

### Mode 5: Trading Mode (Phase 3)
- **Purpose**: Implementation + validation analytics
- **Primary Engine**: Trading Signal Engine
- **Workspaces**: Data Status | Recommendation | Performance | Regime | Sensitivity | Monte Carlo | ML Analytics
- **Key Outputs**: Recommendations, position sizing, confidence, backtests

---

## 1.4 Core Data Products (Required Inputs)

### Company Exposure Data
```typescript
interface CompanyExposure {
  company_id: string;
  ticker: string;
  home_country: string;
  sector: string;
  
  // Four exposure channels (for each country c)
  exposures: {
    [country: string]: {
      W_R: number;  // Revenue exposure [0,1]
      W_S: number;  // Supply chain exposure [0,1]
      W_P: number;  // Physical assets exposure [0,1]
      W_F: number;  // Financial exposure [0,1]
    };
  };
  
  // Sector multiplier
  M_sector: number;  // e.g., 1.2 for semiconductors
}
```

### Country Shock Data
```typescript
interface CountryShock {
  country: string;
  timestamp: Date;
  S_c: number;  // Country Shock Index [0,100]
  vectors: {
    political: number;
    economic: number;
    social: number;
    military: number;
    environmental: number;
  };
  drivers: Event[];
}
```

### Alignment Data
```typescript
interface AlignmentData {
  home_country: string;
  exposure_country: string;
  
  // Alignment factors [0,1]
  UNAlign: number;      // UN voting alignment
  TreatyAlign: number;  // Treaty/alliance alignment
  EconDepend: number;   // Economic dependence
}
```

---

## 1.5 Risk Level Thresholds (Consistent Across Platform)

### Risk Bands
```typescript
enum RiskLevel {
  LOW = 'Low',           // 0-30
  MODERATE = 'Moderate', // 30-50
  ELEVATED = 'Elevated', // 50-70
  HIGH = 'High'          // 70-100
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return RiskLevel.LOW;
  if (score < 50) return RiskLevel.MODERATE;
  if (score < 70) return RiskLevel.ELEVATED;
  return RiskLevel.HIGH;
}
```

### Direction/Trend Classification
```typescript
enum TrendDirection {
  INCREASING = 'Increasing',
  STABLE = 'Stable',
  DECREASING = 'Decreasing'
}

function getTrendDirection(current: number, previous: number): TrendDirection {
  const delta = current - previous;
  if (delta > 2) return TrendDirection.INCREASING;
  if (delta < -2) return TrendDirection.DECREASING;
  return TrendDirection.STABLE;
}
```

---

# PART 2: PLATFORM ARCHITECTURE DIAGRAM (Mode Separation & Engine Routing)

## 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CO-GRI UNIFIED PLATFORM                          │
│              (Single UI / Integrated Workspace)                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      GLOBAL TOP BAR (Persistent)                    │
│  [Logo] Search Mode:[Country|Company|Forecast|Scenario|Trading]     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER / ENGINES                           │
│                                                                     │
│  Engine A: COUNTRY RISK (CSI)                                       │
│    → Output: S_c(t) + vectors + drivers + events                   │
│                                                                     │
│  Engine B: COMPANY STRUCTURAL (CO-GRI)                              │
│    → Input: exposures, S_c(t), alignment, sector multiplier        │
│    → Output: CO-GRI_i(t), Risk_{i,c}, channel attribution          │
│                                                                     │
│  Engine C: FORECAST BASELINE (Strategic Forecast)                   │
│    → Output: baseline events, probabilities, expected-path deltas   │
│                                                                     │
│  Engine D: SCENARIO STRESS TEST (What-If Simulator)                 │
│    → Input: user-defined event                                      │
│    → Output: ΔCO-GRI + Δ by channel + transmission trace           │
│                                                                     │
│  Engine E: TRADING SIGNAL (Implementation)                          │
│    → Input: CO-GRI + regime + ML forecast + constraints            │
│    → Output: recommendations, sizing, backtests, analytics          │
└─────────────────────────────────────────────────────────────────────┘
```

## 2.2 Engine Routing Logic

### Engine Activation Matrix
```typescript
interface EngineActivation {
  mode: Mode;
  primary_engine: Engine;
  integrated_engines: Engine[];
}

const ENGINE_ROUTING: EngineActivation[] = [
  {
    mode: 'Country',
    primary_engine: 'CSI',
    integrated_engines: []
  },
  {
    mode: 'Company',
    primary_engine: 'CO-GRI',
    integrated_engines: ['Forecast', 'Scenario', 'Trading']  // contextual overlays
  },
  {
    mode: 'Forecast',
    primary_engine: 'Forecast',
    integrated_engines: ['CO-GRI']  // for company impact view
  },
  {
    mode: 'Scenario',
    primary_engine: 'Scenario',
    integrated_engines: ['CO-GRI']  // for impact calculation
  },
  {
    mode: 'Trading',
    primary_engine: 'Trading',
    integrated_engines: ['CO-GRI', 'Forecast', 'Scenario']  // all risk signals
  }
];
```

### Cross-Mode Deep Linking
```typescript
interface DeepLink {
  from_mode: Mode;
  to_mode: Mode;
  action: string;
  prefill_context: string[];
}

const DEEP_LINKS: DeepLink[] = [
  {
    from_mode: 'Company',
    to_mode: 'Scenario',
    action: 'Stress Test',
    prefill_context: ['top_exposure_countries', 'dominant_channels']
  },
  {
    from_mode: 'Forecast',
    to_mode: 'Company',
    action: 'Apply to Company',
    prefill_context: ['selected_company', 'forecast_events']
  },
  {
    from_mode: 'Scenario',
    to_mode: 'Company',
    action: 'Open Company Detail',
    prefill_context: ['selected_company', 'scenario_context']
  },
  {
    from_mode: 'Company',
    to_mode: 'Trading',
    action: 'Trade This Signal',
    prefill_context: ['ticker']
  },
  {
    from_mode: 'Country',
    to_mode: 'Company',
    action: 'Show Exposed Companies',
    prefill_context: ['country_filter']
  }
];
```

---

# PART 3: COMPANY MODE IMPLEMENTATION SPEC (CO-GRI Pipeline & Attribution)

## 3.1 Company Mode Architecture

### Sub-Tab Structure (Required)
```
Company Mode
├── [Structural] (default) ← Current state CO-GRI
├── [Forecast Overlay] ← Probability-weighted expected path
├── [Scenario Shock] ← Conditional stress test
└── [Trading Signal] ← Implementation summary
```

### Lens Badge Requirement
**CRITICAL**: Every panel MUST display its active lens:
- **Structural** → "Current State"
- **Forecast Overlay** → "Probability-Weighted Expected Path"
- **Scenario Shock** → "Conditional Stress Test"
- **Trading Signal** → "Implementation Output"

```typescript
interface LensBadge {
  lens: 'Structural' | 'Forecast Overlay' | 'Scenario Shock' | 'Trading Signal';
  color: string;
  icon: string;
}

const LENS_BADGES: Record<string, LensBadge> = {
  'Structural': { lens: 'Structural', color: 'blue', icon: 'current' },
  'Forecast Overlay': { lens: 'Forecast Overlay', color: 'purple', icon: 'forecast' },
  'Scenario Shock': { lens: 'Scenario Shock', color: 'orange', icon: 'scenario' },
  'Trading Signal': { lens: 'Trading Signal', color: 'green', icon: 'trading' }
};
```

## 3.2 Company Mode Layout (Institutional Grid)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPANY MODE                                │
│  Sub-tabs: [Structural*] [Forecast Overlay] [Scenario] [Trading]   │
├──────────────┬───────────────────────────┬─────────────────────────┤
│              │                           │                         │
│  LEFT COL    │      CENTER COL           │      RIGHT COL          │
│              │                           │                         │
│  C5: Top     │  C3: Risk Contribution    │  C1: Company Summary    │
│  Relevant    │      Map (World Map +     │      Panel              │
│  Risks       │      Top Countries)       │                         │
│              │                           │  C6: Peer Comparison    │
│  C4: Exposure│  C2: CO-GRI Trend         │                         │
│  Pathways    │      (Line Chart)         │  Trading Summary Card   │
│              │                           │  (if available)         │
│  Watchlist/  │  Country-node drill-down  │                         │
│  Notes       │  (on click)               │                         │
│              │                           │                         │
├──────────────┴───────────────────────────┴─────────────────────────┤
│                      BOTTOM ROW (Full Width)                        │
│                                                                     │
│  C7: Risk Attribution (Bar Chart + Table)                           │
│  C8: Timeline / Event Feed                                          │
│  C9: Verification Drawer (Collapsed by Default)                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3.3 Component Specifications

### C1: Company Summary Panel (Right/Top)

**Purpose**: Single-glance state and investor-facing interpretation

**Required Fields (Structural)**
```typescript
interface CompanySummary {
  company_name: string;
  ticker: string;
  CO_GRI: number;           // Numeric score [0-100]
  risk_level: RiskLevel;    // Low/Moderate/Elevated/High
  delta_CO_GRI: number;     // Change over time_window
  direction: TrendDirection; // Increasing/Stable/Decreasing
  primary_driver: {
    country: string;
    channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  };
  concentration: {
    HHI: number;            // Herfindahl-Hirschman Index
    label: 'Concentrated' | 'Diversified';
  };
}
```

**Concentration Calculation**
```typescript
function calculateConcentration(riskShares: number[]): { HHI: number; label: string } {
  const HHI = riskShares.reduce((sum, share) => sum + share * share, 0);
  const label = HHI >= 0.25 ? 'Concentrated' : 'Diversified';
  return { HHI, label };
}
```

**Required Fields (Forecast Overlay)**
```typescript
interface ForecastOverlay {
  forecast_outlook: 'Headwind' | 'Tailwind' | 'Mixed';
  confidence: 'High' | 'Medium' | 'Low';
  horizon: '6-12 months';
  expected_delta_CO_GRI: number;
  top_forecast_drivers: ForecastEvent[];
}
```

**Required Fields (Scenario Shock)**
```typescript
interface ScenarioShock {
  scenario_title: string;
  assumptions_summary: string;
  CO_GRI_scenario: number;
  delta_CO_GRI: number;
  top_impacted_channels: string[];
  top_impacted_countries: string[];
  transmission_trace_link: string;
}
```

**Required Fields (Trading Signal)**
```typescript
interface TradingSignal {
  recommendation: 'Increase' | 'Decrease' | 'Hold';
  current_position: number | null;
  optimal_position: number;
  adjustment: number;
  confidence: number;  // [0,1]
  expected_impact: {
    return_delta: number;
    risk_reduction: number;
    sharpe_delta: number;
  };
}
```

---

### C2: CO-GRI Trend Panel (Center)

**Purpose**: Show evolution of company risk over time

**Required Display**
- Line chart: `CO_GRI_i(t)` over selected time window
- Optional overlays (toggle):
  - `AdjS_{top_country}(t)` for top 1-3 contributors
  - Risk bands shading (Low/Mod/Elev/High)

**Calculation**
```typescript
interface TrendDataPoint {
  timestamp: Date;
  CO_GRI: number;
  top_contributors: Array<{
    country: string;
    AdjS: number;
    risk_share: number;
  }>;
  channel_shares: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
}

function calculateTrend(
  company: CompanyExposure,
  shockTimeSeries: Map<Date, CountryShock[]>,
  timeWindow: string
): TrendDataPoint[] {
  const dataPoints: TrendDataPoint[] = [];
  
  for (const [timestamp, shocks] of shockTimeSeries) {
    const cogri = calculateCOGRI(company, shocks);
    const contributors = getTopContributors(company, shocks, 3);
    const channelShares = calculateChannelShares(company, shocks);
    
    dataPoints.push({
      timestamp,
      CO_GRI: cogri,
      top_contributors: contributors,
      channel_shares: channelShares
    });
  }
  
  return dataPoints;
}
```

**Required Interaction**
- Click timepoint → Show modal with:
  - Top contributors at that date
  - Channel shares at that date
  - Events that occurred around that date

---

### C3: Risk Contribution Map (Center/Top)

**Purpose**: Show where risk comes from with minimal "false precision"

**Required Display**
- World map with top 5-7 contributing countries highlighted
- Color gradient based on risk contribution share
- Ranked list beside map

**Data Structure**
```typescript
interface RiskContribution {
  country: string;
  risk_share: number;        // Percentage [0,100]
  contribution_label: string; // "Primary" | "Significant" | "Moderate"
  dominant_channel: string;   // "Supply Chain" | "Revenue" | etc.
  AdjS: number;              // Adjusted shock (advanced toggle)
  W_c: number;               // Alignment modifier (advanced toggle)
}
```

**Calculation** (See Part 5 for full pipeline)
```typescript
function calculateRiskContributions(
  company: CompanyExposure,
  shocks: CountryShock[],
  alignments: AlignmentData[]
): RiskContribution[] {
  const contributions: RiskContribution[] = [];
  
  for (const country of Object.keys(company.exposures)) {
    const shock = shocks.find(s => s.country === country);
    if (!shock) continue;
    
    const alignment = alignments.find(a => 
      a.home_country === company.home_country && a.exposure_country === country
    );
    
    const W_c = alignment ? calculateAlignmentModifier(alignment) : 0;
    const AdjS = shock.S_c * (1 - 0.5 * W_c);  // λ = 0.5
    
    const W_geo = calculateGeographicWeight(company.exposures[country]);
    const W_norm = W_geo;  // Normalized in full pipeline
    
    const risk = W_norm * AdjS;
    
    contributions.push({
      country,
      risk_share: (risk / totalRisk) * 100,
      contribution_label: getLabelFromShare(risk / totalRisk),
      dominant_channel: getDominantChannel(company.exposures[country]),
      AdjS,
      W_c
    });
  }
  
  return contributions.sort((a, b) => b.risk_share - a.risk_share);
}
```

**Required Interactions**
- Hover → Show tooltip with:
  - Country name
  - Risk share percentage
  - Dominant channel (qualitative)
  - Advanced toggle: Show AdjS and W_c values
- Click → Drill down to country detail (shows all channels, events, vectors)

---

### C4: Exposure Pathways (Left)

**Purpose**: Explain how risk transmits via the four operational channels

**Structural View: Channel Contribution Shares**

```typescript
interface ChannelContribution {
  channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  share: number;  // Percentage [0,100]
  risk_value: number;
}

function calculateChannelContributions(
  company: CompanyExposure,
  shocks: CountryShock[]
): ChannelContribution[] {
  // Step 1: Blend exposures with channel weights
  const channelWeights = {
    revenue: 0.35,
    supply_chain: 0.30,
    physical_assets: 0.20,
    financial: 0.10
  };
  
  const channelRisks: Record<string, number> = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0
  };
  
  for (const [country, exposure] of Object.entries(company.exposures)) {
    const shock = shocks.find(s => s.country === country);
    if (!shock) continue;
    
    const AdjS = calculateAdjustedShock(shock, company.home_country, country);
    
    channelRisks.revenue += (channelWeights.revenue * exposure.W_R) * AdjS;
    channelRisks.supply_chain += (channelWeights.supply_chain * exposure.W_S) * AdjS;
    channelRisks.physical_assets += (channelWeights.physical_assets * exposure.W_P) * AdjS;
    channelRisks.financial += (channelWeights.financial * exposure.W_F) * AdjS;
  }
  
  const totalRisk = Object.values(channelRisks).reduce((a, b) => a + b, 0);
  
  return Object.entries(channelRisks).map(([channel, risk]) => ({
    channel: channel as any,
    share: (risk / totalRisk) * 100,
    risk_value: risk
  }));
}
```

**Forecast Overlay View: Channel Impact Assessment**

```typescript
interface ChannelImpact {
  channel: string;
  direction: 'Increasing' | 'Decreasing' | 'Stable';
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
}

// Example output:
const forecastChannelImpacts: ChannelImpact[] = [
  {
    channel: 'Supply Chain',
    direction: 'Increasing',
    severity: 'High',
    explanation: 'US-China decoupling (70% probability) expected to disrupt semiconductor supply chains in Q2-Q3 2026'
  },
  {
    channel: 'Revenue',
    direction: 'Stable',
    severity: 'Low',
    explanation: 'Minimal expected change in revenue exposure geography'
  }
];
```

**Scenario View: Δ by Channel**

```typescript
interface ChannelDelta {
  channel: string;
  structural_risk: number;
  scenario_risk: number;
  delta: number;
  delta_percentage: number;
}

function calculateChannelDeltas(
  company: CompanyExposure,
  structuralShocks: CountryShock[],
  scenarioShocks: CountryShock[]
): ChannelDelta[] {
  const structuralChannels = calculateChannelContributions(company, structuralShocks);
  const scenarioChannels = calculateChannelContributions(company, scenarioShocks);
  
  return structuralChannels.map((structural, i) => {
    const scenario = scenarioChannels[i];
    const delta = scenario.risk_value - structural.risk_value;
    const delta_percentage = (delta / structural.risk_value) * 100;
    
    return {
      channel: structural.channel,
      structural_risk: structural.risk_value,
      scenario_risk: scenario.risk_value,
      delta,
      delta_percentage
    };
  });
}
```

---

### C5: Top Relevant Risks (Left/Top)

**Purpose**: Show 1-2 most relevant geopolitical risks with likelihood + ΔCO-GRI + channels + where

**Structural: Top Structural Drivers**
```typescript
interface StructuralDriver {
  country: string;
  risk_share: number;
  dominant_channel: string;
  top_vectors?: string[];  // If CSI vector breakdown exists
}

// Example:
const structuralDrivers: StructuralDriver[] = [
  {
    country: 'China',
    risk_share: 45.2,
    dominant_channel: 'Supply Chain',
    top_vectors: ['Political Instability', 'Trade Restrictions']
  },
  {
    country: 'Taiwan',
    risk_share: 23.8,
    dominant_channel: 'Supply Chain',
    top_vectors: ['Military Conflict Risk']
  }
];
```

**Forecast Overlay: Relevant Forecast Drivers**

**CRITICAL GUARDRAIL**: Events must be relevance-filtered first

```typescript
interface ForecastEvent {
  event_name: string;
  probability: number;      // [0,1]
  timing: string;           // "Q2 2026" | "6-9 months"
  why_relevant: string;     // Explanation of relevance to this company
  expected_delta_CO_GRI: number;
  delta_by_channel: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  top_country_nodes: string[];
  trace: TransmissionTrace;  // Collapsed by default
}

function filterRelevantForecastEvents(
  company: CompanyExposure,
  allForecastEvents: ForecastEvent[]
): ForecastEvent[] {
  return allForecastEvents.filter(event => {
    // Relevance criteria:
    // 1. Event affects countries where company has exposure
    const affectedCountries = event.top_country_nodes;
    const hasExposure = affectedCountries.some(country => 
      company.exposures[country] && Object.values(company.exposures[country]).some(w => w > 0.05)  // >5% threshold
    );
    
    // 2. Expected ΔCO-GRI > threshold (e.g., ±2)
    const significantImpact = Math.abs(event.expected_delta_CO_GRI) > 2;
    
    return hasExposure && significantImpact;
  });
}
```

**Forecast Expected-Path Rule (CRITICAL)**
```typescript
// GUARDRAIL: Must NOT redistribute exposures or create new exposures
function applyForecastToCompany(
  company: CompanyExposure,
  forecastEvent: ForecastEvent
): number {
  let delta_CO_GRI = 0;
  
  for (const country of forecastEvent.top_country_nodes) {
    // ONLY apply if company already has exposure to this country
    if (!company.exposures[country]) continue;
    
    const existingExposure = company.exposures[country];
    
    // Apply forecast delta to existing shock intensity
    // DO NOT change exposure weights
    const forecastDelta = forecastEvent.delta_by_channel;
    
    delta_CO_GRI += (
      existingExposure.W_R * forecastDelta.revenue +
      existingExposure.W_S * forecastDelta.supply_chain +
      existingExposure.W_P * forecastDelta.physical_assets +
      existingExposure.W_F * forecastDelta.financial
    );
  }
  
  return delta_CO_GRI;
}
```

**Scenario Shock: Scenario Drivers**
```typescript
interface ScenarioDriver {
  assumptions: string;
  total_delta_CO_GRI: number;
  delta_by_channel: ChannelDelta[];
  top_nodes: string[];
  trace: TransmissionTrace;  // Collapsed by default
}
```

---

### C6: Peer Comparison (Right/Mid)

**Purpose**: Relative context

**Required Columns**
```typescript
interface PeerComparison {
  company: string;
  ticker: string;
  CO_GRI: number;
  risk_level: RiskLevel;
  direction: TrendDirection;
  concentration_HHI?: number;  // Optional
  
  // Forecast Overlay adds:
  forecast_outlook?: 'Headwind' | 'Tailwind' | 'Mixed';
  confidence?: 'High' | 'Medium' | 'Low';
}

// Example:
const peers: PeerComparison[] = [
  { company: 'Apple Inc.', ticker: 'AAPL', CO_GRI: 62.4, risk_level: 'Elevated', direction: 'Increasing', concentration_HHI: 0.31 },
  { company: 'NVIDIA Corp.', ticker: 'NVDA', CO_GRI: 68.7, risk_level: 'Elevated', direction: 'Increasing', concentration_HHI: 0.38 },
  { company: 'Intel Corp.', ticker: 'INTC', CO_GRI: 54.2, risk_level: 'Elevated', direction: 'Stable', concentration_HHI: 0.22 }
];
```

---

### C7: Risk Attribution (Bottom)

**Purpose**: Show top contributing countries in clear investor language

**Required Display**
- Bar chart + table of top 10 risk contributors
- **Explicit label**: "Risk contribution share (not exposure share)"

**Calculation**
```typescript
interface RiskAttribution {
  country: string;
  risk_share: number;        // Percentage of total CO-GRI
  risk_value: number;        // Absolute contribution
  rank: number;
  dominant_channel: string;
}

function calculateRiskAttribution(
  company: CompanyExposure,
  shocks: CountryShock[]
): RiskAttribution[] {
  const contributions = calculateRiskContributions(company, shocks, alignments);
  const totalRisk = contributions.reduce((sum, c) => sum + c.risk_share, 0);
  
  return contributions
    .slice(0, 10)  // Top 10
    .map((c, i) => ({
      country: c.country,
      risk_share: c.risk_share,
      risk_value: c.risk_share * totalRisk / 100,
      rank: i + 1,
      dominant_channel: c.dominant_channel
    }));
}
```

---

### C8: Timeline / Event Feed (Bottom)

**Purpose**: Show events without mixing lenses

**Structural Feed**: Events impacting top contributing countries (Phase 1 style)
```typescript
interface StructuralEvent {
  date: Date;
  country: string;
  event_type: string;
  description: string;
  impact_on_CSI: number;
  vectors_affected: string[];
}
```

**Forecast Overlay Feed**: Relevance-filtered forecast events
```typescript
interface ForecastFeedItem {
  event_name: string;
  probability: number;
  timing: string;
  affected_countries: string[];
  expected_impact: number;
  why_relevant: string;
}
```

**Scenario Feed**: Scenario assumptions + attribution summary
```typescript
interface ScenarioFeedItem {
  scenario_title: string;
  assumptions: string;
  delta_CO_GRI: number;
  top_impacted_channels: string[];
  top_impacted_countries: string[];
}
```

---

### C9: Verification Drawer (Collapsed by Default)

**Purpose**: QA / internal validation only; hidden by default

**Contains**
```typescript
interface VerificationData {
  // Exposure matrices
  exposure_matrix: {
    [country: string]: {
      W_R: number;
      W_S: number;
      W_P: number;
      W_F: number;
    };
  };
  
  // Alignment inputs
  alignment_data: AlignmentData[];
  
  // Intermediate pipeline values
  pipeline_steps: {
    W_geo: { [country: string]: number };
    W_norm: { [country: string]: number };
    W_c: { [country: string]: number };
    AdjS: { [country: string]: number };
    Risk: { [country: string]: number };
  };
  
  // Coverage flags
  coverage: {
    exposure_coverage: number;  // % of revenue/assets covered
    alignment_coverage: number;  // % of countries with alignment data
    shock_data_freshness: Date;
  };
}
```

---

# PART 4: VISUAL DASHBOARD MOCKUPS (Layout & UX Reference)

## 4.1 Company Mode - Structural Tab Layout

### Desktop Layout (1920x1080)
```
┌─────────────────────────────────────────────────────────────────────┐
│ [CO-GRI] Search: Company [Apple Inc. ▼]  Mode: [Country][Company*] │
│ [Forecast][Scenario][Trading]  Window: 30D  Export | Save | Watch   │
├─────────────────────────────────────────────────────────────────────┤
│ COMPANY MODE: Apple Inc. (AAPL)                                     │
│ [Structural*] [Forecast Overlay] [Scenario Shock] [Trading Signal]  │
├──────────────┬───────────────────────────┬─────────────────────────┤
│ LEFT (25%)   │ CENTER (50%)              │ RIGHT (25%)             │
├──────────────┼───────────────────────────┼─────────────────────────┤
│ C5: Top      │ C3: Risk Contribution Map │ C1: Company Summary     │
│ Relevant     │ ┌───────────────────────┐ │ ┌─────────────────────┐ │
│ Risks        │ │   [World Map Visual]  │ │ │ Apple Inc. (AAPL)   │ │
│ ┌──────────┐ │ │   Top 5 countries     │ │ │ CO-GRI: 62.4        │ │
│ │ 🇨🇳 China  │ │ │   highlighted         │ │ │ Risk: Elevated ▲    │ │
│ │ 45.2%     │ │ └───────────────────────┘ │ │ Δ30D: +3.2          │ │
│ │ Supply    │ │ Top Contributors:         │ │ Direction: ↑        │ │
│ │ Chain     │ │ 1. China      45.2%       │ │ Primary: China/SC   │ │
│ └──────────┘ │ 2. Taiwan     23.8%       │ │ Concentration:      │ │
│ ┌──────────┐ │ 3. Vietnam    12.4%       │ │ HHI: 0.31 (Conc.)   │ │
│ │ 🇹🇼 Taiwan │ │ 4. Japan       8.7%       │ └─────────────────────┘ │
│ │ 23.8%     │ │ 5. S. Korea    5.9%       │                         │
│ │ Supply    │ ├───────────────────────────┤ C6: Peer Comparison     │
│ │ Chain     │ C2: CO-GRI Trend (12M)      │ ┌─────────────────────┐ │
│ └──────────┘ │ ┌───────────────────────┐ │ │ Ticker | Score | Δ  │ │
├──────────────┤ │   [Line Chart]        │ │ │ AAPL   | 62.4   | ↑  │ │
│ C4: Exposure │ │   62.4 ────────       │ │ │ NVDA   | 68.7   | ↑  │ │
│ Pathways     │ │        ╱              │ │ │ INTC   | 54.2   | →  │ │
│ ┌──────────┐ │ │       ╱               │ │ │ MSFT   | 48.9   | ↓  │ │
│ │ Supply   │ │ │   59.2                │ │ └─────────────────────┘ │
│ │ Chain    │ │ └───────────────────────┘ │                         │
│ │ 42.3%    │ │                           │ Trading Summary         │
│ │ ████████ │ │                           │ ┌─────────────────────┐ │
│ │          │ │                           │ │ Rec: Decrease       │ │
│ │ Revenue  │ │                           │ │ Confidence: 72%     │ │
│ │ 28.7%    │ │                           │ │ Expected Δ: -2.1%   │ │
│ │ █████    │ │                           │ └─────────────────────┘ │
│ │          │ │                           │                         │
│ │ Physical │ │                           │                         │
│ │ 18.9%    │ │                           │                         │
│ │ ███      │ │                           │                         │
│ │          │ │                           │                         │
│ │ Financial│ │                           │                         │
│ │ 10.1%    │ │                           │                         │
│ │ ██       │ │                           │                         │
│ └──────────┘ │                           │                         │
├──────────────┴───────────────────────────┴─────────────────────────┤
│ BOTTOM ROW (Full Width)                                             │
├─────────────────────────────────────────────────────────────────────┤
│ C7: Risk Attribution                                                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Bar Chart: Top 10 Countries by Risk Contribution]             │ │
│ │ China     ████████████████████████████████████ 45.2%           │ │
│ │ Taiwan    ████████████████████ 23.8%                           │ │
│ │ Vietnam   ██████████ 12.4%                                     │ │
│ │ Japan     ███████ 8.7%                                         │ │
│ │ S. Korea  ████ 5.9%                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ C8: Timeline / Event Feed                                           │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 2026-02-15 | China | Trade Restrictions | CSI +8 | Political   │ │
│ │ 2026-02-10 | Taiwan | Military Tensions | CSI +12 | Military   │ │
│ │ 2026-01-28 | Vietnam | Supply Chain Disruption | CSI +5        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ C9: Verification Drawer [▼ Expand for QA Data]                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.2 Color Scheme & Visual Design

### Risk Level Colors
```typescript
const RISK_COLORS = {
  LOW: '#10B981',        // Green
  MODERATE: '#F59E0B',   // Amber
  ELEVATED: '#F97316',   // Orange
  HIGH: '#EF4444'        // Red
};
```

### Lens Badge Colors
```typescript
const LENS_COLORS = {
  STRUCTURAL: '#3B82F6',      // Blue
  FORECAST_OVERLAY: '#8B5CF6', // Purple
  SCENARIO_SHOCK: '#F97316',   // Orange
  TRADING_SIGNAL: '#10B981'    // Green
};
```

### Chart Styling
- **Line Charts**: Use Recharts with smooth curves, grid lines, tooltips
- **Bar Charts**: Horizontal bars for risk attribution, vertical for channel breakdown
- **Maps**: Use D3.js or similar for interactive world map with country highlighting

---

# PART 5: CO-GRI PIPELINE CORRECTION (Authoritative Mathematical Reference)

## 5.1 Authoritative CO-GRI Calculation Pipeline

**CRITICAL GUARDRAIL**: W^c (alignment modifier) modifies country shock S_c, NOT exposure weights

### Pipeline Overview
```
Input Data:
  - Company exposures: W^R, W^S, W^P, W^F (for each country c)
  - Country shocks: S_c(t)
  - Alignment data: UNAlign, TreatyAlign, EconDepend
  - Sector multiplier: M_sector

Pipeline Steps:
  1. Four exposure channels exist only (W^R, W^S, W^P, W^F)
  2. Blend exposures with channel weights
  3. Normalize exposures (sum = 1)
  4. Compute alignment modifier W^c
  5. Adjust country shock S_c using alignment → AdjS_c
  6. Calculate country contribution: Risk_{i,c}
  7. Aggregate + apply sector multiplier → CO-GRI_i
```

### Step-by-Step Implementation

#### Step 1: Four Exposure Channels (Data Input)
```typescript
interface ExposureChannels {
  W_R: number;  // Revenue exposure [0,1]
  W_S: number;  // Supply chain exposure [0,1]
  W_P: number;  // Physical assets exposure [0,1]
  W_F: number;  // Financial exposure [0,1]
}

// Example for Apple in China:
const appleChina: ExposureChannels = {
  W_R: 0.18,   // 18% of revenue from China
  W_S: 0.65,   // 65% of supply chain in China
  W_P: 0.05,   // 5% of physical assets in China
  W_F: 0.02    // 2% of financial exposure in China
};
```

#### Step 2: Blend Exposures with Channel Weights
```typescript
const CHANNEL_WEIGHTS = {
  REVENUE: 0.35,
  SUPPLY_CHAIN: 0.30,
  PHYSICAL_ASSETS: 0.20,
  FINANCIAL: 0.10
};

function blendExposures(exposure: ExposureChannels): number {
  return (
    CHANNEL_WEIGHTS.REVENUE * exposure.W_R +
    CHANNEL_WEIGHTS.SUPPLY_CHAIN * exposure.W_S +
    CHANNEL_WEIGHTS.PHYSICAL_ASSETS * exposure.W_P +
    CHANNEL_WEIGHTS.FINANCIAL * exposure.W_F
  );
}

// Example:
const W_geo_china = blendExposures(appleChina);
// = 0.35 * 0.18 + 0.30 * 0.65 + 0.20 * 0.05 + 0.10 * 0.02
// = 0.063 + 0.195 + 0.010 + 0.002
// = 0.270
```

#### Step 3: Normalize Exposures (Sum = 1)
```typescript
function normalizeExposures(
  exposures: Map<string, ExposureChannels>
): Map<string, number> {
  const W_geo_map = new Map<string, number>();
  let sum_W_geo = 0;
  
  // Calculate W_geo for each country
  for (const [country, exposure] of exposures) {
    const W_geo = blendExposures(exposure);
    W_geo_map.set(country, W_geo);
    sum_W_geo += W_geo;
  }
  
  // Normalize
  const W_norm_map = new Map<string, number>();
  for (const [country, W_geo] of W_geo_map) {
    W_norm_map.set(country, W_geo / sum_W_geo);
  }
  
  return W_norm_map;
}

// Example:
// If Apple has exposures in China (0.270), Taiwan (0.120), Vietnam (0.080), etc.
// Sum = 0.470
// W_norm_china = 0.270 / 0.470 = 0.574
```

#### Step 4: Compute Alignment Modifier W^c
```typescript
interface AlignmentFactors {
  UNAlign: number;      // [0,1]
  TreatyAlign: number;  // [0,1]
  EconDepend: number;   // [0,1]
}

function calculateAlignmentModifier(alignment: AlignmentFactors): number {
  // W^c = average of three alignment factors
  return (alignment.UNAlign + alignment.TreatyAlign + alignment.EconDepend) / 3;
}

// Example: US (home) vs China (exposure)
const usChina: AlignmentFactors = {
  UNAlign: 0.2,      // Low UN voting alignment
  TreatyAlign: 0.1,  // Few treaties
  EconDepend: 0.6    // High economic dependence
};

const W_c_china = calculateAlignmentModifier(usChina);
// = (0.2 + 0.1 + 0.6) / 3 = 0.3
```

#### Step 5: Adjust Country Shock S_c Using Alignment → AdjS_c

**CRITICAL**: This is where W^c modifies the shock, NOT the exposure

```typescript
const LAMBDA = 0.50;  // Default alignment sensitivity parameter

function adjustShock(S_c: number, W_c: number, lambda: number = LAMBDA): number {
  return S_c * (1 - lambda * W_c);
}

// Example:
const S_china = 72;  // China's CSI score
const AdjS_china = adjustShock(S_china, W_c_china);
// = 72 * (1 - 0.50 * 0.3)
// = 72 * (1 - 0.15)
// = 72 * 0.85
// = 61.2
```

**Interpretation**: 
- High alignment (W^c → 1) reduces perceived risk
- Low alignment (W^c → 0) means full shock applies
- λ controls sensitivity (0.5 = moderate, 1.0 = full dampening)

#### Step 6: Calculate Country Contribution Risk_{i,c}
```typescript
function calculateCountryRisk(
  W_norm: number,
  AdjS: number
): number {
  return W_norm * AdjS;
}

// Example:
const Risk_china = calculateCountryRisk(0.574, 61.2);
// = 0.574 * 61.2
// = 35.1
```

#### Step 7: Aggregate + Apply Sector Multiplier → CO-GRI_i
```typescript
function calculateCOGRI(
  countryRisks: Map<string, number>,
  M_sector: number
): number {
  const sum_risk = Array.from(countryRisks.values()).reduce((a, b) => a + b, 0);
  return sum_risk * M_sector;
}

// Example:
const countryRisks = new Map([
  ['China', 35.1],
  ['Taiwan', 14.6],
  ['Vietnam', 7.3],
  ['Japan', 5.4],
  ['S. Korea', 3.6]
]);

const M_sector_semiconductors = 1.2;  // 20% sector amplification

const CO_GRI_apple = calculateCOGRI(countryRisks, M_sector_semiconductors);
// = (35.1 + 14.6 + 7.3 + 5.4 + 3.6) * 1.2
// = 66.0 * 1.2
// = 79.2
```

### Complete Pipeline Function
```typescript
function calculateCompanyCOGRI(
  company: CompanyExposure,
  shocks: Map<string, CountryShock>,
  alignments: Map<string, AlignmentData>,
  lambda: number = 0.50
): {
  CO_GRI: number;
  countryRisks: Map<string, number>;
  intermediateSteps: any;
} {
  // Step 1: Input validation
  if (!company.exposures || Object.keys(company.exposures).length === 0) {
    throw new Error('Company has no exposure data');
  }
  
  // Step 2: Blend exposures
  const W_geo_map = new Map<string, number>();
  for (const [country, exposure] of Object.entries(company.exposures)) {
    W_geo_map.set(country, blendExposures(exposure));
  }
  
  // Step 3: Normalize
  const sum_W_geo = Array.from(W_geo_map.values()).reduce((a, b) => a + b, 0);
  const W_norm_map = new Map<string, number>();
  for (const [country, W_geo] of W_geo_map) {
    W_norm_map.set(country, W_geo / sum_W_geo);
  }
  
  // Step 4-6: Calculate country risks
  const countryRisks = new Map<string, number>();
  const W_c_map = new Map<string, number>();
  const AdjS_map = new Map<string, number>();
  
  for (const [country, W_norm] of W_norm_map) {
    const shock = shocks.get(country);
    if (!shock) {
      console.warn(`No shock data for country: ${country}`);
      continue;
    }
    
    const alignment = alignments.get(`${company.home_country}-${country}`);
    const W_c = alignment ? calculateAlignmentModifier(alignment) : 0;
    const AdjS = adjustShock(shock.S_c, W_c, lambda);
    const risk = calculateCountryRisk(W_norm, AdjS);
    
    W_c_map.set(country, W_c);
    AdjS_map.set(country, AdjS);
    countryRisks.set(country, risk);
  }
  
  // Step 7: Aggregate + sector multiplier
  const CO_GRI = calculateCOGRI(countryRisks, company.M_sector);
  
  return {
    CO_GRI,
    countryRisks,
    intermediateSteps: {
      W_geo: Object.fromEntries(W_geo_map),
      W_norm: Object.fromEntries(W_norm_map),
      W_c: Object.fromEntries(W_c_map),
      AdjS: Object.fromEntries(AdjS_map)
    }
  };
}
```

## 5.2 Validation & Testing

### Unit Test Cases
```typescript
describe('CO-GRI Pipeline', () => {
  it('should calculate alignment modifier correctly', () => {
    const alignment: AlignmentFactors = {
      UNAlign: 0.2,
      TreatyAlign: 0.1,
      EconDepend: 0.6
    };
    const W_c = calculateAlignmentModifier(alignment);
    expect(W_c).toBeCloseTo(0.3, 2);
  });
  
  it('should adjust shock correctly', () => {
    const S_c = 72;
    const W_c = 0.3;
    const lambda = 0.5;
    const AdjS = adjustShock(S_c, W_c, lambda);
    expect(AdjS).toBeCloseTo(61.2, 1);
  });
  
  it('should normalize exposures to sum to 1', () => {
    const exposures = new Map([
      ['China', { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 }],
      ['Taiwan', { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 }]
    ]);
    const W_norm = normalizeExposures(exposures);
    const sum = Array.from(W_norm.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
  
  it('should calculate CO-GRI end-to-end', () => {
    // Full integration test with known inputs/outputs
    const company: CompanyExposure = {
      company_id: 'AAPL',
      ticker: 'AAPL',
      home_country: 'US',
      sector: 'Technology',
      exposures: {
        'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
        'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 }
      },
      M_sector: 1.2
    };
    
    const shocks = new Map([
      ['China', { country: 'China', S_c: 72, timestamp: new Date() }],
      ['Taiwan', { country: 'Taiwan', S_c: 68, timestamp: new Date() }]
    ]);
    
    const alignments = new Map([
      ['US-China', { home_country: 'US', exposure_country: 'China', UNAlign: 0.2, TreatyAlign: 0.1, EconDepend: 0.6 }],
      ['US-Taiwan', { home_country: 'US', exposure_country: 'Taiwan', UNAlign: 0.8, TreatyAlign: 0.7, EconDepend: 0.5 }]
    ]);
    
    const result = calculateCompanyCOGRI(company, shocks, alignments);
    
    // Verify intermediate steps
    expect(result.intermediateSteps.W_c['China']).toBeCloseTo(0.3, 2);
    expect(result.intermediateSteps.AdjS['China']).toBeCloseTo(61.2, 1);
    
    // Verify final CO-GRI
    expect(result.CO_GRI).toBeGreaterThan(0);
    expect(result.CO_GRI).toBeLessThan(100);
  });
});
```

## 5.3 Common Pitfalls & Corrections

### ❌ WRONG: Modifying Exposure Weights with W^c
```typescript
// INCORRECT IMPLEMENTATION
function calculateWrong(W_norm: number, W_c: number, S_c: number): number {
  const adjustedWeight = W_norm * (1 - 0.5 * W_c);  // ❌ WRONG
  return adjustedWeight * S_c;
}
```

### ✅ CORRECT: Modifying Shock with W^c
```typescript
// CORRECT IMPLEMENTATION
function calculateCorrect(W_norm: number, W_c: number, S_c: number): number {
  const adjustedShock = S_c * (1 - 0.5 * W_c);  // ✅ CORRECT
  return W_norm * adjustedShock;
}
```

### ❌ WRONG: Applying Sector Multiplier Before Aggregation
```typescript
// INCORRECT
function calculateWrong(countryRisks: number[], M_sector: number): number {
  return countryRisks.map(r => r * M_sector).reduce((a, b) => a + b, 0);  // ❌ WRONG
}
```

### ✅ CORRECT: Applying Sector Multiplier After Aggregation
```typescript
// CORRECT
function calculateCorrect(countryRisks: number[], M_sector: number): number {
  const sum = countryRisks.reduce((a, b) => a + b, 0);
  return sum * M_sector;  // ✅ CORRECT
}
```

---

# PART 6: IMPLEMENTATION ROADMAP

## 6.1 Phase 2: Company Mode (Weeks 1-5)

### Week 1: Foundation
- [ ] Set up global state management (Zustand/Redux)
- [ ] Implement top bar navigation
- [ ] Create mode routing structure
- [ ] Implement CO-GRI pipeline with unit tests
- [ ] Create mock data generators

**Deliverables**:
- Working navigation shell
- Validated CO-GRI calculation engine
- Test fixtures for all data types

### Week 2: Core Components (C1, C2, C3)
- [ ] C1: Company Summary Panel
- [ ] C2: CO-GRI Trend Chart
- [ ] C3: Risk Contribution Map (world map + list)
- [ ] Implement risk level thresholds
- [ ] Implement trend direction logic

**Deliverables**:
- Three core components rendering with mock data
- Interactive map with country highlighting

### Week 3: Supporting Components (C4, C5, C6)
- [ ] C4: Exposure Pathways (channel breakdown)
- [ ] C5: Top Relevant Risks (structural drivers)
- [ ] C6: Peer Comparison table
- [ ] Implement concentration metric (HHI)

**Deliverables**:
- Six components integrated in layout
- Channel attribution calculations working

### Week 4: Bottom Row (C7, C8, C9)
- [ ] C7: Risk Attribution (bar chart + table)
- [ ] C8: Timeline / Event Feed
- [ ] C9: Verification Drawer (collapsed)
- [ ] Implement 3-column + bottom row layout
- [ ] Add lens badges to all components

**Deliverables**:
- Complete Company Mode Structural tab
- All 9 components functional

### Week 5: Integration & Polish
- [ ] Cross-component interactions (map click → drill-down)
- [ ] Export functionality (PDF/Excel)
- [ ] Performance optimization
- [ ] User testing with institutional users
- [ ] Bug fixes

**Deliverables**:
- Production-ready Company Mode Structural tab
- User feedback incorporated

## 6.2 Phase 3: Forecast & Scenario Integration (Weeks 6-10)

### Week 6: Forecast Mode - Strategic Overview
- [ ] F1: Forecast Header
- [ ] F2: Executive Summary Cards
- [ ] F3: Forecast Timeline Events
- [ ] F4: Asset Class Implications
- [ ] F5: Regional Assessment
- [ ] F6: Strategic Recommendations

**Deliverables**:
- Forecast Mode Strategic Overview functional

### Week 7: Forecast Mode - Company Impact
- [ ] Implement relevance filtering logic
- [ ] Implement expected-path delta application (with guardrails)
- [ ] Company/Portfolio forecast view
- [ ] Validation: no exposure redistribution

**Deliverables**:
- Forecast Impact on Company view functional
- Guardrails validated

### Week 8: Company Mode - Forecast Overlay Tab
- [ ] Integrate Forecast engine outputs
- [ ] C5: Relevant Forecast Drivers (filtered)
- [ ] C4: Channel Impact Assessment
- [ ] C1: Forecast Overlay fields
- [ ] Ensure lens badges everywhere

**Deliverables**:
- Company Mode Forecast Overlay tab complete
- Integration with Forecast Mode validated

### Week 9: Scenario Mode - Builder & Results
- [ ] S1: Scenario Builder (event inputs)
- [ ] S2: Scenario Impact Summary
- [ ] S3: Channel Attribution
- [ ] S4: Node Attribution
- [ ] Implement scenario engine

**Deliverables**:
- Scenario Mode functional (without transmission trace)

### Week 10: Scenario Mode - Transmission & Integration
- [ ] S5: Transmission Trace (event → countries → channels → company)
- [ ] Company Mode - Scenario Shock tab
- [ ] Deep linking (Company → Scenario prefill)
- [ ] Scenario comparison view

**Deliverables**:
- Complete Scenario Mode
- Company Scenario integration

## 6.3 Phase 3: Trading Mode (Weeks 11-13)

### Week 11: Core Trading Components
- [ ] T1: Recommendation Engine
- [ ] T2: Performance & Phase Comparison
- [ ] Data status monitor
- [ ] Integrate with existing Trading Signal Service

**Deliverables**:
- Core trading functionality

### Week 12: Analytics Suite
- [ ] Regime analysis
- [ ] Sensitivity analysis
- [ ] Monte Carlo simulations
- [ ] Integrate existing charts (equity curve, Sharpe, etc.)

**Deliverables**:
- Full analytics dashboard

### Week 13: ML & Validation
- [ ] ML analytics dashboard
- [ ] Walk-forward validation
- [ ] Company Mode Trading Summary Card
- [ ] Deep linking (Company → Trading)

**Deliverables**:
- Complete Trading Mode
- Company Trading integration

## 6.4 Final Polish (Weeks 14-15)

### Week 14: Cross-Mode Integration
- [ ] Validate all deep links
- [ ] Export templates for all modes
- [ ] Performance optimization
- [ ] Security audit

**Deliverables**:
- Fully integrated platform

### Week 15: Testing & Documentation
- [ ] Visual regression testing
- [ ] User acceptance testing
- [ ] Documentation (user guide + API docs)
- [ ] Deployment preparation

**Deliverables**:
- Production-ready platform
- Complete documentation

---

# PART 7: TECHNICAL STACK & DEPENDENCIES

## 7.1 Current Stack (From Project)
- **TypeScript**: Type safety and maintainability
- **React**: Frontend library
- **Recharts**: Charts and visualizations
- **Tailwind CSS**: Styling
- **Vitest**: Testing framework
- **Node.js**: Runtime environment

## 7.2 Recommended Additions

### State Management
```bash
pnpm add zustand
# or
pnpm add @reduxjs/toolkit react-redux
```

### Data Fetching & Caching
```bash
pnpm add @tanstack/react-query
```

### Advanced Visualizations
```bash
pnpm add d3 @types/d3
pnpm add react-simple-maps  # For world map
```

### Testing
```bash
pnpm add -D @playwright/test  # E2E testing
pnpm add -D @testing-library/react @testing-library/jest-dom
```

### Export Functionality
```bash
pnpm add jspdf jspdf-autotable  # Already in project
pnpm add xlsx  # For Excel export
```

## 7.3 Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── LensBadge.tsx
│   │   ├── RiskLevelBadge.tsx
│   │   └── TrendIndicator.tsx
│   ├── company/
│   │   ├── CompanySummaryPanel.tsx          # C1
│   │   ├── COGRITrendChart.tsx              # C2
│   │   ├── RiskContributionMap.tsx          # C3
│   │   ├── ExposurePathways.tsx             # C4
│   │   ├── TopRelevantRisks.tsx             # C5
│   │   ├── PeerComparison.tsx               # C6
│   │   ├── RiskAttribution.tsx              # C7
│   │   ├── TimelineEventFeed.tsx            # C8
│   │   └── VerificationDrawer.tsx           # C9
│   ├── forecast/
│   │   ├── ForecastHeader.tsx               # F1
│   │   ├── ExecutiveSummary.tsx             # F2
│   │   ├── ForecastTimeline.tsx             # F3
│   │   ├── AssetClassImplications.tsx       # F4
│   │   ├── RegionalAssessment.tsx           # F5
│   │   └── StrategicRecommendations.tsx     # F6
│   ├── scenario/
│   │   ├── ScenarioBuilder.tsx              # S1
│   │   ├── ScenarioImpactSummary.tsx        # S2
│   │   ├── ChannelAttribution.tsx           # S3
│   │   ├── NodeAttribution.tsx              # S4
│   │   └── TransmissionTrace.tsx            # S5
│   └── trading/
│       └── [Existing trading components]
├── pages/
│   ├── CountryMode.tsx
│   ├── CompanyMode.tsx
│   ├── ForecastMode.tsx
│   ├── ScenarioMode.tsx
│   └── TradingMode.tsx
├── services/
│   ├── engines/
│   │   ├── CSIEngine.ts                     # Engine A
│   │   ├── COGRIEngine.ts                   # Engine B
│   │   ├── ForecastEngine.ts                # Engine C
│   │   ├── ScenarioEngine.ts                # Engine D
│   │   └── TradingEngine.ts                 # Engine E
│   ├── calculations/
│   │   ├── cogriPipeline.ts                 # Part 5 implementation
│   │   ├── alignmentModifier.ts
│   │   ├── channelAttribution.ts
│   │   └── riskAggregation.ts
│   └── api/
│       ├── companyData.ts
│       ├── countryShocks.ts
│       └── alignmentData.ts
├── store/
│   ├── globalState.ts                       # Zustand store
│   ├── companySlice.ts
│   ├── forecastSlice.ts
│   └── scenarioSlice.ts
├── types/
│   ├── company.ts
│   ├── country.ts
│   ├── forecast.ts
│   ├── scenario.ts
│   └── trading.ts
├── utils/
│   ├── riskThresholds.ts
│   ├── trendClassification.ts
│   └── exportHelpers.ts
└── tests/
    ├── unit/
    │   ├── cogriPipeline.test.ts
    │   ├── alignmentModifier.test.ts
    │   └── channelAttribution.test.ts
    ├── integration/
    │   ├── companyMode.test.ts
    │   └── crossMode.test.ts
    └── e2e/
        └── fullWorkflow.spec.ts
```

---

# PART 8: CRITICAL IMPLEMENTATION GUARDRAILS

## 8.1 Mathematical Integrity

### ✅ MUST DO
1. **W^c modifies shock S_c, NOT exposure weights**
   - Implementation: `AdjS_c = S_c * (1 - λ * W_c)`
   - Validation: Unit test with known inputs/outputs

2. **Sector multiplier applied ONLY at final aggregation**
   - Implementation: `CO_GRI = (Σ Risk_{i,c}) * M_sector`
   - Validation: Test that multiplying before aggregation fails

3. **Exposures must be normalized before applying adjusted shock**
   - Implementation: `Σ W_norm = 1.0`
   - Validation: Assert sum equals 1.0 within tolerance

### ❌ MUST NOT DO
1. Never modify exposure weights with alignment modifier
2. Never apply sector multiplier to individual country risks
3. Never skip normalization step

## 8.2 Data Integrity

### ✅ MUST DO
1. **Forecast baseline never redistributes exposures**
   - Implementation: Check `company.exposures[country]` exists before applying delta
   - Validation: Pre/post exposure matrix comparison

2. **Forecast baseline never creates new exposures**
   - Implementation: Only iterate over existing exposure keys
   - Validation: Assert `Object.keys(exposures_before) === Object.keys(exposures_after)`

3. **Relevance filtering for forecast events**
   - Implementation: Filter events by exposure threshold (>5%) and impact threshold (|ΔCO-GRI| > 2)
   - Validation: Test that irrelevant events are filtered out

### ❌ MUST NOT DO
1. Never add new countries to exposure map in forecast mode
2. Never change exposure weights in forecast mode
3. Never show unfiltered forecast events in Company Mode

## 8.3 UI/UX Integrity

### ✅ MUST DO
1. **Every panel displays lens badge**
   - Implementation: Wrap components with `<LensBadge lens={activeLens} />`
   - Validation: Visual regression test

2. **Verification drawer collapsed by default**
   - Implementation: `<Collapsible defaultOpen={false}>`
   - Validation: Test that drawer is not visible on initial render

3. **Export clearly labels active mode + lens**
   - Implementation: Include mode and lens in export header
   - Validation: Test export output contains correct labels

### ❌ MUST NOT DO
1. Never show forecast data without "Forecast Overlay" badge
2. Never show scenario data without "Scenario Shock" badge
3. Never expose verification data in default view

## 8.4 Export Integrity

### ✅ MUST DO
1. **All exports state active mode + lens**
   - Example: "Company Mode - Forecast Overlay - Apple Inc. (AAPL) - 2026-02-28"

2. **Forecast exports are presentation-ready**
   - Include executive summary, key findings, recommendations
   - Use institutional language

3. **Include data provenance**
   - Data sources, last updated timestamps, coverage metrics

---

# PART 9: SUCCESS METRICS

## 9.1 Technical Metrics

### Code Quality
- [ ] Test coverage >85% for core calculation logic
- [ ] Zero critical bugs in CO-GRI pipeline
- [ ] Performance: <200ms interaction latency
- [ ] Accessibility: WCAG 2.1 AA compliance

### Data Quality
- [ ] CO-GRI pipeline accuracy: 100% match with reference implementation
- [ ] Forecast exposure integrity: 0 violations of redistribution guardrail
- [ ] Alignment modifier validation: All test cases pass

## 9.2 User Metrics

### Adoption
- [ ] >60% of users export at least once
- [ ] >40% of sessions use 2+ modes
- [ ] <5% lens confusion rate (measured via user testing)

### Satisfaction
- [ ] >80% user satisfaction score
- [ ] <10% support ticket rate for calculation questions
- [ ] >70% of users understand lens distinction (Structural vs Forecast vs Scenario)

---

# APPENDICES

## Appendix A: Glossary

- **CO-GRI**: Company Geopolitical Risk Index
- **CSI**: Country Shock Index
- **W^R, W^S, W^P, W^F**: Exposure weights for Revenue, Supply chain, Physical assets, Financial
- **W_geo**: Geographic exposure (blended from four channels)
- **W_norm**: Normalized geographic exposure (sum = 1)
- **W^c**: Alignment modifier (political alignment between home and exposure country)
- **S_c**: Country shock score (CSI)
- **AdjS_c**: Adjusted country shock (after applying alignment modifier)
- **Risk_{i,c}**: Country c's contribution to company i's risk
- **M_sector**: Sector multiplier
- **HHI**: Herfindahl-Hirschman Index (concentration metric)
- **λ (lambda)**: Alignment sensitivity parameter (default 0.50)

## Appendix B: Reference Calculations

### B.1 Example: Apple Inc. CO-GRI Calculation

**Input Data**:
```typescript
const apple: CompanyExposure = {
  company_id: 'AAPL',
  ticker: 'AAPL',
  home_country: 'US',
  sector: 'Technology',
  exposures: {
    'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
    'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 },
    'Vietnam': { W_R: 0.03, W_S: 0.15, W_P: 0.01, W_F: 0.00 },
    'Japan': { W_R: 0.08, W_S: 0.05, W_P: 0.02, W_F: 0.01 },
    'S. Korea': { W_R: 0.04, W_S: 0.08, W_P: 0.01, W_F: 0.00 }
  },
  M_sector: 1.2  // Semiconductors
};

const shocks = {
  'China': 72,
  'Taiwan': 68,
  'Vietnam': 45,
  'Japan': 32,
  'S. Korea': 38
};

const alignments = {
  'US-China': { UNAlign: 0.2, TreatyAlign: 0.1, EconDepend: 0.6 },  // W^c = 0.3
  'US-Taiwan': { UNAlign: 0.8, TreatyAlign: 0.7, EconDepend: 0.5 }, // W^c = 0.67
  'US-Vietnam': { UNAlign: 0.6, TreatyAlign: 0.5, EconDepend: 0.4 }, // W^c = 0.5
  'US-Japan': { UNAlign: 0.9, TreatyAlign: 0.9, EconDepend: 0.7 },  // W^c = 0.83
  'US-S. Korea': { UNAlign: 0.85, TreatyAlign: 0.85, EconDepend: 0.6 } // W^c = 0.77
};
```

**Step-by-Step Calculation**:

1. **Blend exposures** (China example):
   ```
   W_geo_china = 0.35*0.18 + 0.30*0.65 + 0.20*0.05 + 0.10*0.02
               = 0.063 + 0.195 + 0.010 + 0.002
               = 0.270
   ```

2. **Normalize exposures**:
   ```
   Sum W_geo = 0.270 + 0.120 + 0.080 + 0.060 + 0.050 = 0.580
   W_norm_china = 0.270 / 0.580 = 0.466
   ```

3. **Adjust shocks** (China example):
   ```
   W^c_china = 0.3
   AdjS_china = 72 * (1 - 0.5 * 0.3) = 72 * 0.85 = 61.2
   ```

4. **Calculate country risks**:
   ```
   Risk_china = 0.466 * 61.2 = 28.5
   ```

5. **Aggregate + sector multiplier**:
   ```
   CO_GRI = (28.5 + 14.1 + 7.2 + 5.3 + 3.7) * 1.2 = 58.8 * 1.2 = 70.6
   ```

**Result**: Apple's CO-GRI = 70.6 (Elevated risk, approaching High)

## Appendix C: API Schemas

### C.1 Company Data API
```typescript
GET /api/companies/{ticker}

Response:
{
  "company_id": "AAPL",
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "home_country": "US",
  "sector": "Technology",
  "M_sector": 1.2,
  "exposures": {
    "China": {
      "W_R": 0.18,
      "W_S": 0.65,
      "W_P": 0.05,
      "W_F": 0.02
    },
    ...
  },
  "last_updated": "2026-02-28T00:00:00Z"
}
```

### C.2 Country Shock API
```typescript
GET /api/country-shocks?countries=China,Taiwan&date=2026-02-28

Response:
{
  "shocks": [
    {
      "country": "China",
      "date": "2026-02-28",
      "S_c": 72,
      "vectors": {
        "political": 78,
        "economic": 65,
        "social": 70,
        "military": 82,
        "environmental": 55
      },
      "drivers": [
        {
          "event": "Trade restrictions escalation",
          "impact": 8,
          "date": "2026-02-15"
        }
      ]
    },
    ...
  ]
}
```

### C.3 Alignment Data API
```typescript
GET /api/alignments?home=US&exposure=China

Response:
{
  "home_country": "US",
  "exposure_country": "China",
  "UNAlign": 0.2,
  "TreatyAlign": 0.1,
  "EconDepend": 0.6,
  "W_c": 0.3,
  "last_updated": "2026-01-01T00:00:00Z"
}
```

---

# CONCLUSION

This technical specification provides a complete, authoritative guide for implementing Phase 2 and 3 of the CO-GRI platform. The specification follows the exact priority order requested and includes:

1. ✅ **Unified Dashboard Specification v2.0** - Complete functional requirements
2. ✅ **Platform Architecture Diagram** - Mode separation and engine routing
3. ✅ **Company Mode Implementation Spec** - All 9 components with calculations
4. ✅ **Visual Dashboard Mockups** - Layout and UX reference
5. ✅ **CO-GRI Pipeline Correction** - Authoritative mathematical reference with validation

**Key Takeaways**:
- W^c modifies shock S_c, NOT exposure weights
- Forecast baseline never redistributes exposures
- Every panel must display its lens badge
- Verification drawer collapsed by default
- 15-week implementation timeline

**Next Steps**:
1. Review this specification with stakeholders
2. Set up development environment
3. Begin Week 1: Foundation (global state + CO-GRI pipeline)
4. Schedule user testing after Week 5 (Company Mode Structural tab)

This document serves as the single source of truth for the implementation. All development decisions should reference this specification.
