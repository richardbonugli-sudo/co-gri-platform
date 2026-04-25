# SEC Runtime Baseline Results

**Run ID:** 2026-04-25T12-55-34-521Z
**Run date:** 2026-04-25T12:55:34.521Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 124m 29s
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
| Supply | 3 | 42 | 15 | 78 | 0 |
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

**Average confidence score: 70 | Grade distribution: A:30 B:54 C:47 D:6 F:1**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 33 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 24 | DIRECT/DIRECT/ALLOCATED/ALLOCATED | ✅ | 91 | A |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 12 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 35 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 31 | ALLOCATED/MODELED/DIRECT/ALLOCATED | ✅ | 74 | B |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 23 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 61 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 34 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 39 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 30 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 40 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 25 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 29 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 42 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 17 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 32 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 80 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ❌ | ✅ | 6 | ALLOCATED/ALLOCATED/MODELED/MODELED | ✅ | 66 | C |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 35 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 27 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 67 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 50 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 49 | D |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 37 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 41 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 21 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 26 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| GS | A | No | ✅ | ✅ | 10-K | ❌ | ✅ | 4 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/MODELED | ✅ | 81 | B |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 10 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 38 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/DIRECT/MODELED/ALLOCATED | ✅ | 76 | B |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ | 0 | F |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 6 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 15 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 28 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 10 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 45 | D |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 24 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 40 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 7 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 27 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 19 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 63 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 21 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 17 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ❌ | ✅ | 1 | MODELED/FALLBACK/MODELED/FALLBACK | ❌ | 38 | D |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ❌ | ✅ | 3 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 27 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 25 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 33 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 34 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ | 84 | B |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 20 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 33 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 24 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 52 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 29 | ALLOCATED/MODELED/MODELED/MODELED | ❌ | 60 | C |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 26 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/FALLBACK/ALLOCATED/MODELED | ✅ | 68 | C |  |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 31 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 39 | D |  |
| SAP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 44 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 11 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 22 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/DIRECT/DIRECT/ALLOCATED | ✅ | 96 | A |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 43 | D |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 36 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 41 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 29 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 60 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/MODELED/ALLOCATED/ALLOCATED | ✅ | 79 | B |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 38 | ALLOCATED/ALLOCATED/DIRECT/ALLOCATED | ✅ | 80 | B |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 18 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 43 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 19 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | ALLOCATED/FALLBACK/MODELED/ALLOCATED | ✅ | 56 | C |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 26 | DIRECT/FALLBACK/ALLOCATED/ALLOCATED | ✅ | 71 | B |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 35 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 30 | ALLOCATED/ALLOCATED/MODELED/ALLOCATED | ✅ | 70 | B |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 7 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 8 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 36 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 53 | C |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 37 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ | 90 | A |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 15 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 28 | DIRECT/ALLOCATED/ALLOCATED/ALLOCATED | ✅ | 85 | A |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 23 | ALLOCATED/FALLBACK/DIRECT/ALLOCATED | ✅ | 66 | C |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | ALLOCATED/MODELED/MODELED/ALLOCATED | ✅ | 64 | C |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 32 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ | 76 | B |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ❌ | ✅ | 32 | ALLOCATED/FALLBACK/MODELED/MODELED | ❌ | 37 | D |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
