/**
 * Signal Cards Grid (T2)
 * Display all trading signals as cards in a grid
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { TradingSignal, SignalType } from '@/types/trading';
import { useTradingState } from '@/store/tradingState';
import { useGlobalState } from '@/store/globalState';

interface SignalCardsGridProps {
  signals: TradingSignal[];
  isLoading: boolean;
}

export default function SignalCardsGrid({ signals, isLoading }: SignalCardsGridProps) {
  const { signalFilters, signalSort, setSelectedSignal } = useTradingState();
  const setActiveMode = useGlobalState((state) => state.setActiveMode);
  const setSelectedCompany = useGlobalState((state) => state.setSelectedCompany);

  // Filter and sort signals
  const filteredSignals = useMemo(() => {
    let filtered = signals.filter(signal => {
      // Filter by signal type
      if (!signalFilters.signal_types.includes(signal.signal_type)) return false;
      
      // Filter by confidence threshold
      if (signal.confidence_score < signalFilters.confidence_threshold) return false;
      
      // Filter by sectors (if any selected)
      if (signalFilters.sectors.length > 0 && !signalFilters.sectors.includes(signal.sector)) return false;
      
      return true;
    });

    // Sort signals
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (signalSort.sort_by) {
        case 'signal_strength':
          const strengthOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          comparison = strengthOrder[b.signal_strength] - strengthOrder[a.signal_strength];
          break;
        case 'confidence':
          comparison = b.confidence_score - a.confidence_score;
          break;
        case 'cogri':
          comparison = b.current_cogri - a.current_cogri;
          break;
        case 'expected_return':
          comparison = Math.abs(b.expected_return) - Math.abs(a.expected_return);
          break;
        case 'generated_at':
          comparison = b.generated_at.getTime() - a.generated_at.getTime();
          break;
      }
      
      return signalSort.order === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [signals, signalFilters, signalSort]);

  const handleCardClick = (signal: TradingSignal) => {
    setSelectedSignal(signal);
  };

  const handleViewInCompanyMode = (signal: TradingSignal) => {
    setSelectedCompany(signal.ticker);
    setActiveMode('Company');
  };

  const getSignalIcon = (type: SignalType) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      case 'HOLD': return <Minus className="h-4 w-4" />;
    }
  };

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'BUY': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'SELL': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'HOLD': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredSignals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No signals match the current filters
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing {filteredSignals.length} of {signals.length} signals
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSignals.map((signal) => (
          <Card
            key={signal.signal_id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick(signal)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{signal.ticker}</CardTitle>
                  <CardDescription className="text-xs">{signal.company_name}</CardDescription>
                </div>
                <Badge className={`${getSignalColor(signal.signal_type)} border`}>
                  {getSignalIcon(signal.signal_type)}
                  <span className="ml-1">{signal.signal_type}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Signal Metrics */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Strength</div>
                  <Badge variant="outline" className="mt-1">
                    {signal.signal_strength}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <Badge variant="outline" className="mt-1">
                    {signal.confidence} ({signal.confidence_score}%)
                  </Badge>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">CO-GRI</div>
                  <div className="font-semibold">{signal.current_cogri.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Forecast Δ</div>
                  <div className={`font-semibold ${signal.forecast_delta_cogri > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {signal.forecast_delta_cogri > 0 ? '+' : ''}{signal.forecast_delta_cogri.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Scenario</div>
                  <div className="font-semibold">{signal.scenario_risk_score.toFixed(1)}</div>
                </div>
              </div>

              {/* Price Targets */}
              <div className="pt-2 border-t">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Current</div>
                    <div className="font-semibold">${signal.current_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Target</div>
                    <div className="font-semibold text-primary">${signal.price_target.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Return</div>
                    <div className={`font-semibold ${signal.expected_return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.expected_return > 0 ? '+' : ''}{signal.expected_return.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewInCompanyMode(signal);
                }}
              >
                View in Company Mode
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}