/**
 * CSI Implementation Verification Dashboard
 * Phase 1: Visual interface for the Golden Test Harness
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Globe,
  Shield,
  TrendingUp,
  Activity,
  FileText,
  Database,
  TestTube,
  BarChart3
} from 'lucide-react';
import {
  csiVerificationService,
  CSITrace,
  CSIRiskVector,
  CSIRiskVectorNames,
  AcceptanceTestResult,
  TEST_COUNTRIES,
  QA_SCENARIOS
} from '@/services/csi/CSIVerificationService';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardState {
  initialized: boolean;
  loading: boolean;
  currentCSI: CSITrace[];
  acceptanceTestResults: {
    passed: boolean;
    total: number;
    passed_count: number;
    failed_count: number;
    results: AcceptanceTestResult[];
  } | null;
  scenarioValidation: {
    scenarios: {
      scenario_id: string;
      scenario_name: string;
      passed: boolean;
      details: string;
    }[];
    overall_passed: boolean;
  } | null;
  stats: Record<string, number>;
  error: string | null;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ passed: boolean }> = ({ passed }) => (
  <Badge variant={passed ? 'default' : 'destructive'} className={passed ? 'bg-green-600' : ''}>
    {passed ? (
      <><CheckCircle2 className="w-3 h-3 mr-1" /> Passed</>
    ) : (
      <><XCircle className="w-3 h-3 mr-1" /> Failed</>
    )}
  </Badge>
);

const RiskLevelBadge: React.FC<{ score: number }> = ({ score }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let label = 'Low';
  let className = 'bg-green-600';

  if (score >= 60) {
    variant = 'destructive';
    label = 'Very High';
    className = 'bg-red-600';
  } else if (score >= 40) {
    variant = 'destructive';
    label = 'High';
    className = 'bg-orange-500';
  } else if (score >= 25) {
    variant = 'secondary';
    label = 'Moderate';
    className = 'bg-yellow-500';
  }

  return <Badge className={className}>{label}</Badge>;
};

const VectorBar: React.FC<{ 
  vectorId: CSIRiskVector; 
  baseline: number; 
  drift: number; 
  eventDelta: number;
}> = ({ vectorId, baseline, drift, eventDelta }) => {
  const total = baseline + drift + eventDelta;
  const maxValue = 20; // Max per vector
  const percentage = Math.min(100, (total / maxValue) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{CSIRiskVectorNames[vectorId]}</span>
        <span className="font-mono">{total.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div 
          className="bg-blue-500 h-full" 
          style={{ width: `${(baseline / maxValue) * 100}%` }}
          title={`Baseline: ${baseline.toFixed(2)}`}
        />
        <div 
          className="bg-yellow-500 h-full" 
          style={{ width: `${(drift / maxValue) * 100}%` }}
          title={`Drift: ${drift.toFixed(2)}`}
        />
        <div 
          className="bg-red-500 h-full" 
          style={{ width: `${(eventDelta / maxValue) * 100}%` }}
          title={`Event Delta: ${eventDelta.toFixed(2)}`}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const CSIVerificationDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    initialized: false,
    loading: false,
    currentCSI: [],
    acceptanceTestResults: null,
    scenarioValidation: null,
    stats: {},
    error: null
  });

  // Initialize on mount
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await csiVerificationService.initialize();
      const currentCSI = csiVerificationService.getAllCountriesCSI();
      const stats = csiVerificationService.getStats();
      
      setState(prev => ({
        ...prev,
        initialized: true,
        loading: false,
        currentCSI,
        stats
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  };

  const runAcceptanceTests = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const results = await csiVerificationService.runAcceptanceTests();
      setState(prev => ({
        ...prev,
        loading: false,
        acceptanceTestResults: results
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Test execution failed'
      }));
    }
  };

  const validateScenarios = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const validation = csiVerificationService.validateAllScenarios();
      setState(prev => ({
        ...prev,
        loading: false,
        scenarioValidation: validation
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Scenario validation failed'
      }));
    }
  };

  const refreshData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const currentCSI = csiVerificationService.getAllCountriesCSI();
      const stats = csiVerificationService.getStats();
      setState(prev => ({
        ...prev,
        loading: false,
        currentCSI,
        stats
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CSI Implementation Verification</h1>
          <p className="text-muted-foreground">
            Phase 1: Golden Test Harness - Deterministic Replay & Validation
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={state.loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Test Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TEST_COUNTRIES.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CSI Traces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.stats.csi_traces || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.stats.signals_processed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.stats.events_confirmed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Acceptance Tests
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            QA Scenarios
          </TabsTrigger>
          <TabsTrigger value="traces" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Trace Details
          </TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current CSI Scores</CardTitle>
              <CardDescription>
                Real-time CSI calculations for all test countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">CSI Total</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Drift</TableHead>
                    <TableHead className="text-right">Event Delta</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.currentCSI.map(trace => (
                    <TableRow key={trace.country_id}>
                      <TableCell className="font-medium">
                        {trace.country_name}
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({trace.country_id})
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {trace.csi_total.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        {trace.baseline_total.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-yellow-600">
                        {trace.escalation_drift_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {trace.event_delta_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <RiskLevelBadge score={trace.csi_total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Vector Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.currentCSI.slice(0, 4).map(trace => (
              <Card key={trace.country_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{trace.country_name}</CardTitle>
                  <CardDescription>
                    CSI: {trace.csi_total.toFixed(1)} | Confidence: {(trace.confidence_score * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.values(CSIRiskVector).map(vectorId => {
                    const v = trace.by_vector[vectorId];
                    return (
                      <VectorBar
                        key={vectorId}
                        vectorId={vectorId}
                        baseline={v.baseline_v}
                        drift={v.drift_v}
                        eventDelta={v.event_delta_v}
                      />
                    );
                  })}
                  <div className="flex gap-4 text-xs pt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span>Baseline</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      <span>Drift</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span>Event Delta</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Acceptance Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Acceptance Tests</CardTitle>
                  <CardDescription>
                    Phase 1 hard gates - all tests must pass
                  </CardDescription>
                </div>
                <Button onClick={runAcceptanceTests} disabled={state.loading}>
                  <Play className="w-4 h-4 mr-2" />
                  Run Tests
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {state.acceptanceTestResults ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    {state.acceptanceTestResults.passed ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {state.acceptanceTestResults.passed 
                          ? 'All Tests Passed' 
                          : 'Some Tests Failed'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {state.acceptanceTestResults.passed_count} passed, {' '}
                        {state.acceptanceTestResults.failed_count} failed of {' '}
                        {state.acceptanceTestResults.total} total
                      </div>
                    </div>
                    <Progress 
                      value={(state.acceptanceTestResults.passed_count / state.acceptanceTestResults.total) * 100}
                      className="w-32 ml-auto"
                    />
                  </div>

                  {/* Test Results */}
                  <Accordion type="multiple" className="w-full">
                    {state.acceptanceTestResults.results.map(result => (
                      <AccordionItem key={result.test_id} value={result.test_id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            {result.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span>{result.test_name}</span>
                            <Badge variant="outline" className="ml-2">
                              {result.test_category}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-8">
                            {result.error_message && (
                              <div className="text-red-600 text-sm">
                                Error: {result.error_message}
                              </div>
                            )}
                            {result.assertions.map((assertion, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                {assertion.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                )}
                                <div>
                                  <div>{assertion.assertion}</div>
                                  {assertion.actual_value !== undefined && (
                                    <div className="text-muted-foreground font-mono text-xs">
                                      Actual: {JSON.stringify(assertion.actual_value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Run Tests" to execute acceptance tests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QA Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>QA Scenario Validation</CardTitle>
                  <CardDescription>
                    Real-world geopolitical scenarios CSI should react to
                  </CardDescription>
                </div>
                <Button onClick={validateScenarios} disabled={state.loading}>
                  <Shield className="w-4 h-4 mr-2" />
                  Validate Scenarios
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {state.scenarioValidation ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    {state.scenarioValidation.overall_passed ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {state.scenarioValidation.overall_passed 
                          ? 'All Scenarios Validated' 
                          : 'Some Scenarios Need Attention'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {state.scenarioValidation.scenarios.filter(s => s.passed).length} of {' '}
                        {state.scenarioValidation.scenarios.length} scenarios passed
                      </div>
                    </div>
                  </div>

                  {/* Scenario Results */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.scenarioValidation.scenarios.map(scenario => (
                        <TableRow key={scenario.scenario_id}>
                          <TableCell>
                            <div className="font-medium">{scenario.scenario_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {scenario.scenario_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge passed={scenario.passed} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {scenario.details}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4 text-muted-foreground">
                    Click "Validate Scenarios" to check QA scenarios
                  </div>
                  
                  {/* Scenario List */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead>Countries</TableHead>
                        <TableHead>Expected Vectors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {QA_SCENARIOS.map(scenario => (
                        <TableRow key={scenario.scenario_id}>
                          <TableCell>
                            <div className="font-medium">{scenario.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {scenario.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            {scenario.countries_affected.join(', ')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {scenario.expected_vectors.map(v => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trace Details Tab */}
        <TabsContent value="traces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSI Trace Details</CardTitle>
              <CardDescription>
                Full audit trail for CSI calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Accordion type="single" collapsible className="w-full">
                  {state.currentCSI.map(trace => (
                    <AccordionItem key={trace.trace_id} value={trace.trace_id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{trace.country_name}</span>
                          <Badge variant="outline">CSI: {trace.csi_total.toFixed(1)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {trace.active_signals_count} signals, {trace.confirmed_events_count} events
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          {/* Component Breakdown */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-blue-500/10 rounded">
                              <div className="text-xs text-muted-foreground">Baseline</div>
                              <div className="text-xl font-bold text-blue-600">
                                {trace.baseline_total.toFixed(1)}
                              </div>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded">
                              <div className="text-xs text-muted-foreground">Escalation Drift</div>
                              <div className="text-xl font-bold text-yellow-600">
                                {trace.escalation_drift_total.toFixed(2)}
                              </div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded">
                              <div className="text-xs text-muted-foreground">Event Delta</div>
                              <div className="text-xl font-bold text-red-600">
                                {trace.event_delta_total.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Vector Details */}
                          <div className="space-y-2">
                            <div className="text-sm font-semibold">Vector Breakdown</div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Vector</TableHead>
                                  <TableHead className="text-right">Baseline</TableHead>
                                  <TableHead className="text-right">Drift</TableHead>
                                  <TableHead className="text-right">Event</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead>Signals</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.values(CSIRiskVector).map(vectorId => {
                                  const v = trace.by_vector[vectorId];
                                  return (
                                    <TableRow key={vectorId}>
                                      <TableCell className="text-xs">
                                        {CSIRiskVectorNames[vectorId]}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs">
                                        {v.baseline_v.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs">
                                        {v.drift_v.toFixed(3)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs">
                                        {v.event_delta_v.toFixed(3)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs font-bold">
                                        {v.total_v.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {v.active_signals.length} signals, {v.active_events.length} events
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Metadata */}
                          <div className="text-xs text-muted-foreground">
                            <div>Trace ID: {trace.trace_id}</div>
                            <div>Computed: {trace.created_at.toISOString()}</div>
                            <div>Computation Time: {trace.computation_time_ms}ms</div>
                            <div>Confidence: {(trace.confidence_score * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSIVerificationDashboard;