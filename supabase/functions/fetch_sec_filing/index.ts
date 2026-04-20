/**
 * Supabase Edge Function: Fetch SEC Filing
 * 
 * Fetches the actual SEC filing document (10-K, 20-F) with real data tables
 * 
 * CRITICAL FIX: Now fetches the PRIMARY DOCUMENT, not the viewer wrapper
 * 
 * Input:
 * - cik: string (SEC CIK number, e.g., "0000320193")
 * - formType: string (e.g., "10-K", "20-F")
 * 
 * Output:
 * - cik, formType, filingDate, reportDate, accessionNumber
 * - htmlUrl: URL to the actual filing document
 * - html: Full HTML content with data tables
 * - htmlLength: Character count
 */

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
    let body;
    try {
      body = await req.json();
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

    const { cik, formType = '10-K' } = body;

    if (!cik) {
      console.error(`[${requestId}] Missing CIK parameter`);
      return new Response(
        JSON.stringify({ error: 'CIK parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`[${requestId}] Fetching ${formType} filing for CIK: ${cik}`);

    // Step 1: Get company submissions to find latest filing
    const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
    console.log(`[${requestId}] Fetching submissions from: ${submissionsUrl}`);

    const submissionsResponse = await fetch(submissionsUrl, {
      headers: {
        'User-Agent': 'CedarOwl Research contact@cedarowl.com',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'data.sec.gov',
      },
    });

    if (!submissionsResponse.ok) {
      console.error(`[${requestId}] Submissions API error: ${submissionsResponse.status}`);
      return new Response(
        JSON.stringify({ error: `SEC API returned ${submissionsResponse.status}` }),
        {
          status: submissionsResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const submissionsData = await submissionsResponse.json();
    const filings = submissionsData.filings?.recent;

    if (!filings) {
      console.error(`[${requestId}] No filings found for CIK ${cik}`);
      return new Response(
        JSON.stringify({ error: `No filings found for CIK ${cik}` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Step 2: Find the most recent filing of the requested type
    let filingIndex = -1;
    const formTypesToCheck = formType === '10-K' ? ['10-K', '10-K/A'] : ['20-F', '20-F/A'];

    for (let i = 0; i < filings.form.length; i++) {
      if (formTypesToCheck.includes(filings.form[i])) {
        filingIndex = i;
        break;
      }
    }

    if (filingIndex === -1) {
      console.error(`[${requestId}] No ${formType} filing found for CIK ${cik}`);
      return new Response(
        JSON.stringify({ error: `No ${formType} filing found for CIK ${cik}` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const accessionNumber = filings.accessionNumber[filingIndex];
    const filingDate = filings.filingDate[filingIndex];
    const reportDate = filings.reportDate[filingIndex];
    const actualFormType = filings.form[filingIndex];
    const primaryDocument = filings.primaryDocument[filingIndex];

    console.log(`[${requestId}] Found ${actualFormType} filing: ${accessionNumber} (${filingDate})`);
    console.log(`[${requestId}] Primary document: ${primaryDocument}`);

    // Step 3: Construct the URL to the ACTUAL FILING DOCUMENT (not the viewer)
    const cikFormatted = cik.replace(/^0+/, ''); // Remove leading zeros for URL
    const accessionNumberFormatted = accessionNumber.replace(/-/g, '');
    
    // CRITICAL FIX: Fetch the primary document directly
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikFormatted}/${accessionNumberFormatted}/${primaryDocument}`;

    console.log(`[${requestId}] Fetching ACTUAL filing document from: ${filingUrl}`);

    // Step 4: Fetch the actual filing HTML
    const filingResponse = await fetch(filingUrl, {
      headers: {
        'User-Agent': 'CedarOwl Research contact@cedarowl.com',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!filingResponse.ok) {
      console.error(`[${requestId}] Filing fetch error: ${filingResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch filing: ${filingResponse.status}` }),
        {
          status: filingResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const html = await filingResponse.text();
    console.log(`[${requestId}] ✅ Successfully fetched filing HTML (${html.length} characters)`);
    
    // Validate that we got actual filing content, not a viewer page
    const hasDataTables = html.includes('<table') || html.includes('<TABLE');
    const isViewerPage = html.includes('cgi-bin/viewer') || html.includes('InstanceReport.xslt');
    
    if (isViewerPage && !hasDataTables) {
      console.warn(`[${requestId}] ⚠️ Warning: Fetched viewer page instead of actual document`);
    } else if (hasDataTables) {
      console.log(`[${requestId}] ✅ Confirmed: Document contains data tables`);
    }

    return new Response(
      JSON.stringify({
        cik,
        formType: actualFormType,
        filingDate,
        reportDate,
        accessionNumber,
        primaryDocument,
        htmlUrl: filingUrl,
        html,
        htmlLength: html.length,
      }),
      {
        status: 200,
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