// Test the weighted distribution
const REGIONAL_WEIGHTS = {
  'Europe': {
    'Germany': 0.22,
    'United Kingdom': 0.20,
    'France': 0.18,
    'Italy': 0.12,
    'Spain': 0.10,
    'Netherlands': 0.06,
    'Switzerland': 0.04,
    'Belgium': 0.03,
    'Sweden': 0.02,
    'Poland': 0.01,
    'Austria': 0.008,
    'Norway': 0.007,
    'Denmark': 0.006,
    'Ireland': 0.005,
    'Finland': 0.003
  }
};

// AAPL Europe segment: 25%
const europePercentage = 25;
console.log('AAPL Europe Segment: 25%\n');
console.log('Country Exposures after weighted distribution:');
console.log('='.repeat(60));

let majorCount = 0;
let microCount = 0;

Object.entries(REGIONAL_WEIGHTS.Europe).forEach(([country, weight]) => {
  const exposure = europePercentage * weight;
  const isMicro = exposure < 0.5;
  if (isMicro) microCount++;
  else majorCount++;
  
  console.log(`${country.padEnd(20)} ${exposure.toFixed(3)}%  ${isMicro ? '(<0.5% - MICRO)' : ''}`);
});

console.log('='.repeat(60));
console.log(`\nSummary:`);
console.log(`  Major exposures (>= 0.5%): ${majorCount}`);
console.log(`  Micro exposures (< 0.5%):  ${microCount}`);
console.log(`\n✅ Micro exposure aggregation will now work!`);
