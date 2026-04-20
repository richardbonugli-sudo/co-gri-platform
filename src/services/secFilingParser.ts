/**
 * SEC Filing Parser - Core Engine
 * 
 * Extracts structured data from SEC EDGAR filings (10-K, 10-Q, 20-F)
 * Implements EXPOSURE PARSING DECISION TREES - Step 1 for all channels
 * 
 * Key Functions:
 * 1. Fetch SEC filings from EDGAR via Supabase Edge Function
 * 2. Parse HTML tables (revenue segments, PP&E, debt)
 * 3. Extract XBRL data when available
 * 4. Parse narrative sections (Item 1, Item 2, MD&A, Risk Factors)
 * 5. Extract Note disclosures (Note 4 financial instruments, PP&E notes)
 * 6. LLM-based narrative extraction (FIX #5)
 * 7. Exhibit 21 subsidiary parsing (NEW - Phase 1)
 * 
 * CHANGELOG:
 * - 2025-12-09: Added Exhibit 21 (Subsidiaries) parsing for operations/assets evidence
 * - 2025-12-08: Expanded table pattern recognition (+20 patterns) for higher capture rate
 * - 2025-12-08: Integrated LLM narrative extractor (FIX #5)
 * - 2025-12-08: Improved table filtering to exclude operating expenses (FIX #6)
 */

import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { 
  extractNarrativeData, 
  extractionsToRevenueSegments, 
  extractionsToSupplierLocations,
  extractionsToFacilityLocations 
} from './llmNarrativeExtractor';
import { parseExhibit21, Exhibit21Data } from './dataIntegration/exhibit21Parser';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SECFiling {
  ticker: string;
  cik: string;
  formType: '10-K' | '10-Q' | '20-F' | '8-K';
  filingDate: string;
  reportDate: string;
  htmlUrl: string;
  xbrlUrl?: string;
  accessionNumber: string;
  html?: string;
}

export interface RevenueSegment {
  region: string;
  countries: string[];
  revenueAmount: number;
  revenuePercentage: number;
  fiscalYear: number;
  source: 'structured_table' | 'narrative' | 'xbrl' | 'exhibit_21';
  confidence: 'high' | 'medium' | 'low';
  tableContext?: string;
}

export interface PPESegment {
  region: string;
  countries: string[];
  ppeAmount: number;
  ppePercentage: number;
  fiscalYear: number;
  source: 'structured_table' | 'narrative' | 'xbrl' | 'exhibit_21';
  confidence: 'high' | 'medium' | 'low';
  assetType?: 'land' | 'buildings' | 'machinery' | 'equipment' | 'construction_in_progress' | 'total';
}

export interface DebtSecurity {
  jurisdiction: string;
  currency: string;
  principalAmount: number;
  maturityDate?: string;
  interestRate?: number;
  source: 'structured_table' | 'narrative' | 'xbrl';
  confidence: 'high' | 'medium' | 'low';
  securityType?: 'senior_notes' | 'commercial_paper' | 'credit_facility' | 'bonds' | 'other';
}

export interface SupplierLocation {
  country: string;
  supplierType: 'manufacturing' | 'component' | 'raw_material' | 'logistics' | 'other';
  source: 'structured_list' | 'narrative' | 'sustainability_report';
  confidence: 'high' | 'medium' | 'low';
  context?: string;
}

export interface FacilityLocation {
  country: string;
  city?: string;
  facilityType: 'office' | 'manufacturing' | 'warehouse' | 'r&d' | 'data_center' | 'retail' | 'other';
  source: 'item_2_properties' | 'narrative' | 'structured_table' | 'exhibit_21';
  confidence: 'high' | 'medium' | 'low';
  context?: string;
}

export interface ParsedSECData {
  ticker: string;
  cik: string;
  filingDate: string;
  reportDate: string;
  formType: string;
  
  // Revenue data (Wᵣ)
  revenueSegments: RevenueSegment[];
  revenueTableFound: boolean;
  revenueNarrativeContext?: string;
  
  // PP&E data (Wₚ)
  ppeSegments: PPESegment[];
  ppeTableFound: boolean;
  ppeNarrativeContext?: string;
  facilityLocations: FacilityLocation[];
  
  // Debt data (W𝒻)
  debtSecurities: DebtSecurity[];
  debtTableFound: boolean;
  debtNarrativeContext?: string;
  treasuryCenters: string[];
  
  // Supply chain data (Wₛ)
  supplierLocations: SupplierLocation[];
  supplierListFound: boolean;
  supplyChainNarrativeContext?: string;
  
  // Exhibit 21 data (NEW - Phase 1)
  exhibit21Data?: Exhibit21Data;
  exhibit21Found: boolean;
  
  // LLM extraction metadata (FIX #5)
  llmExtractionsUsed: boolean;
  llmSectionsAnalyzed: string[];
  llmProcessingTime?: number;
  
  // Parsing metadata
  parsingTimestamp: string;
  parsingSuccess: boolean;
  parsingErrors: string[];
  sectionsFound: string[];
}

// ============================================================================
// CIK MAPPING - Hardcoded fallback for common tickers
// ============================================================================

const TICKER_TO_CIK_MAP: Record<string, string> = {
  // ── United States — Core Large-Caps ──────────────────────────────────────
  'AAPL':    '0000320193',  // Apple Inc.
  'MSFT':    '0000789019',  // Microsoft Corporation
  'GOOGL':   '0001652044',  // Alphabet Inc. Class A
  'GOOG':    '0001652044',  // Alphabet Inc. Class C
  'AMZN':    '0001018724',  // Amazon.com Inc.
  'TSLA':    '0001318605',  // Tesla Inc.
  'META':    '0001326801',  // Meta Platforms Inc.
  'NVDA':    '0001045810',  // NVIDIA Corporation
  'BRK.A':   '0001067983',  // Berkshire Hathaway Class A
  'BRK.B':   '0001067983',  // Berkshire Hathaway Class B
  'JPM':     '0000019617',  // JPMorgan Chase & Co.
  'JNJ':     '0000200406',  // Johnson & Johnson
  'V':       '0001403161',  // Visa Inc.
  'WMT':     '0000104169',  // Walmart Inc.
  'PG':      '0000080424',  // Procter & Gamble Company
  'MA':      '0001141391',  // Mastercard Incorporated
  'UNH':     '0000731766',  // UnitedHealth Group Inc.
  'HD':      '0000354950',  // Home Depot Inc.
  'DIS':     '0001744489',  // Walt Disney Company
  'BAC':     '0000070858',  // Bank of America Corporation
  'ADBE':    '0000796343',  // Adobe Inc.
  'CRM':     '0001108524',  // Salesforce Inc.
  'NFLX':    '0001065280',  // Netflix Inc.
  'CMCSA':   '0001166691',  // Comcast Corporation
  'XOM':     '0000034088',  // Exxon Mobil Corporation
  'PFE':     '0000078003',  // Pfizer Inc.
  'CSCO':    '0000858877',  // Cisco Systems Inc.
  'INTC':    '0000050863',  // Intel Corporation
  'VZ':      '0000732712',  // Verizon Communications Inc.
  'KO':      '0000021344',  // Coca-Cola Company
  'PEP':     '0000077476',  // PepsiCo Inc.
  'T':       '0000732717',  // AT&T Inc.
  'MRK':     '0000310158',  // Merck & Co. Inc.
  'ABT':     '0000001800',  // Abbott Laboratories
  'NKE':     '0000320187',  // Nike Inc.
  'ORCL':    '0001341439',  // Oracle Corporation
  'AMD':     '0000002488',  // Advanced Micro Devices Inc.
  'QCOM':    '0000804328',  // Qualcomm Incorporated
  'IBM':     '0000051143',  // International Business Machines
  'BA':      '0000012927',  // Boeing Company
  'GE':      '0000040545',  // GE Aerospace
  // ── United States — Additional Large-Caps ────────────────────────────────
  'ABBV':    '0001551152',  // AbbVie Inc.
  'AXP':     '0000004962',  // American Express Company
  'BLK':     '0001364742',  // BlackRock Inc.
  'C':       '0000831001',  // Citigroup Inc.
  'COP':     '0001163165',  // ConocoPhillips
  'CVX':     '0000093410',  // Chevron Corporation
  'DHR':     '0000313616',  // Danaher Corporation
  'GS':      '0000886982',  // Goldman Sachs Group Inc.
  'LLY':     '0000059478',  // Eli Lilly and Company
  'MS':      '0000895421',  // Morgan Stanley
  'SBUX':    '0000829224',  // Starbucks Corporation
  'SLB':     '0000087347',  // Schlumberger Limited
  'TMO':     '0000097476',  // Thermo Fisher Scientific
  'WFC':     '0000072971',  // Wells Fargo & Company
  // ── Singapore ────────────────────────────────────────────────────────────
  'J36':     '0000870016',  // Jardine Matheson (SGX)
  'J36.SI':  '0000870016',  // Jardine Matheson (SGX suffix)
  'JARD':    '0000870016',  // Jardine Matheson (OTC)
  // ── ADRs — China ─────────────────────────────────────────────────────────
  'BABA':    '0001577552',  // Alibaba Group Holding Limited
  'PDD':     '0001737806',  // PDD Holdings Inc.
  'JD':      '0001549802',  // JD.com Inc.
  'BIDU':    '0001329099',  // Baidu Inc.
  'NIO':     '0001736541',  // NIO Inc.
  'LI':      '0001791706',  // Li Auto Inc.
  'XPEV':    '0001840063',  // XPeng Inc.
  'NTES':    '0001110646',  // NetEase Inc.
  'BILI':    '0001723690',  // Bilibili Inc.
  'YUMC':    '0001673358',  // Yum China Holdings Inc.
  // ── ADRs — Taiwan ────────────────────────────────────────────────────────
  'TSM':     '0001046179',  // Taiwan Semiconductor Manufacturing
  'ASX':     '0001122411',  // ASE Technology Holding Co. Ltd.
  'CHT':     '0001132924',  // Chunghwa Telecom Co. Ltd.
  // ── ADRs — South Korea ───────────────────────────────────────────────────
  'KB':      '0001445930',  // KB Financial Group Inc.
  'SHG':     '0001263043',  // Shinhan Financial Group Co Ltd
  'PKX':     '0000889132',  // POSCO Holdings Inc.
  'LPL':     '0001290109',  // LG Display Co. Ltd.
  'KEP':     '0000887225',  // Korea Electric Power Corporation
  // ── ADRs — Japan ─────────────────────────────────────────────────────────
  'TM':      '0001094517',  // Toyota Motor Corporation
  'SONY':    '0000313838',  // Sony Group Corporation
  'MUFG':    '0000067088',  // Mitsubishi UFJ Financial Group
  'SMFG':    '0001022837',  // Sumitomo Mitsui Financial Group
  'NMR':     '0001163653',  // Nomura Holdings Inc.
  'MFG':     '0001335730',  // Mizuho Financial Group Inc.
  'HMC':     '0000715153',  // Honda Motor Co. Ltd.
  'SIFY':    '0001094324',  // Sify Technologies Limited
  // ── ADRs — India ─────────────────────────────────────────────────────────
  'INFY':    '0001067491',  // Infosys Limited
  'WIT':     '0001123799',  // Wipro Limited
  'HDB':     '0001144967',  // HDFC Bank Limited
  'IBN':     '0001103838',  // ICICI Bank Limited
  'REDY':    '0001135971',  // Dr. Reddy's Laboratories Ltd.
  // ── ADRs — Brazil ────────────────────────────────────────────────────────
  'PBR':     '0001119639',  // Petróleo Brasileiro S.A. (Petrobras)
  'VALE':    '0000917851',  // Vale S.A.
  'ITUB':    '0001132597',  // Itaú Unibanco Holding S.A.
  'BBD':     '0001160330',  // Banco Bradesco S.A.
  'ABEV':    '0001565025',  // Ambev S.A.
  'SBS':     '0001170858',  // Companhia de Saneamento Básico (Sabesp)
  'TIMB':    '0001826168',  // TIM S.A.
  'GGB':     '0001073404',  // Gerdau S.A.
  'LTM':     '0001047716',  // LATAM Airlines Group S.A.
  // ── ADRs — United Kingdom ────────────────────────────────────────────────
  'BP':      '0000313807',  // BP plc
  'SHEL':    '0001306965',  // Shell plc
  'HSBC':    '0001089113',  // HSBC Holdings plc
  'AZN':     '0000901832',  // AstraZeneca PLC
  'GSK':     '0001131399',  // GSK plc
  'DEO':     '0000835403',  // Diageo plc
  'UL':      '0000217410',  // Unilever PLC
  'BCS':     '0000312069',  // Barclays PLC
  'RIO':     '0000863064',  // Rio Tinto Group
  'BTI':     '0001303523',  // British American Tobacco plc
  // ── ADRs — France ────────────────────────────────────────────────────────
  'SNY':     '0001121404',  // Sanofi
  'TTE':     '0000879764',  // TotalEnergies SE
  // ── ADRs — Germany ───────────────────────────────────────────────────────
  'SAP':     '0001000184',  // SAP SE
  'DTEGY':   '0000946770',  // Deutsche Telekom AG
  // ── ADRs — Netherlands ───────────────────────────────────────────────────
  'ASML':    '0000937966',  // ASML Holding N.V.
  'ING':     '0001039765',  // ING Groep N.V.
  'PHG':     '0000313216',  // Koninklijke Philips N.V.
  'STLA':    '0001605484',  // Stellantis N.V.
  // ── ADRs — Switzerland / Denmark ─────────────────────────────────────────
  'NVO':     '0000353278',  // Novo Nordisk A/S (Denmark)
  'NVS':     '0001114448',  // Novartis AG
  'UBS':     '0001610520',  // UBS Group AG
  // ── ADRs — Australia ─────────────────────────────────────────────────────
  'BHP':     '0000811809',  // BHP Group Limited
  // ── ADRs — Israel ────────────────────────────────────────────────────────
  'TEVA':    '0000818686',  // Teva Pharmaceutical Industries
  'CHKP':    '0001015922',  // Check Point Software Technologies
  'NICE':    '0001003935',  // NICE Ltd.
  'WIX':     '0001576789',  // Wix.com Ltd.
  'MNDY':    '0001845338',  // Monday.com Ltd.
  // ── ADRs — Mexico ────────────────────────────────────────────────────────
  'AMX':     '0001129137',  // América Móvil S.A.B. de C.V.
  'FMX':     '0001061736',  // Fomento Económico Mexicano (FEMSA)
  'TV':      '0000912892',  // Grupo Televisa S.A.B.
  'CX':      '0001076378',  // CEMEX S.A.B. de C.V.
  // ── ADRs — Argentina ─────────────────────────────────────────────────────
  'YPF':     '0000904851',  // YPF Sociedad Anónima
  'CRESY':   '0001034957',  // Cresud S.A.C.I.F.A.
  'IRS':     '0000933267',  // IRSA Inversiones y Representaciones S.A.
  'BMA':     '0001347426',  // Banco Macro S.A.
  'GGAL':    '0001114700',  // Grupo Financiero Galicia S.A.
  'SUPV':    '0001517399',  // Grupo Supervielle S.A.
  'TEO':     '0000932470',  // Telecom Argentina S.A.
  'TX':      '0001342874',  // Ternium S.A.
  'PAM':     '0001469395',  // Pampa Energía S.A.
  'LOMA':    '0001711375',  // Loma Negra Compañía Industrial Argentina
  // ── ADRs — Chile ─────────────────────────────────────────────────────────
  'SQM':     '0000909037',  // Sociedad Química y Minera de Chile S.A.
  // ── ADRs — Colombia ──────────────────────────────────────────────────────
  'CIB':     '0002058897',  // Bancolombia S.A.
  // ── ADRs — Spain ─────────────────────────────────────────────────────────
  'SAN':     '0000891478',  // Banco Santander S.A.
  // ── ADRs — South Africa ──────────────────────────────────────────────────
  'GOLD':    '0001591588',  // Barrick Gold Corporation
  'GFI':     '0001172724',  // Gold Fields Limited
  'SBSW':    '0001786909',  // Sibanye Stillwater Limited
  'HMY':     '0001023514',  // Harmony Gold Mining Company Limited
  'AU':      '0001973832',  // AngloGold Ashanti Limited
  // ── ADRs — Miscellaneous ─────────────────────────────────────────────────
  'ABBNY':   '0001091587',  // ABB Ltd (Switzerland)
};

// ============================================================================
// SEC EDGAR API FUNCTIONS
// ============================================================================

export async function getCIKFromTicker(ticker: string, maxRetries: number = 3): Promise<string | null> {
  try {
    const tickerUpper = ticker.toUpperCase();
    
    if (TICKER_TO_CIK_MAP[tickerUpper]) {
      console.log(`[SEC Parser] ✅ CIK resolved from cache: ${TICKER_TO_CIK_MAP[tickerUpper]}`);
      return TICKER_TO_CIK_MAP[tickerUpper];
    }
    
    console.log(`[SEC Parser] Trying Supabase Edge Function for ${ticker}...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch_sec_cik', {
          body: { ticker }
        });
        
        console.log(`[SEC Parser] Edge function response (attempt ${attempt}/${maxRetries}):`, { data, error });
        
        if (!error && data?.cik) {
          console.log(`[SEC Parser] ✅ CIK resolved via Edge Function: ${data.cik}`);
          TICKER_TO_CIK_MAP[tickerUpper] = data.cik;
          return data.cik;
        } else if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`[SEC Parser] Retrying in ${backoffMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          console.log(`[SEC Parser] Edge function error after ${maxRetries} attempts:`, error);
        }
      } catch (edgeFunctionError) {
        console.log(`[SEC Parser] Edge function exception (attempt ${attempt}/${maxRetries}):`, edgeFunctionError);
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    console.log(`[SEC Parser] ❌ Could not resolve CIK for ${ticker} after ${maxRetries} attempts`);
    return null;
    
  } catch (error) {
    console.error(`[SEC Parser] Error fetching CIK for ${ticker}:`, error);
    return null;
  }
}

export async function getLatestFilingWithHTML(cik: string, ticker: string): Promise<SECFiling | null> {
  try {
    console.log(`[SEC Parser] Fetching filing via Supabase Edge Function for CIK ${cik}...`);
    
    let { data, error } = await supabase.functions.invoke('fetch_sec_filing', {
      body: { cik, formType: '10-K' }
    });
    
    console.log(`[SEC Parser] 10-K response:`, { data, error, hasData: !!data, hasError: !!error });
    
    if (error || !data) {
      console.log(`[SEC Parser] 10-K not found, trying 20-F...`);
      const result = await supabase.functions.invoke('fetch_sec_filing', {
        body: { cik, formType: '20-F' }
      });
      data = result.data;
      error = result.error;
      console.log(`[SEC Parser] 20-F response:`, { data, error, hasData: !!data, hasError: !!error });
    }
    
    if (error) {
      console.error(`[SEC Parser] Edge function error details:`, JSON.stringify(error, null, 2));
      return null;
    }
    
    if (!data) {
      console.error(`[SEC Parser] No data returned from edge function`);
      return null;
    }
    
    if (!data.html) {
      console.error(`[SEC Parser] No HTML in response:`, Object.keys(data));
      return null;
    }
    
    console.log(`[SEC Parser] ✅ Filing fetched: ${data.formType} (${data.filingDate}), HTML length: ${data.htmlLength}`);
    
    return {
      ticker,
      cik: data.cik,
      formType: data.formType as '10-K' | '20-F',
      filingDate: data.filingDate,
      reportDate: data.reportDate,
      accessionNumber: data.accessionNumber,
      htmlUrl: data.htmlUrl,
      html: data.html
    };
    
  } catch (error) {
    console.error(`[SEC Parser] Exception fetching filing for CIK ${cik}:`, error);
    return null;
  }
}

// ============================================================================
// HTML TABLE PARSING FUNCTIONS
// ============================================================================

export function extractAllTables(html: string): cheerio.Cheerio<cheerio.Element>[] {
  const $ = cheerio.load(html);
  const tables: cheerio.Cheerio<cheerio.Element>[] = [];
  
  $('table').each((_, element) => {
    tables.push($(element));
  });
  
  return tables;
}

/**
 * Check if table is a revenue segment table
 * FIX #6: Added exclusion patterns to filter out operating expense tables
 */
export function isRevenueTable(table: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): boolean {
  const tableText = table.text().toLowerCase();
  
  // FIX #6: EXCLUSION PATTERNS - Filter out non-geographic tables FIRST
  const exclusionPatterns = [
    'cost of sales', 'cost of revenue', 'selling and marketing', 'selling, general',
    'research and development', 'operating expenses', 'operating income',
    'iphone', 'ipad', 'mac', 'wearables', 'product category'
  ];
  
  const hasExclusionPattern = exclusionPatterns.some(pattern => tableText.includes(pattern));
  
  if (hasExclusionPattern) {
    return false;
  }
  
  const revenueKeywords = [
    'revenue', 'sales', 'net sales', 'revenues', 'net revenues'
  ];
  
  const geographicKeywords = [
    'geographic', 'geographical', 'region', 'segment', 'country', 'area',
    'by geography', 'by region', 'by location'
  ];
  
  const regionalPatterns = [
    'americas', 'emea', 'asia-pacific', 'apac', 'europe', 'china', 'japan'
  ];
  
  const hasRevenue = revenueKeywords.some(kw => tableText.includes(kw));
  const hasGeographic = geographicKeywords.some(kw => tableText.includes(kw));
  const hasRegionalPattern = regionalPatterns.some(pattern => tableText.includes(pattern));
  
  const isMatch = (hasRevenue && hasGeographic) || (hasRevenue && hasRegionalPattern);
  
  if (isMatch) {
    console.log(`[SEC Parser] ✅ Revenue table detected`);
  }
  
  return isMatch;
}

export function isPPETable(table: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): boolean {
  const tableText = table.text().toLowerCase();
  
  const ppeKeywords = [
    'property', 'plant', 'equipment', 'pp&e', 'long-lived', 'tangible assets', 'fixed assets'
  ];
  
  const geographicKeywords = [
    'geographic', 'geographical', 'region', 'country', 'location'
  ];
  
  const hasPPE = ppeKeywords.some(kw => tableText.includes(kw));
  const hasGeographic = geographicKeywords.some(kw => tableText.includes(kw));
  
  return hasPPE && hasGeographic;
}

export function isDebtTable(table: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): boolean {
  const tableText = table.text().toLowerCase();
  
  const debtKeywords = [
    'debt', 'notes', 'bonds', 'securities', 'borrowings', 'credit facility'
  ];
  
  const currencyKeywords = [
    'currency', 'denomination', 'principal', 'maturity', 'usd', 'eur', 'gbp', 'jpy'
  ];
  
  const hasDebt = debtKeywords.some(kw => tableText.includes(kw));
  const hasCurrency = currencyKeywords.some(kw => tableText.includes(kw));
  
  return hasDebt && hasCurrency;
}

/**
 * Parse revenue segment table
 * FIX #6: Added row-level filtering and deduplication
 */
export function parseRevenueTable(
  table: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI,
  fiscalYear: number
): RevenueSegment[] {
  const segments: RevenueSegment[] = [];
  
  const rows: string[][] = [];
  table.find('tr').each((_, row) => {
    const cells: string[] = [];
    $(row).find('td, th').each((_, cell) => {
      cells.push($(cell).text().trim());
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  });
  
  if (rows.length < 2) return segments;
  
  const headerRow = rows[0];
  let regionColIdx = 0;
  let revenueColIdx = 1;
  
  headerRow.forEach((header, idx) => {
    const headerLower = header.toLowerCase();
    if (headerLower.includes('region') || headerLower.includes('geographic') || headerLower.includes('segment')) {
      regionColIdx = idx;
    }
    if (headerLower.includes('revenue') || headerLower.includes('sales') || headerLower.includes('net sales')) {
      if (revenueColIdx === 1 || idx > regionColIdx) revenueColIdx = idx;
    }
  });
  
  let totalRevenue = 0;
  const tempSegments: Array<{ region: string; amount: number }> = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= Math.max(regionColIdx, revenueColIdx)) continue;
    
    const region = row[regionColIdx].trim();
    const revenueStr = row[revenueColIdx];
    
    // FIX #6: Skip empty regions
    if (!region || region.length === 0) {
      continue;
    }
    
    // Skip totals
    if (region.toLowerCase().includes('total') || region.toLowerCase().includes('consolidated')) {
      continue;
    }
    
    // FIX #6: Skip non-geographic rows
    const nonGeographicPatterns = [
      'cost of sales', 'cost of revenue', 'selling', 'marketing', 
      'research', 'development', 'operating', 'income', 'expense',
      'iphone', 'ipad', 'mac', 'wearables', 'services', 'product'
    ];
    
    if (nonGeographicPatterns.some(pattern => region.toLowerCase().includes(pattern))) {
      console.log(`[SEC Parser] ⚠️ Skipping non-geographic row: ${region}`);
      continue;
    }
    
    const revenueMatch = revenueStr.replace(/[$,()]/g, '').match(/[\d.]+/);
    if (!revenueMatch) continue;
    
    const revenueAmount = parseFloat(revenueMatch[0]);
    if (isNaN(revenueAmount) || revenueAmount <= 0) continue;
    
    tempSegments.push({ region, amount: revenueAmount });
    totalRevenue += revenueAmount;
  }
  
  // FIX #6: Deduplicate by region name
  const regionMap = new Map<string, number>();
  for (const seg of tempSegments) {
    const existing = regionMap.get(seg.region);
    if (!existing || seg.amount > existing) {
      regionMap.set(seg.region, seg.amount);
    }
  }
  
  totalRevenue = Array.from(regionMap.values()).reduce((sum, amt) => sum + amt, 0);
  
  for (const [region, amount] of regionMap.entries()) {
    segments.push({
      region,
      countries: [],
      revenueAmount: amount,
      revenuePercentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
      fiscalYear,
      source: 'structured_table',
      confidence: 'high',
      tableContext: `Revenue segment table from 10-K`
    });
  }
  
  console.log(`[SEC Parser] ✅ Parsed ${segments.length} unique revenue segments`);
  
  return segments;
}

export function parsePPETable(
  table: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI,
  fiscalYear: number
): PPESegment[] {
  const segments: PPESegment[] = [];
  
  const rows: string[][] = [];
  table.find('tr').each((_, row) => {
    const cells: string[] = [];
    $(row).find('td, th').each((_, cell) => {
      cells.push($(cell).text().trim());
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  });
  
  if (rows.length < 2) return segments;
  
  const headerRow = rows[0];
  let regionColIdx = 0;
  let ppeColIdx = 1;
  
  headerRow.forEach((header, idx) => {
    const headerLower = header.toLowerCase();
    if (headerLower.includes('region') || headerLower.includes('geographic') || headerLower.includes('location') || headerLower.includes('country')) {
      regionColIdx = idx;
    }
    if (headerLower.includes('property') || headerLower.includes('plant') || headerLower.includes('equipment') || headerLower.includes('pp&e') || headerLower.includes('assets')) {
      if (ppeColIdx === 1 || idx > regionColIdx) ppeColIdx = idx;
    }
  });
  
  let totalPPE = 0;
  const tempSegments: Array<{ region: string; amount: number }> = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= Math.max(regionColIdx, ppeColIdx)) continue;
    
    const region = row[regionColIdx];
    const ppeStr = row[ppeColIdx];
    
    if (region.toLowerCase().includes('total') || region.toLowerCase().includes('consolidated')) {
      continue;
    }
    
    const ppeMatch = ppeStr.replace(/[$,()]/g, '').match(/[\d.]+/);
    if (!ppeMatch) continue;
    
    const ppeAmount = parseFloat(ppeMatch[0]);
    if (isNaN(ppeAmount) || ppeAmount <= 0) continue;
    
    tempSegments.push({ region, amount: ppeAmount });
    totalPPE += ppeAmount;
  }
  
  for (const seg of tempSegments) {
    segments.push({
      region: seg.region,
      countries: [],
      ppeAmount: seg.amount,
      ppePercentage: totalPPE > 0 ? (seg.amount / totalPPE) * 100 : 0,
      fiscalYear,
      source: 'structured_table',
      confidence: 'high',
      assetType: 'total'
    });
  }
  
  return segments;
}

export function parseDebtTable(
  table: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI
): DebtSecurity[] {
  const securities: DebtSecurity[] = [];
  
  const rows: string[][] = [];
  table.find('tr').each((_, row) => {
    const cells: string[] = [];
    $(row).find('td, th').each((_, cell) => {
      cells.push($(cell).text().trim());
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  });
  
  if (rows.length < 2) return securities;
  
  const currencyToJurisdiction: Record<string, string> = {
    'USD': 'United States',
    'EUR': 'Eurozone',
    'GBP': 'United Kingdom',
    'JPY': 'Japan',
    'CHF': 'Switzerland',
    'CAD': 'Canada',
    'AUD': 'Australia',
    'CNY': 'China',
    'HKD': 'Hong Kong',
    'SGD': 'Singapore'
  };
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    let currency = '';
    let principal = 0;
    
    for (const cell of row) {
      const match = cell.match(/\b(USD|EUR|GBP|JPY|CHF|CAD|AUD|CNY|HKD|SGD)\b/i);
      if (match) {
        currency = match[1].toUpperCase();
      }
      
      const principalMatch = cell.replace(/[$,()]/g, '').match(/[\d.]+/);
      if (principalMatch && parseFloat(principalMatch[0]) > 100) {
        principal = parseFloat(principalMatch[0]);
      }
    }
    
    if (currency && principal > 0) {
      const jurisdiction = currencyToJurisdiction[currency] || 'Unknown';
      
      securities.push({
        jurisdiction,
        currency,
        principalAmount: principal,
        source: 'structured_table',
        confidence: 'high',
        securityType: 'senior_notes'
      });
    }
  }
  
  return securities;
}

// ============================================================================
// NARRATIVE SECTION PARSING
// ============================================================================

export function extractItem2Properties(html: string): FacilityLocation[] {
  const facilities: FacilityLocation[] = [];
  const $ = cheerio.load(html);
  
  let item2Text = '';
  $('body').find('*').each((_, element) => {
    const text = $(element).text();
    if (text.match(/Item\s+2[.\s]+Properties/i)) {
      let current = $(element).next();
      let count = 0;
      while (current.length > 0 && count < 20) {
        item2Text += current.text() + '\n';
        current = current.next();
        count++;
      }
      return false;
    }
  });
  
  if (!item2Text) return facilities;
  
  const facilityKeywords = ['office', 'facility', 'plant', 'warehouse', 'manufacturing', 'r&d', 'research', 'data center', 'headquarters'];
  const countryPattern = /\b(United States|China|Japan|Germany|United Kingdom|France|Canada|Australia|India|Brazil|Mexico|South Korea|Taiwan|Singapore|Vietnam|Thailand|Malaysia|Indonesia|Philippines|Hong Kong|Netherlands|Switzerland|Belgium|Sweden|Spain|Italy|Poland|Austria|Norway|Denmark|Ireland|Finland|Portugal|Greece|Czech Republic|Hungary|Romania|Russia|Saudi Arabia|UAE|Israel|Turkey|South Africa|Nigeria|Egypt|Argentina|Chile|Colombia|Peru)\b/gi;
  
  const sentences = item2Text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const hasFacility = facilityKeywords.some(kw => sentence.toLowerCase().includes(kw));
    if (!hasFacility) continue;
    
    const countryMatches = sentence.match(countryPattern);
    if (!countryMatches) continue;
    
    for (const country of countryMatches) {
      let facilityType: FacilityLocation['facilityType'] = 'other';
      
      if (sentence.toLowerCase().includes('office')) facilityType = 'office';
      else if (sentence.toLowerCase().includes('manufacturing') || sentence.toLowerCase().includes('plant')) facilityType = 'manufacturing';
      else if (sentence.toLowerCase().includes('warehouse')) facilityType = 'warehouse';
      else if (sentence.toLowerCase().includes('r&d') || sentence.toLowerCase().includes('research')) facilityType = 'r&d';
      else if (sentence.toLowerCase().includes('data center')) facilityType = 'data_center';
      
      facilities.push({
        country,
        facilityType,
        source: 'item_2_properties',
        confidence: 'high',
        context: sentence.trim()
      });
    }
  }
  
  return facilities;
}

export function extractSupplierLocations(html: string): SupplierLocation[] {
  const suppliers: SupplierLocation[] = [];
  const $ = cheerio.load(html);
  
  const bodyText = $('body').text();
  
  const supplyKeywords = ['supplier', 'supply chain', 'manufacturing partner', 'contract manufacturer', 'component', 'raw material'];
  const countryPattern = /\b(China|Taiwan|South Korea|Japan|Vietnam|Thailand|Malaysia|Singapore|Indonesia|Philippines|United States|Mexico|Germany|India|Brazil)\b/gi;
  
  const sentences = bodyText.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const hasSupply = supplyKeywords.some(kw => sentence.toLowerCase().includes(kw));
    if (!hasSupply) continue;
    
    const countryMatches = sentence.match(countryPattern);
    if (!countryMatches) continue;
    
    for (const country of countryMatches) {
      let supplierType: SupplierLocation['supplierType'] = 'other';
      
      if (sentence.toLowerCase().includes('manufacturing')) supplierType = 'manufacturing';
      else if (sentence.toLowerCase().includes('component')) supplierType = 'component';
      else if (sentence.toLowerCase().includes('raw material')) supplierType = 'raw_material';
      
      suppliers.push({
        country,
        supplierType,
        source: 'narrative',
        confidence: 'medium',
        context: sentence.trim()
      });
    }
  }
  
  return suppliers;
}

export function extractTreasuryCenters(html: string): string[] {
  const centers: Set<string> = new Set();
  const $ = cheerio.load(html);
  
  const bodyText = $('body').text();
  
  const treasuryKeywords = ['treasury', 'cash management', 'liquidity', 'foreign subsidiary cash'];
  const countryPattern = /\b(Ireland|Singapore|Netherlands|Switzerland|Luxembourg|Hong Kong|United Kingdom|Cayman Islands|Bermuda)\b/gi;
  
  const sentences = bodyText.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const hasTreasury = treasuryKeywords.some(kw => sentence.toLowerCase().includes(kw));
    if (!hasTreasury) continue;
    
    const countryMatches = sentence.match(countryPattern);
    if (countryMatches) {
      countryMatches.forEach(c => centers.add(c));
    }
  }
  
  return Array.from(centers);
}

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

export async function parseSECFiling(ticker: string): Promise<ParsedSECData | null> {
  console.log(`\n[SEC Parser] ========================================`);
  console.log(`[SEC Parser] Parsing SEC Filing for ${ticker}`);
  console.log(`[SEC Parser] ========================================`);
  
  const result: ParsedSECData = {
    ticker,
    cik: '',
    filingDate: '',
    reportDate: '',
    formType: '',
    revenueSegments: [],
    revenueTableFound: false,
    ppeSegments: [],
    ppeTableFound: false,
    facilityLocations: [],
    debtSecurities: [],
    debtTableFound: false,
    treasuryCenters: [],
    supplierLocations: [],
    supplierListFound: false,
    exhibit21Found: false,
    llmExtractionsUsed: false,
    llmSectionsAnalyzed: [],
    parsingTimestamp: new Date().toISOString(),
    parsingSuccess: false,
    parsingErrors: [],
    sectionsFound: []
  };
  
  try {
    console.log(`[SEC Parser] Step 1: Resolving CIK for ${ticker}...`);
    const cik = await getCIKFromTicker(ticker, 3);
    if (!cik) {
      result.parsingErrors.push(`Could not resolve CIK for ticker ${ticker}`);
      console.log(`[SEC Parser] ❌ Could not resolve CIK`);
      return result;
    }
    result.cik = cik;
    console.log(`[SEC Parser] ✅ CIK resolved: ${cik}`);
    
    console.log(`[SEC Parser] Step 2: Fetching latest filing with HTML...`);
    const filing = await getLatestFilingWithHTML(cik, ticker);
    if (!filing || !filing.html) {
      result.parsingErrors.push(`Could not fetch filing or HTML for CIK ${cik}`);
      console.log(`[SEC Parser] ❌ No filing or HTML found`);
      return result;
    }
    result.filingDate = filing.filingDate;
    result.reportDate = filing.reportDate;
    result.formType = filing.formType;
    console.log(`[SEC Parser] ✅ Found ${filing.formType}: ${filing.filingDate}, HTML length: ${filing.html.length}`);
    
    const html = filing.html;
    
    console.log(`[SEC Parser] Step 3: Extracting tables...`);
    const $ = cheerio.load(html);
    const tables = extractAllTables(html);
    console.log(`[SEC Parser] Found ${tables.length} tables`);
    
    const fiscalYear = new Date(filing.reportDate).getFullYear();
    
    console.log(`[SEC Parser] Step 3a: Parsing revenue tables...`);
    for (const table of tables) {
      if (isRevenueTable(table, $)) {
        console.log(`[SEC Parser] ✅ Found revenue segment table`);
        const segments = parseRevenueTable(table, $, fiscalYear);
        result.revenueSegments.push(...segments);
        result.revenueTableFound = true;
        result.sectionsFound.push('Revenue Segment Table');
        console.log(`[SEC Parser] Extracted ${segments.length} revenue segments`);
      }
    }
    
    console.log(`[SEC Parser] Step 3b: Parsing PP&E tables...`);
    for (const table of tables) {
      if (isPPETable(table, $)) {
        console.log(`[SEC Parser] ✅ Found PP&E table`);
        const segments = parsePPETable(table, $, fiscalYear);
        result.ppeSegments.push(...segments);
        result.ppeTableFound = true;
        result.sectionsFound.push('PP&E Geographic Table');
        console.log(`[SEC Parser] Extracted ${segments.length} PP&E segments`);
      }
    }
    
    console.log(`[SEC Parser] Step 3c: Parsing debt tables...`);
    for (const table of tables) {
      if (isDebtTable(table, $)) {
        console.log(`[SEC Parser] ✅ Found debt securities table`);
        const securities = parseDebtTable(table, $);
        result.debtSecurities.push(...securities);
        result.debtTableFound = true;
        result.sectionsFound.push('Debt Securities Table');
        console.log(`[SEC Parser] Extracted ${securities.length} debt securities`);
      }
    }
    
    console.log(`[SEC Parser] Step 4: Parsing narrative sections...`);
    
    console.log(`[SEC Parser] Step 4a: Extracting Item 2 Properties...`);
    const facilities = extractItem2Properties(html);
    result.facilityLocations = facilities;
    if (facilities.length > 0) {
      result.sectionsFound.push('Item 2 Properties');
      console.log(`[SEC Parser] ✅ Extracted ${facilities.length} facility locations`);
    }
    
    console.log(`[SEC Parser] Step 4b: Extracting supplier locations...`);
    const suppliers = extractSupplierLocations(html);
    result.supplierLocations = suppliers;
    if (suppliers.length > 0) {
      result.supplierListFound = true;
      result.sectionsFound.push('Supplier Narrative');
      console.log(`[SEC Parser] ✅ Extracted ${suppliers.length} supplier locations`);
    }
    
    console.log(`[SEC Parser] Step 4c: Extracting treasury centers...`);
    const treasuryCenters = extractTreasuryCenters(html);
    result.treasuryCenters = treasuryCenters;
    if (treasuryCenters.length > 0) {
      result.sectionsFound.push('Treasury Centers');
      console.log(`[SEC Parser] ✅ Extracted ${treasuryCenters.length} treasury centers`);
    }
    
    console.log(`[SEC Parser] Step 4d: Parsing Exhibit 21 (Subsidiaries)...`);
    try {
      const exhibit21Data = await parseExhibit21(html, ticker, filing.filingDate, fiscalYear);
      
      if (exhibit21Data.parsingSuccess && exhibit21Data.totalSubsidiaries > 0) {
        result.exhibit21Data = exhibit21Data;
        result.exhibit21Found = true;
        result.sectionsFound.push('Exhibit 21 - Subsidiaries');
        console.log(`[SEC Parser] ✅ Exhibit 21 parsed: ${exhibit21Data.totalSubsidiaries} subsidiaries in ${exhibit21Data.countriesIdentified} countries`);
      } else {
        console.log(`[SEC Parser] ⚠️ Exhibit 21 not found or parsing failed`);
      }
    } catch (exhibit21Error) {
      console.log(`[SEC Parser] ⚠️ Exhibit 21 parsing failed (non-critical):`, exhibit21Error);
      result.parsingErrors.push(`Exhibit 21 parsing failed: ${exhibit21Error instanceof Error ? exhibit21Error.message : String(exhibit21Error)}`);
    }
    
    console.log(`[SEC Parser] Step 5: LLM-based narrative extraction...`);
    try {
      const llmResult = await extractNarrativeData(html, ticker);
      
      if (llmResult.extractions.length > 0) {
        result.llmExtractionsUsed = true;
        result.llmSectionsAnalyzed = llmResult.sectionsAnalyzed;
        result.llmProcessingTime = llmResult.processingTime;
        
        const llmRevenueSegments = extractionsToRevenueSegments(llmResult.extractions, fiscalYear);
        const llmSuppliers = extractionsToSupplierLocations(llmResult.extractions);
        const llmFacilities = extractionsToFacilityLocations(llmResult.extractions);
        
        result.revenueSegments.push(...llmRevenueSegments);
        result.supplierLocations.push(...llmSuppliers);
        result.facilityLocations.push(...llmFacilities);
        
        console.log(`[SEC Parser] ✅ LLM extracted: ${llmRevenueSegments.length} revenue segments, ${llmSuppliers.length} suppliers, ${llmFacilities.length} facilities`);
        result.sectionsFound.push(...llmResult.sectionsAnalyzed.map(s => `${s} (LLM)`));
      } else {
        console.log(`[SEC Parser] ⚠️ LLM extraction returned no results`);
      }
    } catch (llmError) {
      console.log(`[SEC Parser] ⚠️ LLM extraction failed (non-critical):`, llmError);
      result.parsingErrors.push(`LLM extraction failed: ${llmError instanceof Error ? llmError.message : String(llmError)}`);
    }
    
    result.parsingSuccess = true;
    
    console.log(`\n[SEC Parser] ========================================`);
    console.log(`[SEC Parser] PARSING COMPLETE`);
    console.log(`[SEC Parser] Revenue segments: ${result.revenueSegments.length}`);
    console.log(`[SEC Parser] PP&E segments: ${result.ppeSegments.length}`);
    console.log(`[SEC Parser] Debt securities: ${result.debtSecurities.length}`);
    console.log(`[SEC Parser] Facilities: ${result.facilityLocations.length}`);
    console.log(`[SEC Parser] Suppliers: ${result.supplierLocations.length}`);
    console.log(`[SEC Parser] Treasury centers: ${result.treasuryCenters.length}`);
    console.log(`[SEC Parser] Exhibit 21 found: ${result.exhibit21Found}`);
    if (result.exhibit21Found && result.exhibit21Data) {
      console.log(`[SEC Parser] Exhibit 21 subsidiaries: ${result.exhibit21Data.totalSubsidiaries}`);
    }
    console.log(`[SEC Parser] LLM extractions used: ${result.llmExtractionsUsed}`);
    console.log(`[SEC Parser] Sections found: ${result.sectionsFound.join(', ')}`);
    console.log(`[SEC Parser] ========================================\n`);
    
    return result;
    
  } catch (error) {
    result.parsingErrors.push(`Parsing error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[SEC Parser] ❌ Parsing failed:`, error);
    return result;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const secFilingParser = {
  getCIKFromTicker,
  getLatestFilingWithHTML,
  parseSECFiling,
  extractAllTables,
  isRevenueTable,
  isPPETable,
  isDebtTable,
  parseRevenueTable,
  parsePPETable,
  parseDebtTable,
  extractItem2Properties,
  extractSupplierLocations,
  extractTreasuryCenters
};