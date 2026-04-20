# CO-GRI Trend Chart — Event Markers Investigation Report

**Date:** 2026-03-20  
**Analyst:** David (Data Analyst, Atoms Team)  
**Scope:** Deep investigation of the current event-marker implementation in `COGRITrendChart` and a recommended plan for integrating markers directly into the Recharts canvas.

---

## 1. Executive Summary

The current implementation renders landmark geopolitical events (Gaza War 2023, Ukraine War 2022, COVID-19 2020, Trade War 2018, Brexit 2016) as **badge/tag chips below the chart** inside an amber-tinted info box. They are **not** drawn on the chart canvas itself. The user's screenshot confirms this: events appear as labelled pills under the chart area rather than as vertical lines, shaded bands, or interactive dots overlaid on the time-series data.

The fix requires:
1. Replacing the below-chart badge list with **`<ReferenceLine>`** vertical lines (or **`<ReferenceArea>`** shaded bands) drawn inside the `<LineChart>` component.
2. Adding rich hover tooltips that show the event name, date, CSI delta, and the CO-GRI score at that moment.
3. Keeping the existing badge list **optional** (collapsible or removed entirely).

---

## 2. Files Investigated

| File | Role |
|------|------|
| `src/components/company/COGRITrendChart.tsx` | Main chart component — owns data generation, time-window selector, and Recharts rendering |
| `src/data/historicalGeopoliticalEvents.ts` | `LANDMARK_EVENTS[]` array (8 events, 2011–2023), `getLandmarkEvents(timeWindow)` helper, `getTimeWindowDays()`, `isExtendedTimeWindow()` |
| `src/components/dashboard/HistoricalEventMarkers.tsx` | Standalone timeline-strip component used on the CSI dashboard; exports `getChartEventMarkers()` helper; **not currently used in COGRITrendChart** |
| `src/pages/modes/CompanyMode.tsx` | Hosts `<COGRITrendChart>` inside the Structural and Forecast Overlay tabs |
| `src/pages/Index.tsx` | Landing page — "Get Started" → `/dashboard` |

---

## 3. Current Implementation Analysis

### 3.1 How Event Markers Are Currently Rendered

Inside `COGRITrendChart.tsx` (lines 256–511):

```tsx
// ── Landmark events for extended windows ─────────────────────────────────
const landmarkEvents = useMemo(() => {
  if (!isExtendedTimeWindow(timeWindow)) return [];
  return getLandmarkEvents(timeWindow);
}, [timeWindow]);
```

**On the chart canvas** — `<ReferenceLine>` elements are attempted (lines 443–457):
```tsx
{isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event) => (
  <ReferenceLine
    key={event.id}
    x={formatDateLabel(event.date, timeWindow)}   // ← string label match
    stroke="#ef4444"
    strokeDasharray="3 3"
    label={{ value: event.shortTitle, position: 'top', fill: '#ef4444', fontSize: 9 }}
  />
))}
```

**Root cause of the bug:** `<ReferenceLine x={...}>` in Recharts requires the `x` value to **exactly match** a `dataKey` value in the chart data array. The chart data points are formatted date strings like `"Mar '22"` or `"Feb '24"`, but `formatDateLabel(event.date, timeWindow)` may produce a string that does not exactly match any data point label (e.g., due to day-of-month differences, locale rounding, or the event date falling between two sampled intervals). When no match is found, Recharts silently skips the line — it renders nothing on the canvas.

**Below the chart** — the amber badge box (lines 489–511) is always rendered for extended windows:
```tsx
{!isLoading && isExtendedTimeWindow(timeWindow) && landmarkEvents.length > 0 && (
  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
    <p>Major Events in {timeWindow} Window ({landmarkEvents.length} landmark events)</p>
    <div className="flex flex-wrap gap-2">
      {landmarkEvents.slice(0, 5).map((event) => (
        <span key={event.id} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded"
              title={event.description}>
          {event.shortTitle} ({event.date.getFullYear()})
        </span>
      ))}
    </div>
  </div>
)}
```

This badge box is the **only visible output** of the event data because the `<ReferenceLine>` elements fail to match any x-axis tick.

### 3.2 Data Structure for Events

`LANDMARK_EVENTS` (in `historicalGeopoliticalEvents.ts`) is an array of `HistoricalEventMarker` objects:

```ts
interface HistoricalEventMarker {
  id: string;           // e.g. 'landmark-2022-ukraine-invasion'
  date: Date;           // exact Date object
  title: string;        // full title
  shortTitle: string;   // e.g. 'Ukraine War'
  description: string;
  countries: string[];
  category: EventCategory;
  severity: EventSeverity;
  marketImpact: {
    msciWorld?: number;
    sp500?: number;
    countryIndex?: { name: string; change: number }[];
  };
  deltaCSI: number;     // CSI impact value (e.g. 25.0 for Ukraine War)
  isLandmark: boolean;
}
```

The 8 landmark events currently in the database:

| Short Title | Date | Delta CSI |
|-------------|------|-----------|
| Arab Spring | 2011-01-14 | +12.5 |
| Fukushima | 2011-03-11 | +12.0 |
| Crimea Annexation | 2014-03-18 | +18.5 |
| Brexit | 2016-06-23 | +10.5 |
| Trade War | 2018-07-06 | +7.5 |
| COVID-19 | 2020-03-11 | +15.0 |
| Ukraine War | 2022-02-24 | +25.0 |
| Gaza War | 2023-10-07 | +22.0 |

### 3.3 Chart Library (Recharts) — How x-axis Reference Lines Work

Recharts `<ReferenceLine x={value}>` on a `<LineChart>` with a **categorical x-axis** (`dataKey="date"` where dates are formatted strings):

- The `x` prop must be a **string that exactly matches** one of the `dataKey` values in the `data` array.
- If no match is found, the line is not drawn (no error, no warning).
- For numeric x-axes (using `<XAxis type="number">`), the `x` prop can be any numeric value and Recharts interpolates its position.

**Current chart uses a categorical x-axis** — this is the fundamental mismatch causing the invisible reference lines.

### 3.4 Time Windows That Trigger Event Display

```ts
export function isExtendedTimeWindow(timeWindow: string): boolean {
  return ['3Y', '5Y', '10Y'].includes(timeWindow);
}
```

Only `3Y`, `5Y`, and `10Y` windows trigger event display. The shorter windows (`7D`, `30D`, `90D`, `12M`) show no events. Given that the 5 events shown in the screenshot (Gaza 2023, Ukraine 2022, COVID 2020, Trade War 2018, Brexit 2016) span 2016–2023, they would all appear in the `5Y` (2021–2026) or `10Y` (2016–2026) windows.

### 3.5 Data Generation Pipeline

Chart data is generated in a `useEffect` (lines 163–230). Each data point is:
```ts
{
  date: string,          // formatted label, e.g. "Mar '22"
  'CO-GRI': number,      // weighted company CSI
  'Sector Avg'?: number  // optional sector benchmark
}
```

The `date` string is produced by `formatDateLabel(date, timeWindow)`:
- For `3Y`/`5Y`/`10Y`: `date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })` → e.g. `"Mar '22"`
- Sampling interval: every 7 days (3Y), 14 days (5Y), 21 days (10Y)

An event on `2022-02-24` would produce label `"Feb '22"`. The nearest sampled data point might be `"Feb '22"` or `"Mar '22"` depending on the loop. The match is unreliable.

---

## 4. The `HistoricalEventMarkers` Component (Not Currently Used in Chart)

`src/components/dashboard/HistoricalEventMarkers.tsx` is a **standalone timeline strip** component used elsewhere (CSI dashboard). It exports a useful helper:

```ts
export function getChartEventMarkers(
  timeWindow: ExtendedTimeWindow,
  categoryFilters?: Record<EventCategoryGroup, boolean>
): ChartEventMarker[] {
  // Returns: { date, label, category, severity, deltaCSI, color }[]
}
```

This helper is directly reusable for the chart integration. It already handles category filtering and color assignment.

---

## 5. Recommended Implementation Plan

### 5.1 Strategy: Switch to Numeric X-Axis for Reliable Positioning

The cleanest fix is to change the chart's x-axis from categorical strings to **numeric timestamps** (milliseconds since epoch). This allows `<ReferenceLine x={timestamp}>` to position events at any arbitrary date, regardless of sampling interval.

**Step 1 — Change data point shape:**
```ts
// Before
{ date: "Mar '22", 'CO-GRI': 45.2 }

// After
{ 
  dateMs: 1645660800000,   // numeric timestamp for Recharts positioning
  dateLabel: "Mar '22",    // display label for XAxis tickFormatter
  'CO-GRI': 45.2 
}
```

**Step 2 — Update `<XAxis>`:**
```tsx
<XAxis
  dataKey="dateMs"
  type="number"
  scale="time"
  domain={['dataMin', 'dataMax']}
  tickFormatter={(ms) => formatDateLabel(new Date(ms), timeWindow)}
  interval={xAxisInterval}
  // ... other props
/>
```

**Step 3 — Update `<ReferenceLine>` to use numeric x:**
```tsx
{isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event) => (
  <ReferenceLine
    key={event.id}
    x={event.date.getTime()}   // numeric ms — always matches
    stroke={getEventColor(event)}
    strokeWidth={1.5}
    strokeDasharray="4 2"
    label={<CustomEventLabel event={event} />}
  />
))}
```

### 5.2 Shaded Vertical Bands with `<ReferenceArea>`

For events with significant duration (e.g., COVID pandemic, Ukraine War), use `<ReferenceArea>` to shade a band:

```tsx
{isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event) => {
  const startMs = event.date.getTime();
  const endMs = startMs + (30 * 24 * 60 * 60 * 1000); // 30-day impact window
  return (
    <ReferenceArea
      key={`band-${event.id}`}
      x1={startMs}
      x2={endMs}
      fill={getEventColor(event)}
      fillOpacity={0.08}
      stroke="none"
    />
  );
})}
```

Color mapping by category:
- `Conflict` / `Military Posture` → `#ef4444` (red)
- `Governance` / `Protest` → `#f97316` (orange)
- `Trade` / `Sanctions` / `Currency` → `#eab308` (yellow)
- `Diplomatic` → `#3b82f6` (blue)

### 5.3 Hoverable Markers with Custom Dot/Label

**Option A — Custom Label Component (simpler):**

```tsx
const CustomEventLabel: React.FC<{ viewBox?: any; event: HistoricalEventMarker }> = ({ viewBox, event }) => {
  const { x, y } = viewBox;
  const [hovered, setHovered] = useState(false);
  const color = getEventColor(event);
  
  return (
    <g>
      {/* Vertical line dot at top */}
      <circle
        cx={x}
        cy={y + 10}
        r={5}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Short title rotated label */}
      <text
        x={x}
        y={y + 8}
        fill={color}
        fontSize={8}
        textAnchor="start"
        transform={`rotate(-45, ${x}, ${y + 8})`}
        style={{ pointerEvents: 'none' }}
      >
        {event.shortTitle}
      </text>
      {/* Hover tooltip */}
      {hovered && (
        <foreignObject x={x + 8} y={y - 60} width={200} height={80}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 11 }}>
            <strong>{event.shortTitle}</strong>
            <div>{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div style={{ color: event.deltaCSI > 0 ? '#ef4444' : '#22c55e' }}>
              CSI Impact: {event.deltaCSI > 0 ? '+' : ''}{event.deltaCSI}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};
```

**Option B — Recharts Custom Tooltip Integration (more robust):**

Extend the existing `<Tooltip>` formatter to detect when the hovered x-value is near an event date and inject event data into the tooltip content.

```tsx
<Tooltip
  content={({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const dateMs = payload[0]?.payload?.dateMs;
    const nearbyEvent = landmarkEvents.find(e =>
      Math.abs(e.date.getTime() - dateMs) < 15 * 24 * 60 * 60 * 1000
    );
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {Number(p.value).toFixed(2)}
          </div>
        ))}
        {nearbyEvent && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 11 }}>
              📍 {nearbyEvent.shortTitle}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{nearbyEvent.description.slice(0, 80)}…</div>
            <div style={{ fontSize: 11, color: nearbyEvent.deltaCSI > 0 ? '#ef4444' : '#22c55e' }}>
              CSI Impact: {nearbyEvent.deltaCSI > 0 ? '+' : ''}{nearbyEvent.deltaCSI}
            </div>
          </div>
        )}
      </div>
    );
  }}
/>
```

### 5.4 CSI Level Context During Each Event vs. Today

To show "CSI was X at this event vs. Y today":

```tsx
// In the data generation loop, annotate event points
const eventAtThisDate = landmarkEvents.find(e =>
  Math.abs(e.date.getTime() - date.getTime()) < (interval / 2) * 24 * 60 * 60 * 1000
);

const point = {
  dateMs: date.getTime(),
  dateLabel: formatDateLabel(date, timeWindow),
  'CO-GRI': companyCsi,
  'Sector Avg': showSectorAvg ? computeSectorAvgAtDate(...) : undefined,
  eventId: eventAtThisDate?.id ?? null,
  eventShortTitle: eventAtThisDate?.shortTitle ?? null,
  eventDeltaCSI: eventAtThisDate?.deltaCSI ?? null,
};
```

Then in the tooltip, display:
```
CO-GRI at event: 62.4
CO-GRI today:    45.1
Change since:    -17.3 (↓ risk decreased)
```

### 5.5 Extend Event Display to Shorter Windows

Currently only `3Y`, `5Y`, `10Y` show events. Consider:
- `12M`: Show events from `HISTORICAL_GEOPOLITICAL_EVENTS` (not just landmarks) that occurred in the past year — there are many (Sudan 2023, Gaza 2023, etc.)
- `90D`: Show only Critical-severity events in the past 90 days

This requires extending `getLandmarkEvents()` or creating a new `getEventsForWindow()` helper that returns non-landmark events for shorter windows.

---

## 6. Potential Challenges & Considerations

### 6.1 X-Axis Migration Risk
Switching from categorical to numeric x-axis is a **breaking change** for the existing `<ReferenceLine>` calls and the `xAxisInterval` logic. All three must be updated together. The `tickFormatter` must replicate the existing `formatDateLabel` output exactly to avoid visual regression.

### 6.2 Label Collision
With 8 landmark events in a 10Y window, rotated labels at the top of the chart will overlap if events are close in time (e.g., Arab Spring Jan 2011 and Fukushima Mar 2011 are only 2 months apart). Solutions:
- Alternate label positions (top/bottom)
- Show labels only on hover (use dot markers without static labels)
- Cluster nearby events and show a count badge

### 6.3 Performance
For `10Y` windows, the chart already generates ~175 data points (3650 days ÷ 21-day interval). Adding 8 `<ReferenceArea>` + 8 `<ReferenceLine>` elements is negligible. No performance concern.

### 6.4 Recharts `<ReferenceLine>` Label Overflow
Recharts clips SVG content to the chart area by default. Rotated labels at the top may be clipped. Fix:
```tsx
<LineChart margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
```
Increase `top` margin to accommodate rotated event labels.

### 6.5 `ReferenceArea` Import
`<ReferenceArea>` is already available in Recharts but is **not currently imported** in `COGRITrendChart.tsx`. Add it to the import:
```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
  ReferenceArea,   // ← add this
} from 'recharts';
```

### 6.6 `HistoricalEventMarkers` Component Reuse
The standalone `HistoricalEventMarkers` component in `src/components/dashboard/` already has:
- Category filtering (Military / Political / Economic / Other)
- Color coding
- Severity-based sizing
- `getChartEventMarkers()` helper

Rather than duplicating this logic in `COGRITrendChart`, import and reuse `getChartEventMarkers()` to get pre-processed event data with colors already assigned.

### 6.7 `HistoricalEventMarker.countries` vs `affectedCountries`
In `HistoricalEventMarkers.tsx` line 173, the code references `event.affectedCountries` but the `HistoricalEventMarker` interface defines `countries` (not `affectedCountries`). This is a pre-existing type bug in the standalone component — do not replicate it.

---

## 7. Recommended Implementation Order

| Priority | Task | Effort |
|----------|------|--------|
| 1 | Switch `COGRITrendChart` x-axis to numeric timestamps | Medium |
| 2 | Fix `<ReferenceLine x={event.date.getTime()}>` to use numeric ms | Small |
| 3 | Add `<ReferenceArea>` shaded bands for each event | Small |
| 4 | Build `CustomEventLabel` SVG component with hover tooltip | Medium |
| 5 | Extend Recharts `<Tooltip>` to show event context (CSI then vs. now) | Medium |
| 6 | Remove / collapse the below-chart amber badge box | Small |
| 7 | Extend event display to `12M` window using non-landmark events | Medium |
| 8 | Add category filter toggle (reuse `getChartEventMarkers()`) | Small |

---

## 8. Minimal Code Change Summary (for implementer)

The **minimum viable fix** to make events appear on the chart (without full numeric x-axis migration) is:

1. In the data generation loop, **snap each landmark event to the nearest sampled data point** and store the formatted label:
```ts
// After generating all data points, annotate the nearest point for each event
landmarkEvents.forEach(event => {
  let nearest = result[0];
  let minDiff = Infinity;
  result.forEach(pt => {
    const diff = Math.abs(new Date(pt.date).getTime() - event.date.getTime());
    // Note: pt.date is a formatted string — need to store raw Date too
    if (diff < minDiff) { minDiff = diff; nearest = pt; }
  });
  nearest._eventLabel = event.shortTitle;
  nearest._eventColor = getEventColor(event);
});
```

2. Then use `<ReferenceLine x={nearest.date}>` where `nearest.date` is guaranteed to be in the data array.

**However, the full numeric x-axis approach (Section 5.1) is strongly recommended** as it is more robust, eliminates the snapping approximation, and correctly positions events at their exact dates.

---

## 9. Conclusion

The event markers are **already wired up in the data layer** — `LANDMARK_EVENTS` is populated, `getLandmarkEvents()` is called, and `<ReferenceLine>` elements are rendered. The sole reason they are invisible on the chart is the **x-axis type mismatch**: Recharts cannot match a `Date.getTime()` numeric value against categorical string labels. The below-chart badge box is a fallback that was added (or left in) when the reference lines failed to render.

The fix is surgical: migrate the x-axis to numeric timestamps and the existing `<ReferenceLine>` elements will immediately appear on the chart. The shaded bands, hover tooltips, and CSI-context features are additive enhancements that can be layered on top.