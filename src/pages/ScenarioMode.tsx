/**
 * Scenario Mode Page
 * Main page for scenario stress testing with full integration
 */

import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ScenarioBuilder from '@/components/scenario/ScenarioBuilder';
import ScenarioImpactSummary from '@/components/scenario/ScenarioImpactSummary';
import ChannelAttribution from '@/components/scenario/ChannelAttribution';
import NodeAttribution from '@/components/scenario/NodeAttribution';
import TransmissionTrace from '@/components/scenario/TransmissionTrace';
import { LensBadge } from '@/components/common/LensBadge';
import { useScenarioState } from '@/store/scenarioState';
import { useGlobalState } from '@/store/globalState';

// Popular companies for dropdown
const POPULAR_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'META', name: 'Meta Platforms Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.' },
  { ticker: 'V', name: 'Visa Inc.' },
  { ticker: 'WMT', name: 'Walmart Inc.' },
];

export default function ScenarioMode() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const tickerParam = searchParams.get('ticker');
  
  const [selectedTicker, setSelectedTicker] = useState<string>(tickerParam || '');
  const [showWelcome, setShowWelcome] = useState(!tickerParam);
  
  const { scenarioResult, isCalculating, error, activeScenario } = useScenarioState();
  const { setMode, setLens, setSelectedCompany } = useGlobalState();

  // Initialize page state on mount
  useEffect(() => {
    setMode('Scenario');
    setLens('Scenario Shock');
    
    if (tickerParam) {
      setSelectedCompany(tickerParam);
      setSelectedTicker(tickerParam);
      setShowWelcome(false);
    }
  }, [tickerParam, setMode, setLens, setSelectedCompany]);

  // Handle company selection from dropdown
  const handleCompanySelect = (ticker: string) => {
    setSelectedTicker(ticker);
    setSelectedCompany(ticker);
    setLocation(`/scenario-mode?ticker=${ticker}`);
    setShowWelcome(false);
  };

  // Get company name from ticker
  const getCompanyName = (ticker: string): string => {
    const company = POPULAR_COMPANIES.find(c => c.ticker === ticker);
    return company ? company.name : ticker.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb and Lens Badge */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium">Scenario Mode</span>
              </div>
            </div>
            <LensBadge lens="Scenario Shock" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Scenario Mode: Stress Testing</h1>
              <p className="text-muted-foreground mt-1">
                Model "what-if" scenarios and assess geopolitical risk impact
              </p>
            </div>
            
            {/* Company Selector */}
            {!selectedTicker ? (
              <Select value={selectedTicker} onValueChange={handleCompanySelect}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_COMPANIES.map((company) => (
                    <SelectItem key={company.ticker} value={company.ticker}>
                      {company.ticker} - {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Analyzing</p>
                <p className="text-lg font-semibold">
                  {selectedTicker} - {getCompanyName(selectedTicker)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTicker('');
                    setLocation('/scenario-mode');
                    setShowWelcome(true);
                  }}
                  className="mt-1"
                >
                  Change Company
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-6 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Welcome State */}
      {showWelcome && !selectedTicker && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Scenario Mode</h2>
              <p className="text-muted-foreground">
                Stress test your portfolio companies against geopolitical scenarios
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-8 space-y-4 text-left">
              <h3 className="font-semibold text-lg">Quick Start Guide:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Select a company from the dropdown above</li>
                <li>Choose a quick-start template or configure a custom scenario</li>
                <li>Set event type, actor country, target countries, and severity</li>
                <li>Click "Run Scenario" to calculate impact</li>
                <li>Review ΔCO-GRI results and risk level changes</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Quick-Start Templates</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Taiwan Strait Crisis</li>
                  <li>• US-China Decoupling</li>
                  <li>• Middle East Oil Shock</li>
                  <li>• Russia Sanctions Escalation</li>
                </ul>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Custom Scenarios</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 11 event types available</li>
                  <li>• 195+ countries to select</li>
                  <li>• 4 propagation patterns</li>
                  <li>• Advanced options for fine-tuning</li>
                </ul>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Select a company above to get started
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      {selectedTicker && (
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Scenario Builder (40%) - Sticky on desktop */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-6">
                <ScenarioBuilder ticker={selectedTicker} />
              </div>
            </div>

            {/* Right Column: Results (60%) */}
            <div className="lg:col-span-7 space-y-6">
              {/* S2: Scenario Impact Summary */}
              <ScenarioImpactSummary 
                result={scenarioResult} 
                scenarioName={activeScenario?.name}
                isLoading={isCalculating}
              />

              {/* S3: Channel Attribution */}
              {scenarioResult && !isCalculating && (
                <ChannelAttribution 
                  result={scenarioResult}
                  isLoading={isCalculating}
                />
              )}

              {/* S4: Node Attribution */}
              {scenarioResult && !isCalculating && (
                <NodeAttribution
                  result={scenarioResult}
                  isLoading={isCalculating}
                  actorCountry={activeScenario?.config.actorCountry}
                  targetCountries={activeScenario?.config.targetCountries}
                />
              )}

              {/* S5: Transmission Trace */}
              {scenarioResult && !isCalculating && (
                <TransmissionTrace
                  result={scenarioResult}
                  isLoading={isCalculating}
                  actorCountry={activeScenario?.config.actorCountry}
                  targetCountries={activeScenario?.config.targetCountries}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}