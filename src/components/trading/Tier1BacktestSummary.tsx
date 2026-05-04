/**
 * Tier 1 Back-Test Summary Box
 *
 * Prominent summary panel displayed at the top of the Backtest tab.
 * - Auto-runs on mount ONLY if no cached result exists (or cache > 30 min old)
 * - Results are stored in the global Zustand store → survive tab switches
 * - Fetches REAL live weekly price data via:
 *     1. Supabase Edge Function (server-side, bypasses CORS) — primary
 *     2. Browser CORS proxies — fallback
 *     3. Realistic synthetic/estimated benchmark data — final fallback
 * - Displays performance comparison table: Strategy | S&P 500 | DJIA
 * - Recharts equity curve
 * - "Live · Yahoo Finance" badge when live data; "Estimated" badge when synthetic
 * - Color-coded cells (green = outperform, red = underperform)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'recharts';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wifi,
  WifiOff,
  Clock,
  BarChart2,
} from 'lucide-react';
import { runTier1Backtest, type Tier1BacktestMetrics } from '@/services/yahooFinanceService';
import { useTradingState } from '@/store/tradingState';

// ── Universe (must match TradingMode.tsx INITIAL_UNIVERSE_TICKERS) ─────────────
const UNIVERSE_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META',
  'JPM', 'GS', 'V', 'BAC', 'BLK',
  'JNJ', 'PFE', 'LLY', 'UNH', 'MRK',
  'XOM', 'CVX', 'COP',
  'WMT', 'MCD', 'NKE', 'KO',
  'TSM', 'ASML', 'NVO',
];

/** Cache TTL: 30 minutes in milliseconds */
const CACHE_TTL_MS = 30 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtPct(n: number, decimals = 1, showSign = true): string {
  const sign = showSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

function colorClass(value: number, higherIsBetter = true): string {
  if (higherIsBetter) {
    return value > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold';
  }
  return value < 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold';
}

function alphaColor(alpha: number): string {
  if (alpha > 2) return 'text-emerald-600 font-bold';
  if (alpha > 0) return 'text-emerald-500 font-semibold';
  if (alpha < -2) return 'text-red-600 font-bold';
  return 'text-red-500 font-semibold';
}

function formatAge(fetchedAt: number): string {
  const ageMs = Date.now() - fetchedAt;
  const mins = Math.floor(ageMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`;
}

// Custom tooltip for the equity curve
const EquityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)} (base 100)
        </p>
      ))}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tier1BacktestSummary() {
  const { tier1Metrics, tier1FetchedAt, setTier1Metrics, setTier1FetchedAt } = useTradingState();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const [displayAge, setDisplayAge] = useState<string>('');
  const ageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!tier1FetchedAt) return;
    setDisplayAge(formatAge(tier1FetchedAt));
    ageTimerRef.current = setInterval(() => {
      setDisplayAge(formatAge(tier1FetchedAt));
    }, 30_000);
    return () => {
      if (ageTimerRef.current) clearInterval(ageTimerRef.current);
    };
  }, [tier1FetchedAt]);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await runTier1Backtest(UNIVERSE_TICKERS, (pct) => {
        setProgress(pct);
      });
      setTier1Metrics(result);
      setTier1FetchedAt(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setHasRun(true);
    }
  }, [setTier1Metrics, setTier1FetchedAt]);

  useEffect(() => {
    const cacheStale =
      !tier1Metrics ||
      !tier1FetchedAt ||
      Date.now() - tier1FetchedAt > CACHE_TTL_MS;

    if (cacheStale) {
      runBacktest();
    } else {
      setHasRun(true);
    }
  }, []); // intentionally run once on mount only

  const metrics = tier1Metrics;
  const isEstimated = metrics?.dataSource === 'estimated';

  // Thin chart data (max 104 points for performance)
  const chartData = metrics
    ? metrics.equityCurve.filter(
        (_, i) => i % Math.max(1, Math.floor(metrics.equityCurve.length / 104)) === 0
      )
    : [];

  return (
    <div className="space-y-4">
      {/* ── Header card ──────────────────────────────────────────────────── */}
      <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-background">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Tier 1 Back-Test Summary
                  <Badge
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    CO-GRI Strategy
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Equal-weight long strategy · CO-GRI signal universe · vs S&amp;P 500 &amp; DJIA
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {metrics && (
                <>
                  {/* Data source badge */}
                  {isEstimated ? (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-400/50 text-amber-400">
                      <BarChart2 className="h-3 w-3" />
                      Estimated · Synthetic Benchmarks
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 border-blue-400/50 text-blue-400">
                      <Database className="h-3 w-3" />
                      Live · Yahoo Finance
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs gap-1 border-emerald-400/50 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {metrics.dateRange.start} → {metrics.dateRange.end}
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1 border-purple-400/50 text-purple-400">
                    <Wifi className="h-3 w-3" />
                    {metrics.tickersLoaded}/{metrics.tickersAttempted} Companies
                  </Badge>
                  {tier1FetchedAt && !loading && (
                    <Badge variant="outline" className="text-xs gap-1 border-muted text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {displayAge}
                    </Badge>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={runBacktest}
                disabled={loading}
                className="h-7 text-xs gap-1"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {loading ? `${progress}%` : 'Retry Live Data Fetch'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Loading state ──────────────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">Fetching live market data…</p>
                <p className="text-xs text-muted-foreground">
                  Downloading real weekly price history for {UNIVERSE_TICKERS.length} tickers + benchmarks from Yahoo Finance
                </p>
              </div>
              <div className="w-64 bg-muted rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
              {metrics && (
                <p className="text-xs text-muted-foreground italic">
                  Showing previous results while refreshing…
                </p>
              )}
            </div>
          )}

          {/* ── Estimated data notice (shown when using synthetic benchmarks) */}
          {!loading && metrics && isEstimated && (
            <Alert className="border-amber-500/40 bg-amber-500/5 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-xs text-amber-200/80">
                <strong className="text-amber-300">Estimated results:</strong>{' '}
                Live benchmark data (^GSPC, ^DJI) could not be fetched due to network/CORS restrictions.
                Benchmark curves use synthetic data based on known 2023–2025 market performance
                (S&P 500 ~23.5% ann., DJIA ~13.5% ann.). Strategy returns use{' '}
                {metrics.tickersLoaded > 0 ? 'live ticker data where available' : 'synthetic estimates'}.
                Click <strong>Retry Live Data Fetch</strong> to attempt live data again.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Error banner (when refresh failed but we have cached results) */}
          {!loading && error && metrics && (
            <Alert variant="destructive" className="border-red-500/50 py-2">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Refresh failed — showing {isEstimated ? 'estimated' : 'cached'} results from {displayAge}.{' '}
                <button
                  onClick={runBacktest}
                  className="underline font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* ── Hard error (no metrics at all, fetch completely failed) ──── */}
          {!loading && error && !metrics && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-red-500/50">
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Data unavailable:</strong> {error}
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-2">
                <p className="font-semibold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Why is this happening?
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Browser CORS restrictions may be blocking Yahoo Finance API requests</li>
                  <li>Yahoo Finance rate limiting or temporary outage</li>
                  <li>Network connectivity issue</li>
                  <li>Supabase Edge Function not yet deployed</li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Button onClick={runBacktest} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry Live Data Fetch
                </Button>
              </div>
            </div>
          )}

          {/* ── Results ────────────────────────────────────────────────────── */}
          {metrics && (
            <>
              {/* Alpha highlight banner */}
              <div className={`rounded-lg p-4 flex items-center gap-4 ${
                metrics.alphaVsSP > 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                {metrics.alphaVsSP > 0 ? (
                  <TrendingUp className="h-8 w-8 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    CO-GRI Strategy Alpha vs S&P 500:{' '}
                    <span className={alphaColor(metrics.alphaVsSP)}>
                      {fmtPct(metrics.alphaVsSP)} annualised
                    </span>
                    {isEstimated && (
                      <span className="ml-2 text-xs text-amber-400 font-normal">(estimated)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Strategy annualised return:{' '}
                    <span className={colorClass(metrics.strategyAnnReturn)}>
                      {fmtPct(metrics.strategyAnnReturn)}
                    </span>{' '}
                    · Win rate vs S&P 500:{' '}
                    <span className={colorClass(metrics.winRate - 50)}>
                      {fmtPct(metrics.winRate, 1, false)} of weeks
                    </span>
                    {' '}· Sharpe:{' '}
                    <span className={colorClass(metrics.strategySharpe - metrics.spSharpe)}>
                      {fmt(metrics.strategySharpe)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Performance comparison table */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  Performance Comparison
                  <Badge variant="secondary" className="text-xs">
                    {metrics.dateRange.start} → {metrics.dateRange.end}
                  </Badge>
                  {isEstimated ? (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-400/40 text-amber-400">
                      <BarChart2 className="h-3 w-3" />
                      Estimated Data
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 border-blue-400/40 text-blue-400">
                      <Database className="h-3 w-3" />
                      Live Data
                    </Badge>
                  )}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Metric</TableHead>
                      <TableHead className="text-center">
                        <span className="text-emerald-500 font-semibold">CO-GRI Strategy</span>
                      </TableHead>
                      <TableHead className="text-center">
                        S&P 500{isEstimated && <span className="text-amber-400 text-xs ml-1">*</span>}
                      </TableHead>
                      <TableHead className="text-center">
                        DJIA{isEstimated && <span className="text-amber-400 text-xs ml-1">*</span>}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Annualised Return</TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.strategyAnnReturn)}`}>
                        {fmtPct(metrics.strategyAnnReturn)}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.spAnnReturn)}`}>
                        {fmtPct(metrics.spAnnReturn)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.djAnnReturn)}`}>
                        {fmtPct(metrics.djAnnReturn)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Sharpe Ratio (rf=4.5%)</TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.strategySharpe)}`}>
                        {fmt(metrics.strategySharpe)}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.spSharpe)}`}>
                        {fmt(metrics.spSharpe)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.djSharpe)}`}>
                        {fmt(metrics.djSharpe)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Max Drawdown</TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.strategyMaxDD, false)}`}>
                        {fmtPct(metrics.strategyMaxDD)}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.spMaxDD, false)}`}>
                        {fmtPct(metrics.spMaxDD)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.djMaxDD, false)}`}>
                        {fmtPct(metrics.djMaxDD)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Win Rate vs S&P 500</TableCell>
                      <TableCell className={`text-center text-sm ${colorClass(metrics.winRate - 50)}`}>
                        {fmtPct(metrics.winRate, 1, false)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Alpha vs S&P 500</TableCell>
                      <TableCell className={`text-center text-sm ${alphaColor(metrics.alphaVsSP)}`}>
                        {fmtPct(metrics.alphaVsSP)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Alpha vs DJIA</TableCell>
                      <TableCell className={`text-center text-sm ${alphaColor(metrics.alphaVsDJ)}`}>
                        {fmtPct(metrics.alphaVsDJ)}
                        {isEstimated && <span className="text-amber-400 text-xs ml-1">est.</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs text-muted-foreground">Companies Loaded</TableCell>
                      <TableCell className="text-center text-sm font-semibold">
                        {metrics.tickersLoaded}/{metrics.tickersAttempted}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {isEstimated && (
                  <p className="text-xs text-amber-400/70 mt-1">
                    * Benchmark figures are estimated based on known 2023–2025 market performance. Live data unavailable due to CORS restrictions.
                  </p>
                )}
              </div>

              {/* Equity curve */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  Equity Curve
                  <span className="text-xs text-muted-foreground font-normal">(Base = 100)</span>
                  {isEstimated && (
                    <Badge variant="outline" className="text-xs border-amber-400/40 text-amber-400">
                      Estimated
                    </Badge>
                  )}
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) => {
                        const dt = new Date(d);
                        return `${dt.toLocaleString('default', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v.toFixed(0)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<EquityTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) =>
                        value === 'strategy'
                          ? 'CO-GRI Strategy'
                          : value === 'sp500'
                          ? `S&P 500${isEstimated ? ' (est.)' : ''}`
                          : `DJIA${isEstimated ? ' (est.)' : ''}`
                      }
                    />
                    <ReferenceLine y={100} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="strategy"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                      name="strategy"
                    />
                    <Line
                      type="monotone"
                      dataKey="sp500"
                      stroke="#6366f1"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 3"
                      name="sp500"
                    />
                    <Line
                      type="monotone"
                      dataKey="djia"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="3 3"
                      name="djia"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Methodology note */}
              <Alert className="border-blue-500/30 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Methodology:</strong> Equal-weight long-only portfolio of{' '}
                  {metrics.tickersLoaded} CO-GRI signal tickers. Weekly rebalancing. Risk-free rate 4.5% p.a.{' '}
                  {isEstimated
                    ? `Benchmark data is synthetic/estimated (S&P 500 ~23.5% ann., DJIA ~13.5% ann.) due to live data unavailability. Click "Retry Live Data Fetch" for real data.`
                    : `Data sourced live from Yahoo Finance public API (${metrics.dateRange.start} → ${metrics.dateRange.end}).`
                  }{' '}
                  Past performance does not guarantee future results. This is a Tier 1 pilot — not investment advice.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* ── Not yet run ────────────────────────────────────────────────── */}
          {!loading && !metrics && !error && !hasRun && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Click <strong>Retry Live Data Fetch</strong> to run the Tier 1 back-test.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}