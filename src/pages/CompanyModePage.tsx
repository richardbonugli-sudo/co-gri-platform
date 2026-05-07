/**
 * Company Mode Page - Final Integrated Layout
 * Integrates all 9 components (C1-C9) with cross-component interactions
 * Part of CO-GRI Platform Phase 2 - Week 5
 * 
 * UPDATED: Now uses Unified Event Service for real geopolitical events
 * - Removed generateMockTimelineEvents() mock data generator
 * - TimelineEventFeed fetches real events internally via unifiedEventService
 * - Ensures internal consistency with Country Dashboard
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Calendar, 
  X, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { useGlobalState } from '@/store/globalState';

// Import all 9 components
import { CompanySummaryPanel } from '@/components/company/CompanySummaryPanel';
import { COGRITrendChart } from '@/components/company/COGRITrendChart';
import { RiskContributionMap } from '@/components/company/RiskContributionMap';
import { ExposurePathways } from '@/components/company/ExposurePathways';
import { TopRelevantRisks } from '@/components/company/TopRelevantRisks';
import { PeerComparison } from '@/components/company/PeerComparison';
import { RiskAttribution } from '@/components/company/RiskAttribution';
import { TimelineEventFeed } from '@/components/company/TimelineEventFeed';
import { VerificationDrawer } from '@/components/company/VerificationDrawer';

// Import services
import { calculateCOGRIScore } from '@/services/cogriCalculationService';
import { getCompanyGeographicExposure } from '@/services/geographicExposureService';
import { calculateCountryAttribution } from '@/utils/attributionCalculations';
import { generateChannelExposures } from '@/utils/channelCalculations';
import { getTopStructuralDrivers } from '@/utils/riskRelevance';
import { generatePeerCompanies } from '@/utils/peerComparison';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Component Error</h3>
            <p className="text-sm text-red-700">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Loading company data...</p>
    </div>
  </div>
);

export default function CompanyModePage() {
  const [, setLocation] = useLocation();
  
  // Global State
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const timeWindow = useGlobalState((state) => state.time_window);
  const highlightedCountries = useGlobalState((state) => state.highlightedCountries);
  const selectedEvent = useGlobalState((state) => state.selectedEvent);
  const bottomRowView = useGlobalState((state) => state.bottomRowView);
  const setHighlightedCountries = useGlobalState((state) => state.setHighlightedCountries);
  const setSelectedEvent = useGlobalState((state) => state.setSelectedEvent);
  const clearHighlights = useGlobalState((state) => state.clearHighlights);
  const setBottomRowView = useGlobalState((state) => state.setBottomRowView);

  // Local State
  const [ticker, setTicker] = useState('AAPL');
  const [isLoading, setIsLoading] = useState(true);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Load Company Data
  useEffect(() => {
    const loadCompanyData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fetch geographic exposure data
        const geoData = await getCompanyGeographicExposure(ticker);
        
        if (!geoData) {
          throw new Error('Company not found');
        }

        // Calculate CO-GRI score
        const result = calculateCOGRIScore({
          segments: geoData.segments,
          channelBreakdown: geoData.channelBreakdown,
          homeCountry: geoData.homeCountry || geoData.headquartersCountry,
          sector: geoData.sector || 'Technology',
          sectorMultiplier: geoData.sectorMultiplier || 1.0
        });
        
        setCalculationResult(result);
      } catch (error) {
        console.error('Error loading company data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyData();
  }, [ticker]);

  // Memoized Derived Data
  const companyData = useMemo(() => {
    if (!calculationResult) return null;

    return {
      ticker,
      name: ticker === 'AAPL' ? 'Apple Inc.' : `${ticker} Corporation`,
      sector: 'Technology',
      cogriScore: calculationResult.finalScore,
      riskLevel: calculationResult.riskLevel,
      countryExposures: calculationResult.countryExposures,
      channelExposures: generateChannelExposures(
        calculationResult.countryExposures,
        calculationResult.finalScore
      ),
      attributions: calculateCountryAttribution(calculationResult.countryExposures),
      structuralDrivers: getTopStructuralDrivers(calculationResult.countryExposures, 2),
      peers: generatePeerCompanies(ticker, 'Technology', calculationResult.finalScore, 5)
    };
  }, [calculationResult, ticker]);

  // C8 Event Click Handler (C3-C8 Interaction)
  const handleEventClick = useCallback((eventId: string) => {
    // Event click handling - can be expanded to show event details
    console.log('Event clicked:', eventId);
  }, []);

  // C3 Country Click Handler (C3-C8 Interaction)
  const handleCountryClick = useCallback((country: string) => {
    setHighlightedCountries([country]);
  }, [setHighlightedCountries]);

  // Clear Highlights Handler
  const handleClearHighlights = useCallback(() => {
    clearHighlights();
  }, [clearHighlights]);

  if (isLoading || !companyData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Highlight Status Bar */}
        {highlightedCountries.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 text-white">
                {highlightedCountries.length} {highlightedCountries.length === 1 ? 'Country' : 'Countries'} Highlighted
              </Badge>
              <span className="text-sm text-blue-900">
                {highlightedCountries.join(', ')}
              </span>
              {selectedEvent && (
                <span className="text-sm text-blue-700">
                  • Event: {selectedEvent.title}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHighlights}
              className="text-blue-700 hover:text-blue-900"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Highlights
            </Button>
          </div>
        )}

        {/* Main Grid Layout: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (25%) - C5 + C4 */}
          <div className="lg:col-span-3 space-y-6">
            <ErrorBoundary>
              <TopRelevantRisks
                ticker={ticker}
                risks={companyData.structuralDrivers}
                forecastDrivers={activeLens === 'Forecast Overlay' ? [
                  {
                    event_id: 'F1',
                    event_name: 'Regional Tensions Escalation',
                    probability: 0.65,
                    timing: '6-9 months',
                    why_relevant: 'High exposure in affected region',
                    expected_delta_CO_GRI: 6.5,
                    top_country_nodes: ['Taiwan', 'China', 'S. Korea']
                  }
                ] : undefined}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <ExposurePathways
                ticker={ticker}
                countryExposures={companyData.countryExposures}
                channelExposures={companyData.channelExposures}
              />
            </ErrorBoundary>
          </div>

          {/* Center Column (50%) - C3 + C2 */}
          <div className="lg:col-span-6 space-y-6">
            <ErrorBoundary>
              <RiskContributionMap
                ticker={ticker}
                countryExposures={companyData.countryExposures}
                highlightedCountries={highlightedCountries}
                onCountryClick={handleCountryClick}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <COGRITrendChart
                ticker={ticker}
                currentScore={companyData.cogriScore}
                historicalData={[
                  { date: '2024-01', score: 48.2 },
                  { date: '2024-02', score: 49.5 },
                  { date: '2024-03', score: 51.3 },
                  { date: '2024-04', score: 50.8 },
                  { date: '2024-05', score: 52.1 },
                  { date: '2024-06', score: companyData.cogriScore }
                ]}
              />
            </ErrorBoundary>
          </div>

          {/* Right Column (25%) - C1 + C6 */}
          <div className="lg:col-span-3 space-y-6">
            <ErrorBoundary>
              <CompanySummaryPanel
                ticker={ticker}
                companyName={companyData.name}
                sector={companyData.sector}
                cogriScore={companyData.cogriScore}
                riskLevel={companyData.riskLevel}
                countryExposures={companyData.countryExposures}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <PeerComparison
                currentCompany={{
                  ticker,
                  name: companyData.name,
                  sector: companyData.sector,
                  cogriScore: companyData.cogriScore,
                  riskLevel: companyData.riskLevel
                }}
                peers={companyData.peers}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Bottom Row - C7 OR (C8 + C9) */}
        <div className="mt-6">
          <Tabs value={bottomRowView} onValueChange={(v) => setBottomRowView(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="attribution">
                <BarChart3 className="h-4 w-4 mr-2" />
                Risk Attribution
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline & Verification
              </TabsTrigger>
            </TabsList>

            {/* C7: Risk Attribution (Full Width) */}
            <TabsContent value="attribution" className="mt-6">
              <ErrorBoundary>
                <RiskAttribution
                  ticker={ticker}
                  countryExposures={companyData.countryExposures}
                  totalScore={companyData.cogriScore}
                />
              </ErrorBoundary>
            </TabsContent>

            {/* C8 + C9: Timeline Feed + Verification Drawer (Split) */}
            <TabsContent value="timeline" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* C8: Timeline Event Feed (40%) - Now uses real events */}
                <div className="lg:col-span-2">
                  <ErrorBoundary>
                    <TimelineEventFeed
                      ticker={ticker}
                      onEventClick={handleEventClick}
                    />
                  </ErrorBoundary>
                </div>

                {/* C9: Verification Drawer (60%) */}
                <div className="lg:col-span-3">
                  <ErrorBoundary>
                    <VerificationDrawer
                      ticker={ticker}
                      finalScore={companyData.cogriScore}
                      defaultCollapsed={false}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}