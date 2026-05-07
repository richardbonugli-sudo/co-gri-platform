/**
 * Supabase Edge Function: Extract Geographic Narrative
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses OpenAI GPT-4o-mini to extract geographic exposure data from SEC filing
 * narrative text (MD&A, Risk Factors, Item 1 Business, Item 2 Properties,
 * Segment Notes, Exhibit 21).
 *
 * Input:
 *   text        {string}  Narrative text to analyze (chunked internally if >12k chars)
 *   sectionName {string}  Human-readable section label, e.g. "MD&A", "Risk Factors"
 *   ticker      {string}  Company ticker symbol, e.g. "AAPL"
 *
 * Output:
 *   extractions  {NarrativeExtraction[]}  Deduplicated array of geographic exposure items
 *   tokensUsed   {number}                 Total OpenAI tokens consumed
 *   chunksProcessed {number}             Number of text chunks processed
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGELOG (2026-04-23):
 *
 * Fix A: Chunked text processing — texts >12,000 chars are split into overlapping
 *        chunks so large MD&A sections are fully covered without truncation.
 *
 * Fix B: Retry with aggressive prompt — when the first pass returns 0 extractions,
 *        retry once with a more directive prompt that forces extraction of any
 *        geographic mention, no matter how vague.
 *
 * Fix C: Robust JSON parsing — handles GPT responses that wrap JSON in markdown
 *        code fences (```json ... ```) or have minor formatting issues.
 *
 * Fix D: Deduplication — merges extractions with the same country+channel pair,
 *        keeping the one with the highest confidence and best context.
 *
 * Fix E: Built-in local regex fallback — when OpenAI is unavailable or returns
 *        0 extractions after retry, runs a comprehensive local country/region
 *        regex pass so the function always returns something useful.
 *
 * Fix F: Rate-limit awareness — on HTTP 429 from OpenAI, waits and retries
 *        instead of immediately returning an empty array.
 *
 * Fix G: Increased max_tokens to 4000 to handle companies with many geographies
 *        (e.g., MSFT, AAPL which operate in 100+ countries).
 *
 * Fix H: Accept all confidence levels — previously "low" confidence items were
 *        sometimes filtered; now all are returned and the caller decides.
 *
 * Fix I: Improved system prompt — clearer instructions, more examples, explicit
 *        instruction to extract ALL named geographies including qualitative ones.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  CRITICAL REQUIREMENT — OPENAI_API_KEY
 * ─────────────────────────────────────────────────────────────────────────────
 * This function requires the OPENAI_API_KEY environment variable to be set as a
 * Supabase Edge Function secret. Without it, narrative parsing (Step 4 of the
 * SEC baseline pipeline) falls back to local regex extraction only.
 *
 * HOW TO SET THE SECRET (one-time setup):
 *
 *   Option A — Supabase Dashboard (recommended):
 *     1. Go to https://supabase.com/dashboard → your project → Edge Functions
 *     2. Click "Manage secrets"
 *     3. Add a new secret:  Name = OPENAI_API_KEY  |  Value = sk-...
 *     4. Redeploy the function (or it picks up the secret on next cold start)
 *
 *   Option B — Supabase CLI:
 *     supabase secrets set OPENAI_API_KEY=sk-...
 *     supabase functions deploy extract_geographic_narrative
 *
 * COST ESTIMATE:
 *   GPT-4o-mini at ~3,000 tokens/company × 163 companies ≈ 490,000 tokens
 *   ≈ $0.07–$0.15 per full baseline run at current pricing (April 2026).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// ─── Types ────────────────────────────────────────────────────────────────────

interface NarrativeExtraction {
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  country?: string;
  region?: string;
  percentage?: number;
  amount?: number;
  currency?: string;
  context: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

// ─── System Prompts ───────────────────────────────────────────────────────────

// Fix I: Improved primary system prompt — more inclusive, clearer examples
const SYSTEM_PROMPT_PRIMARY = `You are an expert financial analyst extracting geographic exposure data from SEC filings (10-K, 20-F).

Extract ALL geographic mentions across four channels:
1. REVENUE: Sales, revenue, net sales by country/region
2. SUPPLY: Suppliers, manufacturing, sourcing, procurement locations
3. ASSETS: Facilities, offices, plants, warehouses, data centers, real estate
4. FINANCIAL: Debt issuance, treasury, cash holdings, banking jurisdictions

For each geographic mention, output a JSON object with:
- channel: "revenue" | "supply" | "assets" | "financial"
- country: Specific country name (normalized: "U.S." → "United States", "UK" → "United Kingdom", "PRC" → "China", "ROK" → "South Korea")
- region: Regional aggregate if no specific country (e.g., "Americas", "EMEA", "Asia-Pacific", "Latin America")
- percentage: Number only if explicitly stated (e.g., "23%" → 23)
- amount: Dollar amount in millions if explicitly stated
- currency: Currency code if mentioned (e.g., "USD", "EUR", "JPY")
- context: The exact sentence or short phrase containing the geographic mention
- confidence: "high" (has percentage/amount), "medium" (named country with clear business context), "low" (vague or indirect mention)
- source: The section name provided

MANDATORY EXTRACTION RULES:
1. Extract EVERY named country or region, even without numbers. Named geography = always extract.
2. "We have operations in Germany" → Germany (assets, medium confidence)
3. "Suppliers in Vietnam and Thailand" → Vietnam (supply), Thailand (supply)
4. "Revenue from China was $2.3B" → China (revenue, high confidence, amount: 2300)
5. "International markets including Brazil, Mexico, and India" → 3 separate extractions
6. "Asia-Pacific region" → APAC (revenue, region, low confidence)
7. "We face regulatory risks in the European Union" → Europe (revenue, low confidence)
8. "Denominated in Japanese yen" → Japan (financial, medium confidence, currency: JPY)
9. "Our Dublin, Ireland office" → Ireland (assets, medium confidence)
10. "Subsidiaries incorporated in the Cayman Islands" → Cayman Islands (financial, low confidence)

DO NOT extract:
- "We operate globally" with no named place
- "international operations" with no named geography
- Generic risk statements with no named country

Output ONLY valid JSON: {"extractions": [...]}`;

// Fix B: Aggressive retry prompt — used when first pass returns 0 extractions
const SYSTEM_PROMPT_AGGRESSIVE = `You are extracting geographic data from an SEC filing. Your job is to find EVERY country, region, or geographic area mentioned anywhere in the text.

Be MAXIMALLY INCLUSIVE. Extract anything that could indicate where this company does business, has assets, sources materials, or holds financial instruments.

Include:
- Any country name (United States, China, Japan, Germany, etc.)
- Any region (Americas, EMEA, Asia-Pacific, Europe, etc.)
- Any city that implies a country (London → UK, Tokyo → Japan, Shanghai → China)
- Any currency that implies a country (EUR → Europe, JPY → Japan, CNY → China)
- Any regulatory body that implies a country (SEC → US, FCA → UK, CSRC → China)
- Any stock exchange that implies a country (NYSE/NASDAQ → US, LSE → UK, TSE → Japan)

For each item found, output:
- channel: best guess from "revenue" | "supply" | "assets" | "financial"
- country: the country name (or region if no specific country)
- region: only if no specific country
- context: the sentence containing the mention
- confidence: "low" is fine — just extract everything
- source: the section name provided

Output ONLY valid JSON: {"extractions": [...]}`;

// ─── Local Regex Fallback (Fix E) ─────────────────────────────────────────────

const COUNTRY_LIST = [
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
  'Luxembourg', 'Cayman Islands', 'Bermuda', 'British Virgin Islands',
  'Malta', 'Cyprus', 'Estonia', 'Latvia', 'Lithuania', 'Slovakia',
  'Slovenia', 'Croatia', 'Serbia', 'Bulgaria', 'Ukraine', 'Kazakhstan',
  'Peru', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Venezuela',
  'Panama', 'Costa Rica', 'Guatemala', 'Honduras', 'Dominican Republic',
  'Ethiopia', 'Tanzania', 'Uganda', 'Ghana', 'Angola', 'Mozambique',
  'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Rwanda', 'Algeria',
  'Tunisia', 'Jordan', 'Lebanon', 'Iraq', 'Iran', 'Oman', 'Bahrain',
  'Afghanistan', 'Myanmar', 'Cambodia', 'Mongolia', 'Nepal', 'Macau',
  'Iceland', 'Liechtenstein', 'Monaco', 'Andorra',
];

const REGION_LIST = [
  'Americas', 'North America', 'Latin America', 'South America', 'Central America',
  'Europe', 'EMEA', 'Western Europe', 'Eastern Europe', 'Central Europe',
  'Asia', 'Asia-Pacific', 'APAC', 'Asia Pacific', 'Southeast Asia',
  'Middle East', 'Africa', 'Sub-Saharan Africa', 'North Africa',
  'Greater China', 'Rest of World', 'International', 'Emerging Markets',
];

const COUNTRY_ALIASES: Record<string, string> = {
  'u.s.': 'United States', 'u.s.a.': 'United States', 'usa': 'United States',
  'united states of america': 'United States',
  'u.k.': 'United Kingdom', 'uk': 'United Kingdom', 'great britain': 'United Kingdom',
  'prc': 'China', "people's republic of china": 'China', 'mainland china': 'China',
  'greater china': 'China',
  'h.k.': 'Hong Kong', 'hksar': 'Hong Kong',
  'south korea': 'South Korea', 'republic of korea': 'South Korea', 'rok': 'South Korea',
  'uae': 'United Arab Emirates', 'u.a.e.': 'United Arab Emirates',
  'czech republic': 'Czech Republic', 'czechia': 'Czech Republic',
  'türkiye': 'Turkey', 'turkiye': 'Turkey',
  'russian federation': 'Russia',
  'taiwan, r.o.c.': 'Taiwan', 'r.o.c.': 'Taiwan',
  'viet nam': 'Vietnam',
  'new zealand': 'New Zealand',
  'saudi arabia': 'Saudi Arabia', 'ksa': 'Saudi Arabia',
  'south africa': 'South Africa',
};

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  'EUR': 'Europe', 'GBP': 'United Kingdom', 'JPY': 'Japan',
  'CNY': 'China', 'RMB': 'China', 'CNH': 'China',
  'HKD': 'Hong Kong', 'TWD': 'Taiwan', 'KRW': 'South Korea',
  'INR': 'India', 'AUD': 'Australia', 'CAD': 'Canada',
  'SGD': 'Singapore', 'CHF': 'Switzerland', 'SEK': 'Sweden',
  'NOK': 'Norway', 'DKK': 'Denmark', 'PLN': 'Poland',
  'BRL': 'Brazil', 'MXN': 'Mexico', 'ARS': 'Argentina',
  'CLP': 'Chile', 'IDR': 'Indonesia', 'MYR': 'Malaysia',
  'THB': 'Thailand', 'VND': 'Vietnam', 'PHP': 'Philippines',
  'TRY': 'Turkey', 'ILS': 'Israel', 'SAR': 'Saudi Arabia',
  'AED': 'United Arab Emirates', 'ZAR': 'South Africa', 'RUB': 'Russia',
};

function localRegexExtract(text: string, sectionName: string): NarrativeExtraction[] {
  const results: NarrativeExtraction[] = [];
  const lower = text.toLowerCase();
  const seen = new Set<string>();

  function addIfNew(country: string, channel: NarrativeExtraction['channel'], context: string) {
    const key = `${country}|${channel}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        channel,
        country,
        context: context.slice(0, 200),
        confidence: 'low',
        source: sectionName,
      });
    }
  }

  // Check aliases
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx >= 0) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + alias.length < lower.length ? lower[idx + alias.length] : ' ';
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
        const ctx = text.slice(Math.max(0, idx - 50), idx + alias.length + 100);
        addIfNew(canonical, 'revenue', ctx);
      }
    }
  }

  // Check countries
  for (const country of COUNTRY_LIST) {
    const idx = lower.indexOf(country.toLowerCase());
    if (idx >= 0) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + country.length < lower.length ? lower[idx + country.length] : ' ';
      if (!/[a-z]/.test(before) && !/[a-z]/.test(after)) {
        const ctx = text.slice(Math.max(0, idx - 50), idx + country.length + 100);
        addIfNew(country, 'revenue', ctx);
      }
    }
  }

  // Check regions
  for (const region of REGION_LIST) {
    if (lower.includes(region.toLowerCase())) {
      const idx = lower.indexOf(region.toLowerCase());
      const ctx = text.slice(Math.max(0, idx - 50), idx + region.length + 100);
      const key = `${region}|revenue`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          channel: 'revenue',
          region,
          context: ctx.slice(0, 200),
          confidence: 'low',
          source: sectionName,
        });
      }
    }
  }

  // Currency → country mapping
  const currencyPattern = /\b(EUR|GBP|JPY|CNY|RMB|CNH|HKD|TWD|KRW|INR|AUD|CAD|SGD|CHF|SEK|NOK|DKK|PLN|BRL|MXN|ARS|CLP|IDR|MYR|THB|VND|PHP|TRY|ILS|SAR|AED|ZAR|RUB)\b/g;
  const currencyMatches = text.match(currencyPattern);
  if (currencyMatches) {
    for (const currency of [...new Set(currencyMatches)]) {
      const country = CURRENCY_TO_COUNTRY[currency];
      if (country) {
        const idx = text.indexOf(currency);
        const ctx = text.slice(Math.max(0, idx - 50), idx + currency.length + 100);
        addIfNew(country, 'financial', ctx);
      }
    }
  }

  return results;
}

// ─── Text Chunking (Fix A) ────────────────────────────────────────────────────

/**
 * Split text into overlapping chunks of ~12,000 chars with 500-char overlap.
 * This ensures large MD&A sections (often 50k+ chars) are fully processed.
 */
function chunkText(text: string, chunkSize = 12000, overlap = 500): string[] {
  if (text.length <= chunkSize) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlap;
  }
  return chunks;
}

// ─── JSON Parsing (Fix C) ─────────────────────────────────────────────────────

/**
 * Robustly parse GPT response — handles markdown code fences and minor issues.
 */
function parseGPTResponse(content: string): NarrativeExtraction[] {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.extractions && Array.isArray(parsed.extractions)) return parsed.extractions;
    // Sometimes GPT wraps in a different key
    const keys = Object.keys(parsed);
    for (const key of keys) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
  } catch {
    // Try to extract JSON array from the content
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        return [];
      }
    }
    // Try to extract JSON object
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const obj = JSON.parse(objMatch[0]);
        return obj.extractions || [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

// ─── Deduplication (Fix D) ────────────────────────────────────────────────────

/**
 * Merge extractions with the same country+channel, keeping highest confidence.
 */
function deduplicateExtractions(extractions: NarrativeExtraction[]): NarrativeExtraction[] {
  const confidenceRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const map = new Map<string, NarrativeExtraction>();

  for (const e of extractions) {
    const geo = e.country || e.region || '';
    if (!geo) continue;
    const key = `${geo.toLowerCase()}|${e.channel}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, e);
    } else {
      // Keep the one with higher confidence; if equal, prefer the one with percentage/amount
      const existingRank = confidenceRank[existing.confidence] ?? 1;
      const newRank = confidenceRank[e.confidence] ?? 1;
      if (newRank > existingRank || (newRank === existingRank && (e.percentage || e.amount))) {
        map.set(key, e);
      }
    }
  }

  return Array.from(map.values());
}

// ─── OpenAI Call with Rate-Limit Retry (Fix F) ───────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userContent: string,
  requestId: string,
  attempt = 1
): Promise<{ extractions: NarrativeExtraction[]; tokensUsed: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 4000,  // Fix G: increased from 2000
      response_format: { type: 'json_object' },
    }),
  });

  // Fix F: Rate-limit retry
  if (response.status === 429 && attempt <= 3) {
    const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
    const waitMs = Math.min(retryAfter * 1000, 30000);
    console.log(`[${requestId}] Rate limited (429), waiting ${waitMs}ms before retry ${attempt}/3...`);
    await new Promise(r => setTimeout(r, waitMs));
    return callOpenAI(systemPrompt, userContent, requestId, attempt + 1);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  const extractions = parseGPTResponse(content);  // Fix C
  const tokensUsed = data.usage?.total_tokens ?? 0;

  return { extractions, tokensUsed };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  try {
    console.log(`[${requestId}] Extract Geographic Narrative — request received`);

    let body: { text?: string; sectionName?: string; ticker?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { text, sectionName, ticker } = body;

    if (!text || !sectionName || !ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, sectionName, ticker' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log(`[${requestId}] Analyzing ${sectionName} for ${ticker}, text length: ${text.length}`);

    // ── OpenAI API key guard ────────────────────────────────────────────────
    if (!OPENAI_API_KEY) {
      console.warn(
        `[${requestId}] ⚠️ OPENAI_API_KEY not set — running local regex fallback for ${ticker} (${sectionName})`
      );
      // Fix E: Local regex fallback when key is missing
      const localExtractions = localRegexExtract(text, sectionName);
      console.log(`[${requestId}] Local regex found ${localExtractions.length} extractions for ${ticker}`);
      return new Response(
        JSON.stringify({
          extractions: localExtractions,
          tokensUsed: 0,
          chunksProcessed: 0,
          _missingKey: true,
          _localFallback: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // ── Fix A: Chunk large texts ────────────────────────────────────────────
    const chunks = chunkText(text, 12000, 500);
    console.log(`[${requestId}] Text split into ${chunks.length} chunk(s) for ${ticker}/${sectionName}`);

    let allExtractions: NarrativeExtraction[] = [];
    let totalTokensUsed = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkLabel = chunks.length > 1 ? ` (chunk ${i + 1}/${chunks.length})` : '';
      const userContent = `Section: ${sectionName}${chunkLabel}\nCompany: ${ticker}\n\nText to analyze:\n${chunk}`;

      try {
        // First pass with primary prompt
        const { extractions, tokensUsed } = await callOpenAI(
          SYSTEM_PROMPT_PRIMARY,
          userContent,
          requestId
        );
        totalTokensUsed += tokensUsed;

        console.log(`[${requestId}] Chunk ${i + 1}: ${extractions.length} extractions, ${tokensUsed} tokens`);

        // Fix B: Retry with aggressive prompt if 0 extractions
        if (extractions.length === 0 && chunk.length > 500) {
          console.log(`[${requestId}] Zero extractions on chunk ${i + 1}, retrying with aggressive prompt...`);
          await new Promise(r => setTimeout(r, 1500)); // brief pause before retry
          try {
            const { extractions: retryExtractions, tokensUsed: retryTokens } = await callOpenAI(
              SYSTEM_PROMPT_AGGRESSIVE,
              userContent,
              requestId
            );
            totalTokensUsed += retryTokens;
            console.log(`[${requestId}] Aggressive retry chunk ${i + 1}: ${retryExtractions.length} extractions`);
            allExtractions.push(...retryExtractions.map(e => ({ ...e, source: sectionName })));
          } catch (retryErr) {
            console.warn(`[${requestId}] Aggressive retry failed: ${retryErr}`);
          }
        } else {
          allExtractions.push(...extractions.map(e => ({ ...e, source: sectionName })));
        }

        // Small delay between chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (chunkErr) {
        console.warn(`[${requestId}] Chunk ${i + 1} failed: ${chunkErr}`);
        // Fix E: Fall back to local regex for this chunk on error
        const localFallback = localRegexExtract(chunk, sectionName);
        console.log(`[${requestId}] Local fallback for chunk ${i + 1}: ${localFallback.length} extractions`);
        allExtractions.push(...localFallback);
      }
    }

    // Fix E: If still 0 extractions after all chunks, run full local regex
    if (allExtractions.length === 0) {
      console.log(`[${requestId}] Zero LLM extractions — running full local regex fallback for ${ticker}`);
      const localFallback = localRegexExtract(text, sectionName);
      console.log(`[${requestId}] Local regex fallback: ${localFallback.length} extractions`);
      allExtractions = localFallback;
    }

    // Fix D: Deduplicate
    const deduplicated = deduplicateExtractions(allExtractions);
    console.log(`[${requestId}] Final: ${deduplicated.length} unique extractions (from ${allExtractions.length} raw) for ${ticker}/${sectionName}, ${totalTokensUsed} tokens`);

    return new Response(
      JSON.stringify({
        extractions: deduplicated,
        tokensUsed: totalTokensUsed,
        chunksProcessed: chunks.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] Unhandled exception:`, msg);

    // Fix E: Always return something useful even on total failure
    let fallbackExtractions: NarrativeExtraction[] = [];
    try {
      const body = await req.clone().json() as { text?: string; sectionName?: string };
      if (body.text && body.sectionName) {
        fallbackExtractions = localRegexExtract(body.text, body.sectionName);
      }
    } catch {
      // ignore
    }

    return new Response(
      JSON.stringify({
        error: msg,
        extractions: fallbackExtractions,
        _localFallback: fallbackExtractions.length > 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});