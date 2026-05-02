# SEC Runtime Baseline Results

**Run ID:** 2026-05-02T11-25-15-607Z
**Run date:** 2026-05-02T11:25:15.608Z
**Phase:** 3
**Companies processed:** 180 / 180
**Duration:** 58m 48s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 114 | 63.3% |
| Retrieval succeeded | 113 | 62.8% |
| Structured parsing succeeded | 100 | 55.6% |
| Narrative parsing succeeded | 113 | 62.8% |
| **Materially specific output** | **101** | **56.1%** |
| Fallback-dominant output | 79 | 43.9% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 63 | 50 | 0 | 67 | 0 |
| Supply | 3 | 38 | 15 | 124 | 0 |
| Assets | 33 | 39 | 41 | 67 | 0 |
| Financial | 0 | 97 | 16 | 67 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 95 | 43 | 68.8% |
| B (EDGAR search) | 42 | 6 | 36 | 14.3% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 45 | Grade distribution: A:26 B:45 C:40 D:2 F:67**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| TSLA | A | No | ✅ | ✅ | 10-K/A | ✅ | ✅ | 13 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 36 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| AMZN | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BRK.B | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| V | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| XOM | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 6 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| KO | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| MRK | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| NKE | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 50 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 49 | D |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| COP | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| GS | A | No | ✅ | ✅ | 10-K | ❌ | ✅ | 4 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 43 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TMO | A | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| PDD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| JD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 13 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NTES | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 9 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PKX | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| LPL | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| KEP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 45 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 62 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SBS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| IBN | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| REDY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BBD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| LTM | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 32 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 60 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| UL | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| RIO | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 29 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| TTE | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| SAP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| DTEGY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ING | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| NVS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| CHKP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| FMX | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 33 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 18 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 11 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| IRS | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| BA | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| CMCSA | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WNS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| VEDL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| TTM | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| INDY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| BRFS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CBD | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| QCOM | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
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
| GE | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| NSRGY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ZURN | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| WBK | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ANZ | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| NAB | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| CHL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| ENIA | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| GFNORTEO | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| MCD | B | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| UMC | B | No | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ABBNY | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (225s) |

---

## Failures & Issues

- **AMZN** (Cat A): Per-company timeout exceeded (225s)
- **BRK.B** (Cat A): Per-company timeout exceeded (225s)
- **V** (Cat A): Per-company timeout exceeded (225s)
- **XOM** (Cat A): Per-company timeout exceeded (225s)
- **KO** (Cat A): Per-company timeout exceeded (225s)
- **MRK** (Cat A): Per-company timeout exceeded (225s)
- **NKE** (Cat A): Per-company timeout exceeded (225s)
- **COP** (Cat A): Per-company timeout exceeded (225s)
- **TMO** (Cat A): Per-company timeout exceeded (225s)
- **XPEV** (Cat A): Filing retrieval failed
- **PDD** (Cat A): Per-company timeout exceeded (225s)
- **JD** (Cat A): Per-company timeout exceeded (225s)
- **NTES** (Cat A): Per-company timeout exceeded (225s)
- **PKX** (Cat A): Per-company timeout exceeded (225s)
- **LPL** (Cat A): Per-company timeout exceeded (225s)
- **KEP** (Cat A): Per-company timeout exceeded (225s)
- **IBN** (Cat A): Per-company timeout exceeded (225s)
- **REDY** (Cat A): Per-company timeout exceeded (225s)
- **BBD** (Cat A): Per-company timeout exceeded (225s)
- **LTM** (Cat A): Per-company timeout exceeded (225s)
- **UL** (Cat A): Per-company timeout exceeded (225s)
- **RIO** (Cat A): Per-company timeout exceeded (225s)
- **TTE** (Cat A): Per-company timeout exceeded (225s)
- **SAP** (Cat A): Per-company timeout exceeded (225s)
- **DTEGY** (Cat A): Per-company timeout exceeded (225s)
- **ING** (Cat A): Per-company timeout exceeded (225s)
- **NVS** (Cat A): Per-company timeout exceeded (225s)
- **CHKP** (Cat A): Per-company timeout exceeded (225s)
- **FMX** (Cat A): Per-company timeout exceeded (225s)
- **IRS** (Cat A): Per-company timeout exceeded (225s)
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
- **ANZ** (Cat B): CIK not found
- **NAB** (Cat B): CIK not found
- **CHL** (Cat B): CIK not found
- **ENIA** (Cat B): CIK not found
- **GFNORTEO** (Cat B): CIK not found
- **ABBNY** (Cat A): Per-company timeout exceeded (225s)

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
