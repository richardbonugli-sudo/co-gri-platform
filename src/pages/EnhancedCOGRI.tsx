import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, AlertCircle, ArrowLeft, Download, TrendingUp, Globe, BarChart3, FileText, Bug } from 'lucide-react';
import { Link } from 'wouter';
import { getCompanyGeographicExposureV4 as getCompanyGeographicExposure } from '@/services/v34ComprehensiveIntegrationV4';
import { searchCompanies } from '@/utils/companyDatabase';
import { orchestrateCOGRICalculation, type COGRICalculationInput } from '@/services/cogriCalculationOrchestrator';
import RiskHeatMap from '@/components/RiskHeatMap';
import GeopoliticalTrends from '@/components/GeopoliticalTrends';
import { V4DebugDownload } from '@/components/V4DebugDownload';
import { calculateV4ExposuresWithDebug } from '@/services/v4Integration';
import { generateDebugBundlePDF, generateDebugBundleJSON, generateDebugBundleBoth } from '@/services/v4/pdfGenerator';
import type { DebugBundle } from '@/services/v4/types/debugBundle.types';

interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

interface CountryRisk {
  country: string;
  riskLevel: number;
  exposureWeight: number;
  contribution: number;
}

interface AssessmentResult {
  company: string;
  symbol: string;
  sector: string;
  geopoliticalRiskScore: number;
  riskLevel: string;
  countryRisks: CountryRisk[];
  rawScore: number;
  sectorMultiplier: number;
  homeCountry?: string;
}

export default function EnhancedCOGRI() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [debugBundles, setDebugBundles] = useState<{
    revenue: DebugBundle;
    supply: DebugBundle;
    assets: DebugBundle;
    financial: DebugBundle;
  } | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    if (ticker && ticker.length >= 1) {
      const results = searchCompanies(ticker);
      setSearchResults(results?.slice(0, 10) || []);
      setShowSearchResults(results && results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [ticker]);

  const handleSearch = async (searchTicker?: string) => {
    const tickerToSearch = searchTicker || ticker;
    if (!tickerToSearch || !tickerToSearch.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setDebugBundles(null);
    setShowSearchResults(false);

    try {
      console.log(`[Enhanced COGRI] Starting assessment for ${tickerToSearch.toUpperCase()}`);
      const geoData = await getCompanyGeographicExposure(tickerToSearch.toUpperCase());
      
      if (!geoData || !geoData.segments || geoData.segments.length === 0) {
        setError(`No geographic exposure data available for ${tickerToSearch.toUpperCase()}. Please try another ticker.`);
        setLoading(false);
        return;
      }

      console.log(`[Enhanced COGRI] Using V4 orchestrator for ${tickerToSearch.toUpperCase()}`);
      
      // Use the V4 orchestrator to ensure identical results with Standard COGRI
      const calculationInput: COGRICalculationInput = {
        segments: geoData.segments,
        channelBreakdown: geoData.channelBreakdown,
        homeCountry: geoData.homeCountry,
        sector: geoData.sector || 'Unknown',
        sectorMultiplier: geoData.sectorMultiplier || 1.0
      };
      
      const calculationResult = orchestrateCOGRICalculation(calculationInput);
      
      // Map calculation result to CountryRisk format for visualizations
      const countryRisks: CountryRisk[] = calculationResult.countryExposures.map(exp => ({
        country: exp.country,
        riskLevel: exp.countryShockIndex,
        exposureWeight: exp.exposureWeight,
        contribution: exp.contribution
      }));

      setResult({
        company: geoData.company || tickerToSearch.toUpperCase(),
        symbol: tickerToSearch.toUpperCase(),
        sector: geoData.sector || 'Unknown',
        geopoliticalRiskScore: calculationResult.finalScore,
        riskLevel: calculationResult.riskLevel,
        countryRisks,
        rawScore: calculationResult.rawScore,
        sectorMultiplier: calculationResult.sectorMultiplier,
        homeCountry: geoData.homeCountry
      });

      // Generate V4 debug bundles in the background
      setDebugLoading(true);
      try {
        console.log(`[Enhanced COGRI] ========================================`);
        console.log(`[Enhanced COGRI] Generating V4 debug bundles for ${tickerToSearch.toUpperCase()}`);
        console.log(`[Enhanced COGRI] ========================================`);
        
        const v4Result = await calculateV4ExposuresWithDebug(tickerToSearch.toUpperCase());
        
        console.log(`[Enhanced COGRI] 🔍 CRITICAL: V4 result received:`, {
          hasExposures: !!v4Result.exposures,
          hasDebugBundles: !!v4Result.debugBundles,
          debugBundlesType: typeof v4Result.debugBundles,
          debugBundlesKeys: v4Result.debugBundles ? Object.keys(v4Result.debugBundles) : [],
          debugBundlesIsNull: v4Result.debugBundles === null,
          debugBundlesIsUndefined: v4Result.debugBundles === undefined
        });
        
        if (v4Result.debugBundles) {
          console.log(`[Enhanced COGRI] 🔍 CRITICAL: Debug bundles structure BEFORE setState:`, {
            revenue: !!v4Result.debugBundles.revenue,
            revenueType: typeof v4Result.debugBundles.revenue,
            supply: !!v4Result.debugBundles.supply,
            supplyType: typeof v4Result.debugBundles.supply,
            assets: !!v4Result.debugBundles.assets,
            assetsType: typeof v4Result.debugBundles.assets,
            financial: !!v4Result.debugBundles.financial,
            financialType: typeof v4Result.debugBundles.financial
          });
          
          // Check if any bundle is undefined
          const hasUndefinedBundles = 
            !v4Result.debugBundles.revenue || 
            !v4Result.debugBundles.supply || 
            !v4Result.debugBundles.assets || 
            !v4Result.debugBundles.financial;
          
          if (hasUndefinedBundles) {
            console.error(`[Enhanced COGRI] ❌ CRITICAL: Some debug bundles are undefined!`, {
              revenue: !!v4Result.debugBundles.revenue,
              supply: !!v4Result.debugBundles.supply,
              assets: !!v4Result.debugBundles.assets,
              financial: !!v4Result.debugBundles.financial
            });
          }
          
          console.log(`[Enhanced COGRI] ✅ Setting debug bundles in state...`);
          setDebugBundles(v4Result.debugBundles);
          console.log(`[Enhanced COGRI] ✅ setDebugBundles() called with:`, v4Result.debugBundles);
        } else {
          console.error(`[Enhanced COGRI] ❌ CRITICAL: v4Result.debugBundles is falsy!`, {
            value: v4Result.debugBundles,
            type: typeof v4Result.debugBundles,
            isNull: v4Result.debugBundles === null,
            isUndefined: v4Result.debugBundles === undefined
          });
        }
      } catch (debugError) {
        console.error('[Enhanced COGRI] ❌ Debug bundle generation EXCEPTION:', debugError);
        console.error('[Enhanced COGRI] Error details:', {
          message: debugError instanceof Error ? debugError.message : String(debugError),
          stack: debugError instanceof Error ? debugError.stack : 'No stack trace'
        });
        // Don't fail the whole assessment if debug generation fails
      } finally {
        setDebugLoading(false);
      }

      console.log(`[Enhanced COGRI] Assessment completed for ${tickerToSearch.toUpperCase()}: Score ${calculationResult.finalScore} (${calculationResult.riskLevel})`);
      console.log(`[Enhanced COGRI] ✅ Using identical V4 methodology as Standard COGRI`);

    } catch (err) {
      console.error('[Enhanced COGRI] Assessment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugDownload = async (format: 'pdf' | 'json' | 'both') => {
    console.log(`[Debug Download] ========================================`);
    console.log(`[Debug Download] handleDebugDownload called with format: ${format}`);
    console.log(`[Debug Download] debugBundles state:`, {
      isNull: debugBundles === null,
      isUndefined: debugBundles === undefined,
      type: typeof debugBundles,
      keys: debugBundles ? Object.keys(debugBundles) : []
    });
    console.log(`[Debug Download] result state:`, {
      isNull: result === null,
      symbol: result?.symbol,
      company: result?.company
    });
    
    if (!debugBundles || !result) {
      console.error('[Debug Download] ❌ Missing required data:', {
        hasDebugBundles: !!debugBundles,
        hasResult: !!result
      });
      return;
    }

    try {
      console.log(`[Debug Download] Generating ${format} for ${result.symbol}`);
      
      if (format === 'pdf') {
        await generateDebugBundlePDF(result.symbol, result.company, debugBundles);
      } else if (format === 'json') {
        await generateDebugBundleJSON(result.symbol, debugBundles);
      } else {
        await generateDebugBundleBoth(result.symbol, result.company, debugBundles);
      }
      
      console.log(`[Debug Download] ✅ ${format.toUpperCase()} generation completed`);
    } catch (error) {
      console.error('[Debug Download] ❌ Error:', error);
      throw error;
    }
  };

  const handleCompanySelect = (company: CompanySearchResult) => {
    setShowSearchResults(false);
    setTicker(company.symbol);
    
    setTimeout(() => {
      handleSearch(company.symbol);
    }, 0);
  };

  const getRiskColor = (level: string) => {
    if (level.includes('High')) return 'bg-orange-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    if (level.includes('Low')) return 'bg-green-600';
    return 'bg-red-600';
  };

  // CRITICAL: Log debugBundles state whenever it changes
  useEffect(() => {
    console.log(`[Enhanced COGRI] 🔍 RENDER: debugBundles state changed:`, {
      isNull: debugBundles === null,
      isUndefined: debugBundles === undefined,
      type: typeof debugBundles,
      isTruthy: !!debugBundles,
      keys: debugBundles ? Object.keys(debugBundles) : [],
      hasAllChannels: debugBundles ? 
        !!(debugBundles.revenue && debugBundles.supply && debugBundles.assets && debugBundles.financial) : 
        false,
      channelDetails: debugBundles ? {
        revenue: !!debugBundles.revenue,
        supply: !!debugBundles.supply,
        assets: !!debugBundles.assets,
        financial: !!debugBundles.financial
      } : null
    });
  }, [debugBundles]);

  // CRITICAL: Log BEFORE rendering to see actual state value
  console.log(`[Enhanced COGRI] 🔍 RENDER CHECK: About to render debug section`, {
    debugLoading,
    debugBundlesIsNull: debugBundles === null,
    debugBundlesIsTruthy: !!debugBundles,
    willShowDownload: !debugLoading && !!debugBundles,
    willShowError: !debugLoading && !debugBundles
  });

  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      {/* Header */}
      <header className="bg-[#0d5f5f] py-4 px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4d4d] gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-semibold">Back to Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-[#0d5f5f]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Enhanced CO-GRI Assessment</h1>
              <p className="text-sm text-gray-200">Advanced geopolitical risk analysis with interactive visualizations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search Section */}
        <Card className="max-w-4xl mx-auto mb-8 bg-[#0f1e2e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Enhanced Risk Assessment</CardTitle>
            <CardDescription className="text-gray-200">
              Comprehensive geopolitical risk analysis with heat maps, trends, and advanced visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter ticker (e.g., AAPL, MSFT, TSLA)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-[#1a2332] border-gray-700 text-white placeholder-gray-400 pr-10"
                    disabled={loading}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <Button 
                  onClick={() => handleSearch()}
                  disabled={loading || !ticker || !ticker.trim()}
                  className="w-full bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white mt-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Run Enhanced Assessment'
                  )}
                </Button>
                
                {showSearchResults && !loading && searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a2332] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((company, index) => (
                      <button
                        key={index}
                        onClick={() => handleCompanySelect(company)}
                        className="w-full text-left px-4 py-2 hover:bg-[#0d5f5f] transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-semibold">{company.symbol}</div>
                            <div className="text-gray-200 text-sm">{company.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-200 text-xs">{company.exchange}</div>
                            <div className="text-[#0d5f5f] text-xs">{company.sector}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="max-w-4xl mx-auto mb-8 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-6">
            {/* Score Summary */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="inline-block">
                    <div className={`${getRiskColor(result.riskLevel)} text-white px-6 py-3 rounded-lg mb-4`}>
                      <div className="text-5xl font-bold mb-2">{result.geopoliticalRiskScore}</div>
                      <div className="text-lg font-semibold">{result.riskLevel}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Company</div>
                      <div className="text-white font-semibold">{result.company}</div>
                    </div>
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Sector</div>
                      <div className="text-white font-semibold">{result.sector}</div>
                    </div>
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Raw Score</div>
                      <div className="text-white font-semibold">{result.rawScore.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Multiplier</div>
                      <div className="text-white font-semibold">{result.sectorMultiplier.toFixed(2)}x</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Debug Report Button - Always Visible */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bug className="h-5 w-5 text-blue-400" />
                      Debug Report
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Download comprehensive diagnostic information for {result.symbol}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {debugLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <span className="ml-3 text-gray-200">Generating debug bundles...</span>
                  </div>
                ) : debugBundles ? (
                  <V4DebugDownload
                    ticker={result.symbol}
                    companyName={result.company}
                    onDownload={handleDebugDownload}
                    isLoading={loading}
                  />
                ) : (
                  <Alert className="bg-yellow-900/20 border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200">
                      Debug bundles are not available for this assessment. This may happen if the company data is incomplete or if there was an error during bundle generation.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Visualizations */}
            <Tabs defaultValue="heatmap" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto">
                <TabsTrigger value="heatmap">Risk Heat Map</TabsTrigger>
                <TabsTrigger value="trends">Trends & Analysis</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="heatmap" className="space-y-4">
                <RiskHeatMap 
                  countryRisks={result.countryRisks}
                  title={`${result.company} - Global Risk Heat Map`}
                />
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <GeopoliticalTrends
                  companySymbol={result.symbol}
                  currentScore={result.geopoliticalRiskScore}
                  sector={result.sector}
                />
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Detailed Country Breakdown</CardTitle>
                    <CardDescription className="text-gray-200">
                      Individual country risk contributions and exposure weights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-200 font-semibold">Country</th>
                            <th className="text-right py-3 px-4 text-gray-200 font-semibold">Risk Level</th>
                            <th className="text-right py-3 px-4 text-gray-200 font-semibold">Exposure %</th>
                            <th className="text-right py-3 px-4 text-gray-200 font-semibold">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.countryRisks
                            .sort((a, b) => b.contribution - a.contribution)
                            .map((risk, index) => (
                              <tr key={index} className="border-b border-gray-700 hover:bg-[#1a2332]">
                                <td className="py-3 px-4 text-white">{risk.country}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">
                                  {risk.riskLevel.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right text-white font-mono">
                                  {(risk.exposureWeight * 100).toFixed(2)}%
                                </td>
                                <td className="py-3 px-4 text-right text-white font-mono">
                                  {risk.contribution.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Link href="/cogri">
                <Button variant="outline" className="border-[#0d5f5f] text-[#0d5f5f] hover:bg-[#0d5f5f]/10">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Full Assessment
                </Button>
              </Link>
              <Link href="/cogri-portfolio">
                <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Portfolio
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}