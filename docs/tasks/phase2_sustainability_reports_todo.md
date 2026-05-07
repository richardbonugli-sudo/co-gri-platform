# Phase 2: Sustainability Reports - Implementation Plan

## Overview
Implement comprehensive sustainability/ESG report fetching, PDF parsing, and integration into CO-GRI assessment channels.

## Timeline: 2-3 weeks

## Priority 1: Report Fetching Infrastructure (Week 1)

### Task 1.1: Create Supabase Edge Function for Report Discovery
**File**: `supabase/functions/fetch_sustainability_report/index.ts`
- Implement web scraping to find sustainability reports from company investor relations pages
- Search patterns: "sustainability report", "ESG report", "corporate responsibility", "annual report"
- Target file types: PDF, HTML
- Return: Report URLs, publication dates, file types
- Timeout: 30 seconds
- Error handling: Graceful fallback if no reports found

### Task 1.2: Create Supabase Edge Function for PDF Download
**File**: `supabase/functions/download_pdf_report/index.ts`
- Download PDF files from discovered URLs
- Convert to base64 for storage/transmission
- Size limit: 50MB per file
- Return: Base64 encoded PDF content
- Error handling: Handle 404, timeouts, large files

### Task 1.3: Update Sustainability Report Parser - Add Fetching
**File**: `src/services/dataIntegration/sustainabilityReportParser.ts`
- Add `fetchSustainabilityReport(ticker: string)` function
- Call Supabase edge functions to discover and download reports
- Cache results in memory (session-based)
- Return: `{ url: string, content: string, fileType: 'pdf' | 'html', publishDate: string }`

## Priority 2: PDF Parsing Capability (Week 1-2)

### Task 2.1: Install PDF Parsing Library
**Command**: `pnpm add pdf-parse`
- Add pdf-parse for client-side PDF text extraction
- Alternative: Use Supabase edge function with Deno's PDF parsing

### Task 2.2: Create PDF Parser Module
**File**: `src/services/dataIntegration/pdfParser.ts`
- Extract text from PDF using pdf-parse
- Implement section detection (Table of Contents, Supply Chain, Facilities, etc.)
- Handle multi-column layouts
- Extract tables (basic text-based extraction)
- Return: Structured text by section

### Task 2.3: Enhance Sustainability Report Parser - Add PDF Parsing
**File**: `src/services/dataIntegration/sustainabilityReportParser.ts`
- Integrate PDF parser
- Parse sustainability reports for:
  - Supply chain transparency (Tier 1/2/3 suppliers by country)
  - Facility locations with environmental data
  - Employee counts by country
  - Community investment by country
  - Conflict minerals sourcing
- Update `parseSustainabilityReport()` to handle both HTML and PDF
- Add confidence scoring based on data quality

## Priority 3: Integration into Channels (Week 2)

### Task 3.1: Update Structured Data Integrator - Supply Chain Channel
**File**: `src/services/structuredDataIntegrator.ts`
- Add sustainability report as PRIMARY evidence source for supply chain channel
- Evidence hierarchy: Sustainability Report → SEC Narrative → Fallback
- Use `sustainabilityToChannelWeights()` for weight calculation
- Update validation rules

### Task 3.2: Update Structured Data Integrator - Operations Channel
**File**: `src/services/structuredDataIntegrator.ts`
- Add sustainability report as SUPPLEMENTARY evidence for operations channel
- Combine with Exhibit 21 and facility locations
- Weight by employee counts or facility counts
- Update validation rules

### Task 3.3: Update Structured Data Integrator - Assets Channel
**File**: `src/services/structuredDataIntegrator.ts`
- Add sustainability report facility data as TERTIARY evidence
- Evidence hierarchy: Exhibit 21 → PP&E → Sustainability Facilities → Fallback
- Use environmental metrics for confidence scoring

## Priority 4: Testing & Validation (Week 2-3)

### Task 4.1: Create Test Suite
**File**: `src/services/dataIntegration/__tests__/sustainabilityReportParser.test.ts`
- Test report fetching with mock edge function responses
- Test PDF parsing with sample sustainability reports
- Test channel integration with various data combinations
- Test error handling and fallback logic

### Task 4.2: Manual Testing with Real Companies
- Test with companies known to have good sustainability reports:
  - Apple (AAPL) - Comprehensive supplier list
  - Nike (NKE) - Detailed facility locations
  - Unilever - Supply chain transparency
  - Patagonia - Environmental metrics
- Validate extracted data against actual reports
- Document success rates and issues

### Task 4.3: Performance Optimization
- Add caching for downloaded reports (session-based)
- Optimize PDF parsing (limit to relevant sections)
- Add timeout controls for edge functions
- Monitor memory usage

## Expected Outcomes

### Data Quality Improvements
**Supply Chain Channel**:
- Before: 25% evidence, 75% fallback
- After: 60-70% evidence, 30-40% fallback (+35-45% improvement)

**Operations Channel**:
- Before: 70% evidence (with Exhibit 21), 30% fallback
- After: 80-85% evidence, 15-20% fallback (+10-15% improvement)

**Assets Channel**:
- Before: 65% evidence (with Exhibit 21), 35% fallback
- After: 70-75% evidence, 25-30% fallback (+5-10% improvement)

### Coverage Metrics
- **Companies with sustainability reports**: ~60-70% of S&P 500
- **Average suppliers identified per report**: 20-50 countries
- **Average facilities identified per report**: 10-30 locations
- **Parsing success rate target**: >80%

## Dependencies
- Supabase Edge Functions (for web scraping and PDF download)
- pdf-parse library (for PDF text extraction)
- Existing sustainability report parser structure (already created)
- Exhibit 21 parser (completed in Phase 1)

## Risks & Mitigations
1. **Risk**: PDF parsing accuracy varies by report format
   - **Mitigation**: Implement multiple parsing strategies, use confidence scoring
2. **Risk**: Web scraping may be blocked by some corporate sites
   - **Mitigation**: Implement retry logic, use multiple search strategies
3. **Risk**: Large PDF files may cause memory issues
   - **Mitigation**: Implement size limits, stream processing if needed
4. **Risk**: Sustainability reports may not be available for all companies
   - **Mitigation**: Graceful fallback to existing evidence sources

## Success Criteria
- ✅ Edge functions successfully fetch reports for >60% of test companies
- ✅ PDF parser extracts structured data with >80% accuracy
- ✅ Supply chain channel evidence rate improves by >30%
- ✅ Integration completes without breaking existing functionality
- ✅ Performance remains acceptable (<5s for full integration)