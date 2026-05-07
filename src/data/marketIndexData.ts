/**
 * Market Index Correlation Data (2011-2024)
 * Monthly data for major global market indices to validate CSI calculations
 */

import { ExtendedTimeWindow } from './historicalGeopoliticalEvents';

export interface MarketDataPoint {
  date: Date;
  value: number;
  change: number;
  ytdChange: number;
  volatility?: number;
}

export interface MarketIndex {
  id: string;
  name: string;
  shortName: string;
  country: string;
  region: string;
  currency: string;
  description: string;
  data: MarketDataPoint[];
}

export interface MarketStressPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
  affectedIndices: string[];
  peakDrawdown: { [indexId: string]: number };
  relatedEventIds: string[];
}

// Helper to create date
const d = (dateStr: string) => new Date(dateStr);

/**
 * Market Stress Periods - Major geopolitical events with market impact
 */
export const MARKET_STRESS_PERIODS: MarketStressPeriod[] = [
  {
    id: 'stress-2011-arab-spring',
    name: 'Arab Spring & EU Debt Crisis',
    startDate: d('2011-01-14'),
    endDate: d('2011-12-31'),
    description: 'Arab Spring revolutions combined with European sovereign debt crisis',
    affectedIndices: ['msci-world', 'sp500', 'ftse100'],
    peakDrawdown: { 'msci-world': -17.8, 'sp500': -10.0, 'ftse100': -13.0 },
    relatedEventIds: ['hist-tn-2011-001', 'hist-eg-2011-001', 'hist-gr-2011-001']
  },
  {
    id: 'stress-2014-crimea',
    name: 'Crimea Annexation',
    startDate: d('2014-02-20'),
    endDate: d('2014-12-31'),
    description: 'Russia annexes Crimea, Western sanctions imposed, ruble crisis',
    affectedIndices: ['moex', 'msci-world'],
    peakDrawdown: { 'moex': -45.0, 'msci-world': -8.5 },
    relatedEventIds: ['hist-ua-2014-002', 'hist-ru-2014-001', 'hist-ru-2014-002']
  },
  {
    id: 'stress-2015-china',
    name: 'China Stock Market Crash',
    startDate: d('2015-06-12'),
    endDate: d('2015-09-30'),
    description: 'Shanghai Composite loses 40% in 3 months',
    affectedIndices: ['shanghai', 'msci-world', 'sp500'],
    peakDrawdown: { 'shanghai': -43.0, 'msci-world': -12.0, 'sp500': -12.4 },
    relatedEventIds: ['hist-cn-2015-001', 'hist-cn-2015-002']
  },
  {
    id: 'stress-2016-brexit',
    name: 'Brexit Referendum',
    startDate: d('2016-06-23'),
    endDate: d('2016-07-15'),
    description: 'UK votes to leave EU, pound crashes',
    affectedIndices: ['ftse100', 'msci-world'],
    peakDrawdown: { 'ftse100': -8.7, 'msci-world': -5.2 },
    relatedEventIds: ['hist-gb-2016-001', 'hist-gb-2016-002']
  },
  {
    id: 'stress-2018-trade-war',
    name: 'US-China Trade War',
    startDate: d('2018-03-01'),
    endDate: d('2019-01-31'),
    description: 'Escalating tariffs between US and China',
    affectedIndices: ['shanghai', 'sp500', 'msci-world'],
    peakDrawdown: { 'shanghai': -30.0, 'sp500': -19.8, 'msci-world': -18.0 },
    relatedEventIds: ['hist-us-2018-004', 'hist-us-2019-001', 'hist-us-2019-002']
  },
  {
    id: 'stress-2020-covid',
    name: 'COVID-19 Pandemic Crash',
    startDate: d('2020-02-20'),
    endDate: d('2020-03-23'),
    description: 'Fastest bear market in history, global indices drop 30-40%',
    affectedIndices: ['msci-world', 'sp500', 'ftse100', 'shanghai', 'moex'],
    peakDrawdown: { 'msci-world': -34.0, 'sp500': -33.9, 'ftse100': -33.8, 'shanghai': -13.5, 'moex': -35.0 },
    relatedEventIds: ['hist-who-2020-001', 'hist-global-2020-001']
  },
  {
    id: 'stress-2022-ukraine',
    name: 'Russia-Ukraine War',
    startDate: d('2022-02-24'),
    endDate: d('2022-10-31'),
    description: 'Russia invades Ukraine, MOEX suspended, global volatility',
    affectedIndices: ['moex', 'msci-world', 'sp500', 'ftse100'],
    peakDrawdown: { 'moex': -50.0, 'msci-world': -26.9, 'sp500': -24.8, 'ftse100': -6.6 },
    relatedEventIds: ['hist-ru-2022-001', 'hist-ru-2022-002', 'hist-ru-2022-003']
  },
  {
    id: 'stress-2023-israel-hamas',
    name: 'Israel-Hamas War',
    startDate: d('2023-10-07'),
    endDate: d('2023-11-30'),
    description: 'Hamas attacks Israel, regional conflict escalation',
    affectedIndices: ['ta35', 'msci-world'],
    peakDrawdown: { 'ta35': -12.0, 'msci-world': -4.5 },
    relatedEventIds: ['hist-il-2023-001', 'hist-il-2023-002']
  }
];

/**
 * Condensed monthly data for each index (key months only for brevity)
 * Full data would be loaded from API in production
 */

// MSCI World Index - Key monthly values
const MSCI_WORLD_KEY_DATA: MarketDataPoint[] = [
  // 2011 - Arab Spring & EU Crisis
  { date: d('2011-01-31'), value: 1312, change: 2.5, ytdChange: 2.5 },
  { date: d('2011-08-31'), value: 1156, change: -10.7, ytdChange: -9.7, volatility: 32.5 },
  { date: d('2011-09-30'), value: 1052, change: -9.0, ytdChange: -17.8, volatility: 38.2 },
  { date: d('2011-12-31'), value: 1182, change: 4.8, ytdChange: -7.7 },
  // 2012
  { date: d('2012-05-31'), value: 1198, change: -7.5, ytdChange: 1.4, volatility: 24.5 },
  { date: d('2012-12-31'), value: 1378, change: 1.5, ytdChange: 16.6 },
  // 2013
  { date: d('2013-12-31'), value: 1661, change: 3.0, ytdChange: 20.5 },
  // 2014 - Crimea
  { date: d('2014-03-31'), value: 1692, change: 0.8, ytdChange: 1.9, volatility: 15.8 },
  { date: d('2014-07-31'), value: 1752, change: -1.5, ytdChange: 5.5, volatility: 14.2 },
  { date: d('2014-12-31'), value: 1725, change: -4.1, ytdChange: 3.9 },
  // 2015 - China crash
  { date: d('2015-06-30'), value: 1778, change: -2.6, ytdChange: 3.1, volatility: 16.5 },
  { date: d('2015-08-31'), value: 1625, change: -9.6, ytdChange: -5.8, volatility: 28.5 },
  { date: d('2015-12-31'), value: 1662, change: -1.4, ytdChange: -3.7 },
  // 2016 - Brexit
  { date: d('2016-06-30'), value: 1665, change: -1.9, ytdChange: 0.2, volatility: 24.8 },
  { date: d('2016-11-30'), value: 1765, change: 1.6, ytdChange: 6.2, volatility: 18.5 },
  { date: d('2016-12-31'), value: 1812, change: 2.7, ytdChange: 9.0 },
  // 2017
  { date: d('2017-12-31'), value: 2198, change: 1.5, ytdChange: 21.3 },
  // 2018 - Trade War
  { date: d('2018-02-28'), value: 2198, change: -4.9, ytdChange: 0.0, volatility: 25.5 },
  { date: d('2018-03-31'), value: 2145, change: -2.4, ytdChange: -2.4, volatility: 22.8 },
  { date: d('2018-10-31'), value: 2125, change: -7.5, ytdChange: -3.3, volatility: 28.2 },
  { date: d('2018-12-31'), value: 1998, change: -7.7, ytdChange: -9.1, volatility: 26.5 },
  // 2019
  { date: d('2019-05-31'), value: 2178, change: -6.3, ytdChange: 9.0, volatility: 18.5 },
  { date: d('2019-12-31'), value: 2458, change: 2.5, ytdChange: 23.0 },
  // 2020 - COVID
  { date: d('2020-02-29'), value: 2225, change: -8.2, ytdChange: -9.5, volatility: 32.5 },
  { date: d('2020-03-31'), value: 1725, change: -22.5, ytdChange: -29.8, volatility: 82.7 },
  { date: d('2020-04-30'), value: 1912, change: 10.8, ytdChange: -22.2, volatility: 45.2 },
  { date: d('2020-12-31'), value: 2525, change: 4.1, ytdChange: 2.7 },
  // 2021
  { date: d('2021-12-31'), value: 2978, change: 3.9, ytdChange: 17.9 },
  // 2022 - Ukraine
  { date: d('2022-01-31'), value: 2825, change: -5.1, ytdChange: -5.1, volatility: 24.5 },
  { date: d('2022-02-28'), value: 2712, change: -4.0, ytdChange: -8.9, volatility: 32.8 },
  { date: d('2022-06-30'), value: 2345, change: -7.9, ytdChange: -21.3, volatility: 30.2 },
  { date: d('2022-09-30'), value: 2178, change: -9.2, ytdChange: -26.9, volatility: 32.5 },
  { date: d('2022-12-31'), value: 2425, change: -3.5, ytdChange: -18.6 },
  // 2023 - Israel-Hamas
  { date: d('2023-03-31'), value: 2612, change: 3.2, ytdChange: 7.7, volatility: 22.5 },
  { date: d('2023-10-31'), value: 2625, change: -2.7, ytdChange: 8.2, volatility: 21.5 },
  { date: d('2023-12-31'), value: 2958, change: 4.0, ytdChange: 22.0 },
  // 2024
  { date: d('2024-04-30'), value: 3065, change: -4.2, ytdChange: 3.6, volatility: 18.5 },
  { date: d('2024-12-31'), value: 3398, change: 1.6, ytdChange: 14.9 }
];

// S&P 500 Index - Key monthly values
const SP500_KEY_DATA: MarketDataPoint[] = [
  { date: d('2011-08-31'), value: 1219, change: -5.7, ytdChange: -3.1, volatility: 35.2 },
  { date: d('2011-09-30'), value: 1131, change: -7.2, ytdChange: -10.0, volatility: 38.5 },
  { date: d('2011-12-31'), value: 1258, change: 0.9, ytdChange: 0.0 },
  { date: d('2012-12-31'), value: 1426, change: 0.7, ytdChange: 13.4 },
  { date: d('2013-12-31'), value: 1848, change: 2.3, ytdChange: 29.6 },
  { date: d('2014-12-31'), value: 2059, change: -0.4, ytdChange: 11.4 },
  { date: d('2015-08-31'), value: 1972, change: -6.3, ytdChange: -4.2, volatility: 28.5 },
  { date: d('2015-12-31'), value: 2044, change: -1.7, ytdChange: -0.7 },
  { date: d('2016-06-30'), value: 2099, change: 0.1, ytdChange: 2.7, volatility: 25.8 },
  { date: d('2016-12-31'), value: 2239, change: 1.8, ytdChange: 9.5 },
  { date: d('2017-12-31'), value: 2674, change: 1.0, ytdChange: 19.4 },
  { date: d('2018-02-28'), value: 2714, change: -3.9, ytdChange: 1.5, volatility: 28.5 },
  { date: d('2018-10-31'), value: 2712, change: -6.9, ytdChange: 1.4, volatility: 25.2 },
  { date: d('2018-12-31'), value: 2507, change: -9.2, ytdChange: -6.2, volatility: 28.5 },
  { date: d('2019-05-31'), value: 2752, change: -6.6, ytdChange: 9.8, volatility: 18.5 },
  { date: d('2019-12-31'), value: 3231, change: 2.9, ytdChange: 28.9 },
  { date: d('2020-02-29'), value: 2954, change: -8.4, ytdChange: -8.6, volatility: 35.5 },
  { date: d('2020-03-31'), value: 2585, change: -12.5, ytdChange: -20.0, volatility: 82.7 },
  { date: d('2020-12-31'), value: 3756, change: 3.7, ytdChange: 16.3 },
  { date: d('2021-12-31'), value: 4766, change: 4.4, ytdChange: 26.9 },
  { date: d('2022-02-28'), value: 4374, change: -3.1, ytdChange: -8.2, volatility: 32.5 },
  { date: d('2022-06-30'), value: 3785, change: -8.4, ytdChange: -20.6, volatility: 30.5 },
  { date: d('2022-09-30'), value: 3586, change: -9.3, ytdChange: -24.8, volatility: 32.5 },
  { date: d('2022-12-31'), value: 3840, change: -5.9, ytdChange: -19.4 },
  { date: d('2023-03-31'), value: 4109, change: 3.5, ytdChange: 7.0, volatility: 22.5 },
  { date: d('2023-10-31'), value: 4194, change: -2.2, ytdChange: 9.2, volatility: 21.5 },
  { date: d('2023-12-31'), value: 4770, change: 4.4, ytdChange: 24.2 },
  { date: d('2024-04-30'), value: 5036, change: -4.2, ytdChange: 5.6, volatility: 18.5 },
  { date: d('2024-12-31'), value: 5942, change: 1.2, ytdChange: 24.6 }
];

// FTSE 100 Index - Key monthly values
const FTSE100_KEY_DATA: MarketDataPoint[] = [
  { date: d('2011-08-31'), value: 5394, change: -7.2, ytdChange: -8.5, volatility: 32.5 },
  { date: d('2011-09-30'), value: 5128, change: -4.9, ytdChange: -13.0, volatility: 35.2 },
  { date: d('2011-12-31'), value: 5572, change: 1.2, ytdChange: -5.5 },
  { date: d('2012-12-31'), value: 5898, change: 0.5, ytdChange: 5.8 },
  { date: d('2013-12-31'), value: 6749, change: 1.5, ytdChange: 14.4 },
  { date: d('2014-03-31'), value: 6598, change: -3.1, ytdChange: -2.2, volatility: 15.5 },
  { date: d('2014-12-31'), value: 6566, change: -2.3, ytdChange: -2.7 },
  { date: d('2015-08-31'), value: 6248, change: -6.7, ytdChange: -4.8, volatility: 26.5 },
  { date: d('2015-12-31'), value: 6242, change: -1.8, ytdChange: -4.9 },
  { date: d('2016-06-30'), value: 6504, change: 4.4, ytdChange: 4.2, volatility: 28.5 },
  { date: d('2016-12-31'), value: 7143, change: 5.3, ytdChange: 14.4 },
  { date: d('2017-12-31'), value: 7688, change: 4.9, ytdChange: 7.6 },
  { date: d('2018-02-28'), value: 7232, change: -4.0, ytdChange: -5.9, volatility: 22.5 },
  { date: d('2018-12-31'), value: 6728, change: -4.4, ytdChange: -12.5 },
  { date: d('2019-12-31'), value: 7542, change: 2.7, ytdChange: 12.1 },
  { date: d('2020-02-29'), value: 6581, change: -9.7, ytdChange: -12.7, volatility: 35.5 },
  { date: d('2020-03-31'), value: 5672, change: -13.8, ytdChange: -24.8, volatility: 65.5 },
  { date: d('2020-12-31'), value: 6461, change: 3.1, ytdChange: -14.3 },
  { date: d('2021-12-31'), value: 7385, change: 4.6, ytdChange: 14.3 },
  { date: d('2022-02-28'), value: 7458, change: -0.1, ytdChange: 1.0, volatility: 28.5 },
  { date: d('2022-06-30'), value: 7169, change: -5.8, ytdChange: -2.9, volatility: 25.5 },
  { date: d('2022-09-30'), value: 6894, change: -5.4, ytdChange: -6.6, volatility: 28.5 },
  { date: d('2022-12-31'), value: 7452, change: -1.6, ytdChange: 0.9 },
  { date: d('2023-03-31'), value: 7632, change: -3.1, ytdChange: 2.4, volatility: 22.5 },
  { date: d('2023-10-31'), value: 7321, change: -3.8, ytdChange: -1.8, volatility: 18.5 },
  { date: d('2023-12-31'), value: 7733, change: 3.7, ytdChange: 3.8 },
  { date: d('2024-12-31'), value: 8173, change: -1.4, ytdChange: 5.7 }
];

// Shanghai Composite Index - Key monthly values
const SHANGHAI_KEY_DATA: MarketDataPoint[] = [
  { date: d('2011-09-30'), value: 2359, change: -8.1, ytdChange: -16.0, volatility: 32.5 },
  { date: d('2011-12-31'), value: 2199, change: -5.7, ytdChange: -21.7 },
  { date: d('2012-12-31'), value: 2269, change: 14.6, ytdChange: 3.2 },
  { date: d('2013-06-30'), value: 1979, change: -14.0, ytdChange: -12.8, volatility: 35.5 },
  { date: d('2013-12-31'), value: 2116, change: -4.7, ytdChange: -6.7 },
  { date: d('2014-12-31'), value: 3235, change: 20.6, ytdChange: 52.9 },
  { date: d('2015-06-30'), value: 4277, change: -7.3, ytdChange: 32.2, volatility: 45.5 },
  { date: d('2015-07-31'), value: 3664, change: -14.3, ytdChange: 13.3, volatility: 55.5 },
  { date: d('2015-08-31'), value: 3206, change: -12.5, ytdChange: -0.9, volatility: 62.5 },
  { date: d('2015-12-31'), value: 3539, change: 3.0, ytdChange: 9.4 },
  { date: d('2016-01-31'), value: 2737, change: -22.7, ytdChange: -22.7, volatility: 48.5 },
  { date: d('2016-12-31'), value: 3104, change: -4.5, ytdChange: -12.3 },
  { date: d('2017-12-31'), value: 3307, change: -0.3, ytdChange: 6.6 },
  { date: d('2018-03-31'), value: 3169, change: -2.8, ytdChange: -4.2, volatility: 25.5 },
  { date: d('2018-06-30'), value: 2847, change: -8.0, ytdChange: -13.9, volatility: 32.5 },
  { date: d('2018-10-31'), value: 2603, change: -7.7, ytdChange: -21.3, volatility: 35.5 },
  { date: d('2018-12-31'), value: 2494, change: -3.6, ytdChange: -24.6 },
  { date: d('2019-05-31'), value: 2898, change: -5.8, ytdChange: 16.2, volatility: 22.5 },
  { date: d('2019-12-31'), value: 3050, change: 6.2, ytdChange: 22.3 },
  { date: d('2020-03-31'), value: 2750, change: -4.5, ytdChange: -9.8, volatility: 35.5 },
  { date: d('2020-12-31'), value: 3473, change: 2.4, ytdChange: 13.9 },
  { date: d('2021-12-31'), value: 3639, change: 2.1, ytdChange: 4.8 },
  { date: d('2022-04-30'), value: 3047, change: -6.3, ytdChange: -16.3, volatility: 32.5 },
  { date: d('2022-10-31'), value: 2893, change: -4.3, ytdChange: -20.5, volatility: 28.5 },
  { date: d('2022-12-31'), value: 3089, change: -2.0, ytdChange: -15.1 },
  { date: d('2023-12-31'), value: 2974, change: -1.8, ytdChange: -3.7 },
  { date: d('2024-01-31'), value: 2789, change: -6.2, ytdChange: -6.2, volatility: 22.5 },
  { date: d('2024-09-30'), value: 3336, change: 17.4, ytdChange: 12.2 },
  { date: d('2024-12-31'), value: 3351, change: 0.8, ytdChange: 12.7 }
];

// MOEX Russia Index - Key monthly values
const MOEX_KEY_DATA: MarketDataPoint[] = [
  { date: d('2011-09-30'), value: 1341, change: -13.3, ytdChange: -19.8, volatility: 45.5 },
  { date: d('2011-12-31'), value: 1382, change: -2.1, ytdChange: -17.3 },
  { date: d('2012-12-31'), value: 1474, change: 4.9, ytdChange: 6.7 },
  { date: d('2013-12-31'), value: 1504, change: 1.7, ytdChange: 2.0 },
  { date: d('2014-01-31'), value: 1392, change: -7.4, ytdChange: -7.4, volatility: 28.5 },
  { date: d('2014-02-28'), value: 1267, change: -9.0, ytdChange: -15.8, volatility: 35.5 },
  { date: d('2014-03-31'), value: 1226, change: -3.2, ytdChange: -18.5, volatility: 42.5 },
  { date: d('2014-07-31'), value: 1330, change: -9.9, ytdChange: -11.6, volatility: 38.5 },
  { date: d('2014-12-31'), value: 1397, change: 4.6, ytdChange: -7.1, volatility: 55.5 },
  { date: d('2015-12-31'), value: 1761, change: -0.6, ytdChange: 26.1 },
  { date: d('2016-12-31'), value: 2233, change: 9.2, ytdChange: 26.8 },
  { date: d('2017-12-31'), value: 2110, change: 0.6, ytdChange: -5.5 },
  { date: d('2018-04-30'), value: 2090, change: -7.9, ytdChange: -0.9, volatility: 35.5 },
  { date: d('2018-12-31'), value: 2359, change: 0.0, ytdChange: 11.8 },
  { date: d('2019-12-31'), value: 3046, change: 4.0, ytdChange: 29.1 },
  { date: d('2020-02-29'), value: 2743, change: -11.1, ytdChange: -9.9, volatility: 38.5 },
  { date: d('2020-03-31'), value: 2509, change: -8.5, ytdChange: -17.6, volatility: 55.5 },
  { date: d('2020-12-31'), value: 3289, change: 7.2, ytdChange: 8.0 },
  { date: d('2021-11-30'), value: 3918, change: -7.9, ytdChange: 19.1, volatility: 28.5 },
  { date: d('2021-12-31'), value: 3787, change: -3.3, ytdChange: 15.1 },
  { date: d('2022-01-31'), value: 3414, change: -9.8, ytdChange: -9.8, volatility: 35.5 },
  { date: d('2022-02-28'), value: 2478, change: -27.4, ytdChange: -34.6, volatility: 85.5 },
  { date: d('2022-03-31'), value: 2503, change: 1.0, ytdChange: -33.9 },
  { date: d('2022-12-31'), value: 2154, change: 2.5, ytdChange: -43.1 },
  { date: d('2023-12-31'), value: 3099, change: 4.8, ytdChange: 43.9 },
  { date: d('2024-12-31'), value: 2549, change: -2.1, ytdChange: -17.7 }
];

// TA-35 Israel Index - Key monthly values
const TA35_KEY_DATA: MarketDataPoint[] = [
  { date: d('2011-08-31'), value: 1098, change: -8.5, ytdChange: -12.5, volatility: 28.5 },
  { date: d('2011-12-31'), value: 1078, change: 2.1, ytdChange: -14.1 },
  { date: d('2012-12-31'), value: 1132, change: 1.5, ytdChange: 5.0 },
  { date: d('2013-12-31'), value: 1326, change: 2.8, ytdChange: 17.1 },
  { date: d('2014-07-31'), value: 1298, change: -5.2, ytdChange: -2.1, volatility: 22.5 },
  { date: d('2014-12-31'), value: 1428, change: 3.5, ytdChange: 7.7 },
  { date: d('2015-08-31'), value: 1385, change: -6.8, ytdChange: -3.0, volatility: 25.5 },
  { date: d('2015-12-31'), value: 1425, change: 1.2, ytdChange: -0.2 },
  { date: d('2016-12-31'), value: 1398, change: 2.8, ytdChange: -1.9 },
  { date: d('2017-12-31'), value: 1526, change: 1.5, ytdChange: 9.2 },
  { date: d('2018-12-31'), value: 1378, change: -4.5, ytdChange: -9.7 },
  { date: d('2019-12-31'), value: 1675, change: 3.2, ytdChange: 21.6 },
  { date: d('2020-03-31'), value: 1245, change: -22.5, ytdChange: -25.7, volatility: 55.5 },
  { date: d('2020-12-31'), value: 1585, change: 4.8, ytdChange: -5.4 },
  { date: d('2021-12-31'), value: 2018, change: 2.5, ytdChange: 27.3 },
  { date: d('2022-06-30'), value: 1785, change: -8.5, ytdChange: -11.5, volatility: 28.5 },
  { date: d('2022-12-31'), value: 1756, change: 1.8, ytdChange: -13.0 },
  { date: d('2023-10-31'), value: 1625, change: -8.5, ytdChange: -7.5, volatility: 35.5 },
  { date: d('2023-11-30'), value: 1712, change: 5.4, ytdChange: -2.5 },
  { date: d('2023-12-31'), value: 1845, change: 7.8, ytdChange: 5.1 },
  { date: d('2024-04-30'), value: 1756, change: -5.2, ytdChange: -4.8, volatility: 28.5 },
  { date: d('2024-12-31'), value: 1998, change: 2.5, ytdChange: 8.3 }
];

/**
 * Market Indices Configuration
 */
export const MARKET_INDICES: MarketIndex[] = [
  {
    id: 'msci-world',
    name: 'MSCI World Index',
    shortName: 'MSCI World',
    country: 'Global',
    region: 'Global',
    currency: 'USD',
    description: 'Global equity market performance across 23 developed markets',
    data: MSCI_WORLD_KEY_DATA
  },
  {
    id: 'sp500',
    name: 'S&P 500 Index',
    shortName: 'S&P 500',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    description: 'US large-cap equity market benchmark',
    data: SP500_KEY_DATA
  },
  {
    id: 'ftse100',
    name: 'FTSE 100 Index',
    shortName: 'FTSE 100',
    country: 'United Kingdom',
    region: 'Western Europe',
    currency: 'GBP',
    description: 'UK blue-chip equity market benchmark',
    data: FTSE100_KEY_DATA
  },
  {
    id: 'shanghai',
    name: 'Shanghai Composite Index',
    shortName: 'Shanghai',
    country: 'China',
    region: 'East Asia',
    currency: 'CNY',
    description: 'Chinese A-share market benchmark',
    data: SHANGHAI_KEY_DATA
  },
  {
    id: 'moex',
    name: 'MOEX Russia Index',
    shortName: 'MOEX',
    country: 'Russia',
    region: 'Eurasia',
    currency: 'RUB',
    description: 'Russian equity market benchmark',
    data: MOEX_KEY_DATA
  },
  {
    id: 'ta35',
    name: 'TA-35 Index',
    shortName: 'TA-35',
    country: 'Israel',
    region: 'Middle East',
    currency: 'ILS',
    description: 'Israeli blue-chip equity market benchmark',
    data: TA35_KEY_DATA
  }
];

/**
 * Get market index by ID
 */
export function getMarketIndex(indexId: string): MarketIndex | undefined {
  return MARKET_INDICES.find(idx => idx.id === indexId);
}

/**
 * Get market data for a specific time window
 */
export function getMarketDataByTimeWindow(
  indexId: string,
  timeWindow: ExtendedTimeWindow
): MarketDataPoint[] {
  const index = getMarketIndex(indexId);
  if (!index) return [];

  const now = new Date();
  let cutoffDate: Date;

  switch (timeWindow) {
    case '7D':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30D':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90D':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '12M':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '3Y':
      cutoffDate = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '5Y':
      cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '10Y':
      cutoffDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return index.data.filter(point => point.date >= cutoffDate);
}

/**
 * Get stress periods within a time window
 */
export function getStressPeriodsInTimeWindow(
  timeWindow: ExtendedTimeWindow
): MarketStressPeriod[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (timeWindow) {
    case '3Y':
      cutoffDate = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '5Y':
      cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '10Y':
      cutoffDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  return MARKET_STRESS_PERIODS.filter(period => period.startDate >= cutoffDate);
}

/**
 * Calculate correlation between CSI changes and market movements
 */
export function calculateCSIMarketCorrelation(
  csiChanges: number[],
  marketChanges: number[]
): number {
  if (csiChanges.length !== marketChanges.length || csiChanges.length < 2) {
    return 0;
  }

  const n = csiChanges.length;
  const meanCSI = csiChanges.reduce((a, b) => a + b, 0) / n;
  const meanMarket = marketChanges.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomCSI = 0;
  let denomMarket = 0;

  for (let i = 0; i < n; i++) {
    const diffCSI = csiChanges[i] - meanCSI;
    const diffMarket = marketChanges[i] - meanMarket;
    numerator += diffCSI * diffMarket;
    denomCSI += diffCSI * diffCSI;
    denomMarket += diffMarket * diffMarket;
  }

  const denominator = Math.sqrt(denomCSI * denomMarket);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Get market indices affected by a specific country's events
 */
export function getRelevantIndicesForCountry(country: string): string[] {
  const countryIndexMap: { [key: string]: string[] } = {
    'United States': ['sp500', 'msci-world'],
    'United Kingdom': ['ftse100', 'msci-world'],
    'China': ['shanghai', 'msci-world'],
    'Russia': ['moex', 'msci-world'],
    'Ukraine': ['moex', 'msci-world'],
    'Israel': ['ta35', 'msci-world'],
    'Germany': ['ftse100', 'msci-world'],
    'France': ['ftse100', 'msci-world'],
    'Japan': ['msci-world'],
    'Iran': ['ta35', 'msci-world'],
    'Saudi Arabia': ['msci-world'],
    'default': ['msci-world']
  };

  return countryIndexMap[country] || countryIndexMap['default'];
}

/**
 * Get peak drawdown during a stress period for a specific index
 */
export function getPeakDrawdown(
  indexId: string,
  startDate: Date,
  endDate: Date
): number {
  const index = getMarketIndex(indexId);
  if (!index) return 0;

  const periodData = index.data.filter(
    point => point.date >= startDate && point.date <= endDate
  );

  if (periodData.length < 2) return 0;

  let peak = periodData[0].value;
  let maxDrawdown = 0;

  for (const point of periodData) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return -maxDrawdown;
}

/**
 * Get average volatility during a stress period
 */
export function getAverageVolatility(
  indexId: string,
  startDate: Date,
  endDate: Date
): number {
  const index = getMarketIndex(indexId);
  if (!index) return 0;

  const periodData = index.data.filter(
    point => point.date >= startDate && point.date <= endDate && point.volatility
  );

  if (periodData.length === 0) return 0;

  const totalVolatility = periodData.reduce(
    (sum, point) => sum + (point.volatility || 0),
    0
  );

  return totalVolatility / periodData.length;
}

/**
 * Format market data for chart display
 */
export function formatMarketDataForChart(
  indexId: string,
  timeWindow: ExtendedTimeWindow
): { date: string; value: number; change: number }[] {
  const data = getMarketDataByTimeWindow(indexId, timeWindow);
  
  return data.map(point => ({
    date: point.date.toISOString().split('T')[0],
    value: point.value,
    change: point.change
  }));
}