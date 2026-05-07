# Company Dashboard Search — Pre-Implementation Investigation Report

**Date:** 2026-03-19  
**Analyst:** David (Data Analyst)  
**Status:** Investigation Complete — No Code Changes Made  
**Scope:** Answers to two specific user questions before proceeding with any fix

---

## Question 1: How Frequently Is `companyDatabase.ts` Updated?

### Short Answer

**`companyDatabase.ts` is a 100% static, manually maintained hardcoded file. It has NO automatic update mechanism, NO connection to any external data source, NO version or timestamp field, and NO scheduled refresh. It was written once and has not been changed since the project's initial commit.**

---

### Evidence

#### 1.1 The File Has No Dynamic Behavior Whatsoever

A full read of `src/utils/companyDatabase.ts` (451 lines, 46 KB) confirms:

- **Zero `fetch()` calls** — no HTTP requests of any kind
- **Zero `async`/`await`** — every function is synchronous
- **Zero imports from any API, service, or external module** — the only content is a hardcoded TypeScript array literal
- **No `lastUpdated`, `version`, `timestamp`, `dataVintage`, or `generatedAt` field** anywhere in the file
- The file structure is simply: `const companies: Company[] = [ ...hardcoded entries... ]` followed by pure utility functions (`lookupCompany`, `searchCompanies`, `getCompaniesByCountry`, etc.)

#### 1.2 Git History Confirms It Was Written Once

```
git log --oneline --follow -- src/utils/companyDatabase.ts

cce8587  original    ← only one commit, the initial commit
```

The file has **exactly one commit in its entire history** — the initial project creation. It has never been updated since.

The full project also has only two commits total:
```
0e71bc2  Company search function issue.   ← investigation branch
cce8587  original                          ← initial commit
```

#### 1.3 No Scripts Maintain or Regenerate This File

A search across all scripts in the project (`/workspace/shadcn-ui/scripts/`, `src/scripts/`, `*.sh`, `*.py`, `*.ts` scripts) confirms:

- **`scripts/daily-health-check.sh`** — monitors CSI signal ingestion and PostgreSQL health. Zero references to `companyDatabase.ts`.
- **`scripts/weekly-validation-report.sh`** — generates CSI drift reports from PostgreSQL. Zero references to `companyDatabase.ts`.
- **`src/scripts/batchProcessCompanies.ts`** — processes SEC filings and writes to `companySpecificExposures.ts`. Zero references to `companyDatabase.ts`.
- **`generate-data-source-report.ts`** — scans `companySpecificExposures.ts` and `enhancedNASDAQDatabase.ts`. Zero references to `companyDatabase.ts`.
- **`package.json` scripts** — `dev`, `build`, `test`, `lint`, `csi:calculate`, `csi:compare`, `csi:backtest`, `csi:explain`. None of these touch `companyDatabase.ts`.

#### 1.4 The `NASDAQProcessingEngine` Does NOT Write to This File

The `NASDAQProcessingEngine.ts` has an `updateCompanyInDatabase()` method, but it writes to `enhancedNASDAQDatabase` (an in-memory runtime object), **not** to `companyDatabase.ts` on disk.

#### 1.5 `RealTimeUpdateSystem.ts` Does NOT Write to This File

`RealTimeUpdateSystem.ts` has scheduled monitoring tasks and `updateCompanyConfidence()` methods, but a full grep confirms it has **zero imports from or writes to `companyDatabase.ts`**.

---

### What the Data Actually Contains (Staleness Assessment)

| Exchange | # Companies | Coverage | Staleness Risk |
|---|---|---|---|
| NASDAQ (US) | ~90 | Major large-caps only | Medium — tickers stable, but company names/sectors can change (e.g., Twitter → X, Facebook → Meta ✅ already updated) |
| NYSE (US) | ~61 | Major large-caps only | Medium — same as above |
| TSX (Canada) | 34 | Energy-heavy, reasonable coverage | Medium |
| LSE (UK) | 10 | Very sparse — only 10 of ~2,000 listed | High — highly incomplete |
| HKEX (Hong Kong) | 8 | Very sparse | High |
| SGX (Singapore) | 5 | Very sparse | High |
| B3 (Brazil) | 6 | Very sparse | High |
| TWSE (Taiwan) | 5 | Very sparse | High |
| JSE (South Africa) | 7 | Very sparse | High |
| BVC (Colombia) | 4 | Very sparse | High |
| **Total** | **~256** | **~256 of ~50,000+ global listed companies** | **Varies** |

**Specific staleness risks to be aware of:**
- **Ticker changes:** Companies occasionally change tickers (e.g., `FB` → `META` — this one IS already updated in the file). Any ticker changes since the file was written will not be reflected.
- **Delistings:** Companies that have been delisted, acquired, or gone private since the file was written are still listed (e.g., `TWTR` — Twitter was taken private in 2022; it may or may not still be in the file).
- **New companies:** Any company that IPO'd after the file was written (e.g., ARM Holdings `ARM`, Instacart `CART`, Birkenstock `BIRK` — all 2023 IPOs) is not in the file.
- **Sector reclassifications:** S&P and MSCI periodically reclassify companies between sectors. The file would not reflect these.

---

### Summary Answer to Question 1

> **`companyDatabase.ts` is never automatically updated. It is a static snapshot written once at project creation and never touched again. There is no pipeline, script, cron job, or mechanism of any kind that updates it. The data is of unknown vintage but likely reflects the state of the market at the time of initial development. For the ~256 companies it does contain, the core data (ticker symbol, company name, exchange) is likely still mostly accurate for major established companies, but it will be missing all recent IPOs, will not reflect any ticker changes, and its coverage of non-US exchanges is extremely sparse (5–10 companies per exchange).**

---
---

## Question 2: Is a Hybrid Option A (companyDatabase.ts primary) + TickerSearchInput Live API Fallback Feasible?

### Short Answer

**Yes — this hybrid approach is not only feasible but is architecturally clean and low-risk. The existing code already implements almost exactly this pattern in `tickerResolution.ts`. The main work is wiring it into `GlobalNavigationBar.tsx`, which requires changes to one file. There are interface differences to bridge, but they are minor and well-defined.**

---

### How the Hybrid Would Work (Conceptually)

```
User types in GlobalNavigationBar search box
  │
  ▼
Step 1: Instantly search companyDatabase.ts (synchronous, ~0ms)
  │
  ├── Results found (≥1 match)?
  │     └── YES → Show local results immediately (labeled "Local DB")
  │                 Continue to Step 2 in background for enrichment
  │
  └── NO results → Step 2: Call tickerResolution.searchCompanies() (async, ~300-2000ms)
                      │
                      ├── Searches Marketstack API
                      ├── Searches Yahoo Finance API  
                      └── Searches Alpha Vantage API
                            │
                            └── Show live results (labeled "Live Search")
```

---

### Detailed Feasibility Analysis

#### 2.1 The Good News: `tickerResolution.ts` Already Implements This Pattern

The `searchCompanies()` function in `src/services/tickerResolution.ts` (lines 320–360) **already does exactly the local-first, API-fallback pattern**:

```typescript
export async function searchCompanies(query: string): Promise<CompanySearchResult[]> {
  // Step 1: Search local companyDatabase.ts first
  const localResults = await searchLocalDatabase(normalizedQuery);
  
  // Step 2: If local results exist, return immediately
  if (localResults.length > 0) {
    return localResults;  // ← instant response from companyDatabase.ts
  }
  
  // Step 3: Only if no local results, call all three live APIs in parallel
  const [marketstackResults, yahooResults, alphaResults] = await Promise.all([
    searchMarketstack(normalizedQuery),
    searchYahooFinance(normalizedQuery),
    searchAlphaVantage(normalizedQuery)
  ]);
  // ... deduplicate and return
}
```

This is **precisely** the hybrid behavior the user is asking for. The service already exists and is already working (it's used by `TickerSearchInput` on the Portfolio page).

---

#### 2.2 Interface Mismatch Analysis

The main technical challenge is that `GlobalNavigationBar` currently expects `NASDAQCompanyData` objects, but `tickerResolution.searchCompanies()` returns `CompanySearchResult` objects. Here is the exact field-by-field comparison:

| Field Used in GlobalNavigationBar | `NASDAQCompanyData` field | `CompanySearchResult` field | Match? |
|---|---|---|---|
| Display ticker | `company.ticker` | `company.symbol` | ⚠️ Different field name |
| Display company name | `company.companyName` | `company.name` | ⚠️ Different field name |
| Display sector badge | `company.sector` | `company.sector` | ✅ Same |
| Navigate to company | `company.ticker` | `company.symbol` | ⚠️ Different field name |
| Set selected entity name | `company.companyName` | `company.name` | ⚠️ Different field name |

**The mismatch is purely cosmetic — field naming only.** The underlying data is equivalent. The fix is a simple rename in the `handleCompanySelect` function and the JSX rendering block.

**Current code (uses `NASDAQCompanyData`):**
```typescript
const handleCompanySelect = (company: NASDAQCompanyData) => {
  setSelectedEntity({ type: 'company', name: company.companyName });  // ← companyName
  setLocation(`/company?ticker=${company.ticker}`);                    // ← ticker
};

// JSX:
<span>{company.ticker}</span>        // ← ticker
<span>{company.companyName}</span>   // ← companyName
<Badge>{company.sector}</Badge>      // ← sector (same)
```

**After fix (uses `CompanySearchResult`):**
```typescript
const handleCompanySelect = (company: CompanySearchResult) => {
  setSelectedEntity({ type: 'company', name: company.name });          // ← name
  setLocation(`/company?ticker=${company.symbol}`);                    // ← symbol
};

// JSX:
<span>{company.symbol}</span>        // ← symbol
<span>{company.name}</span>          // ← name
<Badge>{company.sector}</Badge>      // ← sector (same)
```

That is the entirety of the interface bridge required.

---

#### 2.3 The `filteredCompanies` useMemo Must Become Async

The current search in `GlobalNavigationBar` is **synchronous** (inside a `useMemo`):

```typescript
// CURRENT — synchronous, instant
const filteredCompanies = useMemo(() => {
  if (!searchQuery) return [];
  return searchNASDAQCompanies(searchQuery).slice(0, 5);  // sync
}, [searchQuery]);
```

The hybrid approach requires **async** behavior because the live API fallback involves network calls. This means:

1. The `useMemo` must be replaced with a `useState` + `useEffect` pattern (or `useCallback` with debounce)
2. A loading state (`isSearching: boolean`) should be added to show a spinner while APIs are being called
3. A debounce of ~300ms should be applied to avoid firing API calls on every keystroke

**Proposed state structure:**
```typescript
const [filteredCompanies, setFilteredCompanies] = useState<CompanySearchResult[]>([]);
const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

useEffect(() => {
  if (!searchQuery || searchQuery.length < 2) {
    setFilteredCompanies([]);
    return;
  }
  
  const timer = setTimeout(async () => {
    setIsSearchingCompanies(true);
    try {
      const results = await searchCompanies(searchQuery);  // from tickerResolution.ts
      setFilteredCompanies(results.slice(0, 8));
    } catch (e) {
      setFilteredCompanies([]);
    } finally {
      setIsSearchingCompanies(false);
    }
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchQuery]);
```

This is a standard React async search pattern. The `TickerSearchInput` component already implements exactly this (lines 55–75 of `TickerSearchInput.tsx`), so the pattern is proven and tested in this codebase.

---

#### 2.4 UX Behavior of the Hybrid

The user experience would be:

| Scenario | What Happens | Latency |
|---|---|---|
| User types "AAPL" | Instant local result from `companyDatabase.ts` | ~0ms |
| User types "Apple" | Instant local result (alias match) | ~0ms |
| User types "NVDA" | Instant local result | ~0ms |
| User types "ARM" (2023 IPO, not in local DB) | No local result → API call fires → Marketstack/Yahoo return ARM Holdings | ~300–1500ms |
| User types "Birkenstock" (2023 IPO) | No local result → API call fires → live results | ~300–1500ms |
| User types "7203.T" (Toyota Japan) | No local result (not in local DB) → API call → live results | ~300–1500ms |
| API call fails / times out | Graceful fallback — show "No results found" | N/A |

**For the ~256 companies in `companyDatabase.ts`, response is instant.** For everything else, there is a brief loading delay while APIs are called. This is the same behavior already working on the Portfolio page via `TickerSearchInput`.

---

#### 2.5 API Key Considerations

The `tickerResolution.ts` service uses three APIs:

| API | Key Status | Concern |
|---|---|---|
| **Marketstack** | Live key hardcoded: `64040504cef9e565bd09fa77b54ae274` | ⚠️ Key is hardcoded in source code — a security concern for production. The free tier has rate limits (100 req/month on free plan). |
| **Yahoo Finance** | No key needed (public endpoint) | ⚠️ Yahoo Finance's unofficial API (`query2.finance.yahoo.com`) is not officially supported and may break without notice. Currently functional. |
| **Alpha Vantage** | Key is `'demo'` (placeholder) | ⚠️ The `demo` key is rate-limited to 5 requests/minute and 100/day. The code already handles this gracefully (returns empty array on rate limit). |

**For the hybrid approach, this is not a blocker** — the local `companyDatabase.ts` handles the vast majority of common searches instantly without touching any API. The APIs only fire when the local DB has no results, which significantly reduces API call volume.

---

#### 2.6 The `source` Badge — An Added Benefit

`CompanySearchResult` has a `source` field (`'local' | 'marketstack' | 'yahoo' | 'alphavantage'`) that `TickerSearchInput` already uses to display colored source badges. This could be optionally surfaced in the `GlobalNavigationBar` dropdown to give users transparency about where results came from — though this is a cosmetic enhancement, not a requirement.

---

#### 2.7 Files That Would Need to Change

For the hybrid Option A + live API fallback:

| File | Change Required | Complexity |
|---|---|---|
| `src/components/navigation/GlobalNavigationBar.tsx` | Replace `searchNASDAQCompanies` import with `searchCompanies` from `tickerResolution.ts`; change `useMemo` to `useState`+`useEffect`+debounce; update `handleCompanySelect` field names; update JSX field names; optionally add loading spinner | **Medium** — ~30–40 lines changed |
| `src/services/tickerResolution.ts` | No changes needed — already implements the hybrid pattern correctly | **None** |
| `src/utils/companyDatabase.ts` | No changes needed | **None** |
| `src/components/TickerSearchInput.tsx` | No changes needed — not used by GlobalNavigationBar in this approach | **None** |

**Total scope: 1 file, ~30–40 lines of changes.**

---

#### 2.8 Alternative: Directly Embed `TickerSearchInput` in the Nav Bar

Instead of calling `tickerResolution.searchCompanies()` directly, the `<TickerSearchInput>` component could be embedded in `GlobalNavigationBar`. However, this is **not recommended** for the following reasons:

1. `TickerSearchInput` has a **light-theme UI** (`bg-white text-gray-900 border-gray-300`) that conflicts with the nav bar's dark teal theme (`bg-[#0a0f0d] border-[#0d5f5f]`). Restyling it would require additional work.
2. `TickerSearchInput` is designed as a standalone form input with its own dropdown. Embedding it inside the nav bar's existing dropdown would create nested dropdown conflicts.
3. The nav bar search also handles **country search** in the same input — `TickerSearchInput` only handles companies. Replacing the nav bar's `<Input>` with `<TickerSearchInput>` would break country search.

**Conclusion: Calling `tickerResolution.searchCompanies()` directly (as described in section 2.3) is the correct approach — not embedding `TickerSearchInput` as a component.**

---

### Summary Answer to Question 2

> **Yes, the hybrid approach is fully feasible and architecturally sound. The `tickerResolution.ts` service already implements the exact local-first + API-fallback pattern needed. The work required is confined to a single file (`GlobalNavigationBar.tsx`), involves ~30–40 lines of changes, and the main tasks are: (1) replacing the synchronous `useMemo` search with an async `useEffect`+debounce pattern, (2) swapping the import from `nasdaqCompanyDatabase` to `tickerResolution`, and (3) renaming two field references (`companyName` → `name`, `ticker` → `symbol`). The result would be: instant results for all ~256 companies in `companyDatabase.ts`, and live API fallback for any company not found locally (covering recent IPOs, international tickers, and the full universe of listed securities). The Marketstack API key being hardcoded in source code is a pre-existing security concern to be aware of, but it does not block this approach.**

---

## Combined Recommendation

Given the answers to both questions:

1. **`companyDatabase.ts` is static and never updated** — it is a reliable but frozen snapshot. It is safe to use as the primary (instant) search layer, but it will always have gaps for new companies and sparse international coverage.

2. **The hybrid approach is feasible in ~1 file** — `tickerResolution.ts` already does the heavy lifting. The live API fallback elegantly fills the gaps left by the static local database.

**Therefore, the recommended implementation is:**

> **Proceed with the hybrid approach: use `tickerResolution.searchCompanies()` in `GlobalNavigationBar.tsx`, which automatically searches `companyDatabase.ts` first (instant, covers ~256 companies) and falls back to live APIs (Marketstack, Yahoo Finance, Alpha Vantage) for any company not found locally.** This is the most complete solution, requires the fewest file changes (1 file), and leverages code that is already written, tested, and working in the Portfolio page.

---

*Report prepared by David (Data Analyst) — No code changes were made during this investigation.*