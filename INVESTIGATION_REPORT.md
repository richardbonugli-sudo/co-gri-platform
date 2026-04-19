# CO-GRI Platform: Deep Investigation & Analysis Report

**Date:** 2026-03-24  
**Scope:** Two questions — (1) "International / Other" as Residual Constraint vs Special Fallback, and (2) Output Transparency: Direct, Allocated, and Modeled  
**Files Reviewed:** geographicExposureService.ts, cogriCalculationService.ts, structuredDataIntegratorV5.ts, channelBuilder.ts, channelPriors.ts, narrativeParser.ts, structuredDataIntegrator.ts, types/company.ts, all src/components/company/, all src/components/dashboard/, CompanyMode.tsx, COGRIAuditReport.tsx

---

## Executive Summary

The codebase has undergone significant evolution (V1 → V5) and contains both legacy and modern code paths. The two questions raised are both architecturally important and partially addressed in the V5 layer, but neither is fully implemented end-to-end in the UI. This report provides a complete analysis of the current state and concrete recommendations.

---

## Part 1: "International / Other" as Residual Constraint vs Special Fallback

### 1.1 Current Behavior — How "International / Other" Is Handled Today

#### 1.1.1 Legacy Path (structuredDataIntegrator.ts — deprecated but still called)

In the legacy `integrateRevenueChannel()` function (lines 430–573 of `structuredDataIntegrator.ts`), "International / Other" segments are handled by the `decideFallback()` function in `fallbackLogic.ts`. The flow is:

1. `isGlobalFallbackSegment(segmentName)` checks if the name matches keywords: `"international"`, `"rest of world"`, `"other"`, `"foreign"`, `"non-us"`, `"other countries"`, etc.
2. If matched → **Global Fallback (GF)** is applied: home country gets 85% weight, remaining 15% is distributed across sector template top countries.
3. The segment's actual percentage weight (e.g., 20% of revenue labeled "International") is passed as `unknownPortion` to `applyGlobalFallback()`.

**Critical Problem:** This is NOT a residual constraint. The 20% "International" weight is treated as an independent bucket and distributed via GF formula — but it is NOT constrained to sum to (100% − known country weights). If the filing says "US: 80%, International: 20%", the legacy path correctly passes 20% as `unknownPortion`. However, if the filing says "US: 42%, Europe: 25%, International: 33%", the GF distribution of the 33% is completely independent of the Europe allocation — there is no constraint preventing double-counting of countries.

#### 1.1.2 V5 Path (structuredDataIntegratorV5.ts — current active path)

The V5 `integrateRevenueChannelV5()` function (lines 328–510) implements the **GAP 4 FIX** which is the closest thing to a residual constraint in the current codebase:

```typescript
// GAP 4 FIX: Residual bucket — distribute across unconstrained countries
const constrained = new Set(Object.keys(channel));
const eligible = ALL_KNOWN_COUNTRIES.filter(c => !constrained.has(c));
if (eligible.length > 0) {
  const residualWeights = allocateWithPrior(eligible, 'revenue', sector, segmentShare);
  ...
}
```

**This is the residual constraint approach.** When a segment is identified as a residual label (via `getRegionMembersFromName()` returning `[RESIDUAL_SENTINEL]`), the V5 code:
1. Identifies all countries already allocated (`constrained` set).
2. Filters `ALL_KNOWN_COUNTRIES` to only those NOT yet constrained (`eligible`).
3. Distributes the residual segment's weight ONLY across unconstrained countries.

**This prevents double-counting.** A country already assigned 16.9% revenue (e.g., China) cannot receive additional weight from the "International" bucket.

#### 1.1.3 Detection Logic — Which Labels Trigger Residual Treatment

In `structuredDataIntegratorV5.ts`, the `getRegionMembersFromName()` function (lines 125–195) returns `[RESIDUAL_SENTINEL]` for:
- `"rest of world"`, `"other"`, `"international"`, `"other international"`, `"non-us"`, `"other countries"`, `"all other"`, `"other regions"`

In `fallbackLogic.ts`, `GLOBAL_FALLBACK_KEYWORDS` (lines 152–167) covers:
- `"international"`, `"rest of world"`, `"other"`, `"foreign"`, `"non-us"`, `"global markets"`, `"worldwide"`, `"other countries"`, `"other regions"`, `"rest of the world"`, `"international markets"`, `"overseas"`, `"abroad"`, `"external markets"`

The V5 list is a subset of the legacy list. The V5 approach is more conservative (fewer triggers) but more correct (residual constraint instead of GF).

#### 1.1.4 narrativeParser.ts — How Residual Labels Are Parsed

In `narrativeParser.ts`, the `isGlobalFallbackSegment()` function (line 229) uses the same `GLOBAL_FALLBACK_KEYWORDS` list. When a segment matches, the parser calls `applyGlobalFallback()` which uses the **old 85/15 split** (home country 85%, sector template 15%) — NOT the residual constraint approach.

The narrative parser also has a `generateSimulatedNarrativeText()` function that produces Apple-specific text. This simulated text is used when live EDGAR data is unavailable, which means the "International" handling in the narrative path is based on simulated data, not real filing content.

#### 1.1.5 channelBuilder.ts — V5 Channel Building

The `channelBuilder.ts` file implements `buildRevenueChannel()`, `buildSupplyChannel()`, `buildAssetsChannel()`, and `buildFinancialChannel()`. Each function:
1. Calls the corresponding V5 integrator.
2. Applies coverage checks (≥95% suppresses fallback).
3. Returns a channel object with `tier` labels (DIRECT/ALLOCATED/MODELED).

The channel builder does NOT independently implement residual logic — it delegates to the V5 integrators.

### 1.2 Analysis: Is the Current Approach Correct?

#### 1.2.1 The Residual Constraint Approach Is Mathematically Superior

When a company reports:
- US: 42%, Europe: 25%, International: 33%

The correct interpretation is:
- "International" = everything NOT in US or Europe = 33% of total
- Countries in "International" cannot include US or any European country

The V5 GAP 4 FIX correctly implements this. The legacy GF approach does NOT — it could assign weight to Germany (already in "Europe") from the "International" bucket.

#### 1.2.2 Gaps in the Current V5 Implementation

**Gap A: `ALL_KNOWN_COUNTRIES` is a hardcoded list of 55 countries**

```typescript
const ALL_KNOWN_COUNTRIES = [
  'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France',
  'India', 'South Korea', 'Canada', 'Italy', 'Brazil', 'Australia',
  // ... 55 countries total
];
```

This list is much smaller than the full global country set (195+ countries). Countries not in this list (e.g., many African, Central Asian, or smaller European countries) can never receive residual weight. This is a pragmatic choice but should be documented.

**Gap B: The residual constraint only applies to the revenue channel in V5**

The assets channel (`integrateAssetsChannelV5`) and supply channel (`integrateSupplyChannelV5`) do NOT implement the GAP 4 FIX residual constraint. They fall back to `buildGlobalFallbackV5()` which uses the V5 GF formula (channel-specific λ + prior) but does NOT exclude already-constrained countries.

**Gap C: Inconsistency between legacy and V5 paths**

`integrateStructuredData()` (the main entry point) routes through V5 integrators since the GAP 1 FIX. However, the deprecated `integrateRevenueChannel()`, `integrateSupplyChannel()`, `integrateAssetsChannel()`, and `integrateFinancialChannel()` functions are still exported and could be called directly. If called directly, they use the legacy GF approach without residual constraints.

**Gap D: The `geographicExposureService.ts` company-specific path bypasses all of this**

For AAPL, TSLA, and MSFT, the `COMPANY_SPECIFIC_EXPOSURES` database is used directly. These entries do not have an "International" bucket — they list specific countries. So the residual constraint question is moot for these three tickers. For all other tickers, the V5 path applies.

**Gap E: `narrativeParser.ts` still uses the legacy GF approach**

The narrative parser's `applyGlobalFallback()` call uses the old 85/15 split, not the V5 residual constraint. Since the narrative parser is used in the SEC filing parsing path, this means that even when V5 integrators are used, the underlying parsed data may have been produced with the legacy approach.

#### 1.3 Recommended Changes

**Recommendation 1 (High Priority): Extend GAP 4 FIX to all four channels**

The residual constraint logic in `integrateRevenueChannelV5()` should be replicated in `integrateSupplyChannelV5()`, `integrateAssetsChannelV5()`, and `integrateFinancialChannelV5()`. Each channel should track its own `constrained` set and distribute residual labels only to unconstrained countries.

```typescript
// Suggested pattern for all four channels:
if (members.length === 1 && members[0] === RESIDUAL_SENTINEL) {
  const constrained = new Set(Object.keys(channel));
  const eligible = ALL_KNOWN_COUNTRIES.filter(c => !constrained.has(c));
  const residualWeights = allocateWithPrior(eligible, channelType, sector, segmentShare);
  // ... assign to channel
}
```

**Recommendation 2 (Medium Priority): Replace `ALL_KNOWN_COUNTRIES` with the full `COUNTRY_GDP_2023` key set**

`fallbackLogic.ts` already has `COUNTRY_GDP_2023` with ~80 countries. Using this as the eligible set for residual distribution would be more comprehensive than the hardcoded 55-country list in V5.

**Recommendation 3 (Medium Priority): Update `narrativeParser.ts` to use V5 residual logic**

Replace the `applyGlobalFallback()` call in `narrativeParser.ts` with the V5 residual constraint approach, passing the set of already-allocated countries as exclusions.

**Recommendation 4 (Low Priority): Deprecate and remove legacy channel integrators**

The `integrateRevenueChannel()`, `integrateSupplyChannel()`, `integrateAssetsChannel()`, and `integrateFinancialChannel()` functions in `structuredDataIntegrator.ts` are marked `@deprecated` but still exported. They should be removed or made private to prevent accidental use of the legacy GF approach.

**Recommendation 5 (Low Priority): Document the residual constraint semantics**

Add a JSDoc comment to `getRegionMembersFromName()` explaining the `RESIDUAL_SENTINEL` pattern and why it triggers residual constraint distribution rather than GF fallback. This is a subtle but important distinction.

---

## Part 2: Output Transparency — Direct, Allocated, and Modeled

### 2.1 Current State of Tier Labeling

#### 2.1.1 V5 Type System — `IntegratedChannelDataV5`

The V5 type system (`structuredDataIntegratorV5.ts`, lines 66–83) defines a `tier` field:

```typescript
export interface IntegratedChannelDataV5 {
  country: string;
  weight: number;
  state: 'known-zero' | 'known-positive' | 'unknown';
  status: 'evidence' | 'high_confidence_estimate' | 'fallback';
  source: string;
  dataQuality: 'high' | 'medium' | 'low';
  evidenceType: 'structured_table' | 'narrative' | 'fallback' | 'exhibit_21' | 'sustainability_report';
  fallbackType?: 'SSF' | 'RF' | 'GF' | 'none';
  tier: 'DIRECT' | 'ALLOCATED' | 'MODELED';
}
```

The `determineTier()` helper (lines 97–111) assigns tiers:
- **DIRECT**: `evidenceType === 'structured_table'` AND `fallbackType === 'none'` — explicitly disclosed in SEC filing
- **ALLOCATED**: `evidenceType` is `structured_table`, `exhibit_21`, or `sustainability_report` AND `fallbackType === 'SSF'` — derived from region total via prior split
- **MODELED**: everything else — prior-based inference, no direct constraint

#### 2.1.2 `CountryExposure` Type — `dataSource` Field

The `CountryExposure` interface in `types/company.ts` (lines 38–57) has a `dataSource` field:

```typescript
export interface CountryExposure {
  country: string;
  exposureWeight: number;
  // ...
  dataSource?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
}
```

Note: The `CountryExposure.dataSource` uses four values (DIRECT, ALLOCATED, MODELED, FALLBACK) while `IntegratedChannelDataV5.tier` uses three (DIRECT, ALLOCATED, MODELED). The `FALLBACK` value in `CountryExposure` maps to `MODELED` in V5 tier terminology.

#### 2.1.3 Bridge Function — `v5ChannelToMain()`

In `structuredDataIntegrator.ts`, the `v5ChannelToMain()` function (lines 86–115) bridges V5 output to the legacy `IntegratedChannelData` shape. This function:
- Copies `tier` from V5 to the legacy shape
- Preserves `fallbackType`, `status`, `dataQuality`, `evidenceType`

However, the `IntegratedChannelData` interface (legacy) does NOT have a `tier` field. The bridge function adds it dynamically but it is not part of the typed interface. This means TypeScript does not enforce `tier` propagation through the legacy path.

#### 2.1.4 `cogriCalculationService.ts` — Tier Propagation

In `cogriCalculationService.ts`, the `calculateCOGRIScore()` function processes `channelBreakdown` data. The `CountryExposure` output includes `dataSource` which is set based on `bestStatus`:

```typescript
// From cogriCalculationService.ts
const bestStatus = getBestChannelStatus(channelData);
// bestStatus maps to dataSource: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK'
```

The `getBestChannelStatus()` function (in cogriCalculationService.ts) examines all four channels for a country and returns the best (highest quality) status. This means if a country has DIRECT evidence in the revenue channel but MODELED in supply/assets/financial, its `dataSource` will be DIRECT.

**This is a reasonable approach** — the best available evidence determines the label — but it means the per-channel tier information is collapsed into a single per-country label.

#### 2.1.5 UI Components — Where Tiers Are Currently Displayed

**CompanyMode.tsx (lines 326–370):** Implements an "Evidence Tier Summary Bar" that shows aggregate counts:
```
Data Source: DIRECT 3/14 (45% weight) | ALLOCATED 4/14 (30% weight) | MODELED 7/14 | FALLBACK 0/14
```
This is a summary-level display, not per-country.

**VerificationDrawer.tsx (GAP 5 FIX, lines 42–77):** Implements `TierBadge` component and an "Evidence Tiers" tab that shows a full table of (Country, Channel, Tier, Weight, Source). This is the most detailed tier display in the UI.

**However:** The `VerificationDrawer` is only shown in the "Timeline & Verification" sub-tab of the bottom row. It is NOT shown in the main risk attribution table (RiskAttribution.tsx) or the country map (RiskContributionMap.tsx). The tier information is buried.

**RiskAttribution.tsx:** Does NOT currently show tier badges per country row. The audit report (Section 5, Finding type="gap") explicitly notes this as a gap: "The UI currently does not surface the fallback tier to end users in the Company Mode dashboard."

**RiskContributionMap.tsx:** The world map component shows country exposure weights but does not color-code by tier.

#### 2.2 Analysis: Is the Current Tier System Adequate?

#### 2.2.1 The Three-Tier Taxonomy Is Well-Designed

The DIRECT / ALLOCATED / MODELED taxonomy is semantically correct and aligns with standard data quality frameworks:

| Tier | Meaning | Example |
|------|---------|---------|
| DIRECT | Explicitly disclosed in SEC filing | "China: 16.9% of net sales" in Apple 10-K |
| ALLOCATED | Derived from structural constraint | "Europe: 25%" split across 15 countries via economic prior |
| MODELED | Prior-based inference, no direct constraint | GF fallback distribution |

This is superior to the legacy `status` field (`evidence` / `high_confidence_estimate` / `fallback`) because it separates the *method* of derivation from the *confidence level*.

#### 2.2.2 The Four-Value `dataSource` in `CountryExposure` Is Redundant

`CountryExposure.dataSource` has four values: DIRECT, ALLOCATED, MODELED, FALLBACK. The `FALLBACK` value is essentially a subset of `MODELED` (all fallback data is modeled). This creates confusion:
- In V5 tier: `MODELED` covers both "prior-based inference" and "GF fallback"
- In `CountryExposure.dataSource`: `MODELED` and `FALLBACK` are separate

**Recommendation:** Consolidate to three values (DIRECT, ALLOCATED, MODELED) everywhere, with `FALLBACK` being a sub-category of `MODELED` expressed via the existing `fallbackType` field (SSF/RF/GF).

#### 2.2.3 Tier Information Is Not Surfaced at the Right Level

The tier information exists in the data model but is not visible where users make decisions:

| Component | Shows Tier? | Where? |
|-----------|-------------|--------|
| CompanyMode.tsx | ✅ Yes | Summary bar (aggregate counts only) |
| VerificationDrawer.tsx | ✅ Yes | Evidence Tiers tab (detailed, but buried) |
| RiskAttribution.tsx | ❌ No | — |
| RiskContributionMap.tsx | ❌ No | — |
| ExposurePathways.tsx | ❌ No | — |
| CompanySummaryPanel.tsx | ❌ No | — |

The two most important places for tier display are `RiskAttribution.tsx` (where users see country-by-country risk breakdown) and `RiskContributionMap.tsx` (where users see the geographic distribution). Neither shows tier information.

#### 2.2.4 Per-Channel Tier vs Per-Country Tier

The current system collapses per-channel tier information into a single per-country `dataSource`. This means:

- China: DIRECT (because revenue channel has direct evidence)
- But China's supply chain weight might be MODELED (GF fallback)
- And China's assets weight might be ALLOCATED (PP&E table region split)

A user seeing "China: DIRECT" might incorrectly assume all four channels have direct evidence. The actual situation is more nuanced.

**The `VerificationDrawer`'s Evidence Tiers tab** correctly shows per-channel tier information (Country + Channel + Tier). This is the right approach but is only accessible in the buried verification drawer.

#### 2.2.5 `channelBreakdown` Not Passed to `VerificationDrawer` in `CompanyMode.tsx`

Looking at `CompanyMode.tsx` line 482-488:
```tsx
<VerificationDrawer
  ticker={ticker}
  finalScore={companyData.cogriScore}
  defaultCollapsed={false}
/>
```

The `channelBreakdown` prop is NOT passed to `VerificationDrawer`, even though the component supports it. This means the "Evidence Tiers" tab in the drawer is never shown (it only renders when `channelBreakdown` is provided). The GAP 5 FIX in `VerificationDrawer.tsx` is implemented but never activated.

### 2.3 Recommended Changes

**Recommendation 6 (High Priority): Pass `channelBreakdown` to `VerificationDrawer` in `CompanyMode.tsx`**

The `calculationResult` from `calculateCOGRIScore()` contains `channelBreakdown`. This should be passed to `VerificationDrawer`:

```tsx
<VerificationDrawer
  ticker={ticker}
  finalScore={companyData.cogriScore}
  defaultCollapsed={false}
  channelBreakdown={calculationResult?.channelBreakdown}
/>
```

This activates the already-implemented Evidence Tiers tab with zero additional code.

**Recommendation 7 (High Priority): Add `TierBadge` to `RiskAttribution.tsx` per-country rows**

Each country row in the risk attribution table should show a `TierBadge` next to the country name. The `CountryExposure.dataSource` field already carries the tier information. Example:

```tsx
<TableCell>
  {country.country}
  <TierBadge tier={country.dataSource} />
</TableCell>
```

The `TierBadge` component already exists in `VerificationDrawer.tsx` and should be extracted to a shared component (e.g., `src/components/common/TierBadge.tsx`).

**Recommendation 8 (Medium Priority): Add tier-based color coding to `RiskContributionMap.tsx`**

The world map should use a secondary visual indicator (e.g., border style or opacity) to distinguish DIRECT vs ALLOCATED vs MODELED countries:
- DIRECT: solid border, full opacity
- ALLOCATED: dashed border, 85% opacity
- MODELED: dotted border, 70% opacity

This gives users an immediate visual sense of data quality without requiring them to navigate to the verification drawer.

**Recommendation 9 (Medium Priority): Consolidate `dataSource` to three values**

Remove `FALLBACK` from `CountryExposure.dataSource` and use `MODELED` for all prior-based estimates. The `fallbackType` field (SSF/RF/GF/none) already provides the sub-category distinction. This eliminates the inconsistency between V5 tier (3 values) and `CountryExposure.dataSource` (4 values).

**Recommendation 10 (Medium Priority): Add per-channel tier breakdown to `ExposurePathways.tsx`**

The `ExposurePathways` component shows channel weights (Revenue/Supply/Assets/Financial) for each country. It should also show the tier for each channel:

```
China:
  Revenue: 16.9% [DIRECT]
  Supply:  45.0% [MODELED - GF]
  Assets:  12.0% [ALLOCATED - SSF]
  Financial: 8.0% [MODELED - GF]
```

This gives users the full picture of data quality per channel per country.

**Recommendation 11 (Low Priority): Add confidence interval to `CompanySummaryPanel.tsx`**

The CO-GRI score is currently a point estimate. A confidence interval based on the mix of DIRECT/ALLOCATED/MODELED data would be more informative. Example calculation:

```typescript
const confidenceRange = computeScoreConfidence(countryExposures);
// Returns: { low: 34.2, mid: 38.5, high: 42.8 }
// Based on: % of weight that is DIRECT vs MODELED
```

This addresses the audit report's Recommendation R6.

**Recommendation 12 (Low Priority): Extract `TierBadge` to a shared component**

Currently `TierBadge` is defined inside `VerificationDrawer.tsx`. It should be moved to `src/components/common/TierBadge.tsx` so it can be reused in `RiskAttribution.tsx`, `ExposurePathways.tsx`, and `RiskContributionMap.tsx`.

---

## Part 3: Cross-Cutting Issues

### 3.1 The `v5ChannelToMain()` Bridge Is a Type Safety Gap

The bridge function in `structuredDataIntegrator.ts` converts V5 output to the legacy shape. The legacy `IntegratedChannelData` interface does not include `tier`, so the tier information is added dynamically without TypeScript enforcement. This means:
- TypeScript will not catch code that reads `channelData.tier` on a legacy-typed object
- The tier field may be undefined in some code paths

**Fix:** Add `tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED'` to the legacy `IntegratedChannelData` interface.

### 3.2 `cogriCalculationService.ts` Uses `bestStatus` But Not `tier`

The `calculateCOGRIScore()` function derives `dataSource` from `bestStatus` (the best channel status across all four channels). It does NOT use the V5 `tier` field directly. This means:
- If V5 integrators produce `tier: 'DIRECT'` but the legacy bridge doesn't propagate it correctly, the `dataSource` in `CountryExposure` may not reflect the actual tier.

**Fix:** In `cogriCalculationService.ts`, prefer the V5 `tier` field over the legacy `status` field when deriving `dataSource`.

### 3.3 The `channelBreakdown` in `calculationResult` May Not Carry Tier Info

`CompanyMode.tsx` passes `geoData.channelBreakdown` to `calculateCOGRIScore()`. The `channelBreakdown` comes from `geographicExposureService.ts`'s `calculateIndependentChannelExposuresWithSEC()`. This function produces `IntegratedChannelData` objects (legacy type). If the `tier` field is not present in these objects (because the legacy type doesn't define it), the `VerificationDrawer`'s Evidence Tiers tab will show no tiers even when `channelBreakdown` is passed.

**Fix:** Ensure `calculateIndependentChannelExposuresWithSEC()` in `geographicExposureService.ts` propagates the V5 `tier` field through the legacy bridge.

---

## Summary of All Recommendations

| # | Priority | Area | Recommendation | Effort |
|---|----------|------|----------------|--------|
| R1 | High | Residual | Extend GAP 4 FIX residual constraint to supply, assets, and financial channels in V5 integrators | Medium |
| R2 | Medium | Residual | Replace `ALL_KNOWN_COUNTRIES` (55) with `COUNTRY_GDP_2023` keys (~80) for broader residual coverage | Low |
| R3 | Medium | Residual | Update `narrativeParser.ts` to use V5 residual constraint instead of legacy GF 85/15 split | Medium |
| R4 | Low | Residual | Remove or make private the deprecated legacy channel integrators to prevent accidental use | Low |
| R5 | Low | Residual | Document `RESIDUAL_SENTINEL` pattern with JSDoc explaining residual constraint semantics | Low |
| R6 | High | Transparency | Pass `channelBreakdown` to `VerificationDrawer` in `CompanyMode.tsx` to activate Evidence Tiers tab | Low |
| R7 | High | Transparency | Add `TierBadge` to each country row in `RiskAttribution.tsx` | Low |
| R8 | Medium | Transparency | Add tier-based visual coding (border/opacity) to `RiskContributionMap.tsx` | Medium |
| R9 | Medium | Transparency | Consolidate `CountryExposure.dataSource` to 3 values (remove `FALLBACK`, use `MODELED`) | Low |
| R10 | Medium | Transparency | Add per-channel tier breakdown to `ExposurePathways.tsx` | Medium |
| R11 | Low | Transparency | Add CO-GRI score confidence interval to `CompanySummaryPanel.tsx` | High |
| R12 | Low | Transparency | Extract `TierBadge` to `src/components/common/TierBadge.tsx` shared component | Low |
| R13 | Medium | Cross-cutting | Add `tier?` field to legacy `IntegratedChannelData` interface for type safety | Low |
| R14 | Medium | Cross-cutting | Use V5 `tier` field (not legacy `status`) in `cogriCalculationService.ts` for `dataSource` | Medium |
| R15 | Medium | Cross-cutting | Ensure `calculateIndependentChannelExposuresWithSEC()` propagates V5 `tier` through legacy bridge | Medium |

---

## Appendix: Key Code Locations

| Topic | File | Lines |
|-------|------|-------|
| Residual sentinel definition | structuredDataIntegratorV5.ts | 42 |
| GAP 4 FIX (revenue channel) | structuredDataIntegratorV5.ts | 379–408 |
| `getRegionMembersFromName()` | structuredDataIntegratorV5.ts | 125–195 |
| `ALL_KNOWN_COUNTRIES` list | structuredDataIntegratorV5.ts | 47–57 |
| Legacy GF 85/15 split | fallbackLogic.ts | 314–350 |
| `GLOBAL_FALLBACK_KEYWORDS` | fallbackLogic.ts | 152–167 |
| V5 tier type definition | structuredDataIntegratorV5.ts | 66–83 |
| `determineTier()` helper | structuredDataIntegratorV5.ts | 97–111 |
| `CountryExposure.dataSource` | types/company.ts | 47 |
| `TierBadge` component | components/company/VerificationDrawer.tsx | 48–77 |
| Evidence Tier Summary Bar | pages/modes/CompanyMode.tsx | 326–370 |
| `channelBreakdown` not passed | pages/modes/CompanyMode.tsx | 482–488 |
| `v5ChannelToMain()` bridge | structuredDataIntegrator.ts | 86–115 |
| Supply channel V5 (no GAP 4) | structuredDataIntegratorV5.ts | 516–683 |
| Assets channel V5 (no GAP 4) | structuredDataIntegratorV5.ts | 689–905 |
| Financial channel V5 (no GAP 4) | structuredDataIntegratorV5.ts | 956–1090 |