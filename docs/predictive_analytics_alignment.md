# Predictive Analytics Architecture Alignment Plan

## Overview
Align Predictive Analytics implementation with the architecture document requirements.
**CRITICAL**: Do NOT modify any calculations or methodology in the "Assess a Company or Ticker" page (COGRI.tsx).

## Architecture Requirements

### Layer 1 — Macro Layer (Country Shock Engine)
**Purpose**: Calculate which countries are affected and by how much their CSI changes
**Inputs**: Event Type, Actor Country, Target Countries, Propagation Type, Severity
**Outputs**: Country Shock Index changes ONLY (no company data, no alignment, no exposures)

#### Issues to Fix:
1. **Regional Propagation** - Currently includes random countries with uniform shocks
   - Need: Trade partner criterion (top N partners OR ≥1% bilateral trade)
   - Need: UN/World Bank region grouping
   - Need: Scaled shocks based on trade exposure, supply-chain dependence, financial linkages
   
2. **Global Propagation** - Correct country set but uniform shocks
   - Need: Scaled shocks based on trade exposure, supply-chain, financial linkages, strategic alignment

### Layer 2 — Company CO-GRI Engine
**Purpose**: Apply macro shocks to companies and recalculate CO-GRI scores
**Triggered by**: User selecting "Apply Scenario To" (entire universe, sectors, countries, specific company)

#### Issues to Fix:
1. **Baseline CO-GRI Mismatch** - Predictive Analysis baseline ≠ Assess-a-Company baseline
   - Example: Tesla shows 42.69 in Predictive vs 52.4 in Assess-a-Company
   - Root cause: Simplified formula instead of exact four-channel methodology
   - **SOLUTION**: Use exact same calculation as geographicExposureService.ts

2. **Political Alignment - Incorrect Implementation**
   - Current (WRONG): `NewCSI = BaseCSI + EventImpact + AlignmentAdjustment`
   - Correct: Alignment should NEVER modify CSI
   - Correct: Alignment only amplifies contributions in company layer
   
   **Correct Formulas**:
   ```
   Macro Layer (Layer 1):
   NewCSI_c = BaseCSI_c + EventImpact
   
   Company Layer (Layer 2):
   If alignment changes NOT enabled:
     A_c = 1 + λ × a_c,baseline
   
   If alignment changes enabled:
     A_c = 1 + λ × a_c,scenario
   
   Contribution_c = w_c × NewCSI_c × A_c
   ```

3. **Exposure Changes** - Incomplete implementation
   - Need: Adjust exposure weights (e.g., China Financial 100% → 30%)
   - Need: Use new weights in scenario contribution (only if enabled)
   - Need: Show baseline vs scenario exposure table

4. **Sector Sensitivity** - Wrong position in pipeline
   - Current: Applied inconsistently
   - Correct: Apply ONLY at the end after raw CO-GRI score
   - Correct: Should not modify macro CSI

## Implementation Steps

### Step 1: Read and Understand Current CO-GRI Calculation
- File: `/workspace/shadcn-ui/src/services/geographicExposureService.ts`
- Extract exact methodology:
  - Four-channel blended exposures (revenue, supply, assets, financial)
  - Channel coefficients by sector
  - Normalization process
  - Alignment amplifier calculation: `A_c = 1 + λ × a_c` where λ = 0.5
  - Country contribution: `Contribution_c = w_c × CSI_c × A_c`
  - Raw score: `Σ(Contribution_c)`
  - Final score: `Raw_Score × M_sector`

### Step 2: Create New Scenario Engine (scenarioEngine.ts)
Replace current simplified logic with:

#### Layer 1 Functions:
```typescript
// Regional propagation with trade-based selection
function getRegionalCountries(
  targetCountries: string[],
  actorCountry: string
): string[] {
  // Use trade data to identify regional partners
  // Apply top N trade partners criterion
  // Apply UN/World Bank region grouping
}

// Scaled shock calculation
function calculateScaledShock(
  country: string,
  baseShock: number,
  targetCountries: string[],
  actorCountry: string
): number {
  // Scale by trade exposure
  // Scale by supply-chain dependence
  // Scale by financial linkages
}
```

#### Layer 2 Functions:
```typescript
// Exact baseline calculation matching geographicExposureService
async function calculateBaselineCOGRI(
  ticker: string
): Promise<BaselineResult> {
  // Get geographic exposure data (four-channel)
  const geoData = await getCompanyGeographicExposure(ticker);
  
  // Extract channel breakdown
  const channelBreakdown = geoData.channelBreakdown;
  
  // Calculate alignment amplifiers
  const alignments = calculateAllAlignments(homeCountry, countries);
  
  // Calculate contributions with alignment
  for each country:
    A_c = 1 + 0.5 × alignment_c
    Contribution_c = w_c × CSI_c × A_c
  
  // Sum to get raw score
  rawScore = Σ(Contribution_c)
  
  // Apply sector multiplier
  finalScore = rawScore × sectorMultiplier
}

// Scenario calculation with proper alignment logic
function calculateScenarioCOGRI(
  baselineData: BaselineResult,
  scenarioImpact: ScenarioImpact,
  config: ScenarioConfig
): ScenarioResult {
  // Apply NEW CSI from Layer 1
  // Apply alignment changes (if enabled) - only affects amplifier
  // Apply exposure changes (if enabled) - adjust weights
  // Recalculate contributions
  // Apply sector sensitivity (if enabled) - at the end
}
```

### Step 3: Update PredictiveAnalytics.tsx
- Ensure UI displays Layer 1 and Layer 2 results separately
- Show baseline vs scenario comparison
- Display calculation steps matching COGRI format

### Step 4: Testing
Test cases to verify:
1. Tesla baseline in Predictive = Tesla baseline in Assess-a-Company
2. Alignment changes do NOT modify CSI values
3. Regional propagation includes correct countries with scaled shocks
4. Exposure changes properly adjust weights
5. Sector sensitivity applied at correct position

## Key Principles
1. **NO MODIFICATIONS** to COGRI.tsx or geographicExposureService.ts calculation logic
2. Predictive Analytics must **REPLICATE** the exact CO-GRI methodology
3. Layer 1 (Macro) and Layer 2 (Company) must be clearly separated
4. All outputs must show specific countries (no regions)
5. Alignment amplifies contributions, never modifies CSI