/**
 * Predictive Analytics Data Module
 * 
 * Centralized exports for all predictive analytics datasets.
 * These datasets are used for enhanced fallback logic in scenarioEngine.ts
 * when direct bilateral data is unavailable.
 * 
 * DO NOT import these into COGRI engine or risk assessment services.
 * This data is ONLY for Predictive Analytics service.
 */

// Type definitions
export type {
  CountryGDP,
  DistanceData,
  DistanceMatrix,
  ManufacturingData,
  FinancialHubData,
  ProductionNetwork
} from './types';

// GDP Data
export {
  countryGDPData,
  getGDPByCountryCode,
  getGDPByCountryName,
  getTotalWorldGDP,
  getTopEconomies
} from './countryGDP';

// Distance Matrix
export {
  distanceMatrix,
  getDistance,
  getCountryConnections,
  hasTradeAgreement,
  getRegionalNeighbors
} from './distanceMatrix';

// Manufacturing Intensity
export {
  manufacturingIntensityData,
  getManufacturingDataByCode,
  getManufacturingDataByName,
  getTopManufacturers,
  getElectronicsHubs,
  getNetworkMembers,
  getRegionalAverage
} from './manufacturingIntensity';

// Financial Hubs
export {
  financialHubsData,
  getFinancialHubByCode,
  getFinancialHubByName,
  getTopFinancialCenters,
  getMajorFinancialHubs,
  isFinancialHub,
  getRegionalFinancialHubs,
  calculateFinancialImportance,
  getLargeBankingCenters,
  getRegionalFinancialMetrics
} from './financialHubs';

// Production Networks
export {
  productionNetworks,
  getProductionNetwork,
  getCountryNetworks,
  shareProductionNetwork,
  getStrongestSharedNetwork,
  getNetworkIntegrationMultiplier,
  getNetworksByIntegration,
  getNetworkStats
} from './productionNetworks';

/**
 * Data Coverage Summary:
 * 
 * - GDP Data: 195 countries
 * - Distance Matrix: 500+ bilateral pairs (major economies and regions)
 * - Manufacturing Intensity: 70+ countries (all major manufacturing hubs)
 * - Financial Hubs: Top 50 global financial centers
 * - Production Networks: 20 regional/trade networks
 * 
 * Data Sources:
 * - World Bank Open Data (GDP)
 * - CEPII GeoDist (Distance)
 * - UNIDO, World Bank, Eurostat (Manufacturing)
 * - GFCI, BIS (Financial Hubs)
 * - Trade agreements, economic analysis (Production Networks)
 * 
 * Data Year: 2022-2024 (latest available)
 */

/**
 * Quick reference for common use cases:
 * 
 * 1. Get economic size:
 *    const gdp = getGDPByCountryCode('US');
 * 
 * 2. Get geographic distance:
 *    const distance = getDistance('US', 'CN');
 * 
 * 3. Check manufacturing capability:
 *    const mfg = getManufacturingDataByCode('CN');
 * 
 * 4. Check financial importance:
 *    const isHub = isFinancialHub('SG');
 * 
 * 5. Get production network integration:
 *    const multiplier = getNetworkIntegrationMultiplier('DE', 'PL');
 * 
 * 6. Check if countries share trade agreement:
 *    const hasFTA = hasTradeAgreement('US', 'MX');
 */