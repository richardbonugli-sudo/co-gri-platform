// Test the aggregation logic
const MICRO_EXPOSURE_THRESHOLD = 0.005;

const testExposures = [
  { country: "United States", exposureWeight: 0.423, contribution: 15.2 },
  { country: "China", exposureWeight: 0.187, contribution: 9.8 },
  { country: "Japan", exposureWeight: 0.072, contribution: 1.9 },
  { country: "United Kingdom", exposureWeight: 0.058, contribution: 1.8 },
  { country: "Germany", exposureWeight: 0.043, contribution: 1.3 },
  { country: "France", exposureWeight: 0.035, contribution: 1.1 },
  { country: "Canada", exposureWeight: 0.028, contribution: 0.8 },
  { country: "South Korea", exposureWeight: 0.022, contribution: 0.7 },
  { country: "India", exposureWeight: 0.018, contribution: 0.6 },
  { country: "Australia", exposureWeight: 0.015, contribution: 0.5 },
  { country: "Brazil", exposureWeight: 0.012, contribution: 0.4 },
  { country: "Mexico", exposureWeight: 0.010, contribution: 0.3 },
  { country: "Singapore", exposureWeight: 0.008, contribution: 0.3 },
  { country: "Netherlands", exposureWeight: 0.006, contribution: 0.2 },
  { country: "Spain", exposureWeight: 0.005, contribution: 0.2 },
  // Micro exposures below 0.5%
  { country: "Italy", exposureWeight: 0.004, contribution: 0.15 },
  { country: "Sweden", exposureWeight: 0.003, contribution: 0.12 },
  { country: "Switzerland", exposureWeight: 0.003, contribution: 0.11 },
  { country: "Belgium", exposureWeight: 0.002, contribution: 0.08 },
  { country: "Austria", exposureWeight: 0.002, contribution: 0.07 },
  { country: "Norway", exposureWeight: 0.002, contribution: 0.06 },
  { country: "Denmark", exposureWeight: 0.001, contribution: 0.05 },
  { country: "Finland", exposureWeight: 0.001, contribution: 0.04 },
  { country: "Poland", exposureWeight: 0.001, contribution: 0.04 },
  { country: "Ireland", exposureWeight: 0.001, contribution: 0.03 },
  { country: "Portugal", exposureWeight: 0.001, contribution: 0.03 },
  { country: "Greece", exposureWeight: 0.001, contribution: 0.02 },
  { country: "Czech Republic", exposureWeight: 0.001, contribution: 0.02 }
];

const getDisplayCountryExposures = (exposures) => {
  const majorExposures = exposures.filter(e => e.exposureWeight >= MICRO_EXPOSURE_THRESHOLD);
  const microExposures = exposures.filter(e => e.exposureWeight < MICRO_EXPOSURE_THRESHOLD);

  console.log(`Total exposures: ${exposures.length}`);
  console.log(`Major exposures (>= 0.5%): ${majorExposures.length}`);
  console.log(`Micro exposures (< 0.5%): ${microExposures.length}`);

  if (microExposures.length === 0) {
    return { displayExposures: exposures, aggregatedRow: null };
  }

  // Calculate aggregated values for micro exposures
  const totalMicroExposure = microExposures.reduce((sum, e) => sum + e.exposureWeight, 0);
  const totalMicroContribution = microExposures.reduce((sum, e) => sum + e.contribution, 0);
  const microCount = microExposures.length;

  console.log(`\nAggregated micro exposures:`);
  console.log(`  Count: ${microCount}`);
  console.log(`  Total exposure: ${(totalMicroExposure * 100).toFixed(2)}%`);
  console.log(`  Total contribution: ${totalMicroContribution.toFixed(2)}`);

  const aggregatedRow = {
    country: `Other countries (<0.5% each)`,
    exposureWeight: totalMicroExposure,
    contribution: totalMicroContribution
  };

  const displayExposures = [...majorExposures, aggregatedRow];
  
  console.log(`\nDisplay exposures: ${displayExposures.length} rows`);
  console.log(`Expected: ${majorExposures.length} major + 1 aggregated = ${majorExposures.length + 1}`);

  return {
    displayExposures,
    aggregatedRow,
    microCount
  };
};

const result = getDisplayCountryExposures(testExposures);

console.log(`\n=== RESULT ===`);
console.log(`Display rows: ${result.displayExposures.length}`);
console.log(`Micro count: ${result.microCount}`);
console.log(`\nLast 3 rows:`);
result.displayExposures.slice(-3).forEach(e => {
  console.log(`  ${e.country}: ${(e.exposureWeight * 100).toFixed(2)}% exposure, ${e.contribution.toFixed(2)} contribution`);
});
