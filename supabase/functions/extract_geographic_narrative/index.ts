/**
 * Supabase Edge Function: Extract Geographic Narrative
 * 
 * Uses OpenAI GPT-4 to extract geographic exposure data from SEC filing narrative text
 * 
 * Input:
 * - text: string (narrative text to analyze)
 * - sectionName: string (e.g., "MD&A", "Risk Factors")
 * - ticker: string (company ticker)
 * 
 * Output:
 * - extractions: NarrativeExtraction[]
 * - tokensUsed: number
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

const SYSTEM_PROMPT = `You are an expert financial analyst specializing in extracting geographic exposure data from SEC filings.

Your task: Analyze the provided text and extract ALL mentions of geographic exposure across four channels:
1. REVENUE (Wᵣ): Sales, revenue by country/region
2. SUPPLY CHAIN (Wₛ): Suppliers, manufacturing partners, sourcing locations
3. PHYSICAL ASSETS (Wₚ): Facilities, offices, plants, warehouses, real estate
4. FINANCIAL (W𝒻): Debt issuance jurisdictions, treasury operations, cash holdings

For each mention, extract:
- channel: One of "revenue", "supply", "assets", "financial"
- country: Specific country name (if mentioned)
- region: Regional aggregate (e.g., "Americas", "EMEA", "Asia-Pacific") if no specific country
- percentage: Percentage value (if mentioned, e.g., "23%" → 23)
- amount: Dollar amount (if mentioned, in millions)
- currency: Currency code (e.g., "USD", "EUR")
- context: The exact sentence or phrase containing the information
- confidence: "high" (explicit percentage/amount), "medium" (implied significance), "low" (vague mention)
- source: The section name provided

IMPORTANT RULES:
1. Only extract EXPLICIT geographic mentions with quantitative data (percentages, amounts) or clear qualitative statements
2. DO NOT infer or guess - only extract what is directly stated
3. For regional mentions without specific countries, extract the region name
4. Normalize country names (e.g., "U.S." → "United States", "UK" → "United Kingdom")
5. If a sentence mentions multiple countries, create separate extractions for each
6. Ignore generic statements like "we operate globally" without specifics

Output format: JSON array of extractions`;

serve(async (req) => {
  // Generate unique request ID for logging
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }
  
  try {
    console.log(`[${requestId}] Extract Geographic Narrative - Request received`);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${requestId}] Failed to parse request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    const { text, sectionName, ticker } = body;
    
    if (!text || !sectionName || !ticker) {
      console.error(`[${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, sectionName, ticker' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    console.log(`[${requestId}] Analyzing ${sectionName} for ${ticker}, text length: ${text.length}`);
    
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error(`[${requestId}] OpenAI API key not configured`);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          extractions: []
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Section: ${sectionName}\nCompany: ${ticker}\n\nText to analyze:\n${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[${requestId}] OpenAI API error:`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${openaiResponse.status}`,
          extractions: []
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    const openaiData = await openaiResponse.json();
    console.log(`[${requestId}] OpenAI response received, tokens used: ${openaiData.usage?.total_tokens || 0}`);
    
    // Parse extractions from GPT-4 response
    let extractions: NarrativeExtraction[] = [];
    try {
      const content = openaiData.choices[0].message.content;
      const parsed = JSON.parse(content);
      extractions = parsed.extractions || [];
      
      // Add source field to each extraction
      extractions = extractions.map(e => ({
        ...e,
        source: sectionName
      }));
      
      console.log(`[${requestId}] Extracted ${extractions.length} items`);
    } catch (e) {
      console.error(`[${requestId}] Failed to parse OpenAI response:`, e);
    }
    
    return new Response(
      JSON.stringify({
        extractions,
        tokensUsed: openaiData.usage?.total_tokens || 0
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
    console.error(`[${requestId}] Exception:`, error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        extractions: []
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});