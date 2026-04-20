const fs = require('fs');
const path = require('path');

// Read company-specific exposures
const exposuresPath = path.join(__dirname, 'src/data/companySpecificExposures.ts');
const exposuresContent = fs.readFileSync(exposuresPath, 'utf-8');

// Extract tickers with SEC data
const companySpecificTickers = new Set();
const tickerMatches = exposuresContent.match(/'([A-Z]{1,5})':\s*{/g);
if (tickerMatches) {
  tickerMatches.forEach(match => {
    const ticker = match.match(/'([A-Z]{1,5})'/)?.[1];
    if (ticker) companySpecificTickers.add(ticker);
  });
}

console.log(`Found ${companySpecificTickers.size} companies with SEC data\n`);

// Read database files
const databases = [
  'src/data/nasdaqCompanyDatabase.ts',
  'src/tools/data-expansion/SP500Companies.ts',
  'src/data/dowJonesCompanies.ts'
];

const companies = [];
const processedTickers = new Set();

databases.forEach(dbPath => {
  const fullPath = path.join(__dirname, dbPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${dbPath} - file not found`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const companyPattern = /{\s*symbol:\s*['"]([A-Z]{1,5})['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*sector:\s*['"]([^'"]*)['"]/g;
  let match;
  
  while ((match = companyPattern.exec(content)) !== null) {
    const ticker = match[1];
    const name = match[2];
    const sector = match[3] || 'Unknown';
    
    if (processedTickers.has(ticker)) continue;
    processedTickers.add(ticker);

    const hasSECData = companySpecificTickers.has(ticker);
    
    companies.push({
      ticker,
      companyName: name,
      sector,
      homeCountry: 'United States',
      dataSource: hasSECData ? 'SEC_EDGAR' : 'FALLBACK_TEMPLATE',
      dataQuality: hasSECData ? 'A' : 'C',
      hasGeographicData: hasSECData,
      notes: hasSECData ? 'Extracted from SEC 10-K filings' : 'Using sector-based fallback template'
    });
  }
  
  console.log(`Processed ${dbPath}: found ${companies.length} total companies so far`);
});

// Calculate statistics
const secDataCompanies = companies.filter(c => c.dataSource === 'SEC_EDGAR');
const fallbackCompanies = companies.filter(c => c.dataSource === 'FALLBACK_TEMPLATE');

const summary = {
  totalCompanies: companies.length,
  secDataCompanies: secDataCompanies.length,
  fallbackCompanies: fallbackCompanies.length,
  secDataPercentage: (secDataCompanies.length / companies.length * 100).toFixed(2),
  fallbackPercentage: (fallbackCompanies.length / companies.length * 100).toFixed(2)
};

// Group by sector
const bySector = {};
companies.forEach(company => {
  if (!bySector[company.sector]) {
    bySector[company.sector] = { total: 0, secData: 0, fallback: 0 };
  }
  bySector[company.sector].total++;
  if (company.dataSource === 'SEC_EDGAR') {
    bySector[company.sector].secData++;
  } else {
    bySector[company.sector].fallback++;
  }
});

// Generate report
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
  ✅ SEC EDGAR Data:                ${summary.secDataCompanies.toLocaleString()} (${summary.secDataPercentage}%)
  ⚠️  Fallback Templates:           ${summary.fallbackCompanies.toLocaleString()} (${summary.fallbackPercentage}%)

═══════════════════════════════════════════════════════════════════════════════
                         DATA COVERAGE BY SECTOR
═══════════════════════════════════════════════════════════════════════════════
`;

Object.entries(bySector)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([sector, stats]) => {
    const secPercentage = ((stats.secData / stats.total) * 100).toFixed(1);
    report += `\n${sector}:\n`;
    report += `  Total Companies:     ${stats.total.toLocaleString()}\n`;
    report += `  ✅ SEC Data:         ${stats.secData.toLocaleString()} (${secPercentage}%)\n`;
    report += `  ⚠️  Fallback:        ${stats.fallback.toLocaleString()}\n`;
  });

report += `\n
═══════════════════════════════════════════════════════════════════════════════
                    COMPANIES WITH SEC EDGAR DATA (First 50)
═══════════════════════════════════════════════════════════════════════════════
`;

secDataCompanies.slice(0, 50).forEach((company, idx) => {
  report += `\n${(idx + 1).toString().padStart(3)}. ${company.ticker.padEnd(6)} - ${company.companyName.substring(0, 50).padEnd(50)} [${company.sector}]`;
});

if (secDataCompanies.length > 50) {
  report += `\n\n... and ${secDataCompanies.length - 50} more companies with SEC data`;
}

report += `\n
═══════════════════════════════════════════════════════════════════════════════
                    SAMPLE COMPANIES USING FALLBACK DATA (First 30)
═══════════════════════════════════════════════════════════════════════════════
`;

fallbackCompanies.slice(0, 30).forEach((company, idx) => {
  report += `\n${(idx + 1).toString().padStart(3)}. ${company.ticker.padEnd(6)} - ${company.companyName.substring(0, 50).padEnd(50)} [${company.sector}]`;
});

report += `\n
═══════════════════════════════════════════════════════════════════════════════
                              RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

1. IMMEDIATE PRIORITIES:
   • Batch process SEC 10-K filings for S&P 500 companies (503 companies)
   • Extract geographic exposure data from NASDAQ 100 companies
   • Process DOW 30 companies (30 companies)
   
2. ESTIMATED IMPACT:
   • Processing S&P 500: Would increase SEC data coverage to ~${((503 / summary.totalCompanies) * 100).toFixed(1)}%
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
`;

// Save report
const reportPath = path.join(__dirname, 'DATA_SOURCE_ANALYSIS_REPORT.txt');
fs.writeFileSync(reportPath, report);
console.log('\n' + report);
console.log(`\n✅ Report saved to: ${reportPath}`);

// Generate CSV
const csvPath = path.join(__dirname, 'company_data_sources.csv');
let csv = 'Ticker,Company Name,Sector,Home Country,Data Source,Data Quality,Has Geographic Data,Notes\n';
companies.forEach(company => {
  csv += `"${company.ticker}","${company.companyName.replace(/"/g, '""')}","${company.sector}","${company.homeCountry}","${company.dataSource}","${company.dataQuality}","${company.hasGeographicData}","${company.notes}"\n`;
});
fs.writeFileSync(csvPath, csv);
console.log(`✅ CSV export saved to: ${csvPath}`);
console.log(`\n📊 Summary: ${summary.totalCompanies} total companies, ${summary.secDataCompanies} with SEC data (${summary.secDataPercentage}%), ${summary.fallbackCompanies} using fallback (${summary.fallbackPercentage}%)\n`);
