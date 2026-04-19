/**
 * Trading Mode Page - Weeks 11-13 Implementation
 * Investment Decision Support & Portfolio Optimization
 * Phase 1 Critical Fix: Global navigation always visible
 * 
 * Three-tab structure:
 * 1. Signal Dashboard - View all trading signals
 * 2. Portfolio Optimizer - Optimize portfolio allocation
 * 3. Backtest Results - Historical performance validation
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, PieChart, BarChart3, Info } from 'lucide-react';
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

// Mock data
import { generateMockSignals } from '@/services/mockData/tradingDataGenerator';

export default function TradingMode() {
  const setActiveMode = useGlobalState((state) => state.setActiveMode);
  const { activeTab, setActiveTab, signals, setSignals, selectedSignal } = useTradingState();
  const [isLoading, setIsLoading] = useState(true);
  
  // Global Dashboard State
  const {
    setActiveMode: setGlobalActiveMode,
  } = useGlobalDashboardStore();

  // Set active mode to Trading on mount
  useEffect(() => {
    setGlobalActiveMode('Trading');
  }, [setGlobalActiveMode]);

  // Load initial signals
  useEffect(() => {
    setActiveMode('Trading');
    
    const loadSignals = async () => {
      try {
        setIsLoading(true);
        // Generate mock signals
        const mockSignals = generateMockSignals(25);
        setSignals(mockSignals);
      } catch (error) {
        console.error('Failed to load signals:', error);
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
              <h1 className="text-3xl font-bold">Trading Mode</h1>
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
            Trading signals are generated based on comprehensive CO-GRI analysis, forecast outlook, and scenario stress tests.
            All recommendations include transparent rationale and risk metrics.
          </AlertDescription>
        </Alert>

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