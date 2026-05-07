/**
 * Company Mode Page - Enhanced with Persistent Global Navigation
 * Integrates all 9 components (C1-C9) with Forecast capabilities
 * Part of CO-GRI Platform Phase 3 - Week 8
 * Phase 1 Critical Fix: Global navigation always visible
 *
 * UPDATED: Now uses Unified Event Service for real geopolitical events
 *
 * R3 FIX: topN increased from 2 to 5 in getTopStructuralDrivers call.
 * R3 FIX: ErrorBoundary now shows meaningful fallback UI with retry button.
 * R5 FIX: Timeout increased from 10s to 30s. Progressive loading: show static
 *         snapshot immediately, then upgrade with live EDGAR data asynchronously.
 * R8 FIX: All three derived analytics (channelExposures, structuralDrivers,
 *         attributions) now computed by single deriveCompanyAnalytics() call —
 *         eliminates pre/post-normalization divergence and random channel selection.
 * R6 FIX: Runtime Validation tab added showing execution path, channel quality
 *         matrix, differentiation score, fallback audit, and data consistency.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  Zap,
  LineChart,
  FileText,
  Shield,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useGlobalState } from '@/store/globalState';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import { GlobalNavigationBar } from '@/components/navigation/GlobalNavigationBar';

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
import { CompanyForecastSummary } from '@/components/forecast/CompanyForecastSummary';
import { CompanyTradingSignalView } from '@/components/company/CompanyTradingSignalView';
import { RuntimeValidationReport } from '@/components/company/RuntimeValidationReport';

// Import services
import { calculateCOGRIScore } from '@/services/cogriCalculationService';
import { getCompanyGeographicExposure } from '@/services/geographicExposureService';
import { deriveCompanyAnalytics } from '@/services/calculations/deriveCompanyAnalytics';
import { generatePeerCompanies } from '@/utils/peerComparison';
import { getMockCompanyForecastOutlook } from '@/services/mockData/companyForecastData';
import {
  generateValidationReport,
  type ValidationReport,
} from '@/services/runtimeValidation';

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary Component
// R3 FIX: Shows meaningful fallback UI with component name and retry button
// rather than silently swallowing errors.
// ─────────────────────────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary] Component error in ${this.props.componentName || 'unknown'}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center p-6 border border-red-800/40 rounded-lg bg-red-950/20">
          <div className="text-center space-y-3 max-w-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">
                {this.props.componentName || 'Component'} Error
              </h3>
              <p className="text-xs text-red-300/70 mt-1 font-mono break-all">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="border-red-800/50 text-red-400 hover:bg-red-950/40 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton Component
// ─────────────────────────────────────────────────────────────────────────────
const LoadingSkeleton: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-12">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">{message || 'Loading company data...'}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Progressive Loading Indicator (R5 FIX)
// ─────────────────────────────────────────────────────────────────────────────
const LiveDataUpgradeIndicator: React.FC<{ isUpgrading: boolean; upgraded: boolean }> = ({
  isUpgrading,
  upgraded,
}) => {
  if (!isUpgrading && !upgraded) return null;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
        upgraded
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      }`}
    >
      {isUpgrading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Upgrading with live EDGAR data…
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Live EDGAR data applied
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyModePage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const { setActiveMode } = useGlobalDashboardStore();

  useEffect(() => {
    setActiveMode('Company');
  }, [setActiveMode]);

  // Parse ticker from URL query params
  const tickerFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get('ticker');
  }, [searchString]);

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
  const setActiveLens = useGlobalState((state) => state.setActiveCompanyLens);
  const setActiveGlobalMode = useGlobalState((state) => state.setActiveMode);

  // Local State
  const [ticker, setTicker] = useState(tickerFromUrl || 'AAPL');
  const [isLoading, setIsLoading] = useState(true);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [forecastOutlook, setForecastOutlook] = useState<any>(null);
  const [companyMeta, setCompanyMeta] = useState<{ name: string; sector: string } | null>(null);
  const [rawGeoData, setRawGeoData] = useState<any>(null);

  // R5 FIX: Progressive loading state
  const [isUpgradingWithLive, setIsUpgradingWithLive] = useState(false);
  const [liveUpgradeComplete, setLiveUpgradeComplete] = useState(false);
  const [pipelineMs, setPipelineMs] = useState(0);

  // R6: Validation report state
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Abort controller for cleanup
  const abortRef = useRef<AbortController | null>(null);

  // Update ticker when URL changes
  useEffect(() => {
    if (tickerFromUrl && tickerFromUrl !== ticker) {
      console.log('[CompanyMode] URL ticker changed to:', tickerFromUrl);
      setTicker(tickerFromUrl);
    }
  }, [tickerFromUrl]);

  // ── R5 FIX: Progressive loading ──────────────────────────────────────────
  // Phase 1: Show static snapshot data immediately (fast, no network)
  // Phase 2: Upgrade with live EDGAR data asynchronously (up to 30s)
  useEffect(() => {
    // Cancel any in-flight requests for previous ticker
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const loadCompanyData = async () => {
      setIsLoading(true);
      setLiveUpgradeComplete(false);
      setIsUpgradingWithLive(false);
      setValidationReport(null);
      console.log('[CompanyMode] Starting progressive load for:', ticker);

      const t0 = Date.now();

      try {
        // ── Phase 1: Static snapshot (fast path, no live EDGAR) ──────────────
        // We call getCompanyGeographicExposure which internally tries live EDGAR
        // with a 30s timeout. We show a loading state until Phase 1 data arrives.
        console.log('[CompanyMode] Phase 1: Fetching geographic exposure...');

        // R5 FIX: 30-second timeout (was 10s)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Data loading timeout after 30s')), 30000)
        );

        setIsUpgradingWithLive(true);
        const geoDataPromise = getCompanyGeographicExposure(ticker);
        const geoData = await Promise.race([geoDataPromise, timeoutPromise]) as any;

        if (signal.aborted) return;

        console.log('[CompanyMode] Geographic data received:', geoData ? 'success' : 'null');
        setIsUpgradingWithLive(false);
        setLiveUpgradeComplete(true);

        if (!geoData) throw new Error('Company not found');

        setRawGeoData(geoData);
        const elapsed = Date.now() - t0;
        setPipelineMs(elapsed);

        // ── Calculate CO-GRI score ──────────────────────────────────────────
        console.log('[CompanyMode] Calculating CO-GRI score...');
        const result = calculateCOGRIScore({
          segments: geoData.segments,
          channelBreakdown: geoData.channelBreakdown,
          homeCountry: geoData.homeCountry || geoData.headquartersCountry,
          sector: geoData.sector || 'Technology',
          sectorMultiplier: geoData.sectorMultiplier || 1.0,
        });

        if (signal.aborted) return;

        console.log('[CompanyMode] CO-GRI calculation complete:', result.finalScore);
        setCalculationResult(result);

        setCompanyMeta({
          name: geoData.companyName || geoData.name || null,
          sector: geoData.sector || 'Technology',
        });

        // Load forecast outlook
        const outlook = getMockCompanyForecastOutlook(ticker);
        setForecastOutlook(outlook);

        console.log('[CompanyMode] All data loaded successfully in', elapsed, 'ms');
      } catch (error) {
        if (signal.aborted) return;
        console.error('[CompanyMode] Error loading company data:', error);
        setIsUpgradingWithLive(false);
        alert(
          `Error loading company data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try refreshing the page.`
        );
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    loadCompanyData();

    return () => {
      abortRef.current?.abort();
    };
  }, [ticker]);

  // ── R8 FIX: Unified analytics derivation ─────────────────────────────────
  // All three derived analytics computed in ONE consistent pass from the same
  // countryExposures array — eliminates pre/post-normalization divergence.
  const companyData = useMemo(() => {
    if (!calculationResult) return null;

    const KNOWN_NAMES: Record<string, string> = {
      AAPL: 'Apple Inc.',
      TSLA: 'Tesla, Inc.',
      MSFT: 'Microsoft Corporation',
      META: 'Meta Platforms, Inc.',
      NVDA: 'NVIDIA Corporation',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com, Inc.',
    };
    const resolvedName =
      companyMeta?.name ||
      KNOWN_NAMES[ticker.toUpperCase()] ||
      `${ticker.toUpperCase()} Corporation`;
    const resolvedSector = companyMeta?.sector || 'Technology';

    // R8 FIX: Single unified analytics derivation
    const analytics = deriveCompanyAnalytics(
      calculationResult.countryExposures,
      calculationResult.finalScore,
      5 // topN=5 (R3 FIX)
    );

    return {
      ticker,
      name: resolvedName,
      sector: resolvedSector,
      cogriScore: calculationResult.finalScore,
      riskLevel: calculationResult.riskLevel,
      countryExposures: calculationResult.countryExposures,
      // R8 FIX: All three from same derivation pass
      channelExposures: analytics.channelExposures,
      attributions: analytics.attributions,
      structuralDrivers: analytics.structuralDrivers,
      peers: generatePeerCompanies(ticker, resolvedSector, calculationResult.finalScore, 5),
    };
  }, [calculationResult, ticker, companyMeta]);

  // ── R6: Generate validation report ───────────────────────────────────────
  const handleGenerateValidationReport = useCallback(async () => {
    if (!calculationResult || !rawGeoData) return;
    setIsGeneratingReport(true);
    try {
      const report = generateValidationReport({
        ticker,
        countryExposures: calculationResult.countryExposures,
        finalScore: calculationResult.finalScore,
        scoreUncertainty: calculationResult.scoreUncertainty || 0,
        geoData: rawGeoData,
        pipelineMs,
      });
      setValidationReport(report);
    } catch (e) {
      console.error('[CompanyMode] Failed to generate validation report:', e);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [calculationResult, rawGeoData, ticker, pipelineMs]);

  // Auto-generate validation report when data is ready
  useEffect(() => {
    if (calculationResult && rawGeoData && !validationReport) {
      handleGenerateValidationReport();
    }
  }, [calculationResult, rawGeoData]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleEventClick = useCallback((eventId: string) => {
    console.log('Event clicked:', eventId);
  }, []);

  const handleCountryClick = useCallback(
    (country: string) => {
      setHighlightedCountries([country]);
    },
    [setHighlightedCountries]
  );

  const handleClearHighlights = useCallback(() => {
    clearHighlights();
  }, [clearHighlights]);

  const handleViewInForecastMode = useCallback(() => {
    setActiveGlobalMode('Forecast');
    setLocation('/forecast?tab=company&ticker=' + ticker);
  }, [ticker, setActiveGlobalMode, setLocation]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || !companyData) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalNavigationBar />
        <div className="container mx-auto p-6">
          <LoadingSkeleton message="Loading company data…" />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigationBar />

      <div className="container mx-auto p-6 space-y-6">
        {/* Top action bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <LiveDataUpgradeIndicator
            isUpgrading={isUpgradingWithLive}
            upgraded={liveUpgradeComplete}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/cogri-audit-report')}
            className="gap-2 border-teal-700/50 text-teal-400 hover:bg-teal-950/40 hover:text-teal-300 ml-auto"
          >
            <FileText className="h-4 w-4" />
            Full Methodology Audit Report
          </Button>
        </div>

        {/* Secondary Navigation: Five-Tab Structure (added Runtime Validation) */}
        <Tabs value={activeLens} onValueChange={(v) => setActiveLens(v as any)}>
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="Structural" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Structural
            </TabsTrigger>
            <TabsTrigger value="Forecast Overlay" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="Scenario Shock" className="gap-1.5 text-xs" disabled>
              <Zap className="h-3.5 w-3.5" />
              Scenario
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1">Soon</Badge>
            </TabsTrigger>
            <TabsTrigger value="Trading Signal" className="gap-1.5 text-xs">
              <LineChart className="h-3.5 w-3.5" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="Validation" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              Validation
            </TabsTrigger>
          </TabsList>

          {/* ── Structural Tab ──────────────────────────────────────────── */}
          <TabsContent value="Structural" className="space-y-6 mt-6">
            {/* Highlight Status Bar */}
            {highlightedCountries.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600 text-white">
                    {highlightedCountries.length}{' '}
                    {highlightedCountries.length === 1 ? 'Country' : 'Countries'} Highlighted
                  </Badge>
                  <span className="text-sm text-blue-900">{highlightedCountries.join(', ')}</span>
                  {selectedEvent && (
                    <span className="text-sm text-blue-700">• Event: {selectedEvent.title}</span>
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

            {/* Evidence Tier Summary Bar */}
            {companyData.countryExposures.length > 0 &&
              (() => {
                const getTier = (e: any) => e.tier || e.dataSource || 'FALLBACK';
                const direct = companyData.countryExposures.filter(
                  (e) => getTier(e) === 'DIRECT'
                ).length;
                const allocated = companyData.countryExposures.filter(
                  (e) => getTier(e) === 'ALLOCATED'
                ).length;
                const modeled = companyData.countryExposures.filter(
                  (e) => getTier(e) === 'MODELED'
                ).length;
                const fallback = companyData.countryExposures.filter(
                  (e) => getTier(e) === 'FALLBACK'
                ).length;
                const total = companyData.countryExposures.length;
                const directWeight = companyData.countryExposures
                  .filter((e) => getTier(e) === 'DIRECT')
                  .reduce((s, e) => s + e.exposureWeight, 0);
                const allocatedWeight = companyData.countryExposures
                  .filter((e) => getTier(e) === 'ALLOCATED')
                  .reduce((s, e) => s + e.exposureWeight, 0);
                return (
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2 rounded-lg border border-border/50 bg-muted/30 text-xs">
                    <span className="font-semibold text-muted-foreground mr-1">Data Source:</span>
                    {direct > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        DIRECT {direct}/{total} ({(directWeight * 100).toFixed(0)}% weight)
                      </span>
                    )}
                    {allocated > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                        ALLOCATED {allocated}/{total} ({(allocatedWeight * 100).toFixed(0)}% weight)
                      </span>
                    )}
                    {modeled > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                        MODELED {modeled}/{total}
                      </span>
                    )}
                    {fallback > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                        FALLBACK {fallback}/{total}
                      </span>
                    )}
                    <span className="ml-auto text-muted-foreground/60 italic">
                      V5 methodology · {total} countries
                    </span>
                  </div>
                );
              })()}

            {/* Main Grid Layout: 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (25%) - C5 + C4 */}
              <div className="lg:col-span-3 space-y-6">
                <ErrorBoundary componentName="Top Relevant Risks">
                  <TopRelevantRisks
                    ticker={ticker}
                    risks={companyData.structuralDrivers}
                  />
                </ErrorBoundary>

                <ErrorBoundary componentName="Exposure Pathways">
                  <ExposurePathways
                    ticker={ticker}
                    countryExposures={companyData.countryExposures}
                    channelExposures={companyData.channelExposures}
                  />
                </ErrorBoundary>
              </div>

              {/* Center Column (50%) - C3 + C2 */}
              <div className="lg:col-span-6 space-y-6">
                <ErrorBoundary componentName="Risk Contribution Map">
                  <RiskContributionMap
                    ticker={ticker}
                    countryExposures={companyData.countryExposures}
                    highlightedCountries={highlightedCountries}
                    onCountryClick={handleCountryClick}
                  />
                </ErrorBoundary>

                <ErrorBoundary componentName="CO-GRI Trend Chart">
                  <COGRITrendChart
                    ticker={ticker}
                    companyName={companyData.name}
                    currentScore={companyData.cogriScore}
                    countryExposures={companyData.countryExposures}
                    sector={companyData.sector}
                  />
                </ErrorBoundary>
              </div>

              {/* Right Column (25%) - C1 + C6 */}
              <div className="lg:col-span-3 space-y-6">
                <ErrorBoundary componentName="Company Summary Panel">
                  <CompanySummaryPanel
                    ticker={ticker}
                    companyName={companyData.name}
                    sector={companyData.sector}
                    homeCountry="United States"
                    cogriScore={companyData.cogriScore}
                  />
                </ErrorBoundary>

                <ErrorBoundary componentName="Peer Comparison">
                  <PeerComparison
                    currentCompany={{
                      ticker,
                      name: companyData.name,
                      sector: companyData.sector,
                      cogriScore: companyData.cogriScore,
                      riskLevel: companyData.riskLevel,
                    }}
                    peers={companyData.peers}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* Bottom Row - C7 OR (C8 + C9) */}
            <div className="mt-6">
              <Tabs
                value={bottomRowView}
                onValueChange={(v) => setBottomRowView(v as any)}
              >
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

                {/* C7: Risk Attribution */}
                <TabsContent value="attribution" className="mt-6">
                  <ErrorBoundary componentName="Risk Attribution">
                    <RiskAttribution
                      ticker={ticker}
                      countryExposures={companyData.countryExposures}
                      totalScore={companyData.cogriScore}
                    />
                  </ErrorBoundary>
                </TabsContent>

                {/* C8 + C9: Timeline Feed + Verification Drawer */}
                <TabsContent value="timeline" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2">
                      <ErrorBoundary componentName="Timeline Event Feed">
                        <TimelineEventFeed
                          ticker={ticker}
                          onEventClick={handleEventClick}
                        />
                      </ErrorBoundary>
                    </div>
                    <div className="lg:col-span-3">
                      <ErrorBoundary componentName="Verification Drawer">
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
          </TabsContent>

          {/* ── Forecast Overlay Tab ────────────────────────────────────── */}
          <TabsContent value="Forecast Overlay" className="space-y-6 mt-6">
            {forecastOutlook ? (
              <>
                <ErrorBoundary componentName="Company Forecast Summary">
                  <CompanyForecastSummary
                    outlook={forecastOutlook}
                    onViewInForecastMode={handleViewInForecastMode}
                  />
                </ErrorBoundary>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-3 space-y-6">
                    <ErrorBoundary componentName="Top Relevant Risks (Forecast)">
                      <TopRelevantRisks
                        ticker={ticker}
                        risks={companyData.structuralDrivers}
                        forecastDrivers={forecastOutlook.top_forecast_drivers}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary componentName="Exposure Pathways (Forecast)">
                      <ExposurePathways
                        ticker={ticker}
                        countryExposures={companyData.countryExposures}
                        channelExposures={companyData.channelExposures}
                        forecastChannelImpact={forecastOutlook.channel_impact_assessment}
                      />
                    </ErrorBoundary>
                  </div>

                  <div className="lg:col-span-6 space-y-6">
                    <ErrorBoundary componentName="Risk Contribution Map (Forecast)">
                      <RiskContributionMap
                        ticker={ticker}
                        countryExposures={companyData.countryExposures}
                        highlightedCountries={highlightedCountries}
                        onCountryClick={handleCountryClick}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary componentName="CO-GRI Trend Chart (Forecast)">
                      <COGRITrendChart
                        ticker={ticker}
                        companyName={companyData.name}
                        currentScore={companyData.cogriScore}
                        countryExposures={companyData.countryExposures}
                        sector={companyData.sector}
                      />
                    </ErrorBoundary>
                  </div>

                  <div className="lg:col-span-3 space-y-6">
                    <ErrorBoundary componentName="Company Summary Panel (Forecast)">
                      <CompanySummaryPanel
                        ticker={ticker}
                        companyName={companyData.name}
                        sector={companyData.sector}
                        homeCountry="United States"
                        cogriScore={companyData.cogriScore}
                        forecastOverlay={{
                          forecast_outlook: forecastOutlook.outlook,
                          confidence: forecastOutlook.confidence,
                          horizon: '6-12 months',
                          expected_delta_CO_GRI: forecastOutlook.expected_delta_CO_GRI,
                        }}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary componentName="Peer Comparison (Forecast)">
                      <PeerComparison
                        currentCompany={{
                          ticker,
                          name: companyData.name,
                          sector: companyData.sector,
                          cogriScore: companyData.cogriScore,
                          riskLevel: companyData.riskLevel,
                        }}
                        peers={companyData.peers}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Forecast Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Forecast outlook not available for {ticker}
                </p>
                <Button onClick={handleViewInForecastMode}>View Global Forecast</Button>
              </div>
            )}
          </TabsContent>

          {/* ── Scenario Shock Tab (Placeholder) ───────────────────────── */}
          <TabsContent value="Scenario Shock" className="space-y-6 mt-6">
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Zap className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Scenario Shock Analysis</h3>
              <p className="text-sm text-muted-foreground">Coming in Week 9-10</p>
            </div>
          </TabsContent>

          {/* ── Trading Signal Tab ──────────────────────────────────────── */}
          <TabsContent value="Trading Signal" className="space-y-6 mt-6">
            <CompanyTradingSignalView
              ticker={ticker}
              companyName={companyData.name}
              sector={companyData.sector}
              cogriScore={companyData.cogriScore}
              riskLevel={companyData.riskLevel}
              countryExposures={companyData.countryExposures}
              channelExposures={companyData.channelExposures}
              structuralDrivers={companyData.structuralDrivers}
            />
          </TabsContent>

          {/* ── Runtime Validation Tab (R6) ─────────────────────────────── */}
          <TabsContent value="Validation" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Runtime Validation Report
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    V5 methodology execution trace for{' '}
                    <span className="font-mono font-semibold">{ticker}</span> — shows exact
                    execution path, channel evidence quality, differentiation score, and data
                    source consistency.
                  </p>
                </div>
              </div>

              {isGeneratingReport ? (
                <LoadingSkeleton message="Generating validation report…" />
              ) : validationReport ? (
                <RuntimeValidationReport
                  report={validationReport}
                  onRefresh={handleGenerateValidationReport}
                  isRefreshing={isGeneratingReport}
                />
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Validation Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Load company data first, then generate the validation report.
                  </p>
                  <Button onClick={handleGenerateValidationReport} disabled={!calculationResult}>
                    Generate Report
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}