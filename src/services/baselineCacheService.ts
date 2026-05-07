/**
 * baselineCacheService.ts
 *
 * Provides a unified loader that fetches SEC and Global baseline data,
 * merges them into a single 211-company list, and tags each entry with
 * its source ("SEC" | "Global").
 *
 * Used by BaselineResultsDashboard.tsx for the Combined tab.
 */

import type { GlobalBaselineResult, GlobalRunSummary } from '@/types/company';

// ─── SEC types (mirrored from dashboard to avoid circular imports) ─────────────

export type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK' | 'NOT_RUN';
export type Category = 'A' | 'B' | 'C' | 'D';

export interface SECBaselineResult {
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

export interface SECRunSummary {
  runId: string;
  phase: string;
  startTime: string | null;
  endTime: string | null;
  durationMs: number;
  totalCompanies: number;
  completedCompanies: number;
  failedCompanies: number;
  skippedCompanies: number;
  results: SECBaselineResult[];
  error?: string;
  _status?: string;
  _degradedMode?: boolean;
  _degradedReason?: string;
}

// ─── Combined entry type ──────────────────────────────────────────────────────

export type DataSource = 'SEC' | 'Global';

/** A unified row that can represent either a SEC or Global company. */
export interface CombinedBaselineEntry {
  source: DataSource;
  ticker: string;
  /** Display name — companyName (SEC) or name (Global) */
  displayName: string;
  exchange: string;
  /** Country — derived from SEC exchange or Global country field */
  country: string;
  compositeConfidenceScore: number;
  confidenceGrade: string;
  narrativeParsingSucceeded: boolean;
  structuredDataFound: boolean;
  filingFetched: boolean;
  errorMessage: string | null;
  /** Full original record for detail rendering */
  _sec?: SECBaselineResult;
  _global?: GlobalBaselineResult;
}

// ─── Load result types ────────────────────────────────────────────────────────

export interface CombinedLoadResult {
  entries: CombinedBaselineEntry[];
  secTotal: number;
  globalTotal: number;
  combinedTotal: number;
  secError: string | null;
  globalError: string | null;
  secRunId: string | null;
  globalRunId: string | null;
  loadedAt: string;
  /** True when the global latest.json is a stub (not-yet-run or in-progress). */
  globalIsStub: boolean;
  /** Human-readable reason for the stub state, or null if not a stub. */
  globalStubReason: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secToCombined(r: SECBaselineResult): CombinedBaselineEntry {
  return {
    source: 'SEC',
    ticker: r.ticker,
    displayName: r.companyName,
    exchange: r.exchange,
    country: r.exchange ?? '',
    compositeConfidenceScore: r.compositeConfidenceScore ?? 0,
    confidenceGrade: r.confidenceGrade ?? '—',
    narrativeParsingSucceeded: r.narrativeParsingSucceeded ?? false,
    structuredDataFound: r.structuredParsingSucceeded ?? false,
    filingFetched: r.retrievalSucceeded ?? false,
    errorMessage: r.errorMessage ?? null,
    _sec: r,
  };
}

function globalToCombined(r: GlobalBaselineResult): CombinedBaselineEntry {
  return {
    source: 'Global',
    ticker: r.ticker,
    displayName: r.name,
    exchange: r.exchange,
    country: r.country ?? '',
    compositeConfidenceScore: r.compositeConfidenceScore ?? 0,
    confidenceGrade: r.confidenceGrade ?? '—',
    narrativeParsingSucceeded: r.narrativeParsingSucceeded ?? false,
    structuredDataFound: r.structuredDataFound ?? false,
    filingFetched: r.filingFetched ?? false,
    errorMessage: r.errorMessage ?? null,
    _global: r,
  };
}

// ─── Main loader ──────────────────────────────────────────────────────────────

/**
 * Loads SEC and Global baseline data in parallel, merges them into a single
 * unified list, and tags each entry with its source.
 *
 * Never throws — errors are captured in the result object so callers can
 * display partial data gracefully.
 */
export async function loadCombinedBaseline(): Promise<CombinedLoadResult> {
  const loadedAt = new Date().toLocaleString();

  // ── Fetch SEC data ──────────────────────────────────────────────────────────
  let secEntries: CombinedBaselineEntry[] = [];
  let secError: string | null = null;
  let secRunId: string | null = null;

  try {
    const secRes = await fetch('/docs/baseline-results/latest.json', { cache: 'no-store' });
    if (!secRes.ok) throw new Error(`HTTP ${secRes.status} fetching SEC baseline`);
    const secData: SECRunSummary = await secRes.json();
    secRunId = secData.runId ?? null;
    if (Array.isArray(secData.results)) {
      secEntries = secData.results.map(secToCombined);
    }
  } catch (e) {
    secError = e instanceof Error ? e.message : String(e);
  }

  // ── Fetch Global data ───────────────────────────────────────────────────────
  let globalEntries: CombinedBaselineEntry[] = [];
  let globalError: string | null = null;
  let globalRunId: string | null = null;
  let globalIsStub = false;
  let globalStubReason: string | null = null;

  try {
    const globalRes = await fetch('/docs/global-baseline-results/latest.json', { cache: 'no-store' });
    if (!globalRes.ok) {
      if (globalRes.status === 404) {
        // Not yet run — treat as stub, not an error
        globalIsStub = true;
        globalStubReason = 'not_yet_run';
      } else {
        throw new Error(`HTTP ${globalRes.status} fetching Global baseline`);
      }
    } else {
      const globalData: GlobalRunSummary & {
        _notYetRun?: boolean;
        _inProgress?: boolean;
      } = await globalRes.json();
      globalRunId = globalData.runId ?? null;

      if (globalData._notYetRun) {
        globalIsStub = true;
        globalStubReason = 'not_yet_run';
      } else if (globalData._inProgress) {
        globalIsStub = true;
        globalStubReason = 'in_progress';
      } else if (Array.isArray(globalData.results) && globalData.results.length > 0) {
        globalEntries = globalData.results.map(globalToCombined);
      }
    }
  } catch (e) {
    globalError = e instanceof Error ? e.message : String(e);
  }

  // ── Merge: SEC first, then Global ──────────────────────────────────────────
  const entries: CombinedBaselineEntry[] = [...secEntries, ...globalEntries];

  return {
    entries,
    secTotal: secEntries.length,
    globalTotal: globalEntries.length,
    combinedTotal: entries.length,
    secError,
    globalError,
    secRunId,
    globalRunId,
    loadedAt,
    globalIsStub,
    globalStubReason,
  };
}
