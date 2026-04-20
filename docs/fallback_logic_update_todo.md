# CO-GRI Updated Fallback Logic Implementation Plan
## Based on: Appendix v3.3 — CO-GRI EXPOSURE FALLBACK LOGIC

## Overview
Implement the corrected three-tier fallback system:
1. **Segment-Specific Fallback (SSF)** - When region membership is fully known
2. **Restricted Fallback (RF)** - When geography is partially known but ambiguous
3. **Global Fallback (GF)** - When region membership is completely unknown

## Key Changes from Current Implementation

### Current Issues
- Only implements Global vs Segment-Specific fallback (2 types)
- Missing Restricted Fallback (RF) entirely
- Incorrect handling of ambiguous regions (EMEA, International, etc.)
- Incomplete channel-specific formulations
- Missing proper normalization within restricted sets

### Required Updates

## Phase 1: Core Fallback Logic Updates

### File: `/workspace/shadcn-ui/src/services/fallbackLogic.ts`

#### 1.1 Add Restricted Fallback Types
- [ ] Add RF country set construction logic
- [ ] Implement sector-specific plausible country lists
- [ ] Add RF formula with proper normalization

#### 1.2 Update Decision Tree
- [ ] Implement Case A: Non-standard region naming (EMEA, International, etc.)
- [ ] Implement Case B: Partial country evidence + incomplete membership
- [ ] Implement Case C: Domestic + ambiguous foreign bucket
- [ ] Update `decideFallback()` to return SSF/RF/GF correctly

#### 1.3 Channel-Specific Formulations
- [ ] Revenue SSF: IndustryDemandProxy with penetration variables
- [ ] Supply SSF: HS code × AssemblyShare × ICIO flows
- [ ] Assets SSF: GDP × AssetIntensity (sector-specific multipliers)
- [ ] Financial SSF/RF: FinancialDepth with minimal sector adjustments

## Phase 2: Structured Data Integrator Updates

### File: `/workspace/shadcn-ui/src/services/structuredDataIntegrator.ts`

#### 2.1 Revenue Channel Integration
- [ ] Detect ambiguous regions → trigger RF
- [ ] Apply SSF only when region fully defined
- [ ] Add narrative expansion handling
- [ ] Implement proper normalization within regions

#### 2.2 Supply Chain Integration
- [ ] Build restricted plausible set P for RF
- [ ] Sector-specific supply base lists
- [ ] Remove domestic country from RF set
- [ ] Apply COMTRADE + OECD ICIO + Assembly Share for RF

#### 2.3 Assets Integration
- [ ] GDP-weighted priors × asset intensity for RF
- [ ] Sector-specific asset intensity multipliers:
  - Energy: 2.5-3.5x
  - Manufacturing: 1.5-2.0x
  - Tech: 0.8x
  - Financial: 0.6x
  - Retail: 1.2x

#### 2.4 Financial Integration
- [ ] Currency decomposition proxies
- [ ] CPIS/BIS banking priors for RF
- [ ] Major currency distribution patterns

## Phase 3: Geographic Exposure Service Updates

### File: `/workspace/shadcn-ui/src/services/geographicExposureService.ts`

#### 3.1 Update Channel Calculation
- [ ] Pass correct fallback type (SSF/RF/GF) to each channel
- [ ] Implement restricted set construction
- [ ] Add sector-specific plausibility checks
- [ ] Update normalization logic per fallback type

#### 3.2 Evidence Hierarchy
- [ ] Structured Evidence (highest priority)
- [ ] Narrative Evidence (adds countries, not weights)
- [ ] SSF (region known)
- [ ] RF (partial evidence)
- [ ] GF (no geography)
- [ ] True Zero (explicit exclusion)

## Phase 4: COGRI Component Updates

### File: `/workspace/shadcn-ui/src/pages/COGRI.tsx`

#### 4.1 Enhanced Calculation Steps Display
- [ ] Add fallback type indicator (SSF/RF/GF) per country
- [ ] Show restricted set P for RF cases
- [ ] Display sector-specific variables used
- [ ] Add detailed mathematical formulas per channel

#### 4.2 Channel Breakdown Enhancement
- [ ] Color-code fallback types: SSF (blue), RF (yellow), GF (red)
- [ ] Show IndustryDemandProxy values
- [ ] Display AssetIntensity multipliers
- [ ] Add FinancialDepth indicators

#### 4.3 Rationale Generation
- [ ] Generate channel-specific rationale with fallback type
- [ ] Explain why SSF/RF/GF was chosen
- [ ] Show restricted set construction for RF
- [ ] Display sector-specific variables

## Phase 5: New Helper Files

### File: `/workspace/shadcn-ui/src/services/restrictedFallback.ts` (NEW)
- [ ] Construct restricted plausible country set P
- [ ] Sector-specific plausibility lists
- [ ] RF normalization within P
- [ ] Validation rules for RF

### File: `/workspace/shadcn-ui/src/services/channelSpecificFallback.ts` (NEW)
- [ ] Revenue: Penetration variables by industry
- [ ] Supply: HS codes, Assembly shares, ICIO flows
- [ ] Assets: Asset intensity multipliers
- [ ] Financial: Currency decomposition, CPIS/BIS data

## Phase 6: Validation & Testing

### 6.1 Test Cases
- [ ] Test SSF: "Europe" segment with 24% revenue
- [ ] Test RF: "International" bucket excluding US
- [ ] Test RF: "EMEA" non-standard region
- [ ] Test GF: "Other countries" with no context
- [ ] Test mixed: Structured + narrative + fallback

### 6.2 Validation Rules
- [ ] SSF stays within region R only
- [ ] RF stays within restricted set P only
- [ ] GF covers global universe
- [ ] No double-counting of structured evidence
- [ ] Sum to 100% per channel

## Implementation Order

1. **Start with fallbackLogic.ts** - Core logic foundation
2. **Add new helper files** - RF and channel-specific logic
3. **Update structuredDataIntegrator.ts** - Apply new fallback types
4. **Update geographicExposureService.ts** - Integrate all changes
5. **Enhance COGRI.tsx** - Display improvements
6. **Test thoroughly** - Validate all three fallback types

## Key Formulas to Implement

### SSF Formula
```
Step 1: W_fallback(c) = IndustryDemandProxy(c) / Σ IndustryDemandProxy(c) for c in R
Step 2: W_normalized(c) = W_fallback(c) × W_region
```

### RF Formula
```
Step 1: W_fallback(c) = SectorPlausibility(c) / Σ SectorPlausibility(c) for c in P
Step 2: W_normalized(c) = W_fallback(c) × W_bucket
Where P = plausible countries - domestic - structured evidence - true zeros
```

### GF Formula
```
Step 1: W_fallback(c) = (GDP(c) × SectorPrior(c)) / Σ (GDP × SectorPrior)
Step 2: W_normalized(c) = W_fallback(c) × W_unknown
```

## Success Criteria

- [ ] All three fallback types (SSF/RF/GF) correctly implemented
- [ ] Channel-specific formulations working
- [ ] Proper normalization within correct scope (R, P, or Global)
- [ ] No truncation of code files
- [ ] Enhanced COGRI output with detailed rationale
- [ ] All validation rules passing
- [ ] Test cases covering all scenarios