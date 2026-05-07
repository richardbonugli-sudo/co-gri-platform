/**
 * Supabase Edge Function: fetch_yahoo_finance
 *
 * Server-side proxy for Yahoo Finance public chart API.
 * Bypasses browser CORS restrictions by fetching from Deno runtime.
 *
 * POST body: { ticker: string, range?: "2y" | "5y" }
 * Response:  raw Yahoo Finance chart JSON
 */

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body: { ticker?: string; range?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { ticker, range = '2y' } = body;

  if (!ticker) {
    return new Response(JSON.stringify({ error: 'ticker is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const safeRange = range === '5y' ? '5y' : '2y';
  const encodedTicker = encodeURIComponent(ticker);

  // Try query1 then query2
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodedTicker}?interval=1wk&range=${safeRange}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodedTicker}?interval=1wk&range=${safeRange}`,
  ];

  let lastError = 'Unknown error';

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        // 10-second timeout via AbortSignal
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        lastError = `Yahoo Finance returned HTTP ${res.status} for ${ticker}`;
        continue;
      }

      const data = await res.json();

      // Validate shape
      const result = (data as any)?.chart?.result?.[0];
      if (!result?.timestamp?.length) {
        lastError = `Empty or invalid chart data for ${ticker}`;
        continue;
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // cache 1 hour at CDN level
        },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // All attempts failed
  return new Response(
    JSON.stringify({ error: `Failed to fetch Yahoo Finance data for ${ticker}: ${lastError}` }),
    {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    }
  );
});