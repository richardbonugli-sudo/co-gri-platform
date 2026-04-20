/**
 * Live SEC EDGAR Pipeline for Company-Specific Tickers
 *
 * Task 3: Retire the static AAPL override table and route through live SEC EDGAR pipeline.
 *
 * This module:
 *   1. Guards the legacy static snapshot behind LEGACY_STATIC_OVERRIDE = false.
 *      When false, the live pipeline is the primary source; the static table is fallback only.
 *   2. Calls fetchSECFilingText(ticker) → parseNarrativeText(text) at runtime for
 *      company-specific tickers (AAPL, TSLA, MSFT, and any future additions).
 *   3. Adds a runtime in-memory cache (Map keyed by ticker) so the live EDGAR fetch
 *      is not repeated on every render — fetch once, cache the result.
 *   4. Graceful fallback: if the live EDGAR fetch fails (network error, rate limit, empty
 *      response), logs a warning and falls back to the static snapshot rather than crashing.
 *
 * Integration point:
 *   Called from geographicExposureService.ts → calculateIndependentChannelExposuresWithSEC()
 *   in the company-specific branch, BEFORE building channel breakdown from static data.
 */

import { fetchSECFilingText, parseNarrativeText, type NarrativeParseResult } from '../narrativeParser';
import { integrateStructuredData, type IntegratedExposureData } from '../structuredDataIntegrator';
import { getCompanySpecificExposure, type CompanyExposure } from '../../data/companySpecificExposures';

// ============================================================================
// LEGACY STATIC OVERRIDE FLAG
// ============================================================================

/**
 * @deprecated
 * When LEGACY_STATIC_OVERRIDE is true, the old behaviour is preserved:
 *   - company-specific tickers use ONLY the static snapshot in companySpecificExposures.ts
 *   - live SEC EDGAR pipeline is NOT called as primary source
 *
 * Set to false (current default) to route company-specific tickers through the live
 * SEC EDGAR pipeline, with the static snapshot as graceful fallback only.
 *
 * To temporarily revert to legacy behaviour (e.g., for debugging), set this to true.
 */
export const LEGACY_STATIC_OVERRIDE = false;

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * Cache entry for a live EDGAR pipeline result.
 * Keyed by ticker (uppercase). Populated on first successful fetch.
 * Cleared on page reload (in-memory only — intentional, no stale-data risk).
 */
interface LivePipelineCacheEntry {
  /** Full V5 integrated exposure data from the live EDGAR pipeline. */
  secIntegration: IntegratedExposureData;
  /** Parsed narrative result (regional definitions, country mentions). */
  narrativeResult: NarrativeParseResult;
  /** Raw filing text length (chars) — for diagnostics. */
  filingTextLength: number;
  /** ISO timestamp of when this entry was cached. */
  cachedAt: string;
}

/**
 * In-memory cache: ticker → LivePipelineCacheEntry.
 * Module-level singleton — survives re-renders, cleared on page reload.
 */
const _livePipelineCache = new Map<string, LivePipelineCacheEntry>();

/**
 * Expose cache for testing / diagnostics (read-only view).
 */
export function getLivePipelineCacheSnapshot(): ReadonlyMap<string, LivePipelineCacheEntry> {
  return _livePipelineCache;
}

/**
 * Clear the cache for a specific ticker (or all tickers if no argument).
 * Useful for forcing a fresh fetch in tests or after a manual data refresh.
 */
export function clearLivePipelineCache(ticker?: string): void {
  if (ticker) {
    _livePipelineCache.delete(ticker.toUpperCase());
    console.log(`[LiveEdgarPipeline] Cache cleared for ${ticker.toUpperCase()}`);
  } else {
    _livePipelineCache.clear();
    console.log(`[LiveEdgarPipeline] Full cache cleared`);
  }
}

// ============================================================================
// LIVE PIPELINE RESULT TYPE
// ============================================================================

export interface LivePipelineResult {
  /**
   * Whether the live EDGAR pipeline succeeded and produced usable data.
   * false means the static snapshot should be used as primary source.
   */
  liveDataAvailable: boolean;

  /**
   * Full V5 integrated exposure data from the live pipeline.
   * Non-null only when liveDataAvailable === true.
   */
  secIntegration: IntegratedExposureData | null;

  /**
   * Parsed narrative result from the live 10-K filing text.
   * Non-null only when liveDataAvailable === true and filing text was non-empty.
   */
  narrativeResult: NarrativeParseResult | null;

  /**
   * Static snapshot from companySpecificExposures.ts.
   * Always populated for company-specific tickers (AAPL, TSLA, MSFT).
   * Used as fallback when liveDataAvailable === false.
   */
  staticSnapshot: CompanyExposure | null;

  /**
   * Source description for logging / UI display.
   */
  source: 'live-edgar' | 'static-snapshot-fallback' | 'static-snapshot-legacy';

  /**
   * Whether this result came from the in-memory cache (not a fresh fetch).
   */
  fromCache: boolean;
}

// ============================================================================
// MAIN FUNCTION: fetchLiveOrFallback
// ============================================================================

/**
 * Fetch live SEC EDGAR data for a company-specific ticker, with in-memory caching
 * and graceful fallback to the static snapshot.
 *
 * Behaviour matrix:
 *
 *   LEGACY_STATIC_OVERRIDE = true  → returns static-snapshot-legacy immediately (no fetch)
 *   LEGACY_STATIC_OVERRIDE = false → tries live pipeline:
 *     Cache hit                    → returns cached live data (fromCache: true)
 *     Cache miss + fetch OK        → caches result, returns live-edgar
 *     Cache miss + fetch fails     → logs warning, returns static-snapshot-fallback
 *     Cache miss + fetch empty     → logs warning, returns static-snapshot-fallback
 *
 * @param ticker   Company ticker symbol (case-insensitive).
 * @param homeCountry  Company home country (e.g. 'United States').
 * @param sector   Company sector (e.g. 'Technology').
 */
export async function fetchLiveOrFallback(
  ticker: string,
  homeCountry: string,
  sector: string
): Promise<LivePipelineResult> {
  const upperTicker = ticker.toUpperCase();
  const staticSnapshot = getCompanySpecificExposure(upperTicker);

  // ── Legacy mode: skip live pipeline entirely ─────────────────────────────
  if (LEGACY_STATIC_OVERRIDE) {
    console.log(
      `[LiveEdgarPipeline] ${upperTicker}: LEGACY_STATIC_OVERRIDE=true — ` +
      `returning static snapshot without live fetch`
    );
    return {
      liveDataAvailable: false,
      secIntegration: null,
      narrativeResult: null,
      staticSnapshot,
      source: 'static-snapshot-legacy',
      fromCache: false,
    };
  }

  // ── Cache hit ─────────────────────────────────────────────────────────────
  const cached = _livePipelineCache.get(upperTicker);
  if (cached) {
    console.log(
      `[LiveEdgarPipeline] ${upperTicker}: Cache hit (cached at ${cached.cachedAt}, ` +
      `filing text ${cached.filingTextLength} chars)`
    );
    return {
      liveDataAvailable: true,
      secIntegration: cached.secIntegration,
      narrativeResult: cached.narrativeResult,
      staticSnapshot,
      source: 'live-edgar',
      fromCache: true,
    };
  }

  // ── Live fetch ────────────────────────────────────────────────────────────
  console.log(`[LiveEdgarPipeline] ${upperTicker}: Cache miss — starting live EDGAR fetch...`);

  try {
    // Step 1: Fetch 10-K narrative text from SEC EDGAR
    const filingText = await fetchSECFilingText(upperTicker);

    if (!filingText || filingText.trim().length === 0) {
      console.warn(
        `[LiveEdgarPipeline] ${upperTicker}: Live EDGAR fetch returned empty text — ` +
        `falling back to static snapshot`
      );
      return {
        liveDataAvailable: false,
        secIntegration: null,
        narrativeResult: null,
        staticSnapshot,
        source: 'static-snapshot-fallback',
        fromCache: false,
      };
    }

    console.log(
      `[LiveEdgarPipeline] ${upperTicker}: ✅ Filing text fetched (${filingText.length} chars) — ` +
      `parsing narrative...`
    );

    // Step 2: Parse narrative text (regional definitions, country mentions, supply chain)
    const narrativeResult = parseNarrativeText(filingText);
    console.log(
      `[LiveEdgarPipeline] ${upperTicker}: Narrative parsed — ` +
      `${narrativeResult.regionalDefinitions.length} regional definitions, ` +
      `${narrativeResult.countryMentions.length} country mentions`
    );

    // Step 3: Run full V5 structured data integration pipeline
    // This calls parseSECFiling (real EDGAR API) → integrateRevenueChannelV5 /
    // integrateSupplyChannelV5 / integrateAssetsChannelV5 / integrateFinancialChannelV5
    console.log(`[LiveEdgarPipeline] ${upperTicker}: Running V5 structured data integration...`);
    const secIntegration = await integrateStructuredData(upperTicker, homeCountry, sector);

    // Step 4: Validate that the live pipeline produced usable data
    const hasUsableData =
      Object.keys(secIntegration.revenueChannel).length > 0 ||
      Object.keys(secIntegration.supplyChannel).length > 0 ||
      Object.keys(secIntegration.assetsChannel).length > 0 ||
      Object.keys(secIntegration.financialChannel).length > 0;

    if (!hasUsableData) {
      console.warn(
        `[LiveEdgarPipeline] ${upperTicker}: V5 integration returned no channel data — ` +
        `falling back to static snapshot`
      );
      return {
        liveDataAvailable: false,
        secIntegration: null,
        narrativeResult: null,
        staticSnapshot,
        source: 'static-snapshot-fallback',
        fromCache: false,
      };
    }

    // Step 5: Cache the successful result
    const entry: LivePipelineCacheEntry = {
      secIntegration,
      narrativeResult,
      filingTextLength: filingText.length,
      cachedAt: new Date().toISOString(),
    };
    _livePipelineCache.set(upperTicker, entry);

    console.log(
      `[LiveEdgarPipeline] ${upperTicker}: ✅ Live pipeline complete — result cached. ` +
      `Revenue countries: ${Object.keys(secIntegration.revenueChannel).length}, ` +
      `Supply countries: ${Object.keys(secIntegration.supplyChannel).length}, ` +
      `Assets countries: ${Object.keys(secIntegration.assetsChannel).length}, ` +
      `Financial countries: ${Object.keys(secIntegration.financialChannel).length}`
    );

    return {
      liveDataAvailable: true,
      secIntegration,
      narrativeResult,
      staticSnapshot,
      source: 'live-edgar',
      fromCache: false,
    };
  } catch (error) {
    // Graceful fallback: any network error, rate limit, or unexpected exception
    console.warn(
      `[LiveEdgarPipeline] ${upperTicker}: Live EDGAR pipeline failed — ` +
      `falling back to static snapshot. Error:`,
      error
    );
    return {
      liveDataAvailable: false,
      secIntegration: null,
      narrativeResult: null,
      staticSnapshot,
      source: 'static-snapshot-fallback',
      fromCache: false,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const liveEdgarPipeline = {
  fetchLiveOrFallback,
  clearLivePipelineCache,
  getLivePipelineCacheSnapshot,
  LEGACY_STATIC_OVERRIDE,
};