# Corporate Geopolitical Risk Index (CO-GRI) Methodology
## Complete Technical Documentation

**Version:** 3.4 with Phase 5D Predictive Forecasting  
**Last Updated:** January 2027  
**Authors:** CO-GRI Research Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Theoretical Foundation](#theoretical-foundation)
3. [Core Methodology](#core-methodology)
4. [Mathematical Framework](#mathematical-framework)
5. [Assessment Process](#assessment-process)
6. [Predictive Forecasting (Phase 5D)](#predictive-forecasting-phase-5d)
7. [Data Sources and Collection](#data-sources-and-collection)
8. [Validation and Quality Control](#validation-and-quality-control)
9. [Interpretation Guidelines](#interpretation-guidelines)
10. [Case Studies](#case-studies)
11. [Appendices](#appendices)

---

## 1. Executive Summary

### 1.1 Overview

The Corporate Geopolitical Risk Index (CO-GRI) is a comprehensive quantitative framework for assessing multinational corporations' exposure to geopolitical risks. It combines geographic exposure data, country-level risk assessments, sector-specific factors, and political alignment considerations to produce a single risk score ranging from 0 (minimal risk) to 100 (maximum risk).

### 1.2 Key Features

- **Multi-Channel Analysis**: Four distinct exposure channels (Revenue, Supply Chain, Assets, Financial)
- **Country Shock Index (CSI)**: Standardized country risk scores (0-100)
- **Sector Multipliers**: Industry-specific risk adjustments
- **Political Alignment Factors**: Home country relationship considerations
- **Predictive Forecasting**: Forward-looking risk projections with Cedar Owl 2026 data
- **Scenario Analysis**: Base case, optimistic, and pessimistic projections
- **Time Horizons**: 6-month, 1-year, 2-year, and 5-year forecasts

### 1.3 Applications

- Investment risk assessment
- Portfolio diversification
- Strategic planning
- Supply chain risk management
- Regulatory compliance
- Stakeholder communication

---

## 2. Theoretical Foundation

### 2.1 Conceptual Framework

CO-GRI is built on three theoretical pillars:

#### 2.1.1 Geographic Exposure Theory
Corporations face risks proportional to their geographic footprint across different markets and regulatory environments.

#### 2.1.2 Channel-Specific Risk Transmission
Geopolitical shocks transmit through distinct channels with varying intensities:
- **Revenue Channel**: Market access, demand shocks, trade barriers
- **Supply Channel**: Input disruptions, logistics constraints
- **Asset Channel**: Property rights, expropriation, capital controls
- **Financial Channel**: Currency risk, payment systems, sanctions

#### 2.1.3 Political Economy of International Business
Home country-host country political relationships significantly moderate risk exposure through diplomatic protection, trade agreements, and alliance structures.

### 2.2 Risk Decomposition

Total geopolitical risk decomposes into:

```
Total Risk = Σ(Channel Risk × Channel Weight)

Where:
Channel Risk = f(Geographic Exposure, Country Risk, Sector Factors, Political Alignment)
```

---

## 3. Core Methodology

### 3.1 Four-Channel Model

#### 3.1.1 Channel Definitions

**Revenue Channel (40% weight)**
- Sales revenue by geographic market
- Customer concentration by country
- Market access dependencies

**Supply Chain Channel (35% weight)**
- Supplier locations
- Manufacturing facilities
- Critical input sources
- Logistics networks

**Asset Channel (15% weight)**
- Physical assets (property, plant, equipment)
- Intellectual property
- Investments and subsidiaries

**Financial Channel (10% weight)**
- Banking relationships
- Currency exposures
- Payment system dependencies
- Capital market access

#### 3.1.2 Channel Weights Justification

Weights are derived from empirical analysis of how geopolitical shocks historically impact corporate performance:

- **Revenue (40%)**: Largest direct impact on cash flows
- **Supply (35%)**: Critical for operational continuity
- **Assets (15%)**: Longer-term strategic importance
- **Financial (10%)**: Diversifiable through hedging

### 3.2 Country Shock Index (CSI)

#### 3.2.1 CSI Components

The Country Shock Index aggregates multiple risk dimensions:

1. **Political Stability (30%)**
   - Government effectiveness
   - Political violence
   - Regime stability
   - Policy predictability

2. **Economic Conditions (25%)**
   - GDP volatility
   - Inflation stability
   - Debt levels
   - Currency stability

3. **Regulatory Environment (20%)**
   - Rule of law
   - Property rights
   - Contract enforcement
   - Regulatory quality

4. **Geopolitical Tensions (15%)**
   - International conflicts
   - Territorial disputes
   - Alliance structures
   - Sanctions exposure

5. **Social Factors (10%)**
   - Social unrest
   - Labor conditions
   - Demographic pressures
   - Inequality

#### 3.2.2 CSI Calculation

```
CSI_country = Σ(Component_i × Weight_i)

Where:
Component_i = Normalized score (0-100) for component i
Weight_i = Component weight
```

#### 3.2.3 CSI Score Ranges

- **0-25**: Low Risk (Stable democracies, strong institutions)
- **25-40**: Moderate Risk (Emerging markets, some volatility)
- **40-60**: High Risk (Political instability, weak institutions)
- **60-100**: Very High Risk (Conflict zones, failed states)

### 3.3 Sector Multipliers

#### 3.3.1 Sector Risk Profiles

Different industries face varying geopolitical sensitivities:

| Sector | Multiplier | Rationale |
|--------|-----------|-----------|
| Technology | 1.12 | IP theft, tech nationalism, export controls |
| Automotive | 1.18 | Complex supply chains, trade barriers |
| Energy | 1.15 | Resource nationalism, sanctions |
| Financial Services | 1.08 | Regulatory arbitrage, capital controls |
| Healthcare | 1.10 | Regulatory divergence, pricing pressures |
| Industrials | 1.09 | Trade dependencies, tariffs |
| Consumer Cyclical | 1.06 | Discretionary demand sensitivity |
| Basic Materials | 1.11 | Resource concentration, commodity volatility |
| Utilities | 1.05 | Regulated monopolies, local focus |
| Real Estate | 1.02 | Property rights, local regulations |
| Communication Services | 1.07 | Content regulation, data sovereignty |
| Consumer Defensive | 1.04 | Essential goods, stable demand |

#### 3.3.2 Multiplier Derivation

Sector multipliers are calibrated using:
- Historical stock price volatility during geopolitical events
- Earnings sensitivity to trade policy changes
- Supply chain complexity indices
- Regulatory exposure metrics

### 3.4 Political Alignment Factor

#### 3.4.1 Alignment Categories

**Strong Alliance (0.85 multiplier)**
- NATO members
- Close defense partnerships
- Comprehensive trade agreements
- Examples: US-UK, US-Canada, US-Australia

**Friendly Relations (0.95 multiplier)**
- Positive diplomatic relations
- Active trade partnerships
- No major disputes
- Examples: US-Japan, US-South Korea, US-EU

**Neutral (1.00 multiplier)**
- Normal diplomatic relations
- Limited strategic alignment
- Transactional relationships
- Examples: US-India, US-Brazil

**Strained Relations (1.15 multiplier)**
- Diplomatic tensions
- Trade disputes
- Strategic competition
- Examples: US-Russia, US-Iran

**Adversarial (1.30 multiplier)**
- Active conflicts
- Comprehensive sanctions
- Strategic rivalry
- Examples: US-North Korea, historical US-USSR

#### 3.4.2 Alignment Score Calculation

```
Alignment_Factor = Base_Factor × (1 + Tension_Adjustment)

Where:
Base_Factor = Category multiplier (0.85 to 1.30)
Tension_Adjustment = Recent event modifier (-0.1 to +0.2)
```

---

## 4. Mathematical Framework

### 4.1 Core CO-GRI Formula

#### 4.1.1 Basic Formula

```
CO-GRI = Σ[Channel_i × Weight_i] × Sector_Multiplier

Where:
Channel_i = Σ(Exposure_ij × CSI_j × Alignment_ij)
i = Channel index (1 to 4)
j = Country index
```

#### 4.1.2 Expanded Formula

```
CO-GRI = [
  (Revenue_Channel × 0.40) +
  (Supply_Channel × 0.35) +
  (Asset_Channel × 0.15) +
  (Financial_Channel × 0.10)
] × Sector_Multiplier

Where each Channel is:
Channel = Σ(Exposure_% × CSI × Political_Alignment) / 100
```

### 4.2 Channel-Specific Calculations

#### 4.2.1 Revenue Channel

```
Revenue_Channel = Σ(Revenue_j / Total_Revenue × CSI_j × Alignment_j)

Where:
Revenue_j = Revenue from country j
Total_Revenue = Total company revenue
CSI_j = Country Shock Index for country j
Alignment_j = Political alignment factor for country j
```

**Example:**
```
Company XYZ Revenue Distribution:
- US: $500M (50%)
- China: $300M (30%)
- Germany: $200M (20%)
Total: $1,000M

CSI Scores:
- US: 35
- China: 58
- Germany: 28

Alignment Factors (US-based company):
- US: 1.00 (home country)
- China: 1.15 (strained)
- Germany: 0.85 (strong alliance)

Revenue_Channel = 
  (0.50 × 35 × 1.00) + 
  (0.30 × 58 × 1.15) + 
  (0.20 × 28 × 0.85)
= 17.5 + 20.01 + 4.76
= 42.27
```

#### 4.2.2 Supply Chain Channel

```
Supply_Channel = Σ(Supply_j / Total_Supply × CSI_j × Alignment_j × Criticality_j)

Where:
Supply_j = Supply value from country j
Total_Supply = Total supply value
Criticality_j = Supply criticality factor (1.0 to 1.5)
```

**Criticality Factors:**
- Single source: 1.5
- Dual source: 1.2
- Multiple sources: 1.0

**Example:**
```
Supply Distribution:
- Taiwan (semiconductors, single source): $200M (40%), Criticality: 1.5
- Vietnam (assembly): $150M (30%), Criticality: 1.0
- Mexico (components): $150M (30%), Criticality: 1.2

CSI Scores:
- Taiwan: 65
- Vietnam: 42
- Mexico: 38

Alignment Factors:
- Taiwan: 0.95
- Vietnam: 1.00
- Mexico: 0.90

Supply_Channel = 
  (0.40 × 65 × 0.95 × 1.5) + 
  (0.30 × 42 × 1.00 × 1.0) + 
  (0.30 × 38 × 0.90 × 1.2)
= 37.05 + 12.6 + 12.31
= 61.96
```

#### 4.2.3 Asset Channel

```
Asset_Channel = Σ(Asset_Value_j / Total_Assets × CSI_j × Alignment_j × Asset_Type_j)

Where:
Asset_Type_j = Asset type risk factor
  - Physical assets: 1.2
  - Financial assets: 1.0
  - IP/Intangible: 1.3
```

#### 4.2.4 Financial Channel

```
Financial_Channel = Σ(Financial_Exposure_j × CSI_j × Alignment_j × Liquidity_j)

Where:
Liquidity_j = Market liquidity factor (0.8 to 1.2)
```

### 4.3 Final CO-GRI Calculation

```
CO-GRI = [
  (Revenue_Channel × 0.40) +
  (Supply_Channel × 0.35) +
  (Asset_Channel × 0.15) +
  (Financial_Channel × 0.10)
] × Sector_Multiplier
```

**Complete Example:**
```
Given:
- Revenue_Channel = 42.27
- Supply_Channel = 61.96
- Asset_Channel = 35.50
- Financial_Channel = 28.00
- Sector = Technology (Multiplier = 1.12)

CO-GRI = [
  (42.27 × 0.40) +
  (61.96 × 0.35) +
  (35.50 × 0.15) +
  (28.00 × 0.10)
] × 1.12

= [16.91 + 21.69 + 5.33 + 2.80] × 1.12
= 46.73 × 1.12
= 52.34

Risk Level: High Risk (50-70 range)
```

### 4.4 Confidence Intervals

#### 4.4.1 Uncertainty Quantification

```
CO-GRI_Confidence = ±(Data_Quality_Factor × Volatility_Factor)

Where:
Data_Quality_Factor = 1 - (Data_Completeness × Data_Recency)
Volatility_Factor = Historical_CSI_Volatility × Exposure_Concentration
```

#### 4.4.2 Confidence Levels

- **High Confidence (±3 points)**: Complete data, stable countries, diversified exposure
- **Moderate Confidence (±5 points)**: Good data, some volatility, moderate concentration
- **Low Confidence (±8 points)**: Limited data, high volatility, concentrated exposure

---

## 5. Assessment Process

### 5.1 Data Collection Workflow

#### 5.1.1 Step 1: Company Identification
- Ticker symbol input
- Company name verification
- Sector classification
- Home country determination

#### 5.1.2 Step 2: Geographic Exposure Extraction

**Primary Sources:**
1. SEC Filings (10-K, 10-Q)
2. Annual Reports
3. Investor Presentations
4. Corporate Websites

**Extraction Methods:**
- Natural Language Processing (NLP)
- Table parsing
- Narrative text analysis
- Geographic segment identification

**Data Points Collected:**
- Revenue by geography
- Long-lived assets by country
- Supply chain locations
- Customer concentrations
- Employee distributions

#### 5.1.3 Step 3: Channel Decomposition

**Revenue Channel:**
```python
def extract_revenue_channel(company_data):
    revenue_segments = parse_geographic_segments(company_data)
    
    for segment in revenue_segments:
        country = normalize_country_name(segment.geography)
        revenue_pct = segment.revenue / total_revenue
        
        revenue_exposures.append({
            'country': country,
            'percentage': revenue_pct,
            'absolute_value': segment.revenue
        })
    
    return revenue_exposures
```

**Supply Chain Channel:**
```python
def extract_supply_channel(company_data):
    # Parse supplier disclosures
    suppliers = extract_supplier_locations(company_data)
    
    # Parse manufacturing facilities
    facilities = extract_facility_locations(company_data)
    
    # Combine and weight
    supply_exposures = combine_supply_data(suppliers, facilities)
    
    return supply_exposures
```

#### 5.1.4 Step 4: CSI Assignment

```python
def assign_csi_scores(exposures):
    for exposure in exposures:
        country_code = get_country_code(exposure.country)
        csi_score = CSI_DATABASE[country_code]
        exposure.csi = csi_score
    
    return exposures
```

#### 5.1.5 Step 5: Political Alignment Calculation

```python
def calculate_alignment_factors(home_country, exposures):
    for exposure in exposures:
        host_country = exposure.country
        
        # Get bilateral relationship score
        relationship = get_bilateral_relationship(
            home_country, 
            host_country
        )
        
        # Apply alignment factor
        exposure.alignment_factor = ALIGNMENT_MATRIX[relationship]
    
    return exposures
```

#### 5.1.6 Step 6: Channel Score Calculation

```python
def calculate_channel_scores(exposures, channel_type):
    channel_score = 0
    
    for exposure in exposures:
        contribution = (
            exposure.percentage * 
            exposure.csi * 
            exposure.alignment_factor
        )
        
        if channel_type == 'supply':
            contribution *= exposure.criticality_factor
        
        channel_score += contribution
    
    return channel_score / 100  # Normalize
```

#### 5.1.7 Step 7: Final CO-GRI Calculation

```python
def calculate_cogri(channel_scores, sector):
    weighted_score = (
        channel_scores['revenue'] * 0.40 +
        channel_scores['supply'] * 0.35 +
        channel_scores['asset'] * 0.15 +
        channel_scores['financial'] * 0.10
    )
    
    sector_multiplier = SECTOR_MULTIPLIERS[sector]
    
    cogri = weighted_score * sector_multiplier
    
    return cogri
```

### 5.2 Quality Assurance Steps

#### 5.2.1 Data Validation
- Geographic exposure sums to 100%
- CSI scores within valid range (0-100)
- Alignment factors within bounds (0.85-1.30)
- Channel weights sum to 1.0

#### 5.2.2 Sanity Checks
- Compare with peer companies
- Historical trend analysis
- Outlier detection
- Manual review for anomalies

#### 5.2.3 Confidence Scoring
```python
def calculate_confidence(data_quality_metrics):
    completeness = data_quality_metrics['completeness']
    recency = data_quality_metrics['recency']
    consistency = data_quality_metrics['consistency']
    
    confidence = (
        completeness * 0.4 +
        recency * 0.3 +
        consistency * 0.3
    )
    
    return confidence
```

---

## 6. Predictive Forecasting (Phase 5D)

### 6.1 Forecast Framework

#### 6.1.1 Cedar Owl 2026 Integration

The predictive forecasting system integrates expert geopolitical intelligence from Cedar Owl to project future CO-GRI scores.

**Forecast Components:**
1. Country-level risk adjustments
2. Geopolitical event probabilities
3. Regional premium changes
4. Sector multiplier adjustments

#### 6.1.2 Time Horizons

**6-Month Forecast (6m)**
- Weight: 1.0
- Confidence: 95%
- Use case: Tactical decisions

**1-Year Forecast (1y)**
- Weight: 0.95
- Confidence: 90%
- Use case: Annual planning

**2-Year Forecast (2y)**
- Weight: 0.85
- Confidence: 75%
- Use case: Strategic planning

**5-Year Forecast (5y)**
- Weight: 0.70
- Confidence: 55%
- Use case: Long-term strategy

### 6.2 Predictive Calculation Formula

#### 6.2.1 Country-Level Forecast

```
Predicted_CSI_j = Current_CSI_j + (
    Forecast_Delta_j × 
    Time_Horizon_Weight × 
    Scenario_Multiplier
)

Where:
Forecast_Delta_j = Cedar Owl country adjustment (-10 to +10)
Time_Horizon_Weight = Decay factor by horizon
Scenario_Multiplier = Scenario adjustment factor
```

**Scenario Multipliers:**
- Optimistic: 0.7 (30% reduction in risk increases)
- Base Case: 1.0 (as forecasted)
- Pessimistic: 1.3 (30% amplification of risks)

#### 6.2.2 Event Impact Integration

```
Event_Impact_j = Σ(
    Event_Base_Impact_i × 
    Event_Probability_i × 
    Country_Affected_i,j
)

Where:
i = Event index
j = Country index
Country_Affected_i,j = 1 if country j affected by event i, else 0
```

**Event Probability Thresholds:**
- Optimistic scenario: Only events with P > 0.7
- Base case: Events with P > 0.5
- Pessimistic scenario: Events with P > 0.3

#### 6.2.3 Complete Predictive Formula

```
Predicted_CO-GRI = Σ[
    Predicted_Channel_i × 
    Channel_Weight_i
] × Predicted_Sector_Multiplier

Where:
Predicted_Channel_i = Σ(
    Predicted_Exposure_j × 
    Predicted_CSI_j × 
    Alignment_j
)

Predicted_CSI_j = Current_CSI_j + 
    Forecast_Delta_j + 
    Event_Impact_j + 
    Regional_Premium_j
```

### 6.3 Scenario Analysis

#### 6.3.1 Three-Scenario Framework

**Base Case:**
```
Base_Predicted_Score = Calculate_Predictive_COGRI(
    scenario = 'base',
    event_threshold = 0.5,
    adjustment_multiplier = 1.0
)
```

**Optimistic Case:**
```
Optimistic_Predicted_Score = Calculate_Predictive_COGRI(
    scenario = 'optimistic',
    event_threshold = 0.7,
    adjustment_multiplier = 0.7
)
```

**Pessimistic Case:**
```
Pessimistic_Predicted_Score = Calculate_Predictive_COGRI(
    scenario = 'pessimistic',
    event_threshold = 0.3,
    adjustment_multiplier = 1.3
)
```

#### 6.3.2 Scenario Range Analysis

```
Scenario_Range = {
    'min': min(Optimistic, Base, Pessimistic),
    'max': max(Optimistic, Base, Pessimistic),
    'spread': max - min,
    'uncertainty_level': categorize_spread(spread)
}

Uncertainty Levels:
- Low: spread < 10 points
- Moderate: 10 ≤ spread < 15
- High: 15 ≤ spread < 20
- Very High: spread ≥ 20
```

### 6.4 Confidence Calculation

#### 6.4.1 Multi-Factor Confidence

```
Forecast_Confidence = (
    Data_Quality × 0.30 +
    Forecast_Reliability × 0.30 +
    Time_Horizon_Confidence × 0.25 +
    Scenario_Confidence × 0.15
)

Where:
Data_Quality = Cedar Owl forecast confidence (0-1)
Forecast_Reliability = Country coverage ratio (0-1)
Time_Horizon_Confidence = Time decay factor (0-1)
Scenario_Confidence = 1.0 for base, 0.85 for others
```

#### 6.4.2 Time Horizon Confidence Decay

```
Time_Confidence = {
    '6m': 0.95,
    '1y': 0.90,
    '2y': 0.75,
    '5y': 0.55
}
```

### 6.5 Driving Factors Identification

#### 6.5.1 Top Risk Drivers

```python
def identify_driving_factors(country_forecasts, events):
    drivers = []
    
    # Find countries with largest risk changes
    sorted_countries = sort_by_risk_change(country_forecasts)
    
    for country in sorted_countries[:3]:
        if abs(country.risk_change) > 2:
            drivers.append(
                f"{country.name} risk {direction} "
                f"({abs(country.risk_change):.1f} points)"
            )
    
    # Add high-probability events
    high_prob_events = filter(events, probability > 0.6)
    
    for event in high_prob_events[:2]:
        drivers.append(
            f"{event.name} "
            f"({event.probability*100:.0f}% probability)"
        )
    
    return drivers
```

### 6.6 Example Predictive Calculation

**Given:**
- Company: Apple Inc. (AAPL)
- Current CO-GRI: 42.5
- Sector: Technology (Multiplier: 1.12)
- Time Horizon: 1 year
- Scenario: Base case

**Country Exposures:**
- US: 40%, Current CSI: 35
- China: 30%, Current CSI: 58
- Europe: 20%, Current CSI: 30
- Other: 10%, Current CSI: 45

**Cedar Owl Forecasts (1-year):**
- US: Delta = -1.5
- China: Delta = +3.2
- Europe: Delta = +1.0
- Other: Delta = +0.5

**Step 1: Calculate Predicted CSI**
```
Predicted_CSI_US = 35 + (-1.5 × 0.95 × 1.0) = 33.58
Predicted_CSI_CN = 58 + (3.2 × 0.95 × 1.0) = 61.04
Predicted_CSI_EU = 30 + (1.0 × 0.95 × 1.0) = 30.95
Predicted_CSI_Other = 45 + (0.5 × 0.95 × 1.0) = 45.48
```

**Step 2: Apply Event Impacts**
```
US-China Tech Decoupling Event:
- Probability: 0.75
- Base Impact: 8.0
- Affects: US, China

Event_Impact_CN = 8.0 × 0.75 = 6.0
Predicted_CSI_CN = 61.04 + 6.0 = 67.04
```

**Step 3: Calculate Predicted Channel Score**
```
Predicted_Revenue_Channel = 
    (0.40 × 33.58 × 1.00) +
    (0.30 × 67.04 × 1.15) +
    (0.20 × 30.95 × 0.85) +
    (0.10 × 45.48 × 1.00)
= 13.43 + 23.13 + 5.26 + 4.55
= 46.37
```

**Step 4: Calculate Predicted CO-GRI**
```
Predicted_CO-GRI = 46.37 × 1.12 = 51.93

Change: +9.43 points (+22.2%)
Risk Level: High Risk (up from Moderate Risk)
```

**Step 5: Calculate Confidence**
```
Forecast_Confidence = 
    (0.82 × 0.30) +  # Data quality
    (0.90 × 0.30) +  # Forecast reliability
    (0.90 × 0.25) +  # Time horizon
    (1.00 × 0.15)    # Scenario
= 0.246 + 0.270 + 0.225 + 0.150
= 0.891 = 89.1%
```

---

## 7. Data Sources and Collection

### 7.1 Primary Data Sources

#### 7.1.1 SEC Filings

**Form 10-K (Annual Report)**
- Item 1: Business description
- Item 1A: Risk factors
- Item 7: MD&A (Management Discussion & Analysis)
- Item 8: Financial statements and notes
  - Note on segment reporting
  - Note on geographic information
  - Note on major customers

**Form 10-Q (Quarterly Report)**
- Part I, Item 1: Financial statements
- Geographic segment updates
- Material changes in risk factors

**Form 8-K (Current Report)**
- Material events
- Acquisitions/divestitures
- Supply chain disruptions

#### 7.1.2 Company Disclosures

**Annual Reports**
- Letter to shareholders
- Business segment descriptions
- Geographic market analysis
- Supply chain information

**Investor Presentations**
- Revenue breakdown slides
- Market expansion plans
- Strategic priorities
- Risk discussions

**Earnings Calls**
- Management commentary
- Geographic performance
- Supply chain updates
- Geopolitical risk mentions

#### 7.1.3 Third-Party Data

**Bloomberg Terminal**
- Geographic revenue data
- Supply chain information
- Country exposure metrics

**FactSet**
- Segment data
- Peer comparisons
- Historical trends

**S&P Capital IQ**
- Company profiles
- Financial data
- Geographic segments

### 7.2 Country Risk Data

#### 7.2.1 CSI Data Sources

**World Bank Governance Indicators**
- Political stability
- Government effectiveness
- Regulatory quality
- Rule of law
- Control of corruption

**IMF Data**
- Economic indicators
- Fiscal data
- External stability

**Political Risk Services (PRS Group)**
- Political risk ratings
- Economic risk ratings
- Financial risk ratings

**Economist Intelligence Unit (EIU)**
- Country risk ratings
- Political stability index
- Business environment rankings

**Freedom House**
- Political rights
- Civil liberties
- Democracy scores

#### 7.2.2 Geopolitical Intelligence

**Cedar Owl**
- Expert geopolitical forecasts
- Event probability assessments
- Country risk projections
- Regional analysis

**Stratfor**
- Geopolitical analysis
- Conflict forecasting
- Strategic assessments

**Crisis Group**
- Conflict monitoring
- Early warning indicators
- Peace process tracking

### 7.3 Data Processing Pipeline

#### 7.3.1 Extraction

```python
class DataExtractor:
    def extract_sec_filing(self, ticker, form_type):
        # Download filing from SEC EDGAR
        filing = download_sec_filing(ticker, form_type)
        
        # Parse HTML/XML
        parsed_doc = parse_filing(filing)
        
        # Extract geographic segments
        geo_segments = extract_geographic_data(parsed_doc)
        
        return geo_segments
    
    def extract_supply_chain(self, company_data):
        # NLP-based extraction
        suppliers = nlp_extract_suppliers(company_data)
        
        # Location mapping
        supplier_locations = map_to_countries(suppliers)
        
        return supplier_locations
```

#### 7.3.2 Normalization

```python
class DataNormalizer:
    def normalize_country_names(self, raw_data):
        # Standardize country names
        for entry in raw_data:
            entry.country = COUNTRY_NAME_MAP.get(
                entry.country, 
                entry.country
            )
        
        return raw_data
    
    def normalize_percentages(self, segments):
        # Ensure percentages sum to 100%
        total = sum(s.percentage for s in segments)
        
        for segment in segments:
            segment.percentage = (segment.percentage / total) * 100
        
        return segments
```

#### 7.3.3 Validation

```python
class DataValidator:
    def validate_geographic_data(self, data):
        errors = []
        
        # Check percentage sum
        total_pct = sum(d.percentage for d in data)
        if abs(total_pct - 100) > 0.1:
            errors.append(f"Percentages sum to {total_pct}, not 100")
        
        # Check country codes
        for entry in data:
            if entry.country_code not in VALID_COUNTRY_CODES:
                errors.append(f"Invalid country code: {entry.country_code}")
        
        # Check value ranges
        for entry in data:
            if not (0 <= entry.percentage <= 100):
                errors.append(f"Invalid percentage: {entry.percentage}")
        
        return errors
```

---

## 8. Validation and Quality Control

### 8.1 Internal Validation

#### 8.1.1 Mathematical Consistency

**Sum Checks:**
```python
def validate_mathematical_consistency(cogri_calculation):
    # Channel weights sum to 1.0
    assert abs(sum(CHANNEL_WEIGHTS.values()) - 1.0) < 0.001
    
    # Exposure percentages sum to 100%
    for channel in cogri_calculation.channels:
        total_exposure = sum(e.percentage for e in channel.exposures)
        assert abs(total_exposure - 100) < 0.1
    
    # CSI scores in valid range
    for exposure in all_exposures:
        assert 0 <= exposure.csi <= 100
    
    # Alignment factors in valid range
    for exposure in all_exposures:
        assert 0.85 <= exposure.alignment <= 1.30
```

#### 8.1.2 Logical Consistency

```python
def validate_logical_consistency(company_assessment):
    # Home country should have alignment factor of 1.0
    home_country = company_assessment.home_country
    home_exposures = [e for e in exposures if e.country == home_country]
    
    for exposure in home_exposures:
        assert exposure.alignment_factor == 1.0
    
    # High-risk countries should increase CO-GRI
    high_risk_exposure = sum(
        e.percentage for e in exposures if e.csi > 60
    )
    
    if high_risk_exposure > 50:
        assert company_assessment.cogri > 50
```

### 8.2 External Validation

#### 8.2.1 Peer Comparison

```python
def validate_against_peers(company, peers):
    company_cogri = company.cogri
    peer_cogris = [p.cogri for p in peers]
    
    # Calculate z-score
    mean_peer = np.mean(peer_cogris)
    std_peer = np.std(peer_cogris)
    z_score = (company_cogri - mean_peer) / std_peer
    
    # Flag if more than 2 standard deviations
    if abs(z_score) > 2:
        return {
            'warning': 'Outlier detected',
            'z_score': z_score,
            'company_cogri': company_cogri,
            'peer_mean': mean_peer
        }
    
    return {'status': 'ok'}
```

#### 8.2.2 Historical Validation

```python
def validate_historical_trend(company, historical_data):
    current_cogri = company.cogri
    previous_cogri = historical_data[-1].cogri
    
    change = current_cogri - previous_cogri
    
    # Check for unexplained large changes
    if abs(change) > 15:
        # Verify with major events
        events = get_major_events(
            company, 
            historical_data[-1].date, 
            company.assessment_date
        )
        
        if not events:
            return {
                'warning': 'Large change without major events',
                'change': change,
                'current': current_cogri,
                'previous': previous_cogri
            }
    
    return {'status': 'ok'}
```

### 8.3 Sensitivity Analysis

#### 8.3.1 Parameter Sensitivity

```python
def sensitivity_analysis(base_calculation):
    results = {}
    
    # Test CSI sensitivity
    for country in base_calculation.countries:
        # Increase CSI by 10%
        modified_calc = copy.deepcopy(base_calculation)
        modified_calc.csi[country] *= 1.1
        
        new_cogri = calculate_cogri(modified_calc)
        sensitivity = (new_cogri - base_calculation.cogri) / base_calculation.cogri
        
        results[f'csi_{country}'] = {
            'change': '+10%',
            'cogri_change': new_cogri - base_calculation.cogri,
            'sensitivity': sensitivity
        }
    
    # Test channel weight sensitivity
    for channel in CHANNELS:
        modified_calc = copy.deepcopy(base_calculation)
        modified_calc.weights[channel] *= 1.1
        # Renormalize other weights
        renormalize_weights(modified_calc.weights, channel)
        
        new_cogri = calculate_cogri(modified_calc)
        results[f'weight_{channel}'] = {
            'change': '+10%',
            'cogri_change': new_cogri - base_calculation.cogri
        }
    
    return results
```

#### 8.3.2 Scenario Testing

```python
def scenario_testing(company):
    scenarios = {}
    
    # Scenario 1: Major market disruption
    scenario_1 = copy.deepcopy(company)
    largest_market = max(company.exposures, key=lambda x: x.percentage)
    scenario_1.csi[largest_market.country] += 20
    scenarios['major_disruption'] = calculate_cogri(scenario_1)
    
    # Scenario 2: Supply chain shock
    scenario_2 = copy.deepcopy(company)
    for supplier in scenario_2.supply_chain:
        supplier.csi += 15
    scenarios['supply_shock'] = calculate_cogri(scenario_2)
    
    # Scenario 3: Political deterioration
    scenario_3 = copy.deepcopy(company)
    for exposure in scenario_3.exposures:
        if exposure.alignment_factor > 1.0:
            exposure.alignment_factor *= 1.2
    scenarios['political_deterioration'] = calculate_cogri(scenario_3)
    
    return scenarios
```

### 8.4 Quality Metrics

#### 8.4.1 Data Quality Score

```python
def calculate_data_quality(assessment):
    quality_factors = {}
    
    # Completeness
    required_fields = ['revenue', 'supply', 'assets', 'financial']
    completeness = sum(
        1 for field in required_fields 
        if assessment.has_data(field)
    ) / len(required_fields)
    quality_factors['completeness'] = completeness
    
    # Recency
    days_old = (today - assessment.data_date).days
    recency = max(0, 1 - (days_old / 365))
    quality_factors['recency'] = recency
    
    # Consistency
    consistency = check_cross_validation(assessment)
    quality_factors['consistency'] = consistency
    
    # Overall quality
    overall = (
        completeness * 0.4 +
        recency * 0.3 +
        consistency * 0.3
    )
    
    return {
        'overall': overall,
        'factors': quality_factors,
        'grade': assign_grade(overall)
    }
```

#### 8.4.2 Confidence Intervals

```python
def calculate_confidence_interval(cogri, quality_score):
    # Base uncertainty
    base_uncertainty = 5.0
    
    # Adjust for data quality
    quality_adjustment = (1 - quality_score) * 3.0
    
    # Adjust for exposure concentration
    concentration = calculate_herfindahl_index(exposures)
    concentration_adjustment = concentration * 2.0
    
    # Total uncertainty
    total_uncertainty = (
        base_uncertainty + 
        quality_adjustment + 
        concentration_adjustment
    )
    
    return {
        'cogri': cogri,
        'lower_bound': cogri - total_uncertainty,
        'upper_bound': cogri + total_uncertainty,
        'uncertainty': total_uncertainty
    }
```

---

## 9. Interpretation Guidelines

### 9.1 Risk Level Categories

#### 9.1.1 Score Ranges

| Score Range | Risk Level | Interpretation | Investment Implication |
|-------------|-----------|----------------|----------------------|
| 0-25 | Low Risk | Minimal geopolitical exposure | Safe for conservative portfolios |
| 25-40 | Moderate Risk | Some exposure, manageable | Suitable for balanced portfolios |
| 40-55 | Elevated Risk | Significant exposure | Requires active monitoring |
| 55-70 | High Risk | Substantial geopolitical risk | Only for risk-tolerant investors |
| 70-100 | Very High Risk | Extreme exposure | High risk/high return potential |

#### 9.1.2 Contextual Factors

**Industry Context:**
- Technology companies typically score 45-60 (high supply chain complexity)
- Financial services typically score 30-45 (regulatory exposure)
- Utilities typically score 20-35 (domestic focus)

**Company Size:**
- Large multinationals: Higher scores due to broader exposure
- Mid-cap companies: Moderate scores, concentrated exposure
- Small-cap companies: Variable, often concentrated in home market

**Business Model:**
- Asset-heavy: Higher scores (physical exposure)
- Asset-light: Lower scores (limited physical presence)
- Digital: Variable (regulatory and cyber risks)

### 9.2 Change Analysis

#### 9.2.1 Significant Changes

**Threshold for Significance:**
- ±5 points: Notable change, review recommended
- ±10 points: Significant change, action may be required
- ±15 points: Major change, immediate review necessary

**Common Causes of Changes:**
1. Geographic expansion/contraction
2. Supply chain restructuring
3. Geopolitical events (sanctions, conflicts)
4. Regulatory changes
5. M&A activity

#### 9.2.2 Trend Analysis

```python
def analyze_trend(historical_cogri):
    # Calculate moving average
    ma_3m = moving_average(historical_cogri, periods=3)
    ma_12m = moving_average(historical_cogri, periods=12)
    
    # Determine trend
    if ma_3m[-1] > ma_12m[-1] + 5:
        trend = 'Rising Risk'
    elif ma_3m[-1] < ma_12m[-1] - 5:
        trend = 'Declining Risk'
    else:
        trend = 'Stable'
    
    # Calculate volatility
    volatility = np.std(historical_cogri[-12:])
    
    return {
        'trend': trend,
        'volatility': volatility,
        'current': historical_cogri[-1],
        'ma_3m': ma_3m[-1],
        'ma_12m': ma_12m[-1]
    }
```

### 9.3 Comparative Analysis

#### 9.3.1 Peer Benchmarking

```python
def benchmark_against_peers(company, peer_group):
    company_cogri = company.cogri
    peer_cogris = [p.cogri for p in peer_group]
    
    percentile = percentileofscore(peer_cogris, company_cogri)
    
    interpretation = {
        'percentile': percentile,
        'position': categorize_percentile(percentile),
        'peer_mean': np.mean(peer_cogris),
        'peer_median': np.median(peer_cogris),
        'peer_std': np.std(peer_cogris)
    }
    
    return interpretation

def categorize_percentile(percentile):
    if percentile < 25:
        return 'Low Risk (Bottom Quartile)'
    elif percentile < 50:
        return 'Below Average Risk'
    elif percentile < 75:
        return 'Above Average Risk'
    else:
        return 'High Risk (Top Quartile)'
```

#### 9.3.2 Sector Comparison

```python
def compare_to_sector(company, sector_data):
    sector_mean = sector_data['mean_cogri']
    sector_std = sector_data['std_cogri']
    
    z_score = (company.cogri - sector_mean) / sector_std
    
    if z_score < -1:
        position = 'Significantly below sector average'
    elif z_score < 0:
        position = 'Below sector average'
    elif z_score < 1:
        position = 'Above sector average'
    else:
        position = 'Significantly above sector average'
    
    return {
        'z_score': z_score,
        'position': position,
        'sector_mean': sector_mean,
        'company_cogri': company.cogri
    }
```

### 9.4 Investment Decision Framework

#### 9.4.1 Risk-Return Trade-off

```python
def assess_risk_return(company):
    cogri = company.cogri
    expected_return = company.expected_return
    
    # Calculate risk-adjusted return
    risk_free_rate = 0.03
    risk_premium = expected_return - risk_free_rate
    
    # Adjust for geopolitical risk
    geopolitical_discount = cogri / 100 * 0.05  # 5% max discount
    adjusted_return = expected_return - geopolitical_discount
    
    # Sharpe-like ratio
    risk_adjusted_metric = (
        (adjusted_return - risk_free_rate) / 
        (company.volatility + cogri/100)
    )
    
    return {
        'expected_return': expected_return,
        'geopolitical_discount': geopolitical_discount,
        'adjusted_return': adjusted_return,
        'risk_adjusted_metric': risk_adjusted_metric,
        'recommendation': generate_recommendation(risk_adjusted_metric)
    }
```

#### 9.4.2 Portfolio Construction

```python
def portfolio_geopolitical_risk(portfolio):
    # Calculate weighted average CO-GRI
    total_value = sum(p.market_value for p in portfolio.positions)
    
    weighted_cogri = sum(
        (p.market_value / total_value) * p.company.cogri
        for p in portfolio.positions
    )
    
    # Calculate concentration risk
    country_exposures = aggregate_country_exposures(portfolio)
    concentration = calculate_herfindahl_index(country_exposures)
    
    # Diversification benefit
    individual_risks = [p.company.cogri for p in portfolio.positions]
    avg_individual_risk = np.mean(individual_risks)
    diversification_benefit = avg_individual_risk - weighted_cogri
    
    return {
        'portfolio_cogri': weighted_cogri,
        'concentration_index': concentration,
        'diversification_benefit': diversification_benefit,
        'risk_level': categorize_risk(weighted_cogri)
    }
```

### 9.5 Predictive Interpretation

#### 9.5.1 Forecast Confidence

**High Confidence (>80%)**
- Strong data quality
- Stable geopolitical environment
- Near-term horizon (6m-1y)
- Base case scenario

**Moderate Confidence (60-80%)**
- Good data quality
- Some geopolitical volatility
- Medium-term horizon (1y-2y)
- Alternative scenarios

**Low Confidence (<60%)**
- Limited data
- High geopolitical uncertainty
- Long-term horizon (5y)
- Extreme scenarios

#### 9.5.2 Scenario Spread Interpretation

```python
def interpret_scenario_spread(scenario_analysis):
    spread = scenario_analysis.range.spread
    
    if spread < 10:
        uncertainty = 'Low'
        implication = 'Predictable outlook, stable planning'
    elif spread < 15:
        uncertainty = 'Moderate'
        implication = 'Some variability, flexible planning needed'
    elif spread < 20:
        uncertainty = 'High'
        implication = 'Significant uncertainty, scenario planning critical'
    else:
        uncertainty = 'Very High'
        implication = 'Extreme uncertainty, hedging strategies recommended'
    
    return {
        'uncertainty_level': uncertainty,
        'spread': spread,
        'implication': implication,
        'recommendation': generate_scenario_recommendation(spread)
    }
```

---

## 10. Case Studies

### 10.1 Case Study 1: Apple Inc. (AAPL)

#### 10.1.1 Company Profile
- **Sector:** Technology
- **Home Country:** United States
- **Primary Markets:** Global
- **Business Model:** Hardware, software, services

#### 10.1.2 Geographic Exposure

**Revenue Channel (40% weight):**
| Region | Revenue % | CSI | Alignment | Contribution |
|--------|-----------|-----|-----------|--------------|
| Americas | 42% | 35 | 1.00 | 14.70 |
| Europe | 24% | 30 | 0.85 | 6.12 |
| Greater China | 19% | 58 | 1.15 | 12.70 |
| Japan | 7% | 25 | 0.95 | 1.66 |
| Rest of Asia | 8% | 45 | 1.00 | 3.60 |
| **Total** | **100%** | - | - | **38.78** |

**Supply Chain Channel (35% weight):**
| Location | Supply % | CSI | Alignment | Criticality | Contribution |
|----------|----------|-----|-----------|-------------|--------------|
| China | 40% | 58 | 1.15 | 1.3 | 34.70 |
| Taiwan | 25% | 65 | 0.95 | 1.5 | 23.16 |
| South Korea | 15% | 35 | 0.95 | 1.2 | 5.99 |
| Vietnam | 12% | 42 | 1.00 | 1.0 | 5.04 |
| Other | 8% | 40 | 1.00 | 1.0 | 3.20 |
| **Total** | **100%** | - | - | **72.09** |

**Asset Channel (15% weight):**
| Location | Asset % | CSI | Alignment | Contribution |
|----------|---------|-----|-----------|--------------|
| United States | 60% | 35 | 1.00 | 21.00 |
| China | 20% | 58 | 1.15 | 13.34 |
| Europe | 15% | 30 | 0.85 | 3.83 |
| Other | 5% | 40 | 1.00 | 2.00 |
| **Total** | **100%** | - | - | **40.17** |

**Financial Channel (10% weight):**
| Exposure | % | CSI | Alignment | Contribution |
|----------|---|-----|-----------|--------------|
| USD | 50% | 35 | 1.00 | 17.50 |
| EUR | 20% | 30 | 0.85 | 5.10 |
| CNY | 15% | 58 | 1.15 | 10.01 |
| Other | 15% | 40 | 1.00 | 6.00 |
| **Total** | **100%** | - | - | **38.61** |

#### 10.1.3 CO-GRI Calculation

```
CO-GRI = [
    (38.78 × 0.40) +  # Revenue
    (72.09 × 0.35) +  # Supply
    (40.17 × 0.15) +  # Assets
    (38.61 × 0.10)    # Financial
] × 1.12  # Technology sector multiplier

= [15.51 + 25.23 + 6.03 + 3.86] × 1.12
= 50.63 × 1.12
= 56.71

Risk Level: High Risk
```

#### 10.1.4 Key Findings

**Strengths:**
- Diversified revenue base across multiple regions
- Strong home market (US) presence
- Established brand and ecosystem

**Vulnerabilities:**
- Heavy reliance on China for manufacturing (40% of supply)
- Taiwan semiconductor dependency (critical, single-source risk)
- Exposure to US-China tensions
- Supply chain concentration

**Risk Drivers:**
1. China manufacturing exposure (34.70 points contribution)
2. Taiwan semiconductor risk (23.16 points contribution)
3. US-China geopolitical tensions
4. Supply chain complexity

#### 10.1.5 Predictive Forecast (1-Year, Base Case)

**Cedar Owl Adjustments:**
- China: +3.2 (economic slowdown, tech restrictions)
- Taiwan: +4.5 (cross-strait tensions)
- US: -1.5 (stable outlook)

**Event Impacts:**
- US-China Tech Decoupling (75% probability): +6.0 points to China
- Taiwan Strait Tensions (60% probability): +9.0 points to Taiwan

**Predicted CO-GRI:**
```
Predicted Supply Channel = 
    (0.40 × (58+3.2+6.0) × 1.15 × 1.3) +
    (0.25 × (65+4.5+9.0) × 0.95 × 1.5) +
    ...
= 40.09 + 28.01 + ... = 85.42

Predicted CO-GRI = [
    (40.12 × 0.40) +
    (85.42 × 0.35) +
    (42.50 × 0.15) +
    (40.20 × 0.10)
] × 1.12
= 63.47

Change: +6.76 points (+11.9%)
New Risk Level: High Risk (elevated)
Confidence: 87%
```

**Recommendations:**
1. Diversify supply chain away from China and Taiwan
2. Increase inventory buffers for critical components
3. Develop alternative supplier relationships
4. Monitor US-China relations closely
5. Consider hedging strategies for currency and political risks

---

### 10.2 Case Study 2: Coca-Cola Company (KO)

#### 10.2.1 Company Profile
- **Sector:** Consumer Defensive
- **Home Country:** United States
- **Primary Markets:** Global (200+ countries)
- **Business Model:** Beverage manufacturing and distribution

#### 10.2.2 Geographic Exposure

**Revenue Channel:**
| Region | Revenue % | CSI | Alignment | Contribution |
|--------|-----------|-----|-----------|--------------|
| North America | 35% | 35 | 1.00 | 12.25 |
| Europe, Middle East, Africa | 28% | 38 | 0.90 | 9.58 |
| Latin America | 18% | 48 | 0.95 | 8.21 |
| Asia Pacific | 19% | 42 | 0.98 | 7.82 |
| **Total** | **100%** | - | - | **37.86** |

**Supply Chain Channel:**
| Region | Supply % | CSI | Alignment | Contribution |
|--------|----------|-----|-----------|--------------|
| Local sourcing | 70% | 38 | 0.95 | 25.27 |
| Regional hubs | 30% | 40 | 1.00 | 12.00 |
| **Total** | **100%** | - | - | **37.27** |

#### 10.2.3 CO-GRI Calculation

```
CO-GRI = [
    (37.86 × 0.40) +  # Revenue
    (37.27 × 0.35) +  # Supply
    (35.50 × 0.15) +  # Assets
    (32.00 × 0.10)    # Financial
] × 1.04  # Consumer Defensive multiplier

= [15.14 + 13.04 + 5.33 + 3.20] × 1.04
= 36.71 × 1.04
= 38.18

Risk Level: Moderate Risk
```

#### 10.2.4 Key Findings

**Strengths:**
- Highly diversified geographic presence
- Local sourcing strategy reduces supply chain risk
- Consumer defensive sector (stable demand)
- Low sector multiplier

**Vulnerabilities:**
- Emerging market exposure (Latin America, Asia)
- Currency translation risk
- Regulatory risk (sugar taxes, health regulations)

**Risk Profile:**
- Lower than technology companies
- Higher than pure domestic companies
- Moderate and stable risk level

---

### 10.3 Case Study 3: Tesla Inc. (TSLA)

#### 10.3.1 Company Profile
- **Sector:** Automotive
- **Home Country:** United States
- **Primary Markets:** US, China, Europe
- **Business Model:** Electric vehicles, energy storage

#### 10.3.2 Geographic Exposure

**Revenue Channel:**
| Region | Revenue % | CSI | Alignment | Contribution |
|--------|-----------|-----|-----------|--------------|
| United States | 45% | 35 | 1.00 | 15.75 |
| China | 25% | 58 | 1.15 | 16.67 |
| Europe | 20% | 30 | 0.85 | 5.10 |
| Other | 10% | 45 | 1.00 | 4.50 |
| **Total** | **100%** | - | - | **42.02** |

**Supply Chain Channel:**
| Location | Supply % | CSI | Alignment | Criticality | Contribution |
|----------|----------|-----|-----------|-------------|--------------|
| China (batteries) | 35% | 58 | 1.15 | 1.5 | 35.09 |
| US (manufacturing) | 30% | 35 | 1.00 | 1.2 | 12.60 |
| Germany (manufacturing) | 20% | 28 | 0.85 | 1.2 | 5.71 |
| Other | 15% | 40 | 1.00 | 1.0 | 6.00 |
| **Total** | **100%** | - | - | **59.40** |

#### 10.3.3 CO-GRI Calculation

```
CO-GRI = [
    (42.02 × 0.40) +  # Revenue
    (59.40 × 0.35) +  # Supply
    (38.00 × 0.15) +  # Assets
    (35.00 × 0.10)    # Financial
] × 1.18  # Automotive multiplier

= [16.81 + 20.79 + 5.70 + 3.50] × 1.18
= 46.80 × 1.18
= 55.22

Risk Level: High Risk
```

#### 10.3.4 Key Findings

**Strengths:**
- Growing market share in EVs
- Vertical integration strategy
- Multiple manufacturing locations

**Vulnerabilities:**
- Heavy China dependence (revenue and supply)
- Battery supply chain concentration
- High automotive sector multiplier
- Regulatory uncertainty (subsidies, emissions)

**Risk Drivers:**
1. China market and supply chain exposure
2. Battery supply chain criticality
3. US-China tensions impact
4. Automotive sector complexity

---

## 11. Appendices

### Appendix A: Country Shock Index (CSI) Reference Table

| Country | CSI Score | Risk Level | Key Factors |
|---------|-----------|------------|-------------|
| United States | 35 | Low-Moderate | Political polarization, debt concerns |
| China | 58 | High | Economic slowdown, geopolitical tensions |
| Germany | 28 | Low | Energy transition, manufacturing challenges |
| Japan | 25 | Low | Stable democracy, aging population |
| United Kingdom | 30 | Low | Post-Brexit adjustments |
| France | 32 | Low-Moderate | Fiscal pressures, social unrest |
| India | 45 | Moderate | Growth opportunities, infrastructure gaps |
| Brazil | 52 | High | Political volatility, economic challenges |
| Russia | 78 | Very High | Sanctions, conflict, economic isolation |
| Saudi Arabia | 48 | Moderate | Diversification efforts, regional tensions |
| Taiwan | 65 | High | Cross-strait tensions |
| South Korea | 35 | Low-Moderate | North Korea risk, tech competition |
| Mexico | 42 | Moderate | Security challenges, USMCA benefits |
| Canada | 30 | Low | Stable, resource-dependent |
| Australia | 28 | Low | Stable democracy, China trade tensions |

### Appendix B: Sector Multiplier Reference Table

| Sector | Multiplier | Justification |
|--------|-----------|---------------|
| Technology | 1.12 | IP theft, export controls, tech nationalism |
| Automotive | 1.18 | Complex supply chains, trade barriers, tariffs |
| Energy | 1.15 | Resource nationalism, sanctions, price volatility |
| Financial Services | 1.08 | Regulatory arbitrage, capital controls |
| Healthcare | 1.10 | Regulatory divergence, pricing pressures |
| Industrials | 1.09 | Trade dependencies, tariffs |
| Consumer Cyclical | 1.06 | Discretionary demand sensitivity |
| Basic Materials | 1.11 | Resource concentration, commodity volatility |
| Utilities | 1.05 | Regulated monopolies, local focus |
| Real Estate | 1.02 | Property rights, local regulations |
| Communication Services | 1.07 | Content regulation, data sovereignty |
| Consumer Defensive | 1.04 | Essential goods, stable demand |

### Appendix C: Political Alignment Matrix

| Relationship Type | Multiplier | Examples |
|------------------|-----------|----------|
| Strong Alliance | 0.85 | US-UK, US-Canada, US-Australia |
| Friendly Relations | 0.95 | US-Japan, US-South Korea, US-EU |
| Neutral | 1.00 | US-India, US-Brazil, US-Indonesia |
| Strained Relations | 1.15 | US-Russia, US-Iran, US-Venezuela |
| Adversarial | 1.30 | US-North Korea, historical US-USSR |

### Appendix D: Cedar Owl 2026 Forecast Summary

**Major Geopolitical Events:**

1. **US-China Tech Decoupling Acceleration**
   - Probability: 75%
   - Risk Level: HIGH
   - Impact: +8.0 points
   - Affected: US, China, Taiwan, South Korea, Japan, Germany

2. **Middle East Conflict Escalation**
   - Probability: 45%
   - Risk Level: CRITICAL
   - Impact: +12.0 points
   - Affected: Israel, Saudi Arabia, UAE, Turkey, US, UK, France

3. **Taiwan Strait Tensions Increase**
   - Probability: 60%
   - Risk Level: CRITICAL
   - Impact: +15.0 points
   - Affected: Taiwan, China, US, Japan, South Korea, Australia

4. **European Energy Security Crisis**
   - Probability: 35%
   - Risk Level: HIGH
   - Impact: +7.5 points
   - Affected: Germany, France, Italy, Spain, Poland, Netherlands

5. **Emerging Market Debt Crisis**
   - Probability: 40%
   - Risk Level: HIGH
   - Impact: +9.0 points
   - Affected: Argentina, Turkey, Brazil, Egypt, Pakistan

### Appendix E: Glossary

**CO-GRI (Corporate Geopolitical Risk Index)**: A quantitative measure of a corporation's exposure to geopolitical risks, ranging from 0 (minimal risk) to 100 (maximum risk).

**CSI (Country Shock Index)**: A standardized measure of country-level geopolitical risk, ranging from 0 (stable) to 100 (extreme risk).

**Channel**: A distinct pathway through which geopolitical risks can impact a corporation (Revenue, Supply Chain, Assets, Financial).

**Exposure**: The percentage of a company's operations, revenue, or assets attributable to a specific geographic location.

**Sector Multiplier**: An adjustment factor that accounts for industry-specific sensitivities to geopolitical risks.

**Political Alignment Factor**: A modifier that reflects the diplomatic relationship between a company's home country and host countries.

**Predictive CO-GRI**: A forward-looking risk score based on geopolitical forecasts and scenario analysis.

**Scenario Analysis**: Evaluation of multiple potential future outcomes (optimistic, base case, pessimistic).

**Time Horizon**: The future time period for which predictions are made (6m, 1y, 2y, 5y).

**Confidence Score**: A measure of forecast reliability, ranging from 0 (no confidence) to 1 (complete confidence).

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-01 | Initial methodology document | CO-GRI Team |
| 2.0 | 2025-06 | Added sector multipliers and alignment factors | CO-GRI Team |
| 3.0 | 2026-03 | Expanded channel model to four channels | CO-GRI Team |
| 3.4 | 2027-01 | Added Phase 5D predictive forecasting | CO-GRI Team |

---

## References

1. World Bank. (2023). Worldwide Governance Indicators.
2. IMF. (2023). World Economic Outlook Database.
3. Political Risk Services Group. (2023). International Country Risk Guide.
4. Economist Intelligence Unit. (2023). Country Risk Ratings.
5. Cedar Owl. (2026). Geopolitical Forecast 2026.
6. SEC. (2023). EDGAR Database of Corporate Filings.
7. Stratfor. (2023). Geopolitical Intelligence Reports.

---

**End of Document**

For questions or feedback, contact: cogri-research@example.com