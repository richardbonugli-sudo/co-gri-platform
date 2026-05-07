/**
 * Debug Event Filter
 * 
 * Investigates why event filtering returns 0 events for Apple
 */

import { loadForecastScenarios } from './src/services/gurusForecastAdapter';
import { getCompanyGeographicExposure } from './src/services/geographicExposureService';
import { filterRelevantEvents, CompanyExposureData } from './src/services/forecast/eventRelevanceFilter';

async function debugEventFilter() {
  console.log('\n=== EVENT FILTER DEBUG ===\n');
  
  // Step 1: Load Apple's exposure data
  console.log('Step 1: Loading Apple exposure data...');
  const appleGeoData = await getCompanyGeographicExposure('AAPL');
  
  const companyData: CompanyExposureData = {
    company: appleGeoData.company || 'AAPL',
    ticker: 'AAPL',
    sector: appleGeoData.sector || 'Technology',
    exposures: Object.entries(appleGeoData.channelBreakdown || {}).map(([country, data]) => ({
      country,
      percentage: data.blended * 100
    })),
    channelBreakdown: appleGeoData.channelBreakdown
  };
  
  console.log(`✓ Company: ${companyData.company}`);
  console.log(`✓ Sector: ${companyData.sector}`);
  console.log(`✓ Countries with exposure: ${companyData.exposures.length}`);
  console.log('\nTop 5 country exposures:');
  companyData.exposures
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
    .forEach(e => console.log(`  - ${e.country}: ${e.percentage.toFixed(1)}%`));
  
  // Step 2: Load forecast events
  console.log('\n\nStep 2: Loading forecast events...');
  const forecastEvents = loadForecastScenarios('2026');
  console.log(`✓ Loaded ${forecastEvents.length} forecast events`);
  
  // Step 3: Inspect first few events
  console.log('\n\nStep 3: Inspecting first 5 events...\n');
  forecastEvents.slice(0, 5).forEach((event, i) => {
    console.log(`Event ${i + 1}: ${event.event}`);
    console.log(`  Probability: ${event.probability}`);
    console.log(`  Affected Countries: ${JSON.stringify(event.affectedCountries)}`);
    console.log(`  Affected Sectors: ${JSON.stringify(event.affectedSectors)}`);
    console.log(`  Affected Channels: ${JSON.stringify(event.affectedChannels)}`);
    console.log('');
  });
  
  // Step 4: Check for events with China exposure
  console.log('\n\nStep 4: Searching for China-related events...');
  const chinaEvents = forecastEvents.filter(e => 
    e.affectedCountries?.includes('China') || 
    e.affectedCountries?.includes('china') ||
    e.event.toLowerCase().includes('china')
  );
  console.log(`✓ Found ${chinaEvents.length} China-related events`);
  if (chinaEvents.length > 0) {
    console.log('\nFirst China event:');
    console.log(`  Event: ${chinaEvents[0].event}`);
    console.log(`  Affected Countries: ${JSON.stringify(chinaEvents[0].affectedCountries)}`);
    console.log(`  Affected Sectors: ${JSON.stringify(chinaEvents[0].affectedSectors)}`);
    console.log(`  Affected Channels: ${JSON.stringify(chinaEvents[0].affectedChannels)}`);
  }
  
  // Step 5: Check for Technology sector events
  console.log('\n\nStep 5: Searching for Technology sector events...');
  const techEvents = forecastEvents.filter(e => 
    e.affectedSectors?.includes('Technology') ||
    e.affectedSectors?.includes('technology') ||
    e.event.toLowerCase().includes('tech')
  );
  console.log(`✓ Found ${techEvents.length} Technology sector events`);
  if (techEvents.length > 0) {
    console.log('\nFirst Technology event:');
    console.log(`  Event: ${techEvents[0].event}`);
    console.log(`  Affected Countries: ${JSON.stringify(techEvents[0].affectedCountries)}`);
    console.log(`  Affected Sectors: ${JSON.stringify(techEvents[0].affectedSectors)}`);
    console.log(`  Affected Channels: ${JSON.stringify(techEvents[0].affectedChannels)}`);
  }
  
  // Step 6: Run the filter
  console.log('\n\nStep 6: Running event filter...');
  const relevantEvents = filterRelevantEvents(companyData, forecastEvents);
  console.log(`✓ Filter returned ${relevantEvents.length} relevant events`);
  
  if (relevantEvents.length > 0) {
    console.log('\nRelevant events:');
    relevantEvents.forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.event}`);
      console.log(`   Relevance Score: ${(event.relevanceScore * 100).toFixed(1)}%`);
      console.log(`   Reasons: ${event.relevanceReasons.join(', ')}`);
    });
  } else {
    console.log('\n⚠️  No events passed the filter!');
    console.log('\nDiagnosing the issue...\n');
    
    // Diagnose: Check if any event has the required fields
    const eventsWithCountries = forecastEvents.filter(e => e.affectedCountries && e.affectedCountries.length > 0);
    const eventsWithSectors = forecastEvents.filter(e => e.affectedSectors && e.affectedSectors.length > 0);
    const eventsWithChannels = forecastEvents.filter(e => e.affectedChannels && e.affectedChannels.length > 0);
    
    console.log(`Events with affectedCountries: ${eventsWithCountries.length}/${forecastEvents.length}`);
    console.log(`Events with affectedSectors: ${eventsWithSectors.length}/${forecastEvents.length}`);
    console.log(`Events with affectedChannels: ${eventsWithChannels.length}/${forecastEvents.length}`);
    
    if (eventsWithCountries.length === 0) {
      console.log('\n❌ ISSUE FOUND: No events have affectedCountries field populated!');
    }
    if (eventsWithSectors.length === 0) {
      console.log('\n❌ ISSUE FOUND: No events have affectedSectors field populated!');
    }
    if (eventsWithChannels.length === 0) {
      console.log('\n❌ ISSUE FOUND: No events have affectedChannels field populated!');
    }
    
    // Show structure of first event
    console.log('\n\nStructure of first event:');
    console.log(JSON.stringify(forecastEvents[0], null, 2));
  }
  
  console.log('\n=== DEBUG COMPLETE ===\n');
}

debugEventFilter().catch(error => {
  console.error('\n❌ ERROR during debug:');
  console.error(error);
  process.exit(1);
});
