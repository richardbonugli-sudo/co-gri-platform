/**
 * Type definitions for Predictive Analytics data structures
 * Used for enhanced fallback logic in scenarioEngine.ts
 */

export interface CountryGDP {
  country: string;
  country_code: string;  // ISO 3166-1 alpha-2
  gdp_usd: number;
  year: number;
  source: string;
}

export interface DistanceData {
  distance_km: number;
  common_language: boolean;
  common_region: boolean;
  trade_agreement: string | null;
}

export interface DistanceMatrix {
  [country1: string]: {
    [country2: string]: DistanceData;
  };
}

export interface ManufacturingData {
  country: string;
  country_code: string;  // ISO 3166-1 alpha-2
  manufacturing_va_percent: number;  // % of GDP
  intermediate_goods_share: number;  // % of exports
  electronics_centrality: number;    // 0-100 index
  regional_networks: string[];       // e.g., ['East Asia', 'ASEAN']
  source: string;
  year: number;
}

export interface FinancialHubData {
  country: string;
  country_code: string;  // ISO 3166-1 alpha-2
  gfci_rank: number;
  banking_assets_usd: number;
  capital_market_depth: number;      // 0-100 index
  currency_importance: number;       // 0-100 index
  is_major_hub: boolean;             // Top 10 hubs
  source: string;
  year: number;
}

export interface ProductionNetwork {
  network_name: string;
  countries: string[];               // ISO 3166-1 alpha-2 codes
  integration_factor: number;        // 1.0-2.0 multiplier
  description: string;
}