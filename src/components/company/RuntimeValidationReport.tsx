/**
 * Runtime Validation Report (R6)
 * Displays per-ticker execution path, channel quality matrix, differentiation score,
 * fallback audit, and data-source consistency check.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  GitBranch,
  BarChart2,
  Shield,
  RefreshCw,
} from 'lucide-react';
import type {
  ValidationReport,
  EvidenceTier,
  ExecutionPath,
} from '@/services/runtimeValidation';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<EvidenceTier, string> = {
  DIRECT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ALLOCATED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  MODELED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  FALLBACK: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const PATH_COLORS: Record<ExecutionPath, string> = {
  'live-edgar': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'static-snapshot-fallback': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'gf-fallback': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const PATH_ICONS: Record<ExecutionPath, React.FC<{ className?: string }>> = {
  'live-edgar': CheckCircle2,
  'static-snapshot-fallback': AlertTriangle,
  'gf-fallback': XCircle,
};

function TierBadge({ tier }: { tier: EvidenceTier }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${TIER_COLORS[tier]}`}
    >
      {tier}
    </span>
  );
}

function ScoreBar({
  score,
  max = 1,
  label,
}: {
  score: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    pct > 66 ? 'bg-emerald-500' : pct > 33 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && <span className="text-xs text-muted-foreground w-12 text-right">{label}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-sections
// ─────────────────────────────────────────────────────────────────────────────

function ExecutionPathSection({ report }: { report: ValidationReport }) {
  const PathIcon = PATH_ICONS[report.executionPath];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PathIcon className="h-4 w-4" />
        <span className="text-sm font-semibold">Execution Path</span>
        <Badge
          variant="outline"
          className={`text-xs ${PATH_COLORS[report.executionPath]}`}
        >
          {report.executionPath}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {report.pipelineMs}ms
        </span>
      </div>
      <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 leading-relaxed">
        {report.executionPathDetail}
      </p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`rounded p-2 border text-center ${report.hasCompanySpecificData ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-muted/20'}`}>
          <div className={`font-semibold ${report.hasCompanySpecificData ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {report.hasCompanySpecificData ? '✓' : '✗'} Static Snapshot
          </div>
          <div className="text-muted-foreground mt-0.5">companySpecificExposures.ts</div>
        </div>
        <div className={`rounded p-2 border text-center ${report.usedLiveEdgar ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-muted/20'}`}>
          <div className={`font-semibold ${report.usedLiveEdgar ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {report.usedLiveEdgar ? '✓' : '✗'} Live EDGAR
          </div>
          <div className="text-muted-foreground mt-0.5">liveEdgarPipeline.ts</div>
        </div>
        <div className={`rounded p-2 border text-center ${report.secIntegrationSuccess ? 'border-blue-500/30 bg-blue-500/10' : 'border-border bg-muted/20'}`}>
          <div className={`font-semibold ${report.secIntegrationSuccess ? 'text-blue-400' : 'text-muted-foreground'}`}>
            {report.secIntegrationSuccess ? '✓' : '✗'} SEC Integration
          </div>
          <div className="text-muted-foreground mt-0.5">structuredDataIntegrator.ts</div>
        </div>
      </div>
    </div>
  );
}

function ChannelMatrixSection({ report }: { report: ValidationReport }) {
  const [open, setOpen] = useState(false);
  const top10 = report.channelMatrix.slice(0, 10);
  const rest = report.channelMatrix.slice(10);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4" />
        <span className="text-sm font-semibold">Channel Evidence Quality Matrix</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {report.channelMatrix.length} countries
        </span>
      </div>

      {/* Channel summary row */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {(['revenue', 'supply', 'assets', 'financial'] as const).map(ch => {
          const s = report.channelSummary[ch];
          const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={ch} className="rounded border border-border bg-muted/20 p-2 space-y-1">
              <div className="font-semibold capitalize text-foreground">{ch}</div>
              {(['DIRECT', 'ALLOCATED', 'MODELED', 'FALLBACK'] as EvidenceTier[]).map(tier =>
                s[tier] > 0 ? (
                  <div key={tier} className="flex items-center justify-between gap-1">
                    <TierBadge tier={tier} />
                    <span className="text-muted-foreground">{s[tier]}/{total}</span>
                  </div>
                ) : null
              )}
            </div>
          );
        })}
      </div>

      {/* Per-country table */}
      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs py-2">Country</TableHead>
              <TableHead className="text-xs py-2">Revenue</TableHead>
              <TableHead className="text-xs py-2">Supply</TableHead>
              <TableHead className="text-xs py-2">Assets</TableHead>
              <TableHead className="text-xs py-2">Financial</TableHead>
              <TableHead className="text-xs py-2 text-right">Blended%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top10.map(row => (
              <TableRow key={row.country} className="text-xs">
                <TableCell className="py-1.5 font-medium">{row.country}</TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <TierBadge tier={row.revenue.tier} />
                    <span className="text-muted-foreground">{(row.revenue.weight * 100).toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <TierBadge tier={row.supply.tier} />
                    <span className="text-muted-foreground">{(row.supply.weight * 100).toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <TierBadge tier={row.assets.tier} />
                    <span className="text-muted-foreground">{(row.assets.weight * 100).toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <TierBadge tier={row.financial.tier} />
                    <span className="text-muted-foreground">{(row.financial.weight * 100).toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5 text-right font-mono">
                  {(row.blendedWeight * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rest.length > 0 && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-none border-t border-border text-xs text-muted-foreground h-8"
              >
                {open ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" /> Hide {rest.length} more countries
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" /> Show {rest.length} more countries
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Table>
                <TableBody>
                  {rest.map(row => (
                    <TableRow key={row.country} className="text-xs">
                      <TableCell className="py-1.5 font-medium">{row.country}</TableCell>
                      <TableCell className="py-1.5">
                        <TierBadge tier={row.revenue.tier} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <TierBadge tier={row.supply.tier} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <TierBadge tier={row.assets.tier} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <TierBadge tier={row.financial.tier} />
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono">
                        {(row.blendedWeight * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

function DifferentiationSection({ report }: { report: ValidationReport }) {
  const score = report.differentiationScore;
  const pct = Math.round(score * 100);
  const color =
    score > 0.2 ? 'text-emerald-400' : score > 0.05 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <span className="text-sm font-semibold">Channel Differentiation Score</span>
        <span className={`ml-auto text-lg font-bold font-mono ${color}`}>{pct}%</span>
      </div>
      <ScoreBar score={score} max={1} label={`${pct}%`} />
      <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 leading-relaxed">
        {report.differentiationDetail}
      </p>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="rounded border border-rose-500/30 bg-rose-500/10 p-2">
          <div className="font-semibold text-rose-400">0–5%</div>
          <div className="text-muted-foreground">Homogeneous</div>
        </div>
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2">
          <div className="font-semibold text-amber-400">5–20%</div>
          <div className="text-muted-foreground">Partially distinct</div>
        </div>
        <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2">
          <div className="font-semibold text-emerald-400">&gt;20%</div>
          <div className="text-muted-foreground">Well differentiated</div>
        </div>
      </div>
    </div>
  );
}

function FallbackAuditSection({ report }: { report: ValidationReport }) {
  const { fallbackAudit: fa } = report;
  const total = fa.totalCountries || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        <span className="text-sm font-semibold">Fallback Audit</span>
        <span className="ml-auto text-xs text-muted-foreground">{fa.totalCountries} countries</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-center">
        {(
          [
            { label: 'DIRECT', count: fa.directCountries, color: 'emerald' },
            { label: 'ALLOCATED', count: fa.allocatedCountries, color: 'blue' },
            { label: 'MODELED', count: fa.modeledCountries, color: 'amber' },
            { label: 'FALLBACK', count: fa.fallbackCountries, color: 'rose' },
          ] as const
        ).map(({ label, count, color }) => (
          <div
            key={label}
            className={`rounded border border-${color}-500/30 bg-${color}-500/10 p-2`}
          >
            <div className={`text-lg font-bold text-${color}-400`}>{count}</div>
            <div className="text-muted-foreground">{label}</div>
            <div className="text-muted-foreground/60">{((count / total) * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
      {fa.directCountryList.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground font-medium">DIRECT countries: </span>
          <span className="text-emerald-400">{fa.directCountryList.join(', ')}</span>
        </div>
      )}
      {fa.gfFallbackCountries.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground font-medium">GF Fallback countries: </span>
          <span className="text-rose-400">{fa.gfFallbackCountries.slice(0, 10).join(', ')}
            {fa.gfFallbackCountries.length > 10 && ` +${fa.gfFallbackCountries.length - 10} more`}
          </span>
        </div>
      )}
    </div>
  );
}

function ConsistencySection({ report }: { report: ValidationReport }) {
  const c = report.dataSourceConsistency;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-semibold">Data Source Consistency</span>
        <Badge
          variant="outline"
          className={`text-xs ml-auto ${c.sameObject ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}
        >
          {c.sameObject ? '✓ Same Object' : '✗ Divergent'}
        </Badge>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-36 shrink-0">Exposure Pathways:</span>
          <span className="text-foreground font-mono bg-muted/40 rounded px-1">{c.exposurePathwaysSource}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-36 shrink-0">Top Risk Contributors:</span>
          <span className="text-foreground font-mono bg-muted/40 rounded px-1">{c.topRiskContributorsSource}</span>
        </div>
        {c.divergencePoint && (
          <div className="mt-2 p-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <span className="font-semibold">Divergence: </span>
            {c.divergencePoint}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationsSection({ report }: { report: ValidationReport }) {
  if (report.recommendations.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold">Recommendations</span>
      </div>
      <ul className="space-y-1.5">
        {report.recommendations.map((rec, i) => {
          const severity = rec.startsWith('CRITICAL')
            ? 'rose'
            : rec.startsWith('HIGH')
            ? 'orange'
            : rec.startsWith('MEDIUM')
            ? 'amber'
            : 'blue';
          return (
            <li
              key={i}
              className={`text-xs p-2 rounded border border-${severity}-500/30 bg-${severity}-500/10 text-${severity}-300 leading-relaxed`}
            >
              {rec}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface RuntimeValidationReportProps {
  report: ValidationReport;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const RuntimeValidationReport: React.FC<RuntimeValidationReportProps> = ({
  report,
  onRefresh,
  isRefreshing,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('execution');

  const sections = [
    { id: 'execution', label: 'Execution Path', icon: GitBranch },
    { id: 'matrix', label: 'Channel Matrix', icon: BarChart2 },
    { id: 'differentiation', label: 'Differentiation', icon: GitBranch },
    { id: 'fallback', label: 'Fallback Audit', icon: Database },
    { id: 'consistency', label: 'Data Consistency', icon: Shield },
    { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Runtime Validation Report
              <Badge variant="outline" className="text-xs font-mono ml-1">
                {report.ticker}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              V5 methodology execution trace · Generated{' '}
              {new Date(report.generatedAt).toLocaleTimeString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Score</div>
              <div className="text-lg font-bold font-mono">{report.finalScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">±{report.scoreUncertainty.toFixed(1)}</div>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick status bar */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge
            variant="outline"
            className={PATH_COLORS[report.executionPath]}
          >
            {report.executionPath}
          </Badge>
          <Badge
            variant="outline"
            className={
              report.differentiationScore > 0.2
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : report.differentiationScore > 0.05
                ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
            }
          >
            Differentiation: {(report.differentiationScore * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {report.fallbackAudit.directCountries} DIRECT / {report.fallbackAudit.totalCountries} countries
          </Badge>
          <Badge variant="outline" className="border-border text-muted-foreground">
            Uncertainty ±{report.scoreUncertainty.toFixed(1)}
          </Badge>
          <Badge variant="outline" className="border-border text-muted-foreground ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            {report.pipelineMs}ms
          </Badge>
        </div>

        {/* Accordion sections */}
        {sections.map(({ id, label, icon: Icon }) => (
          <Collapsible
            key={id}
            open={expandedSection === id}
            onOpenChange={open => setExpandedSection(open ? id : null)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto border border-border rounded-lg hover:bg-muted/40"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                {expandedSection === id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3 pb-2">
              {id === 'execution' && <ExecutionPathSection report={report} />}
              {id === 'matrix' && <ChannelMatrixSection report={report} />}
              {id === 'differentiation' && <DifferentiationSection report={report} />}
              {id === 'fallback' && <FallbackAuditSection report={report} />}
              {id === 'consistency' && <ConsistencySection report={report} />}
              {id === 'recommendations' && <RecommendationsSection report={report} />}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};