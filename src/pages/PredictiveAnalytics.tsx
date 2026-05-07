import { useState, useRef, useEffect } from 'react';
import { Link, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, TrendingUp, AlertTriangle, Shield, Globe, ChevronDown, ChevronUp, Play, ArrowDown, Loader2, AlertCircle, Calculator, Database, CheckCircle, XCircle, Info, Search } from 'lucide-react';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { calculateScenarioImpact, applyScenarioToCompany, ScenarioConfig, ScenarioImpact, CompanyScenarioResult, CalculationStep, MathematicalBreakdown, ChannelDataSource } from '@/services/scenarioEngine';
import { ForecastOutputRenderer } from '@/components/ForecastOutputRenderer';
import { applyForecastToPortfolio } from '@/services/forecastEngine';
import { getCompanyGeographicExposure } from '@/services/v34ComprehensiveIntegration';
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import { getForecastMetadata } from '@/services/gurusForecastAdapter';

// Event type options - REMOVED: "16 Gurus Forecast (2026 Baseline)"
const EVENT_TYPES = [
  'Sanctions',
  'Capital Controls / FX Restrictions',
  'Nationalization / Expropriation',
  'Export Ban / Import Restriction',
  'Foreign Investment Restriction',
  'Trade Embargo / Tariff Shock',
  'Conflict / Military Escalation',
  'Domestic Instability (protests, riots, regime crisis)',
  'Energy / Commodity Restriction',
  'Cyberattack / Infrastructure Disruption',
  'Custom Event'
];

// Propagation types
const PROPAGATION_TYPES = [
  { value: 'unilateral', label: 'Unilateral', description: 'Single actor → single target' },
  { value: 'bilateral', label: 'Bilateral', description: 'Two-way impact between countries' },
  { value: 'regional', label: 'Regional', description: 'Trade-based selection with scaled shocks' },
  { value: 'global', label: 'Global', description: 'All countries with scaled shocks by exposure' }
];

// Severity levels
const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', description: 'Minor disruption, limited scope' },
  { value: 'medium', label: 'Medium', description: 'Moderate impact, sector-specific' },
  { value: 'high', label: 'High', description: 'Severe disruption, widespread effects' }
];

// Sector options
const SECTORS = [
  'Technology',
  'Financial Services',
  'Energy',
  'Healthcare',
  'Consumer Goods',
  'Industrials',
  'Materials',
  'Telecommunications',
  'Utilities',
  'Real Estate'
];

export default function PredictiveAnalytics() {
  // Get URL search params for deep linking
  const searchString = useSearch();
  
  // Analysis mode state
  const [analysisMode, setAnalysisMode] = useState<'scenario' | 'forecast'>('scenario');
  
  // Forecast mode state
  const [forecastCompanyTicker, setForecastCompanyTicker] = useState<string>('');
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [forecastExposures, setForecastExposures] = useState<any[]>([]);
  const [forecastAdjustedExposures, setForecastAdjustedExposures] = useState<any[]>([]);
  const [forecastError, setForecastError] = useState<string | null>(null);
  
  // Scenario mode state - CHANGED: selectedEventTypes is now an array for multi-select
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [customEventName, setCustomEventName] = useState<string>('');
  const [actorCountry, setActorCountry] = useState<string>('');
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [propagationType, setPropagationType] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [applyAlignmentChanges, setApplyAlignmentChanges] = useState<boolean>(false);
  const [applyExposureChanges, setApplyExposureChanges] = useState<boolean>(true);
  const [applySectorSensitivity, setApplySectorSensitivity] = useState<boolean>(true);
  const [applyToType, setApplyToType] = useState<string>('entire');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCountriesForCompanies, setSelectedCountriesForCompanies] = useState<string[]>([]);
  const [specificCompany, setSpecificCompany] = useState<string>('');
  const [targetCountrySearch, setTargetCountrySearch] = useState<string>('');
  const [showTargetDropdown, setShowTargetDropdown] = useState<boolean>(false);
  
  // Results state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [scenarioImpact, setScenarioImpact] = useState<ScenarioImpact | null>(null);
  const [companyResults, setCompanyResults] = useState<CompanyScenarioResult[]>([]);
  const [expandedShockChanges, setExpandedShockChanges] = useState<boolean>(true);
  const [expandedAlignmentChanges, setExpandedAlignmentChanges] = useState<boolean>(true);
  const [expandedExposureChanges, setExpandedExposureChanges] = useState<boolean>(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  
  // Mathematical breakdown state
  const [showMathBreakdown, setShowMathBreakdown] = useState<boolean>(false);
  
  // ENHANCEMENT 2: Channel data sources expanded state
  const [expandedChannelSources, setExpandedChannelSources] = useState<Record<string, boolean>>({});
  // Ref for scrolling to input screen
  const inputScreenRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Task 3: Deep linking - Parse URL parameters and auto-populate
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const tickerParam = params.get('ticker');
    const modeParam = params.get('mode');
    
    // Set mode from URL parameter
    if (modeParam === 'forecast' || modeParam === 'scenario') {
      setAnalysisMode(modeParam);
    }
    
    // Auto-populate ticker in forecast mode
    if (tickerParam && modeParam === 'forecast') {
      setForecastCompanyTicker(tickerParam.toUpperCase());
      
      // Load company exposure context from localStorage if available
      try {
        const contextStr = localStorage.getItem('companyExposureContext');
        if (contextStr) {
          const context = JSON.parse(contextStr);
          console.log('[Deep Linking] Loaded company context:', context);
          // Context is available for future use in scenario pre-filling
        }
      } catch (e) {
        console.error('[Deep Linking] Error loading context:', e);
      }
      
      // Auto-run forecast analysis after a short delay
      setTimeout(() => {
        if (tickerParam) {
          handleForecastAnalysis();
        }
      }, 500);
    }
  }, [searchString]);

  // Get sorted country list
  const sortedCountries = [...GLOBAL_COUNTRIES].sort((a, b) => a.country.localeCompare(b.country));

  // Filter countries based on search
  const filteredTargetCountries = sortedCountries.filter(c => 
    c.country.toLowerCase().includes(targetCountrySearch.toLowerCase())
  );

  // NEW: Handle event type checkbox toggle
  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => {
      if (prev.includes(eventType)) {
        return prev.filter(type => type !== eventType);
      } else {
        return [...prev, eventType];
      }
    });
  };

  const handleTargetCountryToggle = (country: string) => {
    setTargetCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleCountryForCompaniesToggle = (country: string) => {
    setSelectedCountriesForCompanies(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const scrollToInputScreen = () => {
    inputScreenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getRiskLevelColor = (level: string) => {
    if (level.includes('Very High')) return 'text-red-600';
    if (level.includes('High')) return 'text-orange-600';
    if (level.includes('Moderate')) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskColor = (level: string) => {
    if (level.includes('Very High')) return 'bg-red-600';
    if (level.includes('High')) return 'bg-orange-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getContributionColor = (contribution: number) => {
    if (contribution >= 10) return '#ef4444'; // red
    if (contribution >= 5) return '#f97316'; // orange
    if (contribution >= 2) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  // ENHANCEMENT 2: Get evidence level badge color
  const getEvidenceLevelColor = (level: string) => {
    switch (level) {
      case 'A+': return 'bg-green-600 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-black';
      case 'D': return 'bg-orange-500 text-white';
      case 'None': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // ENHANCEMENT 2: Get data source icon
  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'Direct Data': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Sector Estimate': return <Info className="h-4 w-4 text-blue-500" />;
      case 'Fallback Method': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'No Data': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  // ENHANCEMENT 2: Render channel data sources
  const renderChannelDataSources = (channelSources: ChannelDataSource[] | undefined, countryKey: string) => {
    if (!channelSources || channelSources.length === 0) return null;

    const isExpanded = expandedChannelSources[countryKey];

    return (
      <div className="mt-3 border-t border-gray-700 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedChannelSources(prev => ({ ...prev, [countryKey]: !prev[countryKey] }))}
          className="text-gray-300 hover:text-white hover:bg-[#0d5f5f]/30 mb-2"
        >
          <Database className="h-4 w-4 mr-2" />
          {isExpanded ? 'Hide' : 'Show'} Channel Data Sources
          {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>

        {isExpanded && (
          <div className="space-y-3 bg-[#1a2332] rounded-lg p-3">
            {channelSources.map((source, idx) => (
              <div key={idx} className="border border-gray-700 rounded-lg p-3 bg-[#0f1e2e]">
                {/* Channel Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold capitalize">{source.channel}</span>
                    {source.isRealData ? (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">Real Data</span>
                    ) : (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">Fallback</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getEvidenceLevelColor(source.evidenceLevel)}`}>
                    {source.evidenceLevel}
                  </span>
                </div>

                {/* Data Source Info */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    {getDataSourceIcon(source.dataSource)}
                    <span className="text-gray-300">{source.dataSource}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-300">Confidence: </span>
                    <span className={`font-semibold ${
                      source.confidenceScore >= 90 ? 'text-green-400' :
                      source.confidenceScore >= 70 ? 'text-blue-400' :
                      source.confidenceScore >= 50 ? 'text-yellow-400' :
                      'text-orange-400'
                    }`}>
                      {source.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-xs mb-2 italic">{source.description}</p>

                {/* Values */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0d5f5f]/10 rounded p-2">
                  <div>
                    <span className="text-gray-400">Raw Value: </span>
                    <span className="text-white">{(source.rawValue * 100).toFixed(4)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Display Value: </span>
                    <span className="text-white">{(source.displayValue * 100).toFixed(4)}%</span>
                  </div>
                </div>

                {/* Fallback Type */}
                {source.fallbackType && source.fallbackType !== 'None' && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-400">Fallback Type: </span>
                    <span className="text-yellow-400 font-semibold">{source.fallbackType}</span>
                    <span className="text-gray-500 ml-2">
                      {source.fallbackType === 'SSF' && '(Segment-Specific)'}
                      {source.fallbackType === 'RF' && '(Regional)'}
                      {source.fallbackType === 'GF' && '(Global)'}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Legend */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2 font-semibold">Evidence Level Legend:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('A+')}`}>A+</span>
                  <span className="text-gray-400">95%+ confidence, validated</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('A')}`}>A</span>
                  <span className="text-gray-400">90-94% confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('B')}`}>B</span>
                  <span className="text-gray-400">85-89% confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('C')}`}>C</span>
                  <span className="text-gray-400">60-69% sector estimate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('D')}`}>D</span>
                  <span className="text-gray-400">50-59% fallback method</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${getEvidenceLevelColor('None')}`}>None</span>
                  <span className="text-gray-400">No data available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalculationStep = (step: CalculationStep, stepKey: string) => {
    const hasDetailedCalcs = step.detailedCalculations && Array.isArray(step.detailedCalculations) && step.detailedCalculations.length > 0;
    const isExpanded = expandedSteps[stepKey];
    
    return (
      <div key={stepKey} className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">{step.stepNumber}. {step.title}</h4>
            <p className="text-gray-200 text-sm font-mono mb-2">📐 {step.formula}</p>
          </div>
          {hasDetailedCalcs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleStep(stepKey)}
              className="text-gray-200 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        {/* Summary Values - Always visible */}
        {Object.keys(step.values).length > 0 && (
          <div className="bg-[#0d5f5f]/30 rounded p-3 mb-2 max-h-60 overflow-y-auto">
            {Object.entries(step.values).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm mb-1">
                <span className="text-gray-200">{key}:</span>
                <span className="text-white font-mono">{typeof value === 'number' ? value.toFixed(4) : value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Result - Always visible */}
        <div className="bg-green-900/30 border border-green-700 rounded p-2 mt-2">
          <p className="text-green-300 font-semibold">✓ {step.result}</p>
        </div>
        
        {/* Detailed Calculations - Expanded by default */}
        {isExpanded && hasDetailedCalcs && (
          <div className="mt-3 pl-4 border-l-2 border-[#0d5f5f]/50">
            <p className="text-gray-300 text-xs mb-2">Detailed Breakdown:</p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {step.detailedCalculations!.map((calc, idx) => (
                calc ? <p key={idx} className="text-gray-200 text-xs font-mono whitespace-pre-wrap">{calc}</p> : null
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Mathematical Breakdown Component
  const renderMathematicalBreakdown = (breakdown: MathematicalBreakdown) => {
    return (
      <div className="mathematical-breakdown border border-[#0d5f5f] rounded-lg p-6 mt-6 bg-[#0f1e2e]">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-6 w-6 text-[#7fa89f]" />
          <h3 className="text-xl font-bold text-white">📊 Mathematical Breakdown</h3>
        </div>
        
        {/* Scenario-Level Parameters */}
        <div className="scenario-parameters mb-8">
          <h4 className="text-lg font-semibold text-white mb-4 border-b border-[#0d5f5f] pb-2">A. Scenario-Level Parameters</h4>
          <div className="grid gap-3 text-sm font-mono bg-[#0d5f5f]/10 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-gray-200">A1. Severity:</span>
              <span className="text-white font-semibold">{breakdown.scenarioLevel.severityLabel} ({breakdown.scenarioLevel.severityScalar})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-200">A2. EventBaseShock:</span>
              <span className="text-white font-semibold">{breakdown.scenarioLevel.eventBaseShock} ({breakdown.scenarioLevel.eventType})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-200">A3. FullImpact (normalized):</span>
              <span className="text-white font-semibold">{breakdown.scenarioLevel.severityScalar} × {breakdown.scenarioLevel.eventBaseShock} = {breakdown.scenarioLevel.fullImpactCSI}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-200">A4. CSI Scale Factor:</span>
              <span className="text-white font-semibold">{breakdown.scenarioLevel.csiScaleFactor}</span>
            </div>
            <div className="flex justify-between border-t border-[#0d5f5f] pt-2">
              <span className="text-gray-200">A5. FullImpact (CSI points):</span>
              <span className="text-white font-bold text-lg">{breakdown.scenarioLevel.fullImpactCSI}</span>
            </div>
          </div>
        </div>
        
        {/* Country-Level Parameters */}
        <div className="country-parameters">
          <h4 className="text-lg font-semibold text-white mb-4 border-b border-[#0d5f5f] pb-2">B. Spillover Country-Level Parameters</h4>
          
          {Object.keys(breakdown.countryLevel).length === 0 ? (
            <div className="text-gray-400 text-center py-8 italic">
              No spillover countries with detailed mathematical breakdown available.
              <br />
              Mathematical breakdown is shown for countries using multi-channel material exposure assessment.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(breakdown.countryLevel).slice(0, 10).map(([country, data]) => (
                <div key={country} className="country-breakdown border border-[#0d5f5f]/30 rounded-lg p-4 bg-[#0d5f5f]/5">
                  <h5 className="font-semibold text-[#7fa89f] mb-3 text-lg border-b border-[#0d5f5f]/30 pb-1">{country}</h5>
                  
                  {/* Raw Channel Exposures */}
                  <div className="mb-4">
                    <h6 className="text-white font-medium mb-2">B1. Raw Channel Exposures (Pre-Weights):</h6>
                    <div className="grid gap-2 text-xs font-mono ml-4">
                      <div className="flex justify-between">
                        <span className="text-gray-200">B1a. TradeExposure:</span>
                        <span className="text-white">{(data.rawExposures.tradeExposure * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">B1b. SupplyChainExposure:</span>
                        <span className="text-white">{(data.rawExposures.supplyChainExposure * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">B1c. FinancialLinkage:</span>
                        <span className="text-white">{(data.rawExposures.financialLinkage * 100).toFixed(4)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Weighted Components */}
                  <div className="mb-4">
                    <h6 className="text-white font-medium mb-2">B2. Weighted Components (Post α/β/γ):</h6>
                    <div className="grid gap-2 text-xs font-mono ml-4">
                      <div className="flex justify-between">
                        <span className="text-gray-200">Trade Component:</span>
                        <span className="text-white">α({data.weightedComponents.alpha}) × {(data.rawExposures.tradeExposure * 100).toFixed(4)}% = {(data.weightedComponents.tradeComponent * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Supply Component:</span>
                        <span className="text-white">β({data.weightedComponents.beta}) × {(data.rawExposures.supplyChainExposure * 100).toFixed(4)}% = {(data.weightedComponents.supplyComponent * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Financial Component:</span>
                        <span className="text-white">γ({data.weightedComponents.gamma}) × {(data.rawExposures.financialLinkage * 100).toFixed(4)}% = {(data.weightedComponents.financialComponent * 100).toFixed(4)}%</span>
                      </div>
                      <div className="flex justify-between border-t border-[#0d5f5f]/30 pt-2 font-semibold">
                        <span className="text-gray-200">B2a. PropagationWeight:</span>
                        <span className="text-[#7fa89f]">{(data.weightedComponents.tradeComponent * 100).toFixed(4)}% + {(data.weightedComponents.supplyComponent * 100).toFixed(4)}% + {(data.weightedComponents.financialComponent * 100).toFixed(4)}% = {(data.propagationWeight * 100).toFixed(4)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* CSI Change Calculation */}
                  <div>
                    <h6 className="text-white font-medium mb-2">B3. CSI Change Calculation:</h6>
                    <div className="grid gap-2 text-xs font-mono ml-4">
                      <div className="flex justify-between">
                        <span className="text-gray-200">Pre-rounded ΔCSI:</span>
                        <span className="text-white">{breakdown.scenarioLevel.fullImpactCSI} × {data.propagationWeight.toFixed(6)} = {data.csiChange.preRounded.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-[#0d5f5f]/30 pt-2">
                        <span className="text-gray-200">Displayed ΔCSI:</span>
                        <span className="text-green-400 text-base">{data.csiChange.displayed.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {Object.keys(breakdown.countryLevel).length > 10 && (
                <div className="text-center text-gray-400 italic py-4">
                  ... and {Object.keys(breakdown.countryLevel).length - 10} more countries with detailed breakdowns
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Forecast analysis handler - FIXED to load actual forecast data
  const handleForecastAnalysis = async () => {
    const ticker = forecastCompanyTicker.trim().toUpperCase();
    
    if (!ticker) {
      setForecastError('Please enter a company ticker symbol');
      return;
    }

    setForecastLoading(true);
    setForecastError(null);
    setForecastResult(null);
    
    try {
      // 1. Get company geographic exposure data
      const geoData = await getCompanyGeographicExposure(ticker);
      
      // The function returns 'segments', not 'exposures'
      if (!geoData || !geoData.segments || geoData.segments.length === 0) {
        throw new Error(`No geographic exposure data found for ${ticker}. Please verify the ticker symbol.`);
      }

      // 2. Convert segments to Exposure format for forecast engine
      const exposures = geoData.segments.map(seg => {
        const channelData = geoData.channelBreakdown?.[seg.country];
        
        return {
          countryCode: seg.country.substring(0, 2).toUpperCase(),
          countryName: seg.country,
          baseCsi: 50, // Will be replaced by forecast data
          exposureAmount: seg.revenuePercentage,
          sector: geoData.metadata?.sector
        };
      });
      
      // 3. Apply forecast to exposures - FIXED: Only 2 parameters!
      const { adjustedExposures, metadata } = applyForecastToPortfolio(
        exposures,
        '2026'  // Only pass the year string
      );
      
      // 4. Load the actual forecast data for the renderer
      const forecastData = loadCedarOwlForecast('2026');
      
      // 5. Calculate CO-GRI-style result
      const totalExposure = exposures.reduce((sum, exp) => sum + exp.exposureAmount, 0);
      const weightedRisk = adjustedExposures.reduce((sum, exp) => {
        const originalExp = exposures.find(e => e.countryCode === exp.countryCode);
        const weight = originalExp ? originalExp.exposureAmount / totalExposure : 0;
        return sum + (exp.adjustedCsi * weight);
      }, 0);
      
      const result = {
        score: weightedRisk,
        riskLevel: weightedRisk < 30 ? 'Low Risk' : 
                   weightedRisk < 50 ? 'Moderate Risk' : 
                   weightedRisk < 70 ? 'High Risk' : 'Very High Risk',
        countryExposures: adjustedExposures.map(exp => {
          const originalExp = exposures.find(e => e.countryCode === exp.countryCode);
          return {
            country: exp.countryName,
            exposureWeight: originalExp ? originalExp.exposureAmount / 100 : 0,
            countryShockIndex: exp.adjustedCsi,
            contribution: (originalExp ? originalExp.exposureAmount / totalExposure : 0) * exp.adjustedCsi,
            channels: {
              revenue: 0.4,
              financial: 0.10,
              supply: 0.15,
              assets: 0.1
            }
          };
        }),
        metadata: {
          companyName: ticker,
          forecastYear: '2026',
          totalCountries: exposures.length,
          dataSource: geoData.metadata?.source || 'V4 Enhanced',
          ...metadata
        }
      };
      
      // 6. Update state with the actual forecast data
      setForecastExposures(exposures);
      setForecastAdjustedExposures(adjustedExposures);
      setForecastResult({ result, forecast: forecastData });
      
    } catch (error: any) {
      console.error('Forecast analysis error:', error);
      setForecastError(
        error.message || 
        'Error running forecast analysis. Please verify the ticker symbol and try again.'
      );
    } finally {
      setForecastLoading(false);
    }
  };

  const handleRunScenario = async () => {
    // Validation - UPDATED: Check selectedEventTypes array instead of eventType
    if (selectedEventTypes.length === 0) {
      setError('Please select at least one Event Type');
      return;
    }

    // Check if Custom Event is selected and needs a name
    if (selectedEventTypes.includes('Custom Event') && !customEventName.trim()) {
      setError('Please enter a custom event name');
      return;
    }
    
    if (!actorCountry) {
      setError('Please select an Actor Country');
      return;
    }
    if (targetCountries.length === 0) {
      setError('Please select at least one Target Country');
      return;
    }
    if (!propagationType) {
      setError('Please select a Propagation Type');
      return;
    }
    if (!severity) {
      setError('Please select a Severity level');
      return;
    }
    if (applyToType === 'sectors' && selectedSectors.length === 0) {
      setError('Please select at least one sector');
      return;
    }
    if (applyToType === 'countries' && selectedCountriesForCompanies.length === 0) {
      setError('Please select at least one country for company filtering');
      return;
    }
    if (applyToType === 'company' && !specificCompany.trim()) {
      setError('Please enter a specific company');
      return;
    }

    setLoading(true);
    setError('');
    setScenarioImpact(null);
    setCompanyResults([]);

    try {
      // Use the first selected event type for the main scenario
      // If Custom Event is selected, use the custom name
      const primaryEventType = selectedEventTypes.includes('Custom Event') 
        ? customEventName 
        : selectedEventTypes[0];

      const config: ScenarioConfig = {
        eventType: primaryEventType,
        customEventName: selectedEventTypes.includes('Custom Event') ? customEventName : undefined,
        actorCountry,
        targetCountries,
        propagationType: propagationType as 'unilateral' | 'bilateral' | 'regional' | 'global',
        severity: severity as 'low' | 'medium' | 'high',
        applyAlignmentChanges,
        applyExposureChanges,
        applySectorSensitivity,
        applyTo: {
          type: applyToType as 'entire' | 'sectors' | 'countries' | 'company',
          sectors: selectedSectors,
          countries: selectedCountriesForCompanies,
          company: specificCompany
        }
      };

      // LAYER 1: Calculate scenario impact
      console.log('[Predictive Analytics] Running Layer 1: Macro scenario impact calculation');
      const impact = calculateScenarioImpact(config);
      setScenarioImpact(impact);

      // LAYER 2: Apply to specific company if requested
      if (applyToType === 'company' && specificCompany.trim()) {
        try {
          console.log('[Predictive Analytics] Running Layer 2: Company CO-GRI calculation');
          
          const result = await applyScenarioToCompany(
            specificCompany.toUpperCase(),
            impact,
            config
          );

          setCompanyResults([result]);
          
          // Auto-expand all calculation steps
          const autoExpandSteps: Record<string, boolean> = {};
          result.baselineCalculationSteps.forEach((_, index) => {
            autoExpandSteps[`baseline-step-${index}`] = true;
          });
          result.scenarioCalculationSteps.forEach((_, index) => {
            autoExpandSteps[`scenario-step-${index}`] = true;
          });
          setExpandedSteps(autoExpandSteps);
          
          console.log('[Predictive Analytics] ✅ Company analysis complete');
        } catch (err) {
          console.error('[Predictive Analytics] Error analyzing company:', err);
          setError(`Error analyzing company: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Scroll to results
      setTimeout(() => scrollToResults(), 100);
    } catch (err) {
      console.error('[Predictive Analytics] Error running scenario:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while running the scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-[#0d5f5f]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Predictive Analytics</h1>
              <p className="text-sm text-gray-200">Scenario Planning for Geopolitical Risk Intelligence</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4a4a] hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Mode Toggle */}
        <div className="mb-8">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-semibold text-center text-white">Select Analysis Mode:</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant={analysisMode === 'scenario' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('scenario')}
                    className="min-w-[200px] h-12 text-base"
                    size="lg"
                  >
                    📊 Scenario Analysis
                  </Button>
                  <Button
                    variant={analysisMode === 'forecast' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('forecast')}
                    className="min-w-[200px] h-12 text-base"
                    size="lg"
                  >
                    🔮 Forecast Baseline
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground max-w-2xl">
                  {analysisMode === 'scenario' 
                    ? '📝 Create custom geopolitical scenarios and analyze their impact on your portfolio'
                    : '🌍 Analyze portfolio risk using expert geopolitical forecasts for 195 countries (2026)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {analysisMode === 'scenario' ? (
          <>
        {/* Scroll to Input Button */}
        <div className="mb-12 text-center">
          <Button
            onClick={scrollToInputScreen}
            className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white font-semibold py-6 px-8 text-lg"
          >
            <ArrowDown className="mr-2 h-5 w-5" />
            Click Here to Go to the Predictive Analytics Input Screen
          </Button>
        </div>

        {/* Hero Section */}
        <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Don't Just React to Geopolitical Shocks—Anticipate Them
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed">
            <strong className="text-white">The most successful investors don't wait for crises to unfold.</strong> They model scenarios, stress-test portfolios, and position capital before threats materialize. CedarOwl's Predictive Analytics service transforms geopolitical intelligence into actionable foresight, enabling you to run sophisticated "what-if" scenarios across your entire investment strategy.
          </p>
        </div>

        {/* Scenario Creation Form */}
        <div ref={inputScreenRef}>
          <Card className="bg-[#0f1e2e] border-[#0d5f5f] mb-12">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Create a New Scenario</CardTitle>
              <CardDescription className="text-gray-200">
                Define a geopolitical event and analyze its impact on companies and portfolios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Type - CHANGED to multi-select with checkboxes */}
              <div className="space-y-3">
                <Label className="text-white text-base font-semibold">
                  Event Type (Select Multiple) <span className="text-red-400">*</span>
                </Label>
                <div className="border border-gray-700 rounded-lg p-4 bg-[#1a2332] max-h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {EVENT_TYPES.map((type) => (
                      <div
                        key={type}
                        className="flex items-center space-x-3 p-2 hover:bg-[#0d5f5f]/20 rounded cursor-pointer"
                        onClick={() => handleEventTypeToggle(type)}
                      >
                        <Checkbox
                          id={`event-${type}`}
                          checked={selectedEventTypes.includes(type)}
                          onCheckedChange={() => handleEventTypeToggle(type)}
                          className="border-gray-500"
                        />
                        <Label
                          htmlFor={`event-${type}`}
                          className="text-white cursor-pointer flex-1"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedEventTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEventTypes.map((type) => (
                      <div
                        key={type}
                        className="bg-[#0d5f5f] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {type}
                        <button
                          onClick={() => handleEventTypeToggle(type)}
                          className="hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Event Name Input - Only show if Custom Event is selected */}
              {selectedEventTypes.includes('Custom Event') && (
                <div className="space-y-2">
                  <Label htmlFor="customEventName" className="text-white text-base font-semibold">
                    Custom Event Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="customEventName"
                    placeholder="Enter custom event name"
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    className="bg-[#1a2332] border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              )}

              {/* Actor Country */}
              <div className="space-y-2">
                <Label htmlFor="actorCountry" className="text-white text-base font-semibold">
                  Actor Country <span className="text-red-400">*</span>
                </Label>
                <p className="text-gray-300 text-sm">Who initiates the action?</p>
                <Select value={actorCountry} onValueChange={setActorCountry}>
                  <SelectTrigger id="actorCountry" className="bg-[#1a2332] border-gray-700 text-white">
                    <SelectValue placeholder="Select actor country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-gray-700 max-h-[300px]">
                    {sortedCountries.map((country) => (
                      <SelectItem 
                        key={country.country} 
                        value={country.country}
                        className="text-white hover:bg-[#0d5f5f]"
                      >
                        {country.country} (CSI: {country.csi})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Countries */}
              <div className="space-y-2">
                <Label className="text-white text-base font-semibold">
                  Target Country(s) <span className="text-red-400">*</span>
                </Label>
                <p className="text-gray-300 text-sm">Who the action affects? (Multiple selections allowed)</p>
                <div className="relative">
                  <Input
                    placeholder="Search countries..."
                    value={targetCountrySearch}
                    onChange={(e) => setTargetCountrySearch(e.target.value)}
                    onFocus={() => setShowTargetDropdown(true)}
                    className="bg-[#1a2332] border-gray-700 text-white placeholder-gray-400"
                  />
                  {showTargetDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1a2332] border border-gray-700 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                      <div className="sticky top-0 bg-[#1a2332] p-2 border-b border-gray-700">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowTargetDropdown(false)}
                          className="w-full text-gray-300 hover:text-white hover:bg-[#0d5f5f]"
                        >
                          Close
                        </Button>
                      </div>
                      {filteredTargetCountries.map((country) => (
                        <div
                          key={country.country}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-[#0d5f5f] cursor-pointer"
                          onClick={() => handleTargetCountryToggle(country.country)}
                        >
                          <Checkbox
                            checked={targetCountries.includes(country.country)}
                            className="border-gray-500"
                          />
                          <span className="text-white text-sm">
                            {country.country} (CSI: {country.csi})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {targetCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {targetCountries.map((country) => (
                      <div
                        key={country}
                        className="bg-[#0d5f5f] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {country}
                        <button
                          onClick={() => handleTargetCountryToggle(country)}
                          className="hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Propagation Type */}
              <div className="space-y-2">
                <Label className="text-white text-base font-semibold">
                  Propagation Type <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PROPAGATION_TYPES.map((prop) => (
                    <div
                      key={prop.value}
                      onClick={() => setPropagationType(prop.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        propagationType === prop.value
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                          : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          propagationType === prop.value
                            ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                            : 'border-gray-500'
                        }`} />
                        <span className="text-white font-semibold">{prop.label}</span>
                      </div>
                      <p className="text-gray-300 text-sm ml-6">{prop.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label className="text-white text-base font-semibold">
                  Severity <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SEVERITY_LEVELS.map((sev) => (
                    <div
                      key={sev.value}
                      onClick={() => setSeverity(sev.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        severity === sev.value
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                          : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          severity === sev.value
                            ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                            : 'border-gray-500'
                        }`} />
                        <span className="text-white font-semibold">{sev.label}</span>
                      </div>
                      <p className="text-gray-300 text-sm ml-6">{sev.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-white hover:bg-[#0d5f5f] w-full justify-between"
                >
                  <span className="font-semibold">Advanced Options</span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {showAdvanced && (
                  <div className="bg-[#1a2332] border border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="alignmentChanges"
                        checked={applyAlignmentChanges}
                        onCheckedChange={(checked) => setApplyAlignmentChanges(checked as boolean)}
                        className="border-gray-500"
                      />
                      <Label htmlFor="alignmentChanges" className="text-white cursor-pointer">
                        Apply political alignment changes (modifies alignment amplifier in scenario)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="exposureChanges"
                        checked={applyExposureChanges}
                        onCheckedChange={(checked) => setApplyExposureChanges(checked as boolean)}
                        className="border-gray-500"
                      />
                      <Label htmlFor="exposureChanges" className="text-white cursor-pointer">
                        Apply exposure changes (adjusts channel weights for affected countries)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="sectorSensitivity"
                        checked={applySectorSensitivity}
                        onCheckedChange={(checked) => setApplySectorSensitivity(checked as boolean)}
                        className="border-gray-500"
                      />
                      <Label htmlFor="sectorSensitivity" className="text-white cursor-pointer">
                        Apply sector sensitivity adjustments (final multiplier based on sector-event pairing)
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Scenario To */}
              <div className="space-y-3">
                <Label className="text-white text-base font-semibold">
                  Apply Scenario to <span className="text-red-400">*</span>
                </Label>
                <p className="text-gray-300 text-sm">
                  This is where your company-level analysis connects directly to the macro scenario.
                </p>

                <div className="space-y-3">
                  {/* Entire Company Universe */}
                  <div
                    onClick={() => setApplyToType('entire')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      applyToType === 'entire'
                        ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                        : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        applyToType === 'entire'
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                          : 'border-gray-500'
                      }`} />
                      <span className="text-white font-semibold">Entire Company Universe (default)</span>
                    </div>
                  </div>

                  {/* Selected Sectors */}
                  <div
                    onClick={() => setApplyToType('sectors')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      applyToType === 'sectors'
                        ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                        : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        applyToType === 'sectors'
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                          : 'border-gray-500'
                      }`} />
                      <span className="text-white font-semibold">Selected Sectors</span>
                    </div>
                    {applyToType === 'sectors' && (
                      <div className="ml-6 mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SECTORS.map((sector) => (
                          <div
                            key={sector}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSectorToggle(sector);
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-[#0d5f5f]/30 rounded cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedSectors.includes(sector)}
                              className="border-gray-500"
                            />
                            <span className="text-white text-sm">{sector}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Countries' Companies */}
                  <div
                    onClick={() => setApplyToType('countries')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      applyToType === 'countries'
                        ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                        : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        applyToType === 'countries'
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                          : 'border-gray-500'
                      }`} />
                      <span className="text-white font-semibold">Selected Countries' Companies</span>
                    </div>
                    {applyToType === 'countries' && (
                      <div className="ml-6 mt-3">
                        <Select
                          value=""
                          onValueChange={(country) => handleCountryForCompaniesToggle(country)}
                        >
                          <SelectTrigger className="bg-[#0f1e2e] border-gray-700 text-white">
                            <SelectValue placeholder="Select countries..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a2332] border-gray-700 max-h-[200px]">
                            {sortedCountries.map((country) => (
                              <SelectItem
                                key={country.country}
                                value={country.country}
                                className="text-white hover:bg-[#0d5f5f]"
                              >
                                {country.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCountriesForCompanies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCountriesForCompanies.map((country) => (
                              <div
                                key={country}
                                className="bg-[#0d5f5f] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                              >
                                {country}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCountryForCompaniesToggle(country);
                                  }}
                                  className="hover:text-red-300"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Specific Company */}
                  <div
                    onClick={() => setApplyToType('company')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      applyToType === 'company'
                        ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                        : 'border-gray-700 bg-[#1a2332] hover:border-[#0d5f5f]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        applyToType === 'company'
                          ? 'border-[#0d5f5f] bg-[#0d5f5f]'
                          : 'border-gray-500'
                      }`} />
                      <span className="text-white font-semibold">Specific Company</span>
                    </div>
                    {applyToType === 'company' && (
                      <Input
                        placeholder="Enter company name or ticker (e.g., Apple, TSLA, MSFT)"
                        value={specificCompany}
                        onChange={(e) => setSpecificCompany(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0f1e2e] border-gray-700 text-white placeholder-gray-400 ml-6 mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert className="bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Run Scenario Button */}
              <div className="pt-4">
                <Button
                  onClick={handleRunScenario}
                  disabled={loading}
                  className="w-full bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white font-semibold py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Running Scenario...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Run Scenario and Show Impact
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        ) : (
          // FORECAST BASELINE CONTENT
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-6 w-6" />
                  Strategic Forecast Baseline Analysis
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Analyze portfolio risk using expert geopolitical forecasts for 195 countries based on 2026 projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="forecast-company" className="block text-sm font-medium mb-2 text-white">
                      Company Ticker Symbol
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="forecast-company"
                        placeholder="e.g., AAPL, MSFT, TSLA, GOOGL"
                        value={forecastCompanyTicker}
                        onChange={(e) => {
                          setForecastCompanyTicker(e.target.value.toUpperCase());
                          setForecastError(null);
                        }}
                        className="flex-1 bg-[#1a2332] border-gray-700 text-white placeholder-gray-400"
                        disabled={forecastLoading}
                      />
                      <Button 
                        onClick={handleForecastAnalysis} 
                        disabled={forecastLoading || !forecastCompanyTicker.trim()}
                        className="min-w-[150px] bg-[#0d5f5f] hover:bg-[#0a4d4d]"
                      >
                        {forecastLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enter a publicly traded company ticker symbol to analyze geopolitical risk exposure
                    </p>
                  </div>

                  {forecastError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{forecastError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display forecast results - FIXED: Pass actual forecast data */}
            {forecastResult && forecastExposures.length > 0 && (
              <>
                {/* Cross-Mode Deep Link back to Company Mode */}
                <Card className="border-teal-500 bg-teal-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold mb-1">Want to see detailed CO-GRI breakdown?</h3>
                        <p className="text-gray-300 text-sm">
                          View step-by-step calculation, channel breakdown, and sector analysis for {forecastCompanyTicker}
                        </p>
                      </div>
                      <Link href={`/cogri?ticker=${forecastCompanyTicker}`}>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Open in Company Mode
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                <ForecastOutputRenderer
                  result={forecastResult.result}
                  forecast={forecastResult.forecast}
                  companyName={forecastCompanyTicker}
                  exposures={forecastExposures}
                  adjustedExposures={forecastAdjustedExposures}
                />
              </>
            )}

            {/* Info card when no results */}
            {!forecastResult && !forecastLoading && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2 text-white">Ready to Analyze</p>
                    <p className="text-sm text-gray-300">
                      Enter a company ticker symbol above to view the Strategic Forecast Baseline analysis
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f1e2e] border-t border-gray-700 py-6 px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>
            Powered by CedarOwl's advanced geopolitical risk analysis • Integrated Multi-Source Framework{' '}
            <Link href="/disclaimer">
              <a className="text-[#0d5f5f] hover:underline cursor-pointer">Disclaimer</a>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}