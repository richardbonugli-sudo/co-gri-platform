/**
 * Financial Hub Rankings Data
 * Source: Global Financial Centers Index (GFCI), BIS, World Bank
 * Metrics: GFCI rank, banking assets, capital market depth, currency importance
 * 
 * Data represents financial system sophistication and global financial integration.
 * Year: 2023-2024 (GFCI 34 & 35)
 */

import { FinancialHubData } from './types';

export const financialHubsData: FinancialHubData[] = [
  // Top 10 Global Financial Centers
  {
    country: "United States",
    country_code: "US",
    gfci_rank: 1,
    banking_assets_usd: 23800000000000,
    capital_market_depth: 100,
    currency_importance: 100,
    is_major_hub: true,
    source: "GFCI 35, BIS, World Bank",
    year: 2024
  },
  {
    country: "United Kingdom",
    country_code: "GB",
    gfci_rank: 2,
    banking_assets_usd: 11500000000000,
    capital_market_depth: 95,
    currency_importance: 85,
    is_major_hub: true,
    source: "GFCI 35, BIS, World Bank",
    year: 2024
  },
  {
    country: "Singapore",
    country_code: "SG",
    gfci_rank: 3,
    banking_assets_usd: 2800000000000,
    capital_market_depth: 88,
    currency_importance: 65,
    is_major_hub: true,
    source: "GFCI 35, BIS, MAS",
    year: 2024
  },
  {
    country: "Hong Kong",
    country_code: "HK",
    gfci_rank: 4,
    banking_assets_usd: 3200000000000,
    capital_market_depth: 90,
    currency_importance: 70,
    is_major_hub: true,
    source: "GFCI 35, BIS, HKMA",
    year: 2024
  },
  {
    country: "Switzerland",
    country_code: "CH",
    gfci_rank: 5,
    banking_assets_usd: 5400000000000,
    capital_market_depth: 92,
    currency_importance: 75,
    is_major_hub: true,
    source: "GFCI 35, BIS, SNB",
    year: 2024
  },
  {
    country: "China",
    country_code: "CN",
    gfci_rank: 6,
    banking_assets_usd: 52000000000000,
    capital_market_depth: 82,
    currency_importance: 80,
    is_major_hub: true,
    source: "GFCI 35, BIS, PBOC",
    year: 2024
  },
  {
    country: "Japan",
    country_code: "JP",
    gfci_rank: 7,
    banking_assets_usd: 18500000000000,
    capital_market_depth: 85,
    currency_importance: 78,
    is_major_hub: true,
    source: "GFCI 35, BIS, BOJ",
    year: 2024
  },
  {
    country: "Germany",
    country_code: "DE",
    gfci_rank: 8,
    banking_assets_usd: 9200000000000,
    capital_market_depth: 80,
    currency_importance: 72,
    is_major_hub: true,
    source: "GFCI 35, BIS, Bundesbank",
    year: 2024
  },
  {
    country: "France",
    country_code: "FR",
    gfci_rank: 9,
    banking_assets_usd: 8900000000000,
    capital_market_depth: 78,
    currency_importance: 68,
    is_major_hub: true,
    source: "GFCI 35, BIS, Banque de France",
    year: 2024
  },
  {
    country: "Netherlands",
    country_code: "NL",
    gfci_rank: 10,
    banking_assets_usd: 3800000000000,
    capital_market_depth: 82,
    currency_importance: 65,
    is_major_hub: true,
    source: "GFCI 35, BIS, DNB",
    year: 2024
  },
  
  // Ranks 11-20
  {
    country: "South Korea",
    country_code: "KR",
    gfci_rank: 11,
    banking_assets_usd: 4200000000000,
    capital_market_depth: 75,
    currency_importance: 58,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOK",
    year: 2024
  },
  {
    country: "Australia",
    country_code: "AU",
    gfci_rank: 12,
    banking_assets_usd: 4800000000000,
    capital_market_depth: 76,
    currency_importance: 62,
    is_major_hub: false,
    source: "GFCI 35, BIS, RBA",
    year: 2024
  },
  {
    country: "Canada",
    country_code: "CA",
    gfci_rank: 13,
    banking_assets_usd: 5200000000000,
    capital_market_depth: 74,
    currency_importance: 60,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOC",
    year: 2024
  },
  {
    country: "Luxembourg",
    country_code: "LU",
    gfci_rank: 14,
    banking_assets_usd: 1200000000000,
    capital_market_depth: 85,
    currency_importance: 55,
    is_major_hub: false,
    source: "GFCI 35, BIS, BCL",
    year: 2024
  },
  {
    country: "United Arab Emirates",
    country_code: "AE",
    gfci_rank: 15,
    banking_assets_usd: 1100000000000,
    capital_market_depth: 68,
    currency_importance: 52,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBUAE",
    year: 2024
  },
  {
    country: "Ireland",
    country_code: "IE",
    gfci_rank: 16,
    banking_assets_usd: 1800000000000,
    capital_market_depth: 72,
    currency_importance: 50,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBI",
    year: 2024
  },
  {
    country: "Sweden",
    country_code: "SE",
    gfci_rank: 17,
    banking_assets_usd: 1500000000000,
    capital_market_depth: 70,
    currency_importance: 48,
    is_major_hub: false,
    source: "GFCI 35, BIS, Riksbank",
    year: 2024
  },
  {
    country: "Belgium",
    country_code: "BE",
    gfci_rank: 18,
    banking_assets_usd: 1400000000000,
    capital_market_depth: 68,
    currency_importance: 46,
    is_major_hub: false,
    source: "GFCI 35, BIS, NBB",
    year: 2024
  },
  {
    country: "Spain",
    country_code: "ES",
    gfci_rank: 19,
    banking_assets_usd: 3600000000000,
    capital_market_depth: 65,
    currency_importance: 48,
    is_major_hub: false,
    source: "GFCI 35, BIS, Banco de España",
    year: 2024
  },
  {
    country: "Italy",
    country_code: "IT",
    gfci_rank: 20,
    banking_assets_usd: 3200000000000,
    capital_market_depth: 62,
    currency_importance: 45,
    is_major_hub: false,
    source: "GFCI 35, BIS, Banca d'Italia",
    year: 2024
  },
  
  // Ranks 21-30
  {
    country: "Denmark",
    country_code: "DK",
    gfci_rank: 21,
    banking_assets_usd: 950000000000,
    capital_market_depth: 68,
    currency_importance: 42,
    is_major_hub: false,
    source: "GFCI 35, BIS, Danmarks Nationalbank",
    year: 2024
  },
  {
    country: "Norway",
    country_code: "NO",
    gfci_rank: 22,
    banking_assets_usd: 780000000000,
    capital_market_depth: 66,
    currency_importance: 40,
    is_major_hub: false,
    source: "GFCI 35, BIS, Norges Bank",
    year: 2024
  },
  {
    country: "Austria",
    country_code: "AT",
    gfci_rank: 23,
    banking_assets_usd: 1100000000000,
    capital_market_depth: 64,
    currency_importance: 38,
    is_major_hub: false,
    source: "GFCI 35, BIS, OeNB",
    year: 2024
  },
  {
    country: "Taiwan",
    country_code: "TW",
    gfci_rank: 24,
    banking_assets_usd: 3400000000000,
    capital_market_depth: 70,
    currency_importance: 45,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBC Taiwan",
    year: 2024
  },
  {
    country: "Israel",
    country_code: "IL",
    gfci_rank: 25,
    banking_assets_usd: 520000000000,
    capital_market_depth: 62,
    currency_importance: 35,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOI",
    year: 2024
  },
  {
    country: "New Zealand",
    country_code: "NZ",
    gfci_rank: 26,
    banking_assets_usd: 480000000000,
    capital_market_depth: 60,
    currency_importance: 38,
    is_major_hub: false,
    source: "GFCI 35, BIS, RBNZ",
    year: 2024
  },
  {
    country: "Qatar",
    country_code: "QA",
    gfci_rank: 27,
    banking_assets_usd: 420000000000,
    capital_market_depth: 55,
    currency_importance: 32,
    is_major_hub: false,
    source: "GFCI 35, BIS, QCB",
    year: 2024
  },
  {
    country: "Saudi Arabia",
    country_code: "SA",
    gfci_rank: 28,
    banking_assets_usd: 850000000000,
    capital_market_depth: 58,
    currency_importance: 36,
    is_major_hub: false,
    source: "GFCI 35, BIS, SAMA",
    year: 2024
  },
  {
    country: "Finland",
    country_code: "FI",
    gfci_rank: 29,
    banking_assets_usd: 620000000000,
    capital_market_depth: 58,
    currency_importance: 34,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOF",
    year: 2024
  },
  {
    country: "Poland",
    country_code: "PL",
    gfci_rank: 30,
    banking_assets_usd: 680000000000,
    capital_market_depth: 52,
    currency_importance: 32,
    is_major_hub: false,
    source: "GFCI 35, BIS, NBP",
    year: 2024
  },
  
  // Ranks 31-40
  {
    country: "Malaysia",
    country_code: "MY",
    gfci_rank: 31,
    banking_assets_usd: 720000000000,
    capital_market_depth: 56,
    currency_importance: 35,
    is_major_hub: false,
    source: "GFCI 35, BIS, BNM",
    year: 2024
  },
  {
    country: "Thailand",
    country_code: "TH",
    gfci_rank: 32,
    banking_assets_usd: 860000000000,
    capital_market_depth: 54,
    currency_importance: 33,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOT",
    year: 2024
  },
  {
    country: "Czech Republic",
    country_code: "CZ",
    gfci_rank: 33,
    banking_assets_usd: 320000000000,
    capital_market_depth: 50,
    currency_importance: 28,
    is_major_hub: false,
    source: "GFCI 35, BIS, CNB",
    year: 2024
  },
  {
    country: "Portugal",
    country_code: "PT",
    gfci_rank: 34,
    banking_assets_usd: 480000000000,
    capital_market_depth: 48,
    currency_importance: 30,
    is_major_hub: false,
    source: "GFCI 35, BIS, Banco de Portugal",
    year: 2024
  },
  {
    country: "Greece",
    country_code: "GR",
    gfci_rank: 35,
    banking_assets_usd: 380000000000,
    capital_market_depth: 45,
    currency_importance: 28,
    is_major_hub: false,
    source: "GFCI 35, BIS, BOG",
    year: 2024
  },
  {
    country: "India",
    country_code: "IN",
    gfci_rank: 36,
    banking_assets_usd: 3100000000000,
    capital_market_depth: 58,
    currency_importance: 42,
    is_major_hub: false,
    source: "GFCI 35, BIS, RBI",
    year: 2024
  },
  {
    country: "Turkey",
    country_code: "TR",
    gfci_rank: 37,
    banking_assets_usd: 920000000000,
    capital_market_depth: 48,
    currency_importance: 30,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBRT",
    year: 2024
  },
  {
    country: "South Africa",
    country_code: "ZA",
    gfci_rank: 38,
    banking_assets_usd: 520000000000,
    capital_market_depth: 52,
    currency_importance: 32,
    is_major_hub: false,
    source: "GFCI 35, BIS, SARB",
    year: 2024
  },
  {
    country: "Chile",
    country_code: "CL",
    gfci_rank: 39,
    banking_assets_usd: 380000000000,
    capital_market_depth: 48,
    currency_importance: 28,
    is_major_hub: false,
    source: "GFCI 35, BIS, BCCh",
    year: 2024
  },
  {
    country: "Hungary",
    country_code: "HU",
    gfci_rank: 40,
    banking_assets_usd: 180000000000,
    capital_market_depth: 42,
    currency_importance: 25,
    is_major_hub: false,
    source: "GFCI 35, BIS, MNB",
    year: 2024
  },
  
  // Ranks 41-50
  {
    country: "Philippines",
    country_code: "PH",
    gfci_rank: 41,
    banking_assets_usd: 420000000000,
    capital_market_depth: 45,
    currency_importance: 28,
    is_major_hub: false,
    source: "GFCI 35, BIS, BSP",
    year: 2024
  },
  {
    country: "Indonesia",
    country_code: "ID",
    gfci_rank: 42,
    banking_assets_usd: 780000000000,
    capital_market_depth: 46,
    currency_importance: 30,
    is_major_hub: false,
    source: "GFCI 35, BIS, BI",
    year: 2024
  },
  {
    country: "Mexico",
    country_code: "MX",
    gfci_rank: 43,
    banking_assets_usd: 820000000000,
    capital_market_depth: 48,
    currency_importance: 32,
    is_major_hub: false,
    source: "GFCI 35, BIS, Banxico",
    year: 2024
  },
  {
    country: "Brazil",
    country_code: "BR",
    gfci_rank: 44,
    banking_assets_usd: 2400000000000,
    capital_market_depth: 50,
    currency_importance: 35,
    is_major_hub: false,
    source: "GFCI 35, BIS, BCB",
    year: 2024
  },
  {
    country: "Russia",
    country_code: "RU",
    gfci_rank: 45,
    banking_assets_usd: 1800000000000,
    capital_market_depth: 42,
    currency_importance: 28,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBR",
    year: 2024
  },
  {
    country: "Colombia",
    country_code: "CO",
    gfci_rank: 46,
    banking_assets_usd: 280000000000,
    capital_market_depth: 40,
    currency_importance: 24,
    is_major_hub: false,
    source: "GFCI 35, BIS, Banco de la República",
    year: 2024
  },
  {
    country: "Argentina",
    country_code: "AR",
    gfci_rank: 47,
    banking_assets_usd: 320000000000,
    capital_market_depth: 38,
    currency_importance: 22,
    is_major_hub: false,
    source: "GFCI 35, BIS, BCRA",
    year: 2024
  },
  {
    country: "Egypt",
    country_code: "EG",
    gfci_rank: 48,
    banking_assets_usd: 380000000000,
    capital_market_depth: 36,
    currency_importance: 20,
    is_major_hub: false,
    source: "GFCI 35, BIS, CBE",
    year: 2024
  },
  {
    country: "Morocco",
    country_code: "MA",
    gfci_rank: 49,
    banking_assets_usd: 180000000000,
    capital_market_depth: 34,
    currency_importance: 18,
    is_major_hub: false,
    source: "GFCI 35, BIS, BAM",
    year: 2024
  },
  {
    country: "Vietnam",
    country_code: "VN",
    gfci_rank: 50,
    banking_assets_usd: 680000000000,
    capital_market_depth: 40,
    currency_importance: 25,
    is_major_hub: false,
    source: "GFCI 35, BIS, SBV",
    year: 2024
  },
];

/**
 * Helper function to get financial hub data by country code
 */
export function getFinancialHubByCode(countryCode: string): FinancialHubData | undefined {
  return financialHubsData.find(c => c.country_code === countryCode);
}

/**
 * Helper function to get financial hub data by country name
 */
export function getFinancialHubByName(countryName: string): FinancialHubData | undefined {
  return financialHubsData.find(c => c.country.toLowerCase() === countryName.toLowerCase());
}

/**
 * Get top N financial centers by GFCI rank
 */
export function getTopFinancialCenters(n: number): FinancialHubData[] {
  return [...financialHubsData]
    .sort((a, b) => a.gfci_rank - b.gfci_rank)
    .slice(0, n);
}

/**
 * Get major financial hubs (top 10)
 */
export function getMajorFinancialHubs(): FinancialHubData[] {
  return financialHubsData.filter(c => c.is_major_hub);
}

/**
 * Check if a country is a financial hub
 */
export function isFinancialHub(countryCode: string): boolean {
  return financialHubsData.some(c => c.country_code === countryCode);
}

/**
 * Get financial hubs by region (based on country code patterns)
 */
export function getRegionalFinancialHubs(region: 'Asia' | 'Europe' | 'Americas' | 'Middle East' | 'Africa'): FinancialHubData[] {
  const regionMap: { [key: string]: string[] } = {
    'Asia': ['CN', 'JP', 'KR', 'SG', 'HK', 'TW', 'IN', 'MY', 'TH', 'PH', 'ID', 'VN'],
    'Europe': ['GB', 'CH', 'DE', 'FR', 'NL', 'LU', 'IE', 'SE', 'BE', 'ES', 'IT', 'DK', 'NO', 'AT', 'FI', 'PL', 'CZ', 'PT', 'GR', 'HU'],
    'Americas': ['US', 'CA', 'MX', 'BR', 'CL', 'CO', 'AR'],
    'Middle East': ['AE', 'QA', 'SA', 'IL', 'TR'],
    'Africa': ['ZA', 'EG', 'MA']
  };
  
  const countryCodes = regionMap[region] || [];
  return financialHubsData.filter(c => countryCodes.includes(c.country_code));
}

/**
 * Calculate financial importance score (composite metric)
 */
export function calculateFinancialImportance(countryCode: string): number {
  const hub = getFinancialHubByCode(countryCode);
  if (!hub) return 0;
  
  // Weighted composite: 30% rank, 30% capital market depth, 40% currency importance
  const rankScore = (51 - hub.gfci_rank) / 50 * 100; // Invert rank (1 = highest)
  const compositeScore = (rankScore * 0.3) + (hub.capital_market_depth * 0.3) + (hub.currency_importance * 0.4);
  
  return Math.round(compositeScore * 100) / 100;
}

/**
 * Get financial hubs with banking assets above threshold
 */
export function getLargeBankingCenters(minAssetsUSD: number): FinancialHubData[] {
  return financialHubsData.filter(c => c.banking_assets_usd >= minAssetsUSD);
}

/**
 * Get average metrics by region
 */
export function getRegionalFinancialMetrics(region: 'Asia' | 'Europe' | 'Americas' | 'Middle East' | 'Africa'): {
  avg_capital_market_depth: number;
  avg_currency_importance: number;
  total_banking_assets: number;
  hub_count: number;
} {
  const hubs = getRegionalFinancialHubs(region);
  
  if (hubs.length === 0) {
    return {
      avg_capital_market_depth: 0,
      avg_currency_importance: 0,
      total_banking_assets: 0,
      hub_count: 0
    };
  }
  
  return {
    avg_capital_market_depth: hubs.reduce((sum, h) => sum + h.capital_market_depth, 0) / hubs.length,
    avg_currency_importance: hubs.reduce((sum, h) => sum + h.currency_importance, 0) / hubs.length,
    total_banking_assets: hubs.reduce((sum, h) => sum + h.banking_assets_usd, 0),
    hub_count: hubs.length
  };
}