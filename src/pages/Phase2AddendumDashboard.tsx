/**
 * Phase 2 Addendum Dashboard
 * 
 * Interactive dashboard for Phase 2 Addendum diagnostics with 9 comprehensive tabs
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
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Database,
  BarChart3,
  TrendingUp,
  GitBranch,
  Zap,
  Anchor,
  Shield,
  Gauge,
  Award,
  FileText,
  AlertOctagon,
  Info
} from 'lucide-react';
import {
  globalAuditPhase2AddendumService,
  Phase2AddendumReport,
  CoverageReport,
  BaselineDecomposition,
  MovementAttribution,
  CoverageRoutingDiagnostics,
  EmergentSpikeDiscovery,
  AnchorEventValidationAddendum,
  SpilloverContaminationAudit,
  CalibrationStressTest,
  FinalVerdictAddendum,
  TopFix
} from '@/services/csi/GlobalAuditServicePhase2Addendum';
import { Phase2AddendumReportGenerator } from '@/services/csi/Phase2AddendumReportGenerator';
import { CSIRiskVectorNames } from '@/services/csi/types/CSITypes';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardState {
  loading: boolean;
  report: Phase2AddendumReport | null;
  error: string | null;
  downloadingPdf: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const VerdictBadge: React.FC<{ verdict: 'READY' | 'REQUIRES_CALIBRATION' | 'BLOCKED' }> = ({ verdict }) => {
  const config = {
    'READY': { label: 'READY', className: 'bg-green-600' },
    'REQUIRES_CALIBRATION': { label: 'NEEDS CALIBRATION', className: 'bg-yellow-600' },
    'BLOCKED': { label: 'BLOCKED', className: 'bg-red-600' }
  };
  const { label, className } = config[verdict];
  return <Badge className={className}>{label}</Badge>;
};

const PassGateBadge: React.FC<{ passed: boolean }> = ({ passed }) => {
  return (
    <Badge className={passed ? 'bg-green-600' : 'bg-red-600'}>
      {passed ? 'PASS ✓' : 'FAIL ✗'}
    </Badge>
  );
};

const PriorityBadge: React.FC<{ priority: 'critical' | 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const config = {
    'critical': { className: 'bg-red-600' },
    'high': { className: 'bg-orange-600' },
    'medium': { className: 'bg-yellow-600' },
    'low': { className: 'bg-gray-600' }
  };
  return <Badge className={config[priority].className}>{priority.toUpperCase()}</Badge>;
};

const OwnerBadge: React.FC<{ owner: 'Data' | 'Routing' | 'Scoring' | 'Pipeline' }> = ({ owner }) => {
  const config = {
    'Data': { className: 'bg-blue-600' },
    'Routing': { className: 'bg-purple-600' },
    'Scoring': { className: 'bg-indigo-600' },
    'Pipeline': { className: 'bg-pink-600' }
  };
  return <Badge className={config[owner].className}>{owner}</Badge>;
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Phase2AddendumDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    loading: false,
    report: null,
    error: null,
    downloadingPdf: false
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const report = await globalAuditPhase2AddendumService.runCompleteAudit();
      setState(prev => ({ ...prev, loading: false, report }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to run diagnostics'
      }));
    }
  };

  const downloadPdfReport = async () => {
    if (!state.report) return;

    setState(prev => ({ ...prev, downloadingPdf: true }));
    try {
      const generator = new Phase2AddendumReportGenerator();
      generator.downloadReport(state.report, `Phase2_Addendum_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setState(prev => ({ ...prev, downloadingPdf: false }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phase 2 Addendum Dashboard</h1>
          <p className="text-muted-foreground">
            Global Backfill Diagnostics & Production Readiness Assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={runDiagnostics}
            disabled={state.loading}
          >
            {state.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
          <Button
            onClick={downloadPdfReport}
            disabled={!state.report || state.downloadingPdf}
          >
            {state.downloadingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
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

      {/* Loading State */}
      {state.loading && !state.report && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Running comprehensive diagnostics...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {state.report && (
        <>
          {/* Verdict Banner */}
          <Card className={`border-2 ${
            state.report.step9_verdict.verdict === 'READY' ? 'border-green-500 bg-green-500/5' :
            state.report.step9_verdict.verdict === 'REQUIRES_CALIBRATION' ? 'border-yellow-500 bg-yellow-500/5' :
            'border-red-500 bg-red-500/5'
          }`}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {state.report.step9_verdict.verdict === 'READY' ? (
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  ) : state.report.step9_verdict.verdict === 'REQUIRES_CALIBRATION' ? (
                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                  ) : (
                    <AlertOctagon className="w-12 h-12 text-red-500" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{state.report.step9_verdict.verdict_label}</h2>
                    <p className="text-muted-foreground">
                      Generated: {state.report.generation_timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <VerdictBadge verdict={state.report.step9_verdict.verdict} />
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Countries Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {state.report.step1_coverage.countries_processed}/195
                </div>
                <Progress 
                  value={(state.report.step1_coverage.countries_processed / 195) * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Country-Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {state.report.step1_coverage.total_country_days.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gates Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[
                    state.report.step1_coverage.pass_gate,
                    state.report.step2_baseline.pass_gate,
                    state.report.step3_movement.pass_gate,
                    state.report.step4_routing.pass_gate,
                    state.report.step5_spikes.pass_gate,
                    state.report.step6_anchors.pass_gate,
                    state.report.step7_spillover.pass_gate,
                    state.report.step8_calibration.pass_gate
                  ].filter(Boolean).length}/8
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  All Gates Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PassGateBadge passed={state.report.all_gates_passed} />
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="verdict" className="space-y-4">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="verdict" className="text-xs">
                <Award className="w-3 h-3 mr-1" />
                Verdict
              </TabsTrigger>
              <TabsTrigger value="coverage" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                Coverage
              </TabsTrigger>
              <TabsTrigger value="baseline" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Baseline
              </TabsTrigger>
              <TabsTrigger value="movement" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Movement
              </TabsTrigger>
              <TabsTrigger value="routing" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                Routing
              </TabsTrigger>
              <TabsTrigger value="spikes" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Spikes
              </TabsTrigger>
              <TabsTrigger value="anchors" className="text-xs">
                <Anchor className="w-3 h-3 mr-1" />
                Anchors
              </TabsTrigger>
              <TabsTrigger value="spillover" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Spillover
              </TabsTrigger>
              <TabsTrigger value="calibration" className="text-xs">
                <Gauge className="w-3 h-3 mr-1" />
                Calibration
              </TabsTrigger>
            </TabsList>

            {/* Step 9: Final Verdict */}
            <TabsContent value="verdict" className="space-y-4">
              <VerdictTab verdict={state.report.step9_verdict} />
            </TabsContent>

            {/* Step 1: Coverage */}
            <TabsContent value="coverage" className="space-y-4">
              <CoverageTab coverage={state.report.step1_coverage} />
            </TabsContent>

            {/* Step 2: Baseline */}
            <TabsContent value="baseline" className="space-y-4">
              <BaselineTab baseline={state.report.step2_baseline} />
            </TabsContent>

            {/* Step 3: Movement */}
            <TabsContent value="movement" className="space-y-4">
              <MovementTab movement={state.report.step3_movement} />
            </TabsContent>

            {/* Step 4: Routing */}
            <TabsContent value="routing" className="space-y-4">
              <RoutingTab routing={state.report.step4_routing} />
            </TabsContent>

            {/* Step 5: Spikes */}
            <TabsContent value="spikes" className="space-y-4">
              <SpikesTab spikes={state.report.step5_spikes} />
            </TabsContent>

            {/* Step 6: Anchors */}
            <TabsContent value="anchors" className="space-y-4">
              <AnchorsTab anchors={state.report.step6_anchors} />
            </TabsContent>

            {/* Step 7: Spillover */}
            <TabsContent value="spillover" className="space-y-4">
              <SpilloverTab spillover={state.report.step7_spillover} />
            </TabsContent>

            {/* Step 8: Calibration */}
            <TabsContent value="calibration" className="space-y-4">
              <CalibrationTab calibration={state.report.step8_calibration} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// ============================================================================
// TAB COMPONENTS
// ============================================================================

const VerdictTab: React.FC<{ verdict: FinalVerdictAddendum }> = ({ verdict }) => {
  return (
    <>
      {/* Large Verdict Card */}
      <Card className={`border-4 ${
        verdict.verdict === 'READY' ? 'border-green-500' :
        verdict.verdict === 'REQUIRES_CALIBRATION' ? 'border-yellow-500' :
        'border-red-500'
      }`}>
        <CardContent className="py-8">
          <div className="text-center">
            {verdict.verdict === 'READY' ? (
              <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
            ) : verdict.verdict === 'REQUIRES_CALIBRATION' ? (
              <AlertTriangle className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            ) : (
              <AlertOctagon className="w-24 h-24 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-4xl font-bold mb-2">{verdict.verdict_label}</h1>
            <p className="text-xl text-muted-foreground">{verdict.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Plausibility Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Plausibility Questions</CardTitle>
          <CardDescription>Key questions determining production readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              console.log('[Dashboard] Rendering plausibility answers');
              console.log('[Dashboard] - verdict object:', verdict);
              console.log('[Dashboard] - plausibility_answers exists:', !!verdict?.plausibility_answers);
              console.log('[Dashboard] - plausibility_answers value:', verdict?.plausibility_answers);
              
              if (!verdict) {
                console.error('[Dashboard] ERROR: verdict is null or undefined');
                const errorElement = (
                  <div className="p-4 border-2 border-red-500 rounded-lg bg-red-500/5">
                    <p className="text-red-600 font-semibold">Error: Verdict data not available</p>
                  </div>
                );
                return errorElement;
              }
              
              if (!verdict.plausibility_answers) {
                console.error('[Dashboard] ERROR: plausibility_answers is null or undefined');
                console.error('[Dashboard] - Full verdict object:', JSON.stringify(verdict, null, 2));
                const errorElement = (
                  <div className="p-4 border-2 border-red-500 rounded-lg bg-red-500/5">
                    <p className="text-red-600 font-semibold">Error: Plausibility answers not available</p>
                    <p className="text-sm text-red-500 mt-1">Check console for details</p>
                  </div>
                );
                return errorElement;
              }
              
              let entries: [string, boolean][] = [];
              let hasError = false;
              let errorMessage = '';
              
              try {
                entries = Object.entries(verdict.plausibility_answers) as [string, boolean][];
                console.log('[Dashboard] - plausibility_answers entries:', entries);
              } catch (error) {
                console.error('[Dashboard] ERROR rendering plausibility answers:', error);
                hasError = true;
                errorMessage = error instanceof Error ? error.message : 'Unknown error';
              }
              
              if (hasError) {
                const errorElement = (
                  <div className="p-4 border-2 border-red-500 rounded-lg bg-red-500/5">
                    <p className="text-red-600 font-semibold">Error rendering plausibility answers</p>
                    <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
                  </div>
                );
                return errorElement;
              }
              
              if (entries.length === 0) {
                console.warn('[Dashboard] WARNING: plausibility_answers is empty');
                const warningElement = (
                  <div className="p-4 border-2 border-yellow-500 rounded-lg bg-yellow-500/5">
                    <p className="text-yellow-600 font-semibold">Warning: No plausibility answers available</p>
                  </div>
                );
                return warningElement;
              }
              
              return entries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <Badge className={value ? 'bg-green-600' : 'bg-red-600'}>
                    {value ? 'YES ✓' : 'NO ✗'}
                  </Badge>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Priority Fixes</CardTitle>
          <CardDescription>Ranked by impact and urgency</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Expected Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verdict.top5_fixes.map((fix) => (
                <TableRow key={fix.rank}>
                  <TableCell className="font-mono">{fix.rank}</TableCell>
                  <TableCell className="font-medium">{fix.issue}</TableCell>
                  <TableCell><OwnerBadge owner={fix.owner} /></TableCell>
                  <TableCell><PriorityBadge priority={fix.priority} /></TableCell>
                  <TableCell className="text-sm">{fix.expected_impact}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

const CoverageTab: React.FC<{ coverage: CoverageReport }> = ({ coverage }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Coverage Status
          </CardTitle>
          <CardDescription>Step 1: ALL 195 countries required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Countries Processed</div>
              <div className="text-2xl font-bold">{coverage.countries_processed}/195</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Country-Days</div>
              <div className="text-2xl font-bold">{coverage.total_country_days.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Pass Gate</div>
              <PassGateBadge passed={coverage.pass_gate} />
            </div>
          </div>

          {coverage.missing_countries.length > 0 && (
            <div className="p-4 border-2 border-red-500 rounded-lg bg-red-500/5">
              <h4 className="font-semibold text-red-600 mb-2">
                ⚠️ Missing Countries: {coverage.missing_countries.length}
              </h4>
              <ScrollArea className="h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ISO3</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Error Reason</TableHead>
                      <TableHead>Proposed Fix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverage.missing_countries.map((mc) => (
                      <TableRow key={mc.iso3}>
                        <TableCell className="font-mono">{mc.iso3}</TableCell>
                        <TableCell>{mc.country_name}</TableCell>
                        <TableCell className="text-sm">{mc.error_reason.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-sm">{mc.proposed_fix}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Freshness</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Type</TableHead>
                <TableHead>Source Name</TableHead>
                <TableHead>Days Stale</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...coverage.data_freshness.baseline_sources.map(s => ({ ...s, type: 'Baseline' })),
                ...coverage.data_freshness.detection_sources.map(s => ({ ...s, type: 'Detection' })),
                ...coverage.data_freshness.confirmation_sources.map(s => ({ ...s, type: 'Confirmation' }))
              ].map((source, idx) => (
                <TableRow key={idx}>
                  <TableCell>{source.type}</TableCell>
                  <TableCell>{source.source_name}</TableCell>
                  <TableCell className="font-mono">{source.days_stale}</TableCell>
                  <TableCell>
                    <Badge className={source.is_stale ? 'bg-yellow-600' : 'bg-green-600'}>
                      {source.is_stale ? 'Stale' : 'Fresh'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

const BaselineTab: React.FC<{ baseline: BaselineDecomposition }> = ({ baseline }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Baseline Decomposition</CardTitle>
          <CardDescription>Step 2: Structural factor analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Global Mean Baseline</div>
              <div className="text-2xl font-bold">{baseline.global_stats.mean_baseline_total.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Pass Gate</div>
              <PassGateBadge passed={baseline.pass_gate} />
            </div>
          </div>

          <h4 className="font-semibold mb-2">Plausibility Verification</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm">Fragile/Conflict vs OECD Elevated</span>
              <Badge className={baseline.plausibility_verification.fragile_vs_oecd_elevated ? 'bg-green-600' : 'bg-red-600'}>
                {baseline.plausibility_verification.fragile_vs_oecd_elevated ? 'YES ✓' : 'NO ✗'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm">Sanctioned Show Sanctions Baseline</span>
              <Badge className={baseline.plausibility_verification.sanctioned_show_sanctions_baseline ? 'bg-green-600' : 'bg-red-600'}>
                {baseline.plausibility_verification.sanctioned_show_sanctions_baseline ? 'YES ✓' : 'NO ✗'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 20 Countries by Baseline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead className="text-right">Baseline Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baseline.top20_by_baseline.map((country) => (
                  <TableRow key={country.country_id}>
                    <TableCell className="font-medium">{country.country_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{country.classification.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{country.baseline_total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

const MovementTab: React.FC<{ movement: MovementAttribution }> = ({ movement }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Movement Attribution</CardTitle>
          <CardDescription>Step 3: Drift vs Event vs Baseline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Baseline Ratio</div>
              <div className="text-2xl font-bold">{(movement.global_composition.baseline_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Drift Ratio</div>
              <div className="text-2xl font-bold">{(movement.global_composition.drift_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Event Ratio</div>
              <div className="text-2xl font-bold">{(movement.global_composition.event_ratio * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Activity Diagnosis</h4>
            <Badge className={
              movement.activity_diagnostics.diagnosis === 'healthy' ? 'bg-green-600' :
              movement.activity_diagnostics.diagnosis === 'dead_index' ? 'bg-red-600' :
              'bg-yellow-600'
            }>
              {movement.activity_diagnostics.diagnosis.toUpperCase()}
            </Badge>
            <div className="mt-3 space-y-1 text-sm">
              <div>Days with Negligible Movement: {movement.activity_diagnostics.pct_days_movement_negligible.toFixed(1)}%</div>
              <div>Days with Drift Dominant: {movement.activity_diagnostics.pct_days_drift_dominant.toFixed(1)}%</div>
              <div>Days with Event Dominant: {movement.activity_diagnostics.pct_days_event_dominant.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drift Share by Vector</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vector</TableHead>
                <TableHead className="text-right">Global Share</TableHead>
                <TableHead className="text-right">Median</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(movement.drift_share_by_vector).map((v) => (
                <TableRow key={v.vector_id}>
                  <TableCell className="font-medium">{v.vector_name}</TableCell>
                  <TableCell className="text-right font-mono">{(v.global_share * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-mono">{(v.median * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

const RoutingTab: React.FC<{ routing: CoverageRoutingDiagnostics }> = ({ routing }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Routing Diagnostics</CardTitle>
          <CardDescription>Step 4: Coverage vs Routing vs Scoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border mb-4">
            <h4 className="font-semibold mb-2">Diagnostic Conclusion</h4>
            <Badge className={
              routing.conclusion.primary_cause === 'coverage' ? 'bg-red-600' :
              routing.conclusion.primary_cause === 'routing' ? 'bg-yellow-600' :
              'bg-blue-600'
            }>
              PRIMARY CAUSE: {routing.conclusion.primary_cause.toUpperCase()}
            </Badge>
            <div className="mt-3 space-y-1 text-sm">
              {routing.conclusion.evidence.map((e, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total Raw Detections</div>
              <div className="text-2xl font-bold">{routing.pre_routing_inventory.total_raw_detections}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total Raw Confirmations</div>
              <div className="text-2xl font-bold">{routing.pre_routing_inventory.total_raw_confirmations}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synthetic Injection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Overall Accuracy</span>
              <Badge className={routing.synthetic_injection.pass ? 'bg-green-600' : 'bg-red-600'}>
                {(routing.synthetic_injection.overall_accuracy * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Threshold: 95% {routing.synthetic_injection.pass ? '✓' : '✗'}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vector</TableHead>
                <TableHead className="text-right">Injected</TableHead>
                <TableHead className="text-right">Correct</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(routing.synthetic_injection.per_vector_results).map(([vector, result]: [any, any]) => (
                <TableRow key={vector}>
                  <TableCell className="font-medium">{CSIRiskVectorNames[vector]}</TableCell>
                  <TableCell className="text-right font-mono">{result.injected}</TableCell>
                  <TableCell className="text-right font-mono">{result.correctly_routed}</TableCell>
                  <TableCell className="text-right font-mono">{(result.routing_accuracy * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

const SpikesTab: React.FC<{ spikes: EmergentSpikeDiscovery }> = ({ spikes }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spike Quality Assessment</CardTitle>
          <CardDescription>Step 5: Emergent spike discovery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total Spikes</div>
              <div className="text-2xl font-bold">{spikes.spike_quality_assessment.total_spikes}</div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Valid</div>
              <div className="text-2xl font-bold text-green-600">{spikes.spike_quality_assessment.valid_count}</div>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Spurious</div>
              <div className="text-2xl font-bold text-red-600">{spikes.spike_quality_assessment.spurious_count}</div>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Uncertain</div>
              <div className="text-2xl font-bold text-yellow-600">{spikes.spike_quality_assessment.uncertain_count}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Geopolitically Plausible</span>
              <Badge className={spikes.spike_quality_assessment.geopolitically_plausible ? 'bg-green-600' : 'bg-red-600'}>
                {spikes.spike_quality_assessment.geopolitically_plausible ? 'YES ✓' : 'NO ✗'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {spikes.spike_quality_assessment.pct_with_documentary_support.toFixed(1)}% with documentary support
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 20 Validated Spikes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Magnitude</TableHead>
                  <TableHead>Vector</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spikes.top100_spikes.slice(0, 20).map((spike) => (
                  <TableRow key={spike.spike_id}>
                    <TableCell className="font-medium">{spike.country_name}</TableCell>
                    <TableCell className="font-mono text-sm">{spike.date.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-mono">{spike.magnitude.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {CSIRiskVectorNames[spike.dominant_vector]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        spike.validation_status === 'valid' ? 'bg-green-600' :
                        spike.validation_status === 'spurious' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }>
                        {spike.validation_status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
};

const AnchorsTab: React.FC<{ anchors: AnchorEventValidationAddendum }> = ({ anchors }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anchor Event Validation</CardTitle>
        <CardDescription>Step 6: Predefined anchor event sanity checks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Total Events</div>
            <div className="text-2xl font-bold">{anchors.anchor_events.length}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Pass Rate</div>
            <div className="text-2xl font-bold">{(anchors.overall_pass_rate * 100).toFixed(1)}%</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Pass Gate</div>
            <PassGateBadge passed={anchors.pass_gate} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead>Routing</TableHead>
              <TableHead>Drift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anchors.anchor_events.map((result, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium max-w-[200px]">{result.event.name}</TableCell>
                <TableCell className="font-mono text-sm">{result.event.effective_date.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={result.pass ? 'bg-green-600' : 'bg-red-600'}>
                    {result.pass ? 'PASS ✓' : 'FAIL ✗'}
                  </Badge>
                </TableCell>
                <TableCell>{result.correct_vector_routing ? '✓' : '✗'}</TableCell>
                <TableCell>{result.drift_before_confirmation ? '✓' : '✗'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const SpilloverTab: React.FC<{ spillover: SpilloverContaminationAudit }> = ({ spillover }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spillover & Contamination</CardTitle>
        <CardDescription>Step 7: Cross-country and vector contamination checks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Cross-Country Spillover</div>
            <div className="text-2xl font-bold">{spillover.cross_country_spillover.length}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Vector Contamination</div>
            <div className="text-2xl font-bold">{spillover.vector_contamination.length}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Pass Gate</div>
            <PassGateBadge passed={spillover.pass_gate} />
          </div>
        </div>

        {spillover.cross_country_spillover.length === 0 && 
         spillover.vector_contamination.length === 0 && 
         spillover.macro_contamination.length === 0 && (
          <div className="p-6 text-center border-2 border-green-500 rounded-lg bg-green-500/5">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-600">No spillover or contamination incidents detected</p>
            <p className="text-sm text-muted-foreground mt-1">System is functioning cleanly</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CalibrationTab: React.FC<{ calibration: CalibrationStressTest }> = ({ calibration }) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Calibration Stress Test</CardTitle>
          <CardDescription>Step 8: Parameter balance and system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Structural Weights</div>
              <PassGateBadge passed={calibration.structural_weight_verification.pass} />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Parameter Imbalances</div>
              <div className="text-2xl font-bold">{calibration.parameter_imbalances.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vector Dominance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vector</TableHead>
                <TableHead className="text-right">Movement Share</TableHead>
                <TableHead>Dominating</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calibration.vector_dominance_analysis.map((v) => (
                <TableRow key={v.vector_id}>
                  <TableCell className="font-medium">{v.vector_name}</TableCell>
                  <TableCell className="text-right font-mono">{(v.global_movement_share * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={v.is_dominating ? 'bg-yellow-600' : 'bg-green-600'}>
                      {v.is_dominating ? 'YES' : 'NO'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{v.dominance_type || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {calibration.parameter_imbalances.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">Parameter Imbalances Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calibration.parameter_imbalances.map((imbalance, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-yellow-500 bg-yellow-500/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{imbalance.parameter}</div>
                      <div className="text-sm text-muted-foreground mt-1">{imbalance.issue}</div>
                    </div>
                    <Badge className={
                      imbalance.severity === 'high' ? 'bg-red-600' :
                      imbalance.severity === 'medium' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }>
                      {imbalance.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {calibration.recommended_adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Parameter Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Recommended</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calibration.recommended_adjustments.map((adj, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{adj.parameter}</TableCell>
                    <TableCell className="font-mono text-sm">{String(adj.current_value)}</TableCell>
                    <TableCell className="font-mono text-sm">{String(adj.recommended_value)}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={adj.priority as any} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Phase2AddendumDashboard;