import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { getCompanyGeographicExposure } from '@/services/geographicExposureService';
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

interface ChannelData {
  weight: number;
  status: EvidenceStatus;
  source?: string;
  fallbackType?: FallbackType;
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

const FALLBACK_COHORT_STATS = {
  mean: 42.5,
  stdDev: 12.8,
  minRaw: 15.0,
  maxRaw: 85.0
};

const MICRO_EXPOSURE_THRESHOLD = 0.005;

const SUPPORTED_COUNTRIES = [
  {
    name: 'United States',
    exchanges: 'NASDAQ, NYSE',
    tickerSuffix: ''
  },
  {
    name: 'Canada',
    exchanges: 'TSX, TSX Venture',
    tickerSuffix: '.TO, .V'
  },
  {
    name: 'United Kingdom',
    exchanges: 'LSE',
    tickerSuffix: '.L, .LON'
  },
  {
    name: 'Brazil',
    exchanges: 'B3',
    tickerSuffix: '.SA'
  },
  {
    name: 'Hong Kong',
    exchanges: 'HKEX',
    tickerSuffix: '.HK'
  },
  {
    name: 'Singapore',
    exchanges: 'SGX',
    tickerSuffix: '.SI'
  },
  {
    name: 'Taiwan',
    exchanges: 'TWSE',
    tickerSuffix: '.TW, .TWO'
  },
  {
    name: 'South Africa',
    exchanges: 'JSE',
    tickerSuffix: '.JO'
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

const getFallbackTypeDescription = (fallbackType?: FallbackType): string => {
  switch (fallbackType) {
    case 'SSF':
      return 'Segment-Specific Fallback: Region membership fully known, IndustryDemandProxy within defined region';
    case 'RF':
      return 'Restricted Fallback: Partial geographic information, sector-specific plausibility within restricted set';
    case 'GF':
      return 'Global Fallback: No geographic information, GDP × SectorPrior across global universe';
    case 'none':
      return 'Direct Evidence: Data from structured tables or narrative sources, no fallback needed';
    default:
      return 'Unknown fallback type';
  }
};

const generateChannelRationale = (
  country: string,
  channelName: string,
  weight: number,
  status: EvidenceStatus,
  source: string | undefined,
  sector: string,
  fallbackType?: FallbackType
): string[] => {
  const rationale: string[] = [];
  
  rationale.push(`\n🔍 ${channelName.toUpperCase()} CHANNEL ANALYSIS FOR ${country.toUpperCase()}:`);
  rationale.push(`   Raw Weight: ${(weight * 100).toFixed(4)}%`);
  rationale.push(`   Data Quality: ${status === 'evidence' ? '✅ EVIDENCE-BASED' : status === 'high_confidence_estimate' ? '⭐ HIGH CONFIDENCE' : status === 'known_zero' ? '🔒 KNOWN ZERO' : '📊 FALLBACK ESTIMATE'}`);
  
  if (fallbackType) {
    rationale.push(`   Fallback Type: ${getFallbackTypeIcon(fallbackType)} ${fallbackType} - ${getFallbackTypeDescription(fallbackType)}`);
  }
  
  if (source) {
    rationale.push(`   Primary Source: ${source}`);
  }
  
  if (channelName === 'Revenue') {
    rationale.push(`\n   📊 REVENUE CHANNEL METHODOLOGY:`);
    if (status === 'evidence') {
      rationale.push(`   • Data extracted from SEC 10-K/20-F Item 1 (Business), Item 8 (Financial Statements & Notes)`);
      rationale.push(`   • Geographic revenue segments parsed from "Segment Information" footnotes`);
      rationale.push(`   • Cross-validated with MD&A geographic revenue discussions`);
    } else if (status === 'fallback') {
      if (fallbackType === 'SSF') {
        rationale.push(`   • SSF METHOD: IndustryDemandProxy within defined region`);
        rationale.push(`   • Formula: W_revenue = (GDP_c × SectorPenetration_c) / Σ(GDP × SectorPenetration)`);
        rationale.push(`   • Confidence Level: MEDIUM-HIGH - Sector-specific within known region`);
      } else if (fallbackType === 'RF') {
        rationale.push(`   • RF METHOD: Sector-specific plausibility within restricted set P`);
        rationale.push(`   • Formula: W_revenue = (GDP_c × SectorPrior_c × Plausibility_c) / Σ(GDP × SectorPrior × Plausibility)`);
        rationale.push(`   • Confidence Level: MEDIUM - Sector plausibility, not company-specific`);
      } else if (fallbackType === 'GF') {
        rationale.push(`   • GF METHOD: GDP × SectorPrior across global universe`);
        rationale.push(`   • Formula: W_revenue = (GDP_c × SectorPrior_c) / Σ(GDP × SectorPrior)`);
        rationale.push(`   • Confidence Level: LOW - Global proxy, not company-specific`);
      }
    }
  } else if (channelName === 'Operations') {
    rationale.push(`\n   🏭 OPERATIONS/FINANCIAL CHANNEL METHODOLOGY:`);
    if (status === 'evidence') {
      rationale.push(`   • Data from SEC 10-K/20-F Item 2 (Properties), Item 8 (Segment Assets)`);
      rationale.push(`   • Subsidiary locations from EX-21 (List of Subsidiaries)`);
      rationale.push(`   • Employee headcount by geography from annual reports`);
    } else if (status === 'fallback') {
      if (fallbackType === 'SSF') {
        rationale.push(`   • SSF METHOD: FinancialDepth × CurrencyReserves within defined region`);
        rationale.push(`   • Formula: W_operations = (FinancialDepth_c × CurrencyReserves_c) / Σ(FinancialDepth × CurrencyReserves)`);
        rationale.push(`   • Confidence Level: MEDIUM-HIGH - Financial system depth within known region`);
      } else if (fallbackType === 'RF') {
        rationale.push(`   • RF METHOD: Financial system plausibility within restricted set`);
        rationale.push(`   • Formula: W_operations = (FinancialDepth_c × Plausibility_c) / Σ(FinancialDepth × Plausibility)`);
        rationale.push(`   • Confidence Level: MEDIUM - Financial infrastructure proxy`);
      } else if (fallbackType === 'GF') {
        rationale.push(`   • GF METHOD: GDP × FinancialDepth across global universe`);
        rationale.push(`   • Formula: W_operations = (GDP_c × FinancialDepth_c) / Σ(GDP × FinancialDepth)`);
        rationale.push(`   • Confidence Level: LOW - Global financial system proxy`);
      }
    }
  } else if (channelName === 'Supply') {
    rationale.push(`\n   🚚 SUPPLY CHAIN CHANNEL METHODOLOGY:`);
    if (status === 'evidence') {
      rationale.push(`   • Supplier locations from 10-K Item 1 (Business - Raw Materials & Suppliers)`);
      rationale.push(`   • Manufacturing partner locations from sustainability reports`);
      rationale.push(`   • Import/export data from customs filings and trade statistics`);
    } else if (status === 'fallback') {
      if (fallbackType === 'SSF') {
        rationale.push(`   • SSF METHOD: ImportIntensity × AssemblyCapacity within defined region`);
        rationale.push(`   • Formula: W_supply = (ImportIntensity_c × AssemblyCapacity_c) / Σ(ImportIntensity × AssemblyCapacity)`);
        rationale.push(`   • Confidence Level: MEDIUM-HIGH - Sector-specific supply chain within known region`);
      } else if (fallbackType === 'RF') {
        rationale.push(`   • RF METHOD: Supply chain plausibility within restricted set`);
        rationale.push(`   • Formula: W_supply = (ImportIntensity_c × SectorPlausibility_c) / Σ(ImportIntensity × SectorPlausibility)`);
        rationale.push(`   • Confidence Level: MEDIUM - Trade flow patterns proxy`);
      } else if (fallbackType === 'GF') {
        rationale.push(`   • GF METHOD: GDP × ImportIntensity across global universe`);
        rationale.push(`   • Formula: W_supply = (GDP_c × ImportIntensity_c) / Σ(GDP × ImportIntensity)`);
        rationale.push(`   • Confidence Level: LOW - Global trade proxy`);
      }
    }
  } else if (channelName === 'Assets') {
    rationale.push(`\n   🏢 PHYSICAL ASSETS CHANNEL METHODOLOGY:`);
    if (status === 'evidence') {
      rationale.push(`   • PP&E by geography from 10-K Item 8 (Property, Plant & Equipment note)`);
      rationale.push(`   • Facility locations from Item 2 (Properties)`);
      rationale.push(`   • Long-lived assets by segment from financial statement notes`);
    } else if (status === 'fallback') {
      if (fallbackType === 'SSF') {
        rationale.push(`   • SSF METHOD: GDP × AssetIntensity within defined region`);
        rationale.push(`   • Formula: W_assets = (GDP_c × AssetIntensity_c) / Σ(GDP × AssetIntensity)`);
        rationale.push(`   • Confidence Level: MEDIUM-HIGH - Sector-specific asset deployment within known region`);
      } else if (fallbackType === 'RF') {
        rationale.push(`   • RF METHOD: Asset deployment plausibility within restricted set`);
        rationale.push(`   • Formula: W_assets = (GDP_c × AssetIntensity_c × Plausibility_c) / Σ(GDP × AssetIntensity × Plausibility)`);
        rationale.push(`   • Confidence Level: MEDIUM - Infrastructure proxy`);
      } else if (fallbackType === 'GF') {
        rationale.push(`   • GF METHOD: GDP × AssetIntensity across global universe`);
        rationale.push(`   • Formula: W_assets = (GDP_c × AssetIntensity_c) / Σ(GDP × AssetIntensity)`);
        rationale.push(`   • Confidence Level: LOW - Global infrastructure proxy`);
      }
    }
  }
  
  return rationale;
};

const generateRiskElaboration = (country: string, csi: number, exposurePercent: number, contribution: number): string => {
  const insights = getCountryInsights(country);
  
  let riskLevel: string;
  let riskFactors: string;
  let businessImpact: string;
  
  if (csi >= 80) {
    riskLevel = 'Critical Risk Zone';
    riskFactors = 'This country exhibits severe geopolitical instability characterized by active armed conflicts, comprehensive international sanctions, political upheaval, or systemic governance failures. ';
    businessImpact = 'Operations in this jurisdiction face extreme disruption risks including asset seizure, supply chain collapse, currency volatility, regulatory unpredictability, and potential loss of market access. ';
  } else if (csi >= 60) {
    riskLevel = 'High Risk Zone';
    riskFactors = 'This country demonstrates significant geopolitical challenges including political instability, elevated corruption levels, weak rule of law, regional conflicts, or substantial sanctions exposure. ';
    businessImpact = 'Business operations may encounter frequent disruptions, regulatory uncertainty, currency fluctuations, supply chain vulnerabilities, and heightened compliance requirements. ';
  } else if (csi >= 45) {
    riskLevel = 'Moderate Risk Zone';
    riskFactors = 'This country shows moderate geopolitical concerns such as political transitions, regional tensions, economic volatility, or emerging regulatory challenges. ';
    businessImpact = 'Companies should monitor political developments closely, maintain contingency plans, and consider diversification strategies to mitigate concentration risk. ';
  } else if (csi >= 30) {
    riskLevel = 'Low-Moderate Risk Zone';
    riskFactors = 'This country maintains relative stability with established institutions, though some political, economic, or regulatory uncertainties may exist. ';
    businessImpact = 'Standard risk management practices are generally sufficient, though specific sector or regional factors should be monitored. ';
  } else {
    riskLevel = 'Low Risk Zone';
    riskFactors = 'This country demonstrates strong institutional frameworks, political stability, robust rule of law, and predictable regulatory environments. ';
    businessImpact = 'Business operations benefit from stable conditions, though global economic shifts and policy changes should still be monitored. ';
  }
  
  let expertInsights = '';
  if (insights) {
    const primaryRisks = insights.primaryRisks.slice(0, 2).join('; ');
    const expertViews = insights.expertAnalysis.slice(0, 2).join(' ');
    const recentEvents = insights.recentDevelopments.slice(0, 2).join(' ');
    
    expertInsights = `\n\nCountry-Specific Intelligence (Sources: BlackRock Geopolitical Risk Dashboard, Sean Foo, Michael Every, Alex Krainer, Louis-Vincent Gave, Dr. Marc Faber): ${primaryRisks}. Expert Analysis: ${expertViews} Recent Developments: ${recentEvents}`;
  }
  
  let exposureContext: string;
  if (exposurePercent >= 30) {
    exposureContext = `\n\nExposure Analysis: With ${exposurePercent.toFixed(1)}% blended exposure representing a dominant market position, this concentration creates substantial vulnerability to country-specific shocks. Any adverse geopolitical events could significantly impact overall business performance. `;
  } else if (exposurePercent >= 15) {
    exposureContext = `\n\nExposure Analysis: The ${exposurePercent.toFixed(1)}% blended exposure represents a major strategic market requiring active risk monitoring and mitigation strategies. `;
  } else if (exposurePercent >= 5) {
    exposureContext = `\n\nExposure Analysis: The ${exposurePercent.toFixed(1)}% blended exposure indicates meaningful business presence that warrants ongoing geopolitical risk assessment. `;
  } else {
    exposureContext = `\n\nExposure Analysis: While the ${exposurePercent.toFixed(1)}% blended exposure is relatively modest, it still contributes to overall risk profile and should be monitored. `;
  }
  
  let contributionContext: string;
  if (contribution >= 15) {
    contributionContext = `This exposure contributes ${contribution.toFixed(1)} points to the overall CO-GRI score, representing a critical risk driver that demands immediate strategic attention and comprehensive mitigation planning.`;
  } else if (contribution >= 8) {
    contributionContext = `Contributing ${contribution.toFixed(1)} points to the overall CO-GRI score, this represents a significant risk factor requiring proactive management and regular monitoring.`;
  } else if (contribution >= 3) {
    contributionContext = `With a contribution of ${contribution.toFixed(1)} points to the CO-GRI score, this exposure adds moderate risk that should be incorporated into risk management frameworks.`;
  } else {
    contributionContext = `Contributing ${contribution.toFixed(1)} points to the CO-GRI score, this exposure adds incremental risk to the overall profile.`;
  }
  
  return `${riskLevel} (CSI: ${csi.toFixed(1)}): ${riskFactors}${businessImpact}${expertInsights}${exposureContext}${contributionContext}`;
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
      const geoData = await getCompanyGeographicExposure(tickerToSearch.toUpperCase());
      
      if (!geoData || !geoData.segments || geoData.segments.length === 0) {
        setError(`No geographic exposure data available for ${tickerToSearch.toUpperCase()}. Please try another ticker.`);
        setLoading(false);
        return;
      }

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
          // GF country not in channelBreakdown - calculate alignment on-the-fly
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

      const filteredExposures = countryExposuresPreNorm.filter(exp => exp.exposureWeight >= MICRO_EXPOSURE_THRESHOLD);
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

      const totalExposurePostNorm = countryExposures.reduce((sum, exp) => sum + exp.exposureWeight, 0);
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
        detail: `Blended exposure of ${(exp.exposureWeight * 100).toFixed(1)}% with Country Shock Index of ${exp.countryShockIndex.toFixed(1)} contributes ${exp.contribution.toFixed(1)} points to overall risk score`,
        elaboration: generateRiskElaboration(exp.country, exp.countryShockIndex, exp.exposureWeight * 100, exp.contribution)
      }));

      const recommendations: Recommendation[] = [];
      
      if (finalScore >= 45) {
        recommendations.push({
          category: 'Diversification',
          action: 'Consider geographic diversification to reduce concentration in high-risk markets',
          priority: 'High'
        });
      }

      if (topRisks.length > 0 && topRisks[0].contribution > 15) {
        recommendations.push({
          category: 'Risk Monitoring',
          action: `Closely monitor geopolitical developments in ${topRisks[0].country}`,
          priority: 'High'
        });
      }

      recommendations.push({
        category: 'Hedging',
        action: 'Evaluate currency and political risk hedging strategies for top exposure countries',
        priority: finalScore >= 30 ? 'High' : 'Medium'
      });

      const detailedCountryCalculations: string[] = [];
      
      detailedCountryCalculations.push('═══════════════════════════════════════════════════════════════════════════════');
      detailedCountryCalculations.push('   COMPREHENSIVE COUNTRY-BY-COUNTRY FOUR-CHANNEL EXPOSURE ANALYSIS');
      detailedCountryCalculations.push('   WITH DETAILED RATIONALE, DATA SOURCES, FALLBACK TYPES, AND MATHEMATICAL CALCULATIONS');
      detailedCountryCalculations.push('═══════════════════════════════════════════════════════════════════════════════');
      detailedCountryCalculations.push('');
      
      countryExposuresPreNorm.forEach((exp, index) => {
        detailedCountryCalculations.push(`\n${'='.repeat(80)}`);
        detailedCountryCalculations.push(`COUNTRY ${index + 1} OF ${countryExposuresPreNorm.length}: ${exp.country.toUpperCase()}`);
        detailedCountryCalculations.push(`${'='.repeat(80)}\n`);
        
        if (exp.channelWeights && geoData.channelBreakdown?.[exp.country]) {
          const channelData = geoData.channelBreakdown[exp.country];
          const revWeight = exp.channelWeights.revenue;
          const supWeight = exp.channelWeights.supply;
          const assWeight = exp.channelWeights.assets;
          const finWeight = exp.channelWeights.operations;
          
          const revContrib = exposureCoefficients.revenue * revWeight;
          const supContrib = exposureCoefficients.supply * supWeight;
          const assContrib = exposureCoefficients.assets * assWeight;
          const finContrib = exposureCoefficients.financial * finWeight;
          
          // REVENUE CHANNEL
          detailedCountryCalculations.push(...generateChannelRationale(
            exp.country,
            'Revenue',
            revWeight,
            channelData.revenue?.status || 'fallback',
            channelData.revenue?.source,
            geoData.sector || 'Unknown',
            channelData.revenue?.fallbackType
          ));
          
          detailedCountryCalculations.push(`\n   💰 REVENUE CHANNEL CALCULATION:`);
          detailedCountryCalculations.push(`   Channel Coefficient (α): ${exposureCoefficients.revenue.toFixed(4)}`);
          detailedCountryCalculations.push(`   Raw Channel Weight: ${(revWeight * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   Weighted Contribution: ${exposureCoefficients.revenue.toFixed(4)} × ${(revWeight * 100).toFixed(6)}% = ${(revContrib * 100).toFixed(6)}%`);
          
          // OPERATIONS/FINANCIAL CHANNEL
          detailedCountryCalculations.push(...generateChannelRationale(
            exp.country,
            'Operations',
            finWeight,
            channelData.operations?.status || 'fallback',
            channelData.operations?.source,
            geoData.sector || 'Unknown',
            channelData.operations?.fallbackType
          ));
          
          detailedCountryCalculations.push(`\n   🏭 OPERATIONS/FINANCIAL CHANNEL CALCULATION:`);
          detailedCountryCalculations.push(`   Channel Coefficient (δ): ${exposureCoefficients.financial.toFixed(4)}`);
          detailedCountryCalculations.push(`   Raw Channel Weight: ${(finWeight * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   Weighted Contribution: ${exposureCoefficients.financial.toFixed(4)} × ${(finWeight * 100).toFixed(6)}% = ${(finContrib * 100).toFixed(6)}%`);
          
          // SUPPLY CHAIN CHANNEL
          detailedCountryCalculations.push(...generateChannelRationale(
            exp.country,
            'Supply',
            supWeight,
            channelData.supply?.status || 'fallback',
            channelData.supply?.source,
            geoData.sector || 'Unknown',
            channelData.supply?.fallbackType
          ));
          
          detailedCountryCalculations.push(`\n   🚚 SUPPLY CHAIN CHANNEL CALCULATION:`);
          detailedCountryCalculations.push(`   Channel Coefficient (β): ${exposureCoefficients.supply.toFixed(4)}`);
          detailedCountryCalculations.push(`   Raw Channel Weight: ${(supWeight * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   Weighted Contribution: ${exposureCoefficients.supply.toFixed(4)} × ${(supWeight * 100).toFixed(6)}% = ${(supContrib * 100).toFixed(6)}%`);
          
          // ASSETS CHANNEL
          detailedCountryCalculations.push(...generateChannelRationale(
            exp.country,
            'Assets',
            assWeight,
            channelData.assets?.status || 'fallback',
            channelData.assets?.source,
            geoData.sector || 'Unknown',
            channelData.assets?.fallbackType
          ));
          
          detailedCountryCalculations.push(`\n   🏢 PHYSICAL ASSETS CHANNEL CALCULATION:`);
          detailedCountryCalculations.push(`   Channel Coefficient (γ): ${exposureCoefficients.assets.toFixed(4)}`);
          detailedCountryCalculations.push(`   Raw Channel Weight: ${(assWeight * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   Weighted Contribution: ${exposureCoefficients.assets.toFixed(4)} × ${(assWeight * 100).toFixed(6)}% = ${(assContrib * 100).toFixed(6)}%`);
          
          detailedCountryCalculations.push(`\n   ⚖️ FOUR-CHANNEL BLENDED WEIGHT CALCULATION:`);
          detailedCountryCalculations.push(`   Formula: W_blended = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial`);
          detailedCountryCalculations.push(`   W_blended = ${(revContrib * 100).toFixed(6)}% + ${(supContrib * 100).toFixed(6)}% + ${(assContrib * 100).toFixed(6)}% + ${(finContrib * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   ✅ BLENDED WEIGHT = ${(exp.preNormalizedWeight! * 100).toFixed(6)}%`);
          
          if (exp.politicalAlignment) {
            detailedCountryCalculations.push(`\n   🌐 POLITICAL ALIGNMENT ANALYSIS:`);
            detailedCountryCalculations.push(`   Alignment Factor (A_c): ${exp.politicalAlignment.alignmentFactor.toFixed(4)}`);
            detailedCountryCalculations.push(`   Relationship Type: ${exp.politicalAlignment.relationship.toUpperCase()}`);
            detailedCountryCalculations.push(`   Data Source: ${exp.politicalAlignment.source}`);
          }
          
          detailedCountryCalculations.push(`\n   ╔═══════════════════════════════════════════════════════════════════════╗`);
          detailedCountryCalculations.push(`   ║  SUMMARY: ${exp.country.toUpperCase()} EXPOSURE PROFILE`);
          detailedCountryCalculations.push(`   ╠═══════════════════════════════════════════════════════════════════════╣`);
          detailedCountryCalculations.push(`   ║  Pre-Normalized Blended Weight: ${(exp.preNormalizedWeight! * 100).toFixed(4)}%`);
          detailedCountryCalculations.push(`   ║  Revenue Contribution: ${(revContrib * 100).toFixed(4)}% [${getFallbackTypeIcon(channelData.revenue?.fallbackType)} ${channelData.revenue?.fallbackType || 'none'}]`);
          detailedCountryCalculations.push(`   ║  Operations Contribution: ${(finContrib * 100).toFixed(4)}% [${getFallbackTypeIcon(channelData.operations?.fallbackType)} ${channelData.operations?.fallbackType || 'none'}]`);
          detailedCountryCalculations.push(`   ║  Supply Contribution: ${(supContrib * 100).toFixed(4)}% [${getFallbackTypeIcon(channelData.supply?.fallbackType)} ${channelData.supply?.fallbackType || 'none'}]`);
          detailedCountryCalculations.push(`   ║  Assets Contribution: ${(assContrib * 100).toFixed(4)}% [${getFallbackTypeIcon(channelData.assets?.fallbackType)} ${channelData.assets?.fallbackType || 'none'}]`);
          if (exp.politicalAlignment) {
            detailedCountryCalculations.push(`   ║  Political Alignment: ${exp.politicalAlignment.alignmentFactor.toFixed(4)} (${exp.politicalAlignment.relationship})`);
          }
          detailedCountryCalculations.push(`   ╚═══════════════════════════════════════════════════════════════════════╝`);
          
        } else {
          detailedCountryCalculations.push(`   ⚠️ LIMITED DATA AVAILABILITY - GLOBAL FALLBACK (GF)`);
          detailedCountryCalculations.push(`   Only revenue-based exposure estimate available`);
          detailedCountryCalculations.push(`   Pre-Normalized Weight: ${(exp.preNormalizedWeight! * 100).toFixed(6)}%`);
          detailedCountryCalculations.push(`   Fallback Type: 🔴 GF (Global Fallback)`);
          
          if (exp.politicalAlignment) {
            detailedCountryCalculations.push(`\n   🌐 POLITICAL ALIGNMENT ANALYSIS (Calculated for GF Country):`);
            detailedCountryCalculations.push(`   Alignment Factor (A_c): ${exp.politicalAlignment.alignmentFactor.toFixed(4)}`);
            detailedCountryCalculations.push(`   Relationship Type: ${exp.politicalAlignment.relationship.toUpperCase()}`);
            detailedCountryCalculations.push(`   Data Source: ${exp.politicalAlignment.source}`);
          }
        }
        
        detailedCountryCalculations.push('');
      });

      const calculationSteps: CalculationStep[] = [
        {
          stepNumber: '1',
          title: 'Four-Channel Exposure Weight Calculation with Fallback Type Indicators (Phase 3.4)',
          formula: 'W_i,c = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial',
          values: {
            'Total Countries': countryExposures.length,
            'α (Revenue Coefficient)': exposureCoefficients.revenue.toFixed(4),
            'β (Supply Chain Coefficient)': exposureCoefficients.supply.toFixed(4),
            'γ (Assets Coefficient)': exposureCoefficients.assets.toFixed(4),
            'δ (Financial Coefficient)': exposureCoefficients.financial.toFixed(4),
            'Market Channel': 'Removed - political alignment applied in Step 4',
            'Fallback Types': 'SSF (Segment-Specific), RF (Restricted), GF (Global)',
            'Primary Data Source': geoData.dataSource || 'Multiple Sources',
            'Company Sector': geoData.sector || 'Unknown'
          },
          result: `Calculated four-channel blended exposure weights for ${countryExposures.length} countries with fallback type indicators`,
          detailedCalculations: detailedCountryCalculations
        },
        {
          stepNumber: '2',
          title: 'Exposure Normalization',
          formula: 'Normalized_W_i,c = W_i,c / Σ(W_i,c)',
          values: {
            'Pre-Normalization Total': `${(totalExposurePreNorm * 100).toFixed(4)}%`,
            'Post-Normalization Total': `${(totalExposurePostNorm * 100).toFixed(4)}%`,
            'Normalization Factor': totalExposurePreNorm > 0 ? (1 / totalExposurePreNorm).toFixed(6) : '1.000000'
          },
          result: `Normalized ${countryExposures.length} country exposures to sum to exactly 100%`,
          detailedCalculations: [
            `Normalization Factor = 1 / ${(totalExposurePreNorm * 100).toFixed(4)}% = ${totalExposurePreNorm > 0 ? (1 / totalExposurePreNorm).toFixed(6) : '1.000000'}`,
            '',
            '═══ COUNTRY-BY-COUNTRY NORMALIZATION ═══',
            '',
            ...countryExposures.map(exp => {
              const preNorm = exp.preNormalizedWeight! * 100;
              const postNorm = exp.exposureWeight * 100;
              const change = exp.preNormalizedWeight! > 0 ? ((exp.exposureWeight / exp.preNormalizedWeight! - 1) * 100) : 0;
              return `${exp.country}:\n   Pre-Normalization:  ${preNorm.toFixed(4)}%\n   Post-Normalization: ${postNorm.toFixed(4)}%\n   Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`;
            })
          ]
        },
        {
          stepNumber: '3',
          title: 'Country Shock Index (S_c)',
          formula: 'S_c = Σ(w_v × R_c,v)',
          values: {
            'CSI Range': '0-100',
            'Countries Assessed': countryExposures.length,
            'Average CSI': (countryExposures.reduce((sum, exp) => sum + exp.countryShockIndex, 0) / countryExposures.length).toFixed(2),
            'Highest CSI': Math.max(...countryExposures.map(e => e.countryShockIndex)).toFixed(1),
            'Lowest CSI': Math.min(...countryExposures.map(e => e.countryShockIndex)).toFixed(1),
            'Note': 'Base CSI values from CedarOwl global risk database'
          },
          result: 'Assigned base CSI values for all countries',
          detailedCalculations: countryExposures.map(exp => 
            `${exp.country}: CSI = ${exp.countryShockIndex.toFixed(1)} (from CedarOwl database)`
          )
        },
        {
          stepNumber: '4',
          title: 'Weighted Risk Contribution with Comprehensive Political Alignment Analysis',
          formula: 'Contribution_c = Normalized_W_i,c × S_c × (1.0 + 0.5*(1.0 – A_c))',
          values: {
            'Total Contributions': countryExposures.length,
            'Highest Contribution': Math.max(...countryExposures.map(e => e.contribution)).toFixed(4),
            'Lowest Contribution': Math.min(...countryExposures.map(e => e.contribution)).toFixed(4),
            'Note': 'Political alignment (A_c) with comprehensive data sources and detailed calculations'
          },
          result: `Calculated ${countryExposures.length} weighted country risk contributions with comprehensive political alignment analysis`,
          detailedCalculations: [
            '═══════════════════════════════════════════════════════════════════════════════',
            '   COMPREHENSIVE POLITICAL ALIGNMENT ANALYSIS FOR EACH COUNTRY',
            '   Including Data Sources, Mathematical Formulas, Rationale, and Business Implications',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            '📚 1. COMPREHENSIVE DATA SOURCE DOCUMENTATION',
            '   ═══════════════════════════════════════════════════════════════════════════',
            '',
            '   A. UN General Assembly Voting Records (Harvard Dataverse)',
            '      • URL: https://dataverse.harvard.edu/dataverse/harvard',
            '      • Description: Measures diplomatic alignment through voting similarity on',
            '        international issues, resolutions, and policy positions',
            '      • Methodology: Calculates percentage of aligned votes across all UN General',
            '        Assembly sessions, weighted by resolution importance',
            '      • Data Coverage: 1946-present, updated annually',
            '      • Reliability: HIGH - Official UN voting records, peer-reviewed dataset',
            '',
            '   B. Alliance & Treaty Memberships',
            '      • Organizations Tracked:',
            '        - NATO (North Atlantic Treaty Organization): Military alliance',
            '        - QUAD (Quadrilateral Security Dialogue): US, Japan, India, Australia',
            '        - AUKUS: Australia, UK, US security partnership',
            '        - USMCA (US-Mexico-Canada Agreement): Trade agreement',
            '        - EU (European Union): Political and economic union',
            '        - BRICS: Brazil, Russia, India, China, South Africa economic bloc',
            '        - SCO (Shanghai Cooperation Organization): Eurasian political alliance',
            '        - ASEAN: Association of Southeast Asian Nations',
            '        - GCC (Gulf Cooperation Council): Middle Eastern alliance',
            '        - MERCOSUR: South American trade bloc',
            '        - African Union: Continental union of African states',
            '      • Methodology: Binary membership indicators weighted by alliance depth',
            '        (military > economic > political cooperation)',
            '      • Reliability: HIGH - Official membership records',
            '',
            '   C. Economic Interdependence Metrics',
            '      • IMF Direction of Trade Statistics (DOTS)',
            '        - URL: https://data.imf.org/',
            '        - Measures: Bilateral trade flows (imports/exports)',
            '        - Frequency: Monthly updates',
            '      • IMF Coordinated Portfolio Investment Survey (CPIS)',
            '        - URL: https://data.imf.org/',
            '        - Measures: Cross-border holdings of securities',
            '        - Frequency: Annual',
            '      • OECD Bilateral Trade and FDI Flows',
            '        - URL: https://data.oecd.org/',
            '        - Measures: Foreign Direct Investment positions and flows',
            '        - Frequency: Quarterly',
            '      • Methodology: Calculates economic interdependence as percentage of GDP',
            '        represented by bilateral trade and investment',
            '      • Reliability: HIGH - Official government statistics',
            '',
            '📐 2. DETAILED MATHEMATICAL FORMULAS',
            '   ═══════════════════════════════════════════════════════════════════════════',
            '',
            '   Political Alignment Amplifier Formula:',
            '   ',
            '   Alignment Amplifier = 1.0 + 0.5 × (1.0 - A_c)',
            '   ',
            '   Where:',
            '   • A_c = Political Alignment Factor (range: 0.0 to 1.0)',
            '   • 1.0 = Baseline (no amplification)',
            '   • 0.5 = Maximum amplification coefficient',
            '   • (1.0 - A_c) = Inverse alignment (higher when less aligned)',
            '   ',
            '   Alignment Factor Calculation:',
            '   A_c = (0.40 × UN_Voting_Similarity) + ',
            '         (0.35 × Alliance_Membership_Score) + ',
            '         (0.25 × Economic_Interdependence_Score)',
            '   ',
            '   Final Contribution Formula:',
            '   Contribution = Normalized_Weight × CSI × Alignment_Amplifier',
            '   Contribution = W × S_c × (1.0 + 0.5 × (1.0 - A_c))',
            '',
            '🎯 3. COMPREHENSIVE RATIONALE EXPLANATIONS',
            '   ═══════════════════════════════════════════════════════════════════════════',
            '',
            '   Relationship Categories with Real-World Examples:',
            '',
            '   A. ALLIED (A_c: 0.75-1.0)',
            '      • Definition: Strong diplomatic ties, shared security interests, deep',
            '        economic integration, coordinated foreign policy',
            '      • Real-World Examples:',
            '        - US-UK: "Special Relationship", NATO allies, Five Eyes intelligence',
            '        - US-Canada: USMCA, NORAD, integrated supply chains',
            '        - US-Australia: ANZUS Treaty, Five Eyes, AUKUS partnership',
            '        - France-Germany: EU core, Eurozone, joint military projects',
            '      • Characteristics:',
            '        - Treaty allies with mutual defense commitments',
            '        - Coordinated voting in international forums (>80% alignment)',
            '        - Deep economic integration (>15% of GDP in bilateral trade)',
            '        - Regular high-level diplomatic engagement',
            '      • Risk Impact: MINIMAL - Political alignment reduces geopolitical risk',
            '      • Business Implications:',
            '        - Stable regulatory environment',
            '        - Predictable policy framework',
            '        - Low expropriation risk',
            '        - Favorable trade terms',
            '',
            '   B. FRIENDLY (A_c: 0.60-0.74)',
            '      • Definition: Positive relations, cooperative on most issues, growing',
            '        economic ties, strategic partnerships',
            '      • Real-World Examples:',
            '        - US-Japan: Security alliance, major trade partner, technology cooperation',
            '        - US-South Korea: Military alliance, semiconductor supply chain',
            '        - US-India: QUAD member, growing defense ties, IT services partnership',
            '      • Characteristics:',
            '        - Strategic partnerships without formal alliances',
            '        - Regular diplomatic engagement (60-80% voting alignment)',
            '        - Substantial trade (5-15% of GDP)',
            '        - Cooperation on specific issues (security, technology)',
            '      • Risk Impact: LOW - Moderate alignment provides some risk buffer',
            '      • Business Implications:',
            '        - Generally stable environment',
            '        - Occasional policy differences',
            '        - Growing market access',
            '        - Technology transfer opportunities',
            '',
            '   C. NEUTRAL (A_c: 0.45-0.59)',
            '      • Definition: Pragmatic relations, selective cooperation, balanced',
            '        approach, independent foreign policy',
            '      • Real-World Examples:',
            '        - US-Brazil: Trade partners, occasional policy differences',
            '        - US-Indonesia: ASEAN member, balanced foreign policy',
            '        - US-Mexico: USMCA partner, immigration tensions',
            '      • Characteristics:',
            '        - Issue-based cooperation (45-60% voting alignment)',
            '        - Independent foreign policy',
            '        - Diverse partnerships (not exclusively aligned)',
            '        - Moderate trade (2-5% of GDP)',
            '      • Risk Impact: MODERATE - Minimal alignment effect on risk profile',
            '      • Business Implications:',
            '        - Standard country risk applies',
            '        - Monitor bilateral developments',
            '        - Diversification recommended',
            '        - Policy uncertainty possible',
            '',
            '   D. COMPETITIVE (A_c: 0.25-0.44)',
            '      • Definition: Strategic rivalry, competing interests, limited cooperation,',
            '        divergent policy goals',
            '      • Real-World Examples:',
            '        - US-China: Trade war, technology competition, South China Sea tensions',
            '        - India-China: Border disputes, regional rivalry, BRI concerns',
            '        - Japan-China: Historical tensions, Senkaku Islands, regional competition',
            '      • Characteristics:',
            '        - Economic competition (25-45% voting alignment)',
            '        - Divergent strategic interests',
            '        - Occasional tensions',
            '        - Significant trade despite political differences',
            '      • Risk Impact: HIGH - Competition increases geopolitical risk exposure',
            '      • Business Implications:',
            '        - Trade policy uncertainty',
            '        - Technology transfer restrictions',
            '        - Market access challenges',
            '        - Supply chain vulnerabilities',
            '        - Regulatory scrutiny',
            '',
            '   E. ADVERSARIAL (A_c: 0.0-0.24)',
            '      • Definition: Hostile relations, sanctions, trade restrictions, security',
            '        tensions, diplomatic isolation',
            '      • Real-World Examples:',
            '        - US-Russia: Sanctions, Ukraine conflict, NATO expansion tensions',
            '        - US-Iran: Comprehensive sanctions, nuclear program disputes',
            '        - US-North Korea: Nuclear weapons program, diplomatic isolation',
            '      • Characteristics:',
            '        - Hostile policies (<25% voting alignment)',
            '        - Sanctions regimes in place',
            '        - Diplomatic isolation',
            '        - Military tensions',
            '        - Minimal trade',
            '      • Risk Impact: VERY HIGH - Adversarial relationship significantly amplifies risk',
            '      • Business Implications:',
            '        - Sanctions exposure',
            '        - Asset seizure risk',
            '        - Market access denial',
            '        - Heightened geopolitical tensions',
            '        - Compliance challenges',
            '',
            '⚡ 4. AMPLIFIER INTERPRETATION',
            '   ═══════════════════════════════════════════════════════════════════════════',
            '',
            '   Amplifier Range and Impact:',
            '',
            '   • No Amplification (1.0x): A_c = 1.0 (Allied/Same Country)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 1.0) = 1.0',
            '     - Impact: No risk amplification',
            '     - Interpretation: Strong political alignment mitigates geopolitical risk',
            '',
            '   • Minimal Amplification (1.00-1.10x): A_c = 0.80-1.0 (Allied)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 0.80) = 1.10',
            '     - Impact: 0-10% risk increase',
            '     - Interpretation: Very strong alignment, minimal additional risk',
            '',
            '   • Low Amplification (1.10-1.20x): A_c = 0.60-0.80 (Friendly)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 0.60) = 1.20',
            '     - Impact: 10-20% risk increase',
            '     - Interpretation: Positive relations provide some risk buffer',
            '',
            '   • Moderate Amplification (1.20-1.30x): A_c = 0.40-0.60 (Neutral)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 0.40) = 1.30',
            '     - Impact: 20-30% risk increase',
            '     - Interpretation: Neutral stance means standard country risk applies',
            '',
            '   • High Amplification (1.30-1.40x): A_c = 0.20-0.40 (Competitive)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 0.20) = 1.40',
            '     - Impact: 30-40% risk increase',
            '     - Interpretation: Strategic competition amplifies geopolitical risk',
            '',
            '   • Maximum Amplification (1.40-1.50x): A_c = 0.0-0.20 (Adversarial)',
            '     - Formula: 1.0 + 0.5 × (1.0 - 0.0) = 1.50',
            '     - Impact: 40-50% risk increase',
            '     - Interpretation: Adversarial relationship significantly amplifies risk',
            '',
            '═══════════════════════════════════════════════════════════════════════════════',
            '   COUNTRY-BY-COUNTRY DETAILED CALCULATIONS',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            ...countryExposures.map(exp => {
              if (exp.politicalAlignment) {
                const pa = exp.politicalAlignment;
                const alignmentFactor = pa.alignmentFactor;
                const amplifier = 1.0 + 0.5 * (1.0 - alignmentFactor);
                const baseContrib = exp.exposureWeight * exp.countryShockIndex;
                const finalContrib = baseContrib * amplifier;
                
                let relationshipDetail: string;
                if (alignmentFactor >= 0.75) {
                  relationshipDetail = 'ALLIED: Strong diplomatic ties, shared security interests, deep economic integration';
                } else if (alignmentFactor >= 0.60) {
                  relationshipDetail = 'FRIENDLY: Positive relations, cooperative on most issues, growing economic ties';
                } else if (alignmentFactor >= 0.45) {
                  relationshipDetail = 'NEUTRAL: Pragmatic relations, selective cooperation, balanced approach';
                } else if (alignmentFactor >= 0.25) {
                  relationshipDetail = 'COMPETITIVE: Strategic rivalry, competing interests, limited cooperation';
                } else {
                  relationshipDetail = 'ADVERSARIAL: Hostile relations, sanctions, trade restrictions, security tensions';
                }
                
                let businessImplications: string;
                if (alignmentFactor >= 0.75) {
                  businessImplications = 'Stable regulatory environment, predictable policy framework, low expropriation risk, favorable trade terms';
                } else if (alignmentFactor >= 0.60) {
                  businessImplications = 'Generally stable environment, occasional policy differences, growing market access, technology transfer opportunities';
                } else if (alignmentFactor >= 0.45) {
                  businessImplications = 'Standard country risk applies, monitor bilateral developments, diversification recommended, policy uncertainty possible';
                } else if (alignmentFactor >= 0.25) {
                  businessImplications = 'Trade policy uncertainty, technology transfer restrictions, market access challenges, supply chain vulnerabilities, regulatory scrutiny';
                } else {
                  businessImplications = 'Sanctions exposure, asset seizure risk, market access denial, heightened geopolitical tensions, compliance challenges';
                }
                
                return `\n${'─'.repeat(80)}\n` +
                  `📍 ${exp.country.toUpperCase()}\n` +
                  `${'─'.repeat(80)}\n` +
                  `\n📊 BASIC EXPOSURE DATA:\n` +
                  `   Normalized Weight: ${(exp.exposureWeight * 100).toFixed(4)}%\n` +
                  `   Country Shock Index (CSI): ${exp.countryShockIndex.toFixed(1)}\n` +
                  `\n🌐 POLITICAL ALIGNMENT DETAILS:\n` +
                  `   Alignment Factor (A_c): ${alignmentFactor.toFixed(4)}\n` +
                  `   Relationship Type: ${pa.relationship.toUpperCase()}\n` +
                  `   Relationship Detail: ${relationshipDetail}\n` +
                  `   Data Sources: ${pa.source}\n` +
                  `\n📚 DATA SOURCE BREAKDOWN:\n` +
                  `   • UN Voting Records: Diplomatic alignment measurement\n` +
                  `   • Alliance Memberships: Shared security frameworks and institutional cooperation\n` +
                  `   • Economic Ties: Trade and investment interdependence (IMF DOTS, CPIS, OECD FDI)\n` +
                  `\n⚡ RISK AMPLIFICATION CALCULATION:\n` +
                  `   Step 1: Calculate Alignment Amplifier\n` +
                  `   Formula: Amplifier = 1.0 + 0.5 × (1.0 - A_c)\n` +
                  `   Amplifier = 1.0 + 0.5 × (1.0 - ${alignmentFactor.toFixed(4)})\n` +
                  `   Amplifier = 1.0 + 0.5 × ${(1.0 - alignmentFactor).toFixed(4)}\n` +
                  `   Amplifier = 1.0 + ${(0.5 * (1.0 - alignmentFactor)).toFixed(4)}\n` +
                  `   ✅ Alignment Amplifier = ${amplifier.toFixed(4)}\n` +
                  `\n💰 CONTRIBUTION CALCULATION:\n` +
                  `   Step 2: Calculate Base Contribution (without political alignment)\n` +
                  `   Formula: Base Contribution = Weight × CSI\n` +
                  `   Base Contribution = ${(exp.exposureWeight * 100).toFixed(4)}% × ${exp.countryShockIndex.toFixed(1)}\n` +
                  `   Base Contribution = ${baseContrib.toFixed(4)}\n` +
                  `\n   Step 3: Apply Political Alignment Amplifier\n` +
                  `   Formula: Final Contribution = Base × Amplifier\n` +
                  `   Final Contribution = ${baseContrib.toFixed(4)} × ${amplifier.toFixed(4)}\n` +
                  `   ✅ Final Contribution = ${finalContrib.toFixed(4)}\n` +
                  `\n📈 IMPACT ANALYSIS:\n` +
                  `   • Without Political Alignment: ${baseContrib.toFixed(4)} points\n` +
                  `   • Political Alignment Effect: ${((finalContrib - baseContrib) >= 0 ? '+' : '')}${(finalContrib - baseContrib).toFixed(4)} points (${((amplifier - 1) * 100).toFixed(1)}% ${amplifier > 1 ? 'increase' : 'decrease'})\n` +
                  `   • Total Contribution to CO-GRI: ${finalContrib.toFixed(4)} points\n` +
                  `\n🎯 BUSINESS IMPLICATIONS:\n` +
                  `   ${businessImplications}\n`;
              }
              return `\n${'─'.repeat(80)}\n` +
                `📍 ${exp.country.toUpperCase()}\n` +
                `${'─'.repeat(80)}\n` +
                `   Normalized Weight: ${(exp.exposureWeight * 100).toFixed(4)}%\n` +
                `   Country Shock Index: ${exp.countryShockIndex.toFixed(1)}\n` +
                `   Contribution: ${exp.contribution.toFixed(4)}\n` +
                `   (No political alignment data available)\n`;
            })
          ]
        },
        {
          stepNumber: '5',
          title: 'Raw CO-GRI Score Aggregation',
          formula: 'Raw_Score = Σ(Contribution_c)',
          values: {
            'Sum of Contributions': rawScore.toFixed(4),
            'Number of Countries': countryExposures.length,
            'Weighted Average CSI': rawScore.toFixed(2)
          },
          result: `Raw CO-GRI Score = ${rawScore.toFixed(2)}`,
          detailedCalculations: [
            '═══ SUMMING ALL CONTRIBUTIONS ═══',
            '',
            ...countryExposures.map(exp => `${exp.country}: ${exp.contribution.toFixed(4)}`),
            '',
            `Total: ${rawScore.toFixed(4)}`
          ]
        },
        {
          stepNumber: '6',
          title: 'Sector Risk Adjustment',
          formula: 'Final_Score = Raw_Score × M_sector',
          values: {
            'Raw Score': rawScore.toFixed(4),
            'Sector': geoData.sector || 'Unknown',
            'Sector Multiplier (M_sector)': sectorMultiplier.toFixed(4),
            'Final Score (Rounded)': finalScore.toFixed(1)
          },
          result: `Final CO-GRI Score = ${finalScore} (${riskLevel})`,
          detailedCalculations: [
            `Calculation: ${rawScore.toFixed(4)} × ${sectorMultiplier.toFixed(4)} = ${(rawScore * sectorMultiplier).toFixed(4)}`,
            `Rounded to one decimal: ${finalScore}`
          ]
        }
      ];

      const dataSources: DataSource[] = [
        {
          name: 'Four-Channel Exposure Framework (Phase 3.4)',
          description: 'Revenue (40%), Supply Chain (35%), Physical Assets (15%), Financial (10%). Market channel removed from exposure calculation.'
        },
        {
          name: 'Political Alignment Factor (A_c) - Comprehensive Analysis',
          description: 'UN General Assembly voting similarity (Harvard Dataverse), Treaty & alliance networks (NATO, SCO, BRICS, QUAD, USMCA, AUKUS), Bilateral economic dependence (IMF DOTS, IMF CPIS, OECD trade/FDI flows). Applied as contribution amplifier with detailed mathematical calculations and comprehensive rationale: Contribution = W × S_c × (1.0 + 0.5*(1.0 – A_c))'
        },
        {
          name: 'Alliance & Treaty Memberships',
          description: 'NATO, QUAD, AUKUS, USMCA, EU, BRICS, SCO, ASEAN, GCC, MERCOSUR, African Union membership data'
        },
        {
          name: 'UN Voting Patterns',
          description: 'UN General Assembly voting similarity scores (Harvard Dataverse), measuring diplomatic alignment between countries',
          url: 'https://dataverse.harvard.edu/dataverse/harvard'
        },
        {
          name: 'Economic Interdependence',
          description: 'IMF Direction of Trade Statistics (DOTS), IMF Coordinated Portfolio Investment Survey (CPIS), OECD bilateral trade and FDI flow data',
          url: 'https://data.imf.org/'
        },
        {
          name: 'SEC Filings - Comprehensive Multi-Channel Data Source',
          description: 'PRIMARY DATA SOURCE FOR ALL CHANNELS: 10-K/20-F, 10-Q, 8-K, DEF 14A, EX-21, EX-10, EX-99',
          url: 'https://www.sec.gov/edgar/searchedgar/companysearch.html'
        }
      ];

      if (geoData.dataSource) {
        dataSources.push({
          name: geoData.dataSource,
          description: 'Primary data source for geographic exposure'
        });
      }

      setExpandedSteps({});
      
      setResult({
        company: geoData.company || tickerToSearch.toUpperCase(),
        symbol: tickerToSearch.toUpperCase(),
        sector: geoData.sector || 'Unknown',
        sectorMultiplier: sectorMultiplier,
        geopoliticalRiskScore: finalScore,
        riskLevel: riskLevel,
        countryExposures: countryExposures,
        calculationSteps: calculationSteps,
        dataSources: dataSources,
        keyRisks: keyRisks,
        recommendations: recommendations,
        rawScore: rawScore,
        hasVerifiedData: geoData.hasVerifiedData || false,
        geoDataSource: geoData.dataSource || 'Fallback Template',
        hasDetailedComponents: geoData.hasDetailedComponents,
        sectorClassificationConfidence: geoData.sectorClassificationConfidence,
        sectorClassificationSources: geoData.sectorClassificationSources,
        homeCountry: geoData.homeCountry,
        channelBreakdown: geoData.channelBreakdown,
        exposureCoefficients: exposureCoefficients,
        adrResolution: geoData.adrResolution
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during assessment');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const getDisplayCountryExposures = (exposures: CountryExposure[]) => {
    const sorted = [...exposures].sort((a, b) => b.contribution - a.contribution);
    const displayExposures = sorted.slice(0, 15);
    const otherExposures = sorted.slice(15);
    
    if (otherExposures.length > 0) {
      const otherTotal = otherExposures.reduce((sum, exp) => ({
        exposureWeight: sum.exposureWeight + exp.exposureWeight,
        contribution: sum.contribution + exp.contribution
      }), { exposureWeight: 0, contribution: 0 });

      const avgCSI = otherTotal.contribution / otherTotal.exposureWeight;

      displayExposures.push({
        country: `Other (${otherExposures.length} countries)`,
        exposureWeight: otherTotal.exposureWeight,
        countryShockIndex: avgCSI,
        contribution: otherTotal.contribution
      });
    }
    
    return { displayExposures, otherCount: otherExposures.length };
  };

  const generatePDFReport = () => {
    if (!result) return;

    const doc = new jsPDF() as AutoTableDoc;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 20;

    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title: string) => {
      checkNewPage(15);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 30, 46);
      doc.text(title, margin, yPos);
      yPos += 10;
      doc.setTextColor(0, 0, 0);
    };

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 30, 46);
    doc.text('CO-GRI Assessment Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('CedarOwl Geopolitical Risk Index (Phase 3.4)', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Company Information', margin + 5, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Company: ${result.company}`, margin + 5, yPos + 16);
    doc.text(`Symbol: ${result.symbol}`, margin + 5, yPos + 23);
    doc.text(`Sector: ${result.sector}`, margin + 5, yPos + 30);
    yPos += 45;

    doc.setFillColor(15, 30, 46);
    doc.rect(margin, yPos, contentWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`CO-GRI Score: ${result.geopoliticalRiskScore}`, pageWidth / 2, yPos + 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Risk Level: ${result.riskLevel}`, pageWidth / 2, yPos + 28, { align: 'center' });
    yPos += 50;

    doc.setTextColor(0, 0, 0);

    addSectionHeader('Assessment Summary (Phase 3.4)');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = [
      `Raw Score: ${result.rawScore.toFixed(2)}`,
      `Sector Multiplier: ${result.sectorMultiplier.toFixed(2)}`,
      `Final Score: ${result.geopoliticalRiskScore}`,
      `Data Source: ${result.geoDataSource}`,
      `Home Country: ${result.homeCountry || 'N/A'}`,
      `Verified Data: ${result.hasVerifiedData ? 'Yes' : 'No'}`
    ];
    
    if (result.adrResolution?.isADR) {
      summaryLines.push(`ADR Resolution: ${result.adrResolution.confidence} confidence (${result.adrResolution.source})`);
    }
    
    summaryLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    yPos += 5;

    doc.addPage();
    yPos = 20;
    addSectionHeader('Geographic Exposure Breakdown');

    const { displayExposures } = getDisplayCountryExposures(result.countryExposures);
    const tableData = displayExposures.map(exp => [
      exp.country,
      `${(exp.exposureWeight * 100).toFixed(2)}%`,
      exp.countryShockIndex.toFixed(1),
      exp.contribution.toFixed(2),
      exp.status ? (
        exp.status === 'evidence' ? 'Evidence' : 
        exp.status === 'high_confidence_estimate' ? 'High Confidence' :
        exp.status === 'known_zero' ? 'Known Zero' : 'Fallback'
      ) : 'N/A',
      exp.fallbackType || 'none',
      exp.politicalAlignment ? `${exp.politicalAlignment.alignmentFactor.toFixed(2)} (${exp.politicalAlignment.relationship})` : 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'Exposure %', 'CSI', 'Contribution', 'Status', 'Fallback', 'Alignment']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 30, 46],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Fallback Types: SSF=Segment-Specific (Blue), RF=Restricted (Yellow), GF=Global (Red), none=Direct Evidence (Green)', margin, yPos);
    yPos += 15;

    doc.save(`COGRI_Phase3_Assessment_${result.symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const renderCalculationStep = (step: CalculationStep, stepKey: string, depth: number = 0) => {
    const hasSubsteps = step.substeps && Array.isArray(step.substeps) && step.substeps.length > 0;
    const hasDetailedCalcs = step.detailedCalculations && Array.isArray(step.detailedCalculations) && step.detailedCalculations.length > 0;
    const isExpanded = expandedSteps[stepKey];
    const indentClass = depth > 0 ? 'ml-6' : '';
    
    return (
      <div key={stepKey} className={`${indentClass}`}>
        <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">{step.stepNumber}: {step.title}</h4>
              <p className="text-gray-200 text-sm font-mono mb-2">📐 {step.formula}</p>
            </div>
            {(hasDetailedCalcs || hasSubsteps) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStep(stepKey)}
                className="text-gray-200 hover:text-white"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
          
          {Object.keys(step.values).length > 0 && (
            <div className="bg-[#0d5f5f]/30 rounded p-3 mb-2">
              {Object.entries(step.values).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-200">{key}:</span>
                  <span className="text-white font-mono">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-green-900/30 border border-green-700 rounded p-2 mt-2">
            <p className="text-green-300 font-semibold">✓ {step.result}</p>
          </div>
          
          {isExpanded && hasDetailedCalcs && (
            <div className="mt-3 pl-4 border-l-2 border-[#0d5f5f]/50">
              <p className="text-gray-300 text-xs mb-2 font-semibold">📊 Detailed Breakdown:</p>
              <div className="space-y-1">
                {step.detailedCalculations!.map((calc, idx) => (
                  calc ? <p key={idx} className="text-gray-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">{calc}</p> : null
                ))}
              </div>
            </div>
          )}
          
          {isExpanded && hasSubsteps && (
            <div className="mt-3">
              {step.substeps!.map((substep, idx) => 
                renderCalculationStep(substep, `${stepKey}-${idx}`, depth + 1)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCompanySelect = (company: CompanySearchResult) => {
    setShowSearchResults(false);
    setTicker(company.symbol);
    
    setTimeout(() => {
      handleSearch(company.symbol);
    }, 0);
  };

  const handleDownloadFallbackSummary = () => {
    if (!result) return;
    
    const summary = generateFallbackSummary(
      result.symbol,
      result.company,
      result.sector,
      result.countryExposures,
      result.channelBreakdown
    );
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fallback_Summary_${result.symbol}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      <header className="bg-[#0d5f5f] py-4 px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <a href="/" className="inline-block">
            <Button variant="ghost" className="text-white hover:bg-[#0a4d4d] gap-2">
              <img 
                src="/logocedarowl updated (8).png" 
                alt="CedarOwl Logo" 
                className="h-8 w-8"
                onError={(e) => {
                  e.currentTarget.src = 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png';
                }}
              />
              <span className="font-semibold">Back to Home</span>
            </Button>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            CedarOwl Geopolitical Risk Index
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Comprehensive country-level geopolitical risk assessment with political alignment factors
          </p>
        </div>

        <Card className="max-w-4xl mx-auto mb-8 bg-[#0f1e2e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Assess a Company or Ticker</CardTitle>
            <CardDescription className="text-gray-200">
              Enter a stock ticker symbol to calculate its geopolitical risk exposure with three-tier fallback analysis
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
                    'Run CO-GRI Assessment'
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
                
                {ticker && ticker.length > 0 && searchResults && Array.isArray(searchResults) && searchResults.length === 0 && !showSearchResults && !loading && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a2332] border border-gray-700 rounded-md shadow-lg p-4">
                    <p className="text-gray-200 text-sm">Start typing to search</p>
                    <p className="text-gray-400 text-xs mt-1">Or type a ticker and press Enter</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-200">
                Supports 70+ global exchanges. Add exchange suffix if needed (e.g., .TO for TSX, .L for LSE)
              </p>

              <div className="mt-6 p-4 bg-[#1a2332] rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">Supported Markets & Exchanges:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SUPPORTED_COUNTRIES.map((country, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0d5f5f]/20 flex items-center justify-center">
                        <span className="text-xs">🌍</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{country.name}</p>
                        <p className="text-xs text-gray-200 truncate">{country.exchanges}</p>
                        {country.tickerSuffix && (
                          <p className="text-xs text-[#0d5f5f]">Suffix: {country.tickerSuffix}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="inline-block">
                    <div className={`${getRiskColor(result.riskLevel)} text-white px-6 py-3 rounded-lg mb-4`}>
                      <div className="text-5xl font-bold mb-2">{result.geopoliticalRiskScore}</div>
                      <div className="text-lg font-semibold">{result.riskLevel}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Company</div>
                      <div className="text-white font-semibold">{result.company}</div>
                    </div>
                    <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                      <div className="text-gray-200">Ticker</div>
                      <div className="text-white font-semibold">{result.symbol}</div>
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
                      <div className="text-gray-200">Sector Multiplier</div>
                      <div className="text-white font-semibold">{result.sectorMultiplier.toFixed(2)}x</div>
                    </div>
                  </div>
                  
                  {result.adrResolution?.isADR && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        ⭐ ADR Detected: Home country resolved with {result.adrResolution.confidence} confidence ({result.adrResolution.source})
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <p className="text-purple-300 text-sm font-semibold">
                      🆕 Phase 3.4: Four-Channel Exposure + Advanced Multi-Tier Fallback System
                    </p>
                    <p className="text-purple-200 text-xs mt-1">
                      🔵 SSF (Segment-Specific) • 🟡 RF (Restricted) • 🔴 GF (Global) • ✅ Direct Evidence
                    </p>
                    <p className="text-purple-200 text-xs mt-1">
                      Revenue=Penetration×GDP, Supply=ImportIntensity×Assembly, Assets=GDP×AssetIntensity, Financial=FinancialDepth×Currency
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-center gap-4">
                    <Button
                      onClick={generatePDFReport}
                      className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Phase 3.4 Report
                    </Button>
                    <Button
                      onClick={handleDownloadFallbackSummary}
                      variant="outline"
                      className="border-[#0d5f5f] text-[#0d5f5f] hover:bg-[#0d5f5f]/10 gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Download Fallback Summary
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Geographic Exposure Breakdown with Fallback Type Indicators</CardTitle>
                <CardDescription className="text-gray-200">
                  Country-level blended exposure weights with advanced multi-tier fallback system (SSF/RF/GF/EF) and political alignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-200 font-semibold">Country</th>
                        <th className="text-right py-3 px-4 text-gray-200 font-semibold">Exposure %</th>
                        <th className="text-right py-3 px-4 text-gray-200 font-semibold">CSI</th>
                        <th className="text-center py-3 px-4 text-gray-200 font-semibold">Fallback Type</th>
                        <th className="text-center py-3 px-4 text-gray-200 font-semibold">Political Alignment</th>
                        <th className="text-right py-3 px-4 text-gray-200 font-semibold">Contribution</th>
                        <th className="text-center py-3 px-4 text-gray-200 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const { displayExposures } = getDisplayCountryExposures(result.countryExposures);
                        return displayExposures.map((exp, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-[#1a2332]">
                            <td className="py-3 px-4 text-white">{exp.country}</td>
                            <td className="py-3 px-4 text-right text-white font-mono">
                              {(exp.exposureWeight * 100).toFixed(2)}%
                            </td>
                            <td className="py-3 px-4 text-right text-white font-mono">
                              {exp.countryShockIndex.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {exp.fallbackType ? (
                                <div className="inline-flex items-center gap-1">
                                  <span 
                                    className={`px-2 py-1 rounded text-xs font-semibold border ${getFallbackTypeBadgeColor(exp.fallbackType)}`}
                                    title={getFallbackTypeDescription(exp.fallbackType)}
                                  >
                                    {getFallbackTypeIcon(exp.fallbackType)} {exp.fallbackType}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {exp.politicalAlignment ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-white font-mono text-xs">
                                    {getAlignmentIcon(exp.politicalAlignment.relationship)} {exp.politicalAlignment.alignmentFactor.toFixed(2)}
                                  </span>
                                  <span className="text-gray-300 text-xs">
                                    {exp.politicalAlignment.relationship}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono" style={{ color: getContributionColor(exp.contribution) }}>
                              {exp.contribution.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {exp.status && (
                                <span title={exp.status}>{getStatusIcon(exp.status)}</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-xs text-gray-200 space-y-1">
                  <p className="font-semibold">Status Legend:</p>
                  <p>✅ Evidence: Data from verified sources (financial reports, SEC filings)</p>
                  <p>⭐ High Confidence: ADR-resolved home country with high confidence</p>
                  <p>🔒 Known Zero: Confirmed zero exposure from authoritative data</p>
                  <p>📊 Fallback: Estimated using three-tier fallback system</p>
                  <p className="mt-2 font-semibold">Fallback Type Legend:</p>
                  <p>🔵 SSF (Segment-Specific): Region membership fully known, IndustryDemandProxy within defined region (Highest confidence)</p>
                  <p>🟡 RF (Restricted): Partial geographic information, sector-specific plausibility within restricted set P (Medium confidence)</p>
                  <p>🔴 GF (Global): No geographic information, GDP × SectorPrior across global universe (Lowest confidence)</p>
                  <p>✅ None: Direct evidence from structured tables or narrative sources, no fallback needed</p>
                  <p className="mt-2 font-semibold">Political Alignment Legend:</p>
                  <p>🤝 Allied (0.75-1.0) | 😊 Friendly (0.60-0.74) | 😐 Neutral (0.45-0.59) | ⚔️ Competitive (0.25-0.44) | ⚠️ Adversarial (0.0-0.24) | 🏠 Same Country (1.0)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Risk Contributors</CardTitle>
                <CardDescription className="text-gray-200">
                  Countries with highest geopolitical risk contribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...result.countryExposures]
                        .sort((a, b) => b.contribution - a.contribution)
                        .slice(0, 10)
                        .map(exp => ({
                          country: exp.country,
                          contribution: parseFloat(exp.contribution.toFixed(2)),
                          fill: getContributionColor(exp.contribution)
                        }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="country" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        label={{ value: 'Risk Contribution', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a2332', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="contribution" radius={[8, 8, 0, 0]}>
                        {result.countryExposures
                          .sort((a, b) => b.contribution - a.contribution)
                          .slice(0, 10)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getContributionColor(entry.contribution)} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detailed Calculation Steps (Phase 3.4 - Advanced Multi-Tier Fallback)</CardTitle>
                <CardDescription className="text-gray-200">
                  Complete step-by-step breakdown following the four-channel exposure framework with advanced multi-tier fallback system (SSF/RF/GF/EF). Click to expand each step for detailed mathematical calculations and comprehensive rationale.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.calculationSteps.map((step, index) => 
                    renderCalculationStep(step, `step-${index}`)
                  )}
                </div>
              </CardContent>
            </Card>

            {result.channelBreakdown && Object.keys(result.channelBreakdown).length > 0 && (
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Four-Channel Exposure Analysis with Fallback Type Indicators</CardTitle>
                  <CardDescription className="text-gray-200">
                    Detailed breakdown by exposure channel with three-tier fallback system: Revenue, Operations, Supply Chain, Assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-200">Country</th>
                          <th className="text-center py-2 px-3 text-gray-200">Revenue</th>
                          <th className="text-center py-2 px-3 text-gray-200">Operations</th>
                          <th className="text-center py-2 px-3 text-gray-200">Supply</th>
                          <th className="text-center py-2 px-3 text-gray-200">Assets</th>
                          <th className="text-center py-2 px-3 text-gray-200 font-bold">Blended</th>
                          <th className="text-center py-2 px-3 text-gray-200">Alignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.channelBreakdown)
                          .sort(([, a], [, b]) => b.blended - a.blended)
                          .slice(0, 15)
                          .map(([country, channels], index) => (
                            <tr key={index} className="border-b border-gray-700 hover:bg-[#1a2332]">
                              <td className="py-2 px-3 text-white">{country}</td>
                              {['revenue', 'operations', 'supply', 'assets'].map(channel => {
                                const channelData = channels[channel as keyof typeof channels] as ChannelData | undefined;
                                return (
                                  <td key={channel} className="py-2 px-3 text-center">
                                    {channelData && typeof channelData === 'object' && 'weight' in channelData ? (
                                      <div className="inline-flex flex-col items-center gap-1">
                                        <span className="text-white font-mono">
                                          {(channelData.weight * 100).toFixed(1)}%
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span title={channelData.status}>
                                            {getStatusIcon(channelData.status)}
                                          </span>
                                          {channelData.fallbackType && (
                                            <span title={getFallbackTypeDescription(channelData.fallbackType)}>
                                              {getFallbackTypeIcon(channelData.fallbackType)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-3 text-center">
                                <span className="text-white font-mono font-bold">
                                  {(channels.blended * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {channels.politicalAlignment ? (
                                  <span className="text-white font-mono text-xs" title={channels.politicalAlignment.source}>
                                    {getAlignmentIcon(channels.politicalAlignment.relationship)} {channels.politicalAlignment.alignmentFactor.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-gray-200 space-y-1">
                    <p className="font-semibold">Legend:</p>
                    <p>✅ Evidence | ⭐ High Confidence | 🔒 Known Zero | 📊 Fallback</p>
                    <p>🔵 SSF (Segment-Specific) | 🟡 RF (Restricted) | 🔴 GF (Global) | ✅ None (Direct Evidence)</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Key Geopolitical Risks (Expert Analysis)</CardTitle>
                <CardDescription className="text-gray-200">
                  Comprehensive risk assessment integrating insights from BlackRock, Sean Foo, Michael Every, Alex Krainer, Louis-Vincent Gave, and Dr. Marc Faber
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {result.keyRisks.map((risk, index) => (
                    <div key={index} className="bg-[#1a2332] p-5 rounded-lg border border-gray-700">
                      <h4 className="text-white font-bold text-lg mb-3">{risk.description}</h4>
                      
                      <div className="mb-4">
                        <h5 className="text-gray-300 font-semibold text-sm mb-2">Summary:</h5>
                        <p className="text-gray-200 text-sm">{risk.detail}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-gray-300 font-semibold text-sm mb-2">Detailed Analysis & Expert Insights:</h5>
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{risk.elaboration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Risk Management Recommendations</CardTitle>
                <CardDescription className="text-gray-200">
                  Suggested actions to mitigate identified risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          rec.priority === 'High' ? 'bg-red-900/50 text-red-300' :
                          rec.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {rec.priority}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{rec.category}</h4>
                          <p className="text-gray-200 text-sm">{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Data Sources & Methodology (Phase 3.4 - Advanced Multi-Tier Fallback)</CardTitle>
                <CardDescription className="text-gray-200">
                  Comprehensive information sources used in this assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.dataSources.map((source, index) => (
                    <div key={index} className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
                      <h4 className="text-white font-semibold mb-2">{source.name}</h4>
                      <p className="text-gray-200 text-sm mb-2">{source.description}</p>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#0d5f5f] hover:text-[#0a4d4d] text-sm"
                        >
                          {source.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <footer className="bg-[#0f1e2e] border-t border-gray-700 py-6 px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-200 text-sm mb-4">
            <p>
              Powered by CedarOwl's Phase 3.4 Methodology: Four-Channel Exposure + Advanced Multi-Tier Fallback System
            </p>
            <p className="text-xs text-gray-300 mt-2">
              🔵 SSF (Segment-Specific) • 🟡 RF (Restricted) • 🔴 GF (Global) • ✅ Direct Evidence
            </p>
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-300">
            <a href="/diagnostic-test" className="hover:text-[#0d5f5f] transition-colors">
              🔧 Diagnostic Tool
            </a>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="text-center text-xs text-gray-400">
              <p className="mb-2 font-semibold">Disclaimer</p>
              <p className="max-w-4xl mx-auto leading-relaxed">
                This assessment is for informational purposes only and does not constitute financial, investment, or legal advice. 
                The CO-GRI methodology provides risk analysis based on publicly available data and should be used as one factor 
                among many in decision-making processes. CedarOwl makes no warranties regarding the accuracy or completeness of 
                the information provided. Users should conduct their own due diligence and consult with qualified professionals 
                before making any investment or business decisions. Past performance and risk assessments do not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}