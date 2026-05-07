/**
 * Diagnostic Parser - Test SEC Filing Parser
 * 
 * This script tests what the SEC parser actually returns for specific tickers
 * to diagnose why fallback is being triggered incorrectly
 */

import { parseSECFiling, ParsedSECData } from './secFilingParser';

export interface DiagnosticResult {
  ticker: string;
  parsingSuccess: boolean;
  revenueTableFound: boolean;
  revenueSegmentsCount: number;
  revenueSegments: Array<{
    region: string;
    percentage: number;
    amount: number;
  }>;
  ppeTableFound: boolean;
  ppeSegmentsCount: number;
  ppeSegments: Array<{
    region: string;
    percentage: number;
    amount: number;
  }>;
  debtTableFound: boolean;
  debtSecuritiesCount: number;
  supplierLocationsCount: number;
  facilityLocationsCount: number;
  treasuryCentersCount: number;
  sectionsFound: string[];
  parsingErrors: string[];
  totalRevenuePercentage: number;
  totalPPEPercentage: number;
  diagnosis: string[];
}

/**
 * Run diagnostic on a ticker
 */
export async function runDiagnostic(ticker: string): Promise<DiagnosticResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DIAGNOSTIC: ${ticker}`);
  console.log('='.repeat(80));
  
  const secData = await parseSECFiling(ticker);
  
  if (!secData) {
    return {
      ticker,
      parsingSuccess: false,
      revenueTableFound: false,
      revenueSegmentsCount: 0,
      revenueSegments: [],
      ppeTableFound: false,
      ppeSegmentsCount: 0,
      ppeSegments: [],
      debtTableFound: false,
      debtSecuritiesCount: 0,
      supplierLocationsCount: 0,
      facilityLocationsCount: 0,
      treasuryCentersCount: 0,
      sectionsFound: [],
      parsingErrors: ['SEC data is null'],
      totalRevenuePercentage: 0,
      totalPPEPercentage: 0,
      diagnosis: ['❌ Parser returned null - complete failure']
    };
  }
  
  // Calculate totals
  const totalRevenuePercentage = secData.revenueSegments.reduce(
    (sum, seg) => sum + seg.revenuePercentage, 
    0
  );
  
  const totalPPEPercentage = secData.ppeSegments.reduce(
    (sum, seg) => sum + seg.ppePercentage, 
    0
  );
  
  // Generate diagnosis
  const diagnosis: string[] = [];
  
  // Revenue diagnosis
  if (secData.revenueTableFound) {
    diagnosis.push(`✅ Revenue table found: ${secData.revenueSegments.length} segments`);
    if (secData.revenueSegments.length === 0) {
      diagnosis.push(`⚠️ WARNING: revenueTableFound=true but 0 segments extracted`);
    }
    if (totalRevenuePercentage < 90) {
      diagnosis.push(`⚠️ WARNING: Revenue segments only total ${totalRevenuePercentage.toFixed(1)}% (incomplete)`);
    }
    if (totalRevenuePercentage > 110) {
      diagnosis.push(`⚠️ WARNING: Revenue segments total ${totalRevenuePercentage.toFixed(1)}% (over 100%)`);
    }
  } else {
    diagnosis.push(`❌ Revenue table NOT found`);
    if (secData.revenueSegments.length > 0) {
      diagnosis.push(`⚠️ INCONSISTENCY: revenueTableFound=false but ${secData.revenueSegments.length} segments exist`);
    }
  }
  
  // PP&E diagnosis
  if (secData.ppeTableFound) {
    diagnosis.push(`✅ PP&E table found: ${secData.ppeSegments.length} segments`);
    if (secData.ppeSegments.length === 0) {
      diagnosis.push(`⚠️ WARNING: ppeTableFound=true but 0 segments extracted`);
    }
    if (totalPPEPercentage < 90) {
      diagnosis.push(`⚠️ WARNING: PP&E segments only total ${totalPPEPercentage.toFixed(1)}% (incomplete)`);
    }
  } else {
    diagnosis.push(`❌ PP&E table NOT found`);
  }
  
  // Debt diagnosis
  if (secData.debtTableFound) {
    diagnosis.push(`✅ Debt table found: ${secData.debtSecurities.length} securities`);
  } else {
    diagnosis.push(`❌ Debt table NOT found`);
  }
  
  // Overall diagnosis
  if (!secData.parsingSuccess) {
    diagnosis.push(`❌ OVERALL: Parsing marked as FAILED`);
  } else {
    diagnosis.push(`✅ OVERALL: Parsing marked as successful`);
  }
  
  if (secData.parsingErrors.length > 0) {
    diagnosis.push(`⚠️ Parsing errors: ${secData.parsingErrors.join('; ')}`);
  }
  
  // Integration prediction
  if (secData.revenueTableFound && secData.revenueSegments.length > 0) {
    diagnosis.push(`✅ PREDICTION: Integration should use structured evidence (NOT 85% fallback)`);
  } else {
    diagnosis.push(`❌ PREDICTION: Integration will use 85% home country fallback`);
  }
  
  const result: DiagnosticResult = {
    ticker,
    parsingSuccess: secData.parsingSuccess,
    revenueTableFound: secData.revenueTableFound,
    revenueSegmentsCount: secData.revenueSegments.length,
    revenueSegments: secData.revenueSegments.map(seg => ({
      region: seg.region,
      percentage: seg.revenuePercentage,
      amount: seg.revenueAmount
    })),
    ppeTableFound: secData.ppeTableFound,
    ppeSegmentsCount: secData.ppeSegments.length,
    ppeSegments: secData.ppeSegments.map(seg => ({
      region: seg.region,
      percentage: seg.ppePercentage,
      amount: seg.ppeAmount
    })),
    debtTableFound: secData.debtTableFound,
    debtSecuritiesCount: secData.debtSecurities.length,
    supplierLocationsCount: secData.supplierLocations.length,
    facilityLocationsCount: secData.facilityLocations.length,
    treasuryCentersCount: secData.treasuryCenters.length,
    sectionsFound: secData.sectionsFound,
    parsingErrors: secData.parsingErrors,
    totalRevenuePercentage,
    totalPPEPercentage,
    diagnosis
  };
  
  // Print detailed report
  console.log(`\nPARSING RESULTS:`);
  console.log(`  Parsing Success: ${result.parsingSuccess}`);
  console.log(`  Revenue Table Found: ${result.revenueTableFound}`);
  console.log(`  Revenue Segments: ${result.revenueSegmentsCount}`);
  console.log(`  PP&E Table Found: ${result.ppeTableFound}`);
  console.log(`  PP&E Segments: ${result.ppeSegmentsCount}`);
  console.log(`  Debt Table Found: ${result.debtTableFound}`);
  console.log(`  Sections Found: ${result.sectionsFound.join(', ') || 'none'}`);
  
  if (result.revenueSegments.length > 0) {
    console.log(`\nREVENUE SEGMENTS:`);
    for (const seg of result.revenueSegments) {
      console.log(`  ${seg.region}: ${seg.percentage.toFixed(2)}% ($${(seg.amount / 1000).toFixed(1)}B)`);
    }
    console.log(`  TOTAL: ${result.totalRevenuePercentage.toFixed(2)}%`);
  }
  
  if (result.ppeSegments.length > 0) {
    console.log(`\nPP&E SEGMENTS:`);
    for (const seg of result.ppeSegments) {
      console.log(`  ${seg.region}: ${seg.percentage.toFixed(2)}% ($${(seg.amount / 1000).toFixed(1)}B)`);
    }
    console.log(`  TOTAL: ${result.totalPPEPercentage.toFixed(2)}%`);
  }
  
  console.log(`\nDIAGNOSIS:`);
  for (const diag of result.diagnosis) {
    console.log(`  ${diag}`);
  }
  
  console.log('='.repeat(80));
  
  return result;
}

/**
 * Run diagnostics on multiple tickers
 */
export async function runMultipleDiagnostics(tickers: string[]): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  for (const ticker of tickers) {
    const result = await runDiagnostic(ticker);
    results.push(result);
    
    // Add delay to respect SEC rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Summary report
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY REPORT`);
  console.log('='.repeat(80));
  
  for (const result of results) {
    console.log(`\n${result.ticker}:`);
    console.log(`  Revenue: ${result.revenueTableFound ? '✅' : '❌'} (${result.revenueSegmentsCount} segments, ${result.totalRevenuePercentage.toFixed(1)}%)`);
    console.log(`  PP&E: ${result.ppeTableFound ? '✅' : '❌'} (${result.ppeSegmentsCount} segments, ${result.totalPPEPercentage.toFixed(1)}%)`);
    console.log(`  Debt: ${result.debtTableFound ? '✅' : '❌'} (${result.debtSecuritiesCount} securities)`);
    
    const criticalIssues = result.diagnosis.filter(d => d.startsWith('❌'));
    if (criticalIssues.length > 0) {
      console.log(`  CRITICAL ISSUES:`);
      for (const issue of criticalIssues) {
        console.log(`    ${issue}`);
      }
    }
  }
  
  console.log('='.repeat(80));
  
  return results;
}

/**
 * Export diagnostic function for use in components
 */
export const diagnosticParser = {
  runDiagnostic,
  runMultipleDiagnostics
};