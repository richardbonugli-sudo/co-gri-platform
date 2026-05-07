/**
 * Enhanced Company Mode Page
 * Phase 2 Implementation - Task 3: Sub-tab structure with lens-aware routing
 * 
 * Layout follows specification Part 3, Section 3.2:
 * - Left Column (25%): C5 (Top Relevant Risks), C4 (Exposure Pathways)
 * - Center Column (50%): C3 (Risk Contribution Map), C2 (COGRI Trend)
 * - Right Column (25%): C1 (Company Summary), C6 (Peer Comparison)
 * - Bottom Row (Full Width): C7 (Risk Attribution), C8 (Timeline), C9 (Verification Drawer)
 * 
 * UPDATED: Now uses Unified Event Service for real geopolitical events
 * - Switched from legacy TimelineEventFeed to refactored version
 * - Removed hardcoded mock events array
 * - TimelineEventFeed fetches real events internally via unifiedEventService
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'wouter';
import { useGlobalState } from '@/store/globalState';

// Tab Navigation
import { CompanyModeTabs } from '@/components/company/CompanyModeTabs';

// Company Mode Components (C1-C9)
import { CompanySummaryPanel } from '@/components/company/CompanySummaryPanel';
import { COGRITrendChart } from '@/components/company/COGRITrendChart';
import { RiskContributionMap } from '@/components/company/RiskContributionMap';
import { ExposurePathways } from '@/components/company/ExposurePathways';
import { TopRelevantRisks } from '@/components/company/TopRelevantRisks';
import PeerComparison from '@/components/PeerComparison';
import { RiskAttribution } from '@/components/company/RiskAttribution';
import { TimelineEventFeed } from '@/components/company/TimelineEventFeed'; // Updated to refactored version
import VerificationDrawer from '@/components/VerificationDrawer';

// Existing COGRI calculation imports
import { orchestrateCOGRICalculation, type COGRICalculationResult } from '@/services/cogriCalculationOrchestrator';
import { getCompanyGeographicExposureV4 as getCompanyGeographicExposure, type CompanyGeographicData } from '@/services/v34ComprehensiveIntegrationV4';

export default function EnhancedCompanyMode() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { active_lens, setLens } = useGlobalState();

  const getTickerFromSearch = () => {
    const params = new URLSearchParams(searchString);
    return params.get('ticker') || '';
  };

  const [ticker, setTicker] = useState(getTickerFromSearch());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<CompanyGeographicData | null>(null);
  const [calculationResult, setCalculationResult] = useState<COGRICalculationResult | null>(null);

  useEffect(() => {
    const tickerParam = getTickerFromSearch();
    if (tickerParam && tickerParam !== ticker) {
      setTicker(tickerParam);
      handleAssessment(tickerParam);
    }
  }, [searchString]);

  const handleAssessment = async (searchTicker?: string) => {
    const targetTicker = (searchTicker || ticker).trim().toUpperCase();

    if (!targetTicker) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setGeoData(null);
    setCalculationResult(null);

    try {
      const data = await getCompanyGeographicExposure(targetTicker);
      setGeoData(data);

      const result = orchestrateCOGRICalculation({
        segments: data.segments,
        channelBreakdown: data.channelBreakdown,
        homeCountry: data.homeCountry,
        sector: data.sector,
        sectorMultiplier: data.sectorMultiplier || 1.0
      });

      setCalculationResult(result);
      setLocation(`/company-mode?ticker=${targetTicker}`);
    } catch (err) {
      console.error('[Enhanced Company Mode] Assessment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assess company');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for new components
  const generateMockData = () => {
    if (!calculationResult || !geoData) return null;

    // Mock trend data
    const trendData = Array.from({ length: 31 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cogriScore: calculationResult.finalScore + (Math.random() - 0.5) * 10
      };
    });

    // Mock country risks with regions
    const countryRisks = calculationResult.countryExposures.map(ce => ({
      country: ce.country,
      exposureWeight: ce.exposureWeight,
      countryShockIndex: ce.countryShockIndex,
      contribution: ce.contribution,
      region: getRegion(ce.country)
    }));

    // Mock channel exposures
    const channelExposures = [
      {
        channel: 'Revenue' as const,
        weight: 0.35,
        topCountries: calculationResult.countryExposures.slice(0, 6).map(ce => ({
          country: ce.country,
          percentage: ce.exposureWeight * 100
        })),
        riskScore: calculationResult.finalScore * 0.9
      },
      {
        channel: 'Supply' as const,
        weight: 0.30,
        topCountries: calculationResult.countryExposures.slice(0, 6).map(ce => ({
          country: ce.country,
          percentage: ce.exposureWeight * 100
        })),
        riskScore: calculationResult.finalScore * 1.1
      },
      {
        channel: 'Assets' as const,
        weight: 0.20,
        topCountries: calculationResult.countryExposures.slice(0, 6).map(ce => ({
          country: ce.country,
          percentage: ce.exposureWeight * 100
        })),
        riskScore: calculationResult.finalScore * 0.8
      },
      {
        channel: 'Financial' as const,
        weight: 0.15,
        topCountries: calculationResult.countryExposures.slice(0, 6).map(ce => ({
          country: ce.country,
          percentage: ce.exposureWeight * 100
        })),
        riskScore: calculationResult.finalScore * 0.7
      }
    ];

    // Mock geopolitical risks
    const geopoliticalRisks = [
      {
        id: '1',
        title: 'US-China Trade Tensions',
        description: 'Ongoing trade restrictions and tariff escalations affecting supply chains',
        severity: 'high' as const,
        probability: 75,
        impact: 85,
        affectedCountries: ['China', 'Taiwan', 'Vietnam'],
        affectedChannels: ['Supply Chain', 'Revenue'],
        timeframe: 'Q2-Q4 2026',
        mitigation: 'Diversify supply chain to Southeast Asia and Mexico; establish secondary manufacturing hubs'
      },
      {
        id: '2',
        title: 'Taiwan Strait Tensions',
        description: 'Increased military activity and geopolitical uncertainty in the Taiwan Strait',
        severity: 'critical' as const,
        probability: 60,
        impact: 95,
        affectedCountries: ['Taiwan', 'China', 'Japan'],
        affectedChannels: ['Supply Chain', 'Physical Assets'],
        timeframe: '6-12 months',
        mitigation: 'Develop contingency plans for semiconductor supply disruption; increase inventory buffers'
      }
    ];

    // Mock risk attribution components
    const attributionComponents = calculationResult.countryExposures.slice(0, 5).map((ce, idx) => ({
      name: ce.country,
      value: ce.contribution,
      percentage: (ce.contribution / calculationResult.finalScore) * 100,
      description: `Risk contribution from ${ce.country} exposure across all channels`
    }));

    return {
      trendData,
      countryRisks,
      channelExposures,
      geopoliticalRisks,
      attributionComponents
    };
  };

  const getRegion = (country: string): string => {
    const regions: Record<string, string> = {
      'China': 'East Asia',
      'Taiwan': 'East Asia',
      'Japan': 'East Asia',
      'South Korea': 'East Asia',
      'Vietnam': 'Southeast Asia',
      'Thailand': 'Southeast Asia',
      'Singapore': 'Southeast Asia',
      'India': 'South Asia',
      'United States': 'North America',
      'Mexico': 'North America',
      'Germany': 'Europe',
      'United Kingdom': 'Europe'
    };
    return regions[country] || 'Other';
  };

  const mockData = calculationResult && geoData ? generateMockData() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-[1920px]">
        {/* Navigation */}
        <div className="flex gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/cogri">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to COGRI</span>
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Intelligence Dashboard</h1>
          {geoData && (
            <p className="text-lg text-gray-600">
              {geoData.company} ({ticker}) • {geoData.sector} • {geoData.homeCountry}
            </p>
          )}
        </div>

        {/* Sub-Tab Navigation */}
        {calculationResult && geoData && (
          <div className="mb-6" data-testid="company-mode-tabs">
            <CompanyModeTabs />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Company Mode Layout */}
        {calculationResult && geoData && mockData && (
          <div className="space-y-6">
            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column (25%) */}
              <div className="lg:col-span-1 space-y-6" data-testid="left-column">
                {/* C5: Top Relevant Risks */}
                <TopRelevantRisks
                  ticker={ticker}
                  risks={mockData.geopoliticalRisks}
                />

                {/* C4: Exposure Pathways */}
                <ExposurePathways
                  ticker={ticker}
                  channelExposures={mockData.channelExposures}
                />
              </div>

              {/* Center Column (50%) */}
              <div className="lg:col-span-2 space-y-6" data-testid="center-column">
                {/* C3: Risk Contribution Map */}
                <RiskContributionMap
                  ticker={ticker}
                  countryRisks={mockData.countryRisks}
                />

                {/* C2: COGRI Trend Chart */}
                <COGRITrendChart
                  ticker={ticker}
                  companyName={geoData.company}
                  trendData={mockData.trendData}
                  currentScore={calculationResult.finalScore}
                />
              </div>

              {/* Right Column (25%) */}
              <div className="lg:col-span-1 space-y-6" data-testid="right-column">
                {/* C1: Company Summary Panel */}
                <CompanySummaryPanel
                  ticker={ticker}
                  companyName={geoData.company}
                  sector={geoData.sector}
                  homeCountry={geoData.homeCountry}
                  cogriScore={calculationResult.finalScore}
                  riskLevel={calculationResult.riskLevel}
                  topExposures={calculationResult.countryExposures.slice(0, 5).map(ce => ({
                    country: ce.country,
                    percentage: ce.exposureWeight * 100
                  }))}
                />

                {/* C6: Peer Comparison */}
                <PeerComparison
                  currentCompany={{
                    ticker,
                    name: geoData.company,
                    cogriScore: calculationResult.finalScore,
                    riskLevel: calculationResult.riskLevel
                  }}
                  peers={[
                    { ticker: 'NVDA', name: 'NVIDIA Corp.', cogriScore: 68.7, riskLevel: 'Elevated' },
                    { ticker: 'INTC', name: 'Intel Corp.', cogriScore: 54.2, riskLevel: 'Elevated' },
                    { ticker: 'AMD', name: 'AMD Inc.', cogriScore: 61.3, riskLevel: 'Elevated' }
                  ]}
                />
              </div>
            </div>

            {/* Bottom Row (Full Width) */}
            <div className="space-y-6">
              {/* C7: Risk Attribution */}
              <RiskAttribution
                ticker={ticker}
                totalScore={calculationResult.finalScore}
                components={mockData.attributionComponents}
              />

              {/* C8: Timeline / Event Feed - Now uses real events */}
              <TimelineEventFeed
                ticker={ticker}
                onEventClick={(eventId) => console.log('Event clicked:', eventId)}
              />

              {/* C9: Verification Drawer (Collapsed by Default) */}
              <VerificationDrawer
                exposureMatrix={geoData.channelBreakdown || {}}
                pipelineSteps={{
                  W_geo: {},
                  W_norm: {},
                  W_c: {},
                  AdjS: {},
                  Risk: {}
                }}
                coverage={{
                  exposure_coverage: 95,
                  alignment_coverage: 85,
                  shock_data_freshness: new Date()
                }}
              />
            </div>
          </div>
        )}

        {/* Input Section - Only show when no results */}
        {!calculationResult && !loading && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Enter Company Ticker</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter ticker (e.g., AAPL, MSFT, TSLA)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleAssessment()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={() => handleAssessment()}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {loading ? 'Analyzing...' : 'Analyze Company'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}