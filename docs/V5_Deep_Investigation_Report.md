# CO-GRI V5 Methodology — Deep Investigation Report (AAPL Example)

**Date:** 2026-03-30  
**Prepared by:** David (Data Analyst)  
**Scope:** Four targeted questions about the live execution path for Apple (AAPL)  
**Instruction:** Investigation only — no code changes made  

---

## Executive Summary

After reading all key files in the V5 implementation stack, the findings are:

1. **AAPL channel-weight identity bug**: ✅ **FIXED** — `buildIndependentChannelBreakdown()` now builds four distinct channel vectors per country. The old shared-object contamination is gone for company-specific tickers.
2. **SSF/RF/GF fallback as live weighting logic**: ⚠️ **PARTIALLY ACTIVE** — For AAPL specifically, the V5 company-specific path bypasses the old SSF/RF/GF weight formulas. However, the legacy `fallbackLogic.ts` weight-generating functions remain in the codebase and are still reached for non-company-specific tickers.
3. **SEC EDGAR / narrative / supply-chain simulation**: ✅ **SIMULATION REMOVED** — `generateSimulatedNarrativeText` has been deleted; `parseNarrativeText` returns empty on null/empty input; `fetchSECFilingText` calls the real EDGAR API. However, for AAPL the SEC path is bypassed entirely by the company-specific override.
4. **Dashboard output source**: ⚠️ **MIXED** — AAPL's dashboard is driven by the hardcoded `COMPANY_SPECIFIC_EXPOSURES` table (last updated 2025-12-14), not by live V5 SEC ingestion. The V5 integrators are wired in but only execute for tickers that lack a company-specific entry.

---

## Question 1 — Is Apple Still Running Through the Channel-Weight Identity Path?

### What the Bug Was

The original channel contamination bug caused all four channels (revenue, supply, assets, financial) to share the **same JavaScript object reference**:

```js
// BROKEN (old pattern):
channelBreakdown[country] = {
  revenue:   channelData,   // same object
  financial: channelData,   // same object
  supply:    channelData,   // same object
  assets:    channelData,   // same object
};
```

Any write to one channel would overwrite all others.

### Current State for AAPL

**File:** `src/services/geographicExposureService.ts`, lines 341–396

When `getCompanySpecificExposure('AAPL')` returns a non-null result (it does — AAPL is in `COMPANY_SPECIFIC_EXPOSURES`), the code takes this branch:

```ts
// geographicExposureService.ts line 356
const { channelBreakdown, blendedWeights } = buildIndependentChannelBreakdown(
  companySpecific,
  coefficients
);
```

**File:** `src/services/v5/companySpecificChannelFix.ts`, lines 57–199

`buildIndependentChannelBreakdown()` now calls four **separate** builder functions per country:

```ts
// companySpecificChannelFix.ts lines 108–117
const revData = buildRevenueChannelData(exposure, companySpecific, allCountries);
const supData = buildSupplyChannelData(exposure, companySpecific, allCountries);
const astData = buildAssetsChannelData(exposure, companySpecific, allCountries);
const finData = buildFinancialChannelData(exposure, companySpecific, allCountries);

// Override weights with normalized values
revData.weight = revenueNorm[country] || revData.weight;
supData.weight = supplyNorm[country] || supData.weight;
astData.weight = assetsNorm[country] || astData.weight;
finData.weight = financialNorm[country] || finData.weight;
```

Each builder function in `src/services/v5/channelBuilder.ts` returns a **new object** with channel-specific logic:

- `buildRevenueChannelData()` (line 59): Uses `revenuePercentage` → GDP-weighted demand prior
- `buildSupplyChannelData()` (line 117): Uses `supplyPercentage` → manufacturing-weighted prior (NOT GDP)
- `buildAssetsChannelData()` (line 175): Uses `assetsPercentage` → capital-stock prior (λ=0.35)
- `buildFinancialChannelData()` (line 234): Uses `financialPercentage` → financial depth prior

**Channel distinctness validation** is also present (`companySpecificChannelFix.ts` lines 170–195):

```ts
// Fix 4: Channel-distinctness validation
const allEqual =
  Math.abs(revW - supW) < 1e-9 &&
  Math.abs(revW - astW) < 1e-9 &&
  Math.abs(revW - finW) < 1e-9;

if (allEqual) {
  console.error(`[V5 Fix4] ❌ CHANNEL DISTINCTNESS VIOLATION for ${companySpecific.ticker}...`);
}
```

### AAPL-Specific Channel Weights

The AAPL entry in `src/data/companySpecificExposures.ts` (lines 48–71) stores only `percentage` (blended), **not** channel-specific percentages (`revenuePercentage`, `supplyPercentage`, etc.):

```ts
exposures: [
  { country: 'United States', percentage: 42.3, description: 'Revenue from annual report and 10-K filing' },
  { country: 'China',         percentage: 16.9, description: 'Revenue from annual report and 10-K filing' },
  // ...
]
```

Because `revenuePercentage`, `supplyPercentage`, `assetsPercentage`, and `financialPercentage` are all `undefined` for AAPL, each channel builder falls through to the **blended-percentage path**:

- Revenue: `exposure.percentage > 0` → uses blended 42.3% as revenue weight (DIRECT tier)
- Supply: `exposure.percentage > 0` → uses blended 42.3% as supply weight (ALLOCATED tier, `fallbackType: 'SSF'`)
- Assets: `exposure.percentage > 0` → uses blended 42.3% as assets weight (ALLOCATED tier, `fallbackType: 'SSF'`)
- Financial: `exposure.percentage > 0` → uses blended 42.3% as financial weight (ALLOCATED tier, `fallbackType: 'SSF'`)

**Finding:** The four channels are now **distinct JavaScript objects** (the shared-reference bug is fixed), but all four channels receive the **same numeric weight** (the blended `percentage` value) because no channel-specific percentages are stored for AAPL. The weights are numerically identical even though the objects are independent. The channel distinctness check at `companySpecificChannelFix.ts` line 177 will **fire the error** for AAPL's top country because `revW === supW === astW === finW`.

**Verdict:** The object-reference contamination bug is fixed ✅. However, AAPL's channel weights are still numerically identical because the data source (`companySpecificExposures.ts`) only stores a single blended `percentage` per country, not four channel-specific values. The V5 channel-prior differentiation is not actually producing different numbers for AAPL.

---

## Question 2 — Is SSF/RF/GF Still the Live Weighting Logic in Production?

### For AAPL Specifically

**AAPL takes the company-specific path** (`geographicExposureService.ts` lines 341–396). This path calls `buildIndependentChannelBreakdown()` and then attempts SEC integration for upgrading MODELED entries (Fix 4.A, lines 367–377):

```ts
// Fix 4.A: Also attempt SEC integration to upgrade MODELED entries
let secIntegrationForMerge: IntegratedExposureData | null = null;
try {
  secIntegrationForMerge = await integrateStructuredData(ticker, homeCountry, sector);
  if (secIntegrationForMerge) {
    upgradeChannelBreakdownWithSEC(channelBreakdown, secIntegrationForMerge, ticker);
  }
} catch (e) { ... }
```

The `integrateStructuredData()` function in `src/services/structuredDataIntegrator.ts` (lines 972–1117) now routes **all four channels through V5 integrators** (GAP 1 FIX, lines 1023–1052):

```ts
// structuredDataIntegrator.ts lines 1023–1026
const revenueV5  = integrateRevenueChannelV5(secData, homeCountry, sector, ticker);
const supplyV5   = await integrateSupplyChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
const assetsV5   = await integrateAssetsChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
const financialV5 = integrateFinancialChannelV5(secData, homeCountry, sector, ticker);
```

The V5 integrators (`structuredDataIntegratorV5.ts`) use `allocateWithPrior()` and `buildGlobalFallbackV5()` — **not** the old `IndustryDemandProxy` / `COUNTRY_GDP_2023 × SECTOR_PRIORS` formulas.

### Legacy SSF/RF/GF — Still Present but Bypassed for AAPL

The old weight-generating functions still exist:

- `src/services/fallbackLogic.ts`: `applyGlobalFallback()` (lines 260–298) uses `COUNTRY_GDP_2023 × SECTOR_PRIORS` — **old formula, not V5**
- `src/services/fallbackLogic.ts`: `applySegmentFallback()` (lines 308–356) uses `getIndustryDemandProxy()` — **old formula, not V5**
- `src/services/fallbackLogic.ts`: `decideFallback()` (lines 412–554) returns a **direct weight map**, not an admissible set

However, for AAPL:
1. The company-specific path does not call `decideFallback()` at all
2. The `integrateStructuredData()` call routes through V5 integrators which use `buildGlobalFallbackV5()` for their last-resort GF

**The old `integrateRevenueChannel()`, `integrateSupplyChannel()`, `integrateAssetsChannel()`, `integrateFinancialChannel()` functions** in `structuredDataIntegrator.ts` are now marked `@deprecated` and emit `console.warn` when called directly. They are preserved only for backward compatibility but are **no longer the primary execution path**.

### For Non-AAPL Tickers (No Company-Specific Data)

For tickers without a `COMPANY_SPECIFIC_EXPOSURES` entry, the flow is:
1. `calculateIndependentChannelExposuresWithSEC()` calls `integrateStructuredData()` (V4 integrator)
2. `integrateStructuredData()` routes to V5 integrators (GAP 1 FIX) ✅
3. V5 integrators use `buildGlobalFallbackV5()` for GF ✅
4. BUT: `fallbackLogic.ts` `decideFallback()` is still imported and available — it is called from `geographicExposureService.ts` line 34 import but not directly invoked in the main calculation path

**Verdict for AAPL:** The old SSF/RF/GF weight formulas are **not active** in AAPL's execution path. The V5 integrators handle all fallback logic. However, the legacy functions remain in the codebase and could be reached via direct imports.

---

## Question 3 — Are SEC EDGAR, Narrative Parsing, and Supply Chain Ingestion Still Simulated?

### Narrative Parser — Simulation Removed

**File:** `src/services/narrativeParser.ts`

The `generateSimulatedNarrativeText` function has been **completely removed**. The `parseNarrativeText()` function (lines 377–418) now:

```ts
export function parseNarrativeText(narrativeText: string | null | undefined): NarrativeParseResult {
  if (!narrativeText || narrativeText.trim().length === 0) {
    console.log('[Narrative Parser] Empty/null input — returning empty result (no simulation)');
    return empty;  // isSimulated: false
  }
  // ... processes real text only
}
```

The `isSimulated` flag is always `false`. The `fetchSECFilingText()` function (lines 273–362) calls the **real SEC EDGAR API**:

```ts
const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(ticker)}%22&dateRange=custom&startdt=2023-01-01&forms=10-K`;
const searchRes = await fetch(searchUrl, {
  headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
});
```

On failure, it returns `''` (empty string) — a graceful fallback, not simulated data.

### Supply Chain Ingestion — Guard Against Simulated Text

**File:** `src/services/v5/structuredDataIntegratorV5.ts`, lines 286–322

`buildAdmissibleSetFromNarrative()` has an explicit guard:

```ts
if (!narrative || narrative.trim().length === 0 || isSimulated === true) {
  console.log(`[V5 Admissible Set] ${ticker}: Skipping — narrative is ${!narrative ? 'empty/null' : 'simulated'}`);
  return { admissibleSet: [], excludesHomeCountry: false, signalStrength: 'none' };
}
```

The `isSimulated` parameter is always passed as `false` for real SEC filing text (line 616):

```ts
const { admissibleSet, excludesHomeCountry, signalStrength } = buildAdmissibleSetFromNarrative(
  secData.supplyChainNarrativeContext,
  homeCountry,
  ticker,
  false // isSimulated: always false — real SEC filing text
);
```

### SEC EDGAR Integration — Real API, But AAPL Bypasses It

**File:** `src/services/structuredDataIntegrator.ts`, line 988

```ts
const secData = await parseSECFiling(ticker);
```

`parseSECFiling()` calls the real SEC EDGAR API. However, for AAPL:

1. `getCompanySpecificExposure('AAPL')` returns data → company-specific path is taken
2. The SEC integration is attempted **only as a secondary upgrade pass** (Fix 4.A)
3. AAPL's channel weights come from the **hardcoded table** in `companySpecificExposures.ts`, not from live SEC parsing

**The AAPL data in `companySpecificExposures.ts` is static** (last updated: `2025-12-14`):
- US: 42.3%, China: 16.9%, Germany: 8.0%, Japan: 6.3%, UK: 5.5%, etc.
- These are described as "Revenue from annual report and 10-K filing" but are hardcoded strings

**Verdict:** Simulation has been removed from the codebase ✅. Real EDGAR API calls are in place. However, AAPL's actual dashboard numbers come from a **static hardcoded table** (last updated Dec 2025), not from live SEC ingestion. The live SEC path would only be used if AAPL were removed from `COMPANY_SPECIFIC_EXPOSURES`.

---

## Question 4 — Are Dashboard Outputs Driven by Live V5 Methodology or an Older Path?

### AAPL's Actual Execution Path (End-to-End)

Tracing `getCompanyGeographicExposure('AAPL')` through the codebase:

```
getCompanyGeographicExposure('AAPL')                    [geographicExposureService.ts:844]
  → getCompanySpecificExposure('AAPL')                  [companySpecificExposures.ts:289]
    → returns COMPANY_SPECIFIC_EXPOSURES['AAPL']        [companySpecificExposures.ts:48]
      (static data, last updated 2025-12-14)
  → calculateIndependentChannelExposuresWithSEC()       [geographicExposureService.ts:314]
    → buildIndependentChannelBreakdown(companySpecific) [companySpecificChannelFix.ts:57]
      → buildRevenueChannelData(exposure, ...)          [channelBuilder.ts:59]
        → exposure.revenuePercentage = undefined
        → exposure.percentage = 42.3 → uses blended %  [channelBuilder.ts:79]
      → buildSupplyChannelData(exposure, ...)           [channelBuilder.ts:117]
        → exposure.supplyPercentage = undefined
        → exposure.percentage = 42.3 → uses blended %  [channelBuilder.ts:139]
      → (same for assets, financial)
    → Fix 4.A: integrateStructuredData('AAPL', ...)     [structuredDataIntegrator.ts:972]
      → parseSECFiling('AAPL')                          [secFilingParser.ts — real API]
      → integrateRevenueChannelV5(secData, ...)         [structuredDataIntegratorV5.ts:328]
      → integrateSupplyChannelV5(secData, ...)          [structuredDataIntegratorV5.ts:516]
      → integrateAssetsChannelV5(secData, ...)          [structuredDataIntegratorV5.ts:689]
      → integrateFinancialChannelV5(secData, ...)       [structuredDataIntegratorV5.ts:956]
    → upgradeChannelBreakdownWithSEC(...)               [geographicExposureService.ts:229]
      → Only upgrades entries where tier === 'MODELED'
      → AAPL entries are DIRECT/ALLOCATED (from blended %)
      → No upgrade occurs (DIRECT/ALLOCATED not downgraded)
  → normalize blended weights
  → return finalResult with channelBreakdown
```

### What Drives the Dashboard Numbers

**Primary source:** `COMPANY_SPECIFIC_EXPOSURES['AAPL']` in `companySpecificExposures.ts`

The dashboard shows:
- Country weights derived from the static `percentage` field (e.g., US=42.3%, China=16.9%)
- All four channels receive the same numeric weight (blended %)
- Evidence tier shown as DIRECT for revenue, ALLOCATED for supply/assets/financial
- Data source label: `'Manual entry from Apple 10-K and investor relations'`

**V5 methodology contribution to AAPL dashboard:**
- ✅ Channel objects are independent (no shared-reference bug)
- ✅ `buildGlobalFallbackV5()` is used if SEC data upgrades any MODELED entries
- ✅ DIRECT/ALLOCATED/MODELED tier badges are rendered in `CompanyMode.tsx`
- ❌ Channel-specific economic priors do NOT differentiate AAPL's weights (all channels use blended %)
- ❌ Live SEC data does not drive AAPL's primary weights
- ❌ Supply chain prior (which should heavily weight China/Vietnam/Taiwan for tech hardware) is not applied to AAPL's supply channel

### V5 Integrator Wiring Status

The `structuredDataIntegrator.ts` GAP 1 FIX (lines 1018–1052) correctly routes all four channels through V5 integrators. This means for non-company-specific tickers, the full V5 pipeline is active:

```ts
// structuredDataIntegrator.ts lines 1021–1026
console.log(`[Structured Data Integration] 🔀 Routing to V5 channel integrators...`);

const revenueV5   = integrateRevenueChannelV5(secData, homeCountry, sector, ticker);
const supplyV5    = await integrateSupplyChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
const assetsV5    = await integrateAssetsChannelV5(secData, sustainabilityData, homeCountry, sector, ticker);
const financialV5 = integrateFinancialChannelV5(secData, homeCountry, sector, ticker);
```

**Verdict:** AAPL's dashboard is driven by a **static hardcoded table** (Dec 2025 data) processed through the V5 channel builder (which produces independent objects but numerically identical weights). The full V5 SEC ingestion pipeline exists and is wired correctly, but it only runs as a secondary upgrade pass for AAPL — and since AAPL's entries are already DIRECT/ALLOCATED tier, no upgrade occurs. The V5 methodology is live for non-company-specific tickers.

---

## Summary Table

| Question | Finding | Severity |
|----------|---------|----------|
| 1. Channel-weight identity bug (AAPL) | Object-reference bug fixed ✅; but all four channels still receive numerically identical weights because `companySpecificExposures.ts` only stores blended `percentage` (no channel-specific fields) | 🟠 Medium |
| 2. SSF/RF/GF as live weighting logic | Not active for AAPL (company-specific path + V5 integrators). Legacy functions still exist in `fallbackLogic.ts` but are not called in AAPL's path | ✅ Fixed for AAPL |
| 3. Simulation in SEC/narrative/supply | Simulation removed ✅. Real EDGAR API used. AAPL bypasses live SEC ingestion via static override table | ✅ Simulation removed |
| 4. Dashboard driven by V5 or older path | AAPL: static table (Dec 2025) + V5 channel builder (numerically identical weights). Non-AAPL: full V5 pipeline active via `structuredDataIntegrator.ts` GAP 1 FIX | ⚠️ Mixed |

---

## Key Remaining Gaps for AAPL

### Gap A — No Channel-Specific Percentages in AAPL Data
**File:** `src/data/companySpecificExposures.ts`, lines 48–71

The `CompanyExposure.exposures` array only has `percentage` (blended). The `CompanySpecificExposure` interface in `channelBuilder.ts` supports `revenuePercentage`, `supplyPercentage`, `assetsPercentage`, `financialPercentage` — but these are never populated for AAPL.

**Impact:** All four channels receive the same weight (42.3% for US, 16.9% for China, etc.). Apple's supply channel should heavily weight China/Vietnam/Taiwan (manufacturing), but instead shows the same revenue-like distribution.

### Gap B — Static Data Not Refreshed by Live V5 Pipeline
**File:** `src/data/companySpecificExposures.ts`, line 70

`lastUpdated: '2025-12-14'` — the data is over 3 months old. The V5 SEC ingestion pipeline would produce fresher data, but it is bypassed by the company-specific override.

### Gap C — Fix 4.A Upgrade Pass Ineffective for AAPL
**File:** `src/services/geographicExposureService.ts`, lines 229–307

`upgradeChannelBreakdownWithSEC()` only upgrades entries where `tier === 'MODELED'`. Since AAPL's blended-percentage entries are tagged as DIRECT (revenue) or ALLOCATED (supply/assets/financial), no upgrade occurs even if the live SEC parse returns better data.

### Gap D — Legacy `fallbackLogic.ts` Still Active for Non-AAPL Tickers
**File:** `src/services/fallbackLogic.ts`

`applyGlobalFallback()` (lines 260–298) and `applySegmentFallback()` (lines 308–356) still use the old `IndustryDemandProxy` / `COUNTRY_GDP_2023 × SECTOR_PRIORS` formulas. These are not called for AAPL but remain active for any code path that imports `fallbackLogic.ts` directly.

---

## Recommended Actions (Priority Order)

1. **Add channel-specific percentages to AAPL entry** in `companySpecificExposures.ts`:
   - `revenuePercentage`: use Apple's 10-K geographic revenue segments (US, China, Japan, Europe, Rest of Asia Pacific)
   - `supplyPercentage`: China ~60%, Taiwan ~15%, Vietnam ~10%, India ~8%, US ~7% (based on Apple's supplier list)
   - `assetsPercentage`: US ~65%, China ~15%, Ireland ~10%, other ~10% (based on PP&E table)
   - `financialPercentage`: US ~70%, Ireland ~15%, other ~15% (based on treasury/debt)

2. **Allow Fix 4.A to override ALLOCATED entries** (not just MODELED): Change `upgradeChannelBreakdownWithSEC()` to also upgrade ALLOCATED entries when SEC data provides DIRECT evidence.

3. **Remove AAPL from `COMPANY_SPECIFIC_EXPOSURES`** (or add a `useV5Pipeline: true` flag) to allow the full V5 SEC ingestion pipeline to run as the primary source, with the static table as fallback only.

4. **Retire legacy `fallbackLogic.ts` weight functions**: Replace `applyGlobalFallback()` and `applySegmentFallback()` with calls to `buildGlobalFallbackV5()` and `allocateWithPrior()`.

---

## File Reference Index

| File | Key Finding | Relevant Lines |
|------|------------|----------------|
| `src/data/companySpecificExposures.ts` | AAPL static data, blended % only | 48–71 |
| `src/services/geographicExposureService.ts` | Company-specific path, Fix 4.A upgrade | 341–396, 229–307 |
| `src/services/v5/companySpecificChannelFix.ts` | Independent channel builder, distinctness check | 57–199 |
| `src/services/v5/channelBuilder.ts` | Per-channel data builders, blended-% fallback | 59–280 |
| `src/services/structuredDataIntegrator.ts` | GAP 1 FIX: V5 integrator routing | 1018–1052 |
| `src/services/v5/structuredDataIntegratorV5.ts` | V5 integrators, admissible set, coverage gate | 286–322, 427–467 |
| `src/services/narrativeParser.ts` | Simulation removed, real EDGAR API | 273–418 |
| `src/services/fallbackLogic.ts` | Legacy weight formulas still present | 260–356 |
| `src/services/v5/channelPriors.ts` | V5 GF formula, HOME_BIAS_LAMBDA | 1447–1519 |
| `src/services/v4/v4Orchestrator.ts` | Joint solver using V5 priors (GAP 3 fix) | 248–351 |

---

*End of Report — No code changes were made during this investigation.*