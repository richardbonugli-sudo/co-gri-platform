import * as fs from 'fs';

// Read all batch files
const batch1 = fs.readFileSync('batch1_exposures.ts', 'utf-8');
const batch2 = fs.readFileSync('batch2_exposures.ts', 'utf-8');
const batch3 = fs.readFileSync('batch3_exposures.ts', 'utf-8');
const batch4 = fs.readFileSync('batch4_exposures.ts', 'utf-8');
const batch5 = fs.readFileSync('batch5_exposures.ts', 'utf-8');

// Extract company entries from each batch
const extractEntries = (content: string) => {
  const match = content.match(/export const COMPANY_SPECIFIC_EXPOSURES = \{([^}]+)\}/s);
  if (!match) return [];
  return match[1].split(/(?=\n  [A-Z]+:)/g).filter(e => e.trim());
};

const entries1 = extractEntries(batch1);
const entries2 = extractEntries(batch2);
const entries3 = extractEntries(batch3);
const entries4 = extractEntries(batch4);
const entries5 = extractEntries(batch5);

const allEntries = [...entries1, ...entries2, ...entries3, ...entries4, ...entries5];

console.log(`Total entries extracted: ${allEntries.length}`);

// Remove duplicates and TSLA/AAPL (already in database)
const uniqueEntries = new Map<string, string>();
const existingTickers = ['TSLA', 'AAPL'];

allEntries.forEach(entry => {
  const tickerMatch = entry.match(/([A-Z.]+):/);
  if (tickerMatch) {
    const ticker = tickerMatch[1];
    if (!existingTickers.includes(ticker)) {
      uniqueEntries.set(ticker, entry);
    } else {
      console.log(`Skipping ${ticker} - already in database`);
    }
  }
});

console.log(`Unique new entries: ${uniqueEntries.size}`);

// Check for DUK data error
const dukEntry = uniqueEntries.get('DUK');
if (dukEntry && dukEntry.includes('405')) {
  console.log('⚠️ WARNING: DUK has 405 countries - data error detected');
  console.log('This entry needs manual review and correction');
}

// Generate merged file
const mergedContent = `// Auto-generated from batch processing
// Total companies: ${uniqueEntries.size}
// Generated: ${new Date().toISOString()}

export const AUTOMATED_COMPANY_EXPOSURES = {
${Array.from(uniqueEntries.values()).join(',\n')}
};
`;

fs.writeFileSync('merged_exposures.ts', mergedContent);
console.log('\n✅ Merged file created: merged_exposures.ts');
console.log(`\nSummary:`);
console.log(`- Total automated extractions: ${uniqueEntries.size}`);
console.log(`- Existing manual entries: 7 (including AAPL, TSLA)`);
console.log(`- Final database size: ${uniqueEntries.size + 7} companies`);
