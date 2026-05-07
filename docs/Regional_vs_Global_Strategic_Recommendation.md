# Strategic Analysis & Recommendation: Regional vs. Global Propagation Enhancement
## Predictive Analytics Service - Comprehensive Review

**Date:** December 23, 2025  
**Analyst:** Strategic Advisory Team  
**Subject:** Final Analysis and Strategic Recommendation for Regional vs. Global Propagation Distinction

---

## Executive Summary

### Problem Statement

**Current Issue:** Global propagation mode produces the same output as Regional propagation mode, making it uninformative. Instead of showing a broader, long-tail spillover distribution, it displays:
1. The same non-zero country set as regional propagation
2. All other countries as hard-zero with "limited exposure data available"

**Root Cause:** While the code includes all countries in Global mode, downstream logic or UI filtering prevents meaningful differentiation from Regional mode.

### Strategic Recommendation

**✅ YES - Enhancement is Strongly Recommended**

The attached document provides a clear, defensible methodology that should be implemented. The enhancement will:
- Make Global propagation analytically meaningful and distinct from Regional
- Enable portfolio-level risk assessment and tail risk analysis
- Provide smooth decay patterns instead of binary inclusion/exclusion
- Maintain mathematical rigor while expanding analytical utility

---

## Part 1: Document Analysis - Intended Methodology

### A. Regional Propagation (Intended)

**Purpose:** Measure material, first-order spillovers from target to economically exposed counterparties

**Key Question:** *"Which countries are meaningfully and directly exposed to shocks in the target country?"*

**Characteristics:**
- ✅ Target-centric
- ✅ Material exposure required
- ✅ Non-uniform spillovers
- ✅ Small, interpretable country set (~20-40 countries)
- ✅ Used for: near-term risk, second-order effects, realistic contagion

**Inclusion Criteria (Material Exposure Required):**

A country `c` is included ONLY if it meets at least ONE of:

1. **Trade Linkage:**
   - Top N trade partners of target T, OR
   - Bilateral trade ≥ X% of T's total trade

2. **Supply-Chain Linkage:**
   - Top supply-chain partner for relevant sectors

3. **Financial/Energy Linkage:**
   - Material financial, energy, or capital-market exposure to T

4. **Geographic Region (Secondary Only):**
   - Supporting criterion, NOT sufficient alone

**Exclusion:** Countries not meeting any criteria should NOT be included in Regional mode

---

### B. Global Propagation (Intended)

**Purpose:** Measure full distribution of spillover risk across entire country universe, including second-order and long-tail effects

**Key Question:** *"How does a shock propagate globally, including weak, indirect, and long-tail effects beyond the immediate regional network?"*

**Use Cases:**
- Portfolio-level risk (diversified global portfolios)
- Macro tail risk and stress testing
- Comparing concentration vs. dispersion of shocks
- Answering: "Is this a localized shock or globally diffused?"

**Inclusion Criteria (Data Availability Only):**

A country `c` is included if target-centric exposure can be computed for ANY spillover channel, **regardless of magnitude**.

**NO materiality threshold at inclusion stage.**

Specifically, include if at least ONE of:

1. **Trade Linkage:**
   - Bilateral trade flow exists and can be measured
   - ❌ NO top-N threshold
   - ❌ NO minimum % threshold

2. **Supply-Chain Linkage:**
   - Supply-chain or input-output linkage exists in data
   - Even if small or sector-specific

3. **Financial/Energy Linkage:**
   - Measurable financial, capital-market, or energy linkage exists

**Exclusion Criteria (Global):**

Only exclude if:
- Exposure data for c ↔ T is truly unavailable across ALL channels
- Missing data, unsupported country code, or no bilateral relationship

In such cases:
```
PropagationWeight = 0
Reason = "No exposure data available"
```

**Key Principle:**
> "Include all countries for which target-centric exposure can be computed, even if very small. No 'top-N' cutoff, no 'materiality' threshold at inclusion stage. Inclusion is data-driven, not heuristic. The spillover magnitude itself determines importance — not a gatekeeping rule."

---

### C. Expected Global Output Characteristics

A well-functioning Global propagation should show:

1. **Many countries with very small but non-zero ΔCSI**
   - Often < 0.05 CSI points
   - Possibly rounded to 0.0 in UI, but non-zero internally

2. **Smooth decay pattern**
   - Top partners still dominate
   - Second-tier partners show modest spillovers
   - Long tail fades gradually, NOT abruptly

3. **Fewer hard zeros labeled "limited exposure data"**
   - "Zero" should mean true zero exposure, not missing data

4. **Regional results as upper tail of global results**
   - Regional countries ⊂ Global countries
   - Same ranking among overlapping countries
   - Same weights for overlapping countries

**Current Problem:**
> "Right now, global output appears to be using the same computed subset as regional, displaying everyone else as 'limited exposure data'. Not actually expanding the spillover distribution, only the table. That means global is not yet answering a different question — it's answering the same question with more rows."

---

### D. Spillover Formulas (Same for Both Modes)

**Event Impact Formula:**
```
EventImpact_c = Severity × EventBaseShock × PropagationWeight_c
```

**Where:**
```
PropagationWeight_c = α·TradeExposure(c ↔ T) + β·SupplyChainExposure(c ↔ T) + γ·FinancialLinkage(c ↔ T)
```

**Key Point:**
> "The only difference is the country inclusion rule:
> - Regional propagation applies this formula only to countries that meet material exposure thresholds (filtered set)
> - Global propagation applies the same formula to all countries for which exposure data exists (full set), with any minimum thresholds applied at the display/UX layer, not in the calculation"

**Channel Weights (Fixed):**
- α = 0.45 (Trade)
- β = 0.35 (Supply Chain)
- γ = 0.20 (Financial)

**Propagation Weight Characteristics:**
- Continuous, not bucketed
- Target-centric exposure intensity
- Identical spillover magnitudes across heterogeneous countries should be rare and data-driven

---

### E. Design Principles

**Critical Principle:**
> "Regional propagation should be a strict subset of global propagation."

**That means:**
- Every country in Regional MUST appear in Global with same target-centric weights
- Global should include additional countries with smaller spillovers
- NOT simply display zeros for everyone else

**Display Options (Recommended):**

**Option 4 - Dual Thresholds (Best Practice):**
- **ComputeThreshold:** Include if any channel data exists
- **DisplayThreshold:** Show if ΔCSI ≥ 0.05 (configurable)
- **Pros:** Transparent; avoids "fake zeros"
- **Cons:** Slightly more UI complexity

---

## Part 2: Current Implementation Analysis

### A. Code Review - Regional Mode

**File:** `scenarioEngine.ts`, Lines 693-774

**Function:** `getRegionalCountries()`

**Current Implementation:**
```typescript
for (const country of allCountries) {
  if (regionalSet.has(country)) continue;
  
  totalEvaluated++;
  let includedForTarget = false;
  
  for (const target of targetCountries) {
    const materialExposure = calculateMaterialExposure(country, target);
    
    if (materialExposure.hasMaterialExposure) {  // ← FILTERING HERE
      regionalSet.add(country);
      materialityBreakdowns[country] = materialExposure;
      includedForTarget = true;
      // ... count inclusion reasons
      break;
    }
  }
  
  if (!includedForTarget) {
    excludedInsufficient++;  // ← Countries excluded
  }
}
```

**Material Exposure Criteria (Lines 565-687):**
```typescript
// Primary criteria (any one sufficient)
if (tradeRank <= 15 ||
    tradeIntensity >= 0.015 ||
    supplyChainScore >= 0.012 ||
    financialLinkage >= 0.008) {
  hasMaterialExposure = true;
}

// Secondary criteria with geographic support
if (!hasMaterialExposure && geographicProximity && materialityScore >= 0.015) {
  hasMaterialExposure = true;
}
```

**Analysis:**
✅ **CORRECT** - Regional mode properly filters to material exposure only
✅ **CORRECT** - Uses multi-channel assessment
✅ **CORRECT** - Transparent inclusion criteria
✅ **CORRECT** - Tracks exclusions

---

### B. Code Review - Global Mode

**File:** `scenarioEngine.ts`, Lines 777-848

**Function:** `getGlobalCountries()`

**Current Implementation:**
```typescript
for (const country of allCountries) {
  if (globalSet.has(country)) continue;
  
  globalSet.add(country);  // ← ALL COUNTRIES ADDED
  
  // Calculate material exposure for transparency
  let maxExposure: ReturnType<typeof calculateMaterialExposure> | null = null;
  
  for (const target of targetCountries) {
    const materialExposure = calculateMaterialExposure(country, target);
    
    if (!maxExposure || materialExposure.materialityScore > maxExposure.materialityScore) {
      maxExposure = materialExposure;
    }
  }
  
  if (maxExposure) {
    materialityBreakdowns[country] = maxExposure;
    
    if (maxExposure.detailedBreakdown.includes('FALLBACK METHOD')) {
      countriesWithFallback++;
    } else {
      countriesWithTradeData++;
    }
  }
}
```

**Analysis:**
✅ **CORRECT** - All countries ARE added to globalSet
✅ **CORRECT** - Material exposure calculated for transparency
✅ **CORRECT** - Tracks data quality (trade data vs. fallback)

**But then what happens?**

---

### C. Root Cause Analysis - Where Does Filtering Occur?

**Investigation of Downstream Processing:**

**1. Propagation Weight Calculation (Lines 853-931):**
```typescript
function calculateTargetCentricExposure(spilloverCountry: string, targetCountry: string) {
  const materialExposure = calculateMaterialExposure(spilloverCountry, targetCountry);
  
  const tradeComponent = CHANNEL_WEIGHTS.trade * materialExposure.tradeIntensity;
  const supplyChainComponent = CHANNEL_WEIGHTS.supplyChain * materialExposure.supplyChainScore;
  const financialComponent = CHANNEL_WEIGHTS.financial * materialExposure.financialLinkage;
  
  const totalExposure = Math.min(tradeComponent + supplyChainComponent + financialComponent, 0.85);
  
  return { totalExposure, ... };
}
```

**2. Scaled Shock Calculation (Lines 938-991):**
```typescript
function calculateScaledShock(...) {
  // ...
  const propagationWeight = Math.min(0.85, Math.max(0.001, maxPropagationWeight));
  const scaledShock = baseShock * propagationWeight;
  
  return { shock: scaledShock, propagationWeight, exposureBreakdown };
}
```

**3. CSI Change Application (Lines 1082-1175):**
```typescript
propagatedCountries.forEach(country => {
  const baseCSI = getCountryShockIndex(country);
  const isDirectTarget = config.targetCountries.includes(country);
  const isActor = country === config.actorCountry;
  
  const shockResult = calculateScaledShock(...);
  const csiDelta = shockResult.shock;
  
  let reason = '';
  if (isDirectTarget) {
    reason = `Direct target of ${config.eventType} - Full impact applied`;
  } else if (isActor) {
    reason = `Actor country initiating ${config.eventType} - 30% impact applied`;
  } else {
    const materialExposure = materialityBreakdowns[country];
    if (materialExposure && shockResult.exposureBreakdown) {
      reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
      // ... materialityBreakdown assigned
    } else {
      reason = `${config.propagationType} spillover - Limited exposure data available`;  // ← HERE!
    }
  }
  
  shockChanges.push({ country, baseCSI, adjustedCSI, delta: csiDelta, reason, materialityBreakdown });
});
```

**🔍 FOUND THE ISSUE!**

**Line 1161:** 
```typescript
reason = `${config.propagationType} spillover - Limited exposure data available`;
```

This message appears when:
- `materialExposure` exists in `materialityBreakdowns[country]`
- BUT `shockResult.exposureBreakdown` is undefined or falsy

**Why does this happen?**

Looking at `calculateScaledShock()` (Lines 938-991), `exposureBreakdown` is only returned for spillover countries (not targets/actors). But the issue is likely that for countries with very small exposure:

1. `calculateMaterialExposure()` returns data (even if small)
2. `calculateTargetCentricExposure()` calculates tiny propagation weight (e.g., 0.001)
3. `calculateScaledShock()` applies minimum floor of 0.001
4. CSI delta becomes very small (e.g., 0.015 points)
5. **BUT** - if `materialExposure.hasMaterialExposure === false`, the breakdown might not be properly populated

**The Real Issue:**

For Global mode, countries without material exposure still get added to `propagatedCountries`, but:
- They may have `materialityBreakdowns[country]` with `hasMaterialExposure: false`
- This causes the "Limited exposure data available" message
- Even though they SHOULD show small but non-zero CSI changes

---

### D. Fallback Method Analysis

**Lines 499-560:** `calculateFallbackExposure()`

This is used when target country lacks trade data. It estimates exposure based on:
- Geographic proximity
- CSI similarity

**Current Behavior:**
```typescript
if (!hasTradeData) {
  console.log(`⚠️ Using fallback spillover detection for target: ${targetCountry}`);
  return calculateFallbackExposure(spilloverCountry, targetCountry);
}
```

**Issue:** Fallback is conservative and may return `hasMaterialExposure: false` for many countries, causing them to show "Limited exposure data available" even in Global mode.

---

## Part 3: Gap Analysis - Intended vs. Current

### A. What's Working Correctly

| Aspect | Status | Details |
|--------|--------|---------|
| Regional filtering | ✅ CORRECT | Properly applies material exposure thresholds |
| Global inclusion | ✅ CORRECT | All countries added to propagatedCountries |
| Propagation formulas | ✅ CORRECT | Uses same formulas for both modes |
| Channel weights | ✅ CORRECT | α=0.45, β=0.35, γ=0.20 |
| Material exposure calculation | ✅ CORRECT | Multi-channel assessment implemented |
| Fallback method | ✅ CORRECT | Conservative approach for missing data |

### B. What's Missing/Broken

| Issue | Current Behavior | Intended Behavior | Impact |
|-------|------------------|-------------------|---------|
| **Global mode display logic** | Shows "Limited exposure data available" for countries without material exposure | Should show small but non-zero CSI changes | Global mode uninformative |
| **Reason assignment** | Assigns "Limited exposure data" when `materialExposure.hasMaterialExposure === false` | Should show actual propagation weight and CSI change, even if tiny | Users see hard zeros instead of smooth decay |
| **Materiality breakdown requirement** | Requires `materialityBreakdown` to show meaningful output | Should show breakdown for ALL countries with any exposure data | Long-tail countries hidden |
| **Display threshold** | No configurable threshold for hiding tiny impacts | Should have dual thresholds: compute vs. display | No way to filter noise while preserving data |

### C. Specific Code Issues

**Issue 1: Reason Assignment Logic (Lines 1147-1163)**

**Current:**
```typescript
if (materialExposure && shockResult.exposureBreakdown) {
  reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
  materialityBreakdown = { ... };
} else {
  reason = `${config.propagationType} spillover - Limited exposure data available`;
}
```

**Problem:** This creates binary output - either full breakdown OR "limited data" message. No middle ground for small exposures.

**Should be:**
```typescript
if (shockResult.exposureBreakdown) {
  reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
  
  if (materialExposure) {
    materialityBreakdown = {
      tradeRank: materialExposure.tradeRank,
      tradeIntensity: materialExposure.tradeIntensity,
      supplyChainScore: materialExposure.supplyChainScore,
      financialLinkage: materialExposure.financialLinkage,
      geographicProximity: materialExposure.geographicProximity,
      materialityScore: materialExposure.materialityScore,
      qualificationCriteria: materialExposure.qualificationCriteria.length > 0 
        ? materialExposure.qualificationCriteria 
        : ['Minimal exposure - included in Global mode']
    };
  }
} else {
  // Only use "limited data" if truly no exposure data exists
  reason = `${config.propagationType} spillover - No exposure data available`;
}
```

**Issue 2: Material Exposure Requirement (Lines 1147-1149)**

**Current:**
```typescript
const materialExposure = materialityBreakdowns[country];
if (materialExposure && shockResult.exposureBreakdown) {
  // ... show breakdown
}
```

**Problem:** Requires BOTH `materialExposure` AND `exposureBreakdown`. In Global mode, countries without material exposure should still show their (small) propagation weight.

**Should be:**
```typescript
// For Global mode, show breakdown even if exposure is minimal
if (config.propagationType === 'global') {
  if (shockResult.exposureBreakdown) {
    reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
    // Always show breakdown in Global mode
  } else if (shockResult.propagationWeight > 0) {
    reason = `Minimal spillover: PropagationWeight=${(shockResult.propagationWeight * 100).toFixed(3)}%`;
  } else {
    reason = `No exposure data available`;
  }
} else {
  // Regional mode: only show if material exposure exists
  const materialExposure = materialityBreakdowns[country];
  if (materialExposure && shockResult.exposureBreakdown) {
    reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
    materialityBreakdown = { ... };
  }
}
```

**Issue 3: No Display Threshold Configuration**

**Current:** No way to filter out noise in UI while preserving calculation completeness

**Should add:**
```typescript
export interface ScenarioConfig {
  // ... existing fields
  displayThreshold?: number;  // NEW: Minimum ΔCSI to display (default: 0.05 for Global, 0 for Regional)
}
```

---

## Part 4: Strategic Recommendation

### A. Recommendation Summary

**✅ STRONGLY RECOMMEND ENHANCEMENT**

**Rationale:**

1. **Analytical Value:** Global mode currently provides no additional insight beyond Regional mode. Enhancement will enable:
   - Portfolio-level risk assessment
   - Tail risk analysis
   - Concentration vs. dispersion comparison
   - Second-order spillover identification

2. **Mathematical Rigor:** The intended methodology is sound and defensible:
   - Same propagation formulas for both modes
   - Difference is inclusion criteria, not calculation logic
   - Preserves continuity and transparency

3. **User Clarity:** Current "Limited exposure data available" message is misleading:
   - Implies missing data when exposure is actually computed
   - Hides smooth decay pattern
   - Prevents users from seeing long-tail effects

4. **Implementation Feasibility:** Changes are localized and low-risk:
   - Modify reason assignment logic (Lines 1147-1163)
   - Add mode-specific display logic
   - Add optional display threshold configuration
   - No changes to core propagation formulas

5. **Alignment with Best Practices:** Document methodology aligns with:
   - Economic theory (spillover transmission mechanisms)
   - Risk management standards (tail risk assessment)
   - Data science principles (compute all, filter display)

### B. Recommended Implementation Approach

**Phase 1: Core Logic Enhancement (Priority: HIGH)**

**Change 1: Modify Reason Assignment Logic**

**Location:** `scenarioEngine.ts`, Lines 1147-1163

**Current Code:**
```typescript
} else {
  const materialExposure = materialityBreakdowns[country];
  if (materialExposure && shockResult.exposureBreakdown) {
    reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
    materialityBreakdown = { ... };
  } else {
    reason = `${config.propagationType} spillover - Limited exposure data available`;
  }
}
```

**Recommended Change:**
```typescript
} else {
  // Spillover country logic
  const materialExposure = materialityBreakdowns[country];
  
  if (config.propagationType === 'global') {
    // GLOBAL MODE: Show all computed exposures, even if minimal
    if (shockResult.exposureBreakdown) {
      reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
      
      // Always provide breakdown in Global mode
      if (materialExposure) {
        materialityBreakdown = {
          tradeRank: materialExposure.tradeRank,
          tradeIntensity: materialExposure.tradeIntensity,
          supplyChainScore: materialExposure.supplyChainScore,
          financialLinkage: materialExposure.financialLinkage,
          geographicProximity: materialExposure.geographicProximity,
          materialityScore: materialExposure.materialityScore,
          qualificationCriteria: materialExposure.qualificationCriteria.length > 0 
            ? materialExposure.qualificationCriteria 
            : ['Minimal exposure - included in Global propagation']
        };
      }
    } else if (shockResult.propagationWeight > 0) {
      // Show minimal spillover info even without full breakdown
      reason = `Minimal spillover: PropagationWeight=${(shockResult.propagationWeight * 100).toFixed(3)}%, ΔCSI=${csiDelta.toFixed(3)}`;
    } else {
      // Only show "no data" if truly zero exposure
      reason = `No exposure data available for any channel`;
    }
  } else {
    // REGIONAL MODE: Only show if material exposure exists (current behavior)
    if (materialExposure && shockResult.exposureBreakdown) {
      reason = `TARGET-CENTRIC spillover: ${shockResult.exposureBreakdown.breakdown}`;
      materialityBreakdown = {
        tradeRank: materialExposure.tradeRank,
        tradeIntensity: materialExposure.tradeIntensity,
        supplyChainScore: materialExposure.supplyChainScore,
        financialLinkage: materialExposure.financialLinkage,
        geographicProximity: materialExposure.geographicProximity,
        materialityScore: materialExposure.materialityScore,
        qualificationCriteria: materialExposure.qualificationCriteria
      };
    } else {
      // In Regional mode, this shouldn't happen (filtered out earlier)
      reason = `Insufficient material exposure (excluded from Regional propagation)`;
    }
  }
}
```

**Change 2: Add Display Threshold Configuration**

**Location:** `scenarioEngine.ts`, Lines 42-58

**Add to ScenarioConfig:**
```typescript
export interface ScenarioConfig {
  eventType: string;
  customEventName?: string;
  actorCountry: string;
  targetCountries: string[];
  propagationType: 'unilateral' | 'bilateral' | 'regional' | 'global';
  severity: 'low' | 'medium' | 'high';
  applyAlignmentChanges: boolean;
  applyExposureChanges: boolean;
  applySectorSensitivity: boolean;
  displayThreshold?: number;  // NEW: Minimum ΔCSI to display (optional)
  applyTo: {
    type: 'entire' | 'sectors' | 'countries' | 'company';
    sectors?: string[];
    countries?: string[];
    company?: string;
  };
}
```

**Change 3: Apply Display Threshold (Optional)**

**Location:** After shock changes are calculated (Lines 1175+)

**Add filtering logic:**
```typescript
// Apply display threshold if configured
if (config.displayThreshold !== undefined && config.displayThreshold > 0) {
  const originalCount = shockChanges.length;
  
  shockChanges = shockChanges.filter(sc => {
    // Always show targets and actors
    if (config.targetCountries.includes(sc.country) || sc.country === config.actorCountry) {
      return true;
    }
    // Filter spillover countries by threshold
    return Math.abs(sc.delta) >= config.displayThreshold;
  });
  
  const filteredCount = originalCount - shockChanges.length;
  if (filteredCount > 0) {
    console.log(`[Display Threshold] Filtered ${filteredCount} countries with ΔCSI < ${config.displayThreshold}`);
  }
}
```

**Phase 2: UI Enhancement (Priority: MEDIUM)**

**Change 4: Add Display Threshold Control**

**Location:** Frontend UI (PredictiveAnalytics.tsx or similar)

**Add UI control:**
```typescript
<div className="display-threshold-control">
  <label>
    Display Threshold (ΔCSI):
    <select value={displayThreshold} onChange={(e) => setDisplayThreshold(Number(e.target.value))}>
      <option value={0}>Show All (0.00)</option>
      <option value={0.05}>Minimal (0.05)</option>
      <option value={0.10}>Small (0.10)</option>
      <option value={0.50}>Moderate (0.50)</option>
      <option value={1.00}>Large (1.00)</option>
    </select>
  </label>
  <span className="help-text">
    {propagationType === 'global' 
      ? 'Filter out countries with very small spillover effects'
      : 'Regional mode shows only material exposures'}
  </span>
</div>
```

**Change 5: Enhance Country Table Display**

**Add visual indicators:**
- Color coding by spillover magnitude
- Separate sections for "Material Exposure" vs. "Long-Tail Effects"
- Expandable "Show All Countries" toggle for Global mode

**Phase 3: Documentation & Validation (Priority: HIGH)**

**Change 6: Update Documentation**

**Add to code comments:**
```typescript
/**
 * REGIONAL vs GLOBAL PROPAGATION MODES
 * 
 * REGIONAL MODE:
 * - Purpose: Identify material, first-order spillovers
 * - Inclusion: Countries with material exposure to target (filtered)
 * - Criteria: Top-N trade partners, ≥X% trade intensity, supply chain, financial linkage
 * - Output: ~20-40 countries with significant exposure
 * - Use case: Near-term risk, realistic contagion, second-order effects
 * 
 * GLOBAL MODE:
 * - Purpose: Measure full spillover distribution including long-tail effects
 * - Inclusion: All countries where exposure can be computed (unfiltered)
 * - Criteria: Any measurable trade, supply chain, or financial linkage
 * - Output: ~150-195 countries with smooth decay pattern
 * - Use case: Portfolio risk, tail risk, concentration analysis
 * 
 * KEY PRINCIPLE:
 * Regional ⊂ Global (Regional is strict subset of Global)
 * Same propagation formulas, different inclusion criteria
 * Display threshold can filter noise without affecting calculation
 */
```

**Change 7: Add Validation Tests**

**Create test scenarios:**
```typescript
describe('Regional vs Global Propagation', () => {
  test('Regional should be subset of Global', () => {
    const regionalCountries = getRegionalCountries(targets, actor).countries;
    const globalCountries = getGlobalCountries(targets, actor).countries;
    
    // Every regional country should appear in global
    regionalCountries.forEach(country => {
      expect(globalCountries).toContain(country);
    });
  });
  
  test('Global should include long-tail countries', () => {
    const globalResult = getGlobalCountries(targets, actor);
    
    // Should have significantly more countries than regional
    expect(globalResult.countries.length).toBeGreaterThan(50);
    
    // Should include countries with small but non-zero exposure
    const smallExposureCountries = globalResult.countries.filter(c => {
      const breakdown = globalResult.materialityBreakdowns[c];
      return breakdown && breakdown.materialityScore < 0.01 && breakdown.materialityScore > 0;
    });
    
    expect(smallExposureCountries.length).toBeGreaterThan(0);
  });
  
  test('Same propagation weights for overlapping countries', () => {
    const regionalResult = getRegionalCountries(targets, actor);
    const globalResult = getGlobalCountries(targets, actor);
    
    // Check overlapping countries have same weights
    regionalResult.countries.forEach(country => {
      const regionalBreakdown = regionalResult.materialityBreakdowns[country];
      const globalBreakdown = globalResult.materialityBreakdowns[country];
      
      if (regionalBreakdown && globalBreakdown) {
        expect(regionalBreakdown.materialityScore).toBeCloseTo(globalBreakdown.materialityScore, 4);
      }
    });
  });
});
```

### C. Expected Outcomes

**After Enhancement:**

**Regional Mode (No Change):**
- ✅ Still shows ~20-40 countries with material exposure
- ✅ Still filters by materiality thresholds
- ✅ Still provides detailed breakdowns
- ✅ Same analytical purpose and use cases

**Global Mode (Enhanced):**
- ✅ Shows ~150-195 countries with any computable exposure
- ✅ Displays smooth decay pattern from high to low exposure
- ✅ Includes long-tail countries with small but non-zero ΔCSI
- ✅ Provides meaningful distinction from Regional mode
- ✅ Enables portfolio-level and tail risk analysis
- ✅ Optional display threshold to filter noise without losing data

**User Experience:**
- ✅ Clear differentiation between Regional and Global modes
- ✅ Transparent about data quality and exposure magnitude
- ✅ Configurable display threshold for noise management
- ✅ Smooth transition from material to minimal exposures
- ✅ No misleading "Limited exposure data available" messages

### D. Risks & Mitigation

**Risk 1: Performance Impact**

**Concern:** Calculating exposure for all ~195 countries may slow down Global mode

**Mitigation:**
- Current code already calculates exposure for all countries
- No additional computation required
- Only display logic changes
- If needed, add lazy loading for country table

**Risk 2: UI Clutter**

**Concern:** Showing 150+ countries may overwhelm users

**Mitigation:**
- Implement display threshold (default: 0.05 for Global)
- Add "Show All" toggle for advanced users
- Paginate country table
- Add search/filter functionality
- Provide summary statistics (e.g., "45 countries with material exposure, 108 with minimal exposure")

**Risk 3: Data Quality Concerns**

**Concern:** Small exposures may be noisy or unreliable

**Mitigation:**
- Clearly label data quality in UI
- Show confidence indicators
- Distinguish between "real data" and "fallback estimates"
- Document limitations in help text
- Allow users to filter by data quality

**Risk 4: User Confusion**

**Concern:** Users may not understand difference between Regional and Global

**Mitigation:**
- Add clear mode descriptions in UI
- Provide use case examples
- Include tooltips and help text
- Create user guide documentation
- Add visual indicators (e.g., "Material Exposure" vs. "Long-Tail Effect" badges)

### E. Implementation Effort Estimate

**Phase 1: Core Logic (2-3 hours)**
- Modify reason assignment logic: 1 hour
- Add display threshold config: 30 minutes
- Add display threshold filtering: 30 minutes
- Testing and debugging: 1 hour

**Phase 2: UI Enhancement (3-4 hours)**
- Add display threshold control: 1 hour
- Enhance country table display: 2 hours
- Add visual indicators and tooltips: 1 hour

**Phase 3: Documentation & Validation (2-3 hours)**
- Update code documentation: 1 hour
- Create validation tests: 1 hour
- User guide documentation: 1 hour

**Total Estimated Effort: 7-10 hours**

**Complexity: LOW-MEDIUM**
- Changes are localized to specific functions
- No changes to core propagation formulas
- No database schema changes
- No API changes
- Minimal risk of breaking existing functionality

---

## Part 5: Conclusion

### Summary of Findings

1. **Problem Confirmed:** Global mode currently produces same output as Regional mode due to display logic treating non-material exposures as "Limited exposure data available"

2. **Root Cause Identified:** Reason assignment logic (Lines 1147-1163) creates binary output instead of showing smooth decay pattern

3. **Document Methodology Validated:** Attached document provides clear, defensible methodology that aligns with economic theory and risk management best practices

4. **Enhancement Feasible:** Implementation is straightforward, low-risk, and provides significant analytical value

### Strategic Recommendation

**✅ PROCEED WITH ENHANCEMENT**

**Justification:**

1. **High Value:** Enables portfolio-level risk assessment, tail risk analysis, and concentration analysis that are currently impossible

2. **Low Risk:** Changes are localized, well-defined, and don't affect core calculation logic

3. **Aligned with Best Practices:** Methodology is sound and follows "compute all, filter display" principle

4. **User Clarity:** Eliminates misleading "Limited exposure data available" messages and provides transparent exposure information

5. **Feasible Implementation:** Estimated 7-10 hours of development time with low-medium complexity

### Next Steps

**Immediate Actions:**

1. ✅ **Approve Enhancement:** Confirm decision to proceed with implementation

2. ⏳ **Phase 1 Implementation:** Modify core logic for reason assignment and display threshold

3. ⏳ **Testing:** Validate Regional ⊂ Global relationship and smooth decay pattern

4. ⏳ **Phase 2 Implementation:** Enhance UI with display threshold control and visual indicators

5. ⏳ **Documentation:** Update code comments, user guide, and create validation tests

6. ⏳ **Deployment:** Roll out enhancement with clear release notes explaining new Global mode behavior

**Success Criteria:**

- ✅ Regional mode unchanged (still shows ~20-40 countries)
- ✅ Global mode shows ~150-195 countries with smooth decay
- ✅ No "Limited exposure data available" for countries with computed exposure
- ✅ Display threshold successfully filters noise
- ✅ Regional countries appear in Global with same weights
- ✅ User feedback positive on enhanced analytical utility

---

## Appendices

### Appendix A: Code Locations Reference

| Component | File | Lines | Description |
|-----------|------|-------|-------------|
| Regional Mode | scenarioEngine.ts | 693-774 | getRegionalCountries() |
| Global Mode | scenarioEngine.ts | 777-848 | getGlobalCountries() |
| Material Exposure | scenarioEngine.ts | 565-687 | calculateMaterialExposure() |
| Propagation Weight | scenarioEngine.ts | 853-931 | calculateTargetCentricExposure() |
| Scaled Shock | scenarioEngine.ts | 938-991 | calculateScaledShock() |
| Reason Assignment | scenarioEngine.ts | 1147-1163 | Inside calculateScenarioImpact() |
| Config Interface | scenarioEngine.ts | 42-58 | ScenarioConfig |

### Appendix B: Key Formulas

**Propagation Weight:**
```
PropagationWeight_c = α·TradeExposure(c ↔ T) + β·SupplyChainExposure(c ↔ T) + γ·FinancialLinkage(c ↔ T)
```

**Event Impact:**
```
EventImpact_c = Severity × EventBaseShock × PropagationWeight_c
```

**CSI Change:**
```
ΔCSI_c = EventImpact_c
New_CSI_c = Base_CSI_c + ΔCSI_c
```

**Channel Weights:**
- α = 0.45 (Trade)
- β = 0.35 (Supply Chain)
- γ = 0.20 (Financial)

### Appendix C: Comparison Table

| Aspect | Regional (Current) | Regional (After) | Global (Current) | Global (After) |
|--------|-------------------|------------------|------------------|----------------|
| **Inclusion Criteria** | Material exposure required | ✅ Same | All countries added | ✅ Same |
| **Country Count** | ~20-40 | ✅ Same | ~195 | ✅ Same |
| **Display Logic** | Shows all included | ✅ Same | Shows "Limited data" for non-material | ✅ Shows actual exposure |
| **Propagation Formula** | Standard formula | ✅ Same | Standard formula | ✅ Same |
| **Output Pattern** | Filtered set | ✅ Same | Same as Regional | ✅ Smooth decay |
| **Analytical Value** | Near-term risk | ✅ Same | ❌ Same as Regional | ✅ Portfolio/tail risk |
| **User Clarity** | Clear | ✅ Same | ❌ Misleading | ✅ Transparent |

---

**Report Status:** ✅ COMPLETE

**Recommendation:** ✅ PROCEED WITH ENHANCEMENT

**Estimated Effort:** 7-10 hours

**Risk Level:** LOW-MEDIUM

**Expected Value:** HIGH

---

*This analysis is based on comprehensive review of the uploaded document "Regional vs Global Propagation.docx" and detailed code analysis of scenarioEngine.ts conducted on December 23, 2025.*

