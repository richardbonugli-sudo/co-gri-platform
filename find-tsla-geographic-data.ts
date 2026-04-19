import { getLatestFilingWithHTML } from './src/services/secFilingParser';
import * as cheerio from 'cheerio';

async function findGeographicData() {
  console.log('Searching for geographic data in Tesla 10-K...\n');
  
  const filing = await getLatestFilingWithHTML('0001318605', 'TSLA');
  if (!filing || !filing.html) {
    console.error('Failed to fetch filing');
    return;
  }
  
  const $ = cheerio.load(filing.html);
  const bodyText = $('body').text();
  
  // Search for geographic keywords
  const geographicKeywords = [
    'united states', 'china', 'europe', 'asia', 'americas',
    'geographic', 'geographical', 'region', 'country'
  ];
  
  console.log('=== SEARCHING FOR GEOGRAPHIC MENTIONS ===\n');
  
  // Find all tables
  const tables = $('table');
  console.log(`Total tables: ${tables.length}\n`);
  
  let foundTables = 0;
  tables.each((idx, table) => {
    const tableText = $(table).text().toLowerCase();
    
    // Check if table contains geographic keywords AND revenue/sales
    const hasGeographic = geographicKeywords.some(kw => tableText.includes(kw));
    const hasRevenue = tableText.includes('revenue') || tableText.includes('sales') || tableText.includes('automotive');
    
    if (hasGeographic && hasRevenue && foundTables < 3) {
      foundTables++;
      console.log(`\n========== POTENTIAL GEOGRAPHIC TABLE ${foundTables} (Table #${idx + 1}) ==========`);
      
      // Extract rows
      const rows: string[][] = [];
      $(table).find('tr').each((_, row) => {
        const cells: string[] = [];
        $(row).find('td, th').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0 && cells.some(c => c.length > 0)) {
          rows.push(cells);
        }
      });
      
      console.log(`Rows: ${rows.length}`);
      console.log('\nFirst 10 rows:');
      rows.slice(0, 10).forEach((row, idx) => {
        console.log(`${idx}: ${row.join(' | ')}`);
      });
    }
  });
  
  if (foundTables === 0) {
    console.log('\n⚠️ No tables found with geographic + revenue keywords');
    console.log('\nSearching in narrative text for geographic revenue mentions...\n');
    
    // Search for sentences with geographic + revenue
    const sentences = bodyText.split(/[.!?]+/);
    let foundSentences = 0;
    
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const hasGeographic = geographicKeywords.some(kw => lower.includes(kw));
      const hasRevenue = lower.includes('revenue') || lower.includes('sales');
      
      if (hasGeographic && hasRevenue && foundSentences < 5) {
        foundSentences++;
        console.log(`\nSentence ${foundSentences}:`);
        console.log(sentence.trim().substring(0, 300));
      }
    }
  }
  
  // Check for Note 15 or similar segment disclosure notes
  console.log('\n\n=== SEARCHING FOR SEGMENT DISCLOSURE NOTES ===\n');
  
  const notePatterns = [
    /note\s+\d+[:\s]+segment/i,
    /note\s+\d+[:\s]+geographic/i,
    /segment\s+information/i,
    /geographic\s+information/i
  ];
  
  for (const pattern of notePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      console.log(`Found: "${match[0]}"`);
      const startIdx = bodyText.indexOf(match[0]);
      console.log('Context (500 chars):');
      console.log(bodyText.substring(startIdx, startIdx + 500));
      console.log('\n---\n');
    }
  }
}

findGeographicData();
