import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, ChevronDown, ChevronUp, Download, FileText, Lock, Unlock, CheckCircle } from 'lucide-react';
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
  step: string;
  formula: string;
  values: Record<string, any>;
  result: number;
  explanation: string;
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

const getContributionColor = (contribution: number): string => {
  if (contribution >= 10) return 'text-red-400';
  if (contribution >= 5) return 'text-orange-400';
  if (contribution >= 2) return 'text-yellow-400';
  return 'text-green-400';
};

const getBarColor = (contribution: number): string => {
  if (contribution >= 15) return '#ef4444'; // red
  if (contribution >= 10) return '#f97316'; // orange
  if (contribution >= 5) return '#eab308'; // yellow
  return '#22c55e'; // green
};

export default function COGRI() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
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

  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: !prev[country]
    }));
  };

  const toggleChannelExpansion = (channel: string) => {
    setExpandedChannels(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
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
            Assess a Company or Ticker
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Enter a stock ticker symbol to calculate its geopolitical risk exposure with three-tier fallback analysis
          </p>
        </div>

        <Card className="max-w-4xl mx-auto mb-8 bg-[#0f1e2e] border-gray-700">
          <CardContent className="pt-6">
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
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Run CO-GRI Assessment'}
                </Button>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-4">Supported Markets & Exchanges:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SUPPORTED_COUNTRIES.map((country) => (
                  <div key={country.name} className="bg-[#1a2332] p-3 rounded-lg border border-gray-700">
                    <div className={`w-2 h-2 rounded-full ${country.color} mb-2`}></div>
                    <div className="text-white font-semibold text-sm">{country.name}</div>
                    <div className="text-gray-400 text-xs mt-1">{country.exchanges}</div>
                    {country.tickerSuffix && (
                      <div className="text-[#0d5f5f] text-xs mt-1">Suffix: {country.tickerSuffix}</div>
                    )}
                  </div>
                ))}
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
            {/* Overall Score Card */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`${getRiskColor(result.riskLevel)} text-white px-6 py-3 rounded-lg mb-4 inline-block`}>
                    <div className="text-5xl font-bold mb-2">{result.geopoliticalRiskScore}</div>
                    <div className="text-lg font-semibold">{result.riskLevel}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata Section */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardContent className="pt-6">
                {/* Top Row - 5 Info Boxes */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Company</div>
                    <div className="text-white font-bold text-lg">{result.company}</div>
                  </div>
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Ticker</div>
                    <div className="text-white font-bold text-lg">{result.symbol}</div>
                  </div>
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Sector</div>
                    <div className="text-white font-bold text-lg">{result.sector}</div>
                  </div>
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Raw Score</div>
                    <div className="text-white font-bold text-lg">{result.rawScore.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Sector Multiplier</div>
                    <div className="text-white font-bold text-lg">{result.sectorMultiplier.toFixed(2)}x</div>
                  </div>
                </div>

                {/* Evidence Methodology Badges */}
                <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700 mb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-600/20 text-green-300 border border-green-500">
                      🟢 Direct Evidence (A+)
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500">
                      ⭐ High Confidence (A)
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500">
                      📊 Medium Confidence (B)
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-pink-600/20 text-pink-300 border border-pink-500">
                      🎯 Sector Analysis (C)
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-gray-600/20 text-gray-300 border border-gray-500">
                      📈 Estimate (D)
                    </span>
                  </div>
                  <div className="text-gray-300 text-xs mb-2">
                    v3.4 Enhanced: Graduated Evidence Scoring with Jurisdiction-Aware, Evidence-First Methodology
                  </div>
                  <div className="text-gray-400 text-xs">
                    v3.4 Enhanced Four-Channel Framework with Graduated Evidence Scoring System
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download v3.4 Enhanced Report
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-[#1a2332] flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Download v3.4 Fallback Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Exposure Breakdown Table */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Geographic Exposure Breakdown with v3.4 Enhanced Fallback Indicators
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Country-level blended exposure weights with v3.4 enhanced multi-tier fallback system (SSF/RF/GF) and political alignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Country</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">Exposure %</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">CSI</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">v3.4 Fallback Type</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Political Alignment</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">Contribution</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.countryExposures
                        .sort((a, b) => b.exposureWeight - a.exposureWeight)
                        .slice(0, 15)
                        .map((exp, index) => (
                          <tr 
                            key={exp.country} 
                            className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-[#1a2332]/30' : ''}`}
                          >
                            <td className="py-3 px-4">
                              <span className="text-white font-semibold">{exp.country}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-white font-mono">{(exp.exposureWeight * 100).toFixed(2)}%</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-white font-mono">{exp.countryShockIndex.toFixed(1)}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold border inline-block ${getFallbackTypeBadgeColor(exp.fallbackType)}`}>
                                {getFallbackTypeIcon(exp.fallbackType)} {exp.fallbackType || 'none'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {exp.politicalAlignment && (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-lg">{getAlignmentIcon(exp.politicalAlignment.relationship)}</span>
                                  <span className="text-white font-mono text-xs">{exp.politicalAlignment.alignmentFactor.toFixed(2)}</span>
                                  <span className="text-gray-400 text-xs capitalize">{exp.politicalAlignment.relationship}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono font-bold ${getContributionColor(exp.contribution)}`}>
                                {exp.contribution.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend Section */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white font-semibold mb-4">v3.4 Enhanced Status Legend:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">✅</span>
                        <div className="text-sm">
                          <span className="text-green-300 font-semibold">Evidence:</span>
                          <span className="text-gray-300"> Data from verified sources (financial reports, SEC filings)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⭐</span>
                        <div className="text-sm">
                          <span className="text-blue-300 font-semibold">High Confidence:</span>
                          <span className="text-gray-300"> ADR-resolved home country with high confidence</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🔒</span>
                        <div className="text-sm">
                          <span className="text-purple-300 font-semibold">Known Zero:</span>
                          <span className="text-gray-300"> Confirmed zero exposure from authoritative data</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📊</span>
                        <div className="text-sm">
                          <span className="text-orange-300 font-semibold">Fallback:</span>
                          <span className="text-gray-300"> Estimated using v3.4 enhanced three-tier fallback system</span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-white font-semibold mb-4 mt-6">v3.4 Enhanced Fallback Type Legend:</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🔵</span>
                        <div className="text-sm">
                          <span className="text-blue-300 font-semibold">SSF (Segment-Specific):</span>
                          <span className="text-gray-300"> Region membership fully known, IndustryDemandProxy within defined region (Highest confidence)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🟡</span>
                        <div className="text-sm">
                          <span className="text-yellow-300 font-semibold">RF (Restricted):</span>
                          <span className="text-gray-300"> Partial geographic information, sector-specific plausibility within restricted set P (Medium confidence)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🔴</span>
                        <div className="text-sm">
                          <span className="text-red-300 font-semibold">GF (Global):</span>
                          <span className="text-gray-300"> No geographic information, GDP + SectorPrior across global universe (Lowest confidence)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🟢</span>
                        <div className="text-sm">
                          <span className="text-green-300 font-semibold">None:</span>
                          <span className="text-gray-300"> Direct evidence from structured tables or narrative sources, no fallback needed</span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-white font-semibold mb-4 mt-6">v3.4 Enhanced Political Alignment Legend:</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤝</span>
                        <span className="text-sm text-gray-300">Allied (0.75-1.0)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">😊</span>
                        <span className="text-sm text-gray-300">Friendly (0.60-0.74)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">😐</span>
                        <span className="text-sm text-gray-300">Neutral (0.45-0.59)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚔️</span>
                        <span className="text-sm text-gray-300">Competitive (0.25-0.44)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm text-gray-300">Adversarial (0.0-0.24)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏠</span>
                        <span className="text-sm text-gray-300">Same Country (1.0)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Risk Contributors Chart */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Risk Contributors</CardTitle>
                <CardDescription className="text-gray-300">
                  Countries with highest geopolitical risk contribution (v3.4 enhanced analysis)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={result.countryExposures
                      .sort((a, b) => b.contribution - a.contribution)
                      .slice(0, 10)
                      .map(exp => ({
                        country: exp.country,
                        contribution: exp.contribution
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="country" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      label={{ value: 'Risk Contribution', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a2332', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="contribution" radius={[8, 8, 0, 0]}>
                      {result.countryExposures
                        .sort((a, b) => b.contribution - a.contribution)
                        .slice(0, 10)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.contribution)} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ENHANCED: Detailed Calculation Steps from COGRI-old.tsx */}
            {result.calculationSteps && result.calculationSteps.length > 0 && (
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detailed Calculation Steps
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Step-by-step breakdown of the geopolitical risk calculation methodology
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.calculationSteps
                      .filter((step) => step.step !== 'Country Exposure List')
                      .map((step, idx) => (
                        <div key={idx} className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                          <h4 className="text-emerald-400 font-semibold mb-2">{step.step}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="bg-[#0a1520] p-3 rounded font-mono text-green-300">
                              {step.formula}
                            </div>
                            <div className="text-gray-300">
                              <strong>Values:</strong>
                              <div className="ml-4 mt-1 space-y-1">
                                {Object.entries(step.values).map(([key, value]) => {
                                  // Special handling for Preliminary step - show only country and business activity %
                                  if (step.step === 'Preliminary: Company Country Exposure List') {
                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                      const businessActivity = (value as any).businessActivityPercent || '0';
                                      return (
                                        <div key={key} className="text-gray-300">
                                          <span className="text-emerald-300 font-semibold">{String(key)}</span>: <span className="text-white">{String(businessActivity)}%</span>
                                        </div>
                                      );
                                    }
                                  }
                                  // Handle nested objects for other steps
                                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                    return (
                                      <div key={key} className="bg-[#0a1520]/50 p-2 rounded border-l-2 border-emerald-500">
                                        <div className="font-semibold text-emerald-300">{key}</div>
                                        <div className="ml-3 mt-1 space-y-1 text-sm">
                                          {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                                            <div key={subKey} className="text-gray-300">
                                              {subKey.replace(/_/g, ' ')}: <span className="text-white">{typeof subValue === 'number' ? subValue.toFixed(2) : String(subValue)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                  // Handle primitive values
                                  return (
                                    <div key={key} className="text-gray-300">
                                      {key.replace(/_/g, ' ')}: <span className="text-white">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="text-gray-300">
                              <strong>Result:</strong> <span className="text-white font-semibold">{step.result.toFixed(2)}</span>
                            </div>
                            <div className="text-gray-400 italic">
                              {step.explanation}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ENHANCED: Country-Level Risk Breakdown from COGRI-old.tsx */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>🌍</span>
                  <span>Country-Level Risk Breakdown</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Detailed exposure analysis for each country with channel-by-channel breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.countryExposures
                    .sort((a, b) => b.contribution - a.contribution)
                    .map((ce, idx) => {
                      const channelData = result.channelBreakdown?.[ce.country];
                      const isExpanded = expandedCountries[ce.country];
                      
                      return (
                        <div key={idx} className="bg-[#1a2332] p-5 rounded-lg border border-gray-700">
                          <div 
                            className="flex items-center justify-between mb-3 cursor-pointer"
                            onClick={() => toggleCountryExpansion(ce.country)}
                          >
                            <h4 className="text-white text-lg font-semibold flex items-center gap-2">
                              {ce.country}
                              {ce.fallbackType && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getFallbackTypeBadgeColor(ce.fallbackType)}`}>
                                  {getFallbackTypeIcon(ce.fallbackType)} {ce.fallbackType}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-gray-400 text-sm">Contribution to Risk Score</p>
                                <p className="text-emerald-400 text-xl font-bold">{ce.contribution.toFixed(2)}</p>
                              </div>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-gray-400 text-sm">Exposure Weight (W<sub>i,c</sub>)</p>
                              <p className="text-white text-lg">{(ce.exposureWeight * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Country Shock Index (CSI)</p>
                              <p className="text-white text-lg">{ce.countryShockIndex.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Political Alignment</p>
                              {ce.politicalAlignment && (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getAlignmentIcon(ce.politicalAlignment.relationship)}</span>
                                  <span className="text-white text-lg">{ce.politicalAlignment.alignmentFactor.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {isExpanded && channelData && (
                            <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                              {/* Political Alignment Details */}
                              {ce.politicalAlignment && (
                                <div className="bg-purple-900/20 p-3 rounded border border-purple-700">
                                  <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                                    <span>{getAlignmentIcon(ce.politicalAlignment.relationship)}</span>
                                    <span>Political Alignment</span>
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <div className="text-gray-400">Relationship</div>
                                      <div className="text-white font-semibold capitalize">{ce.politicalAlignment.relationship}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Alignment Factor</div>
                                      <div className="text-white font-semibold">{ce.politicalAlignment.alignmentFactor.toFixed(2)}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Risk Adjustment</div>
                                      <div className="text-white font-semibold">
                                        {((1.0 + 0.5 * (1.0 - ce.politicalAlignment.alignmentFactor)) * 100 - 100).toFixed(0)}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400">
                                    Source: {ce.politicalAlignment.source}
                                  </div>
                                </div>
                              )}

                              {/* Channel Breakdown */}
                              <div className="mt-4">
                                <h4 className="text-white font-semibold mb-3">Channel-by-Channel Breakdown:</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Revenue Channel */}
                                  {channelData.revenue && (
                                    <div className="bg-blue-900/20 p-3 rounded border border-blue-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-blue-300 font-semibold">💰 Revenue</span>
                                        {channelData.revenue.isLocked ? <Lock className="h-4 w-4 text-blue-300" /> : <Unlock className="h-4 w-4 text-gray-400" />}
                                      </div>
                                      <div className="text-white text-2xl font-bold">{(channelData.revenue.weight * 100).toFixed(2)}%</div>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Status:</span>
                                          <span className="text-blue-300">{getStatusIcon(channelData.revenue.status)} {channelData.revenue.status}</span>
                                        </div>
                                        {channelData.revenue.evidenceType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Evidence:</span>
                                            <span className="text-blue-300">{getEvidenceTypeIcon(channelData.revenue.evidenceType)} {channelData.revenue.evidenceType}</span>
                                          </div>
                                        )}
                                        {channelData.revenue.fallbackType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Fallback:</span>
                                            <span className="text-blue-300">{getFallbackTypeIcon(channelData.revenue.fallbackType)} {channelData.revenue.fallbackType}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Operations Channel */}
                                  {channelData.operations && (
                                    <div className="bg-green-900/20 p-3 rounded border border-green-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-green-300 font-semibold">🏭 Operations</span>
                                        {channelData.operations.isLocked ? <Lock className="h-4 w-4 text-green-300" /> : <Unlock className="h-4 w-4 text-gray-400" />}
                                      </div>
                                      <div className="text-white text-2xl font-bold">{(channelData.operations.weight * 100).toFixed(2)}%</div>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Status:</span>
                                          <span className="text-green-300">{getStatusIcon(channelData.operations.status)} {channelData.operations.status}</span>
                                        </div>
                                        {channelData.operations.evidenceType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Evidence:</span>
                                            <span className="text-green-300">{getEvidenceTypeIcon(channelData.operations.evidenceType)} {channelData.operations.evidenceType}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Supply Channel */}
                                  {channelData.supply && (
                                    <div className="bg-yellow-900/20 p-3 rounded border border-yellow-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-yellow-300 font-semibold">🚚 Supply</span>
                                        {channelData.supply.isLocked ? <Lock className="h-4 w-4 text-yellow-300" /> : <Unlock className="h-4 w-4 text-gray-400" />}
                                      </div>
                                      <div className="text-white text-2xl font-bold">{(channelData.supply.weight * 100).toFixed(2)}%</div>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Status:</span>
                                          <span className="text-yellow-300">{getStatusIcon(channelData.supply.status)} {channelData.supply.status}</span>
                                        </div>
                                        {channelData.supply.evidenceType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Evidence:</span>
                                            <span className="text-yellow-300">{getEvidenceTypeIcon(channelData.supply.evidenceType)} {channelData.supply.evidenceType}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Assets Channel */}
                                  {channelData.assets && (
                                    <div className="bg-purple-900/20 p-3 rounded border border-purple-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-purple-300 font-semibold">🏢 Assets</span>
                                        {channelData.assets.isLocked ? <Lock className="h-4 w-4 text-purple-300" /> : <Unlock className="h-4 w-4 text-gray-400" />}
                                      </div>
                                      <div className="text-white text-2xl font-bold">{(channelData.assets.weight * 100).toFixed(2)}%</div>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Status:</span>
                                          <span className="text-purple-300">{getStatusIcon(channelData.assets.status)} {channelData.assets.status}</span>
                                        </div>
                                        {channelData.assets.evidenceType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-400">Evidence:</span>
                                            <span className="text-purple-300">{getEvidenceTypeIcon(channelData.assets.evidenceType)} {channelData.assets.evidenceType}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Blended Calculation */}
                              <div className="mt-4 bg-orange-900/20 p-3 rounded border border-orange-700">
                                <h4 className="text-orange-300 font-semibold mb-2">📊 Blended Weight Calculation</h4>
                                <div className="text-sm text-gray-300 font-mono">
                                  = ({(channelData.revenue?.weight || 0) * 100}% × 0.40) + 
                                  ({(channelData.operations?.weight || 0) * 100}% × 0.25) + 
                                  ({(channelData.supply?.weight || 0) * 100}% × 0.35) + 
                                  ({(channelData.assets?.weight || 0) * 100}% × 0.15)
                                </div>
                                <div className="text-white font-bold text-xl mt-2">
                                  = {(channelData.blended * 100).toFixed(2)}%
                                </div>
                              </div>

                              {/* Final Contribution Calculation */}
                              <div className="mt-4 bg-red-900/20 p-3 rounded border border-red-700">
                                <h4 className="text-red-300 font-semibold mb-2">🎯 Risk Contribution Calculation</h4>
                                <div className="text-sm text-gray-300 space-y-1">
                                  <div>Blended Weight: {(ce.exposureWeight * 100).toFixed(2)}%</div>
                                  <div>Country Shock Index (CSI): {ce.countryShockIndex}</div>
                                  <div>Political Adjustment: {ce.politicalAlignment ? (1.0 + 0.5 * (1.0 - ce.politicalAlignment.alignmentFactor)).toFixed(2) : '1.00'}x</div>
                                </div>
                                <div className="text-sm text-gray-300 font-mono mt-2">
                                  = {(ce.exposureWeight * 100).toFixed(2)}% × {ce.countryShockIndex} × {ce.politicalAlignment ? (1.0 + 0.5 * (1.0 - ce.politicalAlignment.alignmentFactor)).toFixed(2) : '1.00'}
                                </div>
                                <div className="text-white font-bold text-xl mt-2">
                                  = {ce.contribution.toFixed(2)} points
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Phase 1: Evidence Tracking */}
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

            {/* Phase 3: Sub-Bucket Distribution */}
            {(() => {
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
                        const channelKey = channelName.toLowerCase() as 'revenue' | 'operations' | 'supply' | 'assets';
                        const firstCountry = Object.keys(result.channelBreakdown || {})[0];
                        if (!firstCountry) return null;

                        const channelData = result.channelBreakdown?.[firstCountry]?.[channelKey] as ChannelData | undefined;
                        const strategy = channelData?.fallbackStrategy;

                        if (!strategy?.structuredEvidence?.buckets || strategy.structuredEvidence.buckets.length === 0) {
                          return null;
                        }

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
                                  
                                  <div className="mb-3 p-2 bg-blue-800/30 rounded">
                                    <span className="text-blue-200 text-sm italic flex items-center gap-2">
                                      <span>📝</span>
                                      <span>{bucket.narrativeDefinition}</span>
                                    </span>
                                  </div>
                                  
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

            {/* Powered by Footer */}
            <div className="text-center py-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Powered by CedarOwl's v3.4 Enhanced Methodology: Four-Channel Exposure + Graduated Evidence Scoring System
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-600 rounded"></span>
                  Direct Evidence (A+)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded"></span>
                  High Confidence (A)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-600 rounded"></span>
                  Medium Confidence (B)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-pink-600 rounded"></span>
                  Sector Analysis (C)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-gray-600 rounded"></span>
                  Estimate (D)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}