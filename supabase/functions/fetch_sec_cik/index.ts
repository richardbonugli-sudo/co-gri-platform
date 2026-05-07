Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Incoming request: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  try {
    let ticker;
    try {
      const body = await req.json();
      ticker = body.ticker;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`[${requestId}] Fetching CIK for ticker: ${ticker}`);

    if (!ticker) {
      console.error(`[${requestId}] Missing ticker parameter`);
      return new Response(
        JSON.stringify({ error: 'Ticker parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': 'CedarOwl Research contact@cedarowl.com',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[${requestId}] SEC API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `SEC API returned ${response.status}` }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data = await response.json();
    const tickerUpper = ticker.toUpperCase();

    for (const key in data) {
      const company = data[key];
      if (company.ticker === tickerUpper) {
        const cik = company.cik_str.toString().padStart(10, '0');
        console.log(`[${requestId}] ✅ Found CIK for ${ticker}: ${cik}`);
        return new Response(
          JSON.stringify({ cik, ticker: tickerUpper, companyName: company.title }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    console.log(`[${requestId}] ❌ CIK not found for ticker: ${ticker}`);
    return new Response(
      JSON.stringify({ error: `CIK not found for ticker ${ticker}` }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});