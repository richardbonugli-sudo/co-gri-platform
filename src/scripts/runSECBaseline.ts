/**
 * runSECBaseline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SEC Runtime Baseline Script for CO-GRI Platform
 *
 * Runs the live SEC pipeline for all SEC-eligible companies and captures
 * 6 outcome metrics per ticker to empirically validate pipeline quality.
 *
 * Usage:
 *   npx tsx src/scripts/runSECBaseline.ts                    # Full run (Cat A+B+C)
 *   npx tsx src/scripts/runSECBaseline.ts --phase=1          # Cat A only (pilot, 41 companies)
 *   npx tsx src/scripts/runSECBaseline.ts --phase=2          # Cat A+B (55 companies)
 *   npx tsx src/scripts/runSECBaseline.ts --phase=3          # Cat A+B+C (all SEC-eligible)
 *   npx tsx src/scripts/runSECBaseline.ts --ticker=AAPL      # Single ticker test
 *   npx tsx src/scripts/runSECBaseline.ts --dry-run          # List tickers only, no API calls
 *   npx tsx src/scripts/runSECBaseline.ts --concurrency=5    # Set concurrent workers (default: 3)
 *   npx tsx src/scripts/runSECBaseline.ts --resume           # Resume from checkpoint
 *   npx tsx src/scripts/runSECBaseline.ts --verbose          # Verbose logging
 *
 * Environment:
 *   VITE_SUPABASE_URL       Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  Supabase anon key
 *
 * Outputs:
 *   /tmp/sec_baseline_checkpoint.jsonl          Checkpoint file (one result per line)
 *   docs/sec_baseline_results.json              Full results array
 *   docs/sec_baseline_summary.md                Human-readable summary report
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

// ─── Path Setup ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const CHECKPOINT_FILE = '/tmp/sec_baseline_checkpoint.jsonl';
const RESULTS_FILE = path.join(DOCS_DIR, 'sec_baseline_results.json');
const SUMMARY_FILE = path.join(DOCS_DIR, 'sec_baseline_summary.md');

// ─── CLI Flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const IS_VERBOSE = args.includes('--verbose');
const IS_RESUME = args.includes('--resume');

const phaseArg = args.find(a => a.startsWith('--phase='));
const PHASE: string = phaseArg ? phaseArg.split('=')[1] : 'full';

const tickerArg = args.find(a => a.startsWith('--ticker='));
const SINGLE_TICKER: string | null = tickerArg ? tickerArg.split('=')[1].toUpperCase() : null;

const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const CONCURRENCY: number = concurrencyArg ? Math.min(10, Math.max(1, parseInt(concurrencyArg.split('=')[1], 10))) : 3;

// ─── Environment ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// ─── CIK Map (sourced from secFilingParser.ts TICKER_TO_CIK_MAP) ─────────────

const TICKER_TO_CIK_MAP: Record<string, string> = {
  // United States — Core Large-Caps
  'AAPL':    '0000320193',
  'MSFT':    '0000789019',
  'GOOGL':   '0001652044',
  'GOOG':    '0001652044',
  'AMZN':    '0001018724',
  'TSLA':    '0001318605',
  'META':    '0001326801',
  'NVDA':    '0001045810',
  'BRK.A':   '0001067983',
  'BRK.B':   '0001067983',
  'JPM':     '0000019617',
  'JNJ':     '0000200406',
  'V':       '0001403161',
  'WMT':     '0000104169',
  'PG':      '0000080424',
  'MA':      '0001141391',
  'UNH':     '0000731766',
  'HD':      '0000354950',
  'DIS':     '0001744489',
  'BAC':     '0000070858',
  'ADBE':    '0000796343',
  'CRM':     '0001108524',
  'NFLX':    '0001065280',
  'CMCSA':   '0001166691',
  'XOM':     '0000034088',
  'PFE':     '0000078003',
  'CSCO':    '0000858877',
  'INTC':    '0000050863',
  'VZ':      '0000732712',
  'KO':      '0000021344',
  'PEP':     '0000077476',
  'MRK':     '0000310158',
  'ABT':     '0000001800',
  'NKE':     '0000320187',
  'ORCL':    '0001341439',
  'AMD':     '0000002488',
  'QCOM':    '0000804328',
  'IBM':     '0000051143',
  'BA':      '0000012927',
  'GE':      '0000040545',
  // United States — Additional Large-Caps
  'ABBV':    '0001551152',
  'AXP':     '0000004962',
  'BLK':     '0001364742',
  'C':       '0000831001',
  'COP':     '0001163165',
  'CVX':     '0000093410',
  'DHR':     '0000313616',
  'GS':      '0000886982',
  'LLY':     '0000059478',
  'MS':      '0000895421',
  'SBUX':    '0000829224',
  'SLB':     '0000087347',
  'TMO':     '0000097476',
  'WFC':     '0000072971',
  // ADRs — China
  'BABA':    '0001577552',
  'PDD':     '0001737806',
  'JD':      '0001549802',
  'BIDU':    '0001329099',
  'NIO':     '0001736541',
  'LI':      '0001791706',
  'XPEV':    '0001840063',
  'NTES':    '0001110646',
  'BILI':    '0001723690',
  'YUMC':    '0001673358',
  // ADRs — Taiwan
  'TSM':     '0001046179',
  'ASX':     '0001122411',
  'CHT':     '0001132924',
  // ADRs — South Korea
  'KB':      '0001445930',
  'SHG':     '0001263043',
  'PKX':     '0000889132',
  'LPL':     '0001290109',
  'KEP':     '0000887225',
  // ADRs — Japan
  'TM':      '0001094517',
  'SONY':    '0000313838',
  'MUFG':    '0000067088',
  'SMFG':    '0001022837',
  'NMR':     '0001163653',
  'MFG':     '0001335730',
  'HMC':     '0000715153',
  'SIFY':    '0001094324',
  // ADRs — India
  'INFY':    '0001067491',
  'WIT':     '0001123799',
  'HDB':     '0001144967',
  'IBN':     '0001103838',
  'REDY':    '0001135971',
  // ADRs — Brazil
  'PBR':     '0001119639',
  'VALE':    '0000917851',
  'ITUB':    '0001132597',
  'BBD':     '0001160330',
  'ABEV':    '0001565025',
  'SBS':     '0001170858',
  'TIMB':    '0001826168',
  'GGB':     '0001073404',
  'LTM':     '0001047716',
  // ADRs — United Kingdom
  'BP':      '0000313807',
  'SHEL':    '0001306965',
  'HSBC':    '0001089113',
  'AZN':     '0000901832',
  'GSK':     '0001131399',
  'DEO':     '0000835403',
  'UL':      '0000217410',
  'BCS':     '0000312069',
  'RIO':     '0000863064',
  'BTI':     '0001303523',
  // ADRs — France
  'SNY':     '0001121404',
  'TTE':     '0000879764',
  // ADRs — Germany
  'SAP':     '0001000184',
  'DTEGY':   '0000946770',
  // ADRs — Netherlands
  'ASML':    '0000937966',
  'ING':     '0001039765',
  'PHG':     '0000313216',
  'STLA':    '0001605484',
  // ADRs — Switzerland / Denmark
  'NVO':     '0000353278',
  'NVS':     '0001114448',
  'UBS':     '0001610520',
  // ADRs — Australia
  'BHP':     '0000811809',
  // ADRs — Israel
  'TEVA':    '0000818686',
  'CHKP':    '0001015922',
  'NICE':    '0001003935',
  'WIX':     '0001576789',
  'MNDY':    '0001845338',
  // ADRs — Mexico
  'AMX':     '0001129137',
  'FMX':     '0001061736',
  'TV':      '0000912892',
  'CX':      '0001076378',
  // ADRs — Argentina
  'YPF':     '0000904851',
  'CRESY':   '0001034957',
  'IRS':     '0000933267',
  'BMA':     '0001347426',
  'GGAL':    '0001114700',
  'SUPV':    '0001517399',
  'TEO':     '0000932470',
  'TX':      '0001342874',
  'PAM':     '0001469395',
  'LOMA':    '0001711375',
  // ADRs — Chile
  'SQM':     '0000909037',
  // ADRs — Colombia
  'CIB':     '0002058897',
  // ADRs — Spain
  'SAN':     '0000891478',
  // ADRs — South Africa
  'GOLD':    '0001591588',
  'GFI':     '0001172724',
  'SBSW':    '0001786909',
  'HMY':     '0001023514',
  'AU':      '0001973832',
  // ADRs — Miscellaneous
  'ABBNY':   '0001091587',
};

// ─── SEC-Eligible Universe ────────────────────────────────────────────────────
// Category A: Companies with hardcoded CIKs — guaranteed to enter SEC path
// Derived from TICKER_TO_CIK_MAP intersected with companyDatabase.ts

const CAT_A_TICKERS: string[] = [
  // US Large-Caps (10-K filers)
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B',
  'JPM', 'JNJ', 'V', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'DIS', 'BAC',
  'ADBE', 'CRM', 'NFLX', 'XOM', 'PFE', 'CSCO', 'INTC', 'VZ', 'KO',
  'PEP', 'MRK', 'ABT', 'NKE', 'ORCL', 'AMD', 'IBM',
  // US Additional Large-Caps (10-K filers) — also hardcoded
  'ABBV', 'AXP', 'BLK', 'C', 'COP', 'CVX', 'DHR', 'GS', 'LLY',
  'MS', 'SBUX', 'SLB', 'TMO', 'WFC',
  // ADRs with hardcoded CIKs (20-F filers)
  'BABA', 'PDD', 'JD', 'BIDU', 'NIO', 'LI', 'XPEV', 'NTES', 'BILI', 'YUMC',
  'TSM', 'ASX', 'CHT',
  'KB', 'SHG', 'PKX', 'LPL', 'KEP',
  'TM', 'SONY', 'MUFG', 'SMFG', 'NMR', 'MFG', 'HMC', 'SIFY',
  'INFY', 'WIT', 'HDB', 'IBN', 'REDY',
  'PBR', 'VALE', 'ITUB', 'BBD', 'ABEV', 'SBS', 'TIMB', 'GGB', 'LTM',
  'BP', 'SHEL', 'HSBC', 'AZN', 'GSK', 'DEO', 'UL', 'BCS', 'RIO', 'BTI',
  'SNY', 'TTE',
  'SAP', 'DTEGY',
  'ASML', 'ING', 'PHG', 'STLA',
  'NVO', 'NVS', 'UBS',
  'BHP',
  'TEVA', 'CHKP', 'NICE', 'WIX', 'MNDY',
  'AMX', 'FMX', 'TV', 'CX',
  'YPF', 'CRESY', 'IRS', 'BMA', 'GGAL', 'SUPV', 'TEO', 'TX', 'PAM', 'LOMA',
  'SQM', 'CIB', 'SAN',
  'GOLD', 'GFI', 'SBSW', 'HMY', 'AU',
  'ABBNY',
];

// Category B: US-listed NYSE/NASDAQ companies NOT in CIK map — attempt EDGAR search
const CAT_B_TICKERS: string[] = [
  'CMCSA', 'BA', 'GE', 'QCOM',  // in CIK map but not in companyDatabase as standalone
  // Additional US companies in companyDatabase.ts without hardcoded CIK
  'MCD', 'WNS', 'VEDL', 'TTM', 'INDY',
  'BRFS', 'CBD',
  'UMC', 'AUO',
  'NTDOY', 'SNE', 'FUJIY',
  'BNP', 'LVMUY', 'AXAHY', 'OREDY', 'DANOY', 'AIQUY', 'SAFRY',
  'SIEGY', 'BAYRY', 'DAIMAY', 'BMWYY', 'VLKAF', 'BASFY', 'ADDYY', 'ALIZY',
  'HEIA',
  'RHHBY', 'NSRGY', 'CS', 'ZURN',
  'WBK', 'NAB', 'ANZ',
  'ENIA', 'CHL', 'GFNORTEO',
];

// Category C: Additional ADRs not in CIK map that may file 20-F
const CAT_C_TICKERS: string[] = [
  // Any remaining ADR tickers from companyDatabase.ts not covered above
  'VEDL', 'TTM', 'WNS',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED' | 'FALLBACK' | 'NOT_RUN';
type Category = 'A' | 'B' | 'C' | 'D';

interface BaselineResult {
  ticker: string;
  companyName: string;
  exchange: string;
  category: Category;
  isADR: boolean;

  // Step 1: CIK Resolution
  enteredSECPath: boolean;
  cikSource: 'hardcoded' | 'edgar_search' | 'not_found';
  cik: string | null;
  cikResolutionMs: number;

  // Step 2: Filing Retrieval
  retrievalSucceeded: boolean;
  filingType: '10-K' | '20-F' | '40-F' | null;
  filingDate: string | null;
  htmlSizeBytes: number | null;
  retrievalMs: number;
  retrievalError: string | null;

  // Step 3: Structured Parsing
  structuredParsingSucceeded: boolean;
  tablesFound: number;
  revenueTableFound: boolean;
  ppeTableFound: boolean;
  debtTableFound: boolean;
  exhibit21Found: boolean;
  structuredParsingMs: number;

  // Step 4: Narrative Parsing
  narrativeParsingSucceeded: boolean;
  narrativeCountriesFound: number;
  narrativeParsingMs: number;

  // Step 5: Channel Evidence Tiers
  channelTiers: {
    revenue: EvidenceTier;
    supply: EvidenceTier;
    assets: EvidenceTier;
    financial: EvidenceTier;
  };

  // Step 6: Overall Assessment
  materiallySpecific: boolean;
  specificChannelCount: number;
  dominantEvidenceTier: EvidenceTier;

  // Composite Confidence (P3-C)
  compositeConfidenceScore: number;
  confidenceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recencyMultiplier: number;

  // Metadata
  totalPipelineMs: number;
  errorMessage: string | null;
  timestamp: string;
}

interface RunSummary {
  runId: string;
  phase: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  totalCompanies: number;
  completedCompanies: number;
  failedCompanies: number;
  skippedCompanies: number;
  results: BaselineResult[];
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function verbose(msg: string): void {
  if (IS_VERBOSE) console.log(`  [VERBOSE] ${msg}`);
}

function warn(msg: string): void {
  console.warn(`  [WARN] ${msg}`);
}

// ─── HTTP Utility ─────────────────────────────────────────────────────────────

function httpsGet<T>(url: string, headers?: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: headers || {} }, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${url}`));
            return;
          }
          resolve(JSON.parse(data) as T);
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${String(e)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Exponential Backoff Retry Utility ───────────────────────────────────────

/**
 * Retries an async function with exponential backoff on transient errors.
 *
 * Only retries on errors whose message contains '429', '503', or 'Timeout'.
 * Delay formula: baseDelayMs * 2^attempt * (1 + jitter) where jitter is ±20%.
 *
 * @param fn          - Async function to call
 * @param maxRetries  - Maximum number of retry attempts (default: 4)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param label       - Human-readable label for log messages (default: 'request')
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 4,
  baseDelayMs = 1000,
  label = 'request'
): Promise<T> {
  const RETRYABLE = ['429', '503', 'Timeout'];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String(err);
      const isRetryable = RETRYABLE.some(code => msg.includes(code));

      if (!isRetryable) {
        // Non-retryable error — propagate immediately
        throw err;
      }

      if (attempt === maxRetries) {
        warn(`${label} failed after ${maxRetries} retries: ${msg}`);
        throw err;
      }

      // Exponential backoff with ±20% jitter
      const jitter = 1 + (Math.random() * 0.4 - 0.2); // range [0.8, 1.2]
      const delayMs = Math.round(baseDelayMs * Math.pow(2, attempt) * jitter);
      warn(`${label} retryable error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms: ${msg}`);
      await sleep(delayMs);
    }
  }

  // TypeScript requires a return here; unreachable in practice
  throw new Error(`${label}: retryWithBackoff exhausted`);
}

// ─── Supabase Edge Function Caller ───────────────────────────────────────────

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Edge function ${functionName} returned HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            return;
          }
          resolve(JSON.parse(data) as T);
        } catch (e) {
          reject(new Error(`JSON parse error from ${functionName}: ${String(e)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error(`Timeout calling ${functionName}`)); });
    req.write(payload);
    req.end();
  });
}

// ─── Step 1: CIK Resolution ───────────────────────────────────────────────────

async function resolveCIK(ticker: string): Promise<{
  cik: string | null;
  source: 'hardcoded' | 'edgar_search' | 'not_found';
  durationMs: number;
}> {
  const start = Date.now();
  const upper = ticker.toUpperCase();

  // Check hardcoded map first
  if (TICKER_TO_CIK_MAP[upper]) {
    return { cik: TICKER_TO_CIK_MAP[upper], source: 'hardcoded', durationMs: Date.now() - start };
  }

  // Try base ticker for suffixed tickers (e.g., BRK.B → BRK)
  const baseTicker = upper.split('.')[0];
  if (TICKER_TO_CIK_MAP[baseTicker]) {
    return { cik: TICKER_TO_CIK_MAP[baseTicker], source: 'hardcoded', durationMs: Date.now() - start };
  }

  // Attempt EDGAR search via Supabase Edge Function
  if (!IS_DRY_RUN && SUPABASE_URL) {
    try {
      verbose(`  Calling fetch_sec_cik for ${ticker}...`);
      const result = await retryWithBackoff(
        () => callEdgeFunction<{ cik?: string; error?: string }>('fetch_sec_cik', { ticker }),
        4, 1000, `fetch_sec_cik(${ticker})`
      );
      if (result.cik) {
        return { cik: result.cik, source: 'edgar_search', durationMs: Date.now() - start };
      }
    } catch (e) {
      verbose(`  CIK search failed for ${ticker}: ${String(e)}`);
    }
  }

  return { cik: null, source: 'not_found', durationMs: Date.now() - start };
}

// ─── Step 2: Filing Retrieval ─────────────────────────────────────────────────

interface FilingResult {
  succeeded: boolean;
  filingType: '10-K' | '20-F' | '40-F' | null;
  filingDate: string | null;
  htmlSizeBytes: number | null;
  html: string | null;
  error: string | null;
  durationMs: number;
}

async function fetchFiling(cik: string, isADR: boolean): Promise<FilingResult> {
  const start = Date.now();

  // Determine filing type to try: ADRs file 20-F, US domestics file 10-K
  const primaryFormType = isADR ? '20-F' : '10-K';
  const fallbackFormType = isADR ? '10-K' : '20-F';

  for (const formType of [primaryFormType, fallbackFormType]) {
    try {
      verbose(`  Fetching ${formType} for CIK ${cik}...`);
      const result = await retryWithBackoff(
        () => callEdgeFunction<{
          html?: string;
          htmlLength?: number;
          filingDate?: string;
          reportDate?: string;
          formType?: string;
          error?: string;
        }>('fetch_sec_filing', { cik, formType }),
        4, 1000, `fetch_sec_filing(${cik}, ${formType})`
      );

      if (result.html && result.htmlLength && result.htmlLength > 1000) {
        return {
          succeeded: true,
          filingType: (result.formType || formType) as '10-K' | '20-F' | '40-F',
          filingDate: result.filingDate || result.reportDate || null,
          htmlSizeBytes: result.htmlLength,
          html: result.html,
          error: null,
          durationMs: Date.now() - start,
        };
      }
    } catch (e) {
      verbose(`  ${formType} fetch failed: ${String(e)}`);
    }
    // Small delay between form type attempts
    await sleep(500);
  }

  return {
    succeeded: false,
    filingType: null,
    filingDate: null,
    htmlSizeBytes: null,
    html: null,
    error: 'No filing found for 10-K or 20-F',
    durationMs: Date.now() - start,
  };
}

// ─── Step 3: Structured Parsing ───────────────────────────────────────────────

interface StructuredParsingResult {
  succeeded: boolean;
  tablesFound: number;
  revenueTableFound: boolean;
  ppeTableFound: boolean;
  debtTableFound: boolean;
  exhibit21Found: boolean;
  durationMs: number;
}

function parseStructuredData(html: string): StructuredParsingResult {
  const start = Date.now();

  // Revenue table keywords (from secFilingParser.ts isRevenueTable logic)
  const revenueKeywords = [
    'geographic', 'geography', 'region', 'segment', 'revenue by',
    'net revenue', 'net sales', 'americas', 'emea', 'apac', 'asia pacific',
    'united states', 'international', 'domestic', 'foreign',
  ];
  const revenueExclusions = [
    'cost of sales', 'cost of revenue', 'selling and marketing',
    'research and development', 'operating expenses',
  ];

  // PP&E table keywords
  const ppeKeywords = [
    'property', 'plant', 'equipment', 'long-lived assets', 'fixed assets',
    'capital expenditure', 'ppe',
  ];

  // Debt table keywords
  const debtKeywords = [
    'debt', 'borrowing', 'credit facility', 'notes payable', 'long-term debt',
    'short-term debt', 'senior notes', 'debentures',
  ];

  // Count tables in HTML (rough approximation without full cheerio)
  const tableMatches = html.match(/<table[^>]*>/gi) || [];
  const tablesFound = tableMatches.length;

  // Check for revenue tables
  const htmlLower = html.toLowerCase();
  const revenueTableFound = revenueKeywords.some(kw => htmlLower.includes(kw)) && !revenueExclusions.every(ex => htmlLower.includes(ex));

  // Check for PP&E tables
  const ppeTableFound = ppeKeywords.some(kw => htmlLower.includes(kw));

  // Check for debt tables
  const debtTableFound = debtKeywords.some(kw => htmlLower.includes(kw));

  // Check for Exhibit 21 (subsidiaries list — strong geographic signal)
  const exhibit21Found = htmlLower.includes('exhibit 21') ||
    htmlLower.includes('subsidiaries of the registrant') ||
    htmlLower.includes('list of subsidiaries');

  const succeeded = revenueTableFound || ppeTableFound || debtTableFound;

  return {
    succeeded,
    tablesFound,
    revenueTableFound,
    ppeTableFound,
    debtTableFound,
    exhibit21Found,
    durationMs: Date.now() - start,
  };
}

// ─── Step 4: Narrative Parsing ────────────────────────────────────────────────

interface NarrativeParsingResult {
  succeeded: boolean;
  countriesFound: number;
  durationMs: number;
}

async function parseNarrative(html: string, ticker: string): Promise<NarrativeParsingResult> {
  const start = Date.now();

  // Extract text content for narrative analysis (first 15,000 chars to stay within token limits)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000);

  if (textContent.length < 500) {
    return { succeeded: false, countriesFound: 0, durationMs: Date.now() - start };
  }

  try {
    verbose(`  Calling extract_geographic_narrative for ${ticker}...`);
    const result = await retryWithBackoff(
      () => callEdgeFunction<{
        extractions?: Array<{ country?: string; region?: string; confidence?: string }>;
        error?: string;
      }>('extract_geographic_narrative', {
        text: textContent,
        sectionName: 'Annual Report',
        ticker,
      }),
      4, 1000, `extract_geographic_narrative(${ticker})`
    );

    if (result.extractions && result.extractions.length > 0) {
      // Count unique countries/regions with at least medium confidence
      const qualifiedExtractions = result.extractions.filter(
        e => e.confidence === 'high' || e.confidence === 'medium'
      );
      const uniqueLocations = new Set(
        qualifiedExtractions.map(e => e.country || e.region || '').filter(Boolean)
      );
      return {
        succeeded: uniqueLocations.size > 0,
        countriesFound: uniqueLocations.size,
        durationMs: Date.now() - start,
      };
    }
  } catch (e) {
    verbose(`  Narrative parsing failed for ${ticker}: ${String(e)}`);
  }

  return { succeeded: false, countriesFound: 0, durationMs: Date.now() - start };
}

// ─── Step 5: Determine Channel Evidence Tiers ─────────────────────────────────

function determineChannelTiers(
  structured: StructuredParsingResult,
  narrative: NarrativeParsingResult,
  filingSucceeded: boolean
): BaselineResult['channelTiers'] {
  if (!filingSucceeded) {
    return { revenue: 'FALLBACK', supply: 'FALLBACK', assets: 'FALLBACK', financial: 'FALLBACK' };
  }

  // Revenue tier: best evidence from structured geographic tables
  let revenue: EvidenceTier = 'FALLBACK';
  if (structured.revenueTableFound) {
    revenue = 'DIRECT';
  } else if (narrative.countriesFound >= 3) {
    revenue = 'ALLOCATED';
  } else if (narrative.countriesFound >= 1) {
    revenue = 'MODELED';
  }

  // Supply tier: typically from Exhibit 21 or narrative mentions
  let supply: EvidenceTier = 'FALLBACK';
  if (structured.exhibit21Found) {
    supply = 'ALLOCATED';
  } else if (narrative.countriesFound >= 2) {
    supply = 'MODELED';
  }

  // Assets tier: from PP&E tables
  let assets: EvidenceTier = 'FALLBACK';
  if (structured.ppeTableFound) {
    assets = 'DIRECT';
  } else if (structured.revenueTableFound) {
    assets = 'ALLOCATED';
  } else if (narrative.countriesFound >= 1) {
    assets = 'MODELED';
  }

  // Financial tier: from debt tables or narrative
  let financial: EvidenceTier = 'FALLBACK';
  if (structured.debtTableFound) {
    financial = 'ALLOCATED';
  } else if (narrative.countriesFound >= 2) {
    financial = 'MODELED';
  }

  return { revenue, supply, assets, financial };
}

// ─── Step 6: Overall Assessment ───────────────────────────────────────────────

function assessMaterialSpecificity(tiers: BaselineResult['channelTiers']): {
  materiallySpecific: boolean;
  specificChannelCount: number;
  dominantEvidenceTier: EvidenceTier;
} {
  const tierValues = Object.values(tiers) as EvidenceTier[];
  const specificCount = tierValues.filter(t => t === 'DIRECT' || t === 'ALLOCATED').length;
  const materiallySpecific = specificCount >= 2 || tiers.revenue === 'DIRECT';

  // Determine dominant tier (most common)
  const tierCounts: Record<EvidenceTier, number> = {
    DIRECT: 0, ALLOCATED: 0, MODELED: 0, FALLBACK: 0, NOT_RUN: 0,
  };
  for (const t of tierValues) tierCounts[t]++;

  const dominant = (Object.entries(tierCounts) as [EvidenceTier, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return { materiallySpecific, specificChannelCount: specificCount, dominantEvidenceTier: dominant };
}

// ─── Filing Recency Multiplier (inlined from structuredDataIntegrator to avoid circular dep) ──

/**
 * Returns a recency multiplier (0.0–1.0) based on how old the SEC filing is.
 *  < 12 months  → 1.00 (current)
 *  12–24 months → 0.85 (1 year stale)
 *  24–36 months → 0.70 (2 years stale)
 *  > 36 months  → 0.50 (significantly stale)
 */
function filingRecencyMultiplier(filingDateISO: string | null): number {
  if (!filingDateISO) return 0.70;
  const filingMs = new Date(filingDateISO).getTime();
  if (isNaN(filingMs)) return 0.70;
  const ageMonths = (Date.now() - filingMs) / (1000 * 60 * 60 * 24 * 30.44);
  if (ageMonths < 12) return 1.00;
  if (ageMonths < 24) return 0.85;
  if (ageMonths < 36) return 0.70;
  return 0.50;
}

// ─── Composite Confidence Score (P3-C) ───────────────────────────────────────

type ConfidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Computes a per-company composite confidence score (0–100) and letter grade.
 *
 * Weights: revenue 40%, supply 25%, assets 20%, financial 15%.
 * Tier scores: DIRECT=100, ALLOCATED=75, MODELED=50, FALLBACK=20, NOT_RUN=0.
 * The raw weighted score is multiplied by the filing recency multiplier,
 * then boosted by up to 10% if ≥2 FMP-confirmed channels are present.
 *
 * Grade thresholds: A ≥ 85 | B ≥ 70 | C ≥ 50 | D ≥ 30 | F < 30
 */
function computeCompositeConfidence(
  tiers: BaselineResult['channelTiers'],
  recencyMultiplier: number,
  fmpConfirmedChannels: number = 0
): { score: number; grade: ConfidenceGrade } {
  const tierScore: Record<EvidenceTier, number> = {
    DIRECT: 100, ALLOCATED: 75, MODELED: 50, FALLBACK: 20, NOT_RUN: 0,
  };
  const weights = { revenue: 0.40, supply: 0.25, assets: 0.20, financial: 0.15 };

  const channelScore =
    tierScore[tiers.revenue]   * weights.revenue   +
    tierScore[tiers.supply]    * weights.supply     +
    tierScore[tiers.assets]    * weights.assets     +
    tierScore[tiers.financial] * weights.financial;

  const fmpBoost = fmpConfirmedChannels >= 2 ? 1.10 : 1.00;
  const raw = Math.round(channelScore * recencyMultiplier * fmpBoost);
  const score = Math.min(100, Math.max(0, raw));

  const grade: ConfidenceGrade =
    score >= 85 ? 'A' :
    score >= 70 ? 'B' :
    score >= 50 ? 'C' :
    score >= 30 ? 'D' : 'F';

  return { score, grade };
}

// ─── Company Metadata Lookup ──────────────────────────────────────────────────

interface CompanyMeta {
  name: string;
  exchange: string;
  isADR: boolean;
  category: Category;
}

function getCompanyMeta(ticker: string): CompanyMeta {
  // Determine category
  const upper = ticker.toUpperCase();
  let category: Category = 'D';
  if (CAT_A_TICKERS.includes(upper)) category = 'A';
  else if (CAT_B_TICKERS.includes(upper)) category = 'B';
  else if (CAT_C_TICKERS.includes(upper)) category = 'C';

  // Determine if ADR (has hardcoded CIK and is in ADR section, or exchange is OTC/NYSE with foreign origin)
  const adrTickers = new Set([
    'BABA','PDD','JD','BIDU','NIO','LI','XPEV','NTES','BILI','YUMC',
    'TSM','ASX','CHT','KB','SHG','PKX','LPL','KEP',
    'TM','SONY','MUFG','SMFG','NMR','MFG','HMC','SIFY','NTDOY','SNE','FUJIY',
    'INFY','WIT','HDB','IBN','REDY','VEDL','TTM','WNS','INDY',
    'PBR','VALE','ITUB','BBD','ABEV','SBS','TIMB','GGB','LTM','BRFS','CBD',
    'BP','SHEL','HSBC','AZN','GSK','DEO','UL','BCS','RIO','BTI',
    'SNY','TTE','BNP','LVMUY','AXAHY','OREDY','DANOY','AIQUY','SAFRY',
    'SAP','SIEGY','BAYRY','DAIMAY','BMWYY','VLKAF','BASFY','ADDYY','DTEGY','ALIZY',
    'ASML','ING','PHG','STLA','HEIA',
    'NVO','NVS','UBS','RHHBY','NSRGY','CS','ZURN','ABBNY',
    'BHP','WBK','NAB','ANZ',
    'TEVA','CHKP','NICE','WIX','MNDY',
    'AMX','FMX','TV','CX','GFNORTEO',
    'YPF','CRESY','IRS','BMA','GGAL','SUPV','TEO','TX','PAM','LOMA',
    'SQM','LTM','ENIA','CHL','CIB','SAN',
    'GOLD','AU','GFI','SBSW','HMY',
  ]);

  const isADR = adrTickers.has(upper);

  // Exchange lookup (simplified)
  const exchangeMap: Record<string, string> = {
    'AAPL':'NASDAQ','MSFT':'NASDAQ','GOOGL':'NASDAQ','AMZN':'NASDAQ','TSLA':'NASDAQ',
    'META':'NASDAQ','NVDA':'NASDAQ','ADBE':'NASDAQ','NFLX':'NASDAQ','CSCO':'NASDAQ',
    'INTC':'NASDAQ','AMD':'NASDAQ','PEP':'NASDAQ','KO':'NYSE','WMT':'NYSE',
    'JPM':'NYSE','BAC':'NYSE','WFC':'NYSE','GS':'NYSE','MS':'NYSE','C':'NYSE',
    'V':'NYSE','MA':'NYSE','AXP':'NYSE','BLK':'NYSE','JNJ':'NYSE','UNH':'NYSE',
    'PFE':'NYSE','ABBV':'NYSE','TMO':'NYSE','ABT':'NYSE','DHR':'NYSE','MRK':'NYSE',
    'LLY':'NYSE','XOM':'NYSE','CVX':'NYSE','COP':'NYSE','SLB':'NYSE',
    'HD':'NYSE','MCD':'NYSE','NKE':'NYSE','DIS':'NYSE','PG':'NYSE',
    'CRM':'NYSE','ORCL':'NYSE','IBM':'NYSE','VZ':'NYSE',
    'SBUX':'NASDAQ','ABBV':'NYSE','AXP':'NYSE','BLK':'NYSE','GS':'NYSE',
    'BABA':'NYSE','NIO':'NYSE','XPEV':'NYSE','TSM':'NYSE','TM':'NYSE',
    'SONY':'NYSE','MUFG':'NYSE','BP':'NYSE','SHEL':'NYSE','HSBC':'NYSE',
    'AZN':'NASDAQ','GSK':'NYSE','ASML':'NASDAQ','SAP':'NYSE',
    'TEVA':'NYSE','CHKP':'NASDAQ','NICE':'NASDAQ','WIX':'NASDAQ','MNDY':'NASDAQ',
  };

  return {
    name: ticker, // Will be enriched in future versions
    exchange: exchangeMap[upper] || (isADR ? 'NYSE' : 'NASDAQ'),
    isADR,
    category,
  };
}

// ─── Per-Company Pipeline ─────────────────────────────────────────────────────

async function processCompany(
  ticker: string,
  index: number,
  total: number
): Promise<BaselineResult> {
  const pipelineStart = Date.now();
  const meta = getCompanyMeta(ticker);
  const prefix = `[${String(index + 1).padStart(3, ' ')}/${total}] ${ticker.padEnd(8, ' ')}`;

  const result: BaselineResult = {
    ticker,
    companyName: meta.name,
    exchange: meta.exchange,
    category: meta.category,
    isADR: meta.isADR,
    enteredSECPath: false,
    cikSource: 'not_found',
    cik: null,
    cikResolutionMs: 0,
    retrievalSucceeded: false,
    filingType: null,
    filingDate: null,
    htmlSizeBytes: null,
    retrievalMs: 0,
    retrievalError: null,
    structuredParsingSucceeded: false,
    tablesFound: 0,
    revenueTableFound: false,
    ppeTableFound: false,
    debtTableFound: false,
    exhibit21Found: false,
    structuredParsingMs: 0,
    narrativeParsingSucceeded: false,
    narrativeCountriesFound: 0,
    narrativeParsingMs: 0,
    channelTiers: { revenue: 'NOT_RUN', supply: 'NOT_RUN', assets: 'NOT_RUN', financial: 'NOT_RUN' },
    materiallySpecific: false,
    specificChannelCount: 0,
    dominantEvidenceTier: 'FALLBACK',
    compositeConfidenceScore: 0,
    confidenceGrade: 'F',
    recencyMultiplier: 0.70,
    totalPipelineMs: 0,
    errorMessage: null,
    timestamp: new Date().toISOString(),
  };

  try {
    // ── Step 1: CIK Resolution ──────────────────────────────────────────────
    const cikResult = await resolveCIK(ticker);
    result.cik = cikResult.cik;
    result.cikSource = cikResult.source;
    result.cikResolutionMs = cikResult.durationMs;
    result.enteredSECPath = cikResult.cik !== null;

    const cikIcon = result.enteredSECPath ? '✅' : '❌';
    const cikLabel = result.enteredSECPath
      ? `SEC path (${cikResult.source})`
      : 'No CIK found';

    if (!result.enteredSECPath) {
      process.stdout.write(`${prefix} ${cikIcon} ${cikLabel} | ⏭  Skipping (no SEC path)\n`);
      result.channelTiers = { revenue: 'FALLBACK', supply: 'FALLBACK', assets: 'FALLBACK', financial: 'FALLBACK' };
      result.dominantEvidenceTier = 'FALLBACK';
      result.totalPipelineMs = Date.now() - pipelineStart;
      return result;
    }

    if (IS_DRY_RUN) {
      process.stdout.write(`${prefix} ${cikIcon} ${cikLabel} | [DRY RUN - no API calls]\n`);
      result.totalPipelineMs = Date.now() - pipelineStart;
      return result;
    }

    // Rate limit: 1 second between EDGAR requests
    await sleep(1000);

    // ── Step 2: Filing Retrieval ────────────────────────────────────────────
    const filing = await fetchFiling(result.cik!, meta.isADR);
    result.retrievalSucceeded = filing.succeeded;
    result.filingType = filing.filingType;
    result.filingDate = filing.filingDate;
    result.htmlSizeBytes = filing.htmlSizeBytes;
    result.retrievalMs = filing.durationMs;
    result.retrievalError = filing.error;

    const retIcon = filing.succeeded ? '✅' : '❌';
    const retLabel = filing.succeeded
      ? `Retrieved (${filing.filingType}, ${((filing.htmlSizeBytes || 0) / 1024 / 1024).toFixed(1)}MB)`
      : `Retrieval failed: ${filing.error}`;

    if (!filing.succeeded || !filing.html) {
      process.stdout.write(`${prefix} ✅ ${cikLabel} | ${retIcon} ${retLabel}\n`);
      result.channelTiers = { revenue: 'FALLBACK', supply: 'FALLBACK', assets: 'FALLBACK', financial: 'FALLBACK' };
      result.dominantEvidenceTier = 'FALLBACK';
      result.totalPipelineMs = Date.now() - pipelineStart;
      return result;
    }

    // ── Step 3: Structured Parsing ──────────────────────────────────────────
    const structured = parseStructuredData(filing.html);
    result.structuredParsingSucceeded = structured.succeeded;
    result.tablesFound = structured.tablesFound;
    result.revenueTableFound = structured.revenueTableFound;
    result.ppeTableFound = structured.ppeTableFound;
    result.debtTableFound = structured.debtTableFound;
    result.exhibit21Found = structured.exhibit21Found;
    result.structuredParsingMs = structured.durationMs;

    const strIcon = structured.succeeded ? '✅' : '⚠️ ';
    const strLabel = `Structured (${structured.tablesFound} tables, rev:${structured.revenueTableFound ? 'Y' : 'N'} ppe:${structured.ppeTableFound ? 'Y' : 'N'})`;

    // ── Step 4: Narrative Parsing ───────────────────────────────────────────
    const narrative = await parseNarrative(filing.html, ticker);
    result.narrativeParsingSucceeded = narrative.succeeded;
    result.narrativeCountriesFound = narrative.countriesFound;
    result.narrativeParsingMs = narrative.durationMs;

    const narIcon = narrative.succeeded ? '✅' : '⚠️ ';
    const narLabel = `Narrative (${narrative.countriesFound} locations)`;

    // ── Step 5: Channel Tiers ───────────────────────────────────────────────
    result.channelTiers = determineChannelTiers(structured, narrative, true);

    // ── Step 6: Overall Assessment ──────────────────────────────────────────
    const assessment = assessMaterialSpecificity(result.channelTiers);
    result.materiallySpecific = assessment.materiallySpecific;
    result.specificChannelCount = assessment.specificChannelCount;
    result.dominantEvidenceTier = assessment.dominantEvidenceTier;

    // ── P3-C: Composite Confidence Score ────────────────────────────────────
    const recencyMult = filingRecencyMultiplier(result.filingDate);
    result.recencyMultiplier = recencyMult;
    const confidence = computeCompositeConfidence(result.channelTiers, recencyMult, 0);
    result.compositeConfidenceScore = confidence.score;
    result.confidenceGrade = confidence.grade;

    const tierStr = `${result.channelTiers.revenue}/${result.channelTiers.supply}/${result.channelTiers.assets}/${result.channelTiers.financial}`;
    const specificLabel = result.materiallySpecific ? '🟢 SPECIFIC' : '🔴 FALLBACK';

    process.stdout.write(
      `${prefix} ✅ ${cikLabel} | ${retIcon} ${retLabel} | ${strIcon} ${strLabel} | ${narIcon} ${narLabel} | ${tierStr} | ${specificLabel}\n`
    );

  } catch (err) {
    result.errorMessage = String(err);
    result.channelTiers = { revenue: 'FALLBACK', supply: 'FALLBACK', assets: 'FALLBACK', financial: 'FALLBACK' };
    result.dominantEvidenceTier = 'FALLBACK';
    warn(`Pipeline error for ${ticker}: ${String(err)}`);
    process.stdout.write(`[${String(index + 1).padStart(3, ' ')}/${total}] ${ticker.padEnd(8, ' ')} ❌ ERROR: ${String(err).slice(0, 80)}\n`);
  }

  result.totalPipelineMs = Date.now() - pipelineStart;
  return result;
}

// ─── Concurrency Control (Semaphore) ─────────────────────────────────────────

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release(): void {
    this.permits++;
    const next = this.queue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

// ─── Checkpoint Management ────────────────────────────────────────────────────

function loadCheckpoint(): Set<string> {
  const completed = new Set<string>();
  if (!fs.existsSync(CHECKPOINT_FILE)) return completed;
  try {
    const lines = fs.readFileSync(CHECKPOINT_FILE, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const result = JSON.parse(line) as BaselineResult;
        completed.add(result.ticker);
      } catch {}
    }
    log(`Loaded ${completed.size} completed tickers from checkpoint`);
  } catch (e) {
    warn(`Could not load checkpoint: ${String(e)}`);
  }
  return completed;
}

function loadCheckpointResults(): BaselineResult[] {
  const results: BaselineResult[] = [];
  if (!fs.existsSync(CHECKPOINT_FILE)) return results;
  try {
    const lines = fs.readFileSync(CHECKPOINT_FILE, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        results.push(JSON.parse(line) as BaselineResult);
      } catch {}
    }
  } catch {}
  return results;
}

function appendCheckpoint(result: BaselineResult): void {
  fs.appendFileSync(CHECKPOINT_FILE, JSON.stringify(result) + '\n', 'utf-8');
}

function clearCheckpoint(): void {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }
}

// ─── Summary Report Generation ────────────────────────────────────────────────

function generateSummaryReport(summary: RunSummary): string {
  const r = summary.results;
  const total = r.length;

  if (total === 0) {
    return `# SEC Runtime Baseline Results\n\nNo results to report.\n`;
  }

  const count = (pred: (x: BaselineResult) => boolean) => r.filter(pred).length;
  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%';

  const enteredSEC = count(x => x.enteredSECPath);
  const retrieved = count(x => x.retrievalSucceeded);
  const structured = count(x => x.structuredParsingSucceeded);
  const narrative = count(x => x.narrativeParsingSucceeded);
  const specific = count(x => x.materiallySpecific);
  const fallback = count(x => !x.materiallySpecific);

  const tierCount = (channel: keyof BaselineResult['channelTiers'], tier: EvidenceTier) =>
    r.filter(x => x.channelTiers[channel] === tier).length;

  const durationSec = Math.round(summary.durationMs / 1000);
  const durationMin = Math.floor(durationSec / 60);
  const durationRemSec = durationSec % 60;

  // Composite confidence summary
  const avgScore = total > 0
    ? Math.round(r.reduce((sum, x) => sum + x.compositeConfidenceScore, 0) / total)
    : 0;
  const gradeDist = (['A', 'B', 'C', 'D', 'F'] as const).map(
    g => `${g}:${r.filter(x => x.confidenceGrade === g).length}`
  ).join(' ');

  // Per-company table
  const tableRows = r.map(x => {
    const tiers = `${x.channelTiers.revenue}/${x.channelTiers.supply}/${x.channelTiers.assets}/${x.channelTiers.financial}`;
    const specific = x.materiallySpecific ? '✅' : '❌';
    return `| ${x.ticker} | ${x.category} | ${x.isADR ? 'Yes' : 'No'} | ${x.enteredSECPath ? '✅' : '❌'} | ${x.retrievalSucceeded ? '✅' : '❌'} | ${x.filingType || 'N/A'} | ${x.structuredParsingSucceeded ? '✅' : '❌'} | ${x.narrativeParsingSucceeded ? '✅' : '❌'} | ${x.narrativeCountriesFound} | ${tiers} | ${specific} | ${x.compositeConfidenceScore} | ${x.confidenceGrade} | ${x.errorMessage ? x.errorMessage.slice(0, 40) : ''} |`;
  }).join('\n');

  // Failures list
  const failures = r.filter(x => x.errorMessage || (!x.enteredSECPath) || (!x.retrievalSucceeded && x.enteredSECPath));
  const failureRows = failures.map(x => {
    const reason = x.errorMessage || (!x.enteredSECPath ? 'CIK not found' : 'Filing retrieval failed');
    return `- **${x.ticker}** (Cat ${x.category}): ${reason}`;
  }).join('\n');

  return `# SEC Runtime Baseline Results

**Run ID:** ${summary.runId}
**Run date:** ${summary.startTime}
**Phase:** ${summary.phase}
**Companies processed:** ${summary.completedCompanies} / ${summary.totalCompanies}
**Duration:** ${durationMin}m ${durationRemSec}s
**Mode:** ${IS_DRY_RUN ? 'DRY RUN' : 'LIVE'}

---

## Overall Results

| Metric | Count | % |
|--------|-------|---|
| Entered SEC path | ${enteredSEC} | ${pct(enteredSEC)} |
| Retrieval succeeded | ${retrieved} | ${pct(retrieved)} |
| Structured parsing succeeded | ${structured} | ${pct(structured)} |
| Narrative parsing succeeded | ${narrative} | ${pct(narrative)} |
| **Materially specific output** | **${specific}** | **${pct(specific)}** |
| Fallback-dominant output | ${fallback} | ${pct(fallback)} |

---

## Channel Evidence Tier Breakdown

| Channel | DIRECT | ALLOCATED | MODELED | FALLBACK | NOT_RUN |
|---------|--------|-----------|---------|----------|---------|
| Revenue | ${tierCount('revenue','DIRECT')} | ${tierCount('revenue','ALLOCATED')} | ${tierCount('revenue','MODELED')} | ${tierCount('revenue','FALLBACK')} | ${tierCount('revenue','NOT_RUN')} |
| Supply | ${tierCount('supply','DIRECT')} | ${tierCount('supply','ALLOCATED')} | ${tierCount('supply','MODELED')} | ${tierCount('supply','FALLBACK')} | ${tierCount('supply','NOT_RUN')} |
| Assets | ${tierCount('assets','DIRECT')} | ${tierCount('assets','ALLOCATED')} | ${tierCount('assets','MODELED')} | ${tierCount('assets','FALLBACK')} | ${tierCount('assets','NOT_RUN')} |
| Financial | ${tierCount('financial','DIRECT')} | ${tierCount('financial','ALLOCATED')} | ${tierCount('financial','MODELED')} | ${tierCount('financial','FALLBACK')} | ${tierCount('financial','NOT_RUN')} |

---

## Category Breakdown

| Category | Total | Specific | Fallback | Specific % |
|----------|-------|----------|----------|------------|
| A (Hardcoded CIK) | ${count(x=>x.category==='A')} | ${count(x=>x.category==='A' && x.materiallySpecific)} | ${count(x=>x.category==='A' && !x.materiallySpecific)} | ${total > 0 ? ((count(x=>x.category==='A' && x.materiallySpecific)/Math.max(1,count(x=>x.category==='A')))*100).toFixed(1) : 0}% |
| B (EDGAR search) | ${count(x=>x.category==='B')} | ${count(x=>x.category==='B' && x.materiallySpecific)} | ${count(x=>x.category==='B' && !x.materiallySpecific)} | ${total > 0 ? ((count(x=>x.category==='B' && x.materiallySpecific)/Math.max(1,count(x=>x.category==='B')))*100).toFixed(1) : 0}% |
| C (ADR/20-F) | ${count(x=>x.category==='C')} | ${count(x=>x.category==='C' && x.materiallySpecific)} | ${count(x=>x.category==='C' && !x.materiallySpecific)} | ${total > 0 ? ((count(x=>x.category==='C' && x.materiallySpecific)/Math.max(1,count(x=>x.category==='C')))*100).toFixed(1) : 0}% |

---

## Confidence Summary

**Average confidence score: ${avgScore} | Grade distribution: ${gradeDist}**

---

## Per-Company Results

| Ticker | Cat | ADR | CIK? | Retrieved | Filing | Structured | Narrative | Locations | Tiers (Rev/Sup/Ast/Fin) | Specific | Score | Grade | Error |
|--------|-----|-----|------|-----------|--------|------------|-----------|-----------|------------------------|----------|-------|-------|-------|
${tableRows}

---

## Failures & Issues

${failures.length === 0 ? '_No failures recorded._' : failureRows}

---

*Generated by runSECBaseline.ts — CO-GRI Platform*
*Methodology: Read-only SEC EDGAR API calls via Supabase Edge Functions*
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const startTime = new Date().toISOString();
  const startMs = Date.now();

  log('═══════════════════════════════════════════════════════════════');
  log('  CO-GRI SEC Runtime Baseline Script');
  log(`  Phase: ${PHASE}  |  Mode: ${IS_DRY_RUN ? 'DRY RUN' : 'LIVE'}  |  Concurrency: ${CONCURRENCY}`);
  log(`  Run ID: ${runId}`);
  log('═══════════════════════════════════════════════════════════════');

  // Validate environment (skip for dry-run)
  if (!IS_DRY_RUN && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
    log('❌ ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    log('   Set them as environment variables or in .env file');
    log('   For dry-run testing, use: --dry-run');
    process.exit(1);
  }

  if (!IS_DRY_RUN) {
    log(`✅ Supabase URL: ${SUPABASE_URL.slice(0, 30)}...`);
  }

  // Build ticker list based on phase
  let tickers: string[];

  if (SINGLE_TICKER) {
    tickers = [SINGLE_TICKER];
    log(`Single ticker mode: ${SINGLE_TICKER}`);
  } else {
    switch (PHASE) {
      case '1':
        tickers = [...CAT_A_TICKERS];
        log(`Phase 1: Category A only (${tickers.length} companies with hardcoded CIKs)`);
        break;
      case '2':
        tickers = [...CAT_A_TICKERS, ...CAT_B_TICKERS];
        log(`Phase 2: Category A+B (${tickers.length} companies)`);
        break;
      case '3':
      case 'full':
      default:
        tickers = [...CAT_A_TICKERS, ...CAT_B_TICKERS, ...CAT_C_TICKERS];
        log(`Phase 3/Full: All SEC-eligible (${tickers.length} companies)`);
        break;
    }
  }

  // Deduplicate
  tickers = [...new Set(tickers)];
  const total = tickers.length;

  log(`\nTotal tickers to process: ${total}`);

  // Dry-run: just list tickers
  if (IS_DRY_RUN) {
    log('\n─── Dry Run — Ticker List ───────────────────────────────────────');
    tickers.forEach((t, i) => {
      const hasCIK = TICKER_TO_CIK_MAP[t.toUpperCase()] ? '(CIK hardcoded)' : '(EDGAR search)';
      console.log(`  ${String(i + 1).padStart(3, ' ')}. ${t.padEnd(10, ' ')} ${hasCIK}`);
    });
    log(`\n  Total: ${total} tickers`);
    log(`  Cat A (hardcoded CIK): ${tickers.filter(t => CAT_A_TICKERS.includes(t.toUpperCase())).length}`);
    log(`  Cat B (EDGAR search):  ${tickers.filter(t => CAT_B_TICKERS.includes(t.toUpperCase())).length}`);
    log(`  Cat C (ADR/20-F):      ${tickers.filter(t => CAT_C_TICKERS.includes(t.toUpperCase())).length}`);
    log('\n  DRY RUN complete. No API calls were made.');
    return;
  }

  // Resume: load checkpoint
  let completedTickers = new Set<string>();
  let previousResults: BaselineResult[] = [];

  if (IS_RESUME) {
    completedTickers = loadCheckpoint();
    previousResults = loadCheckpointResults();
    const remaining = tickers.filter(t => !completedTickers.has(t.toUpperCase()));
    log(`Resuming: ${completedTickers.size} already done, ${remaining.length} remaining`);
    tickers = remaining;
  } else {
    clearCheckpoint();
  }

  // Ensure docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Process companies with concurrency control
  log(`\n─── Processing ${tickers.length} companies (concurrency: ${CONCURRENCY}) ─────────`);
  log('');

  const semaphore = new Semaphore(CONCURRENCY);
  const newResults: BaselineResult[] = [];
  let processedCount = 0;

  const tasks = tickers.map((ticker, index) =>
    (async () => {
      await semaphore.acquire();
      try {
        const result = await processCompany(ticker, index + previousResults.length, total + previousResults.length);
        newResults.push(result);
        appendCheckpoint(result);
        processedCount++;
      } finally {
        semaphore.release();
      }
    })()
  );

  await Promise.all(tasks);

  const allResults = [...previousResults, ...newResults];
  const endTime = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  // Write results
  const summary: RunSummary = {
    runId,
    phase: PHASE,
    startTime,
    endTime,
    durationMs,
    totalCompanies: total,
    completedCompanies: allResults.length,
    failedCompanies: allResults.filter(r => r.errorMessage !== null).length,
    skippedCompanies: allResults.filter(r => !r.enteredSECPath).length,
    results: allResults,
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2), 'utf-8');
  log(`\n✅ Full results written to: ${RESULTS_FILE}`);

  const summaryMd = generateSummaryReport(summary);
  fs.writeFileSync(SUMMARY_FILE, summaryMd, 'utf-8');
  log(`✅ Summary report written to: ${SUMMARY_FILE}`);

  // Print console summary
  const specific = allResults.filter(r => r.materiallySpecific).length;
  const entered = allResults.filter(r => r.enteredSECPath).length;
  const retrieved = allResults.filter(r => r.retrievalSucceeded).length;
  const durationSec = Math.round(durationMs / 1000);

  log('\n═══════════════════════════════════════════════════════════════');
  log(`  Baseline Complete in ${Math.floor(durationSec/60)}m ${durationSec%60}s`);
  log(`  Companies processed:    ${allResults.length}`);
  log(`  Entered SEC path:       ${entered} (${((entered/allResults.length)*100).toFixed(1)}%)`);
  log(`  Retrieval succeeded:    ${retrieved} (${((retrieved/allResults.length)*100).toFixed(1)}%)`);
  log(`  Materially specific:    ${specific} (${((specific/allResults.length)*100).toFixed(1)}%)`);
  log(`  Fallback-dominant:      ${allResults.length - specific} (${(((allResults.length-specific)/allResults.length)*100).toFixed(1)}%)`);
  log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error(`[FATAL] ${String(err)}`);
  process.exit(1);
});
