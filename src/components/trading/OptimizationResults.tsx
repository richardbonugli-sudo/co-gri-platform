/**
 * Optimization Results (T6)
 * Display portfolio optimization results
 *
 * FIXES:
 * - "Clear & Reset" button calls setOptimizationResult(null)
 * - "Apply Recommendations" wires to setCurrentPortfolio(optimized_portfolio)
 * - "Export Results" generates and downloads a CSV
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Download, Check, RotateCcw } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { useToast } from '@/components/ui/use-toast';

// ── CSV export helper ─────────────────────────────────────────────────────────

function exportResultsAsCSV(result: NonNullable<ReturnType<typeof useTradingState>['optimizationResult']>) {
  const { trades, optimized_portfolio, metrics_comparison } = result;
  const { original, optimized, improvements } = metrics_comparison;

  const rows: string[] = [];

  // Section 1: Metrics comparison
  rows.push('=== METRICS COMPARISON ===');
  rows.push('Metric,Original,Optimized,Improvement');
  rows.push(`Total Value,$${original.total_value.toLocaleString()},$${optimized.total_value.toLocaleString()},`);
  rows.push(`Weighted CO-GRI,${original.weighted_cogri.toFixed(1)},${optimized.weighted_cogri.toFixed(1)},`);
  rows.push(`Risk Score,${original.risk_score.toFixed(1)},${optimized.risk_score.toFixed(1)},${improvements.risk_reduction.toFixed(1)}%`);
  rows.push(`Expected Return,${original.expected_return.toFixed(1)}%,${optimized.expected_return.toFixed(1)}%,${improvements.return_improvement.toFixed(1)}%`);
  rows.push(`Sharpe Ratio,${original.sharpe_ratio.toFixed(2)},${optimized.sharpe_ratio.toFixed(2)},${improvements.sharpe_improvement.toFixed(1)}%`);
  rows.push(`Volatility,${original.volatility.toFixed(1)}%,${optimized.volatility.toFixed(1)}%,`);
  rows.push('');

  // Section 2: Recommended trades
  rows.push('=== RECOMMENDED TRADES ===');
  rows.push('Ticker,Action,Shares,Value,Rationale');
  for (const t of trades) {
    rows.push(`${t.ticker},${t.action},${t.shares.toFixed(0)},$${t.value.toLocaleString()},${t.rationale}`);
  }
  rows.push('');

  // Section 3: Optimized holdings
  rows.push('=== OPTIMIZED PORTFOLIO HOLDINGS ===');
  rows.push('Ticker,Company,Shares,Price,Value,Weight (%),CO-GRI,Sector');
  for (const h of optimized_portfolio.holdings) {
    rows.push(
      `${h.ticker},"${h.company_name}",${h.shares},${h.price.toFixed(2)},${h.value.toLocaleString()},${h.weight.toFixed(1)},${h.cogri.toFixed(1)},${h.sector}`
    );
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `portfolio-optimization-${result.optimization_id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── component ─────────────────────────────────────────────────────────────────

export default function OptimizationResults() {
  const { optimizationResult, setOptimizationResult, setCurrentPortfolio } = useTradingState();
  const { toast } = useToast();

  if (!optimizationResult) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No optimization results yet</p>
          <p className="text-sm mt-2">Configure your portfolio and settings, then click "Optimize Portfolio"</p>
        </CardContent>
      </Card>
    );
  }

  const { metrics_comparison, trades, optimized_portfolio } = optimizationResult;
  const { original, optimized, improvements } = metrics_comparison;

  // ── handlers ─────────────────────────────────────────────────────────────────

  const handleClearReset = () => {
    setOptimizationResult(null);
    toast({ title: 'Results cleared', description: 'You can now run a new optimization.' });
  };

  const handleApplyRecommendations = () => {
    setCurrentPortfolio(optimized_portfolio);
    toast({ title: 'Portfolio applied', description: 'Your current portfolio has been updated with the optimized allocation.' });
  };

  const handleExportResults = () => {
    try {
      exportResultsAsCSV(optimizationResult);
      toast({ title: 'Results exported as CSV.' });
    } catch (err) {
      toast({ title: 'Export failed. Please try again.', variant: 'destructive' });
      console.error('[OptimizationResults] Export error:', err);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Top action bar: Clear & Reset ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            Optimization ID: <code className="text-xs bg-muted px-1 rounded">{optimizationResult.optimization_id}</code>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated {optimizationResult.generated_at instanceof Date
              ? optimizationResult.generated_at.toLocaleString()
              : new Date(optimizationResult.generated_at).toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearReset}
          className="text-muted-foreground hover:text-red-600 hover:border-red-300 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear &amp; Reset
        </Button>
      </div>

      {/* ── Metrics Comparison ── */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Results</CardTitle>
          <CardDescription>Comparison of original vs optimized portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Original Portfolio */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Original Portfolio</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Value</span>
                  <span className="font-semibold">${original.total_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weighted CO-GRI</span>
                  <span className="font-semibold">{original.weighted_cogri.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Score</span>
                  <span className="font-semibold">{original.risk_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Return</span>
                  <span className="font-semibold">{original.expected_return.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio</span>
                  <span className="font-semibold">{original.sharpe_ratio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volatility</span>
                  <span className="font-semibold">{original.volatility.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Optimized Portfolio */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Optimized Portfolio</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Value</span>
                  <span className="font-semibold">${optimized.total_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weighted CO-GRI</span>
                  <span className={`font-semibold ${optimized.weighted_cogri < original.weighted_cogri ? 'text-green-600' : 'text-red-600'}`}>
                    {optimized.weighted_cogri.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Score</span>
                  <span className={`font-semibold ${optimized.risk_score < original.risk_score ? 'text-green-600' : 'text-red-600'}`}>
                    {optimized.risk_score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Return</span>
                  <span className={`font-semibold ${optimized.expected_return >= original.expected_return ? 'text-green-600' : 'text-amber-600'}`}>
                    {optimized.expected_return.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio</span>
                  <span className={`font-semibold ${optimized.sharpe_ratio >= original.sharpe_ratio ? 'text-green-600' : 'text-amber-600'}`}>
                    {optimized.sharpe_ratio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volatility</span>
                  <span className={`font-semibold ${optimized.volatility <= original.volatility ? 'text-green-600' : 'text-amber-600'}`}>
                    {optimized.volatility.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 text-green-900">Improvements</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${improvements.risk_reduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvements.risk_reduction >= 0 ? '-' : '+'}{Math.abs(improvements.risk_reduction).toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Risk Reduction</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${improvements.return_improvement >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {improvements.return_improvement >= 0 ? '+' : ''}{improvements.return_improvement.toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Return Improvement</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${improvements.sharpe_improvement >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {improvements.sharpe_improvement >= 0 ? '+' : ''}{improvements.sharpe_improvement.toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Sharpe Improvement</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recommended Trades ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Trades</CardTitle>
          <CardDescription>
            {trades.length > 0
              ? `${trades.length} trade${trades.length !== 1 ? 's' : ''} to implement optimization`
              : 'No trades required — portfolio is already optimally allocated'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{trade.ticker}</TableCell>
                    <TableCell>
                      <Badge variant={trade.action === 'BUY' ? 'default' : 'destructive'}>
                        {trade.action === 'BUY' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {trade.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{trade.shares.toFixed(0)}</TableCell>
                    <TableCell className="text-right">${trade.value.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{trade.rationale}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              All holdings are within optimal allocation ranges.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Optimized Portfolio Composition ── */}
      <Card>
        <CardHeader>
          <CardTitle>Optimized Portfolio Composition</CardTitle>
          <CardDescription>{optimized_portfolio.holdings.length} holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">CO-GRI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimized_portfolio.holdings.map((holding) => (
                <TableRow key={holding.ticker}>
                  <TableCell className="font-medium">{holding.ticker}</TableCell>
                  <TableCell className="text-right">{holding.shares}</TableCell>
                  <TableCell className="text-right">${holding.value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{holding.weight.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={
                      holding.cogri < 40 ? 'text-green-600 font-semibold' :
                      holding.cogri > 65 ? 'text-red-600 font-semibold' :
                      'text-amber-600 font-semibold'
                    }>
                      {holding.cogri.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Action Buttons ── */}
      <div className="flex gap-4">
        <Button className="flex-1" onClick={handleApplyRecommendations}>
          <Check className="h-4 w-4 mr-2" />
          Apply Recommendations
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleExportResults}>
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>
    </div>
  );
}