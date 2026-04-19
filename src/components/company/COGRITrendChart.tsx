/**
 * CO-GRI Trend Chart (C2)
 * Show evolution of company risk over time
 * Part of CO-GRI Platform Phase 2 - Week 2
 *
 * ENHANCED (2026-03-20):
 * - Switched x-axis to numeric timestamps for reliable ReferenceLine positioning
 * - Added ReferenceArea shaded bands for each landmark event
 * - Built CustomEventLabel SVG component with hover tooltip
 * - Extended Recharts Tooltip to show CSI-then-vs-now context
 * - Removed below-chart amber badge fallback (events now on chart)
 * - Increased chart top margin to prevent label clipping
 * - Alternating label positions for close events (Arab Spring / Fukushima)
 * - Color-coded by event category via getChartEventMarkers()
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { getRiskLevel, calculateVolatility, formatDelta } from '@/utils/riskCalculations';
import { compositeCalculator } from '@/services/csi/compositeCalculator';
import {
  ExtendedTimeWindow,
  isExtendedTimeWindow,
  getTimeWindowDays,
  getLandmarkEvents,
  HistoricalEventMarker,
} from '@/data/historicalGeopoliticalEvents';
import { generatePeerCompanies } from '@/utils/peerComparison';
import { getChartEventMarkers } from '@/components/dashboard/HistoricalEventMarkers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CountryExposure {
  country: string;
  risk_share: number;
  AdjS?: number;
}

interface TrendDataPoint {
  timestamp: Date;
  CO_GRI: number;
  sectorAvg?: number;
  top_contributors?: Array<{ country: string; AdjS: number; risk_share: number }>;
}

interface COGRITrendChartProps {
  ticker: string;
  companyName: string;
  /** Still accepted but ignored – data is generated internally */
  trendData?: TrendDataPoint[];
  currentScore: number;
  /** Country exposures used to compute the weighted company CSI time series */
  countryExposures?: CountryExposure[];
  sector?: string;
}

/** Chart data point shape — numeric dateMs for reliable ReferenceLine positioning */
interface ChartDataPoint {
  dateMs: number;
  dateLabel: string;
  'CO-GRI': number;
  'Sector Avg'?: number;
}

// ─── Time window config ───────────────────────────────────────────────────────

const TIME_WINDOW_OPTIONS: {
  value: ExtendedTimeWindow;
  label: string;
  isExtended: boolean;
}[] = [
  { value: '7D',  label: '7D',  isExtended: false },
  { value: '30D', label: '30D', isExtended: false },
  { value: '90D', label: '90D', isExtended: false },
  { value: '12M', label: '12M', isExtended: false },
  { value: '3Y',  label: '3Y',  isExtended: true  },
  { value: '5Y',  label: '5Y',  isExtended: true  },
  { value: '10Y', label: '10Y', isExtended: true  },
];

/** Interval between data points for performance */
function getInterval(tw: ExtendedTimeWindow): number {
  switch (tw) {
    case '7D':  return 1;
    case '30D': return 1;
    case '90D': return 3;
    case '12M': return 7;
    case '3Y':  return 7;
    case '5Y':  return 14;
    case '10Y': return 21;
    default:    return 1;
  }
}

function formatDateLabel(date: Date, tw: ExtendedTimeWindow): string {
  if (tw === '7D' || tw === '30D' || tw === '90D') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (tw === '12M') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ─── Event color helper ───────────────────────────────────────────────────────

/**
 * Returns a hex color for a landmark event based on its category.
 * Uses the same logic as getChartEventMarkers() in HistoricalEventMarkers.tsx
 * to keep colors consistent across the platform.
 */
function getEventColor(event: HistoricalEventMarker): string {
  const cat = event.category;
  if (cat === 'Conflict' || cat === 'Military Posture') return '#ef4444'; // red
  if (cat === 'Governance' || cat === 'Protest' || cat === 'Unrest') return '#f97316'; // orange
  if (cat === 'Trade' || cat === 'Sanctions' || cat === 'Currency') return '#eab308'; // yellow
  return '#3b82f6'; // blue – Diplomatic, Infrastructure, Cyber, etc.
}

// ─── Sector average helper ────────────────────────────────────────────────────

/**
 * Compute a sector-average CSI at a given date.
 * Uses up to 5 peer tickers; each peer's CSI is approximated via
 * compositeCalculator.calculateGlobalCSIAtDate with a small random
 * sector-correlated offset (deterministic per ticker so the line is smooth).
 */
function computeSectorAvgAtDate(
  currentTicker: string,
  sector: string,
  currentScore: number,
  date: Date
): number {
  const peers = generatePeerCompanies(currentTicker, sector, currentScore, 5);
  if (peers.length === 0) return compositeCalculator.calculateGlobalCSIAtDate(date);

  const globalBase = compositeCalculator.calculateGlobalCSIAtDate(date);
  const peerScores = peers.map((p) => {
    const seed = p.ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const offset = ((seed % 20) - 10) * 0.4;
    return Math.max(0, Math.min(100, globalBase + offset));
  });

  return parseFloat(
    (peerScores.reduce((a, b) => a + b, 0) / peerScores.length).toFixed(1)
  );
}

// ─── Custom Event Label SVG Component ────────────────────────────────────────

interface CustomEventLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  event: HistoricalEventMarker;
  labelPosition: 'top' | 'bottom';
  currentScore: number;
  eventCSI: number | null;
}

const CustomEventLabel: React.FC<CustomEventLabelProps> = ({
  viewBox,
  event,
  labelPosition,
  currentScore,
  eventCSI,
}) => {
  const [hovered, setHovered] = useState(false);
  const color = getEventColor(event);

  if (!viewBox) return null;

  const { x, y, height } = viewBox;

  // Dot position: top of chart area
  const dotY = labelPosition === 'top' ? y + 12 : y + height - 12;
  // Label anchor: rotate from dot position
  const labelY = labelPosition === 'top' ? dotY - 6 : dotY + 6;

  // Tooltip dimensions
  const ttWidth = 210;
  const ttHeight = eventCSI !== null ? 100 : 80;
  // Keep tooltip inside chart bounds
  const ttX = Math.max(x - ttWidth / 2, 4);
  const ttY = labelPosition === 'top' ? dotY + 14 : dotY - ttHeight - 14;

  const formattedDate = event.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const delta = eventCSI !== null ? (currentScore - eventCSI).toFixed(1) : null;
  const deltaNum = delta !== null ? parseFloat(delta) : null;

  return (
    <g>
      {/* Dot marker */}
      <circle
        cx={x}
        cy={dotY}
        r={5}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Rotated short-title label */}
      <text
        x={x}
        y={labelY}
        fill={color}
        fontSize={8}
        fontWeight={600}
        textAnchor="start"
        transform={`rotate(-45, ${x}, ${labelY})`}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {event.shortTitle}
      </text>

      {/* Hover tooltip */}
      {hovered && (
        <g
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Tooltip background */}
          <rect
            x={ttX}
            y={ttY}
            width={ttWidth}
            height={ttHeight}
            rx={6}
            ry={6}
            fill="#1f2937"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.97}
          />

          {/* Event name */}
          <text x={ttX + 10} y={ttY + 18} fill="white" fontSize={11} fontWeight={700}>
            {event.shortTitle}
          </text>

          {/* Date */}
          <text x={ttX + 10} y={ttY + 33} fill="#9ca3af" fontSize={9}>
            {formattedDate}
          </text>

          {/* CSI Impact */}
          <text x={ttX + 10} y={ttY + 50} fill="#9ca3af" fontSize={9}>
            CSI Impact:
          </text>
          <text
            x={ttX + 75}
            y={ttY + 50}
            fill={event.deltaCSI > 0 ? '#ef4444' : '#22c55e'}
            fontSize={9}
            fontWeight={700}
          >
            {event.deltaCSI > 0 ? '+' : ''}{event.deltaCSI.toFixed(1)}
          </text>

          {/* CO-GRI then vs now */}
          {eventCSI !== null && (
            <>
              <text x={ttX + 10} y={ttY + 65} fill="#9ca3af" fontSize={9}>
                CO-GRI at event:
              </text>
              <text x={ttX + 110} y={ttY + 65} fill="#60a5fa" fontSize={9} fontWeight={700}>
                {eventCSI.toFixed(1)}
              </text>

              <text x={ttX + 10} y={ttY + 80} fill="#9ca3af" fontSize={9}>
                CO-GRI today:
              </text>
              <text x={ttX + 110} y={ttY + 80} fill="#60a5fa" fontSize={9} fontWeight={700}>
                {currentScore.toFixed(1)}
              </text>

              {deltaNum !== null && (
                <>
                  <text x={ttX + 10} y={ttY + 95} fill="#9ca3af" fontSize={9}>
                    Change since:
                  </text>
                  <text
                    x={ttX + 110}
                    y={ttY + 95}
                    fill={deltaNum < 0 ? '#22c55e' : '#ef4444'}
                    fontSize={9}
                    fontWeight={700}
                  >
                    {deltaNum > 0 ? '+' : ''}{delta} {deltaNum < 0 ? '↓ risk ↓' : '↑ risk ↑'}
                  </text>
                </>
              )}
            </>
          )}
        </g>
      )}
    </g>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: ChartDataPoint }>;
  label?: string | number;
  landmarkEvents: HistoricalEventMarker[];
  currentScore: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  landmarkEvents,
  currentScore,
}) => {
  if (!active || !payload?.length) return null;

  const dateMs = payload[0]?.payload?.dateMs;
  const dateLabel = payload[0]?.payload?.dateLabel;
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

  const nearbyEvent = landmarkEvents.find(
    (e) => Math.abs(e.date.getTime() - dateMs) < FIFTEEN_DAYS_MS
  );

  const coGRIValue = payload.find((p) => p.name === 'CO-GRI Score')?.value;

  return (
    <div
      style={{
        background: '#1f2937',
        border: '1px solid #374151',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 600, color: '#f9fafb', marginBottom: 6, fontSize: 12 }}>
        {dateLabel}
      </div>

      {payload.map((p) => (
        <div
          key={p.name}
          style={{ color: p.color, fontSize: 12, marginBottom: 2 }}
        >
          {p.name}: <strong>{Number(p.value).toFixed(2)}</strong>
        </div>
      ))}

      {nearbyEvent && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid #374151',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: getEventColor(nearbyEvent),
              fontSize: 11,
              marginBottom: 3,
            }}
          >
            📍 {nearbyEvent.shortTitle}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4, lineHeight: 1.4 }}>
            {nearbyEvent.description.length > 80
              ? nearbyEvent.description.slice(0, 80) + '…'
              : nearbyEvent.description}
          </div>
          <div
            style={{
              fontSize: 10,
              color: nearbyEvent.deltaCSI > 0 ? '#ef4444' : '#22c55e',
              marginBottom: 2,
            }}
          >
            CSI Impact: {nearbyEvent.deltaCSI > 0 ? '+' : ''}{nearbyEvent.deltaCSI.toFixed(1)}
          </div>
          {coGRIValue !== undefined && (
            <>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                CO-GRI at event:{' '}
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                  {coGRIValue.toFixed(1)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                CO-GRI today:{' '}
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                  {currentScore.toFixed(1)}
                </span>
              </div>
              {(() => {
                const diff = currentScore - coGRIValue;
                return (
                  <div
                    style={{
                      fontSize: 10,
                      color: diff < 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 700,
                    }}
                  >
                    Change since: {diff > 0 ? '+' : ''}{diff.toFixed(1)}{' '}
                    {diff < 0 ? '↓ risk ↓' : '↑ risk ↑'}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const COGRITrendChart: React.FC<COGRITrendChartProps> = ({
  ticker,
  companyName,
  trendData: _ignoredTrendData,
  currentScore,
  countryExposures = [],
  sector = 'Technology',
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const setGlobalTimeWindow = useGlobalState((state) => state.setTimeWindow);

  // Internal time window state – owns the selector
  const [timeWindow, setTimeWindow] = useState<ExtendedTimeWindow>('12M');
  const [showRiskBands, setShowRiskBands] = useState(true);
  const [showSectorAvg, setShowSectorAvg] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // ── Generate chart data whenever ticker / timeWindow / exposures change ──
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const generate = () => {
      const days = getTimeWindowDays(timeWindow);
      const interval = getInterval(timeWindow);
      const now = new Date();
      const result: ChartDataPoint[] = [];

      // Determine top exposure countries (up to 5) and their weights
      const topExposures = [...countryExposures]
        .sort((a, b) => (b.risk_share ?? 0) - (a.risk_share ?? 0))
        .slice(0, 5);

      const totalWeight = topExposures.reduce((s, e) => s + (e.risk_share ?? 0), 0);

      for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Weighted company CSI: blend country CSIs by exposure weight
        let companyCsi: number;
        if (topExposures.length > 0 && totalWeight > 0) {
          const weighted = topExposures.reduce((sum, exp) => {
            const csi = compositeCalculator.getCSIAtDate(exp.country, date);
            return sum + csi * (exp.risk_share / totalWeight);
          }, 0);
          // Blend 70% company-specific, 30% global to keep it realistic
          const globalCsi = compositeCalculator.calculateGlobalCSIAtDate(date);
          companyCsi = parseFloat((weighted * 0.7 + globalCsi * 0.3).toFixed(1));
        } else {
          // Fallback: use global CSI with a small deterministic company offset
          const globalCsi = compositeCalculator.calculateGlobalCSIAtDate(date);
          const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const offset = ((seed % 14) - 7) * 0.5;
          companyCsi = parseFloat(
            Math.max(0, Math.min(100, globalCsi + offset)).toFixed(1)
          );
        }

        const point: ChartDataPoint = {
          dateMs: date.getTime(),
          dateLabel: formatDateLabel(date, timeWindow),
          'CO-GRI': companyCsi,
        };

        if (showSectorAvg) {
          point['Sector Avg'] = computeSectorAvgAtDate(ticker, sector, currentScore, date);
        }

        result.push(point);
      }

      if (!cancelled) {
        setChartData(result);
        setIsLoading(false);
      }
    };

    // Defer heavy extended-window calculations off the main paint
    if (isExtendedTimeWindow(timeWindow)) {
      const id = setTimeout(generate, 0);
      return () => { cancelled = true; clearTimeout(id); };
    } else {
      generate();
      return () => { cancelled = true; };
    }
  }, [ticker, timeWindow, countryExposures, sector, currentScore, showSectorAvg]);

  // ── Handle time window button click ──────────────────────────────────────
  const handleTimeWindowChange = useCallback(
    (tw: ExtendedTimeWindow) => {
      setTimeWindow(tw);
      // Keep globalState in sync so the header badge reflects the selection
      const globalMap: Record<ExtendedTimeWindow, string> = {
        '7D': '1M', '30D': '1M', '90D': '3M',
        '12M': '1Y', '3Y': '2Y', '5Y': '2Y', '10Y': 'All',
      };
      setGlobalTimeWindow(globalMap[tw] as any);
    },
    [setGlobalTimeWindow]
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const firstScore = chartData[0]?.['CO-GRI'] ?? currentScore;
  const lastScore  = chartData[chartData.length - 1]?.['CO-GRI'] ?? currentScore;
  const scoreChange    = lastScore - firstScore;
  const percentChange  = firstScore > 0 ? (scoreChange / firstScore) * 100 : 0;
  const isIncreasing   = scoreChange > 0;
  const volatility     = calculateVolatility(chartData.map((d) => d['CO-GRI']));

  // ── Landmark events for extended windows ─────────────────────────────────
  const landmarkEvents = useMemo(() => {
    if (!isExtendedTimeWindow(timeWindow)) return [];
    return getLandmarkEvents(timeWindow);
  }, [timeWindow]);

  // ── Chart domain bounds (for clamping ReferenceArea) ─────────────────────
  const chartDomainMs = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: Date.now() };
    return {
      min: chartData[0].dateMs,
      max: chartData[chartData.length - 1].dateMs,
    };
  }, [chartData]);

  // ── Lookup: CO-GRI value at (or near) each event date ────────────────────
  const eventCSIMap = useMemo(() => {
    const map = new Map<string, number>();
    if (chartData.length === 0) return map;

    landmarkEvents.forEach((event) => {
      const eventMs = event.date.getTime();
      // Find the nearest data point
      let nearest = chartData[0];
      let minDiff = Math.abs(chartData[0].dateMs - eventMs);
      for (const pt of chartData) {
        const diff = Math.abs(pt.dateMs - eventMs);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = pt;
        }
      }
      map.set(event.id, nearest['CO-GRI']);
    });

    return map;
  }, [chartData, landmarkEvents]);

  // ── Label collision: alternate top/bottom for events < 60 days apart ─────
  const eventLabelPositions = useMemo(() => {
    const positions = new Map<string, 'top' | 'bottom'>();
    const sorted = [...landmarkEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

    sorted.forEach((event, idx) => {
      const prev = sorted[idx - 1];
      if (prev && event.date.getTime() - prev.date.getTime() < SIXTY_DAYS_MS) {
        // Alternate: if prev is 'top', put this one 'bottom' and vice-versa
        positions.set(event.id, positions.get(prev.id) === 'top' ? 'bottom' : 'top');
      } else {
        positions.set(event.id, 'top');
      }
    });

    return positions;
  }, [landmarkEvents]);

  // ── Risk bands ────────────────────────────────────────────────────────────
  const riskBands = [
    { value: 30, label: 'Low/Moderate',       color: '#F59E0B' },
    { value: 50, label: 'Moderate/Elevated',  color: '#F97316' },
    { value: 70, label: 'Elevated/High',      color: '#EF4444' },
  ];

  // ── X-axis interval ───────────────────────────────────────────────────────
  const xAxisInterval = useMemo(() => {
    switch (timeWindow) {
      case '7D':  return 0;
      case '30D': return 5;
      case '90D': return 4;
      case '12M': return 6;
      case '3Y':  return 8;
      case '5Y':  return 10;
      case '10Y': return 12;
      default:    return 'preserveStartEnd' as const;
    }
  }, [timeWindow]);

  // ── Y-axis domain ─────────────────────────────────────────────────────────
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    let min = Infinity, max = -Infinity;
    chartData.forEach((p) => {
      if (p['CO-GRI'] < min) min = p['CO-GRI'];
      if (p['CO-GRI'] > max) max = p['CO-GRI'];
      if (p['Sector Avg'] !== undefined) {
        if (p['Sector Avg'] < min) min = p['Sector Avg'];
        if (p['Sector Avg'] > max) max = p['Sector Avg'];
      }
    });
    const pad = Math.max(5, (max - min) * 0.2);
    const lo = Math.max(0, Math.floor(min - pad));
    const hi = Math.min(100, Math.ceil(max + pad));
    if (hi - lo < 10) {
      const mid = (lo + hi) / 2;
      return [Math.max(0, mid - 10), Math.min(100, mid + 10)];
    }
    return [lo, hi];
  }, [chartData]);

  // ── 30-day band width in ms ───────────────────────────────────────────────
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Card className="w-full" data-testid="cogri-trend-chart">
      <CardHeader>
        {/* Row 1: lens badge + toggles */}
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRiskBands(!showRiskBands)}
            >
              {showRiskBands ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Risk Bands
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSectorAvg(!showSectorAvg)}
            >
              {showSectorAvg ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Sector Avg
            </Button>
          </div>
        </div>

        {/* Row 2: title + delta */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              CO-GRI Trend ({timeWindow})
            </CardTitle>
            <CardDescription>
              Risk score evolution for {companyName} ({ticker})
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {isIncreasing
                ? <TrendingUp className="h-5 w-5 text-red-600" />
                : <TrendingDown className="h-5 w-5 text-green-600" />}
              <span className={`text-lg font-semibold ${isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
                {formatDelta(scoreChange)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDelta(percentChange)}% from baseline
            </div>
          </div>
        </div>

        {/* Row 3: Time Window Selector */}
        <div className="flex items-center gap-2 flex-wrap mt-3">
          <span className="text-sm text-muted-foreground mr-1">Time Window:</span>
          {TIME_WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTimeWindowChange(opt.value)}
              disabled={isLoading}
              className={[
                'px-3 py-1.5 text-sm rounded-md border transition-all duration-200',
                timeWindow === opt.value
                  ? opt.isExtended
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-blue-600 text-white border-blue-500'
                  : opt.isExtended
                    ? 'bg-transparent text-amber-500 border-amber-500/50 hover:bg-amber-900/20'
                    : 'bg-transparent text-muted-foreground border-border hover:bg-muted',
                isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
              title={opt.isExtended ? 'Extended historical window' : ''}
            >
              {opt.label}
              {opt.isExtended && <span className="ml-1 text-xs opacity-70">⏱</span>}
            </button>
          ))}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        {/* Event legend for extended windows */}
        {isExtendedTimeWindow(timeWindow) && landmarkEvents.length > 0 && !isLoading && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Events:</span>
            {landmarkEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getEventColor(event) }}
                />
                <span className="text-xs text-muted-foreground">{event.shortTitle}</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Calculating {timeWindow} time series…
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: isExtendedTimeWindow(timeWindow) ? 50 : 10,
                  right: 30,
                  left: 20,
                  bottom: isExtendedTimeWindow(timeWindow) ? 50 : 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                {/* ── Numeric time-based X-axis ── */}
                <XAxis
                  dataKey="dateMs"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  interval={xAxisInterval}
                  angle={isExtendedTimeWindow(timeWindow) ? -45 : 0}
                  textAnchor={isExtendedTimeWindow(timeWindow) ? 'end' : 'middle'}
                  height={isExtendedTimeWindow(timeWindow) ? 60 : 30}
                  tickFormatter={(ms: number) => formatDateLabel(new Date(ms), timeWindow)}
                />

                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  domain={yDomain}
                  label={{ value: 'CO-GRI Score', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
                />

                {/* ── Custom tooltip with event context ── */}
                <Tooltip
                  content={
                    <CustomTooltip
                      landmarkEvents={landmarkEvents}
                      currentScore={currentScore}
                    />
                  }
                />
                <Legend />

                {/* ── Risk band reference lines ── */}
                {showRiskBands && riskBands.map((band, idx) => (
                  <ReferenceLine
                    key={idx}
                    y={band.value}
                    stroke={band.color}
                    strokeDasharray="5 5"
                    label={{ value: band.label, position: 'right', fill: band.color, fontSize: 10 }}
                  />
                ))}

                {/* ── Shaded ReferenceArea bands for each landmark event ── */}
                {isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event) => {
                  const startMs = Math.max(event.date.getTime(), chartDomainMs.min);
                  const endMs   = Math.min(event.date.getTime() + THIRTY_DAYS_MS, chartDomainMs.max);
                  if (startMs >= endMs) return null;
                  const color = getEventColor(event);
                  return (
                    <ReferenceArea
                      key={`band-${event.id}`}
                      x1={startMs}
                      x2={endMs}
                      fill={color}
                      fillOpacity={0.08}
                      stroke="none"
                    />
                  );
                })}

                {/* ── Landmark event vertical lines with custom SVG labels ── */}
                {isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event) => {
                  const eventMs = event.date.getTime();
                  // Only render if within chart domain
                  if (eventMs < chartDomainMs.min || eventMs > chartDomainMs.max) return null;
                  const color = getEventColor(event);
                  const labelPos = eventLabelPositions.get(event.id) ?? 'top';
                  const eventCSI = eventCSIMap.get(event.id) ?? null;

                  return (
                    <ReferenceLine
                      key={event.id}
                      x={eventMs}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      strokeOpacity={0.7}
                      label={
                        <CustomEventLabel
                          event={event}
                          labelPosition={labelPos}
                          currentScore={currentScore}
                          eventCSI={eventCSI}
                        />
                      }
                    />
                  );
                })}

                {/* ── Company CO-GRI line ── */}
                <Line
                  type="monotone"
                  dataKey="CO-GRI"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={timeWindow === '7D'}
                  activeDot={{ r: 6 }}
                  name="CO-GRI Score"
                />

                {/* ── Sector average benchmark line ── */}
                {showSectorAvg && (
                  <Line
                    type="monotone"
                    dataKey="Sector Avg"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4 }}
                    name={`${sector} Sector Avg`}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats row */}
        {!isLoading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Current Score</div>
              <div className="text-2xl font-bold text-primary">{currentScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">{getRiskLevel(currentScore)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Change ({timeWindow})</div>
              <div className={`text-2xl font-bold ${isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
                {formatDelta(scoreChange)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{formatDelta(percentChange)}%</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Volatility</div>
              <div className="text-2xl font-bold text-gray-700">{volatility.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">Std. deviation</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Baseline</div>
              <div className="text-2xl font-bold text-gray-700">{firstScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">Period start</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default COGRITrendChart;