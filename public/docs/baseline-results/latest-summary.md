# SEC Runtime Baseline Results

**Run ID:** 2026-04-26T00-50-01-606Z
**Run date:** 2026-04-26T00:50:01.606Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 59m 57s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 120 | 87.0% |
| Retrieval succeeded | 119 | 86.2% |
| Structured parsing succeeded | 101 | 73.2% |
| Narrative parsing succeeded | 119 | 86.2% |
| **Materially specific output** | **102** | **73.9%** |
| Fallback-dominant output | 36 | 26.1% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 69 | 49 | 1 | 19 | 0 |
| Supply | 3 | 35 | 15 | 85 | 0 |
| Assets | 34 | 44 | 41 | 19 | 0 |
| Financial | 0 | 98 | 20 | 20 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 102 | 36 | 73.9% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 61 | Grade distribution: A:27 B:47 C:40 D:5 F:19**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 24 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 35 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| AMZN | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 32 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| V | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 43 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| INTC | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| VZ | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| KO | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 6 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| MRK | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| ORCL | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| AXP | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| BLK | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| C | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 19 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| COP | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 10 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GS | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 45 | D |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 23 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 41 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 35 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 17 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 45 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ❌ | ✅ | 1 | MODELED/FALLBACK/MODELED/FALLBACK | ❌ | 38 | D |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 64 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ❌ | ✅ | 3 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 53 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BBD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 50 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 30 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BCS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SAP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 39 | D |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CHKP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 18 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| AMX | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (308.695s) |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 11 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 32 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 37 | D |  |

---

## Failures & Issues

- **AMZN** (Cat A): Per-company timeout exceeded (308.695s)
- **V** (Cat A): Per-company timeout exceeded (308.695s)
- **INTC** (Cat A): Per-company timeout exceeded (308.695s)
- **VZ** (Cat A): Per-company timeout exceeded (308.695s)
- **KO** (Cat A): Per-company timeout exceeded (308.695s)
- **MRK** (Cat A): Per-company timeout exceeded (308.695s)
- **ORCL** (Cat A): Per-company timeout exceeded (308.695s)
- **AXP** (Cat A): Per-company timeout exceeded (308.695s)
- **BLK** (Cat A): Per-company timeout exceeded (308.695s)
- **C** (Cat A): Per-company timeout exceeded (308.695s)
- **COP** (Cat A): Per-company timeout exceeded (308.695s)
- **GS** (Cat A): Per-company timeout exceeded (308.695s)
- **XPEV** (Cat A): Filing retrieval failed
- **BBD** (Cat A): Per-company timeout exceeded (308.695s)
- **BCS** (Cat A): Per-company timeout exceeded (308.695s)
- **SAP** (Cat A): Per-company timeout exceeded (308.695s)
- **NVS** (Cat A): Per-company timeout exceeded (308.695s)
- **CHKP** (Cat A): Per-company timeout exceeded (308.695s)
- **AMX** (Cat A): Per-company timeout exceeded (308.695s)

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
