# SEC Runtime Baseline Results

**Run ID:** 2026-04-24T00-16-10-868Z
**Run date:** 2026-04-24T00:16:10.868Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 98m 22s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 138 | 100.0% |
| Retrieval succeeded | 137 | 99.3% |
| Structured parsing succeeded | 117 | 84.8% |
| Narrative parsing succeeded | 137 | 99.3% |
| **Materially specific output** | **118** | **85.5%** |
| Fallback-dominant output | 20 | 14.5% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 78 | 58 | 1 | 1 | 0 |
| Supply | 0 | 13 | 123 | 2 | 0 |
| Assets | 35 | 53 | 49 | 1 | 0 |
| Financial | 0 | 112 | 24 | 2 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 118 | 20 | 85.5% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 72 | Grade distribution: A:7 B:83 C:42 D:5 F:1**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 24 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 12 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 25 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 61 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 32 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 19 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 25 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/MODELED/ALLOCATED/MODELED | ✅ | 75 | B |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 80 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 7 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 53 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 45 | D |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/MODELED/ALLOCATED/MODELED | ✅ | 75 | B |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/MODELED/ALLOCATED/MODELED | ✅ | 75 | B |  |
| GS | A | No | ✅ | ✅ | 10-K | ❌ | ✅ | 4 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 11 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 24 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 41 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 63 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ❌ | ✅ | 1 | MODELED/FALLBACK/MODELED/FALLBACK | ❌ | 38 | D |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 24 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ❌ | ✅ | 3 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 33 | DIRECT/MODELED/ALLOCATED/MODELED | ✅ | 75 | B |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 48 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 30 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 27 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 39 | D |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/ALLOCATED/MODELED | ✅ | 75 | B |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SAP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 47 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 59 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 32 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 42 | D |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
