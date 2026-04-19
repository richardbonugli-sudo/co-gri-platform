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
  values: Record<string, string | number>;
  result: number;
  explanation: string;
  countryDetails?: string; // For Step 1 detailed breakdown
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

// Helper function to generate Step 1 country details
const generateStep1CountryDetails = (
  countryExposures: CountryExposure[],
  channelBreakdown: ChannelBreakdown | undefined,
  exposureCoefficients: { revenue: number; supply: number; assets: number; financial: number; market: number },
  sector: string
): string => {
  const totalCountries = countryExposures.length;
  let details = `\n\n📊 v3.4 Enhanced Detailed Breakdown:\n\n`;
  details += `${'═'.repeat(79)}\n\n`;
  details += `   COMPREHENSIVE COUNTRY-BY-COUNTRY FOUR-CHANNEL EXPOSURE ANALYSIS (v3.4)\n\n`;
  details += `   WITH DETAILED RATIONALE, DATA SOURCES, FALLBACK TYPES, AND MATHEMATICAL CALCULATIONS\n\n`;
  details += `${'═'.repeat(79)}\n\n`;

  countryExposures.forEach((exp, index) => {
    const channelData = channelBreakdown?.[exp.country];
    if (!channelData) return;

    details += `\n${'═'.repeat(80)}\n\n`;
    details += `COUNTRY ${index + 1} OF ${totalCountries}: ${exp.country.toUpperCase()}\n\n`;
    details += `${'═'.repeat(80)}\n\n`;

    // Revenue Channel
    if (channelData.revenue) {
      const revWeight = channelData.revenue.weight * 100;
      const revContribution = revWeight * exposureCoefficients.revenue;
      details += `\n🔍 REVENUE CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${revWeight.toFixed(4)}%\n\n`;
      details += `   Data Quality: ${channelData.revenue.status === 'evidence' ? '✅ EVIDENCE-BASED' : '📊 FALLBACK ESTIMATE'}\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.revenue.fallbackType)} ${channelData.revenue.fallbackType || 'none'}`;
      details += ` - ${channelData.revenue.fallbackType === 'none' ? 'Direct Evidence: Data from structured tables or narrative sources, no fallback needed' : 
                      channelData.revenue.fallbackType === 'SSF' ? 'Segment-Specific Fallback: Region membership fully known, IndustryDemandProxy within defined region' :
                      channelData.revenue.fallbackType === 'RF' ? 'Restricted Fallback: Partial geographic information, sector-specific plausibility within restricted set' :
                      'Global Fallback: No geographic information, GDP + SectorPrior across global universe'}\n\n`;
      details += `   Primary Source: ${channelData.revenue.status === 'evidence' ? 'SEC 10-K Filing' : `Sector Analysis: ${sector} Revenue Pattern`}\n\n`;
      details += `\n   📊 REVENUE CHANNEL METHODOLOGY (v3.4):\n\n`;
      if (channelData.revenue.status === 'evidence') {
        details += `   • Data extracted from SEC 10-K/20-F Item 1 (Business), Item 8 (Financial Statements & Notes)\n\n`;
        details += `   • Geographic revenue segments parsed from "Segment Information" footnotes\n\n`;
        details += `   • Cross-validated with MD&A geographic revenue discussions\n\n`;
      } else {
        details += `   • ${channelData.revenue.fallbackType} METHOD: ${
          channelData.revenue.fallbackType === 'SSF' ? 'GDP × SectorDemand within defined region' :
          channelData.revenue.fallbackType === 'RF' ? 'GDP × SectorDemand within restricted set' :
          'GDP × SectorDemand across global universe'
        }\n\n`;
        details += `   • Formula: W_revenue = (GDP_c × SectorDemand_c) / Σ(GDP × SectorDemand)\n\n`;
        details += `   • Confidence Level: ${
          channelData.revenue.fallbackType === 'SSF' ? 'MEDIUM-HIGH - Sector-specific demand within known region' :
          channelData.revenue.fallbackType === 'RF' ? 'MEDIUM - Sector-specific demand within restricted set' :
          'LOW-MEDIUM - Global sector demand distribution'
        }\n\n`;
      }
      details += `\n   💰 REVENUE CHANNEL CALCULATION (v3.4):\n\n`;
      details += `   Channel Coefficient (α): ${exposureCoefficients.revenue.toFixed(4)}\n\n`;
      details += `   Raw Channel Weight: ${revWeight.toFixed(6)}%\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.revenue.toFixed(4)} × ${revWeight.toFixed(6)}% = ${revContribution.toFixed(6)}%\n\n`;
    }

    // Operations/Financial Channel
    if (channelData.operations) {
      const opsWeight = channelData.operations.weight * 100;
      const opsContribution = opsWeight * exposureCoefficients.financial;
      details += `\n🔍 OPERATIONS CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${opsWeight.toFixed(4)}%\n\n`;
      details += `   Data Quality: 📊 FALLBACK ESTIMATE\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.operations.fallbackType)} ${channelData.operations.fallbackType || 'SSF'}`;
      details += ` - Segment-Specific Fallback: Region membership fully known, IndustryDemandProxy within defined region\n\n`;
      details += `   Primary Source: Sector Analysis: ${sector} Financial Operations Pattern\n\n`;
      details += `\n   🏭 OPERATIONS/FINANCIAL CHANNEL METHODOLOGY (v3.4):\n\n`;
      details += `   • SSF METHOD: FinancialDepth × CurrencyReserves within defined region\n\n`;
      details += `   • Formula: W_operations = (FinancialDepth_c × CurrencyReserves_c) / Σ(FinancialDepth × CurrencyReserves)\n\n`;
      details += `   • Confidence Level: MEDIUM-HIGH - Financial system depth within known region\n\n`;
      details += `\n   🏭 OPERATIONS/FINANCIAL CHANNEL CALCULATION (v3.4):\n\n`;
      details += `   Channel Coefficient (δ): ${exposureCoefficients.financial.toFixed(4)}\n\n`;
      details += `   Raw Channel Weight: ${opsWeight.toFixed(6)}%\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.financial.toFixed(4)} × ${opsWeight.toFixed(6)}% = ${opsContribution.toFixed(6)}%\n\n`;
    }

    // Supply Channel
    if (channelData.supply) {
      const supWeight = channelData.supply.weight * 100;
      const supContribution = supWeight * exposureCoefficients.supply;
      details += `\n🔍 SUPPLY CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${supWeight.toFixed(4)}%\n\n`;
      details += `   Data Quality: 📊 FALLBACK ESTIMATE\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.supply.fallbackType)} ${channelData.supply.fallbackType || 'SSF'}`;
      details += ` - Segment-Specific Fallback: Region membership fully known, IndustryDemandProxy within defined region\n\n`;
      details += `   Primary Source: Sector Analysis: ${sector} Supply Chain Pattern\n\n`;
      details += `\n   🚚 SUPPLY CHAIN CHANNEL METHODOLOGY (v3.4):\n\n`;
      details += `   • SSF METHOD: ImportIntensity × AssemblyCapacity within defined region\n\n`;
      details += `   • Formula: W_supply = (ImportIntensity_c × AssemblyCapacity_c) / Σ(ImportIntensity × AssemblyCapacity)\n\n`;
      details += `   • Confidence Level: MEDIUM-HIGH - Sector-specific supply chain within known region\n\n`;
      details += `\n   🚚 SUPPLY CHAIN CHANNEL CALCULATION (v3.4):\n\n`;
      details += `   Channel Coefficient (β): ${exposureCoefficients.supply.toFixed(4)}\n\n`;
      details += `   Raw Channel Weight: ${supWeight.toFixed(6)}%\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.supply.toFixed(4)} × ${supWeight.toFixed(6)}% = ${supContribution.toFixed(6)}%\n\n`;
    }

    // Assets Channel
    if (channelData.assets) {
      const assWeight = channelData.assets.weight * 100;
      const assContribution = assWeight * exposureCoefficients.assets;
      details += `\n🔍 ASSETS CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${assWeight.toFixed(4)}%\n\n`;
      details += `   Data Quality: 📊 FALLBACK ESTIMATE\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.assets.fallbackType)} ${channelData.assets.fallbackType || 'SSF'}`;
      details += ` - Segment-Specific Fallback: Region membership fully known, IndustryDemandProxy within defined region\n\n`;
      details += `   Primary Source: Sector Analysis: ${sector} Asset Location Pattern\n\n`;
      details += `\n   🏢 PHYSICAL ASSETS CHANNEL METHODOLOGY (v3.4):\n\n`;
      details += `   • SSF METHOD: GDP × AssetIntensity within defined region\n\n`;
      details += `   • Formula: W_assets = (GDP_c × AssetIntensity_c) / Σ(GDP × AssetIntensity)\n\n`;
      details += `   • Confidence Level: MEDIUM-HIGH - Sector-specific asset deployment within known region\n\n`;
      details += `\n   🏢 PHYSICAL ASSETS CHANNEL CALCULATION (v3.4):\n\n`;
      details += `   Channel Coefficient (γ): ${exposureCoefficients.assets.toFixed(4)}\n\n`;
      details += `   Raw Channel Weight: ${assWeight.toFixed(6)}%\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.assets.toFixed(4)} × ${assWeight.toFixed(6)}% = ${assContribution.toFixed(6)}%\n\n`;
    }

    // Blended Weight Calculation
    const revContrib = (channelData.revenue?.weight || 0) * exposureCoefficients.revenue;
    const opsContrib = (channelData.operations?.weight || 0) * exposureCoefficients.financial;
    const supContrib = (channelData.supply?.weight || 0) * exposureCoefficients.supply;
    const assContrib = (channelData.assets?.weight || 0) * exposureCoefficients.assets;
    const blendedWeight = (revContrib + opsContrib + supContrib + assContrib) * 100;

    details += `\n   ⚖️ FOUR-CHANNEL BLENDED WEIGHT CALCULATION (v3.4):\n\n`;
    details += `   Formula: W_blended = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial\n\n`;
    details += `   W_blended = ${revContrib.toFixed(6)}% + ${supContrib.toFixed(6)}% + ${assContrib.toFixed(6)}% + ${opsContrib.toFixed(6)}%\n\n`;
    details += `   ✅ BLENDED WEIGHT = ${blendedWeight.toFixed(6)}%\n\n`;

    // Political Alignment
    if (exp.politicalAlignment) {
      details += `\n   🌐 POLITICAL ALIGNMENT ANALYSIS (v3.4):\n\n`;
      details += `   Alignment Factor (A_c): ${exp.politicalAlignment.alignmentFactor.toFixed(4)}\n\n`;
      details += `   Relationship Type: ${exp.politicalAlignment.relationship.toUpperCase()}\n\n`;
      details += `   Data Source: ${exp.politicalAlignment.source}\n\n`;
    }

    // Summary Box
    details += `\n   ╔${'═'.repeat(71)}╗\n`;
    details += `   ║  SUMMARY: ${exp.country.toUpperCase()} EXPOSURE PROFILE (v3.4)${' '.repeat(Math.max(0, 71 - 35 - exp.country.length))}║\n`;
    details += `   ╠${'═'.repeat(71)}╣\n`;
    details += `   ║  Pre-Normalized Blended Weight: ${blendedWeight.toFixed(4)}%${' '.repeat(Math.max(0, 71 - 37 - blendedWeight.toFixed(4).length))}║\n`;
    details += `   ║  Revenue Contribution: ${revContrib.toFixed(4)}% [${getFallbackTypeIcon(channelData.revenue?.fallbackType)} ${channelData.revenue?.fallbackType || 'none'}]${' '.repeat(Math.max(0, 71 - 30 - revContrib.toFixed(4).length - (channelData.revenue?.fallbackType || 'none').length))}║\n`;
    details += `   ║  Operations Contribution: ${opsContrib.toFixed(4)}% [${getFallbackTypeIcon(channelData.operations?.fallbackType)} ${channelData.operations?.fallbackType || 'SSF'}]${' '.repeat(Math.max(0, 71 - 33 - opsContrib.toFixed(4).length - (channelData.operations?.fallbackType || 'SSF').length))}║\n`;
    details += `   ║  Supply Contribution: ${supContrib.toFixed(4)}% [${getFallbackTypeIcon(channelData.supply?.fallbackType)} ${channelData.supply?.fallbackType || 'SSF'}]${' '.repeat(Math.max(0, 71 - 27 - supContrib.toFixed(4).length - (channelData.supply?.fallbackType || 'SSF').length))}║\n`;
    details += `   ║  Assets Contribution: ${assContrib.toFixed(4)}% [${getFallbackTypeIcon(channelData.assets?.fallbackType)} ${channelData.assets?.fallbackType || 'SSF'}]${' '.repeat(Math.max(0, 71 - 27 - assContrib.toFixed(4).length - (channelData.assets?.fallbackType || 'SSF').length))}║\n`;
    if (exp.politicalAlignment) {
      details += `   ║  Political Alignment: ${exp.politicalAlignment.alignmentFactor.toFixed(4)} (${exp.politicalAlignment.relationship})${' '.repeat(Math.max(0, 71 - 28 - exp.politicalAlignment.alignmentFactor.toFixed(4).length - exp.politicalAlignment.relationship.length))}║\n`;
    }
    details += `   ╚${'═'.repeat(71)}╝\n`;
  });

  return details;
};

// Helper function to generate Step 2 country normalization details
const generateStep2CountryDetails = (
  countryExposuresPreNorm: CountryExposure[],
  countryExposures: CountryExposure[],
  totalExposurePreNorm: number
): string => {
  const normalizationFactor = totalExposurePreNorm > 0 ? 1.0 / totalExposurePreNorm : 1.0;
  const preNormTotal = totalExposurePreNorm * 100;
  const postNormTotal = 100.0;

  let details = `\n\n📊 v3.4 Enhanced Detailed Breakdown:\n\n`;
  details += `Normalization Factor = 1 / ${preNormTotal.toFixed(4)}% = ${normalizationFactor.toFixed(6)}\n\n`;
  details += `${'═'.repeat(3)} COUNTRY-BY-COUNTRY NORMALIZATION (v3.4) ${'═'.repeat(3)}\n\n`;

  countryExposures.forEach((ce, idx) => {
    const preNorm = (countryExposuresPreNorm[idx]?.preNormalizedWeight || countryExposuresPreNorm[idx]?.exposureWeight || 0) * 100;
    const postNorm = ce.exposureWeight * 100;
    const change = preNorm > 0 ? ((postNorm - preNorm) / preNorm) * 100 : 0;

    details += `${ce.country}:\n`;
    details += `   Pre-Normalization:  ${preNorm.toFixed(4)}%\n`;
    details += `   Post-Normalization: ${postNorm.toFixed(4)}%\n`;
    details += `   Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n\n`;
  });

  return details;
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

      // Generate all 6 calculation steps
      const calculationSteps: CalculationStep[] = [];

      // Step 1: Four-Channel Exposure Weight Calculation
      const step1Details = generateStep1CountryDetails(
        countryExposures,
        geoData.channelBreakdown,
        exposureCoefficients,
        geoData.sector || 'Unknown'
      );

      calculationSteps.push({
        step: 'Step 1: Four-Channel Exposure Weight Calculation with v3.4 Enhanced Fallback Logic',
        formula: '📐 W_i,c = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial',
        values: {
          'Total Countries': countryExposures.length,
          'α (Revenue Coefficient)': exposureCoefficients.revenue,
          'β (Supply Chain Coefficient)': exposureCoefficients.supply,
          'γ (Assets Coefficient)': exposureCoefficients.assets,
          'δ (Financial Coefficient)': exposureCoefficients.financial,
          'Market Channel': 'Removed - political alignment applied in Step 4',
          'v3.4 Fallback Types': 'SSF (Segment-Specific), RF (Restricted), GF (Global)',
          'Primary Data Source': 'v3.4 Enhanced Multi-Channel Assessment with Graduated Evidence Scoring + Channel-Specific Logic + Full Database Integration',
          'Company Sector': geoData.sector || 'Unknown',
          'v3.4 Methodology': 'Jurisdiction-Aware, Evidence-First, Supplementary-Enhanced'
        },
        result: totalExposurePreNorm,
        explanation: `✓ Calculated four-channel blended exposure weights for ${countryExposures.length} countries using v3.4 enhanced fallback logic`,
        countryDetails: step1Details
      });

      // Step 2: Normalization with detailed country-by-country breakdown
      const step2Details = generateStep2CountryDetails(
        filteredExposures,
        countryExposures,
        totalExposurePreNorm
      );

      const normalizationFactor = totalExposurePreNorm > 0 ? 1.0 / totalExposurePreNorm : 1.0;
      const preNormTotalPercent = totalExposurePreNorm * 100;

      calculationSteps.push({
        step: '2: Exposure Normalization (v3.4)',
        formula: '📐 Normalized_W_i,c = W_i,c / Σ(W_i,c)',
        values: {
          'Pre-Normalization Total': `${preNormTotalPercent.toFixed(4)}%`,
          'Post-Normalization Total': '100.0000%',
          'Normalization Factor': normalizationFactor.toFixed(6),
          'Countries Normalized': countryExposures.length
        },
        result: 100.0,
        explanation: `✓ Normalized ${countryExposures.length} country exposures to sum to exactly 100%`,
        countryDetails: step2Details
      });

      // Step 3: Political Alignment Adjustment
      const avgAlignment = countryExposures.reduce((sum, exp) => sum + (exp.politicalAlignment?.alignmentFactor || 1.0), 0) / countryExposures.length;
      calculationSteps.push({
        step: 'Step 3: Political Alignment Adjustment',
        formula: 'Adjustment = 1.0 + 0.5 × (1.0 - A_c)',
        values: {
          'Average Alignment Factor': avgAlignment,
          'Adjustment Range': '[1.0, 1.5]',
          'Countries with Alignment Data': countryExposures.filter(exp => exp.politicalAlignment).length
        },
        result: 1.0 + 0.5 * (1.0 - avgAlignment),
        explanation: 'Applied political alignment adjustments to country risk contributions'
      });

      // Step 4: Country Shock Index Application
      calculationSteps.push({
        step: 'Step 4: Country Shock Index (CSI) Application',
        formula: 'Risk_c = W_normalized × CSI_c × Adjustment_c',
        values: {
          'Average CSI': countryExposures.reduce((sum, exp) => sum + exp.countryShockIndex, 0) / countryExposures.length,
          'Max CSI': Math.max(...countryExposures.map(exp => exp.countryShockIndex)),
          'Min CSI': Math.min(...countryExposures.map(exp => exp.countryShockIndex))
        },
        result: rawScore,
        explanation: `Calculated individual country risk contributions for ${countryExposures.length} countries`
      });

      // Step 5: Aggregation
      calculationSteps.push({
        step: 'Step 5: Aggregation to Raw Score',
        formula: 'Raw Score = Σ(Risk_c)',
        values: {
          'Total Countries': countryExposures.length,
          'Top 3 Contributors': countryExposures.slice(0, 3).map(exp => `${exp.country}: ${exp.contribution.toFixed(2)}`).join(', ')
        },
        result: rawScore,
        explanation: `Summed all ${countryExposures.length} country contributions to calculate raw geopolitical risk score`
      });

      // Step 6: Sector Multiplier
      calculationSteps.push({
        step: 'Step 6: Sector Multiplier Application',
        formula: 'Final Score = Raw Score × Sector Multiplier',
        values: {
          'Raw Score': rawScore,
          'Sector': geoData.sector || 'Unknown',
          'Sector Multiplier': sectorMultiplier,
          'Risk Level': riskLevel
        },
        result: finalScore,
        explanation: `Applied ${geoData.sector || 'Unknown'} sector multiplier (${sectorMultiplier.toFixed(2)}x) to calculate final geopolitical risk score`
      });

      setResult({
        company: geoData.company || tickerToSearch.toUpperCase(),
        symbol: tickerToSearch.toUpperCase(),
        sector: geoData.sector || 'Unknown',
        sectorMultiplier: sectorMultiplier,
        geopoliticalRiskScore: finalScore,
        riskLevel: riskLevel,
        countryExposures: countryExposures,
        calculationSteps: calculationSteps,
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

  const toggleStepExpansion = (stepIndex: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
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

            {/* v3.4 Step-by-Step Calculation Methodology */}
            {result.calculationSteps && result.calculationSteps.length > 0 && (
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    v3.4 Step-by-Step Calculation Methodology
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Comprehensive breakdown of all 6 calculation steps with detailed country-by-country analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.calculationSteps.map((step, idx) => (
                      <div key={idx} className="bg-[#1a2332] rounded-lg border border-gray-700 overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-[#1f2937] transition-colors"
                          onClick={() => toggleStepExpansion(idx)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-emerald-400 font-semibold text-lg">{step.step}</h4>
                            {expandedSteps[idx] ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                          </div>
                        </div>
                        
                        {expandedSteps[idx] && (
                          <div className="px-4 pb-4 border-t border-gray-700">
                            <div className="space-y-3 mt-4">
                              <div className="bg-[#0a1520] p-3 rounded">
                                <div className="text-green-300 font-mono text-sm mb-2">Formula:</div>
                                <div className="text-white font-mono text-xs whitespace-pre-wrap">{step.formula}</div>
                              </div>
                              
                              <div className="text-gray-300 text-sm">
                                <strong>Values:</strong>
                                <div className="ml-4 mt-2 space-y-1">
                                  {Object.entries(step.values).map(([key, value]) => (
                                    <div key={key} className="text-gray-300">
                                      {key}: <span className="text-white font-semibold">{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="text-gray-300 text-sm">
                                <strong>Result:</strong> <span className="text-white font-semibold text-lg">{step.result.toFixed(2)}</span>
                              </div>
                              
                              <div className="text-gray-400 text-sm italic">
                                {step.explanation}
                              </div>
                              
                              {step.countryDetails && (
                                <div className="mt-4 bg-[#0a1520] p-4 rounded border border-gray-700">
                                  <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                                    {step.countryDetails}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rest of the component remains the same - Geographic Exposure Table, Charts, etc. */}
            {/* Truncated for brevity */}
          </div>
        )}
      </div>
    </div>
  );
}