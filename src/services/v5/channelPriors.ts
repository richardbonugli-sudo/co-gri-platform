/**
 * V5 Channel-Specific Economic Priors
 *
 * Implements the four channel-specific prior tables per V5 methodology:
 *   - Revenue Prior:   GDP^0.25 × HouseholdConsumption^0.35 × SectorDemand^0.30 × MarketAccess^0.10
 *   - Supply Prior:    ManufacturingVA^0.20 × SectorExport^0.30 × AssemblyCapability^0.25 × Logistics^0.10 × IORelevance^0.15
 *   - Assets Prior:    CapitalStock^0.30 × SectorAssetSuitability^0.35 × Infrastructure^0.20 × ResourceFit^0.15
 *   - Financial Prior: FinancialDepth^0.35 × CurrencyExposure^0.30 × CrossBorderCapital^0.20 × FundingHub^0.15
 *
 * CRITICAL: Supply prior HEAVILY suppresses US and Germany for technology hardware.
 * China, Taiwan, Vietnam, South Korea, India must dominate for tech supply chain.
 *
 * All priors are normalized to sum to 1.0 within the admissible set P.
 */

// ============================================================================
// RAW ECONOMIC DATA TABLES
// ============================================================================

/**
 * GDP (2023, trillion USD) — used as base for revenue prior
 */
const GDP_TRILLION: Record<string, number> = {
  'United States': 27.0,
  'China': 17.9,
  'Japan': 4.2,
  'Germany': 4.1,
  'India': 3.7,
  'United Kingdom': 3.1,
  'France': 2.8,
  'Italy': 2.2,
  'Brazil': 2.1,
  'Canada': 2.1,
  'South Korea': 1.7,
  'Australia': 1.7,
  'Spain': 1.4,
  'Mexico': 1.4,
  'Indonesia': 1.3,
  'Netherlands': 1.1,
  'Saudi Arabia': 1.1,
  'Turkey': 1.0,
  'Switzerland': 0.9,
  'Poland': 0.8,
  'Taiwan': 0.8,
  'Belgium': 0.6,
  'Sweden': 0.6,
  'Argentina': 0.6,
  'Ireland': 0.5,
  'Norway': 0.5,
  'Austria': 0.5,
  'Singapore': 0.5,
  'United Arab Emirates': 0.5,
  'Israel': 0.5,
  'Nigeria': 0.5,
  'Thailand': 0.5,
  'Denmark': 0.4,
  'Hong Kong': 0.4,
  'Vietnam': 0.4,
  'Malaysia': 0.4,
  'Philippines': 0.4,
  'Egypt': 0.4,
  'South Africa': 0.4,
  'Chile': 0.3,
  'Colombia': 0.3,
  'Finland': 0.3,
  'Czech Republic': 0.3,
  'Romania': 0.3,
  'Portugal': 0.3,
  'New Zealand': 0.2,
  'Hungary': 0.2,
  'Slovakia': 0.1,
  'Luxembourg': 0.1,
  'Puerto Rico': 0.1,
};

/**
 * Household consumption as share of GDP (proxy for consumer demand)
 */
const HOUSEHOLD_CONSUMPTION_SHARE: Record<string, number> = {
  'United States': 0.68,
  'United Kingdom': 0.65,
  'Japan': 0.55,
  'Germany': 0.52,
  'France': 0.54,
  'China': 0.38,
  'India': 0.57,
  'Brazil': 0.63,
  'Canada': 0.58,
  'South Korea': 0.48,
  'Australia': 0.55,
  'Spain': 0.58,
  'Italy': 0.61,
  'Mexico': 0.67,
  'Indonesia': 0.57,
  'Netherlands': 0.45,
  'Switzerland': 0.54,
  'Sweden': 0.44,
  'Belgium': 0.51,
  'Poland': 0.58,
  'Taiwan': 0.52,
  'Singapore': 0.36,
  'Hong Kong': 0.67,
  'Vietnam': 0.68,
  'Thailand': 0.52,
  'Malaysia': 0.55,
  'Philippines': 0.73,
  'Saudi Arabia': 0.42,
  'Turkey': 0.55,
  'Argentina': 0.65,
  'Chile': 0.62,
  'Colombia': 0.71,
  'Egypt': 0.82,
  'Nigeria': 0.79,
  'South Africa': 0.61,
  'Israel': 0.55,
  'Ireland': 0.34,
  'Norway': 0.42,
  'Denmark': 0.48,
  'Austria': 0.52,
  'Finland': 0.54,
  'Czech Republic': 0.47,
  'Hungary': 0.50,
  'Romania': 0.62,
  'Portugal': 0.65,
  'New Zealand': 0.57,
  'Luxembourg': 0.30,
  'United Arab Emirates': 0.40,
  'Slovakia': 0.55,
  'Puerto Rico': 0.70,
};

/**
 * Sector-specific demand proxies
 * Technology: internet users (millions)
 * Healthcare: healthcare spend per capita (USD)
 * Energy: energy consumption (EJ)
 * Consumer: retail sales index
 * Financial: financial assets/GDP ratio
 */
const SECTOR_DEMAND: Record<string, Record<string, number>> = {
  'Technology': {
    'United States': 310,
    'China': 1050,
    'India': 700,
    'Japan': 100,
    'Germany': 75,
    'United Kingdom': 65,
    'Brazil': 150,
    'France': 55,
    'South Korea': 50,
    'Indonesia': 200,
    'Mexico': 90,
    'Canada': 35,
    'Italy': 45,
    'Spain': 40,
    'Australia': 23,
    'Vietnam': 70,
    'Philippines': 80,
    'Thailand': 55,
    'Malaysia': 30,
    'Taiwan': 22,
    'Singapore': 5,
    'Netherlands': 16,
    'Poland': 30,
    'Turkey': 70,
    'Saudi Arabia': 30,
    'Argentina': 35,
    'Colombia': 30,
    'Egypt': 55,
    'Nigeria': 90,
    'South Africa': 25,
    'Belgium': 10,
    'Sweden': 10,
    'Switzerland': 9,
    'Austria': 8,
    'Norway': 5,
    'Denmark': 5,
    'Israel': 7,
    'Hong Kong': 7,
    'Czech Republic': 9,
    'Hungary': 8,
    'Romania': 14,
    'Portugal': 8,
    'Finland': 5,
    'New Zealand': 4,
    'Ireland': 4,
    'United Arab Emirates': 9,
    'Luxembourg': 1,
    'Slovakia': 4,
    'Puerto Rico': 3,
  },
  'Technology Hardware': {
    'China': 1050,
    'United States': 310,
    'India': 700,
    'Japan': 100,
    'South Korea': 50,
    'Germany': 75,
    'United Kingdom': 65,
    'Brazil': 150,
    'Indonesia': 200,
    'Vietnam': 70,
    'Philippines': 80,
    'Thailand': 55,
    'Malaysia': 30,
    'Taiwan': 22,
    'Mexico': 90,
    'France': 55,
    'Italy': 45,
    'Spain': 40,
    'Australia': 23,
    'Canada': 35,
    'Singapore': 5,
    'Netherlands': 16,
    'Poland': 30,
    'Turkey': 70,
    'Saudi Arabia': 30,
    'Argentina': 35,
    'Colombia': 30,
    'Egypt': 55,
    'Nigeria': 90,
    'South Africa': 25,
  },
  'Healthcare': {
    'United States': 12500,
    'Germany': 7000,
    'Switzerland': 9000,
    'Norway': 7500,
    'Australia': 6000,
    'Canada': 5500,
    'Japan': 4500,
    'United Kingdom': 4500,
    'France': 5000,
    'Sweden': 6000,
    'Netherlands': 5500,
    'Denmark': 6500,
    'Belgium': 5000,
    'Austria': 5500,
    'Ireland': 5000,
    'Finland': 4500,
    'New Zealand': 4000,
    'Italy': 3500,
    'Spain': 3500,
    'South Korea': 3000,
    'Singapore': 3500,
    'Israel': 3000,
    'Czech Republic': 2500,
    'Portugal': 2500,
    'Poland': 2000,
    'Hungary': 2000,
    'Slovakia': 1800,
    'China': 700,
    'Brazil': 1200,
    'Mexico': 1100,
    'Turkey': 1200,
    'Argentina': 1300,
    'Chile': 2000,
    'Colombia': 1000,
    'Saudi Arabia': 1500,
    'United Arab Emirates': 2000,
    'South Africa': 600,
    'India': 200,
    'Indonesia': 150,
    'Vietnam': 180,
    'Thailand': 350,
    'Malaysia': 500,
    'Philippines': 150,
    'Egypt': 200,
    'Nigeria': 80,
    'Romania': 1200,
    'Taiwan': 2000,
    'Hong Kong': 3000,
    'Luxembourg': 7000,
    'Puerto Rico': 4000,
  },
  'Energy': {
    'China': 157,
    'United States': 95,
    'India': 35,
    'Russia': 30,
    'Japan': 18,
    'Germany': 12,
    'South Korea': 12,
    'Canada': 14,
    'Brazil': 14,
    'France': 10,
    'United Kingdom': 8,
    'Italy': 7,
    'Spain': 6,
    'Mexico': 8,
    'Australia': 7,
    'Indonesia': 10,
    'Saudi Arabia': 10,
    'Turkey': 6,
    'Poland': 4,
    'Netherlands': 4,
    'Belgium': 3,
    'Sweden': 3,
    'Taiwan': 5,
    'Thailand': 5,
    'Malaysia': 4,
    'Vietnam': 4,
    'Egypt': 4,
    'South Africa': 5,
    'Nigeria': 3,
    'Argentina': 4,
    'Chile': 2,
    'Colombia': 3,
    'United Arab Emirates': 5,
    'Norway': 2,
    'Finland': 2,
    'Austria': 2,
    'Czech Republic': 2,
    'Romania': 2,
    'Hungary': 1,
    'Portugal': 1,
    'Singapore': 2,
    'Hong Kong': 1,
    'Israel': 1,
    'New Zealand': 1,
    'Switzerland': 1,
    'Denmark': 1,
    'Ireland': 1,
    'Slovakia': 1,
    'Luxembourg': 0.5,
    'Philippines': 3,
    'Puerto Rico': 0.5,
  },
  'Financial Services': {
    'United States': 100,
    'United Kingdom': 60,
    'Japan': 45,
    'China': 50,
    'Germany': 35,
    'France': 30,
    'Switzerland': 55,
    'Hong Kong': 70,
    'Singapore': 65,
    'Luxembourg': 80,
    'Netherlands': 40,
    'Canada': 30,
    'Australia': 30,
    'South Korea': 25,
    'Italy': 20,
    'Spain': 20,
    'Sweden': 25,
    'Belgium': 20,
    'Ireland': 35,
    'Denmark': 25,
    'Norway': 20,
    'Austria': 20,
    'Finland': 15,
    'Brazil': 20,
    'India': 15,
    'Mexico': 12,
    'Taiwan': 25,
    'Israel': 20,
    'United Arab Emirates': 30,
    'Saudi Arabia': 20,
    'South Africa': 15,
    'Turkey': 10,
    'Poland': 10,
    'Czech Republic': 10,
    'Hungary': 8,
    'Romania': 6,
    'Portugal': 10,
    'Slovakia': 6,
    'New Zealand': 15,
    'Chile': 10,
    'Colombia': 8,
    'Argentina': 8,
    'Indonesia': 8,
    'Thailand': 10,
    'Malaysia': 12,
    'Philippines': 6,
    'Vietnam': 5,
    'Egypt': 5,
    'Nigeria': 5,
    'Puerto Rico': 8,
  },
  'Consumer Goods': {
    'United States': 100,
    'China': 90,
    'Japan': 40,
    'Germany': 35,
    'United Kingdom': 35,
    'France': 30,
    'India': 50,
    'Brazil': 40,
    'South Korea': 25,
    'Canada': 20,
    'Australia': 18,
    'Italy': 22,
    'Spain': 20,
    'Mexico': 30,
    'Indonesia': 35,
    'Netherlands': 15,
    'Switzerland': 12,
    'Sweden': 12,
    'Belgium': 10,
    'Poland': 18,
    'Taiwan': 12,
    'Singapore': 8,
    'Hong Kong': 10,
    'Vietnam': 20,
    'Thailand': 18,
    'Malaysia': 14,
    'Philippines': 20,
    'Turkey': 22,
    'Saudi Arabia': 15,
    'United Arab Emirates': 12,
    'Argentina': 18,
    'Chile': 10,
    'Colombia': 15,
    'Egypt': 20,
    'Nigeria': 25,
    'South Africa': 14,
    'Israel': 8,
    'Norway': 8,
    'Denmark': 8,
    'Austria': 8,
    'Finland': 6,
    'Czech Republic': 8,
    'Hungary': 7,
    'Romania': 10,
    'Portugal': 8,
    'New Zealand': 5,
    'Ireland': 5,
    'Luxembourg': 3,
    'Slovakia': 4,
    'Puerto Rico': 5,
  },
};

/**
 * Manufacturing Value Added (billion USD, 2022)
 * CRITICAL for supply chain prior — this is the primary driver
 */
const MANUFACTURING_VA: Record<string, number> = {
  'China': 4900,
  'United States': 2500,
  'Japan': 1000,
  'Germany': 700,
  'South Korea': 450,
  'India': 450,
  'Italy': 280,
  'France': 270,
  'United Kingdom': 250,
  'Taiwan': 320,
  'Mexico': 220,
  'Brazil': 200,
  'Canada': 190,
  'Russia': 250,
  'Indonesia': 230,
  'Thailand': 120,
  'Vietnam': 100,
  'Poland': 90,
  'Netherlands': 80,
  'Spain': 120,
  'Turkey': 130,
  'Australia': 90,
  'Malaysia': 80,
  'Singapore': 50,
  'Czech Republic': 50,
  'Belgium': 60,
  'Sweden': 60,
  'Austria': 55,
  'Switzerland': 70,
  'Philippines': 45,
  'Argentina': 60,
  'Hungary': 35,
  'Romania': 35,
  'Slovakia': 25,
  'Portugal': 25,
  'Finland': 25,
  'Denmark': 25,
  'Norway': 20,
  'Ireland': 60,
  'Israel': 25,
  'Saudi Arabia': 60,
  'United Arab Emirates': 40,
  'South Africa': 40,
  'Egypt': 50,
  'Nigeria': 30,
  'Chile': 20,
  'Colombia': 30,
  'Hong Kong': 5,
  'New Zealand': 15,
  'Luxembourg': 5,
  'Puerto Rico': 15,
};

/**
 * Sector-specific export capability
 * Technology Hardware / Electronics exports (billion USD)
 */
const SECTOR_EXPORT: Record<string, Record<string, number>> = {
  'Technology': {
    'China': 900,
    'Taiwan': 350,
    'South Korea': 280,
    'Japan': 200,
    'Vietnam': 120,
    'Germany': 150,
    'United States': 180,
    'Malaysia': 80,
    'Thailand': 60,
    'Singapore': 100,
    'Mexico': 80,
    'Philippines': 40,
    'India': 30,
    'Netherlands': 40,
    'Czech Republic': 25,
    'Hungary': 20,
    'Poland': 25,
    'Indonesia': 20,
    'Ireland': 30,
    'United Kingdom': 40,
    'France': 35,
    'Italy': 30,
    'Canada': 25,
    'Brazil': 15,
    'Austria': 15,
    'Sweden': 15,
    'Switzerland': 20,
    'Belgium': 15,
    'Finland': 10,
    'Israel': 15,
    'Romania': 10,
    'Slovakia': 15,
    'Portugal': 8,
    'Denmark': 8,
    'Norway': 5,
    'Australia': 8,
    'New Zealand': 3,
    'Argentina': 5,
    'Colombia': 3,
    'Chile': 3,
    'South Africa': 5,
    'Egypt': 3,
    'Nigeria': 2,
    'Turkey': 15,
    'Saudi Arabia': 5,
    'United Arab Emirates': 10,
    'Hong Kong': 50,
    'Luxembourg': 2,
    'Puerto Rico': 5,
  },
  'Technology Hardware': {
    'China': 900,
    'Taiwan': 350,
    'South Korea': 280,
    'Vietnam': 120,
    'Japan': 200,
    'Malaysia': 80,
    'Thailand': 60,
    'Singapore': 100,
    'Philippines': 40,
    'India': 30,
    'Mexico': 80,
    'Germany': 150,
    'United States': 180,
    'Netherlands': 40,
    'Czech Republic': 25,
    'Hungary': 20,
    'Poland': 25,
    'Indonesia': 20,
    'Ireland': 30,
    'United Kingdom': 40,
    'France': 35,
    'Italy': 30,
    'Canada': 25,
    'Brazil': 15,
    'Austria': 15,
    'Sweden': 15,
    'Switzerland': 20,
    'Belgium': 15,
    'Finland': 10,
    'Israel': 15,
    'Romania': 10,
    'Slovakia': 15,
    'Portugal': 8,
    'Denmark': 8,
    'Norway': 5,
    'Australia': 8,
    'Hong Kong': 50,
    'Luxembourg': 2,
    'Puerto Rico': 5,
  },
  'Semiconductor': {
    'Taiwan': 600,
    'South Korea': 500,
    'United States': 300,
    'Japan': 200,
    'China': 150,
    'Netherlands': 80,
    'Germany': 60,
    'Singapore': 50,
    'Malaysia': 40,
    'Ireland': 30,
    'Israel': 20,
    'India': 10,
    'France': 15,
    'United Kingdom': 10,
    'Vietnam': 5,
    'Thailand': 5,
    'Philippines': 5,
    'Czech Republic': 5,
    'Austria': 5,
    'Switzerland': 10,
    'Sweden': 5,
    'Finland': 5,
    'Denmark': 3,
    'Belgium': 8,
    'Italy': 8,
    'Canada': 10,
    'Australia': 3,
    'Brazil': 3,
    'Mexico': 5,
    'Hungary': 5,
    'Romania': 3,
    'Slovakia': 3,
    'Portugal': 3,
    'Norway': 2,
    'New Zealand': 1,
    'Luxembourg': 2,
    'Puerto Rico': 5,
  },
  'Healthcare': {
    'United States': 80,
    'Germany': 70,
    'Switzerland': 90,
    'Ireland': 60,
    'Belgium': 50,
    'Netherlands': 40,
    'France': 35,
    'United Kingdom': 30,
    'India': 25,
    'China': 20,
    'Japan': 25,
    'Denmark': 20,
    'Sweden': 15,
    'Israel': 15,
    'Singapore': 12,
    'Italy': 15,
    'Spain': 12,
    'Canada': 15,
    'Australia': 10,
    'South Korea': 10,
    'Austria': 10,
    'Finland': 8,
    'Czech Republic': 8,
    'Hungary': 8,
    'Poland': 8,
    'Portugal': 5,
    'Slovakia': 5,
    'Romania': 5,
    'Norway': 5,
    'Taiwan': 8,
    'Brazil': 5,
    'Mexico': 5,
    'Argentina': 5,
    'South Africa': 3,
    'Turkey': 5,
    'Saudi Arabia': 3,
    'United Arab Emirates': 3,
    'Vietnam': 3,
    'Thailand': 3,
    'Malaysia': 5,
    'Philippines': 2,
    'Indonesia': 2,
    'Egypt': 2,
    'Nigeria': 1,
    'Chile': 2,
    'Colombia': 2,
    'New Zealand': 3,
    'Luxembourg': 5,
    'Puerto Rico': 20,
    'Hong Kong': 3,
  },
};

/**
 * Assembly capability index (0-10)
 * Reflects ability to do final assembly and complex manufacturing
 */
const ASSEMBLY_CAPABILITY: Record<string, Record<string, number>> = {
  'Technology': {
    'China': 10,
    'Taiwan': 9,
    'South Korea': 8,
    'Japan': 8,
    'Vietnam': 7,
    'Malaysia': 6,
    'Thailand': 6,
    'Singapore': 7,
    'Philippines': 5,
    'India': 6,
    'Mexico': 6,
    'Germany': 7,
    'United States': 7,
    'Czech Republic': 5,
    'Hungary': 5,
    'Poland': 5,
    'Romania': 4,
    'Slovakia': 4,
    'Netherlands': 5,
    'Ireland': 4,
    'United Kingdom': 5,
    'France': 5,
    'Italy': 5,
    'Spain': 4,
    'Canada': 5,
    'Brazil': 4,
    'Australia': 3,
    'Indonesia': 4,
    'Turkey': 4,
    'Austria': 4,
    'Sweden': 4,
    'Switzerland': 5,
    'Belgium': 4,
    'Finland': 4,
    'Denmark': 3,
    'Norway': 3,
    'Israel': 5,
    'Portugal': 3,
    'New Zealand': 2,
    'Argentina': 3,
    'Colombia': 2,
    'Chile': 2,
    'South Africa': 3,
    'Egypt': 2,
    'Nigeria': 1,
    'Saudi Arabia': 2,
    'United Arab Emirates': 3,
    'Hong Kong': 3,
    'Luxembourg': 1,
    'Puerto Rico': 3,
  },
  'Technology Hardware': {
    'China': 10,
    'Vietnam': 8,
    'India': 7,
    'Taiwan': 9,
    'South Korea': 8,
    'Japan': 8,
    'Malaysia': 6,
    'Thailand': 6,
    'Singapore': 7,
    'Philippines': 5,
    'Mexico': 6,
    'Germany': 6,
    'United States': 6,
    'Czech Republic': 5,
    'Hungary': 5,
    'Poland': 5,
    'Romania': 4,
    'Slovakia': 4,
    'Netherlands': 4,
    'Ireland': 3,
    'United Kingdom': 4,
    'France': 4,
    'Italy': 4,
    'Spain': 3,
    'Canada': 4,
    'Brazil': 4,
    'Australia': 2,
    'Indonesia': 4,
    'Turkey': 3,
    'Austria': 3,
    'Sweden': 3,
    'Switzerland': 4,
    'Belgium': 3,
    'Finland': 3,
    'Denmark': 2,
    'Norway': 2,
    'Israel': 4,
    'Portugal': 2,
    'New Zealand': 1,
    'Argentina': 2,
    'Colombia': 1,
    'Chile': 1,
    'South Africa': 2,
    'Egypt': 1,
    'Nigeria': 1,
    'Saudi Arabia': 1,
    'United Arab Emirates': 2,
    'Hong Kong': 2,
    'Luxembourg': 1,
    'Puerto Rico': 2,
  },
};

/**
 * Logistics Performance Index (World Bank, normalized 0-10)
 */
const LOGISTICS_INDEX: Record<string, number> = {
  'Singapore': 9.5,
  'Germany': 9.0,
  'Netherlands': 9.0,
  'Japan': 8.8,
  'Hong Kong': 8.7,
  'Switzerland': 8.5,
  'United Kingdom': 8.5,
  'Denmark': 8.5,
  'Sweden': 8.3,
  'United States': 8.2,
  'Austria': 8.2,
  'Belgium': 8.0,
  'Finland': 8.0,
  'Canada': 7.8,
  'Australia': 7.8,
  'France': 7.7,
  'South Korea': 7.7,
  'Taiwan': 7.5,
  'Norway': 7.5,
  'Ireland': 7.5,
  'Luxembourg': 7.5,
  'New Zealand': 7.3,
  'Czech Republic': 7.2,
  'Poland': 7.0,
  'Spain': 7.0,
  'Italy': 6.8,
  'China': 7.5,
  'Malaysia': 7.2,
  'Israel': 7.0,
  'United Arab Emirates': 7.5,
  'Portugal': 6.8,
  'Hungary': 6.7,
  'Slovakia': 6.5,
  'Romania': 6.3,
  'Vietnam': 6.5,
  'Thailand': 6.8,
  'India': 6.0,
  'Mexico': 6.2,
  'Brazil': 5.8,
  'Turkey': 6.0,
  'Saudi Arabia': 6.5,
  'South Africa': 5.8,
  'Indonesia': 5.5,
  'Philippines': 5.5,
  'Egypt': 5.0,
  'Argentina': 5.3,
  'Chile': 6.0,
  'Colombia': 5.5,
  'Nigeria': 4.5,
  'Puerto Rico': 7.0,
};

/**
 * Financial depth index (capital markets + banking depth, normalized 0-10)
 */
const FINANCIAL_DEPTH: Record<string, number> = {
  'United States': 10.0,
  'United Kingdom': 9.0,
  'Switzerland': 9.5,
  'Luxembourg': 9.5,
  'Hong Kong': 9.2,
  'Singapore': 9.0,
  'Japan': 8.5,
  'Germany': 8.0,
  'France': 7.8,
  'Netherlands': 8.0,
  'Ireland': 8.5,
  'Canada': 7.5,
  'Australia': 7.5,
  'Sweden': 7.5,
  'Denmark': 7.5,
  'Norway': 7.0,
  'Belgium': 7.5,
  'Austria': 7.0,
  'Finland': 7.0,
  'Israel': 7.0,
  'South Korea': 7.0,
  'Taiwan': 7.0,
  'Spain': 6.5,
  'Italy': 6.5,
  'China': 6.5,
  'Brazil': 6.0,
  'India': 5.5,
  'Mexico': 5.5,
  'South Africa': 6.0,
  'United Arab Emirates': 7.0,
  'Saudi Arabia': 6.5,
  'Turkey': 5.5,
  'Poland': 6.0,
  'Czech Republic': 6.0,
  'Hungary': 5.5,
  'Romania': 5.0,
  'Slovakia': 5.0,
  'Portugal': 6.0,
  'New Zealand': 7.0,
  'Chile': 6.0,
  'Colombia': 5.0,
  'Argentina': 4.5,
  'Indonesia': 5.0,
  'Thailand': 5.5,
  'Malaysia': 6.5,
  'Philippines': 4.5,
  'Vietnam': 4.0,
  'Egypt': 4.0,
  'Nigeria': 4.0,
  'Puerto Rico': 6.0,
};

/**
 * Currency exposure weight (importance in global debt markets)
 */
const CURRENCY_EXPOSURE: Record<string, number> = {
  'United States': 10.0,   // USD dominant
  'Germany': 6.5,          // EUR major
  'France': 5.5,           // EUR major
  'Japan': 7.0,            // JPY
  'United Kingdom': 7.5,   // GBP
  'Switzerland': 6.5,      // CHF
  'China': 4.5,            // CNY growing
  'Netherlands': 5.0,      // EUR
  'Belgium': 4.5,          // EUR
  'Italy': 4.0,            // EUR
  'Spain': 4.0,            // EUR
  'Luxembourg': 6.0,       // EUR financial center
  'Ireland': 5.5,          // EUR financial center
  'Canada': 5.5,           // CAD
  'Australia': 5.0,        // AUD
  'South Korea': 4.0,      // KRW
  'Sweden': 4.5,           // SEK
  'Norway': 4.0,           // NOK
  'Denmark': 4.0,          // DKK
  'Singapore': 5.5,        // SGD
  'Hong Kong': 5.5,        // HKD
  'Taiwan': 4.0,           // TWD
  'Brazil': 3.5,           // BRL
  'India': 3.5,            // INR
  'Mexico': 3.5,           // MXN
  'South Africa': 3.0,     // ZAR
  'Turkey': 2.5,           // TRY
  'Poland': 3.5,           // PLN
  'Czech Republic': 3.0,   // CZK
  'Hungary': 2.5,          // HUF
  'Romania': 2.5,          // RON
  'Slovakia': 3.5,         // EUR
  'Portugal': 3.5,         // EUR
  'Austria': 4.5,          // EUR
  'Finland': 4.0,          // EUR
  'New Zealand': 4.0,      // NZD
  'Israel': 3.5,           // ILS
  'United Arab Emirates': 4.5, // AED
  'Saudi Arabia': 4.0,     // SAR
  'Indonesia': 3.0,        // IDR
  'Thailand': 3.0,         // THB
  'Malaysia': 3.5,         // MYR
  'Philippines': 2.5,      // PHP
  'Vietnam': 2.0,          // VND
  'Egypt': 2.0,            // EGP
  'Nigeria': 2.0,          // NGN
  'Argentina': 2.0,        // ARS
  'Chile': 3.0,            // CLP
  'Colombia': 2.5,         // COP
  'Puerto Rico': 5.0,      // USD
};

/**
 * Cross-border capital flows index (normalized 0-10)
 */
const CROSS_BORDER_CAPITAL: Record<string, number> = {
  'Luxembourg': 10.0,
  'Ireland': 9.5,
  'Singapore': 9.5,
  'Hong Kong': 9.5,
  'Switzerland': 9.0,
  'Netherlands': 9.0,
  'United Kingdom': 9.0,
  'United States': 8.5,
  'Germany': 8.0,
  'France': 7.5,
  'Belgium': 8.0,
  'Japan': 7.5,
  'Canada': 7.5,
  'Australia': 7.5,
  'Sweden': 7.5,
  'Denmark': 7.5,
  'Norway': 7.0,
  'Austria': 7.5,
  'Finland': 7.0,
  'New Zealand': 7.0,
  'Israel': 7.0,
  'United Arab Emirates': 8.0,
  'South Korea': 6.5,
  'Taiwan': 6.5,
  'Spain': 6.5,
  'Italy': 6.0,
  'China': 5.5,
  'Brazil': 5.5,
  'India': 5.0,
  'Mexico': 5.5,
  'South Africa': 5.5,
  'Saudi Arabia': 6.0,
  'Turkey': 5.0,
  'Poland': 6.0,
  'Czech Republic': 6.0,
  'Hungary': 5.5,
  'Romania': 5.0,
  'Slovakia': 5.5,
  'Portugal': 6.0,
  'Chile': 5.5,
  'Colombia': 4.5,
  'Argentina': 3.5,
  'Indonesia': 4.5,
  'Thailand': 5.0,
  'Malaysia': 6.0,
  'Philippines': 4.0,
  'Vietnam': 4.0,
  'Egypt': 3.5,
  'Nigeria': 3.5,
  'Puerto Rico': 7.0,
};

/**
 * Funding hub status (0-10): major centers for corporate debt issuance
 */
const FUNDING_HUB: Record<string, number> = {
  'United States': 10.0,
  'United Kingdom': 9.0,
  'Luxembourg': 9.5,
  'Ireland': 9.0,
  'Netherlands': 8.5,
  'Switzerland': 8.5,
  'Germany': 8.0,
  'France': 7.5,
  'Japan': 7.5,
  'Singapore': 8.0,
  'Hong Kong': 8.0,
  'Canada': 7.0,
  'Australia': 7.0,
  'Sweden': 6.5,
  'Denmark': 6.5,
  'Norway': 6.0,
  'Belgium': 7.0,
  'Austria': 6.5,
  'Finland': 6.0,
  'Spain': 6.0,
  'Italy': 5.5,
  'South Korea': 6.0,
  'Taiwan': 5.5,
  'China': 5.0,
  'Brazil': 5.0,
  'India': 4.5,
  'Mexico': 5.0,
  'South Africa': 5.0,
  'United Arab Emirates': 7.0,
  'Saudi Arabia': 5.5,
  'Turkey': 4.5,
  'Poland': 5.5,
  'Czech Republic': 5.0,
  'Hungary': 4.5,
  'Romania': 4.0,
  'Slovakia': 4.5,
  'Portugal': 5.0,
  'New Zealand': 5.5,
  'Israel': 5.5,
  'Chile': 4.5,
  'Colombia': 4.0,
  'Argentina': 3.0,
  'Indonesia': 4.0,
  'Thailand': 4.5,
  'Malaysia': 5.5,
  'Philippines': 3.5,
  'Vietnam': 3.0,
  'Egypt': 3.0,
  'Nigeria': 3.0,
  'Puerto Rico': 6.0,
};

/**
 * Capital stock index (physical capital intensity, normalized 0-10)
 */
const CAPITAL_STOCK: Record<string, number> = {
  'United States': 10.0,
  'China': 9.5,
  'Japan': 8.5,
  'Germany': 8.0,
  'United Kingdom': 7.5,
  'France': 7.5,
  'Canada': 7.5,
  'Italy': 7.0,
  'South Korea': 7.0,
  'Australia': 7.0,
  'Spain': 6.5,
  'Brazil': 6.5,
  'India': 6.0,
  'Mexico': 6.0,
  'Russia': 7.0,
  'Netherlands': 7.0,
  'Switzerland': 7.0,
  'Sweden': 7.0,
  'Belgium': 6.5,
  'Austria': 6.5,
  'Norway': 7.0,
  'Denmark': 6.5,
  'Finland': 6.5,
  'Taiwan': 7.0,
  'Singapore': 7.0,
  'Hong Kong': 6.5,
  'Ireland': 6.5,
  'Luxembourg': 6.0,
  'Poland': 6.0,
  'Czech Republic': 6.0,
  'Hungary': 5.5,
  'Romania': 5.0,
  'Slovakia': 5.5,
  'Portugal': 5.5,
  'New Zealand': 6.0,
  'Israel': 6.5,
  'United Arab Emirates': 7.0,
  'Saudi Arabia': 7.0,
  'Turkey': 6.0,
  'Indonesia': 5.5,
  'Thailand': 5.5,
  'Malaysia': 6.0,
  'Philippines': 4.5,
  'Vietnam': 5.0,
  'Egypt': 4.5,
  'Nigeria': 4.0,
  'Argentina': 5.5,
  'Chile': 5.5,
  'Colombia': 5.0,
  'South Africa': 5.5,
  'Puerto Rico': 6.0,
};

/**
 * Infrastructure quality index (World Bank, normalized 0-10)
 */
const INFRASTRUCTURE: Record<string, number> = {
  'Singapore': 9.8,
  'Japan': 9.5,
  'Germany': 9.2,
  'Netherlands': 9.2,
  'Switzerland': 9.0,
  'United Kingdom': 8.8,
  'Denmark': 8.8,
  'Sweden': 8.7,
  'United States': 8.5,
  'Austria': 8.5,
  'Belgium': 8.3,
  'Finland': 8.3,
  'France': 8.2,
  'Canada': 8.0,
  'Australia': 8.0,
  'Norway': 8.0,
  'Luxembourg': 8.5,
  'New Zealand': 7.8,
  'South Korea': 8.0,
  'Taiwan': 7.8,
  'Hong Kong': 9.0,
  'Ireland': 7.8,
  'Spain': 7.5,
  'Italy': 7.2,
  'Czech Republic': 7.5,
  'Poland': 7.2,
  'Portugal': 7.3,
  'Hungary': 7.0,
  'Slovakia': 7.0,
  'Romania': 6.5,
  'Israel': 7.5,
  'United Arab Emirates': 8.5,
  'Saudi Arabia': 7.5,
  'China': 7.5,
  'Malaysia': 7.2,
  'Thailand': 6.8,
  'Mexico': 6.5,
  'Brazil': 6.0,
  'Turkey': 6.5,
  'South Africa': 6.0,
  'India': 5.5,
  'Indonesia': 5.5,
  'Vietnam': 5.5,
  'Philippines': 5.0,
  'Egypt': 5.0,
  'Argentina': 5.5,
  'Chile': 6.5,
  'Colombia': 5.5,
  'Nigeria': 3.5,
  'Puerto Rico': 7.0,
};

// ============================================================================
// PRIOR CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get the sector demand value for a country and sector
 */
function getSectorDemand(country: string, sector: string): number {
  const sectorKey = normalizeSectorKey(sector);
  const sectorData = SECTOR_DEMAND[sectorKey] || SECTOR_DEMAND['Technology'];
  return sectorData[country] || 1.0;
}

/**
 * Get sector export value
 */
function getSectorExport(country: string, sector: string): number {
  const sectorKey = normalizeSectorKey(sector);
  const sectorData = SECTOR_EXPORT[sectorKey] || SECTOR_EXPORT['Technology'];
  return sectorData[country] || 1.0;
}

/**
 * Get assembly capability
 */
function getAssemblyCapability(country: string, sector: string): number {
  const sectorKey = normalizeSectorKey(sector);
  const sectorData = ASSEMBLY_CAPABILITY[sectorKey] || ASSEMBLY_CAPABILITY['Technology'];
  return sectorData[country] || 2.0;
}

/**
 * Normalize sector key for lookup
 *
 * FIX 4: Extended mappings so Manufacturing, Telecommunications and Retail
 * no longer fall through to the 'Technology' default.
 *   'Manufacturing'     → 'Technology Hardware'  (best proxy for heavy-industry supply chain)
 *   'Telecommunications'→ 'Technology'           (closest demand/supply profile)
 *   'Retail'            → 'Consumer Goods'        (demand-side match)
 */
export function normalizeSectorKey(sector: string): string {
  const lower = sector.toLowerCase();
  // P2-3 FIX: semiconductor/chip/fab tickers → 'Semiconductor' prior (not Technology Hardware)
  if (lower.includes('semiconductor') || lower.includes('chip') || lower.includes('fab')) {
    return 'Semiconductor';
  }
  if (lower.includes('hardware') || lower.includes('electronics')) {
    return 'Technology Hardware';
  }
  if (lower.includes('manufactur')) {
    return 'Technology Hardware'; // FIX 4: Manufacturing → Technology Hardware (supply-chain proxy)
  }
  if (lower.includes('tech') || lower.includes('software') || lower.includes('internet') ||
      lower.includes('telecom') || lower.includes('telecommun')) {
    // FIX 4: Telecommunications → Technology (closest demand/supply profile)
    return 'Technology';
  }
  if (lower.includes('health') || lower.includes('pharma') || lower.includes('biotech')) {
    return 'Healthcare';
  }
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('gas')) {
    return 'Energy';
  }
  if (lower.includes('financ') || lower.includes('bank') || lower.includes('insurance')) {
    return 'Financial Services';
  }
  if (lower.includes('consumer') || lower.includes('retail')) {
    // FIX 4: Retail → Consumer Goods (demand-side match)
    return 'Consumer Goods';
  }
  return 'Technology'; // default
}

/**
 * Power function with safety for zero/negative values
 */
function safePow(base: number, exp: number): number {
  if (base <= 0) return 0.001;
  return Math.pow(base, exp);
}

// ============================================================================
// REVENUE PRIOR
// ============================================================================

/**
 * Revenue Prior per V5 methodology:
 * RevenuePrior(c, sector) ∝ GDP(c)^0.25 × HouseholdConsumption(c)^0.35 × SectorDemand(c,sector)^0.30 × MarketAccess(c,sector)^0.10
 *
 * MarketAccess is approximated by logistics index (proxy for ease of market entry)
 */
export function getRevenuePrior(country: string, sector: string): number {
  const gdp = GDP_TRILLION[country] || 0.1;
  const hc = HOUSEHOLD_CONSUMPTION_SHARE[country] || 0.5;
  const sd = getSectorDemand(country, sector);
  const ma = (LOGISTICS_INDEX[country] || 5.0) / 10.0; // normalize to 0-1

  // Normalize sector demand to 0-1 range (max ~1050 for China tech)
  const sdNorm = sd / 1100.0;

  return (
    safePow(gdp, 0.25) *
    safePow(hc, 0.35) *
    safePow(sdNorm + 0.01, 0.30) *
    safePow(ma, 0.10)
  );
}

// ============================================================================
// SUPPLY CHAIN PRIOR
// ============================================================================

/**
 * Supply Chain Prior per V5 methodology:
 * SupplyPrior(c, sector) ∝ ManufacturingVA(c)^0.20 × SectorExport(c,sector)^0.30 × AssemblyCapability(c,sector)^0.25 × Logistics(c)^0.10 × IORelevance(c,sector)^0.15
 *
 * CRITICAL: This prior HEAVILY suppresses US and Germany for technology hardware.
 * China, Taiwan, Vietnam, South Korea, India must dominate for tech supply chain.
 *
 * IORelevance is approximated by sector export (already sector-specific)
 */
export function getSupplyPrior(country: string, sector: string): number {
  const mva = MANUFACTURING_VA[country] || 5.0;
  const se = getSectorExport(country, sector);
  const ac = getAssemblyCapability(country, sector);
  const lpi = (LOGISTICS_INDEX[country] || 5.0) / 10.0;

  // Normalize to 0-1 ranges
  const mvaNorm = mva / 5000.0;
  const seNorm = se / 1000.0;
  const acNorm = ac / 10.0;
  const ioNorm = seNorm; // IO relevance proxied by sector export

  return (
    safePow(mvaNorm + 0.001, 0.20) *
    safePow(seNorm + 0.001, 0.30) *
    safePow(acNorm + 0.001, 0.25) *
    safePow(lpi, 0.10) *
    safePow(ioNorm + 0.001, 0.15)
  );
}

// ============================================================================
// PHYSICAL ASSETS PRIOR
// ============================================================================

/**
 * Physical Assets Prior per V5 methodology:
 * AssetPrior(c, sector) ∝ CapitalStock(c)^0.30 × SectorAssetSuitability(c,sector)^0.35 × Infrastructure(c)^0.20 × ResourceFit(c,sector)^0.15
 *
 * SectorAssetSuitability: for tech = data center suitability (energy + connectivity)
 * ResourceFit: for tech = talent availability (proxied by GDP per capita)
 */
export function getAssetsPrior(country: string, sector: string): number {
  const cs = (CAPITAL_STOCK[country] || 5.0) / 10.0;
  const infra = (INFRASTRUCTURE[country] || 5.0) / 10.0;

  // Sector asset suitability: use sector export as proxy for sector presence
  const se = getSectorExport(country, sector);
  const seNorm = se / 1000.0;

  // Resource fit: GDP per capita proxy (GDP / estimated population)
  const gdp = GDP_TRILLION[country] || 0.1;
  const resourceFit = Math.min(gdp / 30.0, 1.0); // normalize, cap at 1.0

  return (
    safePow(cs, 0.30) *
    safePow(seNorm + 0.01, 0.35) *
    safePow(infra, 0.20) *
    safePow(resourceFit + 0.01, 0.15)
  );
}

// ============================================================================
// FINANCIAL PRIOR
// ============================================================================

/**
 * Financial Prior per V5 methodology:
 * FinancialPrior(c, sector) ∝ FinancialDepth(c)^0.35 × CurrencyExposure(c)^0.30 × CrossBorderCapital(c)^0.20 × FundingHub(c)^0.15
 *
 * Financial centers (US, UK, Switzerland, Hong Kong, Singapore, Luxembourg) score highest.
 */
export function getFinancialPrior(country: string, _sector: string): number {
  const fd = (FINANCIAL_DEPTH[country] || 4.0) / 10.0;
  const ce = (CURRENCY_EXPOSURE[country] || 2.0) / 10.0;
  const cbc = (CROSS_BORDER_CAPITAL[country] || 4.0) / 10.0;
  const fh = (FUNDING_HUB[country] || 4.0) / 10.0;

  return (
    safePow(fd, 0.35) *
    safePow(ce, 0.30) *
    safePow(cbc, 0.20) *
    safePow(fh, 0.15)
  );
}

// ============================================================================
// NORMALIZED PRIOR ALLOCATION
// ============================================================================

export type ChannelType = 'revenue' | 'supply' | 'assets' | 'financial';

/**
 * Get the raw prior weight for a country/channel/sector combination
 */
export function getRawPrior(country: string, channel: ChannelType, sector: string): number {
  switch (channel) {
    case 'revenue':
      return getRevenuePrior(country, sector);
    case 'supply':
      return getSupplyPrior(country, sector);
    case 'assets':
      return getAssetsPrior(country, sector);
    case 'financial':
      return getFinancialPrior(country, sector);
    default:
      return getRevenuePrior(country, sector);
  }
}

/**
 * Allocate weights within an admissible set P using channel-specific priors.
 * Returns normalized weights that sum to 1.0 within P.
 *
 * @param admissibleSet - Countries eligible for allocation (P)
 * @param channel - Channel type
 * @param sector - Company sector
 * @param totalWeight - Total weight to allocate (default 1.0)
 * @returns Record<country, weight> normalized to totalWeight
 */
export function allocateWithPrior(
  admissibleSet: string[],
  channel: ChannelType,
  sector: string,
  totalWeight: number = 1.0
): Record<string, number> {
  if (admissibleSet.length === 0) return {};

  const rawWeights: Record<string, number> = {};
  let sum = 0;

  for (const country of admissibleSet) {
    const w = Math.max(getRawPrior(country, channel, sector), 1e-6);
    rawWeights[country] = w;
    sum += w;
  }

  if (sum <= 0) {
    // Uniform fallback
    const uniform = totalWeight / admissibleSet.length;
    const result: Record<string, number> = {};
    for (const c of admissibleSet) result[c] = uniform;
    return result;
  }

  const result: Record<string, number> = {};
  for (const country of admissibleSet) {
    result[country] = (rawWeights[country] / sum) * totalWeight;
  }
  return result;
}

/**
 * V5 GF formula: p_c = λ * HomeBias(c) + (1 - λ) * GlobalPrior_channel_sector(c)
 *
 * HOME_BIAS_LAMBDA per channel:
 *   revenue:   0.25
 *   supply:    0.10
 *   assets:    0.35
 *   financial: 0.30
 */
export const HOME_BIAS_LAMBDA: Record<ChannelType, number> = {
  revenue: 0.25,
  supply: 0.10,
  assets: 0.35,
  financial: 0.30,
};

/**
 * Apply V5 GF formula for a single country
 */
export function applyGFV5(
  country: string,
  homeCountry: string,
  channel: ChannelType,
  sector: string,
  globalPriorNormalized: number
): number {
  const lambda = HOME_BIAS_LAMBDA[channel] ?? 0.25;
  const homeBias = country === homeCountry ? 1.0 : 0.0;
  return lambda * homeBias + (1 - lambda) * globalPriorNormalized;
}

/**
 * Build a full global fallback distribution using V5 GF formula.
 * Returns normalized weights summing to 1.0.
 *
 * @param homeCountry - Company's home country
 * @param channel - Channel type
 * @param sector - Company sector
 * @param universe - Countries to include (defaults to all countries in priors)
 */
export function buildGlobalFallbackV5(
  homeCountry: string,
  channel: ChannelType,
  sector: string,
  universe?: string[]
): Record<string, number> {
  const countries = universe || Object.keys(GDP_TRILLION);

  // First compute raw global priors (without home bias)
  const rawPriors: Record<string, number> = {};
  let priorSum = 0;
  for (const c of countries) {
    const p = Math.max(getRawPrior(c, channel, sector), 1e-6);
    rawPriors[c] = p;
    priorSum += p;
  }

  // Normalize global priors
  const normalizedPriors: Record<string, number> = {};
  for (const c of countries) {
    normalizedPriors[c] = rawPriors[c] / priorSum;
  }

  // Apply GF formula
  const lambda = HOME_BIAS_LAMBDA[channel] ?? 0.25;
  const gfWeights: Record<string, number> = {};
  let gfSum = 0;

  for (const c of countries) {
    const homeBias = c === homeCountry ? 1.0 : 0.0;
    const w = lambda * homeBias + (1 - lambda) * normalizedPriors[c];
    gfWeights[c] = w;
    gfSum += w;
  }

  // Normalize to sum to 1.0
  const result: Record<string, number> = {};
  for (const c of countries) {
    result[c] = gfWeights[c] / gfSum;
  }
  return result;
}

// Export all raw data for use in other modules
export {
  GDP_TRILLION,
  MANUFACTURING_VA,
  FINANCIAL_DEPTH,
  LOGISTICS_INDEX,
  INFRASTRUCTURE,
  CAPITAL_STOCK,
  CURRENCY_EXPOSURE,
  CROSS_BORDER_CAPITAL,
  FUNDING_HUB,
};