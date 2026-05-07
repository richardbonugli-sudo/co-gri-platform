// Test script to verify sector calculations
console.log('\n=== SECTOR EXPOSURE CALCULATION TEST ===\n');

// Import the calculation functions
import { calculateAllCountrySectorExposures, calculateAllGlobalSectorExposures } from './src/utils/sectorCalculations.ts';

// Test countries
const testCountries = ['United States', 'China', 'Germany', 'India', 'Brazil'];

console.log('Testing Country Mode:\n');
for (const country of testCountries) {
  console.log(`\n--- ${country} ---`);
  try {
    const result = calculateAllCountrySectorExposures(country);
    const scores = Object.entries(result).map(([sector, data]) => ({
      sector,
      display: Math.round(data.display),
      raw: data.raw.toFixed(6)
    })).sort((a, b) => b.display - a.display);
    
    console.log('Top 3 sectors:');
    scores.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.sector}: ${s.display} (raw: ${s.raw})`);
    });
    
    console.log('Bottom 3 sectors:');
    scores.slice(-3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.sector}: ${s.display} (raw: ${s.raw})`);
    });
    
    // Check for 0 or 100 values
    const hasZero = scores.some(s => s.display === 0);
    const hasHundred = scores.some(s => s.display === 100);
    
    if (hasZero || hasHundred) {
      console.log(`\n⚠️  WARNING: Found ${hasZero ? '0' : ''} ${hasZero && hasHundred ? 'and' : ''} ${hasHundred ? '100' : ''} values`);
    } else {
      console.log('\n✅ No 0 or 100 values found');
    }
  } catch (error) {
    console.error(`❌ Error testing ${country}:`, error.message);
  }
}

console.log('\n\nTesting Global Mode:\n');
try {
  const globalResult = calculateAllGlobalSectorExposures();
  const globalScores = Object.entries(globalResult).map(([sector, data]) => ({
    sector,
    display: Math.round(data.display),
    raw: data.raw.toFixed(6)
  })).sort((a, b) => b.display - a.display);
  
  console.log('All sectors:');
  globalScores.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.sector}: ${s.display} (raw: ${s.raw})`);
  });
  
  // Check for 0 or 100 values
  const hasZero = globalScores.some(s => s.display === 0);
  const hasHundred = globalScores.some(s => s.display === 100);
  
  if (hasZero || hasHundred) {
    console.log(`\n⚠️  WARNING: Found ${hasZero ? '0' : ''} ${hasZero && hasHundred ? 'and' : ''} ${hasHundred ? '100' : ''} values`);
  } else {
    console.log('\n✅ No 0 or 100 values found');
  }
} catch (error) {
  console.error('❌ Error testing global mode:', error.message);
}

console.log('\n=== TEST COMPLETE ===\n');
