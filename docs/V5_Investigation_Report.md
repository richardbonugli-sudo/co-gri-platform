# CO-GRI V5 Methodology — Dashboard Investigation Report

**Date:** 2026-03-24  
**Prepared by:** David (Data Analyst)  
**Scope:** Deep investigation of 5 V5 methodology issues — no code changes made  
**Reference:** `/workspace/uploads/Implementation checklist V5 methodology changes.docx`

---

## Executive Summary

The codebase has undergone substantial V5 migration work. Many of the required changes are **partially or fully implemented** in the V5 service layer (`src/services/v5/`). However, several critical gaps remain where the **old V4/legacy logic is still active** in the main data pipeline, or where V5 logic exists but is not correctly wired end-to-end. The five issues below are analysed in order of the checklist.

---

## Issue 1 — Fallback Role Redefinition

### 1.1 What V5 Requires
The V5 checklist redefines fallback from a **weight-generating mechanism** to an **admissible-set constructor**. Fallback (SSF / RF / GF) must:
- Return a **set of plausible countries P** (not weights directly)
- Weights are then assigned by **channel-specific economic priors** (Issue 4)
- Fallback must never overwrite structured evidence
- Coverage ≥ 95% → fallback is suppressed entirely (Step 1.4)

### 1.2 Current State in Code

**V5 integrator (correctly implemented):**
- `src/services/v5/structuredDataIntegratorV5.ts` lines 286–322: `buildAdmissibleSetFromNarrative()` returns `{ admissibleSet, excludesHomeCountry, signalStrength }` — an admissible set, not weights. ✅
- Lines 427–467: Coverage check `getEvidenceCoverage() >= 0.95` suppresses fallback. ✅
- Lines 653–682: Last-resort GF calls `buildGlobalFallbackV5()` (channel-prior-weighted). ✅

**Legacy path (still active for non-company-specific tickers):**
- `src/services/fallbackLogic.ts` lines 412–554: `decideFallback()` returns `FallbackDecision.countries` — a **direct weight map**, not an admissible set. ❌
- `src/services/geographicExposureService.ts` lines 395–668: The main `calculateIndependentChannelExposuresWithSEC()` function calls `integrateStructuredData()` (the **V4 integrator** via `src/services/structuredDataIntegrator.ts`), not `structuredDataIntegratorV5`. ❌
- `src/services/structuredDataIntegrator.ts` (not fully read but imported at line 44 of geographicExposureService): routes through V5 integrators only for the V5 path — but the legacy `decideFallback()` in `fallbackLogic.ts` is still the fallback engine for non-V5 paths.

**V4 Orchestrator:**
- `src/services/v4/v4Orchestrator.ts` lines 62–120: `allocateChannel_V4()` calls `solveJointAllocation()` which uses `allocateWithPrior()` (V5 channel priors) for Pass 2/3. This is a **hybrid** — the joint solver uses V5 priors, but the overall orchestrator is still V4-structured. ⚠️

### 1.3 Gap Analysis
| Component | V5 Compliant? | Notes |
|-----------|--------------|-------|
| `structuredDataIntegratorV5.ts` | ✅ Yes | Admissible-set pattern implemented |
| `fallbackLogic.ts` `decideFallback()` | ❌ No | Still returns weight map directly |
| `geographicExposureService.ts` main path | ❌ No | Calls V4 integrator, not V5 |
| `v4Orchestrator.ts` joint solver | ⚠️ Partial | Uses V5 priors but V4 structure |

### 1.4 Suggested Next Steps
1. **Wire V5 integrator into main path**: In `geographicExposureService.ts`, replace the call to `integrateStructuredData()` (V4) with `structuredDataIntegratorV5` functions for all four channels.
2. **Deprecate `decideFallback()` weight-return pattern**: Refactor `fallbackLogic.ts` so `decideFallback()` returns an admissible set; weight assignment moves to `allocateWithPrior()`.
3. **Confirm coverage-gate is active**: Ensure the `>= 0.95` coverage check in V5 integrator is reached for all tickers, not bypassed by the V4 path.

---

## Issue 2 — Plausibility Separated from Magnitude

### 2.1 What V5 Requires
V5 requires a strict two-step process:
1. **Plausibility gate**: Is this country a plausible exposure? (binary: yes/no, based on admissible set P)
2. **Magnitude assignment**: How large is the exposure? (assigned by channel-specific prior, conditional on passing the plausibility gate)

These two steps must be **independent** — magnitude must never drive plausibility, and plausibility must never be inferred from magnitude.

### 2.2 Current State in Code

**V5 integrator (correctly separates):**
- `structuredDataIntegratorV5.ts` lines 286–322: `buildAdmissibleSetFromNarrative()` is purely a plausibility function — it returns country names only, no weights. ✅
- Lines 619–649: After admissible set is built, `allocateWithPrior()` assigns magnitudes separately. ✅

**Legacy path (conflates the two):**
- `fallbackLogic.ts` `applyGlobalFallback()` (lines 260–298): Computes `weight = gdp * prior` and returns weights directly — plausibility and magnitude are **merged** in a single GDP × sector-prior formula. ❌
- `fallbackLogic.ts` `applySegmentFallback()` (lines 308–356): Same pattern — `IndustryDemandProxy` drives both whether a country is included AND how much weight it gets. ❌
- `geographicExposureService.ts` template fallback (lines 526–641): `weight = isHome ? 0.85 : sectorTemplate[country] * 0.15` — magnitude directly determines inclusion (threshold `< 0.0001`). ❌

**`cogriCalculationService.ts`:**
- Not fully read in this session, but referenced throughout as the downstream consumer of `countryExposures`. The `channelWeights` field on `CountryExposure` (types/company.ts line 51) uses the shared `ExposureChannels` interface — this is correct structurally, but the values fed into it may still come from the conflated legacy path.

### 2.3 Gap Analysis
| Component | Separation Implemented? | Notes |
|-----------|------------------------|-------|
| `structuredDataIntegratorV5.ts` | ✅ Yes | Clean two-step: admissible set → prior weights |
| `fallbackLogic.ts` GF/SSF | ❌ No | GDP × prior conflates plausibility + magnitude |
| `geographicExposureService.ts` template fallback | ❌ No | Weight threshold used as plausibility gate |
| `v4Orchestrator.ts` joint solver | ⚠️ Partial | Pass 1 (direct) is clean; Pass 2/3 use prior correctly but no explicit plausibility gate |

### 2.4 Suggested Next Steps
1. **Refactor `applyGlobalFallback()` and `applySegmentFallback()`**: Split into (a) `buildPlausibleSet(sector, homeCountry, knownZeros)` returning `string[]`, and (b) `assignMagnitudes(plausibleSet, channel, sector)` calling `allocateWithPrior()`.
2. **Remove GDP-threshold-as-plausibility**: The `if (normalizedWeight > 0.001)` filter in `applyGlobalFallback()` line 290 is a magnitude-based plausibility gate — replace with an explicit plausibility criterion (e.g., country must be in `GLOBAL_COUNTRIES` and not sanctioned/microstate).
3. **Audit template fallback**: The `0.0001` threshold in `geographicExposureService.ts` line 501/623 is acceptable as a display filter but must not be the plausibility gate.

---

## Issue 3 — SSF / RF / GF Weighting Replacement

### 3.1 What V5 Requires
V5 replaces the old SSF/RF/GF **weight formulas** with a unified pattern:
- **SSF**: Region membership known → allocate region total using **channel-specific prior** within the region
- **RF**: Partial evidence → build restricted set P from narrative/context → allocate using **channel-specific prior** within P
- **GF**: No evidence → build global admissible set → allocate using **V5 GF formula**: `p_c = λ·HomeBias(c) + (1-λ)·GlobalPrior_channel_sector(c)`

The old GF was a fixed 85/15 home-country split (see Issue 5). The old SSF/RF used `IndustryDemandProxy` (GDP × sector scalar) — this is replaced by the four channel-specific prior formulas.

### 3.2 Current State in Code

**V5 channel priors (fully implemented):**
- `src/services/v5/channelPriors.ts`: All four prior functions implemented:
  - `getRevenuePrior()` (line 1266): GDP^0.25 × HouseholdConsumption^0.35 × SectorDemand^0.30 × MarketAccess^0.10 ✅
  - `getSupplyPrior()` (line 1296): ManufacturingVA^0.20 × SectorExport^0.30 × AssemblyCapability^0.25 × Logistics^0.10 × IORelevance^0.15 ✅
  - `getAssetsPrior()` (line 1328): CapitalStock^0.30 × SectorAssetSuitability^0.35 × Infrastructure^0.20 × ResourceFit^0.15 ✅
  - `getFinancialPrior()` (line 1358): FinancialDepth^0.35 × CurrencyExposure^0.30 × CrossBorderCapital^0.20 × FundingHub^0.15 ✅
- `allocateWithPrior()` (line 1406): Normalizes raw priors within admissible set P. ✅
- `buildGlobalFallbackV5()` (line 1478): Implements V5 GF formula with `HOME_BIAS_LAMBDA` per channel. ✅

**Legacy SSF/RF/GF (still active in main path):**
- `fallbackLogic.ts` `applySegmentFallback()` (lines 308–356): Uses `getIndustryDemandProxy()` — the old formula. ❌
- `fallbackLogic.ts` `applyGlobalFallback()` (lines 260–298): Uses `COUNTRY_GDP_2023 × SECTOR_PRIORS` — the old formula. ❌
- `src/services/channelSpecificFallback.ts` (imported at fallbackLogic.ts line 42): `getIndustryDemandProxy()` is the old channel-specific fallback — not the V5 prior formulas. ❌

**V5 integrator uses V5 priors:**
- `structuredDataIntegratorV5.ts` lines 248, 312, 340, 387, 624: All calls to `allocateWithPrior()` and `buildGlobalFallbackV5()` — correctly using V5 priors. ✅

**V4 orchestrator uses V5 priors (GAP 3 FIX):**
- `v4Orchestrator.ts` lines 103–110: `solveJointAllocation()` calls `allocateWithPrior()` from V5 channelPriors. ✅ (This is the GAP 3 fix already applied.)

### 3.3 Gap Analysis
| Component | V5 Priors Used? | Notes |
|-----------|----------------|-------|
| `channelPriors.ts` | ✅ Implemented | All four prior formulas correct |
| `structuredDataIntegratorV5.ts` | ✅ Yes | All allocations use V5 priors |
| `v4Orchestrator.ts` joint solver | ✅ Yes | GAP 3 fix applied |
| `fallbackLogic.ts` SSF/GF | ❌ No | Still uses old IndustryDemandProxy / GDP×SectorPrior |
| `geographicExposureService.ts` template path | ❌ No | Uses hardcoded 85/15 + sectorTemplate |

### 3.4 Suggested Next Steps
1. **Replace `applySegmentFallback()` and `applyGlobalFallback()`** in `fallbackLogic.ts` with calls to `allocateWithPrior()` and `buildGlobalFallbackV5()` from `channelPriors.ts`.
2. **Retire `getIndustryDemandProxy()`** in `channelSpecificFallback.ts` — it is superseded by the four V5 prior functions.
3. **Retire `SECTOR_PRIORS` and `COUNTRY_GDP_2023`** in `fallbackLogic.ts` as the primary weighting mechanism — they may be retained as reference data but must not drive fallback weights.
4. **Ensure `geographicExposureService.ts` template path** calls `buildGlobalFallbackV5()` instead of the hardcoded sector template for the last-resort fallback.

---

## Issue 4 — Channel-Specific Priors Introduction

### 4.1 What V5 Requires
Each of the four channels (Revenue, Supply, Assets, Financial) must use a **distinct economic prior** when allocating weights within an admissible set. The priors must reflect the economic reality of each channel:
- Revenue: consumer demand / market size
- Supply: manufacturing capability / export capacity
- Assets: capital stock / infrastructure
- Financial: financial depth / currency exposure

The old system used a single GDP-weighted prior for all channels (channel contamination).

### 4.2 Current State in Code

**Channel priors — fully implemented in V5:**
- `channelPriors.ts` lines 1–1537: Complete implementation of all four channel-specific prior tables and formulas. ✅
- Raw data tables present: `GDP_TRILLION`, `HOUSEHOLD_CONSUMPTION_SHARE`, `SECTOR_DEMAND`, `MANUFACTURING_VA`, `SECTOR_EXPORT`, `ASSEMBLY_CAPABILITY`, `LOGISTICS_INDEX`, `FINANCIAL_DEPTH`, `CURRENCY_EXPOSURE`, `CROSS_BORDER_CAPITAL`, `FUNDING_HUB`, `CAPITAL_STOCK`, `INFRASTRUCTURE`. ✅
- Critical note (line 1291): Supply prior "HEAVILY suppresses US and Germany for technology hardware. China, Taiwan, Vietnam, South Korea, India must dominate." ✅

**Channel independence fix — implemented:**
- `src/services/v5/companySpecificChannelFix.ts`: `buildIndependentChannelBreakdown()` builds separate channel data per country. ✅
- `src/services/v5/channelBuilder.ts`: `buildChannelDataForCountry()` assigns channel-specific priors per country. ✅
- `geographicExposureService.ts` lines 352–355: For company-specific tickers, `buildIndependentChannelBreakdown()` is called. ✅

**Channel contamination — still present in legacy path:**
- `geographicExposureService.ts` lines 460–523 (SEC path): Each channel reads from `secIntegration.revenueChannel`, `supplyChannel`, etc. — these are populated by `integrateStructuredData()` (V4 integrator). The V4 integrator may not use channel-specific priors for all fallback cases. ⚠️
- `geographicExposureService.ts` lines 555–641 (template fallback): Revenue, supply, assets, financial all derive from the same base `weight` variable (line 557), with only crude adjustments (supply × 0.05 for tech home country, assets × 1.35). This is NOT channel-specific priors. ❌

**Sector normalization in priors:**
- `channelPriors.ts` `normalizeSectorKey()` (line 1225): Maps sector strings to prior table keys. Works for Technology/Healthcare/Energy/Financial/Consumer. ✅
- Gap: "Manufacturing", "Telecommunications", "Retail" sectors fall through to `'Technology'` default (line 1245). ⚠️

### 4.3 Gap Analysis
| Component | Channel-Specific Priors? | Notes |
|-----------|------------------------|-------|
| `channelPriors.ts` | ✅ Implemented | All four priors with full data tables |
| `companySpecificChannelFix.ts` | ✅ Yes | Independent channels per country |
| `structuredDataIntegratorV5.ts` | ✅ Yes | Each channel calls correct prior |
| `geographicExposureService.ts` template fallback | ❌ No | Single base weight with crude adjustments |
| `geographicExposureService.ts` SEC path (non-company-specific) | ⚠️ Partial | Depends on V4 integrator's fallback quality |
| `normalizeSectorKey()` | ⚠️ Partial | Manufacturing/Telecom/Retail default to Technology |

### 4.4 Suggested Next Steps
1. **Replace template fallback** in `geographicExposureService.ts` lines 555–641: Call `buildGlobalFallbackV5(homeCountry, channel, sector)` separately for each of the four channels.
2. **Extend `normalizeSectorKey()`**: Add mappings for `'Manufacturing'` → `'Technology Hardware'` (or a new Manufacturing prior table), `'Telecommunications'` → `'Technology'`, `'Retail'` → `'Consumer Goods'`.
3. **Add Manufacturing and Telecom sector tables** to `SECTOR_DEMAND`, `SECTOR_EXPORT`, `ASSEMBLY_CAPABILITY` in `channelPriors.ts` to avoid defaulting to Technology.
4. **Audit V4 integrator fallback paths**: Confirm that `integrateStructuredData()` (V4) uses `allocateWithPrior()` with the correct channel type for each channel's fallback — or replace with V5 integrator calls.

---

## Issue 5 — Fixed GF (85/15) Replacement

### 5.1 What V5 Requires
The old Global Fallback used a fixed **85% home country / 15% rest-of-world** split. V5 replaces this with:

```
p_c = λ · HomeBias(c) + (1 - λ) · GlobalPrior_channel_sector(c)
```

Where `HOME_BIAS_LAMBDA` is **channel-specific**:
- Revenue: λ = 0.25
- Supply: λ = 0.10 (supply chains are globally dispersed)
- Assets: λ = 0.35 (physical assets tend to be home-country-heavy)
- Financial: λ = 0.30

### 5.2 Current State in Code

**V5 GF formula — fully implemented:**
- `channelPriors.ts` lines 1447–1519: `HOME_BIAS_LAMBDA` constants and `buildGlobalFallbackV5()` function. ✅
- `applyGFV5()` (line 1457): Single-country GF formula. ✅
- `buildGlobalFallbackV5()` (line 1478): Full distribution across universe. ✅

**V5 integrator uses V5 GF:**
- `structuredDataIntegratorV5.ts` lines 443, 483, 658, 879, 1065: All GF calls use `buildGlobalFallbackV5()`. ✅

**Legacy 85/15 — still present:**
- `geographicExposureService.ts` line 557: `const weight = isHome ? 0.85 : (sectorTemplate[country] || 0.01) * 0.15` — **hardcoded 85/15 split**. ❌
- `geographicExposureService.ts` `getCompanyGeographicExposureSync()` lines 817–820: `revenuePercentage: 85` for home country — **hardcoded 85%**. ❌
- `fallbackLogic.ts` `applyGlobalFallback()` (lines 260–298): Does not use `HOME_BIAS_LAMBDA` — uses raw GDP × sector prior without home-bias term. ❌ (Different bug: missing home bias entirely rather than using wrong lambda.)
- `src/services/restrictedFallback.ts` (imported by fallbackLogic.ts): Not read in this session, but likely contains legacy RF weight formulas.

**Channel coefficients (separate from GF):**
- `geographicExposureService.ts` lines 143–163: `DEFAULT_EXPOSURE_COEFFICIENTS` (α=0.40, β=0.35, γ=0.15, δ=0.10) and `SECTOR_EXPOSURE_COEFFICIENTS` per sector. These are the **blending coefficients** (how much each channel contributes to the final CO-GRI score), NOT the GF lambda values. These appear correct and consistent with V5. ✅
- `types/company.ts` lines 24–36: `ExposureChannels` interface documents the same coefficients. ✅

### 5.3 Gap Analysis
| Component | V5 GF Formula Used? | Notes |
|-----------|--------------------|----|
| `channelPriors.ts` `buildGlobalFallbackV5()` | ✅ Implemented | Correct λ per channel |
| `structuredDataIntegratorV5.ts` | ✅ Yes | All GF calls use V5 formula |
| `geographicExposureService.ts` template fallback | ❌ No | Hardcoded 85/15 |
| `geographicExposureService.ts` sync function | ❌ No | Hardcoded 85% home country |
| `fallbackLogic.ts` `applyGlobalFallback()` | ❌ No | Missing home-bias term entirely |

### 5.4 Suggested Next Steps
1. **Replace hardcoded 85/15** in `geographicExposureService.ts` line 557: Call `buildGlobalFallbackV5(homeCountry, channel, sector)` for each channel separately.
2. **Replace `getCompanyGeographicExposureSync()` home-country 85%**: This sync function is used as a fallback — it should also use `buildGlobalFallbackV5()` or at minimum use the channel-specific lambda values.
3. **Add home-bias term to `applyGlobalFallback()`** in `fallbackLogic.ts`: Either refactor to call `buildGlobalFallbackV5()`, or add `HOME_BIAS_LAMBDA` application.
4. **Verify lambda values are not confused with blending coefficients**: The α/β/γ/δ coefficients in `geographicExposureService.ts` lines 143–163 are correct blending weights — ensure they are not accidentally used as λ in GF formula.

---

## Cross-Cutting Findings

### A. V5 Pipeline Wiring Gap (Critical)
The most significant gap is that **`geographicExposureService.ts` does not call the V5 integrator** for non-company-specific tickers. The main pipeline is:

```
getCompanyGeographicExposure()
  → calculateIndependentChannelExposuresWithSEC()
    → integrateStructuredData()  ← V4 integrator (structuredDataIntegrator.ts)
    OR
    → buildIndependentChannelBreakdown()  ← V5 (only for company-specific tickers)
```

The V5 integrator (`structuredDataIntegratorV5.ts`) is only reached via `structuredDataIntegrator.ts` which routes to it — but the routing logic needs verification to confirm V5 functions are called for all channels.

### B. Evidence Tier Labels (Fix 2 — Partially Done)
- `types/company.ts` line 47: `dataSource?: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK'` — field exists. ✅
- `structuredDataIntegratorV5.ts` `determineTier()` (lines 97–111): Tier assignment logic implemented. ✅
- `CompanyMode.tsx` lines 326–370: Evidence tier summary bar renders DIRECT/ALLOCATED/MODELED/FALLBACK badges. ✅
- Gap: The `dataSource` field on `CountryExposure` must be populated from the `tier` field in `IntegratedChannelDataV5` — this mapping needs verification in `cogriCalculationService.ts`.

### C. `cogriCalculationService.ts` Field Name Fix (Fix 5 — Done)
- `types/company.ts` lines 22–36: `ExposureChannels.financial` (not "operations") — canonical field name documented. ✅
- `geographicExposureService.ts` line 512: `channelBreakdown[country]` writes `financial:` key. ✅
- Comment at line 77–79: "BUG #5 FIX: Renamed from 'operations' to 'financial'". ✅

### D. Residual Label Handling (GAP 4 — Done in V5)
- `structuredDataIntegratorV5.ts` lines 34–57: `RESIDUAL_SENTINEL` pattern and `ALL_KNOWN_COUNTRIES` list. ✅
- Lines 379–408: Residual buckets ("International", "Other", "Rest of World") distributed across unconstrained countries via revenue prior. ✅
- `v4Orchestrator.ts` lines 230–348: `RESIDUAL_LABELS` set and Pass 3 in `solveJointAllocation()`. ✅

### E. Double-Counting Fix (GAP 3 — Done in V4 Orchestrator)
- `v4Orchestrator.ts` lines 92–354: Joint allocation solver replaces label-by-label `mergeAdd()` loop. ✅
- Three-pass approach (DIRECT → REGION/BUCKET → RESIDUAL) prevents double-counting. ✅

---

## Priority Matrix

| Issue | Severity | V5 Code Exists? | Wired to Main Path? | Effort |
|-------|----------|----------------|--------------------|----|
| 1. Fallback Role Redefinition | 🔴 High | ✅ Yes | ❌ No | Medium |
| 2. Plausibility vs Magnitude | 🔴 High | ✅ Yes (V5 path) | ❌ No (legacy path) | Medium |
| 3. SSF/RF/GF Weighting | 🟠 Medium | ✅ Yes | ❌ No (legacy path) | Medium |
| 4. Channel-Specific Priors | 🟠 Medium | ✅ Yes | ⚠️ Partial | Low-Medium |
| 5. Fixed GF 85/15 Replacement | 🔴 High | ✅ Yes | ❌ No (template path) | Low |

---

## Recommended Fix Order

1. **Fix 5 first** (lowest effort, highest visibility): Replace hardcoded 85/15 in `geographicExposureService.ts` with `buildGlobalFallbackV5()`.
2. **Fix 1 + 2 together** (same root cause): Wire V5 integrator into main pipeline for non-company-specific tickers; refactor `fallbackLogic.ts` to return admissible sets.
3. **Fix 3** (follows from Fix 1+2): Once V5 integrator is wired, old SSF/RF/GF weight formulas in `fallbackLogic.ts` can be retired.
4. **Fix 4** (cleanup): Extend `normalizeSectorKey()` and add missing sector tables; replace template fallback channel weights with per-channel `buildGlobalFallbackV5()` calls.

---

## File Reference Index

| File | Relevance | Key Lines |
|------|-----------|-----------|
| `src/services/v5/channelPriors.ts` | Issues 3, 4, 5 | 1266–1519 (prior functions + GF formula) |
| `src/services/v5/structuredDataIntegratorV5.ts` | Issues 1, 2, 3, 4, 5 | 97–111 (tier), 286–322 (admissible set), 427–467 (coverage gate) |
| `src/services/v5/companySpecificChannelFix.ts` | Issue 4 | buildIndependentChannelBreakdown() |
| `src/services/v5/channelBuilder.ts` | Issue 4 | buildChannelDataForCountry() |
| `src/services/geographicExposureService.ts` | Issues 1, 2, 3, 4, 5 | 143–163 (coefficients), 310–668 (main calc), 555–641 (template fallback) |
| `src/services/fallbackLogic.ts` | Issues 1, 2, 3, 5 | 260–298 (GF), 308–356 (SSF), 412–554 (decideFallback) |
| `src/services/v4/v4Orchestrator.ts` | Issues 1, 3 | 62–120 (allocateChannel_V4), 248–351 (joint solver) |
| `src/services/cogriCalculationService.ts` | Issues 2, 4 | (channel blending, dataSource mapping) |
| `src/services/structuredDataIntegrator.ts` | Issue 1 | (V4→V5 routing) |
| `src/types/company.ts` | Issues 2, 4, 5 | 24–36 (ExposureChannels), 44–47 (dataSource tier) |
| `src/pages/modes/CompanyMode.tsx` | Issue 2 | 326–370 (tier summary bar) |

---

*End of Investigation Report — No code changes were made during this investigation.*