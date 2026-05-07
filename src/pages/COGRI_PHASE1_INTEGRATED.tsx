/**
 * COGRI Assessment Page - WITH PHASE 1 SECTOR MULTIPLIER TRANSPARENCY
 * 
 * This is the Phase 1 integrated version with:
 * - Enhanced sector multiplier validation
 * - Transparency layer with rationale and warnings
 * - SectorMultiplierCard component
 * - Feature flag control
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, TrendingUp, AlertTriangle, Info } from 'lucide-react';

// Phase 1 imports
import { orchestrateCOGRICalculation, isEnhancedResult } from '@/services/cogriCalculationOrchestrator';
import { SectorMultiplierCard } from '@/components/SectorMultiplierCard';
import { isFeatureEnabled, getCalculationMode } from '@/config/featureFlags';

// Existing imports
import { getCompanyGeographicExposure } from '@/services/v34ComprehensiveIntegration';
import { COGRIVisualization } from '@/components/COGRIVisualization';
import { GeographicExposureTable } from '@/components/GeographicExposureTable';
import { ChannelBreakdownTable } from '@/components/ChannelBreakdownTable';
import { COGRIPDFExport } from '@/components/COGRIPDFExport';

export default function COGRI() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Load calculation mode info
  const calculationMode = getCalculationMode();

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
    setCalculationResult(null);

    try {
      console.log(`[COGRI Phase 1] Starting assessment for ${targetTicker}`);
      
      // Get geographic exposure data
      const data = await getCompanyGeographicExposure(targetTicker);
      setGeoData(data);

      console.log(`[COGRI Phase 1] Geographic data retrieved, calculating COGRI...`);

      // Phase 1: Use orchestrator for calculation
      const result = orchestrateCOGRICalculation({
        segments: data.segments,
        channelBreakdown: data.channelBreakdown,
        homeCountry: data.homeCountry,
        sector: data.sector,
        sectorMultiplier: data.sectorMultiplier || 1.0
      });

      setCalculationResult(result);

      // Log Phase 1 status
      if (isEnhancedResult(result)) {
        console.log(`[COGRI Phase 1] ✅ Enhanced calculation complete`);
        console.log(`[COGRI Phase 1] Sector: ${data.sector}, Multiplier: ${result.sectorMultiplierDetails.value}`);
        console.log(`[COGRI Phase 1] Confidence: ${(result.sectorMultiplierDetails.confidence * 100).toFixed(1)}%`);
        console.log(`[COGRI Phase 1] Warnings: ${result.sectorMultiplierDetails.warnings.length}`);
      } else {
        console.log(`[COGRI Phase 1] Legacy calculation used`);
      }

      // Update URL
      setSearchParams({ ticker: targetTicker });

    } catch (err) {
      console.error('[COGRI Phase 1] Assessment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assess company');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">COGRI Assessment</h1>
        <p className="text-gray-600">
          Corporate Geopolitical Risk Index - Comprehensive four-channel exposure analysis
        </p>
        
        {/* Phase 1 Badge */}
        {isFeatureEnabled('enableSectorMultiplierTransparency') && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              ✨ Phase 1: Sector Multiplier Transparency Enabled
            </Badge>
          </div>
        )}
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Company Ticker</CardTitle>
          <CardDescription>
            Assess geopolitical risk exposure for any publicly traded company
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          {/* Calculation Mode Info */}
          <div className="mt-4 text-sm text-gray-600">
            <Info className="inline h-4 w-4 mr-1" />
            <strong>Mode:</strong> {calculationMode.description}
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
      {calculationResult && geoData && (
        <div className="space-y-6">
          {/* Phase 1: Validation Warnings Banner */}
          {isEnhancedResult(calculationResult) && calculationResult.sectorMultiplierDetails.warnings.length > 0 && isFeatureEnabled('showValidationWarnings') && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">
                  ⚠️ Sector Multiplier Validation Warnings ({calculationResult.sectorMultiplierDetails.warnings.length})
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {calculationResult.sectorMultiplierDetails.warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* COGRI Score Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{geoData.company}</CardTitle>
                  <CardDescription>
                    {ticker} • {geoData.sector} • Home Country: {geoData.homeCountry}
                  </CardDescription>
                </div>
                <COGRIPDFExport
                  ticker={ticker}
                  companyName={geoData.company}
                  cogriScore={calculationResult.finalScore}
                  riskLevel={calculationResult.riskLevel}
                  sector={geoData.sector}
                  countryExposures={calculationResult.countryExposures}
                  geoData={geoData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">COGRI Score</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {calculationResult.finalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Raw: {calculationResult.rawScore.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Risk Level</div>
                  <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(calculationResult.riskLevel)}`}>
                    {calculationResult.riskLevel}
                  </Badge>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Sector Multiplier</div>
                  <div className="text-4xl font-bold text-purple-600">
                    {calculationResult.sectorMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {geoData.sector}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 1: Sector Multiplier Card */}
          {isEnhancedResult(calculationResult) && isFeatureEnabled('showSectorMultiplierCard') && (
            <SectorMultiplierCard
              sectorMultiplierDetails={calculationResult.sectorMultiplierDetails}
              sector={geoData.sector}
              rawScore={calculationResult.rawScore}
              finalScore={calculationResult.finalScore}
            />
          )}

          {/* Tabs for detailed information */}
          <Tabs defaultValue="visualization" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="exposure">Geographic Exposure</TabsTrigger>
              <TabsTrigger value="channels">Channel Breakdown</TabsTrigger>
              <TabsTrigger value="methodology">Methodology</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="mt-6">
              <COGRIVisualization
                countryExposures={calculationResult.countryExposures}
                finalScore={calculationResult.finalScore}
                riskLevel={calculationResult.riskLevel}
              />
            </TabsContent>

            <TabsContent value="exposure" className="mt-6">
              <GeographicExposureTable
                countryExposures={calculationResult.countryExposures}
              />
            </TabsContent>

            <TabsContent value="channels" className="mt-6">
              <ChannelBreakdownTable
                channelBreakdown={geoData.channelBreakdown}
              />
            </TabsContent>

            <TabsContent value="methodology" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>COGRI Methodology</CardTitle>
                  <CardDescription>
                    Understanding the Corporate Geopolitical Risk Index calculation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Four-Channel Exposure Model</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>Revenue & Demand (40%):</strong> Geographic distribution of sales and customer base</li>
                      <li><strong>Supply & Production (35%):</strong> Manufacturing locations and supplier networks</li>
                      <li><strong>Physical Assets (15%):</strong> Property, facilities, and infrastructure locations</li>
                      <li><strong>Financial & Operations (10%):</strong> Banking relationships and operational dependencies</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Country Shock Index (CSI)</h3>
                    <p className="text-sm text-gray-700">
                      Each country is assigned a risk score (0-100) based on geopolitical stability, 
                      regulatory environment, and historical volatility.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Political Alignment Amplification</h3>
                    <p className="text-sm text-gray-700">
                      Risk is amplified for countries with poor political alignment with the company's 
                      home country, reflecting potential sanctions or trade restrictions.
                    </p>
                  </div>

                  {isEnhancedResult(calculationResult) && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Phase 1: Sector Risk Adjustment</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        The final score is adjusted by a sector-specific multiplier that reflects 
                        industry-specific geopolitical vulnerabilities:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li><strong>Validation:</strong> Multiplier appropriateness is validated against company exposure patterns</li>
                        <li><strong>Transparency:</strong> Full rationale, risk factors, and historical context provided</li>
                        <li><strong>Warnings:</strong> Context-aware alerts for edge cases and unusual scenarios</li>
                        <li><strong>Confidence Scoring:</strong> Each multiplier has a confidence score based on data quality</li>
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Final Score Calculation</h3>
                    <p className="text-sm text-gray-700">
                      COGRI = Σ(Exposure_Weight × CSI × Political_Alignment) × Sector_Multiplier
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!loading && !calculationResult && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Assess</h3>
            <p className="text-gray-600">
              Enter a company ticker symbol above to begin geopolitical risk assessment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
