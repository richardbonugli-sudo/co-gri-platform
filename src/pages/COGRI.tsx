/**
 * COGRI Assessment Page - HYBRID: Phase 1 + Phase 2 + Step-by-Step + V.4 Integration
 * 
 * This hybrid version includes:
 * - Phase 1: Enhanced sector multiplier validation & transparency
 * - Phase 2: Channel-specific multipliers, dynamic adjustments, ML calibration
 * - Step-by-Step: Detailed 7-step calculation breakdown with country analysis
 * - V.4 Integration: Automatic routing to V.4 or legacy based on feature flags
 * - SectorMultiplierCard component
 * - Feature flag control
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp, FileText, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

// Phase 1 imports
import { orchestrateCOGRICalculation, isEnhancedResult, type COGRICalculationResult } from '@/services/cogriCalculationOrchestrator';
import { SectorMultiplierCard } from '@/components/SectorMultiplierCard';
import { isFeatureEnabled, getCalculationMode, shouldUseV4, getV4RolloutStatus, getFeatureFlags } from '@/config/featureFlags';

// Phase 2 imports
import { ChannelRiskBreakdown } from '@/components/ChannelRiskBreakdown';
import { DynamicAdjustmentIndicator } from '@/components/DynamicAdjustmentIndicator';
import { MLCalibrationInsights } from '@/components/MLCalibrationInsights';
import { Phase2FeatureToggle } from '@/components/Phase2FeatureToggle';
import { calculateBlendedChannelMultiplier, type ChannelExposureData } from '@/services/channelMultiplierCalculation';
import { calculateChannelMultipliersWithDynamic } from '@/services/channelMultiplierCalculationWithDynamic';
import { mlPredictionService } from '@/services/mlPredictionService';
import { mlModelTrainer } from '@/services/mlModelTrainer';
import { mlHistoricalDataCollector } from '@/services/mlHistoricalDataCollector';

// Step-by-Step Breakdown import
import { StepByStepBreakdown } from '@/components/StepByStepBreakdown';

// V.4 Integration imports (PHASE 3 & 4)
import { getCompanyGeographicExposureV4 as getCompanyGeographicExposure, type CompanyGeographicData } from '@/services/v34ComprehensiveIntegrationV4';
import { hasV4Enhancements } from '@/data/enhancedCompanyExposures';

// Existing imports
import { COGRIVisualization } from '@/components/COGRIVisualization';
import { GeographicExposureTable } from '@/components/GeographicExposureTable';
import { ChannelBreakdownTable } from '@/components/ChannelBreakdownTable';
import { COGRIPDFExport } from '@/components/COGRIPDFExport';

// Type alias for backward compatibility
type GeographicExposureData = CompanyGeographicData;

// Types for calculation steps
interface CalculationStep {
  step: string;
  formula: string;
  values: Record<string, string | number>;
  result: number;
  explanation: string;
  countryDetails?: string;
}

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
  preNormalizedWeight?: number;
  politicalAlignment?: {
    alignmentFactor: number;
    relationship: string;
    source: string;
  };
  channelWeights?: {
    revenue: number;
    operations: number;
    supply: number;
    assets: number;
  };
  fallbackType?: string;
  status?: string;
}

interface ChannelData {
  weight: number;
  status?: string;
  fallbackType?: string;
}

interface ChannelBreakdown {
  [country: string]: {
    revenue?: ChannelData;
    operations?: ChannelData;
    supply?: ChannelData;
    assets?: ChannelData;
    blended: number;
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
  };
}

// Market data for supported exchanges
const SUPPORTED_MARKETS = [
  {
    country: 'United States',
    exchanges: 'NASDAQ, NYSE',
    suffix: null,
    color: 'bg-blue-500'
  },
  {
    country: 'Canada',
    exchanges: 'TSX, TSX Venture',
    suffix: 'Suffix: .TO, .V',
    color: 'bg-blue-500'
  },
  {
    country: 'United Kingdom',
    exchanges: 'LSE',
    suffix: 'Suffix: .L, .LON',
    color: 'bg-green-500'
  },
  {
    country: 'Brazil',
    exchanges: 'B3',
    suffix: 'Suffix: .SA',
    color: 'bg-orange-500'
  },
  {
    country: 'Hong Kong',
    exchanges: 'HKEX',
    suffix: 'Suffix: .HK',
    color: 'bg-red-500'
  },
  {
    country: 'Singapore',
    exchanges: 'SGX',
    suffix: 'Suffix: .SI',
    color: 'bg-purple-500'
  },
  {
    country: 'Taiwan',
    exchanges: 'TWSE',
    suffix: 'Suffix: .TW, .TWO',
    color: 'bg-blue-500'
  },
  {
    country: 'South Africa',
    exchanges: 'JSE',
    suffix: 'Suffix: .JO',
    color: 'bg-pink-500'
  }
];

// Helper functions for step-by-step breakdown
const getFallbackTypeIcon = (fallbackType?: string): string => {
  switch (fallbackType) {
    case 'SSF': return '🔵';
    case 'RF': return '🟡';
    case 'GF': return '🔴';
    case 'none': return '✅';
    default: return '❓';
  }
};

const generateStep1CountryDetails = (
  countryExposures: CountryExposure[],
  channelBreakdown: ChannelBreakdown | undefined,
  exposureCoefficients: { revenue: number; supply: number; assets: number; financial: number },
  sector: string
): string => {
  const totalCountries = countryExposures.length;
  let details = `\n\n📊 Enhanced Detailed Breakdown:\n\n`;
  details += `${'═'.repeat(79)}\n\n`;
  details += `   COMPREHENSIVE COUNTRY-BY-COUNTRY FOUR-CHANNEL EXPOSURE ANALYSIS\n\n`;
  details += `   WITH DETAILED RATIONALE, DATA SOURCES, FALLBACK TYPES, AND CALCULATIONS\n\n`;
  details += `${'═'.repeat(79)}\n\n`;

  countryExposures.forEach((exp, index) => {
    const channelData = channelBreakdown?.[exp.country];
    if (!channelData) return;

    details += `\n${'═'.repeat(80)}\n\n`;
    details += `COUNTRY ${index + 1} OF ${totalCountries}: ${exp.country.toUpperCase()}\n\n`;
    details += `${'═'.repeat(80)}\n\n`;

    if (channelData.revenue) {
      const revWeight = channelData.revenue.weight * 100;
      const revContribution = revWeight * exposureCoefficients.revenue;
      details += `\n🔍 REVENUE CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${revWeight.toFixed(4)}%\n\n`;
      details += `   Data Quality: ${channelData.revenue.status === 'evidence' ? '✅ EVIDENCE-BASED' : '📊 FALLBACK ESTIMATE'}\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.revenue.fallbackType)} ${channelData.revenue.fallbackType || 'none'}\n\n`;
      details += `   Primary Source: ${channelData.revenue.status === 'evidence' ? 'SEC 10-K Filing' : `Sector Analysis: ${sector} Revenue Pattern`}\n\n`;
      details += `\n   💰 REVENUE CHANNEL CALCULATION:\n\n`;
      details += `   Channel Coefficient (α): ${exposureCoefficients.revenue.toFixed(4)}\n\n`;
      details += `   Raw Channel Weight: ${revWeight.toFixed(6)}%\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.revenue.toFixed(4)} × ${revWeight.toFixed(6)}% = ${revContribution.toFixed(6)}%\n\n`;
    }

    if (channelData.operations) {
      const opsWeight = channelData.operations.weight * 100;
      const opsContribution = opsWeight * exposureCoefficients.financial;
      details += `\n🔍 OPERATIONS CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${opsWeight.toFixed(4)}%\n\n`;
      details += `   Fallback Type: ${getFallbackTypeIcon(channelData.operations.fallbackType)} ${channelData.operations.fallbackType || 'SSF'}\n\n`;
      details += `\n   🏭 OPERATIONS CHANNEL CALCULATION:\n\n`;
      details += `   Channel Coefficient (δ): ${exposureCoefficients.financial.toFixed(4)}\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.financial.toFixed(4)} × ${opsWeight.toFixed(6)}% = ${opsContribution.toFixed(6)}%\n\n`;
    }

    if (channelData.supply) {
      const supWeight = channelData.supply.weight * 100;
      const supContribution = supWeight * exposureCoefficients.supply;
      details += `\n🔍 SUPPLY CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${supWeight.toFixed(4)}%\n\n`;
      details += `\n   🚚 SUPPLY CHAIN CALCULATION:\n\n`;
      details += `   Channel Coefficient (β): ${exposureCoefficients.supply.toFixed(4)}\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.supply.toFixed(4)} × ${supWeight.toFixed(6)}% = ${supContribution.toFixed(6)}%\n\n`;
    }

    if (channelData.assets) {
      const assWeight = channelData.assets.weight * 100;
      const assContribution = assWeight * exposureCoefficients.assets;
      details += `\n🔍 ASSETS CHANNEL ANALYSIS FOR ${exp.country.toUpperCase()}:\n\n`;
      details += `   Raw Weight: ${assWeight.toFixed(4)}%\n\n`;
      details += `\n   🏢 PHYSICAL ASSETS CALCULATION:\n\n`;
      details += `   Channel Coefficient (γ): ${exposureCoefficients.assets.toFixed(4)}\n\n`;
      details += `   Weighted Contribution: ${exposureCoefficients.assets.toFixed(4)} × ${assWeight.toFixed(6)}% = ${assContribution.toFixed(6)}%\n\n`;
    }

    const revContrib = (channelData.revenue?.weight || 0) * exposureCoefficients.revenue;
    const opsContrib = (channelData.operations?.weight || 0) * exposureCoefficients.financial;
    const supContrib = (channelData.supply?.weight || 0) * exposureCoefficients.supply;
    const assContrib = (channelData.assets?.weight || 0) * exposureCoefficients.assets;
    const blendedWeight = (revContrib + opsContrib + supContrib + assContrib) * 100;

    details += `\n   ⚖️ FOUR-CHANNEL BLENDED WEIGHT CALCULATION:\n\n`;
    details += `   Formula: W_blended = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial\n\n`;
    details += `   W_blended = ${revContrib.toFixed(6)}% + ${supContrib.toFixed(6)}% + ${assContrib.toFixed(6)}% + ${opsContrib.toFixed(6)}%\n\n`;
    details += `   ✅ BLENDED WEIGHT = ${blendedWeight.toFixed(6)}%\n\n`;

    if (exp.politicalAlignment) {
      details += `\n   🌐 POLITICAL ALIGNMENT:\n\n`;
      details += `   Alignment Factor: ${exp.politicalAlignment.alignmentFactor.toFixed(4)}\n\n`;
      details += `   Relationship: ${exp.politicalAlignment.relationship.toUpperCase()}\n\n`;
    }
  });

  return details;
};

const generateStep2CountryDetails = (
  countryExposuresPreNorm: CountryExposure[],
  countryExposures: CountryExposure[],
  totalExposurePreNorm: number
): string => {
  const normalizationFactor = totalExposurePreNorm > 0 ? 1.0 / totalExposurePreNorm : 1.0;
  const preNormTotal = totalExposurePreNorm * 100;

  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  details += `Normalization Factor = 1 / ${preNormTotal.toFixed(4)}% = ${normalizationFactor.toFixed(6)}\n\n`;
  details += `${'═'.repeat(3)} COUNTRY-BY-COUNTRY NORMALIZATION ${'═'.repeat(3)}\n\n`;

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

const generateStep3CSIDetails = (countryExposures: CountryExposure[]): string => {
  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  countryExposures.forEach(ce => {
    details += `${ce.country}: CSI = ${ce.countryShockIndex.toFixed(1)}\n\n`;
  });
  return details;
};

const generateStep4PoliticalAlignmentDetails = (countryExposures: CountryExposure[]): string => {
  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  details += `${'═'.repeat(79)}\n\n`;
  details += `   POLITICAL ALIGNMENT ANALYSIS FOR EACH COUNTRY\n\n`;
  details += `${'═'.repeat(79)}\n\n`;

  countryExposures.forEach(ce => {
    const normalizedWeight = ce.exposureWeight * 100;
    const csi = ce.countryShockIndex;
    const alignmentFactor = ce.politicalAlignment?.alignmentFactor ?? 1.0;
    const relationship = ce.politicalAlignment?.relationship ?? 'neutral';

    const amplifier = 1.0 + 0.5 * (1.0 - alignmentFactor);
    const baseContribution = normalizedWeight * csi / 100;
    const finalContribution = baseContribution * amplifier;
    const alignmentEffect = finalContribution - baseContribution;

    details += `\n${ce.country.toUpperCase()}:\n`;
    details += `   Normalized Weight: ${normalizedWeight.toFixed(4)}%\n`;
    details += `   CSI: ${csi.toFixed(1)}\n`;
    details += `   Alignment Factor: ${alignmentFactor.toFixed(4)}\n`;
    details += `   Relationship: ${relationship.toUpperCase()}\n`;
    details += `   Amplifier: ${amplifier.toFixed(4)}\n`;
    details += `   Base Contribution: ${baseContribution.toFixed(4)}\n`;
    details += `   Final Contribution: ${finalContribution.toFixed(4)}\n`;
    details += `   Alignment Effect: ${alignmentEffect >= 0 ? '+' : ''}${alignmentEffect.toFixed(4)}\n\n`;
  });

  return details;
};

const generateStep5AggregationDetails = (countryExposures: CountryExposure[]): string => {
  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  countryExposures.forEach(ce => {
    details += `${ce.country}: ${ce.contribution.toFixed(4)}\n\n`;
  });
  const total = countryExposures.reduce((sum, ce) => sum + ce.contribution, 0);
  details += `Total: ${total.toFixed(4)}\n`;
  return details;
};

const generateStep6SectorAdjustmentDetails = (
  rawScore: number,
  sectorMultiplier: number,
  finalScore: number,
  riskLevel: string
): string => {
  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  const exactCalculation = rawScore * sectorMultiplier;
  details += `Calculation: ${rawScore.toFixed(4)} × ${sectorMultiplier.toFixed(4)} = ${exactCalculation.toFixed(4)}\n\n`;
  details += `Rounded to one decimal: ${finalScore.toFixed(1)}\n\n`;
  details += `Risk Level: ${riskLevel}\n`;
  return details;
};

const generateStep7MultiplierDetails = (
  rawScore: number,
  sectorMultiplier: number,
  finalScore: number
): string => {
  let details = `\n\n📊 Detailed Breakdown:\n\n`;
  details += `Raw Score: ${rawScore.toFixed(4)}\n`;
  details += `Sector Multiplier: ${sectorMultiplier.toFixed(4)}\n`;
  details += `Final Score: ${finalScore.toFixed(4)}\n`;
  return details;
};

export default function COGRI() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const getTickerFromSearch = () => {
    const params = new URLSearchParams(searchString);
    return params.get('ticker') || '';
  };

  const [ticker, setTicker] = useState(getTickerFromSearch());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<GeographicExposureData | null>(null);
  const [calculationResult, setCalculationResult] = useState<COGRICalculationResult | null>(null);
  const [calculationSteps, setCalculationSteps] = useState<CalculationStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  
  // PHASE 4: V.4 Status Tracking
  const [isV4Active, setIsV4Active] = useState(false);
  const [v4DataSource, setV4DataSource] = useState<string>('');
  
  // Phase 2: State for Phase 2 features
  const [phase2ChannelResult, setPhase2ChannelResult] = useState<any>(null);
  const [phase2DynamicResult, setPhase2DynamicResult] = useState<any>(null);
  const [phase2MLPrediction, setPhase2MLPrediction] = useState<any>(null);
  const [featureFlags, setFeatureFlags] = useState(getFeatureFlags());

  const calculationMode = getCalculationMode();
  const v4RolloutStatus = getV4RolloutStatus();

  useEffect(() => {
    const tickerParam = getTickerFromSearch();
    if (tickerParam && tickerParam !== ticker) {
      setTicker(tickerParam);
      handleAssessment(tickerParam);
    }
  }, [searchString]);

  const toggleStepExpansion = (stepIndex: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };
  
  const handleFeaturesChange = () => {
    setFeatureFlags(getFeatureFlags());
    // Re-run assessment if we have data
    if (geoData && calculationResult) {
      calculatePhase2Features(geoData, calculationResult);
    }
  };
  
  const calculatePhase2Features = async (data: GeographicExposureData, result: COGRICalculationResult) => {
    const flags = getFeatureFlags();
    
    // Reset Phase 2 results
    setPhase2ChannelResult(null);
    setPhase2DynamicResult(null);
    setPhase2MLPrediction(null);
    
    // Task 1: Channel-Specific Multipliers
    if (flags.enableChannelSpecificMultipliers && data.channelBreakdown) {
      try {
        const channelExposures: ChannelExposureData[] = Object.entries(data.channelBreakdown).flatMap(([country, channels]) => {
          const exposures: ChannelExposureData[] = [];
          
          if (channels.revenue) {
            exposures.push({
              channel: 'Revenue',
              exposureWeight: channels.revenue.weight,
              countries: [{ country, weight: channels.revenue.weight, riskScore: result.countryExposures.find(c => c.country === country)?.countryShockIndex || 50 }]
            });
          }
          
          if (channels.supply) {
            exposures.push({
              channel: 'Supply',
              exposureWeight: channels.supply.weight,
              countries: [{ country, weight: channels.supply.weight, riskScore: result.countryExposures.find(c => c.country === country)?.countryShockIndex || 50 }]
            });
          }
          
          if (channels.assets) {
            exposures.push({
              channel: 'Assets',
              exposureWeight: channels.assets.weight,
              countries: [{ country, weight: channels.assets.weight, riskScore: result.countryExposures.find(c => c.country === country)?.countryShockIndex || 50 }]
            });
          }
          
          if (channels.operations) {
            exposures.push({
              channel: 'Financial',
              exposureWeight: channels.operations.weight,
              countries: [{ country, weight: channels.operations.weight, riskScore: result.countryExposures.find(c => c.country === country)?.countryShockIndex || 50 }]
            });
          }
          
          return exposures;
        });
        
        // Aggregate by channel
        const aggregatedChannels: ChannelExposureData[] = ['Revenue', 'Supply', 'Assets', 'Financial'].map(channel => {
          const channelData = channelExposures.filter(e => e.channel === channel);
          const totalWeight = channelData.reduce((sum, e) => sum + e.exposureWeight, 0);
          const countries = channelData.flatMap(e => e.countries);
          
          return {
            channel,
            exposureWeight: totalWeight,
            countries
          };
        });
        
        const channelResult = calculateBlendedChannelMultiplier(aggregatedChannels);
        setPhase2ChannelResult(channelResult);
        
        // Task 2: Dynamic Adjustments
        if (flags.enableDynamicMultipliers) {
          const primaryCountry = result.countryExposures[0]?.country || data.homeCountry;
          const dynamicResult = calculateChannelMultipliersWithDynamic(
            aggregatedChannels,
            primaryCountry,
            data.sector || 'Unknown',
            ticker
          );
          setPhase2DynamicResult(dynamicResult);
        }
        
        // Task 3: ML Calibration
        if (flags.enableMLCalibration) {
          try {
            // Build training dataset and train model
            const dataset = mlHistoricalDataCollector.buildTrainingDataset();
            const model = mlModelTrainer.trainModel(dataset, 'ridge');
            mlPredictionService.loadModel(model);
            
            // Generate prediction
            const geographicExposure: Record<string, number> = {};
            result.countryExposures.forEach(ce => {
              geographicExposure[ce.country] = ce.exposureWeight;
            });
            
            const prediction = mlPredictionService.predictWithConfidence({
              ticker,
              sector: data.sector || 'Unknown',
              geographicExposure,
              activeEvents: [],
              marketConditions: { volatilityIndex: 18.5, currencyStress: 25.0 }
            });
            
            setPhase2MLPrediction(prediction);
          } catch (mlError) {
            console.error('[Phase 2 ML] Error generating prediction:', mlError);
          }
        }
      } catch (phase2Error) {
        console.error('[Phase 2] Error calculating features:', phase2Error);
      }
    }
  };

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
    setCalculationSteps([]);
    setIsV4Active(false);
    setV4DataSource('');
    setPhase2ChannelResult(null);
    setPhase2DynamicResult(null);
    setPhase2MLPrediction(null);

    try {
      console.log(`[COGRI V.4 Integration] Starting assessment for ${targetTicker}`);
      
      // PHASE 4: Check if V.4 will be used
      const willUseV4 = shouldUseV4(targetTicker) && hasV4Enhancements(targetTicker);
      console.log(`[COGRI V.4 Integration] Will use V.4: ${willUseV4}`);

      const data = await getCompanyGeographicExposure(targetTicker);
      setGeoData(data);
      
      // PHASE 4: Track V.4 status
      const usedV4 = data.dataSource?.includes('V.4') || false;
      setIsV4Active(usedV4);
      setV4DataSource(data.dataSource || 'Legacy v3.4');
      
      console.log(`[COGRI V.4 Integration] Geographic data retrieved`);
      console.log(`[COGRI V.4 Integration] V.4 Active: ${usedV4}`);
      console.log(`[COGRI V.4 Integration] Data Source: ${data.dataSource}`);

      // Phase 1: Use orchestrator for calculation
      const result = orchestrateCOGRICalculation({
        segments: data.segments,
        channelBreakdown: data.channelBreakdown,
        homeCountry: data.homeCountry,
        sector: data.sector,
        sectorMultiplier: data.sectorMultiplier || 1.0
      });

      setCalculationResult(result);
      
      // Phase 2: Calculate Phase 2 features
      await calculatePhase2Features(data, result);

      // Generate step-by-step breakdown
      const exposureCoefficients = {
        revenue: 0.40,
        supply: 0.35,
        assets: 0.15,
        financial: 0.10
      };

      const countryExposures: CountryExposure[] = result.countryExposures.map(exp => ({
        country: exp.country,
        exposureWeight: exp.exposureWeight,
        countryShockIndex: exp.countryShockIndex,
        contribution: exp.contribution,
        preNormalizedWeight: exp.exposureWeight,
        politicalAlignment: exp.politicalAlignment
      }));

      const steps: CalculationStep[] = [];

      // Step 1: Four-Channel Exposure
      const step1Details = generateStep1CountryDetails(
        countryExposures,
        data.channelBreakdown,
        exposureCoefficients,
        data.sector || 'Unknown'
      );

      steps.push({
        step: 'Step 1: Four-Channel Exposure Weight Calculation with v3.4 Enhanced Fallback Logic',
        formula: '📐 W_i,c = α×W_revenue + β×W_supply + γ×W_assets + δ×W_financial',
        values: {
          'Total Countries': countryExposures.length,
          'α (Revenue Coefficient)': exposureCoefficients.revenue,
          'β (Supply Chain Coefficient)': exposureCoefficients.supply,
          'γ (Assets Coefficient)': exposureCoefficients.assets,
          'δ (Financial Coefficient)': exposureCoefficients.financial
        },
        result: countryExposures.reduce((sum, ce) => sum + ce.exposureWeight, 0),
        explanation: `✓ Calculated four-channel blended exposure weights for ${countryExposures.length} countries`,
        countryDetails: step1Details
      });

      // Step 2: Normalization
      const totalExposurePreNorm = countryExposures.reduce((sum, ce) => sum + ce.exposureWeight, 0);
      const step2Details = generateStep2CountryDetails(countryExposures, countryExposures, totalExposurePreNorm);

      steps.push({
        step: '2: Exposure Normalization (v3.4)',
        formula: '📐 Normalized_W_i,c = W_i,c / Σ(W_i,c)',
        values: {
          'Pre-Normalization Total': `${(totalExposurePreNorm * 100).toFixed(4)}%`,
          'Post-Normalization Total': '100.0000%',
          'Countries Normalized': countryExposures.length
        },
        result: 100.0,
        explanation: `✓ Normalized ${countryExposures.length} country exposures to sum to exactly 100%`,
        countryDetails: step2Details
      });

      // Step 3: Country Shock Index
      const step3Details = generateStep3CSIDetails(countryExposures);
      const averageCSI = countryExposures.reduce((sum, ce) => sum + ce.countryShockIndex, 0) / countryExposures.length;

      steps.push({
        step: '3: Country Shock Index (S_c) - v3.4 Enhanced',
        formula: '📐 S_c = Country Risk Score',
        values: {
          'Countries Assessed': countryExposures.length,
          'Average CSI': averageCSI.toFixed(2)
        },
        result: averageCSI,
        explanation: `✓ Assigned CSI values for all countries`,
        countryDetails: step3Details
      });

      // Step 4: Political Alignment
      const step4Details = generateStep4PoliticalAlignmentDetails(countryExposures);

      steps.push({
        step: '4: Weighted Risk Contribution with v3.4 Enhanced Political Alignment Analysis',
        formula: '📐 Contribution_c = W_i,c × S_c × (1.0 + 0.5×(1.0 – A_c))',
        values: {
          'Total Contributions': countryExposures.length
        },
        result: result.rawScore,
        explanation: `✓ Calculated ${countryExposures.length} weighted country risk contributions with political alignment`,
        countryDetails: step4Details
      });

      // Step 5: Aggregation
      const step5Details = generateStep5AggregationDetails(countryExposures);

      steps.push({
        step: '5: Raw CO-GRI Score Aggregation (v3.4)',
        formula: '📐 Raw_Score = Σ(Contribution_c)',
        values: {
          'Sum of Contributions': result.rawScore.toFixed(4),
          'Number of Countries': countryExposures.length
        },
        result: result.rawScore,
        explanation: `✓ Raw COGRI Score = ${result.rawScore.toFixed(2)}`,
        countryDetails: step5Details
      });

      // Step 6: Sector Adjustment
      const step6Details = generateStep6SectorAdjustmentDetails(
        result.rawScore,
        result.sectorMultiplier,
        result.finalScore,
        result.riskLevel
      );

      steps.push({
        step: '6: Sector Risk Adjustment (v3.4 Enhanced)',
        formula: '📐 Final_Score = Raw_Score × M_sector',
        values: {
          'Raw Score': result.rawScore.toFixed(4),
          'Sector': data.sector || 'Unknown',
          'Sector Multiplier': result.sectorMultiplier.toFixed(4),
          'Final Score': result.finalScore.toFixed(1)
        },
        result: result.finalScore,
        explanation: `✓ Final COGRI Score = ${result.finalScore.toFixed(1)} (${result.riskLevel})`,
        countryDetails: step6Details
      });

      // Step 7: Sector Multiplier Application
      const step7Details = generateStep7MultiplierDetails(
        result.rawScore,
        result.sectorMultiplier,
        result.finalScore
      );

      steps.push({
        step: 'Step 7: Sector Multiplier Application',
        formula: '📐 Final_Score = Raw_Score × M_sector',
        values: {
          'Raw Score': result.rawScore.toFixed(4),
          'Sector Multiplier': result.sectorMultiplier.toFixed(4),
          'Final Score': result.finalScore.toFixed(4)
        },
        result: result.finalScore,
        explanation: `✓ Applied sector multiplier to calculate final COGRI score`,
        countryDetails: step7Details
      });

      setCalculationSteps(steps);

      // Log Phase 1 status
      if (isEnhancedResult(result)) {
        console.log(`[COGRI Hybrid] ✅ Enhanced calculation complete`);
        console.log(`[COGRI Hybrid] Sector: ${data.sector}, Multiplier: ${result.sectorMultiplierDetails.value}`);
      }

      setLocation(`/cogri?ticker=${targetTicker}`);

    } catch (err) {
      console.error('[COGRI V.4 Integration] Assessment error:', err);
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

  // Generate Phase 2 steps if features are enabled
  const phase2Steps: CalculationStep[] = [];
  
  if (phase2ChannelResult && featureFlags.enableChannelSpecificMultipliers) {
    phase2Steps.push({
      step: 'Step 8: Channel-Specific Multipliers (Phase 2)',
      formula: '📐 Channel_Score = Base_Score × Channel_Multiplier',
      values: {
        'Revenue Multiplier': phase2ChannelResult.channelResults.find((c: any) => c.channel === 'Revenue')?.adjustedMultiplier || 1.0,
        'Supply Multiplier': phase2ChannelResult.channelResults.find((c: any) => c.channel === 'Supply')?.adjustedMultiplier || 1.05,
        'Assets Multiplier': phase2ChannelResult.channelResults.find((c: any) => c.channel === 'Assets')?.adjustedMultiplier || 1.03,
        'Financial Multiplier': phase2ChannelResult.channelResults.find((c: any) => c.channel === 'Financial')?.adjustedMultiplier || 1.02
      },
      result: phase2ChannelResult.blendedMultiplier,
      explanation: `✓ Applied channel-specific multipliers based on exposure patterns`
    });
  }
  
  if (phase2DynamicResult && featureFlags.enableDynamicMultipliers) {
    phase2Steps.push({
      step: 'Step 9: Dynamic Risk Adjustments (Phase 2)',
      formula: '📐 Adjusted_Score = Channel_Score × (1 + Dynamic_Adjustment)',
      values: {
        'Base Blended': phase2ChannelResult?.blendedMultiplier || 1.0,
        'Dynamic Adjustment': ((phase2DynamicResult.finalBlendedMultiplier - (phase2ChannelResult?.blendedMultiplier || 1.0)) * 100).toFixed(2) + '%',
        'Final Blended': phase2DynamicResult.finalBlendedMultiplier
      },
      result: phase2DynamicResult.finalBlendedMultiplier,
      explanation: `✓ Applied dynamic adjustments based on geopolitical events and market conditions`
    });
  }
  
  if (phase2MLPrediction && featureFlags.enableMLCalibration) {
    phase2Steps.push({
      step: 'Step 10: ML Calibration (Phase 2)',
      formula: '📐 ML_Calibrated_Score = Adjusted_Score × ML_Confidence_Factor',
      values: {
        'ML Confidence': (phase2MLPrediction.confidence * 100).toFixed(1) + '%',
        'Revenue Prediction': phase2MLPrediction.multipliers.revenue,
        'Supply Prediction': phase2MLPrediction.multipliers.supply,
        'Assets Prediction': phase2MLPrediction.multipliers.assets,
        'Financial Prediction': phase2MLPrediction.multipliers.financial
      },
      result: phase2MLPrediction.confidence,
      explanation: `✓ ML model provides calibration insights with ${(phase2MLPrediction.confidence * 100).toFixed(0)}% confidence`
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Input Section - Only show when no results */}
        {!calculationResult && (
          <div className="space-y-8">
            {/* Return to Home Link - Added at the top */}
            <div className="mb-6">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-teal-400 hover:bg-slate-800/50 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Home</span>
                </Button>
              </Link>
            </div>

            {/* Main Heading */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Assess a Company or Ticker
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                Enter a stock ticker symbol to calculate its geopolitical risk exposure with three-tier fallback analysis
              </p>
            </div>

            {/* Input Card */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="pt-8 pb-8">
                <div className="max-w-3xl mx-auto space-y-4">
                  <Input
                    placeholder="Enter ticker (e.g., AAPL, MSFT, TSLA)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleAssessment()}
                    className="h-14 text-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={() => handleAssessment()}
                    disabled={loading}
                    className="w-full h-14 text-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      'Run CO-GRI Assessment'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Supported Markets Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Supported Markets & Exchanges:</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUPPORTED_MARKETS.map((market, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-teal-500 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full ${market.color} mt-1 flex-shrink-0`} />
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-bold text-white text-sm">{market.country}</h3>
                          <p className="text-gray-400 text-xs">{market.exchanges}</p>
                          {market.suffix && (
                            <p className="text-teal-400 text-xs">{market.suffix}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Phase 2 Feature Toggle */}
            <div>
              <Phase2FeatureToggle onFeaturesChange={handleFeaturesChange} />
            </div>
          </div>
        )}

        {/* Results Section */}
        {calculationResult && geoData && (
          <div className="space-y-6">
            {/* Navigation Links */}
            <div className="flex gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="text-white hover:text-teal-400 hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              
              {/* Cross-Mode Deep Link to Predictive Analytics */}
              <Button
                variant="outline"
                onClick={() => {
                  // Store company exposure data in global state for deep linking
                  if (geoData) {
                    const exposureContext = {
                      ticker,
                      topCountries: calculationResult.countryExposures.slice(0, 5).map(ce => ce.country),
                      dominantChannels: geoData.channelBreakdown ? Object.keys(geoData.channelBreakdown) : [],
                      sector: geoData.sector
                    };
                    localStorage.setItem('companyExposureContext', JSON.stringify(exposureContext));
                  }
                  setLocation(`/predictive-analytics?ticker=${ticker}&mode=forecast`);
                }}
                className="text-white border-teal-500 hover:bg-teal-500/10 hover:text-teal-400"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyze in Forecast Mode
              </Button>
            </div>

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
                      {isV4Active && <span className="ml-2 text-purple-600 font-semibold">• V.4 Enhanced</span>}
                    </CardDescription>
                  </div>
                  <COGRIPDFExport
                    ticker={ticker}
                    company={geoData.company}
                    finalScore={calculationResult.finalScore}
                    riskLevel={calculationResult.riskLevel}
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
            
            {/* NEW: Step-by-Step Calculation Breakdown */}
            {calculationSteps.length > 0 && (
              <StepByStepBreakdown 
                steps={calculationSteps}
                phase2Steps={phase2Steps}
              />
            )}
            
            {/* Phase 2: Channel Risk Breakdown */}
            {phase2ChannelResult && featureFlags.enableChannelSpecificMultipliers && (
              <ChannelRiskBreakdown
                result={phase2ChannelResult}
                rawScore={calculationResult.rawScore}
                sectorMultiplier={calculationResult.sectorMultiplier}
              />
            )}
            
            {/* Phase 2: Dynamic Adjustment Indicator */}
            {phase2DynamicResult && featureFlags.enableDynamicMultipliers && (
              <DynamicAdjustmentIndicator
                result={phase2DynamicResult.dynamicAdjustments!}
                baseMultipliers={{
                  revenue: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Revenue')?.adjustedMultiplier || 1.0,
                  supply: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Supply')?.adjustedMultiplier || 1.05,
                  assets: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Assets')?.adjustedMultiplier || 1.03,
                  financial: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Financial')?.adjustedMultiplier || 1.02
                }}
              />
            )}
            
            {/* Phase 2: ML Calibration Insights */}
            {phase2MLPrediction && featureFlags.enableMLCalibration && (
              <MLCalibrationInsights
                predictions={phase2MLPrediction.multipliers}
                currentMultipliers={
                  phase2DynamicResult?.dynamicAdjustments?.adjustedMultipliers || 
                  {
                    revenue: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Revenue')?.adjustedMultiplier || 1.0,
                    supply: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Supply')?.adjustedMultiplier || 1.05,
                    assets: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Assets')?.adjustedMultiplier || 1.03,
                    financial: phase2ChannelResult?.channelResults.find((c: any) => c.channel === 'Financial')?.adjustedMultiplier || 1.02
                  }
                }
                confidence={phase2MLPrediction.confidence}
                modelAccuracy={0.85}
                expectedImpact={0}
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
                    
                    {(featureFlags.enableChannelSpecificMultipliers || featureFlags.enableDynamicMultipliers || featureFlags.enableMLCalibration) && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Phase 2: Advanced Risk Assessment</h3>
                        <p className="text-sm text-gray-700 mb-2">
                          Phase 2 introduces three advanced features for more accurate risk assessment:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {featureFlags.enableChannelSpecificMultipliers && (
                            <li><strong>Channel-Specific Multipliers:</strong> Different risk multipliers for each of the four channels based on exposure patterns</li>
                          )}
                          {featureFlags.enableDynamicMultipliers && (
                            <li><strong>Dynamic Adjustments:</strong> Real-time multiplier adjustments based on active geopolitical events and market conditions</li>
                          )}
                          {featureFlags.enableMLCalibration && (
                            <li><strong>ML Calibration:</strong> AI-powered multiplier recommendations using historical data and predictive analytics</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {isV4Active && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">V.4 Enhanced Data</h3>
                        <p className="text-sm text-gray-700 mb-2">
                          This assessment uses V.4 enhanced geographic exposure data with improved:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          <li><strong>Label Definitions:</strong> Precise country membership for regional labels</li>
                          <li><strong>Narrative Text:</strong> Direct quotes from SEC filings for transparency</li>
                          <li><strong>PPE Data:</strong> Property, plant & equipment geographic breakdown</li>
                          <li><strong>Channel Evidence:</strong> Enhanced confidence scoring for each exposure channel</li>
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Final Score Calculation</h3>
                      <p className="text-sm text-gray-700">
                        COGRI = Σ(Exposure_Weight × CSI × Political_Alignment) × Sector_Multiplier
                        {(featureFlags.enableChannelSpecificMultipliers || featureFlags.enableDynamicMultipliers) && ' × Channel_Multiplier'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}