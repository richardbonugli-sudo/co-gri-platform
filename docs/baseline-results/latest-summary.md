# SEC Runtime Baseline Results

**Run ID:** 2026-04-23T17-12-18-730Z
**Run date:** 2026-04-23T17:12:18.730Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 9m 13s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 138 | 100.0% |
| Retrieval succeeded | 135 | 97.8% |
| Structured parsing succeeded | 135 | 97.8% |
| Narrative parsing succeeded | 59 | 42.8% |
| **Materially specific output** | **135** | **97.8%** |
| Fallback-dominant output | 3 | 2.2% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------|
| Revenue | 135 | 0 | 0 | 3 | 0 |
| Supply | 0 | 13 | 47 | 78 | 0 |
| Assets | 135 | 0 | 0 | 3 | 0 |
| Financial | 0 | 134 | 0 | 4 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 135 | 3 | 97.8% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 7 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 5 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 7 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 5 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 6 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 11 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 10 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 6 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ✅ | ✅ | 1 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| GS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 5 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 7 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 5 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 7 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| SONY | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| SIFY | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/FALLBACK | ✅ |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 12 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SAP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 5 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 8 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 9 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 5 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 16 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 4 | DIRECT/MODELED/DIRECT/ALLOCATED | ✅ |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed
- **SONY** (Cat A): Filing retrieval failed
- **SIFY** (Cat A): Filing retrieval failed

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
