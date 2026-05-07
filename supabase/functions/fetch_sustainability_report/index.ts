/**
 * Fetch Sustainability Report Edge Function
 * 
 * Discovers sustainability/ESG reports from company investor relations pages
 * 
 * FEATURES:
 * - Web scraping of investor relations pages
 * - Multiple search strategies (direct links, search results)
 * - File type detection (PDF, HTML)
 * - Publication date extraction
 * - Timeout controls
 * 
 * REQUEST:
 * {
 *   "ticker": "AAPL",
 *   "year": 2023 (optional)
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "reports": [
 *     {
 *       "url": "https://...",
 *       "title": "2023 Environmental Progress Report",
 *       "publishDate": "2023-04-01",
 *       "fileType": "pdf",
 *       "fileSize": 5242880,
 *       "reportType": "sustainability" | "esg" | "annual" | "csr"
 *     }
 *   ],
 *   "searchStrategy": "investor_relations_page",
 *   "processingTime": 2500
 * }
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const TIMEOUT_MS = 30000; // 30 seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ReportSearchResult {
  url: string;
  title: string;
  publishDate: string;
  fileType: 'pdf' | 'html';
  fileSize?: number;
  reportType: 'sustainability' | 'esg' | 'annual' | 'csr' | 'environmental' | 'social';
}

// Common investor relations URL patterns
const IR_URL_PATTERNS = [
  'https://investor.{domain}/sustainability',
  'https://investor.{domain}/esg',
  'https://investor.{domain}/responsibility',
  'https://{domain}/investor-relations/sustainability',
  'https://{domain}/sustainability',
  'https://{domain}/esg',
  'https://{domain}/corporate-responsibility',
  'https://{domain}/about/sustainability'
];

// Ticker to domain mapping (common companies)
const TICKER_TO_DOMAIN: Record<string, string> = {
  'AAPL': 'apple.com',
  'MSFT': 'microsoft.com',
  'GOOGL': 'abc.xyz',
  'AMZN': 'aboutamazon.com',
  'TSLA': 'tesla.com',
  'META': 'about.meta.com',
  'NVDA': 'nvidia.com',
  'NKE': 'nike.com',
  'SBUX': 'starbucks.com',
  'DIS': 'thewaltdisneycompany.com',
  'WMT': 'walmart.com',
  'PG': 'pg.com',
  'KO': 'coca-colacompany.com',
  'PEP': 'pepsico.com',
  'BA': 'boeing.com',
  'GE': 'ge.com',
  'IBM': 'ibm.com',
  'INTC': 'intel.com',
  'CSCO': 'cisco.com',
  'ORCL': 'oracle.com'
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] Fetch Sustainability Report - Request received`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          requestId 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    const { ticker, year } = body;
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: ticker',
          requestId 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    console.log(`[${requestId}] Searching for sustainability reports: ${ticker}, year: ${year || 'latest'}`);
    
    // Get company domain
    const domain = TICKER_TO_DOMAIN[ticker.toUpperCase()];
    if (!domain) {
      console.log(`[${requestId}] No domain mapping found for ${ticker}, using generic search`);
    }
    
    // Search for reports
    const reports: ReportSearchResult[] = [];
    let searchStrategy = 'none';
    
    // Strategy 1: Try known investor relations pages
    if (domain) {
      console.log(`[${requestId}] Strategy 1: Checking investor relations pages for ${domain}`);
      
      for (const pattern of IR_URL_PATTERNS) {
        const url = pattern.replace('{domain}', domain);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s per URL
          
          console.log(`[${requestId}] Fetching: ${url}`);
          const response = await fetch(url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MGX-Bot/1.0)'
            }
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const html = await response.text();
            const foundReports = extractReportsFromHTML(html, url, year);
            
            if (foundReports.length > 0) {
              reports.push(...foundReports);
              searchStrategy = 'investor_relations_page';
              console.log(`[${requestId}] Found ${foundReports.length} reports at ${url}`);
              break; // Stop after finding reports
            }
          }
        } catch (error) {
          console.log(`[${requestId}] Failed to fetch ${url}:`, error.message);
        }
      }
    }
    
    // Strategy 2: Generic web search (fallback)
    if (reports.length === 0) {
      console.log(`[${requestId}] Strategy 2: Generic web search for ${ticker}`);
      // TODO: Implement web search API integration (Google Custom Search, Bing API)
      // For now, return empty results
      searchStrategy = 'web_search_fallback';
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[${requestId}] Search complete: ${reports.length} reports found in ${processingTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        reports,
        searchStrategy,
        processingTime,
        requestId
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processingTime,
        requestId
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

/**
 * Extract report links from HTML content
 */
function extractReportsFromHTML(html: string, baseUrl: string, targetYear?: number): ReportSearchResult[] {
  const reports: ReportSearchResult[] = [];
  
  // Keywords for sustainability reports
  const keywords = [
    'sustainability report',
    'esg report',
    'environmental report',
    'social responsibility',
    'corporate responsibility',
    'csr report',
    'environmental progress',
    'people and planet'
  ];
  
  // Extract all links
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let match;
  
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const linkText = match[2].toLowerCase();
    
    // Check if link text contains sustainability keywords
    const isRelevant = keywords.some(kw => linkText.includes(kw));
    
    if (isRelevant && (href.endsWith('.pdf') || href.includes('/pdf/') || href.includes('sustainability'))) {
      // Resolve relative URLs
      let fullUrl = href;
      if (href.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
      } else if (!href.startsWith('http')) {
        fullUrl = new URL(href, baseUrl).toString();
      }
      
      // Extract year from link text or URL
      const yearMatch = linkText.match(/20\d{2}/) || href.match(/20\d{2}/);
      const reportYear = yearMatch ? parseInt(yearMatch[0]) : null;
      
      // Filter by target year if specified
      if (targetYear && reportYear && reportYear !== targetYear) {
        continue;
      }
      
      // Determine report type
      let reportType: ReportSearchResult['reportType'] = 'sustainability';
      if (linkText.includes('esg')) reportType = 'esg';
      else if (linkText.includes('environmental')) reportType = 'environmental';
      else if (linkText.includes('social')) reportType = 'social';
      else if (linkText.includes('csr') || linkText.includes('responsibility')) reportType = 'csr';
      
      reports.push({
        url: fullUrl,
        title: match[2].trim(),
        publishDate: reportYear ? `${reportYear}-01-01` : new Date().toISOString().split('T')[0],
        fileType: href.endsWith('.pdf') ? 'pdf' : 'html',
        reportType
      });
    }
  }
  
  // Deduplicate by URL
  const uniqueReports = Array.from(
    new Map(reports.map(r => [r.url, r])).values()
  );
  
  return uniqueReports;
}