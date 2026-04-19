const fs = require('fs');
const path = require('path');

console.log('🔍 Starting comprehensive data extraction...\n');

// Read company-specific exposures (companies with SEC data)
const exposuresPath = path.join(__dirname, 'src/data/companySpecificExposures.ts');
const exposuresContent = fs.readFileSync(exposuresPath, 'utf-8');

const companySpecificTickers = new Set();
const tickerMatches = exposuresContent.match(/'([A-Z]{1,5})':\s*{/g);
if (tickerMatches) {
  tickerMatches.forEach(match => {
    const ticker = match.match(/'([A-Z]{1,5})'/)?.[1];
    if (ticker) companySpecificTickers.add(ticker);
  });
}

console.log(`✅ Found ${companySpecificTickers.size} companies with SEC data\n`);

const companies = [];
const processedTickers = new Set();

// Process NASDAQ database (Record format)
try {
  const nasdaqPath = path.join(__dirname, 'src/data/nasdaqCompanyDatabase.ts');
  const nasdaqContent = fs.readFileSync(nasdaqPath, 'utf-8');
  
  // Extract from Record format: 'TICKER': { ticker: 'TICKER', companyName: '...', sector: '...' }
  const recordPattern = /'([A-Z]{1,5})':\s*{\s*ticker:\s*'[A-Z]{1,5}',\s*companyName:\s*'([^']+)',\s*[^}]*sector:\s*'([^']+)'/g;
  let match;
  
  while ((match = recordPattern.exec(nasdaqContent)) !== null) {
    const ticker = match[1];
    const name = match[2];
    const sector = match[3];
    
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
  
  console.log(`✅ Processed NASDAQ database: ${companies.length} companies`);
} catch (error) {
  console.error('Error processing NASDAQ database:', error.message);
}

// Process S&P 500 (Array format)
try {
  const sp500Path = path.join(__dirname, 'src/tools/data-expansion/SP500Companies.ts');
  const sp500Content = fs.readFileSync(sp500Path, 'utf-8');
  
  // Extract from array format: { ticker: 'TICKER', name: '...', sector: '...' }
  const arrayPattern = /{\s*ticker:\s*'([A-Z]{1,5})',\s*name:\s*'([^']+)',\s*sector:\s*'([^']+)'/g;
  let match;
  
  while ((match = arrayPattern.exec(sp500Content)) !== null) {
    const ticker = match[1];
    const name = match[2];
    const sector = match[3];
    
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
  
  console.log(`✅ Processed S&P 500: ${companies.length} total companies`);
} catch (error) {
  console.error('Error processing S&P 500:', error.message);
}

// Process full NASDAQ list if available
try {
  const fullNasdaqPath = path.join(__dirname, 'src/data/fullNASDAQCompanyList.ts');
  if (fs.existsSync(fullNasdaqPath)) {
    const fullNasdaqContent = fs.readFileSync(fullNasdaqPath, 'utf-8');
    
    const arrayPattern = /{\s*ticker:\s*'([A-Z]{1,5})',\s*name:\s*'([^']+)',\s*sector:\s*'([^']+)'/g;
    let match;
    
    while ((match = arrayPattern.exec(fullNasdaqContent)) !== null) {
      const ticker = match[1];
      const name = match[2];
      const sector = match[3];
      
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
    
    console.log(`✅ Processed full NASDAQ list: ${companies.length} total companies`);
  }
} catch (error) {
  console.error('Error processing full NASDAQ list:', error.message);
}

console.log(`\n📊 Total unique companies extracted: ${companies.length}\n`);

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
                    COMPANIES WITH SEC EDGAR DATA
═══════════════════════════════════════════════════════════════════════════════
`;

secDataCompanies.forEach((company, idx) => {
  report += `\n${(idx + 1).toString().padStart(3)}. ${company.ticker.padEnd(6)} - ${company.companyName.substring(0, 50).padEnd(50)} [${company.sector}]`;
});

report += `\n
═══════════════════════════════════════════════════════════════════════════════
                              RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

Current SEC Data Coverage: ${summary.secDataPercentage}%

To improve data quality:
1. Batch process SEC 10-K filings for S&P 500 companies
2. Extract geographic exposure data from NASDAQ 100 companies
3. Implement quarterly 10-Q monitoring for existing companies

═══════════════════════════════════════════════════════════════════════════════
`;

// Save report
const reportPath = path.join(__dirname, 'DATA_SOURCE_ANALYSIS_REPORT.txt');
fs.writeFileSync(reportPath, report);
console.log('✅ Report saved to: DATA_SOURCE_ANALYSIS_REPORT.txt\n');

// Generate CSV with ALL companies
const csvPath = path.join(__dirname, 'company_data_sources.csv');
let csv = 'Ticker,Company Name,Sector,Home Country,Data Source,Data Quality,Has Geographic Data,Notes\n';
companies.forEach(company => {
  csv += `"${company.ticker}","${company.companyName.replace(/"/g, '""')}","${company.sector}","${company.homeCountry}","${company.dataSource}","${company.dataQuality}","${company.hasGeographicData}","${company.notes}"\n`;
});
fs.writeFileSync(csvPath, csv);

console.log(`✅ CSV file generated: company_data_sources.csv`);
console.log(`   Location: ${csvPath}`);
console.log(`   Total rows: ${companies.length + 1} (including header)`);
console.log(`\n📊 Final Summary:`);
console.log(`   Total Companies: ${summary.totalCompanies}`);
console.log(`   With SEC Data: ${summary.secDataCompanies} (${summary.secDataPercentage}%)`);
console.log(`   Using Fallback: ${summary.fallbackCompanies} (${summary.fallbackPercentage}%)\n`);
