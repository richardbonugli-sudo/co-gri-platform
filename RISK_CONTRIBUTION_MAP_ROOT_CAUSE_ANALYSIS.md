# Root Cause Analysis Report
## Company Methodology & Attribution Issues — Risk Contribution Map
**Platform:** CO-GRI Platform Phase 2  
**Date:** 2026-03-20  
**Analyst:** David (Data Analyst, Atoms Team)  
**Scope:** Deep investigation — no code changes, analysis only  

---

## Executive Summary

After a full read of all relevant source files, **7 distinct root-cause bugs** have been identified across 5 files. These bugs collectively cause the Risk Contribution Map (C3) and Risk Attribution (C7) to display results that are **methodologically inconsistent, economically misleading, and internally contradictory**. The issues span three layers: (1) data pipeline / channel blending, (2) calculation logic, and (3) UI presentation.

---

## Files Analysed

| File | Path |
|---|---|
| `RiskContributionMap.tsx` | `src/components/company/RiskContributionMap.tsx` |
| `RiskAttribution.tsx` | `src/components/company/RiskAttribution.tsx` |
| `attributionCalculations.ts` | `src/utils/attributionCalculations.ts` |
| `cogriCalculationService.ts` | `src/services/cogriCalculationService.ts` |
| `geographicExposureService.ts` | `src/services/geographicExposureService.ts` |

---

## Bug #1 — `determineDominantChannel()` Uses `Math.random()` (Non-Deterministic)

### Affected Files
- `RiskContributionMap.tsx` — **Line 457–460**
- `attributionCalculations.ts` — **Lines 104–108**

### Code
```typescript
// RiskContributionMap.tsx line 456-460
function determineDominantChannel(exposure: any): string {
  // Simplified - would come from actual channel breakdown
  const channels = ['Supply Chain', 'Revenue', 'Physical Assets', 'Financial'];
  return channels[Math.floor(Math.random() * channels.length)];
}

// attributionCalculations.ts lines 104-108
function determineDominantChannel(exposure: CountryExposure): string {
  // Simplified - would use actual channel breakdown in production
  const channels = ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'];
  return channels[Math.floor(Math.random() * channels.length)];
}
```

### Root Cause
Both components independently implement a `determineDominantChannel()` helper that returns a **randomly selected** channel on every render. This means:
- The "Dominant Channel" label shown in the Risk Contribution Map ranked list changes on every re-render.
- The same country may show "Supply Chain" in C3 and "Revenue" in C7 simultaneously.
- The channel labels in the tooltip, ranked list, bar chart, and table are all independently randomised and will never agree.
- The `CountryExposure` object passed in from `cogriCalculationService.ts` already contains `channelWeights` (lines 81–88 of `cogriCalculationService.ts`), but this data is **never read** by either helper.

### Economic Impact
A company like Apple (AAPL) with a well-known supply chain dependency on China will randomly display "Revenue" or "Financial" as China's dominant channel, directly contradicting economic reality and the underlying data that was correctly computed.

### Suggested Fix Direction
Replace both random implementations with a deterministic function that reads `exposure.channelWeights` and returns the channel with the highest blended contribution, using the `EXPOSURE_COEFFICIENTS` weights:
```
dominantChannel = argmax over {revenue×0.40, supply×0.35, assets×0.15, financial×0.10}
```

---

## Bug #2 — `W_c` (Alignment Modifier) Hardcoded to `0.5` in C3

### Affected File
- `RiskContributionMap.tsx` — **Line 69**

### Code
```typescript
// Line 69
W_c: 0.5 // Simplified - would come from alignment data
```

### Root Cause
The `RiskContributionMap` component hardcodes `W_c = 0.5` for every country, ignoring the `politicalAlignment.alignmentFactor` that is already present in the `CountryExposure` objects passed via props (set in `cogriCalculationService.ts` lines 183–187 and 206).

The actual alignment factor is used correctly in `cogriCalculationService.ts` (line 187):
```typescript
const contribution = blendedWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
```

But when the Advanced toggle is shown in C3, it displays `W_c = 0.5` for all countries regardless of their actual alignment relationship.

### Economic Impact
- China (adversarial alignment, `alignmentFactor ≈ 0.3`) and Germany (allied alignment, `alignmentFactor ≈ 0.9`) both show `W_c = 0.50` in the Advanced panel.
- This makes the Advanced view actively misleading — it implies equal geopolitical alignment for all countries, which contradicts the CO-GRI methodology.

### Suggested Fix Direction
Read `exposure.politicalAlignment?.alignmentFactor` from the `countryExposures` prop and pass it through to the `RiskContribution` object instead of hardcoding `0.5`.

---

## Bug #3 — `alignment_modifier` Hardcoded to `0.5` in `attributionCalculations.ts`

### Affected File
- `attributionCalculations.ts` — **Line 44**

### Code
```typescript
// Line 44
alignment_modifier: 0.5  // Simplified - would come from alignment data
```

### Root Cause
Identical to Bug #2 but in the C7 Risk Attribution component. The `calculateCountryAttribution()` function receives `CountryExposure[]` which already contains `politicalAlignment.alignmentFactor` (set by `cogriCalculationService.ts`), but discards it and substitutes `0.5`.

The C7 table's "W^c" column (visible in Advanced mode, `RiskAttribution.tsx` line 177) therefore always shows `0.50` for every country.

### Economic Impact
Same as Bug #2 — the Advanced Metrics view in C7 is factually incorrect for every country that has a non-neutral alignment relationship.

---

## Bug #4 — `calculateChannelBreakdown()` Uses Fixed Weights, Ignores Real Channel Data

### Affected File
- `attributionCalculations.ts` — **Lines 62–78**

### Code
```typescript
export function calculateChannelBreakdown(
  country: string,
  totalContribution: number
): ChannelBreakdown[] {
  // Simplified - in production would use actual channel-specific data
  const channels = ['Revenue', 'Supply Chain', 'Physical Assets', 'Financial'];
  const weights = [0.35, 0.30, 0.20, 0.15];

  return channels.map((channel, idx) => {
    const contribution = totalContribution * weights[idx];
    return {
      channel,
      contribution,
      percentage: weights[idx] * 100
    };
  });
}
```

### Root Cause
The expanded country detail in C7 (the "Channel Breakdown" section shown when a user clicks the expand arrow) always displays a **fixed 35/30/20/15 split** regardless of the actual channel weights for that country. The function signature accepts `country` and `totalContribution` but ignores `country` entirely.

The real per-country channel weights are available in `CountryExposure.channelWeights` (set in `cogriCalculationService.ts` lines 199–205):
```typescript
channelWeights: {
  revenue: channelData.revenue?.weight || 0,
  financial: financialWeight,
  supply: channelData.supply?.weight || 0,
  assets: channelData.assets?.weight || 0,
  market: 0
}
```

### Economic Impact
- A country like Taiwan, which may have 80%+ supply chain weight for a semiconductor company, will always show the generic 35/30/20/15 split.
- A country like Ireland, which may be 100% financial/revenue with zero supply chain, will incorrectly show 30% Supply Chain.
- The channel breakdown is the most granular data shown to users; displaying fabricated percentages directly undermines trust in the platform.

### Suggested Fix Direction
Pass `CountryExposure` (not just `country: string`) to `calculateChannelBreakdown()` and compute percentages from `exposure.channelWeights` multiplied by `EXPOSURE_COEFFICIENTS`.

---

## Bug #5 — Field Name Mismatch: `operations` vs `financial` Between `geographicExposureService` and `cogriCalculationService`

### Affected Files
- `geographicExposureService.ts` — **Lines 71–83, 275–286, 407–419** (uses `operations` field name)
- `cogriCalculationService.ts` — **Lines 38, 83, 165, 172** (uses `financial` field name with legacy fallback)

### Code
```typescript
// geographicExposureService.ts line 71-83 — ChannelBreakdown interface
interface ChannelBreakdown {
  [country: string]: {
    revenue: ChannelData;
    operations: ChannelData;   // ← uses "operations"
    supply: ChannelData;
    assets: ChannelData;
    blended: number;
    ...
  };
}

// geographicExposureService.ts line 407-419 — sets "operations" key
channelBreakdown[country] = {
  revenue: convertIntegratedToChannelData(revenue),
  operations: convertIntegratedToChannelData(financial),  // ← writes to "operations"
  supply: convertIntegratedToChannelData(supply),
  assets: convertIntegratedToChannelData(assets),
  ...
};

// cogriCalculationService.ts line 165, 172 — reads "financial" with fallback
const financialWeight = channelData.financial?.weight 
  || (channelData as any).operations?.weight || 0;  // ← legacy fallback needed
```

### Root Cause
`geographicExposureService.ts` writes the financial channel data under the key `operations`, but `cogriCalculationService.ts` expects it under `financial`. A `(channelData as any).operations?.weight` cast was added as a workaround (line 172), but this is fragile and the `ChannelBreakdown` interface in `cogriCalculationService.ts` (line 38) defines the field as `financial`, creating a permanent type-level inconsistency.

The `COGRICalculationInput.channelBreakdown` type (line 64) uses the `cogriCalculationService.ts` interface which has `financial`, but the actual data object produced by `geographicExposureService.ts` has `operations`. TypeScript's structural typing may silently pass this mismatch.

### Economic Impact
If the `(channelData as any).operations?.weight` fallback ever fails (e.g., after a refactor removes the cast), the financial channel weight silently becomes `0` for all countries. Since financial has a 10% coefficient, this would understate exposure for financial-heavy countries (Ireland, Luxembourg, Cayman Islands) and cause silent miscalculation of the CO-GRI score.

---

## Bug #6 — `geographicExposureService` Applies a 0.5% Blended-Weight Filter That Contradicts `cogriCalculationService`'s Stated Fix

### Affected Files
- `geographicExposureService.ts` — **Lines 398–401**
- `cogriCalculationService.ts` — **Lines 238–241** (comment says filter was removed)

### Code
```typescript
// geographicExposureService.ts lines 398-401 — STILL filters at 0.5%
if (blendedWeight < 0.005) {
  console.log(`[${ticker}]    ⚠️ Below micro-exposure threshold (0.5%), excluding from final results`);
  continue;
}

// cogriCalculationService.ts lines 238-241 — says filter was REMOVED
// PRIORITY 3 FIX: Removed 0.5% filtering threshold
// OLD: const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= 0.005);
// NEW: Only filter out true zeros (0.01% = 1 basis point minimum)
const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= 0.0001);
```

### Root Cause
`cogriCalculationService.ts` was updated (PRIORITY 3 FIX) to lower the filtering threshold from 0.5% to 0.01% to ensure small-but-real exposures (e.g., Japan at 6.8% was cited as an example of a country being hidden) are included. However, `geographicExposureService.ts` still applies the **old 0.5% threshold** at line 398–401 during the channel blending phase, before the data even reaches `cogriCalculationService`.

This means the PRIORITY 3 FIX is partially ineffective: countries with blended weights between 0.01% and 0.5% are silently dropped by `geographicExposureService` and never reach `cogriCalculationService` at all.

### Economic Impact
- Small but real exposures (e.g., a company with 1.2% revenue from Vietnam, which after blending becomes 0.3% blended weight) are silently excluded from the Risk Contribution Map.
- The fix intended to surface Japan at 6.8% may have worked (6.8% > 0.5%), but any country with a blended weight below 0.5% is still suppressed upstream.
- The two services are now operating with inconsistent filtering thresholds, making the system's behaviour unpredictable.

---

## Bug #7 — `RiskContributionMap` `getContributorData()` Uses Partial String Match, Causing False Positives and False Negatives

### Affected File
- `RiskContributionMap.tsx` — **Lines 154–158**

### Code
```typescript
const getContributorData = (countryName: string) => {
  return topContributors.find(c => 
    countryName.includes(c.country) || c.country.includes(countryName)
  );
};
```

### Root Cause
The world map geography names (from `world-atlas` TopoJSON) and the country names in `countryExposures` may differ. The partial string match `includes()` is used to bridge this gap, but it introduces two classes of error:

**False Positives (wrong country highlighted):**
- `c.country = "Korea"` would match `countryName = "North Korea"` (Democratic People's Republic of Korea) even though the exposure is for South Korea.
- `c.country = "Guinea"` would match `countryName = "Papua New Guinea"` or `"Equatorial Guinea"`.
- `c.country = "Congo"` would match both `"Republic of the Congo"` and `"Democratic Republic of the Congo"`.

**False Negatives (country not highlighted):**
- `c.country = "South Korea"` would NOT match `countryName = "Korea"` (the TopoJSON name) because `"Korea".includes("South Korea")` is `false` and `"South Korea".includes("Korea")` is `true` — this one would actually work, but only by coincidence of direction.
- `c.country = "United States"` would NOT match `countryName = "United States of America"` because neither `includes()` direction is satisfied.

The coordinate lookup `getCountryCoordinates()` (lines 107–132) uses the internal names correctly, but the geography fill colour logic uses the broken `includes()` match, meaning a country can have a marker placed correctly but its fill colour applied to the wrong geography polygon.

### Economic Impact
- The US (potentially the home country with the highest exposure weight after normalization) may not be highlighted on the map at all if the TopoJSON uses "United States of America".
- North Korea could be coloured red when the exposure is actually for South Korea.
- This is a visual correctness issue that directly undermines the map's purpose of showing geographic risk distribution.

---

## Summary Table

| # | Bug | File | Line(s) | Severity | Economic Impact |
|---|---|---|---|---|---|
| 1 | `determineDominantChannel()` uses `Math.random()` | `RiskContributionMap.tsx`, `attributionCalculations.ts` | 456–460, 104–108 | **Critical** | Channel labels wrong and inconsistent across C3/C7 on every render |
| 2 | `W_c` hardcoded to `0.5` in C3 | `RiskContributionMap.tsx` | 69 | **High** | Advanced panel shows wrong alignment for all countries |
| 3 | `alignment_modifier` hardcoded to `0.5` in C7 | `attributionCalculations.ts` | 44 | **High** | C7 Advanced table shows wrong W^c for all countries |
| 4 | `calculateChannelBreakdown()` uses fixed 35/30/20/15 split | `attributionCalculations.ts` | 62–78 | **High** | Country channel breakdown is fabricated, not from real data |
| 5 | Field name mismatch `operations` vs `financial` | `geographicExposureService.ts`, `cogriCalculationService.ts` | 407, 38/172 | **High** | Financial channel silently zeroed if cast removed; type inconsistency |
| 6 | 0.5% filter still active in `geographicExposureService` despite PRIORITY 3 FIX | `geographicExposureService.ts`, `cogriCalculationService.ts` | 398–401, 241 | **Medium** | Small real exposures still suppressed upstream; PRIORITY 3 FIX partially ineffective |
| 7 | `getContributorData()` uses partial string match | `RiskContributionMap.tsx` | 154–158 | **Medium** | Wrong countries highlighted/coloured on map (e.g., North Korea vs South Korea, US not highlighted) |

---

## Data Flow Diagram (Where Bugs Occur)

```
geographicExposureService.ts
  └─ calculateIndependentChannelExposuresWithSEC()
       ├─ [BUG #5] Writes "operations" key (should be "financial")
       └─ [BUG #6] Filters blendedWeight < 0.005 (0.5% threshold, contradicts PRIORITY 3 FIX)
            │
            ▼
cogriCalculationService.ts → calculateCOGRIScore()
  ├─ [BUG #5] Reads "financial" with (channelData as any).operations fallback
  └─ CountryExposure[] produced with:
       - exposureWeight (normalized)
       - countryShockIndex (CSI)
       - contribution (W × CSI × alignment amplifier)
       - channelWeights {revenue, financial, supply, assets}  ← REAL DATA EXISTS
       - politicalAlignment.alignmentFactor                   ← REAL DATA EXISTS
            │
            ▼
CompanyModePage.tsx → passes countryExposures to C3 and C7
            │
     ┌──────┴──────┐
     ▼             ▼
RiskContributionMap   RiskAttribution
(C3)                  (C7)
  ├─ [BUG #1]           ├─ [BUG #1] determineDominantChannel() → Math.random()
  ├─ [BUG #2]           ├─ [BUG #3] alignment_modifier hardcoded 0.5
  └─ [BUG #7]           └─ [BUG #4] calculateChannelBreakdown() fixed 35/30/20/15
     getContributorData()
     partial string match
```

---

## Recommended Fix Priority

1. **Immediate (Bugs #1, #4):** Replace all `Math.random()` and fixed-weight placeholders with deterministic reads from `CountryExposure.channelWeights`. These produce visibly wrong and non-reproducible output on every render.

2. **High Priority (Bugs #2, #3):** Pass `politicalAlignment.alignmentFactor` through to the Advanced toggle display in both C3 and C7. The data already exists in the props; it just needs to be wired through.

3. **High Priority (Bug #5):** Standardise the channel field name to `financial` across both services. Update `geographicExposureService.ts` to write `financial` instead of `operations`, and remove the `(channelData as any).operations?.weight` cast.

4. **Medium Priority (Bug #6):** Align the filtering threshold in `geographicExposureService.ts` (line 398) with the PRIORITY 3 FIX threshold in `cogriCalculationService.ts` (0.0001 / 0.01%).

5. **Medium Priority (Bug #7):** Replace the `includes()` partial match in `getContributorData()` with an explicit ISO 3166 country name normalisation map, similar to how `getCountryCoordinates()` already handles aliases (`'S. Korea'`, `'South Korea'`, `'USA'`, `'United States'`).

---

*Report compiled by David — Atoms Platform Data Analyst. No code changes were made during this investigation.*