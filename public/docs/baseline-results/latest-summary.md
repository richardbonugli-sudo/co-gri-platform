# SEC Runtime Baseline Results

**Run ID:** 2026-04-21T19-42-55-676Z
**Run date:** 2026-04-21T19:42:55.676Z
**Phase:** 3
**Companies processed:** 180 / 180
**Duration:** 1m 36s
**Mode:** LIVE

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | 144 | 80.0% |
| Retrieval succeeded | 143 | 79.4% |
| Structured parsing succeeded | 143 | 79.4% |
| Narrative parsing succeeded | 0 | 0.0% |
| **Materially specific output** | **143** | **79.4%** |
| Fallback-dominant output | 37 | 20.6% |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------|
| Revenue | 140 | 0 | 0 | 40 | 0 |
| Supply | 0 | 69 | 0 | 111 | 0 |
| Assets | 143 | 0 | 0 | 37 | 0 |
| Financial | 0 | 142 | 0 | 38 | 0 |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | 138 | 137 | 1 | 99.3% |
| B (EDGAR search) | 42 | 6 | 36 | 14.3% |
| C (ADR/20-F) | 0 | 0 | 0 | 0.0% |

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|
| MSFT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GOOGL | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AAPL | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| META | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TSLA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMZN | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NVDA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BRK.B | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| JNJ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| JPM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| V | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WMT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PG | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| MA | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| UNH | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HD | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| DIS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ADBE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BAC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NFLX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| XOM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PFE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CSCO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| INTC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VZ | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| KO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PEP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MRK | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ABT | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NKE | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ORCL | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMD | A | No | ✅ | ✅ | 10-K/A | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IBM | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABBV | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AXP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BLK | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| C | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| COP | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CVX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| DHR | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LLY | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| MS | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SLB | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBUX | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TMO | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| WFC | A | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BABA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PDD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| JD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BIDU | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NIO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | FALLBACK/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NTES | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | FALLBACK/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| XPEV | A | Yes | ✅ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BILI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TSM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| YUMC | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ASX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CHT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| KB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| PKX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LPL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| KEP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SONY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SMFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| MUFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NMR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| MFG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| HMC | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SIFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| INFY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| WIT | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | FALLBACK/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HDB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PBR | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IBN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| REDY | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| VALE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ITUB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BBD | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| ABEV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SBS | A | Yes | ✅ | ✅ | 20-F/A | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/FALLBACK | ✅ |  |
| TIMB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| LTM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GGB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| SHEL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AZN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HSBC | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GSK | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| UL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
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
| PHG | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| STLA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NVO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| NVS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| BHP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| UBS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TEVA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CHKP | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| NICE | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WIX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| MNDY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| AMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| FMX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| YPF | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CRESY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| IRS | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GGAL | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| TX | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SUPV | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| TEO | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| LOMA | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| PAM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SQM | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CIB | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SAN | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GOLD | A | Yes | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| GFI | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| SBSW | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| HMY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| AU | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| ABBNY | A | Yes | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| CMCSA | B | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| BA | B | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| QCOM | B | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| GE | B | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| WNS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| VEDL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| TTM | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BRFS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| INDY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| CBD | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| AUO | B | No | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| NTDOY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| SNE | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| MCD | B | No | ✅ | ✅ | 10-K | ✅ | ❌ | 0 | DIRECT/ALLOCATED/DIRECT/ALLOCATED | ✅ |  |
| FUJIY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BNP | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| LVMUY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| AXAHY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| OREDY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| DANOY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| AIQUY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| SIEGY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| SAFRY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| DAIMAY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BAYRY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BMWYY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| VLKAF | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| BASFY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| ALIZY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| ADDYY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| HEIA | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| RHHBY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| NSRGY | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| UMC | B | No | ✅ | ✅ | 20-F | ✅ | ❌ | 0 | DIRECT/FALLBACK/DIRECT/ALLOCATED | ✅ |  |
| CS | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| ZURN | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| WBK | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| NAB | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| ENIA | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| ANZ | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| CHL | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |
| GFNORTEO | B | Yes | ❌ | ❌ | N/A | ❌ | ❌ | 0 | FALLBACK/FALLBACK/FALLBACK/FALLBACK | ❌ |  |

---

## Failures & Issues

- **XPEV** (Cat A): Filing retrieval failed
- **WNS** (Cat B): CIK not found
- **VEDL** (Cat B): CIK not found
- **TTM** (Cat B): CIK not found
- **BRFS** (Cat B): CIK not found
- **INDY** (Cat B): CIK not found
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
- **SIEGY** (Cat B): CIK not found
- **SAFRY** (Cat B): CIK not found
- **DAIMAY** (Cat B): CIK not found
- **BAYRY** (Cat B): CIK not found
- **BMWYY** (Cat B): CIK not found
- **VLKAF** (Cat B): CIK not found
- **BASFY** (Cat B): CIK not found
- **ALIZY** (Cat B): CIK not found
- **ADDYY** (Cat B): CIK not found
- **HEIA** (Cat B): CIK not found
- **RHHBY** (Cat B): CIK not found
- **NSRGY** (Cat B): CIK not found
- **CS** (Cat B): CIK not found
- **ZURN** (Cat B): CIK not found
- **WBK** (Cat B): CIK not found
- **NAB** (Cat B): CIK not found
- **ENIA** (Cat B): CIK not found
- **ANZ** (Cat B): CIK not found
- **CHL** (Cat B): CIK not found
- **GFNORTEO** (Cat B): CIK not found

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
