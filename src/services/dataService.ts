/**
 * Data Service Layer
 * Provides API integration structure for real-time data
 * Currently uses mock data, designed for easy replacement with live APIs
 */

import { GLOBAL_COUNTRIES, getCountryData } from '@/data/globalCountries';
import { getCountrySectorData, getGlobalSectorData } from '@/data/sectorData';
import type { CountryRiskData } from '@/data/globalCountries';
import type { SectorExposure } from '@/data/sectorData';

// API Configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints (ready for backend integration)
const ENDPOINTS = {
  COUNTRIES: `${API_BASE_URL}/countries`,
  COUNTRY_DETAIL: (country: string) => `${API_BASE_URL}/countries/${encodeURIComponent(country)}`,
  SECTORS: `${API_BASE_URL}/sectors`,
  COUNTRY_SECTORS: (country: string) => `${API_BASE_URL}/countries/${encodeURIComponent(country)}/sectors`,
  EVENTS: `${API_BASE_URL}/events`,
  COUNTRY_EVENTS: (country: string) => `${API_BASE_URL}/countries/${encodeURIComponent(country)}/events`,
  REGIONS: `${API_BASE_URL}/regions`,
  TRENDS: `${API_BASE_URL}/trends`,
};

/**
 * Generic API fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout', { cause: error });
      }
      throw error;
    }
    throw new Error('Unknown error occurred', { cause: error });
  }
}

/**
 * Fetch all countries data
 * Currently returns mock data, ready for API integration
 */
export async function fetchCountries(): Promise<CountryRiskData[]> {
  // TODO: Replace with actual API call when backend is ready
  // return await apiFetch<CountryRiskData[]>(ENDPOINTS.COUNTRIES);
  
  // Mock implementation with simulated delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(GLOBAL_COUNTRIES);
    }, 100);
  });
}

/**
 * Fetch single country data
 */
export async function fetchCountryDetail(country: string): Promise<CountryRiskData | null> {
  // TODO: Replace with actual API call
  // return await apiFetch<CountryRiskData>(ENDPOINTS.COUNTRY_DETAIL(country));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCountryData(country) || null);
    }, 100);
  });
}

/**
 * Fetch global sector data
 */
export async function fetchGlobalSectors(): Promise<SectorExposure[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<SectorExposure[]>(ENDPOINTS.SECTORS);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getGlobalSectorData());
    }, 100);
  });
}

/**
 * Fetch country-specific sector data
 */
export async function fetchCountrySectors(country: string): Promise<SectorExposure[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<SectorExposure[]>(ENDPOINTS.COUNTRY_SECTORS(country));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCountrySectorData(country));
    }, 100);
  });
}

/**
 * Fetch recent events
 */
export async function fetchEvents(limit: number = 20): Promise<any[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<any[]>(`${ENDPOINTS.EVENTS}?limit=${limit}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

/**
 * Fetch country-specific events
 */
export async function fetchCountryEvents(country: string, limit: number = 20): Promise<any[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<any[]>(`${ENDPOINTS.COUNTRY_EVENTS(country)}?limit=${limit}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

/**
 * Fetch regional aggregates
 */
export async function fetchRegionalData(): Promise<any[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<any[]>(ENDPOINTS.REGIONS);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

/**
 * Fetch trend data
 */
export async function fetchTrendData(timeWindow: string): Promise<any[]> {
  // TODO: Replace with actual API call
  // return await apiFetch<any[]>(`${ENDPOINTS.TRENDS}?window=${timeWindow}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

// Export API configuration for external use
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  ENDPOINTS,
};