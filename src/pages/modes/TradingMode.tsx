/**
 * Trading Mode Page — CO-GRI Engine Powered
 *
 * Phase B: Signal universe sourced from companyDatabase (getAllCompanies).
 * Phase E: "CO-GRI Engine Powered" badge shown in UI.
 *
 * Three-tab structure:
 * 1. Signal Dashboard - View all trading signals (live CO-GRI engine)
 * 2. Portfolio Optimizer - Optimize portfolio allocation
 * 3. Backtest Results - Historical performance validation
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, PieChart, BarChart3, Info, Zap } from 'lucide-react';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';
import { useGlobalState } from '@/store/globalState';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import { useTradingState } from '@/store/tradingState';

// Tab components
import SignalDashboardHeader from '@/components/trading/SignalDashboardHeader';
import SignalCardsGrid from '@/components/trading/SignalCardsGrid';
import SignalDetailsPanel from '@/components/trading/SignalDetailsPanel';
import PortfolioInput from '@/components/trading/PortfolioInput';
import OptimizationSettings from '@/components/trading/OptimizationSettings';
import OptimizationResults from '@/components/trading/OptimizationResults';
import BacktestConfig from '@/components/trading/BacktestConfig';
import BacktestResults from '@/components/trading/BacktestResults';

// Phase B: live engine + company universe
import { TradingEngine } from '@/services/engines/TradingEngine';
import { getAllCompanies } from '@/utils/companyDatabase';

// ── Subset of the universe to load on initial render ─────────────────────────
// Loading all ~180 companies at once would be slow; we load a representative
// cross-sector subset of 25 tickers on first render.  The user can trigger a
// full-universe refresh via the Signal Dashboard header controls.
const INITIAL_UNIVERSE_TICKERS = [
  // US Tech
  'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META',
  // US Financials
  'JPM', 'GS', 'V', 'BAC', 'BLK',
  // US Healthcare
  'JNJ', 'PFE', 'LLY', 'UNH', 'MRK',
  // US Energy
  'XOM', 'CVX', 'COP',
  // US Consumer
  'WMT', 'MCD', 'NKE', 'KO',
  // International ADRs
  'TSM', 'ASML', 'NVO',
];

export default function TradingMode() {
  const setActiveMode = useGlobalState((state) => state.setActiveMode);
  const { activeTab, setActiveTab, signals, setSignals, selectedSignal } = useTradingState();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enginePowered, setEnginePowered] = useState(false);

  // Global Dashboard State
  const { setActiveMode: setGlobalActiveMode } = useGlobalDashboardStore();

  // Set active mode to Trading on mount
  useEffect(() => {
    setGlobalActiveMode('Trading');
  }, [setGlobalActiveMode]);

  // Load initial signals using the live CO-GRI engine
  useEffect(() => {
    setActiveMode('Trading');

    const loadSignals = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Phase B: build universe from companyDatabase, filtered to initial subset
        const allCompanies = getAllCompanies();
        const universe = INITIAL_UNIVERSE_TICKERS.filter(t =>
          allCompanies.some(c => c.ticker.toUpperCase() === t.toUpperCase())
        );

        // Phase A/C/D: generate signals via real CO-GRI engine
        const engine = new TradingEngine();
        const liveSignals = await engine.generateSignals(universe);

        if (liveSignals.length > 0) {
          setSignals(liveSignals);
          setEnginePowered(true);
        } else {
          setLoadError('No signals generated — check console for details.');
        }
      } catch (error) {
        console.error('[TradingMode] Failed to load signals:', error);
        setLoadError('Signal generation encountered an error. See console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSignals();
  }, [setActiveMode, setSignals]);

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation Bar - Always Visible */}
      <GlobalNavigationBar />

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Trading Mode</h1>
                {/* Phase E: CO-GRI Engine Powered badge */}
                {enginePowered && (
                  <Badge
                    variant="default"
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1"
                  >
                    <Zap className="h-3 w-3" />
                    CO-GRI Engine Powered
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Risk-adjusted trading signals and portfolio optimization
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Trading signals are generated using the live CO-GRI engine — the same engine
            powering Company Mode, Forecast Mode, and Scenario Mode. Scores are deterministic:
            the same ticker always produces the same CO-GRI score.
          </AlertDescription>
        </Alert>

        {/* Error alert */}
        {loadError && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {/* Secondary Navigation: Three Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signals" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Signal Dashboard
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <PieChart className="h-4 w-4" />
              Portfolio Optimizer
            </TabsTrigger>
            <TabsTrigger value="backtest" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Backtest Results
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Signal Dashboard */}
          <TabsContent value="signals" className="space-y-6">
            <SignalDashboardHeader />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SignalCardsGrid signals={signals} isLoading={isLoading} />
              </div>
              <div className="lg:col-span-1">
                {selectedSignal ? (
                  <SignalDetailsPanel signal={selectedSignal} />
                ) : (
                  <div className="p-6 border rounded-lg bg-muted/50 text-center text-muted-foreground">
                    Select a signal to view details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Portfolio Optimizer */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <PortfolioInput />
                <OptimizationSettings />
              </div>
              <div>
                <OptimizationResults />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Backtest Results */}
          <TabsContent value="backtest" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <BacktestConfig />
              </div>
              <div className="lg:col-span-2">
                <BacktestResults />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}