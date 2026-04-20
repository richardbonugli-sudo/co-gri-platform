/**
 * Unified Dashboard V2 - Refactored with Global Navigation and Bloomberg-style Layout
 * Phase 1: Foundation + Phase 2: Layout Transformation + Phase 2 Real-Time Event Processing
 * Phase 3: Validation & Calibration - Historical backtesting and model accuracy tracking
 * Implements persistent global navigation, unified state management, institutional grid layout,
 * real-time event ingestion/processing capabilities, and model validation tools.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin,
  X,
  Activity,
  Target,
  FileText
} from 'lucide-react';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';
import { GlobalRiskIndex } from '@/components/dashboard/GlobalRiskIndex';
import { GlobalRiskHeatmap } from '@/components/dashboard/GlobalRiskHeatmap';
import { RiskTrendComparison } from '@/components/dashboard/RiskTrendComparison';
import { CountrySummaryPanel } from '@/components/dashboard/CountrySummaryPanel';
import { RiskVectorBreakdown } from '@/components/dashboard/RiskVectorBreakdown';
import { TopRiskMovers } from '@/components/dashboard/TopRiskMovers';
import { LatestRiskEvents } from '@/components/dashboard/LatestRiskEvents';
import { RegionalRiskPanel } from '@/components/dashboard/RegionalRiskPanel';
import { SectorExposure } from '@/components/dashboard/SectorExposure';
import { CountryComparison } from '@/components/dashboard/CountryComparison';
import { BacktestingDashboard } from '@/components/dashboard/BacktestingDashboard';
import { AuditTrailPanel } from '@/components/dashboard/AuditTrailPanel';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';

const UnifiedDashboardV2 = () => {
  // Global state
  const {
    activeMode,
    setActiveMode,
    selectedEntity,
    setSelectedEntity,
    timeWindow,
    viewState,
    clearSelection,
  } = useGlobalDashboardStore();

  // Local state for view mode
  const [viewMode, setViewMode] = useState<'dashboard' | 'validation'>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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

  const handleEventClick = (eventId: string) => {
    console.log('[Dashboard] Event clicked:', eventId);
    setSelectedEventId(eventId);
  };

  const handleCalibrationApply = (configId: string) => {
    console.log('[Dashboard] Calibration applied:', configId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d]">
      {/* Global Navigation Bar */}
      <GlobalNavigationBar />

      {/* Main Content - Expanded Width for Institutional Layout */}
      <main className="max-w-[1800px] mx-auto px-8 py-6">
        {/* Top Row: Global Risk Index (Primary Indicator) */}
        <div className="mb-5">
          <GlobalRiskIndex timeWindow={timeWindow} />
        </div>

        {/* View Mode Toggle */}
        <div className="mb-5">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'dashboard' | 'validation')}>
            <TabsList className="bg-[#0a0f0d] border border-[#0d5f5f]/30">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white"
              >
                <Activity className="h-4 w-4 mr-2" />
                Risk Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="validation" 
                className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white"
              >
                <Target className="h-4 w-4 mr-2" />
                Model Validation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Country Focus Mode Indicator */}
        {selectedCountry && (
          <div className="mb-5">
            <Card className="bg-[#0d5f5f]/10 border-[#0d5f5f]/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0d5f5f] p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[#7fa89f] text-xs">Country Focus Mode</p>
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

        {viewMode === 'dashboard' ? (
          /* Main Dashboard Grid: Three-Column Bloomberg-style Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
            {/* Left Column: Top Risk Movers + Latest Risk Events + Event Management */}
            <div className="lg:col-span-3 space-y-5">
              <TopRiskMovers 
                timeWindow={timeWindow}
                maxCountries={8}
                onCountryClick={handleCountrySelect}
                showLiveIndicator={true}
              />
              <LatestRiskEvents 
                selectedCountry={selectedCountry} 
                timeWindow={timeWindow}
                onCountryClick={handleCountrySelect}
                showLiveEvents={true}
              />
              {/* Event Management Panel - Real-Time Event Processing */}
            </div>

            {/* Center Column: Global CSI Heatmap (Primary Focus) + Risk Trend Comparison + Lower Section Panels */}
            <div className="lg:col-span-6 space-y-5">
              <GlobalRiskHeatmap 
                title="Global CSI Heatmap"
                showRegionFilter={true}
                maxCountries={30}
                highlightedRegion={null}
                selectedCountry={selectedCountry}
                onCountryClick={handleMapCountryClick}
              />
              
              <RiskTrendComparison 
                selectedCountry={selectedCountry}
                timeWindow={timeWindow}
              />

              {/* Lower Section: Two-Column Layout - Regional Risk, Sector Exposure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Regional Risk Overview */}
                <div className="lg:col-span-1">
                  <RegionalRiskPanel 
                    title="Regional Risk Overview"
                    onRegionClick={(region) => {
                      // Optional: could filter map by region
                    }}
                    onRegionHover={(region) => {
                      // Optional: could highlight region on map
                    }}
                  />
                </div>

                {/* Sector Exposure */}
                <div className="lg:col-span-1">
                  <SectorExposure 
                    selectedCountry={selectedCountry}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Country Summary + Risk Vector Breakdown + Country Comparison */}
            <div className="lg:col-span-3 space-y-5">
              <CountrySummaryPanel 
                selectedCountry={selectedCountry}
                timeWindow={timeWindow}
                onClearSelection={handleClearSelection}
              />
              
              <RiskVectorBreakdown 
                selectedCountry={selectedCountry}
                timeWindow={timeWindow}
              />

              {/* Country Comparison - positioned beneath Country Focus/Risk Vector panels */}
              <CountryComparison 
                selectedCountry={selectedCountry}
                timeWindow={timeWindow}
              />
            </div>
          </div>
        ) : (
          /* Validation View: Backtesting Dashboard + Audit Trail */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
            {/* Left Column: Backtesting Dashboard */}
            <div className="lg:col-span-7">
              <BacktestingDashboard 
                onCalibrationApply={handleCalibrationApply}
              />
            </div>

            {/* Right Column: Audit Trail */}
            <div className="lg:col-span-5">
              <AuditTrailPanel 
                selectedCountry={selectedCountry}
                selectedEventId={selectedEventId}
                onEventSelect={setSelectedEventId}
                onCountrySelect={handleCountrySelect}
              />
            </div>
          </div>
        )}

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
                  with interactive visualizations and export capabilities. Use the Event Management panel to simulate 
                  real-time geopolitical events and observe their impact on CSI scores. The Model Validation tab provides
                  historical backtesting, accuracy metrics, and calibration tools for model optimization.
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

export default UnifiedDashboardV2;