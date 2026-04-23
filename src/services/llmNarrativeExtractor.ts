/**
 * LLM-Based Narrative Extractor
 *
 * Uses GPT-4 to extract geographic exposure data from narrative text in SEC filings.
 * Implements FIX #5: AI-powered extraction from prose sections.
 *
 * Target Sections:
 * - Management Discussion & Analysis (MD&A)
 * - Risk Factors
 * - Business Description
 * - Geographic Information Notes
 * - Segment Notes
 * - Item 2 Properties
 * - Exhibit 21 (Subsidiaries)
 *
 * CHANGELOG:
 * - 2026-04-23: Enhanced cleanTextForLLM to strip iXBRL tags and all HTML entities
 * - 2026-04-23: Replaced ad-hoc section extractors with extractAllNarrativeSections
 *               from narrativeParser.ts (covers 7 sections, not 3)
 * - 2026-04-23: Added _missingKey flag handling — if LLM returns extraction with
 *               _missingKey: true, it is logged but NOT added to the results array
 *               so downstream code never sees a phantom country
 * - 2026-04-23: Added deduplication of extractions by (channel, country/region, source)
 * - 2026-04-23: extractWithLLM now retries once on transient edge-function errors
 * - 2026-04-23: extractNarrativeData now processes all 7 sections in parallel
 * - 2025-12-08: Initial implementation with OpenAI GPT-4 integration
 */

import { supabase } from '@/lib/supabase';
import { extractAllNarrativeSections } from './narrativeParser';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NarrativeExtraction {
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  country?: string;
  region?: string;
  percentage?: number;
  amount?: number;
  currency?: string;
  context: string;
  confidence: 'high' | 'medium' | 'low';
  source: string; // Section name (e.g., "MD&A", "Risk Factors")
  /** Internal flag: set by edge function when a required field is absent.
   *  Extractions with _missingKey: true are filtered out before returning. */
  _missingKey?: boolean;
}

export interface LLMExtractionResult {
  extractions: NarrativeExtraction[];
  sectionsAnalyzed: string[];
  tokensUsed: number;
  processingTime: number;
  errors: string[];
}

// ============================================================================
// SECTION EXTRACTION — now delegates to narrativeParser.extractAllNarrativeSections
// ============================================================================

/**
 * Extract MD&A section from SEC filing HTML.
 * Kept for backward-compatibility; internally uses extractAllNarrativeSections.
 */
export function extractMDASection(html: string): string | null {
  const sections = extractAllNarrativeSections(html);
  return sections.mda.length > 0 ? sections.mda : null;
}

/**
 * Extract Risk Factors section from SEC filing HTML.
 */
export function extractRiskFactorsSection(html: string): string | null {
  const sections = extractAllNarrativeSections(html);
  return sections.riskFactors.length > 0 ? sections.riskFactors : null;
}

/**
 * Extract Business Description section from SEC filing HTML.
 */
export function extractBusinessSection(html: string): string | null {
  const sections = extractAllNarrativeSections(html);
  return sections.business.length > 0 ? sections.business : null;
}

/**
 * Clean HTML/iXBRL text for LLM processing.
 * Enhanced to handle iXBRL inline tags and all common HTML entities.
 */
export function cleanTextForLLM(html: string): string {
  // Remove script and style blocks first
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Strip iXBRL inline tags (ix:nonNumeric, ix:nonFraction, ix:header, etc.)
  text = text
    .replace(/<ix:[^>]*>[\s\S]*?<\/ix:[^>]*>/gi, '')
    .replace(/<ix:[^>]*\/>/gi, '')
    .replace(/<\/ix:[^>]*>/gi, '')
    .replace(/<ix:[^>]*>/gi, '');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/&#x[0-9a-fA-F]+;/g, ' ')
    .replace(/&[a-zA-Z]{2,8};/g, ' ');

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// ============================================================================
// LLM EXTRACTION
// ============================================================================

/**
 * Extract geographic data from narrative text using the extract_geographic_narrative
 * Supabase Edge Function (which calls OpenAI GPT-4).
 *
 * Enhancements (2026-04-23):
 * - Retries once on transient errors (5xx or network failure)
 * - Filters out extractions with _missingKey: true
 * - Text window increased to 50,000 chars
 */
export async function extractWithLLM(
  text: string,
  sectionName: string,
  ticker: string
): Promise<NarrativeExtraction[]> {
  console.log(`[LLM Extractor] Analyzing ${sectionName} for ${ticker}...`);
  console.log(`[LLM Extractor] Text length: ${text.length} characters`);

  const maxLength = 50000; // ~12,500 tokens
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;

  const invokeOnce = async (): Promise<NarrativeExtraction[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract_geographic_narrative', {
        body: { text: truncatedText, sectionName, ticker },
      });

      if (error) {
        console.error(`[LLM Extractor] Edge function error for ${sectionName}:`, error);
        return null;
      }

      if (!data || !data.extractions) {
        console.log(`[LLM Extractor] No extractions returned from LLM for ${sectionName}`);
        return [];
      }

      return data.extractions as NarrativeExtraction[];
    } catch (err) {
      console.error(`[LLM Extractor] Exception during LLM extraction (${sectionName}):`, err);
      return null;
    }
  };

  // First attempt
  let extractions = await invokeOnce();

  // Retry once on transient failure
  if (extractions === null) {
    console.log(`[LLM Extractor] Retrying ${sectionName} after transient error...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    extractions = await invokeOnce();
  }

  if (!extractions) {
    console.warn(`[LLM Extractor] Both attempts failed for ${sectionName}, returning []`);
    return [];
  }

  // Filter out extractions flagged as missing required keys
  const valid = extractions.filter(e => {
    if (e._missingKey) {
      console.warn(`[LLM Extractor] Dropping extraction with _missingKey=true from ${sectionName}:`, e);
      return false;
    }
    // Also drop extractions with no country AND no region
    if (!e.country && !e.region) {
      console.warn(`[LLM Extractor] Dropping extraction with no country/region from ${sectionName}:`, e);
      return false;
    }
    return true;
  });

  console.log(`[LLM Extractor] ✅ ${sectionName}: ${extractions.length} raw → ${valid.length} valid extractions`);
  return valid;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Deduplicate extractions by (channel, country, region, source).
 * When duplicates exist, keep the one with the highest confidence.
 */
function deduplicateExtractions(extractions: NarrativeExtraction[]): NarrativeExtraction[] {
  const confidenceRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const map = new Map<string, NarrativeExtraction>();

  for (const e of extractions) {
    const key = `${e.channel}|${e.country ?? ''}|${e.region ?? ''}|${e.source}`;
    const existing = map.get(key);
    if (!existing || confidenceRank[e.confidence] > confidenceRank[existing.confidence]) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract geographic data from ALL narrative sections in parallel.
 *
 * Enhancements (2026-04-23):
 * - Processes 7 sections (mda, riskFactors, geoNotes, business, item2Properties,
 *   exhibit21, segmentNotes) instead of 3
 * - Runs all section extractions in parallel via Promise.allSettled
 * - Deduplicates results before returning
 * - Filters _missingKey extractions
 */
export async function extractNarrativeData(
  html: string,
  ticker: string
): Promise<LLMExtractionResult> {
  console.log(`\n[LLM Extractor] ========================================`);
  console.log(`[LLM Extractor] Starting narrative extraction for ${ticker}`);
  console.log(`[LLM Extractor] ========================================`);

  const startTime = Date.now();
  const result: LLMExtractionResult = {
    extractions: [],
    sectionsAnalyzed: [],
    tokensUsed: 0,
    processingTime: 0,
    errors: [],
  };

  try {
    // Extract all 7 sections using the enhanced narrativeParser
    const sections = extractAllNarrativeSections(html);

    const sectionMap: Array<{ key: keyof typeof sections; label: string }> = [
      { key: 'mda',             label: 'MD&A' },
      { key: 'riskFactors',     label: 'Risk Factors' },
      { key: 'geoNotes',        label: 'Geographic Notes' },
      { key: 'business',        label: 'Business Description' },
      { key: 'item2Properties', label: 'Item 2 Properties' },
      { key: 'exhibit21',       label: 'Exhibit 21 Subsidiaries' },
      { key: 'segmentNotes',    label: 'Segment Notes' },
    ];

    // Run all section extractions in parallel
    const tasks = sectionMap
      .filter(({ key }) => sections[key].length > 100)
      .map(({ key, label }) => ({
        label,
        promise: extractWithLLM(cleanTextForLLM(sections[key]), label, ticker),
      }));

    console.log(`[LLM Extractor] Processing ${tasks.length} non-empty sections in parallel...`);

    const settled = await Promise.allSettled(tasks.map(t => t.promise));

    settled.forEach((outcome, idx) => {
      const label = tasks[idx].label;
      if (outcome.status === 'fulfilled') {
        result.extractions.push(...outcome.value);
        result.sectionsAnalyzed.push(label);
        console.log(`[LLM Extractor] ✅ ${label}: ${outcome.value.length} extractions`);
      } else {
        const msg = `${label} extraction failed: ${outcome.reason}`;
        result.errors.push(msg);
        console.warn(`[LLM Extractor] ⚠️ ${msg}`);
      }
    });

    // Deduplicate
    const before = result.extractions.length;
    result.extractions = deduplicateExtractions(result.extractions);
    console.log(`[LLM Extractor] Deduplication: ${before} → ${result.extractions.length} extractions`);

    result.processingTime = Date.now() - startTime;

    console.log(`\n[LLM Extractor] ========================================`);
    console.log(`[LLM Extractor] EXTRACTION COMPLETE`);
    console.log(`[LLM Extractor] Sections analyzed: ${result.sectionsAnalyzed.join(', ')}`);
    console.log(`[LLM Extractor] Total extractions: ${result.extractions.length}`);
    console.log(`[LLM Extractor] Processing time: ${result.processingTime}ms`);
    console.log(`[LLM Extractor] ========================================\n`);

    return result;
  } catch (error) {
    result.errors.push(`Narrative extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[LLM Extractor] ❌ Extraction failed:`, error);
    return result;
  }
}

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

export function extractionsToRevenueSegments(
  extractions: NarrativeExtraction[],
  fiscalYear: number
): Array<{
  region: string;
  countries: string[];
  revenueAmount: number;
  revenuePercentage: number;
  fiscalYear: number;
  source: 'narrative';
  confidence: 'high' | 'medium' | 'low';
  tableContext?: string;
}> {
  const segments: Array<{
    region: string;
    countries: string[];
    revenueAmount: number;
    revenuePercentage: number;
    fiscalYear: number;
    source: 'narrative';
    confidence: 'high' | 'medium' | 'low';
    tableContext?: string;
  }> = [];

  for (const extraction of extractions) {
    if (extraction.channel !== 'revenue') continue;
    if (!extraction.percentage && !extraction.amount) continue;

    const regionOrCountry = extraction.region || extraction.country || 'Unknown';
    const percentage = extraction.percentage || 0;
    const amount = extraction.amount || 0;

    segments.push({
      region: regionOrCountry,
      countries: extraction.country ? [extraction.country] : [],
      revenueAmount: amount,
      revenuePercentage: percentage,
      fiscalYear,
      source: 'narrative',
      confidence: extraction.confidence,
      tableContext: `Extracted from ${extraction.source}: ${extraction.context.substring(0, 100)}...`,
    });
  }

  console.log(`[LLM Extractor] Converted ${segments.length} extractions to revenue segments`);
  return segments;
}

export function extractionsToSupplierLocations(
  extractions: NarrativeExtraction[]
): Array<{
  country: string;
  supplierType: 'manufacturing' | 'component' | 'raw_material' | 'logistics' | 'other';
  source: 'narrative';
  confidence: 'high' | 'medium' | 'low';
  context?: string;
}> {
  const suppliers: Array<{
    country: string;
    supplierType: 'manufacturing' | 'component' | 'raw_material' | 'logistics' | 'other';
    source: 'narrative';
    confidence: 'high' | 'medium' | 'low';
    context?: string;
  }> = [];

  for (const extraction of extractions) {
    if (extraction.channel !== 'supply') continue;
    if (!extraction.country) continue;

    // Infer supplier type from context
    let supplierType: 'manufacturing' | 'component' | 'raw_material' | 'logistics' | 'other' = 'other';
    const ctx = extraction.context.toLowerCase();
    if (ctx.includes('manufactur')) supplierType = 'manufacturing';
    else if (ctx.includes('component')) supplierType = 'component';
    else if (ctx.includes('raw material') || ctx.includes('material')) supplierType = 'raw_material';
    else if (ctx.includes('logistic') || ctx.includes('transport') || ctx.includes('shipping')) supplierType = 'logistics';

    suppliers.push({
      country: extraction.country,
      supplierType,
      source: 'narrative',
      confidence: extraction.confidence,
      context: extraction.context,
    });
  }

  console.log(`[LLM Extractor] Converted ${suppliers.length} extractions to supplier locations`);
  return suppliers;
}

export function extractionsToFacilityLocations(
  extractions: NarrativeExtraction[]
): Array<{
  country: string;
  facilityType: 'office' | 'manufacturing' | 'warehouse' | 'r&d' | 'data_center' | 'retail' | 'other';
  source: 'narrative';
  confidence: 'high' | 'medium' | 'low';
  context?: string;
}> {
  const facilities: Array<{
    country: string;
    facilityType: 'office' | 'manufacturing' | 'warehouse' | 'r&d' | 'data_center' | 'retail' | 'other';
    source: 'narrative';
    confidence: 'high' | 'medium' | 'low';
    context?: string;
  }> = [];

  for (const extraction of extractions) {
    if (extraction.channel !== 'assets') continue;
    if (!extraction.country) continue;

    // Infer facility type from context
    let facilityType: 'office' | 'manufacturing' | 'warehouse' | 'r&d' | 'data_center' | 'retail' | 'other' = 'other';
    const ctx = extraction.context.toLowerCase();
    if (ctx.includes('office') || ctx.includes('headquarter')) facilityType = 'office';
    else if (ctx.includes('manufactur') || ctx.includes('plant') || ctx.includes('assembl')) facilityType = 'manufacturing';
    else if (ctx.includes('warehouse') || ctx.includes('distribution')) facilityType = 'warehouse';
    else if (ctx.includes('r&d') || ctx.includes('research') || ctx.includes('development')) facilityType = 'r&d';
    else if (ctx.includes('data center') || ctx.includes('datacenter')) facilityType = 'data_center';
    else if (ctx.includes('retail') || ctx.includes('store')) facilityType = 'retail';

    facilities.push({
      country: extraction.country,
      facilityType,
      source: 'narrative',
      confidence: extraction.confidence,
      context: extraction.context,
    });
  }

  console.log(`[LLM Extractor] Converted ${facilities.length} extractions to facility locations`);
  return facilities;
}

// ============================================================================
// EXPORT
// ============================================================================

export const llmNarrativeExtractor = {
  extractNarrativeData,
  extractWithLLM,
  extractMDASection,
  extractRiskFactorsSection,
  extractBusinessSection,
  cleanTextForLLM,
  extractionsToRevenueSegments,
  extractionsToSupplierLocations,
  extractionsToFacilityLocations,
};
