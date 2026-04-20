/**
 * Optimization Results (T6)
 * Display portfolio optimization results
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Download, Check } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';

export default function OptimizationResults() {
  const { optimizationResult } = useTradingState();

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

  return (
    <div className="space-y-6">
      {/* Metrics Comparison */}
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
                  <span className="font-semibold text-green-600">{optimized.weighted_cogri.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Score</span>
                  <span className="font-semibold text-green-600">{optimized.risk_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Return</span>
                  <span className="font-semibold text-green-600">{optimized.expected_return.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio</span>
                  <span className="font-semibold text-green-600">{optimized.sharpe_ratio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 text-green-900">Improvements</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {improvements.risk_reduction > 0 ? '-' : '+'}{Math.abs(improvements.risk_reduction).toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Risk Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{improvements.return_improvement.toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Return Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{improvements.sharpe_improvement.toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Sharpe Improvement</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Trades</CardTitle>
          <CardDescription>{trades.length} trades to implement optimization</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* New Portfolio Composition */}
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
                  <TableCell className="text-right">{holding.cogri.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Apply Recommendations
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>
    </div>
  );
}