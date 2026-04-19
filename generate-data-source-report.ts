/**
 * Data Source Analysis Report Generator
 * Analyzes the integrated database to determine which companies have SEC data vs fallback data
 */

import * as fs from 'fs';
import * as path from 'path';

interface CompanyDataSource {
  ticker: string;
  companyName: string;
  sector: string;
  homeCountry: string;
  dataSource: 'SEC_EDGAR' | 'COMPANY_SPECIFIC' | 'FALLBACK_TEMPLATE';
  dataQuality: string;
  hasGeographicData: boolean;
  lastUpdated?: string;
  notes: string;
}

interface ReportSummary {
  totalCompanies: number;
  secDataCompanies: number;
  companySpecificCompanies: number;
  fallbackCompanies: number;
  secDataPercentage: number;
  fallbackPercentage: number;
  byExchange: Record<string, { total: number; secData: number; fallback: number }>;
  bySector: Record<string, { total: number; secData: number; fallback: number }>;
}

async function analyzeDataSources(): Promise<{ companies: CompanyDataSource[]; summary: ReportSummary }> {
  const companies: CompanyDataSource[] = [];
  
  // Load company-specific exposures (SEC data)
  let companySpecificExposures: any = {};
  try {
    const exposuresPath = path.join(__dirname, 'src/data/companySpecificExposures.ts');
    const content = fs.readFileSync(exposuresPath, 'utf-8');
    
    // Extract company tickers from the file
    const tickerMatches = content.match(/'([A-Z]{1,5})':\s*{/g);
    if (tickerMatches) {
      tickerMatches.forEach(match => {
        const ticker = match.match(/'([A-Z]{1,5})'/)?.[1];
        if (ticker) {
          companySpecificExposures[ticker] = true;
        }
      });
    }
  } catch (error) {
    console.error('Error loading company-specific exposures:', error);
  }

  // Load integrated database companies
  const databases = [
    'src/data/nasdaqCompanyDatabase.ts',
    'src/tools/data-expansion/SP500Companies.ts',
    'src/data/dowJonesCompanies.ts'
  ];

  const processedTickers = new Set<string>();

  for (const dbPath of databases) {
    try {
      const fullPath = path.join(__dirname, dbPath);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Extract company data using regex
      const companyPattern = /{\s*symbol:\s*['"]([A-Z]{1,5})['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*sector:\s*['"]([^'"]*)['"]/g;
      let match;
      
      while ((match = companyPattern.exec(content)) !== null) {
        const ticker = match[1];
        const name = match[2];
        const sector = match[3] || 'Unknown';
        
        if (processedTickers.has(ticker)) continue;
        processedTickers.add(ticker);

        const hasSECData = companySpecificExposures[ticker] === true;
        
        companies.push({
          ticker,
          companyName: name,
          sector,
          homeCountry: 'United States', // Most are US companies
          dataSource: hasSECData ? 'SEC_EDGAR' : 'FALLBACK_TEMPLATE',
          dataQuality: hasSECData ? 'A' : 'C',
          hasGeographicData: hasSECData,
          notes: hasSECData ? 'Extracted from SEC 10-K filings' : 'Using sector-based fallback template'
        });
      }
    } catch (error) {
      console.error(`Error processing ${dbPath}:`, error);
    }
  }

  // Calculate summary statistics
  const summary: ReportSummary = {
    totalCompanies: companies.length,
    secDataCompanies: companies.filter(c => c.dataSource === 'SEC_EDGAR').length,
    companySpecificCompanies: companies.filter(c => c.dataSource === 'COMPANY_SPECIFIC').length,
    fallbackCompanies: companies.filter(c => c.dataSource === 'FALLBACK_TEMPLATE').length,
    secDataPercentage: 0,
    fallbackPercentage: 0,
    byExchange: {},
    bySector: {}
  };

  summary.secDataPercentage = (summary.secDataCompanies / summary.totalCompanies) * 100;
  summary.fallbackPercentage = (summary.fallbackCompanies / summary.totalCompanies) * 100;

  // Group by sector
  companies.forEach(company => {
    if (!summary.bySector[company.sector]) {
      summary.bySector[company.sector] = { total: 0, secData: 0, fallback: 0 };
    }
    summary.bySector[company.sector].total++;
    if (company.dataSource === 'SEC_EDGAR') {
      summary.bySector[company.sector].secData++;
    } else {
      summary.bySector[company.sector].fallback++;
    }
  });

  return { companies, summary };
}

async function generateReport() {
  console.log('🔍 Analyzing Data Sources in Integrated Database...\n');
  
  const { companies, summary } = await analyzeDataSources();

  // Generate detailed report
  let report = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                    DATA SOURCE ANALYSIS REPORT                                 ║
║                    Integrated Company Database                                 ║
║                    Generated: ${new Date().toISOString()}                      ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
                              EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Total Companies in Database:        ${summary.totalCompanies.toLocaleString()}

Data Source Breakdown:
  ✅ SEC EDGAR Data:                ${summary.secDataCompanies.toLocaleString()} (${summary.secDataPercentage.toFixed(2)}%)
  📊 Company-Specific:              ${summary.companySpecificCompanies.toLocaleString()}
  ⚠️  Fallback Templates:           ${summary.fallbackCompanies.toLocaleString()} (${summary.fallbackPercentage.toFixed(2)}%)

═══════════════════════════════════════════════════════════════════════════════
                         DATA COVERAGE BY SECTOR
═══════════════════════════════════════════════════════════════════════════════

`;

  // Sort sectors by total companies
  const sortedSectors = Object.entries(summary.bySector)
    .sort((a, b) => b[1].total - a[1].total);

  sortedSectors.forEach(([sector, stats]) => {
    const secPercentage = ((stats.secData / stats.total) * 100).toFixed(1);
    report += `\n${sector}:\n`;
    report += `  Total Companies:     ${stats.total.toLocaleString()}\n`;
    report += `  ✅ SEC Data:         ${stats.secData.toLocaleString()} (${secPercentage}%)\n`;
    report += `  ⚠️  Fallback:        ${stats.fallback.toLocaleString()}\n`;
  });

  report += `\n
═══════════════════════════════════════════════════════════════════════════════
                    COMPANIES WITH SEC EDGAR DATA
═══════════════════════════════════════════════════════════════════════════════

`;

  const secCompanies = companies.filter(c => c.dataSource === 'SEC_EDGAR').slice(0, 50);
  secCompanies.forEach((company, idx) => {
    report += `${(idx + 1).toString().padStart(3)}. ${company.ticker.padEnd(6)} - ${company.companyName.substring(0, 50).padEnd(50)} [${company.sector}]\n`;
  });

  if (summary.secDataCompanies > 50) {
    report += `\n... and ${summary.secDataCompanies - 50} more companies with SEC data\n`;
  }

  report += `\n
═══════════════════════════════════════════════════════════════════════════════
                    SAMPLE COMPANIES USING FALLBACK DATA
═══════════════════════════════════════════════════════════════════════════════

`;

  const fallbackCompanies = companies.filter(c => c.dataSource === 'FALLBACK_TEMPLATE').slice(0, 30);
  fallbackCompanies.forEach((company, idx) => {
    report += `${(idx + 1).toString().padStart(3)}. ${company.ticker.padEnd(6)} - ${company.companyName.substring(0, 50).padEnd(50)} [${company.sector}]\n`;
  });

  report += `\n
═══════════════════════════════════════════════════════════════════════════════
                              RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

1. IMMEDIATE PRIORITIES:
   • Batch process SEC 10-K filings for S&P 500 companies (503 companies)
   • Extract geographic exposure data from NASDAQ 100 companies
   • Process DOW 30 companies (30 companies)
   
2. MEDIUM-TERM GOALS:
   • Expand to Russell 1000 companies
   • Implement quarterly 10-Q monitoring for existing companies
   • Add international exchange filings (6-K, 20-F)

3. INFRASTRUCTURE:
   • Activate real-time SEC filing monitoring
   • Set up automated extraction pipeline
   • Implement data quality validation

4. ESTIMATED IMPACT:
   • Processing S&P 500: Would increase SEC data coverage to ~${((533 / summary.totalCompanies) * 100).toFixed(1)}%
   • Processing NASDAQ 100: Additional ~${((100 / summary.totalCompanies) * 100).toFixed(1)}%
   • Full Russell 1000: Coverage would reach ~${((1000 / summary.totalCompanies) * 100).toFixed(1)}%

═══════════════════════════════════════════════════════════════════════════════
                              DATA QUALITY NOTES
═══════════════════════════════════════════════════════════════════════════════

SEC EDGAR Data Quality: A (Highest)
  • Extracted from official 10-K/20-F filings
  • Verified geographic revenue segments
  • Includes subsidiary locations (Exhibit 21)
  • Updated quarterly/annually

Fallback Template Quality: C (Estimated)
  • Based on sector-specific patterns
  • Uses GDP-weighted country distributions
  • No company-specific validation
  • Should be replaced with actual SEC data

═══════════════════════════════════════════════════════════════════════════════

Report generated successfully.
Total companies analyzed: ${summary.totalCompanies.toLocaleString()}
Companies with SEC data: ${summary.secDataCompanies.toLocaleString()}
Coverage percentage: ${summary.secDataPercentage.toFixed(2)}%

`;

  // Save report to file
  const reportPath = path.join(__dirname, 'DATA_SOURCE_ANALYSIS_REPORT.txt');
  fs.writeFileSync(reportPath, report);
  
  console.log(report);
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Generate CSV for detailed analysis
  const csvPath = path.join(__dirname, 'company_data_sources.csv');
  let csv = 'Ticker,Company Name,Sector,Home Country,Data Source,Data Quality,Has Geographic Data,Notes\n';
  companies.forEach(company => {
    csv += `"${company.ticker}","${company.companyName}","${company.sector}","${company.homeCountry}","${company.dataSource}","${company.dataQuality}","${company.hasGeographicData}","${company.notes}"\n`;
  });
  fs.writeFileSync(csvPath, csv);
  console.log(`✅ CSV export saved to: ${csvPath}\n`);
}

generateReport().catch(console.error);
