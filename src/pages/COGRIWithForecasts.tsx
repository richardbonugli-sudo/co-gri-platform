/**
 * Phase 5D-5: COGRI Assessment Page with Forecast Integration
 * 
 * Complete integration of predictive forecasts into COGRI assessment
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Download, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Calendar,
  Target,
  Activity,
  Zap
} from 'lucide-react';

// Phase 5D imports
import { ForecastCard } from '@/components/ForecastCard';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { EventTimeline } from '@/components/EventTimeline';

import { 
  initializeForecastService, 
  getCurrentForecast,
  hasForecast 
} from '@/services/forecastIntegrationService';

import {
  getPredictiveEngine,
  calculateScenarioAnalysis,
  calculateTimeSeriesForecast
} from '@/services/predictiveCalculationEngine';

import type {
  PredictiveCOGRI,
  ScenarioAnalysis,
  TimeSeriesForecast,
  TimeHorizon,
  ScenarioType,
  PredictiveCalculationInput
} from '@/types/forecast.types';

// Existing imports
import { getCompanyGeographicExposure } from '@/services/v34ComprehensiveIntegration';
import { COGRIVisualization } from '@/components/COGRIVisualization';
import { GeographicExposureTable } from '@/components/GeographicExposureTable';
import { ChannelBreakdownTable } from '@/components/ChannelBreakdownTable';

export default function COGRIWithForecasts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current COGRI data
  const [geoData, setGeoData] = useState<any>(null);
  const [currentCOGRI, setCurrentCOGRI] = useState<number | null>(null);
  
  // Forecast data
  const [forecastEnabled, setForecastEnabled] = useState(true);
  const [forecastInitialized, setForecastInitialized] = useState(false);
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<TimeHorizon>('1y');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('base');
  
  // Predictive results
  const [predictiveCOGRI, setPredictiveCOGRI] = useState<PredictiveCOGRI | null>(null);
  const [scenarioAnalysis, setScenarioAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [timeSeriesForecast, setTimeSeriesForecast] = useState<TimeSeriesForecast | null>(null);

  // Initialize forecast service on mount
  useEffect(() => {
    const initForecasts = async () => {
      try {
        console.log('[COGRI Forecasts] Initializing forecast service...');
        await initializeForecastService({
          cacheEnabled: true,
          autoRefresh: false,
          validationRequired: true
        });
        setForecastInitialized(true);
        console.log('[COGRI Forecasts] Forecast service initialized');
      } catch (err) {
        console.error('[COGRI Forecasts] Failed to initialize forecasts:', err);
        setForecastInitialized(false);
      }
    };

    initForecasts();
  }, []);

  // Load ticker from URL
  useEffect(() => {
    const tickerParam = searchParams.get('ticker');
    if (tickerParam && tickerParam !== ticker) {
      setTicker(tickerParam);
      handleAssessment(tickerParam);
    }
  }, [searchParams]);

  const handleAssessment = async (searchTicker?: string) => {
    const targetTicker = (searchTicker || ticker).trim().toUpperCase();
    
    if (!targetTicker) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setGeoData(null);
    setCurrentCOGRI(null);
    setPredictiveCOGRI(null);
    setScenarioAnalysis(null);
    setTimeSeriesForecast(null);

    try {
      console.log(`[COGRI Forecasts] Starting assessment for ${targetTicker}`);
      
      // Step 1: Get current geographic exposure and COGRI
      const data = await getCompanyGeographicExposure(targetTicker);
      setGeoData(data);

      // Calculate current COGRI (simplified - use your actual calculation)
      const currentScore = calculateCurrentCOGRI(data);
      setCurrentCOGRI(currentScore);

      console.log(`[COGRI Forecasts] Current COGRI: ${currentScore.toFixed(1)}`);

      // Step 2: Calculate predictive forecasts if enabled
      if (forecastEnabled && forecastInitialized && hasForecast()) {
        await calculatePredictiveForecasts(targetTicker, data, currentScore);
      }

      // Update URL
      setSearchParams({ ticker: targetTicker });

    } catch (err) {
      console.error('[COGRI Forecasts] Assessment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assess company');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentCOGRI = (data: any): number => {
    // Simplified COGRI calculation
    // In production, use your full calculation logic
    let weightedScore = 0;
    let totalWeight = 0;

    for (const segment of data.segments) {
      const weight = segment.percentage / 100;
      const risk = getCountryRisk(segment.geography);
      weightedScore += risk * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      weightedScore /= totalWeight;
    }

    // Apply sector multiplier
    const sectorMultiplier = data.sectorMultiplier || 1.0;
    return weightedScore * sectorMultiplier;
  };

  const getCountryRisk = (country: string): number => {
    // Simplified country risk scores
    const risks: Record<string, number> = {
      'United States': 35,
      'China': 58,
      'Germany': 28,
      'Japan': 25,
      'United Kingdom': 30,
      'France': 32,
      'India': 45,
      'Brazil': 52,
      'Canada': 30,
      'Mexico': 42
    };
    return risks[country] || 50;
  };

  const calculatePredictiveForecasts = async (
    ticker: string,
    geoData: any,
    currentScore: number
  ) => {
    try {
      console.log('[COGRI Forecasts] Calculating predictive forecasts...');

      const forecast = getCurrentForecast();
      if (!forecast) {
        console.warn('[COGRI Forecasts] No forecast data available');
        return;
      }

      // Prepare country exposures
      const countryExposures = geoData.segments.map((segment: any) => ({
        country: getCountryCode(segment.geography),
        exposurePercentage: segment.percentage,
        currentRisk: getCountryRisk(segment.geography)
      }));

      // Calculate predictive COGRI for selected horizon and scenario
      const engine = getPredictiveEngine();
      const input: PredictiveCalculationInput = {
        ticker,
        currentCOGRI: currentScore,
        countryExposures,
        sector: geoData.sector,
        timeHorizon: selectedTimeHorizon,
        scenario: selectedScenario,
        forecast
      };

      const result = await engine.calculatePredictiveCOGRI(input);
      setPredictiveCOGRI(result.predictiveCOGRI);

      // Calculate scenario analysis
      const scenarios = await calculateScenarioAnalysis(
        ticker,
        geoData.company,
        geoData.sector,
        currentScore,
        countryExposures,
        selectedTimeHorizon
      );
      setScenarioAnalysis(scenarios);

      // Calculate time series forecast
      const timeSeries = await calculateTimeSeriesForecast(
        ticker,
        geoData.company,
        geoData.sector,
        currentScore,
        countryExposures,
        selectedScenario
      );
      setTimeSeriesForecast(timeSeries);

      console.log('[COGRI Forecasts] Predictive forecasts calculated successfully');

    } catch (err) {
      console.error('[COGRI Forecasts] Failed to calculate forecasts:', err);
    }
  };

  const getCountryCode = (countryName: string): string => {
    const codes: Record<string, string> = {
      'United States': 'US',
      'China': 'CN',
      'Germany': 'DE',
      'Japan': 'JP',
      'United Kingdom': 'GB',
      'France': 'FR',
      'India': 'IN',
      'Brazil': 'BR',
      'Canada': 'CA',
      'Mexico': 'MX'
    };
    return codes[countryName] || 'XX';
  };

  const handleTimeHorizonChange = async (horizon: TimeHorizon) => {
    setSelectedTimeHorizon(horizon);
    if (geoData && currentCOGRI) {
      await calculatePredictiveForecasts(ticker, geoData, currentCOGRI);
    }
  };

  const handleScenarioChange = async (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
    if (geoData && currentCOGRI) {
      await calculatePredictiveForecasts(ticker, geoData, currentCOGRI);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low Risk': return 'bg-green-100 text-green-800 border-green-300';
      case 'Moderate Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High Risk': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Very High Risk': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 70) return 'Very High Risk';
    if (score >= 55) return 'High Risk';
    if (score >= 40) return 'Moderate Risk';
    return 'Low Risk';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">COGRI Assessment with Forecasts</h1>
        <p className="text-gray-600">
          Corporate Geopolitical Risk Index with 2026 predictive forecasting
        </p>
        
        {/* Forecast Status Badge */}
        {forecastInitialized && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <Zap className="h-3 w-3 mr-1" />
              Cedar Owl 2026 Forecasts Active
            </Badge>
          </div>
        )}
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Company Ticker</CardTitle>
          <CardDescription>
            Assess current and predicted geopolitical risk exposure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="e.g., AAPL, TSLA, MSFT"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAssessment()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleAssessment()} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Assess
                  </>
                )}
              </Button>
            </div>

            {/* Forecast Toggle */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Switch
                id="forecast-mode"
                checked={forecastEnabled}
                onCheckedChange={setForecastEnabled}
                disabled={!forecastInitialized}
              />
              <Label htmlFor="forecast-mode" className="text-sm">
                Enable Predictive Forecasts
                {!forecastInitialized && (
                  <span className="text-gray-500 ml-2">(Loading...)</span>
                )}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="mb-6 border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      {currentCOGRI !== null && geoData && (
        <div className="space-y-6">
          {/* Current COGRI Score Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{geoData.company}</CardTitle>
                  <CardDescription>
                    {ticker} • {geoData.sector} • Home Country: {geoData.homeCountry}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Current COGRI Score</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {currentCOGRI.toFixed(1)}
                  </div>
                  <Badge className={`mt-2 ${getRiskLevelColor(getRiskLevel(currentCOGRI))}`}>
                    {getRiskLevel(currentCOGRI)}
                  </Badge>
                </div>
                
                {predictiveCOGRI && (
                  <>
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        Predicted Score ({selectedTimeHorizon.toUpperCase()})
                      </div>
                      <div className="text-4xl font-bold text-blue-600">
                        {predictiveCOGRI.predictedScore.toFixed(1)}
                      </div>
                      <Badge className={`mt-2 ${getRiskLevelColor(predictiveCOGRI.riskLevel)}`}>
                        {predictiveCOGRI.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Change</div>
                      <div className={`text-4xl font-bold ${
                        predictiveCOGRI.delta > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {predictiveCOGRI.delta > 0 ? '+' : ''}
                        {predictiveCOGRI.delta.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {predictiveCOGRI.percentageChange > 0 ? '+' : ''}
                        {predictiveCOGRI.percentageChange.toFixed(1)}%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Forecast Controls */}
          {forecastEnabled && forecastInitialized && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forecast Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Horizon Selector */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Time Horizon
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['6m', '1y', '2y', '5y'] as TimeHorizon[]).map((horizon) => (
                        <Button
                          key={horizon}
                          variant={selectedTimeHorizon === horizon ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleTimeHorizonChange(horizon)}
                          disabled={loading}
                        >
                          {horizon.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Scenario Selector */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      <Target className="inline h-4 w-4 mr-1" />
                      Scenario
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['optimistic', 'base', 'pessimistic'] as ScenarioType[]).map((scenario) => (
                        <Button
                          key={scenario}
                          variant={selectedScenario === scenario ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleScenarioChange(scenario)}
                          disabled={loading}
                          className={
                            scenario === 'optimistic' ? 'border-green-300' :
                            scenario === 'pessimistic' ? 'border-red-300' : ''
                          }
                        >
                          {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for detailed information */}
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="current">Current</TabsTrigger>
              {forecastEnabled && (
                <>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                  <TabsTrigger value="timeseries">Time Series</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </>
              )}
              <TabsTrigger value="methodology">Methodology</TabsTrigger>
            </TabsList>

            {/* Current Assessment Tab */}
            <TabsContent value="current" className="mt-6">
              <div className="space-y-6">
                <COGRIVisualization
                  countryExposures={geoData.segments.map((s: any) => ({
                    country: s.geography,
                    exposurePercentage: s.percentage,
                    riskScore: getCountryRisk(s.geography),
                    contribution: (s.percentage / 100) * getCountryRisk(s.geography)
                  }))}
                  finalScore={currentCOGRI}
                  riskLevel={getRiskLevel(currentCOGRI)}
                />
                <GeographicExposureTable
                  countryExposures={geoData.segments.map((s: any) => ({
                    country: s.geography,
                    exposurePercentage: s.percentage,
                    riskScore: getCountryRisk(s.geography),
                    contribution: (s.percentage / 100) * getCountryRisk(s.geography)
                  }))}
                />
                <ChannelBreakdownTable
                  channelBreakdown={geoData.channelBreakdown}
                />
              </div>
            </TabsContent>

            {/* Forecast Tab */}
            {forecastEnabled && predictiveCOGRI && (
              <TabsContent value="forecast" className="mt-6">
                <ForecastCard forecast={predictiveCOGRI} showDetails={true} />
              </TabsContent>
            )}

            {/* Scenarios Tab */}
            {forecastEnabled && scenarioAnalysis && (
              <TabsContent value="scenarios" className="mt-6">
                <ScenarioComparison analysis={scenarioAnalysis} />
              </TabsContent>
            )}

            {/* Time Series Tab */}
            {forecastEnabled && timeSeriesForecast && (
              <TabsContent value="timeseries" className="mt-6">
                <TimeSeriesChart forecast={timeSeriesForecast} />
              </TabsContent>
            )}

            {/* Events Tab */}
            {forecastEnabled && (
              <TabsContent value="events" className="mt-6">
                <EventTimeline 
                  events={getCurrentForecast()?.geopoliticalEvents || []} 
                />
              </TabsContent>
            )}

            {/* Methodology Tab */}
            <TabsContent value="methodology" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>COGRI Methodology</CardTitle>
                  <CardDescription>
                    Understanding current and predictive risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Current COGRI Assessment</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>Four-Channel Model:</strong> Revenue (40%), Supply (35%), Assets (15%), Financial (10%)</li>
                      <li><strong>Country Shock Index:</strong> Risk scores (0-100) based on geopolitical stability</li>
                      <li><strong>Sector Multipliers:</strong> Industry-specific risk adjustments</li>
                      <li><strong>Political Alignment:</strong> Home country relationship factors</li>
                    </ul>
                  </div>

                  {forecastEnabled && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Predictive Forecasting</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li><strong>Cedar Owl 2026 Forecasts:</strong> Expert geopolitical risk projections</li>
                        <li><strong>Time Horizons:</strong> 6 months, 1 year, 2 years, 5 years</li>
                        <li><strong>Scenario Analysis:</strong> Base case, optimistic, and pessimistic scenarios</li>
                        <li><strong>Event Integration:</strong> Probability-weighted geopolitical events</li>
                        <li><strong>Confidence Scoring:</strong> Multi-factor reliability assessment</li>
                      </ul>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Data Sources</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>SEC filings (10-K, 10-Q, 8-K)</li>
                      <li>Company investor relations</li>
                      <li>Cedar Owl geopolitical intelligence</li>
                      <li>Historical risk data and trends</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!loading && !currentCOGRI && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Assess</h3>
            <p className="text-gray-600">
              Enter a company ticker symbol above to begin geopolitical risk assessment
              {forecastEnabled && ' with predictive forecasting'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}