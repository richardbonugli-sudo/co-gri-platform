# Report 2: Full Runtime Source-of-Truth Audit

**Generated:** 2026-04-07  
**Scope:** Complete runtime execution path audit for all company tiers in the CO-GRI Dashboard  
**Methodology:** Read-only codebase audit — grep analysis, full file reads, cross-reference with Report 1  
**Auditor:** David (Data Analyst, Atoms Team)  
**Key Files Audited:**
- `src/services/v5/liveEdgarPipeline.ts`
- `src/services/v5/companySpecificChannelFix.ts`
- `src/services/v5/structuredDataIntegratorV5.ts`
- `src/services/v5/channelBuilder.ts`
- `src/services/v5/channelPriors.ts`
- `src/services/geographicExposureService.ts`
- `src/services/cogriCalculationService.ts`
- `src/services/runtimeValidation.ts`
- `src/services/narrativeParser.ts` (via grep)
- `src/services/structuredDataIntegrator.ts` (via grep)
- `src/services/secFilingParser.ts`
- `src/data/companySpecificExposures.ts`
- `src/pages/modes/CompanyMode.tsx`
- `src/components/company/RiskContributionMap.tsx`
- `src/components/company/ExposurePathways.tsx`
- `src/components/company/TopRelevantRisks.tsx`
- `src/services/calculations/deriveCompanyAnalytics.ts`

---

## Executive Summary

| Category | Finding |
|---|---|
| Companies on **fully live V5 path** (DIRECT evidence confirmed) | **3** (AAPL, TSLA, MSFT) — Tier 1 only |
| Companies on **partially live V5 path** (SEC integration attempted, may succeed) | **~60** US domestic NASDAQ/NYSE tickers |
| Companies **not on intended live path** (always GF fallback) | **~196** (all international exchange + ADRs + non-SEC filers) |
| Panel data flow: Exposure Pathways and Top Risk Contributors | ✅ **Same object** — both read `companyData.countryExposures` via `deriveCompanyAnalytics()` (R8 fix) |
| SEC EDGAR fetch: real live calls | ✅ Active for Tier 1 (`LEGACY_STATIC_OVERRIDE=false`) |
| Narrative parser: real parse vs simulated | ⚠️ Real parse attempted; simulated guard in `buildAdmissibleSetFromNarrative()` prevents template injection |
| Supply-chain ingestion: live vs fallback | ⚠️ `channelFallbackService.ts` sector templates used for all non-Tier-1 supply data |
| Score uncertainty propagation | ✅ Computed in `cogriCalculationService.ts`, surfaced in `CompanySummaryPanel` |
| Channel differentiation (4 independent channels) | ✅ Tier 1 only; ⚠️ all others depend on SEC parse success |

---

## Section 1: Runtime Execution Path — Full Decision Tree

The complete runtime execution path for any ticker entered in Company Mode follows this strict priority hierarchy, implemented in `geographicExposureService.ts → calculateIndependentChannelExposuresWithSEC()`:

```
INPUT: ticker, sector, homeCountry
│
├─► Priority 1: hasCompanySpecificExposure(ticker)?
│     YES → companySpecificExposures.ts (AAPL, TSLA, MSFT only)
│           │
│           ├─► buildIndependentChannelBreakdown() [companySpecificChannelFix.ts]
│           │     → 4 independent channel vectors (revenue/supply/assets/financial)
│           │     → Each channel uses buildRevenueChannelData() / buildSupplyChannelData() etc.
│           │     → Per-channel tier: DIRECT if explicit %, ALLOCATED if blended %, MODELED if prior
│           │
│           ├─► fetchLiveOrFallback(ticker) [liveEdgarPipeline.ts]
│           │     LEGACY_STATIC_OVERRIDE = false → live pipeline active
│           │     │
│           │     ├─► Cache hit? → return cached entry (fromCache=true)
│           │     ├─► fetchSECFilingText(ticker) → EDGAR submissions API → 10-K text
│           │     │     Success → parseNarrativeText(text) → integrateStructuredData()
│           │     │     Failure/Empty → return {liveDataAvailable: false, source: 'static-snapshot-fallback'}
│           │     └─► upgradeChannelBreakdownWithSEC() — upgrades MODELED entries only
│           │           DIRECT/ALLOCATED entries from static table are NEVER downgraded
│           │
│           └─► Return channelBreakdown (static + optional SEC upgrade)
│
└─► Priority 2: Non-Tier-1 ticker
      │
      ├─► integrateStructuredData(ticker) [structuredDataIntegrator.ts]
      │     → parseSECFiling(ticker) → SEC EDGAR API (real fetch attempt)
      │     → fetchSustainabilityReport(ticker)
      │     → integrateRevenueChannelV5() / integrateSupplyChannelV5() / etc.
      │     │
      │     ├─► SEC data found → SSF (region allocation with prior) or DIRECT
      │     ├─► Partial SEC data → RF (restricted fallback)
      │     └─► No SEC data → GF (V5 Global Fallback via buildGlobalFallbackV5())
      │
      └─► Return channelBreakdown (all entries tagged tier='MODELED', fallbackType='GF' if GF path)
```

---

## Section 2: Tier-by-Tier Execution Path Detail

### 2.1 Tier 1 — Company-Specific Override (AAPL, TSLA, MSFT)

**Entry condition:** `hasCompanySpecificExposure(ticker)` returns `true`  
**File:** `src/data/companySpecificExposures.ts`  
**Schema:** V2 (2026-03-30) — four per-channel percentages per country

#### Static Channel Breakdown (always built first — R1 FIX)

`buildIndependentChannelBreakdown()` in `companySpecificChannelFix.ts` builds four independent channel vectors:

| Channel Builder | Evidence Source | Tier Assigned |
|---|---|---|
| `buildRevenueChannelData()` | `revenuePercentage` if present → DIRECT; `percentage` (blended) → DIRECT; prior → MODELED |
| `buildSupplyChannelData()` | `supplyPercentage` if present → DIRECT; `percentage` (blended) → ALLOCATED; prior → MODELED |
| `buildAssetsChannelData()` | `assetsPercentage` if present → DIRECT; `percentage` (blended) → ALLOCATED; prior → MODELED |
| `buildFinancialChannelData()` | `financialPercentage` if present → DIRECT; `percentage` (blended) → ALLOCATED; prior → MODELED |

**Channel distinctness validation (Fix 4):** After building, `buildIndependentChannelBreakdown()` checks that the four channel weight vectors are NOT identical. If all four channels have the same weight for the top country (cosine similarity = 1.0), a `console.error` is emitted. This guards against regression to the pre-V5 shared-channelData bug.

**Normalization:** Each channel is independently normalized to sum to 1.0 before blending.

#### Live EDGAR Upgrade Pass

After the static breakdown is built, `fetchLiveOrFallback()` is called:

| Condition | Result |
|---|---|
| `LEGACY_STATIC_OVERRIDE = true` | Skip live fetch; return `source: 'static-snapshot-legacy'` |
| `LEGACY_STATIC_OVERRIDE = false` (current) | Attempt live fetch |
| Cache hit (`_livePipelineCache` Map) | Return cached entry; `fromCache: true` |
| `fetchSECFilingText()` returns empty/null | `liveDataAvailable: false`; `source: 'static-snapshot-fallback'` |
| `fetchSECFilingText()` throws | `liveDataAvailable: false`; `source: 'static-snapshot-fallback'` |
| `integrateStructuredData()` returns no channel data | `liveDataAvailable: false`; `source: 'static-snapshot-fallback'` |
| Full success | Cache result; `liveDataAvailable: true`; `source: 'live-edgar'` |

**Critical R1 Fix:** When `liveDataAvailable=true`, `upgradeChannelBreakdownWithSEC()` is called. It upgrades **only MODELED entries** — DIRECT and ALLOCATED entries from the static table are **never downgraded**. This preserves channel differentiation (e.g., Apple: China revenue=16.9% vs supply=35.0%) even when live EDGAR data is available.

#### AAPL Specific Channel Data (Schema V2)

| Country | Revenue% | Supply% | Assets% | Financial% | Dominant Channel |
|---|---|---|---|---|---|
| United States | 42.3 | 5.0 | 65.0 | 70.0 | Assets/Financial |
| China | 16.9 | 35.0 | 12.0 | 3.0 | Supply |
| Taiwan | 1.5 | 25.0 | 2.0 | 0.5 | Supply |
| Germany | 8.0 | 3.0 | 3.0 | 1.5 | Revenue |
| Japan | 6.3 | 6.0 | 4.0 | 1.0 | Revenue |
| United Kingdom | 5.5 | 1.0 | 2.5 | 2.0 | Revenue |
| France | 5.0 | 0.5 | 1.5 | 1.5 | Revenue |

#### TSLA Specific Channel Data (Schema V2)

| Country | Revenue% | Supply% | Assets% | Financial% | Dominant Channel |
|---|---|---|---|---|---|
| United States | 45.6 | 30.0 | 55.0 | 60.0 | Assets/Financial |
| China | 22.3 | 25.0 | 30.0 | 5.0 | Revenue/Supply |
| Germany | 8.7 | 8.0 | 10.0 | 3.0 | Revenue |
| Netherlands | 4.2 | 1.0 | 1.0 | 2.0 | Revenue |
| Norway | 3.8 | 0.5 | 0.5 | 0.5 | Revenue |

#### MSFT Specific Channel Data (Schema V2)

| Country | Revenue% | Supply% | Assets% | Financial% | Dominant Channel |
|---|---|---|---|---|---|
| United States | 45.5 | 15.0 | 60.0 | 55.0 | Assets/Financial |
| China | 14.3 | 10.0 | 8.0 | 5.0 | Revenue |
| Japan | 11.1 | 3.0 | 5.0 | 3.0 | Revenue |
| Germany | 4.5 | 2.0 | 3.0 | 2.0 | Revenue |
| United Kingdom | 3.8 | 1.5 | 2.5 | 3.0 | Revenue |

---

### 2.2 Tier 2 — V4 Enhanced (GOOGL and EDGE test cases)

**Entry condition:** `hasCompanySpecificExposure(ticker)` returns `false` → routes to SEC integration  
**Note:** GOOGL has V4 enhanced data in `enhancedCompanyExposures.ts` but **no Tier 1 override** in `companySpecificExposures.ts`. It therefore follows the non-Tier-1 path.

**Execution path for GOOGL:**
1. `hasCompanySpecificExposure('GOOGL')` → `false`
2. `integrateStructuredData('GOOGL', 'United States', 'Technology')`
3. `parseSECFiling('GOOGL')` → attempts real EDGAR fetch (CIK: `0001652044`)
4. If EDGAR returns revenue table → `integrateRevenueChannelV5()` → DIRECT/ALLOCATED tiers
5. If EDGAR fails → `buildGlobalFallbackV5()` → all MODELED tier
6. Channel differentiation: depends entirely on SEC parse success at runtime

**Known issue:** GOOGL is the highest-profile company without a Tier 1 override. Its channel outputs are non-deterministic across sessions (depends on EDGAR API availability).

---

### 2.3 Tier 3/4 — All Other US Domestic Tickers (NASDAQ/NYSE)

**Entry condition:** Not in `companySpecificExposures.ts`  
**Execution path:**
1. `integrateStructuredData(ticker, homeCountry, sector)` called
2. `parseSECFiling(ticker)` → `getCIKFromTicker(ticker)` → EDGAR submissions API
3. CIK resolution: hardcoded map in `secFilingParser.ts` for ~50 major tickers; Supabase Edge Function for others
4. If CIK found → fetch most recent 10-K → parse HTML tables + XBRL + narrative
5. Revenue table found → `integrateRevenueChannelV5()` → DIRECT/ALLOCATED
6. PP&E table found → `integrateAssetsChannelV5()` → DIRECT/ALLOCATED
7. Debt table found → `integrateFinancialChannelV5()` → DIRECT/ALLOCATED
8. Supplier list found → `integrateSupplyChannelV5()` → DIRECT/ALLOCATED
9. Any channel missing → `buildGlobalFallbackV5()` for that channel → MODELED

**SEC EDGAR success/failure conditions:**

| Condition | Outcome | Tier |
|---|---|---|
| CIK found + 10-K HTML fetched + revenue table parsed | Revenue: DIRECT | DIRECT |
| CIK found + 10-K HTML fetched + regional segments only | Revenue: ALLOCATED (prior-weighted within region) | ALLOCATED |
| CIK found + 10-K HTML fetched + no revenue table | Revenue: GF fallback | MODELED |
| CIK not found (Supabase Edge Function fails) | All channels: GF fallback | MODELED |
| Network error / rate limit | All channels: GF fallback | MODELED |
| Non-US company (no SEC filing) | All channels: GF fallback | MODELED |

**Hardcoded CIK map coverage** (from `secFilingParser.ts`):

| Ticker | CIK | Coverage |
|---|---|---|
| AAPL | 0000320193 | ✅ |
| MSFT | 0000789019 | ✅ |
| GOOGL/GOOG | 0001652044 | ✅ |
| AMZN | 0001018724 | ✅ |
| TSLA | 0001318605 | ✅ |
| META | 0001326801 | ✅ |
| NVDA | 0001045810 | ✅ |
| JPM | 0000019617 | ✅ |
| JNJ | 0000200406 | ✅ |
| WMT | 0000104169 | ✅ |
| NFLX | 0001065280 | ✅ |
| INTC | 0000050863 | ✅ |
| AMD | 0000002488 | ✅ |
| QCOM | 0000804328 | ✅ |
| NKE | 0000320187 | ✅ |
| BABA | 0001577552 | ✅ (ADR — files 20-F) |
| TSM | 0001046179 | ✅ (ADR — files 20-F) |
| ~35 others | Hardcoded | ✅ |
| All other tickers | Supabase Edge Function | ⚠️ Network-dependent |

---

### 2.4 Tier 4 — ADR Companies (~100 tickers)

**Entry condition:** Not in `companySpecificExposures.ts`  
**Execution path:** Same as Tier 3/4 US domestic, but with additional ADR resolution step:
1. `resolveADRCountry(ticker)` → determines actual home country (e.g., BABA → China)
2. `integrateStructuredData()` with resolved home country
3. For US-listed ADRs that file 20-F with SEC (BABA, TSM, etc.): CIK may be available → EDGAR fetch attempted
4. For most ADRs: no SEC filing → GF fallback for all channels

**ADR-specific known issues:**
- Most ADRs do not file 10-K with SEC; they file 20-F or nothing
- `parseSECFiling()` is optimized for 10-K format; 20-F parsing may be incomplete
- Expected outcome: most ADR tickers → all channels MODELED/GF

---

### 2.5 Tier 4 — International Exchange Companies (~100 tickers)

**Entry condition:** Not in `companySpecificExposures.ts`; non-US exchange (TSX, LSE, HKEX, SGX, B3, TWSE, JSE, BVC)  
**Execution path:**
1. `integrateStructuredData()` called
2. `parseSECFiling()` → CIK lookup fails (no SEC filing)
3. All four channels → `buildGlobalFallbackV5()` → MODELED tier
4. `channelFallbackService.ts` sector templates used for supply chain
5. All outputs: `evidenceType='fallback'`, `fallbackType='GF'`, `tier='MODELED'`

**This is the expected and documented behaviour** — international companies do not file with the SEC. The V5 GF formula uses channel-specific λ priors (revenue λ=0.25, supply λ=0.10, assets λ=0.35, financial λ=0.30) to allocate exposure across countries based on sector-specific GDP/manufacturing/capital-stock weights.

---

## Section 3: SEC EDGAR Fetch — Success/Failure Handling

### 3.1 Live EDGAR Pipeline (Tier 1 only — `liveEdgarPipeline.ts`)

```
fetchLiveOrFallback(ticker, homeCountry, sector)
│
├─► LEGACY_STATIC_OVERRIDE = true → immediate return (static-snapshot-legacy)
│
├─► Cache hit → return cached (fromCache=true, no network call)
│
└─► Cache miss → fetchSECFilingText(ticker)
      │
      ├─► Empty/null response
      │     → log warning: "Live EDGAR fetch returned empty text"
      │     → return {liveDataAvailable: false, source: 'static-snapshot-fallback'}
      │
      ├─► Network error / exception
      │     → catch block: log warning with error details
      │     → return {liveDataAvailable: false, source: 'static-snapshot-fallback'}
      │
      └─► Non-empty text → parseNarrativeText(text) → integrateStructuredData()
            │
            ├─► integrateStructuredData() returns no channel data
            │     → log warning: "V5 integration returned no channel data"
            │     → return {liveDataAvailable: false, source: 'static-snapshot-fallback'}
            │
            └─► Channel data found → cache result → return {liveDataAvailable: true, source: 'live-edgar'}
```

**Cache behaviour:**
- Cache key: `ticker.toUpperCase()`
- Cache type: In-memory `Map<string, LivePipelineCacheEntry>` — module-level singleton
- TTL: **None** — session-lifetime only (cleared on page reload)
- Cache expiry risk: Stale data if application runs for extended periods without restart
- Manual clear: `clearLivePipelineCache(ticker?)` available for testing

### 3.2 SEC Structured Data Integration (All non-Tier-1 tickers — `structuredDataIntegrator.ts`)

```
integrateStructuredData(ticker, homeCountry, sector)
│
├─► parseSECFiling(ticker) → getCIKFromTicker(ticker)
│     │
│     ├─► CIK in hardcoded map → use directly
│     ├─► CIK not in map → Supabase Edge Function 'fetch_sec_cik'
│     │     → 3 retries with exponential backoff (1s, 2s, 4s)
│     │     → On failure: return null CIK
│     └─► null CIK → parseSECFiling returns null → all channels → GF fallback
│
├─► CIK found → fetch EDGAR submissions → get most recent 10-K filing URL
│     → fetch 10-K HTML → parse with cheerio
│     → extract revenue tables, PP&E tables, debt tables, supplier lists
│     → LLM narrative extractor (FIX #5) for sections not captured by table parser
│     → Exhibit 21 subsidiary parser (Phase 1)
│
├─► integrateRevenueChannelV5(secData, homeCountry, sector, ticker)
│     → revenueTableFound=true → DIRECT/ALLOCATED evidence
│     → revenueTableFound=false → buildGlobalFallbackV5('revenue') → MODELED
│
├─► integrateSupplyChannelV5(secData, homeCountry, sector, ticker)
│     → supplierListFound=true → buildAdmissibleSetFromNarrative() → DIRECT/ALLOCATED
│     → supplierListFound=false → channelFallbackService sector template → MODELED
│
├─► integrateAssetsChannelV5(secData, homeCountry, sector, ticker)
│     → ppeTableFound=true → DIRECT/ALLOCATED evidence
│     → ppeTableFound=false → buildGlobalFallbackV5('assets') → MODELED
│
└─► integrateFinancialChannelV5(secData, homeCountry, sector, ticker)
      → debtTableFound=true → DIRECT/ALLOCATED evidence
      → debtTableFound=false → buildGlobalFallbackV5('financial') → MODELED
```

---

## Section 4: Narrative Parser — Real Parse vs Simulated/Empty Conditions

### 4.1 `parseNarrativeText()` in `narrativeParser.ts`

Called from `liveEdgarPipeline.ts` after `fetchSECFilingText()` succeeds.

**Real parse conditions:**
- Filing text is non-empty and non-null
- Text length > 0 chars (logged as `${filingText.length} chars`)
- Extracts: regional definitions, country mentions, supply chain signals

**Simulated/empty guard in `buildAdmissibleSetFromNarrative()`** (`structuredDataIntegratorV5.ts`):

```typescript
if (!narrative || narrative.trim().length === 0 || isSimulated === true) {
  // Returns empty admissible set — no template injection
  return { admissibleSet: [], excludesHomeCountry: false, signalStrength: 'none' };
}
```

This guard prevents template-injected text (from `LiveRegulatoryConnector.ts` mock content) from polluting the supply chain admissible set. When `isSimulated=true` is passed, the narrative parser returns an empty set rather than fabricating country mentions.

### 4.2 LLM Narrative Extractor (`llmNarrativeExtractor.ts`)

- Called from `secFilingParser.ts` (FIX #5) for sections not captured by table parser
- Invoked via Supabase Edge Function
- If Edge Function unavailable → graceful fallback (no LLM extraction, table-only results)
- Sections analyzed: Item 1 (Business), Item 2 (Properties), MD&A, Risk Factors, Note disclosures

### 4.3 Mock/Simulated Content Sources

| Source | Location | Used in Production? |
|---|---|---|
| `simulateCompanySearch()` | `LiveRegulatoryConnector.ts` line 502 | ⚠️ Called when real EDGAR search fails |
| `mockContent` template | `LiveRegulatoryConnector.ts` line 990 | ⚠️ Fallback filing content |
| `mockFilings` | `GlobalRegulatoryIntegrator.ts` line 606 | ❌ Not in main pipeline |
| `generateCompanyExposure()` | `mockData/companyExposureGenerator.ts` | ❌ Test only |
| `getVIXLevel()` simulated | `RealTimeDataService.ts` line 406 | ⚠️ VIX fallback only |

**Critical finding:** `LiveRegulatoryConnector.ts` has a `simulateCompanySearch()` fallback that returns mock company data when the real EDGAR search fails. This is used in the `GlobalProcessingEngine` (bulk processing) but **not** in the main Company Mode pipeline (`geographicExposureService.ts`). The Company Mode pipeline uses `integrateStructuredData()` directly, which calls `parseSECFiling()` → real EDGAR API.

---

## Section 5: Supply-Chain Ingestion — Live vs Fallback

### 5.1 Supply Channel Evidence Hierarchy

```
Supply Channel Evidence Sources (in priority order):
│
├─► 1. Company-specific supplyPercentage (Tier 1 only)
│       → AAPL: China 35%, Taiwan 25%, Japan 6%, Vietnam (via sustainability report)
│       → TSLA: China 25%, US 30%, Germany 8%
│       → MSFT: US 15%, China 10%, India 5%
│       → Tier: DIRECT
│
├─► 2. SEC 10-K supplier list (Item 1 / sustainability report)
│       → parseSECFiling() → supplierLocations[]
│       → buildAdmissibleSetFromNarrative() → admissible set construction
│       → integrateSupplyChannelV5() → DIRECT/ALLOCATED
│       → Tier: DIRECT (if explicit) or ALLOCATED (if regional)
│
├─► 3. Sustainability report integration
│       → fetchSustainabilityReport(ticker) → SustainabilityReportData
│       → supplier country mentions → ALLOCATED tier
│
├─► 4. channelFallbackService.ts sector templates
│       → REVENUE_FALLBACK_TEMPLATES, SUPPLY_CHAIN_FALLBACK_TEMPLATES, etc.
│       → Sector-specific: Technology, Manufacturing, Energy, Financial Services, Consumer, Healthcare
│       → Applied when: status='unknown' (not 'known_zero' which is locked)
│       → Tier: MODELED
│
└─► 5. buildGlobalFallbackV5('supply', sector)
        → HOME_BIAS_LAMBDA['supply'] = 0.10 (lowest home bias — supply chains are global)
        → Manufacturing-weighted prior (China/Vietnam/India/Taiwan dominate for Tech)
        → Tier: MODELED
```

### 5.2 Supply Chain Fallback Templates (`channelFallbackService.ts`)

The `channelFallbackService.ts` contains sector-specific fallback templates for all five channels. These are applied when no direct evidence is available:

| Template | Sectors Covered | Application Condition |
|---|---|---|
| `REVENUE_FALLBACK_TEMPLATES` | Technology, Manufacturing, Energy, Financial Services, Healthcare, Consumer | `status='unknown'` |
| `SUPPLY_CHAIN_FALLBACK_TEMPLATES` | Same sectors | `status='unknown'` |
| `ASSETS_FALLBACK_TEMPLATES` | Same sectors | `status='unknown'` |
| `FINANCIAL_FALLBACK_TEMPLATES` | Same sectors | `status='unknown'` |
| `COUNTERPARTY_FALLBACK_TEMPLATES` | Same sectors | `status='unknown'` |

**Evidence protection rules:**
1. Countries with `status='known_zero'` are **LOCKED** — fallback values are never added
2. Countries with `status='unknown'` receive fallback values
3. Countries with `status='known_positive'` (DIRECT/ALLOCATED) are never overwritten

---

## Section 6: Panel Data Flow — Exposure Pathways vs Top Risk Contributors

### 6.1 Data Flow Architecture (Post-R8 Fix)

**Critical finding:** Both panels now read from the **same object** via `deriveCompanyAnalytics()`.

```
CompanyMode.tsx
│
├─► useMemo: companyData = deriveCompanyAnalytics(
│     calculationResult.countryExposures,  ← single source of truth
│     calculationResult.finalScore,
│     topN=5
│   )
│
├─► companyData.channelExposures  → ExposurePathways (C4)
├─► companyData.structuralDrivers → TopRelevantRisks (C5)
└─► companyData.attributions      → RiskAttribution (C7)
```

**Pre-R8 divergence (now fixed):** Before R8, three separate utility functions were called:
- `generateChannelExposures()` → used `STANDARD_CHANNEL_WEIGHTS` (static, pre-normalization)
- `getTopStructuralDrivers()` → used `contribution` (post-normalization) but `topN=2` (too few)
- `calculateCountryAttribution()` → used random dominant-channel selector

**Post-R8 (current state):** All three read from the same `countryExposures` array via `deriveCompanyAnalytics()`, eliminating pre/post-normalization divergence.

### 6.2 ExposurePathways (C4) Data Flow

```
ExposurePathways component (src/components/company/ExposurePathways.tsx)
│
├─► Props: countryExposures, channelExposures (optional pre-calculated)
├─► If channelExposures provided: use directly (from deriveCompanyAnalytics)
└─► If not provided: generateChannelExposures(countryExposures, baseScore) [fallback]

CompanyMode.tsx passes:
  channelExposures={companyData.channelExposures}  ← from deriveCompanyAnalytics()
```

**Channel exposure calculation in `deriveCompanyAnalytics.ts`:**
- Aggregates per-channel weights across all countries using post-normalization `exposureWeight × channelWeight`
- Uses actual per-country `channelWeights` from `CountryExposure` (not static `STANDARD_CHANNEL_WEIGHTS`)
- Channel risk score = `Σ(channelWeight × exposureWeight × countryShockIndex)` per country
- Top countries per channel: sorted by channel-specific weight, top 6

### 6.3 TopRelevantRisks (C5) Data Flow

```
TopRelevantRisks component (src/components/company/TopRelevantRisks.tsx)
│
├─► Props: risks (pre-calculated StructuralDriver[]), countryExposures (optional)
├─► If risks provided: use directly (from deriveCompanyAnalytics)
└─► If not provided: getTopStructuralDrivers(countryExposures, 2) [fallback — topN=2 only!]

CompanyMode.tsx passes:
  risks={companyData.structuralDrivers}  ← from deriveCompanyAnalytics(topN=5)
```

**Structural driver calculation in `deriveCompanyAnalytics.ts`:**
- Sorted by `contribution` (post-normalization)
- `topN=5` (R3 fix — was 2, causing empty results for META/generic tickers)
- R3 GF fallback: if all contributions are zero → fall back to `exposureWeight` sorted results
- Explanation text includes: country, exposure%, CSI, contribution pts, evidence tier

### 6.4 RiskContributionMap (C3) Data Flow

```
RiskContributionMap component (src/components/company/RiskContributionMap.tsx)
│
├─► Props: countryExposures (direct from companyData.countryExposures)
├─► ticker, highlightedCountries, onCountryClick (interaction props)
│
├─► Calculates risk_share internally: (contribution / totalRisk) × 100
├─► determineDominantChannel(): reads channelWeights deterministically
│     → argmax{ revenue×0.40, supply×0.35, assets×0.15, financial×0.10 }
│     → BUG #1 FIX: replaced Math.random() with deterministic calculation
│
└─► Evidence tier opacity: MODELED entries rendered at opacity=0.7
```

**Note:** `RiskContributionMap` does NOT use `deriveCompanyAnalytics()` — it receives `countryExposures` directly and recalculates `risk_share` internally. This is consistent with the other panels since `countryExposures` is the single source of truth.

### 6.5 State Variable Cross-Reference

Both `ExposurePathways` and `TopRelevantRisks` receive pre-calculated data from `companyData` (derived from `calculationResult.countryExposures`). They do NOT read from different state variables.

```typescript
// CompanyMode.tsx — single source of truth
const companyData = useMemo(() => {
  const analytics = deriveCompanyAnalytics(
    calculationResult.countryExposures,  // ← same array
    calculationResult.finalScore,
    5
  );
  return {
    countryExposures: calculationResult.countryExposures,  // ← same array
    channelExposures: analytics.channelExposures,           // → ExposurePathways
    structuralDrivers: analytics.structuralDrivers,         // → TopRelevantRisks
    attributions: analytics.attributions,                   // → RiskAttribution
    ...
  };
}, [calculationResult, ticker, companyMeta]);
```

**Lens state:** `activeLens` from `useGlobalState((state) => state.active_company_lens)` is read independently by each component. The `CompanyMode.tsx` tabs write to this state via `setActiveLens(v)`. Both `ExposurePathways` and `TopRelevantRisks` read `active_company_lens` (same field). **No divergence** between `active_lens` and `active_company_lens` — both components read the same Zustand field.

---

## Section 7: Evidence Tier Propagation Chain

The V5 evidence tier (`DIRECT` / `ALLOCATED` / `MODELED` / `FALLBACK`) flows through the entire pipeline:

```
companySpecificExposures.ts / SEC EDGAR / GF fallback
    ↓ tier assigned in channelBuilder.ts / structuredDataIntegratorV5.ts
geographicExposureService.ts (channelBreakdown[country].revenue.tier etc.)
    ↓ passed as channelBreakdown to calculateCOGRIScore()
cogriCalculationService.ts
    → bestTier = max(revenue.tier, supply.tier, assets.tier, financial.tier)
    → CountryExposure.tier = bestTier
    → CountryExposure.dataSource = bestTier (backward compat)
    ↓
CompanyMode.tsx → companyData.countryExposures[].tier
    ↓
Evidence Tier Summary Bar (inline in CompanyMode.tsx Structural tab)
    → counts DIRECT / ALLOCATED / MODELED / FALLBACK
    → shows weighted exposure coverage
    ↓
RiskContributionMap (C3)
    → TierBadge per country in ranked list
    → opacity=0.7 for MODELED entries
    ↓
RuntimeValidationReport (Validation tab)
    → channelMatrix: per-country per-channel tier
    → differentiationScore: cosine similarity across channel vectors
    → fallbackAudit: counts per tier
    ↓
CompanySummaryPanel (C1)
    → scoreUncertainty: ±X points based on tier mix
    → DIRECT=5%, ALLOCATED=10%, MODELED=20%, FALLBACK=30% uncertainty factors
```

---

## Section 8: V5 Global Fallback (GF) Formula

When no SEC data is available, `buildGlobalFallbackV5()` in `channelPriors.ts` is called:

```
buildGlobalFallbackV5(homeCountry, channel, sector, candidateCountries?)
│
├─► HOME_BIAS_LAMBDA per channel:
│     revenue:   λ = 0.25  (moderate home bias — revenue often domestic)
│     supply:    λ = 0.10  (low home bias — supply chains are global)
│     assets:    λ = 0.35  (high home bias — assets often domestic)
│     financial: λ = 0.30  (high home bias — financial exposure often domestic)
│
├─► applyGFV5(homeCountry, channel, sector, lambda):
│     homeWeight = lambda
│     foreignWeight = (1 - lambda) distributed via sector-specific priors
│
└─► Sector-specific priors:
      Technology:    GDP-weighted demand + manufacturing capability
      Manufacturing: Assembly capability + industrial output
      Financial:     BIS financial center weights
      Energy:        Resource production + consumption weights
      Healthcare:    Healthcare expenditure + pharma production
```

---

## Section 9: Score Uncertainty Computation

Implemented in `cogriCalculationService.ts`:

```typescript
const TIER_UNCERTAINTY = {
  DIRECT:    0.05,  // ±5%  of final score
  ALLOCATED: 0.10,  // ±10% of final score
  MODELED:   0.20,  // ±20% of final score
  FALLBACK:  0.30,  // ±30% of final score
};

scoreUncertainty = finalScore × Σ(exposureWeight/totalWeight × tierUncertainty)
```

**Surfaced in UI:**
- `CompanySummaryPanel` (C1): displays `± {scoreUncertainty.toFixed(1)}` next to CO-GRI score
- `RuntimeValidationReport` (Validation tab): full uncertainty breakdown

---

## Section 10: Known Issues and Warnings

### Issue 1: `dataSourceConsistency.divergencePoint` in RuntimeValidation

`runtimeValidation.ts` still references the **pre-R8** source strings:
```typescript
exposurePathwaysSource: 'generateChannelExposures(countryExposures) → channelCalculations.ts',
topRiskContributorsSource: 'getTopStructuralDrivers(countryExposures) → riskRelevance.ts',
```
These strings are **stale** — both now go through `deriveCompanyAnalytics()`. The `sameObject: true` flag is correct, but the source strings should be updated to reflect the R8 refactor.

### Issue 2: `TopRelevantRisks` Internal Fallback Uses `topN=2`

If `risks` prop is not passed (e.g., in `CompanyTradingSignalView`), `TopRelevantRisks` falls back to `getTopStructuralDrivers(countryExposures, 2)` — only 2 drivers. The main `CompanyMode.tsx` correctly passes `risks={companyData.structuralDrivers}` (topN=5), but other consumers may not.

### Issue 3: Live EDGAR Cache Has No TTL

The `_livePipelineCache` in `liveEdgarPipeline.ts` is session-lifetime with no expiry. For long-running sessions, AAPL/TSLA/MSFT data may become stale. Recommended: add 24-hour TTL.

### Issue 4: `ExposurePathways` Light Theme (Not Dark-Themed)

`ExposurePathways.tsx` uses light theme classes (`bg-blue-50`, `text-blue-900`, etc.) while `RiskContributionMap.tsx` uses the dark theme (`bg-[#0d1512]`, `text-white`). Visual inconsistency in the Structural tab.

### Issue 5: `simulateCompanySearch()` in `LiveRegulatoryConnector.ts`

When the real EDGAR search fails for non-US jurisdictions, `simulateCompanySearch()` returns mock company data. This is used in `GlobalProcessingEngine` (bulk processing mode) but not in the main Company Mode pipeline. However, if `LiveRegulatoryConnector` is ever called from the Company Mode pipeline, mock data could contaminate results.

### Issue 6: Scenario Shock and Trading Signal Lens Stubs

`TopRelevantRisks.tsx` and `RiskAttribution.tsx` display static placeholder text for Scenario Shock and Trading Signal lenses. No computed risk drivers are shown. This is a known limitation documented in `COGRIAuditReport.tsx`.

### Issue 7: `active_lens` vs `active_company_lens` — Resolved

Previously flagged in `COGRIAuditReport.tsx` as a potential divergence. **Confirmed resolved:** Both `CompanyMode.tsx` tabs and all component consumers read `active_company_lens` from the same Zustand field. No divergence exists in the current codebase.

---

## Section 11: Three Final Classification Lists

### List A: Fully Live V5 Path (DIRECT evidence confirmed, channel-differentiated)

These companies have verified company-specific data AND are on the live EDGAR upgrade path:

| Ticker | Company | Sector | Evidence | Channel Differentiation | Live EDGAR |
|---|---|---|---|---|---|
| **AAPL** | Apple Inc. | Technology | Schema V2 — 10-K FY2024 + Supplier Report 2024 | ✅ Full (4 independent channels, per-country %) | ✅ Active (session-cached) |
| **TSLA** | Tesla, Inc. | Consumer Discretionary | Schema V2 — 10-K FY2024 + Impact Report 2023 | ✅ Full (4 independent channels, per-country %) | ✅ Active (session-cached) |
| **MSFT** | Microsoft Corporation | Technology | Schema V2 — 10-K FY2024 + Supplier CoC | ✅ Full (4 independent channels, per-country %) | ✅ Active (session-cached) |

**Characteristics of fully live V5 path:**
- `hasCompanySpecificExposure()` = true
- `buildIndependentChannelBreakdown()` called → 4 distinct channel vectors
- `LEGACY_STATIC_OVERRIDE = false` → live EDGAR fetch attempted
- `upgradeChannelBreakdownWithSEC()` runs on both live and static-fallback paths
- Channel differentiation score (cosine similarity) expected > 0.2 (well-differentiated)
- Evidence tier: mix of DIRECT (explicit %) + ALLOCATED (blended %) + MODELED (prior)
- Score uncertainty: lowest (DIRECT channels → ±5% factor)

---

### List B: Partially Live V5 Path (SEC integration attempted, outcome runtime-dependent)

These companies have CIK entries (hardcoded or resolvable) and will have SEC integration attempted at runtime. Channel differentiation depends on whether the EDGAR fetch succeeds and what tables are found in the 10-K.

| Ticker | Company | Sector | CIK Status | Expected SEC Outcome | Channel Differentiation |
|---|---|---|---|---|---|
| **GOOGL** | Alphabet Inc. | Technology | ✅ Hardcoded (0001652044) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **AMZN** | Amazon.com Inc. | Consumer Discretionary | ✅ Hardcoded (0001018724) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **META** | Meta Platforms | Communication Services | ✅ Hardcoded (0001326801) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **NVDA** | NVIDIA Corporation | Technology | ✅ Hardcoded (0001045810) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **JPM** | JPMorgan Chase | Financial Services | ✅ Hardcoded (0000019617) | Revenue + financial tables | ⚠️ Revenue/Financial DIRECT |
| **JNJ** | Johnson & Johnson | Healthcare | ✅ Hardcoded (0000200406) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **WMT** | Walmart Inc. | Retail | ✅ Hardcoded (0000104169) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **NFLX** | Netflix Inc. | Communication Services | ✅ Hardcoded (0001065280) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **INTC** | Intel Corporation | Technology | ✅ Hardcoded (0000050863) | Revenue + supply tables | ⚠️ Revenue/Supply DIRECT |
| **AMD** | Advanced Micro Devices | Technology | ✅ Hardcoded (0000002488) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **QCOM** | Qualcomm Inc. | Technology | ✅ Hardcoded (0000804328) | Revenue table likely found | ⚠️ Revenue DIRECT, others GF |
| **NKE** | Nike Inc. | Consumer Discretionary | ✅ Hardcoded (0000320187) | Revenue + supply tables | ⚠️ Revenue/Supply DIRECT |
| **BABA** | Alibaba Group | Technology (ADR) | ✅ Hardcoded (0001577552) | 20-F — partial parse | ⚠️ Partial |
| **TSM** | Taiwan Semiconductor | Technology (ADR) | ✅ Hardcoded (0001046179) | 20-F — partial parse | ⚠️ Partial |
| ~35 other hardcoded CIK tickers | Various | Various | ✅ Hardcoded | Depends on 10-K structure | ⚠️ Partial |
| ~25 US domestic tickers (Supabase Edge) | Various | Various | ⚠️ Network-dependent | Depends on Edge Function | ⚠️ Uncertain |

**Characteristics of partially live V5 path:**
- `hasCompanySpecificExposure()` = false
- `integrateStructuredData()` called → real EDGAR fetch attempted
- Revenue channel most likely to get DIRECT evidence (revenue tables common in 10-K)
- Supply, Assets, Financial channels often fall to GF (tables less consistently structured)
- Channel differentiation score expected 0.05–0.2 (low-medium differentiation)
- Score uncertainty: medium (mix of DIRECT revenue + MODELED other channels)

---

### List C: Not on Intended Live Path (Always GF Fallback — No SEC Filing)

These companies will always fall through to V5 Global Fallback because they do not file with the SEC.

**Category C1: International Exchange Companies (~100 tickers)**

All companies listed on TSX, LSE, HKEX, SGX, B3, TWSE, JSE, BVC exchanges:

| Exchange | Example Tickers | Count | Reason |
|---|---|---|---|
| TSX (Canada) | TOU.TO, RY.TO, SHOP.TO, CNR.TO | ~40 | No SEC filing |
| LSE (UK) | SHEL.L, BP.L, HSBA.L, AZN.L | ~10 | No SEC filing (20-F not parsed) |
| HKEX (Hong Kong) | 0700.HK, 9988.HK, 0005.HK | ~8 | No SEC filing |
| SGX (Singapore) | D05.SI, O39.SI, Z74.SI | ~5 | No SEC filing |
| B3 (Brazil) | PETR4.SA, VALE3.SA, ITUB4.SA | ~6 | No SEC filing |
| TWSE (Taiwan) | 2330.TW, 2317.TW, 2454.TW | ~5 | No SEC filing |
| JSE (South Africa) | NPN.JO, SOL.JO, MTN.JO | ~7 | No SEC filing |
| BVC (Colombia) | CIB.CO, ECOPETROL.CO | ~4 | No SEC filing |

**Category C2: ADR Companies Where 20-F Parsing Fails (~80 tickers)**

US-listed ADRs that either don't file with SEC or whose 20-F format is not fully supported:

| Region | Example Tickers | Count | Reason |
|---|---|---|---|
| China ADRs | PDD, JD, BIDU, NIO, LI, XPEV | ~10 | 20-F format / partial parse |
| Taiwan ADRs | UMC, ASX, CHT, AUO | ~4 | 20-F format |
| South Korea ADRs | KB, SHG, PKX, LPL | ~4 | 20-F format |
| Japan ADRs | TM, SONY, MUFG, HMC | ~10 | 20-F format |
| India ADRs | INFY, WIT, HDB, IBN | ~10 | 20-F format |
| Brazil ADRs | PBR, VALE, ITUB, BBD | ~10 | 20-F format |
| UK ADRs | BP, SHEL, HSBC, AZN | ~10 | 20-F format |
| Europe ADRs | SAP, SIEGY, ASML, NVO | ~20 | 20-F format |
| Australia ADRs | BHP, RIO, WBK | ~5 | 20-F format |
| Other ADRs | TEVA, CHKP, GOLD | ~10 | 20-F format |

**Category C3: Stale/Inactive Tickers**

| Ticker | Company | Reason |
|---|---|---|
| **SPLK** | Splunk Inc. | Acquired by Cisco March 2024 — no longer independent |

**Characteristics of not-on-intended-live-path companies:**
- `hasCompanySpecificExposure()` = false
- `integrateStructuredData()` → `parseSECFiling()` → CIK not found or 20-F parse fails
- All four channels → `buildGlobalFallbackV5()` → MODELED tier
- Channel differentiation: none (all channels use same GF formula with different λ)
- Score uncertainty: highest (all FALLBACK → ±30% factor)
- Evidence Tier Summary Bar: shows 100% FALLBACK or MODELED

---

## Section 12: Summary Statistics

| Metric | Value |
|---|---|
| Total companies in search database | ~259 |
| Companies on **fully live V5 path** (List A) | **3** |
| Companies on **partially live V5 path** (List B) | **~60** |
| Companies **not on intended live path** (List C) | **~196** |
| Companies with **channel differentiation confirmed** | **3** (Tier 1 only) |
| Companies where **channel differentiation is possible** (runtime-dependent) | **~60** |
| Companies where **channel differentiation is impossible** | **~196** |
| Panel data flow: Exposure Pathways = Top Risk Contributors source | ✅ **Same object** (post-R8) |
| SEC EDGAR live fetch: active | ✅ `LEGACY_STATIC_OVERRIDE=false` |
| Narrative parser: real parse active | ✅ (with simulated guard) |
| Supply chain: live ingestion | ⚠️ Tier 1 only (static); others via sector templates |
| Score uncertainty: propagated to UI | ✅ `CompanySummaryPanel` |
| Evidence tier: propagated to UI | ✅ `Evidence Tier Summary Bar`, `TierBadge`, `RuntimeValidationReport` |

---

## Appendix A: Key File Reference

| File | Role | Key Functions |
|---|---|---|
| `src/data/companySpecificExposures.ts` | Tier 1 static data | `getCompanySpecificExposure()`, `COMPANY_SPECIFIC_EXPOSURES` |
| `src/services/v5/liveEdgarPipeline.ts` | Live EDGAR orchestrator | `fetchLiveOrFallback()`, `_livePipelineCache` |
| `src/services/v5/companySpecificChannelFix.ts` | Independent channel builder | `buildIndependentChannelBreakdown()` |
| `src/services/v5/channelBuilder.ts` | Per-channel data builders | `buildRevenueChannelData()`, `buildSupplyChannelData()`, `buildAssetsChannelData()`, `buildFinancialChannelData()` |
| `src/services/v5/structuredDataIntegratorV5.ts` | V5 SEC integration | `integrateRevenueChannelV5()`, `allocateRegionWithPrior()`, `buildAdmissibleSetFromNarrative()` |
| `src/services/v5/channelPriors.ts` | GF formula + priors | `buildGlobalFallbackV5()`, `HOME_BIAS_LAMBDA`, `allocateWithPrior()` |
| `src/services/geographicExposureService.ts` | Main orchestrator | `calculateIndependentChannelExposuresWithSEC()`, `upgradeChannelBreakdownWithSEC()`, `getCompanyGeographicExposure()` |
| `src/services/cogriCalculationService.ts` | Score calculation | `calculateCOGRIScore()`, tier propagation, `scoreUncertainty` |
| `src/services/calculations/deriveCompanyAnalytics.ts` | Unified analytics | `deriveCompanyAnalytics()` — single pass for C4/C5/C7 |
| `src/services/runtimeValidation.ts` | Validation report | `generateValidationReport()`, `computeDifferentiationScore()` |
| `src/services/secFilingParser.ts` | EDGAR parser | `parseSECFiling()`, `getCIKFromTicker()`, `TICKER_TO_CIK_MAP` |
| `src/services/channelFallbackService.ts` | Sector templates | `SUPPLY_CHAIN_FALLBACK_TEMPLATES`, `applyFallbackToChannel()` |
| `src/pages/modes/CompanyMode.tsx` | Main page | `deriveCompanyAnalytics()` call, panel wiring |
| `src/components/company/ExposurePathways.tsx` | C4 panel | Reads `channelExposures` prop |
| `src/components/company/TopRelevantRisks.tsx` | C5 panel | Reads `risks` prop |
| `src/components/company/RiskContributionMap.tsx` | C3 panel | Reads `countryExposures` prop directly |

---

*End of Report 2: Full Runtime Source-of-Truth Audit*  
*Report generated by David (Data Analyst) — 2026-04-07*