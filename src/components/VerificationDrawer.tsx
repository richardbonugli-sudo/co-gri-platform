import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, AlertCircle, Info, ExternalLink, FileCheck, Database, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

interface CalculationStep {
  step: number;
  name: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  formula?: string;
  status: 'completed' | 'pending' | 'error';
}

interface DataSource {
  name: string;
  type: string;
  lastUpdated: string;
  reliability: number;
  url?: string;
}

interface ValidationResult {
  test: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

interface VerificationDrawerProps {
  companyTicker: string;
  companyName: string;
  cogriScore: number;
}

const VerificationDrawer: React.FC<VerificationDrawerProps> = ({ companyTicker, companyName, cogriScore }) => {
  const [isOpen, setIsOpen] = useState(false);  // Collapsed by default per specification
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Mock calculation steps
  const calculationSteps: CalculationStep[] = [
    {
      step: 1,
      name: 'Structural Baseline Calculation',
      description: 'Calculate baseline risk from historical geopolitical data',
      input: {
        historicalEvents: 247,
        timeWindow: '5 years',
        countries: ['USA', 'China', 'Germany', 'Japan'],
      },
      output: {
        baselineRisk: 42.3,
        confidence: 0.87,
      },
      formula: 'Baseline = Σ(EventSeverity × DecayFactor) / TimeWindow',
      status: 'completed',
    },
    {
      step: 2,
      name: 'Escalation Drift Assessment',
      description: 'Evaluate emerging risk signals and trends',
      input: {
        emergingSignals: 18,
        trendStrength: 0.65,
        vectorsAffected: ['Political', 'Economic'],
      },
      output: {
        driftScore: 8.7,
        escalationRate: 0.12,
      },
      formula: 'Drift = Σ(SignalStrength × VectorWeight × TrendFactor)',
      status: 'completed',
    },
    {
      step: 3,
      name: 'Event Delta Integration',
      description: 'Incorporate confirmed geopolitical events',
      input: {
        confirmedEvents: 5,
        avgEventSeverity: 72,
        timeDecay: 0.85,
      },
      output: {
        eventDelta: 12.4,
        peakImpact: 15.2,
      },
      formula: 'Delta = Σ(EventImpact × TimeDecay × RelevanceFactor)',
      status: 'completed',
    },
    {
      step: 4,
      name: 'Netting & Deduplication',
      description: 'Remove overlapping signals to prevent double-counting',
      input: {
        rawSignals: 23,
        overlappingSignals: 4,
      },
      output: {
        nettedSignals: 19,
        adjustmentFactor: -3.2,
      },
      formula: 'Netted = Raw - Σ(OverlapWeight × SignalCorrelation)',
      status: 'completed',
    },
    {
      step: 5,
      name: 'Final CO-GRI Score',
      description: 'Aggregate all components into final score',
      input: {
        baseline: 42.3,
        drift: 8.7,
        delta: 12.4,
        netting: -3.2,
      },
      output: {
        cogriScore: cogriScore,
        riskLevel: cogriScore < 50 ? 'Medium' : 'High',
      },
      formula: 'CO-GRI = Baseline + Drift + Delta + Netting',
      status: 'completed',
    },
  ];

  // Mock data sources
  const dataSources: DataSource[] = [
    {
      name: 'CSI Event Store',
      type: 'Internal Database',
      lastUpdated: '2024-01-15 14:30 UTC',
      reliability: 98,
      url: '/services/csi/eventStore',
    },
    {
      name: 'GDELT Global Events',
      type: 'External API',
      lastUpdated: '2024-01-15 12:00 UTC',
      reliability: 95,
      url: 'https://gdeltproject.org',
    },
    {
      name: 'World Bank Indicators',
      type: 'External API',
      lastUpdated: '2024-01-10 00:00 UTC',
      reliability: 99,
      url: 'https://data.worldbank.org',
    },
    {
      name: 'ACLED Conflict Data',
      type: 'External API',
      lastUpdated: '2024-01-14 18:00 UTC',
      reliability: 96,
      url: 'https://acleddata.com',
    },
    {
      name: 'Company Exposure Database',
      type: 'Internal Database',
      lastUpdated: '2024-01-15 10:00 UTC',
      reliability: 97,
    },
  ];

  // Mock validation results
  const validationResults: ValidationResult[] = [
    {
      test: 'Time Series Continuity',
      status: 'passed',
      message: 'No gaps detected in historical data',
      details: 'Validated 1,825 consecutive data points',
    },
    {
      test: 'Signal Trace Validation',
      status: 'passed',
      message: 'All signals properly attributed to source events',
      details: '247 events traced successfully',
    },
    {
      test: 'Calculation Determinism',
      status: 'passed',
      message: 'Score reproducible across multiple runs',
      details: 'Variance: 0.001% across 5 runs',
    },
    {
      test: 'Data Freshness',
      status: 'warning',
      message: 'Some data sources slightly outdated',
      details: 'World Bank data is 5 days old',
    },
    {
      test: 'Baseline Completeness',
      status: 'passed',
      message: 'All required vectors have baseline data',
      details: '6/6 vectors validated',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      passed: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileCheck className="h-4 w-4" />
          View Calculation Details
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="mb-3">
            <LensBadge lens={activeLens} />
          </div>
          <SheetTitle>CO-GRI Verification & Audit Trail</SheetTitle>
          <SheetDescription>
            Detailed calculation breakdown for {companyName} ({companyTicker})
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="calculation" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculation">Calculation</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          {/* Calculation Steps Tab */}
          <TabsContent value="calculation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculation Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {calculationSteps.map((step) => (
                    <AccordionItem key={step.step} value={`step-${step.step}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-left">
                          {getStatusIcon(step.status)}
                          <div>
                            <div className="font-semibold">Step {step.step}: {step.name}</div>
                            <div className="text-sm text-gray-600">{step.description}</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-8 pt-2">
                          {/* Formula */}
                          {step.formula && (
                            <div className="bg-gray-50 p-3 rounded border">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Formula:</p>
                              <code className="text-sm text-blue-700">{step.formula}</code>
                            </div>
                          )}

                          {/* Input */}
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Input:</p>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <pre className="text-xs text-gray-800 overflow-x-auto">
                                {JSON.stringify(step.input, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Output */}
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Output:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                              <pre className="text-xs text-gray-800 overflow-x-auto">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadge(step.status)}>
                              {step.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataSources.map((source, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.type}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {source.reliability}% reliable
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Last updated: {source.lastUpdated}</p>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          View source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Validation Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {validationResults.map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900">{result.test}</h4>
                          <Badge className={getStatusBadge(result.status)}>
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Validation Summary</p>
                  <p>
                    {validationResults.filter(r => r.status === 'passed').length} of {validationResults.length} tests passed. 
                    The CO-GRI score for {companyTicker} has been validated and is ready for use.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default VerificationDrawer;