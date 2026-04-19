# Scenario Mode Design Specification
**Version:** 1.0  
**Date:** 2026-03-01  
**Status:** Design Phase  
**Owner:** Bob (Architect)

---

## Executive Summary

Scenario Mode (Mode 4) is a user-defined event stress testing workspace that enables institutional investors to model "what-if" scenarios and assess their impact on company geopolitical risk profiles. This document provides comprehensive design specifications for implementing Scenario Mode, including 5 core components, data architecture, integration strategy, and a 4-week implementation timeline.

**Key Features:**
- Interactive scenario builder for custom geopolitical events
- Real-time ΔCO-GRI calculation and visualization
- Multi-channel attribution analysis (Revenue, Supply Chain, Physical Assets, Financial)
- Country-level node attribution with transmission trace
- Deep integration with Company Mode for seamless workflow
- Scenario comparison and portfolio-level stress testing

---

## Table of Contents

1. [Component Specifications](#1-component-specifications)
2. [Wireframes & Layout](#2-wireframes--layout)
3. [Data Architecture](#3-data-architecture)
4. [Integration Strategy](#4-integration-strategy)
5. [Implementation Timeline](#5-implementation-timeline)
6. [Testing Strategy](#6-testing-strategy)
7. [Risk Assessment](#7-risk-assessment)

---

## 1. Component Specifications

### S1: Scenario Builder (User Input Interface)

**Purpose:** Enable users to define custom geopolitical events with precise parameters.

**Location:** Left panel (30% width) in Scenario Mode layout

**Key Features:**
- Event name and description input
- Country/region selector (multi-select with search)
- Event type categorization (Political, Economic, Military, Social, Environmental)
- Severity slider (0-100 scale)
- Probability input (0-100%)
- Timing/duration selector (immediate, 3-6 months, 6-12 months, custom)
- Channel impact weights (Revenue, Supply Chain, Physical Assets, Financial)
- Save/load scenario templates
- Scenario comparison mode toggle

**Component Interface:**
```typescript
interface ScenarioBuilderProps {
  onScenarioCreate: (scenario: ScenarioInput) => void;
  onScenarioUpdate: (scenario: ScenarioInput) => void;
  savedScenarios?: ScenarioTemplate[];
  companyContext?: {
    ticker: string;
    topExposures: string[];
  };
}

interface ScenarioInput {
  id: string;
  name: string;
  description: string;
  affectedCountries: string[];
  eventType: 'Political' | 'Economic' | 'Military' | 'Social' | 'Environmental';
  severity: number; // 0-100
  probability: number; // 0-100
  timing: {
    type: 'immediate' | '3-6months' | '6-12months' | 'custom';
    customDate?: Date;
  };
  channelImpacts: {
    revenue: number; // -100 to +100
    supplyChain: number;
    physicalAssets: number;
    financial: number;
  };
  vectorBreakdown?: {
    political: number;
    economic: number;
    social: number;
    military: number;
    environmental: number;
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    version: number;
  };
}
```

**User Interactions:**
1. **Quick Start Templates:** Pre-configured scenarios (e.g., "Taiwan Strait Conflict", "US-China Decoupling", "Middle East Oil Shock")
2. **Company-Aware Suggestions:** When accessed from Company Mode, pre-populate with top exposure countries
3. **Validation:** Real-time validation of inputs with helpful error messages
4. **Preview:** Show estimated ΔCO-GRI before running full calculation
5. **Batch Mode:** Create multiple scenarios for comparison

**Validation Rules:**
- At least 1 country must be selected
- Severity must be 0-100
- Probability must be 0-100
- At least one channel impact must be non-zero
- Event name must be unique within user's saved scenarios

---

### S2: Scenario Impact Summary (ΔCO-GRI Display)

**Purpose:** Display high-level impact metrics and risk assessment.

**Location:** Top-right panel (70% width, 40% height) in Scenario Mode layout

**Key Features:**
- Large ΔCO-GRI display with directional indicator (↑↓)
- Baseline CO-GRI vs Scenario CO-GRI comparison
- Risk level change indicator (e.g., "Elevated → High")
- Confidence score based on data quality
- Executive summary in natural language
- Quick action buttons (Export, Share, Apply to Portfolio)

**Component Interface:**
```typescript
interface ScenarioImpactSummaryProps {
  baselineCOGRI: number;
  scenarioCOGRI: number;
  deltaCOGRI: number;
  baselineRiskLevel: RiskLevel;
  scenarioRiskLevel: RiskLevel;
  confidence: number; // 0-1
  executiveSummary: string;
  companyName: string;
  ticker: string;
  scenarioName: string;
}

interface ScenarioResult {
  scenarioId: string;
  companyId: string;
  ticker: string;
  
  // Core metrics
  baselineCOGRI: number;
  scenarioCOGRI: number;
  deltaCOGRI: number;
  deltaPercentage: number;
  
  // Risk levels
  baselineRiskLevel: RiskLevel;
  scenarioRiskLevel: RiskLevel;
  riskLevelChange: 'Upgrade' | 'Downgrade' | 'Stable';
  
  // Confidence & quality
  confidence: number; // 0-1
  dataQuality: {
    exposureCoverage: number;
    shockDataFreshness: Date;
    alignmentCoverage: number;
  };
  
  // Attribution
  channelAttribution: ChannelDelta[];
  nodeAttribution: NodeDelta[];
  transmissionTrace: TransmissionTrace;
  
  // Metadata
  calculatedAt: Date;
  calculationTime: number; // milliseconds
}
```

**Display Elements:**
```
┌─────────────────────────────────────────────────────────┐
│ Scenario Impact Summary                    [Lens Badge] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Baseline CO-GRI: 62.4 (Elevated)                      │
│  Scenario CO-GRI: 78.9 (High)                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         ΔCO-GRI: +16.5 ↑ (+26.4%)               │  │
│  │         Risk Level: Elevated → High              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Confidence: 85% ████████░░                            │
│                                                         │
│  Executive Summary:                                     │
│  "Taiwan Strait military escalation scenario would     │
│   significantly increase Apple's geopolitical risk,    │
│   primarily through supply chain disruption (+12.3)    │
│   and physical asset exposure (+4.2). China and        │
│   Taiwan account for 89% of the total impact."        │
│                                                         │
│  [Export PDF] [Share] [Apply to Portfolio]            │
└─────────────────────────────────────────────────────────┘
```

---

### S3: Channel Attribution (Δ by Channel)

**Purpose:** Show how scenario impacts each operational channel.

**Location:** Middle-right panel (70% width, 30% height) in Scenario Mode layout

**Key Features:**
- Side-by-side comparison: Baseline vs Scenario for each channel
- Horizontal bar chart showing Δ by channel
- Percentage change indicators
- Dominant channel highlighting
- Drill-down to country-level breakdown per channel

**Component Interface:**
```typescript
interface ChannelAttributionProps {
  channelDeltas: ChannelDelta[];
  totalDelta: number;
  onChannelDrillDown?: (channel: string) => void;
}

interface ChannelDelta {
  channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  baselineRisk: number;
  scenarioRisk: number;
  delta: number;
  deltaPercentage: number;
  contribution: number; // % of total ΔCO-GRI
  topAffectedCountries: Array<{
    country: string;
    delta: number;
  }>;
}
```

**Visualization:**
```
┌─────────────────────────────────────────────────────────┐
│ Channel Attribution                        [Lens Badge] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Supply Chain    ████████████████████ +12.3 (74.5%)   │
│  Baseline: 28.5  Scenario: 40.8  Δ: +12.3             │
│  Top: China (+8.2), Taiwan (+3.1), Vietnam (+1.0)     │
│                                                         │
│  Physical Assets ████████ +4.2 (25.5%)                 │
│  Baseline: 12.1  Scenario: 16.3  Δ: +4.2              │
│  Top: Taiwan (+2.8), China (+1.4)                      │
│                                                         │
│  Revenue         ██ +0.8 (4.8%)                        │
│  Baseline: 18.3  Scenario: 19.1  Δ: +0.8              │
│  Top: China (+0.5), Taiwan (+0.3)                      │
│                                                         │
│  Financial       ░ -0.8 (-4.8%)                        │
│  Baseline: 3.5   Scenario: 2.7   Δ: -0.8              │
│  Top: Hong Kong (-0.5), Singapore (-0.3)               │
│                                                         │
│  Total ΔCO-GRI: +16.5                                  │
└─────────────────────────────────────────────────────────┘
```

---

### S4: Node Attribution (Top 10 Impacted Countries)

**Purpose:** Identify which countries drive the scenario impact.

**Location:** Bottom-right panel (70% width, 30% height) in Scenario Mode layout

**Key Features:**
- Ranked list of top 10 countries by Δ contribution
- Baseline vs Scenario comparison per country
- Dominant channel indicator per country
- Geographic heatmap overlay (optional toggle)
- Click to expand transmission trace

**Component Interface:**
```typescript
interface NodeAttributionProps {
  nodeDeltas: NodeDelta[];
  totalDelta: number;
  onNodeClick?: (country: string) => void;
  showMap?: boolean;
}

interface NodeDelta {
  country: string;
  baselineRisk: number;
  scenarioRisk: number;
  delta: number;
  deltaPercentage: number;
  contribution: number; // % of total ΔCO-GRI
  dominantChannel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  channelBreakdown: {
    revenue: number;
    supplyChain: number;
    physicalAssets: number;
    financial: number;
  };
  baselineShock: number; // S_c
  scenarioShock: number; // S_c + event impact
  shockDelta: number;
}
```

**Visualization:**
```
┌─────────────────────────────────────────────────────────┐
│ Node Attribution (Top 10 Countries)       [Lens Badge] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Rank | Country  | Baseline | Scenario | Δ     | %    │
│  ─────┼──────────┼──────────┼──────────┼───────┼───── │
│   1   │ China    │   28.5   │   36.7   │ +8.2  │ 49.7%│
│       │ [Supply Chain] ████████████████████████████    │
│                                                         │
│   2   │ Taiwan   │   14.6   │   20.7   │ +6.1  │ 37.0%│
│       │ [Supply Chain] ████████████████████            │
│                                                         │
│   3   │ Vietnam  │    7.3   │    8.3   │ +1.0  │  6.1%│
│       │ [Supply Chain] ███                             │
│                                                         │
│   4   │ Japan    │    5.4   │    6.2   │ +0.8  │  4.8%│
│       │ [Revenue] ██                                   │
│                                                         │
│   5   │ S. Korea │    3.6   │    4.0   │ +0.4  │  2.4%│
│       │ [Supply Chain] █                               │
│                                                         │
│  [Show Remaining 5] [View on Map] [Export Table]      │
└─────────────────────────────────────────────────────────┘
```

---

### S5: Transmission Trace (Event → Countries → Channels → Company)

**Purpose:** Visualize how scenario event propagates through the system to impact company risk.

**Location:** Collapsible drawer at bottom of Scenario Mode (collapsed by default)

**Key Features:**
- Flowchart visualization: Event → Affected Countries → Channel Impacts → ΔCO-GRI
- Step-by-step calculation breakdown
- Intermediate values display (shock deltas, exposure weights, alignment modifiers)
- Mathematical formulas with actual values
- Export to PDF for audit trail

**Component Interface:**
```typescript
interface TransmissionTraceProps {
  trace: TransmissionTrace;
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface TransmissionTrace {
  scenarioId: string;
  steps: TransmissionStep[];
  calculationMetadata: {
    engine: string;
    version: string;
    timestamp: Date;
    executionTime: number;
  };
}

interface TransmissionStep {
  stepNumber: number;
  stepType: 'EventDefinition' | 'CountryShockAdjustment' | 'ExposureApplication' | 'ChannelAggregation' | 'FinalCalculation';
  description: string;
  inputs: Record<string, any>;
  calculation: string; // LaTeX or plain text formula
  outputs: Record<string, any>;
  intermediateValues?: Record<string, number>;
}
```

**Visualization:**
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Transmission Trace (Click to Expand)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: Event Definition                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Scenario: "Taiwan Strait Military Escalation"     │ │
│  │ Affected Countries: China (+15), Taiwan (+25)     │ │
│  │ Channel Weights: SC=0.8, PA=0.6, R=0.2, F=0.1    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Step 2: Country Shock Adjustment                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ China:                                             │ │
│  │   Baseline S_c = 72                               │ │
│  │   Event Impact = +15                              │ │
│  │   Scenario S_c = 87                               │ │
│  │   W^c (alignment) = 0.3                           │ │
│  │   AdjS_baseline = 72 × (1 - 0.5 × 0.3) = 61.2    │ │
│  │   AdjS_scenario = 87 × (1 - 0.5 × 0.3) = 73.95   │ │
│  │   Δ AdjS = +12.75                                 │ │
│  │                                                    │ │
│  │ Taiwan:                                            │ │
│  │   Baseline S_c = 68                               │ │
│  │   Event Impact = +25                              │ │
│  │   Scenario S_c = 93                               │ │
│  │   W^c (alignment) = 0.67                          │ │
│  │   AdjS_baseline = 68 × (1 - 0.5 × 0.67) = 45.22  │ │
│  │   AdjS_scenario = 93 × (1 - 0.5 × 0.67) = 61.86  │ │
│  │   Δ AdjS = +16.64                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Step 3: Exposure Application                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ China (W_norm = 0.466):                           │ │
│  │   Δ Risk = 0.466 × 12.75 = +5.94                 │ │
│  │                                                    │ │
│  │ Taiwan (W_norm = 0.207):                          │ │
│  │   Δ Risk = 0.207 × 16.64 = +3.44                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Step 4: Channel Aggregation                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Supply Chain: +12.3 (China +8.2, Taiwan +3.1)    │ │
│  │ Physical Assets: +4.2 (Taiwan +2.8, China +1.4)  │ │
│  │ Revenue: +0.8 (China +0.5, Taiwan +0.3)          │ │
│  │ Financial: -0.8 (risk reduction in other regions)│ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Step 5: Final Calculation                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Σ Δ Risk = 12.3 + 4.2 + 0.8 - 0.8 = 16.5         │ │
│  │ M_sector = 1.0 (no sector amplification)         │ │
│  │ Δ CO-GRI = 16.5 × 1.0 = +16.5                    │ │
│  │                                                    │ │
│  │ Baseline CO-GRI: 62.4 (Elevated)                  │ │
│  │ Scenario CO-GRI: 78.9 (High)                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [Export Trace] [Copy Calculations] [Print]           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Wireframes & Layout

### 2.1 Scenario Mode Full Layout (Desktop 1920×1080)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [CO-GRI Logo] Search: [Company ▼] Mode: [Scenario*]  Window: 30D       │
│ Export | Save | Watchlist | Settings                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ SCENARIO MODE: Stress Testing                                           │
│ Company: Apple Inc. (AAPL) • Baseline CO-GRI: 62.4 (Elevated)          │
├──────────────────────┬──────────────────────────────────────────────────┤
│                      │                                                  │
│  SCENARIO BUILDER    │  SCENARIO IMPACT SUMMARY                         │
│  (30% width)         │  (70% width, 40% height)                        │
│                      │                                                  │
│  ┌────────────────┐  │  ┌────────────────────────────────────────────┐ │
│  │ Event Name     │  │  │ Baseline: 62.4 → Scenario: 78.9           │ │
│  │ [Input]        │  │  │ ΔCO-GRI: +16.5 ↑ (+26.4%)                 │ │
│  │                │  │  │ Risk: Elevated → High                      │ │
│  │ Description    │  │  │                                            │ │
│  │ [Textarea]     │  │  │ Confidence: 85% ████████░░                │ │
│  │                │  │  │                                            │ │
│  │ Countries      │  │  │ Executive Summary: ...                     │ │
│  │ [Multi-select] │  │  │                                            │ │
│  │                │  │  │ [Export] [Share] [Apply to Portfolio]     │ │
│  │ Event Type     │  │  └────────────────────────────────────────────┘ │
│  │ [Dropdown]     │  │                                                  │
│  │                │  ├──────────────────────────────────────────────────┤
│  │ Severity       │  │  CHANNEL ATTRIBUTION                             │
│  │ [Slider 0-100] │  │  (70% width, 30% height)                        │
│  │                │  │                                                  │
│  │ Probability    │  │  ┌────────────────────────────────────────────┐ │
│  │ [Input 0-100%] │  │  │ Supply Chain  ████████████ +12.3 (74.5%)  │ │
│  │                │  │  │ Phys. Assets  ████ +4.2 (25.5%)           │ │
│  │ Timing         │  │  │ Revenue       ██ +0.8 (4.8%)              │ │
│  │ [Dropdown]     │  │  │ Financial     ░ -0.8 (-4.8%)              │ │
│  │                │  │  └────────────────────────────────────────────┘ │
│  │ Channel Impact │  │                                                  │
│  │ Revenue [±]    │  ├──────────────────────────────────────────────────┤
│  │ Supply [±]     │  │  NODE ATTRIBUTION (Top 10 Countries)             │
│  │ Assets [±]     │  │  (70% width, 30% height)                        │
│  │ Financial [±]  │  │                                                  │
│  │                │  │  ┌────────────────────────────────────────────┐ │
│  │ [Run Scenario] │  │  │ 1. China    +8.2 (49.7%) [Supply Chain]   │ │
│  │ [Save Template]│  │  │ 2. Taiwan   +6.1 (37.0%) [Supply Chain]   │ │
│  │ [Load Template]│  │  │ 3. Vietnam  +1.0 (6.1%)  [Supply Chain]   │ │
│  │ [Compare Mode] │  │  │ 4. Japan    +0.8 (4.8%)  [Revenue]        │ │
│  └────────────────┘  │  │ 5. S. Korea +0.4 (2.4%)  [Supply Chain]   │ │
│                      │  │ [Show All] [View Map] [Export]            │ │
│                      │  └────────────────────────────────────────────┘ │
├──────────────────────┴──────────────────────────────────────────────────┤
│ TRANSMISSION TRACE (Collapsed by Default)                               │
│ ▶ Click to expand calculation breakdown                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Company Mode - Scenario Shock Tab Integration

When user clicks "Scenario Shock" tab in Company Mode, show:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ COMPANY MODE: Apple Inc. (AAPL)                                         │
│ [Structural] [Forecast Overlay] [Scenario Shock*] [Trading Signal]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Active Scenario: "Taiwan Strait Military Escalation"             │ │
│  │ ΔCO-GRI: +16.5 ↑ (Elevated → High)                               │ │
│  │ [Change Scenario] [Create New] [View Full Analysis]              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [Display same 9 components as Structural tab, but with scenario data] │
│  - C1: Company Summary (with scenario CO-GRI)                          │
│  - C2: CO-GRI Trend (baseline + scenario overlay)                      │
│  - C3: Risk Contribution Map (scenario deltas highlighted)             │
│  - C4: Exposure Pathways (Δ by channel)                                │
│  - C5: Top Relevant Risks (scenario drivers)                           │
│  - C6: Peer Comparison (N/A in scenario mode)                          │
│  - C7: Risk Attribution (scenario node deltas)                         │
│  - C8: Timeline (scenario assumptions)                                 │
│  - C9: Verification Drawer (scenario calculation trace)                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Scenario Comparison View

When user activates "Compare Mode" in Scenario Builder:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO COMPARISON: Apple Inc. (AAPL)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Baseline    │  Scenario A         │  Scenario B         │  Scenario C │
│  CO-GRI:     │  "Taiwan Conflict"  │  "US-China Trade"   │  "Chip Ban" │
│  62.4        │  78.9 (+16.5)       │  71.2 (+8.8)        │  85.3 (+22.9)│
│  Elevated    │  High               │  Elevated           │  High       │
│              │                     │                     │             │
│  [Channel Attribution Comparison - Side by Side]                       │
│  [Node Attribution Comparison - Side by Side]                          │
│  [Export Comparison Report]                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Responsive Layout (Tablet 768×1024)

```
┌─────────────────────────────────────────┐
│ [CO-GRI] Mode: [Scenario*]              │
├─────────────────────────────────────────┤
│ SCENARIO BUILDER (Full Width)           │
│ ┌─────────────────────────────────────┐ │
│ │ [All inputs stacked vertically]     │ │
│ │ [Run Scenario Button]               │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ IMPACT SUMMARY (Full Width)             │
│ ┌─────────────────────────────────────┐ │
│ │ ΔCO-GRI: +16.5 ↑                    │ │
│ │ Baseline: 62.4 → Scenario: 78.9     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ CHANNEL ATTRIBUTION (Full Width)        │
│ ┌─────────────────────────────────────┐ │
│ │ [Horizontal bars]                   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ NODE ATTRIBUTION (Full Width)           │
│ ┌─────────────────────────────────────┐ │
│ │ [Table with scroll]                 │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ▶ TRANSMISSION TRACE (Collapsed)        │
└─────────────────────────────────────────┘
```

### 2.5 Color Scheme & Visual Design

**Primary Colors:**
- **Scenario Shock Orange:** `#F97316` (lens badge, accent color)
- **Increase (Positive Delta):** `#EF4444` (red)
- **Decrease (Negative Delta):** `#10B981` (green)
- **Neutral:** `#6B7280` (gray)

**Component Styling:**
- All components must display orange "Scenario Shock" lens badge in top-right corner
- Use consistent card design with rounded corners (12px) and subtle shadows
- Hover states: Lift 4px with increased shadow
- Interactive elements: Clear focus states with orange outline
- Validation errors: Red border with error message below input

**Typography:**
- Headings: Plus Jakarta Sans, font-weight 700
- Body: Plus Jakarta Sans, font-weight 400
- Numbers/Metrics: Plus Jakarta Sans, font-weight 600 (for emphasis)

---

## 3. Data Architecture

### 3.1 State Management (Zustand Slice)

Create new Zustand slice for Scenario Mode state:

```typescript
// src/store/scenarioSlice.ts

interface ScenarioState {
  // Active scenario
  activeScenario: ScenarioInput | null;
  scenarioResult: ScenarioResult | null;
  
  // Saved scenarios
  savedScenarios: ScenarioTemplate[];
  
  // Comparison mode
  comparisonMode: boolean;
  comparedScenarios: ScenarioResult[];
  
  // UI state
  isCalculating: boolean;
  calculationProgress: number; // 0-100
  error: string | null;
  transmissionTraceExpanded: boolean;
  
  // Actions
  setActiveScenario: (scenario: ScenarioInput) => void;
  runScenario: (scenario: ScenarioInput, companyId: string) => Promise<void>;
  saveScenario: (scenario: ScenarioInput) => void;
  loadScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  toggleComparisonMode: () => void;
  addToComparison: (result: ScenarioResult) => void;
  removeFromComparison: (scenarioId: string) => void;
  clearComparison: () => void;
  toggleTransmissionTrace: () => void;
  reset: () => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  activeScenario: null,
  scenarioResult: null,
  savedScenarios: [],
  comparisonMode: false,
  comparedScenarios: [],
  isCalculating: false,
  calculationProgress: 0,
  error: null,
  transmissionTraceExpanded: false,
  
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  
  runScenario: async (scenario, companyId) => {
    set({ isCalculating: true, calculationProgress: 0, error: null });
    
    try {
      // Step 1: Validate inputs (10%)
      set({ calculationProgress: 10 });
      validateScenarioInput(scenario);
      
      // Step 2: Fetch company data (30%)
      set({ calculationProgress: 30 });
      const companyData = await fetchCompanyData(companyId);
      
      // Step 3: Calculate scenario impact (60%)
      set({ calculationProgress: 60 });
      const result = await calculateScenarioImpact(scenario, companyData);
      
      // Step 4: Generate transmission trace (90%)
      set({ calculationProgress: 90 });
      const trace = generateTransmissionTrace(scenario, companyData, result);
      result.transmissionTrace = trace;
      
      // Step 5: Complete (100%)
      set({ 
        scenarioResult: result,
        calculationProgress: 100,
        isCalculating: false
      });
      
      // Add to comparison if in comparison mode
      if (get().comparisonMode) {
        get().addToComparison(result);
      }
      
    } catch (error) {
      set({ 
        error: error.message,
        isCalculating: false,
        calculationProgress: 0
      });
    }
  },
  
  saveScenario: (scenario) => {
    const template: ScenarioTemplate = {
      ...scenario,
      id: generateId(),
      savedAt: new Date()
    };
    set({ 
      savedScenarios: [...get().savedScenarios, template]
    });
  },
  
  loadScenario: (scenarioId) => {
    const scenario = get().savedScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      set({ activeScenario: scenario });
    }
  },
  
  deleteScenario: (scenarioId) => {
    set({
      savedScenarios: get().savedScenarios.filter(s => s.id !== scenarioId)
    });
  },
  
  toggleComparisonMode: () => {
    set({ comparisonMode: !get().comparisonMode });
  },
  
  addToComparison: (result) => {
    const compared = get().comparedScenarios;
    if (compared.length < 4) { // Max 4 scenarios
      set({ comparedScenarios: [...compared, result] });
    }
  },
  
  removeFromComparison: (scenarioId) => {
    set({
      comparedScenarios: get().comparedScenarios.filter(
        r => r.scenarioId !== scenarioId
      )
    });
  },
  
  clearComparison: () => {
    set({ comparedScenarios: [] });
  },
  
  toggleTransmissionTrace: () => {
    set({ transmissionTraceExpanded: !get().transmissionTraceExpanded });
  },
  
  reset: () => {
    set({
      activeScenario: null,
      scenarioResult: null,
      isCalculating: false,
      calculationProgress: 0,
      error: null,
      transmissionTraceExpanded: false
    });
  }
}));
```

### 3.2 API Contracts

**Scenario Calculation API:**

```typescript
// POST /api/scenarios/calculate
interface CalculateScenarioRequest {
  scenario: ScenarioInput;
  companyId: string;
  ticker: string;
  includeTrace: boolean; // Whether to generate transmission trace
}

interface CalculateScenarioResponse {
  result: ScenarioResult;
  trace?: TransmissionTrace;
  metadata: {
    calculationTime: number;
    engineVersion: string;
    timestamp: Date;
  };
}
```

**Scenario Template API:**

```typescript
// GET /api/scenarios/templates
interface GetTemplatesResponse {
  templates: ScenarioTemplate[];
  categories: string[];
}

// POST /api/scenarios/templates
interface SaveTemplateRequest {
  template: ScenarioTemplate;
}

// DELETE /api/scenarios/templates/:id
interface DeleteTemplateRequest {
  templateId: string;
}
```

**Portfolio Stress Test API:**

```typescript
// POST /api/scenarios/portfolio-stress-test
interface PortfolioStressTestRequest {
  scenario: ScenarioInput;
  portfolioId: string;
  companies: string[]; // Array of tickers
}

interface PortfolioStressTestResponse {
  portfolioResults: Array<{
    ticker: string;
    companyName: string;
    result: ScenarioResult;
  }>;
  aggregateMetrics: {
    totalDeltaCOGRI: number;
    averageDeltaCOGRI: number;
    maxDeltaCOGRI: number;
    minDeltaCOGRI: number;
    riskLevelDistribution: Record<RiskLevel, number>;
  };
}
```

### 3.3 Data Structures (TypeScript Interfaces)

All core interfaces defined in section 1 (Component Specifications). Additional supporting interfaces:

```typescript
// src/types/scenario.ts

export interface ScenarioTemplate extends ScenarioInput {
  id: string;
  category: 'Political' | 'Economic' | 'Military' | 'Social' | 'Environmental' | 'Custom';
  isPublic: boolean;
  usageCount: number;
  savedAt: Date;
  tags: string[];
}

export interface ScenarioComparisonMetrics {
  scenarios: ScenarioResult[];
  correlationMatrix: number[][]; // Correlation between scenarios
  dominantScenario: string; // Scenario ID with highest impact
  averageDelta: number;
  maxDelta: number;
  minDelta: number;
}

export interface ScenarioValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}
```

### 3.4 Caching Strategy

**Local Storage:**
- Save user's scenario templates to localStorage
- Cache last 5 scenario results for quick access
- Store user preferences (default channels, favorite templates)

**In-Memory Cache:**
- Cache company exposure data for 5 minutes
- Cache country shock data for 1 minute
- Cache scenario calculation results for session duration

**Cache Invalidation:**
- Clear cache when user switches companies
- Clear cache when underlying data is updated
- Provide manual "Refresh Data" button

### 3.5 Error Handling

**Validation Errors:**
```typescript
class ScenarioValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value: any
  ) {
    super(`Validation error in ${field}: ${message}`);
  }
}
```

**Calculation Errors:**
```typescript
class ScenarioCalculationError extends Error {
  constructor(
    public scenarioId: string,
    public stage: string,
    public originalError: Error
  ) {
    super(`Calculation failed at ${stage}: ${originalError.message}`);
  }
}
```

**Error Recovery:**
- Retry failed API calls up to 3 times with exponential backoff
- Show user-friendly error messages with suggested actions
- Log detailed errors to console for debugging
- Provide "Report Issue" button for critical errors

---

## 4. Integration Strategy

### 4.1 Company Mode Integration

**Scenario Shock Tab (C1-C9 Components):**

When user clicks "Scenario Shock" tab in Company Mode:

1. Check if active scenario exists in scenario store
2. If yes, display all 9 components with scenario data
3. If no, show "No Active Scenario" state with "Create Scenario" button
4. Add "Change Scenario" button to switch between saved scenarios
5. Add "View Full Analysis" button to navigate to Scenario Mode

**Component Adaptations:**

```typescript
// C1: Company Summary Panel
interface CompanySummaryPanelProps {
  // ... existing props
  scenarioData?: {
    scenarioCOGRI: number;
    deltaCOGRI: number;
    scenarioRiskLevel: RiskLevel;
    scenarioName: string;
  };
}

// C2: COGRI Trend Chart
interface COGRITrendChartProps {
  // ... existing props
  scenarioOverlay?: {
    scenarioPoints: Array<{ date: string; cogriScore: number }>;
    scenarioName: string;
  };
}

// C3: Risk Contribution Map
interface RiskContributionMapProps {
  // ... existing props
  scenarioDeltas?: Array<{
    country: string;
    delta: number;
  }>;
}

// C4: Exposure Pathways
interface ExposurePathwaysProps {
  // ... existing props
  scenarioChannelDeltas?: ChannelDelta[];
}

// C5: Top Relevant Risks
interface TopRelevantRisksProps {
  // ... existing props
  scenarioDrivers?: ScenarioDriver[];
}

// C7: Risk Attribution
interface RiskAttributionProps {
  // ... existing props
  scenarioNodeDeltas?: NodeDelta[];
}

// C8: Timeline Event Feed
interface TimelineEventFeedProps {
  // ... existing props
  scenarioAssumptions?: {
    name: string;
    description: string;
    affectedCountries: string[];
  };
}

// C9: Verification Drawer
interface VerificationDrawerProps {
  // ... existing props
  scenarioTrace?: TransmissionTrace;
}
```

### 4.2 Deep Linking from Company Mode to Scenario Mode

**Use Case:** User viewing Company Mode wants to stress test a specific risk

**Implementation:**

```typescript
// In Company Mode, add "Stress Test" button to C5 (Top Relevant Risks)
const handleStressTest = (risk: GeopoliticalRisk) => {
  // Pre-populate scenario builder with risk context
  const prefillData: Partial<ScenarioInput> = {
    name: `Stress Test: ${risk.title}`,
    description: risk.description,
    affectedCountries: risk.affectedCountries,
    eventType: risk.eventType,
    severity: risk.impact,
    probability: risk.probability,
    channelImpacts: {
      revenue: risk.affectedChannels.includes('Revenue') ? 50 : 0,
      supplyChain: risk.affectedChannels.includes('Supply Chain') ? 50 : 0,
      physicalAssets: risk.affectedChannels.includes('Physical Assets') ? 50 : 0,
      financial: risk.affectedChannels.includes('Financial') ? 50 : 0
    }
  };
  
  // Navigate to Scenario Mode with prefilled data
  navigate(`/scenario?ticker=${ticker}&prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
};
```

**URL Structure:**
- `/scenario` - Scenario Mode home
- `/scenario?ticker=AAPL` - Scenario Mode for specific company
- `/scenario?ticker=AAPL&prefill={...}` - Pre-populated scenario builder
- `/scenario?ticker=AAPL&scenario=abc123` - Load saved scenario
- `/scenario?compare=true` - Comparison mode

### 4.3 Integration with Existing Scenario Engine

**Current Engine Location:** `/workspace/shadcn-ui/src/services/scenarioEngine.ts`

**Integration Approach:**

1. **Wrap Existing Engine:**
```typescript
// src/services/scenarios/scenarioEngineWrapper.ts

import { ScenarioEngine } from '@/services/scenarioEngine';

export class ScenarioEngineWrapper {
  private engine: ScenarioEngine;
  
  constructor() {
    this.engine = new ScenarioEngine();
  }
  
  async calculateScenario(
    scenario: ScenarioInput,
    companyData: CompanyExposure,
    shocks: Map<string, CountryShock>,
    alignments: Map<string, AlignmentData>
  ): Promise<ScenarioResult> {
    // Transform ScenarioInput to engine format
    const engineInput = this.transformInput(scenario);
    
    // Call existing engine
    const engineResult = await this.engine.calculate(
      engineInput,
      companyData,
      shocks,
      alignments
    );
    
    // Transform engine output to ScenarioResult format
    return this.transformOutput(engineResult, scenario);
  }
  
  private transformInput(scenario: ScenarioInput): any {
    // Transform new format to existing engine format
    return {
      event: {
        countries: scenario.affectedCountries,
        severity: scenario.severity,
        type: scenario.eventType
      },
      channels: scenario.channelImpacts
    };
  }
  
  private transformOutput(engineResult: any, scenario: ScenarioInput): ScenarioResult {
    // Transform engine output to new format
    return {
      scenarioId: scenario.id,
      // ... map all fields
    };
  }
}
```

2. **Enhance Engine with Transmission Trace:**
```typescript
// Add to existing engine or create new service
export class TransmissionTraceGenerator {
  generate(
    scenario: ScenarioInput,
    companyData: CompanyExposure,
    result: ScenarioResult
  ): TransmissionTrace {
    const steps: TransmissionStep[] = [];
    
    // Step 1: Event Definition
    steps.push({
      stepNumber: 1,
      stepType: 'EventDefinition',
      description: 'Scenario event parameters',
      inputs: {
        scenarioName: scenario.name,
        affectedCountries: scenario.affectedCountries,
        severity: scenario.severity,
        channelImpacts: scenario.channelImpacts
      },
      calculation: 'N/A',
      outputs: {}
    });
    
    // Step 2-5: Generate remaining steps
    // ... (see S5 component spec for details)
    
    return {
      scenarioId: scenario.id,
      steps,
      calculationMetadata: {
        engine: 'ScenarioEngine',
        version: '2.0',
        timestamp: new Date(),
        executionTime: result.calculationTime
      }
    };
  }
}
```

### 4.4 Scenario Comparison Implementation

**Comparison Store:**

```typescript
// src/store/comparisonSlice.ts

interface ComparisonState {
  scenarios: ScenarioResult[];
  metrics: ScenarioComparisonMetrics | null;
  
  addScenario: (result: ScenarioResult) => void;
  removeScenario: (scenarioId: string) => void;
  calculateMetrics: () => void;
  exportComparison: () => Promise<Blob>;
}
```

**Comparison View Component:**

```typescript
// src/pages/ScenarioComparison.tsx

export default function ScenarioComparison() {
  const { scenarios, metrics } = useComparisonStore();
  
  return (
    <div className="comparison-grid">
      {/* Side-by-side comparison of scenarios */}
      <div className="scenario-columns">
        {scenarios.map(scenario => (
          <ScenarioColumn key={scenario.scenarioId} result={scenario} />
        ))}
      </div>
      
      {/* Aggregate metrics */}
      <ComparisonMetrics metrics={metrics} />
      
      {/* Export options */}
      <Button onClick={exportComparison}>Export Comparison Report</Button>
    </div>
  );
}
```

### 4.5 Portfolio-Level Stress Testing

**Future Enhancement (Phase 4):**

Enable users to apply scenarios to entire portfolios:

```typescript
// src/services/portfolioStressTest.ts

export async function runPortfolioStressTest(
  scenario: ScenarioInput,
  portfolio: Portfolio
): Promise<PortfolioStressTestResponse> {
  const results: ScenarioResult[] = [];
  
  // Run scenario for each company in parallel
  await Promise.all(
    portfolio.companies.map(async (ticker) => {
      const result = await runScenario(scenario, ticker);
      results.push(result);
    })
  );
  
  // Calculate aggregate metrics
  const aggregateMetrics = calculateAggregateMetrics(results);
  
  return {
    portfolioResults: results.map(r => ({
      ticker: r.ticker,
      companyName: r.companyName,
      result: r
    })),
    aggregateMetrics
  };
}
```

---

## 5. Implementation Timeline

### Week 1: Foundation & Core Components (S1, S2)

**Days 1-2: Setup & Data Architecture**
- [ ] Create `src/types/scenario.ts` with all interfaces
- [ ] Create `src/store/scenarioSlice.ts` with Zustand state management
- [ ] Set up API service layer (`src/services/scenarios/`)
- [ ] Create mock data generators for testing
- [ ] Write unit tests for data structures

**Days 3-5: S1 Scenario Builder Component**
- [ ] Create `src/components/scenario/ScenarioBuilder.tsx`
- [ ] Implement form inputs (event name, countries, severity, etc.)
- [ ] Add validation logic with real-time feedback
- [ ] Implement template save/load functionality
- [ ] Create quick-start templates (5 pre-configured scenarios)
- [ ] Write unit tests for validation logic
- [ ] Write integration tests for form submission

**Days 6-7: S2 Scenario Impact Summary Component**
- [ ] Create `src/components/scenario/ScenarioImpactSummary.tsx`
- [ ] Implement ΔCO-GRI display with visual indicators
- [ ] Add executive summary generation logic
- [ ] Implement confidence score calculation
- [ ] Add export/share functionality
- [ ] Write unit tests for metric calculations
- [ ] Write visual regression tests

**Deliverables:**
- Working Scenario Builder with validation
- Working Impact Summary with mock data
- 20+ unit tests passing
- Documentation for data structures

---

### Week 2: Attribution Components (S3, S4, S5)

**Days 1-2: S3 Channel Attribution Component**
- [ ] Create `src/components/scenario/ChannelAttribution.tsx`
- [ ] Implement horizontal bar chart visualization
- [ ] Add baseline vs scenario comparison
- [ ] Implement drill-down to country-level breakdown
- [ ] Write unit tests for channel delta calculations
- [ ] Write visual regression tests

**Days 3-4: S4 Node Attribution Component**
- [ ] Create `src/components/scenario/NodeAttribution.tsx`
- [ ] Implement ranked table of top 10 countries
- [ ] Add geographic heatmap overlay (optional)
- [ ] Implement click-to-expand functionality
- [ ] Write unit tests for node ranking logic
- [ ] Write visual regression tests

**Days 5-7: S5 Transmission Trace Component**
- [ ] Create `src/components/scenario/TransmissionTrace.tsx`
- [ ] Create `src/services/scenarios/transmissionTraceGenerator.ts`
- [ ] Implement collapsible drawer UI
- [ ] Generate step-by-step calculation breakdown
- [ ] Add formula display with actual values
- [ ] Implement export to PDF functionality
- [ ] Write unit tests for trace generation
- [ ] Write integration tests for full trace flow

**Deliverables:**
- All 5 core components (S1-S5) functional
- 40+ unit tests passing
- Visual regression test suite
- Component documentation

---

### Week 3: Integration & Scenario Mode Page

**Days 1-3: Scenario Mode Page Layout**
- [ ] Create `src/pages/ScenarioMode.tsx`
- [ ] Implement 30/70 split layout (builder left, results right)
- [ ] Integrate all 5 components (S1-S5)
- [ ] Add routing and URL parameter handling
- [ ] Implement responsive layout for tablet
- [ ] Write integration tests for page interactions

**Days 4-5: Scenario Engine Integration**
- [ ] Create `src/services/scenarios/scenarioEngineWrapper.ts`
- [ ] Integrate with existing scenario engine
- [ ] Implement input/output transformations
- [ ] Add error handling and retry logic
- [ ] Write unit tests for engine wrapper
- [ ] Write integration tests for end-to-end calculation

**Days 6-7: Company Mode Integration**
- [ ] Update Company Mode components (C1-C9) to accept scenario data
- [ ] Implement Scenario Shock tab in Company Mode
- [ ] Add "Change Scenario" and "View Full Analysis" buttons
- [ ] Implement deep linking from Company Mode to Scenario Mode
- [ ] Write integration tests for cross-mode navigation

**Deliverables:**
- Complete Scenario Mode page functional
- Company Mode Scenario Shock tab integrated
- Deep linking working
- 60+ tests passing (unit + integration)

---

### Week 4: Polish, Testing & Documentation

**Days 1-2: Scenario Comparison Feature**
- [ ] Create `src/pages/ScenarioComparison.tsx`
- [ ] Implement side-by-side scenario comparison
- [ ] Add comparison metrics calculation
- [ ] Implement export comparison report
- [ ] Write unit tests for comparison logic

**Days 3-4: Performance Optimization**
- [ ] Implement caching strategy (localStorage + in-memory)
- [ ] Optimize calculation performance (web workers if needed)
- [ ] Add loading states and progress indicators
- [ ] Implement lazy loading for heavy components
- [ ] Run performance profiling and optimization

**Days 5: Visual Regression Testing**
- [ ] Run full visual regression test suite (50+ tests)
- [ ] Generate baseline screenshots
- [ ] Fix any visual inconsistencies
- [ ] Update visual regression documentation

**Days 6-7: User Testing & Documentation**
- [ ] Conduct internal user testing (3-5 users)
- [ ] Fix critical bugs and usability issues
- [ ] Write comprehensive user documentation
- [ ] Create video tutorial for Scenario Mode
- [ ] Write developer documentation (API, components, state)
- [ ] Prepare deployment checklist

**Deliverables:**
- Production-ready Scenario Mode
- Scenario Comparison feature complete
- 80+ tests passing (unit + integration + E2E)
- Complete documentation (user + developer)
- Performance benchmarks met (<200ms interaction latency)

---

### Timeline Summary

| Week | Focus | Deliverables | Tests |
|------|-------|--------------|-------|
| 1 | Foundation & S1-S2 | Scenario Builder, Impact Summary | 20+ |
| 2 | S3-S5 Components | Channel/Node Attribution, Transmission Trace | 40+ |
| 3 | Integration | Scenario Mode page, Company Mode integration | 60+ |
| 4 | Polish & Testing | Comparison, optimization, documentation | 80+ |

**Total Duration:** 4 weeks (20 working days)

**Critical Path:**
1. Data architecture → Scenario Builder → Impact Summary
2. Engine integration → Calculation flow → Transmission trace
3. Component integration → Page layout → Cross-mode navigation
4. Testing → Bug fixes → Documentation

**Dependencies:**
- Week 2 depends on Week 1 (data structures, Scenario Builder)
- Week 3 depends on Week 2 (all components complete)
- Week 4 depends on Week 3 (full integration complete)

**Milestones:**
- ✅ End of Week 1: Scenario Builder functional
- ✅ End of Week 2: All 5 components complete
- ✅ End of Week 3: Full Scenario Mode integrated
- ✅ End of Week 4: Production-ready with documentation

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Coverage Target:** >85% for core calculation logic

**Test Files:**
```
src/__tests__/unit/
├── scenarioValidation.test.ts
├── scenarioCalculation.test.ts
├── transmissionTrace.test.ts
├── channelAttribution.test.ts
├── nodeAttribution.test.ts
└── scenarioComparison.test.ts
```

**Key Test Cases:**

1. **Scenario Validation:**
   - Valid scenario inputs pass validation
   - Invalid inputs trigger appropriate errors
   - Edge cases (empty arrays, negative values, etc.)

2. **Scenario Calculation:**
   - ΔCO-GRI calculation accuracy
   - Channel attribution correctness
   - Node attribution ranking
   - Transmission trace generation

3. **State Management:**
   - Scenario store actions update state correctly
   - Comparison mode adds/removes scenarios
   - Error handling sets error state

### 6.2 Integration Tests

**Coverage Target:** All critical user flows

**Test Files:**
```
src/__tests__/integration/
├── scenarioModeFlow.test.tsx
├── companyModeScenarioIntegration.test.tsx
├── scenarioComparison.test.tsx
└── deepLinking.test.tsx
```

**Key Test Cases:**

1. **Scenario Creation Flow:**
   - User fills out Scenario Builder
   - User clicks "Run Scenario"
   - Results display correctly in S2-S5

2. **Company Mode Integration:**
   - User switches to Scenario Shock tab
   - Scenario data displays in all 9 components
   - User navigates to Scenario Mode via deep link

3. **Scenario Comparison:**
   - User enables comparison mode
   - User runs multiple scenarios
   - Comparison view displays correctly

### 6.3 Visual Regression Tests

**Coverage Target:** All components × all states

**Test Files:**
```
src/__tests__/visual/
├── scenarioModeVisualRegression.spec.ts
└── scenarioComponentsVisual.spec.ts
```

**Test Cases (50+ screenshots):**

1. **Full Page Screenshots:**
   - Scenario Mode (empty state)
   - Scenario Mode (with results)
   - Scenario Comparison view
   - Company Mode Scenario Shock tab

2. **Component Screenshots:**
   - S1: Scenario Builder (empty, filled, validation errors)
   - S2: Impact Summary (positive delta, negative delta)
   - S3: Channel Attribution (all channels)
   - S4: Node Attribution (table, map view)
   - S5: Transmission Trace (collapsed, expanded)

3. **Responsive Screenshots:**
   - Desktop (1920×1080)
   - Tablet (768×1024)
   - Mobile (375×667) - if applicable

### 6.4 End-to-End Tests

**Coverage Target:** Critical user journeys

**Test Files:**
```
src/__tests__/e2e/
└── scenarioWorkflow.spec.ts
```

**Test Cases:**

1. **Complete Scenario Workflow:**
   - Navigate to Scenario Mode
   - Create new scenario
   - Run calculation
   - View all results (S2-S5)
   - Export report
   - Save scenario template

2. **Cross-Mode Navigation:**
   - Start in Company Mode
   - Click "Stress Test" on a risk
   - Navigate to Scenario Mode with prefilled data
   - Run scenario
   - Return to Company Mode
   - View Scenario Shock tab

3. **Scenario Comparison:**
   - Create 3 scenarios
   - Enable comparison mode
   - View comparison results
   - Export comparison report

### 6.5 Performance Tests

**Benchmarks:**

| Metric | Target | Critical |
|--------|--------|----------|
| Scenario calculation time | <2s | <5s |
| UI interaction latency | <100ms | <200ms |
| Page load time | <1s | <2s |
| Memory usage | <100MB | <200MB |

**Test Approach:**
- Use Chrome DevTools Performance profiler
- Run calculations with large datasets (50+ countries)
- Monitor memory leaks during long sessions
- Test on low-end devices (throttled CPU)

---

## 7. Risk Assessment

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scenario calculation performance issues | Medium | High | Implement web workers, optimize algorithms, add caching |
| Integration issues with existing engine | Medium | High | Create wrapper layer, extensive integration tests |
| State management complexity | Low | Medium | Use Zustand best practices, clear separation of concerns |
| Visual regression test flakiness | Medium | Low | Use strict screenshot comparison, retry failed tests |
| Browser compatibility issues | Low | Medium | Test on Chrome, Firefox, Safari; use polyfills |

### 7.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scenario Builder too complex | Medium | High | User testing, progressive disclosure, tooltips |
| Transmission trace overwhelming | High | Medium | Collapse by default, clear visual hierarchy |
| Comparison mode confusing | Medium | Medium | Clear labeling, limit to 4 scenarios, guided tour |
| Mobile experience poor | Low | Low | Focus on desktop/tablet first, mobile as Phase 4 |

### 7.3 Data Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scenario calculation accuracy issues | Low | Critical | Extensive unit tests, validation against reference data |
| Missing country shock data | Medium | High | Graceful degradation, clear error messages |
| Alignment data gaps | Medium | Medium | Use default values, flag low-confidence results |
| Stale cached data | Low | Medium | Implement cache invalidation, show data freshness |

### 7.4 Timeline Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Week 1 delays (foundation) | Low | High | Start early, parallel work on data structures |
| Week 2 delays (components) | Medium | Medium | Prioritize S1-S3, defer S5 if needed |
| Week 3 delays (integration) | Medium | High | Allocate buffer time, reduce scope if needed |
| Week 4 delays (testing) | Low | Low | Start testing in Week 3, continuous testing |

**Contingency Plan:**

If timeline slips by >3 days:
1. **Priority 1 (Must Have):** S1, S2, S3 - Core scenario creation and results
2. **Priority 2 (Should Have):** S4, Company Mode integration
3. **Priority 3 (Nice to Have):** S5 Transmission Trace, Scenario Comparison

**Go/No-Go Criteria:**

Before moving to next week:
- [ ] All Priority 1 features complete
- [ ] Unit tests passing (>80% coverage)
- [ ] No critical bugs
- [ ] Code review approved
- [ ] Documentation updated

---

## 8. Success Metrics

### 8.1 Technical Metrics

- [ ] Test coverage >85% for scenario calculation logic
- [ ] All 80+ tests passing (unit + integration + E2E)
- [ ] Zero critical bugs in production
- [ ] Performance: <2s scenario calculation time
- [ ] Performance: <100ms UI interaction latency
- [ ] Visual regression: 0 unintended visual changes

### 8.2 User Metrics

- [ ] >70% of users create at least one scenario
- [ ] >50% of users save scenario templates
- [ ] >30% of users use comparison mode
- [ ] <10% confusion rate on scenario inputs (measured via user testing)
- [ ] >80% user satisfaction score
- [ ] <5% support ticket rate for scenario-related questions

### 8.3 Business Metrics

- [ ] Scenario Mode increases user engagement by >20%
- [ ] Average session time increases by >15%
- [ ] User retention improves (measured 30 days post-launch)
- [ ] Positive feedback from institutional users (>4/5 rating)

---

## 9. Appendices

### Appendix A: Scenario Templates (Quick Start)

**Template 1: Taiwan Strait Military Escalation**
```typescript
{
  name: "Taiwan Strait Military Escalation",
  description: "Increased military tensions and potential conflict in the Taiwan Strait region",
  affectedCountries: ["Taiwan", "China", "Japan", "South Korea"],
  eventType: "Military",
  severity: 85,
  probability: 40,
  timing: { type: "6-12months" },
  channelImpacts: {
    revenue: 20,
    supplyChain: 80,
    physicalAssets: 60,
    financial: 30
  }
}
```

**Template 2: US-China Technology Decoupling**
```typescript
{
  name: "US-China Technology Decoupling",
  description: "Accelerated decoupling of US and Chinese technology supply chains",
  affectedCountries: ["China", "Taiwan", "United States", "Vietnam", "India"],
  eventType: "Political",
  severity: 70,
  probability: 65,
  timing: { type: "3-6months" },
  channelImpacts: {
    revenue: 40,
    supplyChain: 70,
    physicalAssets: 30,
    financial: 20
  }
}
```

**Template 3: Middle East Oil Supply Shock**
```typescript
{
  name: "Middle East Oil Supply Shock",
  description: "Major disruption to oil supply from Middle East due to geopolitical conflict",
  affectedCountries: ["Saudi Arabia", "Iran", "Iraq", "UAE", "Kuwait"],
  eventType: "Economic",
  severity: 80,
  probability: 30,
  timing: { type: "immediate" },
  channelImpacts: {
    revenue: 50,
    supplyChain: 60,
    physicalAssets: 40,
    financial: 70
  }
}
```

**Template 4: European Energy Crisis**
```typescript
{
  name: "European Energy Crisis",
  description: "Severe energy supply constraints in Europe due to geopolitical tensions",
  affectedCountries: ["Germany", "France", "Italy", "Poland", "Netherlands"],
  eventType: "Economic",
  severity: 75,
  probability: 50,
  timing: { type: "3-6months" },
  channelImpacts: {
    revenue: 60,
    supplyChain: 50,
    physicalAssets: 40,
    financial: 30
  }
}
```

**Template 5: Global Semiconductor Shortage**
```typescript
{
  name: "Global Semiconductor Shortage",
  description: "Severe shortage of semiconductor components due to supply chain disruptions",
  affectedCountries: ["Taiwan", "South Korea", "China", "Japan", "United States"],
  eventType: "Economic",
  severity: 70,
  probability: 55,
  timing: { type: "immediate" },
  channelImpacts: {
    revenue: 30,
    supplyChain: 90,
    physicalAssets: 20,
    financial: 10
  }
}
```

### Appendix B: Calculation Examples

**Example: Taiwan Strait Scenario for Apple Inc.**

**Inputs:**
- Scenario: Taiwan Strait Military Escalation (severity 85, probability 40%)
- Company: Apple Inc. (AAPL)
- Baseline CO-GRI: 62.4 (Elevated)

**Step 1: Adjust Country Shocks**
```
Taiwan:
  Baseline S_c = 68
  Event Impact = +25 (from severity 85 × channel weight 0.8)
  Scenario S_c = 93
  W^c (US-Taiwan alignment) = 0.67
  AdjS_baseline = 68 × (1 - 0.5 × 0.67) = 45.22
  AdjS_scenario = 93 × (1 - 0.5 × 0.67) = 61.86
  Δ AdjS = +16.64

China:
  Baseline S_c = 72
  Event Impact = +15 (from severity 85 × channel weight 0.6)
  Scenario S_c = 87
  W^c (US-China alignment) = 0.3
  AdjS_baseline = 72 × (1 - 0.5 × 0.3) = 61.2
  AdjS_scenario = 87 × (1 - 0.5 × 0.3) = 73.95
  Δ AdjS = +12.75
```

**Step 2: Apply to Company Exposures**
```
Taiwan (W_norm = 0.207):
  Δ Risk = 0.207 × 16.64 = +3.44

China (W_norm = 0.466):
  Δ Risk = 0.466 × 12.75 = +5.94
```

**Step 3: Channel Attribution**
```
Supply Chain: +12.3 (Taiwan +3.1, China +8.2, others +1.0)
Physical Assets: +4.2 (Taiwan +2.8, China +1.4)
Revenue: +0.8 (China +0.5, Taiwan +0.3)
Financial: -0.8 (risk reduction in other regions)
```

**Step 4: Final Result**
```
Σ Δ Risk = 12.3 + 4.2 + 0.8 - 0.8 = 16.5
M_sector = 1.0 (no sector amplification)
Δ CO-GRI = 16.5 × 1.0 = +16.5

Baseline CO-GRI: 62.4 (Elevated)
Scenario CO-GRI: 78.9 (High)
Risk Level Change: Elevated → High
```

### Appendix C: API Response Examples

**Scenario Calculation Response:**

```json
{
  "result": {
    "scenarioId": "abc123",
    "companyId": "AAPL",
    "ticker": "AAPL",
    "baselineCOGRI": 62.4,
    "scenarioCOGRI": 78.9,
    "deltaCOGRI": 16.5,
    "deltaPercentage": 26.4,
    "baselineRiskLevel": "Elevated",
    "scenarioRiskLevel": "High",
    "riskLevelChange": "Upgrade",
    "confidence": 0.85,
    "dataQuality": {
      "exposureCoverage": 95,
      "shockDataFreshness": "2026-03-01T00:00:00Z",
      "alignmentCoverage": 85
    },
    "channelAttribution": [
      {
        "channel": "Supply Chain",
        "baselineRisk": 28.5,
        "scenarioRisk": 40.8,
        "delta": 12.3,
        "deltaPercentage": 43.2,
        "contribution": 74.5,
        "topAffectedCountries": [
          { "country": "China", "delta": 8.2 },
          { "country": "Taiwan", "delta": 3.1 },
          { "country": "Vietnam", "delta": 1.0 }
        ]
      }
    ],
    "nodeAttribution": [
      {
        "country": "China",
        "baselineRisk": 28.5,
        "scenarioRisk": 36.7,
        "delta": 8.2,
        "deltaPercentage": 28.8,
        "contribution": 49.7,
        "dominantChannel": "Supply Chain",
        "channelBreakdown": {
          "revenue": 0.5,
          "supplyChain": 8.2,
          "physicalAssets": 1.4,
          "financial": 0.0
        },
        "baselineShock": 72,
        "scenarioShock": 87,
        "shockDelta": 15
      }
    ],
    "calculatedAt": "2026-03-01T10:30:00Z",
    "calculationTime": 1850
  },
  "trace": {
    "scenarioId": "abc123",
    "steps": [
      {
        "stepNumber": 1,
        "stepType": "EventDefinition",
        "description": "Scenario event parameters",
        "inputs": {
          "scenarioName": "Taiwan Strait Military Escalation",
          "affectedCountries": ["Taiwan", "China"],
          "severity": 85,
          "channelImpacts": {
            "revenue": 20,
            "supplyChain": 80,
            "physicalAssets": 60,
            "financial": 30
          }
        },
        "calculation": "N/A",
        "outputs": {}
      }
    ],
    "calculationMetadata": {
      "engine": "ScenarioEngine",
      "version": "2.0",
      "timestamp": "2026-03-01T10:30:00Z",
      "executionTime": 1850
    }
  },
  "metadata": {
    "calculationTime": 1850,
    "engineVersion": "2.0",
    "timestamp": "2026-03-01T10:30:00Z"
  }
}
```

---

## Conclusion

This comprehensive design specification provides a complete blueprint for implementing Scenario Mode (Mode 4) in the CO-GRI Trading Signal Service platform. The specification includes:

✅ **5 Core Components** (S1-S5) with detailed specifications and wireframes  
✅ **Data Architecture** with TypeScript interfaces and state management  
✅ **Integration Strategy** for Company Mode and existing scenario engine  
✅ **4-Week Implementation Timeline** with clear milestones and deliverables  
✅ **Testing Strategy** with 80+ tests across unit, integration, and E2E  
✅ **Risk Assessment** with mitigation strategies and contingency plans  

**Next Steps:**
1. Review this specification with stakeholders
2. Obtain approval to proceed with implementation
3. Begin Week 1: Foundation & Core Components (S1, S2)
4. Schedule weekly check-ins to track progress
5. Conduct user testing after Week 3 integration

**Success Criteria:**
- All 5 components (S1-S5) functional and tested
- Company Mode integration complete with Scenario Shock tab
- Deep linking working between Company Mode and Scenario Mode
- 80+ tests passing with >85% coverage
- Performance benchmarks met (<2s calculation time)
- User satisfaction >80% (measured via UAT)

This design is ready for implementation. Let's build an exceptional Scenario Mode that empowers institutional investors to stress test their portfolios with confidence! 🚀