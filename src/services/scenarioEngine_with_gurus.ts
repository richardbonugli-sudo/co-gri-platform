// Import the gurus forecast adapter at the top of the file
import { loadForecastScenarios, getForecastMetadata, type ForecastScenarioShock } from './gurusForecastAdapter';

// Add to EVENT_BASE_SHOCKS (around line 460-472)
const EVENT_BASE_SHOCKS: Record<string, number> = {
  'Sanctions': 15,
  'Capital Controls / FX Restrictions': 12,
  'Nationalization / Expropriation': 18,
  'Export Ban / Import Restriction': 10,
  'Foreign Investment Restriction': 8,
  'Trade Embargo / Tariff Shock': 12,
  'Conflict / Military Escalation': 25,
  'Domestic Instability (protests, riots, regime crisis)': 15,
  'Energy / Commodity Restriction': 10,
  'Cyberattack / Infrastructure Disruption': 8,
  '16 Gurus Forecast (2026 Baseline)': 15, // NEW: Gurus forecast event
  'Custom Event': 10
};

/**
 * Check if event type is a forecast-based event
 */
function isForecastEvent(eventType: string): boolean {
  return eventType === '16 Gurus Forecast (2026 Baseline)';
}

/**
 * Get forecast-based shock for a country
 * Returns the forecast delta converted to scenario shock format
 */
function getForecastShockForCountry(country: string): number {
  const forecastScenarios = loadForecastScenarios('2026');
  const countryShock = forecastScenarios.find(s => s.country === country);
  
  if (countryShock) {
    return countryShock.baseShock;
  }
  
  // Return minimal shock if no forecast data available
  return 0.5;
}

/**
 * Get forecast metadata for a country (for display purposes)
 */
function getForecastMetadataForCountry(country: string): {
  drivers: string[];
  outlook: string;
  riskTrend: string;
  applicableEvents: string[];
} | null {
  const forecastScenarios = loadForecastScenarios('2026');
  const countryShock = forecastScenarios.find(s => s.country === country);
  
  if (countryShock) {
    return {
      drivers: countryShock.drivers,
      outlook: countryShock.outlook,
      riskTrend: countryShock.riskTrend,
      applicableEvents: countryShock.applicableEvents.map(e => e.event)
    };
  }
  
  return null;
}

// This file contains the modifications needed for scenarioEngine.ts
// The actual implementation will be done by inserting these functions and modifications
// into the existing scenarioEngine.ts file