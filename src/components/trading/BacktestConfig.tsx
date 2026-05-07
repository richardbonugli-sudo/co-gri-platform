/**
 * Backtest Configuration (T7)
 * Configure backtest parameters
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2 } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { BacktestConfig as BacktestConfigType, StrategyType, UniverseType } from '@/types/trading';

export default function BacktestConfig() {
  const { runBacktest, isBacktesting, backtestProgress } = useTradingState();
  
  const [config, setConfig] = useState<BacktestConfigType>({
    strategy: 'CO-GRI Momentum',
    universe: 'S&P 500',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-12-31'),
    rebalancing_frequency: 'Monthly',
    initial_capital: 100000,
    transaction_costs: 0.1,
  });

  const handleRunBacktest = async () => {
    await runBacktest(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtest Configuration</CardTitle>
        <CardDescription>Configure strategy and backtest parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label>Strategy</Label>
          <Select
            value={config.strategy}
            onValueChange={(value: StrategyType) => setConfig({ ...config, strategy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CO-GRI Momentum">CO-GRI Momentum</SelectItem>
              <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
              <SelectItem value="CO-GRI + Forecast">CO-GRI + Forecast</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Universe Selection */}
        <div className="space-y-2">
          <Label>Universe</Label>
          <Select
            value={config.universe}
            onValueChange={(value: UniverseType) => setConfig({ ...config, universe: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S&P 500">S&P 500</SelectItem>
              <SelectItem value="Russell 2000">Russell 2000</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={config.start_date.toISOString().split('T')[0]}
              onChange={(e) => setConfig({ ...config, start_date: new Date(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={config.end_date.toISOString().split('T')[0]}
              onChange={(e) => setConfig({ ...config, end_date: new Date(e.target.value) })}
            />
          </div>
        </div>

        {/* Rebalancing Frequency */}
        <div className="space-y-2">
          <Label>Rebalancing Frequency</Label>
          <Select
            value={config.rebalancing_frequency}
            onValueChange={(value: any) => setConfig({ ...config, rebalancing_frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Initial Capital */}
        <div className="space-y-2">
          <Label>Initial Capital</Label>
          <Input
            type="number"
            value={config.initial_capital}
            onChange={(e) => setConfig({ ...config, initial_capital: parseFloat(e.target.value) })}
            placeholder="100000"
          />
        </div>

        {/* Transaction Costs */}
        <div className="space-y-2">
          <Label>Transaction Costs (%)</Label>
          <Input
            type="number"
            step="0.05"
            value={config.transaction_costs}
            onChange={(e) => setConfig({ ...config, transaction_costs: parseFloat(e.target.value) })}
            placeholder="0.1"
          />
        </div>

        {/* Run Backtest Button */}
        <Button
          className="w-full"
          onClick={handleRunBacktest}
          disabled={isBacktesting}
        >
          {isBacktesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running... {backtestProgress}%
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isBacktesting && (
          <div className="space-y-2">
            <div className="bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${backtestProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Simulating trades and calculating performance...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}