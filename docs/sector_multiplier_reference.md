# CO-GRI Sector Multiplier Reference Guide

## Overview

The CO-GRI (Company-level Geopolitical Risk Index) model uses sector-specific multipliers to account for varying sensitivities to geopolitical shocks across different industries. This document provides a complete breakdown of how sector multipliers are calculated and applied in Step 3 of the assessment process.

---

## Mathematical Framework

### Step 3: Sector Sensitivity Multiplier

**Formula:**
```
M_sector(i) = M₀ + β_sector(i)
```

Where:
- **M_sector(i)** = Final sector multiplier for company i
- **M₀** = Base multiplier (always 1.00 for all sectors)
- **β_sector(i)** = Sector-specific sensitivity adjustment

**Alternative notation:**
```
M_sector(i) = 1.00 + β_sector(i)
```

---

## Complete Sector Multiplier Table

| Sector | Base Multiplier (M₀) | Sector Adjustment (β_sector) | Final Multiplier (M_sector) | Risk Sensitivity |
|--------|---------------------|------------------------------|----------------------------|------------------|
| **Automotive** | 1.00 | +0.15 | **1.15** | Very High |
| **Energy** | 1.00 | +0.12 | **1.12** | High |
| **Technology** | 1.00 | +0.10 | **1.10** | High |
| **Basic Materials** | 1.00 | +0.09 | **1.09** | Elevated |
| **Healthcare** | 1.00 | +0.08 | **1.08** | Elevated |
| **Industrials** | 1.00 | +0.07 | **1.07** | Moderate-High |
| **Consumer Cyclical** | 1.00 | +0.06 | **1.06** | Moderate |
| **Financial Services** | 1.00 | +0.05 | **1.05** | Moderate |
| **Consumer Defensive** | 1.00 | +0.04 | **1.04** | Low-Moderate |
| **Utilities** | 1.00 | +0.03 | **1.03** | Low |
| **Real Estate** | 1.00 | +0.02 | **1.02** | Low |
| **Communication Services** | 1.00 | +0.05 | **1.05** | Moderate |
| **General** (Default) | 1.00 | +0.00 | **1.00** | Baseline |

---

## Detailed Sector Analysis

### 1. Automotive (M_sector = 1.15)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.15 = 1.15
```

**Rationale:**
- **Highest sensitivity** to geopolitical shocks
- Complex global supply chains spanning 50+ countries
- Heavy reliance on critical materials (lithium, cobalt, rare earths)
- Vulnerable to trade disputes and tariffs
- Affected by sanctions on technology transfers
- Subject to country-specific emission regulations

**Key Risk Factors:**
- Supply chain disruptions (semiconductor shortages)
- Trade barriers and tariffs (US-China trade war)
- Technology transfer restrictions (EV battery tech)
- Regional emission standards (EU Green Deal)

**Example Companies:** Tesla (TSLA), Toyota, Volkswagen, General Motors

---

### 2. Energy (M_sector = 1.12)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.12 = 1.12
```

**Rationale:**
- Direct exposure to geopolitical conflicts (Middle East, Russia-Ukraine)
- Subject to international sanctions (OFAC, EU)
- Vulnerable to resource nationalism
- Affected by pipeline politics and transit routes
- Exposed to OPEC+ production decisions

**Key Risk Factors:**
- Sanctions on oil/gas exports (Russia, Iran, Venezuela)
- Conflict in resource-rich regions (Middle East)
- Nationalization of energy assets
- Pipeline and LNG infrastructure disputes

**Example Companies:** Exxon Mobil (XOM), Chevron, BP, Shell

---

### 3. Technology (M_sector = 1.10)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.10 = 1.10
```

**Rationale:**
- High exposure to US-China tech decoupling
- Subject to export controls on advanced chips
- Vulnerable to data sovereignty regulations
- Affected by cybersecurity threats
- Dependent on global semiconductor supply chains

**Key Risk Factors:**
- Export controls (CHIPS Act, Entity List)
- Data localization requirements (GDPR, China Cybersecurity Law)
- Technology transfer restrictions
- Intellectual property disputes

**Example Companies:** Apple (AAPL), Microsoft (MSFT), NVIDIA (NVDA), Google (GOOGL)

---

### 4. Basic Materials (M_sector = 1.09)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.09 = 1.09
```

**Rationale:**
- Exposed to resource nationalism
- Vulnerable to trade restrictions on critical minerals
- Affected by environmental regulations
- Subject to export bans and quotas

**Key Risk Factors:**
- Critical mineral export restrictions (China rare earths)
- Resource nationalism (lithium in Latin America)
- Environmental compliance costs
- Trade disputes on steel and aluminum

**Example Companies:** BHP, Rio Tinto, Freeport-McMoRan, Alcoa

---

### 5. Healthcare (M_sector = 1.08)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.08 = 1.08
```

**Rationale:**
- Subject to drug pricing regulations
- Affected by intellectual property disputes
- Vulnerable to supply chain disruptions (API sourcing)
- Exposed to pandemic-related trade restrictions

**Key Risk Factors:**
- Pharmaceutical patent disputes
- Active Pharmaceutical Ingredient (API) supply chain concentration
- Country-specific pricing controls
- Vaccine nationalism and export bans

**Example Companies:** Johnson & Johnson (JNJ), Pfizer (PFE), UnitedHealth (UNH)

---

### 6. Industrials (M_sector = 1.07)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.07 = 1.07
```

**Rationale:**
- Moderate exposure to global trade flows
- Affected by infrastructure spending policies
- Subject to tariffs on manufactured goods
- Vulnerable to supply chain disruptions

**Key Risk Factors:**
- Tariffs on industrial equipment
- Infrastructure policy changes
- Supply chain concentration risks
- Trade war impacts on machinery exports

**Example Companies:** Caterpillar (CAT), 3M (MMM), Honeywell (HON), Boeing (BA)

---

### 7. Consumer Cyclical (M_sector = 1.06)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.06 = 1.06
```

**Rationale:**
- Moderate sensitivity to trade policies
- Affected by consumer confidence in geopolitical tensions
- Subject to tariffs on consumer goods
- Vulnerable to supply chain disruptions

**Key Risk Factors:**
- Tariffs on imported consumer goods
- Supply chain delays (shipping, logistics)
- Consumer sentiment during conflicts
- Currency fluctuations affecting purchasing power

**Example Companies:** Amazon (AMZN), Nike (NKE), Starbucks (SBUX), Home Depot (HD)

---

### 8. Financial Services (M_sector = 1.05)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.05 = 1.05
```

**Rationale:**
- Exposed to sanctions compliance requirements
- Affected by cross-border payment restrictions
- Subject to capital controls
- Vulnerable to sovereign debt crises

**Key Risk Factors:**
- SWIFT exclusions and payment sanctions
- Capital controls and currency restrictions
- Sovereign debt defaults
- Regulatory fragmentation across jurisdictions

**Example Companies:** JPMorgan Chase (JPM), Bank of America (BAC), Visa (V), Mastercard (MA)

---

### 9. Consumer Defensive (M_sector = 1.04)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.04 = 1.04
```

**Rationale:**
- Lower sensitivity due to essential goods nature
- Some exposure to agricultural trade policies
- Moderate impact from food security concerns
- Limited exposure to discretionary spending cuts

**Key Risk Factors:**
- Agricultural trade restrictions
- Food security policies (export bans)
- Currency fluctuations affecting commodity prices
- Supply chain disruptions for staple goods

**Example Companies:** Procter & Gamble (PG), Coca-Cola (KO), Walmart (WMT), Costco (COST)

---

### 10. Utilities (M_sector = 1.03)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.03 = 1.03
```

**Rationale:**
- Low sensitivity due to domestic focus
- Some exposure to energy import dependencies
- Affected by climate policy changes
- Subject to regulatory stability

**Key Risk Factors:**
- Natural gas import dependencies (Europe)
- Climate policy transitions (coal phase-out)
- Regulatory changes in energy markets
- Cross-border electricity grid vulnerabilities

**Example Companies:** NextEra Energy (NEE), Duke Energy (DUK), Southern Company (SO)

---

### 11. Real Estate (M_sector = 1.02)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.02 = 1.02
```

**Rationale:**
- Lowest sensitivity due to local market focus
- Minimal direct geopolitical exposure
- Some impact from foreign investment restrictions
- Affected by interest rate changes during crises

**Key Risk Factors:**
- Foreign investment restrictions (China, Australia)
- Capital flight during geopolitical tensions
- Interest rate volatility
- Sanctions on property transactions

**Example Companies:** American Tower (AMT), Prologis (PLD), Simon Property Group (SPG)

---

### 12. Communication Services (M_sector = 1.05)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.05 = 1.05
```

**Rationale:**
- Moderate exposure to content regulation
- Subject to data sovereignty laws
- Affected by internet censorship
- Vulnerable to platform bans and restrictions

**Key Risk Factors:**
- Content moderation regulations
- Data localization requirements
- Platform bans (TikTok, Facebook in certain countries)
- Telecommunications infrastructure restrictions

**Example Companies:** Meta (META), Netflix (NFLX), Comcast (CMCSA), AT&T (T)

---

### 13. General (Default) (M_sector = 1.00)
**Calculation:**
```
M_sector = M₀ + β_sector
M_sector = 1.00 + 0.00 = 1.00
```

**Rationale:**
- Baseline multiplier for unclassified or diversified companies
- No sector-specific adjustment
- Represents average geopolitical sensitivity

**Use Cases:**
- Companies with highly diversified operations across multiple sectors
- Newly listed companies without clear sector classification
- Holding companies with mixed sector exposure

---

## Application in Step 3

### Integration with Raw Score Calculation

The sector multiplier is applied in **Step 4** of the CO-GRI calculation:

```
Raw_Score_i = Σ(W_i,c × S_c × M_sector(i))
```

Where:
- **W_i,c** = Exposure weight of company i in country c (from Step 2)
- **S_c** = Country Shock Index for country c (from Step 1)
- **M_sector(i)** = Sector multiplier for company i (from Step 3)

### Example Calculation

**Company:** Tesla Inc. (TSLA)
**Sector:** Automotive
**Countries:** United States, China, Europe, Rest of World

**Step 3: Determine Sector Multiplier**
```
Sector: Automotive
M₀ = 1.00
β_sector = 0.15
M_sector = 1.00 + 0.15 = 1.15
```

**Step 4: Calculate Raw Score**
```
Country         | W_i,c  | S_c   | M_sector | Contribution
----------------|--------|-------|----------|-------------
United States   | 0.46   | 35.2  | 1.15     | 18.6
China           | 0.22   | 58.7  | 1.15     | 14.9
Europe          | 0.24   | 28.4  | 1.15     | 7.8
Rest of World   | 0.08   | 42.1  | 1.15     | 3.9

Raw_Score = 18.6 + 14.9 + 7.8 + 3.9 = 45.2
```

The sector multiplier of **1.15** amplifies Tesla's geopolitical risk by 15% compared to a baseline company, reflecting the automotive sector's high sensitivity to supply chain disruptions, trade policies, and technology transfer restrictions.

---

## Calibration Methodology

### Historical Event Analysis

Sector multipliers are calibrated using historical geopolitical event analysis:

1. **Event Selection:** Major geopolitical shocks from 2010-2024
   - US-China trade war (2018-2020)
   - Russia-Ukraine conflict (2022-present)
   - COVID-19 pandemic supply chain disruptions (2020-2022)
   - Brexit (2016-2020)
   - Middle East conflicts (2010-2024)

2. **Impact Measurement:** Stock price volatility and earnings impact
   - Measure abnormal returns during event windows
   - Calculate sector-specific beta coefficients
   - Analyze earnings call mentions of geopolitical risks

3. **Regression Analysis:** Sector sensitivity to geopolitical risk indices
   - Dependent variable: Stock returns or earnings changes
   - Independent variables: Geopolitical risk indices (GPR, GPRD)
   - Control variables: Market returns, sector fundamentals

4. **Multiplier Derivation:** Convert regression coefficients to multipliers
   - Normalize coefficients to range [1.00, 1.20]
   - Round to nearest 0.01 for practical application
   - Validate against expert judgment and industry reports

### Validation

Sector multipliers are validated through:
- **Backtesting:** Historical CO-GRI scores vs. actual risk events
- **Expert Review:** Consultation with geopolitical risk analysts
- **Peer Comparison:** Cross-reference with other risk models (BlackRock, S&P)
- **Periodic Updates:** Annual recalibration based on new data

---

## Sector Multiplier Sensitivity Analysis

### Impact on Final CO-GRI Score

The sector multiplier directly affects the raw score, which is then normalized to produce the final CO-GRI score. Here's how different multipliers impact the assessment:

**Example: Company with identical geographic exposure**

| Sector | M_sector | Raw Score | Z-Score | CO-GRI Score | Risk Level |
|--------|----------|-----------|---------|--------------|------------|
| Real Estate | 1.02 | 41.3 | -0.09 | 48.5 | Moderate Risk |
| Financial Services | 1.05 | 42.5 | 0.00 | 50.0 | Elevated Risk |
| Technology | 1.10 | 44.5 | +0.16 | 52.7 | Elevated Risk |
| Automotive | 1.15 | 46.5 | +0.31 | 55.2 | Elevated Risk |

**Key Insight:** A 15% difference in sector multiplier (1.00 vs. 1.15) can shift the CO-GRI score by approximately 5-7 points, potentially changing the risk classification.

---

## Frequently Asked Questions

### Q1: Why is the base multiplier (M₀) always 1.00?

**A:** The base multiplier represents a "neutral" sector with average geopolitical sensitivity. Setting M₀ = 1.00 ensures that:
- Sector adjustments are additive and transparent
- The baseline case (General sector) has no amplification
- Positive β_sector values indicate higher-than-average sensitivity

### Q2: How often are sector multipliers updated?

**A:** Sector multipliers are recalibrated annually based on:
- New geopolitical events and their sector-specific impacts
- Updated regression analysis with expanded historical data
- Changes in global supply chain structures
- Emerging risk factors (e.g., climate transition, AI regulation)

### Q3: Can a company have multiple sector multipliers?

**A:** No. Each company is assigned to a single primary sector based on its main business activity. For highly diversified conglomerates, the "General" sector (M_sector = 1.00) may be used, or a weighted average of sector multipliers can be calculated based on revenue breakdown.

### Q4: Why is Automotive the highest multiplier?

**A:** The automotive sector has demonstrated the highest sensitivity to geopolitical shocks due to:
- Longest and most complex global supply chains (50+ countries)
- Critical dependence on semiconductors and rare earth materials
- High exposure to trade disputes (US-China, US-EU tariffs)
- Technology transfer restrictions (EV batteries, autonomous driving)
- Regulatory fragmentation (emission standards, safety requirements)

Historical data shows automotive stocks experience 15-20% higher volatility during geopolitical events compared to the market average.

### Q5: How does the sector multiplier interact with country-specific risks?

**A:** The sector multiplier is applied uniformly across all countries in Step 4:

```
Contribution_c = W_i,c × S_c × M_sector
```

This means:
- A high-risk country (high S_c) in a high-risk sector (high M_sector) has compounded risk
- The multiplier amplifies both high and low country risks proportionally
- Geographic diversification benefits are preserved but scaled by sector sensitivity

---

## Implementation in Code

### Current Implementation (COGRI.tsx)

```typescript
const createGenericAssessment = async (
  ticker: string,
  companyName: string,
  sector: string,
  exchangeInfo: string,
  dataSources: DataSource[],
  dataSource: string,
  homeCountry: string
): Promise<AssessmentResult> => {
  // Step 3: Determine sector multiplier
  let sectorMultiplier = 1.00; // M₀ (base multiplier)
  
  // Apply sector-specific adjustments (β_sector)
  if (sector === 'Technology') sectorMultiplier = 1.10;
  else if (sector === 'Automotive') sectorMultiplier = 1.15;
  else if (sector === 'Energy') sectorMultiplier = 1.12;
  else if (sector === 'Financial Services') sectorMultiplier = 1.05;
  else if (sector === 'Healthcare') sectorMultiplier = 1.08;
  else if (sector === 'Industrials') sectorMultiplier = 1.07;
  else if (sector === 'Consumer Cyclical') sectorMultiplier = 1.06;
  else if (sector === 'Basic Materials') sectorMultiplier = 1.09;
  // Additional sectors can be added here
  
  // M_sector = M₀ + β_sector
  // Example: Technology -> M_sector = 1.00 + 0.10 = 1.10
  
  // ... rest of calculation
};
```

### Recommended Enhancement

For better maintainability, consider creating a dedicated sector configuration:

```typescript
const SECTOR_MULTIPLIERS: Record<string, { base: number; adjustment: number; final: number }> = {
  'Automotive': { base: 1.00, adjustment: 0.15, final: 1.15 },
  'Energy': { base: 1.00, adjustment: 0.12, final: 1.12 },
  'Technology': { base: 1.00, adjustment: 0.10, final: 1.10 },
  'Basic Materials': { base: 1.00, adjustment: 0.09, final: 1.09 },
  'Healthcare': { base: 1.00, adjustment: 0.08, final: 1.08 },
  'Industrials': { base: 1.00, adjustment: 0.07, final: 1.07 },
  'Consumer Cyclical': { base: 1.00, adjustment: 0.06, final: 1.06 },
  'Financial Services': { base: 1.00, adjustment: 0.05, final: 1.05 },
  'Consumer Defensive': { base: 1.00, adjustment: 0.04, final: 1.04 },
  'Utilities': { base: 1.00, adjustment: 0.03, final: 1.03 },
  'Real Estate': { base: 1.00, adjustment: 0.02, final: 1.02 },
  'Communication Services': { base: 1.00, adjustment: 0.05, final: 1.05 },
  'General': { base: 1.00, adjustment: 0.00, final: 1.00 }
};

function getSectorMultiplier(sector: string): number {
  const config = SECTOR_MULTIPLIERS[sector] || SECTOR_MULTIPLIERS['General'];
  return config.final;
}
```

---

## Summary

### Key Takeaways

1. **Base Multiplier (M₀):** Always 1.00 for all sectors (neutral baseline)

2. **Sector Adjustment (β_sector):** Ranges from 0.00 (General) to 0.15 (Automotive)

3. **Final Multiplier (M_sector):** M₀ + β_sector, ranges from 1.00 to 1.15

4. **Application:** Multiplied with exposure weight and CSI in Step 4 to calculate raw score

5. **Calibration:** Based on historical geopolitical event analysis and sector-specific volatility

6. **Impact:** Can shift CO-GRI scores by 5-7 points, affecting risk classification

### Sector Ranking by Sensitivity

1. **Automotive** (1.15) - Highest Risk
2. **Energy** (1.12)
3. **Technology** (1.10)
4. **Basic Materials** (1.09)
5. **Healthcare** (1.08)
6. **Industrials** (1.07)
7. **Consumer Cyclical** (1.06)
8. **Financial Services** (1.05)
9. **Communication Services** (1.05)
10. **Consumer Defensive** (1.04)
11. **Utilities** (1.03)
12. **Real Estate** (1.02) - Lowest Risk
13. **General** (1.00) - Baseline

---

## References

- BlackRock Geopolitical Risk Dashboard (2024)
- Caldara, D., & Iacoviello, M. (2022). "Measuring Geopolitical Risk." American Economic Review.
- S&P Global Market Intelligence - Sector Risk Analysis (2024)
- World Economic Forum - Global Risks Report (2024)
- McKinsey Global Institute - Supply Chain Risk Analysis (2023)

---

**Document Version:** 1.0  
**Last Updated:** November 15, 2024  
**Author:** CO-GRI Development Team  
**Contact:** For questions or updates, please refer to the CO-GRI platform documentation.