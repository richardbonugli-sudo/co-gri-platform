# Company Dashboard Search Function — Deep Investigation Report

**Date:** 2026-03-19  
**Requested by:** Mike (Team Leader) on behalf of User  
**Analyst:** David (Data Analyst)  
**Status:** Investigation Complete — No Code Changes Made

---

## Executive Summary

The Company Dashboard search function is **severely under-indexed**. The search bar in the `GlobalNavigationBar` — which is the primary search interface on the Company Dashboard — is wired exclusively to a stub database (`nasdaqCompanyDatabase.ts`) containing only **16 hardcoded company tickers**. This is the singular, definitive root cause of the reported issue.

Meanwhile, the project contains **at least three richer company data sources** (totalling 259+ real named companies and thousands of generated placeholders) that are **completely disconnected** from the search UI.

---

## 1. User Flow & Entry Point

```
Home Page (Index.tsx)
  └── "Get Started" button  →  /dashboard  →  UnifiedDashboardV2.tsx
                                                  └── GlobalNavigationBar (persistent, sticky)
                                                        └── Search Input
                                                              └── searchNASDAQCompanies()  ← THE PROBLEM
                                                                    └── NASDAQ_COMPANY_DATABASE
                                                                          └── 16 companies only
```

When a user clicks **"Get Started"** on the home page, they are routed to `/dashboard` which renders `UnifiedDashboardV2`. From there, clicking the **Company** mode tab navigates to `/company` which renders `CompanyMode.tsx`. Both pages use the **`GlobalNavigationBar`** component as the persistent top navigation bar — and that bar contains the only visible search input for companies.

---

## 2. Root Cause: Wrong Data Source Wired to the Search Bar

### File: `src/components/navigation/GlobalNavigationBar.tsx`

**Line 29:**
```typescript
import { searchNASDAQCompanies, type NASDAQCompanyData } from '@/data/nasdaqCompanyDatabase';
```

**Line 78:**
```typescript
return searchNASDAQCompanies(searchQuery).slice(0, 5);
```

The `GlobalNavigationBar` imports `searchNASDAQCompanies` from `nasdaqCompanyDatabase.ts` and slices results to a maximum of **5 suggestions**. This function searches only `NASDAQ_COMPANY_DATABASE` — a hardcoded stub object.

### File: `src/data/nasdaqCompanyDatabase.ts`

The file's own header comment says:
> *"Comprehensive database of all 3,300+ NASDAQ companies"*  
> *"Sample NASDAQ companies database (representative subset)"*  
> *"Full database would contain all 3,300+ NASDAQ companies"*

This is a **placeholder/stub** that was never populated with the full dataset. It contains exactly **16 companies**:

| Ticker | Company Name | Tier |
|--------|-------------|------|
| MSFT | Microsoft Corporation | Large |
| GOOGL | Alphabet Inc. Class A | Large |
| AMZN | Amazon.com Inc | Large |
| TSLA | Tesla Inc | Large |
| META | Meta Platforms Inc | Large |
| ZM | Zoom Video Communications | Mid |
| DOCU | DocuSign Inc | Mid |
| OKTA | Okta Inc | Mid |
| CRWD | CrowdStrike Holdings | Small |
| DDOG | Datadog Inc | Small |
| SNOW | Snowflake Inc | Small |
| SFIX | Stitch Fix Inc | Micro |
| ROKU | Roku Inc | Micro |
| MRNA | Moderna Inc | Large |
| BNTX | BioNTech SE | Mid |
| GILD | Gilead Sciences Inc | Large |

> ⚠️ **Critical Gap:** `AAPL` (Apple Inc.) — the **default ticker** loaded when the Company Dashboard opens — is **NOT even in this search database**. A user searching for "Apple" or "AAPL" will get zero results from the search bar, even though the dashboard itself defaults to showing Apple's data.

---

## 3. Inventory of All Company Data Sources

| File | Companies | Used By Search? | Notes |
|------|-----------|----------------|-------|
| `src/data/nasdaqCompanyDatabase.ts` | **16** | ✅ YES (GlobalNavigationBar) | Stub — the only source wired to search |
| `src/utils/companyDatabase.ts` | **~256** | ❌ NO | Rich multi-exchange DB with aliases; used only by old backup pages & Portfolio |
| `src/data/fullNASDAQCompanyList.ts` | **33 real + ~3,267 fake** | ❌ NO | 33 real tickers; rest are programmatically generated with fake names like "Large Corp 1 Inc", "MID1001", etc. Used only by processing engines |
| `src/data/companySpecificExposures.ts` | **~60** | ❌ NO | Geographic exposure data; used by `geographicExposureService` |
| `src/data/enhancedCompanyExposures.ts` | **~13** | ❌ NO | Enhanced V4 exposure data |
| `src/data/phase4_test_companies.ts` | **~9** | ❌ NO | Test/validation data only |
| `src/services/tickerResolution.ts` | **256+ (via companyDatabase) + live APIs** | ❌ NOT on Company Dashboard | Used only by `TickerSearchInput` which is only on the Portfolio page |

---

## 4. The Disconnected Rich Data Source: `companyDatabase.ts`

`src/utils/companyDatabase.ts` contains **~256 real, named companies** across multiple global exchanges with:
- Full company names
- Ticker symbols
- Exchange (NASDAQ, NYSE, AMEX, TSX, LSE, HKEX, SGX, B3, TWSE, JSE, BVC)
- Country
- Sector
- **Aliases** (e.g., searching "Google" finds GOOGL, "Facebook" finds META, "Toyota" finds TM)
- A well-implemented `searchCompanies()` function with exact match prioritization and alias support

This database covers:
- US large-caps (AAPL, MSFT, GOOGL, NVDA, TSLA, etc.)
- US ADRs from China, Taiwan, South Korea, Japan, India, Brazil, UK, France, Germany, Netherlands, Switzerland, Australia, Israel, Mexico, Argentina, Chile, Colombia, South Africa
- Canadian companies (TSX)
- UK companies (LSE)
- Hong Kong companies (HKEX)
- Singapore companies (SGX)
- Brazilian companies (B3)
- Taiwanese companies (TWSE)
- South African companies (JSE)

**This is the correct database to use for search — but it is completely disconnected from the Company Dashboard search bar.**

---

## 5. The `TickerSearchInput` Component — Also Disconnected

`src/components/TickerSearchInput.tsx` is a sophisticated search component that:
- Uses `searchCompanies()` from `tickerResolution.ts`
- `tickerResolution.ts` in turn calls `searchCompanies()` from `companyDatabase.ts` (the 256-company DB) as a local fallback
- Also attempts live API calls to **Marketstack**, **Yahoo Finance**, and **Alpha Vantage** for real-time results

However, `TickerSearchInput` is **only used on the Portfolio page** (`/cogri-portfolio`). It is **not used** on the Company Dashboard or in the `GlobalNavigationBar`.

---

## 6. The Display Results Cap

Even if the data source were correct, the search results are capped at **5 items**:

```typescript
// GlobalNavigationBar.tsx line 78
return searchNASDAQCompanies(searchQuery).slice(0, 5);
```

This is a UI limitation on top of the data limitation. For a query like "tech", this would show at most 5 results from the 16-company stub.

---

## 7. The `AAPL` Paradox

The Company Dashboard (`CompanyMode.tsx`) defaults to loading **Apple Inc. (AAPL)** as the initial company:

```typescript
// CompanyMode.tsx line 107
const [ticker, setTicker] = useState(tickerFromUrl || 'AAPL');
```

Yet `AAPL` is **absent from `nasdaqCompanyDatabase.ts`** — the database powering the search. This means:
- The dashboard loads Apple's data by default ✅
- A user who types "AAPL" or "Apple" in the search bar gets **zero results** ❌
- The user cannot discover Apple through the search autocomplete

---

## 8. Summary of the Bug Chain

```
PROBLEM CHAIN:
─────────────────────────────────────────────────────────────────────
1. GlobalNavigationBar.tsx imports searchNASDAQCompanies()
   └── from nasdaqCompanyDatabase.ts  ← WRONG SOURCE

2. nasdaqCompanyDatabase.ts is a stub with only 16 companies
   └── Missing: AAPL, NVDA, NFLX, ADBE, CRM, JPM, BAC, XOM, and 
       hundreds of others

3. companyDatabase.ts (utils) has 256 real companies + aliases
   └── NOT imported by GlobalNavigationBar
   └── NOT imported by CompanyMode
   └── Only used by old/backup pages and Portfolio page

4. TickerSearchInput (the good search component with live APIs)
   └── Only used on Portfolio page
   └── NOT used on Company Dashboard

5. Results are also hard-capped at 5 items (slice(0,5))
   └── Even if more results existed, only 5 would show

6. AAPL (the default company on the dashboard) is not even 
   in the search database
─────────────────────────────────────────────────────────────────────
NET RESULT: Users can only find 16 companies via search autocomplete,
            out of the hundreds/thousands expected
```

---

## 9. Suggested Next Steps to Fix the Issue

### Option A — Quick Fix (Recommended First Step)
**Replace the import in `GlobalNavigationBar.tsx`** to use `companyDatabase.ts` instead of `nasdaqCompanyDatabase.ts`.

- Change the import from `searchNASDAQCompanies` (16 companies) to `searchCompanies` from `@/utils/companyDatabase` (256 companies with aliases)
- Update the `filteredCompanies` memo to call `searchCompanies(searchQuery)` instead
- Update the result type from `NASDAQCompanyData` to `Company` (from `companyDatabase.ts`)
- Update `handleCompanySelect` to map the `Company` type fields (`name`, `ticker`, `sector`) to the navigation logic
- Increase or remove the `.slice(0, 5)` cap — consider showing up to 8–10 results

**Impact:** Immediately expands searchable companies from 16 → 256, adds alias support (e.g., "Google" finds GOOGL, "Facebook" finds META), covers global exchanges.

**Files to change:** `src/components/navigation/GlobalNavigationBar.tsx` only.

---

### Option B — Full Fix (Recommended for Production)
**Wire `TickerSearchInput` (or its underlying `tickerResolution.ts` service) into the `GlobalNavigationBar`.**

- `tickerResolution.ts` already has a `searchCompanies()` function that:
  1. Searches the local `companyDatabase.ts` (256 companies) as an instant local fallback
  2. Calls live Marketstack, Yahoo Finance, and Alpha Vantage APIs for real-time results
- Replace the static `<Input>` in `GlobalNavigationBar` with the `<TickerSearchInput>` component, or refactor the navigation bar to call `tickerResolution.searchCompanies()` asynchronously

**Impact:** Expands search to effectively unlimited companies via live APIs, with instant local results for common tickers.

**Files to change:** `src/components/navigation/GlobalNavigationBar.tsx`, potentially minor adjustments to `TickerSearchInput.tsx` for dark-theme styling.

---

### Option C — Data Consolidation (Long-term)
**Populate `nasdaqCompanyDatabase.ts` with the full dataset** (if the intent is to keep it as the single source of truth).

- The file claims to be a "3,300+ NASDAQ companies" database but only has 16 entries
- Either populate it with real data from `companyDatabase.ts`, `fullNASDAQCompanyList.ts`, and other sources
- Or deprecate it in favor of `companyDatabase.ts` as the canonical source

---

### Additional Recommendations

1. **Add AAPL to `nasdaqCompanyDatabase.ts` immediately** as a hotfix — since it's the default company on the dashboard and currently unsearchable.

2. **Remove the `.slice(0, 5)` hard cap** or increase it to at least 8–10 results to improve UX.

3. **Consolidate the fragmented company data** — there are currently 6+ separate company data files with overlapping but inconsistent coverage. A single canonical source would prevent this class of bug.

4. **Consider `UnifiedDashboardV2`** — it has no search logic of its own and relies entirely on `GlobalNavigationBar`. Any fix to `GlobalNavigationBar` will automatically benefit the full dashboard experience.

---

## 10. Files Involved (Summary)

| File | Role | Issue |
|------|------|-------|
| `src/components/navigation/GlobalNavigationBar.tsx` | **Primary search UI** | Imports wrong/stub data source |
| `src/data/nasdaqCompanyDatabase.ts` | **Active search database** | Only 16 companies; missing AAPL |
| `src/utils/companyDatabase.ts` | **Correct data source (unused by search)** | 256 companies, not wired to search bar |
| `src/services/tickerResolution.ts` | **Advanced search service (unused by dashboard)** | Has live API + local DB; only used by Portfolio |
| `src/components/TickerSearchInput.tsx` | **Advanced search component (unused by dashboard)** | Only used on Portfolio page |
| `src/data/fullNASDAQCompanyList.ts` | **Processing-only data** | 33 real + ~3,267 fake generated tickers; not for search |
| `src/pages/modes/CompanyMode.tsx` | **Company Dashboard page** | Defaults to AAPL (unsearchable in current state) |
| `src/pages/UnifiedDashboardV2.tsx` | **"Get Started" destination** | No own search; relies on GlobalNavigationBar |

---

*Report prepared by David (Data Analyst) — No code changes were made during this investigation.*