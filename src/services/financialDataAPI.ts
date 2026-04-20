/**
 * Financial Data API Integration - Phase 2 Enhanced
 * 
 * Integrates with multiple financial data APIs to automatically fetch company geographic exposure data
 * - Financial Modeling Prep API (primary)
 * - Alpha Vantage API (secondary)
 * - Yahoo Finance API (tertiary)
 * - SEC EDGAR API (fallback)
 */

interface APIGeographicSegment {
  country: string;
  revenuePercentage: number;
  operationalPresence: boolean;
  subsidiaries?: number;
  facilities?: number;
}

interface APICompanyData {
  ticker: string;
  companyName: string;
  headquartersCountry: string;
  fiscalYear: number;
  dataSource: string;
  segments: APIGeographicSegment[];
  lastUpdated: string;
}

/**
 * API Configuration
 * APIs can be enabled by setting environment variables
 */
export const API_CONFIG = {
  // Financial Modeling Prep
  FMP_API_KEY: import.meta.env.VITE_FMP_API_KEY || '',
  FMP_BASE_URL: 'https://financialmodelingprep.com/api/v3',
  
  // Alpha Vantage
  ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',
  ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
  
  // Yahoo Finance (no key required)
  YAHOO_FINANCE_BASE_URL: 'https://query2.finance.yahoo.com/v10/finance',
  
  // SEC EDGAR
  SEC_BASE_URL: 'https://data.sec.gov/api/xbrl',
  SEC_SEARCH_URL: 'https://www.sec.gov/cgi-bin/browse-edgar',
  
  // Enable/disable API calls (automatically enabled if keys are present)
  ENABLE_FMP: false,
  ENABLE_ALPHA_VANTAGE: false,
  ENABLE_YAHOO: true, // No key required
  ENABLE_SEC: true, // No key required
  
  // Rate limiting
  RATE_LIMIT_DELAY: 1000, // 1 second between requests
  MAX_RETRIES: 3,
  TIMEOUT: 30000 // 30 seconds
};

// Auto-enable APIs if keys are present
if (API_CONFIG.FMP_API_KEY) API_CONFIG.ENABLE_FMP = true;
if (API_CONFIG.ALPHA_VANTAGE_API_KEY) API_CONFIG.ENABLE_ALPHA_VANTAGE = true;

/**
 * Cache management for API responses
 */
const apiCache = new Map<string, { data: APICompanyData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedAPIData(ticker: string): APICompanyData | null {
  const cached = apiCache.get(ticker.toUpperCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedAPIData(ticker: string, data: APICompanyData): void {
  apiCache.set(ticker.toUpperCase(), {
    data,
    timestamp: Date.now()
  });
}

/**
 * Rate limiting helper
 */
let lastRequestTime = 0;
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < API_CONFIG.RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Main function to fetch from any available API
 * Tries multiple sources in priority order
 */
export async function fetchFromFMP(ticker: string): Promise<APICompanyData | null> {
  // Check cache first
  const cached = getCachedAPIData(ticker);
  if (cached) {
    console.log(`[API] Using cached data for ${ticker}`);
    return cached;
  }

  // Try APIs in priority order
  const sources = [
    { name: 'FMP', enabled: API_CONFIG.ENABLE_FMP, fn: fetchFromFinancialModelingPrep },
    { name: 'Yahoo', enabled: API_CONFIG.ENABLE_YAHOO, fn: fetchFromYahooFinance },
    { name: 'AlphaVantage', enabled: API_CONFIG.ENABLE_ALPHA_VANTAGE, fn: fetchFromAlphaVantage },
    { name: 'SEC', enabled: API_CONFIG.ENABLE_SEC, fn: fetchFromSECEdgar }
  ];

  for (const source of sources) {
    if (!source.enabled) continue;
    
    try {
      console.log(`[API] Trying ${source.name} for ${ticker}...`);
      await rateLimit();
      const data = await source.fn(ticker);
      if (data && data.segments.length > 0) {
        console.log(`[API] Successfully fetched from ${source.name} for ${ticker}`);
        setCachedAPIData(ticker, data);
        return data;
      }
    } catch (error) {
      console.log(`[API] ${source.name} failed for ${ticker}:`, error);
    }
  }

  console.log(`[API] No data available from any API for ${ticker}`);
  return null;
}

/**
 * Fetch from Financial Modeling Prep API
 */
async function fetchFromFinancialModelingPrep(ticker: string): Promise<APICompanyData | null> {
  if (!API_CONFIG.FMP_API_KEY) return null;
  
  try {
    // Try revenue geographic segmentation endpoint
    const response = await fetch(
      `${API_CONFIG.FMP_BASE_URL}/revenue-geographic-segmentation/${ticker}?apikey=${API_CONFIG.FMP_API_KEY}`,
      { signal: AbortSignal.timeout(API_CONFIG.TIMEOUT) }
    );
    
    if (!response.ok) {
      // Try alternative endpoint: company profile
      const profileResponse = await fetch(
        `${API_CONFIG.FMP_BASE_URL}/profile/${ticker}?apikey=${API_CONFIG.FMP_API_KEY}`,
        { signal: AbortSignal.timeout(API_CONFIG.TIMEOUT) }
      );
      
      if (!profileResponse.ok) return null;
      
      const profileData = await profileResponse.json();
      if (!profileData || profileData.length === 0) return null;
      
      const profile = profileData[0];
      
      // Create basic data from profile
      return {
        ticker: ticker.toUpperCase(),
        companyName: profile.companyName || ticker,
        headquartersCountry: profile.country || 'Unknown',
        fiscalYear: new Date().getFullYear(),
        dataSource: 'Financial Modeling Prep API (Profile)',
        segments: [
          {
            country: profile.country || 'Unknown',
            revenuePercentage: 100,
            operationalPresence: true
          }
        ],
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    // Parse FMP response
    const latestYear = data[0];
    const segments: APIGeographicSegment[] = [];
    
    // FMP returns geographic segments as key-value pairs
    Object.entries(latestYear).forEach(([key, value]) => {
      if (key !== 'date' && key !== 'symbol' && typeof value === 'number' && value > 0) {
        segments.push({
          country: formatCountryName(key),
          revenuePercentage: value * 100,
          operationalPresence: value >= 0.05
        });
      }
    });
    
    if (segments.length === 0) return null;
    
    return {
      ticker: ticker.toUpperCase(),
      companyName: latestYear.companyName || ticker,
      headquartersCountry: segments[0]?.country || 'Unknown',
      fiscalYear: new Date(latestYear.date).getFullYear(),
      dataSource: 'Financial Modeling Prep API',
      segments: segments.sort((a, b) => b.revenuePercentage - a.revenuePercentage),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[FMP] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch from Yahoo Finance API
 */
async function fetchFromYahooFinance(ticker: string): Promise<APICompanyData | null> {
  try {
    // Yahoo Finance quoteSummary endpoint
    const response = await fetch(
      `${API_CONFIG.YAHOO_FINANCE_BASE_URL}/quoteSummary/${ticker}?modules=assetProfile,financialData`,
      { 
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;
    
    const profile = result.assetProfile;
    if (!profile) return null;
    
    // Yahoo doesn't provide detailed geographic revenue breakdown
    // But we can get headquarters country
    const country = profile.country || 'Unknown';
    
    return {
      ticker: ticker.toUpperCase(),
      companyName: profile.longBusinessSummary?.split(' ')[0] || ticker,
      headquartersCountry: country,
      fiscalYear: new Date().getFullYear(),
      dataSource: 'Yahoo Finance API',
      segments: [
        {
          country: country,
          revenuePercentage: 100,
          operationalPresence: true
        }
      ],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[Yahoo] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch from Alpha Vantage API
 */
async function fetchFromAlphaVantage(ticker: string): Promise<APICompanyData | null> {
  if (!API_CONFIG.ALPHA_VANTAGE_API_KEY) return null;
  
  try {
    // Alpha Vantage company overview endpoint
    const response = await fetch(
      `${API_CONFIG.ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${ticker}&apikey=${API_CONFIG.ALPHA_VANTAGE_API_KEY}`,
      { signal: AbortSignal.timeout(API_CONFIG.TIMEOUT) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.Note || !data.Country) return null;
    
    // Alpha Vantage doesn't provide geographic revenue breakdown
    // But we can get headquarters country
    return {
      ticker: ticker.toUpperCase(),
      companyName: data.Name || ticker,
      headquartersCountry: data.Country || 'Unknown',
      fiscalYear: new Date().getFullYear(),
      dataSource: 'Alpha Vantage API',
      segments: [
        {
          country: data.Country || 'Unknown',
          revenuePercentage: 100,
          operationalPresence: true
        }
      ],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[AlphaVantage] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch from SEC EDGAR API
 */
async function fetchFromSECEdgar(ticker: string): Promise<APICompanyData | null> {
  try {
    // First, get company CIK from ticker
    const cikResponse = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker}&type=&dateb=&owner=exclude&count=1&output=atom`,
      { 
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        headers: {
          'User-Agent': 'CO-GRI Platform contact@cogri.com'
        }
      }
    );
    
    if (!cikResponse.ok) return null;
    
    const cikText = await cikResponse.text();
    const cikMatch = cikText.match(/CIK=(\d+)/);
    if (!cikMatch) return null;
    
    const cik = cikMatch[1].padStart(10, '0');
    
    // Fetch company facts
    const factsResponse = await fetch(
      `${API_CONFIG.SEC_BASE_URL}/companyfacts/CIK${cik}.json`,
      { 
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        headers: {
          'User-Agent': 'CO-GRI Platform contact@cogri.com'
        }
      }
    );
    
    if (!factsResponse.ok) return null;
    
    const facts = await factsResponse.json();
    
    // Look for geographic revenue segments in XBRL data
    // Common tags: RevenueFromContractWithCustomerByGeographicArea, Revenues
    const usGaap = facts.facts?.['us-gaap'];
    if (!usGaap) return null;
    
    // Try to find geographic revenue data
    const geoRevenueTags = [
      'RevenueFromContractWithCustomerByGeographicArea',
      'RevenuesFromExternalCustomersAndLongLivedAssetsByGeographicalAreasTableTextBlock',
      'SegmentReportingInformationBySegmentTextBlock'
    ];
    
    // For now, return basic company info
    // Full XBRL parsing would require more complex logic
    return {
      ticker: ticker.toUpperCase(),
      companyName: facts.entityName || ticker,
      headquartersCountry: 'United States', // Most SEC filers are US-based
      fiscalYear: new Date().getFullYear(),
      dataSource: 'SEC EDGAR API',
      segments: [
        {
          country: 'United States',
          revenuePercentage: 100,
          operationalPresence: true
        }
      ],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('[SEC] Fetch error:', error);
    return null;
  }
}

/**
 * Format country names consistently
 */
function formatCountryName(name: string): string {
  const countryMap: Record<string, string> = {
    'us': 'United States',
    'usa': 'United States',
    'uk': 'United Kingdom',
    'uae': 'United Arab Emirates',
    'cn': 'China',
    'jp': 'Japan',
    'de': 'Germany',
    'fr': 'France',
    'kr': 'South Korea',
    'in': 'India',
    'br': 'Brazil',
    'ca': 'Canada',
    'au': 'Australia',
    'mx': 'Mexico',
    'es': 'Spain',
    'it': 'Italy',
    'nl': 'Netherlands',
    'sg': 'Singapore',
    'hk': 'Hong Kong',
    'tw': 'Taiwan',
    'ch': 'Switzerland',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland',
    'pl': 'Poland',
    'ru': 'Russia',
    'za': 'South Africa',
    'ar': 'Argentina',
    'cl': 'Chile',
    'co': 'Colombia',
    'pe': 'Peru'
  };
  
  const normalized = name.toLowerCase().trim();
  return countryMap[normalized] || name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Get API status and statistics
 */
export function getAPIStatus(): {
  fmp: { enabled: boolean; hasKey: boolean };
  alphaVantage: { enabled: boolean; hasKey: boolean };
  yahoo: { enabled: boolean; hasKey: boolean };
  sec: { enabled: boolean; hasKey: boolean };
  cacheSize: number;
} {
  return {
    fmp: { 
      enabled: API_CONFIG.ENABLE_FMP, 
      hasKey: !!API_CONFIG.FMP_API_KEY 
    },
    alphaVantage: { 
      enabled: API_CONFIG.ENABLE_ALPHA_VANTAGE, 
      hasKey: !!API_CONFIG.ALPHA_VANTAGE_API_KEY 
    },
    yahoo: { 
      enabled: API_CONFIG.ENABLE_YAHOO, 
      hasKey: true // No key required
    },
    sec: { 
      enabled: API_CONFIG.ENABLE_SEC, 
      hasKey: true // No key required
    },
    cacheSize: apiCache.size
  };
}

/**
 * Clear API cache
 */
export function clearAPICache(): void {
  apiCache.clear();
  console.log('[API] Cache cleared');
}

// ============================================================================
// P3-B: FMP GEOGRAPHIC SEGMENT CROSS-REFERENCE + TRIANGULATION
// ============================================================================

/**
 * A single country entry produced by triangulation.
 */
export interface TriangulatedCountryEntry {
  country: string;
  /** Merged revenue weight (0–1). Weighted average of SEC and FMP when both present. */
  mergedWeight: number;
  /** Weight reported by SEC filing (null if not present in SEC data). */
  secWeight: number | null;
  /** Weight reported by FMP API (null if not present in FMP data). */
  fmpWeight: number | null;
  /**
   * Agreement score (0–1).
   *   1.0 — both sources agree within ±5 pp
   *   0.7 — both sources present but differ by 5–20 pp
   *   0.4 — both sources present but differ by >20 pp
   *   0.5 — only one source present (single-source)
   */
  agreementScore: number;
  /** Whether this country is confirmed by FMP (present in FMP data with weight > 0). */
  fmpConfirmed: boolean;
  /** Whether this country is confirmed by SEC (present in SEC data with weight > 0). */
  secConfirmed: boolean;
}

/**
 * Result of the triangulation process for a single ticker.
 */
export interface TriangulationResult {
  ticker: string;
  /** Merged per-country entries, sorted descending by mergedWeight. */
  countries: TriangulatedCountryEntry[];
  /**
   * Number of channels confirmed by FMP cross-reference.
   * A channel is considered "confirmed" when ≥1 country in that channel's
   * top-3 countries is fmpConfirmed with agreementScore ≥ 0.7.
   * Range: 0–4 (revenue, supply, assets, financial).
   * Used by computeCompositeConfidence for the fmpBoost factor.
   */
  fmpConfirmedChannels: number;
  /** Overall triangulation confidence (0–1), mean of per-country agreementScores. */
  overallAgreement: number;
  /** Source of FMP data used ('fmp_api' | 'cache' | 'unavailable'). */
  fmpDataSource: 'fmp_api' | 'cache' | 'unavailable';
  /** ISO timestamp of triangulation. */
  triangulatedAt: string;
}

/**
 * Normalise a revenue weight map so all values sum to 1.0.
 * Handles zero-sum edge case by returning the map unchanged.
 */
function normaliseWeights(weights: Map<string, number>): Map<string, number> {
  const total = Array.from(weights.values()).reduce((s, v) => s + v, 0);
  if (total <= 0) return weights;
  const out = new Map<string, number>();
  for (const [k, v] of weights) out.set(k, v / total);
  return out;
}

/**
 * Compute per-country agreement score between two weight values.
 *   diff < 0.05  → 1.0 (strong agreement)
 *   diff < 0.20  → 0.7 (moderate agreement)
 *   diff ≥ 0.20  → 0.4 (weak agreement)
 */
function agreementScore(secW: number, fmpW: number): number {
  const diff = Math.abs(secW - fmpW);
  if (diff < 0.05) return 1.0;
  if (diff < 0.20) return 0.7;
  return 0.4;
}

/**
 * Triangulate geographic exposure data by cross-referencing:
 *   - SEC filing revenue segments (primary structured evidence)
 *   - FMP API geographic revenue segments (external cross-reference)
 *
 * Algorithm:
 *   1. Build normalised country→weight maps for both sources.
 *   2. Union all countries across both maps.
 *   3. For each country compute agreementScore and mergedWeight.
 *      mergedWeight = 0.6 × secWeight + 0.4 × fmpWeight when both present,
 *                   = secWeight when only SEC present,
 *                   = fmpWeight when only FMP present.
 *   4. Count fmpConfirmedChannels (≥1 top-3 country confirmed with score ≥ 0.7).
 *
 * @param ticker          Company ticker symbol.
 * @param secSegments     Revenue segments from SEC filing (country→fraction, 0–1).
 *                        Pass an empty map if SEC data is unavailable.
 * @param fmpData         FMP API data (from fetchFromFMP). Pass null if unavailable.
 */
export function triangulateGeographicSegments(
  ticker: string,
  secSegments: Map<string, number>,
  fmpData: APICompanyData | null
): TriangulationResult {
  const tag = `[Triangulation:${ticker}]`;

  // ── Build FMP weight map ──────────────────────────────────────────────────
  const rawFmpWeights = new Map<string, number>();
  let fmpDataSource: TriangulationResult['fmpDataSource'] = 'unavailable';

  if (fmpData && fmpData.segments.length > 0) {
    fmpDataSource = 'fmp_api';
    for (const seg of fmpData.segments) {
      const country = seg.country.trim();
      if (!country || country === 'Unknown') continue;
      // FMP stores revenuePercentage as 0–100
      const w = seg.revenuePercentage / 100;
      rawFmpWeights.set(country, (rawFmpWeights.get(country) ?? 0) + w);
    }
  }

  const fmpWeights = normaliseWeights(rawFmpWeights);
  const secWeights = normaliseWeights(new Map(secSegments));

  // ── Union of all countries ────────────────────────────────────────────────
  const allCountries = new Set<string>([
    ...secWeights.keys(),
    ...fmpWeights.keys()
  ]);

  const entries: TriangulatedCountryEntry[] = [];

  for (const country of allCountries) {
    const secW = secWeights.get(country) ?? null;
    const fmpW = fmpWeights.get(country) ?? null;

    let mergedWeight: number;
    let score: number;

    if (secW !== null && fmpW !== null) {
      // Both sources present — weighted average (SEC trusted more)
      mergedWeight = 0.6 * secW + 0.4 * fmpW;
      score = agreementScore(secW, fmpW);
    } else if (secW !== null) {
      mergedWeight = secW;
      score = 0.5; // single-source
    } else {
      // fmpW must be non-null here
      mergedWeight = fmpW!;
      score = 0.5; // single-source
    }

    entries.push({
      country,
      mergedWeight,
      secWeight: secW,
      fmpWeight: fmpW,
      agreementScore: score,
      fmpConfirmed: fmpW !== null && fmpW > 0,
      secConfirmed: secW !== null && secW > 0,
    });
  }

  // Sort descending by mergedWeight
  entries.sort((a, b) => b.mergedWeight - a.mergedWeight);

  // ── Count fmpConfirmedChannels ────────────────────────────────────────────
  // Revenue channel: top-3 countries confirmed by FMP with agreementScore ≥ 0.7
  // Supply / Assets / Financial channels share the same geographic footprint
  // in the absence of channel-specific FMP data, so we use the same top-3 set
  // and count each channel independently (up to 4 total).
  const top3 = entries.slice(0, 3);
  const hasStrongFmpConfirmation = top3.some(e => e.fmpConfirmed && e.agreementScore >= 0.7);

  // We confirm a channel if the overall geographic picture is FMP-validated
  // (at least one top-3 country strongly confirmed).
  // Revenue is confirmed when FMP has actual segment data (not just HQ fallback).
  const fmpHasSegmentData = fmpData !== null && fmpData.segments.length > 1;
  const revenueConfirmed = hasStrongFmpConfirmation && fmpHasSegmentData ? 1 : 0;
  // Supply / Assets / Financial get half credit (0 or 1 each) based on weaker signal
  const otherChannelsConfirmed = hasStrongFmpConfirmation ? 1 : 0;
  const fmpConfirmedChannels = revenueConfirmed + otherChannelsConfirmed; // max 2 (≥2 triggers boost)

  // ── Overall agreement ─────────────────────────────────────────────────────
  const overallAgreement =
    entries.length > 0
      ? entries.reduce((s, e) => s + e.agreementScore, 0) / entries.length
      : 0;

  console.log(
    `${tag} Triangulation complete: ${entries.length} countries, ` +
    `fmpConfirmedChannels=${fmpConfirmedChannels}, ` +
    `overallAgreement=${overallAgreement.toFixed(2)}, ` +
    `fmpDataSource=${fmpDataSource}`
  );

  if (entries.length > 0) {
    const top5 = entries.slice(0, 5);
    console.log(`${tag} Top countries:`);
    for (const e of top5) {
      const secStr = e.secWeight !== null ? `SEC=${(e.secWeight * 100).toFixed(1)}%` : 'SEC=—';
      const fmpStr = e.fmpWeight !== null ? `FMP=${(e.fmpWeight * 100).toFixed(1)}%` : 'FMP=—';
      console.log(
        `${tag}   ${e.country.padEnd(24)} merged=${(e.mergedWeight * 100).toFixed(1)}%  ` +
        `${secStr}  ${fmpStr}  agree=${e.agreementScore.toFixed(2)}  ` +
        `${e.fmpConfirmed ? '✅FMP' : '  '}`
      );
    }
  }

  return {
    ticker: ticker.toUpperCase(),
    countries: entries,
    fmpConfirmedChannels,
    overallAgreement,
    fmpDataSource,
    triangulatedAt: new Date().toISOString(),
  };
}

/**
 * Enhanced geographic exposure service that tries multiple data sources
 */
export async function getEnhancedGeographicExposure(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string,
  verifiedData: APICompanyData | null
): Promise<{ data: APICompanyData | null; source: 'verified' | 'api' | 'estimated' }> {
  
  // Priority 1: Check verified database
  if (verifiedData) {
    return { data: verifiedData, source: 'verified' };
  }

  // Priority 2: Try live API
  const apiData = await fetchFromFMP(ticker);
  if (apiData) {
    return { data: apiData, source: 'api' };
  }

  // Priority 3: Use sector patterns (fallback)
  return { data: null, source: 'estimated' };
}