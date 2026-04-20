/**
 * Company Trading Signal View
 * Fourth tab in Company Mode - displays trading signal for the company
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { TradingSignal } from '@/types/trading';
import { TradingEngine } from '@/services/engines/TradingEngine';
import { useGlobalState } from '@/store/globalState';
import { CompanySummaryPanel } from './CompanySummaryPanel';
import { TopRelevantRisks } from './TopRelevantRisks';
import { ExposurePathways } from './ExposurePathways';
import { COGRITrendChart } from './COGRITrendChart';

interface CompanyTradingSignalViewProps {
  ticker: string;
  companyName: string;
  sector: string;
  cogriScore: number;
  riskLevel: string;
  countryExposures: any[];
  channelExposures: any[];
  structuralDrivers: any[];
}

export function CompanyTradingSignalView({
  ticker,
  companyName,
  sector,
  cogriScore,
  riskLevel,
  countryExposures,
  channelExposures,
  structuralDrivers,
}: CompanyTradingSignalViewProps) {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setActiveMode = useGlobalState((state) => state.setActiveMode);

  useEffect(() => {
    const loadSignal = async () => {
      setIsLoading(true);
      try {
        const engine = new TradingEngine();
        const tradingSignal = await engine.generateSignalForTicker(ticker);
        setSignal(tradingSignal);
      } catch (error) {
        console.error('Failed to load trading signal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSignal();
  }, [ticker]);

  const handleViewInTradingMode = () => {
    setActiveMode('Trading');
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'SELL': return <TrendingDown className="h-6 w-6 text-red-600" />;
      case 'HOLD': return <Minus className="h-6 w-6 text-gray-600" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'bg-green-50 border-green-200 text-green-900';
      case 'SELL': return 'bg-red-50 border-red-200 text-red-900';
      case 'HOLD': return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Generating trading signal...</p>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Trading Signal Available</h3>
        <p className="text-sm text-muted-foreground">Unable to generate signal for {ticker}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trading Signal Card (Top) */}
      <Card className={`border-2 ${getSignalColor(signal.signal_type)}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                {getSignalIcon(signal.signal_type)}
                {signal.signal_type} Signal
              </CardTitle>
              <CardDescription className="mt-2">
                {signal.company_name} ({signal.ticker})
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {signal.signal_strength} Strength
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="text-xl font-bold">{signal.confidence_score}%</div>
              <div className="text-xs">{signal.confidence}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Current Price</div>
              <div className="text-xl font-bold">${signal.current_price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Price Target</div>
              <div className="text-xl font-bold text-primary">${signal.price_target.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Expected Return</div>
              <div className={`text-xl font-bold ${signal.expected_return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {signal.expected_return > 0 ? '+' : ''}{signal.expected_return.toFixed(1)}%
              </div>
            </div>
          </div>

          <Separator />

          {/* Signal Rationale */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Signal Rationale</h4>
            <ul className="space-y-2">
              {signal.rationale.slice(0, 3).map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleViewInTradingMode}>
              View in Trading Mode
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1">
              Execute Trade
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Layout: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Signal Drivers */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signal Drivers</CardTitle>
              <CardDescription>Factors contributing to this signal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signal.signal_drivers.map((driver, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{driver.factor}</span>
                    <Badge variant="outline" className={
                      driver.direction === 'Positive' ? 'text-green-600' :
                      driver.direction === 'Negative' ? 'text-red-600' :
                      'text-gray-600'
                    }>
                      {driver.direction}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{driver.explanation}</div>
                  <div className="bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${driver.weight * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <ExposurePathways
            ticker={ticker}
            countryExposures={countryExposures}
            channelExposures={channelExposures}
          />
        </div>

        {/* Center Column - Enhanced C2 with Price Targets */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price & Risk Trajectory</CardTitle>
              <CardDescription>CO-GRI trend with price targets and stop loss</CardDescription>
            </CardHeader>
            <CardContent>
              <COGRITrendChart
                ticker={ticker}
                currentScore={cogriScore}
                historicalData={[
                  { date: '2024-01', score: cogriScore - 5 },
                  { date: '2024-02', score: cogriScore - 3 },
                  { date: '2024-03', score: cogriScore - 2 },
                  { date: '2024-04', score: cogriScore - 1 },
                  { date: '2024-05', score: cogriScore },
                  { date: '2024-06', score: cogriScore }
                ]}
              />
              
              {/* Price Target Annotations */}
              <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="text-lg font-semibold">${signal.current_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Price Target</div>
                  <div className="text-lg font-semibold text-green-600">${signal.price_target.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss</div>
                  <div className="text-lg font-semibold text-red-600">${signal.stop_loss.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
              <CardDescription>Comprehensive risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Current CO-GRI</div>
                  <div className="text-2xl font-bold">{signal.current_cogri.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Forecast Delta</div>
                  <div className={`text-2xl font-bold ${signal.forecast_delta_cogri > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {signal.forecast_delta_cogri > 0 ? '+' : ''}{signal.forecast_delta_cogri.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Scenario Risk</div>
                  <div className="text-2xl font-bold">{signal.scenario_risk_score.toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Enhanced C1 with Trading Metrics */}
        <div className="lg:col-span-3 space-y-6">
          <CompanySummaryPanel
            ticker={ticker}
            companyName={companyName}
            sector={sector}
            cogriScore={cogriScore}
            riskLevel={riskLevel}
            countryExposures={countryExposures}
            tradingSignal={{
              signal_type: signal.signal_type,
              confidence: signal.confidence_score,
              expected_return: signal.expected_return,
              time_horizon: signal.time_horizon,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recommendation</span>
                <Badge className={getSignalColor(signal.signal_type)}>
                  {signal.signal_type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Horizon</span>
                <span className="font-semibold">{signal.time_horizon}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stop Loss</span>
                <span className="font-semibold">${signal.stop_loss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risk/Reward</span>
                <span className="font-semibold">
                  {(Math.abs(signal.expected_return) / Math.abs((signal.stop_loss - signal.current_price) / signal.current_price * 100)).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}