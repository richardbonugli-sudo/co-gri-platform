/**
 * Forecast Mode Page
 * 6-12 month geopolitical outlook and company impact analysis
 * Part of CO-GRI Platform Phase 3 - Week 7-8
 * Phase 1 Critical Fix: Global navigation always visible
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, Building2, Search } from 'lucide-react';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';

// Import Forecast Components
import { ForecastHeader } from '@/components/forecast/ForecastHeader';
import { ExecutiveSummary } from '@/components/forecast/ExecutiveSummary';
import { ForecastTimelineEvents } from '@/components/forecast/ForecastTimelineEvents';
import { AssetClassImplications } from '@/components/forecast/AssetClassImplications';
import { RegionalAssessment } from '@/components/forecast/RegionalAssessment';
import { StrategicRecommendations } from '@/components/forecast/StrategicRecommendations';
import { CompanyForecastSummary } from '@/components/forecast/CompanyForecastSummary';

// Import Mock Data Generators
import {
  generateMockForecastEvents,
  generateMockExecutiveSummary,
  generateMockRegionalAssessments,
  generateMockAssetClassForecasts,
  generateMockStrategicRecommendations
} from '@/services/mockData/forecastDataGenerator';

import { getMockCompanyForecastOutlook } from '@/services/mockData/companyForecastData';
import { filterRelevantForecastEvents } from '@/services/forecast/eventRelevanceFilter';

import { ForecastEvent, CompanyForecastOutlook } from '@/types/forecast';
import { useGlobalState } from '@/store/globalState';

export default function ForecastMode() {
  const [activeTab, setActiveTab] = useState('strategic');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [companyOutlook, setCompanyOutlook] = useState<CompanyForecastOutlook | null>(null);
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  
  const setActiveMode = useGlobalState((state) => state.setActiveMode);
  const setSelectedCompany = useGlobalState((state) => state.setSelectedCompany);
  
  // Global Dashboard State
  const {
    setActiveMode: setGlobalActiveMode,
  } = useGlobalDashboardStore();

  // Set active mode to Forecast on mount
  useEffect(() => {
    setGlobalActiveMode('Forecast');
  }, [setGlobalActiveMode]);
  
  const [forecastData] = useState(() => {
    const events = generateMockForecastEvents();
    const executiveSummary = generateMockExecutiveSummary();
    const regionalAssessments = generateMockRegionalAssessments();
    const assetClassForecasts = generateMockAssetClassForecasts();
    const strategicRecommendations = generateMockStrategicRecommendations();

    return {
      events,
      executiveSummary,
      regionalAssessments,
      assetClassForecasts,
      strategicRecommendations
    };
  });

  // Handle company search
  const handleCompanySearch = () => {
    const ticker = searchInput.toUpperCase().trim();
    if (!ticker) return;
    
    const outlook = getMockCompanyForecastOutlook(ticker);
    if (outlook) {
      setSelectedTicker(ticker);
      setCompanyOutlook(outlook);
      setRelevantEvents(outlook.top_forecast_drivers);
      setSelectedCompany(ticker);
    } else {
      alert(`No forecast data available for ${ticker}. Try: AAPL, NVDA, INTC, TSLA, MSFT`);
    }
  };

  const handleExport = () => {
    console.log('Export forecast report');
    // TODO: Implement PDF/Excel export
  };

  const handleEventClick = (event: ForecastEvent) => {
    console.log('Event clicked:', event);
    // TODO: Implement event detail view or deep link to company impact
  };

  const handleViewInCompanyMode = () => {
    if (selectedTicker) {
      setSelectedCompany(selectedTicker);
      setActiveMode('Company');
      // Navigate to Company Mode with Forecast Overlay tab
      window.location.hash = '/company?tab=forecast';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation Bar - Always Visible */}
      <GlobalNavigationBar />
      
      <div className="container mx-auto p-6 space-y-6">
      {/* Forecast Header */}
      <ForecastHeader
        horizon="6-12 months"
        lastUpdated={new Date()}
        confidence="Medium"
        dataSources={['Geopolitical Analysis', 'Economic Indicators', 'Expert Assessments', 'Industry Data']}
        onExport={handleExport}
      />

      {/* Secondary Navigation: Two-Tab Structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="strategic" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Strategic Overview
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company Impact
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Strategic Forecast Overview */}
        <TabsContent value="strategic" className="space-y-6 mt-6">
          {/* F2: Executive Summary */}
          <ExecutiveSummary summary={forecastData.executiveSummary} />

          {/* F3: Forecast Timeline Events */}
          <ForecastTimelineEvents
            events={forecastData.events}
            onEventClick={handleEventClick}
          />

          {/* F4: Asset Class Implications */}
          <AssetClassImplications forecasts={forecastData.assetClassForecasts} />

          {/* F5: Regional Assessment */}
          <RegionalAssessment assessments={forecastData.regionalAssessments} />

          {/* F6: Strategic Recommendations */}
          <StrategicRecommendations recommendations={forecastData.strategicRecommendations} />
        </TabsContent>

        {/* Tab 2: Company Impact Analysis */}
        <TabsContent value="company" className="space-y-6 mt-6">
          {/* Company Search */}
          <div className="flex items-center gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter company ticker (e.g., AAPL, NVDA, INTC, TSLA, MSFT)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompanySearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCompanySearch}>
              Search
            </Button>
          </div>

          {/* Company Forecast Summary */}
          {companyOutlook ? (
            <div className="space-y-6">
              <CompanyForecastSummary
                outlook={companyOutlook}
                onViewInCompanyMode={handleViewInCompanyMode}
              />

              {/* Relevant Forecast Events */}
              <ForecastTimelineEvents
                events={relevantEvents}
                onEventClick={handleEventClick}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
              <p className="mb-4">
                Search for a company to view its forecast impact analysis
              </p>
              <p className="text-sm">
                <strong>Available tickers:</strong> AAPL, NVDA, INTC, TSLA, MSFT
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}