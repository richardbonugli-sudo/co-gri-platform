/**
 * BaselineResultsDashboard — Phase 4 + Phase 8 (Global Baseline)
 *
 * Displays SEC and Global baseline run results with a tab switcher.
 *
 * Tab 1 — "SEC Baseline":
 *   Existing Phase-4 content, fully preserved. Loads from:
 *     1. VITE_GITHUB_RAW_URL env var
 *     2. localStorage 'sec_baseline_github_repo'
 *     3. VITE_GITHUB_REPO env var
 *     4. /docs/baseline-results/latest.json (local public folder)
 *
 * Tab 2 — "Global Baseline":
 *   New Phase-8 content. Loads from:
 *     /public/docs/global-baseline-results/latest.json
 *   Shows summary stats, exchange/country filters, results table.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Github,
  Loader2,
  Download,
  ChevronDown,
  Globe,
  Building2,
  BarChart2,
  Layers,
} from 'lucide-react';
import type { GlobalBaselineResult, GlobalRunSummary, GlobalFilingSource } from '@/types/company';
import {
  loadCombinedBaseline,
  type CombinedBaselineEntry,
  type CombinedLoadResult,
} from '@/services/baselineCacheService';

// ─── SEC Types ────────────────────────────────────────────────────────────────

type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK' | 'NOT_RUN';
type Category = 'A' | 'B' | 'C' | 'D';

interface BaselineResult {
  ticker: string;
  companyName: string;
  exchange: string;
  category: Category;
  isADR: boolean;
  enteredSECPath: boolean;
  cikSource: 'hardcoded' | 'edgar_search' | 'not_found';
  cik: string | null;
  cikResolutionMs: number;
  retrievalSucceeded: boolean;
  filingType: '10-K' | '20-F' | '40-F' | null;
  filingDate: string | null;
  htmlSizeBytes: number | null;
  retrievalMs: number;
  retrievalError: string | null;
  structuredParsingSucceeded: boolean;
  tablesFound: number;
  revenueTableFound: boolean;
  ppeTableFound: boolean;
  debtTableFound: boolean;
  exhibit21Found: boolean;
  structuredParsingMs: number;
  narrativeParsingSucceeded: boolean;
  narrativeCountriesFound: number;
  narrativeParsingMs: number;
  channelTiers: {
    revenue: EvidenceTier;
    supply: EvidenceTier;
    assets: EvidenceTier;
    financial: EvidenceTier;
  };
  materiallySpecific: boolean;
  specificChannelCount: number;
  dominantEvidenceTier: EvidenceTier;
  compositeConfidenceScore: number;
  confidenceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recencyMultiplier: number;
  totalPipelineMs: number;
  errorMessage: string | null;
  timestamp: string;
}

interface RunSummary {
  runId: string;
  phase: string;
  startTime: string | null;
  endTime: string | null;
  durationMs: number;
  totalCompanies: number;
  completedCompanies: number;
  failedCompanies: number;
  skippedCompanies: number;
  results: BaselineResult[];
  error?: string;
  _status?: string;
  _degradedMode?: boolean;
  _degradedReason?: string;
}

// ─── GitHub fetch result type ─────────────────────────────────────────────────

type GitHubFetchResult =
  | { status: 'ok'; data: RunSummary; url: string }
  | { status: 'empty'; url: string }
  | { status: 'not_found'; url: string }
  | { status: 'error'; url: string; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<EvidenceTier, string> = {
  DIRECT: 'bg-emerald-600 text-white',
  ALLOCATED: 'bg-blue-500 text-white',
  MODELED: 'bg-amber-500 text-white',
  FALLBACK: 'bg-orange-500 text-white',
  NOT_RUN: 'bg-slate-500 text-white',
};

const TIER_CHART_COLORS: Record<EvidenceTier, string> = {
  DIRECT: '#059669',
  ALLOCATED: '#3b82f6',
  MODELED: '#f59e0b',
  FALLBACK: '#f97316',
  NOT_RUN: '#64748b',
};

const PIPELINE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#059669'];
const LS_REPO_KEY = 'sec_baseline_github_repo';

const GLOBAL_EXCHANGES = ['ALL', 'BVMF', 'HKG', 'JSE', 'LSE', 'SGX', 'TAI', 'TSE'] as const;

// ─── GitHub raw URL builder ───────────────────────────────────────────────────

function buildGitHubRawUrls(repoSlug: string): string[] {
  const slug = repoSlug
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  return [
    `https://raw.githubusercontent.com/${slug}/main/public/docs/baseline-results/latest.json`,
    `https://raw.githubusercontent.com/${slug}/main/docs/baseline-results/latest.json`,
    `https://raw.githubusercontent.com/${slug}/master/public/docs/baseline-results/latest.json`,
    `https://raw.githubusercontent.com/${slug}/master/docs/baseline-results/latest.json`,
  ];
}

function normaliseSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
}

function isValidRepoSlug(slug: string): boolean {
  const parts = slug.split('/');
  if (parts.length !== 2) return false;
  const [owner, repo] = parts;
  return owner.trim().length > 0 && repo.trim().length > 0 && !/\s/.test(slug);
}

// ─── Detailed GitHub fetcher ──────────────────────────────────────────────────

async function fetchFromGitHubDetailed(repoSlug: string): Promise<GitHubFetchResult> {
  const urls = buildGitHubRawUrls(repoSlug);
  let lastResult: GitHubFetchResult = { status: 'not_found', url: urls[0] };
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        lastResult = { status: 'not_found', url };
        continue;
      }
      const data: RunSummary = await res.json();
      if (data.results && data.results.length > 0) {
        return { status: 'ok', data, url };
      }
      lastResult = { status: 'empty', url };
    } catch (e) {
      lastResult = {
        status: 'error',
        url,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return lastResult;
}

function buildTriedUrlsNote(repoSlug: string): string {
  const urls = buildGitHubRawUrls(repoSlug);
  return `Tried:\n${urls.map((u) => `• ${u}`).join('\n')}`;
}

// ─── Shared helper components ─────────────────────────────────────────────────

const BoolIcon = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
  ) : (
    <XCircle className="h-4 w-4 text-rose-500 inline" />
  );

const TierBadge = ({ tier }: { tier: EvidenceTier }) => (
  <span
    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${TIER_COLORS[tier]}`}
  >
    {tier}
  </span>
);

const StatCard = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) => (
  <Card className="bg-slate-900 border-slate-700">
    <CardContent className="pt-4 pb-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

// ─── Confidence score color ───────────────────────────────────────────────────

function confidenceColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

// ─── Filing source label ──────────────────────────────────────────────────────

const FILING_SOURCE_LABELS: Record<GlobalFilingSource, string> = {
  HKEX: 'HKEX',
  CVM: 'CVM/B3',
  FCA_NSM: 'FCA NSM',
  SGX: 'SGX',
  TWSE_MOPS: 'TWSE MOPS',
  SEDAR_PLUS: 'SEDAR+',
  IR_PAGE: 'IR Page',
  FMP: 'FMP API',
  REUSED_SEC: 'SEC (ADR)',
};

// ─── GitHub Loader Panel ──────────────────────────────────────────────────────

interface GitHubLoaderProps {
  compact?: boolean;
  onLoad: (repoSlug: string) => void;
  githubLoading: boolean;
  githubError: string | null;
  githubSource: string | null;
  githubLoadedAt: string | null;
  githubSuccessUrl: string | null;
}

const GitHubLoader: React.FC<GitHubLoaderProps> = ({
  compact = false,
  onLoad,
  githubLoading,
  githubError,
  githubSource,
  githubLoadedAt,
  githubSuccessUrl,
}) => {
  const [inputVal, setInputVal] = useState(
    () => localStorage.getItem(LS_REPO_KEY) ?? ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLoad = () => {
    const slug = normaliseSlug(inputVal);
    if (!slug) {
      setValidationError('Please enter a GitHub repo slug.');
      return;
    }
    if (!isValidRepoSlug(slug)) {
      setValidationError(
        `Invalid format — expected "owner/repo" (e.g. myorg/cogri-platform). Got: "${slug}"`
      );
      return;
    }
    setValidationError(null);
    onLoad(slug);
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {githubSource && (
            <span className="text-xs text-emerald-400 hidden sm:block whitespace-nowrap">
              ✓ {githubSource}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500">GitHub repo slug (owner/repo)</span>
            <Input
              placeholder="e.g. myorg/cogri-platform"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); setValidationError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-xs w-52 ${validationError ? 'border-rose-500' : ''}`}
            />
          </div>
          <Button
            size="sm"
            onClick={handleLoad}
            disabled={githubLoading || !inputVal.trim()}
            className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs whitespace-nowrap self-end"
          >
            {githubLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Github className="h-3.5 w-3.5 mr-1" />
                Load
              </>
            )}
          </Button>
        </div>
        {validationError && (
          <p className="text-[10px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {validationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-slate-800 border border-blue-800 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Github className="h-4 w-4 text-blue-400" />
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
          Load from GitHub
        </p>
      </div>
      <p className="text-xs text-slate-400">
        Enter your GitHub repo slug to load the latest committed baseline results directly.
      </p>
      <div className="space-y-1">
        <label className="text-xs text-slate-400 font-medium">GitHub repo slug (owner/repo)</label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. myorg/cogri-platform"
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setValidationError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            className={`bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm flex-1 ${validationError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
          />
          <Button
            onClick={handleLoad}
            disabled={githubLoading || !inputVal.trim()}
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
          >
            {githubLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading…
              </>
            ) : (
              <>
                <Github className="h-4 w-4 mr-2" />
                Load Results
              </>
            )}
          </Button>
        </div>
        {validationError && (
          <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {validationError}
          </p>
        )}
      </div>
      {githubError && (
        <div className="flex flex-col gap-1 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{githubError}</span>
          </div>
        </div>
      )}
      {githubSource && !githubError && (
        <div className="space-y-1">
          <p className="text-xs text-emerald-400">
            ✓ Loaded from GitHub · <span className="font-mono">{githubSource}</span>
            {githubLoadedAt && <span className="text-slate-500 ml-1">· {githubLoadedAt}</span>}
          </p>
          {githubSuccessUrl && (
            <p className="text-[10px] text-slate-500">
              Source: <code className="text-slate-400 break-all">{githubSuccessUrl}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── SEC Download helpers ─────────────────────────────────────────────────────

const CSV_COLUMNS: (keyof BaselineResult | string)[] = [
  'ticker', 'companyName', 'exchange', 'category', 'isADR', 'filingType',
  'filingDate', 'htmlSizeKB', 'narrativeParsingSucceeded', 'narrativeCountriesFound',
  'narrativeParsingMs', 'revenueTableFound', 'ppeTableFound', 'debtTableFound',
  'exhibit21Found', 'tablesFound', 'channelTier_revenue', 'channelTier_supply',
  'channelTier_assets', 'channelTier_financial', 'materiallySpecific',
  'specificChannelCount', 'dominantEvidenceTier', 'compositeConfidenceScore',
  'confidenceGrade', 'recencyMultiplier', 'enteredSECPath', 'retrievalSucceeded',
  'structuredParsingSucceeded', 'cikSource', 'errorMessage', 'timestamp',
];

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSVRow(r: BaselineResult): string {
  const htmlSizeKB = r.htmlSizeBytes != null ? (r.htmlSizeBytes / 1024).toFixed(1) : '';
  const fieldMap: Record<string, unknown> = {
    ticker: r.ticker, companyName: r.companyName, exchange: r.exchange,
    category: r.category, isADR: r.isADR, filingType: r.filingType,
    filingDate: r.filingDate, htmlSizeKB,
    narrativeParsingSucceeded: r.narrativeParsingSucceeded,
    narrativeCountriesFound: r.narrativeCountriesFound,
    narrativeParsingMs: r.narrativeParsingMs,
    revenueTableFound: r.revenueTableFound, ppeTableFound: r.ppeTableFound,
    debtTableFound: r.debtTableFound, exhibit21Found: r.exhibit21Found,
    tablesFound: r.tablesFound,
    channelTier_revenue: r.channelTiers.revenue, channelTier_supply: r.channelTiers.supply,
    channelTier_assets: r.channelTiers.assets, channelTier_financial: r.channelTiers.financial,
    materiallySpecific: r.materiallySpecific, specificChannelCount: r.specificChannelCount,
    dominantEvidenceTier: r.dominantEvidenceTier,
    compositeConfidenceScore: r.compositeConfidenceScore,
    confidenceGrade: r.confidenceGrade, recencyMultiplier: r.recencyMultiplier,
    enteredSECPath: r.enteredSECPath, retrievalSucceeded: r.retrievalSucceeded,
    structuredParsingSucceeded: r.structuredParsingSucceeded,
    cikSource: r.cikSource, errorMessage: r.errorMessage, timestamp: r.timestamp,
  };
  return CSV_COLUMNS.map((col) => escapeCSVField(fieldMap[col as string])).join(',');
}

function downloadCSV(runSummary: RunSummary): void {
  const header = CSV_COLUMNS.join(',');
  const rows = runSummary.results.map(buildCSVRow);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sec-baseline-narrative-report-${runSummary.runId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJSON(runSummary: RunSummary): void {
  const jsonContent = JSON.stringify(runSummary, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sec-baseline-full-${runSummary.runId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Global Baseline Download helpers ────────────────────────────────────────

const GLOBAL_CSV_COLUMNS = [
  'ticker', 'name', 'exchange', 'country', 'yahooTicker', 'companyType',
  'enteredDataPath', 'filingFetched', 'structuredDataFound',
  'narrativeParsingSucceeded', 'channelTiersAssigned', 'compositeConfidenceScore',
  'currency', 'fxRateToUSD', 'revenueUSD', 'totalAssetsUSD',
  'filingSource', 'filingUrl', 'runDate', 'errorMessage',
  'navPerUnit', 'physicalHoldings', 'custodianLocation',
];

function buildGlobalCSVRow(r: GlobalBaselineResult): string {
  const fieldMap: Record<string, unknown> = {
    ticker: r.ticker, name: r.name, exchange: r.exchange, country: r.country,
    yahooTicker: r.yahooTicker, companyType: r.companyType,
    enteredDataPath: r.enteredDataPath, filingFetched: r.filingFetched,
    structuredDataFound: r.structuredDataFound,
    narrativeParsingSucceeded: r.narrativeParsingSucceeded,
    channelTiersAssigned: r.channelTiersAssigned,
    compositeConfidenceScore: r.compositeConfidenceScore,
    currency: r.currency, fxRateToUSD: r.fxRateToUSD,
    revenueUSD: r.revenueUSD ?? '', totalAssetsUSD: r.totalAssetsUSD ?? '',
    filingSource: r.filingSource, filingUrl: r.filingUrl ?? '',
    runDate: r.runDate, errorMessage: r.errorMessage ?? '',
    navPerUnit: r.navPerUnit ?? '', physicalHoldings: r.physicalHoldings ?? '',
    custodianLocation: r.custodianLocation ?? '',
  };
  return GLOBAL_CSV_COLUMNS.map((col) => escapeCSVField(fieldMap[col])).join(',');
}

function downloadGlobalCSV(summary: GlobalRunSummary): void {
  const header = GLOBAL_CSV_COLUMNS.join(',');
  const rows = summary.results.map(buildGlobalCSVRow);
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `global-baseline-${summary.runId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadGlobalJSON(summary: GlobalRunSummary): void {
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `global-baseline-full-${summary.runId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Global Baseline Tab ──────────────────────────────────────────────────────

const GlobalBaselineTab: React.FC = () => {
  const [globalSummary, setGlobalSummary] = useState<GlobalRunSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [exchangeFilter, setExchangeFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const loadGlobalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/docs/global-baseline-results/latest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GlobalRunSummary = await res.json();
      setGlobalSummary(data);
    } catch (e) {
      setGlobalSummary(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGlobalData(); }, []);

  const results: GlobalBaselineResult[] = globalSummary?.results ?? [];

  // Derived filter options
  const allCountries = useMemo(
    () => ['ALL', ...Array.from(new Set(results.map((r) => r.country).filter(Boolean))).sort()],
    [results]
  );

  // Filtered rows
  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (exchangeFilter !== 'ALL' && r.exchange !== exchangeFilter) return false;
      if (countryFilter !== 'ALL' && r.country !== countryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.ticker.toLowerCase().includes(q) &&
          !r.name.toLowerCase().includes(q) &&
          !r.country.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [results, exchangeFilter, countryFilter, search]);

  // Summary stats
  const stats = useMemo(() => {
    const total = results.length;
    if (total === 0) return { total: 0, filingFetched: 0, narrativeParsed: 0, avgScore: 0 };
    const filingFetched = results.filter((r) => r.filingFetched).length;
    const narrativeParsed = results.filter((r) => r.narrativeParsingSucceeded).length;
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + (r.compositeConfidenceScore ?? 0), 0) / total
    );
    return { total, filingFetched, narrativeParsed, avgScore };
  }, [results]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
        <span className="text-slate-300">Loading global baseline results…</span>
      </div>
    );
  }

  // Empty / not-yet-run state
  if (!globalSummary || results.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="py-12 flex flex-col items-center gap-5 text-center">
          <Globe className="h-12 w-12 text-slate-600" />
          <div>
            <p className="text-white font-semibold text-lg mb-2">
              No Global Baseline Data Available Yet
            </p>
            <p className="text-slate-400 text-sm max-w-lg">
              Run the <span className="font-mono text-slate-300">Global Baseline</span> workflow
              in GitHub Actions to generate results. Once the workflow completes, it will commit{' '}
              <span className="font-mono text-slate-300">
                docs/global-baseline-results/latest.json
              </span>{' '}
              to the repository.
            </p>
            {error && (
              <p className="text-xs text-rose-400 mt-3 font-mono bg-rose-950/40 rounded px-3 py-2 border border-rose-800 inline-block">
                {error}
              </p>
            )}
          </div>
          <div className="rounded-md bg-slate-800 border border-slate-700 px-4 py-3 text-left w-full max-w-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              How to run
            </p>
            <ol className="text-sm text-slate-300 space-y-1.5 list-decimal list-inside">
              <li>
                Go to{' '}
                <span className="text-blue-400">Actions → Global Baseline</span>
              </li>
              <li>
                Click <span className="text-white font-semibold">Run workflow</span>
              </li>
              <li>
                Select exchange: <span className="font-mono text-amber-400">ALL</span> (all 31
                companies, ~30–45 min)
              </li>
              <li>Click the green Run workflow button</li>
              <li>
                Once complete, click{' '}
                <span className="text-blue-400 font-semibold">Refresh</span> here
              </li>
            </ol>
            <div className="font-mono text-xs text-slate-300 bg-slate-900 rounded px-3 py-2 mt-3">
              <p className="text-slate-500"># Or run locally:</p>
              <p>npx tsx src/scripts/runGlobalBaseline.ts --dry-run</p>
              <p className="text-slate-500 mt-1"># Single ticker test:</p>
              <p>npx tsx src/scripts/runGlobalBaseline.ts --ticker=GLEN</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadGlobalData}
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partial run banner */}
      {globalSummary._partial && (
        <div className="bg-amber-950/60 border border-amber-700 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Partial Run
            </p>
            <p className="text-xs text-amber-200/80 mt-1">
              {globalSummary._partialReason ?? 'The run was interrupted before completing all companies.'}
              {' '}Resume with:{' '}
              <code className="text-amber-300 bg-amber-950/60 px-1 rounded">
                npx tsx src/scripts/runGlobalBaseline.ts --resume
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Run metadata */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400">
            Run <span className="font-mono text-slate-300">{globalSummary.runId}</span>
            {' · '}Exchange: <span className="text-slate-300">{globalSummary.exchange}</span>
            {globalSummary.startTime && (
              <>{' · '}{new Date(globalSummary.startTime).toLocaleString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadGlobalData}
            className="border-slate-600 text-slate-300 hover:text-white h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-8 bg-emerald-700 hover:bg-emerald-600 text-white whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-slate-800 border-slate-600 text-slate-200 min-w-[180px]"
            >
              <DropdownMenuItem
                onClick={() => downloadGlobalCSV(globalSummary)}
                className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadGlobalJSON(globalSummary)}
                className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                Download JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary stats row */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Summary — {stats.total} companies
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Companies" value={String(stats.total)} />
          <StatCard
            label="Filing Fetched"
            value={`${stats.filingFetched} / ${stats.total}`}
            accent={stats.filingFetched === stats.total ? 'text-emerald-400' : 'text-amber-400'}
          />
          <StatCard
            label="Narrative Parsed"
            value={`${stats.narrativeParsed} / ${stats.total}`}
            accent={stats.narrativeParsed >= stats.total * 0.7 ? 'text-emerald-400' : 'text-amber-400'}
          />
          <StatCard
            label="Avg Confidence Score"
            value={String(stats.avgScore)}
            accent={confidenceColor(stats.avgScore)}
            sub="0–100 scale"
          />
        </div>
      </section>

      {/* Exchange breakdown mini-chart */}
      {(() => {
        const exchangeCounts = GLOBAL_EXCHANGES.filter(e => e !== 'ALL').map((ex) => ({
          exchange: ex,
          total: results.filter((r) => r.exchange === ex).length,
          fetched: results.filter((r) => r.exchange === ex && r.filingFetched).length,
        })).filter((d) => d.total > 0);

        if (exchangeCounts.length === 0) return null;

        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Filing Success by Exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={exchangeCounts} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="exchange" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="total" name="Total" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fetched" name="Filing Fetched" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })()}

      {/* Filters */}
      <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Filters
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-500 mb-1 block">Ticker / Name / Country</label>
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm"
            />
          </div>

          {/* Exchange filter */}
          <div className="min-w-[130px]">
            <label className="text-xs text-slate-500 mb-1 block">Exchange</label>
            <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {GLOBAL_EXCHANGES.map((ex) => (
                  <SelectItem key={ex} value={ex} className="text-slate-200 focus:bg-slate-700">
                    {ex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country filter */}
          <div className="min-w-[160px]">
            <label className="text-xs text-slate-500 mb-1 block">Country</label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white max-h-60">
                {allCountries.map((c) => (
                  <SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear */}
          {(exchangeFilter !== 'ALL' || countryFilter !== 'ALL' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setExchangeFilter('ALL'); setCountryFilter('ALL'); setSearch(''); }}
              className="text-slate-400 hover:text-white h-8"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Showing {filtered.length} of {results.length} companies
        </p>
      </section>

      {/* Results table */}
      <section>
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 border-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Ticker</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Company Name</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Exchange</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Country</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Filing Source</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Structured</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Narrative</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-right">Confidence</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Run Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-slate-500 py-10">
                    No companies match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={`${r.ticker}-${r.exchange}`}
                    className="border-slate-800 hover:bg-slate-900/60 transition-colors"
                  >
                    {/* Ticker + type badges */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-blue-400 font-semibold">
                          {r.ticker}
                        </span>
                        {r.companyType === 'commodity_trust' && (
                          <Badge className="bg-amber-700/60 text-amber-200 border-amber-600 text-[9px] px-1 py-0 h-4">
                            Trust
                          </Badge>
                        )}
                        {r.companyType === 'gdr' && (
                          <Badge className="bg-purple-700/60 text-purple-200 border-purple-600 text-[9px] px-1 py-0 h-4">
                            GDR
                          </Badge>
                        )}
                      </div>
                      {/* ADR equivalent chip */}
                      {(r as GlobalBaselineResult & { adrEquivalent?: string }).adrEquivalent && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          ADR:{' '}
                          <span className="text-slate-400">
                            {(r as GlobalBaselineResult & { adrEquivalent?: string }).adrEquivalent}
                          </span>
                        </span>
                      )}
                    </TableCell>

                    {/* Company name */}
                    <TableCell className="text-xs text-slate-200 max-w-[200px] truncate whitespace-nowrap">
                      {r.name}
                    </TableCell>

                    {/* Exchange */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-slate-600 text-slate-300 px-1.5"
                      >
                        {r.exchange}
                      </Badge>
                    </TableCell>

                    {/* Country */}
                    <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                      {r.country}
                    </TableCell>

                    {/* Filing source */}
                    <TableCell className="whitespace-nowrap">
                      {r.filingFetched ? (
                        <Badge className="bg-slate-700 text-slate-200 border-slate-600 text-[10px] px-1.5">
                          {FILING_SOURCE_LABELS[r.filingSource] ?? r.filingSource}
                        </Badge>
                      ) : (
                        <span className="text-xs text-rose-400">—</span>
                      )}
                    </TableCell>

                    {/* Structured data */}
                    <TableCell className="text-center">
                      {r.companyType === 'commodity_trust' ? (
                        <span className="text-[10px] text-amber-400">NAV only</span>
                      ) : (
                        <BoolIcon value={r.structuredDataFound} />
                      )}
                    </TableCell>

                    {/* Narrative */}
                    <TableCell className="text-center">
                      {r.companyType === 'commodity_trust' ? (
                        <span className="text-[10px] text-slate-500">—</span>
                      ) : (
                        <BoolIcon value={r.narrativeParsingSucceeded} />
                      )}
                    </TableCell>

                    {/* Confidence score */}
                    <TableCell className="text-right whitespace-nowrap">
                      <span
                        className={`font-mono text-xs font-semibold ${confidenceColor(r.compositeConfidenceScore)}`}
                      >
                        {r.compositeConfidenceScore ?? 0}
                      </span>
                      <span className="text-slate-600 text-[10px] ml-0.5">/100</span>
                    </TableCell>

                    {/* Run date */}
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {r.runDate
                        ? new Date(r.runDate).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

// ─── SEC Baseline Tab (full original content) ─────────────────────────────────

interface SECBaselineTabProps {
  runSummary: RunSummary | null;
  loading: boolean;
  error: string | null;
  githubLoading: boolean;
  githubError: string | null;
  githubSource: string | null;
  githubLoadedAt: string | null;
  githubSuccessUrl: string | null;
  onGitHubLoad: (slug: string) => void;
  onRefresh: () => void;
}

const SECBaselineTab: React.FC<SECBaselineTabProps> = ({
  runSummary,
  loading,
  error: _error,
  githubLoading,
  githubError,
  githubSource,
  githubLoadedAt,
  githubSuccessUrl,
  onGitHubLoad,
  onRefresh,
}) => {
  const results: BaselineResult[] = runSummary?.results ?? [];

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [exchangeFilter, setExchangeFilter] = useState<string[]>([]);
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const allExchanges = useMemo(
    () => Array.from(new Set(results.map((r) => r.exchange).filter(Boolean))).sort(),
    [results]
  );

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
      if (exchangeFilter.length > 0 && !exchangeFilter.includes(r.exchange)) return false;
      if (materialFilter === 'Yes' && !r.materiallySpecific) return false;
      if (materialFilter === 'No' && r.materiallySpecific) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.ticker.toLowerCase().includes(q) && !r.companyName.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [results, categoryFilter, exchangeFilter, materialFilter, search]);

  const stats = useMemo(() => {
    const total = results.length;
    if (total === 0)
      return { total: 0, pctSEC: 0, pctRetrieval: 0, pctStructured: 0, pctNarrative: 0, pctMaterial: 0 };
    const pct = (n: number) => Math.round((n / total) * 100);
    return {
      total,
      pctSEC: pct(results.filter((r) => r.enteredSECPath).length),
      pctRetrieval: pct(results.filter((r) => r.retrievalSucceeded).length),
      pctStructured: pct(results.filter((r) => r.structuredParsingSucceeded).length),
      pctNarrative: pct(results.filter((r) => r.narrativeParsingSucceeded).length),
      pctMaterial: pct(results.filter((r) => r.materiallySpecific).length),
    };
  }, [results]);

  const pipelineData = useMemo(
    () => [
      { stage: 'SEC Path', rate: stats.pctSEC },
      { stage: 'Retrieval', rate: stats.pctRetrieval },
      { stage: 'Structured', rate: stats.pctStructured },
      { stage: 'Narrative', rate: stats.pctNarrative },
      { stage: 'Materially Specific', rate: stats.pctMaterial },
    ],
    [stats]
  );

  const tierPieData = (channel: keyof BaselineResult['channelTiers']) => {
    const counts: Partial<Record<EvidenceTier, number>> = {};
    results.forEach((r) => {
      const t = r.channelTiers[channel];
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return (Object.entries(counts) as [EvidenceTier, number][]).map(([name, value]) => ({ name, value }));
  };

  const toggleExchange = (ex: string) =>
    setExchangeFilter((prev) =>
      prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]
    );

  const isDegradedMode = !!(runSummary?._degradedMode || runSummary?.error);
  const isEmpty =
    !runSummary ||
    (results.length === 0 && !isDegradedMode) ||
    runSummary.phase === 'not-yet-run';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-3" />
        <span className="text-slate-300">Loading baseline results…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GitHub source banner */}
      {githubSource && !isEmpty && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-emerald-400">
          <Github className="h-3.5 w-3.5" />
          Loaded from GitHub · <span className="font-mono">{githubSource}</span>
          {githubLoadedAt && <span className="text-emerald-600 ml-1">· {githubLoadedAt}</span>}
          {githubSuccessUrl && (
            <span className="text-slate-500 hidden md:inline ml-1">
              · <code className="text-slate-400">{githubSuccessUrl}</code>
            </span>
          )}
        </div>
      )}

      {/* Header-level GitHub error banner */}
      {githubError && !isEmpty && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-lg px-4 py-2 flex items-start gap-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{githubError}</span>
        </div>
      )}

      {/* Degraded-mode banner */}
      {(runSummary?._degradedMode || runSummary?.error) && (
        <div className="bg-amber-950/60 border border-amber-700 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Workflow ran but GitHub Secrets are missing
            </p>
            {runSummary?.error && (
              <p className="text-xs text-amber-200 font-mono bg-amber-950/60 rounded px-2 py-1 border border-amber-800/60">
                {runSummary.error}
              </p>
            )}
            <p className="text-xs text-amber-200/80">
              The workflow completed but <strong>SUPABASE_URL</strong> and/or{' '}
              <strong>SUPABASE_ANON_KEY</strong> were not set as GitHub repository secrets.
            </p>
            <p className="text-xs text-amber-300">
              <strong>Fix:</strong>{' '}
              <a
                href="https://github.com/richardbonugli-sudo/co-gri-platform/settings/secrets/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-amber-200"
              >
                Settings → Secrets and variables → Actions
              </a>
              {' '}→ add{' '}
              <code className="text-amber-200 bg-amber-950/60 px-1 rounded">SUPABASE_URL</code>{' '}
              and{' '}
              <code className="text-amber-200 bg-amber-950/60 px-1 rounded">SUPABASE_ANON_KEY</code>,
              then re-run the workflow.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="py-10 flex flex-col items-center gap-5 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <div>
              <p className="text-white font-semibold text-lg mb-1">
                Awaiting First GitHub Actions Run
              </p>
              <p className="text-slate-400 text-sm max-w-lg">
                No baseline data available yet. The results file will be created automatically
                after the first GitHub Actions workflow run completes and commits{' '}
                <span className="font-mono text-slate-300">docs/baseline-results/latest.json</span>{' '}
                to the repository.
              </p>
              {runSummary?._status && (
                <p className="text-xs text-slate-500 mt-2 max-w-lg italic">{runSummary._status}</p>
              )}
            </div>
            <div className="w-full max-w-xl text-left">
              <GitHubLoader
                onLoad={onGitHubLoad}
                githubLoading={githubLoading}
                githubError={githubError}
                githubSource={githubSource}
                githubLoadedAt={githubLoadedAt}
                githubSuccessUrl={githubSuccessUrl}
              />
            </div>
            <div className="w-full max-w-xl text-left space-y-3">
              <div className="rounded-md bg-amber-950/40 border border-amber-700 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Step 1 — Configure GitHub Secrets first (required)
                  </p>
                </div>
                <ol className="text-sm text-slate-200 space-y-2 list-decimal list-inside">
                  <li>
                    Go to your repo →{' '}
                    <a
                      href="https://github.com/richardbonugli-sudo/co-gri-platform/settings/secrets/actions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 underline underline-offset-2 hover:text-amber-200 break-all"
                    >
                      Settings → Secrets and variables → Actions
                    </a>
                  </li>
                  <li>
                    Add <code className="font-mono text-amber-300 text-xs">SUPABASE_URL</code> and{' '}
                    <code className="font-mono text-amber-300 text-xs">SUPABASE_ANON_KEY</code>
                  </li>
                </ol>
              </div>
              <div className="rounded-md bg-slate-800 border border-slate-700 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    Step 2 — Trigger the GitHub Actions workflow
                  </p>
                </div>
                <ol className="text-sm text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>
                    Go to{' '}
                    <a
                      href="https://github.com/richardbonugli-sudo/co-gri-platform/actions/workflows/run-sec-baseline.yml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
                    >
                      Actions → SEC Runtime Baseline
                    </a>
                  </li>
                  <li>Click <span className="text-white font-semibold">Run workflow</span></li>
                  <li>Choose category <span className="font-mono text-amber-400">A</span> (~15–30 min)</li>
                  <li>Click the green <span className="text-white font-semibold">Run workflow</span> button</li>
                  <li>Once complete, paste your repo slug above and click <span className="text-blue-400 font-semibold">Load Results</span></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
        <>
          {/* Run metadata */}
          {runSummary && (
            <p className="text-xs text-slate-400">
              Run <span className="font-mono text-slate-300">{runSummary.runId}</span>
              {' · '}Phase {runSummary.phase}
              {runSummary.startTime && <>{' · '}{new Date(runSummary.startTime).toLocaleString()}</>}
            </p>
          )}

          {/* Summary stats */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Pipeline Summary — {stats.total} companies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Companies" value={String(stats.total)} />
              <StatCard label="Entered SEC Path" value={`${stats.pctSEC}%`} accent={stats.pctSEC >= 80 ? 'text-emerald-400' : 'text-amber-400'} />
              <StatCard label="Retrieval Succeeded" value={`${stats.pctRetrieval}%`} accent={stats.pctRetrieval >= 70 ? 'text-emerald-400' : 'text-amber-400'} />
              <StatCard label="Structured Parsing" value={`${stats.pctStructured}%`} accent={stats.pctStructured >= 60 ? 'text-emerald-400' : 'text-amber-400'} />
              <StatCard label="Narrative Parsing" value={`${stats.pctNarrative}%`} accent={stats.pctNarrative >= 50 ? 'text-emerald-400' : 'text-amber-400'} />
              <StatCard label="Materially Specific" value={`${stats.pctMaterial}%`} accent={stats.pctMaterial >= 50 ? 'text-emerald-400' : 'text-rose-400'} />
            </div>
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-300">Pipeline Stage Success Rates (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelineData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#94a3b8' }} formatter={(v: number) => [`${v}%`, 'Success Rate']} />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {pipelineData.map((_, i) => (
                        <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-300">Evidence Tier Breakdown by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(['revenue', 'supply', 'assets', 'financial'] as const).map((ch) => {
                    const data = tierPieData(ch);
                    return (
                      <div key={ch} className="flex flex-col items-center">
                        <p className="text-[11px] text-slate-400 capitalize mb-1">{ch}</p>
                        <PieChart width={120} height={100}>
                          <Pie data={data} cx={55} cy={45} innerRadius={28} outerRadius={44} dataKey="value" paddingAngle={2}>
                            {data.map((entry, i) => (
                              <Cell key={i} fill={TIER_CHART_COLORS[entry.name as EvidenceTier] ?? '#64748b'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }} itemStyle={{ color: '#94a3b8' }} />
                        </PieChart>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {(Object.keys(TIER_CHART_COLORS) as EvidenceTier[]).map((t) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: TIER_CHART_COLORS[t] }} />
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Filters */}
          <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filters</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-slate-500 mb-1 block">Ticker / Name</label>
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm" />
              </div>
              <div className="min-w-[120px]">
                <label className="text-xs text-slate-500 mb-1 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {['All', 'A', 'B', 'C', 'D'].map((c) => (
                      <SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[150px]">
                <label className="text-xs text-slate-500 mb-1 block">Materially Specific</label>
                <Select value={materialFilter} onValueChange={setMaterialFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {['All', 'Yes', 'No'].map((v) => (
                      <SelectItem key={v} value={v} className="text-slate-200 focus:bg-slate-700">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {allExchanges.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Exchange</label>
                  <div className="flex flex-wrap gap-1">
                    {allExchanges.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => toggleExchange(ex)}
                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                          exchangeFilter.includes(ex)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(categoryFilter !== 'All' || exchangeFilter.length > 0 || materialFilter !== 'All' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter('All'); setExchangeFilter([]); setMaterialFilter('All'); setSearch(''); }} className="text-slate-400 hover:text-white h-8">
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Showing {filtered.length} of {results.length} companies</p>
          </section>

          {/* Data table */}
          <section>
            <div className="rounded-lg border border-slate-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900 border-slate-700 hover:bg-slate-900">
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Ticker</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Company</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Cat</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Exchange</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">SEC Path</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Retrieval</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Structured</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Narrative</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Revenue Tier</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Supply Tier</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Assets Tier</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Financial Tier</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Material</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-right">CO-GRI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center text-slate-500 py-10">
                        No companies match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.ticker} className="border-slate-800 hover:bg-slate-900/60 transition-colors">
                        <TableCell className="font-mono text-xs text-blue-400 font-semibold whitespace-nowrap">{r.ticker}</TableCell>
                        <TableCell className="text-xs text-slate-200 max-w-[180px] truncate whitespace-nowrap">{r.companyName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300 px-1.5">{r.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap">{r.exchange}</TableCell>
                        <TableCell className="text-center"><BoolIcon value={r.enteredSECPath} /></TableCell>
                        <TableCell className="text-center"><BoolIcon value={r.retrievalSucceeded} /></TableCell>
                        <TableCell className="text-center"><BoolIcon value={r.structuredParsingSucceeded} /></TableCell>
                        <TableCell className="text-center"><BoolIcon value={r.narrativeParsingSucceeded} /></TableCell>
                        <TableCell><TierBadge tier={r.channelTiers.revenue} /></TableCell>
                        <TableCell><TierBadge tier={r.channelTiers.supply} /></TableCell>
                        <TableCell><TierBadge tier={r.channelTiers.assets} /></TableCell>
                        <TableCell><TierBadge tier={r.channelTiers.financial} /></TableCell>
                        <TableCell className="text-center"><BoolIcon value={r.materiallySpecific} /></TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-300 whitespace-nowrap">
                          {r.compositeConfidenceScore != null && r.compositeConfidenceScore > 0
                            ? r.compositeConfidenceScore.toFixed(2)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};


// ─── Combined Baseline Tab ────────────────────────────────────────────────────

const SOURCE_BADGE: Record<string, string> = {
  SEC: 'bg-blue-900/60 text-blue-300 border-blue-700',
  Global: 'bg-violet-900/60 text-violet-300 border-violet-700',
};

const CombinedBaselineTab: React.FC = () => {
  const [data, setData] = useState<CombinedLoadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'All' | 'SEC' | 'Global'>('All');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const load = async () => {
    setLoading(true);
    const result = await loadCombinedBaseline();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.entries.filter((e) => {
      if (sourceFilter !== 'All' && e.source !== sourceFilter) return false;
      if (gradeFilter !== 'All' && e.confidenceGrade !== gradeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.ticker.toLowerCase().includes(q) && !e.displayName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [data, sourceFilter, gradeFilter, search]);

  const stats = useMemo(() => {
    if (!data) return null;
    const all = data.entries;
    const total = all.length;
    if (total === 0) return null;
    const pct = (n: number) => Math.round((n / total) * 100);
    return {
      total,
      secCount: data.secTotal,
      globalCount: data.globalTotal,
      pctFiling: pct(all.filter((e) => e.filingFetched).length),
      pctStructured: pct(all.filter((e) => e.structuredDataFound).length),
      pctNarrative: pct(all.filter((e) => e.narrativeParsingSucceeded).length),
      avgScore: total > 0
        ? Math.round(all.reduce((s, e) => s + (e.compositeConfidenceScore ?? 0), 0) / total)
        : 0,
    };
  }, [data]);

  const sourceChartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'SEC', value: data.secTotal, fill: '#3b82f6' },
      { name: 'Global', value: data.globalTotal, fill: '#8b5cf6' },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-3" />
        <span className="text-slate-300">Loading combined baseline data…</span>
      </div>
    );
  }

  if (!data || data.combinedTotal === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Layers className="h-10 w-10 text-slate-500" />
          <div>
            <p className="text-white font-semibold text-lg mb-1">No Combined Data Available</p>
            <p className="text-slate-400 text-sm max-w-lg">
              Run both the SEC Baseline and Global Baseline GitHub Actions workflows to populate
              the combined 211-company view.
            </p>
          </div>
          {(data?.secError || data?.globalError) && (
            <div className="w-full max-w-lg space-y-2 text-left">
              {data.secError && (
                <div className="bg-rose-950/40 border border-rose-800 rounded px-3 py-2 text-xs text-rose-300">
                  <strong>SEC error:</strong> {data.secError}
                </div>
              )}
              {data.globalError && (
                <div className="bg-amber-950/40 border border-amber-800 rounded px-3 py-2 text-xs text-amber-300">
                  <strong>Global error:</strong> {data.globalError}
                </div>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partial-error banners */}
      {data.secError && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-lg px-4 py-2 flex items-start gap-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span><strong>SEC data error:</strong> {data.secError}</span>
        </div>
      )}
      {data.globalError && (
        <div className="bg-amber-950/40 border border-amber-800 rounded-lg px-4 py-2 flex items-start gap-2 text-xs text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span><strong>Global data error:</strong> {data.globalError}</span>
        </div>
      )}

      {/* Load metadata */}
      <p className="text-xs text-slate-500">
        Combined view loaded at {data.loadedAt}
        {data.secRunId && <> · SEC run <span className="font-mono text-slate-400">{data.secRunId}</span></>}
        {data.globalRunId && <> · Global run <span className="font-mono text-slate-400">{data.globalRunId}</span></>}
      </p>

      {/* Summary stats */}
      {stats && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Combined Summary — {stats.total} companies
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <StatCard label="Total Companies" value={String(stats.total)} />
            <StatCard
              label="SEC Companies"
              value={String(stats.secCount)}
              accent="text-blue-400"
            />
            <StatCard
              label="Global Companies"
              value={String(stats.globalCount)}
              accent="text-violet-400"
            />
            <StatCard
              label="Filing Fetched"
              value={`${stats.pctFiling}%`}
              accent={stats.pctFiling >= 70 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <StatCard
              label="Structured Parsing"
              value={`${stats.pctStructured}%`}
              accent={stats.pctStructured >= 60 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <StatCard
              label="Narrative Parsing"
              value={`${stats.pctNarrative}%`}
              accent={stats.pctNarrative >= 50 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <StatCard
              label="Avg CO-GRI Score"
              value={String(stats.avgScore)}
              accent={stats.avgScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}
            />
          </div>
        </section>
      )}

      {/* Source breakdown chart */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Companies by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sourceChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sourceChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Source Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-8 h-[180px]">
            <PieChart width={160} height={160}>
              <Pie
                data={sourceChartData}
                cx={75}
                cy={75}
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {sourceChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                itemStyle={{ color: '#94a3b8' }}
              />
            </PieChart>
            <div className="space-y-3">
              {sourceChartData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: d.fill }} />
                  <span className="text-sm text-slate-300">{d.name}</span>
                  <span className="text-sm font-semibold text-white ml-1">{d.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-slate-700 pt-2 mt-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-slate-600" />
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-sm font-semibold text-white ml-1">{data.combinedTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filters</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-500 mb-1 block">Ticker / Name</label>
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="text-xs text-slate-500 mb-1 block">Source</label>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as 'All' | 'SEC' | 'Global')}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {['All', 'SEC', 'Global'].map((v) => (
                  <SelectItem key={v} value={v} className="text-slate-200 focus:bg-slate-700">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[120px]">
            <label className="text-xs text-slate-500 mb-1 block">CO-GRI Grade</label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {['All', 'A', 'B', 'C', 'D', 'F'].map((v) => (
                  <SelectItem key={v} value={v} className="text-slate-200 focus:bg-slate-700">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(sourceFilter !== 'All' || gradeFilter !== 'All' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSourceFilter('All'); setGradeFilter('All'); setSearch(''); }}
              className="text-slate-400 hover:text-white h-8"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Showing {filtered.length} of {data.combinedTotal} companies
        </p>
      </section>

      {/* Combined data table */}
      <section>
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 border-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Source</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Ticker</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Company</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Exchange</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">Country</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Filing</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Structured</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Narrative</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-right">CO-GRI Score</TableHead>
                <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-slate-500 py-10">
                    No companies match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e, idx) => (
                  <TableRow key={`${e.source}-${e.ticker}-${idx}`} className="border-slate-800 hover:bg-slate-900/60 transition-colors">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 border ${SOURCE_BADGE[e.source] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}
                      >
                        {e.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-400 font-semibold whitespace-nowrap">
                      {e.ticker}
                    </TableCell>
                    <TableCell className="text-xs text-slate-200 max-w-[200px] truncate whitespace-nowrap">
                      {e.displayName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                      {e.exchange || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                      {e.country || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <BoolIcon value={e.filingFetched} />
                    </TableCell>
                    <TableCell className="text-center">
                      <BoolIcon value={e.structuredDataFound} />
                    </TableCell>
                    <TableCell className="text-center">
                      <BoolIcon value={e.narrativeParsingSucceeded} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={`font-mono text-xs font-semibold ${confidenceColor(e.compositeConfidenceScore)}`}>
                        {e.compositeConfidenceScore ?? 0}
                      </span>
                      <span className="text-slate-600 text-[10px] ml-0.5">/100</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 border font-semibold ${
                          e.confidenceGrade === 'A' ? 'border-emerald-600 text-emerald-400' :
                          e.confidenceGrade === 'B' ? 'border-blue-600 text-blue-400' :
                          e.confidenceGrade === 'C' ? 'border-amber-600 text-amber-400' :
                          e.confidenceGrade === 'D' ? 'border-orange-600 text-orange-400' :
                          'border-rose-700 text-rose-400'
                        }`}
                      >
                        {e.confidenceGrade ?? '—'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BaselineResultsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sec' | 'global' | 'combined'>('sec');

  // SEC data state
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GitHub loader state (SEC tab only)
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSource, setGithubSource] = useState<string | null>(null);
  const [githubLoadedAt, setGithubLoadedAt] = useState<string | null>(null);
  const [githubSuccessUrl, setGithubSuccessUrl] = useState<string | null>(null);

  const handleGitHubLoad = async (repoSlug: string) => {
    const slug = normaliseSlug(repoSlug);
    if (!slug) return;
    localStorage.setItem(LS_REPO_KEY, slug);
    setGithubLoading(true);
    setGithubError(null);
    setGithubSuccessUrl(null);

    const result = await fetchFromGitHubDetailed(slug);

    if (result.status === 'ok') {
      setRunSummary(result.data);
      setGithubSource(slug);
      setGithubLoadedAt(new Date().toLocaleTimeString());
      setGithubSuccessUrl(result.url);
      setGithubError(null);
    } else if (result.status === 'not_found') {
      const tried = buildTriedUrlsNote(slug);
      setGithubError(
        `Repo "${slug}" was reached, but docs/baseline-results/latest.json does not exist yet.\n\n` +
        `To generate results, trigger the GitHub Actions workflow:\n` +
        `  1. Go to https://github.com/${slug}/actions\n` +
        `  2. Select "SEC Runtime Baseline"\n` +
        `  3. Click "Run workflow", choose category A, then click the green "Run workflow" button\n` +
        `  4. Once complete (~15–60 min), click "Load Results" here again\n\n${tried}`
      );
    } else if (result.status === 'empty') {
      const tried = buildTriedUrlsNote(slug);
      setGithubError(
        `Results file found at GitHub but contains 0 companies — the workflow may have run with errors.\n` +
        `Check the Actions tab: https://github.com/${slug}/actions\n\n${tried}`
      );
    } else {
      const tried = buildTriedUrlsNote(slug);
      setGithubError(
        `Network error fetching from GitHub: ${(result as { status: 'error'; message: string }).message}.\n` +
        `If your repo is private, raw.githubusercontent.com requires the repo to be public.\n\n${tried}`
      );
    }
    setGithubLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const envRawUrl = (import.meta.env.VITE_GITHUB_RAW_URL as string | undefined) ?? '';
      if (envRawUrl) {
        try {
          const res = await fetch(envRawUrl, { cache: 'no-store' });
          if (res.ok) {
            const data: RunSummary = await res.json();
            if (data.results?.length > 0) {
              setRunSummary(data);
              setGithubSource('VITE_GITHUB_RAW_URL');
              setGithubLoadedAt(new Date().toLocaleTimeString());
              setGithubSuccessUrl(envRawUrl);
              setLoading(false);
              return;
            }
          }
        } catch { /* fall through */ }
      }

      const lsSlugRaw = localStorage.getItem(LS_REPO_KEY)?.trim() ?? '';
      const lsSlug = normaliseSlug(lsSlugRaw);
      if (lsSlugRaw && !isValidRepoSlug(lsSlug)) {
        localStorage.removeItem(LS_REPO_KEY);
      } else if (lsSlug) {
        const result = await fetchFromGitHubDetailed(lsSlug);
        if (result.status === 'ok') {
          setRunSummary(result.data);
          setGithubSource(lsSlug);
          setGithubLoadedAt(new Date().toLocaleTimeString());
          setGithubSuccessUrl(result.url);
          setLoading(false);
          return;
        } else if (result.status === 'empty') {
          const tried = buildTriedUrlsNote(lsSlug);
          setGithubError(
            `Saved repo "${lsSlug}" found on GitHub but contains 0 results.\n` +
            `Check the Actions tab: https://github.com/${lsSlug}/actions\n\n${tried}`
          );
        } else if (result.status === 'not_found') {
          const tried = buildTriedUrlsNote(lsSlug);
          setGithubError(
            `Repo "${lsSlug}" was reached, but docs/baseline-results/latest.json does not exist yet.\n\n${tried}`
          );
        }
      }

      const envRepoSlug = (import.meta.env.VITE_GITHUB_REPO as string | undefined) ?? '';
      if (envRepoSlug && !lsSlug) {
        const result = await fetchFromGitHubDetailed(envRepoSlug);
        if (result.status === 'ok') {
          setRunSummary(result.data);
          setGithubSource(envRepoSlug);
          setGithubLoadedAt(new Date().toLocaleTimeString());
          setGithubSuccessUrl(result.url);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/docs/baseline-results/latest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RunSummary = await res.json();
      setRunSummary(data);
    } catch (e) {
      setRunSummary(null);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const isDegradedMode = !!(runSummary?._degradedMode || runSummary?.error);
  const secIsEmpty =
    !runSummary ||
    (runSummary.results.length === 0 && !isDegradedMode) ||
    runSummary.phase === 'not-yet-run';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Baseline Results</h1>
            <p className="text-xs text-slate-400">SEC EDGAR + Global Exchange Pipeline</p>
          </div>
        </div>

        {/* Header right: GitHub loader (compact, SEC tab only) + Refresh + Download */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'sec' && (
            <GitHubLoader
              compact
              onLoad={handleGitHubLoad}
              githubLoading={githubLoading}
              githubError={githubError}
              githubSource={githubSource}
              githubLoadedAt={githubLoadedAt}
              githubSuccessUrl={githubSuccessUrl}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 h-8 self-end"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>

          {/* Download dropdown — SEC tab only, when data is loaded */}
          {activeTab === 'sec' && !secIsEmpty && !loading && runSummary && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 bg-emerald-700 hover:bg-emerald-600 text-white self-end whitespace-nowrap">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Report
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600 text-slate-200 min-w-[180px]">
                <DropdownMenuItem onClick={() => downloadCSV(runSummary)} className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2">
                  <Download className="h-3.5 w-3.5 text-emerald-400" /> Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadJSON(runSummary)} className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2">
                  <Download className="h-3.5 w-3.5 text-blue-400" /> Download JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="px-6 pt-5 pb-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sec' | 'global' | 'combined')}>
          <TabsList className="bg-slate-900 border border-slate-700 h-10">
            <TabsTrigger
              value="sec"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 h-8 px-4 flex items-center gap-2"
            >
              <Building2 className="h-3.5 w-3.5" />
              SEC Baseline
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 h-8 px-4 flex items-center gap-2"
            >
              <Globe className="h-3.5 w-3.5" />
              Global Baseline
            </TabsTrigger>
            <TabsTrigger
              value="combined"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 h-8 px-4 flex items-center gap-2"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Combined (211)
            </TabsTrigger>
          </TabsList>

          {/* ── SEC Baseline tab ── */}
          <TabsContent value="sec" className="mt-5">
            <SECBaselineTab
              runSummary={runSummary}
              loading={loading}
              error={error}
              githubLoading={githubLoading}
              githubError={githubError}
              githubSource={githubSource}
              githubLoadedAt={githubLoadedAt}
              githubSuccessUrl={githubSuccessUrl}
              onGitHubLoad={handleGitHubLoad}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* ── Global Baseline tab ── */}
          <TabsContent value="global" className="mt-5">
            <GlobalBaselineTab />
          </TabsContent>

          {/* ── Combined tab ── */}
          <TabsContent value="combined" className="mt-5">
            <CombinedBaselineTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


export default BaselineResultsDashboard;
