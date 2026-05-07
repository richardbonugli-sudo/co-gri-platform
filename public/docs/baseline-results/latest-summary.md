# SEC Runtime Baseline Results

**Run ID:** 2026-05-07T16-02-23-187Z
**Run date:** 2026-05-07T16:02:23.187Z
**Phase:** 3
**Companies processed:** 180 / 180
**Duration:** 57m 39s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 110 | 61.1% |
| Retrieval succeeded | 109 | 60.6% |
| Structured parsing succeeded | 95 | 52.8% |
| Narrative parsing succeeded | 109 | 60.6% |
| **Materially specific output** | **96** | **53.3%** |
| Fallback-dominant output | 84 | 46.7% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 62 | 47 | 0 | 71 | 0 |
| Supply | 3 | 38 | 14 | 125 | 0 |
| Assets | 29 | 42 | 38 | 71 | 0 |
| Financial | 0 | 92 | 17 | 71 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 92 | 46 | 66.7% |
| B (EDGAR search) | 42 | 4 | 38 | 9.5% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 43 | Grade distribution: A:26 B:44 C:37 D:2 F:71**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TSLA | A | No | ✅ | ✅ | 10-K/A | ✅ | ✅ | 13 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MSFT | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| AMZN | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BRK.B | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 19 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| V | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 32 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| INTC | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 7 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| KO | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| MRK | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 25 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NKE | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 52 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 49 | D |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| COP | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| GS | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 11 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| SLB | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PDD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 13 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| NTES | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 9 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 41 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| KEP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| TM | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 17 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 17 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 61 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SBS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| IBN | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| REDY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BBD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LTM | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| SHEL | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AZN | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| GSK | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| UL | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 52 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 30 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| BTI | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SAP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| DTEGY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVO | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| NVS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| CHKP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 11 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| IRS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| SQM | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| CMCSA | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BA | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 13 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WNS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| VEDL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| TTM | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| INDY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BRFS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CBD | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| QCOM | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 19 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| AUO | B | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| NTDOY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| SNE | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| FUJIY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BNP | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| LVMUY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| AXAHY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| OREDY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| DANOY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| AIQUY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| SAFRY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| SIEGY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BAYRY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| DAIMAY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BMWYY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| VLKAF | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BASFY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ADDYY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ALIZY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| HEIA | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| RHHBY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| NSRGY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ZURN | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| WBK | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| NAB | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ANZ | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ENIA | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CHL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| GFNORTEO | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| MCD | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABBNY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| GE | B | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| UMC | B | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |

---

## Failures & Issues

- **MSFT** (Cat A): Per-company timeout exceeded (225s)
- **AMZN** (Cat A): Per-company timeout exceeded (225s)
- **BRK.B** (Cat A): Per-company timeout exceeded (225s)
- **V** (Cat A): Per-company timeout exceeded (225s)
- **INTC** (Cat A): Per-company timeout exceeded (225s)
- **KO** (Cat A): Per-company timeout exceeded (225s)
- **MRK** (Cat A): Per-company timeout exceeded (225s)
- **NKE** (Cat A): Per-company timeout exceeded (225s)
- **COP** (Cat A): Per-company timeout exceeded (225s)
- **GS** (Cat A): Per-company timeout exceeded (225s)
- **SLB** (Cat A): Per-company timeout exceeded (225s)
- **XPEV** (Cat A): Filing retrieval failed
- **PDD** (Cat A): Per-company timeout exceeded (225s)
- **NTES** (Cat A): Per-company timeout exceeded (225s)
- **KEP** (Cat A): Per-company timeout exceeded (225s)
- **TM** (Cat A): Per-company timeout exceeded (225s)
- **IBN** (Cat A): Per-company timeout exceeded (225s)
- **REDY** (Cat A): Per-company timeout exceeded (225s)
- **BBD** (Cat A): Per-company timeout exceeded (225s)
- **LTM** (Cat A): Per-company timeout exceeded (225s)
- **SHEL** (Cat A): Per-company timeout exceeded (225s)
- **AZN** (Cat A): Per-company timeout exceeded (225s)
- **GSK** (Cat A): Per-company timeout exceeded (225s)
- **UL** (Cat A): Per-company timeout exceeded (225s)
- **BTI** (Cat A): Per-company timeout exceeded (225s)
- **SAP** (Cat A): Per-company timeout exceeded (225s)
- **DTEGY** (Cat A): Per-company timeout exceeded (225s)
- **NVO** (Cat A): Per-company timeout exceeded (225s)
- **NVS** (Cat A): Per-company timeout exceeded (225s)
- **CHKP** (Cat A): Per-company timeout exceeded (225s)
- **IRS** (Cat A): Per-company timeout exceeded (225s)
- **SQM** (Cat A): Per-company timeout exceeded (225s)
- **WNS** (Cat B): CIK not found
- **VEDL** (Cat B): CIK not found
- **TTM** (Cat B): CIK not found
- **INDY** (Cat B): CIK not found
- **BRFS** (Cat B): CIK not found
- **CBD** (Cat B): CIK not found
- **AUO** (Cat B): CIK not found
- **NTDOY** (Cat B): CIK not found
- **SNE** (Cat B): CIK not found
- **FUJIY** (Cat B): CIK not found
- **BNP** (Cat B): CIK not found
- **LVMUY** (Cat B): CIK not found
- **AXAHY** (Cat B): CIK not found
- **OREDY** (Cat B): CIK not found
- **DANOY** (Cat B): CIK not found
- **AIQUY** (Cat B): CIK not found
- **SAFRY** (Cat B): CIK not found
- **SIEGY** (Cat B): CIK not found
- **BAYRY** (Cat B): CIK not found
- **DAIMAY** (Cat B): CIK not found
- **BMWYY** (Cat B): CIK not found
- **VLKAF** (Cat B): CIK not found
- **BASFY** (Cat B): CIK not found
- **ADDYY** (Cat B): CIK not found
- **ALIZY** (Cat B): CIK not found
- **HEIA** (Cat B): CIK not found
- **RHHBY** (Cat B): CIK not found
- **NSRGY** (Cat B): CIK not found
- **CS** (Cat B): CIK not found
- **ZURN** (Cat B): CIK not found
- **WBK** (Cat B): CIK not found
- **NAB** (Cat B): CIK not found
- **ANZ** (Cat B): CIK not found
- **ENIA** (Cat B): CIK not found
- **CHL** (Cat B): CIK not found
- **GFNORTEO** (Cat B): CIK not found
- **ABBNY** (Cat A): Per-company timeout exceeded (225s)
- **GE** (Cat B): Per-company timeout exceeded (225s)
- **UMC** (Cat B): Per-company timeout exceeded (225s)

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
