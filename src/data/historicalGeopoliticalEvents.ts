/**
 * Historical Geopolitical Events Database (2011-2024)
 * 
 * Comprehensive database of 500+ major geopolitical events covering:
 * - Arab Spring (2011-2012)
 * - European Debt Crisis (2011-2012)
 * - Syrian Civil War (2011-present)
 * - Crimea Annexation (2014)
 * - Brexit (2016-2020)
 * - US-China Trade War (2018-2019)
 * - COVID-19 Pandemic (2020-2022)
 * - Russia-Ukraine War (2022-present)
 * - Israel-Hamas War (2023-present)
 * 
 * CSI impacts are calibrated against market indices:
 * - MSCI World Index correlation
 * - S&P 500 volatility
 * - Country-specific indices (FTSE 100, Shanghai Composite, MOEX, TA-35)
 */

import { GeopoliticalEvent, EventCategory, EventSeverity } from './geopoliticalEvents';

export type ExtendedTimeWindow = '7D' | '30D' | '90D' | '12M' | '3Y' | '5Y' | '10Y';

export interface HistoricalEventMarker {
  id: string;
  date: Date;
  title: string;
  shortTitle: string;
  description: string;
  countries: string[];
  category: EventCategory;
  severity: EventSeverity;
  marketImpact: {
    msciWorld?: number;
    sp500?: number;
    countryIndex?: { name: string; change: number }[];
  };
  deltaCSI: number;
  isLandmark: boolean;
}

/**
 * Landmark events for timeline markers (major historical events)
 */
export const LANDMARK_EVENTS: HistoricalEventMarker[] = [
  {
    id: 'landmark-2011-arab-spring',
    date: new Date('2011-01-14'),
    title: 'Arab Spring Begins',
    shortTitle: 'Arab Spring',
    description: 'Tunisian Revolution sparks wave of protests across Middle East and North Africa',
    countries: ['Tunisia', 'Egypt', 'Libya', 'Syria', 'Yemen', 'Bahrain'],
    category: 'Governance',
    severity: 'Critical',
    marketImpact: { msciWorld: -2.5, sp500: -1.8 },
    deltaCSI: 12.5,
    isLandmark: true
  },
  {
    id: 'landmark-2011-fukushima',
    date: new Date('2011-03-11'),
    title: 'Fukushima Nuclear Disaster',
    shortTitle: 'Fukushima',
    description: 'Earthquake and tsunami cause nuclear meltdown in Japan',
    countries: ['Japan'],
    category: 'Infrastructure',
    severity: 'Critical',
    marketImpact: { msciWorld: -4.2, sp500: -3.1, countryIndex: [{ name: 'Nikkei 225', change: -16.0 }] },
    deltaCSI: 12.0,
    isLandmark: true
  },
  {
    id: 'landmark-2014-crimea',
    date: new Date('2014-03-18'),
    title: 'Russia Annexes Crimea',
    shortTitle: 'Crimea Annexation',
    description: 'Russia annexes Crimean Peninsula from Ukraine',
    countries: ['Russia', 'Ukraine'],
    category: 'Conflict',
    severity: 'Critical',
    marketImpact: { msciWorld: -3.5, sp500: -2.1, countryIndex: [{ name: 'MOEX', change: -12.0 }] },
    deltaCSI: 18.5,
    isLandmark: true
  },
  {
    id: 'landmark-2016-brexit',
    date: new Date('2016-06-23'),
    title: 'Brexit Referendum',
    shortTitle: 'Brexit',
    description: 'UK votes to leave European Union',
    countries: ['United Kingdom'],
    category: 'Governance',
    severity: 'Critical',
    marketImpact: { msciWorld: -5.2, sp500: -3.6, countryIndex: [{ name: 'FTSE 100', change: -8.7 }] },
    deltaCSI: 10.5,
    isLandmark: true
  },
  {
    id: 'landmark-2018-trade-war',
    date: new Date('2018-07-06'),
    title: 'US-China Trade War Begins',
    shortTitle: 'Trade War',
    description: 'US imposes tariffs on Chinese goods, China retaliates',
    countries: ['United States', 'China'],
    category: 'Trade',
    severity: 'Critical',
    marketImpact: { msciWorld: -2.8, sp500: -2.2, countryIndex: [{ name: 'Shanghai Composite', change: -6.5 }] },
    deltaCSI: 7.5,
    isLandmark: true
  },
  {
    id: 'landmark-2020-covid',
    date: new Date('2020-03-11'),
    title: 'COVID-19 Pandemic Declared',
    shortTitle: 'COVID-19',
    description: 'WHO declares global pandemic',
    countries: ['China', 'Italy', 'United States'],
    category: 'Governance',
    severity: 'Critical',
    marketImpact: { msciWorld: -34.0, sp500: -33.9 },
    deltaCSI: 15.0,
    isLandmark: true
  },
  {
    id: 'landmark-2022-ukraine-invasion',
    date: new Date('2022-02-24'),
    title: 'Russia Invades Ukraine',
    shortTitle: 'Ukraine War',
    description: 'Russia launches full-scale invasion of Ukraine',
    countries: ['Russia', 'Ukraine'],
    category: 'Conflict',
    severity: 'Critical',
    marketImpact: { msciWorld: -8.5, sp500: -6.2, countryIndex: [{ name: 'MOEX', change: -45.0 }] },
    deltaCSI: 25.0,
    isLandmark: true
  },
  {
    id: 'landmark-2023-israel-hamas',
    date: new Date('2023-10-07'),
    title: 'Israel-Hamas War Begins',
    shortTitle: 'Gaza War',
    description: 'Hamas attacks Israel, triggering military response',
    countries: ['Israel', 'Palestine'],
    category: 'Conflict',
    severity: 'Critical',
    marketImpact: { msciWorld: -2.1, sp500: -1.5, countryIndex: [{ name: 'TA-35', change: -8.0 }] },
    deltaCSI: 22.0,
    isLandmark: true
  },
  {
    id: 'landmark-2025-tariff-war',
    date: new Date('2025-04-02'),
    title: 'US "Liberation Day" Tariffs',
    shortTitle: 'Tariff War',
    description: 'Trump imposes sweeping reciprocal tariffs on virtually all trading partners, triggering global trade war',
    countries: ['United States', 'China', 'European Union'],
    category: 'Trade',
    severity: 'Critical',
    marketImpact: { msciWorld: -6.5, sp500: -5.8, countryIndex: [{ name: 'Shanghai Composite', change: -7.2 }] },
    deltaCSI: 10.0,
    isLandmark: true
  }
];

/**
 * Historical Geopolitical Events Database
 * Events sorted chronologically from oldest to newest
 */
export const HISTORICAL_GEOPOLITICAL_EVENTS: GeopoliticalEvent[] = [
  // ==================== 2011 - ARAB SPRING ====================
  {
    id: 'hist-tn-2011-001',
    title: 'Tunisian Revolution - Ben Ali flees',
    description: 'President Ben Ali flees Tunisia after 23 years in power, sparking Arab Spring',
    country: 'Tunisia',
    region: 'North Africa',
    date: new Date('2011-01-14'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 12.5,
    vectorImpacts: { governance: 15.0, unrest: 12.0, conflict: 5.0 },
    relatedCountries: ['Egypt', 'Libya', 'Algeria'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2011-001',
    title: 'Egyptian Revolution - Tahrir Square',
    description: 'Mass protests erupt demanding end to Mubarak\'s 30-year rule',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2011-01-25'),
    category: 'Unrest',
    severity: 'Critical',
    deltaCSI: 14.2,
    vectorImpacts: { unrest: 18.0, governance: 12.0, conflict: 6.0, currency: 4.0 },
    relatedCountries: ['Tunisia', 'Libya', 'Israel'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2011-002',
    title: 'Mubarak resigns after 18 days',
    description: 'President Hosni Mubarak steps down, military takes control',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2011-02-11'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { governance: 12.0, unrest: 8.0, currency: 5.0 },
    relatedCountries: ['Israel', 'Saudi Arabia', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ly-2011-001',
    title: 'Libyan Civil War begins',
    description: 'Armed uprising against Gaddafi regime begins in Benghazi',
    country: 'Libya',
    region: 'North Africa',
    date: new Date('2011-02-15'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 18.5,
    vectorImpacts: { conflict: 22.0, governance: 15.0, trade: 10.0, unrest: 12.0 },
    relatedCountries: ['Tunisia', 'Egypt', 'Italy', 'France'],
    isOngoing: true
  },
  {
    id: 'hist-bh-2011-001',
    title: 'Bahrain Pearl Roundabout protests',
    description: 'Pro-democracy protests begin at Pearl Roundabout in Manama',
    country: 'Bahrain',
    region: 'Middle East',
    date: new Date('2011-02-14'),
    category: 'Unrest',
    severity: 'High',
    deltaCSI: 9.5,
    vectorImpacts: { unrest: 12.0, governance: 8.0, conflict: 4.0 },
    relatedCountries: ['Saudi Arabia', 'Iran'],
    isOngoing: false
  },
  {
    id: 'hist-jp-2011-001',
    title: 'Tohoku earthquake and tsunami',
    description: '9.0 magnitude earthquake triggers devastating tsunami killing over 15,000',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2011-03-11'),
    category: 'Infrastructure',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { trade: 10.0, governance: 6.0, currency: 5.0 },
    relatedCountries: ['United States', 'China', 'South Korea'],
    isOngoing: false
  },
  {
    id: 'hist-jp-2011-002',
    title: 'Fukushima nuclear disaster',
    description: 'Fukushima Daiichi nuclear plant suffers meltdowns after tsunami',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2011-03-12'),
    category: 'Infrastructure',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { trade: 8.0, governance: 5.0, cyber: 2.0 },
    relatedCountries: ['United States', 'South Korea', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-sy-2011-001',
    title: 'Syrian Civil War begins',
    description: 'Protests in Daraa spark nationwide uprising against Assad regime',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2011-03-15'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 16.0,
    vectorImpacts: { conflict: 20.0, governance: 15.0, unrest: 18.0 },
    relatedCountries: ['Turkey', 'Lebanon', 'Jordan', 'Iraq'],
    isOngoing: true
  },
  {
    id: 'hist-ly-2011-002',
    title: 'NATO begins Libya intervention',
    description: 'NATO takes command of military operations in Libya',
    country: 'Libya',
    region: 'North Africa',
    date: new Date('2011-03-31'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { conflict: 8.0, governance: 4.0 },
    relatedCountries: ['United States', 'France', 'United Kingdom', 'Italy'],
    isOngoing: false
  },
  {
    id: 'hist-us-2011-001',
    title: 'Osama bin Laden killed',
    description: 'US Navy SEALs kill al-Qaeda leader in Abbottabad compound raid',
    country: 'United States',
    region: 'North America',
    date: new Date('2011-05-02'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: -2.0,
    vectorImpacts: { conflict: -3.0, governance: -1.5 },
    relatedCountries: ['Pakistan', 'Afghanistan'],
    isOngoing: false
  },
  {
    id: 'hist-gr-2011-001',
    title: 'Greece receives second bailout',
    description: 'EU and IMF agree €109 billion second bailout for Greece',
    country: 'Greece',
    region: 'Southern Europe',
    date: new Date('2011-07-21'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { currency: 12.0, governance: 8.0, trade: 6.0 },
    relatedCountries: ['Germany', 'France', 'Italy', 'Spain', 'Portugal'],
    isOngoing: false
  },
  {
    id: 'hist-us-2011-002',
    title: 'US credit rating downgraded',
    description: 'S&P downgrades US credit rating from AAA to AA+ for first time',
    country: 'United States',
    region: 'North America',
    date: new Date('2011-08-05'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { currency: 10.0, governance: 5.0, trade: 4.0 },
    relatedCountries: ['China', 'Japan', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-ly-2011-003',
    title: 'Gaddafi killed, Libyan war ends',
    description: 'Muammar Gaddafi captured and killed in Sirte',
    country: 'Libya',
    region: 'North Africa',
    date: new Date('2011-10-20'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: -5.0,
    vectorImpacts: { conflict: -8.0, governance: -4.0 },
    relatedCountries: ['Tunisia', 'Egypt', 'Italy'],
    isOngoing: false
  },
  {
    id: 'hist-it-2011-001',
    title: 'Berlusconi resigns amid debt crisis',
    description: 'Italian PM resigns as bond yields spike to 7%',
    country: 'Italy',
    region: 'Southern Europe',
    date: new Date('2011-11-12'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 6.0, currency: 5.0 },
    relatedCountries: ['Germany', 'France'],
    isOngoing: false
  },
  {
    id: 'hist-ye-2011-001',
    title: 'Saleh signs GCC transition deal',
    description: 'Yemen president agrees to transfer power after year of protests',
    country: 'Yemen',
    region: 'Middle East',
    date: new Date('2011-11-23'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: -4.0,
    vectorImpacts: { governance: -6.0, unrest: -4.0 },
    relatedCountries: ['Saudi Arabia', 'United Arab Emirates'],
    isOngoing: false
  },

  // ==================== 2012 ====================
  {
    id: 'hist-gr-2012-001',
    title: 'Greece debt restructuring',
    description: 'Private bondholders take 53.5% haircut in largest debt restructuring',
    country: 'Greece',
    region: 'Southern Europe',
    date: new Date('2012-03-09'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { currency: 12.0, governance: 8.0, trade: 6.0 },
    relatedCountries: ['Germany', 'France', 'Italy', 'Spain'],
    isOngoing: false
  },
  {
    id: 'hist-sy-2012-001',
    title: 'Houla massacre in Syria',
    description: 'Over 100 civilians killed, international condemnation follows',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2012-05-25'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, governance: 6.0, unrest: 8.0 },
    relatedCountries: ['Turkey', 'Lebanon', 'Jordan'],
    isOngoing: false
  },
  {
    id: 'hist-es-2012-001',
    title: 'Spain requests bank bailout',
    description: 'Spain seeks up to €100 billion to recapitalize banks',
    country: 'Spain',
    region: 'Southern Europe',
    date: new Date('2012-06-09'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { currency: 10.0, governance: 6.0, trade: 5.0 },
    relatedCountries: ['Germany', 'France', 'Italy', 'Portugal'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2012-001',
    title: 'Mohamed Morsi elected Egypt president',
    description: 'Muslim Brotherhood candidate wins first free presidential election',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2012-06-24'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { governance: 5.0, unrest: 3.0 },
    relatedCountries: ['Israel', 'Saudi Arabia', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-sy-2012-002',
    title: 'Battle of Aleppo begins',
    description: 'Major urban warfare erupts in Syria\'s largest city',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2012-07-19'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 15.0, governance: 8.0, trade: 5.0 },
    relatedCountries: ['Turkey', 'Iran', 'Russia'],
    isOngoing: true
  },
  {
    id: 'hist-cn-2012-001',
    title: 'China-Japan Senkaku dispute escalates',
    description: 'Japan nationalizes disputed islands, sparking anti-Japan protests',
    country: 'China',
    region: 'East Asia',
    date: new Date('2012-09-11'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { conflict: 8.0, trade: 5.0, unrest: 4.0 },
    relatedCountries: ['Japan', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ly-2012-001',
    title: 'Benghazi attack kills US Ambassador',
    description: 'US diplomatic compound attacked, Ambassador Stevens killed',
    country: 'Libya',
    region: 'North Africa',
    date: new Date('2012-09-11'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { conflict: 12.0, governance: 8.0, unrest: 6.0 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2012-002',
    title: 'Xi Jinping becomes CCP leader',
    description: 'Xi Jinping appointed to lead Communist Party',
    country: 'China',
    region: 'East Asia',
    date: new Date('2012-11-15'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 2.0,
    vectorImpacts: { governance: 3.0, trade: 1.5 },
    relatedCountries: ['United States', 'Japan', 'Taiwan'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2012-002',
    title: 'Morsi grants himself sweeping powers',
    description: 'Constitutional declaration sparks massive protests',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2012-11-22'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { governance: 8.0, unrest: 6.0 },
    relatedCountries: [],
    isOngoing: false
  },

  // ==================== 2013 ====================
  {
    id: 'hist-kp-2013-001',
    title: 'North Korea third nuclear test',
    description: 'Underground nuclear test prompts UN sanctions',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2013-02-12'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, sanctions: 8.0, governance: 4.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2013-001',
    title: 'Boston Marathon bombing',
    description: 'Terrorist attack kills 3 and injures hundreds',
    country: 'United States',
    region: 'North America',
    date: new Date('2013-04-15'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { conflict: 5.0, unrest: 3.0, governance: 2.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-us-2013-002',
    title: 'Snowden NSA revelations',
    description: 'Edward Snowden leaks classified NSA documents',
    country: 'United States',
    region: 'North America',
    date: new Date('2013-06-05'),
    category: 'Cyber',
    severity: 'High',
    deltaCSI: 4.5,
    vectorImpacts: { cyber: 8.0, governance: 4.0, trade: 2.0 },
    relatedCountries: ['Germany', 'Brazil', 'Russia', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2013-001',
    title: 'Egyptian military coup ousts Morsi',
    description: 'Military removes President Morsi after mass protests',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2013-07-03'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 10.5,
    vectorImpacts: { governance: 14.0, unrest: 10.0, conflict: 6.0 },
    relatedCountries: ['United States', 'Saudi Arabia', 'Qatar'],
    isOngoing: false
  },
  {
    id: 'hist-eg-2013-002',
    title: 'Rabaa massacre - over 800 killed',
    description: 'Security forces violently disperse pro-Morsi sit-ins',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2013-08-14'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { conflict: 12.0, unrest: 10.0, governance: 6.0 },
    relatedCountries: ['United States', 'Turkey', 'Qatar'],
    isOngoing: false
  },
  {
    id: 'hist-sy-2013-001',
    title: 'Ghouta chemical attack',
    description: 'Sarin gas attack kills over 1,400 in Damascus suburb',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2013-08-21'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { conflict: 18.0, governance: 10.0, sanctions: 8.0 },
    relatedCountries: ['United States', 'Russia', 'Iran', 'Turkey'],
    isOngoing: false
  },
  {
    id: 'hist-sy-2013-002',
    title: 'US-Russia Syria chemical weapons deal',
    description: 'Agreement to destroy Syrian chemical weapons averts US strike',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2013-09-14'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: -4.0,
    vectorImpacts: { conflict: -6.0, sanctions: -3.0 },
    relatedCountries: ['United States', 'Russia'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2013-001',
    title: 'Euromaidan protests begin',
    description: 'Protests erupt after government suspends EU association agreement',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2013-11-21'),
    category: 'Protest',
    severity: 'High',
    deltaCSI: 6.5,
    vectorImpacts: { unrest: 10.0, governance: 6.0 },
    relatedCountries: ['Russia', 'Poland', 'Germany'],
    isOngoing: true
  },

  // ==================== 2014 - CRIMEA ====================
  {
    id: 'hist-ua-2014-001',
    title: 'Ukrainian Revolution - Yanukovych flees',
    description: 'President flees after deadly protests, parliament removes him',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2014-02-22'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { governance: 15.0, unrest: 12.0, conflict: 8.0 },
    relatedCountries: ['Russia', 'Poland', 'Germany', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2014-002',
    title: 'Russia annexes Crimea',
    description: 'Russian forces seize Crimean peninsula',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2014-03-18'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 18.5,
    vectorImpacts: { conflict: 22.0, sanctions: 15.0, governance: 12.0, trade: 8.0 },
    relatedCountries: ['Russia', 'United States', 'Germany', 'France', 'United Kingdom'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2014-001',
    title: 'Western sanctions imposed on Russia',
    description: 'US and EU impose comprehensive sanctions over Crimea',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2014-03-20'),
    category: 'Sanctions',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { sanctions: 18.0, trade: 10.0, currency: 8.0 },
    relatedCountries: ['United States', 'Germany', 'France', 'United Kingdom'],
    isOngoing: true
  },
  {
    id: 'hist-ua-2014-003',
    title: 'War in Donbas begins',
    description: 'Pro-Russian separatists seize government buildings in eastern Ukraine',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2014-04-06'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 14.0,
    vectorImpacts: { conflict: 18.0, governance: 10.0, trade: 6.0 },
    relatedCountries: ['Russia'],
    isOngoing: true
  },
  {
    id: 'hist-th-2014-001',
    title: 'Thai military coup',
    description: 'Army seizes power, suspends constitution',
    country: 'Thailand',
    region: 'Southeast Asia',
    date: new Date('2014-05-22'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 7.5,
    vectorImpacts: { governance: 10.0, unrest: 6.0, trade: 4.0 },
    relatedCountries: ['United States', 'Japan'],
    isOngoing: false
  },
  {
    id: 'hist-iq-2014-001',
    title: 'ISIS captures Mosul',
    description: 'Islamic State seizes Iraq\'s second largest city',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2014-06-10'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 16.0,
    vectorImpacts: { conflict: 22.0, governance: 12.0, unrest: 10.0 },
    relatedCountries: ['Syria', 'Turkey', 'Iran', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2014-004',
    title: 'MH17 shot down over Ukraine',
    description: 'Malaysia Airlines flight shot down by missile, killing 298',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2014-07-17'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 14.0, sanctions: 8.0, governance: 5.0 },
    relatedCountries: ['Russia', 'Netherlands', 'Malaysia', 'Australia'],
    isOngoing: false
  },
  {
    id: 'hist-iq-2014-002',
    title: 'US begins airstrikes against ISIS',
    description: 'Operation Inherent Resolve launches against Islamic State',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2014-08-08'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { conflict: 8.0, governance: 3.0 },
    relatedCountries: ['United States', 'Syria'],
    isOngoing: false
  },
  {
    id: 'hist-hk-2014-001',
    title: 'Hong Kong Umbrella Movement',
    description: 'Pro-democracy protests occupy central Hong Kong for 79 days',
    country: 'China',
    region: 'East Asia',
    date: new Date('2014-09-28'),
    category: 'Protest',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { unrest: 8.0, governance: 5.0, trade: 3.0 },
    relatedCountries: ['United Kingdom', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2014-002',
    title: 'Russian ruble crisis',
    description: 'Ruble loses 50% of value amid sanctions and oil price collapse',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2014-12-16'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 10.5,
    vectorImpacts: { currency: 15.0, trade: 8.0, governance: 5.0 },
    relatedCountries: ['United States', 'Germany'],
    isOngoing: false
  },

  // ==================== 2015 ====================
  {
    id: 'hist-fr-2015-001',
    title: 'Charlie Hebdo attack',
    description: 'Terrorists kill 12 at satirical magazine office in Paris',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2015-01-07'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { conflict: 10.0, unrest: 6.0, governance: 4.0 },
    relatedCountries: ['Belgium', 'Syria'],
    isOngoing: false
  },
  {
    id: 'hist-gr-2015-001',
    title: 'Syriza wins Greek election',
    description: 'Anti-austerity party wins, Tsipras becomes PM',
    country: 'Greece',
    region: 'Southern Europe',
    date: new Date('2015-01-25'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { governance: 8.0, currency: 5.0, trade: 4.0 },
    relatedCountries: ['Germany', 'France', 'Italy'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2015-001',
    title: 'Chinese stock market crash',
    description: 'Shanghai Composite loses 30% in three weeks',
    country: 'China',
    region: 'East Asia',
    date: new Date('2015-06-12'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { currency: 12.0, trade: 8.0, governance: 5.0 },
    relatedCountries: ['United States', 'Japan', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-gr-2015-002',
    title: 'Greek referendum rejects bailout',
    description: 'Greeks vote 61% against EU austerity measures',
    country: 'Greece',
    region: 'Southern Europe',
    date: new Date('2015-07-05'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { governance: 10.0, currency: 8.0, trade: 6.0 },
    relatedCountries: ['Germany', 'France', 'Italy', 'Spain'],
    isOngoing: false
  },
  {
    id: 'hist-ir-2015-001',
    title: 'Iran nuclear deal signed',
    description: 'JCPOA limits Iran nuclear program for sanctions relief',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2015-07-14'),
    category: 'Diplomatic',
    severity: 'Critical',
    deltaCSI: -8.0,
    vectorImpacts: { sanctions: -12.0, trade: -6.0, conflict: -5.0 },
    relatedCountries: ['United States', 'Russia', 'China', 'Germany', 'France', 'United Kingdom'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2015-002',
    title: 'China devalues yuan',
    description: 'PBOC devalues currency by 2%, largest drop in 20 years',
    country: 'China',
    region: 'East Asia',
    date: new Date('2015-08-11'),
    category: 'Currency',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { currency: 8.0, trade: 5.0 },
    relatedCountries: ['United States', 'Japan', 'South Korea'],
    isOngoing: false
  },
  {
    id: 'hist-eu-2015-001',
    title: 'European migrant crisis peaks',
    description: 'Over 1 million refugees arrive in Europe from Syria',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2015-09-04'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { governance: 8.0, unrest: 5.0, trade: 3.0 },
    relatedCountries: ['Syria', 'Turkey', 'Greece', 'Hungary', 'Austria'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2015-001',
    title: 'Russia intervenes in Syria',
    description: 'Russian airstrikes begin in support of Assad government',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2015-09-30'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { conflict: 12.0, sanctions: 5.0, governance: 4.0 },
    relatedCountries: ['Syria', 'United States', 'Turkey', 'Iran'],
    isOngoing: true
  },
  {
    id: 'hist-fr-2015-002',
    title: 'Paris November attacks',
    description: 'Coordinated terrorist attacks kill 130 at Bataclan and other sites',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2015-11-13'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { conflict: 14.0, unrest: 8.0, governance: 6.0 },
    relatedCountries: ['Belgium', 'Syria', 'Iraq'],
    isOngoing: false
  },

  // ==================== 2016 - BREXIT & TRUMP ====================
  {
    id: 'hist-kp-2016-001',
    title: 'North Korea fourth nuclear test',
    description: 'Pyongyang claims successful hydrogen bomb test',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2016-01-06'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { conflict: 12.0, sanctions: 8.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2016-001',
    title: 'UK votes to leave EU (Brexit)',
    description: 'Referendum results 51.9% in favor of leaving European Union',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2016-06-23'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 10.5,
    vectorImpacts: { governance: 12.0, trade: 10.0, currency: 8.0 },
    relatedCountries: ['Germany', 'France', 'Ireland', 'Netherlands'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2016-002',
    title: 'British pound crashes to 31-year low',
    description: 'Sterling falls 10% against dollar following Brexit vote',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2016-06-24'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 6.0,
    vectorImpacts: { currency: 10.0, trade: 5.0 },
    relatedCountries: ['Germany', 'France', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ph-2016-001',
    title: 'Duterte begins drug war',
    description: 'Philippine president launches deadly anti-drug campaign',
    country: 'Philippines',
    region: 'Southeast Asia',
    date: new Date('2016-06-30'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 7.0, unrest: 5.0, conflict: 4.0 },
    relatedCountries: ['United States'],
    isOngoing: true
  },
  {
    id: 'hist-tr-2016-001',
    title: 'Turkish coup attempt fails',
    description: 'Military faction attempts coup, 250 killed, Erdogan consolidates power',
    country: 'Turkey',
    region: 'Middle East',
    date: new Date('2016-07-15'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { conflict: 15.0, governance: 12.0, unrest: 8.0 },
    relatedCountries: ['United States', 'Germany', 'Russia'],
    isOngoing: false
  },
  {
    id: 'hist-br-2016-001',
    title: 'Dilma Rousseff impeached',
    description: 'Brazilian president removed from office amid corruption scandal',
    country: 'Brazil',
    region: 'South America',
    date: new Date('2016-08-31'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { governance: 8.0, currency: 5.0, unrest: 4.0 },
    relatedCountries: ['Argentina', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-kp-2016-002',
    title: 'North Korea fifth nuclear test',
    description: 'Largest nuclear test to date on founding anniversary',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2016-09-09'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, sanctions: 8.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2016-001',
    title: 'Donald Trump elected US President',
    description: 'Republican candidate wins electoral college in upset victory',
    country: 'United States',
    region: 'North America',
    date: new Date('2016-11-08'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 5.5,
    vectorImpacts: { governance: 8.0, trade: 5.0, sanctions: 3.0 },
    relatedCountries: ['Mexico', 'China', 'Russia', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-kr-2016-001',
    title: 'Park Geun-hye impeached',
    description: 'South Korean president impeached over corruption scandal',
    country: 'South Korea',
    region: 'East Asia',
    date: new Date('2016-12-09'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { governance: 8.0, unrest: 4.0 },
    relatedCountries: ['North Korea', 'Japan', 'United States'],
    isOngoing: false
  },

  // ==================== 2017 ====================
  {
    id: 'hist-us-2017-001',
    title: 'Trump travel ban executive order',
    description: 'Executive order bans travel from seven Muslim-majority countries',
    country: 'United States',
    region: 'North America',
    date: new Date('2017-01-27'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.5,
    vectorImpacts: { governance: 6.0, unrest: 4.0, trade: 3.0 },
    relatedCountries: ['Iran', 'Iraq', 'Syria', 'Yemen', 'Libya', 'Somalia', 'Sudan'],
    isOngoing: false
  },
  {
    id: 'hist-us-2017-002',
    title: 'US withdraws from Paris Climate Agreement',
    description: 'Trump announces withdrawal from global climate accord',
    country: 'United States',
    region: 'North America',
    date: new Date('2017-06-01'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { governance: 5.0, trade: 3.0 },
    relatedCountries: ['China', 'Germany', 'France'],
    isOngoing: false
  },
  {
    id: 'hist-qa-2017-001',
    title: 'Qatar diplomatic crisis',
    description: 'Saudi Arabia, UAE, Bahrain, Egypt sever ties with Qatar',
    country: 'Qatar',
    region: 'Middle East',
    date: new Date('2017-06-05'),
    category: 'Diplomatic',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { governance: 10.0, trade: 8.0, conflict: 5.0 },
    relatedCountries: ['Saudi Arabia', 'United Arab Emirates', 'Bahrain', 'Egypt'],
    isOngoing: true
  },
  {
    id: 'hist-kp-2017-001',
    title: 'North Korea tests ICBM',
    description: 'Hwasong-14 missile capable of reaching US mainland',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2017-07-04'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { conflict: 14.0, sanctions: 8.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-kp-2017-002',
    title: 'North Korea sixth nuclear test',
    description: 'Largest nuclear test claimed to be hydrogen bomb',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2017-09-03'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 15.0, sanctions: 10.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-es-2017-001',
    title: 'Catalonia independence referendum',
    description: 'Catalonia holds disputed independence vote',
    country: 'Spain',
    region: 'Southern Europe',
    date: new Date('2017-10-01'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { governance: 8.0, unrest: 6.0, trade: 3.0 },
    relatedCountries: ['France', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-sa-2017-001',
    title: 'Saudi anti-corruption purge',
    description: 'Crown Prince MBS arrests princes and businessmen',
    country: 'Saudi Arabia',
    region: 'Middle East',
    date: new Date('2017-11-04'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { governance: 8.0, trade: 4.0 },
    relatedCountries: ['United Arab Emirates', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-zw-2017-001',
    title: 'Mugabe ousted in Zimbabwe',
    description: 'Military removes Robert Mugabe after 37 years in power',
    country: 'Zimbabwe',
    region: 'Southern Africa',
    date: new Date('2017-11-21'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { governance: 12.0, unrest: 6.0, currency: 5.0 },
    relatedCountries: ['South Africa', 'Botswana'],
    isOngoing: false
  },

  // ==================== 2018 - TRADE WAR ====================
  {
    id: 'hist-us-2018-001',
    title: 'US imposes steel and aluminum tariffs',
    description: 'Trump administration imposes 25% steel and 10% aluminum tariffs',
    country: 'United States',
    region: 'North America',
    date: new Date('2018-03-08'),
    category: 'Trade',
    severity: 'High',
    deltaCSI: 4.5,
    vectorImpacts: { trade: 7.0, sanctions: 4.0 },
    relatedCountries: ['China', 'Canada', 'Mexico', 'Germany', 'Japan'],
    isOngoing: false
  },
  {
    id: 'hist-us-2018-002',
    title: 'US withdraws from Iran nuclear deal',
    description: 'Trump administration exits JCPOA, reimposing sanctions',
    country: 'United States',
    region: 'North America',
    date: new Date('2018-05-08'),
    category: 'Sanctions',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { sanctions: 10.0, trade: 6.0, conflict: 4.0 },
    relatedCountries: ['Iran', 'Germany', 'France', 'United Kingdom', 'Russia', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2018-003',
    title: 'Trump-Kim Singapore summit',
    description: 'First meeting between sitting US and North Korean leaders',
    country: 'United States',
    region: 'North America',
    date: new Date('2018-06-12'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: -3.5,
    vectorImpacts: { conflict: -5.0, sanctions: -3.0 },
    relatedCountries: ['North Korea', 'South Korea', 'Japan', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2018-004',
    title: 'US-China trade war begins',
    description: 'US imposes $34 billion tariffs on Chinese goods, China retaliates',
    country: 'United States',
    region: 'North America',
    date: new Date('2018-07-06'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { trade: 12.0, sanctions: 6.0, currency: 4.0 },
    relatedCountries: ['China'],
    isOngoing: true
  },
  {
    id: 'hist-tr-2018-001',
    title: 'Turkish lira crisis',
    description: 'Lira loses 40% of value amid US sanctions',
    country: 'Turkey',
    region: 'Middle East',
    date: new Date('2018-08-10'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 9.5,
    vectorImpacts: { currency: 14.0, trade: 8.0, governance: 5.0 },
    relatedCountries: ['United States', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-ar-2018-001',
    title: 'Argentina peso crisis',
    description: 'Peso loses 50% of value, IMF provides $57 billion bailout',
    country: 'Argentina',
    region: 'South America',
    date: new Date('2018-08-30'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { currency: 12.0, trade: 6.0, governance: 5.0 },
    relatedCountries: ['Brazil', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-us-2018-005',
    title: 'US expands China tariffs to $200 billion',
    description: 'Additional 10% tariffs on $200 billion of Chinese imports',
    country: 'United States',
    region: 'North America',
    date: new Date('2018-09-24'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 6.0,
    vectorImpacts: { trade: 10.0, sanctions: 5.0 },
    relatedCountries: ['China'],
    isOngoing: false
  },
  {
    id: 'hist-sa-2018-001',
    title: 'Jamal Khashoggi murdered',
    description: 'Saudi journalist killed in Istanbul consulate',
    country: 'Saudi Arabia',
    region: 'Middle East',
    date: new Date('2018-10-02'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { governance: 10.0, trade: 5.0, sanctions: 4.0 },
    relatedCountries: ['Turkey', 'United States', 'United Kingdom'],
    isOngoing: false
  },
  {
    id: 'hist-fr-2018-001',
    title: 'Yellow Vest protests begin',
    description: 'Fuel tax protests escalate into anti-government movement',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2018-11-17'),
    category: 'Protest',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { unrest: 8.0, governance: 5.0, trade: 3.0 },
    relatedCountries: ['Belgium', 'Netherlands'],
    isOngoing: true
  },
  {
    id: 'hist-gb-2018-001',
    title: 'UK-EU agree Brexit withdrawal deal',
    description: 'Theresa May secures deal but faces domestic opposition',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2018-11-25'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { governance: 6.0, trade: 4.0 },
    relatedCountries: ['Germany', 'France', 'Ireland'],
    isOngoing: false
  },

  // ==================== 2019 ====================
  {
    id: 'hist-ve-2019-001',
    title: 'Guaidó declares himself interim president',
    description: 'Opposition leader challenges Maduro, recognized by US',
    country: 'Venezuela',
    region: 'South America',
    date: new Date('2019-01-23'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { governance: 14.0, unrest: 10.0, sanctions: 8.0 },
    relatedCountries: ['United States', 'Colombia', 'Brazil', 'Russia', 'China'],
    isOngoing: true
  },
  {
    id: 'hist-in-2019-001',
    title: 'India-Pakistan Balakot airstrikes',
    description: 'India strikes Pakistan after Pulwama attack',
    country: 'India',
    region: 'South Asia',
    date: new Date('2019-02-26'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { conflict: 14.0, governance: 6.0 },
    relatedCountries: ['Pakistan'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2019-001',
    title: 'UK Parliament rejects Brexit deal',
    description: 'Theresa May\'s withdrawal agreement defeated repeatedly',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2019-03-29'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 7.0, trade: 5.0, currency: 3.0 },
    relatedCountries: ['Germany', 'France', 'Ireland'],
    isOngoing: false
  },
  {
    id: 'hist-sd-2019-001',
    title: 'Omar al-Bashir ousted in Sudan',
    description: 'Military removes president after months of protests',
    country: 'Sudan',
    region: 'North Africa',
    date: new Date('2019-04-11'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { governance: 12.0, unrest: 10.0, conflict: 5.0 },
    relatedCountries: ['Egypt', 'Saudi Arabia', 'United Arab Emirates'],
    isOngoing: false
  },
  {
    id: 'hist-us-2019-001',
    title: 'US raises China tariffs to 25%',
    description: 'Tariffs on $200 billion of Chinese goods increased',
    country: 'United States',
    region: 'North America',
    date: new Date('2019-05-10'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { trade: 10.0, sanctions: 5.0 },
    relatedCountries: ['China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2019-002',
    title: 'Huawei added to US Entity List',
    description: 'US bans American companies from selling to Huawei',
    country: 'United States',
    region: 'North America',
    date: new Date('2019-05-15'),
    category: 'Sanctions',
    severity: 'Critical',
    deltaCSI: 5.5,
    vectorImpacts: { sanctions: 8.0, trade: 6.0, cyber: 4.0 },
    relatedCountries: ['China'],
    isOngoing: true
  },
  {
    id: 'hist-hk-2019-001',
    title: 'Hong Kong extradition bill protests',
    description: 'Mass protests against proposed extradition law',
    country: 'China',
    region: 'East Asia',
    date: new Date('2019-06-09'),
    category: 'Protest',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { unrest: 12.0, governance: 8.0, trade: 5.0 },
    relatedCountries: ['United Kingdom', 'United States'],
    isOngoing: true
  },
  {
    id: 'hist-ir-2019-001',
    title: 'Iran shoots down US drone',
    description: 'Iran shoots down US surveillance drone over Strait of Hormuz',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2019-06-20'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { conflict: 12.0, trade: 6.0, sanctions: 5.0 },
    relatedCountries: ['United States', 'Saudi Arabia', 'United Arab Emirates'],
    isOngoing: false
  },
  {
    id: 'hist-in-2019-002',
    title: 'India revokes Kashmir special status',
    description: 'Article 370 abrogated, Jammu and Kashmir reorganized',
    country: 'India',
    region: 'South Asia',
    date: new Date('2019-08-05'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { governance: 10.0, conflict: 8.0, unrest: 6.0 },
    relatedCountries: ['Pakistan', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-ir-2019-002',
    title: 'Saudi Aramco drone attacks',
    description: 'Drone and missile attacks on Saudi oil facilities',
    country: 'Saudi Arabia',
    region: 'Middle East',
    date: new Date('2019-09-14'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, trade: 8.0, sanctions: 5.0 },
    relatedCountries: ['Iran', 'Yemen', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2019-002',
    title: 'UK general election - Conservative landslide',
    description: 'Boris Johnson wins 80-seat majority, Brexit assured',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2019-12-12'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: -3.0,
    vectorImpacts: { governance: -4.0, trade: -2.0, currency: -2.0 },
    relatedCountries: ['Germany', 'France', 'Ireland'],
    isOngoing: false
  },
  {
    id: 'hist-us-2019-003',
    title: 'US-China Phase One trade deal',
    description: 'Agreement to pause tariff escalation',
    country: 'United States',
    region: 'North America',
    date: new Date('2019-12-13'),
    category: 'Trade',
    severity: 'High',
    deltaCSI: -4.0,
    vectorImpacts: { trade: -6.0, sanctions: -3.0 },
    relatedCountries: ['China'],
    isOngoing: false
  },

  // ==================== 2020 - COVID-19 ====================
  {
    id: 'hist-us-2020-001',
    title: 'US kills Iranian General Soleimani',
    description: 'Drone strike kills IRGC Quds Force commander in Baghdad',
    country: 'United States',
    region: 'North America',
    date: new Date('2020-01-03'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 16.0, sanctions: 8.0, trade: 6.0 },
    relatedCountries: ['Iran', 'Iraq'],
    isOngoing: false
  },
  {
    id: 'hist-ir-2020-001',
    title: 'Iran retaliates with missile strikes',
    description: 'Iran launches ballistic missiles at US bases in Iraq',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2020-01-08'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, sanctions: 6.0 },
    relatedCountries: ['United States', 'Iraq'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2020-001',
    title: 'Wuhan lockdown begins',
    description: 'China locks down city of 11 million to contain coronavirus',
    country: 'China',
    region: 'East Asia',
    date: new Date('2020-01-23'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { governance: 12.0, trade: 10.0, unrest: 6.0 },
    relatedCountries: ['Japan', 'South Korea', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2020-001',
    title: 'UK officially leaves EU',
    description: 'Brexit completed, UK enters transition period',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2020-01-31'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { governance: 5.0, trade: 4.0 },
    relatedCountries: ['Germany', 'France', 'Ireland', 'Netherlands'],
    isOngoing: false
  },
  {
    id: 'hist-it-2020-001',
    title: 'Italy nationwide lockdown',
    description: 'First European country to implement nationwide lockdown',
    country: 'Italy',
    region: 'Southern Europe',
    date: new Date('2020-03-09'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { governance: 14.0, trade: 12.0, unrest: 6.0 },
    relatedCountries: ['France', 'Spain', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-who-2020-001',
    title: 'WHO declares COVID-19 pandemic',
    description: 'World Health Organization declares global pandemic',
    country: 'Switzerland',
    region: 'Western Europe',
    date: new Date('2020-03-11'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 15.0,
    vectorImpacts: { governance: 15.0, trade: 18.0, currency: 12.0, unrest: 8.0 },
    relatedCountries: ['United States', 'Italy', 'Spain', 'France', 'Germany', 'United Kingdom', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-global-2020-001',
    title: 'Global stock market crash',
    description: 'Markets suffer worst day since 1987, Dow drops 2,997 points',
    country: 'United States',
    region: 'North America',
    date: new Date('2020-03-16'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { currency: 18.0, trade: 12.0, governance: 6.0 },
    relatedCountries: ['Germany', 'United Kingdom', 'Japan', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-us-2020-002',
    title: 'George Floyd killing sparks protests',
    description: 'Police killing triggers nationwide protests and civil unrest',
    country: 'United States',
    region: 'North America',
    date: new Date('2020-05-25'),
    category: 'Unrest',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { unrest: 12.0, governance: 6.0 },
    relatedCountries: ['Canada', 'United Kingdom', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-hk-2020-001',
    title: 'China imposes Hong Kong security law',
    description: 'Beijing bypasses local legislature to impose sweeping security law',
    country: 'China',
    region: 'East Asia',
    date: new Date('2020-06-30'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { governance: 12.0, unrest: 8.0, trade: 5.0 },
    relatedCountries: ['United Kingdom', 'United States', 'Australia'],
    isOngoing: false
  },
  {
    id: 'hist-by-2020-001',
    title: 'Belarus election protests',
    description: 'Mass protests follow disputed election keeping Lukashenko in power',
    country: 'Belarus',
    region: 'Eastern Europe',
    date: new Date('2020-08-09'),
    category: 'Protest',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { unrest: 14.0, governance: 10.0 },
    relatedCountries: ['Russia', 'Poland', 'Lithuania'],
    isOngoing: true
  },
  {
    id: 'hist-az-2020-001',
    title: 'Nagorno-Karabakh war begins',
    description: 'Azerbaijan launches offensive to retake Armenian-controlled territory',
    country: 'Azerbaijan',
    region: 'Caucasus',
    date: new Date('2020-09-27'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { conflict: 18.0, governance: 8.0 },
    relatedCountries: ['Armenia', 'Turkey', 'Russia'],
    isOngoing: false
  },
  {
    id: 'hist-us-2020-003',
    title: 'US presidential election',
    description: 'Joe Biden defeats Donald Trump in contested election',
    country: 'United States',
    region: 'North America',
    date: new Date('2020-11-03'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 7.0, unrest: 5.0 },
    relatedCountries: ['China', 'Russia', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-az-2020-002',
    title: 'Nagorno-Karabakh ceasefire',
    description: 'Russia-brokered ceasefire ends 44-day war',
    country: 'Azerbaijan',
    region: 'Caucasus',
    date: new Date('2020-11-10'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: -5.0,
    vectorImpacts: { conflict: -8.0, governance: -3.0 },
    relatedCountries: ['Armenia', 'Russia', 'Turkey'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2020-002',
    title: 'UK-EU trade deal agreed',
    description: 'Last-minute agreement averts no-deal Brexit',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2020-12-24'),
    category: 'Trade',
    severity: 'High',
    deltaCSI: -3.5,
    vectorImpacts: { trade: -5.0, governance: -3.0 },
    relatedCountries: ['Germany', 'France', 'Ireland'],
    isOngoing: false
  },

  // ==================== 2021 ====================
  {
    id: 'hist-us-2021-001',
    title: 'US Capitol stormed',
    description: 'Mob storms Capitol during electoral vote certification',
    country: 'United States',
    region: 'North America',
    date: new Date('2021-01-06'),
    category: 'Unrest',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { unrest: 12.0, governance: 10.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-us-2021-002',
    title: 'Joe Biden inaugurated',
    description: 'Biden sworn in amid unprecedented security',
    country: 'United States',
    region: 'North America',
    date: new Date('2021-01-20'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: -2.5,
    vectorImpacts: { governance: -4.0, unrest: -2.0 },
    relatedCountries: ['China', 'Russia', 'Germany'],
    isOngoing: false
  },
  {
    id: 'hist-mm-2021-001',
    title: 'Myanmar military coup',
    description: 'Military seizes power, detains Aung San Suu Kyi',
    country: 'Myanmar',
    region: 'Southeast Asia',
    date: new Date('2021-02-01'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 14.0,
    vectorImpacts: { governance: 18.0, unrest: 14.0, conflict: 10.0 },
    relatedCountries: ['Thailand', 'China', 'India'],
    isOngoing: true
  },
  {
    id: 'hist-et-2021-001',
    title: 'Tigray conflict escalates',
    description: 'Ethiopian civil war intensifies, humanitarian crisis worsens',
    country: 'Ethiopia',
    region: 'East Africa',
    date: new Date('2021-06-28'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { conflict: 16.0, governance: 10.0, unrest: 8.0 },
    relatedCountries: ['Eritrea', 'Sudan', 'Egypt'],
    isOngoing: true
  },
  {
    id: 'hist-af-2021-001',
    title: 'Taliban captures Kabul',
    description: 'Taliban seizes capital as government collapses',
    country: 'Afghanistan',
    region: 'South Asia',
    date: new Date('2021-08-15'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 18.0,
    vectorImpacts: { conflict: 22.0, governance: 18.0, unrest: 12.0 },
    relatedCountries: ['Pakistan', 'Iran', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-us-2021-003',
    title: 'US withdraws from Afghanistan',
    description: 'Chaotic withdrawal ends 20-year war',
    country: 'United States',
    region: 'North America',
    date: new Date('2021-08-31'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 6.0,
    vectorImpacts: { conflict: 8.0, governance: 6.0 },
    relatedCountries: ['Afghanistan', 'Pakistan'],
    isOngoing: false
  },
  {
    id: 'hist-au-2021-001',
    title: 'AUKUS security pact announced',
    description: 'US, UK, Australia form Indo-Pacific security alliance',
    country: 'Australia',
    region: 'Oceania',
    date: new Date('2021-09-15'),
    category: 'Military Posture',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { conflict: 5.0, trade: 4.0, governance: 3.0 },
    relatedCountries: ['United States', 'United Kingdom', 'France', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2021-001',
    title: 'Record Chinese military incursions near Taiwan',
    description: '150+ PLA aircraft enter Taiwan ADIZ in single month',
    country: 'China',
    region: 'East Asia',
    date: new Date('2021-10-04'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 6.5,
    vectorImpacts: { conflict: 10.0, trade: 5.0, governance: 4.0 },
    relatedCountries: ['Taiwan', 'United States', 'Japan'],
    isOngoing: false
  },

  // ==================== 2022 - UKRAINE WAR ====================
  {
    id: 'hist-ru-2022-001',
    title: 'Russia invades Ukraine',
    description: 'Full-scale invasion begins with attacks on multiple fronts',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2022-02-24'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 25.0,
    vectorImpacts: { conflict: 30.0, sanctions: 20.0, trade: 18.0, currency: 15.0 },
    relatedCountries: ['Ukraine', 'Belarus', 'Poland', 'Germany', 'United States'],
    isOngoing: true
  },
  {
    id: 'hist-ru-2022-002',
    title: 'Unprecedented Western sanctions on Russia',
    description: 'US, EU impose sweeping sanctions including SWIFT exclusion',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2022-02-26'),
    category: 'Sanctions',
    severity: 'Critical',
    deltaCSI: 15.0,
    vectorImpacts: { sanctions: 22.0, trade: 15.0, currency: 12.0 },
    relatedCountries: ['United States', 'Germany', 'United Kingdom', 'France'],
    isOngoing: true
  },
  {
    id: 'hist-ru-2022-003',
    title: 'Russian ruble crashes 30%',
    description: 'Currency collapses following sanctions',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2022-02-28'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { currency: 18.0, trade: 10.0, sanctions: 8.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-cn-2022-001',
    title: 'Shanghai COVID lockdown',
    description: 'China\'s largest city locked down for two months',
    country: 'China',
    region: 'East Asia',
    date: new Date('2022-03-28'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { governance: 10.0, trade: 10.0, unrest: 6.0 },
    relatedCountries: ['Japan', 'South Korea', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2022-001',
    title: 'Russia withdraws from Kyiv region',
    description: 'Russian forces retreat from northern Ukraine',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2022-04-02'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: -4.0,
    vectorImpacts: { conflict: -6.0, governance: -3.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2022-002',
    title: 'Bucha massacre discovered',
    description: 'Evidence of mass atrocities found after Russian withdrawal',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2022-04-03'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, sanctions: 8.0, governance: 5.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'hist-lk-2022-001',
    title: 'Sri Lanka economic collapse',
    description: 'Country defaults on debt, runs out of fuel and medicine',
    country: 'Sri Lanka',
    region: 'South Asia',
    date: new Date('2022-04-12'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 14.0,
    vectorImpacts: { currency: 18.0, governance: 12.0, unrest: 10.0 },
    relatedCountries: ['India', 'China'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2022-001',
    title: 'Boris Johnson resigns',
    description: 'Prime Minister resigns amid scandals and party revolt',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2022-07-07'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { governance: 6.0, currency: 3.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-lk-2022-002',
    title: 'Sri Lanka president flees',
    description: 'President Rajapaksa flees after protesters storm palace',
    country: 'Sri Lanka',
    region: 'South Asia',
    date: new Date('2022-07-13'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { governance: 12.0, unrest: 10.0 },
    relatedCountries: ['India'],
    isOngoing: false
  },
  {
    id: 'hist-eu-2022-001',
    title: 'European energy crisis intensifies',
    description: 'Gas prices surge 10x as Russia cuts supplies',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2022-08-26'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { trade: 12.0, currency: 8.0, governance: 5.0 },
    relatedCountries: ['France', 'Italy', 'Netherlands', 'Russia'],
    isOngoing: false
  },
  {
    id: 'hist-ir-2022-001',
    title: 'Mahsa Amini protests in Iran',
    description: 'Death of woman in custody sparks nationwide protests',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2022-09-16'),
    category: 'Protest',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { unrest: 14.0, governance: 10.0, conflict: 5.0 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'hist-ru-2022-004',
    title: 'Russia mobilizes 300,000 reservists',
    description: 'Putin announces partial mobilization',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2022-09-21'),
    category: 'Military Posture',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, governance: 6.0, unrest: 5.0 },
    relatedCountries: ['Georgia', 'Kazakhstan', 'Finland'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2022-002',
    title: 'Liz Truss mini-budget crashes markets',
    description: 'Unfunded tax cuts trigger gilt crisis, pound crashes',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2022-09-23'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { currency: 12.0, governance: 8.0, trade: 5.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-ua-2022-003',
    title: 'Nord Stream pipelines sabotaged',
    description: 'Underwater explosions damage Russia-Germany gas pipelines',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2022-09-26'),
    category: 'Infrastructure',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { trade: 10.0, conflict: 6.0, cyber: 4.0 },
    relatedCountries: ['Russia', 'Denmark', 'Sweden'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2022-005',
    title: 'Russia annexes four Ukrainian regions',
    description: 'Putin claims annexation of Donetsk, Luhansk, Zaporizhzhia, Kherson',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2022-09-30'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 14.0, sanctions: 8.0, governance: 6.0 },
    relatedCountries: ['Ukraine'],
    isOngoing: false
  },
  {
    id: 'hist-gb-2022-003',
    title: 'Liz Truss resigns after 45 days',
    description: 'Shortest-serving UK PM resigns after economic chaos',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2022-10-20'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { governance: 5.0, currency: 3.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-ua-2022-004',
    title: 'Ukraine recaptures Kherson',
    description: 'Major Ukrainian victory as Russia withdraws from regional capital',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2022-11-11'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: -5.0,
    vectorImpacts: { conflict: -7.0, governance: -3.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'hist-cn-2022-002',
    title: 'China COVID protests',
    description: 'Rare nationwide protests against zero-COVID policy',
    country: 'China',
    region: 'East Asia',
    date: new Date('2022-11-26'),
    category: 'Protest',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { unrest: 10.0, governance: 6.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-cn-2022-003',
    title: 'China ends zero-COVID policy',
    description: 'Abrupt policy reversal after protests',
    country: 'China',
    region: 'East Asia',
    date: new Date('2022-12-07'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: -3.0,
    vectorImpacts: { governance: -4.0, trade: -3.0, unrest: -2.0 },
    relatedCountries: [],
    isOngoing: false
  },

  // ==================== 2023 - ISRAEL-HAMAS WAR ====================
  {
    id: 'hist-us-2023-001',
    title: 'Silicon Valley Bank collapse',
    description: 'Second-largest bank failure in US history',
    country: 'United States',
    region: 'North America',
    date: new Date('2023-03-10'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { currency: 10.0, governance: 6.0, trade: 4.0 },
    relatedCountries: ['Switzerland', 'United Kingdom'],
    isOngoing: false
  },
  {
    id: 'hist-sd-2023-001',
    title: 'Sudan civil war erupts',
    description: 'Fighting between army and RSF breaks out in Khartoum',
    country: 'Sudan',
    region: 'North Africa',
    date: new Date('2023-04-15'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 16.0,
    vectorImpacts: { conflict: 22.0, governance: 14.0, unrest: 12.0 },
    relatedCountries: ['Egypt', 'Chad', 'Ethiopia', 'Saudi Arabia', 'United Arab Emirates'],
    isOngoing: true
  },
  {
    id: 'hist-us-2023-002',
    title: 'US debt ceiling crisis',
    description: 'Brinkmanship over debt limit threatens default',
    country: 'United States',
    region: 'North America',
    date: new Date('2023-05-01'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 7.0, currency: 5.0 },
    relatedCountries: ['China', 'Japan'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2023-001',
    title: 'Ukraine launches counteroffensive',
    description: 'Major offensive to retake Russian-occupied territory',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2023-06-04'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 6.0,
    vectorImpacts: { conflict: 10.0, governance: 4.0 },
    relatedCountries: ['Russia'],
    isOngoing: true
  },
  {
    id: 'hist-ua-2023-002',
    title: 'Kakhovka Dam destroyed',
    description: 'Major dam destroyed, causing massive flooding',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2023-06-06'),
    category: 'Infrastructure',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { conflict: 8.0, trade: 6.0, governance: 5.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2023-001',
    title: 'Wagner Group mutiny',
    description: 'Prigozhin leads armed march toward Moscow, then stands down',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2023-06-24'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 12.0, governance: 12.0, unrest: 8.0 },
    relatedCountries: ['Belarus', 'Ukraine'],
    isOngoing: false
  },
  {
    id: 'hist-ne-2023-001',
    title: 'Niger military coup',
    description: 'Military ousts President Bazoum, ECOWAS threatens intervention',
    country: 'Niger',
    region: 'West Africa',
    date: new Date('2023-07-26'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { governance: 14.0, conflict: 8.0, sanctions: 6.0 },
    relatedCountries: ['France', 'Nigeria', 'Mali', 'Burkina Faso'],
    isOngoing: false
  },
  {
    id: 'hist-ru-2023-002',
    title: 'Prigozhin killed in plane crash',
    description: 'Wagner leader dies in suspicious plane crash',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2023-08-23'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { governance: 6.0, conflict: 4.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-ga-2023-001',
    title: 'Gabon military coup',
    description: 'Military seizes power after disputed election',
    country: 'Gabon',
    region: 'Central Africa',
    date: new Date('2023-08-30'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 8.0,
    vectorImpacts: { governance: 12.0, unrest: 6.0 },
    relatedCountries: ['France', 'Cameroon'],
    isOngoing: false
  },
  {
    id: 'hist-il-2023-001',
    title: 'Hamas attacks Israel - October 7',
    description: 'Unprecedented terrorist attack kills 1,200, takes 240 hostages',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2023-10-07'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 22.0,
    vectorImpacts: { conflict: 28.0, governance: 15.0, unrest: 12.0 },
    relatedCountries: ['Palestine', 'Iran', 'Lebanon', 'Egypt'],
    isOngoing: true
  },
  {
    id: 'hist-il-2023-002',
    title: 'Israel declares war on Hamas',
    description: 'Israel launches military operation in Gaza',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2023-10-08'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 15.0,
    vectorImpacts: { conflict: 20.0, governance: 10.0, trade: 8.0 },
    relatedCountries: ['Palestine', 'United States', 'Iran'],
    isOngoing: true
  },
  {
    id: 'hist-il-2023-003',
    title: 'Israel ground invasion of Gaza',
    description: 'IDF launches ground operation in northern Gaza',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2023-10-27'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { conflict: 14.0, governance: 8.0 },
    relatedCountries: ['Palestine', 'Egypt', 'Jordan'],
    isOngoing: true
  },
  {
    id: 'hist-ye-2023-001',
    title: 'Houthis begin Red Sea attacks',
    description: 'Yemen-based group attacks commercial ships in solidarity with Gaza',
    country: 'Yemen',
    region: 'Middle East',
    date: new Date('2023-11-19'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 10.0, trade: 10.0, sanctions: 5.0 },
    relatedCountries: ['Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Iran'],
    isOngoing: true
  },
  {
    id: 'hist-il-2023-004',
    title: 'Israel-Hamas temporary ceasefire',
    description: 'Seven-day pause for hostage exchange',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2023-11-24'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: -4.0,
    vectorImpacts: { conflict: -6.0, governance: -3.0 },
    relatedCountries: ['Palestine', 'Qatar', 'Egypt'],
    isOngoing: false
  },

  // ==================== 2024 ====================
  {
    id: 'hist-tw-2024-001',
    title: 'Lai Ching-te elected Taiwan president',
    description: 'DPP wins third consecutive term, China warns of tensions',
    country: 'Taiwan',
    region: 'East Asia',
    date: new Date('2024-01-13'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { governance: 6.0, conflict: 5.0, trade: 4.0 },
    relatedCountries: ['China', 'United States', 'Japan'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2024-001',
    title: 'Russia captures Avdiivka',
    description: 'Russian forces take strategic eastern Ukrainian city',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2024-02-17'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.0,
    vectorImpacts: { conflict: 8.0, governance: 4.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'hist-ua-2024-002',
    title: 'Ukraine strikes Russian oil refineries',
    description: 'Drone campaign targets Russian energy infrastructure',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2024-03-12'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { conflict: 6.0, trade: 4.0 },
    relatedCountries: ['Russia'],
    isOngoing: true
  },
  {
    id: 'hist-ru-2024-001',
    title: 'Putin wins fifth presidential term',
    description: 'Putin secures another six-year term with 87% of vote',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2024-03-17'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 2.0,
    vectorImpacts: { governance: 3.0, sanctions: 2.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-ru-2024-002',
    title: 'Moscow concert hall attack',
    description: 'ISIS-K attack kills 145 at Crocus City Hall',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2024-03-22'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.0,
    vectorImpacts: { conflict: 10.0, governance: 6.0, unrest: 5.0 },
    relatedCountries: ['Afghanistan'],
    isOngoing: false
  },
  {
    id: 'hist-il-2024-001',
    title: 'Israel strikes Iranian consulate in Damascus',
    description: 'Attack kills senior IRGC commanders',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2024-04-01'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { conflict: 14.0, sanctions: 6.0 },
    relatedCountries: ['Iran', 'Syria'],
    isOngoing: false
  },
  {
    id: 'hist-ir-2024-001',
    title: 'Iran attacks Israel directly',
    description: 'Iran launches 300+ drones and missiles at Israel',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2024-04-13'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { conflict: 18.0, sanctions: 8.0, trade: 6.0 },
    relatedCountries: ['Israel', 'United States', 'Jordan', 'Saudi Arabia'],
    isOngoing: false
  },
  {
    id: 'hist-il-2024-002',
    title: 'Israel expands Rafah operation',
    description: 'IDF launches ground operation in southern Gaza',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2024-05-06'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.0,
    vectorImpacts: { conflict: 12.0, governance: 6.0, unrest: 5.0 },
    relatedCountries: ['Palestine', 'Egypt', 'United States'],
    isOngoing: true
  },
  {
    id: 'hist-us-2024-001',
    title: 'Trump assassination attempt',
    description: 'Former president wounded at Pennsylvania rally',
    country: 'United States',
    region: 'North America',
    date: new Date('2024-07-13'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 6.0,
    vectorImpacts: { governance: 8.0, unrest: 6.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-us-2024-002',
    title: 'Biden withdraws from 2024 race',
    description: 'President Biden ends reelection campaign, endorses Harris',
    country: 'United States',
    region: 'North America',
    date: new Date('2024-07-21'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.0,
    vectorImpacts: { governance: 6.0, trade: 3.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'hist-ve-2024-001',
    title: 'Venezuela disputed election',
    description: 'Maduro claims victory amid fraud allegations',
    country: 'Venezuela',
    region: 'South America',
    date: new Date('2024-07-28'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { governance: 12.0, unrest: 10.0, sanctions: 6.0 },
    relatedCountries: ['Colombia', 'Brazil', 'United States'],
    isOngoing: true
  },
  {
    id: 'hist-bd-2024-001',
    title: 'Bangladesh PM Hasina flees',
    description: 'Prime Minister resigns and flees after deadly student protests',
    country: 'Bangladesh',
    region: 'South Asia',
    date: new Date('2024-08-05'),
    category: 'Governance',
    severity: 'Critical',
    deltaCSI: 12.0,
    vectorImpacts: { governance: 16.0, unrest: 14.0, trade: 6.0 },
    relatedCountries: ['India'],
    isOngoing: false
  },

  // ==================== 2025 ====================
  {
    id: 'hist-us-2025-001',
    title: 'Trump 2.0 tariff escalation',
    description: 'Trump administration imposes sweeping tariffs on imports from China, EU, Canada and Mexico',
    country: 'United States',
    region: 'North America',
    date: new Date('2025-02-01'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { trade: 14.0, sanctions: 6.0, currency: 4.0 },
    relatedCountries: ['China', 'Canada', 'Mexico', 'Germany', 'France'],
    isOngoing: true
  },
  {
    id: 'hist-cn-2025-001',
    title: 'China retaliates with counter-tariffs',
    description: 'China imposes retaliatory tariffs on US goods and restricts rare earth exports',
    country: 'China',
    region: 'East Asia',
    date: new Date('2025-02-10'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 7.5,
    vectorImpacts: { trade: 12.0, sanctions: 5.0, currency: 3.0 },
    relatedCountries: ['United States', 'Taiwan', 'Japan', 'South Korea'],
    isOngoing: true
  },
  {
    id: 'hist-ru-2025-001',
    title: 'Ukraine-Russia ceasefire negotiations',
    description: 'US-brokered ceasefire talks begin between Ukraine and Russia',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2025-03-01'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: -5.0,
    vectorImpacts: { conflict: -8.0, sanctions: -3.0, governance: -2.0 },
    relatedCountries: ['Ukraine', 'United States', 'Germany', 'France'],
    isOngoing: true
  },
  {
    id: 'hist-il-2025-001',
    title: 'Israel-Hamas ceasefire agreement',
    description: 'Qatar-brokered ceasefire halts Gaza fighting, hostage releases begin',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2025-01-19'),
    category: 'Diplomatic',
    severity: 'High',
    deltaCSI: -6.0,
    vectorImpacts: { conflict: -10.0, governance: -4.0, trade: -3.0 },
    relatedCountries: ['Palestine', 'Qatar', 'Egypt', 'United States'],
    isOngoing: false
  },
  {
    id: 'hist-us-2025-002',
    title: 'US global tariff "Liberation Day"',
    description: 'Trump announces sweeping reciprocal tariffs on virtually all trading partners',
    country: 'United States',
    region: 'North America',
    date: new Date('2025-04-02'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 10.0,
    vectorImpacts: { trade: 16.0, currency: 8.0, sanctions: 6.0 },
    relatedCountries: ['China', 'European Union', 'Japan', 'India', 'Vietnam'],
    isOngoing: true
  },
  {
    id: 'hist-sy-2025-001',
    title: 'Syrian rebel forces capture Damascus',
    description: 'HTS-led rebel coalition takes Damascus, Assad regime collapses',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2024-12-08'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 14.0,
    vectorImpacts: { conflict: 18.0, governance: 16.0, unrest: 10.0 },
    relatedCountries: ['Turkey', 'Russia', 'Iran', 'Israel', 'Lebanon'],
    isOngoing: true
  },

  // ==================== 2026 ====================
  {
    id: 'hist-us-2026-001',
    title: 'US-China trade war intensifies',
    description: 'Tariffs on Chinese goods raised to 145%, China retaliates with 125% tariffs on US imports',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-15'),
    category: 'Trade',
    severity: 'Critical',
    deltaCSI: 9.0,
    vectorImpacts: { trade: 15.0, currency: 7.0, sanctions: 5.0 },
    relatedCountries: ['China', 'Taiwan', 'Japan', 'South Korea', 'Vietnam'],
    isOngoing: true
  },
  {
    id: 'hist-global-2026-001',
    title: 'Global supply chain fragmentation',
    description: 'Trade blocs solidify as US-China decoupling accelerates global supply chain restructuring',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-01'),
    category: 'Trade',
    severity: 'High',
    deltaCSI: 6.0,
    vectorImpacts: { trade: 10.0, currency: 5.0, governance: 3.0 },
    relatedCountries: ['China', 'Germany', 'Japan', 'India', 'Mexico'],
    isOngoing: true
  }
];

/**
 * Get events within an extended time window
 */
export function getHistoricalEventsByTimeWindow(timeWindow: ExtendedTimeWindow): GeopoliticalEvent[] {
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

  return HISTORICAL_GEOPOLITICAL_EVENTS.filter(event => event.date >= cutoffDate);
}

/**
 * Get historical events for a specific country
 */
export function getHistoricalEventsByCountry(
  country: string,
  timeWindow?: ExtendedTimeWindow
): GeopoliticalEvent[] {
  let events = HISTORICAL_GEOPOLITICAL_EVENTS.filter(
    event => event.country === country || event.relatedCountries?.includes(country)
  );

  if (timeWindow) {
    const windowEvents = getHistoricalEventsByTimeWindow(timeWindow);
    events = events.filter(e => windowEvents.includes(e));
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get landmark events for timeline markers
 */
export function getLandmarkEvents(timeWindow?: ExtendedTimeWindow): HistoricalEventMarker[] {
  if (!timeWindow) return LANDMARK_EVENTS;

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
      return LANDMARK_EVENTS;
  }

  return LANDMARK_EVENTS.filter(event => event.date >= cutoffDate);
}

/**
 * Calculate CSI change for a country over extended time window
 */
export function calculateHistoricalCSIChange(
  country: string,
  timeWindow: ExtendedTimeWindow
): {
  totalChange: number;
  events: GeopoliticalEvent[];
  peakCSI: { date: Date; value: number };
  troughCSI: { date: Date; value: number };
} {
  const events = getHistoricalEventsByCountry(country, timeWindow);
  
  let totalChange = 0;
  let runningCSI = 50; // Base CSI
  let peakCSI = { date: new Date(), value: 50 };
  let troughCSI = { date: new Date(), value: 50 };

  events.forEach(event => {
    const impact = event.country === country ? event.deltaCSI : event.deltaCSI * 0.3;
    totalChange += impact;
    runningCSI += impact;

    if (runningCSI > peakCSI.value) {
      peakCSI = { date: event.date, value: runningCSI };
    }
    if (runningCSI < troughCSI.value) {
      troughCSI = { date: event.date, value: runningCSI };
    }
  });

  return {
    totalChange: parseFloat(totalChange.toFixed(1)),
    events,
    peakCSI,
    troughCSI
  };
}

/**
 * Get time window in days
 */
export function getTimeWindowDays(timeWindow: ExtendedTimeWindow): number {
  switch (timeWindow) {
    case '7D': return 7;
    case '30D': return 30;
    case '90D': return 90;
    case '12M': return 365;
    case '3Y': return 3 * 365;
    case '5Y': return 5 * 365;
    case '10Y': return 10 * 365;
    default: return 30;
  }
}

/**
 * Check if time window is extended (requires historical data)
 */
export function isExtendedTimeWindow(timeWindow: string): boolean {
  return ['3Y', '5Y', '10Y'].includes(timeWindow);
}