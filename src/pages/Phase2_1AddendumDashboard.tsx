/**
 * Phase 2.1 Addendum Dashboard
 * 
 * Interactive dashboard for Phase 2.1 Addendum diagnostics with comprehensive CSV tables
 * Addresses all missing diagnostics from the original Phase 2 run
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
  FileText,
  AlertOctagon,
  Info,
  Copy,
  CheckCheck,
  Table as TableIcon,
  FileCode
} from 'lucide-react';
import {
  globalAuditPhase2_1AddendumService,
  Phase2_1AddendumReport,
  MissingCountryRow,
  BaselineFactorDistributionRow,
  BaselineAuditSampleRow,
  BaselineSourceRegistryRow,
  MovementRatioRow,
  TrueDriftShareRow,
  TrueEventShareRow,
  PreRoutingCandidateRow,
  PostRoutingDistributionRow,
  ScoringSuppressionRow,
  SourceAttributionRow,
  FullSourceRegistryRow,
  SourceConcentrationRow,
  StructuredVsMediaRow,
  ConfusionSampleRow,
  SyntheticInjectionRow,
  ValidatedSpikeRow,
  MissedCrisisRow,
  AnchorEvaluationRow
} from '@/services/csi/GlobalAuditServicePhase2_1Addendum';
import { CSIRiskVectorNames } from '@/services/csi/types/CSITypes';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardState {
  loading: boolean;
  report: Phase2_1AddendumReport | null;
  error: string | null;
  copiedSection: string | null;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const PassFailBadge: React.FC<{ passed: boolean }> = ({ passed }) => (
  <Badge className={passed ? 'bg-green-600' : 'bg-red-600'}>
    {passed ? 'PASS ✓' : 'FAIL ✗'}
  </Badge>
);

const OwnerBadge: React.FC<{ owner: 'Data' | 'Routing' | 'Pipeline' }> = ({ owner }) => {
  const config = {
    'Data': { className: 'bg-blue-600' },
    'Routing': { className: 'bg-purple-600' },
    'Pipeline': { className: 'bg-pink-600' }
  };
  return <Badge className={config[owner].className}>{owner}</Badge>;
};

const CauseBadge: React.FC<{ cause: string }> = ({ cause }) => {
  const config: Record<string, string> = {
    'coverage_gap': 'bg-red-600',
    'routing_gap': 'bg-yellow-600',
    'scoring_suppression': 'bg-orange-600',
    'combination': 'bg-purple-600'
  };
  return <Badge className={config[cause] || 'bg-gray-600'}>{cause.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

const CSVBlock: React.FC<{ csv: string; title: string; onCopy: () => void; copied: boolean }> = ({ 
  csv, title, onCopy, copied 
}) => (
  <Card className="border-2 border-dashed border-muted-foreground/30">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          {title} - CSV Output
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <CheckCheck className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Copied!' : 'Copy CSV'}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[300px]">
        <pre className="text-xs font-mono bg-muted p-4 rounded-lg whitespace-pre-wrap">
          {csv}
        </pre>
      </ScrollArea>
    </CardContent>
  </Card>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Phase2_1AddendumDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    loading: false,
    report: null,
    error: null,
    copiedSection: null
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const report = await globalAuditPhase2_1AddendumService.runCompleteAudit();
      setState(prev => ({ ...prev, loading: false, report }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to run diagnostics'
      }));
    }
  };

  const downloadCSV = () => {
    if (!state.report) return;
    const csv = globalAuditPhase2_1AddendumService.getCompleteCSV(state.report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phase2_1_Addendum_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!state.report) return;
    const json = JSON.stringify(state.report.json_summary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phase2_1_Summary_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (section: string, content: string) => {
    navigator.clipboard.writeText(content);
    setState(prev => ({ ...prev, copiedSection: section }));
    setTimeout(() => setState(prev => ({ ...prev, copiedSection: null })), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phase 2.1 Addendum Dashboard</h1>
          <p className="text-muted-foreground">
            Required Missing Diagnostics - Corrective Audit with Mandatory CSV Tables
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
            variant="outline"
            onClick={downloadJSON}
            disabled={!state.report}
          >
            <FileText className="w-4 h-4 mr-2" />
            JSON Summary
          </Button>
          <Button
            onClick={downloadCSV}
            disabled={!state.report}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All CSV
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
              <p className="text-muted-foreground">Running Phase 2.1 corrective audit...</p>
              <p className="text-sm text-muted-foreground">Generating all required CSV tables</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {state.report && (
        <>
          {/* Summary Banner */}
          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{state.report.section_a_rerun_metrics.countries_processed}/195</div>
                  <div className="text-sm text-muted-foreground">Countries Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{state.report.section_a_missing_countries.length}</div>
                  <div className="text-sm text-muted-foreground">Missing Countries</div>
                </div>
                <div className="text-center">
                  <CauseBadge cause={state.report.section_d_conclusion.primary_cause} />
                  <div className="text-sm text-muted-foreground mt-1">Primary Cause</div>
                </div>
                <div className="text-center">
                  <PassFailBadge passed={state.report.section_f_gate_passed} />
                  <div className="text-sm text-muted-foreground mt-1">Synthetic Injection</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="section-a" className="space-y-4">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="section-a" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                A: Coverage
              </TabsTrigger>
              <TabsTrigger value="section-b" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                B: Baseline
              </TabsTrigger>
              <TabsTrigger value="section-c" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                C: Movement
              </TabsTrigger>
              <TabsTrigger value="section-d" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                D: Routing
              </TabsTrigger>
              <TabsTrigger value="section-e" className="text-xs">
                <TableIcon className="w-3 h-3 mr-1" />
                E: Confusion
              </TabsTrigger>
              <TabsTrigger value="section-f" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                F: Injection
              </TabsTrigger>
              <TabsTrigger value="section-g" className="text-xs">
                <AlertOctagon className="w-3 h-3 mr-1" />
                G: Spikes
              </TabsTrigger>
              <TabsTrigger value="section-h" className="text-xs">
                <Anchor className="w-3 h-3 mr-1" />
                H: Anchors
              </TabsTrigger>
            </TabsList>

            {/* Section A: Coverage */}
            <TabsContent value="section-a" className="space-y-4">
              <SectionA 
                report={state.report} 
                onCopy={(content) => copyToClipboard('section-a', content)}
                copied={state.copiedSection === 'section-a'}
              />
            </TabsContent>

            {/* Section B: Baseline */}
            <TabsContent value="section-b" className="space-y-4">
              <SectionB 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-b', content)}
                copied={state.copiedSection === 'section-b'}
              />
            </TabsContent>

            {/* Section C: Movement */}
            <TabsContent value="section-c" className="space-y-4">
              <SectionC 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-c', content)}
                copied={state.copiedSection === 'section-c'}
              />
            </TabsContent>

            {/* Section D: Routing */}
            <TabsContent value="section-d" className="space-y-4">
              <SectionD 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-d', content)}
                copied={state.copiedSection === 'section-d'}
              />
            </TabsContent>

            {/* Section E: Confusion */}
            <TabsContent value="section-e" className="space-y-4">
              <SectionE 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-e', content)}
                copied={state.copiedSection === 'section-e'}
              />
            </TabsContent>

            {/* Section F: Injection */}
            <TabsContent value="section-f" className="space-y-4">
              <SectionF 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-f', content)}
                copied={state.copiedSection === 'section-f'}
              />
            </TabsContent>

            {/* Section G: Spikes */}
            <TabsContent value="section-g" className="space-y-4">
              <SectionG 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-g', content)}
                copied={state.copiedSection === 'section-g'}
              />
            </TabsContent>

            {/* Section H: Anchors */}
            <TabsContent value="section-h" className="space-y-4">
              <SectionH 
                report={state.report}
                onCopy={(content) => copyToClipboard('section-h', content)}
                copied={state.copiedSection === 'section-h'}
              />
            </TabsContent>
          </Tabs>

          {/* JSON Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                JSON Summary Object
              </CardTitle>
              <CardDescription>Required output format per specification</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <pre className="text-xs font-mono bg-muted p-4 rounded-lg">
                  {JSON.stringify(state.report.json_summary, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

interface SectionProps {
  report: Phase2_1AddendumReport;
  onCopy: (content: string) => void;
  copied: boolean;
}

const SectionA: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          A) Coverage Completion (195/195 required)
        </CardTitle>
        <CardDescription>A1: Missing Countries Table | A2: Rerun Confirmation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* A2: Rerun Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{report.section_a_rerun_metrics.countries_processed}</div>
            <div className="text-sm text-muted-foreground">Countries Processed</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{report.section_a_rerun_metrics.target_total}</div>
            <div className="text-sm text-muted-foreground">Target Total</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <PassFailBadge passed={report.section_a_rerun_metrics.rerun_complete} />
            <div className="text-sm text-muted-foreground mt-1">Rerun Complete?</div>
          </div>
        </div>

        {/* A1: Missing Countries Table */}
        {report.section_a_missing_countries.length > 0 && (
          <div className="border-2 border-red-500/50 rounded-lg p-4 bg-red-500/5">
            <h4 className="font-semibold text-red-600 mb-3">
              ⚠️ A1: Missing Countries ({report.section_a_missing_countries.length})
            </h4>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ISO3</TableHead>
                    <TableHead>Country Name</TableHead>
                    <TableHead>Failure Category</TableHead>
                    <TableHead>Failure Detail</TableHead>
                    <TableHead>Minimal Fix</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_a_missing_countries.map((mc) => (
                    <TableRow key={mc.iso3}>
                      <TableCell className="font-mono">{mc.iso3}</TableCell>
                      <TableCell>{mc.country_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {mc.failure_category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px]">{mc.failure_detail}</TableCell>
                      <TableCell className="text-sm max-w-[200px]">{mc.minimal_fix}</TableCell>
                      <TableCell><OwnerBadge owner={mc.owner} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_a_csv} 
      title="Section A" 
      onCopy={() => onCopy(report.section_a_csv)}
      copied={copied}
    />
  </>
);

const SectionB: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          B) Baseline Factor Decomposition + Source Attribution
        </CardTitle>
        <CardDescription>B1: Factor Distribution | B2: Audit Sample | B3: Source Registry</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* B1: Factor Distribution */}
        <div>
          <h4 className="font-semibold mb-3">B1: Baseline Factor Distribution (GLOBAL)</h4>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vector</TableHead>
                  <TableHead className="text-right">Mean Baseline</TableHead>
                  <TableHead className="text-right">Mean Weighted</TableHead>
                  <TableHead className="text-right">p10 Share</TableHead>
                  <TableHead className="text-right">Median Share</TableHead>
                  <TableHead className="text-right">p90 Share</TableHead>
                  <TableHead className="text-right">% Neutral</TableHead>
                  <TableHead className="text-right">% Regional</TableHead>
                  <TableHead className="text-right">% Stale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.section_b1_factor_distribution.map((row) => (
                  <TableRow key={row.vector_id}>
                    <TableCell className="font-medium">{row.vector}</TableCell>
                    <TableCell className="text-right font-mono">{row.mean_factor_baseline.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{row.mean_weighted_contribution.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{(row.p10_baseline_share * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{(row.median_baseline_share * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{(row.p90_baseline_share * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_neutral_50.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_regional_avg.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_stale_180d.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* B3: Source Registry */}
        <div>
          <h4 className="font-semibold mb-3">B3: Baseline Source Registry (GLOBAL)</h4>
          <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vector</TableHead>
                  <TableHead className="text-right"># Sources</TableHead>
                  <TableHead>Top 3 Sources</TableHead>
                  <TableHead className="text-right">% Direct</TableHead>
                  <TableHead className="text-right">% Regional</TableHead>
                  <TableHead className="text-right">% Neutral</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.section_b3_source_registry.map((row) => (
                  <TableRow key={row.vector_id}>
                    <TableCell className="font-medium">{row.vector}</TableCell>
                    <TableCell className="text-right font-mono">{row.distinct_baseline_sources}</TableCell>
                    <TableCell className="text-xs max-w-[200px]">{row.top_3_sources_by_usage}</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_countries_direct_source.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_countries_regional_avg.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{row.pct_countries_neutral_50.toFixed(1)}%</TableCell>
                    <TableCell className="text-xs">{row.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Interpretation</h4>
          <p className="text-sm">{report.section_b_interpretation}</p>
        </div>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_b_csv} 
      title="Section B" 
      onCopy={() => onCopy(report.section_b_csv)}
      copied={copied}
    />
  </>
);

const SectionC: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          C) Movement Attribution — Correct Vector Share
        </CardTitle>
        <CardDescription>C1: Movement Ratios | C2: TRUE Drift Share | C3: TRUE Event Share</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* C1: Movement Ratios */}
        <div>
          <h4 className="font-semibold mb-3">C1: Movement Ratios Distribution</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Global Mean</TableHead>
                <TableHead className="text-right">p10</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">p90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_c1_movement_ratios.map((row) => (
                <TableRow key={row.metric}>
                  <TableCell className="font-medium">{row.metric}</TableCell>
                  <TableCell className="text-right font-mono">
                    {row.metric.includes('ratio') || row.metric.includes('%') ? 
                      `${(row.global_mean * (row.metric.includes('%') ? 1 : 100)).toFixed(2)}%` : 
                      row.global_mean.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.p10.toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono">{row.median.toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono">{row.p90.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* C2: TRUE Drift Share */}
        <div>
          <h4 className="font-semibold mb-3">C2: TRUE Drift Share by Vector</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Denominator: sum of all drift points across all vectors and countries
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vector</TableHead>
                <TableHead className="text-right">Total Drift Points</TableHead>
                <TableHead className="text-right">Global Share</TableHead>
                <TableHead className="text-right">p10</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">p90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_c2_true_drift_share.map((row) => (
                <TableRow key={row.vector_id}>
                  <TableCell className="font-medium">{row.vector}</TableCell>
                  <TableCell className="text-right font-mono">{row.total_drift_points.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{(row.global_drift_share * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.p10 * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.median * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.p90 * 100).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* C3: TRUE Event Share */}
        <div>
          <h4 className="font-semibold mb-3">C3: TRUE Event Share by Vector</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Denominator: sum of all event points across all vectors and countries
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vector</TableHead>
                <TableHead className="text-right">Total Event Points</TableHead>
                <TableHead className="text-right">Global Share</TableHead>
                <TableHead className="text-right">p10</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">p90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_c3_true_event_share.map((row) => (
                <TableRow key={row.vector_id}>
                  <TableCell className="font-medium">{row.vector}</TableCell>
                  <TableCell className="text-right font-mono">{row.total_event_points.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{(row.global_event_share * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.p10 * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.median * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{(row.p90 * 100).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Interpretation</h4>
          <p className="text-sm">{report.section_c_interpretation}</p>
        </div>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_c_csv} 
      title="Section C" 
      onCopy={() => onCopy(report.section_c_csv)}
      copied={copied}
    />
  </>
);

const SectionD: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          D) Coverage vs Routing vs Scoring — Root Cause Separation
        </CardTitle>
        <CardDescription>D1-D7: Comprehensive routing diagnostics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conclusion Banner */}
        <div className={`p-4 rounded-lg border-2 ${
          report.section_d_conclusion.primary_cause === 'combination' ? 'border-purple-500 bg-purple-500/10' :
          report.section_d_conclusion.primary_cause === 'coverage_gap' ? 'border-red-500 bg-red-500/10' :
          report.section_d_conclusion.primary_cause === 'routing_gap' ? 'border-yellow-500 bg-yellow-500/10' :
          'border-orange-500 bg-orange-500/10'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="font-semibold text-lg">Primary Cause:</span>
            <CauseBadge cause={report.section_d_conclusion.primary_cause} />
          </div>
          <ul className="space-y-1 text-sm">
            {report.section_d_conclusion.evidence.map((e, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        <Accordion type="multiple" className="w-full">
          {/* D1: Pre-routing */}
          <AccordionItem value="d1">
            <AccordionTrigger>D1: Pre-routing Candidate Inventory (Coverage)</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vector Bucket</TableHead>
                    <TableHead className="text-right">Detection Candidates</TableHead>
                    <TableHead className="text-right">Confirmation Candidates</TableHead>
                    <TableHead>Example Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_d1_pre_routing.map((row) => (
                    <TableRow key={row.vector_bucket}>
                      <TableCell className="font-medium">{row.vector_bucket}</TableCell>
                      <TableCell className="text-right font-mono">{row.candidate_count_detection}</TableCell>
                      <TableCell className="text-right font-mono">{row.candidate_count_confirmation}</TableCell>
                      <TableCell className="text-xs">{row.example_keywords}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          {/* D2: Post-routing */}
          <AccordionItem value="d2">
            <AccordionTrigger>D2: Post-routing Distribution</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vector</TableHead>
                    <TableHead className="text-right">Routed Detections</TableHead>
                    <TableHead className="text-right">Routed Confirmations</TableHead>
                    <TableHead className="text-right">% of Total Det.</TableHead>
                    <TableHead className="text-right">% of Total Conf.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_d2_post_routing.map((row) => (
                    <TableRow key={row.vector_id}>
                      <TableCell className="font-medium">{row.vector}</TableCell>
                      <TableCell className="text-right font-mono">{row.routed_detection_count}</TableCell>
                      <TableCell className="text-right font-mono">{row.routed_confirmation_count}</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_of_total_detections.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_of_total_confirmations.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          {/* D3: Scoring Suppression */}
          <AccordionItem value="d3">
            <AccordionTrigger>D3: Per-vector Scoring Suppression</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vector</TableHead>
                    <TableHead className="text-right">% Discarded</TableHead>
                    <TableHead className="text-right">% Capped</TableHead>
                    <TableHead className="text-right">% Netted</TableHead>
                    <TableHead className="text-right">% Decayed</TableHead>
                    <TableHead className="text-right">Mean Drift/Item</TableHead>
                    <TableHead className="text-right">Mean Event/Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_d3_scoring_suppression.map((row) => (
                    <TableRow key={row.vector_id}>
                      <TableCell className="font-medium">{row.vector}</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_discarded_by_routing.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_capped.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_netted_away.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_decayed.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.mean_drift_per_item.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-mono">{row.mean_event_per_item.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          {/* D5: Full Source Registry */}
          <AccordionItem value="d5">
            <AccordionTrigger>D5: FULL Source Registry (Pipeline Inventory)</AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Vectors</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead>First Date</TableHead>
                      <TableHead>Last Date</TableHead>
                      <TableHead className="text-right">Days Stale</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.section_d5_full_source_registry.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-xs">{row.source_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{row.source_role}</Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{row.vectors_supported}</TableCell>
                        <TableCell className="text-right font-mono">{row.total_items_ingested}</TableCell>
                        <TableCell className="font-mono text-xs">{row.first_date_observed}</TableCell>
                        <TableCell className="font-mono text-xs">{row.last_date_observed}</TableCell>
                        <TableCell className="text-right font-mono">{row.days_stale}</TableCell>
                        <TableCell>
                          {row.active_flag ? 
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                            <XCircle className="w-4 h-4 text-red-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {/* D6: Source Concentration */}
          <AccordionItem value="d6">
            <AccordionTrigger>D6: Source Concentration & Feed Health</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_d6_source_concentration.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{row.metric}</TableCell>
                      <TableCell className="font-mono">{row.value}</TableCell>
                      <TableCell className={`text-sm ${
                        row.notes.includes('HIGH') || row.notes.includes('GAP') ? 'text-red-600 font-semibold' : ''
                      }`}>{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          {/* D7: Structured vs Media */}
          <AccordionItem value="d7">
            <AccordionTrigger>D7: Structured vs Media Balance by Vector</AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-muted-foreground mb-3">
                Structured = official registries, government sources, databases. Media = news agencies, social media, press releases.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vector</TableHead>
                    <TableHead className="text-right"># Structured</TableHead>
                    <TableHead className="text-right"># Media</TableHead>
                    <TableHead className="text-right">% Structured</TableHead>
                    <TableHead className="text-right">% Media</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.section_d7_structured_vs_media.map((row) => (
                    <TableRow key={row.vector_id}>
                      <TableCell className="font-medium">{row.vector}</TableCell>
                      <TableCell className="text-right font-mono">{row.structured_source_count}</TableCell>
                      <TableCell className="text-right font-mono">{row.media_source_count}</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_items_structured.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">{row.pct_items_media.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_d_csv} 
      title="Section D" 
      onCopy={() => onCopy(report.section_d_csv)}
      copied={copied}
    />
  </>
);

const SectionE: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="w-5 h-5" />
          E) Confusion Sample (Human-Auditable)
        </CardTitle>
        <CardDescription>50 rows: 20 Governance, 20 Conflict, 10 Other vectors</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Raw Title/Text</TableHead>
                <TableHead>Predicted Vector</TableHead>
                <TableHead>Should Be Vector</TableHead>
                <TableHead>Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_e_confusion_sample.map((row) => {
                const isCorrect = row.predicted_vector === row.should_be_vector;
                return (
                  <TableRow key={row.item_id} className={!isCorrect ? 'bg-red-500/10' : ''}>
                    <TableCell className="font-mono text-xs">{row.item_id}</TableCell>
                    <TableCell className="text-sm max-w-[250px]">{row.raw_title_text}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{row.predicted_vector}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={isCorrect ? 'bg-green-600' : 'bg-red-600'} >
                        {row.should_be_vector}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">{row.rationale}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_e_csv} 
      title="Section E" 
      onCopy={() => onCopy(report.section_e_csv)}
      copied={copied}
    />
  </>
);

const SectionF: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          F) Synthetic Injection — Tightened Gate
        </CardTitle>
        <CardDescription>70 items injected (10 per vector). Each vector accuracy must be ≥95%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gate Status */}
        <div className={`p-4 rounded-lg border-2 ${
          report.section_f_gate_passed ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-3">
            {report.section_f_gate_passed ? 
              <CheckCircle2 className="w-8 h-8 text-green-500" /> : 
              <XCircle className="w-8 h-8 text-red-500" />}
            <div>
              <div className="font-semibold text-lg">
                Gate: {report.section_f_gate_passed ? 'PASSED' : 'FAILED'}
              </div>
              <div className="text-sm text-muted-foreground">
                All vectors must achieve ≥95% routing accuracy
              </div>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vector</TableHead>
              <TableHead className="text-right">Injected</TableHead>
              <TableHead className="text-right">Correct</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Failures Explanation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.section_f_synthetic_injection.map((row) => (
              <TableRow key={row.vector_id}>
                <TableCell className="font-medium">{row.vector}</TableCell>
                <TableCell className="text-right font-mono">{row.injected}</TableCell>
                <TableCell className="text-right font-mono">{row.correct}</TableCell>
                <TableCell className="text-right font-mono">{(row.accuracy * 100).toFixed(1)}%</TableCell>
                <TableCell>
                  <PassFailBadge passed={row.accuracy >= 0.95} />
                </TableCell>
                <TableCell className="text-xs max-w-[200px]">
                  {row.failures_explanation || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_f_csv} 
      title="Section F" 
      onCopy={() => onCopy(report.section_f_csv)}
      copied={copied}
    />
  </>
);

const SectionG: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          G) Spikes — Required Evidence Completion
        </CardTitle>
        <CardDescription>G1: Top 20 Validated Spikes | G2: Missed Crises</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* G1: Validated Spikes */}
        <div>
          <h4 className="font-semibold mb-3">G1: Top 20 Validated Spikes</h4>
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ISO3</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Magnitude</TableHead>
                  <TableHead>Composition (B/D/E)</TableHead>
                  <TableHead>Dominant Vector</TableHead>
                  <TableHead>Supporting Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.section_g1_validated_spikes.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{row.iso3}</TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell className="text-right font-mono">{row.magnitude.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.baseline_composition.toFixed(1)}/{row.drift_composition.toFixed(1)}/{row.event_composition.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{row.dominant_vector}</Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">{row.supporting_reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* G2: Missed Crises */}
        <div>
          <h4 className="font-semibold mb-3 text-red-600">G2: Missed Crises</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ISO3</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expected Vector</TableHead>
                <TableHead>Root Cause Classification</TableHead>
                <TableHead>Representative Artifact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_g2_missed_crises.map((row, idx) => (
                <TableRow key={idx} className="bg-red-500/5">
                  <TableCell className="font-mono">{row.iso3}</TableCell>
                  <TableCell className="font-mono text-xs">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{row.expected_vector}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-red-600 text-xs">
                      {row.root_cause_classification.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[250px]">{row.representative_artifact}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_g_csv} 
      title="Section G" 
      onCopy={() => onCopy(report.section_g_csv)}
      copied={copied}
    />
  </>
);

const SectionH: React.FC<SectionProps> = ({ report, onCopy, copied }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Anchor className="w-5 h-5" />
          H) Anchors — Correct Anchor Typing & Evaluation
        </CardTitle>
        <CardDescription>
          DISCRETE_EVENT vs ESCALATION_NARRATIVE anchor types with full trace output
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p><strong>Rules:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Drift-before-confirmation required only for DISCRETE_EVENT anchors with expected lead indicators</li>
            <li>ESCALATION_NARRATIVE anchors evaluated primarily on drift + routing coherence</li>
          </ul>
        </div>

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anchor</TableHead>
                <TableHead>ISO3</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Detected?</TableHead>
                <TableHead>Drift?</TableHead>
                <TableHead>Confirm?</TableHead>
                <TableHead>Event?</TableHead>
                <TableHead>Explanation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.section_h_anchor_evaluation.map((row, idx) => {
                const passed = row.detected && row.drift_present;
                return (
                  <TableRow key={idx} className={!passed ? 'bg-red-500/10' : ''}>
                    <TableCell className="font-medium text-sm max-w-[150px]">{row.anchor}</TableCell>
                    <TableCell className="font-mono">{row.iso3}</TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${
                        row.anchor_type === 'DISCRETE_EVENT' ? 'border-blue-500' : 'border-purple-500'
                      }`}>
                        {row.anchor_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.detected ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {row.drift_present ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {row.confirmation_present ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {row.event_delta_present ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">{row.explain_pass_fail}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    <CSVBlock 
      csv={report.section_h_csv} 
      title="Section H" 
      onCopy={() => onCopy(report.section_h_csv)}
      copied={copied}
    />
  </>
);

export default Phase2_1AddendumDashboard;