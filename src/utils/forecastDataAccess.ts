/**
 * Data access utilities for CedarOwl forecast data
 * 
 * This module provides helper functions for accessing and querying
 * forecast data efficiently.
 * 
 * @module forecastDataAccess
 */

import { CEDAROWL_FORECAST_2026 } from '../data/cedarOwlForecast2026';
import type {
  CedarOwlForecast,
  CountryAdjustment,
  GeopoliticalEvent,
  AssetClassForecast,
  RegionalOutlook
} from '../types/forecast';

/**
 * Load CedarOwl forecast for a specific year
 */
export function loadCedarOwlForecast(year: string): CedarOwlForecast {
  if (year === '2026') {
    return CEDAROWL_FORECAST_2026;
  }
  throw new Error(`Forecast data not available for year ${year}`);
}

/**
 * Get country adjustment by country code
 */
export function getCountryAdjustment(countryCode: string): CountryAdjustment | null {
  const forecast = CEDAROWL_FORECAST_2026;
  return forecast.countryAdjustments[countryCode] || null;
}

/**
 * Get all geopolitical events
 */
export function getGeopoliticalEvents(): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents;
}

/**
 * Get events by timeline (e.g., "2026-01", "H1 2026", "Q3")
 */
export function getEventsByTimeline(timeline: string): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(
    event => event.timeline.includes(timeline)
  );
}

/**
 * Get events by risk level
 */
export function getEventsByRiskLevel(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(
    event => event.riskLevel === riskLevel
  );
}

/**
 * Get events affecting a specific country
 */
export function getEventsByCountry(countryCode: string): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(
    event => event.affectedCountries.includes(countryCode)
  );
}

/**
 * Get events with probability above threshold
 */
export function getHighProbabilityEvents(threshold: number = 0.7): GeopoliticalEvent[] {
  return CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(
    event => event.probability >= threshold
  );
}

/**
 * Get sector multiplier
 */
export function getSectorMultiplier(sector: string): number {
  return CEDAROWL_FORECAST_2026.sectorMultipliers[sector] || 1.0;
}

/**
 * Get regional premium
 */
export function getRegionalPremium(region: string): number {
  return CEDAROWL_FORECAST_2026.regionalPremiums[region] || 1.0;
}

/**
 * Get asset class forecast
 */
export function getAssetClassForecast(assetClass: string): AssetClassForecast | null {
  return CEDAROWL_FORECAST_2026.assetClassForecasts[assetClass] || null;
}

/**
 * Get all asset class forecasts sorted by expected return
 */
export function getAssetClassForecastsSorted(): AssetClassForecast[] {
  return Object.values(CEDAROWL_FORECAST_2026.assetClassForecasts)
    .sort((a, b) => b.expectedReturn - a.expectedReturn);
}

/**
 * Get regional outlook
 */
export function getRegionalOutlook(region: string): RegionalOutlook | null {
  return CEDAROWL_FORECAST_2026.regionalOutlook[region] || null;
}

/**
 * Get countries by outlook classification
 */
export function getCountriesByOutlook(
  outlook: 'STRONG_BUY' | 'BUY' | 'OUTPERFORM' | 'SELECTIVE' | 'NEUTRAL' | 'UNDERPERFORM' | 'AVOID' | 'HIGH_RISK'
): string[] {
  return Object.entries(CEDAROWL_FORECAST_2026.countryAdjustments)
    .filter(([_, adjustment]) => adjustment.outlook === outlook)
    .map(([countryCode, _]) => countryCode);
}

/**
 * Get countries by risk trend
 */
export function getCountriesByRiskTrend(
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
): string[] {
  return Object.entries(CEDAROWL_FORECAST_2026.countryAdjustments)
    .filter(([_, adjustment]) => adjustment.riskTrend === trend)
    .map(([countryCode, _]) => countryCode);
}

/**
 * Get top countries by expected return
 */
export function getTopCountriesByReturn(limit: number = 10): Array<{countryCode: string; adjustment: CountryAdjustment}> {
  return Object.entries(CEDAROWL_FORECAST_2026.countryAdjustments)
    .map(([countryCode, adjustment]) => ({ countryCode, adjustment }))
    .sort((a, b) => b.adjustment.expectedReturn - a.adjustment.expectedReturn)
    .slice(0, limit);
}

/**
 * Get countries with highest positive CSI delta
 */
export function getCountriesWithHighestRiskIncrease(limit: number = 10): Array<{countryCode: string; adjustment: CountryAdjustment}> {
  return Object.entries(CEDAROWL_FORECAST_2026.countryAdjustments)
    .map(([countryCode, adjustment]) => ({ countryCode, adjustment }))
    .sort((a, b) => b.adjustment.delta - a.adjustment.delta)
    .slice(0, limit);
}

/**
 * Get countries with highest negative CSI delta
 */
export function getCountriesWithHighestRiskDecrease(limit: number = 10): Array<{countryCode: string; adjustment: CountryAdjustment}> {
  return Object.entries(CEDAROWL_FORECAST_2026.countryAdjustments)
    .map(([countryCode, adjustment]) => ({ countryCode, adjustment }))
    .sort((a, b) => a.adjustment.delta - b.adjustment.delta)
    .slice(0, limit);
}

/**
 * Get forecast summary statistics
 */
export function getForecastSummary() {
  const adjustments = Object.values(CEDAROWL_FORECAST_2026.countryAdjustments);
  
  return {
    totalCountries: adjustments.length,
    totalEvents: CEDAROWL_FORECAST_2026.geopoliticalEvents.length,
    averageDelta: adjustments.reduce((sum, adj) => sum + adj.delta, 0) / adjustments.length,
    averageReturn: adjustments.reduce((sum, adj) => sum + adj.expectedReturn, 0) / adjustments.length,
    improvingCount: adjustments.filter(adj => adj.riskTrend === 'IMPROVING').length,
    deterioratingCount: adjustments.filter(adj => adj.riskTrend === 'DETERIORATING').length,
    stableCount: adjustments.filter(adj => adj.riskTrend === 'STABLE').length,
    highProbabilityEvents: CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(e => e.probability >= 0.7).length,
    criticalEvents: CEDAROWL_FORECAST_2026.geopoliticalEvents.filter(e => e.riskLevel === 'CRITICAL').length
  };
}