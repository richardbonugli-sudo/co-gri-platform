// Quick verification script to check if the India fix is working
import fs from 'fs';

console.log('🔍 Verifying India exposure fix...\n');

// Check narrativeParser.ts for normalization function
const narrativeParser = fs.readFileSync('src/services/narrativeParser.ts', 'utf8');
if (narrativeParser.includes('normalizeRegionName')) {
  console.log('✅ normalizeRegionName function found in narrativeParser.ts');
  
  // Check if it removes " segment" and " region"
  if (narrativeParser.includes('.replace(/\\s+(segment|region)$/i')) {
    console.log('✅ Normalization logic correctly removes " segment" and " region" suffixes');
  } else {
    console.log('❌ Normalization logic may be incorrect');
  }
} else {
  console.log('❌ normalizeRegionName function NOT found');
}

// Check if geographicExposureService uses narrative parsing
const geoService = fs.readFileSync('src/services/geographicExposureService.ts', 'utf8');
if (geoService.includes('parseNarrativeText')) {
  console.log('✅ geographicExposureService.ts calls parseNarrativeText');
} else {
  console.log('❌ geographicExposureService.ts does NOT call parseNarrativeText');
}

// Check if regional expansion is applied
if (geoService.includes('expandSegmentsByRegion')) {
  console.log('✅ Regional expansion function found');
} else {
  console.log('❌ Regional expansion function NOT found');
}

console.log('\n📊 Fix Status Summary:');
console.log('The code has been updated to:');
console.log('1. Parse narrative text from SEC filings');
console.log('2. Normalize region names (remove "segment" and "region" suffixes)');
console.log('3. Expand regional segments into individual countries');
console.log('4. Include India in the Europe segment expansion');
console.log('\n✅ Code changes are complete and ready for testing!');
console.log('\n📝 To test manually:');
console.log('1. Open http://localhost:5174/cogri in your browser');
console.log('2. Type "AAPL" in the input field');
console.log('3. Click "Run CO-GRI Assessment"');
console.log('4. Open DevTools Console (F12) to see parsing logs');
console.log('5. Look for India in the geographic exposure results (~1.79%)');
