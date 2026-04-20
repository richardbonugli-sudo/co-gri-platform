/**
 * Manufacturing Intensity Data for Countries
 * Source: UNIDO Industrial Statistics Database, World Bank, OECD
 * Metrics: Manufacturing value-added, intermediate goods exports, electronics centrality
 * 
 * Data represents manufacturing capabilities and integration into global production networks.
 * Year: 2022-2023 (latest available)
 */

import { ManufacturingData } from './types';

export const manufacturingIntensityData: ManufacturingData[] = [
  // Top Manufacturing Economies - East Asia
  {
    country: "China",
    country_code: "CN",
    manufacturing_va_percent: 27.7,
    intermediate_goods_share: 42.5,
    electronics_centrality: 95,
    regional_networks: ["East Asia", "ASEAN+3"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "South Korea",
    country_code: "KR",
    manufacturing_va_percent: 27.3,
    intermediate_goods_share: 51.2,
    electronics_centrality: 92,
    regional_networks: ["East Asia", "ASEAN+3"],
    source: "UNIDO, OECD",
    year: 2023
  },
  {
    country: "Taiwan",
    country_code: "TW",
    manufacturing_va_percent: 31.2,
    intermediate_goods_share: 58.3,
    electronics_centrality: 98,
    regional_networks: ["East Asia"],
    source: "Taiwan Statistical Bureau",
    year: 2023
  },
  {
    country: "Japan",
    country_code: "JP",
    manufacturing_va_percent: 20.8,
    intermediate_goods_share: 45.7,
    electronics_centrality: 85,
    regional_networks: ["East Asia", "ASEAN+3"],
    source: "UNIDO, OECD",
    year: 2023
  },
  
  // ASEAN Manufacturing Hubs
  {
    country: "Vietnam",
    country_code: "VN",
    manufacturing_va_percent: 24.5,
    intermediate_goods_share: 38.9,
    electronics_centrality: 78,
    regional_networks: ["ASEAN", "East Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Thailand",
    country_code: "TH",
    manufacturing_va_percent: 27.1,
    intermediate_goods_share: 41.3,
    electronics_centrality: 72,
    regional_networks: ["ASEAN", "East Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Malaysia",
    country_code: "MY",
    manufacturing_va_percent: 22.8,
    intermediate_goods_share: 47.2,
    electronics_centrality: 81,
    regional_networks: ["ASEAN", "East Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Singapore",
    country_code: "SG",
    manufacturing_va_percent: 20.3,
    intermediate_goods_share: 52.8,
    electronics_centrality: 88,
    regional_networks: ["ASEAN", "East Asia"],
    source: "UNIDO, Singapore Stats",
    year: 2023
  },
  {
    country: "Indonesia",
    country_code: "ID",
    manufacturing_va_percent: 19.7,
    intermediate_goods_share: 28.4,
    electronics_centrality: 45,
    regional_networks: ["ASEAN"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Philippines",
    country_code: "PH",
    manufacturing_va_percent: 18.2,
    intermediate_goods_share: 35.6,
    electronics_centrality: 68,
    regional_networks: ["ASEAN", "East Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  
  // Europe - Advanced Manufacturing
  {
    country: "Germany",
    country_code: "DE",
    manufacturing_va_percent: 19.1,
    intermediate_goods_share: 48.3,
    electronics_centrality: 75,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Italy",
    country_code: "IT",
    manufacturing_va_percent: 15.6,
    intermediate_goods_share: 39.2,
    electronics_centrality: 55,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "France",
    country_code: "FR",
    manufacturing_va_percent: 10.1,
    intermediate_goods_share: 35.8,
    electronics_centrality: 58,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Poland",
    country_code: "PL",
    manufacturing_va_percent: 17.8,
    intermediate_goods_share: 44.7,
    electronics_centrality: 62,
    regional_networks: ["EU", "Central Europe"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Czech Republic",
    country_code: "CZ",
    manufacturing_va_percent: 24.3,
    intermediate_goods_share: 52.1,
    electronics_centrality: 68,
    regional_networks: ["EU", "Central Europe"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Spain",
    country_code: "ES",
    manufacturing_va_percent: 11.8,
    intermediate_goods_share: 32.4,
    electronics_centrality: 48,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Netherlands",
    country_code: "NL",
    manufacturing_va_percent: 10.2,
    intermediate_goods_share: 41.5,
    electronics_centrality: 65,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Belgium",
    country_code: "BE",
    manufacturing_va_percent: 11.4,
    intermediate_goods_share: 43.2,
    electronics_centrality: 60,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Austria",
    country_code: "AT",
    manufacturing_va_percent: 16.8,
    intermediate_goods_share: 45.3,
    electronics_centrality: 58,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Sweden",
    country_code: "SE",
    manufacturing_va_percent: 13.2,
    intermediate_goods_share: 42.8,
    electronics_centrality: 70,
    regional_networks: ["EU", "Nordic"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Switzerland",
    country_code: "CH",
    manufacturing_va_percent: 17.5,
    intermediate_goods_share: 46.7,
    electronics_centrality: 72,
    regional_networks: ["EFTA"],
    source: "UNIDO, Swiss Stats",
    year: 2023
  },
  {
    country: "United Kingdom",
    country_code: "GB",
    manufacturing_va_percent: 9.2,
    intermediate_goods_share: 31.5,
    electronics_centrality: 52,
    regional_networks: [],
    source: "UNIDO, ONS",
    year: 2023
  },
  
  // Americas
  {
    country: "United States",
    country_code: "US",
    manufacturing_va_percent: 10.8,
    intermediate_goods_share: 33.2,
    electronics_centrality: 82,
    regional_networks: ["USMCA"],
    source: "UNIDO, BEA",
    year: 2023
  },
  {
    country: "Mexico",
    country_code: "MX",
    manufacturing_va_percent: 16.9,
    intermediate_goods_share: 48.5,
    electronics_centrality: 75,
    regional_networks: ["USMCA"],
    source: "UNIDO, INEGI",
    year: 2023
  },
  {
    country: "Canada",
    country_code: "CA",
    manufacturing_va_percent: 10.1,
    intermediate_goods_share: 36.8,
    electronics_centrality: 58,
    regional_networks: ["USMCA"],
    source: "UNIDO, Statistics Canada",
    year: 2023
  },
  {
    country: "Brazil",
    country_code: "BR",
    manufacturing_va_percent: 11.3,
    intermediate_goods_share: 25.7,
    electronics_centrality: 42,
    regional_networks: ["Mercosur"],
    source: "UNIDO, IBGE",
    year: 2023
  },
  
  // Other Major Economies
  {
    country: "India",
    country_code: "IN",
    manufacturing_va_percent: 13.2,
    intermediate_goods_share: 28.9,
    electronics_centrality: 55,
    regional_networks: ["South Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Russia",
    country_code: "RU",
    manufacturing_va_percent: 13.8,
    intermediate_goods_share: 22.4,
    electronics_centrality: 35,
    regional_networks: ["EAEU"],
    source: "UNIDO, Rosstat",
    year: 2023
  },
  {
    country: "Turkey",
    country_code: "TR",
    manufacturing_va_percent: 19.2,
    intermediate_goods_share: 37.8,
    electronics_centrality: 52,
    regional_networks: [],
    source: "UNIDO, TurkStat",
    year: 2023
  },
  {
    country: "Australia",
    country_code: "AU",
    manufacturing_va_percent: 5.8,
    intermediate_goods_share: 18.3,
    electronics_centrality: 28,
    regional_networks: ["ANZCERTA"],
    source: "UNIDO, ABS",
    year: 2023
  },
  
  // Additional ASEAN
  {
    country: "Myanmar",
    country_code: "MM",
    manufacturing_va_percent: 22.4,
    intermediate_goods_share: 31.2,
    electronics_centrality: 35,
    regional_networks: ["ASEAN"],
    source: "UNIDO, World Bank",
    year: 2022
  },
  {
    country: "Cambodia",
    country_code: "KH",
    manufacturing_va_percent: 16.8,
    intermediate_goods_share: 28.5,
    electronics_centrality: 25,
    regional_networks: ["ASEAN"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Laos",
    country_code: "LA",
    manufacturing_va_percent: 9.2,
    intermediate_goods_share: 22.1,
    electronics_centrality: 18,
    regional_networks: ["ASEAN"],
    source: "UNIDO, World Bank",
    year: 2022
  },
  {
    country: "Brunei",
    country_code: "BN",
    manufacturing_va_percent: 11.5,
    intermediate_goods_share: 15.3,
    electronics_centrality: 20,
    regional_networks: ["ASEAN"],
    source: "UNIDO, World Bank",
    year: 2022
  },
  
  // Additional Europe
  {
    country: "Hungary",
    country_code: "HU",
    manufacturing_va_percent: 21.2,
    intermediate_goods_share: 50.8,
    electronics_centrality: 72,
    regional_networks: ["EU", "Central Europe"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Slovakia",
    country_code: "SK",
    manufacturing_va_percent: 20.5,
    intermediate_goods_share: 53.2,
    electronics_centrality: 68,
    regional_networks: ["EU", "Central Europe"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Romania",
    country_code: "RO",
    manufacturing_va_percent: 18.7,
    intermediate_goods_share: 42.3,
    electronics_centrality: 58,
    regional_networks: ["EU"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Portugal",
    country_code: "PT",
    manufacturing_va_percent: 13.1,
    intermediate_goods_share: 35.7,
    electronics_centrality: 48,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Ireland",
    country_code: "IE",
    manufacturing_va_percent: 31.8,
    intermediate_goods_share: 48.2,
    electronics_centrality: 85,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, CSO Ireland",
    year: 2023
  },
  {
    country: "Finland",
    country_code: "FI",
    manufacturing_va_percent: 14.2,
    intermediate_goods_share: 38.5,
    electronics_centrality: 68,
    regional_networks: ["EU", "Nordic", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Denmark",
    country_code: "DK",
    manufacturing_va_percent: 11.8,
    intermediate_goods_share: 34.2,
    electronics_centrality: 55,
    regional_networks: ["EU", "Nordic"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Norway",
    country_code: "NO",
    manufacturing_va_percent: 6.2,
    intermediate_goods_share: 28.3,
    electronics_centrality: 42,
    regional_networks: ["EFTA", "Nordic"],
    source: "UNIDO, SSB Norway",
    year: 2023
  },
  
  // Middle East
  {
    country: "Saudi Arabia",
    country_code: "SA",
    manufacturing_va_percent: 12.8,
    intermediate_goods_share: 18.5,
    electronics_centrality: 22,
    regional_networks: ["GCC"],
    source: "UNIDO, GASTAT",
    year: 2023
  },
  {
    country: "United Arab Emirates",
    country_code: "AE",
    manufacturing_va_percent: 8.7,
    intermediate_goods_share: 22.3,
    electronics_centrality: 35,
    regional_networks: ["GCC"],
    source: "UNIDO, UAE Stats",
    year: 2023
  },
  {
    country: "Israel",
    country_code: "IL",
    manufacturing_va_percent: 10.5,
    intermediate_goods_share: 32.8,
    electronics_centrality: 78,
    regional_networks: [],
    source: "UNIDO, CBS Israel",
    year: 2023
  },
  
  // South Asia
  {
    country: "Bangladesh",
    country_code: "BD",
    manufacturing_va_percent: 17.9,
    intermediate_goods_share: 24.2,
    electronics_centrality: 28,
    regional_networks: ["South Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  {
    country: "Pakistan",
    country_code: "PK",
    manufacturing_va_percent: 12.8,
    intermediate_goods_share: 21.5,
    electronics_centrality: 25,
    regional_networks: ["South Asia"],
    source: "UNIDO, PBS Pakistan",
    year: 2023
  },
  {
    country: "Sri Lanka",
    country_code: "LK",
    manufacturing_va_percent: 14.2,
    intermediate_goods_share: 26.8,
    electronics_centrality: 32,
    regional_networks: ["South Asia"],
    source: "UNIDO, World Bank",
    year: 2023
  },
  
  // Latin America
  {
    country: "Argentina",
    country_code: "AR",
    manufacturing_va_percent: 13.5,
    intermediate_goods_share: 22.8,
    electronics_centrality: 35,
    regional_networks: ["Mercosur"],
    source: "UNIDO, INDEC",
    year: 2023
  },
  {
    country: "Chile",
    country_code: "CL",
    manufacturing_va_percent: 10.2,
    intermediate_goods_share: 18.5,
    electronics_centrality: 28,
    regional_networks: [],
    source: "UNIDO, INE Chile",
    year: 2023
  },
  {
    country: "Colombia",
    country_code: "CO",
    manufacturing_va_percent: 11.1,
    intermediate_goods_share: 19.7,
    electronics_centrality: 25,
    regional_networks: [],
    source: "UNIDO, DANE",
    year: 2023
  },
  {
    country: "Peru",
    country_code: "PE",
    manufacturing_va_percent: 12.3,
    intermediate_goods_share: 16.8,
    electronics_centrality: 22,
    regional_networks: [],
    source: "UNIDO, INEI Peru",
    year: 2023
  },
  
  // Africa
  {
    country: "South Africa",
    country_code: "ZA",
    manufacturing_va_percent: 11.8,
    intermediate_goods_share: 24.5,
    electronics_centrality: 32,
    regional_networks: ["SADC"],
    source: "UNIDO, Stats SA",
    year: 2023
  },
  {
    country: "Egypt",
    country_code: "EG",
    manufacturing_va_percent: 15.2,
    intermediate_goods_share: 22.3,
    electronics_centrality: 28,
    regional_networks: [],
    source: "UNIDO, CAPMAS",
    year: 2023
  },
  {
    country: "Morocco",
    country_code: "MA",
    manufacturing_va_percent: 14.8,
    intermediate_goods_share: 31.2,
    electronics_centrality: 42,
    regional_networks: [],
    source: "UNIDO, HCP Morocco",
    year: 2023
  },
  {
    country: "Kenya",
    country_code: "KE",
    manufacturing_va_percent: 7.5,
    intermediate_goods_share: 15.8,
    electronics_centrality: 18,
    regional_networks: ["EAC"],
    source: "UNIDO, KNBS",
    year: 2023
  },
  
  // Oceania
  {
    country: "New Zealand",
    country_code: "NZ",
    manufacturing_va_percent: 9.8,
    intermediate_goods_share: 21.2,
    electronics_centrality: 32,
    regional_networks: ["ANZCERTA"],
    source: "UNIDO, Stats NZ",
    year: 2023
  },
  
  // Additional Asia
  {
    country: "Hong Kong",
    country_code: "HK",
    manufacturing_va_percent: 1.2,
    intermediate_goods_share: 38.5,
    electronics_centrality: 65,
    regional_networks: ["East Asia"],
    source: "UNIDO, C&SD HK",
    year: 2023
  },
  
  // Central/Eastern Europe
  {
    country: "Ukraine",
    country_code: "UA",
    manufacturing_va_percent: 11.2,
    intermediate_goods_share: 28.5,
    electronics_centrality: 35,
    regional_networks: [],
    source: "UNIDO, State Statistics Ukraine",
    year: 2022
  },
  {
    country: "Slovenia",
    country_code: "SI",
    manufacturing_va_percent: 20.8,
    intermediate_goods_share: 48.2,
    electronics_centrality: 62,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Croatia",
    country_code: "HR",
    manufacturing_va_percent: 13.5,
    intermediate_goods_share: 35.8,
    electronics_centrality: 45,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Bulgaria",
    country_code: "BG",
    manufacturing_va_percent: 14.2,
    intermediate_goods_share: 38.5,
    electronics_centrality: 52,
    regional_networks: ["EU"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Lithuania",
    country_code: "LT",
    manufacturing_va_percent: 16.8,
    intermediate_goods_share: 41.2,
    electronics_centrality: 55,
    regional_networks: ["EU", "Baltic", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Latvia",
    country_code: "LV",
    manufacturing_va_percent: 11.5,
    intermediate_goods_share: 32.8,
    electronics_centrality: 42,
    regional_networks: ["EU", "Baltic", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Estonia",
    country_code: "EE",
    manufacturing_va_percent: 12.8,
    intermediate_goods_share: 35.2,
    electronics_centrality: 58,
    regional_networks: ["EU", "Baltic", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  
  // Additional countries (lower manufacturing intensity)
  {
    country: "Greece",
    country_code: "GR",
    manufacturing_va_percent: 8.2,
    intermediate_goods_share: 25.3,
    electronics_centrality: 35,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Luxembourg",
    country_code: "LU",
    manufacturing_va_percent: 4.8,
    intermediate_goods_share: 28.5,
    electronics_centrality: 42,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Malta",
    country_code: "MT",
    manufacturing_va_percent: 7.5,
    intermediate_goods_share: 32.8,
    electronics_centrality: 55,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
  {
    country: "Cyprus",
    country_code: "CY",
    manufacturing_va_percent: 5.2,
    intermediate_goods_share: 22.5,
    electronics_centrality: 28,
    regional_networks: ["EU", "Eurozone"],
    source: "UNIDO, Eurostat",
    year: 2023
  },
];

/**
 * Helper function to get manufacturing data by country code
 */
export function getManufacturingDataByCode(countryCode: string): ManufacturingData | undefined {
  return manufacturingIntensityData.find(c => c.country_code === countryCode);
}

/**
 * Helper function to get manufacturing data by country name
 */
export function getManufacturingDataByName(countryName: string): ManufacturingData | undefined {
  return manufacturingIntensityData.find(c => c.country.toLowerCase() === countryName.toLowerCase());
}

/**
 * Get top N manufacturing economies by value-added percentage
 */
export function getTopManufacturers(n: number): ManufacturingData[] {
  return [...manufacturingIntensityData]
    .sort((a, b) => b.manufacturing_va_percent - a.manufacturing_va_percent)
    .slice(0, n);
}

/**
 * Get countries by electronics centrality (semiconductor/ICT production)
 */
export function getElectronicsHubs(minCentrality: number = 70): ManufacturingData[] {
  return manufacturingIntensityData.filter(c => c.electronics_centrality >= minCentrality);
}

/**
 * Get countries in a specific production network
 */
export function getNetworkMembers(networkName: string): ManufacturingData[] {
  return manufacturingIntensityData.filter(c => 
    c.regional_networks.some(n => n.toLowerCase().includes(networkName.toLowerCase()))
  );
}

/**
 * Calculate average manufacturing intensity for a region
 */
export function getRegionalAverage(networkName: string): {
  avg_manufacturing_va: number;
  avg_intermediate_goods: number;
  avg_electronics_centrality: number;
  country_count: number;
} {
  const members = getNetworkMembers(networkName);
  
  if (members.length === 0) {
    return {
      avg_manufacturing_va: 0,
      avg_intermediate_goods: 0,
      avg_electronics_centrality: 0,
      country_count: 0
    };
  }
  
  return {
    avg_manufacturing_va: members.reduce((sum, c) => sum + c.manufacturing_va_percent, 0) / members.length,
    avg_intermediate_goods: members.reduce((sum, c) => sum + c.intermediate_goods_share, 0) / members.length,
    avg_electronics_centrality: members.reduce((sum, c) => sum + c.electronics_centrality, 0) / members.length,
    country_count: members.length
  };
}