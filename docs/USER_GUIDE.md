# CO-GRI Platform User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Platform Overview](#platform-overview)
4. [Mode-by-Mode Guide](#mode-by-mode-guide)
5. [FAQ](#faq)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

The CO-GRI (Corporate Geopolitical Risk Index) Platform is a comprehensive geopolitical risk analysis system that helps investors, analysts, and corporate decision-makers understand, quantify, and act on geopolitical risks affecting companies and portfolios.

### What is CO-GRI?

CO-GRI is a proprietary metric (0-100 scale) that quantifies a company's exposure to geopolitical risks based on:
- **Geographic exposure**: Where the company operates and generates revenue
- **Supply chain dependencies**: Critical suppliers and logistics networks
- **Physical assets**: Factories, offices, and infrastructure locations
- **Financial exposure**: Banking relationships and currency risks

### Value Proposition

- **Quantify the unquantifiable**: Convert geopolitical events into measurable risk scores
- **Forward-looking analysis**: Forecast how future events will impact your investments
- **Scenario planning**: Test portfolio resilience under various geopolitical shocks
- **Actionable insights**: Generate trading signals based on geopolitical risk analysis

---

## Getting Started

### Accessing the Platform

1. Navigate to the CO-GRI Platform homepage
2. The platform loads with five operational modes accessible via the top navigation bar
3. No login required for the demo version

### Platform Navigation

The platform consists of five interconnected modes:

```
┌─────────────────────────────────────────────────────────────┐
│  Country | Company | Forecast | Scenario | Trading          │
└─────────────────────────────────────────────────────────────┘
```

- **Country Mode**: Analyze geopolitical risk at the country level
- **Company Mode**: Deep-dive into individual company risk profiles
- **Forecast Mode**: View 6-month forward-looking risk outlook
- **Scenario Mode**: Build and test custom geopolitical scenarios
- **Trading Mode**: Generate trading signals and optimize portfolios

---

## Platform Overview

### Key Concepts

#### CO-GRI Score (0-100)
- **0-30**: Low Risk (Green) - Stable, low geopolitical exposure
- **30-50**: Moderate Risk (Yellow) - Some exposure, manageable
- **50-70**: High Risk (Orange) - Significant exposure, requires monitoring
- **70-100**: Critical Risk (Red) - Severe exposure, immediate attention needed

#### Risk Channels
The platform analyzes four transmission channels:
1. **Revenue Channel**: Sales disruptions, market access restrictions
2. **Supply Chain Channel**: Supplier disruptions, logistics constraints
3. **Physical Assets Channel**: Asset seizures, infrastructure damage
4. **Financial Channel**: Banking sanctions, currency volatility

#### Time Horizons
- **Structural**: Current baseline risk (as of today)
- **Forecast**: 6-month forward outlook
- **Scenario**: Custom time horizon (user-defined)
- **Trading**: Various horizons (1M, 3M, 6M, 1Y)

---

## Mode-by-Mode Guide

### 1. Country Mode

**Purpose**: Analyze geopolitical risk at the country level

**Key Features**:
- Country risk rankings and comparisons
- Historical risk trends
- Regional risk maps
- Country-specific risk drivers

**How to Use**:
1. Select a country from the dropdown or click on the map
2. View the country's CO-GRI score and risk level
3. Explore risk drivers (political stability, sanctions, conflicts)
4. Compare with peer countries in the region
5. View historical trends to understand risk trajectory

**Use Cases**:
- Market entry decisions
- Country allocation in global portfolios
- Supply chain risk assessment
- Regulatory compliance monitoring

---

### 2. Company Mode

**Purpose**: Deep-dive analysis of individual company geopolitical risk

**Four-Tab Structure**:

#### Tab 1: Structural (Baseline Analysis)
- **What it shows**: Current CO-GRI score based on company's geographic footprint
- **Key components**:
  - Company Summary Panel (C1): Overview, score, risk level
  - CO-GRI Trend Chart (C2): Historical score evolution
  - Risk Contribution Map (C3): Geographic heat map
  - Exposure Pathways (C4): Channel-specific exposure breakdown
  - Top Relevant Risks (C5): Key structural risk drivers
  - Peer Comparison (C6): Benchmark against competitors
  - Risk Attribution (C7): Country-by-country contribution
  - Timeline Feed (C8): Recent geopolitical events
  - Verification Drawer (C9): Calculation transparency

**How to Use Structural Tab**:
1. Enter a ticker symbol (e.g., AAPL, MSFT, TSLA)
2. Review the CO-GRI score and risk level in the summary panel
3. Examine the risk contribution map to identify high-risk countries
4. Click on countries to see related events in the timeline
5. Review exposure pathways to understand channel-specific risks
6. Compare with peers to contextualize the risk level

#### Tab 2: Forecast Overlay
- **What it shows**: How forecasted geopolitical events will impact the company
- **Key additions**:
  - Expected ΔCO-GRI (forecast delta)
  - Forecast outlook (Headwind/Tailwind/Mixed/Neutral)
  - Confidence level (High/Medium/Low)
  - Top forecast drivers
  - Channel impact assessment
  - Best/base/worst case scenarios

**How to Use Forecast Tab**:
1. Switch to the "Forecast" tab
2. Review the forecast summary card showing expected delta
3. Examine top forecast drivers affecting the company
4. Analyze channel-specific impact projections
5. View scenario range (best/base/worst case)
6. Click "View in Forecast Mode" for global context

#### Tab 3: Scenario Shock (Coming Soon)
- **What it will show**: Company impact under custom scenario shocks
- **Planned features**:
  - Apply preset scenarios to the company
  - Build custom scenarios affecting the company
  - View propagation effects through supply chain
  - Stress test company resilience

#### Tab 4: Trading Signal
- **What it shows**: Trading recommendation based on geopolitical risk analysis
- **Key components**:
  - Signal type (BUY/SELL/HOLD)
  - Signal strength (High/Medium/Low)
  - Confidence score (0-100%)
  - Price target and stop loss
  - Expected return
  - Signal drivers with weights
  - Risk metrics (CO-GRI, forecast delta, scenario risk)
  - Rationale and reasoning

**How to Use Trading Signal Tab**:
1. Switch to the "Trading" tab
2. Review the signal recommendation (BUY/SELL/HOLD)
3. Examine confidence score and signal strength
4. Check price targets and stop loss levels
5. Review signal drivers to understand the rationale
6. Click "View in Trading Mode" for portfolio context
7. Click "Execute Trade" to implement (external broker integration)

**Company Mode Use Cases**:
- Due diligence for investment decisions
- Portfolio risk monitoring
- Earnings risk assessment
- Competitive intelligence
- Supply chain risk management

---

### 3. Forecast Mode

**Purpose**: 6-month forward-looking geopolitical risk outlook

**Three-Tab Structure**:

#### Tab 1: Global Outlook
- **What it shows**: Comprehensive global forecast
- **Key components**:
  - Executive Summary: High-level risk trajectory
  - Forecast Timeline: Chronological event feed
  - Regional Assessment: Region-by-region outlook
  - Strategic Recommendations: Actionable insights

**How to Use Global Outlook**:
1. Start with the Executive Summary for key takeaways
2. Review global risk trajectory (Rising/Stable/Declining)
3. Explore high-impact events in the timeline
4. Filter events by region, probability, or impact
5. Read regional assessments for geographic insights
6. Review strategic recommendations for portfolio positioning

#### Tab 2: Asset Class Impact
- **What it shows**: Forecast implications for different asset classes
- **Asset classes covered**:
  - Equities (by sector)
  - Fixed Income
  - Commodities
  - Currencies
  - Real Estate

**How to Use Asset Class Tab**:
1. Select an asset class from the list
2. Review impact assessment (Positive/Negative/Mixed/Neutral)
3. Read sector-specific or category-specific analysis
4. Understand the reasoning behind each assessment
5. Use insights for asset allocation decisions

#### Tab 3: Company Impact Analysis
- **What it shows**: Forecast relevance for specific companies
- **Key features**:
  - Company search and selection
  - Relevant event filtering
  - Company-specific forecast outlook
  - Deep link to Company Mode

**How to Use Company Impact Tab**:
1. Enter a ticker symbol or company name
2. View filtered events relevant to that company
3. Review expected ΔCO-GRI and outlook
4. Examine top forecast drivers
5. Click "View in Company Mode" for detailed analysis

**Forecast Mode Use Cases**:
- Portfolio rebalancing decisions
- Sector rotation strategies
- Risk budget allocation
- Hedging strategy development
- Investment committee preparation

---

### 4. Scenario Mode

**Purpose**: Build and test custom geopolitical scenarios

**Three-Tab Structure**:

#### Tab 1: Scenario Builder
- **What it shows**: Interface to configure scenario parameters
- **Configuration options**:
  - Scenario name and type
  - Epicenter countries (where shock originates)
  - Shock intensity (0-100)
  - Affected channels (revenue, supply chain, assets, financial)
  - Propagation settings (time horizon, decay rate, contagion factor)

**How to Build a Scenario**:
1. Click "New Scenario" or select a preset
2. Name your scenario (e.g., "Taiwan Strait Crisis")
3. Select scenario type (Geopolitical/Economic/Climate/Pandemic/Cyber)
4. Choose epicenter countries (e.g., China, Taiwan)
5. Set shock intensity (e.g., 80 for severe crisis)
6. Configure channel weights (which channels are most affected)
7. Adjust propagation settings:
   - Time horizon: How long the shock lasts
   - Decay rate: How quickly impact diminishes
   - Contagion factor: How easily it spreads
8. Click "Run Scenario"

**Preset Scenarios Available**:
- Taiwan Strait Conflict
- Russia-Ukraine Escalation
- Middle East Oil Shock
- China-US Tech Decoupling
- Global Pandemic
- Major Cyberattack

#### Tab 2: Scenario Results
- **What it shows**: Impact analysis of the scenario
- **Key components**:
  - Global Impact Summary
  - Country Impact Table
  - Company Impact Rankings
  - Propagation Timeline (wave-by-wave)
  - Channel Breakdown

**How to Interpret Results**:
1. Review global impact metrics (avg/max ΔCO-GRI)
2. Examine country impacts:
   - Direct impact (epicenter countries)
   - First-order (immediate trading partners)
   - Second-order (indirect connections)
   - Third-order (distant ripple effects)
3. Identify most affected companies
4. Analyze propagation timeline to understand timing
5. Review channel breakdown to see transmission mechanisms

#### Tab 3: Scenario Comparison
- **What it shows**: Side-by-side comparison of multiple scenarios
- **Comparison metrics**:
  - Global impact severity
  - Geographic spread
  - Company impact distribution
  - Time to peak impact
  - Recovery trajectory

**How to Compare Scenarios**:
1. Run multiple scenarios
2. Switch to "Comparison" tab
3. Select 2-3 scenarios to compare
4. Review comparative metrics
5. Identify which scenario poses greatest risk
6. Use insights for stress testing and contingency planning

**Scenario Mode Use Cases**:
- Portfolio stress testing
- Risk management planning
- Business continuity planning
- Strategic planning exercises
- Board-level risk reporting

---

### 5. Trading Mode

**Purpose**: Generate trading signals and optimize portfolios based on geopolitical risk

**Three-Tab Structure**:

#### Tab 1: Signal Dashboard
- **What it shows**: All trading signals across the universe
- **Key features**:
  - Signal cards with key metrics
  - Filter by signal type (BUY/SELL/HOLD)
  - Filter by confidence (High/Medium/Low)
  - Filter by sector
  - Sort by various criteria
  - Signal details panel

**How to Use Signal Dashboard**:
1. Review all available signals in the grid
2. Apply filters to focus on specific criteria:
   - Signal type: BUY signals for long positions
   - Confidence: High confidence for higher conviction
   - Sector: Focus on specific sectors
3. Sort signals by:
   - Signal strength (strongest first)
   - Expected return (highest first)
   - CO-GRI (lowest risk first)
   - Confidence (most confident first)
4. Click on a signal card to view details
5. Review signal drivers and rationale
6. Click "View in Company Mode" for deep-dive analysis

**Signal Interpretation**:
- **BUY Signal**: Geopolitical risk is decreasing or company is undervalued relative to risk
- **SELL Signal**: Geopolitical risk is increasing or company is overvalued relative to risk
- **HOLD Signal**: Risk-adjusted valuation is fair, no action recommended

#### Tab 2: Portfolio Optimizer
- **What it shows**: Portfolio optimization based on geopolitical risk
- **Key features**:
  - Portfolio input (manual or CSV import)
  - Sample portfolios (Conservative/Balanced/Aggressive)
  - Optimization settings
  - Optimization results
  - Trade recommendations

**How to Optimize a Portfolio**:
1. Input your portfolio:
   - Click "Add Holding" to manually enter positions
   - Or click "Import CSV" to upload holdings
   - Or click a sample portfolio to load preset
2. Configure optimization settings:
   - Objective: Minimize Risk / Maximize Return / Maximize Sharpe
   - CO-GRI Weight: How much to prioritize geopolitical risk (0-100%)
   - Risk Tolerance: Conservative / Moderate / Aggressive
   - Rebalancing Frequency: Daily / Weekly / Monthly / Quarterly
   - Position Constraints:
     - Max Position Size: Maximum % in any single holding
     - Min Position Size: Minimum % in any single holding
     - Max Sector Exposure: Maximum % in any sector
   - Holdings Constraints:
     - Min Holdings: Minimum number of positions
     - Max Holdings: Maximum number of positions
   - Advanced Options:
     - Transaction Costs: Brokerage fees (%)
     - Tax Loss Harvesting: Enable/disable
     - ESG Screening: Enable/disable
3. Click "Optimize Portfolio"
4. Review optimization results:
   - Metrics comparison (original vs optimized)
   - Risk reduction achieved
   - Return improvement
   - Sharpe ratio improvement
5. Review recommended trades:
   - BUY orders (new positions or additions)
   - SELL orders (reductions or exits)
   - Rationale for each trade
6. Review optimized portfolio composition
7. Click "Apply Recommendations" to implement (or export for execution)

**Optimization Objectives Explained**:
- **Minimize Risk**: Reduce weighted CO-GRI while maintaining returns
- **Maximize Return**: Maximize expected returns while managing risk
- **Maximize Sharpe**: Optimize risk-adjusted returns (Sharpe ratio)

#### Tab 3: Backtest Results
- **What it shows**: Historical performance validation of strategies
- **Key features**:
  - Backtest configuration
  - Performance summary
  - Equity curve
  - Benchmark comparison
  - Performance attribution

**How to Run a Backtest**:
1. Configure backtest parameters:
   - Strategy: CO-GRI Momentum / Mean Reversion / CO-GRI + Forecast / Custom
   - Universe: S&P 500 / Russell 2000 / Custom
   - Date Range: Start and end dates
   - Rebalancing Frequency: How often to rebalance
   - Initial Capital: Starting portfolio value
   - Transaction Costs: Brokerage fees (%)
2. Click "Run Backtest"
3. Review performance summary:
   - Total Return: Cumulative return over period
   - Annualized Return: Average annual return
   - Sharpe Ratio: Risk-adjusted return metric
   - Max Drawdown: Largest peak-to-trough decline
   - Volatility: Standard deviation of returns
   - Win Rate: % of profitable trades
   - Total Trades: Number of trades executed
   - Profit Factor: Gross profit / Gross loss
4. Analyze equity curve:
   - Portfolio value over time
   - Comparison vs benchmark (S&P 500)
   - Identify drawdown periods
5. Review benchmark comparison:
   - Alpha: Excess return vs benchmark
   - Beta: Sensitivity to benchmark
   - Information Ratio: Risk-adjusted excess return
   - Tracking Error: Deviation from benchmark
6. Examine performance attribution:
   - By Sector: Which sectors contributed most
   - By Signal Type: BUY vs SELL performance
   - Identify strengths and weaknesses

**Trading Mode Use Cases**:
- Portfolio construction
- Portfolio rebalancing
- Risk management
- Strategy backtesting
- Performance attribution

---

## FAQ

### General Questions

**Q: What makes CO-GRI different from other risk metrics?**
A: CO-GRI is specifically designed to quantify geopolitical risk, which traditional financial metrics (VaR, beta, etc.) don't capture. It combines geographic exposure, supply chain dependencies, physical assets, and financial linkages into a single, actionable score.

**Q: How often is CO-GRI updated?**
A: Structural CO-GRI is updated daily. Forecast Mode provides a 6-month forward outlook updated weekly. Scenario Mode allows real-time "what-if" analysis.

**Q: Can I use CO-GRI for non-equity assets?**
A: Currently, CO-GRI is optimized for publicly traded equities. Future versions will support fixed income, commodities, and currencies.

**Q: Is historical data available?**
A: Yes, Company Mode shows historical CO-GRI trends. Backtest Mode in Trading Mode allows testing strategies over historical periods.

### Technical Questions

**Q: What data sources does CO-GRI use?**
A: CO-GRI integrates multiple data sources:
- Company filings (10-K, 10-Q) for geographic exposure
- Supply chain databases for supplier networks
- Geopolitical event feeds for real-time monitoring
- Country risk indices for baseline risk levels

**Q: How is the CO-GRI score calculated?**
A: CO-GRI uses a multi-channel framework:
1. Geographic exposure weights (from company filings)
2. Country-level risk scores (0-100)
3. Channel-specific transmission factors
4. Home country alignment modifiers
5. Sector-specific multipliers

Full methodology is available in the Verification Drawer (C9) in Company Mode.

**Q: What is the forecast methodology?**
A: Forecast Mode uses:
- Geopolitical event database (6-month outlook)
- Event probability assessments
- Expected impact on country risk (ΔCO-GRI)
- Company-specific relevance filtering
- Probability-weighted delta calculations

**Q: How does Scenario Mode propagate shocks?**
A: Scenario Mode uses a network propagation engine:
- Wave 1: Direct impact on epicenter countries
- Wave 2: First-order effects on trading partners
- Wave 3+: Second and third-order ripple effects
- Decay function reduces impact over time and distance
- Contagion factor controls spread intensity

### Trading Questions

**Q: Are trading signals actionable?**
A: Yes, signals include specific price targets, stop losses, and time horizons. However, they should be used as inputs to your investment process, not as sole decision criteria.

**Q: What is the signal success rate?**
A: Backtest results show win rates varying by strategy (typically 55-65%). Past performance does not guarantee future results.

**Q: Can I customize signal generation?**
A: Currently, signals use a standardized methodology. Future versions will allow custom signal parameters.

**Q: Does the platform execute trades?**
A: No, the platform generates signals and recommendations. You must execute trades through your broker.

---

## Troubleshooting

### Common Issues

**Issue: Company not found**
- **Cause**: Ticker symbol not in database or incorrect format
- **Solution**: 
  - Verify ticker symbol (use Yahoo Finance format)
  - Try company name instead of ticker
  - Check if company is publicly traded

**Issue: Forecast data not available**
- **Cause**: No relevant forecast events for the company
- **Solution**:
  - Company may have low geopolitical exposure
  - Try a company with higher international exposure
  - Check Global Outlook tab for general forecast

**Issue: Scenario results seem unrealistic**
- **Cause**: Extreme parameter settings
- **Solution**:
  - Use preset scenarios as reference
  - Reduce shock intensity (try 60-70 instead of 90-100)
  - Adjust decay rate (higher = faster dissipation)
  - Lower contagion factor (reduce spread)

**Issue: Optimization takes too long**
- **Cause**: Large portfolio or complex constraints
- **Solution**:
  - Reduce number of holdings
  - Simplify constraints
  - Use sample portfolios for testing

**Issue: Backtest fails to run**
- **Cause**: Invalid date range or parameters
- **Solution**:
  - Ensure end date is after start date
  - Use date range within available data (2023-2025)
  - Check initial capital is positive

### Performance Issues

**Issue: Slow page load**
- **Solution**:
  - Clear browser cache
  - Use modern browser (Chrome, Firefox, Edge)
  - Check internet connection
  - Reduce number of open tabs

**Issue: Charts not rendering**
- **Solution**:
  - Refresh the page
  - Enable JavaScript
  - Update browser to latest version
  - Disable ad blockers

### Data Issues

**Issue: Unexpected CO-GRI score**
- **Solution**:
  - Check Verification Drawer (C9) for calculation details
  - Review geographic exposure breakdown
  - Compare with peer companies
  - Consider recent geopolitical events

**Issue: Missing historical data**
- **Solution**:
  - Historical data availability varies by company
  - Newly listed companies have limited history
  - Some companies may have data gaps

### Getting Help

**Support Channels**:
- Documentation: https://cogri-platform.com/docs
- Email: support@cogri-platform.com
- Community Forum: https://community.cogri-platform.com

**Before Contacting Support**:
1. Check this User Guide
2. Review FAQ section
3. Try troubleshooting steps
4. Prepare:
   - Screenshot of issue
   - Browser and version
   - Steps to reproduce
   - Company ticker (if applicable)

---

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Search companies
- `Ctrl/Cmd + F`: Filter current view
- `Ctrl/Cmd + S`: Save/export current view
- `Esc`: Close modals/drawers
- `Tab`: Navigate between tabs
- `Arrow Keys`: Navigate lists

### Export Options

All modes support data export:
- **CSV**: Tabular data (holdings, signals, results)
- **PDF**: Reports with charts and tables
- **JSON**: Raw data for API integration

### API Access

Enterprise users can access CO-GRI data via REST API:
- Real-time CO-GRI scores
- Forecast data feeds
- Scenario simulation API
- Trading signal webhooks

Contact sales@cogri-platform.com for API access.

---

**Version**: 2.0.0  
**Last Updated**: March 2026  
**Platform**: CO-GRI Geopolitical Risk Analysis Platform