/**
 * Backtest Results Display (T8)
 * Display backtest performance and analytics
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BacktestResults() {
  const { backtestResult } = useTradingState();

  if (!backtestResult) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No backtest results yet</p>
          <p className="text-sm mt-2">Configure backtest parameters and click "Run Backtest"</p>
        </CardContent>
      </Card>
    );
  }

  const { performance, equity_curve, attribution, benchmark } = backtestResult;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            {backtestResult.config.strategy} · {backtestResult.config.universe}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total Return</div>
              <div className="text-2xl font-bold text-green-600">+{performance.total_return.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Annualized Return</div>
              <div className="text-2xl font-bold">{performance.annualized_return.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
              <div className="text-2xl font-bold">{performance.sharpe_ratio.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Max Drawdown</div>
              <div className="text-2xl font-bold text-red-600">{performance.max_drawdown.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Volatility</div>
              <div className="text-lg font-semibold">{performance.volatility.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
              <div className="text-lg font-semibold">{performance.win_rate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
              <div className="text-lg font-semibold">{performance.total_trades}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Profit Factor</div>
              <div className="text-lg font-semibold">{performance.profit_factor.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>Portfolio value over time vs benchmark</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equity_curve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="portfolio_value" stroke="#10b981" name="Strategy" strokeWidth={2} />
              <Line type="monotone" dataKey="benchmark_value" stroke="#6b7280" name="Benchmark" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
          <CardDescription>Strategy vs {benchmark.benchmark_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Strategy Return</div>
              <div className="text-xl font-bold text-green-600">+{benchmark.strategy_return.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Benchmark Return</div>
              <div className="text-xl font-bold">{benchmark.benchmark_return.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Alpha</div>
              <div className="text-xl font-bold text-green-600">+{benchmark.alpha.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Beta</div>
              <div className="text-lg font-semibold">{benchmark.beta.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Information Ratio</div>
              <div className="text-lg font-semibold">{benchmark.information_ratio.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tracking Error</div>
              <div className="text-lg font-semibold">{benchmark.tracking_error.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Attribution</CardTitle>
          <CardDescription>Contribution by sector and signal type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* By Sector */}
          <div>
            <h4 className="text-sm font-semibold mb-3">By Sector</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attribution.by_sector.map((item) => (
                  <TableRow key={item.sector}>
                    <TableCell className="font-medium">{item.sector}</TableCell>
                    <TableCell className="text-right">{item.contribution.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{item.trades}</TableCell>
                    <TableCell className="text-right">{item.win_rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* By Signal Type */}
          <div>
            <h4 className="text-sm font-semibold mb-3">By Signal Type</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal Type</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attribution.by_signal_type.map((item) => (
                  <TableRow key={item.signal_type}>
                    <TableCell>
                      <Badge variant={item.signal_type === 'BUY' ? 'default' : 'destructive'}>
                        {item.signal_type === 'BUY' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {item.signal_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.contribution.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{item.trades}</TableCell>
                    <TableCell className="text-right">{item.win_rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button variant="outline" className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Export Backtest Results
      </Button>
    </div>
  );
}