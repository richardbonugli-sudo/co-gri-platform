/**
 * Sustainability/ESG Report Parser
 * 
 * Parses sustainability and ESG reports to extract supply chain transparency data,
 * facility locations, environmental metrics, and social impact information.
 * 
 * STRATEGIC VALUE:
 * - Supply Chain channel: Tier 1/2/3 supplier locations (very high confidence)
 * - Assets channel: Facility locations with environmental data
 * - Operations channel: Employee counts, community programs by country
 * - Revenue channel: Market presence indicators
 * 
 * DATA SOURCES:
 * 1. Company sustainability reports (PDF/HTML from investor relations)
 * 2. CDP (Carbon Disclosure Project) submissions
 * 3. GRI (Global Reporting Initiative) database
 * 4. SASB (Sustainability Accounting Standards Board) disclosures
 * 5. TCFD (Task Force on Climate-related Financial Disclosures) reports
 * 
 * KEY SECTIONS TO PARSE:
 * - Supply chain mapping (Tier 1, 2, 3 suppliers by country)
 * - Scope 3 emissions by supplier location
 * - Facility energy consumption and water usage
 * - Employee demographics by region
 * - Community investment by country
 * - Conflict minerals sourcing
 * - Human rights due diligence
 * 
 * PHASE 2 ENHANCEMENTS (2025-12-09):
 * - Added report fetching via Supabase Edge Functions
 * - Integrated PDF parsing capability
 * - Enhanced HTML parsing for multiple report formats
 * - Added caching for downloaded reports
 */

import * as cheerio from 'cheerio';
import { normalizeCountryName, isActualCountry } from '../countryValidator';
import { supabase } from '@/lib/supabase';
import { parsePDF, PDFParseResult, getSectionByType } from './pdfParser';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SupplierTransparencyData {
  country: string;
  tier: 1 | 2 | 3; // Supply chain tier
  supplierCount: number;
  supplierNames?: string[];
  supplierType: 'manufacturing' | 'component' | 'raw_material' | 'logistics' | 'services' | 'other';
  certifications?: string[]; // e.g., ISO 14001, SA8000
  auditStatus?: 'audited' | 'not_audited' | 'pending';
  riskLevel?: 'high' | 'medium' | 'low';
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FacilityEnvironmentalData {
  country: string;
  city?: string;
  facilityName?: string;
  facilityType: 'manufacturing' | 'office' | 'warehouse' | 'r&d' | 'data_center' | 'retail' | 'distribution' | 'other';
  
  // Environmental metrics
  energyConsumption?: number; // MWh
  waterUsage?: number; // cubic meters
  wasteGenerated?: number; // metric tons
  ghgEmissions?: number; // metric tons CO2e
  renewableEnergyPercent?: number;
  
  // Certifications
  certifications?: string[]; // e.g., LEED, ISO 14001
  
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface EmployeeData {
  country: string;
  employeeCount: number;
  employeeType?: 'full_time' | 'part_time' | 'contract' | 'all';
  genderBreakdown?: {
    male: number;
    female: number;
    other?: number;
  };
  diversityMetrics?: Record<string, number>;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CommunityInvestment {
  country: string;
  investmentAmount?: number; // USD
  currency?: string;
  programType: 'education' | 'health' | 'environment' | 'economic_development' | 'disaster_relief' | 'other';
  programDescription?: string;
  beneficiaries?: number;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ConflictMineralsData {
  country: string;
  mineral: '3TG' | 'tin' | 'tantalum' | 'tungsten' | 'gold' | 'cobalt' | 'mica' | 'other';
  smelterCount?: number;
  smelterNames?: string[];
  conflictFree: boolean;
  auditStatus: 'RMAP_conformant' | 'RMAP_active' | 'not_audited' | 'unknown';
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SustainabilityReportData {
  ticker: string;
  reportYear: number;
  reportDate: string;
  reportType: 'sustainability' | 'esg' | 'cdp' | 'gri' | 'integrated' | 'csr';
  reportUrl?: string;
  
  // Supply chain transparency
  supplierData: SupplierTransparencyData[];
  totalTier1Suppliers: number;
  totalTier2Suppliers: number;
  totalTier3Suppliers: number;
  
  // Facilities
  facilities: FacilityEnvironmentalData[];
  totalFacilities: number;
  
  // Employees
  employeeData: EmployeeData[];
  totalEmployees: number;
  
  // Community investment
  communityInvestments: CommunityInvestment[];
  totalCommunityInvestment: number;
  
  // Conflict minerals
  conflictMinerals: ConflictMineralsData[];
  
  // Metadata
  reportFound: boolean;
  parsingSuccess: boolean;
  parsingErrors: string[];
  sectionsFound: string[];
  
  // Quality metrics
  countriesIdentified: number;
  dataCompleteness: number; // 0-1 score
  
  // Phase 2: PDF parsing metadata
  isPDF: boolean;
  pdfParseResult?: PDFParseResult;
}

// In-memory cache for downloaded reports (session-based)
const reportCache = new Map<string, { content: string; fileType: 'pdf' | 'html'; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

// ============================================================================
// REPORT FETCHING (Phase 2)
// ============================================================================

/**
 * Fetch sustainability report from company website via Supabase Edge Function
 */
export async function fetchSustainabilityReport(
  ticker: string,
  year?: number
): Promise<{ url: string; content: string; fileType: 'pdf' | 'html'; reportType: string } | null> {
  
  console.log(`\n[Sustainability Parser] ========================================`);
  console.log(`[Sustainability Parser] Fetching sustainability report for ${ticker}`);
  if (year) console.log(`[Sustainability Parser] Target year: ${year}`);
  console.log(`[Sustainability Parser] ========================================\n`);
  
  // Check cache first
  const cacheKey = `${ticker}_${year || 'latest'}`;
  const cached = reportCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[Sustainability Parser] ✅ Using cached report`);
    return {
      url: 'cached',
      content: cached.content,
      fileType: cached.fileType,
      reportType: 'sustainability'
    };
  }
  
  try {
    // Step 1: Discover report URLs
    console.log(`[Sustainability Parser] Step 1: Discovering report URLs...`);
    const { data: discoverData, error: discoverError } = await supabase.functions.invoke('fetch_sustainability_report', {
      body: { ticker, year }
    });
    
    if (discoverError || !discoverData?.success) {
      console.log(`[Sustainability Parser] ⚠️ Report discovery failed:`, discoverError || discoverData?.error);
      return null;
    }
    
    if (!discoverData.reports || discoverData.reports.length === 0) {
      console.log(`[Sustainability Parser] ⚠️ No reports found for ${ticker}`);
      return null;
    }
    
    console.log(`[Sustainability Parser] ✅ Found ${discoverData.reports.length} report(s)`);
    
    // Select the most recent report
    const report = discoverData.reports[0];
    console.log(`[Sustainability Parser] Selected report: ${report.title}`);
    console.log(`[Sustainability Parser] URL: ${report.url}`);
    console.log(`[Sustainability Parser] Type: ${report.fileType}`);
    
    // Step 2: Download report content
    if (report.fileType === 'pdf') {
      console.log(`[Sustainability Parser] Step 2: Downloading PDF...`);
      const { data: downloadData, error: downloadError } = await supabase.functions.invoke('download_pdf_report', {
        body: { url: report.url }
      });
      
      if (downloadError || !downloadData?.success) {
        console.log(`[Sustainability Parser] ⚠️ PDF download failed:`, downloadError || downloadData?.error);
        return null;
      }
      
      console.log(`[Sustainability Parser] ✅ PDF downloaded: ${(downloadData.fileSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Cache the result
      reportCache.set(cacheKey, {
        content: downloadData.content,
        fileType: 'pdf',
        timestamp: Date.now()
      });
      
      return {
        url: report.url,
        content: downloadData.content,
        fileType: 'pdf',
        reportType: report.reportType
      };
      
    } else {
      // HTML report - fetch directly
      console.log(`[Sustainability Parser] Step 2: Fetching HTML report...`);
      const response = await fetch(report.url);
      
      if (!response.ok) {
        console.log(`[Sustainability Parser] ⚠️ HTML fetch failed: ${response.status}`);
        return null;
      }
      
      const html = await response.text();
      console.log(`[Sustainability Parser] ✅ HTML fetched: ${(html.length / 1024).toFixed(2)}KB`);
      
      // Cache the result
      reportCache.set(cacheKey, {
        content: html,
        fileType: 'html',
        timestamp: Date.now()
      });
      
      return {
        url: report.url,
        content: html,
        fileType: 'html',
        reportType: report.reportType
      };
    }
    
  } catch (error) {
    console.error(`[Sustainability Parser] ❌ Error fetching report:`, error);
    return null;
  }
}

// ============================================================================
// PDF PARSING INTEGRATION (Phase 2)
// ============================================================================

/**
 * Parse PDF sustainability report
 */
async function parsePDFSustainabilityReport(
  base64Content: string,
  ticker: string,
  reportYear: number
): Promise<Partial<SustainabilityReportData>> {
  
  console.log(`[Sustainability Parser] Parsing PDF report...`);
  
  const pdfResult = await parsePDF(base64Content);
  
  if (!pdfResult.parsingSuccess) {
    console.log(`[Sustainability Parser] ❌ PDF parsing failed`);
    return {
      isPDF: true,
      pdfParseResult: pdfResult,
      parsingErrors: pdfResult.parsingErrors
    };
  }
  
  console.log(`[Sustainability Parser] ✅ PDF parsed: ${pdfResult.pages.length} pages`);
  
  // Extract data from PDF sections
  const supplierData: SupplierTransparencyData[] = [];
  const facilities: FacilityEnvironmentalData[] = [];
  const employeeData: EmployeeData[] = [];
  const sectionsFound: string[] = [];
  
  // Parse supply chain section
  const supplyChainSection = getSectionByType(pdfResult, 'supply_chain');
  if (supplyChainSection) {
    console.log(`[Sustainability Parser] Found supply chain section in PDF`);
    sectionsFound.push('Supply Chain (PDF)');
    
    // Extract supplier data from text
    const supplierMatches = supplyChainSection.content.matchAll(/(\d+)\s+(?:suppliers?|vendors?)\s+(?:in|located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
    
    for (const match of supplierMatches) {
      const count = parseInt(match[1]);
      const countryName = match[2];
      
      if (isActualCountry(countryName)) {
        supplierData.push({
          country: normalizeCountryName(countryName),
          tier: 1,
          supplierCount: count,
          supplierType: 'manufacturing',
          source: `Sustainability Report ${reportYear} - PDF`,
          confidence: 'high'
        });
      }
    }
  }
  
  // Parse facilities section
  const facilitiesSection = getSectionByType(pdfResult, 'facilities');
  if (facilitiesSection) {
    console.log(`[Sustainability Parser] Found facilities section in PDF`);
    sectionsFound.push('Facilities (PDF)');
    
    // Extract facility locations from text
    const facilityMatches = facilitiesSection.content.matchAll(/(?:facility|plant|office|site)\s+(?:in|located in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
    
    const countryCounts = new Map<string, number>();
    for (const match of facilityMatches) {
      const countryName = match[1];
      
      if (isActualCountry(countryName)) {
        const normalized = normalizeCountryName(countryName);
        countryCounts.set(normalized, (countryCounts.get(normalized) || 0) + 1);
      }
    }
    
    for (const [country, count] of countryCounts) {
      facilities.push({
        country,
        facilityType: 'manufacturing',
        source: `Sustainability Report ${reportYear} - PDF`,
        confidence: 'medium'
      });
    }
  }
  
  // Parse social/employee section
  const socialSection = getSectionByType(pdfResult, 'social');
  if (socialSection) {
    console.log(`[Sustainability Parser] Found social section in PDF`);
    sectionsFound.push('Social/Employees (PDF)');
    
    // Extract employee data from text
    const employeeMatches = socialSection.content.matchAll(/(\d+(?:,\d+)*)\s+(?:employees?|staff|workforce)\s+(?:in|located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
    
    for (const match of employeeMatches) {
      const count = parseInt(match[1].replace(/,/g, ''));
      const countryName = match[2];
      
      if (isActualCountry(countryName)) {
        employeeData.push({
          country: normalizeCountryName(countryName),
          employeeCount: count,
          employeeType: 'all',
          source: `Sustainability Report ${reportYear} - PDF`,
          confidence: 'medium'
        });
      }
    }
  }
  
  return {
    isPDF: true,
    pdfParseResult: pdfResult,
    supplierData,
    facilities,
    employeeData,
    sectionsFound
  };
}

// ============================================================================
// SUPPLIER TRANSPARENCY PARSING
// ============================================================================

/**
 * Parse supplier transparency section
 * Common patterns:
 * - "Tier 1 suppliers: 150 across 25 countries"
 * - "Major suppliers in China (45), Vietnam (30), Thailand (20)"
 * - Table: Country | Supplier Count | Tier
 */
function parseSupplierTransparency(
  html: string,
  reportYear: number
): SupplierTransparencyData[] {
  
  const suppliers: SupplierTransparencyData[] = [];
  const $ = cheerio.load(html);
  
  console.log(`[Sustainability Parser] Parsing supplier transparency data...`);
  
  // Look for supplier-related sections
  const supplierKeywords = [
    'supplier', 'supply chain', 'tier 1', 'tier 2', 'tier 3',
    'manufacturing partner', 'contract manufacturer', 'vendor'
  ];
  
  // Extract text sections mentioning suppliers
  const bodyText = $('body').text();
  const sentences = bodyText.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const hasSupplierKeyword = supplierKeywords.some(kw => 
      sentence.toLowerCase().includes(kw)
    );
    
    if (!hasSupplierKeyword) continue;
    
    // Pattern: "X suppliers in Country"
    const countryCountPattern = /(\d+)\s+(?:suppliers?|vendors?|partners?)\s+(?:in|located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    let match;
    
    while ((match = countryCountPattern.exec(sentence)) !== null) {
      const count = parseInt(match[1]);
      const countryName = match[2];
      
      if (isActualCountry(countryName)) {
        const normalized = normalizeCountryName(countryName);
        
        // Determine tier from context
        let tier: 1 | 2 | 3 = 1;
        if (sentence.toLowerCase().includes('tier 2')) tier = 2;
        else if (sentence.toLowerCase().includes('tier 3')) tier = 3;
        
        suppliers.push({
          country: normalized,
          tier,
          supplierCount: count,
          supplierType: 'manufacturing',
          source: `Sustainability Report ${reportYear}`,
          confidence: 'high'
        });
      }
    }
  }
  
  // Look for supplier tables
  $('table').each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    
    if (!supplierKeywords.some(kw => tableText.includes(kw))) {
      return; // Skip non-supplier tables
    }
    
    console.log(`[Sustainability Parser] ✅ Found supplier table`);
    
    const rows: string[][] = [];
    $(table).find('tr').each((_, row) => {
      const cells: string[] = [];
      $(row).find('td, th').each((_, cell) => {
        cells.push($(cell).text().trim());
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length < 2) return;
    
    // Identify columns
    const headerRow = rows[0];
    let countryColIdx = -1;
    let countColIdx = -1;
    let tierColIdx = -1;
    
    headerRow.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('country') || headerLower.includes('location')) {
        countryColIdx = idx;
      }
      if (headerLower.includes('count') || headerLower.includes('number') || headerLower.includes('suppliers')) {
        countColIdx = idx;
      }
      if (headerLower.includes('tier')) {
        tierColIdx = idx;
      }
    });
    
    if (countryColIdx === -1) return;
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length <= countryColIdx) continue;
      
      const countryName = row[countryColIdx];
      if (!isActualCountry(countryName)) continue;
      
      const normalized = normalizeCountryName(countryName);
      
      let count = 1;
      if (countColIdx !== -1 && row.length > countColIdx) {
        const countMatch = row[countColIdx].match(/(\d+)/);
        if (countMatch) {
          count = parseInt(countMatch[1]);
        }
      }
      
      let tier: 1 | 2 | 3 = 1;
      if (tierColIdx !== -1 && row.length > tierColIdx) {
        const tierStr = row[tierColIdx].toLowerCase();
        if (tierStr.includes('2')) tier = 2;
        else if (tierStr.includes('3')) tier = 3;
      }
      
      suppliers.push({
        country: normalized,
        tier,
        supplierCount: count,
        supplierType: 'manufacturing',
        source: `Sustainability Report ${reportYear} - Table`,
        confidence: 'high'
      });
    }
  });
  
  console.log(`[Sustainability Parser] ✅ Extracted ${suppliers.length} supplier entries`);
  
  return suppliers;
}

// ============================================================================
// FACILITY ENVIRONMENTAL DATA PARSING
// ============================================================================

/**
 * Parse facility environmental data
 * Common sections: "Our Facilities", "Environmental Performance", "Energy & Emissions"
 */
function parseFacilityEnvironmentalData(
  html: string,
  reportYear: number
): FacilityEnvironmentalData[] {
  
  const facilities: FacilityEnvironmentalData[] = [];
  const $ = cheerio.load(html);
  
  console.log(`[Sustainability Parser] Parsing facility environmental data...`);
  
  // Look for facility tables with environmental metrics
  $('table').each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    
    const facilityKeywords = ['facility', 'site', 'location', 'plant', 'office'];
    const envKeywords = ['energy', 'water', 'emissions', 'ghg', 'waste', 'renewable'];
    
    const hasFacility = facilityKeywords.some(kw => tableText.includes(kw));
    const hasEnv = envKeywords.some(kw => tableText.includes(kw));
    
    if (!hasFacility || !hasEnv) return;
    
    console.log(`[Sustainability Parser] ✅ Found facility environmental table`);
    
    const rows: string[][] = [];
    $(table).find('tr').each((_, row) => {
      const cells: string[] = [];
      $(row).find('td, th').each((_, cell) => {
        cells.push($(cell).text().trim());
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length < 2) return;
    
    // Identify columns
    const headerRow = rows[0];
    let locationColIdx = -1;
    let energyColIdx = -1;
    let waterColIdx = -1;
    let emissionsColIdx = -1;
    
    headerRow.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('location') || headerLower.includes('facility') || headerLower.includes('site')) {
        locationColIdx = idx;
      }
      if (headerLower.includes('energy')) {
        energyColIdx = idx;
      }
      if (headerLower.includes('water')) {
        waterColIdx = idx;
      }
      if (headerLower.includes('emission') || headerLower.includes('ghg') || headerLower.includes('co2')) {
        emissionsColIdx = idx;
      }
    });
    
    if (locationColIdx === -1) return;
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length <= locationColIdx) continue;
      
      const location = row[locationColIdx];
      
      // Extract country from location string
      const countryPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
      const matches = location.match(countryPattern);
      
      if (!matches) continue;
      
      let country = '';
      for (const match of matches) {
        if (isActualCountry(match)) {
          country = normalizeCountryName(match);
          break;
        }
      }
      
      if (!country) continue;
      
      const facility: FacilityEnvironmentalData = {
        country,
        facilityName: location,
        facilityType: 'manufacturing',
        source: `Sustainability Report ${reportYear} - Environmental Table`,
        confidence: 'high'
      };
      
      // Extract energy consumption
      if (energyColIdx !== -1 && row.length > energyColIdx) {
        const energyMatch = row[energyColIdx].match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (energyMatch) {
          facility.energyConsumption = parseFloat(energyMatch[1].replace(/,/g, ''));
        }
      }
      
      // Extract water usage
      if (waterColIdx !== -1 && row.length > waterColIdx) {
        const waterMatch = row[waterColIdx].match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (waterMatch) {
          facility.waterUsage = parseFloat(waterMatch[1].replace(/,/g, ''));
        }
      }
      
      // Extract emissions
      if (emissionsColIdx !== -1 && row.length > emissionsColIdx) {
        const emissionsMatch = row[emissionsColIdx].match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (emissionsMatch) {
          facility.ghgEmissions = parseFloat(emissionsMatch[1].replace(/,/g, ''));
        }
      }
      
      facilities.push(facility);
    }
  });
  
  console.log(`[Sustainability Parser] ✅ Extracted ${facilities.length} facilities with environmental data`);
  
  return facilities;
}

// ============================================================================
// EMPLOYEE DATA PARSING
// ============================================================================

/**
 * Parse employee data by country
 * Common sections: "Our People", "Workforce", "Employee Demographics"
 */
function parseEmployeeData(
  html: string,
  reportYear: number
): EmployeeData[] {
  
  const employees: EmployeeData[] = [];
  const $ = cheerio.load(html);
  
  console.log(`[Sustainability Parser] Parsing employee data...`);
  
  // Look for employee tables
  $('table').each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    
    const employeeKeywords = ['employee', 'workforce', 'staff', 'headcount'];
    
    if (!employeeKeywords.some(kw => tableText.includes(kw))) return;
    
    console.log(`[Sustainability Parser] ✅ Found employee table`);
    
    const rows: string[][] = [];
    $(table).find('tr').each((_, row) => {
      const cells: string[] = [];
      $(row).find('td, th').each((_, cell) => {
        cells.push($(cell).text().trim());
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length < 2) return;
    
    // Identify columns
    const headerRow = rows[0];
    let countryColIdx = -1;
    let countColIdx = -1;
    
    headerRow.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('country') || headerLower.includes('region') || headerLower.includes('location')) {
        countryColIdx = idx;
      }
      if (headerLower.includes('count') || headerLower.includes('number') || headerLower.includes('employees')) {
        countColIdx = idx;
      }
    });
    
    if (countryColIdx === -1 || countColIdx === -1) return;
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length <= Math.max(countryColIdx, countColIdx)) continue;
      
      const countryName = row[countryColIdx];
      if (!isActualCountry(countryName)) continue;
      
      const normalized = normalizeCountryName(countryName);
      
      const countMatch = row[countColIdx].match(/(\d+(?:,\d+)*)/);
      if (!countMatch) continue;
      
      const count = parseInt(countMatch[1].replace(/,/g, ''));
      
      employees.push({
        country: normalized,
        employeeCount: count,
        employeeType: 'all',
        source: `Sustainability Report ${reportYear} - Employee Table`,
        confidence: 'high'
      });
    }
  });
  
  console.log(`[Sustainability Parser] ✅ Extracted employee data for ${employees.length} countries`);
  
  return employees;
}

// ============================================================================
// MAIN PARSING FUNCTION (Enhanced for Phase 2)
// ============================================================================

/**
 * Parse sustainability report (HTML or PDF)
 */
export async function parseSustainabilityReport(
  ticker: string,
  reportYear: number,
  content: string,
  fileType: 'html' | 'pdf',
  reportUrl?: string
): Promise<SustainabilityReportData> {
  
  console.log(`\n[Sustainability Parser] ========================================`);
  console.log(`[Sustainability Parser] Parsing sustainability report for ${ticker}`);
  console.log(`[Sustainability Parser] Report Year: ${reportYear}`);
  console.log(`[Sustainability Parser] File Type: ${fileType}`);
  console.log(`[Sustainability Parser] ========================================\n`);
  
  const result: SustainabilityReportData = {
    ticker,
    reportYear,
    reportDate: `${reportYear}-12-31`,
    reportType: 'sustainability',
    reportUrl,
    supplierData: [],
    totalTier1Suppliers: 0,
    totalTier2Suppliers: 0,
    totalTier3Suppliers: 0,
    facilities: [],
    totalFacilities: 0,
    employeeData: [],
    totalEmployees: 0,
    communityInvestments: [],
    totalCommunityInvestment: 0,
    conflictMinerals: [],
    reportFound: true,
    parsingSuccess: false,
    parsingErrors: [],
    sectionsFound: [],
    countriesIdentified: 0,
    dataCompleteness: 0,
    isPDF: fileType === 'pdf'
  };
  
  try {
    if (fileType === 'pdf') {
      // Parse PDF
      const pdfData = await parsePDFSustainabilityReport(content, ticker, reportYear);
      
      result.supplierData = pdfData.supplierData || [];
      result.facilities = pdfData.facilities || [];
      result.employeeData = pdfData.employeeData || [];
      result.sectionsFound = pdfData.sectionsFound || [];
      result.pdfParseResult = pdfData.pdfParseResult;
      
      if (pdfData.parsingErrors) {
        result.parsingErrors.push(...pdfData.parsingErrors);
      }
      
    } else {
      // Parse HTML
      console.log(`[Sustainability Parser] Step 1: Parsing supplier transparency...`);
      result.supplierData = parseSupplierTransparency(content, reportYear);
      
      if (result.supplierData.length > 0) {
        result.sectionsFound.push('Supplier Transparency');
      }
      
      console.log(`[Sustainability Parser] Step 2: Parsing facility environmental data...`);
      result.facilities = parseFacilityEnvironmentalData(content, reportYear);
      
      if (result.facilities.length > 0) {
        result.sectionsFound.push('Facility Environmental Data');
      }
      
      console.log(`[Sustainability Parser] Step 3: Parsing employee data...`);
      result.employeeData = parseEmployeeData(content, reportYear);
      
      if (result.employeeData.length > 0) {
        result.sectionsFound.push('Employee Demographics');
      }
    }
    
    // Calculate totals
    result.totalTier1Suppliers = result.supplierData.filter(s => s.tier === 1).reduce((sum, s) => sum + s.supplierCount, 0);
    result.totalTier2Suppliers = result.supplierData.filter(s => s.tier === 2).reduce((sum, s) => sum + s.supplierCount, 0);
    result.totalTier3Suppliers = result.supplierData.filter(s => s.tier === 3).reduce((sum, s) => sum + s.supplierCount, 0);
    result.totalFacilities = result.facilities.length;
    result.totalEmployees = result.employeeData.reduce((sum, e) => sum + e.employeeCount, 0);
    
    // Calculate metrics
    const allCountries = new Set<string>();
    result.supplierData.forEach(s => allCountries.add(s.country));
    result.facilities.forEach(f => allCountries.add(f.country));
    result.employeeData.forEach(e => allCountries.add(e.country));
    
    result.countriesIdentified = allCountries.size;
    
    // Data completeness score
    let completeness = 0;
    if (result.supplierData.length > 0) completeness += 0.4;
    if (result.facilities.length > 0) completeness += 0.3;
    if (result.employeeData.length > 0) completeness += 0.3;
    result.dataCompleteness = completeness;
    
    result.parsingSuccess = true;
    
    console.log(`\n[Sustainability Parser] ========================================`);
    console.log(`[Sustainability Parser] PARSING COMPLETE`);
    console.log(`[Sustainability Parser] Supplier entries: ${result.supplierData.length}`);
    console.log(`[Sustainability Parser] Tier 1 suppliers: ${result.totalTier1Suppliers}`);
    console.log(`[Sustainability Parser] Facilities: ${result.totalFacilities}`);
    console.log(`[Sustainability Parser] Employee data: ${result.employeeData.length} countries`);
    console.log(`[Sustainability Parser] Total employees: ${result.totalEmployees.toLocaleString()}`);
    console.log(`[Sustainability Parser] Countries identified: ${result.countriesIdentified}`);
    console.log(`[Sustainability Parser] Data completeness: ${(result.dataCompleteness * 100).toFixed(1)}%`);
    console.log(`[Sustainability Parser] Sections found: ${result.sectionsFound.join(', ')}`);
    console.log(`[Sustainability Parser] ========================================\n`);
    
  } catch (error) {
    result.parsingErrors.push(`Parsing error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[Sustainability Parser] ❌ Parsing failed:`, error);
  }
  
  return result;
}

// ============================================================================
// INTEGRATION WITH CHANNEL EXPOSURE CALCULATION
// ============================================================================

/**
 * Convert sustainability report data to channel exposure weights
 */
export function sustainabilityToChannelWeights(
  sustainabilityData: SustainabilityReportData,
  channel: 'supply' | 'operations' | 'assets'
): Record<string, number> {
  
  const weights: Record<string, number> = {};
  
  console.log(`\n[Sustainability Integration] Converting to ${channel} channel weights...`);
  
  switch (channel) {
    case 'supply':
      // Supply chain: Use supplier counts
      for (const supplier of sustainabilityData.supplierData) {
        if (!weights[supplier.country]) {
          weights[supplier.country] = 0;
        }
        // Weight by tier (Tier 1 = highest weight)
        const tierWeight = supplier.tier === 1 ? 1.0 : supplier.tier === 2 ? 0.5 : 0.25;
        weights[supplier.country] += supplier.supplierCount * tierWeight;
      }
      break;
      
    case 'operations':
      // Operations: Use employee counts
      for (const employee of sustainabilityData.employeeData) {
        weights[employee.country] = employee.employeeCount;
      }
      break;
      
    case 'assets': {
      // Assets: Use facility counts
      const facilityCounts = new Map<string, number>();
      for (const facility of sustainabilityData.facilities) {
        facilityCounts.set(facility.country, (facilityCounts.get(facility.country) || 0) + 1);
      }
      for (const [country, count] of facilityCounts) {
        weights[country] = count;
      }
      break;
    }
  }
  
  // Normalize to sum to 1.0
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight > 0) {
    for (const country of Object.keys(weights)) {
      weights[country] = weights[country] / totalWeight;
    }
  }
  
  console.log(`[Sustainability Integration] Generated weights for ${Object.keys(weights).length} countries`);
  console.log(`[Sustainability Integration] Top 5:`);
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [country, weight] of sorted) {
    console.log(`[Sustainability Integration]   ${country}: ${(weight * 100).toFixed(2)}%`);
  }
  
  return weights;
}

// ============================================================================
// EXPORT
// ============================================================================

export const sustainabilityReportParser = {
  fetchSustainabilityReport,
  parseSustainabilityReport,
  sustainabilityToChannelWeights
};