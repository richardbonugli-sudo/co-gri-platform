/**
 * Signal Details Panel (T3)
 * Detailed view of a selected trading signal
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, ArrowRight, ExternalLink } from 'lucide-react';
import { TradingSignal } from '@/types/trading';
import { useGlobalState } from '@/store/globalState';

interface SignalDetailsPanelProps {
  signal: TradingSignal;
}

export default function SignalDetailsPanel({ signal }: SignalDetailsPanelProps) {
  const setActiveMode = useGlobalState((state) => state.setActiveMode);
  const setSelectedCompany = useGlobalState((state) => state.setSelectedCompany);

  const handleViewInCompanyMode = () => {
    setSelectedCompany(signal.ticker);
    setActiveMode('Company');
  };

  const getSignalIcon = () => {
    switch (signal.signal_type) {
      case 'BUY': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'SELL': return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'HOLD': return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSignalColor = () => {
    switch (signal.signal_type) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HOLD': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{signal.ticker}</CardTitle>
            <CardDescription>{signal.company_name}</CardDescription>
          </div>
          {getSignalIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal Type Badge */}
        <div className={`p-4 rounded-lg border-2 ${getSignalColor()}`}>
          <div className="text-2xl font-bold">{signal.signal_type}</div>
          <div className="text-sm mt-1">
            {signal.signal_strength} Strength · {signal.confidence} Confidence
          </div>
        </div>

        {/* Risk Metrics */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Risk Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current CO-GRI</span>
              <span className="font-semibold">{signal.current_cogri.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Forecast Delta</span>
              <span className={`font-semibold ${signal.forecast_delta_cogri > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {signal.forecast_delta_cogri > 0 ? '+' : ''}{signal.forecast_delta_cogri.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scenario Risk</span>
              <span className="font-semibold">{signal.scenario_risk_score.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence Score</span>
              <span className="font-semibold">{signal.confidence_score}%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Targets */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Price Targets</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-semibold">${signal.current_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Target</span>
              <span className="font-semibold text-primary">${signal.price_target.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stop Loss</span>
              <span className="font-semibold text-destructive">${signal.stop_loss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Return</span>
              <span className={`font-semibold ${signal.expected_return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {signal.expected_return > 0 ? '+' : ''}{signal.expected_return.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Horizon</span>
              <span className="font-semibold">{signal.time_horizon}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Signal Drivers */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Signal Drivers</h4>
          <div className="space-y-2">
            {signal.signal_drivers.map((driver, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">{driver.factor}</span>
                  <Badge variant="outline" className={
                    driver.direction === 'Positive' ? 'text-green-600' :
                    driver.direction === 'Negative' ? 'text-red-600' :
                    'text-gray-600'
                  }>
                    {driver.direction}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{driver.explanation}</div>
                <div className="mt-1 bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${driver.weight * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rationale */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Rationale</h4>
          <ul className="space-y-2">
            {signal.rationale.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full" onClick={handleViewInCompanyMode}>
            View in Company Mode
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full">
            Execute Trade
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          Generated {signal.generated_at.toLocaleDateString()} · {signal.sector}
        </div>
      </CardContent>
    </Card>
  );
}