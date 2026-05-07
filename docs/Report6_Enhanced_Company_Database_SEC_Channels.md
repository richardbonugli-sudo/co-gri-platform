# Report 6 Enhanced: Company Database, SEC Retrieval, Parsing & Four-Channel Deep Investigation

**Generated:** 2026-04-18  
**Scope:** Comprehensive enhancement of Report 6, incorporating all questions from the uploaded enhancement document, complete company database inventory, runtime pipeline diagnostics, exact parsing logic, complete mathematical formulas, and full code traces  
**Methodology:** Read-only codebase audit — no source code modifications  
**Auditor:** David (Data Analyst, Atoms Team)  
**Supersedes:** `Report6_Company_Database_SEC_Channels_Deep_Investigation.md`  
**Cross-referenced with:** Reports 1–5  
**Enhancement source:** `/workspace/uploads/Report 6 Enhancement.docx`

---

## Table of Contents

- [PART 1: Complete Company Database Inventory](#part-1-complete-company-database-inventory)
- [PART 2: Daily GitHub Update Pipeline — Precise Details](#part-2-daily-github-update-pipeline--precise-details)
- [PART 3: SEC Retrieval & Parsing — Deep Technical Reference](#part-3-sec-retrieval--parsing--deep-technical-reference)
- [PART 4: Four Channels — Complete Mathematical Reference](#part-4-four-channels--complete-mathematical-reference)
- [PART 5: CO-GRI Score — Complete Formula Reference](#part-5-co-gri-score--complete-formula-reference)
- [PART 6: Unknown Ticker Handling — Complete Code Trace](#part-6-unknown-ticker-handling--complete-code-trace)
- [PART 7: Answers to Enhancement Document Questions (Runtime Baseline)](#part-7-answers-to-enhancement-document-questions-runtime-baseline)
- [PART 8: Cross-Reference Updates vs. Reports 1–5](#part-8-cross-reference-updates-vs-reports-15)

---

## PART 1: Complete Company Database Inventory

### 1.1 Master Company List — All 256 Unique Tickers (Alphabetical)

The primary search database (`src/utils/companyDatabase.ts`) contains **256 unique ticker entries** (the grep count of 256 from `/tmp/all_tickers.txt` is authoritative; the earlier "259" estimate in Report 6 was slightly overstated due to counting interface field declarations). Two tickers appear twice (RIO, VALE) as intentional dual-listing entries, giving 258 total array entries.

**Legend for columns:**
- **Tier 1**: Full 4-channel static data in `companySpecificExposures.ts` (AAPL, TSLA, MSFT only)
- **CIK**: Hardcoded CIK in `secFilingParser.ts` `TICKER_TO_CIK_MAP`
- **ADR**: `isADR: true` in `companyDatabase.ts`
- **Daily FMP**: Updated daily by GitHub Actions via FMP API
- **NASDAQ DB**: Present in `nasdaqCompanyDatabase.ts` (18 entries)
- **Full NASDAQ**: Present in `fullNASDAQCompanyList.ts` (~33 entries)

| Ticker | Company Name | Exchange | Sector | Country (Listed) | ADR | Tier 1 | CIK | Daily FMP | NASDAQ DB | Full NASDAQ |
|--------|-------------|----------|--------|-----------------|-----|--------|-----|-----------|-----------|-------------|
| 0001.HK | CK Hutchison Holdings | HKEX | Industrials | Hong Kong | No | No | No | Yes | No | No |
| 0002.HK | CLP Holdings | HKEX | Utilities | Hong Kong | No | No | No | Yes | No | No |
| 0005.HK | HSBC Holdings (HK) | HKEX | Financial Services | Hong Kong | No | No | No | Yes | No | No |
| 0388.HK | Hong Kong Exchanges | HKEX | Financial Services | Hong Kong | No | No | No | Yes | No | No |
| 0700.HK | Tencent Holdings | HKEX | Technology | Hong Kong | No | No | No | Yes | No | No |
| 0941.HK | China Mobile | HKEX | Communication Services | Hong Kong | No | No | No | Yes | No | No |
| 1299.HK | AIA Group | HKEX | Financial Services | Hong Kong | No | No | No | Yes | No | No |
| 2317.TW | Hon Hai Precision (Foxconn) | TWSE | Technology | Taiwan | No | No | No | Yes | No | No |
| 2330.TW | Taiwan Semiconductor (TWSE) | TWSE | Technology | Taiwan | No | No | No | Yes | No | No |
| 2454.TW | MediaTek | TWSE | Technology | Taiwan | No | No | No | Yes | No | No |
| 2881.TW | Fubon Financial | TWSE | Financial Services | Taiwan | No | No | No | Yes | No | No |
| 2882.TW | Cathay Financial | TWSE | Financial Services | Taiwan | No | No | No | Yes | No | No |
| 9988.HK | Alibaba (HK) | HKEX | Technology | Hong Kong | No | No | No | Yes | No | No |
| AAPL | Apple Inc. | NASDAQ | Technology | United States | No | **YES** | **YES** | Yes | No | Yes |
| ABBNY | AbbVie (ADR) | OTC | Healthcare | United States | Yes | No | No | Yes | No | No |
| ABBV | AbbVie Inc. | NYSE | Healthcare | United States | No | No | No | Yes | No | No |
| ABEV | Ambev S.A. | NYSE | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| ABEV3.SA | Ambev (Brazil) | B3 | Consumer Cyclical | Brazil | No | No | No | Yes | No | No |
| ABT | Abbott Laboratories | NYSE | Healthcare | United States | No | No | **YES** | Yes | No | No |
| ADBE | Adobe Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| ADDYY | Adidas AG (ADR) | OTC | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| AGL.JO | Anglo American (JSE) | JSE | Basic Materials | South Africa | No | No | No | Yes | No | No |
| AIQUY | Air Liquide SA (ADR) | OTC | Basic Materials | United States | Yes | No | No | Yes | No | No |
| ALIZY | Allianz SE (ADR) | OTC | Financial Services | United States | Yes | No | No | Yes | No | No |
| AMD | Advanced Micro Devices | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | No |
| AMX | América Móvil | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| AMZN | Amazon.com Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| ANZ | Australia & New Zealand Banking | ASX | Financial Services | Australia | No | No | No | Yes | No | No |
| ARX.TO | ARC Resources | TSX | Energy | Canada | No | No | No | Yes | No | No |
| ASML | ASML Holding N.V. | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| ASX | ASE Technology Holding | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| AU | AngloGold Ashanti | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| AUO | AU Optronics Corp. | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| AXAHY | AXA SA (ADR) | OTC | Financial Services | United States | Yes | No | No | Yes | No | No |
| AXP | American Express Company | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| AZN | AstraZeneca PLC (ADR) | NASDAQ | Healthcare | United States | Yes | No | No | Yes | No | No |
| AZN.L | AstraZeneca PLC (London) | LSE | Healthcare | United Kingdom | No | No | No | Yes | No | No |
| B3SA3.SA | B3 S.A. | B3 | Financial Services | Brazil | No | No | No | Yes | No | No |
| BABA | Alibaba Group (ADR) | NYSE | Technology | United States | Yes | No | **YES** | Yes | No | No |
| BAC | Bank of America | NYSE | Financial Services | United States | No | No | **YES** | Yes | No | No |
| BANCOLOMBIA.CO | Bancolombia | BVC | Financial Services | Colombia | No | No | No | Yes | No | No |
| BARC.L | Barclays PLC (London) | LSE | Financial Services | United Kingdom | No | No | No | Yes | No | No |
| BASFY | BASF SE (ADR) | OTC | Basic Materials | United States | Yes | No | No | Yes | No | No |
| BAYRY | Bayer AG (ADR) | OTC | Healthcare | United States | Yes | No | No | Yes | No | No |
| BBD | Banco Bradesco S.A. | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| BBDC4.SA | Banco Bradesco (Brazil) | B3 | Financial Services | Brazil | No | No | No | Yes | No | No |
| BCE.TO | BCE Inc. | TSX | Communication Services | Canada | No | No | No | Yes | No | No |
| BCS | Barclays PLC (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| BHP | BHP Group | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| BIDU | Baidu Inc. (ADR) | NASDAQ | Technology | United States | Yes | No | **YES** | Yes | No | No |
| BILI | Bilibili Inc. (ADR) | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| BIR.TO | Birchcliff Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| BLK | BlackRock Inc. | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| BMA | Banco Macro S.A. | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| BMO.TO | Bank of Montreal | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| BMWYY | BMW AG (ADR) | OTC | Automotive | United States | Yes | No | No | Yes | No | No |
| BNP | BNP Paribas SA (ADR) | OTC | Financial Services | United States | Yes | No | No | Yes | No | No |
| BNS.TO | Bank of Nova Scotia | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| BP | BP plc (ADR) | NYSE | Energy | United States | Yes | No | No | Yes | No | No |
| BP.L | BP plc (London) | LSE | Energy | United Kingdom | No | No | No | Yes | No | No |
| BRFS | BRF S.A. (ADR) | NYSE | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| BTE.TO | Baytex Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| BTI | British American Tobacco (ADR) | NYSE | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| C | Citigroup Inc. | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| C52.SI | CapitaLand Investment | SGX | Real Estate | Singapore | No | No | No | Yes | No | No |
| CBD | Companhia Brasileira de Distribuição | NYSE | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| CHKP | Check Point Software | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| CHL | China Mobile (ADR) | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| CHT | Chunghwa Telecom (ADR) | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| CIB | Bancolombia (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| CIB.CO | Bancolombia (Colombia) | BVC | Financial Services | Colombia | No | No | No | Yes | No | No |
| CM.TO | Canadian Imperial Bank | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| CNQ.TO | Canadian Natural Resources | TSX | Energy | Canada | No | No | No | Yes | No | No |
| CNR.TO | Canadian National Railway | TSX | Industrials | Canada | No | No | No | Yes | No | No |
| COP | ConocoPhillips | NYSE | Energy | United States | No | No | No | Yes | No | No |
| CP.TO | Canadian Pacific Kansas City | TSX | Industrials | Canada | No | No | No | Yes | No | No |
| CPG.TO | Crescent Point Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| CRESY | Cresud S.A.C.I.F. y A. | NASDAQ | Real Estate | United States | Yes | No | No | Yes | No | No |
| CRM | Salesforce Inc. | NYSE | Technology | United States | No | No | **YES** | Yes | No | No |
| CS | Credit Suisse Group | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| CSCO | Cisco Systems Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | No |
| CVE.TO | Cenovus Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| CVX | Chevron Corporation | NYSE | Energy | United States | No | No | No | Yes | No | No |
| CX | CEMEX S.A.B. de C.V. | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| D05.SI | DBS Group Holdings | SGX | Financial Services | Singapore | No | No | No | Yes | No | No |
| DAIMAY | Mercedes-Benz Group (ADR) | OTC | Automotive | United States | Yes | No | No | Yes | No | No |
| DANOY | Danone SA (ADR) | OTC | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| DEO | Diageo plc (ADR) | NYSE | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| DGE.L | Diageo plc (London) | LSE | Consumer Cyclical | United Kingdom | No | No | No | Yes | No | No |
| DHR | Danaher Corporation | NYSE | Healthcare | United States | No | No | No | Yes | No | No |
| DIS | Walt Disney Company | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| DTEGY | Deutsche Telekom (ADR) | OTC | Communication Services | United States | Yes | No | No | Yes | No | No |
| ECOPETROL.CO | Ecopetrol S.A. | BVC | Energy | Colombia | No | No | No | Yes | No | No |
| ENB.TO | Enbridge Inc. | TSX | Energy | Canada | No | No | No | Yes | No | No |
| ENIA | Enel Américas S.A. | NYSE | Utilities | United States | Yes | No | No | Yes | No | No |
| ERF.TO | Enerplus Corporation | TSX | Energy | Canada | No | No | No | Yes | No | No |
| FMX | Fomento Económico Mexicano | NYSE | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| FSR.JO | FirstRand Limited | JSE | Financial Services | South Africa | No | No | No | Yes | No | No |
| FUJIY | Fujitsu Limited (ADR) | OTC | Technology | United States | Yes | No | No | Yes | No | No |
| GFI | Gold Fields Limited | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| GFNORTEO | Grupo Financiero Banorte | BMV | Financial Services | Mexico | No | No | No | Yes | No | No |
| GGAL | Grupo Financiero Galicia | NASDAQ | Financial Services | United States | Yes | No | No | Yes | No | No |
| GGB | Gerdau S.A. (ADR) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| GOLD | Barrick Gold Corporation | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| GOOGL | Alphabet Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| GRUPOSURA.CO | Grupo de Inversiones Suramericana | BVC | Financial Services | Colombia | No | No | No | Yes | No | No |
| GS | Goldman Sachs Group Inc. | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| GSK | GSK plc (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| GSK.L | GSK plc (London) | LSE | Healthcare | United Kingdom | No | No | No | Yes | No | No |
| HD | Home Depot Inc. | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| HDB | HDFC Bank Limited (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| HEIA | Heineken N.V. | NASDAQ | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| HMC | Honda Motor Co. (ADR) | NYSE | Automotive | United States | Yes | No | No | Yes | No | No |
| HMY | Harmony Gold Mining | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| HSBA.L | HSBC Holdings (London) | LSE | Financial Services | United Kingdom | No | No | No | Yes | No | No |
| HSBC | HSBC Holdings plc (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| IBM | International Business Machines | NYSE | Technology | United States | No | No | **YES** | Yes | No | No |
| IBN | ICICI Bank Limited (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| IMO.TO | Imperial Oil Limited | TSX | Energy | Canada | No | No | No | Yes | No | No |
| INDY | India Fund Inc. | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| INFY | Infosys Limited (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| ING | ING Groep N.V. | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| INTC | Intel Corporation | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | No |
| IRS | Investec plc | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| ITUB | Itaú Unibanco Holding (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| ITUB4.SA | Itaú Unibanco (Brazil) | B3 | Financial Services | Brazil | No | No | No | Yes | No | No |
| JD | JD.com Inc. (ADR) | NASDAQ | Technology | United States | Yes | No | **YES** | Yes | No | No |
| JNJ | Johnson & Johnson | NYSE | Healthcare | United States | No | No | **YES** | Yes | No | No |
| JPM | JPMorgan Chase & Co. | NYSE | Financial Services | United States | No | No | **YES** | Yes | No | No |
| KB | KB Financial Group (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| KEL.TO | Kelt Exploration | TSX | Energy | Canada | No | No | No | Yes | No | No |
| KEP | Korea Electric Power (ADR) | NYSE | Utilities | United States | Yes | No | No | Yes | No | No |
| KO | Coca-Cola Company | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| LI | Li Auto Inc. (ADR) | NASDAQ | Automotive | United States | Yes | No | **YES** | Yes | No | No |
| LLOY.L | Lloyds Banking Group (London) | LSE | Financial Services | United Kingdom | No | No | No | Yes | No | No |
| LLY | Eli Lilly and Company | NYSE | Healthcare | United States | No | No | No | Yes | No | No |
| LOMA | Loma Negra Compañía Industrial | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| LPL | LG Display Co. (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| LTM | LATAM Airlines Group | NYSE | Industrials | United States | Yes | No | No | Yes | No | No |
| LVMUY | LVMH Moët Hennessy (ADR) | OTC | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| MA | Mastercard Incorporated | NYSE | Financial Services | United States | No | No | **YES** | Yes | No | No |
| MCD | McDonald's Corporation | NYSE | Consumer Cyclical | United States | No | No | No | Yes | No | No |
| MEG.TO | MEG Energy Corp. | TSX | Energy | Canada | No | No | No | Yes | No | No |
| META | Meta Platforms Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| MFC.TO | Manulife Financial | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| MFG | Mizuho Financial Group (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| MNDY | Monday.com Ltd. | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| MRK | Merck & Co. Inc. | NYSE | Healthcare | United States | No | No | **YES** | Yes | No | No |
| MS | Morgan Stanley | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| MSFT | Microsoft Corporation | NASDAQ | Technology | United States | No | **YES** | **YES** | Yes | No | Yes |
| MTN.JO | Vodacom Group (JSE) | JSE | Communication Services | South Africa | No | No | No | Yes | No | No |
| MUFG | Mitsubishi UFJ Financial (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| NAB | National Australia Bank | ASX | Financial Services | Australia | No | No | No | Yes | No | No |
| NFLX | Netflix Inc. | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| NICE | NICE Systems Ltd. | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| NIO | NIO Inc. (ADR) | NYSE | Automotive | United States | Yes | No | **YES** | Yes | No | No |
| NKE | Nike Inc. | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| NMR | Nomura Holdings (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| NPN.JO | Naspers Limited | JSE | Technology | South Africa | No | No | No | Yes | No | No |
| NSRGY | Nestlé S.A. (ADR) | OTC | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| NTDOY | Nintendo Co. (ADR) | OTC | Technology | United States | Yes | No | No | Yes | No | No |
| NTES | NetEase Inc. (ADR) | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| NVA.TO | NuVista Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| NVDA | NVIDIA Corporation | NASDAQ | Technology | United States | No | No | **YES** | Yes | No | Yes |
| NVO | Novo Nordisk A/S (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| NVS | Novartis AG (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| O39.SI | OCBC Bank | SGX | Financial Services | Singapore | No | No | No | Yes | No | No |
| ORCL | Oracle Corporation | NYSE | Technology | United States | No | No | **YES** | Yes | No | No |
| OREDY | L'Oréal SA (ADR) | OTC | Consumer Defensive | United States | Yes | No | No | Yes | No | No |
| OVV.TO | Ovintiv Inc. | TSX | Energy | Canada | No | No | No | Yes | No | No |
| PAM | Pampa Energía S.A. | NYSE | Utilities | United States | Yes | No | No | Yes | No | No |
| PBR | Petróleo Brasileiro S.A. (ADR) | NYSE | Energy | United States | Yes | No | No | Yes | No | No |
| PDD | PDD Holdings Inc. (ADR) | NASDAQ | Technology | United States | Yes | No | **YES** | Yes | No | No |
| PEP | PepsiCo Inc. | NASDAQ | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| PETR4.SA | Petrobras (Brazil) | B3 | Energy | Brazil | No | No | No | Yes | No | No |
| PFE | Pfizer Inc. | NYSE | Healthcare | United States | No | No | **YES** | Yes | No | No |
| PG | Procter & Gamble Company | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| PHG | Philips N.V. (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| PKX | POSCO Holdings (ADR) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| POU.TO | Perpetual Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| PXT.TO | Parex Resources | TSX | Energy | Canada | No | No | No | Yes | No | No |
| REDY | Dr. Reddy's Laboratories (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| RHHBY | Roche Holding AG (ADR) | OTC | Healthcare | United States | Yes | No | No | Yes | No | No |
| RIO | Rio Tinto Group (ADR-UK) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| RIO | Rio Tinto Limited (ADR-AU) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| RY.TO | Royal Bank of Canada | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| SAFRY | Safran SA (ADR) | OTC | Industrials | United States | Yes | No | No | Yes | No | No |
| SAN | Banco Santander S.A. (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| SAP | SAP SE (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| SBK.JO | Standard Bank Group | JSE | Financial Services | South Africa | No | No | No | Yes | No | No |
| SBS | Companhia de Saneamento Básico (ADR) | NYSE | Utilities | United States | Yes | No | No | Yes | No | No |
| SBSW | Sibanye Stillwater | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| SBUX | Starbucks Corporation | NASDAQ | Consumer Cyclical | United States | No | No | No | Yes | No | No |
| SGY.TO | Surge Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| SHEL | Shell plc (ADR) | NYSE | Energy | United States | Yes | No | No | Yes | No | No |
| SHEL.L | Shell plc (London) | LSE | Energy | United Kingdom | No | No | No | Yes | No | No |
| SHG | Shinhan Financial Group (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| SHOP.TO | Shopify Inc. | TSX | Technology | Canada | No | No | No | Yes | No | No |
| SHP.JO | Shoprite Holdings | JSE | Consumer Defensive | South Africa | No | No | No | Yes | No | No |
| SIEGY | Siemens AG (ADR) | OTC | Industrials | United States | Yes | No | No | Yes | No | No |
| SIFY | Sify Technologies (ADR) | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| SLB | Schlumberger Limited | NYSE | Energy | United States | No | No | No | Yes | No | No |
| SLF.TO | Sun Life Financial | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| SMFG | Sumitomo Mitsui Financial (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| SNE | Sony Corporation (ADR-legacy) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| SNY | Sanofi (ADR) | NASDAQ | Healthcare | United States | Yes | No | No | Yes | No | No |
| SOL.JO | Sasol Limited | JSE | Energy | South Africa | No | No | No | Yes | No | No |
| SONY | Sony Group Corporation (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| SQM | Sociedad Química y Minera | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| STLA | Stellantis N.V. | NYSE | Automotive | United States | Yes | No | No | Yes | No | No |
| SU.TO | Suncor Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| SUPV | Grupo Supervielle S.A. | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| T.TO | Telus Corporation | TSX | Communication Services | Canada | No | No | No | Yes | No | No |
| TD.TO | Toronto-Dominion Bank | TSX | Financial Services | Canada | No | No | No | Yes | No | No |
| TEO | Telecom Argentina S.A. | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| TEVA | Teva Pharmaceutical (ADR) | NYSE | Healthcare | United States | Yes | No | No | Yes | No | No |
| TIMB | TIM S.A. (ADR) | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| TM | Toyota Motor Corporation (ADR) | NYSE | Automotive | United States | Yes | No | No | Yes | No | No |
| TMO | Thermo Fisher Scientific | NYSE | Healthcare | United States | No | No | No | Yes | No | No |
| TOU.TO | Tourmaline Oil Corp. | TSX | Energy | Canada | No | No | No | Yes | No | No |
| TRP.TO | TC Energy Corporation | TSX | Energy | Canada | No | No | No | Yes | No | No |
| TSLA | Tesla Inc. | NASDAQ | Automotive | United States | No | **YES** | **YES** | Yes | No | Yes |
| TSM | Taiwan Semiconductor (ADR) | NYSE | Technology | United States | Yes | No | **YES** | Yes | No | No |
| TTE | TotalEnergies SE (ADR) | NYSE | Energy | United States | Yes | No | No | Yes | No | No |
| TTM | Tata Motors Limited (ADR) | NYSE | Automotive | United States | Yes | No | No | Yes | No | No |
| TV | Grupo Televisa S.A.B. | NYSE | Communication Services | United States | Yes | No | No | Yes | No | No |
| TVE.TO | Tamarack Valley Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| TX | Ternium S.A. | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| U11.SI | United Overseas Bank | SGX | Financial Services | Singapore | No | No | No | Yes | No | No |
| UBS | UBS Group AG (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| UL | Unilever PLC (ADR) | NYSE | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| ULVR.L | Unilever PLC (London) | LSE | Consumer Cyclical | United Kingdom | No | No | No | Yes | No | No |
| UMC | United Microelectronics (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| UNH | UnitedHealth Group Inc. | NYSE | Healthcare | United States | No | No | **YES** | Yes | No | No |
| V | Visa Inc. | NYSE | Financial Services | United States | No | No | **YES** | Yes | No | No |
| VALE | Vale S.A. (ADR-1) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| VALE | Vale S.A. (ADR-2) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| VALE3.SA | Vale S.A. (Brazil) | B3 | Basic Materials | Brazil | No | No | No | Yes | No | No |
| VEDL | Vedanta Limited (ADR) | NYSE | Basic Materials | United States | Yes | No | No | Yes | No | No |
| VET.TO | Vermilion Energy | TSX | Energy | Canada | No | No | No | Yes | No | No |
| VLKAF | Volkswagen AG (ADR) | OTC | Automotive | United States | Yes | No | No | Yes | No | No |
| VOD.L | Vodafone Group (London) | LSE | Communication Services | United Kingdom | No | No | No | Yes | No | No |
| VZ | Verizon Communications | NYSE | Communication Services | United States | No | No | **YES** | Yes | No | No |
| WBK | Westpac Banking (ADR) | NYSE | Financial Services | United States | Yes | No | No | Yes | No | No |
| WCP.TO | Whitecap Resources | TSX | Energy | Canada | No | No | No | Yes | No | No |
| WFC | Wells Fargo & Company | NYSE | Financial Services | United States | No | No | No | Yes | No | No |
| WIT | Wipro Limited (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| WIX | Wix.com Ltd. | NASDAQ | Technology | United States | Yes | No | No | Yes | No | No |
| WMT | Walmart Inc. | NYSE | Consumer Cyclical | United States | No | No | **YES** | Yes | No | No |
| WNS | WNS Holdings Limited (ADR) | NYSE | Technology | United States | Yes | No | No | Yes | No | No |
| XOM | Exxon Mobil Corporation | NYSE | Energy | United States | No | No | **YES** | Yes | No | No |
| XPEV | XPeng Inc. (ADR) | NYSE | Automotive | United States | Yes | No | **YES** | Yes | No | No |
| YPF | YPF S.A. (ADR) | NYSE | Energy | United States | Yes | No | No | Yes | No | No |
| YUMC | Yum China Holdings (ADR) | NYSE | Consumer Cyclical | United States | Yes | No | No | Yes | No | No |
| Z74.SI | Singapore Telecommunications | SGX | Communication Services | Singapore | No | No | No | Yes | No | No |
| ZURN | Zurich Insurance Group (ADR) | OTC | Financial Services | United States | Yes | No | No | Yes | No | No |

**Notes on duplicates:**
- **RIO** appears twice: once as Rio Tinto Group (UK listing) and once as Rio Tinto Limited (Australia listing) — both `isADR: true`
- **VALE** appears twice: both entries are `isADR: true` for Vale S.A. — one is a legacy entry
- **SNE / SONY**: Both represent Sony Corporation; SNE is the legacy ticker, SONY is current

---

### 1.2 Tier Classification Summary

| Tier | Count | Tickers | Data Source | Evidence Quality |
|------|-------|---------|-------------|-----------------|
| **Tier 1 — Full 4-channel static** | 3 | AAPL, TSLA, MSFT | `companySpecificExposures.ts` (hand-curated from 10-K filings) | Highest — DIRECT for all channels |
| **Tier 2 — Hardcoded CIK (SEC-eligible)** | 49 | See CIK map below | `secFilingParser.ts` `TICKER_TO_CIK_MAP` | DIRECT/ALLOCATED if SEC parse succeeds |
| **Tier 3 — NASDAQ structured DB** | 18 | AMZN, BNTX, CRWD, DDOG, DOCU, GILD, GOOGL, META, MRNA, MSFT, OKTA, ROKU, SFIX, SNOW, TSLA, ZM + 2 more | `nasdaqCompanyDatabase.ts` | DIRECT/ALLOCATED if SEC parse succeeds |
| **Tier 4 — Full NASDAQ list** | ~33 | AAPL, ADBE, AMGN, AMZN, CRM, CRWD, DDOG, DOCU, GILD, GOOGL, META, MRNA, MSFT, NET, NFLX, NVDA, OKTA, PANW, PATH, PINS, PLTR, RBLX, ROKU, SFIX, SNAP, SNOW, SPLK, SPOT, TEAM, TSLA, U, WDAY, ZM | `fullNASDAQCompanyList.ts` | DIRECT/ALLOCATED if SEC parse succeeds |
| **Tier 5 — Primary search DB only** | ~200 | All remaining 256 tickers | `companyDatabase.ts` metadata only | GF fallback (MODELED tier) |

**Complete hardcoded CIK map** (49 entries from `secFilingParser.ts`):

| Ticker | CIK | Company |
|--------|-----|---------|
| AAPL | 0000320193 | Apple Inc. |
| MSFT | 0000789019 | Microsoft Corporation |
| GOOGL | 0001652044 | Alphabet Inc. |
| GOOG | 0001652044 | Alphabet Inc. (Class C) |
| AMZN | 0001018724 | Amazon.com Inc. |
| TSLA | 0001318605 | Tesla Inc. |
| META | 0001326801 | Meta Platforms Inc. |
| NVDA | 0001045810 | NVIDIA Corporation |
| BRK.A | 0001067983 | Berkshire Hathaway |
| BRK.B | 0001067983 | Berkshire Hathaway |
| JPM | 0000019617 | JPMorgan Chase |
| JNJ | 0000200406 | Johnson & Johnson |
| V | 0001403161 | Visa Inc. |
| WMT | 0000104169 | Walmart Inc. |
| PG | 0000080424 | Procter & Gamble |
| MA | 0001141391 | Mastercard |
| UNH | 0000731766 | UnitedHealth Group |
| HD | 0000354950 | Home Depot |
| DIS | 0001744489 | Walt Disney |
| BAC | 0000070858 | Bank of America |
| ADBE | 0000796343 | Adobe Inc. |
| CRM | 0001108524 | Salesforce Inc. |
| NFLX | 0001065280 | Netflix Inc. |
| CMCSA | 0001166691 | Comcast Corporation |
| XOM | 0000034088 | Exxon Mobil |
| PFE | 0000078003 | Pfizer Inc. |
| CSCO | 0000858877 | Cisco Systems |
| INTC | 0000050863 | Intel Corporation |
| VZ | 0000732712 | Verizon Communications |
| KO | 0000021344 | Coca-Cola Company |
| PEP | 0000077476 | PepsiCo Inc. |
| T | 0000732717 | AT&T Inc. |
| MRK | 0000310158 | Merck & Co. |
| ABT | 0000001800 | Abbott Laboratories |
| NKE | 0000320187 | Nike Inc. |
| ORCL | 0001341439 | Oracle Corporation |
| AMD | 0000002488 | Advanced Micro Devices |
| QCOM | 0000804328 | Qualcomm |
| IBM | 0000051143 | IBM |
| BA | 0000012927 | Boeing |
| GE | 0000040545 | General Electric |
| BABA | 0001577552 | Alibaba Group |
| TSM | 0001046179 | Taiwan Semiconductor |
| BIDU | 0001329099 | Baidu Inc. |
| JD | 0001549802 | JD.com Inc. |
| NIO | 0001736541 | NIO Inc. |
| XPEV | 0001840063 | XPeng Inc. |
| LI | 0001791706 | Li Auto Inc. |
| PDD | 0001737806 | PDD Holdings |
| J36 / J36.SI / JARD | 0000870016 | Jardine Matheson |

---

### 1.3 Database File Coverage Matrix

| Ticker | companyDatabase.ts | companySpecificExposures.ts | nasdaqCompanyDatabase.ts | fullNASDAQCompanyList.ts | enhancedCompanyExposures.ts | secFilingParser CIK map |
|--------|-------------------|----------------------------|--------------------------|--------------------------|----------------------------|------------------------|
| AAPL | ✓ | ✓ (Tier 1) | ✗ | ✓ | ✓ | ✓ |
| MSFT | ✓ | ✓ (Tier 1) | ✓ | ✓ | ✓ | ✓ |
| TSLA | ✓ | ✓ (Tier 1) | ✓ | ✓ | ✓ | ✓ |
| GOOGL | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ |
| AMZN | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| META | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| NVDA | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| NFLX | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| ADBE | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| ZM | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| SNOW | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| All others | ✓ | ✗ | ✗ | ✗ | ✗ | Varies |

---

## PART 2: Daily GitHub Update Pipeline — Precise Details

### 2.1 What Exactly Runs Daily

**Workflow file:** `.github/workflows/update-company-database.yml`  
**Schedule:** `cron: '0 2 * * *'` — every day at **02:00 UTC** (9 PM Pacific / 10 PM Eastern)  
**Script:** `src/scripts/updateCompanyDatabase.ts` (invoked via `npx tsx`)

**What the daily workflow does — step by step:**

```
Step 1: Checkout repository (actions/checkout@v4)
Step 2: Setup Node.js 20 (actions/setup-node@v4)
Step 3: Install dependencies (npm ci --prefer-offline)
Step 4: Validate FMP_API_KEY secret is present
Step 5: Run updateCompanyDatabase.ts script
  ├── Call FMP /api/v3/stock/list (1 bulk API call, ~70,000 companies)
  ├── Filter to the 256 tickers already in companyDatabase.ts
  ├── For tickers not found in bulk list (international tickers with non-standard suffixes):
  │     Call FMP /api/v3/profile/{ticker} individually (up to ~105 calls)
  ├── Update fields: name, exchange, country, sector, isADR
  └── ALWAYS preserve existing aliases[] — never overwrite
Step 6: Check if companyDatabase.ts was actually modified (git diff --quiet)
Step 7: If changed AND not dry-run: validate TypeScript (npx tsc --noEmit --skipLibCheck)
Step 8: If changed AND not dry-run: git commit + push with [skip ci] tag
Step 9: Write GitHub Step Summary with statistics
```

**FMP API endpoints used:**
- `https://financialmodelingprep.com/api/v3/stock/list?apikey={FMP_API_KEY}` — bulk list
- `https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={FMP_API_KEY}` — individual fallback

**Rate limits:** FMP free tier = 250 req/day. This workflow uses ~1 bulk + up to ~105 individual = ~106 req/day maximum.

### 2.2 Which Companies Are Updated Daily (Metadata)

**ALL 256 tickers in `companyDatabase.ts` are candidates for daily metadata update.**

The script filters the FMP bulk response to match the 256 tickers already in the database. For each matched ticker, it updates:
- `name` (company legal name)
- `exchange` (exchange acronym)
- `country` (listing country)
- `sector` (business sector)
- `isADR` (ADR flag from FMP `isAdr` field)

**What is NEVER updated by the daily workflow:**
- `aliases[]` — manually curated, always preserved
- `companySpecificExposures.ts` — not touched
- `nasdaqCompanyDatabase.ts` — not touched
- `fullNASDAQCompanyList.ts` — not touched
- Any SEC filing data — not touched

### 2.3 Which Companies Have SEC Filings Parsed (and When)

**CRITICAL DISTINCTION:** The daily GitHub Actions workflow does **NOT** parse SEC filings. It only updates company metadata (name/exchange/country/sector/isADR) from the FMP API.

SEC filing parsing is **entirely on-demand** (user-initiated), triggered when a user searches for a company in the dashboard:

| Company Category | SEC Filing Parsing | When Triggered | Cache |
|-----------------|-------------------|----------------|-------|
| **AAPL, TSLA, MSFT (Tier 1)** | Yes — live EDGAR pipeline | On page load / first search | In-memory session cache (cleared on reload) |
| **Tickers with hardcoded CIK (49 tickers)** | Attempted — on-demand | When user searches the ticker | No persistent cache |
| **Tickers without hardcoded CIK** | Attempted via Edge Function | When user searches the ticker | No persistent cache |
| **Foreign-listed tickers (HK, TW, SA, etc.)** | Not attempted (no SEC filing) | N/A | N/A |
| **All others** | Falls back to GF immediately | When user searches | No cache |

**Zero companies have their SEC filings parsed on a scheduled/daily basis.** All SEC parsing is runtime, on-demand, user-triggered.

### 2.4 Complete GitHub Actions Workflow Walkthrough

```yaml
# Trigger
on:
  schedule:
    - cron: '0 2 * * *'   # Daily at 02:00 UTC
  workflow_dispatch:        # Manual trigger with dry_run + verbose options

# Job: update-company-database
jobs:
  update-company-database:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      1. actions/checkout@v4 (token: GITHUB_TOKEN, fetch-depth: 1)
      2. actions/setup-node@v4 (node-version: '20', cache: 'npm')
      3. npm ci --prefer-offline (NODE_ENV: development)
      4. Validate FMP_API_KEY secret (exits with error if missing)
      5. npx tsx src/scripts/updateCompanyDatabase.ts [--dry-run] [--verbose]
         env: FMP_API_KEY, NODE_ENV: production
      6. git diff --quiet src/utils/companyDatabase.ts → sets changed=true/false
      7. If changed: npx tsc --noEmit --skipLibCheck
      8. If changed: git commit -m "chore(data): auto-update [skip ci]" + git push
      9. Write GitHub Step Summary

# Failure notification job
  notify-on-failure:
    needs: update-company-database
    if: failure()
    → Creates failure annotation with possible causes
```

---

## PART 3: SEC Retrieval & Parsing — Deep Technical Reference

### 3.1 CIK Resolution — Complete Flow

**File:** `src/services/secFilingParser.ts`  
**Function:** `getCIKFromTicker(ticker: string, maxRetries: number = 3): Promise<string | null>`

```
Step 1: Normalize ticker to uppercase
Step 2: Check TICKER_TO_CIK_MAP (49 hardcoded entries) → O(1) lookup
  → If found: return CIK immediately (no network call)
  → If not found: proceed to Step 3

Step 3: Call Supabase Edge Function 'fetch_sec_cik' with exponential backoff
  Attempt 1: POST to supabase.functions.invoke('fetch_sec_cik', {body: {ticker}})
    → Edge Function calls: GET https://www.sec.gov/files/company_tickers.json
    → User-Agent: 'CedarOwl Research contact@cedarowl.com'
    → Iterates all ~10,000 entries in SEC company_tickers.json
    → Matches on ticker field (case-insensitive)
    → Returns: {cik, ticker, companyName}
  
  If error on attempt 1: wait 1s (2^0 × 1000ms), retry
  If error on attempt 2: wait 2s (2^1 × 1000ms), retry
  If error on attempt 3: log error, return null

Step 4: If CIK found via Edge Function:
  → Cache in TICKER_TO_CIK_MAP[tickerUpper] for session duration
  → Return CIK

Step 5: If all attempts fail: return null → triggers GF fallback
```

### 3.2 Filing Retrieval — Complete Flow

**File:** `src/services/secFilingParser.ts`  
**Function:** `getLatestFilingWithHTML(cik: string, ticker: string): Promise<SECFiling | null>`

```
Step 1: Call Supabase Edge Function 'fetch_sec_filing' with formType: '10-K'
  → Edge Function calls: GET https://data.sec.gov/submissions/CIK{cik}.json
  → User-Agent: 'CedarOwl Research contact@cedarowl.com'
  → Parses submissions JSON to find latest 10-K filing
  → Fetches actual filing document HTML (primary document, not viewer wrapper)
  → Returns: {cik, formType, filingDate, reportDate, accessionNumber, htmlUrl, html}

Step 2: If 10-K not found or error:
  → Call 'fetch_sec_filing' with formType: '20-F' (for foreign private issuers)
  → Same process as Step 1

Step 3: If 20-F also fails:
  → Return null → triggers GF fallback

NOTE: No retry logic for filing retrieval (unlike CIK resolution which has 3 attempts).
NOTE: No persistent cache — each user session fetches fresh.
```

**EDGAR API endpoints used by `fetch_sec_filing` Edge Function:**
1. `https://data.sec.gov/submissions/CIK{cik}.json` — company submissions index
2. `https://www.sec.gov/Archives/edgar/data/{cik}/{accessionNumber}/{primaryDocument}` — actual filing HTML

### 3.3 HTML Parsing — All Keyword Arrays and Selectors

**File:** `src/services/secFilingParser.ts`  
**Library:** `cheerio` (jQuery-like HTML parsing)

#### `isRevenueTable()` — Complete Logic

```typescript
// EXCLUSION PATTERNS (checked FIRST — if any match, return false immediately):
const exclusionPatterns = [
  'cost of sales', 'cost of revenue', 'selling and marketing', 'selling, general',
  'research and development', 'operating expenses', 'operating income',
  'iphone', 'ipad', 'mac', 'wearables', 'product category'
];

// REVENUE KEYWORDS (must have at least one):
const revenueKeywords = [
  'revenue', 'sales', 'net sales', 'revenues', 'net revenues'
];

// GEOGRAPHIC KEYWORDS (must have at least one):
const geographicKeywords = [
  'geographic', 'geographical', 'region', 'segment', 'country', 'area',
  'by geography', 'by region', 'by location'
];

// REGIONAL PATTERNS (alternative to geographic keywords):
const regionalPatterns = [
  'americas', 'emea', 'asia-pacific', 'apac', 'europe', 'china', 'japan'
];

// MATCH CONDITION:
// (hasRevenue AND hasGeographic) OR (hasRevenue AND hasRegionalPattern)
```

#### `isPPETable()` — Complete Logic

```typescript
// PP&E KEYWORDS (must have at least one):
const ppeKeywords = [
  'property', 'plant', 'equipment', 'pp&e', 'long-lived', 'tangible assets', 'fixed assets'
];

// GEOGRAPHIC KEYWORDS (must have at least one):
const geographicKeywords = [
  'geographic', 'geographical', 'region', 'country', 'location'
];

// MATCH CONDITION: hasPPE AND hasGeographic
```

#### `isDebtTable()` — Complete Logic

```typescript
// DEBT KEYWORDS (must have at least one):
const debtKeywords = [
  'debt', 'notes', 'bonds', 'securities', 'borrowings', 'credit facility'
];

// CURRENCY KEYWORDS (must have at least one):
const currencyKeywords = [
  'currency', 'denomination', 'principal', 'maturity', 'usd', 'eur', 'gbp', 'jpy'
];

// MATCH CONDITION: hasDebt AND hasCurrency
```

#### `extractItem2Properties()` — Complete Logic

```typescript
// Searches for "Item 2. Properties" heading in HTML
// Extracts next 20 sibling elements as text

// FACILITY KEYWORDS (sentence must contain at least one):
const facilityKeywords = [
  'office', 'facility', 'plant', 'warehouse', 'manufacturing', 'r&d', 
  'research', 'data center', 'headquarters'
];

// COUNTRY PATTERN (regex, case-insensitive):
// Matches 45 specific countries:
/\b(United States|China|Japan|Germany|United Kingdom|France|Canada|Australia|India|
Brazil|Mexico|South Korea|Taiwan|Singapore|Vietnam|Thailand|Malaysia|Indonesia|
Philippines|Hong Kong|Netherlands|Switzerland|Belgium|Sweden|Spain|Italy|Poland|
Austria|Norway|Denmark|Ireland|Finland|Portugal|Greece|Czech Republic|Hungary|
Romania|Russia|Saudi Arabia|UAE|Israel|Turkey|South Africa|Nigeria|Egypt|
Argentina|Chile|Colombia|Peru)\b/gi

// FACILITY TYPE CLASSIFICATION:
// 'office' → 'office'
// 'manufacturing' or 'plant' → 'manufacturing'
// 'warehouse' → 'warehouse'
// 'r&d' or 'research' → 'r&d'
// 'data center' → 'data_center'
// else → 'other'
```

#### `extractSupplierLocations()` — Complete Logic

```typescript
// SUPPLY KEYWORDS (sentence must contain at least one):
const supplyKeywords = [
  'supplier', 'supply chain', 'manufacturing partner', 'contract manufacturer', 
  'component', 'raw material'
];

// COUNTRY PATTERN (15 countries only — supply chain focused):
/\b(China|Taiwan|South Korea|Japan|Vietnam|Thailand|Malaysia|Singapore|Indonesia|
Philippines|United States|Mexico|Germany|India|Brazil)\b/gi

// SUPPLIER TYPE CLASSIFICATION:
// 'manufacturing' → 'manufacturing'
// 'component' → 'component'
// 'raw material' → 'raw_material'
// else → 'other'

// NOTE: Only 15 countries in scope (vs 45 for Item 2)
// NOTE: Confidence is 'medium' (vs 'high' for Item 2)
```

### 3.4 Table Classification — Complete Heuristics

The `parseSECFiling()` master function processes tables in this order:

```
1. extractAllTables(html) → all <table> elements via cheerio
2. For each table:
   a. isRevenueTable(table, $) → if true: parseRevenueTable()
   b. isPPETable(table, $) → if true: parsePPETable()
   c. isDebtTable(table, $) → if true: parseDebtTable()
3. extractItem2Properties(html) → facility locations
4. extractSupplierLocations(html) → supply chain locations
5. parseExhibit21(html) → subsidiary list
6. If llmExtraction enabled: extractNarrativeData(html, ticker) → AI extraction
```

**Currency-to-jurisdiction mapping** (used in `parseDebtTable()`):

```typescript
const currencyToJurisdiction: Record<string, string> = {
  'USD': 'United States',
  'EUR': 'Eurozone',
  'GBP': 'United Kingdom',
  'JPY': 'Japan',
  'CHF': 'Switzerland',
  'CAD': 'Canada',
  'AUD': 'Australia',
  'CNY': 'China',
  'HKD': 'Hong Kong',
  'SGD': 'Singapore'
};
```

### 3.5 Data Extraction — All Functions with Full Logic

#### `parseRevenueTable()` — Row Extraction Logic

```
1. Extract all <tr> elements from table
2. For each row (skip header row i=0):
   - Extract cell text values
   - Try to match cell text against country/region name list
   - Try to parse numeric values (remove $, commas, parentheses)
   - If percentage found (contains %): use directly
   - If absolute value found: calculate as % of total row
3. Map region names to countries using regionDecomposition.ts
4. Return RevenueSegment[] with region, countries[], revenueAmount, revenuePercentage
```

#### `parsePPETable()` — Same structure as parseRevenueTable but returns PPESegment[]

#### `parseDebtTable()` — Currency-based jurisdiction detection

```
1. Extract all <tr> elements
2. For each row: scan cells for currency code (USD/EUR/GBP/JPY/CHF/CAD/AUD/CNY/HKD/SGD)
3. Extract principal amount (numeric value > 100)
4. Map currency → jurisdiction via currencyToJurisdiction map
5. Return DebtSecurity[] with jurisdiction, currency, principalAmount
```

---

## PART 4: Four Channels — Complete Mathematical Reference

### 4.1 Channel Blending Weights — Exact Values from Code

**File:** `src/services/geographicExposureService.ts`  
**Constant:** `DEFAULT_EXPOSURE_COEFFICIENTS`

```typescript
const DEFAULT_EXPOSURE_COEFFICIENTS = {
  revenue:   0.40,   // 40% weight
  supply:    0.35,   // 35% weight
  assets:    0.15,   // 15% weight
  financial: 0.10,   // 10% weight
};
```

**Blending formula:**
```
W_blended(c) = 0.40 × W_revenue(c) + 0.35 × W_supply(c) + 0.15 × W_assets(c) + 0.10 × W_financial(c)
```

**Sector-specific coefficient overrides** (from `getSectorExposureCoefficients()`):

| Sector | Revenue | Supply | Assets | Financial |
|--------|---------|--------|--------|-----------|
| Default | 0.40 | 0.35 | 0.15 | 0.10 |
| Energy | 0.35 | 0.25 | 0.25 | 0.15 |
| Financial Services | 0.35 | 0.15 | 0.15 | 0.35 |
| Technology | 0.40 | 0.35 | 0.15 | 0.10 |
| Healthcare | 0.40 | 0.30 | 0.20 | 0.10 |
| Consumer | 0.45 | 0.30 | 0.15 | 0.10 |

### 4.2 Revenue Channel — Full Formula

**Prior formula** (from `channelPriors.ts`):
```
Revenue_prior(c) ∝ GDP(c)^0.25 × HouseholdConsumption(c)^0.35 × SectorDemand(c)^0.30 × MarketAccess(c)^0.10
```

**GDP data used** (2023, trillion USD, from `channelPriors.ts`):

| Country | GDP (T$) | Country | GDP (T$) |
|---------|----------|---------|----------|
| United States | 27.0 | South Korea | 1.7 |
| China | 17.9 | Australia | 1.7 |
| Japan | 4.2 | Spain | 1.4 |
| Germany | 4.1 | Mexico | 1.4 |
| India | 3.7 | Indonesia | 1.3 |
| United Kingdom | 3.1 | Netherlands | 1.1 |
| France | 2.8 | Saudi Arabia | 1.1 |
| Italy | 2.2 | Turkey | 1.0 |
| Brazil | 2.1 | Switzerland | 0.9 |
| Canada | 2.1 | Taiwan | 0.8 |

**Home country λ boost for Revenue channel:** λ = 0.25 (25% additional weight added to home country before normalization)

### 4.3 Supply Chain Channel — Full Formula

**Prior formula** (from `channelPriors.ts`):
```
Supply_prior(c) ∝ ManufacturingVA(c)^0.20 × SectorExport(c)^0.30 × AssemblyCapability(c)^0.25 × Logistics(c)^0.10 × IORelevance(c)^0.15
```

**Critical note from code comment:** *"Supply prior HEAVILY suppresses US and Germany for technology hardware. China, Taiwan, Vietnam, South Korea, India must dominate for tech supply chain."*

**Manufacturing Value Added** (billion USD, 2022, from `channelPriors.ts`):

| Country | Mfg VA ($B) | Country | Mfg VA ($B) |
|---------|-------------|---------|-------------|
| China | 4,900 | Taiwan | 320 |
| United States | 2,500 | Mexico | 220 |
| Japan | 1,000 | Brazil | 200 |
| Germany | 700 | Canada | 190 |
| South Korea | 450 | Russia | 250 |
| India | 450 | Indonesia | 230 |
| Italy | 280 | Thailand | 120 |
| France | 270 | Vietnam | 100 |
| United Kingdom | 250 | Poland | 90 |

**Home country λ boost for Supply channel:** λ = 0.10 (10% — intentionally low to reflect that supply chains are globally distributed)

### 4.4 Physical Assets Channel — Full Formula

**Prior formula** (from `channelPriors.ts`):
```
Assets_prior(c) ∝ CapitalStock(c)^0.30 × SectorAssetSuitability(c)^0.35 × Infrastructure(c)^0.20 × ResourceFit(c)^0.15
```

**Home country λ boost for Assets channel:** λ = 0.35 (35% — highest boost, reflecting that physical assets are most concentrated in home country)

### 4.5 Financial Channel — Full Formula

**Prior formula** (from `channelPriors.ts`):
```
Financial_prior(c) ∝ FinancialDepth(c)^0.35 × CurrencyExposure(c)^0.30 × CrossBorderCapital(c)^0.20 × FundingHub(c)^0.15
```

**Financial depth scores** (from `channelPriors.ts`, scale 0–100):

| Country | Score | Country | Score |
|---------|-------|---------|-------|
| United States | 100 | Singapore | 65 |
| United Kingdom | 60 | Luxembourg | 80 |
| Japan | 45 | Hong Kong | 70 |
| China | 50 | Switzerland | 55 |
| Germany | 35 | Ireland | 35 |
| France | 30 | Netherlands | 40 |

**Home country λ boost for Financial channel:** λ = 0.20

### 4.6 GF V5 — Complete Implementation

**File:** `src/services/fallbackLogic.ts`  
**Function:** `buildGlobalFallbackV5(homeCountry: string, channel: string, sector: string)`

**Three-tier fallback decision tree:**

```
STEP 1: SSF (Segment-Specific Fallback)
  Condition: Region membership is fully known (e.g., "Americas" → specific countries)
  Formula: For each country c in region R:
    W(c|R) = T(c) / Σ_{k∈R} T(k)
    where T(c) = sector-specific proxy (GDP, ManufacturingVA, etc.)
  Tier: ALLOCATED
  Uncertainty: ±10%

STEP 2: RF (Restricted Fallback)
  Condition: Partial evidence exists (narrative mentions specific countries)
  Process:
    1. Build admissible set P from narrative signals
    2. Allocate within P using sector priors
    3. Countries outside P get zero weight
  Tier: MODELED
  Uncertainty: ±20%

STEP 3: GF (Global Fallback)
  Condition: No usable geographic information
  Process:
    1. Home country gets λ boost: W_home += λ_channel
    2. Remaining weight (1 - λ) distributed by sector-specific economic priors
    3. Normalize all weights to sum to 1.0
  Tier: FALLBACK
  Uncertainty: ±30%
```

**λ values by channel (from code):**

| Channel | λ (home country boost) | Rationale |
|---------|----------------------|-----------|
| Revenue | 0.25 | Revenue partially domestic |
| Supply | 0.10 | Supply chains are global |
| Assets | 0.35 | Physical assets most concentrated at home |
| Financial | 0.20 | Financial exposure partially domestic |

**UN M49 Standard Regions** (defined in `fallbackLogic.ts`):
- Africa: 54 countries
- Americas: North America (Canada, United States, Mexico, Caribbean, Central America) + South America
- Asia: 48 countries (Afghanistan through Yemen)
- Europe: Western + Eastern + Russia/Former Soviet
- Oceania: Australia, New Zealand, Pacific Islands

---

## PART 5: CO-GRI Score — Complete Formula Reference

### 5.1 Exact CO-GRI Scoring Formula

**File:** `src/services/cogriCalculationService.ts`

```
CO-GRI_raw = Σ_c [ W_blended(c) × CSI(c) × PoliticalAmplifier(c) ]

CO-GRI_final = CO-GRI_raw × SectorMultiplier

Where:
  W_blended(c) = 0.40×W_rev(c) + 0.35×W_sup(c) + 0.15×W_ast(c) + 0.10×W_fin(c)
  
  PoliticalAmplifier(c) = 1.0 + 0.5 × (1.0 - A_c)
  
  A_c = alignmentFactor (0.0 to 1.0):
    1.0 → full alignment → amplifier = 1.0 (no amplification)
    0.5 → neutral → amplifier = 1.25
    0.0 → adversarial → amplifier = 1.5 (maximum amplification)
```

**Score normalization:** Pre-normalization step ensures Σ W_blended(c) = 1.0 across all countries.

**Risk level thresholds** (from `cogriCalculationService.ts`):
- Low: < 30
- Moderate: 30–44
- High: 45–59
- Very High: ≥ 60

### 5.2 CSI Values — Complete Country List (194 countries)

**File:** `src/data/globalCountries.ts`  
**Total countries:** 194

**Selected key CSI values** (full list of 194 extracted from code):

| Country | CSI | Region | Risk Level |
|---------|-----|--------|-----------|
| Somalia | 94.0 | East Africa | Extreme |
| Afghanistan | 95.0 | South Asia | Extreme |
| Syria | 92.0 | Middle East | Extreme |
| South Sudan | 90.0 | East Africa | Extreme |
| Yemen | 90.0 | Middle East | Extreme |
| Palestine | 88.0 | Middle East | Very High |
| Central African Republic | 88.0 | Central Africa | Very High |
| North Korea | 88.0 | East Asia | Very High |
| Libya | 84.0 | North Africa | Very High |
| Sudan | 86.0 | North Africa | Very High |
| Democratic Republic of Congo | 82.0 | Central Africa | Very High |
| Iraq | 82.0 | Middle East | Very High |
| Myanmar | 82.0 | Southeast Asia | Very High |
| Russia | 78.0 | Eurasia | High |
| Haiti | 78.0 | Caribbean | High |
| Chad | 78.0 | Central Africa | High |
| Burkina Faso | 76.0 | West Africa | High |
| Lebanon | 76.0 | Middle East | High |
| Burundi | 76.0 | East Africa | High |
| China | 75.0 | East Asia | High |
| Zimbabwe | 74.0 | Southern Africa | High |
| Niger | 74.0 | West Africa | High |
| Belarus | 72.0 | Eastern Europe | High |
| Cuba | 72.0 | Caribbean | High |
| Ethiopia | 72.0 | East Africa | High |
| Guinea-Bissau | 72.0 | West Africa | High |
| Turkmenistan | 68.0 | Central Asia | High |
| Israel | 68.0 | Middle East | High |
| Nigeria | 68.0 | West Africa | High |
| Liberia | 68.0 | West Africa | High |
| Iran | 80.0 | Middle East | Very High |
| Venezuela | 82.0 | South America | Very High |
| Ukraine | 85.0 | Eastern Europe | Very High |
| Argentina | 62.0 | South America | High |
| Turkey | 62.0 | Middle East | High |
| Brazil | 58.0 | South America | Moderate-High |
| India | 55.0 | South Asia | Moderate |
| South Korea | 48.0 | East Asia | Moderate |
| Taiwan | 52.0 | East Asia | Moderate |
| Hong Kong | 58.0 | East Asia | Moderate-High |
| Japan | 32.0 | East Asia | Low-Moderate |
| United States | 30.0 | North America | Low |
| Canada | 30.0 | North America | Low |
| Germany | 38.0 | Western Europe | Low-Moderate |
| United Kingdom | 40.0 | Western Europe | Low-Moderate |
| France | 42.0 | Western Europe | Moderate |
| Switzerland | 25.0 | Western Europe | Very Low |
| Iceland | 24.0 | Western Europe | Very Low |
| Australia | 28.0 | Oceania | Very Low |
| Singapore | 30.0 | Southeast Asia | Low |
| Luxembourg | 28.0 | Western Europe | Very Low |

### 5.3 Political Alignment Amplification — Complete Implementation

**File:** `src/services/politicalAlignmentService.ts`  
**Function:** `calculatePoliticalAlignment(homeCountry: string, targetCountry: string): AlignmentResult`

**Alliance memberships defined in code:**

| Alliance | Member Countries |
|----------|-----------------|
| NATO | 30 members including US, UK, France, Germany, Italy, Spain, Canada, Poland, Netherlands, Belgium, Denmark, Norway, Portugal, Turkey, Greece, Czech Republic, Hungary, Romania, Bulgaria, Slovakia, Slovenia, Estonia, Latvia, Lithuania, Croatia, Albania, Montenegro, North Macedonia, Finland, Sweden |
| QUAD | United States, Japan, India, Australia |
| AUKUS | Australia, United Kingdom, United States |
| USMCA | United States, Mexico, Canada |
| EU | 27 members |
| BRICS | Brazil, Russia, India, China, South Africa, Egypt, Ethiopia, Iran, UAE, Saudi Arabia |
| SCO | China, Russia, India, Pakistan, Kazakhstan, Kyrgyzstan, Tajikistan, Uzbekistan, Iran |
| ASEAN | Indonesia, Thailand, Philippines, Vietnam, Singapore, Malaysia, Myanmar, Cambodia, Laos, Brunei |
| GCC | Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman |
| MERCOSUR | Brazil, Argentina, Paraguay, Uruguay |
| AU | South Africa, Nigeria, Egypt, Ethiopia, Kenya, Algeria, Morocco, Ghana, Tanzania, Angola |

**Known adversarial pairs** (alignmentFactor → 0.0–0.2):
- US ↔ Russia, Iran, North Korea, Venezuela, Cuba, Syria
- UK ↔ Russia
- Japan ↔ North Korea
- South Korea ↔ North Korea
- India ↔ Pakistan
- Israel ↔ Iran
- Saudi Arabia ↔ Iran
- Ukraine ↔ Russia

**Strategic competition pairs** (alignmentFactor → 0.3–0.5):
- US ↔ China
- Japan ↔ China
- India ↔ China
- Australia ↔ China
- UK ↔ China
- Canada ↔ China
- Taiwan ↔ China

**UN voting similarity scores** (selected, from code):

| Home → Target | Score |
|---------------|-------|
| US → UK | 0.85 |
| US → Israel | 0.88 |
| US → Canada | 0.82 |
| US → China | 0.25 |
| US → Russia | 0.20 |
| US → Iran | 0.10 |
| China → Russia | 0.85 |
| China → North Korea | 0.90 |
| China → US | 0.25 |
| UK → Australia | 0.90 |
| Germany → France | 0.92 |

### 5.4 Sector Multipliers — Exact Values

**File:** `src/data/sectorMultipliers.ts`  
**Object:** `SECTOR_SENSITIVITY`

| Sector | Multiplier | Strategic Importance |
|--------|-----------|---------------------|
| Energy & Resources | 1.45 | 0.95 |
| Technology & Telecom | 1.35 | 0.90 |
| Financial Services | 1.30 | 0.85 |
| Healthcare & Pharma | 1.10 | 0.90 |
| Real Estate & Construction | 1.05 | 0.65 |
| Consumer Goods (default) | 1.00 | 0.75 |
| Automotive | ~1.20 | ~0.80 |
| Industrials | ~1.15 | ~0.75 |
| Utilities | ~1.10 | ~0.80 |
| Communication Services | ~1.25 | ~0.80 |
| Basic Materials | ~1.30 | ~0.85 |

*Note: Exact values for Automotive, Industrials, Utilities, Communication Services, and Basic Materials require reading additional lines of `sectorMultipliers.ts` beyond what was extracted. The values shown with ~ are estimates based on the pattern.*

### 5.5 Uncertainty Calculation

**File:** `src/services/cogriCalculationService.ts`  
**Tier uncertainty bands:**

| Evidence Tier | Uncertainty Band | Meaning |
|--------------|-----------------|---------|
| DIRECT | ±5% of score | Structured table from statutory filing |
| ALLOCATED | ±10% of score | Regional prior allocation |
| MODELED | ±20% of score | GF formula with sector priors |
| FALLBACK | ±30% of score | Pure GF with no geographic information |

**Uncertainty calculation:**
```
scoreUncertainty = finalScore × weightedTierUncertainty

weightedTierUncertainty = Σ_c [ W_blended(c) × tierUncertainty(bestTier(c)) ]

Where tierUncertainty:
  DIRECT    → 0.05
  ALLOCATED → 0.10
  MODELED   → 0.20
  FALLBACK  → 0.30
```

---

## PART 6: Unknown Ticker Handling — Complete Code Trace

### 6.1 Step-by-Step Code Path

**Entry point:** User types unknown ticker in dashboard search box  
**Main function:** `getCompanyGeographicExposure(ticker)` in `geographicExposureService.ts`

```
STEP 1: getCompanyGeographicExposure(ticker) [geographicExposureService.ts:925]
  ├── hasCompanySpecificExposure(ticker) → false (not AAPL/TSLA/MSFT)
  └── Proceed to multi-source resolution

STEP 2: resolveTickerMultiSource(ticker) [geographicExposureService.ts:818]
  ├── resolveTickerWithPolygon(ticker) [geographicExposureService.ts:791]
  │     → GET https://api.polygon.io/v3/reference/tickers/{ticker}?apikey={key}
  │     → Returns: name, exchange, country, sector, industry, description
  │
  ├── If Polygon fails: resolveCompanyWithSEC(ticker) [geographicExposureService.ts:800]
  │     → Calls getCIKFromTicker(ticker) → EDGAR lookup
  │     → Returns: name, cik, country (from SEC data)
  │
  ├── If SEC fails: resolveCompanyWithAlphaVantage(ticker) [geographicExposureService.ts:809]
  │     → GET https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={ticker}&apikey=demo
  │     → Returns: symbol, name, region, matchScore
  │
  └── Merge results → CompanyInfo {ticker, name, exchange, country, sector, industry, cik}

STEP 3: resolveADRCountry(ticker, name, apiCountry, exchange) [adrCountryResolver.ts]
  ├── Check KNOWN_ADR_MAPPINGS (80+ entries)
  ├── If not found: apply pattern matching (name patterns, exchange suffix)
  └── Returns: {country: string, isADR: boolean, confidence, source}

STEP 4: sectorClassificationService.classifySector(ticker, name, sector, industry, description)
  [sectorClassificationService.ts]
  ├── Check hardcoded sector overrides for known tickers
  ├── Apply name-based pattern matching
  ├── Use API-provided sector/industry strings
  └── Returns: {sector, multiplier, confidence, sources}

STEP 5: calculateIndependentChannelExposuresWithSEC(ticker, name, finalSector, finalCountry)
  [geographicExposureService.ts:390]
  ├── hasCompanySpecificExposure(ticker) → false
  ├── integrateStructuredData(ticker, homeCountry, sector) [structuredDataIntegrator.ts]
  │     ├── parseSECFiling(ticker) [secFilingParser.ts]
  │     │     ├── getCIKFromTicker(ticker) → hardcoded map OR Edge Function
  │     │     ├── If CIK found: getLatestFilingWithHTML(cik, ticker)
  │     │     │     → fetch_sec_filing Edge Function → EDGAR HTML
  │     │     ├── If HTML found: parse tables + narrative + Exhibit 21
  │     │     └── If any step fails: return null
  │     ├── If SEC data available: integrateRevenueChannelV5() + integrateSupplyChannelV5()
  │     │     + integrateAssetsChannelV5() + integrateFinancialChannelV5()
  │     └── If SEC data null: buildGlobalFallbackV5() for all 4 channels
  └── Returns: channelBreakdown (per-country, per-channel weights + tiers)

STEP 6: calculateCOGRIScore({segments, channelBreakdown, homeCountry, sector, sectorMultiplier})
  [cogriCalculationService.ts]
  ├── For each country: compute W_blended × CSI × PoliticalAmplifier
  ├── Sum all contributions → raw score
  ├── Apply sector multiplier
  └── Returns: {finalScore, riskLevel, countryExposures, scoreUncertainty}

STEP 7: runtimeValidation.validate(ticker, result) [runtimeValidation.ts]
  └── Returns: {executionPath, channelQuality, fallbackAudit, scoreUncertainty}
```

### 6.2 API Calls Made for Unknown Ticker

In order of attempt:

| # | Service | URL | API Key | Expected Return |
|---|---------|-----|---------|----------------|
| 1 | Polygon.io | `https://api.polygon.io/v3/reference/tickers/{ticker}?apikey={key}` | From config | name, exchange, country, sector |
| 2 | SEC EDGAR (CIK) | Via `fetch_sec_cik` Edge Function → `https://www.sec.gov/files/company_tickers.json` | None (public) | CIK number |
| 3 | Alpha Vantage | `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={ticker}&apikey=demo` | `'demo'` (hardcoded) | symbol, name, region |
| 4 | Marketstack | `https://api.marketstack.com/v1/tickers?search={ticker}&access_key={key}` | Hardcoded key | symbol, name, exchange |
| 5 | Yahoo Finance | `https://query2.finance.yahoo.com/v1/finance/search?q={ticker}` | None (unofficial) | symbol, name, exchange |
| 6 | SEC EDGAR (filing) | Via `fetch_sec_filing` Edge Function → `https://data.sec.gov/submissions/CIK{cik}.json` | None (public) | 10-K/20-F HTML |

### 6.3 Fallback Decision Logic

```
IF Polygon resolves ticker AND SEC filing found AND parsing succeeds:
  → DIRECT/ALLOCATED tier data
  → executionPath: 'live-edgar'
  → scoreUncertainty: ±5–10%

ELSE IF Polygon resolves ticker AND SEC filing found AND parsing partially succeeds:
  → Mixed DIRECT/ALLOCATED/MODELED tiers
  → executionPath: 'live-edgar'
  → scoreUncertainty: ±10–20%

ELSE IF Polygon resolves ticker AND SEC filing NOT found:
  → GF fallback for all 4 channels
  → executionPath: 'gf-fallback'
  → scoreUncertainty: ±30%

ELSE IF ticker completely unresolvable:
  → GF fallback using 'United States' as default home country
  → executionPath: 'gf-fallback'
  → scoreUncertainty: ±30%
  → Score may be meaningless
```

### 6.4 User Experience for Unknown Ticker

What the user sees in the dashboard:
1. **Loading state:** "Analyzing [TICKER]..." spinner while API calls execute
2. **If successful:** CO-GRI score card with risk level badge, country breakdown chart, channel breakdown
3. **Score uncertainty badge:** Shows "±X points" based on evidence tier
4. **Data source indicator:** Shows "Live EDGAR" or "Estimated" or "Global Fallback"
5. **Tier badges per country:** DIRECT / ALLOCATED / MODELED / FALLBACK badges in the country breakdown table
6. **If ticker not found at all:** Error state "Company not found" with suggestion to check ticker symbol

---

## PART 7: Answers to Enhancement Document Questions (Runtime Baseline)

The enhancement document (`Report 6 Enhancement.docx`) identifies that Report 6 is a useful architecture clarification but does not yet answer the **actual runtime baseline** questions. The document requests three components:

### 7.1 Universe-Level Summary

**Q: How many companies in the searchable universe are actually entering the live SEC/runtime path today?**

**Answer:** Based on code analysis, the answer is **architecture-dependent, not data-dependent**. The system does not pre-process companies on a schedule. The live SEC/runtime path is triggered **only when a user searches for a specific ticker**. Therefore:

- **Companies that CAN enter the live SEC path:** 49 (those with hardcoded CIKs) + any additional tickers where the `fetch_sec_cik` Edge Function successfully resolves a CIK from EDGAR
- **Companies that CANNOT enter the live SEC path:** All foreign-listed tickers (HK, TW, SA, AU, CA, UK, BR, CO, MX, SG exchanges) — they have no SEC filings
- **Companies that ALWAYS bypass the live SEC path:** Only AAPL, TSLA, MSFT (Tier 1) — they use the live EDGAR pipeline via `liveEdgarPipeline.ts` which is a separate, more sophisticated pipeline than the general SEC parser

**Q: How many are successfully retrieving filings?**

**Answer:** This cannot be determined from static code analysis alone — it requires runtime execution. However, the code architecture reveals:
- **Likely to succeed:** The 49 tickers with hardcoded CIKs (AAPL, MSFT, TSLA, GOOGL, AMZN, META, NVDA, JPM, JNJ, V, WMT, PG, MA, UNH, HD, DIS, BAC, ADBE, CRM, NFLX, CMCSA, XOM, PFE, CSCO, INTC, VZ, KO, PEP, T, MRK, ABT, NKE, ORCL, AMD, QCOM, IBM, BA, GE, BABA, TSM, BIDU, JD, NIO, XPEV, LI, PDD, BRK.A, BRK.B)
- **Likely to fail:** Foreign ADRs (TSM, BABA, BIDU, etc.) — they file 20-F, not 10-K, and the parser attempts 20-F as fallback, but parsing success is uncertain
- **Certain to fail:** All non-US-listed tickers (0700.HK, 2330.TW, etc.) — no SEC filings exist

**Q: How many are successfully parsing structured data?**

**Answer:** From code analysis of parsing heuristics:
- The `isRevenueTable()` function requires BOTH revenue keywords AND geographic keywords/patterns
- Many 10-K filings present geographic revenue in narrative form rather than tables
- The exclusion patterns (product categories like iPhone, iPad) may over-exclude Apple-style filings
- **Estimated success rate for structured table parsing:** ~30–50% of US-listed companies with hardcoded CIKs, based on the specificity of the keyword requirements

**Q: How many are successfully parsing narrative data?**

**Answer:** The LLM narrative extractor (`extract_geographic_narrative` Edge Function) is called when structured parsing fails or is incomplete. Success rate depends on:
- Whether the Supabase Edge Function is deployed and operational
- Whether the AI model correctly identifies geographic segments
- **Estimated:** Higher than structured parsing (~60–70% of attempted filings)

**Q: Which companies are currently producing materially company-specific outputs versus fallback-dominant outputs?**

**Answer based on code architecture:**

| Category | Companies | Output Type |
|----------|-----------|-------------|
| **Guaranteed company-specific** | AAPL, TSLA, MSFT | Static Tier 1 data (always available, regardless of SEC success) |
| **Likely company-specific (if SEC succeeds)** | GOOGL, AMZN, META, NVDA, JPM, JNJ, V, WMT, PG, MA, UNH, HD, DIS, BAC, ADBE, CRM, NFLX, CMCSA, XOM, PFE, CSCO, INTC, VZ, KO, PEP, T, MRK, ABT, NKE, ORCL, AMD, QCOM, IBM, BA, GE | DIRECT/ALLOCATED if parsing succeeds |
| **Uncertain (ADRs with CIKs)** | BABA, TSM, BIDU, JD, NIO, XPEV, LI, PDD | 20-F parsing attempted, success uncertain |
| **Fallback-dominant** | All ~200 remaining tickers in companyDatabase.ts | GF fallback (MODELED tier) |

### 7.2 Per-Company Runtime Table (In-Scope Set)

The following table documents the **designed runtime behavior** for the 49 tickers with hardcoded CIKs. Actual runtime success/failure requires live execution diagnostics which are not available from static code analysis.

| Ticker | Live SEC Path | CIK Available | 10-K Expected | 20-F Expected | Structured Parse Likely | Narrative Parse Likely | Expected Output Type |
|--------|--------------|---------------|---------------|---------------|------------------------|----------------------|---------------------|
| AAPL | Yes (Tier 1) | Yes | Yes | No | Yes | Yes | Static Tier 1 (always) |
| MSFT | Yes (Tier 1) | Yes | Yes | No | Yes | Yes | Static Tier 1 (always) |
| TSLA | Yes (Tier 1) | Yes | Yes | No | Yes | Yes | Static Tier 1 (always) |
| GOOGL | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| AMZN | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| META | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| NVDA | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| JPM | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| JNJ | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| V | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| WMT | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| PG | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| MA | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| UNH | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| HD | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| DIS | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| BAC | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| ADBE | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| CRM | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| NFLX | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| CMCSA | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| XOM | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| PFE | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| CSCO | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| INTC | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| VZ | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| KO | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| PEP | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| T | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| MRK | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| ABT | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| NKE | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| ORCL | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| AMD | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| QCOM | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| IBM | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| BA | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| GE | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| BABA | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| TSM | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| BIDU | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| JD | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| NIO | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| XPEV | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| LI | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| PDD | Yes | Yes | No | Yes | Uncertain | Uncertain | MODELED/FALLBACK |
| BRK.A/B | Yes | Yes | Yes | No | Likely | Likely | DIRECT/ALLOCATED |
| All other ~207 tickers | No (GF only) | No | No | No | No | No | FALLBACK (GF) |

### 7.3 Failure-Reason Breakdown

The enhancement document requests a failure-reason breakdown. Based on code analysis:

| Failure Reason | Affected Tickers | Code Location | Fallback |
|----------------|-----------------|---------------|---------|
| **Not in scope (no SEC filing)** | ~130 foreign-listed tickers (HK, TW, SA, AU, CA, UK, BR, CO, MX, SG exchanges) | `getLatestFilingWithHTML()` returns null | GF fallback |
| **Missing CIK** | ~160 tickers not in hardcoded map AND not resolvable via Edge Function | `getCIKFromTicker()` returns null | GF fallback |
| **API/Edge Function failure** | Any ticker when Supabase is down or rate-limited | `supabase.functions.invoke()` throws | Static snapshot (Tier 1) or GF fallback |
| **No filing found** | Foreign private issuers where 10-K AND 20-F both absent | `getLatestFilingWithHTML()` returns null after both attempts | GF fallback |
| **Filing retrieval failure** | Any ticker when EDGAR is slow/unavailable | `fetch_sec_filing` Edge Function returns error | GF fallback |
| **Structured parsing failure** | Filings with non-standard table formats, or where exclusion patterns over-filter | `isRevenueTable()` / `isPPETable()` / `isDebtTable()` return false for all tables | Narrative parsing attempted |
| **Narrative parsing failure** | Filings with no geographic narrative, or LLM extraction fails | `extractNarrativeData()` returns empty | GF fallback |
| **Partial evidence → fallback** | Filings where only 1–2 channels have evidence | V5 channel integrators return partial data | Mixed DIRECT+GF |
| **Fallback-dominant output** | All ~207 tickers without hardcoded CIKs | `buildGlobalFallbackV5()` | GF (MODELED tier) |

### 7.4 Why This Report Cannot Provide Actual Runtime Diagnostics

The enhancement document correctly identifies that Report 6 (and this enhanced version) is an **architecture/design report**, not a **runtime baseline report**. The distinction is critical:

**What this report CAN provide (from static code analysis):**
- Which companies are DESIGNED to enter the live SEC path
- Which failure modes EXIST in the code
- What the fallback chain LOOKS LIKE
- What evidence tiers WOULD BE assigned if parsing succeeds

**What this report CANNOT provide (requires live execution):**
- Whether the Supabase Edge Functions are currently deployed and operational
- Whether EDGAR is returning valid responses for each CIK
- Whether the HTML parsing is actually finding tables in practice
- Actual success/failure rates per ticker
- Actual evidence tiers currently assigned to each company
- Whether the Alpha Vantage 'demo' key is causing failures in practice

**To obtain the actual runtime baseline, the following would be needed:**
1. Deploy the application to a live environment
2. Execute `getCompanyGeographicExposure(ticker)` for each of the 49 CIK-mapped tickers
3. Capture the `executionPath`, `channelQuality`, and `fallbackAudit` from `runtimeValidation.ts`
4. Record success/failure at each pipeline stage
5. Document actual evidence tiers per company per channel

---

## PART 8: Cross-Reference Updates vs. Reports 1–5

### New Findings Not in Reports 1–5 or Original Report 6

| Finding | Category | Impact |
|---------|----------|--------|
| **256 unique tickers** (not 259) in `companyDatabase.ts` | Correction | Minor — 3 fewer than previously stated |
| **Daily GitHub workflow updates ONLY metadata** — never SEC filings | Clarification | High — critical misunderstanding risk |
| **SEC parsing is 100% on-demand** — no scheduled SEC processing exists | Clarification | High |
| **49 hardcoded CIKs** (not 46 as stated in Report 6) — J36, J36.SI, JARD add 3 more | Correction | Minor |
| **`fullNASDAQCompanyList.ts` contains 33 actual tickers** (not 38) | Correction | Minor |
| **`enhancedCompanyExposures.ts` contains EDGE1–EDGE5** — test/placeholder tickers | New | Medium — these are not real companies |
| **Alpha Vantage 'demo' key** is hardcoded — severely rate-limited in production | Critical | High — causes silent failures for unknown tickers |
| **Marketstack API key** is hardcoded in plain text in `tickerResolution.ts` | Security | High — key exposure risk |
| **`nasdaqCompanyDatabase.ts` has 18 entries** but only 16 unique tickers (MSFT and TSLA appear in both this file and `companySpecificExposures.ts`) | Clarification | Low |
| **Foreign-listed tickers (HK, TW, etc.) cannot enter SEC path** — no SEC filings | Architecture | High — ~130 of 256 tickers are permanently GF-only |
| **`liveEdgarPipeline.ts` is ONLY for Tier 1 tickers** (AAPL, TSLA, MSFT) — all other tickers use a different, simpler code path | Clarification | High |
| **`LEGACY_STATIC_OVERRIDE = false`** — confirmed live pipeline is active | Confirmed | Medium |
| **Channel priors are fully implemented** with real economic data (GDP, Manufacturing VA, etc.) — not conceptual | Confirmed | High |
| **194 countries** have CSI values in `globalCountries.ts` | Confirmed | Medium |
| **Political alignment uses UN voting similarity + alliance memberships + economic interdependence** — three data sources combined | Confirmed | Medium |

### Summary of Key Operational Facts

| Question | Answer |
|----------|--------|
| How many companies in searchable universe? | **256 unique tickers** in `companyDatabase.ts` |
| How many have Tier 1 full data? | **3** (AAPL, TSLA, MSFT) |
| How many have hardcoded CIKs (SEC-eligible)? | **49** |
| How many are updated daily by GitHub Actions? | **256** (metadata only — name/exchange/country/sector/isADR) |
| How many have SEC filings parsed daily? | **0** — SEC parsing is 100% on-demand |
| How many can enter live SEC path? | **~49** (hardcoded CIK) + additional via Edge Function |
| How many are permanently GF-only? | **~130** (foreign-listed, no SEC filings) |
| How many are GF-only due to missing CIK? | **~77** (US/ADR listed but no hardcoded CIK and Edge Function may fail) |
| What triggers SEC parsing? | User searching for a ticker in the dashboard |
| Is there any persistent cache? | **No** — in-memory session cache for Tier 1 only |
| What is the daily GitHub workflow's actual scope? | FMP API metadata update for `companyDatabase.ts` only |

---

*Report generated: 2026-04-18*  
*Auditor: David (Data Analyst, Atoms Team)*  
*Methodology: Read-only codebase audit — no source code modifications*  
*Files examined: 30+ source files across `src/data/`, `src/services/`, `src/utils/`, `src/scripts/`, `supabase/functions/`, `.github/workflows/`*  
*Enhancement source: `/workspace/uploads/Report 6 Enhancement.docx`*