import { getLatestFilingWithHTML, extractAllTables, isRevenueTable } from './src/services/secFilingParser';
import * as cheerio from 'cheerio';

async function inspectTeslaTables() {
  console.log('Fetching Tesla 10-K and inspecting tables...\n');
  
  const filing = await getLatestFilingWithHTML('0001318605', 'TSLA');
  if (!filing || !filing.html) {
    console.error('Failed to fetch filing');
    return;
  }
  
  const $ = cheerio.load(filing.html);
  const tables = extractAllTables(filing.html);
  
  console.log(`Total tables found: ${tables.length}\n`);
  
  // Look for tables with "revenue" or "segment" keywords
  let foundCount = 0;
  for (let i = 0; i < tables.length && foundCount < 5; i++) {
    const table = tables[i];
    const tableText = table.text().toLowerCase();
    
    if (tableText.includes('revenue') || tableText.includes('segment')) {
      foundCount++;
      console.log(`\n========== TABLE ${i + 1} ==========`);
      console.log('Text preview (first 500 chars):');
      console.log(tableText.substring(0, 500));
      console.log('\n--- isRevenueTable result:', isRevenueTable(table, $));
      
      // Show table structure
      const rows: string[][] = [];
      table.find('tr').each((_, row) => {
        const cells: string[] = [];
        $(row).find('td, th').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      console.log('\nTable structure (first 5 rows):');
      rows.slice(0, 5).forEach((row, idx) => {
        console.log(`Row ${idx}:`, row.join(' | '));
      });
    }
  }
  
  if (foundCount === 0) {
    console.log('\n⚠️ No tables found with "revenue" or "segment" keywords');
    console.log('Showing first 3 tables instead:\n');
    
    for (let i = 0; i < Math.min(3, tables.length); i++) {
      const table = tables[i];
      const tableText = table.text().toLowerCase();
      
      console.log(`\n========== TABLE ${i + 1} ==========`);
      console.log('Text preview (first 300 chars):');
      console.log(tableText.substring(0, 300));
    }
  }
}

inspectTeslaTables();
