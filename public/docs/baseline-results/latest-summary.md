# SEC Runtime Baseline Results

**Run ID:** 2026-04-26T10-08-36-879Z
**Run date:** 2026-04-26T10:08:36.879Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 56m 48s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 117 | 84.8% |
| Retrieval succeeded | 116 | 84.1% |
| Structured parsing succeeded | 100 | 72.5% |
| Narrative parsing succeeded | 116 | 84.1% |
| **Materially specific output** | **101** | **73.2%** |
| Fallback-dominant output | 37 | 26.8% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 67 | 49 | 0 | 22 | 0 |
| Supply | 3 | 37 | 13 | 85 | 0 |
| Assets | 32 | 44 | 40 | 22 | 0 |
| Financial | 0 | 95 | 21 | 22 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 101 | 37 | 73.2% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 60 | Grade distribution: A:26 B:47 C:40 D:3 F:22**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 36 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 35 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| V | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PG | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| VZ | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| KO | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 6 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MRK | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 49 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 49 | D |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 10 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| COP | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| GS | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 13 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 45 | D |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| LPL | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| KEP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 61 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ❌ | ✅ | 3 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| IBN | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| REDY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BBD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 53 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 55 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 30 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| SAP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| DTEGY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| NVO | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| NVS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 40 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CHKP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| NICE | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| AMX | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 11 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| IRS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| ABBNY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (293.478s) |

---

## Failures & Issues

- **V** (Cat A): Per-company timeout exceeded (293.478s)
- **PG** (Cat A): Per-company timeout exceeded (293.478s)
- **VZ** (Cat A): Per-company timeout exceeded (293.478s)
- **KO** (Cat A): Per-company timeout exceeded (293.478s)
- **MRK** (Cat A): Per-company timeout exceeded (293.478s)
- **COP** (Cat A): Per-company timeout exceeded (293.478s)
- **GS** (Cat A): Per-company timeout exceeded (293.478s)
- **XPEV** (Cat A): Filing retrieval failed
- **LPL** (Cat A): Per-company timeout exceeded (293.478s)
- **KEP** (Cat A): Per-company timeout exceeded (293.478s)
- **IBN** (Cat A): Per-company timeout exceeded (293.478s)
- **REDY** (Cat A): Per-company timeout exceeded (293.478s)
- **BBD** (Cat A): Per-company timeout exceeded (293.478s)
- **SAP** (Cat A): Per-company timeout exceeded (293.478s)
- **DTEGY** (Cat A): Per-company timeout exceeded (293.478s)
- **NVO** (Cat A): Per-company timeout exceeded (293.478s)
- **NVS** (Cat A): Per-company timeout exceeded (293.478s)
- **CHKP** (Cat A): Per-company timeout exceeded (293.478s)
- **NICE** (Cat A): Per-company timeout exceeded (293.478s)
- **AMX** (Cat A): Per-company timeout exceeded (293.478s)
- **IRS** (Cat A): Per-company timeout exceeded (293.478s)
- **ABBNY** (Cat A): Per-company timeout exceeded (293.478s)

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
