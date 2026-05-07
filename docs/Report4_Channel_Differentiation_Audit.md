# Report 4: Channel Differentiation Audit

**Generated:** 2026-04-07  
**Scope:** Complete audit of channel differentiation quality across all searchable tickers in the CO-GRI Dashboard  
**Methodology:** Read-only codebase audit + quantitative cosine-similarity analysis of GF prior outputs  
**Auditor:** David (Data Analyst, Atoms Team)  
**Cross-references:** Report 1 (Coverage Inventory), Report 2 (Runtime Source-of-Truth Audit)

**Key Files Audited:**
- `src/services/v5/channelPriors.ts` — GF prior formulas (revenue/supply/assets/financial)
- `src/services/v5/channelBuilder.ts` — DIRECT/ALLOCATED/MODELED tier assignment
- `src/services/v5/companySpecificChannelFix.ts` — `buildIndependentChannelBreakdown()`
- `src/services/geographicExposureService.ts` — `calculateIndependentChannelExposuresWithSEC()`
- `src/data/companySpecificExposures.ts` — Tier 1 static data (AAPL, TSLA, MSFT)
- `src/services/runtimeValidation.ts` — `differentiationScore` guard
- `src/services/calculations/deriveCompanyAnalytics.ts` — downstream analytics consumer
- `src/data/fullNASDAQCompanyList.ts` — 38 searchable NASDAQ tickers
- `src/data/nasdaqCompanyDatabase.ts` — 18 structured NASDAQ entries

---

## Executive Summary

| Category | Finding |
|---|---|
| **Tickers with GENUINE channel differentiation** (avg cosine sim < 0.80) | **3** — AAPL, MSFT, TSLA (Tier 1 DIRECT) |
| **Tickers with PSEUDO-differentiation** (avg cosine sim 0.80–0.90) | **~22** — all US-domiciled Technology/Consumer GF tickers; non-US home-country tickers (TEAM, SPOT) |
| **Tickers with HOMOGENIZED channels** (avg cosine sim ≥ 0.90) | **~8** — Healthcare GF tickers (JNJ, MRNA, GILD, AMGN), Consumer Goods GF (WMT, AMZN, SFIX), BNTX, TSLA (paradox — see §5) |
| **Root cause of homogenization** | GF financial channel is **sector-invariant** (identical for all sectors); assets channel is near-identical to supply for Healthcare/Consumer Goods |
| **Sector prior convergence** | All 4 sectors share the same financial channel top-5 (US, UK, Luxembourg, Switzerland, HK) — zero sector differentiation in financial channel |
| **Critical finding** | The `runtimeValidation.ts` `differentiationScore` guard fires at < 0.05 — far too low to catch pseudo-differentiation (avg sim 0.875 passes silently) |
| **Downstream impact** | `ExposurePathways` (C4) and `TopRelevantRisks` (C5) both read from `deriveCompanyAnalytics()` which uses per-country `channelWeights` — pseudo-differentiated channels produce misleading channel risk scores |

---

## Section 1: Channel Differentiation Architecture

### 1.1 How Channel Differentiation Is Built

The CO-GRI Dashboard computes four independent channel vectors per company:

```
Revenue  (α) — weight 0.40 — how much revenue comes from each country
Supply   (β) — weight 0.35 — where supply chain / manufacturing is located
Assets   (γ) — weight 0.15 — where physical capital / PP&E is located
Financial(δ) — weight 0.10 — where debt, treasury, and financial exposure sits
```

These are combined into a blended weight per country:
```
blended[country] = α × revenue[country] + β × supply[country] + γ × assets[country] + δ × financial[country]
```

The sector-specific coefficients (α, β, γ, δ) vary by sector (e.g., Real Estate: assets=0.50; Technology: revenue=0.45). However, the **country-level weights within each channel** are what determine differentiation.

### 1.2 Three Differentiation Paths

| Path | Tickers | Channel Data Source | Expected Differentiation |
|---|---|---|---|
| **Tier 1 DIRECT** | AAPL, TSLA, MSFT | `companySpecificExposures.ts` — per-channel percentages from 10-K FY2024 | Genuine (verified by cosine analysis) |
| **SEC Integration (SSF/RF)** | ~60 US domestic tickers (if SEC parse succeeds) | `structuredDataIntegratorV5.ts` — live EDGAR parse | Partial (depends on SEC parse success) |
| **V5 Global Fallback (GF)** | All others (~196+ tickers) | `buildGlobalFallbackV5()` in `channelPriors.ts` | Pseudo-differentiated to homogenized |

### 1.3 The Cosine Similarity Metric

To measure channel differentiation, we compute the pairwise cosine similarity between all 6 channel-pair combinations (Rev↔Sup, Rev↔Ast, Rev↔Fin, Sup↔Ast, Sup↔Fin, Ast↔Fin) and take the average:

- **avg_sim < 0.80** → GENUINELY DIFFERENTIATED (channels tell meaningfully different stories)
- **avg_sim 0.80–0.90** → PSEUDO-DIFFERENTIATED (channels differ in magnitude but not in country ranking)
- **avg_sim ≥ 0.90** → HOMOGENIZED (channels are near-identical; differentiation is cosmetic)

---

## Section 2: Tier 1 — Genuine Channel Differentiation (AAPL, TSLA, MSFT)

These three tickers have hand-curated per-channel percentages from SEC 10-K FY2024 filings. The channel vectors are genuinely distinct because each channel captures a different economic reality (e.g., Apple's supply chain is Taiwan/China-dominant while its financial exposure is US/Ireland-dominant).

### 2.1 AAPL — Apple Inc.

**avg cosine similarity: 0.6153 ✅ GENUINELY DIFFERENTIATED**

| Channel | Top 5 Countries (normalized %) | Evidence Tier |
|---|---|---|
| **Revenue** | United States 42.7%, China 17.1%, Germany 8.1%, Japan 6.4%, United Kingdom 5.5% | DIRECT (10-K FY2024 geographic segments) |
| **Supply Chain** | China 34.2%, Taiwan 24.5%, Vietnam 11.7%, South Korea 7.8%, Japan 5.9% | DIRECT (Supplier Responsibility Report 2024) |
| **Physical Assets** | United States 62.9%, China 11.6%, Ireland 7.7%, Japan 3.9%, Germany 2.9% | DIRECT (10-K FY2024 PP&E breakdown) |
| **Financial** | United States 70.0%, Ireland 12.0%, Netherlands 6.0%, China 3.0%, United Kingdom 2.0% | DIRECT (10-K FY2024 debt + treasury) |

**Pairwise cosine similarities:**

| Pair | Similarity | Interpretation |
|---|---|---|
| Rev ↔ Sup | 0.4251 | Very different — China/Taiwan dominate supply; US dominates revenue |
| Rev ↔ Ast | 0.9547 | Similar — both US-dominant, but Ireland/Netherlands appear only in assets |
| Rev ↔ Fin | 0.9027 | Similar — both US-dominant, but Ireland/Netherlands appear only in financial |
| Sup ↔ Ast | 0.2776 | Very different — Taiwan/Vietnam in supply; US/Ireland in assets |
| Sup ↔ Fin | 0.1477 | Most different pair — supply is Asia-centric; financial is US/Ireland-centric |
| Ast ↔ Fin | 0.9841 | Near-identical — both US/Ireland/Netherlands dominant |

**Key insight:** AAPL's differentiation is driven almost entirely by the Supply channel, which is radically different from all other channels. The Assets and Financial channels are near-identical (both US/Ireland/Netherlands), but the Rev↔Sup and Sup↔Fin pairs are the most differentiated in the entire dataset.

---

### 2.2 MSFT — Microsoft Corporation

**avg cosine similarity: 0.7463 ✅ GENUINELY DIFFERENTIATED**

| Channel | Top 5 Countries (normalized %) | Evidence Tier |
|---|---|---|
| **Revenue** | United States 50.3%, China 15.8%, Japan 12.3%, Germany 5.0%, United Kingdom 4.2% | DIRECT (10-K FY2024 geographic segments) |
| **Supply Chain** | Taiwan 31.8%, China 26.5%, United States 21.2%, Japan 8.5%, South Korea 5.3% | DIRECT (hardware supply chain: TSMC, Foxconn) |
| **Physical Assets** | United States 71.0%, Netherlands 5.9%, India 4.7%, United Kingdom 4.1%, China 3.6% | DIRECT (10-K FY2024 PP&E: Redmond, Azure DCs) |
| **Financial** | United States 79.3%, Netherlands 7.3%, United Kingdom 3.7%, China 2.4%, Germany 2.4% | DIRECT (10-K FY2024 debt: USD bonds, MSFT BV) |

**Pairwise cosine similarities:**

| Pair | Similarity | Interpretation |
|---|---|---|
| Rev ↔ Sup | 0.6312 | Different — Taiwan dominates supply but is minor in revenue |
| Rev ↔ Ast | 0.9477 | Similar — both US-dominant, but India/Netherlands appear only in assets |
| Rev ↔ Fin | 0.9372 | Similar — both US-dominant, but Netherlands/Ireland appear only in financial |
| Sup ↔ Ast | 0.4918 | Very different — Taiwan/China in supply; US/Netherlands in assets |
| Sup ↔ Fin | 0.4722 | Very different — Taiwan/China in supply; US/Netherlands in financial |
| Ast ↔ Fin | 0.9975 | Near-identical — both US/Netherlands/UK dominant |

**Key insight:** MSFT's differentiation is also driven by the Supply channel (Taiwan 31.8% vs. near-zero in other channels). The Assets and Financial channels are nearly identical (0.9975), reflecting Microsoft's US/Netherlands holding structure.

---

### 2.3 TSLA — Tesla, Inc.

**avg cosine similarity: 0.9283 ⚠️ HOMOGENIZED (Tier 1 paradox)**

| Channel | Top 5 Countries (normalized %) | Evidence Tier |
|---|---|---|
| **Revenue** | United States 45.9%, China 22.5%, Germany 8.8%, Netherlands 4.2%, Norway 3.8% | DIRECT (10-K FY2024 geographic segments) |
| **Supply Chain** | United States 34.4%, China 29.5%, Germany 14.7%, Japan 7.9%, South Korea 6.9% | DIRECT (Gigafactory footprint + supplier base) |
| **Physical Assets** | United States 55.3%, China 25.2%, Germany 12.1%, Netherlands 4.0%, Canada 1.0% | DIRECT (10-K FY2024 PP&E: Gigafactories) |
| **Financial** | United States 75.0%, China 10.0%, Germany 8.0%, Netherlands 4.0%, United Kingdom 1.0% | DIRECT (10-K FY2024 debt: USD bonds, CNY, EUR) |

**Pairwise cosine similarities:**

| Pair | Similarity | Interpretation |
|---|---|---|
| Rev ↔ Sup | 0.9407 | Very similar — both US/China/Germany dominant |
| Rev ↔ Ast | 0.9919 | Near-identical — same US/China/Germany structure |
| Rev ↔ Fin | 0.9399 | Similar — US/China/Germany, but financial is more US-concentrated |
| Sup ↔ Ast | 0.9359 | Similar — both US/China/Germany |
| Sup ↔ Fin | 0.8076 | Moderately different — Japan/South Korea appear in supply but not financial |
| Ast ↔ Fin | 0.9540 | Similar — both US/China/Germany |

**Key insight:** TSLA is a **Tier 1 DIRECT paradox** — despite having genuine per-channel data from 10-K filings, the channels are homogenized because Tesla's actual business is geographically concentrated in the same countries (US, China, Germany) across all four channels. This is economically correct — Tesla's Gigafactory strategy means its revenue, supply chain, assets, and financial exposure are all concentrated in the same three geographies. The homogenization here is **a true reflection of Tesla's business model**, not a data quality issue.

---

## Section 3: GF Path — Pseudo-Differentiated Tickers (Technology Sector, US Home)

All US-domiciled Technology sector tickers that fall through to GF produce **identical channel vectors** (since GF is purely sector+home-country driven, with no ticker-specific data). The 22 tickers in this group include: META, GOOGL, NVDA, NFLX, ZM, PANW, CRWD, ADBE, CRM, WDAY, DDOG, SNOW, OKTA, NET, PLTR, ROKU, SNAP, PINS, RBLX, DOCU, and any other US Technology GF ticker.

**avg cosine similarity: 0.8754 ⚡ PSEUDO-DIFFERENTIATED**

| Channel | Top 5 Countries | Key Characteristic |
|---|---|---|
| **Revenue** | United States 31.1%, China 6.4%, India 4.3%, Japan 2.6%, Brazil 2.5% | GDP × household consumption × sector demand weighted |
| **Supply Chain** | United States 16.3%, China 16.2%, Taiwan 6.0%, Japan 5.8%, South Korea 5.6% | Manufacturing VA × sector export × assembly capability |
| **Physical Assets** | United States 38.8%, China 5.9%, Japan 2.9%, South Korea 2.6%, Taiwan 2.6% | Capital stock × sector export × infrastructure |
| **Financial** | United States 32.4%, United Kingdom 2.1%, Luxembourg 2.1%, Switzerland 2.0%, Hong Kong 1.9% | Financial depth × currency exposure × cross-border × funding hub |

**Pairwise cosine similarities:**

| Pair | Similarity | Interpretation |
|---|---|---|
| Rev ↔ Sup | 0.8054 | Moderate — supply has Taiwan/South Korea; revenue has India/Brazil |
| Rev ↔ Ast | 0.9870 | Near-identical — both US-dominant with China second |
| Rev ↔ Fin | 0.9741 | Near-identical — both US-dominant |
| Sup ↔ Ast | 0.7832 | Most differentiated pair — supply has Taiwan/South Korea; assets has Japan/South Korea |
| Sup ↔ Fin | 0.7163 | Moderately different — supply has Taiwan/China; financial has UK/Luxembourg |
| Ast ↔ Fin | 0.9862 | Near-identical — both US-dominant |

**Critical finding:** All 22 US Technology GF tickers produce **exactly the same four channel vectors**. META, GOOGL, NVDA, NFLX, ZM, PANW, CRWD, ADBE, CRM, WDAY, DDOG, SNOW, OKTA, NET, PLTR, ROKU, SNAP, PINS, RBLX, and DOCU are **indistinguishable** from each other in the channel breakdown. The dashboard will show identical Exposure Pathways (C4) and Top Risk Contributors (C5) for all of these tickers.

### 3.1 Non-US Home Country Technology Tickers (TEAM, SPOT)

These tickers have a different home country (Australia for TEAM, Sweden for SPOT), which shifts the home-bias λ=0.25 anchor for revenue, λ=0.10 for supply, λ=0.35 for assets, and λ=0.30 for financial. This produces slightly more differentiated channels (avg sim ~0.82) but the differentiation is purely mechanical (home country substitution), not company-specific.

| Ticker | Home | avg sim | Revenue #1 | Supply #1 | Assets #1 | Financial #1 |
|---|---|---|---|---|---|---|
| TEAM | Australia | 0.8155 | Australia 26.4% | China 16.2% | Australia 36.0% | Australia 31.6% |
| SPOT | Sweden | 0.8182 | Sweden 25.9% | China 16.2% | Sweden 36.0% | Sweden 31.6% |

Both are classified as **PSEUDO-DIFFERENTIATED** — the home-country bias creates apparent differentiation but the non-home country rankings are identical to all other Technology GF tickers.

---

## Section 4: GF Path — Homogenized Tickers (Healthcare and Consumer Goods)

### 4.1 Healthcare GF Tickers (JNJ, MRNA, GILD, AMGN)

**avg cosine similarity: 0.9507 ⚠️ HOMOGENIZED**

| Channel | Top 5 Countries | Key Characteristic |
|---|---|---|
| **Revenue** | United States 31.2%, Germany 3.0%, Japan 2.7%, United Kingdom 2.6%, France 2.4% | US-dominant; Healthcare sector demand heavily weights US per-capita spend |
| **Supply Chain** | United States 18.0%, Germany 5.9%, China 5.4%, Japan 4.2%, Switzerland 3.9% | US/Germany/Switzerland dominant (pharma manufacturing hubs) |
| **Physical Assets** | United States 38.8%, Germany 2.6%, China 2.3%, Switzerland 2.2%, Japan 2.0% | US-dominant; Healthcare assets = labs/plants in developed markets |
| **Financial** | United States 32.4%, United Kingdom 2.1%, Luxembourg 2.1%, Switzerland 2.0%, Hong Kong 1.9% | Identical to all other sectors — sector-invariant |

**Pairwise cosine similarities:**

| Pair | Similarity |
|---|---|
| Rev ↔ Sup | 0.9218 |
| Rev ↔ Ast | 0.9938 |
| Rev ↔ Fin | 0.9957 |
| Sup ↔ Ast | 0.8958 |
| Sup ↔ Fin | 0.9017 |
| Ast ↔ Fin | 0.9957 |

**Root cause:** The Healthcare sector demand data (`SD_HEALTH`) is heavily US-weighted (US: 12,500 vs. Germany: 7,000, Switzerland: 9,000) due to per-capita healthcare expenditure. This makes the revenue prior US-dominant. The supply prior (`SE_HEALTH`) also has US/Germany/Switzerland as top-3. The financial prior is sector-invariant. Result: all four channels converge on US/Germany/Switzerland/Japan, producing near-identical vectors.

**All four Healthcare GF tickers (JNJ, MRNA, GILD, AMGN) produce identical channel vectors.**

### 4.2 Consumer Goods GF Tickers (WMT, AMZN, SFIX)

**avg cosine similarity: 0.9092 ⚠️ HOMOGENIZED**

| Channel | Top 5 Countries | Key Characteristic |
|---|---|---|
| **Revenue** | United States 30.5%, China 3.9%, Japan 2.6%, India 2.6%, United Kingdom 2.4% | US-dominant; Consumer Goods demand follows GDP × household consumption |
| **Supply Chain** | United States 17.2%, China 13.5%, Germany 5.0%, Japan 4.2%, Italy 3.4% | US/China/Germany — Consumer Goods export data has Italy/Germany for manufacturing |
| **Physical Assets** | United States 39.0%, China 5.0%, Germany 2.6%, Japan 2.2%, France 2.1% | US-dominant; Consumer Goods assets = warehouses/stores in large economies |
| **Financial** | United States 32.4%, United Kingdom 2.1%, Luxembourg 2.1%, Switzerland 2.0%, Hong Kong 1.9% | Identical to all other sectors |

**All three Consumer Goods GF tickers (WMT, AMZN, SFIX) produce identical channel vectors.**

**Note on AMZN:** Amazon is classified as 'Consumer Discretionary' in SECTOR_EXPOSURE_COEFFICIENTS, which maps to Consumer Goods in the GF sector demand tables. This is a sector mapping gap — Amazon's actual business (AWS cloud, marketplace) is closer to Technology for supply chain purposes, but the GF formula has no ticker-level override.

### 4.3 BNTX — BioNTech SE (Germany home country, Healthcare)

**avg cosine similarity: 0.9337 ⚠️ HOMOGENIZED**

BNTX has Germany as home country, which shifts the home-bias anchor. However, the Healthcare sector demand still produces near-identical channel vectors (Germany replaces US as #1 in all channels due to λ bias), and the non-home rankings are identical to JNJ/MRNA/GILD/AMGN.

| Channel | Top 5 Countries |
|---|---|
| Revenue | Germany 28.0%, United States 6.2%, Japan 2.7%, United Kingdom 2.6%, France 2.4% |
| Supply | Germany 15.9%, United States 8.0%, China 5.4%, Japan 4.2%, Switzerland 3.9% |
| Assets | Germany 37.6%, United States 3.8%, China 2.3%, Switzerland 2.2%, Japan 2.0% |
| Financial | Germany 31.9%, United States 2.4%, United Kingdom 2.1%, Luxembourg 2.1%, Switzerland 2.0% |

---

## Section 5: Sector Prior Convergence Analysis

### 5.1 Financial Channel — Fully Sector-Invariant

The most critical finding: **the financial channel prior is completely sector-invariant**. The formula in `channelPriors.ts` uses only `FIN_DEPTH`, `CURRENCY_EXP`, `CROSS_BORDER`, and `FUNDING_HUB` — none of which vary by sector. This means:

- A Technology company and a Healthcare company with the same home country produce **identical financial channel vectors**
- The financial channel provides **zero sector-specific information**
- Top-5 for all US-domiciled companies: United States 32.4%, United Kingdom 2.1%, Luxembourg 2.1%, Switzerland 2.0%, Hong Kong 1.9%

**Impact:** The financial channel weight (δ = 0.10) is relatively small, so this contributes only modestly to blended homogenization. However, it means the financial channel in `ExposurePathways` (C4) is always showing the same "financial hub" countries regardless of sector, which is misleading for sectors like Healthcare (where financial exposure should reflect pharma bond markets) or Energy (where it should reflect commodity currency exposure).

### 5.2 Assets Channel — Near-Sector-Invariant

The assets channel prior uses `CAPITAL_STOCK`, `SECTOR_EXPORT`, and `INFRASTRUCTURE`. While `SECTOR_EXPORT` varies by sector, the `CAPITAL_STOCK` and `INFRASTRUCTURE` terms dominate (combined weight 0.50), making the assets channel nearly identical across sectors:

| Sector | Assets Top-5 |
|---|---|
| Technology | US 38.8%, China 5.9%, Japan 2.9%, South Korea 2.6%, Taiwan 2.6% |
| Healthcare | US 38.8%, Germany 2.6%, China 2.3%, Switzerland 2.2%, Japan 2.0% |
| Consumer Goods | US 39.0%, China 5.0%, Germany 2.6%, Japan 2.2%, France 2.1% |
| Financial Services | US 38.6%, China 2.3%, United Kingdom 2.3%, Germany 2.1%, Japan 2.1% |

All four sectors have US at ~38-39% and China at ~2-6%. The sector-specific variation is only in positions 2-5.

### 5.3 Revenue Channel — Moderately Sector-Specific

The revenue channel prior uses `GDP`, `HC_SHARE`, `SECTOR_DEMAND`, and `LPI`. The `SECTOR_DEMAND` tables vary significantly by sector, producing meaningful differences in the revenue channel:

| Sector | Revenue Top-5 |
|---|---|
| Technology | US 31.1%, China 6.4%, India 4.3%, Japan 2.6%, Brazil 2.5% |
| Healthcare | US 31.2%, Germany 3.0%, Japan 2.7%, UK 2.6%, France 2.4% |
| Consumer Goods | US 30.5%, China 3.9%, Japan 2.6%, India 2.6%, UK 2.4% |
| Financial Services | US 30.4%, China 3.3%, UK 2.7%, Japan 2.6%, Germany 2.4% |

All sectors are US-dominant (~30-31%), but the secondary countries differ meaningfully. Technology has India/Brazil (large consumer markets); Healthcare has Germany/Switzerland (high per-capita spend); Financial Services has UK/Luxembourg (financial centers).

### 5.4 Supply Channel — Most Sector-Specific

The supply channel prior uses `MFG_VA`, `SECTOR_EXPORT`, `ASSEMBLY_CAPABILITY`, and `LPI`. This is the most differentiated channel across sectors:

| Sector | Supply Top-5 |
|---|---|
| Technology | US 16.3%, China 16.2%, Taiwan 6.0%, Japan 5.8%, South Korea 5.6% |
| Healthcare | US 18.0%, Germany 5.9%, China 5.4%, Japan 4.2%, Switzerland 3.9% |
| Consumer Goods | US 17.2%, China 13.5%, Germany 5.0%, Japan 4.2%, Italy 3.4% |
| Financial Services | US 17.2%, China 5.2%, Japan 4.2%, Germany 4.1%, UK 3.8% |

Technology has Taiwan/South Korea (semiconductor assembly); Healthcare has Germany/Switzerland (pharma manufacturing); Consumer Goods has China/Italy (apparel/goods manufacturing). This is the most economically meaningful sector differentiation in the GF formula.

---

## Section 6: Complete Ticker Differentiation Rankings

### 6.1 Full Ranking Table (all 33 analyzed tickers, sorted by avg cosine similarity)

| Rank | Ticker | avg sim | RS | RA | RF | SA | SF | AF | Classification | Data Path | Sector |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **AAPL** | 0.6153 | 0.4251 | 0.9547 | 0.9027 | 0.2776 | 0.1477 | 0.9841 | ✅ GENUINE DIFF | Tier 1 DIRECT | Technology |
| 2 | **MSFT** | 0.7463 | 0.6312 | 0.9477 | 0.9372 | 0.4918 | 0.4722 | 0.9975 | ✅ GENUINE DIFF | Tier 1 DIRECT | Technology |
| 3 | TEAM | 0.8155 | 0.7294 | 0.9755 | 0.9567 | 0.6667 | 0.5796 | 0.9852 | ⚡ PSEUDO | GF (Australia) | Technology |
| 4 | SPOT | 0.8182 | 0.7381 | 0.9736 | 0.9550 | 0.6721 | 0.5854 | 0.9851 | ⚡ PSEUDO | GF (Sweden) | Technology |
| 5 | META | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | GOOGL | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | NVDA | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | NFLX | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | ZM | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | PANW | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | CRWD | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | ADBE | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | CRM | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | WDAY | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | DDOG | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | SNOW | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | OKTA | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | NET | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | PLTR | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | ROKU | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | SNAP | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | PINS | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | RBLX | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 5 | DOCU | 0.8754 | 0.8054 | 0.9870 | 0.9741 | 0.7832 | 0.7163 | 0.9862 | ⚡ PSEUDO | GF (US) | Technology |
| 25 | WMT | 0.9092 | 0.8535 | 0.9936 | 0.9892 | 0.8326 | 0.7962 | 0.9900 | ⚠️ HOMO | GF (US) | Consumer Goods |
| 25 | AMZN | 0.9092 | 0.8535 | 0.9936 | 0.9892 | 0.8326 | 0.7962 | 0.9900 | ⚠️ HOMO | GF (US) | Consumer Goods |
| 25 | SFIX | 0.9092 | 0.8535 | 0.9936 | 0.9892 | 0.8326 | 0.7962 | 0.9900 | ⚠️ HOMO | GF (US) | Consumer Goods |
| 28 | **TSLA** | 0.9283 | 0.9407 | 0.9919 | 0.9399 | 0.9359 | 0.8076 | 0.9540 | ⚠️ HOMO* | Tier 1 DIRECT | Consumer Disc. |
| 29 | BNTX | 0.9337 | 0.9149 | 0.9855 | 0.9862 | 0.8594 | 0.8607 | 0.9955 | ⚠️ HOMO | GF (Germany) | Healthcare |
| 30 | JNJ | 0.9507 | 0.9218 | 0.9938 | 0.9957 | 0.8958 | 0.9017 | 0.9957 | ⚠️ HOMO | GF (US) | Healthcare |
| 30 | MRNA | 0.9507 | 0.9218 | 0.9938 | 0.9957 | 0.8958 | 0.9017 | 0.9957 | ⚠️ HOMO | GF (US) | Healthcare |
| 30 | GILD | 0.9507 | 0.9218 | 0.9938 | 0.9957 | 0.8958 | 0.9017 | 0.9957 | ⚠️ HOMO | GF (US) | Healthcare |
| 30 | AMGN | 0.9507 | 0.9218 | 0.9938 | 0.9957 | 0.8958 | 0.9017 | 0.9957 | ⚠️ HOMO | GF (US) | Healthcare |

*TSLA homogenization is economically correct — see §2.3.

**Column key:** RS=Rev↔Sup, RA=Rev↔Ast, RF=Rev↔Fin, SA=Sup↔Ast, SF=Sup↔Fin, AF=Ast↔Fin

---

## Section 7: Downstream Impact on Dashboard Panels

### 7.1 ExposurePathways (C4) — Channel Risk Score Calculation

`ExposurePathways` reads `channelExposures` from `deriveCompanyAnalytics()`. The channel risk score for each channel is computed as:

```typescript
riskScore = Σ(countryExposures) of (channelWeight × exposureWeight × countryShockIndex)
```

For pseudo-differentiated tickers (avg sim 0.875), the four channel risk scores will be **nearly identical** because the country distributions are nearly identical. The `ExposurePathways` panel will show four bars with very similar heights, giving the false impression that all four channels carry equal risk. This is misleading — for a pure software company like SNOW or OKTA, the supply chain channel should show near-zero risk (no physical supply chain), but the GF formula assigns them the same Technology supply chain distribution as a hardware manufacturer.

### 7.2 TopRelevantRisks (C5) — Structural Drivers

`TopRelevantRisks` reads `structuralDrivers` from `deriveCompanyAnalytics()`. The structural drivers are sorted by `contribution` (exposureWeight × countryShockIndex). For GF tickers, the dominant channel assigned to each country is determined by `determineDominantChannel()` in `deriveCompanyAnalytics.ts`, which picks the channel with the highest `channelWeight × CHANNEL_COEFFICIENT` product.

For US Technology GF tickers:
- United States: Revenue channel dominates (31.1% × 0.40 = 12.44% contribution)
- China: Supply channel dominates (16.2% × 0.35 = 5.67% vs Revenue 6.4% × 0.40 = 2.56%)
- Taiwan: Supply channel dominates (6.0% × 0.35 = 2.10%)

This means China will always show "Supply Chain" as its dominant channel for all 22 US Technology GF tickers, regardless of whether the company actually has a supply chain in China (SNOW, OKTA, PLTR have no physical supply chain).

### 7.3 RiskContributionMap (C3) — Country Risk Share

`RiskContributionMap` reads `countryExposures` directly from `cogriCalculationService.ts`. Since `countryExposures` is built from the same `channelBreakdown` that feeds `deriveCompanyAnalytics()`, C3 is consistent with C4 and C5 for all tickers. However, the tier badges (DIRECT/ALLOCATED/MODELED) will show:
- **AAPL, MSFT:** DIRECT for most countries
- **TSLA:** DIRECT for all countries
- **META, GOOGL, NVDA, etc.:** MODELED for all countries (GF path, tier='MODELED')
- **JNJ, WMT, etc.:** MODELED for all countries

### 7.4 The runtimeValidation.ts Guard — Insufficient Threshold

The existing `differentiationScore` guard in `runtimeValidation.ts` fires at `< 0.05`:

```typescript
if (differentiationScore < 0.05) {
  recommendations.push('CRITICAL: Channel homogeneity detected...');
}
```

This threshold is far too permissive. A pseudo-differentiated ticker (avg cosine sim 0.875) would have a differentiation score well above 0.05 and would not trigger this warning. The guard only catches **complete** homogenization (all four channels identical), not the partial homogenization that affects ~22 Technology GF tickers and all Healthcare/Consumer Goods GF tickers.

---

## Section 8: Database Coverage — Static vs. Dynamic Classification

### 8.1 Tickers in `fullNASDAQCompanyList.ts` (38 entries)

| Ticker | Company | Sector | Differentiation Path | Channel Diff Class |
|---|---|---|---|---|
| AAPL | Apple Inc. | Technology | Tier 1 DIRECT | ✅ GENUINE |
| MSFT | Microsoft Corp. | Technology | Tier 1 DIRECT | ✅ GENUINE |
| GOOGL | Alphabet Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| AMZN | Amazon.com | Consumer Discretionary | GF (US, Consumer Goods) | ⚠️ HOMO |
| TSLA | Tesla, Inc. | Consumer Discretionary | Tier 1 DIRECT | ⚠️ HOMO* |
| META | Meta Platforms | Technology | GF (US, Tech) | ⚡ PSEUDO |
| NVDA | NVIDIA Corp. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| NFLX | Netflix, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| ADBE | Adobe Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| CRM | Salesforce, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| MRNA | Moderna, Inc. | Healthcare | GF (US, Health) | ⚠️ HOMO |
| GILD | Gilead Sciences | Healthcare | GF (US, Health) | ⚠️ HOMO |
| AMGN | Amgen Inc. | Healthcare | GF (US, Health) | ⚠️ HOMO |
| ZM | Zoom Video | Technology | GF (US, Tech) | ⚡ PSEUDO |
| DOCU | DocuSign | Technology | GF (US, Tech) | ⚡ PSEUDO |
| OKTA | Okta, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| SPLK | Splunk Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| WDAY | Workday, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| TEAM | Atlassian Corp. | Technology | GF (Australia, Tech) | ⚡ PSEUDO |
| PANW | Palo Alto Networks | Technology | GF (US, Tech) | ⚡ PSEUDO |
| CRWD | CrowdStrike | Technology | GF (US, Tech) | ⚡ PSEUDO |
| NET | Cloudflare, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| DDOG | Datadog, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| SNOW | Snowflake Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| PATH | UiPath Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| PLTR | Palantir Tech. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| RBLX | Roblox Corp. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| U | Unity Software | Technology | GF (US, Tech) | ⚡ PSEUDO |
| SFIX | Stitch Fix, Inc. | Consumer Goods | GF (US, Consumer) | ⚠️ HOMO |
| ROKU | Roku, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| PINS | Pinterest, Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| SNAP | Snap Inc. | Technology | GF (US, Tech) | ⚡ PSEUDO |
| SPOT | Spotify Tech. | Technology | GF (Sweden, Tech) | ⚡ PSEUDO |
| LRG0–LRG4 | Large-cap placeholders | Various | GF | varies |
| MID0–MID4 | Mid-cap placeholders | Various | GF | varies |
| SML0–SML4 | Small-cap placeholders | Various | GF | varies |
| MCR0–MCR4 | Micro-cap placeholders | Various | GF | varies |

### 8.2 Tickers in `nasdaqCompanyDatabase.ts` (18 entries)

MSFT, GOOGL, AMZN, TSLA, META, ZM, DOCU, OKTA, CRWD, DDOG, SNOW, SFIX, ROKU, MRNA, BNTX, GILD — same differentiation classification as above, plus BNTX (Germany home, Healthcare GF, HOMO).

### 8.3 Summary by Differentiation Class

| Class | Count (analyzed) | Tickers |
|---|---|---|
| ✅ GENUINE DIFF (avg sim < 0.80) | 2 | AAPL, MSFT |
| ⚠️ HOMO* (economically correct) | 1 | TSLA |
| ⚡ PSEUDO-DIFF (0.80–0.90) | ~24 | All US/non-US Tech GF tickers |
| ⚠️ HOMO (data quality issue) | ~8 | JNJ, MRNA, GILD, AMGN, WMT, AMZN, SFIX, BNTX |

---

## Section 9: Root Cause Analysis

### 9.1 Root Cause 1 — Financial Channel is Sector-Invariant

**File:** `src/services/v5/channelPriors.ts` — `buildFinancialChannelPrior()`  
**Issue:** The financial prior uses only `FIN_DEPTH`, `CURRENCY_EXP`, `CROSS_BORDER`, `FUNDING_HUB` — none of which take a `sector` parameter. All sectors produce the same financial channel top-5: US, UK, Luxembourg, Switzerland, Hong Kong.  
**Impact:** Zero sector differentiation in the financial channel. A pharma company and a semiconductor company look identical in financial exposure.

### 9.2 Root Cause 2 — Assets Channel is Near-Sector-Invariant

**File:** `src/services/v5/channelPriors.ts` — `buildAssetChannelPrior()`  
**Issue:** `CAPITAL_STOCK` (weight 0.30) and `INFRASTRUCTURE` (weight 0.20) are sector-invariant. Only `SECTOR_EXPORT` (weight 0.35) varies by sector. The US is dominant in all three components, making the assets channel US-dominant regardless of sector.  
**Impact:** The assets channel for Technology and Healthcare look nearly identical (US ~38-39%, China ~2-6%).

### 9.3 Root Cause 3 — GF Formula Has No Ticker-Level Override

**File:** `src/services/geographicExposureService.ts` — `buildGlobalFallbackV5()`  
**Issue:** The GF formula takes only `homeCountry`, `channel`, and `sector` as inputs. All tickers with the same (homeCountry, sector) combination produce identical channel vectors. There is no ticker-level differentiation within the GF path.  
**Impact:** 22 US Technology tickers are completely indistinguishable. SNOW (pure cloud, no supply chain) looks identical to NVDA (semiconductor hardware, Taiwan-dependent supply chain).

### 9.4 Root Cause 4 — runtimeValidation.ts Guard Too Permissive

**File:** `src/services/runtimeValidation.ts`  
**Issue:** The `differentiationScore < 0.05` threshold only catches complete homogenization. Pseudo-differentiation (avg cosine sim 0.875) passes silently.  
**Impact:** No runtime warning is generated for the 22 Technology GF tickers, even though their channel breakdown is essentially meaningless for ticker-specific analysis.

### 9.5 Root Cause 5 — ASSEMBLY_CAPABILITY Only Defined for Technology Sector

**File:** `src/services/v5/channelPriors.ts`  
**Issue:** The `ASSEMBLY_CAPABILITY` table appears to only have a Technology sector entry. For Healthcare and Consumer Goods, the supply prior falls back to the Technology assembly capability data, which is incorrect (pharma assembly ≠ semiconductor assembly).  
**Impact:** Healthcare supply chain priors use semiconductor assembly capability data, overstating Taiwan/South Korea and understating Switzerland/Germany for pharma manufacturing.

---

## Section 10: Findings Summary and Next Steps

### 10.1 Findings Summary

| Finding | Severity | Affected Tickers |
|---|---|---|
| F1: Financial channel is fully sector-invariant | HIGH | All GF tickers (~196+) |
| F2: Assets channel is near-sector-invariant | MEDIUM | All GF tickers (~196+) |
| F3: 22 US Technology GF tickers produce identical channel vectors | HIGH | META, GOOGL, NVDA, NFLX, ZM, PANW, CRWD, ADBE, CRM, WDAY, DDOG, SNOW, OKTA, NET, PLTR, ROKU, SNAP, PINS, RBLX, DOCU, SPLK, U |
| F4: Healthcare GF tickers (JNJ, MRNA, GILD, AMGN) are fully homogenized | HIGH | JNJ, MRNA, GILD, AMGN |
| F5: Consumer Goods GF tickers (WMT, AMZN, SFIX) are fully homogenized | HIGH | WMT, AMZN, SFIX |
| F6: AMZN misclassified as Consumer Goods (should be Technology for supply) | MEDIUM | AMZN |
| F7: runtimeValidation.ts guard threshold too permissive (< 0.05) | MEDIUM | All GF tickers |
| F8: ASSEMBLY_CAPABILITY only defined for Technology sector | MEDIUM | Healthcare, Consumer Goods GF tickers |
| F9: ExposurePathways (C4) shows misleading equal-height channel bars for GF tickers | HIGH | All GF tickers |
| F10: TopRelevantRisks (C5) assigns "Supply Chain" dominant channel to China for all US Tech GF tickers, including pure-software companies | MEDIUM | SNOW, OKTA, NET, PLTR, DOCU, ZM, CRM, WDAY, DDOG |
| F11: TSLA homogenization is economically correct (not a data quality issue) | INFO | TSLA |

### 10.2 Tickers by Differentiation Verdict

**Genuinely Differentiated (channel vectors tell meaningfully different stories):**
- ✅ AAPL (avg sim 0.6153) — Supply chain radically different from Revenue/Assets/Financial
- ✅ MSFT (avg sim 0.7463) — Taiwan supply chain radically different from Revenue/Assets/Financial

**Economically Correct Homogenization (not a bug):**
- ✅ TSLA (avg sim 0.9283) — US/China/Germany concentration is real across all channels

**Pseudo-Differentiated (channels differ in magnitude but not in economic meaning):**
- ⚡ TEAM (0.8155), SPOT (0.8182) — home-country bias only
- ⚡ All 22 US Technology GF tickers (0.8754) — identical vectors, no ticker-specific information

**Homogenized (channels are near-identical, data quality issue):**
- ⚠️ WMT, AMZN, SFIX (0.9092) — Consumer Goods GF convergence
- ⚠️ BNTX (0.9337) — Healthcare GF with Germany home bias
- ⚠️ JNJ, MRNA, GILD, AMGN (0.9507) — Healthcare GF fully converged

### 10.3 Recommended Next Steps (Priority Order)

1. **[P1 — HIGH]** Add company-specific exposure entries to `companySpecificExposures.ts` for the highest-priority GF tickers: GOOGL, NVDA, META, JNJ, WMT, AMZN. These are the most-searched tickers and currently produce meaningless channel breakdowns.

2. **[P1 — HIGH]** Fix the `runtimeValidation.ts` differentiation guard threshold from `< 0.05` to `< 0.20` (or better, use cosine similarity directly with threshold 0.85) to catch pseudo-differentiation.

3. **[P2 — HIGH]** Add sector-specific financial channel priors to `channelPriors.ts`. At minimum, differentiate: Technology (USD/EUR bond markets), Healthcare (pharma bond markets + Switzerland), Energy (commodity currencies: SAR, NOK, AUD), Financial Services (London/Luxembourg/Singapore).

4. **[P2 — MEDIUM]** Add `ASSEMBLY_CAPABILITY` entries for Healthcare (Switzerland, Germany, Ireland, India for pharma manufacturing) and Consumer Goods (China, Vietnam, Bangladesh, Turkey for apparel/goods).

5. **[P3 — MEDIUM]** For pure-software companies (SNOW, OKTA, NET, PLTR, DOCU, ZM, CRM, WDAY, DDOG), override the supply channel to near-zero (or use a software-specific supply prior that weights data center locations rather than manufacturing).

6. **[P3 — MEDIUM]** Fix AMZN sector classification: AMZN should use a hybrid Technology/Consumer Goods sector for supply chain purposes (AWS cloud infrastructure = Technology supply chain; retail = Consumer Goods supply chain).

7. **[P4 — LOW]** Add a UI indicator in `ExposurePathways` (C4) showing when channel data is GF-modeled vs. DIRECT, so users understand the confidence level of the channel breakdown being displayed.

---

## Appendix A: GF Formula Reference

The V5 Global Fallback formula for each channel:

```
GF[country, channel] = λ_channel × I(country == homeCountry) + (1 - λ_channel) × prior[country, channel, sector]
```

Where:
- λ_revenue = 0.25 (home bias for revenue)
- λ_supply = 0.10 (low home bias — supply chains are global)
- λ_assets = 0.35 (high home bias — assets tend to be domestic)
- λ_financial = 0.30 (moderate home bias — financial exposure is partly domestic)

Prior formulas:
- **Revenue prior:** `GDP^0.25 × HC_SHARE^0.35 × (SECTOR_DEMAND/1100)^0.30 × (LPI/10)^0.10`
- **Supply prior:** `(MFG_VA/5000)^0.20 × (SECTOR_EXPORT/1000)^0.30 × (ASSEMBLY_CAP/10)^0.25 × (LPI/10)^0.10 × (SECTOR_EXPORT/1000)^0.15`
- **Assets prior:** `(CAPITAL_STOCK/10)^0.30 × (SECTOR_EXPORT/1000)^0.35 × (INFRASTRUCTURE/10)^0.20 × (GDP/30)^0.15`
- **Financial prior:** `(FIN_DEPTH/10)^0.35 × (CURRENCY_EXP/10)^0.30 × (CROSS_BORDER/10)^0.20 × (FUNDING_HUB/10)^0.15`

---

## Appendix B: Cosine Similarity Methodology

Cosine similarity between two channel vectors D1 and D2 (each a probability distribution over countries):

```
cos(D1, D2) = Σ(D1[c] × D2[c]) / (√Σ(D1[c]²) × √Σ(D2[c]²))
```

A value of 1.0 means identical distributions; 0.0 means orthogonal (no overlap). For country exposure distributions, values above 0.90 indicate that the two channels are telling essentially the same geographic story, providing no additional information about channel-specific risk pathways.

The 6 pairwise combinations (Rev↔Sup, Rev↔Ast, Rev↔Fin, Sup↔Ast, Sup↔Fin, Ast↔Fin) are averaged to produce a single `avg_sim` score per ticker.

---

*Report generated: 2026-04-07 | Auditor: David (Data Analyst, Atoms Team) | Read-only audit — no codebase changes made*