# Report: Trading Dashboard — Full Documentation

**Project:** CO-GRI Platform  
**Report Date:** 2026-04-15  
**Author:** David (Data Analyst, Atoms Team)  
**Scope:** Complete audit, methodology documentation, and mathematical reference for the Trading Dashboard  
**Status:** Read-only investigation — no code changes made

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [File Inventory](#3-file-inventory)
4. [Feature 1 — Trading Mode Page (TradingMode.tsx)](#4-feature-1--trading-mode-page)
5. [Feature 2 — Signal Dashboard Tab](#5-feature-2--signal-dashboard-tab)
   - 5.1 SignalDashboardHeader (T1)
   - 5.2 SignalCardsGrid (T2)
   - 5.3 SignalDetailsPanel (T3)
6. [Feature 3 — Portfolio Optimizer Tab](#6-feature-3--portfolio-optimizer-tab)
   - 6.1 PortfolioInput (T4)
   - 6.2 OptimizationSettings (T5)
   - 6.3 OptimizationResults (T6)
7. [Feature 4 — Backtest Results Tab](#7-feature-4--backtest-results-tab)
   - 7.1 BacktestConfig (T7)
   - 7.2 BacktestResults (T8)
8. [Feature 5 — CO-GRI Trading Signal Service Page](#8-feature-5--cogri-trading-signal-service-page)
9. [Feature 6 — Company Trading Signal View](#9-feature-6--company-trading-signal-view)
10. [Service Layer — TradingEngine](#10-service-layer--tradingengine)
11. [Service Layer — Enhanced Backtesting Engine](#11-service-layer--enhanced-backtesting-engine)
12. [Service Layer — Advanced Signal Generation](#12-service-layer--advanced-signal-generation)
13. [Service Layer — Risk Management](#13-service-layer--risk-management)
14. [Service Layer — ML Training Pipeline](#14-service-layer--ml-training-pipeline)
15. [Service Layer — Supply Chain Monitor](#15-service-layer--supply-chain-monitor)
16. [State Management — tradingState.ts](#16-state-management--tradingstatets)
17. [Type System — trading.ts](#17-type-system--tradingts)
18. [Mock Data Generator](#18-mock-data-generator)
19. [Mathematical Calculations Reference](#19-mathematical-calculations-reference)
20. [CO-GRI Integration in Trading Dashboard](#20-co-gri-integration-in-trading-dashboard)
21. [Phase Evolution Summary](#21-phase-evolution-summary)
22. [Data Flow Diagrams](#22-data-flow-diagrams)
23. [Limitations and Known Gaps](#23-limitations-and-known-gaps)

---

## 1. Executive Summary

The Trading Dashboard is a multi-tab investment decision-support system built into the CO-GRI platform. It is accessible from the main navigation as "Trading Mode." The dashboard integrates the platform's core geopolitical risk scoring system (CO-GRI) with trading signal generation, portfolio optimization, and strategy backtesting.

### Key Capabilities

| Capability | Description |
|---|---|
| **Trading Signal Generation** | BUY / SELL / HOLD signals for 20+ tickers based on CO-GRI scores, forecast deltas, and scenario risk |
| **Portfolio Optimization** | Three objectives: Minimize Risk, Maximize Return, Maximize Sharpe Ratio |
| **Strategy Backtesting** | Historical simulation with equity curve, drawdown series, attribution, and benchmark comparison |
| **CO-GRI Signal Service** | Dedicated page with 40-year backtest (1985–2025), walk-forward validation, Monte Carlo simulation, and ML overlay |
| **Company Signal Integration** | Per-company trading signal embedded in Company Mode as a fourth tab |
| **Supply Chain Monitoring** | Real-time supply chain disruption detection feeding into signal adjustments |
| **ML Overlay** | Gradient Boosting model with 5-state HMM regime detection (Phase 3) |

### Performance Benchmarks (Phase 3, 1985–2025)

| Metric | Value |
|---|---|
| Annualized Return | 18.9% |
| Sharpe Ratio | 1.27 |
| Sortino Ratio | 1.78 |
| Calmar Ratio | 2.31 |
| Max Drawdown | 8.2% |
| Win Rate | 71.2% |
| Profit Factor | 3.24 |
| Volatility | 10.8% |

---

## 2. Architecture Overview

```
Trading Dashboard
├── Pages
│   ├── TradingMode.tsx              ← Main 3-tab dashboard
│   └── COGRITradingSignalService.tsx ← Advanced analytics page
│
├── Components
│   ├── trading/
│   │   ├── SignalDashboardHeader.tsx
│   │   ├── SignalCardsGrid.tsx
│   │   ├── SignalDetailsPanel.tsx
│   │   ├── PortfolioInput.tsx
│   │   ├── OptimizationSettings.tsx
│   │   ├── OptimizationResults.tsx
│   │   ├── BacktestConfig.tsx
│   │   └── BacktestResults.tsx
│   ├── company/
│   │   └── CompanyTradingSignalView.tsx
│   ├── dashboard/
│   │   └── BacktestingDashboard.tsx
│   └── tradingSignals/
│       ├── EquityCurveChart.tsx
│       ├── MonthlyReturnsHeatmap.tsx
│       ├── RollingSharpeChart.tsx
│       ├── TradeDistributionChart.tsx
│       └── RealTimeDataStatus.tsx
│
├── Services
│   ├── engines/TradingEngine.ts
│   ├── mockData/tradingDataGenerator.ts
│   └── tradingSignals/
│       ├── enhancedBacktesting.ts
│       ├── advancedSignalGeneration.ts
│       ├── riskManagement.ts
│       ├── mlTraining.ts
│       └── supplyChainMonitor.ts
│
├── Store
│   └── tradingState.ts              ← Zustand state management
│
└── Types
    └── trading.ts                   ← All TypeScript interfaces
```

### Technology Stack

- **Frontend Framework:** React with TypeScript
- **State Management:** Zustand (`useTradingState`)
- **Charting:** Recharts (LineChart, AreaChart, BarChart, ScatterChart)
- **UI Components:** shadcn/ui (Card, Badge, Button, Table, Tabs, Slider, Switch, Select)
- **Data:** Mock/simulated data via `tradingDataGenerator.ts`; live data integration via SEC EDGAR API, Alpha Vantage API (supply chain)

---

## 3. File Inventory

### 3.1 Pages

| File | Path | Purpose |
|---|---|---|
| `TradingMode.tsx` | `src/pages/modes/TradingMode.tsx` | Main 3-tab Trading Mode page |
| `COGRITradingSignalService.tsx` | `src/pages/COGRITradingSignalService.tsx` | Advanced CO-GRI trading analytics page |

### 3.2 Components

| File | Path | Purpose |
|---|---|---|
| `SignalDashboardHeader.tsx` | `src/components/trading/` | Filter/sort controls for signals (T1) |
| `SignalCardsGrid.tsx` | `src/components/trading/` | Grid of signal cards (T2) |
| `SignalDetailsPanel.tsx` | `src/components/trading/` | Detailed signal panel (T3) |
| `PortfolioInput.tsx` | `src/components/trading/` | Portfolio holdings input (T4) |
| `OptimizationSettings.tsx` | `src/components/trading/` | Optimization parameters (T5) |
| `OptimizationResults.tsx` | `src/components/trading/` | Optimization output display (T6) |
| `BacktestConfig.tsx` | `src/components/trading/` | Backtest configuration (T7) |
| `BacktestResults.tsx` | `src/components/trading/` | Backtest results display (T8) |
| `CompanyTradingSignalView.tsx` | `src/components/company/` | Per-company signal in Company Mode |
| `BacktestingDashboard.tsx` | `src/components/dashboard/` | CSI backtesting dashboard |
| `EquityCurveChart.tsx` | `src/components/tradingSignals/` | Equity curve visualization |
| `MonthlyReturnsHeatmap.tsx` | `src/components/tradingSignals/` | Monthly returns heatmap |
| `RollingSharpeChart.tsx` | `src/components/tradingSignals/` | Rolling Sharpe ratio chart |
| `TradeDistributionChart.tsx` | `src/components/tradingSignals/` | Trade P&L distribution |
| `RealTimeDataStatus.tsx` | `src/components/tradingSignals/` | Live data feed status indicator |

### 3.3 Services

| File | Path | Purpose |
|---|---|---|
| `TradingEngine.ts` | `src/services/engines/` | Core signal generation, optimization, backtesting |
| `tradingDataGenerator.ts` | `src/services/mockData/` | Mock data generation for all trading features |
| `enhancedBacktesting.ts` | `src/services/tradingSignals/` | Walk-forward, Monte Carlo, regime analysis |
| `advancedSignalGeneration.ts` | `src/services/tradingSignals/` | Multi-timeframe signals, VIX scaling, correlation |
| `riskManagement.ts` | `src/services/tradingSignals/` | Kelly Criterion, drawdown limits, stop-loss |
| `mlTraining.ts` | `src/services/tradingSignals/` | ML model training, validation, retraining |
| `supplyChainMonitor.ts` | `src/services/tradingSignals/` | Supply chain disruption monitoring |

### 3.4 State & Types

| File | Path | Purpose |
|---|---|---|
| `tradingState.ts` | `src/store/` | Zustand store for all trading state |
| `trading.ts` | `src/types/` | All TypeScript interfaces and type aliases |

---

## 4. Feature 1 — Trading Mode Page

**File:** `src/pages/modes/TradingMode.tsx`

### 4.1 Overview

The Trading Mode page is the primary entry point for the trading dashboard. It renders a three-tab layout:

1. **Signal Dashboard** — View and filter trading signals
2. **Portfolio Optimizer** — Input holdings and run optimization
3. **Backtest Results** — Configure and run historical strategy tests

### 4.2 Layout Structure

```
TradingMode
├── GlobalNavigationBar (always visible)
├── Header
│   ├── TrendingUp icon
│   ├── Title: "Trading Mode"
│   └── Subtitle: "Risk-adjusted trading signals and portfolio optimization"
├── Info Alert
│   └── "Trading signals are generated based on comprehensive CO-GRI analysis..."
└── Tabs (3 tabs)
    ├── Tab 1: Signal Dashboard
    │   ├── SignalDashboardHeader (filters/sort)
    │   └── Grid (2/3 + 1/3 columns)
    │       ├── SignalCardsGrid (left, 2/3 width)
    │       └── SignalDetailsPanel (right, 1/3 width, conditional)
    ├── Tab 2: Portfolio Optimizer
    │   └── Grid (1/2 + 1/2 columns)
    │       ├── Left: PortfolioInput + OptimizationSettings
    │       └── Right: OptimizationResults
    └── Tab 3: Backtest Results
        └── Grid (1/3 + 2/3 columns)
            ├── Left: BacktestConfig
            └── Right: BacktestResults
```

### 4.3 Initialization Logic

On mount, the component:
1. Sets the global active mode to `'Trading'` via `useGlobalState`
2. Sets the global dashboard mode to `'Trading'` via `useGlobalDashboardStore`
3. Calls `generateMockSignals(25)` to populate 25 initial trading signals
4. Stores signals in Zustand via `setSignals`

### 4.4 Data Flow

```
Mount
  → setGlobalActiveMode('Trading')
  → generateMockSignals(25)         [tradingDataGenerator.ts]
  → setSignals(mockSignals)         [tradingState.ts]
  → SignalCardsGrid renders signals
  → User clicks signal card
  → setSelectedSignal(signal)       [tradingState.ts]
  → SignalDetailsPanel renders
```

---

## 5. Feature 2 — Signal Dashboard Tab

### 5.1 SignalDashboardHeader (T1)

**File:** `src/components/trading/SignalDashboardHeader.tsx`

#### Purpose
Provides filter and sort controls for the signal grid. Does not display signals itself — it controls what `SignalCardsGrid` shows.

#### Controls

| Control | Type | Options | Default |
|---|---|---|---|
| Signal Type Filter | Select | All Signals, BUY Only, SELL Only, HOLD Only | All Signals |
| Min Confidence | Slider | 0–100% (step 5) | 0% |
| Sort By | Select | Signal Strength, Confidence, CO-GRI Score, Expected Return, Date Generated | Signal Strength |
| Refresh | Button | Regenerates 25 mock signals | — |
| Export | Button | Console log (stub) | — |

#### Filter Logic
- **All Signals:** `signal_types = ['BUY', 'SELL', 'HOLD']`
- **Single type:** `signal_types = [selectedType]`
- **Confidence threshold:** Signals with `confidence_score < threshold` are excluded

#### Refresh Behavior
Calls `generateMockSignals(25)` and updates the Zustand store. Each refresh produces new randomized signals.

---

### 5.2 SignalCardsGrid (T2)

**File:** `src/components/trading/SignalCardsGrid.tsx`

#### Purpose
Renders all filtered and sorted trading signals as a responsive 2-column card grid. Each card is clickable to show details in the adjacent panel.

#### Filtering Algorithm

```typescript
filtered = signals.filter(signal => {
  if (!signalFilters.signal_types.includes(signal.signal_type)) return false;
  if (signal.confidence_score < signalFilters.confidence_threshold) return false;
  if (signalFilters.sectors.length > 0 && !signalFilters.sectors.includes(signal.sector)) return false;
  return true;
});
```

#### Sorting Algorithm

```typescript
switch (signalSort.sort_by) {
  case 'signal_strength':
    // Map: High=3, Medium=2, Low=1
    comparison = strengthOrder[b.signal_strength] - strengthOrder[a.signal_strength];
  case 'confidence':
    comparison = b.confidence_score - a.confidence_score;
  case 'cogri':
    comparison = b.current_cogri - a.current_cogri;
  case 'expected_return':
    comparison = Math.abs(b.expected_return) - Math.abs(a.expected_return);
  case 'generated_at':
    comparison = b.generated_at.getTime() - a.generated_at.getTime();
}
// Apply sort order (asc/desc)
return signalSort.order === 'asc' ? -comparison : comparison;
```

#### Card Display Fields

Each signal card shows:
- **Header:** Ticker symbol, company name, signal type badge (BUY/SELL/HOLD with color coding)
- **Signal Metrics:** Strength (High/Medium/Low), Confidence level + score
- **Risk Metrics:** CO-GRI score, Forecast Delta (color-coded: red if positive/rising risk, green if negative/falling), Scenario Risk Score
- **Price Targets:** Current price, Target price, Expected return %
- **Action Button:** "View in Company Mode" (navigates to Company Mode for that ticker)

#### Color Coding

| Signal Type | Badge Color | Background |
|---|---|---|
| BUY | Green | `bg-green-500/10 text-green-700` |
| SELL | Red | `bg-red-500/10 text-red-700` |
| HOLD | Gray | `bg-gray-500/10 text-gray-700` |

#### Loading State
While signals are loading, 6 skeleton cards with pulse animation are shown.

---

### 5.3 SignalDetailsPanel (T3)

**File:** `src/components/trading/SignalDetailsPanel.tsx`

#### Purpose
A sticky side panel showing the full detail of the currently selected signal. Appears only when a signal card is clicked.

#### Sections

**1. Signal Type Banner**
- Large signal type text (BUY / SELL / HOLD)
- Signal strength and confidence level
- Color-coded background matching signal type

**2. Risk Metrics**
| Metric | Description |
|---|---|
| Current CO-GRI | Company's current geopolitical risk score (0–100) |
| Forecast Delta | Expected change in CO-GRI over 6–12 months (positive = increasing risk) |
| Scenario Risk | Stress test score from scenario analysis (0–100) |
| Confidence Score | Numeric confidence percentage (0–100%) |

**3. Price Targets**
| Field | Description |
|---|---|
| Current Price | Current market price |
| Price Target | 12-month price target |
| Stop Loss | Risk management exit price |
| Expected Return | `(target - current) / current × 100` |
| Time Horizon | Fixed: "3-6 months" |

**4. Signal Drivers**
Four factors with weight bars:
| Factor | Weight | Direction Logic |
|---|---|---|
| Current CO-GRI Level | 40% | Negative if CO-GRI > 60, Positive if < 40, Neutral otherwise |
| Forecast Outlook | 30% | Negative if delta > 0 (rising risk), Positive if delta < 0 |
| Scenario Resilience | 20% | Negative if scenario > 60, Positive if < 40 |
| Geographic Diversification | 10% | Positive or Neutral (random in mock) |

**5. Rationale**
Bullet list of 3–5 text explanations for the signal.

**6. Action Buttons**
- **View in Company Mode** — navigates to Company Mode for the ticker
- **Execute Trade** — stub button (no implementation)

---

## 6. Feature 3 — Portfolio Optimizer Tab

### 6.1 PortfolioInput (T4)

**File:** `src/components/trading/PortfolioInput.tsx`

#### Purpose
Allows users to input or load a portfolio of holdings for optimization.

#### Sample Portfolios

Three pre-built portfolios are available:

**Conservative Portfolio** (5 holdings, weighted CO-GRI: 42.1)
| Ticker | Shares | Price | Value | Weight | CO-GRI |
|---|---|---|---|---|---|
| JNJ | 100 | $165.50 | $16,550 | 20% | 38.5 |
| PG | 120 | $145.20 | $17,424 | 21% | 35.2 |
| WMT | 110 | $158.30 | $17,413 | 21% | 42.8 |
| V | 70 | $245.60 | $17,192 | 21% | 45.3 |
| MSFT | 45 | $375.80 | $16,911 | 17% | 48.9 |

**Balanced Portfolio** (7 holdings, weighted CO-GRI: 51.3)
| Ticker | Shares | Price | Value | Weight | CO-GRI |
|---|---|---|---|---|---|
| AAPL | 50 | $185.20 | $9,260 | 15% | 62.4 |
| MSFT | 25 | $375.80 | $9,395 | 15% | 48.9 |
| GOOGL | 70 | $142.50 | $9,975 | 16% | 55.7 |
| JPM | 60 | $168.40 | $10,104 | 16% | 51.2 |
| JNJ | 60 | $165.50 | $9,930 | 16% | 38.5 |
| WMT | 70 | $158.30 | $11,081 | 18% | 42.8 |
| DIS | 30 | $95.20 | $2,856 | 4% | 58.3 |

**Aggressive Growth Portfolio** (5 holdings, weighted CO-GRI: 64.2)
| Ticker | Shares | Price | Value | Weight | CO-GRI |
|---|---|---|---|---|---|
| NVDA | 40 | $485.30 | $19,412 | 22% | 68.7 |
| TSLA | 80 | $245.60 | $19,648 | 22% | 72.5 |
| META | 50 | $385.20 | $19,260 | 21% | 65.8 |
| AMZN | 120 | $152.80 | $18,336 | 20% | 58.4 |
| NFLX | 35 | $425.60 | $14,896 | 15% | 54.2 |

#### Portfolio Summary Metrics
- **Total Value:** Sum of all holding values
- **Weighted CO-GRI:** `Σ(cogri_i × weight_i) / Σ(weight_i)` — see Section 19.7
- **Holdings Count:** Number of positions

---

### 6.2 OptimizationSettings (T5)

**File:** `src/components/trading/OptimizationSettings.tsx`

#### Purpose
Configuration panel for the portfolio optimization algorithm.

#### Parameters

| Parameter | Type | Options | Default | Description |
|---|---|---|---|---|
| Optimization Objective | Select | Minimize Risk, Maximize Return, Maximize Sharpe | Minimize Risk | Primary optimization goal |
| CO-GRI Weight | Slider 0–100% | — | 50% | How much geopolitical risk reduction is prioritized |
| Risk Tolerance | Select | Conservative, Moderate, Aggressive | Moderate | Investor risk profile |
| Rebalancing Frequency | Select | Daily, Weekly, Monthly, Quarterly | Monthly | How often to rebalance |
| Max Position Size | Slider 10–50% | — | 25% | Maximum single-stock weight |
| Min Position Size | Slider 1–10% | — | 2% | Minimum single-stock weight |
| Max Sector Exposure | — | — | 40% | Maximum weight in any one sector |
| Min Holdings | — | — | 5 | Minimum number of positions |
| Max Holdings | — | — | 20 | Maximum number of positions |
| Transaction Costs | Slider 0–1% | — | 0.1% | Round-trip transaction cost assumption |
| Tax Loss Harvesting | Switch | On/Off | Off | Enable tax-loss harvesting |
| ESG Screening | Switch | On/Off | Off | Enable ESG factor screening |

---

### 6.3 OptimizationResults (T6)

**File:** `src/components/trading/OptimizationResults.tsx`

#### Purpose
Displays the before/after comparison of portfolio metrics after optimization, recommended trades, and the new portfolio composition.

#### Metrics Comparison

Shows side-by-side for Original vs Optimized:
- Total Value
- Weighted CO-GRI
- Risk Score
- Expected Return (%)
- Sharpe Ratio
- Volatility (%)

#### Improvements Panel

Three improvement metrics:
- **Risk Reduction:** `(original.risk_score - optimized.risk_score) / original.risk_score × 100`
- **Return Improvement:** `(optimized.expected_return - original.expected_return) / original.expected_return × 100`
- **Sharpe Improvement:** `(optimized.sharpe_ratio - original.sharpe_ratio) / original.sharpe_ratio × 100`

#### Recommended Trades Table

For each trade:
- Ticker, Action (BUY/SELL), Shares, Value, Rationale

#### Action Buttons
- **Apply Recommendations** — stub
- **Export Results** — stub

---

## 7. Feature 4 — Backtest Results Tab

### 7.1 BacktestConfig (T7)

**File:** `src/components/trading/BacktestConfig.tsx`

#### Purpose
Configuration form for running a historical strategy backtest.

#### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| Strategy | Select | CO-GRI Momentum | Strategy type to test |
| Universe | Select | S&P 500 | Stock universe |
| Start Date | Date | 2024-01-01 | Backtest start |
| End Date | Date | 2025-12-31 | Backtest end |
| Rebalancing Frequency | Select | Monthly | Rebalance interval |
| Initial Capital | Number | $100,000 | Starting portfolio value |
| Transaction Costs | Number | 0.1% | Per-trade cost |

#### Available Strategies

| Strategy | Description |
|---|---|
| CO-GRI Momentum | Long low-CO-GRI stocks, short high-CO-GRI stocks |
| Mean Reversion | Revert to mean CO-GRI levels |
| CO-GRI + Forecast | Combines current CO-GRI with forecast delta |
| Custom | User-defined parameters |

#### Available Universes
- S&P 500
- Russell 2000
- Custom (user-defined tickers)

#### Execution
On "Run Backtest" click:
1. Sets `isBacktesting = true`, `backtestProgress = 0`
2. Calls `TradingEngine.runBacktest(config, progressCallback)`
3. Progress bar updates via callback
4. On completion: stores result in `backtestResult`, sets `isBacktesting = false`

---

### 7.2 BacktestResults (T8)

**File:** `src/components/trading/BacktestResults.tsx`

#### Purpose
Displays comprehensive backtest performance results including charts, metrics, and attribution.

#### Performance Summary Metrics

| Metric | Description |
|---|---|
| Total Return | Cumulative return over backtest period |
| Annualized Return | CAGR over backtest period |
| Sharpe Ratio | Risk-adjusted return (see Section 19.1) |
| Max Drawdown | Peak-to-trough decline (see Section 19.4) |
| Volatility | Annualized standard deviation of returns |
| Win Rate | % of trades that were profitable |
| Total Trades | Number of trades executed |
| Profit Factor | Gross wins / Gross losses (see Section 19.9) |

#### Mock Performance Values (from TradingEngine)
```
Total Return:       24.5%
Annualized Return:  12.3%
Volatility:         18.2%
Sharpe Ratio:       0.68
Max Drawdown:      -15.4%
Win Rate:           58.3%
Profit Factor:      1.42
Total Trades:       156
Winning Trades:     91
Losing Trades:      65
```

#### Equity Curve Chart
- **Type:** Line chart (Recharts LineChart)
- **X-axis:** Date
- **Y-axis:** Portfolio value ($)
- **Series 1:** Strategy portfolio value (green solid line)
- **Series 2:** Benchmark value (gray dashed line)
- **Tooltip:** Date + formatted dollar values

#### Benchmark Comparison Panel

| Metric | Mock Value | Description |
|---|---|---|
| Strategy Return | 24.5% | Strategy cumulative return |
| Benchmark Return | 18.2% | S&P 500 cumulative return |
| Alpha | +6.3% | Excess return over benchmark |
| Beta | 0.92 | Systematic risk relative to benchmark |
| Information Ratio | 0.48 | Alpha / Tracking Error |
| Tracking Error | 8.5% | Std dev of return difference |

#### Performance Attribution

**By Sector:**
| Sector | Contribution | Trades | Win Rate |
|---|---|---|---|
| Technology | 45.2% | 42 | 62.5% |
| Financials | 28.3% | 28 | 55.8% |
| Consumer | 26.5% | 35 | 58.2% |

**By Signal Type:**
| Signal | Contribution | Trades | Win Rate |
|---|---|---|---|
| BUY | 65.4% | 68 | 64.2% |
| SELL | 34.6% | 45 | 52.3% |

**By Time Period:**
| Period | Return | Trades |
|---|---|---|
| Q1 2025 | 5.2% | 28 |
| Q2 2025 | 8.1% | 32 |
| Q3 2025 | 6.4% | 29 |
| Q4 2025 | 4.8% | 26 |

---

## 8. Feature 5 — CO-GRI Trading Signal Service Page

**File:** `src/pages/COGRITradingSignalService.tsx`

### 8.1 Overview

A dedicated advanced analytics page (separate from TradingMode.tsx) providing:
- 40-year backtest results (1985–2025)
- Phase-by-phase performance evolution
- Ticker-specific position sizing analysis
- Walk-forward validation results
- Monte Carlo simulation
- Supply chain health monitoring
- Sentiment analysis by country
- ML model performance

### 8.2 Tab Structure

The page has multiple tabs:
1. **Overview** — Phase comparison and headline metrics
2. **Ticker Analysis** — Per-ticker CO-GRI position sizing
3. **Backtest** — Full 40-year backtest visualizations
4. **Walk-Forward** — Out-of-sample validation
5. **ML Model** — Machine learning overlay results
6. **Supply Chain** — Real-time disruption monitoring
7. **Sentiment** — Country-level sentiment analysis

### 8.3 Phase Comparison Data

The page tracks performance evolution across four phases:

| Phase | Sharpe | Ann. Return | Max DD | Win Rate | Sortino | Calmar | Profit Factor | Volatility |
|---|---|---|---|---|---|---|---|---|
| Baseline | 0.78 | 12.8% | 14.2% | 61.3% | 1.12 | 0.91 | 2.34 | 13.8% |
| Phase 1 | 0.90 | 14.2% | 12.5% | 64.5% | 1.28 | 1.14 | 2.52 | 12.8% |
| Phase 2 | 1.08 | 16.2% | 9.8% | 68.5% | 1.52 | 1.65 | 2.89 | 11.8% |
| Phase 3 | 1.27 | 18.9% | 8.2% | 71.2% | 1.78 | 2.31 | 3.24 | 10.8% |

**Cumulative Sharpe Improvement:** +62.8% from Baseline to Phase 3

### 8.4 Ticker Analysis Feature

Users can enter any ticker symbol to receive:
- CO-GRI score and risk level classification
- Current vs. optimal position size
- BUY / SELL / HOLD recommendation
- Confidence score
- Geographic exposure breakdown with CSI contributions
- Expected impact (return improvement, Sharpe improvement, risk reduction)
- ML prediction (expected return, confidence, market regime)
- Sentiment score

#### Ticker-Specific CO-GRI Scores (Mock Data)

| Ticker | Company | CO-GRI Score | Risk Level |
|---|---|---|---|
| AAPL | Apple Inc. | 42.3 | Moderate Risk |
| TSLA | Tesla Inc. | 58.7 | High Risk |
| NVDA | NVIDIA Corporation | 35.2 | Moderate Risk |
| BA | Boeing Company | 67.8 | Very High Risk |
| CAT | Caterpillar Inc. | 52.4 | High Risk |
| MSFT | Microsoft Corporation | 28.6 | Low Risk |
| GOOGL | Alphabet Inc. | 31.5 | Moderate Risk |
| AMZN | Amazon.com Inc. | 38.9 | Moderate Risk |

#### Risk Level Classification

| CO-GRI Score | Risk Level |
|---|---|
| < 30 | Low Risk |
| 30–44 | Moderate Risk |
| 45–59 | High Risk |
| ≥ 60 | Very High Risk |

### 8.5 Position Sizing by CO-GRI Score

The `generateTickerAnalysis()` function applies the following position sizing rules:

| CO-GRI Range | Recommendation | Optimal Position | Confidence |
|---|---|---|---|
| < 30 | Increase | min(40%, current × 1.25) | 88% |
| 30–39 | Increase | min(35%, current × 1.10) | 82% |
| 40–59 | Hold | current position | 76% |
| 60–69 | Decrease | max(10%, current × 0.85) | 85% |
| ≥ 70 | Decrease | max(5%, current × 0.70) | 92% |

**Current position assumption:** 25% (fixed mock value)

### 8.6 Geographic Exposure Display (Mock)

For each ticker, the following exposure breakdown is shown:

| Country | Exposure | CSI | Contribution |
|---|---|---|---|
| China | 28.5% | 72.3 | 20.6 |
| United States | 35.2% | 18.4 | 6.5 |
| Taiwan | 15.8% | 68.9 | 10.9 |
| South Korea | 12.3% | 45.2 | 5.6 |
| Japan | 8.2% | 22.1 | 1.8 |

**Contribution formula:** `exposure × CSI / 100`

### 8.7 Walk-Forward Validation Results

The page shows a table of walk-forward periods with:
- Training period Sharpe ratio
- Test period Sharpe ratio
- Training max drawdown
- Test max drawdown
- Stability score: `(testSharpe / trainSharpe) × 100`

**Overall Stability Score:** Displayed prominently  
**Test/Train Ratio:** 95.2% (mock)

### 8.8 Supply Chain Health Panel

Displays four real-time metrics:
| Metric | Mock Value | Color |
|---|---|---|
| Shipping Index | 42/100 | Green |
| Energy Volatility | 28% | Yellow |
| Commodity Disruption | 35/100 | Green |
| Geopolitical Risk | 52/100 | Yellow |

### 8.9 Sentiment Analysis Panel

Country-level sentiment scores:
| Country | Sentiment | Trend |
|---|---|---|
| United States | +15% | Stable |
| China | -25% | Deteriorating |
| Germany | +10% | Improving |
| Japan | +20% | Stable |

### 8.10 Disclaimer

The page includes a prominent disclaimer stating that all signals are for informational purposes only, past performance does not guarantee future results, and all backtesting results are based on historical data.

---

## 9. Feature 6 — Company Trading Signal View

**File:** `src/components/company/CompanyTradingSignalView.tsx`

### 9.1 Overview

An embedded trading signal view within Company Mode (fourth tab). When a user is viewing a specific company, this component generates and displays a real-time trading signal for that company.

### 9.2 Props

| Prop | Type | Description |
|---|---|---|
| `ticker` | string | Stock ticker symbol |
| `companyName` | string | Full company name |
| `sector` | string | Industry sector |
| `cogriScore` | number | Current CO-GRI score |
| `riskLevel` | string | Risk classification |
| `countryExposures` | any[] | Geographic exposure data |
| `channelExposures` | any[] | Channel breakdown data |
| `structuralDrivers` | any[] | Structural risk drivers |

### 9.3 Signal Generation

On mount, calls `TradingEngine.generateSignalForTicker(ticker)` asynchronously. Shows a loading spinner during generation.

### 9.4 Display Sections

1. **Signal Banner** — BUY/SELL/HOLD with color coding
2. **Risk Metrics** — CO-GRI, Forecast Delta, Scenario Risk, Confidence
3. **Price Targets** — Current, Target, Stop Loss, Expected Return, Time Horizon
4. **Signal Drivers** — Four weighted factors with progress bars
5. **Rationale** — Bullet list of reasoning
6. **Action Buttons** — "View in Trading Mode", "Execute Trade"

### 9.5 Integration with Company Mode

This component receives `countryExposures`, `channelExposures`, and `structuralDrivers` as props — these are the CO-GRI channel data from the Company Mode analysis pipeline. However, in the current implementation, the `TradingEngine.generateSignalForTicker()` does not actually consume these props; it generates signals independently using mock CO-GRI calculations. The props are passed in for potential future integration.

---

## 10. Service Layer — TradingEngine

**File:** `src/services/engines/TradingEngine.ts`

### 10.1 Overview

The `TradingEngine` class is the core service providing:
- Signal generation for individual tickers and universes
- Portfolio optimization
- Backtesting

### 10.2 Signal Generation Pipeline

```
generateSignalForTicker(ticker)
  ├── calculateCOGRI(ticker)          → cogri: number [0-100]
  ├── calculateForecastDelta(ticker)  → forecastDelta: number [-10, +10]
  ├── calculateScenarioRisk(ticker)   → scenarioRisk: number [30-70]
  ├── determineSignalType(cogri, forecastDelta, scenarioRisk) → 'BUY'|'SELL'|'HOLD'
  ├── calculateSignalStrength(...)    → 'High'|'Medium'|'Low'
  ├── calculateConfidence(...)        → 'High'|'Medium'|'Low'
  ├── getCurrentPrice(ticker)         → price: number
  ├── calculatePriceTarget(...)       → target: number
  ├── calculateStopLoss(...)          → stopLoss: number
  ├── generateRationale(...)          → string[]
  └── calculateSignalDrivers(...)     → SignalDriver[]
```

### 10.3 Signal Type Determination

```typescript
riskScore = cogri + forecastDelta × 0.5 + scenarioRisk × 0.3

if (riskScore > 70) → SELL
if (riskScore < 40) → BUY
else               → HOLD
```

**Variables:**
- `cogri`: Current CO-GRI score [0–100]
- `forecastDelta`: Expected change in CO-GRI [-10, +10]
- `scenarioRisk`: Scenario stress test score [30–70]
- `riskScore`: Composite risk score

### 10.4 Signal Strength Calculation

```typescript
magnitude = |cogri - 55| + |forecastDelta|

if (magnitude > 25) → 'High'
if (magnitude > 15) → 'Medium'
else               → 'Low'
```

The threshold `55` represents the midpoint of the CO-GRI scale, so deviation from center drives strength.

### 10.5 Confidence Level Calculation

```typescript
consistency = 100 - |cogri - scenarioRisk|

if (consistency > 70) → 'High'
if (consistency > 40) → 'Medium'
else                  → 'Low'
```

Consistency measures alignment between the current CO-GRI score and the scenario risk score. High alignment = high confidence.

### 10.6 Price Target Calculation

```typescript
// BUY signal: +10% target
priceTarget = currentPrice × 1.10

// SELL signal: -10% target
priceTarget = currentPrice × 0.90

// HOLD signal: flat
priceTarget = currentPrice × 1.00
```

### 10.7 Stop Loss Calculation

```typescript
// BUY signal: -8% stop
stopLoss = currentPrice × 0.92

// SELL signal: +8% stop (short position)
stopLoss = currentPrice × 1.08

// HOLD signal: flat
stopLoss = currentPrice × 1.00
```

### 10.8 Weighted CO-GRI Calculation

```typescript
weightedCOGRI = Σ(cogri_i × weight_i) / Σ(weight_i)
```

Used for portfolio-level risk assessment.

### 10.9 Portfolio Optimization Algorithm

The optimization is simplified in the current implementation:

```typescript
optimizedHoldings = holdings.map(holding => ({
  ...holding,
  weight: holding.weight × (0.9 + random() × 0.2)  // ±10% random adjustment
}))
```

**Note:** This is a mock implementation. A production system would use Mean-Variance Optimization (Markowitz), Black-Litterman, or similar algorithms.

### 10.10 Efficient Frontier Generation

```typescript
for i in 0..19:
  risk = 10 + i × 2          // Risk: 10% to 48%
  return = 5 + i × 0.8 + noise  // Return: 5% to ~21%
  sharpe = return / risk
```

Generates 20 points along a simplified efficient frontier curve.

### 10.11 Equity Curve Generation

```typescript
for each week in [start_date, end_date]:
  strategyReturn = normal(mean=0, std=0.02) - 0.45 × 0.02
  portfolioValue × = (1 + strategyReturn)
  
  benchmarkReturn = normal(mean=0, std=0.015) - 0.48 × 0.015
  benchmarkValue × = (1 + benchmarkReturn)
```

The strategy has a slight positive drift (mean ≈ +0.01% per week), while the benchmark has a smaller drift.

### 10.12 Monthly Returns Generation

```typescript
for each month in [startYear, endYear]:
  return = (random() - 0.45) × 10  // Slightly positive skew
```

---

## 11. Service Layer — Enhanced Backtesting Engine

**File:** `src/services/tradingSignals/enhancedBacktesting.ts`

### 11.1 Overview

Provides comprehensive backtesting capabilities beyond the basic `TradingEngine`:
- Full performance metrics calculation
- Walk-forward analysis
- Monte Carlo simulation
- Market regime detection

### 11.2 Performance Metrics Calculation

**Input:** `trades: Trade[]`, `equityCurve: EquityPoint[]`, `riskFreeRate: number = 0.03`

#### Total Return
```
totalReturn = (finalEquity - initialEquity) / initialEquity
```

#### Annualized Return (CAGR)
```
years = (endDate - startDate) / (365.25 days)
annualizedReturn = (1 + totalReturn)^(1/years) - 1
```

#### Daily Returns
```
dailyReturn_i = (equity_i - equity_{i-1}) / equity_{i-1}
```

#### Volatility (Annualized)
```
meanReturn = Σ(dailyReturn_i) / N
variance = Σ(dailyReturn_i - meanReturn)² / N
volatility = √variance × √252
```

The factor √252 annualizes daily volatility (252 trading days per year).

#### Sharpe Ratio
```
excessReturn = annualizedReturn - riskFreeRate
sharpeRatio = excessReturn / volatility
```

Default `riskFreeRate = 3%`

#### Sortino Ratio
```
negativeReturns = [r for r in dailyReturns if r < 0]
downsideVariance = Σ(r²) / N_total    (N_total = all days, not just negative)
downsideDeviation = √downsideVariance × √252
sortinoRatio = excessReturn / downsideDeviation
```

Note: The denominator uses total N (not just negative days count) — this is a specific implementation choice.

#### Calmar Ratio
```
calmarRatio = annualizedReturn / maxDrawdown
```

#### Maximum Drawdown
```
peak = equity[0]
for each equity point:
  if equity > peak: peak = equity
  drawdown = (peak - equity) / peak
  maxDrawdown = max(maxDrawdown, drawdown)
```

#### Average Drawdown
```
avgDrawdown = Σ(drawdown_i for all drawdown points) / drawdownCount
```

#### Maximum Drawdown Duration
Tracks consecutive periods below peak:
```
currentDrawdownDuration++  (while below peak)
maxDrawdownDuration = max(maxDrawdownDuration, currentDrawdownDuration)
```

#### Win Rate
```
winRate = count(trades where pnl > 0) / totalTrades
```

#### Profit Factor
```
totalWins = Σ(pnl for winning trades)
totalLosses = |Σ(pnl for losing trades)|
profitFactor = totalWins / totalLosses
```

#### Average Win / Average Loss
```
avgWin = totalWins / winningTradeCount
avgLoss = totalLosses / losingTradeCount
```

#### Expectancy
```
expectancy = Σ(pnl_i) / totalTrades
```

Average P&L per trade.

### 11.3 Walk-Forward Analysis

**Parameters:**
- `trainWindowYears = 5` (default)
- `testWindowYears = 1` (default)
- `stepYears = 1` (default)

**Algorithm:**
```
currentDate = startDate + trainWindowYears

while currentDate < endDate:
  trainStart = currentDate - trainWindowYears
  trainEnd = currentDate
  testStart = currentDate
  testEnd = currentDate + testWindowYears
  
  trainResult = runBacktest(trainData, {rebalanceFrequency: 'weekly'})
  testResult = runBacktest(testData, {rebalanceFrequency: 'weekly'})
  
  periods.append({trainStart, trainEnd, testStart, testEnd,
                  trainMetrics, testMetrics})
  
  currentDate += stepYears
```

**Stability Score Calculation:**
```
testSharpes = [period.testMetrics.sharpeRatio for period in periods]
meanSharpe = Σ(testSharpes) / N
sharpeVariance = Σ(testSharpe - meanSharpe)² / N
stabilityScore = max(0, 100 × (1 - √sharpeVariance / meanSharpe))
```

Higher stability score = more consistent out-of-sample performance.

### 11.4 Monte Carlo Simulation

**Parameters:**
- `iterations = 1000` (default)
- `initialCapital = 100,000` (default)

**Algorithm (Bootstrap Resampling):**
```
for i in 1..iterations:
  sampledTrades = bootstrap_resample(historicalTrades)
  
  equity = initialCapital
  for trade in sampledTrades:
    equity += trade.pnl × (equity / initialCapital)  // Scale by current equity
  
  metrics = calculatePerformanceMetrics(sampledTrades, equityCurve)
  results.append({return: metrics.annualizedReturn, sharpe: metrics.sharpeRatio})
```

**Output Statistics:**
```
meanReturn = Σ(returns) / iterations
stdReturn = √(Σ(return - meanReturn)² / iterations)

meanSharpe = Σ(sharpes) / iterations
stdSharpe = √(Σ(sharpe - meanSharpe)² / iterations)

// 95% Confidence Intervals
sortedReturns = sort(returns)
return95 = [sortedReturns[2.5th percentile], sortedReturns[97.5th percentile]]
sharpe95 = [sortedSharpes[2.5th percentile], sortedSharpes[97.5th percentile]]

probabilityPositive = count(returns > 0) / iterations
probabilityOutperform = count(returns > 0.089) / iterations  // vs S&P 500 historical avg
```

---

## 12. Service Layer — Advanced Signal Generation

**File:** `src/services/tradingSignals/advancedSignalGeneration.ts`

### 12.1 Signal Generation from CO-GRI Score

**Phase 1 Optimized Thresholds:**

```
Base thresholds:
  longThreshold = 35    (was 30 in baseline)
  shortThreshold = 55   (was 60 in baseline)

Regime adjustments:
  Bull market: longThreshold += 5, shortThreshold += 5
  Bear market: longThreshold -= 5, shortThreshold -= 5

Volatility adjustment:
  volAdjustment = (volatility.percentile - 0.5) × 10  // Range: -5 to +5
  longThreshold += volAdjustment
  shortThreshold += volAdjustment

Signal generation:
  if cogriScore < longThreshold:
    signal = 'long'
    strength = min(100, (longThreshold - cogriScore) / longThreshold × 100)
  elif cogriScore > shortThreshold:
    signal = 'short'
    strength = min(100, (cogriScore - shortThreshold) / (100 - shortThreshold) × 100)
  else:
    signal = 'neutral'
    strength = 0
```

### 12.2 Multi-Timeframe Analysis

Generates signals for daily, weekly, and monthly CO-GRI scores, then computes a consensus:

**Timeframe Weights:**
- Daily: 30%
- Weekly: 40%
- Monthly: 30%

**Consensus Signal:**
```
longCount = count(signals == 'long')
shortCount = count(signals == 'short')

if longCount >= 2: consensusSignal = 'long', alignment = longCount/3
elif shortCount >= 2: consensusSignal = 'short', alignment = shortCount/3
else: consensusSignal = 'neutral', alignment = 0.33

consensusStrength = daily.strength × 0.3 + weekly.strength × 0.4 + monthly.strength × 0.3
```

**Timeframe Confidence Levels:**
- Daily: 0.70
- Weekly: 0.80
- Monthly: 0.90

### 12.3 Kelly Criterion Position Sizing

```
winLossRatio = avgWin / avgLoss
kellyFraction = (winRate × winLossRatio - (1 - winRate)) / winLossRatio

// Apply fractional Kelly (default 25%) for safety
position = max(0, min(1, kellyFraction × 0.25))
```

**Fractional Kelly:** Using 25% of full Kelly reduces risk of ruin while capturing most of the Kelly benefit.

### 12.4 Volatility-Adjusted Position Sizing

```
volAdjustment = targetVolatility / currentVolatility
adjustedPosition = basePosition × volAdjustment
adjustedPosition = max(0, min(1, adjustedPosition))
```

Default `targetVolatility = 15%`. If current volatility is high, position is reduced proportionally.

### 12.5 VIX-Based Position Scaling (Phase 1)

```
if vixLevel <= 25:
  return basePosition  // No adjustment

vixExcess = vixLevel - 25
reductionFactor = floor(vixExcess / 5) × 0.10  // 10% reduction per 5 VIX points above 25
scalingFactor = max(0.30, 1.0 - reductionFactor)  // Minimum 30% of base position

return basePosition × scalingFactor
```

**Examples:**
- VIX = 25: No reduction (100% of base)
- VIX = 30: 10% reduction (90% of base)
- VIX = 35: 20% reduction (80% of base)
- VIX = 50: 50% reduction (50% of base)
- VIX = 75: Maximum reduction (30% of base)

### 12.6 Correlation-Based Filtering (Phase 2)

```
correlatedExposure = 0
for position in existingPositions:
  correlation = |correlationMatrix[newSignal.ticker][position.ticker]|
  if correlation > maxCorrelation AND newSignal.signal == position.signal:
    correlatedExposure += position.positionSize

newCorrelatedExposure = correlatedExposure + newSignal.positionSize

if newCorrelatedExposure > maxCorrelatedExposure (40%):
  allowedSize = max(0, maxCorrelatedExposure - correlatedExposure)
  if allowedSize == 0: reject position
  else: reduce to allowedSize
```

**Parameters:**
- `maxCorrelation = 0.70` — threshold for "highly correlated"
- `maxCorrelatedExposure = 0.40` — maximum 40% of portfolio in correlated positions

### 12.7 Signal Combination (Momentum + Mean Reversion)

```
// Regime-based weights
if marketRegime == 'bull':
  cogriWeight = 0.5, momentumWeight = 0.4, meanReversionWeight = 0.1
elif marketRegime == 'bear':
  cogriWeight = 0.5, momentumWeight = 0.2, meanReversionWeight = 0.3
else (sideways):
  cogriWeight = 0.5, momentumWeight = 0.3, meanReversionWeight = 0.2

combinedScore = cogriScore × cogriWeight
              + momentumScore × momentumWeight
              + meanReversionScore × meanReversionWeight
```

---

## 13. Service Layer — Risk Management

**File:** `src/services/tradingSignals/riskManagement.ts`

### 13.1 Default Risk Limits

```typescript
DEFAULT_RISK_LIMITS = {
  maxPositionSize: 0.40,      // Phase 1: Updated from 0.35
  maxTotalExposure: 2.00,     // 200% gross exposure (allows leverage)
  maxDrawdown: 0.15,          // 15% portfolio drawdown limit
  maxCorrelation: 0.70,       // Max correlation between positions
  minDiversification: 3,      // Minimum uncorrelated positions
}
```

### 13.2 Kelly Criterion Position Sizing

```
b = avgWinPercent / avgLossPercent    // Win/loss ratio
p = winRate                           // Probability of winning
q = 1 - p                             // Probability of losing

kellyFraction = (b × p - q) / b

// Apply fractional Kelly (default 25%)
position = max(0, min(1, kellyFraction × fractionalKelly))
```

**Full Kelly formula derivation:**
The Kelly Criterion maximizes the expected logarithm of wealth. For a binary bet with win probability `p`, win ratio `b`:

```
f* = (bp - q) / b = p - q/b
```

### 13.3 Drawdown Limit Check

```
currentDrawdown = (peakEquity - currentEquity) / peakEquity

if currentDrawdown >= maxDrawdown (15%):
  block new positions
```

### 13.4 Portfolio Exposure Limits

```
// Check individual position
if newPosition.size > maxPositionSize (40%):
  reduce to maxPositionSize

// Check total exposure
longExposure = Σ(size for long positions)
shortExposure = Σ(size for short positions)
totalExposure = longExposure + shortExposure

if totalExposure + newPosition.size > maxTotalExposure (200%):
  reduce to remaining allowance
```

### 13.5 Diversification Score

```
for each pair (i, j) of positions:
  correlation = |correlationMatrix[ticker_i][ticker_j]|
  weight = size_i × size_j
  totalCorrelation += correlation × weight
  pairCount++

avgCorrelation = totalCorrelation / pairCount
diversificationScore = 1 - avgCorrelation
```

Range: 0 (perfectly correlated) to 1 (perfectly diversified).

### 13.6 Dynamic Stop-Loss Calculation

**Fixed Stop:**
```
// Long position
stopLoss = entryPrice × (1 - stopPercent)

// Short position
stopLoss = entryPrice × (1 + stopPercent)
```

**Volatility-Based Stop (ATR):**
```
stopDistance = ATR × atrMultiplier

// Long position
stopLoss = entryPrice - stopDistance

// Short position
stopLoss = entryPrice + stopDistance
```

**Trailing Stop:**
```
// Initial stop same as fixed
// Updated as price moves in favor:
stopDistance = max(0.08, min(0.12, volatility × 0.5))
trailingStop = currentPrice × (1 - stopDistance)
```

The trailing stop distance ranges from 8% to 12% based on volatility.

### 13.7 Portfolio Correlation Score (Phase 2)

```
for each pair (i, j):
  correlation = |correlationMatrix[ticker_i][ticker_j]|
  totalCorrelation += correlation
  pairCount++

portfolioCorrelation = totalCorrelation / pairCount
```

---

## 14. Service Layer — ML Training Pipeline

**File:** `src/services/tradingSignals/mlTraining.ts`

### 14.1 Overview

Phase 3 addition. Simulates a Gradient Boosting ML model training pipeline for enhancing trading signals.

### 14.2 Model Configuration

```typescript
TrainingConfig = {
  features: [
    'cogriScore',         // Primary CO-GRI score
    'channelExposures',   // Channel breakdown weights
    'volatility',         // Market volatility
    'momentum',           // Price momentum
    'sector',             // Industry sector
    'marketRegime',       // HMM-detected regime
    'vixLevel',           // VIX fear index
    'sentimentScore'      // Country sentiment
  ],
  targetVariable: 'return_30d',  // 30-day forward return
  validationSplit: 0.20,         // 20% held out for validation
  numTrees: 100,                 // Gradient boosting trees
  learningRate: 0.10,
  maxDepth: 6,
  minSamplesLeaf: 20
}
```

### 14.3 Simulated Model Performance

| Metric | Range | Description |
|---|---|---|
| Accuracy | 68–76% | Directional accuracy |
| Precision | 70–78% | Precision for positive predictions |
| Recall | 65–73% | Recall for positive predictions |
| F1 Score | 67–75% | Harmonic mean of precision/recall |
| Sharpe Improvement | 20–30% | Improvement over baseline strategy |
| Out-of-Sample R² | 15–25% | Explanatory power on unseen data |
| MAE | 2.5–3.5% | Mean absolute error |
| RMSE | 3.5–5.0% | Root mean squared error |
| Max Drawdown | 7.5–10% | Max drawdown with ML signals |
| Win Rate | 72–78% | Win rate with ML signals |

### 14.4 Walk-Forward Validation

```
trainWindowMonths = 60  (5 years)
testWindowMonths = 12   (1 year)

for each period:
  trainStart = startDate + i × testWindowMonths
  trainEnd = trainStart + trainWindowMonths
  testStart = trainEnd
  testEnd = testStart + testWindowMonths
  
  performance = trainModel(config for this period)
  periods.append({trainStart, trainEnd, testStart, testEnd, performance})
```

### 14.5 Overfitting Detection

```
degradation = (inSampleAccuracy - outOfSampleAccuracy) / inSampleAccuracy

if degradation > 0.15: overfitting = true  // >15% degradation
```

### 14.6 Retraining Triggers

| Condition | Urgency | Threshold |
|---|---|---|
| Accuracy drop | High | > 10% |
| Sharpe improvement drop | High | > 15% |
| Accuracy drop (moderate) | Medium | > 5% |
| Time since training | Low | > 90 days |

### 14.7 Feature Importance (Simulated)

| Feature | Importance |
|---|---|
| cogriScore | 35% |
| marketRegime | 20% |
| momentum | 15% |
| sentimentScore | 12% |
| volatility | 10% |
| vixLevel | 5% |
| channelExposures | 3% |

**Note:** Normalized to sum to 100%.

### 14.8 Training Report Metrics

```
avgAccuracy = Σ(period.accuracy) / numPeriods
avgSharpeImprovement = Σ(period.sharpeImprovement) / numPeriods

stdAccuracy = √(Σ(accuracy - avgAccuracy)² / numPeriods)
stabilityScore = max(0, 1 - stdAccuracy / avgAccuracy)
```

---

## 15. Service Layer — Supply Chain Monitor

**File:** `src/services/tradingSignals/supplyChainMonitor.ts`

### 15.1 Overview

Phase 3 addition. Monitors global supply chain conditions and identifies disruptions that could affect CO-GRI scores and trading signals.

### 15.2 Data Sources

| Source | Data | Status |
|---|---|---|
| Freightos Baltic Index | Shipping rates by route | Live API (with fallback) |
| Port Status APIs | Vessel wait times, capacity utilization | Live API (with fallback) |
| Commodity Price Feeds | Oil, gas, metals prices | Live API (with fallback) |
| Static/Simulated | All of the above | Fallback when APIs unavailable |

### 15.3 Supply Chain Metrics

```typescript
SupplyChainMetrics = {
  shippingIndex: number,         // 0-100 (higher = more disruption)
  energyPriceVolatility: number, // Annualized volatility
  commodityDisruption: number,   // 0-100
  geopoliticalRisk: number,      // 0-100
  portCongestion: Record<string, number>,    // Port → congestion score
  tradeRouteStatus: Record<string, number>,  // Route → health score
}
```

### 15.4 Shipping Index Calculation

```
avgShippingRate = Σ(route.rate) / numRoutes
historicalAvgRate = 2500  // Baseline

shippingIndex = min(100, max(0, (avgShippingRate / historicalAvgRate - 0.5) × 100))
```

When rates are at historical average (2500), index = 50. Higher rates push index toward 100.

### 15.5 Port Congestion Score

```
congestionLevelScores = {low: 20, moderate: 50, high: 75, severe: 95}

baseScore = congestionLevelScores[port.congestionLevel]
waitTimeScore = min(100, port.vesselWaitDays × 20)
dwellTimeScore = min(100, port.containerDwellTime × 15)
utilizationScore = port.capacityUtilization

portCongestion = baseScore × 0.40
              + waitTimeScore × 0.25
              + dwellTimeScore × 0.15
              + utilizationScore × 0.20
```

### 15.6 Commodity Disruption Score

```
avgAbsChange = Σ(|commodity.changePercent|) / numCommodities
commodityDisruption = min(100, avgAbsChange × 15)
```

### 15.7 Disruption Detection Thresholds

| Disruption Type | Trigger Condition | Confidence (Live) | Confidence (Static) |
|---|---|---|---|
| Shipping | shippingIndex > 60 | 90% | 75% |
| Energy | energyPriceVolatility > 0.40 | 85% | 70% |
| Commodity | commodityDisruption > 50 | 82% | 65% |
| Geopolitical | geopoliticalRisk > 65 | — | — |

### 15.8 Simulated Port Congestion Values (Fallback)

| Port | Congestion Score |
|---|---|
| Los Angeles | 55–75 |
| Long Beach | 50–70 |
| Shanghai | 30–45 |
| Shenzhen | 25–40 |
| Rotterdam | 35–50 |
| Hamburg | 40–60 |
| Singapore | 25–35 |
| Busan | 30–45 |

### 15.9 Simulated Trade Route Health (Fallback)

| Route | Health Score |
|---|---|
| China–US West Coast | 65–85 |
| China–US East Coast | 60–80 |
| China–Europe | 70–85 |
| Europe–US East Coast | 75–90 |
| Asia–Mediterranean | 70–85 |
| Intra-Asia | 80–90 |

---

## 16. State Management — tradingState.ts

**File:** `src/store/tradingState.ts`

### 16.1 State Shape

```typescript
TradingState = {
  // Signals
  signals: TradingSignal[],
  selectedSignal: TradingSignal | null,
  signalFilters: SignalFilters,
  signalSort: SignalSort,
  
  // Portfolio
  currentPortfolio: Portfolio | null,
  optimizationResult: OptimizationResult | null,
  isOptimizing: boolean,
  
  // Backtest
  backtestResult: BacktestResult | null,
  isBacktesting: boolean,
  backtestProgress: number,  // 0-100
  
  // UI
  activeTab: 'signals' | 'portfolio' | 'backtest',
  
  // Error
  error: string | null,
}
```

### 16.2 Default Filter State

```typescript
signalFilters = {
  signal_types: ['BUY', 'SELL', 'HOLD'],  // All types shown
  confidence_threshold: 0,                  // No minimum confidence
  sectors: [],                              // All sectors shown
}
```

### 16.3 Default Sort State

```typescript
signalSort = {
  sort_by: 'signal_strength',
  order: 'desc',
}
```

### 16.4 Async Actions

**generateSignals(universe):**
```
1. Clear error
2. Import TradingEngine dynamically
3. Call engine.generateSignals(universe)
4. Store signals in state
5. On error: store error message
```

**optimizePortfolio(portfolio, settings):**
```
1. Set isOptimizing = true, clear error
2. Import TradingEngine dynamically
3. Call engine.optimizePortfolio(portfolio, settings)
4. Store result in optimizationResult
5. Set isOptimizing = false
6. On error: store error, set isOptimizing = false
```

**runBacktest(config):**
```
1. Set isBacktesting = true, backtestProgress = 0, clear error
2. Import TradingEngine dynamically
3. Call engine.runBacktest(config, progressCallback)
4. Progress callback updates backtestProgress
5. Store result in backtestResult
6. Set isBacktesting = false, backtestProgress = 100
7. On error: store error, reset flags
```

---

## 17. Type System — trading.ts

**File:** `src/types/trading.ts`

### 17.1 Core Enumerations

```typescript
SignalType = 'BUY' | 'SELL' | 'HOLD'
SignalStrength = 'High' | 'Medium' | 'Low'
ConfidenceLevel = 'High' | 'Medium' | 'Low'
OptimizationObjective = 'Minimize Risk' | 'Maximize Return' | 'Maximize Sharpe'
RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive'
RebalancingFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
StrategyType = 'CO-GRI Momentum' | 'Mean Reversion' | 'CO-GRI + Forecast' | 'Custom'
UniverseType = 'S&P 500' | 'Russell 2000' | 'Custom'
SignalSortBy = 'signal_strength' | 'confidence' | 'cogri' | 'expected_return' | 'generated_at'
SortOrder = 'asc' | 'desc'
```

### 17.2 TradingSignal Interface

```typescript
TradingSignal = {
  signal_id: string,              // Unique ID: "{ticker}-{timestamp}"
  ticker: string,
  company_name: string,
  signal_type: SignalType,
  signal_strength: SignalStrength,
  confidence: ConfidenceLevel,
  confidence_score: number,       // [0-100]
  
  current_cogri: number,          // Current CO-GRI score
  forecast_delta_cogri: number,   // Expected change in CO-GRI
  scenario_risk_score: number,    // Scenario stress test score
  
  current_price: number,
  price_target: number,
  stop_loss: number,
  expected_return: number,        // Percentage
  time_horizon: string,           // "3-6 months"
  
  rationale: string[],
  signal_drivers: SignalDriver[],
  
  generated_at: Date,
  sector: string,
}
```

### 17.3 SignalDriver Interface

```typescript
SignalDriver = {
  factor: string,
  weight: number,           // [0-1], sum to 1.0
  direction: 'Positive' | 'Negative' | 'Neutral',
  explanation: string,
}
```

### 17.4 Portfolio Interface

```typescript
Portfolio = {
  portfolio_id: string,
  name: string,
  holdings: Holding[],
  total_value: number,
  weighted_cogri: number,
  risk_score: number,
  created_at: Date,
  updated_at: Date,
}

Holding = {
  ticker: string,
  company_name: string,
  shares: number,
  price: number,
  value: number,
  weight: number,     // Percentage
  cogri: number,
  sector: string,
}
```

### 17.5 OptimizationSettings Interface

```typescript
OptimizationSettings = {
  objective: OptimizationObjective,
  cogri_weight: number,           // [0-100]
  risk_tolerance: RiskTolerance,
  rebalancing_frequency: RebalancingFrequency,
  max_position_size: number,      // Percentage
  min_position_size: number,      // Percentage
  max_sector_exposure: number,    // Percentage
  min_holdings: number,
  max_holdings: number,
  transaction_costs: number,      // Percentage
  tax_loss_harvesting: boolean,
  esg_screening: boolean,
}
```

### 17.6 BacktestConfig Interface

```typescript
BacktestConfig = {
  strategy: StrategyType,
  universe: UniverseType,
  custom_tickers?: string[],
  start_date: Date,
  end_date: Date,
  rebalancing_frequency: RebalancingFrequency,
  initial_capital: number,
  transaction_costs: number,
  momentum_lookback?: number,      // Days
  mean_reversion_threshold?: number,
  forecast_weight?: number,        // [0-1]
}
```

### 17.7 BacktestPerformance Interface

```typescript
BacktestPerformance = {
  total_return: number,
  annualized_return: number,
  volatility: number,
  sharpe_ratio: number,
  max_drawdown: number,
  win_rate: number,
  profit_factor: number,
  total_trades: number,
  winning_trades: number,
  losing_trades: number,
}
```

### 17.8 BenchmarkComparison Interface

```typescript
BenchmarkComparison = {
  benchmark_name: string,         // "S&P 500"
  strategy_return: number,
  benchmark_return: number,
  alpha: number,
  beta: number,
  information_ratio: number,
  tracking_error: number,
}
```

---

## 18. Mock Data Generator

**File:** `src/services/mockData/tradingDataGenerator.ts`

### 18.1 Signal Generation

`generateMockSignals(count = 25)` generates signals for the first `count` tickers from `POPULAR_TICKERS`.

**Signal Type Distribution:**
```
BUY:  floor(count × 0.40) = 10 signals
SELL: floor(count × 0.30) = 7 signals
HOLD: ceil(count × 0.30)  = 8 signals
```

**Signal Strength Distribution:**
```
High:   random < 0.20  → 20% of signals
Medium: random < 0.70  → 50% of signals
Low:    random >= 0.70 → 30% of signals
```

**Confidence Distribution:**
```
High:   random < 0.30  → 30% of signals
Medium: random < 0.80  → 50% of signals
Low:    random >= 0.80 → 20% of signals
```

**Price Target Calculation:**
```
BUY:  priceTarget = currentPrice × (1.08 + random × 0.12)  // +8% to +20%
SELL: priceTarget = currentPrice × (0.88 + random × 0.08)  // -12% to -4%
HOLD: priceTarget = currentPrice × (0.98 + random × 0.04)  // -2% to +2%
```

**Stop Loss Calculation:**
```
BUY:  stopLoss = currentPrice × (0.88 + random × 0.08)  // -12% to -4%
SELL: stopLoss = currentPrice × (1.08 + random × 0.08)  // +8% to +16%
HOLD: stopLoss = currentPrice × (0.92 + random × 0.08)  // -8% to 0%
```

**Signal Timestamp:**
```
generated_at = now() - random × 7 days  // Within last week
```

### 18.2 Ticker Universe

20 tickers across 6 sectors:

| Sector | Tickers |
|---|---|
| Technology | AAPL, MSFT, GOOGL, META, NVDA, INTC, CSCO |
| Consumer Discretionary | AMZN, TSLA, HD |
| Financials | JPM, V, BAC |
| Consumer Staples | WMT, PG |
| Healthcare | JNJ, UNH, PFE |
| Communication Services | DIS, NFLX |

### 18.3 Equity Curve Generation (COGRITradingSignalService)

```
for each week from 1985-01-01 to 2025-12-31:
  strategyReturn = 0.189/52 + (random - 0.5) × 0.028
  equity × = (1 + strategyReturn)
  
  benchmarkReturn = 0.089/52 + (random - 0.5) × 0.060
  benchmark × = (1 + benchmarkReturn)
  
  drawdown = (peak - equity) / peak
```

- Strategy annual drift: 18.9% (Phase 3 performance)
- Benchmark annual drift: 8.9% (S&P 500 historical)
- Strategy weekly noise: ±1.4%
- Benchmark weekly noise: ±3.0%

### 18.4 Monthly Returns Generation

```
for year in 1985..2025:
  for month in 0..11:
    return = (random - 0.38) × 0.08  // Slightly positive skew
```

Range: approximately -3% to +5% per month.

### 18.5 Rolling Metrics Generation

```
for i in 0..449 (months from 1988):
  date = 1988-01-01 + i × 30 days
  return = 0.16 + random × 0.08          // 16-24% annualized
  sharpeRatio = 1.1 + random × 0.35      // 1.1-1.45
  maxDrawdown = 0.04 + random × 0.06     // 4-10%
  winRate = 0.68 + random × 0.08         // 68-76%
```

### 18.6 Trade Distribution Generation

```
for i in 0..499:
  pnl = (random - 0.35) × 8000          // Slightly positive skew
  pnlPercent = (random - 0.35) × 0.08
  cogriScore = 35 + random × 30
  direction = random > 0.5 ? 'long' : 'short'
```

### 18.7 Parameter Sensitivity Generation

**Long Threshold Sensitivity (20–40, step 2):**
```
sharpeRatio = 1.0 + (35 - |i - 35|) × 0.025   // Peak at i=35
```

**Short Threshold Sensitivity (50–70, step 2):**
```
sharpeRatio = 1.0 + (55 - |i - 55|) × 0.025   // Peak at i=55
```

**Position Size Sensitivity (20–50%, step 5):**
```
sharpeRatio = 1.0 + (40 - |i - 40|) × 0.030   // Peak at i=40%
```

---

## 19. Mathematical Calculations Reference

### 19.1 Sharpe Ratio

**Formula:**
```
S = (R_p - R_f) / σ_p
```

**Variables:**
- `R_p`: Annualized portfolio return
- `R_f`: Risk-free rate (default: 3%)
- `σ_p`: Annualized portfolio volatility

**Calculation Steps:**
1. Calculate daily returns: `r_t = (P_t - P_{t-1}) / P_{t-1}`
2. Calculate mean daily return: `μ = Σ(r_t) / N`
3. Calculate daily variance: `σ²_daily = Σ(r_t - μ)² / N`
4. Annualize: `σ_annual = √σ²_daily × √252`
5. Calculate CAGR: `R_p = (P_final/P_initial)^(1/years) - 1`
6. Apply formula: `S = (R_p - 0.03) / σ_annual`

**Output Range:** Typically -3 to +3; > 1.0 is considered good; > 2.0 is excellent

---

### 19.2 Sortino Ratio

**Formula:**
```
Sortino = (R_p - R_f) / σ_d
```

**Variables:**
- `R_p`: Annualized return
- `R_f`: Risk-free rate (3%)
- `σ_d`: Annualized downside deviation

**Downside Deviation Calculation:**
```
negativeReturns = [r_t for r_t in dailyReturns if r_t < 0]
downsideVariance = Σ(r_t²) / N_total    // N_total = ALL days
σ_d = √downsideVariance × √252
```

**Note:** The implementation divides by total N (not just negative days), which is the MAR (Minimum Acceptable Return = 0) variant.

**Output:** Higher is better; > 1.0 is good; Phase 3 achieves 1.78

---

### 19.3 Calmar Ratio

**Formula:**
```
Calmar = R_annual / |MaxDrawdown|
```

**Variables:**
- `R_annual`: Annualized return
- `MaxDrawdown`: Maximum peak-to-trough decline (absolute value)

**Output:** Higher is better; Phase 3 achieves 2.31

---

### 19.4 Maximum Drawdown

**Formula:**
```
MDD = max over all t of [(Peak_t - Trough_t) / Peak_t]
```

**Algorithm:**
```
peak = equity[0]
MDD = 0
for each equity point P_t:
  if P_t > peak: peak = P_t
  drawdown = (peak - P_t) / peak
  MDD = max(MDD, drawdown)
```

**Output:** Range [0, 1]; Phase 3 achieves 8.2% (0.082)

---

### 19.5 Volatility (Annualized)

**Formula:**
```
σ_annual = σ_daily × √252
```

**Calculation:**
```
μ = Σ(r_t) / N
σ²_daily = Σ(r_t - μ)² / N
σ_daily = √σ²_daily
σ_annual = σ_daily × √252
```

**Annualization Factor:** √252 assumes 252 trading days per year.

---

### 19.6 Composite Risk Score (Signal Generation)

**Formula:**
```
riskScore = cogri + forecastDelta × 0.5 + scenarioRisk × 0.3
```

**Variables:**
- `cogri`: Current CO-GRI score [0–100]
- `forecastDelta`: Expected CO-GRI change [-10, +10]
- `scenarioRisk`: Scenario stress score [30–70]

**Signal Thresholds:**
```
riskScore > 70 → SELL
riskScore < 40 → BUY
40 ≤ riskScore ≤ 70 → HOLD
```

---

### 19.7 Weighted CO-GRI

**Formula:**
```
WCOGRI = Σ(cogri_i × weight_i) / Σ(weight_i)
```

**Variables:**
- `cogri_i`: CO-GRI score for holding i
- `weight_i`: Portfolio weight of holding i (as percentage)

**Used In:** Portfolio risk assessment, optimization objective

---

### 19.8 Kelly Criterion

**Formula:**
```
f* = (b × p - q) / b
```

**Variables:**
- `f*`: Optimal fraction of capital to bet
- `b`: Win/loss ratio = avgWin / avgLoss
- `p`: Win probability
- `q`: Loss probability = 1 - p

**Fractional Kelly (applied):**
```
position = max(0, min(1, f* × 0.25))
```

Using 25% of full Kelly reduces variance while retaining most of the growth benefit.

---

### 19.9 Profit Factor

**Formula:**
```
PF = Σ(winning trade P&L) / |Σ(losing trade P&L)|
```

**Interpretation:**
- PF = 1.0: Break even
- PF > 1.0: Profitable
- PF > 2.0: Good
- PF > 3.0: Excellent (Phase 3 achieves 3.24)

---

### 19.10 Expectancy

**Formula:**
```
E = Σ(P&L_i) / N_trades
```

Average P&L per trade. Phase 3: $0.0156 per dollar invested per trade.

---

### 19.11 Information Ratio

**Formula:**
```
IR = α / TE
```

**Variables:**
- `α`: Alpha (excess return over benchmark)
- `TE`: Tracking error = std dev of (strategy return - benchmark return)

**Mock Value:** 0.48

---

### 19.12 Beta

**Formula:**
```
β = Cov(R_p, R_b) / Var(R_b)
```

**Variables:**
- `R_p`: Portfolio returns
- `R_b`: Benchmark returns

**Mock Value:** 0.92 (slightly below market)

---

### 19.13 Alpha

**Formula:**
```
α = R_p - [R_f + β × (R_b - R_f)]
```

**Variables:**
- `R_p`: Portfolio return
- `R_f`: Risk-free rate
- `β`: Portfolio beta
- `R_b`: Benchmark return

**Mock Value:** +6.3%

---

### 19.14 VIX Position Scaling

**Formula:**
```
if VIX ≤ 25: scalingFactor = 1.0
else:
  reductionFactor = floor((VIX - 25) / 5) × 0.10
  scalingFactor = max(0.30, 1.0 - reductionFactor)

adjustedPosition = basePosition × scalingFactor
```

---

### 19.15 Signal Strength Magnitude

**Formula:**
```
magnitude = |cogri - 55| + |forecastDelta|

High:   magnitude > 25
Medium: magnitude > 15
Low:    magnitude ≤ 15
```

The midpoint 55 is used as the "neutral" CO-GRI level.

---

### 19.16 Confidence Consistency

**Formula:**
```
consistency = 100 - |cogri - scenarioRisk|

High:   consistency > 70
Medium: consistency > 40
Low:    consistency ≤ 40
```

Measures how closely the current CO-GRI aligns with the scenario risk score.

---

### 19.17 Walk-Forward Stability Score

**Formula:**
```
testSharpes = [period.testSharpe for period in periods]
μ_sharpe = Σ(testSharpes) / N
σ_sharpe = √(Σ(testSharpe - μ_sharpe)² / N)
stabilityScore = max(0, 100 × (1 - σ_sharpe / μ_sharpe))
```

This is essentially `100 × (1 - CV)` where CV is the coefficient of variation of test Sharpe ratios. Higher = more stable out-of-sample performance.

---

### 19.18 Port Congestion Score

**Formula:**
```
score = baseScore × 0.40
      + waitTimeScore × 0.25
      + dwellTimeScore × 0.15
      + utilizationScore × 0.20

where:
  baseScore = {low: 20, moderate: 50, high: 75, severe: 95}
  waitTimeScore = min(100, vesselWaitDays × 20)
  dwellTimeScore = min(100, containerDwellTime × 15)
  utilizationScore = capacityUtilization (0-100)
```

---

## 20. CO-GRI Integration in Trading Dashboard

### 20.1 How CO-GRI Feeds into Trading Signals

The CO-GRI score is the **primary input** to all trading signal generation in the dashboard:

```
CO-GRI Score (0-100)
    ↓
Composite Risk Score = cogri + forecastDelta × 0.5 + scenarioRisk × 0.3
    ↓
Signal Type: BUY (<40) / HOLD (40-70) / SELL (>70)
    ↓
Signal Strength: magnitude = |cogri - 55| + |forecastDelta|
    ↓
Position Size: Kelly Criterion × VIX Scaling × Volatility Adjustment
```

### 20.2 CO-GRI in Portfolio Optimization

The `weighted_cogri` metric is central to portfolio optimization:
- It is displayed as the primary risk metric for any portfolio
- The CO-GRI Weight slider (0–100%) in OptimizationSettings controls how much the optimizer prioritizes reducing geopolitical risk vs. financial metrics
- The optimization objective "Minimize Risk" primarily targets reducing weighted CO-GRI

### 20.3 CO-GRI in Backtesting

The CO-GRI Momentum strategy (default backtest strategy) uses CO-GRI scores as the primary signal:
- **Long signal:** CO-GRI < longThreshold (35 in Phase 1+)
- **Short signal:** CO-GRI > shortThreshold (55 in Phase 1+)
- The 40-year backtest (1985–2025) demonstrates the strategy's historical effectiveness

### 20.4 Cross-Reference with Previous Reports

Based on the codebase analysis, the following connections exist between the Trading Dashboard and previously documented CO-GRI components:

| CO-GRI Component | File | Trading Dashboard Usage |
|---|---|---|
| CO-GRI Score | `cogriCalculationService.ts` | Primary signal input; `TradingEngine.calculateCOGRI()` is a mock that would integrate with this |
| Geographic Exposure | `geographicExposureService.ts` | Passed as props to `CompanyTradingSignalView`; used in ticker analysis geographic breakdown |
| Company Exposures | `companySpecificExposures.ts` | Source of per-ticker CO-GRI scores used in `generateTickerAnalysis()` |
| Channel Priors | `channelPriors.ts` | Channel exposures are listed as ML features (`channelExposures`) in `mlTraining.ts` |
| SEC Filing Data | `geographicExposureService.ts` | Would feed into CO-GRI scores that drive signals; currently mocked |

### 20.5 Integration Gap

The current implementation has a **mock integration gap**: `TradingEngine.calculateCOGRI()` generates random CO-GRI scores rather than calling the actual `cogriCalculationService.ts`. The `CompanyTradingSignalView` receives real CO-GRI data as props but the `TradingEngine` does not consume them. A production integration would wire `TradingEngine` to call the actual CO-GRI calculation pipeline.

---

## 21. Phase Evolution Summary

The CO-GRI Trading Signal Service tracks four phases of strategy improvement:

### Phase Baseline
- Signal thresholds: Long < 30, Short > 60
- Max position size: 35%
- Rebalancing: Monthly
- No ML overlay
- No supply chain monitoring

### Phase 1 (February 2026)
**Changes:**
- Long threshold: 30 → 35 (+2.3% Sharpe improvement)
- Short threshold: 60 → 55 (+1.8% Sharpe improvement)
- Max position size: 35% → 40%
- Added VIX-based position scaling (10% reduction per 5 VIX points above 25)
- Rebalancing: Monthly → Weekly (+5.1% Sharpe improvement)

**Net Sharpe Improvement:** +15.4% (0.78 → 0.90)

### Phase 2 (February 2026)
**Changes:**
- Dynamic channel weighting based on market regime (VIX-based)
- Sector-specific channel weight adjustments
- Correlation-based diversification (40% max correlated exposure)
- Dynamic trailing stop-loss (8–12% based on volatility)
- Time-based exit rules

**Net Sharpe Improvement:** +20.0% (0.90 → 1.08)

### Phase 3 (February 2026)
**Changes:**
- Gradient Boosting ML overlay
- Hidden Markov Model 5-state regime detection
- Real-time supply chain disruption monitoring
- Sentiment analysis for countries with >20% exposure
- Feature importance: CO-GRI 35%, Market Regime 20%, Momentum 15%

**Net Sharpe Improvement:** +17.6% (1.08 → 1.27)

**Cumulative Improvement from Baseline:** +62.8%

---

## 22. Data Flow Diagrams

### 22.1 Signal Generation Flow

```
User opens Trading Mode
        ↓
generateMockSignals(25)
        ↓
For each ticker:
  cogri = 40 + random × 40
  forecastDelta = (random - 0.5) × 20
  scenarioRisk = 30 + random × 40
        ↓
  riskScore = cogri + forecastDelta × 0.5 + scenarioRisk × 0.3
        ↓
  signalType = BUY | SELL | HOLD
  signalStrength = High | Medium | Low
  confidence = High | Medium | Low
        ↓
  currentPrice = 50 + random × 400
  priceTarget = currentPrice × multiplier
  stopLoss = currentPrice × multiplier
        ↓
  rationale = [text bullets]
  signalDrivers = [4 factors with weights]
        ↓
TradingSignal object stored in Zustand
        ↓
SignalCardsGrid renders filtered/sorted cards
        ↓
User clicks card → SignalDetailsPanel renders
```

### 22.2 Portfolio Optimization Flow

```
User loads sample portfolio (Conservative/Balanced/Aggressive)
        ↓
Portfolio stored in Zustand currentPortfolio
        ↓
User configures OptimizationSettings
        ↓
User clicks "Optimize Portfolio"
        ↓
TradingEngine.optimizePortfolio(portfolio, settings)
        ↓
calculatePortfolioMetrics(original) → originalMetrics
        ↓
runOptimizationAlgorithm(portfolio, settings)
  → holdings.map(h => ({...h, weight: h.weight × (0.9 + random × 0.2)}))
        ↓
calculatePortfolioMetrics(optimized) → optimizedMetrics
        ↓
improvements = {
  risk_reduction: (orig.risk - opt.risk) / orig.risk × 100,
  return_improvement: (opt.return - orig.return) / orig.return × 100,
  sharpe_improvement: (opt.sharpe - orig.sharpe) / orig.sharpe × 100
}
        ↓
generateTrades(original, optimized) → trade list
        ↓
generateEfficientFrontier() → 20 frontier points
        ↓
OptimizationResult stored in Zustand
        ↓
OptimizationResults component renders comparison
```

### 22.3 Backtest Flow

```
User configures BacktestConfig
  (strategy, universe, dates, capital, costs)
        ↓
User clicks "Run Backtest"
        ↓
TradingEngine.runBacktest(config, progressCallback)
        ↓
Generate equity curve (weekly steps)
Generate drawdown series
Generate monthly returns
Generate performance attribution
Generate benchmark comparison
        ↓
BacktestResult = {
  performance: {total_return, sharpe, max_drawdown, ...},
  equity_curve: [...],
  attribution: {by_sector, by_signal_type, by_time_period},
  benchmark: {alpha, beta, information_ratio, ...}
}
        ↓
progressCallback(100)
        ↓
BacktestResult stored in Zustand
        ↓
BacktestResults renders:
  - Performance summary grid
  - Equity curve chart (Recharts)
  - Benchmark comparison panel
  - Attribution tables
```

---

## 23. Limitations and Known Gaps

### 23.1 Mock Data vs. Real Data

| Component | Current State | Production Requirement |
|---|---|---|
| CO-GRI scores in TradingEngine | Random mock values | Integrate with `cogriCalculationService.ts` |
| Price data | Random mock values | Live market data API (Alpha Vantage, Bloomberg) |
| Forecast delta | Random mock values | Integrate with ForecastEngine |
| Scenario risk | Random mock values | Integrate with ScenarioEngine |
| Portfolio optimization | Random weight adjustment | Mean-Variance Optimization, Black-Litterman |
| Backtest trades | Empty array | Full historical simulation |

### 23.2 Stub Features

| Feature | Status |
|---|---|
| "Execute Trade" button | Stub — no broker integration |
| "Export Results" button | Console.log only |
| "Export Signals" button | Console.log only |
| "Import CSV" button | No implementation |
| "Add Holding" button | No implementation |
| "Apply Recommendations" button | Stub |

### 23.3 Integration Gaps

1. **CO-GRI → TradingEngine:** `TradingEngine.calculateCOGRI()` generates random values instead of calling the actual CO-GRI pipeline
2. **CompanyTradingSignalView props:** Receives `countryExposures`, `channelExposures`, `structuralDrivers` but does not pass them to `TradingEngine`
3. **ML Model:** `mlTraining.ts` simulates training results; no actual ML model is trained or loaded
4. **Supply Chain → Signals:** `supplyChainMonitor.ts` detects disruptions but they are not wired into signal generation in `TradingEngine`
5. **Sentiment → Signals:** Sentiment scores shown in UI but not consumed by signal generation logic

### 23.4 Data Consistency

- The `COGRITradingSignalService.tsx` page and `TradingMode.tsx` are separate pages with separate data pipelines — they do not share state
- The `BacktestingDashboard.tsx` component uses a different backtesting engine (`backtestingEngine` from `src/services/csi/`) than the `TradingEngine.runBacktest()` used in `TradingMode.tsx`

### 23.5 Performance Metrics Accuracy

The 40-year backtest results (1985–2025) displayed in `COGRITradingSignalService.tsx` are **hardcoded mock values**, not derived from actual historical simulation. The equity curve and monthly returns are generated with random noise around target drift rates.

---

*End of Report*

**Report generated by:** David (Data Analyst, Atoms Team)  
**Date:** 2026-04-15  
**Source files audited:** 38 files across pages, components, services, store, and types  
**Lines of code reviewed:** ~5,000+ lines  
**Report length:** Comprehensive — covers all features, all formulas, all data flows