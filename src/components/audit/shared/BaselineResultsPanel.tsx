/**
 * BaselineResultsPanel
 *
 * Section 14 of the CO-GRI Audit Report — Live Baseline Results.
 * Displays the output of the most recent SEC Baseline run including:
 *   1. Run Header (metadata)
 *   2. Pipeline Funnel (progress bars)
 *   3. Channel Evidence Tier Breakdown (table)
 *   4. Per-Company Results Table (sortable + filterable)
 */

import React, { useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, ArrowUp, ArrowDown, Clock, Hash, Layers, Building2 } from 'lucide-react';

// ─── JSON import ─────────────────────────────────────────────────────────────
import baselineDataRaw from '../../../data/sec_baseline_results.json';

// ─── Types ───────────────────────────────────────────────────────────────────

type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK' | 'NOT_RUN';
type ConfidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
type Category = 'A' | 'B' | 'C';

interface CompanyResult {
  ticker: string;
  category: Category;
  isADR: boolean;
  filingType: string;
  filingDate: string;
  revenueTier: EvidenceTier;
  supplyTier: EvidenceTier;
  assetsTier: EvidenceTier;
  financialTier: EvidenceTier;
  compositeConfidenceScore: number;
  confidenceGrade: ConfidenceGrade;
  isMateriallySpecific: boolean;
}

interface PipelineFunnel {
  entered: number;
  secPathEntered: number;
  filingRetrieved: number;
  structuredParsed: number;
  materiallySpecific: number;
}

interface RunMeta {
  runId: string;
  runDate: string;
  phase: string;
  mode: string;
  durationSeconds: number;
  companiesEntered: number;
  companiesProcessed: number;
}

interface BaselineData {
  runMeta: RunMeta;
  pipelineFunnel: PipelineFunnel;
  results: CompanyResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_ORDER: EvidenceTier[] = ['DIRECT', 'ALLOCATED', 'MODELED', 'FALLBACK', 'NOT_RUN'];

const tierBadgeStyle = (tier: EvidenceTier): string => {
  switch (tier) {
    case 'DIRECT':   return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
    case 'ALLOCATED': return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
    case 'MODELED':  return 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50';
    case 'FALLBACK': return 'bg-orange-900/60 text-orange-300 border-orange-700/50';
    case 'NOT_RUN':  return 'bg-slate-800/60 text-slate-400 border-slate-600/50';
    default:         return 'bg-slate-800/60 text-slate-400 border-slate-600/50';
  }
};

const gradeBadgeStyle = (grade: ConfidenceGrade): string => {
  switch (grade) {
    case 'A': return 'bg-emerald-900/70 text-emerald-300 border-emerald-600/50';
    case 'B': return 'bg-blue-900/70 text-blue-300 border-blue-600/50';
    case 'C': return 'bg-yellow-900/70 text-yellow-300 border-yellow-600/50';
    case 'D': return 'bg-orange-900/70 text-orange-300 border-orange-600/50';
    case 'F': return 'bg-red-900/70 text-red-300 border-red-600/50';
    default:  return 'bg-slate-800/60 text-slate-400 border-slate-600/50';
  }
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const pct = (n: number, total: number): string =>
  total === 0 ? '0.0%' : `${((n / total) * 100).toFixed(1)}%`;

// ─── TierBadge ────────────────────────────────────────────────────────────────

const TierBadge: React.FC<{ tier: EvidenceTier }> = ({ tier }) => (
  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tierBadgeStyle(tier)}`}>
    {tier}
  </span>
);

// ─── GradeBadge ───────────────────────────────────────────────────────────────

const GradeBadge: React.FC<{ grade: ConfidenceGrade }> = ({ grade }) => (
  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${gradeBadgeStyle(grade)}`}>
    {grade}
  </span>
);

// ─── SortIcon ─────────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ col: string; sortCol: string; sortDir: 'asc' | 'desc' }> = ({
  col, sortCol, sortDir,
}) => {
  if (col !== sortCol) return <ArrowUpDown className="h-3 w-3 text-slate-500 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-teal-400 ml-1 inline" />
    : <ArrowDown className="h-3 w-3 text-teal-400 ml-1 inline" />;
};

// ─── Channel Evidence Tier Breakdown ─────────────────────────────────────────

interface TierBreakdownProps {
  results: CompanyResult[];
}

const ChannelTierBreakdown: React.FC<TierBreakdownProps> = ({ results }) => {
  const channels: { key: keyof CompanyResult; label: string }[] = [
    { key: 'revenueTier',  label: 'Revenue'  },
    { key: 'supplyTier',   label: 'Supply'   },
    { key: 'assetsTier',   label: 'Assets'   },
    { key: 'financialTier', label: 'Financial' },
  ];

  const counts = useMemo(() => {
    return channels.map(({ key, label }) => {
      const row: Record<EvidenceTier, number> = {
        DIRECT: 0, ALLOCATED: 0, MODELED: 0, FALLBACK: 0, NOT_RUN: 0,
      };
      results.forEach((r) => {
        const tier = r[key] as EvidenceTier;
        row[tier] = (row[tier] || 0) + 1;
      });
      return { label, ...row };
    });
  }, [results]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/80 hover:bg-slate-800/80">
            <TableHead className="text-teal-400 font-semibold text-xs uppercase tracking-wider w-28">Channel</TableHead>
            {TIER_ORDER.map((t) => (
              <TableHead key={t} className="text-center">
                <TierBadge tier={t} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map((row, i) => (
            <TableRow
              key={row.label}
              className={i % 2 === 0 ? 'bg-slate-900/20 hover:bg-slate-800/30' : 'bg-slate-800/20 hover:bg-slate-800/30'}
            >
              <TableCell className="font-medium text-slate-200 text-sm">{row.label}</TableCell>
              {TIER_ORDER.map((t) => (
                <TableCell key={t} className="text-center text-slate-300 text-sm">
                  {row[t]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BaselineResultsPanel: React.FC = () => {
  // ── Filters ──
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterADR, setFilterADR] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSpecific, setFilterSpecific] = useState<string>('all');

  // ── Sort ──
  const [sortCol, setSortCol] = useState<string>('compositeConfidenceScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Data ──
  const data = baselineDataRaw as BaselineData;
  const hasData = data && data.results && data.results.length > 0;

  const handleSort = (col: string) => {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const filteredSorted = useMemo(() => {
    if (!hasData) return [];
    let rows = [...data.results];

    if (filterCategory !== 'all') rows = rows.filter((r) => r.category === filterCategory);
    if (filterADR !== 'all') rows = rows.filter((r) => (filterADR === 'yes' ? r.isADR : !r.isADR));
    if (filterGrade !== 'all') rows = rows.filter((r) => r.confidenceGrade === filterGrade);
    if (filterSpecific !== 'all') rows = rows.filter((r) => (filterSpecific === 'yes' ? r.isMateriallySpecific : !r.isMateriallySpecific));

    rows.sort((a, b) => {
      let va: string | number = a[sortCol as keyof CompanyResult] as string | number;
      let vb: string | number = b[sortCol as keyof CompanyResult] as string | number;
      if (typeof va === 'boolean') va = va ? 1 : 0;
      if (typeof vb === 'boolean') vb = vb ? 1 : 0;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [data, filterCategory, filterADR, filterGrade, filterSpecific, sortCol, sortDir, hasData]);

  // ── Empty state ──
  if (!hasData) {
    return (
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-10 text-center">
        <div className="text-slate-400 text-sm">
          No baseline results yet. Run the SEC Baseline workflow in GitHub Actions to populate this section.
        </div>
      </div>
    );
  }

  const { runMeta, pipelineFunnel } = data;

  const funnelSteps = [
    { label: 'Entered SEC path',    count: pipelineFunnel.secPathEntered,   total: pipelineFunnel.entered },
    { label: 'Filing retrieved',    count: pipelineFunnel.filingRetrieved,  total: pipelineFunnel.entered },
    { label: 'Structured parsed',   count: pipelineFunnel.structuredParsed, total: pipelineFunnel.entered },
    { label: 'Materially specific', count: pipelineFunnel.materiallySpecific, total: pipelineFunnel.entered },
  ];

  const SortTh: React.FC<{ col: string; children: React.ReactNode; className?: string }> = ({
    col, children, className = '',
  }) => (
    <TableHead
      className={`text-teal-400 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:text-teal-300 transition-colors ${className}`}
      onClick={() => handleSort(col)}
    >
      {children}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </TableHead>
  );

  return (
    <div className="space-y-6">

      {/* ── 1. Run Header ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: <Clock className="h-4 w-4" />, label: 'Last Run', value: formatDate(runMeta.runDate) },
          { icon: <Layers className="h-4 w-4" />, label: 'Phase', value: runMeta.phase },
          { icon: <Clock className="h-4 w-4" />, label: 'Duration', value: formatDuration(runMeta.durationSeconds) },
          { icon: <Building2 className="h-4 w-4" />, label: 'Mode', value: runMeta.mode },
          { icon: <Building2 className="h-4 w-4" />, label: 'Processed', value: `${runMeta.companiesProcessed} / ${runMeta.companiesEntered}` },
          { icon: <Hash className="h-4 w-4" />, label: 'Run ID', value: runMeta.runId.slice(-8) },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-teal-500 mb-1">
                {stat.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 truncate" title={stat.value}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 2. Pipeline Funnel ── */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
            Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {funnelSteps.map((step) => {
            const percentage = step.total === 0 ? 0 : (step.count / step.total) * 100;
            return (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{step.label}</span>
                  <span className="text-slate-400 font-mono">
                    {step.count}/{step.total} &nbsp;
                    <span className="text-teal-400 font-semibold">{pct(step.count, step.total)}</span>
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2 bg-slate-800"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── 3. Channel Evidence Tier Breakdown ── */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
            Channel Evidence Tier Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ChannelTierBreakdown results={data.results} />
        </CardContent>
      </Card>

      {/* ── 4. Per-Company Results Table ── */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
              Per-Company Results
              <span className="ml-2 text-xs font-normal text-slate-500 normal-case">
                ({filteredSorted.length} of {data.results.length} companies)
              </span>
            </CardTitle>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-7 w-28 text-xs bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs text-slate-300">All Categories</SelectItem>
                  <SelectItem value="A" className="text-xs text-slate-300">Category A</SelectItem>
                  <SelectItem value="B" className="text-xs text-slate-300">Category B</SelectItem>
                  <SelectItem value="C" className="text-xs text-slate-300">Category C</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterADR} onValueChange={setFilterADR}>
                <SelectTrigger className="h-7 w-24 text-xs bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue placeholder="ADR" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs text-slate-300">All ADR</SelectItem>
                  <SelectItem value="yes" className="text-xs text-slate-300">ADR: Yes</SelectItem>
                  <SelectItem value="no" className="text-xs text-slate-300">ADR: No</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="h-7 w-24 text-xs bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs text-slate-300">All Grades</SelectItem>
                  {(['A','B','C','D','F'] as ConfidenceGrade[]).map((g) => (
                    <SelectItem key={g} value={g} className="text-xs text-slate-300">Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSpecific} onValueChange={setFilterSpecific}>
                <SelectTrigger className="h-7 w-28 text-xs bg-slate-800 border-slate-700 text-slate-300">
                  <SelectValue placeholder="Specific" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs text-slate-300">All</SelectItem>
                  <SelectItem value="yes" className="text-xs text-slate-300">Specific: Yes</SelectItem>
                  <SelectItem value="no" className="text-xs text-slate-300">Specific: No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/80 hover:bg-slate-800/80">
                  <SortTh col="ticker">Ticker</SortTh>
                  <SortTh col="category">Cat</SortTh>
                  <SortTh col="isADR">ADR</SortTh>
                  <SortTh col="filingType">Filing</SortTh>
                  <SortTh col="filingDate">Date</SortTh>
                  <TableHead className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Rev</TableHead>
                  <TableHead className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Sup</TableHead>
                  <TableHead className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Ast</TableHead>
                  <TableHead className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Fin</TableHead>
                  <SortTh col="compositeConfidenceScore">Score</SortTh>
                  <SortTh col="confidenceGrade">Grade</SortTh>
                  <SortTh col="isMateriallySpecific">Specific?</SortTh>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-slate-500 py-8 text-sm">
                      No results match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSorted.map((row, i) => (
                    <TableRow
                      key={row.ticker}
                      className={`${i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'} hover:bg-slate-800/40 transition-colors`}
                    >
                      <TableCell className="font-mono font-semibold text-teal-300 text-sm">{row.ticker}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300 px-1.5">
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {row.isADR ? (
                          <span className="text-[10px] font-semibold text-amber-400">ADR</span>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{row.filingType}</TableCell>
                      <TableCell className="text-xs text-slate-400 whitespace-nowrap">{formatDate(row.filingDate)}</TableCell>
                      <TableCell><TierBadge tier={row.revenueTier} /></TableCell>
                      <TableCell><TierBadge tier={row.supplyTier} /></TableCell>
                      <TableCell><TierBadge tier={row.assetsTier} /></TableCell>
                      <TableCell><TierBadge tier={row.financialTier} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.compositeConfidenceScore >= 80 ? 'bg-emerald-500' :
                                row.compositeConfidenceScore >= 60 ? 'bg-blue-500' :
                                row.compositeConfidenceScore >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${row.compositeConfidenceScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-300">{row.compositeConfidenceScore}</span>
                        </div>
                      </TableCell>
                      <TableCell><GradeBadge grade={row.confidenceGrade} /></TableCell>
                      <TableCell className="text-center">
                        {row.isMateriallySpecific ? (
                          <span className="text-[10px] font-semibold text-emerald-400">Yes</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaselineResultsPanel;