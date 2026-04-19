import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, TrendingUp, AlertTriangle, Shield, Globe, ChevronDown, ChevronUp, Play, ArrowDown, Loader2, AlertCircle, Calculator } from 'lucide-react';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { calculateScenarioImpact, applyScenarioToCompany, ScenarioConfig, ScenarioImpact, CompanyScenarioResult, CalculationStep, MathematicalBreakdown } from '@/services/scenarioEngine';

// Event type options
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
  const [eventType, setEventType] = useState<string>('');
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
  
  // NEW: Mathematical breakdown state
  const [showMathBreakdown, setShowMathBreakdown] = useState<boolean>(false);

  // Ref for scrolling to input screen
  const inputScreenRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get sorted country list
  const sortedCountries = [...GLOBAL_COUNTRIES].sort((a, b) => a.country.localeCompare(b.country));

  // Filter countries based on search
  const filteredTargetCountries = sortedCountries.filter(c => 
    c.country.toLowerCase().includes(targetCountrySearch.toLowerCase())
  );

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

  // NEW: Render Mathematical Breakdown Component
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

  const handleRunScenario = async () => {
    // Validation
    if (!eventType) {
      setError('Please select an Event Type');
      return;
    }
    if (eventType === 'Custom Event' && !customEventName.trim()) {
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
      const config: ScenarioConfig = {
        eventType: eventType === 'Custom Event' ? customEventName : eventType,
        customEventName: eventType === 'Custom Event' ? customEventName : undefined,
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

      // LAYER 1: Calculate scenario impact (Macro layer - CSI changes only)
      console.log('[Predictive Analytics] Running Layer 1: Macro scenario impact calculation');
      const impact = calculateScenarioImpact(config);
      setScenarioImpact(impact);

      // LAYER 2: Apply to specific company if requested (Micro layer - company CO-GRI)
      if (applyToType === 'company' && specificCompany.trim()) {
        try {
          console.log('[Predictive Analytics] Running Layer 2: Company CO-GRI calculation');
          console.log('[Predictive Analytics] Using EXACT CO-GRI methodology from geographicExposureService');
          
          // Use the new applyScenarioToCompany that internally calls getCompanyGeographicExposure
          // This ensures we use the EXACT same calculation as Assess-a-Company page
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
          console.log(`[Predictive Analytics] Baseline Score: ${result.baselineScore}`);
          console.log(`[Predictive Analytics] Scenario Score: ${result.scenarioScore}`);
          console.log(`[Predictive Analytics] Delta: ${result.scoreDelta} (${result.percentChange}%)`);
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

        {/* Key Capabilities Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-[#7fa89f]" />
              <h3 className="text-xl font-bold text-white">Capital Control Scenarios</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Model the impact of potential capital controls across emerging and frontier markets. Analyze how restrictions on fund repatriation, currency conversion limits, or foreign investment caps would affect your portfolio's liquidity and exit strategies. <strong className="text-white">Know which positions could become trapped before regulations change.</strong>
            </p>
          </div>

          <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-[#7fa89f]" />
              <h3 className="text-xl font-bold text-white">Nationalization Risk Modeling</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Simulate the effects of government seizures, forced asset sales, or sector nationalizations on your holdings. Test how different political scenarios—regime changes, populist movements, or resource nationalism—would impact valuations across your portfolio. <strong className="text-white">Identify vulnerable positions before political winds shift.</strong>
            </p>
          </div>

          <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-8 w-8 text-[#7fa89f]" />
              <h3 className="text-xl font-bold text-white">Sanctions & Restrictions Analysis</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Forecast the cascading effects of potential sanctions, trade restrictions, or investment bans on your international exposure. Model scenarios where specific countries, sectors, or companies face regulatory isolation. <strong className="text-white">Understand second and third-order effects before sanctions hit.</strong>
            </p>
          </div>

          <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-8 w-8 text-[#7fa89f]" />
              <h3 className="text-xl font-bold text-white">Portfolio Stress Testing</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Run comprehensive stress tests across multiple geopolitical scenarios simultaneously. Evaluate how your portfolio would perform under regional conflicts, trade wars, currency crises, or political instability. <strong className="text-white">Build resilience by identifying concentration risks and correlation breakdowns.</strong>
            </p>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Why Predictive Analytics Matters
          </h2>
          <div className="space-y-4 text-gray-200">
            <p className="leading-relaxed">
              <strong className="text-white">Traditional risk models fail in geopolitical crises.</strong> Standard volatility metrics, correlation matrices, and VaR calculations assume markets function normally. But when governments freeze assets, impose capital controls, or nationalize industries, historical data becomes irrelevant. You need forward-looking scenario analysis that accounts for political risk—not just market risk.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">CedarOwl's Predictive Analytics bridges this gap.</strong> By synthesizing real-time intelligence from leading geopolitical experts with quantitative modeling, we enable you to test "what-if" scenarios that matter: What if Argentina imposes capital controls? What if China nationalizes foreign mining operations? What if sanctions expand to secondary markets? <strong className="text-[#7fa89f]">Run the scenarios. See the impact. Adjust before it's too late.</strong>
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">This isn't speculation—it's strategic planning.</strong> Institutional investors, sovereign wealth funds, and family offices use scenario analysis to protect billions in assets. Now you can access the same capability. Model multiple futures, stress-test your positions, and build portfolios that survive geopolitical shocks. <strong className="text-[#7fa89f]">Don't gamble on stability. Plan for instability.</strong>
            </p>
          </div>
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
              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType" className="text-white text-base font-semibold">
                  Event Type <span className="text-red-400">*</span>
                </Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="eventType" className="bg-[#1a2332] border-gray-700 text-white">
                    <SelectValue placeholder="Select an event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-gray-700">
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-[#0d5f5f]">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eventType === 'Custom Event' && (
                  <Input
                    placeholder="Enter custom event name"
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    className="bg-[#1a2332] border-gray-700 text-white placeholder-gray-400 mt-2"
                  />
                )}
              </div>

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

        {/* Results Display */}
        {scenarioImpact && (
          <div ref={resultsRef} className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Scenario Impact Results</h2>

            {/* Scenario Summary */}
            <Card className="bg-[#0f1e2e] border-[#0d5f5f]">
              <CardHeader>
                <CardTitle className="text-white">Scenario Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-200">
                <p><strong>Event:</strong> {eventType === 'Custom Event' ? customEventName : eventType}</p>
                <p><strong>Actor:</strong> {actorCountry}</p>
                <p><strong>Targets:</strong> {targetCountries.join(', ')}</p>
                <p><strong>Propagation:</strong> {propagationType}</p>
                <p><strong>Severity:</strong> {severity}</p>
                <p><strong>Affected Countries:</strong> {scenarioImpact.propagatedCountries.length}</p>
              </CardContent>
            </Card>

            {/* NEW: Mathematical Breakdown Toggle Button */}
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowMathBreakdown(!showMathBreakdown)}
                variant="outline"
                className="bg-[#0d5f5f]/20 border-[#0d5f5f] text-white hover:bg-[#0d5f5f]/40 hover:text-white px-8 py-3 text-lg font-semibold"
              >
                <Calculator className="mr-2 h-5 w-5" />
                {showMathBreakdown ? 'Hide' : 'Show'} Mathematical Breakdown
              </Button>
            </div>

            {/* NEW: Mathematical Breakdown Display */}
            {showMathBreakdown && renderMathematicalBreakdown(scenarioImpact.mathematicalBreakdown)}

            {/* Country Shock Changes */}
            <Card className="bg-[#0f1e2e] border-[#0d5f5f]">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Country Shock Index Changes ({scenarioImpact.shockChanges.length})</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedShockChanges(!expandedShockChanges)}
                    className="text-white hover:bg-[#0d5f5f]"
                  >
                    {expandedShockChanges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedShockChanges && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-200">Country</th>
                          <th className="text-right py-2 px-3 text-gray-200">Base CSI</th>
                          <th className="text-right py-2 px-3 text-gray-200">New CSI</th>
                          <th className="text-right py-2 px-3 text-gray-200">Change</th>
                          <th className="text-left py-2 px-3 text-gray-200">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioImpact.shockChanges.map((change, idx) => (
                          <tr key={idx} className="border-b border-gray-700">
                            <td className="py-2 px-3 text-white">{change.country}</td>
                            <td className="py-2 px-3 text-right text-white font-mono">{change.baseCSI.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right text-white font-mono">{change.adjustedCSI.toFixed(1)}</td>
                            <td className={`py-2 px-3 text-right font-mono ${change.delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change.delta > 0 ? '+' : ''}{change.delta.toFixed(1)}
                            </td>
                            <td className="py-2 px-3 text-gray-300 text-sm">{change.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Alignment Changes */}
            {scenarioImpact.alignmentChanges.length > 0 && (
              <Card className="bg-[#0f1e2e] border-[#0d5f5f]">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Political Alignment Changes ({scenarioImpact.alignmentChanges.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAlignmentChanges(!expandedAlignmentChanges)}
                      className="text-white hover:bg-[#0d5f5f]"
                    >
                      {expandedAlignmentChanges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {expandedAlignmentChanges && (
                  <CardContent>
                    <div className="space-y-2">
                      {scenarioImpact.alignmentChanges.map((change, idx) => (
                        <div key={idx} className="bg-[#1a2332] p-3 rounded">
                          <p className="text-white font-semibold">{change.country}</p>
                          <p className="text-gray-300 text-sm">{change.reason}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            Alignment: {change.baseAlignment.toFixed(2)} → {change.adjustedAlignment.toFixed(2)} 
                            ({change.delta > 0 ? '+' : ''}{change.delta.toFixed(2)})
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Exposure Changes */}
            {scenarioImpact.exposureChanges.length > 0 && (
              <Card className="bg-[#0f1e2e] border-[#0d5f5f]">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Exposure Changes ({scenarioImpact.exposureChanges.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedExposureChanges(!expandedExposureChanges)}
                      className="text-white hover:bg-[#0d5f5f]"
                    >
                      {expandedExposureChanges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {expandedExposureChanges && (
                  <CardContent>
                    <div className="space-y-2">
                      {scenarioImpact.exposureChanges.map((change, idx) => (
                        <div key={idx} className="bg-[#1a2332] p-3 rounded">
                          <p className="text-white font-semibold">{change.country} - {change.channel}</p>
                          <p className="text-gray-300 text-sm">{change.reason}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            Weight: {(change.baseWeight * 100).toFixed(1)}% → {(change.adjustedWeight * 100).toFixed(1)}% 
                            ({change.delta > 0 ? '+' : ''}{(change.delta * 100).toFixed(1)}%)
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Company Results with COGRI-style detailed calculations */}
            {companyResults.length > 0 && companyResults.map((result, idx) => (
              <div key={idx} className="space-y-6">
                {/* Score Card - Matching COGRI format */}
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-gray-300 text-sm mb-2">Baseline Score</p>
                          <div className="inline-block">
                            <div className={`${getRiskColor(result.baselineRiskLevel)} text-white px-6 py-3 rounded-lg`}>
                              <div className="text-4xl font-bold mb-1">{result.baselineScore}</div>
                              <div className="text-sm font-semibold">{result.baselineRiskLevel}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-300 text-sm mb-2">Scenario Score</p>
                          <div className="inline-block">
                            <div className={`${getRiskColor(result.scenarioRiskLevel)} text-white px-6 py-3 rounded-lg`}>
                              <div className="text-4xl font-bold mb-1">{result.scenarioScore}</div>
                              <div className="text-sm font-semibold">{result.scenarioRiskLevel}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1a2332] p-4 rounded-lg mb-4">
                        <p className="text-gray-300 text-sm">Score Change</p>
                        <p className={`text-3xl font-bold ${result.scoreDelta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {result.scoreDelta > 0 ? '+' : ''}{result.scoreDelta} points
                        </p>
                        <p className={`text-sm ${result.percentChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          ({result.percentChange > 0 ? '+' : ''}{result.percentChange.toFixed(1)}%)
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                          <div className="text-gray-200">Company</div>
                          <div className="text-white font-semibold">{result.company}</div>
                        </div>
                        <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                          <div className="text-gray-200">Sector</div>
                          <div className="text-white font-semibold">{result.sector}</div>
                        </div>
                        <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                          <div className="text-gray-200">Raw Baseline</div>
                          <div className="text-white font-semibold">{result.rawBaselineScore.toFixed(2)}</div>
                        </div>
                        <div className="bg-[#1a2332] p-3 rounded border border-gray-700">
                          <div className="text-gray-200">Sector Multiplier</div>
                          <div className="text-white font-semibold">{result.sectorMultiplier.toFixed(2)}x</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 bg-[#0d5f5f]/20 border border-[#0d5f5f] p-4 rounded">
                        <p className="text-white font-semibold mb-2">Impact Summary:</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{result.impactSummary}</p>
                      </div>
                      
                      {result.affectedCountries.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-300 text-sm mb-2">Affected Countries ({result.affectedCountries.length}):</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {result.affectedCountries.slice(0, 10).map((country, i) => (
                              <span key={i} className="bg-[#0d5f5f] text-white px-2 py-1 rounded text-xs">
                                {country}
                              </span>
                            ))}
                            {result.affectedCountries.length > 10 && (
                              <span className="text-gray-400 text-xs px-2 py-1">
                                +{result.affectedCountries.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Baseline Calculation Steps - Matching COGRI format */}
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Baseline Risk Score Calculation (CO-GRI Methodology)</CardTitle>
                    <CardDescription className="text-gray-200">
                      Complete step-by-step breakdown of the baseline geopolitical risk score using the exact same methodology as "Assess a Company or Ticker"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.baselineCalculationSteps.map((step, index) => 
                        renderCalculationStep(step, `baseline-step-${index}`)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Scenario Calculation Steps - Matching COGRI format */}
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Scenario Risk Score Calculation (CO-GRI Methodology)</CardTitle>
                    <CardDescription className="text-gray-200">
                      Complete step-by-step breakdown of how the scenario impacts the risk score. CSI changes from Layer 1 (Macro) are applied, then contributions are recalculated using the alignment amplifier.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.scenarioCalculationSteps.map((step, index) => 
                        renderCalculationStep(step, `scenario-step-${index}`)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Country-Level Exposure Comparison - Matching COGRI format */}
                <Card className="bg-[#0f1e2e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Country-Level Exposure Comparison</CardTitle>
                    <CardDescription className="text-gray-200">
                      Detailed comparison of baseline vs. scenario contributions for each country
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-200">Country</th>
                            <th className="text-right py-2 px-3 text-gray-200">Exposure %</th>
                            <th className="text-right py-2 px-3 text-gray-200">Base CSI</th>
                            <th className="text-right py-2 px-3 text-gray-200">Scenario CSI</th>
                            <th className="text-right py-2 px-3 text-gray-200">Base Contrib.</th>
                            <th className="text-right py-2 px-3 text-gray-200">Scenario Contrib.</th>
                            <th className="text-right py-2 px-3 text-gray-200">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.countryExposures
                            .sort((a, b) => Math.abs(b.scenarioContribution - b.baseContribution) - Math.abs(a.scenarioContribution - a.baseContribution))
                            .map((exp, expIdx) => {
                              const delta = exp.scenarioContribution - exp.baseContribution;
                              return (
                                <tr key={expIdx} className="border-b border-gray-700 hover:bg-[#1a2332]">
                                  <td className="py-2 px-3 text-white">{exp.country}</td>
                                  <td className="py-2 px-3 text-right text-white font-mono">
                                    {(exp.exposureWeight * 100).toFixed(2)}%
                                  </td>
                                  <td className="py-2 px-3 text-right text-white font-mono">
                                    {exp.baseCSI.toFixed(1)}
                                  </td>
                                  <td className="py-2 px-3 text-right text-white font-mono">
                                    {exp.scenarioCSI.toFixed(1)}
                                  </td>
                                  <td className="py-2 px-3 text-right text-white font-mono">
                                    {exp.baseContribution.toFixed(4)}
                                  </td>
                                  <td className="py-2 px-3 text-right text-white font-mono">
                                    {exp.scenarioContribution.toFixed(4)}
                                  </td>
                                  <td className={`py-2 px-3 text-right font-mono ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                    {delta > 0 ? '+' : ''}{delta.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-[#0d5f5f]/10 border border-[#0d5f5f]/30 rounded-lg p-6">
          <p className="text-gray-400 text-xs leading-relaxed">
            <strong>Disclaimer:</strong> Predictive Analytics services provide scenario modeling and risk forecasting based on geopolitical intelligence and expert analysis. These scenarios are hypothetical projections and should not be construed as guarantees of future events or investment outcomes. All investment decisions carry risk, and past performance or scenario analysis does not predict future results. Clients should conduct their own due diligence and consult with qualified financial advisors before making investment decisions. CedarOwl does not guarantee the accuracy of scenario forecasts and shall not be held liable for losses arising from reliance on predictive analytics. Geopolitical events are inherently unpredictable, and actual outcomes may differ materially from modeled scenarios.
          </p>
        </div>
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