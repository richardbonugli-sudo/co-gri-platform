# V5 Methodology Implementation Gap Analysis

**Report Date:** 2026-03-26  
**Scope:** CO-GRI Platform — V5 Methodology vs. Actual Implementation  
**Prepared by:** David (Data Analyst)  
**Classification:** Internal — Technical Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [V5 Methodology Key Requirements](#2-v5-methodology-key-requirements)
3. [Codebase Investigation Summary](#3-codebase-investigation-summary)
4. [Detailed Gap Analysis](#4-detailed-gap-analysis)
   - 4.1 [Step 1.1 — Independent Channel Vectors](#41-step-11--independent-channel-vectors)
   - 4.2 [Step 1.2 — Structured Evidence as Hard Constraints](#42-step-12--structured-evidence-as-hard-constraints)
   - 4.3 [Step 1.3 — Narrative Parser Admissible Set](#43-step-13--narrative-parser-admissible-set)
   - 4.4 [Step 1.4 — Coverage Check Before Fallback](#44-step-14--coverage-check-before-fallback)
   - 4.5 [Step 1.5 — DIRECT / ALLOCATED / MODELED Tier Labels](#45-step-15--direct--allocated--modeled-tier-labels)
   - 4.6 [Step 2.1–2.4 — V5 GF Formula & Channel-Specific Priors](#46-step-21-24--v5-gf-formula--channel-specific-priors)
   - 4.7 [COGRI Calculation Engine Gaps](#47-cogri-calculation-engine-gaps)
   - 4.8 [geographicExposureService Integration Gaps](#48-geographicexposureservice-integration-gaps)
   - 4.9 [Dashboard & UI Gaps](#49-dashboard--ui-gaps)
   - 4.10 [COGRIAuditReport Accuracy Gaps](#410-cogriauditreport-accuracy-gaps)
5. [Alignment with Review Observations Document](#5-alignment-with-review-observations-document)
6. [Prioritized Next Steps](#6-prioritized-next-steps)
7. [Appendix — Files Reviewed](#7-appendix--files-reviewed)

---

## 1. Executive Summary

The V5 methodology document specifies a rigorous, multi-phase upgrade to the CO-GRI calculation pipeline. The implementation has made **significant progress** on Phase 1 (Steps 1.1–1.5) and Phase 2 (Steps 2.1–2.4), with dedicated service files (`structuredDataIntegratorV5.ts`, `companySpecificChannelFix.ts`, `channelBuilder.ts`, `channelPriors.ts`) that correctly implement the core V5 logic.

However, a **critical integration gap** exists: the V5 services are largely **disconnected from the live calculation pipeline**. `geographicExposureService.ts` — the entry point called by `CompanyMode.tsx` — does not call the V5 integrator for the three manually-verified companies (AAPL, TSLA, MSFT). Instead, it uses the legacy company-specific override path that assigns **identical weights to all four channels**, directly violating the V5 principle of independent channel vectors.

The Review Observations document identifies 12 specific shortcomings across data quality, methodology, and UI. Of these, **8 are confirmed as active gaps** in the current implementation, **2 are partially addressed**, and **2 are correctly implemented**.

**Overall Assessment:** The V5 architecture is well-designed and partially implemented in isolated service modules, but the **wiring between V5 services and the main pipeline is incomplete**. The most impactful single fix would be connecting `geographicExposureService.ts` to `buildIndependentChannelBreakdown()` for all tickers.

---

## 2. V5 Methodology Key Requirements

Based on the V5 methodology document (`/workspace/uploads/V5 methodology (2).docx`), the following are the core requirements:

### Phase 1 — Data Integration Fixes

| Step | Requirement | Description |
|------|-------------|-------------|
| 1.1 | Independent Channel Vectors | Each of the four channels (Revenue, Supply, Assets, Financial) must have **independently computed weight vectors** per country. The old shared-channelData pattern (all four channels receiving the same weight object) is explicitly prohibited. |
| 1.2 | Structured Evidence as Hard Constraints | When SEC filing data provides a region total (e.g., "Europe: 35%"), that total must be treated as a **hard constraint**. Internal country allocation within the region must use **channel-specific economic priors**, not equal distribution. |
| 1.3 | Narrative Parser — Admissible Set Only | The supply chain narrative parser must build an **admissible set P** from explicitly mentioned countries only. No template injection. If narrative is empty or simulated, the admissible set must be empty. |
| 1.4 | Coverage Check Before Fallback | If structured evidence covers ≥95% of exposure, **no fallback** should be applied. Fallback is only triggered for the uncovered remainder. |
| 1.5 | Evidence Tier Labels | All output must carry a tier label: **DIRECT** (structured table, no fallback), **ALLOCATED** (region total → prior allocation), or **MODELED** (prior-based inference, no direct constraint). |

### Phase 2 — Fallback & Prior Improvements

| Step | Requirement | Description |
|------|-------------|-------------|
| 2.1 | Fallback Returns Admissible Set + Constraints | Fallback logic must return an admissible set and constraints, not weights directly. The caller applies the prior. |
| 2.2 | Separate Plausibility from Magnitude | The model must distinguish between whether a country is plausibly exposed (plausibility) and how much (magnitude). |
| 2.3 | Channel-Specific Priors Drive Allocation | Each channel must use its own economic prior table: Revenue (GDP × HH Consumption × Sector Demand × Market Access), Supply (Manufacturing VA × Sector Export × Assembly Capability × Logistics × IO Relevance), Assets (Capital Stock × Sector Asset Suitability × Infrastructure × Resource Fit), Financial (Financial Depth × Currency Exposure × Cross-Border Capital × Funding Hub). |
| 2.4 | V5 GF Formula | Global Fallback must use: `p_c = λ × HomeBias(c) + (1-λ) × GlobalPrior_channel_sector(c)` with channel-specific λ values (Revenue: 0.25, Supply: 0.10, Assets: 0.35, Financial: 0.30). Replaces the old fixed 85/15 split. |

### Additional V5 Requirements

- **GAP 4 Fix:** Residual labels ("International", "Other", "Rest of World") must be distributed across all unconstrained countries via channel prior, not discarded.
- **Channel Distinctness Validation:** A runtime check must verify that the four channel weight vectors are not identical (regression guard for the old shared-channelData bug).
- **Micro-Exposure Threshold:** Countries with blended weight < 0.0001 (0.01%) must be excluded before normalization. This threshold must be consistent between `geographicExposureService.ts` and `cogriCalculationService.ts`.

---

## 3. Codebase Investigation Summary

### Files Reviewed

| File | Purpose | V5 Status |
|------|---------|-----------|
| `src/services/v5/structuredDataIntegratorV5.ts` | V5 channel integration (all 4 channels) | ✅ Implemented |
| `src/services/v5/companySpecificChannelFix.ts` | Independent channel breakdown builder | ✅ Implemented |
| `src/services/v5/channelBuilder.ts` | Per-channel data builders (DIRECT/ALLOCATED/MODELED) | ✅ Implemented |
| `src/services/v5/channelPriors.ts` | Economic prior tables for all 4 channels | ✅ Implemented |
| `src/services/cogriCalculationService.ts` | COGRI score calculation engine | ⚠️ Partially V5 |
| `src/services/geographicExposureService.ts` | Main exposure pipeline entry point | ❌ Not V5-wired |
| `src/pages/modes/CompanyMode.tsx` | Company dashboard page | ⚠️ Partially V5 |
| `src/pages/COGRIAuditReport.tsx` | Methodology audit report page | ⚠️ Stale content |
| `src/services/v5/channelBuilder.ts` | Channel data builders | ✅ Implemented |

### Architecture Observation

The V5 services exist as a **parallel, isolated subsystem** that is not connected to the main pipeline. The call chain is:

```
CompanyMode.tsx
  → getCompanyGeographicExposure(ticker)       [geographicExposureService.ts]
    → hasCompanySpecificExposure(ticker)?
      YES → buildChannelBreakdown() [LEGACY — same weight all channels]
      NO  → calculateIndependentChannelExposuresWithSEC() [partially V5]
```

The V5 subsystem (`buildIndependentChannelBreakdown` in `companySpecificChannelFix.ts`) is **never called** for AAPL, TSLA, or MSFT — the three tickers with the most data. For all other tickers, the V5 integrator (`structuredDataIntegratorV5.ts`) is called but operates on **simulated SEC data**, not live EDGAR content.

---

## 4. Detailed Gap Analysis

### 4.1 Step 1.1 — Independent Channel Vectors

**V5 Requirement:** Each channel must have an independently computed weight vector. The old pattern of assigning the same object to all four channels is prohibited.

**Status: ❌ CRITICAL GAP — Active in Production Path**

**Evidence:**

In `geographicExposureService.ts` (the live production path), the company-specific override block still assigns the same weight to all four channels:

```typescript
// geographicExposureService.ts (legacy path for AAPL/TSLA/MSFT)
channelBreakdown[country] = {
  revenue:   { weight: exposure.percentage / 100, status: 'evidence' },
  financial: { weight: exposure.percentage / 100, status: 'evidence' },  // SAME weight
  supply:    { weight: exposure.percentage / 100, status: 'evidence' },  // SAME weight
  assets:    { weight: exposure.percentage / 100, status: 'evidence' },  // SAME weight
};
```

This means for AAPL (China = 16.9%), all four channels receive weight = 0.169. The sector-specific coefficients (Technology: α=0.45, β=0.35, γ=0.10, δ=0.10) have **zero effect** because the blended weight simplifies to:
```
W_blended = 0.45×0.169 + 0.35×0.169 + 0.10×0.169 + 0.10×0.169 = 0.169 × 1.0 = 0.169
```

**The V5 fix (`buildIndependentChannelBreakdown` in `companySpecificChannelFix.ts`) exists and is correctly implemented but is never called for AAPL/TSLA/MSFT.**

The channel distinctness validation in `companySpecificChannelFix.ts` (lines 170–195) would correctly detect and log this violation — but it is never reached.

**Impact:** For the three highest-quality tickers, China's supply chain dominance (~85–90% of Apple's manufacturing) is not reflected. The supply channel weight for China should be ~0.85, not 0.169. This significantly **underestimates** China's risk contribution for tech companies.

**Files Affected:**
- `src/services/geographicExposureService.ts` — legacy company-specific path
- `src/services/v5/companySpecificChannelFix.ts` — V5 fix exists but unwired

---

### 4.2 Step 1.2 — Structured Evidence as Hard Constraints

**V5 Requirement:** Region totals from SEC filings must be treated as hard constraints. Internal allocation must use channel-specific economic priors.

**Status: ✅ IMPLEMENTED in V5 integrator / ❌ NOT WIRED for company-specific path**

**Evidence:**

`structuredDataIntegratorV5.ts` correctly implements `allocateRegionWithPrior()` (lines 205–273), which:
1. Treats the region total as a hard constraint
2. Allocates internally using `allocateWithPrior()` with channel-specific priors
3. Labels results as `tier: 'ALLOCATED'`

However, this function is only called from `integrateRevenueChannelV5()`, which is only invoked for non-company-specific tickers (i.e., not AAPL/TSLA/MSFT). For MSFT specifically, the company-specific data contains `"Europe"` and `"Other Asia Pacific"` as country entries — these are regional aggregates that bypass the region decomposition logic entirely.

**Files Affected:**
- `src/services/v5/structuredDataIntegratorV5.ts` — correctly implemented
- `src/data/companySpecificExposures.ts` — MSFT entries contain regional aggregates

---

### 4.3 Step 1.3 — Narrative Parser Admissible Set

**V5 Requirement:** Supply chain narrative parser must build admissible set P from explicitly mentioned countries only. No template injection. Simulated text must be rejected.

**Status: ✅ IMPLEMENTED in V5 integrator**

**Evidence:**

`buildAdmissibleSetFromNarrative()` in `structuredDataIntegratorV5.ts` (lines 286–322) correctly:
1. Guards against empty/null/simulated narrative (returns empty admissible set)
2. Calls `extractSupplyCountriesFromNarrative()` for real narrative text
3. Expands regions mentioned in narrative to member countries
4. Excludes home country if not mentioned

**Residual concern:** The `isSimulated` flag is passed as `false` (hardcoded) when calling from `integrateSupplyChannelV5()`. If `secData.supplyChainNarrativeContext` is ever populated from the simulated `generateSimulatedNarrativeText()` function (as noted in the audit report), the guard will not fire. A runtime check for simulated content would be more robust.

**Files Affected:**
- `src/services/v5/structuredDataIntegratorV5.ts` — correctly implemented, minor robustness concern
- `src/services/narrativeParser.ts` — `generateSimulatedNarrativeText()` could pollute if misrouted

---

### 4.4 Step 1.4 — Coverage Check Before Fallback

**V5 Requirement:** If structured evidence covers ≥95% of exposure, no fallback should be applied.

**Status: ✅ IMPLEMENTED in V5 integrator**

**Evidence:**

All four channel integration functions in `structuredDataIntegratorV5.ts` implement the coverage check:
```typescript
const coverage = getEvidenceCoverage(channel);
if (coverage >= 0.95) {
  console.log(`[V5 Revenue] ✅ Coverage ≥95% — no fallback needed`);
  return { channel, evidenceLevel, validations, fallbackType };
}
```

This is correctly implemented for all four channels (revenue: line 431, supply: line 560/600, assets: lines 733/805/835/868, financial: line 1008).

**Gap:** This logic only applies when the V5 integrator is called. For the company-specific path (AAPL/TSLA/MSFT), no coverage check is performed — fallback is never applied anyway since 100% is covered by the override data, but the coverage check infrastructure is absent from that path.

---

### 4.5 Step 1.5 — DIRECT / ALLOCATED / MODELED Tier Labels

**V5 Requirement:** All output must carry a tier label (DIRECT / ALLOCATED / MODELED).

**Status: ⚠️ PARTIAL — Implemented in V5 integrator but not propagated to UI for company-specific path**

**Evidence:**

The V5 integrator correctly assigns tier labels:
- `tier: 'DIRECT'` — structured table, no fallback (lines 371, 595, 762, 1003)
- `tier: 'ALLOCATED'` — region → prior allocation (line 263, 638, 791)
- `tier: 'MODELED'` — GF prior, no constraint (lines 402, 496, 628, 670)

`cogriCalculationService.ts` derives `dataSource` from `bestStatus` (lines 224–229):
```typescript
const dataSourceFromStatus = (
  bestStatus === 'evidence'                 ? 'DIRECT'    :
  bestStatus === 'high_confidence_estimate' ? 'ALLOCATED' :
  bestStatus === 'known_zero'               ? 'MODELED'   :
                                              'FALLBACK'
);
```

`CompanyMode.tsx` uses `dataSource` to render the Evidence Tier Summary Bar (lines 326–370), which correctly shows DIRECT/ALLOCATED/MODELED/FALLBACK counts and weights.

**Gap 1:** The `dataSource` field is derived from `bestStatus` in `cogriCalculationService.ts`, not from the `tier` field propagated by the V5 integrator. These two derivation paths can diverge. The V5 `tier` field (from `channelBuilder.ts`) is more precise but is not used in the final `CountryExposure` object.

**Gap 2:** The `CountryExposure` interface in `cogriCalculationService.ts` does not include a `tier` field — only `dataSource`. The V5 `tier` field from `IntegratedChannelDataV5` is lost during the conversion from V5 channel data to `CountryExposure`.

**Files Affected:**
- `src/services/cogriCalculationService.ts` — `CountryExposure` interface missing `tier` field
- `src/services/v5/structuredDataIntegratorV5.ts` — `tier` field correctly set but not consumed downstream

---

### 4.6 Step 2.1–2.4 — V5 GF Formula & Channel-Specific Priors

**V5 Requirement:** V5 GF formula `p_c = λ × HomeBias(c) + (1-λ) × GlobalPrior_channel_sector(c)` with channel-specific λ. Channel-specific economic priors for all four channels.

**Status: ✅ IMPLEMENTED in V5 services / ❌ NOT USED in production path**

**Evidence:**

`channelPriors.ts` correctly implements:
- `getRevenuePrior()` — GDP^0.25 × HH_Consumption^0.35 × SectorDemand^0.30 × MarketAccess^0.10
- `getSupplyPrior()` — ManufacturingVA^0.20 × SectorExport^0.30 × AssemblyCapability^0.25 × Logistics^0.10 × IORelevance^0.15
- `getAssetsPrior()` — CapitalStock^0.30 × SectorAssetSuitability^0.35 × Infrastructure^0.20 × ResourceFit^0.15
- `getFinancialPrior()` — FinancialDepth^0.35 × CurrencyExposure^0.30 × CrossBorderCapital^0.20 × FundingHub^0.15
- `buildGlobalFallbackV5()` — V5 GF formula with HOME_BIAS_LAMBDA per channel (Revenue: 0.25, Supply: 0.10, Assets: 0.35, Financial: 0.30)

`normalizeSectorKey()` correctly maps Manufacturing → Technology Hardware, Retail → Consumer Goods (FIX 4 applied).

**Gap 1 — Production Path Bypass:** These priors are only used when `integrateRevenueChannelV5()` / `integrateSupplyChannelV5()` etc. are called. The legacy fallback path in `geographicExposureService.ts` still uses the old fixed 85/15 GF split for non-company-specific tickers that fail SEC integration.

**Gap 2 — Semiconductor Sector:** `channelPriors.ts` has a `SECTOR_EXPORT['Semiconductor']` table but `normalizeSectorKey()` does not have a mapping for "Semiconductor" — it would fall through to the default "Technology" mapping. NVDA, QCOM, and similar tickers would use the wrong supply prior.

**Files Affected:**
- `src/services/v5/channelPriors.ts` — missing Semiconductor sector key mapping
- `src/services/geographicExposureService.ts` — legacy GF path not updated to V5 formula

---

### 4.7 COGRI Calculation Engine Gaps

**File:** `src/services/cogriCalculationService.ts`

#### Gap A — `dataSource` Field Not in Interface

The `CountryExposure` interface (lines 83–103) does not declare a `dataSource` field, but `cogriCalculationService.ts` adds it at runtime (line 239):
```typescript
dataSource: dataSourceFromStatus,  // TypeScript error: not in interface
```
This is a TypeScript type safety violation. The `dataSource` field is used in `CompanyMode.tsx` (lines 327–334) but is not part of the declared type.

#### Gap B — Political Alignment Applied Twice

The political alignment amplification formula `(1.0 + 0.5 × (1.0 - A_c))` is applied at **two points**:
1. Pre-normalization (line 199): `contribution = blendedWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor))`
2. Post-normalization (line 296): `normalizedContribution = normalizedWeight * exp.countryShockIndex * (1.0 + 0.5 * (1.0 - alignmentFactor))`

The pre-normalization contribution (line 199) is stored in `countryExposuresPreNorm` but then **overwritten** by the post-normalization value (line 296–302). The pre-normalization contribution is never used in the final score. This is correct behavior but creates confusion — the pre-normalization `contribution` field is misleading and could cause bugs if the code is refactored.

#### Gap C — Sector Multiplier Rounding

The final score uses `Math.round(rawScore * sectorMultiplier * 10) / 10` (line 314), which rounds to 1 decimal place. The V5 methodology does not specify rounding precision. For scores near threshold boundaries (e.g., 29.95 → rounds to 30.0 = Moderate Risk vs. 29.9 = Low Risk), this rounding can change the risk level classification. A more defensible approach would be to round only for display, not for the stored value.

#### Gap D — No Confidence Interval

The V5 methodology and the Review Observations document both note the absence of a confidence interval on the final score. The calculation engine produces a point estimate with no uncertainty band. Companies with predominantly GF fallback data could have ±15 point uncertainty.

---

### 4.8 geographicExposureService Integration Gaps

**File:** `src/services/geographicExposureService.ts`

#### Gap A — V5 Integrator Not Called for Company-Specific Tickers

As described in §4.1, `buildIndependentChannelBreakdown()` from `companySpecificChannelFix.ts` is never called. The legacy path assigns identical weights to all four channels for AAPL, TSLA, and MSFT.

**Recommended fix:** Replace the legacy company-specific channel assignment block with:
```typescript
import { buildIndependentChannelBreakdown } from './v5/companySpecificChannelFix';

// In the company-specific path:
const { channelBreakdown } = buildIndependentChannelBreakdown(
  companySpecificData,
  SECTOR_EXPOSURE_COEFFICIENTS[sector] || DEFAULT_COEFFICIENTS
);
```

#### Gap B — V5 Integrator Not Called for SEC-Based Path

The `calculateIndependentChannelExposuresWithSEC()` function calls `structuredDataIntegrator` (the legacy integrator), not `structuredDataIntegratorV5`. The V5 integrator is imported but not wired into the main calculation path.

#### Gap C — Simulated SEC Data

`secEdgarService.ts` returns simulated data in the development environment. This means `integrateRevenueChannelV5()` receives simulated revenue segments, not real EDGAR data. The V5 integrator's structured evidence path (DIRECT tier) is never exercised for any ticker except the three company-specific overrides.

#### Gap D — MSFT Regional Aggregates Not Decomposed

MSFT's company-specific data contains `"Europe"` and `"Other Asia Pacific"` as country entries. These are passed directly to the channel breakdown builder without regional decomposition. The V5 region allocation logic (`allocateRegionWithPrior()`) is never applied to these entries because the company-specific path bypasses it.

---

### 4.9 Dashboard & UI Gaps

**File:** `src/pages/modes/CompanyMode.tsx`

#### Gap A — Evidence Tier Bar Uses `dataSource` Not `tier`

The Evidence Tier Summary Bar (lines 326–370) reads `e.dataSource` which is derived from `bestStatus` in `cogriCalculationService.ts`. This is a secondary derivation, not the primary V5 `tier` field. For company-specific tickers (AAPL/TSLA/MSFT), all countries will show `dataSource: 'DIRECT'` (because `bestStatus === 'evidence'`), even though the channel data is not truly DIRECT — it's the same weight assigned to all channels.

#### Gap B — Fallback Tier Not Surfaced Per Country in Risk Attribution

The `RiskAttribution.tsx` component does not show the fallback tier (SSF/RF/GF/DIRECT) per country row. Users see risk scores without knowing the data quality behind each country's contribution. This is explicitly called out in the Review Observations document.

#### Gap C — Scenario Shock and Trading Signal Lenses Are Stubs

`CompanyMode.tsx` renders placeholder content for the "Scenario Shock" tab (disabled with "Soon" badge) and the "Trading Signal" tab. The `CompanyTradingSignalView` component exists but its connection to the V5 risk data is not documented.

#### Gap D — Ticker Resolution Limited to 3 Companies

The company name resolution in `CompanyMode.tsx` (line 205) only handles AAPL:
```typescript
name: ticker === 'AAPL' ? 'Apple Inc.' : `${ticker} Corporation`,
```
All other tickers get a generic `"[TICKER] Corporation"` name, regardless of the actual company name returned by the geographic exposure service.

#### Gap E — No Score Confidence Band in UI

The `CompanySummaryPanel` displays a single CO-GRI score with no uncertainty range. The V5 methodology and Review Observations both call for a confidence interval display (e.g., "38.5 ± 4.2").

---

### 4.10 COGRIAuditReport Accuracy Gaps

**File:** `src/pages/COGRIAuditReport.tsx`

The audit report was generated as of March 20, 2026 and contains several inaccuracies relative to the current V5 implementation state:

#### Gap A — Section 4 Incorrectly States All Channels Get Same Weight

Section 4 (Channel Assignment Logic, lines 596–606) documents the company-specific override behavior as intentional:
> "all four channels receive the same weight (the company's revenue percentage for that country)"

This was the pre-V5 behavior. The V5 methodology explicitly prohibits this. The audit report should be updated to reflect that Step 1.1 requires independent channel vectors and that `buildIndependentChannelBreakdown()` is the correct path.

#### Gap B — Section 10 AAPL Case Study Uses Wrong Coefficients

The AAPL case study (Section 10, lines 1023–1030) shows:
```
W_blended[US] = 0.40×0.423 + 0.35×0.423 + 0.15×0.423 + 0.10×0.423
```
This uses the **default** coefficients (0.40/0.35/0.15/0.10), not the Technology sector coefficients (0.45/0.35/0.10/0.10). The comment on line 1028 acknowledges the Technology coefficients "have no effect" — but this is only true because of the Step 1.1 violation (identical channel weights). Once V5 is properly wired, the Technology coefficients will have effect.

#### Gap C — Section 2 API Status Outdated

Section 2 lists Polygon.io and Alpha Vantage as "Active" and SEC EDGAR as "Simulated in dev". If the V5 integrator has been wired to live EDGAR data in any environment, this table needs updating.

---

## 5. Alignment with Review Observations Document

The Review Observations document (`/workspace/uploads/Review Observations for New Dashboard.docx`) identifies the following shortcomings. Cross-referenced against the current implementation:

| # | Review Observation | Status | Gap Reference |
|---|-------------------|--------|---------------|
| 1 | Channel weights are identical across all four channels for company-specific tickers | ❌ **Active Gap** | §4.1 |
| 2 | Sector-specific coefficients have no effect when all channel weights are identical | ❌ **Active Gap** | §4.1 |
| 3 | MSFT data contains regional aggregates ("Europe", "Other Asia Pacific") not decomposed to country level | ❌ **Active Gap** | §4.8-D |
| 4 | No confidence interval on final CO-GRI score | ❌ **Active Gap** | §4.7-D, §4.9-E |
| 5 | Fallback tier (SSF/RF/GF) not surfaced per country in Risk Attribution UI | ❌ **Active Gap** | §4.9-B |
| 6 | V5 GF formula (λ-weighted home bias + channel prior) not used in legacy fallback path | ❌ **Active Gap** | §4.6 |
| 7 | DIRECT/ALLOCATED/MODELED tier labels not propagated through to CountryExposure interface | ⚠️ **Partial** | §4.5 |
| 8 | SEC EDGAR integration returns simulated data; V5 integrator never exercises DIRECT tier for real tickers | ❌ **Active Gap** | §4.8-C |
| 9 | Narrative parser admissible set construction correctly implemented | ✅ **Addressed** | §4.3 |
| 10 | Coverage check (≥95%) before fallback correctly implemented in V5 integrator | ✅ **Addressed** | §4.4 |
| 11 | `dataSource` field derived from `bestStatus` rather than V5 `tier` field — potential divergence | ⚠️ **Partial** | §4.5 |
| 12 | Scenario Shock and Trading Signal lenses are stubs with no V5 data connection | ❌ **Active Gap** | §4.9-C |

**Summary:** 8 active gaps, 2 partial, 2 correctly addressed.

---

## 6. Prioritized Next Steps

### Priority 1 — Critical (Blocks V5 Correctness)

These gaps directly violate V5 methodology requirements and affect the accuracy of all CO-GRI scores for the three highest-quality tickers.

#### P1-1: Wire `buildIndependentChannelBreakdown()` for Company-Specific Tickers
**File:** `src/services/geographicExposureService.ts`  
**Effort:** Medium (1–2 days)  
**Action:** Replace the legacy company-specific channel assignment block with a call to `buildIndependentChannelBreakdown()` from `companySpecificChannelFix.ts`. Pass the sector-specific coefficients from `SECTOR_EXPOSURE_COEFFICIENTS`.  
**Impact:** Fixes Step 1.1 violation. China's supply weight for AAPL will correctly reflect ~85% manufacturing concentration. Risk scores will change significantly for AAPL, TSLA, MSFT.

#### P1-2: Decompose MSFT Regional Aggregates
**File:** `src/data/companySpecificExposures.ts`  
**Effort:** Low (4 hours)  
**Action:** Replace `"Europe"` and `"Other Asia Pacific"` entries in MSFT's company-specific data with specific country entries using the regional expansion from `getRegionMembersFromName()`. Source: MSFT's most recent 10-K geographic segment disclosures.  
**Impact:** Fixes §4.8-D. MSFT scores will be country-level rather than region-level.

#### P1-3: Add `tier` Field to `CountryExposure` Interface
**File:** `src/services/cogriCalculationService.ts`  
**Effort:** Low (2 hours)  
**Action:** Add `tier?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK'` to the `CountryExposure` interface. Propagate the V5 `tier` field from `ChannelData` through to `CountryExposure`. Use `tier` (not `dataSource` derived from `bestStatus`) in the Evidence Tier Summary Bar.  
**Impact:** Fixes §4.5 gap. Tier labels will be accurate for V5-processed tickers.

### Priority 2 — High (Significant Methodology Gaps)

#### P2-1: Wire V5 Integrator for SEC-Based Path
**File:** `src/services/geographicExposureService.ts`  
**Effort:** High (3–5 days)  
**Action:** Replace calls to the legacy `structuredDataIntegrator` with `structuredDataIntegratorV5` in `calculateIndependentChannelExposuresWithSEC()`. Ensure the output format is compatible with `cogriCalculationService.ts`.  
**Impact:** Fixes §4.8-B. All non-company-specific tickers will use V5 channel priors, V5 GF formula, and correct tier labels.

#### P2-2: Update Legacy GF Path to V5 Formula
**File:** `src/services/geographicExposureService.ts`  
**Effort:** Medium (1 day)  
**Action:** Replace the old fixed 85/15 GF split in the legacy fallback path with `buildGlobalFallbackV5()` from `channelPriors.ts`. Apply channel-specific λ values.  
**Impact:** Fixes §4.6. All fallback-path tickers will use economically grounded priors instead of arbitrary 85/15 split.

#### P2-3: Add Semiconductor Sector Key to `normalizeSectorKey()`
**File:** `src/services/v5/channelPriors.ts`  
**Effort:** Low (1 hour)  
**Action:** Add `if (lower.includes('semiconductor') || lower.includes('chip') || lower.includes('fab'))` → return `'Semiconductor'` in `normalizeSectorKey()`. The `SECTOR_EXPORT['Semiconductor']` table already exists.  
**Impact:** Fixes §4.6 Gap 2. NVDA, QCOM, INTC, TSM will use the correct semiconductor supply prior.

#### P2-4: Implement CO-GRI Score Confidence Interval
**Files:** `src/services/cogriCalculationService.ts`, `src/components/company/CompanySummaryPanel.tsx`  
**Effort:** Medium (2–3 days)  
**Action:** Compute a ±uncertainty band based on the mix of DIRECT/ALLOCATED/MODELED/FALLBACK data. A simple heuristic: uncertainty = Σ(weight × tier_uncertainty_factor) where DIRECT=0.05, ALLOCATED=0.10, MODELED=0.20, FALLBACK=0.30. Display as "38.5 ± 4.2" in `CompanySummaryPanel`.  
**Impact:** Fixes §4.7-D, §4.9-E. Users can assess reliability of scores.

### Priority 3 — Medium (UI & Transparency Improvements)

#### P3-1: Surface Fallback Tier Per Country in Risk Attribution
**File:** `src/components/company/RiskAttribution.tsx`  
**Effort:** Low (4 hours)  
**Action:** Add a small badge (DIRECT/ALLOCATED/MODELED/FALLBACK) to each country row in the Risk Attribution component, reading from `countryExposure.tier` (once P1-3 is implemented) or `countryExposure.dataSource`.  
**Impact:** Fixes §4.9-B. Users can see data quality per country.

#### P3-2: Fix Ticker Name Resolution
**File:** `src/pages/modes/CompanyMode.tsx`  
**Effort:** Low (2 hours)  
**Action:** Use the `companyName` field returned by `getCompanyGeographicExposure()` instead of the hardcoded `ticker === 'AAPL' ? 'Apple Inc.' : '${ticker} Corporation'` pattern.  
**Impact:** Fixes §4.9-D. All tickers will show correct company names.

#### P3-3: Update COGRIAuditReport to Reflect V5 State
**File:** `src/pages/COGRIAuditReport.tsx`  
**Effort:** Medium (1 day)  
**Action:** Update Section 4 to document the V5 independent channel requirement. Update Section 10 AAPL case study to show correct Technology sector coefficients. Update Section 2 API status table. Add a new section documenting V5 implementation status.  
**Impact:** Fixes §4.10. Audit report accurately reflects current methodology.

#### P3-4: Gate Debug Logging Behind Environment Variable
**Files:** `src/services/cogriCalculationService.ts`, `src/services/geographicExposureService.ts`, `src/services/v5/*.ts`  
**Effort:** Low (2 hours)  
**Action:** Replace `console.log()` calls with a `debugLog()` helper that checks `import.meta.env.VITE_DEBUG_COGRI === 'true'`.  
**Impact:** Reduces production performance overhead and information leakage.

### Priority 4 — Lower (Future Enhancements)

#### P4-1: Wire Live SEC EDGAR API
**Files:** `src/services/secEdgarService.ts`, `src/services/structuredDataIntegrator.ts`  
**Effort:** Very High (2–4 weeks)  
**Action:** Replace simulated SEC responses with actual EDGAR full-text search API calls. Focus on Item 7 (revenue tables) and Notes to Financial Statements (PP&E, debt).  
**Impact:** Enables DIRECT tier evidence for all publicly traded companies, not just the 3 manually-verified ones.

#### P4-2: Add Unit Tests for Formula Layer
**Files:** New `src/services/cogriCalculationService.test.ts`  
**Effort:** Medium (3–5 days)  
**Action:** Write unit tests for `calculateCOGRIScore()` with known inputs/outputs, normalization edge cases, and political alignment boundary values (A_c = 0, 0.5, 1.0). Add regression tests for the Step 1.1 channel distinctness check.

#### P4-3: Complete Trading Signal Lens
**Files:** `src/components/company/CompanyTradingSignalView.tsx`, `src/components/company/TopRelevantRisks.tsx`  
**Effort:** High (1–2 weeks)  
**Action:** Connect the Trading Signal lens to the V5 risk data. Surface actual risk factors (dominant channel, political alignment, CSI) driving the trading recommendation.

#### P4-4: Supply Chain Time-Lag Modeling
**File:** `src/services/cogriCalculationService.ts`  
**Effort:** High (1–2 weeks)  
**Action:** Add a configurable delay parameter (default: 90 days) to the supply chain channel contribution, reflecting the typical 3–6 month lag between geopolitical events and supply chain disruption realization.

---

## 7. Appendix — Files Reviewed

| File Path | Lines | Key Finding |
|-----------|-------|-------------|
| `/workspace/uploads/V5 methodology (2).docx` | — | Source of truth for V5 requirements |
| `/workspace/uploads/Review Observations for New Dashboard.docx` | — | 12 specific shortcomings identified |
| `src/services/v5/structuredDataIntegratorV5.ts` | 1106 | ✅ V5 Steps 1.2–1.5, 2.1–2.4 correctly implemented |
| `src/services/v5/companySpecificChannelFix.ts` | 200 | ✅ Step 1.1 fix implemented but never called |
| `src/services/v5/channelBuilder.ts` | ~400 | ✅ Per-channel builders with DIRECT/ALLOCATED/MODELED tiers |
| `src/services/v5/channelPriors.ts` | 1544 | ✅ All four channel priors + V5 GF formula implemented |
| `src/services/cogriCalculationService.ts` | 395 | ⚠️ `dataSource` not in interface; no confidence interval |
| `src/services/geographicExposureService.ts` | ~1200 | ❌ V5 integrator not wired; legacy path used for all tickers |
| `src/pages/modes/CompanyMode.tsx` | 626 | ⚠️ Evidence tier bar uses `dataSource` not `tier`; name resolution limited |
| `src/pages/COGRIAuditReport.tsx` | 1268 | ⚠️ Section 4 documents pre-V5 behavior as current; needs update |
| `src/data/companySpecificExposures.ts` | ~300 | ❌ MSFT contains regional aggregates; all channels same weight |

---

*End of Report*

*This report was generated from static analysis of the CO-GRI platform source code as of 2026-03-26. It does not constitute investment advice. All gap assessments are based on cross-referencing the V5 methodology document, the Review Observations document, and the actual source code implementation.*