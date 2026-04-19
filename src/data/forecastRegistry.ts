/**
 * Forecast registry and versioning system
 * 
 * This module manages multiple forecast versions and provides
 * utilities for version management and staleness detection.
 * 
 * @module forecastRegistry
 */

import { CEDAROWL_FORECAST_2026 } from './cedarOwlForecast2026';
import type { CedarOwlForecast, ForecastRegistryEntry } from '../types/forecast';

/**
 * Registry of all available forecasts by year
 */
interface ForecastRegistry {
  [year: string]: CedarOwlForecast;
}

export const FORECAST_REGISTRY: ForecastRegistry = {
  '2026': CEDAROWL_FORECAST_2026
};

/**
 * Get list of available forecast years
 */
export function getAvailableForecastYears(): string[] {
  return Object.keys(FORECAST_REGISTRY).sort();
}

/**
 * Get the latest available forecast
 */
export function getLatestForecast(): CedarOwlForecast {
  const years = getAvailableForecastYears();
  const latestYear = years[years.length - 1];
  return FORECAST_REGISTRY[latestYear];
}

/**
 * Get forecast by year
 */
export function getForecastByYear(year: string): CedarOwlForecast | null {
  return FORECAST_REGISTRY[year] || null;
}

/**
 * Check if a forecast is stale (past next update date)
 */
export function isForecastStale(forecast: CedarOwlForecast): boolean {
  const nextUpdate = new Date(forecast.metadata.nextUpdate);
  const now = new Date();
  return now > nextUpdate;
}

/**
 * Get forecast registry entry with staleness information
 */
export function getForecastRegistryEntry(year: string): ForecastRegistryEntry | null {
  const forecast = getForecastByYear(year);
  if (!forecast) return null;

  return {
    year,
    forecast,
    isStale: isForecastStale(forecast)
  };
}

/**
 * Get all forecast registry entries
 */
export function getAllForecastRegistryEntries(): ForecastRegistryEntry[] {
  return getAvailableForecastYears().map(year => ({
    year,
    forecast: FORECAST_REGISTRY[year],
    isStale: isForecastStale(FORECAST_REGISTRY[year])
  }));
}

/**
 * Get days until next forecast update
 */
export function getDaysUntilNextUpdate(forecast: CedarOwlForecast): number {
  const nextUpdate = new Date(forecast.metadata.nextUpdate);
  const now = new Date();
  const diffTime = nextUpdate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get staleness warning message
 */
export function getStalenessWarning(forecast: CedarOwlForecast): string | null {
  const daysUntilUpdate = getDaysUntilNextUpdate(forecast);
  
  if (daysUntilUpdate < 0) {
    const daysOverdue = Math.abs(daysUntilUpdate);
    return `This forecast is ${daysOverdue} days overdue for update. Please check for newer data.`;
  }
  
  if (daysUntilUpdate <= 7) {
    return `This forecast will be updated in ${daysUntilUpdate} days.`;
  }
  
  return null;
}
