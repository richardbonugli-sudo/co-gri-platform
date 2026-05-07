# Report 6: Company Database, SEC Retrieval, Parsing & Four-Channel Deep Investigation

**Generated:** 2026-04-17  
**Scope:** Complete technical deep-dive into (A) company database architecture, (B) daily GitHub update pipeline, (C) parsing functions, (D) SEC retrieval details, (E) SEC filing report structure, (F) four-channel data methodology, (G) unknown ticker handling, and (H) additional questions from the uploaded baseline document  
**Methodology:** Read-only codebase audit — exhaustive trace of all relevant files in `/workspace/shadcn-ui/src/`  
**Auditor:** David (Data Analyst, Atoms Team)  
**Cross-referenced with:** Reports 1–5  
**User requirement source:** `/workspace/uploads/baseline detailed technical report.docx`

---

## Table of Contents

1. [Section A — Company Database Architecture](#section-a--company-database-architecture)
2. [Section B — Daily GitHub Updates & CI/CD Pipeline](#section-b--daily-github-updates--cicd-pipeline)
3. [Section C — Parsing Functions Deep Dive](#section-c--parsing-functions-deep-dive)
4. [Section D — SEC Retrieval Details](#section-d--sec-retrieval-details)
5. [Section E — SEC Filing Report Structure](#section-e--sec-filing-report-structure)
6. [Section F — Four Channels: Data Details for Each Company](#section-f--four-channels-data-details-for-each-company)
7. [Section G — Companies Not in the Database: Fresh API Calls](#section-g--companies-not-in-the-database-fresh-api-calls)
8. [Section H — Additional Questions from Uploaded Document](#section-h--additional-questions-from-uploaded-document)
9. [Cross-Reference with Previous Reports](#cross-reference-with-previous-reports)
10. [Summary Table of Key Findings](#summary-table-of-key-findings)

---

## Section A — Company Database Architecture

### A1. What databases/files constitute the "company database"?

The CO-GRI Dashboard uses **six distinct database files** that together constitute the full company database. They are layered in a strict priority hierarchy:

| # | File | Type | Location | Contents | Priority |
|---|------|------|----------|----------|----------|
| 1 | `companySpecificExposures.ts` | Static, hand-curated | `src/data/` | Full 4-channel exposure data for AAPL, TSLA, MSFT (3 companies, 889 lines) | Highest |
| 2 | `enhancedCompanyExposures.ts` | Static, semi-curated | `src/data/` | Enhanced V4 exposure data for ~10 companies (AAPL, MSFT, GOOGL, TSLA + test cases) | High |
| 3 | `companyDatabase.ts` | Static, auto-updatable | `src/utils/` | Primary search index: 259 company entries with ticker, name, exchange, country, sector, isADR, aliases | Medium |
| 4 | `fullNASDAQCompanyList.ts` | Static, large dataset | `src/data/` | 3,300+ NASDAQ/NYSE companies with CIK mappings, market cap, sector, industry, exchange, country | Medium |
| 5 | `nasdaqCompanyDatabase.ts` | Static, structured | `src/data/` | 18 representative NASDAQ companies with CIK, market cap tier, processing priority, quality targets | Medium |
| 6 | `enhancedNASDAQDatabase.ts` | Static | `src/data/` | Enhanced NASDAQ company data with additional metadata | Low |

**File-by-file breakdown:**

#### `src/data/companySpecificExposures.ts` (889 lines)
- **Type:** Static TypeScript module, hand-curated
- **Contents:** `COMPANY_SPECIFIC_EXPOSURES: Record<string, CompanyExposure>` — contains 3 tickers: AAPL, TSLA, MSFT
- **Data per company:** `ticker`, `companyName`, `homeCountry`, `sector`, `exposures[]` (array of country-level objects with `revenuePercentage`, `supplyPercentage`, `assetsPercentage`, `financialPercentage`, `percentage` getter, `description`), `dataSource`, `lastUpdated`
- **Data source:** Apple 10-K FY2024 (CIK 0000320193) + Apple Supplier Responsibility Report 2024; Tesla 10-K FY2024 (CIK 0001318605) + Tesla Impact Report 2023; Microsoft 10-K FY2024 (CIK 0000789019)
- **Last updated:** 2026-03-30 (all three)
- **Note:** The `grep -c "ticker:"` count returns 10 because each company's ticker appears multiple times in the file (once in the outer object definition, once per exposure entry that references it). There are definitively only **3 unique companies**.

#### `src/utils/companyDatabase.ts` (~451 lines, 259 entries)
- **Type:** Static TypeScript module, auto-updatable via GitHub Actions
- **Contents:** `companies: Company[]` — flat array of 259 company objects
- **Coverage:** US tech, US financial, US healthcare, US energy, US consumer, plus ADRs from China, Taiwan, South Korea, Japan, India, Brazil, UK, France, Germany, Netherlands, Switzerland, Australia, Israel, Mexico, Argentina, Chile, Colombia, South Africa; plus Canadian, UK, HK, Singapore, Brazilian, Taiwanese, South African listed stocks
- **Note:** 3 duplicate entries detected (RIO appears twice — once for UK listing, once for Australia listing)

#### `src/data/fullNASDAQCompanyList.ts` (~20,711 bytes)
- **Type:** Static TypeScript module (claims 3,300+ but actual count is smaller — see below)
- **Contents:** `FULL_NASDAQ_COMPANY_LIST: NASDAQCompanyRecord[]`
- **Fields per record:** `ticker`, `companyName`, `cik`, `marketCap`, `sector`, `industry`, `exchange`, `country`, `state?`, `employees?`, `revenue?`, `foundedYear?`
- **Actual company count:** The file is 20,711 bytes. Given the average record size, this contains approximately **38 companies** (confirmed by Report 1), not 3,300+ as the comment claims. The "3,300+" is aspirational documentation.

#### `src/data/nasdaqCompanyDatabase.ts` (9,356 bytes)
- **Type:** Static TypeScript module
- **Contents:** `NASDAQ_COMPANY_DATABASE: Record<string, NASDAQCompanyData>` — 18 companies
- **Fields per record:** `ticker`, `companyName`, `cik`, `marketCap`, `sector`, `industry`, `tier` ('large'|'mid'|'small'|'micro'), `processingPriority` (1–4), `expectedDataSources`, `qualityTarget`, `exchange`, `country`, `lastUpdated`

#### `src/data/enhancedNASDAQDatabase.ts` (21,710 bytes)
- **Type:** Static TypeScript module
- **Contents:** Enhanced NASDAQ company data with additional metadata fields

---

### A2. How many companies are in the database?

| Category | Count | Source |
|----------|-------|--------|
| **Tier 1 — Company-Specific Override (full 4-channel static data)** | **3** | `companySpecificExposures.ts` (AAPL, TSLA, MSFT) |
| **Primary search database** | **259** | `companyDatabase.ts` |
| **Full NASDAQ list (actual entries)** | **~38** | `fullNASDAQCompanyList.ts` |
| **NASDAQ structured database** | **18** | `nasdaqCompanyDatabase.ts` |
| **Enhanced V4 data** | **~10** | `enhancedCompanyExposures.ts` |
| **Hardcoded CIK map** | **46** | `secFilingParser.ts` `TICKER_TO_CIK_MAP` |
| **ADR resolver map** | **~80** | `adrCountryResolver.ts` `KNOWN_ADR_MAPPINGS` |
| **Total unique searchable tickers** | **~300+** | All sources combined |

**Tier 1 companies (highest fidelity):** AAPL, TSLA, MSFT only.

**Companies with hardcoded CIKs** (from `secFilingParser.ts` `TICKER_TO_CIK_MAP`):
AAPL, MSFT, GOOGL, GOOG, AMZN, TSLA, META, NVDA, BRK.A, BRK.B, JPM, JNJ, V, WMT, PG, MA, UNH, HD, DIS, BAC, ADBE, CRM, NFLX, CMCSA, XOM, PFE, CSCO, INTC, VZ, KO, PEP, T, MRK, ABT, NKE, ORCL, AMD, QCOM, IBM, BA, GE, BABA, TSM, BIDU, JD, NIO, XPEV, LI, PDD (46 entries)

---

### A3. What fields/attributes are stored for each company?

#### `companyDatabase.ts` — `Company` interface:
```typescript
interface Company {
  ticker: string;           // Exchange ticker symbol (e.g., "AAPL")
  name: string;             // Full legal company name
  exchange: string;         // Exchange name (NASDAQ, NYSE, TSX, LSE, etc.)
  country: string;          // Country of exchange listing (NOT necessarily home country)
  sector: string;           // Business sector classification
  isADR?: boolean;          // CRITICAL: true if this is an American Depositary Receipt
  aliases?: string[];       // Alternative names/abbreviations for search matching
}
```

**Important note on `country` field:** For ADRs, `country` is set to `"United States"` (the listing country), NOT the company's home country. The `adrCountryResolver.ts` service resolves the true home country at runtime.

#### `companySpecificExposures.ts` — `CompanyExposure` interface:
```typescript
interface CompanyExposure {
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: Array<{
    country: string;
    revenuePercentage?: number;    // % of total revenue from this country
    supplyPercentage?: number;     // % of supply chain in this country
    assetsPercentage?: number;     // % of PP&E/physical assets in this country
    financialPercentage?: number;  // % of financial exposure in this country
    percentage: number;            // Blended average (getter)
    description: string;           // Source citation and methodology note
  }>;
  dataSource: string;    // Citation string (filing + date)
  lastUpdated: string;   // ISO date string
}
```

#### `fullNASDAQCompanyList.ts` — `NASDAQCompanyRecord` interface:
```typescript
interface NASDAQCompanyRecord {
  ticker: string;
  companyName: string;
  cik: string;           // SEC CIK number (zero-padded to 10 digits)
  marketCap: number;     // Market capitalization in USD
  sector: string;
  industry: string;
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
  country: string;
  state?: string;
  employees?: number;
  revenue?: number;
  foundedYear?: number;
}
```

#### `nasdaqCompanyDatabase.ts` — `NASDAQCompanyData` interface:
```typescript
interface NASDAQCompanyData {
  ticker: string;
  companyName: string;
  cik: string;
  marketCap: number;
  sector: string;
  industry: string;
  tier: 'large' | 'mid' | 'small' | 'micro';
  processingPriority: 1 | 2 | 3 | 4;
  expectedDataSources: number;
  qualityTarget: number;          // 0.0–1.0 quality target
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
  country: string;
  lastUpdated: string;            // ISO date string
}
```

---

### A4. How is the company database structured?

- **`companyDatabase.ts`:** Flat array (`Company[]`). Accessed via exported functions: `lookupCompany(ticker)`, `searchCompanies(query)`, `getCompaniesByCountry(country)`, `getCompaniesBySector(sector)`, `getAllCountries()`, `getAllSectors()`. Search is linear scan with priority sorting (exact ticker match → ticker starts-with → alphabetical).

- **`companySpecificExposures.ts`:** Indexed map (`Record<string, CompanyExposure>`) keyed by ticker string. O(1) lookup via `getCompanySpecificExposure(ticker)`.

- **`nasdaqCompanyDatabase.ts`:** Indexed map (`Record<string, NASDAQCompanyData>`) keyed by ticker string.

- **`fullNASDAQCompanyList.ts`:** Flat array (`NASDAQCompanyRecord[]`). Must be iterated to find by ticker.

- **`secFilingParser.ts` `TICKER_TO_CIK_MAP`:** Plain object (`Record<string, string>`) for O(1) CIK lookup.

---

### A5. Are there duplicate entries across database files?

**Yes — multiple types of duplicates exist:**

| Duplicate Type | Tickers | Files | Notes |
|----------------|---------|-------|-------|
| Same ticker, multiple files | AAPL, MSFT, TSLA, GOOGL, AMZN, NVDA, META, etc. | `companyDatabase.ts` + `fullNASDAQCompanyList.ts` + `nasdaqCompanyDatabase.ts` | Intentional — each file serves different purpose |
| Same ticker, same file | RIO | `companyDatabase.ts` | RIO appears twice: once as UK listing (Rio Tinto Group), once as Australia listing (Rio Tinto Limited) — both `isADR: true` |
| Same company, different tickers | SONY and SNE | `companyDatabase.ts` | Both represent Sony Corporation |
| CIK map + company list overlap | AAPL, MSFT, TSLA, GOOGL, AMZN, etc. | `secFilingParser.ts` + `fullNASDAQCompanyList.ts` | Intentional — CIK map is a fast-lookup cache |
| Tier 1 in multiple exposure files | AAPL, TSLA, MSFT | `companySpecificExposures.ts` + `enhancedCompanyExposures.ts` | `companySpecificExposures.ts` is authoritative; enhanced file is legacy |

---

## Section B — Daily GitHub Updates & CI/CD Pipeline

### B6. Is there a GitHub Actions workflow that updates the company database daily?

**Yes.** There is a GitHub Actions workflow at `.github/workflows/update-company-database.yml` that runs daily.

### B7. What exactly is updated, how often, what triggers it, and what data sources are used?

**Trigger:** `schedule: cron: '0 2 * * *'` — runs daily at **02:00 UTC** (off-peak, before US market open). Also supports manual trigger via `workflow_dispatch` with `dry_run` and `verbose` options.

**What is updated:** Only `src/utils/companyDatabase.ts` — specifically the fields: `name`, `exchange`, `country`, `sector`, `isADR`.

**What is PRESERVED (never overwritten):** `aliases` (manually curated, not available from any API).

**Data source:** Financial Modeling Prep (FMP) API
- Primary: `FMP /stock/list` (1 bulk API call, ~70,000 companies) — filters to the 256 companies in `companyDatabase.ts`
- Fallback: `FMP /profile` (individual company profile endpoint)
- FMP free tier limit: 250 requests/day (this workflow uses ~106 max)

**Script:** `src/scripts/updateCompanyDatabase.ts` (invoked via `npx tsx`)

**Commit behavior:** Only commits if data actually changed (uses `git diff --quiet` check). Commit message includes `[skip ci]` to prevent triggering other workflows.

**Failure handling:** A separate `notify-on-failure` job creates a GitHub Step Summary with failure details if the main job fails. Possible failure causes: missing/expired `FMP_API_KEY` secret, FMP rate limit exceeded, FMP API unavailable, TypeScript validation failure.

**TypeScript validation:** After update, runs `npx tsc --noEmit --skipLibCheck` before committing.

### B8. What is the actual update mechanism for the company database?

The update mechanism is:
1. GitHub Actions workflow triggers at 02:00 UTC daily
2. `updateCompanyDatabase.ts` script fetches FMP `/stock/list` (bulk)
3. Filters to the 256 tickers already in `companyDatabase.ts`
4. Updates `name`, `exchange`, `country`, `sector`, `isADR` fields
5. Preserves all `aliases` entries
6. Validates TypeScript output
7. Commits only if changed

**Important:** This workflow updates **only `companyDatabase.ts`**. The other database files (`companySpecificExposures.ts`, `fullNASDAQCompanyList.ts`, `nasdaqCompanyDatabase.ts`) are **not** updated by any automated pipeline — they are manually maintained.

### B9. Are there any `package.json` scripts, cron jobs, or scheduled tasks related to data updates?

From `package.json` scripts:
```json
"update-company-db": "tsx src/scripts/updateCompanyDatabase.ts",
"update-company-db:dry-run": "tsx src/scripts/updateCompanyDatabase.ts --dry-run --verbose"
```

These are manual scripts that can be run locally. The automated version runs via GitHub Actions.

**CSI-related scripts** (not company database, but data-related):
```json
"csi:calculate": "tsx src/services/csi-enhancement/cli-phase2.ts calculate",
"csi:compare": "tsx src/services/csi-enhancement/cli-phase2.ts compare",
"csi:backtest": "tsx src/services/csi-enhancement/cli-phase2.ts backtest",
"csi:explain": "tsx src/services/csi-enhancement/cli-phase2.ts explain"
```

**No cron jobs** exist outside of GitHub Actions.

### B10. What is the data freshness/staleness situation?

| File | Last Updated | Update Mechanism | Freshness |
|------|-------------|-----------------|-----------|
| `companyDatabase.ts` | Daily (automated) | GitHub Actions + FMP API | Fresh (daily) |
| `companySpecificExposures.ts` | 2026-03-30 | Manual | ~18 days old as of report date |
| `fullNASDAQCompanyList.ts` | 2025-12-14 (latest entry) | Manual | ~4 months old |
| `nasdaqCompanyDatabase.ts` | 2025-12-14 (latest entry) | Manual | ~4 months old |
| `enhancedCompanyExposures.ts` | Unknown | Manual | Unknown |
| `secFilingParser.ts` `TICKER_TO_CIK_MAP` | Static (hardcoded) | Manual code edit | CIKs are permanent — never stale |

**Second GitHub workflow:** `.github/workflows/visual-regression.yml` — runs visual regression tests (Playwright) on pull requests and pushes to `main`/`develop`. Not related to data updates.

---

## Section C — Parsing Functions Deep Dive

### C11. What parsing functions exist in the codebase?

#### `src/services/secFilingParser.ts` (992 lines) — Primary SEC HTML Parser

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `parseSECFiling(ticker)` | ticker string | `ParsedSECData \| null` | Master orchestrator — fetches and parses complete 10-K/20-F |
| `getCIKFromTicker(ticker, maxRetries?)` | ticker, retries | `string \| null` | Resolves SEC CIK number |
| `getLatestFilingWithHTML(cik, ticker)` | CIK, ticker | `SECFiling \| null` | Fetches latest 10-K (then 20-F) with full HTML |
| `extractAllTables(html)` | HTML string | `cheerio.Cheerio[]` | Extracts all `<table>` elements |
| `isRevenueTable(table, $)` | cheerio table | `boolean` | Heuristic: is this a geographic revenue table? |
| `parseRevenueTable(table, $, ticker)` | cheerio table | `RevenueSegment[]` | Extracts country/region → revenue % from table |
| `isPPETable(table, $)` | cheerio table | `boolean` | Heuristic: is this a PP&E geographic table? |
| `parsePPETable(table, $, ticker)` | cheerio table | `PPESegment[]` | Extracts country/region → PP&E % from table |
| `isDebtTable(table, $)` | cheerio table | `boolean` | Heuristic: is this a debt securities table? |
| `parseDebtTable(table, $, ticker)` | cheerio table | `DebtSecurity[]` | Extracts jurisdiction → debt amount from table |
| `extractItem2Properties(html)` | HTML string | `FacilityLocation[]` | Parses Item 2 (Properties) for facility locations |
| `extractSupplierLocations(html)` | HTML string | `SupplierLocation[]` | Parses supply chain narrative for supplier countries |
| `parseExhibit21(html)` | HTML string | `Exhibit21Data` | Parses Exhibit 21 (subsidiary list) |

#### `src/services/llmNarrativeExtractor.ts` (12,506 bytes) — LLM-Based Narrative Extractor

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `extractMDASection(html)` | HTML string | `string \| null` | Extracts MD&A section text |
| `extractRiskFactorsSection(html)` | HTML string | `string \| null` | Extracts Risk Factors section text |
| `extractNarrativeData(html, ticker)` | HTML, ticker | `LLMExtractionResult` | Calls Supabase Edge Function `extract_geographic_narrative` for AI extraction |
| `extractionsToRevenueSegments(extractions)` | `NarrativeExtraction[]` | `RevenueSegment[]` | Converts LLM extractions to revenue segment format |
| `extractionsToSupplierLocations(extractions)` | `NarrativeExtraction[]` | `SupplierLocation[]` | Converts LLM extractions to supplier location format |
| `extractionsToFacilityLocations(extractions)` | `NarrativeExtraction[]` | `FacilityLocation[]` | Converts LLM extractions to facility location format |

#### `src/services/narrativeParser.ts` (16,537 bytes) — Narrative Text Parser

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `parseNarrativeText(text)` | Filing text string | `NarrativeParseResult` | Master narrative parser — extracts regional definitions, country mentions, supply chain signals |
| `extractRegionalDefinitions(text)` | Text string | `RegionalDefinition[]` | Finds "Our X region includes A, B, C" patterns |
| `extractCountryMentions(text)` | Text string | `CountryMention[]` | Finds all country name mentions with context |
| `extractSupplyChainSignals(text)` | Text string | `SupplyChainSignal[]` | Finds manufacturing/supplier country signals |

#### `src/services/v5/structuredDataIntegratorV5.ts` — V5 Channel Integrators

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `integrateRevenueChannelV5(secData, homeCountry, sector, ticker)` | ParsedSECData, context | `{channel, evidenceLevel, validations, fallbackType}` | Integrates revenue channel with V5 methodology |
| `integrateSupplyChannelV5(secData, narrative, homeCountry, sector, ticker)` | ParsedSECData, narrative, context | Same structure | Integrates supply chain channel |
| `integrateAssetsChannelV5(secData, homeCountry, sector, ticker)` | ParsedSECData, context | Same structure | Integrates physical assets channel |
| `integrateFinancialChannelV5(secData, homeCountry, sector, ticker)` | ParsedSECData, context | Same structure | Integrates financial exposure channel |
| `allocateRegionWithPrior(regionName, regionTotal, channel, sector)` | Region data | `Record<string, IntegratedChannelDataV5>` | Allocates region total to member countries using economic priors |
| `buildAdmissibleSetFromNarrative(narrative, homeCountry, ticker, isSimulated?)` | Narrative text | `{admissibleSet, excludesHomeCountry, signalStrength}` | Builds supply chain admissible country set from narrative |
| `getRegionMembersFromName(regionName)` | Region name string | `string[]` | Maps region name to member country list |
| `isActualCountry(name)` | Name string | `boolean` | Distinguishes country names from region names |
| `normalizeCountryName(name)` | Name string | `string` | Normalizes country name variants |

#### `src/services/geographicExposureService.ts` (46,443 bytes) — Geographic Exposure Orchestrator

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `calculateIndependentChannelExposuresWithSEC(ticker, name, sector, homeCountry, isADR?)` | Company info | `{channelBreakdown, blendedWeights, secIntegration, usedCompanySpecific}` | Master channel calculation with SEC integration |
| `getCompanyGeographicExposure(ticker, name?, sector?, homeCountry?)` | Ticker + optional metadata | `CompanyGeographicData` | Main async entry point for geographic exposure |
| `getCompanyGeographicExposureSync(ticker, name, sector, homeCountry)` | Company info | `CompanyGeographicData` | Synchronous fallback version |
| `resolveTickerMultiSource(input)` | Ticker/name string | `CompanyInfo \| null` | Multi-source ticker resolution (Polygon + SEC + Alpha Vantage) |
| `convertIntegratedToChannelData(integrated)` | `IntegratedChannelDataV5` | `ChannelData` | Converts V5 integrated format to channel data format |
| `getVerifiedCompanyData(ticker)` | Ticker string | `CompanyGeographicData \| null` | Returns company-specific data if available |
| `hasVerifiedData(ticker)` | Ticker string | `boolean` | Checks if company-specific data exists |
| `getDataSourceInfo(ticker)` | Ticker string | Data source metadata | Returns data source information |

#### `src/services/v5/liveEdgarPipeline.ts` (306 lines) — Live EDGAR Pipeline

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `fetchLiveOrFallback(ticker, homeCountry, sector)` | Company info | `LivePipelineResult` | Fetches live EDGAR data or returns static snapshot |
| `fetchSECFilingText(ticker)` | Ticker string | `string \| null` | Fetches raw 10-K text from EDGAR |
| `integrateStructuredData(ticker, homeCountry, sector)` | Company info | `SECIntegrationResult` | Runs full V5 structured data integration |

---

### C12. How does `parseSECFiling()` work step by step?

**File:** `src/services/secFilingParser.ts`

Complete execution path:

```
parseSECFiling(ticker: string): Promise<ParsedSECData | null>
│
├── Step 1: getCIKFromTicker(ticker, maxRetries=3)
│     ├── Check TICKER_TO_CIK_MAP (hardcoded, 46 entries) → O(1) lookup
│     └── If not found: call Supabase Edge Function 'fetch_sec_cik'
│           ├── Fetches https://www.sec.gov/files/company_tickers.json
│           ├── Searches for ticker match (case-insensitive)
│           └── Returns {cik, ticker, companyName} or 404 error
│
├── Step 2: getLatestFilingWithHTML(cik, ticker)
│     ├── Call Supabase Edge Function 'fetch_sec_filing' with {cik, formType: '10-K'}
│     │     ├── Fetches https://data.sec.gov/submissions/CIK{cik}.json
│     │     ├── Finds latest 10-K in filings.recent array
│     │     ├── Constructs filing index URL: https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/
│     │     ├── Fetches filing index to find primary document URL
│     │     └── Fetches primary document HTML (full content)
│     └── If 10-K fails: retry with {formType: '20-F'}
│
├── Step 3: Load HTML into cheerio ($)
│
├── Step 4: extractAllTables(html) → array of cheerio table elements
│
├── Step 5: For each table, classify and parse:
│     ├── isRevenueTable(table, $) → if true: parseRevenueTable(table, $, ticker)
│     ├── isPPETable(table, $) → if true: parsePPETable(table, $, ticker)
│     └── isDebtTable(table, $) → if true: parseDebtTable(table, $, ticker)
│
├── Step 6: extractItem2Properties(html) → FacilityLocation[]
│
├── Step 7: extractSupplierLocations(html) → SupplierLocation[]
│
├── Step 8: parseExhibit21(html) → Exhibit21Data
│     └── Looks for "Exhibit 21" section, parses subsidiary country list
│
├── Step 9: extractNarrativeData(html, ticker) [LLM - FIX #5]
│     ├── Extracts MD&A section (extractMDASection)
│     ├── Extracts Risk Factors section (extractRiskFactorsSection)
│     └── Calls Supabase Edge Function 'extract_geographic_narrative' (AI extraction)
│           └── Returns NarrativeExtraction[] with country/region/percentage/confidence
│
└── Step 10: Assemble ParsedSECData object with all extracted data
      ├── Sets revenueTableFound, ppeTableFound, debtTableFound, supplierListFound
      ├── Sets exhibit21Found
      ├── Sets llmExtractionsUsed, llmSectionsAnalyzed
      └── Returns complete ParsedSECData or null on failure
```

---

### C13. How does `parseNarrativeText()` work?

**File:** `src/services/narrativeParser.ts`

`parseNarrativeText(text: string): NarrativeParseResult`

1. **Regional definition extraction** (`extractRegionalDefinitions`): Scans text for patterns like "Our [Region] segment includes [Country A], [Country B], and [Country C]" or "the [Region] region, which consists of [countries]". Builds `RegionalDefinition[]` with `regionName`, `countries[]`, `confidence`.

2. **Country mention extraction** (`extractCountryMentions`): Scans text for all country name occurrences using a comprehensive country name list. Records each mention with surrounding context (±200 chars), frequency count, and context type (revenue, supply, assets, financial, general).

3. **Supply chain signal extraction** (`extractSupplyChainSignals`): Looks for patterns like "manufactured in", "assembled in", "suppliers in", "facilities in", "operations in" followed by country names. Assigns signal strength (strong/medium/weak) based on keyword specificity.

**Output:** `NarrativeParseResult` containing:
- `regionalDefinitions: RegionalDefinition[]`
- `countryMentions: CountryMention[]`
- `supplyChainSignals: SupplyChainSignal[]`

This output is used by `liveEdgarPipeline.ts` to inform the V5 channel integrators, particularly `buildAdmissibleSetFromNarrative()` for the supply chain channel.

---

### C14. How does `extractAllTables()` work?

**File:** `src/services/secFilingParser.ts`

```typescript
export function extractAllTables(html: string): cheerio.Cheerio<cheerio.Element>[] {
  const $ = cheerio.load(html);
  const tables: cheerio.Cheerio<cheerio.Element>[] = [];
  $('table').each((_, element) => {
    tables.push($(element));
  });
  return tables;
}
```

Simple cheerio-based extraction: loads HTML, selects all `<table>` elements, returns them as an array. No filtering at this stage — all tables are returned. Classification happens in subsequent `isRevenueTable()`, `isPPETable()`, `isDebtTable()` calls.

---

### C15. How does `isRevenueTable()` work?

**File:** `src/services/secFilingParser.ts`

Two-stage heuristic:

**Stage 1 — EXCLUSION (FIX #6):** If the table text contains any of these patterns, immediately return `false`:
- `cost of sales`, `cost of revenue`, `selling and marketing`, `selling, general`
- `research and development`, `operating expenses`, `operating income`
- `iphone`, `ipad`, `mac`, `wearables`, `product category`

This prevents product-category revenue tables (e.g., Apple's iPhone/iPad/Mac breakdown) from being misidentified as geographic revenue tables.

**Stage 2 — INCLUSION:** Table must contain BOTH:
- A revenue keyword: `revenue`, `sales`, `net sales`, `revenues`, `net revenues`
- A geographic keyword: `geographic`, `geographical`, `region`, `segment`, `country`, `area`, `by geography`, `by region`, `by location`

Returns `true` only if both conditions are met and no exclusion pattern matched.

---

### C16. How does `parseRevenueTable()` work?

**File:** `src/services/secFilingParser.ts`

1. Iterates over table rows (`<tr>` elements)
2. For each row, extracts cell text from `<td>` and `<th>` elements
3. Identifies the "geography column" (first column with country/region names)
4. Identifies "value columns" (numeric columns with revenue amounts or percentages)
5. For each data row:
   - Extracts region/country name from geography column
   - Extracts revenue amount (USD millions) or percentage from value column
   - Calculates percentage if only absolute amounts are given (divides by total)
   - Creates `RevenueSegment` object with: `region`, `countries[]` (initially empty, populated by V5 integrators), `revenueAmount`, `revenuePercentage`, `fiscalYear`, `source: 'structured_table'`, `confidence: 'high'`
6. Returns `RevenueSegment[]`

---

### C17. How does `extractSupplierLocations()` work?

**File:** `src/services/secFilingParser.ts`

Scans the full HTML text for supply chain narrative patterns:
1. Looks for sections mentioning "supplier", "manufacturing", "contract manufacturer", "assembly"
2. Within those sections, scans for country name mentions
3. For each country found near supply-chain keywords:
   - Determines `supplierType` based on context keywords: `manufacturing` (assembly/factory), `component` (parts/components), `raw_material` (materials/minerals), `logistics` (shipping/distribution), `other`
   - Sets `source: 'narrative'` and `confidence: 'medium'`
4. Also uses LLM extraction results (`extractionsToSupplierLocations`) for higher-confidence extractions
5. Returns `SupplierLocation[]`

---

### C18. How does `extractItem2Properties()` work?

**File:** `src/services/secFilingParser.ts`

1. Searches for "Item 2" section header in HTML (regex: `/Item\s+2[.\s]+Properties/i`)
2. Extracts the next ~20,000 characters after the header
3. Scans extracted text for:
   - City names followed by country names
   - Country names in context of "office", "facility", "building", "campus", "data center", "warehouse"
4. For each location found:
   - Determines `facilityType`: `office`, `manufacturing`, `warehouse`, `r&d`, `data_center`, `retail`, `other`
   - Sets `source: 'item_2_properties'`, `confidence: 'high'`
5. Returns `FacilityLocation[]`

---

### C19. What is the success/failure handling for each parser?

| Parser | Failure Mode | Fallback Behavior |
|--------|-------------|-------------------|
| `parseSECFiling` | Returns `null` if CIK not found or filing fetch fails | Caller falls back to GF |
| `getCIKFromTicker` | Returns `null` after `maxRetries` attempts | `parseSECFiling` returns `null` |
| `getLatestFilingWithHTML` | Returns `null` if both 10-K and 20-F fail | `parseSECFiling` returns `null` |
| `extractAllTables` | Returns empty array if no tables found | No revenue/PPE/debt data extracted |
| `isRevenueTable` | Returns `false` (conservative) | Table skipped |
| `parseRevenueTable` | Returns empty array on parse error | `revenueTableFound = false` |
| `extractItem2Properties` | Returns empty array if Item 2 not found | No facility data |
| `extractSupplierLocations` | Returns empty array | `supplierListFound = false` |
| `parseExhibit21` | Returns `{subsidiaries: [], totalSubsidiaries: 0, exhibit21Found: false}` | `exhibit21Found = false` |
| `extractNarrativeData` (LLM) | Returns `{extractions: [], errors: [...]}` | LLM data not used |

All failures are **graceful** — the system never throws uncaught exceptions from parsing. Errors are logged to console and recorded in `parsingErrors[]` array within `ParsedSECData`.

---

## Section D — SEC Retrieval Details

### D20. What are the exact API endpoints called for SEC data retrieval?

| Endpoint | Called By | Purpose |
|----------|-----------|---------|
| `https://www.sec.gov/files/company_tickers.json` | `fetch_sec_cik` Edge Function | Full SEC ticker→CIK mapping (~10,000 companies) |
| `https://data.sec.gov/submissions/CIK{cik}.json` | `fetch_sec_filing` Edge Function | Company filing history (all filings metadata) |
| `https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{filename}` | `fetch_sec_filing` Edge Function | Actual filing document HTML |
| `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=10-K&dateb=&owner=include&count=10` | `fetch_sec_filing` Edge Function (fallback) | EDGAR filing search page |

**User-Agent header used:** `'CedarOwl Research contact@cedarowl.com'` (required by SEC EDGAR fair access policy)

**External APIs called by `geographicExposureService.ts`:**
- Polygon.io API (via `polygonService.ts`)
- SEC EDGAR API (via `secEdgarService.ts`)
- Alpha Vantage API (via `alphaVantageService.ts`)

---

### D21. What is the `fetch_sec_cik` Supabase Edge Function?

**File:** `supabase/functions/fetch_sec_cik/index.ts`

**What it does:**
1. Receives `{ticker: string}` in request body
2. Fetches `https://www.sec.gov/files/company_tickers.json` (full SEC company tickers file)
3. Iterates through all entries to find matching ticker (case-insensitive)
4. Zero-pads CIK to 10 digits
5. Returns `{cik: string, ticker: string, companyName: string}` on success
6. Returns 404 with `{error: "CIK not found for ticker X"}` if not found

**API called:** `https://www.sec.gov/files/company_tickers.json` (public SEC endpoint, no auth required)

**CORS:** Handles OPTIONS preflight, returns `Access-Control-Allow-Origin: *`

---

### D22. What is the `fetch_sec_filing` Supabase Edge Function?

**File:** `supabase/functions/fetch_sec_filing/index.ts`

**What it does:**
1. Receives `{cik: string, formType: string}` (default formType: '10-K')
2. Fetches `https://data.sec.gov/submissions/CIK{cik}.json` to get filing history
3. Finds the most recent filing matching `formType` in `filings.recent`
4. Constructs the filing index URL from `accessionNumber`
5. Fetches the filing index page to find the primary document filename
6. Fetches the primary document HTML (full content, potentially 1–5 MB)
7. Returns: `{cik, formType, filingDate, reportDate, accessionNumber, htmlUrl, html, htmlLength}`

**CRITICAL FIX noted in code:** "Now fetches the PRIMARY DOCUMENT, not the viewer wrapper" — earlier versions fetched the EDGAR viewer page instead of the actual filing document.

**User-Agent:** `'CedarOwl Research contact@cedarowl.com'`

---

### D23. What is the complete CIK resolution process?

```
getCIKFromTicker(ticker, maxRetries=3)
│
├── Step 1: Check TICKER_TO_CIK_MAP (hardcoded in secFilingParser.ts)
│     46 tickers hardcoded (AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, etc.)
│     → If found: return immediately (no network call)
│
└── Step 2: Call Supabase Edge Function 'fetch_sec_cik' (up to maxRetries times)
      ├── Attempt 1: invoke('fetch_sec_cik', {body: {ticker}})
      │     Success: cache result in TICKER_TO_CIK_MAP, return CIK
      │     Failure: wait 1s (exponential backoff: 2^(attempt-1) × 1000ms)
      ├── Attempt 2: wait 2s on failure
      ├── Attempt 3: final attempt
      └── All fail: return null → parseSECFiling returns null → GF fallback
```

---

### D24. What is the complete filing retrieval process?

```
getLatestFilingWithHTML(cik, ticker)
│
├── Step 1: Call 'fetch_sec_filing' Edge Function with {cik, formType: '10-K'}
│     ├── Success (data.html present): return SECFiling object
│     └── Failure/null: proceed to Step 2
│
└── Step 2: Call 'fetch_sec_filing' Edge Function with {cik, formType: '20-F'}
      ├── Success: return SECFiling object (20-F for foreign private issuers)
      └── Failure: return null → parseSECFiling returns null → GF fallback
```

---

### D25. What retry logic exists for SEC API calls?

**CIK resolution (`getCIKFromTicker`):**
- Up to `maxRetries` attempts (default: 3)
- Exponential backoff: `Math.pow(2, attempt - 1) * 1000` ms
  - Attempt 1 failure → wait 1,000ms
  - Attempt 2 failure → wait 2,000ms
  - Attempt 3 failure → return null

**Filing retrieval (`getLatestFilingWithHTML`):**
- No explicit retry logic — tries 10-K once, then 20-F once
- No backoff

**Live EDGAR pipeline (`fetchLiveOrFallback`):**
- No retry logic — single attempt, graceful fallback to static snapshot on any error

---

### D26. What rate limiting or throttling exists?

**No explicit rate limiting or throttling** is implemented in the client-side code. The system relies on:
1. The SEC EDGAR fair access policy (User-Agent header required)
2. Supabase Edge Function concurrency limits
3. The in-memory cache (prevents repeat fetches for same ticker within a session)

**SEC EDGAR rate limits (external):** SEC recommends no more than 10 requests/second per IP. The system makes at most 2–3 requests per ticker lookup, so this is not a concern for normal usage.

---

### D27. What caching mechanisms exist for SEC data?

**In-memory session cache** in `liveEdgarPipeline.ts`:
```typescript
const _livePipelineCache = new Map<string, LivePipelineCacheEntry>();
```

- **Key:** Ticker symbol (uppercase)
- **Value:** `{secIntegration, narrativeResult, filingTextLength, cachedAt: ISO string}`
- **TTL:** None — session-lifetime cache (persists until page reload)
- **Scope:** Only for Tier 1 tickers (AAPL, TSLA, MSFT) that go through the live pipeline
- **Cache hit behavior:** Returns cached result immediately with `fromCache: true`

**CIK cache** in `secFilingParser.ts`:
```typescript
const TICKER_TO_CIK_MAP: Record<string, string> = { ... }; // 46 hardcoded
```
- Dynamically extended at runtime when new CIKs are resolved via Edge Function
- Persists for session lifetime

**No persistent cache** (no localStorage, no Supabase database caching of SEC results).

---

### D28. What happens when the Supabase Edge Function is unavailable?

The system has **graceful degradation** at every level:

1. **`getCIKFromTicker` fails** → `parseSECFiling` returns `null`
2. **`parseSECFiling` returns `null`** → `integrateStructuredData` receives `null` secData
3. **`integrateStructuredData` with null secData** → all four V5 channel integrators receive `null` → each falls through to GF fallback (`buildGlobalFallbackV5`)
4. **`fetchLiveOrFallback` throws exception** → caught by try/catch → returns `{liveDataAvailable: false, source: 'static-snapshot-fallback'}`
5. **Final result** → V5 Global Fallback (GF) with `tier: 'MODELED'`, `fallbackType: 'GF'`

No user-visible error is shown — the system silently falls back to GF estimates.

---

## Section E — SEC Filing Report Structure

### E29. What types of SEC filings are retrieved?

| Form Type | Who Files | When Attempted |
|-----------|-----------|----------------|
| **10-K** | US domestic companies | First attempt (primary) |
| **20-F** | Foreign private issuers | Fallback if 10-K not found |
| **10-Q** | Quarterly reports | NOT retrieved (annual only) |
| **8-K** | Current reports | NOT retrieved |

---

### E30. What data is extracted from each filing type?

Both 10-K and 20-F are processed identically by the same parsing pipeline. The system does not differentiate between them after retrieval.

**Data extracted from both:**
- Revenue geographic segments (from geographic revenue tables)
- PP&E geographic breakdown (from long-lived assets tables)
- Debt securities (from debt/notes tables)
- Facility locations (from Item 2 Properties)
- Supplier locations (from supply chain narrative)
- Exhibit 21 subsidiary list
- LLM-extracted narrative data (MD&A, Risk Factors)

---

### E31. How are revenue/geographic segments extracted from 10-K filings?

**Step-by-step process:**

1. `extractAllTables(html)` → all `<table>` elements
2. For each table: `isRevenueTable(table, $)` → filter to geographic revenue tables only
3. For each revenue table: `parseRevenueTable(table, $, ticker)` → `RevenueSegment[]`
4. Each `RevenueSegment` has: `region` (string — may be country OR region name), `revenuePercentage`, `fiscalYear`, `source: 'structured_table'`, `confidence: 'high'`
5. In V5 integrator (`integrateRevenueChannelV5`):
   - If `region` is an actual country (`isActualCountry(region)` = true) → `tier: 'DIRECT'`
   - If `region` is a region name (e.g., "Europe", "Americas") → `allocateRegionWithPrior()` → `tier: 'ALLOCATED'`
   - If residual label ("Other", "Rest of World") → distribute across unconstrained countries via `allocateWithPrior()` → `tier: 'ALLOCATED'`
6. If no structured table found → try narrative extraction → if none → `buildGlobalFallbackV5()` → `tier: 'MODELED'`

---

### E32. How are PPE geographic data extracted?

Same pipeline as revenue:
1. `isPPETable(table, $)` identifies PP&E geographic tables (looks for "property", "plant", "equipment", "long-lived assets" + geographic keywords)
2. `parsePPETable(table, $, ticker)` extracts `PPESegment[]` with `region`, `ppePercentage`, `assetType`
3. In `integrateAssetsChannelV5`: direct country entries → `tier: 'DIRECT'`; region entries → `allocateRegionWithPrior()` → `tier: 'ALLOCATED'`
4. Exhibit 21 subsidiary data supplements PP&E for assets channel
5. Facility locations from Item 2 Properties provide additional evidence

**Apple-specific PP&E structure** (from `physicalAssetsFallback.ts`):
- US: ~80.8% (direct evidence)
- China/HK/TW bucket: ~7.3% (split using GDP × AssetPrior: China 68.5%, HK 15.1%, TW 16.4%)
- Other countries: ~11.9% (distributed via GF)

---

### E33. How are debt securities data extracted?

1. `isDebtTable(table, $)` identifies debt tables (looks for "notes", "bonds", "debt", "senior notes", "commercial paper" + jurisdiction/currency keywords)
2. `parseDebtTable(table, $, ticker)` extracts `DebtSecurity[]` with `jurisdiction`, `currency`, `principalAmount`, `securityType`
3. In `integrateFinancialChannelV5`:
   - Direct evidence jurisdictions → `tier: 'DIRECT'`
   - Eurozone entries → split across Germany/Netherlands/France/Ireland using `EUROZONE_PROXY_SPLIT` (35%/30%/20%/15%)
   - Unspecified portion → GF using financial depth priors

**Apple-specific financial structure** (from `financialExposureFallback.ts`):
- USD bonds → United States (55% direct)
- EUR bonds → Eurozone split (25% direct)
- GBP bonds → United Kingdom (12% direct)
- JPY bonds → Japan (8% direct)
- Unspecified portion: ~40% distributed via GF

---

### E34. How is Exhibit 21 (subsidiary list) processed?

**File:** `src/services/dataIntegration/exhibit21Parser.ts`

`parseExhibit21(html: string): Exhibit21Data`

1. Searches for "Exhibit 21" section in HTML
2. Parses subsidiary table/list: company name → jurisdiction/country
3. Groups subsidiaries by country
4. Returns `Exhibit21Data`: `{subsidiaries: [{name, country, stateOfIncorporation}], totalSubsidiaries: number, exhibit21Found: boolean, countriesCovered: string[]}`
5. Used in `integrateAssetsChannelV5` to supplement PP&E data (subsidiaries indicate operational presence)

---

### E35. How is supply chain narrative text extracted?

**Multi-source approach:**

1. **Structured supplier list** (`extractSupplierLocations`): Scans HTML for supplier tables or lists
2. **Narrative extraction** (`extractSupplierLocations`): Keyword-based scan for supply chain country mentions
3. **LLM extraction** (`extractNarrativeData`): AI-powered extraction from MD&A and Risk Factors
4. **Sustainability report** (`fetchSustainabilityReport`): Calls Supabase Edge Function `fetch_sustainability_report` for additional supply chain data

In `integrateSupplyChannelV5`:
- `buildAdmissibleSetFromNarrative()` constructs the set of plausible supply countries from narrative signals
- If admissible set is non-empty AND supply signal strength is "strong": use RF (Restricted Fallback) within admissible set
- If admissible set is empty or signal is "none": use GF (Global Fallback)
- **Key rule:** Supply chain NEVER uses unconstrained GF — always uses sector-specific priors within a defined admissible set

---

### E36. What is the complete data structure returned by `parseSECFiling()`?

```typescript
interface ParsedSECData {
  ticker: string;
  cik: string;
  filingDate: string;          // ISO date string
  reportDate: string;          // Fiscal year end date
  formType: string;            // '10-K' or '20-F'
  
  // Revenue channel data (Wᵣ)
  revenueSegments: RevenueSegment[];
  revenueTableFound: boolean;
  revenueNarrativeContext?: string;
  
  // Assets channel data (Wₚ)
  ppeSegments: PPESegment[];
  ppeTableFound: boolean;
  ppeNarrativeContext?: string;
  facilityLocations: FacilityLocation[];
  
  // Financial channel data (W𝒻)
  debtSecurities: DebtSecurity[];
  debtTableFound: boolean;
  debtNarrativeContext?: string;
  treasuryCenters: string[];
  
  // Supply channel data (Wₛ)
  supplierLocations: SupplierLocation[];
  supplierListFound: boolean;
  supplyChainNarrativeContext?: string;
  
  // Exhibit 21 (NEW - Phase 1)
  exhibit21Data?: Exhibit21Data;
  exhibit21Found: boolean;
  
  // LLM extraction metadata (FIX #5)
  llmExtractionsUsed: boolean;
  llmSectionsAnalyzed: string[];
  llmProcessingTime?: number;
  
  // Parsing metadata
  parsingTimestamp: string;
  parsingSuccess: boolean;
  parsingErrors: string[];
  sectionsFound: string[];
}
```

---

### E37. How does the system handle XBRL inline format vs. traditional HTML?

The system **primarily targets traditional HTML** table parsing. XBRL support is referenced in the type definitions (`source: 'xbrl'` in `RevenueSegment`) but the actual XBRL parsing implementation is minimal/stub. The `getLatestFilingWithHTML` function fetches the primary document, which for modern 10-K filings is typically iXBRL (inline XBRL embedded in HTML). The cheerio-based table parser works on the HTML layer of iXBRL documents, effectively treating them as HTML. Pure XBRL (`.xml`) files are not fetched or parsed.

---

### E38. How does the system handle 20-F filings differently from 10-K?

**No differentiation** — 20-F filings are processed by the exact same parsing pipeline as 10-K filings. The `formType` field is recorded in `ParsedSECData` but no conditional logic branches on it. The table extraction, narrative parsing, and channel integration work identically for both form types.

The only difference is in retrieval order: 10-K is attempted first, 20-F is the fallback. This means foreign private issuers (who file 20-F) will always have their 10-K attempt fail before the 20-F is tried.

---

## Section F — Four Channels: Data Details for Each Company

### F39. What are the four channels? Define each channel precisely.

| Channel | Symbol | Definition | What It Measures |
|---------|--------|------------|-----------------|
| **Revenue** | Wᵣ | Geographic distribution of company revenues | Where the company sells its products/services |
| **Supply Chain** | Wₛ | Geographic distribution of supply chain operations | Where the company sources materials, components, and manufacturing |
| **Physical Assets** | Wₚ | Geographic distribution of PP&E (Property, Plant & Equipment) | Where the company's physical infrastructure is located |
| **Financial** | W𝒻 | Geographic distribution of financial exposure | Where the company raises capital, holds cash, and has currency exposure |

**Note on naming:** The financial channel was historically called "operations" in some parts of the codebase. BUG #5 FIX (documented in code) standardized the field name to `financial` everywhere. The `(channelData as any).operations` fallback cast was removed.

---

### F40. For each channel, what is the complete calculation methodology?

#### Revenue Channel (Wᵣ) — `integrateRevenueChannelV5()`

```
Priority 1: STRUCTURED EVIDENCE (tier: DIRECT)
  → SEC 10-K revenue segments table found AND segments.length > 0
  → Direct country entries: weight = revenuePercentage / 100, tier: 'DIRECT'
  → Region entries: allocateRegionWithPrior(regionName, regionTotal, 'revenue', sector)
    → Uses revenue prior: GDP^0.25 × HouseholdConsumption^0.35 × SectorDemand^0.30 × MarketAccess^0.10
    → tier: 'ALLOCATED'
  → Residual entries ("Other", "Rest of World"):
    → Distribute across unconstrained countries via allocateWithPrior()
    → tier: 'ALLOCATED'

Priority 2: NARRATIVE EVIDENCE (tier: ALLOCATED)
  → No structured table, but narrative mentions percentages
  → e.g., "China accounted for 23% of revenue"
  → tier: 'ALLOCATED'

Priority 3: GLOBAL FALLBACK (tier: MODELED)
  → No structured or narrative evidence
  → buildGlobalFallbackV5(homeCountry, 'revenue', sector)
  → Formula: GDP(c)^λ × SectorPrior_revenue(c) where λ=0.25
  → tier: 'MODELED', fallbackType: 'GF'
```

#### Supply Chain Channel (Wₛ) — `integrateSupplyChannelV5()`

```
Priority 1: STRUCTURED SUPPLIER LIST (tier: DIRECT)
  → Explicit supplier table or list found in filing
  → Direct country entries: tier: 'DIRECT'

Priority 2: NARRATIVE + ADMISSIBLE SET (tier: ALLOCATED)
  → buildAdmissibleSetFromNarrative() → set P of plausible countries
  → If P is non-empty AND signal strength is 'strong':
    → Restricted Fallback (RF): allocate within P using supply prior
    → Formula: ManufacturingVA^0.20 × SectorExport^0.30 × AssemblyCapability^0.25 × Logistics^0.10 × IORelevance^0.15
    → tier: 'ALLOCATED', fallbackType: 'RF'

Priority 3: GLOBAL FALLBACK (tier: MODELED)
  → P is empty or signal is 'none'
  → buildGlobalFallbackV5(homeCountry, 'supply', sector)
  → λ=0.10 (supply chain is more concentrated than revenue)
  → tier: 'MODELED', fallbackType: 'GF'

KEY RULE: Supply chain NEVER uses unconstrained GF without sector-specific priors.
```

#### Physical Assets Channel (Wₚ) — `integrateAssetsChannelV5()`

```
Priority 1: STRUCTURED PP&E TABLE (tier: DIRECT)
  → ppeTableFound AND ppeSegments.length > 0
  → Direct country entries: tier: 'DIRECT'
  → Region entries: allocateRegionWithPrior('assets', sector) → tier: 'ALLOCATED'
  → "Other countries" bucket: distribute via GF assets prior

Priority 2: EXHIBIT 21 + FACILITY LOCATIONS (tier: ALLOCATED)
  → exhibit21Data.subsidiaries → country presence signals
  → facilityLocations from Item 2 Properties
  → tier: 'ALLOCATED'

Priority 3: GLOBAL FALLBACK (tier: MODELED)
  → buildGlobalFallbackV5(homeCountry, 'assets', sector)
  → λ=0.35 (assets are most concentrated — highest λ)
  → Formula: CapitalStock^0.30 × SectorAssetSuitability^0.35 × Infrastructure^0.20 × ResourceFit^0.15
  → tier: 'MODELED', fallbackType: 'GF'
```

#### Financial Channel (W𝒻) — `integrateFinancialChannelV5()`

```
Priority 1: STRUCTURED DEBT TABLE (tier: DIRECT)
  → debtTableFound AND debtSecurities.length > 0
  → Direct jurisdiction entries: tier: 'DIRECT'
  → Eurozone entries: split via EUROZONE_PROXY_SPLIT (DE 35%, NL 30%, FR 20%, IE 15%)

Priority 2: NARRATIVE EVIDENCE (tier: ALLOCATED)
  → Debt issuance mentioned in narrative (e.g., "issued EUR-denominated notes")
  → tier: 'ALLOCATED'

Priority 3: GLOBAL FALLBACK (tier: MODELED)
  → buildGlobalFallbackV5(homeCountry, 'financial', sector)
  → Formula: FinancialDepth^0.35 × CurrencyExposure^0.30 × CrossBorderCapital^0.20 × FundingHub^0.15
  → tier: 'MODELED', fallbackType: 'GF'

KEY RULE: W𝒻 NEVER uses segment fallback — always direct evidence + GF.
```

---

### F41. For each channel, what data sources are used?

| Channel | Primary Source | Secondary Source | Fallback |
|---------|---------------|-----------------|---------|
| Revenue | SEC 10-K geographic revenue table | LLM narrative extraction (MD&A) | V5 GF (GDP × sector demand prior) |
| Supply | SEC supplier list / sustainability report | Narrative admissible set (RF) | V5 GF (manufacturing/assembly prior) |
| Assets | SEC PP&E table | Exhibit 21 + Item 2 Properties | V5 GF (capital stock prior) |
| Financial | SEC debt securities table | Narrative debt mentions | V5 GF (financial depth prior) |

**For Tier 1 companies (AAPL, TSLA, MSFT):** Primary source is `companySpecificExposures.ts` (hand-curated static data), optionally upgraded by live SEC data.

---

### F42. For each channel, what is the output format?

All four channels produce the same output format: `Record<string, IntegratedChannelDataV5>`

```typescript
interface IntegratedChannelDataV5 {
  country: string;           // Normalized country name
  weight: number;            // 0.0–1.0 (fraction of total, pre-normalization)
  state: 'known-positive' | 'known-zero' | 'unknown';
  status: 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
  source: string;            // Human-readable source description
  dataQuality: 'high' | 'medium' | 'low';
  evidenceType: 'structured_table' | 'narrative' | 'fallback';
  fallbackType: 'SSF' | 'RF' | 'GF' | 'none';
  tier: 'DIRECT' | 'ALLOCATED' | 'MODELED';
  rawData?: any;             // Original parsed data (optional)
}
```

After all four channels are computed, they are combined in `calculateIndependentChannelExposuresWithSEC()` using the blending formula below.

---

### F43. How are the four channels combined into the final CO-GRI score?

**Step 1: Four-channel blending** (in `geographicExposureService.ts`):
```
blendedWeight(c) = α×W_revenue(c) + β×W_supply(c) + γ×W_assets(c) + δ×W_financial(c)
```

Where the coefficients are:
- α (revenue) = 0.40
- β (supply) = 0.35
- γ (assets) = 0.15
- δ (financial) = 0.10

**Step 2: Micro-exposure threshold** (in `geographicExposureService.ts`):
- Countries with `blendedWeight < 0.0001` (0.01%) are excluded

**Step 3: Normalization** (in `geographicExposureService.ts`):
- All blended weights are normalized to sum to 1.0

**Step 4: COGRI score calculation** (in `cogriCalculationService.ts`):
```
contribution(c) = normalizedWeight(c) × CSI(c) × (1.0 + 0.5 × (1.0 - alignmentFactor(c)))
rawScore = Σ contribution(c) for all countries c
finalScore = round(rawScore × sectorMultiplier × 10) / 10
```

Where:
- `CSI(c)` = Country Shock Index for country c (from `globalCountries.ts`)
- `alignmentFactor(c)` = political alignment factor (0.0–1.0, from `politicalAlignmentService.ts`)
- `sectorMultiplier` = sector-specific risk multiplier (from `sectorClassificationService.ts`)

**Step 5: Risk level classification:**
- finalScore ≥ 60 → "Very High Risk"
- finalScore ≥ 45 → "High Risk"
- finalScore ≥ 30 → "Moderate Risk"
- finalScore < 30 → "Low Risk"

---

### F44. What are the sector exposure coefficients for each channel by sector?

The four-channel blending coefficients (`EXPOSURE_COEFFICIENTS` in `cogriCalculationService.ts`) are **uniform across all sectors**:

```typescript
const EXPOSURE_COEFFICIENTS = {
  revenue: 0.40,    // 40% — largest weight
  supply: 0.35,     // 35% — second largest
  assets: 0.15,     // 15%
  financial: 0.10,  // 10% — smallest weight
  market: 0.00      // 0% — market channel removed
};
```

**Sector differentiation** happens at the **prior level** (within each channel's GF formula), not at the blending coefficient level. The V5 channel priors in `channelPriors.ts` (1,546 lines) contain sector-specific weights for each country in each channel.

**Sector multipliers** (applied to the final score, not to individual channels):
- These are in `sectorMultipliers.ts` and `sectorClassificationService.ts`
- Examples: Technology ~1.1–1.3, Energy ~1.2–1.4, Financial Services ~0.9–1.1, Consumer Defensive ~0.8–1.0

---

### F45. What is the Global Fallback (GF) V5 methodology?

**File:** `src/services/v5/channelPriors.ts` (1,546 lines)

`buildGlobalFallbackV5(homeCountry: string, channel: V5ChannelType, sector: string): Record<string, number>`

**Four channel-specific formulas:**

| Channel | Formula | λ (concentration) | Key Drivers |
|---------|---------|-------------------|-------------|
| Revenue | `GDP^0.25 × HouseholdConsumption^0.35 × SectorDemand^0.30 × MarketAccess^0.10` | 0.25 (most dispersed) | Consumer demand, market access |
| Supply | `ManufacturingVA^0.20 × SectorExport^0.30 × AssemblyCapability^0.25 × Logistics^0.10 × IORelevance^0.15` | 0.10 (most concentrated) | Manufacturing capability, assembly |
| Assets | `CapitalStock^0.30 × SectorAssetSuitability^0.35 × Infrastructure^0.20 × ResourceFit^0.15` | 0.35 (most concentrated) | Capital stock, infrastructure |
| Financial | `FinancialDepth^0.35 × CurrencyExposure^0.30 × CrossBorderCapital^0.20 × FundingHub^0.15` | N/A | Financial market depth, currency |

**Home country boost:** The home country always receives a significant prior weight boost (the λ parameter controls how much weight is concentrated at home vs. distributed globally).

**Sector-specific adjustments:** For Technology hardware, the supply prior heavily suppresses US/Germany and boosts China/Taiwan/Vietnam/South Korea/India. For Financial Services, the financial prior boosts US/UK/Singapore/Luxembourg.

**Output:** `Record<string, number>` — country → normalized weight (sums to 1.0)

---

### F46. What is the difference between DIRECT, ALLOCATED, and MODELED evidence tiers?

| Tier | Definition | Source | Confidence | Uncertainty Factor |
|------|-----------|--------|------------|-------------------|
| **DIRECT** | Explicitly stated in SEC filing as a specific country with a specific number | Structured table in 10-K/20-F | Highest | ±5% of score |
| **ALLOCATED** | Derived by distributing a known regional total across member countries using economic priors | Region allocation (SSF) or narrative evidence | Medium | ±10% of score |
| **MODELED** | Estimated using sector-specific economic priors with no filing evidence | V5 GF formula | Lowest | ±20% of score |
| **FALLBACK** | Legacy tier label — equivalent to MODELED in practice | GF or no data | Lowest | ±30% of score |

**Tier propagation:** The best available tier across all four channels is used for each country in the final output. Hierarchy: DIRECT > ALLOCATED > MODELED > FALLBACK.

**Score uncertainty band** (P2-4 fix): Computed as `finalScore × weightedAverageTierUncertainty`. Displayed in the UI as `±X points`.

---

### F47. How does `upgradeChannelBreakdownWithSEC()` work?

**File:** `src/services/geographicExposureService.ts`

This function is called **only for Tier 1 companies** (AAPL, TSLA, MSFT) after `buildIndependentChannelBreakdown()` has built the static channel breakdown.

```
upgradeChannelBreakdownWithSEC(staticBreakdown, secIntegration, ticker)
│
├── For each country in staticBreakdown:
│     ├── Check if secIntegration has DIRECT evidence for this country in any channel
│     ├── If yes AND static entry is MODELED/FALLBACK:
│     │     → Replace static weight with SEC-derived weight
│     │     → Upgrade tier from MODELED → DIRECT or ALLOCATED
│     └── If static entry is already DIRECT: keep static (static data is hand-curated, trusted)
│
└── For countries in secIntegration NOT in staticBreakdown:
      → Add new country entry with SEC-derived data
      → Prevents static data from missing countries found in latest filing
```

**Purpose:** Allows the static hand-curated data to be enhanced by live SEC data without losing the high-quality static baseline. Only MODELED entries are upgraded — DIRECT entries from the static snapshot are trusted over SEC-parsed data.

---

### F48. What is `buildIndependentChannelBreakdown()`?

**File:** `src/services/geographicExposureService.ts` (via `companySpecificChannelFix.ts`)

Called **only for Tier 1 companies** (AAPL, TSLA, MSFT).

```
buildIndependentChannelBreakdown(ticker, companySpecific)
│
├── For each country in companySpecific.exposures:
│     ├── Revenue channel: weight = revenuePercentage / 100, tier: 'DIRECT'
│     ├── Supply channel: weight = supplyPercentage / 100, tier: 'DIRECT'
│     ├── Assets channel: weight = assetsPercentage / 100, tier: 'DIRECT'
│     └── Financial channel: weight = financialPercentage / 100, tier: 'DIRECT'
│
└── Returns: ChannelBreakdown (Record<country, {revenue, supply, assets, financial, blended, politicalAlignment}>)
```

All four channels are built **independently** from the static data — each channel has its own country weights that differ from the others. This is what makes Tier 1 companies "well-differentiated" (channel differentiation score near 1.0).

---

## Section G — Companies Not in the Database: Fresh API Calls

### G49. What happens when a user searches for a ticker NOT in any database file?

**Search flow** (from `tickerResolution.ts` and `companyDatabase.ts`):

1. User types ticker in `TickerSearchInput` or `GlobalNavigationBar`
2. `searchCompanies(query)` is called on `companyDatabase.ts` (local, synchronous)
3. If no local match: external API calls are made (see G51)
4. If external APIs also fail: user can still manually enter the ticker
5. The ticker is processed through `getCompanyGeographicExposure(ticker)` regardless

**CO-GRI calculation for unknown tickers:**
1. `getCompanySpecificExposure(ticker)` → `null` (not in Tier 1)
2. `resolveTickerMultiSource(ticker)` → attempts Polygon + SEC EDGAR + Alpha Vantage
3. `sectorClassificationService.classifySector()` → determines sector
4. `calculateIndependentChannelExposuresWithSEC()` → attempts SEC integration
5. If SEC fails → `buildGlobalFallbackV5()` for all four channels
6. Result: GF-based CO-GRI score with `tier: 'MODELED'` for all countries

---

### G50. What is the `tickerResolution.ts` logic for unknown tickers?

**File:** `src/services/tickerResolution.ts`

```
searchCompanies(query: string): Promise<CompanySearchResult[]>
│
├── Step 1: Local database search (companyDatabase.ts)
│     → searchCompanies(query) — synchronous, instant
│     → If results found: return immediately (source: 'local')
│
├── Step 2: Marketstack API search (if no local results)
│     → GET https://api.marketstack.com/v1/tickers?access_key={KEY}&search={query}&limit=10
│     → Returns: symbol, name, exchange, country, sector
│     → API key: 64040504cef9e565bd09fa77b54ae274 (hardcoded)
│
├── Step 3: Yahoo Finance search (parallel with Marketstack)
│     → GET https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=15&newsCount=0
│     → Filters to quoteType === 'EQUITY'
│     → Returns: symbol, name, exchange, sector
│
├── Step 4: Alpha Vantage search (if above fail)
│     → GET https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={query}&apikey={KEY}
│     → API key: 'demo' (hardcoded — rate limited to ~5 requests/minute)
│
└── Step 5: Merge and deduplicate results
      → Priority: local > Marketstack > Yahoo > Alpha Vantage
      → Return combined CompanySearchResult[]
```

---

### G51. What external APIs are called for unknown tickers?

| API | Endpoint | API Key | Rate Limit | Data Returned |
|-----|----------|---------|------------|---------------|
| **Marketstack** | `https://api.marketstack.com/v1/tickers` | `64040504cef9e565bd09fa77b54ae274` (hardcoded) | Unknown | symbol, name, exchange, country |
| **Yahoo Finance** | `https://query2.finance.yahoo.com/v1/finance/search` | None (public) | Unofficial, may block | symbol, name, exchange, sector |
| **Alpha Vantage** (search) | `https://www.alphavantage.co/query?function=SYMBOL_SEARCH` | `'demo'` (hardcoded) | ~5 req/min | symbol, name, region, matchScore |
| **Alpha Vantage** (overview) | `https://www.alphavantage.co/query?function=OVERVIEW` | `'demo'` | ~5 req/min | name, exchange, country, sector, industry, description, CIK |
| **Polygon.io** | Via `polygonService.ts` | From env/config | Varies by plan | ticker, name, exchange, country, sector |
| **SEC EDGAR** | Via `secEdgarService.ts` | None (public) | 10 req/s | CIK, company name, SIC code |

**Important:** Alpha Vantage `'demo'` key is severely rate-limited. In production, this should be replaced with a real API key.

---

### G52. What data is retrieved for unknown tickers?

From the multi-source resolution (`resolveTickerMultiSource`):
- `ticker` (uppercase)
- `name` (company legal name)
- `exchange` (exchange acronym)
- `country` (listing country — may differ from home country for ADRs)
- `sector` (business sector)
- `industry` (sub-sector)
- `cik` (SEC CIK, if available)
- `location` / `address` (company address)
- `description` (business description)
- `officialSite` (company website)
- `dataSource` (which APIs contributed: "Polygon.io + SEC Edgar + Alpha Vantage")

**ADR resolution:** After multi-source resolution, `resolveADRCountry(ticker, name, apiCountry, exchange)` is called to determine the true home country for ADRs. This uses `KNOWN_ADR_MAPPINGS` (80+ entries) and pattern matching.

---

### G53. How are CO-GRI scores calculated for unknown tickers?

```
Unknown ticker CO-GRI calculation:
│
├── resolveTickerMultiSource(ticker) → CompanyInfo
│     → Gets: name, country, sector, industry, description
│
├── sectorClassificationService.classifySector(ticker, name, sector, industry, description)
│     → AI-enhanced sector classification
│     → Returns: {sector, multiplier, confidence, sources}
│
├── calculateIndependentChannelExposuresWithSEC(ticker, name, finalSector, finalCountry)
│     ├── hasCompanySpecificExposure(ticker) → false (unknown ticker)
│     ├── integrateStructuredData(ticker, homeCountry, sector)
│     │     ├── parseSECFiling(ticker) → attempts live SEC fetch
│     │     │     ├── getCIKFromTicker(ticker) → may find CIK via Edge Function
│     │     │     └── getLatestFilingWithHTML(cik) → may fetch 10-K
│     │     └── If SEC succeeds: use structured data (DIRECT/ALLOCATED tiers)
│     │         If SEC fails: buildGlobalFallbackV5() for all channels (MODELED tier)
│     └── Returns: channelBreakdown, blendedWeights
│
├── calculateCOGRIScore({segments, channelBreakdown, homeCountry, sector, sectorMultiplier})
│     → Standard COGRI calculation pipeline
│
└── Returns: {finalScore, riskLevel, countryExposures, scoreUncertainty}
```

---

### G54. How are the four channels populated for unknown tickers?

For unknown tickers, the channel population depends entirely on whether SEC data is available:

**If SEC data available (rare — requires successful CIK lookup + filing fetch):**
- Revenue: structured table → DIRECT/ALLOCATED tiers
- Supply: narrative admissible set → ALLOCATED tier (RF)
- Assets: PP&E table + Exhibit 21 → DIRECT/ALLOCATED tiers
- Financial: debt table → DIRECT tier

**If SEC data unavailable (typical for unknown tickers):**
- All four channels: `buildGlobalFallbackV5(homeCountry, channel, sector)` → MODELED tier
- Home country gets highest weight (λ-boosted)
- Remaining weight distributed by sector-specific economic priors

---

### G55. What is the fallback chain for unknown tickers?

```
Unknown Ticker Fallback Chain:
│
├── Level 1: companySpecificExposures.ts → MISS (not Tier 1)
├── Level 2: Live EDGAR pipeline → SKIP (only for Tier 1)
├── Level 3: resolveTickerMultiSource() → may get name/sector/country
├── Level 4: integrateStructuredData() → attempts SEC parse
│     ├── getCIKFromTicker() → may find CIK (hardcoded map or Edge Function)
│     ├── getLatestFilingWithHTML() → may fetch 10-K/20-F
│     └── V5 channel integrators → may produce DIRECT/ALLOCATED data
└── Level 5: buildGlobalFallbackV5() → ALWAYS succeeds (last resort)
      → All four channels: GF formula with sector priors
      → tier: 'MODELED', fallbackType: 'GF'
      → Score uncertainty: ±30% of final score
```

---

### G56. Is there any caching of API results for unknown tickers?

**No persistent caching** for unknown tickers. The in-memory `_livePipelineCache` in `liveEdgarPipeline.ts` is only used for Tier 1 tickers (AAPL, TSLA, MSFT). For unknown tickers:
- Each page load triggers fresh API calls
- No localStorage, IndexedDB, or Supabase caching
- The `TICKER_TO_CIK_MAP` is extended in-memory during a session (if a CIK is resolved via Edge Function), but this is lost on page reload

---

### G57. What happens for tickers that are not US-listed (foreign ADRs, etc.)?

**ADR detection and resolution** (`adrCountryResolver.ts`):

1. `resolveADRCountry(ticker, name, apiCountry, exchange)` is called after multi-source resolution
2. Checks `KNOWN_ADR_MAPPINGS` (80+ entries): e.g., `'CRESY': 'Argentina'`, `'CIB': 'Colombia'`, `'TSM': 'Taiwan'`
3. If not in known mappings: applies pattern matching (name contains "Limited", exchange is NYSE/NASDAQ but country is "United States", etc.)
4. Returns `{country: string, isADR: boolean, confidence: 'high'|'medium'|'low', source: string}`

**For foreign-listed tickers** (e.g., `0700.HK` for Tencent, `SHEL.L` for Shell):
- `companyDatabase.ts` contains entries for major foreign-listed stocks
- Exchange suffix detection: `getExchangeSuffix('0700.HK')` → `'HK'`
- Country is set to the actual home country (e.g., Hong Kong, United Kingdom)
- CO-GRI calculation uses the home country as the primary anchor for GF

**For truly unknown foreign tickers:**
- Multi-source resolution may identify them via Yahoo Finance or Marketstack
- If exchange suffix is recognized (`.L`, `.HK`, `.SI`, `.TO`, etc.), home country is inferred
- GF fallback uses the inferred home country

---

## Section H — Additional Questions from Uploaded Document

### H1. What is the CO-GRI scoring methodology at a high level?

**CO-GRI (Country-level Geopolitical Risk Index)** measures a company's exposure to geopolitical risk based on its geographic footprint across four channels. The formula is:

```
CO-GRI Score = Σ_c [W_blended(c) × CSI(c) × PoliticalAmplifier(c)] × SectorMultiplier

Where:
  W_blended(c) = 0.40×W_revenue(c) + 0.35×W_supply(c) + 0.15×W_assets(c) + 0.10×W_financial(c)
  CSI(c) = Country Shock Index for country c (0–100 scale)
  PoliticalAmplifier(c) = 1.0 + 0.5 × (1.0 - alignmentFactor(c))
  SectorMultiplier = sector-specific risk adjustment factor
```

Score range: 0–100 (approximately). Risk levels: Low (<30), Moderate (30–44), High (45–59), Very High (≥60).

---

### H2. What is the Country Shock Index (CSI)?

**File:** `src/data/globalCountries.ts`

The CSI is a pre-computed index (0–100) for each country representing its geopolitical risk/volatility. Higher = more risky. It is a composite of:
- Political stability indicators
- Conflict risk
- Sanctions exposure
- Economic fragility
- Regulatory risk

The CSI is **static** (hardcoded in `globalCountries.ts`) and updated manually. It is NOT dynamically computed from live data in the current implementation.

---

### H3. What is the political alignment service?

**File:** `src/services/politicalAlignmentService.ts` (11,926 bytes)

`calculatePoliticalAlignment(homeCountry: string, targetCountry: string): AlignmentResult`

Returns `{alignmentFactor: number (0.0–1.0), relationship: string, source: string}` where:
- `alignmentFactor = 1.0` → perfect alignment (same bloc, no amplification)
- `alignmentFactor = 0.0` → complete adversarial relationship (maximum amplification: ×1.5)

The amplification formula: `1.0 + 0.5 × (1.0 - alignmentFactor)` means:
- Aligned countries: contribution × 1.0 (no amplification)
- Neutral countries: contribution × ~1.25
- Adversarial countries: contribution × 1.5

---

### H4. What is the sector classification service?

**File:** `src/services/sectorClassificationService.ts` (29,330 bytes)

`classifySector(ticker, name, apiSector?, apiIndustry?, apiDescription?): Promise<SectorClassification>`

Uses multiple signals:
1. Ticker-based lookup (hardcoded sector overrides for known tickers)
2. Name-based pattern matching (e.g., "Bank" → Financial Services)
3. API-provided sector/industry strings
4. AI-enhanced classification using company description

Returns `{sector: string, multiplier: number, confidence: number, sources: string[]}`.

---

### H5. What is the `runtimeValidation.ts` service?

**File:** `src/services/runtimeValidation.ts` (15,944 bytes)

Provides per-ticker execution path tracing and channel quality metrics. Called after each CO-GRI calculation to generate a `ValidationReport` containing:

- **Execution path:** `'live-edgar'` | `'static-snapshot-fallback'` | `'gf-fallback'`
- **Channel quality matrix:** Per-country, per-channel evidence tier (DIRECT/ALLOCATED/MODELED/FALLBACK)
- **Channel differentiation score:** 0–1 (computed via cosine similarity between channel weight vectors)
- **Fallback audit:** Count of DIRECT vs. GF countries
- **Score uncertainty band:** ±X points
- **Data source consistency check:** Verifies exposure pathways and top risk contributors use same data object

---

### H6. What Supabase Edge Functions exist?

| Function | File | Purpose |
|----------|------|---------|
| `fetch_sec_cik` | `supabase/functions/fetch_sec_cik/index.ts` | Resolves ticker → SEC CIK via `sec.gov/files/company_tickers.json` |
| `fetch_sec_filing` | `supabase/functions/fetch_sec_filing/index.ts` | Fetches 10-K/20-F HTML from EDGAR |
| `fetch_sustainability_report` | `supabase/functions/fetch_sustainability_report/index.ts` | Fetches company sustainability reports |
| `extract_geographic_narrative` | `supabase/functions/extract_geographic_narrative/index.ts` | AI-powered geographic extraction from filing text |
| `download_pdf_report` | `supabase/functions/download_pdf_report/index.ts` | Downloads PDF reports (sustainability, etc.) |

---

### H7. What is the evidence hierarchy (V3.4 specification)?

**File:** `src/services/evidenceHierarchy.ts` (29,655 bytes)

Four-tier hierarchy (highest to lowest priority):

| Tier | Type | Source | Confidence |
|------|------|--------|------------|
| **Tier 1** | Structured Primary Evidence | Tables in statutory filings (10-K, 20-F) | 0.90–0.95 |
| **Tier 2** | Narrative Primary Evidence | Text in statutory filings (MD&A, Risk Factors) | 0.50–0.85 |
| **Tier 3** | Supplementary Evidence | Sustainability reports, supply chain disclosures, facility listings, ESG reports | 0.40–0.80 |
| **Tier 4** | Fallback Logic | SSF, RF, or GF formula-based estimation | 0.30–0.80 |

**Fallback type hierarchy within Tier 4:**
- **SSF (Segment-Specific Fallback):** Region membership fully known, region total known → highest confidence (0.75)
- **RF (Restricted Fallback):** Geography partially known, admissible set constructed → medium confidence (0.65)
- **GF (Global Fallback):** No usable geography → lowest confidence (0.50)

---

### H8. What is the three-tier fallback system in `fallbackLogic.ts`?

**File:** `src/services/fallbackLogic.ts` (29,188 bytes)

**Decision tree:**
```
Step 1: Do we know the region membership?
  YES → SSF (Segment-Specific Fallback)
        Formula: Σ_r S_r × w(c|r) where w(c|r) = T(c) / Σ_{k∈R} T(k)
        T(c) = sector-specific proxy (demand, manufacturing, etc.)

Step 2: Is there partial evidence (non-standard regions, partial lists)?
  YES → RF (Restricted Fallback)
        Constructs restricted set P from narrative signals
        Allocates within P using sector priors
        
Step 3: Is exposure plausible globally?
  YES → GF (Global Fallback)
        buildGlobalFallbackV5(homeCountry, channel, sector)
  NO  → True Zero (explicit exclusion or commercial impossibility)
```

**UN M49 Standard Regions** are defined in `fallbackLogic.ts`: Africa, Americas, Asia, Europe, Oceania, plus sub-regions (Northern Africa, Sub-Saharan Africa, Eastern Europe, etc.).

---

### H9. What is the `dataQualityValidator.ts` service?

**File:** `src/services/dataQualityValidator.ts` (21,210 bytes)

Validates geographic exposure data after calculation:
- Checks that country weights sum to ~100%
- Validates that channel breakdown is internally consistent
- Checks for suspicious patterns (e.g., single country > 95%, all countries equal weight)
- Generates quality report with warnings

Called in `getCompanyGeographicExposure()` before returning final result.

---

### H10. What is the `adjustmentHistoryTracker.ts` service?

**File:** `src/services/adjustmentHistoryTracker.ts` (16,718 bytes)

Tracks manual adjustments made to CO-GRI scores or exposure weights. Maintains an audit trail of:
- Who made the adjustment
- What was changed (country weight, channel weight, sector multiplier)
- Before/after values
- Timestamp

Used for audit compliance and reproducibility.

---

### H11. What is the `scenarioEngine.ts`?

**File:** `src/services/scenarioEngine.ts` (78,174 bytes — largest service file)

Implements the Scenario Mode feature:
- Allows users to model "what-if" scenarios (e.g., "What if China imposes 25% tariffs?")
- Applies scenario shocks to country CSI values and/or exposure weights
- Recalculates CO-GRI score under the scenario
- Compares scenario score vs. baseline score
- Supports multiple concurrent scenarios

Has backup files (`scenarioEngine.ts.backup_before_fixes`, `scenarioEngine.ts.orig`) indicating significant refactoring history.

---

### H12. What is the `predictiveAnalytics` data directory?

**Directory:** `src/data/predictiveAnalytics/`

Contains predictive analytics data for forward-looking CO-GRI assessments:
- Historical geopolitical event data
- Forecast models
- Country expansion analysis
- Mathematical analysis reports

Referenced by `cedarOwlForecast2026.ts` (39,339 bytes) — a comprehensive 2026 geopolitical forecast dataset.

---

### H13. What external data sources are integrated beyond SEC filings?

| Data Source | File | Type | Purpose |
|-------------|------|------|---------|
| **BIS Banking Statistics** | `bis_banking_financial.ts` | Static | Financial exposure priors |
| **IMF CPIS** | `imf_cpis_financial.ts` | Static | Cross-border portfolio investment |
| **OECD FDI** | `oecd_fdi_financial.ts` | Static | Foreign direct investment flows |
| **OECD ICIO** | `oecd_icio_supplyChain.ts` | Static | Inter-country input-output tables (supply chain) |
| **UN Comtrade** | `un_comtrade_trade.ts` | Static | Bilateral trade flows |
| **GDP data** | `gdpData.ts` | Static | Country GDP for priors |
| **Economic data** | `economicData.ts` | Static | Household consumption, manufacturing VA, etc. |
| **Geopolitical events** | `geopoliticalEvents.ts` | Static | Historical and current events |
| **Ground truth events** | `groundTruthEvents.ts` | Static | Validated geopolitical events |
| **Historical events** | `historicalGeopoliticalEvents.ts` | Static | Long-term historical data |
| **Market index data** | `marketIndexData.ts` | Static | Market indices for context |

---

## Cross-Reference with Previous Reports

### New Findings vs. Reports 1–5

| Finding | Previous Report | Status | Update |
|---------|----------------|--------|--------|
| Tier 1 companies: 3 (AAPL, TSLA, MSFT) | Report 1 ✓ | Confirmed | No change |
| `companyDatabase.ts`: 259 entries | Report 1 ✓ | Confirmed | No change |
| `fullNASDAQCompanyList.ts`: ~38 actual entries (not 3,300+) | Report 1 ✓ | Confirmed | No change |
| Live EDGAR pipeline: only for Tier 1 | Report 5 ✓ | Confirmed | No change |
| GF fallback for ~30 of 33 named tickers | Report 5 ✓ | Confirmed | No change |
| **NEW: Daily GitHub Actions workflow exists** | Not in Reports 1–5 | **NEW** | `update-company-database.yml` runs daily at 02:00 UTC via FMP API |
| **NEW: Alpha Vantage API key is 'demo'** | Not in Reports 1–5 | **NEW** | Severely rate-limited; production risk |
| **NEW: Marketstack API key hardcoded** | Not in Reports 1–5 | **NEW** | `64040504cef9e565bd09fa77b54ae274` in `tickerResolution.ts` |
| **NEW: 5 Supabase Edge Functions** | Report 5 mentioned 2 | **EXTENDED** | Also: `fetch_sustainability_report`, `extract_geographic_narrative`, `download_pdf_report` |
| **NEW: `evidenceHierarchy.ts` is stub/mock** | Not in Reports 1–5 | **NEW** | `EvidenceHierarchyProcessor` methods use mock implementations with `Math.random()` — not production-ready |
| **NEW: `runtimeValidation.ts` channel tier assignment is coarse** | Report 4 partial | **EXTENDED** | All four channels for a country get the SAME tier (best available), not per-channel tiers |
| **NEW: `scenarioEngine.ts` has 3 backup files** | Not in Reports 1–5 | **NEW** | Indicates significant instability/refactoring history |
| **NEW: No persistent caching for unknown tickers** | Not in Reports 1–5 | **NEW** | Each page load triggers fresh API calls for unknown tickers |
| **NEW: `LEGACY_STATIC_OVERRIDE = false`** | Report 5 ✓ | Confirmed | Live pipeline IS active for Tier 1 |
| **NEW: `evidenceHierarchy.ts` uses `Math.random()`** | Not in Reports 1–5 | **CRITICAL NEW** | Tier 1/2/3 processing uses randomized mock data — not real evidence processing |

### Critical New Finding: `evidenceHierarchy.ts` is Mock/Stub

The `EvidenceHierarchyProcessor` class in `evidenceHierarchy.ts` contains **mock implementations** with `Math.random()` calls:

```typescript
// From evidenceHierarchy.ts extractRevenueTables():
if (Math.random() > 0.3) { // 70% chance of finding revenue tables
  tables.push({ ... mock data ... });
}
```

```typescript
// From evidenceHierarchy.ts retrieveSupplementaryData():
if (Math.random() > 0.4) { // 60% chance of finding supplementary data
  mockSources.push({ ... });
}
```

**This means:** The `EvidenceHierarchyProcessor` class is **not used in production**. The actual evidence processing is done by `structuredDataIntegratorV5.ts` and `secFilingParser.ts`. The `evidenceHierarchy.ts` file appears to be a design specification / prototype that was never fully implemented. The exported `evidenceHierarchyProcessor` singleton is likely not called by any production code path.

---

## Summary Table of Key Findings

| Topic | Key Finding |
|-------|-------------|
| **Company database files** | 6 files; only `companyDatabase.ts` is auto-updated (daily via GitHub Actions + FMP API) |
| **Tier 1 companies** | 3 only: AAPL, TSLA, MSFT — hand-curated 4-channel data, last updated 2026-03-30 |
| **Primary search database** | 259 companies in `companyDatabase.ts`; 3 duplicates (RIO×2, SONY/SNE) |
| **Full NASDAQ list** | Claims 3,300+ but actually ~38 entries; aspirational documentation |
| **Daily update** | GitHub Actions at 02:00 UTC; FMP API; updates name/exchange/country/sector/isADR only; preserves aliases |
| **SEC retrieval** | 2 Supabase Edge Functions: `fetch_sec_cik` (→ sec.gov/files/company_tickers.json) + `fetch_sec_filing` (→ data.sec.gov/submissions/) |
| **CIK resolution** | Hardcoded map (46 tickers) → Edge Function → null (GF fallback) |
| **Filing retrieval** | 10-K first → 20-F fallback → null → GF fallback |
| **Retry logic** | CIK: exponential backoff, 3 attempts; Filing: no retry |
| **Caching** | In-memory session cache for Tier 1 only; no persistent cache |
| **Parsing** | cheerio-based HTML table parsing; 20+ table classification heuristics; LLM extraction via Edge Function |
| **Four channels** | Revenue (40%), Supply (35%), Assets (15%), Financial (10%) |
| **GF formula** | Channel-specific λ: revenue=0.25, supply=0.10, assets=0.35; sector-specific priors |
| **Evidence tiers** | DIRECT (±5%), ALLOCATED (±10%), MODELED (±20%), FALLBACK (±30%) |
| **Unknown tickers** | Multi-source resolution (Polygon + SEC + Alpha Vantage) → SEC parse attempt → GF fallback |
| **API keys** | Alpha Vantage: 'demo' (rate limited); Marketstack: hardcoded key; FMP: GitHub Secret |
| **`evidenceHierarchy.ts`** | **CRITICAL:** Mock/stub implementation with `Math.random()` — not used in production |
| **`scenarioEngine.ts`** | 78,174 bytes; 3 backup files indicating significant refactoring history |
| **Score uncertainty** | Computed as `finalScore × weightedTierUncertainty`; displayed as ±X points |
| **Political alignment** | Amplifies contribution by up to ×1.5 for adversarial country pairs |

---

*Report generated: 2026-04-17*  
*Auditor: David (Data Analyst, Atoms Team)*  
*Methodology: Read-only codebase audit — no modifications made*  
*Files examined: ~50+ source files across `src/data/`, `src/services/`, `src/utils/`, `supabase/functions/`, `.github/workflows/`*