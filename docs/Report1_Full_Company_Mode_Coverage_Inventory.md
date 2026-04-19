# Report 1: Full Company Mode Coverage Inventory

**Generated:** 2026-04-07  
**Scope:** All companies searchable or processable in Company Mode of the CO-GRI Dashboard  
**Methodology:** Read-only codebase audit of `/workspace/shadcn-ui/src/`  
**Auditor:** David (Data Analyst, Atoms Team)

---

## Executive Summary

| Category | Count |
|---|---|
| Companies in primary search database (`companyDatabase.ts`) | **259** unique entries (256 intended; 3 duplicates noted) |
| Companies in `fullNASDAQCompanyList.ts` (extended NASDAQ/tech list) | **38** |
| Companies in `nasdaqCompanyDatabase.ts` (structured NASDAQ data) | **18** |
| Companies with **Company-Specific Override** (Tier 1 — highest fidelity) | **3** (AAPL, TSLA, MSFT) |
| Companies with **Enhanced V4 data** (`enhancedCompanyExposures.ts`) | **10** (AAPL, MSFT, GOOGL, TSLA + 5 EDGE test cases + 1 legacy) |
| Companies on **Live SEC EDGAR pipeline** (V5 runtime) | **3** (AAPL, TSLA, MSFT) — with in-memory cache |
| Companies routed through **SEC Structured Data Integration** (all others) | All non-Tier-1 tickers attempted |
| Companies on **V5 Global Fallback (GF)** as last resort | All tickers where SEC integration fails |
| Companies with materially differentiated channel outputs | **3** confirmed (AAPL, TSLA, MSFT); others depend on SEC parse success |
| Known warnings / issues | **4** (see Section 6) |

---

## Section 1: Data Source Architecture Overview

The Company Mode processes any ticker symbol entered by the user. The pipeline follows a strict priority hierarchy:

```
Priority 1: Company-Specific Override Table (companySpecificExposures.ts)
    → AAPL, TSLA, MSFT only
    → Static hardcoded data from 10-K FY2024 + sustainability reports
    → Last updated: 2026-03-30
    → Routed through: buildIndependentChannelBreakdown() in companySpecificChannelFix.ts
    → Then upgraded by: upgradeChannelBreakdownWithSEC() using live EDGAR data

Priority 2: Live SEC EDGAR Pipeline (liveEdgarPipeline.ts)
    → Only called for tickers in Priority 1 (company-specific branch)
    → LEGACY_STATIC_OVERRIDE = false → live pipeline is active
    → In-memory cache (Map<ticker, entry>); no TTL — session-lifetime cache
    → Fetches: EDGAR submissions API → 10-K filing text → parseNarrativeText()
    → Graceful fallback to static snapshot if fetch fails

Priority 3: SEC Structured Data Integration (structuredDataIntegrator.ts)
    → Called for ALL non-Tier-1 tickers
    → Calls parseSECFiling(ticker) → attempts to fetch real SEC data
    → Also attempts fetchSustainabilityReport(ticker)
    → Falls back to SSF/RF/GF if SEC data unavailable

Priority 4: V5 Global Fallback (buildGlobalFallbackV5)
    → Last resort when SEC integration returns no data
    → Uses channel-specific λ priors (revenue λ=0.25, supply λ=0.10, assets λ=0.35, financial)
    → Sector-specific priors (GDP, household consumption, sector demand, assembly capability)
    → All outputs tagged: evidenceType='fallback', fallbackType='GF', tier='MODELED'
```

### Search Architecture

The **TickerSearchInput** and **GlobalNavigationBar** both call `tickerResolution.searchCompanies()`:
1. **Local database first** (`companyDatabase.ts` — 259 entries): instant, synchronous
2. **External APIs** (only if no local result): Marketstack → Yahoo Finance → Alpha Vantage
3. **Any ticker** can be manually entered and processed (even if not in any database)

---

## Section 2: Tier 1 — Company-Specific Override Companies (Highest Fidelity)

These 3 companies have hand-curated static exposure tables derived from their actual SEC 10-K filings and sustainability reports. They are the only companies on the full V5 channel-specific pipeline with verified data.

| Ticker | Company Name | Sector | Home Country | Data Source | Last Updated | Live EDGAR | Channel Differentiation |
|---|---|---|---|---|---|---|---|
| **AAPL** | Apple Inc. | Technology | United States | Apple 10-K FY2024 (CIK 0000320193) + Apple Supplier Responsibility Report 2024 — channel-specific values (Schema V2) | 2026-03-30 | ✅ Active (LEGACY_STATIC_OVERRIDE=false) | ✅ Full (Revenue/Supply/Assets/Financial independently built) |
| **TSLA** | Tesla, Inc. | Consumer Discretionary | United States | Tesla 10-K FY2024 (CIK 0001318605) + Tesla Impact Report 2023 + Gigafactory footprint — channel-specific values (Schema V2) | 2026-03-30 | ✅ Active | ✅ Full |
| **MSFT** | Microsoft Corporation | Technology | United States | Microsoft 10-K FY2024 (CIK 0000789019) + Microsoft Supplier Code of Conduct disclosures — regional aggregates decomposed to country level (Schema V2) | 2026-03-30 | ✅ Active | ✅ Full |

### Tier 1 Pipeline Detail

- **Static snapshot** in `companySpecificExposures.ts` is always available as fallback
- **Live EDGAR** is attempted first via `fetchLiveOrFallback(ticker)`:
  - Calls `fetchSECFilingText(ticker)` → SEC EDGAR submissions API → most recent 10-K
  - Result cached in `_livePipelineCache` (in-memory Map, session-lifetime, no TTL)
  - On cache hit: returns cached result without re-fetching
  - On fetch failure: graceful fallback to static snapshot
- **Channel breakdown** built by `buildIndependentChannelBreakdown()` using `companySpecificChannelFix.ts`
- **SEC upgrade pass**: `upgradeChannelBreakdownWithSEC()` upgrades MODELED entries with DIRECT/ALLOCATED evidence
- **Update frequency**: Static data updated manually (last: 2026-03-30); live EDGAR fetched once per session per ticker

---

## Section 3: Tier 2 — Enhanced V4 Companies (Legacy Enhancement Layer)

These companies have enhanced exposure data in `enhancedCompanyExposures.ts`. Note: AAPL, TSLA, MSFT are superseded by Tier 1. GOOGL has V4 enhancements but no Tier 1 override.

| Ticker | Company Name | Sector | Data Source | Last Updated | V5 Path | Notes |
|---|---|---|---|---|---|---|
| **AAPL** | Apple Inc. | Technology | SEC 10-K Filing 2024 | 2024-11-01 | ✅ Superseded by Tier 1 | Tier 1 takes priority |
| **MSFT** | Microsoft Corporation | Technology | SEC 10-K 2024 | 2024-07-31 | ✅ Superseded by Tier 1 | Tier 1 takes priority |
| **GOOGL** | Alphabet Inc. | Technology | SEC 10-K 2024 | 2024-02-02 | ⚠️ Tier 2 only — no Tier 1 override | Routes to SEC integration (Priority 3) |
| **TSLA** | Tesla Inc. | Automotive | SEC 10-Q Q4 2024 | 2024-12-31 | ✅ Superseded by Tier 1 | Tier 1 takes priority |
| **EDGE1** | Edge Case 1 - Missing Narrative | Technology | Test Data | 2024-01-01 | 🧪 Test only | Not production company |
| **EDGE2** | Edge Case 2 - Single Country | Financial Services | Test Data | 2024-01-01 | 🧪 Test only | Not production company |
| **EDGE3** | Edge Case 3 - Small Percentages | Technology | Test Data | 2024-01-01 | 🧪 Test only | Not production company |
| **EDGE4** | Edge Case 4 - Unusual Labels | Technology | Test Data | 2024-01-01 | 🧪 Test only | Not production company |
| **EDGE5** | Edge Case 5 - Narrative Only | Technology | Test Data - Narrative Only | 2024-01-01 | 🧪 Test only | Not production company |

---

## Section 4: Tier 3 — Full NASDAQ / Extended Company Lists (SEC Integration Path)

These companies are searchable via the local database and will be processed through SEC structured data integration (Priority 3) with V5 GF fallback (Priority 4) if SEC data is unavailable.

### 4A: Companies in `fullNASDAQCompanyList.ts` (38 entries — Tech/Growth focus)

| Ticker | Company Name | Sector | V5 Path | Channel Differentiation | Notes |
|---|---|---|---|---|---|
| AAPL | Apple Inc. | Technology | ✅ Tier 1 override | ✅ Full | Superseded |
| MSFT | Microsoft Corporation | Technology | ✅ Tier 1 override | ✅ Full | Superseded |
| GOOGL | Alphabet Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | No Tier 1 override |
| AMZN | Amazon.com Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | Sector: Consumer Discretionary in service layer |
| TSLA | Tesla Inc. | Automotive/Consumer Discretionary | ✅ Tier 1 override | ✅ Full | Superseded |
| META | Meta Platforms Inc. | Communication Services | SEC Integration → GF | ⚠️ Depends on SEC parse | Sector coefficients: Communication Services |
| NVDA | NVIDIA Corporation | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| NFLX | Netflix Inc. | Technology (db) / Communication Services (service) | SEC Integration → GF | ⚠️ Depends on SEC parse | Sector mismatch between databases |
| ADBE | Adobe Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| CRM | Salesforce Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| MRNA | Moderna Inc. | Healthcare | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| GILD | Gilead Sciences | Healthcare | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| AMGN | Amgen Inc. | Healthcare | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| ZM | Zoom Video Communications | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| DOCU | DocuSign Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| OKTA | Okta Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| SPLK | Splunk Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | Acquired by Cisco 2024 |
| WDAY | Workday Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| TEAM | Atlassian Corporation | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| PANW | Palo Alto Networks | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| CRWD | CrowdStrike Holdings | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| NET | Cloudflare Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| DDOG | Datadog Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| SNOW | Snowflake Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| PATH | UiPath Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| PLTR | Palantir Technologies | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| RBLX | Roblox Corporation | Communication Services | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| U | Unity Software Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| SFIX | Stitch Fix Inc. | Consumer Discretionary | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| ROKU | Roku Inc. | Technology | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| PINS | Pinterest Inc. | Communication Services | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| SNAP | Snap Inc. | Communication Services | SEC Integration → GF | ⚠️ Depends on SEC parse | — |
| SPOT | Spotify Technology SA | Communication Services | SEC Integration → GF | ⚠️ Depends on SEC parse | Foreign company (Sweden) |
| LRG* | Large-cap test tickers | Various | 🧪 Test only | N/A | Auto-generated test tickers |
| MID* | Mid-cap test tickers | Various | 🧪 Test only | N/A | Auto-generated test tickers |
| SML* | Small-cap test tickers | Various | 🧪 Test only | N/A | Auto-generated test tickers |
| MCR* | Micro-cap test tickers | Various | 🧪 Test only | N/A | Auto-generated test tickers |

### 4B: Companies in `nasdaqCompanyDatabase.ts` (18 entries — structured NASDAQ data)

| Ticker | Company Name | Sector | Notes |
|---|---|---|---|
| MSFT | Microsoft Corporation | Technology | Also Tier 1 |
| GOOGL | Alphabet Inc. | Technology | Also V4 enhanced |
| AMZN | Amazon.com Inc. | Technology | — |
| TSLA | Tesla Inc. | Automotive | Also Tier 1 |
| META | Meta Platforms | Technology | — |
| ZM | Zoom Video Communications | Technology | — |
| DOCU | DocuSign Inc. | Technology | — |
| OKTA | Okta Inc. | Technology | — |
| CRWD | CrowdStrike Holdings | Technology | — |
| DDOG | Datadog Inc. | Technology | — |
| SNOW | Snowflake Inc. | Technology | — |
| SFIX | Stitch Fix Inc. | Technology | — |
| ROKU | Roku Inc. | Technology | — |
| MRNA | Moderna Inc. | Healthcare | — |
| BNTX | BioNTech SE | Healthcare | Foreign company (Germany); also in fullNASDAQCompanyList |
| GILD | Gilead Sciences | Healthcare | — |

---

## Section 5: Tier 4 — Primary Search Database (`companyDatabase.ts`, 259 entries)

The primary search database contains 259 entries across multiple exchanges and geographies. These are all searchable via the navigation bar. When a user selects any of these tickers, the CO-GRI pipeline will attempt SEC integration and fall back to V5 GF.

### 5A: US Domestic Companies (NASDAQ/NYSE)

**Technology (NASDAQ/NYSE):**
AAPL, MSFT, GOOGL, AMZN, META, NVDA, NFLX, ADBE, CRM, ORCL, CSCO, INTC, AMD, IBM

**Financial Services (NYSE):**
JPM, BAC, WFC, GS, MS, C, V, MA, AXP, BLK

**Healthcare (NYSE):**
JNJ, UNH, PFE, ABBV, TMO, ABT, DHR, MRK, LLY

**Energy (NYSE):**
XOM, CVX, COP, SLB

**Consumer Cyclical (NYSE/NASDAQ):**
WMT, HD, MCD, NKE, SBUX, DIS, PG, KO, PEP

**Communication Services (NYSE):**
VZ

**Automotive (NASDAQ):**
TSLA

### 5B: ADR Companies (US-listed, foreign operations)

**China ADRs (NYSE/NASDAQ):**
BABA, PDD, JD, BIDU, NIO, LI, XPEV, NTES, BILI, YUMC

**Taiwan ADRs (NYSE):**
TSM, UMC, ASX, CHT, AUO

**South Korea ADRs (NYSE):**
KB, SHG, PKX, LPL, KEP

**Japan ADRs (NYSE/OTC):**
TM, SONY, MUFG, SMFG, NMR, MFG, HMC, NTDOY, SNE, FUJIY

**India ADRs (NYSE/NASDAQ):**
INFY, WIT, HDB, IBN, VEDL, TTM, SIFY, REDY, WNS, INDY

**Brazil ADRs (NYSE):**
PBR, VALE, ITUB, BBD, ABEV, SBS, TIMB, BRFS, CBD, GGB

**UK ADRs (NYSE):**
BP, SHEL, HSBC, AZN, GSK, DEO, UL, BCS, RIO, BTI

**Europe ADRs (NYSE/OTC):**
SAN (Spain), SNY (France), TTE (France), BNP (France), LVMUY (France), AXAHY (France), OREDY (France), DANOY (France), AIQUY (France), SAFRY (France), SAP (Germany), SIEGY (Germany), BAYRY (Germany), DAIMAY (Germany), BMWYY (Germany), VLKAF (Germany), BASFY (Germany), ADDYY (Germany), DTEGY (Germany), ALIZY (Germany), ASML (Netherlands), ING (Netherlands), PHG (Netherlands), STLA (Netherlands), HEIA (Netherlands), NVO (Denmark), NVS (Switzerland), RHHBY (Switzerland), NSRGY (Switzerland), UBS (Switzerland), CS (Switzerland), ABBNY (Switzerland), ZURN (Switzerland)

**Australia ADRs (NYSE/OTC):**
BHP, RIO, WBK, NAB, ANZ

**Israel ADRs (NASDAQ):**
TEVA, CHKP, NICE, WIX, MNDY

**South Africa ADRs (NYSE):**
GOLD, AU, GFI, SBSW, HMY

**Latin America ADRs (NYSE/NASDAQ):**
AMX (Mexico), FMX (Mexico), TV (Mexico), GFNORTEO (Mexico), CX (Mexico), YPF (Argentina), CRESY (Argentina), IRS (Argentina), BMA (Argentina), GGAL (Argentina), SUPV (Argentina), TEO (Argentina), TX (Argentina), PAM (Argentina), LOMA (Argentina), SQM (Chile), LTM (Chile), ENIA (Chile), CHL (Chile), CIB (Colombia)

### 5C: International Exchange Companies (Non-US listed)

**Canada (TSX):**
TOU.TO, ARX.TO, WCP.TO, MEG.TO, BTE.TO, TVE.TO, ERF.TO, CPG.TO, VET.TO, OVV.TO, NVA.TO, KEL.TO, SGY.TO, BIR.TO, POU.TO, PXT.TO, CNQ.TO, SU.TO, IMO.TO, CVE.TO, TRP.TO, ENB.TO (Energy); RY.TO, TD.TO, BNS.TO, BMO.TO, CM.TO, MFC.TO, SLF.TO (Financial Services); SHOP.TO (Technology); BCE.TO, T.TO (Communication Services); CNR.TO, CP.TO (Industrials)

**Colombia (BVC):**
CIB.CO, ECOPETROL.CO, BANCOLOMBIA.CO, GRUPOSURA.CO

**United Kingdom (LSE):**
SHEL.L, BP.L, HSBA.L, AZN.L, ULVR.L, DGE.L, GSK.L, BARC.L, LLOY.L, VOD.L

**Hong Kong (HKEX):**
0700.HK (Tencent), 9988.HK (Alibaba), 0005.HK (HSBC), 0941.HK (China Mobile), 0388.HK (HKEX), 1299.HK (AIA), 0001.HK (CK Hutchison), 0002.HK (CLP)

**Singapore (SGX):**
D05.SI (DBS), O39.SI (OCBC), U11.SI (UOB), Z74.SI (Singtel), C52.SI (ComfortDelGro)

**Brazil (B3):**
PETR4.SA, VALE3.SA, ITUB4.SA, BBDC4.SA, ABEV3.SA, B3SA3.SA

**Taiwan (TWSE):**
2330.TW (TSMC), 2317.TW (Foxconn), 2454.TW (MediaTek), 2882.TW (Cathay Financial), 2881.TW (Fubon Financial)

**South Africa (JSE):**
NPN.JO (Naspers), SOL.JO (Sasol), SHP.JO (Shoprite), MTN.JO (MTN Group), FSR.JO (FirstRand), SBK.JO (Standard Bank), AGL.JO (Anglo American)

> **Note on international/non-US tickers:** For TSX, LSE, HKEX, SGX, B3, TWSE, JSE tickers, the CO-GRI pipeline will attempt SEC structured data integration. However, non-US companies do not file with the SEC. The pipeline will therefore fall through to **V5 Global Fallback (GF)** for all international exchange tickers. All outputs will be tagged `evidenceType='fallback'`, `fallbackType='GF'`, `tier='MODELED'`.

---

## Section 6: Known Warnings and Issues

### Warning 1: U.S. Home Country Allocation Below Minimum
- **File:** `src/services/channelSpecificFallback.ts` (line 531)
- **Severity:** WARNING
- **Description:** When the U.S. home country allocation falls below 45%, a warning is logged: `"⚠️ WARNING: U.S. home country allocation below expected minimum (45%)"`
- **Affected companies:** Any US-headquartered company where SEC data or fallback produces a low domestic allocation
- **Impact:** May indicate data quality issues in channel breakdown

### Warning 2: Sector Mismatch Between Databases
- **File:** `companyDatabase.ts` vs `geographicExposureService.ts`
- **Severity:** INFO / potential inconsistency
- **Description:** Several companies have different sector classifications across databases:
  - NFLX: `Technology` in `companyDatabase.ts` vs `Communication Services` in service layer sector coefficients
  - META: `Technology` in `companyDatabase.ts` vs `Communication Services` in sector coefficient map
  - AMZN: `Technology` in `companyDatabase.ts` vs `Consumer Discretionary` in service layer
  - TSLA: `Automotive` in `companyDatabase.ts` vs `Consumer Discretionary` in `companySpecificExposures.ts`
- **Impact:** Sector multiplier and channel prior weights may differ depending on which sector classification is used. The service layer (`geographicExposureService.ts`) has a dedicated fix (line 166-189) to handle META, AMZN, NFLX, DIS, TSLA with correct sector coefficients.

### Warning 3: In-Memory Cache Has No TTL (Live EDGAR Pipeline)
- **File:** `src/services/v5/liveEdgarPipeline.ts`
- **Severity:** INFO / operational concern
- **Description:** The live EDGAR pipeline cache (`_livePipelineCache`) is session-lifetime with no time-to-live. Once fetched, data is never refreshed until the application restarts.
- **Affected companies:** AAPL, TSLA, MSFT (Tier 1 only)
- **Impact:** Stale data risk if the application runs for extended periods without restart. Data is only as fresh as the last application restart.

### Warning 4: SPLK (Splunk) Acquisition — Stale Company Record
- **File:** `src/data/fullNASDAQCompanyList.ts`
- **Severity:** INFO
- **Description:** Splunk Inc. (SPLK) was acquired by Cisco in March 2024 and no longer trades independently. The ticker remains in the database.
- **Impact:** Users searching for SPLK will receive a CO-GRI assessment, but the company no longer files independently with the SEC. The pipeline will fall back to V5 GF.

### Warning 5: Duplicate Entries in `companyDatabase.ts`
- **File:** `src/utils/companyDatabase.ts`
- **Severity:** INFO
- **Description:** `VALE` appears twice (Vale S.A. — NYSE ADR), and `RIO` appears twice (Rio Tinto Group and Rio Tinto Limited). These duplicates may cause ambiguous search results.
- **Impact:** Search may return duplicate results for these tickers.

### Warning 6: International Exchange Tickers Always Fall to GF
- **File:** `src/services/structuredDataIntegrator.ts`, `src/services/geographicExposureService.ts`
- **Severity:** WARNING
- **Description:** All ~100+ international exchange tickers (TSX, LSE, HKEX, SGX, B3, TWSE, JSE, BVC) in `companyDatabase.ts` do not file with the SEC. The SEC integration step will fail for all of them, and they will always be processed via V5 Global Fallback (GF).
- **Impact:** All channel outputs for international exchange tickers are `tier='MODELED'`, `evidenceType='fallback'`, `dataQuality='low'`. No channel differentiation is possible without company-specific overrides.

---

## Section 7: V5 Pipeline Path Summary by Company Tier

| Tier | Companies | Pipeline Path | Data Quality | Channel Differentiation | Update Frequency |
|---|---|---|---|---|---|
| **Tier 1 — Company-Specific Override** | AAPL, TSLA, MSFT | `companySpecificChannelFix` → `upgradeChannelBreakdownWithSEC` → Live EDGAR (cached) | HIGH — verified from 10-K + sustainability reports | ✅ Full (4 independent channels) | Static: 2026-03-30; Live EDGAR: once per session |
| **Tier 2 — V4 Enhanced** | GOOGL (production); EDGE1-5 (test) | SEC Structured Integration → SSF/RF/GF | MEDIUM — depends on SEC parse success | ⚠️ Partial (depends on SEC data) | SEC filing: per-session fetch attempt |
| **Tier 3 — NASDAQ Extended List** | 38 tickers in fullNASDAQCompanyList | SEC Structured Integration → SSF/RF/GF | LOW-MEDIUM — depends on SEC parse | ⚠️ Partial | Per-session fetch attempt |
| **Tier 4 — Primary Search DB (US domestic)** | ~60 US NASDAQ/NYSE companies | SEC Structured Integration → GF | LOW-MEDIUM — depends on SEC parse | ⚠️ Partial | Per-session fetch attempt |
| **Tier 4 — Primary Search DB (US ADRs)** | ~100 ADR companies | SEC Structured Integration → GF | LOW — most ADRs don't file 20-F via standard EDGAR search | ⚠️ Unlikely differentiation | Per-session fetch attempt; likely GF |
| **Tier 4 — Primary Search DB (International)** | ~100 international exchange companies | V5 GF only | LOW — no SEC filing | ❌ No differentiation possible | Static sector/GDP priors only |
| **Tier 5 — Arbitrary ticker (not in any DB)** | Any user-entered ticker | SEC Structured Integration → GF | LOW | ⚠️ Partial | Per-session fetch attempt |

---

## Section 8: Sector Coverage in Primary Search Database

| Sector | Count (approx.) | Notes |
|---|---|---|
| Technology | ~80 | Largest sector; includes US tech, ADRs, and international tech |
| Financial Services | ~60 | Banks, insurance, exchanges across all geographies |
| Energy | ~45 | Heavy Canadian TSX representation; US majors; Latin America |
| Consumer Cyclical / Defensive | ~30 | US consumer brands; international consumer |
| Healthcare | ~20 | US pharma/biotech; European pharma ADRs |
| Basic Materials | ~15 | Mining (South Africa, Australia, Brazil) |
| Automotive | ~10 | US (TSLA), Japan (TM, HMC), Germany (BMW, VW, Mercedes), China (NIO, LI, XPEV) |
| Communication Services | ~10 | US telecom, streaming, social media |
| Industrials | ~8 | Canada rail, European industrials |
| Utilities | ~5 | Korea, Chile, Singapore |
| Real Estate | ~3 | Argentina |

---

## Section 9: Data Source Classification Summary

| Data Source Type | Description | Companies | Live/Static/Fallback |
|---|---|---|---|
| **Company-Specific Static Override** | Hand-curated 10-K + sustainability data, Schema V2 | AAPL, TSLA, MSFT | Static (updated 2026-03-30) |
| **Live SEC EDGAR Pipeline** | Real-time 10-K fetch via EDGAR submissions API | AAPL, TSLA, MSFT (Tier 1 only) | Live (session-cached, no TTL) |
| **SEC Structured Data Integration** | `parseSECFiling()` + `fetchSustainabilityReport()` | All non-Tier-1 US tickers | Live attempt; fallback to SSF/RF/GF |
| **Narrative Parser** | `parseNarrativeText()` on 10-K text | All tickers (via SEC integration) | Live attempt; empty if no filing text |
| **V5 Segment-Specific Fallback (SSF)** | Region membership known; allocate within region | Any ticker with regional SEC segments | Derived from SEC data + region priors |
| **V5 Restricted Fallback (RF)** | Partial geography known | Any ticker with partial SEC evidence | Derived from partial evidence |
| **V5 Global Fallback (GF)** | No geographic evidence; sector/GDP priors | All international exchange tickers; US tickers where SEC fails | Static sector/GDP priors (no live data) |
| **Mock/Test Data** | EDGE1-5 test cases; companyExposureGenerator | EDGE1-5, AAPL/NVDA/INTC/MSFT/GOOGL in mock generator | Simulated — not used in production pipeline |

---

## Section 10: Recommendations

1. **Expand Tier 1 coverage**: Only 3 companies (AAPL, TSLA, MSFT) have verified company-specific data. High-priority candidates for Tier 1 expansion: GOOGL, AMZN, NVDA, META, NFLX — all frequently searched and all currently on GF fallback for non-SEC-parseable channels.

2. **Add TTL to live EDGAR cache**: The in-memory cache in `liveEdgarPipeline.ts` has no expiry. Add a TTL (e.g., 24 hours) to ensure data freshness for long-running sessions.

3. **International ticker handling**: ~100 international exchange tickers in `companyDatabase.ts` will always fall to GF. Consider either: (a) adding company-specific overrides for major international companies (TSM, SONY, TM, ASML, NVO, etc.), or (b) clearly labeling international ticker results in the UI as "Modeled — No SEC Filing Available."

4. **Resolve sector mismatches**: Standardize sector classifications across `companyDatabase.ts`, `fullNASDAQCompanyList.ts`, `nasdaqCompanyDatabase.ts`, and `companySpecificExposures.ts`. Current mismatches (NFLX, META, AMZN, TSLA) are partially handled in the service layer but create maintenance risk.

5. **Remove stale SPLK entry**: Splunk was acquired by Cisco in 2024. Remove or mark as inactive in `fullNASDAQCompanyList.ts`.

6. **Deduplicate VALE and RIO**: Remove duplicate entries in `companyDatabase.ts` for VALE and RIO.

7. **Update frequency documentation**: The dashboard has no visible indicator of when company data was last updated. Consider surfacing the `lastUpdated` field from `companySpecificExposures.ts` and the `cachedAt` timestamp from the live EDGAR cache in the UI.

---

## Appendix A: File Inventory

| File | Purpose | Entry Count |
|---|---|---|
| `src/utils/companyDatabase.ts` | Primary search database; used by `tickerResolution.searchCompanies()` | 259 entries (3 duplicates) |
| `src/data/fullNASDAQCompanyList.ts` | Extended NASDAQ/tech company list | 38 entries |
| `src/data/nasdaqCompanyDatabase.ts` | Structured NASDAQ data with CIK, market cap, etc. | 18 entries |
| `src/data/enhancedNASDAQDatabase.ts` | Enhanced NASDAQ data class with indexes | Extends fullNASDAQCompanyList |
| `src/data/companySpecificExposures.ts` | Tier 1 hand-curated exposure data | 3 production companies (AAPL, TSLA, MSFT) |
| `src/data/enhancedCompanyExposures.ts` | V4 enhanced exposure data | 10 entries (3 production + 5 test + 2 legacy) |
| `src/data/companySpecificExposures.ts` | Company-specific geographic exposure overrides | 3 companies |
| `src/data/phase4_test_companies.ts` | Phase 4 test companies | 9 entries (4 real + 5 EDGE test) |
| `src/services/v5/liveEdgarPipeline.ts` | Live EDGAR fetch + in-memory cache | Tier 1 only |
| `src/services/v5/companySpecificChannelFix.ts` | Independent channel breakdown builder | Tier 1 only |
| `src/services/structuredDataIntegrator.ts` | SEC structured data integration | All non-Tier-1 |
| `src/services/narrativeParser.ts` | SEC 10-K narrative text parser | All tickers |
| `src/services/geographicExposureService.ts` | Main geographic exposure orchestrator | All tickers |
| `src/services/fallbackLogic.ts` | SSF/RF/GF fallback decision logic | All tickers |
| `src/services/v5/channelPriors.ts` | V5 channel-specific priors (GDP, sector demand) | All tickers |
| `src/services/cogriCalculationService.ts` | Final CO-GRI score calculation | All tickers |
| `src/services/tickerResolution.ts` | Company search (local DB + external APIs) | All tickers |
| `src/scripts/updateCompanyDatabase.ts` | Daily auto-update script for companyDatabase.ts | FMP API; updates 256 tickers |
| `src/services/mockData/companyExposureGenerator.ts` | Mock data generator for testing | AAPL, NVDA, INTC, MSFT, GOOGL (test only) |

---

*End of Report 1: Full Company Mode Coverage Inventory*  
*Report generated by David (Data Analyst) — 2026-04-07*