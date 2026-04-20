# Scenario Mode - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Component Guide](#component-guide)
4. [Advanced Features](#advanced-features)
5. [Interpreting Results](#interpreting-results)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Introduction

Scenario Mode allows institutional investors to stress test portfolio companies against geopolitical scenarios. Model "what-if" situations and assess how geopolitical events impact company risk profiles through the CO-GRI (Company-level Geopolitical Risk Index) framework.

### Key Features
- **Quick-Start Templates**: Pre-configured scenarios (Taiwan Strait Crisis, US-China Decoupling, etc.)
- **Custom Scenarios**: Build your own with 11 event types and 195+ countries
- **Multi-Channel Analysis**: See how risk propagates through Trade, Alignment, and Sector channels
- **Country-Level Impact**: Identify which countries drive ΔCO-GRI changes
- **Network Visualization**: Interactive graph showing shock transmission paths

## Getting Started

### Step 1: Select a Company
1. Navigate to `/scenario-mode`
2. Select a company from the dropdown (e.g., AAPL - Apple Inc.)
3. Or use URL parameter: `/scenario-mode?ticker=AAPL`

### Step 2: Choose a Scenario
**Option A: Use a Template**
1. Click "Quick-Start Templates" in S1 (Scenario Builder)
2. Select a template:
   - **Taiwan Strait Crisis**: US-China military escalation over Taiwan
   - **US-China Decoupling**: Trade embargo and technology restrictions
   - **Middle East Oil Shock**: Energy disruption from regional conflict
   - **Russia Sanctions Escalation**: Expanded sanctions on Russia

**Option B: Build Custom Scenario**
1. Select **Event Type** (e.g., "Sanctions", "Trade Embargo")
2. Choose **Actor Country** (country initiating the event)
3. Select **Target Countries** (countries directly affected)
4. Set **Propagation Type**:
   - **Unilateral**: Only target countries affected
   - **Bilateral**: Actor and targets affected
   - **Regional**: Spillover to economically connected countries
   - **Global**: All countries included
5. Choose **Severity** (Low, Medium, High)

### Step 3: Run the Scenario
1. Click **"Run Scenario"** button
2. Wait 1-2 seconds for calculation
3. View results in S2-S5 components below

## Component Guide

### S1: Scenario Builder
**Purpose**: Configure and run scenarios

**Features**:
- Quick-start templates for common scenarios
- Custom scenario configuration
- Event type selection (11 types)
- Country selection (195+ countries)
- Propagation pattern selection
- Severity adjustment
- Advanced options (alignment changes, exposure changes, sector sensitivity)

**Tips**:
- Start with templates to learn the interface
- Use Regional propagation for most scenarios (balances realism and performance)
- Set severity based on event likelihood and impact magnitude

### S2: Impact Summary
**Purpose**: Display overall ΔCO-GRI and risk level changes

**Metrics Displayed**:
- **Baseline CO-GRI**: Company's current geopolitical risk score
- **Scenario CO-GRI**: Risk score under the scenario
- **ΔCO-GRI**: Absolute change in risk score
- **% Change**: Percentage change in risk score
- **Risk Level Change**: Upgrade/Downgrade/Stable

**Interpretation**:
- **ΔCO-GRI > +10**: Very High Impact (red)
- **ΔCO-GRI +5 to +10**: High Impact (orange)
- **ΔCO-GRI +2 to +5**: Moderate Impact (yellow)
- **ΔCO-GRI < +2**: Low Impact (green)

### S3: Channel Attribution
**Purpose**: Show ΔCO-GRI breakdown by transmission channel

**Channels**:
1. **Trade Channel (α = 0.45)**: Import/export exposure
2. **Alignment Channel (β = 0.35)**: Geopolitical alignment shifts
3. **Sector Channel (γ = 0.20)**: Industry-specific sensitivities

**Features**:
- **Stacked Bar Chart**: Visual representation of channel contributions
- **Expandable Cards**: Click to see detailed metrics
- **Evidence Levels**: A+ to D rating for data quality
- **Confidence Scores**: 0-100% confidence in each channel
- **Data Sources**: Transparency on data origin (Direct Data, OECD ICIO, IMF CPIS, etc.)

**How to Use**:
1. Look at stacked bar to see relative contributions
2. Click on channel cards to expand details
3. Check evidence levels and confidence scores
4. Review data sources for transparency

**Interpretation**:
- **Largest Contributor**: Focus on the channel with highest absolute contribution
- **Evidence Level A/A+**: High confidence in data
- **Evidence Level C/D**: Lower confidence, use caution
- **Low Confidence Warning**: Appears if any channel < 60% confidence

### S4: Node Attribution
**Purpose**: Show top impacted countries with detailed metrics

**Table Columns**:
- **Rank**: 1-10 (or more if expanded)
- **Country**: Name with flag emoji
- **Baseline**: Baseline CO-GRI contribution
- **Scenario**: Scenario CO-GRI contribution
- **ΔCO-GRI**: Absolute change (color-coded)
- **% Change**: Percentage change
- **Exposure**: Company's exposure weight to country
- **Type**: Direct Target / Actor / Spillover

**Features**:
- **Sortable Columns**: Click headers to sort
- **Search Bar**: Filter countries by name
- **Impact Type Filter**: Show only Direct/Actor/Spillover
- **Risk Change Filter**: Show only Increased/Decreased/Stable
- **Expandable Rows**: Click row to see detailed metrics
- **Export**: CSV download or clipboard copy
- **Pagination**: Show 10 → 25 → All countries

**How to Use**:
1. **Identify Top Impacted Countries**: Look at top 10 by ΔCO-GRI
2. **Sort by % Change**: See which countries have largest relative impact
3. **Filter by Type**: Focus on Direct Targets vs Spillover
4. **Expand Rows**: See detailed risk metrics and contribution breakdown
5. **Export Data**: Download CSV for further analysis

**Interpretation**:
- **Direct Targets**: Countries directly affected by the event
- **Actor**: Country initiating the event (usually 30% impact)
- **Spillover**: Countries indirectly affected through economic linkages
- **Red ΔCO-GRI**: High risk increase (≥10 points)
- **Green ΔCO-GRI**: Risk decrease (negative delta)

### S5: Transmission Trace
**Purpose**: Visualize shock propagation through network graph

**Graph Elements**:
- **Nodes**: Countries (size = |ΔCO-GRI|)
- **Node Colors**:
  - Red: Actor country (epicenter)
  - Dark Orange: Direct targets
  - Light Orange: Spillover countries
- **Edges**: Transmission paths (thickness = propagation weight)
- **Animated Edges**: Direct impact from actor to targets

**Layouts**:
1. **Radial Layout** (default): Concentric circles
   - Layer 0 (Actor) at center
   - Layer 1 (Targets) in first circle
   - Layer 2+ (Spillovers) in outer circles
2. **Hierarchical Layout**: Top-down tree structure
3. **Force-Directed Layout**: Grid-based arrangement

**Interactive Controls**:
- **Zoom**: Scroll mouse wheel or use +/- buttons
- **Pan**: Click and drag to move graph
- **Select Node**: Click any country to highlight
- **Layer Toggles**: Show/hide Layer 0/1/2
- **Layout Switch**: Change between Radial/Hierarchical/Force
- **Reset**: Return to default view
- **Mini-Map**: Navigate large graphs (bottom-right corner)

**How to Use**:
1. **View Propagation**: See how shock flows from actor → targets → spillovers
2. **Identify Clusters**: Look for groups of highly connected countries
3. **Analyze Paths**: Follow edges to understand transmission routes
4. **Toggle Layers**: Focus on specific propagation levels
5. **Switch Layouts**: Try different views for different insights

**Interpretation**:
- **Large Nodes**: High impact countries (large |ΔCO-GRI|)
- **Thick Edges**: Strong transmission paths
- **Animated Edges**: Direct impact (actor → targets)
- **Concentric Circles**: Layers of propagation (radial layout)

## Advanced Features

### Comparing Scenarios
1. Run first scenario and note results
2. Click "Remix" to create a branch
3. Modify scenario parameters
4. Run second scenario
5. Compare results side-by-side in different versions

### Saving Scenarios
1. Configure your scenario in S1
2. Click "Save Scenario" (future feature)
3. Give it a descriptive name
4. Load saved scenarios from library

### Exporting Data
**S4 (Node Attribution)**:
- **CSV Export**: Click "CSV" button to download table
- **Clipboard Copy**: Click "Copy" button for tab-separated format
- Paste into Excel/Google Sheets for further analysis

**S5 (Transmission Trace)**:
- Screenshot the graph (future: export as PNG/SVG)
- Use browser's print function to save as PDF

### Interpreting Results Across Components

**Holistic Analysis Workflow**:
1. **S2**: Get overall impact magnitude (ΔCO-GRI)
2. **S3**: Understand which channels drive the change
3. **S4**: Identify specific countries responsible
4. **S5**: Visualize how shock propagates through network

**Example: Taiwan Strait Crisis on Apple (AAPL)**
1. **S2**: ΔCO-GRI = +8.5 points (High Impact)
2. **S3**: Trade channel contributes 60%, Alignment 30%, Sector 10%
3. **S4**: China (+5.2), Taiwan (+3.8), Japan (+1.2) are top impacted
4. **S5**: Graph shows US (actor) → China/Taiwan (targets) → Japan/Korea (spillovers)

**Insight**: Apple's high exposure to China and Taiwan drives the large ΔCO-GRI. Trade disruptions are the primary channel. Spillover to Japan and Korea amplifies the impact.

## Troubleshooting

### Scenario Calculation Fails
**Problem**: Error message appears after clicking "Run Scenario"

**Solutions**:
1. Check that actor country and target countries are selected
2. Ensure at least one target country is selected
3. Try refreshing the page and re-running
4. If error persists, try a different company or scenario

### Components Not Displaying
**Problem**: S3/S4/S5 components are missing

**Solutions**:
1. Ensure scenario has been run successfully (check S2 for results)
2. Scroll down - components appear below S2
3. Check browser console for errors
4. Try refreshing the page

### Graph Not Loading (S5)
**Problem**: Transmission Trace shows loading spinner indefinitely

**Solutions**:
1. Wait 5-10 seconds (large graphs take time)
2. Try reducing display limit to 30 countries
3. Switch to Hierarchical layout (faster rendering)
4. Check browser compatibility (Chrome/Firefox recommended)

### Slow Performance
**Problem**: Page is slow or unresponsive

**Solutions**:
1. Use Regional propagation instead of Global (fewer countries)
2. Limit S4 table to top 10 countries
3. Limit S5 graph to 30 nodes
4. Close other browser tabs
5. Use Chrome or Firefox for best performance

### Data Quality Concerns
**Problem**: Low confidence scores or evidence levels

**Solutions**:
1. Check S3 for data source information
2. Review evidence levels (A+ = highest, D = lowest)
3. Use caution with C/D evidence levels
4. Consider running multiple scenarios to validate findings

## FAQ

### General Questions

**Q: What is CO-GRI?**
A: Company-level Geopolitical Risk Index - a metric measuring a company's exposure to geopolitical risks across its global operations.

**Q: What is ΔCO-GRI?**
A: Delta CO-GRI - the change in CO-GRI score under a scenario compared to baseline.

**Q: How often is data updated?**
A: Country Shock Index (CSI) data is updated quarterly. Trade, supply chain, and financial linkage data is updated annually.

**Q: Can I compare multiple scenarios?**
A: Yes, use the "Remix" feature to create branches and compare results across versions.

### Scenario Configuration

**Q: What's the difference between propagation types?**
A:
- **Unilateral**: Only target countries affected (fastest)
- **Bilateral**: Actor and targets affected
- **Regional**: Spillover to economically connected countries (recommended)
- **Global**: All 195 countries included (slowest)

**Q: How do I choose severity?**
A:
- **Low**: Minor event, limited impact
- **Medium**: Moderate event, noticeable impact
- **High**: Major event, significant impact

**Q: What are the 11 event types?**
A: Sanctions, Capital Controls, Nationalization, Export Ban, Foreign Investment Restriction, Trade Embargo, Conflict, Domestic Instability, Energy Restriction, Cyberattack, Custom Event.

### Results Interpretation

**Q: What's a "good" or "bad" ΔCO-GRI?**
A:
- **< +2**: Low impact (manageable)
- **+2 to +5**: Moderate impact (monitor)
- **+5 to +10**: High impact (concerning)
- **> +10**: Very high impact (critical)

**Q: What do the channel weights mean (α, β, γ)?**
A: These are the relative importance of each transmission channel:
- α = 0.45 (Trade): 45% weight
- β = 0.35 (Alignment): 35% weight
- γ = 0.20 (Sector): 20% weight

**Q: What are evidence levels?**
A:
- **A+**: Known zero or 95%+ confidence (best)
- **A**: 90-95% confidence (excellent)
- **B**: 70-90% confidence (good)
- **C**: 60-70% confidence (acceptable)
- **D**: 50-60% confidence (use caution)
- **None**: < 50% confidence (unreliable)

### Technical Questions

**Q: Which browsers are supported?**
A: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Chrome and Firefox recommended for best experience.

**Q: Does it work on mobile?**
A: Yes, fully responsive design. Some features (graph zoom/pan) work better on desktop.

**Q: How long does calculation take?**
A:
- Unilateral/Bilateral: < 200ms
- Regional: 400-500ms
- Global: 1.5-2s

**Q: Can I export results?**
A: Yes, S4 (Node Attribution) has CSV export and clipboard copy. S5 (Transmission Trace) can be screenshot or printed to PDF.

### Data Questions

**Q: Where does the data come from?**
A: Multiple sources:
- Trade: UN COMTRADE (92% confidence)
- Supply Chain: OECD ICIO (95% confidence)
- Financial: IMF CPIS + OECD FDI + BIS Banking (98% confidence)
- Fallback methods used when direct data unavailable

**Q: How accurate are the results?**
A: Accuracy depends on data quality (see evidence levels in S3). Results with A/A+ evidence are highly reliable. Results with C/D evidence should be interpreted with caution.

**Q: Can I trust spillover country impacts?**
A: Spillover impacts are calculated using material exposure criteria (trade partnerships, supply chain dependencies, financial linkages). Only economically meaningful transmission channels are modeled. Check S4 materiality breakdown for details.

### Troubleshooting

**Q: Why is my scenario calculation slow?**
A: Global propagation with 195 countries takes 1.5-2s. Use Regional propagation for faster results.

**Q: Why are some countries missing from S4?**
A: S4 shows top 10 by default. Click "Show Top 25" or "Show All" to see more countries.

**Q: Why is the graph (S5) not loading?**
A: Large graphs (50+ nodes) take 5-10 seconds to render. Try reducing display limit or switching to Hierarchical layout.

**Q: Why do I see "No Data" for some channels?**
A: Some country pairs lack direct bilateral data. Fallback methods are used (see data source descriptions in S3).

## Need Help?

- **Documentation**: See `/docs` folder for technical documentation
- **Support**: Contact support team via help center
- **Bug Reports**: Submit via GitHub issues or support portal
- **Feature Requests**: Submit via product feedback form

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-01  
**Next Review**: 2026-06-01