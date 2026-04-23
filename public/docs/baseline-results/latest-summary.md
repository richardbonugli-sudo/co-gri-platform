# SEC Runtime Baseline Results

**Run ID:** 2026-04-23T14-12-31-432Z
**Run date:** 2026-04-23T14:12:31.432Z
**Phase:** 1
**Companies processed:** 138 / 138
**Duration:** 3m 27s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 138 | 100.0% |
| Retrieval succeeded | 137 | 99.3% |
| Structured parsing succeeded | 137 | 99.3% |
| Narrative parsing succeeded | 12 | 8.7% |
| **Materially specific output** | **137** | **99.3%** |
| Fallback-dominant output | 1 | 0.7% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------|
| Revenue | 134 | 0 | 1 | 3 | 0 |
| Supply | 0 | 67 | 1 | 70 | 0 |
| Assets | 137 | 0 | 0 | 1 | 0 |
| Financial | 0 | 136 | 0 | 2 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 137 | 1 | 99.3% |
| B (EDGAR search) | 0 | 0 | 0 | 0.0% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 5 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 4 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 1 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 10 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ✅ | 6 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | FALLBACK/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 2 | MODELED/MODELED/DIRECT/ALLOCATED | ✅ |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 1 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | FALLBACK/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/FALLBACK | ✅ |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| DEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BCS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| RIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BTI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TTE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SAP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DTEGY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ASML | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ING | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 3 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ✅ | 14 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ✅ | 6 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
