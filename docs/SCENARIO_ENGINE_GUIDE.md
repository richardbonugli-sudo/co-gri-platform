# Scenario Engine User Guide

## Overview

The Scenario Engine is a powerful tool for creating and analyzing custom "what-if" scenarios to assess geopolitical risk impacts on companies. It allows users to model various events, stress test exposures, and compare multiple scenarios side-by-side.

## Features

### 1. Custom Scenario Creation
- **Event Types:** Trade War, Military Conflict, Sanctions, Supply Chain Disruption, Policy Change, Economic Crisis, Custom
- **Severity Levels:** Low (1.0x), Medium (2.5x), High (5.0x), Critical (10.0x)
- **Probability:** 0-100% likelihood of occurrence
- **Duration:** 1-60 months
- **Geographic Scope:** Select from 30+ countries
- **Channel Scope:** Revenue, Supply Chain, Physical Assets, Financial

### 2. Impact Analysis
- **ΔCO-GRI Calculation:** Measures change in company risk score
- **Channel Breakdown:** Impact by risk channel
- **Country Breakdown:** Impact by geographic exposure
- **Timeline Projection:** Cumulative impact over time
- **Probability Weighting:** Risk-adjusted impact estimates

### 3. Scenario Comparison
- **Side-by-Side Analysis:** Compare multiple scenarios
- **Statistical Summary:** Average, min, max, standard deviation
- **Best/Worst Case:** Highlighted scenarios
- **Export to CSV:** Download comparison data

## How to Use

### Creating a Scenario

1. **Navigate to Company Mode**
   - Go to `/company-mode?ticker=AAPL` (or any company ticker)
   - Click the "Scenario Analysis" tab (6th tab)

2. **Fill Out Scenario Details**
   - **Name:** Enter a descriptive name (max 100 characters)
   - **Description:** Provide context (max 500 characters)
   - **Event Type:** Select from dropdown (e.g., "Trade War")
   - **Severity:** Choose Low, Medium, High, or Critical
   - **Probability:** Set likelihood (0-100%)
   - **Duration:** Enter months (1-60)

3. **Select Geographic Scope**
   - Search and select affected countries
   - Use checkboxes to select multiple countries
   - Selected countries appear as removable badges

4. **Select Channel Scope**
   - Check affected channels:
     - Revenue (sales, market access)
     - Supply Chain (suppliers, logistics)
     - Physical Assets (facilities, property)
     - Financial (banking, investments)

5. **Create Scenario**
   - Click "Create Scenario" button
   - Scenario appears in "Active Scenarios" list

### Applying a Scenario

1. **Locate Scenario**
   - Find scenario in "Active Scenarios" list on the right

2. **Apply Scenario**
   - Click "Apply" button
   - Engine calculates ΔCO-GRI impact
   - Results display immediately

3. **View Results**
   - ΔCO-GRI shows total impact
   - Severity and probability displayed
   - Button changes to "Applied" (disabled)

### Comparing Scenarios

1. **Create Multiple Scenarios**
   - Create 2 or more scenarios
   - Apply all scenarios

2. **View Comparison**
   - ScenarioComparison component appears automatically
   - Shows side-by-side table with all scenarios

3. **Analyze Statistics**
   - Average ΔCO-GRI across scenarios
   - Min/Max scenarios highlighted
   - Standard deviation shows volatility
   - Most common event type identified

4. **Export Data**
   - Click "Export to CSV" button
   - Downloads: `scenario_comparison_{ticker}_{date}.csv`

### Viewing Detailed Results

1. **Select Scenario**
   - Click on a scenario card
   - ScenarioResults component displays

2. **Review Impact Breakdown**
   - **Channel Impact:** Bar chart and table
   - **Country Impact:** Sortable table with deltas
   - **Timeline:** Line chart showing cumulative impact

3. **Export Results**
   - Export to CSV (all data)
   - Export chart as PNG (visual)

### Removing Scenarios

1. **Locate Scenario**
   - Find scenario in "Active Scenarios" list

2. **Remove**
   - Click "Remove" button (red)
   - Scenario deleted from list
   - Results cleared from memory

## Calculation Methodology

### ΔCO-GRI Formula

```
ΔCO-GRI = Σ (Country_Impact × Exposure_Weight)

Where:
Country_Impact = Σ (Channel_Impact × Channel_Weight)
Channel_Impact = Base_Impact × Severity_Multiplier × (CSI / 100)
```

### Severity Multipliers

- **Low:** 1.0x (minor disruption)
- **Medium:** 2.5x (moderate disruption)
- **High:** 5.0x (severe disruption)
- **Critical:** 10.0x (extreme disruption)

### Event-Channel Impact Matrix

Base impact values by event type and channel:

| Event Type | Revenue | Supply | Assets | Financial |
|------------|---------|--------|--------|-----------|
| Trade      | 8       | 6      | 3      | 4         |
| Military   | 7       | 5      | 9      | 6         |
| Sanctions  | 9       | 7      | 5      | 8         |
| Supply Chain| 5      | 9      | 4      | 3         |
| Policy     | 6       | 4      | 5      | 7         |
| Economic   | 8       | 6      | 6      | 9         |
| Custom     | 5       | 5      | 5      | 5         |

### Probability Weighting

```
Probability_Weighted_Delta = ΔCO-GRI × Probability
```

### Timeline Projection

```
Cumulative_Delta[month] = (month / duration) × ΔCO-GRI
```

Linear progression from 0 to full impact over scenario duration.

## API Reference

### ScenarioEngineService

#### createScenario(params: ScenarioParameters): ScenarioDefinition

Creates a new scenario with validation.

**Parameters:**
- `name` (string): Scenario name (required, max 100 chars)
- `description` (string): Scenario description (required, max 500 chars)
- `event_type` (EventType): Type of event (required)
- `severity` (Severity): Impact severity (required)
- `probability` (number): Likelihood 0-1 (required)
- `duration_months` (number): Duration 1-60 (required)
- `affected_countries` (string[]): List of countries (required, min 1)
- `affected_channels` (Channel[]): List of channels (required, min 1)

**Returns:** ScenarioDefinition with generated scenario_id

**Throws:** Error if validation fails

#### applyScenario(company: CompanyExposure, scenario: ScenarioDefinition): ScenarioImpactResult

Applies scenario to company and calculates impact.

**Parameters:**
- `company` (CompanyExposure): Company exposure data
- `scenario` (ScenarioDefinition): Scenario to apply

**Returns:** ScenarioImpactResult with ΔCO-GRI and breakdowns

**Guardrails:**
- Only applies to countries with existing exposure
- Never creates new country exposures
- Never modifies exposure weights
- Preserves channel weights (W_R, W_S, W_P, W_F)

#### compareScenarios(company: CompanyExposure, scenarios: ScenarioDefinition[]): ComparisonResult

Compares multiple scenarios side-by-side.

**Parameters:**
- `company` (CompanyExposure): Company exposure data
- `scenarios` (ScenarioDefinition[]): Array of scenarios (min 2)

**Returns:** ComparisonResult with statistics and rankings

#### validateScenario(scenario: ScenarioDefinition): ValidationResult

Validates scenario parameters.

**Parameters:**
- `scenario` (ScenarioDefinition): Scenario to validate

**Returns:** ValidationResult with errors and warnings

## Troubleshooting

### Issue: Scenario not applying

**Possible Causes:**
- Company has no exposure in selected countries
- Invalid scenario parameters
- Missing required fields

**Solution:**
- Verify company has exposure in affected countries
- Check validation errors in console
- Ensure all required fields are filled

### Issue: ΔCO-GRI is zero

**Possible Causes:**
- No overlap between scenario countries and company exposure
- Very low severity or probability
- Affected channels have zero weight

**Solution:**
- Select countries where company has exposure
- Increase severity or probability
- Choose channels with significant exposure

### Issue: Export not working

**Possible Causes:**
- Browser blocking downloads
- No scenarios applied
- Missing data

**Solution:**
- Check browser download permissions
- Apply at least one scenario
- Verify scenario results are loaded

### Issue: Charts not rendering

**Possible Causes:**
- Missing Recharts library
- Invalid data format
- Browser compatibility

**Solution:**
- Verify Recharts is installed
- Check console for errors
- Try a different browser

## Known Limitations

1. **Maximum Scenarios:** No hard limit, but UI performance may degrade with 20+ scenarios
2. **Historical Data:** Scenarios are forward-looking only, no historical backtesting
3. **Multi-Stage Scenarios:** Conditional logic is defined but not fully implemented in UI
4. **Real-Time Updates:** Scenarios must be manually re-applied after company data changes
5. **Persistence:** Scenarios are stored in browser memory only, not persisted to database
6. **Collaboration:** No sharing or collaboration features between users

## Best Practices

### Scenario Design

1. **Be Specific:** Use descriptive names and detailed descriptions
2. **Realistic Probability:** Base on historical data or expert judgment
3. **Appropriate Severity:** Match severity to expected impact magnitude
4. **Relevant Geography:** Select countries with significant company exposure
5. **Channel Focus:** Choose channels most affected by the event type

### Analysis Workflow

1. **Baseline:** Start with current company risk profile
2. **Single Scenarios:** Test individual events first
3. **Combinations:** Compare multiple scenarios
4. **Sensitivity:** Vary severity and probability to test sensitivity
5. **Documentation:** Export results for reporting and decision-making

### Performance Tips

1. **Limit Active Scenarios:** Keep 5-10 active scenarios for best performance
2. **Remove Unused:** Delete scenarios no longer needed
3. **Batch Application:** Apply multiple scenarios at once rather than one-by-one
4. **Export Regularly:** Save results to CSV for offline analysis

## Future Enhancements

Planned features for future releases:

- **Scenario Templates:** Pre-built scenarios for common events
- **Multi-Stage Scenarios:** Full UI support for conditional logic
- **Scenario Persistence:** Save scenarios to database
- **Scenario Sharing:** Share scenarios with team members
- **Historical Backtesting:** Test scenarios against historical data
- **Monte Carlo Simulation:** Probabilistic scenario analysis
- **Portfolio Analysis:** Apply scenarios to multiple companies
- **API Integration:** Programmatic scenario creation and analysis

## Support

For questions, issues, or feature requests:

- **Documentation:** https://help.atoms.dev/en/collections/15056444-faq
- **Community:** https://help.atoms.dev/en/articles/12174595-community-support
- **GitHub Issues:** Report bugs and request features

## Version History

- **v1.0.0** (2026-03-02): Initial release with core functionality
  - Scenario creation and application
  - Impact calculations with guardrails
  - Comparison and visualization tools
  - CSV export functionality

---

**Last Updated:** March 2, 2026
**Version:** 1.0.0
**Author:** CO-GRI Platform Team
