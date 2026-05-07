/**
 * Gurus Forecast Adapter Service
 * 
 * Converts 16 Gurus forecast data (country deltas) into Scenario Analysis format.
 * Bridges the gap between Strategic Forecast Baseline and Scenario Analysis methodologies.
 * 
 * @module gurusForecastAdapter
 */

import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import type { CountryAdjustment, GeopoliticalEvent } from '@/types/forecast';

/**
 * Forecast-based scenario shock data
 */
export interface ForecastScenarioShock {
  country: string;
  countryCode: string;
  baseShock: number;
  delta: number;
  drivers: string[];
  outlook: string;
  riskTrend: string;
  expectedReturn: number;
  applicableEvents: GeopoliticalEvent[];
}

/**
 * Forecast metadata for UI display
 */
export interface ForecastMetadata {
  forecastYear: string;
  expertSources: number;
  overallConfidence: number;
  countryCoverage: number;
  majorEvents: number;
  lastUpdated: string;
  reportUrl: string;
}

/**
 * Convert forecast delta to scenario shock value
 * 
 * Forecast deltas range from -8 to +8.5 (CSI point changes)
 * Scenario shocks range from 0 to 25 (base impact values)
 * 
 * Formula: shock = |delta| * 2.5
 * 
 * @param delta - Forecast delta value
 * @returns Scenario shock value (0-25 range)
 */
export function forecastDeltaToShock(delta: number): number {
  // Take absolute value and scale by 2.5
  // This converts forecast deltas to scenario shock scale
  const shock = Math.abs(delta) * 2.5;
  
  // Clamp to reasonable range for "expected path" scenarios
  // Max 25 (high impact but not extreme stress)
  return Math.min(25, Math.max(0, shock));
}

/**
 * Load all forecast data and convert to scenario format
 * 
 * @param forecastYear - Year of forecast to load (default: '2026')
 * @returns Array of forecast-based scenario shocks for all countries
 */
export function loadForecastScenarios(forecastYear: string = '2026'): ForecastScenarioShock[] {
  const forecast = loadCedarOwlForecast(forecastYear);
  const scenarios: ForecastScenarioShock[] = [];
  
  // Convert each country adjustment to scenario shock
  for (const [countryCode, adjustment] of Object.entries(forecast.countryAdjustments)) {
    const baseShock = forecastDeltaToShock(adjustment.delta);
    
    // Get applicable geopolitical events for this country
    const applicableEvents = forecast.geopoliticalEvents.filter(event =>
      event.affectedCountries.includes(countryCode)
    );
    
    scenarios.push({
      country: getCountryName(countryCode),
      countryCode,
      baseShock,
      delta: adjustment.delta,
      drivers: adjustment.drivers,
      outlook: adjustment.outlook,
      riskTrend: adjustment.riskTrend,
      expectedReturn: adjustment.expectedReturn,
      applicableEvents
    });
  }
  
  return scenarios;
}

/**
 * Get forecast metadata for UI display
 * 
 * @param forecastYear - Year of forecast (default: '2026')
 * @returns Forecast metadata object
 */
export function getForecastMetadata(forecastYear: string = '2026'): ForecastMetadata {
  const forecast = loadCedarOwlForecast(forecastYear);
  
  return {
    forecastYear: forecast.forecastYear,
    expertSources: 16, // 16 Gurus
    overallConfidence: forecast.overallConfidence,
    countryCoverage: Object.keys(forecast.countryAdjustments).length,
    majorEvents: forecast.geopoliticalEvents.length,
    lastUpdated: forecast.lastUpdated,
    reportUrl: 'https://geopolitical-16gurus-jan2026.atoms.world/'
  };
}

/**
 * Get forecast shock for a specific country
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param forecastYear - Year of forecast (default: '2026')
 * @returns Forecast scenario shock or null if not available
 */
export function getForecastShockForCountry(
  countryCode: string,
  forecastYear: string = '2026'
): ForecastScenarioShock | null {
  const scenarios = loadForecastScenarios(forecastYear);
  return scenarios.find(s => s.countryCode === countryCode) || null;
}

/**
 * Get all countries with forecast data
 * 
 * @param forecastYear - Year of forecast (default: '2026')
 * @returns Array of country codes with forecast data
 */
export function getForecastCountries(forecastYear: string = '2026'): string[] {
  const forecast = loadCedarOwlForecast(forecastYear);
  return Object.keys(forecast.countryAdjustments);
}

/**
 * Check if forecast data is available for a country
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param forecastYear - Year of forecast (default: '2026')
 * @returns True if forecast data exists
 */
export function hasForecastData(
  countryCode: string,
  forecastYear: string = '2026'
): boolean {
  const forecast = loadCedarOwlForecast(forecastYear);
  return countryCode in forecast.countryAdjustments;
}

/**
 * Get geopolitical events affecting a specific country
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param forecastYear - Year of forecast (default: '2026')
 * @returns Array of applicable geopolitical events
 */
export function getEventsForCountry(
  countryCode: string,
  forecastYear: string = '2026'
): GeopoliticalEvent[] {
  const forecast = loadCedarOwlForecast(forecastYear);
  return forecast.geopoliticalEvents.filter(event =>
    event.affectedCountries.includes(countryCode)
  );
}

/**
 * Country code to name mapping
 * Maps ISO 3166-1 alpha-2 codes to full country names
 */
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'US': 'United States',
  'CN': 'China',
  'JP': 'Japan',
  'DE': 'Germany',
  'GB': 'United Kingdom',
  'IN': 'India',
  'FR': 'France',
  'IT': 'Italy',
  'BR': 'Brazil',
  'CA': 'Canada',
  'KR': 'South Korea',
  'RU': 'Russia',
  'ES': 'Spain',
  'AU': 'Australia',
  'MX': 'Mexico',
  'ID': 'Indonesia',
  'NL': 'Netherlands',
  'SA': 'Saudi Arabia',
  'TR': 'Turkey',
  'CH': 'Switzerland',
  'PL': 'Poland',
  'BE': 'Belgium',
  'AR': 'Argentina',
  'SE': 'Sweden',
  'IE': 'Ireland',
  'IL': 'Israel',
  'NO': 'Norway',
  'AT': 'Austria',
  'AE': 'United Arab Emirates',
  'SG': 'Singapore',
  'BD': 'Bangladesh',
  'VN': 'Vietnam',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'DK': 'Denmark',
  'CO': 'Colombia',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'HK': 'Hong Kong',
  'CL': 'Chile',
  'FI': 'Finland',
  'RO': 'Romania',
  'CZ': 'Czech Republic',
  'PT': 'Portugal',
  'IQ': 'Iraq',
  'NZ': 'New Zealand',
  'PE': 'Peru',
  'GR': 'Greece',
  'QA': 'Qatar',
  'KZ': 'Kazakhstan',
  'KW': 'Kuwait',
  'MA': 'Morocco',
  'HU': 'Hungary',
  'ET': 'Ethiopia',
  'EC': 'Ecuador',
  'SK': 'Slovakia',
  'DO': 'Dominican Republic',
  'GT': 'Guatemala',
  'OM': 'Oman',
  'LU': 'Luxembourg',
  'BG': 'Bulgaria',
  'LK': 'Sri Lanka',
  'KE': 'Kenya',
  'UY': 'Uruguay',
  'CR': 'Costa Rica',
  'SI': 'Slovenia',
  'LT': 'Lithuania',
  'RS': 'Serbia',
  'GH': 'Ghana',
  'TZ': 'Tanzania',
  'UG': 'Uganda',
  'JO': 'Jordan',
  'TN': 'Tunisia',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'HR': 'Croatia',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IS': 'Iceland',
  'CY': 'Cyprus',
  'KH': 'Cambodia',
  'SV': 'El Salvador',
  'HN': 'Honduras',
  'PG': 'Papua New Guinea',
  'SN': 'Senegal',
  'ZW': 'Zimbabwe',
  'BA': 'Bosnia and Herzegovina',
  'LA': 'Laos',
  'ZM': 'Zambia',
  'GE': 'Georgia',
  'AL': 'Albania',
  'MZ': 'Mozambique',
  'BW': 'Botswana',
  'ML': 'Mali',
  'BF': 'Burkina Faso',
  'GA': 'Gabon',
  'MU': 'Mauritius',
  'NA': 'Namibia',
  'NI': 'Nicaragua',
  'AM': 'Armenia',
  'MN': 'Mongolia',
  'JM': 'Jamaica',
  'MG': 'Madagascar',
  'BJ': 'Benin',
  'RW': 'Rwanda',
  'NE': 'Niger',
  'KG': 'Kyrgyzstan',
  'TD': 'Chad',
  'MW': 'Malawi',
  'MR': 'Mauritania',
  'TJ': 'Tajikistan',
  'HT': 'Haiti',
  'XK': 'Kosovo',
  'GN': 'Guinea',
  'BS': 'Bahamas',
  'BB': 'Barbados',
  'FJ': 'Fiji',
  'MV': 'Maldives',
  'GY': 'Guyana',
  'SR': 'Suriname',
  'BT': 'Bhutan',
  'ME': 'Montenegro',
  'SZ': 'Eswatini',
  'DJ': 'Djibouti',
  'BZ': 'Belize',
  'CF': 'Central African Republic',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'SL': 'Sierra Leone',
  'TG': 'Togo',
  'SO': 'Somalia',
  'ER': 'Eritrea',
  'BI': 'Burundi',
  'SS': 'South Sudan',
  'TL': 'Timor-Leste',
  'KM': 'Comoros',
  'GW': 'Guinea-Bissau',
  'SC': 'Seychelles',
  'AG': 'Antigua and Barbuda',
  'GD': 'Grenada',
  'LC': 'Saint Lucia',
  'VC': 'Saint Vincent and the Grenadines',
  'DM': 'Dominica',
  'KN': 'Saint Kitts and Nevis',
  'WS': 'Samoa',
  'VU': 'Vanuatu',
  'TO': 'Tonga',
  'SB': 'Solomon Islands',
  'CV': 'Cape Verde',
  'ST': 'Sao Tome and Principe',
  'PS': 'Palestine',
  'LB': 'Lebanon',
  'YE': 'Yemen',
  'SY': 'Syria',
  'AF': 'Afghanistan',
  'MM': 'Myanmar',
  'NP': 'Nepal',
  'CM': 'Cameroon',
  'CI': 'Ivory Coast',
  'AO': 'Angola',
  'SD': 'Sudan',
  'DZ': 'Algeria',
  'LY': 'Libya',
  'NG': 'Nigeria',
  'PK': 'Pakistan',
  'TH': 'Thailand',
  'TW': 'Taiwan',
  'IR': 'Iran',
  'VE': 'Venezuela',
  'UA': 'Ukraine',
  'BY': 'Belarus',
  'AZ': 'Azerbaijan',
  'UZ': 'Uzbekistan',
  'TM': 'Turkmenistan',
  'MK': 'North Macedonia',
  'MD': 'Moldova',
  'MT': 'Malta',
  'BN': 'Brunei',
  'TT': 'Trinidad and Tobago',
  'CU': 'Cuba',
  'PA': 'Panama',
  'BH': 'Bahrain',
  'KP': 'North Korea',
  'CG': 'Congo',
  'CD': 'Democratic Republic of Congo',
  'GQ': 'Equatorial Guinea',
  'GM': 'Gambia',
  'KI': 'Kiribati',
  'MH': 'Marshall Islands',
  'FM': 'Micronesia',
  'NR': 'Nauru',
  'PW': 'Palau',
  'TV': 'Tuvalu'
};

/**
 * Get country name from country code
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Full country name or country code if not found
 */
function getCountryName(countryCode: string): string {
  return COUNTRY_CODE_TO_NAME[countryCode] || countryCode;
}

/**
 * Validate forecast scenario shock data
 * 
 * @param shock - Forecast scenario shock to validate
 * @returns Validation result with errors
 */
export function validateForecastShock(shock: ForecastScenarioShock): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate base shock range
  if (shock.baseShock < 0 || shock.baseShock > 25) {
    errors.push(`Base shock ${shock.baseShock} out of range [0, 25]`);
  }
  
  // Validate delta range
  if (shock.delta < -10 || shock.delta > 10) {
    errors.push(`Delta ${shock.delta} out of expected range [-10, 10]`);
  }
  
  // Validate outlook
  const validOutlooks = ['OVERWEIGHT', 'UNDERWEIGHT', 'NEUTRAL', 'UNDERPERFORM', 'OUTPERFORM'];
  if (!validOutlooks.includes(shock.outlook)) {
    errors.push(`Invalid outlook: ${shock.outlook}`);
  }
  
  // Validate risk trend
  const validTrends = ['IMPROVING', 'DETERIORATING', 'STABLE', 'VOLATILE'];
  if (!validTrends.includes(shock.riskTrend)) {
    errors.push(`Invalid risk trend: ${shock.riskTrend}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}