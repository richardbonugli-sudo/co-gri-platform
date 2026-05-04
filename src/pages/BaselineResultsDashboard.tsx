/**
 * BaselineResultsDashboard — Phase 4
 * Displays SEC baseline run results: summary stats, per-company table,
 * filter controls, and Recharts visualisations.
 *
 * Data source priority:
 *   1. VITE_GITHUB_RAW_URL env var (explicit raw URL)
 *   2. localStorage 'sec_baseline_github_repo' (user-entered repo slug)
 *   3. VITE_GITHUB_REPO env var (repo slug)
 *   4. /docs/baseline-results/latest.json (local public folder)
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
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

/** Returns true only if the slug looks like "owner/repo" */
function isValidRepoSlug(slug: string): boolean {
  // Must contain exactly one slash, both sides non-empty, no spaces
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

// ─── Helper components ────────────────────────────────────────────────────────

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

      {/* Error display */}
      {githubError && (
        <div className="flex flex-col gap-1 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{githubError}</span>
          </div>
        </div>
      )}

      {/* Success display */}
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

// ─── Download helpers ─────────────────────────────────────────────────────────

const CSV_COLUMNS: (keyof BaselineResult | string)[] = [
  'ticker',
  'companyName',
  'exchange',
  'category',
  'isADR',
  'filingType',
  'filingDate',
  'htmlSizeKB',
  'narrativeParsingSucceeded',
  'narrativeCountriesFound',
  'narrativeParsingMs',
  'revenueTableFound',
  'ppeTableFound',
  'debtTableFound',
  'exhibit21Found',
  'tablesFound',
  'channelTier_revenue',
  'channelTier_supply',
  'channelTier_assets',
  'channelTier_financial',
  'materiallySpecific',
  'specificChannelCount',
  'dominantEvidenceTier',
  'compositeConfidenceScore',
  'confidenceGrade',
  'recencyMultiplier',
  'enteredSECPath',
  'retrievalSucceeded',
  'structuredParsingSucceeded',
  'cikSource',
  'errorMessage',
  'timestamp',
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
  const htmlSizeKB =
    r.htmlSizeBytes != null ? (r.htmlSizeBytes / 1024).toFixed(1) : '';

  const fieldMap: Record<string, unknown> = {
    ticker: r.ticker,
    companyName: r.companyName,
    exchange: r.exchange,
    category: r.category,
    isADR: r.isADR,
    filingType: r.filingType,
    filingDate: r.filingDate,
    htmlSizeKB,
    narrativeParsingSucceeded: r.narrativeParsingSucceeded,
    narrativeCountriesFound: r.narrativeCountriesFound,
    narrativeParsingMs: r.narrativeParsingMs,
    revenueTableFound: r.revenueTableFound,
    ppeTableFound: r.ppeTableFound,
    debtTableFound: r.debtTableFound,
    exhibit21Found: r.exhibit21Found,
    tablesFound: r.tablesFound,
    channelTier_revenue: r.channelTiers.revenue,
    channelTier_supply: r.channelTiers.supply,
    channelTier_assets: r.channelTiers.assets,
    channelTier_financial: r.channelTiers.financial,
    materiallySpecific: r.materiallySpecific,
    specificChannelCount: r.specificChannelCount,
    dominantEvidenceTier: r.dominantEvidenceTier,
    compositeConfidenceScore: r.compositeConfidenceScore,
    confidenceGrade: r.confidenceGrade,
    recencyMultiplier: r.recencyMultiplier,
    enteredSECPath: r.enteredSECPath,
    retrievalSucceeded: r.retrievalSucceeded,
    structuredParsingSucceeded: r.structuredParsingSucceeded,
    cikSource: r.cikSource,
    errorMessage: r.errorMessage,
    timestamp: r.timestamp,
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

// ─── Main Component ───────────────────────────────────────────────────────────

const BaselineResultsDashboard: React.FC = () => {
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GitHub loader state
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSource, setGithubSource] = useState<string | null>(null);
  const [githubLoadedAt, setGithubLoadedAt] = useState<string | null>(null);
  const [githubSuccessUrl, setGithubSuccessUrl] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [exchangeFilter, setExchangeFilter] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  // ── GitHub loader handler ──────────────────────────────────────────────────
  const handleGitHubLoad = async (repoSlug: string) => {
    const slug = normaliseSlug(repoSlug);
    if (!slug) return;

    // Persist slug immediately so it survives page reload
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
        `Repo "${slug}" was reached, but docs/baseline-results/latest.json does not exist yet — ` +
        `the directory currently only contains a .gitkeep placeholder.\n\n` +
        `To generate results, trigger the GitHub Actions workflow:\n` +
        `  1. Go to https://github.com/${slug}/actions\n` +
        `  2. Select "SEC Runtime Baseline" from the left sidebar\n` +
        `  3. Click "Run workflow", choose a category (e.g. A), then click the green "Run workflow" button\n` +
        `  4. Once the run completes (~15–60 min), click "Load Results" here again\n\n` +
        `${tried}`
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

  // ── Load data (main, on mount) ─────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Explicit VITE_GITHUB_RAW_URL env var
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

      // 2. localStorage repo slug (auto-load on mount)
      const lsSlugRaw = localStorage.getItem(LS_REPO_KEY)?.trim() ?? '';
      const lsSlug = normaliseSlug(lsSlugRaw);

      // Validate the stored slug — if it's not a valid owner/repo, clear it and skip
      if (lsSlugRaw && !isValidRepoSlug(lsSlug)) {
        localStorage.removeItem(LS_REPO_KEY);
        // fall through to local file
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
            `Saved repo "${lsSlug}" found on GitHub but contains 0 results — workflow may have run with errors.\n` +
            `Check the Actions tab: https://github.com/${lsSlug}/actions\n\n${tried}`
          );
        } else if (result.status === 'not_found') {
          const tried = buildTriedUrlsNote(lsSlug);
          setGithubError(
            `Repo "${lsSlug}" was reached, but docs/baseline-results/latest.json does not exist yet — ` +
            `the directory currently only contains a .gitkeep placeholder.\n\n` +
            `To generate results, trigger the GitHub Actions workflow:\n` +
            `  1. Go to https://github.com/${lsSlug}/actions\n` +
            `  2. Select "SEC Runtime Baseline" from the left sidebar\n` +
            `  3. Click "Run workflow", choose a category (e.g. A), then click the green "Run workflow" button\n` +
            `  4. Once the run completes (~15–60 min), click "Load Results" here again\n\n` +
            `${tried}`
          );
        }
        // fall through to local file regardless
      }

      // 3. VITE_GITHUB_REPO env var
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

      // 4. Local public folder
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

  useEffect(() => {
    loadData();
  }, []);

  const results: BaselineResult[] = runSummary?.results ?? [];

  // ── Derived filter options ─────────────────────────────────────────────────
  const allExchanges = useMemo(
    () => Array.from(new Set(results.map((r) => r.exchange).filter(Boolean))).sort(),
    [results]
  );

  // ── Filtered rows ──────────────────────────────────────────────────────────
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
  }, [results, categoryFilter, exchangeFilter, materialFilter, search, sectorFilter]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = results.length;
    if (total === 0)
      return {
        total: 0,
        pctSEC: 0,
        pctRetrieval: 0,
        pctStructured: 0,
        pctNarrative: 0,
        pctMaterial: 0,
      };
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

  // ── Pipeline bar chart data ────────────────────────────────────────────────
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

  // ── Tier pie data ──────────────────────────────────────────────────────────
  const tierPieData = (channel: keyof BaselineResult['channelTiers']) => {
    const counts: Partial<Record<EvidenceTier, number>> = {};
    results.forEach((r) => {
      const t = r.channelTiers[channel];
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return (Object.entries(counts) as [EvidenceTier, number][]).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // ── Toggle multi-select ────────────────────────────────────────────────────
  const toggleExchange = (ex: string) =>
    setExchangeFilter((prev) =>
      prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Render: loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-3" />
        <span className="text-slate-300">Loading baseline results…</span>
      </div>
    );
  }

  // Degraded-mode: latest.json exists but has results:[] and an error field.
  // Show the dashboard shell with the amber error banner rather than the empty
  // "no data yet" state — the user needs to see the actionable error message.
  const isDegradedMode = !!(runSummary?._degradedMode || runSummary?.error);
  const isEmpty =
    !runSummary ||
    (results.length === 0 && !isDegradedMode) ||
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
            <h1 className="text-lg font-bold text-white">SEC Baseline Results</h1>
            {runSummary && !isEmpty && (
              <p className="text-xs text-slate-400">
                Run&nbsp;
                <span className="font-mono text-slate-300">{runSummary.runId}</span>
                &nbsp;·&nbsp;Phase&nbsp;{runSummary.phase}&nbsp;·&nbsp;
                {runSummary.startTime ? new Date(runSummary.startTime).toLocaleString() : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Header right: GitHub loader (compact) + Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <GitHubLoader
            compact
            onLoad={handleGitHubLoad}
            githubLoading={githubLoading}
            githubError={githubError}
            githubSource={githubSource}
            githubLoadedAt={githubLoadedAt}
            githubSuccessUrl={githubSuccessUrl}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 h-8 self-end"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>

          {/* Download Report dropdown — only shown when data is loaded */}
          {!isEmpty && !loading && runSummary && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 bg-emerald-700 hover:bg-emerald-600 text-white self-end whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Report
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-slate-800 border-slate-600 text-slate-200 min-w-[180px]"
              >
                <DropdownMenuItem
                  onClick={() => downloadCSV(runSummary)}
                  className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadJSON(runSummary)}
                  className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 text-sm gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                  Download JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* GitHub source banner */}
      {githubSource && !isEmpty && (
        <div className="bg-emerald-950/50 border-b border-emerald-800 px-6 py-2 flex items-center gap-2 text-xs text-emerald-400">
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

      {/* Header-level GitHub error banner (compact mode errors) */}
      {githubError && !isEmpty && (
        <div className="bg-rose-950/40 border-b border-rose-800 px-6 py-2 flex items-start gap-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{githubError}</span>
        </div>
      )}

      {/* Degraded-mode banner — shown when latest.json has _degradedMode:true or top-level error */}
      {(runSummary?._degradedMode || runSummary?.error) && (
        <div className="bg-amber-950/60 border-b border-amber-700 px-6 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Workflow ran but GitHub Secrets are missing
            </p>
            {runSummary.error && (
              <p className="text-xs text-amber-200 font-mono bg-amber-950/60 rounded px-2 py-1 border border-amber-800/60">
                {runSummary.error}
              </p>
            )}
            <p className="text-xs text-amber-200/80">
              The workflow completed but <strong>SUPABASE_URL</strong> and/or{' '}
              <strong>SUPABASE_ANON_KEY</strong> were not set as GitHub repository secrets.
              No companies were processed — the script cannot call the Supabase Edge Functions
              needed to fetch SEC filings without these credentials.
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
              {' '}→ click <strong>New repository secret</strong> → add{' '}
              <code className="text-amber-200 bg-amber-950/60 px-1 rounded">SUPABASE_URL</code>{' '}
              and{' '}
              <code className="text-amber-200 bg-amber-950/60 px-1 rounded">SUPABASE_ANON_KEY</code>,
              then re-run the workflow.
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-6 space-y-6">
        {/* ── Empty / Error state ── */}
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
                  <span className="font-mono text-slate-300">
                    docs/baseline-results/latest.json
                  </span>{' '}
                  to the repository.
                </p>
                {runSummary?._status && (
                  <p className="text-xs text-slate-500 mt-2 max-w-lg italic">
                    {runSummary._status}
                  </p>
                )}
              </div>

              {/* GitHub loader — full panel */}
              <div className="w-full max-w-xl text-left">
                <GitHubLoader
                  onLoad={handleGitHubLoad}
                  githubLoading={githubLoading}
                  githubError={githubError}
                  githubSource={githubSource}
                  githubLoadedAt={githubLoadedAt}
                  githubSuccessUrl={githubSuccessUrl}
                />
              </div>

              {/* Instructions */}
              <div className="w-full max-w-xl text-left space-y-3">

                {/* ── STEP 1: Prerequisites (amber/warning) ── */}
                <div className="rounded-md bg-amber-950/40 border border-amber-700 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Step 1 — Configure GitHub Secrets first (required)
                    </p>
                  </div>
                  <p className="text-xs text-amber-200/80 mb-3">
                    The workflow calls Supabase Edge Functions and will exit with code&nbsp;1 if
                    these secrets are missing. Set them before triggering the run.
                  </p>
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
                      Click{' '}
                      <span className="text-white font-semibold">New repository secret</span> and
                      add:
                      <ul className="mt-1.5 ml-4 space-y-1.5 list-none">
                        <li className="flex flex-col gap-0.5">
                          <span className="font-mono text-amber-300 text-xs">SUPABASE_URL</span>
                          <span className="text-xs text-slate-400">
                            Your Supabase project URL, e.g.{' '}
                            <code className="text-slate-300">https://xxxx.supabase.co</code>
                          </span>
                        </li>
                        <li className="flex flex-col gap-0.5">
                          <span className="font-mono text-amber-300 text-xs">SUPABASE_ANON_KEY</span>
                          <span className="text-xs text-slate-400">
                            Your Supabase anon/public key (found in Project Settings → API)
                          </span>
                        </li>
                        <li className="flex flex-col gap-0.5">
                          <span className="font-mono text-slate-400 text-xs">
                            OPENAI_API_KEY{' '}
                            <span className="text-slate-500 font-sans font-normal">(optional)</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            Used for narrative parsing — workflow runs without it but narrative
                            parsing will be skipped
                          </span>
                        </li>
                      </ul>
                    </li>
                  </ol>
                  <p className="text-xs text-amber-600 mt-3 italic">
                    Without <code className="text-amber-400">SUPABASE_URL</code> and{' '}
                    <code className="text-amber-400">SUPABASE_ANON_KEY</code> the workflow will
                    fail immediately with exit code 1.
                  </p>
                </div>

                {/* ── STEP 2: Trigger the workflow ── */}
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
                    <li>
                      Click{' '}
                      <span className="text-white font-semibold">Run workflow</span> (top-right of
                      the workflow page)
                    </li>
                    <li>
                      Choose a category:{' '}
                      <span className="font-mono text-amber-400">A</span> = 41 pilot companies
                      (fastest,{' '}
                      <span className="text-slate-400">~15–30 min</span>)
                    </li>
                    <li>
                      Click the green{' '}
                      <span className="text-white font-semibold">Run workflow</span> button
                    </li>
                    <li>
                      Once complete, paste your repo slug above and click{' '}
                      <span className="text-blue-400 font-semibold">Load Results</span>
                    </li>
                  </ol>
                  <p className="text-xs text-slate-500 mt-2">
                    The workflow fetches live EDGAR filings via Supabase Edge Functions, parses
                    them, and commits{' '}
                    <code className="text-slate-400">docs/baseline-results/latest.json</code> back
                    to the repo. The{' '}
                    <code className="text-slate-400">docs/baseline-results/</code> folder currently
                    only contains a <code className="text-slate-400">.gitkeep</code> placeholder —
                    the workflow will generate the results file on first successful run.
                  </p>
                </div>

                {/* ── STEP 3: Dry run alternative ── */}
                <div className="rounded-md bg-slate-800 border border-slate-700 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Alternative — Dry run (no API calls)
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    Test that the workflow setup is correct without making any Supabase or EDGAR
                    API calls. Set{' '}
                    <code className="text-slate-300">dry_run</code> to{' '}
                    <code className="text-amber-400">true</code> in the "Run workflow" dialog.
                    This will list all tickers but will{' '}
                    <span className="text-slate-300 font-medium">not</span> generate results.
                  </p>
                  <div className="font-mono text-xs text-slate-300 space-y-1 bg-slate-900 rounded px-3 py-2">
                    <p className="text-slate-500"># Or run locally without secrets:</p>
                    <p>npx tsx src/scripts/runSECBaseline.ts --dry-run</p>
                    <p className="text-slate-500 mt-1"># Single ticker test (requires secrets):</p>
                    <p>npx tsx src/scripts/runSECBaseline.ts --ticker=AAPL</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {!isEmpty && (
          <>
            {/* ── Summary stats ── */}
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Pipeline Summary — {stats.total} companies
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Companies" value={String(stats.total)} />
                <StatCard
                  label="Entered SEC Path"
                  value={`${stats.pctSEC}%`}
                  accent={stats.pctSEC >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                />
                <StatCard
                  label="Retrieval Succeeded"
                  value={`${stats.pctRetrieval}%`}
                  accent={stats.pctRetrieval >= 70 ? 'text-emerald-400' : 'text-amber-400'}
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
                  label="Materially Specific"
                  value={`${stats.pctMaterial}%`}
                  accent={stats.pctMaterial >= 50 ? 'text-emerald-400' : 'text-rose-400'}
                />
              </div>
            </section>

            {/* ── Charts ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline bar chart */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">
                    Pipeline Stage Success Rates (%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={pipelineData}
                      margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#475569' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 6,
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#94a3b8' }}
                        formatter={(v: number) => [`${v}%`, 'Success Rate']}
                      />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                        {pipelineData.map((_, i) => (
                          <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tier pie charts — 2×2 grid */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">
                    Evidence Tier Breakdown by Channel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {(['revenue', 'supply', 'assets', 'financial'] as const).map((ch) => {
                      const data = tierPieData(ch);
                      return (
                        <div key={ch} className="flex flex-col items-center">
                          <p className="text-[11px] text-slate-400 capitalize mb-1">{ch}</p>
                          <PieChart width={120} height={100}>
                            <Pie
                              data={data}
                              cx={55}
                              cy={45}
                              innerRadius={28}
                              outerRadius={44}
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {data.map((entry, i) => (
                                <Cell
                                  key={i}
                                  fill={
                                    TIER_CHART_COLORS[entry.name as EvidenceTier] ?? '#64748b'
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: 6,
                                fontSize: 11,
                              }}
                              itemStyle={{ color: '#94a3b8' }}
                            />
                          </PieChart>
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {(Object.keys(TIER_CHART_COLORS) as EvidenceTier[]).map((t) => (
                      <span key={t} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: TIER_CHART_COLORS[t] }}
                        />
                        {t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Filters ── */}
            <section className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Filters
              </h2>
              <div className="flex flex-wrap gap-3 items-end">
                {/* Search */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-slate-500 mb-1 block">Ticker / Name</label>
                  <Input
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm"
                  />
                </div>

                {/* Category */}
                <div className="min-w-[120px]">
                  <label className="text-xs text-slate-500 mb-1 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      {['All', 'A', 'B', 'C', 'D'].map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          className="text-slate-200 focus:bg-slate-700"
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Materially Specific */}
                <div className="min-w-[150px]">
                  <label className="text-xs text-slate-500 mb-1 block">Materially Specific</label>
                  <Select value={materialFilter} onValueChange={setMaterialFilter}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      {['All', 'Yes', 'No'].map((v) => (
                        <SelectItem
                          key={v}
                          value={v}
                          className="text-slate-200 focus:bg-slate-700"
                        >
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exchange multi-select pills */}
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

                {/* Clear */}
                {(categoryFilter !== 'All' ||
                  exchangeFilter.length > 0 ||
                  materialFilter !== 'All' ||
                  search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('All');
                      setExchangeFilter([]);
                      setMaterialFilter('All');
                      setSearch('');
                    }}
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

            {/* ── Data table ── */}
            <section>
              <div className="rounded-lg border border-slate-700 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-900 border-slate-700 hover:bg-slate-900">
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Ticker
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Company
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Cat
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Exchange
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">
                        SEC Path
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">
                        Retrieval
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">
                        Structured
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">
                        Narrative
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Revenue Tier
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Supply Tier
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Assets Tier
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                        Financial Tier
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-center">
                        Material
                      </TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold whitespace-nowrap text-right">
                        CO-GRI Score
                      </TableHead>
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
                        <TableRow
                          key={r.ticker}
                          className="border-slate-800 hover:bg-slate-900/60 transition-colors"
                        >
                          <TableCell className="font-mono text-xs text-blue-400 font-semibold whitespace-nowrap">
                            {r.ticker}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200 max-w-[180px] truncate whitespace-nowrap">
                            {r.companyName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-slate-600 text-slate-300 px-1.5"
                            >
                              {r.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                            {r.exchange}
                          </TableCell>
                          <TableCell className="text-center">
                            <BoolIcon value={r.enteredSECPath} />
                          </TableCell>
                          <TableCell className="text-center">
                            <BoolIcon value={r.retrievalSucceeded} />
                          </TableCell>
                          <TableCell className="text-center">
                            <BoolIcon value={r.structuredParsingSucceeded} />
                          </TableCell>
                          <TableCell className="text-center">
                            <BoolIcon value={r.narrativeParsingSucceeded} />
                          </TableCell>
                          <TableCell>
                            <TierBadge tier={r.channelTiers.revenue} />
                          </TableCell>
                          <TableCell>
                            <TierBadge tier={r.channelTiers.supply} />
                          </TableCell>
                          <TableCell>
                            <TierBadge tier={r.channelTiers.assets} />
                          </TableCell>
                          <TableCell>
                            <TierBadge tier={r.channelTiers.financial} />
                          </TableCell>
                          <TableCell className="text-center">
                            <BoolIcon value={r.materiallySpecific} />
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-300 whitespace-nowrap">
                            {r.compositeConfidenceScore != null &&
                            r.compositeConfidenceScore > 0
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
    </div>
  );
};

export default BaselineResultsDashboard;