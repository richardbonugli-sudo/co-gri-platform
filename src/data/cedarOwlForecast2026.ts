/**
 * CedarOwl Integrated Geopolitical Gurus Risk Forecast - 2026
 * 
 * This file contains the complete forecast data for 2026, including:
 * - 195 country adjustments
 * - 6 major geopolitical events
 * - Regional risk premiums
 * - Sector multipliers
 * - Asset class forecasts
 * 
 * Source: CedarOwl Integrated Geopolitical Gurus Risk Forecast
 * Expert Sources: 15 leading geopolitical & financial analysts
 * Confidence Level: 85%
 * 
 * @module cedarOwlForecast2026
 */

import type { CedarOwlForecast } from '../types/forecast';

export const CEDAROWL_FORECAST_2026: CedarOwlForecast = {
  metadata: {
    forecastPeriod: '2026-01-01 to 2026-12-31',
    publishDate: '2026-01-07',
    expertSources: 15,
    overallConfidence: 0.85,
    nextUpdate: '2026-04-01',
    coverage: {
      countries: 195,
      events: 6,
      regions: 4,
      assetClasses: 6
    }
  },

  countryAdjustments: {
    // Europe
    'DE': { delta: -3.5, drivers: ['Deindustrialization', 'Energy crisis'], outlook: 'UNDERPERFORM', expectedReturn: 0.005, riskTrend: 'DETERIORATING' },
    'PL': { delta: 4.2, drivers: ['Defense boom', 'Nearshoring'], outlook: 'OUTPERFORM', expectedReturn: 0.06, riskTrend: 'IMPROVING' },
    'FR': { delta: -1.0, drivers: ['Nuclear advantage', 'Luxury goods resilience'], outlook: 'NEUTRAL', expectedReturn: 0.01, riskTrend: 'STABLE' },
    'GB': { delta: -2.0, drivers: ['Post-Brexit adjustment', 'Financial services pivot'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'IT': { delta: -2.5, drivers: ['Fiscal constraints', 'Energy dependence'], outlook: 'UNDERPERFORM', expectedReturn: 0.005, riskTrend: 'DETERIORATING' },
    'ES': { delta: -1.5, drivers: ['Tourism recovery', 'Renewable energy'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'NL': { delta: 0.5, drivers: ['Trade hub', 'Tech sector'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'SE': { delta: 1.0, drivers: ['Defense industry', 'Green tech'], outlook: 'SELECTIVE', expectedReturn: 0.03, riskTrend: 'IMPROVING' },
    'NO': { delta: 2.0, drivers: ['Energy exports', 'Sovereign wealth'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'IMPROVING' },
    'DK': { delta: 0.5, drivers: ['Renewable energy', 'Shipping'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'FI': { delta: 0.0, drivers: ['NATO membership', 'Tech sector'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'IE': { delta: 1.5, drivers: ['Tech hub', 'Pharma'], outlook: 'SELECTIVE', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'AT': { delta: -1.0, drivers: ['Energy dependence', 'Manufacturing'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'BE': { delta: 0.0, drivers: ['EU headquarters', 'Logistics'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'CH': { delta: 1.0, drivers: ['Safe haven', 'Financial services'], outlook: 'SELECTIVE', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'CZ': { delta: 2.0, drivers: ['Manufacturing', 'Nearshoring'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'IMPROVING' },
    'PT': { delta: 0.0, drivers: ['Tourism', 'Renewable energy'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'GR': { delta: -1.0, drivers: ['Debt concerns', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'HU': { delta: -1.5, drivers: ['Political risk', 'EU tensions'], outlook: 'UNDERPERFORM', expectedReturn: 0.01, riskTrend: 'DETERIORATING' },
    'RO': { delta: 1.5, drivers: ['Nearshoring', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.035, riskTrend: 'IMPROVING' },
    'BG': { delta: 1.0, drivers: ['Nearshoring', 'Energy transit'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'SK': { delta: 1.0, drivers: ['Auto manufacturing', 'Nearshoring'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'HR': { delta: 0.5, drivers: ['Tourism', 'EU integration'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'SI': { delta: 0.5, drivers: ['Manufacturing', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'LT': { delta: 1.5, drivers: ['Defense spending', 'Tech'], outlook: 'SELECTIVE', expectedReturn: 0.03, riskTrend: 'IMPROVING' },
    'LV': { delta: 1.0, drivers: ['Defense', 'Logistics'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'EE': { delta: 1.5, drivers: ['Digital economy', 'Defense'], outlook: 'SELECTIVE', expectedReturn: 0.03, riskTrend: 'IMPROVING' },
    'LU': { delta: 0.5, drivers: ['Financial services', 'Stability'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'MT': { delta: 0.0, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'CY': { delta: 0.0, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'IS': { delta: 0.5, drivers: ['Energy', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'UA': { delta: -5.0, drivers: ['Ongoing conflict', 'Reconstruction needs'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'RU': { delta: -6.0, drivers: ['Sanctions', 'Isolation'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'BY': { delta: -4.0, drivers: ['Political risk', 'Russia alignment'], outlook: 'AVOID', expectedReturn: -0.03, riskTrend: 'DETERIORATING' },
    'MD': { delta: -2.0, drivers: ['Energy crisis', 'Political instability'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'RS': { delta: -1.0, drivers: ['Political tensions', 'EU path unclear'], outlook: 'NEUTRAL', expectedReturn: 0.01, riskTrend: 'STABLE' },
    'BA': { delta: -1.5, drivers: ['Political fragmentation', 'Slow reforms'], outlook: 'UNDERPERFORM', expectedReturn: 0.005, riskTrend: 'STABLE' },
    'MK': { delta: 0.0, drivers: ['EU candidacy', 'Regional tensions'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'AL': { delta: 0.5, drivers: ['EU candidacy', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'ME': { delta: 0.0, drivers: ['Tourism', 'EU path'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'XK': { delta: 0.0, drivers: ['Political tensions', 'Development needs'], outlook: 'NEUTRAL', expectedReturn: 0.01, riskTrend: 'STABLE' },

    // Middle East
    'SA': { delta: 3.5, drivers: ['Vision 2030', 'Oil production'], outlook: 'SELECTIVE', expectedReturn: 0.08, riskTrend: 'IMPROVING' },
    'AE': { delta: 2.5, drivers: ['Financial hub', 'Diversification'], outlook: 'SELECTIVE', expectedReturn: 0.07, riskTrend: 'STABLE' },
    'QA': { delta: 3.0, drivers: ['LNG leadership', 'Energy security'], outlook: 'OUTPERFORM', expectedReturn: 0.09, riskTrend: 'IMPROVING' },
    'IL': { delta: 1.5, drivers: ['Tech powerhouse', 'Defense tech'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'IR': { delta: -7.0, drivers: ['Sanctions', 'Nuclear tensions'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'IQ': { delta: -2.0, drivers: ['Political instability', 'Oil dependence'], outlook: 'HIGH_RISK', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'KW': { delta: 2.0, drivers: ['Oil wealth', 'Sovereign funds'], outlook: 'SELECTIVE', expectedReturn: 0.05, riskTrend: 'STABLE' },
    'OM': { delta: 1.5, drivers: ['Diversification', 'Regional stability'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'BH': { delta: 1.0, drivers: ['Financial services', 'Oil'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'JO': { delta: 0.0, drivers: ['Regional stability', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'LB': { delta: -5.0, drivers: ['Economic crisis', 'Political paralysis'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'SY': { delta: -8.0, drivers: ['Ongoing conflict', 'Sanctions'], outlook: 'AVOID', expectedReturn: -0.1, riskTrend: 'DETERIORATING' },
    'YE': { delta: -7.0, drivers: ['Civil war', 'Humanitarian crisis'], outlook: 'AVOID', expectedReturn: -0.08, riskTrend: 'DETERIORATING' },
    'PS': { delta: -4.0, drivers: ['Conflict', 'Economic constraints'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'EG': { delta: 0.5, drivers: ['IMF program', 'Suez Canal'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'TR': { delta: -1.0, drivers: ['Inflation', 'Political risk'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },

    // Asia-Pacific
    'CN': { delta: 2.8, drivers: ['Tech dominance', 'Belt & Road'], outlook: 'OVERWEIGHT', expectedReturn: 0.11, riskTrend: 'STABLE' },
    'IN': { delta: 3.1, drivers: ['Demographics', 'Infrastructure boom'], outlook: 'STRONG_BUY', expectedReturn: 0.13, riskTrend: 'IMPROVING' },
    'JP': { delta: -0.5, drivers: ['Demographics', 'Slow growth'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'KR': { delta: 1.5, drivers: ['Tech exports', 'Semiconductors'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'ID': { delta: 3.5, drivers: ['Nickel dominance', 'Demographics'], outlook: 'STRONG_BUY', expectedReturn: 0.11, riskTrend: 'IMPROVING' },
    'VN': { delta: 3.1, drivers: ['Manufacturing', 'Nearshoring'], outlook: 'OUTPERFORM', expectedReturn: 0.10, riskTrend: 'IMPROVING' },
    'TH': { delta: 2.5, drivers: ['Manufacturing', 'Tourism'], outlook: 'SELECTIVE', expectedReturn: 0.09, riskTrend: 'IMPROVING' },
    'MY': { delta: 2.0, drivers: ['Semiconductors', 'Palm oil'], outlook: 'SELECTIVE', expectedReturn: 0.06, riskTrend: 'STABLE' },
    'SG': { delta: 1.5, drivers: ['Financial hub', 'Tech'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'PH': { delta: 2.5, drivers: ['Nearshoring', 'Remittances'], outlook: 'SELECTIVE', expectedReturn: 0.07, riskTrend: 'IMPROVING' },
    'PK': { delta: -2.0, drivers: ['Economic crisis', 'Political instability'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'BD': { delta: 1.5, drivers: ['Textiles', 'Demographics'], outlook: 'SELECTIVE', expectedReturn: 0.05, riskTrend: 'STABLE' },
    'MM': { delta: -4.0, drivers: ['Political crisis', 'Sanctions'], outlook: 'AVOID', expectedReturn: -0.03, riskTrend: 'DETERIORATING' },
    'KH': { delta: 1.0, drivers: ['Manufacturing', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'LA': { delta: 0.5, drivers: ['China investment', 'Hydropower'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'TW': { delta: 1.0, drivers: ['Semiconductors', 'China tensions'], outlook: 'SELECTIVE', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'HK': { delta: -1.5, drivers: ['China integration', 'Financial hub'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'DETERIORATING' },
    'MO': { delta: -1.0, drivers: ['Gaming', 'China dependence'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'MN': { delta: 1.0, drivers: ['Mining', 'China demand'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'NP': { delta: 0.5, drivers: ['Hydropower', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'LK': { delta: -3.0, drivers: ['Debt crisis', 'Political instability'], outlook: 'HIGH_RISK', expectedReturn: -0.02, riskTrend: 'DETERIORATING' },
    'BN': { delta: 1.0, drivers: ['Oil wealth', 'Stability'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'TL': { delta: 0.0, drivers: ['Oil', 'Development needs'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'AU': { delta: 1.5, drivers: ['Commodities', 'China demand'], outlook: 'SELECTIVE', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'NZ': { delta: 1.0, drivers: ['Agriculture', 'Stability'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'FJ': { delta: 0.0, drivers: ['Tourism', 'Climate risk'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'PG': { delta: 0.5, drivers: ['LNG', 'Mining'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'NC': { delta: 0.5, drivers: ['Nickel', 'France ties'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'KZ': { delta: 1.5, drivers: ['Oil', 'Mining'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'UZ': { delta: 1.0, drivers: ['Reforms', 'Natural gas'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'IMPROVING' },
    'TM': { delta: 0.0, drivers: ['Natural gas', 'Isolation'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'KG': { delta: 0.5, drivers: ['Mining', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'TJ': { delta: 0.0, drivers: ['Remittances', 'Hydropower'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'AF': { delta: -8.0, drivers: ['Taliban rule', 'Humanitarian crisis'], outlook: 'AVOID', expectedReturn: -0.1, riskTrend: 'DETERIORATING' },

    // Americas
    'US': { delta: -1.2, drivers: ['Tech regulation', 'Tariffs'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'CA': { delta: 0.5, drivers: ['Commodities', 'Nearshoring'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'MX': { delta: 2.5, drivers: ['Nearshoring', 'USMCA'], outlook: 'SELECTIVE', expectedReturn: 0.08, riskTrend: 'IMPROVING' },
    'BR': { delta: 4.5, drivers: ['Agriculture', 'Commodities'], outlook: 'STRONG_BUY', expectedReturn: 0.14, riskTrend: 'IMPROVING' },
    'AR': { delta: 3.0, drivers: ['Reforms', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.10, riskTrend: 'IMPROVING' },
    'CL': { delta: 2.0, drivers: ['Copper', 'Lithium'], outlook: 'SELECTIVE', expectedReturn: 0.06, riskTrend: 'STABLE' },
    'CO': { delta: 3.5, drivers: ['Commodities', 'Reforms'], outlook: 'OUTPERFORM', expectedReturn: 0.12, riskTrend: 'IMPROVING' },
    'PE': { delta: 2.0, drivers: ['Mining', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.06, riskTrend: 'STABLE' },
    'VE': { delta: 8.5, drivers: ['Post-intervention', 'Oil recovery'], outlook: 'HIGH_RISK', expectedReturn: 0.18, riskTrend: 'IMPROVING' },
    'EC': { delta: 1.0, drivers: ['Oil', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'BO': { delta: 0.5, drivers: ['Lithium', 'Natural gas'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'PY': { delta: 1.0, drivers: ['Agriculture', 'Hydropower'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'UY': { delta: 1.5, drivers: ['Agriculture', 'Stability'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'GY': { delta: 3.0, drivers: ['Oil discovery', 'Development'], outlook: 'SELECTIVE', expectedReturn: 0.10, riskTrend: 'IMPROVING' },
    'SR': { delta: 0.5, drivers: ['Oil', 'Mining'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'GF': { delta: 0.0, drivers: ['France ties', 'Space center'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'CR': { delta: 1.0, drivers: ['Tourism', 'Stability'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'PA': { delta: 1.5, drivers: ['Canal', 'Logistics'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'GT': { delta: 0.5, drivers: ['Nearshoring', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'HN': { delta: 0.0, drivers: ['Nearshoring', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'SV': { delta: 0.5, drivers: ['Nearshoring', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'NI': { delta: -2.0, drivers: ['Political risk', 'Sanctions'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'BZ': { delta: 0.0, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'CU': { delta: -4.0, drivers: ['Sanctions', 'Economic crisis'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'HT': { delta: -6.0, drivers: ['Political collapse', 'Gang violence'], outlook: 'AVOID', expectedReturn: -0.08, riskTrend: 'DETERIORATING' },
    'DO': { delta: 1.0, drivers: ['Tourism', 'Nearshoring'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'JM': { delta: 0.5, drivers: ['Tourism', 'Bauxite'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'TT': { delta: 1.0, drivers: ['Energy', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'BS': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'BB': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },

    // Africa
    'ZA': { delta: 0.5, drivers: ['Mining', 'Infrastructure challenges'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'NG': { delta: 1.5, drivers: ['Oil', 'Demographics'], outlook: 'SELECTIVE', expectedReturn: 0.05, riskTrend: 'STABLE' },
    'EH': { delta: 2.0, drivers: ['Phosphates', 'Development'], outlook: 'SELECTIVE', expectedReturn: 0.06, riskTrend: 'IMPROVING' },
    'KE': { delta: 2.0, drivers: ['Tech hub', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.06, riskTrend: 'IMPROVING' },
    'ET': { delta: 1.5, drivers: ['Manufacturing', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.05, riskTrend: 'STABLE' },
    'GH': { delta: 1.5, drivers: ['Gold', 'Cocoa'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'TZ': { delta: 1.5, drivers: ['Mining', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'UG': { delta: 1.0, drivers: ['Oil discovery', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'AO': { delta: 1.0, drivers: ['Oil', 'Diamonds'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'MZ': { delta: 1.5, drivers: ['LNG', 'Mining'], outlook: 'SELECTIVE', expectedReturn: 0.05, riskTrend: 'STABLE' },
    'ZM': { delta: 1.0, drivers: ['Copper', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.04, riskTrend: 'STABLE' },
    'ZW': { delta: -3.0, drivers: ['Economic crisis', 'Political risk'], outlook: 'AVOID', expectedReturn: -0.02, riskTrend: 'DETERIORATING' },
    'BW': { delta: 1.5, drivers: ['Diamonds', 'Stability'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'NA': { delta: 1.5, drivers: ['Mining', 'Green hydrogen'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'MU': { delta: 1.0, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'SC': { delta: 0.5, drivers: ['Tourism', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'RW': { delta: 1.5, drivers: ['Tech hub', 'Stability'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'IMPROVING' },
    'SN': { delta: 1.5, drivers: ['Gas discovery', 'Agriculture'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'IMPROVING' },
    'CI': { delta: 1.5, drivers: ['Cocoa', 'Manufacturing'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'CM': { delta: 0.5, drivers: ['Oil', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'CD': { delta: 2.5, drivers: ['Cobalt', 'Copper'], outlook: 'SELECTIVE', expectedReturn: 0.08, riskTrend: 'STABLE' },
    'MA': { delta: 1.5, drivers: ['Phosphates', 'Tourism'], outlook: 'SELECTIVE', expectedReturn: 0.045, riskTrend: 'STABLE' },
    'DZ': { delta: 0.5, drivers: ['Gas', 'Oil'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'TN': { delta: 0.0, drivers: ['Tourism', 'Manufacturing'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'LY': { delta: -4.0, drivers: ['Civil war', 'Oil disruption'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'SD': { delta: -5.0, drivers: ['Civil war', 'Humanitarian crisis'], outlook: 'AVOID', expectedReturn: -0.08, riskTrend: 'DETERIORATING' },
    'SS': { delta: -6.0, drivers: ['Civil war', 'Oil dependence'], outlook: 'AVOID', expectedReturn: -0.08, riskTrend: 'DETERIORATING' },
    'SO': { delta: -5.0, drivers: ['Instability', 'Terrorism'], outlook: 'AVOID', expectedReturn: -0.06, riskTrend: 'DETERIORATING' },
    'ER': { delta: -4.0, drivers: ['Isolation', 'Authoritarianism'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'DJ': { delta: 0.5, drivers: ['Port', 'Military bases'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'ML': { delta: -3.0, drivers: ['Coup', 'Terrorism'], outlook: 'AVOID', expectedReturn: -0.03, riskTrend: 'DETERIORATING' },
    'BF': { delta: -3.5, drivers: ['Coup', 'Terrorism'], outlook: 'AVOID', expectedReturn: -0.04, riskTrend: 'DETERIORATING' },
    'NE': { delta: -3.0, drivers: ['Coup', 'Terrorism'], outlook: 'AVOID', expectedReturn: -0.03, riskTrend: 'DETERIORATING' },
    'TD': { delta: -2.0, drivers: ['Instability', 'Oil'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'CF': { delta: -4.0, drivers: ['Civil war', 'Instability'], outlook: 'AVOID', expectedReturn: -0.05, riskTrend: 'DETERIORATING' },
    'CG': { delta: 0.0, drivers: ['Oil', 'Political risk'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'GA': { delta: 0.5, drivers: ['Oil', 'Manganese'], outlook: 'NEUTRAL', expectedReturn: 0.03, riskTrend: 'STABLE' },
    'GQ': { delta: 0.0, drivers: ['Oil', 'Gas'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'ST': { delta: 0.0, drivers: ['Tourism', 'Cocoa'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'GN': { delta: 1.0, drivers: ['Bauxite', 'Iron ore'], outlook: 'NEUTRAL', expectedReturn: 0.035, riskTrend: 'STABLE' },
    'SL': { delta: 0.5, drivers: ['Mining', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'LR': { delta: 0.5, drivers: ['Mining', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'GM': { delta: 0.0, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'GW': { delta: 0.0, drivers: ['Agriculture', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'CV': { delta: 0.5, drivers: ['Tourism', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'MR': { delta: 0.5, drivers: ['Mining', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'BJ': { delta: 0.5, drivers: ['Cotton', 'Port'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'TG': { delta: 0.5, drivers: ['Phosphates', 'Port'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'BI': { delta: -2.0, drivers: ['Political instability', 'Poverty'], outlook: 'HIGH_RISK', expectedReturn: 0.0, riskTrend: 'DETERIORATING' },
    'MW': { delta: 0.0, drivers: ['Agriculture', 'Mining'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'LS': { delta: 0.0, drivers: ['Textiles', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'SZ': { delta: 0.0, drivers: ['Agriculture', 'Manufacturing'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'KM': { delta: 0.0, drivers: ['Agriculture', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'MG': { delta: 0.5, drivers: ['Mining', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },

    // Remaining countries (Pacific, Caribbean, etc.) - neutral baseline
    'WS': { delta: 0.0, drivers: ['Tourism', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'TO': { delta: 0.0, drivers: ['Tourism', 'Remittances'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'VU': { delta: 0.0, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'SB': { delta: 0.0, drivers: ['Logging', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'KI': { delta: 0.0, drivers: ['Fishing', 'Climate risk'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'TV': { delta: 0.0, drivers: ['Fishing', 'Climate risk'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'NR': { delta: 0.0, drivers: ['Phosphates', 'Climate risk'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'PW': { delta: 0.0, drivers: ['Tourism', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'FM': { delta: 0.0, drivers: ['Fishing', 'US aid'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'MH': { delta: 0.0, drivers: ['Fishing', 'US aid'], outlook: 'NEUTRAL', expectedReturn: 0.015, riskTrend: 'STABLE' },
    'AG': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'DM': { delta: 0.0, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'GD': { delta: 0.0, drivers: ['Tourism', 'Spices'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'KN': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'LC': { delta: 0.5, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'VC': { delta: 0.0, drivers: ['Tourism', 'Agriculture'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'AW': { delta: 0.5, drivers: ['Tourism', 'Refining'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'CW': { delta: 0.5, drivers: ['Tourism', 'Refining'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'SX': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'BM': { delta: 0.5, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'KY': { delta: 0.5, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'TC': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'VG': { delta: 0.5, drivers: ['Financial services', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'AI': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'MS': { delta: 0.0, drivers: ['Tourism', 'Reconstruction'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'GL': { delta: 0.5, drivers: ['Mining', 'Fishing'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'FO': { delta: 0.5, drivers: ['Fishing', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'PM': { delta: 0.0, drivers: ['Fishing', 'Tourism'], outlook: 'NEUTRAL', expectedReturn: 0.02, riskTrend: 'STABLE' },
    'BL': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
    'MF': { delta: 0.5, drivers: ['Tourism', 'Financial services'], outlook: 'NEUTRAL', expectedReturn: 0.025, riskTrend: 'STABLE' },
  },

  geopoliticalEvents: [
    {
      event: 'US-Venezuela Intervention',
      timeline: '2026-01',
      probability: 0.95,
      riskLevel: 'CRITICAL',
      baseImpact: 25,
      affectedCountries: ['VE', 'US', 'CO', 'BR', 'CL'],
      sectorImpacts: {
        'Energy': 1.5,
        'Defense': 1.4,
        'Financial Services': 1.2
      },
      description: 'US forces capture President Maduro and initiate regime change operations. The intervention establishes precedent for direct military action in Latin America and creates uncertainty around Venezuelan oil production recovery.',
      investmentImpact: 'Short-term oil volatility (+2-3%), Venezuelan bond rally, increased geopolitical risk premium in LatAm markets. Long-term: potential for production increases if US companies invest in infrastructure repairs.'
    },
    {
      event: 'New START Treaty Expiry',
      timeline: '2026-02',
      probability: 1.0,
      riskLevel: 'HIGH',
      baseImpact: 20,
      affectedCountries: ['US', 'RU', 'CN'],
      sectorImpacts: {
        'Defense': 1.6,
        'Technology': 1.2,
        'Materials': 1.3
      },
      description: 'The last remaining nuclear arms control treaty between US and Russia expires with no replacement framework. This eliminates all legally binding restrictions on the world\'s two largest nuclear arsenals.',
      investmentImpact: 'Elevated defense spending globally, increased safe-haven demand (gold, CHF, JPY). Nuclear modernization programs accelerate, benefiting defense contractors. Heightened tail risk for global markets.'
    },
    {
      event: 'Ukraine Peace Negotiations',
      timeline: '2026-03',
      probability: 0.70,
      riskLevel: 'HIGH',
      baseImpact: 22,
      affectedCountries: ['UA', 'RU', 'DE', 'FR', 'PL'],
      sectorImpacts: {
        'Energy': 1.4,
        'Agriculture': 1.3,
        'Defense': 1.2,
        'Manufacturing': 1.2
      },
      description: 'Diplomatic efforts intensify with potential ceasefire framework emerging. Key issues remain unresolved: territorial concessions, security guarantees, and Ukraine\'s NATO/EU path. Russia believes it can outlast Ukraine in war of attrition.',
      investmentImpact: 'If successful: European equity rally (+5-8%), EUR strength, reduced energy risk premium. If failed: continued defense spending, prolonged sanctions on Russia, sustained commodity volatility.'
    },
    {
      event: 'NATO Summit - Ukraine Security Framework',
      timeline: '2026-07',
      probability: 0.90,
      riskLevel: 'MEDIUM',
      baseImpact: 15,
      affectedCountries: ['UA', 'PL', 'DE', 'FR', 'GB', 'US'],
      sectorImpacts: {
        'Defense': 1.5,
        'Aerospace': 1.3,
        'Technology': 1.1
      },
      description: 'Critical NATO summit in Ankara finalizes security guarantee mechanisms for Ukraine. Framework likely includes European troop deployments, military hubs, and multilayered defense commitments. Russia opposes any NATO forces presence.',
      investmentImpact: 'European defense stocks rally on increased military spending commitments. EUR stability if framework credible. Reduced tail risk for European equities. Potential for 3-5% rally in European defense/aerospace sector.'
    },
    {
      event: 'US-China Tech Decoupling',
      timeline: '2026-09',
      probability: 0.80,
      riskLevel: 'HIGH',
      baseImpact: 28,
      affectedCountries: ['CN', 'US', 'TW', 'KR', 'JP', 'VN'],
      sectorImpacts: {
        'Technology': 1.4,
        'Semiconductors': 1.6,
        'Manufacturing': 1.3,
        'Materials': 1.4
      },
      description: 'Semiconductor and AI export controls expand significantly. China retaliates with rare earth restrictions (controls 70% of global refining). Over 20,000 Chinese entities potentially blacklisted. Trump\'s revenue-sharing chip deal adds complexity.',
      investmentImpact: 'Tech sector volatility, semiconductor stocks under pressure. Rare earth miners rally (+15-20%). Supply chain disruption risks for EVs, renewables, defense. Favor domestic chip manufacturers, critical mineral producers.'
    },
    {
      event: 'BRICS Payment System Launch',
      timeline: '2026-10',
      probability: 0.65,
      riskLevel: 'MEDIUM',
      baseImpact: 18,
      affectedCountries: ['CN', 'RU', 'BR', 'IN', 'ZA', 'SA', 'AE'],
      sectorImpacts: {
        'Financial Services': 1.3,
        'Technology': 1.2,
        'Energy': 1.2
      },
      description: 'BRICS launches \'The Unit\' - gold-anchored settlement system (40% gold, 60% BRICS currencies). Prototype tested with 10 member nations. China\'s CIPS now spans 119 countries. 90% of Russia-BRICS trade in local currencies.',
      investmentImpact: 'Long-term USD headwind, though immediate impact limited. Gold support (+5-8%). EM currency diversification benefits. Monitor dedollarization pace - gradual shift rather than sudden disruption.'
    }
  ],

  regionalPremiums: {
    'Europe': 1.12,
    'Middle East': 1.35,
    'Asia-Pacific': 0.92,
    'Americas': 1.05,
    'North America': 0.95,
    'Africa': 1.15
  },

  sectorMultipliers: {
    'Technology': 1.25,
    'Energy': 1.40,
    'Defense': 1.60,
    'Financial Services': 1.15,
    'Materials': 1.35,
    'Agriculture': 1.20,
    'Manufacturing': 1.10,
    'Semiconductors': 1.30,
    'Aerospace': 1.25,
    'Renewable Energy': 1.20,
    'Mining': 1.30,
    'Pharmaceuticals': 1.05,
    'Consumer Goods': 1.05,
    'Telecommunications': 1.10,
    'Transportation': 1.15
  },

  assetClassForecasts: {
    'Gold/Silver': {
      assetClass: 'Gold/Silver',
      expectedReturn: 0.15,
      recommendation: 'OVERWEIGHT',
      rationale: [
        'Dedollarization trend accelerating with BRICS payment system',
        'Central bank buying continues (especially China, India, Russia)',
        'Safe-haven demand from geopolitical tensions',
        'Nuclear arms race concerns boost precious metals'
      ]
    },
    'Commodities': {
      assetClass: 'Commodities',
      expectedReturn: 0.12,
      recommendation: 'OVERWEIGHT',
      rationale: [
        'Energy super-cycle driven by Middle East risks',
        'Rare earth supply constraints from US-China decoupling',
        'Agricultural demand from EM population growth',
        'Uranium +20% on nuclear renaissance'
      ]
    },
    'EM Equities': {
      assetClass: 'EM Equities',
      expectedReturn: 0.10,
      recommendation: 'OVERWEIGHT',
      rationale: [
        'Asia-Pacific drives outperformance (China +11%, India +13%)',
        'Latin America benefits from commodity cycle (Brazil +14%)',
        'Nearshoring beneficiaries (Vietnam +10%, Mexico +8%)',
        'Selective opportunities in frontier markets'
      ]
    },
    'US Equities': {
      assetClass: 'US Equities',
      expectedReturn: 0.03,
      recommendation: 'NEUTRAL',
      rationale: [
        'Tariff and tech regulation headwinds',
        'Defensive sectors outperform',
        'Valuation concerns at current levels',
        'Fed policy uncertainty'
      ]
    },
    'EUR Equities': {
      assetClass: 'EUR Equities',
      expectedReturn: 0.01,
      recommendation: 'UNDERWEIGHT',
      rationale: [
        'Stagnant growth, Ukraine uncertainty',
        'Energy dependence persists',
        'Defense sector exception (+8-12%)',
        'Competitiveness decline vs Asia/US'
      ]
    },
    'Bonds': {
      assetClass: 'Bonds',
      expectedReturn: -0.02,
      recommendation: 'UNDERWEIGHT',
      rationale: [
        'Yields 4.2-5.0% as Fed cuts fail to stimulate',
        'High global leverage ($307T debt)',
        'Tariff-driven inflation creates pressure',
        'Prefer short-term T-bills (5.0-5.5%)'
      ]
    }
  },

  regionalOutlook: {
    'Europe': {
      region: 'Europe',
      riskLevel: 'HIGH',
      keyThemes: [
        'Energy dependence persists despite diversification efforts',
        'Defense spending strains fiscal budgets (2%+ GDP)',
        'Economic stagnation 0.5-1.5% growth',
        'Political fragmentation and competitiveness decline vs Asia/US'
      ],
      opportunities: [
        'Defense sector (Rheinmetall, Thales, BAE Systems)',
        'Renewable infrastructure',
        'Poland and Nordics outperform',
        'Selective plays in luxury goods and nuclear tech'
      ],
      strategy: 'Underweight core Europe (Germany, Italy, Spain). Neutral France/UK. Overweight Poland and Nordics. Defense sector 8-12% allocation. Avoid peripheral sovereign debt.'
    },
    'Middle East': {
      region: 'Middle East',
      riskLevel: 'HIGH VOLATILITY',
      keyThemes: [
        'US influence declining, regional actors more independent',
        'Oil demand 107M barrels/day, supply disruption risks',
        'Saudi-Iran normalization impacts regional dynamics',
        'Energy transition creates winners (Qatar LNG) and losers'
      ],
      opportunities: [
        'Qatar LNG infrastructure (+9% return)',
        'Saudi Vision 2030 diversification (+8% return)',
        'UAE financial hub and crypto/fintech center (+7% return)',
        'Israel tech and defense exports (+4% return)'
      ],
      strategy: 'Selective exposure. Aramco (oil), PIF co-investments, Saudi Tadawul index. Risk: regional conflict, succession uncertainty. Pair trade: long Saudi vs short UAE. Max 2-3% allocation.'
    },
    'Asia-Pacific': {
      region: 'Asia-Pacific',
      riskLevel: 'MEDIUM (HIGH OPPORTUNITY)',
      keyThemes: [
        'Russia-China-India axis reshapes global trade',
        'China leapfrogs West in EVs, robotics, solar, AI',
        'ASEAN consumer growth and infrastructure boom',
        'Nearshoring from China to Vietnam/Thailand accelerates'
      ],
      opportunities: [
        'China tech giants (Alibaba, Tencent, BYD) - 20% allocation',
        'India infrastructure (Larsen & Toubro, Adani) - 15% allocation',
        'Indonesia nickel and EV supply chain - commodity play',
        'Vietnam manufacturing and real estate - nearshoring beneficiary'
      ],
      strategy: 'Overweight China (tech), India (infrastructure), Indonesia (commodities). Tactical Vietnam, Thailand. Underweight Japan (demographics). Currency basket: 60% CNY/INR, 30% ASEAN, 10% hedge. Best long-term Asia play.'
    },
    'Americas': {
      region: 'Americas',
      riskLevel: 'MEDIUM',
      keyThemes: [
        'Commodity super-cycle beneficiary',
        'Nearshoring from China to Mexico accelerates',
        'Currency appreciation potential as USD weakens',
        'Political stability varies (Argentina reforms vs Venezuela risk)'
      ],
      opportunities: [
        'Brazil agribusiness (BRL appreciation +8-12%, soy/beef exports)',
        'Mexico nearshoring (energy, mining stocks)',
        'Colombia commodities and reforms (+12% return)',
        'Argentina post-reform opportunity (+10% return, extreme risk)'
      ],
      strategy: 'Overweight Brazil (agribusiness, mining majors). Selective Mexico (nearshoring beneficiaries). Tactical Venezuela Q3 (oil services, infrastructure rebuilding). Political risk moderate under Petro. Bovespa index target +18%. Best LatAm risk/reward.'
    }
  }
};