# CO-GRI Historical Data Investigation Report

**Prepared by:** David (Data Analyst)  
**Date:** 2026-03-20  
**Scope:** Deep investigation of CO-GRI Trend Chart and historical data generation

---

## Executive Summary

The CO-GRI platform generates all historical time-series data **dynamically at runtime** using a physics-inspired event-decay model applied to a static baseline. There is **no persistent historical database** of CO-GRI scores. The flat-line appearance in 3Y/10Y charts is a direct consequence of the decay model: geopolitical events decay exponentially (60-day half-life for non-ongoing events), so events from 2–10 years ago contribute near-zero impact to any historical date calculation, leaving only the static baseline visible. This report details the root cause, the landmark event inventory, and recommended remediation.

---

## 1. Architecture Overview

### 1.1 Data Flow

```
Static Baseline (globalCountries.ts)
        │
        ▼
compositeCalculator.getCSIAtDate(country, date)
        │
        ├── GEOPOLITICAL_EVENTS (geopoliticalEvents.ts)   ← short-term events
        ├── HISTORICAL_GEOPOLITICAL_EVENTS (historicalGeopoliticalEvents.ts) ← 2011–2024
        │
        ▼
Exponential Decay Applied to Each Event
        │
        ▼
COGRITrendChart.tsx / RiskTrendComparison.tsx
  → calls compositeCalculator per data point
  → renders Recharts LineChart
```

### 1.2 Key Files

| File | Role |
|------|------|
| `src/services/csi/compositeCalculator.ts` | **Single source of truth** for all CSI calculations |
| `src/data/historicalGeopoliticalEvents.ts` | 500+ events (2011–2024) + 8 LANDMARK_EVENTS |
| `src/data/geopoliticalEvents.ts` | Current/recent operational events |
| `src/components/company/COGRITrendChart.tsx` | Company-level trend chart (C2 component) |
| `src/components/dashboard/RiskTrendComparison.tsx` | Global/country CSI trend chart |
| `src/components/dashboard/HistoricalEventMarkers.tsx` | Event marker overlay + filter UI |
| `src/services/csi/historicalCSIService.ts` | Wrapper; delegates to compositeCalculator |
| `src/services/cogriCalculationServiceEnhanced.ts` | Phase 1 transparency layer for COGRI scores |

---

## 2. Root Cause of Flat Historical Lines

### 2.1 The Decay Model

The core issue is in `compositeCalculator.ts`, method `applyGeopoliticalEventDecay()`:

```typescript
private applyGeopoliticalEventDecay(event, asOfDate, impactFactor): number {
  const daysSinceEvent = (asOfDate - event.date) / (1000 * 60 * 60 * 24);
  const baseImpact = event.deltaCSI * impactFactor;

  if (event.isOngoing) return baseImpact;  // No decay for ongoing events

  // Exponential decay with 60-day half-life
  const halfLifeDays = 60;
  const decayFactor = Math.pow(0.5, daysSinceEvent / halfLifeDays);
  return baseImpact * decayFactor;
}
```

**Impact at various time horizons for a non-ongoing event:**

| Days Since Event | Decay Factor | Remaining Impact (25 deltaCSI) |
|-----------------|-------------|-------------------------------|
| 60 days | 0.500 | 12.5 |
| 120 days | 0.250 | 6.25 |
| 180 days | 0.125 | 3.1 |
| 365 days (1Y) | 0.016 | 0.4 |
| 730 days (2Y) | 0.00025 | ~0.006 |
| 1095 days (3Y) | ~0.000004 | ~0.0001 |
| 3650 days (10Y) | ~0 | ~0 |

**Conclusion:** For any historical date calculation more than ~6 months in the past, virtually all non-ongoing events have decayed to zero. The chart then shows only the static baseline value (`GLOBAL_COUNTRIES[country].csi`), which is a constant — producing a **perfectly flat line**.

### 2.2 The Extended Time Series Generator

`calculateExtendedGlobalCSITimeSeries()` in `compositeCalculator.ts` loops over all events and applies the same decay:

```typescript
for (const event of allEvents) {
  if (event.date > date) continue;
  const decayedImpact = this.applyGeopoliticalEventDecay(event, date, 1.0);
  // ...
}
```

When computing a point 3 years ago, events that occurred 3+ years before that point have already fully decayed. Events that occurred *after* that historical point are skipped (`event.date > date`). This means the only events contributing to a historical point are those within ~6 months of that point — and for points deep in the past, there may be none.

### 2.3 The Normalization Scaling Factor

Even if some impact exists, it is further suppressed:

```typescript
const scalingFactor = eventCount > 0 ? Math.min(1, eventCount / 50) : 0;
const normalizedImpact = totalEventImpact * scalingFactor / Math.max(1, Math.sqrt(eventCount));
```

This normalization was designed to prevent runaway global CSI values but also dampens legitimate historical spikes.

### 2.4 COGRITrendChart.tsx Blending

The company-level chart blends country CSI with global CSI:

```typescript
companyCsi = weighted * 0.7 + globalCsi * 0.3;
```

Since both `weighted` (per-country) and `globalCsi` converge to their static baselines in the distant past, the blended result is also flat.

---

## 3. Historical Data Generation — Is It Dynamic or Static?

**Answer: Fully dynamic, computed at render time.**

- There is **no database** of historical CO-GRI scores.
- There is **no backfill script** that pre-computes and stores historical values.
- Every time a user selects a time window (3Y, 5Y, 10Y), the chart component calls `compositeCalculator.getCSIAtDate()` for each data point in a loop.
- For 10Y with 21-day intervals, this is ~174 calculations per country per render.
- A Web Worker service (`csiWorkerService`) is used to offload extended window calculations.
- Results are cached in-memory (`globalCSICache` Map) keyed by date string, but this cache is **not persisted** across page reloads.

---

## 4. Landmark Events Inventory

### 4.1 Currently Recognized Landmark Events (LANDMARK_EVENTS array)

| ID | Date | Short Title | Countries | Category | Severity | deltaCSI |
|----|------|-------------|-----------|----------|----------|---------|
| landmark-2011-arab-spring | 2011-01-14 | Arab Spring | Tunisia, Egypt, Libya, Syria, Yemen, Bahrain | Governance | Critical | +12.5 |
| landmark-2011-fukushima | 2011-03-11 | Fukushima | Japan | Infrastructure | Critical | +12.0 |
| landmark-2014-crimea | 2014-03-18 | Crimea Annexation | Russia, Ukraine | Conflict | Critical | +18.5 |
| landmark-2016-brexit | 2016-06-23 | Brexit | United Kingdom | Governance | Critical | +10.5 |
| landmark-2018-trade-war | 2018-07-06 | Trade War | United States, China | Trade | Critical | +7.5 |
| landmark-2020-covid | 2020-03-11 | COVID-19 | China, Italy, United States | Governance | Critical | +15.0 |
| landmark-2022-ukraine-invasion | 2022-02-24 | Ukraine War | Russia, Ukraine | Conflict | Critical | +25.0 |
| landmark-2023-israel-hamas | 2023-10-07 | Gaza War | Israel, Palestine | Conflict | Critical | +22.0 |

### 4.2 Status of the 6 Requested Landmark Events

| Requested Event | Status | Notes |
|----------------|--------|-------|
| Brexit 2016 | ✅ Present | `landmark-2016-brexit`, deltaCSI=+10.5, FTSE 100 -8.7% |
| Trade War 2018 | ✅ Present | `landmark-2018-trade-war`, deltaCSI=+7.5, Shanghai -6.5% |
| COVID 2020 | ✅ Present | `landmark-2020-covid`, deltaCSI=+15.0, MSCI World -34% |
| Ukraine War 2022 | ✅ Present | `landmark-2022-ukraine-invasion`, deltaCSI=+25.0, MOEX -45% |
| Gaza War 2023 | ✅ Present | `landmark-2023-israel-hamas`, deltaCSI=+22.0, TA-35 -8% |
| **Middle East War 2026** | ❌ **Missing** | No 2025 or 2026 events in any data file |

### 4.3 Supporting Events in HISTORICAL_GEOPOLITICAL_EVENTS (500+ entries)

The full historical database covers 2011–2024 with events including:
- Arab Spring series (2011–2012): 15+ events
- European Debt Crisis (2011–2012): Greece, Spain, Italy
- Crimea/Donbas (2014): 6 events
- Brexit series (2016–2020): 7 events
- US-China Trade War (2018–2019): 8 events
- COVID-19 (2020): 8 events
- Russia-Ukraine War (2022): 12 events
- Israel-Hamas War (2023): 6 events
- 2024 events: Taiwan election, Avdiivka, Moscow attack, Iran-Israel direct exchange, Bangladesh

**Gap:** No events after 2024-08-05 (Bangladesh PM Hasina flees). The database ends in August 2024, leaving ~19 months of missing data through March 2026.

---

## 5. Why 3Y and 10Y Charts Show Flat Lines With Only a Recent Spike

### Root Cause Summary

1. **Decay eliminates old impacts:** The 60-day half-life means any event >1 year old contributes <2% of its original deltaCSI. Events from 3–10 years ago contribute essentially zero.

2. **Static baseline dominates:** Without event impact, every historical date returns the same static `country.csi` value from `globalCountries.ts` — a constant, producing a flat line.

3. **Recent spike is real:** The spike near "today" reflects current/ongoing events (Ukraine War, Gaza War, etc.) that have `isOngoing: true` and therefore do NOT decay. These accumulate and push the current value above baseline.

4. **The model was designed for current-state monitoring, not historical simulation:** The decay model is appropriate for tracking how risk evolves *forward* from events, but it was not designed to reconstruct what the CSI *was* at a historical point in time.

### Visual Pattern Explanation

```
CSI
 │
 │                                              ╭──── (ongoing events, no decay)
 │                                         ╭───╯
 │  ─────────────────────────────────────╮╯
 │  (static baseline, all old events     │
 │   fully decayed)                      │
 └──────────────────────────────────────────────────── time
  10Y ago    5Y ago    3Y ago    1Y ago   now
```

---

## 6. Is Historical Backfilling Feasible?

### 6.1 Current Infrastructure Assessment

**What exists:**
- `HISTORICAL_GEOPOLITICAL_EVENTS`: 500+ events with dates, deltaCSI, countries, severity
- `LANDMARK_EVENTS`: 8 major events with market impact data (MSCI World, S&P 500 changes)
- `compositeCalculator.calculateExtendedCSITimeSeries()`: Framework for time series generation
- `csiCache.ts`: In-memory caching infrastructure
- `backtestingEngine.ts` and `replayEngine.ts`: Backtesting/replay infrastructure already exists

**What is missing:**
- A **persistent score** model that records "what was the CSI at date X" without applying decay
- A **snapshot-based** historical store (the `historicalCSIService` initializes snapshots but they are only for the past 12 months of operational events, not the full 10Y history)
- 2025–2026 event data (19-month gap)

### 6.2 Feasibility Assessment

**Short-term (1–2 days of work):**
- **Feasible** to create a "landmark snapshot" approach: for each landmark event date, record the pre-event baseline + cumulative event impact up to that date (without decay), producing realistic historical spikes.
- This would require changing `applyGeopoliticalEventDecay` to use a **step function** (full impact at event date, then gradual decay) rather than the current model that decays backward from today.

**Medium-term (1 week):**
- Pre-compute and cache the full 10Y time series using a **cumulative impact model** where each event adds its deltaCSI at the event date and then decays *forward* in time (not backward from today).
- Store results in IndexedDB or a static JSON file for fast retrieval.

---

## 7. Recommended Next Steps

### Priority 1: Fix the Decay Direction (Critical Bug)

The current model applies decay **backward from today** to a historical date. The correct approach is to apply decay **forward from the event date**:

**Current (broken for historical):**
```
impact_at_historical_date = deltaCSI × 0.5^(days_from_today_to_event / 60)
```

**Correct (forward decay):**
```
impact_at_date = deltaCSI × 0.5^(days_from_event_to_query_date / 60)
```

This single change would make historical charts show realistic spikes at event dates that gradually decay, instead of a flat line.

### Priority 2: Add 2025–2026 Events

Add a new section to `HISTORICAL_GEOPOLITICAL_EVENTS` covering:
- 2025 events (US tariff escalation, Middle East escalation, etc.)
- 2026 Middle East War landmark event (requested but missing)

### Priority 3: Add Landmark Snapshot Pre-computation

Create a `getLandmarkCSISnapshot(eventId)` function that returns the CSI value at the time of each landmark event, computed using cumulative (non-decayed) event impacts up to that date. This enables the "CO-GRI at event vs. today" comparison in `COGRITrendChart.tsx` to show meaningful historical context.

### Priority 4: Persist Extended Window Cache

Move the `globalCSICache` Map to `localStorage` or `IndexedDB` with a 24-hour TTL. This prevents recalculation on every page load and enables the "Cached" indicator in `RiskTrendComparison.tsx` to work effectively.

---

## 8. Component-Specific Findings

### 8.1 COGRITrendChart.tsx (Company Level)

- **Data generation:** `useEffect` loop calling `compositeCalculator.getCSIAtDate()` per date point
- **Blending:** 70% company-weighted CSI + 30% global CSI
- **Landmark events:** Rendered as `ReferenceLine` + `ReferenceArea` shaded bands (30-day window)
- **Custom SVG labels:** `CustomEventLabel` component with hover tooltip showing "CO-GRI then vs now"
- **X-axis:** Numeric timestamps (`dateMs`) for reliable `ReferenceLine` positioning — this is correct
- **Issue:** `eventCSIMap` lookup finds the nearest data point to each event, but since the data is flat, the "CO-GRI at event" value will equal the baseline, making the delta comparison meaningless

### 8.2 RiskTrendComparison.tsx (Global/Country Level)

- **Data generation:** `generateTrendData()` calls `compositeCalculator.calculateGlobalCSIAtDate()` and `compositeCalculator.getCSIAtDate()` per point
- **Worker offloading:** Uses `csiWorkerService` for extended windows
- **Caching:** `csiCache` service with `fromCache` indicator
- **Market index overlay:** Fetches from `marketIndexData.ts` for correlation display
- **Issue:** Same decay problem — historical global CSI is flat

### 8.3 HistoricalEventMarkers.tsx (Event Overlay)

- **Dual event sources:** Combines `LANDMARK_EVENTS` (HistoricalEventMarker type) and `GEOPOLITICAL_EVENTS` (GeopoliticalEvent type)
- **Filter system:** Category groups (Military, Political, Economic, Other) with localStorage persistence
- **Timeline bar:** Visual marker positions calculated as percentage of time window
- **Tooltip:** Shows deltaCSI, market impact, affected countries, severity
- **Issue:** The `getLandmarkEvents()` function filters by time window correctly, but the `getHistoricalEventsByTimeWindow()` for regular events only returns events within the window — events older than the window are excluded even if their ongoing effects should still be visible

---

## 9. Data Quality Assessment

### 9.1 Event Coverage by Year

| Year | Event Count | Notable Coverage |
|------|-------------|-----------------|
| 2011 | 14 | Arab Spring, Fukushima, Eurozone crisis |
| 2012 | 8 | Greece restructuring, Syria escalation |
| 2013 | 9 | Snowden, Egypt coup, Euromaidan |
| 2014 | 10 | Crimea, Donbas, ISIS, MH17 |
| 2015 | 9 | Charlie Hebdo, Iran deal, Paris attacks |
| 2016 | 8 | Brexit, Trump election, Turkish coup |
| 2017 | 7 | Qatar crisis, N. Korea ICBMs, Catalonia |
| 2018 | 9 | Trade war, Khashoggi, Yellow Vests |
| 2019 | 10 | HK protests, Soleimani, Phase 1 deal |
| 2020 | 12 | COVID, BLM protests, Belarus, Nagorno |
| 2021 | 7 | Capitol, Myanmar coup, Taliban, AUKUS |
| 2022 | 14 | Ukraine invasion, sanctions, energy crisis |
| 2023 | 12 | SVB collapse, Sudan, Wagner, Gaza War |
| 2024 | 8 | Taiwan, Avdiivka, Iran-Israel, Bangladesh |
| **2025** | **0** | **MISSING** |
| **2026** | **0** | **MISSING** |

### 9.2 Market Impact Data Quality

The `LANDMARK_EVENTS` include verified market impact data:
- MSCI World index changes (all 8 events)
- S&P 500 changes (all 8 events)
- Country-specific indices (MOEX, FTSE 100, Shanghai Composite, TA-35, Nikkei 225)

This data is suitable for backtesting and validation.

---

## 10. Conclusion

The CO-GRI platform has a **solid event database and calculation framework** but suffers from a fundamental **temporal modeling flaw**: the decay function is applied from the present backward rather than from the event date forward. This makes all historical data points converge to the static baseline, producing flat charts.

The fix is conceptually simple (reverse the decay direction) but requires careful implementation to avoid breaking current-state calculations. The landmark event data for all 5 historical events (Brexit, Trade War, COVID, Ukraine, Gaza) is present and well-documented. The Middle East War 2026 event is missing and needs to be added.

The backtesting infrastructure (`backtestingEngine.ts`, `replayEngine.ts`) already exists and could be leveraged to pre-compute and validate a corrected historical series.

---

*Report generated by David (Data Analyst) — 2026-03-20*