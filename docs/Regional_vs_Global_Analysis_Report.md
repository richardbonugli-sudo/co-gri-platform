# Strategic Analysis: Regional vs. Global Propagation Enhancement
## Predictive Analytics Service - Spillover Methodology Review

**Date:** December 23, 2025  
**Analyst:** Strategic Advisory Team  
**Subject:** Analysis and Recommendation for Regional vs. Global Propagation Distinction

---

## Executive Summary

### Current Issue Identified

The user has identified that **Global propagation mode currently produces the same output as Regional propagation mode**, making it uninformative:

1. ✅ **Regional Mode**: Correctly filters to countries with material target-centric exposure
2. ❌ **Global Mode**: Should include ALL countries (even with minimal exposure), but currently appears to re-use the regional spillover set
3. ❌ **Result**: Global mode displays most countries as hard-zero with "limited exposure data available"

### Analysis Status

**Document Received:** `/workspace/uploads/Regional vs Global Propagation.docx`

**Next Steps:**
1. Extract and analyze the formal methodology from the uploaded document
2. Compare with current implementation in `scenarioEngine.ts`
3. Identify specific code changes needed
4. Provide strategic recommendation

---

## Current Implementation Analysis

### Code Location
File: `/workspace/shadcn-ui/src/services/scenarioEngine.ts`

### Regional Propagation (Lines 693-774)

**Function:** `getRegionalCountries()`

**Current Logic:**
```typescript
function getRegionalCountries(
  targetCountries: string[],
  actorCountry: string
): { 
  countries: string[], 
  inclusionAnalysis: ScenarioImpact['inclusionAnalysis'],
  materialityBreakdowns: Record<string, ReturnType<typeof calculateMaterialExposure>>
}
```

**Process:**
1. Evaluates ALL countries against each target
2. Calls `calculateMaterialExposure()` for each country-target pair
3. **FILTERS**: Only includes countries where `materialExposure.hasMaterialExposure === true`
4. Material exposure requires meeting at least ONE of:
   - Top 15 trade partner
   - ≥1.5% trade intensity
   - ≥1.2% supply chain score
   - ≥0.8% financial linkage
   - Geographic proximity + ≥1.5% materiality score

**Result:** ~20-40 countries typically qualify (material exposure only)

### Global Propagation (Lines 777-848)

**Function:** `getGlobalCountries()`

**Current Logic:**
```typescript
function getGlobalCountries(
  targetCountries: string[],
  actorCountry: string
): { 
  countries: string[], 
  inclusionAnalysis: ScenarioImpact['inclusionAnalysis'],
  materialityBreakdowns: Record<string, ReturnType<typeof calculateMaterialExposure>>
}
```

**Process:**
1. Evaluates ALL countries
2. **Line 807:** `globalSet.add(country);` - Adds ALL countries to the set
3. Calls `calculateMaterialExposure()` for transparency/breakdown
4. **NO FILTERING** - all countries are included

**Expected Result:** ~195 countries should be included

### The Problem: Why Global Appears Same as Regional

**Root Cause Analysis:**

Looking at line 807 in `getGlobalCountries()`:
```typescript
globalSet.add(country);  // Include all countries in Global mode
```

This line DOES add all countries. However, the issue is likely in the **downstream processing** or **UI display logic**.

**Hypothesis 1: Propagation Weight Calculation**
- Countries with very small exposure get propagation weights near 0.001 (minimum)
- CSI changes become negligible (e.g., 0.01-0.05 points)
- These may be filtered out or displayed as "no change" in the UI

**Hypothesis 2: UI Display Filtering**
- The UI may filter out countries with CSI changes < 0.1 points
- Or displays them as "limited exposure data available"

**Hypothesis 3: Materiality Breakdown Logic**
- Countries without material exposure may not get proper breakdown data
- This causes them to display as "limited exposure data available"

---

## Document Analysis Pending

**Status:** Awaiting document content extraction

Once the document is analyzed, I will:

1. **Compare Intended vs. Current Methodology**
   - Document's definition of Regional propagation
   - Document's definition of Global propagation
   - Specific formulas and thresholds

2. **Identify Gaps**
   - What's missing in current implementation
   - What needs to be changed
   - What's working correctly

3. **Provide Strategic Recommendation**
   - Should we enhance the distinction?
   - Specific implementation approach
   - Expected impact and benefits
   - Risks and considerations

---

## Preliminary Observations

### What's Working

✅ **Regional Mode:**
- Correctly implements material exposure filtering
- Uses multi-channel assessment (trade, supply chain, financial)
- Provides detailed materiality breakdowns
- Transparent inclusion criteria

✅ **Global Mode Structure:**
- Includes all countries in the propagation set
- Calculates material exposure for transparency
- Tracks fallback usage

### What Needs Investigation

⚠️ **Global Mode Output:**
- Why do countries appear as hard-zero?
- Where is the filtering happening (code vs. UI)?
- Are propagation weights being calculated correctly for all countries?

⚠️ **Display Logic:**
- How are "limited exposure data available" countries determined?
- Is there a minimum threshold for display?
- Are very small CSI changes being rounded to zero?

---

## Next Steps

1. ✅ Extract content from uploaded document
2. ⏳ Analyze intended methodology
3. ⏳ Compare with current implementation
4. ⏳ Identify specific code issues
5. ⏳ Provide strategic recommendation with implementation plan

---

**Report Status:** IN PROGRESS - Awaiting document content extraction

