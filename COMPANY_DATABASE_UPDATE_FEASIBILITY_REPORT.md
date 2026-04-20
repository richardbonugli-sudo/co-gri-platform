# `companyDatabase.ts` — Automated Daily Update Feasibility Report

**Date:** 2026-03-19  
**Analyst:** David (Data Analyst)  
**Status:** Investigation Complete — No Code Changes Made  
**Scope:** Full feasibility analysis of automating daily updates to `companyDatabase.ts` for all 256 companies across all fields

---

## 1. Exact Data Structure Being Updated

### 1.1 TypeScript Interface

```typescript
export interface Company {
  ticker: string;       // e.g. 'AAPL', 'SHEL.L', 'TOU.TO'
  name: string;         // e.g. 'Apple Inc.'
  exchange: string;     // e.g. 'NASDAQ', 'LSE', 'TSX', 'HKEX'
  country: string;      // e.g. 'United States', 'United Kingdom'
  sector: string;       // e.g. 'Technology', 'Energy', 'Healthcare'
  isADR?: boolean;      // Optional — true for ADR-listed foreign companies
  aliases?: string[];   // Optional — alternative names/abbreviations
}
```

### 1.2 Field-by-Field Update Frequency Assessment

| Field | Change Frequency | Update Needed? | Notes |
|---|---|---|---|
| `ticker` | Very rare (ticker changes, delistings) | **Yes** | TWTR→X, FB→META type events; ~5–10/year across 256 companies |
| `name` | Rare (rebranding, mergers) | **Yes** | e.g. Facebook→Meta Platforms; ~2–5/year |
| `exchange` | Very rare (cross-listing changes) | **Low priority** | Almost never changes for established companies |
| `country` | Extremely rare (reincorporation) | **Low priority** | Almost never changes |
| `sector` | Rare (GICS reclassifications, ~annual) | **Yes** | S&P/MSCI reclassify sectors ~1–2x/year |
| `isADR` | Very rare | **Low priority** | Only changes if ADR is delisted or new ADR created |
| `aliases` | Never (manually curated) | **No** | Aliases are human-authored convenience strings, not from any API |

**Practical conclusion:** For the 256 companies currently in the database, the fields that actually need updating are `ticker` (for renames/delistings), `name` (for rebranding), and `sector` (for GICS reclassifications). `exchange` and `country` are effectively permanent for established large-caps. `aliases` cannot be sourced from any API — they are manually curated.

### 1.3 Company Count by Exchange

| Exchange | Count | Region |
|---|---|---|
| NASDAQ (US) | ~90 | United States |
| NYSE (US) | ~61 | United States |
| TSX (Canada) | 34 | Canada |
| LSE (UK) | 10 | United Kingdom |
| HKEX (Hong Kong) | 8 | Hong Kong |
| JSE (South Africa) | 7 | South Africa |
| B3 (Brazil) | 6 | Brazil |
| SGX (Singapore) | 5 | Singapore |
| TWSE (Taiwan) | 5 | Taiwan |
| BVC (Colombia) | 4 | Colombia |
| ADRs (US-listed foreign) | ~26 | Various (isADR: true) |
| **Total** | **256** | **10 exchanges, 9+ countries** |

---

## 2. Existing API Infrastructure Audit

The project already has integrations with four APIs. Here is a complete audit of each.

### 2.1 Alpha Vantage (`src/services/alphaVantageService.ts`, `src/services/tickerResolution.ts`)

**Current usage:** `SYMBOL_SEARCH` (ticker lookup), `OVERVIEW` (company fundamentals), `GLOBAL_QUOTE` (stock prices), `INCOME_STATEMENT`, `BALANCE_SHEET`, `CASH_FLOW`, `EARNINGS`

**Fields it can provide for `companyDatabase.ts` update:**

| companyDatabase field | Alpha Vantage field | Available? |
|---|---|---|
| `ticker` | `Symbol` | ✅ Yes |
| `name` | `Name` | ✅ Yes |
| `exchange` | `Exchange` | ✅ Yes (`NASDAQ`, `NYSE`, `LSE`, etc.) |
| `country` | `Country` | ✅ Yes |
| `sector` | `Sector` | ✅ Yes (GICS sector) |
| `isADR` | `AssetType` | ✅ Derivable (`AssetType === 'ETF'` or `'ADR'`) |
| `aliases` | — | ❌ Not available from any API |

**Alpha Vantage `OVERVIEW` endpoint returns for a single ticker:**
- `Symbol`, `Name`, `Exchange`, `Country`, `Sector`, `Industry`, `AssetType`, `CIK`, `Address`, `Description`, `MarketCapitalization`, `PERatio`, `EPS`, `52WeekHigh`, `52WeekLow`, and ~40 more financial metrics

**Rate Limits:**

| Tier | Requests/min | Requests/day | Cost |
|---|---|---|---|
| Free (`demo` key) | 5 | 100 | $0 |
| Free (registered key) | 5 | 500 | $0 |
| Premium (30 req/min) | 30 | 1,500 | ~$50/month |
| Premium (75 req/min) | 75 | Unlimited | ~$120/month |
| Enterprise | Unlimited | Unlimited | Custom |

**Current key status:** The project uses `'demo'` key in `tickerResolution.ts` and `import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo'` in `alphaVantageService.ts`. No real key is configured (no `.env` file exists).

**Feasibility for 256-company daily update:**
- Free tier (500 req/day): 256 companies × 1 `OVERVIEW` call = **256 requests/day** ✅ Fits within free tier
- Time required at 5 req/min: 256 ÷ 5 = **51.2 minutes** per daily run
- **Coverage:** Alpha Vantage `OVERVIEW` only covers US-listed stocks and a limited set of international stocks. For TSX (`.TO`), LSE (`.L`), HKEX (`.HK`), B3 (`.SA`), TWSE (`.TW`), JSE (`.JO`), BVC (`.CO`) — coverage is **unreliable to non-existent** on the free tier.
- **International coverage gap:** ~105 of 256 companies are non-US. Alpha Vantage free tier will return empty/error for most of these.

---

### 2.2 Financial Modeling Prep / FMP (`src/services/financialDataAPI.ts`)

**Current usage:** `VITE_FMP_API_KEY` env var (not configured — no `.env` file). The service is fully coded but **disabled by default** (`ENABLE_FMP: false`, only enabled if key is present).

**Endpoints already coded in the project:**
- `/api/v3/profile/{ticker}` — returns `companyName`, `country`, `sector`, `exchange`, `isADR`
- `/api/v3/revenue-geographic-segmentation/{ticker}` — geographic revenue breakdown

**Fields FMP `/profile` endpoint returns relevant to `companyDatabase.ts`:**

| companyDatabase field | FMP field | Available? |
|---|---|---|
| `ticker` | `symbol` | ✅ Yes |
| `name` | `companyName` | ✅ Yes |
| `exchange` | `exchangeShortName` | ✅ Yes |
| `country` | `country` | ✅ Yes |
| `sector` | `sector` | ✅ Yes (GICS) |
| `isADR` | `isAdr` | ✅ Yes (explicit boolean field) |
| `aliases` | — | ❌ Not available |

**FMP also offers a bulk endpoint:** `/api/v3/stock/list` — returns ALL listed companies in one call (ticker, name, exchange, type). This is the most efficient option for a daily update.

**Rate Limits:**

| Tier | Requests/day | Bulk endpoint | Cost |
|---|---|---|---|
| Free | 250 | ✅ `/stock/list` included | $0 |
| Starter | 300/min | ✅ | ~$19/month |
| Professional | 750/min | ✅ | ~$49/month |

**Feasibility for 256-company daily update:**
- **Option A (per-ticker):** 256 × `/profile/{ticker}` = 256 requests. Free tier (250/day) is just barely insufficient; Starter tier (300/min) is trivially sufficient.
- **Option B (bulk):** 1 call to `/stock/list` returns all ~70,000 listed companies. Filter to 256 tickers locally. **1 API call total.** This is by far the most efficient approach.
- **International coverage:** FMP covers US, Canada (TSX), UK (LSE), Hong Kong (HKEX), Brazil (B3), and many other exchanges. Coverage is significantly better than Alpha Vantage for international stocks.
- **Key status:** Not configured. A free key from `financialmodelingprep.com` is required.

---

### 2.3 Marketstack (`src/services/tickerResolution.ts`)

**Current usage:** `/v1/tickers?search={query}` — used for real-time search only

**Current key:** `64040504cef9e565bd09fa77b54ae274` — hardcoded in source (security concern)

**Fields Marketstack `/tickers` returns:**

| companyDatabase field | Marketstack field | Available? |
|---|---|---|
| `ticker` | `symbol` | ✅ Yes |
| `name` | `name` | ✅ Yes |
| `exchange` | `stock_exchange.acronym` | ✅ Yes |
| `country` | `stock_exchange.country` | ✅ Yes (exchange country, not company HQ) |
| `sector` | — | ❌ Not available in search results |
| `isADR` | — | ❌ Not available |
| `aliases` | — | ❌ Not available |

**Rate Limits:**

| Tier | Requests/month | Bulk endpoint | Cost |
|---|---|---|---|
| Free | 100 | ❌ No bulk | $0 |
| Basic | 10,000 | ❌ No bulk | ~$9/month |
| Professional | 100,000 | ✅ `/tickers` paginated | ~$49/month |

**Feasibility for 256-company daily update:**
- Free tier: **100 requests/month** — completely insufficient for daily updates (would need 256 × 30 = 7,680/month)
- **Sector field is missing** — Marketstack does not return sector classification in its ticker search endpoint
- **Verdict:** Marketstack is **not suitable** as the primary source for daily updates. It is well-suited for real-time search (its current use) but lacks sector data and has prohibitive rate limits on the free tier for batch updates.

---

### 2.4 Yahoo Finance (`src/services/tickerResolution.ts`, `src/services/financialDataAPI.ts`)

**Current usage:**
- `https://query2.finance.yahoo.com/v1/finance/search?q={query}` — real-time search
- `https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=assetProfile,financialData` — company profile

**Fields Yahoo Finance returns:**

| companyDatabase field | Yahoo Finance field | Available? |
|---|---|---|
| `ticker` | `symbol` | ✅ Yes |
| `name` | `longname` / `shortname` | ✅ Yes |
| `exchange` | `exchange` / `exchDisp` | ✅ Yes (but uses internal codes: `NMS`, `NYQ`, `TOR`, `LON`) |
| `country` | `assetProfile.country` | ✅ Yes (via `quoteSummary`) |
| `sector` | `assetProfile.sector` | ✅ Yes (via `quoteSummary`) |
| `isADR` | `quoteType` | ✅ Derivable (`quoteType === 'ETF'` or check for ADR in name) |
| `aliases` | — | ❌ Not available |

**Rate Limits:**
- Yahoo Finance has **no official API** and **no official rate limits** — it is an unofficial/undocumented endpoint
- In practice: ~2,000 requests/hour before IP-based throttling
- **No API key required**
- **Risk:** Yahoo Finance has broken its unofficial API multiple times without notice. It is currently functional but unreliable for production use.
- **Terms of Service:** Yahoo Finance's ToS prohibits automated scraping/bulk data extraction. Using it for a daily batch update of 256 companies is a **ToS violation risk**.

**Feasibility for 256-company daily update:**
- Technically feasible (no rate limit for 256 calls)
- **Not recommended** as primary source due to ToS concerns and API instability
- Suitable as a **fallback** when other APIs fail

---

### 2.5 SEC EDGAR (`src/services/financialDataAPI.ts`)

**Current usage:** CIK lookup + company facts (XBRL data) — used for geographic revenue data

**Fields SEC EDGAR returns relevant to `companyDatabase.ts`:**

| companyDatabase field | SEC EDGAR field | Available? |
|---|---|---|
| `ticker` | `tickers[]` in company facts | ✅ Yes |
| `name` | `entityName` | ✅ Yes |
| `exchange` | `exchanges[]` in company facts | ✅ Yes |
| `country` | — | ❌ Not directly (SEC covers US-listed companies only) |
| `sector` | SIC code (requires mapping) | ⚠️ Partial (SIC → GICS mapping needed) |
| `isADR` | `category` field | ⚠️ Partial |
| `aliases` | — | ❌ Not available |

**Rate Limits:**
- **Free, no key required**
- Limit: 10 requests/second per IP
- **Coverage: US-listed companies only** — cannot update TSX, LSE, HKEX, B3, TWSE, JSE, BVC companies
- **Verdict:** Useful as a free fallback for US companies only. Not suitable for international coverage.

---

## 3. API Coverage Matrix — Which APIs Can Update Which Fields

| Field | Alpha Vantage | FMP | Marketstack | Yahoo Finance | SEC EDGAR |
|---|---|---|---|---|---|
| `ticker` | ✅ US only | ✅ Global | ✅ Global | ✅ Global | ✅ US only |
| `name` | ✅ US only | ✅ Global | ✅ Global | ✅ Global | ✅ US only |
| `exchange` | ✅ US only | ✅ Global | ✅ Global | ⚠️ Internal codes | ✅ US only |
| `country` | ✅ US only | ✅ Global | ⚠️ Exchange country | ✅ Global | ❌ US only |
| `sector` | ✅ US only | ✅ Global | ❌ Missing | ✅ Global | ⚠️ SIC only |
| `isADR` | ✅ AssetType | ✅ isAdr field | ❌ Missing | ⚠️ Derivable | ⚠️ Partial |
| `aliases` | ❌ | ❌ | ❌ | ❌ | ❌ |
| **International (non-US)** | ❌ Poor | ✅ Good | ✅ Good | ✅ Good | ❌ None |
| **Free tier sufficient?** | ✅ 500/day | ⚠️ 250/day | ❌ 100/month | ✅ Unlimited* | ✅ Unlimited |
| **Bulk endpoint?** | ❌ No | ✅ Yes | ❌ No | ❌ No | ⚠️ Partial |
| **ToS risk?** | Low | Low | Low | **High** | None |

*Yahoo Finance unofficial API — ToS concerns

---

## 4. Feasibility of a Daily Node.js Update Script

### 4.1 Technical Architecture

A daily update script for `companyDatabase.ts` would work as follows:

```
Daily Update Script (Node.js / tsx)
  │
  ├── Step 1: Read current companyDatabase.ts (parse 256 tickers)
  │
  ├── Step 2: For each ticker, fetch fresh data from API
  │     ├── US companies (151): Alpha Vantage OVERVIEW or FMP /profile
  │     └── International (105): FMP /profile or Yahoo Finance quoteSummary
  │
  ├── Step 3: Compare fetched data vs. current data
  │     ├── Detect changes: ticker renames, name changes, sector reclassifications
  │     └── Flag delistings (API returns no data)
  │
  ├── Step 4: Generate updated companyDatabase.ts content
  │     └── Preserve aliases (not from API — keep existing values)
  │
  └── Step 5: Write updated file to disk
        └── Optional: Git commit with change summary
```

### 4.2 API Call Volume Requirements

| Approach | API Calls per Run | Time Required | Cost |
|---|---|---|---|
| **Per-ticker (Alpha Vantage free)** | 256 calls | ~51 min at 5/min | $0 (but poor intl coverage) |
| **Per-ticker (FMP free)** | 256 calls | ~3 min at 1/sec | $0 (250/day limit — barely fits) |
| **Per-ticker (FMP Starter)** | 256 calls | <1 min | ~$19/month |
| **Bulk FMP `/stock/list`** | **1 call** | <5 seconds | $0 on free tier |
| **Hybrid: FMP bulk + AV fallback** | 1 + ~50 fallback | <10 minutes | $0 |

**The bulk FMP `/stock/list` approach is overwhelmingly the most efficient** — 1 API call downloads all ~70,000 listed companies, then the script filters to the 256 tickers in `companyDatabase.ts`. This approach requires zero rate limit management.

### 4.3 What a Daily Update Script Can and Cannot Do

**CAN update automatically:**
- ✅ Detect ticker renames (e.g., `FB` → `META`) — via API returning new symbol
- ✅ Detect delistings (API returns no data for the ticker)
- ✅ Update company names after rebranding
- ✅ Update sector classifications after GICS reclassifications
- ✅ Update `isADR` flag
- ✅ Detect new companies that should be added (if the script is extended to check for new large-caps)

**CANNOT update automatically:**
- ❌ `aliases` — these are manually curated convenience strings (e.g., `['Apple']`, `['Google', 'Alphabet']`). No API provides these. They must remain manually maintained.
- ❌ Detect when a company *should* be added to the database (the script only updates existing entries, not discovers new ones — unless extended with a "new large-cap detection" feature)
- ❌ Handle complex corporate events automatically (spin-offs, mergers creating new tickers) — these require human review

### 4.4 Execution Environment Options

| Option | Description | Complexity | Cost |
|---|---|---|---|
| **GitHub Actions (scheduled)** | Add a `schedule: cron` workflow to `.github/workflows/` | Low | Free (2,000 min/month on free tier) |
| **Node.js cron in server.js** | Add `node-cron` or `setInterval` to existing Express server | Low | Runs on existing server |
| **Standalone Node.js script** | `tsx scripts/update-company-database.ts` run via system cron | Low | Free |
| **Supabase Edge Function** | Scheduled edge function (project already uses Supabase) | Medium | Free tier includes scheduled functions |

**GitHub Actions is the recommended approach** because:
1. The project already has a `.github/workflows/` directory with `visual-regression.yml`
2. GitHub Actions supports `schedule: cron` triggers natively
3. It runs in an isolated environment, separate from the app server
4. It can automatically commit the updated `companyDatabase.ts` back to the repo
5. It is free for public repos and has generous free minutes for private repos

**Existing workflow pattern to follow:**
```yaml
# .github/workflows/update-company-database.yml
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6am UTC
  workflow_dispatch:       # Manual trigger
```

---

## 5. Risks and Limitations

### 5.1 API Reliability Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Yahoo Finance unofficial API breaks | High | Use FMP or Alpha Vantage as primary; Yahoo as fallback only |
| Alpha Vantage rate limit exceeded | Medium | Use FMP bulk endpoint instead; or add 12-second delay between calls |
| FMP free tier (250/day) insufficient | Low | 256 > 250 by 6 calls; upgrade to Starter ($19/mo) or use bulk endpoint (1 call) |
| Marketstack key hardcoded in source | Medium | Move to `.env` file before any production use |
| API returns stale/incorrect data | Low | Compare against previous version; flag unexpected changes for human review |

### 5.2 Data Quality Risks

| Risk | Severity | Notes |
|---|---|---|
| Sector classification differences between APIs | Medium | Alpha Vantage uses GICS; FMP uses GICS; Yahoo uses GICS — generally consistent, but minor differences exist |
| Exchange code format differences | Medium | Alpha Vantage returns `NASDAQ`; FMP returns `NASDAQ`; Yahoo returns `NMS` (internal code). Mapping layer needed for Yahoo. |
| International company coverage gaps | High | Alpha Vantage has poor coverage for TSX, LSE, HKEX, B3, TWSE, JSE, BVC. FMP has better coverage. |
| ADR detection accuracy | Low | FMP has explicit `isAdr` boolean. Alpha Vantage requires inference from `AssetType`. |
| Ticker format differences | Medium | International tickers use suffixes (`.L`, `.TO`, `.HK`). FMP uses different suffix conventions than the current database. Mapping required. |

### 5.3 `aliases` Field — Cannot Be Automated

This is the most important limitation. The `aliases` field (present on all 256 entries) contains human-authored convenience strings:
- `['Apple']` for AAPL
- `['Google', 'Alphabet']` for GOOGL
- `['JPMorgan', 'Chase']` for JPM
- `['Royal Dutch Shell', 'Shell']` for SHEL.L

**No financial data API provides aliases.** If a daily update script regenerates the file from API data, it would **lose all aliases** unless the script explicitly preserves them. The update script must:
1. Read the existing `aliases` from the current file
2. Preserve them in the output
3. Only update the other fields from the API

### 5.4 File Write and Git Commit Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Script writes malformed TypeScript | Medium | Validate output with `tsc --noEmit` before committing |
| Script commits on every run even with no changes | Low | Diff check: only commit if data actually changed |
| Automated commit breaks CI/CD | Low | Use `[skip ci]` in commit message for data-only updates |

### 5.5 Terms of Service

| API | ToS for Automated Batch Use | Risk |
|---|---|---|
| Alpha Vantage | ✅ Permitted — designed for programmatic use | None |
| FMP | ✅ Permitted — designed for programmatic use | None |
| Marketstack | ✅ Permitted — designed for programmatic use | None |
| Yahoo Finance | ❌ **Unofficial API — ToS prohibits automated scraping** | **High** |
| SEC EDGAR | ✅ Public data — explicitly permitted | None |

---

## 6. Ranked Options

### Option 1 (Recommended): FMP Bulk Endpoint + GitHub Actions

**Approach:** Use FMP's `/api/v3/stock/list` bulk endpoint (1 API call) to download all listed companies, filter to the 256 in `companyDatabase.ts`, and update fields. Run daily via GitHub Actions scheduled workflow.

**Implementation steps:**
1. Register for a free FMP API key at `financialmodelingprep.com` (takes 2 minutes)
2. Add `VITE_FMP_API_KEY` to GitHub repository secrets
3. Write `scripts/update-company-database.ts` (~150 lines):
   - Fetch `https://financialmodelingprep.com/api/v3/stock/list?apikey={key}`
   - Filter to 256 known tickers
   - For international tickers not in the bulk list, call `/api/v3/profile/{ticker}` individually
   - Preserve existing `aliases` from current file
   - Generate new TypeScript file content
   - Write to `src/utils/companyDatabase.ts`
4. Add `.github/workflows/update-company-database.yml` with `schedule: cron: '0 6 * * *'`

**Pros:**
- ✅ 1 API call for US companies (bulk endpoint)
- ✅ FMP has explicit `isAdr` boolean field
- ✅ Good international coverage (TSX, LSE, HKEX, B3, TWSE, JSE, BVC)
- ✅ Free tier sufficient (1 bulk call + ~105 individual calls for international = 106 total, well within 250/day)
- ✅ GitHub Actions infrastructure already exists in the project
- ✅ No ToS concerns
- ✅ `VITE_FMP_API_KEY` env var pattern already coded in `financialDataAPI.ts`

**Cons:**
- ❌ Requires registering for FMP API key (free, but requires sign-up)
- ❌ FMP free tier has 250 req/day limit (sufficient, but tight if script is run multiple times)
- ❌ `aliases` must be manually preserved (cannot be sourced from API)

**Estimated implementation effort:** ~4–6 hours  
**Estimated API cost:** $0 (free tier)  
**Coverage:** ~95% of all 256 companies (some very small international companies may not be in FMP)

---

### Option 2: Alpha Vantage OVERVIEW + GitHub Actions

**Approach:** Use Alpha Vantage `OVERVIEW` endpoint (1 call per ticker) for US companies. For international companies, use FMP or Yahoo Finance as fallback.

**Pros:**
- ✅ Alpha Vantage `OVERVIEW` returns very rich data (40+ fields)
- ✅ Free registered key gives 500 req/day — sufficient for 256 companies
- ✅ `VITE_ALPHA_VANTAGE_API_KEY` env var already coded in `alphaVantageService.ts`
- ✅ `AlphaVantageCompanyOverview` interface already fully defined in `alphaVantageService.ts`

**Cons:**
- ❌ **51-minute runtime** (5 req/min rate limit × 256 companies)
- ❌ Poor international coverage (TSX, LSE, HKEX, B3, TWSE, JSE, BVC companies will fail)
- ❌ Requires fallback API for ~105 international companies
- ❌ Requires a real Alpha Vantage API key (currently using `'demo'`)

**Estimated implementation effort:** ~6–8 hours  
**Estimated API cost:** $0 (free tier, but slow)  
**Coverage:** ~60% of 256 companies directly; ~90% with FMP fallback for international

---

### Option 3 (Hybrid): FMP Bulk + Alpha Vantage Enrichment

**Approach:** Use FMP bulk endpoint for all basic fields (ticker, name, exchange, country, sector, isADR). Then use Alpha Vantage `OVERVIEW` for US companies to enrich with additional data. Use SEC EDGAR as a free fallback for US companies if Alpha Vantage fails.

**Pros:**
- ✅ Best data quality (multiple sources cross-validate)
- ✅ FMP bulk handles international coverage
- ✅ Alpha Vantage enriches US companies with additional metadata
- ✅ SEC EDGAR provides free fallback for US companies

**Cons:**
- ❌ Most complex implementation (~10–12 hours)
- ❌ Requires two API keys (FMP + Alpha Vantage)
- ❌ Overkill for the 7 fields in `companyDatabase.ts`

**Estimated implementation effort:** ~10–12 hours  
**Estimated API cost:** $0 (both free tiers)  
**Coverage:** ~98% of 256 companies

---

### Option 4 (Minimal): Manual Semi-Annual Review

**Approach:** Instead of daily automation, create a script that runs manually (e.g., `npm run db:validate`) that checks each ticker against an API and reports discrepancies for human review. A human then makes targeted edits.

**Pros:**
- ✅ Simplest implementation (~2–3 hours)
- ✅ Human review prevents bad data from being automatically committed
- ✅ `aliases` are naturally preserved (human makes targeted edits)
- ✅ No CI/CD complexity

**Cons:**
- ❌ Not automated — requires manual execution
- ❌ Relies on someone remembering to run it
- ❌ Does not catch ticker changes in real-time (e.g., a company delists and users get errors for weeks)

**Estimated implementation effort:** ~2–3 hours  
**Estimated API cost:** $0  
**Coverage:** 100% (human reviews all discrepancies)

---

## 7. Recommended Implementation Plan

Based on the investigation, the following phased approach is recommended:

### Phase 1 (Immediate, ~2 hours): Validation Script
Create `scripts/validate-company-database.ts` that:
- Reads all 256 tickers from `companyDatabase.ts`
- Checks each against FMP or Alpha Vantage
- Outputs a report of discrepancies (changed names, invalid tickers, sector changes)
- Does NOT automatically write changes — outputs a human-readable diff

This gives immediate value with minimal risk.

### Phase 2 (Short-term, ~4–6 hours): Automated Daily Update
Implement Option 1 (FMP Bulk + GitHub Actions):
- Register for free FMP API key
- Write `scripts/update-company-database.ts`
- Add GitHub Actions workflow with daily schedule
- Script preserves `aliases`, only updates other fields
- Script validates TypeScript output before committing
- Script only commits if data actually changed

### Phase 3 (Optional, future): Expand Company Coverage
Once the update mechanism is in place, the script can be extended to:
- Detect new large-cap companies that should be added to the database
- Expand international coverage (currently only 10 companies per non-US exchange)
- Add new fields to the `Company` interface (e.g., `marketCap`, `industry`, `isin`)

---

## 8. Summary

| Question | Answer |
|---|---|
| Is daily automated update feasible? | **Yes — technically straightforward** |
| Best API for the update? | **FMP (bulk endpoint, 1 call for all US companies)** |
| Can all 7 fields be updated? | **6 of 7 yes; `aliases` cannot be sourced from any API** |
| What is the API cost? | **$0 on FMP free tier** |
| How many API calls per day? | **~106 total (1 bulk + ~105 individual for international)** |
| How long does the update run take? | **< 5 minutes** |
| What infrastructure is needed? | **GitHub Actions (already exists in project)** |
| What are the main risks? | **`aliases` loss (mitigated by preserving them), international coverage gaps (mitigated by FMP)** |
| Is Yahoo Finance suitable? | **No — ToS concerns and unofficial API instability** |
| Is Marketstack suitable? | **No — missing sector field, 100 req/month free tier** |
| Estimated implementation effort? | **4–6 hours for full automation (Option 1)** |

---

*Report prepared by David (Data Analyst) — No code changes were made during this investigation.*