/**
 * LLM-Based Narrative Extractor
 * 
 * Uses GPT-4 to extract geographic exposure data from narrative text in SEC filings
 * Implements FIX #5: AI-powered extraction from prose sections
 * 
 * Target Sections:
 * - Management Discussion & Analysis (MD&A)
 * - Risk Factors
 * - Business Description
 * - Geographic Information Notes
 * 
 * Example Extractions:
 * - "Our operations in China accounted for 23% of revenue" → China: 23%
 * - "We have manufacturing facilities in Vietnam, Thailand, and Malaysia" → [Vietnam, Thailand, Malaysia]
 * - "European markets contributed approximately 30% of total sales" → Europe: 30%
 * 
 * CHANGELOG:
 * - 2025-12-08: Initial implementation with OpenAI GPT-4 integration
 */

import { supabase } from '@/lib/supabase';

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
}

export interface LLMExtractionResult {
  extractions: NarrativeExtraction[];
  sectionsAnalyzed: string[];
  tokensUsed: number;
  processingTime: number;
  errors: string[];
}

// ============================================================================
// SECTION EXTRACTION
// ============================================================================

/**
 * Extract MD&A section from SEC filing HTML
 */
export function extractMDASection(html: string): string | null {
  // Common MD&A section patterns
  const patterns = [
    /Item\s+7[.\s]+Management['\u2019]?s Discussion and Analysis/i,
    /Item\s+7[.\s]+MD&A/i,
    /Management['\u2019]?s Discussion and Analysis/i,
    /MANAGEMENT['\u2019]?S DISCUSSION AND ANALYSIS/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const startIdx = match.index || 0;
      // Extract next 50,000 characters (approximately 10-15 pages)
      const section = html.substring(startIdx, startIdx + 50000);
      console.log(`[LLM Extractor] Found MD&A section at position ${startIdx}`);
      return section;
    }
  }
  
  console.log(`[LLM Extractor] MD&A section not found`);
  return null;
}

/**
 * Extract Risk Factors section from SEC filing HTML
 */
export function extractRiskFactorsSection(html: string): string | null {
  const patterns = [
    /Item\s+1A[.\s]+Risk Factors/i,
    /RISK FACTORS/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const startIdx = match.index || 0;
      const section = html.substring(startIdx, startIdx + 30000);
      console.log(`[LLM Extractor] Found Risk Factors section at position ${startIdx}`);
      return section;
    }
  }
  
  console.log(`[LLM Extractor] Risk Factors section not found`);
  return null;
}

/**
 * Extract Business Description section from SEC filing HTML
 */
export function extractBusinessSection(html: string): string | null {
  const patterns = [
    /Item\s+1[.\s]+Business/i,
    /Item\s+1[.\s]+Description of Business/i,
    /BUSINESS/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const startIdx = match.index || 0;
      const section = html.substring(startIdx, startIdx + 40000);
      console.log(`[LLM Extractor] Found Business section at position ${startIdx}`);
      return section;
    }
  }
  
  console.log(`[LLM Extractor] Business section not found`);
  return null;
}

/**
 * Clean HTML text for LLM processing
 * Removes HTML tags, excessive whitespace, and special characters
 */
export function cleanTextForLLM(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#\d+;/g, ' ');
  
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ');
  text = text.trim();
  
  return text;
}

// ============================================================================
// LLM EXTRACTION
// ============================================================================

/**
 * Extract geographic data from narrative text using OpenAI GPT-4
 * 
 * This function calls a Supabase Edge Function that handles the OpenAI API call
 */
export async function extractWithLLM(
  text: string,
  sectionName: string,
  ticker: string
): Promise<NarrativeExtraction[]> {
  
  console.log(`[LLM Extractor] Analyzing ${sectionName} for ${ticker}...`);
  console.log(`[LLM Extractor] Text length: ${text.length} characters`);
  
  // Truncate if too long (GPT-4 has token limits)
  const maxLength = 15000; // ~3,750 tokens
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
  
  try {
    const { data, error } = await supabase.functions.invoke('extract_geographic_narrative', {
      body: {
        text: truncatedText,
        sectionName,
        ticker
      }
    });
    
    if (error) {
      console.error(`[LLM Extractor] Error calling edge function:`, error);
      return [];
    }
    
    if (!data || !data.extractions) {
      console.log(`[LLM Extractor] No extractions returned from LLM`);
      return [];
    }
    
    console.log(`[LLM Extractor] ✅ Extracted ${data.extractions.length} items from ${sectionName}`);
    return data.extractions;
    
  } catch (error) {
    console.error(`[LLM Extractor] Exception during LLM extraction:`, error);
    return [];
  }
}

/**
 * Main function: Extract geographic data from all narrative sections
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
    errors: []
  };
  
  try {
    // Extract MD&A section
    const mdaSection = extractMDASection(html);
    if (mdaSection) {
      const cleanedMDA = cleanTextForLLM(mdaSection);
      const mdaExtractions = await extractWithLLM(cleanedMDA, 'MD&A', ticker);
      result.extractions.push(...mdaExtractions);
      result.sectionsAnalyzed.push('MD&A');
    }
    
    // Extract Risk Factors section
    const riskSection = extractRiskFactorsSection(html);
    if (riskSection) {
      const cleanedRisk = cleanTextForLLM(riskSection);
      const riskExtractions = await extractWithLLM(cleanedRisk, 'Risk Factors', ticker);
      result.extractions.push(...riskExtractions);
      result.sectionsAnalyzed.push('Risk Factors');
    }
    
    // Extract Business section
    const businessSection = extractBusinessSection(html);
    if (businessSection) {
      const cleanedBusiness = cleanTextForLLM(businessSection);
      const businessExtractions = await extractWithLLM(cleanedBusiness, 'Business Description', ticker);
      result.extractions.push(...businessExtractions);
      result.sectionsAnalyzed.push('Business Description');
    }
    
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

/**
 * Convert LLM extractions to revenue segments
 */
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
      tableContext: `Extracted from ${extraction.source}: ${extraction.context.substring(0, 100)}...`
    });
  }
  
  console.log(`[LLM Extractor] Converted ${segments.length} extractions to revenue segments`);
  return segments;
}

/**
 * Convert LLM extractions to supplier locations
 */
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
    
    suppliers.push({
      country: extraction.country,
      supplierType: 'other',
      source: 'narrative',
      confidence: extraction.confidence,
      context: extraction.context
    });
  }
  
  console.log(`[LLM Extractor] Converted ${suppliers.length} extractions to supplier locations`);
  return suppliers;
}

/**
 * Convert LLM extractions to facility locations
 */
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
    
    facilities.push({
      country: extraction.country,
      facilityType: 'other',
      source: 'narrative',
      confidence: extraction.confidence,
      context: extraction.context
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
  extractionsToFacilityLocations
};