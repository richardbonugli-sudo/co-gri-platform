# Report 7: SEC Runtime Baseline Feasibility Assessment

**Generated:** 2026-04-19  
**Scope:** Deep feasibility assessment for running a live runtime baseline across all SEC-eligible companies in the CO-GRI platform universe  
**Methodology:** Read-only codebase audit — no source code modifications  
**Auditor:** David (Data Analyst, Atoms Team)  
**Requested by:** User via Mike (Team Leader)  
**Prerequisite reports:** Reports 1–6, Report 6 Enhanced

---

## Executive Summary

### Recommendation: **YES — Conditionally Feasible, with Phased Approach**

Running a live runtime baseline across all SEC-eligible companies is **technically feasible and strongly recommended**, subject to the following conditions:

1. **Phase 1 (Pilot):** Run Category A only (41 companies with hardcoded CIKs) — estimated 7–10 minutes, zero risk of EDGAR blocking, ~82 Supabase invocations
2. **Phase 2 (Full Cat A+B):** Add 14 Category B companies (US-listed, no CIK) — adds ~5 minutes, ~28 additional invocations
3. **Phase 3 (ADR subset):** Run the ~40 highest-priority Category C ADRs that are known 20-F filers — adds ~15 minutes, ~80 invocations

**The baseline is NOT recommended for all 119 Category C ADRs in a single run** due to uncertain CIK resolution rates, 20-F parsing reliability, and Supabase invocation budget concerns.

### Key Numbers

| Metric | Value |
|--------|-------|
| Total companies in universe | 253 (companyDatabase.ts entries) |
| Category A — Guaranteed SEC-eligible | **41** |
| Category B — Potentially SEC-eligible (US-listed, no CIK) | **14** |
| Category C — Potentially SEC-eligible (ADR/20-F filers) | **119** |
| Category D — NOT SEC-eligible (foreign-listed only) | **79** |
| **Total SEC-eligible (A+B+C)** | **174** |
| **Recommended pilot scope (Cat A only)** | **41** |
| **Recommended full scope (Cat A+B)** | **55** |
| Estimated processing time — Cat A only (sequential) | ~7–10 minutes |
| Estimated processing time — Cat A+B (sequential) | ~9–14 minutes |
| Estimated processing time — Cat A+B+C full (sequential) | ~29–44 minutes |
| Supabase invocations — Cat A only | ~82 (2/company) |
| Supabase invocations — Cat A+B | ~110 |
| Supabase invocations — Cat A+B+C | ~348 |
| EDGAR rate limit | 10 req/sec (we use ~0.1 req/sec = safe) |
| Existing script infrastructure | Yes — `src/scripts/updateCompanyDatabase.ts` pattern |
| GitHub Actions infrastructure | Yes — existing workflow pattern |

### What the Baseline Would Definitively Answer

The baseline would transform the CO-GRI platform from **"we believe these companies produce company-specific outputs"** to **"we have empirically verified that X of 55 companies produce company-specific outputs, with the following evidence tier breakdown per channel"**. This is the single most important quality assurance exercise the platform can run.

---

## Section 1: SEC-Eligible Universe Definition

### 1.1 Definition of SEC-Eligibility

A company is **SEC-eligible** for the purposes of this baseline if it meets ALL of the following criteria:
1. It is listed on a US exchange (NYSE, NASDAQ, AMEX) OR is an ADR/foreign private issuer that files with the SEC
2. It has a CIK that is either hardcoded in `TICKER_TO_CIK_MAP` OR can plausibly be resolved via the `fetch_sec_cik` Edge Function (which queries `https://www.sec.gov/files/company_tickers.json`)
3. It is NOT listed exclusively on a foreign exchange (HKEX, TWSE, LSE, TSX, ASX, JSE, B3, SGX, BVC) with no SEC filing obligation

A company is **NOT SEC-eligible** if:
- It is listed only on HKEX, TWSE, LSE, TSX, ASX, JSE, B3, SGX, BMV, or BVC
- It has no SEC filing obligation (i.e., it is not a US domestic issuer and does not file 20-F)

### 1.2 Category A — Guaranteed SEC-eligible (Hardcoded CIK): 41 Companies

These companies have their CIK hardcoded in `src/services/secFilingParser.ts` `TICKER_TO_CIK_MAP`. They will **always** enter the SEC path successfully at the CIK resolution step. Note: The map contains 52 entries but 11 are duplicates (BRK.A/BRK.B share a CIK; GOOG/GOOGL share a CIK; J36/J36.SI/JARD share a CIK; J36/J36.SI/JARD are not in `companyDatabase.ts`). After deduplication against `companyDatabase.ts`, there are **41 unique companies**.

| # | Ticker | Company Name | Exchange | Sector | ADR | Filing Type | CIK |
|---|--------|-------------|----------|--------|-----|------------|-----|
| 1 | AAPL | Apple Inc. | NASDAQ | Technology | No | 10-K | 0000320193 |
| 2 | ABT | Abbott Laboratories | NYSE | Healthcare | No | 10-K | 0000001800 |
| 3 | ADBE | Adobe Inc. | NASDAQ | Technology | No | 10-K | 0000796343 |
| 4 | AMD | Advanced Micro Devices Inc. | NASDAQ | Technology | No | 10-K | 0000002488 |
| 5 | AMZN | Amazon.com Inc. | NASDAQ | Technology | No | 10-K | 0001018724 |
| 6 | BABA | Alibaba Group Holding Limited | NYSE | Technology | Yes | 20-F | 0001577552 |
| 7 | BAC | Bank of America Corporation | NYSE | Financial Services | No | 10-K | 0000070858 |
| 8 | BIDU | Baidu Inc. | NASDAQ | Technology | Yes | 20-F | 0001329099 |
| 9 | CRM | Salesforce Inc. | NYSE | Technology | No | 10-K | 0001108524 |
| 10 | CSCO | Cisco Systems Inc. | NASDAQ | Technology | No | 10-K | 0000858877 |
| 11 | DIS | Walt Disney Company | NYSE | Consumer Cyclical | No | 10-K | 0001744489 |
| 12 | GOOGL | Alphabet Inc. | NASDAQ | Technology | No | 10-K | 0001652044 |
| 13 | HD | Home Depot Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000354950 |
| 14 | IBM | International Business Machines | NYSE | Technology | No | 10-K | 0000051143 |
| 15 | INTC | Intel Corporation | NASDAQ | Technology | No | 10-K | 0000050863 |
| 16 | JD | JD.com Inc. | NASDAQ | Technology | Yes | 20-F | 0001549802 |
| 17 | JNJ | Johnson & Johnson | NYSE | Healthcare | No | 10-K | 0000200406 |
| 18 | JPM | JPMorgan Chase & Co. | NYSE | Financial Services | No | 10-K | 0000019617 |
| 19 | KO | Coca-Cola Company | NYSE | Consumer Cyclical | No | 10-K | 0000021344 |
| 20 | LI | Li Auto Inc. | NASDAQ | Automotive | Yes | 20-F | 0001791706 |
| 21 | MA | Mastercard Incorporated | NYSE | Financial Services | No | 10-K | 0001141391 |
| 22 | META | Meta Platforms Inc. | NASDAQ | Technology | No | 10-K | 0001326801 |
| 23 | MRK | Merck & Co. Inc. | NYSE | Healthcare | No | 10-K | 0000310158 |
| 24 | MSFT | Microsoft Corporation | NASDAQ | Technology | No | 10-K | 0000789019 |
| 25 | NFLX | Netflix Inc. | NASDAQ | Technology | No | 10-K | 0001065280 |
| 26 | NIO | NIO Inc. | NYSE | Automotive | Yes | 20-F | 0001736541 |
| 27 | NKE | Nike Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000320187 |
| 28 | NVDA | NVIDIA Corporation | NASDAQ | Technology | No | 10-K | 0001045810 |
| 29 | ORCL | Oracle Corporation | NYSE | Technology | No | 10-K | 0001341439 |
| 30 | PDD | PDD Holdings Inc. | NASDAQ | Technology | Yes | 20-F | 0001737806 |
| 31 | PEP | PepsiCo Inc. | NASDAQ | Consumer Cyclical | No | 10-K | 0000077476 |
| 32 | PFE | Pfizer Inc. | NYSE | Healthcare | No | 10-K | 0000078003 |
| 33 | PG | Procter & Gamble Company | NYSE | Consumer Cyclical | No | 10-K | 0000080424 |
| 34 | TSLA | Tesla Inc. | NASDAQ | Automotive | No | 10-K | 0001318605 |
| 35 | TSM | Taiwan Semiconductor Manufacturing | NYSE | Technology | Yes | 20-F | 0001046179 |
| 36 | UNH | UnitedHealth Group Inc. | NYSE | Healthcare | No | 10-K | 0000731766 |
| 37 | V | Visa Inc. | NYSE | Financial Services | No | 10-K | 0001403161 |
| 38 | VZ | Verizon Communications Inc. | NYSE | Communication Services | No | 10-K | 0000732712 |
| 39 | WMT | Walmart Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000104169 |
| 40 | XOM | Exxon Mobil Corporation | NYSE | Energy | No | 10-K | 0000034088 |
| 41 | XPEV | XPeng Inc. | NYSE | Automotive | Yes | 20-F | 0001840063 |

**Sub-breakdown:**
- 10-K filers (US domestic): 33 companies
- 20-F filers (foreign private issuers): 8 companies (BABA, BIDU, JD, LI, NIO, PDD, TSM, XPEV)
- Tier 1 (static data always available): 3 (AAPL, TSLA, MSFT)

**Additional CIKs in the map but NOT in companyDatabase.ts:**
- BRK.A / BRK.B (Berkshire Hathaway, CIK 0001067983) — not in companyDatabase.ts
- CMCSA (Comcast, CIK 0001166691) — not in companyDatabase.ts
- GE (General Electric, CIK 0000040545) — not in companyDatabase.ts
- GOOG (duplicate of GOOGL) — not separately in companyDatabase.ts
- J36 / J36.SI / JARD (Jardine Matheson, CIK 0000870016) — not in companyDatabase.ts
- QCOM (Qualcomm, CIK 0000804328) — not in companyDatabase.ts
- T (AT&T, CIK 0000732717) — **IS in companyDatabase.ts** as T.TO (TSX) — but T itself is not listed
- BA (Boeing, CIK 0000012927) — not in companyDatabase.ts

**Important note on T:** The `TICKER_TO_CIK_MAP` contains `T` (AT&T, CIK 0000732717), but `companyDatabase.ts` contains `T.TO` (Telus Corp, TSX). These are different companies. The CIK for `T` (AT&T) will not match `T.TO` (Telus). This is a **data inconsistency** to be aware of.

### 1.3 Category B — Potentially SEC-eligible (US-listed, no hardcoded CIK): 14 Companies

These are US-listed companies on NYSE or NASDAQ that are NOT in `TICKER_TO_CIK_MAP`. They can attempt CIK resolution via the `fetch_sec_cik` Edge Function (which queries `https://www.sec.gov/files/company_tickers.json`). All are US domestic issuers that file 10-K. **CIK resolution success rate: expected ~100%** for these well-known companies.

| # | Ticker | Company Name | Exchange | Sector | Expected CIK Resolution |
|---|--------|-------------|----------|--------|------------------------|
| 1 | ABBV | AbbVie Inc. | NYSE | Healthcare | Very High |
| 2 | AXP | American Express Company | NYSE | Financial Services | Very High |
| 3 | BLK | BlackRock Inc. | NYSE | Financial Services | Very High |
| 4 | C | Citigroup Inc. | NYSE | Financial Services | Very High |
| 5 | COP | ConocoPhillips | NYSE | Energy | Very High |
| 6 | CVX | Chevron Corporation | NYSE | Energy | Very High |
| 7 | DHR | Danaher Corporation | NYSE | Healthcare | Very High |
| 8 | GS | Goldman Sachs Group Inc. | NYSE | Financial Services | Very High |
| 9 | LLY | Eli Lilly and Company | NYSE | Healthcare | Very High |
| 10 | MS | Morgan Stanley | NYSE | Financial Services | Very High |
| 11 | SBUX | Starbucks Corporation | NASDAQ | Consumer Cyclical | Very High |
| 12 | SLB | Schlumberger Limited | NYSE | Energy | High (foreign HQ but US-listed) |
| 13 | TMO | Thermo Fisher Scientific | NYSE | Healthcare | Very High |
| 14 | WFC | Wells Fargo & Company | NYSE | Financial Services | Very High |

**Note on SLB:** Schlumberger (now SLB) is incorporated in Curaçao but listed on NYSE and files 10-K with the SEC. CIK resolution should succeed.

### 1.4 Category C — Potentially SEC-eligible (ADR/20-F filers): 119 Companies

These are foreign companies listed on US exchanges as ADRs, or OTC ADRs. Many file 20-F with the SEC. However, **not all ADRs file with the SEC** — some are Level 1 ADRs (exempt from SEC registration) or have been delisted/deregistered.

**Sub-categories within Category C:**

**C1 — High-confidence 20-F filers (NYSE/NASDAQ listed, likely SEC-registered):** ~60 companies
These are listed on major US exchanges (NYSE/NASDAQ) which requires SEC registration. They file 20-F annually.

**C2 — Lower-confidence filers (OTC ADRs):** ~25 companies  
OTC ADRs (ABBNY, ADDYY, AIQUY, ALIZY, ANZ, AXAHY, BASFY, BAYRY, BMWYY, BNP, DAIMAY, DANOY, DTEGY, FUJIY, GFNORTEO, HEIA, LVMUY, NAB, NSRGY, NTDOY, RHHBY, SAFRY, SIEGY, VLKAF, ZURN) may be Level 1 ADRs exempt from SEC registration, or may file 20-F. CIK resolution is uncertain.

**C3 — Dual-listed (both US ADR and foreign exchange):** ~34 companies  
Companies like RIO (NYSE + LSE), VALE (NYSE + B3), SHEL (NYSE + LSE) — the ADR is SEC-registered.

**Complete Category C list (119 companies):**

| # | Ticker | Company Name | Exchange | Country | C Sub-cat | 20-F Likely |
|---|--------|-------------|----------|---------|-----------|------------|
| 1 | ABBNY | ABB Ltd | OTC | Switzerland | C2 | Uncertain |
| 2 | ABEV | Ambev S.A. | NYSE | Brazil | C1 | Yes |
| 3 | ADDYY | Adidas AG | OTC | Germany | C2 | Uncertain |
| 4 | AIQUY | Air Liquide SA | OTC | France | C2 | Uncertain |
| 5 | ALIZY | Allianz SE | OTC | Germany | C2 | Uncertain |
| 6 | AMX | América Móvil S.A.B. | NYSE | Mexico | C1 | Yes |
| 7 | ANZ | Australia and New Zealand Banking | OTC | Australia | C2 | Uncertain |
| 8 | ASML | ASML Holding N.V. | NASDAQ | Netherlands | C1 | Yes |
| 9 | ASX | ASE Technology Holding | NYSE | Taiwan | C1 | Yes |
| 10 | AU | AngloGold Ashanti Limited | NYSE | South Africa | C1 | Yes |
| 11 | AUO | AU Optronics Corp. | NYSE | Taiwan | C1 | Yes |
| 12 | AXAHY | AXA SA | OTC | France | C2 | Uncertain |
| 13 | AZN | AstraZeneca PLC | NASDAQ | UK | C1 | Yes |
| 14 | BASFY | BASF SE | OTC | Germany | C2 | Uncertain |
| 15 | BAYRY | Bayer AG | OTC | Germany | C2 | Uncertain |
| 16 | BBD | Banco Bradesco S.A. | NYSE | Brazil | C1 | Yes |
| 17 | BCS | Barclays PLC | NYSE | UK | C1 | Yes |
| 18 | BHP | BHP Group Limited | NYSE | Australia | C1 | Yes |
| 19 | BILI | Bilibili Inc. | NASDAQ | China | C1 | Yes |
| 20 | BMA | Banco Macro S.A. | NYSE | Argentina | C1 | Yes |
| 21 | BMWYY | BMW AG | OTC | Germany | C2 | Uncertain |
| 22 | BNP | BNP Paribas SA | OTC | France | C2 | Uncertain |
| 23 | BP | BP plc | NYSE | UK | C1 | Yes |
| 24 | BRFS | BRF S.A. | NYSE | Brazil | C1 | Yes |
| 25 | BTI | British American Tobacco plc | NYSE | UK | C1 | Yes |
| 26 | CBD | Companhia Brasileira de Distribuição | NYSE | Brazil | C1 | Yes |
| 27 | CHKP | Check Point Software Technologies | NASDAQ | Israel | C1 | Yes |
| 28 | CHL | China Mobile Limited | NYSE | China | C1 | Yes (or was) |
| 29 | CHT | Chunghwa Telecom Co. Ltd. | NYSE | Taiwan | C1 | Yes |
| 30 | CIB | Bancolombia S.A. | NYSE | Colombia | C1 | Yes |
| 31 | CRESY | Cresud S.A.C.I.F.A. | NASDAQ | Argentina | C1 | Yes |
| 32 | CS | Credit Suisse Group AG | NYSE | Switzerland | C1 | Yes (defunct) |
| 33 | CX | CEMEX S.A.B. de C.V. | NYSE | Mexico | C1 | Yes |
| 34 | DAIMAY | Mercedes-Benz Group AG | OTC | Germany | C2 | Uncertain |
| 35 | DANOY | Danone SA | OTC | France | C2 | Uncertain |
| 36 | DEO | Diageo plc | NYSE | UK | C1 | Yes |
| 37 | DTEGY | Deutsche Telekom AG | OTC | Germany | C2 | Uncertain |
| 38 | ENIA | Enel Americas S.A. | NYSE | Chile | C1 | Yes |
| 39 | FMX | Fomento Económico Mexicano | NYSE | Mexico | C1 | Yes |
| 40 | FUJIY | Fujitsu Limited | OTC | Japan | C2 | Uncertain |
| 41 | GFI | Gold Fields Limited | NYSE | South Africa | C1 | Yes |
| 42 | GFNORTEO | Grupo Financiero Banorte | OTC | Mexico | C2 | Uncertain |
| 43 | GGAL | Grupo Financiero Galicia S.A. | NASDAQ | Argentina | C1 | Yes |
| 44 | GGB | Gerdau S.A. | NYSE | Brazil | C1 | Yes |
| 45 | GOLD | Barrick Gold Corporation | NYSE | Canada | C1 | Yes (40-F) |
| 46 | GSK | GSK plc | NYSE | UK | C1 | Yes |
| 47 | HDB | HDFC Bank Limited | NYSE | India | C1 | Yes |
| 48 | HEIA | Heineken N.V. | OTC | Netherlands | C2 | Uncertain |
| 49 | HMC | Honda Motor Co. Ltd. | NYSE | Japan | C1 | Yes |
| 50 | HMY | Harmony Gold Mining | NYSE | South Africa | C1 | Yes |
| 51 | HSBC | HSBC Holdings plc | NYSE | UK | C1 | Yes |
| 52 | IBN | ICICI Bank Limited | NYSE | India | C1 | Yes |
| 53 | INDY | India Fund Inc. | NYSE | USA (fund) | C1 | 10-K (fund) |
| 54 | INFY | Infosys Limited | NYSE | India | C1 | Yes |
| 55 | ING | ING Groep N.V. | NYSE | Netherlands | C1 | Yes |
| 56 | IRS | IRSA Inversiones y Representaciones | NYSE | Argentina | C1 | Yes |
| 57 | ITUB | Itaú Unibanco Holding S.A. | NYSE | Brazil | C1 | Yes |
| 58 | KB | KB Financial Group Inc. | NYSE | South Korea | C1 | Yes |
| 59 | KEP | Korea Electric Power Corporation | NYSE | South Korea | C1 | Yes |
| 60 | LOMA | Loma Negra Compañía Industrial | NYSE | Argentina | C1 | Yes |
| 61 | LPL | LG Display Co. Ltd. | NYSE | South Korea | C1 | Yes |
| 62 | LTM | Latam Airlines Group S.A. | NYSE | Chile | C1 | Yes |
| 63 | LVMUY | LVMH Moët Hennessy Louis Vuitton | OTC | France | C2 | Uncertain |
| 64 | MFG | Mizuho Financial Group Inc. | NYSE | Japan | C1 | Yes |
| 65 | MNDY | Monday.com Ltd. | NASDAQ | Israel | C1 | Yes |
| 66 | MUFG | Mitsubishi UFJ Financial Group | NYSE | Japan | C1 | Yes |
| 67 | NAB | National Australia Bank Limited | OTC | Australia | C2 | Uncertain |
| 68 | NICE | NICE Ltd. | NASDAQ | Israel | C1 | Yes |
| 69 | NMR | Nomura Holdings Inc. | NYSE | Japan | C1 | Yes |
| 70 | NSRGY | Nestlé S.A. | OTC | Switzerland | C2 | Uncertain |
| 71 | NTDOY | Nintendo Co. Ltd. | OTC | Japan | C2 | Uncertain |
| 72 | NTES | NetEase Inc. | NASDAQ | China | C1 | Yes |
| 73 | NVO | Novo Nordisk A/S | NYSE | Denmark | C1 | Yes |
| 74 | NVS | Novartis AG | NYSE | Switzerland | C1 | Yes |
| 75 | PAM | Pampa Energía S.A. | NYSE | Argentina | C1 | Yes |
| 76 | PBR | Petróleo Brasileiro S.A. | NYSE | Brazil | C1 | Yes |
| 77 | PHG | Koninklijke Philips N.V. | NYSE | Netherlands | C1 | Yes |
| 78 | PKX | POSCO Holdings Inc. | NYSE | South Korea | C1 | Yes |
| 79 | RHHBY | Roche Holding AG | OTC | Switzerland | C2 | Uncertain |
| 80 | RIO | Rio Tinto Group | NYSE | UK/Australia | C3 | Yes |
| 81 | RIO | Rio Tinto Limited | NYSE | UK/Australia | C3 | Yes (duplicate) |
| 82 | SAFRY | Safran SA | OTC | France | C2 | Uncertain |
| 83 | SAN | Banco Santander S.A. | NYSE | Spain | C1 | Yes |
| 84 | SAP | SAP SE | NYSE | Germany | C1 | Yes |
| 85 | SBS | Companhia de Saneamento Básico | NYSE | Brazil | C1 | Yes |
| 86 | SBSW | Sibanye Stillwater Limited | NYSE | South Africa | C1 | Yes |
| 87 | SHEL | Shell plc | NYSE | UK/Netherlands | C1 | Yes |
| 88 | SHG | Shinhan Financial Group | NYSE | South Korea | C1 | Yes |
| 89 | SIEGY | Siemens AG | OTC | Germany | C2 | Uncertain |
| 90 | SIFY | Sify Technologies Limited | NASDAQ | India | C1 | Yes |
| 91 | SMFG | Sumitomo Mitsui Financial Group | NYSE | Japan | C1 | Yes |
| 92 | SNE | Sony Corporation | NYSE | Japan | C1 | Yes (duplicate of SONY) |
| 93 | SNY | Sanofi | NASDAQ | France | C1 | Yes |
| 94 | SONY | Sony Group Corporation | NYSE | Japan | C1 | Yes |
| 95 | SQM | Sociedad Química y Minera de Chile | NYSE | Chile | C1 | Yes |
| 96 | STLA | Stellantis N.V. | NYSE | Netherlands | C1 | Yes |
| 97 | SUPV | Grupo Supervielle S.A. | NYSE | Argentina | C1 | Yes |
| 98 | TEO | Telecom Argentina S.A. | NYSE | Argentina | C1 | Yes |
| 99 | TEVA | Teva Pharmaceutical Industries | NYSE | Israel | C1 | Yes |
| 100 | TIMB | TIM S.A. | NYSE | Brazil | C1 | Yes |
| 101 | TM | Toyota Motor Corporation | NYSE | Japan | C1 | Yes |
| 102 | TTE | TotalEnergies SE | NYSE | France | C1 | Yes |
| 103 | TTM | Tata Motors Limited | NYSE | India | C1 | Yes |
| 104 | TV | Grupo Televisa S.A.B. | NYSE | Mexico | C1 | Yes |
| 105 | TX | Ternium S.A. | NYSE | Luxembourg | C1 | Yes |
| 106 | UBS | UBS Group AG | NYSE | Switzerland | C1 | Yes |
| 107 | UL | Unilever PLC | NYSE | UK | C1 | Yes |
| 108 | UMC | United Microelectronics Corporation | NYSE | Taiwan | C1 | Yes |
| 109 | VALE | Vale S.A. | NYSE | Brazil | C3 | Yes (duplicate) |
| 110 | VALE | Vale S.A. | NYSE | Brazil | C3 | Yes (duplicate) |
| 111 | VEDL | Vedanta Limited | NYSE | India | C1 | Yes |
| 112 | VLKAF | Volkswagen AG | OTC | Germany | C2 | Uncertain |
| 113 | WBK | Westpac Banking Corporation | NYSE | Australia | C1 | Yes |
| 114 | WIT | Wipro Limited | NYSE | India | C1 | Yes |
| 115 | WIX | Wix.com Ltd. | NASDAQ | Israel | C1 | Yes |
| 116 | WNS | WNS Holdings Limited | NYSE | India | C1 | Yes |
| 117 | YPF | YPF Sociedad Anónima | NYSE | Argentina | C1 | Yes |
| 118 | YUMC | Yum China Holdings Inc. | NYSE | China | C1 | Yes (10-K, US-incorporated) |
| 119 | ZURN | Zurich Insurance Group AG | OTC | Switzerland | C2 | Uncertain |

**Important notes on Category C:**
- **CS (Credit Suisse):** Acquired by UBS in 2023; no longer files independently. SEC path will fail.
- **CHL (China Mobile):** Delisted from NYSE in 2021 per US executive order. SEC path may fail.
- **RIO, VALE, SNE/SONY:** Appear as duplicates in `companyDatabase.ts` — the baseline should deduplicate.
- **GOLD (Barrick Gold):** Canadian company that files 40-F (not 20-F). The `fetch_sec_filing` Edge Function only checks 10-K and 20-F — it will fail for GOLD.
- **INDY (India Fund):** A closed-end fund, files 10-K. SEC path should succeed but geographic parsing will be irrelevant.
- **YUMC (Yum China):** Despite being a China-focused company, it is incorporated in the US and files 10-K.

### 1.5 Category D — NOT SEC-eligible (foreign-listed only): 79 Companies

These companies are listed exclusively on foreign exchanges and have no SEC filing obligation. They will **always** produce GF-fallback outputs. Running the SEC path for these companies is pointless.

| Exchange | Count | Tickers |
|----------|-------|---------|
| TSX (Canada) | 34 | ARX.TO, BCE.TO, BIR.TO, BMO.TO, BNS.TO, BTE.TO, CM.TO, CNQ.TO, CNR.TO, CP.TO, CPG.TO, CVE.TO, ENB.TO, ERF.TO, IMO.TO, KEL.TO, MEG.TO, MFC.TO, NVA.TO, OVV.TO, POU.TO, PXT.TO, RY.TO, SGY.TO, SHOP.TO, SLF.TO, SU.TO, T.TO, TD.TO, TOU.TO, TRP.TO, TVE.TO, VET.TO, WCP.TO |
| HKEX (Hong Kong) | 8 | 0001.HK, 0002.HK, 0005.HK, 0388.HK, 0700.HK, 0941.HK, 1299.HK, 9988.HK |
| LSE (London) | 10 | AZN.L, BARC.L, BP.L, DGE.L, GSK.L, HSBA.L, LLOY.L, SHEL.L, ULVR.L, VOD.L |
| JSE (Johannesburg) | 7 | AGL.JO, FSR.JO, MTN.JO, NPN.JO, SBK.JO, SHP.JO, SOL.JO |
| B3 (Brazil) | 6 | ABEV3.SA, B3SA3.SA, BBDC4.SA, ITUB4.SA, PETR4.SA, VALE3.SA |
| SGX (Singapore) | 5 | C52.SI, D05.SI, O39.SI, U11.SI, Z74.SI |
| TWSE (Taiwan) | 5 | 2317.TW, 2330.TW, 2454.TW, 2881.TW, 2882.TW |
| BVC (Colombia) | 4 | BANCOLOMBIA.CO, CIB.CO, ECOPETROL.CO, GRUPOSURA.CO |

**Note on SHOP.TO (Shopify):** Shopify is listed on both TSX and NYSE. However, `companyDatabase.ts` lists it as `SHOP.TO` (TSX). The US-listed version is `SHOP` (NYSE). If the baseline is run against `SHOP.TO`, it will fail. If the user adds `SHOP` as a separate entry, it would be Category B.

### 1.6 Universe Summary

| Category | Count | Description | SEC Path |
|----------|-------|-------------|---------|
| A | 41 | Guaranteed (hardcoded CIK) | Always enters |
| B | 14 | Potentially (US-listed, no CIK) | Very likely enters |
| C1 | ~60 | Likely (NYSE/NASDAQ ADR, 20-F filer) | Likely enters |
| C2 | ~25 | Uncertain (OTC ADR, may be Level 1) | Uncertain |
| C3 | ~34 | Dual-listed (ADR + foreign exchange) | Likely enters |
| D | 79 | Not eligible (foreign-listed only) | Never enters |
| **Total** | **253** | | |

---

## Section 2: What the Baseline Would Capture

### 2.1 The 6 Outcome Metrics Per Company

For each company processed in the baseline, the following 6 binary/categorical outcomes would be captured:

**Metric 1: `enteredSECPath` (boolean)**
- `true` if CIK was successfully resolved (either from hardcoded map or via `fetch_sec_cik` Edge Function)
- `false` if CIK resolution failed entirely
- **Diagnostic value:** Identifies which Category B and C companies have resolvable CIKs

**Metric 2: `retrievalSucceeded` (boolean)**
- `true` if the `fetch_sec_filing` Edge Function returned an HTML document with `htmlLength > 0`
- `false` if the Edge Function returned a 404, 500, or empty response
- **Diagnostic value:** Identifies which companies have accessible SEC filings (10-K or 20-F)

**Metric 3: `structuredParsingSucceeded` (boolean)**
- `true` if at least one table was identified by `isRevenueTable()`, `isPPETable()`, or `isDebtTable()` in `secFilingParser.ts`
- `false` if all tables were rejected by the keyword filters
- **Diagnostic value:** Identifies which filings have parseable structured geographic data

**Metric 4: `narrativeParsingSucceeded` (boolean)**
- `true` if `fetchSECFilingText()` + `parseNarrativeText()` returned at least one geographic extraction with confidence ≥ 'medium'
- `false` if narrative parsing returned empty results
- **Diagnostic value:** Identifies which companies produce geographic data from narrative sections

**Metric 5: `channelTiers` (object)**
```typescript
{
  revenue: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  supply: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  assets: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  financial: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
}
```
- **DIRECT:** SEC filing provided explicit percentage or dollar amount for this country/channel
- **ALLOCATED:** SEC filing provided regional data that was allocated to countries
- **MODELED:** Channel prior model was used with SEC data as a constraint
- **FALLBACK:** Global Fallback (GF) prior was used — no SEC evidence
- **Diagnostic value:** The most granular quality indicator per company per channel

**Metric 6: `materiallySpecific` (boolean)**
- `true` if at least 2 of 4 channels have evidence tier DIRECT or ALLOCATED
- `false` (fallback-dominant) if 3 or 4 channels are MODELED or FALLBACK
- **Diagnostic value:** Single summary indicator of output quality

### 2.2 Extended Data Structure for Baseline Results

```typescript
interface BaselineResult {
  // Identity
  ticker: string;
  companyName: string;
  exchange: string;
  sector: string;
  isADR: boolean;
  category: 'A' | 'B' | 'C1' | 'C2' | 'C3' | 'D';
  
  // The 6 core metrics
  enteredSECPath: boolean;
  retrievalSucceeded: boolean;
  structuredParsingSucceeded: boolean;
  narrativeParsingSucceeded: boolean;
  channelTiers: {
    revenue: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
    supply: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
    assets: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
    financial: 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK';
  };
  materiallySpecific: boolean;
  
  // Supplementary diagnostics
  cik: string | null;                    // Resolved CIK (null if failed)
  filingType: '10-K' | '20-F' | '40-F' | null;  // Actual filing type found
  filingDate: string | null;             // Date of the filing used
  htmlLength: number | null;             // Size of HTML document in characters
  tablesFound: number;                   // Total tables in HTML
  tablesPassedFilter: number;            // Tables that passed isRevenueTable/isPPETable/isDebtTable
  narrativeExtractionsFound: number;     // Number of geographic extractions from narrative
  cogriScore: number | null;             // Final CO-GRI score produced
  scoreUncertainty: number | null;       // ±X points uncertainty
  executionPath: string;                 // e.g., 'live-edgar', 'gf-fallback', 'tier1-static'
  failureReason: string | null;          // If any step failed, why
  processingTimeMs: number;              // Total time to process this company
  timestamp: string;                     // ISO timestamp of when baseline was run
}
```

### 2.3 Definition of "Materially Specific" vs "Fallback-Dominant"

**Materially Specific** (output is genuinely company-specific):
- At least 2 of 4 channels have tier DIRECT or ALLOCATED
- OR: Revenue channel has DIRECT tier (revenue is the highest-weight channel at 40%)
- The CO-GRI score reflects actual company data, not just sector/country priors

**Fallback-Dominant** (output is primarily generic):
- 3 or 4 channels have tier MODELED or FALLBACK
- The CO-GRI score is essentially a sector/country average with minimal company-specific signal
- The score would be nearly identical for any company in the same sector from the same country

**Borderline** (partial company-specific):
- Exactly 2 channels have DIRECT/ALLOCATED, 2 have MODELED/FALLBACK
- The score has some company-specific signal but is not fully differentiated

**Expected distribution based on architecture analysis:**
- Category A (10-K filers, US domestic): ~70–80% materially specific
- Category A (20-F filers, Chinese ADRs): ~30–50% materially specific
- Category B: ~65–75% materially specific (similar to Cat A US domestics)
- Category C1 (NYSE ADRs): ~40–60% materially specific
- Category C2 (OTC ADRs): ~10–30% materially specific

---

## Section 3: Technical Feasibility

### 3.1 API Rate Limits and Constraints

#### SEC EDGAR Rate Limits

| Parameter | Value | Source |
|-----------|-------|--------|
| Official rate limit | 10 requests/second per IP | SEC EDGAR Fair Access Policy |
| Recommended rate | ≤ 1 request/second | SEC recommendation for automated access |
| Required User-Agent | Must include company name and email | SEC policy (already implemented: `'CedarOwl Research contact@cedarowl.com'`) |
| Calls per company (Cat A) | 2: `CIK{cik}.json` + filing HTML | `fetch_sec_filing` Edge Function |
| Calls per company (Cat B/C) | 3: EDGAR search + `CIK{cik}.json` + filing HTML | `fetch_sec_cik` + `fetch_sec_filing` |
| Total EDGAR calls — Cat A (41) | ~82 | 2 per company |
| Total EDGAR calls — Cat A+B (55) | ~123 | 2–3 per company |
| Total EDGAR calls — Cat A+B+C (174) | ~400–500 | 2–3 per company |
| Time at 1 req/sec — Cat A | ~82 seconds | Sequential |
| Time at 1 req/sec — Cat A+B | ~123 seconds | Sequential |
| Risk of blocking at 1 req/sec | **Very Low** | Well within 10/sec limit |

**Critical note:** The `fetch_sec_filing` Edge Function makes 2 EDGAR calls internally (submissions JSON + filing HTML). These calls originate from Supabase's IP, not the user's browser. This means the rate limit applies to Supabase's IP, which is shared across all Supabase users. However, since the baseline would run sequentially with delays, this is not a concern.

#### Supabase Edge Function Invocation Limits

| Parameter | Value |
|-----------|-------|
| Free tier invocations/month | 500,000 |
| Pro tier invocations/month | 2,000,000 |
| Invocations per company (Cat A) | 2 (`fetch_sec_cik` skipped for Cat A, `fetch_sec_filing` × 1, possibly `extract_geographic_narrative` × 1) |
| Invocations per company (Cat B/C) | 3 (`fetch_sec_cik` × 1 + `fetch_sec_filing` × 1 + `extract_geographic_narrative` × 1) |
| Total invocations — Cat A (41) | ~82 |
| Total invocations — Cat A+B (55) | ~110 |
| Total invocations — Cat A+B+C (174) | ~348–520 |
| Monthly budget impact (free tier) | **0.016%–0.1%** of 500,000 limit |
| **Cost risk** | **Negligible** |

**Note:** The `extract_geographic_narrative` Edge Function calls OpenAI GPT-4. Each invocation costs approximately $0.01–0.05 in OpenAI API credits depending on text length. For 174 companies, this is ~$1.74–$8.70 in OpenAI costs. This is the only non-trivial cost item.

#### Other APIs — NOT Required for Baseline

The following APIs are used for **unknown ticker resolution** only and are NOT needed for the SEC-eligible baseline:
- Alpha Vantage (hardcoded 'demo' key — severely rate-limited)
- Marketstack (hardcoded key in `tickerResolution.ts`)
- Polygon.io (API key required)
- Yahoo Finance (unofficial API)

For the baseline, all companies are already in `companyDatabase.ts` with known exchange/sector/country. No ticker resolution is needed.

### 3.2 Processing Time Estimates

#### Per-Company Time Breakdown

| Step | Cat A (hardcoded CIK) | Cat B/C (CIK via Edge Function) |
|------|----------------------|--------------------------------|
| CIK resolution | ~0ms (hardcoded) | ~1,500ms (Edge Function → EDGAR search) |
| `fetch_sec_filing` invocation | ~3,000–8,000ms | ~3,000–8,000ms |
| HTML parsing (cheerio) | ~500–2,000ms | ~500–2,000ms |
| `extract_geographic_narrative` | ~2,000–5,000ms | ~2,000–5,000ms |
| Result aggregation | ~100ms | ~100ms |
| **Total per company** | **~5,600–15,100ms** | **~7,100–16,600ms** |
| **Average estimate** | **~8,000ms (8s)** | **~10,000ms (10s)** |

#### Total Processing Time

| Scope | Companies | Sequential | 5 Concurrent | 10 Concurrent |
|-------|-----------|------------|--------------|---------------|
| Cat A only | 41 | ~5.5 min | ~1.1 min | ~0.6 min |
| Cat A + B | 55 | ~7.3 min | ~1.5 min | ~0.7 min |
| Cat A + B + C1 | ~115 | ~15.3 min | ~3.1 min | ~1.5 min |
| Cat A + B + C (full) | 174 | ~23.2 min | ~4.6 min | ~2.3 min |

**Recommendation:** Run sequentially with a 1-second delay between companies. This is the safest approach and still completes Cat A in under 10 minutes.

### 3.3 Infrastructure Options (Where to Run)

#### Option A: Browser (Client-Side) — NOT RECOMMENDED for Full Baseline

**How it would work:** The dashboard's "Get Started" page could include a "Run Baseline" button that iterates through all SEC-eligible tickers and calls `getCompanyGeographicExposure()` for each.

| Aspect | Assessment |
|--------|-----------|
| CORS | ✅ No issue — Supabase Edge Functions have `Access-Control-Allow-Origin: *` |
| Memory | ⚠️ Risk — 174 companies × 5MB HTML = ~870MB in memory |
| Persistence | ❌ No — results lost on page refresh |
| Timeout | ❌ Risk — browser tabs can be killed, no background execution |
| Progress tracking | ⚠️ Possible but fragile |
| Output storage | ❌ No file system access |
| **Verdict** | **Suitable for pilot (5–10 companies) only** |

#### Option B: Node.js Script — RECOMMENDED for Full Baseline

**How it would work:** A new script `src/scripts/runSECBaseline.ts` following the exact same pattern as `src/scripts/updateCompanyDatabase.ts`. Uses `https` module for direct EDGAR calls, calls Supabase Edge Functions via `fetch`.

| Aspect | Assessment |
|--------|-----------|
| Infrastructure exists | ✅ Yes — `updateCompanyDatabase.ts` pattern established |
| GitHub Actions support | ✅ Yes — existing workflow infrastructure |
| Persistent output | ✅ Yes — writes JSON/CSV to `docs/baseline-results/` |
| Memory | ✅ No issue — Node.js can handle large files |
| Timeout | ✅ No issue — runs to completion |
| Rate limiting | ✅ Easy to implement with `setTimeout` |
| Checkpointing | ✅ Easy — save after each company |
| **Verdict** | **Best option — use this** |

#### Option C: Supabase Edge Function — NOT RECOMMENDED for Full Baseline

| Aspect | Assessment |
|--------|-----------|
| Execution time limit | ❌ 50 seconds max — cannot process 41+ companies |
| Suitable for | Single-company on-demand processing only |
| **Verdict** | **Not suitable for batch baseline** |

#### Option D: GitHub Actions — RECOMMENDED as Execution Environment for Option B

| Aspect | Assessment |
|--------|-----------|
| Infrastructure exists | ✅ Yes — `update-company-database.yml` pattern |
| Execution time | ✅ 6-hour max job timeout |
| Persistent output | ✅ Can commit results to repo |
| Scheduled runs | ✅ Can run weekly/monthly |
| Manual trigger | ✅ `workflow_dispatch` already configured |
| **Verdict** | **Best execution environment for the Node.js script** |

### 3.4 Existing Infrastructure That Can Be Reused

| Component | File | Reusable For Baseline |
|-----------|------|----------------------|
| Node.js script pattern | `src/scripts/updateCompanyDatabase.ts` | ✅ Script structure, CLI flags, `httpsGet()` |
| GitHub Actions workflow | `.github/workflows/update-company-database.yml` | ✅ Job structure, Node.js setup, commit/push |
| CIK map | `src/services/secFilingParser.ts` `TICKER_TO_CIK_MAP` | ✅ Direct import |
| Company database | `src/utils/companyDatabase.ts` | ✅ Direct import for ticker list |
| `fetch_sec_cik` Edge Function | `supabase/functions/fetch_sec_cik/index.ts` | ✅ Already deployed |
| `fetch_sec_filing` Edge Function | `supabase/functions/fetch_sec_filing/index.ts` | ✅ Already deployed |
| `extract_geographic_narrative` Edge Function | `supabase/functions/extract_geographic_narrative/index.ts` | ✅ Already deployed |
| SEC filing parser | `src/services/secFilingParser.ts` | ✅ Can be called from Node.js |
| Structured data integrator | `src/services/v5/structuredDataIntegratorV5.ts` | ✅ Can be called from Node.js |
| Evidence tier logic | `src/services/v5/structuredDataIntegratorV5.ts` | ✅ DIRECT/ALLOCATED/MODELED/FALLBACK constants |

### 3.5 New Infrastructure Needed

| Component | Description | Effort |
|-----------|-------------|--------|
| `src/scripts/runSECBaseline.ts` | Main baseline script | Medium (2–4 hours) |
| `.github/workflows/run-sec-baseline.yml` | GitHub Actions workflow | Low (30 min) |
| `docs/baseline-results/` directory | Output storage | Trivial |
| Baseline result JSON schema | TypeScript interface `BaselineResult` | Low (30 min) |
| Progress/checkpoint logic | Save after each company, resume on failure | Low (1 hour) |
| Summary report generator | Aggregate results into markdown table | Low (1 hour) |

**Total new development effort: ~5–8 hours**

---

## Section 4: Risk Assessment

### 4.1 Technical Risks

| Risk | Probability | Impact | Severity |
|------|-------------|--------|---------|
| SEC EDGAR IP blocking | **Very Low** — at 1 req/sec, well within 10/sec limit | Medium | Low |
| Supabase Edge Function timeout (50s) | **Low** — individual company calls take 5–15s | Medium | Low |
| Large HTML files causing memory issues | **Low** — Node.js handles 5MB files easily | Low | Very Low |
| Parsing failures for unusual HTML | **Medium** — some filings use XBRL/iXBRL formats | Medium | Medium |
| CIK mismatch (ticker ≠ EDGAR record) | **Low** for Cat A, **Medium** for Cat B/C | Medium | Medium |
| Network timeout during filing fetch | **Low** — EDGAR is generally reliable | Medium | Low |
| Concurrent execution causing race conditions | **N/A** — sequential execution recommended | N/A | N/A |

### 4.2 API/Cost Risks

| Risk | Probability | Impact | Severity |
|------|-------------|--------|---------|
| Supabase invocation limit exceeded | **Very Low** — 348 invocations vs 500,000 limit | Low | Very Low |
| OpenAI API cost overrun | **Low** — ~$1.74–$8.70 for full baseline | Low | Very Low |
| FMP API key needed | **N/A** — not needed for SEC baseline | N/A | N/A |
| Alpha Vantage 'demo' key rate limit | **N/A** — not needed for SEC baseline | N/A | N/A |

### 4.3 Data Quality Risks

| Risk | Probability | Impact | Severity |
|------|-------------|--------|---------|
| Stale data (10-K up to 12 months old) | **Certain** — all 10-K data is annual | Low (by design) | Acceptable |
| CS (Credit Suisse) filing not found | **High** — acquired by UBS in 2023 | Low (expected failure) | Acceptable |
| CHL (China Mobile) filing not found | **High** — delisted from NYSE 2021 | Low (expected failure) | Acceptable |
| 20-F parsing quality lower than 10-K | **High** — 20-F structure differs from 10-K | Medium | Medium |
| OTC ADRs (Cat C2) not filing 20-F | **Medium** — Level 1 ADRs exempt | Medium | Medium |
| `isRevenueTable()` over-filtering | **Medium** — exclusion patterns may reject valid tables | High | High |
| Narrative LLM extraction hallucination | **Low** — GPT-4 with strict prompt | Medium | Medium |

### 4.4 Mitigations

| Risk | Mitigation |
|------|-----------|
| EDGAR rate limiting | 1-second delay between companies; respect `Retry-After` headers |
| Parsing failures | Log all failures with HTML snippet; flag as `structuredParsingSucceeded: false` |
| CIK mismatches | Log mismatch; mark `enteredSECPath: false`; continue to next company |
| CS/CHL expected failures | Pre-mark as known failures in baseline config |
| 20-F parsing quality | Separate quality metrics for 10-K vs 20-F filers |
| Over-filtering by `isRevenueTable()` | Log number of tables found vs tables passed filter |
| Script failure mid-run | Checkpoint after each company; resume from last checkpoint |
| Memory issues | Process one company at a time; garbage collect between companies |
| OpenAI cost | Cap narrative extraction at 10,000 tokens per company |

---

## Section 5: Recommended Approach

### 5.1 Recommended Execution Plan

**The recommended approach is a Node.js script (`src/scripts/runSECBaseline.ts`) triggered via GitHub Actions, running sequentially with 1-second delays, outputting results to `docs/baseline-results/`.**

**Script behavior:**
1. Load all companies from `companyDatabase.ts`
2. Filter to SEC-eligible categories (A, B, C1 by default; C2 optional)
3. For each company:
   a. Resolve CIK (hardcoded map first, then Edge Function)
   b. Fetch filing (10-K first, then 20-F)
   c. Parse structured tables
   d. Extract narrative data
   e. Determine evidence tiers per channel
   f. Compute `materiallySpecific` flag
   g. Save result to checkpoint file
   h. Wait 1 second
4. Generate summary report
5. Commit results to repo

**CLI flags (following `updateCompanyDatabase.ts` pattern):**
```bash
npm run sec-baseline                    # Full Cat A+B run
npm run sec-baseline -- --category A   # Cat A only (pilot)
npm run sec-baseline -- --category A,B # Cat A+B
npm run sec-baseline -- --category A,B,C1 # Full recommended scope
npm run sec-baseline -- --dry-run      # Test without API calls
npm run sec-baseline -- --ticker AAPL  # Single company test
npm run sec-baseline -- --resume       # Resume from last checkpoint
npm run sec-baseline -- --verbose      # Verbose logging
```

### 5.2 Phased Approach

#### Phase 1 — Pilot (Cat A only, 41 companies)
**Goal:** Validate the baseline script works correctly  
**Scope:** 41 companies with hardcoded CIKs  
**Duration:** ~10 minutes  
**Risk:** Very low  
**Expected outcome:** ~28–33 materially specific (70–80%), ~8–13 fallback-dominant  
**Key insight:** Establishes ground truth for the "known good" universe

#### Phase 2 — Full Recommended Scope (Cat A+B, 55 companies)
**Goal:** Complete the US domestic issuer baseline  
**Scope:** 41 Cat A + 14 Cat B  
**Duration:** ~14 minutes  
**Risk:** Low  
**Expected outcome:** ~38–44 materially specific (70–80%), ~11–17 fallback-dominant  
**Key insight:** Confirms Cat B CIK resolution success rate

#### Phase 3 — High-Confidence ADRs (Cat A+B+C1, ~115 companies)
**Goal:** Extend to major NYSE-listed ADRs  
**Scope:** 55 from Phase 2 + ~60 Cat C1 ADRs  
**Duration:** ~25 minutes  
**Risk:** Medium (20-F parsing quality unknown)  
**Expected outcome:** ~55–75 materially specific overall  
**Key insight:** Reveals 20-F parsing quality vs 10-K

#### Phase 4 — Full Universe (Cat A+B+C, 174 companies)
**Goal:** Complete baseline including OTC ADRs  
**Scope:** All 174 SEC-eligible companies  
**Duration:** ~35 minutes  
**Risk:** Medium-High (OTC ADR CIK resolution uncertain)  
**Expected outcome:** ~65–95 materially specific  
**Key insight:** Full picture of platform quality

### 5.3 Expected Outcomes

Based on architecture analysis, the expected baseline results are:

**Category A — US domestic 10-K filers (33 companies):**
- `enteredSECPath: true` → ~100% (hardcoded CIKs)
- `retrievalSucceeded: true` → ~95% (EDGAR occasionally unavailable)
- `structuredParsingSucceeded: true` → ~60–70% (keyword filter may miss some)
- `narrativeParsingSucceeded: true` → ~75–85%
- `materiallySpecific: true` → ~70–80%

**Category A — Chinese ADR 20-F filers (8 companies: BABA, BIDU, JD, LI, NIO, PDD, TSM, XPEV):**
- `enteredSECPath: true` → ~100% (hardcoded CIKs)
- `retrievalSucceeded: true` → ~75–85% (some may have unusual 20-F structure)
- `structuredParsingSucceeded: true` → ~30–50% (20-F tables differ from 10-K)
- `narrativeParsingSucceeded: true` → ~50–70%
- `materiallySpecific: true` → ~30–50%

**Category B — US domestic 10-K filers (14 companies):**
- `enteredSECPath: true` → ~100% (all major US companies in EDGAR)
- `retrievalSucceeded: true` → ~95%
- `structuredParsingSucceeded: true` → ~60–70%
- `materiallySpecific: true` → ~65–75%

**Category C1 — NYSE ADR 20-F filers (~60 companies):**
- `enteredSECPath: true` → ~80–90%
- `retrievalSucceeded: true` → ~70–80%
- `structuredParsingSucceeded: true` → ~30–50%
- `materiallySpecific: true` → ~40–60%

### 5.4 What the Results Would Tell Us

The baseline would answer the following critical questions that currently have only architectural estimates:

1. **"How many of our 253 companies actually produce company-specific CO-GRI scores?"**  
   Current answer: "We estimate 70–80% of Cat A US domestics"  
   After baseline: "Exactly X of 55 Cat A+B companies are materially specific"

2. **"Is our SEC parsing working correctly for 10-K filings?"**  
   Current answer: "We believe isRevenueTable() works for most filings"  
   After baseline: "isRevenueTable() succeeds for X% of 10-K filings; fails for Y% due to [specific reason]"

3. **"Are our 20-F parsers working for Chinese ADRs?"**  
   Current answer: "20-F parsing is attempted but success rate unknown"  
   After baseline: "20-F parsing succeeds for X of 8 Chinese ADRs; fails for Y due to [specific reason]"

4. **"Which channels are most often falling back to GF?"**  
   Current answer: "Supply and financial channels likely fall back more often"  
   After baseline: "Revenue channel: X% DIRECT, Y% ALLOCATED, Z% FALLBACK; Supply channel: ..."

5. **"Is the `extract_geographic_narrative` Edge Function adding value?"**  
   Current answer: "We believe it adds value for companies where structured parsing fails"  
   After baseline: "Narrative parsing rescued X companies that structured parsing missed"

6. **"Which specific companies are producing meaningless GF-only outputs?"**  
   Current answer: "We estimate ~77 companies are GF-only"  
   After baseline: "Exactly these X companies are GF-dominant: [list]"

7. **"Are there any unexpected failures in the pipeline?"**  
   Current answer: "Unknown"  
   After baseline: "The following unexpected failures were found: [list with root causes]"

---

## Section 6: Complete SEC-Eligible Company List

### 6.1 Category A — 41 Companies (Guaranteed SEC-eligible)

| Ticker | Company Name | Exchange | Sector | ADR | Filing | CIK | Tier 1 |
|--------|-------------|----------|--------|-----|--------|-----|--------|
| AAPL | Apple Inc. | NASDAQ | Technology | No | 10-K | 0000320193 | ✅ |
| ABT | Abbott Laboratories | NYSE | Healthcare | No | 10-K | 0000001800 | No |
| ADBE | Adobe Inc. | NASDAQ | Technology | No | 10-K | 0000796343 | No |
| AMD | Advanced Micro Devices | NASDAQ | Technology | No | 10-K | 0000002488 | No |
| AMZN | Amazon.com Inc. | NASDAQ | Technology | No | 10-K | 0001018724 | No |
| BABA | Alibaba Group | NYSE | Technology | Yes | 20-F | 0001577552 | No |
| BAC | Bank of America | NYSE | Financial Services | No | 10-K | 0000070858 | No |
| BIDU | Baidu Inc. | NASDAQ | Technology | Yes | 20-F | 0001329099 | No |
| CRM | Salesforce Inc. | NYSE | Technology | No | 10-K | 0001108524 | No |
| CSCO | Cisco Systems | NASDAQ | Technology | No | 10-K | 0000858877 | No |
| DIS | Walt Disney Company | NYSE | Consumer Cyclical | No | 10-K | 0001744489 | No |
| GOOGL | Alphabet Inc. | NASDAQ | Technology | No | 10-K | 0001652044 | No |
| HD | Home Depot Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000354950 | No |
| IBM | IBM | NYSE | Technology | No | 10-K | 0000051143 | No |
| INTC | Intel Corporation | NASDAQ | Technology | No | 10-K | 0000050863 | No |
| JD | JD.com Inc. | NASDAQ | Technology | Yes | 20-F | 0001549802 | No |
| JNJ | Johnson & Johnson | NYSE | Healthcare | No | 10-K | 0000200406 | No |
| JPM | JPMorgan Chase | NYSE | Financial Services | No | 10-K | 0000019617 | No |
| KO | Coca-Cola Company | NYSE | Consumer Cyclical | No | 10-K | 0000021344 | No |
| LI | Li Auto Inc. | NASDAQ | Automotive | Yes | 20-F | 0001791706 | No |
| MA | Mastercard | NYSE | Financial Services | No | 10-K | 0001141391 | No |
| META | Meta Platforms | NASDAQ | Technology | No | 10-K | 0001326801 | No |
| MRK | Merck & Co. | NYSE | Healthcare | No | 10-K | 0000310158 | No |
| MSFT | Microsoft Corporation | NASDAQ | Technology | No | 10-K | 0000789019 | ✅ |
| NFLX | Netflix Inc. | NASDAQ | Technology | No | 10-K | 0001065280 | No |
| NIO | NIO Inc. | NYSE | Automotive | Yes | 20-F | 0001736541 | No |
| NKE | Nike Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000320187 | No |
| NVDA | NVIDIA Corporation | NASDAQ | Technology | No | 10-K | 0001045810 | No |
| ORCL | Oracle Corporation | NYSE | Technology | No | 10-K | 0001341439 | No |
| PDD | PDD Holdings Inc. | NASDAQ | Technology | Yes | 20-F | 0001737806 | No |
| PEP | PepsiCo Inc. | NASDAQ | Consumer Cyclical | No | 10-K | 0000077476 | No |
| PFE | Pfizer Inc. | NYSE | Healthcare | No | 10-K | 0000078003 | No |
| PG | Procter & Gamble | NYSE | Consumer Cyclical | No | 10-K | 0000080424 | No |
| TSLA | Tesla Inc. | NASDAQ | Automotive | No | 10-K | 0001318605 | ✅ |
| TSM | Taiwan Semiconductor | NYSE | Technology | Yes | 20-F | 0001046179 | No |
| UNH | UnitedHealth Group | NYSE | Healthcare | No | 10-K | 0000731766 | No |
| V | Visa Inc. | NYSE | Financial Services | No | 10-K | 0001403161 | No |
| VZ | Verizon Communications | NYSE | Communication Services | No | 10-K | 0000732712 | No |
| WMT | Walmart Inc. | NYSE | Consumer Cyclical | No | 10-K | 0000104169 | No |
| XOM | Exxon Mobil | NYSE | Energy | No | 10-K | 0000034088 | No |
| XPEV | XPeng Inc. | NYSE | Automotive | Yes | 20-F | 0001840063 | No |

### 6.2 Category B — 14 Companies (US-listed, no hardcoded CIK)

| Ticker | Company Name | Exchange | Sector | Expected CIK Resolution |
|--------|-------------|----------|--------|------------------------|
| ABBV | AbbVie Inc. | NYSE | Healthcare | Very High |
| AXP | American Express | NYSE | Financial Services | Very High |
| BLK | BlackRock Inc. | NYSE | Financial Services | Very High |
| C | Citigroup Inc. | NYSE | Financial Services | Very High |
| COP | ConocoPhillips | NYSE | Energy | Very High |
| CVX | Chevron Corporation | NYSE | Energy | Very High |
| DHR | Danaher Corporation | NYSE | Healthcare | Very High |
| GS | Goldman Sachs | NYSE | Financial Services | Very High |
| LLY | Eli Lilly and Company | NYSE | Healthcare | Very High |
| MS | Morgan Stanley | NYSE | Financial Services | Very High |
| SBUX | Starbucks Corporation | NASDAQ | Consumer Cyclical | Very High |
| SLB | Schlumberger (SLB) | NYSE | Energy | High |
| TMO | Thermo Fisher Scientific | NYSE | Healthcare | Very High |
| WFC | Wells Fargo & Company | NYSE | Financial Services | Very High |

### 6.3 Category C — 119 Companies (ADR/20-F filers)

*(See Section 1.4 for complete table)*

**Priority sub-set for Phase 3 (highest-value ADRs to include):**

| Ticker | Company | Country | Why High Priority |
|--------|---------|---------|-----------------|
| ASML | ASML Holding | Netherlands | Largest non-US tech company |
| AZN | AstraZeneca | UK | Major pharma |
| BHP | BHP Group | Australia | Major mining |
| BP | BP plc | UK | Major energy |
| BTI | British American Tobacco | UK | Major consumer |
| CHKP | Check Point Software | Israel | Major tech |
| DEO | Diageo plc | UK | Major consumer |
| GSK | GSK plc | UK | Major pharma |
| HDB | HDFC Bank | India | Major EM bank |
| HMC | Honda Motor | Japan | Major auto |
| HSBC | HSBC Holdings | UK | Major bank |
| IBN | ICICI Bank | India | Major EM bank |
| INFY | Infosys | India | Major IT services |
| ING | ING Groep | Netherlands | Major bank |
| ITUB | Itaú Unibanco | Brazil | Major EM bank |
| MFG | Mizuho Financial | Japan | Major bank |
| MNDY | Monday.com | Israel | Major tech |
| MUFG | Mitsubishi UFJ | Japan | Major bank |
| NICE | NICE Ltd. | Israel | Major tech |
| NMR | Nomura Holdings | Japan | Major bank |
| NVO | Novo Nordisk | Denmark | Major pharma |
| NVS | Novartis | Switzerland | Major pharma |
| PBR | Petrobras | Brazil | Major energy |
| PHG | Philips | Netherlands | Major healthcare |
| SAP | SAP SE | Germany | Major tech |
| SAN | Banco Santander | Spain | Major bank |
| SHEL | Shell plc | UK | Major energy |
| SMFG | Sumitomo Mitsui | Japan | Major bank |
| SONY | Sony Group | Japan | Major tech |
| SQM | SQM | Chile | Major materials |
| STLA | Stellantis | Netherlands | Major auto |
| TEVA | Teva Pharmaceutical | Israel | Major pharma |
| TM | Toyota Motor | Japan | Major auto |
| TTE | TotalEnergies | France | Major energy |
| UBS | UBS Group | Switzerland | Major bank |
| UL | Unilever | UK | Major consumer |
| VALE | Vale S.A. | Brazil | Major mining |
| WIX | Wix.com | Israel | Major tech |

### 6.4 Category D — 79 Companies (NOT SEC-eligible)

*(See Section 1.5 for complete table by exchange)*

These companies will always produce GF-fallback outputs and should be excluded from the baseline.

---

## Appendix A: Key Technical Findings from Code Audit

### A.1 Critical Finding: `fullNASDAQCompanyList.ts` Contains 33 Additional CIKs

The file `src/data/fullNASDAQCompanyList.ts` contains 33 companies with hardcoded CIKs that are **NOT in `TICKER_TO_CIK_MAP`** in `secFilingParser.ts`:

```
AMGN (0000318154), CRWD (0001535527), DDOG (0001561550), DOCU (0001261333),
GILD (0000882095), MRNA (0001682852), NET (0001477333), OKTA (0001660134),
PANW (0001327567), PATH (0001770915), PINS (0001506439), PLTR (0001321655),
RBLX (0001315098), ROKU (0001428439), SFIX (0001576942), SNAP (0001564408),
SNOW (0001640147), SPLK (0001353283), SPOT (0001639920), TEAM (0001650372),
U (0001810806), WDAY (0001327811), ZM (0001585521)
```

These 23 additional tickers (beyond the 10 already in both files) are **not in `companyDatabase.ts`** and therefore not searchable in the dashboard. However, they represent a significant expansion opportunity for the SEC-eligible universe.

### A.2 Critical Finding: No Caching Infrastructure Exists

There is no persistent caching of SEC filing results. Every time a user searches for a company, the full pipeline is re-executed. This means:
- The baseline results would be the first persistent record of pipeline outcomes
- Results should be stored in a database or file for future reference
- Repeated baseline runs would re-fetch all filings from EDGAR

### A.3 Critical Finding: `isRevenueTable()` Exclusion Patterns May Over-Filter

The exclusion patterns in `isRevenueTable()` include:
```typescript
'cost of sales', 'cost of revenue', 'selling and marketing', 'selling, general',
'research and development', 'operating expenses', 'operating income',
'iphone', 'ipad', 'mac', 'wearables', 'product category'
```

The last 5 patterns (`iphone`, `ipad`, `mac`, `wearables`, `product category`) are Apple-specific. However, since AAPL is Tier 1 (static data), this only affects non-Apple companies that happen to mention these terms in the same table. This is a low-risk issue.

More concerning: `'operating income'` is a very common term that appears in many geographic revenue tables alongside revenue figures. This may cause false negatives for companies that present operating income alongside geographic revenue in the same table.

### A.4 Critical Finding: `extract_geographic_narrative` Uses OpenAI GPT-4

The narrative extraction Edge Function uses OpenAI GPT-4 (not GPT-3.5). This is high quality but:
- Costs ~$0.01–0.05 per company
- Has a context window limit (the filing HTML is truncated before sending)
- The EDGAR search URL in `fetchSECFilingText()` uses `efts.sec.gov/LATEST/search-index` which may return different results than the `fetch_sec_filing` Edge Function

### A.5 Finding: Two Separate SEC Retrieval Paths Exist

There are **two separate code paths** for fetching SEC filings:
1. **`fetch_sec_filing` Edge Function** — used by `secFilingParser.ts` for structured table parsing
2. **`fetchSECFilingText()` in `narrativeParser.ts`** — uses EDGAR full-text search (`efts.sec.gov`) for narrative parsing

These two paths may retrieve different documents or different versions of the same filing. The baseline should track which path was used for each extraction.

---

## Appendix B: Recommended Baseline Output Format

```json
{
  "baselineRunId": "2026-04-19T14:00:00Z",
  "scope": "CategoryA+B",
  "totalCompanies": 55,
  "completedCompanies": 55,
  "failedCompanies": 2,
  "summary": {
    "enteredSECPath": 54,
    "retrievalSucceeded": 51,
    "structuredParsingSucceeded": 38,
    "narrativeParsingSucceeded": 44,
    "materiallySpecific": 42,
    "fallbackDominant": 13,
    "channelTierBreakdown": {
      "revenue": {"DIRECT": 28, "ALLOCATED": 14, "MODELED": 8, "FALLBACK": 5},
      "supply": {"DIRECT": 12, "ALLOCATED": 18, "MODELED": 15, "FALLBACK": 10},
      "assets": {"DIRECT": 8, "ALLOCATED": 16, "MODELED": 20, "FALLBACK": 11},
      "financial": {"DIRECT": 5, "ALLOCATED": 10, "MODELED": 22, "FALLBACK": 18}
    }
  },
  "results": [
    {
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "category": "A",
      "enteredSECPath": true,
      "retrievalSucceeded": true,
      "structuredParsingSucceeded": true,
      "narrativeParsingSucceeded": true,
      "channelTiers": {
        "revenue": "DIRECT",
        "supply": "DIRECT",
        "assets": "ALLOCATED",
        "financial": "MODELED"
      },
      "materiallySpecific": true,
      "cik": "0000320193",
      "filingType": "10-K",
      "filingDate": "2024-11-01",
      "htmlLength": 4823091,
      "tablesFound": 47,
      "tablesPassedFilter": 3,
      "narrativeExtractionsFound": 12,
      "cogriScore": 42.3,
      "scoreUncertainty": 3.1,
      "executionPath": "tier1-static",
      "failureReason": null,
      "processingTimeMs": 8234,
      "timestamp": "2026-04-19T14:00:08Z"
    }
  ]
}
```

---

*Report generated: 2026-04-19*  
*Auditor: David (Data Analyst, Atoms Team)*  
*Methodology: Read-only codebase audit — no source code modifications*  
*Files examined: `src/utils/companyDatabase.ts`, `src/services/secFilingParser.ts`, `src/services/geographicExposureService.ts`, `src/services/v5/structuredDataIntegratorV5.ts`, `src/services/narrativeParser.ts`, `src/services/EnterpriseAPIService.ts`, `supabase/functions/fetch_sec_cik/index.ts`, `supabase/functions/fetch_sec_filing/index.ts`, `supabase/functions/extract_geographic_narrative/index.ts`, `.github/workflows/update-company-database.yml`, `src/scripts/updateCompanyDatabase.ts`, `src/data/fullNASDAQCompanyList.ts`, `src/data/nasdaqCompanyDatabase.ts`, `package.json`*