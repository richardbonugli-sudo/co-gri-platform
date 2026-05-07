/**
 * Country Mode Page - Full Implementation with Persistent Global Navigation
 * Phase 1 Critical Fix: State-based country selection, no page navigation
 * FIXED: Time window wiring - RiskTrendComparison now updates global store
 * Part of CO-GRI Platform - Week 6+
 */

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin,
  Building2,
  Activity,
  LineChart,
  X
} from 'lucide-react';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';
import { GlobalRiskIndex } from '@/components/dashboard/GlobalRiskIndex';
import { GlobalRiskHeatmap } from '@/components/dashboard/GlobalRiskHeatmap';
import { RiskTrendComparison } from '@/components/dashboard/RiskTrendComparison';
import { CountrySummaryPanel } from '@/components/dashboard/CountrySummaryPanel';
import { RiskVectorBreakdown } from '@/components/dashboard/RiskVectorBreakdown';
import { CountryComparison } from '@/components/dashboard/CountryComparison';
import { TopRiskMovers } from '@/components/dashboard/TopRiskMovers';
import { LatestRiskEvents } from '@/components/dashboard/LatestRiskEvents';
import { RegionalRiskPanel } from '@/components/dashboard/RegionalRiskPanel';
import { SectorExposure } from '@/components/dashboard/SectorExposure';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import type { TimeWindow } from '@/store/globalDashboardState';

const CountryMode = () => {
  // Global state
  const {
    activeMode,
    setActiveMode,
    selectedEntity,
    setSelectedEntity,
    timeWindow,
    setTimeWindow,
    viewState,
    clearSelection,
  } = useGlobalDashboardStore();

  // Set active mode to Country on mount
  useEffect(() => {
    setActiveMode('Country');
  }, [setActiveMode]);

  // Extract selected country from entity
  const selectedCountry = selectedEntity?.type === 'country' ? selectedEntity.name : null;

  // Handlers
  const handleCountrySelect = (country: string) => {
    setSelectedEntity({
      type: 'country',
      name: country,
    });
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleMapCountryClick = (country: string) => {
    handleCountrySelect(country);
  };

  // Handler: time window changes inside RiskTrendComparison propagate to global store
  const handleTimeWindowChange = (newTimeWindow: TimeWindow) => {
    setTimeWindow(newTimeWindow);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d]">
      {/* Global Navigation Bar - Always Visible */}
      <GlobalNavigationBar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Top Row: Global Risk Index */}
        <div className="mb-6">
          <GlobalRiskIndex timeWindow={timeWindow} />
        </div>

        {/* Country Focus Mode Indicator */}
        {selectedCountry && (
          <div className="mb-6">
            <Card className="bg-[#0d5f5f]/10 border-[#0d5f5f]/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0d5f5f] p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[#7fa89f] text-xs">Selected Country</p>
                      <p className="text-white font-bold text-lg">{selectedCountry}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Return to Global View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Grid: Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left Column: Top Risk Movers + Latest Risk Events */}
          <div className="lg:col-span-3 space-y-6">
            <TopRiskMovers 
              timeWindow={timeWindow}
              maxCountries={8}
            />
            <LatestRiskEvents 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
            />
          </div>

          {/* Center Column: Global CSI Heatmap + Risk Trend Comparison */}
          <div className="lg:col-span-6 space-y-6">
            <GlobalRiskHeatmap 
              title="Global CSI Heatmap"
              showRegionFilter={true}
              maxCountries={30}
              highlightedRegion={null}
              onCountryClick={handleMapCountryClick}
              selectedCountry={selectedCountry}
            />
            
            {/* RiskTrendComparison: time window is fully controlled by global store.
                onTimeWindowChange writes back to the store so all panels stay in sync. */}
            <RiskTrendComparison 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
              onTimeWindowChange={handleTimeWindowChange}
            />
          </div>

          {/* Right Column: Country Summary + Risk Vector Breakdown + Country Comparison */}
          <div className="lg:col-span-3 space-y-6">
            <CountrySummaryPanel 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
              onClearSelection={handleClearSelection}
            />
            
            <RiskVectorBreakdown 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
            />
            
            <CountryComparison 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
            />
          </div>
        </div>

        {/* Lower Section: Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Regional Risk Overview */}
          <div>
            <RegionalRiskPanel 
              title="Regional Risk Overview"
              selectedCountry={selectedCountry}
              onRegionClick={(region) => {}}
              onRegionHover={(region) => {}}
            />
          </div>
          
          {/* Right Column: Sector Exposure Panel */}
          <div>
            <SectorExposure 
              selectedCountry={selectedCountry}
            />
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-[#0d5f5f]/10 border-[#0d5f5f]/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Activity className="h-6 w-6 text-[#7fa89f] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-2">Platform Intelligence</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The CO-GRI platform integrates data from 10+ authoritative sources including OECD, IMF, BIS, 
                  and UN Comtrade to provide comprehensive geopolitical risk analysis. All data is updated in real-time 
                  with interactive visualizations and export capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0d5f5f]/30 bg-[#0d1512]/50 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2026 CO-GRI Platform. All rights reserved.
            </p>
            <div className="flex gap-4">
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                Disclaimer
              </button>
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CountryMode;
