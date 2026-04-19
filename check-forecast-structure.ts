/**
 * Check actual forecast data structure
 */

import { loadCedarOwlForecast } from './src/utils/forecastDataAccess';

const forecast = loadCedarOwlForecast('2026');

console.log('\n=== FORECAST DATA STRUCTURE ===\n');
console.log('Forecast Year:', forecast.forecastYear);
console.log('Overall Confidence:', forecast.overallConfidence);
console.log('Last Updated:', forecast.lastUpdated);
console.log('\nCountry Adjustments:', Object.keys(forecast.countryAdjustments).length);
console.log('Geopolitical Events:', forecast.geopoliticalEvents.length);

console.log('\n=== FIRST GEOPOLITICAL EVENT ===\n');
const firstEvent = forecast.geopoliticalEvents[0];
console.log('Full event object:');
console.log(JSON.stringify(firstEvent, null, 2));

console.log('\n=== CHECKING EVENT FIELDS ===\n');
console.log('event field:', firstEvent.event);
console.log('probability field:', firstEvent.probability);
console.log('affectedCountries field:', firstEvent.affectedCountries);
console.log('affectedSectors field:', firstEvent.affectedSectors);
console.log('affectedChannels field:', firstEvent.affectedChannels);

console.log('\n=== CHECKING ALL EVENTS ===\n');
forecast.geopoliticalEvents.slice(0, 5).forEach((event, i) => {
  console.log(`Event ${i + 1}:`);
  console.log(`  Name: ${event.event || event.name || event.title || 'MISSING'}`);
  console.log(`  Probability: ${event.probability || 'MISSING'}`);
  console.log(`  Countries: ${event.affectedCountries?.length || 0}`);
  console.log('');
});
