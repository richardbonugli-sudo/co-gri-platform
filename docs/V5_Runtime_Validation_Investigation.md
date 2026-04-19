# V5 Methodology Runtime Validation Investigation Report

**Prepared by:** David (Data Analyst, Atoms Team)  
**Date:** 2026-04-02  
**Scope:** CO-GRI Trading Signal Service Dashboard — V5 Methodology Issues  
**Status:** Analysis Only — No Code Changes Made  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Source Files Investigated](#2-source-files-investigated)
3. [The V5 Execution Pipeline — Architecture Overview](#3-the-v5-execution-pipeline--architecture-overview)
4. [Per-Company Execution Path Analysis](#4-per-company-execution-path-analysis)
   - 4.1 [Apple (AAPL)](#41-apple-aapl)
   - 4.2 [Tesla (TSLA)](#42-tesla-tsla)
   - 4.3 [Meta (META)](#43-meta-meta)
   - 4.4 [Generic Ticker (e.g., NVDA)](#44-generic-ticker-eg-nvda)
5. [Issue-by-Issue Findings](#5-issue-by-issue-findings)
   - Issue 1: [Apple — Static Table → Channel Outputs Too Similar](#issue-1-apple--static-table--channel-outputs-too-similar)
   - Issue 2: [Tesla — Same Cross-Channel Duplication](#issue-2-tesla--same-cross-channel-duplication)
   - Issue 3: [Tesla — Exposure Pathways vs Top Risk Contributors Inconsistency](#issue-3-tesla--exposure-pathways-vs-top-risk-contributors-inconsistency)
   - Issue 4: [Meta — Top Risk Contributors Panel Does Not Render](#issue-4-meta--top-risk-contributors-panel-does-not-render)
   - Issue 5: [Cross-Component Data Source Divergence](#issue-5-cross-component-data-source-divergence)
   - Issue 6: [V5 Methodology Not Working End-to-End](#issue-6-v5-methodology-not-working-end-to-end)
6. [Code-Level Evidence Summary](#6-code-level-evidence-summary)
7. [Assessment: Value of a Short Runtime Validation Report](#7-assessment-value-of-a-short-runtime-validation-report)
8. [Recommendations](#8-recommendations)

---

## 1. Executive Summary

The investigation examined the full V5 methodology execution pipeline across six reported issues. The core findings are:

| # | Issue | Root Cause | Severity |
|---|-------|-----------|----------|
| 1 | Apple channel outputs too similar | `buildIndependentChannelBreakdown()` uses per-channel percentages from static table, but the live EDGAR pipeline (`fetchLiveOrFallback`) is called first and, when it returns data, **replaces** the static table entirely — losing the channel-specific differentiation | High |
| 2 | Tesla same duplication | Same root cause as Issue 1; TSLA is also in `COMPANY_SPECIFIC_EXPOSURES` and follows the identical code path | High |
| 3 | Tesla Exposure Pathways vs Top Risk Contributors inconsistency | `ExposurePathways` re-derives channel data from `countryExposures` via `generateChannelExposures()` (a utility that re-aggregates blended weights), while `TopRelevantRisks` uses `structuralDrivers` derived from `getTopStructuralDrivers()` — two different aggregation functions reading the same `countryExposures` but producing different ranked outputs | Medium |
| 4 | Meta Top Risk Contributors does not render | META has no entry in `COMPANY_SPECIFIC_EXPOSURES`; it falls through to the SEC integration path, which depends on live EDGAR API calls. If those calls fail or return empty data, the V5 GF template fallback is used — but the `structuralDrivers` derivation in `CompanyMode` can return an empty or malformed array when the GF fallback produces many near-zero-weight countries | High |
| 5 | Cross-component data source divergence | `ExposurePathways` (C4) and `TopRelevantRisks` (C5) receive different derived objects from `CompanyMode.tsx` — `channelExposures` vs `structuralDrivers` — computed by two separate utility functions that are not guaranteed to be consistent | Medium |
| 6 | V5 not working end-to-end | The live EDGAR pipeline (`liveEdgarPipeline.ts`) is the primary path for all company-specific tickers, but `fetchSECFilingText()` and `integrateStructuredData()` are dependent on live network calls to SEC EDGAR. When these fail (rate limits, empty responses, parsing failures), the fallback chain is: static snapshot → V5 GF template. The V5 GF template path works correctly in isolation, but the transition between paths is not transparent to the UI | High |

---

## 2. Source Files Investigated

| File | Path | Role |
|------|------|------|
| `Review of New Dashboard methodology.docx` | `/workspace/uploads/` | User-provided issue specification |
| `companySpecificExposures.ts` | `src/data/` | Static per-channel exposure table (AAPL, TSLA, MSFT) |
| `geographicExposureService.ts` | `src/services/` | Main orchestrator: company-specific → live EDGAR → SEC integration → V5 GF fallback |
| `cogriCalculationService.ts` | `src/services/` | CO-GRI score calculation: blending, normalization, CSI, political alignment |
| `fallbackLogic.ts` | `src/services/` | Three-tier fallback system (SSF → RF → GF) |
| `structuredDataIntegrator.ts` | `src/services/` | Integrates SEC filing structured data into four-channel format |
| `liveEdgarPipeline.ts` | `src/services/v5/` | Live SEC EDGAR fetch with in-memory cache and graceful fallback |
| `companySpecificChannelFix.ts` | `src/services/v5/` | `buildIndependentChannelBreakdown()` — V5 Step 1.1 fix |
| `channelPriors.ts` | `src/services/v5/` | `buildGlobalFallbackV5()`, `allocateWithPrior()` — V5 GF formula |
| `channelBuilder.ts` | `src/services/v5/` | Channel builder utilities |
| `structuredDataIntegratorV5.ts` | `src/services/v5/` | V5-specific structured data integration types |
| `index.ts` | `src/services/v5/` | Public API exports for V5 services |
| `CompanyMode.tsx` | `src/pages/modes/` | Main page: orchestrates data loading, calculation, and component rendering |
| `ExposurePathways.tsx` | `src/components/company/` | C4: Channel breakdown panel |
| `cogriCalculationService.ts` | `src/services/` | Shared calculation logic |

---

## 3. The V5 Execution Pipeline — Architecture Overview

The complete execution pipeline for a company analysis request follows this sequence:

```
CompanyMode.tsx (useEffect on ticker change)
  │
  ├─► getCompanyGeographicExposure(ticker)          [geographicExposureService.ts]
  │     │
  │     ├─ resolveTickerMultiSource(ticker)          [Polygon + SEC EDGAR + Alpha Vantage]
  │     ├─ sectorClassificationService.classifySector()
  │     │
  │     └─► calculateIndependentChannelExposuresWithSEC(ticker, name, sector, country, isADR)
  │           │
  │           ├─ getCompanySpecificExposure(ticker)   [companySpecificExposures.ts]
  │           │
  │           ├─ [IF company-specific found]
  │           │     │
  │           │     ├─► fetchLiveOrFallback(ticker, homeCountry, sector)  [liveEdgarPipeline.ts]
  │           │     │     ├─ [LEGACY_STATIC_OVERRIDE=false] → tries live EDGAR
  │           │     │     │     ├─ fetchSECFilingText(ticker)
  │           │     │     │     ├─ parseNarrativeText(text)
  │           │     │     │     └─ integrateStructuredData(ticker, homeCountry, sector)
  │           │     │     └─ [on failure] → returns static-snapshot-fallback
  │           │     │
  │           │     ├─ [IF liveDataAvailable=true]
  │           │     │     └─► Build channelBreakdown from live SEC integration data
  │           │     │           (loses per-channel static table differentiation)
  │           │     │
  │           │     └─ [IF liveDataAvailable=false]
  │           │           ├─► buildIndependentChannelBreakdown(companySpecific, coefficients)
  │           │           │     (uses revenuePercentage, supplyPercentage, etc. per country)
  │           │           └─► upgradeChannelBreakdownWithSEC() [Fix 4.A]
  │           │
  │           └─ [IF no company-specific data]
  │                 ├─► integrateStructuredData(ticker, homeCountry, sector)
  │                 └─ [IF no SEC data] → buildGlobalFallbackV5() per channel
  │
  ├─► calculateCOGRIScore(input)                    [cogriCalculationService.ts]
  │     ├─ Four-channel blending per country
  │     ├─ Normalization
  │     ├─ CSI × political alignment
  │     └─ Sector multiplier
  │
  └─► CompanyMode renders:
        ├─ countryExposures → RiskContributionMap (C3)
        ├─ countryExposures → COGRITrendChart (C2)
        ├─ channelExposures [generateChannelExposures()] → ExposurePathways (C4)
        ├─ structuralDrivers [getTopStructuralDrivers()] → TopRelevantRisks (C5)
        ├─ attributions [calculateCountryAttribution()] → RiskAttribution (C7)
        └─ peers [generatePeerCompanies()] → PeerComparison (C6)
```

**Critical observation:** `channelExposures` and `structuralDrivers` are computed by **different utility functions** from the same `countryExposures` array. They are not derived from the same intermediate object.

---

## 4. Per-Company Execution Path Analysis

### 4.1 Apple (AAPL)

**Data availability:** AAPL has a full entry in `COMPANY_SPECIFIC_EXPOSURES` (16 countries, Schema V2, per-channel percentages for revenue/supply/assets/financial).

**Active execution path at runtime:**

```
getCompanySpecificExposure('AAPL') → CompanyExposure object found
  ↓
LEGACY_STATIC_OVERRIDE = false
  ↓
fetchLiveOrFallback('AAPL', 'United States', 'Technology')
  ↓
  [Cache miss on first load]
  ↓
  fetchSECFilingText('AAPL')
    ↓
    [SUCCESS] → filing text fetched
    ↓
    parseNarrativeText(text)
    ↓
    integrateStructuredData('AAPL', 'United States', 'Technology')
      ↓
      [Returns IntegratedExposureData with revenueChannel, supplyChannel, etc.]
      ↓
      hasUsableData = true
      ↓
      liveDataAvailable = true
        ↓
        Build channelBreakdown from liveSecIntegration
        (ALL FOUR CHANNELS derived from SEC integration output)
        ↓
        Return { channelBreakdown, blendedWeights, secIntegration, usedCompanySpecific: true }

  [OR if EDGAR fails]
    ↓
    liveDataAvailable = false
    ↓
    buildIndependentChannelBreakdown(companySpecific, coefficients)
      (Uses revenuePercentage, supplyPercentage, assetsPercentage, financialPercentage per country)
      ↓
      upgradeChannelBreakdownWithSEC() [Fix 4.A]
```

**Channel-level country weights feeding ExposurePathways:**

When live EDGAR succeeds: weights come from `integrateStructuredData()` output — the four channels are populated by SEC filing parsing, not the static per-channel percentages in `companySpecificExposures.ts`.

When live EDGAR fails: weights come from `buildIndependentChannelBreakdown()` which correctly reads `revenuePercentage`, `supplyPercentage`, `assetsPercentage`, `financialPercentage` from the static table.

**Key finding for Issue 1:** The static table has well-differentiated per-channel values (e.g., China: revenue=16.9%, supply=35.0%, assets=12.0%, financial=3.0%). When `buildIndependentChannelBreakdown()` is used (EDGAR fallback path), these produce genuinely different channel profiles. However, when the live EDGAR path succeeds, `integrateStructuredData()` may return channel data where the four channels are less differentiated (because SEC filings typically only disclose revenue geography explicitly; supply, assets, and financial are inferred). This is the root cause of Issue 1 — the live path can produce more homogeneous channel outputs than the static table.

**Outputs feeding Top Risk Contributors:**

`structuralDrivers` = `getTopStructuralDrivers(countryExposures, 2)` — this reads from the final normalized `countryExposures` array, not from the channel breakdown directly. It aggregates by country contribution score.

---

### 4.2 Tesla (TSLA)

**Data availability:** TSLA has a full entry in `COMPANY_SPECIFIC_EXPOSURES` (11 countries, Schema V2, per-channel percentages).

**Active execution path at runtime:**

Identical to AAPL. TSLA follows the same company-specific branch:
1. `getCompanySpecificExposure('TSLA')` → found
2. `fetchLiveOrFallback('TSLA', 'United States', 'Consumer Discretionary')` → attempts live EDGAR
3. If live succeeds → `integrateStructuredData()` output drives all four channels
4. If live fails → `buildIndependentChannelBreakdown()` uses static per-channel values

**Static table differentiation for TSLA:**
- United States: revenue=45.6%, supply=35.0%, assets=55.0%, financial=75.0%
- China: revenue=22.3%, supply=30.0%, assets=25.0%, financial=10.0%
- Germany: revenue=8.7%, supply=15.0%, assets=12.0%, financial=8.0%

These are highly differentiated. The supply channel (Gigafactory-weighted) and assets channel (PP&E-weighted) should produce very different country rankings than the revenue channel.

**Key finding for Issue 2:** Same root cause as Issue 1. When the live EDGAR pipeline returns data, the four channels are rebuilt from SEC integration output, which may not capture the Gigafactory supply chain differentiation that is explicitly encoded in the static table.

**Sector coefficient difference:** TSLA uses `Consumer Discretionary` sector. The `SECTOR_EXPOSURE_COEFFICIENTS` map in `geographicExposureService.ts` does not have a `Consumer Discretionary` entry, so it falls back to `DEFAULT_EXPOSURE_COEFFICIENTS` (revenue=0.40, supply=0.35, assets=0.15, financial=0.10). This is correct behavior but means TSLA does not get sector-specific coefficient tuning.

---

### 4.3 Meta (META)

**Data availability:** META has **no entry** in `COMPANY_SPECIFIC_EXPOSURES`. Only AAPL, TSLA, and MSFT are manually curated.

**Active execution path at runtime:**

```
getCompanySpecificExposure('META') → null (not found)
  ↓
[Falls through to PRIORITY 2: SEC filing integration]
  ↓
resolveTickerMultiSource('META')
  → Polygon.io + SEC EDGAR + Alpha Vantage API calls
  → Returns company info (name, sector, country, CIK)
  ↓
sectorClassificationService.classifySector('META', 'Meta Platforms', ...)
  ↓
integrateStructuredData('META', 'United States', 'Technology')
  ↓
  [Calls parseSECFiling → SEC EDGAR XBRL/HTML parsing]
  ↓
  [IF returns data] → hasAnySECData = true
    → Build channelBreakdown from SEC integration
  [IF returns empty] → hasAnySECData = false
    → buildGlobalFallbackV5() for all four channels (LAST RESORT)
      → V5 GF formula: p_c = λ·HomeBias(c) + (1-λ)·GlobalPrior_channel_sector(c)
      → Produces ~40-60 countries with small weights
```

**Key finding for Issue 4:** When the SEC integration returns empty data (network failure, EDGAR rate limit, or parsing failure for META's specific filing format), the V5 GF template fallback distributes exposure across ~40-60 countries. The `getTopStructuralDrivers()` function then receives a `countryExposures` array with many near-equal small weights. If this function has a minimum threshold or expects a certain distribution shape, it may return an empty or near-empty `structuralDrivers` array, causing `TopRelevantRisks` to render nothing.

Additionally, `resolveTickerMultiSource()` for META requires three simultaneous API calls. If any of these fail or return unexpected data, the `finalSector` resolution may default to `'Technology'` even though Meta is typically classified as `Communication Services` — this affects which sector coefficients are applied.

**Channel-level weights feeding ExposurePathways for META:**

When SEC integration works: Revenue channel populated from 10-K geographic revenue segments (US, Europe, Rest of World). Supply channel likely falls back to GF (Meta has minimal physical supply chain). Assets and Financial channels from PP&E and debt tables.

When SEC integration fails: All four channels from `buildGlobalFallbackV5()` with different λ values:
- Revenue: λ=0.25 (moderate home bias)
- Supply: λ=0.10 (low home bias — supply is globally distributed)
- Assets: λ=0.35 (higher home bias — assets concentrated at home)
- Financial: λ=0.30 (moderate-high home bias — USD-denominated debt)

---

### 4.4 Generic Ticker (e.g., NVDA)

**Data availability:** No entry in `COMPANY_SPECIFIC_EXPOSURES`.

**Active execution path at runtime:**

Same as META. The path is:
1. `getCompanySpecificExposure('NVDA')` → null
2. `resolveTickerMultiSource('NVDA')` → API resolution
3. `integrateStructuredData('NVDA', 'United States', 'Technology')`
4. If SEC data available → channel breakdown from SEC
5. If not → `buildGlobalFallbackV5()` for all four channels

**Key observation:** For any ticker not in the three manually curated entries, the quality of the output is entirely dependent on:
- Whether `resolveTickerMultiSource()` successfully identifies the company
- Whether `integrateStructuredData()` can parse the SEC filing
- Whether the SEC EDGAR API is responsive

This creates a two-tier quality gap: AAPL/TSLA/MSFT get curated static data as a reliable fallback; all other tickers have no such safety net.

---

## 5. Issue-by-Issue Findings

### Issue 1: Apple — Static Table → Channel Outputs Too Similar

**Reported symptom:** Apple relies on a static company-specific table with one blended % per country, causing channel outputs to be too similar across channels.

**Investigation finding:**

This is a partially accurate description, but the actual mechanism is more nuanced:

1. **The static table is NOT the problem in isolation.** `companySpecificExposures.ts` (lines 124–309) stores genuinely differentiated per-channel values for AAPL. For example:
   - China: revenue=16.9%, supply=35.0%, assets=12.0%, financial=3.0%
   - Vietnam: revenue=0.3%, supply=12.0%, assets=1.5%, financial=0.0%
   - Ireland: revenue=0.8%, supply=0.2%, assets=8.0%, financial=12.0%

2. **The `buildIndependentChannelBreakdown()` function** (`companySpecificChannelFix.ts`) correctly reads these per-channel fields and builds independent channel distributions. This was the V5 Step 1.1 fix.

3. **The live EDGAR pipeline overrides the static table.** In `geographicExposureService.ts` lines 363–449, when `fetchLiveOrFallback()` returns `liveDataAvailable=true`, the code builds `channelBreakdown` entirely from `liveSecIntegration` (the SEC integration output). The static table's per-channel values are **completely bypassed**.

4. **The SEC integration output may produce less-differentiated channels.** `integrateStructuredData()` parses SEC filings where:
   - Revenue geography is typically well-disclosed (10-K geographic segment table)
   - Supply chain geography is rarely disclosed in structured form → falls back to GF/SSF
   - PP&E geography is sometimes disclosed but often aggregated
   - Financial geography is rarely disclosed at country level

   Result: Revenue channel has DIRECT evidence; Supply/Assets/Financial channels likely have MODELED/FALLBACK evidence from the same GF formula → all three non-revenue channels produce similar distributions → channels appear homogeneous.

**Code-level evidence:**
- `geographicExposureService.ts` lines 366–449: Live pipeline path that bypasses static table
- `geographicExposureService.ts` lines 451–503: Static fallback path that uses `buildIndependentChannelBreakdown()`
- `liveEdgarPipeline.ts` lines 151–296: `fetchLiveOrFallback()` — returns `liveDataAvailable=true` when SEC integration succeeds
- `companySpecificExposures.ts` lines 124–309: AAPL static table with differentiated per-channel values

**Root cause:** The live EDGAR pipeline, when successful, replaces the static table entirely rather than merging with it. The `upgradeChannelBreakdownWithSEC()` function (Fix 4.A) only runs on the static fallback path (lines 472–484), not on the live path.

---

### Issue 2: Tesla — Same Cross-Channel Duplication

**Reported symptom:** Tesla shows the same cross-channel duplication problem as Apple.

**Investigation finding:**

Confirmed. TSLA follows the identical code path as AAPL (both are in `COMPANY_SPECIFIC_EXPOSURES`). The same mechanism applies:

- When live EDGAR succeeds: all four channels rebuilt from SEC integration → potential homogeneity
- When live EDGAR fails: `buildIndependentChannelBreakdown()` uses differentiated static values

**Additional factor for TSLA:** Tesla's supply chain differentiation (Gigafactory footprint) is particularly significant. The static table has:
- Germany supply=15.0% (Berlin Gigafactory) vs revenue=8.7%
- Japan supply=8.0% (Panasonic cells) vs revenue=1.9%
- South Korea supply=7.0% (LG/Samsung cells) vs revenue=1.2%

These supply-chain-heavy countries would be significantly underweighted if the live EDGAR path produces a supply channel that defaults to GF distribution (which would weight by GDP/manufacturing prior rather than Gigafactory location).

**Code-level evidence:** Same files as Issue 1. The TSLA entry in `companySpecificExposures.ts` lines 330–460 shows the differentiated values that are bypassed by the live path.

---

### Issue 3: Tesla — Exposure Pathways vs Top Risk Contributors Inconsistency

**Reported symptom:** Tesla's Exposure Pathways and Top Risk Contributors panels are inconsistent with each other.

**Investigation finding:**

The two panels receive **different derived objects** from `CompanyMode.tsx`:

**ExposurePathways (C4)** receives:
```typescript
channelExposures={companyData.channelExposures}
```
Where `channelExposures` = `generateChannelExposures(calculationResult.countryExposures, calculationResult.finalScore)`

**TopRelevantRisks (C5)** receives:
```typescript
risks={companyData.structuralDrivers}
```
Where `structuralDrivers` = `getTopStructuralDrivers(calculationResult.countryExposures, 2)`

These are two **separate utility functions** operating on the same `countryExposures` input:

1. `generateChannelExposures()` (`channelCalculations.ts`): Aggregates country-level channel weights across all countries to produce a per-channel summary (Revenue channel total risk, Supply channel total risk, etc.). It re-reads `channelWeights.revenue`, `channelWeights.supply`, etc. from each `CountryExposure` object.

2. `getTopStructuralDrivers()` (`riskRelevance.ts`): Ranks countries by their `contribution` score and returns the top N structural risk drivers.

**The inconsistency arises because:**

- `ExposurePathways` shows channel-level aggregated risk (e.g., "Supply Chain channel: 35% weight, top countries: China 35%, Germany 15%, Japan 8%")
- `TopRelevantRisks` shows country-level contribution ranking (e.g., "China: highest contribution, driven by CSI × alignment × blended weight")

These are measuring different things. However, if the channel weights in `countryExposures[i].channelWeights` are not properly populated (e.g., when the live EDGAR path produces homogeneous channels), then `generateChannelExposures()` will show similar risk scores across all four channels, while `getTopStructuralDrivers()` may still correctly identify the highest-contribution countries.

**Additional inconsistency vector:** `ExposurePathways` also accepts an optional `channelExposures` prop that, if not provided, calls `generateChannelExposures()` internally (line 59). In `CompanyMode.tsx`, the prop IS provided (pre-computed in `companyData`). But the pre-computation uses `calculationResult.countryExposures` which may have `channelWeights` populated differently depending on whether the live or static path was used.

**Code-level evidence:**
- `CompanyMode.tsx` lines 232–238: `channelExposures` and `structuralDrivers` computed separately
- `ExposurePathways.tsx` lines 55–59: Uses provided `channelExposures` or re-derives internally
- `cogriCalculationService.ts` lines 281–288: `channelWeights` populated from `channelData` fields

---

### Issue 4: Meta — Top Risk Contributors Panel Does Not Render

**Reported symptom:** Meta's Top Risk Contributors panel does not render properly.

**Investigation finding:**

META has no entry in `COMPANY_SPECIFIC_EXPOSURES`. The execution path for META is:

1. SEC integration via `integrateStructuredData('META', 'United States', 'Technology')`
2. If SEC integration fails → V5 GF template fallback via `buildGlobalFallbackV5()`

**Rendering failure mechanism:**

When the V5 GF fallback is used for META, it produces a `channelBreakdown` with ~40-60 countries, each with small weights (e.g., United States ~25-30%, China ~15-18%, then many countries at 1-5%).

The `calculateCOGRIScore()` function processes all these countries and produces a `countryExposures` array with many entries.

`getTopStructuralDrivers(countryExposures, 2)` is called with `topN=2` (as seen in `CompanyMode.tsx` line 237). If this function:
- Returns only 2 items → `TopRelevantRisks` renders only 2 risks (may appear sparse/broken)
- Returns items with very low contribution scores → the panel may render but show near-zero values
- Has a minimum threshold that filters out GF-fallback entries → may return empty array

**Additional rendering issue:** `TopRelevantRisks` receives `risks={companyData.structuralDrivers}` where `structuralDrivers` is typed as the output of `getTopStructuralDrivers()`. If this function returns an unexpected shape for GF-fallback data (e.g., missing `country`, `contribution`, or `riskType` fields), the component may throw a render error caught by `ErrorBoundary`, displaying the error fallback UI instead of the actual panel.

**Sector misclassification risk:** Meta is typically `Communication Services` but the API may return `Technology`. The `SECTOR_EXPOSURE_COEFFICIENTS` map has no `Communication Services` entry, so it falls back to `DEFAULT_EXPOSURE_COEFFICIENTS`. This is not a rendering failure but affects score accuracy.

**Code-level evidence:**
- `companySpecificExposures.ts`: No META entry (only AAPL, TSLA, MSFT)
- `geographicExposureService.ts` lines 506–743: Non-company-specific path (SEC → GF)
- `CompanyMode.tsx` lines 237: `getTopStructuralDrivers(calculationResult.countryExposures, 2)`
- `CompanyMode.tsx` lines 401–406: `TopRelevantRisks` wrapped in `ErrorBoundary`

---

### Issue 5: Cross-Component Data Source Divergence

**Reported symptom:** Mismatch between Exposure Pathways and Top Risk Contributors suggests inconsistent underlying logic or data sources across components.

**Investigation finding:**

This is confirmed as a **structural design issue** rather than a bug in any single function. The divergence has two layers:

**Layer 1: Different derived objects**

`CompanyMode.tsx` (lines 209–240) computes `companyData` via `useMemo`, which includes:

```typescript
channelExposures: generateChannelExposures(
  calculationResult.countryExposures,
  calculationResult.finalScore
),
structuralDrivers: getTopStructuralDrivers(calculationResult.countryExposures, 2),
attributions: calculateCountryAttribution(calculationResult.countryExposures),
```

All three are derived from `calculationResult.countryExposures`, but by three different utility functions. There is no guarantee these functions produce internally consistent outputs.

**Layer 2: Channel weight propagation**

`cogriCalculationService.ts` lines 281–288 populates `channelWeights` in each `CountryExposure`:

```typescript
channelWeights: {
  revenue: channelData.revenue?.weight || 0,
  financial: financialWeight,
  supply: channelData.supply?.weight || 0,
  assets: channelData.assets?.weight || 0,
  market: 0
}
```

These weights are the **pre-normalization** channel weights from the channel breakdown. `generateChannelExposures()` reads these to compute per-channel risk scores. However, `getTopStructuralDrivers()` uses the `contribution` field (which is based on the **blended** normalized weight × CSI × alignment), not the individual channel weights.

**Result:** `ExposurePathways` shows which channels are most exposed (channel-centric view), while `TopRelevantRisks` shows which countries contribute most to total risk (country-centric view). These are legitimately different views, but when channels are homogeneous (Issue 1/2), the channel-centric view becomes less informative and appears inconsistent with the country-centric view.

**Code-level evidence:**
- `CompanyMode.tsx` lines 232–238: Three separate derivation calls
- `cogriCalculationService.ts` lines 281–288: `channelWeights` population
- `ExposurePathways.tsx` lines 55–59: Uses `channelExposures` (channel-centric)

---

### Issue 6: V5 Methodology Not Working End-to-End

**Reported symptom:** Overall V5 methodology not working end-to-end across companies.

**Investigation finding:**

The V5 methodology is architecturally sound but has several integration gaps that prevent reliable end-to-end operation:

**Gap 1: Live EDGAR pipeline dependency**

`liveEdgarPipeline.ts` (`LEGACY_STATIC_OVERRIDE = false`) means the live path is always attempted first for company-specific tickers. This path depends on:
- `fetchSECFilingText(ticker)` — live network call to SEC EDGAR
- `parseNarrativeText(text)` — text parsing
- `integrateStructuredData(ticker, homeCountry, sector)` — full SEC integration pipeline

Any failure in this chain triggers the static snapshot fallback. The fallback is silent from the UI's perspective — there is no indicator in the rendered dashboard showing whether live or static data was used.

**Gap 2: Static table bypassed when live succeeds**

As detailed in Issues 1 and 2, when the live pipeline succeeds, the carefully curated per-channel static data is completely bypassed. The `upgradeChannelBreakdownWithSEC()` function (Fix 4.A) only runs on the static fallback path, not the live path.

**Gap 3: No company-specific data for most tickers**

Only 3 tickers (AAPL, TSLA, MSFT) have curated static data. All other tickers (META, NVDA, AMZN, etc.) rely entirely on live SEC integration. When this fails, they fall through to the V5 GF template, which produces plausible but unverified distributions.

**Gap 4: Sector coefficient coverage**

`SECTOR_EXPOSURE_COEFFICIENTS` in `geographicExposureService.ts` (lines 155–164) covers: Technology, Manufacturing, Financial Services, Energy, Healthcare, Consumer Goods, Telecommunications, Retail. Missing sectors include: Communication Services, Consumer Discretionary, Utilities, Real Estate, Materials, Industrials. Companies in these sectors default to `DEFAULT_EXPOSURE_COEFFICIENTS`.

**Gap 5: Evidence tier propagation**

The V5 evidence tier system (DIRECT/ALLOCATED/MODELED/FALLBACK) is correctly implemented in `cogriCalculationService.ts` (P1-3 FIX, lines 255–269) and displayed in `CompanyMode.tsx` (lines 348–395). However, when the live pipeline produces channels with mixed tiers, the `bestTier` selection picks the highest available tier — which may be DIRECT for revenue but MODELED for supply/assets/financial. The UI shows one tier badge per country, potentially overstating data quality.

**Gap 6: 10-second timeout in CompanyMode**

`CompanyMode.tsx` lines 157–160 implements a 10-second timeout:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Data loading timeout')), 10000)
);
```
The live EDGAR pipeline (network fetch + parsing + integration) may exceed 10 seconds under normal conditions, causing the entire data load to fail with a timeout error and triggering the alert dialog rather than graceful degradation.

**Code-level evidence:**
- `liveEdgarPipeline.ts` line 40: `LEGACY_STATIC_OVERRIDE = false`
- `geographicExposureService.ts` lines 363–449: Live path bypasses static table
- `CompanyMode.tsx` lines 157–160: 10-second timeout
- `geographicExposureService.ts` lines 155–164: Incomplete sector coefficient map

---

## 6. Code-Level Evidence Summary

| Issue | File | Lines | Function/Symbol | Finding |
|-------|------|-------|-----------------|---------|
| 1, 2 | `liveEdgarPipeline.ts` | 40 | `LEGACY_STATIC_OVERRIDE` | Set to `false` → live path always attempted |
| 1, 2 | `geographicExposureService.ts` | 366–449 | Live path block | Builds `channelBreakdown` from SEC integration, bypassing static table |
| 1, 2 | `geographicExposureService.ts` | 451–503 | Static fallback block | Only path that uses `buildIndependentChannelBreakdown()` |
| 1, 2 | `geographicExposureService.ts` | 472–484 | `upgradeChannelBreakdownWithSEC()` | Only called on static fallback path, not live path |
| 1, 2 | `companySpecificExposures.ts` | 124–309, 330–460 | AAPL/TSLA entries | Differentiated per-channel values that are bypassed by live path |
| 3, 5 | `CompanyMode.tsx` | 232–238 | `companyData` useMemo | `channelExposures` and `structuralDrivers` computed by separate functions |
| 3, 5 | `cogriCalculationService.ts` | 281–288 | `channelWeights` | Pre-normalization channel weights stored in `CountryExposure` |
| 4 | `companySpecificExposures.ts` | 101 | `COMPANY_SPECIFIC_EXPOSURES` | Only AAPL, TSLA, MSFT — no META |
| 4 | `CompanyMode.tsx` | 237 | `getTopStructuralDrivers(..., 2)` | topN=2 may produce sparse output for GF fallback |
| 4 | `CompanyMode.tsx` | 401–406 | `ErrorBoundary` around `TopRelevantRisks` | Render errors silently replaced by error UI |
| 6 | `CompanyMode.tsx` | 157–160 | Timeout promise | 10-second timeout may be too short for live EDGAR pipeline |
| 6 | `geographicExposureService.ts` | 155–164 | `SECTOR_EXPOSURE_COEFFICIENTS` | Missing: Communication Services, Consumer Discretionary, etc. |
| 6 | `cogriCalculationService.ts` | 258–269 | `bestTier` selection | Picks highest tier across channels — may overstate data quality |

---

## 7. Assessment: Value of a Short Runtime Validation Report

**Recommendation: Yes — a short runtime validation report would be highly valuable.**

The current dashboard has no runtime transparency mechanism. Users cannot tell:
- Whether the displayed data came from live EDGAR, static snapshot, or GF fallback
- Whether the 10-second timeout was hit and data is incomplete
- Whether channel differentiation is real (per-channel evidence) or apparent (GF homogeneity)
- Whether the evidence tier badges accurately reflect the actual data quality

**Proposed contents for a runtime validation report:**

1. **Data Source Summary** (per ticker):
   - Which path was taken: `live-edgar` | `static-snapshot-fallback` | `static-snapshot-legacy` | `gf-fallback`
   - Whether the live pipeline cache was hit or a fresh fetch was made
   - Filing text length (chars) if live fetch succeeded

2. **Channel Evidence Quality Matrix** (per ticker, per channel):
   - Revenue channel: DIRECT/ALLOCATED/MODELED/FALLBACK, source description
   - Supply channel: same
   - Assets channel: same
   - Financial channel: same
   - Overall evidence tier distribution (% of exposure weight at each tier)

3. **Channel Differentiation Score**:
   - Measure of how different the four channel distributions are from each other
   - A score near 0 indicates near-identical channels (homogeneity problem)
   - A score near 1 indicates well-differentiated channels

4. **Fallback Audit**:
   - List of countries where GF fallback was applied
   - List of countries where SSF/RF was applied
   - Countries with DIRECT evidence

5. **Score Uncertainty Band**:
   - Already computed as `scoreUncertainty` in `cogriCalculationService.ts` (lines 370–383)
   - Should be prominently displayed in the UI

6. **Pipeline Timing**:
   - Time taken for live EDGAR fetch
   - Time taken for SEC integration
   - Whether timeout was approached

---

## 8. Recommendations

The following recommendations are analysis-only. No code changes have been made.

### R1: Merge Static Table with Live Pipeline (Issues 1, 2)

**Problem:** The live EDGAR path completely replaces the static table, losing per-channel differentiation.

**Recommendation:** When `liveDataAvailable=true`, apply the same `upgradeChannelBreakdownWithSEC()` logic but in reverse: use the static table as the base (via `buildIndependentChannelBreakdown()`), then upgrade MODELED entries with DIRECT/ALLOCATED evidence from the live pipeline. This would preserve the supply/assets/financial differentiation from the static table while incorporating any DIRECT revenue evidence from the live filing.

The current `upgradeChannelBreakdownWithSEC()` function (Fix 4.A) already implements the upgrade logic — it just needs to be called on the live path as well.

### R2: Add Channel Differentiation Validation (Issues 1, 2, 6)

**Problem:** No mechanism to detect when channels are homogeneous.

**Recommendation:** Add a post-computation check that measures the Jensen-Shannon divergence (or simpler: sum of squared differences) between the four channel distributions. If the divergence is below a threshold (e.g., all channels within 5% of each other for top-10 countries), log a warning and flag the result as `channelDifferentiationLow: true`. This flag could be used to show a UI warning.

### R3: Fix Meta Rendering (Issue 4)

**Problem:** `getTopStructuralDrivers(countryExposures, 2)` with `topN=2` produces sparse output for GF fallback companies.

**Recommendation:** Increase `topN` to 5 or make it dynamic based on the number of countries with contribution above a threshold. Also ensure `getTopStructuralDrivers()` handles the GF fallback case where many countries have near-equal small weights.

### R4: Add Missing Sector Coefficients (Issue 6)

**Problem:** `SECTOR_EXPOSURE_COEFFICIENTS` is missing Communication Services, Consumer Discretionary, and other common sectors.

**Recommendation:** Add entries for at minimum: Communication Services (similar to Technology), Consumer Discretionary (similar to Consumer Goods), Industrials, Materials, Utilities, Real Estate. This would prevent META, TSLA (Consumer Discretionary), and many other companies from silently defaulting to the generic coefficients.

### R5: Increase or Remove the 10-Second Timeout (Issue 6)

**Problem:** The 10-second timeout in `CompanyMode.tsx` may be too short for the live EDGAR pipeline.

**Recommendation:** Either increase the timeout to 30 seconds, or replace the hard timeout with a progressive loading state that shows partial results as they become available (e.g., show static snapshot data immediately, then upgrade with live data when it arrives).

### R6: Add Data Source Transparency to UI (Issues 1, 2, 3, 4, 5, 6)

**Problem:** Users cannot see whether data came from live EDGAR, static snapshot, or GF fallback.

**Recommendation:** Expose the `source` field from `LivePipelineResult` and the `secFilingIntegration` metadata (already computed in `geographicExposureService.ts` lines 1065–1076) in the `VerificationDrawer` (C9) and/or as a tooltip on the Evidence Tier Summary Bar. The data is already computed — it just needs to be surfaced.

### R7: Extend Company-Specific Coverage (Issue 4, 6)

**Problem:** Only 3 tickers have curated static data. All others depend on live API calls.

**Recommendation:** Add static entries for at minimum the top 20 most commonly analyzed tickers (META, NVDA, AMZN, GOOGL, TSMC, BABA, etc.). The Schema V2 format is well-designed and the data sources (10-K filings, sustainability reports) are publicly available. Even partial entries (revenue channel only, with supply/assets/financial marked as MODELED) would significantly improve reliability for these tickers.

### R8: Unify Channel Data Source for C4 and C5 (Issue 3, 5)

**Problem:** `ExposurePathways` and `TopRelevantRisks` derive their inputs from different utility functions.

**Recommendation:** Create a single `deriveCompanyAnalytics(countryExposures, finalScore)` function that computes `channelExposures`, `structuralDrivers`, and `attributions` in a single pass, ensuring internal consistency. This function would be the single source of truth for all derived analytics in `CompanyMode.tsx`.

---

*End of Report*

**Report generated:** 2026-04-02  
**Files analyzed:** 15 source files, ~3,500 lines of TypeScript  
**Issues covered:** 6 of 6 reported issues  
**Code changes made:** None (analysis only)