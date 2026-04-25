# SEC Runtime Baseline Results

**Run ID:** 2026-04-25T20-27-15-267Z
**Run date:** 2026-04-25T20:27:15.268Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 102m 56s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 136 | 98.6% |
| Retrieval succeeded | 135 | 97.8% |
| Structured parsing succeeded | 115 | 83.3% |
| Narrative parsing succeeded | 135 | 97.8% |
| **Materially specific output** | **116** | **84.1%** |
| Fallback-dominant output | 22 | 15.9% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------| 
| Revenue | 77 | 57 | 1 | 3 | 0 |
| Supply | 3 | 42 | 15 | 78 | 0 |
| Assets | 35 | 52 | 48 | 3 | 0 |
| Financial | 0 | 110 | 24 | 4 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 116 | 22 | 84.1% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Confidence Summary

**Average confidence score: 69 | Grade distribution: A:30 B:53 C:46 D:6 F:3**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 60 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 32 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 24 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 43 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 80 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 6 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 52 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 49 | D |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| GS | A | No | ✅ | ✅ | 10-K | ❌ | ✅ | 4 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 11 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 22 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PDD | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (480s) |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 13 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 45 | D |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 24 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 38 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 45 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 61 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ❌ | ✅ | 1 | MODELED/FALLBACK/MODELED/FALLBACK | ❌ | 38 | D |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ❌ | ✅ | 3 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 58 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 39 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 48 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 30 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 39 | D |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| SAP | A | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F | Per-company timeout exceeded (480s) |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 42 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 60 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 40 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 18 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 11 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 32 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 37 | D |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 32 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed
- **PDD** (Cat A): Per-company timeout exceeded (480s)
- **SAP** (Cat A): Per-company timeout exceeded (480s)

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
