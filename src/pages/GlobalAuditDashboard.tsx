/**
 * Global Audit Dashboard
 * Phase 2: Global Backfill & Geopolitical Plausibility Audit
 * Phase 2b: Spike Analysis, Event Recall, and Anchor Event Validation
 * Phase 2c: Final Validation & Production Verdict
 * 
 * This dashboard assesses if CSI behaves like a credible, global, 
 * real-time geopolitical risk index when run across all countries.
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
  RefreshCw,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Database,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Search,
  Anchor,
  Target,
  FileText,
  GitBranch,
  Gauge,
  Award,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertOctagon,
  Settings,
  BarChart3
} from 'lucide-react';
import {
  globalAuditService,
  BackfillStatus,
  CountryStatistics,
  GlobalDistribution,
  PlausibilityCheck,
  CountryClassification,
  COUNTRY_DATABASE
} from '@/services/csi/GlobalAuditService';
import {
  globalAuditPhase2bService,
  CSISpike,
  EventRecallResult,
  AnchorEventValidation,
  VectorClusteringAnalysis,
  ANCHOR_EVENTS
} from '@/services/csi/GlobalAuditServicePhase2b';
import {
  globalAuditPhase2cService,
  SpilloverAnalysis,
  SpilloverCheckResult,
  CalibrationHealth,
  CalibrationMetric,
  VectorCalibrationStatus,
  CountryCalibrationStatus,
  FinalVerdict,
  PlausibilityQuestion
} from '@/services/csi/GlobalAuditServicePhase2c';
import { CSIRiskVectorNames } from '@/services/csi/types/CSITypes';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardState {
  initialized: boolean;
  loading: boolean;
  backfillStatus: BackfillStatus | null;
  rankings: {
    top20: CountryStatistics[];
    bottom20: CountryStatistics[];
    distribution: GlobalDistribution;
  } | null;
  volatility: {
    mostVolatile: CountryStatistics[];
    leastVolatile: CountryStatistics[];
  } | null;
  plausibilityChecks: PlausibilityCheck[];
  statsByClassification: Record<CountryClassification, {
    count: number;
    avg_csi: number;
    avg_volatility: number;
  }> | null;
  // Phase 2b state
  topSpikes: CSISpike[];
  topEventDeltas: CSISpike[];
  topDriftMovements: CSISpike[];
  vectorClustering: VectorClusteringAnalysis[];
  eventRecallResults: EventRecallResult[];
  eventRecallSummary: {
    total_spikes: number;
    matched_to_real_events: number;
    spurious_spikes: number;
    missed_crises: number;
    match_percentage: number;
    spurious_percentage: number;
  } | null;
  anchorValidations: AnchorEventValidation[];
  spikeAnalysisSummary: {
    total_spikes_analyzed: number;
    spurious_count: number;
    spurious_percentage: number;
    cap_binding_count: number;
    cap_binding_percentage: number;
    countries_with_most_spikes: { country_id: string; country_name: string; spike_count: number }[];
  } | null;
  // Phase 2c state
  spilloverAnalysis: SpilloverAnalysis | null;
  calibrationHealth: CalibrationHealth | null;
  finalVerdict: FinalVerdict | null;
  error: string | null;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const ClassificationBadge: React.FC<{ classification: CountryClassification }> = ({ classification }) => {
  const config: Record<CountryClassification, { label: string; className: string }> = {
    'FRAGILE_STATE': { label: 'Fragile State', className: 'bg-red-600' },
    'CONFLICT_ZONE': { label: 'Conflict Zone', className: 'bg-red-700' },
    'SANCTIONED': { label: 'Sanctioned', className: 'bg-orange-600' },
    'EMERGING_MARKET': { label: 'Emerging Market', className: 'bg-yellow-600' },
    'OECD_DEMOCRACY': { label: 'OECD Democracy', className: 'bg-green-600' },
    'STABLE_DEMOCRACY': { label: 'Stable Democracy', className: 'bg-green-500' },
    'OTHER': { label: 'Other', className: 'bg-gray-500' }
  };

  const { label, className } = config[classification];
  return <Badge className={className}>{label}</Badge>;
};

const RiskLevelIndicator: React.FC<{ score: number }> = ({ score }) => {
  let color = 'text-green-500';
  let bgColor = 'bg-green-500/10';
  let label = 'Low';

  if (score >= 60) {
    color = 'text-red-500';
    bgColor = 'bg-red-500/10';
    label = 'Very High';
  } else if (score >= 40) {
    color = 'text-orange-500';
    bgColor = 'bg-orange-500/10';
    label = 'High';
  } else if (score >= 25) {
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500/10';
    label = 'Moderate';
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
      <span className={`text-sm font-medium ${color}`}>{score.toFixed(1)}</span>
      <span className={`text-xs ${color}`}>({label})</span>
    </div>
  );
};

const VolatilityIndicator: React.FC<{ value: number }> = ({ value }) => {
  let icon = <Minus className="w-3 h-3" />;
  let color = 'text-gray-500';

  if (value > 0.8) {
    icon = <ArrowUp className="w-3 h-3" />;
    color = 'text-red-500';
  } else if (value > 0.5) {
    icon = <ArrowUp className="w-3 h-3" />;
    color = 'text-yellow-500';
  } else if (value < 0.3) {
    icon = <ArrowDown className="w-3 h-3" />;
    color = 'text-green-500';
  }

  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      {icon}
      {value.toFixed(3)}
    </span>
  );
};

const PlausibilityCheckCard: React.FC<{ check: PlausibilityCheck }> = ({ check }) => {
  const severityConfig = {
    'INFO': { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'WARNING': { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    'ERROR': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' }
  };

  const { icon: Icon, color, bg } = severityConfig[check.severity];

  return (
    <div className={`p-4 rounded-lg border ${check.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${bg}`}>
          {check.passed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Icon className={`w-5 h-5 ${color}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{check.check_name}</h4>
            <Badge variant={check.passed ? 'default' : 'destructive'} className={check.passed ? 'bg-green-600' : ''}>
              {check.passed ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
          <p className="text-sm mt-2">{check.details}</p>
          {check.affected_countries && check.affected_countries.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {check.affected_countries.slice(0, 10).map(c => (
                <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
              ))}
              {check.affected_countries.length > 10 && (
                <Badge variant="outline" className="text-xs">+{check.affected_countries.length - 10} more</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VerdictBadge: React.FC<{ passed: boolean; verdict?: string }> = ({ passed, verdict }) => {
  return (
    <Badge 
      variant={passed ? 'default' : 'destructive'} 
      className={passed ? 'bg-green-600' : 'bg-red-600'}
    >
      {verdict || (passed ? 'PASS' : 'FAIL')}
    </Badge>
  );
};

const RecallStatusBadge: React.FC<{ status: 'MATCHED' | 'SPURIOUS' | 'MISSED_CRISIS' }> = ({ status }) => {
  const config = {
    'MATCHED': { label: 'Matched', className: 'bg-green-600' },
    'SPURIOUS': { label: 'Spurious', className: 'bg-red-600' },
    'MISSED_CRISIS': { label: 'Missed Crisis', className: 'bg-yellow-600' }
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
};

const StatusBadge: React.FC<{ status: 'HEALTHY' | 'WARNING' | 'CRITICAL' }> = ({ status }) => {
  const config = {
    'HEALTHY': { label: 'Healthy', className: 'bg-green-600' },
    'WARNING': { label: 'Warning', className: 'bg-yellow-600' },
    'CRITICAL': { label: 'Critical', className: 'bg-red-600' }
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
};

const AnswerBadge: React.FC<{ answer: 'YES' | 'NO' | 'PARTIAL' }> = ({ answer }) => {
  const config = {
    'YES': { icon: ThumbsUp, label: 'Yes', className: 'bg-green-600' },
    'NO': { icon: ThumbsDown, label: 'No', className: 'bg-red-600' },
    'PARTIAL': { icon: HelpCircle, label: 'Partial', className: 'bg-yellow-600' }
  };
  const { icon: Icon, label, className } = config[answer];
  return (
    <Badge className={`${className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const GlobalAuditDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    initialized: false,
    loading: false,
    backfillStatus: null,
    rankings: null,
    volatility: null,
    plausibilityChecks: [],
    statsByClassification: null,
    topSpikes: [],
    topEventDeltas: [],
    topDriftMovements: [],
    vectorClustering: [],
    eventRecallResults: [],
    eventRecallSummary: null,
    anchorValidations: [],
    spikeAnalysisSummary: null,
    spilloverAnalysis: null,
    calibrationHealth: null,
    finalVerdict: null,
    error: null
  });

  // Initialize on mount
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await globalAuditService.initialize();
      
      // Phase 2a data
      const backfillStatus = globalAuditService.getBackfillStatus();
      const rankings = globalAuditService.getGlobalRankings();
      const volatility = globalAuditService.getVolatilityRankings();
      const plausibilityChecks = globalAuditService.runPlausibilityChecks();
      const statsByClassification = globalAuditService.getStatsByClassification();

      // Phase 2b data
      const topSpikes = globalAuditPhase2bService.getTopSpikes(100);
      const topEventDeltas = globalAuditPhase2bService.getTopEventDeltas(50);
      const topDriftMovements = globalAuditPhase2bService.getTopDriftMovements(50);
      const vectorClustering = globalAuditPhase2bService.analyzeVectorClustering();
      const eventRecall = globalAuditPhase2bService.runEventRecallDiagnostic(200);
      const anchorValidations = globalAuditPhase2bService.validateAllAnchorEvents();
      const spikeAnalysisSummary = globalAuditPhase2bService.getSpikeAnalysisSummary();

      // Phase 2c data
      const spilloverAnalysis = globalAuditPhase2cService.runSpilloverAnalysis();
      const calibrationHealth = globalAuditPhase2cService.runCalibrationHealth();
      const finalVerdict = globalAuditPhase2cService.generateFinalVerdict();

      setState(prev => ({
        ...prev,
        initialized: true,
        loading: false,
        backfillStatus,
        rankings,
        volatility,
        plausibilityChecks,
        statsByClassification,
        topSpikes,
        topEventDeltas,
        topDriftMovements,
        vectorClustering,
        eventRecallResults: eventRecall.results,
        eventRecallSummary: eventRecall.summary,
        anchorValidations,
        spikeAnalysisSummary,
        spilloverAnalysis,
        calibrationHealth,
        finalVerdict
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  };

  const refreshData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await globalAuditService.runBackfill();
      globalAuditPhase2bService.clearCaches();
      globalAuditPhase2cService.clearCaches();
      
      // Reload all data
      const backfillStatus = globalAuditService.getBackfillStatus();
      const rankings = globalAuditService.getGlobalRankings();
      const volatility = globalAuditService.getVolatilityRankings();
      const plausibilityChecks = globalAuditService.runPlausibilityChecks();
      const statsByClassification = globalAuditService.getStatsByClassification();
      const topSpikes = globalAuditPhase2bService.getTopSpikes(100);
      const topEventDeltas = globalAuditPhase2bService.getTopEventDeltas(50);
      const topDriftMovements = globalAuditPhase2bService.getTopDriftMovements(50);
      const vectorClustering = globalAuditPhase2bService.analyzeVectorClustering();
      const eventRecall = globalAuditPhase2bService.runEventRecallDiagnostic(200);
      const anchorValidations = globalAuditPhase2bService.validateAllAnchorEvents();
      const spikeAnalysisSummary = globalAuditPhase2bService.getSpikeAnalysisSummary();
      const spilloverAnalysis = globalAuditPhase2cService.runSpilloverAnalysis();
      const calibrationHealth = globalAuditPhase2cService.runCalibrationHealth();
      const finalVerdict = globalAuditPhase2cService.generateFinalVerdict();

      setState(prev => ({
        ...prev,
        loading: false,
        backfillStatus,
        rankings,
        volatility,
        plausibilityChecks,
        statsByClassification,
        topSpikes,
        topEventDeltas,
        topDriftMovements,
        vectorClustering,
        eventRecallResults: eventRecall.results,
        eventRecallSummary: eventRecall.summary,
        anchorValidations,
        spikeAnalysisSummary,
        spilloverAnalysis,
        calibrationHealth,
        finalVerdict
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
          <h1 className="text-3xl font-bold tracking-tight">Global Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Phase 2: Global Backfill & Geopolitical Plausibility Audit
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

      {/* Loading State */}
      {state.loading && !state.initialized && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Initializing global backfill...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Verdict Banner (if available) */}
      {state.finalVerdict && (
        <Card className={`border-2 ${
          state.finalVerdict.verdict_color === 'green' ? 'border-green-500 bg-green-500/5' :
          state.finalVerdict.verdict_color === 'yellow' ? 'border-yellow-500 bg-yellow-500/5' :
          'border-red-500 bg-red-500/5'
        }`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {state.finalVerdict.verdict === 'READY_FOR_PHASE_3' ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  <AlertOctagon className="w-12 h-12 text-yellow-500" />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{state.finalVerdict.verdict_label}</h2>
                  <p className="text-muted-foreground">
                    Confidence: {(state.finalVerdict.confidence * 100).toFixed(0)}% • 
                    Generated: {state.finalVerdict.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge 
                className={`text-lg px-4 py-2 ${
                  state.finalVerdict.verdict_color === 'green' ? 'bg-green-600' :
                  state.finalVerdict.verdict_color === 'yellow' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
              >
                {state.finalVerdict.verdict === 'READY_FOR_PHASE_3' ? 'READY' : 'NEEDS CALIBRATION'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {state.backfillStatus && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.backfillStatus.total_countries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Country-Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.backfillStatus.country_days_processed.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Spikes Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.spikeAnalysisSummary?.total_spikes_analyzed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anchor Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ANCHOR_EVENTS.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Calibration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.calibrationHealth && (
                <StatusBadge status={state.calibrationHealth.overall_status} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="verdict" className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="verdict" className="flex items-center gap-1 text-xs">
            <Award className="w-3 h-3" />
            Verdict
          </TabsTrigger>
          <TabsTrigger value="spillover" className="flex items-center gap-1 text-xs">
            <GitBranch className="w-3 h-3" />
            Spillover
          </TabsTrigger>
          <TabsTrigger value="calibration" className="flex items-center gap-1 text-xs">
            <Gauge className="w-3 h-3" />
            Calibration
          </TabsTrigger>
          <TabsTrigger value="backfill" className="flex items-center gap-1 text-xs">
            <Database className="w-3 h-3" />
            Backfill
          </TabsTrigger>
          <TabsTrigger value="rankings" className="flex items-center gap-1 text-xs">
            <Globe className="w-3 h-3" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="volatility" className="flex items-center gap-1 text-xs">
            <Activity className="w-3 h-3" />
            Volatility
          </TabsTrigger>
          <TabsTrigger value="plausibility" className="flex items-center gap-1 text-xs">
            <Shield className="w-3 h-3" />
            Plausibility
          </TabsTrigger>
          <TabsTrigger value="spikes" className="flex items-center gap-1 text-xs">
            <Zap className="w-3 h-3" />
            Spikes
          </TabsTrigger>
          <TabsTrigger value="recall" className="flex items-center gap-1 text-xs">
            <Search className="w-3 h-3" />
            Recall
          </TabsTrigger>
          <TabsTrigger value="anchors" className="flex items-center gap-1 text-xs">
            <Anchor className="w-3 h-3" />
            Anchors
          </TabsTrigger>
        </TabsList>

        {/* Final Verdict Tab (Phase 2c - Step 9) */}
        <TabsContent value="verdict" className="space-y-4">
          {state.finalVerdict && (
            <>
              {/* Large Verdict Banner */}
              <Card className={`border-4 ${
                state.finalVerdict.verdict_color === 'green' ? 'border-green-500' :
                state.finalVerdict.verdict_color === 'yellow' ? 'border-yellow-500' :
                'border-red-500'
              }`}>
                <CardContent className="py-8">
                  <div className="text-center">
                    {state.finalVerdict.verdict === 'READY_FOR_PHASE_3' ? (
                      <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
                    ) : (
                      <AlertOctagon className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
                    )}
                    <h1 className="text-4xl font-bold mb-2">{state.finalVerdict.verdict_label}</h1>
                    <p className="text-xl text-muted-foreground">
                      Confidence Level: {(state.finalVerdict.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Plausibility Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {state.finalVerdict.summary.plausibility_checks_passed}/{state.finalVerdict.summary.plausibility_checks_total}
                    </div>
                    <Progress 
                      value={(state.finalVerdict.summary.plausibility_checks_passed / state.finalVerdict.summary.plausibility_checks_total) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Spillover Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {state.finalVerdict.summary.spillover_checks_passed}/{state.finalVerdict.summary.spillover_checks_total}
                    </div>
                    <Progress 
                      value={(state.finalVerdict.summary.spillover_checks_passed / state.finalVerdict.summary.spillover_checks_total) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Calibration Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatusBadge status={state.finalVerdict.summary.calibration_status} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Anchor Events Validated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{state.finalVerdict.summary.anchor_events_validated}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Plausibility Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Geopolitical Plausibility Questions
                  </CardTitle>
                  <CardDescription>
                    Key questions answered to determine production readiness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {state.finalVerdict.plausibility_questions.map((q) => (
                      <div key={q.question_id} className={`p-4 rounded-lg border ${
                        q.answer === 'YES' ? 'border-green-500/30 bg-green-500/5' :
                        q.answer === 'PARTIAL' ? 'border-yellow-500/30 bg-yellow-500/5' :
                        'border-red-500/30 bg-red-500/5'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Q{q.question_id.replace('q', '')}:</span>
                              <span>{q.question}</span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {q.evidence.map((e, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  {e}
                                </div>
                              ))}
                              {q.concerns.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                  {c}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <AnswerBadge answer={q.answer} />
                            <span className="text-xs text-muted-foreground">
                              {(q.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reasoning & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {state.finalVerdict.reasoning.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {state.finalVerdict.recommendations.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Settings className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Spillover Check Tab (Phase 2c - Step 7) */}
        <TabsContent value="spillover" className="space-y-4">
          {state.spilloverAnalysis && (
            <>
              {/* Spillover Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Cross-Country Spillover Analysis
                  </CardTitle>
                  <CardDescription>
                    Checking for inappropriate cross-country propagation and contamination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
                    {state.spilloverAnalysis.overall_passed ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {state.spilloverAnalysis.verdict}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {state.spilloverAnalysis.total_incidents} spillover incidents detected
                      </div>
                    </div>
                    <Progress 
                      value={(state.spilloverAnalysis.passed_checks / state.spilloverAnalysis.total_checks) * 100}
                      className="w-32 ml-auto"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Total Checks</div>
                      <div className="text-2xl font-bold">{state.spilloverAnalysis.total_checks}</div>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Passed</div>
                      <div className="text-2xl font-bold text-green-600">{state.spilloverAnalysis.passed_checks}</div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{state.spilloverAnalysis.failed_checks}</div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Incidents</div>
                      <div className="text-2xl font-bold text-yellow-600">{state.spilloverAnalysis.total_incidents}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Spillover Checks */}
              <div className="space-y-4">
                {state.spilloverAnalysis.checks.map((check) => (
                  <Card key={check.check_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{check.check_name}</CardTitle>
                        <VerdictBadge passed={check.passed} />
                      </div>
                      <CardDescription>{check.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{check.details}</p>
                      
                      {check.incidents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Detected Incidents:</h4>
                          <ScrollArea className="h-[200px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Source</TableHead>
                                  <TableHead>Affected</TableHead>
                                  <TableHead>Magnitude</TableHead>
                                  <TableHead>Severity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {check.incidents.map((incident) => (
                                  <TableRow key={incident.incident_id}>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {incident.spillover_type.replace('_', ' ')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{incident.source_country_name}</TableCell>
                                    <TableCell>{incident.affected_country_name}</TableCell>
                                    <TableCell className="font-mono">{incident.magnitude.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        incident.severity === 'HIGH' ? 'bg-red-600' :
                                        incident.severity === 'MEDIUM' ? 'bg-yellow-600' :
                                        'bg-gray-600'
                                      }>
                                        {incident.severity}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Calibration Health Tab (Phase 2c - Step 8) */}
        <TabsContent value="calibration" className="space-y-4">
          {state.calibrationHealth && (
            <>
              {/* Calibration Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Calibration Stress Test
                  </CardTitle>
                  <CardDescription>
                    Evaluating parameter balance and system health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
                    {state.calibrationHealth.overall_status === 'HEALTHY' ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : state.calibrationHealth.overall_status === 'WARNING' ? (
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        Overall Calibration: {state.calibrationHealth.overall_status}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {state.calibrationHealth.parameter_imbalances.length} parameter imbalances detected
                      </div>
                    </div>
                    <StatusBadge status={state.calibrationHealth.overall_status} />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${state.calibrationHealth.summary.vectors_dominating > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                      <div className="text-sm text-muted-foreground">Vectors Dominating</div>
                      <div className="text-2xl font-bold">{state.calibrationHealth.summary.vectors_dominating}</div>
                    </div>
                    <div className={`p-4 rounded-lg ${state.calibrationHealth.summary.vectors_underperforming > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                      <div className="text-sm text-muted-foreground">Vectors Underperforming</div>
                      <div className="text-2xl font-bold">{state.calibrationHealth.summary.vectors_underperforming}</div>
                    </div>
                    <div className={`p-4 rounded-lg ${state.calibrationHealth.summary.countries_pinned > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                      <div className="text-sm text-muted-foreground">Countries Pinned</div>
                      <div className="text-2xl font-bold">{state.calibrationHealth.summary.countries_pinned}</div>
                    </div>
                    <div className={`p-4 rounded-lg ${state.calibrationHealth.summary.caps_binding_excessively ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                      <div className="text-sm text-muted-foreground">Caps Binding</div>
                      <div className="text-2xl font-bold">{state.calibrationHealth.summary.caps_binding_excessively ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calibration Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Calibration Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Expected Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.calibrationHealth.metrics.map((metric) => (
                        <TableRow key={metric.metric_id}>
                          <TableCell className="font-medium">{metric.metric_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                            {metric.description}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {metric.current_value.toFixed(1)}{metric.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {metric.expected_range[0]}-{metric.expected_range[1]}{metric.unit}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={metric.status} />
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px]">
                            {metric.recommendation || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Vector Calibration Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Vector Calibration Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vector</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                        <TableHead className="text-right">Avg Contribution</TableHead>
                        <TableHead>Dominating?</TableHead>
                        <TableHead>Underperforming?</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.calibrationHealth.vector_status.map((vs) => (
                        <TableRow key={vs.vector_id}>
                          <TableCell className="font-medium">{vs.vector_name}</TableCell>
                          <TableCell className="text-right font-mono">{vs.percentage_of_total.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{vs.avg_contribution.toFixed(2)}</TableCell>
                          <TableCell>
                            {vs.is_dominating ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {vs.is_underperforming ? (
                              <Badge className="bg-yellow-600">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={vs.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Parameter Imbalances */}
              {state.calibrationHealth.parameter_imbalances.length > 0 && (
                <Card className="border-yellow-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-5 h-5" />
                      Parameter Imbalances Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {state.calibrationHealth.parameter_imbalances.map((imbalance, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${
                          imbalance.severity === 'CRITICAL' ? 'border-red-500 bg-red-500/5' : 'border-yellow-500 bg-yellow-500/5'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{imbalance.issue}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <strong>Recommendation:</strong> {imbalance.recommendation}
                              </div>
                            </div>
                            <Badge className={imbalance.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-yellow-600'}>
                              {imbalance.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pinned Countries */}
              {state.calibrationHealth.pinned_countries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Countries Near Cap</CardTitle>
                    <CardDescription>
                      Countries persistently near the CSI cap (85+)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead className="text-right">Avg CSI</TableHead>
                            <TableHead className="text-right">Days Near Cap</TableHead>
                            <TableHead className="text-right">% Near Cap</TableHead>
                            <TableHead>Pinned?</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.calibrationHealth.pinned_countries.map((country) => (
                            <TableRow key={country.country_id}>
                              <TableCell className="font-medium">{country.country_name}</TableCell>
                              <TableCell>
                                <ClassificationBadge classification={country.classification} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RiskLevelIndicator score={country.avg_csi} />
                              </TableCell>
                              <TableCell className="text-right font-mono">{country.days_near_cap}</TableCell>
                              <TableCell className="text-right font-mono">{country.percentage_near_cap.toFixed(1)}%</TableCell>
                              <TableCell>
                                {country.is_pinned ? (
                                  <Badge variant="destructive">Pinned</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Backfill Status Tab */}
        <TabsContent value="backfill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backfill Computation Status</CardTitle>
              <CardDescription>
                24-month historical CSI data generation for ~195 countries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {state.backfillStatus && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Countries Processed</span>
                      <span>{state.backfillStatus.countries_processed} / {state.backfillStatus.total_countries}</span>
                    </div>
                    <Progress 
                      value={(state.backfillStatus.countries_processed / state.backfillStatus.total_countries) * 100} 
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge 
                      variant={state.backfillStatus.status === 'completed' ? 'default' : 'secondary'}
                      className={state.backfillStatus.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {state.backfillStatus.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div className="font-mono">{state.backfillStatus.start_date.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div className="font-mono">{state.backfillStatus.end_date.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {state.backfillStatus.missing_data_gaps.length === 0 && (
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">No missing data gaps detected</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {state.statsByClassification && (
            <Card>
              <CardHeader>
                <CardTitle>Countries by Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classification</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Avg CSI</TableHead>
                      <TableHead className="text-right">Avg Volatility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(state.statsByClassification)
                      .sort((a, b) => b[1].avg_csi - a[1].avg_csi)
                      .map(([classification, stats]) => (
                        <TableRow key={classification}>
                          <TableCell>
                            <ClassificationBadge classification={classification as CountryClassification} />
                          </TableCell>
                          <TableCell className="text-right font-mono">{stats.count}</TableCell>
                          <TableCell className="text-right">
                            <RiskLevelIndicator score={stats.avg_csi} />
                          </TableCell>
                          <TableCell className="text-right">
                            <VolatilityIndicator value={stats.avg_volatility} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Global Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          {state.rankings && (
            <Card>
              <CardHeader>
                <CardTitle>Global CSI Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Mean</div>
                    <div className="text-2xl font-bold">{state.rankings.distribution.mean.toFixed(1)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Median</div>
                    <div className="text-2xl font-bold">{state.rankings.distribution.median.toFixed(1)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Std Dev</div>
                    <div className="text-2xl font-bold">{state.rankings.distribution.std_dev.toFixed(1)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Min</div>
                    <div className="text-2xl font-bold">{state.rankings.distribution.min.toFixed(1)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Max</div>
                    <div className="text-2xl font-bold">{state.rankings.distribution.max.toFixed(1)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Top 20 Highest Average CSI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Avg CSI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.rankings?.top20.map((country, idx) => (
                        <TableRow key={country.country_id}>
                          <TableCell className="font-mono">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{country.country_name}</div>
                            <ClassificationBadge classification={country.classification} />
                          </TableCell>
                          <TableCell className="text-right">
                            <RiskLevelIndicator score={country.avg_csi_total} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  Bottom 20 Lowest Average CSI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Avg CSI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.rankings?.bottom20.map((country, idx) => (
                        <TableRow key={country.country_id}>
                          <TableCell className="font-mono">{COUNTRY_DATABASE.length - 19 + idx}</TableCell>
                          <TableCell>
                            <div className="font-medium">{country.country_name}</div>
                            <ClassificationBadge classification={country.classification} />
                          </TableCell>
                          <TableCell className="text-right">
                            <RiskLevelIndicator score={country.avg_csi_total} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Volatility Analysis Tab */}
        <TabsContent value="volatility" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  Top 15 Most Volatile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Volatility</TableHead>
                        <TableHead className="text-right">Days &gt;1pt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.volatility?.mostVolatile.map((country) => (
                        <TableRow key={country.country_id}>
                          <TableCell>
                            <div className="font-medium">{country.country_name}</div>
                            <ClassificationBadge classification={country.classification} />
                          </TableCell>
                          <TableCell className="text-right">
                            <VolatilityIndicator value={country.daily_change_std_dev} />
                          </TableCell>
                          <TableCell className="text-right font-mono">{country.days_with_move_gt_1pt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Bottom 15 Least Volatile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Volatility</TableHead>
                        <TableHead className="text-right">Days &gt;1pt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.volatility?.leastVolatile.map((country) => (
                        <TableRow key={country.country_id}>
                          <TableCell>
                            <div className="font-medium">{country.country_name}</div>
                            <ClassificationBadge classification={country.classification} />
                          </TableCell>
                          <TableCell className="text-right">
                            <VolatilityIndicator value={country.daily_change_std_dev} />
                          </TableCell>
                          <TableCell className="text-right font-mono">{country.days_with_move_gt_1pt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plausibility Checks Tab */}
        <TabsContent value="plausibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geopolitical Plausibility Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
                {state.plausibilityChecks.every(c => c.passed) ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                )}
                <div>
                  <div className="font-semibold">
                    {state.plausibilityChecks.every(c => c.passed) 
                      ? 'All Plausibility Checks Passed' 
                      : 'Some Checks Need Attention'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {state.plausibilityChecks.filter(c => c.passed).length} of {state.plausibilityChecks.length} checks passed
                  </div>
                </div>
                <Progress 
                  value={(state.plausibilityChecks.filter(c => c.passed).length / Math.max(state.plausibilityChecks.length, 1)) * 100}
                  className="w-32 ml-auto"
                />
              </div>

              <div className="space-y-4">
                {state.plausibilityChecks.map(check => (
                  <PlausibilityCheckCard key={check.check_id} check={check} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spike Scanner Tab */}
        <TabsContent value="spikes" className="space-y-4">
          {state.spikeAnalysisSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spikes Analyzed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{state.spikeAnalysisSummary.total_spikes_analyzed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Spurious Spikes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {state.spikeAnalysisSummary.spurious_count} ({state.spikeAnalysisSummary.spurious_percentage.toFixed(1)}%)
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cap Binding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {state.spikeAnalysisSummary.cap_binding_count} ({state.spikeAnalysisSummary.cap_binding_percentage.toFixed(1)}%)
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Countries with Spikes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{state.spikeAnalysisSummary.countries_with_most_spikes.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Vector Clustering Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vector</TableHead>
                    <TableHead className="text-right">Spike Count</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                    <TableHead className="text-right">Avg Magnitude</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.vectorClustering.map(vc => (
                    <TableRow key={vc.vector_id}>
                      <TableCell className="font-medium">{vc.vector_name}</TableCell>
                      <TableCell className="text-right font-mono">{vc.spike_count}</TableCell>
                      <TableCell className="text-right font-mono">{vc.percentage_of_total.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono">{vc.avg_spike_magnitude.toFixed(2)}</TableCell>
                      <TableCell>
                        {vc.is_over_represented ? (
                          <Badge variant="destructive">Over-represented</Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Top 50 Largest Daily CSI Increases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Dominant Vector</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.topSpikes.slice(0, 50).map((spike, idx) => (
                      <TableRow key={spike.spike_id} className={spike.is_spurious ? 'bg-red-500/5' : ''}>
                        <TableCell className="font-mono">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{spike.country_name}</div>
                          <ClassificationBadge classification={spike.classification} />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {spike.date.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-500 font-bold">+{spike.csi_change.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {spike.dominant_vector_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {spike.is_spurious ? (
                            <Badge variant="destructive">Spurious</Badge>
                          ) : spike.cap_binding ? (
                            <Badge variant="secondary">Cap Binding</Badge>
                          ) : (
                            <Badge className="bg-green-600">Valid</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Recall Tab */}
        <TabsContent value="recall" className="space-y-4">
          {state.eventRecallSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Event Recall Diagnostic Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Total Spikes</div>
                    <div className="text-2xl font-bold">{state.eventRecallSummary.total_spikes}</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Matched to Events</div>
                    <div className="text-2xl font-bold text-green-600">
                      {state.eventRecallSummary.matched_to_real_events} ({state.eventRecallSummary.match_percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Spurious Spikes</div>
                    <div className="text-2xl font-bold text-red-600">
                      {state.eventRecallSummary.spurious_spikes} ({state.eventRecallSummary.spurious_percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Missed Crises</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {state.eventRecallSummary.missed_crises}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Event Recall Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Spike Date</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Matched Event</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.eventRecallResults.slice(0, 50).map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{result.spike.country_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {result.spike.date.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          +{result.spike.csi_change.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <RecallStatusBadge status={result.recall_status} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {result.matched_news?.headline || result.notes}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(result.confidence * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anchor Events Tab */}
        <TabsContent value="anchors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="w-5 h-5" />
                Anchor Event Sanity Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
                {state.anchorValidations.every(v => v.overall_passed) ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                )}
                <div>
                  <div className="font-semibold">
                    {state.anchorValidations.filter(v => v.overall_passed).length} of {state.anchorValidations.length} anchor events passed validation
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Testing drift, routing, netting, and decay behavior
                  </div>
                </div>
                <Progress 
                  value={(state.anchorValidations.filter(v => v.overall_passed).length / Math.max(state.anchorValidations.length, 1)) * 100}
                  className="w-32 ml-auto"
                />
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {state.anchorValidations.map(validation => (
              <AccordionItem key={validation.event.event_id} value={validation.event.event_id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{validation.event.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {validation.event.countries_affected.join(', ')} • {validation.event.effective_date.toLocaleDateString()}
                      </div>
                    </div>
                    <VerdictBadge passed={validation.overall_passed} verdict={validation.verdict} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{validation.event.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {validation.event.expected_vectors.map(v => (
                          <Badge key={v} variant="outline">{CSIRiskVectorNames[v]}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Validation Checks</h4>
                      {validation.checks.map((check, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border ${check.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
                        >
                          <div className="flex items-center gap-2">
                            {check.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium text-sm">{check.check_name}</span>
                            <Badge 
                              variant={check.passed ? 'default' : 'destructive'} 
                              className={`ml-auto text-xs ${check.passed ? 'bg-green-600' : ''}`}
                            >
                              {check.passed ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Anchor Events Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Expected Vectors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ANCHOR_EVENTS.map(event => (
                    <TableRow key={event.event_id}>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {event.description}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.effective_date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {event.countries_affected.map(c => (
                          <Badge key={c} variant="outline" className="mr-1">{c}</Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {event.expected_vectors.slice(0, 2).map(v => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {CSIRiskVectorNames[v].split(' ')[0]}
                            </Badge>
                          ))}
                          {event.expected_vectors.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{event.expected_vectors.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalAuditDashboard;