import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { getCompanyGeographicExposure } from '@/services/v34ComprehensiveIntegration';
import { getCountryShockIndex } from '@/data/globalCountries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { searchCompanies } from '@/utils/companyDatabase';
import { generateFallbackSummary } from '@/utils/fallbackSummaryGenerator';
import { getCountryInsights } from '@/utils/geopoliticalInsights';
import { calculatePoliticalAlignment } from '@/services/politicalAlignmentService';

interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
  status?: EvidenceStatus;
  channel?: string;
  preNormalizedWeight?: number;
  channelWeights?: {
    revenue: number;
    operations: number;
    supply: number;
    assets: number;
    market: number;
  };
  politicalAlignment?: {
    alignmentFactor: number;
    relationship: string;
    source: string;
  };
  fallbackType?: FallbackType;
}

interface CalculationStep {
  stepNumber: string;
  title: string;
  formula: string;
  values: Record<string, string | number>;
  result: string;
  detailedCalculations?: string[];
  substeps?: CalculationStep[];
}

interface DataSource {
  name: string;
  description: string;
  url?: string;
}

interface KeyRisk {
  country: string;
  description: string;
  detail: string;
  elaboration: string;
}

interface Recommendation {
  category: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface ExposureComponents {
  revenue?: number;
  operations?: number;
  supply?: number;
  assets?: number;
  market?: number;
}

type EvidenceStatus = 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
type FallbackType = 'SSF' | 'RF' | 'GF' | 'none';
type EvidenceLevel = 'direct_evidence' | 'high_confidence' | 'medium_confidence' | 'sector_intelligence' | 'estimate';

// Phase 1 - Evidence Tracking Types
type EvidenceType = 'Direct' | 'Structured' | 'Residual';

interface CountryEvidence {
  country: string;
  evidenceType: EvidenceType;
  evidenceSource: string;
  isLocked: boolean;
  amount?: number;
  percentage?: number;
  rationale?: string;
}

interface EvidenceTracking {
  directEvidence: CountryEvidence[];
  structuredEvidence: CountryEvidence[];
  residualBucket: CountryEvidence[];
}

// NEW: Phase 3 - Sub-Bucket Distribution Types
interface SubBucketDistribution {
  country: string;
  amount: number;
  percentage: number;
  percentageOfBucket: number;
  rationale: string;
  isCarveOut: boolean;
}

interface StructuredBucket {
  bucketName: string;
  countries: string[];
  totalAmount: number;
  totalPercentage: number;
  narrativeDefinition: string;
  subBucketDistribution?: SubBucketDistribution[];
}

interface FallbackStrategy {
  directEvidence: {
    countries: string[];
    totalAmount: number;
    totalPercentage: number;
    isLocked: true;
    details: Array<{
      country: string;
      amount: number;
      percentage: number;
      source: string;
    }>;
  };
  structuredEvidence: {
    buckets: StructuredBucket[];
    totalAmount: number;
    totalPercentage: number;
    isLocked: true;
  };
  residualBucket: {
    totalAmount: number;
    totalPercentage: number;
    fallbackType: 'RF' | 'GF';
    boundedCountrySet?: string[];
    allocatedCountries: Array<{
      country: string;
      amount: number;
      percentage: number;
      percentageOfResidual: number;
      rationale: string;
    }>;
    isLocked: false;
  };
}

interface ChannelData {
  weight: number;
  status: EvidenceStatus;
  source?: string;
  fallbackType?: FallbackType;
  evidenceLevel?: EvidenceLevel;
  evidenceScore?: number;
  confidence?: number;
  evidenceType?: EvidenceType;
  isLocked?: boolean;
  fallbackStrategy?: FallbackStrategy;  // NEW: Phase 3
}

interface ChannelBreakdown {
  [country: string]: {
    revenue?: ChannelData;
    operations?: ChannelData;
    supply?: ChannelData;
    assets?: ChannelData;
    market?: ChannelData;
    blended: number;
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
    evidenceTracking?: EvidenceTracking;
  };
}

interface AssessmentResult {
  company: string;
  symbol: string;
  sector: string;
  sectorMultiplier: number;
  geopoliticalRiskScore: number;
  riskLevel: string;
  countryExposures: CountryExposure[];
  calculationSteps: CalculationStep[];
  dataSources: DataSource[];
  keyRisks: KeyRisk[];
  recommendations: Recommendation[];
  dataSource?: string;
  rawScore: number;
  hasVerifiedData: boolean;
  geoDataSource: string;
  hasDetailedComponents?: boolean;
  sectorClassificationConfidence?: number;
  sectorClassificationSources?: string[];
  homeCountry?: string;
  channelBreakdown?: ChannelBreakdown;
  exposureCoefficients?: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
    market: number;
  };
  adrResolution?: {
    isADR: boolean;
    confidence: 'high' | 'medium' | 'low';
    source: string;
  };
}

interface GeographicSegment {
  country: string;
  revenuePercentage?: number;
  exposureComponents?: ExposureComponents;
}

interface AutoTableDoc extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

const SUPPORTED_COUNTRIES = [
  {
    name: 'United States',
    exchanges: 'NASDAQ, NYSE',
    tickerSuffix: '',
    color: 'bg-cyan-500'
  },
  {
    name: 'Canada',
    exchanges: 'TSX, TSX Venture',
    tickerSuffix: '.TO, .V',
    color: 'bg-blue-500'
  },
  {
    name: 'United Kingdom',
    exchanges: 'LSE',
    tickerSuffix: '.L, .LON',
    color: 'bg-green-500'
  },
  {
    name: 'Brazil',
    exchanges: 'B3',
    tickerSuffix: '.SA',
    color: 'bg-yellow-500'
  },
  {
    name: 'Hong Kong',
    exchanges: 'HKEX',
    tickerSuffix: '.HK',
    color: 'bg-red-500'
  },
  {
    name: 'Singapore',
    exchanges: 'SGX',
    tickerSuffix: '.SI',
    color: 'bg-purple-500'
  },
  {
    name: 'Taiwan',
    exchanges: 'TWSE',
    tickerSuffix: '.TW, .TWO',
    color: 'bg-indigo-500'
  },
  {
    name: 'South Africa',
    exchanges: 'JSE',
    tickerSuffix: '.JO',
    color: 'bg-pink-500'
  }
];

const getFallbackTypeBadgeColor = (fallbackType?: FallbackType): string => {
  switch (fallbackType) {
    case 'SSF':
      return 'bg-blue-600/20 text-blue-300 border-blue-500';
    case 'RF':
      return 'bg-yellow-600/20 text-yellow-300 border-yellow-500';
    case 'GF':
      return 'bg-red-600/20 text-red-300 border-red-500';
    case 'none':
      return 'bg-green-600/20 text-green-300 border-green-500';
    default:
      return 'bg-gray-600/20 text-gray-300 border-gray-500';
  }
};

const getFallbackTypeIcon = (fallbackType?: FallbackType): string => {
  switch (fallbackType) {
    case 'SSF':
      return '🔵';
    case 'RF':
      return '🟡';
    case 'GF':
      return '🔴';
    case 'none':
      return '✅';
    default:
      return '❓';
  }
};

const getEvidenceTypeBadgeColor = (evidenceType: EvidenceType): string => {
  switch (evidenceType) {
    case 'Direct':
      return 'bg-green-600/20 text-green-300 border-green-500';
    case 'Structured':
      return 'bg-blue-600/20 text-blue-300 border-blue-500';
    case 'Residual':
      return 'bg-yellow-600/20 text-yellow-300 border-yellow-500';
    default:
      return 'bg-gray-600/20 text-gray-300 border-gray-500';
  }
};

const getEvidenceTypeIcon = (evidenceType: EvidenceType): string => {
  switch (evidenceType) {
    case 'Direct':
      return '🟢';
    case 'Structured':
      return '🔵';
    case 'Residual':
      return '🟡';
    default:
      return '❓';
  }
};

const getStatusIcon = (status: EvidenceStatus) => {
  switch (status) {
    case 'evidence': return '✅';
    case 'high_confidence_estimate': return '⭐';
    case 'known_zero': return '🔒';
    case 'fallback': return '📊';
    default: return '❓';
  }
};

const getAlignmentIcon = (relationship: string) => {
  switch (relationship) {
    case 'allied': return '🤝';
    case 'friendly': return '😊';
    case 'neutral': return '😐';
    case 'competitive': return '⚔️';
    case 'adversarial': return '⚠️';
    case 'same': return '🏠';
    default: return '❓';
  }
};

const getRiskColor = (level: string) => {
  if (level.includes('High')) return 'bg-orange-600';
  if (level.includes('Moderate')) return 'bg-yellow-600';
  if (level.includes('Low')) return 'bg-green-600';
  return 'bg-red-600';
};

const getContributionColor = (contribution: number) => {
  if (contribution >= 10) return '#ef4444';
  if (contribution >= 5) return '#f97316';
  if (contribution >= 2) return '#eab308';
  return '#22c55e';
};

export default function COGRI() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
    setShowSearchResults(false);

    try {
      console.log(`[v3.4 COGRI Phase 3] Starting assessment for ${tickerToSearch.toUpperCase()}`);
      const geoData = await getCompanyGeographicExposure(tickerToSearch.toUpperCase(), undefined, undefined, undefined);
      
      if (!geoData || !geoData.segments || geoData.segments.length === 0) {
        setError(`No geographic exposure data available for ${tickerToSearch.toUpperCase()}. Please try another ticker.`);
        setLoading(false);
        return;
      }

      console.log(`[v3.4 COGRI Phase 3] Geographic data retrieved with sub-bucket distribution`);

      const exposureCoefficients = {
        revenue: 0.40,
        supply: 0.35,
        assets: 0.15,
        financial: 0.10,
        market: 0.00
      };

      const countryExposuresPreNorm: CountryExposure[] = [];
      
      for (const segment of geoData.segments) {
        const country = segment.country;
        const csi = getCountryShockIndex(country);
        
        const channelData = geoData.channelBreakdown?.[country];
        
        if (channelData) {
          const blendedWeight = channelData.blended;
          const fallbackType = channelData.revenue?.fallbackType || 'none';
          const alignmentFactor = channelData.politicalAlignment?.alignmentFactor ?? 1.0;
          const contribution = blendedWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
          
          countryExposuresPreNorm.push({
            country,
            exposureWeight: blendedWeight,
            preNormalizedWeight: blendedWeight,
            countryShockIndex: csi,
            contribution: contribution,
            status: channelData.revenue?.status || 'fallback',
            fallbackType: fallbackType,
            channelWeights: {
              revenue: channelData.revenue?.weight || 0,
              operations: channelData.operations?.weight || 0,
              supply: channelData.supply?.weight || 0,
              assets: channelData.assets?.weight || 0,
              market: 0
            },
            politicalAlignment: channelData.politicalAlignment
          });
        } else {
          const exposureWeight = (segment.revenuePercentage || 0) / 100;
          const homeCountry = geoData.homeCountry || 'United States';
          const alignment = calculatePoliticalAlignment(homeCountry, country);
          const alignmentFactor = alignment.alignmentFactor;
          const contribution = exposureWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
          
          countryExposuresPreNorm.push({
            country,
            exposureWeight: exposureWeight,
            preNormalizedWeight: exposureWeight,
            countryShockIndex: csi,
            contribution: contribution,
            status: 'fallback',
            fallbackType: 'GF',
            politicalAlignment: {
              alignmentFactor: alignment.alignmentFactor,
              relationship: alignment.relationship,
              source: alignment.source
            }
          });
        }
      }

      const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= 0.005);
      const totalExposurePreNorm = filteredExposures.reduce((sum, exp) => sum + exp.exposureWeight, 0);
      
      const countryExposures: CountryExposure[] = filteredExposures.map(exp => {
        const normalizedWeight = totalExposurePreNorm > 0 ? exp.exposureWeight / totalExposurePreNorm : 0;
        const alignmentFactor = exp.politicalAlignment?.alignmentFactor ?? 1.0;
        const normalizedContribution = normalizedWeight * exp.countryShockIndex * (1.0 + 0.5 * (1.0 - alignmentFactor));
        
        return {
          ...exp,
          exposureWeight: normalizedWeight,
          contribution: normalizedContribution
        };
      });

      const rawScore = countryExposures.reduce((sum, exp) => sum + exp.contribution, 0);
      const sectorMultiplier = geoData.sectorMultiplier || 1.0;
      const finalScore = Math.round(rawScore * sectorMultiplier * 10) / 10;

      let riskLevel = 'Low Risk';
      if (finalScore >= 60) riskLevel = 'Very High Risk';
      else if (finalScore >= 45) riskLevel = 'High Risk';
      else if (finalScore >= 30) riskLevel = 'Moderate Risk';

      const topRisks = [...countryExposures]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 5);

      const keyRisks: KeyRisk[] = topRisks.map(exp => ({
        country: exp.country,
        description: `${exp.country} Geopolitical Risk Exposure`,
        detail: `Blended exposure of ${(exp.exposureWeight * 100).toFixed(1)}% contributes ${exp.contribution.toFixed(1)} points`,
        elaboration: `Risk analysis for ${exp.country}`
      }));

      const recommendations: Recommendation[] = [];
      
      if (finalScore >= 45) {
        recommendations.push({
          category: 'Diversification',
          action: 'Consider geographic diversification',
          priority: 'High'
        });
      }

      setResult({
        company: geoData.company || tickerToSearch.toUpperCase(),
        symbol: tickerToSearch.toUpperCase(),
        sector: geoData.sector || 'Unknown',
        sectorMultiplier: sectorMultiplier,
        geopoliticalRiskScore: finalScore,
        riskLevel: riskLevel,
        countryExposures: countryExposures,
        calculationSteps: [],
        dataSources: [],
        keyRisks: keyRisks,
        recommendations: recommendations,
        rawScore: rawScore,
        hasVerifiedData: geoData.hasVerifiedData || false,
        geoDataSource: geoData.dataSource || 'v3.4 Phase 3',
        homeCountry: geoData.homeCountry,
        channelBreakdown: geoData.channelBreakdown,
        exposureCoefficients: exposureCoefficients,
        adrResolution: geoData.adrResolution
      });

    } catch (err) {
      console.error('[v3.4 COGRI Phase 3] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: CompanySearchResult) => {
    setShowSearchResults(false);
    setTicker(company.symbol);
    setTimeout(() => handleSearch(company.symbol), 0);
  };

  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      <header className="bg-[#0d5f5f] py-4 px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <a href="/" className="inline-block">
            <Button variant="ghost" className="text-white hover:bg-[#0a4d4d] gap-2">
              <span className="font-semibold">Back to Home</span>
            </Button>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            CedarOwl Geopolitical Risk Index
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            v3.4 Phase 3: Sub-Bucket Distribution
          </p>
        </div>

        <Card className="max-w-4xl mx-auto mb-8 bg-[#0f1e2e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Assess a Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter ticker (e.g., AAPL, MSFT, TSLA)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-[#1a2332] border-gray-700 text-white"
                  disabled={loading}
                />
                <Button 
                  onClick={() => handleSearch()}
                  disabled={loading || !ticker}
                  className="w-full bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white mt-3"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Run Assessment'}
                </Button>
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

        {result && result.channelBreakdown && (
          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`${getRiskColor(result.riskLevel)} text-white px-6 py-3 rounded-lg mb-4 inline-block`}>
                    <div className="text-5xl font-bold mb-2">{result.geopoliticalRiskScore}</div>
                    <div className="text-lg font-semibold">{result.riskLevel}</div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <p className="text-purple-300 text-sm font-semibold">
                      🆕 v3.4 Phase 3: Sub-Bucket Distribution Enabled
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">🆕 Phase 1: Evidence Tracking</CardTitle>
                <CardDescription className="text-gray-200">
                  Direct, Structured, and Residual Evidence Classification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(result.channelBreakdown)
                    .filter(([_, data]) => data.evidenceTracking)
                    .sort(([_, a], [__, b]) => b.blended - a.blended)
                    .slice(0, 10)
                    .map(([country, data]) => {
                      const tracking = data.evidenceTracking!;
                      const totalDirect = tracking.directEvidence.length;
                      const totalStructured = tracking.structuredEvidence.length;
                      const totalResidual = tracking.residualBucket.length;
                      const totalEvidence = totalDirect + totalStructured + totalResidual;
                      
                      return (
                        <div key={country} className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                          <h4 className="text-white font-bold text-lg mb-3">{country}</h4>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-900/20 border border-green-700 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🟢</span>
                                <span className="text-green-300 font-semibold">Direct</span>
                              </div>
                              <div className="text-white text-2xl font-bold">{totalDirect}</div>
                              <div className="text-green-200 text-xs mt-1">
                                {totalEvidence > 0 ? `${((totalDirect / totalEvidence) * 100).toFixed(0)}%` : '0%'}
                              </div>
                            </div>
                            
                            <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🔵</span>
                                <span className="text-blue-300 font-semibold">Structured</span>
                              </div>
                              <div className="text-white text-2xl font-bold">{totalStructured}</div>
                              <div className="text-blue-200 text-xs mt-1">
                                {totalEvidence > 0 ? `${((totalStructured / totalEvidence) * 100).toFixed(0)}%` : '0%'}
                              </div>
                            </div>
                            
                            <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🟡</span>
                                <span className="text-yellow-300 font-semibold">Residual</span>
                              </div>
                              <div className="text-white text-2xl font-bold">{totalResidual}</div>
                              <div className="text-yellow-200 text-xs mt-1">
                                {totalEvidence > 0 ? `${((totalResidual / totalEvidence) * 100).toFixed(0)}%` : '0%'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* NEW CARD: Phase 3 - Sub-Bucket Distribution */}
            {(() => {
              // Check if any channel has structured evidence buckets with sub-bucket distribution
              const hasSubBucketData = Object.values(result.channelBreakdown).some(countryData => {
                const channels = ['revenue', 'operations', 'supply', 'assets'] as const;
                return channels.some(channelKey => {
                  const channelData = countryData[channelKey] as ChannelData | undefined;
                  return channelData?.fallbackStrategy?.structuredEvidence?.buckets?.some(
                    bucket => bucket.subBucketDistribution && bucket.subBucketDistribution.length > 0
                  );
                });
              });

              if (!hasSubBucketData) return null;

              return (
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">🆕 Phase 3: Sub-Bucket Distribution</CardTitle>
                    <CardDescription className="text-gray-200">
                      Detailed breakdown showing within-bucket distributions (e.g., China/HK/Taiwan carve-outs)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {['Revenue', 'Operations', 'Supply', 'Assets'].map(channelName => {
                        // Get fallbackStrategy from the first country's channel data
                        const channelKey = channelName.toLowerCase() as 'revenue' | 'operations' | 'supply' | 'assets';
                        const firstCountry = Object.keys(result.channelBreakdown || {})[0];
                        if (!firstCountry) return null;

                        const channelData = result.channelBreakdown?.[firstCountry]?.[channelKey] as ChannelData | undefined;
                        const strategy = channelData?.fallbackStrategy;

                        // Skip if no structured evidence buckets
                        if (!strategy?.structuredEvidence?.buckets || strategy.structuredEvidence.buckets.length === 0) {
                          return null;
                        }

                        // Check if any bucket has sub-bucket distribution
                        const hasSubBuckets = strategy.structuredEvidence.buckets.some(
                          bucket => bucket.subBucketDistribution && bucket.subBucketDistribution.length > 0
                        );

                        if (!hasSubBuckets) return null;

                        return (
                          <div key={channelName} className="mb-8 p-4 bg-[#1a2332] rounded-lg border border-gray-700">
                            <h3 className="text-white font-bold text-xl mb-4">
                              {channelName} Channel - Sub-Bucket Distribution
                            </h3>
                            
                            {strategy.structuredEvidence.buckets.map(bucket => {
                              if (!bucket.subBucketDistribution || bucket.subBucketDistribution.length === 0) {
                                return null;
                              }

                              return (
                                <div key={bucket.bucketName} className="mb-6 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-blue-300 font-semibold text-lg flex items-center gap-2">
                                      <span>🔒</span>
                                      <span>{bucket.bucketName} (LOCKED)</span>
                                    </h4>
                                    <span className="text-blue-300 font-mono font-bold text-lg">
                                      {bucket.totalPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  
                                  {/* Narrative Definition */}
                                  <div className="mb-3 p-2 bg-blue-800/30 rounded">
                                    <span className="text-blue-200 text-sm italic flex items-center gap-2">
                                      <span>📝</span>
                                      <span>{bucket.narrativeDefinition}</span>
                                    </span>
                                  </div>
                                  
                                  {/* Sub-Bucket Distribution */}
                                  <div className="ml-4 space-y-2">
                                    <div className="text-blue-200 font-semibold text-sm mb-2">
                                      Sub-Country Breakdown:
                                    </div>
                                    {bucket.subBucketDistribution.map(sub => (
                                      <div key={sub.country} className="p-3 bg-blue-800/20 rounded border border-blue-700/50">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white font-semibold">
                                              {sub.country}
                                            </span>
                                            {sub.isCarveOut && (
                                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-600/30 text-purple-300 border border-purple-500">
                                                CARVE-OUT
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-blue-300 font-mono font-bold">
                                              {sub.percentage.toFixed(2)}%
                                            </div>
                                            <div className="text-blue-400 text-xs">
                                              ({sub.percentageOfBucket.toFixed(1)}% of bucket)
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-gray-300 text-xs mt-1">
                                          {sub.rationale}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Source */}
                                  <div className="mt-3 text-gray-300 text-xs italic">
                                    Source: SEC 10-K Filing - Parsed from narrative definitions
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}