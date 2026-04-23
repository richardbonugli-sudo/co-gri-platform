/**
 * Batch Company Processor
 * 
 * Automatically extracts geographic revenue data from SEC 10-K filings
 * and populates the company-specific exposures database.
 * 
 * Usage:
 * - Process S&P 100 companies
 * - Extract geographic revenue segments from Item 8
 * - Validate and normalize data
 * - Generate TypeScript code for companySpecificExposures.ts
 */

import { parseSECFiling, RevenueSegment } from '../services/secFilingParser';
import { CompanyExposure } from '../data/companySpecificExposures';

// ============================================================================
// S&P 100 TICKERS
// ============================================================================

const SP100_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V',
  'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM',
  'NFLX', 'CMCSA', 'XOM', 'PFE', 'CSCO', 'INTC', 'VZ', 'KO', 'PEP', 'T',
  'MRK', 'ABT', 'NKE', 'ORCL', 'AMD', 'QCOM', 'IBM', 'BA', 'GE', 'CAT',
  'CVX', 'COST', 'AVGO', 'TXN', 'LLY', 'MDT', 'HON', 'UPS', 'RTX', 'LOW',
  'SBUX', 'INTU', 'AMGN', 'GS', 'BLK', 'AXP', 'SPGI', 'BKNG', 'DE', 'MMM',
  'GILD', 'ISRG', 'CI', 'MO', 'TJX', 'ZTS', 'CB', 'PLD', 'SYK', 'DUK',
  'SO', 'BSX', 'USB', 'MU', 'C', 'LRCX', 'REGN', 'SCHW', 'MS', 'PNC',
  'AON', 'CL', 'MDLZ', 'EQIX', 'BDX', 'VRTX', 'ADI', 'APD', 'SHW', 'CME',
  'ICE', 'KLAC', 'FISV', 'MCO', 'NSC', 'ITW', 'EOG', 'WM', 'FCX', 'EMR'
];

// ============================================================================
// REGION TO COUNTRY MAPPING
// ============================================================================

const REGION_TO_COUNTRIES: Record<string, string[]> = {
  // Americas
  'Americas': ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile'],
  'United States': ['United States'],
  'U.S.': ['United States'],
  'US': ['United States'],
  'USA': ['United States'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'Latin America': ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'],
  'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
  'Canada': ['Canada'],
  'Mexico': ['Mexico'],
  'Brazil': ['Brazil'],
  
  // Europe
  'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland'],
  'EMEA': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'United Arab Emirates', 'Saudi Arabia', 'South Africa'],
  'Europe, Middle East and Africa': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'United Arab Emirates', 'Saudi Arabia', 'South Africa'],
  'European Union': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands'],
  'United Kingdom': ['United Kingdom'],
  'UK': ['United Kingdom'],
  'Germany': ['Germany'],
  'France': ['France'],
  'Italy': ['Italy'],
  'Spain': ['Spain'],
  'Netherlands': ['Netherlands'],
  'Switzerland': ['Switzerland'],
  
  // Asia Pacific
  'Asia-Pacific': ['China', 'Japan', 'South Korea', 'Australia', 'India', 'Singapore', 'Hong Kong', 'Taiwan'],
  'APAC': ['China', 'Japan', 'South Korea', 'Australia', 'India', 'Singapore', 'Hong Kong', 'Taiwan'],
  'Asia Pacific': ['China', 'Japan', 'South Korea', 'Australia', 'India', 'Singapore', 'Hong Kong', 'Taiwan'],
  'Rest of Asia Pacific': ['Australia', 'South Korea', 'Singapore', 'India', 'Thailand', 'Malaysia', 'Indonesia'],
  'Greater China': ['China', 'Hong Kong', 'Taiwan'],
  'China': ['China'],
  'Japan': ['Japan'],
  'South Korea': ['South Korea'],
  'Korea': ['South Korea'],
  'Australia': ['Australia'],
  'India': ['India'],
  'Singapore': ['Singapore'],
  'Hong Kong': ['Hong Kong'],
  'Taiwan': ['Taiwan'],
  'Southeast Asia': ['Singapore', 'Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam'],
  
  // Middle East
  'Middle East': ['United Arab Emirates', 'Saudi Arabia', 'Israel', 'Turkey'],
  'Middle East and Africa': ['United Arab Emirates', 'Saudi Arabia', 'South Africa', 'Israel', 'Turkey', 'Egypt'],
  'United Arab Emirates': ['United Arab Emirates'],
  'UAE': ['United Arab Emirates'],
  'Saudi Arabia': ['Saudi Arabia'],
  
  // Other
  'Other': ['United States'],
  'Rest of World': ['United States'],
  'International': ['United Kingdom', 'Germany', 'France', 'China', 'Japan']
};

// ============================================================================
// SECTOR MAPPING (from SIC codes)
// ============================================================================

const TICKER_TO_SECTOR: Record<string, string> = {
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'GOOGL': 'Technology',
  'AMZN': 'Consumer Cyclical',
  'NVDA': 'Technology',
  'META': 'Technology',
  'TSLA': 'Consumer Cyclical',
  'BRK.B': 'Financial Services',
  'JPM': 'Financial Services',
  'V': 'Financial Services',
  'JNJ': 'Healthcare',
  'WMT': 'Consumer Defensive',
  'PG': 'Consumer Defensive',
  'MA': 'Financial Services',
  'UNH': 'Healthcare',
  'HD': 'Consumer Cyclical',
  'DIS': 'Communication Services',
  'BAC': 'Financial Services',
  'ADBE': 'Technology',
  'CRM': 'Technology',
  'NFLX': 'Communication Services',
  'CMCSA': 'Communication Services',
  'XOM': 'Energy',
  'PFE': 'Healthcare',
  'CSCO': 'Technology',
  'INTC': 'Technology',
  'VZ': 'Communication Services',
  'KO': 'Consumer Defensive',
  'PEP': 'Consumer Defensive',
  'T': 'Communication Services',
  'MRK': 'Healthcare',
  'ABT': 'Healthcare',
  'NKE': 'Consumer Cyclical',
  'ORCL': 'Technology',
  'AMD': 'Technology',
  'QCOM': 'Technology',
  'IBM': 'Technology',
  'BA': 'Industrials',
  'GE': 'Industrials',
  'CAT': 'Industrials'
};

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

interface ProcessingResult {
  ticker: string;
  success: boolean;
  exposure?: CompanyExposure;
  error?: string;
  revenueSegmentsFound: number;
  countriesIdentified: number;
}

/**
 * Expand region names to country lists
 */
function expandRegionToCountries(region: string): string[] {
  const normalizedRegion = region.trim();
  
  // Direct country match
  if (REGION_TO_COUNTRIES[normalizedRegion]) {
    return REGION_TO_COUNTRIES[normalizedRegion];
  }
  
  // Try case-insensitive match
  const lowerRegion = normalizedRegion.toLowerCase();
  for (const [key, countries] of Object.entries(REGION_TO_COUNTRIES)) {
    if (key.toLowerCase() === lowerRegion) {
      return countries;
    }
  }
  
  // If no match, treat as single country
  return [normalizedRegion];
}

/**
 * Normalize revenue segments to country-level exposures
 */
function normalizeRevenueSegments(segments: RevenueSegment[]): CompanyExposure['exposures'] {
  const countryMap = new Map<string, number>();
  
  for (const segment of segments) {
    const countries = expandRegionToCountries(segment.region);
    const percentagePerCountry = segment.revenuePercentage / countries.length;
    
    for (const country of countries) {
      const existing = countryMap.get(country) || 0;
      countryMap.set(country, existing + percentagePerCountry);
    }
  }
  
  // Sort by percentage descending
  const exposures = Array.from(countryMap.entries())
    .map(([country, percentage]) => ({
      country,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      description: `Revenue segment from 10-K`
    }))
    .sort((a, b) => b.percentage - a.percentage);
  
  // Normalize to sum to 100%
  const total = exposures.reduce((sum, e) => sum + e.percentage, 0);
  if (total > 0 && Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    exposures.forEach(e => {
      e.percentage = Math.round(e.percentage * factor * 10) / 10;
    });
  }
  
  return exposures;
}

/**
 * Process a single company
 */
async function processCompany(ticker: string): Promise<ProcessingResult> {
  console.log(`\n[Batch Processor] Processing ${ticker}...`);
  
  try {
    const parsedData = await parseSECFiling(ticker);
    
    if (!parsedData || !parsedData.parsingSuccess) {
      return {
        ticker,
        success: false,
        error: 'Parsing failed',
        revenueSegmentsFound: 0,
        countriesIdentified: 0
      };
    }
    
    if (parsedData.revenueSegments.length === 0) {
      return {
        ticker,
        success: false,
        error: 'No revenue segments found',
        revenueSegmentsFound: 0,
        countriesIdentified: 0
      };
    }
    
    const exposures = normalizeRevenueSegments(parsedData.revenueSegments);
    
    if (exposures.length === 0) {
      return {
        ticker,
        success: false,
        error: 'Could not normalize revenue segments',
        revenueSegmentsFound: parsedData.revenueSegments.length,
        countriesIdentified: 0
      };
    }
    
    const companyExposure: CompanyExposure = {
      ticker,
      companyName: `${ticker} Inc.`, // Placeholder
      homeCountry: exposures[0].country, // Assume largest exposure is home country
      sector: TICKER_TO_SECTOR[ticker] || 'Unknown',
      exposures,
      dataSource: `SEC 10-K ${parsedData.formType} filed ${parsedData.filingDate}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    console.log(`[Batch Processor] ✅ ${ticker}: ${exposures.length} countries, top: ${exposures[0].country} (${exposures[0].percentage}%)`);
    
    return {
      ticker,
      success: true,
      exposure: companyExposure,
      revenueSegmentsFound: parsedData.revenueSegments.length,
      countriesIdentified: exposures.length
    };
    
  } catch (error) {
    console.error(`[Batch Processor] ❌ ${ticker} failed:`, error);
    return {
      ticker,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      revenueSegmentsFound: 0,
      countriesIdentified: 0
    };
  }
}

/**
 * Process multiple companies in batch
 */
export async function batchProcessCompanies(
  tickers: string[],
  maxConcurrent: number = 3
): Promise<ProcessingResult[]> {
  console.log(`\n[Batch Processor] ========================================`);
  console.log(`[Batch Processor] Starting batch processing`);
  console.log(`[Batch Processor] Total companies: ${tickers.length}`);
  console.log(`[Batch Processor] Max concurrent: ${maxConcurrent}`);
  console.log(`[Batch Processor] ========================================\n`);
  
  const results: ProcessingResult[] = [];
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < tickers.length; i += maxConcurrent) {
    const batch = tickers.slice(i, i + maxConcurrent);
    console.log(`\n[Batch Processor] Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(tickers.length / maxConcurrent)}: ${batch.join(', ')}`);
    
    const batchResults = await Promise.all(
      batch.map(ticker => processCompany(ticker))
    );
    
    results.push(...batchResults);
    
    // Rate limiting: wait 2 seconds between batches
    if (i + maxConcurrent < tickers.length) {
      console.log(`[Batch Processor] Waiting 2 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n[Batch Processor] ========================================`);
  console.log(`[Batch Processor] BATCH PROCESSING COMPLETE`);
  console.log(`[Batch Processor] Total processed: ${results.length}`);
  console.log(`[Batch Processor] Successful: ${successful.length}`);
  console.log(`[Batch Processor] Failed: ${failed.length}`);
  console.log(`[Batch Processor] Success rate: ${Math.round((successful.length / results.length) * 100)}%`);
  console.log(`[Batch Processor] ========================================\n`);
  
  if (failed.length > 0) {
    console.log(`[Batch Processor] Failed companies:`);
    failed.forEach(r => {
      console.log(`  - ${r.ticker}: ${r.error}`);
    });
  }
  
  return results;
}

/**
 * Generate TypeScript code for companySpecificExposures.ts
 */
export function generateCompanyExposuresCode(exposures: CompanyExposure[]): string {
  const exposureEntries = exposures.map(exp => {
    const exposuresStr = exp.exposures.map(e => 
      `      { country: '${e.country}', percentage: ${e.percentage}, description: '${e.description}' }`
    ).join(',\n');
    
    return `  '${exp.ticker}': {
    ticker: '${exp.ticker}',
    companyName: '${exp.companyName}',
    homeCountry: '${exp.homeCountry}',
    sector: '${exp.sector}',
    exposures: [
${exposuresStr}
    ],
    dataSource: '${exp.dataSource}',
    lastUpdated: '${exp.lastUpdated}'
  }`;
  }).join(',\n');
  
  return `export const COMPANY_SPECIFIC_EXPOSURES: Record<string, CompanyExposure> = {
${exposureEntries}
};`;
}

/**
 * Main execution function
 */
export async function runBatchProcessor(
  tickers: string[] = SP100_TICKERS,
  outputPath?: string
): Promise<void> {
  console.log(`\n[Batch Processor] Starting automated SEC parser...`);
  console.log(`[Batch Processor] Target: ${tickers.length} companies`);
  
  const results = await batchProcessCompanies(tickers, 3);
  
  const successful = results.filter(r => r.success && r.exposure);
  const exposures = successful.map(r => r.exposure!);
  
  if (exposures.length > 0) {
    const code = generateCompanyExposuresCode(exposures);
    
    if (outputPath) {
      console.log(`\n[Batch Processor] Writing results to ${outputPath}...`);
      // In a real implementation, write to file
      console.log(code);
    } else {
      console.log(`\n[Batch Processor] Generated code for ${exposures.length} companies:`);
      console.log(code.substring(0, 500) + '...');
    }
  }
  
  console.log(`\n[Batch Processor] ✅ Batch processing complete!`);
}

// Export for use in other modules
export { SP100_TICKERS, REGION_TO_COUNTRIES, TICKER_TO_SECTOR };
