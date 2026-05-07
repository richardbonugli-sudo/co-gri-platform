/**
 * Download PDF Report Edge Function
 * 
 * Downloads PDF files and returns base64 encoded content
 * 
 * FEATURES:
 * - PDF download with size limits
 * - Base64 encoding for transmission
 * - Timeout controls
 * - Error handling for 404, large files
 * 
 * REQUEST:
 * {
 *   "url": "https://example.com/report.pdf"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "content": "base64_encoded_pdf_content",
 *   "fileSize": 5242880,
 *   "contentType": "application/pdf",
 *   "downloadTime": 1500
 * }
 */

const TIMEOUT_MS = 30000; // 30 seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] Download PDF Report - Request received`);
  
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
    
    const { url } = body;
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: url',
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
    
    console.log(`[${requestId}] Downloading PDF from: ${url}`);
    
    // Download PDF with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MGX-Bot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`[${requestId}] Download failed: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Download failed: ${response.status} ${response.statusText}`,
          requestId
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf')) {
      console.log(`[${requestId}] Invalid content type: ${contentType}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid content type: ${contentType}. Expected application/pdf`,
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
    
    // Check file size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      console.log(`[${requestId}] File too large: ${contentLength} bytes`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB (max: 50MB)`,
          requestId
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Download and encode
    const arrayBuffer = await response.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;
    
    console.log(`[${requestId}] Downloaded ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Convert to base64
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Content = btoa(String.fromCharCode(...uint8Array));
    
    const downloadTime = Date.now() - startTime;
    
    console.log(`[${requestId}] Download complete in ${downloadTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        content: base64Content,
        fileSize,
        contentType,
        downloadTime,
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
    const downloadTime = Date.now() - startTime;
    console.error(`[${requestId}] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        downloadTime,
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