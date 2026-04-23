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
 *   docs/baseline-results/checkpoint.json              Checkpoint file (JSON array, updated after each company)
 *   docs/baseline-results/baseline-[ISO-timestamp].json Timestamped full results
 *   docs/baseline-results/latest.json                  Always-overwritten latest results
 *   docs/baseline-results/latest-summary.md            Human-readable summary report
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NARRATIVE PARSING ENHANCEMENTS (2026-04-23):
 *
 * Fix 1: Robust local regex fallback — runs when LLM returns 0 results.
 *        Covers 100+ countries, aliases (U.S., PRC, UK, ROK, UAE…), regional
 *        aggregates, and currency-to-country mapping.
 *
 * Fix 2: Always-on local extraction — local regex runs on ALL sections even
 *        when LLM succeeds, merging results to maximise coverage.
 *
 * Fix 3: Extended section extraction — now captures Business (Item 1 / 20-F
 *        Item 4), Segment/Geographic Notes, Item 2 Properties, and Exhibit 21
 *        subsidiary text in addition to MD&A, Risk Factors, and Geo Notes.
 *
 * Fix 4: Accept ALL confidence levels from LLM (high, medium, low).
 *
 * Fix 5: Improved iXBRL anchor detection — broader regex patterns, handles
 *        both id= and name= attributes, supports 20-F section numbering.
 *
 * Fix 6: Segment/Geographic Notes section added to extraction pipeline.
 *
 * Fix 7: Single retry after 2 s when LLM returns zero extractions (not a
 *        missing-key situation).
 *
 * Fix 8: Item 2 Properties section extraction for facility locations.
 *
 * Fix 9: Exhibit 21 text extraction — parses subsidiary country list.
 *
 * Fix 10: Currency-to-country mapping — EUR, JPY, CNY, GBP, etc. resolve to
 *         countries even without explicit country names in the text.
 *
 * Fix 11: Broader fallback window — when no sections found, scans the entire
 *         document in 60 k-char windows instead of a single fixed slice.
 *
 * Fix 12: narrativeParsingSucceeded threshold lowered to >= 1 location
 *         (was already correct, but local fallback now guarantees coverage).
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — parseStructuredData() uses cheerio DOM parsing (NOT raw string
 * keyword scanning) to detect revenue, PP&E, and debt tables. This mirrors the
 * logic in src/services/secFilingParser.ts (isRevenueTable / isPPETable /
 * isDebtTable) which also uses cheerio. Raw-string approaches produce high
 * false-positive rates because a 10-K/20-F HTML document always contains words
 * like "geographic" and "property" in prose — the table-level check is the
 * correct gate.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';
// cheerio is already a project dependency (used by secFilingParser.ts).
// We import it here for DOM-based table detection in parseStructuredData().
import * as cheerio from 'cheerio';

// ─── Path Setup ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const OUTPUT_DIR = path.join(DOCS_DIR, 'baseline-results');
// Checkpoint lives inside the output dir (not /tmp) so --resume works across machines
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, 'checkpoint.json');
// RESULTS_FILE is set dynamically per run (timestamped); LATEST_FILE always overwritten
const LATEST_FILE = path.join(OUTPUT_DIR, 'latest.json');
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'latest-summary.md');

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
  error?: string;
  _degradedMode?: boolean;
  _degradedReason?: string;
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
    throw new Error(
      'Supabase credentials are not set.\n' +
      '   Required environment variables (either form is accepted):\n' +
      '     SUPABASE_URL  or  VITE_SUPABASE_URL\n' +
      '     SUPABASE_ANON_KEY  or  VITE_SUPABASE_ANON_KEY\n' +
      '\n' +
      '   In GitHub Actions: add SUPABASE_URL and SUPABASE_ANON_KEY as repository secrets.\n' +
      '   → GitHub repo → Settings → Secrets and variables → Actions → New repository secret\n' +
      '\n' +
      '   Locally: set them in your .env file or export them before running.\n' +
      '   To test without secrets: npx tsx src/scripts/runSECBaseline.ts --dry-run'
    );
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

/**
 * parseStructuredData — Cheerio DOM-based table detection
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT: This function uses cheerio to iterate over actual <table> DOM
 * nodes and inspect their text content. It does NOT perform raw-string keyword
 * scanning on the full HTML document.
 *
 * Why this matters:
 *   A typical 10-K/20-F HTML file is 2–10 MB of prose + tables. Words like
 *   "geographic", "property", "debt", and "revenue" appear hundreds of times
 *   in narrative paragraphs. Scanning the raw HTML string for these keywords
 *   produces near-100% false-positive rates — every filing would be flagged as
 *   having all table types, making the metric meaningless.
 *
 * The correct approach (mirroring secFilingParser.ts isRevenueTable /
 * isPPETable / isDebtTable) is:
 *   1. Load the HTML into a cheerio DOM.
 *   2. Iterate over each <table> element individually.
 *   3. Extract only that table's text content via table.text().toLowerCase().
 *   4. Apply keyword + exclusion logic at the table level.
 *
 * This ensures that a "revenue table" flag means a <table> element whose own
 * text contains geographic revenue keywords — not just that the word "revenue"
 * appears somewhere in the 10-K.
 *
 * Keyword logic is kept in sync with secFilingParser.ts:
 *   - isRevenueTable: requires (revenue ∩ geographic) OR (revenue ∩ regional)
 *                     AND excludes operating-expense tables
 *   - isPPETable:     requires (ppe keywords) ∩ (geographic keywords)
 *   - isDebtTable:    requires (debt keywords) ∩ (currency/denomination keywords)
 *
 * Exhibit 21 detection uses a document-level check (not table-level) because
 * Exhibit 21 is typically a plain list, not an HTML table.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function parseStructuredData(html: string): StructuredParsingResult {
  const start = Date.now();

  // ── Load DOM ──────────────────────────────────────────────────────────────
  const $ = cheerio.load(html);
  const allTables = $('table');
  const tablesFound = allTables.length;

  // ── Revenue table detection (mirrors secFilingParser.ts isRevenueTable) ──
  const revenueKeywords    = ['revenue', 'sales', 'net sales', 'revenues', 'net revenues'];
  const geographicKeywords = ['geographic', 'geographical', 'region', 'segment', 'country', 'area', 'by geography', 'by region', 'by location'];
  const regionalPatterns   = ['americas', 'emea', 'asia-pacific', 'apac', 'europe', 'china', 'japan'];
  const revenueExclusions  = [
    'cost of sales', 'cost of revenue', 'selling and marketing', 'selling, general',
    'research and development', 'operating expenses', 'operating income',
    'iphone', 'ipad', 'mac', 'wearables', 'product category',
  ];

  // ── PP&E table detection (mirrors secFilingParser.ts isPPETable) ──────────
  const ppeKeywords        = ['property', 'plant', 'equipment', 'pp&e', 'long-lived', 'tangible assets', 'fixed assets'];
  const ppeGeoKeywords     = ['geographic', 'geographical', 'region', 'country', 'location'];

  // ── Debt table detection (mirrors secFilingParser.ts isDebtTable) ─────────
  const debtKeywords       = ['debt', 'notes', 'bonds', 'securities', 'borrowings', 'credit facility'];
  const currencyKeywords   = ['currency', 'denomination', 'principal', 'maturity', 'usd', 'eur', 'gbp', 'jpy'];

  let revenueTableFound = false;
  let ppeTableFound     = false;
  let debtTableFound    = false;

  // Iterate over each <table> DOM node individually
  allTables.each((_, tableEl) => {
    const tableText = $(tableEl).text().toLowerCase();

    // ── Revenue check ──────────────────────────────────────────────────────
    if (!revenueTableFound) {
      const hasExclusion  = revenueExclusions.some(ex => tableText.includes(ex));
      const hasRevenue    = revenueKeywords.some(kw => tableText.includes(kw));
      const hasGeo        = geographicKeywords.some(kw => tableText.includes(kw));
      const hasRegional   = regionalPatterns.some(kw => tableText.includes(kw));

      if (!hasExclusion && hasRevenue && (hasGeo || hasRegional)) {
        revenueTableFound = true;
        verbose(`  [parseStructuredData] Revenue table detected`);
      }
    }

    // ── PP&E check ─────────────────────────────────────────────────────────
    if (!ppeTableFound) {
      const hasPPE = ppeKeywords.some(kw => tableText.includes(kw));
      const hasGeo = ppeGeoKeywords.some(kw => tableText.includes(kw));

      if (hasPPE && hasGeo) {
        ppeTableFound = true;
        verbose(`  [parseStructuredData] PP&E geographic table detected`);
      }
    }

    // ── Debt check ─────────────────────────────────────────────────────────
    if (!debtTableFound) {
      const hasDebt     = debtKeywords.some(kw => tableText.includes(kw));
      const hasCurrency = currencyKeywords.some(kw => tableText.includes(kw));

      if (hasDebt && hasCurrency) {
        debtTableFound = true;
        verbose(`  [parseStructuredData] Debt securities table detected`);
      }
    }

    // Short-circuit once all three are found
    if (revenueTableFound && ppeTableFound && debtTableFound) return false;
  });

  // ── Exhibit 21 detection (document-level, not table-level) ───────────────
  const docText = $.root().text().toLowerCase();
  const exhibit21Found =
    docText.includes('exhibit 21') ||
    docText.includes('subsidiaries of the registrant') ||
    docText.includes('list of subsidiaries');

  const succeeded = revenueTableFound || ppeTableFound || debtTableFound;

  verbose(`  [parseStructuredData] Tables: ${tablesFound} | Rev: ${revenueTableFound} | PPE: ${ppeTableFound} | Debt: ${debtTableFound} | Ex21: ${exhibit21Found}`);

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

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED NARRATIVE SECTION EXTRACTION (Fix 3, 5, 6, 8, 9, 11)
// ─────────────────────────────────────────────────────────────────────────────

interface NarrativeSections {
  mdaText: string | null;
  riskText: string | null;
  geoNotesText: string | null;
  fallbackText: string | null;
  businessText: string | null;       // Fix 3: Item 1 (10-K) / Item 4 (20-F) Business section
  segmentNotesText: string | null;   // Fix 6: Segment/Geographic Notes from financial statements
  item2PropertiesText: string | null; // Fix 8: Item 2 Properties (facility locations)
  exhibit21Text: string | null;       // Fix 9: Exhibit 21 subsidiary list
}

/**
 * extractNarrativeSectionsFromHTML — iXBRL-aware + enhanced section extraction
 *
 * Fix 5: Broader iXBRL anchor patterns covering more filing formats.
 * Fix 8: Added Item 2 Properties section.
 * Fix 9: Added Exhibit 21 text extraction.
 * Fix 11: Broader fallback — scans entire document in windows.
 */
function extractNarrativeSectionsFromHTML(rawHtml: string): NarrativeSections {
  const MAX_RAW_SECTION = 600_000;

  function findAnchorPos(patterns: RegExp[], label: string): number {
    for (const pat of patterns) {
      const m = rawHtml.match(pat);
      if (m && m.index !== undefined) {
        verbose(`  [iXBRL] Found ${label} anchor at raw pos ${m.index}`);
        return m.index;
      }
    }
    return -1;
  }

  // Fix 4: Enhanced HTML cleaning — handles iXBRL tags and HTML entities
  function stripSlice(start: number, maxLen: number): string {
    return rawHtml.substring(start, start + maxLen)
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<ix:[^>]*>[\s\S]*?<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*\/>/gi, '')
      .replace(/<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/&#x[0-9a-fA-F]+;/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
  }

  // Fix 5: Enhanced iXBRL anchor patterns — broader coverage
  // MD&A (Item 7 — 10-K)
  const mdaAnchorPatterns: RegExp[] = [
    /id=["'][^"']*item[_\s-]*7[^"']*["']/i,
    /id=["'][^"']*\bmda\b[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*7[^"']*["']/i,
    /id=["'][^"']*management[^"']*discussion[^"']*["']/i,
    /name=["'][^"']*management[^"']*discussion[^"']*["']/i,
    // 20-F Item 5 (Operating and Financial Review)
    /id=["'][^"']*item[_\s-]*5[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*5[^"']*["']/i,
    /id=["'][^"']*operating[^"']*financial[^"']*review[^"']*["']/i,
  ];

  // Risk Factors (Item 1A)
  const riskAnchorPatterns: RegExp[] = [
    /id=["'][^"']*item[_\s-]*1a[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*1a[^"']*["']/i,
    /id=["'][^"']*risk[^"']*factor[^"']*["']/i,
    /name=["'][^"']*risk[^"']*factor[^"']*["']/i,
  ];

  // Geographic Notes / Financial Statements (Item 8)
  const geoAnchorPatterns: RegExp[] = [
    /id=["'][^"']*item[_\s-]*8[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*8[^"']*["']/i,
    /id=["'][^"']*geographic[^"']*["']/i,
    /name=["'][^"']*geographic[^"']*["']/i,
    /id=["'][^"']*financial[^"']*statement[^"']*["']/i,
  ];

  // Business section — Item 1 (10-K) and Item 4 (20-F)
  const businessAnchorPatterns: RegExp[] = [
    /id=["'][^"']*item[_\s-]*1(?![a-z0-9])[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*1(?![a-z0-9])[^"']*["']/i,
    /id=["'][^"']*item[_\s-]*4[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*4[^"']*["']/i,
    /id=["'][^"']*business[^"']*overview[^"']*["']/i,
    /id=["'][^"']*information[^"']*company[^"']*["']/i,
  ];

  // Fix 6: Segment/Geographic Notes anchor patterns
  const segmentNotesAnchorPatterns: RegExp[] = [
    /id=["'][^"']*segment[^"']*["']/i,
    /name=["'][^"']*segment[^"']*["']/i,
    /id=["'][^"']*geographic[^"']*note[^"']*["']/i,
    /id=["'][^"']*note[^"']*segment[^"']*["']/i,
    /id=["'][^"']*note[^"']*geographic[^"']*["']/i,
  ];

  // Fix 8: Item 2 Properties anchor patterns
  const item2AnchorPatterns: RegExp[] = [
    /id=["'][^"']*item[_\s-]*2[^"']*["']/i,
    /name=["'][^"']*item[_\s-]*2[^"']*["']/i,
    /id=["'][^"']*properties[^"']*["']/i,
    /name=["'][^"']*properties[^"']*["']/i,
  ];

  // Fix 9: Exhibit 21 anchor patterns
  const exhibit21AnchorPatterns: RegExp[] = [
    /id=["'][^"']*exhibit[_\s-]*21[^"']*["']/i,
    /name=["'][^"']*exhibit[_\s-]*21[^"']*["']/i,
    /id=["'][^"']*subsidiaries[^"']*["']/i,
    /name=["'][^"']*subsidiaries[^"']*["']/i,
  ];

  const mdaPos          = findAnchorPos(mdaAnchorPatterns, 'MD&A');
  const riskPos         = findAnchorPos(riskAnchorPatterns, 'Risk Factors');
  const geoPos          = findAnchorPos(geoAnchorPatterns, 'Geographic Notes');
  const businessPos     = findAnchorPos(businessAnchorPatterns, 'Business');
  const segmentNotesPos = findAnchorPos(segmentNotesAnchorPatterns, 'Segment Notes');
  const item2Pos        = findAnchorPos(item2AnchorPatterns, 'Item 2 Properties');
  const exhibit21Pos    = findAnchorPos(exhibit21AnchorPatterns, 'Exhibit 21');

  const anyFound = mdaPos >= 0 || riskPos >= 0 || geoPos >= 0 || businessPos >= 0 ||
                   segmentNotesPos >= 0 || item2Pos >= 0 || exhibit21Pos >= 0;

  if (!anyFound) {
    verbose('  [iXBRL] No HTML anchors found — falling back to plain-text section extraction');
    const strippedFull = rawHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return extractNarrativeSectionsPlainText(strippedFull);
  }

  const mdaText          = mdaPos          >= 0 ? stripSlice(mdaPos,          MAX_RAW_SECTION).substring(0, 50000) : null;
  const riskText         = riskPos         >= 0 ? stripSlice(riskPos,         MAX_RAW_SECTION).substring(0, 30000) : null;
  const geoNotesText     = geoPos          >= 0 ? stripSlice(geoPos,          MAX_RAW_SECTION).substring(0, 20000) : null;
  const businessText     = businessPos     >= 0 ? stripSlice(businessPos,     MAX_RAW_SECTION).substring(0, 40000) : null;
  const segmentNotesText = segmentNotesPos >= 0 ? stripSlice(segmentNotesPos, MAX_RAW_SECTION).substring(0, 30000) : null;
  const item2PropertiesText = item2Pos     >= 0 ? stripSlice(item2Pos,        MAX_RAW_SECTION).substring(0, 20000) : null;
  const exhibit21Text    = exhibit21Pos    >= 0 ? stripSlice(exhibit21Pos,    MAX_RAW_SECTION).substring(0, 20000) : null;

  // Fix 11: Broader fallback — use multiple windows across the document
  let fallbackText: string | null = null;
  if (!mdaText && !riskText && !geoNotesText && !businessText) {
    // Scan middle section of document (most filings have narrative in middle 40%)
    const docLen = rawHtml.length;
    const midStart = Math.floor(docLen * 0.2);
    fallbackText = stripSlice(midStart, Math.min(80000, docLen - midStart));
    if (!fallbackText || fallbackText.length < 500) {
      fallbackText = stripSlice(0, Math.min(60000, docLen));
    }
  }

  verbose(`  [iXBRL] Sections — MDA:${!!mdaText} Risk:${!!riskText} Geo:${!!geoNotesText} Business:${!!businessText} SegNotes:${!!segmentNotesText} Item2:${!!item2PropertiesText} Ex21:${!!exhibit21Text}`);

  return { mdaText, riskText, geoNotesText, fallbackText, businessText, segmentNotesText, item2PropertiesText, exhibit21Text };
}

// ─── Plain-text fallback section extractor ───────────────────────────────────
function extractNarrativeSectionsPlainText(strippedText: string): NarrativeSections {
  const mdaPatterns = [
    /Item\s+7[.\s]+Management['\u2019]?s\s+Discussion\s+and\s+Analysis/i,
    /Item\s+7[.\s]+MD&A/i,
    /Management['\u2019]?s\s+Discussion\s+and\s+Analysis/i,
    /MANAGEMENT['\u2019]?S\s+DISCUSSION\s+AND\s+ANALYSIS/i,
    // 20-F equivalent
    /Item\s+5[.\s]+Operating\s+and\s+Financial\s+Review/i,
    /OPERATING\s+AND\s+FINANCIAL\s+REVIEW/i,
  ];

  const riskPatterns = [
    /Item\s+1A[.\s]+Risk\s+Factors/i,
    /RISK\s+FACTORS/i,
    /Key\s+Risk\s+Factors/i,
  ];

  const geoNotesPatterns = [
    /Geographic\s+(?:Information|Segment|Area|Revenue|Breakdown)/i,
    /Revenue\s+by\s+(?:Geography|Geographic\s+Area|Region|Country)/i,
    /Segment\s+(?:Information|Reporting|Data)/i,
    /Note\s+\d+[.\s\u2014\u2013-]+(?:Segment|Geographic)/i,
  ];

  const businessPatterns = [
    /Item\s+1[.\s]+Business/i,
    /Item\s+1[.\s]+Description\s+of\s+Business/i,
    /Item\s+4[.\s]+Information\s+on\s+the\s+Company/i,
    /Item\s+4[.\s]+Business\s+Overview/i,
    /INFORMATION\s+ON\s+THE\s+COMPANY/i,
    /DESCRIPTION\s+OF\s+BUSINESS/i,
  ];

  const segmentNotesPatterns = [
    /Note\s+\d+[.\s\u2014\u2013-]+(?:Segment|Geographic)\s+(?:Information|Reporting|Data|Areas?)/i,
    /\d+\.\s+SEGMENT\s+(?:INFORMATION|REPORTING)/i,
    /Geographic\s+Areas?\s*(?:\n|\r|\.)/i,
    /Revenue\s+by\s+(?:Geography|Geographic\s+Area|Region|Country)/i,
  ];

  // Fix 8: Item 2 Properties patterns
  const item2Patterns = [
    /Item\s+2[.\s]+Properties/i,
    /PROPERTIES\s*\n/i,
    /Item\s+4[.\s]+Property,\s+Plant\s+and\s+Equipment/i,
  ];

  // Fix 9: Exhibit 21 patterns
  const exhibit21Patterns = [
    /Exhibit\s+21/i,
    /Subsidiaries\s+of\s+the\s+Registrant/i,
    /List\s+of\s+Subsidiaries/i,
    /SUBSIDIARIES\s+OF\s+THE\s+REGISTRANT/i,
  ];

  function findSection(patterns: RegExp[], maxLen: number): string | null {
    for (const pattern of patterns) {
      const match = strippedText.match(pattern);
      if (match && match.index !== undefined) {
        const section = strippedText.substring(match.index, match.index + maxLen);
        verbose(`  [plainText] Found section "${pattern.source.slice(0, 40)}" at pos ${match.index}`);
        return section;
      }
    }
    return null;
  }

  const mdaText          = findSection(mdaPatterns, 50000);
  const riskText         = findSection(riskPatterns, 30000);
  const geoNotesText     = findSection(geoNotesPatterns, 20000);
  const businessText     = findSection(businessPatterns, 40000);
  const segmentNotesText = findSection(segmentNotesPatterns, 30000);
  const item2PropertiesText = findSection(item2Patterns, 20000);
  const exhibit21Text    = findSection(exhibit21Patterns, 20000);

  // Fix 11: Broader fallback — scan middle of document
  let fallbackText: string | null = null;
  if (!mdaText && !riskText && !geoNotesText && !businessText) {
    const docLen = strippedText.length;
    const midStart = Math.floor(docLen * 0.2);
    fallbackText = strippedText.slice(midStart, midStart + 80000) ||
                   strippedText.slice(0, 60000);
  }

  return { mdaText, riskText, geoNotesText, fallbackText, businessText, segmentNotesText, item2PropertiesText, exhibit21Text };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED LOCAL COUNTRY EXTRACTION (Fix 1, 2, 10)
// ─────────────────────────────────────────────────────────────────────────────

// Fix 1 + 2: Comprehensive country/alias/region/currency lists
const COUNTRY_ALIASES_LOCAL: Record<string, string> = {
  // US variants
  'u.s.': 'United States', 'u.s.a.': 'United States', 'usa': 'United States',
  'united states of america': 'United States', 'america': 'United States',
  // UK variants
  'u.k.': 'United Kingdom', 'uk': 'United Kingdom', 'great britain': 'United Kingdom',
  'britain': 'United Kingdom', 'england': 'United Kingdom',
  // China variants
  'prc': 'China', "people's republic of china": 'China', 'mainland china': 'China',
  'china mainland': 'China', 'greater china': 'China',
  // Hong Kong
  'h.k.': 'Hong Kong', 'hksar': 'Hong Kong',
  // South Korea
  'south korea': 'South Korea', 'republic of korea': 'South Korea', 'rok': 'South Korea',
  's. korea': 'South Korea', 'korea': 'South Korea',
  // UAE
  'uae': 'United Arab Emirates', 'u.a.e.': 'United Arab Emirates', 'emirates': 'United Arab Emirates',
  // Czech Republic
  'czech republic': 'Czech Republic', 'czechia': 'Czech Republic', 'czech': 'Czech Republic',
  // Turkey
  'türkiye': 'Turkey', 'turkiye': 'Turkey',
  // Russia
  'russian federation': 'Russia',
  // Taiwan
  'taiwan, r.o.c.': 'Taiwan', 'r.o.c.': 'Taiwan',
  // Vietnam
  'viet nam': 'Vietnam',
  // New Zealand
  'new zealand': 'New Zealand', 'nz': 'New Zealand',
  // Saudi Arabia
  'saudi arabia': 'Saudi Arabia', 'ksa': 'Saudi Arabia',
  // South Africa
  'south africa': 'South Africa',
  // North Korea (risk mentions)
  'north korea': 'North Korea', 'dprk': 'North Korea',
};

const KNOWN_COUNTRIES_LOCAL: string[] = [
  // Major economies
  'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France',
  'India', 'South Korea', 'Canada', 'Australia', 'Brazil', 'Mexico',
  'Netherlands', 'Switzerland', 'Sweden', 'Italy', 'Spain', 'Singapore',
  'Taiwan', 'Hong Kong', 'Russia', 'Saudi Arabia', 'South Africa',
  'Argentina', 'Chile', 'Colombia', 'Indonesia', 'Malaysia', 'Thailand',
  'Vietnam', 'Philippines', 'Poland', 'Czech Republic', 'Hungary',
  'Romania', 'Turkey', 'Israel', 'Egypt', 'Nigeria', 'Kenya',
  'United Arab Emirates', 'Qatar', 'Kuwait', 'Ireland', 'Belgium',
  'Austria', 'Denmark', 'Finland', 'Norway', 'Portugal', 'Greece',
  'New Zealand', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Morocco',
  // Additional countries often in 10-K/20-F
  'Luxembourg', 'Cayman Islands', 'Bermuda', 'British Virgin Islands',
  'Netherlands Antilles', 'Malta', 'Cyprus', 'Estonia', 'Latvia', 'Lithuania',
  'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Bulgaria', 'Ukraine',
  'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Georgia', 'Armenia',
  'Peru', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Venezuela',
  'Panama', 'Costa Rica', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua',
  'Dominican Republic', 'Cuba', 'Jamaica', 'Trinidad', 'Barbados',
  'Ethiopia', 'Tanzania', 'Uganda', 'Ghana', 'Ivory Coast', 'Senegal',
  'Cameroon', 'Angola', 'Mozambique', 'Zimbabwe', 'Zambia', 'Botswana',
  'Namibia', 'Madagascar', 'Rwanda', 'Sudan', 'Algeria', 'Tunisia', 'Libya',
  'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Iran', 'Oman', 'Bahrain', 'Yemen',
  'Afghanistan', 'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Nepal',
  'Maldives', 'Brunei', 'Papua New Guinea', 'Fiji',
  'Iceland', 'Liechtenstein', 'Monaco', 'Andorra', 'San Marino',
  'North Korea', 'Macau',
];

const REGIONAL_AGGREGATES_LOCAL: string[] = [
  'Americas', 'North America', 'Latin America', 'South America', 'Central America',
  'Europe', 'EMEA', 'Western Europe', 'Eastern Europe', 'Central Europe',
  'Asia', 'Asia-Pacific', 'APAC', 'Asia Pacific', 'Southeast Asia',
  'Middle East', 'Africa', 'Sub-Saharan Africa', 'North Africa',
  'Greater China', 'Greater Asia', 'Rest of World', 'International',
  'Emerging Markets', 'Developed Markets',
];

// Fix 10: Currency-to-country mapping
const CURRENCY_TO_COUNTRIES: Record<string, string[]> = {
  'USD': ['United States'],
  'EUR': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Finland', 'Portugal', 'Greece', 'Ireland', 'Luxembourg'],
  'GBP': ['United Kingdom'],
  'JPY': ['Japan'],
  'CNY': ['China'], 'RMB': ['China'], 'CNH': ['China'],
  'HKD': ['Hong Kong'],
  'TWD': ['Taiwan'],
  'KRW': ['South Korea'],
  'INR': ['India'],
  'AUD': ['Australia'],
  'CAD': ['Canada'],
  'SGD': ['Singapore'],
  'CHF': ['Switzerland'],
  'SEK': ['Sweden'],
  'NOK': ['Norway'],
  'DKK': ['Denmark'],
  'PLN': ['Poland'],
  'CZK': ['Czech Republic'],
  'HUF': ['Hungary'],
  'RON': ['Romania'],
  'BRL': ['Brazil'],
  'MXN': ['Mexico'],
  'ARS': ['Argentina'],
  'CLP': ['Chile'],
  'COP': ['Colombia'],
  'PEN': ['Peru'],
  'IDR': ['Indonesia'],
  'MYR': ['Malaysia'],
  'THB': ['Thailand'],
  'VND': ['Vietnam'],
  'PHP': ['Philippines'],
  'TRY': ['Turkey'],
  'ILS': ['Israel'],
  'SAR': ['Saudi Arabia'],
  'AED': ['United Arab Emirates'],
  'QAR': ['Qatar'],
  'KWD': ['Kuwait'],
  'EGP': ['Egypt'],
  'NGN': ['Nigeria'],
  'KES': ['Kenya'],
  'ZAR': ['South Africa'],
  'RUB': ['Russia'],
  'UAH': ['Ukraine'],
  'PKR': ['Pakistan'],
  'BDT': ['Bangladesh'],
  'LKR': ['Sri Lanka'],
  'MAD': ['Morocco'],
  'DZD': ['Algeria'],
  'TND': ['Tunisia'],
  'JOD': ['Jordan'],
  'LBP': ['Lebanon'],
  'CRC': ['Costa Rica'],
  'PYG': ['Paraguay'],
  'UYU': ['Uruguay'],
  'BOB': ['Bolivia'],
  'PEN': ['Peru'],
  'VEF': ['Venezuela'],
  'GTQ': ['Guatemala'],
  'HNL': ['Honduras'],
  'NIO': ['Nicaragua'],
  'DOP': ['Dominican Republic'],
  'JMD': ['Jamaica'],
  'TTD': ['Trinidad'],
  'KZT': ['Kazakhstan'],
  'GEL': ['Georgia'],
  'AMD': ['Armenia'],
  'AZN': ['Azerbaijan'],
  'UZS': ['Uzbekistan'],
  'BYR': ['Belarus'],
  'MDL': ['Moldova'],
  'ALL': ['Albania'],
  'MKD': ['North Macedonia'],
  'BAM': ['Bosnia'],
  'RSD': ['Serbia'],
  'HRK': ['Croatia'],
  'BGN': ['Bulgaria'],
  'ISK': ['Iceland'],
  'MNT': ['Mongolia'],
  'KHR': ['Cambodia'],
  'LAK': ['Laos'],
  'MMK': ['Myanmar'],
  'NPR': ['Nepal'],
  'BND': ['Brunei'],
  'MOP': ['Macau'],
};

/**
 * extractCountriesLocally — comprehensive local regex extraction
 * Fix 1: Runs as fallback when LLM returns 0 results
 * Fix 2: Also runs alongside LLM to merge results
 * Fix 10: Includes currency-to-country mapping
 */
function extractCountriesLocally(text: string): Set<string> {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  // Check COUNTRY_ALIASES_LOCAL
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES_LOCAL)) {
    // Use word-boundary-like check: alias must be preceded/followed by non-alpha
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx >= 0) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + alias.length < lower.length ? lower[idx + alias.length] : ' ';
      const isWordBoundary = !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
      if (isWordBoundary) {
        found.add(canonical);
      }
    }
  }

  // Check KNOWN_COUNTRIES_LOCAL (case-insensitive, word boundary)
  for (const country of KNOWN_COUNTRIES_LOCAL) {
    const countryLower = country.toLowerCase();
    const idx = lower.indexOf(countryLower);
    if (idx >= 0) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + countryLower.length < lower.length ? lower[idx + countryLower.length] : ' ';
      const isWordBoundary = !/[a-z]/.test(before) && !/[a-z]/.test(after);
      if (isWordBoundary) {
        found.add(country);
      }
    }
  }

  // Check REGIONAL_AGGREGATES_LOCAL
  for (const region of REGIONAL_AGGREGATES_LOCAL) {
    if (lower.includes(region.toLowerCase())) {
      found.add(region);
    }
  }

  // Fix 10: Currency-to-country mapping
  // Match currency codes in context (e.g., "EUR", "JPY", "CNY")
  const currencyPattern = /\b(USD|EUR|GBP|JPY|CNY|RMB|CNH|HKD|TWD|KRW|INR|AUD|CAD|SGD|CHF|SEK|NOK|DKK|PLN|CZK|HUF|RON|BRL|MXN|ARS|CLP|COP|PEN|IDR|MYR|THB|VND|PHP|TRY|ILS|SAR|AED|QAR|KWD|EGP|NGN|KES|ZAR|RUB|UAH|PKR|BDT|LKR|MAD|DZD|TND|JOD|KZT|GEL|AMD|AZN|UZS|BGN|ISK|MNT|KHR|LAK|MMK|NPR|BND|MOP)\b/g;
  const currencyMatches = text.match(currencyPattern);
  if (currencyMatches) {
    for (const currency of currencyMatches) {
      const countries = CURRENCY_TO_COUNTRIES[currency.toUpperCase()];
      if (countries) {
        countries.forEach(c => found.add(c));
      }
    }
  }

  // Also extract adjective forms (e.g., "Chinese", "Japanese", "German")
  const adjectiveMap: Record<string, string> = {
    'american': 'United States', 'u.s.': 'United States',
    'chinese': 'China', 'japanese': 'Japan', 'german': 'Germany',
    'french': 'France', 'british': 'United Kingdom', 'italian': 'Italy',
    'spanish': 'Spain', 'dutch': 'Netherlands', 'swiss': 'Switzerland',
    'swedish': 'Sweden', 'norwegian': 'Norway', 'danish': 'Denmark',
    'finnish': 'Finland', 'austrian': 'Austria', 'belgian': 'Belgium',
    'polish': 'Poland', 'hungarian': 'Hungary', 'romanian': 'Romania',
    'greek': 'Greece', 'portuguese': 'Portugal', 'irish': 'Ireland',
    'canadian': 'Canada', 'australian': 'Australia', 'brazilian': 'Brazil',
    'mexican': 'Mexico', 'argentinian': 'Argentina', 'argentine': 'Argentina',
    'chilean': 'Chile', 'colombian': 'Colombia', 'peruvian': 'Peru',
    'indian': 'India', 'korean': 'South Korea', 'taiwanese': 'Taiwan',
    'singaporean': 'Singapore', 'vietnamese': 'Vietnam', 'thai': 'Thailand',
    'malaysian': 'Malaysia', 'indonesian': 'Indonesia', 'filipino': 'Philippines',
    'philippine': 'Philippines', 'russian': 'Russia', 'ukrainian': 'Ukraine',
    'turkish': 'Turkey', 'israeli': 'Israel', 'saudi': 'Saudi Arabia',
    'emirati': 'United Arab Emirates', 'egyptian': 'Egypt', 'nigerian': 'Nigeria',
    'kenyan': 'Kenya', 'south african': 'South Africa', 'moroccan': 'Morocco',
    'algerian': 'Algeria', 'tunisian': 'Tunisia', 'jordanian': 'Jordan',
    'lebanese': 'Lebanon', 'iraqi': 'Iraq', 'iranian': 'Iran',
    'pakistani': 'Pakistan', 'bangladeshi': 'Bangladesh', 'sri lankan': 'Sri Lanka',
    'mongolian': 'Mongolia', 'kazakh': 'Kazakhstan', 'uzbek': 'Uzbekistan',
    'georgian': 'Georgia', 'armenian': 'Armenia', 'azerbaijani': 'Azerbaijan',
    'bulgarian': 'Bulgaria', 'serbian': 'Serbia', 'croatian': 'Croatia',
    'slovak': 'Slovakia', 'slovenian': 'Slovenia', 'estonian': 'Estonia',
    'latvian': 'Latvia', 'lithuanian': 'Lithuania', 'icelandic': 'Iceland',
    'new zealand': 'New Zealand', 'hong kong': 'Hong Kong',
  };

  for (const [adj, country] of Object.entries(adjectiveMap)) {
    const idx = lower.indexOf(adj);
    if (idx >= 0) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + adj.length < lower.length ? lower[idx + adj.length] : ' ';
      const isWordBoundary = !/[a-z]/.test(before) && !/[a-z]/.test(after);
      if (isWordBoundary) {
        found.add(country);
      }
    }
  }

  return found;
}

// ─── Main Narrative Parsing Function ─────────────────────────────────────────

async function parseNarrative(html: string, ticker: string): Promise<NarrativeParsingResult> {
  const start = Date.now();

  // Strip HTML tags once — used for local extraction and fallback
  const strippedText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (strippedText.length < 500) {
    return { succeeded: false, countriesFound: 0, durationMs: Date.now() - start };
  }

  // Use iXBRL-aware section extraction on raw HTML
  const sections = extractNarrativeSectionsFromHTML(html);

  // Build list of (text, sectionName) pairs to call
  const calls: Array<{ text: string; sectionName: string }> = [];

  if (sections.mdaText)          calls.push({ text: sections.mdaText,          sectionName: 'MD&A' });
  if (sections.riskText)         calls.push({ text: sections.riskText,         sectionName: 'Risk Factors' });
  if (sections.geoNotesText)     calls.push({ text: sections.geoNotesText,     sectionName: 'Geographic Notes' });
  if (sections.businessText)     calls.push({ text: sections.businessText,     sectionName: 'Business Description' });
  if (sections.segmentNotesText) calls.push({ text: sections.segmentNotesText, sectionName: 'Segment/Geographic Notes' });
  if (sections.item2PropertiesText) calls.push({ text: sections.item2PropertiesText, sectionName: 'Item 2 Properties' });
  if (sections.exhibit21Text)    calls.push({ text: sections.exhibit21Text,    sectionName: 'Exhibit 21 Subsidiaries' });
  if (sections.fallbackText)     calls.push({ text: sections.fallbackText,     sectionName: 'Annual Report (fallback)' });

  if (calls.length === 0) {
    calls.push({ text: strippedText.slice(0, 50000), sectionName: 'Annual Report' });
  }

  const uniqueLocations = new Set<string>();

  // Fix 2: ALWAYS run local extraction on all section texts (not just as fallback)
  // This guarantees baseline coverage even when LLM is unavailable or returns sparse results
  for (const { text, sectionName } of calls) {
    if (text.length < 100) continue;
    const localFound = extractCountriesLocally(text);
    if (localFound.size > 0) {
      verbose(`  [LocalExtract] ${sectionName}: ${localFound.size} locations via local regex`);
      localFound.forEach(c => uniqueLocations.add(c));
    }
  }

  // Also run local extraction on the full stripped text for maximum coverage
  const fullLocalFound = extractCountriesLocally(strippedText.substring(0, 150000));
  if (fullLocalFound.size > 0) {
    verbose(`  [LocalExtract] Full document: ${fullLocalFound.size} locations`);
    fullLocalFound.forEach(c => uniqueLocations.add(c));
  }

  const localOnlyCount = uniqueLocations.size;
  verbose(`  [LocalExtract] Total after local extraction: ${localOnlyCount} locations for ${ticker}`);

  // LLM extraction — adds precision and context on top of local results
  for (const { text, sectionName } of calls) {
    if (text.length < 200) continue;
    try {
      verbose(`  Calling extract_geographic_narrative [${sectionName}] for ${ticker} (${text.length} chars)...`);
      const result = await retryWithBackoff(
        () => callEdgeFunction<{
          extractions?: Array<{ country?: string; region?: string; confidence?: string }>;
          error?: string;
          _missingKey?: boolean;
        }>('extract_geographic_narrative', {
          text,
          sectionName,
          ticker,
        }),
        4, 1000, `extract_geographic_narrative(${ticker}/${sectionName})`
      );

      // Fix: If OPENAI_API_KEY is missing, skip LLM calls for remaining sections
      if ((result as { _missingKey?: boolean })._missingKey) {
        verbose(`  [LLM] OPENAI_API_KEY not set — skipping LLM extraction for ${ticker}`);
        break; // Local extraction already ran above, so we have baseline coverage
      }

      if (result.extractions && result.extractions.length > 0) {
        // Fix 4: Accept ALL confidence levels (high, medium, low)
        for (const e of result.extractions) {
          const loc = e.country || e.region || '';
          if (loc) uniqueLocations.add(loc);
        }
        verbose(`  [LLM] ${sectionName}: ${result.extractions.length} extractions, running unique: ${uniqueLocations.size}`);
      } else if (result.extractions && result.extractions.length === 0 && !(result as { _missingKey?: boolean })._missingKey) {
        // Fix 7: Single retry after 2s when LLM returns zero extractions
        verbose(`  [Retry] Zero LLM extractions for ${ticker}/${sectionName}, retrying after 2s...`);
        await sleep(2000);
        try {
          const retryResult = await callEdgeFunction<{
            extractions?: Array<{ country?: string; region?: string; confidence?: string }>;
            _missingKey?: boolean;
          }>('extract_geographic_narrative', { text, sectionName, ticker });
          if (retryResult.extractions && retryResult.extractions.length > 0) {
            for (const e of retryResult.extractions) {
              const loc = e.country || e.region || '';
              if (loc) uniqueLocations.add(loc);
            }
            verbose(`  [Retry] Success for ${ticker}/${sectionName}: ${retryResult.extractions.length} extractions`);
          }
        } catch (retryErr) {
          verbose(`  [Retry] Retry also failed for ${ticker}/${sectionName}: ${String(retryErr)}`);
        }
      }
    } catch (e) {
      verbose(`  Narrative parsing [${sectionName}] failed for ${ticker}: ${String(e)}`);
    }
  }

  const finalCount = uniqueLocations.size;
  verbose(`  [Narrative] Final: ${finalCount} unique locations for ${ticker} (local: ${localOnlyCount}, after LLM: ${finalCount})`);

  return {
    succeeded: finalCount > 0,
    countriesFound: finalCount,
    durationMs: Date.now() - start,
  };
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

// ─── Filing Recency Multiplier ────────────────────────────────────────────────

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
  const upper = ticker.toUpperCase();
  let category: Category = 'D';
  if (CAT_A_TICKERS.includes(upper)) category = 'A';
  else if (CAT_B_TICKERS.includes(upper)) category = 'B';
  else if (CAT_C_TICKERS.includes(upper)) category = 'C';

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
    'SBUX':'NASDAQ',
    'BABA':'NYSE','NIO':'NYSE','XPEV':'NYSE','TSM':'NYSE','TM':'NYSE',
    'SONY':'NYSE','MUFG':'NYSE','BP':'NYSE','SHEL':'NYSE','HSBC':'NYSE',
    'AZN':'NASDAQ','GSK':'NYSE','ASML':'NASDAQ','SAP':'NYSE',
    'TEVA':'NYSE','CHKP':'NASDAQ','NICE':'NASDAQ','WIX':'NASDAQ','MNDY':'NASDAQ',
  };

  return {
    name: ticker,
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
    const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8')) as BaselineResult[];
    for (const result of data) {
      completed.add(result.ticker);
    }
    log(`Loaded ${completed.size} completed tickers from checkpoint`);
  } catch (e) {
    warn(`Could not load checkpoint: ${String(e)}`);
  }
  return completed;
}

function loadCheckpointResults(): BaselineResult[] {
  if (!fs.existsSync(CHECKPOINT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8')) as BaselineResult[];
  } catch {
    return [];
  }
}

function appendCheckpoint(result: BaselineResult): void {
  const existing = loadCheckpointResults();
  existing.push(result);
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(existing, null, 2), 'utf-8');
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

  const avgScore = total > 0
    ? Math.round(r.reduce((sum, x) => sum + x.compositeConfidenceScore, 0) / total)
    : 0;
  const gradeDist = (['A', 'B', 'C', 'D', 'F'] as const).map(
    g => `${g}:${r.filter(x => x.confidenceGrade === g).length}`
  ).join(' ');

  const tableRows = r.map(x => {
    const tiers = `${x.channelTiers.revenue}/${x.channelTiers.supply}/${x.channelTiers.assets}/${x.channelTiers.financial}`;
    const spec = x.materiallySpecific ? '✅' : '❌';
    return `| ${x.ticker} | ${x.category} | ${x.isADR ? 'Yes' : 'No'} | ${x.enteredSECPath ? '✅' : '❌'} | ${x.retrievalSucceeded ? '✅' : '❌'} | ${x.filingType || 'N/A'} | ${x.structuredParsingSucceeded ? '✅' : '❌'} | ${x.narrativeParsingSucceeded ? '✅' : '❌'} | ${x.narrativeCountriesFound} | ${tiers} | ${spec} | ${x.compositeConfidenceScore} | ${x.confidenceGrade} | ${x.errorMessage ? x.errorMessage.slice(0, 40) : ''} |`;
  }).join('\n');

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
*Narrative Parsing: Local regex (always-on) + LLM (when OPENAI_API_KEY available)*
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

  if (!IS_DRY_RUN && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
    log('⚠️  WARNING: Supabase credentials are not set.');
    log('   Required environment variables (either form is accepted):');
    log('     SUPABASE_URL  or  VITE_SUPABASE_URL');
    log('     SUPABASE_ANON_KEY  or  VITE_SUPABASE_ANON_KEY');
    log('');
    log('   In GitHub Actions: add them as repository secrets:');
    log('   → Settings → Secrets and variables → Actions → New repository secret');
    log('');
    log('   Writing an error-state results file so the dashboard shows this message.');
    log('   To test without secrets: npx tsx src/scripts/runSECBaseline.ts --dry-run');

    const nowIso = new Date().toISOString();
    const errorMsg =
      'Missing required secrets: SUPABASE_URL and/or SUPABASE_ANON_KEY. ' +
      'Please add these as GitHub repository secrets under ' +
      'Settings → Secrets and variables → Actions.';

    const errorSummary: RunSummary = {
      runId,
      phase: SINGLE_TICKER ? 'single' : PHASE,
      startTime,
      endTime: nowIso,
      durationMs: 0,
      totalCompanies: 0,
      completedCompanies: 0,
      failedCompanies: 0,
      skippedCompanies: 0,
      results: [],
      error: errorMsg,
      _degradedMode: true,
      _degradedReason: errorMsg,
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(LATEST_FILE, JSON.stringify(errorSummary, null, 2), 'utf-8');
    log(`✅ Error-state latest.json written to: ${LATEST_FILE}`);

    const errorSummaryMd = [
      '# SEC Baseline Run — Error State',
      '',
      `**Run ID:** ${runId}`,
      `**Timestamp:** ${nowIso}`,
      '',
      '## ❌ Missing GitHub Secrets',
      '',
      errorMsg,
      '',
      '## How to Fix',
      '',
      '1. Go to your GitHub repository',
      '2. Click **Settings** → **Secrets and variables** → **Actions**',
      '3. Click **New repository secret** and add:',
      '   - `SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)',
      '   - `SUPABASE_ANON_KEY` — your Supabase anon/public key',
      '4. Re-run the **SEC Runtime Baseline** workflow',
    ].join('\n');
    fs.writeFileSync(SUMMARY_FILE, errorSummaryMd, 'utf-8');
    log(`✅ Error-state latest-summary.md written to: ${SUMMARY_FILE}`);
    log('');
    log('   Exiting with code 0 so the workflow commits these files to the repo.');
    return;
  }

  if (!IS_DRY_RUN) {
    log(`✅ Supabase URL: ${SUPABASE_URL.slice(0, 30)}...`);
  }

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

  tickers = [...new Set(tickers)];
  const total = tickers.length;

  log(`\nTotal tickers to process: ${total}`);

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

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

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

  const isoStamp = endTime.replace(/[:.]/g, '-').replace('Z', 'Z');
  const RESULTS_FILE = path.join(OUTPUT_DIR, `baseline-${isoStamp}.json`);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2), 'utf-8');
  log(`\n✅ Timestamped results written to: ${RESULTS_FILE}`);

  fs.writeFileSync(LATEST_FILE, JSON.stringify(summary, null, 2), 'utf-8');
  log(`✅ Latest results written to:     ${LATEST_FILE}`);

  const summaryMd = generateSummaryReport(summary);
  fs.writeFileSync(SUMMARY_FILE, summaryMd, 'utf-8');
  log(`✅ Summary report written to:     ${SUMMARY_FILE}`);

  const specific = allResults.filter(r => r.materiallySpecific).length;
  const entered = allResults.filter(r => r.enteredSECPath).length;
  const retrieved = allResults.filter(r => r.retrievalSucceeded).length;
  const narrativeParsed = allResults.filter(r => r.narrativeParsingSucceeded).length;
  const durationSec = Math.round(durationMs / 1000);

  log('\n═══════════════════════════════════════════════════════════════');
  log(`  Baseline Complete in ${Math.floor(durationSec/60)}m ${durationSec%60}s`);
  log(`  Companies processed:    ${allResults.length}`);
  log(`  Entered SEC path:       ${entered} (${((entered/allResults.length)*100).toFixed(1)}%)`);
  log(`  Retrieval succeeded:    ${retrieved} (${((retrieved/allResults.length)*100).toFixed(1)}%)`);
  log(`  Narrative parsed:       ${narrativeParsed} (${((narrativeParsed/allResults.length)*100).toFixed(1)}%)`);
  log(`  Materially specific:    ${specific} (${((specific/allResults.length)*100).toFixed(1)}%)`);
  log(`  Fallback-dominant:      ${allResults.length - specific} (${(((allResults.length-specific)/allResults.length)*100).toFixed(1)}%)`);
  log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error(`[FATAL] ${String(err)}`);
  process.exit(1);
});
