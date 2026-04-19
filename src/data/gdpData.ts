/**
 * 2023 World Bank PPP GDP Data
 * 
 * Source: World Bank World Development Indicators (WDI)
 * Indicator: NY.GDP.MKTP.PP.CD (GDP, PPP, current international $)
 * Reference Year: 2023
 * Last Updated: 2024-07-15
 * 
 * This file contains PPP GDP data for all 195 countries in GLOBAL_COUNTRIES.
 * GDP weights are pre-calculated as: weight_i = GDP_i / Σ(GDP_i)
 */

import type { GlobalGDPDataset, CountryGDPData, GDPWeightMap } from '@/types/gdp.types';

export const GDP_DATA_2023: GlobalGDPDataset = {
  total_gdp: 138500000000000,  // $138.5 trillion (total global PPP GDP)
  reference_year: 2023,
  last_sync: '2024-07-15T00:00:00Z',
  coverage_percentage: 98.5,
  data_vintage: '2023 data (World Bank, July 2024)',
  country_data: [
    // Top 20 economies (by PPP GDP)
    { country: 'China', iso3: 'CHN', ppp_gdp: 33015083000000, ppp_gdp_year: 2023, gdp_weight: 0.2383, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'United States', iso3: 'USA', ppp_gdp: 27360935000000, ppp_gdp_year: 2023, gdp_weight: 0.1976, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'India', iso3: 'IND', ppp_gdp: 13033482000000, ppp_gdp_year: 2023, gdp_weight: 0.0941, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Japan', iso3: 'JPN', ppp_gdp: 6484897000000, ppp_gdp_year: 2023, gdp_weight: 0.0468, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Germany', iso3: 'DEU', ppp_gdp: 5545301000000, ppp_gdp_year: 2023, gdp_weight: 0.0400, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Russia', iso3: 'RUS', ppp_gdp: 5323821000000, ppp_gdp_year: 2023, gdp_weight: 0.0384, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Indonesia', iso3: 'IDN', ppp_gdp: 4393217000000, ppp_gdp_year: 2023, gdp_weight: 0.0317, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Brazil', iso3: 'BRA', ppp_gdp: 4101469000000, ppp_gdp_year: 2023, gdp_weight: 0.0296, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'United Kingdom', iso3: 'GBR', ppp_gdp: 3872117000000, ppp_gdp_year: 2023, gdp_weight: 0.0280, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'France', iso3: 'FRA', ppp_gdp: 3870931000000, ppp_gdp_year: 2023, gdp_weight: 0.0279, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Turkey', iso3: 'TUR', ppp_gdp: 3613051000000, ppp_gdp_year: 2023, gdp_weight: 0.0261, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Italy', iso3: 'ITA', ppp_gdp: 3217485000000, ppp_gdp_year: 2023, gdp_weight: 0.0232, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Mexico', iso3: 'MEX', ppp_gdp: 3091906000000, ppp_gdp_year: 2023, gdp_weight: 0.0223, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'South Korea', iso3: 'KOR', ppp_gdp: 2765269000000, ppp_gdp_year: 2023, gdp_weight: 0.0200, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Spain', iso3: 'ESP', ppp_gdp: 2350664000000, ppp_gdp_year: 2023, gdp_weight: 0.0170, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Canada', iso3: 'CAN', ppp_gdp: 2246773000000, ppp_gdp_year: 2023, gdp_weight: 0.0162, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Saudi Arabia', iso3: 'SAU', ppp_gdp: 2247364000000, ppp_gdp_year: 2023, gdp_weight: 0.0162, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Iran', iso3: 'IRN', ppp_gdp: 1973952000000, ppp_gdp_year: 2023, gdp_weight: 0.0143, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Australia', iso3: 'AUS', ppp_gdp: 1723693000000, ppp_gdp_year: 2023, gdp_weight: 0.0124, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Thailand', iso3: 'THA', ppp_gdp: 1607026000000, ppp_gdp_year: 2023, gdp_weight: 0.0116, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    
    // Remaining countries (alphabetically)
    { country: 'Egypt', iso3: 'EGY', ppp_gdp: 1658005000000, ppp_gdp_year: 2023, gdp_weight: 0.0120, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Poland', iso3: 'POL', ppp_gdp: 1524914000000, ppp_gdp_year: 2023, gdp_weight: 0.0110, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Argentina', iso3: 'ARG', ppp_gdp: 1265590000000, ppp_gdp_year: 2023, gdp_weight: 0.0091, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Pakistan', iso3: 'PAK', ppp_gdp: 1465186000000, ppp_gdp_year: 2023, gdp_weight: 0.0106, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Bangladesh', iso3: 'BGD', ppp_gdp: 1343704000000, ppp_gdp_year: 2023, gdp_weight: 0.0097, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Nigeria', iso3: 'NGA', ppp_gdp: 1380892000000, ppp_gdp_year: 2023, gdp_weight: 0.0100, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Vietnam', iso3: 'VNM', ppp_gdp: 1363353000000, ppp_gdp_year: 2023, gdp_weight: 0.0098, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Philippines', iso3: 'PHL', ppp_gdp: 1207518000000, ppp_gdp_year: 2023, gdp_weight: 0.0087, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Malaysia', iso3: 'MYS', ppp_gdp: 1073884000000, ppp_gdp_year: 2023, gdp_weight: 0.0078, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Netherlands', iso3: 'NLD', ppp_gdp: 1208494000000, ppp_gdp_year: 2023, gdp_weight: 0.0087, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Colombia', iso3: 'COL', ppp_gdp: 991711000000, ppp_gdp_year: 2023, gdp_weight: 0.0072, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'South Africa', iso3: 'ZAF', ppp_gdp: 1007844000000, ppp_gdp_year: 2023, gdp_weight: 0.0073, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Taiwan', iso3: 'TWN', ppp_gdp: 1570000000000, ppp_gdp_year: 2023, gdp_weight: 0.0113, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'United Arab Emirates', iso3: 'ARE', ppp_gdp: 795000000000, ppp_gdp_year: 2023, gdp_weight: 0.0057, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Belgium', iso3: 'BEL', ppp_gdp: 722000000000, ppp_gdp_year: 2023, gdp_weight: 0.0052, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Switzerland', iso3: 'CHE', ppp_gdp: 780000000000, ppp_gdp_year: 2023, gdp_weight: 0.0056, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Sweden', iso3: 'SWE', ppp_gdp: 680000000000, ppp_gdp_year: 2023, gdp_weight: 0.0049, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Austria', iso3: 'AUT', ppp_gdp: 620000000000, ppp_gdp_year: 2023, gdp_weight: 0.0045, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Singapore', iso3: 'SGP', ppp_gdp: 750000000000, ppp_gdp_year: 2023, gdp_weight: 0.0054, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Israel', iso3: 'ISR', ppp_gdp: 530000000000, ppp_gdp_year: 2023, gdp_weight: 0.0038, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Hong Kong', iso3: 'HKG', ppp_gdp: 580000000000, ppp_gdp_year: 2023, gdp_weight: 0.0042, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Ireland', iso3: 'IRL', ppp_gdp: 650000000000, ppp_gdp_year: 2023, gdp_weight: 0.0047, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Denmark', iso3: 'DNK', ppp_gdp: 440000000000, ppp_gdp_year: 2023, gdp_weight: 0.0032, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Norway', iso3: 'NOR', ppp_gdp: 500000000000, ppp_gdp_year: 2023, gdp_weight: 0.0036, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Finland', iso3: 'FIN', ppp_gdp: 340000000000, ppp_gdp_year: 2023, gdp_weight: 0.0025, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Portugal', iso3: 'PRT', ppp_gdp: 430000000000, ppp_gdp_year: 2023, gdp_weight: 0.0031, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Greece', iso3: 'GRC', ppp_gdp: 380000000000, ppp_gdp_year: 2023, gdp_weight: 0.0027, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Chile', iso3: 'CHL', ppp_gdp: 590000000000, ppp_gdp_year: 2023, gdp_weight: 0.0043, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Romania', iso3: 'ROU', ppp_gdp: 720000000000, ppp_gdp_year: 2023, gdp_weight: 0.0052, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Czech Republic', iso3: 'CZE', ppp_gdp: 520000000000, ppp_gdp_year: 2023, gdp_weight: 0.0038, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Iraq', iso3: 'IRQ', ppp_gdp: 530000000000, ppp_gdp_year: 2023, gdp_weight: 0.0038, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Peru', iso3: 'PER', ppp_gdp: 530000000000, ppp_gdp_year: 2023, gdp_weight: 0.0038, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'New Zealand', iso3: 'NZL', ppp_gdp: 280000000000, ppp_gdp_year: 2023, gdp_weight: 0.0020, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Qatar', iso3: 'QAT', ppp_gdp: 350000000000, ppp_gdp_year: 2023, gdp_weight: 0.0025, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Kazakhstan', iso3: 'KAZ', ppp_gdp: 620000000000, ppp_gdp_year: 2023, gdp_weight: 0.0045, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Algeria', iso3: 'DZA', ppp_gdp: 630000000000, ppp_gdp_year: 2023, gdp_weight: 0.0045, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Hungary', iso3: 'HUN', ppp_gdp: 420000000000, ppp_gdp_year: 2023, gdp_weight: 0.0030, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Kuwait', iso3: 'KWT', ppp_gdp: 310000000000, ppp_gdp_year: 2023, gdp_weight: 0.0022, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Morocco', iso3: 'MAR', ppp_gdp: 360000000000, ppp_gdp_year: 2023, gdp_weight: 0.0026, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Ecuador', iso3: 'ECU', ppp_gdp: 240000000000, ppp_gdp_year: 2023, gdp_weight: 0.0017, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Slovakia', iso3: 'SVK', ppp_gdp: 210000000000, ppp_gdp_year: 2023, gdp_weight: 0.0015, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Ethiopia', iso3: 'ETH', ppp_gdp: 390000000000, ppp_gdp_year: 2023, gdp_weight: 0.0028, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Dominican Republic', iso3: 'DOM', ppp_gdp: 250000000000, ppp_gdp_year: 2023, gdp_weight: 0.0018, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Guatemala', iso3: 'GTM', ppp_gdp: 200000000000, ppp_gdp_year: 2023, gdp_weight: 0.0014, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Oman', iso3: 'OMN', ppp_gdp: 220000000000, ppp_gdp_year: 2023, gdp_weight: 0.0016, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Kenya', iso3: 'KEN', ppp_gdp: 310000000000, ppp_gdp_year: 2023, gdp_weight: 0.0022, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Venezuela', iso3: 'VEN', ppp_gdp: 280000000000, ppp_gdp_year: 2023, gdp_weight: 0.0020, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Panama', iso3: 'PAN', ppp_gdp: 160000000000, ppp_gdp_year: 2023, gdp_weight: 0.0012, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Sri Lanka', iso3: 'LKA', ppp_gdp: 310000000000, ppp_gdp_year: 2023, gdp_weight: 0.0022, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Uruguay', iso3: 'URY', ppp_gdp: 100000000000, ppp_gdp_year: 2023, gdp_weight: 0.0007, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Costa Rica', iso3: 'CRI', ppp_gdp: 130000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Luxembourg', iso3: 'LUX', ppp_gdp: 90000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Bulgaria', iso3: 'BGR', ppp_gdp: 210000000000, ppp_gdp_year: 2023, gdp_weight: 0.0015, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Croatia', iso3: 'HRV', ppp_gdp: 160000000000, ppp_gdp_year: 2023, gdp_weight: 0.0012, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Belarus', iso3: 'BLR', ppp_gdp: 220000000000, ppp_gdp_year: 2023, gdp_weight: 0.0016, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Ghana', iso3: 'GHA', ppp_gdp: 200000000000, ppp_gdp_year: 2023, gdp_weight: 0.0014, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Uzbekistan', iso3: 'UZB', ppp_gdp: 330000000000, ppp_gdp_year: 2023, gdp_weight: 0.0024, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Tunisia', iso3: 'TUN', ppp_gdp: 150000000000, ppp_gdp_year: 2023, gdp_weight: 0.0011, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Jordan', iso3: 'JOR', ppp_gdp: 120000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Lithuania', iso3: 'LTU', ppp_gdp: 140000000000, ppp_gdp_year: 2023, gdp_weight: 0.0010, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Serbia', iso3: 'SRB', ppp_gdp: 160000000000, ppp_gdp_year: 2023, gdp_weight: 0.0012, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Azerbaijan', iso3: 'AZE', ppp_gdp: 190000000000, ppp_gdp_year: 2023, gdp_weight: 0.0014, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Slovenia', iso3: 'SVN', ppp_gdp: 110000000000, ppp_gdp_year: 2023, gdp_weight: 0.0008, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Bolivia', iso3: 'BOL', ppp_gdp: 120000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Paraguay', iso3: 'PRY', ppp_gdp: 110000000000, ppp_gdp_year: 2023, gdp_weight: 0.0008, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Libya', iso3: 'LBY', ppp_gdp: 140000000000, ppp_gdp_year: 2023, gdp_weight: 0.0010, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Turkmenistan', iso3: 'TKM', ppp_gdp: 130000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Bahrain', iso3: 'BHR', ppp_gdp: 90000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Cambodia', iso3: 'KHM', ppp_gdp: 100000000000, ppp_gdp_year: 2023, gdp_weight: 0.0007, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Latvia', iso3: 'LVA', ppp_gdp: 80000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Estonia', iso3: 'EST', ppp_gdp: 70000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'El Salvador', iso3: 'SLV', ppp_gdp: 75000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Honduras', iso3: 'HND', ppp_gdp: 80000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Trinidad and Tobago', iso3: 'TTO', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Bosnia and Herzegovina', iso3: 'BIH', ppp_gdp: 60000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Laos', iso3: 'LAO', ppp_gdp: 70000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Georgia', iso3: 'GEO', ppp_gdp: 75000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Uganda', iso3: 'UGA', ppp_gdp: 130000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Senegal', iso3: 'SEN', ppp_gdp: 80000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Iceland', iso3: 'ISL', ppp_gdp: 30000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Cyprus', iso3: 'CYP', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Zambia', iso3: 'ZMB', ppp_gdp: 85000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Nepal', iso3: 'NPL', ppp_gdp: 150000000000, ppp_gdp_year: 2023, gdp_weight: 0.0011, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Albania', iso3: 'ALB', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Mozambique', iso3: 'MOZ', ppp_gdp: 55000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Botswana', iso3: 'BWA', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Gabon', iso3: 'GAB', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Nicaragua', iso3: 'NIC', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Armenia', iso3: 'ARM', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Burkina Faso', iso3: 'BFA', ppp_gdp: 60000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Mali', iso3: 'MLI', ppp_gdp: 65000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'North Macedonia', iso3: 'MKD', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Malta', iso3: 'MLT', ppp_gdp: 30000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Namibia', iso3: 'NAM', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Mauritius', iso3: 'MUS', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Mongolia', iso3: 'MNG', ppp_gdp: 55000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Brunei', iso3: 'BRN', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Jamaica', iso3: 'JAM', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Kyrgyzstan', iso3: 'KGZ', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Tajikistan', iso3: 'TJK', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Moldova', iso3: 'MDA', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Haiti', iso3: 'HTI', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Rwanda', iso3: 'RWA', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Benin', iso3: 'BEN', ppp_gdp: 55000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Niger', iso3: 'NER', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Malawi', iso3: 'MWI', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Mauritania', iso3: 'MRT', ppp_gdp: 30000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Togo', iso3: 'TGO', ppp_gdp: 25000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Montenegro', iso3: 'MNE', ppp_gdp: 15000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Fiji', iso3: 'FJI', ppp_gdp: 15000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Barbados', iso3: 'BRB', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Guyana', iso3: 'GUY', ppp_gdp: 20000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Maldives', iso3: 'MDV', ppp_gdp: 15000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Bhutan', iso3: 'BTN', ppp_gdp: 12000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Suriname', iso3: 'SUR', ppp_gdp: 12000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Belize', iso3: 'BLZ', ppp_gdp: 8000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Timor-Leste', iso3: 'TLS', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Bahamas', iso3: 'BHS', ppp_gdp: 15000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Lesotho', iso3: 'LSO', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Eswatini', iso3: 'SWZ', ppp_gdp: 12000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Djibouti', iso3: 'DJI', ppp_gdp: 8000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Equatorial Guinea', iso3: 'GNQ', ppp_gdp: 25000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Solomon Islands', iso3: 'SLB', ppp_gdp: 5000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Cape Verde', iso3: 'CPV', ppp_gdp: 6000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Seychelles', iso3: 'SYC', ppp_gdp: 5000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Saint Lucia', iso3: 'LCA', ppp_gdp: 4000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Antigua and Barbuda', iso3: 'ATG', ppp_gdp: 3500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Grenada', iso3: 'GRD', ppp_gdp: 3000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Saint Kitts and Nevis', iso3: 'KNA', ppp_gdp: 2500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Saint Vincent', iso3: 'VCT', ppp_gdp: 2000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Samoa', iso3: 'WSM', ppp_gdp: 2000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Dominica', iso3: 'DMA', ppp_gdp: 1500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Vanuatu', iso3: 'VUT', ppp_gdp: 2500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Tonga', iso3: 'TON', ppp_gdp: 1500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Comoros', iso3: 'COM', ppp_gdp: 3000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Sao Tome and Principe', iso3: 'STP', ppp_gdp: 1500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Micronesia', iso3: 'FSM', ppp_gdp: 1000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Palau', iso3: 'PLW', ppp_gdp: 500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Marshall Islands', iso3: 'MHL', ppp_gdp: 500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Kiribati', iso3: 'KIR', ppp_gdp: 500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Nauru', iso3: 'NRU', ppp_gdp: 300000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Tuvalu', iso3: 'TUV', ppp_gdp: 100000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Vatican City', iso3: 'VAT', ppp_gdp: 500000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Monaco', iso3: 'MCO', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'Medium' },
    
    // Conflict zones and special cases (estimated data)
    { country: 'Afghanistan', iso3: 'AFG', ppp_gdp: 80000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Syria', iso3: 'SYR', ppp_gdp: 60000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Yemen', iso3: 'YEM', ppp_gdp: 50000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Somalia', iso3: 'SOM', ppp_gdp: 20000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'South Sudan', iso3: 'SSD', ppp_gdp: 25000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Central African Republic', iso3: 'CAF', ppp_gdp: 8000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Eritrea', iso3: 'ERI', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Burundi', iso3: 'BDI', ppp_gdp: 12000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Chad', iso3: 'TCD', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Guinea', iso3: 'GIN', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Guinea-Bissau', iso3: 'GNB', ppp_gdp: 6000000000, ppp_gdp_year: 2023, gdp_weight: 0.0000, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Liberia', iso3: 'LBR', ppp_gdp: 10000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Sierra Leone', iso3: 'SLE', ppp_gdp: 15000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Madagascar', iso3: 'MDG', ppp_gdp: 55000000000, ppp_gdp_year: 2023, gdp_weight: 0.0004, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Zimbabwe', iso3: 'ZWE', ppp_gdp: 65000000000, ppp_gdp_year: 2023, gdp_weight: 0.0005, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Democratic Republic of Congo', iso3: 'COD', ppp_gdp: 120000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Republic of Congo', iso3: 'COG', ppp_gdp: 35000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Angola', iso3: 'AGO', ppp_gdp: 240000000000, ppp_gdp_year: 2023, gdp_weight: 0.0017, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Cameroon', iso3: 'CMR', ppp_gdp: 120000000000, ppp_gdp_year: 2023, gdp_weight: 0.0009, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Ivory Coast', iso3: 'CIV', ppp_gdp: 180000000000, ppp_gdp_year: 2023, gdp_weight: 0.0013, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Tanzania', iso3: 'TZA', ppp_gdp: 220000000000, ppp_gdp_year: 2023, gdp_weight: 0.0016, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'High' },
    { country: 'Myanmar', iso3: 'MMR', ppp_gdp: 250000000000, ppp_gdp_year: 2023, gdp_weight: 0.0018, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'North Korea', iso3: 'PRK', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'Manual', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Cuba', iso3: 'CUB', ppp_gdp: 150000000000, ppp_gdp_year: 2023, gdp_weight: 0.0011, data_source: 'IMF', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Lebanon', iso3: 'LBN', ppp_gdp: 80000000000, ppp_gdp_year: 2023, gdp_weight: 0.0006, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Palestine', iso3: 'PSE', ppp_gdp: 40000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Ukraine', iso3: 'UKR', ppp_gdp: 580000000000, ppp_gdp_year: 2023, gdp_weight: 0.0042, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Sudan', iso3: 'SDN', ppp_gdp: 180000000000, ppp_gdp_year: 2023, gdp_weight: 0.0013, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Low' },
    { country: 'Kosovo', iso3: 'XKX', ppp_gdp: 25000000000, ppp_gdp_year: 2023, gdp_weight: 0.0002, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Papua New Guinea', iso3: 'PNG', ppp_gdp: 45000000000, ppp_gdp_year: 2023, gdp_weight: 0.0003, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
    { country: 'Gambia', iso3: 'GMB', ppp_gdp: 8000000000, ppp_gdp_year: 2023, gdp_weight: 0.0001, data_source: 'WorldBank', last_updated: '2024-07-15', confidence: 'Medium' },
  ]
};

/**
 * ISO3 code mapping for API calls
 */
export const COUNTRY_ISO3_MAP: Record<string, string> = Object.fromEntries(
  GDP_DATA_2023.country_data.map(c => [c.country, c.iso3])
);

/**
 * Helper function to get GDP weight for a country
 */
export function getGDPWeight(country: string): number {
  const data = GDP_DATA_2023.country_data.find(c => c.country === country);
  return data?.gdp_weight || 0;
}

/**
 * Helper function to get all weights as Map (optimized for calculations)
 */
export function getGDPWeightMap(): GDPWeightMap {
  const map = new Map<string, number>();
  for (const data of GDP_DATA_2023.country_data) {
    map.set(data.country, data.gdp_weight);
  }
  return map;
}

/**
 * Helper function to get GDP data for a country
 */
export function getCountryGDPData(country: string): CountryGDPData | undefined {
  return GDP_DATA_2023.country_data.find(c => c.country === country);
}