# Report 8: CO-GRI Live Runtime Baseline — Deep Investigation
**Date:** 2026-04-20  
**Author:** David (Data Analyst, Atoms Team)  
**Scope:** Read-only static code analysis of the full SEC pipeline for all SEC-eligible companies  
**Method:** Source code review — NO live API calls made  

---

## Executive Summary

This report is a comprehensive static analysis of the CO-GRI platform's live runtime SEC pipeline. It covers every layer from CIK resolution through filing retrieval, structured parsing, narrative parsing, channel tier determination, and final COGRI score assembly — for all SEC-eligible companies defined in `runSECBaseline.ts`.

**Key findings:**

| Finding | Detail |
|---------|--------|
| Total SEC-eligible universe | **~163 unique tickers** (Cat A: 131, Cat B: 34, Cat C: 3, with deduplication) |
| CIK hardcoded (guaranteed SEC path) | **131 tickers** (Cat A) |
| CIK requires EDGAR search | **~32 tickers** (Cat B/C) |
| Existing `sec_baseline_results.json` | **28 records, all `enteredSECPath=false`, all tiers `NOT_RUN`** — scores are static/simulated, not pipeline-derived |
| Pipeline ever run live | **No evidence of a live run in the stored results** |
| Structured parsing approach | Keyword-based HTML scan (no full DOM parse in script) vs. cheerio-based in `secFilingParser.ts` |
| Narrative parsing dependency | Requires OpenAI API key in `extract_geographic_narrative` edge function |
| Evidence tier ceiling (realistic) | DIRECT revenue for most US 10-K filers; ALLOCATED supply via Exhibit 21; MODELED/FALLBACK for financial channel |
| Composite confidence score (simulated) | Avg 68.2 (grades: A×2, B×9, C×10, D×4, F×3) — **not derived from live pipeline** |

---

## 1. Architecture Overview

The CO-GRI SEC pipeline consists of five sequential stages, each with its own failure modes:

```
Ticker
  │
  ▼
[Stage 1] CIK Resolution
  ├── Hardcoded TICKER_TO_CIK_MAP (secFilingParser.ts + runSECBaseline.ts)
  └── EDGAR search via fetch_sec_cik edge function (fallback)
  │
  ▼
[Stage 2] Filing Retrieval
  └── fetch_sec_filing edge function
      ├── Fetches CIK{cik}.json from data.sec.gov/submissions/
      ├── Finds latest 10-K or 20-F
      └── Fetches primary HTML document from EDGAR Archives
  │
  ▼
[Stage 3] Structured Parsing
  ├── secFilingParser.ts (cheerio-based, production path)
  │   ├── isRevenueTable() — keyword + exclusion logic
  │   ├── isPPETable() — property/plant/equipment keywords
  │   └── isDebtTable() — debt/borrowing keywords
  └── runSECBaseline.ts (regex-based, script path)
      └── Simplified HTML keyword scan (no cheerio)
  │
  ▼
[Stage 4] Narrative Parsing
  ├── narrativeParser.ts (local regex, no AI)
  │   ├── parseRegionalDefinitions() — regex for "X includes Y, Z"
  │   └── parseCountryMentions() — COUNTRY_ALIASES + channel keyword scan
  └── extract_geographic_narrative edge function (OpenAI GPT-4o-mini)
      └── Requires OPENAI_API_KEY env var
  │
  ▼
[Stage 5] Channel Integration & Tier Assignment
  └── structuredDataIntegratorV5.ts
      ├── integrateRevenueChannelV5() → DIRECT/ALLOCATED/MODELED
      ├── integrateSupplyChannelV5()
      ├── integrateAssetsChannelV5()
      └── integrateFinancialChannelV5()
  │
  ▼
[Stage 6] COGRI Score Calculation
  └── cogriCalculationService.ts
      ├── Four-channel blending (rev:40%, sup:35%, ast:15%, fin:10%)
      ├── Political alignment amplification
      ├── Sector multiplier
      └── Score uncertainty band (P2-4)
```

---

## 2. SEC-Eligible Universe

### 2.1 Category Definitions

| Category | Definition | CIK Source | Count |
|----------|-----------|------------|-------|
| **A** | Hardcoded CIK in TICKER_TO_CIK_MAP | Guaranteed | 131 |
| **B** | NYSE/NASDAQ listed, no hardcoded CIK | EDGAR search | ~31 |
| **C** | Additional ADRs not in CIK map | EDGAR search | 3 |
| **D** | Companies in companyDatabase.ts not in any list | None | Unknown |

### 2.2 Category A — Full Ticker List (131 tickers)

**US Large-Caps (10-K filers, 34 tickers):**
AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, BRK.B, JPM, JNJ, V, WMT, PG, MA, UNH, HD, DIS, BAC, ADBE, CRM, NFLX, XOM, PFE, CSCO, INTC, VZ, KO, PEP, MRK, ABT, NKE, ORCL, AMD, IBM

**US Additional Large-Caps (10-K filers, 14 tickers):**
ABBV, AXP, BLK, C, COP, CVX, DHR, GS, LLY, MS, SBUX, SLB, TMO, WFC

**China ADRs (20-F filers, 10 tickers):**
BABA, PDD, JD, BIDU, NIO, LI, XPEV, NTES, BILI, YUMC

**Taiwan ADRs (3 tickers):** TSM, ASX, CHT

**South Korea ADRs (5 tickers):** KB, SHG, PKX, LPL, KEP

**Japan ADRs (8 tickers):** TM, SONY, MUFG, SMFG, NMR, MFG, HMC, SIFY

**India ADRs (5 tickers):** INFY, WIT, HDB, IBN, REDY

**Brazil ADRs (9 tickers):** PBR, VALE, ITUB, BBD, ABEV, SBS, TIMB, GGB, LTM

**UK ADRs (10 tickers):** BP, SHEL, HSBC, AZN, GSK, DEO, UL, BCS, RIO, BTI

**France ADRs (2 tickers):** SNY, TTE

**Germany ADRs (2 tickers):** SAP, DTEGY

**Netherlands ADRs (4 tickers):** ASML, ING, PHG, STLA

**Switzerland/Denmark ADRs (3 tickers):** NVO, NVS, UBS

**Australia ADRs (1 ticker):** BHP

**Israel ADRs (5 tickers):** TEVA, CHKP, NICE, WIX, MNDY

**Mexico ADRs (4 tickers):** AMX, FMX, TV, CX

**Argentina ADRs (10 tickers):** YPF, CRESY, IRS, BMA, GGAL, SUPV, TEO, TX, PAM, LOMA

**Other ADRs (6 tickers):** SQM (Chile), CIB (Colombia), SAN (Spain), GOLD, GFI, SBSW, HMY, AU (South Africa), ABBNY

### 2.3 Category B — EDGAR Search Required (~31 tickers)

CMCSA, BA, GE, QCOM, MCD, WNS, VEDL, TTM, INDY, BRFS, CBD, UMC, AUO, NTDOY, SNE, FUJIY, BNP, LVMUY, AXAHY, OREDY, DANOY, AIQUY, SAFRY, SIEGY, BAYRY, DAIMAY, BMWYY, VLKAF, BASFY, ADDYY, ALIZY, HEIA, RHHBY, NSRGY, CS, ZURN, WBK, NAB, ANZ, ENIA, CHL, GFNORTEO

> **Note:** CMCSA, BA, GE, QCOM are in the TICKER_TO_CIK_MAP but listed in Cat B because they are "in CIK map but not in companyDatabase as standalone." They will resolve via hardcoded CIK.

### 2.4 Category C (3 tickers)
VEDL, TTM, WNS — overlap with Cat B; deduplicated in the actual run.

---

## 3. Stage 1: CIK Resolution Analysis

### 3.1 Code Path

**`secFilingParser.ts` → `getCIKFromTicker()`:**
```
1. Check TICKER_TO_CIK_MAP[tickerUpper] → return immediately (hardcoded)
2. Call fetch_sec_cik edge function (up to maxRetries=3 attempts)
3. If found, cache in TICKER_TO_CIK_MAP
4. Return null if not found
```

**`runSECBaseline.ts` → `resolveCIK()`:**
```
1. Check TICKER_TO_CIK_MAP[upper]
2. Check TICKER_TO_CIK_MAP[baseTicker] (handles BRK.B → BRK)
3. Call fetch_sec_cik edge function (retryWithBackoff, 4 retries, 1s base)
4. Return null if all fail
```

**`fetch_sec_cik` edge function:**
- Fetches `https://www.sec.gov/files/company_tickers.json`
- Iterates all ~12,000 entries looking for `company.ticker === tickerUpper`
- Returns `{ cik, ticker, companyName }` or 404

### 3.2 Expected CIK Resolution Outcomes

| Ticker Group | Count | Expected Outcome | Confidence |
|-------------|-------|-----------------|------------|
| Cat A (hardcoded) | 131 | ✅ 100% resolve | Certain |
| CMCSA, BA, GE, QCOM | 4 | ✅ Resolve (hardcoded) | Certain |
| Cat B OTC tickers (NTDOY, FUJIY, etc.) | ~10 | ⚠️ May not be in SEC tickers.json | Uncertain |
| Cat B/C foreign OTC (LVMUY, SIEGY, etc.) | ~15 | ❌ Likely not in SEC tickers.json | Low |
| Cat B US-listed (MCD, WNS, etc.) | ~8 | ✅ Likely in SEC tickers.json | High |

### 3.3 CIK Resolution Risk Factors

1. **OTC Pink Sheet tickers** (NTDOY, FUJIY, LVMUY, SIEGY, BMWYY, etc.) are traded OTC in the US but the underlying company files with their home country regulator, not SEC. These will NOT appear in `company_tickers.json`.

2. **Ticker format mismatch**: SEC uses the exchange-listed ticker. Some ADRs use different tickers on SEC vs. market data providers.

3. **BRK.B handling**: The `baseTicker` split logic (`BRK.B → BRK`) works for this case but `BRK` is not in the CIK map — `BRK.B` itself is, so the direct lookup succeeds first.

4. **Rate limiting**: SEC EDGAR enforces 10 requests/second. The script uses 1-second sleep between companies + retryWithBackoff for 429/503 responses.

---

## 4. Stage 2: Filing Retrieval Analysis

### 4.1 Code Path (`fetch_sec_filing` edge function)

```
1. GET data.sec.gov/submissions/CIK{cik}.json
2. Find latest filing of type [10-K, 10-K/A] or [20-F, 20-F/A]
3. Extract accessionNumber, primaryDocument, filingDate
4. GET sec.gov/Archives/edgar/data/{cik}/{accession}/{primaryDocument}
5. Return full HTML + metadata
```

### 4.2 Filing Type Logic

| Company Type | Primary Attempt | Fallback |
|-------------|----------------|---------|
| ADR (isADR=true) | 20-F | 10-K |
| US Domestic (isADR=false) | 10-K | 20-F |

### 4.3 Expected Retrieval Outcomes by Group

| Group | Filing Type | Expected Outcome | Notes |
|-------|------------|-----------------|-------|
| US Large-Caps (AAPL, MSFT, etc.) | 10-K | ✅ High success | All file 10-K annually |
| China ADRs (BABA, JD, etc.) | 20-F | ✅ High success | All file 20-F |
| Taiwan ADRs (TSM) | 20-F | ✅ High success | TSM files 20-F |
| Japan ADRs (TM, SONY) | 20-F | ✅ High success | File 20-F |
| India ADRs (INFY, WIT) | 20-F | ✅ High success | File 20-F |
| Brazil ADRs (PBR, VALE) | 20-F | ✅ High success | File 20-F |
| UK ADRs (BP, SHEL) | 20-F | ✅ High success | File 20-F |
| Argentina ADRs (YPF, GGAL) | 20-F | ⚠️ Variable | Some may have gaps |
| South Africa ADRs (GOLD, GFI) | 20-F | ⚠️ Variable | Check filing recency |
| Cat B OTC tickers (NTDOY, etc.) | N/A | ❌ No CIK → skip | CIK resolution fails first |

### 4.4 HTML Size Expectations

Based on typical SEC filing sizes:
- **US 10-K (large-cap)**: 2–15 MB HTML (AAPL ~8MB, MSFT ~6MB)
- **20-F (large ADR)**: 1–8 MB HTML
- **20-F (small ADR)**: 0.5–3 MB HTML
- **Minimum threshold in script**: 1,000 characters (very permissive)

### 4.5 Known Retrieval Failure Modes

1. **Primary document is XBRL viewer**: Some older filings use `R2.htm` or viewer wrappers. The edge function fetches `primaryDocument` directly, which should be the actual filing for modern submissions.
2. **Large file timeout**: The edge function has no explicit timeout on the filing fetch. Very large filings (>15MB) may timeout in Supabase's 60-second edge function limit.
3. **Amended filings (10-K/A, 20-F/A)**: The code accepts these as valid — correct behavior.
4. **Missing `filings.recent` data**: Some very old or inactive CIKs may lack `filings.recent` in the submissions JSON.

---

## 5. Stage 3: Structured Parsing Analysis

### 5.1 Two Parsing Implementations

There are **two separate structured parsing implementations** with different capabilities:

#### Implementation A: `secFilingParser.ts` (Production Path)
- Uses **cheerio** for full DOM parsing
- `isRevenueTable()`: Checks table text for geographic keywords, applies exclusion list
- `isPPETable()`: Checks for PP&E keywords
- `isDebtTable()`: Checks for debt/borrowing keywords
- `parseRevenueTable()`: Extracts actual numeric values with regex patterns
- `parsePPETable()`: Extracts PP&E by country/region
- `parseDebtTable()`: Extracts debt securities by jurisdiction
- **Output**: Structured `ParsedSECData` with typed arrays

#### Implementation B: `runSECBaseline.ts` (Script Path)
- Uses **regex on raw HTML string** (no DOM parsing)
- `parseStructuredData()`: Simple `html.toLowerCase().includes(keyword)` checks
- No actual data extraction — only presence/absence detection
- **Output**: Boolean flags (`revenueTableFound`, `ppeTableFound`, etc.)

> ⚠️ **Critical Gap**: The baseline script uses a simplified keyword scan that will produce false positives. A 10-K that mentions "revenue" and "geographic" anywhere in the document will be flagged `revenueTableFound=true` even if no actual geographic revenue table exists. The production `secFilingParser.ts` is more precise but is not used in the baseline script.

### 5.2 `isRevenueTable()` Logic (Production)

```typescript
// Keywords that MUST be present:
['geographic', 'geography', 'region', 'segment', 'revenue by',
 'net revenue', 'net sales', 'americas', 'emea', 'apac', 'asia pacific',
 'united states', 'international', 'domestic', 'foreign']

// Keywords that EXCLUDE the table:
['cost of sales', 'cost of revenue', 'selling and marketing',
 'research and development', 'operating expenses']
```

**Baseline script logic** (simplified):
```typescript
revenueTableFound = revenueKeywords.some(kw => htmlLower.includes(kw))
  && !revenueExclusions.every(ex => htmlLower.includes(ex));
```

The exclusion logic in the script is `!every()` (not ALL exclusions present), which means it almost never excludes — essentially any filing mentioning "geographic" will pass.

### 5.3 Expected Structured Parsing Success by Filing Type

| Filing Type | Revenue Table | PP&E Table | Debt Table | Exhibit 21 |
|-------------|--------------|-----------|-----------|-----------|
| US 10-K (large-cap) | ✅ Very likely | ✅ Very likely | ✅ Very likely | ✅ Likely |
| 20-F (large ADR) | ✅ Likely | ✅ Likely | ✅ Likely | ⚠️ Variable |
| 20-F (small ADR) | ⚠️ Variable | ⚠️ Variable | ⚠️ Variable | ❌ Unlikely |
| 10-K/A or 20-F/A | ⚠️ May be partial | ⚠️ May be partial | ⚠️ May be partial | ⚠️ Variable |

### 5.4 Structured Parsing — Company-Level Predictions

**High confidence DIRECT revenue (US 10-K filers):**
AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, JPM, JNJ, V, WMT, PG, MA, UNH, HD, DIS, BAC, ADBE, CRM, NFLX, XOM, PFE, CSCO, INTC, VZ, KO, PEP, MRK, ABT, NKE, ORCL, AMD, IBM, ABBV, AXP, BLK, C, COP, CVX, DHR, GS, LLY, MS, SBUX, SLB, TMO, WFC

These companies consistently include geographic revenue breakdowns in their 10-K filings (Note on Segment Information or Geographic Areas).

**High confidence DIRECT revenue (large ADR 20-F filers):**
TSM, BABA, TM, SONY, INFY, BP, SHEL, HSBC, AZN, SAP, ASML, NVO, NVS, PBR, VALE

**Variable/uncertain (smaller ADRs):**
CRESY, IRS, SUPV, LOMA, SIFY, CHT, LPL, KEP — smaller companies may not include detailed geographic breakdowns.

---

## 6. Stage 4: Narrative Parsing Analysis

### 6.1 Two Narrative Parsing Paths

#### Path A: `narrativeParser.ts` (Local, No AI)
- **`parseRegionalDefinitions()`**: Regex pattern `"X includes/comprises/consists of Y, Z, W"`
- **`parseCountryMentions()`**: Scans sentences for COUNTRY_ALIASES matches + channel keywords
- **No external API dependency**
- **Limitation**: Only finds explicitly named countries; misses implied geographic exposure

#### Path B: `extract_geographic_narrative` edge function (OpenAI GPT-4o-mini)
- **Requires `OPENAI_API_KEY` environment variable**
- Sends first 15,000 characters of filing text to GPT-4o-mini
- Extracts structured `NarrativeExtraction[]` with channel, country, percentage, confidence
- **Critical dependency**: If `OPENAI_API_KEY` is not set, returns `{ extractions: [] }` with HTTP 200 (graceful degradation, not an error)

### 6.2 Narrative Parsing — Expected Outcomes

| Condition | Outcome |
|-----------|---------|
| OpenAI API key configured | GPT-4o-mini extracts 5–20 locations per filing |
| OpenAI API key NOT configured | Returns empty extractions, `narrativeParsingSucceeded=false` |
| Filing text < 500 chars after stripping HTML | Returns empty, `narrativeParsingSucceeded=false` |
| Large filing (>15KB text) | Only first 15,000 chars analyzed — may miss tail sections |

### 6.3 Country Mention Quality

The local `narrativeParser.ts` uses `COUNTRY_ALIASES` which maps common aliases:
- "U.S." / "United States" / "USA" / "America" → "United States"
- "UK" / "U.K." / "Britain" / "England" → "United Kingdom"
- "Greater China" / "China region" → "China"
- etc.

For most large-cap 10-K filers, the narrative will mention 5–15 countries explicitly. For smaller ADRs with less detailed English-language filings, this drops to 1–3.

---

## 7. Stage 5: Channel Evidence Tier Determination

### 7.1 Tier Assignment Logic (`runSECBaseline.ts`)

```
Revenue tier:
  revenueTableFound=true → DIRECT
  narrativeCountries >= 3 → ALLOCATED
  narrativeCountries >= 1 → MODELED
  else → FALLBACK

Supply tier:
  exhibit21Found=true → ALLOCATED
  narrativeCountries >= 2 → MODELED
  else → FALLBACK

Assets tier:
  ppeTableFound=true → DIRECT
  revenueTableFound=true → ALLOCATED
  narrativeCountries >= 1 → MODELED
  else → FALLBACK

Financial tier:
  debtTableFound=true → ALLOCATED
  narrativeCountries >= 2 → MODELED
  else → FALLBACK
```

### 7.2 Tier Assignment Logic (`structuredDataIntegratorV5.ts` — Production)

The production path uses a more sophisticated V5 integration:

```
Revenue:
  secData.revenueTableFound + revenueSegments.length > 0
    → Direct country match: DIRECT
    → Region match (e.g., "Americas"): allocateRegionWithPrior() → ALLOCATED
    → Residual bucket: allocateWithPrior() → MODELED
  No table → buildGlobalFallbackV5() → MODELED

Supply:
  Sustainability data available → DIRECT
  Exhibit 21 / narrative admissible set → ALLOCATED
  Global fallback prior → MODELED

Assets:
  PP&E table found → DIRECT
  Revenue table as proxy → ALLOCATED
  Global fallback → MODELED

Financial:
  Debt table found → ALLOCATED
  Narrative mentions → MODELED
  Global fallback → MODELED
```

### 7.3 Predicted Channel Tiers by Company Group

#### US Large-Cap 10-K Filers (AAPL, MSFT, GOOGL, etc.)

| Channel | Expected Tier | Reasoning |
|---------|-------------|-----------|
| Revenue | **DIRECT** | Geographic revenue note in 10-K (Item 1/Note on Segments) |
| Supply | **ALLOCATED** | Exhibit 21 subsidiaries list present |
| Assets | **DIRECT** | PP&E by geography in 10-K |
| Financial | **ALLOCATED** | Debt tables present; jurisdiction breakdown common |

**Composite confidence score prediction: 85–95 → Grade A/B**

#### Large ADR 20-F Filers (TSM, BABA, TM, BP, SAP, etc.)

| Channel | Expected Tier | Reasoning |
|---------|-------------|-----------|
| Revenue | **DIRECT** | Geographic segment note in 20-F |
| Supply | **MODELED** | Exhibit 21 less common in 20-F; supply prior used |
| Assets | **DIRECT** or **ALLOCATED** | PP&E note present in most large 20-F filers |
| Financial | **ALLOCATED** | Debt tables present |

**Composite confidence score prediction: 70–85 → Grade B**

#### Mid-Size ADR 20-F Filers (INFY, WIT, VALE, PBR, etc.)

| Channel | Expected Tier | Reasoning |
|---------|-------------|-----------|
| Revenue | **DIRECT** | Geographic revenue breakdown typical |
| Supply | **MODELED** | No Exhibit 21; narrative-based |
| Assets | **ALLOCATED** | PP&E present but less granular |
| Financial | **MODELED** | Debt tables present but jurisdiction may be vague |

**Composite confidence score prediction: 60–75 → Grade B/C**

#### Small/Niche ADR 20-F Filers (CRESY, IRS, SUPV, LOMA, SIFY, etc.)

| Channel | Expected Tier | Reasoning |
|---------|-------------|-----------|
| Revenue | **MODELED** or **FALLBACK** | May lack detailed geographic breakdown |
| Supply | **FALLBACK** | No Exhibit 21; limited narrative |
| Assets | **MODELED** | PP&E present but not geographically detailed |
| Financial | **FALLBACK** | Debt tables may lack jurisdiction detail |

**Composite confidence score prediction: 30–55 → Grade C/D**

#### Cat B (EDGAR Search Required, OTC Tickers)

| Ticker Group | CIK Resolution | If CIK Found | Expected Tier |
|-------------|---------------|-------------|--------------|
| CMCSA, BA, GE, QCOM | ✅ Hardcoded | 10-K retrieved | DIRECT revenue |
| MCD, WNS | ✅ Likely EDGAR | 10-K/20-F | DIRECT revenue |
| NTDOY, FUJIY, SNE | ❌ Not in SEC | Skip | FALLBACK all |
| LVMUY, SIEGY, BMWYY | ❌ Not in SEC | Skip | FALLBACK all |
| RHHBY, NSRGY | ❌ Not in SEC | Skip | FALLBACK all |
| WBK, NAB, ANZ | ⚠️ Uncertain | 20-F if found | MODELED |

---

## 8. Stage 6: COGRI Score Calculation

### 8.1 Four-Channel Blending Formula

```
W_blended = 0.40 × W_revenue + 0.35 × W_supply + 0.15 × W_assets + 0.10 × W_financial
```

Note: Market channel weight = 0.00 (removed from calculation).

### 8.2 Score Uncertainty Band (P2-4)

```
Tier uncertainty factors:
  DIRECT   → 5%
  ALLOCATED → 10%
  MODELED  → 20%
  FALLBACK → 30%

scoreUncertainty = finalScore × Σ(exposureWeight × tierUncertainty)
```

### 8.3 Risk Level Thresholds

| Score Range | Risk Level |
|------------|-----------|
| < 30 | Low Risk |
| 30–44 | Moderate Risk |
| 45–59 | High Risk |
| ≥ 60 | Very High Risk |

### 8.4 Political Alignment Amplification

```
Contribution = W × CSI × (1.0 + 0.5 × (1.0 - alignmentFactor))
```

Where `alignmentFactor` ∈ [0, 1]: 1.0 = fully aligned (no amplification), 0.0 = adversarial (50% amplification).

---

## 9. Existing `sec_baseline_results.json` — Critical Finding

### 9.1 Data Quality Assessment

The file at `/workspace/shadcn-ui/docs/sec_baseline_results.json` contains **28 records** with the following characteristics:

```
Total results: 28
enteredSECPath: 0/28 (ALL FALSE)
retrievalSucceeded: 0/28 (ALL FALSE)
structuredParsingSucceeded: 0/28 (ALL FALSE)
narrativeParsingSucceeded: 0/28 (ALL FALSE)
materiallySpecific: 0/28 (ALL FALSE)
All channel tiers: NOT_RUN
```

**However**, the records contain non-zero confidence scores:
```
AAPL:  score=95, grade=A
TSLA:  score=88, grade=B
MSFT:  score=82, grade=B
NVDA:  score=76, grade=B
GOOGL: score=71, grade=C
META:  score=65, grade=C
AMZN:  score=74, grade=C
JPM:   score=80, grade=B
BAC:   score=78, grade=B
XOM:   score=83, grade=B
Average: 68.2
Grade distribution: A×2, B×9, C×10, D×4, F×3
```

### 9.2 Root Cause

These scores are **static/simulated values** — they were pre-populated without running the live pipeline. The JSON structure does not match the `RunSummary` interface (missing `runId`, `phase`, `startTime` at top level), and all pipeline step flags are `null`/`false`/`NOT_RUN`.

This means:
1. **The live SEC pipeline has never been successfully run** against these 28 companies in a way that produced stored results.
2. **The confidence scores in the UI are not derived from actual SEC filing analysis.**
3. **The `runSECBaseline.ts` script exists but has not been executed** (or its results were not stored in this file).

### 9.3 Impact on CO-GRI Assessments

The `geographicExposureService.ts` uses a multi-layer approach:
1. Company-specific exposure overrides (highest priority)
2. Live SEC filing data (if available)
3. Static channel breakdown (template-based)
4. Global fallback prior (V5 GF)

Since the live pipeline hasn't run, most companies are likely using layers 3 or 4 for their channel data. The `upgradeChannelBreakdownWithSEC()` function in `geographicExposureService.ts` is designed to upgrade MODELED entries with DIRECT/ALLOCATED evidence from live SEC — but this upgrade is only triggered when live data is available.

---

## 10. Composite Confidence Score Model

### 10.1 Formula (`computeCompositeConfidence`)

```
Channel scores: DIRECT=100, ALLOCATED=75, MODELED=50, FALLBACK=20, NOT_RUN=0

Weighted channel score = 
  tierScore[revenue]   × 0.40 +
  tierScore[supply]    × 0.25 +
  tierScore[assets]    × 0.20 +
  tierScore[financial] × 0.15

FMP boost: ×1.10 if ≥2 FMP-confirmed channels (else ×1.00)

Raw score = channelScore × recencyMultiplier × fmpBoost
Final score = min(100, max(0, round(raw)))
```

### 10.2 Recency Multiplier

| Filing Age | Multiplier |
|-----------|-----------|
| < 12 months | 1.00 |
| 12–24 months | 0.85 |
| 24–36 months | 0.70 |
| > 36 months | 0.50 |
| Unknown | 0.70 (default) |

### 10.3 Predicted Scores (If Pipeline Ran Successfully)

| Company Group | Rev | Sup | Ast | Fin | Raw Channel | ×Recency | Final Score | Grade |
|--------------|-----|-----|-----|-----|-------------|---------|------------|-------|
| US Large-Cap 10-K | DIRECT | ALLOCATED | DIRECT | ALLOCATED | 100×0.4+75×0.25+100×0.2+75×0.15 = 91.25 | ×1.00 | **91** | **A** |
| Large ADR 20-F | DIRECT | MODELED | DIRECT | ALLOCATED | 100×0.4+50×0.25+100×0.2+75×0.15 = 78.75 | ×1.00 | **79** | **B** |
| Mid ADR 20-F | DIRECT | MODELED | ALLOCATED | MODELED | 100×0.4+50×0.25+75×0.2+50×0.15 = 80.0 | ×0.85 | **68** | **C** |
| Small ADR 20-F | MODELED | FALLBACK | MODELED | FALLBACK | 50×0.4+20×0.25+50×0.2+20×0.15 = 38.0 | ×0.85 | **32** | **D** |
| No CIK (Cat B OTC) | FALLBACK | FALLBACK | FALLBACK | FALLBACK | 20×0.4+20×0.25+20×0.2+20×0.15 = 20.0 | ×0.70 | **14** | **F** |

---

## 11. Pipeline Failure Mode Analysis

### 11.1 Failure Tree

```
Stage 1 (CIK Resolution)
├── FAIL: OTC foreign tickers (NTDOY, LVMUY, etc.) → ~15 Cat B tickers skip
├── FAIL: SEC rate limit 429 → retryWithBackoff handles (4 retries)
└── PASS: All 131 Cat A tickers (hardcoded)

Stage 2 (Filing Retrieval)
├── FAIL: No 10-K or 20-F in submissions → rare for active companies
├── FAIL: Primary document is viewer page → edge function fetches primaryDocument directly (fixed)
├── FAIL: HTML < 1000 chars → very rare
├── FAIL: Timeout on large filing → possible for >15MB filings
└── PASS: ~90-95% of companies with valid CIK

Stage 3 (Structured Parsing)
├── FALSE POSITIVE: Keyword scan in script (not cheerio) → inflated success rate
├── FAIL: Revenue table uses non-standard format → MODELED fallback
├── FAIL: 20-F uses different table structure → may miss
└── PASS: ~80-90% of large-cap filings

Stage 4 (Narrative Parsing)
├── FAIL: No OpenAI API key → empty extractions (graceful)
├── FAIL: Filing text < 500 chars → empty result
├── FAIL: GPT-4o-mini rate limit → retryWithBackoff handles
└── PASS (with AI): ~70-85% of filings produce ≥1 location

Stage 5 (Channel Tiers)
├── Revenue: DIRECT for ~80% of large-caps, MODELED for ~60% of small ADRs
├── Supply: ALLOCATED for ~50% (Exhibit 21), MODELED for ~40%, FALLBACK for ~10%
├── Assets: DIRECT for ~75% of large-caps, ALLOCATED for ~15%, MODELED for ~10%
└── Financial: ALLOCATED for ~70% (debt tables), MODELED for ~25%, FALLBACK for ~5%
```

### 11.2 Known Bugs and Limitations

| ID | Location | Issue | Impact |
|----|---------|-------|--------|
| B1 | `runSECBaseline.ts:parseStructuredData()` | Keyword scan instead of DOM parse — false positives | Inflated structured parsing success rate |
| B2 | `extract_geographic_narrative` | Requires OPENAI_API_KEY — not always set | Narrative parsing silently returns empty |
| B3 | `sec_baseline_results.json` | Pre-populated with simulated scores, not live pipeline | Dashboard shows non-evidence-based scores |
| B4 | `runSECBaseline.ts:CAT_B_TICKERS` | VEDL, TTM, WNS duplicated in Cat C | Minor: deduplicated by `new Set()` |
| B5 | `fetch_sec_filing` | No explicit timeout on filing HTML fetch | Large filings may cause edge function timeout |
| B6 | `geographicExposureService.ts` | upgradeChannelBreakdownWithSEC() only runs when live data available | Without live pipeline, all channels stay at template tier |

---

## 12. Dashboard Baseline Reporting Infrastructure

### 12.1 Existing Pages

The `src/pages/` directory contains:
- `COGRITradingSignalService.tsx` — Main trading signal dashboard
- `COGRITradingSignalServiceEnhanced.tsx` — Enhanced version
- `COGRIAuditReport.tsx` — Audit report page
- `CSIAnalyticsDashboard.tsx` — CSI analytics

### 12.2 Baseline Reporting Gap

There is **no dedicated baseline reporting page** in the current dashboard. The `runSECBaseline.ts` script outputs to:
- `/tmp/sec_baseline_checkpoint.jsonl` (runtime only)
- `docs/sec_baseline_results.json` (persisted)
- `docs/sec_baseline_summary.md` (human-readable)

The `sec_baseline_summary.md` is a static markdown file, not integrated into the live dashboard UI. There is no page that reads `sec_baseline_results.json` and renders it interactively.

---

## 13. Recommendations

### 13.1 Immediate (P0)

1. **Run the live baseline script** with `--phase=1 --dry-run` first to validate ticker list, then `--phase=1` with real Supabase credentials to get actual pipeline metrics for the 131 Cat A tickers.

2. **Verify OpenAI API key** is set in Supabase edge function environment for `extract_geographic_narrative`. Without it, all narrative parsing returns empty.

3. **Replace simulated `sec_baseline_results.json`** with actual pipeline output. Current file is misleading — it shows confidence scores without any pipeline execution.

### 13.2 Short-Term (P1)

4. **Upgrade `parseStructuredData()` in `runSECBaseline.ts`** to use the same cheerio-based logic as `secFilingParser.ts` for accurate structured parsing detection.

5. **Add a baseline dashboard page** that reads `sec_baseline_results.json` and renders the tier breakdown, confidence scores, and per-company pipeline status interactively.

6. **Implement CIK pre-validation** for Cat B tickers — run a dry-run EDGAR lookup to identify which tickers will fail CIK resolution before committing to a full run.

### 13.3 Medium-Term (P2)

7. **Expand hardcoded CIK map** for high-value Cat B tickers (MCD, CMCSA, BA, GE, QCOM already have CIKs — add them to Cat A).

8. **Add filing recency tracking** — store `filingDate` per ticker and alert when filings are >18 months old (recency multiplier drops to 0.85).

9. **Implement differential updates** — only re-run pipeline for tickers whose filing date has changed since last baseline run.

### 13.4 Long-Term (P3)

10. **Integrate XBRL structured data** from SEC's XBRL viewer API (`data.sec.gov/api/xbrl/companyfacts/`) for more reliable revenue segment extraction than HTML parsing.

11. **Add 40-F support** for Canadian cross-listed companies (currently only 10-K and 20-F are supported).

12. **Build confidence score time series** — track how composite confidence scores evolve as new filings are published.

---

## 14. Summary Statistics (Predicted Live Run)

If the live pipeline were run today against all Cat A tickers (131 companies):

| Metric | Predicted Count | Predicted % |
|--------|---------------|------------|
| Enter SEC path (CIK resolved) | 131 | 100% |
| Filing retrieval success | ~120–125 | ~92–95% |
| Structured parsing success | ~110–118 | ~84–90% |
| Narrative parsing success (with OpenAI) | ~95–110 | ~73–84% |
| Narrative parsing success (without OpenAI) | ~0 | ~0% |
| Materially specific output | ~100–115 | ~76–88% |
| DIRECT revenue tier | ~95–110 | ~73–84% |
| ALLOCATED supply tier | ~60–75 | ~46–57% |
| DIRECT assets tier | ~85–100 | ~65–76% |
| ALLOCATED financial tier | ~80–95 | ~61–73% |
| Grade A (score ≥ 85) | ~35–50 | ~27–38% |
| Grade B (score 70–84) | ~45–55 | ~34–42% |
| Grade C (score 50–69) | ~20–30 | ~15–23% |
| Grade D/F (score < 50) | ~5–15 | ~4–11% |

---

## Appendix A: Full TICKER_TO_CIK_MAP (148 entries)

| Ticker | CIK | Region |
|--------|-----|--------|
| AAPL | 0000320193 | US |
| MSFT | 0000789019 | US |
| GOOGL | 0001652044 | US |
| GOOG | 0001652044 | US |
| AMZN | 0001018724 | US |
| TSLA | 0001318605 | US |
| META | 0001326801 | US |
| NVDA | 0001045810 | US |
| BRK.A/B | 0001067983 | US |
| JPM | 0000019617 | US |
| JNJ | 0000200406 | US |
| V | 0001403161 | US |
| WMT | 0000104169 | US |
| PG | 0000080424 | US |
| MA | 0001141391 | US |
| UNH | 0000731766 | US |
| HD | 0000354950 | US |
| DIS | 0001744489 | US |
| BAC | 0000070858 | US |
| ADBE | 0000796343 | US |
| CRM | 0001108524 | US |
| NFLX | 0001065280 | US |
| CMCSA | 0001166691 | US |
| XOM | 0000034088 | US |
| PFE | 0000078003 | US |
| CSCO | 0000858877 | US |
| INTC | 0000050863 | US |
| VZ | 0000732712 | US |
| KO | 0000021344 | US |
| PEP | 0000077476 | US |
| MRK | 0000310158 | US |
| ABT | 0000001800 | US |
| NKE | 0000320187 | US |
| ORCL | 0001341439 | US |
| AMD | 0000002488 | US |
| QCOM | 0000804328 | US |
| IBM | 0000051143 | US |
| BA | 0000012927 | US |
| GE | 0000040545 | US |
| ABBV | 0001551152 | US |
| AXP | 0000004962 | US |
| BLK | 0001364742 | US |
| C | 0000831001 | US |
| COP | 0001163165 | US |
| CVX | 0000093410 | US |
| DHR | 0000313616 | US |
| GS | 0000886982 | US |
| LLY | 0000059478 | US |
| MS | 0000895421 | US |
| SBUX | 0000829224 | US |
| SLB | 0000087347 | US |
| TMO | 0000097476 | US |
| WFC | 0000072971 | US |
| BABA | 0001577552 | China |
| PDD | 0001737806 | China |
| JD | 0001549802 | China |
| BIDU | 0001329099 | China |
| NIO | 0001736541 | China |
| LI | 0001791706 | China |
| XPEV | 0001840063 | China |
| NTES | 0001110646 | China |
| BILI | 0001723690 | China |
| YUMC | 0001673358 | China |
| TSM | 0001046179 | Taiwan |
| ASX | 0001122411 | Taiwan |
| CHT | 0001132924 | Taiwan |
| KB | 0001445930 | Korea |
| SHG | 0001263043 | Korea |
| PKX | 0000889132 | Korea |
| LPL | 0001290109 | Korea |
| KEP | 0000887225 | Korea |
| TM | 0001094517 | Japan |
| SONY | 0000313838 | Japan |
| MUFG | 0000067088 | Japan |
| SMFG | 0001022837 | Japan |
| NMR | 0001163653 | Japan |
| MFG | 0001335730 | Japan |
| HMC | 0000715153 | Japan |
| SIFY | 0001094324 | Japan |
| INFY | 0001067491 | India |
| WIT | 0001123799 | India |
| HDB | 0001144967 | India |
| IBN | 0001103838 | India |
| REDY | 0001135971 | India |
| PBR | 0001119639 | Brazil |
| VALE | 0000917851 | Brazil |
| ITUB | 0001132597 | Brazil |
| BBD | 0001160330 | Brazil |
| ABEV | 0001565025 | Brazil |
| SBS | 0001170858 | Brazil |
| TIMB | 0001826168 | Brazil |
| GGB | 0001073404 | Brazil |
| LTM | 0001047716 | Brazil |
| BP | 0000313807 | UK |
| SHEL | 0001306965 | UK |
| HSBC | 0001089113 | UK |
| AZN | 0000901832 | UK |
| GSK | 0001131399 | UK |
| DEO | 0000835403 | UK |
| UL | 0000217410 | UK |
| BCS | 0000312069 | UK |
| RIO | 0000863064 | UK |
| BTI | 0001303523 | UK |
| SNY | 0001121404 | France |
| TTE | 0000879764 | France |
| SAP | 0001000184 | Germany |
| DTEGY | 0000946770 | Germany |
| ASML | 0000937966 | Netherlands |
| ING | 0001039765 | Netherlands |
| PHG | 0000313216 | Netherlands |
| STLA | 0001605484 | Netherlands |
| NVO | 0000353278 | Denmark |
| NVS | 0001114448 | Switzerland |
| UBS | 0001610520 | Switzerland |
| BHP | 0000811809 | Australia |
| TEVA | 0000818686 | Israel |
| CHKP | 0001015922 | Israel |
| NICE | 0001003935 | Israel |
| WIX | 0001576789 | Israel |
| MNDY | 0001845338 | Israel |
| AMX | 0001129137 | Mexico |
| FMX | 0001061736 | Mexico |
| TV | 0000912892 | Mexico |
| CX | 0001076378 | Mexico |
| YPF | 0000904851 | Argentina |
| CRESY | 0001034957 | Argentina |
| IRS | 0000933267 | Argentina |
| BMA | 0001347426 | Argentina |
| GGAL | 0001114700 | Argentina |
| SUPV | 0001517399 | Argentina |
| TEO | 0000932470 | Argentina |
| TX | 0001342874 | Argentina |
| PAM | 0001469395 | Argentina |
| LOMA | 0001711375 | Argentina |
| SQM | 0000909037 | Chile |
| CIB | 0002058897 | Colombia |
| SAN | 0000891478 | Spain |
| GOLD | 0001591588 | South Africa |
| GFI | 0001172724 | South Africa |
| SBSW | 0001786909 | South Africa |
| HMY | 0001023514 | South Africa |
| AU | 0001973832 | South Africa |
| ABBNY | 0001091587 | Misc |

---

## Appendix B: Evidence Tier Scoring Reference

| Tier | Score | Meaning | Uncertainty |
|------|-------|---------|------------|
| DIRECT | 100 | Explicitly disclosed in SEC filing | ±5% |
| ALLOCATED | 75 | Derived from structural constraint (region → prior) | ±10% |
| MODELED | 50 | Prior-based inference, no direct constraint | ±20% |
| FALLBACK | 20 | Global fallback prior, no filing data | ±30% |
| NOT_RUN | 0 | Pipeline not executed | N/A |

---

## Appendix C: Channel Weight Reference

| Channel | Coefficient | Rationale |
|---------|-----------|-----------|
| Revenue | 0.40 (40%) | Primary economic exposure signal |
| Supply | 0.35 (35%) | Operational dependency signal |
| Assets | 0.15 (15%) | Physical presence signal |
| Financial | 0.10 (10%) | Capital market exposure |
| Market | 0.00 (0%) | Removed from calculation |

---

*Report generated by David (Data Analyst) — CO-GRI Platform Investigation*  
*All analysis is based on static code review. No live API calls were made.*  
*Source files reviewed: secFilingParser.ts, structuredDataIntegratorV5.ts, narrativeParser.ts, geographicExposureService.ts, cogriCalculationService.ts, runSECBaseline.ts, fetch_sec_cik/index.ts, fetch_sec_filing/index.ts, extract_geographic_narrative/index.ts, sec_baseline_results.json*